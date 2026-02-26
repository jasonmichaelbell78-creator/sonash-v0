/**
 * @fileoverview Detects TOCTOU (Time-of-Check to Time-of-Use) patterns in file operations.
 * The existsSync() + readFileSync() pattern is racy: the file can be deleted or modified
 * between the check and the read. Use try/catch with readFileSync() directly instead.
 */

"use strict";

const { getCalleeName, getEnclosingScope } = require("../lib/ast-utils");

/**
 * Check if a CallExpression is an existsSync call (bare or member).
 */
function isExistsSyncCall(node) {
  return getCalleeName(node.callee) === "existsSync";
}

/**
 * Check if a CallExpression is a readFileSync call (bare or member).
 */
function isReadFileSyncCall(node) {
  return getCalleeName(node.callee) === "readFileSync";
}

/**
 * Extract a stable string key for the first argument of a call.
 * Supports Identifiers and simple MemberExpressions.
 */
function getArgKey(node) {
  if (!node.arguments || node.arguments.length === 0) {
    return null;
  }

  const arg = node.arguments[0];

  if (arg.type === "Identifier") {
    return arg.name;
  }

  // Handle template literals with a single expression like `${dir}/file.txt`
  // or string concatenation - only match if identically constructed.
  // For safety, only match simple identifiers to avoid false positives.
  return null;
}

// getEnclosingScope imported from ../lib/ast-utils

/**
 * Get the start index of a node, using range or loc fallback.
 */
function getStartIndex(node) {
  if (node.range) return node.range[0];
  if (node.loc) return node.loc.start.line * 10000 + node.loc.start.column;
  return -1;
}

/**
 * Check if node A comes before node B in source order.
 */
function isBefore(a, b) {
  return getStartIndex(a) < getStartIndex(b);
}

/**
 * Check if the existsSync call is a condition that guards the readFileSync.
 * Looks for patterns like: if (existsSync(f)) { ... readFileSync(f) ... }
 */
function isGuardingCondition(existsNode, readNode) {
  // Walk up from existsSync to find an IfStatement where it's the test
  let current = existsNode.parent;
  while (current) {
    if (current.type === "IfStatement" && containsNode(current.test, existsNode)) {
      // Check if readFileSync is in the consequent (then branch)
      return containsNode(current.consequent, readNode);
    }
    // Also check for ternary/conditional expressions
    if (current.type === "ConditionalExpression" && containsNode(current.test, existsNode)) {
      return (
        containsNode(current.consequent, readNode) || containsNode(current.alternate, readNode)
      );
    }
    current = current.parent;
  }
  return false;
}

/**
 * Get start and end indices for a node, using range or loc fallback.
 */
function getNodeBounds(node) {
  if (node.range) return { start: node.range[0], end: node.range[1] };
  if (node.loc) {
    return {
      start: node.loc.start.line * 10000 + node.loc.start.column,
      end: node.loc.end.line * 10000 + node.loc.end.column,
    };
  }
  return null;
}

/**
 * Check if ancestor contains descendant node.
 */
function containsNode(ancestor, descendant) {
  if (!ancestor || !descendant) return false;
  if (ancestor === descendant) return true;

  const a = getNodeBounds(ancestor);
  const d = getNodeBounds(descendant);
  if (!a || !d) return false;

  return a.start <= d.start && d.end <= a.end;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow TOCTOU patterns with existsSync() followed by readFileSync()",
      recommended: true,
    },
    schema: [],
    messages: {
      toctouFileOp: "existsSync() + readFileSync() pattern is vulnerable to TOCTOU race conditions",
    },
    hasSuggestions: true,
  },

  create(context) {
    // Collect existsSync calls per scope, keyed by argument
    const existsCalls = [];
    const readCalls = [];

    return {
      CallExpression(node) {
        if (isExistsSyncCall(node)) {
          const argKey = getArgKey(node);
          if (argKey) {
            existsCalls.push({
              node,
              argKey,
              scope: getEnclosingScope(node),
            });
          }
        }

        if (isReadFileSyncCall(node)) {
          const argKey = getArgKey(node);
          if (argKey) {
            readCalls.push({
              node,
              argKey,
              scope: getEnclosingScope(node),
            });
          }
        }
      },

      "Program:exit"() {
        // Index existsSync calls by (scope, argKey) for O(n) lookup
        const existsByScopeAndArg = new Map();
        for (const ex of existsCalls) {
          const scopeMap = existsByScopeAndArg.get(ex.scope) ?? new Map();
          const arr = scopeMap.get(ex.argKey) ?? [];
          arr.push(ex);
          scopeMap.set(ex.argKey, arr);
          existsByScopeAndArg.set(ex.scope, scopeMap);
        }

        for (const read of readCalls) {
          const scopeMap = existsByScopeAndArg.get(read.scope);
          const candidates = scopeMap?.get(read.argKey) ?? [];
          for (const exists of candidates) {
            if (isBefore(exists.node, read.node) && isGuardingCondition(exists.node, read.node)) {
              context.report({
                node: read.node,
                messageId: "toctouFileOp",
                suggest: [
                  {
                    desc: "Use try/catch with readFileSync() directly instead of check-then-read",
                    fix() {
                      // Auto-fix for TOCTOU is complex (requires restructuring control flow).
                      // Return null to indicate manual fix is needed.
                      return null;
                    },
                  },
                ],
              });
            }
          }
        }
      },
    };
  },
};
