import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDatabase, FiLayout, FiPlay, FiShoppingCart, FiSettings } from 'react-icons/fi';

export default function AppBuilder() {
  const { appId } = useParams();
  const navigate = useNavigate();

  const sections = [
    { title: 'Database Builder', desc: 'Create tables and define fields', icon: <FiDatabase size={24} />, path: `/app/${appId}/db`, color: '#6c63ff' },
    { title: 'UI Builder', desc: 'Drag & drop to build interfaces', icon: <FiLayout size={24} />, path: `/app/${appId}/ui`, color: '#00d2ff' },
    { title: 'Preview', desc: 'See your app in action', icon: <FiPlay size={24} />, path: `/app/${appId}/preview`, color: '#10b981' },
    { title: 'POS Module', desc: 'Point of sale system', icon: <FiShoppingCart size={24} />, path: `/app/${appId}/pos`, color: '#f59e0b' },
  ];

  return (
    <div className="builder-page" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="page-title">App Builder</h1>
            <p className="page-subtitle">Choose what to build</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {sections.map(s => (
          <div
            key={s.title}
            className="glass-card"
            style={{ padding: '24px', cursor: 'pointer' }}
            onClick={() => navigate(s.path)}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `${s.color}20`, color: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px',
            }}>
              {s.icon}
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', marginBottom: '4px' }}>{s.title}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
