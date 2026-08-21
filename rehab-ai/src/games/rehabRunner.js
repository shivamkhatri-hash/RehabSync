export const init = () => ({
  runnerLane: 1,
  runnerY: 0,
  runnerJumpVelocity: 0,
  runnerScore: 0,
  obstacles: [],
  runnerCoins: [],
  frameIndex: 0
});

export const draw = (ctx, canvas, state, params) => {
  const { video, detectedLandmarks, speakText } = params;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const horizonY = canvas.height * 0.45;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(canvas.width, horizonY);
  ctx.stroke();

  // Draw lanes perspective grid lines
  const cx = canvas.width / 2;
  ctx.strokeStyle = '#334155';
  [-1.5, -0.5, 0.5, 1.5].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(cx + offset * 30, horizonY);
    ctx.lineTo(cx + offset * 240, canvas.height);
    ctx.stroke();
  });

  // Mini Camera Box in corner
  if (video) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 20, 100, 75);
    ctx.clip();
    ctx.drawImage(video, 20, 20, 100, 75);
    ctx.restore();
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(20, 20, 100, 75);
  }

  // Lean offset coordinates detector
  if (detectedLandmarks) {
    const leftShoulder = detectedLandmarks[11];
    const rightShoulder = detectedLandmarks[12];
    const leftHip = detectedLandmarks[23];
    const rightHip = detectedLandmarks[24];

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const midS = (leftShoulder.x + rightShoulder.x) / 2;
      const midH = (leftHip.x + rightHip.x) / 2;
      const offset = midS - midH; // screen offset
      
      // camera mirrored -> leaning left moves right
      let lane = 1; // 0 left, 1 center, 2 right
      if (offset > 0.045) lane = 0;
      else if (offset < -0.045) lane = 2;
      state.runnerLane = lane;
    }
  }

  // Jump physics update
  if (state.runnerY > 0 || state.runnerJumpVelocity !== 0) {
    state.runnerY += state.runnerJumpVelocity;
    state.runnerJumpVelocity -= 0.6; // gravity speed
    if (state.runnerY <= 0) {
      state.runnerY = 0;
      state.runnerJumpVelocity = 0;
    }
  }

  // Spawn barriers & coins
  state.frameIndex += 1;
  if (state.frameIndex % 110 === 0) {
    const laneOption = Math.floor(Math.random() * 3);
    const isCoin = Math.random() > 0.5;
    if (isCoin) {
      state.runnerCoins.push({ lane: laneOption, z: 0.1, passed: false });
    } else {
      const fullHurdle = Math.random() < 0.35;
      state.obstacles.push({
        lane: laneOption,
        z: 0.1,
        isFullHurdle: fullHurdle,
        passed: false,
        hit: false
      });
    }
  }

  // Render player runner avatar (glowing circle)
  const laneX = [cx - 130, cx, cx + 130];
  const px = laneX[state.runnerLane];
  const py = canvas.height - 65 - state.runnerY;

  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.arc(px, py, 16, 0, Math.PI * 2);
  ctx.fill();

  // Obstacles render & collision loop
  state.obstacles.forEach((obs) => {
    obs.z += 0.015;
    const zs = obs.z;
    const ox = cx + (obs.lane - 1) * 130 * zs;
    const oy = horizonY + (canvas.height - horizonY - 60) * zs;
    const size = 12 + zs * 38;

    if (obs.isFullHurdle) {
      ctx.fillStyle = obs.hit ? '#f43f5e' : '#b91c1c';
      ctx.fillRect(cx - 150 * zs, oy - size / 2, 300 * zs, size / 3);
    } else {
      ctx.fillStyle = obs.hit ? '#f43f5e' : '#dc2626';
      ctx.fillRect(ox - size / 2, oy - size / 2, size, size);
    }

    // Checks bounds collision at player position depth
    if (zs >= 0.85 && zs <= 0.95 && !obs.hit) {
      if (obs.isFullHurdle) {
        if (state.runnerY < 18) {
          obs.hit = true;
          speakText("Jump!");
        }
      } else {
        if (state.runnerLane === obs.lane && state.runnerY < 10) {
          obs.hit = true;
          speakText("Dodge!");
        }
      }
    }

    if (zs >= 1.0 && !obs.passed) {
      obs.passed = true;
      if (!obs.hit) {
        state.runnerScore += 10;
      }
    }
  });

  // Coins render & collection loop
  state.runnerCoins.forEach((coin) => {
    coin.z += 0.015;
    const zs = coin.z;
    const kx = cx + (coin.lane - 1) * 130 * zs;
    const ky = horizonY + (canvas.height - horizonY - 60) * zs;
    const kSize = 5 + zs * 15;

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(kx, ky, kSize, 0, Math.PI * 2);
    ctx.fill();

    if (zs >= 0.85 && zs <= 0.95 && !coin.passed) {
      if (state.runnerLane === coin.lane && state.runnerY < 18) {
        coin.passed = true;
        state.runnerScore += 25;
        speakText("Nice catch!");
      }
    }
  });

  state.obstacles = state.obstacles.filter(o => o.z < 1.1);
  state.runnerCoins = state.runnerCoins.filter(c => c.z < 1.1);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`Run Score: ${state.runnerScore}`, 140, 45);
};
