import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { API_URL } from '../config';
import * as standardTracker from '../games/standardTracker';
import * as zenBloom from '../games/zenBloom';
import * as flappyRehab from '../games/flappyRehab';
import * as rehabRunner from '../games/rehabRunner';

const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
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

    // Reset loop game values dynamically based on selected game mode
    if (gameMode === 'zen') {
      gameStateRef.current = { ...gameStateRef.current, ...zenBloom.init() };
    } else if (gameMode === 'flappy') {
      gameStateRef.current = { ...gameStateRef.current, ...flappyRehab.init() };
    } else if (gameMode === 'runner') {
      gameStateRef.current = { ...gameStateRef.current, ...rehabRunner.init() };
    }
    
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
          standardTracker.draw(ctx, canvas, {
            video,
            detectedLandmarks,
            resolvedJoints,
            isHolding
          });
        } 
        
        else if (gameMode === 'zen') {
          zenBloom.draw(ctx, canvas, gameStateRef.current, {
            video,
            isHolding
          });
        } 
        
        else if (gameMode === 'flappy') {
          flappyRehab.draw(ctx, canvas, gameStateRef.current, {
            video,
            liveAngleVal,
            currentExercise,
            speakText,
            repsRef,
            setReps
          });
        }
        
        else if (gameMode === 'runner') {
          rehabRunner.draw(ctx, canvas, gameStateRef.current, {
            video,
            detectedLandmarks,
            speakText
          });
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