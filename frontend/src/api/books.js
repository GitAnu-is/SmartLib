import api from './api'

export function getOpenLibraryCoverUrl(title = '') {
  const query = encodeURIComponent(String(title || '').trim())
  return `https://covers.openlibrary.org/b/title/${query}-L.jpg?default=false`
}

export function resolveBookCoverUrl(coverImage = '') {
  const value = String(coverImage || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value) || value.startsWith('blob:')) {
    return value
  }
  const backendOrigin = import.meta?.env?.VITE_API_ORIGIN || 'http://localhost:5000'
  return `${backendOrigin}${value.startsWith('/') ? value : `/${value}`}`
}

export async function fetchBooks(params = {}) {
  const { data } = await api.get('/books', { params })
  return data
}

export async function fetchBookById(bookId) {
  const { data } = await api.get(`/books/${bookId}`)
  return data
}

export async function createBook(payload) {
  const config = payload instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined
  const { data } = await api.post('/books', payload, config)
  return data
}

export async function updateBook(bookId, payload) {
  const config = payload instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined
  const { data } = await api.put(`/books/${bookId}`, payload, config)
  return data
}

export async function deleteBook(bookId) {
  const { data } = await api.delete(`/books/${bookId}`)
  return data
}
