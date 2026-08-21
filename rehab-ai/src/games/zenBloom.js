export const init = () => ({
  bloomPercentage: 0,
  flowers: [],
  plantHeight: 30
});

export const draw = (ctx, canvas, state, params) => {
  const { video, isHolding } = params;
  
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render camera box in corner for reference
  if (video) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(480, 20, 140, 105);
    ctx.clip();
    ctx.drawImage(video, 480, 20, 140, 105);
    ctx.restore();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(480, 20, 140, 105);
  }

  // Grass mound
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height + 40, canvas.width * 0.6, 90, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw procedural stem
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height - 15);
  ctx.quadraticCurveTo(canvas.width / 2 - 30, canvas.height - 100, canvas.width / 2, canvas.height - state.plantHeight);
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Render leaves
  const leafY = canvas.height - (state.plantHeight / 1.8);
  ctx.fillStyle = '#115e59';
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2 - 20, leafY, 24, 10, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2 + 20, leafY - 15, 24, 10, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Bud/Flower head indicator
  const budRad = 16 + (state.bloomPercentage / 100) * 12;
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - state.plantHeight, budRad, 0, Math.PI * 2);
  ctx.fill();

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
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Text overlay indicators
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText("ZEN GARDEN STRETCH MODE", 30, 40);
};
