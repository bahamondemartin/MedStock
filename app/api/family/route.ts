import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: return current user's family + members
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find family where user is owner or member
  const { data: membership } = await (supabase.from('med_family_members') as any)
    .select('family_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ family: null })

  const { data: family } = await (supabase.from('med_families') as any)
    .select('id, name, owner_id, join_code')
    .eq('id', membership.family_id)
    .single()

  const { data: members } = await (supabase.from('med_family_members') as any)
    .select('id, user_id, role, joined_at, email')
    .eq('family_id', membership.family_id)

  return NextResponse.json({ family, members: members ?? [], role: membership.role })
}

// DELETE: leave current family (members only — owners must delete the family)
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await (supabase.from('med_family_members') as any)
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'No perteneces a ninguna familia' }, { status: 404 })
  if (membership.role === 'owner') return NextResponse.json({ error: 'El administrador no puede salir. Elimina la familia o transfiere el rol.' }, { status: 403 })

  const { error } = await (supabase.from('med_family_members') as any)
    .delete()
    .eq('id', membership.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Prevent creating a second family
  const { data: existing } = await (supabase.from('med_family_members') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'Ya perteneces a una familia' }, { status: 409 })

  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const { data: family, error } = await (supabase.from('med_families') as any)
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await (supabase.from('med_family_members') as any)
    .insert({ family_id: family.id, user_id: user.id, role: 'owner', email: user.email })

  return NextResponse.json(family, { status: 201 })
}
