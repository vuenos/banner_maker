import React, {useEffect, useState, useRef, ChangeEvent} from "react";
import { SketchPicker } from "react-color";
import styled from "styled-components";
import html2canvas from "html2canvas";
import {Button, Input, Row, Col, Typography, Select} from "antd";
import {
  BgColorsOutlined, CloudDownloadOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined, ExclamationCircleOutlined,
  FontColorsOutlined,
  FontSizeOutlined, MessageOutlined, PictureOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

const Swatch = styled.div`
    height: 28px;
    padding: 6px 6px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,.1);
    display: flex;
    cursor: pointer;
    color: #000;
    font-size: 22px;
  `;

const PopOver = styled.div`
    position: absolute;
    top: -20px;
    left: 16px;
    z-index: 2;  
  `;

const Cover = styled.div`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  `;

function App() {

  const [text, setText] = useState("Sample Text");
  const [width, setWidth] = useState<string>("960");
  const [height, setHeight] = useState<string>("540");
  const [color, setColor] = useState("green");
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState("50");
  const [fontFamily, setFontFamily] = useState<string>("East Sea Dokdo");
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [displayBgColorPicker, setDisplayBgColorPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("")

  const inputRef = useRef(null);
  const inputRefWidth = useRef(null);
  const canvasRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const arrRandomWordings = [
    "독도는 우리땅",
    "Of the People, By the People, For the People",
    "당신이 포기할 때, 나는 시작한다.",
    "준비하지 않은 자는 기회가 와도 소용없다",
    "쓴 맛을 모르는 사람은 단 맛도 모른다.",
    "I never dreamed about success, I worked for it.",
    "No pain no gain.",
    "Early bird catches the worm.",
    "솔직히 내 사랑, 내 알 바 아니오.\n(Frankly, my dear, I don't give a damn.)",
    "당신의 눈동자에 건배. \n(Here's looking at you, kid.)",
    "포스가 함께하길. \n(May the Force be with you.)",
    "내일은 내일의 태양이 뜰 거야!\n (After all, tomorrow is another day!)" ,
    "친구는 가까이, 허나 적은 더 가까이.\n (Keep your friends close, but your enemies closer.)",
    "The die is cast. – Julius caesar",
    "Life is unfair, get used to it. – Bill Gates",
    "Stay hungry, stay foolish"
  ];

  const handleRandomWording = () => {
    const randomIndex = Math.floor(Math.random() * arrRandomWordings.length);
    const randomWord = arrRandomWordings[randomIndex];
    setText(randomWord);
  };

  const widthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(e.target.value)
  }

  const heightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(e.target.value)
  }

  const colorChange = (color: { hex: string }) => {
    const canvasContainer = document.getElementById("canvasContainer");
    if (canvasContainer) {
      canvasContainer.style.backgroundImage = "none";
    }
    setColor(color.hex);
  }

  const fontColorChange = (color: { hex: string }) => {
    setFontColor(color.hex)
  }

  const fontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(e.target.value)
  }

  const getRandomColor = () => {
    const canvasContainer = document.getElementById("canvasContainer");
    if (canvasContainer) {
      canvasContainer.style.backgroundImage = "none";
    }
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  };

  const randomColor = () => {
    setColor(getRandomColor())
  }

  const handleSelectChange = (value: string) => {
    setFontFamily(value);
    const fontSelect = document.getElementById("font-select");
    if (fontSelect) {
      fontSelect.style.fontFamily = value;
    }
  };

  const ratioChangeHandler = (w: string, h: string) => {
    setWidth(w);
    setHeight(h);
  };

  const ratioZoomHandler = (ratio: number) => {
    // @ts-ignore
    setWidth((prevWidth) => prevWidth * ratio);
    // @ts-ignore
    setHeight((prevHeight) => prevHeight * ratio);
  }

  const downloadImage = async () => {
    const canvasContainer = canvasRef.current as HTMLDivElement;
    const canvas = await html2canvas(canvasContainer);
    const dataURL: string = canvas.toDataURL('image/png');

    // 브라우저에 링크 생성
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'banner-sample.png';
    link.click();
  };

  const imageUploadHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;
        setImageUrl(result);
      };

      reader.readAsDataURL(file);
    }
  }

  const handleClick = () => {
    setDisplayColorPicker(true)
  };

  const handleBgClick = () => {
    setDisplayBgColorPicker(true)
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
    setDisplayBgColorPicker(false);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = text;
    }
  }, [text]);

  useEffect(() => {
    setColor(getRandomColor());
    handleRandomWording();
  }, []);

  useEffect(() => {
    const canvasContainer = document.getElementById("canvasContainer");
    if (canvasContainer) {
      canvasContainer.style.fontFamily = fontFamily;
      canvasContainer.style.fontSize = fontSize;
      canvasContainer.style.color = fontColor;
      canvasContainer.style.backgroundColor = color;
      canvasContainer.style.width = width;
      canvasContainer.style.height = height;
    }
  }, [fontFamily, fontSize, fontColor, color, width, height]);

  useEffect(() => {
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.style.color = fontColor;
    }
  }, [fontColor]);

  useEffect(() => {
    const fontSelect = document.querySelector(".font-select") as HTMLSelectElement;
    if (fontSelect) {
      fontSelect.style.fontFamily = fontFamily;
    }
  }, [fontFamily]);

  useEffect(() => {
    if(editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <>
      <Row justify="center">
        <Title level={1} style={{ marginBlock: 0, fontSize: 0, height: 0 }}>
          You can create YouTube thumbnails, TikTok thumbnails, and YouTube Shorts thumbnails for free.
        </Title>
        <Title id="page-title" style={{ marginTop: 0 }} level={2}>Banner created by entering text</Title>
      </Row>

      <Row justify="center" gutter={24}>

        <Col flex="240px">
          <Row>
            <Input
              ref={inputRefWidth}
              addonBefore={<ColumnWidthOutlined />}
              addonAfter="px"
              size="large"
              type="number"
              name="width"
              value={width}
              onChange={widthChange}
            />
            <Input
              ref={inputRef}
              addonBefore={<ColumnHeightOutlined />}
              addonAfter="px"
              size="large"
              type="number"
              name="height"
              value={height}
              onChange={heightChange}
              style={{ marginTop: "16px" }}
            />
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Button type="default" size="small" onClick={() => ratioChangeHandler("960", "540")}>16 : 9</Button>
            <Button type="default" size="small" onClick={() => ratioChangeHandler("360", "640")} style={{ marginLeft: "8px" }}>9 : 16</Button>
            <Button type="default" size="small" onClick={() => ratioChangeHandler("1280", "720")} style={{ marginLeft: "8px" }}>Youtube</Button>
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(0.75)}>x 0.75</Button>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(0.5)} style={{ marginLeft: "8px" }}>x 0.5</Button>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(0.25)} style={{ marginLeft: "8px" }}>x 0.25</Button>
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(1.25)}>x 1.25</Button>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(1.5)} style={{ marginLeft: "8px" }}>x 1.5</Button>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(1.75)} style={{ marginLeft: "8px" }}>x 1.75</Button>
            <Button type="default" size="small" onClick={() => ratioZoomHandler(2)} style={{ marginLeft: "8px" }}>x 2</Button>
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Select
              className="font-select"
              size="large"
              defaultValue="East Sea Dokdo"
              style={{ width: "100%" }}
              onChange={handleSelectChange}
              options={[
                { value: 'Song Myung', label: 'Song Myung', className: "ff-song-myung"},
                { value: 'Yeon Sung', label: 'Yeon Sung', className: "ff-yeon-sung" },
                { value: 'Noto Sans KR', label: 'Noto Sans KR', className: "ff-noto-kr"},
                { value: 'Noto Serif KR', label: 'Noto Serif KR', className: "ff-noto-serif" },
                { value: 'East Sea Dokdo', label: 'East Sea Dokdo', className: "ff-dokdo" },
                { value: 'Single Day', label: 'Single Day', className: "ff-single-day" },
                { value: 'Nanum Pen Script', label: 'Nanum Pen Script', className: "ff-nanum-pen" },
                { value: 'PT Serif', label: 'PT Serif', className: "ff-PT-serif" },
                { value: 'Roboto', label: 'Roboto', className: "ff-roboto" },
                { value: 'Nunito', label: 'Nunito', className: "ff-nunito" },
                { value: 'Lobster', label: 'Lobster', className: "ff-lobster" },
                { value: 'Bebas Neue', label: 'Bebas Neue', className: "ff-bebas-neue" },
              ]}
            />
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Input
              ref={inputRef}
              addonBefore={<FontSizeOutlined />}
              addonAfter="px"
              size="large"
              type="number"
              name="fontSize"
              defaultValue={fontSize}
              onChange={fontSizeChange}
            />
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Swatch onClick={ handleBgClick }>
              <BgColorsOutlined />
              <div
                className="colorChip"
                style={{
                  backgroundColor: color
                }}
              >
              </div>
            </Swatch>
            { displayBgColorPicker ? <PopOver>
              <Cover onClick={ handleClose } />
              <SketchPicker color={ color } onChange={ colorChange } />
            </PopOver> : null }

            <Swatch onClick={ handleClick } style={{ marginLeft: "8px" }}>
              <FontColorsOutlined />
              <div
                className="colorChip"
                style={{
                  backgroundColor: fontColor
                }}
              >
              </div>
            </Swatch>
            { displayColorPicker ? <PopOver>
              <Cover onClick={ handleClose } />
              <SketchPicker color={ fontColor } onChange={ fontColorChange } />
            </PopOver> : null }
            <Button
              size="large"
              onClick={() => imageRef.current?.click()}
              style={{ marginLeft: "8px" }}
            >
              <PictureOutlined className="uploadPhoto" />
            </Button>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              onChange={imageUploadHandler}
              style={{ display: "none" }}
            />
          </Row>

          <Row style={{ marginTop: "16px" }}>
            <Button type="primary" size="large" shape="round" block style={{ marginTop: "16px" }} icon={<CloudDownloadOutlined />} onClick={downloadImage}>Download</Button>
            <Button type="default" size="large" shape="round" block style={{ marginTop: "16px" }} icon={<BgColorsOutlined />} onClick={() => randomColor()}>Random</Button>
            <Button type="default" size="large" shape="round" block style={{ marginTop: "16px" }} icon={<MessageOutlined />} onClick={() => handleRandomWording()}>Random Words</Button>
          </Row>
        </Col>

        <Col span={16}>
          <Row>
            <Col>
              <div
                id="canvasContainer"
                ref={canvasRef}
                style={{
                  fontSize: `${fontSize}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundRepeat: 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  id="editor"
                  ref={editorRef}
                  contentEditable="true"
                  spellCheck="false"
                >
                </div>
              </div>

              <Text type="secondary" style={{ display: "block", marginTop: "8px", color: "#AAA", textAlign: "right" }}>
                <ExclamationCircleOutlined /> Click on the text and edit it
              </Text>
            </Col>
          </Row>
        </Col>

      </Row>
    </>
  )
}

export default App
