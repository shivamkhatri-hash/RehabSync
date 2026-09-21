import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import ExerciseTutorialModal from '../components/ExerciseTutorialModal';
import AnatomicalJointViewer from '../components/AnatomicalJointViewer';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' }
];

export default function PhysioDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorPrescription, setDoctorPrescription] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planVersions, setPlanVersions] = useState([]);
  const [patientSessions, setPatientSessions] = useState([]);
  const [catalogExercises, setCatalogExercises] = useState([]);

  // Active Tab: 'planning' | 'prescription' | 'logs' | 'versions'
  const [activeTab, setActiveTab] = useState('planning');

  // Exercise Plan Form State
  const [planAssignments, setPlanAssignments] = useState([]);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Video Tutorial Modal
  const [previewTutorialEx, setPreviewTutorialEx] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!storedUser || !token || (storedUser.role !== 'physiotherapist' && storedUser.role !== 'admin')) {
      navigate('/auth');
      return;
    }
    setUser(storedUser);

    loadPatients();
    loadCatalogExercises();
  }, [navigate]);

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0 && !selectedPatient) {
          selectPatient(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const loadCatalogExercises = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exercises`);
      if (res.ok) {
        const data = await res.json();
        setCatalogExercises(data);
      }
    } catch (err) {
      console.error('Failed to load exercise catalog:', err);
    }
  };

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setFeedbackMessage(null);
    setErrorMessage(null);

    const token = localStorage.getItem('token');

    // 1. Fetch Doctor's Medical Prescription (Read-Only)
    try {
      const prescRes = await fetch(`${API_URL}/api/prescriptions/patient/${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prescRes.ok) {
        const pData = await prescRes.json();
        setDoctorPrescription(pData);
      } else {
        setDoctorPrescription(null);
      }
    } catch (err) {
      console.error('Failed to fetch doctor prescription:', err);
    }

    // 2. Fetch Physiotherapist Exercise Plan & Past Versions
    try {
      const planRes = await fetch(`${API_URL}/api/plans/patient/${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (planRes.ok) {
        const pData = await planRes.json();
        setCurrentPlan(pData.currentPlan);
        setPlanVersions(pData.allVersions || []);

        if (pData.currentPlan && pData.currentPlan.assignments) {
          setPlanAssignments(JSON.parse(JSON.stringify(pData.currentPlan.assignments)));
          setRevisionNotes(`Week ${(pData.currentPlan.version || 1) + 1} progression revision`);
        } else {
          // Default initial exercise assignment template
          setPlanAssignments([
            {
              assignmentId: `asgn_${Math.random().toString(36).substr(2, 9)}`,
              exerciseName: 'Bicep Curl (Standing)',
              type: 'reps',
              sets: 2,
              reps: 10,
              holdDurationSec: 0,
              sessionsPerDay: 1,
              daysOfWeek: [1, 2, 3, 4, 5],
              restBetweenSetsSec: 45,
              notes: 'Focus on horizontal upper-arm placement at 90°.'
            }
          ]);
          setRevisionNotes('Initial individualized exercise plan');
        }
      }
    } catch (err) {
      console.error('Failed to fetch exercise plan:', err);
    }

    // 3. Fetch Patient Session Logs & Discomfort Reports
    try {
      const sessRes = await fetch(`${API_URL}/api/sessions/patient/${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sessRes.ok) {
        const sData = await sessRes.json();
        setPatientSessions(sData);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  // Add new exercise assignment card
  const handleAddAssignment = () => {
    const defaultName = catalogExercises.length > 0 ? catalogExercises[0].name : 'Bicep Curl (Standing)';
    const newAsgn = {
      assignmentId: `asgn_${Math.random().toString(36).substr(2, 9)}`,
      exerciseName: defaultName,
      type: 'reps',
      sets: 2,
      reps: 10,
      holdDurationSec: 0,
      sessionsPerDay: 1,
      daysOfWeek: [1, 2, 3, 4, 5],
      restBetweenSetsSec: 45,
      notes: ''
    };
    setPlanAssignments([...planAssignments, newAsgn]);
  };

  // Remove assignment
  const handleRemoveAssignment = (index) => {
    setPlanAssignments(planAssignments.filter((_, idx) => idx !== index));
  };

  // Update assignment field
  const handleUpdateAssignment = (index, field, value) => {
    const updated = [...planAssignments];
    updated[index][field] = value;
    setPlanAssignments(updated);
  };

  // Toggle day of week for an assignment
  const handleToggleDay = (asgnIndex, dayId) => {
    const updated = [...planAssignments];
    const currentDays = updated[asgnIndex].daysOfWeek || [];
    if (currentDays.includes(dayId)) {
      updated[asgnIndex].daysOfWeek = currentDays.filter(d => d !== dayId);
    } else {
      updated[asgnIndex].daysOfWeek = [...currentDays, dayId];
    }
    setPlanAssignments(updated);
  };

  // Save new plan version
  const handleSavePlan = async () => {
    if (!selectedPatient) return;
    if (planAssignments.length === 0) {
      setErrorMessage('Please add at least one exercise assignment to the plan.');
      return;
    }

    setSavingPlan(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          prescriptionId: doctorPrescription?._id || null,
          effectiveDate,
          revisionNotes,
          assignments: planAssignments
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save exercise plan');

      setFeedbackMessage(`✅ Plan calibrated & deployed! Patient's daily goals and camera routines are now live.`);
      // Refresh current plan and versions
      selectPatient(selectedPatient);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // Import doctor prescribed exercises directly into the calibration builder
  const handleImportDoctorExercises = () => {
    if (!doctorPrescription || !doctorPrescription.exercises || doctorPrescription.exercises.length === 0) {
      setErrorMessage('No doctor exercises found to import.');
      return;
    }

    const imported = doctorPrescription.exercises.map((ex) => ({
      assignmentId: `asgn_${Math.random().toString(36).substr(2, 9)}`,
      exerciseName: ex.exerciseName,
      type: ex.holdTime > 0 ? 'hold' : 'reps',
      sets: 2,
      reps: ex.targetReps || 10,
      holdDurationSec: ex.holdTime || 0,
      sessionsPerDay: 1,
      daysOfWeek: [1, 2, 3, 4, 5],
      restBetweenSetsSec: 45,
      notes: `Doctor Target: ${ex.successAngle}° angle | Side: ${ex.side || 'both'}`
    }));

    setPlanAssignments(imported);
    setActiveTab('planning');
    setFeedbackMessage(`📥 Imported ${imported.length} doctor-prescribed exercises into your calibration builder! Review parameters and click Save Plan to deploy to patient.`);
  };

  // Direct 1-Click Verification of Doctor Prescription
  const handleVerifyPrescriptionOnly = async () => {
    if (!selectedPatient) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/prescriptions/patient/${selectedPatient._id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to verify prescription');
      setFeedbackMessage('✅ Doctor Prescription successfully verified and cleared for physiotherapy plan execution!');
      selectPatient(selectedPatient);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
              🏋️‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full border border-emerald-300">
                  Physiotherapist Clinical Portal
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Active License</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Welcome, {user?.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Design individualized daily exercise allowances, schedule weekly plans, and monitor biomechanical adherence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5"
            >
              📚 Clinical Exercise Library
            </button>
          </div>
        </div>

        {/* Main Grid: Patient List (Left) + Detailed Care Workspace (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Col 4): Patient Roster */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Assigned Patients ({patients.length})
              </h2>
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
              {patients.map((p) => {
                const isSelected = selectedPatient?._id === p._id;
                return (
                  <div
                    key={p._id}
                    onClick={() => selectPatient(p)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{p.name}</h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.email}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {p.focusArea || 'General'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Attending Dr: <strong className="text-slate-700">{p.assignedDoctorId?.name || 'Unassigned'}</strong></span>
                      <span className="text-emerald-700 font-extrabold">Open Plan &rarr;</span>
                    </div>
                  </div>
                );
              })}

              {patients.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No patients assigned yet. Contact your administrator or register a new patient.
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Col 8): Patient Exercise Planning Workspace */}
          <div className="lg:col-span-8 space-y-6">
            
            {selectedPatient ? (
              <>
                {/* Active Patient Summary Bar */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Patient</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-1">{selectedPatient.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Focus Area: <span className="font-bold text-emerald-700 capitalize">{selectedPatient.focusArea}</span> • Timezone: <span className="font-mono">{selectedPatient.timezone || 'UTC'}</span>
                    </p>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200/80">
                    <button
                      onClick={() => setActiveTab('planning')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'planning'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🏋️‍♂️ Exercise Plan
                    </button>
                    <button
                      onClick={() => setActiveTab('prescription')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'prescription'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🩺 Doctor Prescription
                    </button>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'logs'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📊 Adherence & Discomfort
                    </button>
                    <button
                      onClick={() => setActiveTab('versions')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'versions'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📜 Version History ({planVersions.length})
                    </button>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {feedbackMessage && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold animate-fadeIn">
                    {feedbackMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold animate-fadeIn">
                    {errorMessage}
                  </div>
                )}

                {/* TAB 1: EXERCISE PLAN BUILDER */}
                {activeTab === 'planning' && (
                  <div className="space-y-6">
                    
                    {/* Doctor's Constraints Banner (Read-only reminder) */}
                    {doctorPrescription && (
                      <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl flex items-start gap-3 text-xs">
                        <span className="text-xl shrink-0">🩺</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-teal-900">Doctor's Medical Diagnosis:</span>
                            <span className="font-bold text-teal-700">{doctorPrescription.diagnosis}</span>
                          </div>
                          <p className="text-[11px] text-teal-800 mt-1 leading-relaxed">
                            <strong>Restrictions:</strong> {doctorPrescription.restrictions} | <strong>Precautions:</strong> {doctorPrescription.precautions}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Plan Configuration Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Individualized Exercise Plan — Version {(currentPlan?.version || 0) + 1}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Set target sets, reps or hold time, sessions per day, and active days. Progress is enforced per patient.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddAssignment}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-2xs"
                        >
                          ➕ Add Exercise Assignment
                        </button>
                      </div>

                      {/* Revision Meta */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Effective Start Date
                          </label>
                          <input
                            type="date"
                            value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Clinical Revision Notes (Preserved in History)
                          </label>
                          <input
                            type="text"
                            value={revisionNotes}
                            onChange={(e) => setRevisionNotes(e.target.value)}
                            placeholder="e.g., Week 2: Increasing sets to 3 and adding 5s hold"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Exercise Assignments List */}
                      <div className="space-y-4">
                        {planAssignments.map((asgn, idx) => {
                          const isHold = asgn.type === 'hold';
                          const dailyWorkUnit = isHold ? 's total hold' : 'total reps';
                          const dailyAllowance = (isHold ? asgn.holdDurationSec : asgn.reps) * asgn.sets * asgn.sessionsPerDay;

                          return (
                            <div
                              key={asgn.assignmentId || idx}
                              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 transition-all hover:border-slate-300"
                            >
                              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <select
                                    value={asgn.exerciseName}
                                    onChange={(e) => handleUpdateAssignment(idx, 'exerciseName', e.target.value)}
                                    className="font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  >
                                    {catalogExercises.map(ex => (
                                      <option key={ex.name} value={ex.name}>{ex.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewTutorialEx(asgn.exerciseName)}
                                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold"
                                  >
                                    🎬 Preview Tutorial
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(idx)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold"
                                  >
                                    🗑 Remove
                                  </button>
                                </div>
                              </div>

                              {/* Parameters Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Type</label>
                                  <select
                                    value={asgn.type}
                                    onChange={(e) => handleUpdateAssignment(idx, 'type', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                                  >
                                    <option value="reps">Repetition-based</option>
                                    <option value="hold">Hold / Isometric</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Prescribed Sets</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={asgn.sets}
                                    onChange={(e) => handleUpdateAssignment(idx, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                    {isHold ? 'Hold Duration (sec)' : 'Reps per Set'}
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={isHold ? asgn.holdDurationSec : asgn.reps}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      if (isHold) handleUpdateAssignment(idx, 'holdDurationSec', val);
                                      else handleUpdateAssignment(idx, 'reps', val);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Sessions / Day</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={asgn.sessionsPerDay}
                                    onChange={(e) => handleUpdateAssignment(idx, 'sessionsPerDay', Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Rest Between Sets</label>
                                  <input
                                    type="number"
                                    min="10"
                                    max="180"
                                    value={asgn.restBetweenSetsSec}
                                    onChange={(e) => handleUpdateAssignment(idx, 'restBetweenSetsSec', Math.max(10, parseInt(e.target.value) || 30))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                                  />
                                </div>
                              </div>

                              {/* Scheduled Days of Week Selection */}
                              <div className="space-y-1.5 pt-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                  Scheduled Days of Week
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {DAYS_OF_WEEK.map((d) => {
                                    const isScheduled = asgn.daysOfWeek?.includes(d.id);
                                    return (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => handleToggleDay(idx, d.id)}
                                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border ${
                                          isScheduled
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {d.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Daily Allowance Live Calculation Badge */}
                              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-900">
                                  Daily Prescribed Allowance:
                                </span>
                                <span className="font-mono font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                  {asgn.sets} sets × {isHold ? `${asgn.holdDurationSec}s` : `${asgn.reps} reps`} × {asgn.sessionsPerDay} session(s) = {dailyAllowance} {dailyWorkUnit}
                                </span>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={asgn.notes}
                                  onChange={(e) => handleUpdateAssignment(idx, 'notes', e.target.value)}
                                  placeholder="Clinical cues (e.g. Stop if pain occurs, keep shoulder locked)"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700"
                                />
                              </div>

                            </div>
                          );
                        })}

                        {planAssignments.length === 0 && (
                          <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs">
                            No exercises currently in this plan. Click <strong>➕ Add Exercise Assignment</strong> to build the plan.
                          </div>
                        )}
                      </div>

                      {/* Deploy Plan CTA */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] text-slate-400">
                          Saving this plan archives current assignments and rolls out Version {(currentPlan?.version || 0) + 1} with historical integrity.
                        </p>

                        <button
                          type="button"
                          disabled={savingPlan}
                          onClick={handleSavePlan}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingPlan ? 'Deploying Plan...' : '💾 Deploy New Plan Version'}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 2: DOCTOR PRESCRIPTION VIEW (READ-ONLY) */}
                {activeTab === 'prescription' && (
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Physician Controlled Protocol
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          Doctor's Rehabilitation Prescription & Restrictions
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Only the attending physician can modify this prescription. Physiotherapists formulate exercise assignments within these recorded bounds.
                        </p>
                      </div>
                    </div>

                    {/* Anatomical Visualizer */}
                    <div className="w-full">
                      <AnatomicalJointViewer 
                        jointType={selectedPatient.focusArea?.includes('shoulder') ? 'shoulder' : selectedPatient.focusArea?.includes('hip') ? 'hip' : 'knee'}
                        label={selectedPatient.focusArea?.includes('shoulder') ? 'Shoulder Glenohumeral Articulation' : 'Knee Joint & Ligament Complex'}
                        subLabel={doctorPrescription?.diagnosis || 'Physician Directive'}
                        romValue={doctorPrescription?.exercises?.[0]?.successAngle || 125}
                        compact={true}
                      />
                    </div>

                    {doctorPrescription ? (
                      <div className="space-y-4 text-xs">
                        {/* Clinical Approval & Verification Status Banner */}
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                          doctorPrescription.status === 'Pending Physio Review'
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                            : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {doctorPrescription.status === 'Pending Physio Review' ? '⏳' : '✅'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  doctorPrescription.status === 'Pending Physio Review'
                                    ? 'bg-amber-200 text-amber-900 border border-amber-400'
                                    : 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                                }`}>
                                  {doctorPrescription.status || 'Pending Physio Review'}
                                </span>
                                <span className="font-bold text-xs">
                                  {doctorPrescription.status === 'Pending Physio Review'
                                    ? 'Awaiting Your Calibration & Verification'
                                    : 'Verified by Physiotherapist & Active'}
                                </span>
                              </div>
                              <p className="text-[11px] opacity-80 mt-0.5">
                                {doctorPrescription.status === 'Pending Physio Review'
                                  ? 'Patient cannot start uncalibrated exercises directly until you verify or deploy their weekly plan.'
                                  : 'Prescription calibrated and integrated into patient daily goals.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            {doctorPrescription.exercises && doctorPrescription.exercises.length > 0 && (
                              <button
                                type="button"
                                onClick={handleImportDoctorExercises}
                                className="w-full sm:w-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                              >
                                📥 Import & Calibrate
                              </button>
                            )}
                            {doctorPrescription.status === 'Pending Physio Review' && (
                              <button
                                type="button"
                                onClick={handleVerifyPrescriptionOnly}
                                className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
                              >
                                ✅ Verify Now
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Diagnosis</span>
                          <p className="text-sm font-black text-slate-900">{doctorPrescription.diagnosis}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-150 space-y-1">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Movement Restrictions</span>
                            <p className="text-slate-800 leading-relaxed font-medium">{doctorPrescription.restrictions}</p>
                          </div>

                          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-150 space-y-1">
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Clinical Precautions</span>
                            <p className="text-slate-800 leading-relaxed font-medium">{doctorPrescription.precautions}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rehabilitation Goals</span>
                          <p className="text-slate-800 leading-relaxed font-medium">{doctorPrescription.clinicalGoals}</p>
                        </div>

                        {doctorPrescription.exercises && doctorPrescription.exercises.length > 0 && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                Doctor-Recommended Exercises ({doctorPrescription.exercises.length})
                              </span>
                              <button
                                type="button"
                                onClick={handleImportDoctorExercises}
                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 underline"
                              >
                                + Add all to weekly plan
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {doctorPrescription.exercises.map((ex, i) => (
                                <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                                  <span className="font-bold text-slate-800">{ex.exerciseName}</span>
                                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                    {ex.targetReps} reps • {ex.successAngle}°
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs">
                        The attending doctor has not logged a formal diagnosis for this patient yet.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ADHERENCE & DISCOMFORT LOGS */}
                {activeTab === 'logs' && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-slate-900">
                        Session Logs, Early Interruptions & Discomfort Reports
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Track full sessions, partial completions, stopped attempts, and self-reported patient discomfort.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {patientSessions.map((s, idx) => (
                        <div
                          key={s._id || idx}
                          className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                            s.discomfortReported
                              ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                              : s.stoppedEarly
                              ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                              : 'bg-slate-50/70 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{s.exerciseName}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {new Date(s.date).toLocaleDateString()} at {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {s.discomfortReported && (
                                <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full">
                                  ⚠️ Discomfort Reported
                                </span>
                              )}
                              {s.stoppedEarly && !s.discomfortReported && (
                                <span className="bg-amber-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full">
                                  ⏸ Stopped Early
                                </span>
                              )}
                            </div>
                            {s.discomfortNotes && (
                              <p className="text-[11px] italic text-rose-700 bg-white/80 p-1.5 rounded-lg border border-rose-200">
                                Patient Note: "{s.discomfortNotes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 shrink-0 font-mono">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Completed Work</span>
                              <span className="font-black text-slate-900">{s.reps_completed} Reps</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Accuracy</span>
                              <span className="font-black text-emerald-700">{s.success_rate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {patientSessions.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No logged workout sessions or discomfort reports for this patient yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: HISTORICAL PLAN VERSIONS */}
                {activeTab === 'versions' && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-slate-900">
                        Exercise Plan Version History
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Historical record of weekly progressions and plan changes. Past logs remain associated with their original version.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {planVersions.map((ver) => (
                        <div
                          key={ver._id}
                          className={`p-5 rounded-2xl border text-xs space-y-3 ${
                            ver.isCurrent
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20'
                              : 'bg-slate-50 border-slate-200 opacity-90'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">Version {ver.version}</span>
                              {ver.isCurrent && (
                                <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                                  Current Active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              Effective: {ver.effectiveDate}
                            </span>
                          </div>

                          <p className="text-slate-700 italic">
                            "{ver.revisionNotes}"
                          </p>

                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Exercises ({ver.assignments?.length || 0})</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ver.assignments?.map((a, aIdx) => (
                                <div key={aIdx} className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                  <span className="font-bold text-slate-800">{a.exerciseName}</span>
                                  <span className="font-mono text-emerald-700 font-extrabold text-[11px]">
                                    {a.sets} × {a.type === 'hold' ? `${a.holdDurationSec}s` : `${a.reps}r`} ({a.sessionsPerDay}x/day)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-400 text-sm">
                Select a patient from the left roster to view their medical prescription and configure their weekly exercise plan.
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Video Tutorial Preview Modal */}
      <ExerciseTutorialModal
        isOpen={!!previewTutorialEx}
        exerciseName={previewTutorialEx}
        onClose={() => setPreviewTutorialEx(null)}
      />
    </div>
  );
}
