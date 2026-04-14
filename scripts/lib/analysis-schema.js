"use strict";

/**
 * Unified Zod schemas for the Content Analysis System (T28).
 *
 * Three schemas:
 * - analysisRecord: per-source analysis output (analysis.json)
 * - extractionRecord: per-candidate extraction entry (extraction-journal.jsonl)
 * - synthesisRecord: cross-source synthesis output (synthesis.json) — T29
 *
 * All handler skills import and validate against these schemas.
 * Schema-as-code prevents drift between handlers.
 *
 * @see .planning/content-analysis-system/DECISIONS.md (Decisions #6, #7, #8)
 * @see .planning/synthesis-consolidation/DECISIONS.md (Decisions #6, #28, #32)
 * @see .claude/skills/shared/CONVENTIONS.md (Section 12, 17)
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

// Source authority/trust tier (D#13, D#32). Repos default to T1 (first-party
// artifacts). Other types span T1-T4 based on editorial authority. Stored on
// each analysis.json so synthesis can weight evidence accordingly.
const sourceTierEnum = z.enum(["T1", "T2", "T3", "T4"]);

// Synthesis paradigm — analytical lens applied across sources (D#7).
const paradigmEnum = z.enum(["thematic", "narrative", "matrix", "meta-pattern"]);

// Synthesis run mode (D#8, D#14).
const synthesisModeEnum = z.enum(["full", "incremental", "re-synthesis"]);

// Convergence confidence — how many independent sources support a theme.
const convergenceEnum = z.enum(["weak", "medium", "strong"]);

// Opportunity routing target (D#12).
const opportunityRouteEnum = z.enum(["/brainstorm", "/deep-plan", "/deep-research", "/analyze"]);

// Reading-chain pedagogical tier (D#25).
const chainTierEnum = z.enum(["overview", "tutorial", "implementation", "theory"]);

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
  // T29: source authority tier (D#13, D#32). Optional for backward
  // compatibility — migrate-v3.js fills defaults for existing records.
  source_tier: sourceTierEnum.optional(),
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
    absence_patterns: z.array(
      z.union([
        z.string(),
        z
          .object({
            pattern: z.string(),
            confidence: z.string().optional(),
            evidence: z.string().optional(),
          })
          .passthrough(),
      ])
    ),
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

// --- Synthesis sub-schemas (T29, D#6, D#11) ---

// Theme + signal merged. Every theme carries convergence evidence (D#11).
const themeEvidenceSchema = z.object({
  source_slug: z.string(),
  source_type: sourceTypeEnum,
  quote_or_ref: z.string(),
});

const themeSchema = z.object({
  name: z.string(),
  description: z.string(),
  evidence: z.array(themeEvidenceSchema),
  convergence_count: z.number().int().nonnegative(),
  convergence_confidence: convergenceEnum,
  source_types: z.array(sourceTypeEnum),
  signal_strength: z.enum(["weak", "medium", "strong"]).optional(),
});

// Ecosystem gap — domain present in home context but missing from analyzed sources.
const gapSchema = z.object({
  domain: z.string(),
  description: z.string(),
  why_unfilled: z.string(),
  suggested_action: z.string().optional(),
  home_context_source: z.string().nullable().optional(),
});

// Reading-chain node — pedagogical or dependency-ordered study path (D#25).
const chainNodeSchema = z.object({
  order: z.number().int().nonnegative(),
  source_slug: z.string(),
  source_type: sourceTypeEnum,
  rationale: z.string(),
  tier: chainTierEnum.optional(),
});

// Opportunity — actionable next-step routed to brainstorm/plan/research/analyze (D#12).
// `title_key` is the normalized stable identifier used for cross-run dedup against
// the opportunities ledger (lowercase + alnum-only + `_` for spaces, max 60 chars).
// OPTIONAL in the synthesis.json snapshot (writers may compute on-the-fly when
// upserting the ledger). REQUIRED in opportunityLedgerRecord below — the ledger
// is the durable file where title_key is the dedup primary key.
// title_key contract: lowercase alnum + underscores only, max 60 chars.
// Enforced at the schema level to guarantee cross-run dedup keys match the
// documented format — prevents silent drift between writers.
const TITLE_KEY_REGEX = /^[a-z0-9_]+$/;
const DATE_YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const opportunitySchema = z.object({
  rank: z.number().int().positive(),
  title: z.string(),
  title_key: z
    .string()
    .max(60)
    .regex(TITLE_KEY_REGEX, "title_key must be lowercase alnum + underscores only")
    .optional(),
  description: z.string(),
  effort: effortEnum,
  impact: z.enum(["low", "medium", "high"]),
  evidence: z.array(z.string()),
  suggested_route: opportunityRouteEnum,
});

// Opportunities ledger row — durable cross-run record (T29 Wave 5).
// File: .research/analysis/synthesis/opportunities-ledger.jsonl (append/upsert).
// Schema is named so future helper scripts can validate ledger I/O at runtime.
const ledgerStatusEnum = z.enum(["pending", "adopted", "skipped", "deferred", "stale"]);
const deferredToSchema = z
  .object({
    type: z.enum(["todo", "roadmap", "milestone"]),
    id: z.string(),
    file: z.string().optional(),
  })
  .nullable();
const opportunityLedgerRecord = z.object({
  title_key: z
    .string()
    .max(60)
    .regex(TITLE_KEY_REGEX, "title_key must be lowercase alnum + underscores only"),
  rank: z.number().int().positive(),
  title: z.string(),
  first_seen_in_run: z.string().regex(DATE_YMD_REGEX, "Must be YYYY-MM-DD"),
  last_seen_in_run: z.string().regex(DATE_YMD_REGEX, "Must be YYYY-MM-DD"),
  runs_seen: z.number().int().positive(),
  status: ledgerStatusEnum,
  effort: effortEnum,
  impact: z.enum(["low", "medium", "high"]),
  suggested_route: opportunityRouteEnum,
  evidence_sources: z.array(z.string()),
  adopted_at: z.string().nullable(),
  adopted_to: z.string().nullable(),
  commit_sha: z.string().nullable(),
  deferred_to: deferredToSchema.optional(),
  notes: z.string().nullable(),
});

// Re-synthesis change detection — all 6 dimensions (D#10).
const changesSectionSchema = z.object({
  themes: z.object({
    new: z.array(z.string()),
    removed: z.array(z.string()),
    strengthened: z.array(z.string()),
    weakened: z.array(z.string()),
  }),
  candidates: z.object({
    new: z.array(z.string()),
    promoted: z.array(z.string()),
    demoted: z.array(z.string()),
  }),
  gaps: z.object({
    filled: z.array(z.string()),
    new: z.array(z.string()),
  }),
  confidence_shifts: z.array(
    z.object({
      theme: z.string(),
      from: convergenceEnum,
      to: convergenceEnum,
    })
  ),
  contradictions: z.array(
    z.object({
      description: z.string(),
      sources: z.array(z.string()),
    })
  ),
  source_impact: z.array(
    z.object({
      source_slug: z.string(),
      impact: z.string(),
    })
  ),
});

// --- Synthesis record (synthesis.json) ---

const synthesisRecord = z.object({
  schema_version: z.string(),
  generated_at: z.string(),
  paradigm: paradigmEnum,
  mode: synthesisModeEnum,
  sources_included: z.array(
    z.object({
      slug: z.string(),
      source: z.string(),
      source_type: sourceTypeEnum,
      source_tier: sourceTierEnum,
      depth: depthEnum,
    })
  ),
  sources_excluded: z.array(
    z.object({
      slug: z.string(),
      reason: z.string(),
    })
  ),
  // Base sections — always present (D#11)
  themes: z.array(themeSchema),
  ecosystem_gaps: z.array(gapSchema),
  fit_portfolio: z.object({
    refreshed_at: z.string(),
    candidates: z.array(candidateSchema),
  }),
  knowledge_map: z.object({
    covered: z.array(
      z.object({
        domain: z.string(),
        sources: z.array(z.string()),
        quality: z.string(),
      })
    ),
    gaps: z.array(
      z.object({
        domain: z.string(),
        home_context_source: z.string(),
        suggested_scan: z.string().nullable(),
      })
    ),
  }),
  opportunity_matrix: z.array(opportunitySchema),
  // Type-specific — optional (D#11)
  reading_chain: z.array(chainNodeSchema).optional(),
  mental_model: z
    .object({
      interest_shifts: z.array(z.unknown()),
      confidence_shifts: z.array(z.unknown()),
      emerging_focus_tags: z.array(z.string()),
      date_range: z.string(),
    })
    .optional(),
  // Re-synthesis only — optional (D#10)
  changes_since_previous: changesSectionSchema.optional(),
});

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
 * @param {'analysis'|'extraction'|'synthesis'} type - Which schema to use
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function validate(record, type) {
  let schema;
  if (type === "analysis") schema = analysisRecord;
  else if (type === "extraction") schema = extractionRecord;
  else if (type === "synthesis") schema = synthesisRecord;
  else return { success: false, error: `Unknown schema type: ${type}` };

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
  synthesisRecord,
  candidateSchema,
  scoringSchema,

  // Type-specific
  repoFields,
  websiteFields,
  mediaFields,
  documentFields,

  // Synthesis sub-schemas
  themeSchema,
  themeEvidenceSchema,
  gapSchema,
  chainNodeSchema,
  opportunitySchema,
  opportunityLedgerRecord,
  deferredToSchema,
  changesSectionSchema,

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
  sourceTierEnum,
  paradigmEnum,
  synthesisModeEnum,
  convergenceEnum,
  opportunityRouteEnum,
  chainTierEnum,
  ledgerStatusEnum,

  // Helper
  validate,
};
