import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("trackEvent — Google Ads conversion label", () => {
  beforeEach(() => {
    vi.resetModules();
    (globalThis as { window?: unknown }).window = globalThis;
    (globalThis as { gtag?: unknown }).gtag = vi.fn();
    (globalThis as { dataLayer?: unknown }).dataLayer = undefined;
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { gtag?: unknown }).gtag;
    delete (globalThis as { dataLayer?: unknown }).dataLayer;
  });

  it("fires the exact existing Google Ads conversion id/label on lead_submit_success", async () => {
    const { trackEvent } = await import("../../src/lib/analytics");

    trackEvent("lead_submit_success", { form_location: "inline" });

    const gtag = (globalThis as { gtag: ReturnType<typeof vi.fn> }).gtag;
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-18396922377/qw1CITdpuQcEImEq8RE",
    });
  });

  it("does not fire the Google Ads conversion for other events", async () => {
    const { trackEvent } = await import("../../src/lib/analytics");

    trackEvent("gate_view");
    trackEvent("form_start", { form_location: "gate" });

    const gtag = (globalThis as { gtag: ReturnType<typeof vi.fn> }).gtag;
    expect(gtag).not.toHaveBeenCalled();
  });
});
