/**
 * @fileoverview Detects unbounded .* or .+ in dynamic RegExp constructors.
 * These can cause ReDoS (Regular Expression Denial of Service) or performance
 * issues. Use bounded quantifiers like .{0,N}? instead.
 */

"use strict";

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

/** Check if a callee is a RegExp constructor (direct or member) */
function isRegExpCallee(callee) {
  if (callee.type === "Identifier" && callee.name === "RegExp") return true;
  return (
    callee.type === "MemberExpression" &&
    callee.property?.type === "Identifier" &&
    callee.property.name === "RegExp"
  );
}

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
    function checkRegExpCall(node, callee, args) {
      if (!isRegExpCallee(callee)) return;
      const firstArg = args[0];
      if (!firstArg) return;
      const parts = getStaticParts(firstArg);
      if (parts.some((p) => hasUnboundedDot(p))) {
        context.report({ node, messageId: "unboundedRegex" });
      }
    }

    return {
      NewExpression(node) {
        checkRegExpCall(node, node.callee, node.arguments);
      },
      CallExpression(node) {
        checkRegExpCall(node, node.callee, node.arguments);
      },
    };
  },
};
