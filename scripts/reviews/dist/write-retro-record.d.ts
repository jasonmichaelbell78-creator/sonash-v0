/**
 * CLI and library for writing validated RetroRecords to retros.jsonl.
 *
 * Library: writeRetroRecord(projectRoot, data)
 * CLI: node dist/write-retro-record.js --data '{"pr":399,...}'
 */
import { type RetroRecordType } from "./lib/schemas/retro";
/**
 * Write a validated RetroRecord to retros.jsonl.
 *
 * Auto-assigns id as `retro-pr-{pr_number}` if no id provided and pr is set.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Partial retro data (id auto-assigned if missing)
 * @returns The validated record that was written
 */
export declare function writeRetroRecord(projectRoot: string, data: Record<string, unknown>): RetroRecordType;
