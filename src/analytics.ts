declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

function ensureGtag() {
    if (typeof window === "undefined") return false;
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
        window.gtag = function gtag(..._args: unknown[]) {
            // GA expects the Arguments object shape from the official snippet.
            // eslint-disable-next-line prefer-rest-params
            window.dataLayer?.push(arguments);
        };
    }
    return true;
}

/** Load GA4 when VITE_GA_MEASUREMENT_ID is set. No-op otherwise. */
export function initAnalytics() {
    if (!GA_ID || !ensureGtag()) return;

    const existing = document.querySelector<HTMLScriptElement>(
        `script[data-ga-id="${GA_ID}"]`,
    );
    if (!existing) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        script.dataset.gaId = GA_ID;
        document.head.appendChild(script);
    }

    window.gtag?.("js", new Date());
    window.gtag?.("config", GA_ID, {
        send_page_view: true,
        anonymize_ip: true,
    });
}

export function trackDownloadImage(params: {
    width: number;
    height: number;
}) {
    if (!GA_ID || !ensureGtag()) return;
    window.gtag?.("event", "download_image", {
        event_category: "engagement",
        event_label: `${params.width}x${params.height}`,
        width: params.width,
        height: params.height,
    });
}
