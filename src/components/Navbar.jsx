import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { layoutContainerClass } from '../layouts/container.js'
import { cn } from '../lib/cn.js'
import { useAuth } from '../context/useAuth.js'
import Button from './ui/Button.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const guestLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about', sectionId: 'about' },
  { label: 'Features', href: '/#features', sectionId: 'features' },
  { label: 'How It Works', href: '/#how-it-works', sectionId: 'how-it-works' },
  { label: 'Articles', href: '/#articles', sectionId: 'articles' },
]

const authLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Matches', href: '/matches' },
  { label: 'Requests', href: '/requests' },
  { label: 'Chat', href: '/chat' },
  { label: 'Profile', href: '/profile' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const links = isAuthenticated ? authLinks : guestLinks

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
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out',
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-700 dark:bg-white/10 dark:text-indigo-200'
                    : 'text-slate-600 hover:-translate-y-px hover:bg-indigo-500/10 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-indigo-200',
                ].join(' ')
              }
            >
              {link.label}
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
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-700 dark:bg-white/10 dark:text-indigo-200'
                    : 'text-slate-700 hover:bg-indigo-500/10 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-white/[0.08]',
                )
              }
              onClick={(ev) => handleGuestSectionClick(ev, link)}
            >
              {link.label}
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
