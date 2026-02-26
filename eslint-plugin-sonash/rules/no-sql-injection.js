/**
 * @fileoverview Detects SQL injection via string interpolation in queries.
 * Building SQL queries with template literals or concatenation allows
 * injection attacks. Use parameterized queries with placeholders instead.
 */

"use strict";

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
        const callee = node.callee;
        let funcName;

        // Member call: db.query(...), stmt.execute(...)
        if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          funcName = callee.property.name;
        }
        // Direct call: query(...)
        else if (callee.type === "Identifier") {
          funcName = callee.name;
        }

        if (!funcName || !queryFunctions.has(funcName)) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        // Flag template literals with expressions: query(`SELECT * FROM ${table}`)
        if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) {
          context.report({ node, messageId: "sqlInjection" });
          return;
        }

        // Flag string concatenation: query("SELECT * FROM " + table)
        if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") {
          context.report({ node, messageId: "sqlInjection" });
        }
      },
    };
  },
};
