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

export function getOpenLibraryCoverUrl(title, author = '') {
  // Format title for Open Library API
  const formattedTitle = title.replace(/\s+/g, '-').toLowerCase()
  // Return the Open Library Covers API URL
  return `https://covers.openlibrary.org/b/title/${formattedTitle}-L.jpg`
}

export async function uploadBookCoverImage(bookId, file) {
  const formData = new FormData()
  formData.append('coverImage', file)
  
  try {
    const { data } = await api.post(`/books/${bookId}/upload-cover`, formData)
    return data
  } catch (error) {
    console.error('[Upload Error]', {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      error: error?.message,
      fullResponse: error?.response?.data
    })
    throw error
  }
}
