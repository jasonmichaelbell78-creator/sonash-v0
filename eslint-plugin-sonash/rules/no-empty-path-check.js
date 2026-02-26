/**
 * @fileoverview Detects path traversal checks that miss the empty string edge case.
 * When using startsWith('..') for path validation, an empty string from path.relative()
 * means "same directory" but is not caught by the traversal check.
 * Always check: rel === "" || rel.startsWith("..")
 */

"use strict";

/**
 * Check if a node is a comparison to empty string for a specific variable:
 * relName === '' or '' === relName
 */
function isEmptyStringCheck(node, relName) {
  if (node?.type !== "BinaryExpression") return false;
  if (node.operator !== "===" && node.operator !== "==") return false;
  const isEmptyLiteral = (n) => n?.type === "Literal" && n.value === "";
  const isRelIdentifier = (n) => n?.type === "Identifier" && n.name === relName;
  return (
    (isRelIdentifier(node.left) && isEmptyLiteral(node.right)) ||
    (isRelIdentifier(node.right) && isEmptyLiteral(node.left))
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

        // Extract receiver variable name from .startsWith("..") call
        const receiver = callee.object;
        const receiverName = receiver?.type === "Identifier" ? receiver.name : null;
        if (!receiverName) {
          // Can't reliably enforce pattern when receiver isn't a simple identifier
          return;
        }

        // Check if there's a receiverName === '' check in the same logical expression
        const parent = node.parent;
        if (!parent) {
          context.report({ node, messageId: "missingEmptyCheck" });
          return;
        }

        // Walk up LogicalExpression (||) parents to find receiverName === '' check
        let hasEmptyCheck = false;
        let current = parent;
        while (current?.type === "LogicalExpression" && current.operator === "||") {
          if (
            isEmptyStringCheck(current.left, receiverName) ||
            isEmptyStringCheck(current.right, receiverName)
          ) {
            hasEmptyCheck = true;
            break;
          }
          current = current.parent;
        }
        // Also check the immediate parent if it's a logical &&
        if (!hasEmptyCheck && parent.type === "LogicalExpression") {
          if (
            isEmptyStringCheck(parent.left, receiverName) ||
            isEmptyStringCheck(parent.right, receiverName)
          ) {
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
