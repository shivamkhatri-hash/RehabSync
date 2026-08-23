const SKELETON_CONNECTIONS = [
  [11, 12],            // Shoulder to shoulder
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 23], [12, 24], // Torso side links (shoulder to hip)
  [23, 24],            // Hip to hip
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28]  // Right leg
];

const STICK_FIGURE_JOINTS = [
  11, 12, 13, 14, 15, 16,
  23, 24, 25, 26, 27, 28
];

export const init = () => ({
  rotationY: 0,
  autoRotate: false, // Turn off continuous auto-rotate to align static body mirror posture
  isDragging: false,
  startX: 0,
  startRotation: 0,
  frameCount: 0
});

const drawAnatomicalBoneShape = (ctx, ptA, ptB, isActive, isHolding, isPostureInvalid) => {
  if (!ptA || !ptB || !ptA.visible || !ptB.visible) return;

  const dx = ptB.x - ptA.x;
  const dy = ptB.y - ptA.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len === 0) return;

  const ox = -dy / len;
  const oy = dx / len;

  const midX = (ptA.x + ptB.x) / 2;
  const midY = (ptA.y + ptB.y) / 2;

  // Render curved anatomical bone outline (narrower shaft, wider caps)
  ctx.beginPath();
  ctx.moveTo(ptA.x + ox * 5.5, ptA.y + oy * 5.5);
  ctx.quadraticCurveTo(midX + ox * 2.2, midY + oy * 2.2, ptB.x + ox * 5.5, ptB.y + oy * 5.5);
  ctx.arc(ptB.x, ptB.y, 5.5, Math.atan2(oy, ox), Math.atan2(-oy, -ox));
  ctx.lineTo(ptB.x - ox * 5.5, ptB.y - oy * 5.5);
  ctx.quadraticCurveTo(midX - ox * 2.2, midY - oy * 2.2, ptA.x - ox * 5.5, ptA.y - oy * 5.5);
  ctx.arc(ptA.x, ptA.y, 5.5, Math.atan2(-oy, -ox), Math.atan2(oy, ox));
  ctx.closePath();

  if (isActive) {
    ctx.fillStyle = isPostureInvalid ? 'rgba(239, 68, 68, 0.8)' : (isHolding ? 'rgba(236, 72, 153, 0.8)' : 'rgba(20, 184, 166, 0.8)');
    ctx.strokeStyle = isPostureInvalid ? '#ef4444' : (isHolding ? '#ec4899' : '#22d3ee');
    ctx.lineWidth = 1;
    ctx.shadowColor = isPostureInvalid ? 'rgba(239, 68, 68, 0.45)' : (isHolding ? 'rgba(236, 72, 153, 0.45)' : 'rgba(34, 211, 238, 0.45)');
    ctx.shadowBlur = 8;
  } else {
    ctx.fillStyle = 'rgba(203, 213, 225, 0.22)'; 
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.shadowBlur = 0;
  }
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Active muscle marrow mesh highlights
  if (isActive) {
    ctx.strokeStyle = isPostureInvalid ? 'rgba(239, 68, 68, 0.22)' : 'rgba(20, 184, 166, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let f = 0.25; f < 0.85; f += 0.25) {
      const px = ptA.x + dx * f;
      const py = ptA.y + dy * f;
      ctx.moveTo(px + ox * 2.5, py + oy * 2.5);
      ctx.lineTo(px - ox * 2.5, py - oy * 2.5);
    }
    ctx.stroke();
  }
};

const drawMuscleVolume = (ctx, ptA, ptB, name, activationVal, sideMultiplier = 1) => {
  if (!ptA || !ptB || !ptA.visible || !ptB.visible) return;

  const dx = ptB.x - ptA.x;
  const dy = ptB.y - ptA.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len === 0) return;

  const ox = -dy / len;
  const oy = dx / len;

  const midX = (ptA.x + ptB.x) / 2;
  const midY = (ptA.y + ptB.y) / 2;

  let fillColor = 'rgba(16, 185, 129, 0.38)'; // green
  let strokeColor = 'rgba(16, 185, 129, 0.6)';
  if (activationVal < 50) {
    fillColor = 'rgba(239, 68, 68, 0.35)'; // red
    strokeColor = 'rgba(239, 68, 68, 0.6)';
  } else if (activationVal < 75) {
    fillColor = 'rgba(234, 179, 8, 0.35)'; // yellow
    strokeColor = 'rgba(234, 179, 8, 0.6)';
  }

  ctx.beginPath();
  ctx.moveTo(ptA.x, ptA.y);
  
  const bulgeDistance = len * 0.22; 
  const bx = midX + ox * bulgeDistance * sideMultiplier;
  const by = midY + oy * bulgeDistance * sideMultiplier;

  ctx.quadraticCurveTo(bx, by, ptB.x, ptB.y);
  ctx.lineTo(ptB.x - ox * 2, ptB.y - oy * 2);
  ctx.quadraticCurveTo(midX - ox * 2 * sideMultiplier, midY - oy * 2 * sideMultiplier, ptA.x, ptA.y);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.8;
  ctx.fill();
  ctx.stroke();
};

const drawGluteusMuscle = (ctx, hipPt, cosY) => {
  if (!hipPt || !hipPt.visible) return;
  ctx.beginPath();
  // Bulges backwards
  ctx.arc(hipPt.x - 7 * cosY, hipPt.y + 4, 13 * Math.abs(cosY), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.32)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
  ctx.lineWidth = 0.8;
  ctx.fill();
  ctx.stroke();
};

const drawFloatingLabel = (ctx, pt, text, alignLeft = false) => {
  if (!pt || !pt.visible) return;
  
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  
  // Dotted pointer line
  const lx = alignLeft ? pt.x - 36 : pt.x + 36;
  ctx.moveTo(pt.x, pt.y);
  ctx.lineTo(lx, pt.y);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Joint dot
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#22d3ee';
  ctx.fill();

  // Floating label box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.lineWidth = 1;
  const tx = alignLeft ? lx - 44 : lx;
  ctx.fillRect(tx, pt.y - 7, 44, 14);
  ctx.strokeRect(tx, pt.y - 7, 44, 14);
  
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, tx + 22, pt.y + 3);
};

export const draw = (ctx, canvas, state, params) => {
  const { 
    detectedLandmarks, 
    resolvedJoints, 
    isHolding, 
    isPostureInvalid, 
    postureAlert,
    liveAngleVal,
    currentExercise,
    selectedArm
  } = params;

  state.frameCount = (state.frameCount || 0) + 1;

  // Background style: dark high-tech holographic laboratory
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(1, '#02060c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Auto rotate slowly if enabled
  if (state.autoRotate && !state.isDragging) {
    state.rotationY += 0.008;
  }

  // Shift center to the left to allocate 200px sidebar on the right
  const cx = (canvas.width - 200) / 2;
  const cy = canvas.height / 2 - 20;
  const distance = 420;
  const cosY = Math.cos(state.rotationY);
  const sinY = Math.sin(state.rotationY);
  const floorY = 160;

  // 1. Draw floor grids centered in left viewport
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.05)';
  ctx.lineWidth = 1;

  for (let gridX = -130; gridX <= 130; gridX += 26) {
    ctx.beginPath();
    for (let gridZ = -130; gridZ <= 130; gridZ += 13) {
      const rotX = gridX * cosY - gridZ * sinY;
      const rotZ = gridX * sinY + gridZ * cosY;
      const scale = distance / (distance + rotZ);
      const px = cx + rotX * scale;
      const py = cy + floorY * scale;
      if (gridZ === -130) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  for (let gridZ = -130; gridZ <= 130; gridZ += 26) {
    ctx.beginPath();
    for (let gridX = -130; gridX <= 130; gridX += 13) {
      const rotX = gridX * cosY - gridZ * sinY;
      const rotZ = gridX * sinY + gridZ * cosY;
      const scale = distance / (distance + rotZ);
      const px = cx + rotX * scale;
      const py = cy + floorY * scale;
      if (gridX === -130) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Compass ring
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.1)';
  ctx.beginPath();
  for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
    const rx = 85 * Math.cos(angle);
    const rz = 85 * Math.sin(angle);
    const rotX = rx * cosY - rz * sinY;
    const rotZ = rx * sinY + rz * cosY;
    const scale = distance / (distance + rotZ);
    const px = cx + rotX * scale;
    const py = cy + floorY * scale;
    if (angle === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 2. Draw HUD Joint Analytics telemetry panel on the right side
  ctx.save();
  ctx.fillStyle = '#080d16';
  ctx.fillRect(440, 0, 200, canvas.height);

  // Divider border
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(440, 0);
  ctx.lineTo(440, canvas.height);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(440, 0, 200, 42);
  ctx.beginPath();
  ctx.moveTo(440, 42);
  ctx.lineTo(640, 42);
  ctx.stroke();

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText("📊 JOINT ANALYTICS", 454, 26);

  // Patient metadata
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px monospace';
  ctx.fillText("PATIENT: ALEX JOHNSON", 454, 60);
  ctx.fillText("AGE: 28 | SESSION: 14", 454, 71);

  const moveName = (currentExercise?.name || 'ACTIVE THERAPY').toUpperCase();
  ctx.fillStyle = '#14b8a6';
  ctx.font = 'black 9px monospace';
  ctx.fillText(`MOVEMENT: ${moveName}`, 454, 86);

  // Synchronization Waveform box
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(452, 102, 176, 52);
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.strokeRect(452, 102, 176, 52);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 7.5px monospace';
  ctx.fillText("SYNCHRONIZATION: 98%", 458, 114);

  // Draw ECG-style synchronization wave
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 162; i++) {
    const angle = (state.frameCount + i) * 0.08;
    const waveY = 136 + Math.sin(angle) * 10 + Math.cos(angle * 0.35) * 3;
    if (i === 0) ctx.moveTo(458 + i, waveY);
    else ctx.lineTo(458 + i, waveY);
  }
  ctx.stroke();

  const isLowerBody = moveName.includes('SQUAT') || moveName.includes('KNEE') || moveName.includes('HIP') || moveName.includes('CALF') || moveName.includes('LUNGE') || moveName.includes('STAND') || moveName.includes('BALANCE');
  const isUpperBody = moveName.includes('CURL') || moveName.includes('PUSH') || moveName.includes('SHOULDER') || moveName.includes('ARM') || moveName.includes('WALL');
  const isFullBody = moveName.includes('STAND') || moveName.includes('DOG');

  const showUpper = isFullBody || isUpperBody || (!isLowerBody);
  const showLower = isFullBody || isLowerBody;

  const m1 = isLowerBody ? 'Quads' : 'Biceps';
  const m2 = isLowerBody ? 'Hamstrings' : 'Deltoids';
  const m3 = isLowerBody ? 'Glutes' : 'Forearms';

  const drawProgressBarHUD = (y, name, val, color) => {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`${name}: ${val}%`, 454, y);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(454, y + 4, 172, 4);
    ctx.fillStyle = color;
    ctx.fillRect(454, y + 4, 172 * (val / 100), 4);
  };

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 8px monospace';
  ctx.fillText("MUSCLE ACTIVATION:", 454, 176);

  drawProgressBarHUD(192, m1, isHolding ? 95 : 88, '#10b981');
  drawProgressBarHUD(214, m2, 45, '#eab308');
  drawProgressBarHUD(236, m3, 74, '#10b981');

  // Angle tracking section
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(452, 258, 176, 68);
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.strokeRect(452, 258, 176, 68);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 8px monospace';
  ctx.fillText("KNEE FLEXION", 458, 271);

  const angleValStr = liveAngleVal !== undefined ? `${liveAngleVal}°` : '---';
  const targetAngleStr = currentExercise?.success_angle !== undefined ? `${currentExercise.success_angle}°` : '---';

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'black 17px monospace';
  ctx.fillText(angleValStr, 458, 294);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px monospace';
  ctx.fillText(`GOAL THRESHOLD: ${targetAngleStr}`, 458, 312);

  // Symmetry indicators
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 8px monospace';
  ctx.fillText("SYMMETRY INDEX: 96%", 454, 348);

  // Active status circle
  ctx.fillStyle = isPostureInvalid ? '#ef4444' : '#10b981';
  ctx.beginPath();
  ctx.arc(460, 368, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isPostureInvalid ? '#ef4444' : '#10b981';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(isPostureInvalid ? "FORM FAULT ALERT" : "ACTIVE MONITORING [ON]", 470, 371);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px monospace';
  ctx.fillText("LIVE DATA TELEMETRY", 454, 392);
  ctx.restore();

  // Left side watermark HUD
  ctx.fillStyle = 'rgba(20, 184, 166, 0.4)';
  ctx.font = 'bold 9px monospace';
  ctx.fillText("HOLOGRAPHIC SKELETON FEED", 20, 40);
  ctx.fillText(`VIEW ROTATION: ${Math.round(state.rotationY * (180 / Math.PI)) % 360}°`, 20, 52);

  // Draw interactive RESET VIEW button (20, 435, 80, 22)
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
  ctx.lineWidth = 1;
  ctx.fillRect(20, 435, 80, 22);
  ctx.strokeRect(20, 435, 80, 22);
  ctx.fillStyle = '#14b8a6';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText("🔄 RESET VIEW", 60, 449);
  ctx.restore();

  // 4. Return early if landmarks are not detected yet
  if (!detectedLandmarks || detectedLandmarks.length < 33) {
    ctx.fillStyle = 'rgba(20, 184, 166, 0.75)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("⚠️ WAITING FOR AI JOINT SCANS...", cx, cy - 10);
    return;
  }

  // 5. Resolve pelvis midpoint with camera close-up fallback
  const hipL = detectedLandmarks[23];
  const hipR = detectedLandmarks[24];
  const shoulderL_raw = detectedLandmarks[11];
  const shoulderR_raw = detectedLandmarks[12];
  
  let pelvisX, pelvisY, pelvisZ;
  let fallbackHips = false;

  if (hipL && hipR && (hipL.visibility ?? 1) > 0.40 && (hipR.visibility ?? 1) > 0.40) {
    pelvisX = (hipL.x + hipR.x) / 2;
    pelvisY = (hipL.y + hipR.y) / 2;
    pelvisZ = (hipL.z + hipR.z) / 2;
  } else if (shoulderL_raw && shoulderR_raw) {
    pelvisX = (shoulderL_raw.x + shoulderR_raw.x) / 2;
    pelvisY = (shoulderL_raw.y + shoulderR_raw.y) / 2 + 0.38;
    pelvisZ = (shoulderL_raw.z + shoulderR_raw.z) / 2;
    fallbackHips = true;
  } else {
    pelvisX = 0.5;
    pelvisY = 0.5;
    pelvisZ = 0.0;
    fallbackHips = true;
  }

  // 6. Project MediaPipe coordinates to centered 3D rotated space
  const projected3D = detectedLandmarks.map((pt, idx) => {
    let dx = (1 - pt.x) - (1 - pelvisX);
    let dy = pt.y - pelvisY;
    let dz = pt.z - pelvisZ;

    if (fallbackHips && (idx === 23 || idx === 24 || idx === 25 || idx === 26 || idx === 27 || idx === 28)) {
      if (idx === 23) { dx = -0.11; dy = 0.38; dz = 0.0; }
      if (idx === 24) { dx = 0.11; dy = 0.38; dz = 0.0; }
      if (idx === 25) { dx = -0.12; dy = 0.65; dz = 0.05; }
      if (idx === 26) { dx = 0.12; dy = 0.65; dz = 0.05; }
      if (idx === 27) { dx = -0.12; dy = 0.90; dz = 0.08; }
      if (idx === 28) { dx = 0.12; dy = 0.90; dz = 0.08; }
    }

    const scaleFactor = 260; 
    const x3d = dx * scaleFactor;
    const y3d = dy * scaleFactor;
    // Dampen depth coordinate to 35% to suppress MediaPipe Z-jitter/noise
    const z3d = dz * scaleFactor * 0.35;

    const rotX = x3d * cosY - z3d * sinY;
    const rotZ = x3d * sinY + z3d * cosY;
    const rotY = y3d;

    // Orthographic projection preserves body proportions perfectly without depth warping
    return {
      x: cx + rotX,
      y: cy + rotY,
      z: rotZ,
      visible: fallbackHips || (pt.visibility ?? 1) > 0.40
    };
  });

  const activeSet = new Set(resolvedJoints || []);

  const leftHip = projected3D[23];
  const leftKnee = projected3D[25];
  const leftAnkle = projected3D[27];
  
  const rightHip = projected3D[24];
  const rightKnee = projected3D[26];
  const rightAnkle = projected3D[28];

  // 7. Draw muscle volumes first (so bones render on top)
  if (showLower) {
    // Thigh Muscles (Quads & Hamstrings)
    drawMuscleVolume(ctx, leftHip, leftKnee, "Quads", 88, 1);
    drawMuscleVolume(ctx, leftHip, leftKnee, "Hamstrings", 45, -1);
    drawMuscleVolume(ctx, rightHip, rightKnee, "Quads", 88, 1);
    drawMuscleVolume(ctx, rightHip, rightKnee, "Hamstrings", 45, -1);

    // Calf Muscles (Gastrocnemius)
    drawMuscleVolume(ctx, leftKnee, leftAnkle, "Calf", 74, -1);
    drawMuscleVolume(ctx, rightKnee, rightAnkle, "Calf", 74, -1);

    // Glutes (Buttocks)
    drawGluteusMuscle(ctx, leftHip, cosY);
    drawGluteusMuscle(ctx, rightHip, cosY);
  }

  if (showUpper && !showLower) {
    // Draw Biceps bulges for upper body curls/rehab
    drawMuscleVolume(ctx, projected3D[11], projected3D[13], "Biceps", 88, 1);
    drawMuscleVolume(ctx, projected3D[12], projected3D[14], "Biceps", 88, 1);
  }

  // 8. Draw active skeletal bones only
  const filteredConnections = SKELETON_CONNECTIONS.filter(([a, b]) => {
    const isArmA = [13, 14, 15, 16].includes(a);
    const isArmB = [13, 14, 15, 16].includes(b);
    const isLegA = [25, 26, 27, 28].includes(a);
    const isLegB = [25, 26, 27, 28].includes(b);
    const isHipA = [23, 24].includes(a);
    const isHipB = [23, 24].includes(b);

    if (isUpperBody && !isFullBody) {
      if (isLegA || isLegB || isHipA || isHipB) return false;
    }
    if (isLowerBody && !isFullBody) {
      if (isArmA || isArmB || [11, 12].includes(a) || [11, 12].includes(b)) return false;
    }
    return true;
  });

  filteredConnections.forEach(([a, b]) => {
    const ptA = projected3D[a];
    const ptB = projected3D[b];
    const isActive = activeSet.has(a) && activeSet.has(b);
    drawAnatomicalBoneShape(ctx, ptA, ptB, isActive, isHolding, isPostureInvalid);
  });

  // 9. Draw Spine & Rib cage
  const shoulderL = projected3D[11];
  const shoulderR = projected3D[12];
  const neck = shoulderL && shoulderR && shoulderL.visible && shoulderR.visible ? {
    x: (shoulderL.x + shoulderR.x) / 2,
    y: (shoulderL.y + shoulderR.y) / 2,
    z: (shoulderL.z + shoulderR.z) / 2
  } : null;

  const pelvisPt = projected3D[23] && projected3D[24] ? {
    x: (projected3D[23].x + projected3D[24].x) / 2,
    y: (projected3D[23].y + projected3D[24].y) / 2,
    z: (projected3D[23].z + projected3D[24].z) / 2
  } : null;

  if (showUpper && neck && pelvisPt) {
    // Spine
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y);
    ctx.lineTo(pelvisPt.x, pelvisPt.y);
    ctx.stroke();

    const sdx = pelvisPt.x - neck.x;
    const sdy = pelvisPt.y - neck.y;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 0.95; i += 0.1) {
      const vx = neck.x + sdx * i;
      const vy = neck.y + sdy * i;
      ctx.beginPath();
      ctx.moveTo(vx - 5 * Math.abs(cosY), vy);
      ctx.lineTo(vx + 5 * Math.abs(cosY), vy);
      ctx.stroke();
    }

    // Rib cage
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.22)';
    ctx.lineWidth = 1;
    [0.26, 0.42, 0.58].forEach((f, idx) => {
      const rx = neck.x + sdx * f;
      const ry = neck.y + sdy * f;
      const rWidth = 24 - idx * 4;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rWidth * Math.max(0.02, Math.abs(cosY)), 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // 10. Draw Pelvis butterfly wings
  if (showLower && pelvisPt) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(pelvisPt.x - 8 * cosY, pelvisPt.y, 12 * Math.max(0.02, Math.abs(cosY)), 8, 0.2 * cosY, 0, Math.PI * 2);
    ctx.ellipse(pelvisPt.x + 8 * cosY, pelvisPt.y, 12 * Math.max(0.02, Math.abs(cosY)), 8, -0.2 * cosY, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 11. Draw visible Joint Nodes
  const visibleJoints = STICK_FIGURE_JOINTS.filter(index => {
    const isArm = [13, 14, 15, 16].includes(index);
    const isLeg = [25, 26, 27, 28].includes(index);
    const isShoulder = [11, 12].includes(index);
    const isHip = [23, 24].includes(index);
    
    if (isUpperBody && !isFullBody) {
      if (isLeg || isHip) return false;
    }
    if (isLowerBody && !isFullBody) {
      if (isArm || isShoulder) return false;
    }
    return true;
  });

  visibleJoints.forEach((index) => {
    const pt = projected3D[index];
    if (!pt || !pt.visible) return;

    const isActive = activeSet.has(index);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isActive ? 5.5 : 3.5, 0, Math.PI * 2);

    ctx.fillStyle = isActive 
      ? (isPostureInvalid ? '#ef4444' : (isHolding ? '#ec4899' : '#22d3ee')) 
      : '#475569';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
  });

  // 12. Draw Skull ovals
  if (showUpper && shoulderL && shoulderR && shoulderL.visible && shoulderR.visible) {
    const headX = (shoulderL.x + shoulderR.x) / 2;
    const headY = (shoulderL.y + shoulderR.y) / 2 - 38;
    const radius = 14;

    ctx.strokeStyle = isPostureInvalid ? 'rgba(239, 68, 68, 0.65)' : 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(headX, headY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(headX, headY, radius * Math.max(0.02, Math.abs(cosY)), radius, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(headX - 7 * cosY, headY + 11);
    ctx.lineTo(headX - 5 * cosY, headY + 19);
    ctx.lineTo(headX + 5 * cosY, headY + 19);
    ctx.lineTo(headX + 7 * cosY, headY + 11);
    ctx.closePath();
    ctx.stroke();

    // Eye sockets
    ctx.fillStyle = isPostureInvalid ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 211, 238, 0.2)';
    ctx.fillRect(headX - 6 * cosY - 2.5, headY + 2, 5, 4);
    ctx.fillRect(headX + 6 * cosY - 2.5, headY + 2, 5, 4);
  }

  // 13. Draw viewport pointers dynamically based on active target region
  if (showLower) {
    drawFloatingLabel(ctx, leftHip, "Hips", true);
    drawFloatingLabel(ctx, leftKnee, "Knees", false);
    drawFloatingLabel(ctx, leftAnkle, "Ankles", false);
  } else if (showUpper) {
    drawFloatingLabel(ctx, shoulderL, "Shoulder", true);
    drawFloatingLabel(ctx, projected3D[13], "Elbow", false);
    drawFloatingLabel(ctx, projected3D[15], "Wrist", false);
  }

  // 14. Alert overlay centered on left screen
  if (isPostureInvalid && postureAlert) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(cx - 150, 20, 300, 38);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 150, 20, 300, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠️ FORM ERROR: ${postureAlert}`, cx, 43);
    ctx.restore();
  }
};
