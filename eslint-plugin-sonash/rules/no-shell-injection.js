/**
 * @fileoverview Detects shell command injection via string interpolation.
 * Building shell commands with template literals or concatenation allows
 * attackers to inject arbitrary commands. Use execFileSync with array args.
 */

"use strict";

const { getCalleeName, hasStringInterpolation } = require("../lib/ast-utils");

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
        const funcName = getCalleeName(node.callee);
        if (!funcName || !execFunctions.has(funcName)) return;

        if (hasStringInterpolation(node.arguments[0])) {
          context.report({ node, messageId: "shellInjection" });
        }
      },
    };
  },
};
