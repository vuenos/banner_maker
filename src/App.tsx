import {useEffect, useState, useRef} from "react";
import { SketchPicker } from "react-color";
import { ChromePicker } from "react-color";
import styled from "styled-components";
import html2canvas from "html2canvas";

const Swatch = styled.div`
    padding: 5px;
    background: #fff;
    border-radius: 1px;
    box-shadow: 0 0 0 1px rgba(0,0,0,.1);
    display: inline-block;
    cursor: pointer;
  `;

const PopOver = styled.div`
    position: absolute;
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

  const [text, ] = useState("Sample Text");
  const [width, setWidth] = useState("640");
  const [height, setHeight] = useState("320");
  const [color, setColor] = useState("green");
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState("40")
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null);


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

  const ColorChip = styled.div`
    width: 36px;
    height: 14px;
    border-radius: 2px;
    background: ${fontColor};
  `;

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

  const handleClose = () => {
    setDisplayColorPicker(false)
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = text;
    }
  }, [text]);

  useEffect(() => {
    setColor(getRandomColor())
  }, []);

  useEffect(() => {
    const canvasContainer = document.getElementById("canvasContainer");
    if (canvasContainer) {
      canvasContainer.style.fontSize = fontSize;
      canvasContainer.style.color = fontColor;
      canvasContainer.style.backgroundColor = color;
      canvasContainer.style.width = width;
      canvasContainer.style.height = height;
    }
  }, [fontSize, fontColor, color, width, height]);

  return (
    <>
      <SketchPicker color={color} onChange={colorChange} />

      <div>
        Font Size: <input ref={inputRef} type="number" name="fontSize" value={fontSize} onChange={fontSizeChange} />
        Color:
        <Swatch onClick={ handleClick }>
          <ColorChip />
        </Swatch>
        { displayColorPicker ? <PopOver>
          <Cover onClick={ handleClose } />
          <ChromePicker color={ fontColor } onChange={ fontColorChange } />
        </PopOver> : null }

        Width: <input ref={inputRef} type="number" name="width" value={width} onChange={widthChange} />
        Height: <input ref={inputRef} type="number" name="height" value={height} onChange={heightChange} />
      </div>

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

      <button onClick={downloadImage}>이미지 다운로드</button>
      <button onClick={() => randomColor()}>Random Color</button>
    </>
  )
}

export default App
