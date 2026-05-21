'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-slate-400 hover:text-slate-600 transition-colors p-1"
      title="Cerrar sesión"
    >
      <LogOut className="w-5 h-5" />
    </button>
  )
}
