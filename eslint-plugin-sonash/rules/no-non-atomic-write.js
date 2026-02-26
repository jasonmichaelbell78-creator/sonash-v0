/**
 * @fileoverview Detects writeFileSync without atomic write pattern.
 * Direct writeFileSync can corrupt data on crash (partial writes).
 * Use atomic pattern: writeFileSync(path + '.tmp', data); renameSync('.tmp', path);
 */

"use strict";

function findContainingBlock(node) {
  let current = node.parent;
  while (current) {
    if (current.type === "BlockStatement" || current.type === "Program") {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function isCallToFunc(node, funcName) {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee.type === "Identifier") return callee.name === funcName;
  return callee.type === "MemberExpression" && callee.property?.name === funcName;
}

function containsCallTo(node, funcName) {
  if (!node) return false;
  if (node.type === "ExpressionStatement") return containsCallTo(node.expression, funcName);
  if (isCallToFunc(node, funcName)) return true;
  if (node.type === "TryStatement") {
    return containsCallTo(node.block, funcName) || containsCallTo(node.handler?.body, funcName);
  }
  if (node.type === "BlockStatement" && Array.isArray(node.body)) {
    return node.body.some((s) => containsCallTo(s, funcName));
  }
  if (node.type === "IfStatement") {
    return containsCallTo(node.consequent, funcName) || containsCallTo(node.alternate, funcName);
  }
  return false;
}

function hasRenameSyncNearby(block, targetNode) {
  const body = block.body;
  if (!Array.isArray(body)) return false;

  // Find the statement containing the writeFileSync
  const writeIndex = body.findIndex(
    (stmt) => stmt.range?.[0] <= targetNode.range?.[0] && stmt.range?.[1] >= targetNode.range?.[1]
  );

  // Check statements after the write for renameSync/unlinkSync
  const startIndex = writeIndex === -1 ? 0 : writeIndex + 1;
  for (let i = startIndex; i < body.length; i++) {
    if (containsCallTo(body[i], "renameSync")) return true;
    if (containsCallTo(body[i], "unlinkSync")) return true;
  }
  return false;
}

function isWritingToTmpFile(firstArg) {
  if (!firstArg) return false;

  // Template literal ending in .tmp: `${path}.tmp`
  if (firstArg.type === "TemplateLiteral") {
    const lastQuasi = firstArg.quasis[firstArg.quasis.length - 1];
    if (lastQuasi?.value.raw.endsWith(".tmp")) return true;
  }
  // String concatenation ending in .tmp: path + '.tmp'
  if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") {
    const right = firstArg.right;
    if (
      right.type === "Literal" &&
      typeof right.value === "string" &&
      right.value.endsWith(".tmp")
    ) {
      return true;
    }
  }
  // Variable that looks like a tmp path
  if (firstArg.type === "Identifier" && /tmp/i.test(firstArg.name)) return true;

  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require atomic write pattern for writeFileSync",
      recommended: true,
    },
    schema: [],
    messages: {
      nonAtomicWrite:
        "writeFileSync without atomic write pattern — partial writes on crash corrupt data. Write to .tmp first, then rename.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        let funcName;

        if (callee.type === "Identifier") {
          funcName = callee.name;
        } else if (callee.type === "MemberExpression" && callee.property?.type === "Identifier") {
          funcName = callee.property.name;
        }

        if (funcName !== "writeFileSync") return;

        // Check the first argument — if it's writing to a .tmp file, this IS the atomic pattern
        if (isWritingToTmpFile(node.arguments[0])) return;

        // Look in the same function/block for renameSync nearby (atomic pattern)
        const block = findContainingBlock(node);
        if (block && hasRenameSyncNearby(block, node)) return;

        context.report({ node, messageId: "nonAtomicWrite" });
      },
    };
  },
};
