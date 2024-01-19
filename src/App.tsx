import {useEffect, useState, useRef} from "react";
import { SketchPicker } from "react-color";
import { ChromePicker } from "react-color";
import styled from "styled-components";

function App() {

  const [text, setText] = useState("Sample Text");
  const [width, setWidth] = useState("640");
  const [height, setHeight] = useState("320");
  const [color, setColor] = useState("green");
  const [fontColor, setFontColor] = useState("#fff");
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const inputRef = useRef<any>()
  const canvasRef = useRef<any>()

  const randomImages = [
    "./assets/bg/bg-1.jpg",
    "./assets/bg/bg-2.jpg",
    "./assets/bg/bg-3.jpg",
    "./assets/bg/bg-4.jpg",
    "./assets/bg/bg-5.jpg",
  ];

  const drawCanvasImage = (imageUrl: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 이미지 객체 생성
    const img = new Image();
    img.onload = () => {
      // 이미지를 캔버스에 그립니다.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageUrl;
  };

  const handleRandomImage = () => {
    // 배열에서 랜덤 이미지 URL을 선택합니다.
    const randomIndex = Math.floor(Math.random() * randomImages.length);
    const setImageUrl = randomImages[randomIndex];

    // 캔버스에 랜덤 이미지를 그리는 함수 호출
    drawCanvasImage(setImageUrl);
  };

  const textChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  }

  const widthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(e.target.value)
  }

  const heightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(e.target.value)
  }

  const colorChange = (color: any) => {
    setColor(color.hex)
  }

  const fontColorChange = (color: any) => {
    setFontColor(color.hex)
  }

  const getRandomColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  };

  const randomColor = () => {
    setColor(getRandomColor())
  }

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');

    // 브라우저에 링크 생성
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'banner-sample.png';
    link.click();
  };

  const inputFocus = () => {
    inputRef.current.focus()
  }

  const handleClick = () => {
    setDisplayColorPicker(true)
  };

  const handleClose = () => {
    setDisplayColorPicker(false)
  };

  const ColorChip = styled.div`
    width: 36px;
    height: 14px;
    border-radius: 2px;
    background: ${fontColor};
  `;

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

  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = color;
    // 이미지 객체 생성
    const img = new Image();
    img.onload = () => {
      // 이미지를 캔버스에 그립니다.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageUrl;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "40px Arial";
    ctx.fillStyle = fontColor;

    ctx.textAlign = "center";    // 가로 가운데 정렬
    ctx.textBaseline = "middle"; // 세로 가운데 정렬

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  }, [fontColor, color, text, width, height, imageUrl]);

  useEffect(() => {
    setColor(getRandomColor())
  }, []);

  return (
    <>
      <SketchPicker color={color} onChange={colorChange} />

      <Swatch onClick={ handleClick }>
        <ColorChip />
      </Swatch>
      { displayColorPicker ? <PopOver>
        <Cover onClick={ handleClose } />
        <ChromePicker color={ fontColor } onChange={ fontColorChange } />
      </PopOver> : null }

      Width: <input ref={inputRef} type="number" name="width" onChange={widthChange} />
      Height: <input ref={inputRef} type="number" name="height" onChange={heightChange} />
      Content: <input ref={inputRef} type="text" name="content" onChange={textChange} />
      <div onClick={() => inputFocus()}>
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
      <button onClick={downloadImage}>이미지 다운로드</button>
      <button onClick={() => randomColor()}>Random Color</button>
      <button onClick={handleRandomImage}>랜덤 배경 이미지 추가</button>
    </>
  )
}

export default App
