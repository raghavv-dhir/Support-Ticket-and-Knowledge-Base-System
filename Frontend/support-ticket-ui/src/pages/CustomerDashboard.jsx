import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Low');

  const token = localStorage.getItem('token');

  // fetch tickets on load
  const fetchMyTickets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  // handle new ticket submission
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, priority })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to create ticket');
      }

      setSuccess('Ticket created successfully!');
      setTitle('');
      setDescription('');
      setPriority('Low');
      
      fetchMyTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Customer Panel</h2>
      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="dashboard-grid">
        {/* ticket list */}
        <div className="dashboard-col" style={{ flex: 2 }}>
          <h3>My Tickets</h3>
          {tickets.length === 0 ? (
            <p>You have not submitted any tickets yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Deadline</th>
                  <th>SLA Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>
                      <span className={`badge badge-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status.replace(/\s+/g, '').toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{new Date(t.slaDeadline).toLocaleString()}</td>
                    <td>
                      {t.isSlaBreached ? (
                        <span className="badge badge-breached">Breached</span>
                      ) : (
                        <span className="badge badge-onsla">On Time</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/ticket/${t.id}`}>View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* create ticket form */}
        <div className="dashboard-col" style={{ flex: 1 }}>
          <h3>Submit New Ticket</h3>
          <form onSubmit={handleSubmitTicket} style={{ width: '100%' }}>
            <div className="form-group">
              <label>Ticket Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Description / Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <button type="submit">Submit Ticket</button>
          </form>
        </div>
      </div>
    </div>
  );
}
