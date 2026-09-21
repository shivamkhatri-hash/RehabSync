export const init = () => ({
  flappyY: 240,
  flappyScore: 0,
  gamePoints: 0,
  comboCount: 0,
  multiplier: 1,
  scrollSpeed: 1.4, // Calm, steady speed (capped strictly <= 2.2x)
  smoothedVelocity: 0,
  lastAngle: 0,
  lastAngleTime: Date.now(),
  lastRepTime: Date.now(),
  adaptivePoleDistance: 280, // Dynamic distance between poles based on rep cadence
  flyerTilt: 0,
  gates: [
    { x: 380, topHeight: 0, bottomHeight: 195, passed: false, hit: false, type: 'top' },
    { x: 660, topHeight: 285, bottomHeight: 480, passed: false, hit: false, type: 'bottom' }
  ],
  particles: [],
  floatTexts: [],
  frameIndex: 0,
  consecutivePasses: 0,
  lastSpawnedType: 'bottom'
});

export const draw = (ctx, canvas, state, params) => {
  const { video, liveAngleVal, currentExercise, speakText, repsRef, setReps, isPostureInvalid } = params;

  // Initialize collections & fallback defaults
  if (!state.gates) state.gates = [];
  if (!state.particles) state.particles = [];
  if (!state.floatTexts) state.floatTexts = [];
  if (state.gamePoints === undefined) state.gamePoints = 0;
  if (state.comboCount === undefined) state.comboCount = 0;
  if (state.multiplier === undefined) state.multiplier = 1;
  if (state.flappyY === undefined || isNaN(state.flappyY)) state.flappyY = canvas.height / 2;
  if (state.flyerTilt === undefined) state.flyerTilt = 0;
  if (state.adaptivePoleDistance === undefined) state.adaptivePoleDistance = 280;

  // 1. Maintain Constant, Predictable Scroll Speed (strictly capped at 2.2x max)
  state.scrollSpeed = 1.4; // Fixed comfortable pace

  // Track user angular movement speed to adapt pole distance (cadence)
  const now = Date.now();
  const dt = (now - (state.lastAngleTime || now)) / 1000;
  if (dt > 0.018 && liveAngleVal !== undefined && !isNaN(liveAngleVal) && state.lastAngle !== undefined) {
    const rawVel = Math.abs(liveAngleVal - state.lastAngle) / dt;
    state.smoothedVelocity = (state.smoothedVelocity || 0) * 0.80 + rawVel * 0.20;
    state.lastAngle = liveAngleVal;
    state.lastAngleTime = now;
  } else if (!state.lastAngleTime) {
    state.lastAngle = liveAngleVal || 0;
    state.lastAngleTime = now;
    state.smoothedVelocity = 0;
  }

  // 2. Decide Distance Between Poles Based on User Rep Movement Speed
  // Slower/deliberate rep speed -> wider distance (up to 380px) so user has plenty of time
  // Faster active rep speed -> tighter distance (down to 230px) to match natural cadence
  const userCadenceVel = state.smoothedVelocity || 0;
  let targetPoleDistance = 320 - Math.min(90, (userCadenceVel / 45) * 60);
  targetPoleDistance = Math.max(230, Math.min(380, targetPoleDistance));
  state.adaptivePoleDistance = (state.adaptivePoleDistance || 280) * 0.90 + targetPoleDistance * 0.10;

  // 3. Render Sci-Fi Cyber Grid Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#020617');
  bgGrad.addColorStop(0.5, '#09142b');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid backdrop scrolling
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.lineWidth = 1;
  state.frameIndex += 1;
  const scroll = (state.frameIndex * 1.4) % 40;
  for (let x = -scroll; x < canvas.width; x += 40) {
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

  // Mini Web Camera overlay (disabled if video is null)
  if (video) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 20, 100, 75);
    ctx.clip();
    ctx.drawImage(video, 20, 20, 100, 75);
    ctx.restore();
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(20, 20, 100, 75);
  }

  // 4. Obstacle Gate Spawning with Dynamic Distance
  const lastGateX = state.gates.length > 0 ? Math.max(...state.gates.map(g => g.x)) : 0;
  const shouldSpawnNewGate = lastGateX < canvas.width - 150 || state.gates.length < 2;

  if (shouldSpawnNewGate) {
    const gap = 195;
    let topH = 0;
    let type = 'middle';

    const isHold = currentExercise && (currentExercise.holdTime > 0);

    if (isHold) {
      topH = canvas.height / 2 - gap / 2;
      type = 'middle';
    } else {
      // Rep-based: alternate gates between top and bottom to evaluate full range cycle
      const nextType = state.lastSpawnedType === 'top' ? 'bottom' : 'top';
      state.lastSpawnedType = nextType;
      type = nextType;

      if (nextType === 'top') {
        topH = 0; // Gap is at the very top (flexion goal)
      } else {
        topH = canvas.height - gap; // Gap is at the very bottom (extension return)
      }
    }

    const spawnDistance = Math.round(state.adaptivePoleDistance || 280);
    const spawnX = Math.max(canvas.width + 10, lastGateX + spawnDistance);

    state.gates.push({
      x: spawnX,
      topHeight: topH,
      bottomHeight: topH + gap,
      passed: false,
      hit: false,
      type: type
    });
  }

  // 5. Convert Angle Flexion to Ship Y Position with Smooth Responsiveness
  const minAngle = currentExercise?.failure_angle ?? currentExercise?.failureAngle ?? 150;
  const maxAngle = currentExercise?.success_angle ?? currentExercise?.successAngle ?? 85;
  const range = maxAngle - minAngle;

  let ratio = 0.5;
  if (liveAngleVal !== undefined && !isNaN(liveAngleVal) && liveAngleVal > 0) {
    const rawRatio = range !== 0 ? (liveAngleVal - minAngle) / range : 0.5;
    ratio = Math.max(0, Math.min(1, rawRatio));
  }
  
  const targetY = canvas.height - 70 - ratio * (canvas.height - 140);
  const deltaY = targetY - state.flappyY;
  state.flappyY += deltaY * 0.18; // Steady, smooth follow rate
  state.flyerTilt = Math.max(-0.35, Math.min(0.35, -deltaY * 0.04));

  // Render flyer avatar
  const px = 170;
  const py = state.flappyY;

  // Thruster particle stream
  if (state.frameIndex % 3 === 0) {
    state.particles.push({
      x: px - 16,
      y: py + (Math.random() * 6 - 3),
      vx: -(Math.random() * 2 + 2),
      vy: (Math.random() * 2 - 1),
      size: Math.random() * 4 + 2,
      alpha: 1,
      color: isPostureInvalid ? '#ef4444' : '#06b6d4'
    });
  }

  // Draw active particles
  const nextParticles = [];
  for (let p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.05;
    p.size = Math.max(0.5, p.size * 0.95);
    if (p.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      nextParticles.push(p);
    }
  }
  state.particles = nextParticles;

  // Flyer ship body
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(state.flyerTilt);

  ctx.shadowColor = isPostureInvalid ? '#ef4444' : '#06b6d4';
  ctx.shadowBlur = 14;
  ctx.fillStyle = isPostureInvalid ? '#ef4444' : '#06b6d4';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner Core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Thrust flame
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-24, -5);
  ctx.lineTo(-24, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 6. Obstacles Gate Processing with Steady Fixed Speed
  state.gates.forEach((gate) => {
    gate.x -= state.scrollSpeed;
    
    // Top obstruction pillar
    ctx.save();
    ctx.fillStyle = gate.hit ? '#f43f5e' : '#0d9488';
    ctx.shadowColor = gate.hit ? '#f43f5e' : '#14b8a6';
    ctx.shadowBlur = 8;
    ctx.fillRect(gate.x, 0, 50, gate.topHeight);
    ctx.fillStyle = gate.hit ? '#fda4af' : '#14b8a6';
    ctx.fillRect(gate.x - 4, Math.max(0, gate.topHeight - 15), 58, 15);

    // Bottom obstruction pillar
    ctx.fillStyle = gate.hit ? '#f43f5e' : '#0d9488';
    ctx.fillRect(gate.x, gate.bottomHeight, 50, Math.max(0, canvas.height - gate.bottomHeight));
    ctx.fillStyle = gate.hit ? '#fda4af' : '#14b8a6';
    ctx.fillRect(gate.x - 4, gate.bottomHeight, 58, 15);

    // Connecting neon laser beam in gap
    ctx.strokeStyle = gate.hit ? 'rgba(244, 63, 94, 0.4)' : 'rgba(20, 184, 166, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(gate.x + 25, gate.topHeight);
    ctx.lineTo(gate.x + 25, gate.bottomHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Collision parameters checks
    if (gate.x < px + 14 && gate.x + 50 > px - 14) {
      if (py - 14 < gate.topHeight || py + 14 > gate.bottomHeight) {
        if (!gate.hit) {
          gate.hit = true;
          if (speakText) speakText("Watch alignment!");
          state.consecutivePasses = 0;
          state.comboCount = 0;
          state.multiplier = 1;
          state.floatTexts.push({
            x: px,
            y: py - 25,
            text: '💥 COLLISION',
            color: '#ef4444',
            alpha: 1
          });
        }
      }
    }

    // Gate clean pass checking
    if (!gate.passed && gate.x + 50 < px) {
      gate.passed = true;
      if (!gate.hit) {
        if (isPostureInvalid) {
          gate.hit = true;
          state.comboCount = 0;
          state.multiplier = 1;
          state.consecutivePasses = 0;
          if (speakText) speakText("Form fault!");
          state.floatTexts.push({
            x: px,
            y: py - 25,
            text: '⚠️ FORM FAULT',
            color: '#ef4444',
            alpha: 1
          });
        } else {
          // Increment combo
          state.comboCount = (state.comboCount || 0) + 1;
          if (state.comboCount >= 9) state.multiplier = 4;
          else if (state.comboCount >= 6) state.multiplier = 3;
          else if (state.comboCount >= 3) state.multiplier = 2;
          else state.multiplier = 1;

          const ptsEarned = 10 * state.multiplier;
          state.gamePoints = (state.gamePoints || 0) + ptsEarned;

          state.floatTexts.push({
            x: px + 30,
            y: py - 20,
            text: `+${ptsEarned} PTS!`,
            color: '#00f0ff',
            alpha: 1
          });

          const isHold = currentExercise && (currentExercise.holdTime > 0);
          if (isHold) {
            state.flappyScore += 1;
            if (repsRef && setReps) {
              repsRef.current += 1;
              setReps(repsRef.current);
            }
            if (speakText) speakText(state.multiplier > 1 ? `Combo ${state.multiplier}x!` : "Good hold!");
          } else {
            // Rep mode: Alternating clean passes: passing 2 continuous gates (1 top + 1 bottom) = 1 rep
            state.consecutivePasses = (state.consecutivePasses || 0) + 1;
            if (state.consecutivePasses >= 2) {
              state.flappyScore += 1;
              if (repsRef && setReps) {
                repsRef.current += 1;
                setReps(repsRef.current);
              }
              state.consecutivePasses = 0;
              if (speakText) speakText(state.multiplier > 1 ? `Combo ${state.multiplier}x!` : "Good repetition!");
            } else {
              if (speakText) speakText(state.multiplier > 1 ? "Combo!" : "Keep moving!");
            }
          }
        }
      }
    }
  });

  // Filter out of bounds gates
  state.gates = state.gates.filter(g => g.x > -80);

  // Floating text animations
  const nextFloatTexts = [];
  for (let t of state.floatTexts) {
    t.y -= 1.2;
    t.alpha -= 0.03;
    if (t.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
      nextFloatTexts.push(t);
    }
  }
  state.floatTexts = nextFloatTexts;

  // HUD Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, canvas.width, 56);
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 56);
  ctx.lineTo(canvas.width, 56);
  ctx.stroke();

  // Draw Reps count and Points
  const isHold = currentExercise && (currentExercise.holdTime > 0);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  if (isHold) {
    ctx.fillText(`🎯 TARGET HOLDS: ${state.flappyScore}`, 140, 24);
  } else {
    ctx.fillText(`🎯 REPS COMPLETED: ${state.flappyScore} (${state.consecutivePasses || 0}/2)`, 140, 24);
  }

  ctx.fillStyle = '#f59e0b'; // Amber points
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`✨ SCORE POINTS: ${state.gamePoints || 0}`, 140, 42);

  // Draw Combo and Multiplier
  if (state.comboCount > 0) {
    ctx.fillStyle = '#ec4899'; // Pink combo
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`🔥 COMBO: ${state.comboCount}`, 320, 24);

    ctx.fillStyle = '#10b981'; // Green multiplier
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`⭐ MULTIPLIER: ${state.multiplier}x`, 320, 42);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`🔥 COMBO: 0`, 320, 24);
    ctx.fillText(`⭐ MULTIPLIER: 1x`, 320, 42);
  }

  // Telemetry HUD: steady speed and adaptive pole cadence
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`⚡ SPEED: 1.4x (MAX 2.2x)`, canvas.width - 20, 24);
  ctx.fillText(`📐 CADENCE GAP: ${Math.round(state.adaptivePoleDistance)}px`, canvas.width - 20, 42);
};
