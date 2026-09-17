import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import PoseCareLogo from '../components/PoseCareLogo';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDoctorForAssign, setSelectedDoctorForAssign] = useState({});

  // Auth Protection - Ensure only admin can view this page
  useEffect(() => {
    if (!token || !user || user.role !== 'admin') {
      alert('Access Denied: Administrator privileges required.');
      navigate('/auth');
      return;
    }
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats & Recent Sessions
      const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentSessions(statsData.recentSessions || []);
      }

      // 2. Fetch User Directory
      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Role Change Handler (Promote/Demote)
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to "${newRole.toUpperCase()}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(data.message);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Doctor to Patient Handler
  const handleAssignDoctor = async (patientId) => {
    const doctorId = selectedDoctorForAssign[patientId];
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${patientId}/assign-doctor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User Account Handler
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ CAUTION: Are you sure you want to permanently delete user "${userName}" and all their sessions? This action cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Users List
  const doctorsList = users.filter(u => u.role === 'doctor');
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-20 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 text-xl font-bold shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">PoseCare Admin Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200 tracking-wider">
                  Super Admin RBAC
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">System governance, user roles, security, and audit logs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading || actionLoading}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <span>🔄</span> Refresh Data
            </button>
            <button
              onClick={() => navigate('/doctor')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/15 transition-all"
            >
              Doctor Portal ↗
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* SECTION 1: SYSTEM KPI METRICS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Total Users</span>
                <span className="text-lg">👥</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-teal-600">Doctors</span>
                <span className="text-lg">🩺</span>
              </div>
              <p className="text-2xl font-black text-teal-600">{stats.totalDoctors}</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-blue-600">Patients</span>
                <span className="text-lg">🏃</span>
              </div>
              <p className="text-2xl font-black text-blue-600">{stats.totalPatients}</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-600">Admins</span>
                <span className="text-lg">⚡</span>
              </div>
              <p className="text-2xl font-black text-purple-600">{stats.totalAdmins}</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-600">Total Sessions</span>
                <span className="text-lg">📈</span>
              </div>
              <p className="text-2xl font-black text-amber-600">{stats.totalSessions}</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600">Prescriptions</span>
                <span className="text-lg">📋</span>
              </div>
              <p className="text-2xl font-black text-emerald-600">{stats.totalPrescriptions}</p>
            </div>
          </div>
        )}

        {/* SECTION 2: USER DIRECTORY & RBAC CONTROLS */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🛡️</span> User Directory & Role-Based Access Control
              </h2>
              <p className="text-xs text-slate-500 font-medium">Manage user authorization, promote doctors/admins, and assign patients</p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap items-center gap-3">
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-60 shadow-xs"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-4 px-6">User / Account</th>
                  <th className="py-4 px-6">Current Role</th>
                  <th className="py-4 px-6">Assigned Doctor</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u._id === user.id;
                    const roleBadgeColor = {
                      admin: 'bg-purple-50 text-purple-700 border-purple-200',
                      doctor: 'bg-teal-50 text-teal-700 border-teal-200',
                      patient: 'bg-blue-50 text-blue-700 border-blue-200'
                    }[u.role] || 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Email */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {u.name}
                            {isSelf && (
                              <span className="text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px]">{u.email}</div>
                        </td>

                        {/* Current Role with Quick Selector */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${roleBadgeColor}`}>
                              {u.role}
                            </span>
                            {!isSelf && (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                className="bg-white border border-slate-300 text-[11px] font-semibold rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
                              >
                                <option value="patient">Set as Patient</option>
                                <option value="doctor">Set as Doctor</option>
                                <option value="admin">Set as Admin</option>
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Assigned Doctor (for Patients) */}
                        <td className="py-4 px-6">
                          {u.role === 'patient' ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedDoctorForAssign[u._id] || (u.assignedDoctorId?._id || '')}
                                onChange={(e) => setSelectedDoctorForAssign({ ...selectedDoctorForAssign, [u._id]: e.target.value })}
                                className="bg-white border border-slate-300 text-[11px] font-semibold rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[160px] shadow-xs"
                              >
                                <option value="">Unassigned</option>
                                {doctorsList.map(doc => (
                                  <option key={doc._id} value={doc._id}>{doc.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignDoctor(u._id)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>✓</span> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>⏳</span> Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all shadow-xs"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: REAL-TIME SESSION AUDIT LOG */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>📋</span> Recent Clinical Session Audit Logs
              </h3>
              <p className="text-xs text-slate-500 font-medium">Live telemetry of workouts and rehab exercises performed on PoseCare</p>
            </div>
            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full">Latest 8 Sessions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentSessions.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-4 py-6 text-center font-medium">No session activity recorded yet.</p>
            ) : (
              recentSessions.map((s, idx) => (
                <div key={idx} className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-2.5 hover:shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-teal-700 text-xs">{s.exerciseName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Patient: <span className="text-slate-900 font-bold">{s.patientId?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span className="font-semibold">{s.reps_completed} Reps</span>
                    <span className="text-emerald-600 font-black">{s.max_angle_achieved}° Max</span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600 font-medium">{s.gamePlayed}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
