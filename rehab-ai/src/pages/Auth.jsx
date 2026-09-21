import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import PoseCareLogo from '../components/PoseCareLogo';

export default function Auth() {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [step, setStep] = useState(1); // Login step: 1 (Password), 2 (First-time OTP)
  const [forgotStep, setForgotStep] = useState(1); // Forgot step: 1 (Request OTP), 2 (Reset Password)
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [focusArea, setFocusArea] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const navigate = useNavigate();

  const clearAlerts = () => {
    setFeedbackMessage(null);
    setErrorMessage(null);
  };

  const handleRoleNavigation = (userObj) => {
    if (userObj.role === 'admin') {
      navigate('/admin');
    } else if (userObj.role === 'doctor') {
      navigate('/doctor');
    } else if (userObj.role === 'physiotherapist') {
      navigate('/physio');
    } else {
      navigate('/patient');
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, focusArea, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      
      setFeedbackMessage('Registration successful! Please sign in with your credentials.');
      setView('login');
      setStep(1);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      
      if (data.requiresOtp) {
        setStep(2);
        setFeedbackMessage('🔑 First-time verification code (OTP) sent to your email.');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        handleRoleNavigation(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification on First Login
  const verifyOtp = async (e) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      handleRoleNavigation(data.user);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Step 1: Request Reset OTP
  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setFeedbackMessage('A 6-digit password reset code has been dispatched to your email.');
      setForgotStep(2);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Step 2: Verify OTP and Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setFeedbackMessage('Password successfully updated! Please log in with your new password.');
      setView('login');
      setStep(1);
      setForgotStep(1);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4 cursor-pointer" onClick={() => navigate('/')}>
          <PoseCareLogo size="lg" variant="full" />
        </div>
        <h2 className="mt-2 text-center text-2xl font-black text-slate-900 tracking-tight">
          {view === 'login' && 'Sign in to your account'}
          {view === 'register' && 'Create your PoseCare account'}
          {view === 'forgot' && 'Reset your password'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {view === 'login' && 'Enter your credentials to access your rehabilitation portal'}
          {view === 'register' && 'Join PoseCare for AI-guided physical therapy and tracking'}
          {view === 'forgot' && 'Follow the steps below to securely restore your access'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          
          {/* Feedback & Error Alerts */}
          {feedbackMessage && (
            <div className="mb-5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
              <span>✅</span> {feedbackMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {errorMessage}
            </div>
          )}

          {/* ==================== 1. LOGIN VIEW ==================== */}
          {view === 'login' && step === 1 && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Email address</label>
                <div className="mt-1">
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot'); setForgotStep(1); clearAlerts(); }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="mt-1">
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-600/10 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Quick Demo Role Logins */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center mb-2">
                  ⚡ Quick Demo Login Credentials
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEmail('dctor1@test.com'); setPassword('doctor123'); clearAlerts(); }}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <span>🩺 Doctor</span>
                    <span className="text-[9px] text-blue-500 font-mono">dctor1@test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('physio@test.com'); setPassword('physio123'); clearAlerts(); }}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <span>🏃 Physio</span>
                    <span className="text-[9px] text-purple-500 font-mono">physio@test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('admin@rehab.com'); setPassword('admin123'); clearAlerts(); }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <span>⚙️ Admin</span>
                    <span className="text-[9px] text-slate-500 font-mono">admin@rehab</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==================== 2. FIRST-TIME OTP VIEW ==================== */}
          {view === 'login' && step === 2 && (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-teal-700">First-Time Email Verification (OTP)</label>
                <p className="text-xs text-slate-500 mt-1 mb-3">Please enter the 6-digit verification code sent to <strong>{email}</strong> to activate your account.</p>
                <div className="mt-1">
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="appearance-none block w-full px-3 py-3 text-center text-2xl font-black tracking-[0.4em] border border-slate-300 rounded-xl shadow-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
              >
                Back to Password Sign In
              </button>
            </form>
          )}

          {/* ==================== 3. FORGOT PASSWORD VIEW ==================== */}
          {view === 'forgot' && forgotStep === 1 && (
            <form onSubmit={handleRequestForgotOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Registered Email Address</label>
                <p className="text-xs text-slate-500 mt-1 mb-2">We will send a 6-digit verification code to this address.</p>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50 shadow-md shadow-teal-600/10"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>

              <button 
                type="button" 
                onClick={() => { setView('login'); setStep(1); clearAlerts(); }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD - STEP 2 (ENTER OTP & NEW PASSWORD) */}
          {view === 'forgot' && forgotStep === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">6-Digit Verification Code</label>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="mt-1 block w-full px-3 py-2.5 text-center text-xl font-black tracking-widest border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">New Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Confirm New Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50 mt-2 shadow-md shadow-teal-600/10"
              >
                {loading ? 'Resetting Password...' : 'Save New Password & Sign In'}
              </button>

              <button 
                type="button" 
                onClick={() => setForgotStep(1)} 
                className="w-full flex justify-center py-2 px-4 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Re-enter Email / Request New Code
              </button>
            </form>
          )}

          {/* ==================== 4. REGISTER VIEW ==================== */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Account Role (RBAC)</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="patient">Patient (Daily Routine & AI Bio-feedback)</option>
                  <option value="physiotherapist">Physiotherapist (Exercise Planning & Allowances)</option>
                  <option value="doctor">Doctor / Clinician (Medical Prescriptions & Restrictions)</option>
                  <option value="admin">Administrator (System Governance & RBAC)</option>
                </select>
                {(role === 'doctor' || role === 'physiotherapist') && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 leading-relaxed">
                    🔒 <strong>Clinician Verification Required:</strong> New {role} registrations require approval by a system administrator before portal access is granted.
                  </p>
                )}
              </div>

              {role === 'patient' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Rehabilitation Focus</label>
                  <select 
                    value={focusArea} 
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="general">General Physical Recovery</option>
                    <option value="upper_body">Upper Body (Shoulders & Elbows)</option>
                    <option value="core">Core & Spine Alignment</option>
                    <option value="lower_body">Lower Body (Hips, Knees & Ankles)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-600/10 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all mt-4 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* View Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {view !== 'forgot' ? (
              <button 
                onClick={() => { setView(view === 'login' ? 'register' : 'login'); setStep(1); clearAlerts(); }} 
                className="text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                {view === 'login' ? "Don't have an account? Sign up for PoseCare" : "Already have an account? Sign in"}
              </button>
            ) : (
              <button 
                onClick={() => { setView('login'); setStep(1); clearAlerts(); }} 
                className="text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                Remember your password? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}