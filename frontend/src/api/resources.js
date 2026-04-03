import api from './api'

export async function fetchResourcesAdmin() {
  const { data } = await api.get('/resources')
  return data
}

export async function fetchResourcesPublic() {
  const { data } = await api.get('/resources/public')
  return data
}

export async function uploadResource(formData) {
  const { data } = await api.post('/resources', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function deleteResource(resourceId) {
  const { data } = await api.delete(`/resources/${resourceId}`)
  return data
}

export async function updateResource(resourceId, formData) {
  const { data } = await api.put(`/resources/${resourceId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function incrementResourceViews(resourceId) {
  const { data } = await api.patch(`/resources/${resourceId}/view`)
  return data
}
