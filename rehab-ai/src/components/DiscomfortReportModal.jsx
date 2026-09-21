import React, { useState } from 'react';

export default function DiscomfortReportModal({
  isOpen,
  onClose,
  onSubmit,
  exerciseName = '',
  assignmentId = null
}) {
  const [discomfortLevel, setDiscomfortLevel] = useState(3);
  const [painArea, setPainArea] = useState('Joint');
  const [notes, setNotes] = useState('');
  const [stoppedEarly, setStoppedEarly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        assignmentId,
        exerciseName,
        discomfortLevel: Number(discomfortLevel),
        painArea,
        notes: notes.trim() ? `[${painArea}] ${notes}` : `Reported discomfort in ${painArea} (Level ${discomfortLevel}/10)`,
        stoppedEarly
      });
      onClose();
    } catch (err) {
      console.error("Failed to submit discomfort report:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Report Discomfort / Stop Early</h3>
              <p className="text-[10px] text-slate-400">Your physiotherapist will receive this safety report immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Exercise Name Display */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Exercise</span>
            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{exerciseName || 'General Routine'}</span>
          </div>

          {/* Discomfort Level Slider (1 - 10) */}
          <div>
            <div className="flex justify-between items-center mb-1 font-bold">
              <label className="text-slate-700">Discomfort Level (VAS Pain Scale):</label>
              <span className={`px-2 py-0.5 rounded-md font-black font-mono text-xs ${
                discomfortLevel <= 3 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                discomfortLevel <= 6 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {discomfortLevel} / 10 ({discomfortLevel <= 3 ? 'Mild' : discomfortLevel <= 6 ? 'Moderate' : 'Severe'})
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={discomfortLevel}
              onChange={(e) => setDiscomfortLevel(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5 mt-0.5">
              <span>1 (Very Mild)</span>
              <span>5 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>

          {/* Pain Area Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Area of Sensation</label>
            <div className="grid grid-cols-3 gap-2">
              {['Joint', 'Muscle', 'Tendon', 'Nerve / Tingling', 'Fatigue', 'Other'].map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setPainArea(area)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    painArea === area
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Clinical Note / Sensation Description (Optional)</label>
            <textarea
              rows="2"
              placeholder="e.g., Felt sharp pinch at the bottom of the movement, decided to pause..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium resize-none"
            />
          </div>

          {/* Stop session checkbox */}
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 cursor-pointer">
            <input
              type="checkbox"
              checked={stoppedEarly}
              onChange={(e) => setStoppedEarly(e.target.checked)}
              className="accent-amber-600 w-4 h-4 rounded"
            />
            <span className="font-semibold text-slate-700 text-[11px]">
              End routine now & save progress without forcing completion
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Continue Workout
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-md shadow-teal-600/10 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Log & Exit Safely'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
