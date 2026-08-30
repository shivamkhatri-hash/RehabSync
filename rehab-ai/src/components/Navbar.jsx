import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-teal-600 text-2xl font-bold tracking-tight">Pose</span>
            <span className="text-gray-800 text-2xl font-bold tracking-tight">Care</span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-teal-600 font-medium">Home</Link>
            <Link to="/library" className="text-gray-600 hover:text-teal-600 font-medium">Exercise Library</Link>
            <Link to="/for-doctors" className="text-gray-600 hover:text-teal-600 font-medium">For Doctors</Link>
          </div>

          

          {/* Right Side Auth / Profile */}
          <div className="flex items-center space-x-4">
            {token && user ? (
              <>
                <span className="text-gray-600 text-sm">Hello, <span className="font-semibold text-gray-800">{user.name}</span></span>
                <button 
                  onClick={() => navigate(user.role === 'doctor' ? '/doctor' : '/scanner')}
                  className="text-teal-600 font-medium hover:text-teal-700"
                >
                  Dashboard
                </button>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">Logout</button>
              </>
            ) : (
              <Link to="/auth" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-md font-medium transition-colors">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}