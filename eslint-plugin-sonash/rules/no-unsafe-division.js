/**
 * @fileoverview Detects division by variables that could be zero.
 * Division by zero returns Infinity/NaN silently. Guard with a zero check
 * or use a safePercent helper function.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow division by potentially-zero variables",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeDivision:
        "Division by '{{name}}' that could be 0 — returns Infinity/NaN. Guard: {{name}} > 0 ? (n / {{name}}) : 0",
    },
  },

  create(context) {
    const dangerousNames = new Set(["total", "count", "length", "size", "denominator"]);

    /**
     * Check if the division is guarded by a > 0 check in the same expression.
     */
    function isGuarded(node) {
      let current = node.parent;
      while (current) {
        // Check for ternary guard: total > 0 ? (x / total) : 0
        if (current.type === "ConditionalExpression" && current.consequent) {
          const test = current.test;
          if (
            test.type === "BinaryExpression" &&
            test.operator === ">" &&
            test.right.type === "Literal" &&
            test.right.value === 0
          ) {
            return true;
          }
        }
        // Check for if statement guard
        if (current.type === "IfStatement") {
          const test = current.test;
          if (
            test &&
            test.type === "BinaryExpression" &&
            test.operator === ">" &&
            test.right &&
            test.right.type === "Literal" &&
            test.right.value === 0
          ) {
            return true;
          }
        }
        current = current.parent;
      }
      return false;
    }

    return {
      BinaryExpression(node) {
        if (node.operator !== "/") return;

        const right = node.right;
        let name;

        // Direct identifier: x / total
        if (right.type === "Identifier") {
          name = right.name;
        }
        // Member expression: x / arr.length
        else if (right.type === "MemberExpression" && right.property.type === "Identifier") {
          name = right.property.name;
        }

        if (!name || !dangerousNames.has(name)) return;

        // Skip if already guarded
        if (isGuarded(node)) return;

        context.report({
          node,
          messageId: "unsafeDivision",
          data: { name },
        });
      },
    };
  },
};
