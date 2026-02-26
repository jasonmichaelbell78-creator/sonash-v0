/**
 * @fileoverview Detects .innerHTML = ... assignments (XSS risk).
 * Assigning to innerHTML with unsanitized input allows attackers to inject
 * arbitrary scripts. Use textContent or sanitize with DOMPurify instead.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow innerHTML assignments to prevent XSS vulnerabilities",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeInnerHTML:
        "innerHTML assignment can lead to XSS. Use textContent or sanitize with DOMPurify.",
    },
  },

  create(context) {
    return {
      AssignmentExpression(node) {
        const left = node.left;

        if (
          left.type !== "MemberExpression" ||
          left.property.type !== "Identifier" ||
          left.property.name !== "innerHTML"
        ) {
          return;
        }

        // Allow DOMPurify.sanitize() on the right side
        const right = node.right;
        if (right?.type === "CallExpression") {
          const rCallee =
            right.callee.type === "ChainExpression" ? right.callee.expression : right.callee;
          if (
            rCallee.type === "MemberExpression" &&
            rCallee.object?.type === "Identifier" &&
            rCallee.object.name === "DOMPurify" &&
            rCallee.property?.type === "Identifier" &&
            rCallee.property.name === "sanitize"
          ) {
            return;
          }
        }

        context.report({
          node,
          messageId: "unsafeInnerHTML",
        });
      },
    };
  },
};
