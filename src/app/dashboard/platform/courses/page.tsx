// @ts-nocheck
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Plus, BookOpen, Edit2, Trash2, X, ChevronDown, ChevronRight, Save, Eye, Code, FileText, Type,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Link, Image, Minus, Undo2, Redo2, Palette, RemoveFormatting, Settings, Layers, Tag, Users, Copy, Loader2, Mail,
  Bell, BellOff, Calendar, ToggleLeft, ToggleRight, Sparkles, Wand2, MessageSquare, HelpCircle, CheckCircle,
  PenLine, Zap, RefreshCw, ArrowRight, GripVertical
} from 'lucide-react'
import EmailTemplateEditor from '@/components/EmailTemplateEditor'

// ── Interfaces ──
interface AiSettings {
  enabled: boolean
  brandVoice?: string
  targetAudience?: string
  toneStyle?: 'warm' | 'professional' | 'casual' | 'academic'
  perspectiveFraming?: string
  customInstructions?: string
  avoidTerms?: string
  preferredTerms?: string
  includeExercises?: boolean
  includeReflections?: boolean
  includeCallouts?: boolean
}

interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'open_ended' | 'scale'
  question: string
  options?: string[]
  correctAnswer?: string | number
  explanation?: string
  points?: number
}

interface CourseSettings {
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    fontFamily?: string
    headerImage?: string
    logoUrl?: string
  }
  tracks?: Track[]
  ai?: AiSettings
}

interface Track {
  id: string
  name: string
  description: string
  color: string
  icon: string
  access_mode: 'all' | 'tag_based' | 'participant_choice'
  choice_scope?: 'daily' | 'course'
  access_tags?: string[]
}

interface Course {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  weeks: number
  settings: CourseSettings | null
  created_at: string
}

interface Week {
  id: string
  course_id: string
  week_number: number
  title: string
  description: string | null
  release_mode?: 'all_at_once' | 'daily'
}

interface Lesson {
  id: string
  week_id: string
  title: string
  lesson_type: string
  type?: string
  description: string | null
  duration_minutes: number
  content: any
  sort_order: number
  track_id?: string | null
  send_notification?: boolean
  release_day?: number | null
}

// ── Rich Text Editor ──
function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [fontSize, setFontSize] = useState('3')
  const [fontFamily, setFontFamily] = useState('')
  const [textColor, setTextColor] = useState('#333333')
  const [bgColor, setBgColor] = useState('#ffffff')
  const isInitialized = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value
      isInitialized.current = true
    }
  }, [value])

  useEffect(() => { return () => { isInitialized.current = false } }, [])

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
    handleInput()
  }, [])

  const handleInput = () => { if (editorRef.current) onChange(editorRef.current.innerHTML) }

  const insertLink = () => { if (linkUrl) { exec('createLink', linkUrl); setLinkUrl(''); setShowLinkInput(false) } }
  const insertImage = () => { if (imageUrl) { exec('insertImage', imageUrl); setImageUrl(''); setShowImageInput(false) } }

  const ToolBtn = ({ icon: Icon, command, val, title }: { icon: any; command: string; val?: string; title: string }) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); exec(command, val) }}
      className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600" title={title}>
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
        <ToolBtn icon={Undo2} command="undo" title="Undo" />
        <ToolBtn icon={Redo2} command="redo" title="Redo" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <select className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white" onChange={e => { exec('formatBlock', e.target.value); e.target.value = '' }} defaultValue="">
          <option value="" disabled>Block</option>
          <option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option><option value="h4">Heading 4</option><option value="blockquote">Blockquote</option><option value="pre">Code Block</option>
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white" value={fontFamily} onChange={e => { setFontFamily(e.target.value); exec('fontName', e.target.value) }}>
          <option value="">Font</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option>
          <option value="Times New Roman, serif">Times New Roman</option><option value="Courier New, monospace">Courier New</option>
          <option value="Verdana, sans-serif">Verdana</option><option value="system-ui, sans-serif">System UI</option>
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white" value={fontSize} onChange={e => { setFontSize(e.target.value); exec('fontSize', e.target.value) }}>
          <option value="1">Small</option><option value="2">Normal-</option><option value="3">Normal</option>
          <option value="4">Medium</option><option value="5">Large</option><option value="6">X-Large</option><option value="7">XX-Large</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
        <ToolBtn icon={Bold} command="bold" title="Bold" />
        <ToolBtn icon={Italic} command="italic" title="Italic" />
        <ToolBtn icon={Underline} command="underline" title="Underline" />
        <ToolBtn icon={Strikethrough} command="strikeThrough" title="Strikethrough" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <label className="relative p-1.5 rounded hover:bg-gray-200 cursor-pointer" title="Text Color">
          <Palette className="w-4 h-4 text-gray-600" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: textColor }} />
          <input type="color" value={textColor} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => { setTextColor(e.target.value); exec('foreColor', e.target.value) }} />
        </label>
        <label className="relative p-1.5 rounded hover:bg-gray-200 cursor-pointer" title="Highlight">
          <span className="block w-4 h-4 rounded border border-gray-300 text-[10px] font-bold leading-4 text-center" style={{ backgroundColor: bgColor === '#ffffff' ? 'transparent' : bgColor }}>A</span>
          <input type="color" value={bgColor} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => { setBgColor(e.target.value); exec('hiliteColor', e.target.value) }} />
        </label>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn icon={AlignLeft} command="justifyLeft" title="Align Left" />
        <ToolBtn icon={AlignCenter} command="justifyCenter" title="Center" />
        <ToolBtn icon={AlignRight} command="justifyRight" title="Align Right" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn icon={List} command="insertUnorderedList" title="Bullet List" />
        <ToolBtn icon={ListOrdered} command="insertOrderedList" title="Numbered List" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn icon={Minus} command="insertHorizontalRule" title="Horizontal Rule" />
        <button type="button" onMouseDown={e => { e.preventDefault(); setShowLinkInput(!showLinkInput); setShowImageInput(false) }}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-600" title="Insert Link"><Link className="w-4 h-4" /></button>
        <button type="button" onMouseDown={e => { e.preventDefault(); setShowImageInput(!showImageInput); setShowLinkInput(false) }}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-600" title="Insert Image"><Image className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn icon={RemoveFormatting} command="removeFormat" title="Clear Formatting" />
      </div>
      {showLinkInput && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-blue-50">
          <input type="url" placeholder="https://example.com" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg" autoFocus onKeyDown={e => e.key === 'Enter' && insertLink()} />
          <button onClick={insertLink} className="px-3 py-1.5 text-sm bg-np-teal text-white rounded-lg">Insert</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl('') }} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">Cancel</button>
        </div>
      )}
      {showImageInput && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-green-50">
          <input type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg" autoFocus onKeyDown={e => e.key === 'Enter' && insertImage()} />
          <button onClick={insertImage} className="px-3 py-1.5 text-sm bg-np-teal text-white rounded-lg">Insert</button>
          <button onClick={() => { setShowImageInput(false); setImageUrl('') }} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">Cancel</button>
        </div>
      )}
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onBlur={handleInput}
        className="flex-1 overflow-y-auto p-6 min-h-[50vh] max-h-[60vh] focus:outline-none prose prose-sm max-w-none"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.6', color: '#333' }} />
    </div>
  )
}

// ── Track Icon Options ──
const TRACK_ICONS = [
  { value: 'reflection', label: '🪞 Reflection' },
  { value: 'coaching', label: '🎯 Coaching' },
  { value: 'self-guided', label: '🧭 Self-Guided' },
  { value: 'vr', label: '🥽 VR Session' },
  { value: 'breathwork', label: '🌬️ Breathwork' },
  { value: 'journaling', label: '📓 Journaling' },
  { value: 'movement', label: '🏃 Movement' },
  { value: 'meditation', label: '🧘 Meditation' },
  { value: 'community', label: '👥 Community' },
  { value: 'assessment', label: '📊 Assessment' },
]

const TRACK_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1']

const genId = () => Math.random().toString(36).slice(2, 10)

// ── Main Page ──
export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [weeks, setWeeks] = useState<Record<string, Week[]>>({})
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', status: 'draft' as Course['status'], weeks: 5, welcome_email_subject: '', welcome_email_body: '', lesson_notification_subject: '', lesson_notification_body: '' })

  const [showWeekForm, setShowWeekForm] = useState<string | null>(null)
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null)
  const [weekForm, setWeekForm] = useState({ title: '', description: '', week_number: 1, release_mode: 'all_at_once' as 'all_at_once' | 'daily' })

  const [showLessonForm, setShowLessonForm] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', duration_minutes: 15, description: '', track_id: '', send_notification: true, release_day: 0 })

  const [editingContentLessonId, setEditingContentLessonId] = useState<string | null>(null)
  const [contentEditorValue, setContentEditorValue] = useState('')
  const [editorMode, setEditorMode] = useState<'rich' | 'code' | 'preview'>('rich')
  const [savingContent, setSavingContent] = useState(false)

  // Settings modal
  const [showSettings, setShowSettings] = useState<string | null>(null)
  const [settingsTab, setSettingsTab] = useState<'theme' | 'tracks' | 'ai'>('theme')
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({})
  const [savingSettings, setSavingSettings] = useState(false)

  // Track editing
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [trackForm, setTrackForm] = useState<Track>({ id: '', name: '', description: '', color: '#3B82F6', icon: 'reflection', access_mode: 'all', choice_scope: 'course', access_tags: [] })
  const [newTag, setNewTag] = useState('')

  // AI Curriculum Generator
  const [showAiGenerator, setShowAiGenerator] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiError, setAiError] = useState('')
  const [aiStep, setAiStep] = useState<'prompt' | 'review' | 'creating'>('prompt')

  // AI Content Assistant (in editor)
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [aiAssistantMode, setAiAssistantMode] = useState<'write' | 'polish' | 'expand' | 'quiz'>('write')
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('')
  const [aiAssistantLoading, setAiAssistantLoading] = useState(false)

  // Quiz Creator
  const [showQuizCreator, setShowQuizCreator] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    if (error) console.error(error)
    else {
      const mapped = (data || []).map((c: any) => ({
        ...c,
        weeks: c.duration_weeks || c.weeks || 5,
        status: c.is_published ? 'published' : (c.status || 'draft'),
        settings: c.settings || {},
      }))
      setCourses(mapped)
    }
    setLoading(false)
  }

  const fetchWeeks = async (courseId: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('course_weeks').select('*').eq('course_id', courseId).order('week_number')
    setWeeks(prev => ({ ...prev, [courseId]: data || [] }))
    if (data) {
      for (const week of data) {
        const { data: ld } = await supabase.from('lessons').select('*').eq('week_id', week.id).order('sort_order')
        setLessons(prev => ({ ...prev, [week.id]: ld || [] }))
      }
    }
  }

  const toggleCourse = (courseId: string) => {
    if (expandedCourse === courseId) setExpandedCourse(null)
    else { setExpandedCourse(courseId); if (!weeks[courseId]) fetchWeeks(courseId) }
  }

  // ── Course CRUD ──
  const saveCourse = async () => {
    const supabase = getSupabase()
    if (!supabase || !courseForm.title) return
    const slug = courseForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const courseData = { title: courseForm.title, description: courseForm.description || null, slug, duration_weeks: courseForm.weeks, is_published: courseForm.status === 'published', welcome_email_subject: courseForm.welcome_email_subject || null, welcome_email_body: courseForm.welcome_email_body || null, lesson_notification_subject: courseForm.lesson_notification_subject || null, lesson_notification_body: courseForm.lesson_notification_body || null }
    if (editingCourseId) {
      const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourseId)
      if (error) { alert('Failed: ' + error.message); return }
    } else {
      const { error } = await supabase.from('courses').insert(courseData)
      if (error) { alert('Failed: ' + error.message); return }
    }
    setShowCourseForm(false); setEditingCourseId(null)
    setCourseForm({ title: '', description: '', status: 'draft', weeks: 5, welcome_email_subject: '', welcome_email_body: '', lesson_notification_subject: '', lesson_notification_body: '' }); fetchCourses()
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its content?')) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('courses').delete().eq('id', id); fetchCourses()
  }

  const [duplicating, setDuplicating] = useState<string | null>(null)

  const duplicateCourse = async (courseId: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    setDuplicating(courseId)
    try {
      // 1. Get source course
      const { data: src } = await supabase.from('courses').select('*').eq('id', courseId).single()
      if (!src) { alert('Course not found'); setDuplicating(null); return }

      // 2. Create new course
      const newTitle = src.title + ' (Copy)'
      const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const { data: newCourse, error: ce } = await supabase.from('courses').insert({
        title: newTitle,
        description: src.description,
        slug: newSlug,
        duration_weeks: src.duration_weeks,
        is_published: false,
        settings: src.settings,
      }).select().single()
      if (ce || !newCourse) { alert('Failed to duplicate course: ' + (ce?.message || 'Unknown error')); setDuplicating(null); return }

      // 3. Get and duplicate weeks
      const { data: srcWeeks } = await supabase.from('course_weeks').select('*').eq('course_id', courseId).order('week_number')
      if (srcWeeks && srcWeeks.length > 0) {
        for (const week of srcWeeks) {
          const { data: newWeek } = await supabase.from('course_weeks').insert({
            course_id: newCourse.id,
            week_number: week.week_number,
            title: week.title,
            description: week.description,
          }).select().single()

          if (newWeek) {
            // 4. Get and duplicate lessons for each week
            const { data: srcLessons } = await supabase.from('lessons').select('*').eq('week_id', week.id).order('sort_order')
            if (srcLessons && srcLessons.length > 0) {
              for (const lesson of srcLessons) {
                await supabase.from('lessons').insert({
                  week_id: newWeek.id,
                  title: lesson.title,
                  lesson_type: lesson.lesson_type,
                  description: lesson.description,
                  duration_minutes: lesson.duration_minutes,
                  content: lesson.content,
                  sort_order: lesson.sort_order,
                  is_required: lesson.is_required,
                  is_published: lesson.is_published,
                })
              }
            }
          }
        }
      }

      fetchCourses()
    } catch (err: any) {
      alert('Duplicate failed: ' + err.message)
    }
    setDuplicating(null)
  }

  // ── Week CRUD ──
  const saveWeek = async (courseId: string) => {
    const supabase = getSupabase()
    if (!supabase || !weekForm.title) return
    const wd = { week_number: weekForm.week_number, title: weekForm.title, description: weekForm.description || null, release_mode: weekForm.release_mode }
    if (editingWeekId) {
      const { error } = await supabase.from('course_weeks').update(wd).eq('id', editingWeekId)
      if (error) { alert('Failed: ' + error.message); return }
    } else {
      const { error } = await supabase.from('course_weeks').insert({ ...wd, course_id: courseId })
      if (error) { alert('Failed: ' + error.message); return }
    }
    setShowWeekForm(null); setEditingWeekId(null)
    setWeekForm({ title: '', description: '', week_number: 1, release_mode: 'all_at_once' }); fetchWeeks(courseId)
  }

  const startEditWeek = (w: Week) => { setWeekForm({ title: w.title, description: w.description || '', week_number: w.week_number, release_mode: w.release_mode || 'all_at_once' }); setEditingWeekId(w.id); setShowWeekForm(w.course_id) }

  const deleteWeek = async (wid: string, cid: string) => {
    if (!confirm('Delete this week and all its lessons?')) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('course_weeks').delete().eq('id', wid); fetchWeeks(cid)
  }

  // ── Lesson CRUD ──
  const saveLesson = async (weekId: string) => {
    const supabase = getSupabase()
    if (!supabase || !lessonForm.title) return
    const cl = lessons[weekId] || []
    const trackId = lessonForm.track_id || null
    if (editingLessonId) {
      const ld = { title: lessonForm.title, lesson_type: lessonForm.type, duration_minutes: lessonForm.duration_minutes, description: lessonForm.description || null, send_notification: lessonForm.send_notification, release_day: lessonForm.release_day || null }
      const { error } = await supabase.from('lessons').update(ld).eq('id', editingLessonId)
      if (error) { alert('Failed: ' + error.message); return }
    } else {
      const ld = { week_id: weekId, title: lessonForm.title, lesson_type: lessonForm.type, duration_minutes: lessonForm.duration_minutes, description: lessonForm.description || null, sort_order: cl.length + 1, send_notification: lessonForm.send_notification, release_day: lessonForm.release_day || null }
      const { error } = await supabase.from('lessons').insert(ld)
      if (error) { alert('Failed: ' + error.message); return }
    }
    setShowLessonForm(null); setEditingLessonId(null)
    setLessonForm({ title: '', type: 'video', duration_minutes: 15, description: '', track_id: '', send_notification: true, release_day: 0 })
    if (expandedCourse) fetchWeeks(expandedCourse)
  }

  const startEditLesson = (l: Lesson) => {
    setLessonForm({ title: l.title, type: l.lesson_type || l.type || 'video', duration_minutes: l.duration_minutes, description: l.description || '', track_id: l.track_id || '', send_notification: l.send_notification !== false, release_day: l.release_day || 0 })
    setEditingLessonId(l.id); setShowLessonForm(l.week_id)
  }

  const deleteLesson = async (lid: string) => {
    if (!confirm('Delete this lesson?')) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('lessons').delete().eq('id', lid)
    if (expandedCourse) fetchWeeks(expandedCourse)
  }

  // ── Content Editor ──
  const openContentEditor = (l: Lesson) => {
    const c = l.content
    let h = ''
    if (typeof c === 'string') h = c
    else if (c && typeof c === 'object') h = c.html || c.body || JSON.stringify(c, null, 2)
    setContentEditorValue(h); setEditingContentLessonId(l.id); setEditorMode('rich')
  }

  const saveContent = async () => {
    if (!editingContentLessonId) return
    const supabase = getSupabase()
    if (!supabase) return
    setSavingContent(true)
    const { error } = await supabase.from('lessons').update({ content: { html: contentEditorValue } }).eq('id', editingContentLessonId)
    if (error) alert('Failed: ' + error.message)
    setSavingContent(false); setEditingContentLessonId(null); setContentEditorValue('')
    if (expandedCourse) fetchWeeks(expandedCourse)
  }

  // ── Settings ──
  const openSettings = (course: Course) => {
    setCourseSettings(course.settings || {})
    setShowSettings(course.id)
    setSettingsTab('theme')
  }

  const saveSettings = async () => {
    if (!showSettings) return
    const supabase = getSupabase()
    if (!supabase) return
    setSavingSettings(true)
    const { error } = await supabase.from('courses').update({ settings: courseSettings }).eq('id', showSettings)
    if (error) alert('Failed: ' + error.message)
    setSavingSettings(false); setShowSettings(null)
    fetchCourses()
  }

  // ── Track CRUD ──
  const addTrack = () => {
    const newTrack: Track = { ...trackForm, id: genId() }
    const tracks = [...(courseSettings.tracks || []), newTrack]
    setCourseSettings({ ...courseSettings, tracks })
    setTrackForm({ id: '', name: '', description: '', color: TRACK_COLORS[(tracks.length) % TRACK_COLORS.length], icon: 'reflection', access_mode: 'all', choice_scope: 'course', access_tags: [] })
  }

  const updateTrack = () => {
    if (!editingTrack) return
    const tracks = (courseSettings.tracks || []).map(t => t.id === editingTrack.id ? trackForm : t)
    setCourseSettings({ ...courseSettings, tracks })
    setEditingTrack(null)
    setTrackForm({ id: '', name: '', description: '', color: '#3B82F6', icon: 'reflection', access_mode: 'all', choice_scope: 'course', access_tags: [] })
  }

  const deleteTrack = (tid: string) => {
    const tracks = (courseSettings.tracks || []).filter(t => t.id !== tid)
    setCourseSettings({ ...courseSettings, tracks })
  }

  const startEditTrack = (t: Track) => { setEditingTrack(t); setTrackForm({ ...t }) }

  const addTag = () => { if (newTag.trim()) { setTrackForm({ ...trackForm, access_tags: [...(trackForm.access_tags || []), newTag.trim()] }); setNewTag('') } }
  const removeTag = (tag: string) => { setTrackForm({ ...trackForm, access_tags: (trackForm.access_tags || []).filter(t => t !== tag) }) }

  const getTrackById = (trackId: string, courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    return course?.settings?.tracks?.find(t => t.id === trackId)
  }

  const getLessonTypeColor = (t: string) => {
    switch (t) {
      case 'video': return 'bg-blue-50 text-blue-600'
      case 'reading': return 'bg-green-50 text-green-600'
      case 'practice': return 'bg-purple-50 text-purple-600'
      case 'live': return 'bg-teal-50 text-teal-600'
      case 'assessment': return 'bg-red-50 text-red-600'
      case 'reflection': return 'bg-amber-50 text-amber-600'
      case 'quiz': return 'bg-indigo-50 text-indigo-600'
      case 'survey': return 'bg-pink-50 text-pink-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const currentCourseTracks = (): Track[] => {
    if (!expandedCourse) return []
    const course = courses.find(c => c.id === expandedCourse)
    return course?.settings?.tracks || []
  }

  // ── AI Curriculum Generation ──
  const generateCurriculum = async () => {
    setAiGenerating(true)
    setAiError('')

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'full_course',
          prompt: aiPrompt
        })
      })

      const result = await response.json()
      console.log('AI Response:', result)

      if (!response.ok || result.error) {
        throw new Error(result.error || result.details || 'Failed to generate curriculum')
      }

      if (result.data && result.data.course && result.data.weeks) {
        setAiResult(result.data)
        setAiStep('review')
      } else if (result.raw) {
        // Try to extract JSON from raw response
        try {
          let cleanRaw = result.raw
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim()
          
          const parsed = JSON.parse(cleanRaw)
          if (parsed.course && parsed.weeks) {
            setAiResult(parsed)
            setAiStep('review')
          } else {
            throw new Error('Response missing course or weeks data')
          }
        } catch (parseErr: any) {
          console.error('Parse error:', parseErr)
          console.error('Raw content:', result.raw?.substring(0, 500))
          setAiError(`Could not parse AI response: ${parseErr.message}. Try a simpler description.`)
        }
      } else {
        console.error('Unexpected result format:', result)
        setAiError('Unexpected response format. Please try again.')
      }
    } catch (err: any) {
      console.error('Generate error:', err)
      setAiError(err.message || 'Failed to generate curriculum')
    } finally {
      setAiGenerating(false)
    }
  }

  const createCourseFromAi = async () => {
    if (!aiResult) return
    setAiStep('creating')

    const supabase = getSupabase()
    if (!supabase) return

    try {
      // 1. Create the course
      const { data: newCourse, error: courseError } = await supabase.from('courses').insert({
        title: aiResult.course.title,
        description: aiResult.course.description,
        duration_weeks: aiResult.course.weeks || aiResult.weeks?.length || 5,
        status: 'draft',
        is_published: false
      }).select().single()

      if (courseError) throw courseError

      // 2. Create weeks and lessons
      for (const week of aiResult.weeks || []) {
        const { data: newWeek, error: weekError } = await supabase.from('course_weeks').insert({
          course_id: newCourse.id,
          week_number: week.week_number,
          title: week.title,
          description: week.description || null
        }).select().single()

        if (weekError) {
          console.error('Week creation error:', weekError)
          continue
        }

        // Create lessons for this week
        for (let i = 0; i < (week.lessons || []).length; i++) {
          const lesson = week.lessons[i]
          const { error: lessonError } = await supabase.from('lessons').insert({
            week_id: newWeek.id,
            title: lesson.title,
            lesson_type: lesson.type || 'reading',
            description: lesson.description || null,
            duration_minutes: lesson.duration_minutes || 15,
            sort_order: i,
            content: lesson.content_outline ? { outline: lesson.content_outline } : null,
            send_notification: true
          })

          if (lessonError) {
            console.error('Lesson creation error:', lessonError)
          }
        }
      }

      // Success! Close modal and refresh
      setShowAiGenerator(false)
      setAiResult(null)
      setAiPrompt('')
      setAiStep('prompt')
      fetchCourses()

      // Expand the new course
      setExpandedCourse(newCourse.id)
      fetchWeeks(newCourse.id)

    } catch (err: any) {
      console.error('Course creation error:', err)
      setAiError(err.message || 'Failed to create course')
      setAiStep('review')
    }
  }

  // ── AI Content Assistant ──
  const getAiSettingsForCourse = (): AiSettings | undefined => {
    if (!expandedCourse) return undefined
    const course = courses.find(c => c.id === expandedCourse)
    return course?.settings?.ai
  }

  const runAiAssistant = async (mode: 'write' | 'polish' | 'expand' | 'simplify') => {
    setAiAssistantLoading(true)
    const aiSettings = getAiSettingsForCourse()
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson_content',
          mode,
          prompt: aiAssistantPrompt,
          currentContent: contentEditorValue,
          aiSettings
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error('Server error. Please check that your Anthropic API key is configured correctly.')
      }

      const result = await response.json()
      if (!response.ok || result.error) {
        throw new Error(result.error || 'AI generation failed')
      }

      if (result.content) {
        setContentEditorValue(result.content)
        // Auto-switch to HTML mode since AI generates HTML
        setEditorMode('code')
        setShowAiAssistant(false)
        setAiAssistantPrompt('')
      }
    } catch (err: any) {
      console.error('AI Assistant error:', err)
      alert(err.message || 'Failed to generate content')
    } finally {
      setAiAssistantLoading(false)
    }
  }

  const generateQuiz = async (topic: string, numQuestions: number = 5) => {
    setAiAssistantLoading(true)
    const aiSettings = getAiSettingsForCourse()

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          prompt: topic,
          numQuestions,
          currentContent: contentEditorValue,
          aiSettings
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error('Server error. Please check that your Anthropic API key is configured correctly.')
      }

      const result = await response.json()
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Quiz generation failed')
      }

      if (result.data?.questions) {
        setQuizQuestions(result.data.questions)
      } else if (result.content) {
        // Insert quiz HTML into editor
        setContentEditorValue(contentEditorValue + '\n\n' + result.content)
        setEditorMode('code')
        setShowQuizCreator(false)
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err)
      alert(err.message || 'Failed to generate quiz')
    } finally {
      setAiAssistantLoading(false)
    }
  }

  const insertQuizHtml = () => {
    if (quizQuestions.length === 0) return

    const quizHtml = `
<div class="quiz-container" style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
  <h3 style="color: #1e3a5f; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
    <span style="background: #3d8b8b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">?</span>
    Knowledge Check
  </h3>
  ${quizQuestions.map((q, i) => `
  <div class="quiz-question" style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
    <p style="font-weight: 600; margin-bottom: 12px;">${i + 1}. ${q.question}</p>
    ${q.type === 'multiple_choice' && q.options ? `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${q.options.map((opt, j) => `
      <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer;">
        <input type="radio" name="q${i}" value="${j}" style="accent-color: #3d8b8b;">
        <span>${opt}</span>
      </label>`).join('')}
    </div>` : ''}
    ${q.type === 'true_false' ? `
    <div style="display: flex; gap: 12px;">
      <label style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer;">
        <input type="radio" name="q${i}" value="true" style="accent-color: #3d8b8b;"> True
      </label>
      <label style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer;">
        <input type="radio" name="q${i}" value="false" style="accent-color: #3d8b8b;"> False
      </label>
    </div>` : ''}
    ${q.type === 'open_ended' ? `
    <textarea placeholder="Your answer..." style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; min-height: 80px; resize: vertical;"></textarea>` : ''}
    ${q.type === 'scale' ? `
    <div style="display: flex; justify-content: space-between; gap: 8px;">
      ${[1,2,3,4,5].map(n => `
      <label style="display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
        <input type="radio" name="q${i}" value="${n}" style="accent-color: #3d8b8b;">
        <span style="font-size: 12px;">${n}</span>
      </label>`).join('')}
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 4px;">
      <span>Strongly Disagree</span>
      <span>Strongly Agree</span>
    </div>` : ''}
  </div>`).join('')}
</div>`

    setContentEditorValue(contentEditorValue + quizHtml)
    setShowQuizCreator(false)
    setQuizQuestions([])
  }

  if (loading) return <div className="p-8 text-center text-text-muted">Loading courses...</div>

  return (
    <div className="space-y-6">

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-display text-lg font-semibold">Course Settings</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setSettingsTab('theme')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${settingsTab === 'theme' ? 'bg-np-teal text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="flex items-center gap-1.5"><Palette className="w-4 h-4" /> Theme</span>
                </button>
                <button onClick={() => setSettingsTab('tracks')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${settingsTab === 'tracks' ? 'bg-np-teal text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> Tracks</span>
                </button>
                <button onClick={() => setSettingsTab('ai')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${settingsTab === 'ai' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> AI Settings</span>
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button onClick={() => setShowSettings(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Theme Tab */}
              {settingsTab === 'theme' && (
                <div className="space-y-6">
                  <p className="text-sm text-text-muted">Customize the visual appearance of this course for participants.</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={courseSettings.theme?.primaryColor || '#3B9C8F'}
                          onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, primaryColor: e.target.value } })}
                          className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                        <input type="text" value={courseSettings.theme?.primaryColor || '#3B9C8F'}
                          onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, primaryColor: e.target.value } })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={courseSettings.theme?.secondaryColor || '#1a1a2e'}
                          onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, secondaryColor: e.target.value } })}
                          className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                        <input type="text" value={courseSettings.theme?.secondaryColor || '#1a1a2e'}
                          onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, secondaryColor: e.target.value } })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={courseSettings.theme?.accentColor || '#F59E0B'}
                          onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, accentColor: e.target.value } })}
                          className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                        <input type="text" value={courseSettings.theme?.accentColor || '#F59E0B'}
                          onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, accentColor: e.target.value } })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono" />
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Font Family</label>
                      <select value={courseSettings.theme?.fontFamily || 'system-ui'}
                        onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, fontFamily: e.target.value } })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                        <option value="system-ui">System Default</option><option value="Inter, sans-serif">Inter</option>
                        <option value="Georgia, serif">Georgia</option><option value="Merriweather, serif">Merriweather</option>
                        <option value="Lato, sans-serif">Lato</option><option value="Playfair Display, serif">Playfair Display</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Header Image URL</label>
                      <input type="url" value={courseSettings.theme?.headerImage || ''}
                        onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, headerImage: e.target.value } })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Course Logo URL</label>
                      <input type="url" value={courseSettings.theme?.logoUrl || ''}
                        onChange={e => setCourseSettings({ ...courseSettings, theme: { ...courseSettings.theme, logoUrl: e.target.value } })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="https://..." />
                    </div>
                  </div>
                  {/* Theme Preview */}
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="h-20" style={{ background: `linear-gradient(135deg, ${courseSettings.theme?.primaryColor || '#3B9C8F'}, ${courseSettings.theme?.secondaryColor || '#1a1a2e'})` }}>
                      {courseSettings.theme?.headerImage && (
                        <img src={courseSettings.theme.headerImage} alt="" className="w-full h-full object-cover opacity-50" />
                      )}
                    </div>
                    <div className="p-4" style={{ fontFamily: courseSettings.theme?.fontFamily || 'system-ui' }}>
                      <h4 className="text-lg font-semibold" style={{ color: courseSettings.theme?.secondaryColor || '#1a1a2e' }}>Preview Title</h4>
                      <p className="text-sm text-gray-600 mt-1">This is how course content will appear with your theme settings.</p>
                      <button className="mt-3 px-4 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: courseSettings.theme?.accentColor || '#F59E0B' }}>Action Button</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tracks Tab */}
              {settingsTab === 'tracks' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-text-muted mb-4">Create parallel tracks within this course. Tracks let you offer different pathways — like Reflections, Coaching, and Self-Guided — that run alongside each other. Each lesson can be assigned to a track.</p>
                  </div>

                  {/* Existing Tracks */}
                  {(courseSettings.tracks || []).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Current Tracks</h4>
                      {(courseSettings.tracks || []).map(track => (
                        <div key={track.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-8 rounded-full" style={{ backgroundColor: track.color }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{TRACK_ICONS.find(i => i.value === track.icon)?.label.split(' ')[0] || '📋'} {track.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  track.access_mode === 'all' ? 'bg-green-50 text-green-700' :
                                  track.access_mode === 'tag_based' ? 'bg-purple-50 text-purple-700' :
                                  'bg-blue-50 text-blue-700'
                                }`}>
                                  {track.access_mode === 'all' ? 'All Participants' :
                                   track.access_mode === 'tag_based' ? `Tags: ${(track.access_tags || []).join(', ')}` :
                                   `Participant Choice (${track.choice_scope})`}
                                </span>
                              </div>
                              {track.description && <p className="text-xs text-text-muted mt-0.5">{track.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => startEditTrack(track)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-text-muted" /></button>
                            <button onClick={() => deleteTrack(track.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Track Form */}
                  <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700">{editingTrack ? 'Edit Track' : 'Add New Track'}</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-600">Track Name</label>
                        <input type="text" value={trackForm.name} onChange={e => setTrackForm({ ...trackForm, name: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="e.g. Reflections" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-600">Icon</label>
                        <select value={trackForm.icon} onChange={e => setTrackForm({ ...trackForm, icon: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                          {TRACK_ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1 text-gray-600">Description</label>
                        <input type="text" value={trackForm.description} onChange={e => setTrackForm({ ...trackForm, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="What this track is about" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-600">Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={trackForm.color} onChange={e => setTrackForm({ ...trackForm, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                          <div className="flex gap-1">
                            {TRACK_COLORS.map(c => (
                              <button key={c} onClick={() => setTrackForm({ ...trackForm, color: c })}
                                className={`w-6 h-6 rounded-full border-2 ${trackForm.color === c ? 'border-gray-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-600">Access Mode</label>
                        <select value={trackForm.access_mode} onChange={e => setTrackForm({ ...trackForm, access_mode: e.target.value as Track['access_mode'] })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                          <option value="all">All Participants</option>
                          <option value="tag_based">Tag-Based Permissions</option>
                          <option value="participant_choice">Let Participant Choose</option>
                        </select>
                      </div>
                    </div>

                    {/* Tag-based options */}
                    {trackForm.access_mode === 'tag_based' && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-medium mb-2 text-gray-600 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Access Tags</label>
                        <p className="text-xs text-text-muted mb-2">Only participants with these tags will see this track.</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(trackForm.access_tags || []).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                              {tag} <button onClick={() => removeTag(tag)} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg" placeholder="e.g. premium, vip, coaching-tier" />
                          <button onClick={addTag} disabled={!newTag.trim()} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg disabled:opacity-50">Add Tag</button>
                        </div>
                      </div>
                    )}

                    {/* Participant choice options */}
                    {trackForm.access_mode === 'participant_choice' && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-medium mb-2 text-gray-600 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Choice Scope</label>
                        <p className="text-xs text-text-muted mb-2">When can participants switch or select this track?</p>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="choice_scope" value="course" checked={trackForm.choice_scope === 'course'}
                              onChange={() => setTrackForm({ ...trackForm, choice_scope: 'course' })} className="text-np-teal" />
                            <div>
                              <span className="text-sm font-medium">Entire Course</span>
                              <p className="text-xs text-text-muted">Choose once at enrollment, locked for the duration</p>
                            </div>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="choice_scope" value="daily" checked={trackForm.choice_scope === 'daily'}
                              onChange={() => setTrackForm({ ...trackForm, choice_scope: 'daily' })} className="text-np-teal" />
                            <div>
                              <span className="text-sm font-medium">Daily</span>
                              <p className="text-xs text-text-muted">Can switch tracks each day</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {editingTrack && (
                        <button onClick={() => { setEditingTrack(null); setTrackForm({ id: '', name: '', description: '', color: '#3B82F6', icon: 'reflection', access_mode: 'all', choice_scope: 'course', access_tags: [] }) }}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel Edit</button>
                      )}
                      <button onClick={editingTrack ? updateTrack : addTrack} disabled={!trackForm.name}
                        className="px-4 py-1.5 text-sm bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
                        {editingTrack ? 'Update Track' : 'Add Track'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Settings Tab */}
              {settingsTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">AI Content Assistant</h4>
                      <p className="text-sm text-text-muted">Configure how AI generates and enhances content for this course.</p>
                    </div>
                    <button
                      onClick={() => setCourseSettings({
                        ...courseSettings,
                        ai: { ...courseSettings.ai, enabled: !courseSettings.ai?.enabled }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${courseSettings.ai?.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${courseSettings.ai?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {courseSettings.ai?.enabled !== false && (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Brand Voice */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Brand Voice</label>
                          <textarea
                            value={courseSettings.ai?.brandVoice || ''}
                            onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, brandVoice: e.target.value } })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            rows={3}
                            placeholder="Describe your brand's voice... e.g., Warm and encouraging, like a knowledgeable friend who believes in your potential."
                          />
                        </div>

                        {/* Target Audience */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Target Audience</label>
                          <textarea
                            value={courseSettings.ai?.targetAudience || ''}
                            onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, targetAudience: e.target.value } })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            rows={3}
                            placeholder="Who is this course for? e.g., Busy professionals seeking to build nervous system capacity without adding more to their plates."
                          />
                        </div>

                        {/* Tone Style */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Tone Style</label>
                          <select
                            value={courseSettings.ai?.toneStyle || 'warm'}
                            onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, toneStyle: e.target.value as AiSettings['toneStyle'] } })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          >
                            <option value="warm">Warm & Encouraging</option>
                            <option value="professional">Professional & Clear</option>
                            <option value="casual">Casual & Conversational</option>
                            <option value="academic">Academic & Precise</option>
                          </select>
                        </div>

                        {/* Perspective Framing */}
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Perspective Framing</label>
                          <textarea
                            value={courseSettings.ai?.perspectiveFraming || ''}
                            onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, perspectiveFraming: e.target.value } })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            rows={3}
                            placeholder="How should concepts be framed? e.g., Frame all patterns as adaptive strategies, not deficits. Focus on capacity building over pathology."
                          />
                        </div>
                      </div>

                      {/* Preferred & Avoid Terms */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-1.5 text-green-700">✓ Preferred Terms</label>
                          <textarea
                            value={courseSettings.ai?.preferredTerms || ''}
                            onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, preferredTerms: e.target.value } })}
                            className="w-full px-3 py-2 text-sm border border-green-200 rounded-lg bg-green-50/50"
                            rows={2}
                            placeholder="Terms to use... e.g., capacity, state fluidity, regulation, window of tolerance"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5 text-red-700">✗ Avoid Terms</label>
                          <textarea
                            value={courseSettings.ai?.avoidTerms || ''}
                            onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, avoidTerms: e.target.value } })}
                            className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-red-50/50"
                            rows={2}
                            placeholder="Terms to avoid... e.g., broken, damaged, disorder, fix, cure, treatment"
                          />
                        </div>
                      </div>

                      {/* Content Elements */}
                      <div>
                        <label className="block text-sm font-medium mb-3">Content Elements to Include</label>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseSettings.ai?.includeExercises !== false}
                              onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, includeExercises: e.target.checked } })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Practical Exercises</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseSettings.ai?.includeReflections !== false}
                              onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, includeReflections: e.target.checked } })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Reflection Prompts</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseSettings.ai?.includeCallouts !== false}
                              onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, includeCallouts: e.target.checked } })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Key Takeaway Callouts</span>
                          </label>
                        </div>
                      </div>

                      {/* Custom Instructions */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Custom AI Instructions</label>
                        <textarea
                          value={courseSettings.ai?.customInstructions || ''}
                          onChange={e => setCourseSettings({ ...courseSettings, ai: { ...courseSettings.ai, enabled: true, customInstructions: e.target.value } })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          rows={4}
                          placeholder="Any additional instructions for the AI... e.g., Always ground concepts in everyday examples. Use the 'Name 3 things' structure when appropriate. Avoid em dashes."
                        />
                      </div>

                      {/* Preview */}
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <h5 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> AI will generate content that...
                        </h5>
                        <ul className="text-sm text-purple-800 space-y-1">
                          {courseSettings.ai?.brandVoice && <li>• Uses your brand voice: "{courseSettings.ai.brandVoice.substring(0, 50)}..."</li>}
                          {courseSettings.ai?.toneStyle && <li>• Maintains a {courseSettings.ai.toneStyle} tone</li>}
                          {courseSettings.ai?.perspectiveFraming && <li>• Frames concepts as: "{courseSettings.ai.perspectiveFraming.substring(0, 50)}..."</li>}
                          {courseSettings.ai?.includeExercises && <li>• Includes practical exercises</li>}
                          {courseSettings.ai?.includeReflections && <li>• Adds reflection prompts</li>}
                          {!courseSettings.ai?.brandVoice && !courseSettings.ai?.toneStyle && <li className="text-purple-600">Add settings above to customize AI behavior</li>}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowSettings(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={saveSettings} disabled={savingSettings}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
                <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Curriculum Generator Modal ── */}
      {showAiGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">AI Curriculum Generator</h3>
                  <p className="text-sm text-white/70">Powered by Claude</p>
                </div>
              </div>
              <button onClick={() => setShowAiGenerator(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {aiStep === 'prompt' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe your course</label>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={6}
                      placeholder="Example: Create a 5-week nervous system regulation course for busy professionals. Each week should focus on a different aspect of building capacity - Week 1: Understanding your nervous system, Week 2: Recognizing activation patterns, Week 3: Building regulation skills, Week 4: VR biofeedback integration, Week 5: Sustainable practices. Include a mix of video lessons, reading materials, reflection exercises, and practical practices."
                    />
                    <p className="mt-2 text-xs text-gray-400">Be specific about the number of weeks, lesson types, and themes you want. The more detail you provide, the better the results.</p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> Tips for great results
                    </h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Specify the number of weeks and lessons per week</li>
                      <li>• Mention your target audience (beginners, professionals, etc.)</li>
                      <li>• List specific topics or themes for each week</li>
                      <li>• Include desired lesson types: video, reading, exercise, reflection, practice, quiz, survey</li>
                      <li>• Add any specific frameworks or approaches to incorporate</li>
                    </ul>
                  </div>

                  {aiError && (
                    <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">
                      {aiError}
                    </div>
                  )}
                </div>
              )}

              {aiStep === 'review' && aiResult && (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">Curriculum Generated!</h4>
                      <p className="text-sm text-green-700">Review the structure below, then click "Create Course" to add it to your platform.</p>
                    </div>
                  </div>

                  {/* Course Overview */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-display text-lg font-semibold">{aiResult.course?.title}</h4>
                      <p className="text-sm text-gray-600">{aiResult.course?.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{aiResult.course?.weeks} weeks</p>
                    </div>

                    {/* Weeks */}
                    <div className="divide-y divide-gray-100">
                      {aiResult.weeks?.map((week: any, wi: number) => (
                        <div key={wi} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center">{week.week_number}</span>
                            <h5 className="font-medium">{week.title}</h5>
                          </div>
                          {week.description && <p className="text-sm text-gray-500 mb-3 ml-8">{week.description}</p>}
                          <div className="ml-8 space-y-2">
                            {week.lessons?.map((lesson: any, li: number) => (
                              <div key={li} className="flex items-start gap-3 text-sm bg-gray-50 rounded-lg p-2.5">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                  lesson.type === 'video' ? 'bg-blue-100 text-blue-700' :
                                  lesson.type === 'reading' ? 'bg-amber-100 text-amber-700' :
                                  lesson.type === 'exercise' ? 'bg-green-100 text-green-700' :
                                  lesson.type === 'reflection' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{lesson.type}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">{lesson.title}</p>
                                  {lesson.description && <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>}
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0">{lesson.duration_minutes} min</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {aiStep === 'creating' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  <h4 className="font-display text-lg font-semibold mb-2">Creating your course...</h4>
                  <p className="text-sm text-gray-500">This may take a moment</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              {aiStep === 'prompt' && (
                <>
                  <button onClick={() => setShowAiGenerator(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">
                    Cancel
                  </button>
                  <button
                    onClick={generateCurriculum}
                    disabled={!aiPrompt.trim() || aiGenerating}
                    className="flex items-center gap-2 px-6 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {aiGenerating ? 'Generating...' : 'Generate Curriculum'}
                  </button>
                </>
              )}

              {aiStep === 'review' && (
                <>
                  <button onClick={() => { setAiStep('prompt'); setAiResult(null) }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">
                    ← Back to Edit
                  </button>
                  <button
                    onClick={createCourseFromAi}
                    className="flex items-center gap-2 px-6 py-2 text-sm bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a]"
                  >
                    <Plus className="w-4 h-4" /> Create Course
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Content Editor Modal ── */}
      {editingContentLessonId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <h3 className="font-display text-lg font-semibold">Lesson Content Editor</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditorMode('rich')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${editorMode === 'rich' ? 'bg-np-teal text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Type className="w-4 h-4" /> Rich Text</button>
                <button onClick={() => setEditorMode('code')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${editorMode === 'code' ? 'bg-np-teal text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Code className="w-4 h-4" /> HTML</button>
                <button onClick={() => setEditorMode('preview')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${editorMode === 'preview' ? 'bg-np-teal text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Eye className="w-4 h-4" /> Preview</button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                {/* AI Assistant Button */}
                <button onClick={() => setShowAiAssistant(!showAiAssistant)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${showAiAssistant ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'text-purple-600 hover:bg-purple-50 border border-purple-200'}`}>
                  <Sparkles className="w-4 h-4" /> AI Assistant</button>
                {/* Quiz Creator Button */}
                <button onClick={() => setShowQuizCreator(!showQuizCreator)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${showQuizCreator ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-50 border border-amber-200'}`}>
                  <HelpCircle className="w-4 h-4" /> Quiz</button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <button onClick={() => { setEditingContentLessonId(null); setContentEditorValue(''); setShowAiAssistant(false); setShowQuizCreator(false) }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>

            {/* AI Assistant Panel */}
            {showAiAssistant && (
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-purple-900">AI Writing Assistant</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Powered by Claude</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setAiAssistantMode('write')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${aiAssistantMode === 'write' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}>
                        <PenLine className="w-3.5 h-3.5" /> Write New
                      </button>
                      <button onClick={() => setAiAssistantMode('polish')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${aiAssistantMode === 'polish' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}>
                        <Sparkles className="w-3.5 h-3.5" /> Polish
                      </button>
                      <button onClick={() => setAiAssistantMode('expand')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${aiAssistantMode === 'expand' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}>
                        <Zap className="w-3.5 h-3.5" /> Expand
                      </button>
                    </div>
                    <textarea
                      value={aiAssistantPrompt}
                      onChange={e => setAiAssistantPrompt(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white"
                      rows={2}
                      placeholder={
                        aiAssistantMode === 'write' ? "Describe what you want to write... e.g., 'Introduction to nervous system regulation that explains the window of tolerance concept'" :
                        aiAssistantMode === 'polish' ? "What aspects to polish... e.g., 'Make it warmer and more encouraging, add a practical example'" :
                        "What to expand on... e.g., 'Add more detail about the physiological aspects and include a reflection prompt'"
                      }
                    />
                  </div>
                  <button
                    onClick={() => runAiAssistant(aiAssistantMode)}
                    disabled={aiAssistantLoading || (!aiAssistantPrompt && aiAssistantMode === 'write')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                  >
                    {aiAssistantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {aiAssistantLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Creator Panel */}
            {showQuizCreator && (
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-amber-900">Quiz Creator</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Knowledge Checks</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* AI Generate Quiz */}
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <h5 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Generate Quiz
                    </h5>
                    <input
                      type="text"
                      value={aiAssistantPrompt}
                      onChange={e => setAiAssistantPrompt(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg mb-2"
                      placeholder="Topic for quiz... e.g., 'Window of tolerance concepts'"
                    />
                    <div className="flex gap-2">
                      <select className="px-3 py-1.5 text-sm border border-amber-200 rounded-lg">
                        <option value="3">3 questions</option>
                        <option value="5">5 questions</option>
                        <option value="10">10 questions</option>
                      </select>
                      <button
                        onClick={() => generateQuiz(aiAssistantPrompt, 5)}
                        disabled={aiAssistantLoading || !aiAssistantPrompt}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                      >
                        {aiAssistantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  {/* Manual Quiz Builder */}
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <h5 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                      <PenLine className="w-4 h-4" /> Manual Quiz Builder
                    </h5>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button onClick={() => setQuizQuestions([...quizQuestions, { id: Date.now().toString(), type: 'multiple_choice', question: '', options: ['', '', '', ''], correctAnswer: 0 }])}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100">
                        + Multiple Choice
                      </button>
                      <button onClick={() => setQuizQuestions([...quizQuestions, { id: Date.now().toString(), type: 'true_false', question: '', correctAnswer: 'true' }])}
                        className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100">
                        + True/False
                      </button>
                      <button onClick={() => setQuizQuestions([...quizQuestions, { id: Date.now().toString(), type: 'open_ended', question: '' }])}
                        className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100">
                        + Open Ended
                      </button>
                      <button onClick={() => setQuizQuestions([...quizQuestions, { id: Date.now().toString(), type: 'scale', question: '' }])}
                        className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100">
                        + Scale (1-5)
                      </button>
                    </div>
                    {quizQuestions.length > 0 && (
                      <div className="text-xs text-amber-700 mb-2">{quizQuestions.length} question(s) added</div>
                    )}
                    <button
                      onClick={insertQuizHtml}
                      disabled={quizQuestions.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" /> Insert Quiz
                    </button>
                  </div>
                </div>

                {/* Question Editor */}
                {quizQuestions.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {quizQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-amber-200">
                        <span className="text-xs font-medium text-amber-600 mt-1">{i + 1}.</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={q.question}
                            onChange={e => setQuizQuestions(quizQuestions.map(qq => qq.id === q.id ? { ...qq, question: e.target.value } : qq))}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                            placeholder="Enter question..."
                          />
                          {q.type === 'multiple_choice' && q.options && (
                            <div className="mt-2 grid grid-cols-2 gap-1">
                              {q.options.map((opt, j) => (
                                <input
                                  key={j}
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const newOpts = [...q.options!]
                                    newOpts[j] = e.target.value
                                    setQuizQuestions(quizQuestions.map(qq => qq.id === q.id ? { ...qq, options: newOpts } : qq))
                                  }}
                                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                                  placeholder={`Option ${j + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          q.type === 'multiple_choice' ? 'bg-blue-50 text-blue-600' :
                          q.type === 'true_false' ? 'bg-green-50 text-green-600' :
                          q.type === 'open_ended' ? 'bg-purple-50 text-purple-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>{q.type.replace('_', ' ')}</span>
                        <button onClick={() => setQuizQuestions(quizQuestions.filter(qq => qq.id !== q.id))}
                          className="p-1 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-auto">
              {editorMode === 'rich' && <RichTextEditor value={contentEditorValue} onChange={setContentEditorValue} />}
              {editorMode === 'code' && (
                <textarea value={contentEditorValue} onChange={e => setContentEditorValue(e.target.value)}
                  placeholder="Paste or write HTML/CSS here..." className="w-full h-full min-h-[65vh] p-6 font-mono text-sm border-0 focus:ring-0 focus:outline-none resize-none bg-gray-50" spellCheck={false} />
              )}
              {editorMode === 'preview' && (
                <div className="w-full h-full min-h-[65vh] overflow-auto">
                  {contentEditorValue ? (
                    <iframe srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:24px;line-height:1.6;color:#333;max-width:800px;margin:0 auto}img{max-width:100%}h1,h2,h3{color:#1a1a1a}a{color:#2d7a7a}blockquote{border-left:3px solid #2d7a7a;padding-left:16px;color:#555}.quiz-container{background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0}</style></head><body>${contentEditorValue}</body></html>`}
                      className="w-full h-full min-h-[65vh] border-0" sandbox="allow-same-origin" title="Preview" />
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[65vh] text-gray-400">
                      <div className="text-center"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No content yet.</p></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400">{contentEditorValue.length} chars</p>
              <div className="flex gap-3">
                <button onClick={() => { setEditingContentLessonId(null); setContentEditorValue(''); setShowAiAssistant(false); setShowQuizCreator(false) }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={saveContent} disabled={savingContent} className="flex items-center gap-2 px-5 py-2 text-sm bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
                  <Save className="w-4 h-4" /> {savingContent ? 'Saving...' : 'Save Content'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Course Builder</h1>
          <p className="text-text-muted mt-1">Create and manage your curriculum</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowAiGenerator(true); setAiStep('prompt'); setAiPrompt(''); setAiResult(null); setAiError('') }}
            className="btn bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
          <button onClick={() => { setCourseForm({ title: '', description: '', status: 'draft', weeks: 5, welcome_email_subject: '', welcome_email_body: '', lesson_notification_subject: '', lesson_notification_body: '' }); setEditingCourseId(null); setShowCourseForm(true) }}
            className="btn btn-teal flex items-center gap-2"><Plus className="w-4 h-4" /> New Course</button>
        </div>
      </div>

      {/* ── Course Form ── */}
      {showCourseForm && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl font-semibold">{editingCourseId ? 'Edit Course' : 'New Course'}</h2>
            <button onClick={() => { setShowCourseForm(false); setEditingCourseId(null) }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Course Title</label>
              <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="e.g. Immersive Mastermind - Cohort 1" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" rows={2} placeholder="Brief course description" /></div>
            <div><label className="block text-sm font-medium mb-1">Duration (weeks)</label>
              <input type="number" value={courseForm.weeks} onChange={e => setCourseForm({ ...courseForm, weeks: parseInt(e.target.value) || 5 })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" min={1} /></div>
            <div><label className="block text-sm font-medium mb-1">Status</label>
              <select value={courseForm.status} onChange={e => setCourseForm({ ...courseForm, status: e.target.value as Course['status'] })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
          </div>
          {/* Course Welcome Email */}
          <div className="mt-5 space-y-3">
            <EmailTemplateEditor
              label="Course Welcome Email"
              description="Sent when a participant is enrolled into this course"
              subject={courseForm.welcome_email_subject}
              body={courseForm.welcome_email_body}
              onSubjectChange={val => setCourseForm({ ...courseForm, welcome_email_subject: val })}
              onBodyChange={val => setCourseForm({ ...courseForm, welcome_email_body: val })}
              defaultSubject="Welcome to {{course_name}}!"
              defaultBody={"Hi {{name}},\n\nWelcome to {{course_name}}! You now have full access to the course content.\n\nYour cohort: {{cohort_name}}\nStart date: {{start_date}}\n\nSign in at {{login_url}} to get started.\n\nWarm regards,\nNeuro Progeny Team"}
              accentColor="#1e3a5f"
            />
            <EmailTemplateEditor
              label="Daily Lesson Notification"
              description="Sent when a new lesson is released (for lessons with notifications enabled)"
              subject={courseForm.lesson_notification_subject}
              body={courseForm.lesson_notification_body}
              onSubjectChange={val => setCourseForm({ ...courseForm, lesson_notification_subject: val })}
              onBodyChange={val => setCourseForm({ ...courseForm, lesson_notification_body: val })}
              defaultSubject="New lesson available: {{lesson_title}}"
              defaultBody={"Hi {{name}},\n\nA new lesson is available in {{course_name}}:\n\n📖 {{lesson_title}}\n\nSign in at {{login_url}} to start today's lesson.\n\nKeep building capacity,\nNeuro Progeny Team"}
              accentColor="#7c3aed"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={() => { setShowCourseForm(false); setEditingCourseId(null) }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={saveCourse} disabled={!courseForm.title} className="px-6 py-2 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
              {editingCourseId ? 'Update Course' : 'Create Course'}</button>
          </div>
        </div>
      )}

      {/* ── Courses List ── */}
      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-text-muted mb-4">Create your first course to start building curriculum</p>
          <button onClick={() => setShowCourseForm(true)} className="btn btn-teal"><Plus className="w-4 h-4 mr-2" /> Create First Course</button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="card overflow-hidden">
              <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleCourse(course.id)}>
                <div className="flex items-center gap-3">
                  {expandedCourse === course.id ? <ChevronDown className="w-5 h-5 text-text-muted" /> : <ChevronRight className="w-5 h-5 text-text-muted" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{course.title}</h3>
                      {(course.settings?.tracks || []).length > 0 && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {course.settings!.tracks!.length} tracks
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted">{course.weeks} weeks • {course.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${course.status === 'published' ? 'bg-green-100 text-green-700' : course.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{course.status}</span>
                  <button onClick={() => openSettings(course)} className="p-2 hover:bg-gray-100 rounded-lg" title="Settings"><Settings className="w-4 h-4 text-text-muted" /></button>
                  <button onClick={() => duplicateCourse(course.id)} disabled={duplicating === course.id} className="p-2 hover:bg-blue-50 rounded-lg" title="Duplicate Course">
                    {duplicating === course.id ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Copy className="w-4 h-4 text-blue-500" />}
                  </button>
                  <button onClick={() => { setCourseForm({ title: course.title, description: course.description || '', status: course.status, weeks: course.weeks, welcome_email_subject: (course as any).welcome_email_subject || '', welcome_email_body: (course as any).welcome_email_body || '', lesson_notification_subject: (course as any).lesson_notification_subject || '', lesson_notification_body: (course as any).lesson_notification_body || '' }); setEditingCourseId(course.id); setShowCourseForm(true) }}
                    className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-text-muted" /></button>
                  <button onClick={() => deleteCourse(course.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>

              {/* Track Legend */}
              {expandedCourse === course.id && (course.settings?.tracks || []).length > 0 && (
                <div className="px-5 py-2 border-t border-border-light bg-gray-50 flex items-center gap-4">
                  <span className="text-xs font-medium text-gray-500">TRACKS:</span>
                  {course.settings!.tracks!.map(t => (
                    <span key={t.id} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                      <span className="text-gray-400">({t.access_mode === 'all' ? 'all' : t.access_mode === 'tag_based' ? 'tags' : t.choice_scope === 'daily' ? 'daily choice' : 'course choice'})</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Weeks */}
              {expandedCourse === course.id && (
                <div className="border-t border-border-light">
                  {(weeks[course.id] || []).map(week => (
                    <div key={week.id} className="border-b border-border-light last:border-b-0">
                      <div className="px-5 py-3 pl-12 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}>
                        <div className="flex items-center gap-2">
                          {expandedWeek === week.id ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                          <span className="text-sm font-medium text-np-teal">Week {week.week_number}:</span>
                          <span className="text-sm font-medium">{week.title}</span>
                          {week.description && <span className="text-xs text-text-muted ml-2">— {week.description}</span>}
                          {week.release_mode === 'daily' && (
                            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Daily Drip
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => startEditWeek(week)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-text-muted" /></button>
                          <button onClick={() => deleteWeek(week.id, course.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      </div>

                      {expandedWeek === week.id && (
                        <div className="pl-20 pr-5 pb-3 space-y-1">
                          {(lessons[week.id] || []).map(lesson => {
                            const track = lesson.track_id && expandedCourse ? getTrackById(lesson.track_id, expandedCourse) : null
                            return (
                              <div key={lesson.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
                                <div className="flex items-center gap-3">
                                  {track && <span className="w-2 h-6 rounded-full" style={{ backgroundColor: track.color }} title={track.name} />}
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getLessonTypeColor(lesson.lesson_type || lesson.type || '')}`}>
                                    {(lesson.lesson_type || lesson.type || '').replace('_', ' ')}</span>
                                  <span className="text-sm">{lesson.title}</span>
                                  <span className="text-xs text-text-muted">{lesson.duration_minutes}min</span>
                                  {track && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: track.color + '20', color: track.color }}>{track.name}</span>}
                                  {lesson.content && typeof lesson.content === 'object' && lesson.content.html && (
                                    <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">has content</span>
                                  )}
                                  {lesson.send_notification && (
                                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Bell className="w-2.5 h-2.5" /> notify</span>
                                  )}
                                  {lesson.release_day && lesson.release_day > 0 && (
                                    <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Day {lesson.release_day}</span>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openContentEditor(lesson)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit Content"><FileText className="w-3.5 h-3.5 text-blue-500" /></button>
                                  <button onClick={() => startEditLesson(lesson)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit Lesson"><Edit2 className="w-3.5 h-3.5 text-text-muted" /></button>
                                  <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete Lesson"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                                </div>
                              </div>
                            )
                          })}

                          {showLessonForm === week.id ? (
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mt-2">
                              <h4 className="text-sm font-semibold text-gray-700">{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input type="text" placeholder="Lesson title" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                  className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                                <select value={lessonForm.type} onChange={e => setLessonForm({ ...lessonForm, type: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
                                  <option value="video">Video</option><option value="reading">Reading</option><option value="practice">Practice</option>
                                  <option value="reflection">Reflection</option><option value="quiz">Quiz</option><option value="survey">Survey</option>
                                  <option value="assessment">Assessment</option><option value="live">Live</option>
                                </select>
                                <input type="number" placeholder="Duration (min)" value={lessonForm.duration_minutes} onChange={e => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 15 })}
                                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                                {currentCourseTracks().length > 0 ? (
                                  <select value={lessonForm.track_id} onChange={e => setLessonForm({ ...lessonForm, track_id: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
                                    <option value="">No Track (all participants)</option>
                                    {currentCourseTracks().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                ) : (
                                  <input type="text" placeholder="Description (optional)" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                                )}
                                {currentCourseTracks().length > 0 && (
                                  <input type="text" placeholder="Description (optional)" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                                    className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                                )}
                              </div>
                              {/* Notification Toggle + Release Day */}
                              <div className="flex items-center gap-4 flex-wrap">
                                <button type="button" onClick={() => setLessonForm({ ...lessonForm, send_notification: !lessonForm.send_notification })}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                                    lessonForm.send_notification
                                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 bg-white text-gray-500'
                                  }`}>
                                  {lessonForm.send_notification ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                                  {lessonForm.send_notification ? 'Notification On' : 'Notification Off'}
                                </button>
                                {week.release_mode === 'daily' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Release day:</span>
                                    <select value={lessonForm.release_day} onChange={e => setLessonForm({ ...lessonForm, release_day: parseInt(e.target.value) || 0 })}
                                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg">
                                      <option value={0}>Auto (by sort order)</option>
                                      <option value={1}>Day 1</option><option value={2}>Day 2</option><option value={3}>Day 3</option>
                                      <option value={4}>Day 4</option><option value={5}>Day 5</option><option value={6}>Day 6</option><option value={7}>Day 7</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => { setShowLessonForm(null); setEditingLessonId(null); setLessonForm({ title: '', type: 'video', duration_minutes: 15, description: '', track_id: '', send_notification: true, release_day: 0 }) }}
                                  className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                                <button onClick={() => saveLesson(week.id)} disabled={!lessonForm.title}
                                  className="text-sm px-4 py-1.5 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
                                  {editingLessonId ? 'Update Lesson' : 'Add Lesson'}</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setLessonForm({ title: '', type: 'video', duration_minutes: 15, description: '', track_id: '', send_notification: true, release_day: 0 }); setEditingLessonId(null); setShowLessonForm(week.id) }}
                              className="text-sm text-np-teal hover:underline flex items-center gap-1 py-1 px-3"><Plus className="w-3.5 h-3.5" /> Add Lesson</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="px-5 py-3 pl-12">
                    {showWeekForm === course.id ? (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">{editingWeekId ? 'Edit Week' : 'Add Week'}</h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          <input type="number" placeholder="Week #" value={weekForm.week_number} onChange={e => setWeekForm({ ...weekForm, week_number: parseInt(e.target.value) || 1 })}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" min={1} />
                          <input type="text" placeholder="Week title" value={weekForm.title} onChange={e => setWeekForm({ ...weekForm, title: e.target.value })}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                          <input type="text" placeholder="Description (optional)" value={weekForm.description} onChange={e => setWeekForm({ ...weekForm, description: e.target.value })}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                        </div>
                        {/* Release Mode */}
                        <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Lesson Release</p>
                            <p className="text-xs text-gray-500">
                              {weekForm.release_mode === 'daily'
                                ? 'Lessons unlock one per day — participants get notified as each drops'
                                : 'All lessons available when the week starts'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-0.5">
                            <button type="button" onClick={() => setWeekForm({ ...weekForm, release_mode: 'all_at_once' })}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${weekForm.release_mode === 'all_at_once' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                              All at Once
                            </button>
                            <button type="button" onClick={() => setWeekForm({ ...weekForm, release_mode: 'daily' })}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${weekForm.release_mode === 'daily' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                              Daily Drip
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowWeekForm(null); setEditingWeekId(null); setWeekForm({ title: '', description: '', week_number: 1, release_mode: 'all_at_once' }) }}
                            className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                          <button onClick={() => saveWeek(course.id)} disabled={!weekForm.title}
                            className="text-sm px-4 py-1.5 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50">
                            {editingWeekId ? 'Update Week' : 'Add Week'}</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setWeekForm({ title: '', description: '', week_number: (weeks[course.id]?.length || 0) + 1, release_mode: 'all_at_once' }); setEditingWeekId(null); setShowWeekForm(course.id) }}
                        className="text-sm text-np-teal hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Week</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
