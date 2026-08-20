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
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Ads conversion action for successful lead submissions.
 */
const GOOGLE_ADS_LEAD_CONVERSION =
  "AW-18396922377/qw1CITdpuQcEImEq8RE";

/**
 * Pushes a frozen-taxonomy event to the dataLayer.
 *
 * Analytics must never break the user experience — every failure mode
 * (dataLayer missing, window unavailable, tracking errors) is swallowed here.
 *
 * When a real lead submission succeeds, the same event also fires the
 * Google Ads conversion.
 */
export function trackEvent<E extends keyof AnalyticsEventParamsMap>(
  event: E,
  ...args: AnalyticsEventParamsMap[E] extends Record<string, never>
    ? []
    : [params: AnalyticsEventParamsMap[E]]
): void {
  try {
    if (typeof window === "undefined") return;

    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event,
      ...(args[0] ?? {}),
    });

    /**
     * Google Ads conversion.
     *
     * This only fires when the application reports
     * lead_submit_success, which happens after the lead
     * submission has successfully completed.
     */
    if (event === "lead_submit_success") {
      window.gtag?.("event", "conversion", {
        send_to: GOOGLE_ADS_LEAD_CONVERSION,
      });
    }
  } catch {
    // Tracking failure must never affect the user experience.
  }
}

/**
 * Fires scroll_75 once per page view, the first time scroll position
 * crosses `threshold` of scrollable page height.
 */
export function useScrollDepthEvent(threshold = 0.75): void {
  const firedRef = useRef(false);

  useEffect(() => {
    function handleScroll() {
      if (firedRef.current) return;

      try {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;

        if (scrollable <= 0) return;

        if (window.scrollY / scrollable >= threshold) {
          firedRef.current = true;

          trackEvent("scroll_75");

          window.removeEventListener("scroll", handleScroll);
        }
      } catch {
        // Swallow tracking errors.
      }
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);
}
