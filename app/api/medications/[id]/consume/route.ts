import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StockItem } from '@/lib/supabase/types'

type Params = { params: Promise<{ id: string }> }

// FEFO: consumes from the soonest-to-expire lot first
export async function POST(request: Request, { params }: Params) {
  const { id: medication_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: med } = await (supabase.from('medications') as any)
    .select('id')
    .eq('id', medication_id)
    .eq('user_id', user.id)
    .single()

  if (!med) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { quantity_used, reason } = await request.json()

  if (!quantity_used || quantity_used <= 0) {
    return NextResponse.json({ error: 'quantity_used must be > 0' }, { status: 400 })
  }

  // Get lots ordered by soonest expiry (FEFO), nulls last
  const { data: lots } = await (supabase.from('stock_items') as any)
    .select('*')
    .eq('medication_id', medication_id)
    .gt('quantity', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  if (!lots || lots.length === 0) {
    return NextResponse.json({ error: 'No stock available' }, { status: 409 })
  }

  const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  if (quantity_used > totalAvailable) {
    return NextResponse.json({ error: 'Insufficient stock' }, { status: 409 })
  }

  let remaining = quantity_used
  for (const lot of lots) {
    if (remaining <= 0) break
    const deduct = Math.min(lot.quantity, remaining)
    await (supabase.from('stock_items') as any)
      .update({ quantity: lot.quantity - deduct })
      .eq('id', lot.id)
    remaining -= deduct
  }

  // Log the consumption
  await (supabase.from('consumption_log') as any)
    .insert({ medication_id, quantity_used, reason: reason ?? null })

  return NextResponse.json({ consumed: quantity_used })
}
