# Suggested Compliance Checker Rules

**Generated:** 2026-03-01 **Source:** Consolidation Reviews #454-#465
**Status:** Pending review - add to check-pattern-compliance.js as appropriate

---

## qodo

- **Mentions:** 6 (Reviews: #454, #455, #459, #460, #461, #462)
- **Suggested ID:** `qodo`
- **Template:**

```javascript
{
  id: "qodo",
  pattern: /TODO_REGEX/g,
  message: "qodo",
  fix: "TODO: describe the correct pattern",
  review: "#454, #455, #459, #460, #461, #462",
  fileTypes: [".js", ".ts"],
}
```

## sonarcloud

- **Mentions:** 5 (Reviews: #454, #455, #459, #461, #462)
- **Suggested ID:** `sonarcloud`
- **Template:**

```javascript
{
  id: "sonarcloud",
  pattern: /TODO_REGEX/g,
  message: "sonarcloud",
  fix: "TODO: describe the correct pattern",
  review: "#454, #455, #459, #461, #462",
  fileTypes: [".js", ".ts"],
}
```
