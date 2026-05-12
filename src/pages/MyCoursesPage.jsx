import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatBDT } from '../lib/currency.js'
import { formatShortDate } from '../lib/formatDate.js'

export default function MyCoursesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/enrollments/me')
        if (!cancelled) {
          setEnrollments(res.data?.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load your enrolled courses.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Courses</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Courses you are enrolled in.</p>
      </div>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading your enrolled courses...</p> : null}

      {!loading && enrollments.length === 0 ? (
        <EmptyState
          title="No enrolled courses"
          description="Browse courses and enroll to start learning."
          className="border-slate-200/80 py-12 dark:border-white/10"
        />
      ) : null}

      {!loading && enrollments.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course
            if (!course) return null
            const lifecycle = course.lifecycleStatus ?? 'active'
            return (
            <Card key={enrollment.id} variant="elevated">
              <Card.Body className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{course.title}</h2>
                  {lifecycle === 'completion_pending' ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-900/35 dark:text-amber-100">
                      Closing
                    </span>
                  ) : null}
                  {lifecycle === 'completed' ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                      Completed
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{course.description}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatBDT(course.price)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Teacher:</span>{' '}
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Schedule: {formatShortDate(course.schedule) || 'TBA'}
                </p>
                {(course.classDays ?? []).length > 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Class days: {(course.classDays ?? []).join(', ')}
                  </p>
                ) : null}
                {course.meetingLink && lifecycle !== 'completed' ? (
                  <a
                    href={course.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                  >
                    Join Class
                  </a>
                ) : course.meetingLink && lifecycle === 'completed' ? (
                  <p className="text-xs text-slate-500 dark:text-slate-500">Live class ended — see recordings on the course page.</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-500">Meeting link not added yet.</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Enrolled: {formatShortDate(enrollment.enrolledAt)}
                </p>
              </Card.Body>
              <Card.Footer className="flex flex-wrap items-center gap-3 pt-0">
                <Link
                  to={`/courses/${course.id}`}
                  className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  View details
                </Link>
                {lifecycle === 'completed' ? (
                  <Link
                    to={`/courses/${course.id}#course-reviews`}
                    className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-300"
                  >
                    Rate course
                  </Link>
                ) : null}
              </Card.Footer>
            </Card>
            )
          })}
        </section>
      ) : null}
    </div>
  )
}

