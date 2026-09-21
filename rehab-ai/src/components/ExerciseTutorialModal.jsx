import React, { useState, useEffect, useRef } from 'react';
import { getExerciseTutorial } from '../data/exerciseTutorials';

export default function ExerciseTutorialModal({
  isOpen,
  exerciseName,
  isLiveSession = false,
  onClose,
  onStartWorkout
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x or 0.5x
  const [animProgress, setAnimProgress] = useState(0); // 0.0 to 1.0
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [activeInfoSection, setActiveInfoSection] = useState('all'); // 'all' | 'setup' | 'movement' | 'mistakes'

  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const canvasRef = useRef(null);

  const tutorial = getExerciseTutorial(exerciseName);

  // Animation cycle loop
  useEffect(() => {
    if (!isOpen) return;

    let progress = 0;
    let direction = 1;

    const updateLoop = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPlaying) {
        const speedMultiplier = playbackSpeed;
        progress += (dt / 1.8) * speedMultiplier * direction;

        if (progress >= 1) {
          progress = 1;
          direction = -1;
        } else if (progress <= 0) {
          progress = 0;
          direction = 1;
        }
        setAnimProgress(progress);

        // Update active phase
        if (progress < 0.35) {
          setCurrentPhaseIndex(0);
        } else if (progress > 0.7) {
          setCurrentPhaseIndex(1);
        } else {
          setCurrentPhaseIndex(2);
        }
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isOpen, isPlaying, playbackSpeed]);

  // Jump to specific phase
  const jumpToPhase = (index) => {
    setIsPlaying(false);
    setCurrentPhaseIndex(index);
    if (index === 0) setAnimProgress(0.05);
    else if (index === 1) setAnimProgress(0.95);
    else setAnimProgress(0.5);
  };

  // Render high-fidelity biomechanical demonstration canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Deep tech studio backdrop
    const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 20, width * 0.5, height * 0.5, width * 0.7);
    bgGrad.addColorStop(0, '#111827');
    bgGrad.addColorStop(0.6, '#090d16');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle isometric floor grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 30; x < width; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, height - 35);
      ctx.lineTo(x + 20, height);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(15, height - 35);
    ctx.lineTo(width - 15, height - 35);
    ctx.stroke();

    // Biological motion easing
    const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const t = ease(animProgress);
    const animKey = tutorial.animKey || 'bicep_curl_horizontal';
    let curAngleVal = 90;

    if (animKey === 'bicep_curl_horizontal') {
      // Bicep Curl with Horizontal Arm setup (Shoulder to Elbow perpendicular to torso)
      const shoulderX = width * 0.38;
      const shoulderY = height * 0.40;
      const elbowX = shoulderX + 110;
      const elbowY = shoulderY; // Strictly horizontal

      const startAngle = 0.15 * Math.PI;
      const endAngle = -0.58 * Math.PI;
      const curAngle = startAngle + t * (endAngle - startAngle);
      const forearmLen = 95;
      const wristX = elbowX + Math.cos(curAngle) * forearmLen;
      const wristY = elbowY + Math.sin(curAngle) * forearmLen;

      // Draw Silhouette Body
      drawRealisticSilhouette(ctx, shoulderX - 45, shoulderY, height);

      // Inactive arm at side
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shoulderX - 45, shoulderY);
      ctx.lineTo(shoulderX - 55, shoulderY + 95);
      ctx.stroke();

      // Horizontal Alignment Guideline
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shoulderX - 70, shoulderY);
      ctx.lineTo(shoulderX + 170, shoulderY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Motion Arc Path
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(elbowX, elbowY, forearmLen, startAngle, endAngle, true);
      ctx.stroke();

      // Glowing Upper Arm (Horizontal)
      drawGlowBone(ctx, shoulderX, shoulderY, elbowX, elbowY, '#06b6d4', '#22d3ee', 10);
      // Glowing Forearm (Moving)
      drawGlowBone(ctx, elbowX, elbowY, wristX, wristY, '#10b981', '#34d399', 9);

      // Joint Nodes
      drawGlowingJoint(ctx, shoulderX, shoulderY, '#06b6d4', 'Shoulder (90°)');
      drawGlowingJoint(ctx, elbowX, elbowY, '#10b981', 'Elbow Joint');
      drawGlowingJoint(ctx, wristX, wristY, '#f59e0b', 'Wrist');

      curAngleVal = Math.round(155 - t * (155 - 80));
      drawAngleGauge(ctx, elbowX, elbowY, curAngleVal, '80° Target');

    } else if (animKey === 'pushup') {
      // Push-up ON THE GROUND (Horizontal Prone Plank)
      const floorY = height - 42;

      // Mat on floor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(width * 0.15, floorY - 4, width * 0.72, 8);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(width * 0.15, floorY - 4, width * 0.72, 8);

      // Body parameters (Horizontal Plank)
      // Chest lowers by bending elbows
      const dipY = t * 42; // Chest lowering amount
      const feetX = width * 0.78;
      const feetY = floorY - 8;
      const hipX = width * 0.52;
      const hipY = floorY - 48 + dipY * 0.6;
      const shoulderX = width * 0.32;
      const shoulderY = floorY - 72 + dipY;
      const headX = width * 0.24;
      const headY = shoulderY - 8;

      // Hand on floor
      const handX = width * 0.32;
      const handY = floorY - 6;

      // Elbow calculation: as shoulder dips, elbow flexes backward
      const elbowX = shoulderX + 22 + (1 - t) * 12;
      const elbowY = (shoulderY + handY) / 2 + (1 - t) * 12;

      // Draw Head
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(headX, headY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Spine & Leg Line (Rigid plank)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(hipX, hipY);
      ctx.lineTo(feetX, feetY);
      ctx.stroke();

      // Glowing Skeleton
      drawGlowBone(ctx, shoulderX, shoulderY, elbowX, elbowY, '#06b6d4', '#22d3ee', 9);
      drawGlowBone(ctx, elbowX, elbowY, handX, handY, '#10b981', '#34d399', 8);
      drawGlowBone(ctx, shoulderX, shoulderY, hipX, hipY, '#3b82f6', '#60a5fa', 10);
      drawGlowBone(ctx, hipX, hipY, feetX, feetY, '#06b6d4', '#22d3ee', 10);

      // Joints
      drawGlowingJoint(ctx, shoulderX, shoulderY, '#06b6d4', 'Shoulder');
      drawGlowingJoint(ctx, elbowX, elbowY, '#10b981', 'Elbow');
      drawGlowingJoint(ctx, handX, handY, '#f59e0b', 'Hand (Floor)');
      drawGlowingJoint(ctx, hipX, hipY, '#3b82f6', 'Hip (Plank)');
      drawGlowingJoint(ctx, feetX, feetY, '#06b6d4', 'Toes');

      curAngleVal = Math.round(155 - t * (155 - 90));
      drawAngleGauge(ctx, elbowX, elbowY, curAngleVal, '90° Chest Dip');

    } else if (animKey === 'standing_knee_flexion') {
      // Standing Knee Flexion (Hamstring Curl)
      const hipX = width * 0.44;
      const hipY = height * 0.44;
      const kneeX = hipX;
      const kneeY = height * 0.68;

      // Draw Standing Character Silhouette
      drawRealisticSilhouette(ctx, hipX - 25, height * 0.36, height);

      // Grounded Stance Leg (straight down)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(hipX - 12, hipY);
      ctx.lineTo(hipX - 12, height - 38);
      ctx.stroke();

      // Active Target Leg: Thigh remains vertical, shin flexes backwards up towards glute
      const shinLen = 78;
      // Start at 165° (straight down), flexes to 95° (backward)
      const flexAngle = (165 - t * (165 - 95)) * (Math.PI / 180);
      const ankleX = kneeX - Math.sin(Math.PI - flexAngle) * shinLen;
      const ankleY = kneeY - Math.cos(Math.PI - flexAngle) * shinLen;

      // Motion Arc Path
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(kneeX, kneeY, shinLen, Math.PI * 0.5, Math.PI * 0.5 - (70 * Math.PI / 180), true);
      ctx.stroke();

      // Glowing Bones
      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 11);
      drawGlowBone(ctx, kneeX, kneeY, ankleX, ankleY, '#10b981', '#34d399', 9);

      // Joints
      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Hip (Stationary)');
      drawGlowingJoint(ctx, kneeX, kneeY, '#10b981', 'Knee Joint');
      drawGlowingJoint(ctx, ankleX, ankleY, '#f59e0b', 'Ankle (Curl)');

      curAngleVal = Math.round(165 - t * (165 - 95));
      drawAngleGauge(ctx, kneeX, kneeY, curAngleVal, '95° Target');

    } else if (animKey === 'knee_extension') {
      // Seated Knee Extension
      const hipX = width * 0.40;
      const hipY = height * 0.48;
      const kneeX = hipX + 90;
      const kneeY = hipY + 15;

      const startAngle = Math.PI * 0.5;
      const endAngle = 0.05 * Math.PI;
      const curAngle = startAngle - t * (startAngle - endAngle);
      const shinLen = 95;
      const ankleX = kneeX + Math.cos(curAngle) * shinLen;
      const ankleY = kneeY + Math.sin(curAngle) * shinLen;

      // Chair
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hipX - 50, hipY - 80);
      ctx.lineTo(hipX - 50, hipY + 35);
      ctx.lineTo(hipX + 60, hipY + 35);
      ctx.stroke();

      // Torso & Head
      drawRealisticTorsoSeated(ctx, hipX - 30, hipY);

      // Thigh & Shin
      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 11);
      drawGlowBone(ctx, kneeX, kneeY, ankleX, ankleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Hip');
      drawGlowingJoint(ctx, kneeX, kneeY, '#10b981', 'Knee');
      drawGlowingJoint(ctx, ankleX, ankleY, '#f59e0b', 'Ankle');

      curAngleVal = Math.round(95 + t * (175 - 95));
      drawAngleGauge(ctx, kneeX, kneeY, curAngleVal, '175° Full Ext');

    } else if (animKey === 'leg_raise') {
      // Straight Leg Raise ON THE GROUND (Supine Mat)
      const floorY = height - 45;

      // Mat
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(width * 0.12, floorY - 4, width * 0.76, 8);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(width * 0.12, floorY - 4, width * 0.76, 8);

      const headX = width * 0.24;
      const headY = floorY - 20;
      const shoulderX = width * 0.32;
      const shoulderY = floorY - 14;
      const hipX = width * 0.48;
      const hipY = floorY - 14;

      // Supine Head & Torso
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(headX, headY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(hipX, hipY);
      ctx.stroke();

      // Non-active leg bent for stability
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX + 35, floorY - 40);
      ctx.lineTo(hipX + 60, floorY - 8);
      ctx.stroke();

      // Active leg lifting straight up at hip (165° to 115°)
      const legLen = 135;
      const liftAngle = (165 - t * (165 - 118)) * (Math.PI / 180);
      const ankleX = hipX + Math.cos(Math.PI - liftAngle) * legLen;
      const ankleY = hipY - Math.sin(Math.PI - liftAngle) * legLen;
      const kneeX = (hipX + ankleX) / 2;
      const kneeY = (hipY + ankleY) / 2;

      // Glowing Straight Leg
      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 11);
      drawGlowBone(ctx, kneeX, kneeY, ankleX, ankleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Hip Pivot');
      drawGlowingJoint(ctx, kneeX, kneeY, '#10b981', 'Knee (Locked)');
      drawGlowingJoint(ctx, ankleX, ankleY, '#f59e0b', 'Ankle (45° Elevation)');

      curAngleVal = Math.round(165 - t * (165 - 118));
      drawAngleGauge(ctx, hipX, hipY, curAngleVal, '118° Elevation');

    } else if (animKey === 'crunch') {
      // Abdominal Crunch ON THE GROUND (Supine Mat)
      const floorY = height - 45;

      // Mat
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(width * 0.12, floorY - 4, width * 0.76, 8);

      const hipX = width * 0.48;
      const hipY = floorY - 14;
      const kneeX = width * 0.65;
      const kneeY = floorY - 60;
      const feetX = width * 0.74;
      const feetY = floorY - 8;

      // Bent legs on mat
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(feetX, feetY);
      ctx.stroke();

      // Torso curling upwards (115° to 80°)
      const curlAmount = t * 38;
      const shoulderX = width * 0.32 + t * 25;
      const shoulderY = floorY - 18 - curlAmount;
      const headX = shoulderX - 16;
      const headY = shoulderY - 16;

      // Head
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(headX, headY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Spine & Legs
      drawGlowBone(ctx, shoulderX, shoulderY, hipX, hipY, '#10b981', '#34d399', 12);
      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 10);
      drawGlowBone(ctx, kneeX, kneeY, feetX, feetY, '#06b6d4', '#22d3ee', 10);

      drawGlowingJoint(ctx, shoulderX, shoulderY, '#10b981', 'Shoulder Lift');
      drawGlowingJoint(ctx, hipX, hipY, '#3b82f6', 'Pelvis');
      drawGlowingJoint(ctx, kneeX, kneeY, '#06b6d4', 'Knees (90°)');

      curAngleVal = Math.round(115 - t * (115 - 80));
      drawAngleGauge(ctx, hipX, hipY, curAngleVal, '80° Core Flex');

    } else if (animKey === 'squat' || animKey === 'sit_to_stand') {
      // Squat / Mini Squat / Sit to Stand
      const depth = t * 50;
      const hipX = width * 0.46;
      const hipY = height * 0.45 + depth;
      const kneeX = hipX + 45 - t * 12;
      const kneeY = height * 0.72 + depth * 0.3;
      const ankleX = hipX + 30;
      const ankleY = height - 38;

      drawRealisticTorsoStanding(ctx, hipX - 10, hipY - 60);

      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 11);
      drawGlowBone(ctx, kneeX, kneeY, ankleX, ankleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Hip');
      drawGlowingJoint(ctx, kneeX, kneeY, '#10b981', 'Knee');
      drawGlowingJoint(ctx, ankleX, ankleY, '#f59e0b', 'Ankle');

      curAngleVal = Math.round(165 - t * (165 - 120));
      drawAngleGauge(ctx, kneeX, kneeY, curAngleVal, '120° Depth');

    } else if (animKey === 'lunge') {
      // Lunge (Split stance)
      const depth = t * 45;
      const hipX = width * 0.46;
      const hipY = height * 0.44 + depth;

      // Front leg
      const frontKneeX = hipX + 45;
      const frontKneeY = height * 0.68 + depth * 0.4;
      const frontAnkleX = frontKneeX;
      const frontAnkleY = height - 38;

      // Back leg
      const backKneeX = hipX - 50;
      const backKneeY = height * 0.72 + depth * 0.7;
      const backFootX = hipX - 75;
      const backFootY = height - 38;

      drawRealisticTorsoStanding(ctx, hipX, hipY - 60);

      // Back Leg
      drawGlowBone(ctx, hipX, hipY, backKneeX, backKneeY, '#334155', '#475569', 8);
      drawGlowBone(ctx, backKneeX, backKneeY, backFootX, backFootY, '#334155', '#475569', 8);

      // Front Leg (Target)
      drawGlowBone(ctx, hipX, hipY, frontKneeX, frontKneeY, '#06b6d4', '#22d3ee', 11);
      drawGlowBone(ctx, frontKneeX, frontKneeY, frontAnkleX, frontAnkleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Hip');
      drawGlowingJoint(ctx, frontKneeX, frontKneeY, '#10b981', 'Lead Knee (90°)');
      drawGlowingJoint(ctx, frontAnkleX, frontAnkleY, '#f59e0b', 'Ankle');

      curAngleVal = Math.round(160 - t * (160 - 95));
      drawAngleGauge(ctx, frontKneeX, frontKneeY, curAngleVal, '95° Lunge Depth');

    } else if (animKey === 'standing_hip_abduction') {
      // Standing Hip Abduction (Frontal Plane Leg Lift)
      const hipX = width * 0.50;
      const hipY = height * 0.46;

      drawRealisticSilhouette(ctx, hipX, height * 0.38, height);

      // Stance leg
      drawGlowBone(ctx, hipX - 15, hipY, hipX - 15, height - 38, '#334155', '#475569', 9);

      // Abducting leg
      const legLen = height * 0.42;
      const abdAngle = (t * 35) * (Math.PI / 180);
      const abdKneeX = hipX + 15 + Math.sin(abdAngle) * (legLen * 0.5);
      const abdKneeY = hipY + Math.cos(abdAngle) * (legLen * 0.5);
      const abdAnkleX = hipX + 15 + Math.sin(abdAngle) * legLen;
      const abdAnkleY = hipY + Math.cos(abdAngle) * legLen;

      drawGlowBone(ctx, hipX + 15, hipY, abdKneeX, abdKneeY, '#06b6d4', '#22d3ee', 10);
      drawGlowBone(ctx, abdKneeX, abdKneeY, abdAnkleX, abdAnkleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX + 15, hipY, '#06b6d4', 'Hip Abductor');
      drawGlowingJoint(ctx, abdKneeX, abdKneeY, '#10b981', 'Knee');
      drawGlowingJoint(ctx, abdAnkleX, abdAnkleY, '#f59e0b', 'Ankle (Lateral)');

      curAngleVal = Math.round(t * 35);
      drawAngleGauge(ctx, hipX + 15, hipY, curAngleVal, '35° Abduction');

    } else if (animKey === 'standing_hip_flexion') {
      // Standing Hip Flexion / Marching in Place
      const hipX = width * 0.44;
      const hipY = height * 0.46;

      drawRealisticSilhouette(ctx, hipX - 25, height * 0.38, height);

      // Stance leg
      drawGlowBone(ctx, hipX - 15, hipY, hipX - 15, height - 38, '#334155', '#475569', 9);

      // High Knee Lift (Thigh parallel)
      const thighLen = 65;
      const shinLen = 65;
      const hipFlexAngle = (165 - t * (165 - 90)) * (Math.PI / 180);
      const kneeX = hipX + Math.sin(Math.PI - hipFlexAngle) * thighLen;
      const kneeY = hipY + Math.cos(Math.PI - hipFlexAngle) * thighLen;
      const ankleX = kneeX;
      const ankleY = kneeY + shinLen;

      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 11);
      drawGlowBone(ctx, kneeX, kneeY, ankleX, ankleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Hip Flexor');
      drawGlowingJoint(ctx, kneeX, kneeY, '#10b981', 'High Knee (90°)');
      drawGlowingJoint(ctx, ankleX, ankleY, '#f59e0b', 'Ankle');

      curAngleVal = Math.round(165 - t * (165 - 90));
      drawAngleGauge(ctx, hipX, hipY, curAngleVal, '90° Knee Height');

    } else if (animKey === 'calf_raise') {
      // Calf Raise (Heel Lift)
      const hipX = width * 0.46;
      const hipY = height * 0.42;
      const kneeX = hipX;
      const kneeY = height * 0.68;
      const heelLift = t * 28;
      const ankleX = hipX;
      const ankleY = height - 42 - heelLift;
      const toeX = hipX + 18;
      const toeY = height - 38;

      drawRealisticTorsoStanding(ctx, hipX, hipY - 60);

      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY - heelLift * 0.8, '#06b6d4', '#22d3ee', 10);
      drawGlowBone(ctx, kneeX, kneeY - heelLift * 0.8, ankleX, ankleY, '#10b981', '#34d399', 9);
      drawGlowBone(ctx, ankleX, ankleY, toeX, toeY, '#f59e0b', '#fbbf24', 8);

      drawGlowingJoint(ctx, kneeX, kneeY - heelLift * 0.8, '#06b6d4', 'Knee');
      drawGlowingJoint(ctx, ankleX, ankleY, '#10b981', 'Ankle (Plantarflexion)');
      drawGlowingJoint(ctx, toeX, toeY, '#f59e0b', 'MTP Joint (Grounded)');

      curAngleVal = Math.round(heelLift);
      drawAngleGauge(ctx, ankleX, ankleY, curAngleVal, 'Max Heel Lift');

    } else if (animKey === 'bird_dog') {
      // Bird Dog (Quadruped on Floor Mat)
      const floorY = height - 45;

      // Mat
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(width * 0.12, floorY - 4, width * 0.76, 8);

      const shoulderX = width * 0.38;
      const shoulderY = floorY - 65;
      const hipX = width * 0.60;
      const hipY = floorY - 65;

      // Grounded limbs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(shoulderX, floorY - 8); // Support arm
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX, floorY - 8); // Support knee
      ctx.stroke();

      // Torso
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(hipX, hipY);
      ctx.stroke();

      // Extended Arm & Leg (Horizontal)
      const armReach = t * 65;
      const handX = shoulderX - 25 - armReach;
      const handY = shoulderY + (1 - t) * 45;

      const legReach = t * 75;
      const footX = hipX + 25 + legReach;
      const footY = hipY + (1 - t) * 45;

      drawGlowBone(ctx, shoulderX, shoulderY, handX, handY, '#06b6d4', '#22d3ee', 9);
      drawGlowBone(ctx, hipX, hipY, footX, footY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, shoulderX, shoulderY, '#06b6d4', 'Shoulder');
      drawGlowingJoint(ctx, handX, handY, '#06b6d4', 'Reaching Hand');
      drawGlowingJoint(ctx, hipX, hipY, '#10b981', 'Hip');
      drawGlowingJoint(ctx, footX, footY, '#f59e0b', 'Extended Leg (180°)');

      curAngleVal = Math.round(110 + t * 70);
      drawAngleGauge(ctx, hipX, hipY, curAngleVal, '180° Parallel');

    } else if (animKey === 'shoulder_abduction') {
      // Shoulder Abduction (Frontal Plane Arm Elevation)
      const shoulderX = width * 0.50;
      const shoulderY = height * 0.40;

      drawRealisticSilhouette(ctx, shoulderX, shoulderY, height);

      // Lateral Arm Raise from side (15° to 95°)
      const armLen = 110;
      const abdAngle = (15 + t * (95 - 15)) * (Math.PI / 180);
      const elbowX = shoulderX + 20 + Math.sin(abdAngle) * (armLen * 0.5);
      const elbowY = shoulderY + Math.cos(abdAngle) * (armLen * 0.5);
      const wristX = shoulderX + 20 + Math.sin(abdAngle) * armLen;
      const wristY = shoulderY + Math.cos(abdAngle) * armLen;

      drawGlowBone(ctx, shoulderX + 20, shoulderY, elbowX, elbowY, '#06b6d4', '#22d3ee', 10);
      drawGlowBone(ctx, elbowX, elbowY, wristX, wristY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, shoulderX + 20, shoulderY, '#06b6d4', 'Shoulder (Abduction)');
      drawGlowingJoint(ctx, elbowX, elbowY, '#10b981', 'Elbow');
      drawGlowingJoint(ctx, wristX, wristY, '#f59e0b', 'Wrist (90° Height)');

      curAngleVal = Math.round(15 + t * (95 - 15));
      drawAngleGauge(ctx, shoulderX + 20, shoulderY, curAngleVal, '95° Shoulder Level');

    } else if (animKey === 'shoulder_flexion') {
      // Shoulder Flexion (Sagittal Plane Forward Arm Raise)
      const shoulderX = width * 0.40;
      const shoulderY = height * 0.40;

      drawRealisticSilhouette(ctx, shoulderX, shoulderY, height);

      const armLen = 110;
      const flexAngle = (15 + t * (105 - 15)) * (Math.PI / 180);
      const elbowX = shoulderX + Math.sin(flexAngle) * (armLen * 0.5);
      const elbowY = shoulderY + Math.cos(flexAngle) * (armLen * 0.5);
      const wristX = shoulderX + Math.sin(flexAngle) * armLen;
      const wristY = shoulderY + Math.cos(flexAngle) * armLen;

      drawGlowBone(ctx, shoulderX, shoulderY, elbowX, elbowY, '#06b6d4', '#22d3ee', 10);
      drawGlowBone(ctx, elbowX, elbowY, wristX, wristY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, shoulderX, shoulderY, '#06b6d4', 'Shoulder Flexion');
      drawGlowingJoint(ctx, elbowX, elbowY, '#10b981', 'Elbow');
      drawGlowingJoint(ctx, wristX, wristY, '#f59e0b', 'Wrist (Forward)');

      curAngleVal = Math.round(15 + t * (105 - 15));
      drawAngleGauge(ctx, shoulderX, shoulderY, curAngleVal, '105° Forward Raise');

    } else if (animKey === 'wall_slides') {
      // Wall Slides ("W" to "Y" Position)
      const shoulderX = width * 0.50;
      const shoulderY = height * 0.44;

      // Wall outline
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.25, height - 35);
      ctx.lineTo(width * 0.75, height - 35);
      ctx.moveTo(width * 0.25, 40);
      ctx.lineTo(width * 0.25, height - 35);
      ctx.stroke();

      drawRealisticSilhouette(ctx, shoulderX, shoulderY, height);

      // Sliding Arms from W to Y
      const slideHeight = t * 55;
      const leftElbowX = shoulderX - 45 - t * 15;
      const leftElbowY = shoulderY - 10 - slideHeight * 0.6;
      const leftHandX = leftElbowX - 15 + t * 25;
      const leftHandY = leftElbowY - 45 - slideHeight * 0.4;

      const rightElbowX = shoulderX + 45 + t * 15;
      const rightElbowY = shoulderY - 10 - slideHeight * 0.6;
      const rightHandX = rightElbowX + 15 - t * 25;
      const rightHandY = rightElbowY - 45 - slideHeight * 0.4;

      drawGlowBone(ctx, shoulderX - 20, shoulderY, leftElbowX, leftElbowY, '#06b6d4', '#22d3ee', 9);
      drawGlowBone(ctx, leftElbowX, leftElbowY, leftHandX, leftHandY, '#10b981', '#34d399', 8);

      drawGlowBone(ctx, shoulderX + 20, shoulderY, rightElbowX, rightElbowY, '#06b6d4', '#22d3ee', 9);
      drawGlowBone(ctx, rightElbowX, rightElbowY, rightHandX, rightHandY, '#10b981', '#34d399', 8);

      drawGlowingJoint(ctx, shoulderX, shoulderY, '#06b6d4', 'Scapula');
      drawGlowingJoint(ctx, leftHandX, leftHandY, '#f59e0b', 'Left Hand');
      drawGlowingJoint(ctx, rightHandX, rightHandY, '#f59e0b', 'Right Hand');

      curAngleVal = Math.round(90 + t * 75);
      drawAngleGauge(ctx, shoulderX, shoulderY - 30, curAngleVal, '"Y" Overhead');

    } else {
      // General Dynamic Limb
      const hipX = width * 0.45;
      const hipY = height * 0.46;
      const kneeX = hipX;
      const kneeY = height * 0.68;
      const ankleX = kneeX;
      const ankleY = height - 38;

      drawRealisticSilhouette(ctx, hipX - 20, height * 0.38, height);
      drawGlowBone(ctx, hipX, hipY, kneeX, kneeY, '#06b6d4', '#22d3ee', 10);
      drawGlowBone(ctx, kneeX, kneeY, ankleX, ankleY, '#10b981', '#34d399', 9);

      drawGlowingJoint(ctx, hipX, hipY, '#06b6d4', 'Joint A');
      drawGlowingJoint(ctx, kneeX, kneeY, '#10b981', 'Joint B');
      drawGlowingJoint(ctx, ankleX, ankleY, '#f59e0b', 'Joint C');

      curAngleVal = Math.round(140 - t * 50);
      drawAngleGauge(ctx, kneeX, kneeY, curAngleVal, 'Target Range');
    }

    // Top Right HUD: Live Joint Angle Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - 130, 16, 114, 52, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText('LIVE ANGLE', width - 120, 32);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'black 20px monospace';
    ctx.fillText(`${curAngleVal}°`, width - 120, 56);

  }, [animProgress, isOpen, tutorial]);

  // Drawing helpers
  function drawGlowBone(ctx, x1, y1, x2, y2, color, glowColor, width) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGlowingJoint(ctx, x, y, color, label) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText(label, x + 10, y + 4);
    }
    ctx.restore();
  }

  function drawAngleGauge(ctx, x, y, angle, targetLabel) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'black 13px monospace';
    ctx.fillText(`${angle}°`, x - 15, y - 22);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText(targetLabel, x - 20, y - 9);
  }

  function drawRealisticSilhouette(ctx, x, y, canvasHeight) {
    // Head
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x, y - 55, 18, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x, canvasHeight - 130);
    ctx.stroke();

    // Legs
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x - 8, canvasHeight - 130);
    ctx.lineTo(x - 12, canvasHeight - 35);
    ctx.moveTo(x + 8, canvasHeight - 130);
    ctx.lineTo(x + 12, canvasHeight - 35);
    ctx.stroke();
  }

  function drawRealisticTorsoSeated(ctx, x, y) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x, y - 85, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x + 15, y);
    ctx.stroke();
  }

  function drawRealisticTorsoStanding(ctx, x, y) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x, y - 35, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 10, y + 60);
    ctx.stroke();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800/90 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-xl shadow-inner">
              🎬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-black tracking-widest text-teal-400 uppercase bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/80">
                  {tutorial.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {tutorial.difficulty}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5 tracking-tight">
                {tutorial.name} — Clinical Form Guide
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            title="Close Tutorial"
          >
            ✕
          </button>
        </div>

        {/* Modal Main Body - Split Layout */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (Col 7): Interactive Biomechanics Video Player */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col items-center">
                
                {/* Visualizer Canvas */}
                <canvas
                  ref={canvasRef}
                  width={580}
                  height={320}
                  className="w-full h-auto max-h-[320px] object-contain"
                />

                {/* Scrubber Timeline & Phase Jump Controls */}
                <div className="w-full bg-slate-950/90 border-t border-slate-800/80 p-3.5 space-y-2.5">
                  
                  {/* Phase Tracker Pills */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {tutorial.movementPhases.map((phase, pIdx) => {
                      const isActive = currentPhaseIndex === pIdx;
                      return (
                        <button
                          key={pIdx}
                          onClick={() => jumpToPhase(pIdx)}
                          className={`py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold transition-all border text-center truncate cursor-pointer ${
                            isActive
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-xs'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {phase.phase.split(':')[0]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Player Controls Toolbar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/20 cursor-pointer"
                      >
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                      </button>

                      <button
                        onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 0.5 : 1)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          playbackSpeed === 0.5
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        ⏱ {playbackSpeed}x {playbackSpeed === 0.5 ? '(Slow-Mo)' : ''}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Target: <strong className="text-teal-300">{tutorial.targetJoints}</strong></span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Active Phase Live Guidance Box */}
              <div className="bg-slate-950/70 border border-teal-500/30 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                    Current Movement Phase
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {tutorial.movementPhases[currentPhaseIndex]?.angle}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-xs">
                  {tutorial.movementPhases[currentPhaseIndex]?.phase}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tutorial.movementPhases[currentPhaseIndex]?.instruction}
                </p>
              </div>
            </div>

            {/* Right Column (Col 5): Structured Clinical Breakdown */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Section 1: Starting Position & Stance */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-400 font-black text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                  <span>🧘 Starting Position & Stance</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {tutorial.startingPosition.posture}
                </p>
                <div className="bg-teal-950/30 border border-teal-900/40 p-2.5 rounded-xl">
                  <span className="text-[9.5px] font-bold text-teal-400 uppercase block">Joint Placement Setup</span>
                  <p className="text-xs text-teal-200 mt-0.5 font-semibold leading-normal">
                    {tutorial.startingPosition.jointSetup}
                  </p>
                </div>
              </div>

              {/* Section 2: Camera Setup & Required Angle */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                  <span>📷 Camera Setup & Distance</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Required Angle</span>
                    <span className="font-extrabold text-cyan-300">{tutorial.cameraPlacement.view}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Distance</span>
                    <span className="font-extrabold text-cyan-300">{tutorial.cameraPlacement.distance}</span>
                  </div>
                </div>
                <ul className="space-y-1 text-xs text-slate-300 pt-1">
                  {tutorial.cameraPlacement.guidelines.map((guide, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-black shrink-0">✓</span>
                      <span>{guide}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Common Mistakes & PT Corrections */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                  <span>⚠️ Common Mistakes & Corrections</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {tutorial.commonMistakes.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-rose-900/30 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                        <span>❌</span>
                        <span>{item.mistake}</span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-medium pl-4 flex items-start gap-1">
                        <span className="text-emerald-400">✓ Fix:</span>
                        <span>{item.correction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <p className="text-[11px] text-slate-400">
            {isLiveSession
              ? '💡 Live workout is paused. Return whenever you are ready.'
              : 'You can re-open this guide anytime during your workout from the HUD toolbar.'}
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isLiveSession ? (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer"
              >
                ◀ Resume Live Workout
              </button>
            ) : onStartWorkout ? (
              <button
                onClick={() => {
                  onClose();
                  onStartWorkout();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🏋️‍♂️ Start Workout</span> &rarr;
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Guide
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
