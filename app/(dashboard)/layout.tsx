import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, ClipboardList, ShoppingCart, UserCircle } from 'lucide-react'
import { SignOutButton } from '@/components/ui/SignOutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-lg">💊 MedStock</span>
          <SignOutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-slate-200 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex">
          <NavLink href="/home" icon={<LayoutDashboard className="w-5 h-5" />} label="Inicio" />
          <NavLink href="/prescriptions" icon={<ClipboardList className="w-5 h-5" />} label="Tratamientos" />
          <NavLink href="/shopping" icon={<ShoppingCart className="w-5 h-5" />} label="Compras" />
          <NavLink href="/profile" icon={<UserCircle className="w-5 h-5" />} label="Mi Perfil" />
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
