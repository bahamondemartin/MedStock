import { Badge } from '@/components/ui/Badge'
import { differenceInDays, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ExpiryStatus } from '@/lib/supabase/types'

export function ExpiryBadge({ status, nextExpiry }: { status: ExpiryStatus; nextExpiry: string | null }) {
  if (!nextExpiry) return null

  const days = differenceInDays(parseISO(nextExpiry), new Date())
  const formatted = format(parseISO(nextExpiry), "d MMM yyyy", { locale: es })

  if (status === 'expired') {
    return <Badge variant="red">Vencido ({formatted})</Badge>
  }
  if (status === 'critical') {
    return <Badge variant="red">Vence en {days}d</Badge>
  }
  if (status === 'warning') {
    return <Badge variant="amber">Vence en {days}d</Badge>
  }
  return <Badge variant="green">{formatted}</Badge>
}
