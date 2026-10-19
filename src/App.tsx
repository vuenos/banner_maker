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
import { Button, Col, Input, Row, Typography, Select, Tag, message } from "antd";
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    BgColorsOutlined,
    CloudDownloadOutlined,
    DeleteOutlined,
    DragOutlined,
    MailOutlined,
    MessageOutlined,
    PictureOutlined,
    RedoOutlined,
    UndoOutlined,
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

const { Title, Text } = Typography;

type Picker = "bg" | "font" | "stroke" | null;
type Zoom = "fit" | "50" | "100";

const Swatch = styled.button`
    height: 32px;
    padding: 4px 6px;
    background: #fff;
    border-radius: 8px;
    border: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    color: #111;
    font-size: 12px;
    line-height: 1;
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
            const availableHeight = Math.max(280, window.innerHeight - 220);
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
        <>
            <Tag
                bordered={false}
                style={{
                    position: "fixed",
                    top: "16px",
                    right: "16px",
                    color: "#FFFFFF",
                    zIndex: 1000,
                }}
            >
                <MailOutlined style={{ marginRight: "4px" }} />
                <a href="mailto:vuenos@gmail.com" style={{ color: "#FFFFFF" }}>
                    Contact
                </a>
            </Tag>
            <Row justify="center" className="page-heading">
                <Col span={24}>
                    <Title level={1}>
                        <img src={logoImg} alt="Banner Maker" width={32} />
                        Thumbnail Maker
                    </Title>
                    <Title level={2} style={{ margin: 0, color: "#ffffff" }}>
                        글자를 넣어 썸네일과 배너를 만듭니다
                    </Title>
                </Col>
            </Row>

            <Row justify="center" gutter={[12, 12]} className="editor-row">
                <Col xs={24} lg={8}>
                    <div className="controls">
                        <section className="control-group">
                            <div className="control-label">저장 크기</div>
                            <div className="split-row">
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
                                {PRESETS.map((preset) => (
                                    <Button
                                        key={preset.id}
                                        size="small"
                                        type={
                                            banner.width === preset.width &&
                                            banner.height === preset.height
                                                ? "primary"
                                                : "default"
                                        }
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
                                        <span className="preset-name">{preset.label}</span>
                                        <span className="preset-meta">
                                            {preset.width}×{preset.height}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                            {banner.guide === "channel" ? (
                                <p className="control-note">
                                    점선 안이 모든 기기에서 보이는 영역입니다. 점선은
                                    저장되지 않습니다.
                                </p>
                            ) : null}
                        </section>

                        <section className="control-group">
                            <div className="inline-row">
                                <div className="control-label">화면 배율</div>
                                <div className="button-row">
                                    {(
                                        [
                                            ["fit", "맞추기"],
                                            ["50", "50%"],
                                            ["100", "100%"],
                                        ] as const
                                    ).map(([id, label]) => (
                                        <Button
                                            key={id}
                                            type={zoom === id ? "primary" : "default"}
                                            size="small"
                                            onClick={() => setZoom(id)}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                    <Button
                                        size="small"
                                        icon={<UndoOutlined />}
                                        aria-label="실행 취소"
                                        disabled={!canUndo}
                                        onClick={undo}
                                    />
                                    <Button
                                        size="small"
                                        icon={<RedoOutlined />}
                                        aria-label="다시 실행"
                                        disabled={!canRedo}
                                        onClick={redo}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="control-group">
                            <div className="control-label">글자</div>
                            <div className="split-row font-row">
                                <Select
                                    size="middle"
                                    value={banner.fontFamily}
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
                            </div>
                            <div className="split-row align-row">
                                <div className="button-row">
                                    {(
                                        [
                                            ["left", "왼쪽", <AlignLeftOutlined key="left" />],
                                            [
                                                "center",
                                                "가운데",
                                                <AlignCenterOutlined key="center" />,
                                            ],
                                            [
                                                "right",
                                                "오른쪽",
                                                <AlignRightOutlined key="right" />,
                                            ],
                                        ] as const
                                    ).map(([align, label, icon]) => (
                                        <Button
                                            key={align}
                                            size="small"
                                            type={
                                                banner.align === align ? "primary" : "default"
                                            }
                                            aria-label={label}
                                            icon={icon}
                                            onClick={() => commit({ align: align as Align })}
                                        />
                                    ))}
                                    <Button
                                        size="small"
                                        type={banner.shadow ? "primary" : "default"}
                                        onClick={() => commit({ shadow: !banner.shadow })}
                                    >
                                        그림자
                                    </Button>
                                </div>
                                <NumberField
                                    addonBefore="외곽선"
                                    value={banner.strokeWidth}
                                    min={0}
                                    max={32}
                                    onCommit={(strokeWidth) => commit({ strokeWidth })}
                                />
                            </div>
                            <div className="swatch-row">
                                <Swatch
                                    type="button"
                                    aria-label="글자색"
                                    onClick={(event) =>
                                        openPicker("font", event.currentTarget)
                                    }
                                >
                                    <span
                                        className="colorChip"
                                        style={{ backgroundColor: banner.fontColor }}
                                    />
                                    글자색
                                </Swatch>
                                <Swatch
                                    type="button"
                                    aria-label="외곽선 색"
                                    title={
                                        banner.strokeWidth === 0
                                            ? "외곽선 굵기를 올리면 글자 테두리에 보입니다"
                                            : "외곽선 색"
                                    }
                                    onClick={(event) =>
                                        openPicker("stroke", event.currentTarget)
                                    }
                                >
                                    <span
                                        className="colorChip"
                                        style={{ backgroundColor: banner.strokeColor }}
                                    />
                                    외곽선
                                </Swatch>
                                <Swatch
                                    type="button"
                                    aria-label="배경색"
                                    onClick={(event) =>
                                        openPicker("bg", event.currentTarget)
                                    }
                                >
                                    <span
                                        className="colorChip"
                                        style={{ backgroundColor: banner.backgroundColor }}
                                    />
                                    배경색
                                </Swatch>
                                <Button
                                    size="small"
                                    aria-label="배경 사진"
                                    icon={<PictureOutlined />}
                                    onClick={() => imageRef.current?.click()}
                                >
                                    사진
                                </Button>
                                {banner.imageUrl ? (
                                    <Button
                                        size="small"
                                        aria-label="배경 사진 삭제"
                                        icon={<DeleteOutlined />}
                                        onClick={() => commit({ imageUrl: "" })}
                                    >
                                        삭제
                                    </Button>
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
                                      document.getElementById("root") ?? document.body,
                                  )
                                : null}
                        </section>

                        <div className="action-row">
                            <Button
                                id="download-button"
                                type="primary"
                                size="middle"
                                icon={<CloudDownloadOutlined />}
                                loading={exporting}
                                onClick={downloadImage}
                            >
                                다운로드
                            </Button>
                            <Button
                                type="default"
                                size="middle"
                                icon={<BgColorsOutlined />}
                                onClick={() => commit({ backgroundColor: randomHex() })}
                            >
                                배경 랜덤
                            </Button>
                            <Button
                                type="default"
                                size="middle"
                                icon={<MessageOutlined />}
                                onClick={() => commit({ text: randomPhrase() })}
                            >
                                문구 랜덤
                            </Button>
                        </div>
                    </div>
                </Col>

                <Col xs={24} lg={16}>
                    <div ref={frameRef} className="preview-frame">
                        <div
                            className="preview-slot"
                            style={{ width: displayWidth, height: displayHeight }}
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
                                                text: readEditorText(event.currentTarget),
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
                    <Text type="secondary" className="edit-hint">
                        글자를 클릭해 고치고, 이동 버튼으로 자리를 옮기세요.
                    </Text>
                </Col>
            </Row>
            <Analytics />
        </>
    );
}

export default App;
