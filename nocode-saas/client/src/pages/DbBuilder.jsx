import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schemaApi } from '../api/apps';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiArrowLeft, FiDatabase, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './Builder.css';

const FIELD_TYPES = ['TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'JSONB'];

export default function DbBuilder() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedTable, setExpandedTable] = useState(null);
  const [newTable, setNewTable] = useState({ table_name: '', fields: [{ name: '', type: 'TEXT', required: false }] });

  useEffect(() => { loadTables(); }, [appId]);

  const loadTables = async () => {
    try {
      const res = await schemaApi.listTables(appId);
      setTables(res.data.tables || []);
    } catch { toast.error('Failed to load tables'); }
    finally { setLoading(false); }
  };

  const addField = () => {
    setNewTable(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', type: 'TEXT', required: false }],
    }));
  };

  const updateField = (index, key, value) => {
    setNewTable(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, [key]: value } : f),
    }));
  };

  const removeField = (index) => {
    setNewTable(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validFields = newTable.fields.filter(f => f.name.trim());
    if (!validFields.length) { toast.error('Add at least one field'); return; }
    try {
      await schemaApi.createTable(appId, { ...newTable, fields: validFields });
      toast.success(`Table "${newTable.table_name}" created!`);
      setShowCreate(false);
      setNewTable({ table_name: '', fields: [{ name: '', type: 'TEXT', required: false }] });
      loadTables();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create table');
    }
  };

  const handleDelete = async (tableId) => {
    if (!confirm('Delete this table? All data will be lost.')) return;
    try {
      await schemaApi.deleteTable(appId, tableId);
      setTables(prev => prev.filter(t => t.id !== tableId));
      toast.success('Table deleted');
    } catch { toast.error('Failed to delete table'); }
  };

  return (
    <div className="builder-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="page-title">Database Builder</h1>
            <p className="page-subtitle">Define tables and fields for your app</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-table-btn">
          <FiPlus /> New Table
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : tables.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FiDatabase size={48} /></div>
          <p className="empty-state-text">No tables yet — create your first table</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> Create Table
          </button>
        </div>
      ) : (
        <div className="tables-list">
          {tables.map(table => (
            <div key={table.id} className="table-item glass-card">
              <div
                className="table-item-header"
                onClick={() => setExpandedTable(expandedTable === table.id ? null : table.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FiDatabase className="table-icon" />
                  <div>
                    <span className="table-name">{table.table_name}</span>
                    <span className="table-field-count">{table.fields?.length || 0} fields</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}>
                    <FiTrash2 size={14} />
                  </button>
                  {expandedTable === table.id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>
              {expandedTable === table.id && (
                <div className="table-fields-detail">
                  <table className="data-table">
                    <thead>
                      <tr><th>Field Name</th><th>Type</th><th>Required</th></tr>
                    </thead>
                    <tbody>
                      {(table.fields || []).map((f, i) => (
                        <tr key={i}>
                          <td><code>{f.name}</code></td>
                          <td><span className="badge badge-info">{f.type}</span></td>
                          <td>{f.required ? '✓' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Table Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <h2 className="modal-title">Create Table</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Table Name</label>
                <input
                  id="table-name-input"
                  className="form-input"
                  placeholder="products"
                  value={newTable.table_name}
                  onChange={e => setNewTable(prev => ({ ...prev, table_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  required
                />
              </div>

              <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>Fields</label>
              {newTable.fields.map((field, i) => (
                <div key={i} className="field-row">
                  <input
                    className="form-input"
                    placeholder="field_name"
                    value={field.name}
                    onChange={e => updateField(i, 'name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    style={{ flex: 2 }}
                  />
                  <select
                    className="form-input"
                    value={field.type}
                    onChange={e => updateField(i, 'type', e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="field-required-label">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => updateField(i, 'required', e.target.checked)}
                    />
                    Req
                  </label>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeField(i)} disabled={newTable.fields.length <= 1}>
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={addField} style={{ marginTop: '8px' }}>
                <FiPlus size={14} /> Add Field
              </button>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="create-table-submit">Create Table</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
