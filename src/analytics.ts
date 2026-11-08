declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

/** Public GA4 measurement ID (safe to ship in the client). */
export const GA_MEASUREMENT_ID = "G-JPBNCWR5R2";

const GA_ID =
    import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || GA_MEASUREMENT_ID;

function ensureGtag() {
    if (typeof window === "undefined") return false;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
        window.gtag = function gtag(..._args: unknown[]) {
            // GA expects the Arguments object shape from the official snippet.
            // eslint-disable-next-line prefer-rest-params
            window.dataLayer?.push(arguments);
        };
    }
    return true;
}

/** Ensure GA4 is configured if the HTML snippet was blocked or skipped. */
export function initAnalytics() {
    if (!GA_ID || !ensureGtag()) return;

    const existing = document.querySelector<HTMLScriptElement>(
        `script[src*="googletagmanager.com/gtag/js"]`,
    );
    if (!existing) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);
        window.gtag?.("js", new Date());
        window.gtag?.("config", GA_ID, {
            send_page_view: true,
            anonymize_ip: true,
        });
    }
}

export function trackDownloadImage(params: {
    width: number;
    height: number;
}) {
    if (!ensureGtag()) return;
    window.gtag?.("event", "download_image", {
        send_to: GA_ID,
        event_category: "engagement",
        event_label: `${params.width}x${params.height}`,
        width: params.width,
        height: params.height,
    });
}
