import { Link, useNavigate } from 'react-router-dom';
import PoseCareLogo from './PoseCareLogo';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

/* Public orientation pages — only meaningful before signing in. */
const PUBLIC_NAV_LINKS = [
  { to: '/', label: 'Home', className: 'text-gray-600 hover:text-teal-600 font-medium' },
  { to: '/library', label: 'Exercise Library', className: 'text-gray-600 hover:text-teal-600 font-medium' },
  { to: '/for-doctors', label: 'For Doctors', className: 'text-gray-600 hover:text-teal-600 font-medium' },
  {
    to: '/accuracy-bench',
    label: '⚡ Accuracy Bench',
    className: 'text-cyan-700 hover:text-cyan-600 font-bold bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 text-xs',
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const { isDark } = useTheme();

  /* Signed-in users work inside their role portal, so the public links are
     hidden (display: none) and disabled (inert + aria-hidden, plus tabIndex
     -1 per link) rather than left as clickable dead ends. */
  const isAuthenticated = Boolean(token && user?.role);
  const publicNavState = {
    className: isAuthenticated ? 'hidden' : 'hidden md:flex space-x-8 items-center',
    'aria-hidden': isAuthenticated || undefined,
    inert: isAuthenticated || undefined,
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center cursor-pointer py-1" onClick={() => navigate('/')}>
            <PoseCareLogo size="md" variant="full" theme={isDark ? 'dark' : 'light'} />
          </div>

          {/* Center Links — hidden + disabled once a session exists */}
          <div {...publicNavState}>
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={link.className}
                tabIndex={isAuthenticated ? -1 : undefined}
                aria-disabled={isAuthenticated || undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          

          {/* Right Side Auth / Profile */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {token && user ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Hello, <span className="font-semibold text-gray-800">{user.name}</span></span>
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                      : user.role === 'doctor'
                      ? 'bg-teal-100 text-teal-700 border-teal-200'
                      : user.role === 'physiotherapist'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    if (user.role === 'admin') navigate('/admin');
                    else if (user.role === 'doctor') navigate('/doctor');
                    else if (user.role === 'physiotherapist') navigate('/physio');
                    else navigate('/patient');
                  }}
                  className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm"
                >
                  {user.role === 'admin' ? '⚡ Admin Portal' : user.role === 'doctor' ? '🩺 Doctor Portal' : user.role === 'physiotherapist' ? '🏋️‍♂️ Physio Portal' : '🏃 Patient Portal'}
                </button>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 font-medium">Logout</button>
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