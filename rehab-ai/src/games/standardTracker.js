const drawBone = (ctx, landmarks, indexA, indexB, width, height, isWrongPosture) => {
  const ptA = landmarks[indexA];
  const ptB = landmarks[indexB];
  if (!ptA || !ptB) return;
  
  ctx.beginPath();
  ctx.moveTo(ptA.x * width, ptA.y * height);
  ctx.lineTo(ptB.x * width, ptB.y * height);
  ctx.strokeStyle = isWrongPosture ? '#f43f5e' : '#0d9488';
  ctx.lineWidth = 6;
  ctx.stroke();
};

export const draw = (ctx, canvas, params) => {
  const { video, detectedLandmarks, resolvedJoints, isHolding } = params;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (detectedLandmarks && resolvedJoints) {
    const [j1, j2, j3] = resolvedJoints;
    drawBone(ctx, detectedLandmarks, j1, j2, canvas.width, canvas.height, isHolding);
    drawBone(ctx, detectedLandmarks, j2, j3, canvas.width, canvas.height, isHolding);
  }
};
