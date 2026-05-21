'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertTriangle, PackageOpen, CalendarClock, Plus, Search, ArrowDownUp } from 'lucide-react'
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
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterPediatric, setFilterPediatric] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<'category' | 'stock'>('category')
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

  const categories = useMemo(() =>
    [...new Set(medications.map(m => m.category).filter(Boolean))].sort() as string[],
    [medications]
  )

  const filtered = useMemo(() => {
    let list = [...medications]
    if (search.trim()) list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    if (filterCategory) list = list.filter(m => m.category === filterCategory)
    if (filterPediatric !== null) list = list.filter(m => m.is_pediatric === filterPediatric)
    if (sortBy === 'stock') {
      list.sort((a, b) => b.total_stock - a.total_stock)
    } else {
      list.sort((a, b) => (a.category ?? 'zzz').localeCompare(b.category ?? 'zzz') || a.name.localeCompare(b.name))
    }
    return list
  }, [medications, search, filterCategory, filterPediatric, sortBy])

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

      {/* Filters */}
      {medications.length > 0 && (
        <div className="space-y-2">
          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              <button
                onClick={() => setFilterCategory(null)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterCategory === null ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    filterCategory === cat ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Pediatric filter + sort */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
              {([null, false, true] as const).map((val, i) => {
                const label = val === null ? 'Todos' : val ? 'Pediátrico' : 'Adulto'
                return (
                  <button
                    key={i}
                    onClick={() => setFilterPediatric(filterPediatric === val ? null : val)}
                    className={`px-3 py-1.5 transition-colors ${
                      filterPediatric === val ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setSortBy(s => s === 'category' ? 'stock' : 'category')}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                sortBy === 'stock' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              {sortBy === 'stock' ? 'Mayor stock' : 'Categoría'}
            </button>
          </div>
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
