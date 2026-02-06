// @ts-nocheck
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useEffectiveRole } from '@/lib/store'
import { getSupabase } from '@/lib/supabase/client'
import {
  BarChart3, TrendingUp, TrendingDown, Activity, Heart, Brain,
  Zap, Clock, CheckCircle, Award, Users, ChevronDown, ChevronRight,
  Target, Flame, BookOpen, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

// ── Types ──

interface WeeklyProgress {
  id: string; week_number: number; week_start: string
  sessions_completed: number; total_minutes: number
  avg_hrv: number | null; avg_coherence: number | null; avg_capacity_index: number | null
  window_of_tolerance_delta: number | null
  lessons_completed: number; lessons_total: number
  journal_entries: number; engagement_score: number | null; progress_score: number | null
}

interface Milestone {
  id: string; milestone_type: string; title: string; description: string | null; achieved_at: string
}

interface ParticipantSummary {
  user_id: string; full_name: string; email: string
  latest_capacity: number | null; latest_coherence: number | null
  total_sessions: number; total_minutes: number
  engagement_avg: number | null; progress_trend: 'up' | 'down' | 'flat'
  week_count: number
}

interface CohortSummary {
  cohort_id: string; cohort_name: string; status: string
  participant_count: number; avg_engagement: number | null
  avg_capacity: number | null; avg_coherence: number | null
  facilitator_names: string[]
}

// ── Helpers ──

const MetricCard = ({ icon: Icon, label, value, unit, trend, color }: any) => (
  <div className="card p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      {trend !== undefined && trend !== null && (
        <div className={`ml-auto flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          {trend !== 0 && <span>{Math.abs(trend).toFixed(0)}{unit === '%' ? 'pts' : ''}</span>}
        </div>
      )}
    </div>
    <p className="font-display text-2xl font-bold text-text-primary">
      {value !== null && value !== undefined ? (typeof value === 'number' ? value.toFixed(0) : value) : '--'}
      {value !== null && unit && <span className="text-sm font-normal text-text-muted ml-1">{unit}</span>}
    </p>
    <p className="text-xs text-text-muted mt-1">{label}</p>
  </div>
)

const ProgressBar = ({ value, max, color = 'bg-[#2A9D8F]' }: { value: number; max: number; color?: string }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%` }} />
  </div>
)

const WeeklyChart = ({ data }: { data: WeeklyProgress[] }) => {
  if (!data.length) return null
  const maxCapacity = Math.max(...data.map(w => w.avg_capacity_index || 0), 100)
  const maxEngagement = Math.max(...data.map(w => w.engagement_score || 0), 100)

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-semibold mb-4">Weekly Progress</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map(w => {
          const capH = ((w.avg_capacity_index || 0) / maxCapacity) * 100
          const engH = ((w.engagement_score || 0) / maxEngagement) * 100
          return (
            <div key={w.week_number} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: '120px' }}>
                <div className="w-3 bg-[#2A9D8F] rounded-t-sm transition-all duration-500" style={{ height: `${capH}%` }} title={`Capacity: ${w.avg_capacity_index?.toFixed(0) || '--'}`} />
                <div className="w-3 bg-[#476B8E] rounded-t-sm transition-all duration-500" style={{ height: `${engH}%` }} title={`Engagement: ${w.engagement_score?.toFixed(0) || '--'}`} />
              </div>
              <span className="text-[10px] text-text-muted">W{w.week_number}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-light">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#2A9D8F]" /><span className="text-xs text-text-muted">Capacity</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#476B8E]" /><span className="text-xs text-text-muted">Engagement</span></div>
      </div>
    </div>
  )
}

const MilestoneTimeline = ({ milestones }: { milestones: Milestone[] }) => {
  const iconMap: Record<string, any> = {
    first_session: Zap, week_complete: CheckCircle, streak_3: Flame, streak_7: Flame,
    capacity_up: TrendingUp, program_complete: Award,
  }
  const colorMap: Record<string, string> = {
    first_session: 'bg-blue-100 text-blue-600', week_complete: 'bg-emerald-100 text-emerald-600',
    streak_3: 'bg-orange-100 text-orange-600', streak_7: 'bg-red-100 text-red-600',
    capacity_up: 'bg-teal-100 text-teal-600', program_complete: 'bg-purple-100 text-purple-600',
  }

  if (!milestones.length) return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-semibold mb-3">Milestones</h3>
      <div className="text-center py-6">
        <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-text-muted">Milestones will appear as you progress</p>
      </div>
    </div>
  )

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-semibold mb-4">Milestones</h3>
      <div className="space-y-3">
        {milestones.map(m => {
          const Icon = iconMap[m.milestone_type] || Award
          const color = colorMap[m.milestone_type] || 'bg-gray-100 text-gray-600'
          return (
            <div key={m.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{m.title}</p>
                {m.description && <p className="text-xs text-text-muted">{m.description}</p>}
              </div>
              <span className="text-[10px] text-text-muted flex-shrink-0">
                {new Date(m.achieved_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const EmptyState = ({ role }: { role: string }) => (
  <div className="card p-12 text-center">
    <BarChart3 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
    <h3 className="font-display text-xl font-semibold text-text-primary mb-2">No Progress Data Yet</h3>
    <p className="text-text-secondary max-w-md mx-auto">
      {role === 'participant'
        ? 'Your progress will appear here as you complete VR sessions, lessons, and journal reflections. Data syncs automatically from your devices.'
        : 'Progress data will populate as participants complete sessions and as data flows in through the API integration.'}
    </p>
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-xs text-text-muted">
      <Activity className="w-3.5 h-3.5" />
      API integration pending
    </div>
  </div>
)

// ── Participant View ──

function ParticipantProgress({ userId }: { userId: string }) {
  const [weekly, setWeekly] = useState<WeeklyProgress[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const [w, m] = await Promise.all([
        supabase.from('progress_weekly').select('*').eq('user_id', userId).order('week_number', { ascending: true }),
        supabase.from('progress_milestones').select('*').eq('user_id', userId).order('achieved_at', { ascending: false }).limit(10),
      ])
      setWeekly(w.data || [])
      setMilestones(m.data || [])
      setLoading(false)
    }
    fetch()
  }, [userId])

  if (loading) return <LoadingSkeleton />

  const latest = weekly[weekly.length - 1]
  const prev = weekly.length > 1 ? weekly[weekly.length - 2] : null
  const delta = (key: string) => latest && prev ? (latest[key] || 0) - (prev[key] || 0) : null

  if (!weekly.length) return <EmptyState role="participant" />

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Brain} label="Capacity Index" value={latest?.avg_capacity_index} unit=""
          trend={delta('avg_capacity_index')} color="bg-teal-50 text-teal-600" />
        <MetricCard icon={Heart} label="Avg HRV" value={latest?.avg_hrv} unit="ms"
          trend={delta('avg_hrv')} color="bg-rose-50 text-rose-600" />
        <MetricCard icon={Activity} label="Coherence" value={latest?.avg_coherence} unit="%"
          trend={delta('avg_coherence')} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={Target} label="Engagement" value={latest?.engagement_score} unit="%"
          trend={delta('engagement_score')} color="bg-amber-50 text-amber-600" />
      </div>

      {/* This Week Summary */}
      {latest && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Week {latest.week_number}</h3>
            <span className="text-xs text-text-muted">{new Date(latest.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })} - present</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-text-muted">Sessions</span>
                <span className="text-xs font-medium">{latest.sessions_completed}</span>
              </div>
              <ProgressBar value={latest.sessions_completed} max={6} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-text-muted">Lessons</span>
                <span className="text-xs font-medium">{latest.lessons_completed}/{latest.lessons_total}</span>
              </div>
              <ProgressBar value={latest.lessons_completed} max={latest.lessons_total} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-text-muted">Journal</span>
                <span className="text-xs font-medium">{latest.journal_entries}</span>
              </div>
              <ProgressBar value={latest.journal_entries} max={5} color="bg-[#E9C46A]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            {latest.total_minutes} minutes total this week
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <WeeklyChart data={weekly} />
        <MilestoneTimeline milestones={milestones} />
      </div>
    </div>
  )
}

// ── Facilitator View ──

function FacilitatorProgress({ userId }: { userId: string }) {
  const [cohorts, setCohorts] = useState<any[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [participants, setParticipants] = useState<ParticipantSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const { data } = await supabase.from('cohort_members')
        .select('cohort:cohorts(id, name, status, current_week)')
        .eq('user_id', userId).eq('role', 'facilitator')
      const cohortList = data?.map((d: any) => d.cohort).filter(Boolean) || []
      setCohorts(cohortList)
      if (cohortList.length) setSelectedCohort(cohortList[0].id)
      setLoading(false)
    }
    fetch()
  }, [userId])

  useEffect(() => {
    if (!selectedCohort) return
    const fetchParticipants = async () => {
      const supabase = getSupabase()
      if (!supabase) return

      // Get cohort members
      const { data: members } = await supabase.from('cohort_members')
        .select('user_id, profile:profiles(full_name, email)')
        .eq('cohort_id', selectedCohort).eq('role', 'participant')

      if (!members?.length) { setParticipants([]); return }

      // Get weekly progress for all participants in batch
      const userIds = members.map(m => m.user_id)
      const { data: weeklyData } = await supabase.from('progress_weekly')
        .select('*').in('user_id', userIds).eq('cohort_id', selectedCohort).order('week_number', { ascending: true })

      const summaries: ParticipantSummary[] = members.map(m => {
        const weeks = weeklyData?.filter(w => w.user_id === m.user_id) || []
        const latest = weeks[weeks.length - 1]
        const prev = weeks.length > 1 ? weeks[weeks.length - 2] : null
        const trend = latest && prev
          ? (latest.progress_score || 0) > (prev.progress_score || 0) ? 'up' : (latest.progress_score || 0) < (prev.progress_score || 0) ? 'down' : 'flat'
          : 'flat'

        return {
          user_id: m.user_id,
          full_name: m.profile?.full_name || 'Unknown',
          email: m.profile?.email || '',
          latest_capacity: latest?.avg_capacity_index || null,
          latest_coherence: latest?.avg_coherence || null,
          total_sessions: weeks.reduce((s, w) => s + (w.sessions_completed || 0), 0),
          total_minutes: weeks.reduce((s, w) => s + (w.total_minutes || 0), 0),
          engagement_avg: weeks.length ? weeks.reduce((s, w) => s + (w.engagement_score || 0), 0) / weeks.length : null,
          progress_trend: trend,
          week_count: weeks.length,
        }
      })

      setParticipants(summaries.sort((a, b) => (b.engagement_avg || 0) - (a.engagement_avg || 0)))
    }
    fetchParticipants()
  }, [selectedCohort])

  if (loading) return <LoadingSkeleton />
  if (!cohorts.length) return <EmptyState role="facilitator" />

  const activeCohort = cohorts.find(c => c.id === selectedCohort)
  const avgEngagement = participants.length ? participants.reduce((s, p) => s + (p.engagement_avg || 0), 0) / participants.length : 0
  const avgCapacity = participants.length ? participants.reduce((s, p) => s + (p.latest_capacity || 0), 0) / participants.filter(p => p.latest_capacity).length : 0
  const atRisk = participants.filter(p => (p.engagement_avg || 0) < 50)

  return (
    <div className="space-y-6">
      {/* Cohort selector */}
      {cohorts.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted">Cohort:</label>
          <select value={selectedCohort || ''} onChange={e => setSelectedCohort(e.target.value)}
            className="input text-sm py-1.5 w-auto">
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Cohort Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Participants" value={participants.length} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={Target} label="Avg Engagement" value={avgEngagement} unit="%" color="bg-amber-50 text-amber-600" />
        <MetricCard icon={Brain} label="Avg Capacity" value={avgCapacity || null} unit="" color="bg-teal-50 text-teal-600" />
        <MetricCard icon={Activity} label="At Risk" value={atRisk.length} unit="" color={atRisk.length ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"} />
      </div>

      {/* Participant Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <h3 className="font-display text-lg font-semibold">
            {activeCohort?.name || 'Cohort'} Participants
          </h3>
        </div>
        {participants.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">No participant data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Participant</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Capacity</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Coherence</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Sessions</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Engagement</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {participants.map(p => (
                  <tr key={p.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {p.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-text-primary">{p.full_name}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-medium">{p.latest_capacity?.toFixed(0) || '--'}</span>
                    </td>
                    <td className="text-center px-4 py-3">{p.latest_coherence?.toFixed(0) || '--'}%</td>
                    <td className="text-center px-4 py-3">{p.total_sessions}</td>
                    <td className="text-center px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16"><ProgressBar value={p.engagement_avg || 0} max={100} color={(p.engagement_avg || 0) < 50 ? 'bg-red-400' : 'bg-[#2A9D8F]'} /></div>
                        <span className="text-xs font-medium w-8">{p.engagement_avg?.toFixed(0) || '--'}%</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      {p.progress_trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" /> :
                       p.progress_trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400 mx-auto" /> :
                       <Minus className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Admin View ──

function AdminProgress() {
  const [cohortSummaries, setCohortSummaries] = useState<CohortSummary[]>([])
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null)
  const [cohortParticipants, setCohortParticipants] = useState<Record<string, ParticipantSummary[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = getSupabase()
      if (!supabase) return

      // Get all cohorts with members
      const { data: cohorts } = await supabase.from('cohorts').select('id, name, status')
        .order('created_at', { ascending: false })

      if (!cohorts?.length) { setLoading(false); return }

      // Get all cohort members
      const { data: allMembers } = await supabase.from('cohort_members')
        .select('cohort_id, user_id, role, profile:profiles(full_name)')

      // Get latest weekly progress per cohort
      const { data: weeklyData } = await supabase.from('progress_weekly').select('*')
        .order('week_number', { ascending: false })

      const summaries: CohortSummary[] = cohorts.map(c => {
        const members = allMembers?.filter(m => m.cohort_id === c.id) || []
        const participants = members.filter(m => m.role === 'participant')
        const facilitators = members.filter(m => m.role === 'facilitator')
        const pIds = participants.map(p => p.user_id)
        const latestWeeks = weeklyData?.filter(w => w.cohort_id === c.id && pIds.includes(w.user_id)) || []

        // Get only the latest week per user
        const latestPerUser: Record<string, any> = {}
        latestWeeks.forEach(w => {
          if (!latestPerUser[w.user_id] || w.week_number > latestPerUser[w.user_id].week_number) {
            latestPerUser[w.user_id] = w
          }
        })
        const latestVals = Object.values(latestPerUser)

        return {
          cohort_id: c.id, cohort_name: c.name, status: c.status,
          participant_count: participants.length,
          avg_engagement: latestVals.length ? latestVals.reduce((s, w) => s + (w.engagement_score || 0), 0) / latestVals.length : null,
          avg_capacity: latestVals.length ? latestVals.reduce((s, w) => s + (w.avg_capacity_index || 0), 0) / latestVals.filter(w => w.avg_capacity_index).length || null : null,
          avg_coherence: latestVals.length ? latestVals.reduce((s, w) => s + (w.avg_coherence || 0), 0) / latestVals.filter(w => w.avg_coherence).length || null : null,
          facilitator_names: facilitators.map(f => f.profile?.full_name || 'Unknown'),
        }
      })

      setCohortSummaries(summaries)
      setLoading(false)
    }
    fetch()
  }, [])

  const toggleCohort = async (cohortId: string) => {
    if (expandedCohort === cohortId) { setExpandedCohort(null); return }
    setExpandedCohort(cohortId)

    if (cohortParticipants[cohortId]) return

    const supabase = getSupabase()
    if (!supabase) return
    const { data: members } = await supabase.from('cohort_members')
      .select('user_id, profile:profiles(full_name, email)')
      .eq('cohort_id', cohortId).eq('role', 'participant')
    const { data: weeklyData } = await supabase.from('progress_weekly')
      .select('*').eq('cohort_id', cohortId).order('week_number', { ascending: true })

    const summaries = (members || []).map(m => {
      const weeks = weeklyData?.filter(w => w.user_id === m.user_id) || []
      const latest = weeks[weeks.length - 1]
      return {
        user_id: m.user_id, full_name: m.profile?.full_name || 'Unknown', email: m.profile?.email || '',
        latest_capacity: latest?.avg_capacity_index || null, latest_coherence: latest?.avg_coherence || null,
        total_sessions: weeks.reduce((s, w) => s + (w.sessions_completed || 0), 0),
        total_minutes: weeks.reduce((s, w) => s + (w.total_minutes || 0), 0),
        engagement_avg: weeks.length ? weeks.reduce((s, w) => s + (w.engagement_score || 0), 0) / weeks.length : null,
        progress_trend: 'flat' as const, week_count: weeks.length,
      }
    })
    setCohortParticipants(prev => ({ ...prev, [cohortId]: summaries }))
  }

  if (loading) return <LoadingSkeleton />
  if (!cohortSummaries.length) return <EmptyState role="admin" />

  const totalParticipants = cohortSummaries.reduce((s, c) => s + c.participant_count, 0)
  const avgEngAll = cohortSummaries.filter(c => c.avg_engagement).length
    ? cohortSummaries.reduce((s, c) => s + (c.avg_engagement || 0), 0) / cohortSummaries.filter(c => c.avg_engagement).length : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total Participants" value={totalParticipants} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={BookOpen} label="Active Cohorts" value={cohortSummaries.filter(c => c.status === 'active').length} color="bg-teal-50 text-teal-600" />
        <MetricCard icon={Target} label="Avg Engagement" value={avgEngAll} unit="%" color="bg-amber-50 text-amber-600" />
        <MetricCard icon={BarChart3} label="Total Cohorts" value={cohortSummaries.length} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="space-y-3">
        {cohortSummaries.map(c => (
          <div key={c.cohort_id} className="card overflow-hidden">
            <button onClick={() => toggleCohort(c.cohort_id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                {expandedCohort === c.cohort_id ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                <div>
                  <p className="font-medium text-text-primary">{c.cohort_name}</p>
                  <p className="text-xs text-text-muted">{c.participant_count} participants {c.facilitator_names.length ? ` \u00B7 ${c.facilitator_names.join(', ')}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div className="text-center"><p className="font-medium text-text-primary">{c.avg_capacity?.toFixed(0) || '--'}</p><p className="text-text-muted">Capacity</p></div>
                <div className="text-center"><p className="font-medium text-text-primary">{c.avg_engagement?.toFixed(0) || '--'}%</p><p className="text-text-muted">Engagement</p></div>
                <span className={`px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              </div>
            </button>
            {expandedCohort === c.cohort_id && cohortParticipants[c.cohort_id] && (
              <div className="border-t border-border-light">
                {cohortParticipants[c.cohort_id].length === 0 ? (
                  <p className="p-4 text-sm text-text-muted text-center">No participant data yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border-light">
                      {cohortParticipants[c.cohort_id].map(p => (
                        <tr key={p.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium">{p.full_name}</td>
                          <td className="px-4 py-3 text-center">{p.latest_capacity?.toFixed(0) || '--'}</td>
                          <td className="px-4 py-3 text-center">{p.total_sessions} sessions</td>
                          <td className="px-4 py-3 text-center">{p.engagement_avg?.toFixed(0) || '--'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Superadmin View ──

function SuperadminProgress() {
  const [stats, setStats] = useState({ totalUsers: 0, totalSessions: 0, totalMinutes: 0, activeCohorts: 0 })
  const [cohortSummaries, setCohortSummaries] = useState<CohortSummary[]>([])
  const [recentMilestones, setRecentMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = getSupabase()
      if (!supabase) return

      const [usersRes, cohortsRes, weeklyRes, milestonesRes, membersRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('cohorts').select('id, name, status').order('created_at', { ascending: false }),
        supabase.from('progress_weekly').select('*').order('week_number', { ascending: false }),
        supabase.from('progress_milestones').select('*, user:profiles!user_id(full_name)').order('achieved_at', { ascending: false }).limit(10),
        supabase.from('cohort_members').select('cohort_id, user_id, role, profile:profiles(full_name)'),
      ])

      const weekly = weeklyRes.data || []
      const cohorts = cohortsRes.data || []
      const allMembers = membersRes.data || []

      setStats({
        totalUsers: usersRes.count || 0,
        totalSessions: weekly.reduce((s, w) => s + (w.sessions_completed || 0), 0),
        totalMinutes: weekly.reduce((s, w) => s + (w.total_minutes || 0), 0),
        activeCohorts: cohorts.filter(c => c.status === 'active').length,
      })

      const summaries: CohortSummary[] = cohorts.map(c => {
        const members = allMembers.filter(m => m.cohort_id === c.id)
        const participants = members.filter(m => m.role === 'participant')
        const facilitators = members.filter(m => m.role === 'facilitator')
        const pIds = participants.map(p => p.user_id)
        const cWeekly = weekly.filter(w => w.cohort_id === c.id && pIds.includes(w.user_id))

        const latestPerUser: Record<string, any> = {}
        cWeekly.forEach(w => {
          if (!latestPerUser[w.user_id] || w.week_number > latestPerUser[w.user_id].week_number) {
            latestPerUser[w.user_id] = w
          }
        })
        const lv = Object.values(latestPerUser)

        return {
          cohort_id: c.id, cohort_name: c.name, status: c.status,
          participant_count: participants.length,
          avg_engagement: lv.length ? lv.reduce((s, w) => s + (w.engagement_score || 0), 0) / lv.length : null,
          avg_capacity: lv.filter(w => w.avg_capacity_index).length ? lv.reduce((s, w) => s + (w.avg_capacity_index || 0), 0) / lv.filter(w => w.avg_capacity_index).length : null,
          avg_coherence: lv.filter(w => w.avg_coherence).length ? lv.reduce((s, w) => s + (w.avg_coherence || 0), 0) / lv.filter(w => w.avg_coherence).length : null,
          facilitator_names: facilitators.map(f => f.profile?.full_name || 'Unknown'),
        }
      })

      setCohortSummaries(summaries)
      setRecentMilestones(milestonesRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <LoadingSkeleton />

  const hasData = stats.totalSessions > 0

  return (
    <div className="space-y-6">
      {/* Platform-wide stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={Zap} label="Total Sessions" value={stats.totalSessions} color="bg-teal-50 text-teal-600" />
        <MetricCard icon={Clock} label="Total Minutes" value={stats.totalMinutes} color="bg-amber-50 text-amber-600" />
        <MetricCard icon={BookOpen} label="Active Cohorts" value={stats.activeCohorts} color="bg-purple-50 text-purple-600" />
      </div>

      {!hasData && <EmptyState role="superadmin" />}

      {hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cohort Leaderboard */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border-light">
              <h3 className="font-display text-lg font-semibold">Cohort Performance</h3>
            </div>
            <div className="divide-y divide-border-light">
              {cohortSummaries.map(c => (
                <div key={c.cohort_id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{c.cohort_name}</p>
                    <p className="text-xs text-text-muted">{c.participant_count} participants {c.facilitator_names.length ? ` \u00B7 ${c.facilitator_names.join(', ')}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center"><p className="font-semibold">{c.avg_capacity?.toFixed(0) || '--'}</p><p className="text-text-muted">Cap</p></div>
                    <div className="text-center"><p className="font-semibold">{c.avg_engagement?.toFixed(0) || '--'}%</p><p className="text-text-muted">Eng</p></div>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                  </div>
                </div>
              ))}
              {!cohortSummaries.length && <p className="p-4 text-sm text-text-muted text-center">No cohorts yet</p>}
            </div>
          </div>

          {/* Recent Milestones */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border-light">
              <h3 className="font-display text-lg font-semibold">Recent Milestones</h3>
            </div>
            {recentMilestones.length ? (
              <div className="divide-y divide-border-light">
                {recentMilestones.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-4">
                    <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-text-muted">{m.user?.full_name || 'Unknown'}</p>
                    </div>
                    <span className="text-xs text-text-muted">{new Date(m.achieved_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-text-muted text-center">No milestones yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Loading ──

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  )
}

// ── Main Page ──

export default function ProgressPage() {
  const { user } = useAuth()
  const effectiveRole = useEffectiveRole()

  const titles: Record<string, string> = {
    participant: 'My Progress',
    facilitator: 'Cohort Progress',
    admin: 'Program Progress',
    superadmin: 'Platform Analytics',
  }

  const subtitles: Record<string, string> = {
    participant: 'Track your nervous system capacity growth across sessions',
    facilitator: 'Monitor participant progress across your cohorts',
    admin: 'Overview of all cohorts and facilitator performance',
    superadmin: 'Platform-wide analytics and progress tracking',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-text-primary">{titles[effectiveRole] || 'Progress'}</h1>
        <p className="text-text-secondary mt-1">{subtitles[effectiveRole] || ''}</p>
      </div>

      {effectiveRole === 'participant' && user && <ParticipantProgress userId={user.id} />}
      {effectiveRole === 'facilitator' && user && <FacilitatorProgress userId={user.id} />}
      {effectiveRole === 'admin' && <AdminProgress />}
      {effectiveRole === 'superadmin' && <SuperadminProgress />}
    </div>
  )
}
