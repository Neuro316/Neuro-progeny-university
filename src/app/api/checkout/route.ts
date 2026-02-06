import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const body = await request.json()
    const { paywall_id, customer_email, customer_name } = body

    if (!paywall_id) return NextResponse.json({ error: 'Missing paywall_id' }, { status: 400 })

    // Fetch paywall config from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: paywall, error: pwError } = await supabase
      .from('paywalls')
      .select('*, course:courses(title)')
      .eq('id', paywall_id)
      .eq('is_active', true)
      .single()

    if (pwError || !paywall) return NextResponse.json({ error: 'Paywall not found or inactive' }, { status: 404 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neuroprogenyuniversity.netlify.app'

    // Build line items
    const line_items: any[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: paywall.course?.title || paywall.name,
            description: paywall.description || 'Course enrollment',
          },
          unit_amount: Math.round((paywall.course_price || 0) * 100),
        },
        quantity: 1,
      }
    ]

    // If equipment deposit is collected at checkout (not scheduled)
    if (paywall.equipment_deposit > 0 && !paywall.equipment_auto_charge) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Equipment Deposit',
            description: `Refundable deposit for VR headset and HRV monitor`,
          },
          unit_amount: Math.round(paywall.equipment_deposit * 100),
        },
        quantity: 1,
      })
    }

    // Create checkout session
    const sessionParams: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&paywall_id=${paywall_id}`,
      cancel_url: `${siteUrl}/checkout/${paywall.slug}?canceled=true`,
      metadata: {
        paywall_id: paywall.id,
        course_id: paywall.course_id || '',
        cohort_id: paywall.cohort_id || '',
        equipment_deposit: String(paywall.equipment_deposit || 0),
        equipment_auto_charge: String(paywall.equipment_auto_charge || false),
        equipment_charge_days_before: String(paywall.equipment_charge_days_before || 14),
      },
    }

    if (customer_email) {
      sessionParams.customer_email = customer_email
    }

    // If equipment deposit should be auto-charged later, set up for future payment
    if (paywall.equipment_deposit > 0 && paywall.equipment_auto_charge) {
      sessionParams.payment_intent_data = {
        setup_future_usage: 'off_session',
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
