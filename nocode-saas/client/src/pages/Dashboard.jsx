import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appsApi } from '../api/apps';
import toast from 'react-hot-toast';
import { FiPlus, FiDatabase, FiLayout, FiPlay, FiShoppingCart, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import './Dashboard.css';

export default function Dashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const res = await appsApi.list();
      setApps(res.data.apps || []);
    } catch {
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await appsApi.create(newApp);
      setApps(prev => [res.data.app, ...prev]);
      setShowCreate(false);
      setNewApp({ name: '', description: '' });
      toast.success('App created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create app');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this app? This cannot be undone.')) return;
    try {
      await appsApi.remove(id);
      setApps(prev => prev.filter(a => a.id !== id));
      toast.success('App deleted');
    } catch {
      toast.error('Failed to delete app');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Apps</h1>
          <p className="page-subtitle">Create and manage your no-code applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-app-btn">
          <FiPlus /> New App
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}>
          <div className="spinner" />
        </div>
      ) : apps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📱</div>
          <p className="empty-state-text">No apps yet — create your first one!</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> Create App
          </button>
        </div>
      ) : (
        <div className="apps-grid">
          {apps.map((app, i) => (
            <div
              key={app.id}
              className="app-card glass-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="app-card-header">
                <div className="app-card-icon">
                  {app.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="app-card-meta">
                  <h3 className="app-card-name">{app.name}</h3>
                  <span className={`badge badge-${app.status === 'published' ? 'success' : 'warning'}`}>
                    {app.status || 'draft'}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(app.id)} title="Delete">
                  <FiTrash2 size={14} />
                </button>
              </div>
              {app.description && (
                <p className="app-card-desc">{app.description}</p>
              )}
              <div className="app-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/${app.id}/db`)}>
                  <FiDatabase size={14} /> Database
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/${app.id}/ui`)}>
                  <FiLayout size={14} /> UI Builder
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/${app.id}/preview`)}>
                  <FiPlay size={14} /> Preview
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/${app.id}/pos`)}>
                  <FiShoppingCart size={14} /> POS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create App Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New App</h2>
            <form onSubmit={handleCreate} className="auth-form">
              <div className="form-group">
                <label className="form-label">App Name</label>
                <input
                  id="app-name-input"
                  className="form-input"
                  placeholder="My Awesome App"
                  value={newApp.name}
                  onChange={e => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  id="app-desc-input"
                  className="form-input"
                  placeholder="What will this app do?"
                  rows={3}
                  value={newApp.description}
                  onChange={e => setNewApp(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="create-app-submit">Create App</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
