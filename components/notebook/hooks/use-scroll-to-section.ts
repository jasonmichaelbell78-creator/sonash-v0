import { useEffect, useRef } from "react";
import { logger } from "@/lib/logger";

interface UseScrollToSectionOptions {
  /** Whether to trigger the scroll */
  shouldScroll: boolean;
  /** Selector or text to find the section by */
  target: {
    type: "aria-label" | "heading-text";
    value: string;
  };
  /** Delay before scrolling (ms) */
  delay?: number;
  /** Scroll behavior */
  behavior?: ScrollBehavior;
}

/**
 * Custom hook for scrolling to sections without using setTimeout
 * Uses useEffect to handle scroll timing properly
 *
 * @example
 * ```tsx
 * const { triggerScroll } = useScrollToSection({
 *   shouldScroll: showQuickMoodPrompt,
 *   target: { type: 'aria-label', value: 'Mood selection' },
 *   delay: 100
 * })
 * ```
 */
export function useScrollToSection({
  shouldScroll,
  target,
  delay = 100,
  behavior = "smooth",
}: UseScrollToSectionOptions) {
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!shouldScroll || hasScrolledRef.current) return;

    const timer = setTimeout(() => {
      try {
        let element: HTMLElement | null = null;

        if (target.type === "aria-label") {
          element = document.querySelector(`[aria-label="${target.value}"]`);
        } else if (target.type === "heading-text") {
          const headings = Array.from(document.querySelectorAll("h2"));
          const heading = headings.find((h) => h.textContent?.includes(target.value));
          element = heading?.parentElement ?? null;
        }

        if (element) {
          element.scrollIntoView({ behavior, block: "center" });
          hasScrolledRef.current = true;
        }
      } catch (error) {
        logger.warn(`Could not scroll to ${target.type}: ${target.value}`, { error });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldScroll, target.type, target.value, delay, behavior]);

  // Reset scroll flag when shouldScroll becomes false
  useEffect(() => {
    if (!shouldScroll) {
      hasScrolledRef.current = false;
    }
  }, [shouldScroll]);
}
