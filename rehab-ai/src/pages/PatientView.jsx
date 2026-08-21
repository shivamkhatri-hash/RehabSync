import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { API_URL } from '../config';

const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

const drawBone = (ctx, landmarks, indexA, indexB, width, height, isWrongPosture) => {
  const ptA = landmarks[indexA];
  const ptB = landmarks[indexB];
  if (!ptA || !ptB) return;
  
  ctx.beginPath();
  ctx.moveTo(ptA.x * width, ptA.y * height);
  ctx.lineTo(ptB.x * width, ptB.y * height);
  ctx.strokeStyle = isWrongPosture ? '#f43f5e' : '#0d9488'; // Red for bad, Teal for good
  ctx.lineWidth = 6;
  ctx.stroke();
};

export default function PatientView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('dashboard'); // 'dashboard' or 'scanner'
  const [gameMode, setGameMode] = useState('zen'); // 'standard', 'zen', 'flappy', 'runner'
  const [isMuted, setIsMuted] = useState(false);
  const [selectedArm, setSelectedArm] = useState('left'); // 'left' or 'right'
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { poseLandmarker, isLoaded } = usePoseLandmarker();
  const [cameraActive, setCameraActive] = useState(false);
  
  const [armAngle, setArmAngle] = useState(0);
  const [prescribedExercises, setPrescribedExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [reps, setReps] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimeLeft, setHoldTimeLeft] = useState(0);
  
  const isDownRef = useRef(false);
  const repsRef = useRef(0);
  const lastRepTime = useRef(0);
  const holdStartRef = useRef(null);
  const hasCountedRepRef = useRef(false);
  const lastSpokenRef = useRef(0);
  
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

  // 1. Fetch User Profile and Doctor Prescriptions
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
        if (prescrRes.ok) {
          const prescrData = await prescrRes.json();
          if (prescrData && prescrData.exercises && prescrData.exercises.length > 0) {
            // Mapping schema backend naming to state values
            const mapped = prescrData.exercises.map(ex => ({
              name: ex.exerciseName,
              target_joints: ex.exerciseName === 'Crunch' ? [11, 23, 25] : [11, 13, 15],
              success_angle: ex.successAngle,
              failure_angle: ex.failureAngle,
              holdTime: ex.holdTime,
              targetReps: ex.targetReps
            }));
            setPrescribedExercises(mapped);
            setCurrentExercise(mapped[0]);
            return;
          }
        }
        
        // Fallback: If no prescription is assigned, load system defaults
        const defaultExs = [
          { name: 'Bicep Curl', target_joints: [11, 13, 15], success_angle: 160, failure_angle: 90, holdTime: 0, targetReps: 15 },
          { name: 'Push-up', target_joints: [11, 13, 15], success_angle: 160, failure_angle: 80, holdTime: 0, targetReps: 10 },
          { name: 'Crunch', target_joints: [11, 23, 25], success_angle: 110, failure_angle: 60, holdTime: 2, targetReps: 12 }
        ];
        setPrescribedExercises(defaultExs);
        setCurrentExercise(defaultExs[0]);
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

    // Reset loop game values
    gameStateRef.current.bloomPercentage = 0;
    gameStateRef.current.flowers = [];
    gameStateRef.current.plantHeight = 30;
    gameStateRef.current.flappyScore = 0;
    gameStateRef.current.flappyY = 240;
    gameStateRef.current.gates = [];
    gameStateRef.current.runnerScore = 0;
    gameStateRef.current.runnerY = 0;
    gameStateRef.current.runnerJumpVelocity = 0;
    gameStateRef.current.obstacles = [];
    gameStateRef.current.runnerCoins = [];
    gameStateRef.current.frameIndex = 0;
    
    repsRef.current = 0;
    setReps(0);
    holdStartRef.current = null;
    hasCountedRepRef.current = false;

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

        // Resolve target joints dynamically based on chosen side selection
        let resolvedJoints = currentExercise.target_joints;
        if (selectedArm === 'right') {
          if (currentExercise.name === 'Bicep Curl' || currentExercise.name === 'Push-up') {
            resolvedJoints = [12, 14, 16];
          } else if (currentExercise.name === 'Crunch') {
            resolvedJoints = [12, 24, 26];
          }
        } else {
          if (currentExercise.name === 'Bicep Curl' || currentExercise.name === 'Push-up') {
            resolvedJoints = [11, 13, 15];
          } else if (currentExercise.name === 'Crunch') {
            resolvedJoints = [11, 23, 25];
          }
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

            // Flexion vs Extension evaluation directions
            const success = currentExercise.success_angle;
            const failure = currentExercise.failure_angle;
            
            if (success > failure) {
              isSuccessZone = angle >= success;
              isResetZone = angle <= failure;
            } else {
              isSuccessZone = angle <= success;
              isResetZone = angle >= failure;
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
                    repsRef.current += 1;
                    setReps(repsRef.current);
                    hasCountedRepRef.current = true;
                    speakText(`Rep ${repsRef.current} counted.`);

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
        }

        // --- GRAPHICS LAYER RENDERING ---
        if (gameMode === 'standard') {
          // Mode 1: Mirror feed with overlaid bones skeleton
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (detectedLandmarks) {
            const [j1, j2, j3] = resolvedJoints;
            // Draw visual skeletal highlights
            drawBone(ctx, detectedLandmarks, j1, j2, canvas.width, canvas.height, isHolding);
            drawBone(ctx, detectedLandmarks, j2, j3, canvas.width, canvas.height, isHolding);
          }
        } 
        
        else if (gameMode === 'zen') {
          // Mode 2: The Zen Bloom Garden
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(1, '#1e293b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render camera box in corner for reference
          ctx.save();
          ctx.beginPath();
          ctx.rect(480, 20, 140, 105);
          ctx.clip();
          ctx.drawImage(video, 480, 20, 140, 105);
          ctx.restore();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(480, 20, 140, 105);

          // Grass mound
          ctx.fillStyle = '#0f766e';
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2, canvas.height + 40, canvas.width * 0.6, 90, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw procedural stem
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, canvas.height - 15);
          ctx.quadraticCurveTo(canvas.width / 2 - 30, canvas.height - 100, canvas.width / 2, canvas.height - gameStateRef.current.plantHeight);
          ctx.strokeStyle = '#0d9488';
          ctx.lineWidth = 10;
          ctx.stroke();

          // Render leaves
          const leafY = canvas.height - (gameStateRef.current.plantHeight / 1.8);
          ctx.fillStyle = '#115e59';
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2 - 20, leafY, 24, 10, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2 + 20, leafY - 15, 24, 10, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Bud/Flower head indicator
          const budRad = 16 + (gameStateRef.current.bloomPercentage / 100) * 12;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height - gameStateRef.current.plantHeight, budRad, 0, Math.PI * 2);
          ctx.fill();

          // Renders bloomed garden
          gameStateRef.current.flowers.forEach((f) => {
            if (f.scale < 1.0) f.scale += 0.04;
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.scale(f.scale, f.scale);
            
            ctx.fillStyle = f.color;
            for (let i = 0; i < 5; i++) {
              const ang = (i * 2 * Math.PI) / 5;
              ctx.beginPath();
              ctx.arc(Math.cos(ang) * 16, Math.sin(ang) * 16, 14, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          // Text overlay indicators
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText("ZEN GARDEN STRETCH MODE", 30, 40);
        } 
        
        else if (gameMode === 'flappy') {
          // Mode 3: Flappy Bird
          const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          bgGrad.addColorStop(0, '#020617');
          bgGrad.addColorStop(1, '#0b1329');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid backdrop
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          const scroll = (gameStateRef.current.frameIndex * 2) % 40;
          for (let x = -scroll; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          // Mini Web Camera overlay
          ctx.save();
          ctx.beginPath();
          ctx.rect(20, 20, 100, 75);
          ctx.clip();
          ctx.drawImage(video, 20, 20, 100, 75);
          ctx.restore();
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(20, 20, 100, 75);

          // Frame counting
          gameStateRef.current.frameIndex += 1;
          if (gameStateRef.current.frameIndex % 150 === 0) {
            const gap = 160;
            const topH = 80 + Math.random() * (canvas.height - 300);
            gameStateRef.current.gates.push({
              x: canvas.width,
              topHeight: topH,
              bottomHeight: topH + gap,
              passed: false,
              hit: false
            });
          }

          // Convert angle flexion value to ship Y height
          const minAngle = currentExercise.failure_angle;
          const maxAngle = currentExercise.success_angle;
          const range = maxAngle - minAngle;
          const ratio = Math.max(0, Math.min(1, (liveAngleVal - minAngle) / (range || 1)));
          const targetY = canvas.height - 60 - ratio * (canvas.height - 120);
          gameStateRef.current.flappyY += (targetY - gameStateRef.current.flappyY) * 0.12;

          // Render flyer avatar
          const px = 170;
          const py = gameStateRef.current.flappyY;

          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
          // Thrust flame
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(px - 14, py);
          ctx.lineTo(px - 26, py - 6);
          ctx.lineTo(px - 26, py + 6);
          ctx.closePath();
          ctx.fill();

          // Obstacles Gate processing
          gameStateRef.current.gates.forEach((gate) => {
            gate.x -= 3;
            
            // Top obstruction pillar
            ctx.fillStyle = gate.hit ? '#f43f5e' : '#0d9488';
            ctx.fillRect(gate.x, 0, 50, gate.topHeight);
            ctx.fillStyle = gate.hit ? '#fda4af' : '#14b8a6';
            ctx.fillRect(gate.x - 4, gate.topHeight - 15, 58, 15);

            // Bottom obstruction pillar
            ctx.fillStyle = gate.hit ? '#f43f5e' : '#0d9488';
            ctx.fillRect(gate.x, gate.bottomHeight, 50, canvas.height - gate.bottomHeight);
            ctx.fillStyle = gate.hit ? '#fda4af' : '#14b8a6';
            ctx.fillRect(gate.x - 4, gate.bottomHeight, 58, 15);

            // Collision parameters checks
            if (gate.x < px + 14 && gate.x + 50 > px - 14) {
              if (py - 14 < gate.topHeight || py + 14 > gate.bottomHeight) {
                if (!gate.hit) {
                  gate.hit = true;
                  speakText("Watch alignment!");
                }
              }
            }

            // Gate clean pass checking
            if (!gate.passed && gate.x + 50 < px) {
              gate.passed = true;
              if (!gate.hit) {
                gameStateRef.current.flappyScore += 1;
                repsRef.current += 1;
                setReps(repsRef.current);
                speakText("Good pass!");
              }
            }
          });

          // Filter out of bounds gates
          gameStateRef.current.gates = gameStateRef.current.gates.filter(g => g.x > -80);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(`Gates Passed: ${gameStateRef.current.flappyScore}`, 140, 45);
        }
        
        else if (gameMode === 'runner') {
          // Mode 4: Isometric 3D-ish Runner
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const horizonY = canvas.height * 0.45;
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, horizonY);
          ctx.lineTo(canvas.width, horizonY);
          ctx.stroke();

          // Draw lanes perspective grid lines
          const cx = canvas.width / 2;
          ctx.strokeStyle = '#334155';
          [-1.5, -0.5, 0.5, 1.5].forEach((offset) => {
            ctx.beginPath();
            ctx.moveTo(cx + offset * 30, horizonY);
            ctx.lineTo(cx + offset * 240, canvas.height);
            ctx.stroke();
          });

          // Mini Camera Box in corner
          ctx.save();
          ctx.beginPath();
          ctx.rect(20, 20, 100, 75);
          ctx.clip();
          ctx.drawImage(video, 20, 20, 100, 75);
          ctx.restore();
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(20, 20, 100, 75);

          // Lean offset coordinates detector
          if (detectedLandmarks) {
            const leftShoulder = detectedLandmarks[11];
            const rightShoulder = detectedLandmarks[12];
            const leftHip = detectedLandmarks[23];
            const rightHip = detectedLandmarks[24];

            if (leftShoulder && rightShoulder && leftHip && rightHip) {
              const midS = (leftShoulder.x + rightShoulder.x) / 2;
              const midH = (leftHip.x + rightHip.x) / 2;
              const offset = midS - midH; // screen offset
              
              // camera mirrored -> leaning left moves right
              let lane = 1; // 0 left, 1 center, 2 right
              if (offset > 0.045) lane = 0;
              else if (offset < -0.045) lane = 2;
              gameStateRef.current.runnerLane = lane;
            }
          }

          // Jump physics update
          if (gameStateRef.current.runnerY > 0 || gameStateRef.current.runnerJumpVelocity !== 0) {
            gameStateRef.current.runnerY += gameStateRef.current.runnerJumpVelocity;
            gameStateRef.current.runnerJumpVelocity -= 0.6; // gravity speed
            if (gameStateRef.current.runnerY <= 0) {
              gameStateRef.current.runnerY = 0;
              gameStateRef.current.runnerJumpVelocity = 0;
            }
          }

          // Obstacles & coins spawning
          gameStateRef.current.frameIndex += 1;
          if (gameStateRef.current.frameIndex % 110 === 0) {
            const laneOption = Math.floor(Math.random() * 3);
            const isCoin = Math.random() > 0.5;
            if (isCoin) {
              gameStateRef.current.runnerCoins.push({ lane: laneOption, z: 0.1, passed: false });
            } else {
              const fullHurdle = Math.random() < 0.35;
              gameStateRef.current.obstacles.push({
                lane: laneOption,
                z: 0.1,
                isFullHurdle: fullHurdle,
                passed: false,
                hit: false
              });
            }
          }

          // Render player runner avatar (glowing circle)
          const laneX = [cx - 130, cx, cx + 130];
          const px = laneX[gameStateRef.current.runnerLane];
          const py = canvas.height - 65 - gameStateRef.current.runnerY;

          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(px, py, 16, 0, Math.PI * 2);
          ctx.fill();

          // Obstacles render & collision loop
          gameStateRef.current.obstacles.forEach((obs) => {
            obs.z += 0.015;
            const zs = obs.z;
            const ox = cx + (obs.lane - 1) * 130 * zs;
            const oy = horizonY + (canvas.height - horizonY - 60) * zs;
            const size = 12 + zs * 38;

            if (obs.isFullHurdle) {
              ctx.fillStyle = obs.hit ? '#f43f5e' : '#b91c1c';
              ctx.fillRect(cx - 150 * zs, oy - size / 2, 300 * zs, size / 3);
            } else {
              ctx.fillStyle = obs.hit ? '#f43f5e' : '#dc2626';
              ctx.fillRect(ox - size / 2, oy - size / 2, size, size);
            }

            // Checks bounds collision at player position depth
            if (zs >= 0.85 && zs <= 0.95 && !obs.hit) {
              if (obs.isFullHurdle) {
                if (gameStateRef.current.runnerY < 18) {
                  obs.hit = true;
                  speakText("Jump!");
                }
              } else {
                if (gameStateRef.current.runnerLane === obs.lane && gameStateRef.current.runnerY < 10) {
                  obs.hit = true;
                  speakText("Dodge!");
                }
              }
            }

            if (zs >= 1.0 && !obs.passed) {
              obs.passed = true;
              if (!obs.hit) {
                gameStateRef.current.runnerScore += 10;
              }
            }
          });

          // Coins render & collection loop
          gameStateRef.current.runnerCoins.forEach((coin) => {
            coin.z += 0.015;
            const zs = coin.z;
            const kx = cx + (coin.lane - 1) * 130 * zs;
            const ky = horizonY + (canvas.height - horizonY - 60) * zs;
            const kSize = 5 + zs * 15;

            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(kx, ky, kSize, 0, Math.PI * 2);
            ctx.fill();

            if (zs >= 0.85 && zs <= 0.95 && !coin.passed) {
              if (gameStateRef.current.runnerLane === coin.lane && gameStateRef.current.runnerY < 18) {
                coin.passed = true;
                gameStateRef.current.runnerScore += 25;
                speakText("Nice catch!");
              }
            }
          });

          gameStateRef.current.obstacles = gameStateRef.current.obstacles.filter(o => o.z < 1.1);
          gameStateRef.current.runnerCoins = gameStateRef.current.runnerCoins.filter(c => c.z < 1.1);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(`Run Score: ${gameStateRef.current.runnerScore}`, 140, 45);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (cameraActive) renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
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

      const successRateCalc = reps > 0 ? 100 : 0; // Simple placeholder or ratio

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

  // --- VIEW 1: PATIENT DASHBOARD VIEW ---
  if (mode === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Patient Welcomer Header */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">Patient Dashboard</span>
              <h1 className="text-3xl font-black text-slate-900 mt-2">Welcome back, {user.name}</h1>
              <p className="text-slate-500 mt-1">Focus Area: <span className="font-semibold text-slate-700 capitalize">{user.focusArea?.replace('_', ' ')}</span></p>
            </div>
            
            {/* Mute Voice Feedback buttons */}
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                isMuted 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}
            >
              {isMuted ? '🔇 Voice Coach Off' : '🔊 Voice Coach On'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Exercises Prescriptions Roster */}
            <div className="md:col-span-1 space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Prescribed Exercises</h2>
              <div className="space-y-2">
                {prescribedExercises.map((ex, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setCurrentExercise(ex);
                      setReps(0);
                      repsRef.current = 0;
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      currentExercise?.name === ex.name 
                        ? 'border-teal-500 bg-teal-50/50 shadow-sm' 
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <h3 className="font-bold text-slate-800">{ex.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Target: {ex.targetReps} reps</p>
                    {ex.holdTime > 0 && <p className="text-xs text-indigo-500 font-medium mt-0.5">⏱ Hold: {ex.holdTime}s</p>}
                  </div>
                ))}
                {prescribedExercises.length === 0 && (
                  <p className="text-sm text-slate-400">Loading prescription logs...</p>
                )}
              </div>

              {/* Active Side / Arm Selector */}
              <div className="border-t border-slate-100 pt-4 mt-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Arm / Side</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedArm('left')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedArm === 'left' 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-600/10' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    👈 Left Side
                  </button>
                  <button 
                    onClick={() => setSelectedArm('right')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedArm === 'right' 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-600/10' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    👉 Right Side
                  </button>
                </div>
              </div>

            </div>

            {/* Game Mode Picker */}
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Select Game Interface</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Mode Option 1: Zen Bloom */}
                <div 
                  onClick={() => setGameMode('zen')}
                  className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                    gameMode === 'zen' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <span className="text-3xl">🌸</span>
                  <h3 className="font-extrabold text-slate-800 mt-3 text-base">Zen Bloom Garden</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Relaxing procedural plant grower. Focuses on patient hold timing and posture control.</p>
                </div>

                {/* Mode Option 2: Flappy Flight */}
                <div 
                  onClick={() => setGameMode('flappy')}
                  className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                    gameMode === 'flappy' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <span className="text-3xl">🚀</span>
                  <h3 className="font-extrabold text-slate-800 mt-3 text-base">Flappy Flight</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Classic gates flyer. Altitude maps directly to joint angle, encouraging range extensions.</p>
                </div>

                {/* Mode Option 3: Rehab Runner */}
                <div 
                  onClick={() => setGameMode('runner')}
                  className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                    gameMode === 'runner' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <span className="text-3xl">🏃‍♂️</span>
                  <h3 className="font-extrabold text-slate-800 mt-3 text-base">Rehab Runner Dash</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Dodge obstacles by leaning shoulders laterally. Complete full reps to jump fences.</p>
                </div>

                {/* Mode Option 4: Standard Tracker */}
                <div 
                  onClick={() => setGameMode('standard')}
                  className={`p-6 rounded-3xl border cursor-pointer transition-all relative ${
                    gameMode === 'standard' ? 'border-teal-500 bg-white ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <span className="text-3xl">🩻</span>
                  <h3 className="font-extrabold text-slate-800 mt-3 text-base">Standard AI Skeleton</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Mirror webcam feed overlaid with digital joints. Clinical precision analysis mode.</p>
                </div>

              </div>

              {/* Start Training Button */}
              {currentExercise && (
                <button 
                  onClick={() => setMode('scanner')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-600/10 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Start AI Gaming Rehab Session</span> &rarr;
                </button>
              )}
            </div>
          </div>

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

      {/* HTML5 Canvas Render target */}
      <div className="relative border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-black mb-6 max-w-full">
        {/* Hidden video node for vision feed ingestion */}
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="block w-[640px] h-[480px] max-w-full aspect-[4/3] object-cover" />
      </div>

      {/* Action complete trigger */}
      <button 
        onClick={handleSaveSession}
        className="px-10 py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl font-black text-lg transition-all shadow-lg shadow-teal-600/15"
      >
        Complete & Log Session
      </button>

      {/* Calibrator Guide */}
      <p className="text-xs text-slate-500 mt-4 text-center max-w-md">
        💡 Stand around <span className="font-bold text-slate-400">5–8 feet away</span> so your entire upper body is visible to the laptop webcam camera resolver.
      </p>
    </div>
  );
}