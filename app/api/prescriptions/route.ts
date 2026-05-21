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
  const { medication_id, medication_name, dose, schedule_times, start_date, end_date, notes } = body

  if (!medication_name?.trim() || !dose?.trim() || !schedule_times?.length) {
    return NextResponse.json({ error: 'medication_name, dose y al menos un horario son requeridos' }, { status: 400 })
  }

  const { data, error } = await (supabase.from('med_prescriptions') as any)
    .insert({
      user_id: user.id,
      medication_id: medication_id ?? null,
      medication_name: medication_name.trim(),
      dose: dose.trim(),
      schedule_times,
      start_date: start_date ?? new Date().toISOString().slice(0, 10),
      end_date: end_date ?? null,
      notes: notes?.trim() ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
