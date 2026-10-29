import {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
    ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { SketchPicker } from "react-color";
import styled from "styled-components";
import html2canvas from "html2canvas";
import {
    Button,
    ConfigProvider,
    Dropdown,
    Input,
    Modal,
    Select,
    Tooltip,
    theme,
    message,
} from "antd";
import type { MenuProps } from "antd";
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";
import jaJP from "antd/locale/ja_JP";
import koKR from "antd/locale/ko_KR";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    BgColorsOutlined,
    ClearOutlined,
    CloudDownloadOutlined,
    DeleteOutlined,
    DesktopOutlined,
    DragOutlined,
    FontSizeOutlined,
    BulbOutlined,
    GlobalOutlined,
    LayoutOutlined,
    MailOutlined,
    MessageOutlined,
    MobileOutlined,
    PictureOutlined,
    PlusOutlined,
    RedoOutlined,
    UndoOutlined,
    YoutubeOutlined,
} from "@ant-design/icons";
import { Analytics } from "@vercel/analytics/react";
import { track } from "@vercel/analytics";
import logoImg from "./assets/android-chrome-512x512.png";
import {
    Align,
    CHANNEL_SAFE,
    FONTS,
    MAX_TEXTS,
    PRESETS,
    TEXT_STYLES,
    TextStyleId,
    applyTextStyle,
    fontsHref,
    isGradientTextStyle,
    layerStrokeStyle,
    layerVisualStyle,
    randomHex,
} from "./bannerModel";
import {
    LOCALES,
    LOCALE_LABELS,
    LOCALE_SHORT,
    LOCALE_STORAGE_KEY,
    Locale,
    PRESET_I18N,
    STYLE_I18N,
    applyLocale,
    pickPhrase,
    readLocale,
    translate,
} from "./i18n";

const ANTD_LOCALES = {
    ko: koKR,
    en: enUS,
    ja: jaJP,
    es: esES,
} as const;

function seoLandingBase(locale: Locale) {
    return locale === "ko" ? "" : `/${locale}`;
}
import { useBannerState } from "./useBannerState";

type Picker = "bg" | "font" | "stroke" | null;
type Zoom = "fit" | "50" | "100";
type PanelTab = "canvas" | "text" | "background";
type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "banner-maker-theme";

function readThemeMode(): ThemeMode {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark" || saved === "light") return saved;
    } catch {
        /* ignore */
    }
    return "light";
}

function applyThemeMode(mode: ThemeMode) {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#141518" : "#f3f4f6");
}

const PANEL_TABS: {
    id: PanelTab;
    labelKey: string;
    icon: ReactNode;
}[] = [
    { id: "canvas", labelKey: "tabCanvas", icon: <LayoutOutlined /> },
    { id: "text", labelKey: "tabText", icon: <FontSizeOutlined /> },
    { id: "background", labelKey: "tabBackground", icon: <PictureOutlined /> },
];

const PRESET_ICONS: Record<string, ReactNode> = {
    "16:9": <DesktopOutlined />,
    "9:16": <MobileOutlined />,
    youtube: <YoutubeOutlined />,
    channel: <LayoutOutlined />,
};

function studioTheme(mode: ThemeMode) {
    const light = mode === "light";
    return {
        algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
            colorPrimary: "#AA55FF",
            colorBgContainer: light ? "#FFFFFF" : "#2A2B30",
            colorBgElevated: light ? "#FFFFFF" : "#32333A",
            colorBorder: light ? "#E5E7EB" : "#3A3B42",
            colorText: light ? "#1F2937" : "#E8E8EA",
            colorTextSecondary: light ? "#4B5563" : "#9A9AA3",
            colorBgLayout: light ? "#F3F4F6" : "#141518",
            borderRadius: 12,
            fontSize: 14,
            controlHeight: 40,
            controlHeightSM: 36,
            fontFamily:
                "'Noto Sans KR', system-ui, -apple-system, Segoe UI, sans-serif",
            controlOutline: "rgba(170, 85, 255, 0.22)",
        },
        components: {
            Button: {
                primaryShadow: "none",
                defaultShadow: "none",
                defaultBg: light ? "#FFFFFF" : "#2A2B30",
                defaultBorderColor: light ? "#E5E7EB" : "#3A3B42",
                defaultColor: light ? "#1F2937" : "#E8E8EA",
                contentFontSizeSM: 13,
                paddingInlineSM: 12,
            },
            Input: {
                addonBg: light ? "#F3F4F6" : "#3A3B42",
                inputFontSize: 14,
            },
            Select: {
                optionSelectedBg: "rgba(170, 85, 255, 0.1)",
                optionFontSize: 14,
            },
        },
    };
}

const Swatch = styled.button`
    height: 40px;
    padding: 6px 10px;
    background: var(--studio-surface);
    border-radius: 12px;
    border: 1px solid var(--studio-panel-border);
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    cursor: pointer;
    color: var(--studio-text);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    width: 100%;
    box-shadow: var(--studio-shadow);
`;

const PopOver = styled.div`
    position: fixed;
    z-index: 1001;
`;

const Cover = styled.div`
    position: fixed;
    inset: 0;
    z-index: 1000;
`;

function readEditorText(element: HTMLElement) {
    return element.innerText.replace(/\n$/, "");
}

function NumberField({
    value,
    min,
    max,
    addonBefore,
    onCommit,
}: {
    value: number;
    min: number;
    max: number;
    addonBefore: ReactNode;
    onCommit: (value: number) => void;
}) {
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const commitDraft = () => {
        const parsed = Number(draft);
        const next = Math.min(max, Math.max(min, Math.round(parsed)));
        const safe = Number.isFinite(next) ? next : min;
        setDraft(String(safe));
        onCommit(safe);
    };

    return (
        <Input
            addonBefore={addonBefore}
            addonAfter="px"
            size="middle"
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ""))}
            onBlur={commitDraft}
            onPressEnter={(event) => event.currentTarget.blur()}
        />
    );
}

function usePreviewScale(width: number, height: number, zoom: Zoom) {
    const frameRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;

        const measure = () => {
            const pad = 4;
            const availableWidth = Math.max(1, frame.clientWidth - pad);
            const availableHeight = Math.max(1, frame.clientHeight - pad);
            const fit = Math.min(
                availableWidth / width,
                availableHeight / height,
            );
            const next =
                zoom === "fit" ? Math.min(1, fit) : zoom === "50" ? 0.5 : 1;
            setScale(next);
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(frame);
        window.addEventListener("resize", measure);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [width, height, zoom]);

    return { frameRef, scale };
}

function App() {
    const [locale, setLocale] = useState<Locale>(readLocale);
    const t = useCallback((key: string) => translate(locale, key), [locale]);
    const {
        banner,
        selected,
        commit,
        commitText,
        live,
        liveText,
        endGesture,
        undo,
        redo,
        reset,
        addText,
        removeText,
        selectText,
        canUndo,
        canRedo,
    } = useBannerState(locale);
    const [picker, setPicker] = useState<Picker>(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const pickerAnchorRef = useRef<HTMLElement | null>(null);
    const [zoom, setZoom] = useState<Zoom>("fit");
    const [panelTab, setPanelTab] = useState<PanelTab>("text");
    const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        applyThemeMode(themeMode);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, themeMode);
        } catch {
            /* ignore */
        }
    }, [themeMode]);

    useEffect(() => {
        applyLocale(locale);
        document.title = t("docTitle");
        const description = document.querySelector('meta[name="description"]');
        if (description) {
            description.setAttribute("content", t("docDescription"));
        }
        try {
            localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        } catch {
            /* ignore */
        }
    }, [locale, t]);
    const canvasRef = useRef<HTMLDivElement>(null);
    const slotRef = useRef<HTMLDivElement>(null);
    const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const imageRef = useRef<HTMLInputElement>(null);
    const scaleRef = useRef(1);
    const { frameRef, scale } = usePreviewScale(banner.width, banner.height, zoom);
    scaleRef.current = scale;
    const [gripPos, setGripPos] = useState({ top: 8, left: 8, ready: false });

    useLayoutEffect(() => {
        const slot = slotRef.current;
        const block = blockRefs.current[selected.id];
        if (!slot || !block) {
            setGripPos((prev) => ({ ...prev, ready: false }));
            return;
        }
        const place = () => {
            const slotBox = slot.getBoundingClientRect();
            const blockBox = block.getBoundingClientRect();
            setGripPos({
                top: blockBox.top - slotBox.top - 36,
                left: blockBox.left - slotBox.left,
                ready: true,
            });
        };
        place();
        const observer = new ResizeObserver(place);
        observer.observe(block);
        observer.observe(slot);
        return () => observer.disconnect();
    }, [
        selected.id,
        selected.offsetX,
        selected.offsetY,
        selected.text,
        selected.fontSize,
        selected.fontFamily,
        selected.align,
        scale,
        banner.width,
        banner.height,
    ]);

    useEffect(() => {
        const id = "banner-font";
        let link = document.getElementById(id) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }
        link.href = fontsHref(banner.texts.map((layer) => layer.fontFamily));
    }, [banner.texts]);

    useEffect(() => {
        for (const layer of banner.texts) {
            const editor = editorRefs.current[layer.id];
            if (!editor || document.activeElement === editor) continue;
            if (readEditorText(editor) !== layer.text) {
                editor.innerText = layer.text;
            }
        }
    }, [banner.texts]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("input, textarea, [contenteditable='true']")) return;
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") {
                return;
            }
            event.preventDefault();
            if (event.shiftKey) redo();
            else undo();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [redo, undo]);

    const placePicker = useCallback(() => {
        const anchor = pickerAnchorRef.current?.getBoundingClientRect();
        if (!anchor) return;
        const width = 220;
        const height = 320;
        const margin = 8;
        let left = anchor.left;
        let top = anchor.bottom + margin;
        if (left + width > window.innerWidth - margin) {
            left = Math.max(margin, window.innerWidth - width - margin);
        }
        if (top + height > window.innerHeight - margin) {
            top = Math.max(margin, anchor.top - height - margin);
        }
        setPickerPosition({ top, left });
    }, []);

    const openPicker = (next: Exclude<Picker, null>, anchor: HTMLElement) => {
        if (picker === next) {
            closePicker();
            return;
        }
        endGesture();
        pickerAnchorRef.current = anchor;
        placePicker();
        setPicker(next);
    };

    const closePicker = () => {
        endGesture();
        setPicker(null);
    };

    useEffect(() => {
        if (!picker) return;
        placePicker();
        window.addEventListener("resize", placePicker);
        window.addEventListener("scroll", placePicker, true);
        return () => {
            window.removeEventListener("resize", placePicker);
            window.removeEventListener("scroll", placePicker, true);
        };
    }, [picker, placePicker]);

    const pickerColor =
        picker === "font"
            ? selected.fontColor
            : picker === "stroke"
              ? selected.strokeColor
              : banner.backgroundColor;

    const onPickerChange = (color: { hex: string }) => {
        if (picker === "font") liveText({ fontColor: color.hex });
        else if (picker === "stroke") liveText({ strokeColor: color.hex });
        else live({ backgroundColor: color.hex });
    };

    const onGripDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        const baseX = selected.offsetX;
        const baseY = selected.offsetY;
        liveText({ offsetX: baseX, offsetY: baseY });

        const move = (pointer: PointerEvent) => {
            const dx = (pointer.clientX - startX) / scaleRef.current;
            const dy = (pointer.clientY - startY) / scaleRef.current;
            liveText({ offsetX: baseX + dx, offsetY: baseY + dy });
        };
        const up = () => {
            endGesture();
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };

    const downloadImage = async () => {
        const node = canvasRef.current;
        if (!node || exporting) return;
        setExporting(true);
        track("download", { width: banner.width, height: banner.height });
        try {
            await Promise.all(
                banner.texts.map((layer) =>
                    document.fonts.load(
                        `${layer.fontSize}px "${layer.fontFamily}"`,
                    ),
                ),
            );
            await document.fonts.ready;
            const shot = await html2canvas(node, {
                scale: 1,
                width: banner.width,
                height: banner.height,
                windowWidth: Math.max(banner.width, window.innerWidth),
                windowHeight: Math.max(banner.height, window.innerHeight),
                backgroundColor: banner.backgroundColor,
                useCORS: true,
                onclone: (_document, cloned) => {
                    const element = cloned as HTMLElement;
                    element.style.transform = "none";
                    element.style.width = `${banner.width}px`;
                    element.style.height = `${banner.height}px`;
                },
            });
            const link = document.createElement("a");
            link.href = shot.toDataURL("image/png");
            link.download = `banner-${banner.width}x${banner.height}.png`;
            link.click();
        } catch {
            message.error(t("exportError"));
        } finally {
            setExporting(false);
        }
    };

    const imageUploadHandler = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            commit({ imageUrl: typeof reader.result === "string" ? reader.result : "" });
        };
        reader.readAsDataURL(file);
    };

    const displayWidth = banner.width * scale;
    const displayHeight = banner.height * scale;

    return (
        <ConfigProvider
            locale={ANTD_LOCALES[locale]}
            theme={studioTheme(themeMode)}
        >
            <div className="studio">
                <header className="studio-topbar">
                    <div className="studio-brand">
                        <img src={logoImg} alt="" width={28} height={28} />
                        <div className="studio-brand-copy">
                            <h1>{t("brandTitle")}</h1>
                            <p>{t("brandSubtitle")}</p>
                        </div>
                    </div>
                    <div className="studio-topbar-actions">
                        <Dropdown
                            trigger={["click"]}
                            menu={
                                {
                                    selectable: true,
                                    selectedKeys: [locale],
                                    onClick: ({ key }) => {
                                        if (
                                            LOCALES.includes(key as Locale)
                                        ) {
                                            setLocale(key as Locale);
                                        }
                                    },
                                    items: LOCALES.map((code) => ({
                                        key: code,
                                        label: LOCALE_LABELS[code],
                                    })),
                                } satisfies MenuProps
                            }
                        >
                            <Button
                                size="middle"
                                icon={<GlobalOutlined />}
                                aria-label={t("langSwitchAria")}
                                aria-haspopup="menu"
                            >
                                {LOCALE_SHORT[locale]}
                            </Button>
                        </Dropdown>
                        <Tooltip
                            title={
                                themeMode === "light"
                                    ? t("themeToDark")
                                    : t("themeToLight")
                            }
                        >
                            <Button
                                size="middle"
                                icon={<BulbOutlined />}
                                aria-label={
                                    themeMode === "light"
                                        ? t("themeToDarkAria")
                                        : t("themeToLightAria")
                                }
                                onClick={() =>
                                    setThemeMode((mode) =>
                                        mode === "light" ? "dark" : "light",
                                    )
                                }
                            />
                        </Tooltip>
                        <Tooltip title={t("undo")}>
                            <span>
                                <Button
                                    size="middle"
                                    icon={<UndoOutlined />}
                                    aria-label={t("undo")}
                                    disabled={!canUndo}
                                    onClick={undo}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title={t("redo")}>
                            <span>
                                <Button
                                    size="middle"
                                    icon={<RedoOutlined />}
                                    aria-label={t("redo")}
                                    disabled={!canRedo}
                                    onClick={redo}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title={t("resetTooltip")}>
                            <Button
                                size="middle"
                                icon={<ClearOutlined />}
                                aria-label={t("reset")}
                                onClick={() => {
                                    Modal.confirm({
                                        title: t("resetConfirmTitle"),
                                        content: t("resetConfirmBody"),
                                        okText: t("resetOk"),
                                        cancelText: t("resetCancel"),
                                        okButtonProps: { danger: true },
                                        onOk: () => {
                                            reset();
                                            setZoom("fit");
                                            setPicker(null);
                                        },
                                    });
                                }}
                            >
                                {t("reset")}
                            </Button>
                        </Tooltip>
                        <a className="studio-contact" href="mailto:vuenos@gmail.com">
                            <MailOutlined />
                            {t("contact")}
                        </a>
                        <Button
                            id="download-button"
                            type="primary"
                            size="middle"
                            icon={<CloudDownloadOutlined />}
                            loading={exporting}
                            onClick={downloadImage}
                        >
                            {t("saveImage")}
                        </Button>
                    </div>
                </header>

                <div className="studio-body">
                    <aside className="studio-panel">
                        <nav className="panel-rail" aria-label={t("panelNav")}>
                            {PANEL_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`panel-rail-btn${panelTab === tab.id ? " is-active" : ""}`}
                                    aria-pressed={panelTab === tab.id}
                                    aria-label={t(tab.labelKey)}
                                    onClick={() => {
                                        setPanelTab(tab.id);
                                        closePicker();
                                    }}
                                >
                                    <span className="panel-rail-icon">{tab.icon}</span>
                                    <span className="panel-rail-label">
                                        {t(tab.labelKey)}
                                    </span>
                                </button>
                            ))}
                        </nav>
                        <div className="panel-content">
                            <div className="controls">
                                {panelTab === "canvas" ? (
                                    <>
                                        <section className="control-group">
                                            <div className="control-label">
                                                {t("saveSize")}
                                            </div>
                                            <div className="split-row size-row">
                                                <NumberField
                                                    addonBefore={t("width")}
                                                    value={banner.width}
                                                    min={64}
                                                    max={4096}
                                                    onCommit={(width) =>
                                                        commit({ width })
                                                    }
                                                />
                                                <NumberField
                                                    addonBefore={t("height")}
                                                    value={banner.height}
                                                    min={64}
                                                    max={4096}
                                                    onCommit={(height) =>
                                                        commit({ height })
                                                    }
                                                />
                                            </div>
                                            <div className="preset-grid">
                                                {PRESETS.map((preset) => {
                                                    const active =
                                                        banner.width ===
                                                            preset.width &&
                                                        banner.height ===
                                                            preset.height;
                                                    const i18n =
                                                        PRESET_I18N[preset.id];
                                                    return (
                                                        <Tooltip
                                                            key={preset.id}
                                                            title={t(i18n.tip)}
                                                            placement="right"
                                                        >
                                                            <button
                                                                type="button"
                                                                className={`preset-card${active ? " is-active" : ""}`}
                                                                onClick={() =>
                                                                    commit({
                                                                        width: preset.width,
                                                                        height: preset.height,
                                                                        guide: preset.guide,
                                                                        texts: banner.texts.map(
                                                                            (
                                                                                layer,
                                                                            ) => ({
                                                                                ...layer,
                                                                                offsetX: 0,
                                                                                offsetY: 0,
                                                                            }),
                                                                        ),
                                                                    })
                                                                }
                                                            >
                                                                <div className="preset-card-stage">
                                                                    <div
                                                                        className={`preset-card-thumb preset-thumb-${preset.id.replace(":", "-")}`}
                                                                        style={{
                                                                            aspectRatio: `${preset.width} / ${preset.height}`,
                                                                        }}
                                                                    >
                                                                        <span className="preset-card-icon">
                                                                            {
                                                                                PRESET_ICONS[
                                                                                    preset
                                                                                        .id
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="preset-card-meta">
                                                                    <span className="preset-name">
                                                                        {t(
                                                                            i18n.label,
                                                                        )}
                                                                    </span>
                                                                    <span className="preset-meta">
                                                                        {
                                                                            preset.width
                                                                        }
                                                                        ×
                                                                        {
                                                                            preset.height
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                            {banner.guide === "channel" ? (
                                                <p className="control-note">
                                                    {t("channelGuideNote")}
                                                </p>
                                            ) : null}
                                        </section>
                                        <section className="control-group">
                                            <div className="control-label">
                                                {t("previewZoom")}
                                            </div>
                                            <div className="button-row zoom-row">
                                                {(
                                                    [
                                                        [
                                                            "fit",
                                                            "zoomFit",
                                                            "zoomFitTip",
                                                        ],
                                                        [
                                                            "50",
                                                            "zoom50",
                                                            "zoom50Tip",
                                                        ],
                                                        [
                                                            "100",
                                                            "zoom100",
                                                            "zoom100Tip",
                                                        ],
                                                    ] as const
                                                ).map(([id, labelKey, tipKey]) => (
                                                    <Tooltip
                                                        key={id}
                                                        title={t(tipKey)}
                                                    >
                                                        <Button
                                                            type={
                                                                zoom === id
                                                                    ? "primary"
                                                                    : "default"
                                                            }
                                                            size="middle"
                                                            onClick={() =>
                                                                setZoom(id)
                                                            }
                                                        >
                                                            {t(labelKey)}
                                                        </Button>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                ) : null}

                                {panelTab === "text" ? (
                                    <section className="control-group">
                                        <div className="control-label-row">
                                            <div className="control-label">
                                                {t("layers")}
                                            </div>
                                            <div className="button-row layer-actions">
                                                <Tooltip title={t("addTextTip")}>
                                                    <Button
                                                        size="middle"
                                                        icon={<PlusOutlined />}
                                                        disabled={
                                                            banner.texts.length >=
                                                            MAX_TEXTS
                                                        }
                                                        onClick={addText}
                                                    >
                                                        {t("addText")}
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title={t("deleteTextTip")}>
                                                    <Button
                                                        size="middle"
                                                        icon={<DeleteOutlined />}
                                                        disabled={
                                                            banner.texts.length <= 1
                                                        }
                                                        onClick={() => removeText()}
                                                    />
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="layer-list">
                                            {banner.texts.map((layer, index) => (
                                                <button
                                                    key={layer.id}
                                                    type="button"
                                                    className={`layer-chip${layer.id === selected.id ? " is-active" : ""}`}
                                                    onClick={() =>
                                                        selectText(layer.id)
                                                    }
                                                >
                                                    <span>{index + 1}</span>
                                                    <em>
                                                        {layer.text
                                                            .replace(/\s+/g, " ")
                                                            .trim() ||
                                                            t("emptyText")}
                                                    </em>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="control-label">
                                            {t("style")}
                                        </div>
                                        <div className="style-grid">
                                            {TEXT_STYLES.map((style) => {
                                                const i18n = STYLE_I18N[style.id];
                                                return (
                                                <Tooltip
                                                    key={style.id}
                                                    title={t(i18n.tip)}
                                                >
                                                    <button
                                                        type="button"
                                                        className={`style-card${selected.styleId === style.id ? " is-active" : ""}`}
                                                        onClick={() =>
                                                            commitText(
                                                                applyTextStyle(
                                                                    selected,
                                                                    style.id as TextStyleId,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <span
                                                            className="style-swatch"
                                                            style={{
                                                                background:
                                                                    style.swatch,
                                                            }}
                                                        >
                                                            Aa
                                                        </span>
                                                        <span className="style-name">
                                                            {t(i18n.label)}
                                                        </span>
                                                    </button>
                                                </Tooltip>
                                                );
                                            })}
                                        </div>
                                        <div className="control-label">
                                            {t("typography")}
                                        </div>
                                        <Select
                                            size="middle"
                                            value={selected.fontFamily}
                                            style={{ width: "100%" }}
                                            onChange={(value: string) =>
                                                commitText({ fontFamily: value })
                                            }
                                            options={FONTS.map((font) => ({
                                                value: font.value,
                                                label: font.value,
                                            }))}
                                        />
                                        <NumberField
                                            addonBefore={t("fontSize")}
                                            value={selected.fontSize}
                                            min={8}
                                            max={400}
                                            onCommit={(fontSize) =>
                                                commitText({ fontSize })
                                            }
                                        />
                                        <div className="button-row align-tools">
                                            {(
                                                [
                                                    [
                                                        "left",
                                                        "alignLeft",
                                                        <AlignLeftOutlined key="left" />,
                                                    ],
                                                    [
                                                        "center",
                                                        "alignCenter",
                                                        <AlignCenterOutlined key="center" />,
                                                    ],
                                                    [
                                                        "right",
                                                        "alignRight",
                                                        <AlignRightOutlined key="right" />,
                                                    ],
                                                ] as const
                                            ).map(([align, labelKey, icon]) => (
                                                <Tooltip
                                                    key={align}
                                                    title={t(labelKey)}
                                                >
                                                    <Button
                                                        size="middle"
                                                        type={
                                                            selected.align === align
                                                                ? "primary"
                                                                : "default"
                                                        }
                                                        aria-label={t(labelKey)}
                                                        icon={icon}
                                                        onClick={() =>
                                                            commitText({
                                                                align: align as Align,
                                                            })
                                                        }
                                                    />
                                                </Tooltip>
                                            ))}
                                            <Tooltip title={t("shadowTip")}>
                                                <Button
                                                    size="middle"
                                                    type={
                                                        selected.shadow
                                                            ? "primary"
                                                            : "default"
                                                    }
                                                    onClick={() =>
                                                        commitText({
                                                            shadow: !selected.shadow,
                                                        })
                                                    }
                                                >
                                                    {t("shadow")}
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        <Tooltip
                                            title={
                                                selected.strokeWidth === 0
                                                    ? t("strokeTipOff")
                                                    : t("strokeTipOn")
                                            }
                                        >
                                            <div>
                                                <NumberField
                                                    addonBefore={t("stroke")}
                                                    value={selected.strokeWidth}
                                                    min={0}
                                                    max={32}
                                                    onCommit={(strokeWidth) =>
                                                        commitText({ strokeWidth })
                                                    }
                                                />
                                            </div>
                                        </Tooltip>
                                        <div className="swatch-row">
                                            <Tooltip title={t("fontColorTip")}>
                                                <Swatch
                                                    type="button"
                                                    aria-label={t("fontColor")}
                                                    onClick={(event) =>
                                                        openPicker(
                                                            "font",
                                                            event.currentTarget,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className="colorChip"
                                                        style={{
                                                            backgroundColor:
                                                                selected.fontColor,
                                                        }}
                                                    />
                                                    {t("fontColor")}
                                                </Swatch>
                                            </Tooltip>
                                            <Tooltip
                                                title={
                                                    selected.strokeWidth === 0
                                                        ? t("strokeColorTipOff")
                                                        : t("strokeColorTipOn")
                                                }
                                            >
                                                <Swatch
                                                    type="button"
                                                    aria-label={t("strokeColor")}
                                                    onClick={(event) =>
                                                        openPicker(
                                                            "stroke",
                                                            event.currentTarget,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className="colorChip"
                                                        style={{
                                                            backgroundColor:
                                                                selected.strokeColor,
                                                        }}
                                                    />
                                                    {t("strokeColor")}
                                                </Swatch>
                                            </Tooltip>
                                        </div>
                                        <Tooltip title={t("randomPhraseTip")}>
                                            <span className="tooltip-block">
                                                <Button
                                                    type="default"
                                                    size="middle"
                                                    block
                                                    icon={<MessageOutlined />}
                                                    onClick={() =>
                                                        commitText({
                                                            text: pickPhrase(locale),
                                                        })
                                                    }
                                                >
                                                    {t("randomPhrase")}
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </section>
                                ) : null}

                                {panelTab === "background" ? (
                                    <section className="control-group">
                                        <div className="control-label">
                                            {t("backgroundColor")}
                                        </div>
                                        <div className="swatch-row">
                                            <Tooltip title={t("backgroundColorTip")}>
                                                <Swatch
                                                    type="button"
                                                    aria-label={t("backgroundColor")}
                                                    onClick={(event) =>
                                                        openPicker(
                                                            "bg",
                                                            event.currentTarget,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className="colorChip"
                                                        style={{
                                                            backgroundColor:
                                                                banner.backgroundColor,
                                                        }}
                                                    />
                                                    {t("backgroundColor")}
                                                </Swatch>
                                            </Tooltip>
                                            <Tooltip title={t("randomBgTip")}>
                                                <Button
                                                    size="middle"
                                                    icon={<BgColorsOutlined />}
                                                    onClick={() =>
                                                        commit({
                                                            backgroundColor:
                                                                randomHex(),
                                                        })
                                                    }
                                                >
                                                    {t("randomBg")}
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        <div className="control-label">
                                            {t("backgroundImage")}
                                        </div>
                                        <div className="swatch-row">
                                            <Tooltip title={t("uploadImageTip")}>
                                                <Button
                                                    size="middle"
                                                    aria-label={t("backgroundImage")}
                                                    icon={<PictureOutlined />}
                                                    onClick={() =>
                                                        imageRef.current?.click()
                                                    }
                                                >
                                                    {t("uploadImage")}
                                                </Button>
                                            </Tooltip>
                                            {banner.imageUrl ? (
                                                <Tooltip title={t("removeImageTip")}>
                                                    <Button
                                                        size="middle"
                                                        aria-label={t(
                                                            "removeImageAria",
                                                        )}
                                                        icon={<DeleteOutlined />}
                                                        onClick={() =>
                                                            commit({ imageUrl: "" })
                                                        }
                                                    >
                                                        {t("removeImage")}
                                                    </Button>
                                                </Tooltip>
                                            ) : null}
                                        </div>
                                        {banner.imageUrl ? (
                                            <div
                                                className="bg-preview"
                                                style={{
                                                    backgroundImage: `url(${banner.imageUrl})`,
                                                }}
                                                aria-hidden
                                            />
                                        ) : (
                                            <p className="control-note">
                                                {t("imageNote")}
                                            </p>
                                        )}
                                        <input
                                            ref={imageRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={imageUploadHandler}
                                            style={{ display: "none" }}
                                        />
                                    </section>
                                ) : null}
                            </div>
                        </div>
                        {picker
                            ? createPortal(
                                  <>
                                      <Cover onClick={closePicker} />
                                      <PopOver
                                          style={{
                                              top: pickerPosition.top,
                                              left: pickerPosition.left,
                                          }}
                                      >
                                          <SketchPicker
                                              color={pickerColor}
                                              onChange={onPickerChange}
                                          />
                                      </PopOver>
                                  </>,
                                  document.getElementById("root") ?? document.body,
                              )
                            : null}
                    </aside>

                    <main className="studio-stage">
                        <div ref={frameRef} className="preview-frame">
                            <div
                                ref={slotRef}
                                className="preview-slot"
                                style={{
                                    width: displayWidth,
                                    height: displayHeight,
                                }}
                            >
                                <div
                                    id="canvasContainer"
                                    ref={canvasRef}
                                    style={{
                                        width: banner.width,
                                        height: banner.height,
                                        transform: `scale(${scale})`,
                                        transformOrigin: "top left",
                                        backgroundColor: banner.backgroundColor,
                                        backgroundImage: banner.imageUrl
                                            ? `url(${banner.imageUrl})`
                                            : "none",
                                        backgroundRepeat: "no-repeat",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                >
                                    {banner.guide === "channel" ? (
                                        <div
                                            data-html2canvas-ignore="true"
                                            className="safe-area"
                                            style={{
                                                width: CHANNEL_SAFE.width,
                                                height: CHANNEL_SAFE.height,
                                            }}
                                        />
                                    ) : null}
                                    {banner.texts.map((layer) => {
                                        const isSelected = layer.id === selected.id;
                                        return (
                                            <div
                                                key={layer.id}
                                                ref={(node) => {
                                                    blockRefs.current[layer.id] = node;
                                                }}
                                                className={`text-block${isSelected ? " is-selected" : ""}`}
                                                style={{
                                                    transform: `translate(calc(-50% + ${layer.offsetX}px), calc(-50% + ${layer.offsetY}px))`,
                                                }}
                                                onPointerDown={() => {
                                                    setPanelTab("text");
                                                    selectText(layer.id);
                                                }}
                                            >
                                                <div className="banner-text-stack">
                                                    {isGradientTextStyle(
                                                        layer.styleId,
                                                    ) ? (
                                                        <div
                                                            className="banner-text banner-text-stroke"
                                                            aria-hidden
                                                            style={layerStrokeStyle(
                                                                layer,
                                                            )}
                                                        >
                                                            {layer.text}
                                                        </div>
                                                    ) : null}
                                                    <div
                                                        ref={(node) => {
                                                            editorRefs.current[
                                                                layer.id
                                                            ] = node;
                                                        }}
                                                        className="banner-text"
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        spellCheck={false}
                                                        role="textbox"
                                                        aria-label={t("bannerTextAria")}
                                                        onFocus={() => {
                                                            setPanelTab("text");
                                                            selectText(layer.id);
                                                        }}
                                                        onInput={(event) => {
                                                            selectText(layer.id);
                                                            liveText({
                                                                text: readEditorText(
                                                                    event.currentTarget,
                                                                ),
                                                            });
                                                        }}
                                                        onBlur={endGesture}
                                                        style={layerVisualStyle(
                                                            layer,
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {gripPos.ready ? (
                                    <Button
                                        className="text-grip"
                                        size="small"
                                        icon={<DragOutlined />}
                                        aria-label={t("moveTextAria")}
                                        style={{
                                            top: Math.max(4, gripPos.top),
                                            left: Math.max(4, gripPos.left),
                                        }}
                                        onPointerDown={onGripDown}
                                    >
                                        {t("moveText")}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                        <p className="edit-hint">{t("editHint")}</p>
                    </main>
                </div>
            </div>
            <section className="seo-panel" aria-label={t("seoNav")}>
                <div className="seo-inner">
                    <header className="seo-header">
                        <h2>{t("seoTitle")}</h2>
                        <p>{t("seoLead")}</p>
                    </header>

                    <div className="seo-grid">
                        <article className="seo-card">
                            <h3>{t("howTitle")}</h3>
                            <ol className="seo-steps">
                                <li>{t("how1")}</li>
                                <li>{t("how2")}</li>
                                <li>{t("how3")}</li>
                                <li>{t("how4")}</li>
                            </ol>
                        </article>
                        <article className="seo-card">
                            <h3>{t("sizesTitle")}</h3>
                            <ul className="seo-list">
                                <li>
                                    <a
                                        href={`${seoLandingBase(locale)}/youtube-thumbnail/`}
                                    >
                                        {t("sizeYoutube")}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={`${seoLandingBase(locale)}/shorts-thumbnail/`}
                                    >
                                        {t("sizeShorts")}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={`${seoLandingBase(locale)}/channel-banner/`}
                                    >
                                        {t("sizeChannel")}
                                    </a>
                                </li>
                                <li>{t("sizeVideo")}</li>
                            </ul>
                        </article>
                    </div>

                    <div className="seo-faq">
                        <h3>{t("faqTitle")}</h3>
                        {(
                            [
                                ["faq1q", "faq1a"],
                                ["faq2q", "faq2a"],
                                ["faq3q", "faq3a"],
                                ["faq4q", "faq4a"],
                                ["faq5q", "faq5a"],
                                ["faq6q", "faq6a"],
                            ] as const
                        ).map(([q, a]) => (
                            <details key={q}>
                                <summary>{t(q)}</summary>
                                <p>{t(a)}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
            <Analytics />
        </ConfigProvider>
    );
}

export default App;
