import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../Pages/supabaseClient";
import profile from './images/profile.jpg';
import logo from './images/logo.png';

const UserMakeReservation = ({ onReservationSuccess }) => {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({ student_id: "" });
  const [room, setRoom] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user profile data
    const fetchUserProfile = async () => {
      const userId = localStorage.getItem("userId");
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
      if (error) {
        setError(error.message);
      } else {
        setUserProfile(data);
      }
    };

    // Get date from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dateFromUrl = urlParams.get('date');
    if (dateFromUrl) {
      setDate(dateFromUrl); // Set the date from URL
    }

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("userId");
    // Redirect to login page
    navigate("/login");
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    
    // Check if the selected date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for comparison

    if (selectedDate < today) {
        setError("You cannot reserve a date in the past. Please select a future date.");
        return;
    }

    try {
      const userId = localStorage.getItem("userId");

      // Determine the status based on the selected start time
      const status = startTime === "08:00" ? "morning" : "afternoon";

      // Fetch existing reservations for the selected date, status, and room
      const { data: existingReservations, error: fetchError } = await supabase
        .from("reservations")
        .select("date, start_time, room, status") // Fetch status to check for cancellations
        .eq("date", date)
        .eq("status", status)
        .eq("room", room); // Check for all users on the specific date, status, and room

      if (fetchError) throw fetchError;

      // Check if any reservation exists with the same date, status, and room
      const isReserved = existingReservations.length > 0;

      if (isReserved) {
        setError("The selected date, time, and room are already reserved. Please choose another time or room.");
        return;
      }

      // Determine selected start time and end time based on user choice
      let selectedStartTime;
      let endTime;

      if (startTime === "08:00") {
        selectedStartTime = new Date(`${date}T08:00`);
        endTime = "12:00"; // End time for morning
      } else if (startTime === "13:00") {
        selectedStartTime = new Date(`${date}T13:00`);
        endTime = "17:00"; // End time for afternoon
      } else {
        // Handle case where startTime is not set correctly
        setError("Invalid time selection. Please choose either Morning or Afternoon.");
        return;
      }

      const selectedEndTime = new Date(selectedStartTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      // Check if the current user or any user has a reservation with the same date, status, and room
      const isUserAlreadyReserved = existingReservations.some(reservation => {
        return reservation.user_id === userId && reservation.date === date && reservation.status === status && reservation.room === room;
      });

      if (isUserAlreadyReserved) {
        setError("You already have a reservation for this date, time, and room, or the slot is taken by another user. Please choose another time or room.");
        return;
      }

      const { error } = await supabase.from("reservations").insert([
        {
          user_id: userId,
          date,
          start_time: startTime, // Ensure startTime is set correctly
          end_time: endTime, // Set end time based on selection
          room: room,
          status: startTime === "08:00" ? "morning" : "afternoon", // Set status based on user choice
        },
      ]);

      if (error) throw error;

      if (typeof onReservationSuccess === 'function') {
        onReservationSuccess();
      }
      alert("Reservation created successfully!");
      setDate("");
      setStartTime("");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="main">
    <div className='logo'> 
        <img src={logo} alt="Lab Reservation System Logo"></img>
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

          <div>
            <Link to="/user">
              <button>Dashboard</button>
            </Link>
          </div>
          <div>
            <Link to="/make-reservation">
              <button   className="active">Make a Reservation</button>
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
    <div className="main-container">
      <h2>Make a Reservation</h2>
      {error && <div>{error}</div>}
      <form onSubmit={handleReservation} className="form">
        <div className="make-container">
          <div>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Choose Time</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            >
              <option value="" disabled>Select Time</option>
              <option value="08:00">Morning (8 AM - 12 PM)</option>
              <option value="13:00">Afternoon (1 PM - 5 PM)</option>
            </select>
          </div>
          <div>
            <label>Choose Laboratory</label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            >
              <option value="1">Computer lab 1 - WAC 212</option>
              <option value="2">Computer lab 2 - WAC 213</option>
              <option value="3">Computer lab 3 - NAC 303</option>
            </select>
          </div>
          <button type="submit">Make Reservation</button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default UserMakeReservation;
