'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Wallet, DollarSign, Edit2, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Quick entry state
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '' as number | string,
    category: 'otros'
  })
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)

  const handleOpenEdit = (expense: any) => {
    setEditingExpense({
      ...expense,
      amount: expense.amount.toString()
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('expenses').update({
        description: editingExpense.description,
        amount: Number(editingExpense.amount),
        category: editingExpense.category
      }).eq('id', editingExpense.id)

      if (error) throw error
      toast.success('Gasto actualizado')
      setEditModalOpen(false)
      fetchExpenses()
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [selectedMonth])

  const fetchExpenses = async () => {
    setLoading(true)
    const [year, month] = selectedMonth.split('-')
    const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (data) setExpenses(data as Expense[])
    setLoading(false)
  }

  const handleQuickSave = async () => {
    const amount = Number(newExpense.amount)
    
    if (!newExpense.description) return toast.error('Ingresa una descripción')
    if (!amount || amount <= 0) return toast.error('Monto inválido')

    setSaving(true)
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          description: newExpense.description,
          amount: amount,
          category: newExpense.category
        }])

      if (error) throw error

      toast.success('Gasto registrado exitosamente 📉')
      
      setNewExpense({
        description: '',
        amount: '',
        category: 'otros'
      })
      fetchExpenses()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto de forma permanente?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
    } else {
      toast.success('Gasto eliminado')
      fetchExpenses()
    }
  }

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-full">
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 drop-shadow-sm">
            <Wallet className="h-8 w-8 text-pink-500" /> Control de Gastos
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Registra alquiler de casilleros, empaques, pasajes y otros gastos operativos.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Buscar gasto por descripción..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 text-base"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 font-bold text-gray-700"
          />
        </div>
      </div>

      {/* REGISTRO RÁPIDO */}
      <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-3xl shadow-lg border border-white/60">
        <h3 className="text-sm font-extrabold text-pink-600 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Plus className="h-4 w-4" /> Registrar Gasto
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Descripción *</label>
            <Input placeholder="Ej. Pago mensualidad de casillero..." className="h-11 rounded-xl border-pink-100 font-medium" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Categoría</label>
            <select 
              className="w-full h-11 px-4 rounded-xl border border-pink-100 bg-white font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-sm text-gray-700"
              value={newExpense.category}
              onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
            >
              <option value="casillero">📦 Pago de Casilleros</option>
              <option value="pasajes">🚕 Transporte / Pasajes</option>
              <option value="empaque">🛍️ Bolsas y Empaques</option>
              <option value="producto">🛒 Compra de Producto</option>
              <option value="otros">🔧 Otros Gastos</option>
            </select>
          </div>
          <div className="w-32">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Monto ($) *</label>
            <Input type="number" step="0.01" className="h-11 font-extrabold text-red-500 text-center rounded-xl border-red-100 shadow-sm bg-red-50/30" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" />
          </div>
          <Button onClick={handleQuickSave} disabled={saving} className="h-11 px-8 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md shadow-red-200 font-bold transition-all hover:-translate-y-1">
            {saving ? 'Guardando...' : 'Guardar Gasto'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Buscar en el historial de gastos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 text-base"
          />
        </div>
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-white/50 font-bold text-gray-700 flex items-center gap-2">
          Total mostrado: <span className="text-red-500 text-xl font-extrabold">${totalFiltered.toFixed(2)}</span>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-red-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-red-50 to-white p-6 border-b border-red-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                 <Edit2 className="h-5 w-5 text-red-500" /> Editar Gasto
              </DialogTitle>
            </DialogHeader>
          </div>
          {editingExpense && (
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Descripción</Label>
                <Input value={editingExpense.description} onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})} className="rounded-xl h-11" required />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Categoría</Label>
                <select 
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white font-medium"
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                >
                  <option value="casillero">Pago de Casilleros</option>
                  <option value="pasajes">Transporte / Pasajes</option>
                  <option value="empaque">Bolsas y Empaques</option>
                  <option value="producto">Compra de Producto</option>
                  <option value="otros">Otros Gastos</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Monto ($)</Label>
                <Input type="number" step="0.01" value={editingExpense.amount} onChange={(e) => setEditingExpense({...editingExpense, amount: e.target.value})} className="rounded-xl h-11 font-bold text-red-600" required />
              </div>
              <DialogFooter className="pt-4 border-t border-red-50 mt-4">
                <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white rounded-xl">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* TABLA DE GASTOS ESTILO ERP */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Fecha</th>
                <th className="px-6 py-4 font-bold tracking-wider">Descripción</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Categoría</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Monto</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-white/90 transition-all duration-200 group">
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-gray-900 truncate max-w-[300px]" title={expense.description}>
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border ${
                       expense.category === 'producto' 
                         ? 'bg-purple-100 text-purple-700 border-purple-200' 
                         : 'bg-gray-100 text-gray-600 border-gray-200'
                     }`}>
                       {expense.category}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-red-500 text-base">
                    -${Number(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleOpenEdit(expense)} title="Editar Gasto">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(expense.id)} title="Eliminar gasto">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-bold text-gray-500">Sin gastos registrados</p>
                      <p className="text-gray-400 mt-1">El historial de salidas está limpio.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
