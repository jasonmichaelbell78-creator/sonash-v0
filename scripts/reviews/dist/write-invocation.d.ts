/**
 * CLI and library for tracking skill/agent invocations in invocations.jsonl.
 *
 * Library: writeInvocation(projectRoot, data)
 * CLI: node dist/write-invocation.js --data '{"skill":"pr-review","type":"skill",...}'
 */
import { type InvocationRecordType } from "./lib/schemas/invocation";
/**
 * Write a validated InvocationRecord to invocations.jsonl.
 *
 * Auto-assigns id as `inv-{timestamp}` if no id provided.
 * Auto-assigns date as today (YYYY-MM-DD) if no date provided.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Invocation data (id and date auto-assigned if missing)
 * @returns The validated record that was written
 */
export declare function writeInvocation(projectRoot: string, data: Record<string, unknown>): InvocationRecordType;
