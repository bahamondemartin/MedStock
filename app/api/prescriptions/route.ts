import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase.from('med_prescriptions') as any)
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { medications, schedule_times, frequency_hours, start_date, end_date, notes, patient_name } = body

  const meds: { medication_id: string | null; medication_name: string; dose: string; frequency_hours?: number | null; duration_days?: number | null }[] =
    Array.isArray(medications) && medications.length > 0 ? medications : []

  if (!meds.length || !meds[0].medication_name?.trim() || !schedule_times?.length) {
    return NextResponse.json({ error: 'Al menos un medicamento y un horario son requeridos' }, { status: 400 })
  }

  // Persist first med in legacy columns for backward compat
  const first = meds[0]

  const { data, error } = await (supabase.from('med_prescriptions') as any)
    .insert({
      user_id: user.id,
      medication_id: first.medication_id ?? null,
      medication_name: first.medication_name.trim(),
      dose: first.dose?.trim() ?? '',
      medications: meds.map(m => ({
        medication_id: m.medication_id ?? null,
        medication_name: m.medication_name.trim(),
        dose: m.dose?.trim() ?? '',
        frequency_hours: m.frequency_hours ?? null,
        duration_days: m.duration_days ?? null,
      })),
      schedule_times,
      frequency_hours: frequency_hours ?? null,
      start_date: start_date ?? new Date().toISOString().slice(0, 10),
      end_date: end_date ?? null,
      notes: notes?.trim() ?? null,
      patient_name: patient_name?.trim() ?? 'Yo',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
