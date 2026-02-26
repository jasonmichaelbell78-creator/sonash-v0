/**
 * @fileoverview Detects loadConfig/require calls not wrapped in try/catch.
 * Missing error handling crashes the script when config files are missing or
 * malformed. Always wrap in try/catch with a graceful fallback.
 */

"use strict";

/**
 * Check if a node is inside the try block (not catch/finally) of a TryStatement.
 * Stops traversal at function boundaries.
 */
function isInsideTryBlock(node) {
  let prev = node;
  let current = node.parent;
  while (current) {
    // Guarded only when the call is inside the `try { ... }` block, not catch/finally
    if (current.type === "TryStatement" && prev === current.block) {
      return true;
    }
    // Stop at function boundaries
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      break;
    }
    prev = current;
    current = current.parent;
  }
  return false;
}

/**
 * Return the resolved function name for a callee node, or null if not determinable.
 */
function getCalleeName(callee) {
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (callee.type === "MemberExpression" && callee.property?.type === "Identifier") {
    return callee.property.name;
  }
  return null;
}

/**
 * Return true when the require() call should be flagged:
 * - argument is a string literal
 * - path is relative or absolute (not a bare node_modules specifier)
 */
function isLocalRequireCall(node) {
  if (node.arguments.length === 0) return false;
  const arg = node.arguments[0];
  if (arg.type !== "Literal" || typeof arg.value !== "string") return false;
  const path = arg.value;
  return path.startsWith(".") || path.startsWith("/");
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require try/catch around loadConfig and require calls",
      recommended: true,
    },
    schema: [],
    messages: {
      unguardedConfig:
        "{{name}}() without try/catch — crashes on missing or malformed config. Wrap in try/catch with fallback.",
    },
  },

  create(context) {
    const configFunctions = new Set(["loadConfig"]);

    return {
      CallExpression(node) {
        const funcName = getCalleeName(node.callee);
        if (!funcName) return;

        // Check loadConfig calls
        if (configFunctions.has(funcName)) {
          if (!isInsideTryBlock(node)) {
            context.report({
              node,
              messageId: "unguardedConfig",
              data: { name: funcName },
            });
          }
          return;
        }

        // Check require() calls with a local string path
        if (funcName === "require" && isLocalRequireCall(node)) {
          if (!isInsideTryBlock(node)) {
            context.report({
              node,
              messageId: "unguardedConfig",
              data: { name: funcName },
            });
          }
        }
      },
    };
  },
};
