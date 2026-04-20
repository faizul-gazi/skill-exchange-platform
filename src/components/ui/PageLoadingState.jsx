import LoadingSpinner from './LoadingSpinner.jsx'
import { cn } from '../../lib/cn.js'

/**
 * Centered loading panel with spinner — use while primary page data is fetching.
 */
export default function PageLoadingState({ label = 'Loading…', className }) {
  return (
    <div
      className={cn(
        'motion-safe:animate-fade-in flex min-h-[220px] flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200/80 bg-white/70 px-8 py-16 shadow-soft backdrop-blur-sm dark:border-white/[0.08] dark:bg-slate-900/50',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" decorative />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  )
}
