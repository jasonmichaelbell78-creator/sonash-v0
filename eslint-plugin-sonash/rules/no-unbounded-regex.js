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
    /**
     * Check if a pattern string contains an unescaped, unbounded .* or .+
     * Counts preceding backslashes to correctly handle \\.*
     */
    function hasUnboundedDot(pattern) {
      for (let i = 0; i < pattern.length - 1; i++) {
        if (pattern[i] !== ".") continue;
        let backslashes = 0;
        for (let j = i - 1; j >= 0 && pattern[j] === "\\"; j--) backslashes++;
        if (backslashes % 2 === 1) continue; // dot is escaped
        const q = pattern[i + 1];
        if (q !== "*" && q !== "+") continue;
        if (pattern[i + 2] === "?") continue; // already lazy
        return true;
      }
      return false;
    }

    /** Extract static string parts from Literal, TemplateLiteral, or BinaryExpression */
    function getStaticParts(expr) {
      if (!expr) return [];
      if (expr.type === "Literal" && typeof expr.value === "string") return [expr.value];
      if (expr.type === "TemplateLiteral") {
        return expr.quasis.map((q) => q.value.cooked ?? q.value.raw);
      }
      if (expr.type === "BinaryExpression" && expr.operator === "+") {
        return [...getStaticParts(expr.left), ...getStaticParts(expr.right)];
      }
      return [];
    }

    return {
      NewExpression(node) {
        // Check for new RegExp(...)
        if (node.callee.type !== "Identifier" || node.callee.name !== "RegExp") {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        const parts = getStaticParts(firstArg);
        if (parts.some((p) => hasUnboundedDot(p))) {
          context.report({ node, messageId: "unboundedRegex" });
        }
      },
    };
  },
};
