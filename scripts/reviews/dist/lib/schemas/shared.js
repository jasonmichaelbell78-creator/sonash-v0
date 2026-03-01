"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRecord = exports.Origin = exports.CompletenessTier = void 0;
const zod_1 = require("zod");
/**
 * Three-tier completeness model for all JSONL records.
 * - full: all fields populated
 * - partial: required fields + some optional
 * - stub: minimal required fields only
 */
exports.CompletenessTier = zod_1.z.enum(["full", "partial", "stub"]);
/**
 * Structured origin tracking — never a plain string.
 * Records where data came from and under what context.
 */
exports.Origin = zod_1.z.object({
    type: zod_1.z.enum(["pr-review", "pr-retro", "backfill", "migration", "manual"]),
    pr: zod_1.z.number().int().positive().optional(),
    round: zod_1.z.number().int().positive().optional(),
    session: zod_1.z.string().optional(),
    tool: zod_1.z.string().optional(),
});
/**
 * Base record shared by all 5 JSONL file types.
 * Every entity schema extends this via BaseRecord.extend().
 */
exports.BaseRecord = zod_1.z.object({
    id: zod_1.z.string().min(1),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    schema_version: zod_1.z.number().int().positive(),
    completeness: exports.CompletenessTier,
    completeness_missing: zod_1.z.array(zod_1.z.string()).default([]),
    origin: exports.Origin,
});
