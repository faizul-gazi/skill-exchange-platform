import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { formatShortDate } from '../lib/formatDate.js'
import { userId } from '../lib/userId.js'

export default function ReviewsPage() {
  const { user } = useAuth()
  const me = userId(user)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ count: 0, averageRating: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!me) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/reviews/user/${me}`)
        if (cancelled) return
        setRows(data?.data ?? [])
        setMeta(data?.meta ?? { count: 0, averageRating: null })
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Could not load reviews.'))
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [me])

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow="Feedback"
        title="Your reviews"
        description={`Total ${meta.count ?? 0} reviews${meta.averageRating != null ? ` · ${meta.averageRating} average` : ''}.`}
      >
        {error ? (
          <AlertMessage variant="error" className="mt-2 max-w-2xl">
            {error}
          </AlertMessage>
        ) : null}
      </PageHeader>

      {!loading && rows.length === 0 && !error ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews you receive after sessions will appear here."
          action={
            <Link to="/matches" className="text-sm font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
              Explore matches
            </Link>
          }
        />
      ) : null}

      {loading ? (
        <Card variant="elevated">
          <Card.Body>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading reviews...</p>
          </Card.Body>
        </Card>
      ) : null}

      {!loading && rows.length > 0 ? (
        <ul className="grid gap-4" role="list">
          {rows.map((review) => (
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
                  <p className="text-sm text-amber-600 dark:text-amber-300">{'★'.repeat(review.rating)} ({review.rating}/5)</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {review.comment?.trim() ? review.comment : 'No comment provided.'}
                  </p>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
