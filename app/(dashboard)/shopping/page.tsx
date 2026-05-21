import { createClient } from '@/lib/supabase/server'
import { buildShoppingList } from '@/lib/shopping'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import { PinnedItems } from '@/components/shopping/PinnedItems'
import { ShoppingCart } from 'lucide-react'
import type { MedicationSummary } from '@/lib/supabase/types'

export const revalidate = 0

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: medications = [] }, { data: pins = [] }] = await Promise.all([
    supabase.from('v_medication_summary').select('*').order('name') as any,
    user
      ? (supabase.from('med_shopping_pins') as any).select('medication_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const pinnedIds = new Set((pins ?? []).map((p: { medication_id: string }) => p.medication_id))
  const pinnedMeds = (medications as MedicationSummary[]).filter(m => pinnedIds.has(m.id))
  const shoppingList = buildShoppingList(medications as MedicationSummary[])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900">Lista de compras</h1>
        {(shoppingList.length + pinnedMeds.length) > 0 && (
          <span className="ml-auto text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5">
            {shoppingList.length + pinnedMeds.length} ítems
          </span>
        )}
      </div>

      <PinnedItems initialMeds={pinnedMeds} />
      <ShoppingList items={shoppingList} />
    </div>
  )
}
