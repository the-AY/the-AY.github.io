import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uiApi, schemaApi } from '../api/apps';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiPlay, FiLayout, FiType, FiGrid, FiList, FiSquare, FiPieChart } from 'react-icons/fi';
import './Builder.css';

const COMPONENT_TYPES = [
  { type: 'STAT_CARD', label: 'Stat Card', icon: <FiPieChart /> },
  { type: 'DATA_TABLE', label: 'Data Table', icon: <FiList /> },
  { type: 'FORM', label: 'Form', icon: <FiSquare /> },
  { type: 'BUTTON', label: 'Button', icon: <FiGrid /> },
  { type: 'TEXT', label: 'Text Block', icon: <FiType /> },
];

function SortableComponent({ comp, isSelected, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: comp.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`dropped-component ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(comp.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="dropped-component-label">{comp.type}</span>
        <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onRemove(comp.id); }} style={{ padding: '4px 8px' }}>✕</button>
      </div>
      <div style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {comp.props?.title || comp.type}
      </div>
    </div>
  );
}

export default function UiBuilder() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [components, setComponents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pageName, setPageName] = useState('main');
  const [tables, setTables] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadPage();
    loadTables();
  }, [appId]);

  const loadPage = async () => {
    try {
      const res = await uiApi.listPages(appId);
      const pages = res.data.pages || [];
      if (pages.length > 0) {
        setPageName(pages[0].page_name);
        setComponents(pages[0].layout?.components || []);
      }
    } catch {}
  };

  const loadTables = async () => {
    try {
      const res = await schemaApi.listTables(appId);
      setTables(res.data.tables || []);
    } catch {}
  };

  const addComponent = (type) => {
    const newComp = {
      id: `comp-${Date.now()}`,
      type,
      gridSpan: 12,
      props: { title: `New ${type}` },
      dataBinding: {},
    };
    setComponents(prev => [...prev, newComp]);
    setSelectedId(newComp.id);
  };

  const removeComponent = (id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateComponentProp = (key, value) => {
    setComponents(prev => prev.map(c =>
      c.id === selectedId ? { ...c, props: { ...c.props, [key]: value } } : c
    ));
  };

  const updateComponentBinding = (key, value) => {
    setComponents(prev => prev.map(c =>
      c.id === selectedId ? { ...c, dataBinding: { ...c.dataBinding, [key]: value } } : c
    ));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setComponents(prev => {
        const oldIndex = prev.findIndex(c => c.id === active.id);
        const newIndex = prev.findIndex(c => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    const layout = {
      pageId: pageName,
      title: pageName,
      grid: { columns: 12, gap: '16px' },
      components,
    };
    try {
      await uiApi.savePage(appId, { page_name: pageName, layout });
      toast.success('Layout saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const selectedComp = components.find(c => c.id === selectedId);

  return (
    <div className="builder-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="page-title">UI Builder</h1>
            <p className="page-subtitle">Drag and drop components to build your layout</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/app/${appId}/preview`)}>
            <FiPlay size={14} /> Preview
          </button>
          <button className="btn btn-primary" onClick={handleSave} id="save-layout-btn">
            <FiSave size={14} /> Save
          </button>
        </div>
      </div>

      <div className="ui-builder-layout">
        {/* Toolbox */}
        <div className="toolbox-panel">
          <div className="toolbox-title">Components</div>
          {COMPONENT_TYPES.map(ct => (
            <div
              key={ct.type}
              className="toolbox-item"
              onClick={() => addComponent(ct.type)}
            >
              {ct.icon}
              <span>{ct.label}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="canvas-area">
          {components.length === 0 ? (
            <div className="canvas-placeholder">
              <FiLayout size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Click components from the toolbox to add them</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="canvas-drop-zone">
                  {components.map(comp => (
                    <SortableComponent
                      key={comp.id}
                      comp={comp}
                      isSelected={selectedId === comp.id}
                      onSelect={setSelectedId}
                      onRemove={removeComponent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Property Panel */}
        <div className="property-panel">
          <div className="property-title">Properties</div>
          {selectedComp ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={selectedComp.props?.title || ''}
                  onChange={e => updateComponentProp('title', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grid Span (1-12)</label>
                <input
                  className="form-input"
                  type="number"
                  min={1} max={12}
                  value={selectedComp.gridSpan || 12}
                  onChange={e => setComponents(prev => prev.map(c =>
                    c.id === selectedId ? { ...c, gridSpan: parseInt(e.target.value) || 12 } : c
                  ))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data Source (Table)</label>
                <select
                  className="form-input"
                  value={selectedComp.dataBinding?.table || ''}
                  onChange={e => updateComponentBinding('table', e.target.value)}
                >
                  <option value="">None</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.table_name}>{t.table_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">API Endpoint</label>
                <input
                  className="form-input"
                  value={selectedComp.dataBinding?.endpoint || ''}
                  onChange={e => updateComponentBinding('endpoint', e.target.value)}
                  placeholder="/api/apps/.../data/..."
                />
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Select a component to edit its properties
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
