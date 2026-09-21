export const init = () => ({
  bloomPercentage: 20,
  flowers: [
    { x: 220, y: 440, color: 'hsl(330, 90%, 65%)', scale: 0.9 },
    { x: 420, y: 435, color: 'hsl(280, 85%, 65%)', scale: 0.85 }
  ],
  petals: Array.from({ length: 15 }, () => ({
    x: Math.random() * 640,
    y: Math.random() * 480,
    vx: Math.random() * 0.8 - 0.4,
    vy: Math.random() * 0.6 + 0.3,
    size: Math.random() * 4 + 2,
    alpha: Math.random() * 0.6 + 0.2
  })),
  plantHeight: 65
});

export const draw = (ctx, canvas, state, params) => {
  const { video, isHolding, isPostureInvalid, liveAngleVal, currentExercise } = params;

  if (!state.flowers) state.flowers = [];
  if (!state.petals) state.petals = [];
  if (state.plantHeight === undefined) state.plantHeight = 65;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, isPostureInvalid ? '#1a0505' : '#0a101d');
  grad.addColorStop(1, isPostureInvalid ? '#2d0c0c' : '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floating ambient petals
  state.petals.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Calculate live ROM bloom if not in hold mode
  if (!isHolding && liveAngleVal !== undefined && currentExercise) {
    const minAngle = currentExercise?.failure_angle ?? currentExercise?.failureAngle ?? 150;
    const maxAngle = currentExercise?.success_angle ?? currentExercise?.successAngle ?? 85;
    const range = maxAngle - minAngle;
    if (range !== 0 && liveAngleVal > 0) {
      const romRatio = Math.max(0, Math.min(1, (liveAngleVal - minAngle) / range));
      const targetBloom = romRatio * 100;
      state.bloomPercentage = (state.bloomPercentage || 0) + (targetBloom - (state.bloomPercentage || 0)) * 0.12;
    }
  }

  // Render camera box in corner for reference
  if (video) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(480, 20, 140, 105);
    ctx.clip();
    ctx.drawImage(video, 480, 20, 140, 105);
    ctx.restore();
    ctx.strokeStyle = isPostureInvalid ? '#ef4444' : '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(480, 20, 140, 105);
  }

  // Grass mound
  ctx.fillStyle = isPostureInvalid ? '#7f1d1d' : '#064e3b';
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height + 40, canvas.width * 0.6, 90, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw procedural stem
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height - 15);
  ctx.quadraticCurveTo(canvas.width / 2 - 30, canvas.height - 100, canvas.width / 2, canvas.height - state.plantHeight);
  ctx.strokeStyle = isPostureInvalid ? '#dc2626' : '#10b981';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Render leaves
  const leafY = canvas.height - (state.plantHeight / 1.8);
  ctx.fillStyle = isPostureInvalid ? '#991b1b' : '#047857';
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2 - 22, leafY, 26, 12, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2 + 22, leafY - 15, 26, 12, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Bud/Flower head indicator
  const effectiveBloom = isPostureInvalid ? 0 : (state.bloomPercentage || 0);
  const budRad = 16 + (effectiveBloom / 100) * 16;
  
  // Outer Petals
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height - state.plantHeight);
  const petalScale = 0.5 + (effectiveBloom / 100) * 0.7;
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = isPostureInvalid ? '#f87171' : '#f43f5e';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, -budRad * 1.1 * petalScale, budRad * 0.75 * petalScale, budRad * 1.1 * petalScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Center pistil
  ctx.fillStyle = isPostureInvalid ? '#fca5a5' : '#fef08a';
  ctx.beginPath();
  ctx.arc(0, 0, budRad * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Renders bloomed garden
  state.flowers.forEach((f) => {
    if (f.scale < 1.0) f.scale += 0.04;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.scale, f.scale);
    
    ctx.fillStyle = f.color;
    for (let i = 0; i < 5; i++) {
      const ang = (i * 2 * Math.PI) / 5;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 16, Math.sin(ang) * 16, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Text overlay indicators
  if (isPostureInvalid) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText("⚠️ COMPENSATION DETECTED — ALIGN POSTURE TO BLOOM", 30, 40);
  } else {
    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`🌸 ZEN GARDEN BLOOM: ${Math.round(effectiveBloom)}%`, 30, 40);
  }
};
