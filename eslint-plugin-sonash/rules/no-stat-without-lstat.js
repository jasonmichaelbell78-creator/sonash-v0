/**
 * @fileoverview Detects statSync() calls without a preceding lstatSync() check.
 * statSync() follows symlinks silently, which can be exploited for symlink attacks.
 * Always check with lstatSync() first to detect symlinks before calling statSync().
 */

"use strict";

/**
 * Extract the path argument name from a statSync/lstatSync call.
 * Returns the identifier name if the first argument is a simple identifier, null otherwise.
 */
function getPathArgName(node) {
  if (node.arguments && node.arguments.length > 0 && node.arguments[0].type === "Identifier") {
    return node.arguments[0].name;
  }
  return null;
}

/**
 * Check if a CallExpression is a statSync call (bare or member).
 */
function isStatSyncCall(node) {
  const callee = node.callee;
  if (callee.type === "Identifier" && callee.name === "statSync") {
    return true;
  }
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "statSync"
  ) {
    return true;
  }
  return false;
}

/**
 * Check if a CallExpression is an lstatSync call (bare or member).
 */
function isLstatSyncCall(node) {
  const callee = node.callee;
  if (callee.type === "Identifier" && callee.name === "lstatSync") {
    return true;
  }
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "lstatSync"
  ) {
    return true;
  }
  return false;
}

/**
 * Get a stable scope key for a node by finding its closest function/program ancestor.
 */
function getScopeKey(node) {
  let current = node.parent;
  while (current) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression" ||
      current.type === "Program"
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Track an lstatSync call in the scope map.
 */
function trackLstatCall(node, lstatCallsByScope) {
  const pathArg = getPathArgName(node);
  if (!pathArg) return;
  const scopeKey = getScopeKey(node);
  if (!scopeKey) return;
  if (!lstatCallsByScope.has(scopeKey)) {
    lstatCallsByScope.set(scopeKey, new Set());
  }
  lstatCallsByScope.get(scopeKey).add(pathArg);
}

/**
 * Check a statSync call and report if no preceding lstatSync exists in scope.
 */
function checkStatCall(node, lstatCallsByScope, context) {
  const pathArg = getPathArgName(node);
  if (!pathArg) return;

  const scopeKey = getScopeKey(node);
  if (!scopeKey) return;

  const lstatPaths = lstatCallsByScope.get(scopeKey);
  if (lstatPaths && lstatPaths.has(pathArg)) return;

  context.report({
    node,
    messageId: "statWithoutLstat",
    suggest: [
      {
        desc: "Add lstatSync() check before statSync() to detect symlinks",
        fix(fixer) {
          const sourceCode = context.sourceCode ?? context.getSourceCode();
          const callee = node.callee;
          const lstatCall =
            callee.type === "MemberExpression"
              ? `${sourceCode.getText(callee.object)}.lstatSync(${pathArg})`
              : `lstatSync(${pathArg})`;

          let target = node.parent;
          while (
            target &&
            target.type !== "ExpressionStatement" &&
            target.type !== "VariableDeclaration"
          ) {
            target = target.parent;
          }
          if (!target) return null;

          const indent = target.loc ? " ".repeat(target.loc.start.column) : "";
          const varName = target.loc
            ? `_lstat_${target.loc.start.line}`
            : `_lstat_${node.range ? node.range[0] : "check"}`;
          const check = `const ${varName} = ${lstatCall};\n${indent}if (${varName}.isSymbolicLink()) { throw new Error('Symlink detected: ' + ${pathArg}); }\n${indent}`;

          return fixer.insertTextBefore(target, check);
        },
      },
    ],
  });
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require lstatSync() check before statSync() to prevent symlink attacks",
      recommended: true,
    },
    schema: [],
    messages: {
      statWithoutLstat:
        "statSync() without preceding lstatSync() check - vulnerable to symlink attacks",
    },
    hasSuggestions: true,
  },

  create(context) {
    const lstatCallsByScope = new Map();

    return {
      CallExpression(node) {
        if (isLstatSyncCall(node)) {
          trackLstatCall(node, lstatCallsByScope);
        } else if (isStatSyncCall(node)) {
          checkStatCall(node, lstatCallsByScope, context);
        }
      },
    };
  },
};
