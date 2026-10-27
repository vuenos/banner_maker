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
    Input,
    Modal,
    Select,
    Tooltip,
    theme,
    message,
} from "antd";
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
    randomPhrase,
} from "./bannerModel";
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
    label: string;
    icon: ReactNode;
}[] = [
    { id: "canvas", label: "크기", icon: <LayoutOutlined /> },
    { id: "text", label: "글자", icon: <FontSizeOutlined /> },
    { id: "background", label: "배경", icon: <PictureOutlined /> },
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
    } = useBannerState();
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
            message.error("Could not create the image.");
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
        <ConfigProvider theme={studioTheme(themeMode)}>
            <div className="studio">
                <header className="studio-topbar">
                    <div className="studio-brand">
                        <img src={logoImg} alt="" width={28} height={28} />
                        <div className="studio-brand-copy">
                            <h1>Thumbnail Maker</h1>
                            <p>유튜브 썸네일 · 배너 무료 제작</p>
                        </div>
                    </div>
                    <div className="studio-topbar-actions">
                        <Tooltip
                            title={
                                themeMode === "light"
                                    ? "다크 테마"
                                    : "라이트 테마"
                            }
                        >
                            <Button
                                size="middle"
                                icon={<BulbOutlined />}
                                aria-label={
                                    themeMode === "light"
                                        ? "다크 테마로 전환"
                                        : "라이트 테마로 전환"
                                }
                                onClick={() =>
                                    setThemeMode((mode) =>
                                        mode === "light" ? "dark" : "light",
                                    )
                                }
                            />
                        </Tooltip>
                        <Tooltip title="실행 취소">
                            <span>
                                <Button
                                    size="middle"
                                    icon={<UndoOutlined />}
                                    aria-label="실행 취소"
                                    disabled={!canUndo}
                                    onClick={undo}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title="다시 실행">
                            <span>
                                <Button
                                    size="middle"
                                    icon={<RedoOutlined />}
                                    aria-label="다시 실행"
                                    disabled={!canRedo}
                                    onClick={redo}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title="처음 상태로 되돌리기">
                            <Button
                                size="middle"
                                icon={<ClearOutlined />}
                                aria-label="초기화"
                                onClick={() => {
                                    Modal.confirm({
                                        title: "초기화할까요?",
                                        content:
                                            "크기·글자·배경·히스토리가 처음 상태로 돌아갑니다.",
                                        okText: "초기화",
                                        cancelText: "취소",
                                        okButtonProps: { danger: true },
                                        onOk: () => {
                                            reset();
                                            setZoom("fit");
                                            setPicker(null);
                                        },
                                    });
                                }}
                            >
                                초기화
                            </Button>
                        </Tooltip>
                        <a className="studio-contact" href="mailto:vuenos@gmail.com">
                            <MailOutlined />
                            Contact
                        </a>
                        <Button
                            id="download-button"
                            type="primary"
                            size="middle"
                            icon={<CloudDownloadOutlined />}
                            loading={exporting}
                            onClick={downloadImage}
                        >
                            이미지 저장
                        </Button>
                    </div>
                </header>

                <div className="studio-body">
                    <aside className="studio-panel">
                        <nav className="panel-rail" aria-label="편집 기능">
                            {PANEL_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`panel-rail-btn${panelTab === tab.id ? " is-active" : ""}`}
                                    aria-pressed={panelTab === tab.id}
                                    aria-label={tab.label}
                                    onClick={() => {
                                        setPanelTab(tab.id);
                                        closePicker();
                                    }}
                                >
                                    <span className="panel-rail-icon">{tab.icon}</span>
                                    <span className="panel-rail-label">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="panel-content">
                            <div className="controls">
                                {panelTab === "canvas" ? (
                                    <>
                                        <section className="control-group">
                                            <div className="control-label">저장 크기</div>
                                            <div className="split-row size-row">
                                                <NumberField
                                                    addonBefore="가로"
                                                    value={banner.width}
                                                    min={64}
                                                    max={4096}
                                                    onCommit={(width) =>
                                                        commit({ width })
                                                    }
                                                />
                                                <NumberField
                                                    addonBefore="세로"
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
                                                    return (
                                                        <Tooltip
                                                            key={preset.id}
                                                            title={preset.tooltip}
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
                                                                        {
                                                                            preset.label
                                                                        }
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
                                                    점선 안이 모든 기기에서 보이는
                                                    영역입니다. 점선은 저장되지
                                                    않습니다.
                                                </p>
                                            ) : null}
                                        </section>
                                        <section className="control-group">
                                            <div className="control-label">
                                                화면 배율
                                            </div>
                                            <div className="button-row zoom-row">
                                                {(
                                                    [
                                                        [
                                                            "fit",
                                                            "맞추기",
                                                            "미리보기만 화면에 맞춤",
                                                        ],
                                                        [
                                                            "50",
                                                            "50%",
                                                            "미리보기를 절반 크기로",
                                                        ],
                                                        [
                                                            "100",
                                                            "100%",
                                                            "저장 픽셀과 같은 크기",
                                                        ],
                                                    ] as const
                                                ).map(([id, label, tip]) => (
                                                    <Tooltip key={id} title={tip}>
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
                                                            {label}
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
                                            <div className="control-label">레이어</div>
                                            <div className="button-row layer-actions">
                                                <Tooltip title="글자를 하나 더 넣습니다">
                                                    <Button
                                                        size="middle"
                                                        icon={<PlusOutlined />}
                                                        disabled={
                                                            banner.texts.length >=
                                                            MAX_TEXTS
                                                        }
                                                        onClick={addText}
                                                    >
                                                        추가
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title="선택한 글자를 지웁니다">
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
                                                            .trim() || "빈 글자"}
                                                    </em>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="control-label">스타일</div>
                                        <div className="style-grid">
                                            {TEXT_STYLES.map((style) => (
                                                <Tooltip
                                                    key={style.id}
                                                    title={style.tooltip}
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
                                                            {style.label}
                                                        </span>
                                                    </button>
                                                </Tooltip>
                                            ))}
                                        </div>
                                        <div className="control-label">타이포</div>
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
                                            addonBefore="크기"
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
                                                        "왼쪽 정렬",
                                                        <AlignLeftOutlined key="left" />,
                                                    ],
                                                    [
                                                        "center",
                                                        "가운데 정렬",
                                                        <AlignCenterOutlined key="center" />,
                                                    ],
                                                    [
                                                        "right",
                                                        "오른쪽 정렬",
                                                        <AlignRightOutlined key="right" />,
                                                    ],
                                                ] as const
                                            ).map(([align, label, icon]) => (
                                                <Tooltip key={align} title={label}>
                                                    <Button
                                                        size="middle"
                                                        type={
                                                            selected.align === align
                                                                ? "primary"
                                                                : "default"
                                                        }
                                                        aria-label={label}
                                                        icon={icon}
                                                        onClick={() =>
                                                            commitText({
                                                                align: align as Align,
                                                            })
                                                        }
                                                    />
                                                </Tooltip>
                                            ))}
                                            <Tooltip title="글자 아래에 그림자를 넣습니다">
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
                                                    그림자
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        <Tooltip
                                            title={
                                                selected.strokeWidth === 0
                                                    ? "굵기를 올리면 글자 테두리에 색이 보입니다"
                                                    : "글자 테두리 굵기"
                                            }
                                        >
                                            <div>
                                                <NumberField
                                                    addonBefore="외곽선"
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
                                            <Tooltip title="글자 색 · 그라데이션 스타일에서는 보조색">
                                                <Swatch
                                                    type="button"
                                                    aria-label="글자색"
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
                                                    글자색
                                                </Swatch>
                                            </Tooltip>
                                            <Tooltip
                                                title={
                                                    selected.strokeWidth === 0
                                                        ? "외곽선 굵기를 올리면 테두리 색이 보입니다"
                                                        : "외곽선 색"
                                                }
                                            >
                                                <Swatch
                                                    type="button"
                                                    aria-label="외곽선 색"
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
                                                    외곽선
                                                </Swatch>
                                            </Tooltip>
                                        </div>
                                        <Tooltip title="선택한 글자 문구를 무작위로 바꿉니다">
                                            <span className="tooltip-block">
                                                <Button
                                                    type="default"
                                                    size="middle"
                                                    block
                                                    icon={<MessageOutlined />}
                                                    onClick={() =>
                                                        commitText({
                                                            text: randomPhrase(),
                                                        })
                                                    }
                                                >
                                                    문구 바꾸기
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </section>
                                ) : null}

                                {panelTab === "background" ? (
                                    <section className="control-group">
                                        <div className="control-label">배경색</div>
                                        <div className="swatch-row">
                                            <Tooltip title="배너 배경 색">
                                                <Swatch
                                                    type="button"
                                                    aria-label="배경색"
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
                                                    배경색
                                                </Swatch>
                                            </Tooltip>
                                            <Tooltip title="배경 색을 무작위로 바꿉니다">
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
                                                    랜덤
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        <div className="control-label">배경 사진</div>
                                        <div className="swatch-row">
                                            <Tooltip title="배경에 사진을 넣습니다">
                                                <Button
                                                    size="middle"
                                                    aria-label="배경 사진"
                                                    icon={<PictureOutlined />}
                                                    onClick={() =>
                                                        imageRef.current?.click()
                                                    }
                                                >
                                                    사진 올리기
                                                </Button>
                                            </Tooltip>
                                            {banner.imageUrl ? (
                                                <Tooltip title="배경 사진을 지웁니다">
                                                    <Button
                                                        size="middle"
                                                        aria-label="배경 사진 삭제"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() =>
                                                            commit({ imageUrl: "" })
                                                        }
                                                    >
                                                        삭제
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
                                                사진을 올리면 배경색 위에 덮어
                                                표시됩니다.
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
                                                        aria-label="배너 글자"
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
                                        aria-label="글자 이동"
                                        style={{
                                            top: Math.max(4, gripPos.top),
                                            left: Math.max(4, gripPos.left),
                                        }}
                                        onPointerDown={onGripDown}
                                    >
                                        이동
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                        <p className="edit-hint">
                            글자를 추가하고, 스타일을 고른 뒤 드래그로 자리를
                            옮기세요.
                        </p>
                    </main>
                </div>
            </div>
            <Analytics />
        </ConfigProvider>
    );
}

export default App;
