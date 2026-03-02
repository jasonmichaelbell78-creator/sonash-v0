/**
 * @fileoverview Detects useEffect callbacks that create setInterval/setTimeout
 * but return no cleanup function. Missing cleanup causes memory leaks and
 * stale timer references when the component unmounts.
 */

"use strict";

const { getCalleeName } = require("../lib/ast-utils");

/**
 * Check if a function body has a return statement with an argument
 * (i.e., returns a cleanup function).
 */
function hasCleanupReturn(body) {
  if (!body?.type || body.type !== "BlockStatement") return false;
  return body.body.some((stmt) => stmt.type === "ReturnStatement" && stmt.argument !== null);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow useEffect with setInterval/setTimeout but no cleanup return",
      recommended: true,
    },
    schema: [],
    messages: {
      missingCleanup:
        "useEffect sets interval/timeout but returns no cleanup function. Return a cleanup function that clears the timer.",
    },
  },

  create(context) {
    const timerFunctions = new Set(["setInterval", "setTimeout"]);

    /**
     * Check if a function body contains a call to setInterval or setTimeout.
     */
    function hasTimerCall(body) {
      if (!body) return false;
      const statements = body.type === "BlockStatement" ? body.body : [body];
      for (const stmt of statements) {
        if (containsTimerCall(stmt)) return true;
      }
      return false;
    }

    /**
     * Recursively check AST nodes for timer calls.
     */
    function containsTimerCall(node) {
      if (!node || typeof node !== "object") return false;
      if (node.type === "CallExpression" && timerFunctions.has(getCalleeName(node.callee))) {
        return true;
      }
      // Check variable declarations with timer calls
      if (node.type === "VariableDeclaration") {
        return node.declarations.some((d) => d.init && containsTimerCall(d.init));
      }
      if (node.type === "ExpressionStatement") {
        return containsTimerCall(node.expression);
      }
      if (node.type === "AssignmentExpression") {
        return containsTimerCall(node.right);
      }
      return false;
    }

    return {
      CallExpression(node) {
        const funcName = getCalleeName(node.callee);
        if (funcName !== "useEffect") return;

        const callback = node.arguments[0];
        if (!callback) return;

        // Get the callback body
        const body =
          callback.type === "ArrowFunctionExpression" || callback.type === "FunctionExpression"
            ? callback.body
            : null;

        if (!body) return;

        // For arrow functions with expression body, no timer calls are typical
        if (body.type !== "BlockStatement") return;

        if (hasTimerCall(body) && !hasCleanupReturn(body)) {
          context.report({ node, messageId: "missingCleanup" });
        }
      },
    };
  },
};
