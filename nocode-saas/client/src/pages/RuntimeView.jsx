import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uiApi, dataApi } from '../api/apps';
import { FiArrowLeft, FiEdit } from 'react-icons/fi';

/* Component Map — renders each component type */
function StatCard({ props, data }) {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {props?.title || 'Stat'}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '4px', color: props?.color || 'var(--accent-primary)' }}>
        {data ?? '—'}
      </div>
    </div>
  );
}

function DataTableComp({ props, data }) {
  const columns = props?.columns || [];
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="glass-card" style={{ padding: '20px', overflow: 'auto' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>{props?.title || 'Table'}</h3>
      <table className="data-table">
        <thead>
          <tr>
            {columns.length > 0
              ? columns.map(col => <th key={col.key || col}>{col.label || col}</th>)
              : rows[0] && Object.keys(rows[0]).map(k => <th key={k}>{k}</th>)
            }
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, props?.pageSize || 10).map((row, i) => (
            <tr key={i}>
              {(columns.length > 0 ? columns.map(c => c.key || c) : Object.keys(row)).map(k => (
                <td key={k}>{typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '')}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={99} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FormComp({ props }) {
  const fields = props?.fields || [];
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>{props?.title || 'Form'}</h3>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fields.map((f, i) => (
          <div className="form-group" key={i}>
            <label className="form-label">{f.label || f.name}</label>
            <input className="form-input" type={f.type || 'text'} placeholder={f.label || f.name} />
          </div>
        ))}
        <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          {props?.submitLabel || 'Submit'}
        </button>
      </form>
    </div>
  );
}

function ButtonComp({ props }) {
  return (
    <button className={`btn btn-${props?.variant || 'primary'}`}>
      {props?.label || 'Button'}
    </button>
  );
}

function TextComp({ props }) {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
        {props?.title || 'Text block'}
      </div>
    </div>
  );
}

const ComponentMap = {
  STAT_CARD: StatCard,
  DATA_TABLE: DataTableComp,
  FORM: FormComp,
  BUTTON: ButtonComp,
  TEXT: TextComp,
};

export default function RuntimeView() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [dataCache, setDataCache] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLayout(); }, [appId]);

  const loadLayout = async () => {
    try {
      const res = await uiApi.listPages(appId);
      const pages = res.data.pages || [];
      if (pages.length > 0) {
        const page = pages[0];
        setLayout(page.layout);
        // Load data for components with bindings
        if (page.layout?.components) {
          for (const comp of page.layout.components) {
            if (comp.dataBinding?.table) {
              try {
                const dataRes = await dataApi.listRows(appId, comp.dataBinding.table);
                setDataCache(prev => ({ ...prev, [comp.id]: dataRes.data.rows }));
              } catch {}
            }
          }
        }
      }
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  if (!layout) return (
    <div className="builder-page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
          <FiArrowLeft /> Back
        </button>
      </div>
      <div className="empty-state">
        <p className="empty-state-text">No layout configured — go to the UI Builder first</p>
        <button className="btn btn-primary" onClick={() => navigate(`/app/${appId}/ui`)}>
          <FiEdit /> Open UI Builder
        </button>
      </div>
    </div>
  );

  return (
    <div className="builder-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <FiArrowLeft />
          </button>
          <h1 className="page-title">{layout.title || 'Preview'}</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/app/${appId}/ui`)}>
          <FiEdit size={14} /> Edit
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.grid?.columns || 12}, 1fr)`,
        gap: layout.grid?.gap || '16px',
      }}>
        {layout.components?.map(comp => {
          const Component = ComponentMap[comp.type];
          if (!Component) return null;
          return (
            <div key={comp.id} style={{ gridColumn: `span ${comp.gridSpan || 12}` }}>
              <Component props={comp.props} data={dataCache[comp.id]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
