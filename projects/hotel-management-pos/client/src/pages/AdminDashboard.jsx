import React, { useState, useEffect } from 'react';
import { Settings, Users, Grid, Coffee, Plus, Trash2 } from 'lucide-react';

export default function AdminDashboard({ api }) {
  const [activeTab, setActiveTab] = useState('staff');
  
  // Data State
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menu, setMenu] = useState([]);

  // Form States
  const [newStaff, setNewStaff] = useState({ name: '', role: 'cashier', pin: '' });
  const [newTable, setNewTable] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category_id: '' });

  const fetchData = async () => {
    try {
      const [staffRes, tablesRes, catRes, menuRes] = await Promise.all([
        fetch(\`\${api}/staff\`),
        fetch(\`\${api}/tables\`),
        fetch(\`\${api}/categories\`),
        fetch(\`\${api}/menu\`)
      ]);
      setStaff(await staffRes.json());
      setTables(await tablesRes.json());
      setCategories(await catRes.json());
      setMenu(await menuRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [api]);

  // Handlers
  const addStaff = async () => {
    await fetch(\`\${api}/staff\`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff)
    });
    setNewStaff({ name: '', role: 'cashier', pin: '' });
    fetchData();
  };

  const deleteStaff = async (id) => {
    await fetch(\`\${api}/staff/\${id}\`, { method: 'DELETE' });
    fetchData();
  };

  const addTable = async () => {
    await fetch(\`\${api}/tables\`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTable })
    });
    setNewTable('');
    fetchData();
  };

  const deleteTable = async (id) => {
    await fetch(\`\${api}/tables/\${id}\`, { method: 'DELETE' });
    fetchData();
  };

  const addCategory = async () => {
    await fetch(\`\${api}/categories\`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory })
    });
    setNewCategory('');
    fetchData();
  };

  const addMenuItem = async () => {
    await fetch(\`\${api}/menu\`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMenuItem, price: parseFloat(newMenuItem.price) })
    });
    setNewMenuItem({ name: '', price: '', category_id: '' });
    fetchData();
  };


  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar */}
      <div className="w-64 bg-surface rounded-xl shadow-lg p-4 h-[calc(100vh-80px)] top-0 sticky">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-primary mb-8 ml-2 mt-2">
          Admin Panel
        </h2>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('staff')} className={\`flex items-center gap-3 p-3 rounded-lg transition shrink-0 \${activeTab === 'staff' ? 'bg-primary/20 text-primary' : 'hover:bg-slate-800'}\`}>
             <Users size={20} /> Staff Accounts
          </button>
          <button onClick={() => setActiveTab('tables')} className={\`flex items-center gap-3 p-3 rounded-lg transition shrink-0 \${activeTab === 'tables' ? 'bg-primary/20 text-primary' : 'hover:bg-slate-800'}\`}>
             <Grid size={20} /> Table Setup
          </button>
          <button onClick={() => setActiveTab('menu')} className={\`flex items-center gap-3 p-3 rounded-lg transition shrink-0 \${activeTab === 'menu' ? 'bg-primary/20 text-primary' : 'hover:bg-slate-800'}\`}>
             <Coffee size={20} /> Menu Items
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-4">
        {activeTab === 'staff' && (
          <div className="bg-surface p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 border-b border-slate-700 pb-2">Manage Staff</h3>
            <div className="flex gap-4 mb-6 pt-2">
              <input value={newStaff.name} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} placeholder="Name" className="bg-slate-800 p-2 rounded flex-1" />
              <select value={newStaff.role} onChange={e=>setNewStaff({...newStaff, role: e.target.value})} className="bg-slate-800 p-2 rounded">
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen</option>
                <option value="waiter">Waiter</option>
                <option value="admin">Admin</option>
              </select>
              <input value={newStaff.pin} onChange={e=>setNewStaff({...newStaff, pin: e.target.value})} placeholder="4-Digit PIN" className="bg-slate-800 p-2 rounded w-32" />
              <button onClick={addStaff} className="bg-primary hover:bg-teal-600 text-white p-2 rounded-lg"><Plus /></button>
            </div>
            <table className="w-full text-left">
              <thead><tr className="text-slate-400 border-b border-slate-700"><th className="pb-2">Name</th><th className="pb-2">Role</th><th className="pb-2">Actions</th></tr></thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-slate-800/50">
                    <td className="py-3">{s.name}</td><td className="py-3 capitalize">{s.role}</td>
                    <td><button onClick={() => deleteStaff(s.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="bg-surface p-6 rounded-xl shadow-lg">
             <h3 className="text-xl font-semibold mb-4 border-b border-slate-700 pb-2">Dynamic Table Layout</h3>
             <div className="flex gap-4 mb-6 pt-2">
              <input value={newTable} onChange={e=>setNewTable(e.target.value)} placeholder="Table Name (e.g. T1, Balcony-1)" className="bg-slate-800 p-2 rounded flex-1" />
              <button onClick={addTable} className="bg-primary hover:bg-teal-600 px-6 py-2 rounded-lg font-semibold text-white">Add Table</button>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {tables.map(t => (
                 <div key={t.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center border border-slate-700">
                    <div>
                      <div className="font-bold text-lg text-primary">{t.name}</div>
                      <div className="text-xs text-slate-400">Current Status: {t.status}</div>
                    </div>
                    <button onClick={() => deleteTable(t.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><Trash2 size={18}/></button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-surface p-6 rounded-xl shadow-lg xl:col-span-1">
               <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Categories</h3>
               <div className="flex gap-2 mb-4">
                 <input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="New Category" className="bg-slate-800 p-2 rounded flex-1 text-sm shrink" />
                 <button onClick={addCategory} className="bg-slate-700 p-2 rounded hover:bg-slate-600"><Plus size={18}/></button>
               </div>
               <ul className="space-y-2 max-h-64 overflow-y-auto">
                 {categories.map(c => <li key={c.id} className="bg-slate-800/50 p-2 rounded text-sm">{c.name}</li>)}
               </ul>
            </div>
            
            <div className="bg-surface p-6 rounded-xl shadow-lg xl:col-span-2">
               <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Add Menu Item</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <input value={newMenuItem.name} onChange={e=>setNewMenuItem({...newMenuItem, name:e.target.value})} placeholder="Item Name" className="bg-slate-800 p-2 rounded col-span-2" />
                  <input value={newMenuItem.price} onChange={e=>setNewMenuItem({...newMenuItem, price:e.target.value})} placeholder="Price" type="number" className="bg-slate-800 p-2 rounded" />
                  <select value={newMenuItem.category_id} onChange={e=>setNewMenuItem({...newMenuItem, category_id:e.target.value})} className="bg-slate-800 p-2 rounded">
                    <option value="">Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={addMenuItem} className="bg-primary hover:bg-teal-600 text-white font-bold p-2 rounded col-span-full">Add to Menu</button>
               </div>
               
               <h3 className="text-lg font-semibold mb-2 text-slate-400">Current Items</h3>
               <div className="max-h-96 overflow-y-auto bg-slate-800/30 rounded-lg">
                 <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-800"><tr><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Price</th></tr></thead>
                    <tbody>
                      {menu.map(m => (
                        <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                          <td className="p-3 font-medium">{m.name}</td>
                          <td className="p-3 text-slate-400">{m.category_name}</td>
                          <td className="p-3 text-emerald-400 font-mono">₹{m.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
