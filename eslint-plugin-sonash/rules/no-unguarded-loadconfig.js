/**
 * @fileoverview Detects loadConfig/require calls not wrapped in try/catch.
 * Missing error handling crashes the script when config files are missing or
 * malformed. Always wrap in try/catch with a graceful fallback.
 */

"use strict";

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

    /**
     * Check if a node is inside a TryStatement's block.
     */
    function isInsideTryBlock(node) {
      let current = node.parent;
      while (current) {
        if (current.type === "TryStatement") return true;
        // Stop at function boundaries
        if (
          current.type === "FunctionDeclaration" ||
          current.type === "FunctionExpression" ||
          current.type === "ArrowFunctionExpression"
        ) {
          break;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        let funcName;

        if (callee.type === "Identifier") {
          funcName = callee.name;
        } else if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          funcName = callee.property.name;
        }

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

        // Check require() calls with string literal path (dynamic requires)
        if (funcName === "require" && node.arguments.length > 0) {
          const arg = node.arguments[0];
          // Only flag require with a string path (not computed)
          if (arg.type !== "Literal" || typeof arg.value !== "string") return;

          // Skip standard node_modules imports (they don't fail the same way)
          const path = arg.value;
          if (!path.startsWith(".") && !path.startsWith("/")) return;

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
