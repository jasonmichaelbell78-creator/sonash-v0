/**
 * @fileoverview Detects file read operations not wrapped in try/catch.
 * Race conditions between existsSync() and readFileSync() can cause crashes.
 * Wrapping in try/catch is the safe pattern.
 */

"use strict";

const FILE_READ_METHODS = new Set([
  "readFileSync",
  "readFile",
  "loadConfig",
  "loadConfigWithRegex",
]);

/**
 * Check if a CallExpression matches a target file-read function.
 * Handles both bare calls (readFileSync()) and member calls (fs.readFileSync()).
 */
function isFileReadCall(node) {
  const callee = node.callee;

  // Bare call: readFileSync(...)
  if (callee.type === "Identifier" && FILE_READ_METHODS.has(callee.name)) {
    return true;
  }

  // Member call: fs.readFileSync(...)
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier" &&
    FILE_READ_METHODS.has(callee.property.name)
  ) {
    return true;
  }

  return false;
}

/**
 * Walk up the AST to check if any ancestor is a TryStatement.
 */
function isInsideTryCatch(node) {
  let current = node.parent;
  while (current) {
    if (current.type === "TryStatement") {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require file read operations to be wrapped in try/catch blocks",
      recommended: true,
    },
    schema: [],
    messages: {
      unguardedFileRead:
        "File read operation should be wrapped in try/catch to handle race conditions and permission errors",
    },
    hasSuggestions: true,
  },

  create(context) {
    return {
      CallExpression(node) {
        if (!isFileReadCall(node)) {
          return;
        }

        if (!isInsideTryCatch(node)) {
          context.report({
            node,
            messageId: "unguardedFileRead",
            suggest: [
              {
                desc: "Wrap in try/catch block",
                fix(fixer) {
                  const sourceCode = context.sourceCode ?? context.getSourceCode();
                  // Find the containing ExpressionStatement or VariableDeclaration
                  let target = node.parent;
                  if (
                    target.type === "VariableDeclarator" &&
                    target.parent.type === "VariableDeclaration"
                  ) {
                    target = target.parent;
                  } else if (target.type === "ExpressionStatement") {
                    // already at statement level
                  } else {
                    // Cannot safely auto-fix complex expressions
                    return null;
                  }

                  const text = sourceCode.getText(target);
                  const indent = " ".repeat(target.loc.start.column);
                  const inner = indent + "  ";

                  return fixer.replaceText(
                    target,
                    `try {\n${inner}${text}\n${indent}} catch (_err) {\n${inner}// Handle file read error\n${inner}throw _err;\n${indent}}`
                  );
                },
              },
            ],
          });
        }
      },
    };
  },
};
