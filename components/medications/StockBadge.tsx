import { Badge } from '@/components/ui/Badge'
import type { StockStatus } from '@/lib/supabase/types'

export function StockBadge({ status, total, unit }: { status: StockStatus; total: number; unit: string }) {
  if (status === 'out_of_stock') return <Badge variant="red">Sin stock</Badge>
  if (status === 'low_stock') return <Badge variant="amber">Stock bajo · {total} {unit}</Badge>
  return <Badge variant="green">{total} {unit}</Badge>
}
