import type { CSSProperties } from "react";

export type Align = "left" | "center" | "right";
export type Guide = "channel" | null;
export type TextStyleId = "plain" | "variety" | "spectrum" | "blush";

export type TextLayer = {
    id: string;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontColor: string;
    strokeWidth: number;
    strokeColor: string;
    shadow: boolean;
    align: Align;
    offsetX: number;
    offsetY: number;
    styleId: TextStyleId;
};

export type Banner = {
    width: number;
    height: number;
    backgroundColor: string;
    imageUrl: string;
    guide: Guide;
    texts: TextLayer[];
    selectedId: string;
};

export const MIN_SIZE = 64;
export const MAX_SIZE = 4096;
export const HISTORY_LIMIT = 50;
export const MAX_TEXTS = 8;
export const STORAGE_KEY = "banner-maker-draft-v2";
export const CHANNEL_SAFE = { width: 1546, height: 423 };

export const FONTS: { value: string; weight?: string }[] = [
    { value: "Black Han Sans" },
    { value: "Do Hyeon" },
    { value: "Song Myung" },
    { value: "Yeon Sung" },
    { value: "Noto Sans KR", weight: "900" },
    { value: "Noto Serif KR", weight: "700" },
    { value: "East Sea Dokdo" },
    { value: "Single Day" },
    { value: "Nanum Pen Script" },
    { value: "PT Serif" },
    { value: "Roboto", weight: "700" },
    { value: "Nunito", weight: "800" },
    { value: "Lobster" },
    { value: "Bebas Neue" },
];

export const TEXT_STYLES: {
    id: TextStyleId;
    label: string;
    tooltip: string;
    swatch: string;
}[] = [
    {
        id: "plain",
        label: "기본",
        tooltip: "단색 글자",
        swatch: "linear-gradient(135deg, #ffffff, #d0d0d0)",
    },
    {
        id: "variety",
        label: "예능 타이틀",
        tooltip: "두꺼운 검정 외곽선과 딱딱한 그림자 · 예능 썸네일 느낌",
        swatch: "linear-gradient(180deg, #ffe566, #ffd400 55%, #f5a623)",
    },
    {
        id: "spectrum",
        label: "스펙트럼",
        tooltip: "청록→분홍 가로 그라데이션과 흰 외곽선",
        swatch: "linear-gradient(90deg, #00aeef, #2d3192, #92278f, #ec008c)",
    },
    {
        id: "blush",
        label: "블러시",
        tooltip: "흰→분홍 세로 그라데이션과 얇은 검정 외곽선",
        swatch: "linear-gradient(180deg, #ffffff, #ff6b8a)",
    },
];

export const PRESETS: {
    id: string;
    label: string;
    tooltip: string;
    width: number;
    height: number;
    guide: Guide;
}[] = [
    {
        id: "16:9",
        label: "유튜브 영상",
        tooltip: "가로 영상 16:9 · 1920×1080",
        width: 1920,
        height: 1080,
        guide: null,
    },
    {
        id: "9:16",
        label: "숏폼 영상",
        tooltip: "세로 영상 9:16 · 쇼츠·틱톡·릴스 · 1080×1920",
        width: 1080,
        height: 1920,
        guide: null,
    },
    {
        id: "youtube",
        label: "유튜브 썸네일",
        tooltip: "영상 목록에 보이는 미리보기 이미지 · 1280×720",
        width: 1280,
        height: 720,
        guide: null,
    },
    {
        id: "channel",
        label: "유튜브 채널 배너",
        tooltip: "채널 상단 배너 · 2560×1440 · 점선은 안전 영역",
        width: 2560,
        height: 1440,
        guide: "channel",
    },
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

export function newTextId() {
    return `text-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function fontHref(family: string) {
    const spec = FONTS.find((font) => font.value === family);
    const name = encodeURIComponent(family).replace(/%20/g, "+");
    const weight = spec?.weight ? `:wght@${spec.weight}` : "";
    return `https://fonts.googleapis.com/css2?family=${name}${weight}&display=swap`;
}

export function fontsHref(families: string[]) {
    const unique = [...new Set(families.filter(Boolean))];
    if (unique.length === 0) return fontHref("Noto Sans KR");
    const query = unique
        .map((family) => {
            const spec = FONTS.find((font) => font.value === family);
            const name = encodeURIComponent(family).replace(/%20/g, "+");
            const weight = spec?.weight ? `:wght@${spec.weight}` : "";
            return `family=${name}${weight}`;
        })
        .join("&");
    return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

function strokeShadowParts(width: number, color: string) {
    const parts: string[] = [];
    if (width <= 0) return parts;
    const steps = 16;
    for (let index = 0; index < steps; index += 1) {
        const angle = (Math.PI * 2 * index) / steps;
        const x = Math.cos(angle) * width;
        const y = Math.sin(angle) * width;
        parts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px 0 ${color}`);
    }
    return parts;
}

export function textShadowCss(layer: Pick<
    TextLayer,
    "strokeWidth" | "strokeColor" | "shadow" | "fontSize" | "styleId"
>) {
    const parts = strokeShadowParts(layer.strokeWidth, layer.strokeColor);
    if (layer.shadow) {
        if (layer.styleId === "variety") {
            const offset = Math.max(4, Math.round(layer.fontSize / 14));
            parts.push(`${offset}px ${offset}px 0 rgba(0,0,0,0.92)`);
            parts.push(
                `${offset + 2}px ${offset + 2}px ${Math.round(offset / 2)}px rgba(0,0,0,0.35)`,
            );
        } else {
            const blur = Math.max(8, Math.round(layer.fontSize / 8));
            const y = Math.max(4, Math.round(layer.fontSize / 12));
            parts.push(`0 ${y}px ${blur}px rgba(0,0,0,0.55)`);
        }
    }
    return parts.join(", ");
}

export function applyTextStyle(
    layer: TextLayer,
    styleId: TextStyleId,
): TextLayer {
    switch (styleId) {
        case "variety":
            return {
                ...layer,
                styleId,
                fontFamily: "Black Han Sans",
                fontColor: "#FFD400",
                strokeWidth: 10,
                strokeColor: "#111111",
                shadow: true,
            };
        case "spectrum":
            return {
                ...layer,
                styleId,
                fontFamily: "Black Han Sans",
                fontColor: "#EC008C",
                strokeWidth: 6,
                strokeColor: "#FFFFFF",
                shadow: true,
            };
        case "blush":
            return {
                ...layer,
                styleId,
                fontFamily: "Black Han Sans",
                fontColor: "#FF6B8A",
                strokeWidth: 4,
                strokeColor: "#111111",
                shadow: true,
            };
        case "plain":
        default:
            return {
                ...layer,
                styleId: "plain",
                strokeWidth: 0,
                shadow: false,
            };
    }
}

export function isGradientTextStyle(styleId: TextStyleId) {
    return styleId === "spectrum" || styleId === "blush";
}

function textTypeBase(layer: TextLayer): CSSProperties {
    return {
        textAlign: layer.align,
        fontSize: layer.fontSize,
        fontFamily: `"${layer.fontFamily}", "Noto Sans KR", sans-serif`,
        fontWeight: layer.styleId === "plain" ? 500 : 900,
        lineHeight: 1.15,
    };
}

/** Solid outline layer under gradient fill (clip+transparent hides same-layer shadows). */
export function layerStrokeStyle(layer: TextLayer): CSSProperties {
    const parts = strokeShadowParts(layer.strokeWidth, layer.strokeColor);
    if (layer.shadow) {
        const blur = Math.max(8, Math.round(layer.fontSize / 8));
        const y = Math.max(4, Math.round(layer.fontSize / 12));
        parts.push(`0 ${y}px ${blur}px rgba(0, 0, 0, 0.55)`);
    }
    return {
        ...textTypeBase(layer),
        color: layer.strokeColor,
        WebkitTextFillColor: layer.strokeColor,
        textShadow: parts.join(", ") || "none",
    };
}

export function layerVisualStyle(layer: TextLayer): CSSProperties {
    const base = textTypeBase(layer);

    if (isGradientTextStyle(layer.styleId)) {
        return {
            ...base,
            // Stroke lives on a sibling layer — shadows on clipped text fill the glyphs.
            textShadow: "none",
            backgroundImage:
                layer.styleId === "spectrum"
                    ? "linear-gradient(90deg, #00AEEF 0%, #2D3192 35%, #92278F 70%, #EC008C 100%)"
                    : "linear-gradient(180deg, #FFFFFF 0%, #FFB3C1 45%, #FF6B8A 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
        };
    }

    return {
        ...base,
        color: layer.fontColor,
        WebkitTextFillColor: layer.fontColor,
        textShadow: textShadowCss(layer) || "none",
    };
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

const STYLE_IDS: TextStyleId[] = ["plain", "variety", "spectrum", "blush"];

export function createTextLayer(
    input: Partial<TextLayer> = {},
    canvas: { width: number; height: number } = { width: 1280, height: 720 },
): TextLayer {
    const align =
        input.align === "left" || input.align === "right" ? input.align : "center";
    const fontFamily = FONTS.some((font) => font.value === input.fontFamily)
        ? (input.fontFamily as string)
        : "Black Han Sans";
    const styleId = STYLE_IDS.includes(input.styleId as TextStyleId)
        ? (input.styleId as TextStyleId)
        : "plain";

    return {
        id: typeof input.id === "string" && input.id ? input.id : newTextId(),
        text: typeof input.text === "string" ? input.text : "새 글자",
        fontSize: clampFontSize(Number(input.fontSize ?? 80)),
        fontFamily,
        fontColor: normalizeHex(input.fontColor, "#FFFFFF"),
        strokeWidth: Math.min(
            32,
            Math.max(0, Math.round(Number(input.strokeWidth) || 0)),
        ),
        strokeColor: normalizeHex(input.strokeColor, "#111111"),
        shadow: Boolean(input.shadow),
        align,
        offsetX: clampOffset(input.offsetX, canvas.width),
        offsetY: clampOffset(input.offsetY, canvas.height),
        styleId,
    };
}

export const DEFAULT_BANNER: Banner = (() => {
    const layer = createTextLayer({
        text: "Sample Text",
        fontSize: 80,
        fontFamily: "East Sea Dokdo",
        fontColor: "#FFFFFF",
        styleId: "plain",
    });
    return {
        width: 1280,
        height: 720,
        backgroundColor: "#3d7eff",
        imageUrl: "",
        guide: null,
        texts: [layer],
        selectedId: layer.id,
    };
})();

/** First-visit / reset banner: youtube size, random bg, single random phrase. */
export function createFreshBanner(): Banner {
    const layer = createTextLayer({
        text: randomPhrase(),
        fontSize: 80,
        fontFamily: "East Sea Dokdo",
        fontColor: "#FFFFFF",
        styleId: "plain",
    });
    return sanitize({
        width: 1280,
        height: 720,
        backgroundColor: randomHex(),
        imageUrl: "",
        guide: null,
        texts: [layer],
        selectedId: layer.id,
    });
}

function migrateLegacy(input: Record<string, unknown>): Partial<Banner> {
    if (Array.isArray(input.texts)) return input as Partial<Banner>;
    if (typeof input.text !== "string") return input as Partial<Banner>;
    const layer = createTextLayer(
        {
            text: input.text,
            fontSize: Number(input.fontSize),
            fontFamily: String(input.fontFamily ?? ""),
            fontColor: String(input.fontColor ?? ""),
            strokeWidth: Number(input.strokeWidth),
            strokeColor: String(input.strokeColor ?? ""),
            shadow: Boolean(input.shadow),
            align: input.align as Align,
            offsetX: Number(input.offsetX),
            offsetY: Number(input.offsetY),
            styleId: "plain",
        },
        {
            width: Number(input.width) || DEFAULT_BANNER.width,
            height: Number(input.height) || DEFAULT_BANNER.height,
        },
    );
    return {
        width: Number(input.width),
        height: Number(input.height),
        backgroundColor: String(input.backgroundColor ?? ""),
        imageUrl: typeof input.imageUrl === "string" ? input.imageUrl : "",
        guide: input.guide as Guide,
        texts: [layer],
        selectedId: layer.id,
    };
}

export function sanitize(input: Partial<Banner> | Record<string, unknown>): Banner {
    const migrated = migrateLegacy(input as Record<string, unknown>);
    const width = clampSize(Number(migrated.width ?? DEFAULT_BANNER.width));
    const height = clampSize(Number(migrated.height ?? DEFAULT_BANNER.height));
    const guide =
        migrated.guide === "channel" && width === 2560 && height === 1440
            ? "channel"
            : null;

    const rawTexts = Array.isArray(migrated.texts) ? migrated.texts : [];
    let texts = rawTexts
        .slice(0, MAX_TEXTS)
        .map((layer) => createTextLayer(layer as Partial<TextLayer>, { width, height }));
    if (texts.length === 0) {
        texts = [
            createTextLayer(
                { text: randomPhrase(), fontFamily: "East Sea Dokdo" },
                { width, height },
            ),
        ];
    }

    const selectedId = texts.some((layer) => layer.id === migrated.selectedId)
        ? (migrated.selectedId as string)
        : texts[0].id;

    return {
        width,
        height,
        backgroundColor: normalizeHex(
            migrated.backgroundColor,
            DEFAULT_BANNER.backgroundColor,
        ),
        imageUrl: typeof migrated.imageUrl === "string" ? migrated.imageUrl : "",
        guide,
        texts,
        selectedId,
    };
}

export function selectedText(banner: Banner): TextLayer {
    return (
        banner.texts.find((layer) => layer.id === banner.selectedId) ??
        banner.texts[0]
    );
}

export function withSelectedText(
    banner: Banner,
    partial: Partial<TextLayer>,
): Banner {
    const current = selectedText(banner);
    const nextLayer = createTextLayer(
        { ...current, ...partial, id: current.id },
        banner,
    );
    return {
        ...banner,
        texts: banner.texts.map((layer) =>
            layer.id === current.id ? nextLayer : layer,
        ),
        selectedId: current.id,
    };
}

export function addTextLayer(banner: Banner, text = "새 글자"): Banner {
    if (banner.texts.length >= MAX_TEXTS) return banner;
    const index = banner.texts.length;
    const layer = createTextLayer(
        {
            text,
            fontFamily: "Black Han Sans",
            fontSize: 72,
            offsetY: Math.min(banner.height / 2 - 40, index * 70),
            styleId: "plain",
        },
        banner,
    );
    return {
        ...banner,
        texts: [...banner.texts, layer],
        selectedId: layer.id,
    };
}

export function removeTextLayer(banner: Banner, id: string): Banner {
    if (banner.texts.length <= 1) return banner;
    const texts = banner.texts.filter((layer) => layer.id !== id);
    const selectedId =
        banner.selectedId === id ? texts[texts.length - 1].id : banner.selectedId;
    return { ...banner, texts, selectedId };
}

export function loadDraft(): Banner | null {
    try {
        const raw =
            localStorage.getItem(STORAGE_KEY) ??
            localStorage.getItem("banner-maker-draft-v1");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
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
