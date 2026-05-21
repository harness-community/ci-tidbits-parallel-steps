import client from './client'

export const checkout = (userId) => client.post(`/users/${userId}/checkout`)
export const getOrder = (id) => client.get(`/orders/${id}`)
export const getUserOrders = (userId) => client.get(`/users/${userId}/orders`)
export const updateOrderStatus = (id, status) => client.patch(`/orders/${id}/status?status=${status}`)
export const cancelOrder = (id) => client.post(`/orders/${id}/cancel`)
