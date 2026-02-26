/**
 * @fileoverview Detects writeFileSync calls without explicit encoding parameter.
 * Without encoding, the intent is unclear and may cause issues with binary vs text.
 * Always specify encoding: writeFileSync(path, data, 'utf-8').
 */

"use strict";

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
        const callee = node.callee;
        let funcName;

        // Direct call: writeFileSync(...)
        if (callee.type === "Identifier") {
          funcName = callee.name;
        }
        // Member call: fs.writeFileSync(...)
        else if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          funcName = callee.property.name;
        }

        if (funcName !== "writeFileSync") return;

        // writeFileSync(path, data) — missing encoding (only 2 args)
        if (node.arguments.length === 2) {
          context.report({ node, messageId: "missingEncoding" });
        }
      },
    };
  },
};
