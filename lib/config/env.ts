/**
 * Centralized environment config.
 *
 * Rationale: the `no-process-env-inline` pattern-compliance rule forbids direct
 * `process.env.*` access inside component/page files so audits have a single
 * surface to review. Components import the helpers below instead.
 *
 * Next.js build-time replacement: `process.env.NODE_ENV` is substituted at
 * compile time for client bundles, so this helper does not leak runtime secrets.
 */

export const NODE_ENV: string = process.env.NODE_ENV ?? "development";

export const IS_DEV: boolean = NODE_ENV !== "production";
export const IS_PROD: boolean = NODE_ENV === "production";
