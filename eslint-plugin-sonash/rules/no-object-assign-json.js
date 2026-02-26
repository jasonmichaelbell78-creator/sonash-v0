/**
 * @fileoverview Detects Object.assign({}, JSON.parse(...)) — prototype pollution risk.
 * Parsed JSON can carry __proto__ keys which Object.assign copies onto the target,
 * polluting the object prototype. Use structuredClone() or filter dangerous keys.
 */

"use strict";

const DANGEROUS_IDENTIFIER_NAMES = new Set(["parsed", "item", "entry", "record", "finding", "doc"]);

/**
 * Check if a node is an empty object literal {}.
 */
function isEmptyObjectLiteral(node) {
  return node.type === "ObjectExpression" && node.properties.length === 0;
}

/**
 * Check if a node is a JSON.parse(...) call.
 */
function isJsonParseCall(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "Identifier" &&
    node.callee.object.name === "JSON" &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "parse"
  );
}

/**
 * Check if a node is an Identifier with a common parsed-data name.
 */
function isDangerousIdentifier(node) {
  return node.type === "Identifier" && DANGEROUS_IDENTIFIER_NAMES.has(node.name);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Object.assign from parsed JSON to prevent prototype pollution",
      recommended: true,
    },
    schema: [],
    messages: {
      objectAssignJson:
        "Object.assign from parsed JSON can carry __proto__. Use structuredClone() or filter dangerous keys.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for Object.assign(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "Object" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "assign"
        ) {
          return;
        }

        // Must have at least 2 arguments
        if (node.arguments.length < 2) {
          return;
        }

        const firstArg = node.arguments[0];
        const secondArg = node.arguments[1];

        // First arg must be empty object literal {}
        if (!isEmptyObjectLiteral(firstArg)) {
          return;
        }

        // Second arg must be JSON.parse(...) or a dangerous identifier
        if (isJsonParseCall(secondArg) || isDangerousIdentifier(secondArg)) {
          context.report({
            node,
            messageId: "objectAssignJson",
          });
        }
      },
    };
  },
};
