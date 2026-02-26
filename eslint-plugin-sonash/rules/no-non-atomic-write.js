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

function getEnclosingTryStatement(node) {
  let prev = node;
  let current = node.parent;
  while (current) {
    if (current.type === "TryStatement" && prev === current.block) return current;
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    )
      return null;
    prev = current;
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

/** Check if a variable was assigned a .tmp path in the containing block */
function isVarAssignedToTmp(argNode, renameNode) {
  const block = findContainingBlock(renameNode);
  const body = block?.body;
  if (!Array.isArray(body)) return false;
  for (const stmt of body) {
    if (stmt.type !== "VariableDeclaration") continue;
    for (const decl of stmt.declarations) {
      if (
        decl.id?.type === "Identifier" &&
        decl.id.name === argNode.name &&
        isWritingToTmpFile(decl.init)
      ) {
        return true;
      }
    }
  }
  return false;
}

/** Check if a renameSync first arg references a .tmp path (directly or via variable) */
function isRenameSyncFromTmp(n) {
  if (n.type !== "CallExpression" || getCalleeName(n.callee) !== "renameSync") return false;
  const firstArg = n.arguments?.[0];
  if (!firstArg) return false;
  if (isWritingToTmpFile(firstArg)) return true;
  return firstArg.type === "Identifier" && isVarAssignedToTmp(firstArg, n);
}

function containsRenameSyncFromTmp(node) {
  let found = false;
  walkAstNodes(node, (n) => {
    if (!found && isRenameSyncFromTmp(n)) found = true;
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

        // Also allow atomic rename in a finally block wrapping this write
        const enclosingTry = getEnclosingTryStatement(node);
        if (enclosingTry?.finalizer && containsRenameSyncFromTmp(enclosingTry.finalizer)) return;

        context.report({ node, messageId: "nonAtomicWrite" });
      },
    };
  },
};
