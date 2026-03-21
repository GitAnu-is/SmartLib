import api from './api'

export async function fetchActivitiesAdmin(limit = 50) {
  const { data } = await api.get('/activities', { params: { limit } })
  return data
}
