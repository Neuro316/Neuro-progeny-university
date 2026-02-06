// @ts-nocheck
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore, useEffectiveRole } from '@/lib/store'
import { getSupabase } from '@/lib/supabase/client'
import {
  MessageSquare, Send, Hash, Users, Plus, Search, Smile, Reply,
  Edit2, Trash2, X, UserPlus, ArrowLeft, Megaphone, AtSign, ChevronRight
} from 'lucide-react'

interface Channel {
  id: string; name: string; description: string | null; type: 'cohort' | 'dm' | 'general' | 'broadcast'
  cohort_id: string | null; is_archived: boolean; created_at: string
}

interface Message {
  id: string; channel_id: string; sender_id: string; content: string
  reply_to: string | null; is_edited: boolean; is_deleted: boolean; created_at: string
  sender?: { full_name: string; email: string; avatar_url: string | null }
  reactions?: Reaction[]; reply_message?: any | null
  mentions?: string[] // user IDs mentioned
}

interface Reaction { id: string; message_id: string; user_id: string; emoji: string }

interface ChannelMember {
  id: string; channel_id: string; user_id: string; role: string; last_read_at: string
  profile?: { full_name: string; email: string; avatar_url: string | null }
}

interface MentionUser { id: string; full_name: string; email: string }

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎯', '🔥', '💡', '🙏', '✅']

export default function MessagesPage() {
  const { user, session } = useAuth()
  const effectiveRole = useEffectiveRole()

  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showNewDm, setShowNewDm] = useState(false)
  const [dmSearch, setDmSearch] = useState('')
  const [dmResults, setDmResults] = useState<any[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [channelSearch, setChannelSearch] = useState('')
  const [showMobileChannels, setShowMobileChannels] = useState(true)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<ChannelMember[]>([])

  // @mention state
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionCursorPos, setMentionCursorPos] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  // ── Data fetching ──

  const fetchChannels = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase || !user) return
    const isAdmin = effectiveRole === 'admin' || effectiveRole === 'superadmin'

    try {
      let channelIds: string[] = []
      if (!isAdmin) {
        const { data: memberOf } = await supabase.from('channel_members').select('channel_id').eq('user_id', user.id)
        if (!memberOf?.length) { setChannels([]); setLoading(false); return }
        channelIds = memberOf.map(m => m.channel_id)
      }

      let query = supabase.from('channels').select('*').eq('is_archived', false).order('updated_at', { ascending: false })
      if (!isAdmin && channelIds.length) query = query.in('id', channelIds)
      const { data: channelsData } = await query
      if (!channelsData?.length) { setChannels([]); setLoading(false); return }

      // Batch DM names
      const dmChs = channelsData.filter(ch => ch.type === 'dm')
      const dmNames: Record<string, string> = {}
      if (dmChs.length) {
        const { data: dmMembers } = await supabase.from('channel_members')
          .select('channel_id, user_id, profile:profiles(full_name, email)')
          .in('channel_id', dmChs.map(ch => ch.id))
        dmMembers?.forEach(m => {
          if (m.user_id !== user.id && m.profile) {
            dmNames[m.channel_id] = m.profile.full_name || m.profile.email || 'DM'
          }
        })
      }

      const enriched = channelsData.map(ch => ({
        ...ch,
        name: ch.type === 'dm' && dmNames[ch.id] ? dmNames[ch.id] : ch.name,
      }))

      setChannels(enriched)
    } catch (err) {
      console.error('fetchChannels error:', err)
      setChannels([])
    } finally {
      setLoading(false)
    }
  }, [user, effectiveRole])

  const fetchMessages = useCallback(async (channelId: string) => {
    const supabase = getSupabase()
    if (!supabase) return

    const { data } = await supabase.from('messages')
      .select('*, sender:profiles!sender_id(full_name, email, avatar_url)')
      .eq('channel_id', channelId).order('created_at', { ascending: true }).limit(100)

    if (data?.length) {
      const msgIds = data.map(m => m.id)
      const { data: reactions } = await supabase.from('message_reactions').select('*').in('message_id', msgIds)

      const replyIds = data.filter(m => m.reply_to).map(m => m.reply_to)
      const replyMap: Record<string, any> = {}
      if (replyIds.length) {
        const { data: replies } = await supabase.from('messages')
          .select('id, content, sender:profiles!sender_id(full_name)').in('id', replyIds)
        replies?.forEach(r => { replyMap[r.id] = r })
      }

      setMessages(data.map(m => ({
        ...m,
        reactions: reactions?.filter(r => r.message_id === m.id) || [],
        reply_message: m.reply_to ? replyMap[m.reply_to] || null : null
      })))
    } else {
      setMessages([])
    }

    if (user) {
      supabase.from('channel_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', channelId).eq('user_id', user.id).then(() => {})
    }
  }, [user])

  const fetchMembers = useCallback(async (channelId: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('channel_members')
      .select('*, profile:profiles(full_name, email, avatar_url)').eq('channel_id', channelId)
    setMembers(data || [])
  }, [])

  // ── Effects ──

  useEffect(() => { if (user) fetchChannels() }, [user, fetchChannels])

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id)
      fetchMembers(activeChannel.id)
    }
  }, [activeChannel, fetchMessages, fetchMembers])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const supabase = getSupabase()
    if (!activeChannel || !supabase) return
    const sub = supabase.channel(`messages:${activeChannel.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` },
        () => fetchMessages(activeChannel.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' },
        () => fetchMessages(activeChannel.id))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [activeChannel, fetchMessages])

  // ── @Mention logic ──

  const extractMentionIds = (text: string): string[] => {
    const mentions: string[] = []
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match[2] === 'everyone') mentions.push('everyone')
      else mentions.push(match[2])
    }
    return mentions
  }

  const renderMessageContent = (content: string) => {
    // Replace @[Name](userId) with styled spans
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/)
    return parts.map((part, i) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/)
      if (mentionMatch) {
        const name = mentionMatch[1]
        const isEveryone = mentionMatch[2] === 'everyone'
        return (
          <span key={i} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${isEveryone ? 'bg-amber-100 text-amber-800' : 'bg-[#3d8b8b]/15 text-[#2d6b6b]'}`}>
            @{name}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    const cursor = e.target.selectionStart || 0
    setNewMessage(val)
    setMentionCursorPos(cursor)

    // Check if typing @mention
    const textBeforeCursor = val.slice(0, cursor)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex >= 0) {
      const afterAt = textBeforeCursor.slice(atIndex + 1)
      // Only trigger if no space before @ (or start of text) and no ] (already completed mention)
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
      if ((charBefore === ' ' || charBefore === '\n' || atIndex === 0) && !afterAt.includes(']') && !afterAt.includes(' ')) {
        setMentionQuery(afterAt.toLowerCase())
        setShowMentionDropdown(true)
        return
      }
    }
    setShowMentionDropdown(false)
  }

  const getMentionSuggestions = (): Array<{ id: string; name: string; isEveryone?: boolean }> => {
    const suggestions: Array<{ id: string; name: string; isEveryone?: boolean }> = []

    // Always show @everyone first for channel messages (not DMs)
    if (activeChannel?.type !== 'dm') {
      if ('everyone'.includes(mentionQuery)) {
        suggestions.push({ id: 'everyone', name: 'everyone', isEveryone: true })
      }
    }

    // Filter members
    members.forEach(m => {
      const name = m.profile?.full_name || m.profile?.email || ''
      if (name.toLowerCase().includes(mentionQuery) && m.user_id !== user?.id) {
        suggestions.push({ id: m.user_id, name: m.profile?.full_name || m.profile?.email || 'Unknown' })
      }
    })

    return suggestions.slice(0, 8)
  }

  const insertMention = (userId: string, displayName: string) => {
    const textBeforeCursor = newMessage.slice(0, mentionCursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    const before = newMessage.slice(0, atIndex)
    const after = newMessage.slice(mentionCursorPos)
    const mention = `@[${displayName}](${userId}) `
    const updated = before + mention + after
    setNewMessage(updated)
    setShowMentionDropdown(false)
    messageInputRef.current?.focus()
  }

  // ── Notifications for mentions ──

  const createMentionNotifications = async (messageId: string, mentionIds: string[], channelName: string, senderName: string) => {
    const supabase = getSupabase()
    if (!supabase || !user) return

    let targetUserIds: string[] = []

    if (mentionIds.includes('everyone')) {
      // Notify all channel members except sender
      targetUserIds = members.filter(m => m.user_id !== user.id).map(m => m.user_id)
    } else {
      targetUserIds = mentionIds.filter(id => id !== user.id)
    }

    if (!targetUserIds.length) return

    const notifications = targetUserIds.map(uid => ({
      user_id: uid,
      type: mentionIds.includes('everyone') ? 'mention_everyone' : 'mention',
      title: mentionIds.includes('everyone') ? `@everyone in #${channelName}` : `${senderName} mentioned you in #${channelName}`,
      body: newMessage.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').slice(0, 100),
      link: `/dashboard/messages`,
      is_read: false,
      metadata: { message_id: messageId, channel_id: activeChannel?.id }
    }))

    await supabase.from('notifications').insert(notifications).then(() => {})
  }

  // ── Actions ──

  const sendMessage = async () => {
    const supabase = getSupabase()
    if (!supabase || !user || !activeChannel || !newMessage.trim()) return
    setSendingMessage(true)

    const mentionIds = extractMentionIds(newMessage)

    const { data: inserted, error } = await supabase.from('messages').insert({
      channel_id: activeChannel.id, sender_id: user.id,
      content: newMessage.trim(), reply_to: replyTo?.id || null
    }).select('id').single()

    if (!error && inserted) {
      // Fire-and-forget: update channel timestamp and create mention notifications
      supabase.from('channels').update({ updated_at: new Date().toISOString() }).eq('id', activeChannel.id).then(() => {})
      if (mentionIds.length) {
        createMentionNotifications(inserted.id, mentionIds, activeChannel.name, user.full_name || user.email)
      }
      setNewMessage('')
      setReplyTo(null)
    }
    setSendingMessage(false)
    messageInputRef.current?.focus()
  }

  const saveEdit = async (msgId: string) => {
    const supabase = getSupabase()
    if (!supabase || !editContent.trim()) return
    await supabase.from('messages').update({ content: editContent.trim(), is_edited: true }).eq('id', msgId)
    setEditingMessage(null); setEditContent('')
    if (activeChannel) fetchMessages(activeChannel.id)
  }

  const deleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message?')) return
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('messages').update({ is_deleted: true }).eq('id', msgId)
    if (activeChannel) fetchMessages(activeChannel.id)
  }

  const toggleReaction = async (msgId: string, emoji: string) => {
    const supabase = getSupabase()
    if (!supabase || !user) return
    const existing = messages.find(m => m.id === msgId)?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji)
    if (existing) await supabase.from('message_reactions').delete().eq('id', existing.id)
    else await supabase.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji })
    setShowEmojiPicker(null)
    if (activeChannel) fetchMessages(activeChannel.id)
  }

  const createDm = async (otherUserId: string, otherName: string) => {
    const supabase = getSupabase()
    if (!supabase || !user) return

    try {
      // Check for existing DM between these two users
      // Query: get all DM channels where BOTH users are members
      const { data: myChannels } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id)

      if (myChannels?.length) {
        const myChIds = myChannels.map(m => m.channel_id)

        // Find which of my channels are DMs
        const { data: dmChs } = await supabase
          .from('channels')
          .select('id')
          .in('id', myChIds)
          .eq('type', 'dm')

        if (dmChs?.length) {
          const dmIds = dmChs.map(c => c.id)

          // Check if the other user is in any of these DM channels
          const { data: otherMems } = await supabase
            .from('channel_members')
            .select('channel_id')
            .eq('user_id', otherUserId)
            .in('channel_id', dmIds)

          if (otherMems?.length) {
            // Existing DM found - open it
            const existingId = otherMems[0].channel_id
            const existingCh = channels.find(c => c.id === existingId)
            setActiveChannel(existingCh || { id: existingId, name: otherName, type: 'dm', description: null, cohort_id: null, is_archived: false, created_at: '' } as Channel)
            setShowNewDm(false); setDmSearch(''); setDmResults([]); setShowMobileChannels(false)
            return
          }
        }
      }

      // No existing DM - create new one
      const { data: newCh, error: chError } = await supabase.from('channels')
        .insert({ name: 'DM', type: 'dm', created_by: user.id }).select().single()

      if (chError) {
        console.error('Failed to create DM channel:', chError)
        alert('Failed to create conversation: ' + chError.message)
        return
      }

      if (newCh) {
        // Add both users as members
        const { error: memError } = await supabase.from('channel_members').insert([
          { channel_id: newCh.id, user_id: user.id },
          { channel_id: newCh.id, user_id: otherUserId }
        ])

        if (memError) {
          console.error('Failed to add DM members:', memError)
          alert('Created channel but failed to add members: ' + memError.message)
          return
        }

        setActiveChannel({ ...newCh, name: otherName })
        setShowNewDm(false); setDmSearch(''); setDmResults([]); setShowMobileChannels(false)
        fetchChannels()
      }
    } catch (err) {
      console.error('createDm error:', err)
      alert('Something went wrong creating the conversation')
    }
  }

  const searchUsers = async (query: string) => {
    setDmSearch(query)
    if (query.length < 2) { setDmResults([]); return }
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('id, full_name, email')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`).neq('id', user?.id).limit(10)
    setDmResults(data || [])
  }

  const createChannel = async () => {
    const name = prompt('Channel name:')
    if (!name) return
    const supabase = getSupabase()
    if (!supabase || !user) return

    const { data, error: chError } = await supabase.from('channels')
      .insert({ name, type: 'general', created_by: user.id }).select().single()

    if (chError) {
      console.error('Failed to create channel:', chError)
      alert('Failed to create channel: ' + chError.message)
      return
    }

    if (data) {
      const { error: memError } = await supabase.from('channel_members')
        .insert({ channel_id: data.id, user_id: user.id, role: 'moderator' })

      if (memError) console.error('Failed to add as member:', memError)

      fetchChannels()
      selectChannel(data)
    }
  }

  const createBroadcastChannel = async () => {
    const supabase = getSupabase()
    if (!supabase || !user) return

    // Check if broadcast already exists
    const existing = channels.find(ch => ch.type === 'broadcast')
    if (existing) { selectChannel(existing); return }

    const { data: newCh, error: chError } = await supabase.from('channels')
      .insert({ name: 'All Participants', type: 'broadcast', created_by: user.id, description: 'Announcements to all participants' }).select().single()

    if (chError) {
      console.error('Failed to create broadcast channel:', chError)
      alert('Failed to create broadcast channel: ' + chError.message)
      return
    }

    if (newCh) {
      // Add all users as members
      const { data: allUsers } = await supabase.from('profiles').select('id')
      if (allUsers?.length) {
        const memberInserts = allUsers.map(u => ({
          channel_id: newCh.id, user_id: u.id, role: u.id === user.id ? 'moderator' : 'member'
        }))
        const { error: memError } = await supabase.from('channel_members').insert(memberInserts)
        if (memError) console.error('Failed to add broadcast members:', memError)
      }
      await fetchChannels()
      selectChannel({ ...newCh, name: 'All Participants' })
    }
  }

  // ── Helpers ──

  const selectChannel = (ch: Channel) => { setActiveChannel(ch); setShowMobileChannels(false); setShowMembers(false) }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const groupedReactions = (reactions: Reaction[]) => {
    const g: Record<string, { emoji: string; count: number; userIds: string[] }> = {}
    reactions.forEach(r => {
      if (!g[r.emoji]) g[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] }
      g[r.emoji].count++; g[r.emoji].userIds.push(r.user_id)
    })
    return Object.values(g)
  }

  const filtered = channels.filter(ch => ch.name.toLowerCase().includes(channelSearch.toLowerCase()))
  const broadcastChannels = filtered.filter(ch => ch.type === 'broadcast')
  const cohortChannels = filtered.filter(ch => ch.type === 'cohort' || ch.type === 'general')
  const dmChannelsList = filtered.filter(ch => ch.type === 'dm')
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'superadmin' || effectiveRole === 'facilitator'
  const mentionSuggestions = showMentionDropdown ? getMentionSuggestions() : []

  if (loading) return <div className="p-8 text-center text-text-muted">Loading messages...</div>

  // ── Render ──

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-white rounded-xl overflow-hidden border border-gray-200">
      {/* Channel Sidebar */}
      <div className={`${showMobileChannels ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-gray-200 bg-gray-50 flex-shrink-0`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-[#1e3a5f]">Messages</h2>
            <div className="flex gap-1">
              {isAdmin && (
                <>
                  <button onClick={createBroadcastChannel} className="p-2 hover:bg-gray-200 rounded-lg" title="All Participants"><Megaphone className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={createChannel} className="p-2 hover:bg-gray-200 rounded-lg" title="New Channel"><Plus className="w-4 h-4 text-gray-600" /></button>
                </>
              )}
              <button onClick={() => setShowNewDm(true)} className="p-2 hover:bg-gray-200 rounded-lg" title="New DM"><UserPlus className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search channels..." value={channelSearch} onChange={e => setChannelSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d8b8b]" />
          </div>
        </div>

        {showNewDm && (
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">New Direct Message</span>
              <button onClick={() => { setShowNewDm(false); setDmSearch(''); setDmResults([]) }} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <input type="text" placeholder="Search by name or email..." value={dmSearch} onChange={e => searchUsers(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d8b8b]" autoFocus />
            {dmResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                {dmResults.map(u => {
                  const displayName = u.full_name || u.email?.split('@')[0] || 'Unknown User'
                  return (
                    <div
                      key={u.id}
                      onClick={() => createDm(u.id, displayName)}
                      className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-[#3d8b8b] hover:text-white rounded-lg cursor-pointer transition-all duration-150 active:scale-[0.98] border-b border-gray-50 last:border-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#3d8b8b] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {getInitials(displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{displayName}</div>
                        <div className="text-xs opacity-60 truncate">{u.email}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </div>
                  )
                })}
              </div>
            )}
            {dmSearch.length >= 2 && dmResults.length === 0 && (
              <p className="mt-2 text-xs text-gray-400 text-center py-2">No users found</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Broadcast channels */}
          {broadcastChannels.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Announcements</div>
              {broadcastChannels.map(ch => (
                <button key={ch.id} onClick={() => selectChannel(ch)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 ${activeChannel?.id === ch.id ? 'bg-amber-50 text-amber-800' : 'hover:bg-gray-100 text-gray-700'}`}>
                  <Megaphone className={`w-4 h-4 flex-shrink-0 ${activeChannel?.id === ch.id ? 'text-amber-600' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{ch.name}</div></div>
                </button>
              ))}
            </div>
          )}

          {cohortChannels.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Channels</div>
              {cohortChannels.map(ch => (
                <button key={ch.id} onClick={() => selectChannel(ch)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 ${activeChannel?.id === ch.id ? 'bg-[#3d8b8b]/10 text-[#2d7a7a]' : 'hover:bg-gray-100 text-gray-700'}`}>
                  <Hash className={`w-4 h-4 flex-shrink-0 ${activeChannel?.id === ch.id ? 'text-[#3d8b8b]' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{ch.name}</div></div>
                </button>
              ))}
            </div>
          )}

          {dmChannelsList.length > 0 && (
            <div className="p-3 pt-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Direct Messages</div>
              {dmChannelsList.map(ch => (
                <button key={ch.id} onClick={() => selectChannel(ch)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 ${activeChannel?.id === ch.id ? 'bg-[#3d8b8b]/10 text-[#2d7a7a]' : 'hover:bg-gray-100 text-gray-700'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${activeChannel?.id === ch.id ? 'bg-[#3d8b8b] text-white' : 'bg-gray-200 text-gray-600'}`}>{getInitials(ch.name)}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{ch.name}</div></div>
                </button>
              ))}
            </div>
          )}

          {channels.length === 0 && (
            <div className="p-6 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No channels yet</p>
              <p className="text-xs text-gray-400 mt-1">Channels are created with cohorts, or start a DM.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className={`${!showMobileChannels ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}>
        {activeChannel ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobileChannels(true)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
                {activeChannel.type === 'broadcast'
                  ? <Megaphone className="w-5 h-5 text-amber-600" />
                  : activeChannel.type === 'dm'
                    ? <div className="w-8 h-8 rounded-full bg-[#3d8b8b] text-white flex items-center justify-center text-sm font-medium">{getInitials(activeChannel.name)}</div>
                    : <Hash className="w-5 h-5 text-[#3d8b8b]" />}
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{activeChannel.name}</h3>
                  {activeChannel.description && <p className="text-xs text-gray-500">{activeChannel.description}</p>}
                </div>
              </div>
              <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-lg transition-colors ${showMembers ? 'bg-[#3d8b8b]/10 text-[#3d8b8b]' : 'hover:bg-gray-100 text-gray-500'}`}>
                <Users className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0">
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                  {messages.filter(m => !m.is_deleted).map((msg, idx) => {
                    const visibleMsgs = messages.filter(m => !m.is_deleted)
                    const prev = visibleMsgs[idx - 1]
                    const compact = prev && prev.sender_id === msg.sender_id && Math.abs(new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 60000
                    const isOwn = msg.sender_id === user?.id
                    const name = msg.sender?.full_name || msg.sender?.email || 'Unknown'
                    const rGroups = groupedReactions(msg.reactions || [])

                    return (
                      <div key={msg.id} className={`group ${compact ? '' : 'mt-4'}`}>
                        {msg.reply_message && (
                          <div className="flex items-center gap-2 ml-12 mb-1 text-xs text-gray-400">
                            <Reply className="w-3 h-3 rotate-180" />
                            <span className="font-medium">{msg.reply_message.sender?.full_name || 'Someone'}</span>
                            <span className="truncate max-w-[200px]">{msg.reply_message.content}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-3 px-2 py-0.5 -mx-2 rounded-lg hover:bg-gray-50 relative">
                          {!compact
                            ? <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">{getInitials(name)}</div>
                            : <div className="w-8 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            {!compact && (
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-gray-900">{name}</span>
                                <span className="text-[11px] text-gray-400">{formatTime(msg.created_at)}</span>
                              </div>
                            )}
                            {editingMessage === msg.id ? (
                              <div className="space-y-2">
                                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d8b8b] resize-none" rows={2} autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id) }; if (e.key === 'Escape') setEditingMessage(null) }} />
                                <div className="flex gap-2 text-xs"><button onClick={() => saveEdit(msg.id)} className="text-[#3d8b8b] font-medium">Save</button><button onClick={() => setEditingMessage(null)} className="text-gray-500">Cancel</button></div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                {renderMessageContent(msg.content)}
                                {msg.is_edited && <span className="text-[10px] text-gray-400 ml-1">(edited)</span>}
                              </p>
                            )}
                            {rGroups.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rGroups.map(r => (
                                  <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${r.userIds.includes(user?.id || '') ? 'bg-[#3d8b8b]/10 border-[#3d8b8b]/30 text-[#2d7a7a]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                    <span>{r.emoji}</span><span className="font-medium">{r.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Hover actions */}
                          <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-0.5 bg-white shadow-sm border border-gray-200 rounded-lg p-0.5 -mt-2 mr-2">
                            {QUICK_EMOJIS.slice(0, 3).map(emoji => (
                              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="p-1 hover:bg-gray-100 rounded text-sm">{emoji}</button>
                            ))}
                            <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 hover:bg-gray-100 rounded"><Smile className="w-3.5 h-3.5 text-gray-400" /></button>
                            <button onClick={() => { setReplyTo(msg); messageInputRef.current?.focus() }} className="p-1 hover:bg-gray-100 rounded"><Reply className="w-3.5 h-3.5 text-gray-400" /></button>
                            {isOwn && <>
                              <button onClick={() => { setEditingMessage(msg.id); setEditContent(msg.content) }} className="p-1 hover:bg-gray-100 rounded"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                              <button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                            </>}
                          </div>
                          {showEmojiPicker === msg.id && (
                            <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-200 rounded-lg p-2 z-10 flex gap-1 flex-wrap w-48">
                              {QUICK_EMOJIS.map(emoji => (<button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="p-1.5 hover:bg-gray-100 rounded text-lg">{emoji}</button>))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                  {messages.filter(m => !m.is_deleted).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="text-sm text-gray-500">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Be the first to say something!</p>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0 relative">
                  {replyTo && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 rounded-lg text-xs">
                      <Reply className="w-3 h-3 text-gray-400 rotate-180" /><span className="text-gray-500">Replying to</span>
                      <span className="font-medium text-gray-700">{replyTo.sender?.full_name || 'someone'}</span>
                      <span className="text-gray-400 truncate flex-1">{replyTo.content.slice(0, 50)}</span>
                      <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-gray-200 rounded"><X className="w-3 h-3 text-gray-400" /></button>
                    </div>
                  )}

                  {/* @mention dropdown */}
                  {showMentionDropdown && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-4 right-4 mb-1 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto">
                      {mentionSuggestions.map(s => (
                        <button key={s.id} onClick={() => insertMention(s.id, s.name)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left transition-colors">
                          {s.isEveryone ? (
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">{getInitials(s.name)}</div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">@{s.name}</span>
                            {s.isEveryone && <span className="text-xs text-gray-400 ml-2">Notify all members</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <textarea ref={messageInputRef} value={newMessage}
                      onChange={handleMessageInput}
                      onKeyDown={e => {
                        if (showMentionDropdown && mentionSuggestions.length > 0 && e.key === 'Tab') {
                          e.preventDefault()
                          insertMention(mentionSuggestions[0].id, mentionSuggestions[0].name)
                          return
                        }
                        if (e.key === 'Escape' && showMentionDropdown) {
                          setShowMentionDropdown(false)
                          return
                        }
                        if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) { e.preventDefault(); sendMessage() }
                      }}
                      placeholder={`Message ${activeChannel.type === 'dm' ? activeChannel.name : '#' + activeChannel.name}... (type @ to mention)`}
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#3d8b8b] resize-none max-h-32" rows={1} />
                    <button onClick={sendMessage} disabled={!newMessage.trim() || sendingMessage}
                      className="p-2.5 bg-[#3d8b8b] text-white rounded-xl hover:bg-[#2d7a7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Members panel */}
              {showMembers && (
                <div className="w-60 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0 hidden md:block">
                  <div className="p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Members — {members.length}</h4>
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">{getInitials(m.profile?.full_name || m.profile?.email || '?')}</div>
                          <div className="min-w-0"><div className="text-sm font-medium text-gray-800 truncate">{m.profile?.full_name || 'Unnamed'}</div>
                            {m.role === 'moderator' && <span className="text-[10px] text-[#3d8b8b] font-medium">Moderator</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-400">Choose a channel or start a new direct message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
