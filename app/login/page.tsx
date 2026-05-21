'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pill, Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/home'
  const supabase = createClient()

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setInfo(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos.')
    } else {
      window.location.href = next
    }
    setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
        setError('Este email ya tiene una cuenta. Usa "Iniciar sesión" o recupera tu contraseña.')
      } else if (error.message.toLowerCase().includes('load failed') || error.message.toLowerCase().includes('failed to fetch')) {
        setError('Error de conexión. Intenta de nuevo.')
      } else {
        setError(error.message)
      }
    } else if (data.session) {
      window.location.href = '/home'
    } else {
      setInfo('Revisa tu email y confirma tu cuenta para poder ingresar.')
    }
    setLoading(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setInfo('Revisa tu email para restablecer tu contraseña.')
    }
    setLoading(false)
  }

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot

  if (info) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div className="text-4xl">📬</div>
        <p className="text-slate-700 text-sm">{info}</p>
        <button
          onClick={() => { setInfo(null); switchMode('login') }}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h2 className="text-base font-semibold text-slate-800">
        {mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Restablecer contraseña'}
      </h2>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
        />
      </div>

      {mode !== 'forgot' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="mt-1.5 text-xs text-brand-600 hover:text-brand-700"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Repite la contraseña"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
      >
        {loading ? '…'
          : mode === 'login' ? 'Ingresar'
          : mode === 'signup' ? 'Crear cuenta'
          : 'Enviar email de recuperación'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        {mode === 'login' ? (
          <>¿No tienes cuenta?{' '}
            <button type="button" onClick={() => switchMode('signup')} className="text-brand-600 hover:text-brand-700 font-medium">
              Crear cuenta
            </button>
          </>
        ) : (
          <>¿Ya tienes cuenta?{' '}
            <button type="button" onClick={() => switchMode('login')} className="text-brand-600 hover:text-brand-700 font-medium">
              Iniciar sesión
            </button>
          </>
        )}
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MedStock</h1>
          <p className="text-slate-500 mt-1 text-sm">Tu botiquín inteligente</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
