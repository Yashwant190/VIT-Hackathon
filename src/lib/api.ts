import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, sign out user
      await supabase.auth.signOut()
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export interface DocumentResponse {
  id: string
  name: string
  size_bytes: number
  file_type: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  upload_date: string
  file_url?: string
}

export interface SummaryResponse {
  id: string
  document_id: string
  title: string
  key_points: string[]
  word_count: number
  reading_time: string
  sentiment: 'positive' | 'neutral' | 'negative'
  categories: string[]
  full_summary: string
  created_at: string
}

export interface AnalyticsResponse {
  total_documents: number
  total_summaries: number
  total_time_saved: number
  documents_today: number
  success_rate: number
}

// API functions
export const apiService = {
  // Upload document
  async uploadDocument(file: File): Promise<DocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  },

  // Process document
  async processDocument(documentId: string): Promise<SummaryResponse> {
    const response = await api.post('/api/process', {
      document_id: documentId,
    })
    
    return response.data
  },

  // Get user documents
  async getDocuments(): Promise<DocumentResponse[]> {
    const response = await api.get('/api/documents')
    return response.data
  },

  // Get summaries
  async getSummaries(): Promise<SummaryResponse[]> {
    const response = await api.get('/api/summaries')
    return response.data
  },

  // Get analytics
  async getAnalytics(): Promise<AnalyticsResponse> {
    const response = await api.get('/api/analytics')
    return response.data
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/api/documents/${documentId}`)
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health')
    return response.data
  },
}

export default apiService
