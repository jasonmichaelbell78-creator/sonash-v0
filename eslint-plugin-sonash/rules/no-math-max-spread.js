/**
 * @fileoverview Detects Math.max(...arr) without a length guard.
 * Math.max() with no arguments returns -Infinity, which is a common source
 * of subtle bugs when spreading an empty array.
 */

"use strict";

/**
 * Walk up the AST to check if the node is inside an IfStatement or
 * ConditionalExpression that tests .length > 0 on any variable.
 */
function hasLengthGuard(node) {
  let current = node.parent;
  while (current) {
    if (current.type === "IfStatement" && isLengthCheck(current.test)) {
      return true;
    }
    if (current.type === "ConditionalExpression" && isLengthCheck(current.test)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Check if a node is a .length > 0 comparison or similar.
 */
function isLengthCheck(node) {
  if (!node) {
    return false;
  }

  // Handle: arr.length > 0, arr.length !== 0, arr.length >= 1
  if (
    node.type === "BinaryExpression" &&
    (node.operator === ">" ||
      node.operator === ">=" ||
      node.operator === "!==" ||
      node.operator === "!=")
  ) {
    if (isLengthAccess(node.left) || isLengthAccess(node.right)) {
      return true;
    }
  }

  // Handle: arr.length (truthy check in if condition)
  if (isLengthAccess(node)) {
    return true;
  }

  // Handle: logical expressions (&&, ||)
  if (node.type === "LogicalExpression") {
    return isLengthCheck(node.left) || isLengthCheck(node.right);
  }

  return false;
}

/**
 * Check if a node is a .length member expression.
 */
function isLengthAccess(node) {
  return (
    node.type === "MemberExpression" &&
    node.property.type === "Identifier" &&
    node.property.name === "length"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require length guard before Math.max with spread arguments",
      recommended: true,
    },
    schema: [],
    messages: {
      mathMaxSpread: "Math.max(...arr) returns -Infinity on empty array. Add length guard.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for Math.max(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "Math" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "max"
        ) {
          return;
        }

        // Check if any argument is a SpreadElement
        const hasSpread = node.arguments.some((arg) => arg.type === "SpreadElement");

        if (!hasSpread) {
          return;
        }

        // Skip if inside a length guard
        if (hasLengthGuard(node)) {
          return;
        }

        context.report({
          node,
          messageId: "mathMaxSpread",
        });
      },
    };
  },
};
