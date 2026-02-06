const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || ''
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || ''
const GMAIL_SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL || 'Cameron.allen@neuroprogeny.com'

interface EmailOptions {
  to: string
  subject: string
  body: string
  replyTo?: string
}

export interface MergeData {
  name?: string
  email?: string
  course_name?: string
  cohort_name?: string
  start_date?: string
  facilitator_name?: string
  login_url?: string
  lesson_title?: string
}

async function getAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  if (!data.access_token) {
    console.error('Failed to get Gmail access token:', data)
    throw new Error('Failed to get Gmail access token')
  }

  return data.access_token
}

function buildMimeMessage({ to, subject, body, replyTo }: EmailOptions): string {
  const headers = [
    `From: Neuro Progeny <${GMAIL_SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
  ]

  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`)
  }

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${body.replace(/\n/g, '<br>')}
</body>
</html>`

  const fullMessage = headers.join('\r\n') + '\r\n\r\n' + htmlBody

  const encoded = Buffer.from(fullMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return encoded
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
      console.error('Gmail credentials not configured')
      return false
    }

    const accessToken = await getAccessToken()
    const rawMessage = buildMimeMessage(options)

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Gmail send error:', error)
      return false
    }

    console.log('Email sent to:', options.to)
    return true
  } catch (err) {
    console.error('Email send failed:', err)
    return false
  }
}

export function applyMergeTags(template: string, data: MergeData): string {
  return template
    .replace(/{{name}}/g, data.name || 'there')
    .replace(/{{email}}/g, data.email || '')
    .replace(/{{course_name}}/g, data.course_name || 'the program')
    .replace(/{{cohort_name}}/g, data.cohort_name || 'your cohort')
    .replace(/{{start_date}}/g, data.start_date || 'TBD')
    .replace(/{{facilitator_name}}/g, data.facilitator_name || 'your facilitator')
    .replace(/{{login_url}}/g, data.login_url || 'https://neuroprogenyuniversity.netlify.app/login')
    .replace(/{{lesson_title}}/g, data.lesson_title || 'your next lesson')
}

export const MERGE_TAGS = [
  { tag: '{{name}}', label: 'Name', description: "Participant's name" },
  { tag: '{{email}}', label: 'Email', description: "Participant's email" },
  { tag: '{{course_name}}', label: 'Course', description: 'Course title' },
  { tag: '{{cohort_name}}', label: 'Cohort', description: 'Cohort name' },
  { tag: '{{start_date}}', label: 'Start Date', description: 'Cohort start date' },
  { tag: '{{facilitator_name}}', label: 'Facilitator', description: 'Lead facilitator name' },
  { tag: '{{login_url}}', label: 'Login URL', description: 'Link to sign in' },
]
