// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Plus, Monitor, Search, Edit2, Trash2, X, Package } from 'lucide-react'

interface Equipment {
  id: string
  type: 'vr_headset' | 'hrv_monitor' | 'other'
  name: string
  serial_number: string | null
  status: 'available' | 'assigned' | 'maintenance' | 'retired'
  assigned_to: string | null
  assigned_to_name?: string
  notes: string | null
  created_at: string
}

interface UserOption {
  id: string
  full_name: string
  email: string
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'vr_headset' as Equipment['type'],
    name: '',
    serial_number: '',
    status: 'available' as Equipment['status'],
    assigned_to: '',
    notes: '',
  })

  useEffect(() => {
    fetchEquipment()
    fetchUsers()
  }, [])

  const fetchEquipment = async () => {
    const supabase = getSupabase()
    if (!supabase) return

    const { data, error } = await supabase
      .from('equipment')
      .select('*, profiles!equipment_assigned_to_fkey(full_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching equipment:', error)
      // Try without join
      const { data: basicData } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false })
      setEquipment(basicData || [])
    } else {
      const mapped = (data || []).map((e: any) => ({
        ...e,
        assigned_to_name: e.profiles?.full_name || null,
      }))
      setEquipment(mapped)
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    setUsers(data || [])
  }

  const handleSave = async () => {
    const supabase = getSupabase()
    if (!supabase || !form.name) return

    const eqData = {
      type: form.type,
      name: form.name,
      serial_number: form.serial_number || null,
      status: form.status,
      assigned_to: form.assigned_to || null,
      notes: form.notes || null,
    }

    if (editingId) {
      const { error } = await supabase.from('equipment').update(eqData).eq('id', editingId)
      if (error) { console.error(error); alert('Failed to update'); return }
    } else {
      const { error } = await supabase.from('equipment').insert(eqData)
      if (error) { console.error(error); alert('Failed to create: ' + error.message); return }
    }

    resetForm()
    fetchEquipment()
  }

  const handleEdit = (eq: Equipment) => {
    setForm({
      type: eq.type,
      name: eq.name,
      serial_number: eq.serial_number || '',
      status: eq.status,
      assigned_to: eq.assigned_to || '',
      notes: eq.notes || '',
    })
    setEditingId(eq.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment item?')) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('equipment').delete().eq('id', id)
    fetchEquipment()
  }

  const resetForm = () => {
    setForm({ type: 'vr_headset', name: '', serial_number: '', status: 'available', assigned_to: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const filtered = equipment.filter(e => {
    const matchesSearch = search === '' ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.serial_number?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || e.type === typeFilter
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const statusCounts = {
    available: equipment.filter(e => e.status === 'available').length,
    assigned: equipment.filter(e => e.status === 'assigned').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
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
          <h1 className="font-display text-3xl font-semibold text-text-primary">Equipment</h1>
          <p className="text-text-secondary mt-1">
            {statusCounts.available} available • {statusCounts.assigned} assigned • {statusCounts.maintenance} maintenance
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn btn-teal">
          <Plus className="w-4 h-4 mr-2" /> Add Equipment
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">
              {editingId ? 'Edit Equipment' : 'Add New Equipment'}
            </h2>
            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="vr_headset">VR Headset</option>
                <option value="hrv_monitor">HRV Monitor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                placeholder="e.g., Meta Quest 3 #001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={e => setForm({ ...form, serial_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent resize-none"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={resetForm} className="btn">Cancel</button>
            <button onClick={handleSave} disabled={!form.name} className="btn btn-teal">
              {editingId ? 'Update' : 'Add Equipment'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="vr_headset">VR Headsets</option>
          <option value="hrv_monitor">HRV Monitors</option>
          <option value="other">Other</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Equipment Table */}
      {equipment.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No equipment tracked yet</h3>
          <p className="text-text-muted mb-4">Add VR headsets and HRV monitors to track assignments</p>
          <button onClick={() => setShowForm(true)} className="btn btn-teal">
            <Plus className="w-4 h-4 mr-2" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light bg-gray-50">
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Equipment</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Assigned To</th>
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(eq => (
                  <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{eq.name}</p>
                        {eq.serial_number && <p className="text-xs text-text-muted">S/N: {eq.serial_number}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize">{eq.type.replace('_', ' ')}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        eq.status === 'available' ? 'bg-green-100 text-green-700' :
                        eq.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        eq.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {eq.assigned_to_name || (eq.assigned_to ? 'Unknown user' : '—')}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(eq)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4 text-text-muted" />
                        </button>
                        <button onClick={() => handleDelete(eq.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-text-muted">No equipment matches filters</div>
          )}
        </div>
      )}
    </div>
  )
}
