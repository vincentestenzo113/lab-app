import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Pages/supabaseClient';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [reservationHistory, setReservationHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  // Form states for user management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchSchedules(),
      fetchUsers(),
      fetchReservationHistory(),
      fetchLogs(),
    ]);
  };

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, users(student_id)')
        .order('date', { ascending: true });
      if (error) throw error;
      setSchedules(data);
    } catch (error) {
      setError('Error fetching schedules: ' + error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      setError('Error fetching users: ' + error.message);
    }
  };

  const fetchReservationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, users(student_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReservationHistory(data);
    } catch (error) {
      setError('Error fetching reservation history: ' + error.message);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLogs(data);
    } catch (error) {
      setError('Error fetching logs: ' + error.message);
    }
  };

  // User Management Functions
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({
        email: username,
        password: password,
      });
      if (error) throw error;
      fetchUsers();
      resetForm();
    } catch (error) {
      setError('Error creating account: ' + error.message);
    }
  };

  const handleUpdateAccount = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ username, password })
        .eq('id', userId);
      if (error) throw error;
      fetchUsers();
      resetForm();
    } catch (error) {
      setError('Error updating account: ' + error.message);
    }
  };

  const handleDeactivateAccount = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this account?')) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_active: false })
          .eq('id', userId);
        if (error) throw error;
        fetchUsers();
      } catch (error) {
        setError('Error deactivating account: ' + error.message);
      }
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        const { error } = await supabase
          .from('logs')
          .delete()
          .eq('id', logId);
        if (error) throw error;
        fetchLogs();
      } catch (error) {
        setError('Error deleting log: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Do you want to Log out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      navigate('/login');
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setSelectedUser(null);
  };

  const handleDeleteReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      try {
        // Delete the reservation
        const { error } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservationId);

        if (error) throw error;

        // Refresh both lists
        await Promise.all([
          fetchReservationHistory(),
          fetchSchedules()
        ]);

        alert('Reservation deleted successfully!');
      } catch (error) {
        setError('Error deleting reservation: ' + error.message);
      }
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', reservationId);

        if (error) throw error;

        // Refresh both lists
        await Promise.all([
          fetchReservationHistory(),
          fetchSchedules()
        ]);

        alert('Reservation cancelled successfully!');
      } catch (error) {
        setError('Error cancelling reservation: ' + error.message);
      }
    }
  };

  const handleAcceptReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to accept this reservation?')) {
      try {
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'accepted' })
          .eq('id', reservationId);

        if (error) throw error;

        // Refresh both lists
        await Promise.all([
          fetchReservationHistory(),
          fetchSchedules()
        ]);

        alert('Reservation accepted successfully!');
      } catch (error) {
        setError('Error accepting reservation: ' + error.message);
      }
    }
  };

  const handleDeclineReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to decline this reservation?')) {
      try {
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'declined' })
          .eq('id', reservationId);

        if (error) throw error;

        // Refresh both lists
        await Promise.all([
          fetchReservationHistory(),
          fetchSchedules()
        ]);

        alert('Reservation declined successfully!');
      } catch (error) {
        setError('Error declining reservation: ' + error.message);
      }
    }
  };

  // Add a function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600';
      case 'declined':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Log Out
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-4 py-2 rounded text-white ${
            activeView === 'dashboard' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('reservationHistory')}
          className={`px-4 py-2 rounded text-white ${
            activeView === 'reservationHistory' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          Reservation History
        </button>
        <button
          onClick={() => setActiveView('userManagement')}
          className={`px-4 py-2 rounded text-white ${
            activeView === 'userManagement' ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveView('logs')}
          className={`px-4 py-2 rounded text-white ${
            activeView === 'logs' ? 'bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'
          }`}
        >
          View Logs
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current Schedule</h2>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Reserved by: {schedule.users?.student_id}</p>
                    <p>Date: {schedule.date}</p>
                    <p>Time: {schedule.start_time} - {schedule.end_time}</p>
                    <p className={`font-medium ${getStatusColor(schedule.status)}`}>
                      Status: {schedule.status}
                    </p>
                  </div>
                  <div className="space-x-2">
                    {schedule.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptReservation(schedule.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineReservation(schedule.id)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteReservation(schedule.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservation History */}
      {activeView === 'reservationHistory' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Reservation History</h2>
          <div className="space-y-4">
            {reservationHistory.map((reservation) => (
              <div key={reservation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Reserved by: {reservation.users?.student_id}</p>
                    <p>Date: {reservation.date}</p>
                    <p>Time: {reservation.start_time} - {reservation.end_time}</p>
                    <p className={`font-medium ${getStatusColor(reservation.status)}`}>
                      Status: {reservation.status}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDeleteReservation(reservation.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management */}
      {activeView === 'userManagement' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Manage Users</h2>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">User List</h3>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border p-4 rounded-lg">
                  <p>Email: {user.email}</p>
                  <p>Status: {user.is_active ? 'Active' : 'Inactive'}</p>
                  <div className="space-x-2 mt-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivateAccount(user.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs View */}
      {activeView === 'logs' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Logs</h2>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border p-4 rounded-lg">
                <p>Action: {log.action}</p>
                <p>Timestamp: {new Date(log.created_at).toLocaleString()}</p>
                <p>User: {log.user_email}</p>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded mt-2"
                >
                  Delete Log
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
