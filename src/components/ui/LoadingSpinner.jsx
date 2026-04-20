import { cn } from '../../lib/cn.js'

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-11 w-11 border-[3px]',
}

const variants = {
  /** For use on indigo / gradient buttons */
  onPrimary: 'border-white/35 border-t-white',
  /** Default: neutral ring */
  muted: 'border-indigo-200 border-t-indigo-600 dark:border-white/20 dark:border-t-indigo-400',
}

/**
 * Accessible loading indicator. Respects reduced motion via CSS (spinner stops).
 * Use `decorative` when paired with visible button text.
 */
export default function LoadingSpinner({
  size = 'md',
  variant = 'muted',
  className,
  label = 'Loading',
  decorative = false,
}) {
  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'status', 'aria-label': label })}
    >
      <span
        className={cn(
          'motion-safe:animate-ui-spin rounded-full',
          sizes[size],
          variants[variant] ?? variants.muted,
        )}
      />
      {!decorative ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}
