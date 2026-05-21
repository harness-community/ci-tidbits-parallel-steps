import { useState, useEffect } from 'react'
import { getProducts, createProduct, adjustStock, deleteProduct } from '../api/products'
import { updateOrderStatus } from '../api/orders'
import { createUser } from '../api/users'
import './AdminPage.css'

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys']
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const EMPTY_PRODUCT = { name: '', description: '', price: '', stock: '', category: 'Electronics' }
const EMPTY_USER = { name: '', email: '', password: '' }

export default function AdminPage() {
  const [tab, setTab] = useState('products')

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p className="admin-subtitle">Manage products, stock levels, orders, and users</p>
      </div>

      <div className="admin-tabs">
        {['products', 'stock', 'orders', 'users'].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === 'products' && <CreateProductTab />}
        {tab === 'stock' && <StockTab />}
        {tab === 'orders' && <OrderStatusTab />}
        {tab === 'users' && <CreateUserTab />}
      </div>
    </div>
  )
}

/* ─── Create Product Tab ──────────────────────────────────────── */
function CreateProductTab() {
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await getProducts()
      setProducts(res.data)
    } catch {}
    setLoadingProducts(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)
    try {
      await createProduct({ ...form, price: Number(form.price), stock: Number(form.stock) })
      setMsg({ type: 'success', text: `Product "${form.name}" created!` })
      setForm(EMPTY_PRODUCT)
      fetchProducts()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create product.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return
    try {
      await deleteProduct(id)
      fetchProducts()
    } catch { alert('Could not deactivate product.') }
  }

  return (
    <div className="admin-tab">
      <div className="admin-split">
        <div className="admin-form-panel card">
          <h2>Create Product</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Laptop Pro 15" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price ($) *</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="99.99" />
              </div>
              <div className="form-group">
                <label>Stock *</label>
                <input required type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="50" />
              </div>
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {msg && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Product'}
            </button>
          </form>
        </div>

        <div className="admin-list-panel">
          <h2>Active Products</h2>
          {loadingProducts ? (
            <div className="loading"><div className="spinner" />Loading…</div>
          ) : products.length === 0 ? (
            <p className="admin-empty">No products yet.</p>
          ) : (
            <div className="admin-table-wrap card">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="td-name">{p.name}</td>
                      <td><span className="mini-badge">{p.category}</span></td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td className={p.stock === 0 ? 'stock-zero' : ''}>{p.stock}</td>
                      <td><button className="btn-danger sm-btn" onClick={() => handleDeactivate(p.id, p.name)}>Deactivate</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Stock Tab ───────────────────────────────────────────────── */
function StockTab() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deltas, setDeltas] = useState({})
  const [adjustingId, setAdjustingId] = useState(null)
  const [msg, setMsg] = useState({})

  const fetchProducts = async () => {
    setLoading(true)
    try { const res = await getProducts(); setProducts(res.data) } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const handleAdjust = async (id, name) => {
    const delta = Number(deltas[id] || 0)
    if (delta === 0) return
    setAdjustingId(id)
    try {
      await adjustStock(id, delta)
      setMsg(m => ({ ...m, [id]: { type: 'success', text: `Stock ${delta > 0 ? '+' : ''}${delta}` } }))
      setDeltas(d => ({ ...d, [id]: '' }))
      fetchProducts()
    } catch (e) {
      setMsg(m => ({ ...m, [id]: { type: 'error', text: e.response?.data?.message || 'Failed' } }))
    } finally {
      setAdjustingId(null)
      setTimeout(() => setMsg(m => ({ ...m, [id]: null })), 2000)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>

  return (
    <div className="admin-tab">
      <h2 style={{marginBottom:'1rem'}}>Adjust Stock</h2>
      {products.length === 0 ? (
        <p className="admin-empty">No products.</p>
      ) : (
        <div className="card admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Current Stock</th><th>Adjustment</th><th></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="td-name">{p.name}</td>
                  <td className={p.stock === 0 ? 'stock-zero' : ''}>{p.stock}</td>
                  <td>
                    <div className="delta-row">
                      <input
                        type="number"
                        style={{width: '90px'}}
                        placeholder="e.g. +10"
                        value={deltas[p.id] || ''}
                        onChange={e => setDeltas(d => ({...d, [p.id]: e.target.value}))}
                      />
                      {msg[p.id] && (
                        <span className={msg[p.id].type === 'success' ? 'success-msg' : 'error-msg'} style={{marginTop:0}}>
                          {msg[p.id].text}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-primary sm-btn"
                      onClick={() => handleAdjust(p.id, p.name)}
                      disabled={!deltas[p.id] || adjustingId === p.id}
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Order Status Tab ────────────────────────────────────────── */
function OrderStatusTab() {
  const [orderId, setOrderId] = useState('')
  const [newStatus, setNewStatus] = useState('CONFIRMED')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)
    try {
      await updateOrderStatus(Number(orderId), newStatus)
      setMsg({ type: 'success', text: `Order #${orderId} updated to ${newStatus}` })
      setOrderId('')
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update order.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-tab">
      <div className="card admin-form-panel" style={{maxWidth: 480}}>
        <h2>Update Order Status</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Order ID *</label>
            <input
              required type="number" min="1"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div className="form-group">
            <label>New Status *</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {msg && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
          <button type="submit" className="btn-primary" disabled={submitting || !orderId}>
            {submitting ? 'Updating…' : 'Update Status'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Create User Tab ─────────────────────────────────────────── */
function CreateUserTab() {
  const [form, setForm] = useState(EMPTY_USER)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await createUser(form)
      setMsg({ type: 'success', text: `User "${res.data.name}" created (ID: ${res.data.id})` })
      setForm(EMPTY_USER)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-tab">
      <div className="card admin-form-panel" style={{maxWidth: 480}}>
        <h2>Create User</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" />
          </div>
          {msg && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}
