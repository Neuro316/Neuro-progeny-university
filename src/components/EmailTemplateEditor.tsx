// @ts-nocheck
'use client'

import { useState, useRef } from 'react'
import { Mail, Tag, Eye, EyeOff, Send, ChevronDown, ChevronUp, Info } from 'lucide-react'

const MERGE_TAGS = [
  { tag: '{{name}}', label: 'Name', preview: 'Cameron' },
  { tag: '{{email}}', label: 'Email', preview: 'cameron@neuroprogeny.com' },
  { tag: '{{course_name}}', label: 'Course', preview: 'Immersive Mastermind' },
  { tag: '{{cohort_name}}', label: 'Cohort', preview: 'Spring 2026' },
  { tag: '{{start_date}}', label: 'Start Date', preview: 'March 15, 2026' },
  { tag: '{{facilitator_name}}', label: 'Facilitator', preview: 'Cameron Allen' },
  { tag: '{{lesson_title}}', label: 'Lesson', preview: 'Day 3: Building Your Window of Tolerance' },
  { tag: '{{login_url}}', label: 'Login URL', preview: 'https://neuroprogenyuniversity.netlify.app/login' },
]

interface EmailTemplateEditorProps {
  label: string
  description: string
  icon?: string
  subject: string
  body: string
  onSubjectChange: (val: string) => void
  onBodyChange: (val: string) => void
  defaultSubject?: string
  defaultBody?: string
  accentColor?: string
}

export default function EmailTemplateEditor({
  label,
  description,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  defaultSubject,
  defaultBody,
  accentColor = '#3d8b8b',
}: EmailTemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [expanded, setExpanded] = useState(!!subject || !!body)
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const insertTag = (tag: string) => {
    const textarea = bodyRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newVal = body.slice(0, start) + tag + body.slice(end)
    onBodyChange(newVal)
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + tag.length
    }, 0)
  }

  const previewText = (text: string) => {
    let result = text
    MERGE_TAGS.forEach(({ tag, preview }) => {
      result = result.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), preview)
    })
    return result
  }

  const sendTestEmail = async () => {
    setSendingTest(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'Cameron.allen@neuroprogeny.com',
          subject: previewText(subject || defaultSubject || 'Test Email'),
          customBody: previewText(body || defaultBody || 'This is a test email.'),
        }),
      })
      const data = await res.json()
      setTestResult({ success: data.success, message: data.success ? 'Test email sent!' : (data.error || 'Failed to send') })
    } catch {
      setTestResult({ success: false, message: 'Network error' })
    }
    setSendingTest(false)
    setTimeout(() => setTestResult(null), 4000)
  }

  const hasContent = !!subject || !!body

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header - clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '15', color: accentColor }}>
            <Mail className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Configured</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Merge Tags */}
          <div className="pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Insert merge tag:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MERGE_TAGS.map(({ tag, label: tagLabel }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  className="text-xs px-2.5 py-1 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-mono transition-colors"
                  title={`Insert ${tag}`}
                >
                  {tagLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={e => onSubjectChange(e.target.value)}
              placeholder={defaultSubject || 'Email subject...'}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': accentColor } as any}
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Email Body</label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {showPreview ? (
              <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm min-h-[160px] whitespace-pre-wrap">
                {previewText(body || defaultBody || '')}
              </div>
            ) : (
              <textarea
                ref={bodyRef}
                value={body}
                onChange={e => onBodyChange(e.target.value)}
                placeholder={defaultBody || 'Email body...'}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': accentColor } as any}
                rows={7}
              />
            )}
          </div>

          {/* Info + Test Send */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Info className="w-3.5 h-3.5" />
              <span>Merge tags will be replaced with actual participant data when sent</span>
            </div>
            <div className="flex items-center gap-2">
              {testResult && (
                <span className={`text-xs font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                </span>
              )}
              <button
                type="button"
                onClick={sendTestEmail}
                disabled={sendingTest || (!subject && !defaultSubject)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3 h-3" />
                {sendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
