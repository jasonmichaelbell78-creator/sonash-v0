/**
 * @fileoverview Detects potential hardcoded API keys, secrets, passwords, and tokens.
 * Credentials should never be hardcoded in source. Use environment variables instead.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded API keys, secrets, and passwords",
      recommended: true,
    },
    schema: [],
    messages: {
      hardcodedSecret:
        "Potential hardcoded secret detected. Use environment variables: process.env.API_KEY",
    },
  },

  create(context) {
    const secretPattern =
      /^(?:api[_-]?key|apikey|secret|password|token|auth[_-]?token|access[_-]?key|private[_-]?key)$/i;
    const valuePattern = /^[A-Za-z0-9_/+=-]{20,}$/;
    const excludePattern =
      /^(?:test|mock|fake|dummy|example|placeholder|xxx+|your[_-]?api|insert[_-]?your)/i;

    function checkAssignment(nameNode, valueNode, reportNode) {
      if (!nameNode || !valueNode) return;

      // Get the variable/property name
      let name;
      if (nameNode.type === "Identifier") {
        name = nameNode.name;
      } else if (nameNode.type === "Literal" && typeof nameNode.value === "string") {
        name = nameNode.value;
      } else {
        return;
      }

      // Check if the name matches secret patterns
      if (!secretPattern.test(name)) return;

      // Check if the value is a string literal that looks like a real key
      if (valueNode.type !== "Literal" || typeof valueNode.value !== "string") return;
      if (!valuePattern.test(valueNode.value)) return;

      // Exclude obvious test/mock values
      if (excludePattern.test(valueNode.value)) return;

      context.report({ node: reportNode, messageId: "hardcodedSecret" });
    }

    return {
      // const apiKey = "AKIAIOSFODNN7EXAMPLE"
      VariableDeclarator(node) {
        checkAssignment(node.id, node.init, node);
      },

      // apiKey = "AKIAIOSFODNN7EXAMPLE"
      AssignmentExpression(node) {
        const left = node.left;
        if (left.type === "Identifier") {
          checkAssignment(left, node.right, node);
        } else if (left.type === "MemberExpression" && left.property) {
          checkAssignment(left.property, node.right, node);
        }
      },

      // { apiKey: "AKIAIOSFODNN7EXAMPLE" }
      Property(node) {
        checkAssignment(node.key, node.value, node);
      },
    };
  },
};
