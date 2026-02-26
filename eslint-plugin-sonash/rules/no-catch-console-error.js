/**
 * @fileoverview Detects .catch(console.error) — unsanitized error logging.
 * Passing console.error directly to .catch() exposes raw error objects
 * including stack traces. Wrap with a sanitizer instead.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow .catch(console.error) for unsanitized error logging",
      recommended: true,
    },
    schema: [],
    messages: {
      catchConsoleError:
        ".catch(console.error) exposes raw errors. Use .catch(e => console.error(sanitizeError(e)))",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for .catch(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "catch"
        ) {
          return;
        }

        // Check first argument is console.error
        const firstArg = node.arguments[0];
        if (
          firstArg?.type === "MemberExpression" &&
          firstArg.object?.type === "Identifier" &&
          firstArg.object.name === "console" &&
          firstArg.property.type === "Identifier" &&
          firstArg.property.name === "error"
        ) {
          context.report({
            node,
            messageId: "catchConsoleError",
          });
        }
      },
    };
  },
};
