import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  // Only family owners can invite
  const { data: membership } = await (supabase.from('med_family_members') as any)
    .select('family_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'No perteneces a una familia' }, { status: 403 })
  if (membership.role !== 'owner') return NextResponse.json({ error: 'Solo el dueño puede invitar' }, { status: 403 })

  const { data: family } = await (supabase.from('med_families') as any)
    .select('name')
    .eq('id', membership.family_id)
    .single()

  // Create invite record
  const { data: invite, error } = await (supabase.from('med_family_invites') as any)
    .insert({ family_id: membership.family_id, email: email.trim().toLowerCase(), invited_by: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://med-stock-jade.vercel.app'}/family/join/${invite.token}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'MedStock <no-reply@medstock.app>',
    to: email.trim(),
    subject: `Te invitaron al botiquín familiar "${family.name}"`,
    html: `
      <p>Hola,</p>
      <p>Te invitaron a unirte al botiquín familiar <strong>${family.name}</strong> en MedStock.</p>
      <p><a href="${joinUrl}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Aceptar invitación</a></p>
      <p>Este enlace expira en 7 días.</p>
    `,
  })

  return NextResponse.json({ ok: true })
}
