/**
 * @fileoverview Detects trivial test assertions like expect(true).toBe(true)
 * that always pass without testing real behavior. These tests provide false
 * confidence and should assert on actual computed values.
 */

"use strict";

/**
 * Check if two Literal nodes have the same value.
 */
function sameLiteralValue(a, b) {
  if (a.type !== "Literal" || b.type !== "Literal") {
    return false;
  }
  return a.value === b.value;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow trivial test assertions that always pass",
      recommended: true,
    },
    schema: [],
    messages: {
      trivialAssertion: "Test assertion always passes without testing real behavior.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for expect(...).toBe(...) or expect(...).toEqual(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.property.type !== "Identifier" ||
          (callee.property.name !== "toBe" && callee.property.name !== "toEqual")
        ) {
          return;
        }

        // The object should be a CallExpression to expect(...)
        const expectCall = callee.object;
        if (
          expectCall.type !== "CallExpression" ||
          expectCall.callee.type !== "Identifier" ||
          expectCall.callee.name !== "expect"
        ) {
          return;
        }

        // Must have exactly one argument each
        if (expectCall.arguments.length !== 1 || node.arguments.length !== 1) {
          return;
        }

        const expectArg = expectCall.arguments[0];
        const matcherArg = node.arguments[0];

        // Both must be literals with the same value
        if (sameLiteralValue(expectArg, matcherArg)) {
          context.report({
            node,
            messageId: "trivialAssertion",
          });
        }
      },
    };
  },
};
