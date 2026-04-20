import { createElement } from 'react'
import { cn } from '../../lib/cn.js'

const baseInteractive =
  'ui-hover-surface ' +
  'transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'

const variants = {
  solid:
    'rounded-2xl border border-slate-200/80 bg-white/90 text-slate-900 shadow-soft ' +
    'hover:-translate-y-0.5 hover:border-indigo-200/50 hover:shadow-soft-lg ' +
    'dark:border-white/[0.08] dark:bg-slate-900/75 dark:text-slate-100 dark:hover:border-indigo-500/25',
  glass:
    'rounded-2xl border border-white/40 bg-white/45 text-slate-900 shadow-soft-lg backdrop-blur-xl ' +
    'hover:-translate-y-1 hover:border-indigo-200/40 hover:shadow-soft-lg ' +
    'dark:border-white/[0.12] dark:bg-slate-950/40 dark:text-slate-100 dark:hover:border-indigo-500/30',
  elevated:
    'rounded-2xl border border-slate-200/60 bg-white text-slate-900 shadow-soft-lg ' +
    'hover:-translate-y-1 hover:border-indigo-200/45 hover:shadow-[0_20px_40px_-12px_rgb(79_70_229/0.18)] ' +
    'dark:border-white/[0.08] dark:bg-slate-900/90 dark:hover:border-indigo-500/25',
}

export default function Card({
  as: Tag = 'div',
  variant = 'solid',
  className,
  children,
  interactive = true,
  enter = false,
  ...rest
}) {
  return createElement(
    Tag,
    {
      className: cn(
        interactive && baseInteractive,
        enter && 'motion-safe:animate-card-in',
        variants[variant],
        className,
      ),
      ...rest,
    },
    children,
  )
}

Card.Header = function CardHeader({ className, children, ...rest }) {
  return (
    <div className={cn('border-b border-slate-200/70 px-6 py-4 dark:border-white/[0.08]', className)} {...rest}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn('p-6', className)} {...rest}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        'border-t border-slate-200/70 px-6 py-4 dark:border-white/[0.08]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
