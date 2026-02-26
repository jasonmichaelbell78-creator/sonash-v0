/**
 * @fileoverview Detects shell command injection via string interpolation.
 * Building shell commands with template literals or concatenation allows
 * attackers to inject arbitrary commands. Use execFileSync with array args.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow shell commands built with string interpolation",
      recommended: true,
    },
    schema: [],
    messages: {
      shellInjection:
        "Shell command built with string interpolation — command injection risk. Use execFileSync with array args instead.",
    },
  },

  create(context) {
    const execFunctions = new Set(["exec", "execSync"]);

    return {
      CallExpression(node) {
        const callee = node.callee;
        let funcName;

        // Direct call: exec(...) or execSync(...)
        if (callee.type === "Identifier") {
          funcName = callee.name;
        }
        // Member call: child_process.exec(...)
        else if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
          funcName = callee.property.name;
        }

        if (!funcName || !execFunctions.has(funcName)) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        // Flag template literals with expressions: exec(`cmd ${var}`)
        if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) {
          context.report({ node, messageId: "shellInjection" });
          return;
        }

        // Flag string concatenation: exec("cmd " + var)
        if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") {
          context.report({ node, messageId: "shellInjection" });
        }
      },
    };
  },
};
