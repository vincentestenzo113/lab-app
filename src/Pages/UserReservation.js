import React, { useState, useEffect } from "react";
import { supabase } from "../Pages/supabaseClient";
import { Link } from "react-router-dom";
import logo from "./images/logo.png";
import profile from "./images/profile.jpg";

const UserReservation = () => {
  const [myReservations, setMyReservations] = useState([]);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const reservationsPerPage = 6; // Number of reservations per page

  useEffect(() => {
    fetchReservations();
    fetchUserProfile();
  }, []);

  const fetchReservations = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      // Sort reservations by id in ascending order
      setMyReservations((data || []).sort((a, b) => a.id - b.id));
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchUserProfile = async () => {
    const userId = localStorage.getItem("userId");
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setUserProfile(data);
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
      alert("Reservation cancelled successfully!");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * reservationsPerPage < myReservations.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="main">
      <div className='logo'> 
        <img src={logo} alt="Logo" />
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
              <button>Make a Reservation</button>
            </Link>
          </div>
          <div>
            <Link to="/my-reservations">
              <button   className="active">My Reservations</button>
            </Link>
          </div>
          <div>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
      <div className="main-container">
        <h2>My Reservations</h2>
        {error && <div>{error}</div>}
        <div className="box-container">
          {myReservations
            .slice(
              currentPage * reservationsPerPage,
              (currentPage + 1) * reservationsPerPage
            )
            .map((reservation) => (
              <div key={reservation.id}>
                <div>
                  <p>Room: {reservation.room}</p>
                  <p>Date: {reservation.date}</p>
                  <p>
                    Time: {reservation.start_time} - {reservation.end_time}
                  </p>
                  <p>
                    Status:  
                    <p
                      style={{
                        color: reservation.status === "morning" ? "orange" : reservation.status === "afternoon" ? "yellow" : "gray",
                      }}
                    >
                      {reservation.status.toUpperCase()}
                    </p>
                  </p>
                </div>
                {reservation.status !== "cancelled" && (
                  <button onClick={() => handleCancelReservation(reservation.id)}>
                    Cancel Reservation
                  </button>
                )}
              </div>
            ))}
        </div>
        <div className="pagination-buttons">
          <button onClick={handlePrevPage} disabled={currentPage === 0}>
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={(currentPage + 1) * reservationsPerPage >= myReservations.length}
          >
            Next
          </button>
        </div> 
      </div>
    </div>
  );
};

export default UserReservation;
