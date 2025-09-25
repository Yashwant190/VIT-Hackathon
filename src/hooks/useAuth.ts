import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

export interface SignUpData {
  email: string
  password: string
  username: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session,
      })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session,
      })

      // Handle sign in
      if (event === 'SIGNED_IN' && session?.user) {
        // Create or update user profile
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            full_name: session.user.user_metadata?.full_name || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
          })
          .select()

        if (error) {
          console.error('Error creating/updating user profile:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          full_name: data.fullName || '',
        },
      },
    })

    if (error) {
      throw error
    }
  }, [])

  const signIn = useCallback(async (data: SignInData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw error
    }
  }, [])

  const updateProfile = useCallback(async (updates: {
    username?: string
    full_name?: string
    avatar_url?: string
  }) => {
    if (!authState.user) {
      throw new Error('No user logged in')
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', authState.user.id)

    if (error) {
      throw error
    }
  }, [authState.user])

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  }
}
