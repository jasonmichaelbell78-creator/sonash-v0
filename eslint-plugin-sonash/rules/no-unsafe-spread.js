/**
 * @fileoverview Detects spreading unknown/untyped objects into JSX props.
 * Unsafe spreads can override safety-critical props like onClick, href,
 * or action, leading to XSS or unintended behavior.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow unsafe spread of unknown objects into JSX attributes",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeSpread:
        "Unsafe spread may override critical props (onClick, href, action). Destructure and spread only known-safe properties.",
    },
  },

  create(context) {
    return {
      JSXSpreadAttribute(node) {
        const arg = node.argument;
        if (!arg) return;

        // Allow spreading object literals — they are visible and auditable
        if (arg.type === "ObjectExpression") return;

        // Allow spreading rest element from destructured props (e.g., ...rest from const { a, ...rest } = props)
        // Heuristic: if it's a simple identifier named "rest" or "props" that's fine
        // But unknown identifiers from function params or external sources are risky
        if (arg.type === "Identifier") {
          const name = arg.name;
          // Known safe patterns: destructured rest, props itself
          if (name === "rest" || name === "restProps") return;
        }

        context.report({ node, messageId: "unsafeSpread" });
      },
    };
  },
};
