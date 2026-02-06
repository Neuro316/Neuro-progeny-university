// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing sign in...')
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return
    processedRef.current = true

    const supabase = getSupabase()
    
    if (!supabase) {
      console.error('[AuthCallback] Supabase client not available')
      setError('Connection error')
      setStatus('Error: Could not connect to database')
      setTimeout(() => router.push('/login?error=connection'), 2000)
      return
    }

    console.log('[AuthCallback] Processing auth callback...')
    console.log('[AuthCallback] URL:', window.location.href)

    let mounted = true
    let subscription: any = null

    // Safety timeout
    const timeout = setTimeout(() => {
      if (mounted) {
        console.error('[AuthCallback] Timeout reached')
        setStatus('Taking too long... Redirecting to login')
        setTimeout(() => router.push('/login?error=timeout'), 1000)
      }
    }, 10000)

    const processCallback = async () => {
      try {
        // First, listen for auth state changes
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthCallback] Auth event:', event)
            
            if (event === 'SIGNED_IN' && session) {
              console.log('[AuthCallback] Sign in successful!')
              console.log('[AuthCallback] User:', session.user?.email)
              
              if (mounted) {
                setStatus('Success! Redirecting to dashboard...')
                clearTimeout(timeout)
                
                // Small delay to ensure session is persisted
                setTimeout(() => {
                  if (mounted) {
                    router.push('/dashboard')
                  }
                }, 500)
              }
            }
          }
        )
        subscription = sub

        // Check if we already have a session (might have been set before listener)
        await new Promise(resolve => setTimeout(resolve, 500)) // Let URL parsing complete
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError)
          throw sessionError
        }

        if (session) {
          console.log('[AuthCallback] Session already exists, redirecting...')
          if (mounted) {
            setStatus('Session found! Redirecting...')
            clearTimeout(timeout)
            setTimeout(() => router.push('/dashboard'), 300)
          }
          return
        }

        // No session yet, wait a bit more for OAuth to complete
        console.log('[AuthCallback] No session yet, waiting...')
        setStatus('Processing authentication...')
        
        // Wait and check again
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        
        if (retrySession) {
          console.log('[AuthCallback] Session found on retry')
          if (mounted) {
            setStatus('Success! Redirecting...')
            clearTimeout(timeout)
            setTimeout(() => router.push('/dashboard'), 300)
          }
        } else {
          // Check URL for error
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const urlError = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')
          
          if (urlError) {
            console.error('[AuthCallback] URL error:', urlError, errorDescription)
            throw new Error(errorDescription || urlError)
          }
          
          // No error but no session - wait a final time
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: { session: finalSession } } = await supabase.auth.getSession()
          
          if (finalSession) {
            console.log('[AuthCallback] Session found on final check')
            if (mounted) {
              setStatus('Success! Redirecting...')
              clearTimeout(timeout)
              router.push('/dashboard')
            }
          } else {
            console.error('[AuthCallback] No session after all attempts')
            throw new Error('Authentication failed - no session created')
          }
        }
      } catch (err: any) {
        console.error('[AuthCallback] Error:', err)
        if (mounted) {
          setError(err.message || 'Authentication failed')
          setStatus('Sign in failed. Redirecting to login...')
          clearTimeout(timeout)
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(err.message || 'unknown')}`), 2000)
        }
      }
    }

    processCallback()

    return () => {
      mounted = false
      clearTimeout(timeout)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#3d8b8b] flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!error && (
            <div className="absolute -inset-2 rounded-2xl border-2 border-[#3d8b8b]/30 animate-ping" />
          )}
        </div>
        
        {/* Status text */}
        <div className="text-center">
          <p className={`text-lg font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>
            {status}
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>
        
        {/* Loading dots */}
        {!error && (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#3d8b8b] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#3d8b8b] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#3d8b8b] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  )
}
