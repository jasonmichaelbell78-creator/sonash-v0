/**
 * @fileoverview Detects Suspense usage without an ErrorBoundary wrapper.
 * Suspense can throw errors during lazy loading or data fetching.
 * Without ErrorBoundary, these errors crash the entire app.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require ErrorBoundary wrapper around Suspense components",
      recommended: true,
    },
    schema: [],
    messages: {
      missingSuspenseBoundary: "Suspense should be wrapped in ErrorBoundary for error handling.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        // Only check for <Suspense> elements
        if (node.name?.type !== "JSXIdentifier" || node.name.name !== "Suspense") {
          return;
        }

        // Walk up ancestors looking for ErrorBoundary
        let current = node.parent;
        while (current) {
          if (
            current.type === "JSXElement" &&
            current.openingElement?.name?.type === "JSXIdentifier" &&
            current.openingElement.name.name === "ErrorBoundary"
          ) {
            return; // Found ErrorBoundary ancestor
          }
          current = current.parent;
        }

        context.report({ node, messageId: "missingSuspenseBoundary" });
      },
    };
  },
};
