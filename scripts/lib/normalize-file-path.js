"use strict";

/**
 * Normalize a file path for consistent TDMS hashing and display.
 *
 * Handles:
 * - Windows backslash → forward slash
 * - Leading ./ and / removal
 * - Org/repo prefix stripping (e.g. "org_repo:path/to/file")
 * - Windows drive letter preservation (e.g. "C:\path")
 * - Repo root stripping (e.g. "/home/user/sonash-v0/lib/foo.ts" → "lib/foo.ts")
 *
 * @param {string} filePath - The file path to normalize
 * @param {object} [options]
 * @param {boolean} [options.stripRepoRoot=false] - Strip absolute repo root prefix
 * @returns {string} Normalized path
 */
function normalizeFilePath(filePath, options = {}) {
  if (!filePath) return "";
  const input = typeof filePath === "string" ? filePath : String(filePath);
  const { stripRepoRoot = false } = options;

  // Convert Windows backslashes to forward slashes
  let normalized = input.replaceAll("\\", "/");

  // Remove leading ./ and leading slashes (preserve UNC paths //server/share)
  normalized = normalized.replace(/^\.\//, "");
  if (!normalized.startsWith("//")) {
    normalized = normalized.replace(/^\/+/, "");
  }

  // Optionally strip absolute paths that include the repo root
  if (stripRepoRoot) {
    const repoNameRaw = process.env.REPO_DIRNAME;
    const repoName = repoNameRaw?.trim() || "sonash-v0";
    const escaped = repoName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const repoRootMatch = new RegExp(`(?:^|/)${escaped}/(.*)$`).exec(normalized);
    if (repoRootMatch) {
      normalized = repoRootMatch[1];
    }
  }

  // Remove org/repo prefix (e.g., "org_repo:path/to/file")
  // But preserve Windows drive letters (e.g., "C:/path")
  const colonIndex = normalized.indexOf(":");
  if (colonIndex > 0) {
    const beforeColon = normalized.substring(0, colonIndex);
    const isWindowsDrive = beforeColon.length === 1 && /^[A-Za-z]$/.test(beforeColon);
    if (!isWindowsDrive) {
      normalized = normalized.substring(colonIndex + 1);
      // Re-strip leading slashes after prefix removal (but preserve UNC)
      if (!normalized.startsWith("//")) {
        normalized = normalized.replace(/^\/+/, "");
      }
    }
  }

  return normalized;
}

module.exports = normalizeFilePath;
