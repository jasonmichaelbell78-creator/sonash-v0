/**
 * @fileoverview Detects console.error(err) or console.warn(err) logging raw
 * error objects. Raw error objects may expose stack traces and internal details
 * in production logs.
 */

"use strict";

const COMMON_ERROR_NAMES = new Set(["err", "error", "e", "ex", "exception"]);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow logging raw error objects with console.error or console.warn",
      recommended: true,
    },
    schema: [],
    messages: {
      rawErrorLog: "Logging raw error object may expose stack traces. Use sanitizeError(err).",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for console.error(...) or console.warn(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "console" ||
          callee.property.type !== "Identifier" ||
          (callee.property.name !== "error" && callee.property.name !== "warn")
        ) {
          return;
        }

        // Check if any argument is a bare Identifier with a common error name
        for (const arg of node.arguments) {
          if (arg.type === "Identifier" && COMMON_ERROR_NAMES.has(arg.name)) {
            context.report({
              node,
              messageId: "rawErrorLog",
            });
            return;
          }
        }
      },
    };
  },
};
