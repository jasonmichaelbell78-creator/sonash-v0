# Suggested Compliance Checker Rules

**Generated:** 2026-02-27 **Source:** Consolidation Reviews #1-#399 **Status:**
Pending review - add to check-pattern-compliance.js as appropriate

---

## qodo

- **Mentions:** 100 (Reviews: #14, #17, #33, #34, #35, #36, #37, #39, #40, #42,
  #43, #137, #138, #164, #165, #184, #186, #187, #188, #189, #190, #191, #192,
  #193, #194, #195, #196, #197, #198, #199, #200, #201, #202, #204, #211, #213,
  #214, #217, #218, #219, #221, #222, #223, #224, #225, #226, #227, #235, #236,
  #237, #238, #239, #249, #250, #251, #252, #253, #254, #255, #256, #257, #258,
  #260, #261, #262, #263, #264, #265, #266, #267, #268, #269, #270, #271, #275,
  #276, #277, #278, #279, #280, #300, #301, #310, #311, #312, #313, #314, #315,
  #316, #317, #353, #354, #357, #365, #366, #367, #368, #369, #370, #371)
- **Suggested ID:** `qodo`
- **Template:**

```javascript
{
  id: "qodo",
  pattern: /TODO_REGEX/g,
  message: "qodo",
  fix: "TODO: describe the correct pattern",
  review: "#14, #17, #33, #34, #35, #36, #37, #39, #40, #42, #43, #137, #138, #164, #165, #184, #186, #187, #188, #189, #190, #191, #192, #193, #194, #195, #196, #197, #198, #199, #200, #201, #202, #204, #211, #213, #214, #217, #218, #219, #221, #222, #223, #224, #225, #226, #227, #235, #236, #237, #238, #239, #249, #250, #251, #252, #253, #254, #255, #256, #257, #258, #260, #261, #262, #263, #264, #265, #266, #267, #268, #269, #270, #271, #275, #276, #277, #278, #279, #280, #300, #301, #310, #311, #312, #313, #314, #315, #316, #317, #353, #354, #357, #365, #366, #367, #368, #369, #370, #371",
  fileTypes: [".js", ".ts"],
}
```

## ci

- **Mentions:** 49 (Reviews: #8, #10, #15, #53, #57, #139, #143, #144, #147,
  #155, #181, #191, #194, #195, #199, #204, #211, #212, #214, #217, #218, #219,
  #221, #224, #226, #227, #235, #236, #237, #249, #250, #251, #255, #256, #260,
  #267, #268, #290, #294, #300, #312, #313, #316, #352, #365, #366, #367, #368,
  #370)
- **Suggested ID:** `ci`
- **Template:**

```javascript
{
  id: "ci",
  pattern: /TODO_REGEX/g,
  message: "ci",
  fix: "TODO: describe the correct pattern",
  review: "#8, #10, #15, #53, #57, #139, #143, #144, #147, #155, #181, #191, #194, #195, #199, #204, #211, #212, #214, #217, #218, #219, #221, #224, #226, #227, #235, #236, #237, #249, #250, #251, #255, #256, #260, #267, #268, #290, #294, #300, #312, #313, #316, #352, #365, #366, #367, #368, #370",
  fileTypes: [".js", ".ts"],
}
```

## security

- **Mentions:** 39 (Reviews: #16, #18, #20, #24, #30, #33, #34, #37, #38, #40,
  #45, #46, #48, #53, #62, #88, #98, #99, #137, #139, #145, #148, #154, #155,
  #156, #193, #198, #199, #200, #201, #202, #223, #237, #239, #269, #283, #284,
  #324, #325)
- **Suggested ID:** `security`
- **Template:**

```javascript
{
  id: "security",
  pattern: /TODO_REGEX/g,
  message: "security",
  fix: "TODO: describe the correct pattern",
  review: "#16, #18, #20, #24, #30, #33, #34, #37, #38, #40, #45, #46, #48, #53, #62, #88, #98, #99, #137, #139, #145, #148, #154, #155, #156, #193, #198, #199, #200, #201, #202, #223, #237, #239, #269, #283, #284, #324, #325",
  fileTypes: [".js", ".ts"],
}
```

## sonarcloud

- **Mentions:** 38 (Reviews: #142, #180, #181, #182, #183, #184, #186, #211,
  #213, #214, #217, #224, #225, #226, #249, #251, #252, #253, #255, #260, #262,
  #300, #307, #311, #314, #315, #316, #317, #348, #354, #357, #365, #366, #367,
  #368, #369, #370, #371)
- **Suggested ID:** `sonarcloud`
- **Template:**

```javascript
{
  id: "sonarcloud",
  pattern: /TODO_REGEX/g,
  message: "sonarcloud",
  fix: "TODO: describe the correct pattern",
  review: "#142, #180, #181, #182, #183, #184, #186, #211, #213, #214, #217, #224, #225, #226, #249, #251, #252, #253, #255, #260, #262, #300, #307, #311, #314, #315, #316, #317, #348, #354, #357, #365, #366, #367, #368, #369, #370, #371",
  fileTypes: [".js", ".ts"],
}
```

## compliance

- **Mentions:** 29 (Reviews: #30, #33, #34, #35, #36, #37, #45, #58, #138, #143,
  #163, #164, #165, #181, #187, #191, #193, #194, #198, #204, #213, #218, #219,
  #224, #255, #257, #258, #275, #365)
- **Suggested ID:** `compliance`
- **Template:**

```javascript
{
  id: "compliance",
  pattern: /TODO_REGEX/g,
  message: "compliance",
  fix: "TODO: describe the correct pattern",
  review: "#30, #33, #34, #35, #36, #37, #45, #58, #138, #143, #163, #164, #165, #181, #187, #191, #193, #194, #198, #204, #213, #218, #219, #224, #255, #257, #258, #275, #365",
  fileTypes: [".js", ".ts"],
}
```

## documentation

- **Mentions:** 20 (Reviews: #1, #9, #15, #28, #29, #33, #34, #35, #36, #37,
  #48, #58, #59, #60, #63, #72, #180, #192, #225, #235)
- **Suggested ID:** `documentation`
- **Template:**

```javascript
{
  id: "documentation",
  pattern: /TODO_REGEX/g,
  message: "documentation",
  fix: "TODO: describe the correct pattern",
  review: "#1, #9, #15, #28, #29, #33, #34, #35, #36, #37, #48, #58, #59, #60, #63, #72, #180, #192, #225, #235",
  fileTypes: [".js", ".ts"],
}
```

## symlink

- **Mentions:** 20 (Reviews: #253, #289, #290, #291, #302, #303, #304, #319,
  #320, #321, #322, #326, #331, #333, #336, #339, #341, #342, #343, #348)
- **Suggested ID:** `symlink`
- **Template:**

```javascript
{
  id: "symlink",
  pattern: /TODO_REGEX/g,
  message: "symlink",
  fix: "TODO: describe the correct pattern",
  review: "#253, #289, #290, #291, #302, #303, #304, #319, #320, #321, #322, #326, #331, #333, #336, #339, #341, #342, #343, #348",
  fileTypes: [".js", ".ts"],
}
```

## cc

- **Mentions:** 12 (Reviews: #326, #336, #339, #340, #341, #342, #345, #348,
  #354, #359, #363, #371)
- **Suggested ID:** `cc`
- **Template:**

```javascript
{
  id: "cc",
  pattern: /TODO_REGEX/g,
  message: "cc",
  fix: "TODO: describe the correct pattern",
  review: "#326, #336, #339, #340, #341, #342, #345, #348, #354, #359, #363, #371",
  fileTypes: [".js", ".ts"],
}
```

## validation

- **Mentions:** 11 (Reviews: #78, #89, #98, #236, #277, #293, #294, #308, #328,
  #334, #337)
- **Suggested ID:** `validation`
- **Template:**

```javascript
{
  id: "validation",
  pattern: /TODO_REGEX/g,
  message: "validation",
  fix: "TODO: describe the correct pattern",
  review: "#78, #89, #98, #236, #277, #293, #294, #308, #328, #334, #337",
  fileTypes: [".js", ".ts"],
}
```

## atomic write

- **Mentions:** 8 (Reviews: #291, #296, #297, #308, #318, #338, #340, #348)
- **Suggested ID:** `atomic-write`
- **Template:**

```javascript
{
  id: "atomic-write",
  pattern: /TODO_REGEX/g,
  message: "atomic write",
  fix: "TODO: describe the correct pattern",
  review: "#291, #296, #297, #308, #318, #338, #340, #348",
  fileTypes: [".js", ".ts"],
}
```

## sanitiz

- **Mentions:** 5 (Reviews: #21, #39, #286, #287, #354)
- **Suggested ID:** `sanitiz`
- **Template:**

```javascript
{
  id: "sanitiz",
  pattern: /TODO_REGEX/g,
  message: "sanitiz",
  fix: "TODO: describe the correct pattern",
  review: "#21, #39, #286, #287, #354",
  fileTypes: [".js", ".ts"],
}
```

## cc reduction

- **Mentions:** 4 (Reviews: #326, #336, #354, #371)
- **Suggested ID:** `cc-reduction`
- **Template:**

```javascript
{
  id: "cc-reduction",
  pattern: /TODO_REGEX/g,
  message: "cc reduction",
  fix: "TODO: describe the correct pattern",
  review: "#326, #336, #354, #371",
  fileTypes: [".js", ".ts"],
}
```

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

## cross-platform

- **Mentions:** 4 (Reviews: #20, #40, #224, #299)
- **Suggested ID:** `cross-platform`
- **Template:**

```javascript
{
  id: "cross-platform",
  pattern: /TODO_REGEX/g,
  message: "cross-platform",
  fix: "TODO: describe the correct pattern",
  review: "#20, #40, #224, #299",
  fileTypes: [".js", ".ts"],
}
```

## error handling

- **Mentions:** 4 (Reviews: #20, #21, #147, #149)
- **Suggested ID:** `error-handling`
- **Template:**

```javascript
{
  id: "error-handling",
  pattern: /TODO_REGEX/g,
  message: "error handling",
  fix: "TODO: describe the correct pattern",
  review: "#20, #21, #147, #149",
  fileTypes: [".js", ".ts"],
}
```

## fail-closed

- **Mentions:** 4 (Reviews: #291, #292, #343, #350)
- **Suggested ID:** `fail-closed`
- **Template:**

```javascript
{
  id: "fail-closed",
  pattern: /TODO_REGEX/g,
  message: "fail-closed",
  fix: "TODO: describe the correct pattern",
  review: "#291, #292, #343, #350",
  fileTypes: [".js", ".ts"],
}
```

## gemini

- **Mentions:** 4 (Reviews: #355, #356, #357, #370)
- **Suggested ID:** `gemini`
- **Template:**

```javascript
{
  id: "gemini",
  pattern: /TODO_REGEX/g,
  message: "gemini",
  fix: "TODO: describe the correct pattern",
  review: "#355, #356, #357, #370",
  fileTypes: [".js", ".ts"],
}
```

## injection

- **Mentions:** 4 (Reviews: #143, #293, #327, #333)
- **Suggested ID:** `injection`
- **Template:**

```javascript
{
  id: "injection",
  pattern: /TODO_REGEX/g,
  message: "injection",
  fix: "TODO: describe the correct pattern",
  review: "#143, #293, #327, #333",
  fileTypes: [".js", ".ts"],
}
```

## atomic-file-writes

- **Mentions:** 3 (Reviews: #191, #218, #238)
- **Suggested ID:** `atomic-file-writes`
- **Template:**

```javascript
{
  id: "atomic-file-writes",
  pattern: /TODO_REGEX/g,
  message: "atomic-file-writes",
  fix: "TODO: describe the correct pattern",
  review: "#191, #218, #238",
  fileTypes: [".js", ".ts"],
}
```

## eslint

- **Mentions:** 3 (Reviews: #51, #299, #302)
- **Suggested ID:** `eslint`
- **Template:**

```javascript
{
  id: "eslint",
  pattern: /TODO_REGEX/g,
  message: "eslint",
  fix: "TODO: describe the correct pattern",
  review: "#51, #299, #302",
  fileTypes: [".js", ".ts"],
}
```

## propagation

- **Mentions:** 3 (Reviews: #328, #359, #361)
- **Suggested ID:** `propagation`
- **Template:**

```javascript
{
  id: "propagation",
  pattern: /TODO_REGEX/g,
  message: "propagation",
  fix: "TODO: describe the correct pattern",
  review: "#328, #359, #361",
  fileTypes: [".js", ".ts"],
}
```

## prototype pollution

- **Mentions:** 3 (Reviews: #286, #291, #320)
- **Suggested ID:** `prototype-pollution`
- **Template:**

```javascript
{
  id: "prototype-pollution",
  pattern: /TODO_REGEX/g,
  message: "prototype pollution",
  fix: "TODO: describe the correct pattern",
  review: "#286, #291, #320",
  fileTypes: [".js", ".ts"],
}
```

## redos

- **Mentions:** 3 (Reviews: #308, #309, #358)
- **Suggested ID:** `redos`
- **Template:**

```javascript
{
  id: "redos",
  pattern: /TODO_REGEX/g,
  message: "redos",
  fix: "TODO: describe the correct pattern",
  review: "#308, #309, #358",
  fileTypes: [".js", ".ts"],
}
```

## refactor

- **Mentions:** 3 (Reviews: #267, #345, #348)
- **Suggested ID:** `refactor`
- **Template:**

```javascript
{
  id: "refactor",
  pattern: /TODO_REGEX/g,
  message: "refactor",
  fix: "TODO: describe the correct pattern",
  review: "#267, #345, #348",
  fileTypes: [".js", ".ts"],
}
```

## regex dos

- **Mentions:** 3 (Reviews: #348, #362, #363)
- **Suggested ID:** `regex-dos`
- **Template:**

```javascript
{
  id: "regex-dos",
  pattern: /TODO_REGEX/g,
  message: "regex dos",
  fix: "TODO: describe the correct pattern",
  review: "#348, #362, #363",
  fileTypes: [".js", ".ts"],
}
```
