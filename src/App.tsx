import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  useEffect(() => {
    const instance = videoRef.current;
    // 모델 로드
    const loadModels = async () => {
      // await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    };

    // 카메라 설정 및 비디오 스트림 시작
    const startVideo = async () => {
      await loadModels();

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode } })
          .then((stream) => {
            if (instance) {
              instance.srcObject = stream;
            }
          })
          .catch((error) => {
            console.error("Cannot access camera", error);
          });
      }
    };

    startVideo();

    return () => {
      if (instance && instance.srcObject) {
        (instance.srcObject as MediaStream).getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [facingMode]);

  // 얼굴 인식 및 캔버스에 렌더링
  const handleVideoOnPlay = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
      }, 100);
    }
  };

  // 카메라 전환
  const toggleCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  return (
    <div className="App">
      <video ref={videoRef} autoPlay onPlay={handleVideoOnPlay} />
      <canvas ref={canvasRef} />
      <button onClick={toggleCamera}>Toggle Camera</button>
    </div>
  );
}

export default App;
