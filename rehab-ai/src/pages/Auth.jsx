import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Auth() {
  const [view, setView] = useState('login'); // 'login' or 'register'
  const [step, setStep] = useState(1); // 1: Email, 2: OTP (Commented out in logic)
  
  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Added password field
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [focusArea, setFocusArea] = useState('general');
  
  const navigate = useNavigate();

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, focusArea, password }) // Added password
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('Registration successful! Please log in with your email and password.');
      setView('login');
      setStep(1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate(data.user.role === 'doctor' ? '/doctor' : '/scanner');
    } catch (err) {
      alert(err.message);
    }
  };

  /*
  // Commented out OTP Step 1: Request OTP
  const requestOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setStep(2); // Move to OTP input view
      alert('OTP sent! Please check your email inbox.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Commented out OTP Step 2: Verify OTP and Login
  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate(data.user.role === 'doctor' ? '/doctor' : '/scanner');
    } catch (err) {
      alert(err.message);
    }
  };
  */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {view === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          
          {/* LOGIN VIEW (PASSWORD-BASED) */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>

              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none">
                Sign In
              </button>
            </form>
          )}

          {/* OTP VIEWS RETAINED AND COMMENTED OUT IN JAVASCRIPT LOGIC ABOVE */}
          {/* For visual preservation, original OTP inputs are not rendered, but standard password login is loaded instead */}

          {/* REGISTER VIEW */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">I am a...</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              {role === 'patient' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rehabilitation Focus</label>
                  <select value={focusArea} onChange={(e) => setFocusArea(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                    <option value="general">General Recovery</option>
                    <option value="upper_body">Upper Body (Shoulders/Arms)</option>
                    <option value="core">Core & Back</option>
                    <option value="lower_body">Lower Body (Legs/Knees)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 mt-6">
                Create Account
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => { setView(view === 'login' ? 'register' : 'login'); setStep(1); }} className="text-sm font-medium text-teal-600 hover:text-teal-500">
              {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}