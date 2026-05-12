import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatBDT } from '../lib/currency.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'

const PAYMENT_METHODS = ['Bkash', 'Nagad', 'Rocket']

export default function CoursesPage() {
  const { isAuthenticated, user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const [enrollingCourseId, setEnrollingCourseId] = useState('')
  const [paymentFormForCourse, setPaymentFormForCourse] = useState('')
  const [paymentDrafts, setPaymentDrafts] = useState({})
  const [pendingPaymentCourseIds, setPendingPaymentCourseIds] = useState(new Set())
  const [submittingPaymentCourseId, setSubmittingPaymentCourseId] = useState('')
  const [recentlySubmittedPaymentCourseId, setRecentlySubmittedPaymentCourseId] = useState('')
  const [courseSearchQuery, setCourseSearchQuery] = useState('')

  const canEnroll = isAuthenticated && (user?.role === 'learner' || user?.role === 'both')
  const currentUserId = userId(user)
  const isTeacherOnly = isAuthenticated && user?.role === 'teacher'
  const eligibleCourses = useMemo(() => {
    if (user?.role !== 'both') return courses
    return courses.filter((course) => String(course.teacherId ?? '') !== String(currentUserId ?? ''))
  }, [courses, currentUserId, user?.role])

  const displayCourses = useMemo(() => {
    const q = courseSearchQuery.trim().toLowerCase()
    if (!q) return eligibleCourses
    return eligibleCourses.filter((course) => {
      const title = String(course.title ?? '').toLowerCase()
      const teacher = String(course.teacherName ?? '').toLowerCase()
      return title.includes(q) || teacher.includes(q)
    })
  }, [eligibleCourses, courseSearchQuery])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/courses')
        if (!cancelled) {
          setCourses(res.data?.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load courses.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!canEnroll) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/enrollments/me')
        if (cancelled) return
        const ids = new Set((res.data?.data ?? []).map((item) => item.courseId))
        setEnrolledCourseIds(ids)
        const paymentsRes = await api.get('/payments/me')
        const pendingIds = new Set(
          (paymentsRes.data?.data ?? [])
            .filter((p) => p.status === 'pending')
            .map((p) => p.courseId),
        )
        setPendingPaymentCourseIds(pendingIds)
      } catch {
        if (!cancelled) setEnrolledCourseIds(new Set())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canEnroll])

  const handleEnroll = async (course) => {
    if (!canEnroll) return
    const isFree = Number(course.price) === 0

    if (!isFree) {
      const confirmed = window.confirm(
        `Simulate payment of ${formatBDT(course.price)} for "${course.title}"?`,
      )
      if (!confirmed) return
      toast.info('Payment Successful')
    }

    setEnrollingCourseId(course.id)
    try {
      const { data } = await api.post(`/enrollments/${course.id}`)
      setEnrolledCourseIds((prev) => new Set(prev).add(course.id))
      toast.success(data?.message ?? 'Enrollment successful')
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Could not enroll in this course.')
      toast.error(msg)
    } finally {
      setEnrollingCourseId('')
    }
  }

  const handleSubmitPayment = async (course) => {
    const draft = paymentDrafts[course.id] ?? { paymentMethod: 'Bkash', trxId: '' }
    if (!draft.trxId?.trim()) {
      toast.error('Please enter TRX ID')
      return
    }
    setSubmittingPaymentCourseId(course.id)
    try {
      const { data } = await api.post('/payments', {
        courseId: course.id,
        paymentMethod: draft.paymentMethod,
        trxId: draft.trxId.trim(),
      })
      toast.success(data?.message ?? 'Payment submitted, waiting for admin approval')
      setPendingPaymentCourseIds((prev) => new Set(prev).add(course.id))
      setRecentlySubmittedPaymentCourseId(course.id)
      setPaymentFormForCourse('')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not submit payment.'))
    } finally {
      setSubmittingPaymentCourseId('')
    }
  }

  if (isTeacherOnly) {
    return <Navigate to="/teaching-courses" replace />
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">All Courses</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Discover live learning sessions from teachers in the community.
          </p>
        </div>
        {!loading && eligibleCourses.length > 0 ? (
          <div className="max-w-xl space-y-1.5">
            <label htmlFor="course-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Search courses
            </label>
            <input
              id="course-search"
              type="search"
              autoComplete="off"
              placeholder="Search by title or teacher name…"
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {courseSearchQuery.trim() ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {displayCourses.length} match{displayCourses.length === 1 ? '' : 'es'} of {eligibleCourses.length}{' '}
                course{eligibleCourses.length === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading courses...</p> : null}

      {!loading && eligibleCourses.length === 0 ? (
        <EmptyState
          title={user?.role === 'both' ? 'No other courses available' : 'No courses yet'}
          description={
            user?.role === 'both'
              ? 'Your own courses are hidden here. New courses from other teachers will appear soon.'
              : 'Be the first teacher to publish a course.'
          }
          className="border-slate-200/80 py-12 dark:border-white/10"
        />
      ) : null}

      {!loading && eligibleCourses.length > 0 && displayCourses.length === 0 ? (
        <EmptyState
          title="No matching courses"
          description="Try a different course title or teacher name."
          className="border-slate-200/80 py-12 dark:border-white/10"
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setCourseSearchQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : null}

      {!loading && displayCourses.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayCourses.map((course) => {
            const isFree = Number(course.price) === 0
            const isEnrolled = enrolledCourseIds.has(course.id)
            const hasPendingPayment = pendingPaymentCourseIds.has(course.id)
            const showPaymentForm = paymentFormForCourse === course.id
            const isOwner = String(course.teacherId ?? '') === String(currentUserId ?? '')
            const canBuyThisCourse = canEnroll && !isOwner
            const lifecycle = course.lifecycleStatus ?? 'active'
            const enrollOpen = lifecycle === 'active'
            return (
              <Card key={course.id} variant="elevated">
                <Card.Body className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{course.title}</h2>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isFree
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                            : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100'
                        }`}
                      >
                        {isFree ? 'Free' : 'Paid'}
                      </span>
                      {lifecycle === 'completion_pending' ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/35 dark:text-amber-100">
                          Closing
                        </span>
                      ) : null}
                      {lifecycle === 'completed' ? (
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                          Completed
                        </span>
                      ) : null}
                      {isEnrolled ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Enrolled
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{course.description}</p>
                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="font-medium text-slate-800 dark:text-slate-200">Teacher:</span>{' '}
                      {course.teacherId ? (
                        <Link
                          to={`/users/${course.teacherId}`}
                          className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
                        >
                          {course.teacherName?.trim() || 'View profile'}
                        </Link>
                      ) : (
                        course.teacherName || 'Unknown'
                      )}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800 dark:text-slate-200">Price:</span>{' '}
                      {formatBDT(course.price)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800 dark:text-slate-200">Schedule:</span>{' '}
                      {formatShortDate(course.schedule) || 'TBA'}
                    </p>
                    {(course.classDays ?? []).length > 0 ? (
                      <p>
                        <span className="font-medium text-slate-800 dark:text-slate-200">Class days:</span>{' '}
                        {(course.classDays ?? []).join(', ')}
                      </p>
                    ) : null}
                    <p>
                      <span className="font-medium text-slate-800 dark:text-slate-200">Created:</span>{' '}
                      {formatShortDate(course.createdAt)}
                    </p>
                    {(course.reviewCount ?? 0) > 0 && course.reviewAverage != null ? (
                      <p className="text-amber-800 dark:text-amber-200">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Rating:</span>{' '}
                        <span aria-hidden>{'★'.repeat(Math.min(5, Math.max(1, Math.round(Number(course.reviewAverage)))))}</span>{' '}
                        <span className="tabular-nums font-semibold">{Number(course.reviewAverage).toFixed(1)}</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {' '}
                          ({course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </p>
                    ) : null}
                  </div>
                </Card.Body>
                <Card.Footer className="flex items-center justify-between gap-3 pt-0">
                  <Link to={`/courses/${course.id}`} className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                    View details
                  </Link>
                  {canBuyThisCourse ? (
                    enrollOpen ? (
                      isFree ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isEnrolled}
                          loading={enrollingCourseId === course.id}
                          onClick={() => handleEnroll(course)}
                        >
                          {isEnrolled ? 'Enrolled' : 'Enroll Free'}
                        </Button>
                      ) : hasPendingPayment ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                            Payment Pending
                          </span>
                          {recentlySubmittedPaymentCourseId === course.id ? (
                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                              Payment submitted, waiting for admin approval.
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="accent"
                          disabled={isEnrolled}
                          onClick={() => setPaymentFormForCourse((prev) => (prev === course.id ? '' : course.id))}
                        >
                          {isEnrolled ? 'Enrolled' : 'Buy Course'}
                        </Button>
                      )
                    ) : !isEnrolled ? (
                      <span className="max-w-[10rem] text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                        {lifecycle === 'completion_pending' ? 'Enrollments closed (pending completion)' : 'Enrollments closed'}
                      </span>
                    ) : null
                  ) : null}
                </Card.Footer>
                {canBuyThisCourse && enrollOpen && !isFree && !isEnrolled && showPaymentForm ? (
                  <Card.Body className="border-t border-slate-200/70 pt-4 dark:border-white/10">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Submit Payment</h3>
                      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-100">
                        Send your payment to <strong>01776277198</strong> using bKash, Nagad, or Rocket. Then choose the
                        method you used and enter your TRX ID below.
                      </div>
                      <select
                        value={paymentDrafts[course.id]?.paymentMethod ?? 'Bkash'}
                        onChange={(e) =>
                          setPaymentDrafts((prev) => ({
                            ...prev,
                            [course.id]: { paymentMethod: e.target.value, trxId: prev[course.id]?.trxId ?? '' },
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Enter TRX ID"
                        value={paymentDrafts[course.id]?.trxId ?? ''}
                        onChange={(e) =>
                          setPaymentDrafts((prev) => ({
                            ...prev,
                            [course.id]: { paymentMethod: prev[course.id]?.paymentMethod ?? 'Bkash', trxId: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <Button
                        size="sm"
                        variant="accent"
                        loading={submittingPaymentCourseId === course.id}
                        onClick={() => handleSubmitPayment(course)}
                      >
                        Submit Payment
                      </Button>
                    </div>
                  </Card.Body>
                ) : null}
              </Card>
            )
          })}
        </section>
      ) : null}
    </div>
  )
}

