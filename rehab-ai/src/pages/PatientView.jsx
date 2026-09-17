import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { API_URL, CV_API_URL } from '../config';
import * as standardTracker from '../games/standardTracker';
import * as zenBloom from '../games/zenBloom';
import * as flappyRehab from '../games/flappyRehab';
import * as mannequinTracker from '../games/mannequinTracker';
import * as shadowMatch from '../games/shadowMatch';
import * as beatRehab from '../games/beatRehab';

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
  if (name.includes('curl') || name.includes('flexion') || name.includes('extension') || name.includes('raise') || name.includes('push') || name.includes('slide')) {
    return 'flappy'; // Flappy flight for unilateral flexion/extensions
  }
  return 'standard';
};

const getStreak = (sessionLogs) => {
  if (!sessionLogs || sessionLogs.length === 0) return 0;
  
  // Extract unique dates as YYYY-MM-DD
  const dates = Array.from(new Set(sessionLogs.map(s => {
    try {
      return new Date(s.date).toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }))).filter(Boolean).sort().reverse(); // sort descending (latest first)
  
  if (dates.length === 0) return 0;

  let streak = 0;
  let todayStr = new Date().toISOString().split('T')[0];
  let yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // If latest session is not from today or yesterday, streak is broken (0)
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
    return 0;
  }

  let expectedDate = new Date(dates[0]);
  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    const expectedStr = expectedDate.toISOString().split('T')[0];
    
    if (dateStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1); // step backward
    } else {
      break;
    }
  }
  return streak;
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
  
  // Stats & Achievements tab interactive states
  const [statsChartMode, setStatsChartMode] = useState('reps'); // 'reps', 'accuracy', 'rom'
  const [statsFilterGame, setStatsFilterGame] = useState('all');
  const [statsFilterEx, setStatsFilterEx] = useState('all');
  const [statsSearch, setStatsSearch] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('all'); // 'all', 'unlocked', 'locked'
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);
  
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
    } else if (gameMode === 'mannequin') {
      gameStateRef.current = { ...gameStateRef.current, ...mannequinTracker.init() };
    } else if (gameMode === 'shadow') {
      gameStateRef.current = { ...gameStateRef.current, ...shadowMatch.init() };
    } else if (gameMode === 'beat') {
      gameStateRef.current = { ...gameStateRef.current, ...beatRehab.init() };
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

              // Reset hold progress if posture becomes invalid during hold
              holdStartRef.current = null;
              setIsHolding(false);
              setHoldTimeLeft(currentExercise.holdTime || 0);
              if (gameStateRef.current) {
                gameStateRef.current.bloomPercentage = 0;
              }
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
              setReps,
              isPostureInvalid
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
              selectedArm,
              patientName: user.name,
              sessionNumber: sessions.length + 1
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

          else if (gameMode === 'beat') {
            beatRehab.draw(ctxGame, gameCanvas, gameStateRef.current, {
              liveAngleVal,
              currentExercise,
              speakText,
              repsRef,
              setReps,
              isPostureInvalid
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
        mannequin: '3D Hologram Mannequin',
        shadow: 'Posture Shadow Match',
        beat: 'BeatRehab Slicer'
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

    // Active estimated minutes & gamified ratio
    const activeMinutes = Math.max(1, Math.round(totalSessions * 3.5 + (totalHolds / 60)));
    const gamifiedSessionsCount = sessions.filter(s => s.gamePlayed && s.gamePlayed !== 'Standard Tracker').length;
    const gamifiedPct = totalSessions > 0 ? Math.round((gamifiedSessionsCount / totalSessions) * 100) : 0;

    // Avg form accuracy
    const avgSuccessRate = totalSessions > 0
      ? Math.round(sessions.reduce((acc, curr) => acc + (curr.success_rate || 100), 0) / totalSessions)
      : 0;

    const currentStreak = getStreak(sessions);

    // Tier Classification
    const getTierInfo = (lvl) => {
      if (lvl >= 20) return { title: 'Diamond Legend', badge: '💎', color: 'from-cyan-500 to-blue-600', text: 'text-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50' };
      if (lvl >= 15) return { title: 'Platinum Titan', badge: '🛡️', color: 'from-indigo-500 to-purple-600', text: 'text-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50' };
      if (lvl >= 10) return { title: 'Gold Master', badge: '🥇', color: 'from-amber-400 to-yellow-500', text: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' };
      if (lvl >= 5) return { title: 'Silver Ace', badge: '🥈', color: 'from-slate-400 to-slate-600', text: 'text-slate-600', border: 'border-slate-300', bg: 'bg-slate-100' };
      return { title: 'Bronze Rookie', badge: '🥉', color: 'from-teal-400 to-emerald-600', text: 'text-teal-600', border: 'border-teal-200', bg: 'bg-teal-50' };
    };
    const currentTier = getTierInfo(currentLevel);

    // Badges array with progress tracking
    const achievements = [
      { id: 'first_step', name: 'First Flight', desc: 'Complete your first virtual game session', unlocked: totalSessions >= 1, progress: Math.min(100, totalSessions >= 1 ? 100 : 0), icon: '🚀', category: 'Milestone', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
      { id: 'rom_champ', name: 'Sniper Form', desc: 'Achieve 100% accuracy in any exercise session', unlocked: sessions.some(s => s.success_rate === 100), progress: sessions.some(s => s.success_rate === 100) ? 100 : Math.min(99, avgSuccessRate), icon: '🎯', category: 'Biomechanics', color: 'text-amber-700 bg-amber-50 border-amber-200' },
      { id: 'hold_titan', name: 'Zen Master', desc: 'Perform a static hold session in Zen Bloom', unlocked: totalHolds > 0, progress: totalHolds > 0 ? 100 : 0, icon: '🌸', category: 'Endurance', color: 'text-pink-700 bg-pink-50 border-pink-200' },
      { id: 'centurion', name: 'Century Reps', desc: 'Complete 100+ total exercise repetitions', unlocked: totalReps >= 100, progress: Math.min(100, Math.round((totalReps / 100) * 100)), current: totalReps, target: 100, icon: '⚡', category: 'Volume', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
      { id: 'streak_master', name: 'Consistency Titan', desc: 'Maintain a 3-day active rehabilitation streak', unlocked: currentStreak >= 3, progress: Math.min(100, Math.round((currentStreak / 3) * 100)), current: currentStreak, target: 3, icon: '🔥', category: 'Streak', color: 'text-orange-700 bg-orange-50 border-orange-200' },
      { id: 'beat_slicer', name: 'Rhythm Maestro', desc: 'Slice rhythm cues in BeatRehab Slicer', unlocked: sessions.some(s => s.gamePlayed === 'BeatRehab Slicer'), progress: sessions.some(s => s.gamePlayed === 'BeatRehab Slicer') ? 100 : 0, icon: '🎵', category: 'Cadence', color: 'text-purple-700 bg-purple-50 border-purple-200' },
      { id: 'hologram_hero', name: '3D Hologram Pilot', desc: 'Inspect posture in 3D Mannequin mode', unlocked: sessions.some(s => s.gamePlayed === '3D Hologram Mannequin'), progress: sessions.some(s => s.gamePlayed === '3D Hologram Mannequin') ? 100 : 0, icon: '🧊', category: 'Alignment', color: 'text-teal-700 bg-teal-50 border-teal-200' },
      { id: 'rehab_veteran', name: 'Rehab Veteran', desc: 'Log 25+ completed clinical training sessions', unlocked: totalSessions >= 25, progress: Math.min(100, Math.round((totalSessions / 25) * 100)), current: totalSessions, target: 25, icon: '🏆', category: 'Dedication', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    ];

    // CSV Clinical Export Handler
    const handleExportCSV = () => {
      if (!sessions || sessions.length === 0) {
        alert("No workout sessions recorded yet.");
        return;
      }
      const headers = ["Session ID", "Date", "Time", "Exercise Name", "Game Interface", "Reps Completed", "Form Accuracy (%)", "Max Angle Achieved (deg)", "Hold Time (s)"];
      const rows = sessions.map((s, idx) => [
        idx + 1,
        new Date(s.date).toLocaleDateString(),
        new Date(s.date).toLocaleTimeString(),
        `"${(s.exerciseName || 'General Practice').replace(/"/g, '""')}"`,
        `"${(s.gamePlayed || 'Standard Tracker').replace(/"/g, '""')}"`,
        s.reps_completed || 0,
        s.success_rate || 100,
        Math.round(s.max_angle_achieved || 0),
        s.hold_time_achieved || 0
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PoseCare_Rehab_Log_${(user.name || 'Patient').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Filtered Sessions for Table & Search
    const uniqueExercises = Array.from(new Set(sessions.map(s => s.exerciseName).filter(Boolean)));
    const uniqueGames = Array.from(new Set(sessions.map(s => s.gamePlayed).filter(Boolean)));

    const filteredSessions = sessions.filter(session => {
      if (statsFilterGame !== 'all' && session.gamePlayed !== statsFilterGame) return false;
      if (statsFilterEx !== 'all' && session.exerciseName !== statsFilterEx) return false;
      if (statsSearch.trim()) {
        const q = statsSearch.toLowerCase();
        const matchEx = (session.exerciseName || '').toLowerCase().includes(q);
        const matchGame = (session.gamePlayed || '').toLowerCase().includes(q);
        const matchDate = new Date(session.date).toLocaleDateString().toLowerCase().includes(q);
        if (!matchEx && !matchGame && !matchDate) return false;
      }
      return true;
    });

    const filteredAchievements = achievements.filter(badge => {
      if (badgeFilter === 'unlocked') return badge.unlocked;
      if (badgeFilter === 'locked') return !badge.unlocked;
      return true;
    });

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
                    <span className="text-xl font-black text-slate-800">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'} Active</span>
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
                    <span className="text-xl font-black text-slate-800">{totalSessions > 0 ? `${avgSuccessRate}%` : 'N/A'} Form</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: Prescription Status Card */}
                <div className="md:col-span-1 space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Active Prescription</h3>
                  
                  {doctorPrescribed.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Prescribed Stretch</span>
                        <span className="font-extrabold text-slate-800 text-base">{doctorPrescribed[0].name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block font-bold text-[9px] uppercase">Goal Target</span>
                          <span className="font-extrabold text-slate-800">{doctorPrescribed[0].targetReps} Reps</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block font-bold text-[9px] uppercase">Hold Time</span>
                          <span className="font-extrabold text-slate-800">{doctorPrescribed[0].holdTime || 0}s</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setCurrentExercise(doctorPrescribed[0]);
                          setReps(0);
                          repsRef.current = 0;
                          setGameMode(getRecommendedGameMode(doctorPrescribed[0]));
                          setActiveTab('workout');
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-teal-600/10"
                      >
                        🏋️‍♂️ Start Workout Now
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl text-center space-y-3">
                      <span className="text-2xl block">📋</span>
                      <h4 className="font-bold text-slate-700 text-xs">No Active Prescription</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed">Your therapist has not assigned any active workout routines yet. You can still practice any exercise in the Workout Hub!</p>
                    </div>
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

                   {/* Mode Option 3: BeatRehab (Rhythm Slicer) */}
                   <div 
                     onClick={() => setGameMode('beat')}
                     className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                       gameMode === 'beat' ? 'border-purple-500 bg-white ring-2 ring-purple-500/20 shadow-md' : 'border-slate-200 bg-white hover:border-purple-300 shadow-sm'
                     }`}
                   >
                     <span className="absolute top-4 right-4 bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-purple-200 shadow-sm">
                       NEW
                     </span>
                     <span className="text-3xl">🎵</span>
                     <h3 className="font-extrabold text-slate-800 mt-3 text-sm">BeatRehab Slicer</h3>
                     <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Synthwave rhythm arcade. Elevate neon saber with joint movement to slice rhythm notes with cadence control.</p>
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
            <div className="space-y-8">
              
              {/* 1. Rehab Progress, Level & Tier Roadmap Card */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${currentTier.border} ${currentTier.bg} shadow-inner`}>
                      {currentTier.badge}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Rehabilitation Tier</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${currentTier.border} ${currentTier.bg} ${currentTier.text}`}>
                          {currentTier.title}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">Level {currentLevel} • {totalXP.toLocaleString()} Total XP</h3>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-teal-600 block">{xpNeeded} XP to Level {currentLevel + 1}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{xpRemaining} / 250 XP in current tier</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner relative border border-slate-200/80">
                  <div 
                    className={`bg-gradient-to-r ${currentTier.color} h-full rounded-full transition-all duration-700 shadow-sm`}
                    style={{ width: `${Math.max(5, xpProgress)}%` }}
                  ></div>
                </div>

                {/* Tier Milestones Pathway */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">Rehab Mastery Milestones</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { lvl: 1, title: 'Rookie', perk: 'Starter Library', icon: '🥉' },
                      { lvl: 5, title: 'Silver Ace', perk: 'Custom Voice Coaches', icon: '🥈' },
                      { lvl: 10, title: 'Gold Master', perk: 'Synthwave Beat Tracks', icon: '🥇' },
                      { lvl: 15, title: 'Platinum Titan', perk: 'Advanced Biomechanics', icon: '🛡️' },
                      { lvl: 20, title: 'Diamond Legend', perk: 'Clinical Recovery Diploma', icon: '💎' },
                    ].map((tier, idx) => {
                      const isReached = currentLevel >= tier.lvl;
                      const isCurrent = currentLevel >= tier.lvl && (idx === 4 || currentLevel < [5, 10, 15, 20][idx]);
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-2xl border transition-all ${
                            isCurrent 
                              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/10 shadow-sm' 
                              : isReached 
                                ? 'bg-slate-50/80 border-slate-200 text-slate-700' 
                                : 'bg-slate-50/30 border-slate-150 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{tier.icon}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isReached ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                              Lvl {tier.lvl}+
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-900 block truncate">{tier.title}</span>
                          <span className="text-[9px] text-slate-400 block leading-tight truncate mt-0.5" title={tier.perk}>{tier.perk}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Six High-Impact KPI Performance Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* Metric 1: Total Reps */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-200 transition-all flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-xl mb-3">
                    🏋️‍♂️
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Reps</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalReps.toLocaleString()}</span>
                    <span className="text-[10px] text-teal-600 font-bold block mt-1">Across {totalSessions} sessions</span>
                  </div>
                </div>

                {/* Metric 2: Active Time */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl mb-3">
                    ⏱️
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Active Rehab</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                      {activeMinutes >= 60 ? `${Math.floor(activeMinutes / 60)}h ${activeMinutes % 60}m` : `${activeMinutes}m`}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold block mt-1">Clinical movement</span>
                  </div>
                </div>

                {/* Metric 3: Avg Accuracy */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-pink-200 transition-all flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-xl mb-3">
                    🎯
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Avg Accuracy</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalSessions > 0 ? `${avgSuccessRate}%` : '0%'}</span>
                    <span className="text-[10px] text-pink-600 font-bold block mt-1">AI posture rating</span>
                  </div>
                </div>

                {/* Metric 4: Daily Streak */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-200 transition-all flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl mb-3">
                    🔥
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Active Streak</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
                    <span className="text-[10px] text-amber-600 font-bold block mt-1">Consistency score</span>
                  </div>
                </div>

                {/* Metric 5: Gamified Sessions */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-200 transition-all flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl mb-3">
                    🎮
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Game Ratio</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">{gamifiedPct}%</span>
                    <span className="text-[10px] text-purple-600 font-bold block mt-1">{gamifiedSessionsCount} arcade plays</span>
                  </div>
                </div>

                {/* Metric 6: Total Lifetime XP */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-cyan-200 transition-all flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-xl mb-3">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Energy XP</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalXP >= 1000 ? `${(totalXP / 1000).toFixed(1)}k` : totalXP}</span>
                    <span className="text-[10px] text-cyan-600 font-bold block mt-1">Lifetime earned</span>
                  </div>
                </div>

              </div>

              {/* 3. Interactive SVG Clinical Recovery & Performance Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Biomechanical Analytics</span>
                    <h3 className="text-base font-extrabold text-slate-900">Recovery & Performance Trajectory</h3>
                  </div>
                  
                  {/* Chart Mode Switcher */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setStatsChartMode('reps')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statsChartMode === 'reps' 
                          ? 'bg-white text-teal-700 shadow-sm font-black' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📊 Reps Volume
                    </button>
                    <button 
                      onClick={() => setStatsChartMode('accuracy')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statsChartMode === 'accuracy' 
                          ? 'bg-white text-indigo-700 shadow-sm font-black' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🎯 Form Accuracy
                    </button>
                    <button 
                      onClick={() => setStatsChartMode('rom')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statsChartMode === 'rom' 
                          ? 'bg-white text-purple-700 shadow-sm font-black' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📐 Max ROM (°)
                    </button>
                  </div>
                </div>

                {/* SVG Visualizer Area */}
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative h-60 w-full bg-slate-50/50 rounded-2xl border border-slate-150 p-4">
                      {/* Scale Labels */}
                      <div className="absolute inset-y-4 left-3 flex flex-col justify-between text-[9px] font-mono font-bold text-slate-400 pointer-events-none z-0">
                        {statsChartMode === 'reps' && (
                          <>
                            <span>25 Reps</span>
                            <span>15 Reps</span>
                            <span>5 Reps</span>
                            <span>0</span>
                          </>
                        )}
                        {statsChartMode === 'accuracy' && (
                          <>
                            <span>100%</span>
                            <span>75%</span>
                            <span>50%</span>
                            <span>0%</span>
                          </>
                        )}
                        {statsChartMode === 'rom' && (
                          <>
                            <span>180°</span>
                            <span>120°</span>
                            <span>60°</span>
                            <span>0°</span>
                          </>
                        )}
                      </div>

                      {/* Horizontal Grid lines */}
                      <div className="absolute inset-x-12 top-6 border-b border-dashed border-slate-200"></div>
                      <div className="absolute inset-x-12 top-1/2 border-b border-dashed border-slate-200"></div>
                      <div className="absolute inset-x-12 bottom-10 border-b border-dashed border-slate-200"></div>

                      {/* Interactive Data Bars & Nodes */}
                      <div className="relative h-full flex items-end justify-between pl-12 pr-4 pb-8 z-10 gap-2">
                        {sessions.slice(-8).map((s, idx) => {
                          let value = 0;
                          let maxScale = 25;
                          let unit = 'reps';
                          let barColor = 'from-teal-500 to-indigo-500';

                          if (statsChartMode === 'reps') {
                            value = s.reps_completed || 0;
                            maxScale = Math.max(20, Math.max(...sessions.slice(-8).map(x => x.reps_completed || 0)));
                            unit = 'reps';
                            barColor = 'from-teal-500 to-emerald-500';
                          } else if (statsChartMode === 'accuracy') {
                            value = s.success_rate || 100;
                            maxScale = 100;
                            unit = '% accuracy';
                            barColor = 'from-indigo-500 to-pink-500';
                          } else if (statsChartMode === 'rom') {
                            value = Math.round(s.max_angle_achieved || 0);
                            maxScale = 180;
                            unit = '° ROM';
                            barColor = 'from-purple-500 to-cyan-500';
                          }

                          const heightPercent = Math.min(100, Math.max(12, (value / maxScale) * 100));
                          const dateLabel = new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });

                          return (
                            <div 
                              key={idx}
                              className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                              onMouseEnter={() => setHoveredChartPoint({ ...s, value, unit, dateLabel })}
                              onMouseLeave={() => setHoveredChartPoint(null)}
                            >
                              {/* Hover Tooltip */}
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                                <span className="font-extrabold text-teal-300">{value} {unit}</span> • {s.exerciseName}
                              </div>

                              {/* Bar */}
                              <div 
                                className={`w-full max-w-[36px] bg-gradient-to-t ${barColor} rounded-xl shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:brightness-110`}
                                style={{ height: `${heightPercent}%` }}
                              ></div>

                              {/* X Axis Label */}
                              <span className="absolute -bottom-6 text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider truncate max-w-[50px] text-center">
                                {new Date(s.date).toLocaleDateString(undefined, { weekday: 'short' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chart Context Footer */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Recent 8 Sessions:</span>
                        <span className="font-bold text-slate-800">
                          {sessions.slice(-8).reduce((acc, curr) => acc + (curr.reps_completed || 0), 0)} Total Reps
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Average Form Accuracy:</span>
                        <span className="font-bold text-indigo-600">
                          {Math.round(sessions.slice(-8).reduce((acc, curr) => acc + (curr.success_rate || 100), 0) / Math.min(8, sessions.length))}% Form
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Peak Session Volume:</span>
                        <span className="font-bold text-teal-600">
                          {Math.max(...sessions.map(s => s.reps_completed || 0))} Reps
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <span className="text-3xl block">📊</span>
                    <p className="text-xs font-semibold">No session analytics recorded yet.</p>
                    <p className="text-[11px] text-slate-400">Complete exercises in the Workout Hub to visualize your recovery curve.</p>
                  </div>
                )}
              </div>

              {/* 4. Expanded Badges & Achievements Showcase */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Gamification Trophies</span>
                    <h3 className="text-base font-extrabold text-slate-900">Achievements & Clinical Milestones</h3>
                  </div>

                  {/* Badge Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setBadgeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        badgeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({achievements.length})
                    </button>
                    <button
                      onClick={() => setBadgeFilter('unlocked')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        badgeFilter === 'unlocked' ? 'bg-white text-teal-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Unlocked ({achievements.filter(a => a.unlocked).length})
                    </button>
                    <button
                      onClick={() => setBadgeFilter('locked')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        badgeFilter === 'locked' ? 'bg-white text-slate-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Locked ({achievements.filter(a => !a.unlocked).length})
                    </button>
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredAchievements.map((badge, idx) => (
                    <div 
                      key={idx}
                      className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                        badge.unlocked 
                          ? `${badge.color} shadow-sm hover:shadow-md hover:-translate-y-0.5` 
                          : 'border-slate-200 bg-slate-50/60 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-4xl ${!badge.unlocked && 'grayscale'}`}>{badge.icon}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600">
                            {badge.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">{badge.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{badge.desc}</p>
                      </div>

                      {/* Progress bar for in-progress or status badge */}
                      <div className="mt-4 pt-3 border-t border-slate-200/50">
                        {badge.unlocked ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest bg-teal-100/80 px-2 py-0.5 rounded-full">
                              ✓ Unlocked
                            </span>
                            <span className="text-[10px] font-bold text-teal-600">100%</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span>Locked</span>
                              <span>{badge.progress}%</span>
                            </div>
                            <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-slate-400 h-full rounded-full" style={{ width: `${badge.progress}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Filterable Workout Session History Logs with CSV Export */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Clinical Logs</span>
                    <h3 className="text-base font-extrabold text-slate-900">Workout Session History</h3>
                  </div>

                  {/* CSV Export Button */}
                  <button
                    onClick={handleExportCSV}
                    disabled={sessions.length === 0}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span>📥</span>
                    <span>Export Clinical CSV</span>
                  </button>
                </div>

                {/* Filters & Search Control Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                  {/* Search Input */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Search Logs</label>
                    <input 
                      type="text"
                      placeholder="Search exercise, date, game..."
                      value={statsSearch}
                      onChange={(e) => setStatsSearch(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Filter Exercise */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Exercise</label>
                    <select
                      value={statsFilterEx}
                      onChange={(e) => setStatsFilterEx(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Exercises ({uniqueExercises.length})</option>
                      {uniqueExercises.map(ex => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Game Mode */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Game Interface</label>
                    <select
                      value={statsFilterGame}
                      onChange={(e) => setStatsFilterGame(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Interfaces ({uniqueGames.length})</option>
                      {uniqueGames.map(game => (
                        <option key={game} value={game}>{game}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sessions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pr-2">Date & Time</th>
                        <th className="pb-3 pr-2">Exercise</th>
                        <th className="pb-3 pr-2">Game Interface</th>
                        <th className="pb-3 pr-2 text-center">Reps</th>
                        <th className="pb-3 pr-2 text-center">Max ROM</th>
                        <th className="pb-3 text-center">Form Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSessions.map((session, idx) => {
                        const acc = session.success_rate || 100;
                        let accBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        if (acc < 75) accBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                        else if (acc < 90) accBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';

                        let gameIcon = '🩻';
                        if (session.gamePlayed?.includes('Zen')) gameIcon = '🌸';
                        else if (session.gamePlayed?.includes('Flappy')) gameIcon = '🚀';
                        else if (session.gamePlayed?.includes('Beat')) gameIcon = '🎵';
                        else if (session.gamePlayed?.includes('Mannequin')) gameIcon = '🧊';
                        else if (session.gamePlayed?.includes('Shadow')) gameIcon = '👤';

                        return (
                          <tr key={idx} className="text-slate-600 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 pr-2">
                              <span className="font-semibold text-slate-800 block">{new Date(session.date).toLocaleDateString()}</span>
                              <span className="text-[10px] text-slate-400">{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="py-3.5 pr-2">
                              <span className="font-bold text-slate-900 block">{session.exerciseName}</span>
                              {session.hold_time_achieved > 0 && (
                                <span className="text-[10px] text-indigo-600 font-semibold">⏱ {session.hold_time_achieved}s Hold</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-2">
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-medium text-slate-700">
                                <span>{gameIcon}</span>
                                <span>{session.gamePlayed || 'Standard Tracker'}</span>
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-center">
                              <span className="font-black text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-xl">
                                {session.reps_completed}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-center font-mono font-bold text-slate-700">
                              {Math.round(session.max_angle_achieved || 0)}°
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`inline-block font-black px-2.5 py-1 rounded-xl border text-[11px] ${accBadge}`}>
                                {acc}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSessions.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 space-y-2">
                            <p className="font-bold text-xs">No matching workout sessions found.</p>
                            {(statsSearch || statsFilterEx !== 'all' || statsFilterGame !== 'all') && (
                              <button 
                                onClick={() => {
                                  setStatsSearch('');
                                  setStatsFilterEx('all');
                                  setStatsFilterGame('all');
                                }}
                                className="text-teal-600 hover:text-teal-700 font-bold text-xs underline"
                              >
                                Clear filters
                              </button>
                            )}
                          </td>
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