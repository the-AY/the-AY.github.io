import React, { useState, useEffect } from 'react';
import { Settings, Users, Grid, Coffee, Plus, Trash2, Monitor, RefreshCw, LogOut, Leaf, UtensilsCrossed, Save, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ api }) {
  const [activeTab, setActiveTab] = useState('staff');
  const navigate = useNavigate();

  // ── Data State ─────────────────────────────────────────
  const [staff,      setStaff]      = useState([]);
  const [tables,     setTables]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [menu,       setMenu]       = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [settings,   setSettings]   = useState({
    restaurant_name: '', address: '', fssai: '', gst_percent: 5.0,
    currency: '₹', cgst_sgst_split: 1,
  });

  // ── Form State ─────────────────────────────────────────
  const [newStaff,    setNewStaff]    = useState({ name: '', role: 'cashier', pin: '' });
  const [newTable,    setNewTable]    = useState({ name: '', seats: 4, section: 'Main Hall' });
  const [newCategory, setNewCategory] = useState('');
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category_id: '', image_url: '', is_veg: 1 });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Fetch helpers ──────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [sRes, tRes, cRes, mRes] = await Promise.all([
        fetch(`${api}/staff`), fetch(`${api}/tables`),
        fetch(`${api}/categories`), fetch(`${api}/menu`),
      ]);
      setStaff(await sRes.json());
      setTables(await tRes.json());
      setCategories(await cRes.json());
      setMenu(await mRes.json());
    } catch (_) {}
  };

  const fetchSettings = async () => {
    try {
      const r = await fetch(`${api}/settings`);
      if (r.ok) {
         const data = await r.json();
         if (data) setSettings(data);
      }
    } catch (_) {}
  };

  const fetchSessions = async () => {
    try {
      const r = await fetch(`${api}/sessions`);
      if (r.ok) {
         const data = await r.json();
         setSessions(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  };

  useEffect(() => { fetchAll(); fetchSettings(); }, [api]);
  useEffect(() => { if (activeTab === 'sessions') fetchSessions(); }, [activeTab]);

  // ── Staff ───────────────────────────────────────────────
  const addStaff = async () => {
    if (!newStaff.name || !newStaff.pin) return;
    await fetch(`${api}/staff`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    });
    setNewStaff({ name: '', role: 'cashier', pin: '' });
    fetchAll();
  };

  // ── Tables ──────────────────────────────────────────────
  const addTable = async () => {
    if (!newTable.name) return;
    await fetch(`${api}/tables`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTable),
    });
    setNewTable({ name: '', seats: 4, section: 'Main Hall' });
    fetchAll();
  };

  // ── Menu ────────────────────────────────────────────────
  const addCategory = async () => {
    if (!newCategory) return;
    await fetch(`${api}/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    });
    setNewCategory('');
    fetchAll();
  };

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price) return;
    await fetch(`${api}/menu`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMenuItem, price: parseFloat(newMenuItem.price), is_veg: parseInt(newMenuItem.is_veg) }),
    });
    setNewMenuItem({ name: '', price: '', category_id: '', image_url: '', is_veg: 1 });
    fetchAll();
  };

  const deleteMenuItem = async (id) => {
    await fetch(`${api}/menu/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  // ── Settings ────────────────────────────────────────────
  const saveSettings = async () => {
    await fetch(`${api}/settings`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, gst_percent: parseFloat(settings.gst_percent) }),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // ── Sessions ────────────────────────────────────────────
  const forceLogout = async (id) => {
    await fetch(`${api}/sessions/${id}`, { method: 'DELETE' });
    fetchSessions();
  };

  // ── Shared input style ──────────────────────────────────
  const inp = 'bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-primary focus:outline-none';

  const tabs = [
    { id: 'staff',    label: 'Staff',    icon: Users    },
    { id: 'tables',   label: 'Tables',   icon: Grid     },
    { id: 'menu',     label: 'Menu',     icon: Coffee   },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'sessions', label: 'Sessions', icon: Monitor  },
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-110px)]">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div className="w-56 bg-surface rounded-xl shadow-lg p-4 flex flex-col gap-1 shrink-0">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Admin Panel</h2>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition w-full text-left ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}

        <div className="mt-auto space-y-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => navigate('/cashier')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition w-full text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft size={18} />
            Back to POS
          </button>
          <button
            onClick={() => navigate('/kitchen')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition w-full text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft size={18} />
            Go to Kitchen
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4">

        {/* ═══ STAFF TAB ══════════════════════════════════ */}
        {activeTab === 'staff' && (
          <div className="bg-surface p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-700">Manage Staff</h3>
            {/* Add form */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <input value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="Name" className={`${inp} flex-1 min-w-32`} />
              <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                className={inp}>
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen</option>
                <option value="waiter">Waiter</option>
                <option value="admin">Admin</option>
              </select>
              <input value={newStaff.pin} onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })}
                placeholder="4-Digit PIN" maxLength={6} className={`${inp} w-32`} />
              <button onClick={addStaff}
                className="bg-primary hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
                <Plus size={16} /> Add
              </button>
            </div>
            {/* Table */}
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="pb-2">Name</th><th className="pb-2">Role</th><th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                        s.role === 'admin'   ? 'bg-purple-500/20 text-purple-400' :
                        s.role === 'kitchen' ? 'bg-orange-500/20 text-orange-400' :
                        s.role === 'waiter'  ? 'bg-blue-500/20 text-blue-400' :
                                              'bg-teal-500/20 text-teal-400'
                      }`}>{s.role}</span>
                    </td>
                    <td>
                      <button onClick={() => { fetch(`${api}/staff/${s.id}`, { method: 'DELETE' }).then(fetchAll); }}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ TABLES TAB ══════════════════════════════════ */}
        {activeTab === 'tables' && (
          <div className="bg-surface p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-700">Table Layout</h3>
            <div className="flex gap-3 mb-6 flex-wrap">
              <input value={newTable.name} onChange={e => setNewTable({ ...newTable, name: e.target.value })}
                placeholder="Table Name (e.g. T1, VIP-1)" className={`${inp} flex-1 min-w-32`} />
              <input value={newTable.seats} type="number" min={1} max={20}
                onChange={e => setNewTable({ ...newTable, seats: parseInt(e.target.value) })}
                placeholder="Seats" className={`${inp} w-24`} />
              <input value={newTable.section} onChange={e => setNewTable({ ...newTable, section: e.target.value })}
                placeholder="Section (e.g. Main Hall, Balcony)" className={`${inp} flex-1 min-w-32`} />
              <button onClick={addTable}
                className="bg-primary hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
                <Plus size={16} /> Add Table
              </button>
            </div>
            {/* Grouped by section */}
            {[...new Set(tables.map(t => t.section || 'Main Hall'))].map(section => (
              <div key={section} className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{section}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {tables.filter(t => (t.section || 'Main Hall') === section).map(t => (
                    <div key={t.id}
                      className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-primary text-lg">{t.name}</span>
                        <button onClick={() => { fetch(`${api}/tables/${t.id}`, { method: 'DELETE' }).then(fetchAll); }}
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="text-xs text-slate-400">{t.seats} seats</div>
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                        t.status === 'occupied' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{t.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ MENU TAB ════════════════════════════════════ */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Categories */}
            <div className="bg-surface p-6 rounded-xl shadow-lg">
              <h3 className="text-base font-semibold mb-4 pb-2 border-b border-slate-700">Categories</h3>
              <div className="flex gap-2 mb-4">
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  placeholder="New category" className={`${inp} flex-1 text-sm`} />
                <button onClick={addCategory}
                  className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg transition">
                  <Plus size={18} />
                </button>
              </div>
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {categories.map(c => (
                  <li key={c.id} className="bg-slate-800/60 px-3 py-2 rounded-lg text-sm text-slate-300">{c.name}</li>
                ))}
              </ul>
            </div>

            {/* Add Item + Item List */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-surface p-6 rounded-xl shadow-lg">
                <h3 className="text-base font-semibold mb-4 pb-2 border-b border-slate-700">Add Menu Item</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input value={newMenuItem.name} onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                    placeholder="Item name" className={`${inp} col-span-2`} />
                  <input value={newMenuItem.price} type="number"
                    onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                    placeholder="Price (₹)" className={inp} />
                  <select value={newMenuItem.category_id}
                    onChange={e => setNewMenuItem({ ...newMenuItem, category_id: e.target.value })}
                    className={inp}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {/* Image URL */}
                  <input value={newMenuItem.image_url}
                    onChange={e => setNewMenuItem({ ...newMenuItem, image_url: e.target.value })}
                    placeholder="Image URL (optional)" className={`${inp} col-span-2`} />
                  {/* Preview */}
                  {newMenuItem.image_url && (
                    <div className="col-span-2">
                      <img src={newMenuItem.image_url} alt="preview"
                        className="h-20 w-32 object-cover rounded-lg border border-slate-700"
                        onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                  {/* Veg toggle */}
                  <div className="col-span-2 flex gap-3">
                    <button onClick={() => setNewMenuItem({ ...newMenuItem, is_veg: 1 })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        newMenuItem.is_veg === 1
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <Leaf size={14} /> Vegetarian
                    </button>
                    <button onClick={() => setNewMenuItem({ ...newMenuItem, is_veg: 0 })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        newMenuItem.is_veg === 0
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <UtensilsCrossed size={14} /> Non-Veg
                    </button>
                  </div>
                  <button onClick={addMenuItem}
                    className="col-span-2 bg-primary hover:bg-teal-600 text-white font-bold py-2 rounded-lg transition">
                    Add to Menu
                  </button>
                </div>
              </div>

              {/* Menu list */}
              <div className="bg-surface p-6 rounded-xl shadow-lg">
                <h3 className="text-base font-semibold mb-3 text-slate-400">Current Menu ({menu.length} items)</h3>
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {menu.map(m => (
                    <div key={m.id}
                      className="flex items-center gap-3 bg-slate-800/40 rounded-lg p-2 hover:bg-slate-800/70 transition">
                      {m.image_url
                        ? <img src={m.image_url} alt={m.name}
                            className="w-10 h-10 rounded object-cover shrink-0"
                            onError={e => { e.target.style.display = 'none'; }} />
                        : <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 text-xs">No img</div>
                      }
                      {/* Veg dot */}
                      <span className={`w-2.5 h-2.5 rounded-sm border-2 shrink-0 ${m.is_veg ? 'border-green-500' : 'border-red-500'}`} />
                      <span className="flex-1 text-sm font-medium truncate">{m.name}</span>
                      <span className="text-xs text-slate-400 w-24 truncate">{m.category_name}</span>
                      <span className="text-emerald-400 font-mono text-sm w-16 text-right">₹{m.price.toFixed(0)}</span>
                      <button onClick={() => deleteMenuItem(m.id)}
                        className="text-red-400 hover:bg-red-500/10 p-1 rounded transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS TAB ════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="bg-surface p-6 rounded-xl shadow-lg max-w-2xl">
            <h3 className="text-lg font-semibold mb-6 pb-2 border-b border-slate-700">Restaurant Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">Restaurant Name</label>
                <input value={settings?.restaurant_name || ''}
                  onChange={e => setSettings({ ...settings, restaurant_name: e.target.value })}
                  className={`${inp} w-full`} placeholder="e.g. Sagar Hotel" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">Address (shown on bill)</label>
                <textarea value={settings?.address || ''}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  rows={2} className={`${inp} w-full resize-none`} placeholder="123 Main Road, Bangalore - 560001" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">FSSAI License No.</label>
                <input value={settings?.fssai || ''}
                  onChange={e => setSettings({ ...settings, fssai: e.target.value })}
                  className={`${inp} w-full`} placeholder="10012345678901" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">GST %</label>
                  <input value={settings?.gst_percent || ''} type="number" min={0} max={28} step={0.5}
                    onChange={e => setSettings({ ...settings, gst_percent: parseFloat(e.target.value) })}
                    className={`${inp} w-full`} />
                  {settings?.gst_percent > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Split: CGST {(settings?.gst_percent / 2).toFixed(1)}% + SGST {(settings?.gst_percent / 2).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">Currency Symbol</label>
                  <input value={settings?.currency || '₹'}
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    className={`${inp} w-full`} placeholder="₹" />
                </div>
              </div>
              <button onClick={saveSettings}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition mt-4 ${
                  settingsSaved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary hover:bg-teal-600 text-white'
                }`}>
                <Save size={16} />
                {settingsSaved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ═══ SESSIONS TAB ════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div className="bg-surface p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
              <h3 className="text-lg font-semibold">Active Sessions</h3>
              <button onClick={fetchSessions}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-800">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {(!sessions || sessions.length === 0)
              ? <p className="text-slate-500 text-sm text-center py-8">No active sessions in the last 5 minutes.</p>
              : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wide">
                      <th className="pb-2">Staff</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Login Time</th>
                      <th className="pb-2">Last Seen</th>
                      <th className="pb-2">Device</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sessions || []).map(s => (
                      <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                        <td className="py-3 font-medium">{s.staff_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                            s.role === 'admin'   ? 'bg-purple-500/20 text-purple-400' :
                            s.role === 'kitchen' ? 'bg-orange-500/20 text-orange-400' :
                            s.role === 'waiter'  ? 'bg-blue-500/20 text-blue-400' :
                                                  'bg-teal-500/20 text-teal-400'
                          }`}>{s.role}</span>
                        </td>
                        <td className="py-3 text-slate-400 text-xs">{new Date(s.login_time).toLocaleTimeString()}</td>
                        <td className="py-3 text-slate-400 text-xs">{new Date(s.last_ping).toLocaleTimeString()}</td>
                        <td className="py-3 text-slate-500 text-xs max-w-[200px] truncate">{(s.device || '').split(' ')[0]}</td>
                        <td>
                          <button onClick={() => forceLogout(s.id)}
                            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs hover:bg-red-500/10 px-2 py-1 rounded transition">
                            <LogOut size={12} /> Force Logout
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        )}

      </div>
    </div>
  );
}
