/**
 * @fileoverview Detects clickable <div> elements without ARIA role attribute.
 * A <div> with onClick but no role is inaccessible to screen readers.
 * Use role="button" or replace with a <button> element.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require role attribute on clickable div elements",
      recommended: true,
    },
    schema: [],
    messages: {
      missingRole:
        'Clickable <div> without role attribute — inaccessible to screen readers. Add role="button" or use <button>.',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        // Only check <div> elements
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "div") {
          return;
        }

        let hasOnClick = false;
        let hasRole = false;
        let hasSpread = false;

        for (const attr of node.attributes) {
          if (attr.type === "JSXSpreadAttribute") {
            hasSpread = true;
            continue;
          }
          if (attr.type !== "JSXAttribute" || !attr.name) continue;
          const name = attr.name.name;
          if (name === "onClick") hasOnClick = true;
          if (name === "role") hasRole = true;
        }

        if (hasOnClick && !hasRole && !hasSpread) {
          context.report({ node, messageId: "missingRole" });
        }
      },
    };
  },
};
