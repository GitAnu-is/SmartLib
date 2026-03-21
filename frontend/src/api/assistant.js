import api from './api'

export const fetchAssistantInsights = async () => {
  const res = await api.get('/assistant/insights')
  return res.data
}

export const assistantChat = async (message) => {
  const res = await api.post('/assistant/chat', { message })
  return res.data
}
