/**
 * @fileoverview Detects writeFileSync calls without explicit encoding parameter.
 * Without encoding, the intent is unclear and may cause issues with binary vs text.
 * Always specify encoding: writeFileSync(path, data, 'utf-8').
 */

"use strict";

const { getCalleeName } = require("../lib/ast-utils");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require encoding parameter in writeFileSync calls",
      recommended: true,
    },
    schema: [],
    messages: {
      missingEncoding:
        "writeFileSync without explicit encoding — defaults to UTF-8 but intent is unclear. Add 'utf-8' as third argument.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (getCalleeName(node.callee) !== "writeFileSync") return;

        // writeFileSync(path, data) — missing encoding (only 2 args, string data only)
        if (node.arguments.length === 2) {
          const dataArg = node.arguments[1];
          const isStringLike =
            (dataArg?.type === "Literal" && typeof dataArg.value === "string") ||
            dataArg?.type === "TemplateLiteral" ||
            (dataArg?.type === "BinaryExpression" && dataArg.operator === "+");
          if (isStringLike) {
            context.report({ node, messageId: "missingEncoding" });
          }
        }
      },
    };
  },
};
