import React, { useState } from 'react';

export default function PrivacyEdgeIndicator() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="absolute top-6 left-6 z-40">
      <div 
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 shadow-xl text-slate-200 text-[11px] font-medium cursor-pointer transition-all hover:border-emerald-400"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-300">Camera processed locally</span>
        <span className="text-slate-400">• video not uploaded</span>
      </div>

      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-72 p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 text-[11px] text-slate-300 shadow-2xl space-y-2 pointer-events-none animate-fadeIn">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Edge AI Privacy Assurance</span>
          </div>
          <p className="leading-relaxed text-slate-400 text-[10px]">
            Video frames are processed in real-time in your local browser memory via WebAssembly/GPU. No video or raw camera imagery is ever transmitted to servers or stored in the cloud. Only numerical telemetry (joint angles, rep counts) is logged.
          </p>
          <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-500 flex justify-between">
            <span>HIPAA & GDPR Telemetry Standard</span>
            <span className="text-emerald-400">100% On-Device</span>
          </div>
        </div>
      )}
    </div>
  );
}
