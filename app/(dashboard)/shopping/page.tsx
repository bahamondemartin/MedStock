import { createClient } from '@/lib/supabase/server'
import { buildShoppingList } from '@/lib/shopping'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import { ShoppingCart } from 'lucide-react'

export const revalidate = 0

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: medications = [] } = await supabase
    .from('v_medication_summary')
    .select('*')
    .order('name')

  const shoppingList = buildShoppingList(medications ?? [])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900">Lista de compras</h1>
        {shoppingList.length > 0 && (
          <span className="ml-auto text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5">
            {shoppingList.length} ítems
          </span>
        )}
      </div>

      {shoppingList.length > 0 && (
        <p className="text-sm text-slate-500">
          Generada automáticamente según stock y fechas de vencimiento.
        </p>
      )}

      <ShoppingList items={shoppingList} />
    </div>
  )
}
