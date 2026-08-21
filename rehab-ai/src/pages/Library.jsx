export default function Library() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Exercise Library</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* We will map real exercises here later */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Bicep Curl</h3>
            <p className="text-gray-600 mt-2">Target: Upper Body</p>
            <span className="inline-block mt-4 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">AI Tracked</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Push-up</h3>
            <p className="text-gray-600 mt-2">Target: Core & Upper Body</p>
            <span className="inline-block mt-4 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">AI Tracked</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Crunches</h3>
            <p className="text-gray-600 mt-2">Target: Core</p>
            <span className="inline-block mt-4 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">AI Tracked</span>
          </div>
        </div>
      </div>
    </div>
  );
}