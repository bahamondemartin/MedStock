'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Mail, Trash2, Plus, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  email: string | null
}

interface Invite {
  id: string
  email: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

interface FamilyData {
  family: { id: string; name: string; owner_id: string } | null
  members: Member[]
  invites: Invite[]
  role: 'owner' | 'member'
}

export default function FamilyPage() {
  const [data, setData] = useState<FamilyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [familyName, setFamilyName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/family')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  async function createFamily(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName.trim() }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setFamilyName('')
      flash('¡Familia creada!')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setCreating(false)
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError(null)
    try {
      const res = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setInviteEmail('')
      flash('Invitación enviada')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(userId: string) {
    if (!confirm('¿Eliminar este miembro de la familia?')) return
    await fetch(`/api/family/members/${userId}`, { method: 'DELETE' })
    await load()
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900">Familia</h1>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {!data?.family ? (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Crear una familia</h2>
          <p className="text-sm text-slate-500 mb-4">
            Crea un botiquín familiar e invita a otros miembros del hogar.
          </p>
          <form onSubmit={createFamily} className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre de la familia (ej: Casa García)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="submit" loading={creating} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Crear
            </Button>
          </form>
        </Card>
      ) : (
        <>
          {/* Family header */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{data.family.name}</h2>
                <p className="text-xs text-slate-400">
                  {data.members.length} miembro{data.members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Members list */}
          <Card className="divide-y divide-slate-100">
            <div className="px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-700">Miembros</h3>
            </div>
            {data.members.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-700 font-medium truncate max-w-[180px]">
                      {m.email ?? m.user_id.slice(0, 8) + '…'}
                    </p>
                    <p className="text-xs text-slate-400">{m.role === 'owner' ? 'Dueño' : 'Miembro'}</p>
                  </div>
                </div>
                {data.role === 'owner' && m.role !== 'owner' && (
                  <button
                    onClick={() => removeMember(m.user_id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </Card>

          {/* Pending invites */}
          {data.invites.length > 0 && (
            <Card className="divide-y divide-slate-100">
              <div className="px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">Invitaciones pendientes</h3>
              </div>
              {data.invites.map((inv) => (
                <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{inv.email}</p>
                    <p className="text-xs text-slate-400">
                      Expira {new Date(inv.expires_at).toLocaleDateString('es')}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Pendiente</span>
                </div>
              ))}
            </Card>
          )}

          {/* Invite form (owner only) */}
          {data.role === 'owner' && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invitar a alguien
              </h3>
              <form onSubmit={sendInvite} className="flex gap-2">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button type="submit" loading={inviting} size="sm">
                  Invitar
                </Button>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
