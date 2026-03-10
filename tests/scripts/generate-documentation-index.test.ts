import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/generate-documentation-index.js

const EXTERNAL_SCHEMES = ["http://", "https://", "mailto:", "ftp://", "#", "tel:"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
const ARCHIVE_DIRS = ["docs/archive", ".planning/archive"];

function isExternalOrSpecialLink(href: string | null | undefined): boolean {
  if (!href || typeof href !== "string") return false;
  return EXTERNAL_SCHEMES.some((scheme) => href.startsWith(scheme));
}

function isImageLink(href: string | null | undefined): boolean {
  if (!href || typeof href !== "string") return false;
  const pathOnly = href.split(/[?#]/)[0].toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => pathOnly.endsWith(ext));
}

function encodeMarkdownPath(mdPath: string): string {
  return encodeURI(mdPath).replaceAll("(", "%28").replaceAll(")", "%29");
}

function canonicalizePath(inputPath: string): string | null {
  const segments = inputPath.split("/");
  const result: string[] = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (result.length === 0) return null;
      result.pop();
    } else {
      result.push(segment);
    }
  }
  return result.join("/");
}

function isArchived(relativePath: string): boolean {
  return ARCHIVE_DIRS.some(
    (archiveDir) => relativePath === archiveDir || relativePath.startsWith(archiveDir + "/")
  );
}

function normalizeOverrideKey(k: string): string {
  return String(k).replaceAll("\\", "/").replace(/^\.\//, "");
}

function isSafeKey(key: string): boolean {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}

describe("generate-documentation-index: isExternalOrSpecialLink", () => {
  it("identifies https links as external", () => {
    assert.strictEqual(isExternalOrSpecialLink("https://example.com"), true);
  });

  it("identifies mailto links as special", () => {
    assert.strictEqual(isExternalOrSpecialLink("mailto:user@example.com"), true);
  });

  it("identifies fragment anchors as special", () => {
    assert.strictEqual(isExternalOrSpecialLink("#section-title"), true);
  });

  it("does not flag relative paths as external", () => {
    assert.strictEqual(isExternalOrSpecialLink("./docs/readme.md"), false);
  });

  it("returns false for null/undefined", () => {
    assert.strictEqual(isExternalOrSpecialLink(null), false);
    assert.strictEqual(isExternalOrSpecialLink(undefined), false);
  });

  it("returns false for empty string", () => {
    assert.strictEqual(isExternalOrSpecialLink(""), false);
  });
});

describe("generate-documentation-index: isImageLink", () => {
  it("identifies .png as image", () => {
    assert.strictEqual(isImageLink("assets/logo.png"), true);
  });

  it("identifies .svg as image", () => {
    assert.strictEqual(isImageLink("icons/arrow.svg"), true);
  });

  it("identifies .jpg with query string as image", () => {
    assert.strictEqual(isImageLink("photo.jpg?size=large"), true);
  });

  it("does not flag markdown as image", () => {
    assert.strictEqual(isImageLink("docs/readme.md"), false);
  });

  it("returns false for null", () => {
    assert.strictEqual(isImageLink(null), false);
  });
});

describe("generate-documentation-index: encodeMarkdownPath", () => {
  it("encodes spaces in path", () => {
    const result = encodeMarkdownPath("docs/my file.md");
    assert.ok(result.includes("%20"));
  });

  it("encodes parentheses for markdown safety", () => {
    const result = encodeMarkdownPath("docs/file (copy).md");
    assert.ok(result.includes("%28"));
    assert.ok(result.includes("%29"));
  });

  it("leaves simple paths unchanged", () => {
    const result = encodeMarkdownPath("docs/readme.md");
    assert.strictEqual(result, "docs/readme.md");
  });
});

describe("generate-documentation-index: canonicalizePath", () => {
  it("resolves single dot segments", () => {
    assert.strictEqual(canonicalizePath("docs/./readme.md"), "docs/readme.md");
  });

  it("resolves parent directory references", () => {
    assert.strictEqual(canonicalizePath("docs/sub/../readme.md"), "docs/readme.md");
  });

  it("returns null for path escaping root", () => {
    assert.strictEqual(canonicalizePath("../escape"), null);
  });

  it("returns null for double escape", () => {
    assert.strictEqual(canonicalizePath("docs/../../escape"), null);
  });

  it("handles empty segments from double slashes", () => {
    assert.strictEqual(canonicalizePath("docs//readme.md"), "docs/readme.md");
  });

  it("normalizes simple path", () => {
    assert.strictEqual(
      canonicalizePath("docs/agent_docs/CODE_PATTERNS.md"),
      "docs/agent_docs/CODE_PATTERNS.md"
    );
  });
});

describe("generate-documentation-index: isArchived", () => {
  it("identifies file in archive directory", () => {
    assert.strictEqual(isArchived("docs/archive/old-file.md"), true);
  });

  it("identifies the archive directory itself", () => {
    assert.strictEqual(isArchived("docs/archive"), true);
  });

  it("does not falsely match prefix substring (e.g. archiveXYZ)", () => {
    assert.strictEqual(isArchived("docs/archiveXYZ/file.md"), false);
  });

  it("does not flag normal docs as archived", () => {
    assert.strictEqual(isArchived("docs/ROADMAP.md"), false);
  });
});

describe("generate-documentation-index: FILE_OVERRIDES key normalization", () => {
  it("converts backslashes to forward slashes", () => {
    assert.strictEqual(normalizeOverrideKey("docs\\readme.md"), "docs/readme.md");
  });

  it("strips leading ./", () => {
    assert.strictEqual(normalizeOverrideKey("./docs/readme.md"), "docs/readme.md");
  });

  it("blocks prototype pollution keys", () => {
    assert.strictEqual(isSafeKey("__proto__"), false);
    assert.strictEqual(isSafeKey("constructor"), false);
    assert.strictEqual(isSafeKey("prototype"), false);
  });

  it("allows normal keys", () => {
    assert.strictEqual(isSafeKey("docs/readme.md"), true);
  });
});
