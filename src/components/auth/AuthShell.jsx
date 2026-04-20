import { cn } from '../../lib/cn.js'

export default function AuthShell({ children, className }) {
  return (
    <div
      className={cn(
        'relative flex min-h-[min(720px,calc(100vh-10rem))] w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/30 px-4 py-12 shadow-soft-lg sm:px-8',
        'bg-gradient-to-br from-indigo-600/[0.12] via-fuchsia-500/[0.08] to-blue-600/[0.14] dark:from-indigo-500/[0.18] dark:via-fuchsia-600/[0.1] dark:to-slate-950/60',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/40 to-blue-400/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-gradient-to-br from-fuchsia-500/35 to-pink-400/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-400/10 blur-3xl dark:from-violet-500/15 dark:to-cyan-500/10"
        aria-hidden
      />
      <div className="relative z-[1] w-full max-w-md">{children}</div>
    </div>
  )
}
