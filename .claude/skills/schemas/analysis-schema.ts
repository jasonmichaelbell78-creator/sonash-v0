/**
 * Zod schema for repo-analysis analysis.json (v4.2 runtime format).
 * Canonical source of truth — REFERENCE.md must match this, not vice versa.
 */
import { z } from "zod";

const dimensionValue = z
  .object({
    value: z.union([z.string(), z.number(), z.boolean()]),
    band: z.string().optional(),
  })
  .passthrough();

const summaryBand = z.object({
  band: z.string(),
  score: z.number().nullable(),
  note: z.string().optional(),
});

const candidate = z
  .object({
    name: z.string(),
    description: z.string(),
    source: z.string().optional(),
    relevance: z.string().optional(),
    effort: z.string().optional(),
    novelty: z.string().optional(),
  })
  .passthrough();

export const analysisSchema = z
  .object({
    repo: z.string(),
    url: z.string().url(),
    skillVersion: z.string(),
    scanDepth: z.enum(["quick", "standard", "deep"]),
    date: z.string(),
    repoType: z.string(),

    classification: z.object({
      type: z.string(),
      confidence: z.string(),
      signals: z.array(z.string()),
    }),

    metadata: z.object({
      stars: z.number(),
      forks: z.number(),
      openIssues: z.number(),
      contributors: z.number(),
      language: z.string().nullable(),
      license: z.string().nullable(),
      created: z.string(),
      lastPush: z.string(),
      size: z.number(),
      topics: z.array(z.string()),
      defaultBranch: z.string(),
      recentCommits90d: z.number(),
      openPRs: z.number(),
      releases: z.number(),
    }),

    dimensions: z.record(z.string(), dimensionValue),

    summaryBands: z.object({
      security: summaryBand,
      reliability: summaryBand,
      maintainability: summaryBand,
      documentation: summaryBand,
      process: summaryBand,
      velocity: summaryBand,
    }),

    absencePattern: z
      .object({
        type: z.string(),
        description: z.string(),
      })
      .optional(),

    creatorLens: z.string().optional(),

    scoring: z
      .object({
        adoptionLens: z.object({ verdict: z.string(), score: z.number() }),
        creatorLens: z.object({ verdict: z.string(), score: z.number() }),
      })
      .optional(),

    // v4.2 candidate arrays (Standard/Deep only)
    patternCandidates: z.array(candidate).optional(),
    knowledgeCandidates: z.array(candidate).optional(),
    contentCandidates: z.array(candidate).optional(),
    antiPatternCandidates: z.array(candidate).optional(),
  })
  .passthrough();

export type Analysis = z.infer<typeof analysisSchema>;
