#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef -- Standalone Node hook intentionally uses CommonJS and process globals. */
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const PROTECTED_BRANCHES = new Set(["main", "master"]);
const GIT_MUTATIONS = new Set([
  "commit",
  "merge",
  "rebase",
  "cherry-pick",
  "revert",
  "reset",
  "pull",
]);

function commandSegments(command) {
  return command
    .replaceAll("&&", ";")
    .replaceAll("||", ";")
    .replaceAll("|", ";")
    .replaceAll("\n", ";")
    .split(";")
    .map((segment) =>
      segment
        .replaceAll("\t", " ")
        .split(" ")
        .map((token) => token.replaceAll('"', "").replaceAll("'", "").trim().toLowerCase())
        .filter(Boolean)
    )
    .filter((tokens) => tokens.length > 0);
}

function gitCommands(command) {
  return commandSegments(command)
    .map((tokens) => {
      const gitIndex = tokens.indexOf("git");
      return gitIndex === -1 ? [] : tokens.slice(gitIndex + 1);
    })
    .filter((tokens) => tokens.length > 0);
}

function targetsProtectedBranch(tokens) {
  return tokens.some(
    (token) =>
      PROTECTED_BRANCHES.has(token) ||
      [...PROTECTED_BRANCHES].some(
        (branch) => token.endsWith(`/${branch}`) || token.endsWith(`:${branch}`)
      )
  );
}

function emit(output) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

function allow(message) {
  emit(message ? { continue: true, systemMessage: message } : { continue: true });
}

function deny(reason) {
  emit({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    allow("Codex direct-main guard could not parse hook input; no command was evaluated.");
    return null;
  }
}

function currentBranch(cwd) {
  try {
    return execFileSync("git", ["-C", cwd, "branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const input = readInput();
if (!input || input.tool_name !== "Bash") {
  process.exit(0);
}

const command = input.tool_input?.command;
if (typeof command !== "string" || command.trim() === "") {
  process.exit(0);
}

const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd();
const branch = currentBranch(cwd);
const commands = gitCommands(command);
const pushesMain = commands.some(
  (tokens) => tokens.includes("push") && targetsProtectedBranch(tokens)
);

if (pushesMain) {
  deny(
    "Direct pushes to protected branch main are blocked. Use a reviewed branch and explicit publication workflow."
  );
  process.exit(0);
}

const mutatesRepository = commands.some((tokens) =>
  tokens.some((token) => GIT_MUTATIONS.has(token))
);

if (PROTECTED_BRANCHES.has(branch) && mutatesRepository) {
  deny(
    `Mutating Git command blocked on protected branch ${branch}. Switch to a working branch first.`
  );
  process.exit(0);
}

allow();
