import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real Data States
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSessions, setPatientSessions] = useState([]);
  const [prescription, setPrescription] = useState(null);
  
  // Prescription Form State
  const [formExercise, setFormExercise] = useState('Bicep Curl');
  const [formReps, setFormReps] = useState(15);
  const [formSuccessAngle, setFormSuccessAngle] = useState(160);
  const [formFailureAngle, setFormFailureAngle] = useState(90);
  const [formHoldTime, setFormHoldTime] = useState(0);

  // 1. Security & Data Fetching (Doctors only)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'doctor') {
      navigate('/');
      return;
    }
    setUser(storedUser);

    const fetchPatients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/patients`);
        const data = await response.json();
        setPatients(data);
        if (data.length > 0) setSelectedPatient(data[0]);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      }
    };
    fetchPatients();
  }, [navigate]);

  // 2. Fetch Sessions & Prescription when Patient selection changes
  useEffect(() => {
    if (!selectedPatient) return;
    
    const fetchPatientData = async () => {
      try {
        // Fetch sessions
        const resSessions = await fetch(`${API_URL}/api/sessions/patient/${selectedPatient._id}`);
        if (resSessions.ok) {
          const sessionsData = await resSessions.json();
          setPatientSessions(sessionsData);
        }
        
        // Fetch prescription
        const resPrescr = await fetch(`${API_URL}/api/prescriptions/patient/${selectedPatient._id}`);
        if (resPrescr.ok) {
          const prescrData = await resPrescr.json();
          setPrescription(prescrData);
          if (prescrData && prescrData.exercises && prescrData.exercises.length > 0) {
            const ex = prescrData.exercises[0];
            setFormExercise(ex.exerciseName || 'Bicep Curl');
            setFormReps(ex.targetReps || 15);
            setFormSuccessAngle(ex.successAngle || 160);
            setFormFailureAngle(ex.failureAngle || 90);
            setFormHoldTime(ex.holdTime || 0);
          } else {
            // Reset to default presets
            handleExercisePreset('Bicep Curl');
          }
        } else {
          setPrescription(null);
          handleExercisePreset('Bicep Curl');
        }
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    };
    
    fetchPatientData();
  }, [selectedPatient]);

  // 3. Exercise Presets Configuration
  const handleExercisePreset = (name) => {
    setFormExercise(name);
    if (name === 'Bicep Curl') {
      setFormReps(15);
      setFormSuccessAngle(160);
      setFormFailureAngle(90);
      setFormHoldTime(0);
    } else if (name === 'Push-up') {
      setFormReps(10);
      setFormSuccessAngle(160);
      setFormFailureAngle(80);
      setFormHoldTime(0);
    } else if (name === 'Crunch') {
      setFormReps(12);
      setFormSuccessAngle(110);
      setFormFailureAngle(60);
      setFormHoldTime(2); // Crunches are usually held
    }
  };

  // 4. Accept Patient Logic
  const handleAcceptPatient = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/patients/${selectedPatient._id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: user.id })
      });
      if (!response.ok) throw new Error('Failed to update patient');
      
      const updatedPatient = await response.json();
      setPatients(patients.map(p => p._id === updatedPatient._id ? updatedPatient : p));
      setSelectedPatient(updatedPatient);
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Save Prescription Logic
  const handleSavePrescription = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: user.id,
          patientId: selectedPatient._id,
          exercises: [{
            exerciseName: formExercise,
            targetReps: formReps,
            successAngle: formSuccessAngle,
            failureAngle: formFailureAngle,
            holdTime: formHoldTime
          }]
        })
      });
      if (response.ok) {
        const saved = await response.json();
        setPrescription(saved);
        alert("✅ Prescription updated successfully!");
        setActiveTab('overview');
      } else {
        throw new Error("Failed to save prescription");
      }
    } catch (err) {
      alert("Error saving prescription: " + err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar: Real Patient Roster */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] overflow-y-auto sticky top-16 shadow-sm">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">My Patients</h2>
          <p className="text-sm text-slate-500 mt-1">Review requests & progress</p>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {patients.map((p) => {
            const isAssigned = p.assignedDoctorId === user.id;
            return (
              <div 
                key={p._id} 
                onClick={() => setSelectedPatient(p)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPatient?._id === p._id 
                    ? 'border-teal-500 bg-teal-50/60 shadow-sm' 
                    : 'border-slate-100 bg-white hover:border-teal-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900">{p.name}</h3>
                  {!isAssigned && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full" title="Pending Approval">
                      New Request
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 capitalize">{p.focusArea?.replace('_', ' ')}</p>
              </div>
            );
          })}
          {patients.length === 0 && (
            <p className="text-center text-slate-400 mt-10">No patients registered yet.</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedPatient ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Patient Header Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">Patient Profile</span>
                <h1 className="text-3xl font-black text-slate-950 mt-2">{selectedPatient.name}</h1>
                <p className="text-slate-500 text-sm mt-1">Focus Area: <span className="font-semibold text-slate-700 capitalize">{selectedPatient.focusArea?.replace('_', ' ')}</span></p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{selectedPatient.email}</p>
              </div>
              
              {selectedPatient.assignedDoctorId === user.id ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold border border-green-200/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active Patient
                  </span>
                  {prescription ? (
                    <p className="text-xs text-slate-500">Assigned: <span className="font-semibold text-slate-700">{prescription.exercises[0]?.exerciseName}</span></p>
                  ) : (
                    <p className="text-xs text-rose-500 font-medium">No active prescription</p>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleAcceptPatient}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-teal-600/10"
                >
                  Accept Patient Connection
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-6 border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === 'overview' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Overview & Analytics
                {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('prescription')}
                className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === 'prescription' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Manage Prescription
                {activeTab === 'prescription' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full"></span>}
              </button>
            </div>

            {/* View: Overview & Analytics */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* SVG Progress Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RehabLineChart 
                    data={patientSessions} 
                    title="Repetitions Completed" 
                    dataKey="reps_completed" 
                    color="#0d9488" 
                  />
                  <RehabLineChart 
                    data={patientSessions} 
                    title="Maximum Angle Achieved (°)" 
                    dataKey="max_angle_achieved" 
                    color="#8b5cf6" 
                  />
                </div>

                {/* Session Log Table */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">All Workout Sessions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Exercise</th>
                          <th className="py-4 px-6">Game Mode</th>
                          <th className="py-4 px-6 text-center">Reps</th>
                          <th className="py-4 px-6 text-center">Peak Angle</th>
                          <th className="py-4 px-6 text-center">Avg Hold (s)</th>
                          <th className="py-4 px-6 text-center">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {patientSessions.map((session) => (
                          <tr key={session._id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-4 px-6 font-medium text-slate-900">{new Date(session.date).toLocaleDateString()}</td>
                            <td className="py-4 px-6 font-semibold">{session.exerciseName}</td>
                            <td className="py-4 px-6">
                              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-medium">
                                {session.gamePlayed}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-teal-600">{session.reps_completed}</td>
                            <td className="py-4 px-6 text-center font-mono">{session.max_angle_achieved}°</td>
                            <td className="py-4 px-6 text-center">{session.hold_time_achieved || 0}s</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                (session.success_rate || 100) >= 80 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {session.success_rate || 100}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {patientSessions.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-10 text-center text-slate-400">
                              No sessions completed by this patient yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* View: Manage Prescription */}
            {activeTab === 'prescription' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-2xl">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Prescribe Motion Plan</h3>
                
                <form onSubmit={handleSavePrescription} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Exercise</label>
                    <select 
                      value={formExercise} 
                      onChange={(e) => handleExercisePreset(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      <option value="Bicep Curl">Bicep Curl (Elbow Flexion)</option>
                      <option value="Push-up">Push-up (Upper Body Core)</option>
                      <option value="Crunch">Crunch (Abdominals/Trunk)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Repetitions</label>
                      <input 
                        type="number" 
                        value={formReps} 
                        onChange={(e) => setFormReps(parseInt(e.target.value) || 0)}
                        min="1" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Required Hold Duration (seconds)</label>
                      <input 
                        type="number" 
                        value={formHoldTime} 
                        onChange={(e) => setFormHoldTime(parseInt(e.target.value) || 0)}
                        min="0" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Success Goal Angle (°)</label>
                      <input 
                        type="number" 
                        value={formSuccessAngle} 
                        onChange={(e) => setFormSuccessAngle(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                        required 
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Angle to successfully log hold/rep.</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Neutral/Reset Angle (°)</label>
                      <input 
                        type="number" 
                        value={formFailureAngle} 
                        onChange={(e) => setFormFailureAngle(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                        required 
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Reset threshold to start next repetition.</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <span className="text-teal-600 mt-0.5 text-base">💡</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Customizing success angles and holds is key for joint mobility therapy. For severe ranges, set smaller angles (e.g., success angle 130° for curls) to let the patient play comfortably and step up goals gradually.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold shadow-md shadow-teal-600/10 transition-colors"
                  >
                    Save & Assign Prescription
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[calc(100vh-128px)] flex flex-col items-center justify-center text-slate-400 gap-2">
            <span className="text-4xl">📁</span>
            <p className="font-medium text-slate-500">Select a patient from the roster to review analytics and prescribe exercises.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- HELPER COMPONENT: CUSTOM REACT SVG LINE GRAPH ---
function RehabLineChart({ data, title, dataKey, color }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-72 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
        <span className="text-2xl opacity-60">📊</span>
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">{title}</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">No session records. Charts will render once patient completes tracking.</p>
      </div>
    );
  }

  // Show last 7 sessions in chronological order
  const chartData = [...data].slice(0, 7).reverse();
  const values = chartData.map(d => d[dataKey] || 0);
  const maxVal = Math.max(...values, 10) * 1.15; // padding top
  
  const width = 500;
  const height = 220;
  const padding = 40;
  
  const points = chartData.map((d, index) => {
    const x = padding + (index / Math.max(chartData.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((d[dataKey] || 0) / maxVal) * (height - 2 * padding);
    return { 
      x, 
      y, 
      val: d[dataKey] || 0, 
      date: new Date(d.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) 
    };
  });

  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * (height - 2 * padding);
            const val = Math.round(maxVal - ratio * maxVal);
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={padding - 10} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" className="font-mono">{val}</text>
              </g>
            );
          })}

          {/* Line Path */}
          {points.length > 1 && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={color} 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="drop-shadow-sm"
            />
          )}

          {/* Value Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="6" 
                fill="#ffffff" 
                stroke={color} 
                strokeWidth="4" 
                className="transition-all hover:r-8"
              />
              <text 
                x={p.x} 
                y={p.y - 12} 
                fill="#0f172a" 
                fontSize="10" 
                fontWeight="black" 
                textAnchor="middle"
                className="font-mono bg-white"
              >
                {p.val}
              </text>
              <text 
                x={p.x} 
                y={height - padding + 18} 
                fill="#64748b" 
                fontSize="10" 
                fontWeight="medium"
                textAnchor="middle"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}