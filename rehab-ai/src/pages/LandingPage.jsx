import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200/60 py-20 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-40 -z-10 translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-40 -z-10 -translate-x-20 translate-y-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column: Hero Copy */}
          <div className="lg:w-1/2 space-y-6">
            <span className="inline-block text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200/60 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
              ✨ Next-Gen Virtual Rehabilitation
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Professional Physical Therapy, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">Powered by AI.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-xl">
              Connect with certified clinical specialists, receive personalized biomechanical prescriptions, and ensure perfect exercise form using your device's camera.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                to="/auth" 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-600/10 hover:shadow-xl hover:shadow-teal-600/20 transition-all transform hover:-translate-y-0.5"
              >
                Start Your Recovery
              </Link>
              <button 
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                Consult a Doctor
              </button>
            </div>
          </div>
          
          {/* Right Column: Hero Graphic Demo */}
          <div className="lg:w-1/2 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white shadow-slate-200 max-w-lg mx-auto">
              <img 
                src="/posecare_hero_illustration.jpg" 
                alt="PoseCare AI Patient Rehabilitation Squat Session" 
                className="w-full h-auto object-cover display-block"
              />
              
              {/* Interactive overlay card 1 */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-lg select-none">
                <span className="text-xl">🔥</span>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Daily streak</span>
                  <span className="text-xs font-black text-white">5 Days Active</span>
                </div>
              </div>

              {/* Interactive overlay card 2 */}
              <div className="absolute bottom-4 right-4 bg-teal-600/90 backdrop-blur border border-teal-500/30 p-3 rounded-2xl flex items-center gap-3 shadow-lg select-none text-white font-sans">
                <span className="text-xl">🎯</span>
                <div>
                  <span className="text-[8px] text-teal-150 font-bold uppercase tracking-wider block">Live Accuracy</span>
                  <span className="text-xs font-black">96% Form compliance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="how-it-works">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest bg-teal-50 border border-teal-200/50 px-3 py-1 rounded-full">Methodology</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">How PoseCare Works</h2>
          <p className="text-slate-500 text-sm">Follow a verified, AI-guided clinical roadmap designed to restore physical mobility safely.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Get Prescribed',
              desc: 'Doctors create tailored exercise routines specifically for your injury, such as leg fractures or shoulder rehab.',
              icon: '📋'
            },
            {
              step: '2',
              title: 'Live AI Tracking',
              desc: 'Perform exercises at home. Our computer vision ensures your joint angles are correct, preventing further injury.',
              icon: '👁️'
            },
            {
              step: '3',
              title: 'Track Progress',
              desc: "Your daily reps and form accuracy are logged directly to your doctor's dashboard for remote monitoring.",
              icon: '📈'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-teal-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center text-sm font-black text-slate-400">
                    {item.step}
                  </div>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}