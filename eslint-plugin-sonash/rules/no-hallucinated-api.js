/**
 * @fileoverview Detects calls to non-existent APIs commonly hallucinated by AI.
 * LLMs frequently generate plausible-looking but non-existent API calls.
 * This rule flags known hallucinated APIs to prevent runtime errors.
 */

"use strict";

const HALLUCINATED_APIS = [
  { object: "crypto", property: "secureHash" },
  { object: "firebase", property: "verifyAppCheck" },
  { object: "React", property: "useServerState" },
  { object: "next", property: "getServerAuth" },
  { object: "firestore", property: "atomicUpdate" },
];

/**
 * Build a Set of "object.property" strings for fast lookup.
 */
const HALLUCINATED_SET = new Set(HALLUCINATED_APIS.map((api) => `${api.object}.${api.property}`));

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow calls to non-existent APIs commonly hallucinated by AI",
      recommended: true,
    },
    schema: [],
    messages: {
      hallucinatedAPI:
        "Call to non-existent API (likely AI hallucination). Check actual documentation.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        const unwrapped = callee.type === "ChainExpression" ? callee.expression : callee;

        if (
          unwrapped.type !== "MemberExpression" ||
          unwrapped.object.type !== "Identifier" ||
          unwrapped.property.type !== "Identifier"
        ) {
          return;
        }

        const key = `${unwrapped.object.name}.${unwrapped.property.name}`;

        if (HALLUCINATED_SET.has(key)) {
          context.report({
            node,
            messageId: "hallucinatedAPI",
          });
        }
      },
    };
  },
};
