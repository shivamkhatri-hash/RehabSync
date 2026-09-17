/**
 * BeatRehab — Synthwave Rhythm & Slicing Game Engine
 * Inspired by rhythm arcades (Beat Saber / Synth Riders)
 * 
 * Clinical Target: Cadence control, steady eccentric velocity, and coordination.
 * Movement: Joint angle elevation directly drives the glowing Neon Saber blade.
 * Slicing incoming rhythm orbs builds combos while enforcing slow, controlled tempo.
 */

export const init = () => ({
  frameIndex: 0,
  score: 0,
  combo: 0,
  multiplier: 1,
  notes: [], // Array of incoming rhythm blocks { id, y, targetAngle, sliced, speed, lane }
  particles: [], // Neon spark bursts
  lastSliceTime: 0,
  lastAngle: 0,
  lastAngleTime: Date.now(),
  angularVelocity: 0,
  speedWarning: false,
  sliceAlert: null,
  sliceAlertTimer: 0,
  totalNotesSliced: 0,
  perfectCount: 0
});

export const draw = (ctx, canvas, state, params) => {
  const { liveAngleVal, currentExercise, speakText, repsRef, setReps, isPostureInvalid } = params;

  // Initialize defaults if needed
  if (!state.notes) state.notes = [];
  if (!state.particles) state.particles = [];
  if (state.score === undefined) state.score = 0;
  if (state.combo === undefined) state.combo = 0;
  if (state.multiplier === undefined) state.multiplier = 1;

  state.frameIndex += 1;
  const now = Date.now();

  // 1. Calculate Angular Velocity for "Speed Penalty"
  const dt = (now - (state.lastAngleTime || now)) / 1000;
  if (dt > 0.03 && liveAngleVal !== undefined && state.lastAngle !== undefined) {
    const rawVel = Math.abs(liveAngleVal - state.lastAngle) / dt;
    // Smooth velocity
    state.angularVelocity = (state.angularVelocity || 0) * 0.7 + rawVel * 0.3;
    state.lastAngle = liveAngleVal;
    state.lastAngleTime = now;
  }

  // Angular velocity limit: if moving faster than 180 deg/s, trigger speed penalty
  const isTooFast = state.angularVelocity > 200;
  state.speedWarning = isTooFast;

  // 2. Clear Screen & Draw Cyberpunk Synthwave Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a0017');
  bgGrad.addColorStop(0.5, '#180438');
  bgGrad.addColorStop(1, '#050014');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Retro Synthwave Horizon Sun
  const sunGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height * 0.38, 10,
    canvas.width / 2, canvas.height * 0.38, 140
  );
  sunGrad.addColorStop(0, '#ff007f');
  sunGrad.addColorStop(0.6, '#ff8800');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height * 0.38, 140, Math.PI, 0);
  ctx.fill();

  // Perspective 3D Grid Highway
  const horizonY = canvas.height * 0.38;
  const bottomY = canvas.height;
  const vpX = canvas.width / 2;

  ctx.strokeStyle = '#9333ea33';
  ctx.lineWidth = 1.5;

  // Longitudinal perspective lines
  const lanes = [-280, -180, -80, 0, 80, 180, 280];
  for (let offset of lanes) {
    ctx.beginPath();
    ctx.moveTo(vpX, horizonY);
    ctx.lineTo(vpX + offset * 2.2, bottomY);
    ctx.stroke();
  }

  // Scrolling horizontal grid lines
  const gridScroll = (state.frameIndex * 2.5) % 35;
  for (let y = horizonY; y < bottomY; y += 22) {
    const progress = (y - horizonY) / (bottomY - horizonY);
    const scrollY = horizonY + Math.pow(progress, 1.8) * (bottomY - horizonY) + gridScroll * progress;
    if (scrollY <= bottomY) {
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + progress * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(0, scrollY);
      ctx.lineTo(canvas.width, scrollY);
      ctx.stroke();
    }
  }

  // 3. Normalization of Player Angle & Saber Blade Elevation
  const successAng = currentExercise?.successAngle || 90;
  const failAng = currentExercise?.failureAngle || 160;
  const angleRange = Math.abs(failAng - successAng) || 1;
  const curAngle = liveAngleVal || (successAng + failAng) / 2;
  
  // Normalized 0.0 (rest) to 1.0 (target)
  let normalizedRom = (curAngle - failAng) / (successAng - failAng);
  normalizedRom = Math.max(0, Math.min(1, normalizedRom));

  // Saber Y position mapped to ROM
  const hitZoneY = canvas.height * 0.82;
  const saberMinY = canvas.height * 0.88;
  const saberMaxY = canvas.height * 0.45;
  const saberY = saberMinY - normalizedRom * (saberMinY - saberMaxY);

  // 4. Note Spawning & Tracking Loop
  // Spawn a new rhythm orb every 75 frames (~1.2s at 60fps)
  if (state.frameIndex % 85 === 0) {
    const noteRom = (state.notes.length % 2 === 0) ? 0.9 : 0.2; // Alternate high & low targets for full reps
    state.notes.push({
      id: state.frameIndex,
      progress: 0, // 0 (horizon) to 1 (hit line)
      targetRom: noteRom,
      color: noteRom > 0.5 ? '#06b6d4' : '#ec4899',
      sliced: false
    });
  }

  // Update & Draw Notes
  const hitLineY = hitZoneY;
  const activeNotes = [];

  for (let note of state.notes) {
    note.progress += 0.012; // Speed of incoming notes

    // Position along perspective highway
    const noteY = horizonY + Math.pow(note.progress, 1.6) * (bottomY - horizonY);
    const noteScale = 0.3 + note.progress * 1.2;
    const noteTargetY = saberMinY - note.targetRom * (saberMinY - saberMaxY);
    const noteX = vpX + (note.targetRom > 0.5 ? -60 : 60) * noteScale;

    // Check Slicing Collision when note reaches hit zone
    if (!note.sliced && note.progress >= 0.82 && note.progress <= 0.96) {
      const romDiff = Math.abs(normalizedRom - note.targetRom);

      if (romDiff < 0.22 && !isPostureInvalid) {
        // Successful Slice!
        note.sliced = true;
        const isPerfect = romDiff < 0.08;
        const points = isPerfect ? 250 : 100;
        
        // Apply Speed Penalty if jerking too fast
        const penaltyMultiplier = isTooFast ? 0.5 : 1.0;
        const awardedPoints = Math.round(points * state.multiplier * penaltyMultiplier);

        state.score += awardedPoints;
        state.combo += 1;
        state.totalNotesSliced += 1;
        if (isPerfect) state.perfectCount += 1;

        // Upgrade Multiplier
        if (state.combo >= 15) state.multiplier = 4;
        else if (state.combo >= 8) state.multiplier = 3;
        else if (state.combo >= 4) state.multiplier = 2;
        else state.multiplier = 1;

        // Spawn Spark Particles
        for (let i = 0; i < 18; i++) {
          state.particles.push({
            x: noteX,
            y: noteY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: note.color,
            alpha: 1,
            size: Math.random() * 4 + 2
          });
        }

        // Trigger slice alert text
        state.sliceAlert = isTooFast 
          ? `⚠️ SLOW DOWN! (+${awardedPoints})` 
          : isPerfect ? `⚡ PERFECT! (+${awardedPoints})` : `✨ SLICE! (+${awardedPoints})`;
        state.sliceAlertTimer = 35;

        // Count a repetition every 2 successful alternating slices (full cycle)
        if (state.totalNotesSliced % 2 === 0) {
          if (repsRef && setReps) {
            repsRef.current += 1;
            setReps(repsRef.current);
            if (speakText) speakText(`Rep ${repsRef.current}`);
          }
        }
      }
    }

    // Missed Note
    if (!note.sliced && note.progress > 0.98) {
      state.combo = 0;
      state.multiplier = 1;
    }

    // Draw Note Orb if not fully past screen
    if (note.progress <= 1.05) {
      ctx.save();
      if (note.sliced) {
        // Sliced halves fading out
        ctx.globalAlpha = Math.max(0, 1 - (note.progress - 0.88) * 6);
      }

      ctx.shadowColor = note.color;
      ctx.shadowBlur = 15 * noteScale;
      ctx.fillStyle = note.color;
      
      // Outer Glowing Cube
      const boxSize = 28 * noteScale;
      ctx.beginPath();
      ctx.roundRect(noteX - boxSize / 2, noteY - boxSize / 2, boxSize, boxSize, 6);
      ctx.fill();

      // Inner Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(noteX, noteY, 6 * noteScale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      activeNotes.push(note);
    }
  }
  state.notes = activeNotes;

  // 5. Draw Particle Sparks
  const activeParticles = [];
  for (let p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.035;
    if (p.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      activeParticles.push(p);
    }
  }
  state.particles = activeParticles;

  // 6. Draw Slice Target Zone Line
  ctx.strokeStyle = isPostureInvalid ? '#ef4444' : '#06b6d466';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(vpX - 220, hitZoneY);
  ctx.lineTo(vpX + 220, hitZoneY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 7. Draw Player's Neon Light Saber
  const bladeX = vpX;
  const bladeWidth = 260;
  const saberColor = isPostureInvalid ? '#ef4444' : isTooFast ? '#f59e0b' : '#38bdf8';

  ctx.save();
  ctx.shadowColor = saberColor;
  ctx.shadowBlur = 25;

  // Outer Saber Glow
  ctx.strokeStyle = saberColor;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bladeX - bladeWidth / 2, saberY);
  ctx.lineTo(bladeX + bladeWidth / 2, saberY);
  ctx.stroke();

  // Inner Saber Core (White)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bladeX - bladeWidth / 2 + 10, saberY);
  ctx.lineTo(bladeX + bladeWidth / 2 - 10, saberY);
  ctx.stroke();

  // Saber Center Handle
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = saberColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bladeX - 18, saberY - 6, 36, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 8. HUD & Real-Time Telemetry Overlay
  // Top Left: Score & Combo
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText(`SCORE: ${state.score}`, 30, 45);

  if (state.combo > 1) {
    ctx.fillStyle = '#ec4899';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.fillText(`COMBO x${state.combo} (${state.multiplier}x BOOST)`, 30, 70);
  }

  // Top Right: Live Angle & Target Guidance
  ctx.textAlign = 'right';
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 18px system-ui, sans-serif';
  ctx.fillText(`${Math.round(curAngle)}°`, canvas.width - 30, 45);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(`Target: ${successAng}° • Rest: ${failAng}°`, canvas.width - 30, 65);
  ctx.textAlign = 'left';

  // Floating Slice Feedback Alert
  if (state.sliceAlertTimer > 0) {
    state.sliceAlertTimer -= 1;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillStyle = state.sliceAlert.includes('SLOW') ? '#f59e0b' : '#34d399';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fillText(state.sliceAlert, vpX, hitZoneY - 35);
    ctx.restore();
  }

  // Speed Warning Banner
  if (isTooFast) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.fillText('⚠️ SPEED PENALTY ACTIVE: Move smoothly to maximize score', vpX, canvas.height - 20);
    ctx.restore();
  }

  // Posture Warning Banner
  if (isPostureInvalid) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillText('🚫 POSTURE FAULT: Straighten posture to slice notes!', vpX, canvas.height - 40);
    ctx.restore();
  }
};
