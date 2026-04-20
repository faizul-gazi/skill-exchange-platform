import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn.js'

const inputClasses =
  'w-full rounded-xl border border-slate-200/90 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-soft ' +
  'backdrop-blur-md transition placeholder:text-slate-400 ' +
  'focus:border-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 ' +
  'dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 ' +
  'dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/25'

const Input = forwardRef(function Input(
  { id, label, hint, error, className, wrapperClassName, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? props.name ?? `input-${autoId.replace(/:/g, '')}`

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(inputClasses, error && 'border-rose-400/80 focus:ring-rose-400/30', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={hint && !error ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})

export default Input
