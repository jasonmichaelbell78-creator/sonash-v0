import { z } from "zod";
/**
 * Invocation record schema — tracks skill/agent/team invocations.
 * Extends BaseRecord with invocation-specific fields.
 */
export declare const InvocationRecord: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodString;
    schema_version: z.ZodNumber;
    completeness: z.ZodEnum<{
        full: "full";
        partial: "partial";
        stub: "stub";
    }>;
    completeness_missing: z.ZodDefault<z.ZodArray<z.ZodString>>;
    origin: z.ZodObject<{
        type: z.ZodEnum<{
            "pr-review": "pr-review";
            "pr-retro": "pr-retro";
            backfill: "backfill";
            migration: "migration";
            manual: "manual";
        }>;
        pr: z.ZodOptional<z.ZodNumber>;
        round: z.ZodOptional<z.ZodNumber>;
        session: z.ZodOptional<z.ZodString>;
        tool: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    skill: z.ZodString;
    type: z.ZodEnum<{
        skill: "skill";
        agent: "agent";
        team: "team";
    }>;
    duration_ms: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    context: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        pr: z.ZodOptional<z.ZodNumber>;
        session: z.ZodOptional<z.ZodString>;
        trigger: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type InvocationRecordType = z.infer<typeof InvocationRecord>;
