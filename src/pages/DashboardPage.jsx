import { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { DashboardSkeleton } from '../components/ui/Skeleton.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'
import { cn } from '../lib/cn.js'

const activityStyles = {
  match: {
    label: 'Match',
    chip: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
    Icon: MatchesIcon,
  },
  request: {
    label: 'Request',
    chip: 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
    Icon: RequestsIcon,
  },
  review: {
    label: 'Review',
    chip: 'bg-fuchsia-500/15 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200',
    Icon: ReviewsIcon,
  },
}

function buildActivityFromRequests(rows, me) {
  const meStr = String(me)
  return [...rows]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt))
    .slice(0, 8)
    .map((r) => {
      const sid = String(r.senderId ?? r.sender?._id ?? r.sender?.id ?? '')
      const outgoing = sid === meStr
      const other = outgoing ? r.receiver?.name ?? 'User' : r.sender?.name ?? 'User'
      const topic = r.meetingLink?.trim() ? r.meetingLink : 'Skill exchange'
      return {
        id: r.id,
        kind: 'request',
        title: `${outgoing ? 'Sent to' : 'From'} ${other}: ${topic} (${r.status})`,
        time: formatShortDate(r.updatedAt ?? r.createdAt),
      }
    })
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const me = userId(user)
  const userName = user?.name ?? 'there'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalMatches, setTotalMatches] = useState(0)
  const [totalRequests, setTotalRequests] = useState(0)
  const [pendingIncoming, setPendingIncoming] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [reviewsAvg, setReviewsAvg] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    if (!isAuthenticated || !me) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [matchesRes, reqRes, reviewsRes] = await Promise.all([
          api.get('/matches'),
          api.get('/requests', { params: { type: 'all' } }),
          api.get(`/reviews/user/${me}`).catch(() => ({ data: { data: [], meta: {} } })),
        ])
        if (cancelled) return
        const matchRows = matchesRes.data?.data ?? []
        const reqRows = reqRes.data?.data ?? []
        setTotalMatches(matchRows.length)
        setTotalRequests(reqRows.length)
        setPendingIncoming(
          reqRows.filter((r) => {
            const rid = String(r.receiverId ?? r.receiver?._id ?? r.receiver?.id ?? '')
            return rid === String(me) && r.status === 'pending'
          }).length,
        )
        const revMeta = reviewsRes.data?.meta ?? {}
        setReviewsCount(revMeta.count ?? (reviewsRes.data?.data?.length ?? 0))
        setReviewsAvg(revMeta.averageRating ?? null)
        setRecentActivity(buildActivityFromRequests(reqRows, me))
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, 'Could not load dashboard.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, me])

  const summaryStats = useMemo(
    () => [
      {
        key: 'matches',
        label: 'Total Matches',
        value: totalMatches,
        hint: 'From your discovery feed',
        gradient: 'from-indigo-500 to-blue-600',
        icon: MatchesIcon,
      },
      {
        key: 'requests',
        label: 'Requests',
        value: totalRequests,
        hint: `${pendingIncoming} pending`,
        gradient: 'from-violet-500 to-purple-600',
        icon: RequestsIcon,
      },
      {
        key: 'reviews',
        label: 'Reviews',
        value: reviewsCount,
        hint: reviewsAvg != null ? `${reviewsAvg} avg rating` : 'Reviews received',
        gradient: 'from-fuchsia-500 to-pink-500',
        icon: ReviewsIcon,
      },
    ],
    [pendingIncoming, reviewsAvg, reviewsCount, totalMatches, totalRequests],
  )

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-indigo-600/10 via-white/60 to-fuchsia-500/10 p-8 shadow-soft backdrop-blur-md dark:border-white/[0.08] dark:from-indigo-500/15 dark:via-slate-900/60 dark:to-fuchsia-500/10 sm:p-10">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/30 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-gradient-to-tr from-fuchsia-400/20 to-transparent blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
            Your overview
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Welcome back, {userName}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Here&apos;s what&apos;s happening with your skill exchanges—matches, requests, and feedback at a
            glance.
          </p>
          {error ? (
            <AlertMessage variant="error" className="relative mt-4 max-w-2xl">
              {error}
            </AlertMessage>
          ) : null}
        </div>
      </header>

      {loading ? <DashboardSkeleton /> : null}

      {!loading ? (
        <>
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="sr-only">
              Summary statistics
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {summaryStats.map((stat, idx) => {
                const StatIcon = stat.icon
                return (
                  <li key={stat.key}>
                    <Card
                      variant="solid"
                      enter
                      style={{ animationDelay: `${idx * 90}ms` }}
                      className="h-full overflow-hidden"
                    >
                      <Card.Body className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                            {stat.value}
                          </p>
                          <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                            {stat.hint}
                          </p>
                        </div>
                        <div
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-soft',
                            stat.gradient,
                          )}
                          aria-hidden
                        >
                          <StatIcon className="h-6 w-6" />
                        </div>
                      </Card.Body>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="activity-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="flex flex-col gap-1 border-slate-200/80 bg-slate-50/50 px-6 py-5 dark:border-white/[0.08] dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="activity-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Recent activity
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Latest updates from your requests</p>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {recentActivity.length === 0 ? (
                  <EmptyState
                    className="m-6 border-slate-200/80 py-12 dark:border-white/10"
                    icon={<InboxStrokeIcon />}
                    title="No recent activity"
                    description="When you send or receive requests, they will appear here."
                  />
                ) : (
                  <ul className="divide-y divide-slate-200/80 dark:divide-white/[0.08]" role="list">
                    {recentActivity.map((item) => {
                      const cfg = activityStyles[item.kind]
                      const Icon = cfg.Icon
                      return (
                        <li key={item.id} className="group">
                          <div className="flex gap-4 px-6 py-4 transition-colors duration-200 hover:bg-slate-50/80 dark:hover:bg-white/[0.04]">
                            <div
                              className={cn(
                                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                                cfg.chip,
                              )}
                              aria-hidden
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                    cfg.chip,
                                  )}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                            </div>
                            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-500">{item.time}</span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card.Body>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  )
}

function InboxStrokeIcon() {
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

function MatchesIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function RequestsIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  )
}

function ReviewsIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  )
}
