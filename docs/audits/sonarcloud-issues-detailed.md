# SonarCloud Issues - Detailed Report with Code Snippets

**Generated**: 2026-01-19 **Project**: jasonmichaelbell78-creator_sonash-v0
**Total Issues**: 1608 **Security Hotspots**: 97

---

## Executive Summary

This report contains **1608 code issues** and **97 security hotspots** from
SonarCloud analysis.

### Issues by Severity

| Severity    | Count | Percentage |
| ----------- | ----- | ---------- |
| 🔴 BLOCKER  | 3     | 0.2%       |
| 🟠 CRITICAL | 107   | 6.7%       |
| 🟡 MAJOR    | 409   | 25.4%      |
| 🔵 MINOR    | 1080  | 67.2%      |
| ⚪ INFO     | 9     | 0.6%       |

### Issues by Type

| Type          | Count |
| ------------- | ----- |
| CODE_SMELL    | 1581  |
| BUG           | 24    |
| VULNERABILITY | 3     |

### Files with Most Issues (Top 20)

| File                                           | Issues |
| ---------------------------------------------- | ------ |
| `scripts/generate-documentation-index.js`      | 213    |
| `scripts/suggest-pattern-automation.js`        | 52     |
| `hooks/use-journal.ts`                         | 49     |
| `scripts/phase-complete-check.js`              | 48     |
| `lib/db/meetings.ts`                           | 42     |
| `lib/utils/error-export.ts`                    | 39     |
| `scripts/check-pattern-compliance.js`          | 39     |
| `functions/src/admin.ts`                       | 34     |
| `.claude/hooks/session-start.sh`               | 33     |
| `components/admin/users-tab.tsx`               | 30     |
| `components/notebook/pages/resources-page.tsx` | 30     |
| `scripts/check-review-needed.js`               | 29     |
| `scripts/check-docs-light.js`                  | 28     |
| `components/admin/meetings-tab.tsx`            | 24     |
| `scripts/update-readme-status.js`              | 24     |
| `app/meetings/all/page.tsx`                    | 23     |
| `components/journal/entry-detail-dialog.tsx`   | 21     |
| `scripts/archive-doc.js`                       | 21     |
| `scripts/surface-lessons-learned.js`           | 19     |
| `scripts/aggregate-audit-findings.js`          | 18     |

---

## Rule Reference

| Rule                  | Description                                            | Severity | Count                                |
| --------------------- | ------------------------------------------------------ | -------- | ------------------------------------ | ----- | --- |
| `javascript:S7778`    | Do not call `Array#push()` multiple times.             | MINOR    | 151                                  |
| `javascript:S7781`    | Prefer `String#replaceAll()` over `String#replace(...  | MINOR    | 150                                  |
| `typescript:S3358`    | Extract this nested ternary operation into an inde...  | MAJOR    | 79                                   |
| `javascript:S7780`    | `String.raw` should be used to avoid escaping `\`.     | MINOR    | 77                                   |
| `typescript:S7764`    | Prefer `globalThis` over `window`.                     | MINOR    | 73                                   |
| `typescript:S6759`    | Mark the props of the component as read-only.          | MINOR    | 71                                   |
| `javascript:S7772`    | Prefer `node:child_process` over `child_process`.      | MINOR    | 63                                   |
| `typescript:S7781`    | Prefer `String#replaceAll()` over `String#replace(...  | MINOR    | 61                                   |
| `shelldre:S7688`      | Use '[[' instead of '[' for conditional tests. The...  | MAJOR    | 55                                   |
| `typescript:S7772`    | Prefer `node:child_process` over `child_process`.      | MINOR    | 54                                   |
| `typescript:S7773`    | Prefer `Number.isNaN` over `isNaN`.                    | MINOR    | 52                                   |
| `typescript:S1874`    | 'PerformanceTiming' is deprecated.                     | MINOR    | 52                                   |
| `javascript:S3776`    | Refactor this function to reduce its Cognitive Com...  | CRITICAL | 48                                   |
| `typescript:S6853`    | A form label must be associated with a control.        | MAJOR    | 42                                   |
| `typescript:S3776`    | Refactor this function to reduce its Cognitive Com...  | CRITICAL | 34                                   |
| `typescript:S7735`    | Unexpected negated condition.                          | MINOR    | 32                                   |
| `typescript:S7748`    | Don't use a zero fraction in the number.               | MINOR    | 30                                   |
| `javascript:S3358`    | Extract this nested ternary operation into an inde...  | MAJOR    | 29                                   |
| `javascript:S7773`    | Prefer `Number.parseInt` over `parseInt`.              | MINOR    | 26                                   |
| `typescript:S6551`    | 'data.content                                          |          | ""' will use Object's default str... | MINOR | 25  |
| `typescript:S6479`    | Do not use Array index in keys                         | MAJOR    | 21                                   |
| `typescript:S6819`    | Use <img alt=...> instead of the "presentation" ro...  | MAJOR    | 19                                   |
| `typescript:S3863`    | 'date-fns' imported multiple times.                    | MINOR    | 15                                   |
| `typescript:S6594`    | Use the "RegExp.exec()" method instead.                | MINOR    | 14                                   |
| `typescript:S7785`    | Prefer top-level await over using a promise chain.     | MAJOR    | 14                                   |
| `typescript:S6848`    | Avoid non-native interactive elements. If using na...  | MAJOR    | 13                                   |
| `typescript:S1082`    | Visible, non-interactive elements with click handl...  | MINOR    | 13                                   |
| `javascript:S7776`    | `args` should be a `Set`, and use `args.has()` to ...  | MINOR    | 13                                   |
| `javascript:S7785`    | Prefer top-level await over using a promise chain.     | MAJOR    | 13                                   |
| `typescript:S3735`    | Remove this use of the "void" operator.                | CRITICAL | 12                                   |
| `javascript:S7735`    | Unexpected negated condition.                          | MINOR    | 12                                   |
| `typescript:S7778`    | Do not call `Array#push()` multiple times.             | MINOR    | 12                                   |
| `javascript:S5843`    | Simplify this regular expression to reduce its com...  | MAJOR    | 12                                   |
| `javascript:S4624`    | Refactor this code to not use nested template lite...  | MAJOR    | 10                                   |
| `typescript:S7763`    | Use `export…from` to re-export `DailyLog`.             | MINOR    | 10                                   |
| `typescript:S6772`    | Ambiguous spacing after previous element strong        | MAJOR    | 9                                    |
| `typescript:S6582`    | Prefer using an optional chain expression instead,...  | MAJOR    | 8                                    |
| `typescript:S4624`    | Refactor this code to not use nested template lite...  | MAJOR    | 8                                    |
| `typescript:S1854`    | Remove this useless assignment to variable "hasMor...  | MAJOR    | 7                                    |
| `typescript:S4325`    | This assertion is unnecessary since it does not ch...  | MINOR    | 7                                    |
| `javascript:S5869`    | Remove duplicates in this character class.             | MAJOR    | 7                                    |
| `typescript:S6481`    | The 'value' object passed as the value prop to the...  | MAJOR    | 6                                    |
| `typescript:S7762`    | Prefer `childNode.remove()` over `parentNode.remov...  | MAJOR    | 6                                    |
| `javascript:S1128`    | Remove this unused import of 'readdirSync'.            | MINOR    | 6                                    |
| `shelldre:S7682`      | Add an explicit return statement at the end of the...  | MAJOR    | 6                                    |
| `javascript:S2310`    | Remove this assignment of "i".                         | MAJOR    | 6                                    |
| `typescript:S7754`    | Prefer `.some(…)` over `.find(…)`.                     | MINOR    | 5                                    |
| `typescript:S7770`    | arrow function is equivalent to `Boolean`. Use `Bo...  | MINOR    | 5                                    |
| `typescript:S2004`    | Refactor this code to not nest functions more than...  | CRITICAL | 5                                    |
| `githubactions:S1135` | Complete the task associated to this "TODO" commen...  | INFO     | 5                                    |
| `shelldre:S7677`      | Redirect this error message to stderr (>&2).           | MAJOR    | 5                                    |
| `javascript:S6397`    | Replace this character class by the character itse...  | MAJOR    | 4                                    |
| `typescript:S2871`    | Provide a compare function to avoid sorting elemen...  | CRITICAL | 4                                    |
| `typescript:S7741`    | Compare with `undefined` directly instead of using...  | MINOR    | 4                                    |
| `shelldre:S1192`      | Define a constant instead of using the literal 'fu...  | MINOR    | 4                                    |
| `typescript:S4323`    | Replace this union type with a type alias.             | MINOR    | 3                                    |
| `javascript:S1481`    | Remove the declaration of the unused 'itemRegex' v...  | MINOR    | 3                                    |
| `typescript:S7786`    | `new Error()` is too unspecific for a type check. ...  | MINOR    | 3                                    |
| `javascript:S2486`    | Handle this exception or don't catch it at all.        | MINOR    | 3                                    |
| `typescript:S6660`    | 'If' statement should not be the only statement in...  | MAJOR    | 3                                    |
| `typescript:S7723`    | Use `new Array()` instead of `Array()`.                | MINOR    | 3                                    |
| `typescript:S1135`    | Complete the task associated to this "TODO" commen...  | INFO     | 3                                    |
| `typescript:S6861`    | Exporting mutable 'let' binding, use 'const' inste...  | CRITICAL | 3                                    |
| `typescript:S2933`    | Member 'config' is never reassigned; mark it as `r...  | MAJOR    | 3                                    |
| `typescript:S6571`    | 'unknown' overrides all other types in this union ...  | MINOR    | 3                                    |
| `typescript:S4030`    | Either use this collection's contents or remove th...  | MAJOR    | 2                                    |
| `typescript:S7766`    | Prefer `Math.max()` to simplify ternary expression...  | MINOR    | 2                                    |
| `typescript:S7721`    | Move function 'formatBytes' to the outer scope.        | MAJOR    | 2                                    |
| `typescript:S7776`    | `BUILT_IN_TYPES` should be a `Set`, and use `BUILT...  | MINOR    | 2                                    |
| `javascript:S1854`    | Remove this useless assignment to variable "itemRe...  | MAJOR    | 2                                    |
| `javascript:S7758`    | Prefer `String#codePointAt()` over `String#charCod...  | MINOR    | 2                                    |
| `javascript:S1871`    | This branch's code block is the same as the block ...  | MAJOR    | 2                                    |
| `javascript:S7750`    | Prefer `.find(…)` over `.filter(…)`.                   | MINOR    | 2                                    |
| `typescript:S5850`    | Group parts of the regex together to make the inte...  | MAJOR    | 2                                    |
| `javascript:S6035`    | Replace this alternation with a character class.       | MAJOR    | 2                                    |
| `javascript:S7770`    | arrow function is equivalent to `Boolean`. Use `Bo...  | MINOR    | 2                                    |
| `typescript:S6606`    | Prefer using nullish coalescing operator (`??=`) i...  | MINOR    | 2                                    |
| `typescript:S125`     | Remove this commented out code.                        | MAJOR    | 2                                    |
| `typescript:S7758`    | Prefer `String.fromCodePoint()` over `String.fromC...  | MINOR    | 2                                    |
| `typescript:S6959`    | Add an initial value to this "reduce()" call.          | MAJOR    | 2                                    |
| `typescript:S6767`    | 'nickname' PropType is defined but prop is never u...  | MINOR    | 2                                    |
| `css:S4662`           | Unexpected unknown at-rule "@custom-variant"           | MAJOR    | 2                                    |
| `typescript:S6847`    | Non-interactive elements should not be assigned mo...  | MAJOR    | 1                                    |
| `typescript:S6754`    | useState call is not destructured into value + set...  | MINOR    | 1                                    |
| `javascript:S7771`    | Prefer negative index over length minus index for ...  | MINOR    | 1                                    |
| `javascript:S6644`    | Unnecessary use of conditional expression for defa...  | MINOR    | 1                                    |
| `typescript:S6478`    | Move this component definition out of the parent c...  | MAJOR    | 1                                    |
| `typescript:S5843`    | Simplify this regular expression to reduce its com...  | MAJOR    | 1                                    |
| `typescript:S7744`    | The empty object is useless.                           | MINOR    | 1                                    |
| `secrets:S6689`       | Make sure this GitHub token gets revoked, changed,...  | BLOCKER  | 1                                    |
| `secrets:S6702`       | Make sure this SonarQube token gets revoked, chang...  | BLOCKER  | 1                                    |
| `javascript:S7737`    | Do not use an object literal as default for parame...  | MINOR    | 1                                    |
| `javascript:S1135`    | Complete the task associated to this "TODO" commen...  | INFO     | 1                                    |
| `shelldre:S131`       | Add a default case (\*) to handle unexpected values... | CRITICAL | 1                                    |
| `shelldre:S7679`      | Assign this positional parameter to a local variab...  | MAJOR    | 1                                    |
| `javascript:S7744`    | The empty object is useless.                           | MINOR    | 1                                    |
| `javascript:S7759`    | Prefer `Date.now()` over `new Date()`.                 | MINOR    | 1                                    |
| `secrets:S6418`       | Make sure this API key gets revoked, changed, and ...  | BLOCKER  | 1                                    |
| `typescript:S6749`    | A fragment with only one child is redundant.           | MINOR    | 1                                    |
| `typescript:S4138`    | Expected a `for-of` loop instead of a `for` loop w...  | MINOR    | 1                                    |
| `typescript:S3923`    | Remove this conditional structure or edit its code...  | MAJOR    | 1                                    |
| `typescript:S1871`    | This branch's code block is the same as the block ...  | MAJOR    | 1                                    |

---

## 🚨 PRIORITY: BLOCKER & CRITICAL Issues (110 total)

These issues should be fixed first as they represent the most severe problems.

### 📁 `mcp.json`

#### 🔴 Line N/A: Make sure this GitHub token gets revoked, changed, and removed from the code.

- **Rule**: `secrets:S6689`
- **Type**: VULNERABILITY
- **Severity**: BLOCKER
- **Effort**: 30min

---

### 📁 `.mcp.json`

#### 🔴 Line N/A: Make sure this SonarQube token gets revoked, changed, and removed from the code.

- **Rule**: `secrets:S6702`
- **Type**: VULNERABILITY
- **Severity**: BLOCKER
- **Effort**: 30min

---

### 📁 `.env.production`

#### 🔴 Line N/A: Make sure this API key gets revoked, changed, and removed from the code.

- **Rule**: `secrets:S6418`
- **Type**: VULNERABILITY
- **Severity**: BLOCKER
- **Effort**: 30min

---

### 📁 `components/admin/links-tab.tsx`

#### 🟠 Line 79: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
      76 |   useTabRefresh("links", loadLinks, { skipInitial: true });
      77 |
      78 |   useEffect(() => {
>>>   79 |     void loadLinks();
      80 |   }, [loadLinks]);
      81 |
      82 |   function handleEdit(link: QuickLink) {
```

---

#### 🟠 Line 127: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     124 |       toast.error("Failed to save link");
     125 |     } finally {
     126 |       setDialogOpen(false);
>>>  127 |       void loadLinks();
     128 |     }
     129 |   }
     130 |
```

---

#### 🟠 Line 141: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     138 |       logger.error("Failed to delete link", { error, linkId: id });
     139 |       toast.error("Failed to delete link");
     140 |     } finally {
>>>  141 |       void loadLinks();
     142 |     }
     143 |   }
     144 |
```

---

#### 🟠 Line 153: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     150 |       logger.error("Failed to update link", { error, linkId: id });
     151 |       toast.error("Failed to update link");
     152 |     } finally {
>>>  153 |       void loadLinks();
     154 |     }
     155 |   }
     156 |
```

---

### 📁 `components/admin/logs-tab.tsx`

#### 🟠 Line 287: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     284 |   }, []);
     285 |
     286 |   // Auto-refresh when tab becomes active
>>>  287 |   useTabRefresh("logs", () => void refresh(), { skipInitial: true });
     288 |
     289 |   useEffect(() => {
     290 |     let active = true;
```

---

#### 🟠 Line 291: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     288 |
     289 |   useEffect(() => {
     290 |     let active = true;
>>>  291 |     void refresh(() => active);
     292 |     return () => {
     293 |       active = false;
     294 |     };
```

---

#### 🟠 Line 338: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     335 |           </div>
     336 |         </div>
     337 |         <button
>>>  338 |           onClick={() => void refresh()}
     339 |           disabled={loading}
     340 |           className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
     341 |         >
```

---

### 📁 `components/admin/prayers-tab.tsx`

#### 🟠 Line 75: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
      72 |   useTabRefresh("prayers", loadPrayers, { skipInitial: true });
      73 |
      74 |   useEffect(() => {
>>>   75 |     void loadPrayers();
      76 |   }, [loadPrayers]);
      77 |
      78 |   function handleEdit(prayer: Prayer) {
```

---

#### 🟠 Line 121: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     118 |       toast.error("Failed to save prayer");
     119 |     } finally {
     120 |       setDialogOpen(false);
>>>  121 |       void loadPrayers();
     122 |     }
     123 |   }
     124 |
```

---

#### 🟠 Line 135: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     132 |       logger.error("Failed to delete prayer", { error, prayerId: id });
     133 |       toast.error("Failed to delete prayer");
     134 |     } finally {
>>>  135 |       void loadPrayers();
     136 |     }
     137 |   }
     138 |
```

---

#### 🟠 Line 147: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     144 |       logger.error("Failed to update prayer", { error, prayerId: id });
     145 |       toast.error("Failed to update prayer");
     146 |     } finally {
>>>  147 |       void loadPrayers();
     148 |     }
     149 |   }
     150 |
```

---

### 📁 `functions/src/jobs.ts`

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

---

#### 🟠 Line 196: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```ts
     193 |  * SECURITY NOTE: This job assumes Storage rules enforce user-uploads/{userId}/ prefixes.
     194 |  * Verify Storage ACLs restrict writes to user's own prefix before relying on this cleanup.
     195 |  */
>>>  196 | export async function cleanupOrphanedStorageFiles(): Promise<{
     197 |   checked: number;
     198 |   deleted: number;
     199 |   errors: number;
```

---

#### 🟠 Line 653: Refactor this function to reduce its Cognitive Complexity from 42 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 32min

```ts
     650 |  * AUDIT: Logs security event for each deleted user (with hashed UID)
     651 |  * COMPLETENESS: Processes in batches until all eligible users are deleted (not just first 50)
     652 |  */
>>>  653 | export async function hardDeleteSoftDeletedUsers(): Promise<{
     654 |   processed: number;
     655 |   deleted: number;
     656 |   errors: number;
```

---

### 📁 `lib/hooks/use-tab-refresh.ts`

#### 🟠 Line 67: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
      64 |     if (currentTimestamp > lastRefreshRef.current) {
      65 |       lastRefreshRef.current = currentTimestamp;
      66 |       // Call the refresh callback
>>>   67 |       void onRefresh();
      68 |     }
      69 |   }, [activeTab, tabId, getTabRefreshTimestamp, onRefresh, options.skipInitial]);
      70 | }
```

---

### 📁 `functions/src/admin.ts`

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

---

#### 🟠 Line 616: Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 18min

```ts
     613 |   limit?: number;
     614 | }
     615 |
>>>  616 | export const adminSearchUsers = onCall<SearchUsersRequest>(async (request) => {
     617 |   await requireAdmin(request, "adminSearchUsers");
     618 |
     619 |   const { query, limit: rawLimit = 20 } = request.data;
```

---

#### 🟠 Line 2073: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```ts
    2070 |   privilegeTypeId: string;
    2071 | }
    2072 |
>>> 2073 | export const adminSetUserPrivilege = onCall<SetUserPrivilegeRequest>(async (request) => {
    2074 |   await requireAdmin(request, "adminSetUserPrivilege");
    2075 |
    2076 |   const { uid, privilegeTypeId } = request.data;
```

---

#### 🟠 Line 2182: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```ts
    2179 |   }
    2180 | });
    2181 |
>>> 2182 | export const adminListUsers = onCall<ListUsersRequest>(async (request) => {
    2183 |   await requireAdmin(request, "adminListUsers");
    2184 |
    2185 |   const {
```

---

#### 🟠 Line 2440: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

```ts
    2437 |  * Admin: Get Storage Statistics
    2438 |  * Returns storage usage statistics
    2439 |  */
>>> 2440 | export const adminGetStorageStats = onCall(async (request) => {
    2441 |   await requireAdmin(request, "adminGetStorageStats");
    2442 |
    2443 |   logSecurityEvent("ADMIN_ACTION", "adminGetStorageStats", "Admin requested storage stats", {
```

---

#### 🟠 Line 2576: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```ts
    2573 |  * Admin: Get Rate Limit Status
    2574 |  * Returns current rate limit status for monitoring
    2575 |  */
>>> 2576 | export const adminGetRateLimitStatus = onCall(async (request) => {
    2577 |   await requireAdmin(request, "adminGetRateLimitStatus");
    2578 |
    2579 |   logSecurityEvent("ADMIN_ACTION", "adminGetRateLimitStatus", "Admin requested rate limit status", {
```

---

#### 🟠 Line 2747: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```ts
    2744 |  * Admin: Get Collection Statistics
    2745 |  * Returns document counts and estimated sizes for all collections
    2746 |  */
>>> 2747 | export const adminGetCollectionStats = onCall(async (request) => {
    2748 |   await requireAdmin(request, "adminGetCollectionStats");
    2749 |
    2750 |   logSecurityEvent("ADMIN_ACTION", "adminGetCollectionStats", "Admin requested collection stats", {
```

---

### 📁 `components/admin/dashboard-tab.tsx`

#### 🟠 Line 94: Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 22min

```tsx
      91 |   subcollectionEstimate?: number;
      92 | }
      93 |
>>>   94 | export function DashboardTab() {
      95 |   const [health, setHealth] = useState<HealthCheck | null>(null);
      96 |   const [stats, setStats] = useState<DashboardStats | null>(null);
      97 |   const [loading, setLoading] = useState(true);
```

---

### 📁 `scripts/aggregate-audit-findings.js`

#### 🟠 Line 180: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     177 | /**
     178 |  * Parse markdown backlog to extract items with robust error handling (Qodo Review #175)
     179 |  */
>>>  180 | function parseMarkdownBacklog(filePath) {
     181 |   if (!existsSync(filePath)) {
     182 |     console.warn(`Warning: File not found: ${filePath}`);
     183 |     return [];
```

---

#### 🟠 Line 322: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     319 |  * ID prefix takes precedence for category (SEC-* → security, PERF-* → performance, etc.)
     320 |  * Fixes category mismatch like SEC-010 with category "Framework" → should be "security" (Qodo Review #175)
     321 |  */
>>>  322 | function normalizeSingleSession(item, sourceCategory, date) {
     323 |   // ID prefix mapping takes precedence over item.category (e.g., SEC-010 with "Framework" category → security)
     324 |   // EFFP-* maps to "engineering-productivity" not "dx" for consistency with source (Qodo Review #176)
     325 |   const idPrefixCategory = item.id?.startsWith("SEC-")
```

---

#### 🟠 Line 677: Refactor this function to reduce its Cognitive Complexity from 87 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 1h17min

```js
     674 |  * - Pre-buckets by file/category to reduce comparisons
     675 |  * - Uses ID index for O(1) DEDUP->CANON dependency lookup
     676 |  */
>>>  677 | function deduplicateFindings(allFindings) {
     678 |   const dedupLog = [];
     679 |   let current = [...allFindings];
     680 |   let didMerge = true;
```

---

### 📁 `components/admin/users-tab.tsx`

#### 🟠 Line 96: Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 31min

```tsx
      93 |   isDefault?: boolean;
      94 | }
      95 |
>>>   96 | export function UsersTab() {
      97 |   // List/pagination state
      98 |   const [users, setUsers] = useState<UserSearchResult[]>([]);
      99 |   const [loading, setLoading] = useState(true);
```

---

### 📁 `scripts/run-consolidation.js`

#### 🟠 Line 147: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```js
     144 | /**
     145 |  * Extract patterns from review descriptions
     146 |  */
>>>  147 | function extractPatterns(reviews) {
     148 |   const patterns = new Map();
     149 |
     150 |   // Common pattern keywords to look for
```

---

#### 🟠 Line 412: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     409 | /**
     410 |  * Main consolidation function
     411 |  */
>>>  412 | function main() {
     413 |   try {
     414 |     log(`\n${colors.bold}🔄 Pattern Consolidation Tool${colors.reset}\n`);
     415 |
```

---

### 📁 `scripts/check-cross-doc-deps.js`

#### 🟠 Line 206: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     203 | /**
     204 |  * Main check function
     205 |  */
>>>  206 | function checkDependencies() {
     207 |   log(`\n${colors.bold}📎 Cross-Document Dependency Check${colors.reset}\n`);
     208 |
     209 |   const stagedFiles = getStagedFiles();
```

---

### 📁 `scripts/check-backlog-health.js`

#### 🟠 Line 103: Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 29min

```js
     100 | /**
     101 |  * Main function
     102 |  */
>>>  103 | function main() {
     104 |   const isPrePush = process.argv.includes("--pre-push");
     105 |   const isQuiet = process.argv.includes("--quiet");
     106 |
```

---

### 📁 `scripts/security-check.js`

#### 🟠 Line 301: Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 25min

```js
     298 | /**
     299 |  * Main function
     300 |  */
>>>  301 | function main() {
     302 |   const args = process.argv.slice(2);
     303 |   const isBlocking = args.includes("--blocking");
     304 |   const isQuiet = args.includes("--quiet");
```

---

### 📁 `components/dev/lighthouse-tab.tsx`

#### 🟠 Line 81: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```tsx
      78 |   useEffect(() => {
      79 |     let isCancelled = false;
      80 |
>>>   81 |     async function fetchLatestRun() {
      82 |       try {
      83 |         const historyRef = collection(db, "dev", "lighthouse", "history");
      84 |         const q = query(historyRef, orderBy("timestamp", "desc"), limit(1));
```

---

### 📁 `components/settings/settings-page.tsx`

#### 🟠 Line 103: Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 31min

```tsx
     100 |     formatLocalTime,
     101 |   ]);
     102 |
>>>  103 |   const handleSave = async () => {
     104 |     // Prevent concurrent save operations from rapid clicks
     105 |     if (isSaving) return;
     106 |
```

---

### 📁 `scripts/log-session-activity.js`

#### 🟠 Line 239: Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 22min

```js
     236 | }
     237 |
     238 | // Generate session summary
>>>  239 | function generateSummary() {
     240 |   const events = getCurrentSessionEvents();
     241 |
     242 |   if (events.length === 0) {
```

---

### 📁 `scripts/check-triggers.js`

#### 🟠 Line 259: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```js
     256 | }
     257 |
     258 | // Main execution
>>>  259 | function main() {
     260 |   const args = process.argv.slice(2);
     261 |   const blockingOnly = args.includes("--blocking-only");
     262 |
```

---

### 📁 `scripts/validate-skill-config.js`

#### 🟠 Line 98: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
      95 | }
      96 |
      97 | // Validate a single skill file
>>>   98 | function validateSkillFile(filePath) {
      99 |   const errors = [];
     100 |   const warnings = [];
     101 |
```

---

### 📁 `scripts/verify-skill-usage.js`

#### 🟠 Line 191: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     188 | }
     189 |
     190 | // Main execution
>>>  191 | function main() {
     192 |   const args = process.argv.slice(2);
     193 |   const strict = args.includes("--strict");
     194 |   const quiet = args.includes("--quiet");
```

---

### 📁 `lib/db/meetings.ts`

#### 🟠 Line 21: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```ts
      18 |  * Parse time string to minutes since midnight for robust sorting
      19 |  * Handles both 24-hour format ("07:00", "19:30") and 12-hour format ("7:00 AM", "7:30 PM")
      20 |  */
>>>   21 | function timeToMinutes(timeStr: string): number {
      22 |   try {
      23 |     // Validate input type
      24 |     if (!timeStr || typeof timeStr !== "string") return 0;
```

---

### 📁 `app/meetings/all/page.tsx`

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🟠 Line 62: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```tsx
      59 |   return 0;
      60 | }
      61 |
>>>   62 | export default function AllMeetingsPage() {
      63 |   const router = useRouter();
      64 |   const [meetings, setMeetings] = useState<Meeting[]>([]);
      65 |   const [viewMode, setViewMode] = useState<"date" | "all">("date");
```

---

### 📁 `components/admin/admin-crud-table.tsx`

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

---

#### 🟠 Line 92: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```tsx
      89 |   }, [fetchItems]);
      90 |
      91 |   // Filter items
>>>   92 |   const filteredItems = items.filter((item) => {
      93 |     // Search filter
      94 |     const matchesSearch = config.searchFields.some((field) => {
      95 |       const value = item[field];
```

---

### 📁 `components/notebook/pages/resources-page.tsx`

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🟠 Line 40: Refactor this function to reduce its Cognitive Complexity from 48 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 38min

```tsx
      37 |   ),
      38 | });
      39 |
>>>   40 | export default function ResourcesPage() {
      41 |   const [meetings, setMeetings] = useState<Meeting[]>([]);
      42 |   const [soberHomes, setSoberHomes] = useState<SoberLivingHome[]>([]);
      43 |   const [resourceType, setResourceType] = useState<"meetings" | "sober-living">("meetings");
```

---

### 📁 `functions/src/index.ts`

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🟠 Line 486: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```ts
     483 |  * 5. Batch writes for atomicity
     484 |  * 6. Audit logging
     485 |  */
>>>  486 | export const migrateAnonymousUserData = onCall<MigrationData>(async (request) => {
     487 |   const { data, app: _app, auth } = request;
     488 |
     489 |   if (!auth) {
```

---

### 📁 `hooks/use-daily-quote.ts`

#### 🟠 Line N/A: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

---

#### 🟠 Line 159: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

```ts
     156 |         setLoading(true);
     157 |         fetchDailyQuote()
     158 |           .then(setQuote)
>>>  159 |           .finally(() => setLoading(false));
     160 |         // Reschedule for next day
     161 |         scheduleMidnightRefresh();
     162 |       }, msUntilMidnight);
```

---

### 📁 `scripts/validate-canon-schema.js`

#### 🟠 Line 80: Refactor this function to reduce its Cognitive Complexity from 37 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 27min

```js
      77 |   }
      78 | }
      79 |
>>>   80 | function validateFinding(finding, lineNum, result) {
      81 |   // Check required fields
      82 |   for (const field of REQUIRED_FIELDS) {
      83 |     if (!(field in finding)) {
```

---

#### 🟠 Line 235: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     232 |   return result;
     233 | }
     234 |
>>>  235 | function printResult(result) {
     236 |   const status = result.isValid ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
     237 |   console.log(
     238 |     `\n${status} ${result.filename} (${result.findings} findings, ${result.compliance}% compliance)`
```

---

### 📁 `scripts/normalize-canon-ids.js`

#### 🟠 Line 188: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

```js
     185 |   return findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
     186 | }
     187 |
>>>  188 | function main() {
     189 |   const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
     190 |   const dryRun = process.argv.includes("--dry-run");
     191 |   const verbose = process.argv.includes("--verbose");
```

---

### 📁 `scripts/check-review-needed.js`

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

---

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

---

#### 🟠 Line 254: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     251 |  * Fetch issue counts from SonarCloud API
     252 |  * @returns {Promise<{success: boolean, data?: {bugs: number, vulnerabilities: number, codeSmells: number, hotspots: number, qualityGate: string}, error?: string}>}
     253 |  */
>>>  254 | async function fetchSonarCloudData() {
     255 |   if (!SONARCLOUD_ENABLED) {
     256 |     return { success: false, error: "SonarCloud not enabled (use --sonarcloud flag)" };
     257 |   }
```

---

#### 🟠 Line 862: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     859 |  * Reads AUDIT_TRACKER.md, checks per-category thresholds, and outputs results
     860 |  * @returns {Promise<void>} Exits with code 0 (no review needed), 1 (review recommended), or 2 (error)
     861 |  */
>>>  862 | async function main() {
     863 |   // Read AUDIT_TRACKER.md
     864 |   const trackerResult = safeReadFile(TRACKER_PATH, "AUDIT_TRACKER.md");
     865 |   const trackerContent = trackerResult.success ? trackerResult.content : "";
```

---

### 📁 `scripts/generate-documentation-index.js`

#### 🟠 Line 141: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     138 |  * Find all markdown files in the repository
     139 |  * Returns { active: [], archived: [] }
     140 |  */
>>>  141 | function findMarkdownFiles(dir, result = { active: [], archived: [] }) {
     142 |   let entries;
     143 |   try {
     144 |     entries = readdirSync(dir);
```

---

#### 🟠 Line 279: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```js
     276 |  * Extract description from markdown content
     277 |  * All regex patterns use bounded quantifiers to prevent ReDoS
     278 |  */
>>>  279 | function extractDescription(content) {
     280 |   // Try to find Purpose section (bounded to 2000 chars to prevent ReDoS)
     281 |   const purposeMatch = content.match(
     282 |     /##\s*Purpose\s*\r?\n\r?\n([\s\S]{0,2000}?)(?=\r?\n##|\r?\n---|$)/i
```

---

#### 🟠 Line 360: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

```js
     357 | /**
     358 |  * Extract all markdown links from content
     359 |  */
>>>  360 | function extractLinks(content, currentFile) {
     361 |   const links = [];
     362 |   const seenTargets = new Set(); // Deduplicate links to same target
     363 |   const currentDir = dirname(currentFile);
```

---

#### 🟠 Line 558: Refactor this function to reduce its Cognitive Complexity from 56 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 46min

```js
     555 | /**
     556 |  * Generate markdown output
     557 |  */
>>>  558 | function generateMarkdown(docs, referenceGraph, archivedFiles = []) {
     559 |   const lines = [];
     560 |   const now = new Date().toISOString().split("T")[0];
     561 |
```

---

### 📁 `scripts/validate-audit.js`

#### 🟠 Line 163: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     160 |  * @param {Array<Object>} falsePositives - False positive patterns
     161 |  * @returns {Array<{finding: Object, falsePositive: Object, match: string}>} Matched false positives
     162 |  */
>>>  163 | function checkFalsePositives(findings, falsePositives) {
     164 |   const flagged = [];
     165 |
     166 |   for (const finding of findings) {
```

---

#### 🟠 Line 211: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```js
     208 |   return flagged;
     209 | }
     210 |
>>>  211 | function validateRequiredFields(findings) {
     212 |   const issues = [];
     213 |
     214 |   for (const finding of findings) {
```

---

#### 🟠 Line 443: Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 16min

```js
     440 |   }
     441 | }
     442 |
>>>  443 | function generateReport(filePath, findings, results) {
     444 |   const { falsePositives, fieldIssues, duplicates, npmCrossRef, eslintCrossRef } = results;
     445 |
     446 |   console.log("\n" + "=".repeat(80));
```

---

### 📁 `scripts/add-false-positive.js`

#### 🟠 Line 139: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     136 |   return entry;
     137 | }
     138 |
>>>  139 | function listFalsePositives(categoryFilter) {
     140 |   const fps = loadFalsePositives();
     141 |   const filtered = categoryFilter ? fps.filter((fp) => fp.category === categoryFilter) : fps;
     142 |
```

---

### 📁 `scripts/check-document-sync.js`

#### 🟠 Line 200: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

```js
     197 |   // Get normalized root for path traversal validation
     198 |   const normalizedRoot = realpathSync(ROOT);
     199 |
>>>  200 |   lines.forEach((line, idx) => {
     201 |     const lineNum = idx + 1;
     202 |
     203 |     // Reset regex lastIndex to prevent state leak
```

---

#### 🟠 Line 304: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     301 | /**
     302 |  * Main validation logic
     303 |  */
>>>  304 | function validateDocumentSync() {
     305 |   const pairs = parseDocumentDependencies();
     306 |
     307 |   if (pairs.length === 0) {
```

---

#### 🟠 Line 382: Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 18min

```js
     379 | /**
     380 |  * Output formatting
     381 |  */
>>>  382 | function formatOutput(results) {
     383 |   if (JSON_OUTPUT) {
     384 |     console.log(JSON.stringify(results, null, 2));
     385 |     return;
```

---

### 📁 `scripts/phase-complete-check.js`

#### 🟠 Line 133: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```js
     130 |  * Verify deliverable exists and has content
     131 |  * Security: Prevents path traversal by ensuring resolved path stays within projectRoot
     132 |  */
>>>  133 | function verifyDeliverable(deliverable, projectRoot) {
     134 |   // Security: Reject absolute paths
     135 |   if (path.isAbsolute(deliverable.path)) {
     136 |     return { exists: false, valid: false, reason: "Invalid path (absolute paths not allowed)" };
```

---

#### 🟠 Line 232: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     229 |  * @param {boolean} isAutoMode - Whether running in CI/auto mode
     230 |  * @param {boolean} planWasProvided - Whether --plan was explicitly specified
     231 |  */
>>>  232 | function runAutomatedDeliverableAudit(planPath, projectRoot, isAutoMode, planWasProvided) {
     233 |   console.log("");
     234 |   console.log("━━━ AUTOMATED DELIVERABLE AUDIT ━━━");
     235 |   console.log("");
```

---

#### 🟠 Line 363: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     360 |   return results;
     361 | }
     362 |
>>>  363 | async function main() {
     364 |   console.log("");
     365 |   console.log("═══════════════════════════════════════════════════════════");
     366 |   console.log("  🔍 PHASE COMPLETION CHECKLIST - AUTOMATED GATE");
```

---

### 📁 `scripts/validate-phase-completion.js`

#### 🟠 Line 32: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```js
      29 |   "INTEGRATED_IMPROVEMENT_PLAN.md"
      30 | );
      31 |
>>>   32 | function main() {
      33 |   console.log("🔍 Validating Phase Completion...\n");
      34 |
      35 |   // Read current plan with error handling
```

---

### 📁 `scripts/assign-review-tier.js`

#### 🟠 Line 178: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     175 |  * @param {string} filePath - The file path to classify
     176 |  * @param {string[]} allFiles - All changed files (for conditional checks)
     177 |  */
>>>  178 | function assignTierByPath(filePath, allFiles = []) {
     179 |   // Normalize path for cross-platform regex matching
     180 |   const normalizedPath = normalizePath(filePath);
     181 |
```

---

#### 🟠 Line 354: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     351 | /**
     352 |  * Main tier assignment logic
     353 |  */
>>>  354 | function assignReviewTier(files, options = {}) {
     355 |   const projectRoot = options.projectRoot || process.cwd();
     356 |   let highestTier = 0;
     357 |   let reasons = [];
```

---

### 📁 `scripts/check-pattern-compliance.js`

#### 🟠 Line 482: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

```js
     479 |     const extensions = [".sh", ".yml", ".yaml", ".js", ".ts", ".tsx", ".jsx"];
     480 |     const ignoreDirs = ["node_modules", ".next", "dist", "dist-tests", ".git", "coverage"];
     481 |
>>>  482 |     function walk(dir) {
     483 |       try {
     484 |         const entries = readdirSync(dir);
     485 |         for (const entry of entries) {
```

---

#### 🟠 Line 557: Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 16min

```js
     554 | /**
     555 |  * Check a file for anti-patterns
     556 |  */
>>>  557 | function checkFile(filePath) {
     558 |   const fullPath = join(ROOT, filePath);
     559 |   if (!existsSync(fullPath)) {
     560 |     return [];
```

---

### 📁 `.claude/hooks/pattern-check.sh`

#### 🟠 Line 36: Add a default case (\*) to handle unexpected values.

- **Rule**: `shelldre:S131`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```sh
      33 | fi
      34 |
      35 | # SECURITY: Reject option-like and multiline paths to prevent bypass/spoofing
>>>   36 | case "$FILE_PATH" in
      37 |   -* | *$'\n'* | *$'\r'* )
      38 |     exit 0
      39 |     ;;
```

---

### 📁 `scripts/surface-lessons-learned.js`

#### 🟠 Line 80: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```js
      77 |  * Auto-detect topics from git changes
      78 |  * Cross-platform compatible (no shell-specific syntax)
      79 |  */
>>>   80 | function detectTopicsFromGitChanges() {
      81 |   try {
      82 |     // Get recently modified files - try HEAD~5 first, fall back to HEAD
      83 |     let changedFilesOutput = "";
```

---

### 📁 `scripts/suggest-pattern-automation.js`

#### 🟠 Line 107: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```js
     104 | /**
     105 |  * Extract code patterns from learnings file
     106 |  */
>>>  107 | function extractPatternsFromLearnings() {
     108 |   // Check file exists
     109 |   if (!existsSync(LEARNINGS_FILE)) {
     110 |     console.error(`❌ Learnings file not found: ${LEARNINGS_FILENAME}`);
```

---

### 📁 `scripts/check-docs-light.js`

#### 🟠 Line 90: Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 14min

```js
      87 |  * @param {string} content - Document content
      88 |  * @returns {number} - Tier number (1-5) or 0 if unknown
      89 |  */
>>>   90 | function determineTier(filePath, _content) {
      91 |   const fileName = basename(filePath);
      92 |   const relativePath = relative(ROOT, filePath);
      93 |
```

---

#### 🟠 Line 306: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

```js
     303 |  * @param {Array} headings - Extracted headings
     304 |  * @returns {Array<string>} - List of errors
     305 |  */
>>>  306 | function validateAnchorLinks(links, headings) {
     307 |   const errors = [];
     308 |
     309 |   // Generate valid anchors from headings
```

---

#### 🟠 Line 389: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```js
     386 |  * @param {string} filePath - Path to the document
     387 |  * @returns {{file: string, tier: number, errors: string[], warnings: string[]}}
     388 |  */
>>>  389 | function lintDocument(filePath) {
     390 |   const errors = [];
     391 |   const warnings = [];
     392 |
```

---

#### 🟠 Line 525: Refactor this function to reduce its Cognitive Complexity from 55 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 45min

```js
     522 | /**
     523 |  * Main function
     524 |  */
>>>  525 | function main() {
     526 |   console.log("📝 Running documentation linter...\n");
     527 |
     528 |   // Determine files to check
```

---

### 📁 `scripts/archive-doc.js`

#### 🟠 Line 321: Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 14min

```js
     318 |  * @param {string} newPath - New archive path (relative)
     319 |  * @returns {{success: boolean, updated: Array<{file: string, line: number}>, error?: string}}
     320 |  */
>>>  321 | function updateCrossReferences(oldPath, _newPath) {
     322 |   const updated = [];
     323 |   const oldFilename = basename(oldPath);
     324 |
```

---

#### 🟠 Line 473: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```js
     470 | /**
     471 |  * Main function
     472 |  */
>>>  473 | function main() {
     474 |   console.log("📦 Document Archive Tool");
     475 |   if (DRY_RUN) console.log("   (DRY RUN - no files will be modified)\n");
     476 |   else console.log("");
```

---

### 📁 `scripts/enrich-addresses.ts`

#### 🟠 Line 15: Refactor this function to reduce its Cognitive Complexity from 36 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 26min

```ts
      12 |
      13 | const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      14 |
>>>   15 | async function enrichAddresses() {
      16 |   console.log("🚀 Starting Address Enrichment (OSM/Nominatim)...\n");
      17 |
      18 |   // 1. Initialize Firebase Admin
```

---

### 📁 `scripts/migrate-meetings-dayindex.ts`

#### 🟠 Line 29: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```ts
      26 |   saturday: 6,
      27 | };
      28 |
>>>   29 | async function migrateMeetings() {
      30 |   console.log("🚀 Starting migration: Adding dayIndex to meetings...\n");
      31 |
      32 |   // Initialize Firebase Admin SDK
```

---

### 📁 `scripts/retry-failures.ts`

#### 🟠 Line 12: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```ts
       9 | const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
      10 | const USER_AGENT = "SonashApp_Migration/1.0 (jason@example.com)"; // Replace with real email if possible
      11 |
>>>   12 | async function retryFailures() {
      13 |   console.log("🚀 Starting Retry for Failed Addresses...\n");
      14 |
      15 |   // 1. Initialize Firebase
```

---

### 📁 `scripts/update-readme-status.js`

#### 🟠 Line 151: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     148 |  * @param {string} content - ROADMAP.md content
     149 |  * @returns {{success: boolean, milestones?: Array, error?: string}}
     150 |  */
>>>  151 | function parseMilestonesTable(content) {
     152 |   const milestones = [];
     153 |   const warnings = [];
     154 |
```

---

#### 🟠 Line 327: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     324 |  * @param {string} overallProgress - Overall progress string
     325 |  * @returns {string} - New Project Status section content
     326 |  */
>>>  327 | function generateStatusSection(milestones, overallProgress) {
     328 |   const today = new Date().toLocaleDateString("en-US", {
     329 |     year: "numeric",
     330 |     month: "long",
```

---

### 📁 `functions/src/security-wrapper.ts`

#### 🟠 Line 106: Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 29min

```ts
     103 |  *   )
     104 |  * );
     105 |  */
>>>  106 | export async function withSecurityChecks<TInput, TOutput>(
     107 |   request: CallableRequest,
     108 |   options: SecurityOptions<TInput>,
     109 |   handler: (context: SecureCallableContext<TInput>) => Promise<TOutput>
```

---

### 📁 `scripts/migrate-to-journal.ts`

#### 🟠 Line 33: Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 16min

```ts
      30 | /**
      31 |  * Migrate all legacy data for a specific user
      32 |  */
>>>   33 | async function migrateUserData(userId: string, stats: MigrationStats) {
      34 |   console.log(`\nMigrating user: ${userId}`);
      35 |
      36 |   // We no longer skip the user entirely if they have *some* migrated entries.
```

---

#### 🟠 Line 198: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```ts
     195 | /**
     196 |  * Generate searchable text from entry data
     197 |  */
>>>  198 | function generateSearchableText(type: string, data: Record<string, unknown>): string {
     199 |   const parts: string[] = [];
     200 |   const isPrimitive = (val: unknown): val is string | number =>
     201 |     typeof val === "string" || typeof val === "number";
```

---

### 📁 `components/widgets/compact-meeting-countdown.tsx`

#### 🟠 Line 69: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```tsx
      66 |   }
      67 | }
      68 |
>>>   69 | const parseMinutesSinceMidnight = (timeStr: string): number | null => {
      70 |   const t = timeStr.trim();
      71 |
      72 |   // 24-hour format: "HH:mm"
```

---

#### 🟠 Line 121: Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 13min

```tsx
     118 |   });
     119 |
     120 |   useEffect(() => {
>>>  121 |     async function findNextMeeting() {
     122 |       try {
     123 |         // Get all meetings for today
     124 |         const now = new Date();
```

---

### 📁 `lib/firestore-service.ts`

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

---

### 📁 `components/notebook/pages/history-page.tsx`

#### 🟠 Line 50: Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 25min

```tsx
      47 |         const entryDate = startOfDay(new Date(y, m - 1, d));
      48 |         return entryDate >= sevenDaysAgo;
      49 |       })
>>>   50 |       .map((entry) => {
      51 |         const date = entry.createdAt
      52 |           ? new Date(entry.createdAt)
      53 |           : new Date(entry.dateLabel + "T12:00:00");
```

---

### 📁 `components/notebook/pages/today-page.tsx`

#### 🟠 Line 337: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

```tsx
     334 |                 if (data.content && !isEditingRef.current) {
     335 |                   setJournalEntry(data.content);
     336 |                   // Position cursor at end of text on load for both textareas
>>>  337 |                   setTimeout(() => {
     338 |                     const len = data.content.length;
     339 |                     if (desktopTextareaRef.current) {
     340 |                       desktopTextareaRef.current.setSelectionRange(len, len);
```

---

#### 🟠 Line 651: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```tsx
     648 |   const dateString = formatDateForDisplay(referenceDate);
     649 |
     650 |   // Calculate clean time dynamically with minutes
>>>  651 |   const getCleanTime = () => {
     652 |     if (!profile?.cleanStart) return null;
     653 |
     654 |     // Handle Firestore Timestamp or Date object
```

---

### 📁 `components/notebook/features/clean-time-display.tsx`

#### 🟠 Line 29: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```tsx
      26 |  * @example
      27 |  * <CleanTimeDisplay cleanStart={profile.cleanStart} />
      28 |  */
>>>   29 | export function CleanTimeDisplay({ cleanStart }: CleanTimeDisplayProps) {
      30 |   if (!cleanStart) {
      31 |     return (
      32 |       <div>
```

---

### 📁 `lib/firebase.ts`

#### 🟠 Line 137: Exporting mutable 'let' binding, use 'const' instead.

- **Rule**: `typescript:S6861`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
     134 | // Exports with SSR safety
     135 | // In browser: real Firebase instances
     136 | // On server: proxy objects that throw helpful errors instead of crashing silently
>>>  137 | let app: FirebaseApp;
     138 | let auth: Auth;
     139 | let db: Firestore;
     140 |
```

---

#### 🟠 Line 138: Exporting mutable 'let' binding, use 'const' instead.

- **Rule**: `typescript:S6861`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
     135 | // In browser: real Firebase instances
     136 | // On server: proxy objects that throw helpful errors instead of crashing silently
     137 | let app: FirebaseApp;
>>>  138 | let auth: Auth;
     139 | let db: Firestore;
     140 |
     141 | if (typeof window !== "undefined") {
```

---

#### 🟠 Line 139: Exporting mutable 'let' binding, use 'const' instead.

- **Rule**: `typescript:S6861`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
     136 | // On server: proxy objects that throw helpful errors instead of crashing silently
     137 | let app: FirebaseApp;
     138 | let auth: Auth;
>>>  139 | let db: Firestore;
     140 |
     141 | if (typeof window !== "undefined") {
     142 |   // Client-side: use real Firebase instances
```

---

### 📁 `hooks/use-journal.ts`

#### 🟠 Line N/A: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

---

#### 🟠 Line N/A: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

---

### 📁 `components/growth/NightReviewCard.tsx`

#### 🟠 Line 75: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```tsx
      72 |   { id: "apology", label: "To whom do I owe an apology?" },
      73 | ];
      74 |
>>>   75 | export default function NightReviewCard({ className, ...props }: NightReviewCardProps) {
      76 |   const [open, setOpen] = useState(false); // Was isOpen, changed to open to match Dialog usage typical patterns if needed, but keeping isOpen internal variable name consistent. Wait, previous code used isOpen. Dialog expects 'open'.
      77 |   // Let's stick to 'open' state variable name if passed to Dialog open={open}
      78 |
```

---

---

## 🔒 Security Hotspots (97 total)

Security hotspots require manual review to determine if they represent actual
vulnerabilities.

### 📁 `lib/utils/errors.ts`

#### 🔴 Line 69: Review this potentially hard-coded password.

- **Category**: auth
- **Vulnerability Probability**: HIGH
- **Rule**: `typescript:S2068`

```ts
      66 |   const errorMessages: Record<string, string> = {
      67 |     // Auth errors
      68 |     "auth/user-not-found": "No account found with this email address",
>>>   69 |     "auth/wrong-password": "Incorrect password",
      70 |     "auth/email-already-in-use": "An account with this email already exists",
      71 |     "auth/weak-password": "Password should be at least 6 characters",
      72 |     "auth/invalid-email": "Invalid email address",
```

---

#### 🔴 Line 71: Review this potentially hard-coded password.

- **Category**: auth
- **Vulnerability Probability**: HIGH
- **Rule**: `typescript:S2068`

```ts
      68 |     "auth/user-not-found": "No account found with this email address",
      69 |     "auth/wrong-password": "Incorrect password",
      70 |     "auth/email-already-in-use": "An account with this email already exists",
>>>   71 |     "auth/weak-password": "Password should be at least 6 characters",
      72 |     "auth/invalid-email": "Invalid email address",
      73 |     "auth/user-disabled": "This account has been disabled",
      74 |     "auth/too-many-requests": "Too many failed attempts. Please try again later",
```

---

### 📁 `tests/utils/logger.test.ts`

#### 🔴 Line 96: Review this potentially hard-coded password.

- **Category**: auth
- **Vulnerability Probability**: HIGH
- **Rule**: `typescript:S2068`

```ts
      93 |
      94 |     it("redacts sensitive keys in nested objects", () => {
      95 |       // Note: redaction happens when iterating over object keys, not top-level context keys
>>>   96 |       logger.info("Auth event", { data: { password: "secret123", user: "john" } });
      97 |       const log = capturedLogs[0] as { type: string; args: unknown[] };
      98 |       const payload = log.args[0] as { context: { data: { password: string; user: string } } };
      99 |       assert.strictEqual(payload.context.data.password, "[REDACTED]");
```

---

#### 🔴 Line 130: Review this potentially hard-coded password.

- **Category**: auth
- **Vulnerability Probability**: HIGH
- **Rule**: `typescript:S2068`

```ts
     127 |       // Note: sanitizeContext processes values with redactValue, which checks keys
     128 |       // within objects for sensitive patterns. Top-level key names are not checked.
     129 |       logger.info("Auth data", {
>>>  130 |         nested: { idToken: "token123", password: "secret", user: "test" },
     131 |         data: "safe",
     132 |       });
     133 |       const log = capturedLogs[0] as { type: string; args: unknown[] };
```

---

### 📁 `scripts/ai-review.js`

#### 🟠 Line 160: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

````js
     157 |   const section = promptsFile.substring(sectionStart, sectionEnd);
     158 |
     159 |   // Extract the system prompt (between first ``` and next ```)
>>>  160 |   const systemPromptMatch = section.match(/### System Prompt\s+```\s+([\s\S]+?)\s+```/);
     161 |   if (!systemPromptMatch) {
     162 |     throw new Error(`System prompt not found in section: ${reviewTypeConfig.section}`);
     163 |   }
````

---

#### 🔴 Line 222: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     219 |
     220 |   if (config.staged) {
     221 |     try {
>>>  222 |       const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" })
     223 |         .split("\n")
     224 |         .filter(Boolean);
     225 |
```

---

#### 🟡 Line 222: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     219 |
     220 |   if (config.staged) {
     221 |     try {
>>>  222 |       const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" })
     223 |         .split("\n")
     224 |         .filter(Boolean);
     225 |
```

---

#### 🔴 Line 227: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     224 |         .filter(Boolean);
     225 |
     226 |       const reviewTypeConfig = REVIEW_TYPES[config.type];
>>>  227 |       return stagedFiles.filter((file) => {
     228 |         const basename = path.basename(file);
     229 |         const ext = path.extname(file);
     230 |         // Check exact filename match first
```

---

#### 🟡 Line 284: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     281 |   try {
     282 |     if (config.staged) {
     283 |       // Read staged version (use execFileSync to prevent command injection)
>>>  284 |       return execFileSync("git", ["show", `:${filePath}`], { encoding: "utf-8" });
     285 |     } else {
     286 |       // Read current version
     287 |       return fs.readFileSync(filePath, "utf-8");
```

---

### 📁 `scripts/check-pattern-compliance.js`

#### 🟠 Line 89: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
      86 |   // Bash/Shell patterns
      87 |   {
      88 |     id: "exit-code-capture",
>>>   89 |     pattern: /\$\(\s*[^)]+\s*\)\s*;\s*if\s+\[\s*\$\?\s/g,
      90 |     message:
      91 |       "Exit code capture bug: $? after assignment captures assignment exit (always 0), not command exit",
      92 |     fix: "Use: if ! OUT=$(cmd); then",
```

---

#### 🟠 Line 98: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
      95 |   },
      96 |   {
      97 |     id: "for-file-iteration",
>>>   98 |     pattern: /for\s+\w+\s+in\s+\$\{?\w+\}?\s*;?\s*do/g,
      99 |     message: "File iteration with for loop breaks on spaces in filenames",
     100 |     fix: "Use: while IFS= read -r file; do ... done < file_list",
     101 |     review: "#4, #14",
```

---

#### 🟠 Line 181: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     178 |   },
     179 |   {
     180 |     id: "regex-global-test-loop",
>>>  181 |     pattern: /new\s+RegExp\s*\([^)]+,\s*['"`][^'"]*g[^'"]*['"`]\s*\)[\s\S]{0,200}\.test\s*\(/g,
     182 |     message:
     183 |       "Regex with global flag used with .test() in loop - stateful lastIndex causes missed matches",
     184 |     fix: 'Remove "g" flag when using .test(), or reset lastIndex between iterations',
```

---

#### 🟠 Line 208: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     205 |   },
     206 |   {
     207 |     id: "implicit-if-expression",
>>>  208 |     pattern: /^\s*if:\s+(?!.*\$\{\{).*(?:steps|github|env|inputs|needs)\./gm,
     209 |     message: "Implicit expression in if: condition can cause YAML parser issues",
     210 |     fix: "Always use explicit ${{ }} in if: conditions",
     211 |     review: "#17, #21",
```

---

#### 🟠 Line 298: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     295 |   {
     296 |     id: "path-join-without-containment",
     297 |     pattern:
>>>  298 |       /path\.join\s*\([^)]*,\s*(?:deliverable|user|input|arg|param|file)\w*(?:\.path)?[^)]*\)(?![\s\S]{0,100}(?:relative|isWithin|contains|startsWith))/g,
     299 |     message: "Path joined with user input without containment check",
     300 |     fix: 'Verify path.relative(root, resolved) does not start with ".." or equal ""',
     301 |     review: "#33, #34, #38, #39, #40",
```

---

#### 🟡 Line 459: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     456 |
     457 |   if (STAGED) {
     458 |     try {
>>>  459 |       const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
     460 |         cwd: ROOT,
     461 |         encoding: "utf-8",
     462 |       });
```

---

#### 🔴 Line 463: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     460 |         cwd: ROOT,
     461 |         encoding: "utf-8",
     462 |       });
>>>  463 |       return output
     464 |         .trim()
     465 |         .split("\n")
     466 |         .filter((f) => f.trim())
```

---

#### 🔴 Line 463: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     460 |         cwd: ROOT,
     461 |         encoding: "utf-8",
     462 |       });
>>>  463 |       return output
     464 |         .trim()
     465 |         .split("\n")
     466 |         .filter((f) => f.trim())
```

---

### 📁 `scripts/check-review-needed.js`

#### 🔴 Line 234: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     231 |   verbose(`Running: ${command}`);
     232 |
     233 |   try {
>>>  234 |     const output = execSync(command, {
     235 |       cwd: ROOT,
     236 |       encoding: "utf-8",
     237 |       stdio: ["pipe", "pipe", "pipe"],
```

---

### 📁 `scripts/phase-complete-check.js`

#### 🟠 Line 306: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     303 |         .replace(/^`(.+)`$/, "$1") // Remove backticks
     304 |         .replace(/^"(.+)"$/, "$1") // Remove double quotes
     305 |         .replace(/^'(.+)'$/, "$1") // Remove single quotes
>>>  306 |         .replace(/[)`"'.,;:]+$/g, ""), // Remove trailing punctuation
     307 |     }))
     308 |     .filter((d) => d.path.length > 0)
     309 |     .filter((d) => !d.path.replace(/\\/g, "/").split("/").includes("..")); // Reject path traversal (cross-platform)
```

---

#### 🟡 Line 408: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     405 |   // Using maxBuffer: 10MB to prevent buffer overflow on large output
     406 |   console.log("▶ Running ESLint...");
     407 |   try {
>>>  408 |     const lintOutput = execSync("npm run lint", {
     409 |       encoding: "utf-8",
     410 |       stdio: "pipe",
     411 |       maxBuffer: 10 * 1024 * 1024,
```

---

#### 🟡 Line 429: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     426 |   // Using maxBuffer: 10MB to prevent buffer overflow on large output
     427 |   console.log("▶ Running tests...");
     428 |   try {
>>>  429 |     const testOutput = execSync("npm test", {
     430 |       encoding: "utf-8",
     431 |       stdio: "pipe",
     432 |       maxBuffer: 10 * 1024 * 1024,
```

---

#### 🔴 Line 437: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     434 |     // Only show summary, not full output (too verbose)
     435 |     // Use case-insensitive matching to catch PASS/FAIL/Tests: etc.
     436 |     const lines = testOutput.split("\n");
>>>  437 |     const summaryLines = lines.filter((l) => {
     438 |       const lower = l.toLowerCase();
     439 |       return (
     440 |         lower.includes("tests") ||
```

---

### 📁 `scripts/security-check.js`

#### 🟠 Line 90: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
      87 |   {
      88 |     id: "SEC-007",
      89 |     name: "Unbounded regex quantifier on user input",
>>>   90 |     pattern: /new\s+RegExp\s*\([^)]*[+*][^)]*\)/g,
      91 |     severity: "MEDIUM",
      92 |     message: "Use bounded quantifiers {1,N} to prevent ReDoS",
      93 |     fileTypes: [".js", ".ts", ".tsx"],
```

---

#### 🟡 Line 185: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     182 |  */
     183 | function getStagedFiles() {
     184 |   try {
>>>  185 |     const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
     186 |       cwd: PROJECT_ROOT,
     187 |       encoding: "utf8",
     188 |     });
```

---

#### 🔴 Line 189: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     186 |       cwd: PROJECT_ROOT,
     187 |       encoding: "utf8",
     188 |     });
>>>  189 |     return output
     190 |       .split("\n")
     191 |       .filter((f) => f.trim())
     192 |       .map((f) => join(PROJECT_ROOT, f))
```

---

#### 🔴 Line 189: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     186 |       cwd: PROJECT_ROOT,
     187 |       encoding: "utf8",
     188 |     });
>>>  189 |     return output
     190 |       .split("\n")
     191 |       .filter((f) => f.trim())
     192 |       .map((f) => join(PROJECT_ROOT, f))
```

---

#### 🔴 Line 189: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `javascript:S4721`

```js
     186 |       cwd: PROJECT_ROOT,
     187 |       encoding: "utf8",
     188 |     });
>>>  189 |     return output
     190 |       .split("\n")
     191 |       .filter((f) => f.trim())
     192 |       .map((f) => join(PROJECT_ROOT, f))
```

---

### 📁 `scripts/retry-failures.ts`

#### 🔴 Line 113: Make sure that executing this OS command is safe here.

- **Category**: command-injection
- **Vulnerability Probability**: HIGH
- **Rule**: `typescript:S4721`

```ts
     110 |
     111 |         // Use curl instead of fetch due to environment limitations
     112 |         const curlCommand = `curl -s -H "User-Agent: ${USER_AGENT}" -H "Referer: https://sonash.app" "${url}"`;
>>>  113 |         const responseText = execSync(curlCommand, { encoding: "utf8", maxBuffer: 1024 * 1024 });
     114 |
     115 |         const results = JSON.parse(responseText) as Array<{
     116 |           lat: string;
```

---

### 📁 `scripts/add-false-positive.js`

#### 🟠 Line 69: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
      66 |   // Length limit to prevent very large patterns
      67 |   if (pattern.length > 500) return true;
      68 |   // Nested quantifiers like (a+)+, (.*)+, ([\s\S]*)* etc.
>>>   69 |   if (/\((?:[^()]|\\.)*[+*?](?:[^()]|\\.)*\)[+*?]/.test(pattern)) return true;
      70 |   // Extremely broad dot-star with additional quantifiers
      71 |   if (/(?:\.\*|\[\s\S\]\*)[+*?]/.test(pattern)) return true;
      72 |   return false;
```

---

### 📁 `scripts/archive-doc.js`

#### 🟠 Line 228: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     225 |  */
     226 | function extractLastUpdated(content) {
     227 |   const patterns = [
>>>  228 |     /\*\*Last Updated:\*\*\s*(.+?)(?:\n|$)/i,
     229 |     /Last Updated:\s*(.+?)(?:\n|$)/i,
     230 |     /Updated:\s*(.+?)(?:\n|$)/i,
     231 |     /Date:\s*(.+?)(?:\n|$)/i,
```

---

#### 🟠 Line 229: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     226 | function extractLastUpdated(content) {
     227 |   const patterns = [
     228 |     /\*\*Last Updated:\*\*\s*(.+?)(?:\n|$)/i,
>>>  229 |     /Last Updated:\s*(.+?)(?:\n|$)/i,
     230 |     /Updated:\s*(.+?)(?:\n|$)/i,
     231 |     /Date:\s*(.+?)(?:\n|$)/i,
     232 |   ];
```

---

#### 🟠 Line 230: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     227 |   const patterns = [
     228 |     /\*\*Last Updated:\*\*\s*(.+?)(?:\n|$)/i,
     229 |     /Last Updated:\s*(.+?)(?:\n|$)/i,
>>>  230 |     /Updated:\s*(.+?)(?:\n|$)/i,
     231 |     /Date:\s*(.+?)(?:\n|$)/i,
     232 |   ];
     233 |
```

---

#### 🟠 Line 231: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     228 |     /\*\*Last Updated:\*\*\s*(.+?)(?:\n|$)/i,
     229 |     /Last Updated:\s*(.+?)(?:\n|$)/i,
     230 |     /Updated:\s*(.+?)(?:\n|$)/i,
>>>  231 |     /Date:\s*(.+?)(?:\n|$)/i,
     232 |   ];
     233 |
     234 |   for (const pattern of patterns) {
```

---

### 📁 `scripts/check-docs-light.js`

#### 🟠 Line 148: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     145 |   const lines = normalizeLineEndings(content).split("\n");
     146 |
     147 |   for (let i = 0; i < lines.length; i++) {
>>>  148 |     const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
     149 |     if (match) {
     150 |       headings.push({
     151 |         level: match[1].length,
```

---

#### 🟠 Line 173: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     170 |
     171 |   // Look for "Last Updated" in various formats
     172 |   const lastUpdatedPatterns = [
>>>  173 |     /\*\*Last Updated[:*]*\**\s*[:]*\s*(.+)/i,
     174 |     /Last Updated[:\s]+(.+)/i,
     175 |     /Updated[:\s]+(.+)/i,
     176 |   ];
```

---

#### 🟠 Line 188: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     185 |
     186 |   // Look for version number
     187 |   const versionPatterns = [
>>>  188 |     /\*\*(?:Document )?Version[:*]*\**\s*[:]*\s*(\d+\.?\d*)/i,
     189 |     /Version[:\s]+(\d+\.?\d*)/i,
     190 |     /\| (\d+\.\d+) \|.*\|.*\|/, // Version history table
     191 |   ];
```

---

#### 🟠 Line 244: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     241 |
     242 |   for (let i = 0; i < lines.length; i++) {
     243 |     // Match [text](target) links
>>>  244 |     const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
     245 |     let match;
     246 |
     247 |     while ((match = linkPattern.exec(lines[i])) !== null) {
```

---

### 📁 `scripts/check-document-sync.js`

#### 🟠 Line 71: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
      68 |   // Fixed ReDoS: bounded quantifiers {1,500} prevent exponential backtracking
      69 |   // Sync status column increased to {1,100} to accommodate longer descriptions
      70 |   const tableRegex =
>>>   71 |     /\|\s*\*\*([^*]{1,200})\*\*\s*\|\s*([^|]{1,500})\s*\|\s*([^|]{1,200})\s*\|\s*([^|]{1,50})\s*\|\s*([^|]{1,100})\s*\|/g;
      72 |   let match;
      73 |
      74 |   while ((match = tableRegex.exec(section1Content)) !== null) {
```

---

### 📁 `scripts/check-triggers.js`

#### 🟡 Line 69: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      66 |   let baseRef = null;
      67 |
      68 |   for (const candidate of baseCandidates) {
>>>   69 |     const verify = spawnSync("git", ["rev-parse", "--verify", candidate], {
      70 |       encoding: "utf-8",
      71 |       timeout: 3000,
      72 |     });
```

---

#### 🟡 Line 81: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      78 |
      79 |   if (baseRef) {
      80 |     // Try git merge-base for reliable branch divergence detection
>>>   81 |     const mergeBaseResult = spawnSync("git", ["merge-base", "HEAD", baseRef], {
      82 |       encoding: "utf-8",
      83 |       timeout: 5000,
      84 |     });
```

---

#### 🟡 Line 88: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      85 |
      86 |     if (mergeBaseResult.status === 0 && mergeBaseResult.stdout) {
      87 |       const mergeBase = mergeBaseResult.stdout.trim();
>>>   88 |       const diffResult = spawnSync("git", ["diff", "--name-only", `${mergeBase}..HEAD`], {
      89 |         encoding: "utf-8",
      90 |         timeout: 5000,
      91 |       });
```

---

#### 🟡 Line 99: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      96 |     }
      97 |
      98 |     // Fallback 1: try simple diff against base ref
>>>   99 |     const fallback1 = spawnSync("git", ["diff", "--name-only", `${baseRef}..HEAD`], {
     100 |       encoding: "utf-8",
     101 |       timeout: 5000,
     102 |     });
```

---

#### 🟡 Line 110: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     107 |   }
     108 |
     109 |   // Fallback 2: get files in last commit
>>>  110 |   const fallback2 = spawnSync("git", ["diff", "--name-only", "HEAD~1"], {
     111 |     encoding: "utf-8",
     112 |     timeout: 5000,
     113 |   });
```

---

#### 🟡 Line 120: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     117 |   }
     118 |
     119 |   // Fallback 3: staged changes only (works on initial commits / shallow clones)
>>>  120 |   const fallback3 = spawnSync("git", ["diff", "--name-only", "--cached"], {
     121 |     encoding: "utf-8",
     122 |     timeout: 5000,
     123 |   });
```

---

#### 🟡 Line 188: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     185 |   try {
     186 |     // Run consolidation check and parse output
     187 |     // Use spawnSync to avoid shell injection, combine stdout/stderr programmatically
>>>  188 |     const result = spawnSync("npm", ["run", "consolidation:check"], {
     189 |       encoding: "utf-8",
     190 |       timeout: 30000,
     191 |       maxBuffer: 1024 * 1024,
```

---

#### 🟠 Line 206: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     203 |     const output = `${result.stdout || ""}\n${result.stderr || ""}`;
     204 |
     205 |     // Look for "X reviews until next consolidation"
>>>  206 |     const match = output.match(/(\d+) reviews? until next consolidation/);
     207 |     if (match) {
     208 |       const remaining = Number.parseInt(match[1], 10);
     209 |       if (remaining <= trigger.threshold) {
```

---

#### 🟡 Line 273: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     270 |     try {
     271 |       const { execFileSync } = require("node:child_process");
     272 |       const reason = process.env.SKIP_REASON || "";
>>>  273 |       execFileSync("node", ["scripts/log-override.js", "--check=triggers", `--reason=${reason}`], {
     274 |         encoding: "utf-8",
     275 |         stdio: "inherit",
     276 |       });
```

---

### 📁 `scripts/suggest-pattern-automation.js`

#### 🟠 Line 49: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

````js
      46 |   },
      47 |   {
      48 |     // Code blocks after "Wrong:" headers
>>>   49 |     regex: /#+\s*(?:Wrong|Bad|INCORRECT)[^\n]*\n```[\w]*\n([\s\S]*?)```/gi,
      50 |     type: "wrong_block",
      51 |   },
      52 | ];
````

---

#### 🟠 Line 126: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     123 |   const seen = new Set(); // Deduplication
     124 |
     125 |   // Find review sections while preserving the review number for traceability
>>>  126 |   const sectionRegex = /####\s+Review\s+#(\d+)([\s\S]*?)(?=####\s+Review\s+#\d+|$)/gi;
     127 |   let sectionMatch;
     128 |   while ((sectionMatch = sectionRegex.exec(content)) !== null) {
     129 |     const reviewNumber = sectionMatch[1];
```

---

### 📁 `scripts/surface-lessons-learned.js`

#### 🟡 Line 85: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      82 |     // Get recently modified files - try HEAD~5 first, fall back to HEAD
      83 |     let changedFilesOutput = "";
      84 |     try {
>>>   85 |       changedFilesOutput = execSync("git diff --name-only HEAD~5", {
      86 |         encoding: "utf-8",
      87 |         stdio: ["ignore", "pipe", "ignore"],
      88 |       });
```

---

#### 🟡 Line 91: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      88 |       });
      89 |     } catch {
      90 |       // Fall back to diff against HEAD (no commits to compare)
>>>   91 |       changedFilesOutput = execSync("git diff --name-only", {
      92 |         encoding: "utf-8",
      93 |         stdio: ["ignore", "pipe", "ignore"],
      94 |       });
```

---

#### 🟡 Line 100: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      97 |     // Also include untracked and staged files from git status
      98 |     let statusOutput = "";
      99 |     try {
>>>  100 |       statusOutput = execSync("git status --porcelain", {
     101 |         encoding: "utf-8",
     102 |         stdio: ["ignore", "pipe", "ignore"],
     103 |       });
```

---

#### 🟠 Line 157: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     154 |   // Pattern: Review #XX: Title (uses #### headings in AI_REVIEW_LEARNINGS_LOG.md)
     155 |   // Use [\s\S]*? to capture content including ## subheadings within a review section
     156 |   // Handle both Unix (\n) and Windows (\r\n) line endings in lookahead
>>>  157 |   const reviewPattern = /#### Review #(\d+):?\s*([\s\S]*?)(?=\r?\n#### Review #|$)/g;
     158 |   let match;
     159 |
     160 |   while ((match = reviewPattern.exec(content)) !== null) {
```

---

### 📁 `scripts/update-readme-status.js`

#### 🟠 Line 159: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     156 |
     157 |   // Find the milestones table (starts after "## 📊 Milestones Overview")
     158 |   const tableMatch = content.match(
>>>  159 |     /## 📊 Milestones Overview[\s\S]*?\n\|[^\n]+\|[\s\S]*?\n\|[-|\s]+\|[\s\S]*?\n((?:\|[^\n]+\|\n?)+)/
     160 |   );
     161 |
     162 |   if (!tableMatch) {
```

---

#### 🟠 Line 165: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     162 |   if (!tableMatch) {
     163 |     // Try alternative heading formats
     164 |     const altMatch = content.match(
>>>  165 |       /## .*Milestones.*Overview[\s\S]*?\n\|[^\n]+\|[\s\S]*?\n\|[-|\s]+\|[\s\S]*?\n((?:\|[^\n]+\|\n?)+)/i
     166 |     );
     167 |     if (!altMatch) {
     168 |       return {
```

---

#### 🟠 Line 218: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     215 |     const priority = cells[4]?.trim() || "";
     216 |
     217 |     // Parse progress percentage (handle "~50%", "100%", "0%")
>>>  218 |     const progressMatch = progressStr.match(/~?(\d+)%/);
     219 |     const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
     220 |
     221 |     const milestone = { name, status, progress, target, priority };
```

---

### 📁 `scripts/validate-audit.js`

#### 🟠 Line 126: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     123 |   // Length limit to prevent very large patterns
     124 |   if (pattern.length > 500) return true;
     125 |   // Nested quantifiers like (a+)+, (.*)+, ([\s\S]*)* etc.
>>>  126 |   if (/\((?:[^()]|\\.)*[+*?](?:[^()]|\\.)*\)[+*?]/.test(pattern)) return true;
     127 |   // Extremely broad dot-star with additional quantifiers
     128 |   if (/(?:\.\*|\[\s\S\]\*)[+*?]/.test(pattern)) return true;
     129 |   return false;
```

---

#### 🟡 Line 345: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     342 |   let auditData = {};
     343 |   try {
     344 |     // Use stdio config instead of shell redirection for portability
>>>  345 |     const output = execSync("npm audit --json", {
     346 |       encoding: "utf8",
     347 |       cwd: node_path.join(__dirname, ".."),
     348 |       stdio: ["ignore", "pipe", "pipe"],
```

---

#### 🟡 Line 401: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     398 |     // Use stdio config for portability (no shell-specific syntax)
     399 |     let output = "";
     400 |     try {
>>>  401 |       output = execSync("npm run lint", {
     402 |         encoding: "utf8",
     403 |         cwd: node_path.join(__dirname, ".."),
     404 |         stdio: ["ignore", "pipe", "pipe"],
```

---

### 📁 `scripts/validate-skill-config.js`

#### 🟠 Line 126: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `javascript:S5852`

```js
     123 |   }
     124 |
     125 |   // Check 2: Title heading
>>>  126 |   const titleMatch = content.match(/^#\s+(.+)$/m);
     127 |   if (!titleMatch) {
     128 |     errors.push("Missing title heading (# Title)");
     129 |   }
```

---

### 📁 `app/meetings/all/page.tsx`

#### 🟠 Line 42: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S5852`

```tsx
      39 | // Helper to parse time string like "6:00 PM" or "18:00" to minutes since midnight
      40 | function parseTime(timeStr: string): number {
      41 |   // Try 12-hour format first (e.g., "6:00 PM")
>>>   42 |   const match12h = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      43 |   if (match12h) {
      44 |     const [, hours, minutes, meridiem] = match12h;
      45 |     let h = parseInt(hours);
```

---

### 📁 `functions/src/admin.ts`

#### 🟠 Line 143: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S5852`

```ts
     140 |
     141 | function sanitizeSentryTitle(title: string) {
     142 |   const redactedEmail = title.replace(
>>>  143 |     /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
     144 |     "[redacted-email]"
     145 |   );
     146 |   const redactedPhone = redactedEmail.replace(
```

---

### 📁 `functions/src/security-logger.ts`

#### 🟠 Line 392: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S5852`

```ts
     389 |       // Remove any potential PII from error messages
     390 |       if (event.message) {
     391 |         // Strip email-like patterns
>>>  392 |         event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL_REDACTED]");
     393 |       }
     394 |       return event;
     395 |     },
```

---

### 📁 `hooks/use-journal.ts`

#### 🟠 Line 76: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S5852`

```ts
      73 |       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      74 |       .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      75 |       // Remove remaining HTML tags
>>>   76 |       .replace(/<[^>]*>/g, "")
      77 |       // Remove potentially dangerous patterns (event handlers, javascript:, data:)
      78 |       .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      79 |       .replace(/javascript:/gi, "")
```

---

### 📁 `lib/sentry.client.ts`

#### 🟠 Line 48: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S5852`

```ts
      45 |     beforeSend(event) {
      46 |       // Redact any email addresses in error messages
      47 |       if (event.message) {
>>>   48 |         event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL_REDACTED]");
      49 |       }
      50 |
      51 |       // Redact breadcrumb data that might contain PII
```

---

### 📁 `scripts/seed-meetings.ts`

#### 🟠 Line 78: Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service.

- **Category**: dos
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S5852`

```ts
      75 |
      76 |     // CSV split handling quotes
      77 |     const cols = line
>>>   78 |       .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      79 |       .map((s) => s.trim().replace(/^"|"$/g, ""));
      80 |
      81 |     if (cols.length < 7) {
```

---

### 📁 `tests/utils/admin-error-utils.test.ts`

#### 🟡 Line 183: Using http protocol is insecure. Use https instead.

- **Category**: encrypt-data
- **Vulnerability Probability**: LOW
- **Rule**: `typescript:S5332`

```ts
     180 |     });
     181 |
     182 |     test("returns false for http (non-https) URLs", () => {
>>>  183 |       assert.equal(isValidSentryUrl("http://sentry.io/issues/123"), false);
     184 |     });
     185 |
     186 |     test("returns false for non-sentry domains", () => {
```

---

#### 🟠 Line 194: Make sure that 'javascript:' code is safe as it is a form of eval().

- **Category**: rce
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S1523`

```ts
     191 |
     192 |     test("returns false for javascript: protocol", () => {
     193 |       // This is a security test - javascript: URLs should be blocked
>>>  194 |       assert.equal(isValidSentryUrl("javascript:alert('xss')"), false);
     195 |     });
     196 |
     197 |     test("returns false for data: protocol", () => {
```

---

### 📁 `components/celebrations/confetti-burst.tsx`

#### 🟠 Line 39: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      36 |       const shapes: ("circle" | "square" | "rectangle")[] = ["circle", "square", "rectangle"];
      37 |       return {
      38 |         id: i,
>>>   39 |         x: Math.random() * window.innerWidth,
      40 |         y: -20 - Math.random() * 100, // Stagger starting positions
      41 |         rotation: Math.random() * 360,
      42 |         color: colors[Math.floor(Math.random() * colors.length)],
```

---

#### 🟠 Line 40: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      37 |       return {
      38 |         id: i,
      39 |         x: Math.random() * window.innerWidth,
>>>   40 |         y: -20 - Math.random() * 100, // Stagger starting positions
      41 |         rotation: Math.random() * 360,
      42 |         color: colors[Math.floor(Math.random() * colors.length)],
      43 |         size: Math.random() * 8 + 4, // 4-12px
```

---

#### 🟠 Line 41: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      38 |         id: i,
      39 |         x: Math.random() * window.innerWidth,
      40 |         y: -20 - Math.random() * 100, // Stagger starting positions
>>>   41 |         rotation: Math.random() * 360,
      42 |         color: colors[Math.floor(Math.random() * colors.length)],
      43 |         size: Math.random() * 8 + 4, // 4-12px
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
```

---

#### 🟠 Line 42: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      39 |         x: Math.random() * window.innerWidth,
      40 |         y: -20 - Math.random() * 100, // Stagger starting positions
      41 |         rotation: Math.random() * 360,
>>>   42 |         color: colors[Math.floor(Math.random() * colors.length)],
      43 |         size: Math.random() * 8 + 4, // 4-12px
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
      45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
```

---

#### 🟠 Line 43: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      40 |         y: -20 - Math.random() * 100, // Stagger starting positions
      41 |         rotation: Math.random() * 360,
      42 |         color: colors[Math.floor(Math.random() * colors.length)],
>>>   43 |         size: Math.random() * 8 + 4, // 4-12px
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
      45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
      46 |         finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
```

---

#### 🟠 Line 44: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      41 |         rotation: Math.random() * 360,
      42 |         color: colors[Math.floor(Math.random() * colors.length)],
      43 |         size: Math.random() * 8 + 4, // 4-12px
>>>   44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
      45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
      46 |         finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
      47 |         animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
```

---

#### 🟠 Line 45: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      42 |         color: colors[Math.floor(Math.random() * colors.length)],
      43 |         size: Math.random() * 8 + 4, // 4-12px
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
>>>   45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
      46 |         finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
      47 |         animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
      48 |       };
```

---

#### 🟠 Line 46: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      43 |         size: Math.random() * 8 + 4, // 4-12px
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
      45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
>>>   46 |         finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
      47 |         animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
      48 |       };
      49 |     });
```

---

#### 🟠 Line 46: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      43 |         size: Math.random() * 8 + 4, // 4-12px
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
      45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
>>>   46 |         finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
      47 |         animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
      48 |       };
      49 |     });
```

---

#### 🟠 Line 47: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      44 |         velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
      45 |         shape: shapes[Math.floor(Math.random() * shapes.length)],
      46 |         finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
>>>   47 |         animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
      48 |       };
      49 |     });
      50 |   });
```

---

### 📁 `components/celebrations/firework-burst.tsx`

#### 🟠 Line 39: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      36 |       const sparks = Array.from({ length: sparkCount }, (_, i) => ({
      37 |         id: i,
      38 |         angle: (360 / sparkCount) * i,
>>>   39 |         color: colors[Math.floor(Math.random() * colors.length)],
      40 |         distance: 100 + Math.random() * 100, // 100-200px radius
      41 |       }));
      42 |
```

---

#### 🟠 Line 40: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      37 |         id: i,
      38 |         angle: (360 / sparkCount) * i,
      39 |         color: colors[Math.floor(Math.random() * colors.length)],
>>>   40 |         distance: 100 + Math.random() * 100, // 100-200px radius
      41 |       }));
      42 |
      43 |       return {
```

---

#### 🟠 Line 45: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      42 |
      43 |       return {
      44 |         id,
>>>   45 |         x: Math.random() * window.innerWidth,
      46 |         y: Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2, // Middle 60% of screen
      47 |         color: colors[Math.floor(Math.random() * colors.length)],
      48 |         sparks,
```

---

#### 🟠 Line 46: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      43 |       return {
      44 |         id,
      45 |         x: Math.random() * window.innerWidth,
>>>   46 |         y: Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2, // Middle 60% of screen
      47 |         color: colors[Math.floor(Math.random() * colors.length)],
      48 |         sparks,
      49 |       };
```

---

#### 🟠 Line 47: Make sure that using this pseudorandom number generator is safe here.

- **Category**: weak-cryptography
- **Vulnerability Probability**: MEDIUM
- **Rule**: `typescript:S2245`

```tsx
      44 |         id,
      45 |         x: Math.random() * window.innerWidth,
      46 |         y: Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2, // Middle 60% of screen
>>>   47 |         color: colors[Math.floor(Math.random() * colors.length)],
      48 |         sparks,
      49 |       };
      50 |     };
```

---

### 📁 `.github/workflows/auto-label-review-tier.yml`

#### 🟡 Line 29: Use full commit SHA hash for this dependency.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `githubactions:S7637`

```yml
      26 |
      27 |       - name: Get changed files
      28 |         id: changed-files
>>>   29 |         uses: tj-actions/changed-files@v46
      30 |         with:
      31 |           files: |
      32 |             **/*.ts
```

---

### 📁 `.github/workflows/docs-lint.yml`

#### 🟡 Line 36: Use full commit SHA hash for this dependency.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `githubactions:S7637`

```yml
      33 |
      34 |       - name: Get changed markdown files
      35 |         id: changed-files
>>>   36 |         uses: tj-actions/changed-files@v46
      37 |         with:
      38 |           files: |
      39 |             **/*.md
```

---

### 📁 `.github/workflows/deploy-firebase.yml`

#### 🟡 Line 58: Avoid expanding secrets in a run block.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `githubactions:S7636`

```yml
      55 |       - name: Setup Firebase Service Account
      56 |         run: |
      57 |           # Create secure temporary file for service account credentials
>>>   58 |           echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > $HOME/gcloud-key.json
      59 |           chmod 600 $HOME/gcloud-key.json
      60 |           echo "GOOGLE_APPLICATION_CREDENTIALS=$HOME/gcloud-key.json" >> $GITHUB_ENV
      61 |
```

---

### 📁 `hooks/use-geolocation.ts`

#### 🟡 Line 104: Make sure the use of the geolocation is necessary.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `typescript:S5604`

```ts
     101 |       error: null,
     102 |     }));
     103 |
>>>  104 |     navigator.geolocation.getCurrentPosition(
     105 |       // Success callback
     106 |       (position) => {
     107 |         setState({
```

---

### 📁 `scripts/check-cross-doc-deps.js`

#### 🟡 Line 122: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     119 | function getStagedFiles() {
     120 |   try {
     121 |     // Use execFileSync with args array for security consistency (Review #157)
>>>  122 |     const output = execFileSync("git", ["diff", "--cached", "--name-only"], {
     123 |       encoding: "utf-8",
     124 |     });
     125 |     return output
```

---

#### 🟡 Line 142: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     139 |   try {
     140 |     // Use execFileSync with args array to prevent command injection (SEC-001, SEC-010)
     141 |     // Use -- separator to prevent option injection from filenames starting with - (Review #158)
>>>  142 |     const diff = execFileSync("git", ["diff", "--cached", "--unified=0", "--", file], {
     143 |       encoding: "utf-8",
     144 |     });
     145 |     return pattern.test(diff);
```

---

### 📁 `scripts/log-override.js`

#### 🟡 Line 30: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      27 |
      28 | // Get repository root for consistent log location
      29 | function getRepoRoot() {
>>>   30 |   const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      31 |     encoding: "utf-8",
      32 |     timeout: 3000,
      33 |   });
```

---

#### 🟡 Line 170: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
     167 | function getGitBranch() {
     168 |   try {
     169 |     const { spawnSync } = require("node:child_process");
>>>  170 |     const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
     171 |       encoding: "utf-8",
     172 |       timeout: 3000,
     173 |     });
```

---

### 📁 `scripts/log-session-activity.js`

#### 🟡 Line 30: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      27 |
      28 | // Get repository root for consistent log location
      29 | function getRepoRoot() {
>>>   30 |   const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      31 |     encoding: "utf-8",
      32 |     timeout: 3000,
      33 |   });
```

---

### 📁 `scripts/verify-skill-usage.js`

#### 🟡 Line 31: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `javascript:S4036`

```js
      28 |
      29 | // Get repository root for consistent log location
      30 | function getRepoRoot() {
>>>   31 |   const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      32 |     encoding: "utf-8",
      33 |     timeout: 3000,
      34 |   });
```

---

### 📁 `tests/scripts/check-docs-light.test.ts`

#### 🟡 Line 39: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `typescript:S4036`

```ts
      36 |   exitCode: number;
      37 | } {
      38 |   const cwd = options.cwd || PROJECT_ROOT;
>>>   39 |   const result = spawnSync("node", [SCRIPT_PATH, ...args], {
      40 |     cwd,
      41 |     encoding: "utf-8",
      42 |     timeout: 60000, // Longer timeout as it scans many files
```

---

### 📁 `tests/scripts/phase-complete-check.test.ts`

#### 🟡 Line 29: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `typescript:S4036`

```ts
      26 |   exitCode: number;
      27 | } {
      28 |   const cwd = options.cwd || PROJECT_ROOT;
>>>   29 |   const result = spawnSync("node", [SCRIPT_PATH, ...args], {
      30 |     cwd,
      31 |     encoding: "utf-8",
      32 |     timeout: 60000, // 60s timeout for tests (script runs npm test internally)
```

---

### 📁 `tests/scripts/surface-lessons-learned.test.ts`

#### 🟡 Line 29: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `typescript:S4036`

```ts
      26 |   exitCode: number;
      27 | } {
      28 |   const cwd = options.cwd || PROJECT_ROOT;
>>>   29 |   const result = spawnSync("node", [SCRIPT_PATH, ...args], {
      30 |     cwd,
      31 |     encoding: "utf-8",
      32 |     timeout: 10000,
```

---

### 📁 `tests/scripts/update-readme-status.test.ts`

#### 🟡 Line 26: Make sure the "PATH" variable only contains fixed, unwriteable directories.

- **Category**: others
- **Vulnerability Probability**: LOW
- **Rule**: `typescript:S4036`

```ts
      23 |   exitCode: number;
      24 | } {
      25 |   const cwd = options.cwd || PROJECT_ROOT;
>>>   26 |   const result = spawnSync("node", [SCRIPT_PATH, ...args], {
      27 |     cwd,
      28 |     encoding: "utf-8",
      29 |     timeout: 30000,
```

---

---

## 📂 All Issues by File

### 📁 `scripts/generate-documentation-index.js` (213 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 75: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      72 | };
      73 |
      74 | // Parse command line arguments
>>>   75 | const args = process.argv.slice(2);
      76 | const jsonOutput = args.includes("--json");
      77 | const verbose = args.includes("--verbose");
      78 |
```

---

#### 🔵 Line 123: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     120 | function escapeTableCell(text) {
     121 |   if (!text) return "";
     122 |   return String(text)
>>>  123 |     .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
```

---

#### 🔵 Line 124: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     121 |   if (!text) return "";
     122 |   return String(text)
     123 |     .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
>>>  124 |     .replace(/\\/g, "\\\\") // Escape backslash second
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
```

---

#### 🔵 Line 125: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     122 |   return String(text)
     123 |     .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
>>>  125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
```

---

#### 🔵 Line 125: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     122 |   return String(text)
     123 |     .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
>>>  125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
```

---

#### 🔵 Line 126: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     123 |     .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
>>>  126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
```

---

#### 🔵 Line 126: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     123 |     .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
>>>  126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
```

---

#### 🔵 Line 127: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
>>>  127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
```

---

#### 🔵 Line 127: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     124 |     .replace(/\\/g, "\\\\") // Escape backslash second
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
>>>  127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
```

---

#### 🔵 Line 128: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
>>>  128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
```

---

#### 🔵 Line 128: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     125 |     .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
>>>  128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
```

---

#### 🔵 Line 129: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
>>>  129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
     132 |     .replace(/>/g, "&gt;")
```

---

#### 🔵 Line 129: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     126 |     .replace(/\[/g, "\\[") // Escape opening bracket
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
>>>  129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
     132 |     .replace(/>/g, "&gt;")
```

---

#### 🔵 Line 130: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     127 |     .replace(/\]/g, "\\]") // Escape closing bracket
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
>>>  130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
     132 |     .replace(/>/g, "&gt;")
     133 |     .replace(/\n/g, " ") // Replace newlines with spaces
```

---

#### 🔵 Line 131: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     128 |     .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
>>>  131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
     132 |     .replace(/>/g, "&gt;")
     133 |     .replace(/\n/g, " ") // Replace newlines with spaces
     134 |     .replace(/\r/g, ""); // Remove carriage returns
```

---

#### 🔵 Line 132: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     129 |     .replace(/\)/g, "\\)") // Escape closing paren
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
>>>  132 |     .replace(/>/g, "&gt;")
     133 |     .replace(/\n/g, " ") // Replace newlines with spaces
     134 |     .replace(/\r/g, ""); // Remove carriage returns
     135 | }
```

---

#### 🔵 Line 133: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     130 |     .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
     132 |     .replace(/>/g, "&gt;")
>>>  133 |     .replace(/\n/g, " ") // Replace newlines with spaces
     134 |     .replace(/\r/g, ""); // Remove carriage returns
     135 | }
     136 |
```

---

#### 🔵 Line 134: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     131 |     .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
     132 |     .replace(/>/g, "&gt;")
     133 |     .replace(/\n/g, " ") // Replace newlines with spaces
>>>  134 |     .replace(/\r/g, ""); // Remove carriage returns
     135 | }
     136 |
     137 | /**
```

---

#### 🟠 Line 141: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     138 |  * Find all markdown files in the repository
     139 |  * Returns { active: [], archived: [] }
     140 |  */
>>>  141 | function findMarkdownFiles(dir, result = { active: [], archived: [] }) {
     142 |   let entries;
     143 |   try {
     144 |     entries = readdirSync(dir);
```

---

#### 🔵 Line 141: Do not use an object literal as default for parameter `result`.

- **Rule**: `javascript:S7737`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     138 |  * Find all markdown files in the repository
     139 |  * Returns { active: [], archived: [] }
     140 |  */
>>>  141 | function findMarkdownFiles(dir, result = { active: [], archived: [] }) {
     142 |   let entries;
     143 |   try {
     144 |     entries = readdirSync(dir);
```

---

#### 🔵 Line 160: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     157 |
     158 |   for (const entry of entries) {
     159 |     const fullPath = join(dir, entry);
>>>  160 |     const relativePath = relative(ROOT, fullPath).replace(/\\/g, "/"); // Cross-platform normalization
     161 |
     162 |     // Skip excluded directories (with proper boundary check)
     163 |     if (
```

---

#### 🔵 Line 272: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     269 |   }
     270 |
     271 |   // Fall back to filename
>>>  272 |   return basename(filename, ".md").replace(/[-_]/g, " ");
     273 | }
     274 |
     275 | /**
```

---

#### 🟠 Line 279: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```js
     276 |  * Extract description from markdown content
     277 |  * All regex patterns use bounded quantifiers to prevent ReDoS
     278 |  */
>>>  279 | function extractDescription(content) {
     280 |   // Try to find Purpose section (bounded to 2000 chars to prevent ReDoS)
     281 |   const purposeMatch = content.match(
     282 |     /##\s*Purpose\s*\r?\n\r?\n([\s\S]{0,2000}?)(?=\r?\n##|\r?\n---|$)/i
```

---

#### 🟠 Line 360: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

```js
     357 | /**
     358 |  * Extract all markdown links from content
     359 |  */
>>>  360 | function extractLinks(content, currentFile) {
     361 |   const links = [];
     362 |   const seenTargets = new Set(); // Deduplicate links to same target
     363 |   const currentDir = dirname(currentFile);
```

---

#### 🔵 Line 427: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     424 |     }
     425 |
     426 |     // Normalize path (cross-platform)
>>>  427 |     resolvedPath = resolvedPath.replace(/\\/g, "/");
     428 |
     429 |     // Canonicalize path to resolve . and .. segments properly
     430 |     // This handles cases like "docs/../scripts/file.md" → "scripts/file.md"
```

---

#### 🔵 Line 484: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     481 |   // Default category
     482 |   return {
     483 |     path: dir,
>>>  484 |     name: dir.replace(/\//g, " > "),
     485 |     tier: 4,
     486 |     description: "Uncategorized",
     487 |   };
```

---

#### 🟠 Line 558: Refactor this function to reduce its Cognitive Complexity from 56 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 46min

```js
     555 | /**
     556 |  * Generate markdown output
     557 |  */
>>>  558 | function generateMarkdown(docs, referenceGraph, archivedFiles = []) {
     559 |   const lines = [];
     560 |   const now = new Date().toISOString().split("T")[0];
     561 |
```

---

#### 🔵 Line 567: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     564 |
     565 |   // Header
     566 |   lines.push("# Documentation Index");
>>>  567 |   lines.push("");
     568 |   lines.push(
     569 |     "> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to regenerate."
     570 |   );
```

---

#### 🔵 Line 568: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     565 |   // Header
     566 |   lines.push("# Documentation Index");
     567 |   lines.push("");
>>>  568 |   lines.push(
     569 |     "> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to regenerate."
     570 |   );
     571 |   lines.push("");
```

---

#### 🔵 Line 571: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     568 |   lines.push(
     569 |     "> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to regenerate."
     570 |   );
>>>  571 |   lines.push("");
     572 |   lines.push(`**Generated:** ${now}`);
     573 |   lines.push(`**Active Documents:** ${docs.length}`);
     574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
```

---

#### 🔵 Line 572: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     569 |     "> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to regenerate."
     570 |   );
     571 |   lines.push("");
>>>  572 |   lines.push(`**Generated:** ${now}`);
     573 |   lines.push(`**Active Documents:** ${docs.length}`);
     574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
     575 |   lines.push("");
```

---

#### 🔵 Line 573: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     570 |   );
     571 |   lines.push("");
     572 |   lines.push(`**Generated:** ${now}`);
>>>  573 |   lines.push(`**Active Documents:** ${docs.length}`);
     574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
     575 |   lines.push("");
     576 |   lines.push("---");
```

---

#### 🔵 Line 574: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     571 |   lines.push("");
     572 |   lines.push(`**Generated:** ${now}`);
     573 |   lines.push(`**Active Documents:** ${docs.length}`);
>>>  574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
     575 |   lines.push("");
     576 |   lines.push("---");
     577 |   lines.push("");
```

---

#### 🔵 Line 575: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     572 |   lines.push(`**Generated:** ${now}`);
     573 |   lines.push(`**Active Documents:** ${docs.length}`);
     574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
>>>  575 |   lines.push("");
     576 |   lines.push("---");
     577 |   lines.push("");
     578 |
```

---

#### 🔵 Line 576: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     573 |   lines.push(`**Active Documents:** ${docs.length}`);
     574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
     575 |   lines.push("");
>>>  576 |   lines.push("---");
     577 |   lines.push("");
     578 |
     579 |   // Table of Contents
```

---

#### 🔵 Line 577: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     574 |   lines.push(`**Archived Documents:** ${archivedFiles.length}`);
     575 |   lines.push("");
     576 |   lines.push("---");
>>>  577 |   lines.push("");
     578 |
     579 |   // Table of Contents
     580 |   lines.push("## Table of Contents");
```

---

#### 🔵 Line 580: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     577 |   lines.push("");
     578 |
     579 |   // Table of Contents
>>>  580 |   lines.push("## Table of Contents");
     581 |   lines.push("");
     582 |   lines.push("1. [Summary Statistics](#summary-statistics)");
     583 |   lines.push("2. [Documents by Category](#documents-by-category)");
```

---

#### 🔵 Line 581: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     578 |
     579 |   // Table of Contents
     580 |   lines.push("## Table of Contents");
>>>  581 |   lines.push("");
     582 |   lines.push("1. [Summary Statistics](#summary-statistics)");
     583 |   lines.push("2. [Documents by Category](#documents-by-category)");
     584 |   lines.push("3. [Reference Graph](#reference-graph)");
```

---

#### 🔵 Line 582: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     579 |   // Table of Contents
     580 |   lines.push("## Table of Contents");
     581 |   lines.push("");
>>>  582 |   lines.push("1. [Summary Statistics](#summary-statistics)");
     583 |   lines.push("2. [Documents by Category](#documents-by-category)");
     584 |   lines.push("3. [Reference Graph](#reference-graph)");
     585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
```

---

#### 🔵 Line 583: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     580 |   lines.push("## Table of Contents");
     581 |   lines.push("");
     582 |   lines.push("1. [Summary Statistics](#summary-statistics)");
>>>  583 |   lines.push("2. [Documents by Category](#documents-by-category)");
     584 |   lines.push("3. [Reference Graph](#reference-graph)");
     585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
     586 |   lines.push("5. [Full Document List](#full-document-list)");
```

---

#### 🔵 Line 584: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     581 |   lines.push("");
     582 |   lines.push("1. [Summary Statistics](#summary-statistics)");
     583 |   lines.push("2. [Documents by Category](#documents-by-category)");
>>>  584 |   lines.push("3. [Reference Graph](#reference-graph)");
     585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
     586 |   lines.push("5. [Full Document List](#full-document-list)");
     587 |   lines.push("6. [Archived Documents](#archived-documents)");
```

---

#### 🔵 Line 585: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     582 |   lines.push("1. [Summary Statistics](#summary-statistics)");
     583 |   lines.push("2. [Documents by Category](#documents-by-category)");
     584 |   lines.push("3. [Reference Graph](#reference-graph)");
>>>  585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
     586 |   lines.push("5. [Full Document List](#full-document-list)");
     587 |   lines.push("6. [Archived Documents](#archived-documents)");
     588 |   lines.push("");
```

---

#### 🔵 Line 586: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     583 |   lines.push("2. [Documents by Category](#documents-by-category)");
     584 |   lines.push("3. [Reference Graph](#reference-graph)");
     585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
>>>  586 |   lines.push("5. [Full Document List](#full-document-list)");
     587 |   lines.push("6. [Archived Documents](#archived-documents)");
     588 |   lines.push("");
     589 |   lines.push("---");
```

---

#### 🔵 Line 587: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     584 |   lines.push("3. [Reference Graph](#reference-graph)");
     585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
     586 |   lines.push("5. [Full Document List](#full-document-list)");
>>>  587 |   lines.push("6. [Archived Documents](#archived-documents)");
     588 |   lines.push("");
     589 |   lines.push("---");
     590 |   lines.push("");
```

---

#### 🔵 Line 588: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     585 |   lines.push("4. [Orphaned Documents](#orphaned-documents)");
     586 |   lines.push("5. [Full Document List](#full-document-list)");
     587 |   lines.push("6. [Archived Documents](#archived-documents)");
>>>  588 |   lines.push("");
     589 |   lines.push("---");
     590 |   lines.push("");
     591 |
```

---

#### 🔵 Line 589: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     586 |   lines.push("5. [Full Document List](#full-document-list)");
     587 |   lines.push("6. [Archived Documents](#archived-documents)");
     588 |   lines.push("");
>>>  589 |   lines.push("---");
     590 |   lines.push("");
     591 |
     592 |   // Summary Statistics
```

---

#### 🔵 Line 590: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     587 |   lines.push("6. [Archived Documents](#archived-documents)");
     588 |   lines.push("");
     589 |   lines.push("---");
>>>  590 |   lines.push("");
     591 |
     592 |   // Summary Statistics
     593 |   lines.push("## Summary Statistics");
```

---

#### 🔵 Line 593: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     590 |   lines.push("");
     591 |
     592 |   // Summary Statistics
>>>  593 |   lines.push("## Summary Statistics");
     594 |   lines.push("");
     595 |
     596 |   // Count by category
```

---

#### 🔵 Line 594: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     591 |
     592 |   // Summary Statistics
     593 |   lines.push("## Summary Statistics");
>>>  594 |   lines.push("");
     595 |
     596 |   // Count by category
     597 |   const categoryCount = new Map();
```

---

#### 🔵 Line 607: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     604 |   }
     605 |
     606 |   lines.push("### By Tier");
>>>  607 |   lines.push("");
     608 |   lines.push("| Tier | Count | Description |");
     609 |   lines.push("|------|-------|-------------|");
     610 |   for (const tier of [1, 2, 3, 4, 5]) {
```

---

#### 🔵 Line 608: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     605 |
     606 |   lines.push("### By Tier");
     607 |   lines.push("");
>>>  608 |   lines.push("| Tier | Count | Description |");
     609 |   lines.push("|------|-------|-------------|");
     610 |   for (const tier of [1, 2, 3, 4, 5]) {
     611 |     const count = tierCount.get(tier) || 0;
```

---

#### 🔵 Line 609: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     606 |   lines.push("### By Tier");
     607 |   lines.push("");
     608 |   lines.push("| Tier | Count | Description |");
>>>  609 |   lines.push("|------|-------|-------------|");
     610 |   for (const tier of [1, 2, 3, 4, 5]) {
     611 |     const count = tierCount.get(tier) || 0;
     612 |     const desc =
```

---

#### 🟡 Line 615: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     612 |     const desc =
     613 |       tier === 1
     614 |         ? "Essential"
>>>  615 |         : tier === 2
     616 |           ? "Core"
     617 |           : tier === 3
     618 |             ? "Specialized"
```

---

#### 🟡 Line 617: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     614 |         ? "Essential"
     615 |         : tier === 2
     616 |           ? "Core"
>>>  617 |           : tier === 3
     618 |             ? "Specialized"
     619 |             : tier === 4
     620 |               ? "Reference"
```

---

#### 🟡 Line 619: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     616 |           ? "Core"
     617 |           : tier === 3
     618 |             ? "Specialized"
>>>  619 |             : tier === 4
     620 |               ? "Reference"
     621 |               : "Archive";
     622 |     lines.push(`| Tier ${tier} | ${count} | ${desc} |`);
```

---

#### 🔵 Line 626: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     623 |   }
     624 |   lines.push("");
     625 |
>>>  626 |   lines.push("### By Category");
     627 |   lines.push("");
     628 |   lines.push("| Category | Count |");
     629 |   lines.push("|----------|-------|");
```

---

#### 🔵 Line 627: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     624 |   lines.push("");
     625 |
     626 |   lines.push("### By Category");
>>>  627 |   lines.push("");
     628 |   lines.push("| Category | Count |");
     629 |   lines.push("|----------|-------|");
     630 |   const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
```

---

#### 🔵 Line 628: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     625 |
     626 |   lines.push("### By Category");
     627 |   lines.push("");
>>>  628 |   lines.push("| Category | Count |");
     629 |   lines.push("|----------|-------|");
     630 |   const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
     631 |   for (const [cat, count] of sortedCategories) {
```

---

#### 🔵 Line 629: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     626 |   lines.push("### By Category");
     627 |   lines.push("");
     628 |   lines.push("| Category | Count |");
>>>  629 |   lines.push("|----------|-------|");
     630 |   const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
     631 |   for (const [cat, count] of sortedCategories) {
     632 |     lines.push(`| ${cat} | ${count} |`);
```

---

#### 🔵 Line 635: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     632 |     lines.push(`| ${cat} | ${count} |`);
     633 |   }
     634 |   lines.push("");
>>>  635 |   lines.push("---");
     636 |   lines.push("");
     637 |
     638 |   // Documents by Category
```

---

#### 🔵 Line 636: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     633 |   }
     634 |   lines.push("");
     635 |   lines.push("---");
>>>  636 |   lines.push("");
     637 |
     638 |   // Documents by Category
     639 |   lines.push("## Documents by Category");
```

---

#### 🔵 Line 639: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     636 |   lines.push("");
     637 |
     638 |   // Documents by Category
>>>  639 |   lines.push("## Documents by Category");
     640 |   lines.push("");
     641 |
     642 |   // Group docs by category
```

---

#### 🔵 Line 640: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     637 |
     638 |   // Documents by Category
     639 |   lines.push("## Documents by Category");
>>>  640 |   lines.push("");
     641 |
     642 |   // Group docs by category
     643 |   const byCategory = new Map();
```

---

#### 🔵 Line 664: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     661 |     const { category, docs: catDocs } = byCategory.get(catKey);
     662 |
     663 |     lines.push(`### ${category.name} (Tier ${category.tier})`);
>>>  664 |     lines.push("");
     665 |     lines.push(`*${category.description}*`);
     666 |     lines.push("");
     667 |     lines.push("| Document | Description | References | Last Modified |");
```

---

#### 🔵 Line 665: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     662 |
     663 |     lines.push(`### ${category.name} (Tier ${category.tier})`);
     664 |     lines.push("");
>>>  665 |     lines.push(`*${category.description}*`);
     666 |     lines.push("");
     667 |     lines.push("| Document | Description | References | Last Modified |");
     668 |     lines.push("|----------|-------------|------------|---------------|");
```

---

#### 🔵 Line 666: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     663 |     lines.push(`### ${category.name} (Tier ${category.tier})`);
     664 |     lines.push("");
     665 |     lines.push(`*${category.description}*`);
>>>  666 |     lines.push("");
     667 |     lines.push("| Document | Description | References | Last Modified |");
     668 |     lines.push("|----------|-------------|------------|---------------|");
     669 |
```

---

#### 🔵 Line 667: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     664 |     lines.push("");
     665 |     lines.push(`*${category.description}*`);
     666 |     lines.push("");
>>>  667 |     lines.push("| Document | Description | References | Last Modified |");
     668 |     lines.push("|----------|-------------|------------|---------------|");
     669 |
     670 |     // Sort docs by name
```

---

#### 🔵 Line 668: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     665 |     lines.push(`*${category.description}*`);
     666 |     lines.push("");
     667 |     lines.push("| Document | Description | References | Last Modified |");
>>>  668 |     lines.push("|----------|-------------|------------|---------------|");
     669 |
     670 |     // Sort docs by name
     671 |     catDocs.sort((a, b) => a.title.localeCompare(b.title));
```

---

#### 🟡 Line 680: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     677 |       const refStr = `↓${inCount} ↑${outCount}`;
     678 |       // Escape pipe characters in description for markdown table
     679 |       let desc = doc.description
>>>  680 |         ? doc.description.slice(0, 60) + (doc.description.length > 60 ? "..." : "")
     681 |         : "-";
     682 |       desc = desc.replace(/\|/g, "\\|");
     683 |       const linkPath = encodeURI(doc.path);
```

---

#### 🔵 Line 682: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     679 |       let desc = doc.description
     680 |         ? doc.description.slice(0, 60) + (doc.description.length > 60 ? "..." : "")
     681 |         : "-";
>>>  682 |       desc = desc.replace(/\|/g, "\\|");
     683 |       const linkPath = encodeURI(doc.path);
     684 |       // Escape pipe characters in title for markdown table
     685 |       const safeTitle = doc.title.replace(/\|/g, "\\|");
```

---

#### 🔵 Line 682: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     679 |       let desc = doc.description
     680 |         ? doc.description.slice(0, 60) + (doc.description.length > 60 ? "..." : "")
     681 |         : "-";
>>>  682 |       desc = desc.replace(/\|/g, "\\|");
     683 |       const linkPath = encodeURI(doc.path);
     684 |       // Escape pipe characters in title for markdown table
     685 |       const safeTitle = doc.title.replace(/\|/g, "\\|");
```

---

#### 🔵 Line 685: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     682 |       desc = desc.replace(/\|/g, "\\|");
     683 |       const linkPath = encodeURI(doc.path);
     684 |       // Escape pipe characters in title for markdown table
>>>  685 |       const safeTitle = doc.title.replace(/\|/g, "\\|");
     686 |       lines.push(`| [${safeTitle}](${linkPath}) | ${desc} | ${refStr} | ${doc.lastModified} |`);
     687 |     }
     688 |     lines.push("");
```

---

#### 🔵 Line 685: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     682 |       desc = desc.replace(/\|/g, "\\|");
     683 |       const linkPath = encodeURI(doc.path);
     684 |       // Escape pipe characters in title for markdown table
>>>  685 |       const safeTitle = doc.title.replace(/\|/g, "\\|");
     686 |       lines.push(`| [${safeTitle}](${linkPath}) | ${desc} | ${refStr} | ${doc.lastModified} |`);
     687 |     }
     688 |     lines.push("");
```

---

#### 🔵 Line 692: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     689 |   }
     690 |
     691 |   lines.push("---");
>>>  692 |   lines.push("");
     693 |
     694 |   // Reference Graph - Most Connected
     695 |   lines.push("## Reference Graph");
```

---

#### 🔵 Line 695: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     692 |   lines.push("");
     693 |
     694 |   // Reference Graph - Most Connected
>>>  695 |   lines.push("## Reference Graph");
     696 |   lines.push("");
     697 |   lines.push("### Most Referenced Documents (Inbound Links)");
     698 |   lines.push("");
```

---

#### 🔵 Line 696: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     693 |
     694 |   // Reference Graph - Most Connected
     695 |   lines.push("## Reference Graph");
>>>  696 |   lines.push("");
     697 |   lines.push("### Most Referenced Documents (Inbound Links)");
     698 |   lines.push("");
     699 |   lines.push("Documents that are linked to most frequently:");
```

---

#### 🔵 Line 697: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     694 |   // Reference Graph - Most Connected
     695 |   lines.push("## Reference Graph");
     696 |   lines.push("");
>>>  697 |   lines.push("### Most Referenced Documents (Inbound Links)");
     698 |   lines.push("");
     699 |   lines.push("Documents that are linked to most frequently:");
     700 |   lines.push("");
```

---

#### 🔵 Line 698: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     695 |   lines.push("## Reference Graph");
     696 |   lines.push("");
     697 |   lines.push("### Most Referenced Documents (Inbound Links)");
>>>  698 |   lines.push("");
     699 |   lines.push("Documents that are linked to most frequently:");
     700 |   lines.push("");
     701 |
```

---

#### 🔵 Line 699: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     696 |   lines.push("");
     697 |   lines.push("### Most Referenced Documents (Inbound Links)");
     698 |   lines.push("");
>>>  699 |   lines.push("Documents that are linked to most frequently:");
     700 |   lines.push("");
     701 |
     702 |   const byInbound = [...referenceGraph.entries()]
```

---

#### 🔵 Line 700: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     697 |   lines.push("### Most Referenced Documents (Inbound Links)");
     698 |   lines.push("");
     699 |   lines.push("Documents that are linked to most frequently:");
>>>  700 |   lines.push("");
     701 |
     702 |   const byInbound = [...referenceGraph.entries()]
     703 |     .map(([path, refs]) => ({ path, count: refs.inbound.length, refs: refs.inbound }))
```

---

#### 🔵 Line 709: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     706 |     .slice(0, 20);
     707 |
     708 |   lines.push("| Document | Inbound Links | Referenced By |");
>>>  709 |   lines.push("|----------|---------------|---------------|");
     710 |   for (const { path, count, refs } of byInbound) {
     711 |     const doc = docsByPath.get(path);
     712 |     const title = doc ? doc.title : basename(path, ".md");
```

---

#### 🔵 Line 723: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     720 |   }
     721 |   lines.push("");
     722 |
>>>  723 |   lines.push("### Most Linking Documents (Outbound Links)");
     724 |   lines.push("");
     725 |   lines.push("Documents that link to other documents most frequently:");
     726 |   lines.push("");
```

---

#### 🔵 Line 724: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     721 |   lines.push("");
     722 |
     723 |   lines.push("### Most Linking Documents (Outbound Links)");
>>>  724 |   lines.push("");
     725 |   lines.push("Documents that link to other documents most frequently:");
     726 |   lines.push("");
     727 |
```

---

#### 🔵 Line 725: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     722 |
     723 |   lines.push("### Most Linking Documents (Outbound Links)");
     724 |   lines.push("");
>>>  725 |   lines.push("Documents that link to other documents most frequently:");
     726 |   lines.push("");
     727 |
     728 |   const byOutbound = [...referenceGraph.entries()]
```

---

#### 🔵 Line 726: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     723 |   lines.push("### Most Linking Documents (Outbound Links)");
     724 |   lines.push("");
     725 |   lines.push("Documents that link to other documents most frequently:");
>>>  726 |   lines.push("");
     727 |
     728 |   const byOutbound = [...referenceGraph.entries()]
     729 |     .map(([path, refs]) => ({ path, count: refs.outbound.length }))
```

---

#### 🔵 Line 735: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     732 |     .slice(0, 20);
     733 |
     734 |   lines.push("| Document | Outbound Links |");
>>>  735 |   lines.push("|----------|----------------|");
     736 |   for (const { path, count } of byOutbound) {
     737 |     const doc = docsByPath.get(path);
     738 |     const title = doc ? doc.title : basename(path, ".md");
```

---

#### 🔵 Line 743: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     740 |     lines.push(`| [${escapeTableCell(title)}](${linkPath}) | ${count} |`);
     741 |   }
     742 |   lines.push("");
>>>  743 |   lines.push("---");
     744 |   lines.push("");
     745 |
     746 |   // Orphaned Documents
```

---

#### 🔵 Line 744: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     741 |   }
     742 |   lines.push("");
     743 |   lines.push("---");
>>>  744 |   lines.push("");
     745 |
     746 |   // Orphaned Documents
     747 |   lines.push("## Orphaned Documents");
```

---

#### 🔵 Line 747: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     744 |   lines.push("");
     745 |
     746 |   // Orphaned Documents
>>>  747 |   lines.push("## Orphaned Documents");
     748 |   lines.push("");
     749 |   lines.push("Documents with no inbound links (not referenced by any other document):");
     750 |   lines.push("");
```

---

#### 🔵 Line 748: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     745 |
     746 |   // Orphaned Documents
     747 |   lines.push("## Orphaned Documents");
>>>  748 |   lines.push("");
     749 |   lines.push("Documents with no inbound links (not referenced by any other document):");
     750 |   lines.push("");
     751 |
```

---

#### 🔵 Line 749: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     746 |   // Orphaned Documents
     747 |   lines.push("## Orphaned Documents");
     748 |   lines.push("");
>>>  749 |   lines.push("Documents with no inbound links (not referenced by any other document):");
     750 |   lines.push("");
     751 |
     752 |   const orphaned = [...referenceGraph.entries()]
```

---

#### 🔵 Line 750: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     747 |   lines.push("## Orphaned Documents");
     748 |   lines.push("");
     749 |   lines.push("Documents with no inbound links (not referenced by any other document):");
>>>  750 |   lines.push("");
     751 |
     752 |   const orphaned = [...referenceGraph.entries()]
     753 |     .filter(([, refs]) => refs.inbound.length === 0)
```

---

#### 🔵 Line 761: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     758 |     lines.push("*No orphaned documents found.*");
     759 |   } else {
     760 |     lines.push(`**${orphaned.length} orphaned documents:**`);
>>>  761 |     lines.push("");
     762 |     for (const path of orphaned) {
     763 |       const doc = docsByPath.get(path);
     764 |       const title = doc ? doc.title : basename(path, ".md");
```

---

#### 🔵 Line 770: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     767 |     }
     768 |   }
     769 |   lines.push("");
>>>  770 |   lines.push("---");
     771 |   lines.push("");
     772 |
     773 |   // Full Document List
```

---

#### 🔵 Line 771: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     768 |   }
     769 |   lines.push("");
     770 |   lines.push("---");
>>>  771 |   lines.push("");
     772 |
     773 |   // Full Document List
     774 |   lines.push("## Full Document List");
```

---

#### 🔵 Line 774: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     771 |   lines.push("");
     772 |
     773 |   // Full Document List
>>>  774 |   lines.push("## Full Document List");
     775 |   lines.push("");
     776 |   lines.push("<details>");
     777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
```

---

#### 🔵 Line 775: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     772 |
     773 |   // Full Document List
     774 |   lines.push("## Full Document List");
>>>  775 |   lines.push("");
     776 |   lines.push("<details>");
     777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
     778 |   lines.push("");
```

---

#### 🔵 Line 776: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     773 |   // Full Document List
     774 |   lines.push("## Full Document List");
     775 |   lines.push("");
>>>  776 |   lines.push("<details>");
     777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
     778 |   lines.push("");
     779 |   lines.push("| # | Path | Title | Tier | Status |");
```

---

#### 🔵 Line 777: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     774 |   lines.push("## Full Document List");
     775 |   lines.push("");
     776 |   lines.push("<details>");
>>>  777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
     778 |   lines.push("");
     779 |   lines.push("| # | Path | Title | Tier | Status |");
     780 |   lines.push("|---|------|-------|------|--------|");
```

---

#### 🔵 Line 778: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     775 |   lines.push("");
     776 |   lines.push("<details>");
     777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
>>>  778 |   lines.push("");
     779 |   lines.push("| # | Path | Title | Tier | Status |");
     780 |   lines.push("|---|------|-------|------|--------|");
     781 |
```

---

#### 🔵 Line 779: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     776 |   lines.push("<details>");
     777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
     778 |   lines.push("");
>>>  779 |   lines.push("| # | Path | Title | Tier | Status |");
     780 |   lines.push("|---|------|-------|------|--------|");
     781 |
     782 |   const sortedDocs = [...docs].sort((a, b) => a.path.localeCompare(b.path));
```

---

#### 🔵 Line 780: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     777 |   lines.push("<summary>Click to expand full list of all documents</summary>");
     778 |   lines.push("");
     779 |   lines.push("| # | Path | Title | Tier | Status |");
>>>  780 |   lines.push("|---|------|-------|------|--------|");
     781 |
     782 |   const sortedDocs = [...docs].sort((a, b) => a.path.localeCompare(b.path));
     783 |   let i = 1;
```

---

#### 🔵 Line 793: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     790 |   }
     791 |
     792 |   lines.push("");
>>>  793 |   lines.push("</details>");
     794 |   lines.push("");
     795 |   lines.push("---");
     796 |   lines.push("");
```

---

#### 🔵 Line 794: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     791 |
     792 |   lines.push("");
     793 |   lines.push("</details>");
>>>  794 |   lines.push("");
     795 |   lines.push("---");
     796 |   lines.push("");
     797 |
```

---

#### 🔵 Line 795: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     792 |   lines.push("");
     793 |   lines.push("</details>");
     794 |   lines.push("");
>>>  795 |   lines.push("---");
     796 |   lines.push("");
     797 |
     798 |   // Archived Documents (simple list, not fully tracked)
```

---

#### 🔵 Line 796: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     793 |   lines.push("</details>");
     794 |   lines.push("");
     795 |   lines.push("---");
>>>  796 |   lines.push("");
     797 |
     798 |   // Archived Documents (simple list, not fully tracked)
     799 |   lines.push("## Archived Documents");
```

---

#### 🔵 Line 799: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     796 |   lines.push("");
     797 |
     798 |   // Archived Documents (simple list, not fully tracked)
>>>  799 |   lines.push("## Archived Documents");
     800 |   lines.push("");
     801 |   lines.push(
     802 |     "*Historical and completed documentation. These documents are preserved for reference but not actively tracked in the reference graph.*"
```

---

#### 🔵 Line 800: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     797 |
     798 |   // Archived Documents (simple list, not fully tracked)
     799 |   lines.push("## Archived Documents");
>>>  800 |   lines.push("");
     801 |   lines.push(
     802 |     "*Historical and completed documentation. These documents are preserved for reference but not actively tracked in the reference graph.*"
     803 |   );
```

---

#### 🔵 Line 801: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     798 |   // Archived Documents (simple list, not fully tracked)
     799 |   lines.push("## Archived Documents");
     800 |   lines.push("");
>>>  801 |   lines.push(
     802 |     "*Historical and completed documentation. These documents are preserved for reference but not actively tracked in the reference graph.*"
     803 |   );
     804 |   lines.push("");
```

---

#### 🔵 Line 804: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     801 |   lines.push(
     802 |     "*Historical and completed documentation. These documents are preserved for reference but not actively tracked in the reference graph.*"
     803 |   );
>>>  804 |   lines.push("");
     805 |
     806 |   if (archivedFiles.length === 0) {
     807 |     lines.push("*No archived documents.*");
```

---

#### 🔵 Line 810: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     807 |     lines.push("*No archived documents.*");
     808 |   } else {
     809 |     lines.push("<details>");
>>>  810 |     lines.push("<summary>Click to expand archived documents list</summary>");
     811 |     lines.push("");
     812 |     lines.push("| # | Path |");
     813 |     lines.push("|---|------|");
```

---

#### 🔵 Line 811: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     808 |   } else {
     809 |     lines.push("<details>");
     810 |     lines.push("<summary>Click to expand archived documents list</summary>");
>>>  811 |     lines.push("");
     812 |     lines.push("| # | Path |");
     813 |     lines.push("|---|------|");
     814 |     const sortedArchived = [...archivedFiles].sort();
```

---

#### 🔵 Line 812: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     809 |     lines.push("<details>");
     810 |     lines.push("<summary>Click to expand archived documents list</summary>");
     811 |     lines.push("");
>>>  812 |     lines.push("| # | Path |");
     813 |     lines.push("|---|------|");
     814 |     const sortedArchived = [...archivedFiles].sort();
     815 |     let archiveNum = 1;
```

---

#### 🔵 Line 813: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     810 |     lines.push("<summary>Click to expand archived documents list</summary>");
     811 |     lines.push("");
     812 |     lines.push("| # | Path |");
>>>  813 |     lines.push("|---|------|");
     814 |     const sortedArchived = [...archivedFiles].sort();
     815 |     let archiveNum = 1;
     816 |     for (const filePath of sortedArchived) {
```

---

#### 🔵 Line 821: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     818 |       lines.push(`| ${archiveNum++} | [${escapeTableCell(filePath)}](${linkPath}) |`);
     819 |     }
     820 |     lines.push("");
>>>  821 |     lines.push("</details>");
     822 |   }
     823 |   lines.push("");
     824 |   lines.push("---");
```

---

#### 🔵 Line 824: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     821 |     lines.push("</details>");
     822 |   }
     823 |   lines.push("");
>>>  824 |   lines.push("---");
     825 |   lines.push("");
     826 |   lines.push("*Generated by `scripts/generate-documentation-index.js`*");
     827 |   lines.push("");
```

---

#### 🔵 Line 825: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     822 |   }
     823 |   lines.push("");
     824 |   lines.push("---");
>>>  825 |   lines.push("");
     826 |   lines.push("*Generated by `scripts/generate-documentation-index.js`*");
     827 |   lines.push("");
     828 |
```

---

#### 🔵 Line 826: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     823 |   lines.push("");
     824 |   lines.push("---");
     825 |   lines.push("");
>>>  826 |   lines.push("*Generated by `scripts/generate-documentation-index.js`*");
     827 |   lines.push("");
     828 |
     829 |   return lines.join("\n");
```

---

#### 🔵 Line 827: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     824 |   lines.push("---");
     825 |   lines.push("");
     826 |   lines.push("*Generated by `scripts/generate-documentation-index.js`*");
>>>  827 |   lines.push("");
     828 |
     829 |   return lines.join("\n");
     830 | }
```

---

### 📁 `scripts/suggest-pattern-automation.js` (52 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 19: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      16 |  * Exit codes: 0 = success (including when all patterns covered), 2 = error
      17 |  */
      18 |
>>>   19 | import { readFileSync, writeFileSync, existsSync } from "node:fs";
      20 | import { join, dirname, basename } from "node:path";
      21 | import { fileURLToPath } from "node:url";
      22 | import { sanitizeError } from "./lib/sanitize-error.js";
```

---

#### 🔵 Line 20: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      17 |  */
      18 |
      19 | import { readFileSync, writeFileSync, existsSync } from "node:fs";
>>>   20 | import { join, dirname, basename } from "node:path";
      21 | import { fileURLToPath } from "node:url";
      22 | import { sanitizeError } from "./lib/sanitize-error.js";
      23 |
```

---

#### 🔵 Line 21: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      18 |
      19 | import { readFileSync, writeFileSync, existsSync } from "node:fs";
      20 | import { join, dirname, basename } from "node:path";
>>>   21 | import { fileURLToPath } from "node:url";
      22 | import { sanitizeError } from "./lib/sanitize-error.js";
      23 |
      24 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🟡 Line 49: Replace this character class by the character itself.

- **Rule**: `javascript:S6397`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

````js
      46 |   },
      47 |   {
      48 |     // Code blocks after "Wrong:" headers
>>>   49 |     regex: /#+\s*(?:Wrong|Bad|INCORRECT)[^\n]*\n```[\w]*\n([\s\S]*?)```/gi,
      50 |     type: "wrong_block",
      51 |   },
      52 | ];
````

---

#### 🔵 Line 57: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      54 | // Known pattern categories that are automatable
      55 | const AUTOMATABLE_CATEGORIES = {
      56 |   shell: {
>>>   57 |     indicators: ["bash", "shell", "sh", "\\$\\?", "exit code", "for\\s+\\w+\\s+in", "while.*read"],
      58 |     fileTypes: [".sh", ".yml", ".yaml"],
      59 |   },
      60 |   javascript: {
```

---

#### 🔵 Line 57: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      54 | // Known pattern categories that are automatable
      55 | const AUTOMATABLE_CATEGORIES = {
      56 |   shell: {
>>>   57 |     indicators: ["bash", "shell", "sh", "\\$\\?", "exit code", "for\\s+\\w+\\s+in", "while.*read"],
      58 |     fileTypes: [".sh", ".yml", ".yaml"],
      59 |   },
      60 |   javascript: {
```

---

#### 🔵 Line 63: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      60 |   javascript: {
      61 |     indicators: [
      62 |       "catch",
>>>   63 |       "error\\.message",
      64 |       "instanceof",
      65 |       "console\\.error",
      66 |       "\\.then",
```

---

#### 🔵 Line 65: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      62 |       "catch",
      63 |       "error\\.message",
      64 |       "instanceof",
>>>   65 |       "console\\.error",
      66 |       "\\.then",
      67 |       "\\.catch",
      68 |     ],
```

---

#### 🔵 Line 66: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      63 |       "error\\.message",
      64 |       "instanceof",
      65 |       "console\\.error",
>>>   66 |       "\\.then",
      67 |       "\\.catch",
      68 |     ],
      69 |     fileTypes: [".js", ".ts", ".tsx", ".jsx"],
```

---

#### 🔵 Line 67: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      64 |       "instanceof",
      65 |       "console\\.error",
      66 |       "\\.then",
>>>   67 |       "\\.catch",
      68 |     ],
      69 |     fileTypes: [".js", ".ts", ".tsx", ".jsx"],
      70 |   },
```

---

#### 🔵 Line 72: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      69 |     fileTypes: [".js", ".ts", ".tsx", ".jsx"],
      70 |   },
      71 |   github_actions: {
>>>   72 |     indicators: ["steps\\.", "github\\.", "\\$\\{\\{", "if:", "workflow", "actions"],
      73 |     fileTypes: [".yml", ".yaml"],
      74 |   },
      75 |   security: {
```

---

#### 🔵 Line 72: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      69 |     fileTypes: [".js", ".ts", ".tsx", ".jsx"],
      70 |   },
      71 |   github_actions: {
>>>   72 |     indicators: ["steps\\.", "github\\.", "\\$\\{\\{", "if:", "workflow", "actions"],
      73 |     fileTypes: [".yml", ".yaml"],
      74 |   },
      75 |   security: {
```

---

#### 🔵 Line 72: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      69 |     fileTypes: [".js", ".ts", ".tsx", ".jsx"],
      70 |   },
      71 |   github_actions: {
>>>   72 |     indicators: ["steps\\.", "github\\.", "\\$\\{\\{", "if:", "workflow", "actions"],
      73 |     fileTypes: [".yml", ".yaml"],
      74 |   },
      75 |   security: {
```

---

#### 🔵 Line 88: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      85 | function sanitizeCodeForLogging(code, maxLen = 60) {
      86 |   // Redact potential secrets/credentials
      87 |   let sanitized = code
>>>   88 |     .replace(/['"`][A-Za-z0-9_/+=-]{20,}['"`]/g, '"[REDACTED]"')
      89 |     .replace(/(?:key|token|secret|password|api[_-]?key)\s*[:=]\s*\S+/gi, "[CREDENTIAL_REDACTED]")
      90 |     // Unix-like absolute paths (require at least two segments: /usr/local/...)
      91 |     // Use capture groups for deterministic replacement
```

---

#### 🔵 Line 89: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      86 |   // Redact potential secrets/credentials
      87 |   let sanitized = code
      88 |     .replace(/['"`][A-Za-z0-9_/+=-]{20,}['"`]/g, '"[REDACTED]"')
>>>   89 |     .replace(/(?:key|token|secret|password|api[_-]?key)\s*[:=]\s*\S+/gi, "[CREDENTIAL_REDACTED]")
      90 |     // Unix-like absolute paths (require at least two segments: /usr/local/...)
      91 |     // Use capture groups for deterministic replacement
      92 |     .replace(/(^|[\s"'`(])(\/(?:[^/\s]+\/){2,}[^/\s]+)/g, "$1/[PATH_REDACTED]")
```

---

#### 🔵 Line 92: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      89 |     .replace(/(?:key|token|secret|password|api[_-]?key)\s*[:=]\s*\S+/gi, "[CREDENTIAL_REDACTED]")
      90 |     // Unix-like absolute paths (require at least two segments: /usr/local/...)
      91 |     // Use capture groups for deterministic replacement
>>>   92 |     .replace(/(^|[\s"'`(])(\/(?:[^/\s]+\/){2,}[^/\s]+)/g, "$1/[PATH_REDACTED]")
      93 |     // Windows absolute paths like C:\Users\Name\...
      94 |     .replace(/(^|[\s"'`(])([A-Za-z]:\\(?:[^\\\s]+\\){2,}[^\\\s]+)/g, "$1[PATH_REDACTED]");
      95 |
```

---

#### 🔵 Line 94: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      91 |     // Use capture groups for deterministic replacement
      92 |     .replace(/(^|[\s"'`(])(\/(?:[^/\s]+\/){2,}[^/\s]+)/g, "$1/[PATH_REDACTED]")
      93 |     // Windows absolute paths like C:\Users\Name\...
>>>   94 |     .replace(/(^|[\s"'`(])([A-Za-z]:\\(?:[^\\\s]+\\){2,}[^\\\s]+)/g, "$1[PATH_REDACTED]");
      95 |
      96 |   // Truncate
      97 |   if (sanitized.length > maxLen) {
```

---

#### 🟠 Line 107: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```js
     104 | /**
     105 |  * Extract code patterns from learnings file
     106 |  */
>>>  107 | function extractPatternsFromLearnings() {
     108 |   // Check file exists
     109 |   if (!existsSync(LEARNINGS_FILE)) {
     110 |     console.error(`❌ Learnings file not found: ${LEARNINGS_FILENAME}`);
```

---

#### 🔵 Line 211: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     208 |   for (const { pattern, flags, id } of existingPatterns) {
     209 |     try {
     210 |       // Sanitize flags to only include valid RegExp flag characters
>>>  211 |       const safeFlags = (flags ?? "").replace(/[^dgimsuvy]/g, "");
     212 |       // Use original flags exactly - don't override as it can change pattern semantics
     213 |       // Note: We create a new RegExp each iteration so 'g' flag's lastIndex doesn't matter
     214 |       const regex = new RegExp(pattern, safeFlags);
```

---

#### 🔵 Line 259: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     256 |   // For common anti-patterns, suggest known good patterns
     257 |   // Keys are regex patterns (not literals) for matching
     258 |   const knownPatterns = {
>>>  259 |     "pipe.*while": "cmd \\| while.*done(?!.*< <)",
     260 |     "\\$\\?": "\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?",
     261 |     "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
     262 |     startsWith: "\\.startsWith\\s*\\(",
```

---

#### 🔵 Line 260: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     257 |   // Keys are regex patterns (not literals) for matching
     258 |   const knownPatterns = {
     259 |     "pipe.*while": "cmd \\| while.*done(?!.*< <)",
>>>  260 |     "\\$\\?": "\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?",
     261 |     "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
     262 |     startsWith: "\\.startsWith\\s*\\(",
     263 |     "\\.message": "\\.message(?![^}]*instanceof)",
```

---

#### 🔵 Line 261: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     258 |   const knownPatterns = {
     259 |     "pipe.*while": "cmd \\| while.*done(?!.*< <)",
     260 |     "\\$\\?": "\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?",
>>>  261 |     "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
     262 |     startsWith: "\\.startsWith\\s*\\(",
     263 |     "\\.message": "\\.message(?![^}]*instanceof)",
     264 |     "console\\.error": "\\.catch\\s*\\(\\s*console\\.error",
```

---

#### 🔵 Line 262: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     259 |     "pipe.*while": "cmd \\| while.*done(?!.*< <)",
     260 |     "\\$\\?": "\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?",
     261 |     "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
>>>  262 |     startsWith: "\\.startsWith\\s*\\(",
     263 |     "\\.message": "\\.message(?![^}]*instanceof)",
     264 |     "console\\.error": "\\.catch\\s*\\(\\s*console\\.error",
     265 |     "user\\.type": "\\.user\\.type\\s*===",
```

---

#### 🔵 Line 263: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     260 |     "\\$\\?": "\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?",
     261 |     "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
     262 |     startsWith: "\\.startsWith\\s*\\(",
>>>  263 |     "\\.message": "\\.message(?![^}]*instanceof)",
     264 |     "console\\.error": "\\.catch\\s*\\(\\s*console\\.error",
     265 |     "user\\.type": "\\.user\\.type\\s*===",
     266 |   };
```

---

#### 🔵 Line 264: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     261 |     "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
     262 |     startsWith: "\\.startsWith\\s*\\(",
     263 |     "\\.message": "\\.message(?![^}]*instanceof)",
>>>  264 |     "console\\.error": "\\.catch\\s*\\(\\s*console\\.error",
     265 |     "user\\.type": "\\.user\\.type\\s*===",
     266 |   };
     267 |
```

---

#### 🔵 Line 265: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     262 |     startsWith: "\\.startsWith\\s*\\(",
     263 |     "\\.message": "\\.message(?![^}]*instanceof)",
     264 |     "console\\.error": "\\.catch\\s*\\(\\s*console\\.error",
>>>  265 |     "user\\.type": "\\.user\\.type\\s*===",
     266 |   };
     267 |
     268 |   for (const [key, pattern] of Object.entries(knownPatterns)) {
```

---

#### 🔵 Line 285: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     282 |
     283 |   // Fallback: escaped literal prefix (human should refine)
     284 |   // Use \\.{3} instead of ... to prevent regex wildcard interpretation
>>>  285 |   return code.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.{3}";
     286 | }
     287 |
     288 | /**
```

---

#### 🔵 Line 285: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     282 |
     283 |   // Fallback: escaped literal prefix (human should refine)
     284 |   // Use \\.{3} instead of ... to prevent regex wildcard interpretation
>>>  285 |   return code.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.{3}";
     286 | }
     287 |
     288 | /**
```

---

#### 🔵 Line 285: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     282 |
     283 |   // Fallback: escaped literal prefix (human should refine)
     284 |   // Use \\.{3} instead of ... to prevent regex wildcard interpretation
>>>  285 |   return code.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.{3}";
     286 | }
     287 |
     288 | /**
```

---

#### 🔵 Line 296: Prefer `String#codePointAt()` over `String#charCodeAt()`.

- **Rule**: `javascript:S7758`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     293 |   const stableIdBase = `${category}|${code}`;
     294 |   let hash = 0;
     295 |   for (let i = 0; i < stableIdBase.length; i++) {
>>>  296 |     hash = (hash * 31 + stableIdBase.charCodeAt(i)) >>> 0;
     297 |   }
     298 |   const id = `auto-suggested-${hash.toString(16)}`;
     299 |
```

---

#### 🟡 Line 376: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     373 |     const sanitizedPattern = sanitizeCodeForLogging(suggested.pattern, 50);
     374 |
     375 |     console.log(
>>>  376 |       `${i + 1}. Category: ${category}${reviewNumber ? ` (Review #${reviewNumber})` : ""}`
     377 |     );
     378 |     console.log(`   Code: ${sanitizedCode}`);
     379 |     console.log(`   Suggested regex: /${sanitizedPattern}/`);
```

---

### 📁 `hooks/use-journal.ts` (49 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.content || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.action || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.step4_gratitude || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.step4_surrender || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'v || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.title || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.content || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.note || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.resentments || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.dishonesty || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.apologies || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'data.successes || ''' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟠 Line N/A: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

---

#### 🟠 Line N/A: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

---

#### 🔵 Line 73: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      70 |   return (
      71 |     text
      72 |       // Remove script/style blocks first (so their contents are removed too)
>>>   73 |       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      74 |       .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      75 |       // Remove remaining HTML tags
      76 |       .replace(/<[^>]*>/g, "")
```

---

#### 🔵 Line 74: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      71 |     text
      72 |       // Remove script/style blocks first (so their contents are removed too)
      73 |       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
>>>   74 |       .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      75 |       // Remove remaining HTML tags
      76 |       .replace(/<[^>]*>/g, "")
      77 |       // Remove potentially dangerous patterns (event handlers, javascript:, data:)
```

---

#### 🔵 Line 76: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      73 |       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      74 |       .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      75 |       // Remove remaining HTML tags
>>>   76 |       .replace(/<[^>]*>/g, "")
      77 |       // Remove potentially dangerous patterns (event handlers, javascript:, data:)
      78 |       .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      79 |       .replace(/javascript:/gi, "")
```

---

#### 🔵 Line 78: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      75 |       // Remove remaining HTML tags
      76 |       .replace(/<[^>]*>/g, "")
      77 |       // Remove potentially dangerous patterns (event handlers, javascript:, data:)
>>>   78 |       .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      79 |       .replace(/javascript:/gi, "")
      80 |       .replace(/data:text\/html/gi, "")
      81 |       // Normalize whitespace
```

---

#### 🔵 Line 79: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      76 |       .replace(/<[^>]*>/g, "")
      77 |       // Remove potentially dangerous patterns (event handlers, javascript:, data:)
      78 |       .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
>>>   79 |       .replace(/javascript:/gi, "")
      80 |       .replace(/data:text\/html/gi, "")
      81 |       // Normalize whitespace
      82 |       .replace(/\s+/g, " ")
```

---

#### 🔵 Line 80: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      77 |       // Remove potentially dangerous patterns (event handlers, javascript:, data:)
      78 |       .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      79 |       .replace(/javascript:/gi, "")
>>>   80 |       .replace(/data:text\/html/gi, "")
      81 |       // Normalize whitespace
      82 |       .replace(/\s+/g, " ")
      83 |       .trim()
```

---

#### 🔵 Line 82: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      79 |       .replace(/javascript:/gi, "")
      80 |       .replace(/data:text\/html/gi, "")
      81 |       // Normalize whitespace
>>>   82 |       .replace(/\s+/g, " ")
      83 |       .trim()
      84 |   );
      85 | }
```

---

#### 🔵 Line 102: 'data.content || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      99 |
     100 |   switch (type) {
     101 |     case "daily-log":
>>>  102 |       parts.push(sanitizeForSearch(String(data.content || "")));
     103 |       break;
     104 |     case "gratitude":
     105 |       items.forEach((item) => parts.push(sanitizeForSearch(String(item))));
```

---

#### 🔵 Line 108: 'data.action || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     105 |       items.forEach((item) => parts.push(sanitizeForSearch(String(item))));
     106 |       break;
     107 |     case "spot-check":
>>>  108 |       parts.push(sanitizeForSearch(String(data.action || "")));
     109 |       feelings.forEach((f) => parts.push(sanitizeForSearch(String(f))));
     110 |       absolutes.forEach((a) => parts.push(sanitizeForSearch(String(a))));
     111 |       break;
```

---

#### 🔵 Line 113: 'data.step4_gratitude || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     110 |       absolutes.forEach((a) => parts.push(sanitizeForSearch(String(a))));
     111 |       break;
     112 |     case "night-review":
>>>  113 |       parts.push(sanitizeForSearch(String(data.step4_gratitude || "")));
     114 |       parts.push(sanitizeForSearch(String(data.step4_surrender || "")));
     115 |       if (data.step3_reflections && typeof data.step3_reflections === "object") {
     116 |         Object.values(data.step3_reflections as Record<string, unknown>).forEach((v: unknown) =>
```

---

#### 🔵 Line 114: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     111 |       break;
     112 |     case "night-review":
     113 |       parts.push(sanitizeForSearch(String(data.step4_gratitude || "")));
>>>  114 |       parts.push(sanitizeForSearch(String(data.step4_surrender || "")));
     115 |       if (data.step3_reflections && typeof data.step3_reflections === "object") {
     116 |         Object.values(data.step3_reflections as Record<string, unknown>).forEach((v: unknown) =>
     117 |           parts.push(sanitizeForSearch(String(v || "")))
```

---

#### 🔵 Line 114: 'data.step4_surrender || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     111 |       break;
     112 |     case "night-review":
     113 |       parts.push(sanitizeForSearch(String(data.step4_gratitude || "")));
>>>  114 |       parts.push(sanitizeForSearch(String(data.step4_surrender || "")));
     115 |       if (data.step3_reflections && typeof data.step3_reflections === "object") {
     116 |         Object.values(data.step3_reflections as Record<string, unknown>).forEach((v: unknown) =>
     117 |           parts.push(sanitizeForSearch(String(v || "")))
```

---

#### 🔵 Line 117: 'v || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     114 |       parts.push(sanitizeForSearch(String(data.step4_surrender || "")));
     115 |       if (data.step3_reflections && typeof data.step3_reflections === "object") {
     116 |         Object.values(data.step3_reflections as Record<string, unknown>).forEach((v: unknown) =>
>>>  117 |           parts.push(sanitizeForSearch(String(v || "")))
     118 |         );
     119 |       }
     120 |       break;
```

---

#### 🔵 Line 123: 'data.title || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     120 |       break;
     121 |     case "free-write":
     122 |     case "meeting-note":
>>>  123 |       parts.push(sanitizeForSearch(String(data.title || "")));
     124 |       parts.push(sanitizeForSearch(String(data.content || "")));
     125 |       break;
     126 |     case "mood":
```

---

#### 🔵 Line 124: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     121 |     case "free-write":
     122 |     case "meeting-note":
     123 |       parts.push(sanitizeForSearch(String(data.title || "")));
>>>  124 |       parts.push(sanitizeForSearch(String(data.content || "")));
     125 |       break;
     126 |     case "mood":
     127 |       parts.push(sanitizeForSearch(String(data.note || "")));
```

---

#### 🔵 Line 124: 'data.content || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     121 |     case "free-write":
     122 |     case "meeting-note":
     123 |       parts.push(sanitizeForSearch(String(data.title || "")));
>>>  124 |       parts.push(sanitizeForSearch(String(data.content || "")));
     125 |       break;
     126 |     case "mood":
     127 |       parts.push(sanitizeForSearch(String(data.note || "")));
```

---

#### 🔵 Line 127: 'data.note || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     124 |       parts.push(sanitizeForSearch(String(data.content || "")));
     125 |       break;
     126 |     case "mood":
>>>  127 |       parts.push(sanitizeForSearch(String(data.note || "")));
     128 |       break;
     129 |     case "inventory":
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
```

---

#### 🔵 Line 130: 'data.resentments || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     127 |       parts.push(sanitizeForSearch(String(data.note || "")));
     128 |       break;
     129 |     case "inventory":
>>>  130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
     131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
     132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
     133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
```

---

#### 🔵 Line 131: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     128 |       break;
     129 |     case "inventory":
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
>>>  131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
     132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
     133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
     134 |       break;
```

---

#### 🔵 Line 131: 'data.dishonesty || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     128 |       break;
     129 |     case "inventory":
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
>>>  131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
     132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
     133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
     134 |       break;
```

---

#### 🔵 Line 132: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     129 |     case "inventory":
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
     131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
>>>  132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
     133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
     134 |       break;
     135 |   }
```

---

#### 🔵 Line 132: 'data.apologies || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     129 |     case "inventory":
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
     131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
>>>  132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
     133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
     134 |       break;
     135 |   }
```

---

#### 🔵 Line 133: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
     131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
     132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
>>>  133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
     134 |       break;
     135 |   }
     136 |
```

---

#### 🔵 Line 133: 'data.successes || ""' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     130 |       parts.push(sanitizeForSearch(String(data.resentments || "")));
     131 |       parts.push(sanitizeForSearch(String(data.dishonesty || "")));
     132 |       parts.push(sanitizeForSearch(String(data.apologies || "")));
>>>  133 |       parts.push(sanitizeForSearch(String(data.successes || "")));
     134 |       break;
     135 |   }
     136 |
```

---

#### 🔵 Line 145: 'data.mood' will use Object's default stringification format ('[object Object]') when stringified.

- **Rule**: `typescript:S6551`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     142 |   const tags: string[] = [type];
     143 |
     144 |   // Mood-based tags
>>>  145 |   if (data.mood) tags.push(`mood-${data.mood}`);
     146 |
     147 |   // Status tags
     148 |   if (data.cravings) tags.push("cravings");
```

---

### 📁 `scripts/phase-complete-check.js` (48 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 18: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      15 |  *   1 = Checks failed, do NOT mark complete
      16 |  */
      17 |
>>>   18 | import { execSync } from "node:child_process";
      19 | import * as readline from "node:readline";
      20 | import * as fs from "node:fs";
      21 | import * as path from "node:path";
```

---

#### 🔵 Line 19: Prefer `node:readline` over `readline`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      16 |  */
      17 |
      18 | import { execSync } from "node:child_process";
>>>   19 | import * as readline from "node:readline";
      20 | import * as fs from "node:fs";
      21 | import * as path from "node:path";
      22 | import { pathToFileURL } from "node:url";
```

---

#### 🔵 Line 20: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      17 |
      18 | import { execSync } from "node:child_process";
      19 | import * as readline from "node:readline";
>>>   20 | import * as fs from "node:fs";
      21 | import * as path from "node:path";
      22 | import { pathToFileURL } from "node:url";
      23 |
```

---

#### 🔵 Line 21: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      18 | import { execSync } from "node:child_process";
      19 | import * as readline from "node:readline";
      20 | import * as fs from "node:fs";
>>>   21 | import * as path from "node:path";
      22 | import { pathToFileURL } from "node:url";
      23 |
      24 | // Parse command line arguments
```

---

#### 🔵 Line 22: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      19 | import * as readline from "node:readline";
      20 | import * as fs from "node:fs";
      21 | import * as path from "node:path";
>>>   22 | import { pathToFileURL } from "node:url";
      23 |
      24 | // Parse command line arguments
      25 | const args = process.argv.slice(2);
```

---

#### 🔵 Line 104: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     101 |
     102 |   for (const match of matches) {
     103 |     // Normalize path: trim whitespace, convert backslashes to forward slashes
>>>  104 |     const filePath = match.trim().replace(/\\/g, "/");
     105 |     // Skip obvious non-deliverables
     106 |     if (
     107 |       !filePath.includes("node_modules") &&
```

---

#### 🟠 Line 133: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```js
     130 |  * Verify deliverable exists and has content
     131 |  * Security: Prevents path traversal by ensuring resolved path stays within projectRoot
     132 |  */
>>>  133 | function verifyDeliverable(deliverable, projectRoot) {
     134 |   // Security: Reject absolute paths
     135 |   if (path.isAbsolute(deliverable.path)) {
     136 |     return { exists: false, valid: false, reason: "Invalid path (absolute paths not allowed)" };
```

---

#### 🔵 Line 157: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     154 |     if (err.code === "ENOENT") {
     155 |       // File doesn't exist - check if it's in docs/archive (might be archived)
     156 |       // Skip archive lookup if path already points to docs/archive (avoid double-nesting)
>>>  157 |       const normalizedPath = deliverable.path.replace(/\\/g, "/");
     158 |       if (
     159 |         normalizedPath.startsWith("docs/archive/") ||
     160 |         normalizedPath.startsWith("./docs/archive/")
```

---

#### 🔵 Line 217: Handle this exception or don't catch it at all.

- **Rule**: `javascript:S2486`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1h

```js
     214 |       }
     215 |       return { exists: true, valid: true, reason: "Directory exists" };
     216 |     }
>>>  217 |   } catch (err) {
     218 |     // Error reading file content or directory
     219 |     return { exists: true, valid: false, reason: "File exists but could not be read" };
     220 |   }
```

---

#### 🟠 Line 232: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     229 |  * @param {boolean} isAutoMode - Whether running in CI/auto mode
     230 |  * @param {boolean} planWasProvided - Whether --plan was explicitly specified
     231 |  */
>>>  232 | function runAutomatedDeliverableAudit(planPath, projectRoot, isAutoMode, planWasProvided) {
     233 |   console.log("");
     234 |   console.log("━━━ AUTOMATED DELIVERABLE AUDIT ━━━");
     235 |   console.log("");
```

---

#### 🔵 Line 257: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     254 |   // Use regex for traversal detection (Review #53)
     255 |   const displayPlanPath = (() => {
     256 |     try {
>>>  257 |       const rel = path.relative(projectRoot, planPath).replace(/\\/g, "/");
     258 |       return rel && !/^\.\.(?:[/\\]|$)/.test(rel) ? rel : path.basename(planPath);
     259 |     } catch {
     260 |       return path.basename(planPath);
```

---

#### 🔵 Line 300: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     297 |     .map((d) => ({
     298 |       ...d,
     299 |       path: d.path
>>>  300 |         .replace(/\\/g, "/") // Normalize backslashes
     301 |         .trim() // Remove whitespace
     302 |         .replace(/^\.\/+/, "") // Remove leading ./
     303 |         .replace(/^`(.+)`$/, "$1") // Remove backticks
```

---

#### 🔵 Line 306: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     303 |         .replace(/^`(.+)`$/, "$1") // Remove backticks
     304 |         .replace(/^"(.+)"$/, "$1") // Remove double quotes
     305 |         .replace(/^'(.+)'$/, "$1") // Remove single quotes
>>>  306 |         .replace(/[)`"'.,;:]+$/g, ""), // Remove trailing punctuation
     307 |     }))
     308 |     .filter((d) => d.path.length > 0)
     309 |     .filter((d) => !d.path.replace(/\\/g, "/").split("/").includes("..")); // Reject path traversal (cross-platform)
```

---

#### 🔵 Line 309: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     306 |         .replace(/[)`"'.,;:]+$/g, ""), // Remove trailing punctuation
     307 |     }))
     308 |     .filter((d) => d.path.length > 0)
>>>  309 |     .filter((d) => !d.path.replace(/\\/g, "/").split("/").includes("..")); // Reject path traversal (cross-platform)
     310 |
     311 |   const MAX_CHECKS = 20;
     312 |   const wasTruncated = normalizedDeliverables.length > MAX_CHECKS;
```

---

#### 🔵 Line 330: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     327 |
     328 |     if (result.exists && result.valid) {
     329 |       results.verified++;
>>>  330 |     } else if (!result.exists) {
     331 |       results.missing.push(deliverable.path);
     332 |       if (deliverable.required) {
     333 |         results.passed = false;
```

---

#### 🟠 Line 363: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     360 |   return results;
     361 | }
     362 |
>>>  363 | async function main() {
     364 |   console.log("");
     365 |   console.log("═══════════════════════════════════════════════════════════");
     366 |   console.log("  🔍 PHASE COMPLETION CHECKLIST - AUTOMATED GATE");
```

---

#### 🔵 Line 385: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     382 |     return (
     383 |       String(output)
     384 |         // Normalize Windows CRLF to LF everywhere
>>>  385 |         .replace(/\r\n/g, "\n")
     386 |         .replace(/\r/g, "")
     387 |         // Strip ANSI escape sequences (colors/cursor movement) to prevent terminal injection in CI logs
     388 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping ANSI escape sequences for CI safety
```

---

#### 🔵 Line 386: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     383 |       String(output)
     384 |         // Normalize Windows CRLF to LF everywhere
     385 |         .replace(/\r\n/g, "\n")
>>>  386 |         .replace(/\r/g, "")
     387 |         // Strip ANSI escape sequences (colors/cursor movement) to prevent terminal injection in CI logs
     388 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping ANSI escape sequences for CI safety
     389 |         .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "") // eslint-disable-line no-control-regex
```

---

#### 🔵 Line 389: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     386 |         .replace(/\r/g, "")
     387 |         // Strip ANSI escape sequences (colors/cursor movement) to prevent terminal injection in CI logs
     388 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping ANSI escape sequences for CI safety
>>>  389 |         .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "") // eslint-disable-line no-control-regex
     390 |         // Strip OSC escape sequences (Operating System Commands like title changes)
     391 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping OSC escape sequences for CI safety
     392 |         .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, "") // eslint-disable-line no-control-regex
```

---

#### 🔵 Line 392: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     389 |         .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "") // eslint-disable-line no-control-regex
     390 |         // Strip OSC escape sequences (Operating System Commands like title changes)
     391 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping OSC escape sequences for CI safety
>>>  392 |         .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, "") // eslint-disable-line no-control-regex
     393 |         // Strip control chars while preserving safe whitespace (\t\n)
     394 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     395 |         .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
```

---

#### 🔵 Line 395: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     392 |         .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, "") // eslint-disable-line no-control-regex
     393 |         // Strip control chars while preserving safe whitespace (\t\n)
     394 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
>>>  395 |         .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
     396 |         .replace(/\/home\/[^/\s]+/g, "[HOME]")
     397 |         .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     398 |         // Handle any Windows drive letter, case-insensitive
```

---

#### 🔵 Line 396: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     393 |         // Strip control chars while preserving safe whitespace (\t\n)
     394 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     395 |         .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
>>>  396 |         .replace(/\/home\/[^/\s]+/g, "[HOME]")
     397 |         .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     398 |         // Handle any Windows drive letter, case-insensitive
     399 |         .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
```

---

#### 🔵 Line 397: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     394 |         // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     395 |         .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
     396 |         .replace(/\/home\/[^/\s]+/g, "[HOME]")
>>>  397 |         .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     398 |         // Handle any Windows drive letter, case-insensitive
     399 |         .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
     400 |     );
```

---

#### 🔵 Line 399: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     396 |         .replace(/\/home\/[^/\s]+/g, "[HOME]")
     397 |         .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     398 |         // Handle any Windows drive letter, case-insensitive
>>>  399 |         .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
     400 |     );
     401 |   };
     402 |
```

---

#### 🔵 Line 527: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     524 |
     525 |     for (const { q, fail } of questions) {
     526 |       const passed = await ask(q);
>>>  527 |       if (!passed) {
     528 |         console.log(`  ❌ ${fail}`);
     529 |         failures.push(fail);
     530 |         allPassed = false;
```

---

#### 🟡 Line 575: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     572 | }
     573 |
     574 | if (isMainModule) {
>>>  575 |   main().catch((err) => {
     576 |     // Sanitize error output - avoid exposing file paths, stack traces, and control characters
     577 |     // Use .split('\n')[0] to ensure only first line (no stack trace in String(err))
     578 |     // Strip control chars (ANSI escapes) to prevent log/terminal injection in CI
```

---

#### 🔵 Line 583: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     580 |       .split("\n")[0]
     581 |       .replace(/\r$/, "") // Strip trailing CR from Windows CRLF line endings
     582 |       // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
>>>  583 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
     584 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
     585 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     586 |       // Handle any Windows drive letter, case-insensitive
```

---

#### 🔵 Line 584: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     581 |       .replace(/\r$/, "") // Strip trailing CR from Windows CRLF line endings
     582 |       // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     583 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
>>>  584 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
     585 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     586 |       // Handle any Windows drive letter, case-insensitive
     587 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
```

---

#### 🔵 Line 585: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     582 |       // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     583 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
     584 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
>>>  585 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     586 |       // Handle any Windows drive letter, case-insensitive
     587 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
     588 |     console.error("Script error:", safeMessage);
```

---

#### 🔵 Line 587: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     584 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
     585 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     586 |       // Handle any Windows drive letter, case-insensitive
>>>  587 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
     588 |     console.error("Script error:", safeMessage);
     589 |     closeRl();
     590 |     process.exit(1);
```

---

### 📁 `lib/db/meetings.ts` (42 issues)

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟠 Line 21: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```ts
      18 |  * Parse time string to minutes since midnight for robust sorting
      19 |  * Handles both 24-hour format ("07:00", "19:30") and 12-hour format ("7:00 AM", "7:30 PM")
      20 |  */
>>>   21 | function timeToMinutes(timeStr: string): number {
      22 |   try {
      23 |     // Validate input type
      24 |     if (!timeStr || typeof timeStr !== "string") return 0;
```

---

#### 🔵 Line 34: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      31 |
      32 |     if (is12Hour) {
      33 |       // Parse 12-hour format
>>>   34 |       const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      35 |       if (!match) return 0;
      36 |
      37 |       let hours = parseInt(match[1], 10);
```

---

#### 🔵 Line 37: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      34 |       const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      35 |       if (!match) return 0;
      36 |
>>>   37 |       let hours = parseInt(match[1], 10);
      38 |       const minutes = parseInt(match[2], 10);
      39 |       const period = match[3].toUpperCase();
      40 |
```

---

#### 🔵 Line 38: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      35 |       if (!match) return 0;
      36 |
      37 |       let hours = parseInt(match[1], 10);
>>>   38 |       const minutes = parseInt(match[2], 10);
      39 |       const period = match[3].toUpperCase();
      40 |
      41 |       // SECURITY: Validate hours (1-12 for 12-hour format) and minutes (0-59)
```

---

#### 🔵 Line 54: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      51 |       const parts = cleaned.split(":");
      52 |       if (parts.length !== 2) return 0;
      53 |
>>>   54 |       const hours = parseInt(parts[0], 10);
      55 |       const minutes = parseInt(parts[1], 10);
      56 |
      57 |       // SECURITY: Validate hours (0-23) and minutes (0-59)
```

---

#### 🔵 Line 55: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      52 |       if (parts.length !== 2) return 0;
      53 |
      54 |       const hours = parseInt(parts[0], 10);
>>>   55 |       const minutes = parseInt(parts[1], 10);
      56 |
      57 |       // SECURITY: Validate hours (0-23) and minutes (0-59)
      58 |       if (isNaN(hours) || isNaN(minutes)) return 0;
```

---

#### 🔵 Line 58: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      55 |       const minutes = parseInt(parts[1], 10);
      56 |
      57 |       // SECURITY: Validate hours (0-23) and minutes (0-59)
>>>   58 |       if (isNaN(hours) || isNaN(minutes)) return 0;
      59 |       if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 0;
      60 |
      61 |       return hours * 60 + minutes;
```

---

#### 🔵 Line 58: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      55 |       const minutes = parseInt(parts[1], 10);
      56 |
      57 |       // SECURITY: Validate hours (0-23) and minutes (0-59)
>>>   58 |       if (isNaN(hours) || isNaN(minutes)) return 0;
      59 |       if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 0;
      60 |
      61 |       return hours * 60 + minutes;
```

---

### 📁 `lib/utils/error-export.ts` (39 issues)

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: 'PerformanceTiming' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: 'navigationStart' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: 'loadEventEnd' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: 'domContentLoadedEventEnd' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🟡 Line N/A: Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

- **Rule**: `typescript:S7762`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🔵 Line N/A: The signature '(commandId: string, showUI?: boolean | undefined, value?: string | undefined): boolean' of 'document.execCommand' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🟡 Line N/A: Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

- **Rule**: `typescript:S7762`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line N/A: Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

- **Rule**: `typescript:S7762`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🔵 Line 118: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     115 |  * Get environment information for error context
     116 |  */
     117 | function getEnvironmentInfo(): EnvironmentInfo {
>>>  118 |   const rawUrl = typeof window !== "undefined" ? window.location.href : "unknown";
     119 |   return {
     120 |     nodeEnv: process.env.NODE_ENV,
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
```

---

#### 🔵 Line 118: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     115 |  * Get environment information for error context
     116 |  */
     117 | function getEnvironmentInfo(): EnvironmentInfo {
>>>  118 |   const rawUrl = typeof window !== "undefined" ? window.location.href : "unknown";
     119 |   return {
     120 |     nodeEnv: process.env.NODE_ENV,
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
```

---

#### 🔵 Line 118: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     115 |  * Get environment information for error context
     116 |  */
     117 | function getEnvironmentInfo(): EnvironmentInfo {
>>>  118 |   const rawUrl = typeof window !== "undefined" ? window.location.href : "unknown";
     119 |   return {
     120 |     nodeEnv: process.env.NODE_ENV,
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
```

---

#### 🔵 Line 122: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     119 |   return {
     120 |     nodeEnv: process.env.NODE_ENV,
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
>>>  122 |     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
     123 |     url: rawUrl !== "unknown" ? redactSensitiveUrl(rawUrl) : "unknown",
     124 |     pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
     125 |     timestamp: new Date().toISOString(),
```

---

#### 🔵 Line 123: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     120 |     nodeEnv: process.env.NODE_ENV,
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
     122 |     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
>>>  123 |     url: rawUrl !== "unknown" ? redactSensitiveUrl(rawUrl) : "unknown",
     124 |     pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
     125 |     timestamp: new Date().toISOString(),
     126 |   };
```

---

#### 🔵 Line 124: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
     122 |     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
     123 |     url: rawUrl !== "unknown" ? redactSensitiveUrl(rawUrl) : "unknown",
>>>  124 |     pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
     125 |     timestamp: new Date().toISOString(),
     126 |   };
     127 | }
```

---

#### 🔵 Line 124: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
     122 |     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
     123 |     url: rawUrl !== "unknown" ? redactSensitiveUrl(rawUrl) : "unknown",
>>>  124 |     pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
     125 |     timestamp: new Date().toISOString(),
     126 |   };
     127 | }
```

---

#### 🔵 Line 124: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     121 |     appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
     122 |     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
     123 |     url: rawUrl !== "unknown" ? redactSensitiveUrl(rawUrl) : "unknown",
>>>  124 |     pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
     125 |     timestamp: new Date().toISOString(),
     126 |   };
     127 | }
```

---

#### 🔵 Line 135: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     132 | function getBrowserInfo(): BrowserInfo {
     133 |   const info: BrowserInfo = {
     134 |     viewport: {
>>>  135 |       width: typeof window !== "undefined" ? window.innerWidth : 0,
     136 |       height: typeof window !== "undefined" ? window.innerHeight : 0,
     137 |     },
     138 |   };
```

---

#### 🔵 Line 135: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     132 | function getBrowserInfo(): BrowserInfo {
     133 |   const info: BrowserInfo = {
     134 |     viewport: {
>>>  135 |       width: typeof window !== "undefined" ? window.innerWidth : 0,
     136 |       height: typeof window !== "undefined" ? window.innerHeight : 0,
     137 |     },
     138 |   };
```

---

#### 🔵 Line 136: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     133 |   const info: BrowserInfo = {
     134 |     viewport: {
     135 |       width: typeof window !== "undefined" ? window.innerWidth : 0,
>>>  136 |       height: typeof window !== "undefined" ? window.innerHeight : 0,
     137 |     },
     138 |   };
     139 |
```

---

#### 🔵 Line 136: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     133 |   const info: BrowserInfo = {
     134 |     viewport: {
     135 |       width: typeof window !== "undefined" ? window.innerWidth : 0,
>>>  136 |       height: typeof window !== "undefined" ? window.innerHeight : 0,
     137 |     },
     138 |   };
     139 |
```

---

#### 🔵 Line 154: 'PerformanceTiming' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```ts
     151 |
     152 |   // Navigation timing
     153 |   if (typeof performance !== "undefined" && "timing" in performance) {
>>>  154 |     const timing = (performance as unknown as { timing?: PerformanceTiming }).timing;
     155 |     if (timing) {
     156 |       info.performance = {
     157 |         navigationStart: timing.navigationStart,
```

---

#### 🔵 Line 157: 'navigationStart' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```ts
     154 |     const timing = (performance as unknown as { timing?: PerformanceTiming }).timing;
     155 |     if (timing) {
     156 |       info.performance = {
>>>  157 |         navigationStart: timing.navigationStart,
     158 |         loadEventEnd: timing.loadEventEnd,
     159 |         domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
     160 |       };
```

---

#### 🔵 Line 158: 'loadEventEnd' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```ts
     155 |     if (timing) {
     156 |       info.performance = {
     157 |         navigationStart: timing.navigationStart,
>>>  158 |         loadEventEnd: timing.loadEventEnd,
     159 |         domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
     160 |       };
     161 |     }
```

---

#### 🔵 Line 159: 'domContentLoadedEventEnd' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```ts
     156 |       info.performance = {
     157 |         navigationStart: timing.navigationStart,
     158 |         loadEventEnd: timing.loadEventEnd,
>>>  159 |         domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
     160 |       };
     161 |     }
     162 |   }
```

---

#### 🟡 Line 293: Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

- **Rule**: `typescript:S7762`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
     290 |   link.download = filename || defaultFilename;
     291 |   document.body.appendChild(link);
     292 |   link.click();
>>>  293 |   document.body.removeChild(link);
     294 |   URL.revokeObjectURL(url);
     295 | }
     296 |
```

---

#### 🔵 Line 318: The signature '(commandId: string, showUI?: boolean | undefined, value?: string | undefined): boolean' of 'document.execCommand' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```ts
     315 |     textarea.select();
     316 |
     317 |     try {
>>>  318 |       document.execCommand("copy");
     319 |       document.body.removeChild(textarea);
     320 |       return true;
     321 |     } catch {
```

---

#### 🟡 Line 319: Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

- **Rule**: `typescript:S7762`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
     316 |
     317 |     try {
     318 |       document.execCommand("copy");
>>>  319 |       document.body.removeChild(textarea);
     320 |       return true;
     321 |     } catch {
     322 |       document.body.removeChild(textarea);
```

---

#### 🟡 Line 322: Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.

- **Rule**: `typescript:S7762`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
     319 |       document.body.removeChild(textarea);
     320 |       return true;
     321 |     } catch {
>>>  322 |       document.body.removeChild(textarea);
     323 |       return false;
     324 |     }
     325 |   }
```

---

### 📁 `scripts/check-pattern-compliance.js` (39 issues)

#### 🟡 Line N/A: Simplify this regular expression to reduce its complexity from 21 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Simplify this regular expression to reduce its complexity from 21 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Simplify this regular expression to reduce its complexity from 28 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 24min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Simplify this regular expression to reduce its complexity from 23 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 14min

---

#### 🟡 Line N/A: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Simplify this regular expression to reduce its complexity from 34 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 36min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: This branch's code block is the same as the block for the branch on line 413.

- **Rule**: `javascript:S1871`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🔵 Line N/A: `extensions` should be a `Set`, and use `extensions.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `ignoreDirs` should be a `Set`, and use `ignoreDirs.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 22: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      19 |  * Exit codes: 0 = no violations, 1 = violations found, 2 = error
      20 |  */
      21 |
>>>   22 | import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
      23 | import { join, dirname, extname, relative } from "node:path";
      24 | import { fileURLToPath } from "node:url";
      25 | import { execSync } from "node:child_process";
```

---

#### 🔵 Line 23: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      20 |  */
      21 |
      22 | import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
>>>   23 | import { join, dirname, extname, relative } from "node:path";
      24 | import { fileURLToPath } from "node:url";
      25 | import { execSync } from "node:child_process";
      26 | import { sanitizeError } from "./lib/sanitize-error.js";
```

---

#### 🔵 Line 24: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      21 |
      22 | import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
      23 | import { join, dirname, extname, relative } from "node:path";
>>>   24 | import { fileURLToPath } from "node:url";
      25 | import { execSync } from "node:child_process";
      26 | import { sanitizeError } from "./lib/sanitize-error.js";
      27 |
```

---

#### 🔵 Line 25: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      22 | import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
      23 | import { join, dirname, extname, relative } from "node:path";
      24 | import { fileURLToPath } from "node:url";
>>>   25 | import { execSync } from "node:child_process";
      26 | import { sanitizeError } from "./lib/sanitize-error.js";
      27 |
      28 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🟡 Line 117: Simplify this regular expression to reduce its complexity from 21 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     114 |     // Use lazy quantifiers and word boundaries for accurate matching
     115 |     // Note: Global flag required - checkFile uses exec() in a loop which needs /g to advance lastIndex
     116 |     pattern:
>>>  117 |       /for\s+\w+\s+in\s+1\s+2\s+3\s*;\s*do[\s\S]{0,120}?&&\s*break[\s\S]{0,80}?done(?![\s\S]{0,80}?(?:\bSUCCESS\b|\bsuccess\b|\bFAILED\b|\bfailed\b))/g,
     118 |     message: "Retry loop may silently succeed on failure - not tracking success",
     119 |     fix: "Track: SUCCESS=false; for i in 1 2 3; do cmd && { SUCCESS=true; break; }; done; $SUCCESS || exit 1",
     120 |     review: "#18, #19, #51",
```

---

#### 🔵 Line 228: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     225 |     id: "simple-path-traversal-check",
     226 |     pattern: /startsWith\s*\(\s*['"`]\.\.['"`]\s*\)/g,
     227 |     message: 'Simple ".." check has false positives (e.g., "..hidden.md")',
>>>  228 |     fix: "Use: /^\\.\\.(?:[\\\\/]|$)/.test(rel)",
     229 |     review: "#18, #53",
     230 |     fileTypes: [".js", ".ts"],
     231 |     // NOTE: Do NOT exclude files even if they use path.relative() first.
```

---

#### 🟡 Line 240: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     237 |   {
     238 |     id: "hardcoded-api-key",
     239 |     pattern:
>>>  240 |       /\b(?:api[_-]?key|apikey|secret|password|token)\b\s*[:=]\s*['"`][A-Za-z0-9_/+=-]{20,}['"`]/gi,
     241 |     message: "Potential hardcoded API key or secret detected",
     242 |     fix: "Use environment variables: process.env.API_KEY",
     243 |     review: "Security Standards",
```

---

#### 🟡 Line 268: Simplify this regular expression to reduce its complexity from 34 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 36min

```js
     265 |   {
     266 |     id: "sql-injection-risk",
     267 |     pattern:
>>>  268 |       /(?:query|exec|execute|prepare|run|all|get)\s*\(\s*(?:`[^`]*(?:\$\{|\+\s*)|'[^']*(?:\$\{|\+\s*)|"[^"]*(?:\$\{|\+\s*))/g,
     269 |     message: "Potential SQL injection: string interpolation or concatenation in query",
     270 |     fix: 'Use parameterized queries with placeholders (e.g., db.query("SELECT * FROM users WHERE id = ?", [userId]))',
     271 |     review: "Security Standards",
```

---

#### 🟡 Line 298: Simplify this regular expression to reduce its complexity from 21 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     295 |   {
     296 |     id: "path-join-without-containment",
     297 |     pattern:
>>>  298 |       /path\.join\s*\([^)]*,\s*(?:deliverable|user|input|arg|param|file)\w*(?:\.path)?[^)]*\)(?![\s\S]{0,100}(?:relative|isWithin|contains|startsWith))/g,
     299 |     message: "Path joined with user input without containment check",
     300 |     fix: 'Verify path.relative(root, resolved) does not start with ".." or equal ""',
     301 |     review: "#33, #34, #38, #39, #40",
```

---

#### 🟡 Line 307: Simplify this regular expression to reduce its complexity from 28 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 24min

```js
     304 |   {
     305 |     id: "error-without-first-line",
     306 |     pattern:
>>>  307 |       /String\s*\(\s*(?:err|error|e)(?:\?\.message|\s*\?\?\s*err|\s*\?\?\s*error)[\s\S]{0,30}\)(?![\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\))/g,
     308 |     message: "Error converted to string without extracting first line (stack trace leakage)",
     309 |     fix: 'Use: String(err?.message ?? err).split("\\n")[0].replace(/\\r$/, "")',
     310 |     review: "#36, #37, #38",
```

---

#### 🔵 Line 309: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     306 |     pattern:
     307 |       /String\s*\(\s*(?:err|error|e)(?:\?\.message|\s*\?\?\s*err|\s*\?\?\s*error)[\s\S]{0,30}\)(?![\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\))/g,
     308 |     message: "Error converted to string without extracting first line (stack trace leakage)",
>>>  309 |     fix: 'Use: String(err?.message ?? err).split("\\n")[0].replace(/\\r$/, "")',
     310 |     review: "#36, #37, #38",
     311 |     fileTypes: [".js", ".ts"],
     312 |     // Exclude check-pattern-compliance.js: contains pattern definitions as strings (meta-detection)
```

---

#### 🔵 Line 320: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     317 |     pattern:
     318 |       /console\.(?:log|error|warn)\s*\([^)]*(?:content|fileContent|data|text|body)(?:\s*[,)])/g,
     319 |     message: "File-derived content logged without control char sanitization",
>>>  320 |     fix: 'Sanitize with: content.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, "")',
     321 |     review: "#39, #40",
     322 |     fileTypes: [".js", ".ts"],
     323 |   },
```

---

#### 🔵 Line 328: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     325 |     id: "split-newline-without-cr-strip",
     326 |     pattern:
     327 |       /\.split\s*\(\s*['"`]\\n['"`]\s*\)\s*\[\s*0\s*\](?![\s\S]{0,30}\.replace\s*\(\s*\/\\r\$\/)/g,
>>>  328 |     message: "Line split without stripping trailing \\r (Windows CRLF issue)",
     329 |     fix: 'Add: .replace(/\\r$/, "") after split to handle CRLF',
     330 |     review: "#39, #40",
     331 |     fileTypes: [".js", ".ts"],
```

---

#### 🔵 Line 329: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     326 |     pattern:
     327 |       /\.split\s*\(\s*['"`]\\n['"`]\s*\)\s*\[\s*0\s*\](?![\s\S]{0,30}\.replace\s*\(\s*\/\\r\$\/)/g,
     328 |     message: "Line split without stripping trailing \\r (Windows CRLF issue)",
>>>  329 |     fix: 'Add: .replace(/\\r$/, "") after split to handle CRLF',
     330 |     review: "#39, #40",
     331 |     fileTypes: [".js", ".ts"],
     332 |     // Exclude files verified 2026-01-04 to have proper CRLF handling:
```

---

#### 🔵 Line 341: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     338 |     id: "regex-newline-lookahead",
     339 |     // Match lookaheads in regex literals `(?=\n` and in string patterns `"(?=\\n"`
     340 |     pattern: /\(\?=(?:\\n|\\\\n)(?!\?)/g,
>>>  341 |     message: "Regex lookahead uses \\n without optional \\r (fails on CRLF)",
     342 |     fix: "Use: (?=\\r?\\n for cross-platform line endings",
     343 |     review: "#40",
     344 |     fileTypes: [".js", ".ts"],
```

---

#### 🔵 Line 342: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     339 |     // Match lookaheads in regex literals `(?=\n` and in string patterns `"(?=\\n"`
     340 |     pattern: /\(\?=(?:\\n|\\\\n)(?!\?)/g,
     341 |     message: "Regex lookahead uses \\n without optional \\r (fails on CRLF)",
>>>  342 |     fix: "Use: (?=\\r?\\n for cross-platform line endings",
     343 |     review: "#40",
     344 |     fileTypes: [".js", ".ts"],
     345 |   },
```

---

#### 🔵 Line 351: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     348 |     pattern:
     349 |       /\.split\s*\(\s*['"`]\/['"`]\s*\)[\s\S]{0,50}includes\s*\(\s*['"`]\.\.['"`]\s*\)(?![\s\S]{0,100}replace\s*\(\s*\/\\\\\/g)/g,
     350 |     message: "Path traversal check splits on / without normalizing Windows backslashes",
>>>  351 |     fix: 'First normalize: path.replace(/\\\\/g, "/").split("/").includes("..")',
     352 |     review: "#39, #40",
     353 |     fileTypes: [".js", ".ts"],
     354 |     // Exclude files verified 2026-01-04 to normalize before split:
```

---

#### 🟡 Line 413: Simplify this regular expression to reduce its complexity from 23 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 14min

```js
     410 |   {
     411 |     id: "empty-path-not-rejected",
     412 |     pattern:
>>>  413 |       /(?:startsWith\s*\(\s*['"`]\.\.['"`]\s*\)|\.isAbsolute\s*\(\s*rel\s*\))(?![\s\S]{0,50}===\s*['"`]['"`])/g,
     414 |     message: 'Path validation may miss empty string edge case (rel === "")',
     415 |     fix: 'Add: rel === "" || rel.startsWith("..") || path.isAbsolute(rel)',
     416 |     review: "#40",
```

---

#### 🔵 Line 435: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     432 |  */
     433 | function isGloballyExcluded(filePath) {
     434 |   // Normalize to forward slashes for consistent matching
>>>  435 |   const normalized = filePath.replace(/\\/g, "/");
     436 |   return GLOBAL_EXCLUDE.some((pattern) => pattern.test(normalized));
     437 | }
     438 |
```

---

#### 🔵 Line 479: `extensions` should be a `Set`, and use `extensions.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     476 |
     477 |   if (ALL) {
     478 |     const files = [];
>>>  479 |     const extensions = [".sh", ".yml", ".yaml", ".js", ".ts", ".tsx", ".jsx"];
     480 |     const ignoreDirs = ["node_modules", ".next", "dist", "dist-tests", ".git", "coverage"];
     481 |
     482 |     function walk(dir) {
```

---

#### 🔵 Line 480: `ignoreDirs` should be a `Set`, and use `ignoreDirs.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     477 |   if (ALL) {
     478 |     const files = [];
     479 |     const extensions = [".sh", ".yml", ".yaml", ".js", ".ts", ".tsx", ".jsx"];
>>>  480 |     const ignoreDirs = ["node_modules", ".next", "dist", "dist-tests", ".git", "coverage"];
     481 |
     482 |     function walk(dir) {
     483 |       try {
```

---

#### 🟠 Line 482: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

```js
     479 |     const extensions = [".sh", ".yml", ".yaml", ".js", ".ts", ".tsx", ".jsx"];
     480 |     const ignoreDirs = ["node_modules", ".next", "dist", "dist-tests", ".git", "coverage"];
     481 |
>>>  482 |     function walk(dir) {
     483 |       try {
     484 |         const entries = readdirSync(dir);
     485 |         for (const entry of entries) {
```

---

#### 🟡 Line 515: This branch's code block is the same as the block for the branch on line 513.

- **Rule**: `javascript:S1871`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     512 |             // Include files with known extensions OR extensionless files in .husky
     513 |             if (extensions.includes(ext)) {
     514 |               files.push(relative(ROOT, fullPath));
>>>  515 |             } else if (!ext && relative(ROOT, dir).startsWith(".husky")) {
     516 |               // Extensionless files in .husky are shell scripts
     517 |               files.push(relative(ROOT, fullPath));
     518 |             }
```

---

#### 🟠 Line 557: Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 16min

```js
     554 | /**
     555 |  * Check a file for anti-patterns
     556 |  */
>>>  557 | function checkFile(filePath) {
     558 |   const fullPath = join(ROOT, filePath);
     559 |   if (!existsSync(fullPath)) {
     560 |     return [];
```

---

#### 🔵 Line 591: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     588 |   const violations = [];
     589 |
     590 |   // Normalize path separators for consistent regex matching on Windows
>>>  591 |   const normalizedPath = filePath.replace(/\\/g, "/");
     592 |
     593 |   for (const antiPattern of ANTI_PATTERNS) {
     594 |     // Skip if file type doesn't match
```

---

### 📁 `functions/src/admin.ts` (34 issues)

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

---

#### 🔵 Line N/A: Prefer `.some(…)` over `.find(…)`.

- **Rule**: `typescript:S7754`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `.some(…)` over `.find(…)`.

- **Rule**: `typescript:S7754`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 142: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     139 | }
     140 |
     141 | function sanitizeSentryTitle(title: string) {
>>>  142 |   const redactedEmail = title.replace(
     143 |     /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
     144 |     "[redacted-email]"
     145 |   );
```

---

#### 🔵 Line 146: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     143 |     /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
     144 |     "[redacted-email]"
     145 |   );
>>>  146 |   const redactedPhone = redactedEmail.replace(
     147 |     /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
     148 |     "[redacted-phone]"
     149 |   );
```

---

#### 🔵 Line 150: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     147 |     /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
     148 |     "[redacted-phone]"
     149 |   );
>>>  150 |   const redactedTokens = redactedPhone.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
     151 |   return redactedTokens;
     152 | }
     153 |
```

---

#### 🟠 Line 616: Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 18min

```ts
     613 |   limit?: number;
     614 | }
     615 |
>>>  616 | export const adminSearchUsers = onCall<SearchUsersRequest>(async (request) => {
     617 |   await requireAdmin(request, "adminSearchUsers");
     618 |
     619 |   const { query, limit: rawLimit = 20 } = request.data;
```

---

#### 🔵 Line 690: Prefer `.some(…)` over `.find(…)`.

- **Rule**: `typescript:S7754`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     687 |         const userDoc = await db.collection("users").doc(authUser.uid).get();
     688 |         const userData = userDoc.exists ? userDoc.data()! : {};
     689 |
>>>  690 |         if (!results.find((u) => u.uid === authUser.uid)) {
     691 |           results.push({
     692 |             uid: authUser.uid,
     693 |             email: authUser.email || null,
```

---

#### 🔵 Line 717: Prefer `.some(…)` over `.find(…)`.

- **Rule**: `typescript:S7754`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     714 |       .get();
     715 |
     716 |     for (const doc of exactNicknameResults.docs) {
>>>  717 |       if (results.find((u) => u.uid === doc.id)) continue;
     718 |
     719 |       const userData = doc.data();
     720 |       try {
```

---

#### 🔵 Line 744: Prefer `.some(…)` over `.find(…)`.

- **Rule**: `typescript:S7754`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     741 |       .get();
     742 |
     743 |     for (const doc of nicknameResults.docs) {
>>>  744 |       if (results.find((u) => u.uid === doc.id)) continue;
     745 |
     746 |       const userData = doc.data();
     747 |       try {
```

---

#### 🔵 Line 1637: Replace this union type with a type alias.

- **Rule**: `typescript:S4323`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
    1634 |  */
    1635 | interface GetLogsRequest {
    1636 |   limit?: number;
>>> 1637 |   severity?: "ERROR" | "WARNING" | "INFO";
    1638 | }
    1639 |
    1640 | interface LogEntry {
```

---

#### 🟡 Line 1914: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
    1911 |
    1912 |   const { privilegeType } = request.data;
    1913 |
>>> 1914 |   if (!privilegeType || !privilegeType.id || !privilegeType.name) {
    1915 |     throw new HttpsError("invalid-argument", "Privilege type ID and name are required");
    1916 |   }
    1917 |
```

---

#### 🟠 Line 2073: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```ts
    2070 |   privilegeTypeId: string;
    2071 | }
    2072 |
>>> 2073 | export const adminSetUserPrivilege = onCall<SetUserPrivilegeRequest>(async (request) => {
    2074 |   await requireAdmin(request, "adminSetUserPrivilege");
    2075 |
    2076 |   const { uid, privilegeTypeId } = request.data;
```

---

#### 🟠 Line 2182: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```ts
    2179 |   }
    2180 | });
    2181 |
>>> 2182 | export const adminListUsers = onCall<ListUsersRequest>(async (request) => {
    2183 |   await requireAdmin(request, "adminListUsers");
    2184 |
    2185 |   const {
```

---

#### 🔵 Line 2227: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```ts
    2224 |       const cursorDoc = await db.collection("users").doc(startAfterUid).get();
    2225 |       if (cursorDoc.exists) {
    2226 |         const cursorData = cursorDoc.data() as Record<string, unknown> | undefined;
>>> 2227 |         const rawValue = cursorData?.[safeSortBy] as unknown;
    2228 |
    2229 |         // ROBUSTNESS: Use sentinel timestamps for timestamp fields when null/malformed
    2230 |         // Prevents Firestore cursor type mismatch errors that cause startAfter() to throw
```

---

#### 🟡 Line 2344: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
    2341 |
    2342 |     const { email } = request.data;
    2343 |
>>> 2344 |     if (!email || !email.includes("@")) {
    2345 |       throw new HttpsError("invalid-argument", "Valid email is required");
    2346 |     }
    2347 |
```

---

#### 🟠 Line 2440: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

```ts
    2437 |  * Admin: Get Storage Statistics
    2438 |  * Returns storage usage statistics
    2439 |  */
>>> 2440 | export const adminGetStorageStats = onCall(async (request) => {
    2441 |   await requireAdmin(request, "adminGetStorageStats");
    2442 |
    2443 |   logSecurityEvent("ADMIN_ACTION", "adminGetStorageStats", "Admin requested storage stats", {
```

---

#### 🔵 Line 2479: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
    2476 |
    2477 |     for (const file of files) {
    2478 |       const metadata = file.metadata;
>>> 2479 |       const parsedSize = parseInt(String(metadata.size || "0"), 10);
    2480 |       const size = Number.isNaN(parsedSize) ? 0 : parsedSize;
    2481 |       totalSize += size;
    2482 |       fileCount++;
```

---

#### 🔵 Line 2569: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
    2566 |   const k = 1024;
    2567 |   const sizes = ["B", "KB", "MB", "GB", "TB"];
    2568 |   const i = Math.floor(Math.log(bytes) / Math.log(k));
>>> 2569 |   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    2570 | }
    2571 |
    2572 | /**
```

---

#### 🟠 Line 2576: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```ts
    2573 |  * Admin: Get Rate Limit Status
    2574 |  * Returns current rate limit status for monitoring
    2575 |  */
>>> 2576 | export const adminGetRateLimitStatus = onCall(async (request) => {
    2577 |   await requireAdmin(request, "adminGetRateLimitStatus");
    2578 |
    2579 |   logSecurityEvent("ADMIN_ACTION", "adminGetRateLimitStatus", "Admin requested rate limit status", {
```

---

#### 🟡 Line 2614: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
    2611 |       const resetAtMs =
    2612 |         typeof resetAtRaw?.toMillis === "function"
    2613 |           ? resetAtRaw.toMillis()
>>> 2614 |           : typeof resetAtRaw === "number"
    2615 |             ? resetAtRaw
    2616 |             : resetAtRaw instanceof Date
    2617 |               ? resetAtRaw.getTime()
```

---

#### 🟡 Line 2616: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
    2613 |           ? resetAtRaw.toMillis()
    2614 |           : typeof resetAtRaw === "number"
    2615 |             ? resetAtRaw
>>> 2616 |             : resetAtRaw instanceof Date
    2617 |               ? resetAtRaw.getTime()
    2618 |               : typeof resetAtRaw === "string"
    2619 |                 ? Date.parse(resetAtRaw)
```

---

#### 🟡 Line 2618: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
    2615 |             ? resetAtRaw
    2616 |             : resetAtRaw instanceof Date
    2617 |               ? resetAtRaw.getTime()
>>> 2618 |               : typeof resetAtRaw === "string"
    2619 |                 ? Date.parse(resetAtRaw)
    2620 |                 : NaN;
    2621 |
```

---

#### 🔵 Line 2620: Prefer `Number.NaN` over `NaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
    2617 |               ? resetAtRaw.getTime()
    2618 |               : typeof resetAtRaw === "string"
    2619 |                 ? Date.parse(resetAtRaw)
>>> 2620 |                 : NaN;
    2621 |
    2622 |       // Skip entries with invalid timestamps
    2623 |       if (!Number.isFinite(resetAtMs)) {
```

---

#### 🟠 Line 2747: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```ts
    2744 |  * Admin: Get Collection Statistics
    2745 |  * Returns document counts and estimated sizes for all collections
    2746 |  */
>>> 2747 | export const adminGetCollectionStats = onCall(async (request) => {
    2748 |   await requireAdmin(request, "adminGetCollectionStats");
    2749 |
    2750 |   logSecurityEvent("ADMIN_ACTION", "adminGetCollectionStats", "Admin requested collection stats", {
```

---

### 📁 `.claude/hooks/session-start.sh` (33 issues)

#### 🟡 Line N/A: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line N/A: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line N/A: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line N/A: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line 30: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      27 | # =============================================================================
      28 |
      29 | # Only run in Claude Code on the web (remote environments)
>>>   30 | if [[ "${CLAUDE_CODE_REMOTE:-}" != "true" ]]; then
      31 |   exit 0
      32 | fi
      33 |
```

---

#### 🟡 Line 64: Add an explicit return statement at the end of the function.

- **Rule**: `shelldre:S7682`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      61 | FUNCTIONS_LOCKFILE_HASH_FILE=".claude/.functions-lockfile-hash"
      62 |
      63 | # Function to compute hash of a file (portable across systems)
>>>   64 | compute_hash() {
      65 |   local file="$1"
      66 |   if command -v sha256sum &> /dev/null; then
      67 |     sha256sum "$file" 2>/dev/null | cut -d' ' -f1
```

---

#### 🟡 Line 81: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      78 | # Check if root dependencies need install
      79 | needs_root_install() {
      80 |   # Always install if node_modules doesn't exist
>>>   81 |   if [[ ! -d "node_modules" ]]; then
      82 |     return 0  # true - needs install
      83 |   fi
      84 |
```

---

#### 🟡 Line 86: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      83 |   fi
      84 |
      85 |   # Always install if lockfile doesn't exist
>>>   86 |   if [[ ! -s "package-lock.json" ]]; then
      87 |     return 0  # true - needs install
      88 |   fi
      89 |
```

---

#### 🟡 Line 91: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      88 |   fi
      89 |
      90 |   # Check if lockfile hash matches cached hash
>>>   91 |   if [[ -f "$LOCKFILE_HASH_FILE" ]]; then
      92 |     local current_hash
      93 |     current_hash=$(compute_hash "package-lock.json")
      94 |     local cached_hash
```

---

#### 🟡 Line 96: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      93 |     current_hash=$(compute_hash "package-lock.json")
      94 |     local cached_hash
      95 |     cached_hash=$(cat "$LOCKFILE_HASH_FILE" 2>/dev/null || echo "")
>>>   96 |     if [[ "$current_hash" = "$cached_hash" ]]; then
      97 |       return 1  # false - skip install
      98 |     fi
      99 |   fi
```

---

#### 🟡 Line 107: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     104 | # Check if functions dependencies need install
     105 | needs_functions_install() {
     106 |   # Always install if functions/node_modules doesn't exist
>>>  107 |   if [[ ! -d "functions/node_modules" ]]; then
     108 |     return 0  # true - needs install
     109 |   fi
     110 |
```

---

#### 🟡 Line 112: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     109 |   fi
     110 |
     111 |   # Always install if lockfile doesn't exist
>>>  112 |   if [[ ! -s "functions/package-lock.json" ]]; then
     113 |     return 0  # true - needs install
     114 |   fi
     115 |
```

---

#### 🟡 Line 117: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     114 |   fi
     115 |
     116 |   # Check if lockfile hash matches cached hash
>>>  117 |   if [[ -f "$FUNCTIONS_LOCKFILE_HASH_FILE" ]]; then
     118 |     local current_hash
     119 |     current_hash=$(compute_hash "functions/package-lock.json")
     120 |     local cached_hash
```

---

#### 🟡 Line 122: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     119 |     current_hash=$(compute_hash "functions/package-lock.json")
     120 |     local cached_hash
     121 |     cached_hash=$(cat "$FUNCTIONS_LOCKFILE_HASH_FILE" 2>/dev/null || echo "")
>>>  122 |     if [[ "$current_hash" = "$cached_hash" ]]; then
     123 |       return 1  # false - skip install
     124 |     fi
     125 |   fi
```

---

#### 🟡 Line 131: Add an explicit return statement at the end of the function.

- **Rule**: `shelldre:S7682`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     128 | }
     129 |
     130 | # Save hash after successful install
>>>  131 | save_root_hash() {
     132 |   mkdir -p "$(dirname "$LOCKFILE_HASH_FILE")"
     133 |   compute_hash "package-lock.json" > "$LOCKFILE_HASH_FILE"
     134 | }
```

---

#### 🟡 Line 136: Add an explicit return statement at the end of the function.

- **Rule**: `shelldre:S7682`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     133 |   compute_hash "package-lock.json" > "$LOCKFILE_HASH_FILE"
     134 | }
     135 |
>>>  136 | save_functions_hash() {
     137 |   mkdir -p "$(dirname "$FUNCTIONS_LOCKFILE_HASH_FILE")"
     138 |   compute_hash "functions/package-lock.json" > "$FUNCTIONS_LOCKFILE_HASH_FILE"
     139 | }
```

---

#### 🟡 Line 157: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     154 |       return 0
     155 |     else
     156 |       local exit_code=$?
>>>  157 |       if [[[ $exit_code -eq 124 ]]; then
     158 |         echo "   ⚠️ $description timed out after ${timeout_seconds}s (continuing anyway)"
     159 |       else
     160 |         echo "   ⚠️ $description failed with exit code $exit_code (continuing anyway)"
```

---

#### 🟡 Line 186: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     183 | # Falls back to 'npm install' if lockfile is missing (new repos, etc.)
     184 | # OPTIMIZATION: Skip install if lockfile hash matches cached version
     185 | if needs_root_install; then
>>>  186 |   if [[ -s "package-lock.json" ]]; then
     187 |     if run_npm_with_timeout "Installing root dependencies" \
     188 |       "npm ci --prefer-offline --no-audit --no-fund" 120; then
     189 |       save_root_hash
```

---

#### 🔵 Line 186: Define a constant instead of using the literal 'package-lock.json' 4 times.

- **Rule**: `shelldre:S1192`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 4min

```sh
     183 | # Falls back to 'npm install' if lockfile is missing (new repos, etc.)
     184 | # OPTIMIZATION: Skip install if lockfile hash matches cached version
     185 | if needs_root_install; then
>>>  186 |   if [[ -s "package-lock.json" ]]; then
     187 |     if run_npm_with_timeout "Installing root dependencies" \
     188 |       "npm ci --prefer-offline --no-audit --no-fund" 120; then
     189 |       save_root_hash
```

---

#### 🟡 Line 207: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     204 | # Install Firebase Functions dependencies and build
     205 | # Use --legacy-peer-deps for functions/ to preserve original dependency resolution
     206 | # OPTIMIZATION: Skip install if lockfile hash matches cached version
>>>  207 | if [[ -d "functions" ]]; then
     208 |   if needs_functions_install; then
     209 |     if [[ -s "functions/package-lock.json" ]]; then
     210 |       if run_npm_with_timeout "Installing Firebase Functions dependencies" \
```

---

#### 🔵 Line 209: Define a constant instead of using the literal 'functions/package-lock.json' 4 times.

- **Rule**: `shelldre:S1192`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 4min

```sh
     206 | # OPTIMIZATION: Skip install if lockfile hash matches cached version
     207 | if [[ -d "functions" ]]; then
     208 |   if needs_functions_install; then
>>>  209 |     if [[ -s "functions/package-lock.json" ]]; then
     210 |       if run_npm_with_timeout "Installing Firebase Functions dependencies" \
     211 |         "cd functions && npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps" 120; then
     212 |         save_functions_hash
```

---

#### 🟡 Line 209: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     206 | # OPTIMIZATION: Skip install if lockfile hash matches cached version
     207 | if [[ -d "functions" ]]; then
     208 |   if needs_functions_install; then
>>>  209 |     if [[ -s "functions/package-lock.json" ]]; then
     210 |       if run_npm_with_timeout "Installing Firebase Functions dependencies" \
     211 |         "cd functions && npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps" 120; then
     212 |         save_functions_hash
```

---

#### 🟡 Line 226: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     223 |   else
     224 |     echo "📦 Skipping Firebase Functions dependencies (unchanged since last install)"
     225 |     # Still need to build if lib/ doesn't exist or is stale
>>>  226 |     if [[ ! -d "functions/lib" ]] || [ "functions/src" -nt "functions/lib" ]]; then
     227 |       run_npm_with_timeout "Building Firebase Functions" \
     228 |         "cd functions && npm run build" 60
     229 |     else
```

---

#### 🟡 Line 226: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     223 |   else
     224 |     echo "📦 Skipping Firebase Functions dependencies (unchanged since last install)"
     225 |     # Still need to build if lib/ doesn't exist or is stale
>>>  226 |     if [[ ! -d "functions/lib" ]] || [ "functions/src" -nt "functions/lib" ]]; then
     227 |       run_npm_with_timeout "Building Firebase Functions" \
     228 |         "cd functions && npm run build" 60
     229 |     else
```

---

#### 🟡 Line 250: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     247 |   echo "   ✓ No pattern violations found"
     248 | else
     249 |   EXIT_CODE=$?
>>>  250 |   if [[ "$EXIT_CODE" -ge 2 ]]; then
     251 |     echo "   ❌ Pattern checker failed (exit $EXIT_CODE)"
     252 |     if [[ -s "$PATTERN_ERR_TMP" ]]; then
     253 |       echo "   stderr:"
```

---

#### 🟡 Line 252: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     249 |   EXIT_CODE=$?
     250 |   if [[ "$EXIT_CODE" -ge 2 ]]; then
     251 |     echo "   ❌ Pattern checker failed (exit $EXIT_CODE)"
>>>  252 |     if [[ -s "$PATTERN_ERR_TMP" ]]; then
     253 |       echo "   stderr:"
     254 |       sed 's/^/   /' "$PATTERN_ERR_TMP"
     255 |     fi
```

---

#### 🟡 Line 270: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     267 | REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
     268 | OUTPUT=$(node "$REPO_ROOT/scripts/run-consolidation.js" --auto 2>&1)
     269 | EXIT_CODE=$?
>>>  270 | if [[ "$EXIT_CODE" -eq 0 ]]; then
     271 |   if [[ -n "$OUTPUT" ]]; then
     272 |     echo "$OUTPUT"
     273 |   else
```

---

#### 🟡 Line 271: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     268 | OUTPUT=$(node "$REPO_ROOT/scripts/run-consolidation.js" --auto 2>&1)
     269 | EXIT_CODE=$?
     270 | if [[ "$EXIT_CODE" -eq 0 ]]; then
>>>  271 |   if [[ -n "$OUTPUT" ]]; then
     272 |     echo "$OUTPUT"
     273 |   else
     274 |     echo "   ✓ No consolidation needed"
```

---

#### 🟡 Line 276: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     273 |   else
     274 |     echo "   ✓ No consolidation needed"
     275 |   fi
>>>  276 | elif [[ "$EXIT_CODE" -ge 2 ]]; then
     277 |   echo "   ❌ Auto-consolidation failed (exit $EXIT_CODE):"
     278 |   echo "$OUTPUT" | sed 's/^/     /'
     279 |   WARNINGS=$((WARNINGS + 1))
```

---

#### 🟡 Line 307: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     304 |   echo "   ✓ Documents are in sync"
     305 | else
     306 |   DOC_SYNC_EXIT=$?
>>>  307 |   if [[ "$DOC_SYNC_EXIT" -eq 1 ]]; then
     308 |     echo "   ⚠️ Some documents may be out of sync - run: npm run docs:sync-check"
     309 |     WARNINGS=$((WARNINGS + 1))
     310 |   else
```

---

#### 🟡 Line 317: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     314 |
     315 | echo ""
     316 | echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
>>>  317 | if [[ "$WARNINGS" -eq 0 ]]; then
     318 |   echo "✅ SessionStart hook completed successfully!"
     319 | else
     320 |   echo "⚠️ SessionStart hook completed with $WARNINGS warning(s)"
```

---

#### 🟡 Line 334: Redirect this error message to stderr (>&2).

- **Rule**: `shelldre:S7677`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```sh
     331 | echo "  4. ☐ Check available skills BEFORE starting:"
     332 | echo ""
     333 | echo "      SKILL DECISION TREE:"
>>>  334 | echo "      ├─ Bug/Error? → Use 'systematic-debugging' skill FIRST"
     335 | echo "      ├─ Writing code? → Use 'code-reviewer' agent AFTER"
     336 | echo "      ├─ Security work? → Use 'security-auditor' agent"
     337 | echo "      ├─ UI/Frontend? → Use 'frontend-design' skill"
```

---

#### 🔵 Line 342: Define a constant instead of using the literal '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' 4 times.

- **Rule**: `shelldre:S1192`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 4min

```sh
     339 | echo ""
     340 | echo "  5. ☐ Review active blockers before starting work"
     341 | echo ""
>>>  342 | echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
     343 | echo ""
     344 | echo "💡 Tips:"
     345 | echo "   - Review claude.md + docs/agent_docs/CODE_PATTERNS.md for anti-patterns"
```

---

### 📁 `components/admin/users-tab.tsx` (30 issues)

#### 🔵 Line N/A: Prefer `Math.max()` to simplify ternary expressions.

- **Rule**: `typescript:S7766`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Ambiguous spacing after previous element strong

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Ambiguous spacing after previous element strong

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 27: 'date-fns' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
      24 |   Trash2,
      25 |   Undo2,
      26 | } from "lucide-react";
>>>   27 | import { differenceInDays } from "date-fns";
      28 | import { formatDistanceToNow } from "date-fns";
      29 |
      30 | interface UserSearchResult {
```

---

#### 🔵 Line 28: 'date-fns' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
      25 |   Undo2,
      26 | } from "lucide-react";
      27 | import { differenceInDays } from "date-fns";
>>>   28 | import { formatDistanceToNow } from "date-fns";
      29 |
      30 | interface UserSearchResult {
      31 |   uid: string;
```

---

#### 🟠 Line 96: Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 31min

```tsx
      93 |   isDefault?: boolean;
      94 | }
      95 |
>>>   96 | export function UsersTab() {
      97 |   // List/pagination state
      98 |   const [users, setUsers] = useState<UserSearchResult[]>([]);
      99 |   const [loading, setLoading] = useState(true);
```

---

#### 🔵 Line 554: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     551 |       setSelectedUser(null);
     552 |     };
     553 |
>>>  554 |     window.addEventListener("keydown", handleKeyDown);
     555 |     return () => window.removeEventListener("keydown", handleKeyDown);
     556 |   }, [selectedUid, deleteDialogStep]);
     557 |
```

---

#### 🔵 Line 555: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     552 |     };
     553 |
     554 |     window.addEventListener("keydown", handleKeyDown);
>>>  555 |     return () => window.removeEventListener("keydown", handleKeyDown);
     556 |   }, [selectedUid, deleteDialogStep]);
     557 |
     558 |   async function handleSoftDelete() {
```

---

#### 🔵 Line 717: Prefer `Math.max()` to simplify ternary expressions.

- **Rule**: `typescript:S7766`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     714 |     if (Number.isNaN(hardDeleteDate.getTime())) return null;
     715 |
     716 |     const days = differenceInDays(hardDeleteDate, new Date());
>>>  717 |     return days > 0 ? days : 0;
     718 |   }
     719 |
     720 |   return (
```

---

#### 🟡 Line 902: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     899 |                               );
     900 |                             })()}
     901 |                           </>
>>>  902 |                         ) : user.disabled ? (
     903 |                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
     904 |                             Disabled
     905 |                           </span>
```

---

#### 🔵 Line 1059: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
    1056 |               <div className="bg-white border border-amber-100 rounded-lg p-4">
    1057 |                 <div className="flex items-center justify-between mb-2">
    1058 |                   <h4 className="font-medium text-amber-900">Admin Notes</h4>
>>> 1059 |                   {!editingNotes ? (
    1060 |                     <button
    1061 |                       onClick={() => setEditingNotes(true)}
    1062 |                       className="p-1 hover:bg-amber-50 rounded transition-colors"
```

---

#### 🟡 Line 1164: Ambiguous spacing after previous element strong

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1161 |                         This user&apos;s account will be permanently deleted in{" "}
    1162 |                         <strong>
    1163 |                           {getDaysUntilHardDelete(selectedUser.profile.scheduledHardDeleteAt)} days
>>> 1164 |                         </strong>
    1165 |                         . All their data (journal entries, check-ins, inventory) will be removed.
    1166 |                       </p>
    1167 |                       {selectedUser.profile.softDeleteReason && (
```

---

#### 🔵 Line 1229: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
    1226 |                         ? "bg-green-500 text-white"
    1227 |                         : "bg-amber-500 text-white hover:bg-amber-600"
    1228 |                     }`}
>>> 1229 |                     title={!selectedUser.profile.email ? "User has no email address" : undefined}
    1230 |                   >
    1231 |                     {sendingPasswordReset ? (
    1232 |                       <>
```

---

#### 🟡 Line 1236: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1233 |                         <Loader2 className="w-4 h-4 animate-spin" />
    1234 |                         Sending...
    1235 |                       </>
>>> 1236 |                     ) : passwordResetSent ? (
    1237 |                       <>
    1238 |                         <CheckCircle className="w-4 h-4" />
    1239 |                         Email Sent!
```

---

#### 🟡 Line 1329: Use <img alt=...> instead of the "presentation" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1326 |
    1327 |       {/* Overlay - click or Escape to close */}
    1328 |       {selectedUser && (
>>> 1329 |         <div
    1330 |           className="fixed inset-0 bg-black/20 z-40"
    1331 |           onClick={() => setSelectedUser(null)}
    1332 |           onKeyDown={(e) => e.key === "Escape" && setSelectedUser(null)}
```

---

#### 🟡 Line 1340: Use <img alt=...> instead of the "presentation" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1337 |       {/* Delete Confirmation Dialog */}
    1338 |       {deleteDialogStep > 0 && selectedUser && (
    1339 |         <>
>>> 1340 |           <div
    1341 |             className="fixed inset-0 bg-black/50 z-50"
    1342 |             onClick={closeDeleteDialog}
    1343 |             onKeyDown={(e) => e.key === "Escape" && closeDeleteDialog()}
```

---

#### 🟡 Line 1347: Non-interactive elements should not be assigned mouse or keyboard event listeners.

- **Rule**: `typescript:S6847`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1344 |             role="presentation"
    1345 |           />
    1346 |           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
>>> 1347 |             <div
    1348 |               className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
    1349 |               onClick={(e) => e.stopPropagation()}
    1350 |               onKeyDown={(e) => e.stopPropagation()}
```

---

#### 🟡 Line 1347: Use <dialog> instead of the "dialog" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1344 |             role="presentation"
    1345 |           />
    1346 |           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
>>> 1347 |             <div
    1348 |               className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
    1349 |               onClick={(e) => e.stopPropagation()}
    1350 |               onKeyDown={(e) => e.stopPropagation()}
```

---

#### 🟡 Line 1372: Ambiguous spacing after previous element strong

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1369 |                     </div>
    1370 |                   </div>
    1371 |                   <p className="text-gray-700 mb-4">
>>> 1372 |                     Are you sure you want to delete <strong>{selectedUser.profile.nickname}</strong>
    1373 |                     ?
    1374 |                   </p>
    1375 |                   <p className="text-sm text-gray-600 mb-4">
```

---

#### 🟡 Line 1380: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
    1377 |                     be permanently deleted after 30 days unless restored.
    1378 |                   </p>
    1379 |                   <div className="mb-4">
>>> 1380 |                     <label className="block text-sm font-medium text-gray-700 mb-1">
    1381 |                       Reason (optional)
    1382 |                     </label>
    1383 |                     <input
```

---

### 📁 `components/notebook/pages/resources-page.tsx` (30 issues)

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🔵 Line N/A: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: The signature '(): Promise<Meeting[]>' of 'MeetingsService.getAllMeetings' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line 3: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
       1 | import dynamic from "next/dynamic";
       2 |
>>>    3 | import { MapPin, Home, Map, Calendar, Loader2, Locate } from "lucide-react";
       4 | import { useState, useEffect, useMemo, useRef, useCallback } from "react";
       5 | import { MeetingsService, type Meeting } from "@/lib/db/meetings";
       6 | import type { QueryDocumentSnapshot } from "firebase/firestore";
```

---

#### 🔵 Line 11: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       8 | import { INITIAL_SOBER_LIVING_HOMES } from "@/scripts/seed-sober-living-data";
       9 | import { toast } from "sonner";
      10 | import { logger } from "@/lib/logger";
>>>   11 | import { useAuth } from "@/components/providers/auth-provider";
      12 | import {
      13 |   Dialog,
      14 |   DialogContent,
```

---

#### 🔵 Line 20: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
      17 |   DialogTitle,
      18 | } from "@/components/ui/dialog";
      19 | import { Button } from "@/components/ui/button";
>>>   20 | import { ExternalLink, Navigation } from "lucide-react";
      21 | import { useGeolocation } from "@/hooks/use-geolocation";
      22 | import { calculateDistance, formatDistance, sortByDistance } from "@/lib/utils/distance";
      23 |
```

---

#### 🟠 Line 40: Refactor this function to reduce its Cognitive Complexity from 48 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 38min

```tsx
      37 |   ),
      38 | });
      39 |
>>>   40 | export default function ResourcesPage() {
      41 |   const [meetings, setMeetings] = useState<Meeting[]>([]);
      42 |   const [soberHomes, setSoberHomes] = useState<SoberLivingHome[]>([]);
      43 |   const [resourceType, setResourceType] = useState<"meetings" | "sober-living">("meetings");
```

---

#### 🔵 Line 52: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      49 |   const [neighborhoodFilter] = useState("All");
      50 |   const [sortBy, setSortBy] = useState<SortOption>("time");
      51 |   const [loading, setLoading] = useState(true);
>>>   52 |   const { user, loading: authLoading } = useAuth();
      53 |   const isDevMode = process.env.NODE_ENV === "development";
      54 |
      55 |   // Pagination state for "View All" mode
```

---

#### 🔵 Line 162: The signature '(): Promise<Meeting[]>' of 'MeetingsService.getAllMeetings' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
     159 |     const data =
     160 |       viewMode === "date"
     161 |         ? await MeetingsService.getMeetingsByDay(queryDayName)
>>>  162 |         : await MeetingsService.getAllMeetings();
     163 |     setMeetings(data);
     164 |     setLoading(false);
     165 |   };
```

---

#### 🔵 Line 213: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     210 |   const parseTime = (timeStr: string) => {
     211 |     // Handle 24h "19:30" or 12h "7:30 PM"
     212 |     if (/AM|PM/i.test(timeStr)) {
>>>  213 |       const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
     214 |       if (!match) return -1;
     215 |       let h = parseInt(match[1]);
     216 |       const m = parseInt(match[2]);
```

---

#### 🔵 Line 215: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     212 |     if (/AM|PM/i.test(timeStr)) {
     213 |       const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
     214 |       if (!match) return -1;
>>>  215 |       let h = parseInt(match[1]);
     216 |       const m = parseInt(match[2]);
     217 |       const p = match[3].toUpperCase();
     218 |       if (p === "PM" && h !== 12) h += 12;
```

---

#### 🔵 Line 216: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     213 |       const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
     214 |       if (!match) return -1;
     215 |       let h = parseInt(match[1]);
>>>  216 |       const m = parseInt(match[2]);
     217 |       const p = match[3].toUpperCase();
     218 |       if (p === "PM" && h !== 12) h += 12;
     219 |       if (p === "AM" && h === 12) h = 0;
```

---

#### 🔵 Line 305: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `typescript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     302 |     // Use all items from ACTIVE type to populate the list
     303 |     const sourceData = resourceType === "meetings" ? meetings : soberHomes;
     304 |     const unique = Array.from(new Set(sourceData.map((item) => item.neighborhood)))
>>>  305 |       .filter((n): n is string => Boolean(n))
     306 |       .sort((a, b) => a.localeCompare(b));
     307 |     return unique;
     308 |   }, [meetings, soberHomes, resourceType]);
```

---

#### 🟡 Line 368: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     365 |         <div className="space-y-3">
     366 |           {resources.map((resource, index) => (
     367 |             <button
>>>  368 |               key={index}
     369 |               onClick={() => handleResourceClick(resource.title, resource.id)}
     370 |               className="w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors group shadow-sm"
     371 |             >
```

---

#### 🟡 Line 467: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     464 |                 <Loader2 className="w-4 h-4 animate-spin" />
     465 |                 <p className="text-sm">Loading schedule...</p>
     466 |               </div>
>>>  467 |             ) : currentData.length === 0 ? (
     468 |               <div className="p-4 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
     469 |                 <p className="text-sm text-amber-900/60 italic mb-3">
     470 |                   {resourceType === "meetings" ? (
```

---

#### 🔵 Line 472: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     469 |                 <p className="text-sm text-amber-900/60 italic mb-3">
     470 |                   {resourceType === "meetings" ? (
     471 |                     <>
>>>  472 |                       No {fellowshipFilter !== "All" ? fellowshipFilter : ""} meetings found
     473 |                       {viewMode === "date" ? " on this date" : ""}.
     474 |                     </>
     475 |                   ) : (
```

---

#### 🟡 Line 498: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     495 |                   )}
     496 |                 </div>
     497 |               </div>
>>>  498 |             ) : displayMode === "map" ? (
     499 |               <div className="animate-in fade-in zoom-in-95 duration-300">
     500 |                 <div className="flex justify-between items-center mb-2 px-1">
     501 |                   <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
```

---

#### 🔵 Line 514: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     511 |                   <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
     512 |                     {resourceType === "meetings" ? (
     513 |                       <>
>>>  514 |                         {fellowshipFilter !== "All" ? `${fellowshipFilter} ` : ""}
     515 |                         {viewMode === "date"
     516 |                           ? `${selectedDate.toLocaleDateString()} (${filteredMeetings.length})`
     517 |                           : `All (${filteredMeetings.length})`}
```

---

#### 🔵 Line 521: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     518 |                       </>
     519 |                     ) : (
     520 |                       <>
>>>  521 |                         {genderFilter !== "All" ? `${genderFilter} ` : ""}
     522 |                         Homes ({filteredSoberHomes.length})
     523 |                       </>
     524 |                     )}
```

---

#### 🟡 Line 607: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     604 |                           ${
     605 |                             home.gender === "Men"
     606 |                               ? "border-blue-200 bg-blue-50 text-blue-700"
>>>  607 |                               : home.gender === "Women"
     608 |                                 ? "border-pink-200 bg-pink-50 text-pink-700"
     609 |                                 : "border-purple-200 bg-purple-50 text-purple-700"
     610 |                           }`}
```

---

#### 🟡 Line 612: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     609 |                                 : "border-purple-200 bg-purple-50 text-purple-700"
     610 |                           }`}
     611 |                         >
>>>  612 |                           {home.gender === "Men" ? "M" : home.gender === "Women" ? "W" : "C"}
     613 |                         </div>
     614 |                       )}
     615 |
```

---

### 📁 `scripts/check-review-needed.js` (29 issues)

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Simplify this regular expression to reduce its complexity from 30 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 28min

---

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

---

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

---

#### 🟡 Line 68: Simplify this regular expression to reduce its complexity from 30 to the 20 allowed.

- **Rule**: `javascript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 28min

```js
      65 |     // Targeted patterns: explicitly match critical security files by name or path
      66 |     // Includes: firestore.rules, middleware.ts, .env files, functions/, auth/firebase libs
      67 |     filePattern:
>>>   68 |       /(^|\/)(firestore\.rules|middleware\.ts)$|(^|\/)\.env(\.|$)|(^|\/)functions\/|(^|\/)lib\/(auth|firebase)[^/]*\.(ts|tsx|js|jsx)$|\b(auth|security|secrets|credential|token)\b/i,
      69 |   },
      70 |   performance: {
      71 |     commits: 30,
```

---

#### 🔵 Line 196: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     193 |   }
     194 |
     195 |   const parsed = new Date(trimmed);
>>>  196 |   if (isNaN(parsed.getTime())) {
     197 |     return "2025-01-01";
     198 |   }
     199 |
```

---

#### 🟠 Line 254: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     251 |  * Fetch issue counts from SonarCloud API
     252 |  * @returns {Promise<{success: boolean, data?: {bugs: number, vulnerabilities: number, codeSmells: number, hotspots: number, qualityGate: string}, error?: string}>}
     253 |  */
>>>  254 | async function fetchSonarCloudData() {
     255 |   if (!SONARCLOUD_ENABLED) {
     256 |     return { success: false, error: "SonarCloud not enabled (use --sonarcloud flag)" };
     257 |   }
```

---

#### 🟡 Line 273: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     270 |
     271 |   const headers = {
     272 |     Accept: "application/json",
>>>  273 |     Authorization: `Basic ${Buffer.from(`${SONAR_CONFIG.token}:`).toString("base64")}`,
     274 |   };
     275 |
     276 |   const controller = new AbortController();
```

---

#### 🟡 Line 801: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     798 |   }
     799 |
     800 |   const gateIcon =
>>>  801 |     sonarData.qualityGate === "OK" ? "✅" : sonarData.qualityGate === "ERROR" ? "❌" : "⚠️";
     802 |   console.log(`Quality Gate: ${gateIcon} ${sonarData.qualityGate}`);
     803 |   console.log(`\nIssue Counts:`);
     804 |   console.log(`  Bugs:            ${sonarData.bugs}`);
```

---

#### 🟠 Line 862: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     859 |  * Reads AUDIT_TRACKER.md, checks per-category thresholds, and outputs results
     860 |  * @returns {Promise<void>} Exits with code 0 (no review needed), 1 (review recommended), or 2 (error)
     861 |  */
>>>  862 | async function main() {
     863 |   // Read AUDIT_TRACKER.md
     864 |   const trackerResult = safeReadFile(TRACKER_PATH, "AUDIT_TRACKER.md");
     865 |   const trackerContent = trackerResult.success ? trackerResult.content : "";
```

---

#### 🟡 Line 981: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     978 | }
     979 |
     980 | // Run
>>>  981 | main().catch((error) => {
     982 |   const msg = sanitizeError(error);
     983 |   if (JSON_OUTPUT) {
     984 |     console.log(JSON.stringify({ error: msg }));
```

---

### 📁 `scripts/check-docs-light.js` (28 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 28: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      25 |  * Exit codes: 0 = pass, 1 = errors found (or warnings in --strict mode)
      26 |  */
      27 |
>>>   28 | import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
      29 | import { join, dirname, basename, relative, extname, isAbsolute, resolve, sep } from "node:path";
      30 | import { fileURLToPath } from "node:url";
      31 | import { sanitizeError } from "./lib/sanitize-error.js";
```

---

#### 🔵 Line 29: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      26 |  */
      27 |
      28 | import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
>>>   29 | import { join, dirname, basename, relative, extname, isAbsolute, resolve, sep } from "node:path";
      30 | import { fileURLToPath } from "node:url";
      31 | import { sanitizeError } from "./lib/sanitize-error.js";
      32 |
```

---

#### 🔵 Line 30: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      27 |
      28 | import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
      29 | import { join, dirname, basename, relative, extname, isAbsolute, resolve, sep } from "node:path";
>>>   30 | import { fileURLToPath } from "node:url";
      31 | import { sanitizeError } from "./lib/sanitize-error.js";
      32 |
      33 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🟠 Line 90: Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 14min

```js
      87 |  * @param {string} content - Document content
      88 |  * @returns {number} - Tier number (1-5) or 0 if unknown
      89 |  */
>>>   90 | function determineTier(filePath, _content) {
      91 |   const fileName = basename(filePath);
      92 |   const relativePath = relative(ROOT, filePath);
      93 |
```

---

#### 🔵 Line 97: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      94 |   // Check explicit file lists first
      95 |   for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
      96 |     if (def.files && def.files.includes(fileName)) {
>>>   97 |       return parseInt(tier);
      98 |     }
      99 |   }
     100 |
```

---

#### 🔵 Line 106: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     103 |     if (def.folders) {
     104 |       for (const folder of def.folders) {
     105 |         if (relativePath.startsWith(folder)) {
>>>  106 |           return parseInt(tier);
     107 |         }
     108 |       }
     109 |     }
```

---

#### 🔵 Line 117: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     114 |     if (def.patterns) {
     115 |       for (const pattern of def.patterns) {
     116 |         if (pattern.test(fileName)) {
>>>  117 |           return parseInt(tier);
     118 |         }
     119 |       }
     120 |     }
```

---

#### 🔵 Line 135: This pattern can be replaced with '\r\n'.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     132 |  */
     133 | function normalizeLineEndings(content) {
     134 |   // S7781: Use replaceAll() for regex with global flag
>>>  135 |   return content.replaceAll(/\r\n/g, "\n").replaceAll(/\r/g, "\n");
     136 | }
     137 |
     138 | /**
```

---

#### 🔵 Line 135: This pattern can be replaced with '\r'.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     132 |  */
     133 | function normalizeLineEndings(content) {
     134 |   // S7781: Use replaceAll() for regex with global flag
>>>  135 |   return content.replaceAll(/\r\n/g, "\n").replaceAll(/\r/g, "\n");
     136 | }
     137 |
     138 | /**
```

---

#### 🔵 Line 152: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     149 |     if (match) {
     150 |       headings.push({
     151 |         level: match[1].length,
>>>  152 |         text: match[2].replace(/🔗|📋|🎯|📊|🗓️|🤖|💡|🚨|✅|📝|📚|🔐|🔄|🗺️|📖|📐|🔀/gu, "").trim(),
     153 |         line: i + 1,
     154 |       });
     155 |     }
```

---

#### 🟡 Line 173: Replace this character class by the character itself.

- **Rule**: `javascript:S6397`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     170 |
     171 |   // Look for "Last Updated" in various formats
     172 |   const lastUpdatedPatterns = [
>>>  173 |     /\*\*Last Updated[:*]*\**\s*[:]*\s*(.+)/i,
     174 |     /Last Updated[:\s]+(.+)/i,
     175 |     /Updated[:\s]+(.+)/i,
     176 |   ];
```

---

#### 🟡 Line 188: Replace this character class by the character itself.

- **Rule**: `javascript:S6397`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     185 |
     186 |   // Look for version number
     187 |   const versionPatterns = [
>>>  188 |     /\*\*(?:Document )?Version[:*]*\**\s*[:]*\s*(\d+\.?\d*)/i,
     189 |     /Version[:\s]+(\d+\.?\d*)/i,
     190 |     /\| (\d+\.\d+) \|.*\|.*\|/, // Version history table
     191 |   ];
```

---

#### 🔵 Line 217: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     214 |   // Try various date formats
     215 |   const date = new Date(dateStr);
     216 |
>>>  217 |   if (isNaN(date.getTime())) {
     218 |     return { valid: false, error: `Invalid date format: "${dateStr}"` };
     219 |   }
     220 |
```

---

#### 🟠 Line 306: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

```js
     303 |  * @param {Array} headings - Extracted headings
     304 |  * @returns {Array<string>} - List of errors
     305 |  */
>>>  306 | function validateAnchorLinks(links, headings) {
     307 |   const errors = [];
     308 |
     309 |   // Generate valid anchors from headings
```

---

#### 🔵 Line 315: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     312 |     // GitHub-style anchor generation
     313 |     const anchor = heading.text
     314 |       .toLowerCase()
>>>  315 |       .replace(/[^\w\s-]/g, "")
     316 |       .replace(/\s+/g, "-")
     317 |       .replace(/-+/g, "-");
     318 |     validAnchors.add(anchor);
```

---

#### 🔵 Line 316: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     313 |     const anchor = heading.text
     314 |       .toLowerCase()
     315 |       .replace(/[^\w\s-]/g, "")
>>>  316 |       .replace(/\s+/g, "-")
     317 |       .replace(/-+/g, "-");
     318 |     validAnchors.add(anchor);
     319 |   }
```

---

#### 🔵 Line 317: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     314 |       .toLowerCase()
     315 |       .replace(/[^\w\s-]/g, "")
     316 |       .replace(/\s+/g, "-")
>>>  317 |       .replace(/-+/g, "-");
     318 |     validAnchors.add(anchor);
     319 |   }
     320 |
```

---

#### 🔵 Line 328: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     325 |     if (!anchor) continue;
     326 |
     327 |     // Normalize anchor for comparison
>>>  328 |     const normalizedAnchor = anchor.toLowerCase().replace(/-+/g, "-");
     329 |
     330 |     if (!validAnchors.has(normalizedAnchor)) {
     331 |       // Check for partial matches (emoji removal might cause mismatches)
```

---

#### 🟠 Line 389: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```js
     386 |  * @param {string} filePath - Path to the document
     387 |  * @returns {{file: string, tier: number, errors: string[], warnings: string[]}}
     388 |  */
>>>  389 | function lintDocument(filePath) {
     390 |   const errors = [];
     391 |   const warnings = [];
     392 |
```

---

#### 🔵 Line 436: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     433 |   }
     434 |
     435 |   // Check 2: Has metadata
>>>  436 |   if (!metadata.lastUpdated) {
     437 |     warnings.push('Missing "Last Updated" date in metadata');
     438 |   } else {
     439 |     // Validate date
```

---

#### 🔵 Line 441: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     438 |   } else {
     439 |     // Validate date
     440 |     const dateResult = parseDate(metadata.lastUpdated);
>>>  441 |     if (!dateResult.valid) {
     442 |       warnings.push(`Invalid "Last Updated" date: ${dateResult.error}`);
     443 |     } else {
     444 |       // Check if date is stale (> 90 days for active docs)
```

---

#### 🔵 Line 445: Prefer `Date.now()` over `new Date()`.

- **Rule**: `javascript:S7759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     442 |       warnings.push(`Invalid "Last Updated" date: ${dateResult.error}`);
     443 |     } else {
     444 |       // Check if date is stale (> 90 days for active docs)
>>>  445 |       const daysSinceUpdate = Math.floor((new Date() - dateResult.date) / (1000 * 60 * 60 * 24));
     446 |       if (daysSinceUpdate > 90 && tier <= 3) {
     447 |         warnings.push(`Document may be stale: last updated ${daysSinceUpdate} days ago`);
     448 |       }
```

---

#### 🟠 Line 525: Refactor this function to reduce its Cognitive Complexity from 55 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 45min

```js
     522 | /**
     523 |  * Main function
     524 |  */
>>>  525 | function main() {
     526 |   console.log("📝 Running documentation linter...\n");
     527 |
     528 |   // Determine files to check
```

---

### 📁 `components/admin/meetings-tab.tsx` (24 issues)

#### 🔵 Line N/A: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 9: '@/lib/db/meetings' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
       6 |
       7 | import { AdminCrudTable } from "./admin-crud-table";
       8 | import { AdminCrudConfig } from "./admin-crud-types";
>>>    9 | import { Meeting } from "@/lib/db/meetings";
      10 | import { MeetingsService } from "@/lib/db/meetings";
      11 |
      12 | const DAYS = [
```

---

#### 🔵 Line 10: '@/lib/db/meetings' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
       7 | import { AdminCrudTable } from "./admin-crud-table";
       8 | import { AdminCrudConfig } from "./admin-crud-types";
       9 | import { Meeting } from "@/lib/db/meetings";
>>>   10 | import { MeetingsService } from "@/lib/db/meetings";
      11 |
      12 | const DAYS = [
      13 |   "Monday",
```

---

#### 🔵 Line 24: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      21 | const TYPES = ["AA", "NA", "CA", "Smart", "Al-Anon"] as const;
      22 |
      23 | // Meeting form component
>>>   24 | function MeetingForm({
      25 |   formData,
      26 |   setFormData,
      27 | }: {
```

---

#### 🟡 Line 34: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      31 |   return (
      32 |     <div className="space-y-4 py-4">
      33 |       <div>
>>>   34 |         <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
      35 |         <input
      36 |           type="text"
      37 |           value={formData.name || ""}
```

---

#### 🟡 Line 46: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      43 |
      44 |       <div className="grid grid-cols-2 gap-4">
      45 |         <div>
>>>   46 |           <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
      47 |           <select
      48 |             value={formData.type || "AA"}
      49 |             onChange={(e) => setFormData({ ...formData, type: e.target.value as Meeting["type"] })}
```

---

#### 🟡 Line 60: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      57 |           </select>
      58 |         </div>
      59 |         <div>
>>>   60 |           <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
      61 |           <select
      62 |             value={formData.day || "Monday"}
      63 |             onChange={(e) => setFormData({ ...formData, day: e.target.value as Meeting["day"] })}
```

---

#### 🟡 Line 76: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      73 |       </div>
      74 |
      75 |       <div>
>>>   76 |         <label className="block text-sm font-medium text-gray-700 mb-1">Time (24h format)</label>
      77 |         <input
      78 |           type="time"
      79 |           value={formData.time || "19:00"}
```

---

#### 🟡 Line 89: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      86 |         <h3 className="text-sm font-medium text-gray-900">Location Details</h3>
      87 |
      88 |         <div>
>>>   89 |           <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
      90 |           <input
      91 |             type="text"
      92 |             value={formData.address || ""}
```

---

#### 🟡 Line 101: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      98 |
      99 |         <div className="grid grid-cols-6 gap-3">
     100 |           <div className="col-span-3">
>>>  101 |             <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
     102 |             <input
     103 |               type="text"
     104 |               value={formData.city || ""}
```

---

#### 🟡 Line 110: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     107 |             />
     108 |           </div>
     109 |           <div className="col-span-1">
>>>  110 |             <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
     111 |             <input
     112 |               type="text"
     113 |               value={formData.state || ""}
```

---

#### 🟡 Line 119: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     116 |             />
     117 |           </div>
     118 |           <div className="col-span-2">
>>>  119 |             <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
     120 |             <input
     121 |               type="text"
     122 |               value={formData.zip || ""}
```

---

#### 🟡 Line 131: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     128 |         </div>
     129 |
     130 |         <div>
>>>  131 |           <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
     132 |           <input
     133 |             type="text"
     134 |             value={formData.neighborhood || ""}
```

---

#### 🟡 Line 144: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     141 |
     142 |       <div className="grid grid-cols-2 gap-4">
     143 |         <div>
>>>  144 |           <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
     145 |           <input
     146 |             type="number"
     147 |             step="any"
```

---

#### 🔵 Line 150: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     147 |             step="any"
     148 |             value={formData.coordinates?.lat ?? ""}
     149 |             onChange={(e) => {
>>>  150 |               const newLat = e.target.value === "" ? undefined : parseFloat(e.target.value);
     151 |               const currentLng = formData.coordinates?.lng;
     152 |
     153 |               if (newLat === undefined && (currentLng === undefined || currentLng === 0)) {
```

---

#### 🟡 Line 172: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     169 |           />
     170 |         </div>
     171 |         <div>
>>>  172 |           <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
     173 |           <input
     174 |             type="number"
     175 |             step="any"
```

---

#### 🔵 Line 178: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     175 |             step="any"
     176 |             value={formData.coordinates?.lng ?? ""}
     177 |             onChange={(e) => {
>>>  178 |               const newLng = e.target.value === "" ? undefined : parseFloat(e.target.value);
     179 |               const currentLat = formData.coordinates?.lat;
     180 |
     181 |               if (newLng === undefined && (currentLat === undefined || currentLat === 0)) {
```

---

#### 🔵 Line 234: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     231 |
     232 | // Time slot helper
     233 | function getTimeSlot(time: string): string {
>>>  234 |   const hour = parseInt(time.split(":")[0], 10);
     235 |   if (hour < 12) return "morning";
     236 |   if (hour < 17) return "afternoon";
     237 |   return "evening";
```

---

#### 🟡 Line 264: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     261 |           className={`px-2 py-1 rounded text-xs font-medium ${
     262 |             meeting.type === "AA"
     263 |               ? "bg-blue-100 text-blue-700"
>>>  264 |               : meeting.type === "NA"
     265 |                 ? "bg-green-100 text-green-700"
     266 |                 : meeting.type === "CA"
     267 |                   ? "bg-purple-100 text-purple-700"
```

---

#### 🟡 Line 266: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     263 |               ? "bg-blue-100 text-blue-700"
     264 |               : meeting.type === "NA"
     265 |                 ? "bg-green-100 text-green-700"
>>>  266 |                 : meeting.type === "CA"
     267 |                   ? "bg-purple-100 text-purple-700"
     268 |                   : "bg-gray-100 text-gray-700"
     269 |           }`}
```

---

### 📁 `scripts/update-readme-status.js` (24 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `javascript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 26: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      23 |  * Exit codes: 0 = success, 1 = error
      24 |  */
      25 |
>>>   26 | import { readFileSync, writeFileSync, existsSync } from "node:fs";
      27 | import { join, dirname } from "node:path";
      28 | import { fileURLToPath } from "node:url";
      29 | import { sanitizeError } from "./lib/sanitize-error.js";
```

---

#### 🔵 Line 27: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      24 |  */
      25 |
      26 | import { readFileSync, writeFileSync, existsSync } from "node:fs";
>>>   27 | import { join, dirname } from "node:path";
      28 | import { fileURLToPath } from "node:url";
      29 | import { sanitizeError } from "./lib/sanitize-error.js";
      30 |
```

---

#### 🔵 Line 28: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      25 |
      26 | import { readFileSync, writeFileSync, existsSync } from "node:fs";
      27 | import { join, dirname } from "node:path";
>>>   28 | import { fileURLToPath } from "node:url";
      29 | import { sanitizeError } from "./lib/sanitize-error.js";
      30 |
      31 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🔵 Line 40: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      37 | const README_PATH = join(ROOT, "README.md");
      38 |
      39 | // Parse command line arguments
>>>   40 | const args = process.argv.slice(2);
      41 | const DRY_RUN = args.includes("--dry-run");
      42 | const VERBOSE = args.includes("--verbose");
      43 |
```

---

#### 🟠 Line 151: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     148 |  * @param {string} content - ROADMAP.md content
     149 |  * @returns {{success: boolean, milestones?: Array, error?: string}}
     150 |  */
>>>  151 | function parseMilestonesTable(content) {
     152 |   const milestones = [];
     153 |   const warnings = [];
     154 |
```

---

#### 🔵 Line 204: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `javascript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     201 |     const cells = row
     202 |       .split("|")
     203 |       .map((cell) => cell.trim())
>>>  204 |       .filter((cell) => cell);
     205 |
     206 |     if (cells.length < 3) {
     207 |       warnings.push(`Row ${i + 1}: Too few columns (${cells.length}), skipping`);
```

---

#### 🔵 Line 211: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     208 |       continue;
     209 |     }
     210 |
>>>  211 |     const name = cells[0].replace(/\*\*/g, "").trim();
     212 |     const status = cells[1].trim();
     213 |     const progressStr = cells[2].trim();
     214 |     const target = cells[3]?.trim() || "";
```

---

#### 🔵 Line 219: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     216 |
     217 |     // Parse progress percentage (handle "~50%", "100%", "0%")
     218 |     const progressMatch = progressStr.match(/~?(\d+)%/);
>>>  219 |     const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
     220 |
     221 |     const milestone = { name, status, progress, target, priority };
     222 |
```

---

#### 🟠 Line 327: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     324 |  * @param {string} overallProgress - Overall progress string
     325 |  * @returns {string} - New Project Status section content
     326 |  */
>>>  327 | function generateStatusSection(milestones, overallProgress) {
     328 |   const today = new Date().toLocaleDateString("en-US", {
     329 |     year: "numeric",
     330 |     month: "long",
```

---

#### 🟡 Line 356: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     353 |   for (const m of milestones) {
     354 |     const statusIcon = m.status.includes("Complete")
     355 |       ? "✅"
>>>  356 |       : m.status.includes("In Progress")
     357 |         ? "🔄"
     358 |         : m.status.includes("Planned")
     359 |           ? "📋"
```

---

#### 🟡 Line 358: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     355 |       ? "✅"
     356 |       : m.status.includes("In Progress")
     357 |         ? "🔄"
>>>  358 |         : m.status.includes("Planned")
     359 |           ? "📋"
     360 |           : m.status.includes("Optional")
     361 |             ? "⏸️"
```

---

#### 🟡 Line 360: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     357 |         ? "🔄"
     358 |         : m.status.includes("Planned")
     359 |           ? "📋"
>>>  360 |           : m.status.includes("Optional")
     361 |             ? "⏸️"
     362 |             : m.status.includes("Research")
     363 |               ? "🔬"
```

---

#### 🟡 Line 362: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     359 |           ? "📋"
     360 |           : m.status.includes("Optional")
     361 |             ? "⏸️"
>>>  362 |             : m.status.includes("Research")
     363 |               ? "🔬"
     364 |               : "⏸️";
     365 |     const cleanStatus = m.status.replace(/✅|🔄|📋|⏸️|🔬/gu, "").trim();
```

---

#### 🔵 Line 365: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     362 |             : m.status.includes("Research")
     363 |               ? "🔬"
     364 |               : "⏸️";
>>>  365 |     const cleanStatus = m.status.replace(/✅|🔄|📋|⏸️|🔬/gu, "").trim();
     366 |     section += `| ${m.name} | ${statusIcon} ${cleanStatus} | ${m.progress}% |\n`;
     367 |   }
     368 |
```

---

#### 🔵 Line 491: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     488 |   console.log(`Found ${milestones.length} milestones:`);
     489 |   for (const m of milestones) {
     490 |     console.log(
>>>  491 |       `  - ${m.name}: ${m.progress}% (${m.status.replace(/✅|🔄|📋|⏸️|🔬/gu, "").trim()})`
     492 |     );
     493 |   }
     494 |
```

---

#### 🔵 Line 497: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     494 |
     495 |   // Step 4: Get overall progress
     496 |   let overallProgress = getOverallProgress(roadmapResult.content);
>>>  497 |   if (!overallProgress) {
     498 |     overallProgress = calculateOverallProgress(milestones);
     499 |     console.log(`\nCalculated overall progress: ${overallProgress}`);
     500 |   } else {
```

---

### 📁 `app/meetings/all/page.tsx` (23 issues)

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟠 Line N/A: Provide a compare function to avoid sorting elements alphabetically.

- **Rule**: `typescript:S2871`
- **Type**: BUG
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🔵 Line 19: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      16 | import type { QueryDocumentSnapshot } from "firebase/firestore";
      17 | import { toast } from "sonner";
      18 | import { logger } from "@/lib/logger";
>>>   19 | import { useAuth } from "@/components/providers/auth-provider";
      20 | import { useGeolocation } from "@/hooks/use-geolocation";
      21 | import { calculateDistance, formatDistance, sortByDistance } from "@/lib/utils/distance";
      22 | import dynamic from "next/dynamic";
```

---

#### 🔵 Line 42: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      39 | // Helper to parse time string like "6:00 PM" or "18:00" to minutes since midnight
      40 | function parseTime(timeStr: string): number {
      41 |   // Try 12-hour format first (e.g., "6:00 PM")
>>>   42 |   const match12h = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      43 |   if (match12h) {
      44 |     const [, hours, minutes, meridiem] = match12h;
      45 |     let h = parseInt(hours);
```

---

#### 🔵 Line 45: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      42 |   const match12h = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      43 |   if (match12h) {
      44 |     const [, hours, minutes, meridiem] = match12h;
>>>   45 |     let h = parseInt(hours);
      46 |     const m = parseInt(minutes);
      47 |     if (meridiem.toUpperCase() === "PM" && h !== 12) h += 12;
      48 |     if (meridiem.toUpperCase() === "AM" && h === 12) h = 0;
```

---

#### 🔵 Line 46: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      43 |   if (match12h) {
      44 |     const [, hours, minutes, meridiem] = match12h;
      45 |     let h = parseInt(hours);
>>>   46 |     const m = parseInt(minutes);
      47 |     if (meridiem.toUpperCase() === "PM" && h !== 12) h += 12;
      48 |     if (meridiem.toUpperCase() === "AM" && h === 12) h = 0;
      49 |     return h * 60 + m;
```

---

#### 🔵 Line 53: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      50 |   }
      51 |
      52 |   // Try 24-hour format (e.g., "18:00" or "6:00")
>>>   53 |   const match24h = timeStr.match(/(\d{1,2}):(\d{2})/);
      54 |   if (match24h) {
      55 |     const [, hours, minutes] = match24h;
      56 |     return parseInt(hours) * 60 + parseInt(minutes);
```

---

#### 🔵 Line 56: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      53 |   const match24h = timeStr.match(/(\d{1,2}):(\d{2})/);
      54 |   if (match24h) {
      55 |     const [, hours, minutes] = match24h;
>>>   56 |     return parseInt(hours) * 60 + parseInt(minutes);
      57 |   }
      58 |
      59 |   return 0;
```

---

#### 🔵 Line 56: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      53 |   const match24h = timeStr.match(/(\d{1,2}):(\d{2})/);
      54 |   if (match24h) {
      55 |     const [, hours, minutes] = match24h;
>>>   56 |     return parseInt(hours) * 60 + parseInt(minutes);
      57 |   }
      58 |
      59 |   return 0;
```

---

#### 🟠 Line 62: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```tsx
      59 |   return 0;
      60 | }
      61 |
>>>   62 | export default function AllMeetingsPage() {
      63 |   const router = useRouter();
      64 |   const [meetings, setMeetings] = useState<Meeting[]>([]);
      65 |   const [viewMode, setViewMode] = useState<"date" | "all">("date");
```

---

#### 🔵 Line 72: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      69 |   const [neighborhoodFilter, setNeighborhoodFilter] = useState("All");
      70 |   const [sortBy, setSortBy] = useState<SortOption>("time");
      71 |   const [loading, setLoading] = useState(true);
>>>   72 |   const { user: _user } = useAuth();
      73 |
      74 |   const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
      75 |   const [hasMore, setHasMore] = useState(false);
```

---

#### 🔵 Line 164: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `typescript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     161 |
     162 |   const availableNeighborhoods = useMemo(() => {
     163 |     const neighborhoods = new Set(
>>>  164 |       meetings.map((m) => m.neighborhood).filter((n): n is string => Boolean(n))
     165 |     );
     166 |     return Array.from(neighborhoods).sort((a, b) => a.localeCompare(b));
     167 |   }, [meetings]);
```

---

#### 🟡 Line 363: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     360 |             <Loader2 className="w-5 h-5 animate-spin" />
     361 |             <p>Loading meetings...</p>
     362 |           </div>
>>>  363 |         ) : filteredMeetings.length === 0 ? (
     364 |           <div className="p-8 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
     365 |             <p className="text-amber-900/60 mb-3">
     366 |               No {fellowshipFilter !== "All" ? fellowshipFilter : ""} meetings found.
```

---

#### 🔵 Line 366: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     363 |         ) : filteredMeetings.length === 0 ? (
     364 |           <div className="p-8 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
     365 |             <p className="text-amber-900/60 mb-3">
>>>  366 |               No {fellowshipFilter !== "All" ? fellowshipFilter : ""} meetings found.
     367 |             </p>
     368 |             <button
     369 |               onClick={() => {
```

---

#### 🟡 Line 378: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     375 |               Clear all filters
     376 |             </button>
     377 |           </div>
>>>  378 |         ) : displayMode === "map" ? (
     379 |           <div className="animate-in fade-in zoom-in-95 duration-300">
     380 |             <div className="mb-3 text-center">
     381 |               <span className="text-sm font-medium text-amber-900/70">
```

---

### 📁 `components/journal/entry-detail-dialog.tsx` (21 issues)

#### 🔵 Line N/A: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🟡 Line N/A: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 10: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       7 |   onClose: () => void;
       8 | }
       9 |
>>>   10 | export function EntryDetailDialog({ entry, onClose }: EntryDetailDialogProps) {
      11 |   if (!entry) return null;
      12 |
      13 |   return (
```

---

#### 🟡 Line 14: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      11 |   if (!entry) return null;
      12 |
      13 |   return (
>>>   14 |     <div
      15 |       className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      16 |       onClick={onClose}
      17 |     >
```

---

#### 🔵 Line 14: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      11 |   if (!entry) return null;
      12 |
      13 |   return (
>>>   14 |     <div
      15 |       className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      16 |       onClick={onClose}
      17 |     >
```

---

#### 🔵 Line 18: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      15 |       className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      16 |       onClick={onClose}
      17 |     >
>>>   18 |       <div
      19 |         className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
      20 |         onClick={(e) => e.stopPropagation()}
      21 |       >
```

---

#### 🟡 Line 18: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      15 |       className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      16 |       onClick={onClose}
      17 |     >
>>>   18 |       <div
      19 |         className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
      20 |         onClick={(e) => e.stopPropagation()}
      21 |       >
```

---

#### 🟡 Line 49: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      46 |               <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
      47 |               <ul className="list-disc pl-5">
      48 |                 {entry.data.items.map((item, i) => (
>>>   49 |                   <li key={i}>{item}</li>
      50 |                 ))}
      51 |               </ul>
      52 |             </div>
```

---

#### 🟡 Line 107: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     104 |                 </span>
     105 |                 <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
     106 |                   Cravings:{" "}
>>>  107 |                   {entry.data.cravings === null ? "n/a" : entry.data.cravings ? "yes" : "no"}
     108 |                 </span>
     109 |                 <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
     110 |                   Used: {entry.data.used === null ? "n/a" : entry.data.used ? "yes" : "no"}
```

---

#### 🟡 Line 110: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     107 |                   {entry.data.cravings === null ? "n/a" : entry.data.cravings ? "yes" : "no"}
     108 |                 </span>
     109 |                 <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
>>>  110 |                   Used: {entry.data.used === null ? "n/a" : entry.data.used ? "yes" : "no"}
     111 |                 </span>
     112 |               </div>
     113 |               {entry.data.note && (
```

---

#### 🔵 Line 286: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
     283 |
     284 |   const examples =
     285 |     Array.isArray(examplesRaw) && examplesRaw.every((item) => typeof item === "string")
>>>  286 |       ? (examplesRaw as string[])
     287 |       : [];
     288 |   const results =
     289 |     Array.isArray(resultsRaw) && resultsRaw.every((item) => typeof item === "string")
```

---

#### 🔵 Line 290: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
     287 |       : [];
     288 |   const results =
     289 |     Array.isArray(resultsRaw) && resultsRaw.every((item) => typeof item === "string")
>>>  290 |       ? (resultsRaw as string[])
     291 |       : [];
     292 |
     293 |   // Handle mismatched array lengths by using the longer one
```

---

#### 🟡 Line 315: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     312 |         }
     313 |
     314 |         return (
>>>  315 |           <div key={i} className="ml-2 mb-2 text-xs">
     316 |             {example?.trim() && (
     317 |               <p className="text-slate-600">
     318 |                 <span className="font-semibold">Example:</span> {example}
```

---

#### 🔵 Line 337: This assertion is unnecessary since it does not change the type of the expression.

- **Rule**: `typescript:S4325`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
     334 |   // Runtime type guard to validate data is an array of strings
     335 |   const raw = data[key];
     336 |   const values =
>>>  337 |     Array.isArray(raw) && raw.every((item) => typeof item === "string") ? (raw as string[]) : [];
     338 |
     339 |   const filledValues = values.filter((v) => v.trim());
     340 |   if (filledValues.length === 0) return null;
```

---

#### 🟡 Line 346: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     343 |     <div className="text-sm pl-3 border-l-2 border-slate-200">
     344 |       <p className="font-semibold text-slate-700 mb-1">{label}</p>
     345 |       {filledValues.map((value, i) => (
>>>  346 |         <p key={i} className="ml-2 text-slate-600 text-xs mb-1">
     347 |           • {value}
     348 |         </p>
     349 |       ))}
```

---

### 📁 `scripts/archive-doc.js` (21 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 36: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      33 |   readdirSync,
      34 |   statSync,
      35 |   realpathSync,
>>>   36 | } from "node:fs";
      37 | import { join, dirname, basename, relative } from "node:path";
      38 | import { fileURLToPath } from "node:url";
      39 | import matter from "gray-matter";
```

---

#### 🔵 Line 37: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      34 |   statSync,
      35 |   realpathSync,
      36 | } from "node:fs";
>>>   37 | import { join, dirname, basename, relative } from "node:path";
      38 | import { fileURLToPath } from "node:url";
      39 | import matter from "gray-matter";
      40 | import { sanitizeError } from "./lib/sanitize-error.js";
```

---

#### 🔵 Line 38: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      35 |   realpathSync,
      36 | } from "node:fs";
      37 | import { join, dirname, basename, relative } from "node:path";
>>>   38 | import { fileURLToPath } from "node:url";
      39 | import matter from "gray-matter";
      40 | import { sanitizeError } from "./lib/sanitize-error.js";
      41 |
```

---

#### 🟠 Line 321: Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 14min

```js
     318 |  * @param {string} newPath - New archive path (relative)
     319 |  * @returns {{success: boolean, updated: Array<{file: string, line: number}>, error?: string}}
     320 |  */
>>>  321 | function updateCrossReferences(oldPath, _newPath) {
     322 |   const updated = [];
     323 |   const oldFilename = basename(oldPath);
     324 |
```

---

#### 🔵 Line 339: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     336 |   // Match: [text](./FILENAME.md), [text](FILENAME.md), [text](./docs/FILENAME.md), etc.
     337 |   // Note: NO 'g' flag - using .test() in loop with 'g' flag causes bugs (stateful lastIndex)
     338 |   const patterns = [
>>>  339 |     new RegExp(`\\]\\(\\.?\\/?${escapeRegex(oldFilename)}\\)`),
     340 |     new RegExp(`\\]\\(\\.?\\/?(?:docs\\/)?${escapeRegex(oldFilename)}\\)`),
     341 |   ];
     342 |
```

---

#### 🔵 Line 340: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     337 |   // Note: NO 'g' flag - using .test() in loop with 'g' flag causes bugs (stateful lastIndex)
     338 |   const patterns = [
     339 |     new RegExp(`\\]\\(\\.?\\/?${escapeRegex(oldFilename)}\\)`),
>>>  340 |     new RegExp(`\\]\\(\\.?\\/?(?:docs\\/)?${escapeRegex(oldFilename)}\\)`),
     341 |   ];
     342 |
     343 |   for (const filePath of markdownFiles) {
```

---

#### 🔵 Line 368: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     365 |         if (pattern.test(line)) {
     366 |           // Calculate relative path from this file to archive (normalize for cross-platform)
     367 |           const fileDir = dirname(filePath);
>>>  368 |           const relativePath = relative(fileDir, join(ARCHIVE_DIR, oldFilename)).replace(
     369 |             /\\/g,
     370 |             "/"
     371 |           );
```

---

#### 🔵 Line 374: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     371 |           );
     372 |
     373 |           // Replace the link (relativePath already has correct structure)
>>>  374 |           const newLine = line.replace(
     375 |             new RegExp(`\\]\\(\\.?\\/?(?:docs\\/)?${escapeRegex(oldFilename)}\\)`, "g"),
     376 |             `](${relativePath})`
     377 |           );
```

---

#### 🔵 Line 375: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     372 |
     373 |           // Replace the link (relativePath already has correct structure)
     374 |           const newLine = line.replace(
>>>  375 |             new RegExp(`\\]\\(\\.?\\/?(?:docs\\/)?${escapeRegex(oldFilename)}\\)`, "g"),
     376 |             `](${relativePath})`
     377 |           );
     378 |
```

---

#### 🔵 Line 409: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     406 |  * @returns {string} - Escaped string
     407 |  */
     408 | function escapeRegex(str) {
>>>  409 |   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
     410 | }
     411 |
     412 | /**
```

---

#### 🔵 Line 409: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     406 |  * @returns {string} - Escaped string
     407 |  */
     408 | function escapeRegex(str) {
>>>  409 |   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
     410 | }
     411 |
     412 | /**
```

---

#### 🟠 Line 473: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```js
     470 | /**
     471 |  * Main function
     472 |  */
>>>  473 | function main() {
     474 |   console.log("📦 Document Archive Tool");
     475 |   if (DRY_RUN) console.log("   (DRY RUN - no files will be modified)\n");
     476 |   else console.log("");
```

---

#### 🔵 Line 572: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     569 |   console.log(`✅ Created archived version: ${archivePath}`);
     570 |
     571 |   // Step 5: Remove original (unless dry run)
>>>  572 |   if (!DRY_RUN) {
     573 |     try {
     574 |       unlinkSync(sourcePath);
     575 |       console.log(`✅ Removed original: ${sourcePath}`);
```

---

### 📁 `scripts/surface-lessons-learned.js` (19 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Replace this alternation with a character class.

- **Rule**: `javascript:S6035`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 18: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      15 |  *   1 = Error (file not found, etc.)
      16 |  */
      17 |
>>>   18 | import * as fs from "node:fs";
      19 | import * as path from "node:path";
      20 | import { execSync } from "node:child_process";
      21 | import { pathToFileURL } from "node:url";
```

---

#### 🔵 Line 19: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      16 |  */
      17 |
      18 | import * as fs from "node:fs";
>>>   19 | import * as path from "node:path";
      20 | import { execSync } from "node:child_process";
      21 | import { pathToFileURL } from "node:url";
      22 |
```

---

#### 🔵 Line 20: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      17 |
      18 | import * as fs from "node:fs";
      19 | import * as path from "node:path";
>>>   20 | import { execSync } from "node:child_process";
      21 | import { pathToFileURL } from "node:url";
      22 |
      23 | const LEARNINGS_FILE = "docs/AI_REVIEW_LEARNINGS_LOG.md";
```

---

#### 🔵 Line 21: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      18 | import * as fs from "node:fs";
      19 | import * as path from "node:path";
      20 | import { execSync } from "node:child_process";
>>>   21 | import { pathToFileURL } from "node:url";
      22 |
      23 | const LEARNINGS_FILE = "docs/AI_REVIEW_LEARNINGS_LOG.md";
      24 |
```

---

#### 🟠 Line 80: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```js
      77 |  * Auto-detect topics from git changes
      78 |  * Cross-platform compatible (no shell-specific syntax)
      79 |  */
>>>   80 | function detectTopicsFromGitChanges() {
      81 |   try {
      82 |     // Get recently modified files - try HEAD~5 first, fall back to HEAD
      83 |     let changedFilesOutput = "";
```

---

#### 🟡 Line 170: Replace this alternation with a character class.

- **Rule**: `javascript:S6035`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     167 |     const takeawayPatterns = [
     168 |       /\*\*(?:Key )?(?:Takeaway|Lesson|Pattern|Fix)\*\*:?\s*([^\n]+)/gi,
     169 |       /- \*\*([^*]+)\*\*:?\s*([^\n]+)/gi,
>>>  170 |       /(?:✅|❌)\s*([^\n]+)/g,
     171 |     ];
     172 |
     173 |     const takeaways = [];
```

---

#### 🔵 Line 264: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     261 |   const sanitizeForTerminal = (s) =>
     262 |     String(s ?? "")
     263 |       // eslint-disable-next-line no-control-regex -- intentional: strip control chars, preserve safe whitespace
>>>  264 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
     265 |
     266 |   let output = "";
     267 |
```

---

#### 🟡 Line 376: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     373 | }
     374 |
     375 | if (isMainModule) {
>>>  376 |   main().catch((err) => {
     377 |     // Avoid exposing sensitive paths in error messages
     378 |     // Use .split('\n')[0] to ensure only first line (no stack trace in String(err))
     379 |     // Strip control chars (ANSI escapes) to prevent log/terminal injection in CI
```

---

#### 🔵 Line 384: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     381 |       .split("\n")[0]
     382 |       .replace(/\r$/, "") // Strip trailing CR from Windows CRLF line endings
     383 |       // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
>>>  384 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
     385 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
     386 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     387 |       // Handle any Windows drive letter, case-insensitive
```

---

#### 🔵 Line 385: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     382 |       .replace(/\r$/, "") // Strip trailing CR from Windows CRLF line endings
     383 |       // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     384 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
>>>  385 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
     386 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     387 |       // Handle any Windows drive letter, case-insensitive
     388 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
```

---

#### 🔵 Line 386: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     383 |       // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
     384 |       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
     385 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
>>>  386 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     387 |       // Handle any Windows drive letter, case-insensitive
     388 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
     389 |     console.error("Script error:", safeMessage);
```

---

#### 🔵 Line 388: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     385 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
     386 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
     387 |       // Handle any Windows drive letter, case-insensitive
>>>  388 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
     389 |     console.error("Script error:", safeMessage);
     390 |     process.exit(1);
     391 |   });
```

---

### 📁 `scripts/aggregate-audit-findings.js` (18 issues)

#### 🔵 Line 21: Remove this unused import of 'readdirSync'.

- **Rule**: `javascript:S1128`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```js
      18 |  * - IMPLEMENTATION_PLAN.md
      19 |  */
      20 |
>>>   21 | import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
      22 | import { join, resolve, dirname } from "node:path";
      23 | import { fileURLToPath } from "node:url";
      24 |
```

---

#### 🔵 Line 137: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     134 |  */
     135 | function safeCell(value) {
     136 |   if (value === undefined || value === null) return "";
>>>  137 |   return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, "");
     138 | }
     139 |
     140 | /**
```

---

#### 🔵 Line 137: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     134 |  */
     135 | function safeCell(value) {
     136 |   if (value === undefined || value === null) return "";
>>>  137 |   return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, "");
     138 | }
     139 |
     140 | /**
```

---

#### 🔵 Line 137: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     134 |  */
     135 | function safeCell(value) {
     136 |   if (value === undefined || value === null) return "";
>>>  137 |   return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, "");
     138 | }
     139 |
     140 | /**
```

---

#### 🔵 Line 137: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     134 |  */
     135 | function safeCell(value) {
     136 |   if (value === undefined || value === null) return "";
>>>  137 |   return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, "");
     138 | }
     139 |
     140 | /**
```

---

#### 🟠 Line 180: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     177 | /**
     178 |  * Parse markdown backlog to extract items with robust error handling (Qodo Review #175)
     179 |  */
>>>  180 | function parseMarkdownBacklog(filePath) {
     181 |   if (!existsSync(filePath)) {
     182 |     console.warn(`Warning: File not found: ${filePath}`);
     183 |     return [];
```

---

#### 🔵 Line 231: Prefer negative index over length minus index for `slice`.

- **Rule**: `javascript:S7771`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     228 |       const deps = parts[parts.length - 3];
     229 |       const pr = parts[parts.length - 2];
     230 |       // Title may contain pipe chars - join middle parts
>>>  231 |       const title = parts
     232 |         .slice(2, parts.length - 4)
     233 |         .join(" | ")
     234 |         .trim();
```

---

#### 🟡 Line 313: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     310 |  */
     311 | function normalizeConfidence(value) {
     312 |   if (value === undefined || value === null) return undefined;
>>>  313 |   if (typeof value === "number") return value >= 0.9 ? "high" : value >= 0.7 ? "medium" : "low";
     314 |   return String(value).toLowerCase();
     315 | }
     316 |
```

---

#### 🟠 Line 322: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     319 |  * ID prefix takes precedence for category (SEC-* → security, PERF-* → performance, etc.)
     320 |  * Fixes category mismatch like SEC-010 with category "Framework" → should be "security" (Qodo Review #175)
     321 |  */
>>>  322 | function normalizeSingleSession(item, sourceCategory, date) {
     323 |   // ID prefix mapping takes precedence over item.category (e.g., SEC-010 with "Framework" category → security)
     324 |   // EFFP-* maps to "engineering-productivity" not "dx" for consistency with source (Qodo Review #176)
     325 |   const idPrefixCategory = item.id?.startsWith("SEC-")
```

---

#### 🟡 Line 327: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     324 |   // EFFP-* maps to "engineering-productivity" not "dx" for consistency with source (Qodo Review #176)
     325 |   const idPrefixCategory = item.id?.startsWith("SEC-")
     326 |     ? "security"
>>>  327 |     : item.id?.startsWith("PERF-")
     328 |       ? "performance"
     329 |       : item.id?.startsWith("CODE-")
     330 |         ? "code"
```

---

#### 🟡 Line 329: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     326 |     ? "security"
     327 |     : item.id?.startsWith("PERF-")
     328 |       ? "performance"
>>>  329 |       : item.id?.startsWith("CODE-")
     330 |         ? "code"
     331 |         : item.id?.startsWith("PROC-")
     332 |           ? "process"
```

---

#### 🟡 Line 331: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     328 |       ? "performance"
     329 |       : item.id?.startsWith("CODE-")
     330 |         ? "code"
>>>  331 |         : item.id?.startsWith("PROC-")
     332 |           ? "process"
     333 |           : item.id?.startsWith("REF-")
     334 |             ? "refactoring"
```

---

#### 🟡 Line 333: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     330 |         ? "code"
     331 |         : item.id?.startsWith("PROC-")
     332 |           ? "process"
>>>  333 |           : item.id?.startsWith("REF-")
     334 |             ? "refactoring"
     335 |             : item.id?.startsWith("DOC-")
     336 |               ? "documentation"
```

---

#### 🟡 Line 335: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     332 |           ? "process"
     333 |           : item.id?.startsWith("REF-")
     334 |             ? "refactoring"
>>>  335 |             : item.id?.startsWith("DOC-")
     336 |               ? "documentation"
     337 |               : item.id?.startsWith("EFFP-")
     338 |                 ? "engineering-productivity"
```

---

#### 🟡 Line 337: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     334 |             ? "refactoring"
     335 |             : item.id?.startsWith("DOC-")
     336 |               ? "documentation"
>>>  337 |               : item.id?.startsWith("EFFP-")
     338 |                 ? "engineering-productivity"
     339 |                 : null;
     340 |   const normalizedCategory =
```

---

#### 🔵 Line 588: Unnecessary use of conditional expression for default assignment.

- **Rule**: `javascript:S6644`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     585 | function normalizeRoi(value) {
     586 |   if (value === undefined || value === null) return undefined;
     587 |   const normalized = String(value).trim().toUpperCase();
>>>  588 |   return normalized ? normalized : undefined;
     589 | }
     590 |
     591 | /**
```

---

#### 🟠 Line 677: Refactor this function to reduce its Cognitive Complexity from 87 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 1h17min

```js
     674 |  * - Pre-buckets by file/category to reduce comparisons
     675 |  * - Uses ID index for O(1) DEDUP->CANON dependency lookup
     676 |  */
>>>  677 | function deduplicateFindings(allFindings) {
     678 |   const dedupLog = [];
     679 |   let current = [...allFindings];
     680 |   let didMerge = true;
```

---

#### 🟡 Line 697: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     694 |     for (let i = 0; i < current.length; i++) {
     695 |       const f = current[i];
     696 |       // Index by all files (including merged files array)
>>>  697 |       const files = f.files?.length ? f.files : f.file ? [f.file] : [];
     698 |       for (const file of files) {
     699 |         if (!file) continue;
     700 |         if (!fileIndex.has(file)) fileIndex.set(file, []);
```

---

### 📁 `components/growth/Step1WorksheetCard.tsx` (18 issues)

#### 🟡 Line N/A: Use <output> instead of the "status" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Use <output> instead of the "status" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Use <output> instead of the "status" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line 14: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      11 |   DialogTrigger,
      12 | } from "@/components/ui/dialog";
      13 | import { Button } from "@/components/ui/button";
>>>   14 | import { useAuth } from "@/components/providers/auth-provider";
      15 | import { FirestoreService } from "@/lib/firestore-service";
      16 | import { toast } from "sonner";
      17 | import { Textarea } from "@/components/ui/textarea";
```

---

#### 🔵 Line 121: Use `new Array()` instead of `Array()`.

- **Rule**: `typescript:S7723`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     118 |   conclusion_q1: ["", "", ""],
     119 |   conclusion_q2: "",
     120 |   conclusion_q3: "",
>>>  121 |   conclusion_q4: Array(15).fill(""),
     122 | };
     123 |
     124 | const FORM_SECTIONS: SectionConfig[] = [
```

---

#### 🟡 Line 376: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     373 |         </label>
     374 |         {description && <p className="text-xs text-amber-900/60">{description}</p>}
     375 |         {examples.map((_, i) => (
>>>  376 |           <div key={i} className="grid grid-cols-2 gap-3">
     377 |             <Textarea
     378 |               id={`${id}_example_${i}`}
     379 |               aria-labelledby={id}
```

---

#### 🔵 Line 380: Prefer `String.fromCodePoint()` over `String.fromCharCode()`.

- **Rule**: `typescript:S7758`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     377 |             <Textarea
     378 |               id={`${id}_example_${i}`}
     379 |               aria-labelledby={id}
>>>  380 |               placeholder={`Example ${String.fromCharCode(97 + i)}`}
     381 |               value={examples[i]}
     382 |               onChange={(e) => onUpdateArray(examplesField, i, e.target.value)}
     383 |               className="min-h-[60px]"
```

---

#### 🟡 Line 410: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     407 |         {description && <p className="text-xs text-amber-900/60">{description}</p>}
     408 |         {values.map((value, i) => (
     409 |           <Textarea
>>>  410 |             key={i}
     411 |             id={`${id}_${i}`}
     412 |             aria-labelledby={id}
     413 |             placeholder={`Response ${String.fromCharCode(97 + i)}`}
```

---

#### 🔵 Line 413: Prefer `String.fromCodePoint()` over `String.fromCharCode()`.

- **Rule**: `typescript:S7758`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     410 |             key={i}
     411 |             id={`${id}_${i}`}
     412 |             aria-labelledby={id}
>>>  413 |             placeholder={`Response ${String.fromCharCode(97 + i)}`}
     414 |             value={value}
     415 |             onChange={(e) => onUpdateArray(singleField, i, e.target.value)}
     416 |             className="min-h-[60px]"
```

---

#### 🟡 Line 452: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     449 |         </label>
     450 |         {description && <p className="text-xs text-amber-900/60">{description}</p>}
     451 |         {Array.from({ length: count }).map((_, i) => (
>>>  452 |           <div key={i} className="flex gap-2">
     453 |             <span className="text-sm text-amber-900/60 mt-2">{i + 1}.</span>
     454 |             <Textarea
     455 |               id={`${id}_${i}`}
```

---

#### 🔵 Line 491: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
     488 |   const [isSaving, setIsSaving] = useState(false);
     489 |   const [isLoading, setIsLoading] = useState(false);
     490 |   const [lastSavedData, setLastSavedData] = useState<Step1Data>(initialData);
>>>  491 |   const { user } = useAuth();
     492 |   const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
     493 |   const isOpenRef = useRef(false);
     494 |
```

---

#### 🟡 Line 638: 'If' statement should not be the only statement in 'else' block

- **Rule**: `typescript:S6660`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     635 |       loadSavedData();
     636 |     } else {
     637 |       // Clear timeout when closing
>>>  638 |       if (saveTimeoutRef.current) {
     639 |         clearTimeout(saveTimeoutRef.current);
     640 |       }
     641 |     }
```

---

#### 🔵 Line 697: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     694 |     const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(lastSavedData);
     695 |
     696 |     if (hasUnsavedChanges && hasContent) {
>>>  697 |       const confirmed = window.confirm(
     698 |         "You have unsaved changes. Your work has been auto-saved as a draft, but it won't appear in your journal until you manually save. Exit anyway?"
     699 |       );
     700 |       if (!confirmed) return;
```

---

#### 🔵 Line 709: A fragment with only one child is redundant.

- **Rule**: `typescript:S6749`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     706 |   const currentSection = FORM_SECTIONS[section - 1];
     707 |
     708 |   return (
>>>  709 |     <>
     710 |       <Dialog open={isOpen} onOpenChange={handleOpenChange}>
     711 |         <DialogTrigger asChild>
     712 |           <motion.button
```

---

#### 🟡 Line 742: Use <output> instead of the "status" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     739 |                 </p>
     740 |               </div>
     741 |               {isLoading && (
>>>  742 |                 <div
     743 |                   className="text-xs text-blue-600 flex items-center gap-2"
     744 |                   role="status"
     745 |                   aria-live="polite"
```

---

#### 🟡 Line 752: Use <output> instead of the "status" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     749 |                 </div>
     750 |               )}
     751 |               {!isLoading && isSaving && (
>>>  752 |                 <div
     753 |                   className="text-xs text-green-600 flex items-center gap-2"
     754 |                   role="status"
     755 |                   aria-live="polite"
```

---

#### 🟡 Line 763: Use <output> instead of the "status" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     760 |                 </div>
     761 |               )}
     762 |               {!isLoading && !isSaving && hasContent && (
>>>  763 |                 <div
     764 |                   className="text-xs text-green-600/60 flex items-center gap-2"
     765 |                   role="status"
     766 |                   aria-live="polite"
```

---

### 📁 `scripts/assign-review-tier.js` (16 issues)

#### 🔵 Line N/A: `knownFlags` should be a `Set`, and use `knownFlags.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Remove this unused import of 'join'.

- **Rule**: `javascript:S1128`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 20: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      17 |  *   Exit code: 0 (success)
      18 |  */
      19 |
>>>   20 | import { readFileSync, existsSync, realpathSync } from "node:fs";
      21 | import { resolve, relative, isAbsolute } from "node:path";
      22 | import { pathToFileURL } from "node:url";
      23 |
```

---

#### 🔵 Line 21: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      18 |  */
      19 |
      20 | import { readFileSync, existsSync, realpathSync } from "node:fs";
>>>   21 | import { resolve, relative, isAbsolute } from "node:path";
      22 | import { pathToFileURL } from "node:url";
      23 |
      24 | /**
```

---

#### 🔵 Line 22: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      19 |
      20 | import { readFileSync, existsSync, realpathSync } from "node:fs";
      21 | import { resolve, relative, isAbsolute } from "node:path";
>>>   22 | import { pathToFileURL } from "node:url";
      23 |
      24 | /**
      25 |  * Sanitize file paths in error messages to avoid exposing absolute paths
```

---

#### 🔵 Line 30: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      27 | function sanitizePath(filePath) {
      28 |   return (
      29 |     String(filePath)
>>>   30 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
      31 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      32 |       // Handle any Windows drive letter, case-insensitive
      33 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
```

---

#### 🔵 Line 31: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      28 |   return (
      29 |     String(filePath)
      30 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
>>>   31 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      32 |       // Handle any Windows drive letter, case-insensitive
      33 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
      34 |   );
```

---

#### 🔵 Line 33: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      30 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
      31 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      32 |       // Handle any Windows drive letter, case-insensitive
>>>   33 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
      34 |   );
      35 | }
      36 |
```

---

#### 🔵 Line 41: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      38 |  * Normalize path separators for cross-platform regex matching
      39 |  */
      40 | function normalizePath(filePath) {
>>>   41 |   return String(filePath).replace(/\\/g, "/");
      42 | }
      43 |
      44 | // Tier classification rules
```

---

#### 🟠 Line 178: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     175 |  * @param {string} filePath - The file path to classify
     176 |  * @param {string[]} allFiles - All changed files (for conditional checks)
     177 |  */
>>>  178 | function assignTierByPath(filePath, allFiles = []) {
     179 |   // Normalize path for cross-platform regex matching
     180 |   const normalizedPath = normalizePath(filePath);
     181 |
```

---

#### 🟠 Line 354: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     351 | /**
     352 |  * Main tier assignment logic
     353 |  */
>>>  354 | function assignReviewTier(files, options = {}) {
     355 |   const projectRoot = options.projectRoot || process.cwd();
     356 |   let highestTier = 0;
     357 |   let reasons = [];
```

---

#### 🔵 Line 444: `knownFlags` should be a `Set`, and use `knownFlags.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     441 |   }
     442 |
     443 |   // Check for unknown flags (reject early rather than silently ignoring)
>>>  444 |   const knownFlags = ["--pr"];
     445 |   for (const arg of args) {
     446 |     if (arg.startsWith("--") && !knownFlags.includes(arg.split("=")[0])) {
     447 |       console.error(`Error: Unknown flag "${arg}"`);
```

---

#### 🟡 Line 458: Remove this assignment of "i".

- **Rule**: `javascript:S2310`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     455 |   const files = [];
     456 |   for (let i = 0; i < args.length; i++) {
     457 |     if (args[i] === "--pr") {
>>>  458 |       i++; // Skip the value too
     459 |     } else if (!args[i].startsWith("--")) {
     460 |       files.push(args[i]);
     461 |     }
```

---

### 📁 `components/admin/errors-tab.tsx` (15 issues)

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 93: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      90 |   knowledge: ErrorKnowledge;
      91 | }
      92 |
>>>   93 | function ErrorRow({ issue, isExpanded, onToggle, knowledge }: ErrorRowProps) {
      94 |   const sanitizedTitle = redactSensitive(issue.title);
      95 |
      96 |   // Calculate dates once at component start (performance optimization)
```

---

#### 🟡 Line 198: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     195 |                   <h4 className="text-sm font-semibold text-amber-900 mb-2">Possible causes</h4>
     196 |                   <ul className="list-disc list-inside space-y-1">
     197 |                     {knowledge.possibleCauses.map((cause, idx) => (
>>>  198 |                       <li key={idx} className="text-sm text-amber-700">
     199 |                         {cause}
     200 |                       </li>
     201 |                     ))}
```

---

#### 🟡 Line 215: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     212 |                   </h4>
     213 |                   <ol className="list-decimal list-inside space-y-1">
     214 |                     {knowledge.remediations.map((step, idx) => (
>>>  215 |                       <li key={idx} className="text-sm text-amber-700">
     216 |                         {step}
     217 |                       </li>
     218 |                     ))}
```

---

#### 🔵 Line 290: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     287 |       }
     288 |     };
     289 |
>>>  290 |     window.addEventListener("keydown", handleKeyDown);
     291 |     return () => window.removeEventListener("keydown", handleKeyDown);
     292 |   }, [showExportDropdown]);
     293 |
```

---

#### 🔵 Line 291: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     288 |     };
     289 |
     290 |     window.addEventListener("keydown", handleKeyDown);
>>>  291 |     return () => window.removeEventListener("keydown", handleKeyDown);
     292 |   }, [showExportDropdown]);
     293 |
     294 |   const trendDirection = useMemo(() => {
```

---

#### 🟡 Line 450: Use <img alt=...> instead of the "presentation" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     447 |             {showExportDropdown && (
     448 |               <>
     449 |                 {/* Backdrop to close dropdown - click or Escape to close */}
>>>  450 |                 <div
     451 |                   className="fixed inset-0 z-10"
     452 |                   onClick={() => setShowExportDropdown(false)}
     453 |                   onKeyDown={(e) => e.key === "Escape" && setShowExportDropdown(false)}
```

---

#### 🟡 Line 458: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     455 |                 />
     456 |                 <div className="absolute right-0 mt-2 w-64 rounded-md border border-amber-200 bg-white shadow-lg z-20">
     457 |                   <div className="p-3 border-b border-amber-100">
>>>  458 |                     <label className="block text-xs font-medium text-amber-700 mb-1.5">
     459 |                       Timeframe
     460 |                     </label>
     461 |                     <select
```

---

#### 🟡 Line 532: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     529 |         <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
     530 |           Loading error summary...
     531 |         </div>
>>>  532 |       ) : summary ? (
     533 |         <>
     534 |           <div className="grid gap-4 md:grid-cols-4">
     535 |             <div className="rounded-lg border border-amber-100 bg-white p-4">
```

---

### 📁 `scripts/check-document-sync.js` (15 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 19: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      16 |  * Exit codes: 0 = all synced, 1 = sync issues found, 2 = error
      17 |  */
      18 |
>>>   19 | import { readFileSync, existsSync, realpathSync } from "node:fs";
      20 | import { join, dirname, relative } from "node:path";
      21 | import { fileURLToPath } from "node:url";
      22 |
```

---

#### 🔵 Line 20: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      17 |  */
      18 |
      19 | import { readFileSync, existsSync, realpathSync } from "node:fs";
>>>   20 | import { join, dirname, relative } from "node:path";
      21 | import { fileURLToPath } from "node:url";
      22 |
      23 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🔵 Line 21: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      18 |
      19 | import { readFileSync, existsSync, realpathSync } from "node:fs";
      20 | import { join, dirname, relative } from "node:path";
>>>   21 | import { fileURLToPath } from "node:url";
      22 |
      23 | const __filename = fileURLToPath(import.meta.url);
      24 | const __dirname = dirname(__filename);
```

---

#### 🔵 Line 28: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      25 | const ROOT = join(__dirname, "..");
      26 |
      27 | // Parse command line arguments
>>>   28 | const args = process.argv.slice(2);
      29 | const VERBOSE = args.includes("--verbose");
      30 | const JSON_OUTPUT = args.includes("--json");
      31 | const FIX = args.includes("--fix");
```

---

#### 🔵 Line 95: Handle this exception or don't catch it at all.

- **Rule**: `javascript:S2486`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1h

```js
      92 |         console.error(`⚠️  Skipping path outside repository: ${constructedPath}`);
      93 |         continue;
      94 |       }
>>>   95 |     } catch (error) {
      96 |       // File doesn't exist yet - validate constructed path manually
      97 |       const normalizedRoot = realpathSync(ROOT);
      98 |       const normalizedPath = join(normalizedRoot, location.trim(), instance.trim());
```

---

#### ⚪ Line 139: Complete the task associated to this "TODO" comment.

- **Rule**: `javascript:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

```js
     136 |   // Pattern 2: [X] - placeholder values
     137 |   const valuePlaceholder = /\[X\]/g;
     138 |   // Pattern 3: [Project Name] - generic placeholders (bounded to prevent ReDoS)
>>>  139 |   // Note: [TODO] matches exact placeholder, NOT checklist items like "[ ] TODO: fix"
     140 |   const genericPlaceholder = /\[(Project Name|GITHUB_REPO_URL|Repository|Framework|TODO)\]/gi;
     141 |
     142 |   lines.forEach((line, idx) => {
```

---

#### 🟠 Line 200: Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 9min

```js
     197 |   // Get normalized root for path traversal validation
     198 |   const normalizedRoot = realpathSync(ROOT);
     199 |
>>>  200 |   lines.forEach((line, idx) => {
     201 |     const lineNum = idx + 1;
     202 |
     203 |     // Reset regex lastIndex to prevent state leak
```

---

#### 🔵 Line 241: Handle this exception or don't catch it at all.

- **Rule**: `javascript:S2486`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1h

```js
     238 |           }
     239 |           continue;
     240 |         }
>>>  241 |       } catch (error) {
     242 |         // File doesn't exist - validate constructed path manually
     243 |         const rel = relative(normalizedRoot, targetPath);
     244 |
```

---

#### 🔵 Line 289: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     286 |   }
     287 |
     288 |   const [, year, month, day] = match;
>>>  289 |   const lastSynced = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     290 |   const now = new Date();
     291 |   const daysDiff = Math.floor((now - lastSynced) / (1000 * 60 * 60 * 24));
     292 |
```

---

#### 🔵 Line 289: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     286 |   }
     287 |
     288 |   const [, year, month, day] = match;
>>>  289 |   const lastSynced = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     290 |   const now = new Date();
     291 |   const daysDiff = Math.floor((now - lastSynced) / (1000 * 60 * 60 * 24));
     292 |
```

---

#### 🔵 Line 289: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     286 |   }
     287 |
     288 |   const [, year, month, day] = match;
>>>  289 |   const lastSynced = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     290 |   const now = new Date();
     291 |   const daysDiff = Math.floor((now - lastSynced) / (1000 * 60 * 60 * 24));
     292 |
```

---

#### 🟠 Line 304: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     301 | /**
     302 |  * Main validation logic
     303 |  */
>>>  304 | function validateDocumentSync() {
     305 |   const pairs = parseDocumentDependencies();
     306 |
     307 |   if (pairs.length === 0) {
```

---

#### 🟠 Line 382: Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 18min

```js
     379 | /**
     380 |  * Output formatting
     381 |  */
>>>  382 | function formatOutput(results) {
     383 |   if (JSON_OUTPUT) {
     384 |     console.log(JSON.stringify(results, null, 2));
     385 |     return;
```

---

#### 🟡 Line 408: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     405 |     console.log(`   Last Synced: ${pair.lastSynced}\n`);
     406 |
     407 |     for (const issue of pair.issues) {
>>>  408 |       const icon = issue.severity === "CRITICAL" ? "❌" : issue.severity === "MAJOR" ? "⚠️" : "ℹ️";
     409 |
     410 |       if (issue.type === "placeholders") {
     411 |         console.log(`   ${icon} PLACEHOLDERS: ${issue.count} placeholder(s) need replacement`);
```

---

### 📁 `scripts/enrich-addresses.ts` (15 issues)

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
>>>    3 | import * as fs from "node:fs";
       4 | import * as path from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error";
       6 |
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
       3 | import * as fs from "node:fs";
>>>    4 | import * as path from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error";
       6 |
       7 | // --- CONFIGURATION ---
```

---

#### 🟠 Line 15: Refactor this function to reduce its Cognitive Complexity from 36 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 26min

```ts
      12 |
      13 | const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      14 |
>>>   15 | async function enrichAddresses() {
      16 |   console.log("🚀 Starting Address Enrichment (OSM/Nominatim)...\n");
      17 |
      18 |   // 1. Initialize Firebase Admin
```

---

#### 🔵 Line 91: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      88 |     }
      89 |
      90 |     return addr
>>>   91 |       .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "") // Remove unit info
      92 |       .replace(/[,.]/g, "") // Remove commas/dots
      93 |       .replace(/\s+/g, " ")
      94 |       .trim();
```

---

#### 🔵 Line 92: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      89 |
      90 |     return addr
      91 |       .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "") // Remove unit info
>>>   92 |       .replace(/[,.]/g, "") // Remove commas/dots
      93 |       .replace(/\s+/g, " ")
      94 |       .trim();
      95 |   };
```

---

#### 🔵 Line 93: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      90 |     return addr
      91 |       .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "") // Remove unit info
      92 |       .replace(/[,.]/g, "") // Remove commas/dots
>>>   93 |       .replace(/\s+/g, " ")
      94 |       .trim();
      95 |   };
      96 |
```

---

#### 🔵 Line 128: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     125 |     queries.push(`${streetClean}, ${currentCity}, TN, USA`);
     126 |
     127 |     // 3. Fallback: "123 Main St, TN" (Let OSM find better city)
>>>  128 |     queries.push(`${streetClean}, TN, USA`);
     129 |
     130 |     let found = false;
     131 |
```

---

#### 🔵 Line 163: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     160 |           // OSM returns variable admin levels
     161 |           const newCity =
     162 |             addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || currentCity;
>>>  163 |           const lat = parseFloat(result.lat);
     164 |           const lon = parseFloat(result.lon);
     165 |
     166 |           if (newZip) {
```

---

#### 🔵 Line 164: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     161 |           const newCity =
     162 |             addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || currentCity;
     163 |           const lat = parseFloat(result.lat);
>>>  164 |           const lon = parseFloat(result.lon);
     165 |
     166 |           if (newZip) {
     167 |             // Update Firestore
```

---

#### 🟡 Line 215: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     212 |   console.log("============================================================\n");
     213 | }
     214 |
>>>  215 | enrichAddresses().catch((error: unknown) => {
     216 |   console.error("❌ Unexpected error:", sanitizeError(error));
     217 |   process.exit(1);
     218 | });
```

---

### 📁 `scripts/retry-failures.ts` (15 issues)

#### 🔵 Line N/A: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
>>>    3 | import { execSync } from "node:child_process";
       4 | import * as fs from "node:fs";
       5 | import * as path from "node:path";
       6 | import { sanitizeError } from "./lib/sanitize-error";
```

---

#### 🔵 Line 4: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
       3 | import { execSync } from "node:child_process";
>>>    4 | import * as fs from "node:fs";
       5 | import * as path from "node:path";
       6 | import { sanitizeError } from "./lib/sanitize-error";
       7 |
```

---

#### 🔵 Line 5: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       2 | import { getFirestore } from "firebase-admin/firestore";
       3 | import { execSync } from "node:child_process";
       4 | import * as fs from "node:fs";
>>>    5 | import * as path from "node:path";
       6 | import { sanitizeError } from "./lib/sanitize-error";
       7 |
       8 | // Nominatim Config
```

---

#### 🟠 Line 12: Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 17min

```ts
       9 | const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
      10 | const USER_AGENT = "SonashApp_Migration/1.0 (jason@example.com)"; // Replace with real email if possible
      11 |
>>>   12 | async function retryFailures() {
      13 |   console.log("🚀 Starting Retry for Failed Addresses...\n");
      14 |
      15 |   // 1. Initialize Firebase
```

---

#### 🔵 Line 57: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      54 |       addr = addr.substring(firstDigitIndex);
      55 |     }
      56 |     return addr
>>>   57 |       .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "")
      58 |       .replace(/[,.]/g, "")
      59 |       .replace(/\s+/g, " ")
      60 |       .trim();
```

---

#### 🔵 Line 58: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      55 |     }
      56 |     return addr
      57 |       .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "")
>>>   58 |       .replace(/[,.]/g, "")
      59 |       .replace(/\s+/g, " ")
      60 |       .trim();
      61 |   };
```

---

#### 🔵 Line 59: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      56 |     return addr
      57 |       .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "")
      58 |       .replace(/[,.]/g, "")
>>>   59 |       .replace(/\s+/g, " ")
      60 |       .trim();
      61 |   };
      62 |
```

---

#### 🔵 Line 98: Do not call `Array#push()` multiple times.

- **Rule**: `typescript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      95 |       queries.push(`${streetClean}, ${neighborhood}, TN, USA`);
      96 |     }
      97 |     queries.push(`${streetClean}, ${currentCity}, TN, USA`);
>>>   98 |     queries.push(`${streetClean}, TN, USA`);
      99 |
     100 |     let found = false;
     101 |
```

---

#### 🔵 Line 135: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     132 |           // (The previous script might have relied on implicit structure or just coordinates)
     133 |           // If we just want coordinates, result.lat/lon is enough.
     134 |
>>>  135 |           const lat = parseFloat(result.lat);
     136 |           const lon = parseFloat(result.lon);
     137 |
     138 |           await docRef.update({
```

---

#### 🔵 Line 136: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     133 |           // If we just want coordinates, result.lat/lon is enough.
     134 |
     135 |           const lat = parseFloat(result.lat);
>>>  136 |           const lon = parseFloat(result.lon);
     137 |
     138 |           await docRef.update({
     139 |             coordinates: { lat, lng: lon },
```

---

#### 🟡 Line 169: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     166 |   console.log("============================================================\n");
     167 | }
     168 |
>>>  169 | retryFailures().catch((error: unknown) => {
     170 |   console.error("❌ Unexpected error:", sanitizeError(error));
     171 |   process.exit(1);
     172 | });
```

---

### 📁 `scripts/normalize-canon-ids.js` (14 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `.find(…)` over `.filter(…)`.

- **Rule**: `javascript:S7750`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 21: Remove this unused import of 'mkdirSync'.

- **Rule**: `javascript:S1128`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```js
      18 |  *   4. Create an ID mapping file for reference
      19 |  */
      20 |
>>>   21 | import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
      22 | import { join, basename } from "node:path";
      23 |
      24 | const SEVERITY_ORDER = { S0: 0, S1: 1, S2: 2, S3: 3 };
```

---

#### 🔵 Line 22: Remove this unused import of 'basename'.

- **Rule**: `javascript:S1128`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```js
      19 |  */
      20 |
      21 | import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
>>>   22 | import { join, basename } from "node:path";
      23 |
      24 | const SEVERITY_ORDER = { S0: 0, S1: 1, S2: 2, S3: 3 };
      25 | const EFFORT_ORDER = { E0: 0, E1: 1, E2: 2, E3: 3 };
```

---

#### 🔵 Line 57: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      54 |   // Also check remediation.notes and other text fields that might reference IDs
      55 |   if (finding.remediation?.notes) {
      56 |     for (const [oldId, newId] of idMap.entries()) {
>>>   57 |       finding.remediation.notes = finding.remediation.notes.replace(
      58 |         new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      59 |         newId
      60 |       );
```

---

#### 🔵 Line 58: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      55 |   if (finding.remediation?.notes) {
      56 |     for (const [oldId, newId] of idMap.entries()) {
      57 |       finding.remediation.notes = finding.remediation.notes.replace(
>>>   58 |         new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      59 |         newId
      60 |       );
      61 |     }
```

---

#### 🔵 Line 58: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      55 |   if (finding.remediation?.notes) {
      56 |     for (const [oldId, newId] of idMap.entries()) {
      57 |       finding.remediation.notes = finding.remediation.notes.replace(
>>>   58 |         new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      59 |         newId
      60 |       );
      61 |     }
```

---

#### 🔵 Line 68: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      65 |   if (finding.severity_normalization?.contingency) {
      66 |     for (const [oldId, newId] of idMap.entries()) {
      67 |       finding.severity_normalization.contingency =
>>>   68 |         finding.severity_normalization.contingency.replace(
      69 |           new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      70 |           newId
      71 |         );
```

---

#### 🔵 Line 69: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      66 |     for (const [oldId, newId] of idMap.entries()) {
      67 |       finding.severity_normalization.contingency =
      68 |         finding.severity_normalization.contingency.replace(
>>>   69 |           new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      70 |           newId
      71 |         );
      72 |     }
```

---

#### 🔵 Line 69: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      66 |     for (const [oldId, newId] of idMap.entries()) {
      67 |       finding.severity_normalization.contingency =
      68 |         finding.severity_normalization.contingency.replace(
>>>   69 |           new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      70 |           newId
      71 |         );
      72 |     }
```

---

#### 🟠 Line 188: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

```js
     185 |   return findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
     186 | }
     187 |
>>>  188 | function main() {
     189 |   const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
     190 |   const dryRun = process.argv.includes("--dry-run");
     191 |   const verbose = process.argv.includes("--verbose");
```

---

#### 🔵 Line 189: Prefer `.find(…)` over `.filter(…)`.

- **Rule**: `javascript:S7750`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     186 | }
     187 |
     188 | function main() {
>>>  189 |   const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
     190 |   const dryRun = process.argv.includes("--dry-run");
     191 |   const verbose = process.argv.includes("--verbose");
     192 |
```

---

#### 🔵 Line 309: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     306 |       return updated;
     307 |     });
     308 |
>>>  309 |     if (!dryRun) {
     310 |       try {
     311 |         writeFileSync(filepath, toJsonl(updatedFindings));
     312 |         console.log(`    ✓ Updated ${updatedFindings.length} findings`);
```

---

### 📁 `scripts/check-review-triggers.sh` (13 issues)

#### 🟡 Line 28: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      25 |
      26 | # Get commits since last tag (or last 50 if no tags)
      27 | LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
>>>   28 | if [[ -n "$LAST_TAG" ]]; then
      29 |   COMMITS_SINCE=$(git rev-list --count HEAD ^"$LAST_TAG")
      30 |   echo "Commits since last tag ($LAST_TAG): $COMMITS_SINCE"
      31 | else
```

---

#### 🟡 Line 36: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      33 |   echo "Total commits (no tags): $COMMITS_SINCE"
      34 | fi
      35 |
>>>   36 | if [[ "$COMMITS_SINCE" -ge 50 ]]; then
      37 |   echo -e "${YELLOW}[TRIGGER]${NC} 50+ commits - consider code review"
      38 |   TRIGGERS_FOUND=$((TRIGGERS_FOUND + 1))
      39 | fi
```

---

#### 🟡 Line 44: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      41 | # Files changed in last 10 commits (with guard for short repos)
      42 | # Note: HEAD~N requires at least N+1 commits, so LOOKBACK must be < COMMIT_COUNT
      43 | COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
>>>   44 | if [[ "$COMMIT_COUNT" -le 1 ]]; then
      45 |   LOOKBACK=0
      46 | else
      47 |   # LOOKBACK must be strictly less than COMMIT_COUNT to avoid referencing before initial commit
```

---

#### 🟡 Line 50: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      47 |   # LOOKBACK must be strictly less than COMMIT_COUNT to avoid referencing before initial commit
      48 |   LOOKBACK=$((COMMIT_COUNT <= 10 ? COMMIT_COUNT - 1 : 10))
      49 | fi
>>>   50 | if [[ "$LOOKBACK" -gt 0 ]]; then
      51 |   FILES_CHANGED=$(git diff --name-only HEAD~$LOOKBACK 2>/dev/null | wc -l | tr -d ' ')
      52 | else
      53 |   FILES_CHANGED=0
```

---

#### 🟡 Line 61: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      58 | # --- Security Triggers ---
      59 | echo "=== Security-Sensitive Changes (last $LOOKBACK commits) ==="
      60 |
>>>   61 | if [[ "$LOOKBACK" -gt 0 ]]; then
      62 |   SECURITY_FILES=$(git diff --name-only HEAD~$LOOKBACK 2>/dev/null | grep -iE "(auth|security|firebase|api|secret|env|token|key|password|credential)" || echo "")
      63 | else
      64 |   SECURITY_FILES=""
```

---

#### 🟡 Line 66: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      63 | else
      64 |   SECURITY_FILES=""
      65 | fi
>>>   66 | if [[ -n "$SECURITY_FILES" ]]; then
      67 |   echo -e "${YELLOW}[TRIGGER]${NC} Security-sensitive files changed:"
      68 |   echo "$SECURITY_FILES" | head -10 | sed 's/^/  - /'
      69 |   TRIGGERS_FOUND=$((TRIGGERS_FOUND + 1))
```

---

#### 🟡 Line 79: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      76 | echo "=== Performance Indicators ==="
      77 |
      78 | # Bundle size check
>>>   79 | if [[ -d ".next/static/chunks" ]]; then
      80 |   BUNDLE_SIZE=$(du -sh .next/static/chunks 2>/dev/null | cut -f1)
      81 |   echo "Bundle size (chunks): $BUNDLE_SIZE"
      82 | else
```

---

#### 🟡 Line 87: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      84 | fi
      85 |
      86 | # Check for heavy dependencies added recently
>>>   87 | if [[ "$LOOKBACK" -gt 0 ]]; then
      88 |   NEW_DEPS=$(git diff HEAD~$LOOKBACK -- package.json 2>/dev/null | grep "^\+" | grep -E '"(lodash|moment|jquery|rxjs|three|d3|chart\.js)"' || echo "")
      89 | else
      90 |   NEW_DEPS=""
```

---

#### 🟡 Line 92: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      89 | else
      90 |   NEW_DEPS=""
      91 | fi
>>>   92 | if [[ -n "$NEW_DEPS" ]]; then
      93 |   echo -e "${YELLOW}[TRIGGER]${NC} Heavy dependencies may have been added"
      94 |   TRIGGERS_FOUND=$((TRIGGERS_FOUND + 1))
      95 | fi
```

---

#### 🟡 Line 108: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     105 | echo "Firebase collection() calls: $COLLECTION_COUNT"
     106 | echo "Firebase onSnapshot() calls: $SNAPSHOT_COUNT"
     107 |
>>>  108 | if [[ "$COLLECTION_COUNT" -ge 10 ]] || [ "$SNAPSHOT_COUNT" -ge 5 ]]; then
     109 |   echo -e "${YELLOW}[INFO]${NC} Multiple Firebase access patterns - consider consolidation review"
     110 | fi
     111 |
```

---

#### 🟡 Line 108: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     105 | echo "Firebase collection() calls: $COLLECTION_COUNT"
     106 | echo "Firebase onSnapshot() calls: $SNAPSHOT_COUNT"
     107 |
>>>  108 | if [[ "$COLLECTION_COUNT" -ge 10 ]] || [ "$SNAPSHOT_COUNT" -ge 5 ]]; then
     109 |   echo -e "${YELLOW}[INFO]${NC} Multiple Firebase access patterns - consider consolidation review"
     110 | fi
     111 |
```

---

#### 🟡 Line 142: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
     139 | echo "  SUMMARY"
     140 | echo "========================================"
     141 |
>>>  142 | if [[ "$TRIGGERS_FOUND" -gt 0 ]]; then
     143 |   echo -e "${YELLOW}Triggers found: $TRIGGERS_FOUND${NC}"
     144 |   echo ""
     145 |   echo "Recommended actions:"
```

---

#### 🔵 Line 156: Define a constant instead of using the literal '========================================' 5 times.

- **Rule**: `shelldre:S1192`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 4min

```sh
     153 |
     154 | echo ""
     155 | echo "See docs/MULTI_AI_REVIEW_COORDINATOR.md for full trigger checklist"
>>>  156 | echo "========================================"
     157 |
```

---

### 📁 `components/growth/NightReviewCard.tsx` (12 issues)

#### 🟡 Line N/A: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 5: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
       2 |
       3 | import { useState, useEffect, useRef } from "react";
       4 | import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
>>>    5 | import { Moon, Save, ChevronRight, ChevronLeft, Check } from "lucide-react";
       6 | import {
       7 |   Dialog,
       8 |   DialogContent,
```

---

#### 🔵 Line 15: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      12 |   DialogDescription,
      13 | } from "@/components/ui/dialog";
      14 | import { Button } from "@/components/ui/button";
>>>   15 | import { useAuth } from "@/components/providers/auth-provider";
      16 | import { FirestoreService } from "@/lib/firestore-service";
      17 | import { logger, maskIdentifier } from "@/lib/logger";
      18 | import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
```

---

#### 🔵 Line 19: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
      16 | import { FirestoreService } from "@/lib/firestore-service";
      17 | import { logger, maskIdentifier } from "@/lib/logger";
      18 | import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
>>>   19 | import { Mic, MicOff } from "lucide-react";
      20 | import { toast } from "sonner";
      21 |
      22 | type NightReviewCardProps = HTMLMotionProps<"button">;
```

---

#### 🟠 Line 75: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```tsx
      72 |   { id: "apology", label: "To whom do I owe an apology?" },
      73 | ];
      74 |
>>>   75 | export default function NightReviewCard({ className, ...props }: NightReviewCardProps) {
      76 |   const [open, setOpen] = useState(false); // Was isOpen, changed to open to match Dialog usage typical patterns if needed, but keeping isOpen internal variable name consistent. Wait, previous code used isOpen. Dialog expects 'open'.
      77 |   // Let's stick to 'open' state variable name if passed to Dialog open={open}
      78 |
```

---

#### 🔵 Line 85: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      82 |
      83 |   const [step, setStep] = useState(1);
      84 |   const [isSaving, setIsSaving] = useState(false);
>>>   85 |   const { user } = useAuth();
      86 |
      87 |   // Form State
      88 |   const [actions, setActions] = useState<Record<string, boolean>>({});
```

---

#### 🟡 Line 406: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     403 |
     404 |                     <div className="space-y-2">
     405 |                       <div className="flex justify-between items-center">
>>>  406 |                         <label className="text-sm font-medium text-emerald-200">
     407 |                           Today I am grateful for...
     408 |                         </label>
     409 |                         {hasSupport && (
```

---

#### 🟡 Line 436: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     433 |
     434 |                     <div className="space-y-2">
     435 |                       <div className="flex justify-between items-center">
>>>  436 |                         <label className="text-sm font-medium text-indigo-200">
     437 |                           Today I accept/surrender...
     438 |                         </label>
     439 |                         {hasSupport && (
```

---

#### 🟡 Line 527: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     524 |
     525 |                   const reflectionsList =
     526 |                     Object.values(reflectionAnswers)
>>>  527 |                       .filter((v) => v && v.trim())
     528 |                       .join("\n") || "None";
     529 |
     530 |                   const shareText = `Nightly Inventory\n\nActions: ${actionsList}\n\nTraits: ${traitsList}\n\nReflections: ${reflectionsList}\n\nGratitude: ${gratitude || "None"}\n\nSurrender: ${surrender || "None"}`;
```

---

#### 🟡 Line 567: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     564 |             >
     565 |               {isSaving ? (
     566 |                 <span className="animate-spin">⌛</span>
>>>  567 |               ) : step === 4 ? (
     568 |                 <>
     569 |                   <Save className="w-4 h-4 mr-2" /> Finish
     570 |                 </>
```

---

### 📁 `components/notebook/pages/history-page.tsx` (12 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟠 Line 50: Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 25min

```tsx
      47 |         const entryDate = startOfDay(new Date(y, m - 1, d));
      48 |         return entryDate >= sevenDaysAgo;
      49 |       })
>>>   50 |       .map((entry) => {
      51 |         const date = entry.createdAt
      52 |           ? new Date(entry.createdAt)
      53 |           : new Date(entry.dateLabel + "T12:00:00");
```

---

#### 🟡 Line 59: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      56 |           const cravingText =
      57 |             entry.data.cravings === null
      58 |               ? "Cravings: n/a"
>>>   59 |               : entry.data.cravings
      60 |                 ? "Cravings: yes"
      61 |                 : "Cravings: no";
      62 |           const usedText =
```

---

#### 🟡 Line 63: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      60 |                 ? "Cravings: yes"
      61 |                 : "Cravings: no";
      62 |           const usedText =
>>>   63 |             entry.data.used === null ? "Used: n/a" : entry.data.used ? "Used: yes" : "Used: no";
      64 |           const moodText = entry.data.mood ? `Mood: ${entry.data.mood}` : "Mood not set";
      65 |           const noteText = entry.data.note ? `Note: ${entry.data.note.slice(0, 80)}` : "";
      66 |           const preview = [moodText, cravingText, usedText, noteText].filter(Boolean).join(" • ");
```

---

#### 🟡 Line 116: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     113 |             (data.note as string) ||
     114 |             "Review completed";
     115 |           const icon =
>>>  116 |             entry.type === "spot-check" ? Zap : entry.type === "night-review" ? Moon : Calendar;
     117 |           const color =
     118 |             entry.type === "spot-check"
     119 |               ? "text-orange-500"
```

---

#### 🟡 Line 120: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     117 |           const color =
     118 |             entry.type === "spot-check"
     119 |               ? "text-orange-500"
>>>  120 |               : entry.type === "night-review"
     121 |                 ? "text-indigo-500"
     122 |                 : "text-amber-600";
     123 |           return {
```

---

#### 🟡 Line 130: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     127 |             title:
     128 |               entry.type === "spot-check"
     129 |                 ? "Spot Check"
>>>  130 |                 : entry.type === "night-review"
     131 |                   ? "Night Review"
     132 |                   : "Inventory",
     133 |             preview,
```

---

#### 🟡 Line 186: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     183 |           <div className="flex justify-center py-12">
     184 |             <Loader2 className="w-8 h-8 animate-spin text-amber-900/30" />
     185 |           </div>
>>>  186 |         ) : items.length === 0 ? (
     187 |           <div className="text-center py-12 border-2 border-dashed border-amber-900/10 rounded-xl">
     188 |             <p className="font-handlee text-amber-900/40 text-lg">
     189 |               Your journal is waiting for you.
```

---

### 📁 `components/widgets/compact-meeting-countdown.tsx` (12 issues)

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Add an initial value to this "reduce()" call.

- **Rule**: `typescript:S6959`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line N/A: Add an initial value to this "reduce()" call.

- **Rule**: `typescript:S6959`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟠 Line 69: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```tsx
      66 |   }
      67 | }
      68 |
>>>   69 | const parseMinutesSinceMidnight = (timeStr: string): number | null => {
      70 |   const t = timeStr.trim();
      71 |
      72 |   // 24-hour format: "HH:mm"
```

---

#### 🔵 Line 73: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      70 |   const t = timeStr.trim();
      71 |
      72 |   // 24-hour format: "HH:mm"
>>>   73 |   const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
      74 |   if (m24) {
      75 |     const h = Number(m24[1]);
      76 |     const m = Number(m24[2]);
```

---

#### 🔵 Line 84: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      81 |   }
      82 |
      83 |   // 12-hour format: "h:mm AM/PM"
>>>   84 |   const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      85 |   if (m12) {
      86 |     let h = Number(m12[1]);
      87 |     const m = Number(m12[2]);
```

---

#### 🟠 Line 121: Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 13min

```tsx
     118 |   });
     119 |
     120 |   useEffect(() => {
>>>  121 |     async function findNextMeeting() {
     122 |       try {
     123 |         // Get all meetings for today
     124 |         const now = new Date();
```

---

#### 🔵 Line 191: Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read.

- **Rule**: `typescript:S6606`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     188 |               }
     189 |             }
     190 |
>>>  191 |             if (!selectedMeeting) {
     192 |               selectedMeeting = tomorrowsMeetings[0];
     193 |             }
     194 |           }
```

---

#### 🟡 Line 241: Move function 'formatTime' to the outer scope.

- **Rule**: `typescript:S7721`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     238 |     return () => clearInterval(interval);
     239 |   }, [nextMeeting]);
     240 |
>>>  241 |   function formatTime(time24: string): string {
     242 |     const [hours, minutes] = time24.split(":").map(Number);
     243 |     const period = hours >= 12 ? "PM" : "AM";
     244 |     const displayHours = hours % 12 || 12;
```

---

#### 🟡 Line 273: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     270 |
     271 |   return (
     272 |     <>
>>>  273 |       <div
     274 |         onClick={handleClick}
     275 |         className="flex flex-col items-end gap-0.5 text-amber-900 hover:text-amber-700 transition-colors cursor-pointer group"
     276 |       >
```

---

#### 🔵 Line 273: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     270 |
     271 |   return (
     272 |     <>
>>>  273 |       <div
     274 |         onClick={handleClick}
     275 |         className="flex flex-col items-end gap-0.5 text-amber-900 hover:text-amber-700 transition-colors cursor-pointer group"
     276 |       >
```

---

### 📁 `lib/firebase.ts` (12 issues)

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 44: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      41 |
      42 | // Only initialize Firebase on the client side
      43 | const initializeFirebase = () => {
>>>   44 |   if (typeof window === "undefined") {
      45 |     // Server-side: return undefined, will be initialized on client
      46 |     return;
      47 |   }
```

---

#### 🟡 Line 61: Remove this commented out code.

- **Rule**: `typescript:S125`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
      58 |   // Will re-enable after throttle clears (Dec 31, ~01:02 UTC)
      59 |   // Initialize App Check for security
      60 |   // SECURITY: App Check prevents unauthorized access to Cloud Functions
>>>   61 |   /* try {
      62 |     const recaptchaSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY
      63 |
      64 |     if (recaptchaSiteKey) {
```

---

#### 🔵 Line 94: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      91 | };
      92 |
      93 | // Initialize on module load only if in browser
>>>   94 | if (typeof window !== "undefined") {
      95 |   initializeFirebase();
      96 | }
      97 |
```

---

#### 🟠 Line 137: Exporting mutable 'let' binding, use 'const' instead.

- **Rule**: `typescript:S6861`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
     134 | // Exports with SSR safety
     135 | // In browser: real Firebase instances
     136 | // On server: proxy objects that throw helpful errors instead of crashing silently
>>>  137 | let app: FirebaseApp;
     138 | let auth: Auth;
     139 | let db: Firestore;
     140 |
```

---

#### 🟠 Line 138: Exporting mutable 'let' binding, use 'const' instead.

- **Rule**: `typescript:S6861`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
     135 | // In browser: real Firebase instances
     136 | // On server: proxy objects that throw helpful errors instead of crashing silently
     137 | let app: FirebaseApp;
>>>  138 | let auth: Auth;
     139 | let db: Firestore;
     140 |
     141 | if (typeof window !== "undefined") {
```

---

#### 🟠 Line 139: Exporting mutable 'let' binding, use 'const' instead.

- **Rule**: `typescript:S6861`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
     136 | // On server: proxy objects that throw helpful errors instead of crashing silently
     137 | let app: FirebaseApp;
     138 | let auth: Auth;
>>>  139 | let db: Firestore;
     140 |
     141 | if (typeof window !== "undefined") {
     142 |   // Client-side: use real Firebase instances
```

---

#### 🔵 Line 141: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     138 | let auth: Auth;
     139 | let db: Firestore;
     140 |
>>>  141 | if (typeof window !== "undefined") {
     142 |   // Client-side: use real Firebase instances
     143 |   try {
     144 |     const firebase = getFirebase();
```

---

#### 🔵 Line 141: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     138 | let auth: Auth;
     139 | let db: Firestore;
     140 |
>>>  141 | if (typeof window !== "undefined") {
     142 |   // Client-side: use real Firebase instances
     143 |   try {
     144 |     const firebase = getFirebase();
```

---

### 📁 `scripts/ai-review.js` (12 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🔵 Line 15: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      12 |  *   node scripts/ai-review.js --type=dependencies --staged
      13 |  */
      14 |
>>>   15 | import fs from "node:fs";
      16 | import path from "node:path";
      17 | import { execSync, execFileSync } from "node:child_process";
      18 |
```

---

#### 🔵 Line 16: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      13 |  */
      14 |
      15 | import fs from "node:fs";
>>>   16 | import path from "node:path";
      17 | import { execSync, execFileSync } from "node:child_process";
      18 |
      19 | const REVIEW_PROMPTS_FILE = ".claude/review-prompts.md";
```

---

#### 🔵 Line 17: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      14 |
      15 | import fs from "node:fs";
      16 | import path from "node:path";
>>>   17 | import { execSync, execFileSync } from "node:child_process";
      18 |
      19 | const REVIEW_PROMPTS_FILE = ".claude/review-prompts.md";
      20 |
```

---

#### 🔵 Line 44: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      41 |  */
      42 | function isSensitiveFile(filePath) {
      43 |   const basename = path.basename(filePath);
>>>   44 |   const normalized = String(filePath).replace(/\\/g, "/");
      45 |
      46 |   // Check if file is in a sensitive directory
      47 |   if (SENSITIVE_DIR_PATTERNS.some((pattern) => pattern.test(normalized))) {
```

---

#### 🔵 Line 61: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      58 | function sanitizePath(filePath) {
      59 |   return (
      60 |     String(filePath)
>>>   61 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
      62 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      63 |       // Handle any Windows drive letter, case-insensitive
      64 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
```

---

#### 🔵 Line 62: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      59 |   return (
      60 |     String(filePath)
      61 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
>>>   62 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      63 |       // Handle any Windows drive letter, case-insensitive
      64 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
      65 |   );
```

---

#### 🔵 Line 64: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      61 |       .replace(/\/home\/[^/\s]+/g, "[HOME]")
      62 |       .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      63 |       // Handle any Windows drive letter, case-insensitive
>>>   64 |       .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
      65 |   );
      66 | }
      67 |
```

---

#### 🟡 Line 394: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     391 |     console.log("=".repeat(80));
     392 |     console.log("\nSuggested command:");
     393 |     console.log(
>>>  394 |       `  claude chat < <(node scripts/ai-review.js --type=${config.type} ${config.file ? `--file=${config.file}` : "--staged"})`
     395 |     );
     396 |   }
     397 | }
```

---

### 📁 `scripts/migrate-library-content.ts` (11 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
>>>    3 | import { readFileSync } from "node:fs";
       4 | import { join } from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error.js";
       6 |
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
       3 | import { readFileSync } from "node:fs";
>>>    4 | import { join } from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error.js";
       6 |
       7 | // Initialize Firebase Admin
```

---

#### 🔵 Line 129: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     126 |       // Use improved slugification for robust idempotency
     127 |       const slug = link.title
     128 |         .toLowerCase()
>>>  129 |         .replace(/\s+/g, "-")
     130 |         .replace(/[^a-z0-9-]/g, "");
     131 |       const docId = `link-${link.category}-${slug}`;
     132 |       const docRef = linksRef.doc(docId);
```

---

#### 🔵 Line 130: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     127 |       const slug = link.title
     128 |         .toLowerCase()
     129 |         .replace(/\s+/g, "-")
>>>  130 |         .replace(/[^a-z0-9-]/g, "");
     131 |       const docId = `link-${link.category}-${slug}`;
     132 |       const docRef = linksRef.doc(docId);
     133 |
```

---

#### 🔵 Line 162: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     159 |       // Use improved slugification for robust idempotency
     160 |       const slug = prayer.title
     161 |         .toLowerCase()
>>>  162 |         .replace(/\s+/g, "-")
     163 |         .replace(/[^a-z0-9-]/g, "");
     164 |       const docId = `prayer-${prayer.category}-${slug}`;
     165 |       const docRef = prayersRef.doc(docId);
```

---

#### 🔵 Line 163: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     160 |       const slug = prayer.title
     161 |         .toLowerCase()
     162 |         .replace(/\s+/g, "-")
>>>  163 |         .replace(/[^a-z0-9-]/g, "");
     164 |       const docId = `prayer-${prayer.category}-${slug}`;
     165 |       const docRef = prayersRef.doc(docId);
     166 |
```

---

#### 🟡 Line 205: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     202 | // Run migration
     203 | migrateLibraryContent()
     204 |   .then(() => process.exit(0))
>>>  205 |   .catch((error) => {
     206 |     // Use sanitizeError to avoid exposing sensitive paths
     207 |     console.error(sanitizeError(error));
     208 |     process.exit(1);
```

---

### 📁 `scripts/run-consolidation.js` (10 issues)

#### 🔵 Line 43: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      40 | const MIN_PATTERN_OCCURRENCES = 3;
      41 |
      42 | // Parse arguments
>>>   43 | const args = process.argv.slice(2);
      44 | const autoMode = args.includes("--auto");
      45 | const applyChanges = args.includes("--apply") || autoMode;
      46 | const verbose = args.includes("--verbose");
```

---

#### 🔵 Line 77: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      74 |  * Prevents ReDoS and unexpected behavior when building dynamic RegExp
      75 |  */
      76 | function escapeRegex(str) {
>>>   77 |   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      78 | }
      79 |
      80 | /**
```

---

#### 🔵 Line 77: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      74 |  * Prevents ReDoS and unexpected behavior when building dynamic RegExp
      75 |  */
      76 | function escapeRegex(str) {
>>>   77 |   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      78 | }
      79 |
      80 | /**
```

---

#### 🔵 Line 103: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     100 |       "Could not find 'Reviews since last consolidation' counter in log file. Check document format."
     101 |     );
     102 |   }
>>>  103 |   const reviewCount = parseInt(counterMatch[1], 10) || 0;
     104 |
     105 |   const lastConsolidationMatch = section.match(/\*\*Date:\*\*\s+([^\n]+)/);
     106 |   const lastConsolidation = lastConsolidationMatch ? lastConsolidationMatch[1].trim() : "Unknown";
```

---

#### 🔵 Line 110: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     107 |
     108 |   const nextReviewMatch = section.match(/After Review #(\d+)/);
     109 |   const lastReviewNum = nextReviewMatch
>>>  110 |     ? parseInt(nextReviewMatch[1], 10) - CONSOLIDATION_THRESHOLD
     111 |     : 0;
     112 |
     113 |   return { reviewCount, lastConsolidation, lastReviewNum };
```

---

#### 🔵 Line 130: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     127 |   let match;
     128 |
     129 |   while ((match = versionRegex.exec(content)) !== null) {
>>>  130 |     const reviewNum = parseInt(match[1], 10);
     131 |     const description = match[2].trim();
     132 |
     133 |     if (reviewNum > lastReviewNum) {
```

---

#### 🟠 Line 147: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```js
     144 | /**
     145 |  * Extract patterns from review descriptions
     146 |  */
>>>  147 | function extractPatterns(reviews) {
     148 |   const patterns = new Map();
     149 |
     150 |   // Common pattern keywords to look for
```

---

#### 🟡 Line 238: Replace this character class by the character itself.

- **Rule**: `javascript:S6397`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     235 |     }
     236 |
     237 |     // Also extract "New pattern:" mentions
>>>  238 |     const newPatternMatch = review.description.match(/New pattern[s]?:\s*([^.]+)/i);
     239 |     if (newPatternMatch) {
     240 |       const patternDesc = newPatternMatch[1].trim().toLowerCase();
     241 |       if (!patterns.has(patternDesc)) {
```

---

#### 🟠 Line 412: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     409 | /**
     410 |  * Main consolidation function
     411 |  */
>>>  412 | function main() {
     413 |   try {
     414 |     log(`\n${colors.bold}🔄 Pattern Consolidation Tool${colors.reset}\n`);
     415 |
```

---

#### 🔵 Line 426: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     423 |     // Read log content with explicit try/catch for race conditions (Review #158)
     424 |     let content;
     425 |     try {
>>>  426 |       content = readFileSync(LOG_FILE, "utf8").replace(/\r\n/g, "\n");
     427 |     } catch (readError) {
     428 |       const message = readError instanceof Error ? readError.message : String(readError);
     429 |       log(`❌ Failed to read AI_REVIEW_LEARNINGS_LOG.md: ${message}`, colors.red);
```

---

### 📁 `scripts/check-backlog-health.js` (10 issues)

#### 🔵 Line 29: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      26 |
      27 | // Configuration (can be overridden via env vars)
      28 | const CONFIG = {
>>>   29 |   S1_MAX_DAYS: parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
      30 |   S2_MAX_DAYS: parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
      31 |   MAX_ITEMS: parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
      32 |   BLOCK_S1_DAYS: parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
```

---

#### 🔵 Line 30: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      27 | // Configuration (can be overridden via env vars)
      28 | const CONFIG = {
      29 |   S1_MAX_DAYS: parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
>>>   30 |   S2_MAX_DAYS: parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
      31 |   MAX_ITEMS: parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
      32 |   BLOCK_S1_DAYS: parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
      33 | };
```

---

#### 🔵 Line 31: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      28 | const CONFIG = {
      29 |   S1_MAX_DAYS: parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
      30 |   S2_MAX_DAYS: parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
>>>   31 |   MAX_ITEMS: parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
      32 |   BLOCK_S1_DAYS: parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
      33 | };
      34 |
```

---

#### 🔵 Line 32: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      29 |   S1_MAX_DAYS: parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
      30 |   S2_MAX_DAYS: parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
      31 |   MAX_ITEMS: parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
>>>   32 |   BLOCK_S1_DAYS: parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
      33 | };
      34 |
      35 | const BACKLOG_FILE = join(__dirname, "..", "docs", "AUDIT_FINDINGS_BACKLOG.md");
```

---

#### 🔵 Line 44: Remove the declaration of the unused 'itemRegex' variable.

- **Rule**: `javascript:S1481`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      41 |   const items = [];
      42 |
      43 |   // Match item headers like "### [Category] Item Name"
>>>   44 |   const itemRegex = /^### \[([^\]]+)\] (.+)$/gm;
      45 |   const sections = content.split(/^### \[/gm);
      46 |
      47 |   for (let i = 1; i < sections.length; i++) {
```

---

#### 🟡 Line 44: Remove this useless assignment to variable "itemRegex".

- **Rule**: `javascript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```js
      41 |   const items = [];
      42 |
      43 |   // Match item headers like "### [Category] Item Name"
>>>   44 |   const itemRegex = /^### \[([^\]]+)\] (.+)$/gm;
      45 |   const sections = content.split(/^### \[/gm);
      46 |
      47 |   for (let i = 1; i < sections.length; i++) {
```

---

#### 🟠 Line 103: Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 29min

```js
     100 | /**
     101 |  * Main function
     102 |  */
>>>  103 | function main() {
     104 |   const isPrePush = process.argv.includes("--pre-push");
     105 |   const isQuiet = process.argv.includes("--quiet");
     106 |
```

---

#### 🔵 Line 117: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     114 |     }
     115 |
     116 |     // Normalize CRLF to LF for cross-platform compatibility
>>>  117 |     const content = readFileSync(BACKLOG_FILE, "utf8").replace(/\r\n/g, "\n");
     118 |
     119 |     // Get days since last update
     120 |     const daysSinceUpdate = getDaysSinceUpdate(content);
```

---

#### 🟡 Line 130: Extract this nested ternary operation into an independent statement.

- **Rule**: `javascript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     127 |     const cutIndex =
     128 |       completedIndex === -1
     129 |         ? rejectedIndex
>>>  130 |         : rejectedIndex === -1
     131 |           ? completedIndex
     132 |           : Math.min(completedIndex, rejectedIndex);
     133 |
```

---

#### 🔵 Line 134: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     131 |           ? completedIndex
     132 |           : Math.min(completedIndex, rejectedIndex);
     133 |
>>>  134 |     const activeContent = cutIndex !== -1 ? content.slice(0, cutIndex) : content;
     135 |     const items = parseBacklogItems(activeContent);
     136 |
     137 |     // Categorize by severity
```

---

### 📁 `components/growth/SpotCheckCard.tsx` (10 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Ambiguous spacing after previous element span

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 5: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
       2 |
       3 | import { useState, useRef, useEffect } from "react";
       4 | import { motion, type HTMLMotionProps } from "framer-motion";
>>>    5 | import { Zap, ChevronRight, Check } from "lucide-react";
       6 | import {
       7 |   Dialog,
       8 |   DialogContent,
```

---

#### 🔵 Line 15: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      12 |   DialogDescription,
      13 | } from "@/components/ui/dialog";
      14 | import { Button } from "@/components/ui/button";
>>>   15 | import { useAuth } from "@/components/providers/auth-provider";
      16 | import { FirestoreService } from "@/lib/firestore-service";
      17 | import { logger, maskIdentifier } from "@/lib/logger";
      18 | import { toast } from "sonner";
```

---

#### 🔵 Line 20: 'lucide-react' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
      17 | import { logger, maskIdentifier } from "@/lib/logger";
      18 | import { toast } from "sonner";
      19 | import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
>>>   20 | import { Mic, MicOff } from "lucide-react";
      21 |
      22 | type SpotCheckCardProps = HTMLMotionProps<"button">;
      23 |
```

---

#### 🔵 Line 31: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      28 |   const [absolutes, setAbsolutes] = useState<string[]>([]);
      29 |   const [action, setAction] = useState("");
      30 |   const [isSaving, setIsSaving] = useState(false);
>>>   31 |   const { user } = useAuth();
      32 |
      33 |   // Speech
      34 |   const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } =
```

---

#### 🟡 Line 52: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      49 |   useEffect(() => {
      50 |     if (!isListening) return;
      51 |     const newText = textBeforeSpeakingRef.current
>>>   52 |       ? transcript
      53 |         ? `${textBeforeSpeakingRef.current} ${transcript}`
      54 |         : textBeforeSpeakingRef.current
      55 |       : transcript;
```

---

#### 🟡 Line 167: Ambiguous spacing after previous element span

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     164 |           <DialogTitle className="font-handlee text-2xl text-amber-900 flex items-center gap-2">
     165 |             <span className="p-1.5 bg-amber-100 rounded-md">
     166 |               <Zap className="w-4 h-4 text-amber-600" />
>>>  167 |             </span>
     168 |             Spot Check
     169 |           </DialogTitle>
     170 |           <DialogDescription className="text-amber-900/60">
```

---

#### 🟡 Line 278: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     275 |           >
     276 |             {isSaving ? (
     277 |               "Saving..."
>>>  278 |             ) : step < 3 ? (
     279 |               <>
     280 |                 Next <ChevronRight className="ml-1 w-4 h-4" />
     281 |               </>
```

---

### 📁 `components/journal/entry-feed.tsx` (10 issues)

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 16: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      13 |   filter: JournalFilterType;
      14 | }
      15 |
>>>   16 | export function EntryFeed({ entries, filter }: EntryFeedProps) {
      17 |   const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
      18 |   const [searchQuery, setSearchQuery] = useState("");
      19 |
```

---

#### 🟡 Line 152: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     149 |
     150 |       {/* Detail Dialog */}
     151 |       {selectedEntry && (
>>>  152 |         <div
     153 |           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
     154 |           onClick={() => setSelectedEntry(null)}
     155 |         >
```

---

#### 🔵 Line 152: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     149 |
     150 |       {/* Detail Dialog */}
     151 |       {selectedEntry && (
>>>  152 |         <div
     153 |           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
     154 |           onClick={() => setSelectedEntry(null)}
     155 |         >
```

---

#### 🟡 Line 156: Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element.

- **Rule**: `typescript:S6848`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     153 |           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
     154 |           onClick={() => setSelectedEntry(null)}
     155 |         >
>>>  156 |           <div
     157 |             className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
     158 |             onClick={(e) => e.stopPropagation()}
     159 |           >
```

---

#### 🔵 Line 156: Visible, non-interactive elements with click handlers must have at least one keyboard listener.

- **Rule**: `typescript:S1082`
- **Type**: BUG
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     153 |           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
     154 |           onClick={() => setSelectedEntry(null)}
     155 |         >
>>>  156 |           <div
     157 |             className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
     158 |             onClick={(e) => e.stopPropagation()}
     159 |           >
```

---

#### 🟡 Line 194: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     191 |                   <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
     192 |                   <ul className="list-disc pl-5">
     193 |                     {selectedEntry.data.items.map((item, i) => (
>>>  194 |                       <li key={i}>{item}</li>
     195 |                     ))}
     196 |                   </ul>
     197 |                 </div>
```

---

### 📁 `components/onboarding/onboarding-wizard.tsx` (10 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: `new Error()` is too unspecific for a type check. Use `new TypeError()` instead.

- **Rule**: `typescript:S7786`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line 5: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       2 |
       3 | import { useState } from "react";
       4 | import { motion, AnimatePresence } from "framer-motion";
>>>    5 | import { useAuth } from "@/components/providers/auth-provider";
       6 | import { createUserProfile, getUserProfile, updateUserProfile } from "@/lib/db/users";
       7 | import {
       8 |   Loader2,
```

---

#### 🔵 Line 30: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      27 | type OnboardingStep = "welcome" | "clean-date" | "sponsor" | "privacy" | "tour";
      28 | type SponsorStatus = "yes" | "no" | "looking" | null;
      29 |
>>>   30 | export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
      31 |   const { user } = useAuth();
      32 |   const [step, setStep] = useState<OnboardingStep>("welcome");
      33 |   const [nickname, setNickname] = useState("");
```

---

#### 🔵 Line 31: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      28 | type SponsorStatus = "yes" | "no" | "looking" | null;
      29 |
      30 | export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
>>>   31 |   const { user } = useAuth();
      32 |   const [step, setStep] = useState<OnboardingStep>("welcome");
      33 |   const [nickname, setNickname] = useState("");
      34 |   const [cleanDate, setCleanDate] = useState("");
```

---

#### 🔵 Line 135: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     132 |       const dateString = `${cleanDate}T${time || "00:00"}:00`;
     133 |       const dateObj = new Date(dateString);
     134 |
>>>  135 |       if (isNaN(dateObj.getTime())) {
     136 |         throw new Error("Invalid date");
     137 |       }
     138 |
```

---

#### 🔵 Line 136: `new Error()` is too unspecific for a type check. Use `new TypeError()` instead.

- **Rule**: `typescript:S7786`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     133 |       const dateObj = new Date(dateString);
     134 |
     135 |       if (isNaN(dateObj.getTime())) {
>>>  136 |         throw new Error("Invalid date");
     137 |       }
     138 |
     139 |       const { Timestamp } = await import("firebase/firestore");
```

---

#### 🟡 Line 195: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     192 |                 className={`w-2 h-2 rounded-full transition-colors ${
     193 |                   step === s
     194 |                     ? "bg-stone-800"
>>>  195 |                     : ["welcome", "clean-date", "sponsor", "privacy", "tour"].indexOf(step) > i
     196 |                       ? "bg-stone-400"
     197 |                       : "bg-stone-300"
     198 |                 }`}
```

---

#### 🟡 Line 515: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     512 |                 <div className="flex justify-center gap-2">
     513 |                   {tourSlides.map((_, i) => (
     514 |                     <button
>>>  515 |                       key={i}
     516 |                       onClick={() => setTourSlide(i)}
     517 |                       className={`w-2 h-2 rounded-full transition-colors ${
     518 |                         tourSlide === i ? "bg-stone-800" : "bg-stone-300"
```

---

### 📁 `tests/scripts/phase-complete-check.test.ts` (9 issues)

#### 🔵 Line N/A: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:os` over `os`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
>>>    3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 | import * as os from "node:os";
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
>>>    4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 | import * as os from "node:os";
       7 |
```

---

#### 🔵 Line 5: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
>>>    5 | import * as fs from "node:fs";
       6 | import * as os from "node:os";
       7 |
       8 | // Get project root (works both in source and compiled contexts)
```

---

#### 🔵 Line 6: Prefer `node:os` over `os`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
>>>    6 | import * as os from "node:os";
       7 |
       8 | // Get project root (works both in source and compiled contexts)
       9 | // When compiled, __dirname is dist-tests/tests/scripts, so go up 3 levels
```

---

#### 🔵 Line 49: Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read.

- **Rule**: `typescript:S6606`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      46 |   let cachedAutoResult: { stdout: string; stderr: string; exitCode: number } | null = null;
      47 |
      48 |   function getAutoModeResult() {
>>>   49 |     if (!cachedAutoResult) {
      50 |       cachedAutoResult = runScript(["--auto"]);
      51 |     }
      52 |     return cachedAutoResult;
```

---

### 📁 `scripts/log-session-activity.js` (9 issues)

#### 🔵 Line 24: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      21 |  * Output: .claude/session-activity.jsonl
      22 |  */
      23 |
>>>   24 | const fs = require("node:fs");
      25 | const path = require("node:path");
      26 | const { spawnSync } = require("node:child_process");
      27 |
```

---

#### 🔵 Line 25: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      22 |  */
      23 |
      24 | const fs = require("node:fs");
>>>   25 | const path = require("node:path");
      26 | const { spawnSync } = require("node:child_process");
      27 |
      28 | // Get repository root for consistent log location
```

---

#### 🔵 Line 26: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      23 |
      24 | const fs = require("node:fs");
      25 | const path = require("node:path");
>>>   26 | const { spawnSync } = require("node:child_process");
      27 |
      28 | // Get repository root for consistent log location
      29 | function getRepoRoot() {
```

---

#### 🟡 Line 50: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
      47 |   // Tokens with 24+ chars containing both letters and digits
      48 |   /\b(?=[A-Za-z0-9_-]{24,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]+\b/g,
      49 |   // Bearer tokens
>>>   50 |   /bearer\s+[A-Za-z0-9._-]+/gi,
      51 |   // Basic auth
      52 |   /basic\s+[A-Za-z0-9+/=]+/gi,
      53 |   // Key=value patterns with sensitive names
```

---

#### 🟡 Line 52: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
      49 |   // Bearer tokens
      50 |   /bearer\s+[A-Za-z0-9._-]+/gi,
      51 |   // Basic auth
>>>   52 |   /basic\s+[A-Za-z0-9+/=]+/gi,
      53 |   // Key=value patterns with sensitive names
      54 |   /(?:api[_-]?key|token|secret|password|auth|credential)[=:]\s*\S+/gi,
      55 | ];
```

---

#### 🔵 Line 68: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      65 |
      66 |   // Strip control characters (keep tab \x09, newline \x0A, carriage return \x0D)
      67 |   // eslint-disable-next-line no-control-regex
>>>   68 |   let sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
      69 |
      70 |   // Redact potential secrets
      71 |   for (const pattern of SECRET_PATTERNS) {
```

---

#### 🟠 Line 239: Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 22min

```js
     236 | }
     237 |
     238 | // Generate session summary
>>>  239 | function generateSummary() {
     240 |   const events = getCurrentSessionEvents();
     241 |
     242 |   if (events.length === 0) {
```

---

#### 🟡 Line 416: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     413 |     process.exit(2);
     414 |   }
     415 |   console.log(
>>>  416 |     `Logged: ${args.event}${args.file ? ` (${args.file})` : ""}${args.skill ? ` (${args.skill})` : ""}`
     417 |   );
     418 | }
     419 |
```

---

#### 🟡 Line 416: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     413 |     process.exit(2);
     414 |   }
     415 |   console.log(
>>>  416 |     `Logged: ${args.event}${args.file ? ` (${args.file})` : ""}${args.skill ? ` (${args.skill})` : ""}`
     417 |   );
     418 | }
     419 |
```

---

### 📁 `components/journal/entry-wizard.tsx` (9 issues)

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 13: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      10 |   onClose: () => void;
      11 | }
      12 |
>>>   13 | export function EntryWizard({ type, onClose }: EntryWizardProps) {
      14 |   const { addEntry } = useJournal();
      15 |   const [submitting, setSubmitting] = useState(false);
      16 |
```

---

#### 🟡 Line 131: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     128 |                 "Gratitude unlocks the fullness of life."
     129 |               </p>
     130 |               {gratitudeItems.map((item, i) => (
>>>  131 |                 <div key={i} className="flex gap-3 items-center">
     132 |                   <span className="font-bold text-rose-300 font-handlee text-xl">{i + 1}.</span>
     133 |                   <input
     134 |                     value={item}
```

---

#### 🟡 Line 152: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     149 |           {type === "inventory" && (
     150 |             <div className="space-y-4">
     151 |               <div className="space-y-1">
>>>  152 |                 <label className="text-xs font-bold text-slate-400 uppercase">
     153 |                   Resentments / Anger
     154 |                 </label>
     155 |                 <textarea
```

---

#### 🟡 Line 162: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     159 |                 />
     160 |               </div>
     161 |               <div className="space-y-1">
>>>  162 |                 <label className="text-xs font-bold text-slate-400 uppercase">
     163 |                   Fear / Dishonesty
     164 |                 </label>
     165 |                 <textarea
```

---

#### 🟡 Line 172: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     169 |                 />
     170 |               </div>
     171 |               <div className="space-y-1">
>>>  172 |                 <label className="text-xs font-bold text-slate-400 uppercase">Apologies Owed</label>
     173 |                 <textarea
     174 |                   value={inventory.apologies}
     175 |                   onChange={(e) => setInventory({ ...inventory, apologies: e.target.value })}
```

---

#### 🟡 Line 180: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     177 |                 />
     178 |               </div>
     179 |               <div className="space-y-1">
>>>  180 |                 <label className="text-xs font-bold text-slate-400 uppercase">
     181 |                   Successes / Wins
     182 |                 </label>
     183 |                 <textarea
```

---

### 📁 `components/notebook/features/enhanced-mood-selector.tsx` (9 issues)

#### 🔵 Line N/A: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Use <details>, <fieldset>, <optgroup>, or <address> instead of the "group" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 50: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      47 |   },
      48 | ];
      49 |
>>>   50 | export function EnhancedMoodSelector({
      51 |   value,
      52 |   onChange,
      53 |   showKeyboardShortcuts = true,
```

---

#### 🔵 Line 76: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      73 |       }
      74 |     };
      75 |
>>>   76 |     window.addEventListener("keypress", handleKeyPress);
      77 |     return () => window.removeEventListener("keypress", handleKeyPress);
      78 |   }, [showKeyboardShortcuts, onChange]);
      79 |
```

---

#### 🔵 Line 77: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      74 |     };
      75 |
      76 |     window.addEventListener("keypress", handleKeyPress);
>>>   77 |     return () => window.removeEventListener("keypress", handleKeyPress);
      78 |   }, [showKeyboardShortcuts, onChange]);
      79 |
      80 |   return (
```

---

#### 🟡 Line 82: Use <details>, <fieldset>, <optgroup>, or <address> instead of the "group" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      79 |
      80 |   return (
      81 |     <div className="overflow-visible px-8 -mx-8 py-4 -my-4">
>>>   82 |       <div
      83 |         className="flex justify-between gap-1 mb-2 overflow-visible"
      84 |         role="group"
      85 |         aria-label="Mood selection"
```

---

#### 🟡 Line 102: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      99 |               className={`relative flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
     100 |                 isSelected
     101 |                   ? `${m.bg} scale-110 shadow-lg ring-2 ${m.ring}`
>>>  102 |                   : isHovered
     103 |                     ? `${m.bg} scale-105`
     104 |                     : "hover:bg-amber-50/50"
     105 |               }`}
```

---

### 📁 `components/notebook/pages/today-page.tsx` (9 issues)

#### 🔵 Line N/A: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `typescript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 4: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       1 | "use client";
       2 |
       3 | import { useState, useEffect, useRef, useCallback, useMemo } from "react";
>>>    4 | import { useAuth } from "@/components/providers/auth-provider";
       5 | import { useCelebration } from "@/components/celebrations/celebration-provider";
       6 | import { FirestoreService } from "@/lib/firestore-service";
       7 | import { intervalToDuration, subDays, startOfDay, format, differenceInDays } from "date-fns";
```

---

#### 🔵 Line 40: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      37 |  * @param onNavigate - Callback invoked to navigate to a NotebookModuleId (used by the quick actions FAB)
      38 |  * @returns The Today page React element containing all interactive controls and layout for daily check-ins and notes
      39 |  */
>>>   40 | export default function TodayPage({ nickname, onNavigate }: TodayPageProps) {
      41 |   const [mood, setMood] = useState<string | null>(null);
      42 |   const [cravings, setCravings] = useState<boolean | null>(null);
      43 |   const [used, setUsed] = useState<boolean | null>(null);
```

---

#### 🔵 Line 74: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      71 |   // Track save completion timeout for cleanup
      72 |   const saveCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      73 |
>>>   74 |   const { user, profile } = useAuth();
      75 |   const { celebrate } = useCelebration();
      76 |   const referenceDate = useMemo(() => new Date(), []);
      77 |   const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
```

---

#### 🔵 Line 122: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `typescript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     119 |       {
     120 |         id: "halt",
     121 |         label: "HALT",
>>>  122 |         completed: haltSubmitted || Object.values(haltCheck).some((v) => v),
     123 |       },
     124 |     ];
     125 |     const currentStep = steps.filter((s) => s.completed).length;
```

---

#### 🟡 Line 177: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     174 |         }
     175 |
     176 |         // Save notes as separate sticky note entry
>>>  177 |         if (data.journalEntry && data.journalEntry.trim()) {
     178 |           await FirestoreService.saveNotebookJournalEntry(user.uid, {
     179 |             type: "free-write",
     180 |             data: {
```

---

#### 🟠 Line 337: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

```tsx
     334 |                 if (data.content && !isEditingRef.current) {
     335 |                   setJournalEntry(data.content);
     336 |                   // Position cursor at end of text on load for both textareas
>>>  337 |                   setTimeout(() => {
     338 |                     const len = data.content.length;
     339 |                     if (desktopTextareaRef.current) {
     340 |                       desktopTextareaRef.current.setSelectionRange(len, len);
```

---

#### 🟠 Line 651: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```tsx
     648 |   const dateString = formatDateForDisplay(referenceDate);
     649 |
     650 |   // Calculate clean time dynamically with minutes
>>>  651 |   const getCleanTime = () => {
     652 |     if (!profile?.cleanStart) return null;
     653 |
     654 |     // Handle Firestore Timestamp or Date object
```

---

#### 🟡 Line 803: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     800 |               {cleanTimeDisplay ? (
     801 |                 <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
     802 |                   {cleanTimeDisplay.map((part, index) => (
>>>  803 |                     <span key={index} className="text-center">
     804 |                       <span className={`font-heading-alt ${part.size} text-amber-900`}>
     805 |                         {part.text}
     806 |                       </span>
```

---

### 📁 `scripts/add-false-positive.js` (9 issues)

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟠 Line 139: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```js
     136 |   return entry;
     137 | }
     138 |
>>>  139 | function listFalsePositives(categoryFilter) {
     140 |   const fps = loadFalsePositives();
     141 |   const filtered = categoryFilter ? fps.filter((fp) => fp.category === categoryFilter) : fps;
     142 |
```

---

#### 🟡 Line 252: Remove this assignment of "i".

- **Rule**: `javascript:S2310`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     249 |     } else if (arg === "--interactive") {
     250 |       parsed.interactive = true;
     251 |     } else if (arg === "--pattern" && args[i + 1]) {
>>>  252 |       parsed.pattern = args[++i];
     253 |     } else if (arg === "--category" && args[i + 1]) {
     254 |       parsed.category = args[++i];
     255 |     } else if (arg === "--reason" && args[i + 1]) {
```

---

#### 🟡 Line 254: Remove this assignment of "i".

- **Rule**: `javascript:S2310`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     251 |     } else if (arg === "--pattern" && args[i + 1]) {
     252 |       parsed.pattern = args[++i];
     253 |     } else if (arg === "--category" && args[i + 1]) {
>>>  254 |       parsed.category = args[++i];
     255 |     } else if (arg === "--reason" && args[i + 1]) {
     256 |       parsed.reason = args[++i];
     257 |     } else if (arg === "--source" && args[i + 1]) {
```

---

#### 🟡 Line 256: Remove this assignment of "i".

- **Rule**: `javascript:S2310`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     253 |     } else if (arg === "--category" && args[i + 1]) {
     254 |       parsed.category = args[++i];
     255 |     } else if (arg === "--reason" && args[i + 1]) {
>>>  256 |       parsed.reason = args[++i];
     257 |     } else if (arg === "--source" && args[i + 1]) {
     258 |       parsed.source = args[++i];
     259 |     } else if (arg === "--expires" && args[i + 1]) {
```

---

#### 🟡 Line 258: Remove this assignment of "i".

- **Rule**: `javascript:S2310`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     255 |     } else if (arg === "--reason" && args[i + 1]) {
     256 |       parsed.reason = args[++i];
     257 |     } else if (arg === "--source" && args[i + 1]) {
>>>  258 |       parsed.source = args[++i];
     259 |     } else if (arg === "--expires" && args[i + 1]) {
     260 |       parsed.expires = args[++i];
     261 |     } else if (arg === "--help" || arg === "-h") {
```

---

#### 🟡 Line 260: Remove this assignment of "i".

- **Rule**: `javascript:S2310`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     257 |     } else if (arg === "--source" && args[i + 1]) {
     258 |       parsed.source = args[++i];
     259 |     } else if (arg === "--expires" && args[i + 1]) {
>>>  260 |       parsed.expires = args[++i];
     261 |     } else if (arg === "--help" || arg === "-h") {
     262 |       parsed.help = true;
     263 |     }
```

---

#### 🔵 Line 270: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     267 | }
     268 |
     269 | function showHelp() {
>>>  270 |   console.log(`
     271 | add-false-positive.js - Add entries to the FALSE_POSITIVES.jsonl database
     272 |
     273 | Usage:
```

---

#### 🟡 Line 370: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     367 |   console.log(JSON.stringify(saved, null, 2));
     368 | }
     369 |
>>>  370 | main().catch((err) => {
     371 |   console.error("Error:", err.message);
     372 |   process.exit(1);
     373 | });
```

---

### 📁 `scripts/seed-meetings.ts` (9 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Group parts of the regex together to make the intended operator precedence explicit.

- **Rule**: `typescript:S5850`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 9: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       6 |  */
       7 |
       8 | import admin from "firebase-admin";
>>>    9 | import { readFileSync } from "node:fs";
      10 | import { join } from "node:path";
      11 | import { sanitizeError } from "./lib/sanitize-error.js";
      12 |
```

---

#### 🔵 Line 10: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       7 |
       8 | import admin from "firebase-admin";
       9 | import { readFileSync } from "node:fs";
>>>   10 | import { join } from "node:path";
      11 | import { sanitizeError } from "./lib/sanitize-error.js";
      12 |
      13 | // Initialize Firebase Admin
```

---

#### 🔵 Line 42: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      39 |   const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      40 |   if (!match) return timeStr;
      41 |
>>>   42 |   let hours = parseInt(match[1], 10);
      43 |   const minutes = match[2];
      44 |   const period = match[3].toUpperCase();
      45 |
```

---

#### 🔵 Line 79: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      76 |     // CSV split handling quotes
      77 |     const cols = line
      78 |       .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
>>>   79 |       .map((s) => s.trim().replace(/^"|"$/g, ""));
      80 |
      81 |     if (cols.length < 7) {
      82 |       console.warn(`Skipping invalid line ${i + 2}: ${line}`);
```

---

#### 🟡 Line 79: Group parts of the regex together to make the intended operator precedence explicit.

- **Rule**: `typescript:S5850`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 10min

```ts
      76 |     // CSV split handling quotes
      77 |     const cols = line
      78 |       .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
>>>   79 |       .map((s) => s.trim().replace(/^"|"$/g, ""));
      80 |
      81 |     if (cols.length < 7) {
      82 |       console.warn(`Skipping invalid line ${i + 2}: ${line}`);
```

---

#### 🟡 Line 133: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     130 |   process.exit(0);
     131 | }
     132 |
>>>  133 | importMeetings().catch((error) => {
     134 |   // Use sanitizeError to avoid exposing sensitive paths
     135 |   console.error("❌ Import failed:", sanitizeError(error));
     136 |   process.exit(1);
```

---

### 📁 `scripts/seed-real-data.ts` (9 issues)

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:readline` over `readline`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 1: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
>>>    1 | import * as fs from "node:fs";
       2 | import * as readline from "node:readline";
       3 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       4 | import { getFirestore } from "firebase-admin/firestore";
```

---

#### 🔵 Line 2: Prefer `node:readline` over `readline`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import * as fs from "node:fs";
>>>    2 | import * as readline from "node:readline";
       3 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       4 | import { getFirestore } from "firebase-admin/firestore";
       5 | import fetch from "node-fetch"; // Ensure request is installed or use global fetch if available (Node 18+)
```

---

#### 🔵 Line 92: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      89 |       const res = await fetch(url, { headers: { "User-Agent": "SonashApp/1.0" } });
      90 |       const data: Array<{ lat: string; lon: string }> = await res.json();
      91 |       if (data && data.length > 0) {
>>>   92 |         const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      93 |         geocodingCache[address] = loc;
      94 |         process.stdout.write("."); // Progress dot
      95 |         return loc;
```

---

#### 🔵 Line 92: Prefer `Number.parseFloat` over `parseFloat`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      89 |       const res = await fetch(url, { headers: { "User-Agent": "SonashApp/1.0" } });
      90 |       const data: Array<{ lat: string; lon: string }> = await res.json();
      91 |       if (data && data.length > 0) {
>>>   92 |         const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      93 |         geocodingCache[address] = loc;
      94 |         process.stdout.write("."); // Progress dot
      95 |         return loc;
```

---

#### 🔵 Line 129: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     126 |     // Basic converter
     127 |     const [timePart, modifier] = time.split(" ");
     128 |     const [hours, minutes] = timePart.split(":");
>>>  129 |     if (modifier.toLowerCase() === "pm" && hours !== "12") hours = String(parseInt(hours) + 12);
     130 |     if (modifier.toLowerCase() === "am" && hours === "12") hours = "00";
     131 |     time24 = `${hours.padStart(2, "0")}:${minutes || "00"}`;
     132 |   }
```

---

#### 🟡 Line 223: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     220 |   console.log("\nDone! Success.");
     221 | }
     222 |
>>>  223 | main().catch((error: unknown) => {
     224 |   console.error("❌ Unexpected error:", sanitizeError(error));
     225 |   process.exit(1);
     226 | });
```

---

### 📁 `components/notebook/book-cover.tsx` (9 issues)

#### 🔵 Line 7: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       4 | import Image from "next/image";
       5 | import dynamic from "next/dynamic";
       6 | import { useEffect, useMemo, useState } from "react";
>>>    7 | import { useAuth } from "@/components/providers/auth-provider";
       8 | import { differenceInDays } from "date-fns";
       9 | import { logger } from "@/lib/logger";
      10 | import { parseFirebaseTimestamp } from "@/lib/types/firebase-guards";
```

---

#### 🔵 Line 26: 'nickname' PropType is defined but prop is never used

- **Rule**: `typescript:S6767`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      23 | interface BookCoverProps {
      24 |   onOpen: () => void;
      25 |   isAnimating?: boolean;
>>>   26 |   nickname?: string; // Fallback prop
      27 |   cleanDays?: number; // Fallback prop
      28 | }
      29 |
```

---

#### 🔵 Line 27: 'cleanDays' PropType is defined but prop is never used

- **Rule**: `typescript:S6767`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      24 |   onOpen: () => void;
      25 |   isAnimating?: boolean;
      26 |   nickname?: string; // Fallback prop
>>>   27 |   cleanDays?: number; // Fallback prop
      28 | }
      29 |
      30 | export default function BookCover({ onOpen, isAnimating = false }: BookCoverProps) {
```

---

#### 🔵 Line 30: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      27 |   cleanDays?: number; // Fallback prop
      28 | }
      29 |
>>>   30 | export default function BookCover({ onOpen, isAnimating = false }: BookCoverProps) {
      31 |   const { user, profile, loading } = useAuth();
      32 |   const [viewportWidth, setViewportWidth] = useState(0);
      33 |   const [showSignIn, setShowSignIn] = useState(false);
```

---

#### 🔵 Line 31: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      28 | }
      29 |
      30 | export default function BookCover({ onOpen, isAnimating = false }: BookCoverProps) {
>>>   31 |   const { user, profile, loading } = useAuth();
      32 |   const [viewportWidth, setViewportWidth] = useState(0);
      33 |   const [showSignIn, setShowSignIn] = useState(false);
      34 |   const [showOnboarding, setShowOnboarding] = useState(false);
```

---

#### 🔵 Line 37: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      34 |   const [showOnboarding, setShowOnboarding] = useState(false);
      35 |
      36 |   useEffect(() => {
>>>   37 |     if (typeof window === "undefined") return;
      38 |
      39 |     const updateDimensions = () => setViewportWidth(window.innerWidth);
      40 |     updateDimensions();
```

---

#### 🔵 Line 158: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     155 |             duration: 1.2,
     156 |             ease: [0.4, 0, 0.2, 1],
     157 |           }}
>>>  158 |           whileHover={!isAnimating ? { scale: 1.02, y: -8 } : {}}
     159 |           whileTap={!isAnimating ? { scale: 0.98 } : {}}
     160 |         >
     161 |           <Image
```

---

#### 🔵 Line 159: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     156 |             ease: [0.4, 0, 0.2, 1],
     157 |           }}
     158 |           whileHover={!isAnimating ? { scale: 1.02, y: -8 } : {}}
>>>  159 |           whileTap={!isAnimating ? { scale: 0.98 } : {}}
     160 |         >
     161 |           <Image
     162 |             src="/images/notebook-cover-blank.png"
```

---

#### 🟡 Line 252: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     249 |             {/* Clean days counter OR Sign In CTA */}
     250 |             <div className="flex flex-col items-center mt-auto">
     251 |               {user ? (
>>>  252 |                 isProfileComplete ? (
     253 |                   <p
     254 |                     className="font-shortstack text-center leading-snug text-lg md:text-xl"
     255 |                     style={{
```

---

### 📁 `tests/scripts/surface-lessons-learned.test.ts` (8 issues)

#### 🔵 Line N/A: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:os` over `os`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
>>>    3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 | import * as os from "node:os";
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
>>>    4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 | import * as os from "node:os";
       7 |
```

---

#### 🔵 Line 5: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
>>>    5 | import * as fs from "node:fs";
       6 | import * as os from "node:os";
       7 |
       8 | // Get project root (works both in source and compiled contexts)
```

---

#### 🔵 Line 6: Prefer `node:os` over `os`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
>>>    6 | import * as os from "node:os";
       7 |
       8 | // Get project root (works both in source and compiled contexts)
       9 | // When compiled, __dirname is dist-tests/tests/scripts, so go up 3 levels
```

---

### 📁 `components/admin/links-tab.tsx` (8 issues)

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟠 Line 79: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
      76 |   useTabRefresh("links", loadLinks, { skipInitial: true });
      77 |
      78 |   useEffect(() => {
>>>   79 |     void loadLinks();
      80 |   }, [loadLinks]);
      81 |
      82 |   function handleEdit(link: QuickLink) {
```

---

#### 🟠 Line 127: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     124 |       toast.error("Failed to save link");
     125 |     } finally {
     126 |       setDialogOpen(false);
>>>  127 |       void loadLinks();
     128 |     }
     129 |   }
     130 |
```

---

#### 🟠 Line 141: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     138 |       logger.error("Failed to delete link", { error, linkId: id });
     139 |       toast.error("Failed to delete link");
     140 |     } finally {
>>>  141 |       void loadLinks();
     142 |     }
     143 |   }
     144 |
```

---

#### 🟠 Line 153: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     150 |       logger.error("Failed to update link", { error, linkId: id });
     151 |       toast.error("Failed to update link");
     152 |     } finally {
>>>  153 |       void loadLinks();
     154 |     }
     155 |   }
     156 |
```

---

#### 🔵 Line 252: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     249 |                   type="number"
     250 |                   value={formData.order}
     251 |                   onChange={(e) =>
>>>  252 |                     setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
     253 |                   }
     254 |                 />
     255 |               </div>
```

---

#### 🔵 Line 288: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     285 |                   <div
     286 |                     key={link.id}
     287 |                     className={`flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg ${
>>>  288 |                       !link.isActive ? "opacity-50" : ""
     289 |                     }`}
     290 |                   >
     291 |                     <div className="flex-1">
```

---

### 📁 `components/admin/prayers-tab.tsx` (8 issues)

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟠 Line 75: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
      72 |   useTabRefresh("prayers", loadPrayers, { skipInitial: true });
      73 |
      74 |   useEffect(() => {
>>>   75 |     void loadPrayers();
      76 |   }, [loadPrayers]);
      77 |
      78 |   function handleEdit(prayer: Prayer) {
```

---

#### 🟠 Line 121: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     118 |       toast.error("Failed to save prayer");
     119 |     } finally {
     120 |       setDialogOpen(false);
>>>  121 |       void loadPrayers();
     122 |     }
     123 |   }
     124 |
```

---

#### 🟠 Line 135: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     132 |       logger.error("Failed to delete prayer", { error, prayerId: id });
     133 |       toast.error("Failed to delete prayer");
     134 |     } finally {
>>>  135 |       void loadPrayers();
     136 |     }
     137 |   }
     138 |
```

---

#### 🟠 Line 147: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     144 |       logger.error("Failed to update prayer", { error, prayerId: id });
     145 |       toast.error("Failed to update prayer");
     146 |     } finally {
>>>  147 |       void loadPrayers();
     148 |     }
     149 |   }
     150 |
```

---

#### 🔵 Line 238: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     235 |                   type="number"
     236 |                   value={formData.order}
     237 |                   onChange={(e) =>
>>>  238 |                     setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
     239 |                   }
     240 |                 />
     241 |               </div>
```

---

#### 🔵 Line 274: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     271 |                   <div
     272 |                     key={prayer.id}
     273 |                     className={`p-4 bg-white border border-purple-100 rounded-lg ${
>>>  274 |                       !prayer.isActive ? "opacity-50" : ""
     275 |                     }`}
     276 |                   >
     277 |                     <div className="flex justify-between items-start mb-2">
```

---

### 📁 `components/admin/privileges-tab.tsx` (8 issues)

#### 🔵 Line 31: `BUILT_IN_TYPES` should be a `Set`, and use `BUILT_IN_TYPES.has()` to check existence or non-existence.

- **Rule**: `typescript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      28 | }
      29 |
      30 | // Built-in types that cannot be deleted (but can be viewed)
>>>   31 | const BUILT_IN_TYPES = ["admin", "free", "premium"];
      32 |
      33 | // Available feature permissions that can be assigned
      34 | const AVAILABLE_FEATURES = [
```

---

#### 🟡 Line 298: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     295 |           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     296 |             {/* ID Field */}
     297 |             <div>
>>>  298 |               <label className="block text-sm font-medium text-amber-900 mb-1">
     299 |                 ID <span className="text-red-500">*</span>
     300 |               </label>
     301 |               <input
```

---

#### 🔵 Line 305: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     302 |                 type="text"
     303 |                 value={formId}
     304 |                 onChange={(e) => {
>>>  305 |                   const normalized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
     306 |                   setFormId(normalized.replace(/^[^a-z]+/, ""));
     307 |                 }}
     308 |                 disabled={!!editingType}
```

---

#### 🟡 Line 319: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     316 |
     317 |             {/* Name Field */}
     318 |             <div>
>>>  319 |               <label className="block text-sm font-medium text-amber-900 mb-1">
     320 |                 Display Name <span className="text-red-500">*</span>
     321 |               </label>
     322 |               <input
```

---

#### 🟡 Line 334: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     331 |
     332 |           {/* Description Field */}
     333 |           <div>
>>>  334 |             <label className="block text-sm font-medium text-amber-900 mb-1">Description</label>
     335 |             <textarea
     336 |               value={formDescription}
     337 |               onChange={(e) => setFormDescription(e.target.value)}
```

---

#### 🟡 Line 346: Use <input type="checkbox"> instead of the "checkbox" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     343 |
     344 |           {/* Default Checkbox */}
     345 |           <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
>>>  346 |             <button
     347 |               type="button"
     348 |               role="checkbox"
     349 |               aria-checked={formIsDefault}
```

---

#### 🟡 Line 478: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     475 |                           className={`w-5 h-5 ${
     476 |                             type.id === "admin"
     477 |                               ? "text-red-500"
>>>  478 |                               : type.id === "premium"
     479 |                                 ? "text-purple-500"
     480 |                                 : "text-amber-500"
     481 |                           }`}
```

---

#### 🔵 Line 509: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     506 |                               key={f}
     507 |                               className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
     508 |                             >
>>>  509 |                               {f.replace(/_/g, " ")}
     510 |                             </span>
     511 |                           ))
     512 |                         ) : (
```

---

### 📁 `components/admin/dashboard-tab.tsx` (8 issues)

#### 🟠 Line 94: Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 22min

```tsx
      91 |   subcollectionEstimate?: number;
      92 | }
      93 |
>>>   94 | export function DashboardTab() {
      95 |   const [health, setHealth] = useState<HealthCheck | null>(null);
      96 |   const [stats, setStats] = useState<DashboardStats | null>(null);
      97 |   const [loading, setLoading] = useState(true);
```

---

#### 🟡 Line 220: Move function 'formatBytes' to the outer scope.

- **Rule**: `typescript:S7721`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     217 |     }
     218 |   }
     219 |
>>>  220 |   function formatBytes(bytes: number): string {
     221 |     if (bytes === 0) return "0 B";
     222 |     const k = 1024;
     223 |     const sizes = ["B", "KB", "MB", "GB"];
```

---

#### 🟡 Line 422: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     419 |               )}
     420 |             </div>
     421 |           </div>
>>>  422 |         ) : storageError ? (
     423 |           <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
     424 |             <XCircle className="w-5 h-5" />
     425 |             {storageError}
```

---

#### 🟡 Line 499: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     496 |               ))}
     497 |             </div>
     498 |           </div>
>>>  499 |         ) : rateLimitsError ? (
     500 |           <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
     501 |             <XCircle className="w-5 h-5" />
     502 |             {rateLimitsError}
```

---

#### 🟡 Line 504: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     501 |             <XCircle className="w-5 h-5" />
     502 |             {rateLimitsError}
     503 |           </div>
>>>  504 |         ) : loadingRateLimits ? null : (
     505 |           <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center text-green-700">
     506 |             No active rate limits
     507 |           </div>
```

---

#### 🟡 Line 554: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     551 |               ))}
     552 |             </div>
     553 |           </div>
>>>  554 |         ) : collectionsError ? (
     555 |           <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
     556 |             <XCircle className="w-5 h-5" />
     557 |             {collectionsError}
```

---

#### 🟡 Line 614: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     611 |                       className={`px-2 py-1 rounded text-xs font-medium ${
     612 |                         job.lastRunStatus === "success"
     613 |                           ? "bg-green-100 text-green-800"
>>>  614 |                           : job.lastRunStatus === "failed"
     615 |                             ? "bg-red-100 text-red-800"
     616 |                             : "bg-gray-100 text-gray-800"
     617 |                       }`}
```

---

#### 🟡 Line 644: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     641 |                           className={`px-2 py-0.5 rounded text-xs font-medium ${
     642 |                             log.level === "error"
     643 |                               ? "bg-red-100 text-red-800"
>>>  644 |                               : log.level === "warn"
     645 |                                 ? "bg-yellow-100 text-yellow-800"
     646 |                                 : "bg-blue-100 text-blue-800"
     647 |                           }`}
```

---

### 📁 `functions/src/jobs.ts` (7 issues)

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 11min

---

#### 🟡 Line N/A: Remove this useless assignment to variable "hasMore".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

---

#### 🟠 Line 196: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```ts
     193 |  * SECURITY NOTE: This job assumes Storage rules enforce user-uploads/{userId}/ prefixes.
     194 |  * Verify Storage ACLs restrict writes to user's own prefix before relying on this cleanup.
     195 |  */
>>>  196 | export async function cleanupOrphanedStorageFiles(): Promise<{
     197 |   checked: number;
     198 |   deleted: number;
     199 |   errors: number;
```

---

#### 🟡 Line 433: Remove this useless assignment to variable "hasMore".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```ts
     430 |     const snapshot = await oldLogsQuery.get();
     431 |
     432 |     if (snapshot.empty) {
>>>  433 |       hasMore = false;
     434 |       break;
     435 |     }
     436 |
```

---

#### 🟡 Line 621: Remove this useless assignment to variable "hasMore".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```ts
     618 |       .get();
     619 |
     620 |     if (snapshot.empty) {
>>>  621 |       hasMore = false;
     622 |       break;
     623 |     }
     624 |
```

---

#### 🟠 Line 653: Refactor this function to reduce its Cognitive Complexity from 42 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 32min

```ts
     650 |  * AUDIT: Logs security event for each deleted user (with hashed UID)
     651 |  * COMPLETENESS: Processes in batches until all eligible users are deleted (not just first 50)
     652 |  */
>>>  653 | export async function hardDeleteSoftDeletedUsers(): Promise<{
     654 |   processed: number;
     655 |   deleted: number;
     656 |   errors: number;
```

---

#### 🟡 Line 826: Remove this useless assignment to variable "hasMore".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```ts
     823 |     const snapshot = await db.collection(collectionPath).limit(500).get();
     824 |
     825 |     if (snapshot.empty) {
>>>  826 |       hasMore = false;
     827 |       break;
     828 |     }
     829 |
```

---

### 📁 `functions/src/security-logger.ts` (7 issues)

#### 🔵 Line 10: Prefer `node:crypto` over `crypto`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       7 |  */
       8 |
       9 | import * as Sentry from "@sentry/node";
>>>   10 | import { createHash } from "node:crypto";
      11 | import * as admin from "firebase-admin";
      12 |
      13 | // Security event types
```

---

#### 🔵 Line 277: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     274 |     input
     275 |       // Email addresses (RFC 5321: local≤64, domain≤255, TLD≤63)
     276 |       // SECURITY: Bounded quantifiers prevent ReDoS
>>>  277 |       .replace(/[\w.+-]{1,64}@[\w.-]{1,255}\.[a-z]{2,63}/gi, "[EMAIL]")
     278 |       // Phone numbers (various formats)
     279 |       .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE]")
     280 |       // IPv4 addresses (except localhost/private ranges for debugging)
```

---

#### 🔵 Line 279: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     276 |       // SECURITY: Bounded quantifiers prevent ReDoS
     277 |       .replace(/[\w.+-]{1,64}@[\w.-]{1,255}\.[a-z]{2,63}/gi, "[EMAIL]")
     278 |       // Phone numbers (various formats)
>>>  279 |       .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE]")
     280 |       // IPv4 addresses (except localhost/private ranges for debugging)
     281 |       .replace(
     282 |         /\b(?!127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
```

---

#### 🔵 Line 281: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     278 |       // Phone numbers (various formats)
     279 |       .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE]")
     280 |       // IPv4 addresses (except localhost/private ranges for debugging)
>>>  281 |       .replace(
     282 |         /\b(?!127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
     283 |         "[IP]"
     284 |       )
```

---

#### 🔵 Line 286: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     283 |         "[IP]"
     284 |       )
     285 |       // File paths with usernames (Windows/Unix)
>>>  286 |       .replace(/(?:\/home\/|\/Users\/|C:\\Users\\)[^\s\\/]+/gi, "[USER_PATH]")
     287 |       // JWT tokens (3 base64 segments)
     288 |       .replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, "[JWT]")
     289 |   );
```

---

#### 🔵 Line 288: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     285 |       // File paths with usernames (Windows/Unix)
     286 |       .replace(/(?:\/home\/|\/Users\/|C:\\Users\\)[^\s\\/]+/gi, "[USER_PATH]")
     287 |       // JWT tokens (3 base64 segments)
>>>  288 |       .replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, "[JWT]")
     289 |   );
     290 | }
     291 |
```

---

#### 🔵 Line 392: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     389 |       // Remove any potential PII from error messages
     390 |       if (event.message) {
     391 |         // Strip email-like patterns
>>>  392 |         event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL_REDACTED]");
     393 |       }
     394 |       return event;
     395 |     },
```

---

### 📁 `scripts/check-cross-doc-deps.js` (7 issues)

#### 🔵 Line 24: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      21 |  * Created: Session #69 (2026-01-16)
      22 |  */
      23 |
>>>   24 | const { execFileSync } = require("node:child_process");
      25 |
      26 | // Parse arguments
      27 | const args = process.argv.slice(2);
```

---

#### 🔵 Line 27: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      24 | const { execFileSync } = require("node:child_process");
      25 |
      26 | // Parse arguments
>>>   27 | const args = process.argv.slice(2);
      28 | const verbose = args.includes("--verbose");
      29 | const dryRun = args.includes("--dry-run");
      30 |
```

---

#### 🔵 Line 166: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     163 |   const isDirTrigger = trigger.endsWith("/");
     164 |   const isBareName = !trigger.includes("/");
     165 |   // Normalize trigger: backslash→forward, lowercase (Review #160)
>>>  166 |   const normTrigger = trigger.replace(/\\/g, "/").toLowerCase();
     167 |
     168 |   return stagedFiles.some((file) => {
     169 |     // Normalize file path for cross-platform matching (Review #160)
```

---

#### 🔵 Line 170: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     167 |
     168 |   return stagedFiles.some((file) => {
     169 |     // Normalize file path for cross-platform matching (Review #160)
>>>  170 |     const normFile = file.replace(/\\/g, "/").toLowerCase();
     171 |
     172 |     // Handle directory triggers (ending with /)
     173 |     if (isDirTrigger) {
```

---

#### 🔵 Line 191: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     188 | function isDependentStaged(stagedFiles, dependent) {
     189 |   const isBareName = !dependent.includes("/");
     190 |   // Normalize dependent: backslash→forward, lowercase (Review #160)
>>>  191 |   const normDependent = dependent.replace(/\\/g, "/").toLowerCase();
     192 |
     193 |   return stagedFiles.some((file) => {
     194 |     // Normalize file path for cross-platform matching (Review #160)
```

---

#### 🔵 Line 195: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     192 |
     193 |   return stagedFiles.some((file) => {
     194 |     // Normalize file path for cross-platform matching (Review #160)
>>>  195 |     const normFile = file.replace(/\\/g, "/").toLowerCase();
     196 |     // Exact match first
     197 |     if (normFile === normDependent) return true;
     198 |     // For bare names, match at end of path
```

---

#### 🟠 Line 206: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
     203 | /**
     204 |  * Main check function
     205 |  */
>>>  206 | function checkDependencies() {
     207 |   log(`\n${colors.bold}📎 Cross-Document Dependency Check${colors.reset}\n`);
     208 |
     209 |   const stagedFiles = getStagedFiles();
```

---

### 📁 `scripts/log-override.js` (7 issues)

#### 🔵 Line 24: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      21 |  *   2 - Script error
      22 |  */
      23 |
>>>   24 | const fs = require("node:fs");
      25 | const path = require("node:path");
      26 | const { spawnSync } = require("node:child_process");
      27 |
```

---

#### 🔵 Line 25: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      22 |  */
      23 |
      24 | const fs = require("node:fs");
>>>   25 | const path = require("node:path");
      26 | const { spawnSync } = require("node:child_process");
      27 |
      28 | // Get repository root for consistent log location
```

---

#### 🔵 Line 26: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      23 |
      24 | const fs = require("node:fs");
      25 | const path = require("node:path");
>>>   26 | const { spawnSync } = require("node:child_process");
      27 |
      28 | // Get repository root for consistent log location
      29 | function getRepoRoot() {
```

---

#### 🟡 Line 58: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
      55 |   // Likely secret tokens: 24+ chars, must contain both letters and digits (reduces SHA/word false positives)
      56 |   /\b(?=[A-Za-z0-9_-]{24,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]+\b/g,
      57 |   // Bearer tokens
>>>   58 |   /bearer\s+[A-Za-z0-9._-]+/gi,
      59 |   // Basic auth
      60 |   /basic\s+[A-Za-z0-9+/=]+/gi,
      61 |   // Key=value patterns with sensitive names
```

---

#### 🟡 Line 60: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
      57 |   // Bearer tokens
      58 |   /bearer\s+[A-Za-z0-9._-]+/gi,
      59 |   // Basic auth
>>>   60 |   /basic\s+[A-Za-z0-9+/=]+/gi,
      61 |   // Key=value patterns with sensitive names
      62 |   /(?:api[_-]?key|token|secret|password|auth|credential)[=:]\s*\S+/gi,
      63 | ];
```

---

#### 🔵 Line 73: Prefer `String#codePointAt()` over `String#charCodeAt()`.

- **Rule**: `javascript:S7758`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      70 |   // Using character code filtering instead of regex to avoid no-control-regex lint error
      71 |   let sanitized = "";
      72 |   for (let i = 0; i < value.length && i < maxLength * 2; i++) {
>>>   73 |     const code = value.charCodeAt(i);
      74 |     // Allow printable ASCII (32-126), tab (9), newline (10), carriage return (13)
      75 |     if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
      76 |       sanitized += value[i];
```

---

#### 🔵 Line 169: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     166 | // Get current git branch
     167 | function getGitBranch() {
     168 |   try {
>>>  169 |     const { spawnSync } = require("node:child_process");
     170 |     const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
     171 |       encoding: "utf-8",
     172 |       timeout: 3000,
```

---

### 📁 `scripts/validate-skill-config.js` (7 issues)

#### 🔵 Line 25: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      22 |  *   2 - Script error
      23 |  */
      24 |
>>>   25 | const fs = require("node:fs");
      26 | const path = require("node:path");
      27 |
      28 | // Configuration
```

---

#### 🔵 Line 26: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      23 |  */
      24 |
      25 | const fs = require("node:fs");
>>>   26 | const path = require("node:path");
      27 |
      28 | // Configuration
      29 | const SKILLS_DIR = ".claude/commands";
```

---

#### 🟠 Line 98: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 12min

```js
      95 | }
      96 |
      97 | // Validate a single skill file
>>>   98 | function validateSkillFile(filePath) {
      99 |   const errors = [];
     100 |   const warnings = [];
     101 |
```

---

#### 🔵 Line 113: Remove the declaration of the unused 'isSession' variable.

- **Rule**: `javascript:S1481`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     110 |
     111 |   const filename = path.basename(filePath);
     112 |   const isAudit = filename.startsWith("audit-");
>>>  113 |   const isSession = filename.startsWith("session-");
     114 |
     115 |   // Check 1: YAML frontmatter
     116 |   const frontmatter = parseFrontmatter(content);
```

---

#### 🟡 Line 113: Remove this useless assignment to variable "isSession".

- **Rule**: `javascript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```js
     110 |
     111 |   const filename = path.basename(filePath);
     112 |   const isAudit = filename.startsWith("audit-");
>>>  113 |   const isSession = filename.startsWith("session-");
     114 |
     115 |   // Check 1: YAML frontmatter
     116 |   const frontmatter = parseFrontmatter(content);
```

---

#### 🔵 Line 118: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     115 |   // Check 1: YAML frontmatter
     116 |   const frontmatter = parseFrontmatter(content);
     117 |   if (!frontmatter) {
>>>  118 |     errors.push("Missing YAML frontmatter (---\\n...\\n---)");
     119 |   } else if (!frontmatter.description) {
     120 |     errors.push("Missing 'description' in frontmatter");
     121 |   } else if (frontmatter.description.length < 10) {
```

---

#### 🔵 Line 134: `String.raw` should be used to avoid escaping `\`.

- **Rule**: `javascript:S7780`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     131 |   // Check 3: Required sections for audit commands
     132 |   if (isAudit) {
     133 |     for (const section of REQUIRED_SECTIONS.audit) {
>>>  134 |       const sectionRegex = new RegExp(`^#+\\s+${section}`, "mi");
     135 |       if (!sectionRegex.test(content)) {
     136 |         warnings.push(`Missing recommended section: '${section}'`);
     137 |       }
```

---

### 📁 `components/journal/entry-card.tsx` (7 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 16: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      13 |   onClick?: () => void;
      14 | }
      15 |
>>>   16 | export function EntryCard({ entry, index, onClick }: EntryCardProps) {
      17 |   // Variant styles
      18 |   const getStyles = (type: string) => {
      19 |     switch (type) {
```

---

#### 🟡 Line 82: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      79 |       animate={{
      80 |         opacity: 1,
      81 |         x: 0,
>>>   82 |         rotate: entry.type === "mood" ? -2 : entry.type === "gratitude" ? 1 : 0,
      83 |       }}
      84 |       transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      85 |       onClick={onClick}
```

---

#### 🟡 Line 125: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     122 |             <h4 className="font-heading text-lg mb-2 text-[var(--journal-text)]">Gratitude</h4>
     123 |             <ul className="list-disc pl-4 text-sm font-handlee text-[var(--journal-text)]">
     124 |               {entry.data.items.slice(0, 3).map((item, i) => (
>>>  125 |                 <li key={i}>{item}</li>
     126 |               ))}
     127 |             </ul>
     128 |           </div>
```

---

#### 🟡 Line 148: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     145 |           <div className="w-full relative">
     146 |             {/* Decorative badge icon in corner */}
     147 |             <div className="absolute -top-2 -right-2 text-3xl opacity-20">
>>>  148 |               {entry.data.used === true ? "⚠️" : entry.data.cravings === true ? "⚡" : "✓"}
     149 |             </div>
     150 |
     151 |             <h4 className="font-heading text-sm mb-3 text-sky-900/90 flex items-center gap-2">
```

---

#### 🟡 Line 152: Ambiguous spacing after previous element span

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     149 |             </div>
     150 |
     151 |             <h4 className="font-heading text-sm mb-3 text-sky-900/90 flex items-center gap-2">
>>>  152 |               <span className="text-lg">📋</span>
     153 |               Check-In
     154 |             </h4>
     155 |             <div className="flex flex-col gap-1.5 text-xs font-sans">
```

---

### 📁 `scripts/validate-audit.js` (7 issues)

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟠 Line 163: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     160 |  * @param {Array<Object>} falsePositives - False positive patterns
     161 |  * @returns {Array<{finding: Object, falsePositive: Object, match: string}>} Matched false positives
     162 |  */
>>>  163 | function checkFalsePositives(findings, falsePositives) {
     164 |   const flagged = [];
     165 |
     166 |   for (const finding of findings) {
```

---

#### 🟠 Line 211: Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 24min

```js
     208 |   return flagged;
     209 | }
     210 |
>>>  211 | function validateRequiredFields(findings) {
     212 |   const issues = [];
     213 |
     214 |   for (const finding of findings) {
```

---

#### 🔵 Line 270: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     267 |
     268 |     // Validate file exists if specified (with path traversal protection)
     269 |     if (finding.file && !finding.file.includes("*")) {
>>>  270 |       if (!isSafeFilePath(finding.file)) {
     271 |         issues.push({
     272 |           type: "UNSAFE_PATH",
     273 |           findingId: finding.id,
```

---

#### 🟠 Line 443: Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 16min

```js
     440 |   }
     441 | }
     442 |
>>>  443 | function generateReport(filePath, findings, results) {
     444 |   const { falsePositives, fieldIssues, duplicates, npmCrossRef, eslintCrossRef } = results;
     445 |
     446 |   console.log("\n" + "=".repeat(80));
```

---

#### 🟡 Line 634: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     631 |   process.exit(allPassed ? 0 : 1);
     632 | }
     633 |
>>>  634 | main().catch((err) => {
     635 |   console.error("Error:", err.message);
     636 |   process.exit(1);
     637 | });
```

---

### 📁 `.claude/hooks/pattern-check.sh` (7 issues)

#### 🟡 Line 15: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      12 | PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
      13 |
      14 | # Parse file path from arguments (JSON format: {"file_path": "..."})
>>>   15 | if [[ -z "${1:-}" ]]; then
      16 |   exit 0
      17 | fi
      18 |
```

---

#### 🟡 Line 31: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      28 | )"
      29 |
      30 | # If no file path found, exit silently
>>>   31 | if [[ -z "$FILE_PATH" ]]; then
      32 |   exit 0
      33 | fi
      34 |
```

---

#### 🟠 Line 36: Add a default case (\*) to handle unexpected values.

- **Rule**: `shelldre:S131`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```sh
      33 | fi
      34 |
      35 | # SECURITY: Reject option-like and multiline paths to prevent bypass/spoofing
>>>   36 | case "$FILE_PATH" in
      37 |   -* | *$'\n'* | *$'\r'* )
      38 |     exit 0
      39 |     ;;
```

---

#### 🟡 Line 77: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      74 |
      75 | # SECURITY: Verify the resolved path is within PROJECT_DIR
      76 | # Use Node.js for portable path resolution (realpath -m not available on all systems)
>>>   77 | if [[ -f "$REL_PATH" ]]; then
      78 |   REAL_PATH="$(
      79 |     node -e 'const fs=require("fs"); try { process.stdout.write(fs.realpathSync(process.argv[1])); } catch { process.stdout.write(""); }' \
      80 |       "$REL_PATH" 2>/dev/null
```

---

#### 🟡 Line 89: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      86 |
      87 |   # Verify containment: REAL_PATH must start with REAL_PROJECT/
      88 |   # Also reject if REAL_PROJECT is root (/) to prevent bypass
>>>   89 |   if [[ -z "$REAL_PATH" ]] || [ -z "$REAL_PROJECT" ]] || [ "$REAL_PROJECT" = "/" ]]; then
      90 |     exit 0
      91 |   fi
      92 |   case "$REAL_PATH" in
```

---

#### 🟡 Line 89: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      86 |
      87 |   # Verify containment: REAL_PATH must start with REAL_PROJECT/
      88 |   # Also reject if REAL_PROJECT is root (/) to prevent bypass
>>>   89 |   if [[ -z "$REAL_PATH" ]] || [ -z "$REAL_PROJECT" ]] || [ "$REAL_PROJECT" = "/" ]]; then
      90 |     exit 0
      91 |   fi
      92 |   case "$REAL_PATH" in
```

---

#### 🟡 Line 89: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      86 |
      87 |   # Verify containment: REAL_PATH must start with REAL_PROJECT/
      88 |   # Also reject if REAL_PROJECT is root (/) to prevent bypass
>>>   89 |   if [[ -z "$REAL_PATH" ]] || [ -z "$REAL_PROJECT" ]] || [ "$REAL_PROJECT" = "/" ]]; then
      90 |     exit 0
      91 |   fi
      92 |   case "$REAL_PATH" in
```

---

### 📁 `.claude/skills/artifacts-builder/scripts/init-artifact.sh` (7 issues)

#### 🟡 Line 11: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
       8 |
       9 | echo "🔍 Detected Node.js version: $NODE_VERSION"
      10 |
>>>   11 | if [ "$NODE_VERSION" -lt 18 ]; then
      12 |   echo "❌ Error: Node.js 18 or higher is required"
      13 |   echo "   Current version: $(node -v)"
      14 |   exit 1
```

---

#### 🟡 Line 12: Redirect this error message to stderr (>&2).

- **Rule**: `shelldre:S7677`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```sh
       9 | echo "🔍 Detected Node.js version: $NODE_VERSION"
      10 |
      11 | if [ "$NODE_VERSION" -lt 18 ]; then
>>>   12 |   echo "❌ Error: Node.js 18 or higher is required"
      13 |   echo "   Current version: $(node -v)"
      14 |   exit 1
      15 | fi
```

---

#### 🟡 Line 18: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      15 | fi
      16 |
      17 | # Set Vite version based on Node version
>>>   18 | if [ "$NODE_VERSION" -ge 20 ]; then
      19 |   VITE_VERSION="latest"
      20 |   echo "✅ Using Vite latest (Node 20+)"
      21 | else
```

---

#### 🟡 Line 40: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      37 | fi
      38 |
      39 | # Check if project name is provided
>>>   40 | if [ -z "$1" ]; then
      41 |   echo "❌ Usage: ./create-react-shadcn-complete.sh <project-name>"
      42 |   exit 1
      43 | fi
```

---

#### 🟡 Line 50: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      47 | COMPONENTS_TARBALL="$SCRIPT_DIR/shadcn-components.tar.gz"
      48 |
      49 | # Check if components tarball exists
>>>   50 | if [ ! -f "$COMPONENTS_TARBALL" ]; then
      51 |   echo "❌ Error: shadcn-components.tar.gz not found in script directory"
      52 |   echo "   Expected location: $COMPONENTS_TARBALL"
      53 |   exit 1
```

---

#### 🟡 Line 51: Redirect this error message to stderr (>&2).

- **Rule**: `shelldre:S7677`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```sh
      48 |
      49 | # Check if components tarball exists
      50 | if [ ! -f "$COMPONENTS_TARBALL" ]; then
>>>   51 |   echo "❌ Error: shadcn-components.tar.gz not found in script directory"
      52 |   echo "   Expected location: $COMPONENTS_TARBALL"
      53 |   exit 1
      54 | fi
```

---

#### 🟡 Line 72: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      69 | pnpm install
      70 |
      71 | # Pin Vite version for Node 18
>>>   72 | if [ "$NODE_VERSION" -lt 20 ]; then
      73 |   echo "📌 Pinning Vite to $VITE_VERSION for Node 18 compatibility..."
      74 |   pnpm add -D vite@$VITE_VERSION
      75 | fi
```

---

### 📁 `lib/utils/storage.ts` (7 issues)

#### 🔵 Line 17: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      14 |  * @returns True if localStorage is available
      15 |  */
      16 | export function isLocalStorageAvailable(): boolean {
>>>   17 |   if (typeof window === "undefined") {
      18 |     return false;
      19 |   }
      20 |
```

---

#### 🔵 Line 23: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      20 |
      21 |   try {
      22 |     const test = "__storage_test__";
>>>   23 |     window.localStorage.setItem(test, test);
      24 |     window.localStorage.removeItem(test);
      25 |     return true;
      26 |   } catch {
```

---

#### 🔵 Line 24: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      21 |   try {
      22 |     const test = "__storage_test__";
      23 |     window.localStorage.setItem(test, test);
>>>   24 |     window.localStorage.removeItem(test);
      25 |     return true;
      26 |   } catch {
      27 |     return false;
```

---

#### 🔵 Line 42: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      39 |   }
      40 |
      41 |   try {
>>>   42 |     return window.localStorage.getItem(key);
      43 |   } catch (error) {
      44 |     logger.warn(`Failed to get localStorage item`, { key, error: getErrorMessage(error) });
      45 |     return null;
```

---

#### 🔵 Line 61: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      58 |   }
      59 |
      60 |   try {
>>>   61 |     window.localStorage.setItem(key, value);
      62 |     return true;
      63 |   } catch (error) {
      64 |     logger.warn(`Failed to set localStorage item`, { key, error: getErrorMessage(error) });
```

---

#### 🔵 Line 80: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      77 |   }
      78 |
      79 |   try {
>>>   80 |     window.localStorage.removeItem(key);
      81 |     return true;
      82 |   } catch (error) {
      83 |     logger.warn(`Failed to remove localStorage item`, { key, error: getErrorMessage(error) });
```

---

#### 🔵 Line 136: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     133 |   }
     134 |
     135 |   try {
>>>  136 |     window.localStorage.clear();
     137 |     return true;
     138 |   } catch (error) {
     139 |     logger.warn(`Failed to clear localStorage`, { error: getErrorMessage(error) });
```

---

### 📁 `scripts/verify-skill-usage.js` (6 issues)

#### 🔵 Line 25: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      22 |  *   2 - Script error
      23 |  */
      24 |
>>>   25 | const fs = require("node:fs");
      26 | const path = require("node:path");
      27 | const { spawnSync } = require("node:child_process");
      28 |
```

---

#### 🔵 Line 26: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      23 |  */
      24 |
      25 | const fs = require("node:fs");
>>>   26 | const path = require("node:path");
      27 | const { spawnSync } = require("node:child_process");
      28 |
      29 | // Get repository root for consistent log location
```

---

#### 🔵 Line 27: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      24 |
      25 | const fs = require("node:fs");
      26 | const path = require("node:path");
>>>   27 | const { spawnSync } = require("node:child_process");
      28 |
      29 | // Get repository root for consistent log location
      30 | function getRepoRoot() {
```

---

#### 🔵 Line 78: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      75 |         const resolved = path.isAbsolute(e.file)
      76 |           ? path.normalize(e.file)
      77 |           : path.resolve(REPO_ROOT, e.file);
>>>   78 |         const normalizedFile = path.relative(REPO_ROOT, resolved).replace(/\\/g, "/");
      79 |
      80 |         // If the resolved path is outside the repo or invalid, ignore it (prevents exclusion bypass)
      81 |         // Using regex to properly handle edge cases like "..hidden.md" and empty strings
```

---

#### 🟠 Line 191: Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 15min

```js
     188 | }
     189 |
     190 | // Main execution
>>>  191 | function main() {
     192 |   const args = process.argv.slice(2);
     193 |   const strict = args.includes("--strict");
     194 |   const quiet = args.includes("--quiet");
```

---

#### 🔵 Line 192: `args` should be a `Set`, and use `args.has()` to check existence or non-existence.

- **Rule**: `javascript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     189 |
     190 | // Main execution
     191 | function main() {
>>>  192 |   const args = process.argv.slice(2);
     193 |   const strict = args.includes("--strict");
     194 |   const quiet = args.includes("--quiet");
     195 |
```

---

### 📁 `scripts/check-triggers.js` (6 issues)

#### 🔵 Line 22: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      19 |  *   2 - Script error
      20 |  */
      21 |
>>>   22 | const { spawnSync } = require("node:child_process");
      23 |
      24 | // Configuration
      25 | const TRIGGERS = {
```

---

#### 🟡 Line 198: Refactor this code to not use nested template literals.

- **Rule**: `javascript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```js
     195 |     if (result.error || result.signal || result.status !== 0) {
     196 |       const errMsg =
     197 |         result.error?.message ||
>>>  198 |         `exit=${result.status}${result.signal ? ` signal=${result.signal}` : ""}`;
     199 |       console.error(`   ⚠️  Consolidation check failed: ${errMsg}`);
     200 |       return { triggered: false, name: "consolidation" };
     201 |     }
```

---

#### 🟠 Line 259: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```js
     256 | }
     257 |
     258 | // Main execution
>>>  259 | function main() {
     260 |   const args = process.argv.slice(2);
     261 |   const blockingOnly = args.includes("--blocking-only");
     262 |
```

---

#### 🔵 Line 271: Prefer `node:child_process` over `child_process`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     268 |     // Log the override for accountability
     269 |     // Using execFileSync to prevent command injection from SKIP_REASON
     270 |     try {
>>>  271 |       const { execFileSync } = require("node:child_process");
     272 |       const reason = process.env.SKIP_REASON || "";
     273 |       execFileSync("node", ["scripts/log-override.js", "--check=triggers", `--reason=${reason}`], {
     274 |         encoding: "utf-8",
```

---

#### 🔵 Line 306: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     303 |
     304 |   // Run all trigger checks
     305 |   results.push(checkSecurityTrigger(files));
>>>  306 |   results.push(checkConsolidationTrigger());
     307 |   results.push(checkSkillValidationTrigger(files));
     308 |
     309 |   // Filter and display results
```

---

#### 🔵 Line 307: Do not call `Array#push()` multiple times.

- **Rule**: `javascript:S7778`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
     304 |   // Run all trigger checks
     305 |   results.push(checkSecurityTrigger(files));
     306 |   results.push(checkConsolidationTrigger());
>>>  307 |   results.push(checkSkillValidationTrigger(files));
     308 |
     309 |   // Filter and display results
     310 |   const triggered = results.filter((r) => r.triggered);
```

---

### 📁 `components/notebook/notebook-shell.tsx` (6 issues)

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line 10: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       7 | import BookmarkRibbon from "./bookmark-ribbon";
       8 | import StickyNote from "./sticky-note";
       9 | import PlaceholderPage from "./pages/placeholder-page";
>>>   10 | import { useAuth } from "@/components/providers/auth-provider";
      11 | import { logger } from "@/lib/logger";
      12 | import { Shield, AlertTriangle } from "lucide-react";
      13 |
```

---

#### 🔵 Line 38: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      35 |   nickname: string;
      36 | }
      37 |
>>>   38 | export default function NotebookShell({ onClose, nickname }: NotebookShellProps) {
      39 |   const { isAnonymous, showLinkPrompt, profile } = useAuth();
      40 |   const tabs = notebookModules.map((module) => ({
      41 |     id: module.id,
```

---

#### 🔵 Line 39: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      36 | }
      37 |
      38 | export default function NotebookShell({ onClose, nickname }: NotebookShellProps) {
>>>   39 |   const { isAnonymous, showLinkPrompt, profile } = useAuth();
      40 |   const tabs = notebookModules.map((module) => ({
      41 |     id: module.id,
      42 |     label: module.label,
```

---

#### 🔵 Line 139: Use `new Array()` instead of `Array()`.

- **Rule**: `typescript:S7723`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     136 |
     137 |           {/* Lined paper effect */}
     138 |           <div className="absolute inset-0 pointer-events-none">
>>>  139 |             {[...Array(25)].map((_, i) => (
     140 |               <div
     141 |                 key={i}
     142 |                 className="absolute left-0 right-0 h-px bg-sky-200/30"
```

---

#### 🟡 Line 141: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     138 |           <div className="absolute inset-0 pointer-events-none">
     139 |             {[...Array(25)].map((_, i) => (
     140 |               <div
>>>  141 |                 key={i}
     142 |                 className="absolute left-0 right-0 h-px bg-sky-200/30"
     143 |                 style={{ top: `${(i + 1) * 22}px` }}
     144 |               />
```

---

### 📁 `components/status/offline-indicator.tsx` (6 issues)

#### 🔵 Line N/A: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 22: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      19 |       setShowReconnected(false);
      20 |     };
      21 |
>>>   22 |     window.addEventListener("online", handleOnline);
      23 |     window.addEventListener("offline", handleOffline);
      24 |
      25 |     return () => {
```

---

#### 🔵 Line 23: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      20 |     };
      21 |
      22 |     window.addEventListener("online", handleOnline);
>>>   23 |     window.addEventListener("offline", handleOffline);
      24 |
      25 |     return () => {
      26 |       window.removeEventListener("online", handleOnline);
```

---

#### 🔵 Line 26: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      23 |     window.addEventListener("offline", handleOffline);
      24 |
      25 |     return () => {
>>>   26 |       window.removeEventListener("online", handleOnline);
      27 |       window.removeEventListener("offline", handleOffline);
      28 |     };
      29 |   }, []);
```

---

#### 🔵 Line 27: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      24 |
      25 |     return () => {
      26 |       window.removeEventListener("online", handleOnline);
>>>   27 |       window.removeEventListener("offline", handleOffline);
      28 |     };
      29 |   }, []);
      30 |
```

---

### 📁 `scripts/import-nashville-links.ts` (6 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
>>>    3 | import { readFileSync } from "node:fs";
       4 | import { join } from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error.js";
       6 |
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
       3 | import { readFileSync } from "node:fs";
>>>    4 | import { join } from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error.js";
       6 |
       7 | // Initialize Firebase Admin
```

---

#### 🔵 Line 206: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     203 |       // Use deterministic ID for idempotency (avoid composite index requirement)
     204 |       const docId = `${link.category}__${link.title}`
     205 |         .toLowerCase()
>>>  206 |         .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
     207 |         .replace(/(^-|-$)/g, ""); // Trim leading/trailing hyphens
     208 |
     209 |       const docRef = linksRef.doc(docId);
```

---

#### 🔵 Line 207: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     204 |       const docId = `${link.category}__${link.title}`
     205 |         .toLowerCase()
     206 |         .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
>>>  207 |         .replace(/(^-|-$)/g, ""); // Trim leading/trailing hyphens
     208 |
     209 |       const docRef = linksRef.doc(docId);
     210 |       const existingDoc = await docRef.get();
```

---

#### 🟡 Line 258: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     255 | // Run import
     256 | importNashvilleLinks()
     257 |   .then(() => process.exit(0))
>>>  258 |   .catch((error) => {
     259 |     // Use sanitizeError to avoid exposing sensitive paths
     260 |     console.error(sanitizeError(error));
     261 |     process.exit(1);
```

---

### 📁 `scripts/sync-geocache.ts` (6 issues)

#### 🔵 Line N/A: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 3: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
>>>    3 | import * as fs from "node:fs";
       4 | import * as path from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error";
       6 |
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import { initializeApp, cert, getApps } from "firebase-admin/app";
       2 | import { getFirestore } from "firebase-admin/firestore";
       3 | import * as fs from "node:fs";
>>>    4 | import * as path from "node:path";
       5 | import { sanitizeError } from "./lib/sanitize-error";
       6 |
       7 | async function syncGeocache() {
```

---

#### 🔵 Line 88: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      85 |       // Usually caches are case-sensitive.
      86 |
      87 |       // Let's save `address` + `city` + `state`
>>>   88 |       if (!cache[fullAddr]) {
      89 |         cache[fullAddr] = data.coordinates;
      90 |         addedCount++;
      91 |       } else {
```

---

#### 🟡 Line 126: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     123 |   console.log("============================================================\n");
     124 | }
     125 |
>>>  126 | syncGeocache().catch((error: unknown) => {
     127 |   console.error("❌ Unexpected error:", sanitizeError(error));
     128 |   process.exit(1);
     129 | });
```

---

### 📁 `scripts/validate-phase-completion.js` (6 issues)

#### 🔵 Line 16: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      13 |  *   1 = Validation failed (block merge)
      14 |  */
      15 |
>>>   16 | import { readFileSync } from "node:fs";
      17 | import { join, dirname } from "node:path";
      18 | import { fileURLToPath } from "node:url";
      19 | import { sanitizeError } from "./lib/sanitize-error.js";
```

---

#### 🔵 Line 17: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      14 |  */
      15 |
      16 | import { readFileSync } from "node:fs";
>>>   17 | import { join, dirname } from "node:path";
      18 | import { fileURLToPath } from "node:url";
      19 | import { sanitizeError } from "./lib/sanitize-error.js";
      20 |
```

---

#### 🔵 Line 18: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      15 |
      16 | import { readFileSync } from "node:fs";
      17 | import { join, dirname } from "node:path";
>>>   18 | import { fileURLToPath } from "node:url";
      19 | import { sanitizeError } from "./lib/sanitize-error.js";
      20 |
      21 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🟠 Line 32: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

```js
      29 |   "INTEGRATED_IMPROVEMENT_PLAN.md"
      30 | );
      31 |
>>>   32 | function main() {
      33 |   console.log("🔍 Validating Phase Completion...\n");
      34 |
      35 |   // Read current plan with error handling
```

---

#### 🔵 Line 83: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      80 |
      81 |     // Check 1: "What Was Accomplished" section exists
      82 |     const hasAccomplished = /### 📊 What Was Accomplished/.test(phaseContent);
>>>   83 |     if (!hasAccomplished) {
      84 |       console.log('  ❌ Missing "What Was Accomplished" section');
      85 |       issues.push(`${phase}: Missing "What Was Accomplished" section`);
      86 |       allValid = false;
```

---

#### 🔵 Line 105: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
     102 |
     103 |     // Check 3: Completed date exists
     104 |     const hasCompletedDate = /\*\*Completed:\*\*\s*\d{4}-\d{2}-\d{2}/.test(phaseContent);
>>>  105 |     if (!hasCompletedDate) {
     106 |       console.log('  ❌ Missing "Completed" date');
     107 |       issues.push(`${phase}: Missing completion date`);
     108 |       allValid = false;
```

---

### 📁 `hooks/use-speech-recognition.ts` (6 issues)

#### 🔵 Line 21: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      18 |   const [transcript, setTranscript] = useState("");
      19 |   // Detect speech recognition support during state initialization
      20 |   const [hasSupport] = useState(() => {
>>>   21 |     if (typeof window === "undefined") return false;
      22 |     const win = window as typeof window & {
      23 |       SpeechRecognition?: SpeechRecognitionConstructor;
      24 |       webkitSpeechRecognition?: SpeechRecognitionConstructor;
```

---

#### 🔵 Line 22: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      19 |   // Detect speech recognition support during state initialization
      20 |   const [hasSupport] = useState(() => {
      21 |     if (typeof window === "undefined") return false;
>>>   22 |     const win = window as typeof window & {
      23 |       SpeechRecognition?: SpeechRecognitionConstructor;
      24 |       webkitSpeechRecognition?: SpeechRecognitionConstructor;
      25 |     };
```

---

#### 🔵 Line 22: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      19 |   // Detect speech recognition support during state initialization
      20 |   const [hasSupport] = useState(() => {
      21 |     if (typeof window === "undefined") return false;
>>>   22 |     const win = window as typeof window & {
      23 |       SpeechRecognition?: SpeechRecognitionConstructor;
      24 |       webkitSpeechRecognition?: SpeechRecognitionConstructor;
      25 |     };
```

---

#### 🔵 Line 34: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      31 |   const recognitionRef = useRef<SpeechRecognition | null>(null);
      32 |
      33 |   useEffect(() => {
>>>   34 |     if (typeof window !== "undefined" && hasSupport) {
      35 |       const win = window as typeof window & {
      36 |         SpeechRecognition?: SpeechRecognitionConstructor;
      37 |         webkitSpeechRecognition?: SpeechRecognitionConstructor;
```

---

#### 🔵 Line 35: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      32 |
      33 |   useEffect(() => {
      34 |     if (typeof window !== "undefined" && hasSupport) {
>>>   35 |       const win = window as typeof window & {
      36 |         SpeechRecognition?: SpeechRecognitionConstructor;
      37 |         webkitSpeechRecognition?: SpeechRecognitionConstructor;
      38 |       };
```

---

#### 🔵 Line 35: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      32 |
      33 |   useEffect(() => {
      34 |     if (typeof window !== "undefined" && hasSupport) {
>>>   35 |       const win = window as typeof window & {
      36 |         SpeechRecognition?: SpeechRecognitionConstructor;
      37 |         webkitSpeechRecognition?: SpeechRecognitionConstructor;
      38 |       };
```

---

### 📁 `components/notebook/features/check-in-questions.tsx` (6 issues)

#### 🔵 Line 29: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      26 |  *   onUsedChange={(v) => { setUsed(v); setHasTouched(true) }}
      27 |  * />
      28 |  */
>>>   29 | export function CheckInQuestions({
      30 |   cravings,
      31 |   used,
      32 |   onCravingsChange,
```

---

#### 🟡 Line 36: Use <details>, <fieldset>, <optgroup>, or <address> instead of the "group" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      33 |   onUsedChange,
      34 | }: CheckInQuestionsProps) {
      35 |   return (
>>>   36 |     <div className="space-y-3 pl-1" role="group" aria-label="Daily check-in questions">
      37 |       {/* Cravings question */}
      38 |       <div className="flex items-center justify-between">
      39 |         <span className="font-heading text-lg text-amber-900/80" id="cravings-label">
```

---

#### 🟡 Line 43: Use <input type="radio"> instead of the "radio" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      40 |           Cravings?
      41 |         </span>
      42 |         <div className="flex items-center gap-3" role="radiogroup" aria-labelledby="cravings-label">
>>>   43 |           <button
      44 |             onClick={() => onCravingsChange(false)}
      45 |             aria-label="No cravings"
      46 |             aria-checked={cravings === false}
```

---

#### 🟡 Line 56: Use <input type="radio"> instead of the "radio" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      53 |           >
      54 |             No
      55 |           </button>
>>>   56 |           <button
      57 |             onClick={() => onCravingsChange(true)}
      58 |             aria-label="Yes cravings"
      59 |             aria-checked={cravings === true}
```

---

#### 🟡 Line 78: Use <input type="radio"> instead of the "radio" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      75 |           Used?
      76 |         </span>
      77 |         <div className="flex items-center gap-3" role="radiogroup" aria-labelledby="used-label">
>>>   78 |           <button
      79 |             onClick={() => onUsedChange(false)}
      80 |             aria-label="No, did not use"
      81 |             aria-checked={used === false}
```

---

#### 🟡 Line 91: Use <input type="radio"> instead of the "radio" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      88 |           >
      89 |             No
      90 |           </button>
>>>   91 |           <button
      92 |             onClick={() => onUsedChange(true)}
      93 |             aria-label="Yes, used"
      94 |             aria-checked={used === true}
```

---

### 📁 `components/admin/logs-tab.tsx` (5 issues)

#### 🔵 Line 170: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     167 |   onToggle: () => void;
     168 | }
     169 |
>>>  170 | function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
     171 |   return (
     172 |     <>
     173 |       <tr className="hover:bg-amber-50 transition-colors">
```

---

#### 🟠 Line 287: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     284 |   }, []);
     285 |
     286 |   // Auto-refresh when tab becomes active
>>>  287 |   useTabRefresh("logs", () => void refresh(), { skipInitial: true });
     288 |
     289 |   useEffect(() => {
     290 |     let active = true;
```

---

#### 🟠 Line 291: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     288 |
     289 |   useEffect(() => {
     290 |     let active = true;
>>>  291 |     void refresh(() => active);
     292 |     return () => {
     293 |       active = false;
     294 |     };
```

---

#### 🟠 Line 338: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```tsx
     335 |           </div>
     336 |         </div>
     337 |         <button
>>>  338 |           onClick={() => void refresh()}
     339 |           disabled={loading}
     340 |           className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
     341 |         >
```

---

#### 🟡 Line 485: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     482 |         <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
     483 |           Loading logs...
     484 |         </div>
>>>  485 |       ) : filteredLogs.length === 0 ? (
     486 |         <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
     487 |           No logs found for the selected filter.
     488 |         </div>
```

---

### 📁 `lib/utils/admin-error-utils.ts` (5 issues)

#### 🔵 Line 19: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      16 |
      17 |   // Order matters: redact tokens first (before phone regex matches digits inside them)
      18 |   // Hex tokens (API keys, session IDs)
>>>   19 |   const redactedHexTokens = input.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
      20 |   // JWT-like tokens (base64url segments: eyJ...eyJ...abc...)
      21 |   const redactedTokens = redactedHexTokens.replace(
      22 |     /\b[A-Za-z0-9_-]{10,200}\.[A-Za-z0-9_-]{10,200}\.[A-Za-z0-9_-]{10,200}\b/g,
```

---

#### 🔵 Line 21: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      18 |   // Hex tokens (API keys, session IDs)
      19 |   const redactedHexTokens = input.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
      20 |   // JWT-like tokens (base64url segments: eyJ...eyJ...abc...)
>>>   21 |   const redactedTokens = redactedHexTokens.replace(
      22 |     /\b[A-Za-z0-9_-]{10,200}\.[A-Za-z0-9_-]{10,200}\.[A-Za-z0-9_-]{10,200}\b/g,
      23 |     "[redacted-token]"
      24 |   );
```

---

#### 🔵 Line 27: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      24 |   );
      25 |   // Email regex with length limits to prevent ReDoS (catastrophic backtracking)
      26 |   // Local part: max 64 chars, Domain: max 253 chars, TLD: max 63 chars per RFC 5321
>>>   27 |   const redactedEmail = redactedTokens.replace(
      28 |     /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,63}/gi,
      29 |     "[redacted-email]"
      30 |   );
```

---

#### 🔵 Line 33: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      30 |   );
      31 |   // Phone regex: handles formats like (555) 123-4567, 555-123-4567, +1 555 123 4567
      32 |   // Requires at least one separator to reduce false positives on arbitrary 10-digit numbers
>>>   33 |   const redactedPhone = redactedEmail.replace(
      34 |     /(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)[-.\s]?|\d{3}[-.\s]+)\d{3}[-.\s]?\d{4}/g,
      35 |     "[redacted-phone]"
      36 |   );
```

---

#### 🟡 Line 34: Simplify this regular expression to reduce its complexity from 23 to the 20 allowed.

- **Rule**: `typescript:S5843`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 14min

```ts
      31 |   // Phone regex: handles formats like (555) 123-4567, 555-123-4567, +1 555 123 4567
      32 |   // Requires at least one separator to reduce false positives on arbitrary 10-digit numbers
      33 |   const redactedPhone = redactedEmail.replace(
>>>   34 |     /(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)[-.\s]?|\d{3}[-.\s]+)\d{3}[-.\s]?\d{4}/g,
      35 |     "[redacted-phone]"
      36 |   );
      37 |   return redactedPhone;
```

---

### 📁 `components/settings/settings-page.tsx` (5 issues)

#### 🟡 Line 34: Remove this useless assignment to variable "originalCleanDate".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```tsx
      31 |   const [isSaving, setIsSaving] = useState(false);
      32 |   const [hasChanges, setHasChanges] = useState(false);
      33 |   const [showCleanDateConfirm, setShowCleanDateConfirm] = useState(false);
>>>   34 |   const [originalCleanDate, setOriginalCleanDate] = useState<string | null>(null);
      35 |   const [originalCleanTime, setOriginalCleanTime] = useState<string>("08:00");
      36 |
      37 |   // Helper to format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
```

---

#### 🟡 Line 35: Remove this useless assignment to variable "originalCleanTime".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```tsx
      32 |   const [hasChanges, setHasChanges] = useState(false);
      33 |   const [showCleanDateConfirm, setShowCleanDateConfirm] = useState(false);
      34 |   const [originalCleanDate, setOriginalCleanDate] = useState<string | null>(null);
>>>   35 |   const [originalCleanTime, setOriginalCleanTime] = useState<string>("08:00");
      36 |
      37 |   // Helper to format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
      38 |   const formatLocalDate = useCallback((date: Date): string => {
```

---

#### 🟠 Line 103: Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 31min

```tsx
     100 |     formatLocalTime,
     101 |   ]);
     102 |
>>>  103 |   const handleSave = async () => {
     104 |     // Prevent concurrent save operations from rapid clicks
     105 |     if (isSaving) return;
     106 |
```

---

#### 🔵 Line 250: The empty object is useless.

- **Rule**: `typescript:S7744`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     247 |
     248 |       if (preferencesChanged) {
     249 |         patch.preferences = {
>>>  250 |           ...(profile.preferences ?? {}),
     251 |           largeText,
     252 |           simpleLanguage,
     253 |         };
```

---

#### 🟡 Line 291: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     288 |         // Redact potential PII from error message
     289 |         errorCategory: errorMessage.includes("permission")
     290 |           ? "permission_denied"
>>>  291 |           : errorMessage.includes("network")
     292 |             ? "network_error"
     293 |             : "unknown",
     294 |       });
```

---

### 📁 `components/admin/sober-living-tab.tsx` (5 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 17: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      14 | import { Textarea } from "@/components/ui/textarea";
      15 |
      16 | // Sober Living Form component
>>>   17 | function SoberLivingForm({
      18 |   formData,
      19 |   setFormData,
      20 | }: {
```

---

#### 🟡 Line 149: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     146 |           className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
     147 |             home.gender === "Men"
     148 |               ? "border-blue-200 bg-blue-50 text-blue-700"
>>>  149 |               : home.gender === "Women"
     150 |                 ? "border-pink-200 bg-pink-50 text-pink-700"
     151 |                 : "border-purple-200 bg-purple-50 text-purple-700"
     152 |           }`}
```

---

#### 🟡 Line 154: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     151 |                 : "border-purple-200 bg-purple-50 text-purple-700"
     152 |           }`}
     153 |         >
>>>  154 |           {home.gender === "Men" ? "M" : home.gender === "Women" ? "W" : "C"}
     155 |         </div>
     156 |       ),
     157 |     },
```

---

### 📁 `components/auth/sign-in-modal.tsx` (5 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 20: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      17 |   onSuccess: () => void;
      18 | }
      19 |
>>>   20 | export default function SignInModal({ onClose, onSuccess }: SignInModalProps) {
      21 |   const [isSignUp, setIsSignUp] = useState(false);
      22 |   const [email, setEmail] = useState("");
      23 |   const [password, setPassword] = useState("");
```

---

#### 🟡 Line 61: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      58 |       const msg =
      59 |         code === "auth/invalid-credential"
      60 |           ? "Invalid email or password."
>>>   61 |           : code === "auth/email-already-in-use"
      62 |             ? "Email already in use."
      63 |             : "Something went wrong.";
      64 |       setError(msg);
```

---

#### 🟡 Line 160: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     157 |             >
     158 |               {loading ? (
     159 |                 <Loader2 className="w-5 h-5 animate-spin" />
>>>  160 |               ) : isSignUp ? (
     161 |                 "Sign Up"
     162 |               ) : (
     163 |                 "Sign In"
```

---

### 📁 `components/celebrations/confetti-burst.tsx` (5 issues)

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 26: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      23 |   colors?: string[];
      24 | }
      25 |
>>>   26 | export function ConfettiBurst({
      27 |   intensity = 50,
      28 |   duration = 4,
      29 |   colors = Object.values(CELEBRATION_COLORS),
```

---

#### 🔵 Line 33: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      30 | }: ConfettiBurstProps) {
      31 |   // Use lazy initialization to avoid setState in effect
      32 |   const [pieces] = useState<ConfettiPiece[]>(() => {
>>>   33 |     if (typeof window === "undefined") return [];
      34 |
      35 |     return Array.from({ length: intensity }, (_, i) => {
      36 |       const shapes: ("circle" | "square" | "rectangle")[] = ["circle", "square", "rectangle"];
```

---

#### 🔵 Line 52: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      49 |     });
      50 |   });
      51 |
>>>   52 |   if (typeof window === "undefined") return null;
      53 |
      54 |   return (
      55 |     <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
```

---

#### 🟡 Line 66: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      63 |             width: piece.shape === "rectangle" ? piece.size * 1.5 : piece.size,
      64 |             height: piece.size,
      65 |             borderRadius:
>>>   66 |               piece.shape === "circle" ? "50%" : piece.shape === "square" ? "2px" : "1px",
      67 |           }}
      68 |           initial={{
      69 |             y: piece.y,
```

---

### 📁 `components/celebrations/milestone-modal.tsx` (5 issues)

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 22: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      19 |   default: Medal,
      20 | };
      21 |
>>>   22 | export function MilestoneModal({
      23 |   isOpen,
      24 |   title,
      25 |   message,
```

---

#### 🟡 Line 33: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      30 |   const Icon =
      31 |     daysClean && daysClean >= 365
      32 |       ? MILESTONE_ICONS.year
>>>   33 |       : daysClean && daysClean >= 30
      34 |         ? MILESTONE_ICONS.month
      35 |         : daysClean && daysClean >= 7
      36 |           ? MILESTONE_ICONS.week
```

---

#### 🟡 Line 35: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      32 |       ? MILESTONE_ICONS.year
      33 |       : daysClean && daysClean >= 30
      34 |         ? MILESTONE_ICONS.month
>>>   35 |         : daysClean && daysClean >= 7
      36 |           ? MILESTONE_ICONS.week
      37 |           : MILESTONE_ICONS.default;
      38 |
```

---

#### 🔵 Line 105: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
     102 |                   transition={{ delay: 0.4 }}
     103 |                 >
     104 |                   <p className="text-2xl md:text-3xl font-bold text-white">
>>>  105 |                     {daysClean} Day{daysClean !== 1 ? "s" : ""} Clean
     106 |                   </p>
     107 |                 </motion.div>
     108 |               )}
```

---

### 📁 `components/growth/GratitudeCard.tsx` (5 issues)

#### 🟡 Line N/A: Ambiguous spacing after previous element span

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 15: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      12 | } from "@/components/ui/dialog";
      13 | import { Button } from "@/components/ui/button";
      14 | import { Input } from "@/components/ui/input";
>>>   15 | import { useAuth } from "@/components/providers/auth-provider";
      16 | import { FirestoreService } from "@/lib/firestore-service";
      17 | import { logger, maskIdentifier } from "@/lib/logger";
      18 | import { toast } from "sonner";
```

---

#### 🔵 Line 35: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      32 |   const [currentWhy, setCurrentWhy] = useState("");
      33 |   const [showWhy, setShowWhy] = useState(false);
      34 |   const [isSaving, setIsSaving] = useState(false);
>>>   35 |   const { user } = useAuth();
      36 |
      37 |   const handleAddItem = () => {
      38 |     if (!currentText.trim()) return;
```

---

#### 🟡 Line 128: Ambiguous spacing after previous element span

- **Rule**: `typescript:S6772`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     125 |           <DialogTitle className="font-handlee text-2xl text-emerald-800 flex items-center gap-2">
     126 |             <span className="p-1.5 bg-emerald-100 rounded-md">
     127 |               <Heart className="w-4 h-4 text-emerald-600" />
>>>  128 |             </span>
     129 |             Gratitude List
     130 |           </DialogTitle>
     131 |         </DialogHeader>
```

---

#### 🟡 Line 136: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     133 |         <div className="flex-1 overflow-y-auto pl-6 pr-8 py-4 space-y-6">
     134 |           {/* Add New Item Section */}
     135 |           <div className="space-y-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
>>>  136 |             <label className="text-sm font-bold text-emerald-700">I am grateful for...</label>
     137 |             <div className="flex gap-2">
     138 |               <Input
     139 |                 value={currentText}
```

---

### 📁 `functions/src/index.ts` (5 issues)

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 10min

---

#### 🔵 Line 200: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     197 |           type,
     198 |           data: entryData,
     199 |           dateLabel,
>>>  200 |           isPrivate: isPrivate !== undefined ? isPrivate : true,
     201 |           isSoftDeleted: false,
     202 |           createdAt: admin.firestore.FieldValue.serverTimestamp(),
     203 |           updatedAt: admin.firestore.FieldValue.serverTimestamp(),
```

---

#### 🟠 Line 486: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```ts
     483 |  * 5. Batch writes for atomicity
     484 |  * 6. Audit logging
     485 |  */
>>>  486 | export const migrateAnonymousUserData = onCall<MigrationData>(async (request) => {
     487 |   const { data, app: _app, auth } = request;
     488 |
     489 |   if (!auth) {
```

---

#### 🟡 Line 508: Remove this commented out code.

- **Rule**: `typescript:S125`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     505 |
     506 |   // TEMPORARILY DISABLED: App Check verification - waiting for throttle to clear
     507 |   // App Check verification
>>>  508 |   /* if (!app) {
     509 |             logSecurityEvent("APP_CHECK_FAILURE", "migrateAnonymousUserData", "App Check token invalid", { userId });
     510 |             throw new HttpsError("failed-precondition", "App Check verification failed. Please refresh the page.");
     511 |         } */
```

---

#### 🔵 Line 694: Expected a `for-of` loop instead of a `for` loop with this simple iteration.

- **Rule**: `typescript:S4138`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     691 |     // We track partial success to provide detailed error information.
     692 |     let committedBatches = 0;
     693 |     try {
>>>  694 |       for (let i = 0; i < batches.length; i++) {
     695 |         await batches[i].commit();
     696 |         committedBatches++;
     697 |       }
```

---

### 📁 `lib/firestore-service.ts` (5 issues)

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

---

#### 🔵 Line N/A: Use `export…from` to re-export `DailyLog`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Use `export…from` to re-export `DailyLogHistoryResult`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 97: Use `export…from` to re-export `DailyLog`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      94 | }
      95 |
      96 | // Re-export types for backwards compatibility
>>>   97 | export type { DailyLog, DailyLogHistoryResult };
      98 | export type TodayLogResult = DailyLogResult;
      99 |
     100 | type FirestoreDependencies = {
```

---

#### 🔵 Line 97: Use `export…from` to re-export `DailyLogHistoryResult`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      94 | }
      95 |
      96 | // Re-export types for backwards compatibility
>>>   97 | export type { DailyLog, DailyLogHistoryResult };
      98 | export type TodayLogResult = DailyLogResult;
      99 |
     100 | type FirestoreDependencies = {
```

---

### 📁 `.claude/skills/artifacts-builder/scripts/bundle-artifact.sh` (5 issues)

#### 🟡 Line 7: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
       4 | echo "📦 Bundling React app to single HTML artifact..."
       5 |
       6 | # Check if we're in a project directory
>>>    7 | if [ ! -f "package.json" ]; then
       8 |   echo "❌ Error: No package.json found. Run this script from your project root."
       9 |   exit 1
      10 | fi
```

---

#### 🟡 Line 8: Redirect this error message to stderr (>&2).

- **Rule**: `shelldre:S7677`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```sh
       5 |
       6 | # Check if we're in a project directory
       7 | if [ ! -f "package.json" ]; then
>>>    8 |   echo "❌ Error: No package.json found. Run this script from your project root."
       9 |   exit 1
      10 | fi
      11 |
```

---

#### 🟡 Line 13: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      10 | fi
      11 |
      12 | # Check if index.html exists
>>>   13 | if [ ! -f "index.html" ]; then
      14 |   echo "❌ Error: No index.html found in project root."
      15 |   echo "   This script requires an index.html entry point."
      16 |   exit 1
```

---

#### 🟡 Line 14: Redirect this error message to stderr (>&2).

- **Rule**: `shelldre:S7677`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```sh
      11 |
      12 | # Check if index.html exists
      13 | if [ ! -f "index.html" ]; then
>>>   14 |   echo "❌ Error: No index.html found in project root."
      15 |   echo "   This script requires an index.html entry point."
      16 |   exit 1
      17 | fi
```

---

#### 🟡 Line 24: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      21 | pnpm add -D parcel @parcel/config-default parcel-resolver-tspaths html-inline
      22 |
      23 | # Create Parcel config with tspaths resolver
>>>   24 | if [ ! -f ".parcelrc" ]; then
      25 |   echo "🔧 Creating Parcel configuration with path alias support..."
      26 |   cat > .parcelrc << 'EOF'
      27 | {
```

---

### 📁 `lib/recaptcha.ts` (5 issues)

#### 🔵 Line 36: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      33 |   }
      34 |
      35 |   // Check if we're in the browser
>>>   36 |   if (typeof window === "undefined") {
      37 |     throw new Error("reCAPTCHA can only be used in the browser");
      38 |   }
      39 |
```

---

#### 🔵 Line 37: `new Error()` is too unspecific for a type check. Use `new TypeError()` instead.

- **Rule**: `typescript:S7786`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      34 |
      35 |   // Check if we're in the browser
      36 |   if (typeof window === "undefined") {
>>>   37 |     throw new Error("reCAPTCHA can only be used in the browser");
      38 |   }
      39 |
      40 |   // Wait for reCAPTCHA to be ready
```

---

#### 🔵 Line 46: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      43 |       reject(new Error("reCAPTCHA failed to load"));
      44 |     }, 10000); // 10 second timeout
      45 |
>>>   46 |     if (!window.grecaptcha?.enterprise) {
      47 |       clearTimeout(timeout);
      48 |       reject(new Error("reCAPTCHA library not loaded"));
      49 |       return;
```

---

#### 🔵 Line 52: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      49 |       return;
      50 |     }
      51 |
>>>   52 |     window.grecaptcha.enterprise.ready(async () => {
      53 |       try {
      54 |         const token = await window.grecaptcha!.enterprise.execute(siteKey, { action });
      55 |         clearTimeout(timeout);
```

---

#### 🔵 Line 54: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      51 |
      52 |     window.grecaptcha.enterprise.ready(async () => {
      53 |       try {
>>>   54 |         const token = await window.grecaptcha!.enterprise.execute(siteKey, { action });
      55 |         clearTimeout(timeout);
      56 |         resolve(token);
      57 |       } catch (error) {
```

---

### 📁 `components/journal/entry-forms/daily-log-form.tsx` (5 issues)

#### 🔵 Line 25: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      22 |   { emoji: "😤", label: "Angry" },
      23 | ];
      24 |
>>>   25 | export function DailyLogForm({ onClose, onSuccess }: DailyLogFormProps) {
      26 |   const { addEntry } = useJournal();
      27 |   const [mood, setMood] = React.useState<string | null>(null);
      28 |   const [cravings, setCravings] = React.useState<boolean | null>(null);
```

---

#### 🟡 Line 75: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      72 |         <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
      73 |           {/* Mood Selection */}
      74 |           <div className="space-y-2">
>>>   75 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
      76 |               Mood (optional)
      77 |             </label>
      78 |             <div className="flex flex-wrap gap-3 justify-center">
```

---

#### 🟡 Line 103: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     100 |           {/* Cravings / Used */}
     101 |           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     102 |             <div className="space-y-2">
>>>  103 |               <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
     104 |                 Cravings?
     105 |               </label>
     106 |               <div className="flex items-center gap-3">
```

---

#### 🟡 Line 128: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     125 |             </div>
     126 |
     127 |             <div className="space-y-2">
>>>  128 |               <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
     129 |                 Used?
     130 |               </label>
     131 |               <div className="flex items-center gap-3">
```

---

#### 🟡 Line 155: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     152 |
     153 |           {/* Note */}
     154 |           <div className="space-y-2">
>>>  155 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
     156 |               Quick Note (optional)
     157 |             </label>
     158 |             <textarea
```

---

### 📁 `components/journal/entry-forms/inventory-form.tsx` (5 issues)

#### 🔵 Line 15: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      12 |   onSuccess: () => void;
      13 | }
      14 |
>>>   15 | export function InventoryForm({ onClose, onSuccess }: InventoryFormProps) {
      16 |   const { addEntry } = useJournal();
      17 |   const [formData, setFormData] = React.useState({
      18 |     resentments: "",
```

---

#### 🟡 Line 71: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      68 |         <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
      69 |           {/* Resentments */}
      70 |           <div className="space-y-2">
>>>   71 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
      72 |               Was I resentful, selfish, dishonest, or afraid?
      73 |             </label>
      74 |             <textarea
```

---

#### 🟡 Line 84: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      81 |
      82 |           {/* Dishonesty */}
      83 |           <div className="space-y-2">
>>>   84 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
      85 |               Have I kept something to myself that should be discussed?
      86 |             </label>
      87 |             <textarea
```

---

#### 🟡 Line 97: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      94 |
      95 |           {/* Apologies */}
      96 |           <div className="space-y-2">
>>>   97 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
      98 |               Do I owe an apology?
      99 |             </label>
     100 |             <textarea
```

---

#### 🟡 Line 110: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     107 |
     108 |           {/* Successes */}
     109 |           <div className="space-y-2">
>>>  110 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
     111 |               What did I do well today?
     112 |             </label>
     113 |             <textarea
```

---

### 📁 `components/pwa/install-prompt.tsx` (5 issues)

#### 🔵 Line 18: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      15 |   const [isVisible, setIsVisible] = useState(false);
      16 |   // Detect iOS during state initialization
      17 |   const [isIOS] = useState(() => {
>>>   18 |     if (typeof window === "undefined") return false;
      19 |     const userAgent = window.navigator.userAgent.toLowerCase();
      20 |     const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      21 |     const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
```

---

#### 🔵 Line 19: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      16 |   // Detect iOS during state initialization
      17 |   const [isIOS] = useState(() => {
      18 |     if (typeof window === "undefined") return false;
>>>   19 |     const userAgent = window.navigator.userAgent.toLowerCase();
      20 |     const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      21 |     const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      22 |     return isIosDevice && !isStandalone;
```

---

#### 🔵 Line 21: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      18 |     if (typeof window === "undefined") return false;
      19 |     const userAgent = window.navigator.userAgent.toLowerCase();
      20 |     const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
>>>   21 |     const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      22 |     return isIosDevice && !isStandalone;
      23 |   });
      24 |
```

---

#### 🔵 Line 43: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      40 |       setIsVisible(true);
      41 |     };
      42 |
>>>   43 |     window.addEventListener("beforeinstallprompt", handler as EventListener);
      44 |
      45 |     return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
      46 |   }, []);
```

---

#### 🔵 Line 45: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      42 |
      43 |     window.addEventListener("beforeinstallprompt", handler as EventListener);
      44 |
>>>   45 |     return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
      46 |   }, []);
      47 |
      48 |   const handleInstallClick = async () => {
```

---

### 📁 `tests/utils/firebase-types.test.ts` (4 issues)

#### 🔵 Line N/A: Prefer `Number.NaN` over `NaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line N/A: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 121: Prefer `Number.NaN` over `NaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     118 |     });
     119 |
     120 |     test("returns null for NaN", () => {
>>>  121 |       assert.equal(toDate(NaN), null);
     122 |     });
     123 |
     124 |     test("returns null for empty string", () => {
```

---

#### 🔵 Line 140: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     137 |       formats.forEach((format) => {
     138 |         const result = toDate(format);
     139 |         assert.ok(result instanceof Date, `Should parse format: ${format}`);
>>>  140 |         assert.ok(!isNaN(result!.getTime()), `Should be valid date: ${format}`);
     141 |       });
     142 |     });
     143 |
```

---

### 📁 `lib/contexts/admin-tab-context.tsx` (4 issues)

#### 🟡 Line N/A: The 'value' object passed as the value prop to the Context provider changes every render. To fix this consider wrapping it in a useMemo hook.

- **Rule**: `typescript:S6481`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 65: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      62 |  * - Provides setActiveTab that updates refresh timestamp
      63 |  * - 30-second minimum interval between auto-refreshes
      64 |  */
>>>   65 | export function AdminTabProvider({ children, defaultTab = "dashboard" }: AdminTabProviderProps) {
      66 |   const [activeTab, setActiveTabState] = useState<AdminTabId>(defaultTab);
      67 |
      68 |   // Track refresh timestamps per tab (when each was last refreshed)
```

---

#### 🔵 Line 66: useState call is not destructured into value + setter pair

- **Rule**: `typescript:S6754`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      63 |  * - 30-second minimum interval between auto-refreshes
      64 |  */
      65 | export function AdminTabProvider({ children, defaultTab = "dashboard" }: AdminTabProviderProps) {
>>>   66 |   const [activeTab, setActiveTabState] = useState<AdminTabId>(defaultTab);
      67 |
      68 |   // Track refresh timestamps per tab (when each was last refreshed)
      69 |   const [refreshTimestamps, setRefreshTimestamps] = useState<RefreshTimestamps>(() => {
```

---

#### 🟡 Line 124: The 'value' object passed as the value prop to the Context provider changes every render. To fix this consider wrapping it in a useMemo hook.

- **Rule**: `typescript:S6481`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     121 |     [refreshTimestamps]
     122 |   );
     123 |
>>>  124 |   const value: AdminTabContextValue = {
     125 |     activeTab,
     126 |     setActiveTab,
     127 |     lastRefreshTimestamp: refreshTimestamps[activeTab],
```

---

### 📁 `components/celebrations/celebration-provider.tsx` (4 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 19: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      16 |
      17 | const CelebrationContext = createContext<CelebrationContextType | null>(null);
      18 |
>>>   19 | export function CelebrationProvider({ children }: { children: ReactNode }) {
      20 |   const [activeEvent, setActiveEvent] = useState<CelebrationEvent | null>(null);
      21 |
      22 |   const celebrate = useCallback((type: CelebrationType, data: Partial<CelebrationEvent> = {}) => {
```

---

#### 🟡 Line 35: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      32 |
      33 |     // Auto-dismiss after animation completes (based on intensity)
      34 |     const dismissDelay =
>>>   35 |       event.intensity === "high" ? 6000 : event.intensity === "medium" ? 4000 : 2500;
      36 |     setTimeout(() => setActiveEvent(null), dismissDelay);
      37 |   }, []);
      38 |
```

---

#### 🟡 Line 44: The object passed as the value prop to the Context provider changes every render. To fix this consider wrapping it in a useMemo hook.

- **Rule**: `typescript:S6481`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      41 |   }, []);
      42 |
      43 |   return (
>>>   44 |     <CelebrationContext.Provider value={{ celebrate, clearCelebration }}>
      45 |       {children}
      46 |       {activeEvent && <CelebrationOverlay event={activeEvent} onClose={clearCelebration} />}
      47 |     </CelebrationContext.Provider>
```

---

### 📁 `hooks/use-daily-quote.ts` (4 issues)

#### 🟠 Line N/A: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

---

#### 🔵 Line N/A: Compare with `undefined` directly instead of using `typeof`.

- **Rule**: `typescript:S7741`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟠 Line 159: Refactor this code to not nest functions more than 4 levels deep.

- **Rule**: `typescript:S2004`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 20min

```ts
     156 |         setLoading(true);
     157 |         fetchDailyQuote()
     158 |           .then(setQuote)
>>>  159 |           .finally(() => setLoading(false));
     160 |         // Reschedule for next day
     161 |         scheduleMidnightRefresh();
     162 |       }, msUntilMidnight);
```

---

#### 🔵 Line 170: Compare with `undefined` directly instead of using `typeof`.

- **Rule**: `typescript:S7741`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
     167 |     };
     168 |
     169 |     // Only schedule if window is available (client-side)
>>>  170 |     if (typeof globalThis.window !== "undefined") {
     171 |       return scheduleMidnightRefresh();
     172 |     }
     173 |     return undefined;
```

---

### 📁 `scripts/check-consolidation-status.js` (4 issues)

#### 🔵 Line N/A: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 34: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      31 |     }
      32 |
      33 |     // Normalize CRLF to LF for cross-platform compatibility
>>>   34 |     const content = readFileSync(LOG_FILE, "utf8").replace(/\r\n/g, "\n");
      35 |     const lines = content.split("\n");
      36 |
      37 |     // Limit parsing to the active portion (before any archive section)
```

---

#### 🔵 Line 41: Unexpected negated condition.

- **Rule**: `javascript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      38 |     const archiveHeaderIndex = lines.findIndex((line) =>
      39 |       line.trim().toLowerCase().startsWith("## archive")
      40 |     );
>>>   41 |     const activeLines = archiveHeaderIndex !== -1 ? lines.slice(0, archiveHeaderIndex) : lines;
      42 |     const activeContent = activeLines.join("\n");
      43 |
      44 |     // Extract consolidation counter (NaN-safe, whitespace-flexible)
```

---

#### 🔵 Line 46: Prefer `Number.parseInt` over `parseInt`.

- **Rule**: `javascript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```js
      43 |
      44 |     // Extract consolidation counter (NaN-safe, whitespace-flexible)
      45 |     const counterMatch = activeContent.match(/\*\*Reviews since last consolidation:\*\*\s+(\d+)/);
>>>   46 |     const reviewCount = counterMatch ? parseInt(counterMatch[1], 10) || 0 : 0;
      47 |
      48 |     // Extract status (whitespace-flexible)
      49 |     const statusMatch = activeContent.match(/\*\*Status:\*\*\s+([^\n]+)/);
```

---

### 📁 `scripts/dedupe-quotes.ts` (4 issues)

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line N/A: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 217: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     214 | function normalizeText(text: string): string {
     215 |   return text
     216 |     .toLowerCase()
>>>  217 |     .replace(/[^\w\s]/g, "") // Remove punctuation
     218 |     .replace(/\s+/g, " ") // Normalize whitespace
     219 |     .trim();
     220 | }
```

---

#### 🔵 Line 218: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     215 |   return text
     216 |     .toLowerCase()
     217 |     .replace(/[^\w\s]/g, "") // Remove punctuation
>>>  218 |     .replace(/\s+/g, " ") // Normalize whitespace
     219 |     .trim();
     220 | }
     221 |
```

---

### 📁 `scripts/set-admin-claim.ts` (4 issues)

#### 🟡 Line N/A: Prefer top-level await over an async function `setAdminClaim` call.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 11: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       8 |  */
       9 |
      10 | import admin from "firebase-admin";
>>>   11 | import { readFileSync } from "node:fs";
      12 | import { join } from "node:path";
      13 | import { sanitizeError } from "./lib/sanitize-error.js";
      14 |
```

---

#### 🔵 Line 12: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       9 |
      10 | import admin from "firebase-admin";
      11 | import { readFileSync } from "node:fs";
>>>   12 | import { join } from "node:path";
      13 | import { sanitizeError } from "./lib/sanitize-error.js";
      14 |
      15 | /**
```

---

#### 🟡 Line 109: Prefer top-level await over an async function `setAdminClaim` call.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     106 |   process.exit(1);
     107 | }
     108 |
>>>  109 | setAdminClaim(email);
     110 |
```

---

### 📁 `.github/workflows/ci.yml` (4 issues)

#### ⚪ Line N/A: Complete the task associated to this "TODO" comment.

- **Rule**: `githubactions:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

---

#### ⚪ Line N/A: Complete the task associated to this "TODO" comment.

- **Rule**: `githubactions:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

---

#### ⚪ Line N/A: Complete the task associated to this "TODO" comment.

- **Rule**: `githubactions:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

---

#### ⚪ Line N/A: Complete the task associated to this "TODO" comment.

- **Rule**: `githubactions:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

---

### 📁 `scripts/migrate-to-journal.ts` (4 issues)

#### 🟠 Line 33: Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 16min

```ts
      30 | /**
      31 |  * Migrate all legacy data for a specific user
      32 |  */
>>>   33 | async function migrateUserData(userId: string, stats: MigrationStats) {
      34 |   console.log(`\nMigrating user: ${userId}`);
      35 |
      36 |   // We no longer skip the user entirely if they have *some* migrated entries.
```

---

#### 🟠 Line 198: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```ts
     195 | /**
     196 |  * Generate searchable text from entry data
     197 |  */
>>>  198 | function generateSearchableText(type: string, data: Record<string, unknown>): string {
     199 |   const parts: string[] = [];
     200 |   const isPrimitive = (val: unknown): val is string | number =>
     201 |     typeof val === "string" || typeof val === "number";
```

---

#### 🟡 Line 261: Remove this useless assignment to variable "hasMore".

- **Rule**: `typescript:S1854`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 1min

```ts
     258 |     const usersSnapshot = await query.get();
     259 |
     260 |     if (usersSnapshot.empty) {
>>>  261 |       hasMore = false;
     262 |       break;
     263 |     }
     264 |
```

---

#### 🟡 Line 297: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     294 | }
     295 |
     296 | // Run if called directly
>>>  297 | runMigration().catch((error: unknown) => {
     298 |   console.error("❌ Unexpected error:", sanitizeError(error));
     299 |   process.exit(1);
     300 | });
```

---

### 📁 `scripts/migrate-meetings-dayindex.ts` (4 issues)

#### 🔵 Line 13: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      10 |
      11 | import { initializeApp, cert } from "firebase-admin/app";
      12 | import { getFirestore } from "firebase-admin/firestore";
>>>   13 | import * as path from "node:path";
      14 | import * as fs from "node:fs";
      15 | import { sanitizeError } from "./lib/sanitize-error.js";
      16 |
```

---

#### 🔵 Line 14: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      11 | import { initializeApp, cert } from "firebase-admin/app";
      12 | import { getFirestore } from "firebase-admin/firestore";
      13 | import * as path from "node:path";
>>>   14 | import * as fs from "node:fs";
      15 | import { sanitizeError } from "./lib/sanitize-error.js";
      16 |
      17 | // Day name to index mapping (0=Sunday, 1=Monday, ..., 6=Saturday)
```

---

#### 🟠 Line 29: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```ts
      26 |   saturday: 6,
      27 | };
      28 |
>>>   29 | async function migrateMeetings() {
      30 |   console.log("🚀 Starting migration: Adding dayIndex to meetings...\n");
      31 |
      32 |   // Initialize Firebase Admin SDK
```

---

#### 🟡 Line 160: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
     157 |   .then(() => {
     158 |     process.exit(0);
     159 |   })
>>>  160 |   .catch((error) => {
     161 |     // Use sanitizeError to avoid exposing sensitive paths
     162 |     console.error("Unexpected error:", sanitizeError(error));
     163 |     process.exit(1);
```

---

### 📁 `components/providers/auth-provider.tsx` (4 issues)

#### 🔵 Line 22: Use `export…from` to re-export `useAuthCore`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      19 | import { DailyLogProvider, useDailyLog } from "./daily-log-context";
      20 |
      21 | // Re-export focused hooks for new code
>>>   22 | export { useAuthCore, useProfile, useDailyLog };
      23 |
      24 | // Re-export for tests
      25 | export { ensureAnonymousSession } from "./auth-context";
```

---

#### 🔵 Line 22: Use `export…from` to re-export `useProfile`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      19 | import { DailyLogProvider, useDailyLog } from "./daily-log-context";
      20 |
      21 | // Re-export focused hooks for new code
>>>   22 | export { useAuthCore, useProfile, useDailyLog };
      23 |
      24 | // Re-export for tests
      25 | export { ensureAnonymousSession } from "./auth-context";
```

---

#### 🔵 Line 22: Use `export…from` to re-export `useDailyLog`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      19 | import { DailyLogProvider, useDailyLog } from "./daily-log-context";
      20 |
      21 | // Re-export focused hooks for new code
>>>   22 | export { useAuthCore, useProfile, useDailyLog };
      23 |
      24 | // Re-export for tests
      25 | export { ensureAnonymousSession } from "./auth-context";
```

---

#### 🔵 Line 38: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      35 |  * Wrapping order matters - inner providers can access outer ones:
      36 |  * AuthProvider (outermost) → ProfileProvider → DailyLogProvider (innermost)
      37 |  */
>>>   38 | export function AuthProvider({ children }: UnifiedAuthProviderProps) {
      39 |   // Track user for passing to child providers
      40 |   const [currentUser, setCurrentUser] = useState<User | null>(null);
      41 |
```

---

### 📁 `lib/sentry.client.ts` (4 issues)

#### 🔵 Line 11: Prefer `node:crypto` over `crypto`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       8 |  */
       9 |
      10 | import * as Sentry from "@sentry/nextjs";
>>>   11 | import { createHash } from "node:crypto";
      12 |
      13 | // Hash user ID for privacy
      14 | function hashUserId(userId: string): string {
```

---

#### 🔵 Line 24: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      21 |  */
      22 | export function initSentryClient(): void {
      23 |   // Only initialize in browser
>>>   24 |   if (typeof window === "undefined") return;
      25 |
      26 |   // Skip in development unless explicitly enabled
      27 |   const isDev = process.env.NODE_ENV === "development";
```

---

#### 🔵 Line 42: Don't use a zero fraction in the number.

- **Rule**: `typescript:S7748`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```ts
      39 |     environment: isDev ? "development" : "production",
      40 |
      41 |     // Sample rate for performance monitoring (10% in prod)
>>>   42 |     tracesSampleRate: isDev ? 1.0 : 0.1,
      43 |
      44 |     // Don't capture PII
      45 |     beforeSend(event) {
```

---

#### 🔵 Line 48: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      45 |     beforeSend(event) {
      46 |       // Redact any email addresses in error messages
      47 |       if (event.message) {
>>>   48 |         event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL_REDACTED]");
      49 |       }
      50 |
      51 |       // Redact breadcrumb data that might contain PII
```

---

### 📁 `scripts/security-check.js` (3 issues)

#### 🔵 Line 20: Remove this unused import of 'statSync'.

- **Rule**: `javascript:S1128`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```js
      17 |  *   node scripts/security-check.js --blocking     # Exit non-zero on violations
      18 |  */
      19 |
>>>   20 | import { existsSync, readFileSync, readdirSync, statSync, lstatSync, realpathSync } from "node:fs";
      21 | import { execSync } from "node:child_process";
      22 | import { join, dirname, extname, relative, resolve, isAbsolute, sep } from "node:path";
      23 | import { fileURLToPath } from "node:url";
```

---

#### 🔵 Line 22: Remove this unused import of 'isAbsolute'.

- **Rule**: `javascript:S1128`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```js
      19 |
      20 | import { existsSync, readFileSync, readdirSync, statSync, lstatSync, realpathSync } from "node:fs";
      21 | import { execSync } from "node:child_process";
>>>   22 | import { join, dirname, extname, relative, resolve, isAbsolute, sep } from "node:path";
      23 | import { fileURLToPath } from "node:url";
      24 |
      25 | const __filename = fileURLToPath(import.meta.url);
```

---

#### 🟠 Line 301: Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 25min

```js
     298 | /**
     299 |  * Main function
     300 |  */
>>>  301 | function main() {
     302 |   const args = process.argv.slice(2);
     303 |   const isBlocking = args.includes("--blocking");
     304 |   const isQuiet = args.includes("--quiet");
```

---

### 📁 `app/dev/page.tsx` (3 issues)

#### 🔵 Line 30: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      27 | export default function DevPage() {
      28 |   // Mobile detection - block dev dashboard on mobile devices
      29 |   const [state, setState] = useState<DevState>(() => {
>>>   30 |     if (typeof window === "undefined") return "loading";
      31 |     const isMobile =
      32 |       /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      33 |     return isMobile ? "mobile" : "loading";
```

---

#### 🟡 Line 105: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     102 |       setError(
     103 |         errorCode === "auth/popup-closed-by-user"
     104 |           ? "Login cancelled"
>>>  105 |           : errorCode === "auth/popup-blocked"
     106 |             ? "Popup blocked - please allow popups and try again"
     107 |             : errorCode === "auth/network-request-failed"
     108 |               ? "Network error - please check your connection"
```

---

#### 🟡 Line 107: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     104 |           ? "Login cancelled"
     105 |           : errorCode === "auth/popup-blocked"
     106 |             ? "Popup blocked - please allow popups and try again"
>>>  107 |             : errorCode === "auth/network-request-failed"
     108 |               ? "Network error - please check your connection"
     109 |               : "Login failed - please try again"
     110 |       );
```

---

### 📁 `scripts/lighthouse-audit.js` (3 issues)

#### 🔵 Line 17: Prefer `node:fs` over `fs`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      14 |
      15 | const lighthouse = require("lighthouse");
      16 | const chromeLauncher = require("chrome-launcher");
>>>   17 | const fs = require("node:fs");
      18 | const path = require("node:path");
      19 |
      20 | // Configuration
```

---

#### 🔵 Line 18: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      15 | const lighthouse = require("lighthouse");
      16 | const chromeLauncher = require("chrome-launcher");
      17 | const fs = require("node:fs");
>>>   18 | const path = require("node:path");
      19 |
      20 | // Configuration
      21 | const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000";
```

---

#### 🟡 Line 237: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     234 |   }
     235 | }
     236 |
>>>  237 | main().catch((error) => {
     238 |   console.error("Fatal error:", error);
     239 |   process.exit(1);
     240 | });
```

---

### 📁 `tests/scripts/check-docs-light.test.ts` (3 issues)

#### 🔵 Line 3: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
>>>    3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 |
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
>>>    4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 |
       7 | // Get project root (works both in source and compiled contexts)
```

---

#### 🔵 Line 5: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
>>>    5 | import * as fs from "node:fs";
       6 |
       7 | // Get project root (works both in source and compiled contexts)
       8 | const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
```

---

### 📁 `tests/scripts/update-readme-status.test.ts` (3 issues)

#### 🔵 Line 3: Prefer `node:child_process` over `child_process`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
>>>    3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 |
```

---

#### 🔵 Line 4: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       1 | import assert from "node:assert/strict";
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
>>>    4 | import * as path from "node:path";
       5 | import * as fs from "node:fs";
       6 |
       7 | // Get project root (works both in source and compiled contexts)
```

---

#### 🔵 Line 5: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       2 | import { test, describe } from "node:test";
       3 | import { spawnSync } from "node:child_process";
       4 | import * as path from "node:path";
>>>    5 | import * as fs from "node:fs";
       6 |
       7 | // Get project root (works both in source and compiled contexts)
       8 | const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
```

---

### 📁 `components/home/home-client.tsx` (3 issues)

#### 🔵 Line 7: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       4 | import BookCover from "@/components/notebook/book-cover";
       5 | import NotebookShell from "@/components/notebook/notebook-shell";
       6 | import { AnimatePresence } from "framer-motion";
>>>    7 | import { useAuth } from "@/components/providers/auth-provider";
       8 | import { AuthErrorBanner } from "@/components/status/auth-error-banner";
       9 |
      10 | /**
```

---

#### 🔵 Line 21: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      18 |  */
      19 | export default function HomeClient() {
      20 |   const [isOpen, setIsOpen] = useState(false);
>>>   21 |   const { profile } = useAuth();
      22 |
      23 |   const handleOpenBook = () => {
      24 |     if (!isOpen) {
```

---

#### 🔵 Line 42: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      39 |       {/* Notebook container - asymmetrical padding to account for tabs on right */}
      40 |       <div className="relative z-10 min-h-full w-full flex items-center justify-center py-12 pl-4 pr-14 md:px-0">
      41 |         <AnimatePresence mode="wait">
>>>   42 |           {!isOpen ? (
      43 |             <BookCover key="cover" onOpen={handleOpenBook} />
      44 |           ) : (
      45 |             <NotebookShell
```

---

### 📁 `app/layout.tsx` (3 issues)

#### 🔵 Line N/A: 'next' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

---

#### 🔵 Line 2: 'next' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
       1 | import type React from "react";
>>>    2 | import type { Metadata } from "next";
       3 | import localFont from "next/font/local";
       4 | import Script from "next/script";
       5 | import { AuthProvider } from "@/components/providers/auth-provider";
```

---

#### 🔵 Line 55: 'next' imported multiple times.

- **Rule**: `typescript:S3863`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 1min

```tsx
      52 |   },
      53 | };
      54 |
>>>   55 | import type { Viewport } from "next";
      56 | import { InstallPrompt } from "@/components/pwa/install-prompt";
      57 |
      58 | export const viewport: Viewport = {
```

---

### 📁 `components/admin/admin-crud-table.tsx` (3 issues)

#### 🟠 Line N/A: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

---

#### 🔵 Line 25: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      22 |   config: AdminCrudConfig<T>;
      23 | }
      24 |
>>>   25 | export function AdminCrudTable<T extends BaseEntity>({ config }: AdminCrudTableProps<T>) {
      26 |   const [items, setItems] = useState<T[]>([]);
      27 |   const [loading, setLoading] = useState(true);
      28 |   const [searchTerm, setSearchTerm] = useState("");
```

---

#### 🟠 Line 92: Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 6min

```tsx
      89 |   }, [fetchItems]);
      90 |
      91 |   // Filter items
>>>   92 |   const filteredItems = items.filter((item) => {
      93 |     // Search filter
      94 |     const matchesSearch = config.searchFields.some((field) => {
      95 |       const value = item[field];
```

---

### 📁 `components/celebrations/celebration-overlay.tsx` (3 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🔵 Line 15: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      12 |   onClose: () => void;
      13 | }
      14 |
>>>   15 | export function CelebrationOverlay({ event, onClose }: CelebrationOverlayProps) {
      16 |   const { type, intensity, message, daysClean } = event;
      17 |
      18 |   // Determine which icon to use for subtle celebrations
```

---

#### 🟡 Line 64: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      61 |       <MilestoneModal
      62 |         isOpen={true}
      63 |         title={
>>>   64 |           type === "one-year" ? "1 Year Clean!" : daysClean ? `${daysClean} Days!` : "Milestone!"
      65 |         }
      66 |         message={message || "Amazing achievement!"}
      67 |         daysClean={daysClean}
```

---

### 📁 `components/journal/journal-hub.tsx` (3 issues)

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line 10: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       7 | import { Timeline } from "./timeline";
       8 | import { FloatingPen } from "./floating-pen";
       9 | import { RibbonNav } from "./ribbon-nav";
>>>   10 | import { useAuth } from "@/components/providers/auth-provider";
      11 | import { LockScreen } from "./lock-screen";
      12 | import { signInAnonymously } from "firebase/auth";
      13 | import { auth } from "@/lib/firebase";
```

---

#### 🔵 Line 25: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      22 | import { logger } from "@/lib/logger";
      23 |
      24 | export default function JournalHub() {
>>>   25 |   const { user, loading } = useAuth();
      26 |   const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
      27 |   const [isMenuOpen, setIsMenuOpen] = React.useState(false);
      28 |   const [activeEntryType, setActiveEntryType] = React.useState<JournalEntryType | null>(null);
```

---

### 📁 `lib/security/firestore-validation.ts` (3 issues)

#### 🟡 Line N/A: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

#### 🟡 Line 42: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
      39 |  */
      40 | const isValidUserId = (userId: string): boolean => {
      41 |   // Check for empty/whitespace
>>>   42 |   if (!userId || !userId.trim()) {
      43 |     return false;
      44 |   }
      45 |
```

---

#### 🟡 Line 99: Refactor this code to not use nested template literals.

- **Rule**: `typescript:S4624`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

```ts
      96 |
      97 |   if (targetUserId && targetUserId !== userId) {
      98 |     throw new Error(
>>>   99 |       `Access to another user's data is not allowed${resource ? ` for ${resource}` : ""}`
     100 |     );
     101 |   }
     102 | };
```

---

### 📁 `components/notebook/hooks/use-smart-prompts.ts` (3 issues)

#### 🔵 Line 47: Compare with `undefined` directly instead of using `typeof`.

- **Rule**: `typescript:S7741`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      44 |   // Load dismissed prompts from localStorage on mount using lazy initializer
      45 |   // SSR guard: localStorage is not available during server-side rendering
      46 |   const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(() => {
>>>   47 |     if (typeof globalThis.window === "undefined") {
      48 |       return new Set();
      49 |     }
      50 |
```

---

#### 🔵 Line 74: Compare with `undefined` directly instead of using `typeof`.

- **Rule**: `typescript:S7741`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      71 |       const updated = new Set(prev).add(promptId);
      72 |
      73 |       // SSR guard: persist to localStorage only in browser
>>>   74 |       if (typeof globalThis.window !== "undefined") {
      75 |         try {
      76 |           const today = getTodayDateId(new Date());
      77 |           const storageKey = `dismissed-prompts-${today}`;
```

---

#### 🔵 Line 102: arrow function is equivalent to `Boolean`. Use `Boolean` directly.

- **Rule**: `typescript:S7770`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      99 |   // Smart prompt: HALT suggestion when user is struggling
     100 |   const showHaltSuggestion = useMemo(() => {
     101 |     if (dismissedPrompts.has("halt-suggestion")) return false;
>>>  102 |     return mood === "struggling" && !haltSubmitted && !Object.values(haltCheck).some((v) => v);
     103 |   }, [mood, haltCheck, haltSubmitted, dismissedPrompts]);
     104 |
     105 |   // Smart prompt: Celebrate no-cravings streak (7+ days)
```

---

### 📁 `.claude/skills/systematic-debugging/find-polluter.sh` (3 issues)

#### 🟡 Line 8: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
       5 |
       6 | set -e
       7 |
>>>    8 | if [ $# -ne 2 ]; then
       9 |   echo "Usage: $0 <file_to_check> <test_pattern>"
      10 |   echo "Example: $0 '.git' 'src/**/*.test.ts'"
      11 |   exit 1
```

---

#### 🟡 Line 33: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      30 |   COUNT=$((COUNT + 1))
      31 |
      32 |   # Skip if pollution already exists
>>>   33 |   if [ -e "$POLLUTION_CHECK" ]; then
      34 |     echo "⚠️  Pollution already exists before test $COUNT/$TOTAL"
      35 |     echo "   Skipping: $TEST_FILE"
      36 |     continue
```

---

#### 🟡 Line 45: Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.

- **Rule**: `shelldre:S7688`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      42 |   npm test "$TEST_FILE" > /dev/null 2>&1 || true
      43 |
      44 |   # Check if pollution appeared
>>>   45 |   if [ -e "$POLLUTION_CHECK" ]; then
      46 |     echo ""
      47 |     echo "🎯 FOUND POLLUTER!"
      48 |     echo "   Test: $TEST_FILE"
```

---

### 📁 `scripts/migrate-addresses.ts` (3 issues)

#### 🔵 Line 12: Prefer `node:path` over `path`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       9 |
      10 | import { initializeApp, cert } from "firebase-admin/app";
      11 | import { getFirestore } from "firebase-admin/firestore";
>>>   12 | import * as path from "node:path";
      13 | import * as fs from "node:fs";
      14 | import { sanitizeError } from "./lib/sanitize-error.js";
      15 |
```

---

#### 🔵 Line 13: Prefer `node:fs` over `fs`.

- **Rule**: `typescript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      10 | import { initializeApp, cert } from "firebase-admin/app";
      11 | import { getFirestore } from "firebase-admin/firestore";
      12 | import * as path from "node:path";
>>>   13 | import * as fs from "node:fs";
      14 | import { sanitizeError } from "./lib/sanitize-error.js";
      15 |
      16 | async function migrateAddresses() {
```

---

#### 🟡 Line 102: Prefer top-level await over using a promise chain.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
      99 |
     100 | migrateAddresses()
     101 |   .then(() => process.exit(0))
>>>  102 |   .catch((error) => {
     103 |     // Use sanitizeError to avoid exposing sensitive paths
     104 |     console.error("Unexpected error:", sanitizeError(error));
     105 |     process.exit(1);
```

---

### 📁 `components/notebook/features/quick-actions-fab.tsx` (3 issues)

#### ⚪ Line 12: Complete the task associated to this "TODO" comment.

- **Rule**: `typescript:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

```tsx
       9 |   onQuickMood?: () => void;
      10 | }
      11 |
>>>   12 | // TODO: Make action buttons customizable by user (save preferences to profile/localStorage)
      13 | // - Allow users to choose which actions to show
      14 | // - Allow users to reorder actions
      15 | // - Allow users to add custom phone numbers (sponsor, etc.)
```

---

#### 🔵 Line 17: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      14 | // - Allow users to reorder actions
      15 | // - Allow users to add custom phone numbers (sponsor, etc.)
      16 | // - Consider settings panel in More tab
>>>   17 | export function QuickActionsFab({ onNavigate, onQuickMood }: QuickActionsFabProps) {
      18 |   const [isOpen, setIsOpen] = useState(false);
      19 |
      20 |   const actions = [
```

---

#### 🔵 Line 36: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      33 |       color: "bg-blue-500 hover:bg-blue-600",
      34 |       onClick: () => {
      35 |         // Future: integrate with contacts
>>>   36 |         window.location.href = "tel:";
      37 |         setIsOpen(false);
      38 |       },
      39 |     },
```

---

### 📁 `lib/utils.ts` (3 issues)

#### 🟡 Line N/A: Remove this conditional structure or edit its code blocks so that they're not all the same.

- **Rule**: `typescript:S3923`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 15min

---

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🟡 Line N/A: This branch's code block is the same as the block for the branch on line 28.

- **Rule**: `typescript:S1871`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 10min

---

### 📁 `components/ui/voice-text-area.tsx` (3 issues)

#### 🔵 Line 19: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      16 |
      17 |     React.useEffect(() => {
      18 |       // Check for browser support
>>>   19 |       if (typeof window !== "undefined") {
      20 |         const win = window as typeof window & {
      21 |           SpeechRecognition?: SpeechRecognitionConstructor;
      22 |           webkitSpeechRecognition?: SpeechRecognitionConstructor;
```

---

#### 🔵 Line 20: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      17 |     React.useEffect(() => {
      18 |       // Check for browser support
      19 |       if (typeof window !== "undefined") {
>>>   20 |         const win = window as typeof window & {
      21 |           SpeechRecognition?: SpeechRecognitionConstructor;
      22 |           webkitSpeechRecognition?: SpeechRecognitionConstructor;
      23 |         };
```

---

#### 🔵 Line 20: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      17 |     React.useEffect(() => {
      18 |       // Check for browser support
      19 |       if (typeof window !== "undefined") {
>>>   20 |         const win = window as typeof window & {
      21 |           SpeechRecognition?: SpeechRecognitionConstructor;
      22 |           webkitSpeechRecognition?: SpeechRecognitionConstructor;
      23 |         };
```

---

### 📁 `components/celebrations/firework-burst.tsx` (3 issues)

#### 🔵 Line 26: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      23 |   colors?: string[];
      24 | }
      25 |
>>>   26 | export function FireworkBurst({
      27 |   count = 5,
      28 |   colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"],
      29 | }: FireworkBurstProps) {
```

---

#### 🔵 Line 32: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      29 | }: FireworkBurstProps) {
      30 |   // Use lazy initialization to avoid calling Math.random during render
      31 |   const [fireworks] = useState<Firework[]>(() => {
>>>   32 |     if (typeof window === "undefined") return [];
      33 |
      34 |     const createFirework = (id: number): Firework => {
      35 |       const sparkCount = 24; // Number of sparks per firework
```

---

#### 🔵 Line 55: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      52 |     return Array.from({ length: count }, (_, i) => createFirework(i));
      53 |   });
      54 |
>>>   55 |   if (typeof window === "undefined") return null;
      56 |
      57 |   return (
      58 |     <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
```

---

### 📁 `components/notebook/features/clean-time-display.tsx` (3 issues)

#### 🟠 Line 29: Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 8min

```tsx
      26 |  * @example
      27 |  * <CleanTimeDisplay cleanStart={profile.cleanStart} />
      28 |  */
>>>   29 | export function CleanTimeDisplay({ cleanStart }: CleanTimeDisplayProps) {
      30 |   if (!cleanStart) {
      31 |     return (
      32 |       <div>
```

---

#### 🔵 Line 29: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      26 |  * @example
      27 |  * <CleanTimeDisplay cleanStart={profile.cleanStart} />
      28 |  */
>>>   29 | export function CleanTimeDisplay({ cleanStart }: CleanTimeDisplayProps) {
      30 |   if (!cleanStart) {
      31 |     return (
      32 |       <div>
```

---

#### 🟡 Line 98: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      95 |     <div>
      96 |       <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
      97 |         {parts.map((part, index) => (
>>>   98 |           <span key={index} className="text-center">
      99 |             <span className={`font-heading-alt ${part.size} text-amber-900`}>{part.text}</span>
     100 |             {index < parts.length - 1 && <span className="text-amber-900/40 mx-1">•</span>}
     101 |           </span>
```

---

### 📁 `components/journal/entry-forms/gratitude-form.tsx` (3 issues)

#### 🔵 Line 15: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      12 |   onSuccess: () => void;
      13 | }
      14 |
>>>   15 | export function GratitudeForm({ onClose, onSuccess }: GratitudeFormProps) {
      16 |   const { addEntry } = useJournal();
      17 |   const [items, setItems] = React.useState<string[]>(["", "", ""]);
      18 |   const [isSubmitting, setIsSubmitting] = React.useState(false);
```

---

#### 🟡 Line 77: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      74 |
      75 |         <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
      76 |           <div className="space-y-3">
>>>   77 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider text-center">
      78 |               I am grateful for...
      79 |             </label>
      80 |
```

---

#### 🟡 Line 82: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      79 |             </label>
      80 |
      81 |             {items.map((item, index) => (
>>>   82 |               <div key={index} className="flex gap-2 items-center">
      83 |                 <span className="font-handlee text-[var(--journal-text)]/50 w-6 text-right">
      84 |                   {index + 1}.
      85 |                 </span>
```

---

### 📁 `components/journal/entry-forms/mood-form.tsx` (3 issues)

#### 🔵 Line 25: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      22 |   { emoji: "😤", label: "Angry" },
      23 | ];
      24 |
>>>   25 | export function MoodForm({ onClose, onSuccess }: MoodFormProps) {
      26 |   const { addEntry } = useJournal();
      27 |   const [mood, setMood] = React.useState<string | null>(null);
      28 |   const [intensity, setIntensity] = React.useState(5);
```

---

#### 🟡 Line 71: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      68 |         <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
      69 |           {/* Mood Selection */}
      70 |           <div className="space-y-2">
>>>   71 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
      72 |               How are you feeling?
      73 |             </label>
      74 |             <div className="flex flex-wrap gap-3 justify-center">
```

---

#### 🟡 Line 118: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     115 |
     116 |           {/* Note */}
     117 |           <div className="space-y-2">
>>>  118 |             <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
     119 |               Note (Optional)
     120 |             </label>
     121 |             <textarea
```

---

### 📁 `components/notebook/journal-modal.tsx` (3 issues)

#### 🔵 Line 7: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       4 | import { motion } from "framer-motion";
       5 | import { X, Save } from "lucide-react";
       6 | import { VoiceTextArea } from "@/components/ui/voice-text-area";
>>>    7 | import { useAuth } from "@/components/providers/auth-provider";
       8 | import { useJournal } from "@/hooks/use-journal";
       9 | import { logger } from "@/lib/logger";
      10 | import { toast } from "sonner";
```

---

#### 🔵 Line 27: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      24 |  * @param onClose - Callback invoked to close the modal (called when cancelling or after a successful save)
      25 |  * @returns The rendered modal element for creating a new journal entry
      26 |  */
>>>   27 | export default function JournalModal({ onClose }: JournalModalProps) {
      28 |   const { user } = useAuth();
      29 |   const { addEntry } = useJournal();
      30 |   const [content, setContent] = useState("");
```

---

#### 🔵 Line 28: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      25 |  * @returns The rendered modal element for creating a new journal entry
      26 |  */
      27 | export default function JournalModal({ onClose }: JournalModalProps) {
>>>   28 |   const { user } = useAuth();
      29 |   const { addEntry } = useJournal();
      30 |   const [content, setContent] = useState("");
      31 |   const [isSaving, setIsSaving] = useState(false);
```

---

### 📁 `components/providers/auth-context.tsx` (3 issues)

#### 🔵 Line 82: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      79 |   onUserChange?: (user: User | null) => void;
      80 | }
      81 |
>>>   82 | export function AuthProvider({ children, onUserChange }: AuthProviderProps) {
      83 |   const [user, setUser] = useState<User | null>(null);
      84 |   const [loading, setLoading] = useState(true);
      85 |
```

---

#### 🔵 Line 94: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      91 |       // Update Sentry user context (hashed ID, no PII)
      92 |       setSentryUser(currentUser?.uid ?? null);
      93 |
>>>   94 |       if (!currentUser) {
      95 |         setLoading(true);
      96 |         await ensureAnonymousSession(auth, setLoading);
      97 |       } else {
```

---

#### 🟡 Line 122: The object passed as the value prop to the Context provider changes every render. To fix this consider wrapping it in a useMemo hook.

- **Rule**: `typescript:S6481`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     119 |   const showLinkPrompt = shouldShowLinkPrompt(user);
     120 |
     121 |   return (
>>>  122 |     <AuthContext.Provider value={{ user, loading, isAnonymous, showLinkPrompt }}>
     123 |       {children}
     124 |     </AuthContext.Provider>
     125 |   );
```

---

### 📁 `components/providers/profile-context.tsx` (3 issues)

#### 🔵 Line 41: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      38 |   user: User | null;
      39 | }
      40 |
>>>   41 | export function ProfileProvider({ children, user }: ProfileProviderProps) {
      42 |   const [profile, setProfile] = useState<UserProfile | null>(null);
      43 |   const [profileError, setProfileError] = useState<string | null>(null);
      44 |   const [profileNotFound, setProfileNotFound] = useState(false);
```

---

#### 🟡 Line 71: 'If' statement should not be the only statement in 'else' block

- **Rule**: `typescript:S6660`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      68 |         setProfileNotFound(false);
      69 |       }
      70 |     } else {
>>>   71 |       if (previousProfileRef.current !== null) {
      72 |         previousProfileRef.current = null;
      73 |         setProfile(null);
      74 |         setProfileNotFound(true);
```

---

#### 🟡 Line 131: The object passed as the value prop to the Context provider changes every render. To fix this consider wrapping it in a useMemo hook.

- **Rule**: `typescript:S6481`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     128 |   }, [user, handleProfileSnapshot, handleProfileError]);
     129 |
     130 |   return (
>>>  131 |     <ProfileContext.Provider value={{ profile, profileError, profileNotFound }}>
     132 |       {children}
     133 |     </ProfileContext.Provider>
     134 |   );
```

---

### 📁 `components/status/auth-error-banner.tsx` (3 issues)

#### 🔵 Line 6: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       3 | import { useEffect, useMemo } from "react";
       4 | import { AlertCircle } from "lucide-react";
       5 | import { toast } from "sonner";
>>>    6 | import { useAuth } from "@/components/providers/auth-provider";
       7 |
       8 | interface AuthErrorBannerProps {
       9 |   className?: string;
```

---

#### 🔵 Line 14: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      11 |
      12 | const seenMessages = new Set<string>();
      13 |
>>>   14 | export function AuthErrorBanner({ className }: AuthErrorBannerProps) {
      15 |   const { profileError, todayLogError, profileNotFound } = useAuth();
      16 |
      17 |   const messages = useMemo(() => {
```

---

#### 🔵 Line 15: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
      12 | const seenMessages = new Set<string>();
      13 |
      14 | export function AuthErrorBanner({ className }: AuthErrorBannerProps) {
>>>   15 |   const { profileError, todayLogError, profileNotFound } = useAuth();
      16 |
      17 |   const messages = useMemo(() => {
      18 |     const list: string[] = [];
```

---

### 📁 `components/notebook/visualizations/mood-sparkline.tsx` (3 issues)

#### 🔵 Line 6: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       3 | import { useEffect, useState } from "react";
       4 | import { motion } from "framer-motion";
       5 | import { FirestoreService, type DailyLog } from "@/lib/firestore-service";
>>>    6 | import { useAuth } from "@/components/providers/auth-provider";
       7 | import { logger, maskIdentifier } from "@/lib/logger";
       8 |
       9 | export default function MoodSparkline() {
```

---

#### 🔵 Line 10: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

```tsx
       7 | import { logger, maskIdentifier } from "@/lib/logger";
       8 |
       9 | export default function MoodSparkline() {
>>>   10 |   const { user } = useAuth();
      11 |   const [logs, setLogs] = useState<DailyLog[]>([]);
      12 |   const [loading, setLoading] = useState(true);
      13 |
```

---

#### 🟡 Line 98: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      95 |             const y = height - (p.value / 4) * (height - 10) - 5;
      96 |             return (
      97 |               <motion.circle
>>>   98 |                 key={i}
      99 |                 cx={x}
     100 |                 cy={y}
     101 |                 r="3"
```

---

### 📁 `app/page.tsx` (3 issues)

#### 🔵 Line N/A: 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: The signature '(): { user: any; loading: any; isAnonymous: any; showLinkPrompt: any; profile: any; profileError: any; profileNotFound: any; todayLog: any; todayLogError: any; refreshTodayLog: any; }' of 'useAuth' is deprecated.

- **Rule**: `typescript:S1874`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 15min

---

#### 🔵 Line N/A: Unexpected negated condition.

- **Rule**: `typescript:S7735`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

### 📁 `tests/firestore-service.test.ts` (2 issues)

#### 🟡 Line N/A: Either use this collection's contents or remove the collection.

- **Rule**: `typescript:S4030`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

---

#### 🟡 Line 18: Either use this collection's contents or remove the collection.

- **Rule**: `typescript:S4030`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
      15 |   process.env[key] = process.env[key] || "test-value";
      16 | });
      17 |
>>>   18 | let setDocCalls: any[][];
      19 | let validateCalls: any[][];
      20 | let getDocReturn: any;
      21 | let getDocsReturn: any;
```

---

### 📁 `tests/utils/date-utils.test.ts` (2 issues)

#### 🔵 Line N/A: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 74: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      71 |
      72 |     // Should successfully parse
      73 |     assert.ok(parsed instanceof Date);
>>>   74 |     assert.ok(!isNaN(parsed.getTime()));
      75 |
      76 |     // Re-formatting should give same date ID
      77 |     const roundtrip = getTodayDateId(parsed);
```

---

### 📁 `components/admin/admin-tabs.tsx` (2 issues)

#### 🔵 Line N/A: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🟡 Line 72: Move this component definition out of the parent component and pass data as props.

- **Rule**: `typescript:S6478`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      69 |       label: string;
      70 |       icon: React.ComponentType<{ className?: string }>;
      71 |     };
>>>   72 |   }) => {
      73 |     const Icon = tab.icon;
      74 |     const selected = activeTab === tab.id;
      75 |     return (
```

---

### 📁 `components/dev/lighthouse-tab.tsx` (2 issues)

#### 🔵 Line 64: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      61 | }
      62 |
      63 | // Score badge component
>>>   64 | function ScoreBadge({ score, label }: { score: number; label: string }) {
      65 |   return (
      66 |     <div className={`text-center p-2 rounded ${getScoreBg(score)}`}>
      67 |       <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
```

---

#### 🟠 Line 81: Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 7min

```tsx
      78 |   useEffect(() => {
      79 |     let isCancelled = false;
      80 |
>>>   81 |     async function fetchLatestRun() {
      82 |       try {
      83 |         const historyRef = collection(db, "dev", "lighthouse", "history");
      84 |         const q = query(historyRef, orderBy("timestamp", "desc"), limit(1));
```

---

### 📁 `components/dev/dev-dashboard.tsx` (2 issues)

#### 🔵 Line 24: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      21 |   onLogout: () => void;
      22 | }
      23 |
>>>   24 | export function DevDashboard({ user, onLogout }: DevDashboardProps) {
      25 |   const [activeTab, setActiveTab] = useState<DevTabId>("lighthouse");
      26 |
      27 |   return (
```

---

#### 🔵 Line 65: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      62 | }
      63 |
      64 | // Placeholder for tabs not yet implemented
>>>   65 | function PlaceholderTab({ title, icon }: { title: string; icon: string }) {
      66 |   return (
      67 |     <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
      68 |       <div className="text-6xl mb-4">{icon}</div>
```

---

### 📁 `lib/logger.ts` (2 issues)

#### ⚪ Line N/A: Complete the task associated to this "TODO" comment.

- **Rule**: `typescript:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

---

#### 🔵 Line 87: Prefer `String#replaceAll()` over `String#replace()`.

- **Rule**: `typescript:S7781`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      84 | const sanitizeMessage = (message: string): string => {
      85 |   // Strip control characters to prevent log injection
      86 |   // eslint-disable-next-line no-control-regex
>>>   87 |   const cleaned = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
      88 |
      89 |   // Split into words and fully redact any that look like sensitive IDs
      90 |   const redacted = cleaned
```

---

### 📁 `app/admin/page.tsx` (2 issues)

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 33: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      30 |   // Mobile detection - block admin panel on mobile devices
      31 |   const [state, setState] = useState<AdminState>(() => {
      32 |     // Only run mobile detection in browser (not during SSR)
>>>   33 |     if (typeof window === "undefined") return "loading";
      34 |
      35 |     const isMobile =
      36 |       /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
```

---

### 📁 `components/meetings/meeting-details-dialog.tsx` (2 issues)

#### 🔵 Line N/A: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 23: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      20 |   userLocation?: { lat: number; lng: number } | null;
      21 | }
      22 |
>>>   23 | export function MeetingDetailsDialog({
      24 |   meeting,
      25 |   open,
      26 |   onOpenChange,
```

---

### 📁 `hooks/use-geolocation.ts` (2 issues)

#### 🔵 Line N/A: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

---

#### 🔵 Line 80: Prefer `globalThis.window` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      77 |   });
      78 |
      79 |   // Check if geolocation is available in this browser
>>>   80 |   const isAvailable = typeof window !== "undefined" && "geolocation" in navigator;
      81 |
      82 |   /**
      83 |    * Request the user's location
```

---

### 📁 `lib/db/collections.ts` (2 issues)

#### 🔵 Line N/A: Replace this union type with a type alias.

- **Rule**: `typescript:S4323`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 97: Replace this union type with a type alias.

- **Rule**: `typescript:S4323`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      94 |  */
      95 | export function getUserCollection(
      96 |   userId: string,
>>>   97 |   subcollection: "journal" | "daily_logs" | "inventory" | "worksheets"
      98 | ): CollectionReference {
      99 |   return collection(db, COLLECTIONS.USERS, userId, subcollection);
     100 | }
```

---

### 📁 `scripts/mcp/sonarcloud-server.js` (2 issues)

#### 🟡 Line N/A: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

#### 🟡 Line 486: Prefer top-level await over using a promise chain.

- **Rule**: `javascript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
     483 |   }
     484 | }
     485 |
>>>  486 | main().catch((error) => {
     487 |   // Sanitize error output - don't expose stack traces
     488 |   console.error(`Fatal error: ${error.message || "Unknown error"}`);
     489 |   process.exit(1);
```

---

### 📁 `tests/utils/logger.test.ts` (2 issues)

#### 🔵 Line N/A: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

---

#### 🔵 Line 173: Use the "RegExp.exec()" method instead.

- **Rule**: `typescript:S6594`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     170 |       logger.info("Test");
     171 |       const log = capturedLogs[0] as { type: string; args: unknown[] };
     172 |       const payload = log.args[0] as { timestamp: string };
>>>  173 |       assert.ok(payload.timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
     174 |     });
     175 |   });
     176 | });
```

---

### 📁 `scripts/validate-canon-schema.js` (2 issues)

#### 🟠 Line 80: Refactor this function to reduce its Cognitive Complexity from 37 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 27min

```js
      77 |   }
      78 | }
      79 |
>>>   80 | function validateFinding(finding, lineNum, result) {
      81 |   // Check required fields
      82 |   for (const field of REQUIRED_FIELDS) {
      83 |     if (!(field in finding)) {
```

---

#### 🟠 Line 235: Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

- **Rule**: `javascript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 19min

```js
     232 |   return result;
     233 | }
     234 |
>>>  235 | function printResult(result) {
     236 |   const status = result.isValid ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
     237 |   console.log(
     238 |     `\n${status} ${result.filename} (${result.findings} findings, ${result.compliance}% compliance)`
```

---

### 📁 `.claude/hooks/coderabbit-review.sh` (2 issues)

#### 🟡 Line 29: Add an explicit return statement at the end of the function.

- **Rule**: `shelldre:S7682`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      26 | fi
      27 |
      28 | # Portable lowercase function (Bash 4.0+ has ${var,,}, macOS ships Bash 3.2)
>>>   29 | to_lower() {
      30 |     if ( set +u; : "${1,,}" ) 2>/dev/null; then
      31 |         printf '%s' "${1,,}"
      32 |     else
```

---

#### 🟡 Line 33: Assign this positional parameter to a local variable.

- **Rule**: `shelldre:S7679`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```sh
      30 |     if ( set +u; : "${1,,}" ) 2>/dev/null; then
      31 |         printf '%s' "${1,,}"
      32 |     else
>>>   33 |         printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
      34 |     fi
      35 | }
      36 |
```

---

### 📁 `scripts/lib/sanitize-error.js` (2 issues)

#### 🟡 Line 30: Remove duplicates in this character class.

- **Rule**: `javascript:S5869`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```js
      27 |   /api[_-]?key[=:]\s*\S+/gi, // API keys
      28 |   /token[=:]\s*\S+/gi, // Tokens
      29 |   /secret[=:]\s*\S+/gi, // Secrets
>>>   30 |   /Bearer\s+[A-Za-z0-9._-]+/gi, // Bearer tokens
      31 |
      32 |   // Connection strings
      33 |   /mongodb(\+srv)?:\/\/[^\s]+/gi, // MongoDB
```

---

#### 🔵 Line 65: Remove the declaration of the unused 'preserveStackInDev' variable.

- **Rule**: `javascript:S1481`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```js
      62 |  */
      63 | export function sanitizeError(error, options = {}) {
      64 |   const {
>>>   65 |     preserveStackInDev = true, // Reserved for future: preserve stack in dev mode
      66 |     verbose = false,
      67 |   } = options;
      68 |
```

---

### 📁 `components/notebook/features/recovery-notepad.tsx` (2 issues)

#### 🔵 Line 25: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      22 |  * @param isSaving - Whether auto-save is in progress
      23 |  * @param saveComplete - Whether the last save completed successfully
      24 |  */
>>>   25 | export function RecoveryNotepad({
      26 |   textareaRef,
      27 |   journalEntry,
      28 |   onJournalChange,
```

---

#### 🟡 Line 99: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      96 |               <Loader2 className="w-3 h-3 animate-spin" />
      97 |               Saving...
      98 |             </span>
>>>   99 |           ) : saveComplete ? (
     100 |             <span className="text-green-600 font-bold">✓ Saved</span>
     101 |           ) : null}
     102 |         </div>
```

---

### 📁 `components/notebook/features/check-in-progress.tsx` (2 issues)

#### 🔵 Line 9: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       6 |   steps: Array<{ id: string; label: string; completed: boolean }>;
       7 | }
       8 |
>>>    9 | export function CheckInProgress({ currentStep, totalSteps, steps }: CheckInProgressProps) {
      10 |   return (
      11 |     <div className="mb-6 bg-amber-50/50 border border-amber-100 rounded-lg p-4">
      12 |       <div className="flex items-center justify-between mb-3">
```

---

#### 🟡 Line 35: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      32 |               className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
      33 |                 step.completed
      34 |                   ? "bg-green-500 text-white scale-110"
>>>   35 |                   : index < currentStep
      36 |                     ? "bg-amber-400 text-white"
      37 |                     : "bg-amber-100 text-amber-400"
      38 |               }`}
```

---

### 📁 `components/notebook/features/mood-selector.tsx` (2 issues)

#### 🔵 Line 45: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      42 |  *   onMoodSelect={(m) => { setMood(m); setHasTouched(true) }}
      43 |  * />
      44 |  */
>>>   45 | export function MoodSelector({
      46 |   selectedMood,
      47 |   onMoodSelect,
      48 |   options = MOOD_OPTIONS,
```

---

#### 🟡 Line 51: Use <details>, <fieldset>, <optgroup>, or <address> instead of the "group" role to ensure accessibility across all devices.

- **Rule**: `typescript:S6819`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      48 |   options = MOOD_OPTIONS,
      49 | }: MoodSelectorProps) {
      50 |   return (
>>>   51 |     <div className="flex justify-between gap-2 mb-4" role="group" aria-label="Mood selection">
      52 |       {options.map((m) => (
      53 |         <button
      54 |           key={m.id}
```

---

### 📁 `lib/utils/anonymous-backup.ts` (2 issues)

#### 🟡 Line 41: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
      38 |     const backup = getBackup();
      39 |
      40 |     // Initialize or update userId
>>>   41 |     if (!backup || backup.userId !== userId) {
      42 |       saveBackup({
      43 |         userId,
      44 |         entries: [entry],
```

---

#### 🟡 Line 77: Prefer using an optional chain expression instead, as it's more concise and easier to read.

- **Rule**: `typescript:S6582`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
      74 |   try {
      75 |     const backup = getBackup();
      76 |
>>>   77 |     if (!backup || backup.userId !== userId) {
      78 |       saveBackup({
      79 |         userId,
      80 |         entries: [],
```

---

### 📁 `functions/src/firestore-rate-limiter.ts` (2 issues)

#### 🟡 Line 27: Member 'config' is never reassigned; mark it as `readonly`.

- **Rule**: `typescript:S2933`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
      24 | }
      25 |
      26 | export class FirestoreRateLimiter {
>>>   27 |   private config: RateLimitConfig;
      28 |   private collectionName: string;
      29 |
      30 |   constructor(config: RateLimitConfig) {
```

---

#### 🟡 Line 28: Member 'collectionName' is never reassigned; mark it as `readonly`.

- **Rule**: `typescript:S2933`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
      25 |
      26 | export class FirestoreRateLimiter {
      27 |   private config: RateLimitConfig;
>>>   28 |   private collectionName: string;
      29 |
      30 |   constructor(config: RateLimitConfig) {
      31 |     this.config = config;
```

---

### 📁 `components/notebook/roadmap-modules.tsx` (2 issues)

#### 🔵 Line 12: Use `export…from` to re-export `NotebookModule`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       9 |
      10 | import { NotebookModule, NotebookModuleId } from "./notebook-types";
      11 |
>>>   12 | export type { NotebookModule, NotebookModuleId };
      13 |
      14 | export const notebookModules: NotebookModule[] = [
      15 |   {
```

---

#### 🔵 Line 12: Use `export…from` to re-export `NotebookModuleId`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       9 |
      10 | import { NotebookModule, NotebookModuleId } from "./notebook-types";
      11 |
>>>   12 | export type { NotebookModule, NotebookModuleId };
      13 |
      14 | export const notebookModules: NotebookModule[] = [
      15 |   {
```

---

### 📁 `components/providers/daily-log-context.tsx` (2 issues)

#### 🔵 Line 31: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      28 |   user: User | null;
      29 | }
      30 |
>>>   31 | export function DailyLogProvider({ children, user }: DailyLogProviderProps) {
      32 |   const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
      33 |   const [todayLogError, setTodayLogError] = useState<string | null>(null);
      34 |
```

---

#### 🟡 Line 75: The object passed as the value prop to the Context provider changes every render. To fix this consider wrapping it in a useMemo hook.

- **Rule**: `typescript:S6481`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      72 |   }, [user]);
      73 |
      74 |   return (
>>>   75 |     <DailyLogContext.Provider value={{ todayLog, todayLogError, refreshTodayLog }}>
      76 |       {children}
      77 |     </DailyLogContext.Provider>
      78 |   );
```

---

### 📁 `components/auth/account-link-modal.tsx` (2 issues)

#### 🔵 Line 13: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      10 |   onSuccess: () => void;
      11 | }
      12 |
>>>   13 | export default function AccountLinkModal({ onClose, onSuccess }: AccountLinkModalProps) {
      14 |   const [email, setEmail] = useState("");
      15 |   const [password, setPassword] = useState("");
      16 |   const [confirmPassword, setConfirmPassword] = useState("");
```

---

#### 🟡 Line 34: 'If' statement should not be the only statement in 'else' block

- **Rule**: `typescript:S6660`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
      31 |       }, 2000);
      32 |     } else {
      33 |       // Don't show error for user cancellation
>>>   34 |       if (result.error.code !== "auth/popup-closed-by-user") {
      35 |         setError(result.error.userMessage);
      36 |       }
      37 |     }
```

---

### 📁 `next.config.mjs` (2 issues)

#### 🔵 Line 1: Prefer `node:path` over `path`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```mjs
>>>    1 | import path from "path";
       2 | import { fileURLToPath } from "url";
       3 | import dotenv from "dotenv";
       4 |
```

---

#### 🔵 Line 2: Prefer `node:url` over `url`.

- **Rule**: `javascript:S7772`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```mjs
       1 | import path from "path";
>>>    2 | import { fileURLToPath } from "url";
       3 | import dotenv from "dotenv";
       4 |
       5 | const __filename = fileURLToPath(import.meta.url);
```

---

### 📁 `lib/database/database-interface.ts` (2 issues)

#### 🔵 Line 12: Use `export…from` to re-export `DailyLog`.

- **Rule**: `typescript:S7763`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
       9 | import type { DailyLog } from "../types/daily-log";
      10 |
      11 | // Re-export DailyLog for consumers of this module
>>>   12 | export type { DailyLog };
      13 |
      14 | /**
      15 |  * Result type for operations that may fail
```

---

#### 🔵 Line 19: 'unknown' overrides all other types in this union type.

- **Rule**: `typescript:S6571`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      16 |  */
      17 | export interface OperationResult<T> {
      18 |   data: T | null;
>>>   19 |   error: unknown | null;
      20 | }
      21 |
      22 | /**
```

---

### 📁 `lib/types/daily-log.ts` (2 issues)

#### 🔵 Line 28: 'unknown' overrides all other types in this union type.

- **Rule**: `typescript:S6571`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      25 |  */
      26 | export interface DailyLogResult {
      27 |   log: DailyLog | null;
>>>   28 |   error: unknown | null;
      29 | }
      30 |
      31 | /**
```

---

#### 🔵 Line 36: 'unknown' overrides all other types in this union type.

- **Rule**: `typescript:S6571`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
      33 |  */
      34 | export interface DailyLogHistoryResult {
      35 |   entries: DailyLog[];
>>>   36 |   error: unknown | null;
      37 | }
      38 |
```

---

### 📁 `components/notebook/pages/support-page.tsx` (2 issues)

#### 🔵 Line 114: Use `new Array()` instead of `Array()`.

- **Rule**: `typescript:S7723`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
     111 |               <div className="space-y-1">
     112 |                 <p className="font-body text-amber-900/70 italic">Ask about step work.</p>
     113 |                 <p className="font-body text-amber-900/70 italic">Share how this week went.</p>
>>>  114 |                 {[...Array(3)].map((_, i) => (
     115 |                   <div key={i} className="h-6 border-b border-amber-200/50" />
     116 |                 ))}
     117 |               </div>
```

---

#### 🟡 Line 115: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     112 |                 <p className="font-body text-amber-900/70 italic">Ask about step work.</p>
     113 |                 <p className="font-body text-amber-900/70 italic">Share how this week went.</p>
     114 |                 {[...Array(3)].map((_, i) => (
>>>  115 |                   <div key={i} className="h-6 border-b border-amber-200/50" />
     116 |                 ))}
     117 |               </div>
     118 |             </div>
```

---

### 📁 `lib/hooks/use-tab-refresh.ts` (1 issues)

#### 🟠 Line 67: Remove this use of the "void" operator.

- **Rule**: `typescript:S3735`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```ts
      64 |     if (currentTimestamp > lastRefreshRef.current) {
      65 |       lastRefreshRef.current = currentTimestamp;
      66 |       // Call the refresh callback
>>>   67 |       void onRefresh();
      68 |     }
      69 |   }, [activeTab, tabId, getTabRefreshTimestamp, onRefresh, options.skipInitial]);
      70 | }
```

---

### 📁 `tests/error-knowledge-base.test.ts` (1 issues)

#### 🔵 Line 144: `components` should be a `Set`, and use `components.has()` to check existence or non-existence.

- **Rule**: `typescript:S7776`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```ts
     141 |     });
     142 |
     143 |     test("has entries for common error categories", () => {
>>>  144 |       const components = ERROR_KNOWLEDGE_BASE.map((e) => e.component);
     145 |
     146 |       assert.ok(components.includes("Authentication"), "should have Authentication");
     147 |       assert.ok(components.includes("Authorization"), "should have Authorization");
```

---

### 📁 `components/dev/dev-tabs.tsx` (1 issues)

#### 🔵 Line 54: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      51 |   setActiveTab: (tab: DevTabId) => void;
      52 | }
      53 |
>>>   54 | export function DevTabs({ activeTab, setActiveTab }: DevTabsProps) {
      55 |   return (
      56 |     <nav className="bg-gray-800 border-b border-gray-700">
      57 |       <div className="max-w-7xl mx-auto px-6">
```

---

### 📁 `mcp.json` (1 issues)

#### 🔴 Line N/A: Make sure this GitHub token gets revoked, changed, and removed from the code.

- **Rule**: `secrets:S6689`
- **Type**: VULNERABILITY
- **Severity**: BLOCKER
- **Effort**: 30min

---

### 📁 `.mcp.json` (1 issues)

#### 🔴 Line N/A: Make sure this SonarQube token gets revoked, changed, and removed from the code.

- **Rule**: `secrets:S6702`
- **Type**: VULNERABILITY
- **Severity**: BLOCKER
- **Effort**: 30min

---

### 📁 `.github/workflows/auto-label-review-tier.yml` (1 issues)

#### ⚪ Line N/A: Complete the task associated to this "TODO" comment.

- **Rule**: `githubactions:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

---

### 📁 `.claude/hooks/check-mcp-servers.sh` (1 issues)

#### 🟡 Line 25: Add an explicit return statement at the end of the function.

- **Rule**: `shelldre:S7682`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      22 | MCP_CONFIG="$PROJECT_DIR/.mcp.json"
      23 |
      24 | # Function to sanitize output - strips ANSI escape sequences and control characters
>>>   25 | sanitize_output() {
      26 |     # Remove ANSI escape sequences (ESC[...m patterns) and control characters
      27 |     # Only allow alphanumeric, spaces, commas, underscores, hyphens
      28 |     tr -cd '[:alnum:] ,_-'
```

---

### 📁 `.claude/hooks/analyze-user-request.sh` (1 issues)

#### 🟡 Line 33: Add an explicit return statement at the end of the function.

- **Rule**: `shelldre:S7682`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```sh
      30 | # Helper function for word boundary-ish matching (portable ERE)
      31 | # Uses non-alphanumeric boundaries to reduce false positives
      32 | # Note: \b is not portable across all grep implementations
>>>   33 | matches_word() {
      34 |     local pattern="$1"
      35 |     # Use portable word boundary pattern instead of \b
      36 |     # Use printf instead of echo to prevent option injection
```

---

### 📁 `eslint.config.mjs` (1 issues)

#### 🔵 Line 13: The empty object is useless.

- **Rule**: `javascript:S7744`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```mjs
      10 |   {
      11 |     plugins: { security },
      12 |     rules: {
>>>   13 |       ...(security.configs.recommended?.rules ?? {}),
      14 |     },
      15 |   },
      16 |   {
```

---

### 📁 `functions/src/security-wrapper.ts` (1 issues)

#### 🟠 Line 106: Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.

- **Rule**: `typescript:S3776`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 29min

```ts
     103 |  *   )
     104 |  * );
     105 |  */
>>>  106 | export async function withSecurityChecks<TInput, TOutput>(
     107 |   request: CallableRequest,
     108 |   options: SecurityOptions<TInput>,
     109 |   handler: (context: SecureCallableContext<TInput>) => Promise<TOutput>
```

---

### 📁 `.env.production` (1 issues)

#### 🔴 Line N/A: Make sure this API key gets revoked, changed, and removed from the code.

- **Rule**: `secrets:S6418`
- **Type**: VULNERABILITY
- **Severity**: BLOCKER
- **Effort**: 30min

---

### 📁 `components/admin/slogans-tab.tsx` (1 issues)

#### 🔵 Line 28: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      25 | }
      26 |
      27 | // Form component
>>>   28 | function SlogansForm({
      29 |   formData,
      30 |   setFormData,
      31 | }: {
```

---

### 📁 `components/notebook/features/smart-prompt.tsx` (1 issues)

#### 🔵 Line 16: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      13 |   onDismiss?: () => void;
      14 | }
      15 |
>>>   16 | export function SmartPrompt({ type, message, action, onDismiss }: SmartPromptProps) {
      17 |   const [isDismissed, setIsDismissed] = useState(false);
      18 |
      19 |   if (isDismissed) return null;
```

---

### 📁 `components/journal/timeline.tsx` (1 issues)

#### 🔵 Line 21: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      18 |   stepwork: ["step-1-worksheet"],
      19 | };
      20 |
>>>   21 | export function Timeline({ filter }: { filter?: string | null }) {
      22 |   const { entries, loading } = useJournal();
      23 |   const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
      24 |
```

---

### 📁 `components/notebook/pages/growth-page.tsx` (1 issues)

#### 🔵 Line 15: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      12 |   onNavigate?: (moduleId: string) => void;
      13 | }
      14 |
>>>   15 | export default function GrowthPage({ onNavigate: _onNavigate }: GrowthPageProps) {
      16 |   const containerVariants = {
      17 |     hidden: { opacity: 0 },
      18 |     show: {
```

---

### 📁 `components/celebrations/success-pulse.tsx` (1 issues)

#### 🔵 Line 12: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       9 |   color?: string;
      10 | }
      11 |
>>>   12 | export function SuccessPulse({
      13 |   message = "Success!",
      14 |   icon = <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 text-white" />,
      15 |   color = "#10b981",
```

---

### 📁 `lib/db/quotes.ts` (1 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

### 📁 `lib/db/slogans.ts` (1 issues)

#### 🟡 Line N/A: Extract this nested ternary operation into an independent statement.

- **Rule**: `typescript:S3358`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

---

### 📁 `components/admin/glossary-tab.tsx` (1 issues)

#### 🔵 Line 28: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      25 | }
      26 |
      27 | // Form component
>>>   28 | function GlossaryForm({
      29 |   formData,
      30 |   setFormData,
      31 | }: {
```

---

### 📁 `components/notebook/pages/library-page.tsx` (1 issues)

#### 🟡 Line 170: Do not use Array index in keys

- **Rule**: `typescript:S6479`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
     167 |       {/* List */}
     168 |       <div className="flex-1 overflow-y-auto space-y-2 pr-2">
     169 |         {filtered.map((item, i) => (
>>>  170 |           <div key={i} className="bg-white/60 border border-amber-100 rounded-lg p-3">
     171 |             <div className="flex items-start justify-between">
     172 |               <h4 className="font-heading-alt text-amber-900">{item.term}</h4>
     173 |               <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded capitalize">
```

---

### 📁 `components/journal/entry-creator-menu.tsx` (1 issues)

#### 🔵 Line 51: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      48 |   },
      49 | ] as const;
      50 |
>>>   51 | export function EntryCreatorMenu({ isOpen, onClose, onSelectType }: EntryCreatorMenuProps) {
      52 |   if (!isOpen) return null;
      53 |
      54 |   return (
```

---

### 📁 `components/journal/entry-forms/free-write-form.tsx` (1 issues)

#### 🔵 Line 15: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      12 |   onSuccess: () => void;
      13 | }
      14 |
>>>   15 | export function FreeWriteForm({ onClose, onSuccess }: FreeWriteFormProps) {
      16 |   const { addEntry } = useJournal();
      17 |   const [title, setTitle] = React.useState("");
      18 |   const [content, setContent] = React.useState("");
```

---

### 📁 `components/journal/entry-menu.tsx` (1 issues)

#### 🔵 Line 28: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      25 |   { type: "spot-check", label: "Spot Check", icon: CheckCircle2, color: "text-blue-500" },
      26 | ];
      27 |
>>>   28 | export function EntryMenu({ isOpen, onSelect, onClose }: EntryMenuProps) {
      29 |   return (
      30 |     <AnimatePresence>
      31 |       {isOpen && (
```

---

### 📁 `components/journal/floating-pen.tsx` (1 issues)

#### 🔵 Line 12: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       9 |   onClick?: () => void;
      10 | }
      11 |
>>>   12 | export function FloatingPen({ onClick }: FloatingPenProps) {
      13 |   return (
      14 |     <motion.button
      15 |       whileHover={{ scale: 1.1, rotate: 15 }}
```

---

### 📁 `components/journal/journal-layout.tsx` (1 issues)

#### 🔵 Line 9: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       6 |   children: React.ReactNode;
       7 | }
       8 |
>>>    9 | export function JournalLayout({ children }: JournalLayoutProps) {
      10 |   return (
      11 |     <div className="relative min-h-screen w-full bg-[#111] flex items-center justify-center p-4 md:p-8">
      12 |       {/* Notebook Container */}
```

---

### 📁 `components/journal/lock-screen.tsx` (1 issues)

#### 🔵 Line 7: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       4 |   onUnlock?: () => void;
       5 | }
       6 |
>>>    7 | export function LockScreen({ onUnlock }: LockScreenProps) {
       8 |   return (
       9 |     <div className="min-h-screen bg-[#f0eadd] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      10 |       {/* Background Texture Overlay */}
```

---

### 📁 `components/journal/ribbon-nav.tsx` (1 issues)

#### 🔵 Line 64: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      61 |   },
      62 | ];
      63 |
>>>   64 | export function RibbonNav({ activeTab, onTabChange }: RibbonNavProps) {
      65 |   return (
      66 |     <div className="mb-6">
      67 |       {/* Filter tabs */}
```

---

### 📁 `components/admin/quotes-tab.tsx` (1 issues)

#### 🔵 Line 24: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      21 | }));
      22 |
      23 | // Quotes Form component
>>>   24 | function QuotesForm({
      25 |   formData,
      26 |   setFormData,
      27 | }: {
```

---

### 📁 `components/journal/journal-sidebar.tsx` (1 issues)

#### 🔵 Line 15: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      12 |   className?: string;
      13 | }
      14 |
>>>   15 | export function JournalSidebar({ activeFilter, onFilterChange, className }: JournalSidebarProps) {
      16 |   const filters = [
      17 |     { id: "all", label: "All Entries", icon: LayoutGrid, color: "text-slate-500" },
      18 |     { id: "daily-log", label: "Daily Logs", icon: BookOpen, color: "text-blue-500" },
```

---

### 📁 `components/maps/meeting-map.tsx` (1 issues)

#### 🔵 Line 76: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      73 |   userLocation: { lat: number; lng: number } | null;
      74 | }
      75 |
>>>   76 | export default function MeetingMap({ meetings, userLocation }: MeetingMapProps) {
      77 |   useEffect(() => {
      78 |     fixLeafletIcon();
      79 |   }, []);
```

---

### 📁 `components/ui/label.tsx` (1 issues)

#### 🟡 Line 6: A form label must be associated with a control.

- **Rule**: `typescript:S6853`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```tsx
       3 |
       4 | const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
       5 |   ({ className, ...props }, ref) => (
>>>    6 |     <label
       7 |       ref={ref}
       8 |       className={cn(
       9 |         "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
```

---

### 📁 `scripts/test-geocode.ts` (1 issues)

#### 🟡 Line 40: Prefer top-level await over an async function `testGeocode` call.

- **Rule**: `typescript:S7785`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 5min

```ts
      37 |   }
      38 | }
      39 |
>>>   40 | testGeocode();
      41 |
```

---

### 📁 `app/admin/layout.tsx` (1 issues)

#### 🔵 Line 12: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       9 |
      10 | import { ReactNode } from "react";
      11 |
>>>   12 | export default function AdminLayout({ children }: { children: ReactNode }) {
      13 |   return <div className="min-h-screen bg-gray-50">{children}</div>;
      14 | }
      15 |
```

---

### 📁 `components/ui/skeleton.tsx` (1 issues)

#### 🔵 Line 12: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       9 | /**
      10 |  * Base Skeleton component with subtle shimmer animation
      11 |  */
>>>   12 | export function Skeleton({ className }: SkeletonProps) {
      13 |   return <div className={cn("animate-pulse rounded-md bg-amber-900/10", className)} />;
      14 | }
      15 |
```

---

### 📁 `components/ui/empty-state.tsx` (1 issues)

#### 🔵 Line 39: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      36 |   },
      37 | };
      38 |
>>>   39 | export function EmptyState({ type, action }: EmptyStateProps) {
      40 |   const content = emptyStateContent[type];
      41 |   const Icon = content.icon;
      42 |
```

---

### 📁 `components/providers/error-boundary.tsx` (1 issues)

#### 🔵 Line 75: Prefer `globalThis` over `window`.

- **Rule**: `typescript:S7764`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```tsx
      72 |   };
      73 |
      74 |   handleReload = (): void => {
>>>   75 |     window.location.reload();
      76 |   };
      77 |
      78 |   handleDownloadReport = (): void => {
```

---

### 📁 `lib/database/firestore-adapter.ts` (1 issues)

#### ⚪ Line 51: Complete the task associated to this "TODO" comment.

- **Rule**: `typescript:S1135`
- **Type**: CODE_SMELL
- **Severity**: INFO
- **Effort**: 0min

```ts
      48 |    * @param _limit - Maximum entries (currently unused - FirestoreService uses fixed limit of 30)
      49 |    */
      50 |   async getHistory(userId: string, _limit: number = 30): Promise<OperationResult<DailyLog[]>> {
>>>   51 |     // TODO: Pass limit to FirestoreService when it supports configurable limits
      52 |     const result = await FirestoreService.getHistory(userId);
      53 |     return {
      54 |       data: result.entries,
```

---

### 📁 `lib/utils/rate-limiter.ts` (1 issues)

#### 🟡 Line 17: Member 'config' is never reassigned; mark it as `readonly`.

- **Rule**: `typescript:S2933`
- **Type**: CODE_SMELL
- **Severity**: MAJOR
- **Effort**: 2min

```ts
      14 |
      15 | class RateLimiter {
      16 |   private calls: number[] = [];
>>>   17 |   private config: RateLimitConfig;
      18 |
      19 |   constructor(config: RateLimitConfig) {
      20 |     this.config = config;
```

---

### 📁 `lib/types/firebase-types.ts` (1 issues)

#### 🔵 Line 56: Prefer `Number.isNaN` over `isNaN`.

- **Rule**: `typescript:S7773`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 2min

```ts
      53 |
      54 |   if (typeof value === "string" || typeof value === "number") {
      55 |     const date = new Date(value);
>>>   56 |     return isNaN(date.getTime()) ? null : date;
      57 |   }
      58 |
      59 |   return null;
```

---

### 📁 `components/desktop/sobriety-chip.tsx` (1 issues)

#### 🔵 Line 29: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      26 |   return { label: "Welcome", image: chipUrl };
      27 | }
      28 |
>>>   29 | export default function SobrietyChip({ cleanDays }: SobrietyChipProps) {
      30 |   const milestone = getChipMilestone(cleanDays);
      31 |
      32 |   return (
```

---

### 📁 `app/globals.css` (1 issues)

#### 🟡 Line 4: Unexpected unknown at-rule "@custom-variant"

- **Rule**: `css:S4662`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 1min

```css
       1 | @import "tailwindcss";
       2 | @import "tw-animate-css";
       3 |
>>>    4 | @custom-variant dark (&:is(.dark *));
       5 |
       6 | :root {
       7 |   --background: oklch(1 0 0);
```

---

### 📁 `components/notebook/bookmark-ribbon.tsx` (1 issues)

#### 🔵 Line 10: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       7 |   onClick: () => void;
       8 | }
       9 |
>>>   10 | export default function BookmarkRibbon({ onClick }: BookmarkRibbonProps) {
      11 |   return (
      12 |     <motion.button
      13 |       onClick={onClick}
```

---

### 📁 `components/notebook/notebook-page.tsx` (1 issues)

#### 🔵 Line 9: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       6 |   children: React.ReactNode;
       7 | }
       8 |
>>>    9 | export default function NotebookPage({ children }: NotebookPageProps) {
      10 |   return <div className="h-full overflow-y-auto scrollbar-hide">{children}</div>;
      11 | }
      12 |
```

---

### 📁 `components/notebook/pages/placeholder-page.tsx` (1 issues)

#### 🔵 Line 8: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
       5 |   description: string;
       6 | }
       7 |
>>>    8 | export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
       9 |   return (
      10 |     <div className="h-full flex flex-col items-center justify-center text-center px-8">
      11 |       <h1 className="font-heading text-3xl text-amber-900/80 mb-4">{title}</h1>
```

---

### 📁 `components/notebook/sticky-note.tsx` (1 issues)

#### 🔵 Line 14: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      11 |   children: React.ReactNode;
      12 | }
      13 |
>>>   14 | export default function StickyNote({ title, onClose, children }: StickyNoteProps) {
      15 |   return (
      16 |     <motion.div
      17 |       className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
```

---

### 📁 `components/notebook/tab-navigation.tsx` (1 issues)

#### 🔵 Line 18: Mark the props of the component as read-only.

- **Rule**: `typescript:S6759`
- **Type**: CODE_SMELL
- **Severity**: MINOR
- **Effort**: 5min

```tsx
      15 |   onTabChange: (tabId: string) => void;
      16 | }
      17 |
>>>   18 | export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
      19 |   return (
      20 |     <div className="absolute right-0 top-8 bottom-8 w-8 md:w-10 flex flex-col justify-start gap-1 z-30 translate-x-full">
      21 |       {tabs.map((tab) => (
```

---

### 📁 `styles/globals.css` (1 issues)

#### 🟡 Line 4: Unexpected unknown at-rule "@custom-variant"

- **Rule**: `css:S4662`
- **Type**: BUG
- **Severity**: MAJOR
- **Effort**: 1min

```css
       1 | @import "tailwindcss";
       2 | @import "tw-animate-css";
       3 |
>>>    4 | @custom-variant dark (&:is(.dark *));
       5 |
       6 | :root {
       7 |   --background: oklch(1 0 0);
```

---
