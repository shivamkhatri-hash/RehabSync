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
  frameCount: 0,
  matchProgress: 0,
  isHoldingPose: false,
  lastRepLogged: 0,
  rippleRadius: 0,
  phase: 'start', // 'start' (initial/reset posture) or 'goal' (final target posture)
  startHoldFrames: 0
});

// Helper to calculate target coordinate for matching silhouette angle
const getTargetJointPt = (pt1, pt2, pt3, targetAngleDeg) => {
  const dx = pt3.x - pt2.x;
  const dy = pt3.y - pt2.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len === 0) return { ...pt3 };
  
  const angleBA = Math.atan2(pt1.y - pt2.y, pt1.x - pt2.x);
  const angleBC_actual = Math.atan2(pt3.y - pt2.y, pt3.x - pt2.x);
  
  let diff = angleBC_actual - angleBA;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  
  const sign = diff >= 0 ? 1 : -1;
  const targetAngleRad = targetAngleDeg * (Math.PI / 180);
  const targetAngleBC = angleBA + sign * targetAngleRad;
  
  return {
    x: pt2.x + Math.cos(targetAngleBC) * len,
    y: pt2.y + Math.sin(targetAngleBC) * len,
    z: pt3.z,
    visible: true
  };
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
    repsRef,
    setReps
  } = params;

  state.frameCount = (state.frameCount || 0) + 1;

  if (!state.phase) {
    state.phase = 'start';
  }

  // Background style: clinical neon grid space
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(1, '#02050a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cybernetic grid
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw Title HUD
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, 42);
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(canvas.width, 42);
  ctx.stroke();

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText("👤 POSTURE SHADOW KEYHOLE MATCHING", 20, 26);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`TARGET STRETCH: ${currentExercise?.name || 'ACTIVE'}`, canvas.width - 20, 26);

  // Return early if no pose landmarks are active
  if (!detectedLandmarks || detectedLandmarks.length < 33) {
    ctx.fillStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("⚠️ WAITING FOR AI SENSOR CAMERA...", canvas.width / 2, canvas.height / 2);
    return;
  }

  // 1. Mirror coordinates (standard webcam tracking coordinates)
  const mirroredPoints = detectedLandmarks.map(pt => ({
    x: (1 - pt.x) * canvas.width,
    y: pt.y * canvas.height,
    z: pt.z,
    visible: (pt.visibility ?? 1) > 0.50
  }));

  // Resolve target joint set
  const [j1, j2, j3] = resolvedJoints && resolvedJoints.length === 3 ? resolvedJoints : [11, 13, 15];
  const ptA = mirroredPoints[j1];
  const ptB = mirroredPoints[j2];
  const ptC = mirroredPoints[j3];

  const successAngle = currentExercise?.success_angle || 90;
  const failureAngle = currentExercise?.failure_angle || 140;

  // Render the posture matching phase details
  const targetAngle = state.phase === 'start' ? failureAngle : successAngle;

  // 2. Generate target pose silhouette coordinates
  const targetSilhouette = mirroredPoints.map(pt => ({ ...pt }));
  if (ptA && ptB && ptC) {
    const ptTarget = getTargetJointPt(ptA, ptB, ptC, targetAngle);
    targetSilhouette[j3] = ptTarget;
  }

  // 3. Draw Target Silhouette (dashed orange/yellow posture outline)
  ctx.strokeStyle = state.phase === 'start' ? 'rgba(234, 179, 8, 0.35)' : 'rgba(249, 115, 22, 0.38)';
  ctx.lineWidth = 4;
  ctx.setLineDash([4, 4]);
  SKELETON_CONNECTIONS.forEach(([a, b]) => {
    const pA = targetSilhouette[a];
    const pB = targetSilhouette[b];
    if (pA && pB && pA.visible && pB.visible) {
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }
  });
  ctx.setLineDash([]); // Reset dash

  // Draw target silhouette joint nodes
  targetSilhouette.forEach((pt, idx) => {
    if (!pt || !pt.visible) return;
    if (STICK_FIGURE_JOINTS.includes(idx)) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = state.phase === 'start' ? 'rgba(234, 179, 8, 0.45)' : 'rgba(249, 115, 22, 0.45)';
      ctx.fill();
    }
  });

  // 4. Draw Patient skeleton (cyan/red based on posture check)
  const skeletonColor = isPostureInvalid ? '#ef4444' : '#14b8a6';
  const skeletonAlpha = isPostureInvalid ? 'rgba(239, 68, 68, 0.65)' : 'rgba(20, 184, 166, 0.65)';
  
  ctx.strokeStyle = skeletonAlpha;
  ctx.lineWidth = 3.5;
  SKELETON_CONNECTIONS.forEach(([a, b]) => {
    const pA = mirroredPoints[a];
    const pB = mirroredPoints[b];
    if (pA && pB && pA.visible && pB.visible) {
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }
  });

  // Draw active patient joints
  mirroredPoints.forEach((pt, idx) => {
    if (!pt || !pt.visible) return;
    if (STICK_FIGURE_JOINTS.includes(idx)) {
      const isTargetJoint = idx === j3;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isTargetJoint ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTargetJoint ? '#22d3ee' : '#cbd5e1';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
  });

  // 5. Draw Keyhole Target Halo around target joint position
  const targetWrist = targetSilhouette[j3];
  const actualWrist = mirroredPoints[j3];

  let isMatching = false;

  if (targetWrist && actualWrist) {
    const dist = Math.sqrt(Math.pow(actualWrist.x - targetWrist.x, 2) + Math.pow(actualWrist.y - targetWrist.y, 2));
    
    // Evaluation: check if target angle direction matches
    const direction = currentExercise?.target_direction || (successAngle > failureAngle ? 'increase' : 'decrease');
    
    let isAngleMatched = false;
    if (state.phase === 'start') {
      // In start phase, patient must reset/extend to start position
      if (direction === 'increase') {
        isAngleMatched = liveAngleVal <= failureAngle + 10;
      } else {
        isAngleMatched = liveAngleVal >= failureAngle - 10;
      }
    } else {
      // In goal phase, patient must flex/reach the target angle
      if (direction === 'increase') {
        isAngleMatched = liveAngleVal >= successAngle - 8;
      } else {
        isAngleMatched = liveAngleVal <= successAngle + 8;
      }
    }

    // Patient must have correct angle AND correct posture (no strict coordinate distance penalty)
    isMatching = isAngleMatched && !isPostureInvalid;

    // Draw glowing keyhole ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(targetWrist.x, targetWrist.y, 25, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isMatching ? '#10b981' : (state.phase === 'start' ? '#eab308' : '#f97316');
    ctx.fillStyle = isMatching ? 'rgba(16, 185, 129, 0.12)' : (state.phase === 'start' ? 'rgba(234, 211, 238, 0.08)' : 'rgba(249, 115, 22, 0.08)');
    ctx.shadowColor = isMatching ? 'rgba(16, 185, 129, 0.5)' : (state.phase === 'start' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(249, 115, 22, 0.3)');
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Floating Target label box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = isMatching ? '#10b981' : (state.phase === 'start' ? '#eab308' : '#f97316');
    ctx.lineWidth = 0.8;
    ctx.fillRect(targetWrist.x - 30, targetWrist.y - 42, 60, 13);
    ctx.strokeRect(targetWrist.x - 30, targetWrist.y - 42, 60, 13);
    
    ctx.fillStyle = isMatching ? '#10b981' : (state.phase === 'start' ? '#eab308' : '#f97316');
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    
    let boxLabel = "GOAL";
    if (state.phase === 'start') {
      boxLabel = isMatching ? "START OK" : "START";
    } else {
      boxLabel = isMatching ? "MATCHED" : "GOAL";
    }
    ctx.fillText(boxLabel, targetWrist.x, targetWrist.y - 33);

    // Rep Cycle state transitions
    if (state.phase === 'start') {
      if (isMatching) {
        state.isHoldingPose = true;
        state.startHoldFrames = (state.startHoldFrames || 0) + 1;
        if (state.startHoldFrames >= 15) { // 0.25s stable hold to reset rep cycle
          state.phase = 'goal';
          state.startHoldFrames = 0;
          state.matchProgress = 0;
        }
      } else {
        state.isHoldingPose = false;
        state.startHoldFrames = Math.max(0, (state.startHoldFrames || 0) - 1);
      }
    } else {
      // Phase === 'goal'
      if (isMatching) {
        state.isHoldingPose = true;
        state.matchProgress = Math.min(100, (state.matchProgress || 0) + 1.25); // ~2.5s hold time
        
        // Auto rep logging triggers on 100% progress
        if (state.matchProgress >= 100 && state.frameCount - state.lastRepLogged > 90) {
          state.lastRepLogged = state.frameCount;
          state.matchProgress = 0;
          state.rippleRadius = 1;
          state.phase = 'start'; // Return back to start for next rep!
          state.startHoldFrames = 0;
          
          // Log rep in state
          const newReps = repsRef.current + 1;
          repsRef.current = newReps;
          setReps(newReps);
        }
      } else {
        state.isHoldingPose = false;
        state.matchProgress = Math.max(0, (state.matchProgress || 0) - 2.5); // Decay progress quickly if posture fails
      }
    }

    // Ripple effect animation when a rep is successfully popped
    if (state.rippleRadius > 0) {
      state.rippleRadius += 4;
      ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 1 - state.rippleRadius / 60)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetWrist.x, targetWrist.y, state.rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
      if (state.rippleRadius > 60) state.rippleRadius = 0;
    }

    // 6. Draw dynamic floating angle & progress countdown arcs
    if (state.phase === 'goal' && state.matchProgress > 0) {
      ctx.beginPath();
      ctx.arc(actualWrist.x, actualWrist.y, 16, -Math.PI / 2, -Math.PI / 2 + (state.matchProgress / 100) * Math.PI * 2);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(state.matchProgress)}%`, actualWrist.x, actualWrist.y + 3);
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(actualWrist.x - 16, actualWrist.y - 20, 32, 11);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${liveAngleVal}°`, actualWrist.x, actualWrist.y - 12);
    }
  }

  // 7. Clinical Feedback & Status HUD overlays
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(20, 370, 300, 90);
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 370, 300, 90);

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 8.5px monospace';
  ctx.fillText("🤖 CLINICAL INSTRUCTIONS:", 32, 386);

  let feedbackText = "";
  let feedbackColor = '#94a3b8';

  if (isPostureInvalid && postureAlert) {
    feedbackText = `⚠️ POSTURE ERROR: ${postureAlert}`;
    feedbackColor = '#ef4444';
  } else if (state.phase === 'start') {
    feedbackText = isMatching 
      ? "✅ START POSITION DETECTED. HOLD STILL..." 
      : `Extend joint to starting position (${failureAngle}°). Current: ${liveAngleVal}°`;
    feedbackColor = isMatching ? '#10b981' : '#eab308';
  } else {
    // Phase === 'goal'
    feedbackText = state.isHoldingPose
      ? "✅ POSITION MATCHED! HOLD STILL..."
      : `Flex joint to final goal position (${successAngle}°). Current: ${liveAngleVal}°`;
    feedbackColor = state.isHoldingPose ? '#10b981' : '#38bdf8';
  }

  ctx.fillStyle = feedbackColor;
  ctx.font = 'bold 9px monospace';
  ctx.fillText(feedbackText, 32, 404);

  // Show calibration status meter
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 8px monospace';
  ctx.fillText(`POSTURE STABILITY METER:`, 32, 426);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(32, 434, 276, 5);

  const fillWidth = isPostureInvalid ? 30 : (state.isHoldingPose ? 276 : 180);
  const fillColor = isPostureInvalid ? '#ef4444' : (state.isHoldingPose ? '#10b981' : '#eab308');
  ctx.fillStyle = fillColor;
  ctx.fillRect(32, 434, fillWidth, 5);
  ctx.restore();

  // Progress Bar for current Pose Hold Countdown (screen bottom HUD)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(0, canvas.height - 15, canvas.width, 15);
  
  ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
  ctx.fillRect(0, canvas.height - 15, canvas.width, 15);

  const bottomProgress = state.phase === 'start' 
    ? (state.startHoldFrames / 15) * 100 
    : state.matchProgress;

  ctx.fillStyle = state.phase === 'start' ? '#eab308' : '#10b981';
  ctx.fillRect(0, canvas.height - 15, canvas.width * (bottomProgress / 100), 15);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  
  let bottomHUDText = "";
  if (state.phase === 'start') {
    bottomHUDText = isMatching ? "LOCKING START POSTURE..." : `STEP 1: ALIGN TO START POSITION (${failureAngle}°)`;
  } else {
    bottomHUDText = state.isHoldingPose ? `POPPING KEYHOLE: ${Math.round(state.matchProgress)}%` : `STEP 2: FLEX TO GOAL POSITION (${successAngle}°)`;
  }
  ctx.fillText(bottomHUDText, canvas.width / 2, canvas.height - 4);

  // Draw red posture warning alert overlay banner at the top center of the tracker canvas
  if (isPostureInvalid && postureAlert) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // bold red
    ctx.fillRect(canvas.width / 2 - 200, 52, 400, 42);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 200, 52, 400, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠️ FORM WARNING: ${postureAlert}`, canvas.width / 2, 78);
    ctx.restore();
  }
};
