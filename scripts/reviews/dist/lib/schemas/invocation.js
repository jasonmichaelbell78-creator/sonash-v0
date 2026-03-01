"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvocationRecord = void 0;
const zod_1 = require("zod");
const shared_1 = require("./shared");
/**
 * Invocation record schema — tracks skill/agent/team invocations.
 * Extends BaseRecord with invocation-specific fields.
 */
exports.InvocationRecord = shared_1.BaseRecord.extend({
    skill: zod_1.z.string().min(1),
    type: zod_1.z.enum(["skill", "agent", "team"]),
    duration_ms: zod_1.z.number().int().min(0).nullable().optional(),
    success: zod_1.z.boolean(),
    error: zod_1.z.string().nullable().optional(),
    context: zod_1.z
        .object({
        pr: zod_1.z.number().int().positive().optional(),
        session: zod_1.z.string().optional(),
        trigger: zod_1.z.string().optional(),
    })
        .nullable()
        .optional(),
});
