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
exports.appendRecord = appendRecord;
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withLock, isSafeToWrite } = require(path.resolve(findProjectRoot(__dirname), "scripts/lib/safe-fs.js"));
/**
 * Append a validated record to a JSONL file.
 *
 * Validates the record against the provided Zod schema before writing.
 * Uses safe-fs.js withLock for advisory locking and isSafeToWrite for
 * symlink guards. Lets ZodError propagate to caller on validation failure.
 *
 * @param filePath - Absolute path to the JSONL file
 * @param record - The record to append
 * @param schema - Zod schema to validate the record against
 */
function appendRecord(filePath, record, schema) {
    const absPath = path.resolve(filePath);
    // Symlink guard
    if (!isSafeToWrite(absPath)) {
        throw new Error(`Refusing to write to unsafe path: ${path.basename(absPath)}`);
    }
    // Validate -- throws ZodError if invalid (intentionally not caught)
    const validated = schema.parse(record);
    const line = JSON.stringify(validated) + "\n";
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    // Write under advisory lock
    withLock(absPath, () => {
        fs.appendFileSync(absPath, line, "utf8");
    });
}
