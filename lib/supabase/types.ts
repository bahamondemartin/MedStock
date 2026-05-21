export type Category = 'analgésico' | 'antibiótico' | 'antiácido' | 'antihistamínico' | 'otro'
export type Unit = 'comprimidos' | 'cápsulas' | 'ml' | 'sobres' | 'unidades'
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok'
export type StockStatus = 'out_of_stock' | 'low_stock' | 'ok'
export type AlertType = 'expiry' | 'low_stock' | 'out_of_stock'
export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Medication {
  id: string
  user_id: string
  name: string
  category: Category | null
  unit: Unit
  min_stock: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StockItem {
  id: string
  medication_id: string
  quantity: number
  expiry_date: string | null
  purchase_date: string
  notes: string | null
  created_at: string
}

export interface ConsumptionLog {
  id: string
  medication_id: string
  quantity_used: number
  date: string
  reason: string | null
  created_at: string
}

export interface Alert {
  id: string
  medication_id: string
  type: AlertType
  severity: AlertSeverity
  trigger_date: string
  sent_at: string | null
  created_at: string
}

export interface MedicationSummary {
  id: string
  user_id: string
  name: string
  category: Category | null
  unit: Unit
  min_stock: number
  is_pediatric: boolean
  total_stock: number
  next_expiry: string | null
  expiry_status: ExpiryStatus
  stock_status: StockStatus
}

export interface Prescription {
  id: string
  user_id: string
  medication_id: string | null
  medication_name: string
  dose: string
  schedule_times: string[]
  frequency_hours: number | null
  start_date: string
  end_date: string | null
  active: boolean
  notes: string | null
  patient_name: string | null
  created_at: string
}

export type FamilyRole = 'owner' | 'member'

export interface MedFamily {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface MedFamilyMember {
  id: string
  family_id: string
  user_id: string
  role: FamilyRole
  joined_at: string
}

export interface MedFamilyInvite {
  id: string
  family_id: string
  email: string
  token: string
  invited_by: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      medications: {
        Row: Medication
        Insert: Omit<Medication, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Medication, 'id' | 'user_id' | 'created_at'>>
      }
      stock_items: {
        Row: StockItem
        Insert: Omit<StockItem, 'id' | 'created_at'>
        Update: Partial<Omit<StockItem, 'id' | 'medication_id' | 'created_at'>>
      }
      consumption_log: {
        Row: ConsumptionLog
        Insert: Omit<ConsumptionLog, 'id' | 'created_at'>
        Update: Partial<Omit<ConsumptionLog, 'id' | 'medication_id' | 'created_at'>>
      }
      alerts: {
        Row: Alert
        Insert: Omit<Alert, 'id' | 'created_at'>
        Update: Partial<Omit<Alert, 'id' | 'medication_id' | 'created_at'>>
      }
    }
    Views: {
      v_medication_summary: {
        Row: MedicationSummary
      }
    }
  }
}
