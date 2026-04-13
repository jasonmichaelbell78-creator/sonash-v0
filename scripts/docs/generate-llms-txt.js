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

function extractSummary(claudeMd) {
  // Look for first non-heading paragraph after "## Purpose" or first H2.
  const lines = claudeMd.split(/\r?\n/);
  let inPurpose = false;
  let collected = [];
  for (const line of lines) {
    if (/^##\s+Purpose\b/i.test(line)) {
      inPurpose = true;
      continue;
    }
    if (inPurpose) {
      if (/^#{1,6}\s/.test(line)) break;
      if (line.trim() && !line.startsWith(">") && !line.startsWith("<!--")) {
        collected.push(line.trim());
      } else if (collected.length > 0) {
        break;
      }
    }
  }
  const summary = collected.join(" ").replace(/\s+/g, " ");
  if (summary.length > 0) return summary;
  // Fallback: first non-frontmatter paragraph
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith("**") || trimmed.startsWith("<!--")) continue;
    if (trimmed.startsWith(">")) continue;
    return trimmed;
  }
  return "";
}

function extractFrontmatter(text) {
  // YAML frontmatter between --- ... --- at the top. Supports simple scalars
  // AND YAML folded ">-" / literal "|" multi-line values (indented
  // continuation lines).
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  const fmLines = m[1].split(/\r?\n/);
  let i = 0;
  while (i < fmLines.length) {
    const line = fmLines[i];
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1];
    let val = kv[2].trim();
    if (val === ">-" || val === ">" || val === "|" || val === "|-") {
      // Folded/literal scalar — collect indented continuation lines
      i++;
      const parts = [];
      while (i < fmLines.length && /^\s+\S/.test(fmLines[i])) {
        parts.push(fmLines[i].trim());
        i++;
      }
      fm[key] = parts.join(val === "|" || val === "|-" ? "\n" : " ").trim();
      continue;
    }
    fm[key] = val;
    i++;
  }
  return fm;
}

function extractSkillDescription(skillMd) {
  // 1. Frontmatter `description:` field (stripped of YAML indentation)
  const fm = extractFrontmatter(skillMd);
  if (fm && fm.description) return cleanDesc(fm.description);
  // 2. First line after the first H1
  const lines = skillMd.split(/\r?\n/);
  let afterH1 = false;
  for (const line of lines) {
    if (/^#\s/.test(line)) {
      afterH1 = true;
      continue;
    }
    if (afterH1) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("<!--") || trimmed.startsWith(">") || trimmed.startsWith("**"))
        continue;
      if (/^#{1,6}\s/.test(trimmed)) break;
      return cleanDesc(trimmed);
    }
  }
  return "";
}

function cleanDesc(s) {
  return String(s)
    .replace(/\s+/g, " ")
    .replace(/^["']|["']$/g, "")
    .trim()
    .slice(0, 240);
}

function getSkillName(skillDir, skillMd) {
  const fm = extractFrontmatter(skillMd);
  if (fm && fm.name) return fm.name;
  // First H1
  const m = skillMd.match(/^#\s+(.+)$/m);
  if (m) return m[1].replace(/^\/?/, "").trim();
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
        path: path.relative(ROOT, skillMdPath).replace(/\\/g, "/"),
      });
    } catch {
      // skip unreadable
    }
  }
  skills.sort((a, b) => a.dir.localeCompare(b.dir));
  return skills;
}

function main() {
  // safeReadText used for side effect: ensures CLAUDE.md exists and is readable.
  safeReadText(path.join(ROOT, "CLAUDE.md"));
  const skills = listSkills();

  const lines = [];
  lines.push("# SoNash");
  lines.push("");
  lines.push(
    "> Sober Nashville — a privacy-first, evidence-based recovery notebook for the sobriety community. Built on Next.js 16, React 19, Firebase 12, with a comprehensive AI-agent development framework (CLAUDE.md + skill system) that doubles as meta-tooling research for JASON-OS (a portable Claude Code OS)."
  );
  lines.push("");
  lines.push(
    "This repository combines a production web application with a meta-tooling platform (JASON-OS research) for Claude Code skills, agents, and hooks. The content below is optimized for AI-agent discovery per the llms.txt standard (Jeremy Howard, 2024-09)."
  );
  lines.push("");

  // Core docs section
  lines.push("## Core documentation");
  lines.push("");
  lines.push(
    "- [CLAUDE.md](CLAUDE.md): behavioral guardrails, stack versions, anti-patterns, and agent/skill triggers — loaded on every AI turn"
  );
  lines.push("- [ROADMAP.md](ROADMAP.md): canonical product roadmap for SoNash");
  lines.push("- [SESSION_CONTEXT.md](SESSION_CONTEXT.md): current sprint + recent session context");
  lines.push("- [AI_WORKFLOW.md](AI_WORKFLOW.md): session startup and navigation patterns");
  lines.push(
    "- [.claude/skills/shared/CONVENTIONS.md](.claude/skills/shared/CONVENTIONS.md): shared skill conventions (handler output contract, tagging, pipeline tail)"
  );
  lines.push("");

  // Skills section
  lines.push(`## Skills (${skills.length})`);
  lines.push("");
  lines.push(
    "Each skill is a self-contained command invokable via `/skill-name`. SKILL.md defines the contract; REFERENCE.md (where present) expands specification."
  );
  lines.push("");
  for (const s of skills) {
    const desc = s.description ? `: ${s.description}` : "";
    lines.push(`- [/${s.dir}](${s.path})${desc}`);
  }
  lines.push("");

  // Research artifacts section
  lines.push("## Research & analysis artifacts");
  lines.push("");
  lines.push(
    "- [.research/EXTRACTIONS.md](.research/EXTRACTIONS.md): auto-generated candidate index across all analyzed sources"
  );
  lines.push(
    "- [.research/analysis/synthesis/synthesis.md](.research/analysis/synthesis/synthesis.md): cross-source synthesis (themes, gaps, reading chain, opportunity matrix)"
  );
  lines.push(
    "- [.research/extraction-journal.jsonl](.research/extraction-journal.jsonl): per-candidate decisions (defer/extract/skip/investigate)"
  );
  lines.push(
    "- [.research/research-index.jsonl](.research/research-index.jsonl): deep-research topic index"
  );
  lines.push("");

  // Scripts section
  lines.push("## Scripts entry points");
  lines.push("");
  lines.push(
    "- [scripts/cas/](scripts/cas/): Content Analysis System tooling (self-audit, rebuild-index, recall, etc.)"
  );
  lines.push(
    "- [scripts/lib/](scripts/lib/): shared safety helpers (sanitize-error, path-traversal guards, JSONL parsing)"
  );
  lines.push("- [scripts/reviews/](scripts/reviews/): PR review lifecycle + learning system");
  lines.push("- [scripts/debt/](scripts/debt/): Tech Debt Management System (TDMS)");
  lines.push("");

  lines.push("## Source");
  lines.push("");
  lines.push(
    `- Auto-generated by [scripts/docs/generate-llms-txt.js](scripts/docs/generate-llms-txt.js) on ${new Date().toISOString().slice(0, 10)}`
  );
  lines.push(`- Regenerate: \`node scripts/docs/generate-llms-txt.js\``);
  lines.push("");

  const content = lines.join("\n");
  safeAtomicWriteSync(OUT_PATH, content, { encoding: "utf8" });
  console.log(
    `Wrote ${OUT_PATH} (${content.length} bytes, ${skills.length} skills, ${lines.length} lines)`
  );
}

main();
