import api from './api'

export async function fetchBooks(params = {}) {
  const { data } = await api.get('/books', { params })
  return data
}

export async function fetchBookById(bookId) {
  const { data } = await api.get(`/books/${bookId}`)
  return data
}

export async function createBook(payload) {
  const { data } = await api.post('/books', payload)
  return data
}

export async function updateBook(bookId, payload) {
  const { data } = await api.put(`/books/${bookId}`, payload)
  return data
}

export async function deleteBook(bookId) {
  const { data } = await api.delete(`/books/${bookId}`)
  return data
}
