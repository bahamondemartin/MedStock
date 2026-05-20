import { createClient } from '@/lib/supabase/server'
import { computeAlertSummary } from '@/lib/alerts'
import { buildShoppingList } from '@/lib/shopping'
import Link from 'next/link'
import { AlertTriangle, PackageOpen, Clock, ShoppingCart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ExpiryBadge } from '@/components/medications/ExpiryBadge'
import { StockBadge } from '@/components/medications/StockBadge'
import type { MedicationSummary } from '@/lib/supabase/types'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: medications = [] } = await supabase
    .from('v_medication_summary')
    .select('*')
    .order('name') as { data: MedicationSummary[] }

  const summary = computeAlertSummary(medications ?? [])
  const shoppingList = buildShoppingList(medications ?? [])

  const alertMeds = (medications ?? []).filter(
    (m) => m.expiry_status !== 'ok' || m.stock_status !== 'ok'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mi botiquín</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {medications?.length ?? 0} medicamento{(medications?.length ?? 0) !== 1 ? 's' : ''} registrado{(medications?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          value={summary.expiredCount + summary.criticalCount}
          label="Críticos"
          color="red"
        />
        <StatCard
          icon={<PackageOpen className="w-4 h-4 text-amber-500" />}
          value={summary.outOfStockCount + summary.lowStockCount}
          label="Stock bajo"
          color="amber"
        />
        <StatCard
          icon={<ShoppingCart className="w-4 h-4 text-brand-500" />}
          value={shoppingList.length}
          label="Por comprar"
          color="brand"
        />
      </div>

      {/* Alerts section */}
      {alertMeds.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            Requieren atención
          </h2>
          <div className="space-y-2">
            {alertMeds.map((med) => (
              <Card key={med.id} className="border-l-4 border-l-amber-400">
                <div className="px-4 py-3">
                  <p className="font-medium text-slate-900 text-sm">{med.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <StockBadge status={med.stock_status} total={med.total_stock} unit={med.unit} />
                    <ExpiryBadge status={med.expiry_status} nextExpiry={med.next_expiry} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : medications && medications.length > 0 ? (
        <Card className="p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-medium text-slate-900">Todo en orden</p>
          <p className="text-sm text-slate-500 mt-1">Ningún medicamento requiere atención.</p>
        </Card>
      ) : (
        <EmptyState />
      )}

      {/* Quick links */}
      {medications && medications.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/inventory"
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ver inventario
          </Link>
          <Link
            href="/shopping"
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-200 bg-brand-50 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
          >
            Lista de compras {shoppingList.length > 0 && `(${shoppingList.length})`}
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'red' | 'amber' | 'brand'
}) {
  const bg = { red: 'bg-red-50', amber: 'bg-amber-50', brand: 'bg-brand-50' }[color]
  const text = { red: 'text-red-900', amber: 'text-amber-900', brand: 'text-brand-700' }[color]

  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <div className="flex items-center gap-1 mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">💊</div>
      <h2 className="font-semibold text-slate-900 text-lg">Empieza tu botiquín</h2>
      <p className="text-slate-500 text-sm mt-1 mb-6 max-w-xs mx-auto">
        Agrega tus medicamentos para recibir alertas de vencimiento y stock bajo.
      </p>
      <Link
        href="/inventory"
        className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
      >
        Agregar medicamento
      </Link>
    </div>
  )
}
