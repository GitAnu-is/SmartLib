import api from './api'

export async function fetchMyWaitingList() {
  const { data } = await api.get('/waiting-list/me')
  return data
}

export async function joinWaitingList(bookId) {
  const { data } = await api.post('/waiting-list', { bookId })
  return data
}

export async function leaveWaitingList(entryId) {
  const { data } = await api.delete(`/waiting-list/${entryId}`)
  return data
}
