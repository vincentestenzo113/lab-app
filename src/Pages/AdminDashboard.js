import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Pages/supabaseClient';
import logo from './images/logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [reservationHistory, setReservationHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  // Form states for laboratory management
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  
  // Form states for user management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const [calendar, setCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [userProfile, setUserProfile] = useState({ name: '', profilePicture: '' });

  const [myReservations, setMyReservations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchUserData();
    generateCalendar();
  }, [currentMonth]);

  const fetchUserData = async () => {
    await Promise.all([fetchAllReservations(), fetchAvailableSlots(), fetchUserProfile()]);
  };

  const fetchAllReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*");

      if (error) throw error;
      setMyReservations(data || []);
      generateCalendar();
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("lab_availability")
        .select("*")
        .eq("is_available", true);

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleReservation = async (date, startTime) => {
    try {
      const userId = localStorage.getItem("userId");

      // Calculate end time (1 hour after start time)
      const [hours, minutes] = startTime.split(":");
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endTime = `${endDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

      const { error } = await supabase.from("reservations").insert([
        {
          user_id: userId,
          date,
          start_time: startTime,
          end_time: endTime,
          room: "Laboratory", // Default room name
          status: "pending",
        },
      ]);

      if (error) throw error;

      fetchUserData();
      alert("Reservation created successfully!");
    } catch (error) {
      setError(error.message);
    }
  };

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
        .select('*')
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
        .select('*, users(*)')
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

  // Laboratory Management Functions
  const handleLabAvailability = async (e) => {
    e.preventDefault();
    try {
      // Calculate end time (1 hour after start time)
      const [hours, minutes] = startTime.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('lab_availability')
        .upsert([
          {
            date,
            start_time: startTime,
            end_time: endTime,
            room: 'Laboratory' // Default room name
          }
        ]);
      if (error) throw error;
      fetchSchedules();
      resetForm();
    } catch (error) {
      setError('Error updating lab availability: ' + error.message);
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
    setDate('');
    setStartTime('');
    setEndTime('');
    setRoom('');
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

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 0).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [];

    // Adjust the start of the week to Monday
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

    // Fill in the days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendarDays.push({ date: null, status: 'empty' });
    }

    // Fill in the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const formattedDate = date.toISOString().split('T')[0];

      const reservation = myReservations.find(
        (reservation) => reservation.date === formattedDate
      );

      calendarDays.push({
        date: formattedDate,
        status: reservation ? reservation.status : 'available',
      });
    }

    // Ensure the last day of the month is included
    if (calendarDays.length % 7 !== 0) {
      const remainingDays = 7 - (calendarDays.length % 7);
      for (let i = 0; i < remainingDays; i++) {
        calendarDays.push({ date: null, status: 'empty' });
      }
    }

    setCalendar(calendarDays);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'red';
      case 'pending':
        return 'yellow';
      case 'available':
        return 'white';
      default:
        return 'white';
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  return (
    <div className='main'>

    <div className='logo'> 
        <img src={logo}></img>
      </div>

      {/* Navigation */}
      <div className='nav'>
      <div>
        <h1>Admin Dashboard</h1>
      </div>
      <div className='home-container'>
        <button
          onClick={() => setActiveView('dashboard')}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('reservationHistory')}
        >
          Reservation History
        </button>
        <button
          onClick={() => setActiveView('labManagement')}
        >
          Manage Laboratory
        </button>
        <button
          onClick={() => setActiveView('userManagement')}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveView('logs')}
        >
          View Logs
        </button>
        <button
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
          <div className="dashboard-container">
             {/* Calendar View */}
        <h2>Calendar</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['M', 'T', 'W', 'Th', 'F', 'S', 'Su'].map((day, index) => (
            <div key={index} style={{ textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </div>
          ))}
          {calendar.map((day, index) => (
            <div
              key={index}
              style={{
                backgroundColor: getStatusColor(day.status),
                padding: '10px',
                border: '1px solid #ccc',
                textAlign: 'center',
              }}
            >
              {day.date ? new Date(day.date).getDate() : ''}
            </div>
          ))}
        </div>
        <div className="bottom-container">
        <div className="month-button">
          <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <div>
          <button onClick={handlePreviousMonth}>Previous</button>
          <button onClick={handleNextMonth}>Next</button>
          </div>
        </div>
        <div>
          <p>Color code:</p>
          <p style={{ color: 'red' }}>Red - Reserved</p>
          <p style={{ color: 'yellow' }}>Yellow - Pending</p>
          <p style={{ color: 'white' }}>White - Available</p>
        </div>
        </div>
      </div>
      )}

      {/* Reservation History */}
      {activeView === 'reservationHistory' && (
        <div className='main-container'>
          <h2>Reservation History</h2>
          <div className='box-container'>
            {reservationHistory.map((reservation) => (
              <div key={reservation.id}>
                <div>
                  <div>
                    <p>User: {reservation.users?.email}</p>
                    <p>Room: {reservation.room}</p>
                    <p>Date: {reservation.date}</p>
                    <p>Time: {reservation.start_time} - {reservation.end_time}</p>
                    <p>
                      Status: {reservation.status}
                    </p>
                  </div>
                  <div className='admin-button'>
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptReservation(reservation.id)}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineReservation(reservation.id)}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteReservation(reservation.id)}
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

      {/* Laboratory Management */}
      {activeView === 'labManagement' && (
        <div className='main-container'>
          <h2>Manage Laboratory Availability</h2>
          <form onSubmit={handleLabAvailability}>
            <div className='make-container'>
            <div>
              <label>Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Start Time:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
            >
              Save Changes
            </button>
            </div>
          </form>
        </div>
      )}

      {/* User Management */}
      {activeView === 'userManagement' && (
        <div className='main-container'>
          <h2>Manage Users</h2>
          <form onSubmit={selectedUser ? () => handleUpdateAccount(selectedUser.id) : handleAddAccount}>
            <div className='make-container'>
            <div>
              <label>Username/Email:</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
            >
              {selectedUser ? 'Update Account' : 'Add Account'}
            </button>
            </div>
          </form>

          <div>
            <h3>User List</h3>
            <div className='box-container'>
              {users.map((user) => (
                <div key={user.id}>
                  <p>Email: {user.email}</p>
                  <p>Status: {user.is_active ? 'Active' : 'Inactive'}</p>
                  <div className='admin-button'>
                    <button
                      onClick={() => setSelectedUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivateAccount(user.id)}
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
        <div className='main-container'>
          <h2>System Logs</h2>
          <div>
            {logs.map((log) => (
              <div key={log.id}>
                <p>Action: {log.action}</p>
                <p>Timestamp: {new Date(log.created_at).toLocaleString()}</p>
                <p>User: {log.user_email}</p>
                <button
                  onClick={() => handleDeleteLog(log.id)}
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
