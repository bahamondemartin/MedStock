'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Trash2, Plus, Copy, Check, X, UserPlus, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  email: string | null
}

interface FamilyData {
  family: { id: string; name: string; owner_id: string; join_code: string } | null
  members: Member[]
  role: 'owner' | 'member'
}

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [data, setData] = useState<FamilyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [familyName, setFamilyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? null)
        const name = user.user_metadata?.full_name ?? ''
        setUserName(name)
        setNameInput(name)
        setMemberSince(new Date(user.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }))
      }
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

  async function joinFamily(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    setError(null)
    try {
      const res = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setJoinCode('')
      setShowJoinModal(false)
      flash('¡Te uniste a la familia!')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setJoining(false)
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(userId: string) {
    if (!confirm('¿Eliminar este miembro de la familia?')) return
    await fetch(`/api/family/members/${userId}`, { method: 'DELETE' })
    await load()
  }

  async function saveName() {
    setSavingName(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } })
      if (error) throw error
      setUserName(nameInput.trim())
      setEditingName(false)
      flash('Nombre actualizado')
    } catch {
      setError('No se pudo guardar el nombre')
    } finally {
      setSavingName(false)
    }
  }

  const initials = (userName || userEmail || '?')[0].toUpperCase()

  return (
    <div className="space-y-5">
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

      {/* Profile section */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-3">Mi Perfil</h1>
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-brand-600">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 truncate">{userEmail ?? '…'}</p>
              {memberSince && (
                <p className="text-xs text-slate-400 mt-0.5">Miembro desde {memberSince}</p>
              )}
            </div>
          </div>

          {/* Name field */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  placeholder="Ej: María García"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
                >
                  {savingName ? '…' : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(userName) }}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-700">{userName || <span className="text-slate-400 italic">Sin nombre</span>}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-slate-400 hover:text-brand-500 transition-colors p-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Family section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-bold text-slate-900">Mi Familia</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowJoinModal(true)} className="ml-auto">
            <UserPlus className="w-4 h-4 mr-1" />
            Unirse
          </Button>
        </div>

        {loading ? (
          <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
        ) : !data?.family ? (
          <div className="space-y-3">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-1">Crear una familia</h3>
              <p className="text-sm text-slate-500 mb-4">
                Crea un botiquín familiar y comparte el código con tu hogar.
              </p>
              <form onSubmit={createFamily} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre (ej: Casa García)"
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
          </div>
        ) : (
          <div className="space-y-3">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{data.family.name}</h3>
                  <p className="text-xs text-slate-400">
                    {data.members.length} miembro{data.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>

            {data.role === 'owner' && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Código de invitación</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Comparte este código para que otros puedan unirse.
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-center font-mono text-2xl font-bold tracking-widest text-brand-600 bg-brand-50 rounded-xl py-3 px-4">
                    {data.family.join_code}
                  </span>
                  <button
                    onClick={() => copyCode(data.family!.join_code)}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-600" />}
                  </button>
                </div>
              </Card>
            )}

            <Card className="divide-y divide-slate-100">
              <div className="px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">Miembros</h3>
              </div>
              {data.members.map((m) => (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-400">
                        {(m.email ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 font-medium truncate max-w-[180px]">
                        {m.email ?? m.user_id.slice(0, 8) + '…'}
                      </p>
                      <p className="text-xs text-slate-400">{m.role === 'owner' ? 'Administrador' : 'Miembro'}</p>
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
          </div>
        )}
      </div>

      {/* Join modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowJoinModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Unirse a una familia</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Ingresa el código de 6 letras que te compartió el administrador.
            </p>
            <form onSubmit={joinFamily} className="space-y-3">
              <input
                type="text"
                placeholder="XXXXXX"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-2xl font-mono font-bold tracking-[0.3em] uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={() => setShowJoinModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" loading={joining} className="flex-1">
                  Unirse
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
