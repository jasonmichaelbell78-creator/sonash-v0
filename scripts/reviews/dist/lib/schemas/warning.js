"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningRecord = void 0;
const zod_1 = require("zod");
const shared_1 = require("./shared");
/**
 * Warning record schema — tracks system warnings and alerts.
 * Extends BaseRecord with warning-specific fields.
 */
exports.WarningRecord = shared_1.BaseRecord.extend({
    category: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    severity: zod_1.z.enum(["info", "warning", "error"]),
    lifecycle: zod_1.z.enum(["new", "acknowledged", "resolved", "stale"]).default("new"),
    resolved_date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    source_script: zod_1.z.string().nullable().optional(),
    related_ids: zod_1.z.array(zod_1.z.string()).nullable().optional(),
});
