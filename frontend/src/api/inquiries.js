import api from './api'

export async function createInquiry(payload) {
  const { data } = await api.post('/inquiries', payload)
  return data
}

export async function fetchMyInquiries() {
  const { data } = await api.get('/inquiries/me')
  return data
}

export async function fetchInquiriesAdmin() {
  const { data } = await api.get('/inquiries')
  return data
}

export async function replyToInquiry(inquiryId, payload) {
  const { data } = await api.patch(`/inquiries/${inquiryId}/reply`, payload)
  return data
}
