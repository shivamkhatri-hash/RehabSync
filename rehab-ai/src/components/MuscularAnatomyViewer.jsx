import React, { useState, useEffect, useRef } from 'react';

/**
 * Dynamic Biomechanical Muscular Human Anatomy Viewer
 * Styled in the visual aesthetic of Reference 2.
 * Features:
 * - Real-time animated kinematic exercise execution loop (Squat, Bicep Curl, Shoulder Flexion, Knee Extension).
 * - Dynamic muscle recruitment glow (Quads, Biceps, Deltoids, Core).
 * - Interactive orbital target rings with live angle telemetry.
 * - Play / Pause / Speed playback controls.
 */

export const JOINT_TARGETS = {
  knee: { 
    id: 'knee', 
    name: 'Knee Extension & ROM', 
    muscle: 'Quadriceps (Vastus Medialis) & Patellar Tendon',
    exercise: 'Mini Squat',
    pin: { x: 235, y: 378 },
    recruitment: '92%'
  },
  shoulder: { 
    id: 'shoulder', 
    name: 'Shoulder Elevation (Scaption)', 
    muscle: 'Anterior & Lateral Deltoid, Supraspinatus',
    exercise: 'Shoulder Flexion',
    pin: { x: 260, y: 130 },
    recruitment: '88%'
  },
  elbow: { 
    id: 'elbow', 
    name: 'Elbow Flexion (Bicep Peak)', 
    muscle: 'Biceps Brachii & Brachioradialis',
    exercise: 'Bicep Curl',
    pin: { x: 272, y: 215 },
    recruitment: '95%'
  },
  hip: { 
    id: 'hip', 
    name: 'Hip Abduction & Stride', 
    muscle: 'Gluteus Medius & Tensor Fasciae Latae',
    exercise: 'Standing Hip Abduction',
    pin: { x: 235, y: 255 },
    recruitment: '84%'
  },
  core: { 
    id: 'core', 
    name: 'Core & Kinetic Neutrality', 
    muscle: 'Rectus Abdominis & Transverse Core',
    exercise: 'Torso Alignment',
    pin: { x: 200, y: 180 },
    recruitment: '80%'
  }
};

export default function MuscularAnatomyViewer({
  activeJoint = 'knee',
  exerciseName = 'Mini Squat',
  alertCount = 2,
  onJointClick = null
}) {
  const [selectedJoint, setSelectedJoint] = useState(activeJoint);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 0.5x, 1x, 1.5x
  const [animProgress, setAnimProgress] = useState(0); // 0 (start/eccentric) to 1 (peak concentric)

  // Sync activeJoint from prop if provided
  useEffect(() => {
    if (activeJoint && JOINT_TARGETS[activeJoint]) {
      setSelectedJoint(activeJoint);
    } else if (exerciseName) {
      const lower = exerciseName.toLowerCase();
      if (lower.includes('shoulder')) setSelectedJoint('shoulder');
      else if (lower.includes('bicep') || lower.includes('curl')) setSelectedJoint('elbow');
      else if (lower.includes('hip')) setSelectedJoint('hip');
      else if (lower.includes('crunch') || lower.includes('core')) setSelectedJoint('core');
      else setSelectedJoint('knee');
    }
  }, [activeJoint, exerciseName]);

  // Continuous Kinematic Exercise Animation Loop
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    let direction = 1;
    let progress = 0;

    const loop = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPlaying) {
        progress += (dt / 1.8) * speed * direction;
        if (progress >= 1) {
          progress = 1;
          direction = -1;
        } else if (progress <= 0) {
          progress = 0;
          direction = 1;
        }
        setAnimProgress(progress);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, speed]);

  const targetInfo = JOINT_TARGETS[selectedJoint] || JOINT_TARGETS.knee;

  // Dynamic Movement Calculations
  // 1. Squat kinematics (knee flexion)
  const isSquatting = selectedJoint === 'knee';
  const squatDropY = isSquatting ? animProgress * 18 : 0;
  const kneeSpreadX = isSquatting ? animProgress * 8 : 0;
  const liveSquatAngle = Math.round(175 - animProgress * 50); // 175° down to 125°

  // 2. Bicep curl kinematics (elbow flexion)
  const isCurling = selectedJoint === 'elbow';
  const armCurlAngle = isCurling ? animProgress * -75 : 0; // rotate forearm up 75 deg

  // 3. Shoulder flexion kinematics
  const isShoulderFlex = selectedJoint === 'shoulder';
  const shoulderElevationAngle = isShoulderFlex ? animProgress * -70 : 0; // rotate whole arm up 70 deg

  // Active highlighted muscle intensity
  const muscleGlowOpacity = 0.4 + animProgress * 0.5;

  return (
    <div className="relative w-full h-full min-h-[420px] max-h-[560px] rounded-3xl bg-gradient-to-b from-sky-50/60 via-white to-slate-50 border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden select-none">
      
      {/* Background Soft Atmospheric Radiance */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner, Target Selector & Controls matching Reference 2 */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex justify-between items-center w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-2xs text-xs font-black text-slate-800">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Biomechanical Muscle Recruiter</span>
          </div>

          {/* Animation Play/Pause & Speed Controller */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
              title={isPlaying ? "Pause Motion" : "Play Motion"}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* Speed Pills */}
            <div className="inline-flex bg-white/90 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
              {[0.5, 1, 1.5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-1.5 py-0.5 rounded-lg transition-all ${speed === s ? 'bg-slate-900 text-white font-black' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Joint Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Joint:</span>
          {Object.values(JOINT_TARGETS).map(j => (
            <button
              key={j.id}
              type="button"
              onClick={() => {
                setSelectedJoint(j.id);
                if (onJointClick) onJointClick(j.id);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                selectedJoint === j.id
                  ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {j.id === 'knee' ? '🦵 Knee' : j.id === 'shoulder' ? '💪 Shoulder' : j.id === 'elbow' ? '🏋️ Elbow' : j.id === 'hip' ? '🦴 Hip' : '🧘 Core'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dynamic Anatomy SVG Vector Figure with Real-time Movement */}
      <div className="relative flex-1 flex items-center justify-center my-1">
        <svg 
          viewBox="0 0 400 500" 
          className="w-full h-full max-h-[440px] drop-shadow-md"
        >
          <defs>
            {/* Muscle shading gradients */}
            <linearGradient id="muscleHead" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8cbb8" />
              <stop offset="100%" stopColor="#e39a82" />
            </linearGradient>

            <linearGradient id="muscleTorso" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97760" />
              <stop offset="40%" stopColor="#c5533c" />
              <stop offset="80%" stopColor="#b43f2a" />
              <stop offset="100%" stopColor="#8d2616" />
            </linearGradient>

            <linearGradient id="muscleActiveGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="muscleLeg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d2654f" />
              <stop offset="50%" stopColor="#b84732" />
              <stop offset="100%" stopColor="#8e2919" />
            </linearGradient>

            <linearGradient id="tendonBand" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>

          {/* DYNAMIC MUSCULAR HUMAN BODY with Kinematic Movement Transforms */}
          <g transform={`translate(0, ${10 + squatDropY})`}>
            
            {/* Head & Neck */}
            <ellipse cx="200" cy="52" rx="22" ry="28" fill="url(#muscleHead)" />
            <path d="M190,75 L180,105 L220,105 L210,75 Z" fill="url(#muscleTorso)" opacity="0.9" />

            {/* Shoulders & Trapezius */}
            <path d="M150,110 C170,95 230,95 250,110 L260,130 L140,130 Z" fill="url(#muscleTorso)" />

            {/* Deltoids (Highlights on Shoulder Flexion) */}
            <ellipse cx="140" cy="130" rx="16" ry="22" fill={isShoulderFlex ? "url(#muscleActiveGlow)" : "url(#muscleTorso)"} />
            <ellipse cx="260" cy="130" rx="16" ry="22" fill={isShoulderFlex ? "url(#muscleActiveGlow)" : "url(#muscleTorso)"} />

            {/* Pectoralis Major */}
            <path d="M150,125 C175,120 198,125 198,155 C175,160 152,150 148,135 Z" fill="url(#muscleTorso)" />
            <path d="M250,125 C225,120 202,125 202,155 C225,160 248,150 252,135 Z" fill="url(#muscleTorso)" />

            {/* Rectus Abdominis (Core Glow) */}
            <g fill={selectedJoint === 'core' ? "url(#muscleActiveGlow)" : "url(#muscleTorso)"}>
              <rect x="186" y="162" width="12" height="15" rx="3" />
              <rect x="202" y="162" width="12" height="15" rx="3" />
              <rect x="186" y="180" width="12" height="16" rx="3" />
              <rect x="202" y="180" width="12" height="16" rx="3" />
              <rect x="187" y="199" width="11" height="18" rx="3" />
              <rect x="202" y="199" width="11" height="18" rx="3" />
            </g>

            {/* Left Arm */}
            <path d="M135,150 C130,175 130,200 128,215 L140,215 C145,195 148,175 145,150 Z" fill="url(#muscleTorso)" />
            <path d="M128,220 C125,245 120,270 115,285 L128,285 C136,265 140,240 138,220 Z" fill="url(#muscleTorso)" />
            <path d="M115,288 C112,300 118,312 122,315 L126,295 Z" fill="url(#muscleHead)" />

            {/* Right Arm (Dynamically Elevates on Shoulder or Curls on Bicep) */}
            <g transform={isShoulderFlex ? `rotate(${shoulderElevationAngle}, 260, 130)` : ''}>
              {/* Upper Arm / Bicep (Bulges and glows on Bicep Curl) */}
              <path 
                d={`M265,150 C${270 + (isCurling ? animProgress * 6 : 0)},175 270,200 272,215 L260,215 C255,195 252,175 255,150 Z`} 
                fill={isCurling ? "url(#muscleActiveGlow)" : "url(#muscleTorso)"} 
              />

              {/* Forearm & Hand with Pivot Rotation on Elbow */}
              <g transform={isCurling ? `rotate(${armCurlAngle}, 266, 215)` : ''}>
                <path d="M272,220 C275,245 280,270 285,285 L272,285 C264,265 260,240 262,220 Z" fill="url(#muscleTorso)" />
                <path d="M285,288 C288,300 282,312 278,315 L274,295 Z" fill="url(#muscleHead)" />
              </g>
            </g>

            {/* Pelvis & Gluteal Basin */}
            <path d="M175,225 C190,230 210,230 225,225 L235,255 C210,265 190,265 165,255 Z" fill={selectedJoint === 'hip' ? "url(#muscleActiveGlow)" : "url(#muscleTorso)"} />

            {/* Thighs & Quadriceps (Knee Flexion Dynamics) */}
            {/* Left Thigh */}
            <path 
              d={`M165,255 C${150 - kneeSpreadX},290 ${145 - kneeSpreadX},340 152,370 L178,370 C185,340 190,290 192,260 Z`} 
              fill={isSquatting ? "url(#muscleActiveGlow)" : "url(#muscleLeg)"} 
            />
            {/* Right Thigh */}
            <path 
              d={`M235,255 C${250 + kneeSpreadX},290 ${255 + kneeSpreadX},340 248,370 L222,370 C215,340 210,290 208,260 Z`} 
              fill={isSquatting ? "url(#muscleActiveGlow)" : "url(#muscleLeg)"} 
            />

            {/* Patellar Tendon Bands */}
            <ellipse cx="165" cy="378" rx="10" ry="8" fill="url(#tendonBand)" />
            <ellipse cx="235" cy="378" rx="10" ry="8" fill="url(#tendonBand)" />

            {/* Lower Legs / Calves */}
            <path d="M152,385 C146,415 148,450 155,475 L172,475 C178,450 178,415 174,385 Z" fill="url(#muscleLeg)" />
            <path d="M248,385 C254,415 252,450 245,475 L228,475 C222,450 222,415 226,385 Z" fill="url(#muscleLeg)" />

            {/* Feet */}
            <path d="M152,475 C145,485 145,492 165,492 L172,475 Z" fill="url(#muscleHead)" />
            <path d="M248,475 C255,485 255,492 235,492 L228,475 Z" fill="url(#muscleHead)" />

            {/* KINETIC ORBITAL RINGS AROUND ACTIVE REGION (Reference 2) */}
            <g opacity="0.85">
              {/* Outer Blue Kinetic Ring */}
              <ellipse 
                cx="200" 
                cy={isSquatting ? 380 : selectedJoint === 'shoulder' ? 130 : selectedJoint === 'elbow' ? 215 : 255} 
                rx="95" 
                ry="24" 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="1.5" 
                opacity="0.7" 
              />
              {/* Mid Amber Orbital Ring */}
              <ellipse 
                cx="200" 
                cy={isSquatting ? 392 : selectedJoint === 'shoulder' ? 142 : selectedJoint === 'elbow' ? 225 : 265} 
                rx="85" 
                ry="20" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="1.2" 
                opacity="0.6" 
              />
              {/* Interactive Axis Slider Handle */}
              <g transform={`translate(186, ${isSquatting ? 368 : selectedJoint === 'shoulder' ? 118 : selectedJoint === 'elbow' ? 203 : 243})`}>
                <rect x="0" y="0" width="28" height="22" rx="6" fill="#0f172a" />
                <text x="14" y="15" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">&lt; &gt;</text>
              </g>
            </g>

            {/* Active Focal Pin Pulsing Ring */}
            <g className="cursor-pointer">
              <circle cx={targetInfo.pin.x} cy={targetInfo.pin.y} r="14" fill="none" stroke="#0284c7" strokeWidth="1.5" className="animate-ripple-ring" opacity="0.8" />
              <circle cx={targetInfo.pin.x} cy={targetInfo.pin.y} r="6" fill="#0284c7" />
            </g>
          </g>
        </svg>

        {/* Floating Callout Label Tag matching Reference 2 */}
        <div 
          className="absolute bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700/80 text-xs font-bold flex flex-col gap-0.5 animate-kinetic-fade"
          style={{
            top: selectedJoint === 'shoulder' ? '22%' : selectedJoint === 'elbow' ? '38%' : '65%',
            right: '4%'
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{targetInfo.name}</span>
          </div>
          <span className="text-[9px] font-medium text-slate-300">
            {targetInfo.recruitment} Target Muscle Recruitment
          </span>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="relative z-10 w-full pt-2 flex flex-wrap justify-between items-center text-[11px] text-slate-500 font-medium border-t border-slate-200/80 gap-2">
        <span className="capitalize font-extrabold text-slate-800">
          Target: <strong className="text-sky-700">{targetInfo.exercise}</strong> {isSquatting ? `(${liveSquatAngle}°)` : ''}
        </span>
        <span className="text-teal-600 font-black flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span>Active Kinematic Simulation</span>
        </span>
      </div>
    </div>
  );
}
