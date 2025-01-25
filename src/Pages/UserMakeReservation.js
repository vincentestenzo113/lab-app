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

      // Fetch existing reservations for the selected date
      const { data: existingReservations, error: fetchError } = await supabase
        .from("reservations")
        .select("*")
        .eq("date", date);

      if (fetchError) throw fetchError;

      // Check for existing reservation with status 'cancelled'
      const existingReservation = existingReservations.find(reservation => reservation.start_time === startTime);
      
      if (existingReservation) {
        // Update the reservation regardless of its status
        const { error: updateError } = await supabase
          .from("reservations")
          .update({
            user_id: userId,
            date,
            start_time: startTime,
            end_time: endTime,
            room: "Laboratory",
            status: startTime === "08:00" ? "morning" : "afternoon",
          })
          .eq("id", existingReservation.id); // Assuming 'id' is the primary key

        if (updateError) throw updateError;

        alert("Reservation updated successfully!");
        setDate("");
        setStartTime("");
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

      const isReserved = existingReservations.some(reservation => {
        const reservationStartTime = new Date(`${date}T${reservation.start_time}`);
        const reservationEndTime = new Date(reservationStartTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        // Allow reserving if the existing reservation is cancelled
        return (selectedStartTime < reservationEndTime && selectedEndTime > reservationStartTime && reservation.status !== 'cancelled');
      });

      if (isReserved) {
        setError("The selected time is already reserved. Please choose another time.");
        return;
      }

      const { error } = await supabase.from("reservations").insert([
        {
          user_id: userId,
          date,
          start_time: startTime, // Ensure startTime is set correctly
          end_time: endTime, // Set end time based on selection
          room: "Laboratory", // Default room name
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
      <form onSubmit={handleReservation}>
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
          <button type="submit">Make Reservation</button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default UserMakeReservation;
