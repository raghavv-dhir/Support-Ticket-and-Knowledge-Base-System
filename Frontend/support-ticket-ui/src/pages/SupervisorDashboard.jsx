import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function SupervisorDashboard() {
  const [workloads, setWorkloads] = useState([]);
  const [breachedTickets, setBreachedTickets] = useState([]);
  const [workloadError, setWorkloadError] = useState('');
  const [breachedError, setBreachedError] = useState('');

  // fetch metrics data
  const fetchData = async () => {
    const token = localStorage.getItem('token');

    try {
      const workloadRes = await fetch(`${API_BASE_URL}/api/dashboard/agent-workload`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!workloadRes.ok) {
        throw new Error('Failed to load agent workloads');
      }
      const workloadData = await workloadRes.json();
      setWorkloads(workloadData);
    } catch (err) {
      setWorkloadError(err.message);
    }

    try {
      const breachedRes = await fetch(`${API_BASE_URL}/api/tickets/breached`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!breachedRes.ok) {
        throw new Error('Failed to load breached tickets');
      }
      const breachedData = await breachedRes.json();
      setBreachedTickets(breachedData);
    } catch (err) {
      setBreachedError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h2>Supervisor Dashboard</h2>

      <div className="dashboard-grid">
        {/* agent workload section */}
        <div className="dashboard-col" style={{ flex: 1 }}>
          <h3>Agent Workloads</h3>
          {workloadError && <p className="error-msg">{workloadError}</p>}
          {workloads.length === 0 ? (
            <p>No agent data available.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Open Tickets</th>
                  <th>Resolved Tickets</th>
                  <th>Breached Tickets</th>
                </tr>
              </thead>
              <tbody>
                {workloads.map((w) => (
                  <tr key={w.agentUserId}>
                    <td>{w.agentName}</td>
                    <td>{w.openTicketCount}</td>
                    <td>{w.resolvedTicketCount}</td>
                    <td>{w.breachedTicketCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* breached tickets section */}
        <div className="dashboard-col" style={{ flex: 1 }}>
          <h3>SLA-Breached Tickets</h3>
          {breachedError && <p className="error-msg">{breachedError}</p>}
          {breachedTickets.length === 0 ? (
            <p>No SLA-breached tickets currently.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Hours Overdue</th>
                  <th>Assigned To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {breachedTickets.map((t) => (
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
                    <td>
                      <span className="badge badge-breached" style={{ fontWeight: 'bold' }}>
                        {t.hoursOverdue} hrs overdue
                      </span>
                    </td>
                    <td>{t.assignedToName || 'Unassigned'}</td>
                    <td>
                      <Link to={`/ticket/${t.id}`}>View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
