/**
 * @fileoverview Detects writeFileSync without atomic write pattern.
 * Direct writeFileSync can corrupt data on crash (partial writes).
 * Use atomic pattern: writeFileSync(path + '.tmp', data); renameSync('.tmp', path);
 */

"use strict";

const { getCalleeName } = require("../lib/ast-utils");

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

function visitAstChild(child, visitor, seen) {
  if (!child || typeof child !== "object") return;
  if (Array.isArray(child)) {
    for (const c of child) {
      if (c && typeof c.type === "string") walkAstNodes(c, visitor, seen);
    }
  } else if (typeof child.type === "string") {
    walkAstNodes(child, visitor, seen);
  }
}

function walkAstNodes(node, visitor, seen = new WeakSet()) {
  if (!node || seen.has(node)) return;
  seen.add(node);
  visitor(node);
  // Don't cross function boundaries — a renameSync inside a nested function
  // does not make the outer writeFileSync atomic
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    visitAstChild(node[key], visitor, seen);
  }
}

function containsCallTo(node, funcName) {
  if (!node) return false;
  let found = false;
  walkAstNodes(node, (n) => {
    if (!found && n.type === "CallExpression" && getCalleeName(n.callee) === funcName) {
      found = true;
    }
  });
  return found;
}

function containsRenameSyncFromTmp(node) {
  let found = false;
  walkAstNodes(node, (n) => {
    if (found) return;
    if (n.type !== "CallExpression" || getCalleeName(n.callee) !== "renameSync") return;
    const firstArg = n.arguments?.[0];
    if (firstArg && isWritingToTmpFile(firstArg)) found = true;
  });
  return found;
}

function hasRenameSyncNearby(block, targetNode) {
  const body = block.body;
  if (!Array.isArray(body)) return false;

  // Walk up from targetNode to find containing statement in the block
  let containingStmt = targetNode;
  while (containingStmt.parent && containingStmt.parent !== block) {
    containingStmt = containingStmt.parent;
  }
  const writeIndex = body.indexOf(containingStmt);

  // Check statements after the write for renameSync from a .tmp file (atomic rename step)
  const startIndex = writeIndex === -1 ? 0 : writeIndex + 1;
  for (let i = startIndex; i < body.length; i++) {
    if (containsRenameSyncFromTmp(body[i])) return true;
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
        if (getCalleeName(node.callee) !== "writeFileSync") return;

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
