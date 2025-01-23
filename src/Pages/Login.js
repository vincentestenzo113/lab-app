import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../Pages/supabaseClient';
import background from './images/liceo-campus.jpg';
import logo from './images/logo.png';

const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Get email using student ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('student_id', studentId)
        .single();

      if (userError) throw new Error(`Please reach out to the
IT Department as your
credentials are invalid`);

      // 2. Sign in with Supabase Auth using email
      const { data: { user, session }, error: authError } = 
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password,
        });

      if (authError) throw authError;

      // 3. Get user role from users table
      const { data: roleData, error: roleError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (roleError) throw roleError;

      if (!roleData.is_active) {
        throw new Error('Account is deactivated. Please contact admin.');
      }

      // 4. Store session data
      localStorage.setItem('token', session.access_token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userRole', roleData.role);
      localStorage.setItem('studentId', studentId);

      // 5. Redirect based on role
      if (roleData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
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
          Log in
        </h2>
        <p>
          Please sign in to continue
        </p>
      </div>
      
      <form onSubmit={handleLogin} className='form-container'>
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
        </div>

        <div className="button-container">
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default Login;
