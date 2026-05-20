'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MedicationCard } from '@/components/medications/MedicationCard'
import { AddMedicationForm } from '@/components/medications/AddMedicationForm'
import { AddStockForm } from '@/components/medications/AddStockForm'
import type { MedicationSummary } from '@/lib/supabase/types'

export default function InventoryPage() {
  const [medications, setMedications] = useState<MedicationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addStockFor, setAddStockFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchMedications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/medications')
      if (res.ok) {
        const data = await res.json()
        setMedications(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMedications()
  }, [fetchMedications])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este medicamento y todo su stock?')) return
    await fetch(`/api/medications/${id}`, { method: 'DELETE' })
    await fetchMedications()
  }

  const filtered = search.trim()
    ? medications.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : medications

  if (addStockFor) {
    const med = medications.find((m) => m.id === addStockFor)
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-slate-900">Agregar stock</h1>
        {med && (
          <p className="text-sm text-slate-500">
            Medicamento: <strong className="text-slate-700">{med.name}</strong>
          </p>
        )}
        <Card className="p-5">
          <AddStockForm
            medicationId={addStockFor}
            onSuccess={() => { setAddStockFor(null); fetchMedications() }}
            onCancel={() => setAddStockFor(null)}
          />
        </Card>
      </div>
    )
  }

  if (showAddForm) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-slate-900">Nuevo medicamento</h1>
        <Card className="p-5">
          <AddMedicationForm
            onSuccess={() => { setShowAddForm(false); fetchMedications() }}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="ml-auto"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      {medications.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar medicamento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          {medications.length === 0 ? (
            <>
              <div className="text-4xl mb-3">💊</div>
              <p className="font-medium text-slate-700">Sin medicamentos aún</p>
              <p className="text-sm text-slate-500 mt-1 mb-5">Agrega tu primer medicamento para empezar.</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar medicamento
              </Button>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No se encontraron resultados para &quot;{search}&quot;</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onRefresh={fetchMedications}
              onDelete={handleDelete}
              onAddStock={(id) => setAddStockFor(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
