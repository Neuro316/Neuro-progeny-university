// @ts-nocheck
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'participant' | 'facilitator' | 'admin' | 'superadmin'
  organization_id: string | null
}

const DEBUG = true // Set to false in production

function log(...args: any[]) {
  if (DEBUG) console.log('[useAuth]', ...args)
}

function logError(...args: any[]) {
  console.error('[useAuth ERROR]', ...args)
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, setUser } = useAppStore()
  const initStarted = useRef(false)
  const retryCount = useRef(0)
  const maxRetries = 3

  // Fetch profile with retry logic
  const fetchProfile = useCallback(async (userId: string, userEmail?: string): Promise<Profile | null> => {
    const supabase = getSupabase()
    if (!supabase) {
      logError('Supabase client not available')
      return null
    }

    log('Fetching profile for user:', userId)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, organization_id')
        .eq('id', userId)
        .single()

      if (error) {
        logError('Profile fetch error:', error.code, error.message)
        
        // If profile doesn't exist, it might be a new user - don't retry
        if (error.code === 'PGRST116') {
          log('Profile not found - might be new user')
          return null
        }
        
        // For other errors, we might want to retry
        throw error
      }

      if (data) {
        log('Profile fetched successfully:', { 
          id: data.id, 
          email: data.email, 
          role: data.role 
        })
        
        // Ensure role is valid
        const validRoles = ['participant', 'facilitator', 'admin', 'superadmin']
        if (!data.role || !validRoles.includes(data.role)) {
          log('Invalid or missing role, defaulting to participant')
          data.role = 'participant'
        }
        
        return data as Profile
      }

      return null
    } catch (err: any) {
      logError('Profile fetch exception:', err)
      return null
    }
  }, [])

  // Main initialization effect
  useEffect(() => {
    // Prevent double initialization
    if (initStarted.current) {
      log('Init already started, skipping')
      return
    }
    initStarted.current = true

    const supabase = getSupabase()
    if (!supabase) {
      logError('Supabase client not available during init')
      setError('Database connection unavailable')
      setLoading(false)
      return
    }

    let mounted = true
    let authSubscription: any = null

    // Safety timeout - force loading to complete
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        logError('Auth timeout reached after 8 seconds')
        setLoading(false)
      }
    }, 8000)

    const initAuth = async () => {
      try {
        log('Starting auth initialization...')
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          logError('getSession error:', sessionError)
          setError(sessionError.message)
          if (mounted) setLoading(false)
          return
        }

        if (!mounted) return

        log('Session status:', currentSession ? 'ACTIVE' : 'NONE')
        setSession(currentSession)

        // If we have a session, fetch the profile
        if (currentSession?.user) {
          log('User ID:', currentSession.user.id)
          log('User email:', currentSession.user.email)
          
          const profile = await fetchProfile(
            currentSession.user.id, 
            currentSession.user.email
          )
          
          if (mounted) {
            if (profile) {
              log('Setting user profile with role:', profile.role)
              setUser(profile)
            } else {
              // Profile doesn't exist or couldn't be fetched
              // Create a minimal profile from session data
              log('Creating minimal profile from session')
              const minimalProfile: Profile = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                full_name: currentSession.user.user_metadata?.full_name || 
                           currentSession.user.email?.split('@')[0] || '',
                avatar_url: currentSession.user.user_metadata?.avatar_url || null,
                role: 'participant',
                organization_id: null
              }
              setUser(minimalProfile)
            }
          }
        } else {
          log('No active session')
        }
      } catch (err: any) {
        logError('Auth init error:', err)
        setError(err.message || 'Authentication failed')
      } finally {
        if (mounted) {
          log('Auth initialization complete')
          setLoading(false)
        }
      }
    }

    // Set up auth state change listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, newSession: Session | null) => {
          if (!mounted) return
          
          log('Auth state changed:', event)
          setSession(newSession)

          if (event === 'SIGNED_IN' && newSession?.user) {
            log('User signed in, fetching profile...')
            const profile = await fetchProfile(
              newSession.user.id, 
              newSession.user.email
            )
            if (mounted && profile) {
              log('Setting user after sign in, role:', profile.role)
              setUser(profile)
            }
          } else if (event === 'SIGNED_OUT') {
            log('User signed out')
            setUser(null)
          } else if (event === 'TOKEN_REFRESHED') {
            log('Token refreshed')
          }
        }
      )
      
      authSubscription = subscription
    }

    // Run initialization
    setupAuthListener()
    initAuth()

    // Cleanup
    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [fetchProfile, setUser])

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')
    
    log('Signing in with email:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      logError('Sign in error:', error)
      throw error
    }
    log('Sign in successful')
    return data
  }, [])

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')
    
    log('Signing up:', email)
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { full_name: fullName } 
      } 
    })
    if (error) {
      logError('Sign up error:', error)
      throw error
    }
    log('Sign up successful')
    return data
  }, [])

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')
    
    log('Starting Google OAuth...')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    })
    if (error) {
      logError('Google OAuth error:', error)
      throw error
    }
    log('Google OAuth initiated')
    return data
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')
    
    log('Signing out...')
    setUser(null)
    await supabase.auth.signOut()
    log('Signed out, redirecting to login')
    window.location.href = '/login'
  }, [setUser])

  // Force refresh profile (useful after role changes)
  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null
    
    log('Force refreshing profile...')
    const profile = await fetchProfile(session.user.id, session.user.email)
    if (profile) {
      setUser(profile)
    }
    return profile
  }, [session, fetchProfile, setUser])

  return { 
    session, 
    user, 
    loading, 
    error,
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut,
    refreshProfile,
    isReady: !loading,
    isAuthenticated: !!session
  }
}
