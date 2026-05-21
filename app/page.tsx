import Link from 'next/link'
import { Pill, ShieldCheck, Bell, ShoppingCart } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">MedStock</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-500 flex items-center justify-center mb-6 shadow-lg">
          <Pill className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Tu botiquín inteligente
        </h1>
        <p className="text-slate-500 text-lg max-w-sm mb-10">
          Controla tus medicamentos, evita vencimientos y nunca te quedes sin stock.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base shadow-sm"
        >
          Comenzar gratis
        </Link>
        <p className="text-slate-400 text-sm mt-3">Sin contraseñas. Solo tu email.</p>
      </section>

      {/* Features */}
      <section className="px-6 pb-16 grid gap-4 max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Control de vencimientos</h3>
            <p className="text-slate-500 text-sm mt-0.5">Alertas automáticas antes de que tus medicamentos expiren.</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Alertas de stock</h3>
            <p className="text-slate-500 text-sm mt-0.5">Notificaciones cuando el stock baja del mínimo definido.</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Lista de compras automática</h3>
            <p className="text-slate-500 text-sm mt-0.5">Genera tu lista de reposición según stock y vencimientos.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
