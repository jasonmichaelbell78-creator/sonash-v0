/**
 * @fileoverview Detects path traversal checks that miss the empty string edge case.
 * When using startsWith('..') for path validation, an empty string from path.relative()
 * means "same directory" but is not caught by the traversal check.
 * Always check: rel === "" || rel.startsWith("..")
 */

"use strict";

/**
 * Check if a node is a comparison to empty string: x === '' or x === ""
 */
function isEmptyStringCheck(node) {
  if (node?.type !== "BinaryExpression") return false;
  if (node.operator !== "===" && node.operator !== "==") return false;
  return (
    (node.left.type === "Literal" && node.left.value === "") ||
    (node.right.type === "Literal" && node.right.value === "")
  );
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require empty string check in path traversal validation",
      recommended: true,
    },
    schema: [],
    messages: {
      missingEmptyCheck:
        'Path validation may miss empty string edge case. Add: rel === "" || rel.startsWith("..")',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for .startsWith('..')
        if (
          callee.type !== "MemberExpression" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "startsWith"
        ) {
          return;
        }

        const firstArg = node.arguments[0];
        if (firstArg?.type !== "Literal" || firstArg.value !== "..") {
          return;
        }

        // Check if there's a rel === '' check in the same logical expression
        const parent = node.parent;
        if (!parent) {
          context.report({ node, messageId: "missingEmptyCheck" });
          return;
        }

        // Walk up LogicalExpression (||) parents to find rel === '' check
        let hasEmptyCheck = false;
        let current = parent;
        while (current && current.type === "LogicalExpression" && current.operator === "||") {
          if (isEmptyStringCheck(current.left) || isEmptyStringCheck(current.right)) {
            hasEmptyCheck = true;
            break;
          }
          current = current.parent;
        }
        // Also check the immediate parent if it's a unary ! or logical &&
        if (!hasEmptyCheck && parent.type === "LogicalExpression") {
          if (isEmptyStringCheck(parent.left) || isEmptyStringCheck(parent.right)) {
            hasEmptyCheck = true;
          }
        }

        if (!hasEmptyCheck) {
          context.report({ node, messageId: "missingEmptyCheck" });
        }
      },
    };
  },
};
