import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  useEffect(() => {
    const instance = videoRef.current;
    // 모델 로드
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      } catch (e) {
        console.log('모델 불러올 때 에러 발생')
        console.error(e);
      }
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
    const canvas = faceapi.createCanvasFromMedia(video!);
    document.body.append(canvas);
    if (video && canvas) {
      const displaySize = { width: 1000, height: 1000};
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }, 100);
    }
  };

  // 카메라 전환
  const toggleCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  return (
    <div className="App">
      <video ref={videoRef} onPlay={handleVideoOnPlay} muted autoPlay playsInline/>
      <button onClick={toggleCamera}>Toggle Camera</button>
    </div>
  );
}

export default App;
