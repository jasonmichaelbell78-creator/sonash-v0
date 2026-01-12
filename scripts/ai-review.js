#!/usr/bin/env node

/**
 * AI Review Script
 *
 * Applies specialized AI review prompts to different artifact types.
 *
 * Usage:
 *   node scripts/ai-review.js --type=documentation --file=docs/setup.md
 *   node scripts/ai-review.js --type=configuration --file=package.json
 *   node scripts/ai-review.js --type=security-policy --file=firestore.rules
 *   node scripts/ai-review.js --type=dependencies --staged
 */

import fs from "fs";
import path from "path";
import { execSync, execFileSync } from "child_process";

const REVIEW_PROMPTS_FILE = ".claude/review-prompts.md";

// Sensitive file patterns that should NEVER be read/printed (security risk)
const SENSITIVE_FILE_PATTERNS = [
  /^\.env$/, // .env
  /^\.env\..+$/, // .env.local, .env.production, etc.
  /\.env$/, // any file ending in .env
  /credentials\.json$/i, // Google credentials
  /serviceAccount.*\.json$/i, // Firebase service account
  /^firebase-service-account\.json$/i, // Explicit Firebase SA file
  /\.pem$/, // Private keys
  /\.key$/, // Private keys
  /secrets?\.(json|ya?ml)$/i, // Secrets files
  /\.secret$/, // Secret files
];

// Sensitive directory patterns (files in these directories should not be read)
const SENSITIVE_DIR_PATTERNS = [/(^|\/)(secrets?|credentials?|private)(\/|$)/i];

/**
 * Check if a file is sensitive (should not be read/printed)
 * Checks both filename patterns and directory location
 */
function isSensitiveFile(filePath) {
  const basename = path.basename(filePath);
  const normalized = String(filePath).replace(/\\/g, "/");

  // Check if file is in a sensitive directory
  if (SENSITIVE_DIR_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  // Check filename patterns
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(basename));
}

/**
 * Sanitize file paths in error messages to avoid exposing absolute paths
 */
function sanitizePath(filePath) {
  return (
    String(filePath)
      .replace(/\/home\/[^/\s]+/g, "[HOME]")
      .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      // Handle any Windows drive letter, case-insensitive
      .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
  );
}

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  type: null,
  file: null,
  staged: false,
  output: "console", // console | json | yaml
};

args.forEach((arg) => {
  const [key, ...rest] = arg.split("=");
  const value = rest.join("=");
  if (key === "--type") config.type = value;
  if (key === "--file") config.file = value;
  if (key === "--staged") config.staged = true;
  if (key === "--output") config.output = value;
});

// Validation
if (!config.type) {
  console.error("Error: --type is required");
  console.error(
    "Valid types: documentation, configuration, security-policy, process-change, dependencies"
  );
  process.exit(1);
}

const REVIEW_TYPES = {
  documentation: {
    section: "## 1. Documentation Review",
    extensions: [".md", ".mdx"],
    filenames: [],
    description: "Markdown documentation files",
  },
  configuration: {
    section: "## 2. Configuration Review",
    // Note: .env removed - blocked by SENSITIVE_FILE_PATTERNS for security
    extensions: [".json", ".yaml", ".yml"],
    filenames: [],
    description: "Configuration files",
  },
  "security-policy": {
    section: "## 3. Security Policy Review",
    extensions: [".rules"],
    filenames: [],
    description: "Security rules and policies",
  },
  "process-change": {
    section: "## 4. Process Change Review",
    extensions: [".sh", ".yml", ".yaml"],
    filenames: [],
    description: "Workflow and automation files",
  },
  dependencies: {
    section: "## 5. Dependency Review",
    extensions: [],
    filenames: ["package.json"], // Exact filename match
    description: "Dependency changes",
  },
};

if (!REVIEW_TYPES[config.type]) {
  console.error(`Error: Invalid type "${config.type}"`);
  console.error(`Valid types: ${Object.keys(REVIEW_TYPES).join(", ")}`);
  process.exit(1);
}

/**
 * Extract prompt from review-prompts.md
 */
function extractPrompt(type) {
  if (!fs.existsSync(REVIEW_PROMPTS_FILE)) {
    throw new Error(`Review prompts file not found: ${REVIEW_PROMPTS_FILE}`);
  }

  const reviewTypeConfig = REVIEW_TYPES[type];
  const promptsFile = fs.readFileSync(REVIEW_PROMPTS_FILE, "utf-8");

  const sectionStart = promptsFile.indexOf(reviewTypeConfig.section);
  if (sectionStart === -1) {
    throw new Error(`Section "${reviewTypeConfig.section}" not found in ${REVIEW_PROMPTS_FILE}`);
  }

  // Find the next section or end of file
  const nextSectionPattern = /\n## \d+\./g;
  nextSectionPattern.lastIndex = sectionStart + reviewTypeConfig.section.length;
  const match = nextSectionPattern.exec(promptsFile);
  const sectionEnd = match ? match.index : promptsFile.length;

  const section = promptsFile.substring(sectionStart, sectionEnd);

  // Extract the system prompt (between first ``` and next ```)
  const systemPromptMatch = section.match(/### System Prompt\s+```\s+([\s\S]+?)\s+```/);
  if (!systemPromptMatch) {
    throw new Error(`System prompt not found in section: ${reviewTypeConfig.section}`);
  }

  return systemPromptMatch[1].trim();
}

/**
 * Check if a file path is safely contained within project root
 * Prevents path traversal attacks when reading files from CLI args
 * Uses realpath to prevent symlink-based escapes
 */
function isPathContained(filePath) {
  try {
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(projectRoot, filePath);

    // SECURITY: Use realpath to prevent symlink escapes
    // Note: realpathSync throws if path doesn't exist, so we check existence first
    // For non-existent files, we fall back to resolved path comparison
    let realRoot, realResolved;
    try {
      realRoot = fs.realpathSync(projectRoot);
      realResolved = fs.realpathSync(resolvedPath);
    } catch {
      // SECURITY: If file exists but realpathSync fails (permission denied, etc.), fail closed
      if (fs.existsSync(resolvedPath)) {
        return false;
      }
      // File doesn't exist yet, use resolved path for validation
      realRoot = projectRoot;
      realResolved = resolvedPath;
    }

    const rel = path.relative(realRoot, realResolved);
    // Path is contained if:
    // 1. Not empty (exact root match)
    // 2. Doesn't start with '..' (traversal)
    // 3. Isn't absolute (Windows edge case)
    return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
  } catch {
    return false;
  }
}

/**
 * Get files to review
 */
function getFilesToReview() {
  if (config.file) {
    // SECURITY: Validate path containment to prevent path traversal attacks
    if (!isPathContained(config.file)) {
      console.error("Error: File path must be within the project root");
      console.error("       Path traversal (../) and absolute paths are not allowed");
      process.exit(1);
    }
    return [config.file];
  }

  if (config.staged) {
    try {
      const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" })
        .split("\n")
        .filter(Boolean);

      const reviewTypeConfig = REVIEW_TYPES[config.type];
      return stagedFiles.filter((file) => {
        const basename = path.basename(file);
        const ext = path.extname(file);
        // Check exact filename match first
        if (reviewTypeConfig.filenames && reviewTypeConfig.filenames.includes(basename)) {
          return true;
        }
        // Check extension match
        if (reviewTypeConfig.extensions.includes(ext)) {
          return true;
        }
        // For files without extension (dotfiles), check if basename matches an extension pattern
        // This handles cases like .env matching the .env extension
        if (ext === "" && reviewTypeConfig.extensions.includes(basename)) {
          return true;
        }
        return false;
      });
    } catch (error) {
      // Handle non-Error throws safely
      const errorMsg =
        error && typeof error === "object" && "message" in error ? error.message : String(error);
      console.error("Error getting staged files:", sanitizePath(errorMsg));
      console.error("Ensure you are in a git repository with staged files.");
      process.exit(1); // Exit with error instead of silent empty return
    }
  }

  console.error("Error: Either --file or --staged must be specified");
  process.exit(1);
}

/**
 * Read file content
 * SECURITY: Blocks reading sensitive files (.env, credentials, keys, etc.)
 *           Also blocks reading files outside the project root
 */
function readFileContent(filePath) {
  // SECURITY: Block reading sensitive files to prevent exfiltration
  if (isSensitiveFile(filePath)) {
    console.error(`🚫 BLOCKED: Refusing to read sensitive file: ${path.basename(filePath)}`);
    console.error("   This file may contain secrets and should not be piped to external tools.");
    console.error("   Remove this file from staging or use a different review method.");
    return null;
  }

  // SECURITY: Last-line containment check (covers --staged and direct calls)
  if (!isPathContained(filePath)) {
    console.error(
      `🚫 BLOCKED: Refusing to read file outside project root: ${sanitizePath(filePath)}`
    );
    return null;
  }

  try {
    if (config.staged) {
      // Read staged version (use execFileSync to prevent command injection)
      return execFileSync("git", ["show", `:${filePath}`], { encoding: "utf-8" });
    } else {
      // Read current version
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    // Handle non-Error throws safely
    const errorMsg =
      error && typeof error === "object" && "message" in error ? error.message : String(error);
    console.error(`Error reading file ${sanitizePath(filePath)}:`, sanitizePath(errorMsg));
    return null;
  }
}

/**
 * Format review request for AI
 */
function formatReviewRequest(prompt, files) {
  let request = prompt + "\n\n---\n\n";

  if (files.length === 1) {
    const content = readFileContent(files[0]);
    if (!content) return null;

    request += `# File: ${files[0]}\n\n`;
    request += "```\n";
    request += content;
    request += "\n```\n";
  } else {
    request += "# Files to Review\n\n";
    files.forEach((file) => {
      const content = readFileContent(file);
      if (content) {
        request += `## ${file}\n\n`;
        request += "```\n";
        request += content;
        request += "\n```\n\n";
      } else {
        console.warn(`Warning: Skipping file ${sanitizePath(file)} (could not read content)`);
      }
    });
  }

  return request;
}

/**
 * Main execution
 */
function main() {
  console.log(`\n🔍 AI Review: ${REVIEW_TYPES[config.type].description}\n`);

  // Extract the appropriate prompt
  const prompt = extractPrompt(config.type);

  // Get files to review
  const files = getFilesToReview();

  if (files.length === 0) {
    console.log("No files to review.");
    return;
  }

  console.log(`Files to review (${files.length}):`);
  files.forEach((file) => console.log(`  - ${file}`));
  console.log();

  // Format the review request
  const reviewRequest = formatReviewRequest(prompt, files);

  if (!reviewRequest) {
    console.error("Error: Could not format review request");
    process.exit(1);
  }

  // Output based on config
  if (config.output === "json") {
    console.log(
      JSON.stringify(
        {
          type: config.type,
          files: files,
          prompt: prompt,
          request: reviewRequest,
        },
        null,
        2
      )
    );
  } else if (config.output === "yaml") {
    console.log("---");
    console.log(`type: ${config.type}`);
    console.log("files:");
    files.forEach((file) => console.log(`  - ${file}`));
    console.log("prompt: |");
    console.log(
      prompt
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n")
    );
  } else {
    // Console output - ready for piping to Claude
    console.log("=".repeat(80));
    console.log("REVIEW REQUEST (pipe to Claude CLI or use in API)");
    console.log("=".repeat(80));
    console.log(reviewRequest);
    console.log("=".repeat(80));
    console.log("\nSuggested command:");
    console.log(
      `  claude chat < <(node scripts/ai-review.js --type=${config.type} ${config.file ? `--file=${config.file}` : "--staged"})`
    );
  }
}

// Run with top-level error handling
try {
  main();
} catch (error) {
  // Handle non-Error throws and sanitize message to avoid exposing paths
  const errorMsg =
    error && typeof error === "object" && "message" in error ? error.message : String(error);
  console.error(`Error: ${sanitizePath(errorMsg)}`);
  process.exit(1);
}
