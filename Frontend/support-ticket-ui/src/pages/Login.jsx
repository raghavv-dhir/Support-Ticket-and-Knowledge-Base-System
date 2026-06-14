import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Login() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const resetFormStates = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setLoginError('');
    setRegError('');
    setRegSuccess('');
  };

  useEffect(() => {
    resetFormStates();
  }, []);

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

      if (data.role !== selectedRole) {
        throw new Error(`This account does not have permission to access the ${selectedRole} portal.`);
      }

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
          role: selectedRole // registers under the currently selected portal role
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
      setTimeout(() => {
        setIsRegistering(false);
      }, 1500);
    } catch (err) {
      setRegError(err.message);
    }
  };

  if (selectedRole === null) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '8px', color: '#0066cc' }}>Welcome to Ticket Support System</h2>
          <h3 style={{ fontSize: '1.1em', fontWeight: 'normal', color: '#666666', marginBottom: '25px' }}>
            Please select the portal role you would like to log in to:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => { resetFormStates(); setSelectedRole('Customer'); }}
              style={{ padding: '14px', fontSize: '15px' }}
            >
              Customer Portal
            </button>
            <button
              onClick={() => { resetFormStates(); setSelectedRole('Agent'); }}
              style={{ padding: '14px', fontSize: '15px', backgroundColor: '#008000', borderColor: '#006600' }}
            >
              Agent Portal
            </button>
            <button
              onClick={() => { resetFormStates(); setSelectedRole('Supervisor'); }}
              style={{ padding: '14px', fontSize: '15px', backgroundColor: '#475569', borderColor: '#334155' }}
            >
              Supervisor Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRegistering) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ marginBottom: '15px' }}>
            <a onClick={() => { resetFormStates(); setSelectedRole(null); setIsRegistering(false); }}>
              ← Back to Portal Selection
            </a>
          </div>
          <h2 style={{ fontSize: '1.3em', marginBottom: '4px', color: '#0066cc', textAlign: 'center' }}>
            Welcome to Ticket Support System
          </h2>
          <h3 style={{ fontSize: '1.1em', textAlign: 'center', marginBottom: '20px', fontWeight: '500' }}>
            Register ({selectedRole})
          </h3>
          {regError && <p className="error-msg">{regError}</p>}
          {regSuccess && <p className="success-msg">{regSuccess}</p>}
          <form onSubmit={handleRegister} style={{ border: 'none', padding: 0, boxShadow: 'none', margin: 0 }}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                autoComplete="new-name"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="new-email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" style={{ width: '100%' }}>Register Account</button>
          </form>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <span>Already have an account? </span>
            <a onClick={() => { resetFormStates(); setIsRegistering(false); }}>Move to Login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '15px' }}>
          <a onClick={() => { resetFormStates(); setSelectedRole(null); }}>
            ← Back to Portal Selection
          </a>
        </div>
        <h2 style={{ fontSize: '1.3em', marginBottom: '4px', color: '#0066cc', textAlign: 'center' }}>
          Welcome to Ticket Support System
        </h2>
        <h3 style={{ fontSize: '1.1em', textAlign: 'center', marginBottom: '20px', fontWeight: '500' }}>
          Login ({selectedRole})
        </h3>
        {loginError && <p className="error-msg">{loginError}</p>}
        <form onSubmit={handleLogin} style={{ border: 'none', padding: 0, boxShadow: 'none', margin: 0 }}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              ...(selectedRole === 'Agent'
                ? { backgroundColor: '#008000', borderColor: '#006600' }
                : selectedRole === 'Supervisor'
                ? { backgroundColor: '#475569', borderColor: '#334155' }
                : {})
            }}
          >
            Sign In
          </button>
        </form>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <span>Don't have an account? </span>
          <a onClick={() => { resetFormStates(); setIsRegistering(true); }}>Move to Signup</a>
        </div>
      </div>
    </div>
  );
}
