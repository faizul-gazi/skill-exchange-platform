import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { RequestsPageSkeleton } from '../components/ui/Skeleton.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatShortDate } from '../lib/formatDate.js'
import { cn } from '../lib/cn.js'

const STATUS = {
  pending: {
    label: 'Pending',
    className:
      'border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-100',
  },
  accepted: {
    label: 'Accepted',
    className:
      'border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-100',
  },
  rejected: {
    label: 'Rejected',
    className:
      'border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-100',
  },
}

function StatusBadge({ status }) {
  const cfg = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  )
}

function mapIncoming(rows) {
  return rows.map((r) => ({
    id: r.id,
    fromName: r.sender?.name ?? 'User',
    topic: r.meetingLink?.trim() ? r.meetingLink : 'Skill exchange',
    status: r.status,
    when: formatShortDate(r.createdAt),
  }))
}

function mapOutgoing(rows) {
  return rows.map((r) => ({
    id: r.id,
    toName: r.receiver?.name ?? 'User',
    topic: r.meetingLink?.trim() ? r.meetingLink : 'Skill exchange',
    status: r.status,
    when: formatShortDate(r.createdAt),
  }))
}

export default function RequestsPage() {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState('')

  const loading = isAuthenticated && fetching

  const loadRequests = useCallback(async () => {
    setFetching(true)
    setError('')
    try {
      const [inc, out] = await Promise.all([
        api.get('/requests', { params: { type: 'incoming' } }),
        api.get('/requests', { params: { type: 'outgoing' } }),
      ])
      setIncoming(mapIncoming(inc.data?.data ?? []))
      setOutgoing(mapOutgoing(out.data?.data ?? []))
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load requests.'))
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const t = window.setTimeout(() => {
      loadRequests()
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAuthenticated, loadRequests])

  const acceptIncomingRequest = useCallback(
    async (id) => {
      setBusyKey(`${id}:accept`)
      try {
        await api.post(`/requests/${id}/accept`)
        await loadRequests()
        toast.success('Request accepted. You can coordinate in chat.')
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'Could not accept this request.'))
      } finally {
        setBusyKey('')
      }
    },
    [loadRequests, toast],
  )

  const rejectIncomingRequest = useCallback(
    async (id) => {
      setBusyKey(`${id}:reject`)
      try {
        await api.post(`/requests/${id}/reject`)
        await loadRequests()
        toast.info('Request declined.')
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'Could not decline this request.'))
      } finally {
        setBusyKey('')
      }
    },
    [loadRequests, toast],
  )

  if (!isAuthenticated) {
    return (
      <div className="space-y-8 md:space-y-10">
        <PageHeader
          eyebrow="Activity"
          title="Requests"
          description="Sign in to view and manage skill exchange requests from the API."
        />
        <EmptyState
          className="border-slate-200/90 py-16 dark:border-white/10"
          icon={<InboxIcon />}
          title="Sign in required"
          description="Incoming and outgoing requests are loaded from your account after authentication."
          action={
            <Button to="/login" variant="primary" size="md">
              Sign in
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow="Activity"
        title="Requests"
        description="Incoming requests need your response. Outgoing shows what you've sent to others."
      >
        {error ? (
          <AlertMessage variant="error" className="mt-2 max-w-2xl">
            {error}
          </AlertMessage>
        ) : null}
      </PageHeader>

      {loading ? <RequestsPageSkeleton /> : null}

      {!loading ? (
        <>
          <section aria-labelledby="incoming-heading">
            <h2 id="incoming-heading" className="sr-only">
              Incoming requests
            </h2>
            <Card variant="elevated" enter className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/60 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Incoming</h3>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  People asking you for a skill exchange
                </p>
              </Card.Header>
              <div className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                {incoming.length === 0 ? (
                  <div className="p-4 sm:p-6">
                    <EmptyState
                      className="border-slate-200/70 py-10 dark:border-white/10"
                      icon={<InboxDownIcon />}
                      title="Inbox is empty"
                      description="You don’t have any incoming skill exchange requests. When someone sends you a request from Matches, it will appear here for you to accept or decline."
                      action={
                        <Button to="/matches" variant="secondary" size="sm">
                          Browse matches
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  incoming.map((row) => (
                    <div
                      key={row.id}
                      className="motion-safe:animate-fade-in flex flex-col gap-4 p-5 transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-semibold text-slate-900 dark:text-white">{row.fromName}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{row.when}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{row.topic}</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <StatusBadge status={row.status} />
                        {row.status === 'pending' ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              className="min-w-[6rem] justify-center"
                              loading={busyKey === `${row.id}:accept`}
                              disabled={busyKey !== '' && busyKey !== `${row.id}:accept`}
                              onClick={() => acceptIncomingRequest(row.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-w-[6rem] justify-center"
                              loading={busyKey === `${row.id}:reject`}
                              disabled={busyKey !== '' && busyKey !== `${row.id}:reject`}
                              onClick={() => rejectIncomingRequest(row.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 sm:min-w-[8rem] sm:text-right">
                            No action needed
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <section aria-labelledby="outgoing-heading">
            <h2 id="outgoing-heading" className="sr-only">
              Outgoing requests
            </h2>
            <Card variant="elevated" enter className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/60 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Outgoing</h3>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Requests you&apos;ve sent; status updates when they respond
                </p>
              </Card.Header>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-white/50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-400">
                      <th className="px-6 py-3 font-semibold">To</th>
                      <th className="px-6 py-3 font-semibold">Topic</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {outgoing.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10">
                          <EmptyState
                            className="border-slate-200/70 py-8 dark:border-white/10"
                            icon={<InboxIcon />}
                            title="No outgoing requests yet"
                            description="Send a request from Matches to start a skill exchange."
                            action={
                              <Button to="/matches" variant="primary" size="sm">
                                Go to Matches
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      outgoing.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.toName}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.topic}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-500">
                            {row.when}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-200/80 md:hidden dark:divide-white/[0.08]">
                {outgoing.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      className="border-slate-200/70 py-8 dark:border-white/10"
                      icon={<SendIcon />}
                      title="Nothing sent yet"
                      description="Send a skill exchange request from Matches—it will show up here with its status."
                      action={
                        <Button to="/matches" variant="primary" size="sm" className="w-full sm:w-auto">
                          Browse matches
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  outgoing.map((row) => (
                    <div key={row.id} className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{row.toName}</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{row.topic}</p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Sent {row.when}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  )
}

function InboxIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  )
}

function InboxDownIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  )
}
