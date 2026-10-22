import {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
    ReactNode,
    useCallback,
    useEffect,
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
    CloudDownloadOutlined,
    DeleteOutlined,
    DesktopOutlined,
    DragOutlined,
    LayoutOutlined,
    MailOutlined,
    MessageOutlined,
    MobileOutlined,
    PictureOutlined,
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
    PRESETS,
    fontHref,
    randomHex,
    randomPhrase,
    textShadowCss,
} from "./bannerModel";
import { useBannerState } from "./useBannerState";

type Picker = "bg" | "font" | "stroke" | null;
type Zoom = "fit" | "50" | "100";

const PRESET_ICONS: Record<string, ReactNode> = {
    "16:9": <DesktopOutlined />,
    "9:16": <MobileOutlined />,
    youtube: <YoutubeOutlined />,
    channel: <LayoutOutlined />,
};

const STUDIO_THEME = {
    algorithm: theme.darkAlgorithm,
    token: {
        colorPrimary: "#E85D4C",
        colorBgContainer: "#2A2B30",
        colorBgElevated: "#32333A",
        colorBorder: "#3A3B42",
        colorText: "#E8E8EA",
        colorTextSecondary: "#9A9AA3",
        borderRadius: 10,
        fontFamily:
            "'Noto Sans KR', system-ui, -apple-system, Segoe UI, sans-serif",
    },
    components: {
        Button: {
            primaryShadow: "none",
            defaultShadow: "none",
        },
        Input: {
            addonBg: "#3A3B42",
        },
    },
};

const Swatch = styled.button`
    height: 34px;
    padding: 4px 8px;
    background: #2a2b30;
    border-radius: 10px;
    border: 1px solid #3a3b42;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    cursor: pointer;
    color: #e8e8ea;
    font-size: 12px;
    line-height: 1;
    width: 100%;
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
            const availableWidth = Math.max(1, frame.clientWidth);
            const availableHeight = Math.max(320, window.innerHeight - 120);
            const fit = Math.min(availableWidth / width, availableHeight / height);
            const next = zoom === "fit" ? Math.min(1, fit) : zoom === "50" ? 0.5 : 1;
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
    const { banner, commit, live, endGesture, undo, redo, canUndo, canRedo } =
        useBannerState();
    const [picker, setPicker] = useState<Picker>(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const pickerAnchorRef = useRef<HTMLElement | null>(null);
    const [zoom, setZoom] = useState<Zoom>("fit");
    const [exporting, setExporting] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);
    const scaleRef = useRef(1);
    const { frameRef, scale } = usePreviewScale(banner.width, banner.height, zoom);
    scaleRef.current = scale;

    useEffect(() => {
        const id = "banner-font";
        let link = document.getElementById(id) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }
        link.href = fontHref(banner.fontFamily);
    }, [banner.fontFamily]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || document.activeElement === editor) return;
        if (readEditorText(editor) !== banner.text) {
            editor.innerText = banner.text;
        }
    }, [banner.text]);

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
            ? banner.fontColor
            : picker === "stroke"
              ? banner.strokeColor
              : banner.backgroundColor;

    const onPickerChange = (color: { hex: string }) => {
        if (picker === "font") live({ fontColor: color.hex });
        else if (picker === "stroke") live({ strokeColor: color.hex });
        else live({ backgroundColor: color.hex });
    };

    const onGripDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        const baseX = banner.offsetX;
        const baseY = banner.offsetY;
        live({ offsetX: baseX, offsetY: baseY });

        const move = (pointer: PointerEvent) => {
            const dx = (pointer.clientX - startX) / scaleRef.current;
            const dy = (pointer.clientY - startY) / scaleRef.current;
            live({ offsetX: baseX + dx, offsetY: baseY + dy });
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
            await document.fonts.load(
                `${banner.fontSize}px "${banner.fontFamily}"`,
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
    const shadow = textShadowCss(banner);

    return (
        <ConfigProvider theme={STUDIO_THEME}>
            <div className="studio">
                <header className="studio-topbar">
                    <div className="studio-brand">
                        <img src={logoImg} alt="" width={28} height={28} />
                        <div className="studio-brand-copy">
                            <strong>Thumbnail Maker</strong>
                            <span>배너 · 썸네일 제작</span>
                        </div>
                    </div>
                    <div className="studio-topbar-actions">
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
                        <div className="controls">
                            <section className="control-group">
                                <div className="control-label">저장 크기</div>
                                <div className="split-row size-row">
                                    <NumberField
                                        addonBefore="가로"
                                        value={banner.width}
                                        min={64}
                                        max={4096}
                                        onCommit={(width) => commit({ width })}
                                    />
                                    <NumberField
                                        addonBefore="세로"
                                        value={banner.height}
                                        min={64}
                                        max={4096}
                                        onCommit={(height) => commit({ height })}
                                    />
                                </div>
                                <div className="preset-grid">
                                    {PRESETS.map((preset) => {
                                        const active =
                                            banner.width === preset.width &&
                                            banner.height === preset.height;
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
                                                            offsetX: 0,
                                                            offsetY: 0,
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
                                                                {PRESET_ICONS[preset.id]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="preset-card-meta">
                                                        <span className="preset-name">
                                                            {preset.label}
                                                        </span>
                                                        <span className="preset-meta">
                                                            {preset.width}×{preset.height}
                                                        </span>
                                                    </div>
                                                </button>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                                {banner.guide === "channel" ? (
                                    <p className="control-note">
                                        점선 안이 모든 기기에서 보이는 영역입니다.
                                        점선은 저장되지 않습니다.
                                    </p>
                                ) : null}
                            </section>

                            <section className="control-group">
                                <div className="control-label">화면 배율</div>
                                <div className="button-row zoom-row">
                                    {(
                                        [
                                            ["fit", "맞추기", "미리보기만 화면에 맞춤"],
                                            ["50", "50%", "미리보기를 절반 크기로"],
                                            ["100", "100%", "저장 픽셀과 같은 크기"],
                                        ] as const
                                    ).map(([id, label, tip]) => (
                                        <Tooltip key={id} title={tip}>
                                            <Button
                                                type={zoom === id ? "primary" : "default"}
                                                size="small"
                                                onClick={() => setZoom(id)}
                                            >
                                                {label}
                                            </Button>
                                        </Tooltip>
                                    ))}
                                </div>
                            </section>

                            <section className="control-group">
                                <div className="control-label">글자</div>
                                <Select
                                    size="middle"
                                    value={banner.fontFamily}
                                    style={{ width: "100%" }}
                                    onChange={(value: string) =>
                                        commit({ fontFamily: value })
                                    }
                                    options={FONTS.map((font) => ({
                                        value: font.value,
                                        label: font.value,
                                    }))}
                                />
                                <NumberField
                                    addonBefore="크기"
                                    value={banner.fontSize}
                                    min={8}
                                    max={400}
                                    onCommit={(fontSize) => commit({ fontSize })}
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
                                                size="small"
                                                type={
                                                    banner.align === align
                                                        ? "primary"
                                                        : "default"
                                                }
                                                aria-label={label}
                                                icon={icon}
                                                onClick={() =>
                                                    commit({ align: align as Align })
                                                }
                                            />
                                        </Tooltip>
                                    ))}
                                    <Tooltip title="글자 아래에 그림자를 넣습니다">
                                        <Button
                                            size="small"
                                            type={banner.shadow ? "primary" : "default"}
                                            onClick={() =>
                                                commit({ shadow: !banner.shadow })
                                            }
                                        >
                                            그림자
                                        </Button>
                                    </Tooltip>
                                </div>
                                <Tooltip
                                    title={
                                        banner.strokeWidth === 0
                                            ? "굵기를 올리면 글자 테두리에 색이 보입니다"
                                            : "글자 테두리 굵기"
                                    }
                                >
                                    <div>
                                        <NumberField
                                            addonBefore="외곽선"
                                            value={banner.strokeWidth}
                                            min={0}
                                            max={32}
                                            onCommit={(strokeWidth) =>
                                                commit({ strokeWidth })
                                            }
                                        />
                                    </div>
                                </Tooltip>
                                <div className="swatch-row">
                                    <Tooltip title="글자 색">
                                        <Swatch
                                            type="button"
                                            aria-label="글자색"
                                            onClick={(event) =>
                                                openPicker("font", event.currentTarget)
                                            }
                                        >
                                            <span
                                                className="colorChip"
                                                style={{
                                                    backgroundColor: banner.fontColor,
                                                }}
                                            />
                                            글자색
                                        </Swatch>
                                    </Tooltip>
                                    <Tooltip
                                        title={
                                            banner.strokeWidth === 0
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
                                                    backgroundColor: banner.strokeColor,
                                                }}
                                            />
                                            외곽선
                                        </Swatch>
                                    </Tooltip>
                                    <Tooltip title="배너 배경 색">
                                        <Swatch
                                            type="button"
                                            aria-label="배경색"
                                            onClick={(event) =>
                                                openPicker("bg", event.currentTarget)
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
                                    <Tooltip title="배경에 사진을 넣습니다">
                                        <Button
                                            size="small"
                                            aria-label="배경 사진"
                                            icon={<PictureOutlined />}
                                            onClick={() => imageRef.current?.click()}
                                        >
                                            사진
                                        </Button>
                                    </Tooltip>
                                    {banner.imageUrl ? (
                                        <Tooltip title="배경 사진을 지웁니다">
                                            <Button
                                                size="small"
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
                                    <input
                                        ref={imageRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={imageUploadHandler}
                                        style={{ display: "none" }}
                                    />
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
                                          document.getElementById("root") ??
                                              document.body,
                                      )
                                    : null}
                            </section>

                            <div className="action-row">
                                <Tooltip title="배경 색을 무작위로 바꿉니다">
                                    <span className="tooltip-block">
                                        <Button
                                            type="default"
                                            size="middle"
                                            block
                                            icon={<BgColorsOutlined />}
                                            onClick={() =>
                                                commit({
                                                    backgroundColor: randomHex(),
                                                })
                                            }
                                        >
                                            배경색 바꾸기
                                        </Button>
                                    </span>
                                </Tooltip>
                                <Tooltip title="예문 문구를 무작위로 넣습니다">
                                    <span className="tooltip-block">
                                        <Button
                                            type="default"
                                            size="middle"
                                            block
                                            icon={<MessageOutlined />}
                                            onClick={() =>
                                                commit({ text: randomPhrase() })
                                            }
                                        >
                                            문구 바꾸기
                                        </Button>
                                    </span>
                                </Tooltip>
                            </div>
                        </div>
                    </aside>

                    <main className="studio-stage">
                        <div ref={frameRef} className="preview-frame">
                            <div
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
                                        fontFamily: `"${banner.fontFamily}", sans-serif`,
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
                                    <div
                                        className="text-block"
                                        style={{
                                            transform: `translate(calc(-50% + ${banner.offsetX}px), calc(-50% + ${banner.offsetY}px))`,
                                        }}
                                    >
                                        <div
                                            id="editor"
                                            ref={editorRef}
                                            contentEditable
                                            spellCheck={false}
                                            role="textbox"
                                            aria-label="배너 글자"
                                            onFocus={() => live({ text: banner.text })}
                                            onInput={(event) =>
                                                live({
                                                    text: readEditorText(
                                                        event.currentTarget,
                                                    ),
                                                })
                                            }
                                            onBlur={endGesture}
                                            style={{
                                                textAlign: banner.align,
                                                color: banner.fontColor,
                                                fontSize: banner.fontSize,
                                                fontFamily: `"${banner.fontFamily}", sans-serif`,
                                                textShadow: shadow || "none",
                                            }}
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="text-grip"
                                    size="small"
                                    icon={<DragOutlined />}
                                    aria-label="글자 이동"
                                    onPointerDown={onGripDown}
                                >
                                    이동
                                </Button>
                            </div>
                        </div>
                        <p className="edit-hint">
                            글자를 클릭해 고치고, 이동 버튼으로 자리를 옮기세요.
                        </p>
                    </main>
                </div>
            </div>
            <Analytics />
        </ConfigProvider>
    );
}

export default App;
