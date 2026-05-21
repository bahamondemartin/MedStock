'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, PackageOpen, CalendarClock, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MedicationCard } from '@/components/medications/MedicationCard'
import { AddMedicationForm } from '@/components/medications/AddMedicationForm'
import { AddStockForm } from '@/components/medications/AddStockForm'
import { computeAlertSummary } from '@/lib/alerts'
import type { MedicationSummary } from '@/lib/supabase/types'

export default function HomePage() {
  const [medications, setMedications] = useState<MedicationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addStockFor, setAddStockFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [medsRes, pinsRes] = await Promise.all([
        fetch('/api/medications'),
        fetch('/api/shopping-pins'),
      ])
      if (medsRes.ok) setMedications(await medsRes.json())
      if (pinsRes.ok) {
        const pins: { medication_id: string }[] = await pinsRes.json()
        setPinnedIds(new Set(pins.map(p => p.medication_id)))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])


  async function togglePin(id: string, pinned: boolean) {
    const method = pinned ? 'DELETE' : 'POST'
    await fetch('/api/shopping-pins', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: id }),
    })
    setPinnedIds(prev => {
      const s = new Set(prev)
      pinned ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este medicamento y todo su stock?')) return
    await fetch(`/api/medications/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  const summary = computeAlertSummary(medications)
  const filtered = search.trim()
    ? medications.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : medications

  if (addStockFor) {
    const med = medications.find((m) => m.id === addStockFor)
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-slate-900">Agregar stock</h1>
        {med && <p className="text-sm text-slate-500">Medicamento: <strong className="text-slate-700">{med.name}</strong></p>}
        <Card className="p-5">
          <AddStockForm
            medicationId={addStockFor}
            onSuccess={() => { setAddStockFor(null); fetchAll() }}
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
            onSuccess={() => { setShowAddForm(false); fetchAll() }}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-slate-900">Mi botiquín</h1>
        <Button size="sm" onClick={() => setShowAddForm(true)} className="ml-auto">
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Stats */}
      {!loading && medications.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />
            <p className="text-2xl font-bold text-red-900">{summary.expiredCount + summary.criticalCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Críticos</p>
          </div>
          <div className="rounded-xl p-3 bg-amber-50">
            <PackageOpen className="w-4 h-4 text-amber-500 mb-1" />
            <p className="text-2xl font-bold text-amber-900">{summary.outOfStockCount + summary.lowStockCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Stock bajo</p>
          </div>
          <div className="rounded-xl p-3 bg-slate-50">
            <CalendarClock className="w-4 h-4 text-slate-500 mb-1" />
            <p className="text-2xl font-bold text-slate-700">{summary.warningCount + summary.soonCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Por vencer</p>
          </div>
        </div>
      )}

      {/* Search */}
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

      {/* Medication cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
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
              onRefresh={fetchAll}
              onDelete={handleDelete}
              onAddStock={(id) => setAddStockFor(id)}
              isPinned={pinnedIds.has(med.id)}
              onTogglePin={togglePin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
