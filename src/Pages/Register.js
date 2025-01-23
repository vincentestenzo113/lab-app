import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../Pages/supabaseClient';   
import background from './images/liceo-campus.jpg';
import logo from './images/logo.png';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      // Check if student ID already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('student_id', studentId)
        .single();

      if (existingUser) {
        throw new Error('Student ID already registered');
      }

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Insert user data into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email,
            student_id: studentId,
            role: 'user',
            is_active: true
          }
        ]);

      if (insertError) throw insertError;

      navigate('/login');
      alert('Registration successful! You can now login.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='main'>
      <div className='logo'> 
        <img src={logo}></img>
      </div>
       <div className="image-container">
         <img src={background} className="background-image" alt="Background" />
       </div>
      <div className='home'>
        <div className='sign-title'>
          <h2>
            Create your account
          </h2>
        </div>
        
        <form onSubmit={handleRegister} className='form-container'>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="input-group">
            <div className="input-field">
              <label htmlFor="student-id">
                User ID
              </label>
              <input
                id="student-id"
                name="student-id"
                type="text"
                required
                placeholder="User ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input"
              />
            </div>
            <div className="input-field">
              <label htmlFor="email-address">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>
            <div className="input-field">
              <label htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>
            <div className="input-field">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="button-container">
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="register-link">
            <Link to="/login">
              Already have an account? Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
