import { Badge } from '@/components/ui/Badge'
import type { StockStatus } from '@/lib/supabase/types'

const config: Record<StockStatus, { label: string; variant: 'red' | 'amber' | 'green' }> = {
  out_of_stock: { label: 'Sin stock',   variant: 'red' },
  low_stock:    { label: 'Stock bajo',  variant: 'amber' },
  ok:           { label: 'En stock',    variant: 'green' },
}

export function StockBadge({ status, total, unit }: { status: StockStatus; total: number; unit: string }) {
  const { label, variant } = config[status]
  return (
    <Badge variant={variant}>
      {status === 'ok' ? `${total} ${unit}` : label}
    </Badge>
  )
}
