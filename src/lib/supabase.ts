import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          size_bytes: number
          file_type: string
          status: 'uploading' | 'processing' | 'completed' | 'failed'
          progress: number
          upload_date: string
          processing_started_at: string | null
          processing_completed_at: string | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          size_bytes: number
          file_type: string
          status?: 'uploading' | 'processing' | 'completed' | 'failed'
          progress?: number
          upload_date?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          size_bytes?: number
          file_type?: string
          status?: 'uploading' | 'processing' | 'completed' | 'failed'
          progress?: number
          upload_date?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_summaries: {
        Row: {
          id: string
          document_id: string
          user_id: string
          title: string
          key_points: string[]
          word_count: number
          reading_time: string
          sentiment: 'positive' | 'neutral' | 'negative'
          categories: string[]
          full_summary: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          title: string
          key_points?: string[]
          word_count?: number
          reading_time?: string
          sentiment?: 'positive' | 'neutral' | 'negative'
          categories?: string[]
          full_summary: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          title?: string
          key_points?: string[]
          word_count?: number
          reading_time?: string
          sentiment?: 'positive' | 'neutral' | 'negative'
          categories?: string[]
          full_summary?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          total_documents: number
          total_summaries: number
          total_time_saved: number
          documents_today: number
          success_rate: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_documents?: number
          total_summaries?: number
          total_time_saved?: number
          documents_today?: number
          success_rate?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_documents?: number
          total_summaries?: number
          total_time_saved?: number
          documents_today?: number
          success_rate?: number
          last_updated?: string
          created_at?: string
        }
      }
    }
  }
}
