import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [agentIdInput, setAgentIdInput] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [commentContent, setCommentContent] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const ALLOWED_TRANSITIONS = {
    'Open': ['InProgress'],
    'InProgress': ['PendingCustomer', 'Resolved'],
    'PendingCustomer': ['InProgress'],
    'Resolved': ['Closed'],
    'Closed': []
  };

  // fetch details of this ticket
  const fetchTicketDetails = async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Ticket not found or access denied');
      }

      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  // assign ticket to agent
  const handleAssignAgent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentUserId: parseInt(agentIdInput, 10) })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to assign ticket');
      }

      setSuccess('Ticket assigned successfully!');
      setAgentIdInput('');
      fetchTicketDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  // change ticket status
  const handleStatusUpdate = async (newStatus) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newStatus, note: statusNote })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update status');
      }

      setSuccess(`Status updated to ${newStatus}`);
      setStatusNote('');
      fetchTicketDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  // post comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentContent })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add comment');
      }

      setCommentContent('');
      setSuccess('Comment added!');
      fetchTicketDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !ticket) {
    return (
      <div style={{ padding: '20px' }}>
        <p className="error-msg">{error}</p>
        <Link to="/">Back to Dashboard</Link>
      </div>
    );
  }

  if (!ticket) {
    return <p>Loading ticket details...</p>;
  }

  const nextStatuses = ALLOWED_TRANSITIONS[ticket.status] || [];

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <Link to="/">← Back to Dashboard</Link>
      </div>

      <h2>Ticket #{ticket.id}: {ticket.title}</h2>
      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="dashboard-grid">
        {/* ticket details left column */}
        <div className="dashboard-col" style={{ flex: 2 }}>
          <div className="details-box">
            <h3>Details</h3>
            <div className="details-row">
              <span className="details-label">Description:</span>
              <span>{ticket.description}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Priority:</span>
              <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                {ticket.priority}
              </span>
            </div>
            <div className="details-row">
              <span className="details-label">Status:</span>
              <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                {ticket.status}
              </span>
            </div>
            <div className="details-row">
              <span className="details-label">Created By:</span>
              <span>{ticket.createdByName}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Assigned Agent:</span>
              <span>{ticket.assignedToName || 'Unassigned'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Created At:</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <div className="details-row">
              <span className="details-label">SLA Deadline:</span>
              <span>{new Date(ticket.slaDeadline).toLocaleString()}</span>
            </div>
            <div className="details-row">
              <span className="details-label">SLA Status:</span>
              {ticket.isSlaBreached ? (
                <span className="badge badge-breached">Breached</span>
              ) : (
                <span className="badge badge-onsla">On SLA</span>
              )}
            </div>
          </div>

          {/* timeline history log */}
          <div className="details-box">
            <h3>Timeline Audit Log</h3>
            {ticket.history && ticket.history.length === 0 ? (
              <p>No history updates.</p>
            ) : (
              <ul className="timeline">
                {ticket.history.map((h) => (
                  <li key={h.id} className="timeline-item">
                    <div>
                      <strong>Changed Status</strong> from <em>{h.oldStatus || 'Open'}</em> to <strong>{h.newStatus}</strong>
                    </div>
                    {h.note && <div><small>Note: {h.note}</small></div>}
                    <div className="timeline-time">
                      by {h.changedByName} on {new Date(h.changedAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* management actions right column */}
        <div className="dashboard-col" style={{ flex: 1 }}>
          {/* assign agent (Agent role only) */}
          {user.role === 'Agent' && ticket.status !== 'Closed' && (
            <div className="details-box">
              <h3>Assign Agent</h3>
              <form onSubmit={handleAssignAgent} style={{ border: 'none', padding: 0 }}>
                <div className="form-group">
                  <label>Agent User ID</label>
                  <input
                    type="number"
                    placeholder="Enter Agent User ID"
                    value={agentIdInput}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                    required
                  />
                </div>
                <button type="submit">Assign</button>
              </form>
            </div>
          )}

          {/* status updates (Agent & Supervisor only) */}
          {(user.role === 'Agent' || user.role === 'Supervisor') && ticket.status !== 'Closed' && (
            <div className="details-box">
              <h3>Manage Status</h3>
              <div className="form-group">
                <label>Transition Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. customer fixed issue"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {nextStatuses.length === 0 ? (
                  <span>No transitions allowed</span>
                ) : (
                  nextStatuses.map((s) => (
                    <button key={s} onClick={() => handleStatusUpdate(s)}>
                      Move to {s}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* comments thread */}
          <div className="details-box">
            <h3>Comments</h3>
            <form onSubmit={handleAddComment} style={{ border: 'none', padding: 0 }}>
              <div className="form-group">
                <textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit">Post Comment</button>
            </form>

            <div className="comments-list">
              {ticket.comments && ticket.comments.length === 0 ? (
                <p>No comments posted yet.</p>
              ) : (
                ticket.comments.map((c) => (
                  <div key={c.id} className="comment-card">
                    <div className="comment-header">
                      <span>{c.userName}</span>
                      <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-line' }}>{c.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
