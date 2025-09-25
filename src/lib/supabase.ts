import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If env vars are missing, run in a safe demo mode instead of throwing at runtime.
const isDemoMode = !supabaseUrl || !supabaseAnonKey

type AnyObj = Record<string, any>

// Minimal mock to satisfy the methods used by the app when Supabase env is absent.
const createSupabaseMock = (): AnyObj => {
  const ok = Promise.resolve({ data: null, error: null })

  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null }
      },
      onAuthStateChange(_cb: any) {
        return { data: { subscription: { unsubscribe() {} } } }
      },
      async signUp(_args: any) {
        return { data: { user: null, session: null }, error: null }
      },
      async signInWithPassword(_args: any) {
        return { data: { user: null, session: null }, error: null }
      },
      async signOut() {
        return { error: null }
      },
      async resetPasswordForEmail(_email: string, _opts?: any) {
        return { data: {}, error: null }
      },
    },
    from(_table: string) {
      return {
        upsert(_values: any) {
          return {
            select() {
              return ok
            },
          }
        },
        update(_values: any) {
          return {
            eq(_col: string, _val: any) {
              return ok
            },
          }
        },
      }
    },
  }
}

export const supabase: AnyObj = isDemoMode
  ? (() => {
      console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Running in demo mode with a no-op Supabase client.')
      return createSupabaseMock()
    })()
  : createClient(supabaseUrl as string, supabaseAnonKey as string)

// Export a flag so the UI can optionally reflect demo mode if needed.
export const IS_DEMO_MODE = isDemoMode

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
