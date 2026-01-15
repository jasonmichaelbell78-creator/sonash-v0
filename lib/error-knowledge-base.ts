/**
 * Error Knowledge Base
 *
 * Maps known error patterns to human-readable descriptions, possible causes,
 * and suggested remediations. Used by the Admin Errors Tab to provide
 * actionable insights for administrators.
 */

export interface ErrorKnowledge {
  /** Pattern to match against error title (case-insensitive) */
  pattern: RegExp;
  /** Human-readable description of what this error means */
  description: string;
  /** List of possible causes for this error */
  possibleCauses: string[];
  /** Suggested steps to remediate or investigate */
  remediations: string[];
  /** Severity level for user impact */
  severity: "critical" | "high" | "medium" | "low";
  /** Component or area affected */
  component: string;
}

/**
 * Knowledge base of known error patterns
 * Patterns are checked in order - first match wins
 */
export const ERROR_KNOWLEDGE_BASE: ErrorKnowledge[] = [
  // Authentication errors
  {
    pattern: /auth.*token.*expired|token.*invalid|unauthorized/i,
    description: "User authentication session has expired or is invalid.",
    possibleCauses: [
      "User's session token expired after extended inactivity",
      "Token was invalidated server-side (password change, admin action)",
      "Clock skew between client and server",
      "Corrupted token in local storage",
    ],
    remediations: [
      "User should sign out and sign back in",
      "Check Firebase Auth console for blocked users",
      "Verify Firebase Auth configuration is correct",
      "Clear browser storage and retry",
    ],
    severity: "medium",
    component: "Authentication",
  },
  {
    pattern: /permission.*denied|insufficient.*permissions?|not.*authorized/i,
    description: "User attempted an action without required permissions.",
    possibleCauses: [
      "User role doesn't have access to this feature",
      "Firestore security rules blocking the operation",
      "Admin-only feature accessed by regular user",
      "Custom claims not properly set",
    ],
    remediations: [
      "Verify user has correct role in Firebase Auth custom claims",
      "Review Firestore security rules for the affected collection",
      "Check if admin flag is properly set for admin users",
      "Review the specific operation being attempted",
    ],
    severity: "medium",
    component: "Authorization",
  },

  // Sentry/Monitoring errors
  {
    pattern: /failed to fetch sentry|sentry.*error|sentry.*summary/i,
    description: "Unable to retrieve error data from Sentry monitoring service.",
    possibleCauses: [
      "Sentry API token expired or invalid",
      "Sentry service temporarily unavailable",
      "Rate limit exceeded on Sentry API",
      "Network connectivity issues to Sentry servers",
      "Misconfigured Sentry project or organization",
    ],
    remediations: [
      "Verify SENTRY_API_TOKEN in Firebase secrets is valid",
      "Check Sentry status page for outages",
      "Confirm SENTRY_ORG and SENTRY_PROJECT match your Sentry setup",
      "Wait a few minutes and refresh - may be transient",
    ],
    severity: "low",
    component: "Monitoring",
  },

  // Dashboard/UI errors
  {
    pattern: /failed to load dashboard|dashboard.*error|dashboard.*failed/i,
    description: "The admin dashboard failed to load required data.",
    possibleCauses: [
      "Network request timeout to backend services",
      "Cloud Function deployment issue",
      "Firestore connection problems",
      "Browser extension blocking requests",
      "CORS configuration issue",
    ],
    remediations: [
      "Refresh the page and try again",
      "Check browser console for specific error details",
      "Verify Cloud Functions are deployed and running",
      "Check Firebase console for service health",
      "Try in incognito mode to rule out browser extensions",
    ],
    severity: "medium",
    component: "Admin Dashboard",
  },

  // Firestore errors
  {
    pattern: /firestore.*quota|quota.*exceeded|resource.*exhausted/i,
    description: "Firestore database quota or rate limit exceeded.",
    possibleCauses: [
      "Exceeded daily read/write quota on free tier",
      "Too many concurrent connections",
      "Runaway query or infinite loop in code",
      "DDoS attack or abuse",
    ],
    remediations: [
      "Check Firebase console quota usage",
      "Review recent code changes for inefficient queries",
      "Implement pagination for large data sets",
      "Consider upgrading Firebase plan if legitimate usage",
    ],
    severity: "critical",
    component: "Database",
  },
  {
    pattern: /firestore.*unavailable|database.*connection|firebase.*error/i,
    description: "Unable to connect to Firebase/Firestore services.",
    possibleCauses: [
      "Firebase service outage",
      "Network connectivity issues",
      "Firestore rules deployment in progress",
      "Project misconfiguration",
    ],
    remediations: [
      "Check Firebase status dashboard",
      "Verify Firebase project configuration",
      "Wait a few minutes for transient issues to resolve",
      "Check for recent Firestore rules deployments",
    ],
    severity: "high",
    component: "Database",
  },

  // Network errors
  {
    pattern: /network.*error|fetch.*failed|request.*failed|timeout/i,
    description: "Network request failed or timed out.",
    possibleCauses: [
      "Poor network connectivity",
      "Server taking too long to respond",
      "DNS resolution issues",
      "Firewall or proxy blocking requests",
      "Cloud Function cold start timeout",
    ],
    remediations: [
      "Check your internet connection",
      "Retry the operation",
      "Check Cloud Function logs for slow operations",
      "Consider increasing timeout values",
    ],
    severity: "medium",
    component: "Network",
  },

  // Rate limiting
  {
    pattern: /rate.*limit|too.*many.*requests|throttl/i,
    description: "Request was blocked due to rate limiting protection.",
    possibleCauses: [
      "User or IP exceeded request limits",
      "Automated script or bot activity",
      "Legitimate high-traffic event",
      "Rate limit thresholds too restrictive",
    ],
    remediations: [
      "Wait before retrying (usually 1-5 minutes)",
      "Review rate limit logs in GCP for patterns",
      "Adjust rate limit thresholds if too restrictive",
      "Investigate if this is abuse or legitimate traffic",
    ],
    severity: "low",
    component: "Security",
  },

  // App Check / reCAPTCHA
  {
    pattern: /app.*check|recaptcha|attestation/i,
    description: "App attestation or bot protection check failed.",
    possibleCauses: [
      "reCAPTCHA token expired or invalid",
      "App Check attestation failed",
      "Corporate firewall blocking Google services",
      "Bot or automated request detected",
    ],
    remediations: [
      "Refresh the page and try again",
      "Ensure browser allows Google reCAPTCHA",
      "Check if corporate network blocks reCAPTCHA",
      "Review reCAPTCHA scores in GCP console",
    ],
    severity: "medium",
    component: "Security",
  },

  // Data validation errors
  {
    pattern: /validation.*error|invalid.*data|schema.*error|type.*error/i,
    description: "Data submitted didn't pass validation checks.",
    possibleCauses: [
      "User submitted malformed data",
      "Client-side validation bypassed",
      "API contract mismatch",
      "Data migration left invalid records",
    ],
    remediations: [
      "Review the specific validation error message",
      "Check client-side form validation",
      "Verify API request payload format",
      "Run data cleanup if migration issue",
    ],
    severity: "low",
    component: "Data",
  },

  // React/Next.js errors
  {
    pattern: /hydration|server.*client.*mismatch|react.*error/i,
    description: "React component rendering error or hydration mismatch.",
    possibleCauses: [
      "Server and client rendered different content",
      "Browser extension modifying DOM",
      "Date/time rendering without timezone handling",
      "Math.random() or Date.now() in render",
    ],
    remediations: [
      "Ensure consistent rendering between server and client",
      "Use useEffect for client-only operations",
      "Test in incognito mode to rule out extensions",
      "Check for non-deterministic render logic",
    ],
    severity: "medium",
    component: "UI",
  },

  // Storage errors
  {
    pattern: /storage.*error|quota.*storage|localstorage|indexeddb/i,
    description: "Browser storage operation failed.",
    possibleCauses: [
      "Browser storage quota exceeded",
      "Private browsing mode blocking storage",
      "Corrupted storage data",
      "Storage access denied by browser settings",
    ],
    remediations: [
      "Clear browser cache and site data",
      "Exit private browsing mode",
      "Check browser settings for storage permissions",
      "Try a different browser",
    ],
    severity: "low",
    component: "Storage",
  },

  // Cloud Function errors
  {
    pattern: /function.*error|cloud.*function|internal.*error/i,
    description: "A server-side Cloud Function encountered an error.",
    possibleCauses: [
      "Unhandled exception in function code",
      "Function timeout exceeded",
      "Memory limit exceeded",
      "External service dependency failed",
    ],
    remediations: [
      "Check Cloud Function logs in GCP console",
      "Review recent function deployments",
      "Look for timeout or memory warnings",
      "Verify external service connections",
    ],
    severity: "high",
    component: "Backend",
  },
];

/**
 * Find matching knowledge for an error title
 * @param errorTitle The error title/message to match
 * @returns The matching ErrorKnowledge or a default fallback
 */
export function findErrorKnowledge(errorTitle: string): ErrorKnowledge {
  const match = ERROR_KNOWLEDGE_BASE.find((knowledge) => knowledge.pattern.test(errorTitle));

  if (match) {
    return match;
  }

  // Default fallback for unknown errors
  return {
    pattern: /.*/,
    description: "An unexpected error occurred in the application.",
    possibleCauses: [
      "Unhandled edge case in application code",
      "Third-party service integration issue",
      "Transient infrastructure problem",
    ],
    remediations: [
      "Click 'View in Sentry' for full stack trace and context",
      "Check if this is a new or recurring issue",
      "Review recent code deployments",
      "Contact development team if persists",
    ],
    severity: "medium",
    component: "Unknown",
  };
}

/**
 * Get severity color class for UI display
 */
export function getSeverityColor(severity: ErrorKnowledge["severity"]): string {
  switch (severity) {
    case "critical":
      return "text-red-700 bg-red-50 border-red-200";
    case "high":
      return "text-orange-700 bg-orange-50 border-orange-200";
    case "medium":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "low":
      return "text-green-700 bg-green-50 border-green-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

/**
 * Get severity badge text
 */
export function getSeverityLabel(severity: ErrorKnowledge["severity"]): string {
  switch (severity) {
    case "critical":
      return "Critical Impact";
    case "high":
      return "High Impact";
    case "medium":
      return "Medium Impact";
    case "low":
      return "Low Impact";
    default:
      return "Unknown";
  }
}
