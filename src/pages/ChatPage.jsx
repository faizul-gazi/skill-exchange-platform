import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { ChatLayoutSkeleton, ChatMessageThreadSkeleton } from '../components/ui/Skeleton.jsx'
import { useChat } from '../hooks/useChat.js'
import { useToast } from '../context/useToast.js'
import { cn } from '../lib/cn.js'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ChatPage() {
  const toast = useToast()
  const {
    chatPeers,
    messages,
    activeId,
    setActiveId,
    send,
    peersLoading,
    peersError,
    conversationLoading,
    conversationError,
  } = useChat()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const activeUser = useMemo(() => chatPeers.find((u) => u.id === activeId), [activeId, chatPeers])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, messages.length])

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    const result = await send(text)
    setSending(false)
    if (result?.ok) {
      setDraft('')
    } else if (result?.error) {
      toast.error(result.error)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (peersLoading && chatPeers.length === 0 && !peersError) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col space-y-6">
        <PageHeader
          eyebrow="Messages"
          title="Chat"
          description="Pick a contact and keep the conversation going."
        />
        <ChatLayoutSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col space-y-6">
      <PageHeader
        eyebrow="Messages"
        title="Chat"
        description="Pick a contact and keep the conversation going."
      >
        {peersError ? (
          <AlertMessage variant="error" className="mt-2 max-w-2xl">
            {peersError}
          </AlertMessage>
        ) : null}
      </PageHeader>

      <div
        className={cn(
          'motion-safe:animate-fade-in flex min-h-[min(640px,calc(100vh-11rem))] max-h-[min(640px,calc(100vh-11rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-soft-lg ring-1 ring-slate-200/40 sm:flex-row',
          'dark:border-white/10 dark:bg-slate-900 dark:ring-white/[0.06]',
        )}
      >
        <aside
          className="flex max-h-44 w-full shrink-0 flex-col border-b border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-[#eef0f3] dark:border-white/10 dark:from-slate-950/95 dark:to-slate-950/90 sm:max-h-none sm:w-72 sm:border-b-0 sm:border-r"
          aria-label="Conversations"
        >
          <div className="border-b border-slate-200/90 px-3 py-3 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Chats
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto p-2" role="list">
            {chatPeers.length === 0 && !peersLoading && !peersError ? (
              <li className="list-none">
                <EmptyState
                  size="compact"
                  className="border-slate-200/70 bg-white/50 py-6 dark:border-white/10 dark:bg-slate-900/30"
                  icon={<ChatUsersIcon />}
                  title="No contacts yet"
                  description="When other members join, they will appear here so you can start a chat."
                  action={
                    <Button to="/matches" variant="secondary" size="sm" className="text-xs">
                      Discover matches
                    </Button>
                  }
                />
              </li>
            ) : null}
            {chatPeers.length > 0 ? (
              chatPeers.map((u) => {
                const active = u.id === activeId
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(u.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all duration-200 ease-out',
                        active
                          ? 'scale-[1.02] bg-white shadow-md dark:bg-slate-800'
                          : 'hover:scale-[1.01] hover:bg-white/70 active:scale-[0.99] dark:hover:bg-white/5',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
                          active
                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600'
                            : 'bg-gradient-to-br from-slate-400 to-slate-500',
                        )}
                        aria-hidden
                      >
                        {initials(u.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-500">{u.subtitle}</p>
                      </div>
                    </button>
                  </li>
                )
              })
            ) : null}
          </ul>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#e5e5e5] dark:bg-slate-900/80">
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-300/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900">
            {activeUser ? (
              <>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white"
                  aria-hidden
                >
                  {initials(activeUser.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">{activeUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeUser.subtitle}</p>
                </div>
              </>
            ) : null}
          </div>

          {conversationError ? (
            <div className="px-3 pt-2 sm:px-4">
              <AlertMessage variant="error" className="text-xs sm:text-sm">
                {conversationError}
              </AlertMessage>
            </div>
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {chatPeers.length === 0 && !peersLoading && peersError ? (
              <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
                <EmptyState
                  className="max-w-md border-rose-200/60 bg-rose-50/50 py-12 dark:border-rose-500/25 dark:bg-rose-950/30"
                  icon={<ChatAlertIcon />}
                  title="Could not load contacts"
                  description={peersError}
                  action={
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  }
                />
              </div>
            ) : chatPeers.length === 0 && !peersLoading && !peersError ? (
              <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
                <EmptyState
                  className="max-w-md border-slate-300/70 bg-white/85 py-14 shadow-sm dark:border-white/10 dark:bg-slate-800/60"
                  icon={<ChatBubbleIcon />}
                  title="No conversations yet"
                  description="There are no other members to message right now. Find people to connect with from Matches, then open Chat to talk."
                  action={
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Button to="/matches" variant="primary" size="md">
                        Browse matches
                      </Button>
                      <Link
                        to="/requests"
                        className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
                      >
                        View requests
                      </Link>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="relative flex-1 overflow-y-auto px-3 py-4 sm:px-4">
                {conversationLoading && activeId ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 overflow-y-auto bg-[#e5e5e5]/65 px-2 py-4 backdrop-blur-[1px] dark:bg-slate-900/50"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <ChatMessageThreadSkeleton />
                  </div>
                ) : null}
                <div className="mx-auto flex max-w-3xl flex-col gap-2">
                  {!conversationLoading && activeId && messages.length === 0 ? (
                    <EmptyState
                      className="mt-4 border-slate-300/60 bg-white/60 py-12 dark:border-white/10 dark:bg-slate-800/40"
                      icon={<ChatBubbleIcon />}
                      title="No messages yet"
                      description={`Say hi to ${activeUser?.name ?? 'this person'} to start the conversation.`}
                    />
                  ) : null}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'motion-safe:animate-fade-in flex w-full',
                        m.from === 'me' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-[18px] px-3 py-2 text-[15px] leading-snug shadow-sm transition duration-300 ease-out hover:shadow-md sm:max-w-[75%]',
                          m.from === 'me'
                            ? 'rounded-br-[4px] bg-gradient-to-br from-[#0084ff] to-[#006edc] text-white'
                            : 'rounded-bl-[4px] border border-slate-200/80 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-700 dark:text-white',
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p
                          className={cn(
                            'mt-1 text-[11px]',
                            m.from === 'me' ? 'text-white/70' : 'text-slate-400 dark:text-slate-400',
                          )}
                        >
                          {m.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} aria-hidden />
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-300/80 bg-white/95 px-3 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95">
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Message
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={activeId ? 'Write a message…' : 'Select a chat'}
                disabled={!activeId || sending}
                className={cn(
                  'max-h-32 min-h-[44px] flex-1 resize-y rounded-2xl border border-slate-200/90 bg-slate-100 px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-500',
                  'shadow-inner transition-[box-shadow,transform] duration-200 focus:border-indigo-300/80 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                  !activeId && 'cursor-not-allowed opacity-60',
                )}
              />
              <Button
                type="button"
                variant="primary"
                size="md"
                className="h-11 shrink-0 rounded-2xl px-5"
                loading={sending}
                disabled={!draft.trim() || !activeId}
                onClick={sendMessage}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatUsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function ChatAlertIcon() {
  return (
    <svg className="h-7 w-7 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function ChatBubbleIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}
