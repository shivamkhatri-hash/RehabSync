import React, { useState, useEffect, useRef } from 'react';

/**
 * High-Fidelity Dynamic Anatomical Bone & Joint Kinematics Viewer
 * Styled in the visual aesthetic of Reference 1 (Kinetic.health).
 * Supports:
 * - Dynamic joint articulation animation (flexion/extension motion loop).
 * - Multi-joint models (Knee, Shoulder, Hip, Spine, Ankle).
 * - Comprehensive Pathology Selector (ACL, Meniscus, Patellar, PCL, Rotator Cuff, Labrum, Disc, Achilles, etc.) + Custom Entry.
 * - 3D / MRI / X-Ray modality themes with glowing leader callouts.
 */

export const PATHOLOGY_CATALOG = {
  knee: [
    { id: 'acl', name: 'Right ACL Complex', target: 'Anterior Cruciate Ligament', pin: { x: 205, y: 180 }, defaultAngle: 125, desc: 'Primary anterior tibial restraint' },
    { id: 'meniscus', name: 'Medial Meniscus Horn', target: 'Medial & Lateral Meniscus', pin: { x: 160, y: 188 }, defaultAngle: 135, desc: 'Fibrocartilaginous shock absorber' },
    { id: 'patellar', name: 'Patellar Tendinopathy', target: 'Patellar Tendon', pin: { x: 200, y: 135 }, defaultAngle: 120, desc: 'Extensor power transmitter' },
    { id: 'pcl', name: 'PCL Posterior Complex', target: 'Posterior Cruciate Ligament', pin: { x: 220, y: 175 }, defaultAngle: 110, desc: 'Posterior tibial glide barrier' },
    { id: 'mcl', name: 'MCL Medial Stabilizer', target: 'Medial Collateral Ligament', pin: { x: 132, y: 165 }, defaultAngle: 140, desc: 'Valgus stress stabilizer' }
  ],
  shoulder: [
    { id: 'rotator_cuff', name: 'Supraspinatus Rotator Cuff', target: 'Rotator Cuff Tendon', pin: { x: 235, y: 120 }, defaultAngle: 145, desc: 'Abduction initiator & humeral depressor' },
    { id: 'labrum', name: 'Glenoid Labrum (SLAP)', target: 'Glenoid Labrum', pin: { x: 185, y: 135 }, defaultAngle: 130, desc: 'Socket deepening stability ring' },
    { id: 'subacromial', name: 'Subacromial Impingement', target: 'Subacromial Bursa', pin: { x: 215, y: 95 }, defaultAngle: 95, desc: 'Subacromial glide interface' },
    { id: 'biceps', name: 'Bicipital Groove Tendon', target: 'Long Head of Biceps', pin: { x: 220, y: 165 }, defaultAngle: 85, desc: 'Anterior humeral stabilizer' }
  ],
  hip: [
    { id: 'labrum', name: 'Acetabular Labrum Tear', target: 'Acetabular Labrum', pin: { x: 190, y: 135 }, defaultAngle: 115, desc: 'Femoral head suction seal' },
    { id: 'fai', name: 'Femoroacetabular Impingement', target: 'Cam / Pincer Abutment', pin: { x: 210, y: 160 }, defaultAngle: 100, desc: 'Femoral neck morphological abutment' },
    { id: 'gluteal', name: 'Gluteus Medius Insertion', target: 'Greater Trochanter Tendon', pin: { x: 235, y: 180 }, defaultAngle: 120, desc: 'Coronal pelvic stabilizer' }
  ],
  spine: [
    { id: 'disc', name: 'L4-L5 Lumbar Disc Herniation', target: 'Intervertebral Disc', pin: { x: 200, y: 160 }, defaultAngle: 80, desc: 'Nucleus pulposus axial cushion' },
    { id: 'facet', name: 'Facet Joint Arthropathy', target: 'Lumbar Facet Capsule', pin: { x: 225, y: 140 }, defaultAngle: 75, desc: 'Posterior gliding stabilizer' },
    { id: 'nerve', name: 'L5 Exiting Nerve Root', target: 'Neural Foramen Interface', pin: { x: 175, y: 175 }, defaultAngle: 70, desc: 'Radicular motor/sensory pathway' }
  ],
  ankle: [
    { id: 'achilles', name: 'Achilles Tendon Rupture / Tendinitis', target: 'Achilles Tendon Complex', pin: { x: 200, y: 180 }, defaultAngle: 90, desc: 'Plantarflexion propulsion transmitter' },
    { id: 'atfl', name: 'ATFL Lateral Ligament Sprain', target: 'Anterior Talofibular Ligament', pin: { x: 170, y: 220 }, defaultAngle: 85, desc: 'Inversion constraint ligament' }
  ]
};

export default function AnatomicalJointViewer({ 
  jointType = 'knee', 
  label = null,
  subLabel = null,
  romValue = 125,
  compact = false,
  onPathologyChange = null
}) {
  const [activeRegion, setActiveRegion] = useState(jointType);
  const [mode, setMode] = useState('3D'); // '3D', 'MRI', 'X-ray'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animProgress, setAnimProgress] = useState(0.5); // 0 (rest/extension) to 1 (full target flexion)
  
  // Available pathologies for current region
  const currentRegionList = PATHOLOGY_CATALOG[activeRegion] || PATHOLOGY_CATALOG.knee;
  const [selectedPathologyId, setSelectedPathologyId] = useState(currentRegionList[0].id);
  const [customPathologyText, setCustomPathologyText] = useState('');
  const [isCustomEditing, setIsCustomEditing] = useState(false);

  // Sync region when prop changes
  useEffect(() => {
    if (jointType && PATHOLOGY_CATALOG[jointType]) {
      setActiveRegion(jointType);
      const list = PATHOLOGY_CATALOG[jointType];
      setSelectedPathologyId(list[0].id);
    }
  }, [jointType]);

  // Selected pathology resolution
  const activePathology = currentRegionList.find(p => p.id === selectedPathologyId) || currentRegionList[0];
  const displayLabel = customPathologyText.trim() || label || activePathology.name;
  const displaySubLabel = subLabel || activePathology.target;

  // Continuous Kinematic Joint Articulation Animation Loop
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    let direction = 1;
    let progress = animProgress;

    const loop = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isAnimating) {
        progress += (dt / 2.2) * direction;
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
  }, [isAnimating]);

  // Computed joint dynamic articulation angle & transform
  const minAngle = 175; // full extension baseline
  const maxAngle = romValue || activePathology.defaultAngle || 120;
  const currentLiveAngle = Math.round(minAngle - animProgress * (minAngle - maxAngle));

  // Mode-based color palettes
  const modeStyles = {
    '3D': {
      bgGradient: 'from-slate-50 via-white to-amber-50/30',
      boneFill: 'url(#boneGrad3D)',
      cartilageFill: 'url(#cartilageGrad3D)',
      tendonFill: 'url(#tendonGrad3D)',
      hotspotColor: '#f97316',
      accent: 'text-amber-600'
    },
    'MRI': {
      bgGradient: 'from-slate-900 via-slate-850 to-slate-950',
      boneFill: 'url(#boneGradMRI)',
      cartilageFill: 'url(#cartilageGradMRI)',
      tendonFill: 'url(#tendonGradMRI)',
      hotspotColor: '#38bdf8',
      accent: 'text-sky-400'
    },
    'X-ray': {
      bgGradient: 'from-slate-950 via-slate-900 to-indigo-950',
      boneFill: 'url(#boneGradXray)',
      cartilageFill: 'url(#cartilageGradXray)',
      tendonFill: 'url(#tendonGradXray)',
      hotspotColor: '#a855f7',
      accent: 'text-purple-400'
    }
  };

  const currentTheme = modeStyles[mode];
  const activePin = activePathology.pin || { x: 200, y: 175 };

  // Calculate dynamic rotation angle for distal bone (Tibia or Forearm)
  const rotationDeg = (animProgress * 22) - 11; // +/- 11 degrees pivot

  const handleSelectPathology = (item) => {
    setSelectedPathologyId(item.id);
    setCustomPathologyText('');
    setIsCustomEditing(false);
    if (onPathologyChange) onPathologyChange(item);
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-br ${currentTheme.bgGradient} border border-slate-200/80 shadow-sm flex flex-col justify-between transition-colors duration-500 select-none ${compact ? 'h-[360px]' : 'h-[440px] sm:h-[480px]'}`}>
      
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Controls Overlay: Region Tabs, Modality Pills & View Tools */}
      <div className="relative z-10 p-4 space-y-2.5">
        <div className="flex flex-wrap justify-between items-center gap-2">
          
          {/* Anatomical Region Switcher */}
          <div className="inline-flex bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
            {[
              { id: 'knee', label: '🦵 Knee' },
              { id: 'shoulder', label: '💪 Shoulder' },
              { id: 'hip', label: '🦴 Hip' },
              { id: 'spine', label: '🧬 Spine' },
              { id: 'ankle', label: '🦶 Ankle' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setActiveRegion(r.id);
                  const first = PATHOLOGY_CATALOG[r.id][0];
                  setSelectedPathologyId(first.id);
                  setCustomPathologyText('');
                }}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  activeRegion === r.id
                    ? 'bg-teal-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Right Tools: Modality + Playback + Zoom */}
          <div className="flex items-center gap-2">
            {/* Modality Selector */}
            <div className="inline-flex bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-xs">
              {['3D', 'MRI', 'X-ray'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    mode === m
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Articulation Motion Play/Pause Toggle */}
            <button
              type="button"
              onClick={() => setIsAnimating(!isAnimating)}
              title={isAnimating ? "Pause Joint Articulation" : "Play Joint Articulation"}
              className={`px-2.5 py-1 rounded-2xl border font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                isAnimating 
                  ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{isAnimating ? '⏸️' : '▶️'}</span>
              <span className="hidden sm:inline">{isAnimating ? 'Articulating' : 'Static'}</span>
            </button>

            {/* Zoom / Reset */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                title="Zoom In"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.4))}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                +
              </button>
              <button
                type="button"
                title="Zoom Out"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                -
              </button>
              <button
                type="button"
                title="Reset View"
                onClick={() => setZoomLevel(1)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                ↺
              </button>
            </div>
          </div>
        </div>

        {/* Pathology Selector Quick Chips Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Target Focus:</span>
          {currentRegionList.map(p => {
            const isSelected = selectedPathologyId === p.id && !customPathologyText;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPathology(p)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                {p.name.split(' ')[0]} {p.name.includes('ACL') ? 'ACL' : p.name.includes('PCL') ? 'PCL' : p.name.includes('MCL') ? 'MCL' : ''}
              </button>
            );
          })}

          {/* Custom Pathology Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCustomEditing(!isCustomEditing)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
              isCustomEditing || customPathologyText 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white'
            }`}
          >
            ✏️ Custom Focus
          </button>
        </div>

        {/* Custom Pathology Text Input Field */}
        {isCustomEditing && (
          <div className="flex items-center gap-2 bg-white/95 p-2 rounded-2xl border border-amber-300 shadow-sm animate-kinetic-fade">
            <input 
              type="text"
              placeholder="e.g., Grade II Medial Meniscus Tear or Anterolateral Ligament"
              value={customPathologyText}
              onChange={(e) => setCustomPathologyText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
            />
            <button
              type="button"
              onClick={() => setIsCustomEditing(false)}
              className="bg-slate-900 text-white px-3 py-1 rounded-xl text-xs font-bold"
            >
              Set Pin
            </button>
          </div>
        )}
      </div>

      {/* Main Dynamic Anatomical SVG Articulation Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <svg 
          viewBox="0 0 400 320" 
          className="w-full h-full max-h-80 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* 3D Mode Gradients */}
            <linearGradient id="boneGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdfbf7" />
              <stop offset="40%" stopColor="#ebd7c1" />
              <stop offset="85%" stopColor="#c5a98d" />
              <stop offset="100%" stopColor="#967b62" />
            </linearGradient>
            <linearGradient id="cartilageGrad3D" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="60%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="tendonGrad3D" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>

            {/* MRI Mode Gradients */}
            <linearGradient id="boneGradMRI" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="cartilageGradMRI" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="tendonGradMRI" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* X-Ray Mode Gradients */}
            <linearGradient id="boneGradXray" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="cartilageGradXray" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="tendonGradXray" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            <filter id="jointShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="2" dy="8" stdDeviation="6" floodOpacity="0.2" floodColor="#0f172a" />
            </filter>
          </defs>

          {/* DYNAMIC ANATOMICAL ARTICULATION MODELS */}

          {/* 1. KNEE ARTICULATION (FEMUR, TIBIA, LIGAMENTS, PATELLA) */}
          {activeRegion === 'knee' && (
            <g filter="url(#jointShadow)">
              {/* Static Distal Femur */}
              <path 
                d="M140,20 C145,70 140,100 130,125 C120,145 130,165 155,168 C175,170 190,150 200,140 C210,150 225,170 245,168 C270,165 280,145 270,125 C260,100 255,70 260,20 Z" 
                fill={currentTheme.boneFill}
                stroke="#ffffff33"
                strokeWidth="1.5"
              />
              {/* Condyle Cartilage */}
              <path d="M132,130 C138,155 150,166 160,166 C170,166 182,154 188,142" fill="none" stroke={currentTheme.cartilageFill} strokeWidth="6" strokeLinecap="round" />
              <path d="M212,142 C218,154 230,166 240,166 C250,166 262,155 268,130" fill="none" stroke={currentTheme.cartilageFill} strokeWidth="6" strokeLinecap="round" />

              {/* Cruciate Ligaments (ACL/PCL) with Dynamic Tension Stretch */}
              <path 
                d={`M175,160 C${185 + rotationDeg * 0.5},175 ${210 - rotationDeg * 0.5},195 220,${210 + rotationDeg * 0.3}`} 
                stroke={currentTheme.tendonFill} 
                strokeWidth={selectedPathologyId === 'acl' ? 14 : 10} 
                strokeLinecap="round" 
                fill="none" 
              />
              <path 
                d={`M225,160 C215,180 185,200 178,${215 + rotationDeg * 0.2}`} 
                stroke="#94a3b8" 
                strokeOpacity="0.4"
                strokeWidth={selectedPathologyId === 'pcl' ? 12 : 7} 
                strokeLinecap="round" 
                fill="none" 
              />

              {/* Collateral Ligaments (MCL/LCL) */}
              <path d="M125,125 C120,160 122,200 126,230" stroke={selectedPathologyId === 'mcl' ? currentTheme.tendonFill : '#94a3b8'} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />

              {/* Menisci Discs */}
              <ellipse cx="160" cy="188" rx="26" ry={selectedPathologyId === 'meniscus' ? 9 : 7} fill={currentTheme.cartilageFill} />
              <ellipse cx="240" cy="188" rx="26" ry="7" fill={currentTheme.cartilageFill} />

              {/* Dynamically Articulating Tibia & Fibula */}
              <g transform={`rotate(${rotationDeg}, 200, 190)`}>
                <path 
                  d="M130,190 C135,210 150,215 165,215 C190,215 200,210 200,210 C200,210 210,215 235,215 C250,215 265,210 270,190 C265,225 245,260 240,310 L160,310 C155,260 135,225 130,190 Z" 
                  fill={currentTheme.boneFill}
                  stroke="#ffffff33"
                  strokeWidth="1.5"
                />
                <path d="M122,210 C128,218 126,230 120,250 C115,270 110,290 108,310 L125,310 C130,285 135,260 138,235 Z" fill={currentTheme.boneFill} opacity="0.85" />
              </g>

              {/* Floating Patella Cap */}
              <ellipse cx="200" cy={`${120 + animProgress * 8}`} rx="24" ry="20" fill={currentTheme.boneFill} opacity="0.9" stroke="#ffffff55" strokeWidth="1" />
            </g>
          )}

          {/* 2. SHOULDER ARTICULATION (GLENOHUMERAL, SCAPULA, ROTATOR CUFF) */}
          {activeRegion === 'shoulder' && (
            <g filter="url(#jointShadow)">
              {/* Scapula & Glenoid Cavity */}
              <path d="M110,60 C150,55 190,80 185,130 C180,180 140,210 90,200 C80,150 90,90 110,60 Z" fill={currentTheme.boneFill} stroke="#ffffff40" strokeWidth="1.5" />
              
              {/* Dynamically Elevating Humeral Head & Shaft */}
              <g transform={`rotate(${rotationDeg * 1.5}, 230, 140)`}>
                <circle cx="230" cy="140" r="55" fill={currentTheme.boneFill} />
                <path d="M210,185 C215,220 225,270 230,300 L270,290 C260,250 250,200 245,175 Z" fill={currentTheme.boneFill} />
                {/* Rotator Cuff Tendon */}
                <path d="M140,95 C180,90 220,105 240,120 L235,135 C210,120 170,110 135,115 Z" fill={currentTheme.tendonFill} />
              </g>
            </g>
          )}

          {/* 3. HIP ARTICULATION (ACETABULUM, FEMORAL HEAD) */}
          {activeRegion === 'hip' && (
            <g filter="url(#jointShadow)">
              <path d="M100,50 C160,45 220,70 230,130 C200,160 150,155 120,130 C100,100 90,70 100,50 Z" fill={currentTheme.boneFill} />
              <g transform={`rotate(${rotationDeg * 0.8}, 190, 150)`}>
                <circle cx="190" cy="150" r="45" fill={currentTheme.boneFill} />
                <path d="M180,185 C190,230 205,280 215,310 L255,300 C240,250 220,200 210,175 Z" fill={currentTheme.boneFill} />
              </g>
              {/* Labrum Cushion */}
              <path d="M150,115 C175,125 210,140 225,165" stroke={currentTheme.tendonFill} strokeWidth="9" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* 4. SPINE ARTICULATION (VERTEBRAE, INTERVERTEBRAL DISC, NERVES) */}
          {activeRegion === 'spine' && (
            <g filter="url(#jointShadow)">
              {/* Superior Vertebral Body L4 */}
              <rect x="140" y="70" width="120" height="50" rx="12" fill={currentTheme.boneFill} stroke="#ffffff40" strokeWidth="1.5" />
              {/* Intervertebral Disc with Pulsing Herniation */}
              <rect x="145" y="130" width="110" height="24" rx="8" fill={currentTheme.cartilageFill} />
              <ellipse cx="230" cy="142" rx={`${8 + animProgress * 4}`} ry="7" fill={currentTheme.tendonFill} />
              {/* Inferior Vertebral Body L5 */}
              <rect x="140" y="165" width="120" height="55" rx="12" fill={currentTheme.boneFill} stroke="#ffffff40" strokeWidth="1.5" />
              {/* Exiting Nerve Root */}
              <path d="M170,120 C160,145 155,170 145,210" stroke="#facc15" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.85" />
            </g>
          )}

          {/* 5. ANKLE ARTICULATION (TIBIA/FIBULA, TALUS, ACHILLES TENDON) */}
          {activeRegion === 'ankle' && (
            <g filter="url(#jointShadow)">
              {/* Distal Tibia & Fibula */}
              <path d="M150,40 L150,150 C150,180 180,190 200,190 L200,40 Z" fill={currentTheme.boneFill} />
              <path d="M130,50 L130,180 L145,180 L145,50 Z" fill={currentTheme.boneFill} opacity="0.85" />
              {/* Talus & Calcaneus Heel with Dorsiflexion Rotation */}
              <g transform={`rotate(${rotationDeg * 1.2}, 185, 190)`}>
                <ellipse cx="185" cy="205" rx="35" ry="22" fill={currentTheme.boneFill} />
                <path d="M160,210 C140,225 125,245 125,270 L240,270 C240,240 215,225 190,215 Z" fill={currentTheme.boneFill} />
              </g>
              {/* Achilles Tendon */}
              <path d="M205,50 C205,120 202,180 195,240" stroke={currentTheme.tendonFill} strokeWidth="10" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* DYNAMIC FOCAL HOTSPOT & LEADER LINE */}
          <g>
            {/* Outer Ripple Rings */}
            <circle cx={activePin.x} cy={activePin.y} r="18" fill="none" stroke={currentTheme.hotspotColor} strokeWidth="1.5" className="animate-ripple-ring" opacity="0.7" />
            <circle cx={activePin.x} cy={activePin.y} r="10" fill="none" stroke={currentTheme.hotspotColor} strokeWidth="2" className="animate-pulse-subtle" />
            {/* Core Pin */}
            <circle cx={activePin.x} cy={activePin.y} r="5" fill={currentTheme.hotspotColor} />
            
            {/* Dynamic Leader Line */}
            <path 
              d={`M${activePin.x + 5},${activePin.y} L${activePin.x + 45},${activePin.y - 15} L${activePin.x + 75},${activePin.y - 15}`} 
              stroke={mode === '3D' ? '#0f172a' : '#ffffff'} 
              strokeWidth="1.2" 
              strokeDasharray="2 2"
              fill="none" 
            />
          </g>
        </svg>

        {/* Floating Callout Badge matching Reference 1 */}
        <div className="absolute top-1/2 right-3 sm:right-8 -translate-y-1/2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-lg flex items-center gap-3 animate-kinetic-fade">
          <div>
            <div className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{displayLabel}</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{displaySubLabel}</div>
          </div>
          <div className="w-6 h-6 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
            ›
          </div>
        </div>
      </div>

      {/* Bottom Sub-Bar: Real-time Live Articulation Telemetry */}
      <div className="relative z-10 px-4 py-2.5 bg-white/70 backdrop-blur-md border-t border-slate-200/60 flex flex-wrap justify-between items-center text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-700 text-[11px]">Dynamic Articulation: <strong className="font-mono text-slate-900">{currentLiveAngle}° Flexion</strong></span>
        </div>
        <div className="text-slate-500 font-mono text-[11px] font-bold">
          Target ROM: <span className="text-teal-700 font-black">{maxAngle}° Flexion</span> • <span className="text-slate-400 capitalize">{activeRegion}</span>
        </div>
      </div>
    </div>
  );
}
