"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRecord = void 0;
const zod_1 = require("zod");
const shared_1 = require("./shared");
/**
 * Review record schema — tracks PR review findings and metrics.
 * Extends BaseRecord with review-specific fields.
 */
exports.ReviewRecord = shared_1.BaseRecord.extend({
    title: zod_1.z.string().nullable().optional(),
    pr: zod_1.z.number().int().positive().nullable().optional(),
    source: zod_1.z.string().nullable().optional(),
    total: zod_1.z.number().int().min(0).nullable().optional(),
    fixed: zod_1.z.number().int().min(0).nullable().optional(),
    deferred: zod_1.z.number().int().min(0).nullable().optional(),
    rejected: zod_1.z.number().int().min(0).nullable().optional(),
    patterns: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    learnings: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    severity_breakdown: zod_1.z
        .object({
        critical: zod_1.z.number().int().min(0),
        major: zod_1.z.number().int().min(0),
        minor: zod_1.z.number().int().min(0),
        trivial: zod_1.z.number().int().min(0),
    })
        .nullable()
        .optional(),
    per_round_detail: zod_1.z.array(zod_1.z.unknown()).nullable().optional(),
    rejection_analysis: zod_1.z.array(zod_1.z.unknown()).nullable().optional(),
    ping_pong_chains: zod_1.z.array(zod_1.z.unknown()).nullable().optional(),
});
