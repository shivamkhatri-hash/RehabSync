/**
 * BeatRehab — Ultimate Synthwave Rhythm & Slicing Arcade
 * Inspired by Beat Saber / Synth Riders
 * 
 * Full 3D Air Trajectory, Multi-Lane & Multi-Height Floating Cubes,
 * Angle-Tilting Dual Light Blades, Shockwave Splitting FX, and Visualizer Equalizers.
 */

export const init = () => ({
  frameIndex: 0,
  score: 0,
  combo: 0,
  multiplier: 1,
  notes: [], // Array of incoming rhythm blocks
  particles: [], // Spark bursts
  slices: [], // Flying split cube halves
  rings: [], // Expanding impact shockwave rings
  floatTexts: [], // Floating score indicators
  lastAngle: 0,
  lastAngleTime: Date.now(),
  angularVelocity: 0,
  speedWarning: false,
  bladeAngle: 0,
  totalNotesSliced: 0,
  perfectCount: 0,
  lastSpawnedHeight: 'high'
});

export const draw = (ctx, canvas, state, params) => {
  const { liveAngleVal, currentExercise, speakText, repsRef, setReps, isPostureInvalid } = params;

  // Initialize collections if needed
  if (!state.notes) state.notes = [];
  if (!state.particles) state.particles = [];
  if (!state.slices) state.slices = [];
  if (!state.rings) state.rings = [];
  if (!state.floatTexts) state.floatTexts = [];
  if (state.score === undefined) state.score = 0;
  if (state.combo === undefined) state.combo = 0;
  if (state.multiplier === undefined) state.multiplier = 1;

  state.frameIndex += 1;
  const now = Date.now();

  // 1. Angular Velocity Calculation (Speed Penalty)
  const dt = (now - (state.lastAngleTime || now)) / 1000;
  if (dt > 0.025 && liveAngleVal !== undefined && state.lastAngle !== undefined) {
    const rawVel = Math.abs(liveAngleVal - state.lastAngle) / dt;
    state.angularVelocity = (state.angularVelocity || 0) * 0.75 + rawVel * 0.25;
    
    // Smooth blade tilt according to movement direction
    const angleDelta = liveAngleVal - state.lastAngle;
    state.bladeAngle = (state.bladeAngle || 0) * 0.8 + (angleDelta * 0.04);
    state.lastAngle = liveAngleVal;
    state.lastAngleTime = now;
  }

  const isTooFast = (state.angularVelocity || 0) > 220;
  state.speedWarning = isTooFast;

  // 2. Normalization of Player Angle & Saber Elevation Across Screen
  const successAng = currentExercise?.successAngle || 90;
  const failAng = currentExercise?.failureAngle || 160;
  const curAngle = liveAngleVal !== undefined ? liveAngleVal : (successAng + failAng) / 2;
  
  // Normalized 0.0 (rest/bottom) to 1.0 (peak stretch/top)
  let normalizedRom = (curAngle - failAng) / (successAng - failAng);
  normalizedRom = Math.max(0, Math.min(1, normalizedRom));

  // Saber blade vertical range across screen: 100px (top sky) to 420px (bottom ground)
  const hitZoneZ = 0.88; // Progress along 3D track where hit occurs
  const minBladeY = canvas.height * 0.88; // Bottom ground position
  const maxBladeY = canvas.height * 0.22; // High sky position
  const currentBladeY = minBladeY - normalizedRom * (minBladeY - maxBladeY);

  // 3. Render Cyberpunk Synthwave Stage & Sky
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#060012');
  bgGrad.addColorStop(0.4, '#1b033d');
  bgGrad.addColorStop(0.75, '#29064a');
  bgGrad.addColorStop(1, '#050010');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glowing Horizon Sun
  const sunCenterY = canvas.height * 0.42;
  const sunGrad = ctx.createRadialGradient(
    canvas.width / 2, sunCenterY, 15,
    canvas.width / 2, sunCenterY, 160
  );
  sunGrad.addColorStop(0, '#ff0077');
  sunGrad.addColorStop(0.5, '#ff8800');
  sunGrad.addColorStop(0.85, '#ff00aa33');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, sunCenterY, 160, Math.PI, 0);
  ctx.fill();

  // Horizontal Sun Blinds / Laser Stripes
  ctx.fillStyle = '#060012';
  for (let i = 0; i < 7; i++) {
    const blindY = sunCenterY - 10 - i * 16;
    const blindH = 2 + i * 1.5;
    ctx.fillRect(canvas.width / 2 - 160, blindY, 320, blindH);
  }

  // 3D Perspective Road & Highway
  const vpX = canvas.width / 2;
  const horizonY = sunCenterY;
  const bottomY = canvas.height;

  // Lateral perspective highway lines
  ctx.lineWidth = 1.5;
  const roadLanes = [-320, -200, -90, 0, 90, 200, 320];
  for (let offset of roadLanes) {
    ctx.strokeStyle = offset === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.25)';
    ctx.beginPath();
    ctx.moveTo(vpX, horizonY);
    ctx.lineTo(vpX + offset * 2.4, bottomY);
    ctx.stroke();
  }

  // Grid scrolling lines
  const gridScroll = (state.frameIndex * 3.5) % 40;
  for (let y = horizonY; y < bottomY; y += 20) {
    const progress = (y - horizonY) / (bottomY - horizonY);
    const scrollY = horizonY + Math.pow(progress, 1.7) * (bottomY - horizonY) + gridScroll * progress;
    if (scrollY <= bottomY) {
      ctx.strokeStyle = `rgba(217, 70, 239, ${0.1 + progress * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(0, scrollY);
      ctx.lineTo(canvas.width, scrollY);
      ctx.stroke();
    }
  }

  // Flanking Audio Equalizer Bars (Left & Right)
  for (let i = 0; i < 14; i++) {
    const eqH = Math.sin((state.frameIndex * 0.15) + i * 0.6) * 35 + 40;
    
    // Left Equalizer
    const leftGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    leftGrad.addColorStop(0, '#06b6d4');
    leftGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(15 + i * 7, canvas.height * 0.65 - eqH, 4, eqH);

    // Right Equalizer
    const rightGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    rightGrad.addColorStop(0, '#ec4899');
    rightGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(canvas.width - 25 - i * 7, canvas.height * 0.65 - eqH, 4, eqH);
  }

  // 4. Spawn Dynamic Floating Rhythm Notes at Varied Heights & Lanes
  // Spawns every 60 frames (~1.0 sec)
  if (state.frameIndex % 65 === 0) {
    // Alternate through High Peak (0.95), Upper Mid (0.7), Lower Mid (0.35), Low Stretch (0.1)
    const heightPatterns = [0.92, 0.35, 0.85, 0.20, 0.75, 0.95];
    const targetRomVal = heightPatterns[state.notes.length % heightPatterns.length];
    
    // Lanes: -1 (Left), 0 (Center), 1 (Right)
    const laneX = ((state.notes.length % 3) - 1) * 110;
    const isSpecialStar = targetRomVal > 0.9 && (state.notes.length % 4 === 0);

    state.notes.push({
      id: state.frameIndex,
      progress: 0, // 0 (far horizon) to 1.1 (past screen)
      targetRom: targetRomVal,
      laneX: laneX,
      color: isSpecialStar ? '#fbbf24' : (targetRomVal > 0.6 ? '#00f0ff' : '#ff007f'),
      type: isSpecialStar ? 'STAR' : 'CUBE',
      sliced: false,
      rotation: Math.random() * Math.PI * 2
    });
  }

  // 5. Update & Draw Incoming Floating Rhythm Notes
  const activeNotes = [];

  for (let note of state.notes) {
    note.progress += 0.016; // Incoming flight speed
    note.rotation += 0.03;

    // 3D Perspective Scaling & Positioning
    const scale = 0.2 + Math.pow(note.progress, 2.2) * 1.4;
    
    // Note Target Screen Y (interpolated from horizon at start to true height at hit line)
    const finalY = minBladeY - note.targetRom * (minBladeY - maxBladeY);
    const startY = horizonY - 20;
    const noteY = startY + (finalY - startY) * Math.pow(note.progress, 1.2);
    const noteX = vpX + note.laneX * scale;

    // Hit Detection when note reaches slice zone (progress around 0.84 to 0.94)
    if (!note.sliced && note.progress >= 0.82 && note.progress <= 0.94) {
      const romDiff = Math.abs(normalizedRom - note.targetRom);

      // Successful Hit threshold
      if (romDiff < 0.20 && !isPostureInvalid) {
        note.sliced = true;
        const isPerfect = romDiff < 0.07;
        const basePts = note.type === 'STAR' ? 350 : (isPerfect ? 250 : 100);
        
        // Speed Penalty logic
        const speedPenalty = isTooFast ? 0.5 : 1.0;
        const awardedPoints = Math.round(basePts * state.multiplier * speedPenalty);

        state.score += awardedPoints;
        state.combo += 1;
        state.totalNotesSliced += 1;
        if (isPerfect) state.perfectCount += 1;

        // Upgrade Multiplier
        if (state.combo >= 20) state.multiplier = 4;
        else if (state.combo >= 10) state.multiplier = 3;
        else if (state.combo >= 5) state.multiplier = 2;
        else state.multiplier = 1;

        // Add Flying Split Cube Halves
        state.slices.push(
          { x: noteX, y: noteY, vx: -6, vy: -4, rot: 0, vRot: -0.15, color: note.color, alpha: 1, scale },
          { x: noteX, y: noteY, vx: 6, vy: -3, rot: 0, vRot: 0.15, color: note.color, alpha: 1, scale }
        );

        // Add Expanding Shockwave Ring
        state.rings.push({
          x: noteX,
          y: noteY,
          radius: 10,
          color: note.color,
          alpha: 1
        });

        // Add Particle Sparks
        for (let i = 0; i < 22; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 8 + 3;
          state.particles.push({
            x: noteX,
            y: noteY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color: note.color,
            alpha: 1,
            size: Math.random() * 4 + 2
          });
        }

        // Floating Text Popup
        state.floatTexts.push({
          x: noteX,
          y: noteY - 20,
          text: isTooFast 
            ? `⚠️ SLOW DOWN! +${awardedPoints}` 
            : isPerfect ? `⚡ PERFECT! +${awardedPoints}` : `✨ SLICE! +${awardedPoints}`,
          color: isTooFast ? '#f59e0b' : (isPerfect ? '#00f0ff' : '#ff007f'),
          alpha: 1
        });

        // Log clinical rep every 2 completed high/low slice transitions
        if (state.totalNotesSliced % 2 === 0) {
          if (repsRef && setReps) {
            repsRef.current += 1;
            setReps(repsRef.current);
            if (speakText) speakText(`Rep ${repsRef.current}`);
          }
        }
      }
    }

    // Missed Note Reset
    if (!note.sliced && note.progress > 0.98) {
      state.combo = 0;
      state.multiplier = 1;
    }

    // Render Note (Floating 3D Cube / Star)
    if (note.progress <= 1.05 && !note.sliced) {
      ctx.save();
      ctx.translate(noteX, noteY);
      ctx.scale(scale, scale);

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

      // Directional Slice Icon (Up arrow for high notes, Down arrow for low notes)
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.targetRom > 0.6 ? '▲' : '▼', 0, 1);

      ctx.restore();
      activeNotes.push(note);
    }
  }
  state.notes = activeNotes;

  // 6. Draw Split Flying Cube Halves
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
      ctx.scale(s.scale, s.scale);
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

  // 10. Draw Slice Hit Line Corridor in 3D Space
  const hitLineY = canvas.height * 0.82;
  ctx.strokeStyle = isPostureInvalid ? '#ef4444' : 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(vpX - 260, hitLineY);
  ctx.lineTo(vpX + 260, hitLineY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 11. Draw Player's Dynamic Dual-Energy Light Saber (Follows Full ROM Elevation)
  const bladeX = vpX;
  const bladeWidth = 320;
  const saberTilt = state.bladeAngle || 0;
  const saberColor = isPostureInvalid ? '#ef4444' : isTooFast ? '#f59e0b' : '#00f0ff';

  ctx.save();
  ctx.translate(bladeX, currentBladeY);
  ctx.rotate(saberTilt);

  // Outer Neon Saber Glow
  ctx.shadowColor = saberColor;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = saberColor;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-bladeWidth / 2, 0);
  ctx.lineTo(bladeWidth / 2, 0);
  ctx.stroke();

  // Core Pure White Laser Beam
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-bladeWidth / 2 + 15, 0);
  ctx.lineTo(bladeWidth / 2 - 15, 0);
  ctx.stroke();

  // Saber Center Emitter Grip
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = saberColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-24, -8, 48, 16, 6);
  ctx.fill();
  ctx.stroke();

  // Left & Right Blade Tip Energy Orbs
  ctx.fillStyle = '#ff007f';
  ctx.beginPath();
  ctx.arc(-bladeWidth / 2, 0, 8, 0, Math.PI * 2);
  ctx.arc(bladeWidth / 2, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 12. Futuristic Top HUD Display
  // Top Left: Score & Multiplier
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 30, 45);

  if (state.combo > 1) {
    ctx.fillStyle = '#ff007f';
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.fillText(`COMBO x${state.combo} • ${state.multiplier}x MULTIPLIER`, 30, 72);
  }

  // Top Right: Live Biomechanical Angle & Elevation Meter
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText(`${Math.round(curAngle)}°`, canvas.width - 30, 45);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`Target: ${successAng}° • Rest: ${failAng}°`, canvas.width - 30, 68);
  ctx.textAlign = 'left';

  // Bottom Alerts (Speed & Posture)
  if (isTooFast) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillText('⚠️ SPEED PENALTY ACTIVE: Slow down for full eccentric score!', vpX, canvas.height - 20);
    ctx.restore();
  }

  if (isPostureInvalid) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 14px system-ui, sans-serif';
    ctx.fillText('🚫 POSTURE COMPENSATION DETECTED: Straighten form to slice!', vpX, canvas.height - 40);
    ctx.restore();
  }
};
