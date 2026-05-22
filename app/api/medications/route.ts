import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MedicationSummary, Medication } from '@/lib/supabase/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result: any = await (supabase.from('v_medication_summary') as any)
    .select('*')
    .order('name')

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, category, unit, min_stock, notes, is_pediatric } = body

  if (!name || !unit) {
    return NextResponse.json({ error: 'name and unit are required' }, { status: 400 })
  }

  const { data, error } = await (supabase.from('med_medications') as any)
    .insert({ user_id: user.id, name, category, unit, min_stock: min_stock ?? 5, notes, is_pediatric: is_pediatric ?? false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
