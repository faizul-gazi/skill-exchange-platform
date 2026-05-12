import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatBDT } from '../lib/currency.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'

export default function CourseDetailsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { courseId } = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  /** False until we've decided enrollment for completed-course access messaging. */
  const [enrollmentResolved, setEnrollmentResolved] = useState(false)
  const [recordingDate, setRecordingDate] = useState('')
  const [recordingLink, setRecordingLink] = useState('')
  const [savingRecording, setSavingRecording] = useState(false)
  const [requestingCompletion, setRequestingCompletion] = useState(false)
  const [courseReviewList, setCourseReviewList] = useState([])
  const [courseReviewsLoading, setCourseReviewsLoading] = useState(false)
  const [myCourseReview, setMyCourseReview] = useState(null)
  const [courseReviewRating, setCourseReviewRating] = useState(5)
  const [courseReviewComment, setCourseReviewComment] = useState('')
  const [courseReviewSubmitting, setCourseReviewSubmitting] = useState(false)

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/courses/${courseId}`)
        if (!cancelled) {
          setCourse(res.data?.course ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load course details.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId])

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    ;(async () => {
      setCourseReviewsLoading(true)
      try {
        const { data } = await api.get(`/courses/${courseId}/reviews`)
        if (cancelled) return
        setCourseReviewList(data?.data ?? [])
      } catch {
        if (!cancelled) setCourseReviewList([])
      } finally {
        if (!cancelled) setCourseReviewsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const isFree = Number(course?.price) === 0
  const youtubeEmbed = getYouTubeEmbedLink(course?.videoLink)
  const recordings = Array.isArray(course?.recordings) ? course.recordings : []
  const currentUserId = userId(user)
  const isOwner = course && String(course.teacherId) === String(currentUserId)
  const lifecycle = course?.lifecycleStatus ?? 'active'
  const isCourseCompleted = lifecycle === 'completed'
  const canJoinLiveClass =
    Boolean(course?.meetingLink) && (isOwner || isEnrolled) && !isCourseCompleted
  const canStillEditMaterials = isOwner && !isCourseCompleted
  const hasRecordingPayload =
    (Array.isArray(course?.recordings) && course.recordings.length > 0) ||
    Boolean(typeof course?.videoLink === 'string' && course.videoLink.trim())
  /** Server omits recording fields for completed courses unless viewer is owner or enrolled. */
  const canViewRecordings = !isCourseCompleted || isOwner || hasRecordingPayload
  const enrolledLearnerForReview =
    Boolean(
      user &&
        (user.role === 'learner' || user.role === 'both') &&
        currentUserId &&
        !isOwner &&
        isEnrolled &&
        isCourseCompleted,
    )

  useEffect(() => {
    if (!course?.id) return
    if (isOwner) {
      const t = setTimeout(() => setEnrollmentResolved(true), 0)
      return () => clearTimeout(t)
    }
    if (!currentUserId) {
      const t = setTimeout(() => setEnrollmentResolved(true), 0)
      return () => clearTimeout(t)
    }
    let cancelled = false
    const resetTimer = setTimeout(() => {
      setEnrollmentResolved(false)
      setIsEnrolled(false)
    }, 0)
    ;(async () => {
      try {
        const res = await api.get('/enrollments/me')
        if (cancelled) return
        const rows = res.data?.data ?? []
        const enrolled = rows.some((row) => String(row.courseId) === String(course.id))
        setIsEnrolled(enrolled)
      } catch {
        if (!cancelled) setIsEnrolled(false)
      } finally {
        if (!cancelled) setEnrollmentResolved(true)
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(resetTimer)
    }
  }, [course?.id, currentUserId, isOwner])

  useEffect(() => {
    if (!isOwner || !course?.id) return
    let cancelled = false
    ;(async () => {
      setStudentsLoading(true)
      try {
        const res = await api.get(`/courses/${course.id}/enrollments`)
        if (!cancelled) setStudents(res.data?.data ?? [])
      } catch {
        if (!cancelled) setStudents([])
      } finally {
        if (!cancelled) setStudentsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [course?.id, isOwner])

  useEffect(() => {
    if (!course?.id || !enrolledLearnerForReview) {
      const t = setTimeout(() => setMyCourseReview(null), 0)
      return () => clearTimeout(t)
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get(`/courses/${course.id}/reviews/me`)
        if (!cancelled) setMyCourseReview(data?.data ?? null)
      } catch {
        if (!cancelled) setMyCourseReview(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [course?.id, enrolledLearnerForReview])

  const submitCourseReview = async () => {
    if (!course?.id || !enrolledLearnerForReview || myCourseReview) return
    setCourseReviewSubmitting(true)
    try {
      const { data } = await api.post(`/courses/${course.id}/reviews`, {
        rating: courseReviewRating,
        comment: courseReviewComment.trim(),
      })
      toast.success(data?.message ?? 'Review posted')
      setMyCourseReview(data?.data ?? null)
      setCourseReviewComment('')
      setCourseReviewRating(5)
      if (data?.course) {
        setCourse((prev) =>
          prev ?
            {
              ...prev,
              reviewAverage: data.course.reviewAverage,
              reviewCount: data.course.reviewCount,
            }
          : prev,
        )
      }
      const listRes = await api.get(`/courses/${course.id}/reviews`)
      setCourseReviewList(listRes.data?.data ?? [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not post review.'))
    } finally {
      setCourseReviewSubmitting(false)
    }
  }

  const requestEndCourse = async () => {
    if (!isOwner || !course?.id || lifecycle !== 'active') return
    const confirmed = window.confirm(
      'Request to end this course? New enrollments will close immediately. An admin must approve before the course is marked completed.',
    )
    if (!confirmed) return
    setRequestingCompletion(true)
    setError('')
    try {
      const res = await api.post(`/courses/${course.id}/request-completion`)
      if (res.data?.course) setCourse(res.data.course)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit end-course request.'))
    } finally {
      setRequestingCompletion(false)
    }
  }

  const addRecording = async () => {
    if (!recordingDate || !recordingLink.trim()) return
    setSavingRecording(true)
    setError('')
    try {
      const res = await api.post(`/courses/${course.id}/recordings`, {
        date: recordingDate,
        videoLink: recordingLink.trim(),
      })
      setCourse(res.data?.course ?? course)
      setRecordingDate('')
      setRecordingLink('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add recording.'))
    } finally {
      setSavingRecording(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading course...</p> : null}
      {!loading && course ? (
        <Card variant="elevated">
          <Card.Body className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
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
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                    End pending admin
                  </span>
                ) : null}
                {lifecycle === 'completed' ? (
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                    Completed
                  </span>
                ) : null}
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400">{course.description}</p>
            {!isOwner && !isEnrolled && lifecycle !== 'active' ? (
              <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                This course is not accepting new enrollments.
              </p>
            ) : null}
            {isEnrolled && lifecycle === 'completed' ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Course completed — you still have access to recordings below.
              </p>
            ) : null}
            {isEnrolled && lifecycle === 'completion_pending' ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This course is closing: new enrollments are paused while an admin reviews the teacher&apos;s request.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-400">
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
                <div className="sm:col-span-2">
                  <span className="font-medium text-slate-800 dark:text-slate-200">Student rating:</span>{' '}
                  <CourseRatingSummary average={course.reviewAverage} count={course.reviewCount} />
                </div>
              ) : null}
            </div>
            {canJoinLiveClass ? (
              <div>
                <a
                  href={course.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Join Live Class
                </a>
              </div>
            ) : null}
            {isOwner ? (
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Course lifecycle</h2>
                {lifecycle === 'active' ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    When you are done teaching, request to end the course. New enrollments will stop immediately; an
                    admin will approve before the course is marked completed (live class link then closes for students;
                    recordings stay available).
                  </p>
                ) : null}
                {lifecycle === 'completion_pending' ? (
                  <p className="text-sm text-amber-900 dark:text-amber-100/90">
                    End request sent. New enrollments are closed. Waiting for admin approval to mark this course
                    completed.
                  </p>
                ) : null}
                {lifecycle === 'completed' ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    This course is completed. Learners keep read-only access to recordings; live class and edits are
                    closed.
                  </p>
                ) : null}
                {lifecycle === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={requestingCompletion}
                    onClick={requestEndCourse}
                  >
                    Request to end course
                  </Button>
                ) : null}
              </div>
            ) : null}
            {isCourseCompleted && enrollmentResolved && !isOwner && !isEnrolled ? (
              <p className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                Recorded classes are available only to enrolled students for this completed course.
              </p>
            ) : null}
            {canStillEditMaterials ? (
              <div className="space-y-2 rounded-xl border border-slate-200/80 p-4 dark:border-white/10">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Recorded Class</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={recordingDate}
                    onChange={(e) => setRecordingDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="url"
                    placeholder="video link"
                    value={recordingLink}
                    onChange={(e) => setRecordingLink(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={addRecording}
                  disabled={savingRecording}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {savingRecording ? 'Saving...' : 'Submit Recording'}
                </button>
              </div>
            ) : null}

            {canViewRecordings && recordings.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recorded Classes</h2>
                <div className="space-y-2">
                  {recordings.map((rec, idx) => (
                    <div key={`${rec.videoLink}-${idx}`} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                      <p className="text-sm text-slate-600 dark:text-slate-300">Date: {formatShortDate(rec.date)}</p>
                      <a
                        href={rec.videoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                      >
                        Watch Recording
                      </a>
                      {getYouTubeEmbedLink(rec.videoLink) ? (
                        <div className="mt-2 aspect-video overflow-hidden rounded-lg border border-slate-200/80 dark:border-white/10">
                          <iframe
                            src={getYouTubeEmbedLink(rec.videoLink)}
                            title={`recording-${idx}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : canViewRecordings && youtubeEmbed ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recorded Class</h2>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10">
                  <iframe
                    src={youtubeEmbed}
                    title="Recorded class video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : null}

            <section id="course-reviews" className="scroll-mt-24 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Course reviews</h2>
              {isCourseCompleted ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Only enrolled students can rate this course, and only after it is marked{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">completed</span>.
                </p>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Reviews unlock when this course is completed. Average rating will appear here.
                </p>
              )}

              {enrolledLearnerForReview ? (
                myCourseReview ? (
                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/25 dark:text-emerald-100">
                    <span className="font-semibold">Your review:</span>{' '}
                    <span className="text-amber-700 dark:text-amber-300">
                      {'★'.repeat(myCourseReview.rating)} ({myCourseReview.rating}/5)
                    </span>
                    {myCourseReview.comment?.trim() ? (
                      <span className="mt-1 block text-emerald-900/90 dark:text-emerald-100/90">{myCourseReview.comment}</span>
                    ) : (
                      <span className="mt-1 block text-emerald-800/80 dark:text-emerald-200/80">No comment.</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 to-white p-4 dark:border-indigo-500/25 dark:from-indigo-950/30 dark:to-slate-900/40">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Share your experience</p>
                    <label htmlFor="course-review-rating" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Rating
                    </label>
                    <select
                      id="course-review-rating"
                      value={courseReviewRating}
                      onChange={(e) => setCourseReviewRating(Number(e.target.value))}
                      className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ({'★'.repeat(n)})
                        </option>
                      ))}
                    </select>
                    <label htmlFor="course-review-comment" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Comment (optional)
                    </label>
                    <textarea
                      id="course-review-comment"
                      rows={3}
                      maxLength={1200}
                      value={courseReviewComment}
                      onChange={(e) => setCourseReviewComment(e.target.value)}
                      placeholder="What helped you most? Would you recommend this course?"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    <Button loading={courseReviewSubmitting} size="sm" variant="accent" onClick={submitCourseReview}>
                      Submit review
                    </Button>
                  </div>
                )
              ) : null}

              {courseReviewsLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading reviews…</p>
              ) : courseReviewList.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p>
              ) : (
                <ul className="space-y-3" role="list">
                  {courseReviewList.map((rev) => (
                    <li
                      key={rev.id}
                      className="rounded-xl border border-slate-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{rev.reviewer?.name ?? 'Student'}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-500">{formatShortDate(rev.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                        {'★'.repeat(rev.rating)} ({rev.rating}/5)
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {rev.comment?.trim() || 'No comment.'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {isOwner ? (
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Organizer Dashboard</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Start date: {formatShortDate(course.schedule) || 'TBA'} · Enrolled students: {students.length}
                  {(course.reviewCount ?? 0) > 0 ? (
                    <>
                      {' · '}
                      <span className="text-amber-800 dark:text-amber-200">
                        Rating {course.reviewAverage ?? '–'} ★ ({course.reviewCount} review
                        {(course.reviewCount ?? 0) === 1 ? '' : 's'})
                      </span>
                    </>
                  ) : (
                    <>
                      {' · '}
                      <span>No course reviews yet</span>
                    </>
                  )}
                </p>
                {studentsLoading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading enrolled students...</p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No students enrolled yet.</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((row) => (
                      <div key={row.id} className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/50">
                        <div className="font-medium text-slate-900 dark:text-white">{row.user?.name ?? 'User'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{row.user?.email ?? ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </Card.Body>
        </Card>
      ) : null}
    </div>
  )
}

function CourseRatingSummary({ average, count }) {
  const c = Number(count) || 0
  const avg = average != null ? Number(average) : NaN
  if (c < 1 || !Number.isFinite(avg)) return null
  const stars = Math.min(5, Math.max(1, Math.round(avg)))
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-amber-600 dark:text-amber-300" aria-hidden>
        {'★'.repeat(stars)}
      </span>
      <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{avg.toFixed(1)}</span>
      <span className="text-slate-500 dark:text-slate-400">
        ({c} {c === 1 ? 'review' : 'reviews'})
      </span>
    </span>
  )
}

function getYouTubeEmbedLink(url) {
  if (typeof url !== 'string' || !url.trim()) return ''
  try {
    const parsed = new URL(url.trim())
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : ''
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    return ''
  } catch {
    return ''
  }
}

