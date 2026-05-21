import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart } from '../api/cart'
import { updateCartItem, removeCartItem, clearCart } from '../api/cart'
import { checkout } from '../api/orders'
import { DEMO_USER_ID } from '../App'
import './CartPage.css'

export default function CartPage() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const navigate = useNavigate()

  const fetchCart = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCart(DEMO_USER_ID)
      setCart(res.data)
    } catch (e) {
      if (e.response?.status === 404) {
        setCart({ items: [], total: 0, totalItems: 0 })
      } else {
        setError('Failed to load cart.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCart() }, [])

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return
    try {
      await updateCartItem(DEMO_USER_ID, productId, newQty)
      fetchCart()
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update quantity.')
    }
  }

  const handleRemove = async (productId) => {
    try {
      await removeCartItem(DEMO_USER_ID, productId)
      fetchCart()
    } catch (e) {
      alert('Could not remove item.')
    }
  }

  const handleClear = async () => {
    if (!confirm('Clear your entire cart?')) return
    try {
      await clearCart(DEMO_USER_ID)
      fetchCart()
    } catch (e) {
      alert('Could not clear cart.')
    }
  }

  const handleCheckout = async () => {
    setCheckingOut(true)
    try {
      await checkout(DEMO_USER_ID)
      navigate('/orders')
    } catch (e) {
      alert(e.response?.data?.message || 'Checkout failed.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" />Loading cart…</div>
  if (error) return <p className="error-msg">{error}</p>

  const items = cart?.items ?? []
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        {items.length > 0 && (
          <button className="btn-ghost" onClick={handleClear}>Clear cart</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state card">
          <h3>Your cart is empty</h3>
          <p>Add some products from the <a href="/products" style={{color:'var(--primary)'}}>Products page</a>.</p>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item card">
                <div className="cart-item-info">
                  <span className="cart-item-category">{item.product.category}</span>
                  <h3 className="cart-item-name">{item.product.name}</h3>
                  <span className="cart-item-unit">${Number(item.product.price).toFixed(2)} each</span>
                </div>

                <div className="cart-item-controls">
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    >+</button>
                  </div>
                  <span className="cart-item-subtotal">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </span>
                  <button className="remove-btn" onClick={() => handleRemove(item.product.id)} title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary card">
            <h2>Order Summary</h2>
            <div className="summary-rows">
              {items.map(item => (
                <div key={item.id} className="summary-row">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>${(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              className="btn-primary checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Placing order…' : 'Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
