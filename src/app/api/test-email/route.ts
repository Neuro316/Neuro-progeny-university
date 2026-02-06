import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, customBody } = await request.json()
    const recipient = to || 'Cameron.allen@neuroprogeny.com'

    const emailSubject = subject || 'Test Email from Neuro Progeny University'
    const emailBody = customBody || 'This is a test email. If you received this, Gmail API is working!'

    const success = await sendEmail({ to: recipient, subject: emailSubject, body: emailBody })

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email', success: false }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Email sent to ${recipient}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 })
  }
}
