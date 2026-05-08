import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-lg">💊 MedStock</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-slate-200 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex">
          <NavLink href="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Inicio" />
          <NavLink href="/inventory" icon={<Package className="w-5 h-5" />} label="Inventario" />
          <NavLink href="/shopping" icon={<ShoppingCart className="w-5 h-5" />} label="Compras" />
        </div>
      </nav>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center gap-1 py-3 text-slate-400 hover:text-brand-500 transition-colors"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  )
}
