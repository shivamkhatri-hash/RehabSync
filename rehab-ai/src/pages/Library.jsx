import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const FALLBACK_EXERCISES = [
  { name: 'Bicep Curl', target_joints: [11, 13, 15], success_angle: 85, failure_angle: 150 },
  { name: 'Push-up', target_joints: [11, 13, 15], success_angle: 105, failure_angle: 155 },
  { name: 'Crunch', target_joints: [11, 23, 25], success_angle: 80, failure_angle: 115 },
  { name: 'Seated Knee Extension', target_joints: [23, 25, 27], success_angle: 160, failure_angle: 105 },
  { name: 'Straight Leg Raise', target_joints: [11, 23, 25], success_angle: 115, failure_angle: 165 },
  { name: 'Mini Squat', target_joints: [23, 25, 27, 24, 26, 28, 11, 12], success_angle: 125, failure_angle: 165 },
  { name: 'Sit-to-Stand', target_joints: [11, 12, 23, 24, 25, 26, 27, 28], success_angle: 160, failure_angle: 105 },
  { name: 'Standing Knee Flexion', target_joints: [23, 25, 27], success_angle: 100, failure_angle: 165 },
  { name: 'Standing Hip Abduction', target_joints: [23, 25, 27], success_angle: 0.28, failure_angle: 0.05 },
  { name: 'Standing Hip Flexion', target_joints: [11, 23, 25], success_angle: 115, failure_angle: 165 },
  { name: 'Shoulder Flexion', target_joints: [23, 11, 13], success_angle: 105, failure_angle: 20 },
  { name: 'Shoulder Abduction', target_joints: [23, 11, 13], success_angle: 95, failure_angle: 20 },
  { name: 'Wall Slides', target_joints: [23, 24, 11, 12, 13, 14, 15, 16], success_angle: 100, failure_angle: 25 },
  { name: 'Calf Raise', target_joints: [25, 27, 29, 31], success_angle: 0.07, failure_angle: 0.025 },
  { name: 'Marching in Place', target_joints: [11, 12, 23, 24, 25, 26, 27, 28], success_angle: 120, failure_angle: 160 },
  { name: 'Single-Leg Balance', target_joints: [11, 12, 23, 24, 25, 26, 27, 28], success_angle: 0.10, failure_angle: 0.02 },
  { name: 'Bird Dog', target_joints: [11, 12, 15, 16, 23, 24, 27, 28], success_angle: 0.80, failure_angle: 0.45 },
  { name: 'Squat', target_joints: [23, 25, 27], success_angle: 100, failure_angle: 165 },
  { name: 'Lunge', target_joints: [23, 25, 27], success_angle: 105, failure_angle: 160 }
];

const getTargetArea = (joints) => {
  if (!joints || joints.length === 0) return 'General';
  const lowerBodyJoints = [25, 26, 27, 28, 29, 30, 31, 32];
  const hasLower = joints.some(j => lowerBodyJoints.includes(j));
  const upperBodyJoints = [11, 12, 13, 14, 15, 16];
  const hasUpper = joints.some(j => upperBodyJoints.includes(j));
  
  if (hasLower && hasUpper) return 'Full Body';
  if (hasLower) return 'Lower Body';
  if (hasUpper) return 'Upper Body';
  return 'Core & Balance';
};

export default function Library() {
  const [exercises, setExercises] = useState(FALLBACK_EXERCISES);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch(`${API_URL}/api/exercises`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setExercises(data);
          }
        }
      } catch (err) {
        console.warn("Express backend offline. Using fallback database specs.", err);
      }
    };
    fetchExercises();
  }, []);

  // Filter and Search exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const category = getTargetArea(ex.target_joints);
    const matchesCategory = activeCategory === 'All' || category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Upper Body', 'Lower Body', 'Core & Balance', 'Full Body'];

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title Section */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Interactive Exercise Library</h1>
          <p className="text-slate-500 mt-2">Explore the active rehabilitation exercises supported by our computer vision AI form check models.</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input 
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 text-slate-800 transition-all placeholder-slate-400"
            />
            <span className="absolute right-3.5 top-3.5 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Muscle Group Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/10' 
                    : 'bg-slate-100 text-slate-600 hover:text-slate-905 hover:bg-slate-200/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredExercises.map((ex, idx) => {
            const area = getTargetArea(ex.target_joints);
            const isHoldType = ex.name.toLowerCase().includes('balance') || ex.name.toLowerCase().includes('dog') || ex.name.toLowerCase().includes('hold');
            const unit = isHoldType ? 's' : '°';

            return (
              <div 
                key={idx}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug">{ex.name}</h3>
                    <span className="inline-block text-[8px] font-black text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      AI Tracked
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Focus Area: <span className="text-teal-600">{area}</span></p>
                  
                  {ex.target_joints && (
                    <p className="text-[10px] text-slate-400 mt-2.5 font-semibold">
                      Tracked points: <span className="font-bold text-slate-500">{ex.target_joints.length} MediaPipe landmarks</span>
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex flex-wrap gap-2">
                  <div className="text-[9px] font-bold text-teal-700 bg-teal-50/70 border border-teal-150 px-2.5 py-1 rounded-lg">
                    Success Angle: <span className="font-black">{ex.success_angle}{unit}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-650 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    Reset Angle: <span className="font-black">{ex.failure_angle}{unit}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredExercises.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-slate-200 shadow-sm">
              No matching exercises found in this category.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}