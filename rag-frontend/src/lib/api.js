import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
})

export const askQuestion = (payload, userId) =>
  api.post('/v1/ask', { ...payload, user_id: userId || 'default' }).then(r => r.data)

export const getDocuments = (userId) =>
  api.get(`/v1/documents?user_id=${userId || 'default'}`).then(r => r.data)

export const getStats = (userId) =>
  api.get(`/v1/stats?user_id=${userId || 'default'}`).then(r => r.data)

export const uploadDocument = (file, userId) => {
  const form = new FormData()
  form.append('file', file)
  form.append('user_id', userId || 'default')
  return api.post('/v1/upload', form).then(r => r.data)
}



export const getHealth = () =>
  api.get('/v1/health').then(r => r.data)


export const getGlobalEvaluation = () =>
  api.get('/v1/evaluation/global').then(r => r.data)

export const getUserHistory = (userId) =>
  api.get(`/v1/evaluation/history?user_id=${userId || 'default'}`).then(r => r.data)

export const getSuggestions = (userId) =>
  api.get(`/v1/suggestions?user_id=${userId || 'default'}`).then(r => r.data)

export const getIngestedFiles = (userId) =>
  api.get(`/v1/ingested-files?user_id=${userId || 'default'}`).then(r => r.data)

export const ingestDocuments = (strategy = 'recursive', userId, selectedFiles = null) =>
  api.post('/v1/ingest', { strategy, user_id: userId || 'default', selected_files: selectedFiles }).then(r => r.data)


export const deleteDocument = (filename, userId) =>
  api.delete(`/v1/documents/${encodeURIComponent(filename)}?user_id=${userId || 'default'}`).then(r => r.data)

export const getDocumentViewUrl = (filename, userId) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return `${base}/v1/documents/${encodeURIComponent(filename)}/view?user_id=${userId || 'default'}`
}

export const webSearch = (query, context) =>
  api.post(`/v1/web-search?query=${encodeURIComponent(query)}${context ? `&context=${encodeURIComponent(context)}` : ''}`).then(r => r.data)

export const resetIngestedFiles = (userId) =>
  api.delete(`/v1/ingested-files?user_id=${userId || 'default'}`).then(r => r.data)


export const getGlobalPlatformStats = () =>
  api.get('/v1/stats/global').then(r => r.data)

export const deleteEvaluationEntry = (userId, timestamp) =>
  api.delete(`/v1/evaluation/history?user_id=${encodeURIComponent(userId)}&timestamp=${encodeURIComponent(timestamp)}`).then(r => r.data)