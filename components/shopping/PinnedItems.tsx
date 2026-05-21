'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import type { MedicationSummary } from '@/lib/supabase/types'

export function PinnedItems() {
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [meds, setMeds] = useState<MedicationSummary[]>([])

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('pinned_shopping') ?? '[]')
      setPinnedIds(ids)
      if (ids.length > 0) {
        fetch('/api/medications').then(r => r.json()).then((all: MedicationSummary[]) => {
          setMeds(all.filter(m => ids.includes(m.id)))
        })
      }
    } catch { /* ignore */ }
  }, [])

  function unpin(id: string) {
    try {
      const next = pinnedIds.filter(i => i !== id)
      localStorage.setItem('pinned_shopping', JSON.stringify(next))
      setPinnedIds(next)
      setMeds(prev => prev.filter(m => m.id !== id))
    } catch { /* ignore */ }
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
