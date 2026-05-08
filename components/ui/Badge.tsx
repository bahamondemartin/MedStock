import { cn } from '@/lib/utils'

type Variant = 'default' | 'red' | 'amber' | 'green' | 'slate'

const variants: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700',
  red:     'bg-red-100 text-red-700',
  amber:   'bg-amber-100 text-amber-700',
  green:   'bg-green-100 text-green-700',
  slate:   'bg-slate-100 text-slate-500',
}

interface BadgeProps {
  variant?: Variant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
