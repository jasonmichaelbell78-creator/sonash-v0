# Suggested Compliance Checker Rules

**Generated:** 2026-02-13 **Last Updated:** 2026-02-14 **Source:** Consolidation
Reviews #285-#310 **Status:** Pending review - add to
check-pattern-compliance.js as appropriate

---

## Purpose

Candidate compliance checker rules extracted from consolidation review patterns.
Each entry includes mention frequency, source reviews, and a template for
integration into `check-pattern-compliance.js`.

---

## cognitive complexity

- **Mentions:** 4 (Reviews: #299, #303, #305, #308)
- **Suggested ID:** `cognitive-complexity`
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

---

## Version History

| Version | Date       | Changes                                                 |
| ------- | ---------- | ------------------------------------------------------- |
| 1.1     | 2026-02-14 | Added Purpose and Version History sections for doc lint |
| 1.0     | 2026-02-13 | Initial generation from consolidation reviews #285-#310 |
