/**
 * @fileoverview Detects unbounded .* or .+ in dynamic RegExp constructors.
 * These can cause ReDoS (Regular Expression Denial of Service) or performance
 * issues. Use bounded quantifiers like .{0,N}? instead.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unbounded quantifiers in dynamic RegExp",
      recommended: true,
    },
    schema: [],
    messages: {
      unboundedRegex:
        "Unbounded .* or .+ in dynamic RegExp — potential ReDoS. Use bounded quantifiers: .{0,N}? with explicit limits.",
    },
  },

  create(context) {
    // Matches .* or .+ that are NOT followed by ? (i.e., not already lazy)
    const unboundedPattern = /\.[*+](?!\?)/;

    return {
      NewExpression(node) {
        // Check for new RegExp(...)
        if (node.callee.type !== "Identifier" || node.callee.name !== "RegExp") {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        // Check string literal patterns
        if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
          if (unboundedPattern.test(firstArg.value)) {
            context.report({ node, messageId: "unboundedRegex" });
          }
        }

        // Check template literal patterns
        if (firstArg.type === "TemplateLiteral") {
          const fullText = firstArg.quasis.map((q) => q.value.raw).join("_");
          if (unboundedPattern.test(fullText)) {
            context.report({ node, messageId: "unboundedRegex" });
          }
        }
      },
    };
  },
};
