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
    // Track lstatSync calls per scope, keyed by path argument name
    const lstatCallsByScope = new Map();

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

    return {
      CallExpression(node) {
        // Track lstatSync calls
        if (isLstatSyncCall(node)) {
          const pathArg = getPathArgName(node);
          if (pathArg) {
            const scopeKey = getScopeKey(node);
            if (scopeKey) {
              if (!lstatCallsByScope.has(scopeKey)) {
                lstatCallsByScope.set(scopeKey, new Set());
              }
              lstatCallsByScope.get(scopeKey).add(pathArg);
            }
          }
          return;
        }

        // Check statSync calls
        if (isStatSyncCall(node)) {
          const pathArg = getPathArgName(node);
          if (!pathArg) {
            // Can't determine path variable - skip to avoid false positives
            return;
          }

          const scopeKey = getScopeKey(node);
          if (!scopeKey) {
            return;
          }

          const lstatPaths = lstatCallsByScope.get(scopeKey);
          if (!lstatPaths || !lstatPaths.has(pathArg)) {
            context.report({
              node,
              messageId: "statWithoutLstat",
              suggest: [
                {
                  desc: "Add lstatSync() check before statSync() to detect symlinks",
                  fix(fixer) {
                    const sourceCode = context.sourceCode ?? context.getSourceCode();
                    // Build the lstatSync call matching the style (bare vs member)
                    const callee = node.callee;
                    let lstatCall;
                    if (callee.type === "MemberExpression") {
                      const obj = sourceCode.getText(callee.object);
                      lstatCall = `${obj}.lstatSync(${pathArg})`;
                    } else {
                      lstatCall = `lstatSync(${pathArg})`;
                    }

                    // Find the statement containing this call
                    let target = node.parent;
                    while (
                      target &&
                      target.type !== "ExpressionStatement" &&
                      target.type !== "VariableDeclaration"
                    ) {
                      target = target.parent;
                    }
                    if (!target) {
                      return null;
                    }

                    const indent = " ".repeat(target.loc.start.column);
                    const check = `const _lstat = ${lstatCall};\n${indent}if (_lstat.isSymbolicLink()) { throw new Error('Symlink detected: ' + ${pathArg}); }\n${indent}`;

                    return fixer.insertTextBefore(target, check);
                  },
                },
              ],
            });
          }
        }
      },
    };
  },
};
