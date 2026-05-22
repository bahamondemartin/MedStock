'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Trash2, ChevronDown, ChevronUp, X, Wand2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Prescription, PrescriptionMedItem } from '@/lib/supabase/types'

function getMedications(p: Prescription): PrescriptionMedItem[] {
  if (p.medications && p.medications.length > 0) return p.medications
  return [{ medication_id: p.medication_id, medication_name: p.medication_name, dose: p.dose }]
}

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

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fromMin(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function suggestTimes(frequencyHours: number, existingTimes: string[]): string[] {
  if (frequencyHours <= 0 || frequencyHours > 24) return []
  const dosesPerDay = Math.max(1, Math.floor(24 / frequencyHours))
  const stepMin = frequencyHours * 60
  const existingMin = existingTimes.map(toMin)

  const buildFromBase = (base: number) =>
    Array.from({ length: dosesPerDay }, (_, i) => fromMin(base + i * stepMin)).sort()

  if (existingMin.length === 0) return buildFromBase(8 * 60)

  const score = (base: number) =>
    Array.from({ length: dosesPerDay }, (_, i) => (base + i * stepMin) % 1440)
      .filter(t => existingMin.some(e => Math.min(Math.abs(e - t), 1440 - Math.abs(e - t)) <= 30))
      .length

  let bestBase = 8 * 60, bestScore = -1
  for (let base = 0; base < stepMin; base += 15) {
    const s = score(base)
    const d = Math.min(Math.abs(base - 480), stepMin - Math.abs(base - 480))
    const bd = Math.min(Math.abs(bestBase - 480), stepMin - Math.abs(bestBase - 480))
    if (s > bestScore || (s === bestScore && d < bd)) { bestScore = s; bestBase = base }
  }
  return buildFromBase(bestBase)
}

/** Generate a combined schedule from multiple medications' frequencies.
 *  Each subsequent medication aligns with already-suggested times to maximise overlap. */
function generateCombined(entries: MedEntry[], existingTimes: string[]): string[] {
  const all = new Set<string>()
  for (const e of entries) {
    const freq = typeof e.frequency_hours === 'number' && e.frequency_hours > 0 ? e.frequency_hours : 0
    if (!freq || freq > 24) continue
    suggestTimes(freq, [...existingTimes, ...all]).forEach(t => all.add(t))
  }
  return [...all].sort()
}

interface MedEntry {
  medication_id: string
  medication_name: string
  dose: string
  frequency_hours: number | ''
  duration_days: number | ''
}

function MedEntryRow({
  entry, idx, startDate, medications, showRemove, onChange, onRemove,
}: {
  entry: MedEntry
  idx: number
  startDate: string
  medications: { id: string; name: string }[]
  showRemove: boolean
  onChange: (idx: number, key: keyof MedEntry, value: string | number | '') => void
  onRemove: (idx: number) => void
}) {
  const dosesPerDay = typeof entry.frequency_hours === 'number' && entry.frequency_hours > 0
    ? Math.max(1, Math.floor(24 / entry.frequency_hours)) : null
  const endDate = typeof entry.duration_days === 'number' && entry.duration_days > 0
    ? addDays(startDate, entry.duration_days) : null

  return (
    <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Medicamento {idx + 1}</span>
        {showRemove && (
          <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {medications.length > 0 && (
        <select
          value={entry.medication_id}
          onChange={(e) => onChange(idx, 'medication_id', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Seleccionar del inventario…</option>
          {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}

      <input
        value={entry.medication_name}
        onChange={(e) => onChange(idx, 'medication_name', e.target.value)}
        placeholder="Nombre del medicamento"
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <input
        value={entry.dose}
        onChange={(e) => onChange(idx, 'dose', e.target.value)}
        placeholder="Dosis (ej: 1 comprimido, 5ml)"
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {/* Frequency + duration per medication */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 whitespace-nowrap">Cada</span>
        <input
          type="number"
          min={1}
          max={24}
          value={entry.frequency_hours}
          onChange={(e) => onChange(idx, 'frequency_hours', e.target.value === '' ? '' : parseInt(e.target.value))}
          placeholder="—"
          className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
        />
        <span className="text-xs text-slate-500">h</span>
        <span className="text-xs text-slate-300">·</span>
        <input
          type="number"
          min={0}
          value={entry.duration_days}
          onChange={(e) => onChange(idx, 'duration_days', e.target.value === '' ? '' : parseInt(e.target.value))}
          placeholder="—"
          className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
        />
        <span className="text-xs text-slate-500 whitespace-nowrap">días</span>
      </div>

      {(dosesPerDay || endDate) && (
        <p className="text-xs text-slate-400">
          {dosesPerDay && <>{dosesPerDay} toma{dosesPerDay !== 1 ? 's' : ''}/día</>}
          {dosesPerDay && endDate && ' · '}
          {endDate && <>hasta {endDate}</>}
        </p>
      )}
    </div>
  )
}

function AddPrescriptionForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medications, setMedications] = useState<{ id: string; name: string }[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [familyMembers, setFamilyMembers] = useState<{ email: string; user_id: string; name: string | null }[]>([])
  const [existingPrescriptions, setExistingPrescriptions] = useState<Prescription[]>([])
  const [suggestedNote, setSuggestedNote] = useState(false)
  const [medEntries, setMedEntries] = useState<MedEntry[]>([
    { medication_id: '', medication_name: '', dose: '', frequency_hours: '', duration_days: '' }
  ])
  const [form, setForm] = useState({
    schedule_times: ['08:00'],
    start_date: new Date().toISOString().slice(0, 10),
    notes: '',
    patient_name: 'Yo',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserEmail(user.email ?? '')
      fetch('/api/family').then(r => r.json()).then(d => {
        if (d?.members?.length > 1) {
          setFamilyMembers(
            d.members
              .filter((m: { user_id: string }) => m.user_id !== user?.id)
              .map((m: { email: string; user_id: string; name: string | null }) => ({
                email: m.email ?? '',
                user_id: m.user_id,
                name: m.name ?? null,
              }))
          )
        }
      }).catch(() => {})
    })
    fetch('/api/medications').then(r => r.json()).then(d => setMedications(d ?? []))
    fetch('/api/prescriptions').then(r => r.json()).then(d => setExistingPrescriptions(d ?? []))
  }, [])

  function updateMedEntry(idx: number, key: keyof MedEntry, value: string | number | '') {
    setMedEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e
      if (key === 'medication_id') {
        const med = medications.find(m => m.id === value)
        return { ...e, medication_id: value as string, medication_name: med?.name ?? e.medication_name }
      }
      if (key === 'medication_name') return { ...e, medication_name: value as string, medication_id: '' }
      return { ...e, [key]: value }
    }))
  }

  function addMedEntry() {
    setMedEntries(prev => [...prev, { medication_id: '', medication_name: '', dose: '', frequency_hours: '', duration_days: '' }])
  }

  function removeMedEntry(idx: number) {
    setMedEntries(prev => prev.filter((_, i) => i !== idx))
  }

  function handleGenerate() {
    const existingTimes = existingPrescriptions.flatMap(p => p.schedule_times)
    const suggested = generateCombined(medEntries, existingTimes)
    if (suggested.length) {
      setForm(f => ({ ...f, schedule_times: suggested }))
      setSuggestedNote(true)
    }
  }

  function addTime() {
    setSuggestedNote(false)
    setForm(f => ({ ...f, schedule_times: [...f.schedule_times, '12:00'] }))
  }

  function removeTime(idx: number) {
    setSuggestedNote(false)
    setForm(f => ({ ...f, schedule_times: f.schedule_times.filter((_, i) => i !== idx) }))
  }

  function setTime(idx: number, val: string) {
    setSuggestedNote(false)
    setForm(f => { const t = [...f.schedule_times]; t[idx] = val; return { ...f, schedule_times: t } })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validMeds = medEntries.filter(e => e.medication_name.trim())
    if (!validMeds.length) { setError('Agrega al menos un medicamento'); return }
    if (validMeds.some(e => !e.dose.trim())) { setError('Ingresa la dosis de cada medicamento'); return }
    if (!form.schedule_times.length) { setError('Agrega al menos un horario'); return }
    setLoading(true)
    setError(null)
    try {
      const maxDuration = validMeds.reduce((mx, m) =>
        Math.max(mx, typeof m.duration_days === 'number' ? m.duration_days : 0), 0)
      const end_date = maxDuration > 0 ? addDays(form.start_date, maxDuration) : null

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: validMeds.map(m => ({
            medication_id: m.medication_id || null,
            medication_name: m.medication_name.trim(),
            dose: m.dose.trim(),
            frequency_hours: typeof m.frequency_hours === 'number' && m.frequency_hours > 0 ? m.frequency_hours : null,
            duration_days: typeof m.duration_days === 'number' && m.duration_days > 0 ? m.duration_days : null,
          })),
          schedule_times: [...form.schedule_times].sort(),
          frequency_hours: null,
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

  const patientOptions = [
    { value: 'Yo', label: currentUserEmail ? `Yo (${currentUserEmail})` : 'Yo' },
    ...familyMembers.map(m => ({
      value: m.email,
      label: m.name ? `${m.name} (${m.email})` : m.email,
    })),
  ]
  const canGenerate = medEntries.some(e => typeof e.frequency_hours === 'number' && e.frequency_hours > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Patient */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Para quién *</label>
        {familyMembers.length > 0 ? (
          <select
            value={form.patient_name}
            onChange={(e) => setForm(f => ({ ...f, patient_name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {patientOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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

      {/* Start date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio</label>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Medications list */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Medicamentos *</label>
        <div className="space-y-2">
          {medEntries.map((entry, idx) => (
            <MedEntryRow
              key={idx}
              entry={entry}
              idx={idx}
              startDate={form.start_date}
              medications={medications}
              showRemove={medEntries.length > 1}
              onChange={updateMedEntry}
              onRemove={removeMedEntry}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addMedEntry}
          className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar otro medicamento
        </button>
      </div>

      {/* Generate proposal */}
      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-brand-300 text-brand-600 text-sm font-semibold hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Generar propuesta de horarios
        </button>
        {suggestedNote && (
          <p className="text-xs text-brand-600 bg-brand-50 rounded-lg px-3 py-2 mt-2">
            Horario optimizado considerando las frecuencias de cada medicamento y tus tratamientos activos.
            Puedes ajustarlo manualmente.
          </p>
        )}
      </div>

      {/* Times */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Horarios *</label>
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
          Agregar horario manualmente
        </button>
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

function parseDoseQty(dose: string): number {
  const match = dose.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 1
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

  function toggleTime(prescription: Prescription, time: string) {
    const prescriptionId = prescription.id
    const isChecking = !checkedTimes[prescriptionId]?.has(time)

    setCheckedTimes(prev => {
      const s = new Set(prev[prescriptionId] ?? [])
      s.has(time) ? s.delete(time) : s.add(time)
      return { ...prev, [prescriptionId]: s }
    })

    if (isChecking) {
      const meds = getMedications(prescription)
      meds.forEach(med => {
        if (!med.medication_id) return
        const qty = parseDoseQty(med.dose)
        fetch(`/api/medications/${med.medication_id}/consume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity_used: qty, reason: 'prescription' }),
        })
      })
    }
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
            {schedule.map((entry, i) => {
              const meds = getMedications(entry.prescription)
              return (
                <div key={i} className={`px-4 py-3 flex items-center gap-3 ${entry.isPast ? 'opacity-40' : ''}`}>
                  <div className={`w-14 text-center rounded-lg py-1.5 flex-shrink-0 ${
                    entry.isNext ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className="text-sm font-bold">{entry.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {meds.map(m => m.medication_name).join(', ')}
                    </p>
                    <p className="text-xs text-slate-400">{meds.map(m => m.dose).join(' · ')}</p>
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
                  {entry.isPast && <span className="text-xs text-slate-300 flex-shrink-0">✓</span>}
                </div>
              )
            })}
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
            {prescriptions.map((p) => {
              const meds = getMedications(p)
              return (
                <Card key={p.id}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        {meds.map((m, i) => (
                          <div key={i} className="flex items-baseline gap-1.5 flex-wrap">
                            <p className="font-semibold text-slate-900">{m.medication_name}</p>
                            <p className="text-sm text-slate-500">{m.dose}</p>
                            {m.frequency_hours && (
                              <span className="text-xs text-slate-400">· c/{m.frequency_hours}h</span>
                            )}
                            {m.duration_days && (
                              <span className="text-xs text-slate-400">· {m.duration_days}d</span>
                            )}
                          </div>
                        ))}
                        {/* Fallback for old records with shared frequency_hours */}
                        {!meds.some(m => m.frequency_hours) && p.frequency_hours && (
                          <p className="text-xs text-slate-400">Cada {p.frequency_hours}h</p>
                        )}
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

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.schedule_times.map((t) => {
                        const checked = checkedTimes[p.id]?.has(t)
                        return (
                          <button
                            key={t}
                            onClick={() => toggleTime(p, t)}
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
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
