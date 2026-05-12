import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { useToast } from '../context/useToast.js'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatShortDate } from '../lib/formatDate.js'
import { formatBDT } from '../lib/currency.js'
import { userId as getAuthUserId } from '../lib/userId.js'

function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const toast = useToast()
  const { user: currentUser, isAuthenticated } = useAuth()
  const me = getAuthUserId(currentUser)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [profileReviews, setProfileReviews] = useState([])
  const [reviewsMeta, setReviewsMeta] = useState({ count: 0, averageRating: null })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [teacherCourses, setTeacherCourses] = useState([])
  const [teacherCoursesLoading, setTeacherCoursesLoading] = useState(false)
  const [exchangeReviewEligible, setExchangeReviewEligible] = useState(false)
  const [exchangeEligibilityLoading, setExchangeEligibilityLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchUser() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/users/${userId}`)
        if (!cancelled) {
          setUser(data?.user ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load this profile.'))
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchUser()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      setReviewsLoading(true)
      try {
        const { data } = await api.get(`/reviews/user/${userId}`)
        if (cancelled) return
        setProfileReviews(data?.data ?? [])
        setReviewsMeta(data?.meta ?? { count: 0, averageRating: null })
      } catch {
        if (!cancelled) {
          setProfileReviews([])
          setReviewsMeta({ count: 0, averageRating: null })
        }
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      setTeacherCoursesLoading(true)
      try {
        const { data } = await api.get(`/courses/teacher/${userId}`)
        if (!cancelled) setTeacherCourses(Array.isArray(data?.data) ? data.data : [])
      } catch {
        if (!cancelled) setTeacherCourses([])
      } finally {
        if (!cancelled) setTeacherCoursesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const showReviewComposerBase = Boolean(
    isAuthenticated &&
      currentUser?.role === 'both' &&
      currentUser?.isApproved &&
      me &&
      String(me) !== String(userId),
  )

  useEffect(() => {
    if (!showReviewComposerBase || !userId) return
    let cancelled = false
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      setExchangeEligibilityLoading(true)
      setExchangeReviewEligible(false)
      try {
        const { data } = await api.get(`/reviews/exchange-eligibility/${userId}`)
        if (!cancelled) setExchangeReviewEligible(Boolean(data?.eligible))
      } catch {
        if (!cancelled) setExchangeReviewEligible(false)
      } finally {
        if (!cancelled) setExchangeEligibilityLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showReviewComposerBase, userId])

  const eligibilityLoading = showReviewComposerBase ? exchangeEligibilityLoading : false
  const eligibilityEligible = showReviewComposerBase ? exchangeReviewEligible : false

  const myReviewOnThisProfile = profileReviews.find((r) => String(r.reviewerId) === String(me))
  const showAlreadyReviewedBanner = Boolean(showReviewComposerBase && myReviewOnThisProfile)
  const showReviewForm = Boolean(showReviewComposerBase && eligibilityEligible && !myReviewOnThisProfile)
  const showCompleteExchangeNotice = Boolean(
    showReviewComposerBase &&
      !myReviewOnThisProfile &&
      !eligibilityLoading &&
      !eligibilityEligible,
  )

  const submitProfileReview = async () => {
    if (!userId || !showReviewForm) return
    setReviewSubmitting(true)
    try {
      await api.post('/reviews', {
        userId,
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      })
      toast.success('Review submitted')
      setReviewComment('')
      setReviewRating(5)
      const { data } = await api.get(`/reviews/user/${userId}`)
      setProfileReviews(data?.data ?? [])
      setReviewsMeta(data?.meta ?? { count: 0, averageRating: null })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not submit review.'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  const offered = useMemo(() => (Array.isArray(user?.skillsOffered) ? user.skillsOffered : []), [user])
  const wanted = useMemo(() => (Array.isArray(user?.skillsWanted) ? user.skillsWanted : []), [user])
  const availability = useMemo(() => (Array.isArray(user?.availability) ? user.availability : []), [user])

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow="Member profile"
        title={user?.name ? `${user.name}'s profile` : 'Profile details'}
        description="Explore what this member offers, wants to learn, and when they are available."
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Button to={`/chat?peer=${userId}`} variant="outline" size="md">
            Send message
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={sendingRequest}
            disabled={!user || loading}
            onClick={async () => {
              if (!user) return
              setSendingRequest(true)
              try {
                const topic =
                  Array.isArray(user.skillsOffered) && user.skillsOffered[0]
                    ? `${user.skillsOffered[0]} · skill exchange`
                    : 'Skill exchange'
                await api.post('/requests', { receiverId: userId, meetingLink: topic })
                toast.success('Request sent. They’ll see it in their incoming requests.')
              } catch (err) {
                toast.error(getApiErrorMessage(err, 'Could not send request.'))
              } finally {
                setSendingRequest(false)
              }
            }}
          >
            Send Request
          </Button>
          <Button to="/skill-exchange" variant="secondary" size="md">
            Back to Skill Exchange
          </Button>
        </div>
      </PageHeader>

      {loading ? (
        <Card variant="elevated">
          <Card.Body>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading profile...</p>
          </Card.Body>
        </Card>
      ) : null}

      {!loading && error ? (
        <AlertMessage variant="error" className="max-w-2xl">
          {error}
        </AlertMessage>
      ) : null}

      {!loading && !error && !user ? (
        <EmptyState
          title="Profile not found"
          description="This user may no longer be available."
          action={
            <Link to="/skill-exchange" className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
              Return to Skill Exchange
            </Link>
          }
        />
      ) : null}

      {!loading && !error && user ? (
        <>
          <Card variant="elevated">
            <Card.Body className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.name} avatar`}
                  className="h-20 w-20 rounded-2xl border border-slate-200/90 object-cover shadow-soft dark:border-white/10"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-xl font-bold text-white shadow-soft">
                  {initials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-900 dark:text-white">{user.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                {user.headline?.trim() ? (
                  <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-300">{user.headline}</p>
                ) : null}
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">SkillX member</p>
              </div>
            </Card.Body>
          </Card>

          <Card variant="elevated">
            <Card.Header>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Courses they teach</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Each course shows learner ratings after the course is completed.
              </p>
            </Card.Header>
            <Card.Body className="space-y-3">
              {teacherCoursesLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading courses…</p>
              ) : teacherCourses.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No courses listed for this member yet.</p>
              ) : (
                <ul className="space-y-3" role="list">
                  {teacherCourses.map((course) => {
                    const lifecycle = course.lifecycleStatus ?? 'active'
                    const rc = course.reviewCount ?? 0
                    const ra = course.reviewAverage
                    return (
                      <li
                        key={course.id}
                        className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Link
                            to={`/courses/${course.id}`}
                            className="text-base font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                          >
                            {course.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5">
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
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatBDT(course.price)} · Schedule: {formatShortDate(course.schedule) || 'TBA'}
                        </p>
                        {rc > 0 && ra != null && Number.isFinite(Number(ra)) ? (
                          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                            <span className="font-medium text-slate-800 dark:text-slate-200">Course reviews:</span>{' '}
                            <span aria-hidden>
                              {'★'.repeat(Math.min(5, Math.max(1, Math.round(Number(ra)))))}
                            </span>{' '}
                            <span className="tabular-nums font-semibold">{Number(ra).toFixed(1)}</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {' '}
                              · {rc} {rc === 1 ? 'review' : 'reviews'}
                            </span>
                            <Link
                              to={`/courses/${course.id}#course-reviews`}
                              className="ml-2 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                            >
                              Read reviews
                            </Link>
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                            {lifecycle === 'completed'
                              ? 'No course reviews yet.'
                              : 'Reviews appear after the course is completed.'}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card.Body>
          </Card>

          <Card variant="elevated">
            <Card.Header>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">About</h3>
            </Card.Header>
            <Card.Body>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {user.about?.trim() || 'This member has not added an about section yet.'}
              </p>
            </Card.Body>
          </Card>

          <Card variant="elevated">
            <Card.Header>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Skill exchange reviews
                {reviewsMeta.averageRating != null ? (
                  <span className="ml-2 text-sm font-normal text-amber-700 dark:text-amber-300">
                    · {reviewsMeta.averageRating} avg ({reviewsMeta.count ?? profileReviews.length})
                  </span>
                ) : reviewsMeta.count ? (
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    · {reviewsMeta.count} total
                  </span>
                ) : null}
              </h3>
            </Card.Header>
            <Card.Body className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only members who completed a skill exchange together (both confirmed on Session) can leave feedback here.
              </p>
              {showAlreadyReviewedBanner ? (
                <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100">
                  You already reviewed this member ({myReviewOnThisProfile.rating}/5 on{' '}
                  {formatShortDate(myReviewOnThisProfile.createdAt)}).
                </p>
              ) : null}
              {showReviewComposerBase && !myReviewOnThisProfile && eligibilityLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Checking exchange history…</p>
              ) : null}
              {showCompleteExchangeNotice ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                  You can review this member only after you finish a skill exchange together and{' '}
                  <strong>both</strong> of you confirm completion from{' '}
                  <Link to="/session" className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
                    Session
                  </Link>
                  .
                </p>
              ) : null}
              {showReviewForm ? (
                <div className="space-y-3 rounded-xl border border-slate-200/80 p-4 dark:border-white/10">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You completed an exchange with this member — share how it went (optional comment).
                  </p>
                  <div>
                    <label htmlFor="review-rating" className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Rating
                    </label>
                    <select
                      id="review-rating"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} — {'★'.repeat(n)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="review-comment" className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Comment (optional)
                    </label>
                    <textarea
                      id="review-comment"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      maxLength={2000}
                      placeholder="How was the exchange?"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                  <Button type="button" variant="accent" size="sm" loading={reviewSubmitting} onClick={submitProfileReview}>
                    Submit review
                  </Button>
                </div>
              ) : null}

              {reviewsLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading reviews…</p>
              ) : profileReviews.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No public reviews yet.</p>
              ) : (
                <ul className="space-y-3" role="list">
                  {profileReviews.map((review) => (
                    <li key={review.id} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{review.reviewer?.name ?? 'Member'}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {formatShortDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                        {'★'.repeat(review.rating)} ({review.rating}/5)
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {review.comment?.trim() || 'No comment.'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <ProfileListCard title="Skills offered" items={offered} emptyText="No skills offered listed yet." tone="indigo" />
            <ProfileListCard title="Skills wanted" items={wanted} emptyText="No learning goals listed yet." tone="fuchsia" />
            <ProfileListCard title="Availability" items={availability} emptyText="No availability listed yet." tone="emerald" />
          </div>
        </>
      ) : null}
    </div>
  )
}

function ProfileListCard({ title, items, emptyText, tone }) {
  const toneClasses =
    tone === 'fuchsia'
      ? 'border-fuchsia-200/90 bg-fuchsia-50/80 text-fuchsia-900 dark:border-fuchsia-500/35 dark:bg-fuchsia-950/40 dark:text-fuchsia-100'
      : tone === 'emerald'
        ? 'border-emerald-200/90 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100'
        : 'border-indigo-200/90 bg-indigo-50/80 text-indigo-900 dark:border-indigo-500/35 dark:bg-indigo-950/40 dark:text-indigo-100'

  return (
    <Card variant="elevated">
      <Card.Header>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      </Card.Header>
      <Card.Body>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
        ) : (
          <ul className="flex flex-wrap gap-2" role="list">
            {items.map((item) => (
              <li key={item}>
                <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses}`}>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  )
}
