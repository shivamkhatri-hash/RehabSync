/**
 * Calibration Engine: Body orientation, distance/framing, confidence, and 3-rep baseline ROM calculation
 */

/**
 * Estimates the patient's approximate orientation relative to the camera ('front', 'side', '45deg')
 * Uses shoulder span to torso height ratio and z-depth differentials
 */
export const estimateBodyOrientation = (landmarks) => {
  if (!landmarks || landmarks.length < 25) {
    return { orientation: 'unknown', confidence: 0, shoulderRatio: 0 };
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return { orientation: 'unknown', confidence: 0, shoulderRatio: 0 };
  }

  // 2D horizontal span vs torso height
  const shoulderSpan = Math.abs(leftShoulder.x - rightShoulder.x);
  const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const midHipY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = Math.abs(midHipY - midShoulderY);

  if (torsoHeight === 0) return { orientation: 'front', confidence: 0.5, shoulderRatio: 1 };

  const shoulderRatio = shoulderSpan / torsoHeight;

  // Z-depth difference if available
  const zDiff = Math.abs((leftShoulder.z || 0) - (rightShoulder.z || 0));

  let orientation = 'front';
  let confidence = 0.85;

  if (shoulderRatio < 0.35 || zDiff > 0.35) {
    orientation = 'side';
  } else if (shoulderRatio < 0.65 || zDiff > 0.18) {
    orientation = '45deg';
  } else {
    orientation = 'front';
  }

  return {
    orientation,
    confidence,
    shoulderRatio: Math.round(shoulderRatio * 100) / 100,
    zDiff: Math.round(zDiff * 100) / 100
  };
};

/**
 * Checks if the detected orientation matches the exercise prescription requirement
 */
export const verifyCameraOrientation = (detectedOrientation, requiredCameraView = 'front') => {
  const req = (requiredCameraView || 'front').toLowerCase();
  const det = (detectedOrientation || 'front').toLowerCase();

  if (req === 'any' || req === 'front/side/45deg') return { matches: true, status: 'Optimal' };

  if (req === det) {
    return { matches: true, status: 'Optimal' };
  }

  // 45deg can accept both side and 45deg
  if (req === '45deg' && (det === '45deg' || det === 'side')) {
    return { matches: true, status: 'Acceptable' };
  }

  if (req === 'side' && det === 'front') {
    return { matches: false, status: 'Please turn 90° to a side-profile view' };
  }

  if (req === 'front' && det === 'side') {
    return { matches: false, status: 'Please turn to face the camera directly' };
  }

  return { matches: false, status: `Please adjust body to ${req} view` };
};

/**
 * Evaluates comprehensive pre-exercise calibration checklist
 */
export const runPreExerciseCalibration = ({
  landmarks,
  requiredJoints = [],
  requiredCameraView = 'front'
}) => {
  if (!landmarks || landmarks.length === 0) {
    return {
      passed: false,
      checks: {
        visibility: false,
        distance: false,
        orientation: false,
        joints: false,
        confidence: false
      },
      message: 'Step into camera frame to begin calibration'
    };
  }

  // 1. Landmark confidence & lighting check
  let validLandmarksCount = 0;
  landmarks.forEach(lm => {
    if (lm.visibility === undefined || lm.visibility > 0.5) validLandmarksCount += 1;
  });
  const confidenceScore = validLandmarksCount / landmarks.length;
  const isConfidenceGood = confidenceScore >= 0.60;

  // 2. Distance & vertical scale check
  const ys = landmarks.map(l => l.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bodyHeight = maxY - minY;
  const isDistanceGood = bodyHeight >= 0.35 && bodyHeight <= 0.90 && minY > 0.02 && maxY < 0.98;

  // 3. Required joints check
  const jointsToCheck = requiredJoints.length > 0 ? requiredJoints : [11, 12, 13, 14, 23, 24, 25, 26];
  const missingJoints = jointsToCheck.filter(j => !landmarks[j] || (landmarks[j].visibility !== undefined && landmarks[j].visibility < 0.55));
  const areJointsVisible = missingJoints.length === 0;

  // 4. Orientation check
  const orientationData = estimateBodyOrientation(landmarks);
  const orientationMatch = verifyCameraOrientation(orientationData.orientation, requiredCameraView);

  const passed = isConfidenceGood && isDistanceGood && areJointsVisible && orientationMatch.matches;

  let message = 'Calibration passed! Ready to begin.';
  if (!areJointsVisible) message = `Required joints obscured (check ${missingJoints.length} joint points)`;
  else if (!isDistanceGood) message = bodyHeight < 0.35 ? 'Step closer to the camera' : 'Step back slightly for full framing';
  else if (!orientationMatch.matches) message = orientationMatch.status;
  else if (!isConfidenceGood) message = 'Lighting or landmark confidence low - ensure good room lighting';

  return {
    passed,
    checks: {
      visibility: isDistanceGood,
      distance: isDistanceGood,
      orientation: orientationMatch.matches,
      joints: areJointsVisible,
      confidence: isConfidenceGood
    },
    orientationData,
    orientationStatus: orientationMatch.status,
    missingJoints,
    message
  };
};

/**
 * 3-Rep Baseline Active ROM Calculator
 * Calculates comfortable baseline ROM and dynamic target progression
 */
export const calculateBaselineProgression = (threeRepAngles, prescriptionTarget = 90, direction = 'decrease') => {
  if (!threeRepAngles || threeRepAngles.length === 0) {
    return {
      baselineRom: prescriptionTarget,
      prescribedTarget: prescriptionTarget,
      adaptedTarget: prescriptionTarget,
      repsRecorded: 0
    };
  }

  const sum = threeRepAngles.reduce((a, b) => a + b, 0);
  const baselineRom = Math.round(sum / threeRepAngles.length);

  // If direction is 'decrease' (e.g. elbow flexion / squat knee angle):
  // progression targets ~10% deeper active flexion beyond comfortable baseline
  let adaptedTarget = prescriptionTarget;
  if (direction === 'decrease') {
    adaptedTarget = Math.max(prescriptionTarget, Math.round(baselineRom * 0.90));
  } else {
    // direction is 'increase' (e.g. shoulder abduction, knee extension):
    // progression targets ~10% higher extension beyond comfortable baseline
    adaptedTarget = Math.min(prescriptionTarget, Math.round(baselineRom * 1.10));
  }

  return {
    baselineRom,
    prescribedTarget: prescriptionTarget,
    adaptedTarget,
    repsRecorded: threeRepAngles.length,
    improvementDelta: Math.abs(adaptedTarget - baselineRom)
  };
};
