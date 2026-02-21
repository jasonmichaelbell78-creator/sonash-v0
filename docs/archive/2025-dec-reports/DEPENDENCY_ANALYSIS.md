<!-- TDMS: All actionable findings from this report have been ingested into
     MASTER_DEBT.jsonl. This file is archived for historical reference only.
     Do not add new findings here — use the TDMS intake process. -->

# Dependency Analysis & Health Report

## Executive Summary

This report analyzes the project's package dependencies to identify outdated
libraries, version mismatches, or "bleeding edge" risks that could contribute to
the App Check instability.

**Key Finding:** The project is running on **extremely recent major versions**
(Next.js 16, Node.js 24, Firebase v12). While these versions are theoretically
compatible, being on the absolute "cutting edge" introduces meaningful risk of
undocumented bugs, particularly with sensitive security integrations like App
Check.

---

### 1. Risk Factor A: "Bleeding Edge" Stack Instability

- **Observation:** The project uses **Next.js 16.0.7**, **React 19.2.0**, and
  **Firebase SDK v12.6.0**.
- **Potential Impact:**
  - **Next.js 16 / React 19:** These versions likely introduce stricter "Strict
    Mode" behaviors or hydration changes. App Check initialization (which often
    relies on `useEffect` or window attachment) can be sensitive to
    double-invocation in strict mode, potentially invalidating the token
    generation process or causing race conditions.
  - **Firebase v12:** Major version upgrades often deprecate internal APIs. If
    the `firebase-functions` implementation (running on the server) expects a
    token format or protocol slightly different from what the v12 Client SDK
    generates (or vice versa), verification failures can occur.
- **Recommendation:**
  - If the 400 error persists despite configuration fixes, consider
    **downgrading** to a "Known Good" stack (Next.js 15, React 18, Firebase v11)
    to isolate if the issue is a regression in the new versions.

### 2. Risk Factor B: Node.js 24 Runtime in Cloud Functions

- **Observation:** `functions/package.json` specifies
  `"engines": { "node": "24" }` and `firebase.json` specifies
  `"runtime": "nodejs24"`.
- **Potential Impact:**
  - **Runtime Support:** While Node.js 24 is available in recent GCP updates,
    local emulators sometimes lag in full feature parity with the newest
    runtimes.
  - **App Check Token Verification:** The `firebase-admin` SDK (v13.6.0) is
    responsible for verifying tokens on the backend. Ensure that the local
    emulator suite (`firebase-tools`) is updated to the absolute latest version
    (`>= 14.x`) to support Node 24 and the v13 Admin SDK correctly. An outdated
    CLI/Emulator running a Node 24 function might fail to handle the request
    context correctly, leading to 400 errors.
- **Verification Step:**
  - Run `firebase --version` to ensure you are on v14.27.0 or later.
  - Try temporarily lowering the functions runtime to `nodejs22` in
    `firebase.json` and `package.json` to see if emulator stability improves.

### 3. Dependency Compatibility Check

The following key dependencies were analyzed:

| Package                | Current Version | Status     | Notes                                                                   |
| :--------------------- | :-------------- | :--------- | :---------------------------------------------------------------------- |
| **next**               | `16.0.7`        | ✅ Current | Next.js 16 is the latest major. Ensure `next.config.mjs` is compatible. |
| **react**              | `19.2.0`        | ✅ Current | React 19 is stable. Watch for hydration mismatches.                     |
| **firebase**           | `^12.6.0`       | ✅ Current | v12 is the latest.                                                      |
| **firebase-admin**     | `^13.6.0`       | ✅ Current | Compatible with Node 24.                                                |
| **firebase-functions** | `^7.0.0`        | ✅ Current | v7 is designed for v2 functions.                                        |

- **Conclusion:** There are **no outdated libraries**. The risk is entirely on
  the side of _newness_. There are no "zombie" old versions dragging the project
  down.

---

### Summary of Actions

1.  **Update Firebase CLI:** Ensure your global `firebase-tools` is the latest
    version to handle this modern stack.
2.  **Strict Mode Check:** Verify if `reactStrictMode: false` in
    `next.config.mjs` changes the behavior. React 19's strict mode is aggressive
    and can break stateful initializations like App Check if not handled with
    refs.
