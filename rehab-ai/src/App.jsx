import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import PatientView from './pages/PatientView';
import DoctorDashboard from './pages/DoctorDashboard';
import Library from './pages/Library';
import ForDoctors from './pages/ForDoctors';

export default function App() {
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/scanner" element={<PatientView />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/for-doctors" element={<ForDoctors />} />
      </Routes>
    </Router>
  );
}