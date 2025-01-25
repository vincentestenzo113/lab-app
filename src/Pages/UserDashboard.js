import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../Pages/supabaseClient";
import UserMakeReservation from "./UserMakeReservation";
import UserReservation from "./UserReservation";
import profile from './images/profile.jpg';
import logo from './images/logo.png';
import { IoCheckmarkSharp, IoCheckmarkDoneSharp, IoClose } from 'react-icons/io5';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [reservations, setReservations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState(null);
  const [myReservations, setMyReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(false);

  // Form states
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const [calendar, setCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [userProfile, setUserProfile] = useState({ name: '', profilePicture: '' });

  const [tooltip, setTooltip] = useState({ visible: false, content: '' });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    fetchUserData();
    fetchUserProfile();
  }, [currentMonth]);

  const fetchUserData = async () => {
    await Promise.all([fetchReservations(), fetchAvailableSlots()]);
    generateCalendar();
  };

  const fetchReservations = async () => {
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
        .select("student_id")
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

  const handleCancelReservation = async (reservationId) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

      fetchReservations();
      setSelectedReservation(null);
      alert("Reservation cancelled successfully!");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Do you want to Log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      navigate("/login");
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

      const userId = localStorage.getItem("userId");
      const reservationsForDay = myReservations.filter(
        (reservation) => reservation.date === formattedDate && reservation.user_id === userId
      );

      const morningReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'morning'
      );
      const afternoonReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'afternoon'
      );
      const cancelledReservation = reservationsForDay.find(
        (reservation) => reservation.status === 'cancelled'
      );

      // Update status logic to prioritize reserved over cancelled
      calendarDays.push({
        date: formattedDate,
        status: (morningReservation || afternoonReservation) ? 
          (morningReservation && afternoonReservation ? 'red' : (afternoonReservation ? 'afternoon' : 'morning')) : 
          (cancelledReservation ? 'empty' : 'empty'),
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
      case 'morning':
        return 'orange';
      case 'afternoon':
        return 'yellow';
      case 'red':
        return 'red';
      case 'empty':
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

  const handleMouseEnter = (event, content) => {
    setTooltip({ visible: true, content });
    // Set tooltip position based on mouse coordinates
    setTooltipPosition({ top: event.clientY, left: event.clientX });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '' });
  };

  return (
    <div className="main">
      <div className='logo'> 
        <img src={logo}></img>
      </div>
      <div className="nav">     
              <div>
                <h1>Lab Reservation System</h1>
                <div className="profile-container">
                  <div className="profile-img">
                    <img src={profile} alt="Profile" />
                  </div>
                  <h3>Profile</h3>
                  <h4>{userProfile.student_id}</h4>
                </div>
              </div>
        <div className="home-container">
          {error && <div>{error}</div>}

          <div>
            <Link to="/user">
              <button className="active">Dashboard</button>
            </Link>
          </div>
          <div>
            <Link to="/make-reservation">
              <button>Make a Reservation</button>
            </Link>
          </div>
          <div>
            <Link to="/my-reservations">
              <button>My Reservations</button>
            </Link>
            </div>
            <div>
              <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="dashboard-container">
        <h2>Calendar</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['M', 'T', 'W', 'Th', 'F', 'S', 'Su'].map((day, index) => (
            <div key={index} style={{ textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </div>
          ))}
          {calendar.map((day, index) => {
            // Find reservations for the current day for the logged-in user
            const userId = localStorage.getItem("userId"); // Get the logged-in user's ID
            const reservationsForDay = myReservations.filter(
              (reservation) => reservation.date === day.date && reservation.user_id === userId // Filter by user ID
            );

            const morningReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'morning'
            );
            const afternoonReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'afternoon'
            );
            const cancelledReservation = reservationsForDay.find(
              (reservation) => reservation.status === 'cancelled'
            );

            const reservationTimes = reservationsForDay.map(reservation => 
              `${reservation.start_time} - ${reservation.end_time}`
            ).join(', '); // Join times for tooltip

            return (
              <div
                key={index}
                style={{
                  backgroundColor: getStatusColor(day.status),
                  padding: '10px',
                  border: '1px solid #ccc',
                  textAlign: 'center',
                  position: 'relative', // Set position relative for absolute positioning of icons
                }}
                title={reservationTimes.length > 0 ? `Reservations: ${reservationTimes}` : 'No reservations'} // Show times on hover
                onMouseEnter={(event) => handleMouseEnter(event, reservationTimes)}
                onMouseLeave={handleMouseLeave}
              >
                {day.date ? new Date(day.date).getDate() : ''}
                {/* Conditional rendering of icons */}
                {cancelledReservation ? (
                  <IoClose style={{ 
                    position: 'absolute', 
                    right: '0', 
                    bottom: '0', 
                    margin: '1px', 
                    fontSize: '1em', // Make it smaller
                    color: 'red' // Set color to red
                  }} />
                ) : morningReservation && afternoonReservation ? (
                  <IoCheckmarkDoneSharp style={{ 
                    position: 'absolute', 
                    right: '0', 
                    bottom: '0', 
                    margin: '1px', 
                    fontSize: '1em', // Make it smaller
                    color: 'green' 
                  }} />
                ) : morningReservation || afternoonReservation ? (
                  <IoCheckmarkSharp style={{ 
                    position: 'absolute', 
                    right: '0', 
                    bottom: '0', 
                    margin: '1px', 
                    fontSize: '1em', // Make it smaller
                    color: 'green' 
                  }} />
                ) : null}
              </div>
            );
          })}
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
          <p>Color code Reservation:</p>
          <p style={{ color: 'orange' }}>Orange - Morning</p>
          <p style={{ color: 'yellow' }}>Yellow - Afternoon</p>
          <p style={{ color: 'red' }}>Red - Whole Day</p>
          <p style={{ color: 'white' }}>White - Available</p>
        </div>
        </div>
      </div>

      {tooltip.visible && (
        <div className="tooltip" style={{ position: 'absolute', top: tooltipPosition.top, left: tooltipPosition.left, backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px', borderRadius: '5px' }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
