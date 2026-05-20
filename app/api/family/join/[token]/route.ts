import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ token: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invite } = await (supabase.from('med_family_invites') as any)
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  if (invite.accepted_at) return NextResponse.json({ error: 'Invitación ya usada' }, { status: 409 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invitación expirada' }, { status: 410 })

  // Check user isn't already in a family
  const { data: existing } = await (supabase.from('med_family_members') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'Ya perteneces a una familia' }, { status: 409 })

  await (supabase.from('med_family_members') as any)
    .insert({ family_id: invite.family_id, user_id: user.id, role: 'member', email: user.email })

  await (supabase.from('med_family_invites') as any)
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ family_id: invite.family_id })
}
