// @ts-nocheck
'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

interface Cohort {
  id: string
  name: string
  slug: string
  status: string
  start_date: string
  current_week: number
  organization_id: string | null
  course_id: string | null
}

interface CohortMember {
  id: string
  cohort_id: string
  user_id: string
  role: string
  joined_at: string
}

interface Channel {
  id: string
  name: string
  channel_type: string
}

interface CohortWithDetails extends Cohort {
  members: Array<CohortMember & { user: Profile }>
  channels: Channel[]
  facilitators: Profile[]
  participantCount: number
}

export function useCohort(cohortId?: string) {
  const [cohort, setCohort] = useState<CohortWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { setCurrentCohort } = useAppStore()

  const fetchCohort = useCallback(async () => {
    const supabase = getSupabase()
    if (!cohortId || !supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: cohortError } = await supabase
        .from('cohorts')
        .select('*, members:cohort_members(*, user:profiles(*)), channels(*)')
        .eq('id', cohortId)
        .single()

      if (cohortError) throw cohortError

      const enriched: CohortWithDetails = {
        ...data,
        facilitators: data.members.filter((m: any) => m.role === 'facilitator').map((m: any) => m.user),
        participantCount: data.members.filter((m: any) => m.role === 'participant').length,
      }

      setCohort(enriched)
      setCurrentCohort(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [cohortId, setCurrentCohort])

  useEffect(() => { fetchCohort() }, [fetchCohort])

  return { cohort, loading, error, refetch: fetchCohort }
}

export function useUserCohorts() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAppStore()

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase || !user) {
      setLoading(false)
      return
    }

    const fetchCohorts = async () => {
      try {
        const { data, error } = await supabase
          .from('cohort_members')
          .select('cohort:cohorts(*)')
          .eq('user_id', user.id)

        if (error) throw error

        const userCohorts = data
          .map((d: any) => d.cohort)
          .filter(Boolean)
          .sort((a: Cohort, b: Cohort) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

        setCohorts(userCohorts)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchCohorts()
  }, [user])

  return { cohorts, loading, error }
}

export function useFacilitatorCohorts() {
  const [cohorts, setCohorts] = useState<CohortWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAppStore()

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase || !user) {
      setLoading(false)
      return
    }

    const fetchCohorts = async () => {
      try {
        const { data, error } = await supabase
          .from('cohort_members')
          .select('cohort:cohorts(*, members:cohort_members(*, user:profiles(*)))')
          .eq('user_id', user.id)
          .eq('role', 'facilitator')

        if (error) throw error

        const facilitatorCohorts = data
          .map((d: any) => ({
            ...d.cohort,
            participantCount: d.cohort.members.filter((m: any) => m.role === 'participant').length,
            facilitators: d.cohort.members.filter((m: any) => m.role === 'facilitator').map((m: any) => m.user),
          }))
          .filter(Boolean)

        setCohorts(facilitatorCohorts)
      } catch (err) {
        console.error('Error fetching facilitator cohorts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCohorts()
  }, [user])

  return { cohorts, loading }
}
