import { useEffect, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export const usePoseLandmarker = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let landmarker = null;

    const initializeAI = async () => {
      try {
        console.log("Loading MediaPipe WASM...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.55,
          minPosePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55
        });

        setPoseLandmarker(landmarker);
        setIsLoaded(true);
        console.log("MediaPipe Model Loaded Successfully!");
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
      }
    };

    initializeAI();

    return () => {
      if (landmarker) {
        landmarker.close();
      }
    };
  }, []);

  return { poseLandmarker, isLoaded };
};