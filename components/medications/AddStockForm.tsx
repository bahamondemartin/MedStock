'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  medicationId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddStockForm({ medicationId, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ quantity: '1', expiry_date: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const quantity = parseInt(form.quantity)
    if (!quantity || quantity < 1) { setError('La cantidad debe ser al menos 1'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/medications/${medicationId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          expiry_date: form.expiry_date || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al guardar')
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
        <input
          required
          type="number"
          min={1}
          value={form.quantity}
          onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de vencimiento</label>
        <input
          type="date"
          value={form.expiry_date}
          onChange={(e) => setForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-slate-400 mt-1">Opcional, pero recomendado para alertas automáticas</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Agregar
        </Button>
      </div>
    </form>
  )
}
