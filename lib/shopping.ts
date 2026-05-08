import { differenceInDays, parseISO } from 'date-fns'
import type { MedicationSummary } from './supabase/types'
import type { AlertPriority } from './alerts'

export interface ShoppingItem {
  medication: MedicationSummary
  priority: AlertPriority
  reason: string
}

function buildReason(med: MedicationSummary): string {
  const reasons: string[] = []

  if (med.stock_status === 'out_of_stock') reasons.push('Sin stock')
  else if (med.stock_status === 'low_stock') reasons.push(`Stock bajo (${med.total_stock} ${med.unit})`)

  if (med.expiry_status === 'expired') reasons.push('Vencido')
  else if (med.next_expiry) {
    const days = differenceInDays(parseISO(med.next_expiry), new Date())
    if (days <= 15) {
      reasons.push(days < 0 ? 'Venció hace ' + Math.abs(days) + ' días' : `Vence en ${days} días`)
    }
  }

  return reasons.join(' · ')
}

export function buildShoppingList(medications: MedicationSummary[]): ShoppingItem[] {
  const items: ShoppingItem[] = []

  for (const med of medications) {
    const isLowStock = med.stock_status !== 'ok'
    const isExpiryNear =
      med.next_expiry != null &&
      differenceInDays(parseISO(med.next_expiry), new Date()) <= 15

    if (!isLowStock && !isExpiryNear) continue

    let priority: AlertPriority
    if (med.stock_status === 'out_of_stock' || med.expiry_status === 'expired') {
      priority = 'urgent'
    } else if (med.expiry_status === 'critical' || med.stock_status === 'low_stock') {
      priority = 'this_week'
    } else {
      priority = 'recommended'
    }

    items.push({ medication: med, priority, reason: buildReason(med) })
  }

  const order: Record<AlertPriority, number> = { urgent: 0, this_week: 1, recommended: 2 }
  return items.sort((a, b) => order[a.priority] - order[b.priority])
}

export const PRIORITY_LABELS: Record<AlertPriority, string> = {
  urgent: 'Urgente',
  this_week: 'Esta semana',
  recommended: 'Recomendado',
}

export const PRIORITY_COLORS: Record<AlertPriority, string> = {
  urgent: 'text-red-700 bg-red-50 border-red-200',
  this_week: 'text-amber-700 bg-amber-50 border-amber-200',
  recommended: 'text-yellow-700 bg-yellow-50 border-yellow-200',
}
