// @ts-nocheck
'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

interface Message {
  id: string
  channel_id: string
  user_id: string | null
  message_type: string
  content: string
  metadata: Record<string, unknown> | null
  reply_to_id: string | null
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface MessageWithUser extends Message {
  user: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'> | null
  reactions: Array<{
    emoji: string
    count: number
    reacted: boolean
  }>
}

interface UseMessagesOptions {
  channelId: string
  limit?: number
}

export function useMessages({ channelId, limit = 50 }: UseMessagesOptions) {
  const [messages, setMessages] = useState<MessageWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = getSupabase()

  const fetchMessages = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles!user_id (
            id,
            full_name,
            avatar_url,
            role
          ),
          reactions:message_reactions (
            emoji,
            user_id
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error

      const processed = (data || []).map((msg: Record<string, unknown>) => {
        const reactionCounts: Record<string, { count: number; reacted: boolean }> = {}
        
        const reactions = msg.reactions as Array<{ emoji: string; user_id: string }> | undefined
        reactions?.forEach((r) => {
          if (!reactionCounts[r.emoji]) {
            reactionCounts[r.emoji] = { count: 0, reacted: false }
          }
          reactionCounts[r.emoji].count++
        })

        return {
          ...msg,
          reactions: Object.entries(reactionCounts).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted,
          })),
        }
      })

      setMessages(processed as MessageWithUser[])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [channelId, limit, supabase])

  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'reflection' | 'announcement' = 'text') => {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
        message_type: messageType,
      } as any)

    if (error) throw error
  }, [channelId, supabase])

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!supabase) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      } as any)

    if (error) console.error('Failed to add reaction:', error)
  }, [supabase])

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!supabase) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)

    if (error) console.error('Failed to remove reaction:', error)
  }, [supabase])

  useEffect(() => {
    if (!supabase) return

    fetchMessages()

    const channel: RealtimeChannel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message
          if (!newMessage || !newMessage.id) return
          
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              user:profiles!user_id (
                id,
                full_name,
                avatar_url,
                role
              )
            `)
            .eq('id', newMessage.id)
            .single()

          if (data) {
            const messageData = data as any
            setMessages(prev => [...prev, { ...messageData, reactions: [] } as MessageWithUser])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message
          if (!newMessage || !newMessage.id) return
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, ...(newMessage as any) }
                : msg
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, fetchMessages, supabase])

  return {
    messages,
    loading,
    error,
    sendMessage,
    addReaction,
    removeReaction,
    refetch: fetchMessages,
  }
}
