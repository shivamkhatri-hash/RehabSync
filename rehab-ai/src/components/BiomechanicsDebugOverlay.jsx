import React, { useState } from 'react';

export default function BiomechanicsDebugOverlay({
  engineOutput,
  targetAngle = 90,
  failureAngle = 150,
  holdDuration = 0,
  exerciseName = 'Exercise'
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (!engineOutput) return null;

  const {
    fsmState = 'REST',
    rawAngle = 0,
    filteredAngle = 0,
    poseQuality = { qualityScore: 0, positioningGuidance: '' },
    formCheck = { isCompensating: false, violations: [] },
    repCount = 0,
    invalidRepCount = 0,
    holdProgress = 0,
    diagnostics = {}
  } = engineOutput;

  const getStateBadgeStyle = (state) => {
    switch (state) {
      case 'TARGET_HOLD':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse';
      case 'MOVING':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'RETURN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'REST':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="absolute top-4 right-4 z-40 pointer-events-auto flex flex-col items-end">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-200 shadow-xl hover:bg-slate-800 transition-all mb-2"
        title="Toggle Biomechanics HUD"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>{isOpen ? 'Hide Biomechanics HUD' : 'Show Biomechanics HUD'}</span>
      </button>

      {isOpen && (
        <div className="w-80 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 shadow-2xl p-4 text-slate-100 font-sans text-xs flex flex-col gap-3 transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ⚡
              </span>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm tracking-wide">Biomechanics Engine</h4>
                <p className="text-[10px] text-slate-400">{exerciseName} • 1€ Filtered</p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold tracking-wider uppercase ${getStateBadgeStyle(fsmState)}`}>
              {fsmState}
            </span>
          </div>

          {/* Real-time Angle Telemetry */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Live Filtered Angle</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-cyan-300">{filteredAngle}°</span>
                <span className="text-[10px] text-slate-500 line-through">{rawAngle}°</span>
              </div>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Target ROM</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {targetAngle}° <span className="text-[10px] text-slate-400">(Reset: {failureAngle}°)</span>
              </div>
            </div>
          </div>

          {/* Hold Progress Bar if in Hold phase */}
          {holdDuration > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Isometric Hold Duration</span>
                <span className="font-semibold text-slate-200">{Math.round(holdProgress * holdDuration * 10) / 10}s / {holdDuration}s</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100 rounded-full"
                  style={{ width: `${Math.min(100, holdProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Pose Quality Index */}
          <div className="flex items-center justify-between bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/50">
            <span className="text-slate-400">Pose Quality Index:</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${getQualityColor(poseQuality.qualityScore)}`}>
                {poseQuality.qualityScore}%
              </span>
              <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    poseQuality.qualityScore >= 80 ? 'bg-emerald-400' : poseQuality.qualityScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${poseQuality.qualityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Multi-Joint Form Diagnostic Alert */}
          {formCheck.isCompensating ? (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex flex-col gap-1 animate-pulse">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <span>⚠️ Compensation Detected</span>
              </div>
              {formCheck.violations.map((v, idx) => (
                <div key={idx} className="text-[10px] text-rose-200">
                  • <span className="font-semibold">{v.joint}:</span> {v.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-[11px] font-medium">Kinetic chain aligned • Form optimal</span>
            </div>
          )}

          {/* Diagnostic Stats Footer */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Valid Reps: <b className="text-emerald-400">{repCount}</b></span>
            <span>Rushed / Incomplete: <b className="text-amber-400">{invalidRepCount}</b></span>
            <span>ROM Range: <b className="text-cyan-300">{diagnostics.minAngle || 0}° - {diagnostics.maxAngle || 0}°</b></span>
          </div>

        </div>
      )}
    </div>
  );
}
