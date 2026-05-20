import Link from 'next/link'
import { Pill, ShieldCheck, Bell, Users, ShoppingCart, ArrowRight, PackageCheck } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* Nav */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">MedStock</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Iniciar sesión →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <PackageCheck className="w-3.5 h-3.5" />
          Gestión inteligente de medicamentos
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
          Tu botiquín siempre<br />
          <span className="text-brand-500">bajo control</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8">
          MedStock te ayuda a registrar los medicamentos de tu hogar, controlar el stock, recibir alertas antes de que venzan y saber cuándo comprar.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm"
        >
          Empezar gratis
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-slate-400 mt-3">Sin contraseña. Solo tu email.</p>
      </section>

      {/* App preview placeholder */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
          {/* Mock app bar */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-brand-500 flex items-center justify-center">
              <Pill className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">MedStock</span>
          </div>
          {/* Mock inventory items */}
          <div className="p-4 space-y-3">
            {[
              { name: 'Ibuprofeno 400mg', cat: 'Analgésico', stock: '24 comprimidos', expiry: '20 may 2026', stockColor: 'bg-green-100 text-green-700', expiryColor: 'bg-green-100 text-green-700' },
              { name: 'Amoxicilina 500mg', cat: 'Antibiótico', stock: '3 cápsulas', expiry: '12 jun 2025', stockColor: 'bg-amber-100 text-amber-700', expiryColor: 'bg-amber-100 text-amber-700' },
              { name: 'Loratadina 10mg', cat: 'Antihistamínico', stock: '0 comprimidos', expiry: '—', stockColor: 'bg-red-100 text-red-700', expiryColor: 'bg-slate-100 text-slate-500' },
            ].map((item) => (
              <div key={item.name} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                <p className="text-xs text-slate-400 mb-2">{item.cat}</p>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.stockColor}`}>{item.stock}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.expiryColor}`}>{item.expiry}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">Todo lo que necesitas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <PackageCheck className="w-5 h-5 text-brand-500" />,
              title: 'Control de stock',
              desc: 'Registra tus medicamentos por lotes. Siempre sabrás cuánto tienes de cada uno.',
            },
            {
              icon: <Bell className="w-5 h-5 text-amber-500" />,
              title: 'Alertas de vencimiento',
              desc: 'Te avisamos cuando un medicamento está por vencer: crítico (7 días), advertencia (30 días).',
            },
            {
              icon: <ShoppingCart className="w-5 h-5 text-green-500" />,
              title: 'Lista de compras',
              desc: 'Genera automáticamente lo que necesitas comprar según stock mínimo y próximos vencimientos.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
              title: 'FEFO automático',
              desc: 'Al registrar una salida, el sistema descuenta del lote que vence primero (First Expired, First Out).',
            },
            {
              icon: <Users className="w-5 h-5 text-rose-500" />,
              title: 'Botiquín familiar',
              desc: 'Comparte el inventario con tu familia. Invita a otros miembros del hogar por email.',
            },
            {
              icon: <Pill className="w-5 h-5 text-sky-500" />,
              title: 'Sin contraseñas',
              desc: 'Accede con tu email mediante enlace mágico. Seguro, simple y sin nada que recordar.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 p-5 hover:border-brand-200 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-brand-500 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">¿Listo para empezar?</h2>
          <p className="text-brand-100 mb-6 text-sm">Es gratis. Solo necesitas tu email.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors text-sm shadow-sm"
          >
            Crear mi botiquín
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        MedStock · Gestión de medicamentos para el hogar
      </footer>
    </main>
  )
}
