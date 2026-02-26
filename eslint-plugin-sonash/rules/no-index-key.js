/**
 * @fileoverview Detects array index used as React key prop.
 * Using array index as key causes unnecessary re-renders and bugs when
 * list items are reordered. Use a stable unique identifier instead.
 */

"use strict";

/**
 * Check if an expression node references "index" (common map callback parameter name).
 */
function containsIndexIdentifier(node) {
  if (!node) return false;
  const n = node.type === "ChainExpression" ? node.expression : node;
  if (n.type === "Identifier" && n.name === "index") return true;
  if (n.type === "MemberExpression") {
    return containsIndexIdentifier(n.object) || (n.computed && containsIndexIdentifier(n.property));
  }
  if (n.type === "BinaryExpression") {
    return containsIndexIdentifier(n.left) || containsIndexIdentifier(n.right);
  }
  if (n.type === "TemplateLiteral") {
    return n.expressions.some(containsIndexIdentifier);
  }
  if (n.type === "CallExpression") {
    return containsIndexIdentifier(n.callee) || n.arguments.some(containsIndexIdentifier);
  }
  return false;
}

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
    return {
      JSXAttribute(node) {
        // Check for key={...} attribute
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "key") {
          return;
        }

        // Value must be a JSX expression container: key={expr}
        if (node.value?.type !== "JSXExpressionContainer") {
          return;
        }

        if (containsIndexIdentifier(node.value.expression)) {
          context.report({ node, messageId: "indexKey" });
        }
      },
    };
  },
};
