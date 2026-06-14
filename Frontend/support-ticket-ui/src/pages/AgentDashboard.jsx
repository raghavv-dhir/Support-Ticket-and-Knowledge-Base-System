import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const token = localStorage.getItem('token');

  // fetch tickets matching current filter settings
  const fetchTickets = async () => {
    setError('');
    try {
      let url = `${API_BASE_URL}/api/tickets?`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      if (priorityFilter) url += `priority=${encodeURIComponent(priorityFilter)}&`;
      if (assigneeFilter) url += `assignedToUserId=${encodeURIComponent(assigneeFilter)}&`;

      const res = await fetch(url, {
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
    fetchTickets();
  }, [statusFilter, priorityFilter, assigneeFilter]);

  return (
    <div>
      <h2>Tickets Board</h2>
      {error && <p className="error-msg">{error}</p>}

      {/* filters form */}
      <div style={{ border: '1px solid #cccccc', padding: '10px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
        <strong>Filters:</strong>
        <div className="dashboard-grid" style={{ marginTop: '10px', gap: '10px' }}>
          <div className="dashboard-col" style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Customer">Pending Customer</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="dashboard-col" style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="dashboard-col" style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Agent User ID</label>
            <input
              type="text"
              placeholder="e.g. 2"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* tickets list */}
      {tickets.length === 0 ? (
        <p>No tickets found matching filters.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Created By</th>
              <th>Assigned To</th>
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
                <td>{t.createdByName}</td>
                <td>{t.assignedToName || 'Unassigned'}</td>
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
                  <Link to={`/ticket/${t.id}`}>View / Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
