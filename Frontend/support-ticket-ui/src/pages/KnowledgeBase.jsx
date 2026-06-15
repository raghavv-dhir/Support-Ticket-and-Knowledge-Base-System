import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // fetch articles using query filter
  const fetchArticles = async () => {
    setError('');
    try {
      const url = searchQuery 
        ? `${API_BASE_URL}/api/kb/articles?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/api/kb/articles`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await res.json();
      setArticles(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [searchQuery]);

  // handle create article form submission
  const handleCreateArticle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/kb/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, body, tags })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to create article');
      }

      setSuccess('Article created successfully!');
      setTitle('');
      setBody('');
      setTags('');
      
      fetchArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Knowledge Base</h2>
      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      {/* search input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search articles by title, body, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="dashboard-grid">
        {/* article list column */}
        <div className="dashboard-col" style={{ flex: 2 }}>
          <h3>Articles</h3>
          {articles.length === 0 ? (
            <p>No articles found.</p>
          ) : (
            articles.map((a) => (
              <div key={a.id} className="details-box" style={{ marginBottom: '15px' }}>
                <h4>{a.title}</h4>
                <div style={{ fontSize: '0.85em', color: '#666666', marginBottom: '8px' }}>
                  Posted by {a.createdByName} on {new Date(a.createdAt).toLocaleDateString()}
                  {a.tags && ` | Tags: ${a.tags}`}
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{a.body}</div>
              </div>
            ))
          )}
        </div>

        {/* create article form column (Agent role only) */}
        {user.role === 'Agent' && (
          <div className="dashboard-col" style={{ flex: 1 }}>
            <h3>Create New Article</h3>
            <form onSubmit={handleCreateArticle} style={{ width: '100%' }}>
              <div className="form-group">
                <label>Article Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. login, error, windows"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Content Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit">Publish Article</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
