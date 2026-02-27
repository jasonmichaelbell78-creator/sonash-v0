/**
 * @fileoverview Detects variable input in RegExp constructor without escaping.
 * Special regex characters in user input break the regex. Always escape with
 * str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') before constructing.
 */

"use strict";

const { unwrapNode } = require("../lib/ast-utils");

/** Check if the first arg is a safe static input (literal or empty template) */
function isSafeStaticInput(arg) {
  if (arg.type === "Literal" && (typeof arg.value === "string" || arg.regex != null)) return true;
  return arg.type === "TemplateLiteral" && arg.expressions.length === 0;
}

/** Check if the variable name suggests the input is already escaped */
function isEscapedVariable(node) {
  return node?.type === "Identifier" && /escape/i.test(node.name);
}

/** Check if the argument is a call to an escapeRegExp-like helper */
function isEscapeHelper(arg) {
  if (arg.type !== "CallExpression") return false;
  const unwrapped = unwrapNode(arg.callee);
  if (unwrapped.type === "Identifier") {
    return /escape.*regexp/i.test(unwrapped.name);
  }
  if (unwrapped.type === "MemberExpression" && unwrapped.property?.type === "Identifier") {
    return /escape.*regexp/i.test(unwrapped.property.name);
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unescaped variable input in RegExp constructor",
      recommended: true,
    },
    schema: [],
    messages: {
      unescapedInput:
        "Variable in RegExp constructor without escaping — special chars break regex. Escape input first: str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')",
    },
  },

  create(context) {
    function checkRegExpCtor(node) {
      if (node.callee.type !== "Identifier" || node.callee.name !== "RegExp") return;
      const firstArg = node.arguments[0];
      if (!firstArg) return;
      if (isSafeStaticInput(firstArg)) return;
      // Check the INPUT variable name (not the result variable) for "escape" hints
      if (isEscapedVariable(firstArg)) return;
      if (isEscapeHelper(firstArg)) return;
      // Also check if the input is a template literal where all expressions are escaped
      if (firstArg.type === "TemplateLiteral") {
        const allExpressionsEscaped = firstArg.expressions.every(
          (expr) => isEscapedVariable(expr) || isEscapeHelper(expr)
        );
        if (allExpressionsEscaped && firstArg.expressions.length > 0) return;
      }
      context.report({ node, messageId: "unescapedInput" });
    }

    return {
      NewExpression(node) {
        checkRegExpCtor(node);
      },
      CallExpression(node) {
        checkRegExpCtor(node);
      },
    };
  },
};
