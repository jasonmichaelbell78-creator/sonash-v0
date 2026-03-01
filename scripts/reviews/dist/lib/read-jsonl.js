"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readValidatedJsonl = readValidatedJsonl;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
// Walk up from __dirname until we find package.json (works from both source and dist)
function findProjectRoot(startDir) {
    let dir = startDir;
    for (;;) {
        try {
            if (fs.existsSync(path.join(dir, "package.json")))
                return dir;
        }
        catch {
            // existsSync race condition -- continue walking
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            throw new Error("Could not find project root");
        dir = parent;
    }
}
// read-jsonl.js exports the function directly (module.exports = readJsonl)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const readJsonl = require(path.resolve(findProjectRoot(__dirname), "scripts/lib/read-jsonl.js"));
/**
 * Read a JSONL file and validate each record against a Zod schema.
 *
 * Returns all valid records and warning messages for invalid ones.
 * Never throws -- always returns results even if all records are malformed
 * or the file is missing.
 *
 * @param filePath - Path to the JSONL file
 * @param schema - Zod schema to validate each record against
 * @param options - Optional configuration
 * @param options.quiet - If true, suppress console.warn output
 * @returns Object with valid records and warning messages
 */
function readValidatedJsonl(filePath, schema, options) {
    const valid = [];
    const warnings = [];
    // readJsonl with safe:true returns [] on file read error
    const rawRecords = readJsonl(filePath, { safe: true });
    for (const raw of rawRecords) {
        const result = schema.safeParse(raw);
        if (result.success) {
            valid.push(result.data);
        }
        else {
            const id = typeof raw === "object" && raw !== null && "id" in raw ? String(raw.id) : "unknown";
            const msg = `Invalid record (id=${id}): ${result.error.message}`;
            warnings.push(msg);
            if (!(options === null || options === void 0 ? void 0 : options.quiet)) {
                console.warn(msg);
            }
        }
    }
    return { valid, warnings };
}
