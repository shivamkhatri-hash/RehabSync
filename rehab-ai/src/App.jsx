import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import PatientView from './pages/PatientView';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PhysioDashboard from './pages/PhysioDashboard';
import Library from './pages/Library';
import ForDoctors from './pages/ForDoctors';
import AccuracyBench from './pages/AccuracyBench';

export default function App() {
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/patient" element={<PatientView />} />
        <Route path="/scanner" element={<PatientView />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/physio" element={<PhysioDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/for-doctors" element={<ForDoctors />} />
        <Route path="/accuracy-bench" element={<AccuracyBench />} />
      </Routes>
    </Router>
  );
}