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
          left.type === "MemberExpression" &&
          left.property.type === "Identifier" &&
          left.property.name === "innerHTML"
        ) {
          context.report({
            node,
            messageId: "unsafeInnerHTML",
          });
        }
      },
    };
  },
};
