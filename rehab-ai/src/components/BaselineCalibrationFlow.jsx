import React, { useState, useEffect } from 'react';
import { calculateBaselineProgression } from '../utils/calibrationEngine';

export default function BaselineCalibrationFlow({
  isOpen,
  currentAngle = 0,
  exerciseName = 'Exercise',
  prescribedTarget = 90,
  targetDirection = 'decrease',
  engineOutput,
  onBaselineComplete,
  onCancel
}) {
  const [recordedReps, setRecordedReps] = useState([]);
  const [currentRepMax, setCurrentRepMax] = useState(targetDirection === 'decrease' ? 999 : 0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setRecordedReps([]);
      setCurrentRepMax(targetDirection === 'decrease' ? 999 : 0);
      setIsCompleted(false);
      setSummary(null);
    }
  }, [isOpen, targetDirection]);

  // Track rep completions during calibration mode
  useEffect(() => {
    if (!isOpen || isCompleted || !engineOutput) return;

    if (engineOutput.repCompleted) {
      const peakAngle = targetDirection === 'decrease' 
        ? engineOutput.diagnostics.minAngle || currentAngle 
        : engineOutput.diagnostics.maxAngle || currentAngle;

      const newReps = [...recordedReps, peakAngle];
      setRecordedReps(newReps);

      if (newReps.length >= 3) {
        const prog = calculateBaselineProgression(newReps, prescribedTarget, targetDirection);
        setSummary(prog);
        setIsCompleted(true);
      }
    }
  }, [engineOutput?.repCompleted, isOpen, isCompleted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xl font-bold">
              ✨
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">3-Rep Baseline ROM Calibration</h3>
              <p className="text-xs text-slate-400">{exerciseName} • Personal Active Range Assessment</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm p-1">
            ✕
          </button>
        </div>

        {!isCompleted ? (
          <>
            {/* Step Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Calibration Progress</span>
                <span className="text-cyan-400">{recordedReps.length} / 3 Reps Completed</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${(recordedReps.length / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Instruction Card */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <span className="text-2xl block">🦾</span>
              <h4 className="font-extrabold text-sm text-slate-100">
                Perform Rep {recordedReps.length + 1} of 3
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Move naturally to your comfortable, pain-free maximum active range and hold briefly.
              </p>
            </div>

            {/* Live Angle Display */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Live Angle</span>
                <span className="text-2xl font-black text-cyan-300">{currentAngle}°</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Doctor Prescribed</span>
                <span className="text-2xl font-black text-slate-300">{prescribedTarget}°</span>
              </div>
            </div>

            {/* Manual Record Button for Accessibility */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newReps = [...recordedReps, currentAngle];
                  setRecordedReps(newReps);
                  if (newReps.length >= 3) {
                    const prog = calculateBaselineProgression(newReps, prescribedTarget, targetDirection);
                    setSummary(prog);
                    setIsCompleted(true);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
              >
                Capture Current Angle as Rep {recordedReps.length + 1} ({currentAngle}°)
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Calibration Complete Result Card */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center space-y-2">
              <span className="text-3xl block">🎯</span>
              <h4 className="font-extrabold text-base text-teal-300">
                Personal Baseline Calculated!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Based on your 3 comfortable reps, we have calibrated an active progression target personalized to your mobility.
              </p>
            </div>

            {/* Metrics Comparison */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Your Baseline</span>
                <span className="text-xl font-black text-teal-400">{summary?.baselineRom}°</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Doctor Goal</span>
                <span className="text-xl font-black text-slate-400">{summary?.prescribedTarget}°</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                <span className="text-[10px] text-cyan-300 font-bold block mb-1">Active Target</span>
                <span className="text-xl font-black text-cyan-300">{summary?.adaptedTarget}°</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onBaselineComplete(summary?.adaptedTarget, summary?.baselineRom)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 font-extrabold text-xs text-white shadow-lg shadow-teal-500/20 transition-all"
              >
                Apply Personalized Target ({summary?.adaptedTarget}°) & Start
              </button>

              <button
                onClick={() => onBaselineComplete(prescribedTarget, summary?.baselineRom)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 border border-slate-700 transition-all"
              >
                Use Standard Doctor Target ({prescribedTarget}°)
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
