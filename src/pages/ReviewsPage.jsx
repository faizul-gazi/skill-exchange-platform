import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'

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

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuth()
  const me = userId(user)
  const role = user?.role
  const canTeach = role === 'teacher' || role === 'both'

  const [exchangeRows, setExchangeRows] = useState([])
  const [exchangeMeta, setExchangeMeta] = useState({ count: 0, averageRating: null })
  const [teacherCourses, setTeacherCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [exchangeError, setExchangeError] = useState('')
  const [coursesError, setCoursesError] = useState('')

  useEffect(() => {
    if (!me) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setExchangeError('')
      setCoursesError('')
      try {
        const exchangeReq = api.get(`/reviews/user/${me}`)
        const coursesReq = canTeach ? api.get(`/courses/teacher/${me}`) : Promise.resolve({ data: { data: [] } })
        const settled = await Promise.allSettled([exchangeReq, coursesReq])
        if (cancelled) return

        const ex = settled[0]
        if (ex.status === 'fulfilled') {
          setExchangeRows(ex.value.data?.data ?? [])
          setExchangeMeta(ex.value.data?.meta ?? { count: 0, averageRating: null })
        } else {
          setExchangeRows([])
          setExchangeMeta({ count: 0, averageRating: null })
          setExchangeError(getApiErrorMessage(ex.reason, 'Could not load skill exchange reviews.'))
        }

        const cr = settled[1]
        if (canTeach) {
          if (cr.status === 'fulfilled') {
            setTeacherCourses(Array.isArray(cr.value.data?.data) ? cr.value.data.data : [])
          } else {
            setTeacherCourses([])
            setCoursesError(getApiErrorMessage(cr.reason, 'Could not load your courses.'))
          }
        } else {
          setTeacherCourses([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [me, canTeach])

  const courseAgg = useMemo(() => aggregateCourseReviews(teacherCourses), [teacherCourses])

  /** Teacher-only: hide skill-exchange block unless there is something to show. */
  const showSkillExchangeSection =
    role === 'both' || role === 'learner' || (role === 'teacher' && exchangeRows.length > 0)

  const headerDescription = useMemo(() => {
    const parts = []
    if (canTeach) {
      parts.push(
        `${courseAgg.total} course rating${courseAgg.total === 1 ? '' : 's'}${courseAgg.overallAvg != null ? ` · ${courseAgg.overallAvg} avg on your courses` : ''}`,
      )
    }
    if (showSkillExchangeSection) {
      parts.push(
        `${exchangeMeta.count ?? 0} skill-exchange review${(exchangeMeta.count ?? 0) === 1 ? '' : 's'}${exchangeMeta.averageRating != null ? ` · ${exchangeMeta.averageRating} avg` : ''}`,
      )
    }
    if (parts.length === 0) return 'Feedback about your teaching and exchanges.'
    return parts.join(' · ')
  }, [
    canTeach,
    courseAgg.overallAvg,
    courseAgg.total,
    exchangeMeta.averageRating,
    exchangeMeta.count,
    showSkillExchangeSection,
  ])

  if (!isAuthenticated || !me) {
    return (
      <div className="space-y-8 md:space-y-10">
        <PageHeader eyebrow="Feedback" title="Reviews" description="Sign in to see ratings and feedback." />
        <EmptyState
          title="Sign in required"
          description="Reviews are available once you log in."
          action={<Button to="/login">Log in</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader eyebrow="Feedback" title="Reviews" description={headerDescription}>
        {exchangeError ? (
          <AlertMessage variant="error" className="mt-2 max-w-2xl">
            {exchangeError}
          </AlertMessage>
        ) : null}
      </PageHeader>

      {loading ? (
        <Card variant="elevated">
          <Card.Body>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading reviews…</p>
          </Card.Body>
        </Card>
      ) : null}

      {!loading && canTeach ? (
        <section className="space-y-4" aria-labelledby="course-ratings-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="course-ratings-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                Course ratings
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Learners rate courses after they are marked completed. Open a course to read individual reviews.
              </p>
            </div>
            <Link
              to="/teaching-courses"
              className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              Manage courses →
            </Link>
          </div>

          {coursesError ? (
            <AlertMessage variant="error" className="max-w-2xl">
              {coursesError}
            </AlertMessage>
          ) : null}

          {teacherCourses.length === 0 && !coursesError ? (
            <Card variant="elevated">
              <Card.Body className="py-10">
                <EmptyState
                  title="No courses yet"
                  description="Create a course to start collecting learner ratings."
                  action={<Button to="/courses/create">Create course</Button>}
                />
              </Card.Body>
            </Card>
          ) : null}

          {teacherCourses.length > 0 ? (
            <>
              <Card variant="elevated">
                <Card.Body className="flex flex-wrap gap-6 sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total learner ratings</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {courseAgg.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average on all courses</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {courseAgg.overallAvg != null ? courseAgg.overallAvg.toFixed(1) : '—'}
                    </p>
                  </div>
                </Card.Body>
              </Card>

              <ul className="grid gap-3 md:grid-cols-2" role="list">
                {[...teacherCourses]
                  .sort((a, b) => (Number(b?.reviewCount) || 0) - (Number(a?.reviewCount) || 0))
                  .map((course) => {
                    const rc = Number(course?.reviewCount) || 0
                    const ra = course?.reviewAverage != null ? Number(course.reviewAverage) : null
                    return (
                      <li key={course.id}>
                        <Card variant="elevated" className="h-full">
                          <Card.Body className="flex h-full flex-col gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {rc === 0
                                ? 'No ratings yet'
                                : `${rc} rating${rc === 1 ? '' : 's'}${Number.isFinite(ra) ? ` · ${ra.toFixed(1)} ★ avg` : ''}`}
                            </p>
                            <div className="mt-auto pt-2">
                              <Link
                                to={`/courses/${course.id}#course-reviews`}
                                className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
                              >
                                Read reviews on course page →
                              </Link>
                            </div>
                          </Card.Body>
                        </Card>
                      </li>
                    )
                  })}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {!loading && showSkillExchangeSection ? (
        <section className="space-y-4" aria-labelledby="skill-exchange-heading">
          <div>
            <h2 id="skill-exchange-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              Skill exchange reviews
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Only people who completed an exchange with you can leave these — both of you must confirm completion from Session first.
            </p>
          </div>

          {exchangeRows.length === 0 ? (
            <EmptyState
              title="No skill exchange reviews yet"
              description="After an accepted exchange, both partners confirm completion on Session; then either person can leave one review on the other’s profile."
              action={
                role === 'both' ? (
                  <Link
                    to="/skill-exchange"
                    className="text-sm font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                  >
                    Open Skill Exchange
                  </Link>
                ) : (
                  <Link
                    to="/profile"
                    className="text-sm font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                  >
                    Go to profile
                  </Link>
                )
              }
            />
          ) : (
            <ul className="grid gap-4" role="list">
              {exchangeRows.map((review) => (
                <li key={review.id}>
                  <Card variant="elevated">
                    <Card.Body className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {review.reviewer?.name ?? 'Reviewer'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {formatShortDate(review.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-amber-600 dark:text-amber-300">
                        {'★'.repeat(review.rating)} ({review.rating}/5)
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {review.comment?.trim() ? review.comment : 'No comment provided.'}
                      </p>
                    </Card.Body>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
