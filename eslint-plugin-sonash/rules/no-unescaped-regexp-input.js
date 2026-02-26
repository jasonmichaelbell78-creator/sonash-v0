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

        // Skip safe literal inputs
        if (firstArg.type === "Literal") return;
        // Skip plain template literals with no expressions
        if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length === 0) return;

        // Check if the result variable name suggests the input is already escaped
        if (firstArg.type === "Identifier") {
          const parent = node.parent;
          if (parent?.type === "VariableDeclarator" && parent?.init === node) {
            const varName = parent.id.type === "Identifier" ? parent.id.name : "";
            if (/escape/i.test(varName)) return;
          }
        }

        // Allow common explicit escaping helpers (e.g., escapeRegExp(input))
        if (firstArg.type === "CallExpression") {
          const argCallee = firstArg.callee;
          const unwrapped = argCallee.type === "ChainExpression" ? argCallee.expression : argCallee;
          if (
            (unwrapped.type === "Identifier" && /escape.*regexp/i.test(unwrapped.name)) ||
            (unwrapped.type === "MemberExpression" &&
              unwrapped.property?.type === "Identifier" &&
              /escape.*regexp/i.test(unwrapped.property.name))
          ) {
            return;
          }
        }

        // Flag: Identifier, MemberExpression, template literals with expressions,
        // or string concatenation with non-literal parts
        context.report({ node, messageId: "unescapedInput" });
      },
    };
  },
};
