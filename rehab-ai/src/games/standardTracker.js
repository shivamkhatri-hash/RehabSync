const SKELETON_CONNECTIONS = [
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28]
];

const STICK_FIGURE_JOINTS = [
  11, 12, 13, 14, 15, 16,
  23, 24, 25, 26, 27, 28
];

const drawConnection = (ctx, landmarks, indexA, indexB, width, height, isActive, isHolding, isPostureInvalid) => {
  const ptA = landmarks[indexA];
  const ptB = landmarks[indexB];
  
  if (!ptA || !ptB || (ptA.visibility ?? 1) < 0.45 || (ptB.visibility ?? 1) < 0.45) return;
  
  ctx.beginPath();
  ctx.moveTo(ptA.x * width, ptA.y * height);
  ctx.lineTo(ptB.x * width, ptB.y * height);
  
  if (isActive) {
    ctx.strokeStyle = isPostureInvalid ? '#ef4444' : (isHolding ? '#ec4899' : '#06b6d4');
    ctx.lineWidth = 8;
    ctx.shadowColor = isPostureInvalid ? 'rgba(239, 68, 68, 0.4)' : (isHolding ? 'rgba(236, 72, 153, 0.4)' : 'rgba(6, 182, 212, 0.4)');
    ctx.shadowBlur = 10;
  } else {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 0;
  }
  
  ctx.stroke();
  ctx.shadowBlur = 0; // reset
};

export const draw = (ctx, canvas, params) => {
  const { video, detectedLandmarks, resolvedJoints, isHolding, isPostureInvalid, postureAlert } = params;

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (detectedLandmarks) {
    const mirroredLandmarks = detectedLandmarks.map(pt => ({
      ...pt,
      x: 1 - pt.x
    }));

    const activeSet = new Set(resolvedJoints || []);

    SKELETON_CONNECTIONS.forEach(([a, b]) => {
      const isActive = activeSet.has(a) && activeSet.has(b);
      drawConnection(ctx, mirroredLandmarks, a, b, canvas.width, canvas.height, isActive, isHolding, isPostureInvalid);
    });

    STICK_FIGURE_JOINTS.forEach((index) => {
      const pt = mirroredLandmarks[index];
      if (!pt || (pt.visibility ?? 1) < 0.45) return;

      const isActive = activeSet.has(index);
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, isActive ? 8 : 5, 0, Math.PI * 2);
      
      ctx.fillStyle = isActive 
        ? (isPostureInvalid ? '#ef4444' : (isHolding ? '#ec4899' : '#22d3ee')) 
        : '#94a3b8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      
      ctx.fill();
      ctx.stroke();
    });
  }

  // Draw red posture warning alert overlay banner at the top center of the tracker canvas
  if (isPostureInvalid && postureAlert) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // bold red
    ctx.fillRect(canvas.width / 2 - 200, 20, 400, 42);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 200, 20, 400, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠️ FORM WARNING: ${postureAlert}`, canvas.width / 2, 46);
    ctx.restore();
  }
};

