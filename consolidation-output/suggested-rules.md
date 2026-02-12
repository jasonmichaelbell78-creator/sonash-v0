<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Suggested Compliance Checker Rules

**Generated:** 2026-02-12 **Source:** Consolidation #285-#307 **Status:**
Pending review - add to check-pattern-compliance.js as appropriate

---

## ci

- **Mentions:** 4 (Reviews: #290, #294, #300)
- **Suggested ID:** `ci`
- **Enforceability:** [REGEX] / [AST] / [SEMANTIC] ← classify manually
- **Template:**

```javascript
{
  id: "ci",
  pattern: /TODO_REGEX/g,
  message: "ci",
  fix: "TODO: describe the correct pattern",
  review: "#290, #294, #300",
  fileTypes: [".js", ".ts"],
}
```

## cognitive complexity

- **Mentions:** 3 (Reviews: #299, #303, #305)
- **Suggested ID:** `cognitive-complexity`
- **Enforceability:** [REGEX] / [AST] / [SEMANTIC] ← classify manually
- **Template:**

```javascript
{
  id: "cognitive-complexity",
  pattern: /TODO_REGEX/g,
  message: "cognitive complexity",
  fix: "TODO: describe the correct pattern",
  review: "#299, #303, #305",
  fileTypes: [".js", ".ts"],
}
```
