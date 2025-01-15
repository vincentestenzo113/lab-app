import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Pages/supabaseClient';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [reservations, setReservations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState(null);
  const [myReservations, setMyReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(false);

  // Form states
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    await Promise.all([
      fetchReservations(),
      fetchAvailableSlots(),
    ]);
  };

  const fetchReservations = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setMyReservations(data || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_availability')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      
      // Calculate end time (1 hour after start time)
      const [hours, minutes] = startTime.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: userId,
            date,
            start_time: startTime,
            end_time: endTime,
            room: 'Laboratory', // Default room name
            status: 'pending'
          }
        ]);

      if (error) throw error;

      resetForm();
      fetchUserData();
      alert('Reservation created successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;

      fetchReservations();
      setSelectedReservation(null);
      alert('Reservation cancelled successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setDate('');
    setStartTime('');
  };

  const handleLogout = () => {
    if (window.confirm('Do you want to Log out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Lab Reservation System</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Make a Reservation</h2>
            <form onSubmit={handleReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Make Reservation
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-sm rounded-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">My Reservations</h2>
            <div className="space-y-4">
              {myReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Room: {reservation.room}</p>
                      <p>Date: {reservation.date}</p>
                      <p>Time: {reservation.start_time} - {reservation.end_time}</p>
                      <p>Status: {reservation.status}</p>
                    </div>
                    {reservation.status === 'pending' && (
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
