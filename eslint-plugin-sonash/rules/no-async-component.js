/**
 * @fileoverview Detects async function components. React client components
 * cannot be async — async functions return Promises, not React elements.
 * Server components (app/ directory) are excluded.
 */

"use strict";

/**
 * Check if a function body contains JSX return.
 */
function returnsJSX(node) {
  const body = node.body;
  if (!body) return false;

  // Arrow function with expression body returning JSX
  if (body.type === "JSXElement" || body.type === "JSXFragment") {
    return true;
  }

  // Block body — check return statements
  if (body.type === "BlockStatement") {
    return body.body.some(
      (stmt) =>
        stmt.type === "ReturnStatement" &&
        stmt.argument &&
        (stmt.argument.type === "JSXElement" ||
          stmt.argument.type === "JSXFragment" ||
          // Return wrapped in parens
          (stmt.argument.type === "ParenthesizedExpression" &&
            stmt.argument.expression &&
            (stmt.argument.expression.type === "JSXElement" ||
              stmt.argument.expression.type === "JSXFragment")))
    );
  }

  return false;
}

/**
 * Check if a function has a PascalCase name (React component convention).
 */
function isPascalCase(name) {
  return /^[A-Z]/.test(name);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow async React client components",
      recommended: true,
    },
    schema: [],
    messages: {
      asyncComponent:
        "Client components cannot be async functions. Use useEffect for async operations.",
    },
  },

  create(context) {
    function checkAsyncComponent(node, name) {
      if (!node.async) return;
      if (!name || !isPascalCase(name)) return;
      if (!returnsJSX(node)) return;

      context.report({ node, messageId: "asyncComponent" });
    }

    return {
      FunctionDeclaration(node) {
        checkAsyncComponent(node, node.id?.name);
      },

      // Arrow functions: const MyComponent = async () => <div/>
      "VariableDeclarator > ArrowFunctionExpression"(node) {
        const parent = node.parent;
        if (
          parent?.type === "VariableDeclarator" &&
          parent.id?.type === "Identifier"
        ) {
          checkAsyncComponent(node, parent.id.name);
        }
      },
    };
  },
};
