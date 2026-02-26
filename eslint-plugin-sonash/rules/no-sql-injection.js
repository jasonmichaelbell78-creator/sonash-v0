/**
 * @fileoverview Detects SQL injection via string interpolation in queries.
 * Building SQL queries with template literals or concatenation allows
 * injection attacks. Use parameterized queries with placeholders instead.
 */

"use strict";

const { getCalleeName, hasStringInterpolation } = require("../lib/ast-utils");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow SQL queries built with string interpolation",
      recommended: true,
    },
    schema: [],
    messages: {
      sqlInjection:
        "SQL query built with string interpolation — injection risk. Use parameterized queries with placeholders (e.g., db.query('SELECT * FROM users WHERE id = ?', [userId])).",
    },
  },

  create(context) {
    const queryFunctions = new Set(["query", "exec", "execute", "prepare", "run", "all", "get"]);

    return {
      CallExpression(node) {
        const funcName = getCalleeName(node.callee);
        if (!funcName || !queryFunctions.has(funcName)) return;

        if (hasStringInterpolation(node.arguments[0])) {
          context.report({ node, messageId: "sqlInjection" });
        }
      },
    };
  },
};
