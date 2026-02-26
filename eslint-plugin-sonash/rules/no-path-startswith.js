/**
 * @fileoverview Detects path validation using .startsWith() with path-like strings.
 * startsWith('.') or startsWith('/') fails on Windows or edge cases.
 * Use path.relative() and check for ".." prefix with regex instead.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow .startsWith() for path validation",
      recommended: true,
    },
    schema: [],
    messages: {
      pathStartsWith:
        "Path validation with startsWith() fails on Windows or edge cases. Use path.relative() and check for '..' prefix with regex.",
    },
  },

  create(context) {
    // Path-like prefixes that indicate path validation
    const pathPrefixes = new Set([".", "..", "./", ".\\", "/", "\\", "../", "..\\", "//", "\\\\"]);

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for .startsWith(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "startsWith"
        ) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        // Check if the argument is a string literal with a path-like prefix
        if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
          if (pathPrefixes.has(firstArg.value)) {
            context.report({ node, messageId: "pathStartsWith" });
          }
        }
      },
    };
  },
};
