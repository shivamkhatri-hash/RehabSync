/**
 * BeatRehab — Side-Scrolling Rhythm & Slicing Arcade (Flappy / Side-Runner Dimension)
 * Left-to-Right gameplay where rhythm notes scroll from Right to Left,
 * and the player's joint elevation controls the Neon Cyber Slicer blade!
 */

export const init = () => ({
  frameIndex: 0,
  score: 0,
  combo: 0,
  multiplier: 1,
  playerY: 240,
  targetY: 240,
  bladeAngle: 0,
  slashAnim: 0, // Slash arc animation trigger
  notes: [
    { id: 1, x: 380, y: 280, targetRom: 0.40, type: 'CUBE', color: '#ff007f', speed: 4.8, sliced: false, rotation: 0 },
    { id: 2, x: 560, y: 140, targetRom: 0.85, type: 'STAR', color: '#fbbf24', speed: 4.8, sliced: false, rotation: 0 }
  ],
  particles: [], // Spark bursts
  slices: [], // Flying split halves
  rings: [], // Expanding shockwave rings
  floatTexts: [], // Floating score indicators
  lastAngle: 0,
  lastAngleTime: Date.now(),
  angularVelocity: 0,
  speedWarning: false,
  totalNotesSliced: 0,
  perfectCount: 0,
  bgScroll: 0
});

export const draw = (ctx, canvas, state, params) => {
  const { liveAngleVal, currentExercise, speakText, repsRef, setReps, isPostureInvalid } = params;

  // Initialize collections
  if (!state.notes) state.notes = [];
  if (!state.particles) state.particles = [];
  if (!state.slices) state.slices = [];
  if (!state.rings) state.rings = [];
  if (!state.floatTexts) state.floatTexts = [];
  if (state.score === undefined) state.score = 0;
  if (state.combo === undefined) state.combo = 0;
  if (state.multiplier === undefined) state.multiplier = 1;
  if (state.playerY === undefined) state.playerY = canvas.height / 2;

  state.frameIndex += 1;
  state.bgScroll = (state.bgScroll + 2.5) % canvas.width;
  const now = Date.now();

  // 1. Angular Velocity Calculation (Speed Penalty)
  const dt = (now - (state.lastAngleTime || now)) / 1000;
  if (dt > 0.025 && liveAngleVal !== undefined && state.lastAngle !== undefined) {
    const rawVel = Math.abs(liveAngleVal - state.lastAngle) / dt;
    state.angularVelocity = (state.angularVelocity || 0) * 0.75 + rawVel * 0.25;
    
    // Blade tilt proportional to vertical movement direction
    const angleDelta = liveAngleVal - state.lastAngle;
    state.bladeAngle = (state.bladeAngle || 0) * 0.8 + (angleDelta * 0.06);
    state.lastAngle = liveAngleVal;
    state.lastAngleTime = now;
  }

  const isTooFast = (state.angularVelocity || 0) > 220;
  state.speedWarning = isTooFast;

  // 2. Normalization of Player Angle to Vertical Y Position (Side-Scrolling)
  const successAng = currentExercise?.success_angle ?? currentExercise?.successAngle ?? 85;
  const failAng = currentExercise?.failure_angle ?? currentExercise?.failureAngle ?? 150;
  const curAngle = (liveAngleVal !== undefined && !isNaN(liveAngleVal) && liveAngleVal > 0) ? liveAngleVal : (successAng + failAng) / 2;
  
  // Normalized 0.0 (rest / bottom) to 1.0 (target / top)
  const angleRange = successAng - failAng;
  let normalizedRom = angleRange !== 0 ? (curAngle - failAng) / angleRange : 0.5;
  normalizedRom = Math.max(0, Math.min(1, normalizedRom));

  // Player vertical bounds: 65px (top sky) to canvas.height - 65px (bottom ground)
  const minY = 65;
  const maxY = canvas.height - 65;
  const targetPlayerY = maxY - normalizedRom * (maxY - minY);
  // Smooth spring follow
  state.playerY += (targetPlayerY - state.playerY) * 0.18;

  const playerX = 140; // Fixed horizontal position on left side

  // 3. Render Side-Scrolling Cyberpunk Synthwave Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#040010');
  bgGrad.addColorStop(0.5, '#12022b');
  bgGrad.addColorStop(1, '#060014');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Parallax Synthwave City Skyline in background
  ctx.fillStyle = '#1e0842';
  const buildingW = 45;
  for (let i = -1; i < Math.ceil(canvas.width / buildingW) + 2; i++) {
    const bx = i * buildingW - (state.bgScroll * 0.4) % buildingW;
    const bHeight = 70 + Math.sin(i * 99) * 45;
    ctx.fillRect(bx, canvas.height - bHeight - 30, buildingW - 4, bHeight + 30);

    // Glowing window lights
    ctx.fillStyle = '#ff007f33';
    ctx.fillRect(bx + 6, canvas.height - bHeight - 15, 6, 8);
    ctx.fillStyle = '#00f0ff33';
    ctx.fillRect(bx + 18, canvas.height - bHeight - 15, 6, 8);
    ctx.fillStyle = '#1e0842';
  }

  // Scrolling Neon Ground & Ceiling Laser Rails
  ctx.strokeStyle = '#00f0ff66';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  
  // Top Rail
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(canvas.width, 40);
  ctx.stroke();

  // Bottom Rail
  ctx.strokeStyle = '#ff007f66';
  ctx.shadowColor = '#ff007f';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 40);
  ctx.lineTo(canvas.width, canvas.height - 40);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Horizontal Grid Lines with side scrolling motion
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
  ctx.lineWidth = 1;
  for (let y = 60; y < canvas.height - 40; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  const vertScroll = state.bgScroll % 40;
  for (let x = -vertScroll; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, canvas.height - 40);
    ctx.stroke();
  }

  // 4. Spawn Rhythm Notes Scrolling from Right to Left
  // Spawn every 60 frames (~1.0s at 60fps)
  if (state.frameIndex % 60 === 0) {
    const heightPatterns = [0.92, 0.25, 0.85, 0.40, 0.70, 0.95];
    const targetRomVal = heightPatterns[state.notes.length % heightPatterns.length];
    const isSpecialStar = targetRomVal > 0.9 && (state.notes.length % 3 === 0);

    const noteY = maxY - targetRomVal * (maxY - minY);

    state.notes.push({
      id: state.frameIndex,
      x: canvas.width + 40, // Spawn offscreen on the right
      y: noteY,
      targetRom: targetRomVal,
      type: isSpecialStar ? 'STAR' : 'CUBE',
      color: isSpecialStar ? '#fbbf24' : (targetRomVal > 0.6 ? '#00f0ff' : '#ff007f'),
      speed: 4.8, // Speed scrolling from Right to Left
      sliced: false,
      rotation: 0
    });
  }

  // 5. Update & Draw Incoming Rhythm Notes
  const activeNotes = [];

  for (let note of state.notes) {
    note.x -= note.speed; // Move from Right to Left
    note.rotation += 0.04;

    // Check Slicing Collision when note reaches Player's X corridor (x between playerX - 35 and playerX + 35)
    if (!note.sliced && note.x >= playerX - 40 && note.x <= playerX + 40) {
      const yDistance = Math.abs(state.playerY - note.y);

      // Hit threshold: Player's blade is within 45px vertically of the incoming note
      if (yDistance < 45) {
        if (isPostureInvalid) {
          // Form compensation locks the cyber blade
          state.combo = 0;
          state.multiplier = 1;
          if (state.frameIndex % 25 === 0) {
            state.floatTexts.push({
              x: note.x,
              y: note.y - 25,
              text: '⚠️ FORM LOCKED',
              color: '#ef4444',
              alpha: 1
            });
          }
        } else {
          note.sliced = true;
          state.slashAnim = 12; // Trigger blade slash animation trail
          
          const isPerfect = yDistance < 18;
          const basePts = note.type === 'STAR' ? 350 : (isPerfect ? 250 : 100);
          
          // Speed penalty multiplier
          const speedPenalty = isTooFast ? 0.5 : 1.0;
          const awardedPoints = Math.round(basePts * state.multiplier * speedPenalty);

          state.score += awardedPoints;
          state.combo += 1;
          state.totalNotesSliced += 1;
          if (isPerfect) state.perfectCount += 1;

          // Combo Multipliers
          if (state.combo >= 20) state.multiplier = 4;
          else if (state.combo >= 10) state.multiplier = 3;
          else if (state.combo >= 5) state.multiplier = 2;
          else state.multiplier = 1;

          // Flying Split Halves (Fling Up-Left and Down-Left)
          state.slices.push(
            { x: note.x, y: note.y, vx: -5, vy: -5, rot: 0, vRot: -0.2, color: note.color, alpha: 1 },
            { x: note.x, y: note.y, vx: -3, vy: 5, rot: 0, vRot: 0.2, color: note.color, alpha: 1 }
          );

          // Expanding Shockwave Ring
          state.rings.push({
            x: note.x,
            y: note.y,
            radius: 12,
            color: note.color,
            alpha: 1
          });

          // Spark Particle Burst
          for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 8 + 3;
            state.particles.push({
              x: note.x,
              y: note.y,
              vx: Math.cos(angle) * spd - 2,
              vy: Math.sin(angle) * spd,
              color: note.color,
              alpha: 1,
              size: Math.random() * 4 + 2
            });
          }

          // Floating Score Indicator
          state.floatTexts.push({
            x: note.x,
            y: note.y - 25,
            text: isTooFast 
              ? `⚠️ SLOW DOWN! +${awardedPoints}` 
              : isPerfect ? `⚡ PERFECT SLICE! +${awardedPoints}` : `✨ SLICE! +${awardedPoints}`,
            color: isTooFast ? '#f59e0b' : (isPerfect ? '#00f0ff' : '#ff007f'),
            alpha: 1
          });

          // Count clinical repetition every 2 successful rhythm slices
          if (state.totalNotesSliced % 2 === 0) {
            if (repsRef && setReps) {
              repsRef.current += 1;
              setReps(repsRef.current);
              if (speakText) speakText(`Rep ${repsRef.current}`);
            }
          }
        }
      }
    }

    // Missed Note (Passed by player without being sliced)
    if (!note.sliced && note.x < playerX - 50) {
      state.combo = 0;
      state.multiplier = 1;
    }

    // Draw Note if on screen
    if (note.x > -50 && !note.sliced) {
      ctx.save();
      ctx.translate(note.x, note.y);
      ctx.rotate(note.rotation);

      ctx.shadowColor = note.color;
      ctx.shadowBlur = 20;

      const size = note.type === 'STAR' ? 36 : 30;

      // Outer Glowing Box
      ctx.fillStyle = note.color;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 8);
      ctx.fill();

      // Inner Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-size / 3, -size / 3, (size * 2) / 3, (size * 2) / 3, 4);
      ctx.fill();

      // Direction Arrow inside
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.targetRom > 0.6 ? '▲' : '▼', 0, 1);

      ctx.restore();
      activeNotes.push(note);
    }
  }
  state.notes = activeNotes;

  // 6. Draw Split Flying Halves
  const activeSlices = [];
  for (let s of state.slices) {
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.3; // Gravity
    s.rot += s.vRot;
    s.alpha -= 0.04;

    if (s.alpha > 0) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = Math.max(0, s.alpha);

      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 15;
      ctx.fillRect(-12, -12, 12, 24);
      ctx.restore();
      activeSlices.push(s);
    }
  }
  state.slices = activeSlices;

  // 7. Draw Expanding Shockwave Rings
  const activeRings = [];
  for (let r of state.rings) {
    r.radius += 5;
    r.alpha -= 0.05;
    if (r.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      activeRings.push(r);
    }
  }
  state.rings = activeRings;

  // 8. Draw Particle Sparks
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

  // 9. Draw Floating Score Text Popups
  const activeFloatTexts = [];
  for (let t of state.floatTexts) {
    t.y -= 1.5;
    t.alpha -= 0.03;
    if (t.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.textAlign = 'center';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
      activeFloatTexts.push(t);
    }
  }
  state.floatTexts = activeFloatTexts;

  // 10. Draw Slice Target Guide Line on Left Side
  ctx.strokeStyle = isPostureInvalid ? '#ef4444' : 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(playerX, 40);
  ctx.lineTo(playerX, canvas.height - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // 11. Draw Player's Side-Scrolling Neon Cyber Blade Avatar
  const bladeY = state.playerY;
  const saberTilt = state.bladeAngle || 0;
  const saberColor = isPostureInvalid ? '#ef4444' : isTooFast ? '#f59e0b' : '#00f0ff';

  // Slash Arc Trail if recently sliced
  if (state.slashAnim > 0) {
    state.slashAnim -= 1;
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(playerX, bladeY, 60, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(playerX, bladeY);
  ctx.rotate(saberTilt);

  // Outer Glowing Light Blade (Points forward towards incoming notes)
  ctx.shadowColor = saberColor;
  ctx.shadowBlur = 25;
  ctx.strokeStyle = saberColor;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  
  // Forward-extending Beam
  ctx.beginPath();
  ctx.moveTo(-35, 0);
  ctx.lineTo(55, 0);
  ctx.stroke();

  // White Core Laser
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.lineTo(48, 0);
  ctx.stroke();

  // Cyber Handle Emitter Grip
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = saberColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-42, -10, 26, 20, 5);
  ctx.fill();
  ctx.stroke();

  // Glowing Blade Tip Energy Spark
  ctx.fillStyle = '#ff007f';
  ctx.beginPath();
  ctx.arc(55, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 12. Top HUD Information
  // Top Left: Score & Combo
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 30, 30);

  if (state.combo > 1) {
    ctx.fillStyle = '#ff007f';
    ctx.font = '900 14px system-ui, sans-serif';
    ctx.fillText(`COMBO x${state.combo} • ${state.multiplier}x BOOST`, 30, 52);
  }

  // Top Right: Live Angle & Target Height
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText(`${Math.round(curAngle)}°`, canvas.width - 30, 30);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`Target: ${successAng}° • Rest: ${failAng}°`, canvas.width - 30, 52);
  ctx.textAlign = 'left';

  // Bottom Status Alerts
  if (isTooFast) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillText('⚠️ SPEED PENALTY ACTIVE: Move smoothly to earn full score!', canvas.width / 2, canvas.height - 15);
    ctx.restore();
  }

  if (isPostureInvalid) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 14px system-ui, sans-serif';
    ctx.fillText('🚫 POSTURE FAULT: Straighten posture to slice incoming notes!', canvas.width / 2, canvas.height - 30);
    ctx.restore();
  }
};
