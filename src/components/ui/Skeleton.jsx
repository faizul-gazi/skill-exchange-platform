import LoadingSpinner from './LoadingSpinner.jsx'
import { cn } from '../../lib/cn.js'

const pulse =
  'animate-pulse bg-slate-200/90 dark:bg-slate-700/55 motion-reduce:animate-none'

/**
 * Base skeleton block (pulse). Use for custom layouts.
 */
export function Skeleton({ className, ...rest }) {
  return <div className={cn('rounded-xl', pulse, className)} aria-hidden {...rest} />
}

/** Dashboard: stat cards + recent activity list */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 motion-safe:animate-fade-in md:space-y-10" aria-busy="true" aria-label="Loading dashboard">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="presentation">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-10 w-20" />
              <Skeleton className="mt-3 h-3 w-36" />
              <div className="mt-5 flex justify-end">
                <Skeleton className="h-12 w-12 rounded-2xl" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
        <div className="border-b border-slate-200/80 bg-slate-50/50 px-6 py-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <ul className="divide-y divide-slate-200/80 dark:divide-white/[0.08]" role="presentation">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex gap-4 px-6 py-4">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
              <Skeleton className="h-3 w-14 shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MatchCardSkeletonItem() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-8 w-14 rounded-full" />
            <Skeleton className="h-2 w-10" />
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <Skeleton className="h-3 w-16" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
          <div>
            <Skeleton className="h-3 w-14" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}

/** Matches grid placeholder */
export function MatchGridSkeleton({ count = 6 }) {
  return (
    <ul
      className="grid list-none gap-6 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading matches"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <MatchCardSkeletonItem />
        </li>
      ))}
    </ul>
  )
}

function RequestRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

/** Requests: incoming card + outgoing table area */
export function RequestsPageSkeleton() {
  return (
    <div className="space-y-8 motion-safe:animate-fade-in md:space-y-10" aria-busy="true" aria-label="Loading requests">
      <section>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
          <div className="border-b border-slate-200/80 bg-slate-50/60 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          </div>
          <div className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
            {[0, 1, 2].map((i) => (
              <RequestRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
          <div className="border-b border-slate-200/80 bg-slate-50/60 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm" role="presentation">
              <thead>
                <tr className="border-b border-slate-200/80 bg-white/50 dark:border-white/[0.08] dark:bg-white/[0.02]">
                  {[0, 1, 2, 3].map((i) => (
                    <th key={i} className="px-6 py-3">
                      <Skeleton className="h-3 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
                {[0, 1, 2, 3].map((row) => (
                  <tr key={row}>
                    {[0, 1, 2, 3].map((cell) => (
                      <td key={cell} className="px-6 py-4">
                        <Skeleton className="h-4 w-full max-w-[8rem]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-200/80 p-4 md:hidden dark:divide-white/[0.08]">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2 py-4 first:pt-0">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function StatBlockSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
      </div>
    </div>
  )
}

function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm" role="presentation">
        <thead>
          <tr className="border-b border-slate-200/90 bg-white dark:border-white/[0.08] dark:bg-slate-900/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton className="h-3 w-14" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.08]">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-6 py-3.5">
                  <Skeleton className="h-4 w-full max-w-[10rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Admin: stats + users table + requests table */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 motion-safe:animate-fade-in" aria-busy="true" aria-label="Loading admin data">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <StatBlockSkeleton key={i} />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <TableSkeleton cols={4} rows={5} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-slate-900/75">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
        </div>
        <TableSkeleton cols={6} rows={4} />
      </div>
    </div>
  )
}

function PeerRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

/** Chat: sidebar peer list + main thread area */
export function ChatLayoutSkeleton() {
  return (
    <div
      className="flex min-h-[min(640px,calc(100vh-11rem))] max-h-[min(640px,calc(100vh-11rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-soft-lg ring-1 ring-slate-200/40 sm:flex-row dark:border-white/10 dark:bg-slate-900 dark:ring-white/[0.06]"
      aria-busy="true"
      aria-label="Loading chat"
    >
      <aside className="flex max-h-44 w-full shrink-0 flex-col border-b border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-[#eef0f3] dark:border-white/10 dark:from-slate-950/95 dark:to-slate-950/90 sm:max-h-none sm:w-72 sm:border-b-0 sm:border-r">
        <div className="border-b border-slate-200/90 px-3 py-3 dark:border-white/10">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex-1 space-y-1 overflow-hidden p-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <PeerRowSkeleton key={i} />
          ))}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#e5e5e5] dark:bg-slate-900/80">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-300/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col px-3 py-4 sm:px-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <div className="flex w-full justify-start">
              <Skeleton className="h-14 w-[72%] max-w-md rounded-[18px] rounded-bl-[4px]" />
            </div>
            <div className="flex w-full justify-end">
              <Skeleton className="h-12 w-[55%] max-w-sm rounded-[18px] rounded-br-[4px]" />
            </div>
            <div className="flex w-full justify-start">
              <Skeleton className="h-20 w-[80%] max-w-lg rounded-[18px] rounded-bl-[4px]" />
            </div>
            <div className="flex w-full justify-center pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <LoadingSpinner size="sm" decorative />
                <span>Loading…</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-300/80 bg-white/95 px-3 py-3 dark:border-white/10 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Skeleton className="h-11 min-h-[44px] flex-1 rounded-2xl" />
            <Skeleton className="h-11 w-20 shrink-0 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Message thread while loading conversation (replaces spinner-only overlay) */
export function ChatMessageThreadSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-1" aria-busy="true" aria-label="Loading messages">
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[78%] max-w-lg rounded-[18px] rounded-bl-[4px]" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-11 w-[45%] max-w-xs rounded-[18px] rounded-br-[4px]" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-14 w-[65%] rounded-[18px] rounded-bl-[4px]" />
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <LoadingSpinner size="sm" label="Loading messages" />
      </div>
    </div>
  )
}
