export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  photo_url: string | null
  name: string
  category: string | null
  stock: number
  cost: number
  price: number
  description: string | null
  badge: string | null
  created_at: string
}

export interface Sale {
  id: string
  product_id: string
  quantity: number
  client_name: string | null
  client_phone: string | null
  price: number
  date: string
  time: string
  delivery_location: string | null
  delivery_type: 'casillero' | 'personal' | 'local'
  delivery_status: 'pending' | 'ready' | 'delivered'
  delivery_notes: string | null
  payment_status: 'paid' | 'pending' | 'partial'
  partial_amount: number
  debt_id: string | null
  created_at: string
}

export interface Debt {
  id: string
  client_name: string
  client_phone: string | null
  initial_amount: number
  current_balance: number
  date: string
  status: 'pending' | 'liquidated'
  holder: 'client' | 'casillero'
  created_at: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: 'casillero' | 'pasajes' | 'empaque' | 'producto' | 'otros'
}
