import { useState, useEffect } from 'react'
import { getUserOrders, cancelOrder } from '../api/orders'
import { DEMO_USER_ID } from '../App'
import './OrdersPage.css'

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

function statusBadge(status) {
  const map = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    SHIPPED: 'badge-shipped',
    DELIVERED: 'badge-delivered',
    CANCELLED: 'badge-cancelled',
  }
  return `badge ${map[status] || ''}`
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getUserOrders(DEMO_USER_ID)
      setOrders(res.data.sort((a, b) => b.id - a.id))
    } catch (e) {
      if (e.response?.status === 404) {
        setOrders([])
      } else {
        setError('Failed to load orders.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return
    setCancellingId(orderId)
    try {
      await cancelOrder(orderId)
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.message || 'Could not cancel order.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" />Loading orders…</div>
  if (error) return <p className="error-msg">{error}</p>

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Your Orders</h1>
        <button className="btn-ghost" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state card">
          <h3>No orders yet</h3>
          <p>When you checkout, your orders will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-summary" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div className="order-meta">
                  <span className="order-id">Order #{order.id}</span>
                  <span className={statusBadge(order.status)}>{order.status}</span>
                </div>
                <div className="order-right">
                  <span className="order-total">${Number(order.total).toFixed(2)}</span>
                  <span className="order-items-count">
                    {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="expand-chevron">{expandedId === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="order-details">
                  <div className="order-items-list">
                    {order.items?.map(item => (
                      <div key={item.id} className="order-item-row">
                        <span className="oi-name">{item.product.name}</span>
                        <span className="oi-qty">× {item.quantity}</span>
                        <span className="oi-price">${Number(item.priceAtPurchase).toFixed(2)} ea</span>
                        <span className="oi-sub">${Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-progress">
                    {STATUS_FLOW.map((s, i) => {
                      const current = STATUS_FLOW.indexOf(order.status)
                      const done = i <= current
                      const isCancelled = order.status === 'CANCELLED'
                      return (
                        <div key={s} className={`progress-step ${done && !isCancelled ? 'done' : ''} ${isCancelled ? 'cancelled' : ''}`}>
                          <div className="progress-dot" />
                          <span>{s}</span>
                        </div>
                      )
                    })}
                    {order.status === 'CANCELLED' && (
                      <div className="progress-step cancelled">
                        <div className="progress-dot" />
                        <span>CANCELLED</span>
                      </div>
                    )}
                  </div>

                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <button
                      className="btn-danger cancel-btn"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                    >
                      {cancellingId === order.id ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
