import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const { data: family } = await (supabase.from('med_families') as any)
    .select('id, name')
    .eq('join_code', code.trim().toUpperCase())
    .maybeSingle()

  if (!family) return NextResponse.json({ error: 'Código inválido' }, { status: 404 })

  const { data: existing } = await (supabase.from('med_family_members') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'Ya perteneces a una familia' }, { status: 409 })

  await (supabase.from('med_family_members') as any)
    .insert({ family_id: family.id, user_id: user.id, role: 'member', email: user.email })

  return NextResponse.json({ family_id: family.id, name: family.name })
}
