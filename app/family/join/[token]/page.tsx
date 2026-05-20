'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinFamilyPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    params.then(({ token }) => {
      fetch(`/api/family/join/${token}`, { method: 'POST' })
        .then(async (res) => {
          if (res.status === 401) {
            // Not logged in — send to login then back here
            router.push(`/login?next=/family/join/${token}`)
            return
          }
          if (res.ok) {
            setStatus('success')
            setTimeout(() => router.push('/inventory'), 2000)
          } else {
            const data = await res.json()
            setMessage(data.error ?? 'Error al aceptar la invitación')
            setStatus('error')
          }
        })
        .catch(() => { setStatus('error'); setMessage('Error de red') })
    })
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600">Procesando invitación…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl">🎉</div>
            <p className="font-semibold text-slate-900">¡Te uniste a la familia!</p>
            <p className="text-sm text-slate-500">Redirigiendo al inventario…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl">❌</div>
            <p className="font-semibold text-slate-900">No se pudo aceptar</p>
            <p className="text-sm text-red-500">{message}</p>
            <button
              onClick={() => router.push('/inventory')}
              className="text-sm text-brand-600 underline"
            >
              Ir al inventario
            </button>
          </>
        )}
      </div>
    </div>
  )
}
