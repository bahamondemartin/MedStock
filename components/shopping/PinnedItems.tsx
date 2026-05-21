'use client'

import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import type { MedicationSummary } from '@/lib/supabase/types'

export function PinnedItems({ initialMeds }: { initialMeds: MedicationSummary[] }) {
  const [meds, setMeds] = useState(initialMeds)

  async function unpin(id: string) {
    await fetch('/api/shopping-pins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: id }),
    })
    setMeds(prev => prev.filter(m => m.id !== id))
  }

  if (meds.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
        <ShoppingCart className="w-3.5 h-3.5" />
        Agregados manualmente
      </h2>
      <div className="space-y-2">
        {meds.map(med => (
          <div key={med.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{med.name}</p>
              <p className="text-xs text-slate-400">
                {med.total_stock} {med.unit} en stock
                {med.next_expiry && ` · Vence ${med.next_expiry}`}
              </p>
            </div>
            <button
              onClick={() => unpin(med.id)}
              className="text-slate-300 hover:text-red-400 transition-colors p-1"
              title="Quitar de compras"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
