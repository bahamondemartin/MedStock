import { test, expect } from '@playwright/test'
import { getExpiryStatus, getStockStatus, computeAlertSummary } from '../lib/alerts'
import type { MedicationSummary } from '../lib/supabase/types'

// Unit tests for alert logic (no browser needed)
test.describe('Alert logic', () => {
  test('getExpiryStatus: returns expired for past dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(getExpiryStatus(yesterday.toISOString().split('T')[0])).toBe('expired')
  })

  test('getExpiryStatus: returns critical for ≤7 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 5)
    expect(getExpiryStatus(soon.toISOString().split('T')[0])).toBe('critical')
  })

  test('getExpiryStatus: returns warning for 8-30 days', () => {
    const later = new Date()
    later.setDate(later.getDate() + 20)
    expect(getExpiryStatus(later.toISOString().split('T')[0])).toBe('warning')
  })

  test('getExpiryStatus: returns ok for >30 days', () => {
    const far = new Date()
    far.setDate(far.getDate() + 60)
    expect(getExpiryStatus(far.toISOString().split('T')[0])).toBe('ok')
  })

  test('getExpiryStatus: returns ok for null', () => {
    expect(getExpiryStatus(null)).toBe('ok')
  })

  test('getStockStatus: out_of_stock when 0', () => {
    expect(getStockStatus(0, 5)).toBe('out_of_stock')
  })

  test('getStockStatus: low_stock when at min', () => {
    expect(getStockStatus(5, 5)).toBe('low_stock')
  })

  test('getStockStatus: ok when above min', () => {
    expect(getStockStatus(10, 5)).toBe('ok')
  })

  test('computeAlertSummary: counts correctly', () => {
    const expired = new Date()
    expired.setDate(expired.getDate() - 1)
    const meds: MedicationSummary[] = [
      {
        id: '1', user_id: 'u1', name: 'Ibuprofeno', category: null,
        unit: 'comprimidos', min_stock: 5, total_stock: 0,
        next_expiry: expired.toISOString().split('T')[0],
        expiry_status: 'expired', stock_status: 'out_of_stock',
      },
      {
        id: '2', user_id: 'u1', name: 'Paracetamol', category: null,
        unit: 'comprimidos', min_stock: 5, total_stock: 20,
        next_expiry: null, expiry_status: 'ok', stock_status: 'ok',
      },
    ]
    const summary = computeAlertSummary(meds)
    expect(summary.expiredCount).toBe(1)
    expect(summary.outOfStockCount).toBe(1)
    expect(summary.hasAlerts).toBe(true)
  })
})
