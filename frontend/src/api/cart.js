import client from './client'

export const getCart = (userId) => client.get(`/users/${userId}/cart`)
export const getCartTotal = (userId) => client.get(`/users/${userId}/cart/total`)
export const addToCart = (userId, productId, quantity) =>
  client.post(`/users/${userId}/cart/items?productId=${productId}&quantity=${quantity}`)
export const updateCartItem = (userId, productId, quantity) =>
  client.patch(`/users/${userId}/cart/items/${productId}?quantity=${quantity}`)
export const removeCartItem = (userId, productId) =>
  client.delete(`/users/${userId}/cart/items/${productId}`)
export const clearCart = (userId) => client.delete(`/users/${userId}/cart`)
