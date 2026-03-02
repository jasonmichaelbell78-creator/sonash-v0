/**
 * @fileoverview Detects useEffect with inline function expressions in the
 * dependency array. Inline functions create new references every render,
 * causing useEffect to re-run on every render. Use useCallback instead.
 */

"use strict";

const { getCalleeName } = require("../lib/ast-utils");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow inline functions in useEffect dependency array",
      recommended: true,
    },
    schema: [],
    messages: {
      callbackInDeps:
        "Inline function in useEffect deps causes re-run every render. Wrap with useCallback.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const funcName = getCalleeName(node.callee);
        if (funcName !== "useEffect" && funcName !== "useLayoutEffect") return;

        // Second argument is the deps array
        const depsArg = node.arguments[1];
        if (depsArg?.type !== "ArrayExpression") return;

        for (const element of depsArg.elements) {
          if (!element) continue;
          if (element.type === "ArrowFunctionExpression" || element.type === "FunctionExpression") {
            context.report({ node: element, messageId: "callbackInDeps" });
          }
        }
      },
    };
  },
};
