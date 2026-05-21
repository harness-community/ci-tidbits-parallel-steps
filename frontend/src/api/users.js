import client from './client'

export const createUser = (data) => client.post('/users', data)
export const getUser = (id) => client.get(`/users/${id}`)
export const getUserByEmail = (email) => client.get(`/users/email/${encodeURIComponent(email)}`)
export const updateUser = (id, data) => client.put(`/users/${id}`, data)
export const deleteUser = (id) => client.delete(`/users/${id}`)
