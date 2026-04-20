import { useCallback, useMemo, useState } from 'react'
import { cn } from '../lib/cn.js'
import { ToastContext } from './toastContext.js'

const TOAST_MS = 4800

function makeId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, variant) => {
      const id = makeId()
      setToasts((prev) => [...prev, { id, message, variant }])
      window.setTimeout(() => dismiss(id), TOAST_MS)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [dismiss, push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[100] flex flex-col items-end gap-2 px-4 sm:inset-x-auto sm:right-6 sm:top-24 sm:max-w-md"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const { message, variant } = toast
  const styles = {
    success:
      'border-emerald-200/90 bg-emerald-50/95 text-emerald-950 shadow-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-50',
    error:
      'border-rose-200/90 bg-rose-50/95 text-rose-950 shadow-rose-500/10 dark:border-rose-500/35 dark:bg-rose-950/90 dark:text-rose-50',
    info: 'border-indigo-200/90 bg-white/95 text-slate-900 shadow-indigo-500/10 dark:border-indigo-500/30 dark:bg-slate-900/95 dark:text-slate-50',
  }

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto motion-safe:animate-toast-in flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft-lg backdrop-blur-md transition hover:shadow-soft',
        styles[variant] ?? styles.info,
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        {variant === 'success' ? <CheckIcon /> : variant === 'error' ? <AlertIcon /> : <InfoIcon />}
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-current/60 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

