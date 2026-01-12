/**
 * reCAPTCHA Enterprise Token Management
 *
 * This module handles getting reCAPTCHA tokens for bot protection.
 * Tokens are sent to Cloud Functions for verification.
 */

// Declare the global grecaptcha object (loaded from the script tag)
declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

/**
 * Get a reCAPTCHA token for the specified action
 *
 * @param action - The action name (e.g., 'submit_journal', 'save_log')
 * @returns Promise<string> - The reCAPTCHA token
 * @throws Error if reCAPTCHA fails to load or execute
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  // Get the site key from environment
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    throw new Error("reCAPTCHA site key not configured");
  }

  // Check if we're in the browser
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA can only be used in the browser");
  }

  // Wait for reCAPTCHA to be ready
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("reCAPTCHA failed to load"));
    }, 10000); // 10 second timeout

    if (!window.grecaptcha?.enterprise) {
      clearTimeout(timeout);
      reject(new Error("reCAPTCHA library not loaded"));
      return;
    }

    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha!.enterprise.execute(siteKey, { action });
        clearTimeout(timeout);
        resolve(token);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
}
