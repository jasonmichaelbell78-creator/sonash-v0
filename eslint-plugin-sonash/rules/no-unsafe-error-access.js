/**
 * @fileoverview Detects accessing .message on catch parameter without an
 * instanceof Error check. Non-Error values thrown at runtime will crash
 * when .message is accessed.
 */

"use strict";

/**
 * Check if a node contains an instanceof Error check for the given parameter name.
 */
function hasInstanceofErrorCheck(blockBody, paramName) {
  let found = false;

  function walk(node) {
    if (!node || found) {
      return;
    }

    if (
      node.type === "BinaryExpression" &&
      node.operator === "instanceof" &&
      node.left.type === "Identifier" &&
      node.left.name === paramName &&
      node.right.type === "Identifier" &&
      node.right.name === "Error"
    ) {
      found = true;
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === "parent") {
        continue;
      }
      const child = node[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string") {
              walk(item);
            }
          }
        } else if (typeof child.type === "string") {
          walk(child);
        }
      }
    }
  }

  for (const stmt of blockBody) {
    walk(stmt);
  }

  return found;
}

/**
 * Find all MemberExpression nodes accessing .message on the given parameter name.
 */
function findMessageAccesses(blockBody, paramName) {
  const accesses = [];

  function walk(node) {
    if (!node) {
      return;
    }

    if (
      node.type === "MemberExpression" &&
      node.object.type === "Identifier" &&
      node.object.name === paramName &&
      node.property.type === "Identifier" &&
      node.property.name === "message"
    ) {
      accesses.push(node);
    }

    for (const key of Object.keys(node)) {
      if (key === "parent") {
        continue;
      }
      const child = node[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string") {
              walk(item);
            }
          }
        } else if (typeof child.type === "string") {
          walk(child);
        }
      }
    }
  }

  for (const stmt of blockBody) {
    walk(stmt);
  }

  return accesses;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require instanceof Error check before accessing .message on catch parameter",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeErrorAccess:
        "Unsafe error.message access — non-Error values crash. Use: error instanceof Error ? error.message : String(error)",
    },
  },

  create(context) {
    return {
      CatchClause(node) {
        const param = node.param;
        if (!param || param.type !== "Identifier") {
          return;
        }

        const paramName = param.name;
        const body = node.body.body;

        if (hasInstanceofErrorCheck(body, paramName)) {
          return;
        }

        const accesses = findMessageAccesses(body, paramName);
        for (const access of accesses) {
          context.report({
            node: access,
            messageId: "unsafeErrorAccess",
          });
        }
      },
    };
  },
};
