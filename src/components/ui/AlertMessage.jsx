import { cn } from '../../lib/cn.js'

const variants = {
  error:
    'border-rose-200/90 bg-rose-50/90 text-rose-900 dark:border-rose-500/35 dark:bg-rose-950/50 dark:text-rose-100',
  success:
    'border-emerald-200/90 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-100',
  info: 'border-indigo-200/90 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/45 dark:text-indigo-100',
}

/**
 * Inline alert for page-level fetch errors, success confirmations, or hints.
 */
export default function AlertMessage({ variant = 'error', title, children, className, role = 'alert' }) {
  return (
    <div
      role={role}
      className={cn(
        'motion-safe:animate-fade-in rounded-2xl border px-4 py-3 text-sm shadow-sm backdrop-blur-sm',
        variants[variant] ?? variants.error,
        className,
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn(title && 'mt-1', 'leading-relaxed')}>{children}</div>
    </div>
  )
}
