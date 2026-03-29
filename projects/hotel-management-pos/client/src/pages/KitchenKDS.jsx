import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2 } from 'lucide-react';

export default function KitchenKDS({ api }) {
  const [kots, setKots] = useState([]);

  const fetchKots = async () => {
    try {
      const res = await fetch(`${api}/kot`);
      setKots(await res.json());
    } catch (err) {}
  };

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [api]);

  const bumpStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'pending' ? 'preparing' : 'ready';
      const res = await fetch(`${api}/kot/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      
      if (res.ok) {
        // Optimistic update
        setKots(prev => prev.map(item => 
          item.id === id ? { ...item, status: nextStatus } : item
        ));
        // Also refresh from server to be sure
        fetchKots();
      } else {
        console.error('Failed to update status', await res.text());
      }
    } catch (err) {
      console.error('Network error updating status', err);
    }
  };

  // Group by Order ID so the KDS shows tickets per order
  const groupedOrders = kots.reduce((acc, kot) => {
    if (!acc[kot.order_id]) acc[kot.order_id] = [];
    acc[kot.order_id].push(kot);
    return acc;
  }, {});

  const getTimerColor = (createdAt) => {
    const minElapsed = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (minElapsed > 20) return 'text-red-500 bg-red-500/10 border-red-500';
    if (minElapsed > 10) return 'text-amber-500 bg-amber-500/10 border-amber-500';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500';
  };

  const getTimerMinutes = (createdAt) => {
    return Math.floor((new Date() - new Date(createdAt)) / 60000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-surface border-b border-slate-700 py-4 px-6 flex justify-between items-center rounded-lg shadow mb-4">
        <h2 className="text-xl font-bold flex items-center gap-3 text-primary"><ChefHat size={28}/> Kitchen Display System (KDS)</h2>
        <div className="text-slate-400 text-sm flex gap-4">
           <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> &lt; 10 min</span>
           <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> 10 - 20 min</span>
           <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> &gt; 20 min</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full items-start w-max px-2">
          {Object.entries(groupedOrders).map(([orderId, items]) => {
            const firstItem = items[0];
            const timerClass = getTimerColor(firstItem.created_at);
            const minutes = getTimerMinutes(firstItem.created_at);

            return (
              <div key={orderId} className="w-80 flex-shrink-0 bg-surface border border-slate-700 rounded-xl shadow-lg flex flex-col max-h-full overflow-hidden">
                <div className={`p-4 border-b border-slate-700 flex justify-between items-center ${timerClass.replace('text-', 'bg-').split(' ')[1].replace('/10', '/5')}`}>
                  <div className="font-bold text-lg">{firstItem.table_name || 'Parcel'}</div>
                  <div className={`flex items-center gap-1 text-sm font-bold border px-2 py-1 rounded ${timerClass}`}>
                     <Clock size={16}/> {minutes} min
                  </div>
                </div>
                <div className="bg-slate-800/50 py-1 text-center text-xs uppercase tracking-widest text-slate-400 border-b border-slate-700">
                  {firstItem.order_type}
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                   {items.map(item => (
                     <div key={item.id} className={`p-3 rounded-lg border ${item.status==='preparing'?'border-primary bg-primary/10':'border-slate-700 bg-slate-800'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-lg break-words w-48 leading-tight">{item.quantity} x {item.item_name}</span>
                          <span className={`text-xs uppercase px-2 py-1 rounded font-bold ${item.status==='preparing'?'bg-primary text-white':'bg-slate-700 text-slate-400'}`}>
                            {item.status}
                          </span>
                       </div>
                       
                       <button 
                         onClick={() => bumpStatus(item.id, item.status)}
                         className={`w-full py-2 rounded font-bold flex justify-center items-center gap-2 mt-2 transition ${
                           item.status==='pending' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 
                           'bg-emerald-500 hover:bg-emerald-600 text-white'
                         }`}>
                          {item.status === 'pending' ? 'Start Preparing' : <><CheckCircle2 size={18}/> Mark Ready</>}
                       </button>
                     </div>
                   ))}
                </div>
              </div>
            );
          })}
          
          {Object.keys(groupedOrders).length === 0 && (
            <div className="w-full flex-1 flex justify-center items-center h-[50vh] text-slate-500">
              <div className="text-center font-bold text-2xl flex flex-col items-center gap-4">
                 <ChefHat size={64} className="opacity-20"/>
                 No Active KOTs
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
