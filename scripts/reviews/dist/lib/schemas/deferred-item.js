"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeferredItemRecord = void 0;
const zod_1 = require("zod");
const shared_1 = require("./shared");
/**
 * Deferred item record schema — tracks findings deferred for later resolution.
 * Extends BaseRecord with deferral-specific fields.
 */
exports.DeferredItemRecord = shared_1.BaseRecord.extend({
    review_id: zod_1.z.string().min(1),
    finding: zod_1.z.string().min(1),
    reason: zod_1.z.string().nullable().optional(),
    severity: zod_1.z.enum(["S0", "S1", "S2", "S3"]).nullable().optional(),
    status: zod_1.z.enum(["open", "resolved", "promoted", "wont-fix"]).default("open"),
    resolved_date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    defer_count: zod_1.z.number().int().min(1).default(1),
    promoted_to_debt: zod_1.z.boolean().default(false),
});
