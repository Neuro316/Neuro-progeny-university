import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, applyMergeTags, type MergeData } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const { type, user_id, email, name, course_id, cohort_id } = await request.json()

    if (!type || !email) {
      return NextResponse.json({ error: 'Missing type or email' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    let subject = ''
    let body = ''
    const mergeData: MergeData = {
      name: name || 'there',
      email,
      login_url: 'https://neuroprogenyuniversity.netlify.app/login',
    }

    if (type === 'course_welcome' && course_id) {
      // Get course with welcome email template
      const { data: course } = await supabase
        .from('courses')
        .select('title, welcome_email_subject, welcome_email_body')
        .eq('id', course_id)
        .single()

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      mergeData.course_name = course.title

      // Get cohort info if provided
      if (cohort_id) {
        const { data: cohort } = await supabase
          .from('cohorts')
          .select('name, start_date')
          .eq('id', cohort_id)
          .single()

        if (cohort) {
          mergeData.cohort_name = cohort.name
          mergeData.start_date = cohort.start_date
            ? new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'TBD'
        }
      }

      subject = course.welcome_email_subject
        ? applyMergeTags(course.welcome_email_subject, mergeData)
        : `Welcome to ${course.title}!`

      body = course.welcome_email_body
        ? applyMergeTags(course.welcome_email_body, mergeData)
        : `Hi ${name || 'there'},\n\nWelcome to ${course.title}! You now have full access to the course.\n\nSign in at {{login_url}} to get started.\n\nWarm regards,\nNeuro Progeny Team`

      // Apply merge tags to fallback body too
      body = applyMergeTags(body, mergeData)
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    // Send the email
    const sent = await sendEmail({ to: email, subject, body })

    // Log it
    try {
      await supabase.from('email_log').insert({
        recipient_email: email,
        recipient_name: name || null,
        email_type: type,
        subject,
        body,
        source_type: type === 'course_welcome' ? 'course' : 'paywall',
        source_id: course_id || null,
      })
    } catch {} // Don't fail if log table doesn't exist yet

    return NextResponse.json({ success: sent, message: sent ? `Email sent to ${email}` : 'Failed to send' })
  } catch (err: any) {
    console.error('Send email error:', err)
    return NextResponse.json({ error: err.message, success: false }, { status: 500 })
  }
}
