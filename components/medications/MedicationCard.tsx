'use client'

import { useState } from 'react'
import { Minus, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StockBadge } from './StockBadge'
import { ExpiryBadge } from './ExpiryBadge'
import type { MedicationSummary } from '@/lib/supabase/types'

interface MedicationCardProps {
  medication: MedicationSummary
  onConsume: (id: string, quantity: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAddStock: (id: string) => void
}

export function MedicationCard({ medication: med, onConsume, onDelete, onAddStock }: MedicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [consuming, setConsuming] = useState(false)

  const isAlert = med.expiry_status !== 'ok' || med.stock_status !== 'ok'

  async function handleConsume(qty: number) {
    setConsuming(true)
    try {
      await onConsume(med.id, qty)
    } finally {
      setConsuming(false)
    }
  }

  return (
    <Card className={isAlert ? 'border-l-4 border-l-amber-400' : ''}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{med.name}</h3>
            {med.category && (
              <span className="text-xs text-slate-400 capitalize">{med.category}</span>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <StockBadge status={med.stock_status} total={med.total_stock} unit={med.unit} />
          <ExpiryBadge status={med.expiry_status} nextExpiry={med.next_expiry} />
        </div>

        {/* Quick consume buttons */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-500 mr-1">Usé:</span>
          {[1, 2, 5].map((qty) => (
            <button
              key={qty}
              onClick={() => handleConsume(qty)}
              disabled={consuming || med.total_stock === 0}
              className="inline-flex items-center gap-0.5 px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-3 h-3" />
              {qty}
            </button>
          ))}
          <button
            onClick={() => onAddStock(med.id)}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors font-medium"
          >
            <Plus className="w-3 h-3" />
            Agregar stock
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Stock mínimo: <strong className="text-slate-700">{med.min_stock} {med.unit}</strong>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(med.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>
      )}
    </Card>
  )
}
