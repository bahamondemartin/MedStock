'use client'

import { useState, useCallback } from 'react'
import { Trash2, ChevronDown, ChevronUp, Plus, ArrowDownCircle, Package } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StockBadge } from './StockBadge'
import { ExpiryBadge } from './ExpiryBadge'
import { ConsumeForm } from './ConsumeForm'
import type { MedicationSummary } from '@/lib/supabase/types'

interface StockLot {
  id: string
  quantity: number
  expiry_date: string | null
  purchase_date: string
  notes: string | null
}

interface MedicationCardProps {
  medication: MedicationSummary
  onRefresh: () => void
  onDelete: (id: string) => Promise<void>
  onAddStock: (id: string) => void
}

export function MedicationCard({ medication: med, onRefresh, onDelete, onAddStock }: MedicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showConsume, setShowConsume] = useState(false)
  const [lots, setLots] = useState<StockLot[]>([])
  const [lotsLoading, setLotsLoading] = useState(false)
  const [consuming, setConsuming] = useState<number | null>(null)
  const [consumeError, setConsumeError] = useState<string | null>(null)

  const isAlert = med.expiry_status !== 'ok' || med.stock_status !== 'ok'

  const loadLots = useCallback(async () => {
    setLotsLoading(true)
    try {
      const res = await fetch(`/api/medications/${med.id}/stock`)
      if (res.ok) setLots(await res.json())
    } finally {
      setLotsLoading(false)
    }
  }, [med.id])

  function toggleExpand() {
    if (!expanded) loadLots()
    setExpanded(!expanded)
    setShowConsume(false)
  }

  async function quickConsume(amount: number) {
    if (med.total_stock < amount) return
    setConsuming(amount)
    setConsumeError(null)
    try {
      const res = await fetch(`/api/medications/${med.id}/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_used: amount }),
      })
      if (!res.ok) {
        const d = await res.json()
        setConsumeError(d.error ?? 'Error')
        setTimeout(() => setConsumeError(null), 3000)
      } else {
        onRefresh()
        if (expanded) loadLots()
      }
    } finally {
      setConsuming(null)
    }
  }

  async function deleteLot(lotId: string) {
    if (!confirm('¿Eliminar este lote?')) return
    await fetch(`/api/medications/${med.id}/stock/${lotId}`, { method: 'DELETE' })
    await loadLots()
    onRefresh()
  }

  return (
    <Card className={isAlert ? 'border-l-4 border-l-amber-400' : ''}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{med.name}</h3>
            {med.category && (
              <span className="text-xs text-slate-400 capitalize">{med.category}</span>
            )}
          </div>
          <button
            onClick={toggleExpand}
            className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <StockBadge status={med.stock_status} total={med.total_stock} unit={med.unit} />
          <ExpiryBadge status={med.expiry_status} nextExpiry={med.next_expiry} />
        </div>

        {/* Quick consume buttons */}
        <div className="flex items-center gap-2 mt-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => quickConsume(n)}
              disabled={med.total_stock < n || consuming !== null}
              className="flex-1 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {consuming === n ? '…' : `-${n}`}
            </button>
          ))}
        </div>

        {consumeError && (
          <p className="text-xs text-red-500 mt-1.5">{consumeError}</p>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Lots */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Lotes en stock
            </p>
            {lotsLoading ? (
              <div className="space-y-1.5">
                {[1, 2].map(i => <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : lots.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sin lotes con stock activo</p>
            ) : (
              <div className="space-y-1.5">
                {lots.map((lot) => {
                  const expiry = lot.expiry_date ? new Date(lot.expiry_date + 'T00:00:00') : null
                  const today = new Date(); today.setHours(0, 0, 0, 0)
                  const isExpired = expiry && expiry < today
                  const isSoon = expiry && !isExpired && expiry <= new Date(today.getTime() + 30 * 86400000)
                  return (
                    <div key={lot.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">
                          {lot.quantity} {med.unit}
                        </span>
                        {expiry ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isExpired ? 'bg-red-100 text-red-700' :
                            isSoon ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {isExpired ? 'Vencido ' : 'Vence '}
                            {expiry.toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin fecha de vencimiento</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteLot(lot.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          {showConsume ? (
            <div className="border-t border-slate-100 px-4 py-3">
              <ConsumeForm
                medicationId={med.id}
                medicationName={med.name}
                totalStock={med.total_stock}
                unit={med.unit}
                onSuccess={() => { setShowConsume(false); onRefresh(); loadLots() }}
                onCancel={() => setShowConsume(false)}
              />
            </div>
          ) : (
            <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2">
              <button
                onClick={() => setShowConsume(true)}
                disabled={med.total_stock === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                Registrar salida
              </button>
              <button
                onClick={() => onAddStock(med.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar stock
              </button>
            </div>
          )}

          {/* Footer */}
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
        </div>
      )}
    </Card>
  )
}
