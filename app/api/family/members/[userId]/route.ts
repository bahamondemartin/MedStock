import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ userId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must be owner to remove others; anyone can remove themselves
  const { data: myMembership } = await (supabase.from('med_family_members') as any)
    .select('family_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMembership) return NextResponse.json({ error: 'No perteneces a una familia' }, { status: 403 })

  if (userId !== user.id && myMembership.role !== 'owner') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Owner cannot remove themselves (would orphan the family)
  if (userId === user.id && myMembership.role === 'owner') {
    return NextResponse.json({ error: 'El dueño no puede salir de la familia. Elimina la familia primero.' }, { status: 400 })
  }

  await (supabase.from('med_family_members') as any)
    .delete()
    .eq('family_id', myMembership.family_id)
    .eq('user_id', userId)

  return NextResponse.json({ ok: true })
}
