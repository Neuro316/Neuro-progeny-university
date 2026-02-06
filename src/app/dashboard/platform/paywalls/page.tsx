// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Plus, CreditCard, Edit2, Trash2, X, ExternalLink, Copy, Check, DollarSign,
  BookOpen, Users, Mail, Calendar, Shield, ToggleLeft, ToggleRight, Link, Clock
} from 'lucide-react'
import EmailTemplateEditor from '@/components/EmailTemplateEditor'

interface Course { id: string; title: string; duration_weeks: number }
interface Cohort { id: string; name: string; start_date: string; course_id: string | null }

interface Paywall {
  id: string
  name: string
  slug: string
  description: string | null
  course_id: string | null
  cohort_id: string | null
  course_price: number
  equipment_deposit: number
  equipment_auto_charge: boolean
  equipment_charge_days_before: number
  confirmation_email_subject: string | null
  confirmation_email_body: string | null
  welcome_email_subject: string | null
  welcome_email_body: string | null
  is_active: boolean
  created_at: string
  course?: { title: string } | null
  cohort?: { name: string; start_date: string } | null
}

export default function PaywallsPage() {
  const [paywalls, setPaywalls] = useState<Paywall[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    course_id: '',
    cohort_id: '',
    course_price: 0,
    equipment_deposit: 0,
    equipment_auto_charge: true,
    equipment_charge_days_before: 14,
    confirmation_email_subject: '',
    confirmation_email_body: '',
    welcome_email_subject: '',
    welcome_email_body: '',
    is_active: true,
  })

  useEffect(() => { fetchPaywalls(); fetchCourses(); fetchCohorts() }, [])

  const fetchPaywalls = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('paywalls')
      .select('*, course:courses(title), cohort:cohorts(name, start_date)')
      .order('created_at', { ascending: false })
    setPaywalls(data || [])
    setLoading(false)
  }

  const fetchCourses = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('courses').select('id, title, duration_weeks').order('title')
    setCourses(data || [])
  }

  const fetchCohorts = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('cohorts').select('id, name, start_date, course_id').order('start_date', { ascending: false })
    setCohorts(data || [])
  }

  const handleSave = async () => {
    const supabase = getSupabase()
    if (!supabase || !form.name) return
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const data = {
      name: form.name, slug, description: form.description || null,
      course_id: form.course_id || null, cohort_id: form.cohort_id || null,
      course_price: form.course_price, equipment_deposit: form.equipment_deposit,
      equipment_auto_charge: form.equipment_auto_charge,
      equipment_charge_days_before: form.equipment_charge_days_before,
      confirmation_email_subject: form.confirmation_email_subject || null,
      confirmation_email_body: form.confirmation_email_body || null,
      welcome_email_subject: form.welcome_email_subject || null,
      welcome_email_body: form.welcome_email_body || null,
      is_active: form.is_active,
    }
    if (editingId) {
      const { error } = await supabase.from('paywalls').update(data).eq('id', editingId)
      if (error) { alert('Failed: ' + error.message); return }
    } else {
      const { error } = await supabase.from('paywalls').insert(data)
      if (error) { alert('Failed: ' + error.message); return }
    }
    resetForm(); fetchPaywalls()
  }

  const handleEdit = (p: Paywall) => {
    setForm({
      name: p.name, description: p.description || '', course_id: p.course_id || '',
      cohort_id: p.cohort_id || '', course_price: p.course_price, equipment_deposit: p.equipment_deposit,
      equipment_auto_charge: p.equipment_auto_charge,
      equipment_charge_days_before: p.equipment_charge_days_before,
      confirmation_email_subject: p.confirmation_email_subject || '',
      confirmation_email_body: p.confirmation_email_body || '',
      welcome_email_subject: p.welcome_email_subject || '',
      welcome_email_body: p.welcome_email_body || '',
      is_active: p.is_active,
    })
    setEditingId(p.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this paywall?')) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('paywalls').delete().eq('id', id); fetchPaywalls()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('paywalls').update({ is_active: !current }).eq('id', id)
    fetchPaywalls()
  }

  const resetForm = () => {
    setForm({
      name: '', description: '', course_id: '', cohort_id: '', course_price: 0,
      equipment_deposit: 0, equipment_auto_charge: true, equipment_charge_days_before: 14,
      confirmation_email_subject: '',
      confirmation_email_body: '',
      welcome_email_subject: '',
      welcome_email_body: '',
      is_active: true,
    })
    setEditingId(null); setShowForm(false)
  }

  const getCheckoutUrl = (slug: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://neuroprogenyuniversity.netlify.app'
    return `${base}/checkout/${slug}`
  }

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getCheckoutUrl(slug))
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const filteredCohorts = form.course_id
    ? cohorts.filter(c => c.course_id === form.course_id || !c.course_id)
    : cohorts

  if (loading) return <div className="p-8 text-center text-text-muted">Loading paywalls...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Paywall Builder</h1>
          <p className="text-text-muted mt-1">Create checkout pages with Stripe payments, equipment deposits, and automated enrollment</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn btn-teal flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Paywall
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold">{editingId ? 'Edit Paywall' : 'Create New Paywall'}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          {/* Basic Info */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-np-teal" /> Basic Info</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Paywall Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="e.g. Immersive Mastermind Spring 2026" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description (shown on checkout page)</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg" rows={2} placeholder="What the participant is enrolling in..." />
                </div>
              </div>
            </div>

            {/* Course & Cohort */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-np-teal" /> Enrollment</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Enroll Into Course</label>
                  <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                    <option value="">— Select Course —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Auto-Assign to Cohort</label>
                  <select value={form.cohort_id} onChange={e => setForm({ ...form, cohort_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                    <option value="">— No auto-assign —</option>
                    {filteredCohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-np-teal" /> Pricing</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" value={form.course_price} onChange={e => setForm({ ...form, course_price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg" min={0} step={0.01} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Equipment Deposit (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" value={form.equipment_deposit} onChange={e => setForm({ ...form, equipment_deposit: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg" min={0} step={0.01} />
                  </div>
                </div>
              </div>

              {form.equipment_deposit > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800">Auto-charge equipment deposit before course starts</p>
                      <p className="text-xs text-amber-600 mt-0.5">Saves card on file and charges automatically before the start date</p>
                    </div>
                    <button onClick={() => setForm({ ...form, equipment_auto_charge: !form.equipment_auto_charge })}
                      className="text-amber-700">
                      {form.equipment_auto_charge
                        ? <ToggleRight className="w-8 h-8" />
                        : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                  {form.equipment_auto_charge && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-amber-800">Charge</label>
                      <input type="number" value={form.equipment_charge_days_before}
                        onChange={e => setForm({ ...form, equipment_charge_days_before: parseInt(e.target.value) || 14 })}
                        className="w-20 px-3 py-1.5 text-sm border border-amber-200 rounded-lg bg-white" min={1} />
                      <label className="text-sm text-amber-800">days before course start</label>
                    </div>
                  )}
                  {!form.equipment_auto_charge && (
                    <p className="text-xs text-amber-600">Equipment deposit will be collected at checkout along with course price.</p>
                  )}
                </div>
              )}
            </div>

            {/* Email Templates */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Mail className="w-4 h-4 text-np-teal" /> Email Templates</h3>
              <div className="space-y-3">
                <EmailTemplateEditor
                  label="Payment Confirmation Email"
                  description="Sent immediately after successful payment"
                  subject={form.confirmation_email_subject}
                  body={form.confirmation_email_body}
                  onSubjectChange={val => setForm({ ...form, confirmation_email_subject: val })}
                  onBodyChange={val => setForm({ ...form, confirmation_email_body: val })}
                  defaultSubject="Welcome to {{course_name}}!"
                  defaultBody={"Hi {{name}},\n\nThank you for enrolling in {{course_name}}! We're excited to have you.\n\nYou'll receive access details and next steps shortly.\n\nWarm regards,\nNeuro Progeny Team"}
                  accentColor="#3d8b8b"
                />
                <EmailTemplateEditor
                  label="Welcome & Onboarding Email"
                  description="Sent when participant is enrolled into the course"
                  subject={form.welcome_email_subject}
                  body={form.welcome_email_body}
                  onSubjectChange={val => setForm({ ...form, welcome_email_subject: val })}
                  onBodyChange={val => setForm({ ...form, welcome_email_body: val })}
                  defaultSubject="You're all set for {{course_name}}!"
                  defaultBody={"Hi {{name}},\n\nGreat news — you're officially enrolled in {{course_name}}!\n\nHere are your next steps:\n\n1. Sign in at {{login_url}}\n2. Review your course curriculum\n3. Check your cohort details and start date: {{start_date}}\n\nIf you have questions, reply to this email.\n\nSee you soon,\nNeuro Progeny Team"}
                  accentColor="#1e3a5f"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium">Paywall Status</p>
                <p className="text-xs text-text-muted">Only active paywalls accept payments</p>
              </div>
              <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={form.is_active ? 'text-green-600' : 'text-gray-400'}>
                {form.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            {/* Total Preview */}
            <div className="p-4 bg-np-teal/5 rounded-xl border border-np-teal/20">
              <p className="text-sm font-semibold text-np-teal mb-2">Checkout Summary Preview</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Course Enrollment</span><span className="font-medium">${form.course_price.toFixed(2)}</span></div>
                {form.equipment_deposit > 0 && !form.equipment_auto_charge && (
                  <div className="flex justify-between"><span>Equipment Deposit</span><span className="font-medium">${form.equipment_deposit.toFixed(2)}</span></div>
                )}
                <div className="border-t border-np-teal/20 pt-1 flex justify-between font-semibold">
                  <span>Total at Checkout</span>
                  <span>${(form.course_price + (form.equipment_deposit > 0 && !form.equipment_auto_charge ? form.equipment_deposit : 0)).toFixed(2)}</span>
                </div>
                {form.equipment_deposit > 0 && form.equipment_auto_charge && (
                  <div className="flex justify-between text-amber-600 text-xs mt-1">
                    <span>Equipment deposit (auto-charged {form.equipment_charge_days_before} days before start)</span>
                    <span>${form.equipment_deposit.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={!form.name || form.course_price <= 0}
              className="px-6 py-2 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
              {editingId ? 'Update Paywall' : 'Create Paywall'}</button>
          </div>
        </div>
      )}

      {/* Paywalls List */}
      {paywalls.length === 0 && !showForm ? (
        <div className="card p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No paywalls yet</h3>
          <p className="text-text-muted mb-4">Create your first paywall to start accepting payments</p>
          <button onClick={() => setShowForm(true)} className="btn btn-teal"><Plus className="w-4 h-4 mr-2" /> Create First Paywall</button>
        </div>
      ) : (
        <div className="space-y-4">
          {paywalls.map(pw => (
            <div key={pw.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pw.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{pw.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pw.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {pw.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                      {pw.course && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {pw.course.title}</span>}
                      {pw.cohort && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {pw.cohort.name}</span>}
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> ${pw.course_price.toFixed(2)}</span>
                      {pw.equipment_deposit > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-3.5 h-3.5" /> +${pw.equipment_deposit.toFixed(2)} deposit
                          {pw.equipment_auto_charge && ` (auto ${pw.equipment_charge_days_before}d before)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Checkout URL */}
                  <button onClick={() => copyUrl(pw.slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    {copied === pw.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === pw.slug ? 'Copied!' : 'Copy URL'}
                  </button>
                  <a href={getCheckoutUrl(pw.slug)} target="_blank" rel="noopener"
                    className="p-2 hover:bg-gray-100 rounded-lg" title="Open Checkout Page">
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                  <button onClick={() => toggleActive(pw.id, pw.is_active)}
                    className={`p-2 hover:bg-gray-100 rounded-lg ${pw.is_active ? 'text-green-600' : 'text-gray-400'}`} title="Toggle Active">
                    {pw.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleEdit(pw)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                    <Edit2 className="w-4 h-4 text-text-muted" />
                  </button>
                  <button onClick={() => handleDelete(pw.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
