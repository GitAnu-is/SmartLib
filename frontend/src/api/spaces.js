import api from './api'

export async function fetchSpacesAdmin() {
  const { data } = await api.get('/spaces')
  return data
}

export async function fetchSpacesPublic() {
  const { data } = await api.get('/spaces/public')
  return data
}

export async function createSpace(payload) {
  const { data } = await api.post('/spaces', payload)
  return data
}

export async function updateSpace(spaceId, payload) {
  const { data } = await api.put(`/spaces/${spaceId}`, payload)
  return data
}

export async function deleteSpace(spaceId) {
  const { data } = await api.delete(`/spaces/${spaceId}`)
  return data
}
