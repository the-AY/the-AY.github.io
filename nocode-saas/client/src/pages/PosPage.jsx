import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posApi } from '../api/apps';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTrash2, FiShoppingCart, FiDollarSign, FiPackage, FiTrendingUp } from 'react-icons/fi';
import './POS.css';

export default function PosPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // dashboard | products | billing | orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [cart, setCart] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      const [prodRes, orderRes, statsRes] = await Promise.all([
        posApi.listProducts(appId),
        posApi.listOrders(appId),
        posApi.getStats(appId),
      ]);
      setProducts(prodRes.data.products || []);
      setOrders(orderRes.data.orders || []);
      setStats(statsRes.data || {});
    } catch {}
    finally { setLoading(false); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await posApi.createProduct(appId, { ...newProduct, price: parseFloat(newProduct.price) });
      setProducts(prev => [...prev, res.data.product]);
      setNewProduct({ name: '', price: '', category: '' });
      setShowAddProduct(false);
      toast.success('Product added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add product');
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartTax = cartTotal * 0.05;

  const handleCreateOrder = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    try {
      const orderData = {
        items: cart.map(c => ({ productId: c.id, name: c.name, qty: c.qty, price: c.price })),
        subtotal: cartTotal,
        tax: cartTax,
        total: cartTotal + cartTax,
      };
      await posApi.createOrder(appId, orderData);
      toast.success('Order created! 🎉');
      setCart([]);
      loadData();
      setView('orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    }
  };

  if (loading) return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div className="builder-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <FiArrowLeft />
          </button>
          <h1 className="page-title">POS System</h1>
        </div>
        <div className="pos-nav">
          {['dashboard', 'products', 'billing', 'orders'].map(v => (
            <button
              key={v}
              className={`pos-nav-btn ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div className="pos-dashboard">
          <div className="pos-stats-grid">
            <div className="glass-card pos-stat-card">
              <FiDollarSign className="pos-stat-icon" style={{ color: '#10b981' }} />
              <div>
                <div className="pos-stat-label">Today's Sales</div>
                <div className="pos-stat-value">₹{(stats.todaySales || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="glass-card pos-stat-card">
              <FiShoppingCart className="pos-stat-icon" style={{ color: '#6366f1' }} />
              <div>
                <div className="pos-stat-label">Total Orders</div>
                <div className="pos-stat-value">{stats.totalOrders || 0}</div>
              </div>
            </div>
            <div className="glass-card pos-stat-card">
              <FiPackage className="pos-stat-icon" style={{ color: '#f59e0b' }} />
              <div>
                <div className="pos-stat-label">Products</div>
                <div className="pos-stat-value">{products.length}</div>
              </div>
            </div>
            <div className="glass-card pos-stat-card">
              <FiTrendingUp className="pos-stat-icon" style={{ color: '#00d2ff' }} />
              <div>
                <div className="pos-stat-label">Revenue (All Time)</div>
                <div className="pos-stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', marginTop: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Recent Orders</h3>
            <table className="data-table">
              <thead>
                <tr><th>Order #</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td>#{o.order_no || o.id?.slice(0, 8)}</td>
                    <td>{o.items?.length || 0} items</td>
                    <td>₹{(o.total || 0).toFixed(2)}</td>
                    <td><span className={`badge badge-${o.status === 'paid' ? 'success' : 'warning'}`}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products View */}
      {view === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
              <FiPlus /> Add Product
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {products.map(p => (
              <div key={p.id} className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ fontWeight: 600 }}>{p.name}</h4>
                <p style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '1.25rem', margin: '8px 0' }}>₹{p.price}</p>
                {p.category && <span className="badge badge-info">{p.category}</span>}
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <div className="empty-state">
              <p className="empty-state-text">No products yet</p>
            </div>
          )}
        </div>
      )}

      {/* Billing View */}
      {view === 'billing' && (
        <div className="pos-billing-layout">
          <div className="pos-product-grid">
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Select Products</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {products.map(p => (
                <div
                  key={p.id}
                  className="glass-card pos-product-tile"
                  onClick={() => addToCart(p)}
                >
                  <span className="pos-product-name">{p.name}</span>
                  <span className="pos-product-price">₹{p.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pos-cart-panel glass-card">
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>
              <FiShoppingCart style={{ marginRight: '8px' }} />
              Cart ({cart.length})
            </h3>
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Cart is empty</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <div className="cart-item-controls">
                      <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <span className="cart-item-qty">{item.qty}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                      <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.id)} style={{ padding: '4px 8px' }}>
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="cart-summary">
                  <div className="cart-summary-row"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
                  <div className="cart-summary-row"><span>Tax (5%)</span><span>₹{cartTax.toFixed(2)}</span></div>
                  <div className="cart-summary-row cart-total"><span>Total</span><span>₹{(cartTotal + cartTax).toFixed(2)}</span></div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} onClick={handleCreateOrder}>
                  Create Order
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Orders View */}
      {view === 'orders' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>All Orders</h3>
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Items</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.order_no || o.id?.slice(0, 8)}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>₹{(o.subtotal || 0).toFixed(2)}</td>
                  <td>₹{(o.tax || 0).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>₹{(o.total || 0).toFixed(2)}</td>
                  <td><span className={`badge badge-${o.status === 'paid' ? 'success' : 'warning'}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Product</h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input className="form-input" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} required id="product-name" />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} required id="product-price" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} id="product-category" />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProduct(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="add-product-submit">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
