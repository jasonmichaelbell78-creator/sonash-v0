/**
 * Shared AST utility functions for eslint-plugin-sonash rules.
 * Reduces code duplication across rule implementations.
 */

"use strict";

/**
 * Extract the function name from a CallExpression callee node.
 * Handles Identifier (bare calls) and MemberExpression (obj.method) forms.
 * Returns null if the callee is not determinable.
 */
function getCalleeName(callee) {
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (callee.type === "MemberExpression" && callee.property?.type === "Identifier") {
    return callee.property.name;
  }
  return null;
}

/**
 * Find the closest function or program scope ancestor.
 * Useful for scope-based analysis (e.g., tracking calls within the same scope).
 */
function getEnclosingScope(node) {
  let current = node.parent;
  while (current) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression" ||
      current.type === "Program"
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Check if an argument node contains string interpolation (template literal with
 * expressions or string concatenation). Used for injection detection rules.
 */
function hasStringInterpolation(argNode) {
  if (!argNode) return false;
  if (argNode.type === "TemplateLiteral" && argNode.expressions.length > 0) return true;
  if (argNode.type === "BinaryExpression" && argNode.operator === "+") return true;
  return false;
}

module.exports = {
  getCalleeName,
  getEnclosingScope,
  hasStringInterpolation,
};
