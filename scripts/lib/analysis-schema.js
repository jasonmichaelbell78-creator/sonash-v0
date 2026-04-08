"use strict";

/**
 * Unified Zod schemas for the Content Analysis System (T28).
 *
 * Two schemas:
 * - analysisRecord: per-source analysis output (analysis.json)
 * - extractionRecord: per-candidate extraction entry (extraction-journal.jsonl)
 *
 * All handler skills import and validate against these schemas.
 * Schema-as-code prevents drift between handlers.
 *
 * @see .planning/content-analysis-system/DECISIONS.md (Decisions #6, #7, #8)
 * @see .claude/skills/shared/CONVENTIONS.md (Section 12)
 */

const { z } = require("zod");
// propagation: isSafeToWrite() compliance — read-only schema module (refuse-symlink)

// --- Shared enums ---

const sourceTypeEnum = z.enum(["repo", "website", "document", "media"]);

const depthEnum = z.enum(["quick", "standard", "deep"]);

const scoringBandEnum = z.enum(["Critical", "Needs Work", "Healthy", "Excellent"]);

const classificationEnum = z.enum(["active-sprint", "park-for-later", "evergreen", "not-relevant"]);

const candidateTypeEnum = z.enum([
  "pattern",
  "anti-pattern",
  "knowledge",
  "content",
  "architecture-pattern",
  "design-principle",
  "workflow-pattern",
  "tool",
]);

const decisionEnum = z.enum(["defer", "extract", "skip", "investigate"]);

const noveltyEnum = z.enum(["high", "medium", "low"]);

const effortEnum = z.enum(["E0", "E1", "E2", "E3"]);

const relevanceEnum = z.enum(["high", "medium", "low"]);

// --- Candidate schema (shared in analysis + extraction) ---

const candidateSchema = z.object({
  name: z.string(),
  type: candidateTypeEnum,
  description: z.string(),
  novelty: noveltyEnum,
  effort: effortEnum,
  relevance: relevanceEnum,
  tags: z.array(z.string()).default([]),
  url: z.string().nullable().optional(),
  finding_refs: z.array(z.string()).optional(),
});

// --- Scoring schema ---

const scoringSchema = z.object({
  quality_band: scoringBandEnum,
  quality_score: z.number().min(0).max(100),
  personal_fit_band: scoringBandEnum,
  personal_fit_score: z.number().min(0).max(100),
  classification: classificationEnum,
});

// --- Analysis record (analysis.json) ---

const analysisRecordCore = z.object({
  id: z.string().uuid(),
  schema_version: z.string(),
  source_type: sourceTypeEnum,
  source: z.string(),
  slug: z.string(),
  title: z.string(),
  analyzed_at: z.string().nullable(),
  depth: depthEnum,
  tags: z.array(z.string()).default([]),
  scoring: scoringSchema,
  summary: z.string(),
  creator_view: z.string(),
  candidates: z.array(candidateSchema),
  last_synthesized_at: z.string().nullable().default(null),
});

// --- Type-specific optional fields ---

const repoMetadata = z
  .object({
    stars: z.number(),
    language: z.string().nullable(),
    license: z.string().nullable(),
    last_push: z.string().nullable(),
    archived: z.boolean(),
    fork: z.boolean(),
    topics: z.array(z.string()).default([]),
  })
  .partial();

const repoFields = z
  .object({
    metadata: repoMetadata,
    dimensions: z.record(z.string(), z.unknown()),
    absence_patterns: z.array(z.string()),
    adoption_verdict: z.string(),
  })
  .partial();

const websiteMetadata = z
  .object({
    domain: z.string(),
    pages_analyzed: z.number(),
    extraction_mode: z.string(),
  })
  .partial();

const websiteFields = z
  .object({
    metadata: websiteMetadata,
    value_axes: z.record(z.string(), z.number()),
    key_claims: z.array(z.string()),
    links: z.array(z.string()),
    site_type: z.string(),
  })
  .partial();

const mediaMetadata = z
  .object({
    duration_seconds: z.number(),
    platform: z.string(),
    channel: z.string(),
  })
  .partial();

const mediaFields = z
  .object({
    metadata: mediaMetadata,
    transcript_source: z.enum(["captions", "whisper", "manual"]),
    transcript_length: z.number(),
  })
  .partial();

const documentMetadata = z
  .object({
    page_count: z.number(),
    file_type: z.string(),
    word_count: z.number(),
  })
  .partial();

const documentFields = z
  .object({
    metadata: documentMetadata,
  })
  .partial();

// --- Full analysis record (core + type-specific merged) ---

const analysisRecord = analysisRecordCore.and(
  z.union([
    z.object({ source_type: z.literal("repo") }).and(repoFields),
    z.object({ source_type: z.literal("website") }).and(websiteFields),
    z.object({ source_type: z.literal("media") }).and(mediaFields),
    z.object({ source_type: z.literal("document") }).and(documentFields),
  ])
);

// --- Extraction record (extraction-journal.jsonl) ---

const extractionRecord = z.object({
  schema_version: z.string(),
  source_type: sourceTypeEnum,
  source: z.string(),
  source_analysis_id: z.string().uuid().nullable().default(null),
  candidate: z.string(),
  type: candidateTypeEnum,
  decision: decisionEnum,
  decision_date: z.string(),
  extracted_to: z.string().nullable().default(null),
  extracted_at: z.string().nullable().default(null),
  notes: z.string(),
  novelty: noveltyEnum,
  effort: effortEnum,
  relevance: relevanceEnum,
  tags: z.array(z.string()).default([]),
});

// --- Validation helper ---

/**
 * Validate a record against a schema.
 * @param {object} record - The data to validate
 * @param {'analysis'|'extraction'} type - Which schema to use
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function validate(record, type) {
  const schema = type === "analysis" ? analysisRecord : extractionRecord;
  const result = schema.safeParse(record);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { success: false, error: messages };
}

module.exports = {
  // Schemas
  analysisRecordCore,
  analysisRecord,
  extractionRecord,
  candidateSchema,
  scoringSchema,

  // Type-specific
  repoFields,
  websiteFields,
  mediaFields,
  documentFields,

  // Enums
  sourceTypeEnum,
  depthEnum,
  scoringBandEnum,
  classificationEnum,
  candidateTypeEnum,
  decisionEnum,
  noveltyEnum,
  effortEnum,
  relevanceEnum,

  // Helper
  validate,
};
