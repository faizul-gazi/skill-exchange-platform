import { cn } from '../../lib/cn.js'

export function SkillTag({ label, onRemove, className, children }) {
  return (
    <span
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1.5 text-sm font-medium text-indigo-900 shadow-sm transition duration-200 ease-out hover:scale-[1.03] hover:shadow-md dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-100',
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-indigo-500 transition duration-200 hover:scale-110 hover:bg-indigo-200/80 hover:text-indigo-900 active:scale-95 dark:hover:bg-indigo-800/80 dark:hover:text-white"
          aria-label={`Remove ${label}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </span>
  )
}

export function LevelBadge({ level }) {
  const isExpert = level === 'expert'
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        isExpert
          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
          : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
      )}
    >
      {isExpert ? 'Expert' : 'Beginner'}
    </span>
  )
}
