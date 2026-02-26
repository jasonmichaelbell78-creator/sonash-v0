/**
 * @fileoverview Detects vi.mock/jest.mock('firebase/firestore') in tests.
 * The app uses Cloud Functions (httpsCallable) for writes, so tests should
 * mock firebase/functions instead of firebase/firestore directly.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow mocking firebase/firestore directly in tests",
      recommended: true,
    },
    schema: [],
    messages: {
      mockFirestore:
        'Mocking firebase/firestore directly — app uses Cloud Functions for writes. Mock firebase/functions instead: vi.mock("firebase/functions")',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Check for vi.mock(...) or jest.mock(...)
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "mock"
        ) {
          return;
        }

        const obj = callee.object.name;
        if (obj !== "vi" && obj !== "jest") return;

        // Check first argument is 'firebase/firestore'
        const firstArg = node.arguments[0];
        if (firstArg?.type === "Literal" && firstArg?.value === "firebase/firestore") {
          context.report({ node, messageId: "mockFirestore" });
        }
      },
    };
  },
};
