export const init = () => ({
  flappyY: 240,
  flappyScore: 0,
  gamePoints: 0,
  comboCount: 0,
  multiplier: 1,
  scrollSpeed: 0.8,
  currentGap: 180,
  gates: [],
  frameIndex: 0,
  consecutivePasses: 0,
  lastSpawnedType: null
});

export const draw = (ctx, canvas, state, params) => {
  const { video, liveAngleVal, currentExercise, speakText, repsRef, setReps, isPostureInvalid } = params;

  // Set default dynamic parameters if not initialized
  if (state.scrollSpeed === undefined) state.scrollSpeed = 0.8;
  if (state.currentGap === undefined) state.currentGap = 180;
  if (state.gamePoints === undefined) state.gamePoints = 0;
  if (state.comboCount === undefined) state.comboCount = 0;
  if (state.multiplier === undefined) state.multiplier = 1;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#020617');
  bgGrad.addColorStop(1, '#0b1329');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid backdrop scrolling
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const scroll = (state.frameIndex * 1.5) % 40;
  for (let x = -scroll; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
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

  // Frame counting
  state.frameIndex += 1;

  if (state.frameIndex % 220 === 0) {
    const gap = state.currentGap;
    let topH = 0;
    let type = 'middle';

    if (currentExercise.holdTime > 0) {
      // Hold exercise: gate centered in middle so player can hover/hold in the center
      topH = canvas.height / 2 - gap / 2;
      type = 'middle';
    } else {
      // Rep-based: alternate gates between top and bottom to check full range cycle
      const nextType = state.lastSpawnedType === 'top' ? 'bottom' : 'top';
      state.lastSpawnedType = nextType;
      type = nextType;

      if (nextType === 'top') {
        topH = 0; // Gap is at the very top (no top block)
      } else {
        topH = canvas.height - gap; // Gap is at the very bottom (no bottom block)
      }
    }

    state.gates.push({
      x: canvas.width,
      topHeight: topH,
      bottomHeight: topH + gap,
      passed: false,
      hit: false,
      type: type
    });
  }

  // Convert angle flexion value to ship Y height (always updates for posture setup alignment)
  const minAngle = currentExercise.failure_angle;
  const maxAngle = currentExercise.success_angle;
  const range = maxAngle - minAngle;
  const ratio = Math.max(0, Math.min(1, (liveAngleVal - minAngle) / (range || 1)));
  const targetY = canvas.height - 60 - ratio * (canvas.height - 120);
  state.flappyY += (targetY - state.flappyY) * 0.03;

  // Render flyer avatar
  const px = 170;
  const py = state.flappyY;

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
  state.gates.forEach((gate) => {
    gate.x -= state.scrollSpeed;
    
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
          state.consecutivePasses = 0; // Reset ROM progress on collision
          state.comboCount = 0;
          state.multiplier = 1;
          // Adaptive difficulty: ease up (slower speed, wider gap)
          state.scrollSpeed = Math.max(0.6, state.scrollSpeed - 0.15);
          state.currentGap = Math.min(210, state.currentGap + 10);
        }
      }
    }

    // Gate clean pass checking
    if (!gate.passed && gate.x + 50 < px) {
      gate.passed = true;
      if (!gate.hit) {
        if (isPostureInvalid) {
          // Enforce form check: mark as hit, break combo, no points/reps
          gate.hit = true;
          state.comboCount = 0;
          state.multiplier = 1;
          state.consecutivePasses = 0;
          speakText("Form fault!");
        } else {
          // Increment combo
          state.comboCount = (state.comboCount || 0) + 1;
          // Update multiplier
          if (state.comboCount >= 9) {
            state.multiplier = 4;
          } else if (state.comboCount >= 6) {
            state.multiplier = 3;
          } else if (state.comboCount >= 3) {
            state.multiplier = 2;
          } else {
            state.multiplier = 1;
          }

          // Increase gamified points
          state.gamePoints = (state.gamePoints || 0) + 10 * state.multiplier;

          // Adaptive difficulty: challenge the user (faster speed, narrower gap)
          state.scrollSpeed = Math.min(1.4, state.scrollSpeed + 0.05);
          state.currentGap = Math.max(140, state.currentGap - 3);

          if (currentExercise.holdTime > 0) {
            // Hold mode: 1 gate = 1 hold/rep point
            state.flappyScore += 1;
            repsRef.current += 1;
            setReps(repsRef.current);
            speakText(state.multiplier > 1 ? `Combo ${state.multiplier}x!` : "Good hold!");
          } else {
            // Rep mode: Alternating clean passes: requires passing 2 gates (flexion + extension) for 1 rep
            state.consecutivePasses = (state.consecutivePasses || 0) + 1;
            if (state.consecutivePasses === 2) {
              state.flappyScore += 1;
              repsRef.current += 1;
              setReps(repsRef.current);
              state.consecutivePasses = 0;
              speakText(state.multiplier > 1 ? `Combo ${state.multiplier}x!` : "Good repetition!");
            } else {
              speakText(state.multiplier > 1 ? "Combo!" : "Keep going!");
            }
          }
        }
      } else {
        state.consecutivePasses = 0;
        state.comboCount = 0;
        state.multiplier = 1;
      }
    }
  });

  // Filter out of bounds gates
  state.gates = state.gates.filter(g => g.x > -80);

  // HUD Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(0, 0, canvas.width, 60);
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.lineTo(canvas.width, 60);
  ctx.stroke();

  // Draw Reps count and Points
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  if (currentExercise.holdTime > 0) {
    ctx.fillText(`🎯 TARGET HOLDS: ${state.flappyScore}`, 140, 26);
  } else {
    ctx.fillText(`🎯 REPS COMPLETED: ${state.flappyScore} (${state.consecutivePasses || 0}/2)`, 140, 26);
  }

  ctx.fillStyle = '#f59e0b'; // Amber points
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`✨ SCORE POINTS: ${state.gamePoints || 0}`, 140, 44);

  // Draw Combo and Multiplier
  if (state.comboCount > 0) {
    ctx.fillStyle = '#ec4899'; // Pink combo
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`🔥 COMBO: ${state.comboCount}`, 320, 26);

    ctx.fillStyle = '#10b981'; // Green multiplier
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`⭐ MULTIPLIER: ${state.multiplier}x`, 320, 44);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`🔥 COMBO: 0`, 320, 26);
    ctx.fillText(`⭐ MULTIPLIER: 1x`, 320, 44);
  }

  // Draw Adaptive Difficulty Stats (speed and gap)
  ctx.fillStyle = '#06b6d4'; // Cyan stats
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`⚡ SPEED: ${state.scrollSpeed.toFixed(2)}`, canvas.width - 20, 26);
  ctx.fillText(`📐 GATE GAP: ${state.currentGap}px`, canvas.width - 20, 44);
};
