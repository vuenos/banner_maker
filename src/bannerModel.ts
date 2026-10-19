export type Align = "left" | "center" | "right";
export type Guide = "channel" | null;

export type Banner = {
    text: string;
    width: number;
    height: number;
    backgroundColor: string;
    fontColor: string;
    fontSize: number;
    fontFamily: string;
    imageUrl: string;
    strokeWidth: number;
    strokeColor: string;
    shadow: boolean;
    align: Align;
    offsetX: number;
    offsetY: number;
    guide: Guide;
};

export const MIN_SIZE = 64;
export const MAX_SIZE = 4096;
export const HISTORY_LIMIT = 50;
export const STORAGE_KEY = "banner-maker-draft-v1";
export const CHANNEL_SAFE = { width: 1546, height: 423 };

export const DEFAULT_BANNER: Banner = {
    text: "Sample Text",
    width: 1280,
    height: 720,
    backgroundColor: "#3d7eff",
    fontColor: "#FFFFFF",
    fontSize: 80,
    fontFamily: "East Sea Dokdo",
    imageUrl: "",
    strokeWidth: 0,
    strokeColor: "#111111",
    shadow: false,
    align: "center",
    offsetX: 0,
    offsetY: 0,
    guide: null,
};

export const PRESETS: {
    id: string;
    label: string;
    width: number;
    height: number;
    guide: Guide;
}[] = [
    { id: "16:9", label: "가로 영상", width: 1920, height: 1080, guide: null },
    { id: "9:16", label: "세로 영상", width: 1080, height: 1920, guide: null },
    { id: "youtube", label: "썸네일", width: 1280, height: 720, guide: null },
    {
        id: "channel",
        label: "채널 배너",
        width: 2560,
        height: 1440,
        guide: "channel",
    },
];

export const FONTS: { value: string; weight?: string }[] = [
    { value: "Song Myung" },
    { value: "Yeon Sung" },
    { value: "Noto Sans KR", weight: "500" },
    { value: "Noto Serif KR", weight: "500" },
    { value: "East Sea Dokdo" },
    { value: "Single Day" },
    { value: "Nanum Pen Script" },
    { value: "PT Serif" },
    { value: "Roboto", weight: "500" },
    { value: "Nunito", weight: "500" },
    { value: "Lobster" },
    { value: "Bebas Neue" },
];

export const PHRASES = [
    "독도는 우리땅",
    "Of the People, By the People, For the People",
    "당신이 포기할 때, 나는 시작한다.",
    "준비하지 않은 자는 기회가 와도 소용없다",
    "쓴 맛을 모르는 사람은 단 맛도 모른다.",
    "I never dreamed about success, I worked for it.",
    "No pain no gain.",
    "I'll be back",
    "Early bird catches the worm.",
    "솔직히 내 사랑, 내 알 바 아니오.\n(Frankly, my dear, I don't give a damn.)",
    "당신의 눈동자에 건배.\n(Here's looking at you, kid.)",
    "포스가 함께하길.\n(May the Force be with you.)",
    "내일은 내일의 태양이 뜰 거야!\n(After all, tomorrow is another day!)",
    "친구는 가까이, 허나 적은 더 가까이.\n(Keep your friends close, but your enemies closer.)",
    "The die is cast. – Julius caesar",
    "Life is unfair, get used to it. – Bill Gates",
    "Stay hungry, stay foolish",
];

export function randomHex() {
    return (
        "#" +
        Math.floor(Math.random() * 0x1000000)
            .toString(16)
            .padStart(6, "0")
    );
}

export function randomPhrase() {
    return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}

export function clampSize(value: number) {
    if (!Number.isFinite(value)) return MIN_SIZE;
    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)));
}

export function clampFontSize(value: number) {
    if (!Number.isFinite(value)) return 16;
    return Math.min(400, Math.max(8, Math.round(value)));
}

export function fontHref(family: string) {
    const spec = FONTS.find((font) => font.value === family);
    const name = encodeURIComponent(family).replace(/%20/g, "+");
    const weight = spec?.weight ? `:wght@${spec.weight}` : "";
    return `https://fonts.googleapis.com/css2?family=${name}${weight}&display=swap`;
}

export function textShadowCss(banner: Banner) {
    const parts: string[] = [];
    if (banner.strokeWidth > 0) {
        const steps = 8;
        for (let index = 0; index < steps; index += 1) {
            const angle = (Math.PI * 2 * index) / steps;
            const x = Math.cos(angle) * banner.strokeWidth;
            const y = Math.sin(angle) * banner.strokeWidth;
            parts.push(
                `${x.toFixed(2)}px ${y.toFixed(2)}px 0 ${banner.strokeColor}`,
            );
        }
    }
    if (banner.shadow) {
        const blur = Math.max(8, Math.round(banner.fontSize / 8));
        const y = Math.max(4, Math.round(banner.fontSize / 12));
        parts.push(`0 ${y}px ${blur}px rgba(0,0,0,0.55)`);
    }
    return parts.join(", ");
}

function normalizeHex(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback;
    const color = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
        const red = color[1];
        const green = color[2];
        const blue = color[3];
        return `#${red}${red}${green}${green}${blue}${blue}`;
    }
    return fallback;
}

function clampOffset(value: unknown, size: number) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return 0;
    const limit = size / 2;
    return Math.min(limit, Math.max(-limit, number));
}

export function sanitize(input: Partial<Banner>): Banner {
    const width = clampSize(Number(input.width ?? DEFAULT_BANNER.width));
    const height = clampSize(Number(input.height ?? DEFAULT_BANNER.height));
    const align =
        input.align === "left" || input.align === "right" ? input.align : "center";
    const fontFamily = FONTS.some((font) => font.value === input.fontFamily)
        ? (input.fontFamily as string)
        : DEFAULT_BANNER.fontFamily;
    const guide =
        input.guide === "channel" && width === 2560 && height === 1440
            ? "channel"
            : null;

    return {
        text: typeof input.text === "string" ? input.text : DEFAULT_BANNER.text,
        width,
        height,
        backgroundColor: normalizeHex(
            input.backgroundColor,
            DEFAULT_BANNER.backgroundColor,
        ),
        fontColor: normalizeHex(input.fontColor, DEFAULT_BANNER.fontColor),
        fontSize: clampFontSize(Number(input.fontSize ?? DEFAULT_BANNER.fontSize)),
        fontFamily,
        imageUrl: typeof input.imageUrl === "string" ? input.imageUrl : "",
        strokeWidth: Math.min(
            32,
            Math.max(0, Math.round(Number(input.strokeWidth) || 0)),
        ),
        strokeColor: normalizeHex(input.strokeColor, DEFAULT_BANNER.strokeColor),
        shadow: Boolean(input.shadow),
        align,
        offsetX: clampOffset(input.offsetX, width),
        offsetY: clampOffset(input.offsetY, height),
        guide,
    };
}

export function loadDraft(): Banner | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<Banner>;
        if (!parsed || typeof parsed !== "object") return null;
        return sanitize({ ...DEFAULT_BANNER, ...parsed });
    } catch {
        return null;
    }
}

export function saveDraft(banner: Banner) {
    const write = (value: Banner) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    };
    try {
        write(banner);
    } catch {
        try {
            write({ ...banner, imageUrl: "" });
        } catch {
            /* The browser refused the write. The in-memory banner still works. */
        }
    }
}

export function bannersEqual(a: Banner, b: Banner) {
    return JSON.stringify(a) === JSON.stringify(b);
}
