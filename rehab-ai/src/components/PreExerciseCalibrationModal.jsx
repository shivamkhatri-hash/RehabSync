import React from 'react';

export default function PreExerciseCalibrationModal({
  isOpen,
  calibrationResult,
  exerciseName = 'Exercise',
  requiredCameraView = 'front',
  onOpenTutorial,
  onProceedToWorkout,
  onProceedToBaseline,
  onCancel
}) {
  if (!isOpen) return null;

  const checks = calibrationResult?.checks || {
    visibility: false,
    distance: false,
    orientation: false,
    joints: false,
    confidence: false
  };

  const isAllPassed = calibrationResult?.passed || false;
  const orientationStatus = calibrationResult?.orientationStatus || 'Aligning...';
  const detectedOrientation = calibrationResult?.orientationData?.orientation || 'unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold">
              📐
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">Pre-Exercise Camera Calibration</h3>
              <p className="text-xs text-slate-400">{exerciseName} • Required View: <span className="font-semibold text-cyan-300 uppercase">{requiredCameraView}</span></p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Real-time Status Guidance */}
        <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${
          isAllPassed 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <span className="text-2xl">{isAllPassed ? '✅' : '🧭'}</span>
          <div>
            <span className="font-bold text-xs block">
              {isAllPassed ? 'Camera Angle & Calibration Optimal!' : 'Live Alignment Guidance'}
            </span>
            <span className="text-[11px] text-slate-400">
              {calibrationResult?.message || 'Position yourself clearly in front of the camera'}
            </span>
          </div>
        </div>

        {/* Calibration Checklist */}
        <div className="space-y-2.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 text-xs">
          
          {/* Check 1: Distance & Body Scale */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className={checks.distance ? 'text-emerald-400' : 'text-slate-500'}>
                {checks.distance ? '●' : '○'}
              </span>
              <span>Distance & Full-Body Scale</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              checks.distance ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {checks.distance ? 'Framed Properly' : 'Adjust Distance'}
            </span>
          </div>

          {/* Check 2: Orientation Match */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className={checks.orientation ? 'text-emerald-400' : 'text-slate-500'}>
                {checks.orientation ? '●' : '○'}
              </span>
              <span>Body Orientation Angle</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              checks.orientation ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              Detected: {detectedOrientation} ({orientationStatus})
            </span>
          </div>

          {/* Check 3: Keypoint Visibility */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className={checks.joints ? 'text-emerald-400' : 'text-slate-500'}>
                {checks.joints ? '●' : '○'}
              </span>
              <span>Required Joint Landmarks</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              checks.joints ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {checks.joints ? '100% Detected' : 'Partially Blocked'}
            </span>
          </div>

          {/* Check 4: Lighting & Confidence */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className={checks.confidence ? 'text-emerald-400' : 'text-slate-500'}>
                {checks.confidence ? '●' : '○'}
              </span>
              <span>Lighting & Sensor Confidence</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              checks.confidence ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {checks.confidence ? 'High (>80%)' : 'Moderate'}
            </span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 cursor-pointer"
            >
              <span>🎬 Watch Video Tutorial</span>
            </button>
          )}

          <button
            onClick={onProceedToWorkout}
            className="flex-1 py-3.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/25 ring-2 ring-cyan-400/30 cursor-pointer"
          >
            <span>🚀 Skip Warmup & Start Workout</span>
          </button>

          <button
            onClick={onProceedToBaseline}
            className="flex-1 py-3.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            <span>✨ 3-Rep Baseline</span>
          </button>
        </div>

        {/* Quick Start & Guide Shortcuts */}
        <div className="text-center pt-1 border-t border-slate-800/60 flex items-center justify-center gap-4">
          <button
            onClick={onProceedToWorkout}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
          >
            ⚡ Quick Start (Demo Mode)
          </button>
        </div>

      </div>
    </div>
  );
}
