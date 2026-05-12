import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import { DashboardSkeleton } from '../components/ui/Skeleton.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { userId } from '../lib/userId.js'
import { cn } from '../lib/cn.js'

function formatSessionSchedule(value) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not scheduled'
  return date.toLocaleString()
}

/** Sum of reviewCount + weighted average rating across taught courses. */
function aggregateCourseReviews(rows) {
  const list = Array.isArray(rows) ? rows : []
  let total = 0
  let weighted = 0
  for (const c of list) {
    const n = Number(c?.reviewCount) || 0
    const avg = c?.reviewAverage != null ? Number(c.reviewAverage) : NaN
    total += n
    if (n > 0 && Number.isFinite(avg)) weighted += avg * n
  }
  const overallAvg = total > 0 ? Math.round((weighted / total) * 10) / 10 : null
  return { total, overallAvg }
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const me = userId(user)
  const userName = user?.name ?? 'there'
  const role = user?.role
  const isBothRole = role === 'both'
  const isTeacherRole = role === 'teacher'
  const isLearnerRole = role === 'learner'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalRequests, setTotalRequests] = useState(0)
  const [pendingIncoming, setPendingIncoming] = useState(0)
  const [courseReviewsTotal, setCourseReviewsTotal] = useState(0)
  const [courseReviewsAvg, setCourseReviewsAvg] = useState(null)
  const [createdCoursesCount, setCreatedCoursesCount] = useState(0)
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0)
  const [bothRequests, setBothRequests] = useState([])

  useEffect(() => {
    if (!isAuthenticated || !me || isBothRole) return
    let cancelled = false
    ;(async () => {
      try {
        if (isTeacherRole) {
          const createdRes = await api.get(`/courses/teacher/${me}`)
          if (cancelled) return
          const rows = createdRes?.data?.data ?? []
          setCreatedCoursesCount(rows.length)
          const agg = aggregateCourseReviews(rows)
          setCourseReviewsTotal(agg.total)
          setCourseReviewsAvg(agg.overallAvg)
        }
        if (isLearnerRole) {
          const enrolledRes = await api.get('/enrollments/me')
          if (cancelled) return
          const rows = enrolledRes?.data?.data ?? []
          setEnrolledCoursesCount(rows.length)
        }
      } catch {
        // keep non-both dashboard resilient
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isBothRole, isLearnerRole, isTeacherRole, me])

  useEffect(() => {
    if (!isAuthenticated || !me || !isBothRole) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [reqRes, createdRes, enrolledRes] = await Promise.all([
          api.get('/requests', { params: { type: 'all' } }),
          api.get(`/courses/teacher/${me}`).catch(() => ({ data: { data: [] } })),
          api.get('/enrollments/me').catch(() => ({ data: { data: [] } })),
        ])
        if (cancelled) return
        const reqRows = reqRes.data?.data ?? []
        setTotalRequests(reqRows.length)
        setPendingIncoming(
          reqRows.filter((r) => {
            const rid = String(r.receiverId ?? r.receiver?._id ?? r.receiver?.id ?? '')
            return rid === String(me) && r.status === 'pending'
          }).length,
        )
        setBothRequests(reqRows)
        const createdRows = createdRes.data?.data ?? []
        setCreatedCoursesCount(createdRows.length)
        const agg = aggregateCourseReviews(createdRows)
        setCourseReviewsTotal(agg.total)
        setCourseReviewsAvg(agg.overallAvg)
        setEnrolledCoursesCount((enrolledRes.data?.data ?? []).length)
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
  }, [isAuthenticated, isBothRole, me])

  const summaryStats = useMemo(
    () => [
      {
        key: 'createdCourses',
        label: 'Created Courses',
        value: createdCoursesCount,
        hint: user?.isApproved ? 'Your teaching catalog' : 'Pending teaching approval',
        gradient: 'from-emerald-500 to-teal-600',
        icon: CoursesIcon,
        to: '/teaching-courses',
      },
      {
        key: 'enrolledCourses',
        label: 'Enrolled Courses',
        value: enrolledCoursesCount,
        hint: 'Your learning path',
        gradient: 'from-sky-500 to-cyan-600',
        icon: LearnIcon,
        to: '/my-courses',
      },
      {
        key: 'requests',
        label: 'Requests',
        value: totalRequests,
        hint: `${pendingIncoming} pending`,
        gradient: 'from-violet-500 to-purple-600',
        icon: RequestsIcon,
        to: '/requests',
      },
      {
        key: 'courseReviews',
        label: 'Course reviews',
        value: courseReviewsTotal,
        hint:
          courseReviewsAvg != null
            ? `${courseReviewsAvg} avg · learner ratings`
            : 'Ratings on your taught courses',
        gradient: 'from-fuchsia-500 to-pink-500',
        icon: ReviewsIcon,
        to: '/reviews',
      },
    ],
    [
      courseReviewsAvg,
      courseReviewsTotal,
      createdCoursesCount,
      enrolledCoursesCount,
      pendingIncoming,
      totalRequests,
      user?.isApproved,
    ],
  )

  const requestsForPanel = useMemo(() => {
    if (!Array.isArray(bothRequests)) return []
    const order = { pending: 0, accepted: 1, rejected: 2 }
    return [...bothRequests]
      .sort((a, b) => {
        const s = (order[a.status] ?? 9) - (order[b.status] ?? 9)
        if (s !== 0) return s
        return new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt)
      })
      .slice(0, 6)
  }, [bothRequests])

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
            {isTeacherRole
              ? 'Your account is set up for course management tools. Once approved, you can start teaching.'
              : null}
            {isLearnerRole
              ? 'Your account is set up for learning tools. Browse and enroll in courses from your dashboard features.'
              : null}
            {isBothRole
              ? user?.isApproved
                ? 'You can teach, learn, and join skill exchanges from one account.'
                : 'Your both-role account is pending admin approval. Teaching and skill exchange features unlock after approval.'
              : null}
          </p>
          {error ? (
            <AlertMessage variant="error" className="relative mt-4 max-w-2xl">
              {error}
            </AlertMessage>
          ) : null}
        </div>
      </header>

      {loading && isBothRole ? <DashboardSkeleton /> : null}

      {!loading && isBothRole ? (
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
                    <Link to={stat.to} className="block h-full">
                      <Card
                        variant="solid"
                        enter
                        style={{ animationDelay: `${idx * 90}ms` }}
                        className="h-full overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
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
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="session-heading">
            <Card variant="elevated" className="overflow-hidden">
              <Card.Header className="flex flex-col gap-1 border-slate-200/80 bg-slate-50/50 px-6 py-5 dark:border-white/[0.08] dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="session-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Session Shortcuts
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Jump directly into accepted sessions.
                  </p>
                </div>
                <Link to="/requests" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                  Manage all requests
                </Link>
              </Card.Header>
              <Card.Body className="space-y-3 p-6">
                {requestsForPanel.filter((r) => r.status === 'accepted').length === 0 ? (
                  <EmptyState
                    className="border-slate-200/80 py-10 dark:border-white/10"
                    title="No active sessions yet"
                    description="Accepted requests will appear here with quick session access."
                  />
                ) : (
                  requestsForPanel
                    .filter((r) => r.status === 'accepted')
                    .map((r) => {
                    const isIncoming = String(r.receiverId ?? '') === String(me)
                    const peer = isIncoming ? r.sender?.name ?? 'User' : r.receiver?.name ?? 'User'
                    return (
                      <div key={r.id} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {isIncoming ? 'From' : 'To'} {peer}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          Schedule: {formatSessionSchedule(r.schedule)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {r.meetingLink?.trim() ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(r.meetingLink, '_blank', 'noopener,noreferrer')}
                            >
                              Join Session
                            </Button>
                          ) : null}
                          <Button to={`/session?request=${r.id}`} size="sm" variant="outline">
                            Go to Session
                          </Button>
                        </div>
                      </div>
                    )
                    })
                )}
              </Card.Body>
            </Card>
          </section>
        </>
      ) : null}

      {!isBothRole ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Card variant="elevated">
            <Card.Body className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isTeacherRole ? 'Teacher dashboard' : 'Learner dashboard'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {isTeacherRole
                  ? user?.isApproved
                    ? 'You can manage teaching-related actions from your teacher workspace.'
                    : 'Your teacher account is pending admin approval before teacher-only features unlock.'
                  : 'Use learner tools to browse courses and manage your enrollments.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {(isTeacherRole && user?.isApproved) || isBothRole ? (
                  <Link
                    to="/teaching-courses"
                    className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    Go to My Teaching
                  </Link>
                ) : null}
                {(isLearnerRole || isBothRole) ? (
                  <Link to="/my-courses" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                    My Enrolled Courses
                  </Link>
                ) : null}
                {isLearnerRole || isBothRole ? (
                  <Link to="/courses" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                    Browse Courses
                  </Link>
                ) : null}
              </div>
            </Card.Body>
          </Card>
          {isTeacherRole ? (
            <Card variant="elevated">
              <Card.Body className="p-6">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Created Courses</h2>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{createdCoursesCount}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {user?.isApproved ? 'Your teaching catalog is active.' : 'Waiting for admin approval to teach.'}
                </p>
              </Card.Body>
            </Card>
          ) : null}
          {isLearnerRole ? (
            <Card variant="elevated">
              <Card.Body className="p-6">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Enrolled Courses</h2>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{enrolledCoursesCount}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Keep learning from your active classes.
                </p>
              </Card.Body>
            </Card>
          ) : null}
          {isTeacherRole ? (
            <Card variant="elevated">
              <Card.Body className="p-6">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Course reviews</h2>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{courseReviewsTotal}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {courseReviewsAvg != null
                    ? `${courseReviewsAvg} average across enrolled learner ratings`
                    : 'Learners rate after a course is completed'}
                </p>
                <Link
                  to="/reviews"
                  className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  Open Reviews
                </Link>
              </Card.Body>
            </Card>
          ) : null}
          <Card variant="elevated">
            <Card.Body className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isTeacherRole || isLearnerRole ? 'Upgrade to Both' : 'Role setup'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Switch your role to <strong>Both</strong> to access full teaching, learning, and skill exchange tools.
              </p>
            </Card.Body>
          </Card>
        </section>
      ) : null}
    </div>
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

function CoursesIcon({ className = 'h-6 w-6' }) {
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

function LearnIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
