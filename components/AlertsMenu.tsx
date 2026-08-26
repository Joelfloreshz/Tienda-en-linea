'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

export default function AlertsMenu() {
  const [alerts, setAlerts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      const newAlerts: string[] = []

      // Check Low Stock (< 3)
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, stock')
        .lt('stock', 3)
        
      if (lowStockProducts) {
        lowStockProducts.forEach(p => {
          newAlerts.push(`El producto "${p.name}" tiene solo ${p.stock} unidades disponibles.`)
        })
      }

      // Check Pending Deliveries for Today
      const today = new Date().toISOString().split('T')[0]
      const { data: todaySales } = await supabase
        .from('sales')
        .select('*')
        .eq('date', today)
        .not('delivery_location', 'is', null)
        .neq('delivery_location', '')

      if (todaySales && todaySales.length > 0) {
        newAlerts.push(`Hoy tienes ${todaySales.length} entregas programadas.`)
      }

      // Check pending debts
      const { data: pendingDebts } = await supabase
        .from('debts')
        .select('client_name, current_balance')
        .eq('status', 'pending')

      if (pendingDebts) {
        pendingDebts.forEach(d => {
          newAlerts.push(`${d.client_name} tiene una deuda pendiente de $${d.current_balance.toFixed(2)}.`)
        })
      }

      setAlerts(newAlerts)
      setLoading(false)
    }

    fetchAlerts()
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative" />}>
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificaciones</span>
          {alerts.length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600"></span>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Alertas y Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Cargando...</div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No hay alertas nuevas.</div>
        ) : (
          alerts.map((alert, idx) => (
            <DropdownMenuItem key={idx} className="p-3 text-sm cursor-default">
              <span className="text-red-600 mr-2">•</span> {alert}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
