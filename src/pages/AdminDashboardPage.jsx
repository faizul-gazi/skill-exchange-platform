import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
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
  const [pendingPayments, setPendingPayments] = useState([])
  const [coursesPendingCompletion, setCoursesPendingCompletion] = useState([])
  const [actionBusyId, setActionBusyId] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, usersRes, paymentsRes, pendingCoursesRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/payments/pending'),
          api.get('/admin/courses/pending-completion'),
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
            specialist: u.specialist ?? '',
            isApproved: Boolean(u.isApproved),
            joined: formatShortDate(u.createdAt),
            createdAt: u.createdAt,
          })),
        )
        setPendingPayments(paymentsRes.data?.data ?? [])
        setCoursesPendingCompletion(pendingCoursesRes.data?.data ?? [])
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

  const pendingTeachers = useMemo(
    () => communityUsers.filter((u) => (u.role === 'teacher' || u.role === 'both') && !u.isApproved),
    [communityUsers],
  )
  const totalUsers = stats?.totalUsers ?? communityUsers.length
  const totalTeachers = stats?.totalTeachers ?? communityUsers.filter((u) => u.role === 'teacher' || u.role === 'both').length
  const pendingApprovals = stats?.pendingApprovals ?? pendingTeachers.length
  const totalCourses = stats?.totalCourses ?? 0
  const pendingCourseCompletions = stats?.pendingCourseCompletions ?? coursesPendingCompletion.length
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return communityUsers.filter((u) => {
      const roleMatch = roleFilter === 'all' ? true : u.role === roleFilter
      const searchMatch =
        query.length === 0
          ? true
          : u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      return roleMatch && searchMatch
    })
  }, [communityUsers, roleFilter, search])

  const handleApproveTeacher = async (id) => {
    setActionBusyId(`approve:${id}`)
    try {
      await api.patch(`/admin/users/${id}/approve`)
      setCommunityUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isApproved: true } : u)))
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not approve teacher.'))
    } finally {
      setActionBusyId('')
    }
  }

  const handleRejectUser = async (id) => {
    const ok = window.confirm('Reject this pending account and remove it?')
    if (!ok) return
    setActionBusyId(`reject:${id}`)
    try {
      await api.delete(`/admin/users/${id}`)
      setCommunityUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not reject this user.'))
    } finally {
      setActionBusyId('')
    }
  }

  const handleDeleteUser = async (id) => {
    const ok = window.confirm('Delete this user and related data? This action cannot be undone.')
    if (!ok) return
    setActionBusyId(`delete:${id}`)
    try {
      await api.delete(`/admin/users/${id}`)
      setCommunityUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not delete user.'))
    } finally {
      setActionBusyId('')
    }
  }

  const handleCourseCompletionAction = async (courseId, action) => {
    if (action === 'reject') {
      const ok = window.confirm('Reject this request and reopen enrollments for the course?')
      if (!ok) return
    }
    setActionBusyId(`course:${action}:${courseId}`)
    try {
      await api.patch(`/admin/courses/${courseId}/${action === 'approve' ? 'approve-completion' : 'reject-completion'}`)
      setCoursesPendingCompletion((prev) => prev.filter((c) => c.id !== courseId))
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pendingCourseCompletions: Math.max(0, (prev.pendingCourseCompletions ?? 0) - 1),
            }
          : prev,
      )
    } catch (e) {
      setError(getApiErrorMessage(e, `Could not ${action} course completion.`))
    } finally {
      setActionBusyId('')
    }
  }

  const handlePaymentAction = async (paymentId, action) => {
    setActionBusyId(`payment:${action}:${paymentId}`)
    try {
      await api.patch(`/admin/payments/${paymentId}/${action}`)
      setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId))
    } catch (e) {
      setError(getApiErrorMessage(e, `Could not ${action} payment.`))
    } finally {
      setActionBusyId('')
    }
  }

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
            Manage users, approvals, and platform learning operations.
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
              label="Total teachers"
              value={totalTeachers}
              hint="Teacher + both roles"
              accent="bg-gradient-to-br from-violet-600 to-purple-600"
              icon={TeacherIcon}
            />
            <StatCard
              label="Pending approvals"
              value={pendingApprovals}
              hint="Awaiting admin decision"
              accent="bg-gradient-to-br from-amber-500 to-orange-500"
              icon={ClockIcon}
            />
            <StatCard
              label="Total courses"
              value={totalCourses}
              hint="Published learning content"
              accent="bg-gradient-to-br from-emerald-500 to-teal-500"
              icon={CoursesIcon}
            />
            <StatCard
              label="Courses ending (pending)"
              value={pendingCourseCompletions}
              hint="Teacher requested completion"
              accent="bg-gradient-to-br from-rose-500 to-pink-600"
              icon={CoursesIcon}
            />
          </div>
        </section>
      ) : null}

      {!loading && (
        <>
          <section aria-labelledby="pending-teachers-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h2 id="pending-teachers-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pending Teachers
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Teachers waiting for approval
                </p>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-slate-400">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Specialist</th>
                      <th className="px-6 py-3">Joined</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {pendingTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          No pending teacher approvals.
                        </td>
                      </tr>
                    ) : (
                      pendingTeachers.map((u) => (
                        <tr key={u.id}>
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{u.name}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.role}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.specialist || '-'}</td>
                          <td className="px-6 py-3.5 text-slate-500 dark:text-slate-500">{u.joined}</td>
                          <td className="px-6 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="accent"
                              loading={actionBusyId === `approve:${u.id}`}
                              onClick={() => handleApproveTeacher(u.id)}
                              className="mr-2"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={actionBusyId === `reject:${u.id}`}
                              onClick={() => handleRejectUser(u.id)}
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section aria-labelledby="pending-course-completion-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h2 id="pending-course-completion-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Course completion requests
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Approve to mark a course completed (live class closes; enrolled learners keep recordings). Reject to
                  reopen enrollments.
                </p>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-slate-400">
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Teacher</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {coursesPendingCompletion.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          No pending course completion requests.
                        </td>
                      </tr>
                    ) : (
                      coursesPendingCompletion.map((c) => (
                        <tr key={c.id}>
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{c.title}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                            <div>{c.teacherName || 'Teacher'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">{c.teacherEmail ?? ''}</div>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="accent"
                              className="mr-2"
                              loading={actionBusyId === `course:approve:${c.id}`}
                              onClick={() => handleCourseCompletionAction(c.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={actionBusyId === `course:reject:${c.id}`}
                              onClick={() => handleCourseCompletionAction(c.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section aria-labelledby="pending-payments-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h2 id="pending-payments-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pending Payments
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Review payment requests before enrollment
                </p>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-slate-400">
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Method</th>
                      <th className="px-6 py-3">TRX ID</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {pendingPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          No pending payments.
                        </td>
                      </tr>
                    ) : (
                      pendingPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">
                            <div>{p.userName ?? 'User'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">{p.userEmail ?? ''}</div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{p.courseTitle ?? 'Course'}</td>
                          <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{p.paymentMethod}</td>
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">{p.trxId}</td>
                          <td className="px-6 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="accent"
                              className="mr-2"
                              loading={actionBusyId === `payment:approve:${p.id}`}
                              onClick={() => handlePaymentAction(p.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={actionBusyId === `payment:reject:${p.id}`}
                              onClick={() => handlePaymentAction(p.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section aria-labelledby="users-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <h2 id="users-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Users
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">All registered members</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="learner">Learner</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </Card.Header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-slate-400">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Joined</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6">
                          <EmptyState
                            className="border-slate-200/70 py-10 dark:border-white/10"
                            icon={<UsersIcon className="h-7 w-7" />}
                            title="No users found"
                            description="Try changing the search text or role filter."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="bg-white transition-colors duration-200 hover:bg-slate-50/90 dark:bg-transparent dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{u.name}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{u.role}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                            {u.isApproved ? 'Approved' : 'Pending'}
                          </td>
                          <td className="px-6 py-3.5 text-right text-slate-500 dark:text-slate-500">{u.joined}</td>
                          <td className="px-6 py-3.5 text-right">
                            {(u.role === 'teacher' || u.role === 'both') && !u.isApproved ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="mr-2"
                                loading={actionBusyId === `approve:${u.id}`}
                                onClick={() => handleApproveTeacher(u.id)}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {u.role !== 'admin' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                loading={actionBusyId === `delete:${u.id}`}
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </td>
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

function TeacherIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 14.5C18 17.538 15.314 20 12 20s-6-2.462-6-5.5c0-1.372.347-2.634.84-3.922L12 14z"
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

function CoursesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.483 9.246 5 7.5 5A4.5 4.5 0 003 9.5v8A4.5 4.5 0 017.5 13c1.746 0 3.332.483 4.5 1.253m0-8C13.168 5.483 14.754 5 16.5 5A4.5 4.5 0 0121 9.5v8a4.5 4.5 0 00-4.5-4.5c-1.746 0-3.332.483-4.5 1.253"
      />
    </svg>
  )
}
