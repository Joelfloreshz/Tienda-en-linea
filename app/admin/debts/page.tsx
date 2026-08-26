'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Debt } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, CreditCard, MessageSquare, Plus, Receipt, PartyPopper, Trash2, Edit2, Send } from 'lucide-react'

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Payment states (Initialized as empty string to fix the "025" bug)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | string>('')
  const [processing, setProcessing] = useState(false)

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<any>(null)

  // WhatsApp Modal State
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waDebt, setWaDebt] = useState<any>(null)
  const [waGreeting, setWaGreeting] = useState('Buenos días ☀️')
  const [waMessageType, setWaMessageType] = useState('recordatorio_amable')

  const handleOpenWaModal = (debt: any) => {
    setWaDebt(debt)
    setWaGreeting('Buenos días ☀️')
    setWaMessageType('recordatorio_amable')
    setWaModalOpen(true)
  }

  const getWhatsAppLink = () => {
    if (!waDebt) return '#'
    let rawPhone = waDebt.client_phone ? waDebt.client_phone.replace(/\D/g, '') : ''
    
    // Auto-formateo a +503 si el número tiene 8 dígitos exactos
    if (rawPhone.length === 8) {
      rawPhone = '503' + rawPhone
    }
    
    let text = `${waGreeting} ${waDebt.client_name || ''}, te escribimos de Lovely Bags. 💖 `
    
    if (waMessageType === 'recordatorio_amable') {
      text += `Queremos recordarte amablemente sobre tu cuenta pendiente por el monto de $${Number(waDebt.current_balance).toFixed(2)}. Si tienes dudas, estamos a la orden. ✨`
    } else if (waMessageType === 'aviso_vencimiento') {
      text += `Este es un aviso importante: tu cuenta por el monto de $${Number(waDebt.current_balance).toFixed(2)} está próxima a vencer o ya ha vencido. Te invitamos a realizar tu pago lo antes posible para evitar inconvenientes. 🙏`
    } else if (waMessageType === 'abono_pendiente') {
      text += `Esperamos que estés teniendo un excelente día. Te escribimos para acordar el próximo abono de tu cuenta por $${Number(waDebt.current_balance).toFixed(2)}. ¿Cuándo podríamos agendarlo? 📆`
    } else {
      text += `Queríamos platicar contigo sobre tu cuenta pendiente de $${Number(waDebt.current_balance).toFixed(2)}.`
    }
    
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`
  }

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt({
      ...debt,
      initial_amount: debt.initial_amount.toString(),
      current_balance: debt.current_balance.toString()
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('debts').update({
        client_name: editingDebt.client_name,
        client_phone: editingDebt.client_phone,
        initial_amount: Number(editingDebt.initial_amount),
        current_balance: Number(editingDebt.current_balance),
        status: Number(editingDebt.current_balance) <= 0 ? 'liquidated' : 'pending'
      }).eq('id', editingDebt.id)

      if (error) throw error
      toast.success('Cuenta actualizada')
      setEditModalOpen(false)
      fetchDebts()
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta por cobrar de forma permanente?')) return
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
    } else {
      toast.success('Cuenta eliminada')
      fetchDebts()
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setDebts(data as Debt[])
    setLoading(false)
  }

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt)
    setPaymentAmount('') // Dejar vacío para evitar el bug del 0
    setIsDialogOpen(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDebt) return
    
    const amount = Number(paymentAmount)
    
    if (!amount || amount <= 0 || amount > selectedDebt.current_balance) {
      toast.error('Monto inválido. Verifica la cantidad ingresada.')
      return
    }

    setProcessing(true)
    try {
      const newBalance = selectedDebt.current_balance - amount
      const status = newBalance <= 0 ? 'liquidated' : 'pending'

      const { error } = await supabase
        .from('debts')
        .update({ 
          current_balance: newBalance,
          status: status
        })
        .eq('id', selectedDebt.id)

      if (error) throw error

      toast.success(status === 'liquidated' ? '¡Deuda liquidada! 🎉' : 'Abono registrado con éxito ✨')
      setIsDialogOpen(false)
      fetchDebts()
    } catch (error: any) {
      toast.error('Error al procesar pago: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const filteredDebts = debts.filter(d => 
    d.client_name?.toLowerCase().includes(search.toLowerCase())
  )

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
            <CreditCard className="h-8 w-8 text-pink-500" /> Cuentas por Cobrar
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gestiona abonos y envía recordatorios amigables de cobranza.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Buscar cuenta por cliente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 text-base"
        />
      </div>

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-blue-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-blue-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                 <Edit2 className="h-5 w-5 text-blue-500" /> Editar Cuenta
              </DialogTitle>
            </DialogHeader>
          </div>
          {editingDebt && (
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Cliente</Label>
                <Input value={editingDebt.client_name} onChange={(e) => setEditingDebt({...editingDebt, client_name: e.target.value})} className="rounded-xl h-11" required />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Teléfono</Label>
                <Input value={editingDebt.client_phone || ''} onChange={(e) => setEditingDebt({...editingDebt, client_phone: e.target.value})} className="rounded-xl h-11" />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="text-gray-700 font-semibold">Deuda Original ($)</Label>
                  <Input type="number" step="0.01" value={editingDebt.initial_amount} onChange={(e) => setEditingDebt({...editingDebt, initial_amount: e.target.value})} className="rounded-xl h-11 font-bold text-gray-600" required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-gray-700 font-semibold">Saldo Restante ($)</Label>
                  <Input type="number" step="0.01" value={editingDebt.current_balance} onChange={(e) => setEditingDebt({...editingDebt, current_balance: e.target.value})} className="rounded-xl h-11 font-bold text-red-600" required />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-blue-50 mt-4">
                <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* WHATSAPP MODAL */}
      <Dialog open={waModalOpen} onOpenChange={setWaModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-green-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b border-green-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                 <MessageSquare className="h-5 w-5 text-green-500" /> Notificar a Cliente
              </DialogTitle>
            </DialogHeader>
          </div>
          {waDebt && (
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Elige el Saludo</Label>
                <select 
                  className="w-full h-11 px-4 rounded-xl border border-green-200 bg-white font-bold text-gray-700"
                  value={waGreeting}
                  onChange={(e) => setWaGreeting(e.target.value)}
                >
                  <option value="Buenos días ☀️">☀️ Buenos Días</option>
                  <option value="Buenas tardes 🌤️">🌤️ Buenas Tardes</option>
                  <option value="Buenas noches 🌙">🌙 Buenas Noches</option>
                  <option value="Hola 👋">👋 Hola (Neutral)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Tipo de Mensaje</Label>
                <select 
                  className="w-full h-11 px-4 rounded-xl border border-green-200 bg-white font-bold text-gray-700"
                  value={waMessageType}
                  onChange={(e) => setWaMessageType(e.target.value)}
                >
                  <option value="recordatorio_amable">🌸 Recordatorio Amable</option>
                  <option value="abono_pendiente">📆 Acordar Abono</option>
                  <option value="aviso_vencimiento">⚠️ Aviso de Vencimiento</option>
                  <option value="otro">💬 Otro / Personalizado</option>
                </select>
              </div>
              <DialogFooter className="pt-4 border-t border-green-50 mt-4">
                <Button type="button" variant="ghost" onClick={() => setWaModalOpen(false)} className="rounded-xl">Cancelar</Button>
                <a 
                  href={getWhatsAppLink()} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={() => setWaModalOpen(false)}
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl h-10 px-6 font-bold shadow-md shadow-green-200 transition-all hover:-translate-y-1"
                >
                  <Send className="h-4 w-4" /> Enviar WhatsApp
                </a>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE ABONO RÁPIDO PREMIUM */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-pink-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-pink-50 to-white p-6 border-b border-pink-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Receipt className="h-6 w-6 text-pink-500" /> Registrar Abono
              </DialogTitle>
            </DialogHeader>
          </div>
          {selectedDebt && (
            <form onSubmit={handlePayment} className="p-6 space-y-6">
              <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 flex justify-between items-center">
                 <div>
                   <p className="text-[10px] text-pink-600 font-extrabold uppercase tracking-widest">Cliente</p>
                   <p className="font-bold text-gray-900 text-lg">{selectedDebt.client_name}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-pink-600 font-extrabold uppercase tracking-widest">Saldo Restante</p>
                   <p className="font-extrabold text-red-500 text-2xl">${Number(selectedDebt.current_balance).toFixed(2)}</p>
                 </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700 font-semibold text-sm block">Monto del abono de hoy ($)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">$</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    max={selectedDebt.current_balance} 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    required 
                    placeholder="0.00"
                    autoFocus
                    className="pl-8 font-extrabold text-2xl h-16 rounded-2xl border-pink-200 text-pink-600 bg-white shadow-inner focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl hover:bg-gray-100 text-gray-500">Cancelar</Button>
                <Button type="submit" disabled={processing} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-md min-w-[120px] h-11 text-base">
                  {processing ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* TABLA PREMIUM DE ALTA DENSIDAD */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Deuda Original</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Saldo Restante</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Gestión de Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDebts.map((debt) => {
                return (
                  <tr key={debt.id} className="hover:bg-white/90 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-gray-900 text-base">{debt.client_name}</div>
                      <div className="text-[11px] font-semibold text-gray-400">{debt.client_phone || 'Sin número de contacto'}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-400 text-base">
                      ${Number(debt.initial_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-extrabold text-red-500 text-lg">
                          ${Number(debt.current_balance).toFixed(2)}
                        </span>
                        <div className="w-full max-w-[100px] bg-gray-100 rounded-full h-1.5 overflow-hidden flex justify-end">
                          <div 
                            className="bg-green-400 h-1.5 rounded-full" 
                            style={{ width: `${((debt.initial_amount - debt.current_balance) / debt.initial_amount) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">
                          {(((debt.initial_amount - debt.current_balance) / debt.initial_amount) * 100).toFixed(0)}% Pagado
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {debt.status === 'liquidated' ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-green-200 shadow-sm">
                          Liquidado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-red-200 shadow-sm animate-pulse">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                        {debt.status === 'pending' ? (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" onClick={() => handleOpenPayment(debt)} className="bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 h-9 rounded-xl shadow-sm font-bold transition-all hover:scale-105">
                              <Plus className="h-4 w-4 mr-1" /> Abono
                            </Button>
                            {debt.client_phone ? (
                              <Button variant="ghost" onClick={() => handleOpenWaModal(debt)} className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 h-9 w-10" title="Recordar por WhatsApp">
                                <MessageSquare className="h-4 w-4 shrink-0" />
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1 text-green-500 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                               <PartyPopper className="h-4 w-4" /> Cuenta Finalizada
                            </span>
                          </div>
                        )}
                        <div className="flex justify-center gap-2 mt-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleOpenEdit(debt)} title="Editar Cuenta">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(debt.id)} title="Eliminar Cuenta">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <PartyPopper className="h-16 w-16 text-pink-300 mb-4" />
                      <p className="text-xl font-bold text-gray-500">¡Excelente noticia!</p>
                      <p className="text-gray-400 mt-1">No hay cuentas por cobrar pendientes o el cliente no existe.</p>
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
