// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, BookOpen, Monitor, Activity, ArrowRight, Plus } from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  totalCohorts: number
  activeCohorts: number
  totalEquipment: number
}

interface RecentUser {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface Cohort {
  id: string
  name: string
  status: string
  start_date: string
  current_week: number
  member_count?: number
}

export default function PlatformOverviewPage() {
  const [stats, setStats] = useState<PlatformStats>({ totalUsers: 0, totalCohorts: 0, activeCohorts: 0, totalEquipment: 0 })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabase()
      if (!supabase) return

      try {
        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Fetch cohorts
        const { data: cohortData } = await supabase
          .from('cohorts')
          .select('*')
          .order('created_at', { ascending: false })

        // Fetch equipment count
        const { count: equipCount } = await supabase
          .from('equipment')
          .select('*', { count: 'exact', head: true })

        // Fetch recent users
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        const activeCohorts = cohortData?.filter(c => c.status === 'active') || []

        setStats({
          totalUsers: userCount || 0,
          totalCohorts: cohortData?.length || 0,
          activeCohorts: activeCohorts.length,
          totalEquipment: equipCount || 0,
        })
        setCohorts(cohortData || [])
        setRecentUsers(userData || [])
      } catch (err) {
        console.error('Error fetching platform data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">Platform Overview</h1>
          <p className="text-text-secondary mt-1">Manage your Immersive Mastermind platform</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Link href="/dashboard/platform/users" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.totalUsers}</p>
          <p className="text-sm text-text-muted">Total Users</p>
        </Link>

        <Link href="/dashboard/platform/cohorts" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-teal-600 transition-colors" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.activeCohorts}</p>
          <p className="text-sm text-text-muted">Active Cohorts</p>
        </Link>

        <Link href="/dashboard/platform/courses" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-amber-600 transition-colors" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.totalCohorts}</p>
          <p className="text-sm text-text-muted">Total Cohorts</p>
        </Link>

        <Link href="/dashboard/platform/equipment" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-purple-600 transition-colors" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.totalEquipment}</p>
          <p className="text-sm text-text-muted">Equipment Items</p>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Cohorts */}
        <div className="card">
          <div className="p-4 border-b border-border-light flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Cohorts</h2>
            <Link href="/dashboard/platform/cohorts" className="text-sm text-np-teal hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {cohorts.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted mb-3">No cohorts yet</p>
              <Link href="/dashboard/platform/cohorts" className="btn btn-teal btn-sm">
                <Plus className="w-4 h-4 mr-1" /> Create First Cohort
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {cohorts.slice(0, 5).map(cohort => (
                <div key={cohort.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{cohort.name}</p>
                    <p className="text-sm text-text-muted">
                      Week {cohort.current_week} • Started {new Date(cohort.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    cohort.status === 'active' ? 'bg-green-100 text-green-700' :
                    cohort.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {cohort.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="p-4 border-b border-border-light flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Users</h2>
            <Link href="/dashboard/platform/users" className="text-sm text-np-teal hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted">No users yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {recentUsers.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-np-blue to-np-teal flex items-center justify-center text-white text-xs font-semibold">
                      {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.full_name || u.email}</p>
                      <p className="text-xs text-text-muted">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'admin' ? 'bg-red-100 text-red-700' :
                    u.role === 'facilitator' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
