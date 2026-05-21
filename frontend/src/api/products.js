import client from './client'

export const getProducts = () => client.get('/products')
export const getProduct = (id) => client.get(`/products/${id}`)
export const getProductsByCategory = (category) => client.get(`/products/category/${category}`)
export const searchProducts = (keyword) => client.get(`/products/search?keyword=${encodeURIComponent(keyword)}`)
export const getProductsByPriceRange = (min, max) => client.get(`/products/price-range?min=${min}&max=${max}`)
export const createProduct = (data) => client.post('/products', data)
export const adjustStock = (id, delta) => client.patch(`/products/${id}/stock?delta=${delta}`)
export const deleteProduct = (id) => client.delete(`/products/${id}`)
