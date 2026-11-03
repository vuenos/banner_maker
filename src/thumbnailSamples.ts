import {
    Banner,
    TextLayer,
    applyTextStyle,
    createTextLayer,
    sanitize,
} from "./bannerModel";
import { Locale, translate } from "./i18n";
import sampleBgDrama from "./assets/sample-bg-drama.jpg";
import sampleBgEntertainment from "./assets/sample-bg-entertainment.jpg";
import sampleBgPlaylist from "./assets/sample-bg-playlist.jpg";
import sampleBgSports from "./assets/sample-bg-sports.jpg";

export type ThumbnailSampleId =
    | "entertainment"
    | "drama"
    | "sports"
    | "playlist";

export const THUMBNAIL_SAMPLE_IDS: ThumbnailSampleId[] = [
    "entertainment",
    "drama",
    "sports",
    "playlist",
];

export type ThumbnailSample = {
    id: ThumbnailSampleId;
    labelKey: string;
    tipKey: string;
    backgroundColor: string;
    imageUrl: string;
};

export const THUMBNAIL_SAMPLES: ThumbnailSample[] = [
    {
        id: "entertainment",
        labelKey: "sampleEntertainment",
        tipKey: "sampleEntertainmentTip",
        backgroundColor: "#1c2333",
        imageUrl: sampleBgEntertainment,
    },
    {
        id: "drama",
        labelKey: "sampleDrama",
        tipKey: "sampleDramaTip",
        backgroundColor: "#0a0a0a",
        imageUrl: sampleBgDrama,
    },
    {
        id: "sports",
        labelKey: "sampleSports",
        tipKey: "sampleSportsTip",
        backgroundColor: "#243040",
        imageUrl: sampleBgSports,
    },
    {
        id: "playlist",
        labelKey: "samplePlaylist",
        tipKey: "samplePlaylistTip",
        backgroundColor: "#3a2a18",
        imageUrl: sampleBgPlaylist,
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
    const imageUrl = sample?.imageUrl ?? "";
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
            {
                ...applyTextStyle(
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
                strokeWidth: 4,
            },
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
                        strokeWidth: 8,
                        strokeColor: "#ffe400",
                        shadow: false,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            {
                ...applyTextStyle(
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
                strokeWidth: 5,
            },
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
            {
                ...applyTextStyle(
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
                strokeWidth: 3,
            },
        ];
    } else {
        texts = [
            {
                ...layer(
                    {
                        text: t("sampleText_playlist_1"),
                        fontSize: 22,
                        fontFamily: "Oswald",
                        fontColor: "#ffffff",
                        align: "center",
                        offsetY: -210,
                        strokeWidth: 0,
                        strokeColor: "#111111",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            {
                ...layer(
                    {
                        text: t("sampleText_playlist_2"),
                        fontSize: 132,
                        fontFamily: "PT Serif",
                        fontColor: "#fff8e7",
                        align: "center",
                        offsetY: -20,
                        strokeWidth: 0,
                        strokeColor: "#111111",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            {
                ...layer(
                    {
                        text: t("sampleText_playlist_3"),
                        fontSize: 18,
                        fontFamily: "Noto Sans KR",
                        fontColor: "#ffffff",
                        align: "center",
                        offsetY: 230,
                        strokeWidth: 0,
                        strokeColor: "#111111",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
            {
                ...layer(
                    {
                        text: t("sampleText_playlist_4"),
                        fontSize: 18,
                        fontFamily: "Noto Sans KR",
                        fontColor: "#ffffff",
                        align: "center",
                        offsetY: 268,
                        strokeWidth: 0,
                        strokeColor: "#111111",
                        shadow: true,
                        styleId: "plain",
                    },
                    canvas,
                ),
            },
        ];
    }

    return sanitize({
        width,
        height,
        backgroundColor,
        backgroundGradient: "",
        imageUrl,
        guide: null,
        texts,
        selectedId: texts[0]?.id,
    });
}
