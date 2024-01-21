import React, {useEffect, useState, useRef} from "react";
import { SketchPicker } from "react-color";
import styled from "styled-components";
import html2canvas from "html2canvas";
import { Button, Input, Row, Col, Typography, Select } from "antd";
import {
  BgColorsOutlined, CloudDownloadOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  FontColorsOutlined,
  FontSizeOutlined, MessageOutlined
} from "@ant-design/icons";

const { Title } = Typography;

const Swatch = styled.div`
    height: 24px;
    padding: 8px 8px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 0 0 1px rgba(0,0,0,.1);
    display: flex;
    cursor: pointer;
    color: #000;
    font-size: 22px;
  `;

const PopOver = styled.div`
    position: absolute;
    top: 40px;
    right: 0;
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
  const [width, setWidth] = useState("640");
  const [height, setHeight] = useState("320");
  const [color, setColor] = useState("green");
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState("50");
  const [fontFamily, setFontFamily] = useState<string>("East Sea Dokdo");
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [displayBgColorPicker, setDisplayBgColorPicker] = useState(false);

  const inputRef = useRef(null);
  const canvasRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null);

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
    setColor(color.hex)
  }

  const fontColorChange = (color: { hex: string }) => {
    setFontColor(color.hex)
  }

  const fontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(e.target.value)
  }

  const getRandomColor = () => {
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

  return (
    <>
      <Row justify="center" style={{ marginTop: "-120px" }}>
        <Title id="page-title" level={1}>Banner created by entering text</Title>
      </Row>

      <Row justify="center" style={{ marginBottom: "24px" }}>
        <Col>
          <div
              id="canvasContainer"
              ref={canvasRef}
              style={{
                fontSize: `${fontSize}px`,
                width: `${width}px`,
                height: `${height}px`,
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
        </Col>
      </Row>

      <Row justify="center" gutter={20} style={{ marginBottom: "24px" }}>
        <Col span={4}>
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
        </Col>

        <Col span={4}>
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
        </Col>

        <Col span={4}>
          <Input
            ref={inputRef}
            addonBefore={<ColumnWidthOutlined />}
            addonAfter="px"
            size="large"
            type="number"
            name="width"
            defaultValue={width}
            onChange={widthChange}
          />
        </Col>

        <Col span={4}>
          <Input
            ref={inputRef}
            addonBefore={<ColumnHeightOutlined />}
            addonAfter="px"
            size="large"
            type="number"
            name="height"
            defaultValue={height}
            onChange={heightChange}
          />
        </Col>

        <Col>
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
        </Col>

        <Col>
          <Swatch onClick={ handleClick }>
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
        </Col>
      </Row>

      <Row justify="center" gutter={16}>
        <Col>
          <Button type="primary" size="large" shape="round" icon={<CloudDownloadOutlined />} onClick={downloadImage}>Download</Button>
        </Col>
        <Col>
          <Button type="default" size="large" shape="round" icon={<BgColorsOutlined />} onClick={() => randomColor()}>Random</Button>
        </Col>
        <Col>
          <Button type="default" size="large" shape="round" icon={<MessageOutlined />} onClick={() => handleRandomWording()}>Random Words</Button>
        </Col>
      </Row>
    </>
  )
}

export default App
