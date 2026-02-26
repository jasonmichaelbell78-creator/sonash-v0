/**
 * @fileoverview Detects division by variables that could be zero.
 * Division by zero returns Infinity/NaN silently. Guard with a zero check
 * or use a safePercent helper function.
 */

"use strict";

/** Extract the variable name from the left/right side of a > 0 or < 0 check */
function getCheckedName(test) {
  if (!test || test.type !== "BinaryExpression") return null;
  let nameNode;
  if (test.operator === ">" && test.right?.type === "Literal" && test.right.value === 0) {
    nameNode = test.left;
  } else if (test.operator === "<" && test.left?.type === "Literal" && test.left.value === 0) {
    nameNode = test.right;
  }
  if (!nameNode) return null;
  if (nameNode.type === "Identifier") return nameNode.name;
  if (
    nameNode.type === "MemberExpression" &&
    nameNode.object?.type === "Identifier" &&
    nameNode.property?.type === "Identifier"
  ) {
    return `${nameNode.object.name}.${nameNode.property.name}`;
  }
  return null;
}

/**
 * Check if the division is guarded by a > 0 check on the same divisor variable.
 */
function isGuarded(node, divisorName) {
  let current = node.parent;
  while (current) {
    if (current.type === "ConditionalExpression") {
      if (getCheckedName(current.test) === divisorName) return true;
    }
    if (current.type === "IfStatement") {
      if (getCheckedName(current.test) === divisorName) return true;
    }
    current = current.parent;
  }
  return false;
}

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
        else if (
          right.type === "MemberExpression" &&
          right.object?.type === "Identifier" &&
          right.property?.type === "Identifier"
        ) {
          name = `${right.object.name}.${right.property.name}`;
        }

        if (!name) return;
        // Check the property name (or full key) against dangerous names
        const propName = name.includes(".") ? name.split(".")[1] : name;
        if (!dangerousNames.has(propName)) return;

        // Skip if already guarded by a check on the same divisor
        if (isGuarded(node, name)) return;

        context.report({
          node,
          messageId: "unsafeDivision",
          data: { name },
        });
      },
    };
  },
};
