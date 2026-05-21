import { useState, useEffect, useCallback } from 'react'
import { getProducts, searchProducts, getProductsByCategory, getProductsByPriceRange } from '../api/products'
import { addToCart } from '../api/cart'
import { DEMO_USER_ID } from '../App'
import './ProductsPage.css'

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys']

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [addingId, setAddingId] = useState(null)
  const [addedId, setAddedId] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (search.trim()) {
        res = await searchProducts(search.trim())
      } else if (category) {
        res = await getProductsByCategory(category)
      } else if (minPrice !== '' || maxPrice !== '') {
        res = await getProductsByPriceRange(minPrice || 0, maxPrice || 999999)
      } else {
        res = await getProducts()
      }
      setProducts(res.data)
    } catch (e) {
      setError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [search, category, minPrice, maxPrice])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts()
  }

  const handleAddToCart = async (product) => {
    setAddingId(product.id)
    try {
      await addToCart(DEMO_USER_ID, product.id, 1)
      setAddedId(product.id)
      setTimeout(() => setAddedId(null), 1500)
    } catch (e) {
      alert(e.response?.data?.message || 'Could not add to cart.')
    } finally {
      setAddingId(null)
    }
  }

  const clearFilters = () => {
    setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice('')
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Products</h1>
        <p className="products-subtitle">Browse and add items to your cart</p>
      </div>

      <div className="card filters-card">
        <form className="search-row" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setCategory(''); }}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="filter-row">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setSearch(''); }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="price-range">
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={e => { setMinPrice(e.target.value); setSearch(''); setCategory(''); }}
              min="0"
            />
            <span>–</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); setSearch(''); setCategory(''); }}
              min="0"
            />
          </div>

          <button type="button" className="btn-ghost" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {loading ? (
        <div className="loading"><div className="spinner" />Loading products…</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try a different search or filter.</p>
        </div>
      ) : (
        <>
          <p className="results-count">{products.length} product{products.length !== 1 ? 's' : ''}</p>
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card card">
                <div className="product-category">{p.category}</div>
                <h3 className="product-name">{p.name}</h3>
                {p.description && <p className="product-desc">{p.description}</p>}
                <div className="product-footer">
                  <div>
                    <span className="product-price">${Number(p.price).toFixed(2)}</span>
                    <span className="product-stock">
                      {p.stock > 0 ? `${p.stock} in stock` : <span className="out-of-stock">Out of stock</span>}
                    </span>
                  </div>
                  <button
                    className={`btn-primary add-btn ${addedId === p.id ? 'added' : ''}`}
                    onClick={() => handleAddToCart(p)}
                    disabled={p.stock === 0 || addingId === p.id}
                  >
                    {addedId === p.id ? '✓ Added' : addingId === p.id ? '…' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
