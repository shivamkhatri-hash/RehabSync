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

const EXERCISE_REFS = {
  'Bicep Curl': {
    joints: 'Elbow Joint',
    desc: 'Elbow flexion training targeting the biceps brachii.',
    guidance: 'Keep your upper arm horizontal at shoulder height. Bend elbow to 90 degrees.',
    tip: 'Face the camera and avoid dropping your upper arm below shoulder level.'
  },
  'Push-up': {
    joints: 'Elbow & Shoulder',
    desc: 'Upper body pushing movement targeting chest and triceps.',
    guidance: 'Keep your torso straight and lower your chest until elbows bend to 90°.',
    tip: 'Maintain a tight core and prevent your hips from sagging.'
  },
  'Crunch': {
    joints: 'Thoracic / Core',
    desc: 'Abdominal contraction targeting rectus abdominis.',
    guidance: 'Lie on your back, knees bent, and raise your upper trunk towards your knees.',
    tip: 'Do not pull your neck with your hands. Focus on core contractions.'
  },
  'Seated Knee Extension': {
    joints: 'Knee Joint',
    desc: 'Quadriceps strength training for active knee extension.',
    guidance: 'Sit upright and slowly straighten your knee completely to full extension.',
    tip: 'Use a side view showing your hip, knee, and ankle clearly.'
  },
  'Straight Leg Raise': {
    joints: 'Hip & Knee',
    desc: 'Hip flexor and quadriceps rehab with straight leg elevation.',
    guidance: 'Lie flat, keep the target leg fully straight, and raise it 45 degrees.',
    tip: 'Ensure the knee does not bend during the lift.'
  },
  'Mini Squat': {
    joints: 'Knee & Hip',
    desc: 'Functional partial squat training targeting quads and glutes.',
    guidance: 'Lower your hips slightly as if sitting down, keeping knees behind toes.',
    tip: 'Align the camera to capture a side profile of your lower body.'
  },
  'Sit-to-Stand': {
    joints: 'Full Lower Body',
    desc: 'Functional mobility training transferring from seated to standing.',
    guidance: 'Stand up fully from a chair and sit back down slowly with control.',
    tip: 'Do not use your arms to push off if you are building pure leg strength.'
  },
  'Standing Knee Flexion': {
    joints: 'Knee / Hamstring',
    desc: 'Knee flexion stretching targeting the hamstring muscle group.',
    guidance: 'Stand tall and bend your knee backwards, bringing your heel towards your glutes.',
    tip: 'Keep your thighs parallel to each other during the flexion.'
  },
  'Standing Hip Abduction': {
    joints: 'Hip Joint',
    desc: 'Lateral hip extension targeting gluteus medius strength.',
    guidance: 'Stand tall and raise the target leg sideways away from the body.',
    tip: 'Keep your trunk vertical; avoid leaning to the opposite side.'
  },
  'Standing Hip Flexion': {
    joints: 'Hip Joint',
    desc: 'Anterior hip elevation targeting hip flexors.',
    guidance: 'Stand straight and raise your knee forward to a 90-degree angle.',
    tip: 'Keep your standing leg fully straight and active.'
  },
  'Shoulder Flexion': {
    joints: 'Shoulder Joint',
    desc: 'Anterior shoulder mobility lift targeting deltoids.',
    guidance: 'Slowly raise your arm straight forward and upward overhead.',
    tip: 'Maintain a side-view profile relative to the camera.'
  },
  'Shoulder Abduction': {
    joints: 'Shoulder Joint',
    desc: 'Lateral shoulder mobility lift targeting middle deltoids.',
    guidance: 'Raise your arm straight out to the side until it is parallel to the ground.',
    tip: 'Face the camera directly with both shoulders visible.'
  },
  'Wall Slides': {
    joints: 'Shoulders & Upper Back',
    desc: 'Scapular stability training sliding arms against vertical surface.',
    guidance: 'Keep your back and arms flat against the wall, sliding elbows upward.',
    tip: 'Keep both shoulder blades pinned to the surface to optimize scapular glide.'
  },
  'Calf Raise': {
    joints: 'Ankle / Calf',
    desc: 'Ankle plantarflexion training targeting gastrocnemius.',
    guidance: 'Stand tall and raise up onto the balls of your feet, lifting heels high.',
    tip: 'Lower down slowly to engage eccentric calf control.'
  },
  'Marching in Place': {
    joints: 'Full Lower Body',
    desc: 'Rhythmic gait and balance coordination training.',
    guidance: 'Alternate raising each knee to hip level in a steady marching rhythm.',
    tip: 'Keep the chest upright and pump arms lightly for balance.'
  },
  'Single-Leg Balance': {
    joints: 'Ankle & Hip Core',
    desc: 'Proprioceptive balance training on a single limb.',
    guidance: 'Raise one foot off the ground and maintain a steady standing posture.',
    tip: 'Focus your gaze on a fixed point ahead to stabilize balance.'
  },
  'Bird Dog': {
    joints: 'Core & Spine',
    desc: 'Contralateral limb extensions for core and spinal stability.',
    guidance: 'On all fours, extend one arm forward and the opposite leg straight back.',
    tip: 'Keep your neck neutral and your hips square to the ground.'
  },
  'Squat': {
    joints: 'Knees, Hips & Glutes',
    desc: 'Standard deep squat for lower body strength and range of motion.',
    guidance: 'Lower hips backward while bending knees to a target flexion angle.',
    tip: 'Keep your weight in your heels and your chest proud.'
  },
  'Lunge': {
    joints: 'Hips & Knees',
    desc: 'Unilateral forward stepping leg rehabilitation.',
    guidance: 'Step forward and lower hips until your back knee almost touches the floor.',
    tip: 'Ensure your front knee does not overshoot your ankle.'
  }
};

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
                  
                  {/* Anatomical Reference & Execution Guide */}
                  {(() => {
                    const ref = EXERCISE_REFS[ex.name] || {
                      joints: 'General Body',
                      desc: 'Standard clinical range of motion rehabilitation.',
                      guidance: 'Position yourself clearly in the camera frame.',
                      tip: 'Follow the live audio coach feedback.'
                    };
                    return (
                      <div className="mt-3 bg-slate-50 border border-slate-150 rounded-xl p-3 text-[10px] space-y-2 text-slate-600">
                        <div>
                          <span className="font-extrabold text-slate-900 block text-[8px] uppercase tracking-wider">Anatomical Target</span>
                          <span>{ref.joints}</span>
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-[8px] uppercase tracking-wider">Execution Guide</span>
                          <span className="leading-relaxed block">{ref.guidance}</span>
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-[8px] uppercase tracking-wider">Coach Pro-Tip</span>
                          <span className="text-[9px] text-teal-750 italic block">{ref.tip}</span>
                        </div>
                      </div>
                    );
                  })()}

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
                  <div className="text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
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