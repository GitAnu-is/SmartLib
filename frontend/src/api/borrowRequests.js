import api from './api'

export async function createBorrowRequest(bookId) {
  const { data } = await api.post('/borrow-requests', { bookId })
  return data
}

export async function fetchMyBorrowRequests() {
  const { data } = await api.get('/borrow-requests/me')
  return data
}

export async function fetchBorrowRequestsAdmin() {
  const { data } = await api.get('/borrow-requests')
  return data
}

export async function approveBorrowRequest(requestId) {
  const { data } = await api.patch(`/borrow-requests/${requestId}/approve`)
  return data
}

export async function rejectBorrowRequest(requestId) {
  const { data } = await api.patch(`/borrow-requests/${requestId}/reject`)
  return data
}

export async function returnBorrowRequest(requestId) {
  const { data } = await api.patch(`/borrow-requests/${requestId}/return`)
  return data
}

export async function cancelBorrowRequest(requestId) {
  const { data } = await api.delete(`/borrow-requests/${requestId}`)
  return data
}
