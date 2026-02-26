/**
 * Shared AST utility functions for eslint-plugin-sonash rules.
 * Reduces code duplication across rule implementations.
 */

"use strict";

/**
 * Extract the function name from a CallExpression callee node.
 * Handles Identifier (bare calls), MemberExpression (obj.method),
 * and ChainExpression (obj?.method) forms for optional chaining support.
 * Returns null if the callee is not determinable.
 */
function getCalleeName(callee) {
  if (!callee) return null;
  // Unwrap ChainExpression (optional chaining: fs?.readFileSync())
  const node = callee.type === "ChainExpression" ? callee.expression : callee;
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "MemberExpression" && node.property?.type === "Identifier") {
    return node.property.name;
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
 * expressions or string concatenation). Recursively checks BinaryExpression
 * children to catch nested concatenation like: "SELECT " + (prefix + userInput).
 * Used for injection detection rules.
 */
function hasStringInterpolation(argNode) {
  if (!argNode) return false;
  if (argNode.type === "TemplateLiteral" && argNode.expressions.length > 0) return true;
  if (argNode.type === "BinaryExpression" && argNode.operator === "+") return true;
  // Recurse into conditional/logical expressions to catch nested interpolation
  if (argNode.type === "ConditionalExpression") {
    return hasStringInterpolation(argNode.consequent) || hasStringInterpolation(argNode.alternate);
  }
  if (argNode.type === "LogicalExpression") {
    return hasStringInterpolation(argNode.left) || hasStringInterpolation(argNode.right);
  }
  return false;
}

module.exports = {
  getCalleeName,
  getEnclosingScope,
  hasStringInterpolation,
};
