/**
 * Google Tag Manager bootstrap — container infrastructure only.
 *
 * Deliberately conditional rather than a static <script> tag in index.html:
 * VITE_GTM_CONTAINER_ID isn't set yet (no real container exists), and this
 * guarantees zero network requests / zero console errors until it is, in
 * every environment including local dev and any preview without the var set.
 *
 * No GA4 events or Ads conversions are pushed here — this only bootstraps
 * the container and the dataLayer. Business events are wired in a later
 * milestone via lib/analytics.ts's pushEvent().
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function initGoogleTagManager(): void {
  const containerId = import.meta.env.VITE_GTM_CONTAINER_ID as string | undefined;

  // Never load in dev, and never load without a real container ID configured.
  if (!import.meta.env.PROD || !containerId) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";

  const noscript = document.createElement("noscript");
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}
