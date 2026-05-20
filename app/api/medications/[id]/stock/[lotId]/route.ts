import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; lotId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id: medication_id, lotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: med } = await (supabase.from('med_medications') as any)
    .select('id')
    .eq('id', medication_id)
    .eq('user_id', user.id)
    .single()
  if (!med) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await (supabase.from('med_stock_items') as any)
    .delete()
    .eq('id', lotId)
    .eq('medication_id', medication_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
