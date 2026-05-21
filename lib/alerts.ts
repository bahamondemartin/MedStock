import { differenceInDays, parseISO } from 'date-fns'
import type { MedicationSummary, ExpiryStatus, StockStatus } from './supabase/types'

export interface AlertInfo {
  hasAlerts: boolean
  criticalCount: number
  warningCount: number
  soonCount: number
  expiredCount: number
  outOfStockCount: number
  lowStockCount: number
}

export function getExpiryStatus(nextExpiry: string | null): ExpiryStatus {
  if (!nextExpiry) return 'ok'
  const days = differenceInDays(parseISO(nextExpiry), new Date())
  if (days < 0) return 'expired'
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  if (days <= 60) return 'soon'
  return 'ok'
}

export function getStockStatus(totalStock: number, minStock: number): StockStatus {
  if (totalStock === 0) return 'out_of_stock'
  if (totalStock <= minStock) return 'low_stock'
  return 'ok'
}

export function getDaysUntilExpiry(nextExpiry: string | null): number | null {
  if (!nextExpiry) return null
  return differenceInDays(parseISO(nextExpiry), new Date())
}

export function computeAlertSummary(medications: MedicationSummary[]): AlertInfo {
  let criticalCount = 0
  let warningCount = 0
  let soonCount = 0
  let expiredCount = 0
  let outOfStockCount = 0
  let lowStockCount = 0

  for (const med of medications) {
    if (med.expiry_status === 'expired') expiredCount++
    else if (med.expiry_status === 'critical') criticalCount++
    else if (med.expiry_status === 'warning') warningCount++
    else if (med.expiry_status === 'soon') soonCount++

    if (med.stock_status === 'out_of_stock') outOfStockCount++
    else if (med.stock_status === 'low_stock') lowStockCount++
  }

  return {
    hasAlerts: criticalCount + warningCount + soonCount + expiredCount + outOfStockCount + lowStockCount > 0,
    criticalCount,
    warningCount,
    soonCount,
    expiredCount,
    outOfStockCount,
    lowStockCount,
  }
}

export type AlertPriority = 'urgent' | 'this_week' | 'recommended'

export function getMedicationPriority(med: MedicationSummary): AlertPriority | null {
  const isUrgent =
    med.stock_status === 'out_of_stock' || med.expiry_status === 'expired'
  const isThisWeek =
    med.expiry_status === 'critical' || med.stock_status === 'low_stock'
  const isRecommended = med.expiry_status === 'warning' || med.expiry_status === 'soon'

  if (isUrgent) return 'urgent'
  if (isThisWeek) return 'this_week'
  if (isRecommended) return 'recommended'
  return null
}
