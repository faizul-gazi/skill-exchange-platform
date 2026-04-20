import { cn } from '../../lib/cn.js'

const sizes = {
  default: {
    wrap: 'px-6 py-10',
    iconWrap: 'mb-4 h-14 w-14',
    title: 'text-base',
    desc: 'mt-2 max-w-sm text-sm leading-relaxed',
    action: 'mt-5',
  },
  compact: {
    wrap: 'px-4 py-8',
    iconWrap: 'mb-3 h-11 w-11',
    title: 'text-sm',
    desc: 'mt-1.5 max-w-xs text-xs leading-relaxed',
    action: 'mt-4',
  },
}

/**
 * Centered empty / zero-data state with optional icon, copy, and action.
 * Use `size="compact"` inside sidebars, tables, or tight panels.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'default',
}) {
  const s = sizes[size] ?? sizes.default

  return (
    <div
      className={cn(
        'motion-safe:animate-fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white/40 text-center shadow-sm transition-all duration-300 ease-out hover:border-indigo-200/60 hover:shadow-md dark:border-white/10 dark:from-slate-900/40 dark:to-slate-950/20 dark:hover:border-indigo-500/30',
        s.wrap,
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/15 text-indigo-600 shadow-inner dark:from-indigo-500/20 dark:text-indigo-300',
            s.iconWrap,
          )}
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <h3 className={cn('font-semibold text-slate-900 dark:text-white', s.title)}>{title}</h3>
      {description ? (
        <p className={cn('text-slate-600 dark:text-slate-400', s.desc)}>{description}</p>
      ) : null}
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  )
}
