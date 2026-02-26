/**
 * @fileoverview Detects accessing .message on catch parameter without an
 * instanceof Error check. Non-Error values thrown at runtime will crash
 * when .message is accessed.
 */

"use strict";

function isAstNode(val) {
  return val && typeof val === "object" && typeof val.type === "string";
}

/**
 * Process a single child value — recurse if AST node, iterate if array.
 */
function visitChild(child, visitor) {
  if (Array.isArray(child)) {
    for (const item of child) {
      if (isAstNode(item)) walkAst(item, visitor);
    }
  } else if (isAstNode(child)) {
    walkAst(child, visitor);
  }
}

/**
 * Generic AST walker. Calls visitor(node) for every node in the subtree.
 * Skips the synthetic `parent` property to avoid infinite cycles.
 */
function walkAst(node, visitor) {
  if (!node) return;
  visitor(node);
  // Do not cross function boundaries — guards/accesses in nested functions
  // do not apply to the outer catch parameter
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (child && typeof child === "object") visitChild(child, visitor);
  }
}

/**
 * Check if a node contains an instanceof Error check for the given parameter name.
 */
function isErrorClass(node) {
  return node?.type === "Identifier" && node.name.endsWith("Error");
}

/** Check if an IfStatement test is `paramName instanceof SomeError` */
function isInstanceofGuardTest(test, paramName) {
  return (
    test?.type === "BinaryExpression" &&
    test.operator === "instanceof" &&
    test.left?.type === "Identifier" &&
    test.left.name === paramName &&
    isErrorClass(test.right)
  );
}

/** Check if node is contained within container (walk parent chain) */
function isNodeWithin(node, container) {
  let current = node;
  while (current) {
    if (current === container) return true;
    current = current.parent;
  }
  return false;
}

/** Check if a specific access node is guarded by an instanceof check in an ancestor IfStatement */
function isAccessGuarded(accessNode, paramName) {
  let current = accessNode.parent;
  while (current) {
    if (current.type === "IfStatement" && isInstanceofGuardTest(current.test, paramName)) {
      return current.consequent && isNodeWithin(accessNode, current.consequent);
    }
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Find all MemberExpression nodes accessing .message on the given parameter name.
 * Handles: err.message, err?.message, err["message"]
 */
function findMessageAccesses(blockBody, paramName) {
  const accesses = [];
  const seen = new WeakSet();

  const visitor = (node) => {
    // Handle ChainExpression (err?.message) — report the outer node, mark inner
    if (node.type === "ChainExpression" && node.expression?.type === "MemberExpression") {
      const member = node.expression;
      if (isMessageMember(member, paramName)) {
        seen.add(member);
        accesses.push(node);
      }
      return;
    }
    // Handle plain MemberExpression (err.message, err["message"]) — skip if already seen
    if (node.type === "MemberExpression" && !seen.has(node)) {
      if (isMessageMember(node, paramName)) {
        accesses.push(node);
      }
    }
  };

  for (const stmt of blockBody) {
    walkAst(stmt, visitor);
  }

  return accesses;
}

function isMessageMember(member, paramName) {
  const obj = member.object;
  const prop = member.property;
  if (obj?.type !== "Identifier" || obj.name !== paramName) return false;
  const isMessageIdentifier =
    !member.computed && prop?.type === "Identifier" && prop.name === "message";
  const isMessageComputed =
    member.computed && typeof prop?.value === "string" && prop.value === "message";
  return isMessageIdentifier || isMessageComputed;
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
        if (node.param?.type !== "Identifier") {
          return;
        }

        const paramName = node.param.name;
        const body = node.body.body;

        const accesses = findMessageAccesses(body, paramName);
        for (const access of accesses) {
          if (isAccessGuarded(access, paramName)) continue;
          context.report({
            node: access,
            messageId: "unsafeErrorAccess",
          });
        }
      },
    };
  },
};
