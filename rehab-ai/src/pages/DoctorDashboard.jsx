import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, CV_API_URL } from '../config';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Real Data States
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSessions, setPatientSessions] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Prescription Form State (Mapped to sliders)
  const [formExercise, setFormExercise] = useState('Mini Squat');
  const [formReps, setFormReps] = useState(15);
  const [formSuccessAngle, setFormSuccessAngle] = useState(135);
  const [formFailureAngle, setFormFailureAngle] = useState(165);
  const [formHoldTime, setFormHoldTime] = useState(10);

  const [exerciseList, setExerciseList] = useState([
    'Bicep Curl', 'Push-up', 'Crunch',
    'Seated Knee Extension', 'Straight Leg Raise', 'Mini Squat',
    'Sit-to-Stand', 'Standing Knee Flexion', 'Standing Hip Abduction',
    'Standing Hip Flexion', 'Shoulder Flexion', 'Shoulder Abduction',
    'Wall Slides', 'Calf Raise', 'Marching in Place',
    'Single-Leg Balance', 'Bird Dog'
  ]);

  // Security & Data Fetching (Doctors only)
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

    const fetchExercises = async () => {
      try {
        const response = await fetch(`${CV_API_URL}/api/exercises`);
        if (response.ok) {
          const list = await response.json();
          if (list && list.length > 0) {
            setExerciseList(list);
          }
        }
      } catch (err) {
        console.warn("CV Service offline. Using fallback exercise catalog.");
      }
    };

    fetchPatients();
    fetchExercises();
  }, [navigate]);

  // Fetch Sessions & Prescription when Patient selection changes
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
            setFormExercise(ex.exerciseName || 'Mini Squat');
            setFormReps(ex.targetReps || 15);
            setFormSuccessAngle(ex.successAngle || 135);
            setFormFailureAngle(ex.failureAngle || 165);
            setFormHoldTime(ex.holdTime || 10);
          } else {
            handleExercisePreset('Mini Squat');
          }
        } else {
          setPrescription(null);
          handleExercisePreset('Mini Squat');
        }
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    };
    
    fetchPatientData();
  }, [selectedPatient]);

  // Exercise Presets Configuration
  const handleExercisePreset = async (name) => {
    setFormExercise(name);
    try {
      const res = await fetch(`${CV_API_URL}/api/exercises/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setFormSuccessAngle(data.target_value);
        setFormFailureAngle(data.rest_value);
        if (name === 'Crunch' || data.key === 'single_leg_balance' || data.key === 'bird_dog') {
          setFormHoldTime(2);
        } else {
          setFormHoldTime(10);
        }
        return;
      }
    } catch (err) {
      console.warn("CV Service offline, using local preset values for", name);
    }

    // Fallback/offline presets
    if (name === 'Bicep Curl') {
      setFormSuccessAngle(85);
      setFormFailureAngle(150);
      setFormHoldTime(0);
    } else if (name === 'Mini Squat') {
      setFormSuccessAngle(125);
      setFormFailureAngle(165);
      setFormHoldTime(10);
    } else {
      setFormSuccessAngle(135);
      setFormFailureAngle(165);
      setFormHoldTime(10);
    }
  };

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

  const handleSavePrescription = async () => {
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
      } else {
        throw new Error("Failed to save prescription");
      }
    } catch (err) {
      alert("Error saving prescription: " + err.message);
    }
  };

  if (!user) return null;

  const uniquePatients = [];
  const seenEmails = new Set();
  patients.forEach(p => {
    if (p.email && !seenEmails.has(p.email.toLowerCase())) {
      seenEmails.add(p.email.toLowerCase());
      uniquePatients.push(p);
    }
  });

  const filteredPatients = uniquePatients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Extract last completed angle for the selected patient
  const lastAngle = patientSessions.length > 0 ? `${patientSessions[0].max_angle_achieved}°` : '---';

  const getInitials = (name) => {
    if (!name) return 'DT';
    const parts = name.split(' ').filter(p => !p.toLowerCase().includes('dr'));
    if (parts.length === 0) return name.substring(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
  };
  const initials = getInitials(user.name);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      
      {/* COLUMN 1: LEFT SIDEBAR (Roster and Navigation Links) */}
      <div className="w-72 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shrink-0 border-r border-slate-850">
        
        {/* PoseCare Header logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-500/25">
            🩻
          </div>
          <span className="text-xl font-bold tracking-tight text-white">PoseCare</span>
        </div>

        {/* Navigation links block */}
        <div className="p-4 space-y-1 border-b border-slate-800">
          {[
            { name: 'Dashboard', icon: '📁' },
            { name: 'Patients', icon: '👤' },
            { name: 'Schedule', icon: '📅' },
            { name: 'Reports', icon: '📄' },
            { name: 'Settings', icon: '⚙️' },
            { name: 'Messages', icon: '💬' }
          ].map(lnk => {
            const isTabActive = activeTab === lnk.name;
            return (
              <div 
                key={lnk.name}
                onClick={() => setActiveTab(lnk.name)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all ${
                  isTabActive 
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' 
                    : 'hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span>{lnk.icon}</span>
                <span>{lnk.name}</span>
              </div>
            );
          })}
        </div>

        {/* My Patients Header */}
        <div className="p-5 pb-2 flex justify-between items-center">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">My Patients</span>
          <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">•••</span>
        </div>

        {/* Search input in sidebar */}
        <div className="px-4 mb-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-805 bg-slate-800 border border-slate-750 text-xs rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 font-medium"
            />
            <span className="absolute left-2.5 top-2.5 text-xs text-slate-500">🔍</span>
          </div>
        </div>

        {/* Patient list inside Column 1 */}
        <div className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {filteredPatients.map(p => {
            const isAssigned = p.assignedDoctorId === user.id;
            const isSelected = selectedPatient?._id === p._id;
            return (
              <div 
                key={p._id}
                onClick={() => setSelectedPatient(p)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected 
                    ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-600/10' 
                    : 'bg-slate-850/40 border-slate-800 hover:bg-slate-800/80 hover:text-slate-100 text-slate-400'
                }`}
              >
                {/* Profile Avatar Placeholder */}
                <div className="w-8 h-8 rounded-full bg-slate-750 flex items-center justify-center text-sm font-bold border border-slate-700/50 shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {p.name}
                  </h4>
                  <p className={`text-[10px] truncate ${isSelected ? 'text-teal-200' : 'text-slate-500'} capitalize`}>
                    {isAssigned ? 'Active' : 'New Connection'} • {p.focusArea?.replace('_', ' ') || 'Therapy'}
                  </p>
                </div>
              </div>
            );
          })}
          {filteredPatients.length === 0 && (
            <p className="text-center text-[11px] text-slate-600 py-6">No matching patients.</p>
          )}
        </div>
      </div>

      {/* COLUMN 2: CENTER CONTENT AREA (Patient details and graph analytics) */}
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
        
        {/* Top Header bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-3.5 flex justify-between items-center shrink-0">
          <div className="w-80 relative">
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-slate-100 border-none text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-400 font-medium"
            />
            <span className="absolute left-3 top-2 text-xs text-slate-400">🔍</span>
          </div>

          {/* Doctor Info profile dropdown */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 font-bold hover:text-slate-600 cursor-pointer">➕</span>
            <span className="text-sm text-slate-400 font-bold hover:text-slate-600 cursor-pointer relative">
              🔔
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </span>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-teal-550 bg-teal-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <span className="text-xs font-black text-slate-800">{user.name}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>
          </div>
        </div>

        {/* Content body wrapper */}
        {activeTab === 'Dashboard' && (
          selectedPatient ? (
            <div className="p-8 space-y-6 flex-1">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patients</h2>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button className="bg-slate-100 p-2 rounded-lg text-slate-700 shadow-sm text-xs font-bold">📋 Grid</button>
                <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold">🗒️ List</button>
              </div>
            </div>

            {/* John Doe card overview block */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 shrink-0">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{selectedPatient.name}</h3>
                    <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-teal-200/50">
                      Active Patient
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Male, 48 | ID: PT-12345</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold mb-0.5">Program</span>
                  <span className="font-extrabold text-slate-800 capitalize">{selectedPatient.focusArea?.replace('_', ' ') || 'Post-ACL Repair'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold mb-0.5">Therapist</span>
                  <span className="font-extrabold text-slate-800">{user.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold mb-0.5">Goal</span>
                  <span className="font-extrabold text-slate-800">Restore Mobility</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold mb-0.5">Last Updated</span>
                  <span className="font-extrabold text-slate-800 font-mono text-[10px]">Apr 19, 2023 11:33 PM</span>
                </div>
              </div>
            </div>

            {/* Filled Area Progress charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RehabLineChart 
                data={patientSessions} 
                title="Repetitions Over Time" 
                dataKey="reps_completed" 
                color="#0ea5e9" 
                tooltipLabel="Squats"
              />
              <RehabLineChart 
                data={patientSessions} 
                title="Joint Mobility Progress" 
                dataKey="max_angle_achieved" 
                color="#8b5cf6" 
                tooltipLabel="Knee Flexion"
              />
            </div>

            {/* Accept patient button if not assigned */}
            {selectedPatient.assignedDoctorId !== user.id && (
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-bold text-yellow-900 text-sm">Connection Request Pending</h4>
                  <p className="text-xs text-yellow-700 mt-0.5">Accept this patient connection to prescribe exercises and review analytics.</p>
                </div>
                <button 
                  onClick={handleAcceptPatient}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-yellow-600/10 transition-colors shrink-0"
                >
                  Accept Connection
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <span className="text-4xl">📁</span>
            <p className="font-medium text-slate-500">Select a patient from the roster to review analytics and prescribe exercises.</p>
          </div>
        )
      )}

      {/* Patients Page */}
      {activeTab === 'Patients' && (
        <div className="p-8 space-y-6 flex-1">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Directory</h2>
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-teal-600/10 transition-all">
              + Add New Patient
            </button>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Program</th>
                  <th className="py-4 px-6">Last Active</th>
                  <th className="py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {uniquePatients.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.assignedDoctorId === user.id 
                          ? 'bg-teal-50 border-teal-200 text-teal-700' 
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      }`}>
                        {p.assignedDoctorId === user.id ? 'Active Patient' : 'Pending Request'}
                      </span>
                    </td>
                    <td className="py-4 px-6 capitalize">{p.focusArea?.replace('_', ' ') || 'General Rehab'}</td>
                    <td className="py-4 px-6 text-slate-400">Apr 19, 2023 11:33 PM</td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => { setSelectedPatient(p); setActiveTab('Dashboard'); }}
                        className="text-teal-600 hover:text-teal-700 font-extrabold hover:underline"
                      >
                        View Analytics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Page */}
      {activeTab === 'Schedule' && (
        <div className="p-8 space-y-6 flex-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Therapy Schedule</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-slate-900 text-sm">Today's Schedule</h3>
                  <span className="text-xs text-slate-400 font-semibold">Apr 20, 2023</span>
                </div>
                
                <div className="space-y-4">
                  {[
                    { time: '09:00 AM', patient: 'Jane Doe', type: 'Upper Body Review', duration: '30 mins', status: 'Completed' },
                    { time: '11:30 AM', patient: 'Shivam', type: 'Biceps Curl Evaluation', duration: '45 mins', status: 'Pending' },
                    { time: '03:00 PM', patient: 'Vaibhav Mamgain', type: 'Initial Consultation', duration: '60 mins', status: 'Confirmed' }
                  ].map((appt, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-teal-600 font-bold bg-teal-50 px-2.5 py-1 rounded-lg">{appt.time}</span>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{appt.patient}</span>
                          <span className="text-[10px] text-slate-400">{appt.type} ({appt.duration})</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        appt.status === 'Completed' ? 'bg-slate-200 text-slate-700' :
                        appt.status === 'Confirmed' ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{appt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm mb-4">April 2023</h3>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium">
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === 20;
                  return (
                    <span key={day} className={`p-1.5 rounded-lg cursor-pointer ${
                      isToday ? 'bg-teal-600 text-white font-bold' : 'hover:bg-slate-100'
                    }`}>{day}</span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Page */}
      {activeTab === 'Reports' && (
        <div className="p-8 space-y-6 flex-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compliance Reports</h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm">Monthly Patient Summaries</h3>
              <button className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors">
                Generate All
              </button>
            </div>
            
            <div className="divide-y divide-slate-150">
              {[
                { name: 'Jane Doe', plan: 'Upper Body Prescr.', progress: '94%', count: '46 Sessions', status: 'Excellent' },
                { name: 'Shivam', plan: 'Bicep Curl 90 deg', progress: '85%', count: '12 Sessions', status: 'Good' },
                { name: 'Vaibhav Mamgain', plan: 'General Shoulder', progress: '10%', count: '1 Session', status: 'Needs Support' }
              ].map((rep, i) => (
                <div key={i} className="p-6 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">📄</div>
                    <div>
                      <span className="font-extrabold text-slate-900 block">{rep.name}</span>
                      <span className="text-[10px] text-slate-400">{rep.plan} • {rep.count}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Compliance</span>
                      <span className="font-extrabold text-slate-800 font-mono">{rep.progress}</span>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      rep.status === 'Excellent' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                      rep.status === 'Good' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>{rep.status}</span>
                    
                    <button className="text-teal-600 hover:text-teal-700 font-extrabold border border-teal-200/50 bg-teal-50 hover:bg-teal-100/50 px-3 py-1.5 rounded-lg">
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Page */}
      {activeTab === 'Settings' && (
        <div className="p-8 space-y-6 flex-1 max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinic Settings</h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm mb-4">Therapist Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Full Name</label>
                  <input type="text" defaultValue={user.name} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Specialization</label>
                  <input type="text" defaultValue="Physical Rehabilitation Specialist" className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-extrabold text-slate-900 text-sm mb-4">Notification Presets</h3>
              <div className="space-y-3">
                {[
                  'Email daily digest of patient session outcomes',
                  'Alert immediately if compliance falls below 70%',
                  'Weekly summary PDF dispatch to clinic email'
                ].map((pref, i) => (
                  <label key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked={i < 2} className="accent-teal-600 w-4 h-4 rounded" />
                    <span>{pref}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-6 flex justify-end">
              <button className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-teal-600/10 transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Page */}
      {activeTab === 'Messages' && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-slate-200">
              <input type="text" placeholder="Search chats..." className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium" />
            </div>
            
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {[
                { name: 'Jane Doe', excerpt: "Is my target angle looking okay, Doctor?", time: '2h ago', unread: true },
                { name: 'Shivam', excerpt: "Completed the biceps curl session.", time: '1d ago', unread: false },
                { name: 'Vaibhav Mamgain', excerpt: "I need to reschedule our checkup.", time: '2d ago', unread: false }
              ].map((chat, i) => (
                <div key={i} className="p-4 flex justify-between items-start hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {chat.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-900 text-xs block">{chat.name}</span>
                      <p className={`text-[10px] truncate mt-0.5 ${chat.unread ? 'text-slate-950 font-bold' : 'text-slate-400'}`}>{chat.excerpt}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] text-slate-400 font-mono">{chat.time}</span>
                    {chat.unread && <span className="w-2.5 h-2.5 bg-teal-500 rounded-full block mt-1 ml-auto"></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-slate-50 flex flex-col justify-between h-full">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">J</div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">Jane Doe</span>
                  <span className="text-[9px] text-teal-600 font-bold">Active Patients Group</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-end gap-3 max-w-md">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">J</div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none text-xs font-medium text-slate-700">
                  Hello Doctor, I finished the Squat repetitions but felt a bit of muscle tightness at the bottom. Is 125 degrees correct or should I do less?
                </div>
              </div>
              
              <div className="flex items-end gap-3 max-w-md ml-auto justify-end">
                <div className="bg-teal-600 text-white p-3 rounded-2xl rounded-br-none text-xs font-medium">
                  Hello Jane! Good work on the compliance. Since your joint stiffness is high, let's keep it at 110 degrees for the next few days. I have adjusted your prescription goal target on the dashboard. Let me know how it feels.
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <input type="text" placeholder="Type a message..." className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <button className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-teal-600/10 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* COLUMN 3: RIGHT PRESCRIPTION SIDEBAR */}
      {activeTab === 'Dashboard' && selectedPatient && (
        <div className="w-80 bg-white border-l border-slate-200 h-[calc(100vh-64px)] overflow-y-auto shrink-0 p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Prescription Plan</h3>
              <span className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">•••</span>
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Rehabilitation</p>

            <div className="space-y-5">
              
              {/* Exercise Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Exercise</label>
                <select 
                  value={formExercise} 
                  onChange={(e) => handleExercisePreset(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                >
                  {exerciseList.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Target Angle Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Target Angle:</span>
                  <span className="text-slate-800 font-black">{formSuccessAngle}°</span>
                </div>
                <input 
                  type="range"
                  min="30"
                  max="180"
                  step="5"
                  value={formSuccessAngle}
                  onChange={(e) => setFormSuccessAngle(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Goal Repetitions Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Goal Repetitions:</span>
                  <span className="text-slate-800 font-black">{formReps} Reps</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={formReps}
                  onChange={(e) => setFormReps(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Set Hold Timer Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Set Hold Timer:</span>
                  <span className="text-slate-800 font-black">{formHoldTime} Seconds</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={formHoldTime}
                  onChange={(e) => setFormHoldTime(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Progress Summary info */}
              <div className="border-t border-slate-100 pt-5 space-y-1 text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-1">Current Progress</span>
                <p className="text-slate-600 font-medium">Last peak angle achieved: <span className="font-extrabold text-slate-800 font-mono">{lastAngle}</span></p>
              </div>
            </div>
          </div>

          {/* Action Buttons at bottom of sidebar */}
          <div className="space-y-2 pt-6 border-t border-slate-100">
            <button 
              onClick={handleSavePrescription}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md shadow-teal-600/10 transition-colors"
            >
              Save Changes
            </button>
            <button 
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-3 rounded-xl text-xs transition-colors"
            >
              View Protocol
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// --- PREMIUM AREA GRADIENT PROGRESS CHART COMPONENT ---
function RehabLineChart({ data, title, dataKey, color, tooltipLabel }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-72 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
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
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    // Area path down to the baseline
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  }

  // Unique ID for the area gradient tag
  const gradId = `chartGrad-${dataKey}`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="mb-4 text-left">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0.00" />
            </linearGradient>
          </defs>

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

          {/* Filled Area Gradient */}
          {points.length > 1 && (
            <path d={areaD} fill={`url(#${gradId})`} />
          )}

          {/* Line Path */}
          {points.length > 1 && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={color} 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="drop-shadow-sm"
            />
          )}

          {/* Tooltip Overlay Card for the 2nd to last point (similar to John Doe Squats tooltip in mockup) */}
          {points.length > 3 && (
            <g>
              {/* Highlight helper vertical line on selected node */}
              <line 
                x1={points[points.length - 3].x} 
                y1={padding} 
                x2={points[points.length - 3].x} 
                y2={height - padding} 
                stroke="#cbd5e1" 
                strokeWidth="1" 
                strokeDasharray="2 2"
              />
              {/* Tooltip box */}
              <rect 
                x={points[points.length - 3].x - 50} 
                y={points[points.length - 3].y - 30} 
                width={100} 
                height={20} 
                rx="6" 
                fill="#ffffff" 
                stroke="#cbd5e1" 
                strokeWidth="1"
                className="shadow-sm"
              />
              <text 
                x={points[points.length - 3].x} 
                y={points[points.length - 3].y - 17} 
                fill="#0f172a" 
                fontSize="9" 
                fontWeight="black" 
                textAnchor="middle"
              >
                {tooltipLabel}: {points[points.length - 3].val}{dataKey === 'max_angle_achieved' ? '°' : ' reps'}
              </text>
            </g>
          )}

          {/* Value Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4.5" 
                fill="#ffffff" 
                stroke={color} 
                strokeWidth="3" 
                className="transition-all hover:r-6"
              />
              <text 
                x={p.x} 
                y={height - padding + 18} 
                fill="#94a3b8" 
                fontSize="9" 
                fontWeight="bold"
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