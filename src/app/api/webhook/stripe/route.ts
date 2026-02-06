import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, applyMergeTags } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    let event
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
      } catch (err: any) {
        console.error('Webhook signature failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      event = JSON.parse(body)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const meta = session.metadata || {}
      const email = session.customer_details?.email || session.customer_email
      const name = session.customer_details?.name || ''

      console.log('Payment successful:', { email, meta })

      // 1. Record the payment
      await supabase.from('payments').insert({
        stripe_session_id: session.id,
        stripe_customer_id: session.customer || null,
        stripe_payment_intent: session.payment_intent || null,
        paywall_id: meta.paywall_id || null,
        course_id: meta.course_id || null,
        cohort_id: meta.cohort_id || null,
        customer_email: email,
        customer_name: name,
        amount_total: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        status: 'completed',
        metadata: meta,
      })

      // 2. Check if user exists, if not — create invite record
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser && meta.course_id) {
        if (meta.cohort_id) {
          const { error: memberError } = await supabase.from('cohort_members').insert({
            cohort_id: meta.cohort_id,
            user_id: existingUser.id,
            role: 'participant',
          })
          if (memberError && !memberError.message.includes('duplicate')) {
            console.error('Failed to add to cohort:', memberError)
          }
        }
      } else if (!existingUser && email) {
        await supabase.from('pending_enrollments').insert({
          email,
          name,
          paywall_id: meta.paywall_id || null,
          course_id: meta.course_id || null,
          cohort_id: meta.cohort_id || null,
          stripe_session_id: session.id,
          status: 'pending',
        })
      }

      // 3. Schedule equipment deposit if needed
      if (meta.equipment_auto_charge === 'true' && parseFloat(meta.equipment_deposit) > 0) {
        const { data: paywall } = await supabase
          .from('paywalls')
          .select('*, cohort:cohorts(start_date)')
          .eq('id', meta.paywall_id)
          .single()

        if (paywall?.cohort?.start_date) {
          const startDate = new Date(paywall.cohort.start_date)
          const daysBefore = parseInt(meta.equipment_charge_days_before) || 14
          const chargeDate = new Date(startDate.getTime() - daysBefore * 24 * 60 * 60 * 1000)

          await supabase.from('scheduled_charges').insert({
            stripe_customer_id: session.customer || null,
            stripe_payment_intent: session.payment_intent || null,
            customer_email: email,
            amount: parseFloat(meta.equipment_deposit),
            description: 'Equipment Deposit',
            charge_date: chargeDate.toISOString().split('T')[0],
            paywall_id: meta.paywall_id,
            status: 'scheduled',
          })
        }
      }

      // 4. Send confirmation email
      if (email && meta.paywall_id) {
        const { data: paywall } = await supabase
          .from('paywalls')
          .select('*, course:courses(title)')
          .eq('id', meta.paywall_id)
          .single()

        if (paywall) {
          const courseName = paywall.course?.title || paywall.name
          const mergeData = { name: name || undefined, email, course_name: courseName }

          const subject = paywall.confirmation_email_subject
            ? applyMergeTags(paywall.confirmation_email_subject, mergeData)
            : `Welcome to ${courseName}!`

          const emailBody = paywall.confirmation_email_body
            ? applyMergeTags(paywall.confirmation_email_body, mergeData)
            : `Hi ${name || 'there'},\n\nThank you for enrolling in ${courseName}! We're excited to have you.\n\nYou'll receive access details and next steps shortly.\n\nWarm regards,\nThe Neuro Progeny Team`

          const sent = await sendEmail({ to: email, subject, body: emailBody })

          // Log the email
          try {
            await supabase.from('email_log').insert({
              recipient_email: email,
              recipient_name: name || null,
              email_type: 'payment_confirmation',
              subject,
              body: emailBody,
              source_type: 'paywall',
              source_id: meta.paywall_id,
              status: sent ? 'sent' : 'failed',
            })
          } catch {}

          // Also send paywall welcome email if configured
          if (paywall.welcome_email_subject || paywall.welcome_email_body) {
            const welcomeSubject = paywall.welcome_email_subject
              ? applyMergeTags(paywall.welcome_email_subject, mergeData)
              : null
            const welcomeBody = paywall.welcome_email_body
              ? applyMergeTags(paywall.welcome_email_body, mergeData)
              : null

            if (welcomeSubject && welcomeBody) {
              const welcomeSent = await sendEmail({ to: email, subject: welcomeSubject, body: welcomeBody })
              try {
                await supabase.from('email_log').insert({
                  recipient_email: email,
                  recipient_name: name || null,
                  email_type: 'paywall_welcome',
                  subject: welcomeSubject,
                  body: welcomeBody,
                  source_type: 'paywall',
                  source_id: meta.paywall_id,
                  status: welcomeSent ? 'sent' : 'failed',
                })
              } catch {}
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
