#!/usr/bin/env node
/**
 * Generate /llms.txt at repo root per the llmstxt.org spec.
 *
 * Inputs:
 *   - CLAUDE.md           (project title + top-level summary)
 *   - .claude/skills/SLUG/SKILL.md  (each skill's name + description)
 *
 * Output:
 *   - /llms.txt           (concise index; < ~10 KB target)
 *
 * Spec reference: https://llmstxt.org (Jeremy Howard, 2024-09).
 * Adopted as T29 Wave 5 Opportunity #1 (evidence: docs-composio-dev).
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { safeReadText } = require("../lib/safe-cas-io.js");
const { safeAtomicWriteSync } = require("../lib/safe-fs.js");

const ROOT = path.resolve(__dirname, "..", "..");
const SKILLS_DIR = path.join(ROOT, ".claude", "skills");
const OUT_PATH = path.join(ROOT, "llms.txt");

const FOLDED_SCALAR_MARKERS = new Set([">-", ">", "|", "|-"]);

function isIgnoredPurposeLine(trimmed) {
  return trimmed.startsWith(">") || trimmed.startsWith("<!--");
}

function collectPurposeLines(lines) {
  const collected = [];
  let inPurpose = false;
  for (const line of lines) {
    if (/^##\s+Purpose\b/i.test(line)) {
      inPurpose = true;
      continue;
    }
    if (!inPurpose) continue;
    if (/^#{1,6}\s/.test(line)) break;
    const trimmed = line.trim();
    if (trimmed && !isIgnoredPurposeLine(trimmed)) {
      collected.push(trimmed);
    } else if (collected.length > 0) {
      break;
    }
  }
  return collected;
}

function firstFallbackParagraph(lines) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith("**") || trimmed.startsWith("<!--")) continue;
    if (trimmed.startsWith(">")) continue;
    return trimmed;
  }
  return "";
}

function extractSummary(claudeMd) {
  const lines = claudeMd.split(/\r?\n/);
  const collected = collectPurposeLines(lines);
  const summary = collected.join(" ").replaceAll(/\s+/g, " ");
  if (summary.length > 0) return summary;
  return firstFallbackParagraph(lines);
}

// Split "key: value" without an unbounded regex. Returns null if the line is
// not a valid frontmatter key/value pair.
function splitFmKeyValue(line) {
  const colonIdx = line.indexOf(":");
  if (colonIdx < 1) return null;
  const key = line.slice(0, colonIdx);
  if (!/^\w+$/.test(key)) return null;
  return { key, rawVal: line.slice(colonIdx + 1).trim() };
}

// Consume indented continuation lines for folded/literal YAML scalars.
function readFoldedScalar(fmLines, startIdx, marker) {
  const isLiteral = marker === "|" || marker === "|-";
  const parts = [];
  let i = startIdx;
  while (i < fmLines.length && /^\s+\S/.test(fmLines[i])) {
    parts.push(fmLines[i].trim());
    i++;
  }
  return { value: parts.join(isLiteral ? "\n" : " ").trim(), nextIdx: i };
}

// Parse YAML frontmatter between leading "---" delimiters. Uses indexOf rather
// than an unbounded regex to avoid ReDoS exposure on untrusted input.
function extractFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const firstNl = text.indexOf("\n");
  if (firstNl < 0) return null;
  const closeIdx = text.indexOf("\n---", firstNl);
  if (closeIdx < 0) return null;
  const body = text.slice(firstNl + 1, closeIdx);
  const fm = {};
  const fmLines = body.split(/\r?\n/);
  let i = 0;
  while (i < fmLines.length) {
    const kv = splitFmKeyValue(fmLines[i]);
    if (!kv) {
      i++;
      continue;
    }
    if (FOLDED_SCALAR_MARKERS.has(kv.rawVal)) {
      const { value, nextIdx } = readFoldedScalar(fmLines, i + 1, kv.rawVal);
      fm[kv.key] = value;
      i = nextIdx;
      continue;
    }
    fm[kv.key] = kv.rawVal;
    i++;
  }
  return fm;
}

function isIgnoredSkillFallbackLine(trimmed) {
  return trimmed.startsWith("<!--") || trimmed.startsWith(">") || trimmed.startsWith("**");
}

function findSkillFallbackDescription(lines) {
  let afterH1 = false;
  for (const line of lines) {
    if (/^#\s/.test(line)) {
      afterH1 = true;
      continue;
    }
    if (!afterH1) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (isIgnoredSkillFallbackLine(trimmed)) continue;
    if (/^#{1,6}\s/.test(trimmed)) return "";
    return trimmed;
  }
  return "";
}

function extractSkillDescription(skillMd) {
  const fm = extractFrontmatter(skillMd);
  if (fm?.description) return cleanDesc(fm.description);
  const lines = skillMd.split(/\r?\n/);
  const fallback = findSkillFallbackDescription(lines);
  return fallback ? cleanDesc(fallback) : "";
}

function cleanDesc(s) {
  return String(s)
    .replaceAll(/\s+/g, " ")
    .replaceAll(/^["']|["']$/g, "")
    .trim()
    .slice(0, 240);
}

// Find the body text of the first H1 heading by scanning lines directly —
// avoids an unbounded regex with ReDoS exposure on untrusted skill markdown.
function findFirstH1Body(skillMd) {
  for (const line of skillMd.split(/\r?\n/)) {
    if (/^#\s+\S/.test(line)) {
      return line.replace(/^#\s+/, "").trim();
    }
  }
  return "";
}

function getSkillName(skillDir, skillMd) {
  const fm = extractFrontmatter(skillMd);
  if (fm?.name) return fm.name;
  const h1 = findFirstH1Body(skillMd);
  if (h1) return h1.replace(/^\/?/, "").trim();
  return path.basename(skillDir);
}

function listSkills() {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("_")) continue; // _shared
    const skillMdPath = path.join(SKILLS_DIR, e.name, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) continue;
    try {
      const text = safeReadText(skillMdPath);
      skills.push({
        dir: e.name,
        name: getSkillName(e.name, text),
        description: extractSkillDescription(text),
        path: path.relative(ROOT, skillMdPath).replaceAll("\\", "/"),
      });
    } catch {
      // skip unreadable
    }
  }
  skills.sort((a, b) => a.dir.localeCompare(b.dir));
  return skills;
}

function buildHeaderLines() {
  return [
    "# SoNash",
    "",
    "> Sober Nashville — a privacy-first, evidence-based recovery notebook for the sobriety community. Built on Next.js 16, React 19, Firebase 12, with a comprehensive AI-agent development framework (CLAUDE.md + skill system) that doubles as meta-tooling research for JASON-OS (a portable Claude Code OS).",
    "",
    "This repository combines a production web application with a meta-tooling platform (JASON-OS research) for Claude Code skills, agents, and hooks. The content below is optimized for AI-agent discovery per the llms.txt standard (Jeremy Howard, 2024-09).",
    "",
  ];
}

function buildCoreDocsLines() {
  return [
    "## Core documentation",
    "",
    "- [CLAUDE.md](CLAUDE.md): behavioral guardrails, stack versions, anti-patterns, and agent/skill triggers — loaded on every AI turn",
    "- [ROADMAP.md](ROADMAP.md): canonical product roadmap for SoNash",
    "- [SESSION_CONTEXT.md](SESSION_CONTEXT.md): current sprint + recent session context",
    "- [AI_WORKFLOW.md](AI_WORKFLOW.md): session startup and navigation patterns",
    "- [.claude/skills/shared/CONVENTIONS.md](.claude/skills/shared/CONVENTIONS.md): shared skill conventions (handler output contract, tagging, pipeline tail)",
    "",
  ];
}

function buildSkillsLines(skills) {
  const lines = [
    `## Skills (${skills.length})`,
    "",
    "Each skill is a self-contained command invokable via `/skill-name`. SKILL.md defines the contract; REFERENCE.md (where present) expands specification.",
    "",
  ];
  for (const s of skills) {
    const desc = s.description ? `: ${s.description}` : "";
    lines.push(`- [/${s.dir}](${s.path})${desc}`);
  }
  lines.push("");
  return lines;
}

function buildResearchLines() {
  return [
    "## Research & analysis artifacts",
    "",
    "- [.research/EXTRACTIONS.md](.research/EXTRACTIONS.md): auto-generated candidate index across all analyzed sources",
    "- [.research/analysis/synthesis/synthesis.md](.research/analysis/synthesis/synthesis.md): cross-source synthesis (themes, gaps, reading chain, opportunity matrix)",
    "- [.research/extraction-journal.jsonl](.research/extraction-journal.jsonl): per-candidate decisions (defer/extract/skip/investigate)",
    "- [.research/research-index.jsonl](.research/research-index.jsonl): deep-research topic index",
    "",
  ];
}

function buildScriptsLines() {
  return [
    "## Scripts entry points",
    "",
    "- [scripts/cas/](scripts/cas/): Content Analysis System tooling (self-audit, rebuild-index, recall, etc.)",
    "- [scripts/lib/](scripts/lib/): shared safety helpers (sanitize-error, path-traversal guards, JSONL parsing)",
    "- [scripts/reviews/](scripts/reviews/): PR review lifecycle + learning system",
    "- [scripts/debt/](scripts/debt/): Tech Debt Management System (TDMS)",
    "",
  ];
}

function buildSourceLines() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "## Source",
    "",
    `- Auto-generated by [scripts/docs/generate-llms-txt.js](scripts/docs/generate-llms-txt.js) on ${today}`,
    "- Regenerate: `node scripts/docs/generate-llms-txt.js`",
    "",
  ];
}

function main() {
  // safeReadText used for side effect: ensures CLAUDE.md exists and is readable.
  safeReadText(path.join(ROOT, "CLAUDE.md"));
  const skills = listSkills();

  const lines = [
    ...buildHeaderLines(),
    ...buildCoreDocsLines(),
    ...buildSkillsLines(skills),
    ...buildResearchLines(),
    ...buildScriptsLines(),
    ...buildSourceLines(),
  ];

  const content = lines.join("\n");
  safeAtomicWriteSync(OUT_PATH, content, { encoding: "utf8" });
  console.log(
    `Wrote ${OUT_PATH} (${content.length} bytes, ${skills.length} skills, ${lines.length} lines)`
  );
}

module.exports = {
  extractSummary,
  extractFrontmatter,
  extractSkillDescription,
  getSkillName,
  cleanDesc,
  listSkills,
};

if (require.main === module) {
  main();
}
