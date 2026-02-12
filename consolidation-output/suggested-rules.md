# Suggested Compliance Checker Rules

**Generated:** 2026-02-12 **Source:** Consolidation #285-#308 **Status:**
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

- **Mentions:** 4 (Reviews: #299, #303, #305, #308)
- **Suggested ID:** `cognitive-complexity`
- **Enforceability:** [REGEX] / [AST] / [SEMANTIC] ← classify manually
- **Template:**

```javascript
{
  id: "cognitive-complexity",
  pattern: /TODO_REGEX/g,
  message: "cognitive complexity",
  fix: "TODO: describe the correct pattern",
  review: "#299, #303, #305, #308",
  fileTypes: [".js", ".ts"],
}
```

## validation

- **Mentions:** 3 (Reviews: #293, #294, #308)
- **Suggested ID:** `validation`
- **Enforceability:** [REGEX] / [AST] / [SEMANTIC] ← classify manually
- **Template:**

```javascript
{
  id: "validation",
  pattern: /TODO_REGEX/g,
  message: "validation",
  fix: "TODO: describe the correct pattern",
  review: "#293, #294, #308",
  fileTypes: [".js", ".ts"],
}
```
