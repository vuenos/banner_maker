import {
    Banner,
    applyTextStyle,
    createTextLayer,
    sanitize,
} from "./bannerModel";

export type ThumbnailSampleId =
    | "variety"
    | "spectrum"
    | "blush"
    | "minimal";

export const THUMBNAIL_SAMPLE_IDS: ThumbnailSampleId[] = [
    "variety",
    "spectrum",
    "blush",
    "minimal",
];

export type ThumbnailSample = {
    id: ThumbnailSampleId;
    labelKey: string;
    tipKey: string;
    textKey: string;
    backgroundColor: string;
};

export const THUMBNAIL_SAMPLES: ThumbnailSample[] = [
    {
        id: "variety",
        labelKey: "sampleVariety",
        tipKey: "sampleVarietyTip",
        textKey: "sampleText_variety",
        backgroundColor: "#0b1b3a",
    },
    {
        id: "spectrum",
        labelKey: "sampleSpectrum",
        tipKey: "sampleSpectrumTip",
        textKey: "sampleText_spectrum",
        backgroundColor: "#111111",
    },
    {
        id: "blush",
        labelKey: "sampleBlush",
        tipKey: "sampleBlushTip",
        textKey: "sampleText_blush",
        backgroundColor: "#ffe4ec",
    },
    {
        id: "minimal",
        labelKey: "sampleMinimal",
        tipKey: "sampleMinimalTip",
        textKey: "sampleText_minimal",
        backgroundColor: "#2f6bff",
    },
];

export function buildThumbnailSample(
    id: ThumbnailSampleId,
    text: string,
): Banner {
    const width = 1280;
    const height = 720;
    const sample = THUMBNAIL_SAMPLES.find((item) => item.id === id);
    const backgroundColor = sample?.backgroundColor ?? "#2f6bff";

    let layer = createTextLayer(
        {
            text,
            fontSize: id === "minimal" ? 92 : 88,
            fontFamily:
                id === "minimal" ? "East Sea Dokdo" : "Black Han Sans",
            fontColor: "#FFFFFF",
            align: "center",
            offsetX: 0,
            offsetY: 0,
            styleId: "plain",
        },
        { width, height },
    );

    if (id === "variety") {
        layer = applyTextStyle(layer, "variety");
    } else if (id === "spectrum") {
        layer = applyTextStyle(layer, "spectrum");
    } else if (id === "blush") {
        layer = applyTextStyle(layer, "blush");
    } else {
        layer = {
            ...layer,
            styleId: "plain",
            fontColor: "#FFFFFF",
            strokeWidth: 0,
            shadow: true,
        };
    }

    return sanitize({
        width,
        height,
        backgroundColor,
        imageUrl: "",
        guide: null,
        texts: [layer],
        selectedId: layer.id,
    });
}
