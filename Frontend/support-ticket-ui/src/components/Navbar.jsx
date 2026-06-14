import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');

  if (!userStr) return null;
  const user = JSON.parse(userStr);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav>
      <div className="links">
        <strong>Support Ticket System</strong>
        {user.role === 'Customer' && (
          <>
            <Link to="/customer">My Tickets</Link>
            <Link to="/kb">Knowledge Base</Link>
          </>
        )}
        {(user.role === 'Agent' || user.role === 'Supervisor') && (
          <>
            <Link to="/board">Tickets Board</Link>
            <Link to="/kb">Knowledge Base</Link>
          </>
        )}
        {user.role === 'Supervisor' && (
          <Link to="/supervisor">Supervisor Dashboard</Link>
        )}
      </div>
      <div className="user-info">
        <span>{user.name} ({user.role})</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
