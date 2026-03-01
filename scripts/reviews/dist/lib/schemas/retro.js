"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetroRecord = void 0;
const zod_1 = require("zod");
const shared_1 = require("./shared");
/**
 * Retro record schema — tracks PR retrospective analysis.
 * Extends BaseRecord with retro-specific fields.
 */
exports.RetroRecord = shared_1.BaseRecord.extend({
    pr: zod_1.z.number().int().positive().nullable().optional(),
    session: zod_1.z.string().nullable().optional(),
    top_wins: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    top_misses: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    process_changes: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    score: zod_1.z.number().min(0).max(10).nullable().optional(),
    metrics: zod_1.z
        .object({
        total_findings: zod_1.z.number().int().min(0),
        fix_rate: zod_1.z.number().min(0).max(1),
        pattern_recurrence: zod_1.z.number().int().min(0),
    })
        .nullable()
        .optional(),
});
