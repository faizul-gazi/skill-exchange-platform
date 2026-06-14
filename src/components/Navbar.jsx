import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { layoutContainerClass } from '../layouts/container.js'
import { cn } from '../lib/cn.js'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { userId as getAuthUserId } from '../lib/userId.js'
import Button from './ui/Button.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const guestLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about', sectionId: 'about' },
  { label: 'Articles', href: '/#articles', sectionId: 'articles' },
  { label: 'Features', href: '/#features', sectionId: 'features' },
  { label: 'How It Works', href: '/#how-it-works', sectionId: 'how-it-works' },
]

const baseAuthLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Courses', href: '/courses' },
  { label: 'Profile', href: '/profile' },
]
const learnerLinks = [{ label: 'My Courses', href: '/my-courses' }]
/** Course-review badge (sum across courses you teach). Opens dedicated Reviews hub at /reviews. */
const reviewsNavLink = { label: 'Reviews', href: '/reviews', badgeKey: 'courseReviewsReceived' }
const bothRoleLinks = [
  { label: 'My Teaching', href: '/teaching-courses' },
  { label: 'Create Course', href: '/courses/create' },
  { label: 'Skill Exchange', href: '/skill-exchange' },
  { label: 'Requests', href: '/requests', badgeKey: 'pendingIncomingRequests' },
  { label: 'Chat', href: '/chat' },
  reviewsNavLink,
]
const teacherLinks = [
  { label: 'My Teaching', href: '/teaching-courses' },
  { label: 'Create Course', href: '/courses/create' },
]
const teacherAuthLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  ...teacherLinks,
  reviewsNavLink,
  { label: 'Profile', href: '/profile' },
]
const adminLinks = [{ label: 'Admin Dashboard', href: '/admin' }]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [pendingIncomingRequests, setPendingIncomingRequests] = useState(0)
  const [courseReviewsNavCount, setCourseReviewsNavCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('')
      return
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120 // Header offset
      
      if (window.scrollY < 80) {
        setActiveSection('home')
        return
      }

      const sections = [
        { id: 'about', el: document.getElementById('about') },
        { id: 'articles', el: document.getElementById('articles') },
        { id: 'features', el: document.getElementById('features') },
        { id: 'how-it-works', el: document.getElementById('how-it-works') },
      ]

      let current = 'home'
      for (const { id, el } of sections) {
        if (el) {
          const top = el.offsetTop
          if (scrollPosition >= top - 20) {
            current = id
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveSection(hash)
      } else if (window.scrollY < 80) {
        setActiveSection('home')
      }
    }
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [location.pathname, location.hash])

  const isLinkActive = (link, routerIsActive) => {
    if (!isAuthenticated && location.pathname === '/') {
      if (link.sectionId) {
        return activeSection === link.sectionId
      }
      return activeSection === 'home' && link.href === '/'
    }
    return routerIsActive
  }

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'both' || !user?.isApproved) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/requests', { params: { type: 'incoming' } })
        if (cancelled) return
        const pendingCount = (data?.data ?? []).filter((r) => r.status === 'pending').length
        setPendingIncomingRequests(pendingCount)
      } catch {
        if (!cancelled) setPendingIncomingRequests(0)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.isApproved, user?.role])

  useEffect(() => {
    const id = isAuthenticated && user ? getAuthUserId(user) : null
    const role = user?.role
    if (!id || (role !== 'teacher' && role !== 'both')) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get(`/courses/teacher/${id}`)
        if (cancelled) return
        const rows = Array.isArray(data?.data) ? data.data : []
        const sum = rows.reduce((acc, c) => acc + (Number(c?.reviewCount) || 0), 0)
        setCourseReviewsNavCount(sum)
      } catch {
        if (!cancelled) setCourseReviewsNavCount(0)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  const links = useMemo(() => {
    if (!isAuthenticated) return guestLinks
    if (user?.role === 'admin') return adminLinks
    if (user?.role === 'both') {
      return user?.isApproved
        ? [...baseAuthLinks, ...learnerLinks, ...bothRoleLinks]
        : [...baseAuthLinks, ...learnerLinks, reviewsNavLink]
    }
    if (user?.role === 'teacher') return teacherAuthLinks
    return [...baseAuthLinks, ...learnerLinks]
  }, [isAuthenticated, user?.isApproved, user?.role])

  const getLinkBadge = (link) => {
    if (link.badgeKey === 'pendingIncomingRequests') return pendingIncomingRequests
    if (link.badgeKey === 'courseReviewsReceived')
      return isAuthenticated && user && (user.role === 'teacher' || user.role === 'both')
        ? courseReviewsNavCount
        : 0
    return 0
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/', { replace: true })
  }

  const handleGuestSectionClick = (ev, link) => {
    if (!link.sectionId) {
      setOpen(false)
      return
    }
    if (location.pathname !== '/') {
      setOpen(false)
      return
    }
    ev.preventDefault()
    const target = document.getElementById(link.sectionId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `/#${link.sectionId}`)
    }
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/65 shadow-soft backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/55">
      <div className={`${layoutContainerClass} flex items-center justify-between gap-3 py-3 sm:gap-4`}>
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-900 transition hover:opacity-90 dark:text-white"
          onClick={() => setOpen(false)}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 text-xs font-bold text-white shadow-soft"
            aria-hidden
          >
            SX
          </span>
          <span className="bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-blue-400">
            SkillX
          </span>
        </Link>

        <nav
          className="hidden items-center gap-2 rounded-2xl border border-white/50 bg-white/50 px-2 py-1.5 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] lg:flex"
          aria-label="Primary"
        >
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={(ev) => handleGuestSectionClick(ev, link)}
              className={({ isActive }) => {
                const active = isLinkActive(link, isActive)
                return [
                  'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out',
                  active
                    ? 'bg-indigo-500/15 text-indigo-700 dark:bg-white/10 dark:text-indigo-200'
                    : 'text-slate-600 hover:-translate-y-px hover:bg-indigo-500/10 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-indigo-200',
                ].join(' ')
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                {link.label}
                {getLinkBadge(link) > 0 ? (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {getLinkBadge(link)}
                  </span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button variant="ghost" size="md" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="md" to="/login">
                Login
              </Button>
              <Button variant="accent" size="md" to="/register">
                Register
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/70 text-slate-700 shadow-soft backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-white/30 bg-white/90 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/85 lg:hidden ${open ? 'block' : 'hidden'}`}
      >
        <nav className={`${layoutContainerClass} flex flex-col gap-1 py-4`} aria-label="Mobile">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={(ev) => handleGuestSectionClick(ev, link)}
              className={({ isActive }) => {
                const active = isLinkActive(link, isActive)
                return cn(
                  'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-indigo-500/15 text-indigo-700 dark:bg-white/10 dark:text-indigo-200'
                    : 'text-slate-700 hover:bg-indigo-500/10 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-white/[0.08]',
                )
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                {link.label}
                {getLinkBadge(link) > 0 ? (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {getLinkBadge(link)}
                  </span>
                ) : null}
              </span>
            </NavLink>
          ))}
          <hr className="my-3 border-slate-200/90 dark:border-white/10" />
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <Button variant="outline" size="md" className="w-full" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <>
                <Button variant="outline" size="md" className="w-full" to="/login" onClick={() => setOpen(false)}>
                  Login
                </Button>
                <Button variant="accent" size="md" className="w-full" to="/register" onClick={() => setOpen(false)}>
                  Register
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
