import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id: medication_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: med } = await (supabase.from('medications') as any)
    .select('id')
    .eq('id', medication_id)
    .eq('user_id', user.id)
    .single()

  if (!med) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { quantity, expiry_date, notes } = body

  if (quantity == null || quantity < 0) {
    return NextResponse.json({ error: 'quantity must be >= 0' }, { status: 400 })
  }

  const { data, error } = await (supabase.from('stock_items') as any)
    .insert({ medication_id, quantity, expiry_date: expiry_date ?? null, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
