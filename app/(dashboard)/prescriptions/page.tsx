'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Prescription } from '@/lib/supabase/types'

function timeLabel(time: string, now: Date) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000)
  if (diffMin < -1) return null
  if (diffMin < 0) return 'Ahora'
  if (diffMin < 60) return `En ${diffMin} min`
  return `En ${Math.round(diffMin / 60)}h`
}

function todaySchedule(prescriptions: Prescription[], now: Date) {
  const today = now.toISOString().slice(0, 10)
  const entries: { time: string; prescription: Prescription; isPast: boolean; isNext: boolean }[] = []

  for (const p of prescriptions) {
    if (p.start_date > today) continue
    if (p.end_date && p.end_date < today) continue
    for (const time of p.schedule_times) {
      const [h, m] = time.split(':').map(Number)
      const d = new Date(now)
      d.setHours(h, m, 0, 0)
      entries.push({ time, prescription: p, isPast: d.getTime() < now.getTime() - 60000, isNext: false })
    }
  }

  entries.sort((a, b) => a.time.localeCompare(b.time))
  const nextIdx = entries.findIndex((e) => !e.isPast)
  if (nextIdx !== -1) entries[nextIdx].isNext = true
  return entries
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function AddPrescriptionForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medications, setMedications] = useState<{ id: string; name: string }[]>([])
  const [familyMembers, setFamilyMembers] = useState<{ email: string }[]>([])
  const [form, setForm] = useState({
    medication_id: '',
    medication_name: '',
    dose: '',
    schedule_times: ['08:00'],
    start_date: new Date().toISOString().slice(0, 10),
    duration_days: 7,
    notes: '',
    patient_name: 'Yo',
  })

  useEffect(() => {
    fetch('/api/medications').then(r => r.json()).then(data => setMedications(data ?? []))
    fetch('/api/family').then(r => r.json()).then(data => {
      if (data?.members?.length > 1) {
        setFamilyMembers(data.members.map((m: { email: string }) => ({ email: m.email })))
      }
    }).catch(() => {})
  }, [])

  function addTime() {
    setForm(f => ({ ...f, schedule_times: [...f.schedule_times, '12:00'] }))
  }

  function removeTime(idx: number) {
    setForm(f => ({ ...f, schedule_times: f.schedule_times.filter((_, i) => i !== idx) }))
  }

  function setTime(idx: number, val: string) {
    setForm(f => {
      const times = [...f.schedule_times]
      times[idx] = val
      return { ...f, schedule_times: times }
    })
  }

  function selectMed(id: string) {
    const med = medications.find(m => m.id === id)
    setForm(f => ({ ...f, medication_id: id, medication_name: med?.name ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.medication_name.trim()) { setError('Ingresa el nombre del medicamento'); return }
    if (!form.dose.trim()) { setError('Ingresa la dosis'); return }
    if (!form.schedule_times.length) { setError('Agrega al menos un horario'); return }
    setLoading(true)
    setError(null)
    try {
      const end_date = form.duration_days > 0 ? addDays(form.start_date, form.duration_days) : null
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication_id: form.medication_id || null,
          medication_name: form.medication_name,
          dose: form.dose,
          schedule_times: [...form.schedule_times].sort(),
          start_date: form.start_date,
          end_date,
          notes: form.notes || null,
          patient_name: form.patient_name || 'Yo',
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const patientOptions = ['Yo', ...familyMembers.map(m => m.email)]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Patient */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Para quién *</label>
        {patientOptions.length > 1 ? (
          <select
            value={form.patient_name}
            onChange={(e) => setForm(f => ({ ...f, patient_name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {patientOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            value={form.patient_name}
            onChange={(e) => setForm(f => ({ ...f, patient_name: e.target.value }))}
            placeholder="Ej: Yo, Mamá, Juan"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}
      </div>

      {/* Medication */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Medicamento *</label>
        {medications.length > 0 && (
          <select
            value={form.medication_id}
            onChange={(e) => selectMed(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white mb-2"
          >
            <option value="">Seleccionar del inventario…</option>
            {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <input
          value={form.medication_name}
          onChange={(e) => setForm(f => ({ ...f, medication_name: e.target.value, medication_id: '' }))}
          placeholder="O escribe el nombre manualmente"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Dose */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Dosis *</label>
        <input
          value={form.dose}
          onChange={(e) => setForm(f => ({ ...f, dose: e.target.value }))}
          placeholder="Ej: 1 comprimido, 5ml, 2 cápsulas"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Times */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Horarios *</label>
        <div className="space-y-2">
          {form.schedule_times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={t}
                onChange={(e) => setTime(i, e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {form.schedule_times.length > 1 && (
                <button type="button" onClick={() => removeTime(i)} className="text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTime}
          className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar horario
        </button>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duración (días)</label>
          <input
            type="number"
            min={0}
            value={form.duration_days}
            onChange={(e) => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {form.duration_days > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Fin: {addDays(form.start_date, form.duration_days)}
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
        <input
          value={form.notes}
          onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Ej: Tomar con comida"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [checkedTimes, setCheckedTimes] = useState<Record<string, Set<string>>>({})
  const [now] = useState(() => new Date())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prescriptions')
      if (res.ok) setPrescriptions(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function deletePrescription(id: string) {
    if (!confirm('¿Eliminar este tratamiento?')) return
    await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' })
    await load()
  }

  function toggleTime(prescriptionId: string, time: string) {
    setCheckedTimes(prev => {
      const s = new Set(prev[prescriptionId] ?? [])
      s.has(time) ? s.delete(time) : s.add(time)
      return { ...prev, [prescriptionId]: s }
    })
  }

  const schedule = todaySchedule(prescriptions, now)

  if (showForm) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-slate-900">Nuevo tratamiento</h1>
        <Card className="p-5">
          <AddPrescriptionForm
            onSuccess={() => { setShowForm(false); load() }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900">Tratamientos</h1>
        <Button size="sm" onClick={() => setShowForm(true)} className="ml-auto">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo tratamiento
        </Button>
      </div>

      {/* Today's schedule */}
      {!loading && schedule.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Schedule de hoy</h2>
          <Card className="divide-y divide-slate-100">
            {schedule.map((entry, i) => (
              <div
                key={i}
                className={`px-4 py-3 flex items-center gap-3 ${entry.isPast ? 'opacity-40' : ''}`}
              >
                <div className={`w-14 text-center rounded-lg py-1.5 flex-shrink-0 ${
                  entry.isNext ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="text-sm font-bold">{entry.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{entry.prescription.medication_name}</p>
                  <p className="text-xs text-slate-400">{entry.prescription.dose}</p>
                </div>
                {entry.prescription.patient_name && entry.prescription.patient_name !== 'Yo' && (
                  <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                    {entry.prescription.patient_name}
                  </span>
                )}
                {entry.isNext && (
                  <span className="text-xs bg-brand-50 text-brand-600 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                    {timeLabel(entry.time, now) ?? 'Próxima'}
                  </span>
                )}
                {entry.isPast && (
                  <span className="text-xs text-slate-300 flex-shrink-0">✓</span>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Prescriptions list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium text-slate-700">Sin tratamientos activos</p>
          <p className="text-sm text-slate-500 mt-1 mb-5">Agrega un tratamiento para ver tu schedule diario.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo tratamiento
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Mis tratamientos</h2>
          <div className="space-y-2">
            {prescriptions.map((p) => (
              <Card key={p.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{p.medication_name}</p>
                      <p className="text-sm text-slate-500">{p.dose}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {p.patient_name && p.patient_name !== 'Yo' && (
                        <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
                          {p.patient_name}
                        </span>
                      )}
                      <button
                        onClick={() => deletePrescription(p.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        {expanded === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Time buttons — click to mark with strikethrough */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.schedule_times.map((t) => {
                      const checked = checkedTimes[p.id]?.has(t)
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTime(p.id, t)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                            checked
                              ? 'bg-slate-100 text-slate-400 line-through'
                              : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {expanded === p.id && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-1 text-xs text-slate-500">
                    <p>Inicio: <strong className="text-slate-700">{p.start_date}</strong></p>
                    {p.end_date && <p>Fin: <strong className="text-slate-700">{p.end_date}</strong></p>}
                    {p.notes && <p>Notas: <strong className="text-slate-700">{p.notes}</strong></p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
