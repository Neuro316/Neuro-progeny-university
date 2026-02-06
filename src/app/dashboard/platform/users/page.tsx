// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Search, ChevronDown, UserPlus, Mail } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'participant' | 'facilitator' | 'admin' | 'superadmin'
  avatar_url: string | null
  created_at: string
  organization_id: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('participant')
  const [inviteStatus, setInviteStatus] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const supabase = getSupabase()
    if (!supabase) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const updateRole = async (userId: string, newRole: string) => {
    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u))
      setEditingRole(null)
    }
  }

  const handleInvite = async () => {
    const supabase = getSupabase()
    if (!supabase || !inviteEmail) return

    setInviteStatus('sending')

    // Use Supabase admin invite (requires service role, so we'll use signUp as placeholder)
    const { error } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: {
        data: { role: inviteRole },
      },
    })

    if (error) {
      setInviteStatus('error')
      console.error('Invite error:', error)
    } else {
      setInviteStatus('sent')
      setInviteEmail('')
      setTimeout(() => {
        setInviteOpen(false)
        setInviteStatus('')
      }, 2000)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = search === '' || 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleCounts = {
    all: users.length,
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    facilitator: users.filter(u => u.role === 'facilitator').length,
    participant: users.filter(u => u.role === 'participant').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">Users</h1>
          <p className="text-text-secondary mt-1">{users.length} total users</p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn btn-teal">
          <UserPlus className="w-4 h-4 mr-2" /> Invite User
        </button>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setInviteOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-semibold mb-4">Invite User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                >
                  <option value="participant">Participant</option>
                  <option value="facilitator">Facilitator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setInviteOpen(false)} className="btn flex-1">Cancel</button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviteStatus === 'sending'}
                  className="btn btn-teal flex-1"
                >
                  {inviteStatus === 'sending' ? 'Sending...' :
                   inviteStatus === 'sent' ? 'Invite Sent!' :
                   inviteStatus === 'error' ? 'Error' :
                   'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'superadmin', 'admin', 'facilitator', 'participant'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                roleFilter === role
                  ? 'bg-np-blue text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
              <span className="ml-1.5 opacity-70">({roleCounts[role]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-text-muted">User</th>
                <th className="text-left p-4 text-sm font-medium text-text-muted">Role</th>
                <th className="text-left p-4 text-sm font-medium text-text-muted">Joined</th>
                <th className="text-left p-4 text-sm font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-np-blue to-np-teal flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.full_name || 'No name'}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {editingRole === u.id ? (
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        onBlur={() => setEditingRole(null)}
                        autoFocus
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-np-teal"
                      >
                        <option value="participant">Participant</option>
                        <option value="facilitator">Facilitator</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingRole(u.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                          u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'facilitator' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.role} <ChevronDown className="w-3 h-3 inline ml-0.5" />
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-sm text-text-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Send email">
                      <Mail className="w-4 h-4 text-text-muted" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-text-muted">No users found</div>
        )}
      </div>
    </div>
  )
}
