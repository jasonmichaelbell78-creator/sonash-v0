/**
 * @fileoverview Detects array index used as React key prop.
 * Using array index as key causes unnecessary re-renders and bugs when
 * list items are reordered. Use a stable unique identifier instead.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow array index as React key prop",
      recommended: true,
    },
    schema: [],
    messages: {
      indexKey:
        "Array index used as React key — causes re-render bugs on reorder. Use a stable unique id: key={item.id}",
    },
  },

  create(context) {
    /**
     * Check if an expression node references "index" (common map callback parameter name).
     */
    function containsIndexIdentifier(node) {
      if (!node) return false;
      if (node.type === "Identifier" && node.name === "index") return true;
      if (node.type === "BinaryExpression") {
        return containsIndexIdentifier(node.left) || containsIndexIdentifier(node.right);
      }
      if (node.type === "TemplateLiteral") {
        return node.expressions.some(containsIndexIdentifier);
      }
      if (node.type === "CallExpression") {
        return node.arguments.some(containsIndexIdentifier);
      }
      return false;
    }

    return {
      JSXAttribute(node) {
        // Check for key={...} attribute
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "key") {
          return;
        }

        // Value must be a JSX expression container: key={expr}
        if (!node.value || node.value.type !== "JSXExpressionContainer") {
          return;
        }

        if (containsIndexIdentifier(node.value.expression)) {
          context.report({ node, messageId: "indexKey" });
        }
      },
    };
  },
};
