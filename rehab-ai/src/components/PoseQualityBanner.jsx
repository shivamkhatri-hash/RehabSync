import React from 'react';

export default function PoseQualityBanner({ poseQuality }) {
  if (!poseQuality || poseQuality.isValid) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-950/90 backdrop-blur-md border border-amber-500/40 shadow-2xl text-amber-200 animate-bounce text-xs font-semibold">
      <span className="text-base">⚠️</span>
      <div>
        <span>{poseQuality.positioningGuidance || 'Adjust position for accurate tracking'}</span>
        {poseQuality.occludedJoints?.length > 0 && (
          <span className="text-[10px] text-amber-300 block font-normal">
            Low visibility on: {poseQuality.occludedJoints.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
