import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight ' +
  'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-slate-50 disabled:pointer-events-none disabled:opacity-50 ' +
  'dark:focus-visible:ring-indigo-400/60 dark:focus-visible:ring-offset-slate-900 ' +
  'active:scale-[0.98]'

const variants = {
  primary:
    'bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-soft ' +
    'hover:scale-[1.02] hover:shadow-soft-lg hover:brightness-105',
  secondary:
    'border border-slate-200/90 bg-white/80 text-slate-800 shadow-soft backdrop-blur-md ' +
    'hover:scale-[1.01] hover:border-indigo-200/60 hover:bg-white hover:shadow-md ' +
    'dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:border-indigo-500/25 dark:hover:bg-white/[0.12]',
  accent:
    'bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 text-white shadow-soft ' +
    'hover:scale-[1.02] hover:shadow-soft-lg hover:brightness-105',
  ghost:
    'text-slate-700 hover:scale-[1.02] hover:bg-slate-100/90 dark:text-slate-200 dark:hover:bg-white/[0.08]',
  outline:
    'border-2 border-indigo-400/50 bg-transparent text-indigo-700 hover:scale-[1.01] hover:border-indigo-400 hover:bg-indigo-500/10 ' +
    'dark:border-indigo-400/40 dark:text-indigo-200 dark:hover:bg-indigo-500/15',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  href,
  to,
  loading = false,
  children,
  disabled,
  ...rest
}) {
  const isDisabled = disabled || loading
  const cls = cn(base, variants[variant], sizes[size], className)

  const spinnerVariant =
    variant === 'primary' || variant === 'accent' ? 'onPrimary' : 'muted'

  const inner = loading ? (
    <>
      <LoadingSpinner size="sm" variant={spinnerVariant} decorative />
      {children}
    </>
  ) : (
    children
  )

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {inner}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    )
  }

  return (
    <button type={type} className={cls} disabled={isDisabled} aria-busy={loading} {...rest}>
      {inner}
    </button>
  )
}
