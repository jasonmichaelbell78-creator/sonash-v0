/**
 * @fileoverview Detects setState/dispatch calls in component render body
 * (outside useEffect/handlers). Calling setState during render causes
 * infinite re-render loops.
 */

"use strict";

const { getCalleeName } = require("../lib/ast-utils");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow state updates during render (outside effects and handlers)",
      recommended: true,
    },
    schema: [],
    messages: {
      stateUpdateInRender:
        "State update during render causes infinite re-render loop. Move to useEffect or an event handler.",
    },
  },

  create(context) {
    const setStatePattern = /^set[A-Z]/;
    const safeWrappers = new Set(["useEffect", "useLayoutEffect", "useCallback"]);

    /**
     * Check if node is inside a function that is a React component.
     * Components are PascalCase functions that contain JSX.
     */
    function getComponentAncestor(node) {
      let current = node.parent;
      while (current) {
        if (
          current.type === "FunctionDeclaration" &&
          current.id &&
          /^[A-Z]/.test(current.id.name)
        ) {
          return current;
        }
        if (
          (current.type === "ArrowFunctionExpression" || current.type === "FunctionExpression") &&
          current.parent &&
          current.parent.type === "VariableDeclarator" &&
          current.parent.id &&
          current.parent.id.type === "Identifier" &&
          /^[A-Z]/.test(current.parent.id.name)
        ) {
          return current;
        }
        current = current.parent;
      }
      return null;
    }

    /**
     * Check if node is inside a safe wrapper (useEffect callback, event handler, useCallback).
     */
    function isInsideSafeWrapper(node, componentNode) {
      let current = node.parent;
      while (current && current !== componentNode) {
        // Inside useEffect/useLayoutEffect/useCallback callback
        if (current.type === "CallExpression" && safeWrappers.has(getCalleeName(current.callee))) {
          return true;
        }
        // Inside an event handler (arrow function or function expression assigned to on* prop or variable)
        if (
          (current.type === "ArrowFunctionExpression" || current.type === "FunctionExpression") &&
          current.parent
        ) {
          // JSX attribute handler: onClick={(...) => ...}
          if (current.parent.type === "JSXExpressionContainer") {
            return true;
          }
          // Named handler: const handleClick = () => { setState(...) }
          if (
            current.parent.type === "VariableDeclarator" &&
            current.parent.id &&
            current.parent.id.type === "Identifier" &&
            /^(handle|on)[A-Z]/.test(current.parent.id.name)
          ) {
            return true;
          }
        }
        current = current.parent;
      }
      return false;
    }

    return {
      CallExpression(node) {
        const funcName = getCalleeName(node.callee);
        if (!funcName) return;

        // Match setState pattern (setCount, setItems, etc.) or dispatch
        if (!setStatePattern.test(funcName) && funcName !== "dispatch") return;

        const component = getComponentAncestor(node);
        if (!component) return;

        if (!isInsideSafeWrapper(node, component)) {
          context.report({ node, messageId: "stateUpdateInRender" });
        }
      },
    };
  },
};
