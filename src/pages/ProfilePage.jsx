import { useEffect, useState } from 'react'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useToast } from '../context/useToast.js'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { LevelBadge, SkillTag } from '../components/profile/SkillTag.jsx'
import { cn } from '../lib/cn.js'

const AVAIL_PRESETS = ['Weekday evenings', 'Weekends', 'Mornings', 'Flexible', 'Async only']

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeName(s) {
  return s.trim().replace(/\s+/g, ' ')
}

function toSkillItems(values = [], withLevel = false) {
  if (!Array.isArray(values)) return []
  return values
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => {
      const name = normalizeName(value)
      return withLevel ? { id: name.toLowerCase(), name, level: 'expert' } : { id: name.toLowerCase(), name }
    })
}

function toAvailabilityItems(values = []) {
  if (!Array.isArray(values)) return []
  return values
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => {
      const label = normalizeName(value)
      return { id: label.toLowerCase(), label }
    })
}

export default function ProfilePage() {
  const toast = useToast()
  const { user, updateUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [offered, setOffered] = useState([])
  const [wanted, setWanted] = useState([])
  const [availability, setAvailability] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [isEditing, setIsEditing] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadFromApi() {
      setLoadingProfile(true)
      try {
        const { data } = await api.get('/users/me')
        const profile = data?.user ?? {}
        if (cancelled) return
        setDisplayName(profile.name ?? '')
        setAvatarUrl(profile.avatarUrl ?? '')
        setAvatarPreview('')
        setOffered(toSkillItems(profile.skillsOffered, true))
        setWanted(toSkillItems(profile.skillsWanted))
        setAvailability(toAvailabilityItems(profile.availability))
        updateUser(profile)
      } catch {
        if (!cancelled) {
          toast.error('Could not load your profile. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false)
        }
      }
    }
    loadFromApi()
    return () => {
      cancelled = true
    }
  }, [toast, updateUser])

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setAvatarPreview(result)
      setAvatarUrl(result)
    }
    reader.onerror = () => {
      toast.error('Could not read selected image.')
    }
    reader.readAsDataURL(file)
  }

  const [offerInput, setOfferInput] = useState('')
  const [offerLevel, setOfferLevel] = useState('expert')
  const [wantedInput, setWantedInput] = useState('')
  const [availInput, setAvailInput] = useState('')

  const save = async () => {
    setSavingProfile(true)
    try {
      const payload = {
        name: normalizeName(displayName),
        avatarUrl,
        skillsOffered: offered.map((item) => item.name),
        skillsWanted: wanted.map((item) => item.name),
        availability: availability.map((item) => item.label),
      }
      if (!payload.name) {
        toast.error('Name is required.')
        setSavingProfile(false)
        return
      }
      const { data } = await api.put('/users/me', payload)
      const saved = data?.user ?? null
      if (saved) {
        setDisplayName(saved.name ?? '')
        setAvatarUrl(saved.avatarUrl ?? '')
        setAvatarPreview('')
        setOffered(toSkillItems(saved.skillsOffered, true))
        setWanted(toSkillItems(saved.skillsWanted))
        setAvailability(toAvailabilityItems(saved.availability))
        updateUser(saved)
      }
      setIsEditing(false)
      toast.success('Profile saved.')
    } catch {
      toast.error('Could not save profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  const hasDuplicate = (name, list, key = 'name') => {
    const n = normalizeName(name).toLowerCase()
    if (!n) return true
    return list.some((x) => x[key].toLowerCase() === n)
  }

  const addOffered = (e) => {
    e.preventDefault()
    const name = normalizeName(offerInput)
    if (!name) return
    if (hasDuplicate(name, offered)) {
      toast.info('That skill is already in your list.')
      return
    }
    const next = [...offered, { id: makeId(), name, level: offerLevel }]
    setOffered(next)
    setOfferInput('')
  }

  const removeOffered = (id) => {
    const next = offered.filter((x) => x.id !== id)
    setOffered(next)
  }

  const addWanted = (e) => {
    e.preventDefault()
    const name = normalizeName(wantedInput)
    if (!name) return
    if (hasDuplicate(name, wanted)) {
      toast.info('That topic is already on your wishlist.')
      return
    }
    const next = [...wanted, { id: makeId(), name }]
    setWanted(next)
    setWantedInput('')
  }

  const removeWanted = (id) => {
    const next = wanted.filter((x) => x.id !== id)
    setWanted(next)
  }

  const addAvailability = (label) => {
    const l = normalizeName(label)
    if (!l) return
    if (availability.some((x) => x.label.toLowerCase() === l.toLowerCase())) {
      toast.info('You already have that availability tag.')
      return
    }
    const next = [...availability, { id: makeId(), label: l }]
    setAvailability(next)
    setAvailInput('')
  }

  const addAvailSubmit = (e) => {
    e.preventDefault()
    addAvailability(availInput)
  }

  const removeAvailability = (id) => {
    const next = availability.filter((x) => x.id !== id)
    setAvailability(next)
  }

  const togglePreset = (preset) => {
    const existing = availability.find((x) => x.label.toLowerCase() === preset.toLowerCase())
    if (existing) {
      removeAvailability(existing.id)
    } else {
      addAvailability(preset)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 md:space-y-10">
      <PageHeader
        eyebrow="Your profile"
        title="Skills & availability"
        description={
          `Tag what you teach, what you want to learn, and when you're free. Signed in as ${user?.email ?? 'your account'}.`
        }
      />

      {loadingProfile ? (
        <Card variant="elevated">
          <Card.Body>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your profile...</p>
          </Card.Body>
        </Card>
      ) : null}

      <Card variant="elevated">
        <Card.Body className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={avatarPreview || avatarUrl || 'https://via.placeholder.com/96?text=User'}
                alt="Profile avatar"
                className="h-20 w-20 rounded-2xl border border-slate-200/90 object-cover shadow-soft dark:border-white/10"
              />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-900 dark:text-white">
                  {normalizeName(displayName || 'Unnamed user')}
                </h2>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant={isEditing ? 'secondary' : 'primary'}
              onClick={() => setIsEditing((v) => !v)}
              disabled={loadingProfile || savingProfile}
            >
              {isEditing ? 'Done editing' : 'Edit profile'}
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">Top skills</p>
            <div className="flex flex-wrap gap-2">
              {offered.slice(0, 6).map((skill) => (
                <span
                  key={`summary-offered-${skill.id}`}
                  className="rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1 text-xs font-medium text-indigo-900 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-100"
                >
                  {skill.name}
                </span>
              ))}
              {wanted.slice(0, 6).map((skill) => (
                <span
                  key={`summary-wanted-${skill.id}`}
                  className="rounded-full border border-fuchsia-200/80 bg-fuchsia-50/90 px-3 py-1 text-xs font-medium text-fuchsia-900 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/15 dark:text-fuchsia-100"
                >
                  {skill.name}
                </span>
              ))}
              {offered.length + wanted.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Add skills to personalize your profile.</p>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Update your display name and profile image.</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={avatarPreview || avatarUrl || 'https://via.placeholder.com/96?text=User'}
              alt="Profile preview"
              className="h-24 w-24 rounded-full border border-slate-200/90 object-cover shadow-soft dark:border-white/10"
            />
            <div className="flex-1 space-y-3">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm shadow-soft backdrop-blur placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="profile-image" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Profile image
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-300 dark:file:bg-white/[0.08] dark:file:text-indigo-200"
                />
              </div>
            </div>
              </div>
            </div>
          ) : null}
        </Card.Body>
      </Card>

      {/* Skills offered */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Skills you offer</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add each skill as a tag and set whether you teach at a beginner-friendly or expert level.
          </p>
        </Card.Header>
        <Card.Body className="space-y-4">
          <div className="flex flex-wrap gap-2" role="list" aria-label="Skills offered">
            {offered.length === 0 ? (
              <EmptyState
                className="w-full border-indigo-200/40 py-8 dark:border-indigo-500/20"
                icon={<SparklesIcon />}
                title="No skills offered yet"
                description="Add what you can teach—others will find you when their goals match yours."
              />
            ) : (
              offered.map((s) => (
                <span key={s.id} role="listitem">
                  <SkillTag label={s.name} onRemove={isEditing ? () => removeOffered(s.id) : undefined}>
                    <LevelBadge level={s.level} />
                  </SkillTag>
                </span>
              ))
            )}
          </div>

          {isEditing ? (
            <form onSubmit={addOffered} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="offer-skill" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                New skill
              </label>
              <input
                id="offer-skill"
                type="text"
                value={offerInput}
                onChange={(e) => setOfferInput(e.target.value)}
                placeholder="e.g. React, Guitar, Spanish"
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm shadow-soft backdrop-blur placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              />
            </div>
            <fieldset className="flex shrink-0 flex-col gap-1.5 sm:min-w-[200px]">
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">Level</legend>
              <div
                className="flex rounded-xl border border-slate-200/90 bg-slate-50/80 p-1 dark:border-white/10 dark:bg-white/[0.04]"
                role="group"
                aria-label="Skill level"
              >
                {['beginner', 'expert'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setOfferLevel(lvl)}
                    className={cn(
                      'flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                      offerLevel === lvl
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                    )}
                  >
                    {lvl === 'beginner' ? 'Beginner' : 'Expert'}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button type="submit" variant="primary" size="md" className="shrink-0 sm:mb-0">
              Add
            </Button>
            </form>
          ) : null}
        </Card.Body>
      </Card>

      {/* Skills wanted */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Skills you want</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stack tags for topics you&apos;d like to learn from others.
          </p>
        </Card.Header>
        <Card.Body className="space-y-4">
          <div className="flex flex-wrap gap-2" role="list" aria-label="Skills wanted">
            {wanted.length === 0 ? (
              <EmptyState
                className="w-full border-fuchsia-200/40 py-8 dark:border-fuchsia-500/20"
                icon={<TargetIcon />}
                title="Nothing on your wishlist"
                description="Tag topics you want to learn so we can suggest better matches."
              />
            ) : (
              wanted.map((s) => (
                <span key={s.id} role="listitem">
                  <SkillTag
                    label={s.name}
                    onRemove={isEditing ? () => removeWanted(s.id) : undefined}
                    className="border-fuchsia-200/80 bg-fuchsia-50/90 text-fuchsia-950 dark:border-fuchsia-500/30 dark:bg-fuchsia-950/40 dark:text-fuchsia-100"
                  />
                </span>
              ))
            )}
          </div>

          {isEditing ? (
            <form onSubmit={addWanted} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="wanted-skill" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Add a skill to learn
              </label>
              <input
                id="wanted-skill"
                type="text"
                value={wantedInput}
                onChange={(e) => setWantedInput(e.target.value)}
                placeholder="e.g. Public speaking, Piano"
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm shadow-soft backdrop-blur placeholder:text-slate-400 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              />
            </div>
            <Button type="submit" variant="accent" size="md" className="shrink-0">
              Add
            </Button>
            </form>
          ) : null}
        </Card.Body>
      </Card>

      {/* Availability */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Availability</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tap presets or add your own tags for when you&apos;re typically free to meet.
          </p>
        </Card.Header>
        <Card.Body className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
            Quick add
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAIL_PRESETS.map((preset) => {
              const on = availability.some((x) => x.label.toLowerCase() === preset.toLowerCase())
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => togglePreset(preset)}
                  disabled={!isEditing}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55',
                    on
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm dark:border-indigo-400'
                      : 'border-slate-200/90 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]',
                  )}
                >
                  {preset}
                </button>
              )
            })}
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
            Your availability tags
          </p>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Availability tags">
            {availability.length === 0 ? (
              <EmptyState
                className="w-full border-emerald-200/40 py-8 dark:border-emerald-500/20"
                icon={<ClockIcon />}
                title="No availability tags"
                description="Use quick presets or add custom windows so people know when to reach out."
              />
            ) : (
              availability.map((x) => (
                <span key={x.id} role="listitem">
                  <SkillTag
                    label={x.label}
                    onRemove={isEditing ? () => removeAvailability(x.id) : undefined}
                    className="border-emerald-200/80 bg-emerald-50/90 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-100"
                  />
                </span>
              ))
            )}
          </div>

          {isEditing ? (
            <form onSubmit={addAvailSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="avail-custom" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Custom availability tag
              </label>
              <input
                id="avail-custom"
                type="text"
                value={availInput}
                onChange={(e) => setAvailInput(e.target.value)}
                placeholder="e.g. Tue/Thu after 7pm"
                className="w-full rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm shadow-soft backdrop-blur placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              />
            </div>
            <Button type="submit" variant="secondary" size="md" className="shrink-0">
              Add tag
            </Button>
            </form>
          ) : null}
        </Card.Body>
      </Card>

      <div className="flex justify-end gap-3 pb-4">
        <Button
          type="button"
          variant="secondary"
          onClick={save}
          loading={savingProfile}
          disabled={loadingProfile || !isEditing}
        >
          Save profile
        </Button>
      </div>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 17a5 5 0 100-10 5 5 0 000 10z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
