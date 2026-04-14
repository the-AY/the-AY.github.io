import React, { useState, useEffect } from 'react';
import { ShoppingCart, Printer, Check, Search, MapPin, Bike, Minus, Plus } from 'lucide-react';

export default function CashierPOS({ api, user }) {
  const [tables,      setTables]      = useState([]);
  const [menu,        setMenu]        = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [settings,    setSettings]    = useState({ restaurant_name: 'Smart Hotel POS', address: '', fssai: '', gst_percent: 5, currency: '₹', cgst_sgst_split: 1 });

  const [selectedTable,  setSelectedTable]  = useState(null);
  const [orderType,      setOrderType]      = useState('dine-in');
  const [currentOrder,   setCurrentOrder]   = useState(null);
  const [cart,           setCart]           = useState([]);
  const [search,         setSearch]         = useState('');
  const [selectedCat,    setSelectedCat]    = useState('All');
  const [printData,      setPrintData]      = useState(null);
  const [vegFilter,      setVegFilter]      = useState('all'); // all | veg | nonveg

  // ── Fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [tRes, mRes, cRes, oRes, sRes] = await Promise.all([
        fetch(`${api}/tables`), fetch(`${api}/menu`),
        fetch(`${api}/categories`), fetch(`${api}/orders/running`),
        fetch(`${api}/settings`),
      ]);
      setTables(await tRes.json());
      setMenu(await mRes.json());
      setCategories(await cRes.json());
      setOrders(await oRes.json());
      if (sRes.ok) setSettings(await sRes.json());
    } catch (_) {}
  };

  useEffect(() => { fetchData(); }, [api]);

  // ── Derived ─────────────────────────────────────────────
  const filteredMenu = menu.filter(m =>
    (selectedCat === 'All' || m.category_id === parseInt(selectedCat)) &&
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (vegFilter === 'all' || (vegFilter === 'veg' ? m.is_veg === 1 : m.is_veg === 0))
  );

  const cartTotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);

  // Section grouping for floor plan
  const sections = [...new Set(tables.map(t => t.section || 'Main Hall'))];

  // ── Table / Parcel selection ────────────────────────────
  const handleSelectTable = (table) => {
    setSelectedTable(table.id);
    setOrderType('dine-in');
    setCurrentOrder(orders.find(o => o.table_id === table.id && o.status === 'running') || null);
    setCart([]);
  };

  const handleSelectParcel = (type) => {
    setSelectedTable(null);
    setOrderType(type);
    setCurrentOrder(null);
    setCart([]);
  };

  // ── Cart ────────────────────────────────────────────────
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.menu_item_id === item.id);
      if (ex) return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.menu_item_id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  // ── KOT ─────────────────────────────────────────────────
  const handleKOT = async () => {
    if (cart.length === 0) return;
    let orderId = currentOrder?.id;
    if (!orderId) {
      const oRes  = await fetch(`${api}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: selectedTable, type: orderType }),
      });
      const oData = await oRes.json();
      orderId = oData.id;
      setCurrentOrder(oData);
    }
    await fetch(`${api}/orders/${orderId}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart }),
    });
    const tableName = selectedTable ? tables.find(t => t.id === selectedTable)?.name : 'Parcel';
    setPrintData({ type: 'KOT', id: `KOT-${orderId}-${Date.now()}`, items: [...cart], table: tableName, oType: orderType });
    setCart([]);
    fetchData();
    setTimeout(() => window.print(), 500);
  };

  // ── Checkout ─────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!currentOrder) return;
    const itemsRes = await fetch(`${api}/orders/${currentOrder.id}/items`);
    const allItems = await itemsRes.json();
    await fetch(`${api}/orders/${currentOrder.id}/checkout`, { method: 'POST' });

    const subtotal  = currentOrder.total;
    const gstAmt    = subtotal * (settings.gst_percent / 100);
    const halfGst   = gstAmt / 2;
    const grandTotal = subtotal + gstAmt;
    const tableName = selectedTable ? tables.find(t => t.id === selectedTable)?.name : 'Parcel';

    setPrintData({
      type: 'BILL', id: `INV-${currentOrder.id}`, items: allItems,
      subtotal, gstAmt, halfGst, grandTotal,
      table: tableName, oType: orderType,
      settings,
    });
    setCurrentOrder(null); setSelectedTable(null); setCart([]);
    fetchData();
    setTimeout(() => window.print(), 500);
  };

  const cur = settings.currency || '₹';
  const canCheckout = ['admin', 'cashier'].includes(user?.role);

  return (
    <div className="flex h-[calc(100vh-110px)] overflow-hidden gap-4">

      {/* ══ LEFT: Floor Plan + Parcel ══════════════════════ */}
      <div className="w-64 flex flex-col gap-4 overflow-y-auto pr-1 shrink-0">
        {sections.map(section => {
          const sectionTables = tables.filter(t => (t.section || 'Main Hall') === section);
          return (
            <div key={section}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">{section}</h3>
              <div className="grid grid-cols-2 gap-2">
                {sectionTables.map(t => {
                  const isOccupied = orders.find(o => o.table_id === t.id);
                  const isSelected = selectedTable === t.id;
                  return (
                    <button key={t.id} onClick={() => handleSelectTable(t)}
                      className={`p-3 rounded-xl text-sm font-bold border-2 transition flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-primary bg-primary/20 text-primary'
                          : isOccupied
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-base">{t.name}</span>
                      <span className="text-xs opacity-70">{t.seats || 4} seats</span>
                      {isOccupied && <span className="text-[10px] font-normal bg-amber-500/20 px-1.5 rounded-full">occupied</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Parcel / Online */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">Parcel / Online</h3>
          <div className="flex flex-col gap-2">
            {['parcel', 'swiggy', 'zomato'].map(t => (
              <button key={t} onClick={() => handleSelectParcel(t)}
                className={`p-2.5 rounded-xl text-sm font-bold capitalize border-2 transition flex items-center gap-2 ${
                  selectedTable === null && orderType === t
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                {t === 'parcel' ? <MapPin size={16} /> : <Bike size={16} />}
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ MID: Menu ══════════════════════════════════════ */}
      <div className="flex-1 bg-surface rounded-xl shadow border border-slate-800 flex flex-col overflow-hidden">
        {/* Search + filters */}
        <div className="p-3 border-b border-slate-700 bg-slate-800/50 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Search menu…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none" />
          </div>
          {/* Veg filter */}
          <div className="flex gap-2">
            {[['all','All'],['veg','🟢 Veg'],['nonveg','🔴 Non-Veg']].map(([v, l]) => (
              <button key={v} onClick={() => setVegFilter(v)}
                className={`text-xs px-3 py-1 rounded-full transition ${vegFilter === v ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setSelectedCat('All')}
              className={`px-3 py-1 rounded-full text-xs shrink-0 transition ${selectedCat === 'All' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(c.id.toString())}
                className={`px-3 py-1 rounded-full text-xs shrink-0 transition ${selectedCat === c.id.toString() ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {filteredMenu.map(m => (
            <button key={m.id} onClick={() => addToCart(m)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary/50 rounded-xl flex flex-col text-left transition overflow-hidden group">
              {/* Image */}
              {m.image_url
                ? <img src={m.image_url} alt={m.name}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.style.display = 'none'; }} />
                : <div className="w-full h-24 bg-slate-700/50 flex items-center justify-center text-slate-500 text-3xl">🍽️</div>
              }
              <div className="p-2.5 flex flex-col gap-1 flex-1">
                <span className="font-semibold text-white text-sm leading-snug line-clamp-2">{m.name}</span>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-emerald-400 font-mono font-bold text-sm">{cur}{m.price}</span>
                  {/* Veg/NonVeg indicator */}
                  <span className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center shrink-0 ${
                    m.is_veg ? 'border-green-500' : 'border-red-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${m.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                </div>
              </div>
            </button>
          ))}
          {filteredMenu.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-40 text-slate-500 text-sm">
              No items match your filter
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Cart ════════════════════════════════════ */}
      <div className="w-72 bg-surface rounded-xl shadow border border-slate-800 flex flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">{orderType}</div>
            <div className="font-bold text-primary">
              {selectedTable ? tables.find(t => t.id === selectedTable)?.name : 'Parcel Order'}
            </div>
          </div>
          {currentOrder && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Running</span>}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {cart.length === 0 && (
            <div className="text-center text-slate-500 my-auto flex flex-col items-center gap-3">
              <ShoppingCart size={40} className="opacity-20" />
              <p className="text-sm">Cart is empty</p>
              {!selectedTable && orderType === 'dine-in' && (
                <p className="text-xs text-slate-600">Select a table or parcel type</p>
              )}
            </div>
          )}
          {cart.map(item => (
            <div key={item.menu_item_id} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
              <div className="flex-1 min-w-0 mr-3">
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="text-xs text-slate-400">{cur}{item.price} × {item.quantity} = {cur}{(item.price * item.quantity).toFixed(0)}</div>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700 shrink-0">
                <button onClick={() => updateQty(item.menu_item_id, -1)}
                  className="text-slate-400 hover:text-white w-6 h-6 flex items-center justify-center rounded">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQty(item.menu_item_id, 1)}
                  className="text-slate-400 hover:text-primary w-6 h-6 flex items-center justify-center rounded">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals + Actions */}
        <div className="p-3 bg-slate-900 border-t border-slate-700">
          {currentOrder && (
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Running Total</span><span>{cur}{currentOrder.total.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-white mb-3">
            <span>Cart Total</span>
            <span className="text-emerald-400">{cur}{cartTotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleKOT} disabled={cart.length === 0}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition">
              <Printer size={16} /> KOT
            </button>
            {canCheckout && (
              <button onClick={handleCheckout} disabled={!currentOrder}
                className="bg-primary hover:bg-teal-600 disabled:opacity-40 text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition">
                <Check size={16} /> Bill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ PRINT TEMPLATE (hidden, shown on print) ════════ */}
      {printData && (
        <div className="kot-print bg-white text-black p-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-3">
            <div className="font-bold text-xl">{printData.settings?.restaurant_name || 'Smart Hotel POS'}</div>
            {printData.settings?.address && <div className="text-xs mt-0.5">{printData.settings.address}</div>}
            {printData.settings?.fssai && <div className="text-xs">FSSAI: {printData.settings.fssai}</div>}
          </div>

          <div className="text-center font-bold text-base border-t border-b border-dashed border-black py-1 mb-2">
            {printData.type === 'KOT' ? '🧑‍🍳 KITCHEN ORDER TICKET' : '🧾 TAX INVOICE'}
          </div>

          <div className="flex justify-between text-xs mb-2">
            <span>Table: <strong>{printData.table}</strong></span>
            <span>{new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
          </div>
          <div className="text-xs mb-3">Type: <strong className="capitalize">{printData.oType}</strong></div>

          <div className="border-t border-dashed border-black mb-2" />

          {/* Items */}
          {printData.items.map((i, idx) => (
            <div key={idx} className="flex justify-between mb-1">
              <span className={`font-bold ${printData.type === 'KOT' ? 'text-lg' : 'text-base'}`}>
                {i.quantity} × {i.name}
              </span>
              {printData.type === 'BILL' && <span>{printData.settings?.currency || '₹'}{(i.price * i.quantity).toFixed(2)}</span>}
            </div>
          ))}

          {/* Bill totals */}
          {printData.type === 'BILL' && (
            <>
              <div className="border-t border-dashed border-black my-2" />
              <div className="flex justify-between text-sm"><span>Sub-total</span><span>{cur}{printData.subtotal.toFixed(2)}</span></div>
              {printData.settings?.cgst_sgst_split && printData.settings?.gst_percent > 0
                ? <>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>CGST ({(printData.settings.gst_percent / 2).toFixed(1)}%)</span>
                      <span>{cur}{printData.halfGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>SGST ({(printData.settings.gst_percent / 2).toFixed(1)}%)</span>
                      <span>{cur}{printData.halfGst.toFixed(2)}</span>
                    </div>
                  </>
                : printData.settings?.gst_percent > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>GST ({printData.settings.gst_percent}%)</span>
                      <span>{cur}{printData.gstAmt.toFixed(2)}</span>
                    </div>
                  )
              }
              <div className="border-t border-black my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL</span><span>{cur}{printData.grandTotal.toFixed(2)}</span>
              </div>
              <div className="text-center text-xs mt-4 uppercase tracking-widest font-bold">
                ✨ Thank You! Visit Again ✨
              </div>
            </>
          )}

          <div className="border-t border-dashed border-black mt-3 pt-2 text-xs text-center text-gray-500">
            Powered by Smart Hotel POS
          </div>
        </div>
      )}
    </div>
  );
}
