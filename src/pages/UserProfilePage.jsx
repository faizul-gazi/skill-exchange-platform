import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'

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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)

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
          <Button to="/matches" variant="secondary" size="md">
            Back to matches
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
            <Link to="/matches" className="text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
              Return to matches
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
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">About</h3>
            </Card.Header>
            <Card.Body>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {user.about?.trim() || 'This member has not added an about section yet.'}
              </p>
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
