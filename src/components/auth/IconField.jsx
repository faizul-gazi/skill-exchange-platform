import { useId, useState } from 'react'
import { cn } from '../../lib/cn.js'

const fieldShell =
  'w-full rounded-xl border border-slate-200/90 bg-white/75 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-soft backdrop-blur-md transition ' +
  'placeholder:text-slate-400 focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 ' +
  'dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 ' +
  'dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/25'

const fieldShellPassword = 'pr-11'

export default function IconField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  icon,
  autoComplete,
  placeholder,
  disabled,
}) {
  const reactId = useId()
  const inputId = name ? `field-${name}-${reactId.replace(/:/g, '')}` : `field-${reactId.replace(/:/g, '')}`
  const errorId = `${inputId}-error`
  const isPassword = type === 'password'
  const [show, setShow] = useState(false)
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden
        >
          {icon}
        </span>
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            fieldShell,
            isPassword && fieldShellPassword,
            error && 'border-rose-400/90 focus:border-rose-400 focus:ring-rose-400/30 dark:border-rose-500/60',
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-slate-200"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  )
}

export function MailIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

export function LockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

export function UserIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
