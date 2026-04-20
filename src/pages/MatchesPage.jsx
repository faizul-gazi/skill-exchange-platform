import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import { MatchGridSkeleton } from '../components/ui/Skeleton.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'
import { cn } from '../lib/cn.js'

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function MatchesPage() {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [matches, setMatches] = useState([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [skillFilter, setSkillFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const loading = isAuthenticated && fetching
  const normalizedSkillFilter = skillFilter.trim().toLowerCase()

  const filteredMatches = useMemo(() => {
    return matches.filter((user) => {
      const offeredLower = user.offered.map((s) => String(s).toLowerCase())
      const wantedLower = user.wanted.map((s) => String(s).toLowerCase())

      const hasSkillMatch =
        normalizedSkillFilter.length === 0 ||
        offeredLower.some((s) => s.includes(normalizedSkillFilter)) ||
        wantedLower.some((s) => s.includes(normalizedSkillFilter))

      const level = getMatchLevel(user.score)
      const hasLevelMatch = levelFilter === 'all' || level === levelFilter

      const hasCategoryMatch =
        categoryFilter === 'all' ||
        (categoryFilter === 'offered' && user.offered.length > 0) ||
        (categoryFilter === 'wanted' && user.wanted.length > 0) ||
        (categoryFilter === 'both' && user.offered.length > 0 && user.wanted.length > 0)

      return hasSkillMatch && hasLevelMatch && hasCategoryMatch
    })
  }, [matches, normalizedSkillFilter, levelFilter, categoryFilter])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    ;(async () => {
      setFetching(true)
      setError('')
      try {
        const { data } = await api.get('/matches')
        const rows = data.data ?? []
        const mapped = rows.map((u) => ({
          id: u.id,
          name: u.name,
          score: u.matchScore,
          offered: u.skillsOffered ?? [],
          wanted: u.skillsWanted ?? [],
        }))
        if (!cancelled) setMatches(mapped)
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, 'Could not load matches.'))
          setMatches([])
        }
      } finally {
        if (!cancelled) setFetching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const sendSkillRequest = useCallback(
    async (userId, topic) => {
      setActionId(userId)
      try {
        await api.post('/requests', { receiverId: userId, meetingLink: topic })
        toast.success('Request sent. They’ll see it in their incoming requests.')
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'Could not send request.'))
      } finally {
        setActionId(null)
      }
    },
    [toast],
  )

  if (!isAuthenticated) {
    return (
      <div className="space-y-8 md:space-y-10">
        <PageHeader
          eyebrow="Discover"
          title="Matches"
          description="Sign in to load personalized matches from the server based on your skills."
        />
        <EmptyState
          className="border-slate-200/90 py-16 dark:border-white/10"
          icon={<UsersSearchIcon />}
          title="Sign in required"
          description="Your match list is loaded from the API after authentication."
          action={
            <Button to="/login" variant="primary" size="md">
              Sign in
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow="Discover"
        title="Matches"
        description="People whose skills line up with yours. Higher scores mean stronger overlap between what you want and what they offer (and vice versa)."
      >
        {error ? (
          <AlertMessage variant="error" className="mt-2 max-w-2xl">
            {error}
          </AlertMessage>
        ) : null}
      </PageHeader>

      {loading ? <MatchGridSkeleton count={6} /> : null}

      {!loading && matches.length > 0 ? (
        <Card variant="elevated">
          <Card.Body className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="skill-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Skill
              </label>
              <input
                id="skill-filter"
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="Search by skill..."
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-sm shadow-soft focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="level-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Skill level
              </label>
              <select
                id="level-filter"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-sm shadow-soft focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              >
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="category-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-sm shadow-soft focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              >
                <option value="all">All categories</option>
                <option value="offered">Has offered skills</option>
                <option value="wanted">Has wanted skills</option>
                <option value="both">Has both offered and wanted</option>
              </select>
            </div>
          </Card.Body>
        </Card>
      ) : null}

      {!loading && matches.length === 0 && !error ? (
        <EmptyState
          className="mx-auto max-w-xl border-slate-200/90 py-14 dark:border-white/10"
          icon={<UsersSearchIcon />}
          title="No matches to show yet"
          description="Add skills you teach and skills you want to learn so we can suggest people who complement you. The more specific you are, the better your matches."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button to="/profile" variant="primary" size="md">
                Edit your skills
              </Button>
              <Button to="/dashboard" variant="secondary" size="md">
                Back to dashboard
              </Button>
            </div>
          }
        />
      ) : null}

      {!loading && matches.length > 0 && filteredMatches.length === 0 ? (
        <EmptyState
          className="mx-auto max-w-xl border-slate-200/90 py-14 dark:border-white/10"
          icon={<UsersSearchIcon />}
          title="No matches for current filters"
          description="Try a broader skill term or reset level/category filters."
          action={
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setSkillFilter('')
                setLevelFilter('all')
                setCategoryFilter('all')
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : null}

      {!loading && filteredMatches.length > 0 ? (
        <ul
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          role="list"
          aria-label="Suggested matches"
        >
          {filteredMatches.map((user, idx) => (
            <li key={user.id}>
              <Card
                variant="elevated"
                enter
                style={{ animationDelay: `${idx * 75}ms` }}
                className={cn(
                  'group relative flex h-full flex-col overflow-hidden',
                  'dark:hover:shadow-[0_20px_50px_-12px_rgba(79_70_229/0.25)]',
                )}
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-indigo-400/20 to-fuchsia-400/15 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <Card.Body className="relative flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-sm font-bold text-white shadow-soft"
                        aria-hidden
                      >
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/users/${user.id}`}
                          className="truncate text-lg font-semibold text-slate-900 underline-offset-2 hover:underline dark:text-white"
                        >
                          {user.name}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-500">SkillX member</p>
                      </div>
                    </div>
                    <MatchScoreBadge score={user.score} />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Offers
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Skills offered by ${user.name}`}>
                        {user.offered.map((s) => (
                          <li key={s}>
                            <span className="inline-block rounded-full border border-indigo-200/90 bg-indigo-50/90 px-2.5 py-0.5 text-xs font-medium text-indigo-900 transition duration-200 hover:scale-105 dark:border-indigo-500/35 dark:bg-indigo-950/50 dark:text-indigo-100">
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Wants
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Skills wanted by ${user.name}`}>
                        {user.wanted.map((s) => (
                          <li key={s}>
                            <span className="inline-block rounded-full border border-fuchsia-200/90 bg-fuchsia-50/90 px-2.5 py-0.5 text-xs font-medium text-fuchsia-900 transition duration-200 hover:scale-105 dark:border-fuchsia-500/35 dark:bg-fuchsia-950/40 dark:text-fuchsia-100">
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-slate-50/80 px-6 py-4 dark:bg-white/[0.03]">
                  <div className="mb-2">
                    <Button to={`/users/${user.id}`} variant="secondary" size="sm" className="w-full justify-center">
                      View profile
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full justify-center shadow-sm"
                    loading={actionId === user.id}
                    disabled={actionId != null && actionId !== user.id}
                    onClick={() => {
                      const topic =
                        user.offered?.[0] != null
                          ? `${user.offered[0]} · skill exchange`
                          : 'Skill exchange'
                      sendSkillRequest(user.id, topic)
                    }}
                  >
                    Send Request
                  </Button>
                </Card.Footer>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {error && !loading ? (
        <AlertMessage variant="info" role="note" className="max-w-2xl">
          <Link to="/profile" className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
            Update your profile
          </Link>{' '}
          and try again—richer skills help the matcher find better partners.
        </AlertMessage>
      ) : null}
    </div>
  )
}

function UsersSearchIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function MatchScoreBadge({ score }) {
  return (
    <div
      className="flex shrink-0 flex-col items-end gap-0.5"
      title="Estimated match score based on your profile"
    >
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-1 text-sm font-bold tabular-nums text-white shadow-sm',
          score >= 85
            ? 'from-emerald-500 to-teal-500'
            : score >= 75
              ? 'from-indigo-500 to-blue-500'
              : 'from-violet-500 to-fuchsia-500',
        )}
      >
        {score}%
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Match
      </span>
    </div>
  )
}

function getMatchLevel(score) {
  if (score >= 85) return 'expert'
  if (score >= 70) return 'intermediate'
  return 'beginner'
}
