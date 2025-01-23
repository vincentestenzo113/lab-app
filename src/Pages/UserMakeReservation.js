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
      // Assuming you have a function to fetch user data
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
      if (error) {
        setError(error.message);
      } else {
        setUserProfile(data);
      }
    };

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
          {error && <div>{error}</div>}

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
          <label>Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <button type="submit">Make Reservation</button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default UserMakeReservation;
