import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'

function formatSchedule(value) {
  if (!value) return 'Not scheduled'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Not scheduled'
  return d.toLocaleString()
}

function toInputDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

export default function SessionPage() {
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('request') ?? ''
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [request, setRequest] = useState(null)
  const [tab, setTab] = useState('info')
  const [meetingLink, setMeetingLink] = useState('')
  const [schedule, setSchedule] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [messages, setMessages] = useState([])
  const [messageDraft, setMessageDraft] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [confirmingComplete, setConfirmingComplete] = useState(false)

  const myId = user?.id ?? user?._id ?? ''
  const peerId = useMemo(() => {
    if (!request || !myId) return ''
    return String(request.senderId) === String(myId) ? String(request.receiverId) : String(request.senderId)
  }, [myId, request])

  const peerName = useMemo(() => {
    if (!request || !myId) return 'User'
    return String(request.senderId) === String(myId) ? request.receiver?.name ?? 'User' : request.sender?.name ?? 'User'
  }, [myId, request])

  useEffect(() => {
    if (!requestId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/requests', { params: { type: 'all' } })
        const all = data?.data ?? []
        const row = all.find((r) => String(r.id) === String(requestId))
        if (!row) throw new Error('Session request not found')
        if (row.status !== 'accepted' && row.status !== 'completed') {
          throw new Error('Session is only available for active or completed exchanges')
        }
        if (!cancelled) {
          setRequest(row)
          setMeetingLink('')
          setSchedule(toInputDateTime(row.schedule))
        }
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, 'Could not load session.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [requestId])

  useEffect(() => {
    if (!peerId) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get(`/messages/conversation/${peerId}`)
        if (!cancelled) setMessages(data?.data ?? [])
      } catch {
        if (!cancelled) setMessages([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peerId])

  const isExchangeComplete = request?.status === 'completed'
  const canEditSession = request?.status === 'accepted'
  const completionConfirmedBy = Array.isArray(request?.completionConfirmedBy) ? request.completionConfirmedBy : []
  const senderConfirmed = request ? completionConfirmedBy.includes(String(request.senderId)) : false
  const receiverConfirmed = request ? completionConfirmedBy.includes(String(request.receiverId)) : false
  const iConfirmed = request && myId ? completionConfirmedBy.includes(String(myId)) : false

  const confirmMyCompletion = async () => {
    if (!request?.id || request.status !== 'accepted') return
    setConfirmingComplete(true)
    try {
      const { data } = await api.post(`/requests/${request.id}/confirm-completion`)
      const next = data?.data
      if (next) setRequest(next)
      toast.success(data?.message ?? 'Confirmation saved')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not record your confirmation.'))
    } finally {
      setConfirmingComplete(false)
    }
  }

  const saveSession = async () => {
    if (!request?.id) return
    const link = meetingLink.trim()
    if (!link && !schedule) return
    setSavingSession(true)
    try {
      const { data } = await api.patch(`/requests/${request.id}/session`, {
        ...(link ? { meetingLink: link } : {}),
        ...(schedule ? { schedule: new Date(schedule).toISOString() } : {}),
      })
      const next = data?.data ?? request
      setRequest(next)
      setSchedule(toInputDateTime(next.schedule))
      setMeetingLink('')
      toast.success('Session details updated')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not save session details.'))
    } finally {
      setSavingSession(false)
    }
  }

  const sendMessage = async () => {
    if (isExchangeComplete) {
      toast.error('This exchange is completed; chat is read-only.')
      return
    }
    const text = messageDraft.trim()
    if (!peerId || !text) return
    setSendingMessage(true)
    try {
      await api.post('/messages', { receiverId: peerId, message: text })
      const { data } = await api.get(`/messages/conversation/${peerId}`)
      setMessages(data?.data ?? [])
      setMessageDraft('')
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not send message.'))
    } finally {
      setSendingMessage(false)
    }
  }

  if (!requestId) {
    return (
      <EmptyState title="Session not selected" description="Open this page from an accepted or completed exchange." />
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-slate-900/40">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Session Room</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Session with {peerName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['info', 'chat', 'meeting'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {key === 'info' ? 'Session Info' : key === 'chat' ? 'Chat' : 'Meeting'}
            </button>
          ))}
          <Link to="/dashboard" className="ml-auto text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
            Back to Dashboard
          </Link>
        </div>
      </header>

      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading session...</p> : null}
      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      {!loading && !error && request ? (
        <Card variant="elevated">
          <Card.Body className="space-y-4 p-5">
            {tab === 'info' ? (
              <>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Status:</span> {request.status}
                </p>
                {isExchangeComplete ? (
                  <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                    This exchange is finished. Both of you confirmed completion. Meeting details stay visible for
                    reference; chat is read-only.
                  </p>
                ) : null}
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Schedule:</span> {formatSchedule(request.schedule)}
                </p>
                <p className="break-all text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Meeting:</span> {request.meetingLink?.trim() || 'Not added'}
                </p>
                {request.meetingLink?.trim() ? (
                  <Button onClick={() => window.open(request.meetingLink, '_blank', 'noopener,noreferrer')} size="sm">
                    {isExchangeComplete ? 'Open meeting link' : 'Join Session'}
                  </Button>
                ) : null}
                {canEditSession ? (
                  <div className="space-y-3 rounded-xl border border-indigo-200/70 bg-indigo-50/50 p-4 dark:border-indigo-500/25 dark:bg-indigo-950/20">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">End exchange (both confirm)</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      When you are done exchanging skills, each person must confirm below. The exchange closes only after
                      both confirmations.
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <li>
                        {senderConfirmed ? '✓' : '○'} Sender confirmed: {senderConfirmed ? 'Yes' : 'Waiting'}
                      </li>
                      <li>
                        {receiverConfirmed ? '✓' : '○'} Receiver confirmed: {receiverConfirmed ? 'Yes' : 'Waiting'}
                      </li>
                    </ul>
                    {iConfirmed ? (
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">You have confirmed.</p>
                    ) : (
                      <Button size="sm" variant="outline" loading={confirmingComplete} onClick={confirmMyCompletion}>
                        I confirm we have finished this exchange
                      </Button>
                    )}
                  </div>
                ) : null}
              </>
            ) : null}

            {tab === 'meeting' ? (
              <>
                {!canEditSession ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Session details can no longer be edited for this exchange.
                  </p>
                ) : null}
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Meeting Link</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  disabled={!canEditSession}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
                />
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Schedule</label>
                <input
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  disabled={!canEditSession}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
                />
                <Button size="sm" loading={savingSession} disabled={!canEditSession} onClick={saveSession}>
                  Save Session Details
                </Button>
              </>
            ) : null}

            {tab === 'chat' ? (
              <>
                {isExchangeComplete ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Read-only — this exchange is completed.</p>
                ) : null}
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          String(m.senderId) === String(myId)
                            ? 'ml-auto bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {m.message}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={isExchangeComplete ? 'Chat closed' : 'Write message'}
                    disabled={isExchangeComplete}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <Button
                    size="sm"
                    loading={sendingMessage}
                    disabled={!peerId || isExchangeComplete}
                    onClick={sendMessage}
                  >
                    Send
                  </Button>
                </div>
              </>
            ) : null}
          </Card.Body>
        </Card>
      ) : null}
    </div>
  )
}
