import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Printer, Check, Search, MapPin, Bike } from 'lucide-react';

export default function CashierPOS({ api }) {
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]); // Running orders

  const [selectedTable, setSelectedTable] = useState(null); // ID of table or null if parcel
  const [orderType, setOrderType] = useState('dine-in'); // dine-in, parcel, swiggy, zomato
  const [currentOrder, setCurrentOrder] = useState(null); // The actual active order object {id, total}
  
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const printRef = useRef(null);
  const [printData, setPrintData] = useState(null); // { type: 'KOT' | 'BILL', items: [], table: '', etc }

  const fetchData = async () => {
    try {
      const [tRes, mRes, cRes, oRes] = await Promise.all([
        fetch(`${api}/tables`), fetch(`${api}/menu`), fetch(`${api}/categories`), fetch(`${api}/orders/running`)
      ]);
      setTables(await tRes.json());
      setMenu(await mRes.json());
      setCategories(await cRes.json());
      setOrders(await oRes.json());
    } catch (err) { }
  };

  useEffect(() => { fetchData() }, [api]);

  // Derived state
  const filteredMenu = menu.filter(m => 
    (selectedCategory === 'All' || m.category_id === parseInt(selectedCategory)) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const activeOrderDetails = currentOrder ? currentOrder : null; // In a full app, we'd fetch previous KOT items here

  // Actions
  const handleSelectTable = (table) => {
    setSelectedTable(table.id);
    setOrderType('dine-in');
    const existing = orders.find(o => o.table_id === table.id && o.status === 'running');
    setCurrentOrder(existing || null);
    setCart([]);
  };

  const handleSelectParcel = (type) => {
    setSelectedTable(null);
    setOrderType(type);
    setCurrentOrder(null);
    setCart([]);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, notes: '' }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.menu_item_id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const handleKOT = async () => {
    if (cart.length === 0) return;
    
    let orderId = currentOrder?.id;
    // If no order exists for this table/parcel, create one
    if (!orderId) {
      const oRes = await fetch(`${api}/orders`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ table_id: selectedTable, type: orderType })
      });
      const oData = await oRes.json();
      orderId = oData.id;
      setCurrentOrder(oData);
    }

    // Add items to KOT
    await fetch(`${api}/orders/${orderId}/items`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ items: cart })
    });

    // Trigger Print KOT
    const tableName = selectedTable ? tables.find(t=>t.id===selectedTable)?.name : 'Parcel';
    setPrintData({ type: 'KOT', id:`KOT-${orderId}-${Date.now()}`, items: [...cart], table: tableName, oType: orderType });
    
    // Reset cart but keep order active
    setCart([]);
    fetchData();
    setTimeout(() => { window.print(); }, 500); // Wait for react to render print template
  };

  const handleCheckout = async () => {
    if (!currentOrder) return;
    await fetch(`${api}/orders/${currentOrder.id}/checkout`, { method: 'POST' });
    
    // Trigger Print Bill
    const tableName = selectedTable ? tables.find(t=>t.id===selectedTable)?.name : 'Parcel';
    setPrintData({ type: 'BILL', id: `INV-${currentOrder.id}`, orderId: currentOrder.id, items: [], total: currentOrder.total, table: tableName, oType: orderType }); // Ideally fetch all KOT items for bill
    
    setCurrentOrder(null);
    setSelectedTable(null);
    setCart([]);
    fetchData();
    setTimeout(() => { window.print(); }, 500);
  };


  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-4">
      {/* LEFT: Selectors */}
      <div className="w-64 flex flex-col gap-4 overflow-y-auto pr-2">
        <h2 className="font-bold text-lg text-slate-300 px-2 pt-2 border-b border-slate-700 pb-2">Dine-In Tables</h2>
        <div className="grid grid-cols-2 gap-2">
          {tables.map(t => {
            const isRun = orders.find(o => o.table_id === t.id);
            return (
              <button key={t.id} onClick={() => handleSelectTable(t)}
                className={`p-3 rounded-lg text-sm font-bold border-2 transition ${
                  selectedTable === t.id ? 'border-primary bg-primary/20 text-primary' :
                  isRun ? 'border-amber-500 bg-amber-500/10 text-amber-500' :
                  'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                {t.name}
              </button>
            )
          })}
        </div>
        <h2 className="font-bold text-lg text-slate-300 px-2 pt-4 border-b border-slate-700 pb-2">Parcel / Online</h2>
        <div className="flex flex-col gap-2">
          {['parcel', 'swiggy', 'zomato'].map(t => (
            <button key={t} onClick={() => handleSelectParcel(t)}
              className={`p-3 rounded-lg text-sm font-bold capitalize border-2 transition flex items-center gap-3 ${
                (selectedTable === null && orderType === t) ? 'border-primary bg-primary/20 text-primary' :
                'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
              }`}
            >
              {t === 'zomato' || t === 'swiggy' ? <Bike size={18}/> : <MapPin size={18}/>}
              {t} Takeaway
            </button>
          ))}
        </div>
      </div>

      {/* MID: Menu Selection */}
      <div className="flex-1 bg-surface rounded-xl shadow border border-slate-800 flex flex-col overflow-hidden">
        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
           <div className="relative mb-4">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={20}/>
             <input type="text" placeholder="Search menu..." value={search} onChange={e=>setSearch(e.target.value)} 
               className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary focus:outline-none"/>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={()=>setSelectedCategory('All')} className={`px-4 py-1.5 rounded-full text-sm shrink-0 transition ${selectedCategory==='All'?'bg-primary text-white':'bg-slate-700 text-slate-300'}`}>All</button>
              {categories.map(c => (
                <button key={c.id} onClick={()=>setSelectedCategory(c.id.toString())} 
                   className={`px-4 py-1.5 rounded-full text-sm shrink-0 transition ${selectedCategory===c.id.toString()?'bg-primary text-white':'bg-slate-700 text-slate-300'}`}>
                  {c.name}
                </button>
              ))}
           </div>
        </div>
        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 align-top place-content-start">
           {filteredMenu.map(m => (
             <button key={m.id} onClick={() => addToCart(m)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 flex flex-col text-left transition h-28">
               <span className="font-semibold text-white leading-tight flex-1">{m.name}</span>
               <span className="text-emerald-400 font-mono font-bold">₹{m.price}</span>
             </button>
           ))}
        </div>
      </div>

      {/* RIGHT: Cart / Bill Preview */}
      <div className="w-80 bg-surface rounded-xl shadow border border-slate-800 flex flex-col overflow-hidden relative">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
           <div>
             <div className="text-xs text-slate-400 uppercase tracking-wider">{orderType}</div>
             <div className="font-bold text-lg text-primary">{selectedTable ? tables.find(t=>t.id===selectedTable)?.name : 'Parcel Order'}</div>
           </div>
           {currentOrder && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">Running</span>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
           {cart.length === 0 && (
             <div className="text-center text-slate-500 my-auto flex flex-col items-center">
                <ShoppingCart size={40} className="mb-2 opacity-20"/>
                <p>Empty Cart</p>
             </div>
           )}
           {cart.map(item => (
             <div key={item.menu_item_id} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
               <div className="flex-1">
                 <div className="font-medium text-sm w-36 truncate">{item.name}</div>
                 <div className="text-xs text-slate-400">₹{item.price}</div>
               </div>
               <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button onClick={()=>updateCartQty(item.menu_item_id, -1)} className="text-slate-400 px-2 hover:text-white">-</button>
                  <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={()=>updateCartQty(item.menu_item_id, 1)} className="text-slate-400 px-2 hover:text-primary">+</button>
               </div>
             </div>
           ))}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-700">
           {currentOrder && <div className="flex justify-between text-sm text-slate-400 mb-2"><span>Running Total</span><span>₹{currentOrder.total.toFixed(2)}</span></div>}
           <div className="flex justify-between text-lg font-bold text-white mb-4"><span>Cart Total</span><span className="text-emerald-400">₹{cartTotal.toFixed(2)}</span></div>
           
           <div className="grid grid-cols-2 gap-2">
             <button onClick={handleKOT} disabled={cart.length === 0 && !currentOrder} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2">
               <Printer size={18}/> KOT
             </button>
             <button onClick={handleCheckout} disabled={!currentOrder} className="bg-primary hover:bg-teal-600 disabled:opacity-50 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2">
               <Check size={18}/> Print Bill
             </button>
           </div>
        </div>
      </div>

      {/* PRINT TEMPLATE (Hidden from screen, visible on print via index.css) */}
      {printData && (
        <div className="kot-print bg-white text-black p-4 text-sm font-mono">
           <h2 className="text-center font-bold text-lg mb-1">{printData.type === 'KOT' ? 'KITCHEN ORDER TICKET' : 'TAX INVOICE'}</h2>
           <p className="text-center text-xs mb-3">Table/Type: <span className="font-bold">{printData.table} ({printData.oType})</span></p>
           <div className="border-b border-black border-dashed mb-2"></div>
           {printData.type === 'KOT' && printData.items.map((i, idx) => (
             <div key={idx} className="flex justify-between mb-1">
               <span className="font-bold text-lg">{i.quantity} x {i.name}</span>
             </div>
           ))}
           {printData.type === 'BILL' && (
              <div className="text-center my-6">
                 <div className="font-bold text-xl mb-2">Total Amount: ₹{printData.total?.toFixed(2)}</div>
                 <div className="text-xs">Thank You & Visit Again!</div>
              </div>
           )}
           <div className="border-t border-black border-dashed mt-2 pt-2 text-xs text-center">{new Date().toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
