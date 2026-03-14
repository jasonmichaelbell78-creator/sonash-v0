/**
 * Barrel export for all JSONL record schemas.
 * Single import point: import { ReviewRecord, BaseRecord, ... } from "./schemas";
 */

// Shared base types
export {
  BaseRecord,
  CompletenessTier,
  Origin,
  type BaseRecordType,
  type CompletenessTierType,
  type OriginType,
} from "./shared";

// Entity schemas
export { ReviewRecord, type ReviewRecordType } from "./review";
export { RetroRecord, type RetroRecordType } from "./retro";
export { DeferredItemRecord, type DeferredItemRecordType } from "./deferred-item";
export { InvocationRecord, type InvocationRecordType } from "./invocation";
export { WarningRecord, type WarningRecordType } from "./warning";
export { LearningRouteRecord, LearningInput, type LearningRouteRecordType } from "./learning-route";
export {
  LifecycleScoreRecord,
  type LifecycleScoreRecord as LifecycleScoreRecordType,
} from "./lifecycle-score";

// Schema map for dynamic lookup by file name
import { ReviewRecord } from "./review";
import { RetroRecord } from "./retro";
import { DeferredItemRecord } from "./deferred-item";
import { InvocationRecord } from "./invocation";
import { WarningRecord } from "./warning";
import { LearningRouteRecord } from "./learning-route";
import { LifecycleScoreRecord } from "./lifecycle-score";

export const SCHEMA_MAP = {
  reviews: ReviewRecord,
  retros: RetroRecord,
  "deferred-items": DeferredItemRecord,
  invocations: InvocationRecord,
  warnings: WarningRecord,
  "learning-routes": LearningRouteRecord,
  "lifecycle-scores": LifecycleScoreRecord,
} as const;
