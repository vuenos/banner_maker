import {
    Banner,
    TextLayer,
    applyTextStyle,
    createTextLayer,
    sanitize,
} from "./bannerModel";
import { Locale, translate } from "./i18n";

export type ThumbnailSampleId =
    | "entertainment"
    | "drama"
    | "sports"
    | "talk";

export const THUMBNAIL_SAMPLE_IDS: ThumbnailSampleId[] = [
    "entertainment",
    "drama",
    "sports",
    "talk",
];

export type ThumbnailSample = {
    id: ThumbnailSampleId;
    labelKey: string;
    tipKey: string;
    backgroundColor: string;
};

export const THUMBNAIL_SAMPLES: ThumbnailSample[] = [
    {
        id: "entertainment",
        labelKey: "sampleEntertainment",
        tipKey: "sampleEntertainmentTip",
        backgroundColor: "#1c2333",
    },
    {
        id: "drama",
        labelKey: "sampleDrama",
        tipKey: "sampleDramaTip",
        backgroundColor: "#0a0a0a",
    },
    {
        id: "sports",
        labelKey: "sampleSports",
        tipKey: "sampleSportsTip",
        backgroundColor: "#243040",
    },
    {
        id: "talk",
        labelKey: "sampleTalk",
        tipKey: "sampleTalkTip",
        backgroundColor: "#1f8fad",
    },
];

function layer(
    partial: Partial<TextLayer>,
    canvas: { width: number; height: number },
): TextLayer {
    return createTextLayer(partial, canvas);
}

export function buildThumbnailSample(
    id: ThumbnailSampleId,
    locale: Locale,
): Banner {
    const width = 1280;
    const height = 720;
    const canvas = { width, height };
    const sample = THUMBNAIL_SAMPLES.find((item) => item.id === id);
    const backgroundColor = sample?.backgroundColor ?? "#111111";
    const t = (key: string) => translate(locale, key);

    let texts: TextLayer[] = [];

    if (id === "entertainment") {
        texts = [
            applyTextStyle(
                layer(
                    {
                        text: t("sampleText_entertainment_1"),
                        fontSize: 110,
                        fontFamily: "Black Han Sans",
                        align: "center",
                        offsetY: -70,
                    },
                    canvas,
                ),
                "variety",
            ),
            applyTextStyle(
                layer(
                    {
                        text: t("sampleText_entertainment_2"),
                        fontSize: 108,
                        fontFamily: "Black Han Sans",
                        align: "center",
                        offsetY: 55,
                    },
                    canvas,
                ),
                "hot",
            ),
            applyTextStyle(
                layer(
                    {
                        text: t("sampleText_entertainment_3"),
                        fontSize: 42,
                        fontFamily: "Do Hyeon",
                        align: "right",
                        offsetX: 420,
                        offsetY: -220,
                    },
                    canvas,
                ),
                "impact",
            ),
        ];
    } else if (id === "drama") {
        texts = [
            {
                ...layer(
                    {
                        text: t("sampleText_drama_1"),
                        fontSize: 52,
                        fontFamily: "Do Hyeon",
                        fontColor: "#111111",
                        align: "center",
                        offsetY: -250,
                        strokeWidth: 18,
                        strokeColor: "#ffe400",
                        shadow: false,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            applyTextStyle(
                layer(
                    {
                        text: t("sampleText_drama_2"),
                        fontSize: 56,
                        fontFamily: "Do Hyeon",
                        align: "center",
                        offsetY: -170,
                    },
                    canvas,
                ),
                "impact",
            ),
            {
                ...layer(
                    {
                        text: t("sampleText_drama_3"),
                        fontSize: 48,
                        fontFamily: "Nanum Pen Script",
                        fontColor: "#c9a0ff",
                        align: "center",
                        offsetX: -90,
                        offsetY: 230,
                        strokeWidth: 3,
                        strokeColor: "#ffffff",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            {
                ...layer(
                    {
                        text: t("sampleText_drama_4"),
                        fontSize: 120,
                        fontFamily: "Noto Serif KR",
                        fontColor: "#e10600",
                        align: "center",
                        offsetX: 160,
                        offsetY: 235,
                        strokeWidth: 8,
                        strokeColor: "#ffffff",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
        ];
    } else if (id === "sports") {
        texts = [
            {
                ...layer(
                    {
                        text: t("sampleText_sports_1"),
                        fontSize: 64,
                        fontFamily: "Black Han Sans",
                        fontColor: "#0b1f4d",
                        align: "center",
                        offsetY: 110,
                        strokeWidth: 10,
                        strokeColor: "#00e5ff",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            {
                ...layer(
                    {
                        text: t("sampleText_sports_2"),
                        fontSize: 64,
                        fontFamily: "Black Han Sans",
                        fontColor: "#00e5ff",
                        align: "center",
                        offsetY: 210,
                        strokeWidth: 10,
                        strokeColor: "#0b2a6e",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            applyTextStyle(
                layer(
                    {
                        text: t("sampleText_sports_3"),
                        fontSize: 28,
                        fontFamily: "Anton",
                        align: "right",
                        offsetX: 480,
                        offsetY: -280,
                    },
                    canvas,
                ),
                "impact",
            ),
        ];
    } else {
        texts = [
            {
                ...layer(
                    {
                        text: t("sampleText_talk_1"),
                        fontSize: 36,
                        fontFamily: "Do Hyeon",
                        fontColor: "#ffffff",
                        align: "center",
                        offsetX: 220,
                        offsetY: 120,
                        strokeWidth: 8,
                        strokeColor: "#111111",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            applyTextStyle(
                layer(
                    {
                        text: t("sampleText_talk_2"),
                        fontSize: 120,
                        fontFamily: "Black Han Sans",
                        align: "center",
                        offsetX: 180,
                        offsetY: 220,
                    },
                    canvas,
                ),
                "impact",
            ),
        ];
    }

    return sanitize({
        width,
        height,
        backgroundColor,
        backgroundGradient: "",
        imageUrl: "",
        guide: null,
        texts,
        selectedId: texts[0]?.id,
    });
}
