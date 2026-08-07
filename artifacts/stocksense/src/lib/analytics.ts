/**
 * Centralized analytics — the only module in the app that pushes business
 * events to window.dataLayer. Every call site imports trackEvent() (or the
 * useScrollDepthEvent hook below) instead of touching dataLayer directly,
 * so there is exactly one place event-pushing logic can break.
 *
 * Event names and parameter shapes are frozen in analytics-events.ts,
 * itself a mirror of docs/analytics-event-taxonomy.md — see that file
 * before adding or changing an event.
 */
import { useEffect, useRef } from "react";
import type { AnalyticsEventParamsMap } from "./analytics-events";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Pushes a frozen-taxonomy event to the dataLayer. Analytics must never
 * break the user experience — every failure mode (dataLayer missing,
 * window unavailable, a future GTM change that throws) is swallowed here,
 * not left for call sites to guard against individually.
 */
export function trackEvent<E extends keyof AnalyticsEventParamsMap>(
  event: E,
  ...args: AnalyticsEventParamsMap[E] extends Record<string, never> ? [] : [params: AnalyticsEventParamsMap[E]]
): void {
  try {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...(args[0] ?? {}) });
  } catch {
    // Swallow — see module doc. A tracking failure must never surface to the user.
  }
}

/**
 * Fires scroll_75 once per page view, the first time scroll position
 * crosses `threshold` of scrollable page height. Safe to call from exactly
 * one place (Landing's top-level component) — see analytics-event-taxonomy.md.
 */
export function useScrollDepthEvent(threshold = 0.75): void {
  const firedRef = useRef(false);

  useEffect(() => {
    function handleScroll() {
      if (firedRef.current) return;
      try {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;
        if (window.scrollY / scrollable >= threshold) {
          firedRef.current = true;
          trackEvent("scroll_75");
          window.removeEventListener("scroll", handleScroll);
        }
      } catch {
        // Swallow — see trackEvent's doc comment; same guarantee applies here.
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);
}
