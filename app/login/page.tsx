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

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${next}` },
    })
    if (error) setError(error.message)
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

      {mode !== 'forgot' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">o</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
        </>
      )}

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
