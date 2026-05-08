import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface MedicationRow {
  id: string
  user_id: string
  name: string
  unit: string
  total_stock: number
  min_stock: number
  next_expiry: string | null
  expiry_status: string
  stock_status: string
}

interface UserAlertData {
  email: string
  expired: MedicationRow[]
  critical: MedicationRow[]
  warning: MedicationRow[]
  outOfStock: MedicationRow[]
  lowStock: MedicationRow[]
}

Deno.serve(async (req) => {
  // Verify this is called by the Supabase cron scheduler
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Get all medications with alerts grouped by user
  const { data: medications, error } = await supabase
    .from('v_medication_summary')
    .select('*')
    .or('expiry_status.in.(expired,critical,warning),stock_status.in.(out_of_stock,low_stock)')

  if (error) {
    console.error('Error fetching medications:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!medications || medications.length === 0) {
    return new Response(JSON.stringify({ message: 'No alerts to send' }))
  }

  // Group by user_id
  const byUser = medications.reduce<Record<string, MedicationRow[]>>((acc, med) => {
    if (!acc[med.user_id]) acc[med.user_id] = []
    acc[med.user_id].push(med)
    return acc
  }, {})

  const userIds = Object.keys(byUser)

  // Fetch user emails
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    console.error('Error fetching users:', usersError)
    return new Response(JSON.stringify({ error: usersError.message }), { status: 500 })
  }

  const emailByUserId = Object.fromEntries(
    users.filter((u) => u.email).map((u) => [u.id, u.email!])
  )

  let sentCount = 0
  const errors: string[] = []

  for (const userId of userIds) {
    const email = emailByUserId[userId]
    if (!email) continue

    const meds = byUser[userId]
    const alertData: UserAlertData = {
      email,
      expired:    meds.filter((m) => m.expiry_status === 'expired'),
      critical:   meds.filter((m) => m.expiry_status === 'critical'),
      warning:    meds.filter((m) => m.expiry_status === 'warning'),
      outOfStock: meds.filter((m) => m.stock_status === 'out_of_stock'),
      lowStock:   meds.filter((m) => m.stock_status === 'low_stock'),
    }

    const html = buildEmailHTML(alertData)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MedStock <alertas@medstock.app>',
        to: email,
        subject: `Resumen de tu botiquín — ${new Date().toLocaleDateString('es-CL')}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      errors.push(`${email}: ${err}`)
    } else {
      sentCount++
      // Record alerts as sent
      for (const med of meds) {
        await supabase.from('alerts').upsert({
          medication_id: med.id,
          type: med.stock_status !== 'ok' ? med.stock_status : 'expiry',
          severity: med.expiry_status === 'expired' || med.stock_status === 'out_of_stock' ? 'critical' : 'warning',
          trigger_date: new Date().toISOString().split('T')[0],
          sent_at: new Date().toISOString(),
        }, { onConflict: 'medication_id,type,trigger_date' })
      }
    }
  }

  return new Response(JSON.stringify({ sent: sentCount, errors }))
})

function buildEmailHTML(data: UserAlertData): string {
  const sections: string[] = []

  if (data.expired.length > 0) {
    sections.push(`
      <h3 style="color:#dc2626;margin:16px 0 8px">🚨 Medicamentos vencidos</h3>
      <ul>${data.expired.map((m) => `<li><strong>${m.name}</strong> — Venció</li>`).join('')}</ul>
    `)
  }

  if (data.critical.length > 0) {
    sections.push(`
      <h3 style="color:#dc2626;margin:16px 0 8px">⚠️ Vencen pronto (≤7 días)</h3>
      <ul>${data.critical.map((m) => `<li><strong>${m.name}</strong> — ${m.next_expiry}</li>`).join('')}</ul>
    `)
  }

  if (data.warning.length > 0) {
    sections.push(`
      <h3 style="color:#d97706;margin:16px 0 8px">📅 Vencen en ≤30 días</h3>
      <ul>${data.warning.map((m) => `<li><strong>${m.name}</strong> — ${m.next_expiry}</li>`).join('')}</ul>
    `)
  }

  if (data.outOfStock.length > 0) {
    sections.push(`
      <h3 style="color:#dc2626;margin:16px 0 8px">📦 Sin stock</h3>
      <ul>${data.outOfStock.map((m) => `<li><strong>${m.name}</strong></li>`).join('')}</ul>
    `)
  }

  if (data.lowStock.length > 0) {
    sections.push(`
      <h3 style="color:#d97706;margin:16px 0 8px">📉 Stock bajo</h3>
      <ul>${data.lowStock.map((m) => `<li><strong>${m.name}</strong> — ${m.total_stock} ${m.unit} (mín: ${m.min_stock})</li>`).join('')}</ul>
    `)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
      <h1 style="font-size:20px;font-weight:700;margin-bottom:4px">💊 MedStock</h1>
      <p style="color:#64748b;margin-bottom:24px">Resumen de alertas de tu botiquín</p>
      ${sections.join('')}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="font-size:12px;color:#94a3b8">
        Accede a tu botiquín en <a href="https://medstock.app" style="color:#0ea5e9">medstock.app</a>
      </p>
    </body>
    </html>
  `
}
