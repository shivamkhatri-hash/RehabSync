import { OneEuroFilter, LandmarkSmoother } from './oneEuroFilter';

/**
 * 2D Angle Calculation between three points (vertex at b)
 */
export const calculateAngle = (a, b, c) => {
  if (!a || !b || !c) return 0;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

/**
 * 3D Angle Calculation using dot product
 */
export const calculateAngle3D = (a, b, c) => {
  if (!a || !b || !c) return 0;
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 * mag2 === 0) return 0;
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));
  return (Math.acos(cosTheta) * 180.0) / Math.PI;
};

/**
 * Torso Sagittal/Vertical Lean Angle in degrees from vertical axis
 */
export const getTorsoAngle = (shoulder, hip) => {
  if (!shoulder || !hip) return 0;
  const dx = Math.abs(shoulder.x - hip.x);
  const dy = Math.abs(shoulder.y - hip.y);
  if (dy === 0) return 90;
  return (Math.atan(dx / dy) * 180.0) / Math.PI;
};

/**
 * Torso Lateral Lean (Tilt to Left/Right)
 */
export const getTorsoLateralTilt = (leftShoulder, rightShoulder) => {
  if (!leftShoulder || !rightShoulder) return 0;
  const dy = Math.abs(leftShoulder.y - rightShoulder.y);
  const dx = Math.abs(leftShoulder.x - rightShoulder.x);
  if (dx === 0) return 0;
  return (Math.atan(dy / dx) * 180.0) / Math.PI;
};

/**
 * Pose Quality & Occlusion Evaluator
 * Computes a 0-100% confidence score and generates user positioning hints.
 */
export const evaluatePoseQuality = (landmarks, requiredJoints = []) => {
  if (!landmarks || landmarks.length === 0) {
    return {
      qualityScore: 0,
      isValid: false,
      occludedJoints: ['Full Body'],
      positioningGuidance: 'Step into camera view',
      isTooClose: false,
      isTooFar: false
    };
  }

  // Check required joints visibility
  const occluded = [];
  let visSum = 0;
  const jointsToCheck = requiredJoints.length > 0 ? requiredJoints : [11, 12, 13, 14, 23, 24, 25, 26];

  jointsToCheck.forEach(jIdx => {
    const lm = landmarks[jIdx];
    if (!lm || (lm.visibility !== undefined && lm.visibility < 0.55)) {
      occluded.push(jIdx);
    } else {
      visSum += (lm.visibility !== undefined ? lm.visibility : 0.9);
    }
  });

  const avgVisibility = jointsToCheck.length > 0 ? visSum / jointsToCheck.length : 0;
  let qualityScore = Math.round(avgVisibility * 100);

  // Check Bounding Box & Framing
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bodyWidth = maxX - minX;
  const bodyHeight = maxY - minY;

  let guidance = '';
  let isTooClose = false;
  let isTooFar = false;

  if (bodyHeight > 0.92 || bodyWidth > 0.88 || minY < 0.03 || maxY > 0.97) {
    isTooClose = true;
    guidance = 'Step back slightly for full visibility';
    qualityScore = Math.max(0, qualityScore - 20);
  } else if (bodyHeight < 0.30) {
    isTooFar = true;
    guidance = 'Step closer to the camera';
    qualityScore = Math.max(0, qualityScore - 15);
  } else if (occluded.length > 0) {
    guidance = 'Adjust camera angle: body partially occluded';
  } else {
    guidance = 'Positioning optimal';
  }

  return {
    qualityScore: Math.min(100, Math.max(0, qualityScore)),
    isValid: qualityScore >= 60 && occluded.length <= 1,
    occludedJoints: occluded,
    positioningGuidance: guidance,
    isTooClose,
    isTooFar
  };
};

/**
 * Exercise Form & Multi-Joint Compensation Evaluator
 * Evaluates primary target joint + secondary kinetic compensations with explainable clinical feedback.
 */
export const validateExerciseForm = (exerciseName, landmarks, selectedArm = 'right') => {
  const normName = (exerciseName || '').toLowerCase();
  const isRight = selectedArm === 'right';

  const shoulderIdx = isRight ? 12 : 11;
  const oppShoulderIdx = isRight ? 11 : 12;
  const elbowIdx = isRight ? 14 : 13;
  const wristIdx = isRight ? 16 : 15;
  const hipIdx = isRight ? 24 : 23;
  const oppHipIdx = isRight ? 23 : 24;
  const kneeIdx = isRight ? 26 : 25;
  const ankleIdx = isRight ? 28 : 27;

  const shoulder = landmarks?.[shoulderIdx];
  const oppShoulder = landmarks?.[oppShoulderIdx];
  const elbow = landmarks?.[elbowIdx];
  const wrist = landmarks?.[wristIdx];
  const hip = landmarks?.[hipIdx];
  const oppHip = landmarks?.[oppHipIdx];
  const knee = landmarks?.[kneeIdx];
  const ankle = landmarks?.[ankleIdx];

  const violations = [];
  let isCompensating = false;

  // 1. Torso Lean Check (Universal)
  if (shoulder && hip && shoulder.visibility > 0.5 && hip.visibility > 0.5) {
    const torsoSagittalAngle = getTorsoAngle(shoulder, hip);
    if (torsoSagittalAngle > 22) {
      isCompensating = true;
      violations.push({
        joint: 'Torso Spine',
        message: `Torso leaning by ${Math.round(torsoSagittalAngle)}° - maintain upright spine`,
        severity: 'high',
        angle: torsoSagittalAngle
      });
    }
  }

  // 2. Lateral Shoulder Hitching (Torso tilt)
  if (shoulder && oppShoulder && shoulder.visibility > 0.5 && oppShoulder.visibility > 0.5) {
    const shoulderTilt = getTorsoLateralTilt(shoulder, oppShoulder);
    if (shoulderTilt > 14) {
      isCompensating = true;
      violations.push({
        joint: 'Shoulder Girdle',
        message: `Shoulder hitching detected (${Math.round(shoulderTilt)}° tilt)`,
        severity: 'medium',
        angle: shoulderTilt
      });
    }
  }

  // 3. Exercise Specific Secondary Constraints
  if (normName.includes('bicep')) {
    if (hip && shoulder && elbow) {
      const upperArmAngle = calculateAngle(hip, shoulder, elbow);
      const isHorizontalType = normName.includes('horizontal') || normName.includes('90') || normName.includes('perpendicular') || normName.includes('shoulder joint') || normName.includes('elevated');

      if (isHorizontalType) {
        // Horizontal Bicep Curl: Upper arm must stay perpendicular to torso (70° - 110°)
        if (upperArmAngle < 70) {
          isCompensating = true;
          violations.push({
            joint: 'Upper Arm',
            message: `Upper arm dropped (${Math.round(upperArmAngle)}°) - keep humerus at 90° shoulder height`,
            severity: 'high',
            angle: upperArmAngle
          });
        } else if (upperArmAngle > 115) {
          isCompensating = true;
          violations.push({
            joint: 'Upper Arm',
            message: `Upper arm elevated too high (${Math.round(upperArmAngle)}°) - maintain level 90° horizontal alignment`,
            severity: 'medium',
            angle: upperArmAngle
          });
        }
      } else {
        // Standard Standing Bicep Curl: Upper arm must remain anchored to ribs (<= 35°)
        if (upperArmAngle > 35) {
          isCompensating = true;
          violations.push({
            joint: 'Upper Arm',
            message: `Elbow flared/drifted forward by ${Math.round(upperArmAngle)}° - pin humerus to your ribs`,
            severity: 'medium',
            angle: upperArmAngle
          });
        }
      }
    }
  } else if (normName.includes('shoulder abduction') || normName.includes('shoulder flexion')) {
    // Check if elbow stays extended
    if (shoulder && elbow && wrist) {
      const elbowAngle = calculateAngle(shoulder, elbow, wrist);
      if (elbowAngle < 145) {
        isCompensating = true;
        violations.push({
          joint: 'Elbow Joint',
          message: `Keep arm straight (${Math.round(180 - elbowAngle)}° elbow bend detected)`,
          severity: 'medium',
          angle: elbowAngle
        });
      }
    }
  } else if (normName.includes('squat')) {
    // Check knee depth and torso forward pitch
    if (shoulder && hip && knee && ankle) {
      const hipAngle = calculateAngle(shoulder, hip, knee);
      if (hipAngle < 65) {
        isCompensating = true;
        violations.push({
          joint: 'Hip / Back',
          message: 'Excessive forward trunk pitch during squat',
          severity: 'high',
          angle: hipAngle
        });
      }
    }
  } else if (normName.includes('straight leg') || normName.includes('knee extension')) {
    // Check if knee bends during straight leg raise
    if (hip && knee && ankle) {
      const kneeAngle = calculateAngle(hip, knee, ankle);
      if (kneeAngle < 160) {
        isCompensating = true;
        violations.push({
          joint: 'Knee Joint',
          message: `Lock your knee straight (${Math.round(180 - kneeAngle)}° knee flexion)`,
          severity: 'high',
          angle: kneeAngle
        });
      }
    }
  } else if (normName.includes('push-up')) {
    // Check spinal alignment (shoulder - hip - ankle line)
    if (shoulder && hip && ankle) {
      const bodyLineAngle = calculateAngle(shoulder, hip, ankle);
      if (bodyLineAngle < 155) {
        isCompensating = true;
        violations.push({
          joint: 'Lumbar Core',
          message: `Hips sagging / piking (${Math.round(180 - bodyLineAngle)}° deviation)`,
          severity: 'high',
          angle: bodyLineAngle
        });
      }
    }
  }

  return {
    isCompensating,
    violations,
    primaryViolation: violations[0] || null
  };
};

/**
 * 4-Stage State Machine and Biomechanical Rep Manager
 * States: REST -> MOVING -> TARGET_HOLD -> RETURN -> COMPLETED
 */
export class BiomechanicsEngine {
  constructor(options = {}) {
    this.landmarkSmoother = new LandmarkSmoother(1.2, 0.05);
    this.angleSmoother = new OneEuroFilter(1.5, 0.02);

    this.fsmState = 'REST'; // 'REST' | 'MOVING' | 'TARGET_HOLD' | 'RETURN'
    this.targetHoldStart = null;
    this.repStartTime = null;
    this.consecutiveTargetFrames = 0;
    this.requiredConsecutiveFrames = 4; // temporal validation frames
    this.minRepDurationMs = 900; // minimum movement cycle duration
    this.minRomDelta = 25; // minimum angle excursion in degrees

    this.repCount = 0;
    this.invalidRepCount = 0;
    this.minAngleSeen = 999;
    this.maxAngleSeen = 0;
    this.repAngleHistory = [];
    this.formViolationsLog = [];

    this.lastTimestamp = performance.now();
  }

  reset() {
    this.fsmState = 'REST';
    this.targetHoldStart = null;
    this.repStartTime = null;
    this.consecutiveTargetFrames = 0;
    this.repCount = 0;
    this.invalidRepCount = 0;
    this.minAngleSeen = 999;
    this.maxAngleSeen = 0;
    this.repAngleHistory = [];
    this.formViolationsLog = [];
    this.landmarkSmoother.reset();
    this.angleSmoother.reset();
  }

  processFrame({
    rawLandmarks,
    resolvedJoints,
    exerciseConfig,
    selectedArm = 'right',
    timestamp = performance.now()
  }) {
    // 1. Signal Smoothing Layer
    const smoothedLandmarks = this.landmarkSmoother.filterLandmarks(rawLandmarks, timestamp);

    // 2. Pose Quality Index & Occlusion Check
    const poseQuality = evaluatePoseQuality(smoothedLandmarks, resolvedJoints);

    if (!poseQuality.isValid || !smoothedLandmarks || smoothedLandmarks.length === 0) {
      return {
        fsmState: this.fsmState,
        rawAngle: 0,
        filteredAngle: 0,
        poseQuality,
        formCheck: { isCompensating: false, violations: [], primaryViolation: null },
        repCount: this.repCount,
        holdProgress: 0,
        isHolding: false,
        repCompleted: false,
        diagnostics: {
          explainableAlert: poseQuality.positioningGuidance,
          stateBadge: 'OCCLUDED'
        }
      };
    }

    // 3. Angle Computation (Raw + Filtered)
    const [j1, j2, j3] = resolvedJoints || [12, 14, 16];
    const pt1 = smoothedLandmarks[j1];
    const pt2 = smoothedLandmarks[j2];
    const pt3 = smoothedLandmarks[j3];

    let rawAngle = 0;
    let filteredAngle = 0;

    if (pt1 && pt2 && pt3) {
      rawAngle = calculateAngle(pt1, pt2, pt3);
      filteredAngle = this.angleSmoother.filter(rawAngle, timestamp);
    }

    const roundedAngle = Math.round(filteredAngle);

    // 4. Multi-joint kinetic validation
    const formCheck = validateExerciseForm(exerciseConfig?.name, smoothedLandmarks, selectedArm);

    // 5. Exercise Angle Parameters & Thresholds
    const successAngle = exerciseConfig?.success_angle ?? 90;
    const failureAngle = exerciseConfig?.failure_angle ?? 150;
    const holdDurationSec = exerciseConfig?.holdTime ?? 0;
    const targetDirection = exerciseConfig?.target_direction || (successAngle > failureAngle ? 'increase' : 'decrease');

    let inSuccessZone = false;
    let inResetZone = false;

    if (targetDirection === 'increase') {
      inSuccessZone = filteredAngle >= successAngle;
      inResetZone = filteredAngle <= failureAngle;
    } else {
      inSuccessZone = filteredAngle <= successAngle;
      inResetZone = filteredAngle >= failureAngle;
    }

    // Track min/max ROM for analytics
    if (this.fsmState !== 'REST') {
      this.minAngleSeen = Math.min(this.minAngleSeen, roundedAngle);
      this.maxAngleSeen = Math.max(this.maxAngleSeen, roundedAngle);
    }

    let repCompleted = false;
    let holdProgress = 0;
    let isHolding = false;
    let explainableAlert = '';

    if (formCheck.isCompensating) {
      explainableAlert = formCheck.primaryViolation?.message || 'Form compensation detected';
    }

    // 6. Finite State Machine (FSM) & Temporal Validation
    switch (this.fsmState) {
      case 'REST':
        if (!inResetZone && !formCheck.isCompensating) {
          // Started movement from resting pose
          this.fsmState = 'MOVING';
          this.repStartTime = timestamp;
          this.minAngleSeen = roundedAngle;
          this.maxAngleSeen = roundedAngle;
        }
        break;

      case 'MOVING':
        if (formCheck.isCompensating) {
          // Compensation occurred during concentric movement
          this.formViolationsLog.push({ timestamp, ...formCheck.primaryViolation });
        }

        if (inSuccessZone && !formCheck.isCompensating) {
          this.consecutiveTargetFrames += 1;
          if (this.consecutiveTargetFrames >= this.requiredConsecutiveFrames) {
            this.fsmState = 'TARGET_HOLD';
            this.targetHoldStart = timestamp;
          }
        } else {
          this.consecutiveTargetFrames = 0;
          if (inResetZone) {
            this.fsmState = 'REST';
          }
        }
        break;

      case 'TARGET_HOLD':
        isHolding = true;
        if (formCheck.isCompensating) {
          // Form broke during target hold - penalize/reset hold
          this.targetHoldStart = timestamp; // reset timer
          explainableAlert = `Hold paused: ${formCheck.primaryViolation?.message}`;
        } else if (!inSuccessZone) {
          // Fell out of target angle zone
          this.fsmState = 'MOVING';
          this.targetHoldStart = null;
          this.consecutiveTargetFrames = 0;
        } else {
          const heldSec = (timestamp - this.targetHoldStart) / 1000;
          holdProgress = holdDurationSec > 0 ? Math.min(1, heldSec / holdDurationSec) : 1;

          if (heldSec >= holdDurationSec) {
            this.fsmState = 'RETURN';
          }
        }
        break;

      case 'RETURN':
        // Eccentric return phase
        if (inResetZone) {
          const repDuration = timestamp - (this.repStartTime || timestamp);
          const romDelta = Math.abs(this.maxAngleSeen - this.minAngleSeen);

          // Temporal Rep Validation check
          if (repDuration >= this.minRepDurationMs && romDelta >= this.minRomDelta) {
            this.repCount += 1;
            repCompleted = true;
            this.repAngleHistory.push({
              repIndex: this.repCount,
              durationMs: repDuration,
              maxRom: this.maxAngleSeen,
              minRom: this.minAngleSeen,
              deltaRom: romDelta,
              valid: true
            });
          } else {
            this.invalidRepCount += 1;
            explainableAlert = 'Movement too rushed - complete full controlled ROM';
          }

          this.fsmState = 'REST';
          this.targetHoldStart = null;
          this.repStartTime = null;
          this.consecutiveTargetFrames = 0;
        }
        break;

      default:
        this.fsmState = 'REST';
    }

    return {
      fsmState: this.fsmState,
      rawAngle: Math.round(rawAngle),
      filteredAngle: roundedAngle,
      smoothedLandmarks,
      poseQuality,
      formCheck,
      repCount: this.repCount,
      invalidRepCount: this.invalidRepCount,
      holdProgress,
      isHolding,
      repCompleted,
      diagnostics: {
        explainableAlert,
        romDelta: Math.abs(this.maxAngleSeen - this.minAngleSeen),
        minAngle: this.minAngleSeen === 999 ? 0 : this.minAngleSeen,
        maxAngle: this.maxAngleSeen,
        stateBadge: this.fsmState
      }
    };
  }
}
