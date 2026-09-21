import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, CV_API_URL } from '../config';
import PoseCareLogo from '../components/PoseCareLogo';
import AnatomicalJointViewer from '../components/AnatomicalJointViewer';
import { useTheme } from '../hooks/useTheme';

// Biomechanical Clinical Protocols Directory
const CLINICAL_PROTOCOLS = {
  "Mini Squat": {
    joints: "Bilateral Knees & Hips (Landmarks 23-28)",
    targetROM: "120° - 135° knee flexion",
    restAngle: "165° - 180° full extension",
    clinicalGoal: "Quadriceps strengthening, eccentric knee loading, patellofemoral tracking",
    contraindications: "Acute meniscus tear without clearance, uncontrolled patellar subluxation",
    guidance: "Keep feet shoulder-width apart. Maintain neutral spine and ensure knees track over 2nd toe.",
    holdRecommendation: "5-10s isometric hold at peak depth"
  },
  "Bicep Curl (Standing)": {
    joints: "Elbow & Glenohumeral (Landmarks 11, 13, 15, 23)",
    targetROM: "45° - 85° flexion with 90° horizontal shoulder elevation",
    restAngle: "150° - 170° extension",
    clinicalGoal: "Biceps peak recruitment combined with dynamic rotator cuff & deltoid isometric stabilization",
    contraindications: "Acute subacromial impingement or labral tear",
    guidance: "Raise upper arm horizontally at 90° to body (shoulder height). Keep shoulder and elbow in a straight line while curling.",
    holdRecommendation: "1-2s isometric pause at peak apex"
  },
  "Bicep Curl": {
    joints: "Elbow & Glenohumeral (Landmarks 11, 13, 15, 23)",
    targetROM: "45° - 85° flexion with 90° horizontal shoulder elevation",
    restAngle: "150° - 170° extension",
    clinicalGoal: "Biceps peak recruitment combined with dynamic rotator cuff & deltoid isometric stabilization",
    contraindications: "Acute subacromial impingement or labral tear",
    guidance: "Raise upper arm horizontally at 90° to body (shoulder height). Keep shoulder and elbow in a straight line while curling.",
    holdRecommendation: "1-2s isometric pause at peak apex"
  },
  "Seated Knee Extension": {
    joints: "Knee Joint (Landmarks 23, 25, 27)",
    targetROM: "160° - 180° terminal extension",
    restAngle: "90° - 105° seated resting flexion",
    clinicalGoal: "Vastus medialis oblique (VMO) recruitment and terminal knee extension lag correction",
    contraindications: "Patellofemoral arthritis with acute flare",
    guidance: "Sit tall with thighs supported. Extend lower leg until fully straight; dorsiflex ankle.",
    holdRecommendation: "3-5s isometric hold at full extension"
  },
  "Shoulder Flexion": {
    joints: "Glenohumeral Joint (Landmarks 23, 11, 13)",
    targetROM: "140° - 180° elevation",
    restAngle: "15° - 30° resting side",
    clinicalGoal: "Anterior deltoid and rotator cuff elevation arc recovery post-impingement",
    contraindications: "Subacromial impingement with acute sharp pain > 6/10",
    guidance: "Raise arm forward with thumb pointed upward (scaption plane) to prevent subacromial pinch.",
    holdRecommendation: "2s hold at peak elevation"
  },
  "Shoulder Abduction": {
    joints: "Glenohumeral & Scapulothoracic (Landmarks 23, 11, 13)",
    targetROM: "135° - 170° abduction",
    restAngle: "15° - 25° resting side",
    clinicalGoal: "Middle deltoid activation and scapulohumeral rhythm restoration",
    contraindications: "Acute acromioclavicular separation",
    guidance: "Raise arm laterally in frontal plane. Avoid shrugging the trapezius.",
    holdRecommendation: "2-3s hold at apex"
  },
  "Straight Leg Raise": {
    joints: "Hip Flexor & Knee Extensor (Landmarks 11, 23, 25)",
    targetROM: "45° - 60° hip flexion with locked knee",
    restAngle: "0° supine resting",
    clinicalGoal: "Active quadriceps control without knee joint compressive forces",
    contraindications: "Acute hamstring strain",
    guidance: "Keep working knee completely locked straight. Elevate leg smoothly without pelvic tilt.",
    holdRecommendation: "5s hold at apex"
  },
  "Single-Leg Balance": {
    joints: "Ankle Subtalar & Hip Stabilizers (Landmarks 11, 12, 23-28)",
    targetROM: "Static equilibrium",
    restAngle: "Bilateral stance",
    clinicalGoal: "Proprioception, vestibular integration, ankle evertor/invertor stabilizer retraining",
    contraindications: "Severe vestibular vertigo or fall risk without safety harness",
    guidance: "Lift non-working foot 4 inches off floor. Maintain level pelvis and fix gaze on a static point.",
    holdRecommendation: "10-30s continuous balance"
  },
  "Bird Dog": {
    joints: "Posterior Chain & Core Stabilizers (Landmarks 11, 12, 15, 16, 23, 24, 27, 28)",
    targetROM: "Horizontal spine alignment",
    restAngle: "Quadruped baseline",
    clinicalGoal: "Multifidus, gluteus maximus, and contralateral shoulder endurance with neutral lumbar spine",
    contraindications: "Acute disc herniation with radiculopathy",
    guidance: "Extend opposite arm and leg simultaneously until parallel with floor. Avoid twisting torso.",
    holdRecommendation: "5s hold per repetition"
  }
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  
  // Real Data States
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSessions, setPatientSessions] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientDirectoryFilter, setPatientDirectoryFilter] = useState('all'); // 'all', 'active', 'pending'
  const [activeTab, setActiveTab] = useState('Dashboard'); // 'Dashboard', 'Patients', 'Schedule', 'Reports', 'Settings', 'Messages'

  // Prescription Form State (Mapped to sliders & clinical toggles)
  const [formExercise, setFormExercise] = useState('Mini Squat');
  const [formReps, setFormReps] = useState(15);
  const [formSuccessAngle, setFormSuccessAngle] = useState(135);
  const [formFailureAngle, setFormFailureAngle] = useState(165);
  const [formHoldTime, setFormHoldTime] = useState(10);
  const [formSide, setFormSide] = useState('bilateral'); // 'left', 'right', 'bilateral'
  const [formCameraView, setFormCameraView] = useState('front'); // 'front', 'side', '45deg'
  const [formTolerance, setFormTolerance] = useState(10); // 5, 10, 15 degrees
  const [formCompensationRules, setFormCompensationRules] = useState(['no_torso_lean', 'no_shoulder_hike']);
  const [prescribedList, setPrescribedList] = useState([]);

  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formPathology, setFormPathology] = useState('Right ACL Complex');
  const [formRestrictions, setFormRestrictions] = useState('');
  const [formPrecautions, setFormPrecautions] = useState('');
  const [formClinicalGoals, setFormClinicalGoals] = useState('');
  const [assignedPhysioPlan, setAssignedPhysioPlan] = useState(null);

  // Modals & Interactive Overlays
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPatient, setReportPatient] = useState(null);
  const [reportNotes, setReportNotes] = useState('');
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientFocus, setNewPatientFocus] = useState('knee_rehab');
  const [newPatientPassword, setNewPatientPassword] = useState('password123');

  // Appointments / Scheduling State
  const [appointments, setAppointments] = useState([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().slice(0, 10));
  const [newApptPatient, setNewApptPatient] = useState('');
  const [newApptDate, setNewApptDate] = useState(new Date().toISOString().slice(0, 10));
  const [newApptTime, setNewApptTime] = useState('10:00 AM');
  const [newApptType, setNewApptType] = useState('Rehabilitation Review');
  const [newApptDuration, setNewApptDuration] = useState('30 mins');
  const [newApptNotes, setNewApptNotes] = useState('');

  // Messages State
  const [selectedChatPatient, setSelectedChatPatient] = useState(null);
  const [chatThreads, setChatThreads] = useState({});
  const [outgoingMessage, setOutgoingMessage] = useState('');

  // Settings / Clinic Profile State
  const [doctorProfileName, setDoctorProfileName] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('Senior Clinical Physical Therapist & Biomechanics Lead');
  const [doctorClinicName, setDoctorClinicName] = useState('PoseCare Advanced Orthopedic Rehabilitation Institute');
  const [doctorLicenseId, setDoctorLicenseId] = useState('MD-PT-88421-NY');
  const [doctorSettingsSaved, setDoctorSettingsSaved] = useState(false);

  const [exerciseList, setExerciseList] = useState([
    'Mini Squat', 'Bicep Curl (Standing)', 'Bicep Curl', 'Seated Knee Extension', 
    'Straight Leg Raise', 'Shoulder Flexion', 'Shoulder Abduction',
    'Wall Slides', 'Calf Raise', 'Marching in Place',
    'Single-Leg Balance', 'Bird Dog', 'Push-up', 'Crunch'
  ]);

  // Security & Data Fetching (Doctors only)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'doctor') {
      navigate('/');
      return;
    }
    setUser(storedUser);
    setDoctorProfileName(storedUser.name || 'Dr. John Smith');

    const token = localStorage.getItem('token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    const fetchPatients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/patients`, {
          headers: authHeaders
        });
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
          if (data.length > 0) {
            setSelectedPatient(data[0]);
            setSelectedChatPatient(data[0]);
          }
        }
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

    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/appointments/doctor/${storedUser.id}`, {
          headers: authHeaders
        });
        if (res.ok) {
          const appts = await res.json();
          setAppointments(appts);
        }
      } catch (err) {
        console.warn("Failed to load appointments:", err);
      }
    };

    fetchPatients();
    fetchExercises();
    fetchAppointments();

    // Initial mock chat threads
    setChatThreads({
      default: [
        { sender: 'patient', text: "Hello Doctor, I finished the Squat repetitions but felt a bit of muscle tightness at the bottom. Is 125 degrees correct or should I do less?", time: '2h ago' },
        { sender: 'doctor', text: "Hello! Good work on the compliance. Since joint tightness is present, let's keep it at 110 degrees for the next 2 days. I have adjusted your prescription goal on the dashboard.", time: '1h ago' }
      ]
    });
  }, [navigate]);

  // Fetch Sessions & Prescription when Patient selection changes
  useEffect(() => {
    if (!selectedPatient) return;
    
    const token = localStorage.getItem('token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    const fetchPatientData = async () => {
      try {
        // Fetch sessions
        const resSessions = await fetch(`${API_URL}/api/sessions/patient/${selectedPatient._id}`, {
          headers: authHeaders
        });
        if (resSessions.ok) {
          const sessionsData = await resSessions.json();
          setPatientSessions(sessionsData);
        }
        
        // Fetch prescription
        const resPrescr = await fetch(`${API_URL}/api/prescriptions/patient/${selectedPatient._id}`, {
          headers: authHeaders
        });
        if (resPrescr.ok) {
          const prescrData = await resPrescr.json();
          if (prescrData) {
            setPrescription(prescrData);
            setFormDiagnosis(prescrData.diagnosis || '');
            setFormPathology(prescrData.pathology || 'Right ACL Complex');
            setFormRestrictions(prescrData.restrictions || '');
            setFormPrecautions(prescrData.precautions || '');
            setFormClinicalGoals(prescrData.clinicalGoals || '');

            if (prescrData.exercises && prescrData.exercises.length > 0) {
              setPrescribedList(prescrData.exercises);
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
            setPrescribedList([]);
            setFormDiagnosis('');
            setFormPathology('Right ACL Complex');
            setFormRestrictions('');
            setFormPrecautions('');
            setFormClinicalGoals('');
            handleExercisePreset('Mini Squat');
          }
        } else {
          setPrescription(null);
          setPrescribedList([]);
          setFormDiagnosis('');
          setFormPathology('Right ACL Complex');
          setFormRestrictions('');
          setFormPrecautions('');
          setFormClinicalGoals('');
          handleExercisePreset('Mini Squat');
        }

        // Fetch Physiotherapist Exercise Plan
        try {
          const resPlan = await fetch(`${API_URL}/api/plans/patient/${selectedPatient._id}`, {
            headers: authHeaders
          });
          if (resPlan.ok) {
            const planData = await resPlan.json();
            setAssignedPhysioPlan(planData.currentPlan || planData);
          } else {
            setAssignedPhysioPlan(null);
          }
        } catch (planErr) {
          console.warn("No active physiotherapist plan found:", planErr);
          setAssignedPhysioPlan(null);
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
    if (name.includes('Bicep Curl') || name.includes('bicep')) {
      setFormSuccessAngle(85);
      setFormFailureAngle(150);
      setFormHoldTime(name.includes('Horizontal') ? 2 : 0);
    } else if (name === 'Mini Squat') {
      setFormSuccessAngle(125);
      setFormFailureAngle(165);
      setFormHoldTime(10);
    } else if (name === 'Seated Knee Extension') {
      setFormSuccessAngle(160);
      setFormFailureAngle(105);
      setFormHoldTime(5);
    } else if (name === 'Shoulder Flexion') {
      setFormSuccessAngle(145);
      setFormFailureAngle(25);
      setFormHoldTime(3);
    } else {
      setFormSuccessAngle(135);
      setFormFailureAngle(165);
      setFormHoldTime(10);
    }
  };

  const handleAcceptPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentDocId = user.id || user._id;
      const response = await fetch(`${API_URL}/api/users/patients/${selectedPatient._id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ doctorId: currentDocId })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update patient connection');
      }
      
      const updatedPatient = await response.json();
      setPatients(prev => prev.map(p => p._id === updatedPatient._id ? updatedPatient : p));
      setSelectedPatient(updatedPatient);
      alert(`✅ ${updatedPatient.name} is now connected to your clinic practice!`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Add exercise to prescription list
  const handleAddExerciseToRoutine = () => {
    const newEx = {
      exerciseName: formExercise,
      targetReps: formReps,
      successAngle: formSuccessAngle,
      failureAngle: formFailureAngle,
      holdTime: formHoldTime,
      side: formSide,
      cameraView: formCameraView,
      tolerance: formTolerance,
      compensationRules: formCompensationRules
    };
    // Replace if exists, or append
    const existingIdx = prescribedList.findIndex(e => e.exerciseName === formExercise);
    if (existingIdx >= 0) {
      const updated = [...prescribedList];
      updated[existingIdx] = newEx;
      setPrescribedList(updated);
    } else {
      setPrescribedList([...prescribedList, newEx]);
    }
  };

  const handleRemoveExerciseFromRoutine = (exName) => {
    setPrescribedList(prescribedList.filter(e => e.exerciseName !== exName));
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const exercisesToSave = prescribedList.length > 0 ? prescribedList : [{
        exerciseName: formExercise,
        targetReps: formReps,
        successAngle: formSuccessAngle,
        failureAngle: formFailureAngle,
        holdTime: formHoldTime,
        side: formSide,
        cameraView: formCameraView,
        tolerance: formTolerance,
        compensationRules: formCompensationRules
      }];

      const determinedJointType = 
        (formPathology.toLowerCase().includes('shoulder') || selectedPatient.focusArea?.includes('shoulder')) ? 'shoulder' :
        (formPathology.toLowerCase().includes('hip') || selectedPatient.focusArea?.includes('hip')) ? 'hip' :
        (formPathology.toLowerCase().includes('spine') || selectedPatient.focusArea?.includes('spine')) ? 'spine' :
        (formPathology.toLowerCase().includes('ankle') || selectedPatient.focusArea?.includes('ankle')) ? 'ankle' : 'knee';

      const response = await fetch(`${API_URL}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          doctorId: user.id || user._id,
          patientId: selectedPatient._id,
          diagnosis: formDiagnosis || 'Musculoskeletal Rehabilitation Protocol',
          pathology: formPathology || 'Right ACL Complex',
          focusArea: selectedPatient.focusArea,
          jointType: determinedJointType,
          restrictions: formRestrictions || '',
          precautions: formPrecautions || '',
          clinicalGoals: formClinicalGoals || '',
          exercises: exercisesToSave
        })
      });
      if (response.ok) {
        const saved = await response.json();
        setPrescription(saved);
        setPrescribedList(saved.exercises || []);
        alert(`✅ Medical Prescription & Safety Directives saved successfully for ${selectedPatient.name}! Pathology: ${saved.pathology || formPathology}`);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save prescription");
      }
    } catch (err) {
      alert("Error saving prescription: " + err.message);
    }
  };

  // Add New Patient Handler
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientName || !newPatientEmail) {
      alert("Please enter patient name and email.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPatientName,
          email: newPatientEmail,
          focusArea: newPatientFocus,
          doctorId: user.id,
          password: newPatientPassword
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ Patient ${newPatientName} registered successfully! Default password: ${newPatientPassword}`);
        setAddPatientModalOpen(false);
        setNewPatientName('');
        setNewPatientEmail('');
        
        // Refresh patients roster
        const refreshRes = await fetch(`${API_URL}/api/users/patients`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setPatients(freshData);
          if (data.patient) setSelectedPatient(data.patient);
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create patient");
      }
    } catch (err) {
      alert("Error registering patient: " + err.message);
    }
  };

  // Add New Appointment Handler
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!newApptPatient || !newApptDate || !newApptTime) {
      alert("Please fill in patient, date, and time.");
      return;
    }

    try {
      const targetPatientObj = patients.find(p => p.name === newApptPatient);
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: user.id,
          patientId: targetPatientObj?._id || null,
          patientName: newApptPatient,
          date: newApptDate,
          time: newApptTime,
          type: newApptType,
          duration: newApptDuration,
          notes: newApptNotes,
          status: 'Confirmed'
        })
      });

      if (res.ok) {
        const savedAppt = await res.json();
        setAppointments([...appointments, savedAppt]);
        setScheduleModalOpen(false);
        setNewApptNotes('');
        alert("✅ Appointment scheduled successfully!");
      } else {
        throw new Error("Failed to schedule appointment");
      }
    } catch (err) {
      alert("Error scheduling appointment: " + err.message);
    }
  };

  const handleUpdateAppointmentStatus = async (apptId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${apptId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(appointments.map(a => a._id === apptId ? updated : a));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteAppointment = async (apptId) => {
    if (!window.confirm("Are you sure you want to remove this appointment?")) return;
    try {
      const res = await fetch(`${API_URL}/api/appointments/${apptId}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(appointments.filter(a => a._id !== apptId));
      }
    } catch (err) {
      console.error("Failed to delete appointment:", err);
    }
  };

  // Chat send handler
  const handleSendMessage = () => {
    if (!outgoingMessage.trim() || !selectedChatPatient) return;
    const threadKey = selectedChatPatient._id || 'default';
    const existing = chatThreads[threadKey] || chatThreads['default'] || [];
    
    const newMsg = { sender: 'doctor', text: outgoingMessage.trim(), time: 'Just now' };
    const updatedThread = [...existing, newMsg];
    
    setChatThreads({
      ...chatThreads,
      [threadKey]: updatedThread
    });
    setOutgoingMessage('');

    // Simulate instant automated response after 1.5s
    setTimeout(() => {
      setChatThreads(prev => ({
        ...prev,
        [threadKey]: [
          ...(prev[threadKey] || updatedThread),
          { sender: 'patient', text: `Thank you Dr. ${user.name.split(' ').pop()}, I have noted this down and will perform my workout today!`, time: 'Just now' }
        ]
      }));
    }, 1500);
  };

  // Save Settings Handler
  const handleSaveClinicSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: doctorProfileName,
          focusArea: 'orthopedics'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem('user', JSON.stringify({ ...user, name: doctorProfileName }));
          setUser({ ...user, name: doctorProfileName });
        }
        setDoctorSettingsSaved(true);
        setTimeout(() => setDoctorSettingsSaved(false), 3000);
        alert("✅ Clinic profile and notification preferences saved successfully!");
      }
    } catch (err) {
      alert("Error saving settings: " + err.message);
    }
  };

  // Open Full Report Generator for Patient
  const handleOpenReportModal = (patient) => {
    setReportPatient(patient || selectedPatient);
    setReportNotes(`Patient ${patient?.name || selectedPatient?.name} demonstrates consistent rehabilitation adherence. Biomechanical angular range of motion continues to trend positively toward clinical targets with minimal compensatory movement.`);
    setReportModalOpen(true);
  };

  // Export Report to CSV
  const handleExportPatientCSV = (patient, sessions) => {
    const targetName = patient?.name || selectedPatient?.name || 'Patient';
    const dataList = sessions || patientSessions;
    if (!dataList || dataList.length === 0) {
      alert("No session logs recorded yet for this patient.");
      return;
    }
    const headers = ["Session #", "Date", "Time", "Exercise", "Game Interface", "Reps Completed", "Max ROM (°)", "Hold Time (s)", "Form Accuracy (%)"];
    const rows = dataList.map((s, i) => [
      i + 1,
      new Date(s.date).toLocaleDateString(),
      new Date(s.date).toLocaleTimeString(),
      `"${(s.exerciseName || 'Rehab Exercise').replace(/"/g, '""')}"`,
      `"${(s.gamePlayed || 'Standard Tracker').replace(/"/g, '""')}"`,
      s.reps_completed || 0,
      Math.round(s.max_angle_achieved || 0),
      s.hold_time_achieved || 0,
      s.success_rate || 100
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `PoseCare_Clinical_Report_${targetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  // Helper to reliably check if a patient is assigned to this doctor
  const isPatientAssignedToMe = (patient) => {
    if (!patient || !user) return false;
    const currentDocId = String(user.id || user._id || '');
    const patientDocId = String(patient.assignedDoctorId?._id || patient.assignedDoctorId || '');
    return Boolean(currentDocId && patientDocId && currentDocId === patientDocId);
  };

  // Patient Deduplication & Filtering
  const uniquePatients = [];
  const seenEmails = new Set();
  patients.forEach(p => {
    if (p.email && !seenEmails.has(p.email.toLowerCase())) {
      seenEmails.add(p.email.toLowerCase());
      uniquePatients.push(p);
    }
  });

  const filteredPatients = uniquePatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (patientDirectoryFilter === 'active') return isPatientAssignedToMe(p);
    if (patientDirectoryFilter === 'pending') return !isPatientAssignedToMe(p);
    return true;
  });

  const activePatientsCount = uniquePatients.filter(p => isPatientAssignedToMe(p)).length;
  const pendingPatientsCount = uniquePatients.filter(p => !isPatientAssignedToMe(p)).length;

  // Selected Patient Clinical Computed Metrics
  const lastAngle = patientSessions.length > 0 ? `${Math.round(patientSessions[0].max_angle_achieved || 0)}°` : '---';
  const totalRepsCompleted = patientSessions.reduce((acc, curr) => acc + (curr.reps_completed || 0), 0);
  const avgFormAccuracy = patientSessions.length > 0
    ? Math.round(patientSessions.reduce((acc, curr) => acc + (curr.success_rate || 100), 0) / patientSessions.length)
    : 100;
  const totalHoldSecs = patientSessions.reduce((acc, curr) => acc + (curr.hold_time_achieved || 0), 0);
  const peakROM = patientSessions.length > 0 ? Math.max(...patientSessions.map(s => s.max_angle_achieved || 0)) : 0;

  const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.split(' ').filter(p => !p.toLowerCase().includes('dr'));
    if (parts.length === 0) return name.substring(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
  };
  const initials = getInitials(user.name);

  // Active protocol reference for currently selected prescription exercise
  const activeProtocol = CLINICAL_PROTOCOLS[formExercise] || {
    joints: "Joint Biomechanics",
    targetROM: `${formSuccessAngle}° flexion/extension`,
    restAngle: `${formFailureAngle}° baseline`,
    clinicalGoal: "Restore physiological joint kinematics and range of motion.",
    contraindications: "Acute inflammation or severe pain > 6/10",
    guidance: "Execute reps in a steady, controlled cadence following visual feedback.",
    holdRecommendation: `${formHoldTime}s isometric hold`
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      
      {/* COLUMN 1: LEFT SIDEBAR (Roster and Navigation Links) */}
      <div className="w-72 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shrink-0 border-r border-slate-800">
        
        {/* PoseCare Header logo */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <PoseCareLogo size="sm" variant="horizontal" theme="dark" />
        </div>

        {/* Navigation links block */}
        <div className="p-4 space-y-1 border-b border-slate-800">
          {[
            { name: 'Dashboard', icon: '📁', badge: null },
            { name: 'Patients', icon: '👤', badge: uniquePatients.length },
            { name: 'Schedule', icon: '📅', badge: appointments.filter(a => a.status === 'Confirmed').length || null },
            { name: 'Reports', icon: '📄', badge: 'PDF' },
            { name: 'Messages', icon: '💬', badge: 'Live' },
            { name: 'Settings', icon: '⚙️', badge: null }
          ].map(lnk => {
            const isTabActive = activeTab === lnk.name;
            return (
              <div 
                key={lnk.name}
                onClick={() => setActiveTab(lnk.name)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all ${
                  isTabActive 
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 border border-teal-500/50' 
                    : 'hover:bg-slate-800/80 hover:text-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{lnk.icon}</span>
                  <span>{lnk.name}</span>
                </div>
                {lnk.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isTabActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                    {lnk.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* My Patients Header */}
        <div className="p-5 pb-2 flex justify-between items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient Roster</span>
          <button 
            onClick={() => setAddPatientModalOpen(true)}
            className="text-[11px] font-bold text-teal-400 hover:text-teal-300 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-lg"
          >
            + Add
          </button>
        </div>

        {/* Search input in sidebar */}
        <div className="px-4 mb-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 font-medium"
            />
            <span className="absolute left-2.5 top-2.5 text-xs text-slate-500">🔍</span>
          </div>
        </div>

        {/* Patient list inside Column 1 */}
        <div className="flex-1 px-3 space-y-2 overflow-y-auto">
          {filteredPatients.map(p => {
            const isAssigned = isPatientAssignedToMe(p);
            const isSelected = selectedPatient?._id === p._id;
            const jointIcon = p.focusArea?.includes('shoulder') ? '💪' : p.focusArea?.includes('hip') ? '🦴' : '🦵';
            return (
              <div 
                key={p._id}
                onClick={() => {
                  setSelectedPatient(p);
                  setSelectedChatPatient(p);
                }}
                className={`p-3 rounded-2xl cursor-pointer transition-all border space-y-2 ${
                  isSelected 
                    ? 'bg-slate-800 border-teal-500/80 text-white shadow-md ring-1 ring-teal-500/30' 
                    : 'bg-slate-850/40 border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${isSelected ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {jointIcon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block leading-none">PT-{p._id.slice(-4).toUpperCase()}</span>
                      <h4 className={`text-xs font-bold truncate mt-0.5 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {p.name}
                      </h4>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isAssigned ? 'bg-teal-400' : 'bg-amber-400'}`} />
                </div>

                {/* Stage Progression Slider (Protection ──●── Mobility) */}
                <div className="space-y-1 pt-1 border-t border-slate-700/50">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Protection</span>
                    <span>Mobility</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-500'}`} 
                      style={{ width: isAssigned ? '65%' : '25%' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPatients.length === 0 && (
            <p className="text-center text-[11px] text-slate-500 py-6">No matching patients found.</p>
          )}
        </div>
      </div>

      {/* COLUMN 2: CENTER CONTENT AREA (Patient details, analytics & tabs) */}
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
        
        {/* Top Header bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Doctor Portal</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
              {activeTab}
            </span>
          </div>

          {/* Doctor Info profile dropdown */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAddPatientModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>➕</span>
              <span>New Patient</span>
            </button>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-slate-900 block leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-medium block">Licensed Physical Therapist</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- TAB 1: MAIN DASHBOARD --- */}
        {activeTab === 'Dashboard' && (
          selectedPatient ? (
            <div className="p-8 space-y-6 flex-1">
              
              {/* Top Controls: Title & Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Clinical Overview</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Continuous AI pose estimation telemetry and rehabilitation metrics</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleOpenReportModal(selectedPatient)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>📄</span>
                    <span>Generate Clinical Report</span>
                  </button>
                  <button 
                    onClick={() => handleExportPatientCSV(selectedPatient, patientSessions)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>📥</span>
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* HERO SECTION: REFERENCE 1 BONE/JOINT ANATOMY & PATIENT INFO */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT HERO: KINETIC BONE & JOINT ANATOMICAL CARD */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
                  {/* Patient Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedPatient.name}</h3>
                        <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                          In Rehabilitation
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Patient PT-{selectedPatient._id.slice(-6).toUpperCase()} • Updated {patientSessions.length > 0 ? 'just now' : 'recently'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenReportModal(selectedPatient)}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-600 font-bold transition-all shadow-xs"
                        title="Fullscreen / Maximize"
                      >
                        ⛶
                      </button>
                    </div>
                  </div>

                  {/* High-Fidelity Dynamic Anatomical Joint Viewer */}
                  <div className="w-full">
                    <AnatomicalJointViewer 
                      jointType={selectedPatient.focusArea?.includes('shoulder') ? 'shoulder' : selectedPatient.focusArea?.includes('hip') ? 'hip' : selectedPatient.focusArea?.includes('spine') ? 'spine' : selectedPatient.focusArea?.includes('ankle') ? 'ankle' : 'knee'}
                      label={formPathology || (selectedPatient.focusArea?.includes('shoulder') ? 'Rotator Cuff Articulation' : selectedPatient.focusArea?.includes('hip') ? 'Acetabular Labrum' : 'Right ACL Complex')}
                      subLabel={formExercise || 'Prescribed Protocol'}
                      romValue={parseInt(lastAngle) || formSuccessAngle}
                      compact={false}
                      onPathologyChange={(p) => {
                        setFormPathology(p.name);
                        if (!formDiagnosis || formDiagnosis.includes('Protocol') || formDiagnosis === 'Musculoskeletal Rehabilitation') {
                          setFormDiagnosis(p.name + ' Rehabilitation Protocol');
                        }
                      }}
                    />
                  </div>

                  {/* Key Metrics Row matching Reference 1 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 items-center text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery score</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-slate-900">
                          {Math.min(100, Math.round((avgFormAccuracy * 0.7) + (totalRepsCompleted > 20 ? 30 : totalRepsCompleted * 1.5)))}/100
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">+6%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flexion ROM</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-slate-900">{lastAngle}</span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">Target {formSuccessAngle}°</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sessions</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-slate-900">{patientSessions.length}/6</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (patientSessions.length / 6) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleOpenReportModal(selectedPatient)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] px-3.5 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>View Assessment</span>
                        <span>›</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT HERO: PATIENT INFORMATION & ADHERENCE CARD */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-4">Patient information</h3>
                    
                    {/* Clinical Details Matrix */}
                    <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">28 yrs</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Procedure</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block truncate capitalize">
                          {selectedPatient.focusArea?.replace('_', ' ') || 'ACL Repair'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Side</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block capitalize">{formSide || 'Right'}</span>
                      </div>
                    </div>

                    {/* Attending Care Team Profiles */}
                    <div className="py-4 space-y-3 border-b border-slate-100">
                      {/* Doctor Profile */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-tight">{user.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Orthopedic Surgeon / Lead</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setActiveTab('Messages')}
                            className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-600 transition-all"
                            title="Message Clinician"
                          >
                            ✉
                          </button>
                        </div>
                      </div>

                      {/* Attending Physiotherapist */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            PT
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-tight">
                              {assignedPhysioPlan?.physioId?.name || 'Dr. Emma Wilson'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Attending Physiotherapist</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setActiveTab('Messages')}
                            className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-600 transition-all"
                            title="Call Physiotherapist"
                          >
                            📞
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Segmented Adherence & Symmetry Meters matching Reference 1 */}
                  <div className="space-y-3.5 pt-2">
                    {/* Adherence */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-600 text-[11px]">Exercise adherence</span>
                        <span className="text-amber-700 font-black font-mono">
                          {patientSessions.length > 0 ? `${Math.min(100, Math.round((patientSessions.length / 5) * 83))}%` : '83%'}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden p-0.5 border border-slate-200/60">
                        <div 
                          className="h-full rounded bg-striped-amber transition-all duration-500" 
                          style={{ width: patientSessions.length > 0 ? `${Math.min(100, Math.round((patientSessions.length / 5) * 83))}%` : '83%' }}
                        />
                      </div>
                    </div>

                    {/* Strength Symmetry */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-600 text-[11px]">Strength symmetry</span>
                        <span className="text-purple-700 font-black font-mono">{avgFormAccuracy ? `${avgFormAccuracy}%` : '78%'}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden p-0.5 border border-slate-200/60">
                        <div 
                          className="h-full rounded bg-striped-purple transition-all duration-500" 
                          style={{ width: `${avgFormAccuracy || 78}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* DUAL-CURVE RECOVERY OVERVIEW CHART */}
              <KineticRecoveryOverviewChart 
                data={patientSessions} 
                currentFlexion={parseInt(lastAngle) || formSuccessAngle}
                currentPhase={formExercise || "Strength"}
              />

              {/* Physiotherapist Weekly Exercise Plan Review Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl text-indigo-700 font-black">
                      📋
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">Attending Physiotherapist's Active Plan</h3>
                        {assignedPhysioPlan && (
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200">
                            Version {assignedPhysioPlan.version || 1}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Assigned daily allowances & scheduled training days within your medical prescription</p>
                    </div>
                  </div>

                  {assignedPhysioPlan && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Effective: {assignedPhysioPlan.effectiveDate ? new Date(assignedPhysioPlan.effectiveDate).toLocaleDateString() : 'Active'}
                    </span>
                  )}
                </div>

                {assignedPhysioPlan && assignedPhysioPlan.assignments && assignedPhysioPlan.assignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assignedPhysioPlan.assignments.map((asgn, aIdx) => {
                      const isHold = asgn.type === 'hold' || asgn.targetType === 'hold_seconds' || (asgn.holdDurationSec > 0);
                      const targetWork = isHold ? (asgn.holdDurationSec || asgn.repsOrHold || 10) : (asgn.reps || asgn.repsOrHold || 10);
                      const totalDaily = targetWork * (asgn.sets || 2) * (asgn.sessionsPerDay || 1);
                      const days = asgn.daysOfWeek || [1, 2, 3, 4, 5];
                      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                      return (
                        <div key={asgn.assignmentId || aIdx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-black text-slate-900">{asgn.exerciseName}</span>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150">
                              {totalDaily} {isHold ? 's hold' : 'reps'}/day
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <span>{asgn.sets || 2} sets × {targetWork} {isHold ? 's hold' : 'reps'}</span>
                            <span className="text-slate-400"> • {asgn.sessionsPerDay || 1} session/day</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {days.map(d => (
                              <span key={d} className="bg-teal-50 text-teal-700 border border-teal-200 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                                {typeof d === 'number' ? dayLabels[d] : d}
                              </span>
                            ))}
                          </div>
                          {asgn.notes && (
                            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">"{asgn.notes}"</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 space-y-1">
                    <p className="text-xs font-bold text-slate-600">No physiotherapist exercise plan published yet.</p>
                    <p className="text-[11px] text-slate-400">The attending physiotherapist will assign specific daily volume and schedules within your prescription.</p>
                  </div>
                )}
              </div>

              {/* Accept patient button if connection is pending */}
              {!isPatientAssignedToMe(selectedPatient) && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                  <div>
                    <h4 className="font-black text-amber-900 text-sm">Patient Connection Request Pending</h4>
                    <p className="text-xs text-amber-700 mt-0.5">Accept this patient to sync your prescription routines and clinical monitoring logs.</p>
                  </div>
                  <button 
                    onClick={handleAcceptPatient}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md shadow-amber-600/20 transition-all shrink-0 cursor-pointer"
                  >
                    Accept Patient Connection
                  </button>
                </div>
              )}

              {/* Recent Sessions Table Preview */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-slate-900">Recent Session Log Telemetry</h3>
                  <button 
                    onClick={() => handleExportPatientCSV(selectedPatient, patientSessions)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold"
                  >
                    Export All Telemetry &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pr-2">Date & Time</th>
                        <th className="pb-3 pr-2">Exercise</th>
                        <th className="pb-3 pr-2">Game Mode</th>
                        <th className="pb-3 pr-2 text-center">Reps</th>
                        <th className="pb-3 pr-2 text-center">Max ROM</th>
                        <th className="pb-3 text-center">Form Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientSessions.slice(0, 5).map((session, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pr-2 font-medium">
                            <span className="font-bold text-slate-800 block">{new Date(session.date).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-400">{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="py-3.5 pr-2 font-bold text-slate-900">{session.exerciseName}</td>
                          <td className="py-3.5 pr-2 text-slate-600">
                            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                              {session.gamePlayed || 'Standard Tracker'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-2 text-center font-bold text-teal-600">{session.reps_completed}</td>
                          <td className="py-3.5 pr-2 text-center font-mono font-bold text-purple-600">{Math.round(session.max_angle_achieved || 0)}°</td>
                          <td className="py-3.5 text-center font-bold text-indigo-600">{session.success_rate || 100}%</td>
                        </tr>
                      ))}
                      {patientSessions.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                            No workout telemetry recorded yet for this patient.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
              <span className="text-5xl">📁</span>
              <p className="font-bold text-slate-600">No patient selected</p>
              <p className="text-xs text-slate-400 max-w-sm text-center">Select a patient from the left roster or click "+ Add New Patient" to start reviewing clinical telemetry.</p>
            </div>
          )
        )}

        {/* --- TAB 2: PATIENT DIRECTORY --- */}
        {activeTab === 'Patients' && (
          <div className="p-8 space-y-6 flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Directory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage patient roster, clinical assignments, and treatment programs</p>
              </div>
              <button 
                onClick={() => setAddPatientModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <span>➕</span>
                <span>Add New Patient</span>
              </button>
            </div>

            {/* Directory Filter Pills */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit text-xs">
              <button
                onClick={() => setPatientDirectoryFilter('all')}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  patientDirectoryFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Patients ({uniquePatients.length})
              </button>
              <button
                onClick={() => setPatientDirectoryFilter('active')}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  patientDirectoryFilter === 'active' ? 'bg-white text-teal-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Connected Patients ({activePatientsCount})
              </button>
              <button
                onClick={() => setPatientDirectoryFilter('pending')}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  patientDirectoryFilter === 'pending' ? 'bg-white text-amber-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pending Approval ({pendingPatientsCount})
              </button>
            </div>
            
            {/* Patients Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Patient Name</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Program Focus</th>
                    <th className="py-4 px-6">Registered Date</th>
                    <th className="py-4 px-6 text-right">Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredPatients.map(p => {
                    const isAssigned = isPatientAssignedToMe(p);
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-sm font-black text-teal-700">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAssigned 
                              ? 'bg-teal-50 border-teal-200 text-teal-700' 
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {isAssigned ? '✓ Connected Patient' : 'Pending Request'}
                          </span>
                        </td>
                        <td className="py-4 px-6 capitalize">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-slate-200">
                            {p.focusArea?.replace('_', ' ') || 'General Rehab'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button 
                            onClick={() => handleOpenReportModal(p)}
                            className="text-indigo-600 hover:text-indigo-700 font-extrabold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            📄 Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        No patients found matching the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: SCHEDULE & APPOINTMENTS --- */}
        {activeTab === 'Schedule' && (
          <div className="p-8 space-y-6 flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Therapy Appointments & Consultations</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage in-clinic reviews, posture assessments, and virtual tele-rehab sessions</p>
              </div>
              <button 
                onClick={() => setScheduleModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <span>📅</span>
                <span>Schedule New Appointment</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Appointments List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm">Scheduled Consultations ({appointments.length})</h3>
                    <span className="text-xs text-slate-400 font-bold">Filter: {selectedCalendarDate}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {appointments.map((appt, i) => (
                      <div key={appt._id || i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-150 gap-4">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-teal-700 font-black bg-teal-100/80 border border-teal-200 px-3 py-1.5 rounded-xl">
                            {appt.time}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">{appt.patientName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({appt.date})</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">{appt.type} • {appt.duration}</span>
                            {appt.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">"{appt.notes}"</p>}
                          </div>
                        </div>

                        {/* Status Toggle & Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <select 
                            value={appt.status} 
                            onChange={(e) => handleUpdateAppointmentStatus(appt._id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                              appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              appt.status === 'Confirmed' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          <button 
                            onClick={() => handleDeleteAppointment(appt._id)}
                            className="text-slate-400 hover:text-red-500 text-xs p-1"
                            title="Cancel Appointment"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                    {appointments.length === 0 && (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <span className="text-3xl block">📅</span>
                        <p className="text-xs font-bold">No appointments scheduled.</p>
                        <p className="text-[11px] text-slate-400">Click "+ Schedule New Appointment" to book a patient consultation.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Interactive Calendar Widget */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-900 text-sm">Monthly Calendar</h3>
                  <span className="text-xs font-bold text-teal-600">
                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                  {Array.from({ length: 30 }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `2026-09-${day.toString().padStart(2, '0')}`;
                    const isSelected = selectedCalendarDate === dateStr;
                    const hasAppt = appointments.some(a => a.date?.includes(`-${day.toString().padStart(2, '0')}`));
                    return (
                      <button 
                        key={day} 
                        onClick={() => setSelectedCalendarDate(dateStr)}
                        className={`p-2 rounded-xl relative transition-all ${
                          isSelected ? 'bg-teal-600 text-white font-black shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{day}</span>
                        {hasAppt && !isSelected && (
                          <span className="w-1 h-1 bg-teal-500 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Click a date to filter or book consultations</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 4: COMPLIANCE & CLINICAL REPORTS --- */}
        {activeTab === 'Reports' && (
          <div className="p-8 space-y-6 flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Compliance & Evaluation Reports</h2>
                <p className="text-xs text-slate-500 mt-0.5">Generate formal diagnostic summaries with Range of Motion recovery curves</p>
              </div>
              <button 
                onClick={() => {
                  if (uniquePatients.length > 0) handleOpenReportModal(uniquePatients[0]);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <span>📄</span>
                <span>Create Medical Evaluation PDF</span>
              </button>
            </div>
            
            {/* Reports List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">Patient Rehabilitation Summaries ({uniquePatients.length})</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Clinic Status</span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {uniquePatients.map((patient, i) => (
                  <div key={patient._id || i} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-xl shrink-0">
                        📄
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-sm block">{patient.name}</span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {patient.focusArea?.replace('_', ' ') || 'General Rehab'} • {patient.email}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Status</span>
                        <span className="font-extrabold text-teal-600 font-mono">
                          {isPatientAssignedToMe(patient) ? 'Active Routine' : 'Pending Connect'}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleOpenReportModal(patient)}
                        className="text-teal-700 hover:text-teal-800 font-extrabold border border-teal-200 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <span>📄</span>
                        <span>View & Print Report</span>
                      </button>

                      <button 
                        onClick={() => handleExportPatientCSV(patient, null)}
                        className="text-slate-600 hover:text-slate-900 font-bold border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl text-xs transition-all shadow-sm"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 5: MESSAGES / TELE-HEALTH CHAT --- */}
        {activeTab === 'Messages' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Patients Chat List */}
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
              <div className="p-4 border-b border-slate-200">
                <input 
                  type="text" 
                  placeholder="Search patient chats..." 
                  className="w-full bg-slate-50 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium border border-slate-200" 
                />
              </div>
              
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {uniquePatients.map((patient) => {
                  const isChatSelected = selectedChatPatient?._id === patient._id;
                  return (
                    <div 
                      key={patient._id}
                      onClick={() => setSelectedChatPatient(patient)}
                      className={`p-4 flex justify-between items-start cursor-pointer transition-colors ${
                        isChatSelected ? 'bg-teal-50/60 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 text-xs block">{patient.name}</span>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">Click to view patient consultation notes</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Chat Conversation Thread */}
            <div className="flex-1 bg-slate-50 flex flex-col justify-between h-full">
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-teal-600 flex items-center justify-center text-xs font-black text-white">
                    {selectedChatPatient?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">{selectedChatPatient?.name || 'Select a patient'}</span>
                    <span className="text-[9px] text-teal-600 font-bold">Live Clinical Consultation Channel</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenReportModal(selectedChatPatient)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl"
                >
                  📄 Patient Report
                </button>
              </div>
              
              {/* Message Feed */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {((chatThreads[selectedChatPatient?._id] || chatThreads['default']) || []).map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-end gap-3 max-w-md ${msg.sender === 'doctor' ? 'ml-auto justify-end' : ''}`}
                  >
                    {msg.sender === 'patient' && (
                      <div className="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {selectedChatPatient?.name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-xs font-medium ${
                      msg.sender === 'doctor' 
                        ? 'bg-teal-600 text-white rounded-br-none shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className={`text-[9px] block mt-1 text-right ${msg.sender === 'doctor' ? 'text-teal-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input Box */}
              <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
                <input 
                  type="text" 
                  placeholder={`Send clinical advice or protocol adjustments to ${selectedChatPatient?.name || 'patient'}...`}
                  value={outgoingMessage}
                  onChange={(e) => setOutgoingMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" 
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-teal-600/10 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 6: CLINIC SETTINGS --- */}
        {activeTab === 'Settings' && (
          <div className="p-8 space-y-6 flex-1 max-w-3xl">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinic & Therapist Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure clinical credentials, report headers, and notification triggers</p>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-4">Therapist Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Doctor Full Name</label>
                    <input 
                      type="text" 
                      value={doctorProfileName} 
                      onChange={(e) => setDoctorProfileName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Specialization</label>
                    <input 
                      type="text" 
                      value={doctorSpecialization} 
                      onChange={(e) => setDoctorSpecialization(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Clinic / Hospital Title</label>
                    <input 
                      type="text" 
                      value={doctorClinicName} 
                      onChange={(e) => setDoctorClinicName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Medical License ID</label>
                    <input 
                      type="text" 
                      value={doctorLicenseId} 
                      onChange={(e) => setDoctorLicenseId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-extrabold text-slate-900 text-sm mb-4">Notification & Dispatch Presets</h3>
                <div className="space-y-3">
                  {[
                    'Email instant telemetry alert if patient form accuracy falls below 75%',
                    'Weekly summary PDF report dispatch to clinic records',
                    'Real-time sound alert when patient completes a new workout session'
                  ].map((pref, i) => (
                    <label key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked={true} className="accent-teal-600 w-4 h-4 rounded" />
                      <span>{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                {doctorSettingsSaved ? (
                  <span className="text-xs font-bold text-teal-600">✓ Settings successfully saved!</span>
                ) : <span></span>}
                <button 
                  onClick={handleSaveClinicSettings}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-teal-600/10 transition-colors"
                >
                  Save Clinic Settings
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
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Prescription Routine</h3>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {prescribedList.length} Exercises
              </span>
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Prescription Builder</p>

            {/* Medical Directives (Doctor Only) */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                <span className="text-xs">🩺</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Medical Directives (Doctor Only)</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Target Anatomical Pathology & Pin</label>
                <input
                  type="text"
                  placeholder="e.g., Right ACL Tear, Meniscus, Rotator Cuff, L4-L5 Disc"
                  value={formPathology}
                  onChange={(e) => setFormPathology(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Right ACL', 'Meniscus', 'Patellar Tendon', 'PCL', 'Rotator Cuff', 'SLAP Labrum', 'L4-L5 Disc', 'Achilles'].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setFormPathology(chip);
                        if (!formDiagnosis || formDiagnosis.includes('Protocol')) {
                          setFormDiagnosis(chip + ' Rehabilitation Protocol');
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                        formPathology.includes(chip) 
                          ? 'bg-teal-600 text-white border-teal-600' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Primary Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g., Rotator cuff impingement / ACL grade 2"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Movement Restrictions</label>
                <textarea
                  rows="2"
                  placeholder="e.g., Limit shoulder elevation to <= 90 deg. No ballistic loading."
                  value={formRestrictions}
                  onChange={(e) => setFormRestrictions(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Safety Precautions</label>
                <textarea
                  rows="2"
                  placeholder="e.g., Discontinue if pain exceeds 4/10 VAS or sharp sensations arise."
                  value={formPrecautions}
                  onChange={(e) => setFormPrecautions(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Clinical Goals</label>
                <input
                  type="text"
                  placeholder="e.g., 140 deg active abduction & full motor control"
                  value={formClinicalGoals}
                  onChange={(e) => setFormClinicalGoals(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-5">
              
              {/* Exercise Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Exercise Target</label>
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

              {/* Side Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Target Body Side</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'left', label: 'Left' },
                    { id: 'right', label: 'Right' },
                    { id: 'bilateral', label: 'Bilateral' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormSide(s.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        formSide === s.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera View Orientation */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Prescribed Camera Angle</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'front', label: 'Front (0°)' },
                    { id: 'side', label: 'Sagittal (90°)' },
                    { id: '45deg', label: 'Oblique (45°)' }
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFormCameraView(v.id)}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all border text-center ${
                        formCameraView === v.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Angle Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Target Angle (ROM):</span>
                  <span className="text-teal-700 font-black">{formSuccessAngle}°</span>
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

              {/* Angle Tolerance Gate */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">ROM Precision Tolerance</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 5, label: 'Strict (±5°)' },
                    { val: 10, label: 'Normal (±10°)' },
                    { val: 15, label: 'Adaptive (±15°)' }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFormTolerance(t.val)}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all border text-center ${
                        formTolerance === t.val
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Repetitions Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Goal Repetitions:</span>
                  <span className="text-indigo-700 font-black">{formReps} Reps</span>
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
                  <span className="text-slate-500">Static Hold Timer:</span>
                  <span className="text-purple-700 font-black">{formHoldTime} Seconds</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={formHoldTime}
                  onChange={(e) => setFormHoldTime(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Compensation Rules Gates */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Kinetic Compensation Gates</span>
                {[
                  { id: 'no_torso_lean', label: 'Torso Lean Limit (≤15°)' },
                  { id: 'no_shoulder_hike', label: 'Shoulder Hike Lock (≤12°)' },
                  { id: 'strict_lockout', label: 'Strict Joint Return Lockout' }
                ].map(rule => {
                  const isChecked = formCompensationRules.includes(rule.id);
                  return (
                    <label key={rule.id} className="flex items-center gap-2 text-[11px] font-medium text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormCompensationRules([...formCompensationRules, rule.id]);
                          } else {
                            setFormCompensationRules(formCompensationRules.filter(r => r !== rule.id));
                          }
                        }}
                        className="rounded text-teal-600 focus:ring-teal-500 accent-teal-600 w-3.5 h-3.5"
                      />
                      <span>{rule.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Add to routine button */}
              <button 
                onClick={handleAddExerciseToRoutine}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>➕</span>
                <span>Add {formExercise} to Routine</span>
              </button>

              {/* Prescribed Exercises Queue */}
              {prescribedList.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned Exercises in Routine</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {prescribedList.map((ex, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-900 block">{ex.exerciseName}</span>
                          <button 
                            onClick={() => handleRemoveExerciseFromRoutine(ex.exerciseName)}
                            className="text-slate-400 hover:text-red-500 font-bold text-base leading-none px-1"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded text-[9px]">{ex.targetReps} reps</span>
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[9px]">{ex.successAngle}° (±{ex.tolerance || 10}°)</span>
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-[9px]">{ex.holdTime || 0}s hold</span>
                          <span className="bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px] capitalize">{ex.side || 'bilateral'}</span>
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[9px] capitalize">{ex.cameraView || 'front'} view</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Summary info */}
              <div className="border-t border-slate-100 pt-4 space-y-1 text-xs">
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px] mb-1">Current Patient Progress</span>
                <p className="text-slate-600 font-medium">Last peak angle achieved: <span className="font-extrabold text-slate-900 font-mono">{lastAngle}</span></p>
              </div>
            </div>
          </div>

          {/* Action Buttons at bottom of sidebar */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            {/* Verification Status Pill */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
              prescription?.status === 'Verified by Physio'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{prescription?.status === 'Verified by Physio' ? '✅' : '⏳'}</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">Clinical Workflow Status</span>
                  <span className="font-bold text-[11px]">{prescription?.status || 'Pending Physio Review'}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              ℹ️ Your prescribed exercises and ROM limits will be routed to the patient's dedicated physiotherapist for weekly calibration and activation.
            </p>

            <button 
              onClick={handleSavePrescription}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>📋</span>
              <span>Send Prescription to Physio for Calibration</span>
            </button>
            <button 
              onClick={() => setProtocolModalOpen(true)}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition-colors"
            >
              📖 View Clinical Protocol
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 1: CLINICAL EVALUATION & BIOMECHANICS REPORT GENERATOR --- */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Header / Modal Actions */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-3xl shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Official Medical Rehabilitation Report</h3>
                  <p className="text-xs text-slate-500">PoseCare Biomechanical Telemetry & Compliance Evaluation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>🖨️</span>
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => handleExportPatientCSV(reportPatient, patientSessions)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs shadow-sm transition-all"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-8 sm:p-10 space-y-8 print:p-0 print:space-y-6">
              
              {/* Report Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-6 gap-4">
                <div className="space-y-1">
                  <PoseCareLogo size="md" variant="horizontal" theme={isDark ? 'dark' : 'light'} />
                  <p className="text-xs font-bold text-slate-700 mt-2">{doctorClinicName}</p>
                  <p className="text-[11px] text-slate-400">Department of Orthopedic Biomechanics & Telerehabilitation</p>
                </div>
                <div className="text-left sm:text-right space-y-1 text-xs">
                  <span className="bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider block sm:inline-block">
                    Official Clinical Evaluation
                  </span>
                  <p className="font-bold text-slate-900 mt-1">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-slate-500">Attending: {user.name} ({doctorLicenseId})</p>
                </div>
              </div>

              {/* Patient Demographics Matrix */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Patient Name</span>
                  <span className="font-black text-slate-900 text-sm">{reportPatient?.name || selectedPatient?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Patient ID</span>
                  <span className="font-bold text-slate-800 font-mono">PT-{(reportPatient?._id || selectedPatient?._id)?.slice(-6).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Rehab Program</span>
                  <span className="font-extrabold text-teal-700 capitalize">{(reportPatient?.focusArea || selectedPatient?.focusArea)?.replace('_', ' ') || 'General Rehab'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Evaluation Period</span>
                  <span className="font-bold text-slate-800">Past 30 Days</span>
                </div>
              </div>

              {/* Clinical Metrics Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Repetitions</span>
                  <span className="text-2xl font-black text-teal-600 mt-1 block">{totalRepsCompleted}</span>
                  <span className="text-[10px] text-slate-400">Prescribed volume</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Average Form Accuracy</span>
                  <span className="text-2xl font-black text-indigo-600 mt-1 block">{avgFormAccuracy}%</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Clinical Grade</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Peak ROM Achieved</span>
                  <span className="text-2xl font-black text-purple-600 mt-1 block">{Math.round(peakROM)}°</span>
                  <span className="text-[10px] text-purple-600 font-bold">Target: {formSuccessAngle}°</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Sessions</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{patientSessions.length}</span>
                  <span className="text-[10px] text-slate-400">Completed workouts</span>
                </div>
              </div>

              {/* Dual Graphs inside Medical Document */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">1. Range of Motion (ROM) Trajectory</h4>
                  <RehabLineChart 
                    data={patientSessions} 
                    title="Joint Angle Recovery Curve" 
                    dataKey="max_angle_achieved" 
                    color="#6366f1" 
                    unit="°"
                    targetVal={formSuccessAngle}
                    tooltipLabel="Peak Angle"
                  />
                </div>
                <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">2. Repetition Compliance & Volume</h4>
                  <RehabLineChart 
                    data={patientSessions} 
                    title="Volume Distribution" 
                    dataKey="reps_completed" 
                    color="#0d9488" 
                    unit="reps"
                    targetVal={formReps}
                    tooltipLabel="Reps Done"
                  />
                </div>
              </div>

              {/* Session History Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">3. Telemetry Session Records</h4>
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Exercise</th>
                      <th className="p-2.5">Game Interface</th>
                      <th className="p-2.5 text-center">Reps</th>
                      <th className="p-2.5 text-center">Max ROM</th>
                      <th className="p-2.5 text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientSessions.slice(0, 6).map((s, idx) => (
                      <tr key={idx} className="text-slate-700">
                        <td className="p-2.5 font-medium">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="p-2.5 font-bold">{s.exerciseName}</td>
                        <td className="p-2.5">{s.gamePlayed || 'Standard Tracker'}</td>
                        <td className="p-2.5 text-center font-bold text-teal-700">{s.reps_completed}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{Math.round(s.max_angle_achieved || 0)}°</td>
                        <td className="p-2.5 text-center font-bold text-indigo-700">{s.success_rate || 100}%</td>
                      </tr>
                    ))}
                    {patientSessions.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-400">No session telemetry recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Doctor Notes & Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">4. Attending Physician Review & Next Goals</h4>
                <textarea 
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                ></textarea>
              </div>

              {/* Official Sign-off & Stamp */}
              <div className="border-t-2 border-slate-200 pt-6 flex justify-between items-end text-xs">
                <div>
                  <p className="font-black text-slate-900">{user.name}</p>
                  <p className="text-slate-500">{doctorSpecialization}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Certified AI Telerehabilitation System Verification</p>
                </div>
                <div className="text-right">
                  <div className="border border-dashed border-slate-300 rounded-xl px-4 py-2 inline-block bg-slate-50 text-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Digital Signature</span>
                    <span className="font-serif italic font-bold text-slate-800 text-sm">Dr. {user.name.split(' ').pop()}</span>
                    <span className="text-[8px] font-mono text-teal-600 block mt-0.5">{new Date().toISOString().slice(0, 10)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: CLINICAL PROTOCOL MODAL --- */}
      {protocolModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Biomechanical Protocol</span>
                <h3 className="text-xl font-black text-slate-900">{formExercise} Clinical Guide</h3>
              </div>
              <button onClick={() => setProtocolModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Joint Landmarks</span>
                  <span className="font-bold text-slate-900">{activeProtocol.joints}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Range of Motion (ROM)</span>
                  <span className="font-bold text-teal-700">{activeProtocol.targetROM} (Baseline: {activeProtocol.restAngle})</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Therapeutic Purpose</span>
                <p className="leading-relaxed">{activeProtocol.clinicalGoal}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Clinical Execution & Camera Alignment</span>
                <p className="leading-relaxed">{activeProtocol.guidance}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Hold Recommendation</span>
                <p className="font-semibold text-purple-700">{activeProtocol.holdRecommendation}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-900">
                <span className="text-[10px] font-black uppercase tracking-wider block mb-0.5">⚠️ Contraindications & Red Flags</span>
                <p>{activeProtocol.contraindications}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setProtocolModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD NEW PATIENT MODAL --- */}
      {addPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Register New Patient</h3>
                <p className="text-xs text-slate-500">Add patient to your clinical roster and assign starting routine</p>
              </div>
              <button onClick={() => setAddPatientModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Patient Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sarah Connor"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. sarah@example.com"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Rehab Program / Focus Area</label>
                <select 
                  value={newPatientFocus}
                  onChange={(e) => setNewPatientFocus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                >
                  <option value="knee_rehab">Knee Rehabilitation (ACL/MCL/Meniscus)</option>
                  <option value="shoulder_rehab">Shoulder Joint & Rotator Cuff</option>
                  <option value="upper_body">Upper Body & Bicep Mobility</option>
                  <option value="general">General Physical Therapy</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Initial Temporary Password</label>
                <input 
                  type="text" 
                  value={newPatientPassword}
                  onChange={(e) => setNewPatientPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                />
                <span className="text-[9px] text-slate-400 block mt-1">Patient can change password anytime via self-service reset.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setAddPatientModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-xl shadow-md shadow-teal-600/20 transition-all"
                >
                  Create Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: SCHEDULE APPOINTMENT MODAL --- */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Book Patient Consultation</h3>
                <p className="text-xs text-slate-500">Schedule review session or virtual tele-rehab</p>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Select Patient</label>
                <select 
                  value={newApptPatient}
                  onChange={(e) => setNewApptPatient(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                >
                  <option value="">-- Choose Patient --</option>
                  {uniquePatients.map(p => (
                    <option key={p._id} value={p.name}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</label>
                  <input 
                    type="date"
                    value={newApptDate}
                    onChange={(e) => setNewApptDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Time</label>
                  <input 
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={newApptTime}
                    onChange={(e) => setNewApptTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Session Type</label>
                  <select 
                    value={newApptType}
                    onChange={(e) => setNewApptType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                  >
                    <option value="Rehabilitation Review">Rehab Review</option>
                    <option value="Initial Consultation">Intake Consultation</option>
                    <option value="ROM Biomechanics Check">ROM Checkup</option>
                    <option value="Virtual Follow-up">Virtual Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                  <select 
                    value={newApptDuration}
                    onChange={(e) => setNewApptDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                  >
                    <option value="15 mins">15 mins</option>
                    <option value="30 mins">30 mins</option>
                    <option value="45 mins">45 mins</option>
                    <option value="60 mins">60 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Clinical Preparation Notes</label>
                <textarea 
                  placeholder="Notes for the review..."
                  value={newApptNotes}
                  onChange={(e) => setNewApptNotes(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-xl shadow-md shadow-teal-600/20 transition-all"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- KINETIC RECOVERY OVERVIEW CHART (DUAL-CURVE REFERENCE 1 STYLE) ---
function KineticRecoveryOverviewChart({ data, currentFlexion = 128, currentPhase = "Strength" }) {
  const [hoveredWeek, setHoveredWeek] = useState(null);

  // Generate 6-week progression trajectory based on actual data or clinical model
  const weeks = [
    { week: 'W1', activity: 85, flexion: 80 },
    { week: 'W2', activity: 135, flexion: 92 },
    { week: 'W3', activity: 145, flexion: 108 },
    { week: 'W4', activity: 125, flexion: 115 },
    { week: 'W5', activity: 155, flexion: 122 },
    { week: 'W6', activity: 165, flexion: currentFlexion || 128 },
  ];

  // If we have actual sessions, map their values
  if (data && data.length > 0) {
    const recent = [...data].slice(0, 6).reverse();
    recent.forEach((s, idx) => {
      if (weeks[idx]) {
        weeks[idx].activity = (s.reps_completed || 10) * 8 + 40;
        weeks[idx].flexion = Math.round(s.max_angle_achieved || 90);
      }
    });
  }

  const width = 600;
  const height = 220;
  const padding = 35;

  const maxActivity = 200;
  const maxFlexion = 180;

  const pointsActivity = weeks.map((w, i) => {
    const x = padding + (i / (weeks.length - 1)) * (width - 2 * padding);
    const y = height - padding - (w.activity / maxActivity) * (height - 2 * padding);
    return { x, y, val: w.activity, week: w.week };
  });

  const pointsFlexion = weeks.map((w, i) => {
    const x = padding + (i / (weeks.length - 1)) * (width - 2 * padding);
    const y = height - padding - (w.flexion / maxFlexion) * (height - 2 * padding);
    return { x, y, val: w.flexion, week: w.week };
  });

  // Smooth Bezier Curve generator
  const getBezierPath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const pathActivity = getBezierPath(pointsActivity);
  const pathFlexion = getBezierPath(pointsFlexion);
  const areaFlexion = `${pathFlexion} L ${pointsFlexion[pointsFlexion.length - 1].x} ${height - padding} L ${pointsFlexion[0].x} ${height - padding} Z`;

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
      {/* Header & Legends */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recovery overview</h3>
        
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Activity min</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-600">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Flexion °</span>
          </div>
        </div>
      </div>

      {/* SVG Multi-curve Area Chart */}
      <div className="w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            {/* Flexion purple wave gradient */}
            <linearGradient id="kineticFlexionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.00" />
            </linearGradient>

            <pattern id="kineticGridHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#8b5cf6" strokeWidth="0.75" strokeOpacity="0.15" />
            </pattern>
          </defs>

          {/* Grid lines */}
          {[0, 30, 60, 90, 120, 150, 180].map((val, idx) => {
            const y = height - padding - (val / 180) * (height - 2 * padding);
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padding - 10} y={y + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="end">{val}</text>
              </g>
            );
          })}

          {/* Flexion Gradient Area Fill */}
          <path d={areaFlexion} fill="url(#kineticFlexionGrad)" />
          <path d={areaFlexion} fill="url(#kineticGridHatch)" />

          {/* Flexion Purple Line */}
          <path d={pathFlexion} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />

          {/* Activity Amber Line */}
          <path d={pathActivity} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Activity Marker Points */}
          {pointsActivity.map((p, i) => (
            <circle key={`act-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
          ))}

          {/* Flexion Points with Hover */}
          {pointsFlexion.map((p, i) => (
            <g key={`flex-${i}`} className="cursor-pointer" onMouseEnter={() => setHoveredWeek(weeks[i])} onMouseLeave={() => setHoveredWeek(null)}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2.5" />
              <text x={p.x} y={height - padding + 16} fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                {weeks[i].week}
              </text>
            </g>
          ))}

          {/* Active Highlight Focal Point (Week 6 / Latest) */}
          <g transform={`translate(${pointsFlexion[pointsFlexion.length - 1].x}, ${pointsFlexion[pointsFlexion.length - 1].y})`}>
            <circle cx="0" cy="0" r="10" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" className="animate-pulse-subtle" />
            <circle cx="0" cy="0" r="5" fill="#f59e0b" />
          </g>

          {/* Floating Tooltip Pill matching Reference 1 */}
          <g transform={`translate(${pointsFlexion[pointsFlexion.length - 1].x - 45}, ${pointsFlexion[pointsFlexion.length - 1].y - 38})`}>
            <rect width="90" height="26" rx="8" fill="#0f172a" opacity="0.9" />
            <text x="45" y="12" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">Week: 6</text>
            <text x="45" y="21" fill="#ffffff" fontSize="8.5" fontWeight="black" textAnchor="middle">Flexion: {currentFlexion}°</text>
          </g>
        </svg>
      </div>

      {/* Footer Metrics Row matching Reference 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Care plan progress</span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">6/12 weeks</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current phase</span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block capitalize">{currentPhase}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next review</span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
        </div>
        <div className="flex items-end justify-start sm:justify-end">
          <button
            type="button"
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Share Details</span>
            <span>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- PREMIUM AREA GRADIENT PROGRESS CHART COMPONENT ---
function RehabLineChart({ data, title, dataKey, color, unit = '', targetVal, tooltipLabel }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-72 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
        <span className="text-3xl opacity-60">📊</span>
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">{title}</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">No session telemetry recorded yet. Charts will render once patient completes tracking.</p>
      </div>
    );
  }

  // Show last 7 sessions in chronological order
  const chartData = [...data].slice(0, 8).reverse();
  const values = chartData.map(d => d[dataKey] || 0);
  const maxVal = Math.max(...values, targetVal || 10, 10) * 1.2; // padding top
  
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
      exerciseName: d.exerciseName || 'Rehab Routine',
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

  const gradId = `chartGrad-${dataKey}-${Math.random().toString(36).substring(7)}`;

  // Target threshold line Y
  const targetY = targetVal ? height - padding - (targetVal / maxVal) * (height - 2 * padding) : null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">{title}</h3>
        {targetVal && (
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            Goal Target: {targetVal}{unit}
          </span>
        )}
      </div>
      
      <div className="w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
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
                <text x={padding - 10} y={y + 4} fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end" className="font-mono">{val}{unit}</text>
              </g>
            );
          })}

          {/* Prescribed Target Threshold Line */}
          {targetY && targetY >= padding && targetY <= height - padding && (
            <g>
              <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
              <text x={width - padding + 5} y={targetY + 3} fill="#0d9488" fontSize="8" fontWeight="black" textAnchor="start">Target</text>
            </g>
          )}

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

          {/* Interactive Hover Tooltip */}
          {hoveredNode && (
            <g>
              <line 
                x1={hoveredNode.x} 
                y1={padding} 
                x2={hoveredNode.x} 
                y2={height - padding} 
                stroke="#94a3b8" 
                strokeWidth="1.5" 
                strokeDasharray="2 2"
              />
              <rect 
                x={hoveredNode.x - 55} 
                y={hoveredNode.y - 34} 
                width={110} 
                height={24} 
                rx="8" 
                fill="#0f172a" 
                className="shadow-xl"
              />
              <text 
                x={hoveredNode.x} 
                y={hoveredNode.y - 18} 
                fill="#ffffff" 
                fontSize="9" 
                fontWeight="black" 
                textAnchor="middle"
              >
                {hoveredNode.val}{unit} • {hoveredNode.exerciseName.split(' ')[0]}
              </text>
            </g>
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g 
              key={idx} 
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredNode(p)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="#ffffff" 
                stroke={color} 
                strokeWidth="3" 
                className="transition-all hover:r-7"
              />
              <text 
                x={p.x} 
                y={height - padding + 16} 
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