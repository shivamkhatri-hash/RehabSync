import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 pr-8">
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              Professional Physical Therapy, <span className="text-teal-600">Powered by AI.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with certified doctors, receive custom workout prescriptions, and ensure perfect form using your device's camera. Recovery made accessible for everyone.
            </p>
            <div className="flex space-x-4">
              <Link to="/auth" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-md font-bold text-lg shadow-sm transition-colors">
                Start Your Recovery
              </Link>
              <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-md font-bold text-lg shadow-sm transition-colors">
                Consult a Doctor
              </button>
            </div>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0 bg-teal-50 rounded-2xl p-8 border border-teal-100 flex items-center justify-center min-h-[300px]">
             {/* Placeholder for a realistic medical illustration or photo */}
             <p className="text-teal-600 font-medium">✨ Visual Placeholder: Patient doing clinical exercises ✨</p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="how-it-works">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How RehabSync Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-teal-600 text-xl font-bold">1</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Get Prescribed</h3>
            <p className="text-gray-600">Doctors create tailored exercise routines specifically for your injury, such as leg fractures or shoulder rehab.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-teal-600 text-xl font-bold">2</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live AI Tracking</h3>
            <p className="text-gray-600">Perform exercises at home. Our computer vision ensures your joint angles are correct, preventing further injury.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-teal-600 text-xl font-bold">3</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">Your daily reps and form accuracy are logged directly to your doctor's dashboard for remote monitoring.</p>
          </div>
        </div>
      </div>
    </div>
  );
}