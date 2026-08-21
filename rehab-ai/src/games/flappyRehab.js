export const init = () => ({
  flappyY: 240,
  flappyScore: 0,
  gates: [],
  frameIndex: 0
});

export const draw = (ctx, canvas, state, params) => {
  const { video, liveAngleVal, currentExercise, speakText, repsRef, setReps } = params;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#020617');
  bgGrad.addColorStop(1, '#0b1329');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid backdrop
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const scroll = (state.frameIndex * 2) % 40;
  for (let x = -scroll; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Mini Web Camera overlay
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
  if (state.frameIndex % 150 === 0) {
    const gap = 160;
    const topH = 80 + Math.random() * (canvas.height - 300);
    state.gates.push({
      x: canvas.width,
      topHeight: topH,
      bottomHeight: topH + gap,
      passed: false,
      hit: false
    });
  }

  // Convert angle flexion value to ship Y height
  const minAngle = currentExercise.failure_angle;
  const maxAngle = currentExercise.success_angle;
  const range = maxAngle - minAngle;
  const ratio = Math.max(0, Math.min(1, (liveAngleVal - minAngle) / (range || 1)));
  const targetY = canvas.height - 60 - ratio * (canvas.height - 120);
  state.flappyY += (targetY - state.flappyY) * 0.12;

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
    gate.x -= 3;
    
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
        }
      }
    }

    // Gate clean pass checking
    if (!gate.passed && gate.x + 50 < px) {
      gate.passed = true;
      if (!gate.hit) {
        state.flappyScore += 1;
        repsRef.current += 1;
        setReps(repsRef.current);
        speakText("Good pass!");
      }
    }
  });

  // Filter out of bounds gates
  state.gates = state.gates.filter(g => g.x > -80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`Gates Passed: ${state.flappyScore}`, 140, 45);
};
