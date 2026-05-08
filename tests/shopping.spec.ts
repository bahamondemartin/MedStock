import { test, expect } from '@playwright/test'
import { buildShoppingList } from '../lib/shopping'
import type { MedicationSummary } from '../lib/supabase/types'

test.describe('Shopping list logic', () => {
  const baseMed = (overrides: Partial<MedicationSummary>): MedicationSummary => ({
    id: '1', user_id: 'u1', name: 'Test', category: null,
    unit: 'comprimidos', min_stock: 5, total_stock: 10,
    next_expiry: null, expiry_status: 'ok', stock_status: 'ok',
    ...overrides,
  })

  test('excludes medications with no alerts', () => {
    const meds = [baseMed({ stock_status: 'ok', expiry_status: 'ok' })]
    expect(buildShoppingList(meds)).toHaveLength(0)
  })

  test('includes out_of_stock as urgent', () => {
    const meds = [baseMed({ total_stock: 0, stock_status: 'out_of_stock' })]
    const list = buildShoppingList(meds)
    expect(list).toHaveLength(1)
    expect(list[0].priority).toBe('urgent')
  })

  test('includes low_stock as this_week', () => {
    const meds = [baseMed({ total_stock: 3, stock_status: 'low_stock' })]
    const list = buildShoppingList(meds)
    expect(list).toHaveLength(1)
    expect(list[0].priority).toBe('this_week')
  })

  test('includes expiring in ≤15 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 10)
    const meds = [baseMed({
      next_expiry: soon.toISOString().split('T')[0],
      expiry_status: 'critical',
      stock_status: 'ok',
    })]
    const list = buildShoppingList(meds)
    expect(list).toHaveLength(1)
  })

  test('sorts by priority: urgent first', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 10)
    const meds: MedicationSummary[] = [
      baseMed({ id: '1', name: 'Low', total_stock: 3, stock_status: 'low_stock' }),
      baseMed({ id: '2', name: 'Out', total_stock: 0, stock_status: 'out_of_stock' }),
    ]
    const list = buildShoppingList(meds)
    expect(list[0].priority).toBe('urgent')
    expect(list[1].priority).toBe('this_week')
  })
})
