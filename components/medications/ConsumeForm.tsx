'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Minus } from 'lucide-react'

interface Props {
  medicationId: string
  medicationName: string
  totalStock: number
  unit: string
  onSuccess: () => void
  onCancel: () => void
}

const QUICK_AMOUNTS = [1, 2, 5, 10]

export function ConsumeForm({ medicationId, medicationName, totalStock, unit, onSuccess, onCancel }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (quantity <= 0 || quantity > totalStock) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/medications/${medicationId}/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_used: quantity, reason: reason || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al registrar')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-slate-500 mb-3">
          Medicamento: <strong className="text-slate-900">{medicationName}</strong>
        </p>
        <p className="text-xs text-slate-400 mb-4">
          Stock disponible: <strong>{totalStock} {unit}</strong>
        </p>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-3">
          {QUICK_AMOUNTS.filter(a => a <= totalStock).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setQuantity(a)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                quantity === a
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Cantidad consumida *
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={1}
            max={totalStock}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(totalStock, Math.max(1, parseInt(e.target.value) || 1)))}
            className="flex-1 text-center px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => setQuantity(q => Math.min(totalStock, q + 1))}
            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <span className="text-lg font-medium">+</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">{unit}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Motivo <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: dolor de cabeza, fiebre…"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={quantity > totalStock}
          className="flex-1"
        >
          Registrar salida
        </Button>
      </div>
    </form>
  )
}
