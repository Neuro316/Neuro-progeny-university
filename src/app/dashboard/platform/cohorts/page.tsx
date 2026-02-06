// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Plus, Users, Calendar, Edit2, Trash2, X, ChevronDown, ChevronRight, BookOpen,
  UserPlus, UserMinus, Search, Shield, User, Loader2
} from 'lucide-react'

interface Course {
  id: string
  title: string
  duration_weeks: number
}

interface Cohort {
  id: string
  name: string
  slug: string
  description: string | null
  status: 'upcoming' | 'active' | 'completed' | 'archived'
  start_date: string
  end_date: string | null
  current_week: number
  max_participants: number
  course_id: string | null
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url: string | null
}

interface CohortMember {
  id: string
  cohort_id: string
  user_id: string
  role: 'participant' | 'facilitator'
  joined_at: string
  user?: Profile
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', status: 'upcoming' as Cohort['status'],
    start_date: '', end_date: '', max_participants: 12, current_week: 0, course_id: ''
  })

  // Expanded cohort
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, CohortMember[]>>({})

  // Add member
  const [showAddMember, setShowAddMember] = useState<string | null>(null)
  const [addMemberRole, setAddMemberRole] = useState<'participant' | 'facilitator'>('participant')
  const [memberSearch, setMemberSearch] = useState('')
  const [addingMember, setAddingMember] = useState<string | null>(null)

  useEffect(() => { fetchCohorts(); fetchCourses(); fetchAllUsers() }, [])

  const fetchCohorts = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('cohorts').select('*').order('start_date', { ascending: false })
    setCohorts(data || [])
    setLoading(false)
  }

  const fetchCourses = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('courses').select('id, title, duration_weeks').order('title')
    setCourses(data || [])
  }

  const fetchAllUsers = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('id, full_name, email, role, avatar_url').order('full_name')
    setAllUsers(data || [])
  }

  const fetchMembers = async (cohortId: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase
      .from('cohort_members')
      .select('*, user:profiles(id, full_name, email, role, avatar_url)')
      .eq('cohort_id', cohortId)
      .order('role')
    setMembers(prev => ({ ...prev, [cohortId]: (data || []).map((m: any) => ({ ...m, user: m.user })) }))
  }

  const toggleCohort = (id: string) => {
    if (expandedCohort === id) { setExpandedCohort(null) }
    else { setExpandedCohort(id); if (!members[id]) fetchMembers(id) }
  }

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return null
    return courses.find(c => c.id === courseId)?.title || 'Unknown Course'
  }

  const getCourseWeeks = (courseId: string | null) => {
    if (!courseId) return 5
    return courses.find(c => c.id === courseId)?.duration_weeks || 5
  }

  // ── Cohort CRUD ──
  const handleSave = async () => {
    const supabase = getSupabase()
    if (!supabase || !form.name || !form.start_date) return
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const cohortData: any = {
      name: form.name, slug, description: form.description || null,
      status: form.status, start_date: form.start_date,
      end_date: form.end_date || null, max_participants: form.max_participants,
      current_week: form.current_week, course_id: form.course_id || null
    }
    if (editingId) {
      const { error } = await (supabase.from('cohorts') as any).update(cohortData).eq('id', editingId)
      if (error) { alert('Failed: ' + error.message); return }
    } else {
      const { data: newCohort, error } = await (supabase.from('cohorts') as any).insert(cohortData).select().single()
      if (error) { alert('Failed: ' + error.message); return }
      // Auto-create a messaging channel for the new cohort
      if (newCohort) {
        try {
          const { data: session } = await supabase.auth.getSession()
          const currentUserId = session?.session?.user?.id
          const { data: ch } = await supabase.from('channels').insert({
            name: form.name,
            description: `Cohort channel for ${form.name}`,
            type: 'cohort',
            cohort_id: newCohort.id,
            created_by: currentUserId || null
          }).select().single()
          // Add admin/creator as moderator
          if (ch && currentUserId) {
            await supabase.from('channel_members').insert({
              channel_id: ch.id, user_id: currentUserId, role: 'moderator'
            })
          }
        } catch (e) { console.error('Failed to create cohort channel:', e) }
      }
    }
    resetForm(); fetchCohorts()
  }

  const handleEdit = (c: Cohort) => {
    setForm({
      name: c.name, description: c.description || '', status: c.status,
      start_date: c.start_date?.split('T')[0] || '', end_date: c.end_date?.split('T')[0] || '',
      max_participants: c.max_participants, current_week: c.current_week, course_id: c.course_id || ''
    })
    setEditingId(c.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cohort and remove all member assignments?')) return
    const supabase = getSupabase()
    if (!supabase) return
    // Delete the cohort's messaging channel first
    try {
      const { data: cohortChannel } = await supabase.from('channels')
        .select('id').eq('cohort_id', id).eq('type', 'cohort').single()
      if (cohortChannel) {
        await supabase.from('channel_members').delete().eq('channel_id', cohortChannel.id)
        await supabase.from('channels').delete().eq('id', cohortChannel.id)
      }
    } catch (e) { console.error('Failed to delete cohort channel:', e) }
    await supabase.from('cohort_members').delete().eq('cohort_id', id)
    await supabase.from('cohorts').delete().eq('id', id)
    fetchCohorts()
  }

  const resetForm = () => {
    setForm({ name: '', description: '', status: 'upcoming', start_date: '', end_date: '', max_participants: 12, current_week: 0, course_id: '' })
    setEditingId(null); setShowForm(false)
  }

  // ── Member Management ──
  const addMember = async (cohortId: string, userId: string, role: 'participant' | 'facilitator') => {
    const supabase = getSupabase()
    if (!supabase) return
    setAddingMember(userId)
    const { error } = await supabase.from('cohort_members').insert({ cohort_id: cohortId, user_id: userId, role })
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        alert('This user is already a member of this cohort')
      } else { alert('Failed: ' + error.message) }
    } else {
      // Auto-add to cohort messaging channel
      try {
        const { data: cohortChannel } = await supabase.from('channels')
          .select('id').eq('cohort_id', cohortId).eq('type', 'cohort').single()
        if (cohortChannel) {
          await supabase.from('channel_members').insert({
            channel_id: cohortChannel.id,
            user_id: userId,
            role: role === 'facilitator' ? 'moderator' : 'member'
          }).single()
        }
      } catch (e) { console.error('Failed to add to cohort channel:', e) }

      if (role === 'participant') {
        // Send course welcome email for participants
        const cohort = cohorts.find(c => c.id === cohortId)
        const user = allUsers.find(u => u.id === userId)
        if (cohort?.course_id && user?.email) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'course_welcome',
                user_id: userId,
                email: user.email,
                name: user.full_name || '',
                course_id: cohort.course_id,
                cohort_id: cohortId,
              }),
            })
          } catch (e) {
            console.error('Failed to send welcome email:', e)
          }
        }
      }
    }
    setAddingMember(null)
    fetchMembers(cohortId)
  }

  const removeMember = async (memberId: string, cohortId: string) => {
    if (!confirm('Remove this member from the cohort?')) return
    const supabase = getSupabase()
    if (!supabase) return
    // Get user_id before deleting
    const { data: member } = await supabase.from('cohort_members').select('user_id').eq('id', memberId).single()
    await supabase.from('cohort_members').delete().eq('id', memberId)
    // Also remove from cohort messaging channel
    if (member?.user_id) {
      try {
        const { data: cohortChannel } = await supabase.from('channels')
          .select('id').eq('cohort_id', cohortId).eq('type', 'cohort').single()
        if (cohortChannel) {
          await supabase.from('channel_members').delete()
            .eq('channel_id', cohortChannel.id).eq('user_id', member.user_id)
        }
      } catch (e) { console.error('Failed to remove from cohort channel:', e) }
    }
    fetchMembers(cohortId)
  }

  const changeMemberRole = async (memberId: string, cohortId: string, newRole: 'participant' | 'facilitator') => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('cohort_members').update({ role: newRole }).eq('id', memberId)
    fetchMembers(cohortId)
  }

  const getAvailableUsers = (cohortId: string) => {
    const currentMemberIds = (members[cohortId] || []).map(m => m.user_id)
    return allUsers.filter(u => {
      if (currentMemberIds.includes(u.id)) return false
      if (!memberSearch) return true
      const q = memberSearch.toLowerCase()
      return (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q))
    })
  }

  const getCohortStats = (cohortId: string) => {
    const m = members[cohortId] || []
    return {
      facilitators: m.filter(x => x.role === 'facilitator'),
      participants: m.filter(x => x.role === 'participant'),
      total: m.length
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) return <div className="p-8 text-center text-text-muted">Loading cohorts...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Cohort Management</h1>
          <p className="text-text-muted mt-1">{cohorts.length} cohort{cohorts.length !== 1 ? 's' : ''} • Assign courses, facilitators, and participants</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn btn-teal flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Cohort
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">{editingId ? 'Edit Cohort' : 'Create New Cohort'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Cohort Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="e.g. Spring 2026 - Group Alpha" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg" rows={2} placeholder="Optional description..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assigned Course</label>
              <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="">— No course assigned —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Cohort['status'] })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="upcoming">Upcoming</option><option value="active">Active</option>
                <option value="completed">Completed</option><option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Participants</label>
              <input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: parseInt(e.target.value) || 12 })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg" min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Week</label>
              <input type="number" value={form.current_week} onChange={e => setForm({ ...form, current_week: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg" min={0} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={!form.name || !form.start_date}
              className="px-6 py-2 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
              {editingId ? 'Update Cohort' : 'Create Cohort'}</button>
          </div>
        </div>
      )}

      {/* Cohorts List */}
      {cohorts.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No cohorts yet</h3>
          <p className="text-text-muted mb-4">Create your first cohort to start enrolling participants</p>
          <button onClick={() => setShowForm(true)} className="btn btn-teal"><Plus className="w-4 h-4 mr-2" /> Create First Cohort</button>
        </div>
      ) : (
        <div className="space-y-4">
          {cohorts.map(cohort => {
            const stats = getCohortStats(cohort.id)
            const courseName = getCourseName(cohort.course_id)
            const totalWeeks = getCourseWeeks(cohort.course_id)
            const isExpanded = expandedCohort === cohort.id

            return (
              <div key={cohort.id} className="card overflow-hidden">
                {/* Cohort Header */}
                <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleCohort(cohort.id)}>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-text-muted" /> : <ChevronRight className="w-5 h-5 text-text-muted" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{cohort.name}</h3>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          cohort.status === 'active' ? 'bg-green-100 text-green-700' :
                          cohort.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                          cohort.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-700'
                        }`}>{cohort.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                        {courseName && (
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {courseName}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(cohort.start_date).toLocaleDateString()}</span>
                        {members[cohort.id] && (
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {stats.participants.length}/{cohort.max_participants}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {cohort.status === 'active' && (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs text-text-muted">Wk {cohort.current_week}/{totalWeeks}</span>
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-np-teal rounded-full" style={{ width: `${(cohort.current_week / totalWeeks) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    <button onClick={() => handleEdit(cohort)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit"><Edit2 className="w-4 h-4 text-text-muted" /></button>
                    <button onClick={() => handleDelete(cohort.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>

                {/* Expanded: Members */}
                {isExpanded && (
                  <div className="border-t border-border-light">
                    {/* Facilitators */}
                    <div className="px-5 py-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-np-teal" /> Facilitators ({stats.facilitators.length})
                        </h4>
                        <button onClick={() => { setShowAddMember(cohort.id); setAddMemberRole('facilitator'); setMemberSearch('') }}
                          className="text-xs text-np-teal hover:underline flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" /> Assign Facilitator
                        </button>
                      </div>
                      {stats.facilitators.length === 0 ? (
                        <p className="text-sm text-text-muted italic">No facilitators assigned yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {stats.facilitators.map(m => (
                            <div key={m.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 group">
                              <div className="w-8 h-8 rounded-full bg-np-teal text-white flex items-center justify-center text-xs font-medium">
                                {getInitials(m.user?.full_name || null)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{m.user?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-text-muted">{m.user?.email}</p>
                              </div>
                              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => changeMemberRole(m.id, cohort.id, 'participant')}
                                  className="p-1 hover:bg-gray-100 rounded" title="Demote to Participant">
                                  <User className="w-3.5 h-3.5 text-text-muted" />
                                </button>
                                <button onClick={() => removeMember(m.id, cohort.id)}
                                  className="p-1 hover:bg-red-50 rounded" title="Remove">
                                  <UserMinus className="w-3.5 h-3.5 text-red-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Participants */}
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" /> Participants ({stats.participants.length}/{cohort.max_participants})
                        </h4>
                        <button onClick={() => { setShowAddMember(cohort.id); setAddMemberRole('participant'); setMemberSearch('') }}
                          disabled={stats.participants.length >= cohort.max_participants}
                          className="text-xs text-np-teal hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                          <UserPlus className="w-3.5 h-3.5" /> Enroll Participant
                        </button>
                      </div>
                      {stats.participants.length >= cohort.max_participants && (
                        <div className="mb-3 px-3 py-2 bg-amber-50 text-amber-700 text-xs rounded-lg">
                          Cohort is at max capacity ({cohort.max_participants} participants)
                        </div>
                      )}
                      {stats.participants.length === 0 ? (
                        <p className="text-sm text-text-muted italic">No participants enrolled yet</p>
                      ) : (
                        <div className="space-y-1">
                          {stats.participants.map(m => (
                            <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                                  {getInitials(m.user?.full_name || null)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{m.user?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-text-muted">{m.user?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-text-muted">Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => changeMemberRole(m.id, cohort.id, 'facilitator')}
                                    className="p-1 hover:bg-gray-100 rounded" title="Promote to Facilitator">
                                    <Shield className="w-3.5 h-3.5 text-np-teal" />
                                  </button>
                                  <button onClick={() => removeMember(m.id, cohort.id)}
                                    className="p-1 hover:bg-red-50 rounded" title="Remove">
                                    <UserMinus className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Member Panel */}
                    {showAddMember === cohort.id && (
                      <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700">
                            {addMemberRole === 'facilitator' ? 'Assign Facilitator' : 'Enroll Participant'}
                          </h4>
                          <button onClick={() => setShowAddMember(null)} className="p-1 hover:bg-blue-100 rounded-lg">
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white" placeholder="Search by name or email..." autoFocus />
                          </div>
                          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <button onClick={() => setAddMemberRole('participant')}
                              className={`px-3 py-2 text-xs font-medium ${addMemberRole === 'participant' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                              Participant
                            </button>
                            <button onClick={() => setAddMemberRole('facilitator')}
                              className={`px-3 py-2 text-xs font-medium ${addMemberRole === 'facilitator' ? 'bg-np-teal text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                              Facilitator
                            </button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-auto space-y-1 bg-white rounded-lg border border-gray-200 p-2">
                          {getAvailableUsers(cohort.id).length === 0 ? (
                            <p className="text-sm text-text-muted text-center py-4">
                              {memberSearch ? 'No matching users found' : 'All users are already members of this cohort'}
                            </p>
                          ) : (
                            getAvailableUsers(cohort.id).slice(0, 20).map(user => (
                              <div key={user.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium">
                                    {getInitials(user.full_name)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{user.full_name || 'No Name'}</p>
                                    <p className="text-xs text-text-muted">{user.email} • <span className="capitalize">{user.role}</span></p>
                                  </div>
                                </div>
                                <button onClick={() => addMember(cohort.id, user.id, addMemberRole)}
                                  disabled={addingMember === user.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
                                  {addingMember === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                  Add
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
                      <div className="flex items-center gap-4">
                        {cohort.description && <span>{cohort.description}</span>}
                        <span>Created {new Date(cohort.created_at).toLocaleDateString()}</span>
                        {cohort.end_date && <span>Ends {new Date(cohort.end_date).toLocaleDateString()}</span>}
                      </div>
                      <span className="font-mono text-gray-400">{cohort.id.slice(0, 8)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
