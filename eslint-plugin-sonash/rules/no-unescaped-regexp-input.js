/**
 * @fileoverview Detects variable input in RegExp constructor without escaping.
 * Special regex characters in user input break the regex. Always escape with
 * str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') before constructing.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unescaped variable input in RegExp constructor",
      recommended: true,
    },
    schema: [],
    messages: {
      unescapedInput:
        "Variable in RegExp constructor without escaping — special chars break regex. Escape input first: str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')",
    },
  },

  create(context) {
    return {
      NewExpression(node) {
        // Check for new RegExp(...)
        if (node.callee.type !== "Identifier" || node.callee.name !== "RegExp") {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        // Only flag when the first arg is a plain variable (not a literal or template)
        if (firstArg.type === "Identifier") {
          // Check if the variable was escaped (look for .replace() call with escape pattern)
          // This is a heuristic — we check the parent expression
          const parent = node.parent;
          if (parent && parent.type === "VariableDeclarator" && parent.init === node) {
            // Check if the variable name suggests it's already escaped
            const varName = parent.id.type === "Identifier" ? parent.id.name : "";
            if (/escape/i.test(varName)) return;
          }

          context.report({ node, messageId: "unescapedInput" });
        }

        // Also flag member expressions like obj.prop without escaping
        if (firstArg.type === "MemberExpression") {
          context.report({ node, messageId: "unescapedInput" });
        }
      },
    };
  },
};
