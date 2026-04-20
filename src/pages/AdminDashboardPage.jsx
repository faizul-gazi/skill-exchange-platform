import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { AdminDashboardSkeleton } from '../components/ui/Skeleton.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'
import { cn } from '../lib/cn.js'

const REQUEST_STATUS = {
  pending: {
    label: 'Pending',
    className:
      'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
  },
  accepted: {
    label: 'Accepted',
    className:
      'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100',
  },
}

function StatCard({ label, value, hint, icon, accent }) {
  const Icon = icon
  return (
    <Card variant="elevated" className="overflow-hidden">
      <Card.Body className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-500">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft',
            accent,
          )}
          aria-hidden
        >
          <Icon className="h-6 w-6" />
        </div>
      </Card.Body>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [communityUsers, setCommunityUsers] = useState([])
  const [platformRequests, setPlatformRequests] = useState([])

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, usersRes, reqRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/requests'),
        ])
        if (cancelled) return
        setStats(statsRes.data?.data ?? null)
        const users = usersRes.data?.data ?? []
        setCommunityUsers(
          users.map((u) => ({
            id: userId(u) ?? u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            joined: formatShortDate(u.createdAt),
          })),
        )
        const reqs = reqRes.data?.data ?? []
        setPlatformRequests(
          reqs.map((r) => ({
            id: r.id,
            from: r.sender?.name ?? '—',
            to: r.receiver?.name ?? '—',
            topic: r.meetingLink?.trim() ? r.meetingLink : '—',
            status: r.status,
            date: formatShortDate(r.updatedAt ?? r.createdAt),
          })),
        )
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, 'Could not load admin data.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isAdmin])

  const totalUsers = stats?.totalUsers ?? communityUsers.length
  const totalRequests = stats?.totalRequests ?? platformRequests.length
  const pendingRequests = stats?.pendingRequests ?? platformRequests.filter((r) => r.status === 'pending').length

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin</h1>
        <p className="text-slate-600 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
            Sign in
          </Link>{' '}
          as an administrator to view this page.
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin</h1>
        <p className="text-rose-600 dark:text-rose-400" role="alert">
          You don&apos;t have permission to view the admin dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Admin
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Overview of members and skill exchange requests (live API).
          </p>
        </div>
      </div>

      {error ? (
        <AlertMessage variant="error" className="max-w-2xl">
          {error}
        </AlertMessage>
      ) : null}

      {loading ? <AdminDashboardSkeleton /> : null}

      {!loading ? (
        <section aria-labelledby="admin-stats-heading">
          <h2 id="admin-stats-heading" className="sr-only">
            Statistics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total users"
              value={totalUsers}
              hint="Registered accounts"
              accent="bg-gradient-to-br from-indigo-600 to-blue-600"
              icon={UsersIcon}
            />
            <StatCard
              label="Total requests"
              value={totalRequests}
              hint={`${pendingRequests} pending review`}
              accent="bg-gradient-to-br from-violet-600 to-purple-600"
              icon={InboxIcon}
            />
            <StatCard
              label="Pending requests"
              value={pendingRequests}
              hint="Awaiting response"
              accent="bg-gradient-to-br from-amber-500 to-orange-500"
              icon={ClockIcon}
            />
          </div>
        </section>
      ) : null}

      {!loading && (
        <>
          <section aria-labelledby="users-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h2 id="users-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Users
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">All registered members</p>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-slate-400">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {communityUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6">
                          <EmptyState
                            className="border-slate-200/70 py-10 dark:border-white/10"
                            icon={<UsersIcon className="h-7 w-7" />}
                            title="No users yet"
                            description="When people register, they will appear in this table."
                          />
                        </td>
                      </tr>
                    ) : (
                      communityUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="bg-white transition-colors duration-200 hover:bg-slate-50/90 dark:bg-transparent dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{u.name}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.role}</td>
                          <td className="px-6 py-3.5 text-right text-slate-500 dark:text-slate-500">{u.joined}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section aria-labelledby="requests-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h2 id="requests-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Requests
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Skill exchange requests across the platform
                </p>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-slate-400">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">From</th>
                      <th className="px-6 py-3">To</th>
                      <th className="px-6 py-3">Topic</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {platformRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6">
                          <EmptyState
                            className="border-slate-200/70 py-10 dark:border-white/10"
                            icon={<InboxIcon className="h-7 w-7" />}
                            title="No platform requests"
                            description="Skill exchange requests will show up here as members connect."
                          />
                        </td>
                      </tr>
                    ) : (
                      platformRequests.map((r) => (
                        <tr
                          key={r.id}
                          className="bg-white transition-colors duration-200 hover:bg-slate-50/90 dark:bg-transparent dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-500">
                            {r.id}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{r.from}</td>
                          <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{r.to}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{r.topic}</td>
                          <td className="px-6 py-3.5">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                REQUEST_STATUS[r.status]?.className,
                              )}
                            >
                              {REQUEST_STATUS[r.status]?.label ?? r.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right text-slate-500 dark:text-slate-500">{r.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function InboxIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
