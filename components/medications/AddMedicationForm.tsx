'use client'

import { useState } from 'react'
import { Baby, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CATEGORIES = ['analgésico', 'antibiótico', 'antiácido', 'antihistamínico', 'otro'] as const
const UNITS = ['comprimidos', 'cápsulas', 'ml', 'sobres', 'unidades'] as const

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export function AddMedicationForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: 'comprimidos' as typeof UNITS[number],
    min_stock: 5,
    is_pediatric: false,
  })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: form.category || null }),
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
        <input
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ej: Ibuprofeno 400mg"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white capitalize"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidad *</label>
          <select
            value={form.unit}
            onChange={(e) => set('unit', e.target.value as typeof UNITS[number])}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
        <input
          type="number"
          min={0}
          value={form.min_stock}
          onChange={(e) => set('min_stock', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-slate-400 mt-1">Avisa cuando el stock baje de este número</p>
      </div>

      {/* Pediatric toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Paciente</label>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => set('is_pediatric', false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              !form.is_pediatric
                ? 'bg-brand-500 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            Adulto
          </button>
          <button
            type="button"
            onClick={() => set('is_pediatric', true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              form.is_pediatric
                ? 'bg-brand-500 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Baby className="w-4 h-4" />
            Pediátrico
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Guardar
        </Button>
      </div>
    </form>
  )
}
