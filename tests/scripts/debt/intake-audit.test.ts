/**
 * Unit tests for intake-audit.js
 *
 * Tests format detection, field mapping, validation, and dedup key generation.
 * All pure functions — no file I/O.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Re-implementations of pure functions from intake-audit.js ────────────────

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function safeCloneObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || typeof obj !== "object") return obj;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (!DANGEROUS_KEYS.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

interface MappingMetadata {
  format_detected: string;
  mappings_applied: string[];
  confidence?: number;
}

function mapFirstFileToPath(
  item: Record<string, unknown>,
  mapped: Record<string, unknown>,
  metadata: MappingMetadata
): void {
  if (!Array.isArray(item.files) || item.files.length === 0 || item.file) return;

  const firstFile = item.files[0];
  if (typeof firstFile !== "string") {
    metadata.mappings_applied.push("files[0]→file(skipped_non_string)");
    return;
  }

  const lineMatch = /^(.+):(\d+)$/.exec(firstFile);
  if (!lineMatch) {
    mapped.file = firstFile;
    metadata.mappings_applied.push("files[0]→file");
    return;
  }

  mapped.file = lineMatch[1];
  if (item.line === undefined) {
    mapped.line = Number.parseInt(lineMatch[2], 10);
    metadata.mappings_applied.push("files[0]→file+line");
  } else {
    metadata.mappings_applied.push("files[0]→file");
  }
}

function mapCommonAuditFields(
  item: Record<string, unknown>,
  mapped: Record<string, unknown>,
  metadata: MappingMetadata
): void {
  if (typeof item.fingerprint === "string" && item.fingerprint && !item.source_id) {
    mapped.source_id = `audit:${item.fingerprint.replaceAll("::", "-")}`;
    metadata.mappings_applied.push("fingerprint→source_id");
  }
  mapFirstFileToPath(item, mapped, metadata);
  if (item.why_it_matters && !item.description) {
    mapped.description = item.why_it_matters;
    metadata.mappings_applied.push("why_it_matters→description");
  }
  if (item.suggested_fix && !item.recommendation) {
    mapped.recommendation = item.suggested_fix;
    metadata.mappings_applied.push("suggested_fix→recommendation");
  }
  if (Array.isArray(item.acceptance_tests) && item.acceptance_tests.length > 0) {
    const existingEvidence = Array.isArray(item.evidence) ? item.evidence : [];
    mapped.evidence = [
      ...existingEvidence,
      ...item.acceptance_tests.map((t) => `[Acceptance] ${typeof t === "string" ? t : String(t)}`),
    ];
    metadata.mappings_applied.push("acceptance_tests→evidence");
  }
  if (item.confidence !== undefined) {
    metadata.confidence = item.confidence as number;
    metadata.mappings_applied.push("confidence→logged");
  }
}

function mapDocStandardsToTdms(item: Record<string, unknown>): {
  item: Record<string, unknown>;
  metadata: MappingMetadata;
} {
  const mapped = safeCloneObject(item);
  const metadata: MappingMetadata = { format_detected: "tdms", mappings_applied: [] };

  const hasDocStandardsFields =
    item.fingerprint ||
    item.files ||
    item.why_it_matters ||
    item.suggested_fix ||
    item.acceptance_tests;

  if (hasDocStandardsFields) {
    metadata.format_detected = "doc-standards";
    mapCommonAuditFields(item, mapped, metadata);
    delete mapped.fingerprint;
    delete mapped.files;
    delete mapped.why_it_matters;
    delete mapped.suggested_fix;
    delete mapped.acceptance_tests;
  }

  return { item: mapped, metadata };
}

const IMPACT_TO_SEVERITY: Record<string, string> = { I0: "S1", I1: "S2", I2: "S2", I3: "S3" };

function mapEnhancementAuditToTdms(item: Record<string, unknown>): {
  item: Record<string, unknown>;
  metadata: MappingMetadata;
} {
  const mapped = safeCloneObject(item);
  const metadata: MappingMetadata = { format_detected: "tdms", mappings_applied: [] };

  const hasEnhancementFields =
    (typeof item.counter_argument === "string" && item.counter_argument.trim()) ||
    (typeof item.current_approach === "string" && item.current_approach.trim()) ||
    (typeof item.proposed_outcome === "string" && item.proposed_outcome.trim());

  if (hasEnhancementFields) {
    metadata.format_detected = "enhancement-audit";
    mapped.category = "enhancements";
    mapped.type = "enhancement";
    metadata.mappings_applied.push("category→enhancements", "type→enhancement");

    if (item.category && item.category !== "enhancements") {
      mapped.subcategory = item.category;
      metadata.mappings_applied.push("category→subcategory");
    }

    if (item.impact && !item.severity) {
      mapped.severity = IMPACT_TO_SEVERITY[item.impact as string] ?? "S2";
      metadata.mappings_applied.push("impact→severity");
    }

    mapCommonAuditFields(item, mapped, metadata);
    delete mapped.files;
    delete mapped.suggested_fix;
    delete mapped.acceptance_tests;
  }

  return { item: mapped, metadata };
}

function detectAndMapFormat(item: unknown): {
  mappedItem: Record<string, unknown>;
  mappingMetadata: MappingMetadata;
} {
  const isPlainObject = typeof item === "object" && item !== null && !Array.isArray(item);
  if (!isPlainObject) {
    return {
      mappedItem: { title: null, severity: null, category: null, file: null },
      mappingMetadata: { format_detected: "invalid", mappings_applied: [] },
    };
  }

  const objItem = item as Record<string, unknown>;
  const enh = mapEnhancementAuditToTdms(objItem);
  if (enh.metadata.format_detected === "enhancement-audit") {
    return { mappedItem: enh.item, mappingMetadata: enh.metadata };
  }

  const doc = mapDocStandardsToTdms(objItem);
  if (doc.metadata.format_detected === "doc-standards") {
    return { mappedItem: doc.item, mappingMetadata: doc.metadata };
  }

  return {
    mappedItem: objItem,
    mappingMetadata: { format_detected: "tdms", mappings_applied: [] },
  };
}

function isValidFilePath(filePath: unknown): boolean {
  if (!filePath || typeof filePath !== "string") return false;
  const f = filePath.trim();
  if (!f) return false;
  if (/^\d[\d-]*$/.test(f)) return false;
  const placeholders = ["multiple", "various", "several", "unknown", "n/a", "tbd"];
  if (placeholders.includes(f.toLowerCase())) return false;
  if (f.endsWith("/") || f.endsWith("\\")) return false;
  if (!f.includes(".") && !f.includes("/") && !f.includes("\\")) return false;
  return true;
}

function coerceVerifiedBy(mappedItem: Record<string, unknown>): string[] {
  const warnings: string[] = [];
  if (mappedItem.verified_by === undefined || mappedItem.verified_by === null) return warnings;
  if (typeof mappedItem.verified_by !== "string") {
    if (mappedItem.verified_by === true) {
      mappedItem.verified_by = "auto";
      warnings.push(`verified_by coerced from boolean true → "auto"`);
    } else if (mappedItem.verified_by === false) {
      mappedItem.verified_by = null;
      warnings.push(`verified_by coerced from boolean false → null (not verified)`);
    } else {
      const rawType = typeof mappedItem.verified_by;
      const coerced =
        rawType === "object"
          ? JSON.stringify(mappedItem.verified_by)
          : String(mappedItem.verified_by);
      warnings.push(`verified_by coerced from ${rawType} → "${coerced}"`);
      mappedItem.verified_by = coerced;
    }
  }
  return warnings;
}

function getNextDebtId(existingItems: Array<{ id?: string }>): number {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = /DEBT-(\d+)/.exec(item.id);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("intake-audit: safeCloneObject", () => {
  it("clones regular object fields", () => {
    const obj = { title: "foo", severity: "S2", value: 42 };
    const clone = safeCloneObject(obj);
    assert.deepStrictEqual(clone, obj);
  });

  it("strips __proto__ key (prototype pollution protection)", () => {
    // Build an object with __proto__ as an own property (not via literal)
    const obj: Record<string, unknown> = { title: "safe", severity: "S1" };
    Object.defineProperty(obj, "__proto__", {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
    });
    const clone = safeCloneObject(obj);
    // __proto__ should not be copied as own property
    assert.ok(
      !Object.hasOwn(clone, "__proto__"),
      "__proto__ should not be an own property on clone"
    );
    assert.strictEqual(clone.title, "safe");
  });

  it("strips constructor key as own property", () => {
    const obj: Record<string, unknown> = { title: "test", severity: "S1" };
    Object.defineProperty(obj, "constructor", {
      value: "bad",
      enumerable: true,
      configurable: true,
    });
    const clone = safeCloneObject(obj);
    assert.ok(
      !Object.hasOwn(clone, "constructor"),
      "constructor should not be an own property on clone"
    );
  });
});

describe("intake-audit: format detection — TDMS format", () => {
  it("detects plain TDMS format (no special fields)", () => {
    const item = {
      title: "Use parameterized queries",
      severity: "S1",
      category: "security",
      file: "src/lib/db.ts",
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappingMetadata.format_detected, "tdms");
  });

  it("invalid input (null) detected as invalid format", () => {
    const { mappingMetadata } = detectAndMapFormat(null);
    assert.strictEqual(mappingMetadata.format_detected, "invalid");
  });

  it("array input detected as invalid format", () => {
    const { mappingMetadata } = detectAndMapFormat([]);
    assert.strictEqual(mappingMetadata.format_detected, "invalid");
  });
});

describe("intake-audit: format detection — Doc Standards format", () => {
  it("detects doc-standards format via fingerprint field", () => {
    const item = {
      fingerprint: "security::src/lib/auth.ts::unsafe-random",
      title: "Use cryptographically secure random",
      severity: "S1",
      category: "security",
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappingMetadata.format_detected, "doc-standards");
  });

  it("maps fingerprint to source_id", () => {
    const item = {
      fingerprint: "security::src::auth",
      title: "Test",
      severity: "S2",
      category: "security",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.source_id, "audit:security-src-auth");
  });

  it("maps why_it_matters to description", () => {
    const item = {
      why_it_matters: "Because security matters",
      title: "Fix auth",
      severity: "S1",
      category: "security",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.description, "Because security matters");
  });

  it("maps suggested_fix to recommendation", () => {
    const item = {
      suggested_fix: "Use bcrypt instead",
      title: "Fix hashing",
      severity: "S1",
      category: "security",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.recommendation, "Use bcrypt instead");
  });

  it("maps files[0] with line number", () => {
    const item = {
      files: ["src/lib/auth.ts:42"],
      title: "Fix auth",
      severity: "S1",
      category: "security",
    };
    const { mappedItem, mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.file, "src/lib/auth.ts");
    assert.strictEqual(mappedItem.line, 42);
    assert.ok(mappingMetadata.mappings_applied.includes("files[0]→file+line"));
  });

  it("maps files[0] without line number", () => {
    const item = {
      files: ["src/lib/auth.ts"],
      title: "Fix auth",
      severity: "S1",
      category: "security",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.file, "src/lib/auth.ts");
  });

  it("skips non-string files[0] entries", () => {
    const item = {
      files: [{ path: "src/lib/auth.ts" }],
      title: "Fix auth",
      severity: "S1",
      category: "security",
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.ok(mappingMetadata.mappings_applied.includes("files[0]→file(skipped_non_string)"));
  });

  it("maps acceptance_tests to evidence with [Acceptance] prefix", () => {
    const item = {
      acceptance_tests: ["Run auth tests", "Check token expiry"],
      title: "Fix auth",
      severity: "S1",
      category: "security",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.ok(Array.isArray(mappedItem.evidence));
    assert.ok((mappedItem.evidence as string[]).includes("[Acceptance] Run auth tests"));
    assert.ok((mappedItem.evidence as string[]).includes("[Acceptance] Check token expiry"));
  });

  it("removes doc-standards-specific fields from output", () => {
    const item = {
      fingerprint: "security::src::auth",
      files: ["src/auth.ts"],
      why_it_matters: "Security",
      suggested_fix: "Fix it",
      acceptance_tests: ["Test it"],
      title: "Fix",
      severity: "S1",
      category: "security",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.fingerprint, undefined);
    assert.strictEqual(mappedItem.files, undefined);
    assert.strictEqual(mappedItem.why_it_matters, undefined);
    assert.strictEqual(mappedItem.suggested_fix, undefined);
    assert.strictEqual(mappedItem.acceptance_tests, undefined);
  });

  it("logs confidence value in metadata without storing in item", () => {
    const item = {
      fingerprint: "doc::test",
      title: "Test",
      severity: "S2",
      category: "security",
      confidence: 85,
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappingMetadata.confidence, 85);
    assert.ok(mappingMetadata.mappings_applied.includes("confidence→logged"));
  });
});

describe("intake-audit: format detection — Enhancement audit format", () => {
  it("detects enhancement-audit via counter_argument", () => {
    const item = {
      counter_argument: "This might not be needed",
      title: "Improve API design",
      category: "api",
      impact: "I1",
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappingMetadata.format_detected, "enhancement-audit");
  });

  it("detects enhancement-audit via current_approach", () => {
    const item = {
      current_approach: "We use REST",
      title: "Consider GraphQL",
      category: "api",
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappingMetadata.format_detected, "enhancement-audit");
  });

  it("detects enhancement-audit via proposed_outcome", () => {
    const item = {
      proposed_outcome: "Better DX for consumers",
      title: "API improvement",
      category: "api",
    };
    const { mappingMetadata } = detectAndMapFormat(item);
    assert.strictEqual(mappingMetadata.format_detected, "enhancement-audit");
  });

  it("maps category to enhancements and preserves original as subcategory", () => {
    const item = {
      counter_argument: "Could be premature",
      title: "Optimize queries",
      category: "performance",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.category, "enhancements");
    assert.strictEqual(mappedItem.subcategory, "performance");
  });

  it("maps impact I0 → S1", () => {
    const item = {
      counter_argument: "Debatable",
      title: "High impact change",
      category: "api",
      impact: "I0",
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.severity, "S1");
  });

  it("maps impact I1 → S2", () => {
    const item = { counter_argument: "Debatable", title: "T", category: "api", impact: "I1" };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.severity, "S2");
  });

  it("maps impact I3 → S3", () => {
    const item = { counter_argument: "Debatable", title: "T", category: "api", impact: "I3" };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.severity, "S3");
  });

  it("does not overwrite existing severity when impact is present", () => {
    const item = {
      counter_argument: "Debatable",
      title: "T",
      category: "api",
      impact: "I0",
      severity: "S3", // explicitly set
    };
    const { mappedItem } = detectAndMapFormat(item);
    assert.strictEqual(mappedItem.severity, "S3"); // NOT overwritten by impact
  });
});

describe("intake-audit: isValidFilePath", () => {
  it("accepts valid relative paths", () => {
    assert.ok(isValidFilePath("src/lib/auth.ts"));
    assert.ok(isValidFilePath("components/Button.tsx"));
    assert.ok(isValidFilePath("scripts/debt/intake-audit.js"));
  });

  it("rejects numeric-only values", () => {
    assert.ok(!isValidFilePath("42"));
    assert.ok(!isValidFilePath("1-80"));
    assert.ok(!isValidFilePath("10-12"));
  });

  it("rejects placeholder values", () => {
    const placeholders = ["multiple", "various", "several", "unknown", "n/a", "tbd"];
    for (const p of placeholders) {
      assert.ok(!isValidFilePath(p), `"${p}" should be rejected`);
      assert.ok(!isValidFilePath(p.toUpperCase()), `"${p.toUpperCase()}" should be rejected`);
    }
  });

  it("rejects directory-only paths (trailing slash)", () => {
    assert.ok(!isValidFilePath("src/lib/"));
    assert.ok(!isValidFilePath("components\\"));
  });

  it("rejects paths without dot or separator", () => {
    assert.ok(!isValidFilePath("noextension"));
    assert.ok(!isValidFilePath("SINGLE"));
  });

  it("rejects falsy values", () => {
    assert.ok(!isValidFilePath(null));
    assert.ok(!isValidFilePath(undefined));
    assert.ok(!isValidFilePath(""));
  });
});

describe("intake-audit: coerceVerifiedBy", () => {
  it("passes through string values unchanged", () => {
    const item: Record<string, unknown> = { verified_by: "Claude" };
    const warnings = coerceVerifiedBy(item);
    assert.strictEqual(item.verified_by, "Claude");
    assert.strictEqual(warnings.length, 0);
  });

  it("coerces true → 'auto'", () => {
    const item: Record<string, unknown> = { verified_by: true };
    const warnings = coerceVerifiedBy(item);
    assert.strictEqual(item.verified_by, "auto");
    assert.ok(warnings.some((w) => w.includes("auto")));
  });

  it("coerces false → null", () => {
    const item: Record<string, unknown> = { verified_by: false };
    const warnings = coerceVerifiedBy(item);
    assert.strictEqual(item.verified_by, null);
    assert.ok(warnings.some((w) => w.includes("null")));
  });

  it("ignores undefined/null verified_by", () => {
    const itemUndef: Record<string, unknown> = {};
    const itemNull: Record<string, unknown> = { verified_by: null };
    assert.strictEqual(coerceVerifiedBy(itemUndef).length, 0);
    assert.strictEqual(coerceVerifiedBy(itemNull).length, 0);
  });
});

describe("intake-audit: getNextDebtId", () => {
  it("returns 1 for empty list", () => {
    assert.strictEqual(getNextDebtId([]), 1);
  });

  it("returns maxId + 1", () => {
    const items = [{ id: "DEBT-0005" }, { id: "DEBT-0010" }, { id: "DEBT-0003" }];
    assert.strictEqual(getNextDebtId(items), 11);
  });

  it("ignores non-DEBT IDs", () => {
    const items = [{ id: "CANON-001" }, { id: "DEBT-0002" }];
    assert.strictEqual(getNextDebtId(items), 3);
  });

  it("handles items without id field", () => {
    const items = [{ title: "No ID" }, { id: "DEBT-0007" }];
    assert.strictEqual(getNextDebtId(items), 8);
  });
});

describe("intake-audit: IMPACT_TO_SEVERITY mapping", () => {
  it("I0 maps to S1 (conservative — never S0 for enhancements)", () => {
    assert.strictEqual(IMPACT_TO_SEVERITY["I0"], "S1");
  });

  it("I1 and I2 both map to S2", () => {
    assert.strictEqual(IMPACT_TO_SEVERITY["I1"], "S2");
    assert.strictEqual(IMPACT_TO_SEVERITY["I2"], "S2");
  });

  it("I3 maps to S3", () => {
    assert.strictEqual(IMPACT_TO_SEVERITY["I3"], "S3");
  });
});
