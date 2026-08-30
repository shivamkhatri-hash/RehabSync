import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { API_URL, CV_API_URL } from '../config';
import * as standardTracker from '../games/standardTracker';
import * as zenBloom from '../games/zenBloom';
import * as flappyRehab from '../games/flappyRehab';
import * as rehabRunner from '../games/rehabRunner';
import * as mannequinTracker from '../games/mannequinTracker';
import * as shadowMatch from '../games/shadowMatch';

const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

const EXERCISE_REFS = {
  'Bicep Curl': {
    joints: 'Elbow Joint',
    desc: 'Elbow flexion training targeting the biceps brachii.',
    guidance: 'Keep your upper arm horizontal at shoulder height. Bend elbow to 90 degrees.',
    tip: 'Face the camera and avoid dropping your upper arm below shoulder level.'
  },
  'Push-up': {
    joints: 'Elbow & Shoulder',
    desc: 'Upper body pushing movement targeting chest and triceps.',
    guidance: 'Keep your torso straight and lower your chest until elbows bend to 90°.',
    tip: 'Maintain a tight core and prevent your hips from sagging.'
  },
  'Crunch': {
    joints: 'Thoracic / Core',
    desc: 'Abdominal contraction targeting rectus abdominis.',
    guidance: 'Lie on your back, knees bent, and raise your upper trunk towards your knees.',
    tip: 'Do not pull your neck with your hands. Focus on core contractions.'
  },
  'Seated Knee Extension': {
    joints: 'Knee Joint',
    desc: 'Quadriceps strength training for active knee extension.',
    guidance: 'Sit upright and slowly straighten your knee completely to full extension.',
    tip: 'Use a side view showing your hip, knee, and ankle clearly.'
  },
  'Straight Leg Raise': {
    joints: 'Hip & Knee',
    desc: 'Hip flexor and quadriceps rehab with straight leg elevation.',
    guidance: 'Lie flat, keep the target leg fully straight, and raise it 45 degrees.',
    tip: 'Ensure the knee does not bend during the lift.'
  },
  'Mini Squat': {
    joints: 'Knee & Hip',
    desc: 'Functional partial squat training targeting quads and glutes.',
    guidance: 'Lower your hips slightly as if sitting down, keeping knees behind toes.',
    tip: 'Align the camera to capture a side profile of your lower body.'
  },
  'Sit-to-Stand': {
    joints: 'Full Lower Body',
    desc: 'Functional mobility training transferring from seated to standing.',
    guidance: 'Stand up fully from a chair and sit back down slowly with control.',
    tip: 'Do not use your arms to push off if you are building pure leg strength.'
  },
  'Standing Knee Flexion': {
    joints: 'Knee / Hamstring',
    desc: 'Knee flexion stretching targeting the hamstring muscle group.',
    guidance: 'Stand tall and bend your knee backwards, bringing your heel towards your glutes.',
    tip: 'Keep your thighs parallel to each other during the flexion.'
  },
  'Standing Hip Abduction': {
    joints: 'Hip Joint',
    desc: 'Lateral hip extension targeting gluteus medius strength.',
    guidance: 'Stand tall and raise the target leg sideways away from the body.',
    tip: 'Keep your trunk vertical; avoid leaning to the opposite side.'
  },
  'Standing Hip Flexion': {
    joints: 'Hip Joint',
    desc: 'Anterior hip elevation targeting hip flexors.',
    guidance: 'Stand straight and raise your knee forward to a 90-degree angle.',
    tip: 'Keep your standing leg fully straight and active.'
  },
  'Shoulder Flexion': {
    joints: 'Shoulder Joint',
    desc: 'Anterior shoulder mobility lift targeting deltoids.',
    guidance: 'Slowly raise your arm straight forward and upward overhead.',
    tip: 'Maintain a side-view profile relative to the camera.'
  },
  'Shoulder Abduction': {
    joints: 'Shoulder Joint',
    desc: 'Lateral shoulder mobility lift targeting middle deltoids.',
    guidance: 'Raise your arm straight out to the side until it is parallel to the ground.',
    tip: 'Face the camera directly with both shoulders visible.'
  },
  'Wall Slides': {
    joints: 'Shoulders & Upper Back',
    desc: 'Scapular stability training sliding arms against vertical surface.',
    guidance: 'Keep your back and arms flat against the wall, sliding elbows upward.',
    tip: 'Keep both shoulder blades pinned to the surface to optimize scapular glide.'
  },
  'Calf Raise': {
    joints: 'Ankle / Calf',
    desc: 'Ankle plantarflexion training targeting gastrocnemius.',
    guidance: 'Stand tall and raise up onto the balls of your feet, lifting heels high.',
    tip: 'Lower down slowly to engage eccentric calf control.'
  },
  'Marching in Place': {
    joints: 'Full Lower Body',
    desc: 'Rhythmic gait and balance coordination training.',
    guidance: 'Alternate raising each knee to hip level in a steady marching rhythm.',
    tip: 'Keep the chest upright and pump arms lightly for balance.'
  },
  'Single-Leg Balance': {
    joints: 'Ankle & Hip Core',
    desc: 'Proprioceptive balance training on a single limb.',
    guidance: 'Raise one foot off the ground and maintain a steady standing posture.',
    tip: 'Focus your gaze on a fixed point ahead to stabilize balance.'
  },
  'Bird Dog': {
    joints: 'Core & Spine',
    desc: 'Contralateral limb extensions for core and spinal stability.',
    guidance: 'On all fours, extend one arm forward and the opposite leg straight back.',
    tip: 'Keep your neck neutral and your hips square to the ground.'
  },
  'Squat': {
    joints: 'Knees, Hips & Glutes',
    desc: 'Standard deep squat for lower body strength and range of motion.',
    guidance: 'Lower hips backward while bending knees to a target flexion angle.',
    tip: 'Keep your weight in your heels and your chest proud.'
  },
  'Lunge': {
    joints: 'Hips & Knees',
    desc: 'Unilateral forward stepping leg rehabilitation.',
    guidance: 'Step forward and lower hips until your back knee almost touches the floor.',
    tip: 'Ensure your front knee does not overshoot your ankle.'
  }
};

const SYSTEM_DEFAULT_EXERCISES = [
  { exerciseName: 'Bicep Curl', successAngle: 85, failureAngle: 150, holdTime: 0, targetReps: 15 },
  { exerciseName: 'Push-up', successAngle: 105, failureAngle: 155, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Crunch', successAngle: 80, failureAngle: 115, holdTime: 2, targetReps: 12 },
  { exerciseName: 'Seated Knee Extension', successAngle: 160, failureAngle: 105, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Straight Leg Raise', successAngle: 115, failureAngle: 165, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Mini Squat', successAngle: 125, failureAngle: 165, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Sit-to-Stand', successAngle: 160, failureAngle: 105, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Standing Knee Flexion', successAngle: 100, failureAngle: 165, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Standing Hip Abduction', successAngle: 0.28, failureAngle: 0.05, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Standing Hip Flexion', successAngle: 115, failureAngle: 165, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Shoulder Flexion', successAngle: 105, failureAngle: 20, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Shoulder Abduction', successAngle: 95, failureAngle: 20, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Wall Slides', successAngle: 100, failureAngle: 25, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Calf Raise', successAngle: 0.07, failureAngle: 0.025, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Marching in Place', successAngle: 120, failureAngle: 160, holdTime: 0, targetReps: 15 },
  { exerciseName: 'Single-Leg Balance', successAngle: 0.10, failureAngle: 0.02, holdTime: 5, targetReps: 5 },
  { exerciseName: 'Bird Dog', successAngle: 0.80, failureAngle: 0.45, holdTime: 5, targetReps: 5 },
  { exerciseName: 'Squat', successAngle: 100, failureAngle: 165, holdTime: 0, targetReps: 10 },
  { exerciseName: 'Lunge', successAngle: 105, failureAngle: 160, holdTime: 0, targetReps: 10 }
];

const getTorsoAngle = (shoulder, hip) => {
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
};

const normalizeKey = (name) => {
  return name.trim().toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ').replace(/\s+/g, '_');
};

const OFFLINE_EXERCISE_SPECS = {
  "seated_knee_extension": {
    landmark_sets: [[23, 25, 27], [24, 26, 28]],
    bilateral: false,
    target_direction: "increase",
    camera_guidance: "Sit side-on at 30-45 degrees with hip, knee, and ankle visible."
  },
  "straight_leg_raise": {
    landmark_sets: [[11, 23, 25], [12, 24, 26]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Use a side view and keep shoulder, hip, knee, and ankle visible."
  },
  "mini_squat": {
    landmark_sets: [[23, 25, 27, 24, 26, 28, 11, 12]],
    bilateral: true,
    target_direction: "decrease",
    camera_guidance: "Face the camera at a slight angle with both legs fully visible."
  },
  "sit_to_stand": {
    landmark_sets: [[11, 12, 23, 24, 25, 26, 27, 28]],
    bilateral: true,
    target_direction: "increase",
    camera_guidance: "Place the camera side-front so the chair, hips, knees, and ankles are visible."
  },
  "standing_knee_flexion": {
    landmark_sets: [[23, 25, 27], [24, 26, 28]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Stand side-on with the working hip, knee, and ankle visible."
  },
  "standing_hip_abduction": {
    landmark_sets: [[23, 25, 27], [24, 26, 28]],
    bilateral: false,
    target_direction: "increase",
    camera_guidance: "Face the camera with both hips and the working leg visible."
  },
  "standing_hip_flexion": {
    landmark_sets: [[11, 23, 25], [12, 24, 26]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Use a side view with shoulder, hip, knee, and ankle visible."
  },
  "shoulder_flexion": {
    landmark_sets: [[23, 11, 13], [24, 12, 14]],
    bilateral: false,
    target_direction: "increase",
    camera_guidance: "Use a side view with hip, shoulder, elbow, and wrist visible."
  },
  "shoulder_abduction": {
    landmark_sets: [[23, 11, 13], [24, 12, 14]],
    bilateral: false,
    target_direction: "increase",
    camera_guidance: "Face the camera with hip, shoulder, elbow, and wrist visible."
  },
  "bicep_curl": {
    landmark_sets: [[11, 13, 15], [12, 14, 16]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Raise your upper arm horizontally to shoulder level and face the camera."
  },
  "bicep_curl_shoulder": {
    landmark_sets: [[23, 11, 13], [24, 12, 14]],
    bilateral: false,
    target_direction: "increase",
    camera_guidance: "Face the camera or sit side-on with hip, shoulder, elbow, and wrist visible."
  },
  "wall_slides": {
    landmark_sets: [[23, 24, 11, 12, 13, 14, 15, 16]],
    bilateral: true,
    target_direction: "increase",
    camera_guidance: "Face the camera with both arms, shoulders, and hips visible."
  },
  "calf_raise": {
    landmark_sets: [[25, 27, 29, 31], [26, 28, 30, 32]],
    bilateral: false,
    target_direction: "increase",
    camera_guidance: "Use a side view and include knee, ankle, heel, and toes."
  },
  "marching_in_place": {
    landmark_sets: [[11, 12, 23, 24, 25, 26, 27, 28]],
    bilateral: true,
    target_direction: "decrease",
    camera_guidance: "Face the camera at a slight angle with both legs visible."
  },
  "single_leg_balance": {
    landmark_sets: [[11, 12, 23, 24, 25, 26, 27, 28]],
    bilateral: true,
    target_direction: "increase",
    camera_guidance: "Face the camera with your whole body and both feet visible."
  },
  "bird_dog": {
    landmark_sets: [[11, 12, 15, 16, 23, 24, 27, 28]],
    bilateral: true,
    target_direction: "increase",
    camera_guidance: "Use a side-front view with both wrists, hips, and ankles visible."
  },
  "push_up": {
    landmark_sets: [[11, 13, 15], [12, 14, 16]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Use a side view with the full body visible."
  },
  "squat": {
    landmark_sets: [[23, 25, 27], [24, 26, 28]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Use a side-front full-body view."
  },
  "lunge": {
    landmark_sets: [[23, 25, 27], [24, 26, 28]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Use a 30-45 degree view with both legs visible."
  },
  "crunch": {
    landmark_sets: [[11, 23, 25], [12, 24, 26]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Use a side view with shoulder, hip, and knee visible."
  }
};

const fetchExerciseSpecs = async (exerciseName) => {
  const normKey = normalizeKey(exerciseName);
  try {
    const response = await fetch(`${CV_API_URL}/api/exercises/${encodeURIComponent(exerciseName)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        landmark_sets: data.landmark_sets,
        bilateral: data.bilateral,
        target_direction: data.target_direction,
        camera_guidance: data.camera_guidance
      };
    }
  } catch (err) {
    console.warn("CV Service offline. Using offline spec fallback.");
  }
  return OFFLINE_EXERCISE_SPECS[normKey] || {
    landmark_sets: [[11, 13, 15], [12, 14, 16]],
    bilateral: false,
    target_direction: "decrease",
    camera_guidance: "Keep the required joints visible in the frame."
  };
};

const getRecommendedGameMode = (exercise) => {
  if (!exercise) return 'standard';
  const name = exercise.name.toLowerCase();
  
  if (exercise.holdTime > 0 || name.includes('balance') || name.includes('bird dog') || name.includes('hold') || name.includes('stretch')) {
    return 'zen'; // Zen Garden procedural plant growing for holds
  }
  if (name.includes('squat') || name.includes('stand') || name.includes('calf') || name.includes('abduction') || name.includes('march') || name.includes('jump')) {
    return 'runner'; // Runner jumps for standing/bilateral/squat exercises
  }
  if (name.includes('curl') || name.includes('flexion') || name.includes('extension') || name.includes('raise') || name.includes('push') || name.includes('slide')) {
    return 'flappy'; // Flappy flight for unilateral flexion/extensions
  }
  return 'standard';
};

export default function PatientView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('dashboard'); // 'dashboard' or 'scanner'
  const [gameMode, setGameMode] = useState('standard'); // 'standard', 'zen', 'flappy', 'runner'
  const [isMuted, setIsMuted] = useState(false);
  const [selectedArm, setSelectedArm] = useState('left'); // 'left' or 'right'
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const { poseLandmarker, isLoaded } = usePoseLandmarker();
  const [cameraActive, setCameraActive] = useState(false);
  
  const [armAngle, setArmAngle] = useState(0);
  const [prescribedExercises, setPrescribedExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [reps, setReps] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimeLeft, setHoldTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'workout', 'stats', 'quests'
  const [sessions, setSessions] = useState([]);
  
  const isDownRef = useRef(false);
  const repsRef = useRef(0);
  const totalFramesRef = useRef(0);
  const validFramesRef = useRef(0);
  const lastRepTime = useRef(0);
  const holdStartRef = useRef(null);
  const hasCountedRepRef = useRef(false);
  const lastSpokenRef = useRef(0);
  const lastPostureSpokenRef = useRef(0);
  
  // Game state representation stored in refs to prevent React state update lag in loop
  const gameStateRef = useRef({
    bloomPercentage: 0,
    flowers: [],
    plantHeight: 30,
    flappyY: 240,
    flappyScore: 0,
    gates: [],
    frameIndex: 0,
    runnerLane: 1, // 0: Left, 1: Center, 2: Right
    runnerY: 0,
    runnerJumpVelocity: 0,
    runnerScore: 0,
    obstacles: [],
    runnerCoins: [],
    laneWidth: 160
  });

  // TTS Speech Synthesizer
  const speakText = (text) => {
    if (isMuted) return;
    const now = Date.now();
    if (now - lastSpokenRef.current < 2000) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = now;
  };

  const speakPostureAlert = (text) => {
    if (isMuted) return;
    const now = Date.now();
    if (now - lastPostureSpokenRef.current < 4500) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    lastPostureSpokenRef.current = now;
  };

  // 1. Fetch User Profile, Doctor Prescriptions and Workout Sessions
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'patient') {
      navigate('/');
      return;
    }
    setUser(storedUser);

    const loadExerciseData = async () => {
      try {
        const prescrRes = await fetch(`${API_URL}/api/prescriptions/patient/${storedUser.id}`);
        let prescribedExList = [];
        if (prescrRes.ok) {
          const prescrData = await prescrRes.json();
          if (prescrData && prescrData.exercises && prescrData.exercises.length > 0) {
            prescribedExList = prescrData.exercises;
          }
        }
        
        // Combine: prescribed exercises first, then defaults that are not prescribed
        const combinedList = [];
        const prescribedNames = new Set(prescribedExList.map(e => e.exerciseName.toLowerCase()));

        prescribedExList.forEach(e => {
          combinedList.push({
            ...e,
            isPrescribed: true
          });
        });

        SYSTEM_DEFAULT_EXERCISES.forEach(e => {
          if (!prescribedNames.has(e.exerciseName.toLowerCase())) {
            combinedList.push({
              ...e,
              isPrescribed: false
            });
          }
        });

        const enriched = await Promise.all(combinedList.map(async (ex) => {
          const specs = await fetchExerciseSpecs(ex.exerciseName);
          return {
            name: ex.exerciseName,
            success_angle: ex.successAngle,
            failure_angle: ex.failureAngle,
            holdTime: ex.holdTime,
            targetReps: ex.targetReps,
            isPrescribed: ex.isPrescribed,
            ...specs
          };
        }));

        setPrescribedExercises(enriched);
        const initialEx = enriched[0];
        setCurrentExercise(initialEx);
        if (initialEx) {
          setGameMode(getRecommendedGameMode(initialEx));
        }

        // Fetch session logs
        const sessionsRes = await fetch(`${API_URL}/api/sessions/patient/${storedUser.id}`);
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData);
        }
      } catch (err) {
        console.error("Failed to load exercises:", err);
      }
    };
    loadExerciseData();
  }, [navigate]);

  // 2. Camera Processing & Canvas Gaming loop (Activated during 'scanner')
  useEffect(() => {
    if (mode !== 'scanner' || !isLoaded || !currentExercise) return;

    let animationFrameId;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraActive(true);
          };
        }
      } catch (err) {
        alert("Webcam stream access is required for AI gaming tracker.");
        setMode('dashboard');
      }
    };

    startCamera();

    // Reset loop game values dynamically based on selected game mode
    if (gameMode === 'zen') {
      gameStateRef.current = { ...gameStateRef.current, ...zenBloom.init() };
    } else if (gameMode === 'flappy') {
      gameStateRef.current = { ...gameStateRef.current, ...flappyRehab.init() };
    } else if (gameMode === 'runner') {
      gameStateRef.current = { ...gameStateRef.current, ...rehabRunner.init() };
    } else if (gameMode === 'mannequin') {
      gameStateRef.current = { ...gameStateRef.current, ...mannequinTracker.init() };
    } else if (gameMode === 'shadow') {
      gameStateRef.current = { ...gameStateRef.current, ...shadowMatch.init() };
    }
    
    repsRef.current = 0;
    setReps(0);
    holdStartRef.current = null;
    hasCountedRepRef.current = false;
    totalFramesRef.current = 0;
    validFramesRef.current = 0;

    const renderLoop = () => {
      if (poseLandmarker && videoRef.current?.readyState >= 2 && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = 640;
        canvas.height = 480;

        const startTimeMs = performance.now();
        const results = poseLandmarker.detectForVideo(video, startTimeMs);

        // Core joint angle calculation
        let liveAngleVal = 0;
        let isSuccessZone = false;
        let isResetZone = false;
        let detectedLandmarks = null;
        let isPostureInvalid = false;
        let postureAlert = "";

        // Resolve target joints dynamically based on chosen side selection and configuration
        let resolvedJoints = [];
        if (currentExercise.bilateral || currentExercise.landmark_sets.length === 1) {
          resolvedJoints = currentExercise.landmark_sets[0];
        } else {
          resolvedJoints = selectedArm === 'right' ? currentExercise.landmark_sets[1] : currentExercise.landmark_sets[0];
        }

        if (results.landmarks && results.landmarks.length > 0) {
          detectedLandmarks = results.landmarks[0];
          const [j1, j2, j3] = resolvedJoints;
          const pt1 = detectedLandmarks[j1];
          const pt2 = detectedLandmarks[j2];
          const pt3 = detectedLandmarks[j3];

          if (pt1 && pt2 && pt3 && pt1.visibility > 0.60 && pt2.visibility > 0.60 && pt3.visibility > 0.60) {
            const angle = calculateAngle(pt1, pt2, pt3);
            liveAngleVal = Math.round(angle);
            setArmAngle(liveAngleVal);

            // Flexion vs Extension evaluation directions dynamically using target_direction
            const success = currentExercise.success_angle;
            const failure = currentExercise.failure_angle;
            const direction = currentExercise.target_direction || (success > failure ? 'increase' : 'decrease');
            
            if (direction === 'increase') {
              isSuccessZone = angle >= success;
              isResetZone = angle <= failure;
            } else {
              isSuccessZone = angle <= success;
              isResetZone = angle >= failure;
            }

            // Posture Form Validation Check
            const nameKey = normalizeKey(currentExercise.name);
            if (nameKey.includes("bicep")) {
              const hip = detectedLandmarks[selectedArm === 'right' ? 24 : 23];
              const shoulder = detectedLandmarks[selectedArm === 'right' ? 12 : 11];
              const elbow = detectedLandmarks[selectedArm === 'right' ? 14 : 13];
              const wrist = detectedLandmarks[selectedArm === 'right' ? 16 : 15];
              
              if (hip && shoulder && elbow && hip.visibility > 0.50 && shoulder.visibility > 0.50 && elbow.visibility > 0.50) {
                const torsoAngle = getTorsoAngle(shoulder, hip);

                if (torsoAngle > 25) {
                  isPostureInvalid = true;
                  postureAlert = "Keep your body straight!";
                } else if (nameKey.includes("shoulder")) {
                  if (wrist && wrist.visibility > 0.50) {
                    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
                    if (Math.abs(elbowAngle - 90) > 15) {
                      isPostureInvalid = true;
                      postureAlert = "Keep your elbow at 90 degrees!";
                    }
                  }
                } else {
                  const armSwingAngle = calculateAngle(hip, shoulder, elbow);
                  if (armSwingAngle < 70 || armSwingAngle > 110) {
                    isPostureInvalid = true;
                    postureAlert = "Keep your upper arm horizontal!";
                  }
                }
              }
            } else {
              // Generic straight torso check for other exercises
              const hip = detectedLandmarks[selectedArm === 'right' ? 24 : 23];
              const shoulder = detectedLandmarks[selectedArm === 'right' ? 12 : 11];
              if (hip && shoulder && hip.visibility > 0.50 && shoulder.visibility > 0.50) {
                const torsoAngle = getTorsoAngle(shoulder, hip);
                if (torsoAngle > 30) {
                  isPostureInvalid = true;
                  postureAlert = "Keep your body straight!";
                }
              }
            }

            if (isPostureInvalid) {
              isSuccessZone = false; // Block target angle matches if posture is incorrect
              speakPostureAlert(postureAlert);
            }

            // Rep and Hold Time logic
            if (isSuccessZone) {
              if (!holdStartRef.current) {
                holdStartRef.current = Date.now();
                setIsHolding(true);
                if (currentExercise.holdTime > 0) {
                  speakText("Hold it!");
                }
              } else {
                const heldSec = (Date.now() - holdStartRef.current) / 1000;
                const remaining = Math.max(0, currentExercise.holdTime - heldSec);
                setHoldTimeLeft(Math.round(remaining));
                
                // Track visual progression
                gameStateRef.current.bloomPercentage = Math.min(100, (heldSec / (currentExercise.holdTime || 1)) * 100);

                if (heldSec >= (currentExercise.holdTime || 0)) {
                  if (!hasCountedRepRef.current) {
                    if (gameMode !== 'flappy') {
                      repsRef.current += 1;
                      setReps(repsRef.current);
                      speakText(`Rep ${repsRef.current} counted.`);
                    }
                    hasCountedRepRef.current = true;

                    // Trigger action triggers in specific games
                    if (gameMode === 'zen') {
                      gameStateRef.current.flowers.push({
                        x: canvas.width / 2 + (Math.random() * 120 - 60),
                        y: canvas.height - gameStateRef.current.plantHeight + (Math.random() * 40 - 20),
                        color: `hsl(${Math.random() * 90 + 320}, 90%, 65%)`,
                        scale: 0.1
                      });
                      gameStateRef.current.plantHeight += 12;
                    } else if (gameMode === 'runner') {
                      if (gameStateRef.current.runnerY === 0) {
                        gameStateRef.current.runnerJumpVelocity = 11;
                      }
                    }
                  }
                }
              }
            } else if (isResetZone) {
              holdStartRef.current = null;
              setIsHolding(false);
              setHoldTimeLeft(currentExercise.holdTime || 0);
              hasCountedRepRef.current = false;
              gameStateRef.current.bloomPercentage = 0;
            }
          }
          
          totalFramesRef.current += 1;
          if (!isPostureInvalid) {
            validFramesRef.current += 1;
          }
        }

        // --- GRAPHICS LAYER RENDERING ---
        
        // 1. Draw to the Camera Form Check canvas if visible (i.e. we are in gameMode !== 'standard')
        if (gameMode !== 'standard' && cameraCanvasRef.current) {
          const camCanvas = cameraCanvasRef.current;
          const ctxCam = camCanvas.getContext('2d');
          camCanvas.width = 640;
          camCanvas.height = 480;
          
          standardTracker.draw(ctxCam, camCanvas, {
            video,
            detectedLandmarks,
            resolvedJoints,
            isHolding,
            isPostureInvalid,
            postureAlert
          });
        }

        // 2. Draw to the main canvas (either standard tracker or active game screen)
        if (canvasRef.current) {
          const gameCanvas = canvasRef.current;
          const ctxGame = gameCanvas.getContext('2d');
          gameCanvas.width = 640;
          gameCanvas.height = 480;

          if (gameMode === 'standard') {
            standardTracker.draw(ctxGame, gameCanvas, {
              video,
              detectedLandmarks,
              resolvedJoints,
              isHolding,
              isPostureInvalid,
              postureAlert
            });
          } 
          
          else if (gameMode === 'zen') {
            zenBloom.draw(ctxGame, gameCanvas, gameStateRef.current, {
              video: null, // Disable mini camera inside game view to prevent duplication
              isHolding
            });
          } 
          
          else if (gameMode === 'flappy') {
            flappyRehab.draw(ctxGame, gameCanvas, gameStateRef.current, {
              video: null, // Disable mini camera inside game view to prevent duplication
              liveAngleVal,
              currentExercise,
              speakText,
              repsRef,
              setReps
            });
          }
          
          else if (gameMode === 'runner') {
            rehabRunner.draw(ctxGame, gameCanvas, gameStateRef.current, {
              video: null, // Disable mini camera inside game view to prevent duplication
              detectedLandmarks,
              speakText,
              currentExercise,
              selectedArm,
              liveAngleVal
            });
          }

          else if (gameMode === 'mannequin') {
            mannequinTracker.draw(ctxGame, gameCanvas, gameStateRef.current, {
              detectedLandmarks,
              resolvedJoints,
              isHolding,
              isPostureInvalid,
              postureAlert,
              liveAngleVal,
              currentExercise,
              selectedArm
            });
          }

          else if (gameMode === 'shadow') {
            shadowMatch.draw(ctxGame, gameCanvas, gameStateRef.current, {
              detectedLandmarks,
              resolvedJoints,
              isHolding,
              isPostureInvalid,
              postureAlert,
              liveAngleVal,
              currentExercise,
              repsRef,
              setReps
            });
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const canvas = canvasRef.current;
    const handleDown = (e) => {
      if (gameMode !== 'mannequin') return;
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

      if (clickX >= 20 && clickX <= 100 && clickY >= 435 && clickY <= 457) {
        gameStateRef.current.rotationY = 0;
        gameStateRef.current.isDragging = false;
        return;
      }

      gameStateRef.current.isDragging = true;
      gameStateRef.current.startX = e.clientX;
      gameStateRef.current.startRotation = gameStateRef.current.rotationY;
    };
    const handleMove = (e) => {
      if (gameMode !== 'mannequin' || !gameStateRef.current.isDragging) return;
      const deltaX = e.clientX - gameStateRef.current.startX;
      gameStateRef.current.rotationY = gameStateRef.current.startRotation + deltaX * 0.012;
    };
    const handleUp = () => {
      if (gameMode !== 'mannequin') return;
      gameStateRef.current.isDragging = false;
    };
    const handleTouchStart = (e) => {
      if (gameMode !== 'mannequin' || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.touches[0].clientX - rect.left) / rect.width) * canvas.width;
      const clickY = ((e.touches[0].clientY - rect.top) / rect.height) * canvas.height;

      if (clickX >= 20 && clickX <= 100 && clickY >= 435 && clickY <= 457) {
        gameStateRef.current.rotationY = 0;
        gameStateRef.current.isDragging = false;
        return;
      }

      gameStateRef.current.isDragging = true;
      gameStateRef.current.startX = e.touches[0].clientX;
      gameStateRef.current.startRotation = gameStateRef.current.rotationY;
    };
    const handleTouchMove = (e) => {
      if (gameMode !== 'mannequin' || !gameStateRef.current.isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - gameStateRef.current.startX;
      gameStateRef.current.rotationY = gameStateRef.current.startRotation + deltaX * 0.012;
    };

    if (canvas && gameMode === 'mannequin') {
      canvas.addEventListener('mousedown', handleDown);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      canvas.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleUp);
    }

    if (cameraActive) renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      // Only stop webcam tracks if camera is turned off or leaving scanner page
      if (videoRef.current && videoRef.current.srcObject && (!cameraActive || mode !== 'scanner')) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (canvas) {
        canvas.removeEventListener('mousedown', handleDown);
        canvas.removeEventListener('touchstart', handleTouchStart);
      }
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [mode, cameraActive, poseLandmarker, currentExercise, isLoaded, gameMode, isMuted]);

  // 3. Save Workout Session to Backend
  const handleSaveSession = async () => {
    try {
      const modeNames = {
        standard: 'Standard Tracker',
        zen: 'Zen Bloom Garden',
        flappy: 'Flappy Rehab Flight',
        runner: 'Rehab Runner Dash'
      };

      const totalF = totalFramesRef.current;
      const validF = validFramesRef.current;
      const successRateCalc = totalF > 0 ? Math.round((validF / totalF) * 100) : 100;

      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          exerciseName: currentExercise.name,
          reps_completed: reps,
          max_angle_achieved: armAngle,
          gamePlayed: modeNames[gameMode],
          hold_time_achieved: currentExercise.holdTime || 0,
          success_rate: successRateCalc
        })
      });
      if (response.ok) {
        alert("✅ Session details successfully recorded for your doctor's review!");
        
        // Refresh session logs to update stats instantly
        const sessionsRes = await fetch(`${API_URL}/api/sessions/patient/${user.id}`);
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData);
        }

        setMode('dashboard');
        setReps(0);
        repsRef.current = 0;
      } else {
        throw new Error("API responded with error code.");
      }
    } catch (err) {
      alert("Error saving workout log: " + err.message);
    }
  };

  if (!user) return null;

  // Split exercises into prescribed vs. general practice library
  const doctorPrescribed = prescribedExercises.filter(ex => ex.isPrescribed);
  const generalPractice = prescribedExercises.filter(ex => !ex.isPrescribed);

  // --- VIEW 1: PATIENT DASHBOARD VIEW ---
  if (mode === 'dashboard') {
    // Dynamic XP Calculations
    const totalReps = sessions.reduce((acc, curr) => acc + (curr.reps_completed || 0), 0);
    const totalHolds = sessions.reduce((acc, curr) => acc + (curr.hold_time_achieved || 0), 0);
    const totalSessions = sessions.length;
    const totalXP = (totalReps * 10) + (totalHolds * 5) + (totalSessions * 50);
    
    // Level scaling: 250 XP per level
    const currentLevel = Math.floor(totalXP / 250) + 1;
    const xpRemaining = totalXP % 250;
    const xpProgress = (xpRemaining / 250) * 100;
    const xpNeeded = 250 - xpRemaining;

    // Avg form accuracy
    const avgSuccessRate = totalSessions > 0
      ? Math.round(sessions.reduce((acc, curr) => acc + (curr.success_rate || 100), 0) / totalSessions)
      : 100;

    // Badges array
    const achievements = [
      { id: 'first_step', name: 'First Flight', desc: 'Complete your first virtual game session', unlocked: totalSessions >= 1, icon: '🚀', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
      { id: 'rom_champ', name: 'Perfect Form', desc: 'Achieve 100% accuracy in any exercise session', unlocked: sessions.some(s => s.success_rate === 100), icon: '🎯', color: 'text-amber-700 bg-amber-50 border-amber-200' },
      { id: 'hold_titan', name: 'Zen Master', desc: 'Perform a static hold session in Zen Bloom', unlocked: totalHolds > 0, icon: '🌸', color: 'text-pink-700 bg-pink-50 border-pink-200' },
      { id: 'centurion', name: 'Motion Adept', desc: 'Complete 30+ total exercise reps', unlocked: totalReps >= 30, icon: '⚡', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' }
    ];

    // Local simulated leaderboard (updates dynamic ranking based on XP)
    const mockLeaderboard = [
      { rank: 1, name: 'Chloe Bennett', xp: 750, level: 4, avatar: '🙋‍♀️' },
      { rank: 2, name: `${user.name} (You)`, xp: totalXP, level: currentLevel, avatar: '👤', isPlayer: true },
      { rank: 3, name: 'Ethan Walker', xp: 320, level: 2, avatar: '🙋‍♂️' },
      { rank: 4, name: 'Mason Cox', xp: 120, level: 1, avatar: '👶' }
    ].sort((a, b) => b.xp - a.xp);

    // Re-assign ranks after sorting
    mockLeaderboard.forEach((player, idx) => {
      player.rank = idx + 1;
    });

    // Daily Quests list
    const quests = [
      { name: 'Knee Extension Power', desc: 'Complete any exercise using Flappy Flight', done: sessions.some(s => s.gamePlayed === 'Flappy Rehab Flight'), reward: '100 XP' },
      { name: 'Stamina Build-up', desc: 'Complete any session with 12+ total reps', done: sessions.some(s => s.reps_completed >= 12), reward: '75 XP' },
      { name: 'Zen Posture Hold', desc: 'Complete one Zen Bloom Garden hold session', done: sessions.some(s => s.gamePlayed === 'Zen Bloom Garden'), reward: '120 XP' }
    ];

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Patient Welcomer Header */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-widest">
                  Level {currentLevel} {totalXP > 500 ? 'Expert' : 'Rookie'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">({totalXP} Total XP)</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mt-2">Welcome back, {user.name}</h1>
              <p className="text-slate-500 mt-1">Focus Area: <span className="font-semibold text-teal-600 capitalize">{user.focusArea?.replace('_', ' ')}</span></p>
            </div>
            
            {/* Mute Voice Feedback buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                  isMuted 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                {isMuted ? '🔇 Voice Coach Off' : '🔊 Voice Coach On'}
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border border-slate-200 gap-1 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'home' 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' 
                  : 'text-slate-600 hover:text-slate-905 hover:bg-slate-200/60'
              }`}
            >
              🏠 Overview
            </button>
            <button 
              onClick={() => setActiveTab('workout')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'workout' 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' 
                  : 'text-slate-600 hover:text-slate-905 hover:bg-slate-200/60'
              }`}
            >
              🏋️‍♂️ Workout Hub
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'stats' 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' 
                  : 'text-slate-600 hover:text-slate-905 hover:bg-slate-200/60'
              }`}
            >
              📊 Stats & Achievements
            </button>
            <button 
              onClick={() => setActiveTab('quests')}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'quests' 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' 
                  : 'text-slate-600 hover:text-slate-905 hover:bg-slate-200/60'
              }`}
            >
              🏆 Quest & Leaderboard
            </button>
          </div>

          {/* TAB 0: DASHBOARD OVERVIEW */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Daily Streak & Quick Start */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Streak Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">🔥</div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Daily Streak</span>
                    <span className="text-xl font-black text-slate-800">5 Days Active</span>
                  </div>
                </div>
                
                {/* Active Level Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl">⚡</div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">XP Progress</span>
                    <span className="text-xl font-black text-slate-800">{xpRemaining} / 250 XP</span>
                  </div>
                </div>

                {/* Accuracy Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-2xl">🎯</div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Accuracy</span>
                    <span className="text-xl font-black text-slate-800">{avgSuccessRate}% Form</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: Prescription Status Card */}
                <div className="md:col-span-1 space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Active Prescription</h3>
                  
                  {prescribedExercises.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Prescribed Stretch</span>
                        <span className="font-extrabold text-slate-800 text-base">{prescribedExercises[0].name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block font-bold text-[9px] uppercase">Goal Target</span>
                          <span className="font-extrabold text-slate-800">{prescribedExercises[0].targetReps} Reps</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block font-bold text-[9px] uppercase">Hold Time</span>
                          <span className="font-extrabold text-slate-800">{prescribedExercises[0].holdTime || 0}s</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setCurrentExercise(prescribedExercises[0]);
                          setReps(0);
                          repsRef.current = 0;
                          setGameMode(getRecommendedGameMode(prescribedExercises[0]));
                          setActiveTab('workout');
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-teal-600/10"
                      >
                        🏋️‍♂️ Start Workout Now
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No active prescription found. Enjoy open practice in Workout Hub!</p>
                  )}
                </div>

                {/* Right Side: Weekly Activity Chart */}
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Weekly Repetitions Trend</h3>
                    {sessions.length > 0 ? (
                      <div className="relative h-44 w-full flex items-end justify-between px-2 pt-4">
                        {/* Grid lines */}
                        <div className="absolute inset-x-0 top-0 border-t border-slate-100 text-[8px] text-slate-350 pt-1 font-bold font-mono">15 Reps</div>
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100 text-[8px] text-slate-350 pt-1 font-bold font-mono">8 Reps</div>
                        <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 text-[8px] text-slate-350 pt-1 font-bold font-mono">0 Reps</div>
                        
                        {/* Sparkline representation */}
                        {sessions.slice(-7).reverse().map((session, i) => {
                          const repsVal = session.reps_completed || 0;
                          const heightPct = Math.min(100, (repsVal / 15) * 100);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group z-10">
                              <div className="relative w-8 bg-gradient-to-t from-teal-500 to-indigo-500 rounded-lg shadow-sm transition-all duration-500 hover:scale-105" style={{ height: `${Math.max(10, heightPct)}%` }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{repsVal} reps</span>
                              </div>
                              <span className="text-[8px] text-slate-400 font-bold font-mono uppercase tracking-wider">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                        Complete workouts to display your weekly repetition progress!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quest Checklist Preview */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Quests</h3>
                  <button onClick={() => setActiveTab('quests')} className="text-xs text-teal-600 hover:text-teal-700 font-bold">View Leaderboard &rarr;</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quests.slice(0, 2).map((quest, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center ${quest.done ? 'bg-teal-50/20 border-teal-100' : 'bg-slate-50/30 border-slate-150'}`}>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800 block">{quest.name} <span className="text-[9px] font-black text-amber-600 ml-1">+{quest.reward}</span></span>
                        <p className="text-[10px] text-slate-400 leading-tight">{quest.desc}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${quest.done ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-450'}`}>{quest.done ? '✓ Done' : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: WORKOUT HUB */}
          {activeTab === 'workout' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Exercises Prescriptions Roster */}
              <div className="md:col-span-1 space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Exercise Roster</h2>
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  
                  {/* Doctor Prescribed Section */}
                  {doctorPrescribed.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5">⭐ Doctor Prescribed</span>
                      {doctorPrescribed.map((ex, idx) => (
                        <div 
                          key={ex.name} 
                          onClick={() => {
                            setCurrentExercise(ex);
                            setReps(0);
                            repsRef.current = 0;
                            setGameMode(getRecommendedGameMode(ex));
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            currentExercise?.name === ex.name 
                              ? 'border-teal-500 bg-teal-50/50 shadow-sm' 
                              : 'border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <h3 className="font-bold text-slate-800 text-sm">{ex.name}</h3>
                          <p className="text-[11px] text-slate-500 mt-1">Target: {ex.targetReps} reps</p>
                          {ex.holdTime > 0 && <p className="text-[11px] text-indigo-600 font-bold mt-0.5">⏱ Hold: {ex.holdTime}s</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General Practice Section */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">📋 General Practice</span>
                    {generalPractice.map((ex, idx) => (
                      <div 
                        key={ex.name} 
                        onClick={() => {
                          setCurrentExercise(ex);
                          setReps(0);
                          repsRef.current = 0;
                          setGameMode(getRecommendedGameMode(ex));
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          currentExercise?.name === ex.name 
                            ? 'border-teal-500 bg-teal-50/50 shadow-sm' 
                            : 'border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <h3 className="font-bold text-slate-800 text-sm">{ex.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Target: {ex.targetReps} reps</p>
                        {ex.holdTime > 0 && <p className="text-[11px] text-indigo-600 font-bold mt-0.5">⏱ Hold: {ex.holdTime}s</p>}
                      </div>
                    ))}
                  </div>

                  {prescribedExercises.length === 0 && (
                    <p className="text-sm text-slate-400">Loading exercises...</p>
                  )}
                </div>

                {/* Active Side / Arm Selector */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Target Side</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedArm('left')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedArm === 'left' 
                          ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-900/10' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      👈 Left Side
                    </button>
                    <button 
                      onClick={() => setSelectedArm('right')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedArm === 'right' 
                          ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-900/10' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Right Side 👉
                    </button>
                  </div>
                </div>

                {/* Exercise Reference Card in Workout tab */}
                {currentExercise && (
                  <div className="border-t border-slate-100 pt-4 mt-4 text-[11px] space-y-2 text-slate-600">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Exercise Reference</span>
                    {(() => {
                      const ref = EXERCISE_REFS[currentExercise.name] || {
                        joints: 'General Body',
                        desc: 'Standard clinical range of motion rehabilitation.',
                        guidance: 'Position yourself clearly in the camera frame.',
                        tip: 'Follow the live audio coach feedback.'
                      };
                      return (
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2.5">
                          <div>
                            <span className="font-extrabold text-slate-900 block text-[8px] uppercase tracking-wider">Anatomical Target</span>
                            <span>{ref.joints}</span>
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-[8px] uppercase tracking-wider">Execution Guide</span>
                            <span className="leading-normal">{ref.guidance}</span>
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-[8px] uppercase tracking-wider">Coach Pro-Tip</span>
                            <span className="text-[9px] text-teal-700 italic">{ref.tip}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Game Mode Picker */}
              <div className="md:col-span-2 space-y-6">
                <h2 className="text-base font-extrabold text-slate-900">Select Game Interface</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                   {/* Mode Option 1: Zen Bloom */}
                   <div 
                     onClick={() => setGameMode('zen')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'zen' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 shadow-sm'
                     }`}
                   >
                     {currentExercise && getRecommendedGameMode(currentExercise) === 'zen' && (
                       <span className="absolute top-4 right-4 bg-teal-50 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-teal-200 shadow-sm animate-pulse">Recommended</span>
                     )}
                     <span className="text-3xl">🌸</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">Zen Bloom Garden</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Relaxing procedural plant grower. Focuses on patient hold timing and posture control.</p>
                   </div>
   
                   {/* Mode Option 2: Flappy Flight */}
                   <div 
                     onClick={() => setGameMode('flappy')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'flappy' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 shadow-sm'
                     }`}
                   >
                     {currentExercise && getRecommendedGameMode(currentExercise) === 'flappy' && (
                       <span className="absolute top-4 right-4 bg-teal-50 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-teal-200 shadow-sm animate-pulse">Recommended</span>
                     )}
                     <span className="text-3xl">🚀</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">Flappy Flight</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Classic gates flyer. Altitude maps directly to joint angle, encouraging range extensions.</p>
                   </div>
   
                   {/* Mode Option 3: Rehab Runner */}
                   <div 
                     onClick={() => setGameMode('runner')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'runner' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 shadow-sm'
                     }`}
                   >
                     {currentExercise && getRecommendedGameMode(currentExercise) === 'runner' && (
                       <span className="absolute top-4 right-4 bg-teal-50 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-teal-200 shadow-sm animate-pulse">Recommended</span>
                     )}
                     <span className="text-3xl">🏃‍♂️</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">Rehab Runner Dash</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Dodge obstacles by leaning shoulders laterally. Complete full reps to jump fences.</p>
                   </div>
   
                   {/* Mode Option 4: Standard Tracker */}
                   <div 
                     onClick={() => setGameMode('standard')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'standard' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 shadow-sm'
                     }`}
                   >
                     {currentExercise && getRecommendedGameMode(currentExercise) === 'standard' && (
                       <span className="absolute top-4 right-4 bg-teal-50 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-teal-200 shadow-sm animate-pulse">Recommended</span>
                     )}
                     <span className="text-3xl">🩻</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">Standard AI Skeleton</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Mirror webcam feed overlaid with digital joints. Clinical precision analysis mode.</p>
                   </div>

                   {/* Mode Option 5: 3D Hologram Mannequin */}
                   <div 
                     onClick={() => setGameMode('mannequin')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'mannequin' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 shadow-sm'
                     }`}
                   >
                     <span className="text-3xl">🧊</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">3D Hologram Mannequin</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Rotatable holographic 3D avatar. Drag with mouse to inspect posture alignment from any angle.</p>
                   </div>

                   {/* Mode Option 6: Posture Keyhole Match */}
                   <div 
                     onClick={() => setGameMode('shadow')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'shadow' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 shadow-sm'
                     }`}
                   >
                     <span className="text-3xl">👤</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">Posture Shadow Match</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Match body coordinates to a target silhouette. Hold matching posture to pop keyholes and log reps.</p>
                   </div>
                </div>

                {/* Start Training Button */}
                {currentExercise && (
                  <button 
                    onClick={() => setMode('scanner')}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-4 rounded-2xl shadow-md shadow-teal-600/10 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Start AI Gaming Rehab Session</span> &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STATS & ACHIEVEMENTS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Level progress bar */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-teal-600 uppercase tracking-widest">Rehab Progress & Level</h3>
                  <span className="text-xs text-slate-500 font-bold">Level {currentLevel} {totalXP > 500 ? 'Expert' : 'Rookie'}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-4 overflow-hidden mt-3 shadow-inner relative border border-slate-200/80">
                  <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-semibold">
                  <span>{xpRemaining} XP / 250 XP</span>
                  <span>{xpNeeded} XP to Level {currentLevel + 1}</span>
                </div>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Sessions</p>
                  <p className="text-2xl font-black text-teal-600">{totalSessions}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Reps Completed</p>
                  <p className="text-2xl font-black text-indigo-600">{totalReps}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Avg Form Accuracy</p>
                  <p className="text-2xl font-black text-pink-600">{avgSuccessRate}%</p>
                </div>
              </div>

              {/* Achievements Badges */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">Unlocked Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {achievements.map((badge, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        badge.unlocked 
                          ? `${badge.color} shadow-sm` 
                          : 'border-slate-150 bg-slate-50/50 opacity-40'
                      }`}
                    >
                      <span className={`text-3xl mb-2 ${!badge.unlocked && 'grayscale'}`}>{badge.icon}</span>
                      <h4 className="text-xs font-bold text-slate-800">{badge.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{badge.desc}</p>
                      {!badge.unlocked && <span className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-full">Locked</span>}
                      {badge.unlocked && <span className="text-[8px] font-black text-teal-700 mt-2 uppercase tracking-widest bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">Unlocked</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Sessions History Logs */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">Workout Session History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pr-2">Date</th>
                        <th className="pb-3 pr-2">Exercise</th>
                        <th className="pb-3 pr-2">Game Interface</th>
                        <th className="pb-3 pr-2 text-center">Reps</th>
                        <th className="pb-3 text-center">Form Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((session, idx) => (
                        <tr key={idx} className="text-slate-600">
                          <td className="py-3.5 pr-2 font-medium">{new Date(session.date).toLocaleDateString()}</td>
                          <td className="py-3.5 pr-2 font-bold text-slate-800">{session.exerciseName}</td>
                          <td className="py-3.5 pr-2">{session.gamePlayed || 'Standard Tracker'}</td>
                          <td className="py-3.5 pr-2 text-center font-bold text-teal-600">{session.reps_completed}</td>
                          <td className="py-3.5 text-center font-bold text-indigo-600">{session.success_rate || 100}%</td>
                        </tr>
                      ))}
                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-405 font-bold">No sessions completed yet. Head to Workout Hub to start!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUESTS & LEADERBOARDS */}
          {activeTab === 'quests' && (
            <div className="max-w-xl mx-auto w-full">
              
              {/* Daily Quests Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">Daily Quests</h3>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Resets Daily</span>
                </div>
                <div className="space-y-3">
                  {quests.map((quest, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                        quest.done 
                          ? 'border-teal-200 bg-teal-50/40' 
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold ${quest.done ? 'text-teal-700' : 'text-slate-700'}`}>{quest.name}</span>
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">+{quest.reward}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{quest.desc}</p>
                      </div>
                      <div>
                        {quest.done ? (
                          <span className="text-teal-600 text-lg font-bold">✓</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-md">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    );
  }

  // --- VIEW 2: ACTIVE REHAB WORKOUT VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Back Button */}
      <button 
        onClick={() => setMode('dashboard')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white font-bold text-sm bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all"
      >
        &larr; Exit to Dashboard
      </button>

      {/* Audio toggle overlay */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 text-slate-400 hover:text-white font-bold text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all"
      >
        {isMuted ? '🔇 Audio Off' : '🔊 Audio On'}
      </button>

      {/* Gaming Status Indicators Overlay */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center max-w-4xl w-full">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 px-5 py-3 rounded-2xl text-center min-w-[120px]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Active Target</p>
          <p className="text-sm font-black text-teal-400 truncate">{currentExercise?.name}</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 px-5 py-3 rounded-2xl text-center min-w-[100px]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Reps Completed</p>
          <p className="text-lg font-black text-white">{reps} <span className="text-xs text-slate-500">/ {currentExercise?.targetReps}</span></p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 px-5 py-3 rounded-2xl text-center min-w-[90px]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Live Angle</p>
          <p className="text-lg font-black text-indigo-400">{armAngle}°</p>
        </div>
        {currentExercise?.holdTime > 0 && (
          <div className={`bg-slate-900/80 backdrop-blur border px-5 py-3 rounded-2xl text-center min-w-[100px] transition-all ${
            isHolding ? 'border-teal-500 bg-teal-950/20' : 'border-slate-800'
          }`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Hold Timer</p>
            <p className="text-lg font-black text-yellow-400">{holdTimeLeft}s</p>
          </div>
        )}
      </div>

      {/* HTML5 Canvas Render targets */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mb-6 px-4 justify-center">
        {/* Hidden video node for vision feed ingestion */}
        <video ref={videoRef} className="hidden" playsInline muted />

        {/* Left Screen: Camera / Form Check (Only visible for games) */}
        {gameMode !== 'standard' && (
          <div className="flex-1 relative border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[4/3]">
            <canvas ref={cameraCanvasRef} className="block w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1 rounded-xl text-[10px] font-bold text-teal-400 uppercase tracking-widest shadow-sm">
              AI Form Check
            </div>
          </div>
        )}

        {/* Right/Main Screen: Game or Standard Tracker */}
        <div className={`relative border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 aspect-[4/3] ${
          gameMode === 'standard' ? 'max-w-2xl mx-auto w-full' : 'flex-1'
        }`}>
          <canvas ref={canvasRef} className="block w-full h-full object-cover" />
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1 rounded-xl text-[10px] font-bold text-pink-400 uppercase tracking-widest shadow-sm">
            {gameMode === 'standard' ? 'Standard Visualizer' : 'Game World'}
          </div>
        </div>
      </div>

      {/* Action complete trigger */}
      <button 
        onClick={handleSaveSession}
        className="px-10 py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl font-black text-lg transition-all shadow-lg shadow-teal-600/15"
      >
        Complete & Log Session
      </button>

      {/* Calibrator Guide & Reference overlay */}
      <div className="text-xs text-slate-405 mt-4 text-left max-w-md bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
        <p>
          💡 <span className="font-bold text-teal-400">Camera Setup:</span> {currentExercise?.camera_guidance || "Keep the required joints visible in the frame."}
        </p>
        {currentExercise && EXERCISE_REFS[currentExercise.name] && (
          <div className="border-t border-slate-800 pt-2.5 space-y-2 text-[11px] text-slate-350">
            <p>
              🏋️‍♂️ <span className="font-bold text-slate-200">Execution Guide:</span> {EXERCISE_REFS[currentExercise.name].guidance}
            </p>
            <p className="italic text-teal-400">
              💡 Pro-Tip: {EXERCISE_REFS[currentExercise.name].tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}