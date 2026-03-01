/**
 * @fileoverview Detects useState initialized with an array where the setter
 * grows the array via spread/concat without applying a size limit (.slice()).
 * Unbounded array growth in state causes memory leaks and performance degradation.
 */

"use strict";

const { getCalleeName } = require("../lib/ast-utils");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unbounded array growth in React state without .slice() limit",
      recommended: true,
    },
    schema: [],
    messages: {
      unboundedArray:
        "Unbounded array growth in state — add size limit with .slice() to prevent memory leaks.",
    },
  },

  create(context) {
    // Track: setX name -> whether it has array-init useState
    const arrayStateSetters = new Map();

    return {
      // Detect: const [items, setItems] = useState([])
      VariableDeclarator(node) {
        if (
          !node.init ||
          node.init.type !== "CallExpression" ||
          getCalleeName(node.init.callee) !== "useState"
        ) {
          return;
        }

        const initArg = node.init.arguments[0];
        // Only track if initialized with array literal
        if (!initArg || initArg.type !== "ArrayExpression") return;

        // Get the setter name from destructuring: [items, setItems]
        if (
          node.id &&
          node.id.type === "ArrayPattern" &&
          node.id.elements.length >= 2 &&
          node.id.elements[1] &&
          node.id.elements[1].type === "Identifier"
        ) {
          arrayStateSetters.set(node.id.elements[1].name, true);
        }
      },

      // Detect: setItems(prev => [...prev, newItem]) without .slice()
      CallExpression(node) {
        const funcName = getCalleeName(node.callee);
        if (!funcName || !arrayStateSetters.has(funcName)) return;

        const arg = node.arguments[0];
        if (!arg) return;

        // Check for updater function: setItems(prev => [...prev, item])
        if (arg.type === "ArrowFunctionExpression" || arg.type === "FunctionExpression") {
          const body =
            arg.body.type === "BlockStatement" ? getReturnExpression(arg.body) : arg.body;

          if (body && isUnboundedSpread(body)) {
            context.report({ node, messageId: "unboundedArray" });
          }
        }
      },
    };

    /**
     * Get the return expression from a block statement.
     */
    function getReturnExpression(block) {
      for (const stmt of block.body) {
        if (stmt.type === "ReturnStatement" && stmt.argument) {
          return stmt.argument;
        }
      }
      return null;
    }

    /**
     * Check if expression is [...prev, item] without .slice().
     */
    function isUnboundedSpread(expr) {
      // Direct array spread: [...prev, newItem]
      if (expr.type === "ArrayExpression") {
        const hasSpread = expr.elements.some((el) => el && el.type === "SpreadElement");
        return hasSpread;
      }

      // .concat() call: prev.concat(newItem)
      if (expr.type === "CallExpression" && getCalleeName(expr.callee) === "concat") {
        return true;
      }

      // If it's [...prev, item].slice(-N), it's bounded — safe
      if (expr.type === "CallExpression" && getCalleeName(expr.callee) === "slice") {
        return false;
      }

      return false;
    }
  },
};
