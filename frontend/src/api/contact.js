import api from './api'

export async function submitContactMessage(data) {
  const response = await api.post('/contact', data)
  return response.data
}

export async function fetchContactMessages() {
  const response = await api.get('/contact')
  return response.data
}

export async function getContactMessage(id) {
  const response = await api.get(`/contact/${id}`)
  return response.data
}

export async function replyToContactMessage(id, adminReply) {
  const response = await api.patch(`/contact/${id}/reply`, { adminReply })
  return response.data
}

export async function deleteContactMessage(id) {
  const response = await api.delete(`/contact/${id}`)
  return response.data
}
