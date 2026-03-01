"use strict";
/**
 * Barrel export for all JSONL record schemas.
 * Single import point: import { ReviewRecord, BaseRecord, ... } from "./schemas";
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_MAP = exports.WarningRecord = exports.InvocationRecord = exports.DeferredItemRecord = exports.RetroRecord = exports.ReviewRecord = exports.Origin = exports.CompletenessTier = exports.BaseRecord = void 0;
// Shared base types
var shared_1 = require("./shared");
Object.defineProperty(exports, "BaseRecord", { enumerable: true, get: function () { return shared_1.BaseRecord; } });
Object.defineProperty(exports, "CompletenessTier", { enumerable: true, get: function () { return shared_1.CompletenessTier; } });
Object.defineProperty(exports, "Origin", { enumerable: true, get: function () { return shared_1.Origin; } });
// Entity schemas
var review_1 = require("./review");
Object.defineProperty(exports, "ReviewRecord", { enumerable: true, get: function () { return review_1.ReviewRecord; } });
var retro_1 = require("./retro");
Object.defineProperty(exports, "RetroRecord", { enumerable: true, get: function () { return retro_1.RetroRecord; } });
var deferred_item_1 = require("./deferred-item");
Object.defineProperty(exports, "DeferredItemRecord", { enumerable: true, get: function () { return deferred_item_1.DeferredItemRecord; } });
var invocation_1 = require("./invocation");
Object.defineProperty(exports, "InvocationRecord", { enumerable: true, get: function () { return invocation_1.InvocationRecord; } });
var warning_1 = require("./warning");
Object.defineProperty(exports, "WarningRecord", { enumerable: true, get: function () { return warning_1.WarningRecord; } });
// Schema map for dynamic lookup by file name
const review_2 = require("./review");
const retro_2 = require("./retro");
const deferred_item_2 = require("./deferred-item");
const invocation_2 = require("./invocation");
const warning_2 = require("./warning");
exports.SCHEMA_MAP = {
    reviews: review_2.ReviewRecord,
    retros: retro_2.RetroRecord,
    "deferred-items": deferred_item_2.DeferredItemRecord,
    invocations: invocation_2.InvocationRecord,
    warnings: warning_2.WarningRecord,
};
