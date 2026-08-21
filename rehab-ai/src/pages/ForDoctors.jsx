export default function ForDoctors() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Empower Your Practice with AI</h1>
        <p className="text-xl text-gray-600 mb-8">
          Monitor your patients' rehab progress remotely with pinpoint accuracy. Our computer vision tracks joint angles and compliance daily.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80" 
          alt="Doctor reviewing data" 
          className="rounded-2xl shadow-lg border border-gray-200 object-cover h-96 w-full"
        />
      </div>
    </div>
  );
}