#!/usr/bin/env node
/* global __dirname */
/**
 * Extract JSONL findings from agent output files.
 * Usage: node scripts/multi-ai/extract-agent-findings.js <output-file> <dest-jsonl>
 */
const fs = require("fs");
const path = require("path");

const outputFile = process.argv[2];
const destFile = process.argv[3];

if (!outputFile || !destFile) {
  console.error("Usage: node extract-agent-findings.js <output-file> <dest-jsonl>");
  process.exit(1);
}

// FIX 1: Replace hardcoded Windows path with dynamic project root resolution.
// Previously: const ROOT_PREFIX = "C:\\Users\\jason\\Workspace\\dev-projects\\sonash-v0\\"
// This leaked PII (username) and only worked on one developer's Windows machine.
const projectRoot = path.resolve(__dirname, "../../");
const ROOT_PREFIX = projectRoot + path.sep;

// FIX 2: Validate CLI paths to prevent path traversal (CWE-22, OWASP A01:2021).
// Resolve both paths and ensure they stay within the project root.
function validateContainedPath(inputPath, root) {
  const resolved = path.resolve(root, inputPath);
  const rel = path.relative(root, resolved);
  if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    console.error(`Error: path "${inputPath}" resolves outside the project root.`);
    process.exit(1);
  }
  return resolved;
}

const safeOutputFile = validateContainedPath(outputFile, projectRoot);
const safeDestFile = validateContainedPath(destFile, projectRoot);

// FIX 3: Wrap readFileSync in try/catch with actionable error message.
// Previously bare readFileSync would throw an unhandled exception on missing files,
// crashing CI with a raw stack trace instead of a helpful message.
let content;
try {
  content = fs.readFileSync(safeOutputFile, "utf8");
} catch (err) {
  console.error(
    `Error: could not read input file "${safeOutputFile}": ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

const lines = content.split("\n").filter((l) => l.trim());
const findings = [];

/**
 * FIX 6: Brace-depth tracker for multi-line JSON objects.
 * Correctly handles JSON strings (including escaped quotes) that span lines.
 * Adapted from normalize-format.js createBraceTracker().
 */
function createBraceTracker() {
  let depth = 0;
  let inString = false;
  let escaped = false;

  return {
    get depth() {
      return depth;
    },
    feed(str) {
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (inString && ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth < 0) depth = 0;
          }
        }
      }
    },
  };
}

/**
 * Process a complete JSON finding string: parse, validate, normalize file paths,
 * and push to findings array if valid.
 */
function processFindingJson(jsonStr) {
  try {
    const finding = JSON.parse(jsonStr);
    if (finding.title && finding.severity) {
      // Normalize file paths to relative, handling both Windows backslash
      // and Unix forward slash separators via startsWith (prevents mid-path corruption).
      if (finding.file) {
        let f = finding.file;
        if (f.startsWith(ROOT_PREFIX)) f = f.slice(ROOT_PREFIX.length);
        else if (f.startsWith(projectRoot + "/")) f = f.slice(projectRoot.length + 1);
        else if (f.startsWith(projectRoot + "\\")) f = f.slice(projectRoot.length + 1);
        finding.file = f.replace(/\\/g, "/");
      }
      findings.push(finding);
    }
  } catch {
    // Skip invalid JSON
  }
}

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.type === "assistant" && entry.message && entry.message.content) {
      // FIX 4: Normalize content to array. entry.message.content may be a
      // string (some APIs return plain text) or a single object instead of
      // an array of content blocks.
      const contentBlocks = Array.isArray(entry.message.content)
        ? entry.message.content
        : typeof entry.message.content === "string"
          ? [{ type: "text", text: entry.message.content }]
          : [entry.message.content];

      for (const block of contentBlocks) {
        if (block.type === "text" && block.text) {
          const textLines = block.text.split("\n");

          // FIX 6: Multi-line JSON accumulator with brace-depth tracking.
          let accumulator = "";
          let tracker = createBraceTracker();

          for (const tl of textLines) {
            const trimmed = tl.trim();

            // FIX 5: Broaden JSON line detection. The old check
            // trimmed.startsWith('{"title":') missed findings where "title"
            // was not the first key. Now we accept any line starting with "{"
            // that contains a "title" key somewhere.
            if (!accumulator && trimmed.startsWith("{") && trimmed.includes('"title"')) {
              // Try single-line parse first (fast path)
              try {
                const test = JSON.parse(trimmed);
                if (test.title && test.severity) {
                  processFindingJson(trimmed);
                  continue;
                }
              } catch {
                // Not a complete single-line JSON -- start accumulating
              }
              accumulator = trimmed;
              tracker = createBraceTracker();
              tracker.feed(trimmed);
            } else if (accumulator) {
              // Continue accumulating lines for a multi-line JSON object
              accumulator += " " + trimmed;
              tracker.feed(trimmed);
            }

            // When braces balance back to zero, attempt to parse the accumulated JSON
            if (accumulator && tracker.depth === 0) {
              processFindingJson(accumulator);
              accumulator = "";
              tracker = createBraceTracker();
            }
          }
          // Discard any unterminated accumulation at end of block
        }
      }
    }
  } catch {
    // Skip invalid log lines
  }
}

// Ensure dest dir exists
fs.mkdirSync(path.dirname(safeDestFile), { recursive: true });

// Write findings atomically via tmp + rename
const jsonl = findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
const tmpDest = `${safeDestFile}.tmp`;
try {
  fs.writeFileSync(tmpDest, jsonl);
  try {
    fs.renameSync(tmpDest, safeDestFile);
  } catch {
    // Windows may fail rename if dest exists; fallback to rm + rename
    try {
      fs.rmSync(safeDestFile, { force: true });
      fs.renameSync(tmpDest, safeDestFile);
    } catch (fallbackErr) {
      try {
        fs.unlinkSync(tmpDest);
      } catch {
        // ignore cleanup errors
      }
      throw fallbackErr;
    }
  }
} catch (writeErr) {
  // Clean up tmp file on failure
  try {
    fs.unlinkSync(tmpDest);
  } catch {
    // ignore cleanup errors
  }
  console.error(
    `Error: could not write output file: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}`
  );
  process.exit(1);
}
console.log(`Extracted ${findings.length} findings to ${path.relative(projectRoot, safeDestFile)}`);
