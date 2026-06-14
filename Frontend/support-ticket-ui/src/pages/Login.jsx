import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// handles user authentication and registration
export default function Login() {
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Customer');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // submit login request
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!res.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId
      }));

      navigate('/');
      window.location.reload(); // refresh to load proper navbar
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // submit registration request
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Registration failed');
      }

      setRegSuccess('Registration successful! Please login.');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegRole('Customer');
    } catch (err) {
      setRegError(err.message);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="dashboard-col">
        <h2>Login</h2>
        {loginError && <p className="error-msg">{loginError}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Sign In</button>
        </form>
      </div>

      <div className="dashboard-col">
        <h2>Register</h2>
        {regError && <p className="error-msg">{regError}</p>}
        {regSuccess && <p className="success-msg">{regSuccess}</p>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>User Role</label>
            <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
              <option value="Customer">Customer</option>
              <option value="Agent">Agent</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>
          <button type="submit">Register Account</button>
        </form>
      </div>
    </div>
  );
}
