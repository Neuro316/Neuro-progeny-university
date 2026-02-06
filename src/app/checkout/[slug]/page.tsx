// @ts-nocheck
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { CreditCard, BookOpen, Shield, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface Paywall {
  id: string
  name: string
  slug: string
  description: string | null
  course_id: string | null
  course_price: number
  equipment_deposit: number
  equipment_auto_charge: boolean
  equipment_charge_days_before: number
  is_active: boolean
  course?: { title: string; description: string | null } | null
  cohort?: { name: string; start_date: string } | null
}

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const canceled = searchParams?.get('canceled')

  const [paywall, setPaywall] = useState<Paywall | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (slug) fetchPaywall()
  }, [slug])

  const fetchPaywall = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data, error } = await supabase
      .from('paywalls')
      .select('*, course:courses(title, description), cohort:cohorts(name, start_date)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error || !data) setError('This enrollment page is not available.')
    else setPaywall(data)
    setLoading(false)
  }

  const handleCheckout = async () => {
    if (!paywall || !email) return
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paywall_id: paywall.id, customer_email: email, customer_name: name }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setProcessing(false)
      }
    } catch (err: any) {
      setError('Connection error. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error && !paywall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Not Available</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!paywall) return null

  const checkoutTotal = paywall.course_price + (paywall.equipment_deposit > 0 && !paywall.equipment_auto_charge ? paywall.equipment_deposit : 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B9C8F] to-[#1a1a2e] px-8 py-6 text-white">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
            <Shield className="w-4 h-4" /> Secure Enrollment
          </div>
          <h1 className="text-2xl font-bold">{paywall.name}</h1>
          {paywall.description && <p className="text-white/80 mt-1 text-sm">{paywall.description}</p>}
        </div>

        <div className="p-8 space-y-6">
          {canceled && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" /> Payment was canceled. You can try again below.
            </div>
          )}

          {/* What's Included */}
          <div className="space-y-3">
            {paywall.course && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <BookOpen className="w-5 h-5 text-[#3B9C8F]" />
                <div>
                  <p className="text-sm font-medium">{paywall.course.title}</p>
                  {paywall.course.description && <p className="text-xs text-gray-500">{paywall.course.description}</p>}
                </div>
              </div>
            )}
            {paywall.cohort && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-[#3B9C8F]" />
                <div>
                  <p className="text-sm font-medium">{paywall.cohort.name}</p>
                  <p className="text-xs text-gray-500">Starts {new Date(paywall.cohort.start_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Course Enrollment</span>
              <span className="font-medium">${paywall.course_price.toFixed(2)}</span>
            </div>
            {paywall.equipment_deposit > 0 && !paywall.equipment_auto_charge && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Equipment Deposit</span>
                <span className="font-medium">${paywall.equipment_deposit.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Today</span>
              <span className="text-lg">${checkoutTotal.toFixed(2)}</span>
            </div>
            {paywall.equipment_deposit > 0 && paywall.equipment_auto_charge && (
              <div className="flex items-start gap-2 pt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Equipment deposit of ${paywall.equipment_deposit.toFixed(2)} will be automatically charged {paywall.equipment_charge_days_before} days before the course begins. Your card will be saved securely.</span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="you@example.com" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Pay Button */}
          <button onClick={handleCheckout} disabled={!email || processing}
            className="w-full py-3 bg-[#3B9C8F] text-white font-semibold rounded-xl hover:bg-[#2d7a7a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-lg">
            {processing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="w-5 h-5" /> Pay ${checkoutTotal.toFixed(2)}</>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Secured by Stripe. Your payment information is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
