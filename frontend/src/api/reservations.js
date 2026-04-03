import api from './api'

export async function fetchReservationsAdmin(params = {}) {
  const { data } = await api.get('/reservations', { params })
  return data
}

export async function fetchMyReservations() {
  const { data } = await api.get('/reservations/my')
  return data
}

export async function createReservation(payload) {
  const { data } = await api.post('/reservations', payload)
  return data
}

export async function cancelReservation(reservationId) {
  const { data } = await api.put(`/reservations/${reservationId}/cancel`)
  return data
}
