import { cn } from '../../lib/cn.js'

/**
 * Consistent page title block: eyebrow, heading, optional description.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
  align = 'left',
}) {
  return (
    <header
      className={cn(
        'motion-safe:animate-fade-in-up',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  )
}
