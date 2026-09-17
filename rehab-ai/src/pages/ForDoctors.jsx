import { Link, useNavigate } from 'react-router-dom';
import PoseCareLogo from '../components/PoseCareLogo';

export default function ForDoctors() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handlePortalRedirect = () => {
    if (token && user) {
      if (user.role === 'doctor') navigate('/doctor');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/scanner');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-16 pb-24">
        {/* Background decorative gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-50/70 rounded-full blur-3xl -z-10 translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-3xl -z-10 -translate-x-32 translate-y-32"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Column - Hero Copy */}
            <div className="lg:w-7/12 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider">
                <span>🩺</span> Built for Physical Therapists & Orthopedic Specialists
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
                Transform At-Home Recovery with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500">Precision AI Telerehab.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Prescribe personalized joint angle targets, track compliance with automated computer vision goniometry, and monitor objective recovery curves on an intuitive clinical portal.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={handlePortalRedirect}
                  className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/30 transition-all transform hover:-translate-y-0.5"
                >
                  {token && user?.role === 'doctor' ? 'Access Doctor Portal →' : 'Launch Clinical Portal'}
                </button>
                <Link
                  to="/library"
                  className="px-7 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all shadow-xs"
                >
                  Explore 19+ Clinical Protocols
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 font-black">✓</span> Zero Hardware / Sensors Needed
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 font-black">✓</span> Client-Side Edge Privacy
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 font-black">✓</span> Real-Time Audio Voice Coaching
                </div>
              </div>
            </div>

            {/* Right Column - Interactive Clinical Mockup Card */}
            <div className="lg:w-5/12 w-full max-w-md mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80 relative">
                {/* Header of Mockup */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-teal-500/20">
                      JD
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Jane Doe (ACL Recovery)</h4>
                      <p className="text-[11px] text-slate-400">Post-Op Day 18 • Knee Extension</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-full">
                    94% Compliance
                  </span>
                </div>

                {/* Simulated Recovery Chart */}
                <div className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">Range of Motion (ROM) Progression</span>
                    <span className="text-xs font-black text-teal-600">+45° Gain</span>
                  </div>
                  
                  {/* SVG Trend Graph */}
                  <div className="h-32 w-full bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-end justify-between gap-2">
                    {[
                      { day: 'D1', val: 40, label: '90°' },
                      { day: 'D4', val: 55, label: '105°' },
                      { day: 'D8', val: 65, label: '120°' },
                      { day: 'D12', val: 80, label: '140°' },
                      { day: 'D16', val: 95, label: '160°' }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[9px] font-bold text-slate-500">{bar.label}</span>
                        <div 
                          className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all"
                          style={{ height: `${bar.val}%` }}
                        ></div>
                        <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescriptions Sliders Preview */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 font-semibold mb-1">
                      <span>Target Flexion Angle</span>
                      <span className="font-bold text-slate-900">160°</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full w-[85%] rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 font-semibold mb-1">
                      <span>Prescribed Repetitions</span>
                      <span className="font-bold text-slate-900">12 Reps / Set</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[70%] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Status footer banner */}
                <div className="mt-4 p-3 bg-teal-50/80 rounded-xl border border-teal-200/60 flex items-center gap-2.5 text-[11px] text-teal-800 font-semibold">
                  <span className="text-base">⚡</span>
                  <span>Form compensation detector: <strong>0 valgus faults flagged</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 2: CLINICAL VALUE PROPOSITIONS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-teal-600 mb-2">Clinical Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Bridge the Gap Between Clinic Visits and Home Recovery
            </p>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Replace subjective patient recall with verified mathematical joint telemetry and automated posture validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl mb-6">
                📐
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Granular Biomechanical Prescriptions</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Customize precise starting angles, target success thresholds, maximum failure limits, and hold durations tailored to each patient's post-op phase.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl mb-6">
                📈
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Longitudinal ROM Recovery Curves</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Track chronological Range of Motion (ROM) charts and repetition volume automatically logged after each session, showing clear visual trajectory.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-6">
                🚨
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Compensatory Movement Alerts</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated multi-joint kinematics detect cheating movements—such as trunk lean, lumbar hyperextension, or knee valgus—in real time.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl mb-6">
                🎮
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">3x Adherence with Gamified Exercises</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Patients play interactive biofeedback games (Zen Bloom, Flappy Rehab, Silhouette Shadow Match) mapped directly to their prescribed physical joint range.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-2xl mb-6">
                🔒
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Client-Side Edge Privacy</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Computer vision landmark inference runs 100% locally in the patient's browser via WebAssembly. Video feeds never stream or persist to the cloud.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl mb-6">
                🗣️
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Auditory Speech Coaching</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Web Speech API audio prompts coach patients through floor and mat exercises without forcing them to crane their necks to see the display.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 3: 3-STEP CLINICAL WORKFLOW */}
      <section className="py-20 bg-white border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-teal-600 mb-2">How It Works</h2>
            <p className="text-3xl font-black text-slate-900 tracking-tight">The 3-Step Telerehabilitation Flow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-teal-600/20">
                  1
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Configure Prescription</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Assign exercises from the 19+ catalog and dial in custom target angles, hold durations, and daily repetition quotas for your patient.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-teal-600/20">
                  2
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Patient Exercises at Home</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  The patient opens their laptop webcam, chooses an exercise or game mode, and receives real-time skeletal overlays with voice corrections.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-teal-600/20">
                  3
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Review Objective Recovery</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Review session logs, historical ROM angles, and compliance scores on your Doctor Dashboard before scheduling follow-ups.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 4: CALL TO ACTION BANNER */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            Ready to elevate your practice?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Start Monitoring Patients with AI Today.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Create a clinician account to access patient management, customized biomechanical prescriptions, and automated recovery telemetry.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={handlePortalRedirect}
              className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Get Started as a Doctor
            </button>
            <Link
              to="/library"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm rounded-xl transition-all"
            >
              Browse Exercise Library
            </Link>
          </div>
        </div>
      </section>


      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <PoseCareLogo size="md" variant="full" />
          </div>
          <p className="text-xs text-slate-400 font-medium text-center md:text-right">
            © {new Date().getFullYear()} PoseCare Physical Rehabilitation Platform. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}