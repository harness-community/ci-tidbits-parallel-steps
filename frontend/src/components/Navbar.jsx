import { NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.4rem', verticalAlign: 'middle'}}>
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Harness Shop
        </span>
        <div className="navbar-links">
          <NavLink to="/products" className={({isActive}) => isActive ? 'active' : ''}>Products</NavLink>
          <NavLink to="/cart" className={({isActive}) => isActive ? 'active' : ''}>Cart</NavLink>
          <NavLink to="/orders" className={({isActive}) => isActive ? 'active' : ''}>Orders</NavLink>
          <NavLink to="/admin" className={({isActive}) => isActive ? 'active' : ''}>Admin</NavLink>
        </div>
      </div>
    </nav>
  )
}
