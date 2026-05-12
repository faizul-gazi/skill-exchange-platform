import { Link } from 'react-router-dom'
import { layoutContainerClass } from '../layouts/container.js'

const footerColumns = [
  {
    title: 'Discover',
    links: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Features', to: '/features' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Articles', to: '/articles' },
    ],
  },
  {
    title: 'Courses',
    links: [
      { label: 'Browse courses', to: '/courses' },
      { label: 'Create course', to: '/courses/create' },
      { label: 'My teaching', to: '/teaching-courses' },
      { label: 'My courses', to: '/my-courses' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Skill Exchange', to: '/skill-exchange' },
      { label: 'Requests', to: '/requests' },
      { label: 'Chat', to: '/chat' },
      { label: 'Reviews', to: '/reviews' },
      { label: 'Session', to: '/session' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Profile', to: '/profile' },
      { label: 'Register', to: '/register' },
      { label: 'Log in', to: '/login' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/25 bg-white/50 shadow-[inset_0_1px_0_0_rgb(255_255_255/_0.6)] backdrop-blur-xl dark:border-white/[0.06] dark:bg-slate-950/50">
      <div className={`${layoutContainerClass} py-12 lg:py-14`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 text-xs font-bold text-white shadow-soft">
                SX
              </span>
              <span className="bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-blue-400">
                SkillX
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Learn from live courses, swap skills with peers, and keep feedback in one place—built for learners and
              teachers.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3" role="list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200/80 pt-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} SkillX. All rights reserved.</p>
          <Link
            to="/about"
            className="font-medium text-indigo-600 transition hover:underline dark:text-indigo-300"
          >
            About SkillX
          </Link>
        </div>
      </div>
    </footer>
  )
}
