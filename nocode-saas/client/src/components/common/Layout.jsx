import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiGrid, FiLogOut, FiBox, FiUser } from 'react-icons/fi';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <FiBox size={24} />
          </div>
          <span className="brand-text">NoCode</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <FiGrid size={18} />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FiUser size={16} />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.email?.split('@')[0]}</span>
              <span className="user-role">Owner</span>
            </div>
          </div>
          <button className="btn-ghost nav-item" onClick={handleLogout} id="logout-btn">
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
