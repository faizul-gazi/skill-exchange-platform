import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { userId } from '../lib/userId.js'

function formatMsgTime(value) {
  if (value == null) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function useChat() {
  const { isAuthenticated, user } = useAuth()
  const me = userId(user)

  const [peers, setPeers] = useState([])
  const [messagesByPeer, setMessagesByPeer] = useState({})
  const [activeId, setActiveId] = useState('')
  const [peersLoading, setPeersLoading] = useState(false)
  const [peersError, setPeersError] = useState('')
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationError, setConversationError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !me) return
    let cancelled = false
    ;(async () => {
      setPeersLoading(true)
      setPeersError('')
      try {
        const { data } = await api.get('/users')
        const list = data.data ?? []
        const mapped = list
          .map((u) => ({
            id: userId(u),
            name: u.name ?? 'User',
            subtitle: 'Member',
          }))
          .filter((p) => p.id && p.id !== me)
        if (!cancelled) {
          setPeers(mapped.slice(0, 40))
          setActiveId((prev) => {
            if (prev && mapped.some((p) => p.id === prev)) return prev
            return mapped[0]?.id ?? ''
          })
        }
      } catch (e) {
        if (!cancelled) {
          setPeersError(getApiErrorMessage(e, 'Could not load contacts.'))
          setPeers([])
        }
      } finally {
        if (!cancelled) setPeersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, me])

  useEffect(() => {
    if (!isAuthenticated || !me || !activeId) return
    let cancelled = false
    ;(async () => {
      setConversationLoading(true)
      setConversationError('')
      try {
        const { data } = await api.get(`/messages/conversation/${activeId}`)
        const rows = data.data ?? []
        const msgs = rows.map((m) => ({
          id: m.id,
          from: String(m.senderId) === String(me) ? 'me' : 'them',
          text: m.message,
          time: formatMsgTime(m.timestamp),
        }))
        if (!cancelled) {
          setMessagesByPeer((prev) => ({ ...prev, [activeId]: msgs }))
        }
      } catch (e) {
        if (!cancelled) {
          setConversationError(getApiErrorMessage(e, 'Could not load messages.'))
          setMessagesByPeer((prev) => ({ ...prev, [activeId]: [] }))
        }
      } finally {
        if (!cancelled) setConversationLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, me, activeId])

  const send = useCallback(
    async (text) => {
      if (!activeId || !me) return { ok: false, error: 'Select a conversation first.' }
      try {
        await api.post('/messages', { receiverId: activeId, message: text })
        const { data } = await api.get(`/messages/conversation/${activeId}`)
        const rows = data.data ?? []
        const msgs = rows.map((m) => ({
          id: m.id,
          from: String(m.senderId) === String(me) ? 'me' : 'them',
          text: m.message,
          time: formatMsgTime(m.timestamp),
        }))
        setMessagesByPeer((prev) => ({ ...prev, [activeId]: msgs }))
        setConversationError('')
        return { ok: true }
      } catch (e) {
        return { ok: false, error: getApiErrorMessage(e, 'Could not send message.') }
      }
    },
    [activeId, me],
  )

  const messages = useMemo(
    () => messagesByPeer[activeId] ?? [],
    [activeId, messagesByPeer],
  )

  const chatPeers = useMemo(() => (isAuthenticated ? peers : []), [isAuthenticated, peers])

  return {
    chatPeers,
    messages,
    activeId,
    setActiveId,
    send,
    peersLoading,
    peersError,
    conversationLoading: Boolean(activeId && conversationLoading),
    conversationError,
    isAuthenticated,
  }
}
