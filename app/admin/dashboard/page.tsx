'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Package, ShoppingCart, TrendingUp, CreditCard, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    totalProducts: 0,
    totalDebts: 0,
    profitToday: 0,
    totalExpenses: 0,
    netProfit: 0
  })
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [selectedMonth])

  const fetchStats = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    const [year, month] = selectedMonth.split('-')
    const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0]
    // Get last day of the selected month
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    // Fetch Today's Sales
    const { data: todaySalesData } = await supabase
      .from('sales')
      .select('price, quantity, product_id')
      .eq('date', today)

    // Fetch Month's Sales
    const { data: monthSalesData } = await supabase
      .from('sales')
      .select('price, quantity, product_id')
      .gte('date', startDate)
      .lte('date', endDate)

    // Fetch Total Products
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Fetch Pending Debts Total
    const { data: debtsData } = await supabase
      .from('debts')
      .select('current_balance')
      .eq('status', 'pending')

    // Fetch Expenses (Mensual)
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', startDate)
      .lte('date', endDate)

    // Calculate Profit
    // Necesitamos el costo de cada producto vendido en el MES para la ganancia mensual real
    let totalCostMonth = 0
    if (monthSalesData && monthSalesData.length > 0) {
      const productIds = monthSalesData.map(s => s.product_id)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, cost')
        .in('id', productIds)
      
      if (productsData) {
        monthSalesData.forEach(sale => {
          const product = productsData.find(p => p.id === sale.product_id)
          if (product) {
            totalCostMonth += (product.cost * sale.quantity)
          }
        })
      }
    }

    const todayTotal = todaySalesData?.reduce((sum, sale) => sum + Number(sale.price), 0) || 0
    const monthTotal = monthSalesData?.reduce((sum, sale) => sum + Number(sale.price), 0) || 0
    
    // Gasto Operativo Mensual
    const totalExpenses = expensesData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
    
    // Ganancia Neta Exacta = Ventas Totales del Mes - Costo de los productos vendidos - Gastos Operativos
    const netProfit = monthTotal - totalCostMonth - totalExpenses

    setStats({
      todaySales: todayTotal,
      monthSales: monthTotal,
      totalProducts: productsCount || 0,
      totalDebts: debtsData?.reduce((sum, debt) => sum + Number(debt.current_balance), 0) || 0,
      profitToday: 0, // deprecado
      totalExpenses: totalExpenses,
      netProfit: netProfit
    })

    setLoading(false)
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-full">
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">Dashboard Gerencial</h1>
          <p className="text-gray-500 font-medium mt-2">Visión integral en tiempo real: Ventas, Costos y Ganancias Exactas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 font-bold text-gray-700"
            />
          </div>
          <div className="hidden md:flex bg-pink-50 p-4 rounded-2xl border border-pink-100 shadow-sm">
            <TrendingUp className="h-8 w-8 text-pink-500" />
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Ganancia Neta Mensual */}
        <div className="bg-gradient-to-br from-green-500 to-green-400 p-8 rounded-3xl shadow-lg shadow-green-200/50 text-white transform transition-all hover:scale-105 hover:shadow-green-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-green-100 uppercase tracking-widest text-sm">Ganancia Neta Mensual</h3>
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-5xl font-extrabold drop-shadow-md">${stats.netProfit.toFixed(2)}</div>
          <p className="text-green-100 text-[10px] mt-3 font-extrabold bg-green-600/30 inline-block px-3 py-1.5 rounded-lg uppercase tracking-wider">Cálculo exacto: Ventas - Costos - Gastos</p>
        </div>

        {/* Ventas Hoy */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/60 transform transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-500 group-hover:text-green-500 transition-colors uppercase tracking-widest text-sm">Ingresos Brutos (Hoy)</h3>
            <div className="bg-green-50 p-2.5 rounded-xl border border-green-100">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="text-5xl font-extrabold text-gray-900">${stats.todaySales.toFixed(2)}</div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/60 transform transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-500 group-hover:text-blue-500 transition-colors uppercase tracking-widest text-sm">Ventas Mensuales</h3>
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-5xl font-extrabold text-gray-900">${stats.monthSales.toFixed(2)}</div>
        </div>

        {/* Gastos Operativos Mensuales */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/60 transform transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-500 group-hover:text-red-500 transition-colors uppercase tracking-widest text-sm">Gastos Operativos Mensuales</h3>
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <DollarSign className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <div className="text-5xl font-extrabold text-red-500">-${stats.totalExpenses.toFixed(2)}</div>
          <p className="text-gray-400 text-sm mt-3 font-semibold">Casilleros, pasajes, publicidad, etc.</p>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/60 transform transition-all hover:-translate-y-1 hover:shadow-lg group lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-500 group-hover:text-red-500 transition-colors uppercase tracking-widest text-sm">Cuentas por Cobrar (Fíado)</h3>
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 animate-pulse">
              <CreditCard className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <div className="text-5xl font-extrabold text-red-500 drop-shadow-sm">${stats.totalDebts.toFixed(2)}</div>
          <p className="text-gray-400 text-sm mt-3 font-semibold">Dinero en la calle, pendiente de recuperar mediante WhatsApp.</p>
        </div>

        {/* Productos en Inventario */}
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/60 transform transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-500 group-hover:text-purple-500 transition-colors uppercase tracking-widest text-sm">Catálogo Activo</h3>
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100">
              <Package className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-5xl font-extrabold text-gray-900">{stats.totalProducts}</div>
          <p className="text-gray-400 text-sm mt-3 font-semibold">Total de tipos de bolsos registrados.</p>
        </div>
      </div>
    </div>
  )
}
