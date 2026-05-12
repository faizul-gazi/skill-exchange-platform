import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatBDT } from '../lib/currency.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'

export default function TeachingCoursesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [studentsByCourse, setStudentsByCourse] = useState({})
  const [studentsLoadingCourseId, setStudentsLoadingCourseId] = useState('')
  const [linkDraftByCourse, setLinkDraftByCourse] = useState({})
  const [savingLinksCourseId, setSavingLinksCourseId] = useState('')
  const [requestingCompletionId, setRequestingCompletionId] = useState('')

  useEffect(() => {
    const me = userId(user)
    if (!me) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/courses/teacher/${me}`)
        if (!cancelled) {
          const rows = res.data?.data ?? []
          setCourses(rows)
          setLinkDraftByCourse(
            rows.reduce((acc, c) => {
              acc[c.id] = { meetingLink: c.meetingLink ?? '' }
              return acc
            }, {}),
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load your teaching courses.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const toggleStudents = async (courseId) => {
    if (studentsByCourse[courseId]) {
      setStudentsByCourse((prev) => {
        const next = { ...prev }
        delete next[courseId]
        return next
      })
      return
    }
    setStudentsLoadingCourseId(courseId)
    try {
      const res = await api.get(`/courses/${courseId}/enrollments`)
      setStudentsByCourse((prev) => ({ ...prev, [courseId]: res.data?.data ?? [] }))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load enrolled students.'))
    } finally {
      setStudentsLoadingCourseId('')
    }
  }

  const saveLinks = async (courseId) => {
    const draft = linkDraftByCourse[courseId] ?? { meetingLink: '' }
    setSavingLinksCourseId(courseId)
    try {
      const res = await api.patch(`/courses/${courseId}/links`, {
        meetingLink: draft.meetingLink,
      })
      const updated = res.data?.course
      if (updated) {
        setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)))
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save meeting link.'))
    } finally {
      setSavingLinksCourseId('')
    }
  }

  const requestCourseEnd = async (courseId) => {
    const confirmed = window.confirm(
      'Request to end this course? New enrollments will close until an admin approves completion.',
    )
    if (!confirmed) return
    setRequestingCompletionId(courseId)
    try {
      const res = await api.post(`/courses/${courseId}/request-completion`)
      const updated = res.data?.course
      if (updated) {
        setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)))
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit end-course request.'))
    } finally {
      setRequestingCompletionId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Teaching</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage the courses you created.</p>
        </div>
        <Button to="/courses/create" variant="accent">
          Create Course
        </Button>
      </div>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading your courses...</p> : null}

      {!loading && courses.length === 0 ? (
        <EmptyState
          title="No courses created"
          description="Start by creating your first course."
          className="border-slate-200/80 py-12 dark:border-white/10"
          action={<Button to="/courses/create">Create Course</Button>}
        />
      ) : null}

      {!loading && courses.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const lifecycle = course.lifecycleStatus ?? 'active'
            const linksLocked = lifecycle === 'completed'
            return (
            <Card key={course.id} variant="elevated">
              <Card.Body className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{course.title}</h2>
                  <div className="flex flex-col items-end gap-1">
                    {lifecycle === 'completion_pending' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/35 dark:text-amber-100">
                        End pending admin
                      </span>
                    ) : null}
                    {lifecycle === 'completed' ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                        Completed
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{course.description}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatBDT(course.price)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Schedule: {formatShortDate(course.schedule) || 'TBA'}
                </p>
                {(course.classDays ?? []).length > 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Class days: {(course.classDays ?? []).join(', ')}
                  </p>
                ) : null}
                {(course.reviewCount ?? 0) > 0 && course.reviewAverage != null ? (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Reviews:</span>{' '}
                    {Number(course.reviewAverage).toFixed(1)} ★ · {course.reviewCount}{' '}
                    {course.reviewCount === 1 ? 'rating' : 'ratings'}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-500">No course reviews yet.</p>
                )}
                <div className="space-y-2 rounded-xl border border-slate-200/70 p-3 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                    Live class link
                  </p>
                  {linksLocked ? (
                    <p className="text-xs text-slate-500 dark:text-slate-500">Editing is disabled for completed courses.</p>
                  ) : null}
                  <input
                    type="url"
                    placeholder="Meeting link (Google Meet / Zoom)"
                    disabled={linksLocked}
                    value={linkDraftByCourse[course.id]?.meetingLink ?? ''}
                    onChange={(e) =>
                      setLinkDraftByCourse((prev) => ({
                        ...prev,
                        [course.id]: { ...prev[course.id], meetingLink: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <Button
                    size="sm"
                    variant="accent"
                    disabled={linksLocked}
                    loading={savingLinksCourseId === course.id}
                    onClick={() => saveLinks(course.id)}
                  >
                    Save meeting link
                  </Button>
                </div>
                {lifecycle === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={requestingCompletionId === course.id}
                    onClick={() => requestCourseEnd(course.id)}
                  >
                    Request to end course
                  </Button>
                ) : null}
                {lifecycle === 'completion_pending' ? (
                  <p className="text-xs text-amber-800 dark:text-amber-200/90">
                    Waiting for admin to approve course completion. New enrollments are closed.
                  </p>
                ) : null}
              </Card.Body>
              <Card.Footer className="pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    View details
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={studentsLoadingCourseId === course.id}
                    onClick={() => toggleStudents(course.id)}
                  >
                    {studentsByCourse[course.id] ? 'Hide Students' : 'Enrolled Students'}
                  </Button>
                </div>
                {studentsByCourse[course.id] ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                      Enrolled Users
                    </p>
                    {studentsByCourse[course.id].length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No enrolled students yet.</p>
                    ) : (
                      studentsByCourse[course.id].map((row) => (
                        <div
                          key={row.id}
                          className="rounded-lg border border-slate-200/80 px-3 py-2 text-sm dark:border-white/10"
                        >
                          <div className="font-medium text-slate-900 dark:text-white">{row.user?.name ?? 'User'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{row.user?.email ?? ''}</div>
                        </div>
                      ))
                    )}
                  </div>
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

