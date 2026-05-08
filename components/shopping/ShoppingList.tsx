'use client'

import { ShoppingCart } from 'lucide-react'
import type { ShoppingItem } from '@/lib/shopping'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/shopping'
import type { AlertPriority } from '@/lib/alerts'

interface Props {
  items: ShoppingItem[]
}

export function ShoppingList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-slate-600">Todo en orden</p>
        <p className="text-sm mt-1">No hay medicamentos que reponer por ahora.</p>
      </div>
    )
  }

  const grouped = items.reduce<Record<AlertPriority, ShoppingItem[]>>(
    (acc, item) => {
      acc[item.priority].push(item)
      return acc
    },
    { urgent: [], this_week: [], recommended: [] }
  )

  return (
    <div className="space-y-6">
      {(['urgent', 'this_week', 'recommended'] as AlertPriority[]).map((priority) => {
        const group = grouped[priority]
        if (group.length === 0) return null
        return (
          <section key={priority}>
            <h3 className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg border mb-2 inline-block ${PRIORITY_COLORS[priority]}`}>
              {PRIORITY_LABELS[priority]} · {group.length}
            </h3>
            <ul className="space-y-2">
              {group.map(({ medication, reason }) => (
                <ShopItem key={medication.id} name={medication.name} unit={medication.unit} reason={reason} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function ShopItem({ name, unit, reason }: { name: string; unit: string; reason: string }) {
  return (
    <li className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div className="mt-0.5 w-5 h-5 rounded border-2 border-slate-300 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm">{name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{reason}</p>
      </div>
    </li>
  )
}
