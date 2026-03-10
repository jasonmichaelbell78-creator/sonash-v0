import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-doc-placement.js

describe("check-doc-placement: TIER_DEFINITIONS", () => {
  const TIER_DEFINITIONS: Record<
    number,
    { name: string; locations: string[]; patterns: RegExp[] }
  > = {
    1: {
      name: "Canonical",
      locations: ["ROADMAP.md", "README.md", "ARCHITECTURE.md"],
      patterns: [/^ROADMAP\.md$/, /^README\.md$/, /^ARCHITECTURE\.md$/],
    },
    2: {
      name: "Foundation",
      locations: ["docs/"],
      patterns: [
        /^docs\/[^/]+\.md$/,
        /^DOCUMENTATION_STANDARDS\.md$/,
        /^AI_WORKFLOW\.md$/,
        /^SECURITY\.md$/,
      ],
    },
    3: {
      name: "Planning",
      locations: ["docs/plans/", ".planning/"],
      patterns: [/PLAN|ROADMAP|PROJECT_STATUS/i],
    },
  };

  it("tier 1 matches ROADMAP.md", () => {
    const patterns = TIER_DEFINITIONS[1].patterns;
    assert.ok(patterns.some((p) => p.test("ROADMAP.md")));
  });

  it("tier 2 matches docs/ markdown files", () => {
    const patterns = TIER_DEFINITIONS[2].patterns;
    assert.ok(patterns.some((p) => p.test("docs/README.md")));
  });

  it("tier 3 matches plan files case-insensitively", () => {
    const patterns = TIER_DEFINITIONS[3].patterns;
    assert.ok(patterns.some((p) => p.test("my-feature-PLAN.md")));
  });

  it("tier 1 does not match arbitrary docs/ files", () => {
    const patterns = TIER_DEFINITIONS[1].patterns;
    assert.ok(!patterns.some((p) => p.test("docs/some-guide.md")));
  });
});

describe("check-doc-placement: EXPECTED_LOCATIONS", () => {
  const EXPECTED_LOCATIONS: Record<
    string,
    { pattern: RegExp; expected: string[]; message: string }
  > = {
    plan: {
      pattern: /PLAN\.md$/i,
      expected: ["docs/plans/", ".planning/"],
      message: "Plan documents should be in docs/plans/ or .planning/",
    },
    template: {
      pattern: /TEMPLATE\.md$/i,
      expected: ["docs/templates/"],
      message: "Template documents should be in docs/templates/",
    },
  };

  it("plan pattern matches PLAN.md files", () => {
    assert.ok(EXPECTED_LOCATIONS["plan"].pattern.test("MY_FEATURE_PLAN.md"));
  });

  it("template pattern matches TEMPLATE.md files", () => {
    assert.ok(EXPECTED_LOCATIONS["template"].pattern.test("REVIEW_TEMPLATE.md"));
  });

  it("plan expected locations include docs/plans/", () => {
    assert.ok(EXPECTED_LOCATIONS["plan"].expected.includes("docs/plans/"));
  });
});

describe("check-doc-placement: file classification", () => {
  function classifyFile(filePath: string): string {
    if (/PLAN\.md$/i.test(filePath)) return "plan";
    if (/TEMPLATE\.md$/i.test(filePath)) return "template";
    if (/\.md$/i.test(filePath)) return "markdown";
    return "other";
  }

  it("classifies plan files", () => {
    assert.strictEqual(classifyFile("docs/plans/FEATURE_PLAN.md"), "plan");
  });

  it("classifies template files", () => {
    assert.strictEqual(classifyFile("docs/templates/PR_TEMPLATE.md"), "template");
  });

  it("classifies regular markdown", () => {
    assert.strictEqual(classifyFile("docs/README.md"), "markdown");
  });

  it("classifies non-markdown files", () => {
    assert.strictEqual(classifyFile("scripts/run.js"), "other");
  });
});

describe("check-doc-placement: path containment check", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects ../ traversal", () => {
    assert.strictEqual(isPathTraversal("../outside"), true);
  });

  it("detects standalone ..", () => {
    assert.strictEqual(isPathTraversal(".."), true);
  });

  it("does not flag normal paths", () => {
    assert.strictEqual(isPathTraversal("docs/readme.md"), false);
  });

  it("does not flag ..hidden filename", () => {
    assert.strictEqual(isPathTraversal("..hidden"), false);
  });
});

describe("check-doc-placement: archive path detection", () => {
  function isInArchive(relativePath: string): boolean {
    return relativePath.startsWith("docs/archive/") || relativePath === "docs/archive";
  }

  it("detects file in docs/archive/", () => {
    assert.strictEqual(isInArchive("docs/archive/old-plan.md"), true);
  });

  it("detects docs/archive itself", () => {
    assert.strictEqual(isInArchive("docs/archive"), true);
  });

  it("does not flag docs/ files as archived", () => {
    assert.strictEqual(isInArchive("docs/ROADMAP.md"), false);
  });

  it("does not falsely match docs/archiveXYZ", () => {
    assert.strictEqual(isInArchive("docs/archiveXYZ/file.md"), false);
  });
});
