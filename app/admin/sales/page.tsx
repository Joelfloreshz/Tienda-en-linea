'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sale, Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, ShoppingCart, MessageSquare, Plus, Trash2, PackageSearch, Truck, MapPin, CheckCircle2, Edit2, Send, Calendar, Bell } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Quick entry state 
  const [newSale, setNewSale] = useState({
    product_id: '',
    quantity: '1' as number | string,
    client_name: '',
    client_phone: '',
    price: '' as number | string,
    payment_status: 'paid',
    partial_amount: '' as number | string,
    // Hybrid Logistics
    delivery_type: 'casillero',
    delivery_notes: '',
  })
  const [savingSale, setSavingSale] = useState(false)

  // WhatsApp Modal State
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waSale, setWaSale] = useState<any>(null)
  const [waGreeting, setWaGreeting] = useState('Buenos días ☀️')
  const [waMessageType, setWaMessageType] = useState('preparando')

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<any>(null)

  const handleOpenWaModal = (sale: any) => {
    setWaSale(sale)
    setWaGreeting('Buenos días ☀️')
    setWaMessageType(sale.delivery_type === 'casillero' ? 'casillero' : sale.delivery_type === 'personal' ? 'personal' : sale.delivery_type === 'delivery' ? 'delivery' : 'preparando')
    setWaModalOpen(true)
  }

  const getWhatsAppLink = () => {
    if (!waSale) return '#'
    let phone = waSale.client_phone ? waSale.client_phone.replace(/\D/g, '') : ''
    if (phone.length === 8) {
      phone = '503' + phone
    }
    const productName = waSale.products?.name || 'Producto'
    
    let text = `${waGreeting} ${waSale.client_name || ''}, `
    
    if (waMessageType === 'preparando') {
      text += `estamos preparando tu pedido de ${productName}. Pronto te avisaremos cuando esté en camino! 📦`
    } else if (waMessageType === 'casillero') {
      text += `¡excelentes noticias! Tu pedido de ${productName} ya está en ${waSale.delivery_notes || 'el casillero'} listo para retirar. Recuerda cancelar el total ahí mismo. ✨`
    } else if (waMessageType === 'personal') {
      text += `te confirmo nuestra entrega personal de ${productName} en ${waSale.delivery_notes}. ¿Nos vemos allá? 🤝`
    } else if (waMessageType === 'delivery') {
      text += `estamos preparando tu envío por Delivery hacia ${waSale.delivery_notes}. ¡Pronto te compartiremos el comprobante! 🛵`
    } else {
      text += `te escribimos de Lovely Bags sobre tu pedido de ${productName}. 💖`
    }
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  const handleOpenEdit = (sale: any) => {
    setEditingSale({ ...sale })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('sales').update({
        client_name: editingSale.client_name,
        client_phone: editingSale.client_phone,
        delivery_type: editingSale.delivery_type,
        delivery_notes: editingSale.delivery_notes
      }).eq('id', editingSale.id)

      if (error) throw error
      toast.success('Detalles de venta actualizados')
      setEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const fetchData = async () => {
    setLoading(true)
    const [year, month] = selectedMonth.split('-')
    const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    const [salesRes, productsRes] = await Promise.all([
      supabase.from('sales').select('*, products(name)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: false }),
      supabase.from('products').select('*').gt('stock', 0)
    ])
    
    if (salesRes.data) setSales(salesRes.data as Sale[])
    if (productsRes.data) setProducts(productsRes.data as Product[])
    setLoading(false)
  }

  // Auto-calculate price when product changes in quick entry
  useEffect(() => {
    if (newSale.product_id) {
      const product = products.find(p => p.id === newSale.product_id)
      const qty = Number(newSale.quantity) || 0
      if (product && qty > 0) {
        setNewSale(prev => ({ ...prev, price: product.price * qty }))
      }
    }
  }, [newSale.product_id, newSale.quantity, products])

  const handleQuickSave = async () => {
    const qty = Number(newSale.quantity)
    const price = Number(newSale.price)
    const partial = Number(newSale.partial_amount) || 0

    if (!newSale.product_id) return toast.error('Selecciona un producto')
    if (!qty || qty <= 0) return toast.error('Cantidad inválida')
    if (price <= 0) return toast.error('El precio total debe ser mayor a 0')
    if (newSale.delivery_type === 'personal' && !newSale.delivery_notes) return toast.error('Ingresa el lugar y hora para la entrega personal')

    setSavingSale(true)
    
    try {
      const selectedProduct = products.find(p => p.id === newSale.product_id)
      if (!selectedProduct) throw new Error('Producto inválido')
      if (selectedProduct.stock < qty) throw new Error(`Stock insuficiente. Solo quedan ${selectedProduct.stock}.`)

      let debtId = null
      
      // If not fully paid, create debt automatically
      if (newSale.payment_status === 'pending' || newSale.payment_status === 'partial') {
        const balance = newSale.payment_status === 'pending' ? price : price - partial
        if (!newSale.client_name) throw new Error('Se requiere el nombre del cliente para registrar una cuenta por cobrar (Fíado)')
        if (balance <= 0) throw new Error('El abono parcial no puede cubrir toda la deuda')
        
        // If it's casillero and pending, the casillero holds the money
        const debtHolder = newSale.delivery_type === 'casillero' ? 'casillero' : 'client'

        const { data: debtData, error: debtError } = await supabase
          .from('debts')
          .insert([{
            client_name: newSale.client_name,
            client_phone: newSale.client_phone,
            initial_amount: price,
            current_balance: balance,
            status: 'pending',
            holder: debtHolder
          }])
          .select()
          .single()

        if (debtError) throw debtError
        debtId = debtData.id
      }

      // Record Sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          product_id: newSale.product_id,
          quantity: qty,
          client_name: newSale.client_name,
          client_phone: newSale.client_phone,
          price: price,
          delivery_type: newSale.delivery_type,
          delivery_status: 'pending',
          delivery_notes: newSale.delivery_notes,
          payment_status: newSale.payment_status,
          partial_amount: newSale.payment_status === 'partial' ? partial : 0,
          debt_id: debtId
        }])

      if (saleError) throw saleError

      // Restar Stock Automáticamente
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: selectedProduct.stock - qty })
        .eq('id', selectedProduct.id)

      if (stockError) throw new Error('Venta guardada pero hubo error al restar el stock.')

      toast.success('¡Venta y Logística registradas con éxito! 🚀')
      
      setNewSale({
        product_id: '',
        quantity: '1',
        client_name: '',
        client_phone: '',
        price: '',
        payment_status: 'paid',
        partial_amount: '',
        delivery_type: 'casillero',
        delivery_notes: ''
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSavingSale(false)
    }
  }

  const handleUpdateDeliveryStatus = async (saleId: string, newStatus: string) => {
    const { error } = await supabase.from('sales').update({ delivery_status: newStatus }).eq('id', saleId)
    if (error) {
      toast.error('Error al actualizar estado logístico.')
    } else {
      toast.success('Estado logístico actualizado.')
      fetchData()
    }
  }

  const handleDelete = async (sale: Sale) => {
    if (!confirm(`¿Anular esta venta?\n\nLógica Experta: Se restaurarán ${sale.quantity} unidad(es) de stock y se eliminarán cobros asociados.`)) return
    
    const { error: deleteError } = await supabase.from('sales').delete().eq('id', sale.id)
    if (deleteError) {
      toast.error('Error al eliminar: ' + deleteError.message)
      return
    }

    // Restore stock
    const { data: productData } = await supabase.from('products').select('stock').eq('id', sale.product_id).single()
    if (productData) {
      await supabase.from('products').update({ stock: productData.stock + sale.quantity }).eq('id', sale.product_id)
    }

    if (sale.debt_id) {
       await supabase.from('debts').delete().eq('id', sale.debt_id)
    }

    toast.success('Venta anulada y stock devuelto.')
    fetchData()
  }

  const filteredSales = sales.filter(s => 
    s.client_name?.toLowerCase().includes(search.toLowerCase()) || 
    (s as any).products?.name?.toLowerCase().includes(search.toLowerCase())
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
            <Truck className="h-8 w-8 text-pink-500" /> Logística de Ventas
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Controla envíos (Casilleros y Entregas Personales) y notifica por WhatsApp.</p>
        </div>
      </div>



      {/* REGISTRO RÁPIDO REDISEÑADO */}
      <div className="relative z-20 bg-white/90 backdrop-blur-2xl p-6 rounded-3xl shadow-lg border border-white/60">
        <h3 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Plus className="h-5 w-5 text-pink-500" /> Registrar Venta / Envío
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PASO 1: PRODUCTO Y CLIENTE */}
          <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">1. Producto y Cliente</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Producto *</label>
                <div className="relative">
                  <div 
                    className="w-full h-11 px-4 rounded-xl border border-pink-100 bg-white font-medium flex items-center justify-between cursor-pointer"
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                  >
                    {newSale.product_id ? (
                      <div className="flex items-center gap-2">
                        {products.find(p => p.id === newSale.product_id)?.photo_url ? (
                          <img src={products.find(p => p.id === newSale.product_id)!.photo_url!} className="h-6 w-6 rounded-md object-cover" />
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-gray-100" />
                        )}
                        <span className="truncate">{products.find(p => p.id === newSale.product_id)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Selecciona un producto...</span>
                    )}
                  </div>
                  {isProductDropdownOpen && (
                    <div className="w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-inner max-h-80 overflow-hidden flex flex-col animate-in slide-in-from-top-2">
                      <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                        <Input 
                          placeholder="🔍 Buscar producto..." 
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-9 bg-white border-gray-200 focus-visible:ring-pink-500 text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto max-h-60">
                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                          <div 
                            key={p.id} 
                            className="flex items-center gap-3 p-3 hover:bg-pink-50 cursor-pointer border-b border-gray-50 last:border-0"
                            onClick={() => {
                               setNewSale({...newSale, product_id: p.id});
                               setIsProductDropdownOpen(false);
                               setProductSearch(''); // reset search after select
                            }}
                          >
                            {p.photo_url ? (
                              <img src={p.photo_url} className="h-10 w-10 rounded-lg object-cover shadow-sm" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-100 shadow-sm" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-gray-900">{p.name}</span>
                              <span className="text-xs font-semibold text-pink-600">${Number(p.price).toFixed(2)} <span className="text-gray-400 font-normal">| Stock: {p.stock}</span></span>
                            </div>
                          </div>
                        ))}
                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-gray-500 text-sm">No se encontraron productos.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Cant.</label>
                  <Input type="number" min="1" className="h-11 rounded-xl text-center border-pink-100 font-bold" value={newSale.quantity} onChange={(e) => setNewSale({...newSale, quantity: e.target.value})} placeholder="1" />
                </div>
                <div className="flex-[2]">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Cliente *</label>
                  <Input placeholder="Nombre" className="h-11 rounded-xl border-pink-100 font-medium" value={newSale.client_name} onChange={(e) => setNewSale({...newSale, client_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Tel. (WhatsApp)</label>
                <Input placeholder="503..." className="h-11 rounded-xl border-pink-100 font-medium" value={newSale.client_phone} onChange={(e) => setNewSale({...newSale, client_phone: e.target.value})} />
              </div>
            </div>
          </div>

          {/* PASO 2: LOGÍSTICA */}
          <div className="space-y-4 bg-purple-50/30 p-4 rounded-2xl border border-purple-100/50">
            <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2 mb-3">2. Logística</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Tipo de Entrega *</label>
                <select 
                  className="w-full h-11 px-4 rounded-xl border border-purple-200 bg-white font-bold text-gray-700"
                  value={newSale.delivery_type}
                  onChange={(e) => setNewSale({...newSale, delivery_type: e.target.value as any})}
                >
                  <option value="casillero">📦 Dejar en Casillero</option>
                  <option value="delivery">🛵 Delivery a Domicilio</option>
                  <option value="personal">🤝 Entrega Personal</option>
                  <option value="local">🏪 Venta en Local Directo</option>
                </select>
              </div>

              {newSale.delivery_type !== 'local' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                    {newSale.delivery_type === 'casillero' ? 'Nombre Casillero / Detalles' : newSale.delivery_type === 'delivery' ? 'Dirección Completa *' : 'Lugar y Hora de Encuentro *'}
                  </label>
                  <Input placeholder={newSale.delivery_type === 'casillero' ? 'Ej. Casillero Express' : newSale.delivery_type === 'delivery' ? 'Ej. San Miguel, Col. Centro' : 'Ej. Metrocentro, 3:00 PM'} className="h-11 rounded-xl border-purple-200 font-medium bg-white" value={newSale.delivery_notes} onChange={(e) => setNewSale({...newSale, delivery_notes: e.target.value})} />
                </div>
              )}
            </div>
          </div>

          {/* PASO 3: PAGOS */}
          <div className="space-y-4 bg-green-50/30 p-4 rounded-2xl border border-green-100/50 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest flex items-center gap-2 mb-3">3. Cobro</h4>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Total a Cobrar ($)</label>
                    <Input type="number" className="h-11 font-extrabold text-pink-600 text-center rounded-xl border-pink-200 bg-white" value={newSale.price} onChange={(e) => setNewSale({...newSale, price: e.target.value})} placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Estado del Pago</label>
                  <select 
                    className="w-full h-11 px-4 rounded-xl border border-green-200 bg-white font-bold text-gray-700"
                    value={newSale.payment_status}
                    onChange={(e) => setNewSale({...newSale, payment_status: e.target.value as any})}
                  >
                    <option value="paid">✅ Pagado Total</option>
                    <option value="pending">⏳ Cobro Contra Entrega</option>
                    <option value="partial">💰 Anticipo (Abono Parcial)</option>
                  </select>
                </div>

                {newSale.payment_status === 'partial' && (
                  <div className="animate-in zoom-in duration-200">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Monto Abonado ($)</label>
                    <Input type="number" className="h-11 font-bold text-center rounded-xl border-green-200 bg-white" value={newSale.partial_amount} onChange={(e) => setNewSale({...newSale, partial_amount: e.target.value})} placeholder="0.00" />
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleQuickSave} disabled={savingSale} className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md shadow-pink-200 font-bold transition-all hover:-translate-y-1 text-base">
              {savingSale ? 'Guardando...' : 'Confirmar Venta'}
            </Button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-blue-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-blue-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                 <Edit2 className="h-5 w-5 text-blue-500" /> Editar Venta
              </DialogTitle>
            </DialogHeader>
          </div>
          {editingSale && (
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Cliente</Label>
                <Input value={editingSale.client_name} onChange={(e) => setEditingSale({...editingSale, client_name: e.target.value})} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Teléfono</Label>
                <Input value={editingSale.client_phone} onChange={(e) => setEditingSale({...editingSale, client_phone: e.target.value})} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Tipo Entrega</Label>
                <select 
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white font-medium"
                  value={editingSale.delivery_type}
                  onChange={(e) => setEditingSale({...editingSale, delivery_type: e.target.value})}
                >
                  <option value="casillero">Casillero</option>
                  <option value="delivery">Delivery</option>
                  <option value="personal">Personal</option>
                  <option value="local">Local Directo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Detalles / Casillero</Label>
                <Input value={editingSale.delivery_notes || ''} onChange={(e) => setEditingSale({...editingSale, delivery_notes: e.target.value})} className="rounded-xl h-11" />
              </div>
              <DialogFooter className="pt-4 border-t border-blue-50 mt-4">
                <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">Guardar</Button>
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
          {waSale && (
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
                  <option value="preparando">📦 Preparando Pedido</option>
                  <option value="casillero">🏪 Listo en Casillero</option>
                  <option value="delivery">🛵 Envío por Delivery</option>
                  <option value="personal">🤝 Entrega Personal / Encuentro</option>
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

      {/* FILTROS Y BÚSQUEDA REDISEÑADO */}
      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 mt-8 mb-6">
        <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <PackageSearch className="h-5 w-5 text-pink-500" />
          Buscador y Filtros de Logística
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-400" />
            <Input 
              placeholder="Buscar envío por cliente o producto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-white/90 border-pink-100 shadow-inner rounded-2xl h-12 focus-visible:ring-2 focus-visible:ring-pink-400 text-gray-700 font-medium w-full text-base transition-all"
            />
          </div>
          <div className="relative sm:max-w-[250px] w-full">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
            <Input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-12 bg-white/90 border-purple-100 shadow-inner rounded-2xl h-12 focus-visible:ring-2 focus-visible:ring-purple-400 font-bold text-gray-700 w-full transition-all"
            />
          </div>
        </div>
      </div>

      {/* TABLA DE LOGÍSTICA ESTILO ERP */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Cliente / Producto</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Tipo Entrega</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Status Logístico</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Cobro</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Acciones (Logística y CRM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale: any) => {
                const productName = sale.products?.name || 'Producto'
                const phone = sale.client_phone ? sale.client_phone.replace(/\D/g,'') : ''
                
                // Generadores de links de WhatsApp (Plantillas)
                const txtPreparando = encodeURIComponent(`Hola ${sale.client_name || ''}, estamos preparando tu pedido de ${productName}. Pronto te avisaremos cuando esté en camino! 📦`)
                const txtEnCasillero = encodeURIComponent(`Hola ${sale.client_name || ''}, ¡excelentes noticias! Tu pedido de ${productName} ya está en ${sale.delivery_notes || 'el casillero'} listo para retirar. Recuerda cancelar el total ahí mismo. ✨`)
                const txtPersonal = encodeURIComponent(`Hola ${sale.client_name || ''}, te confirmo nuestra entrega personal de ${productName} en ${sale.delivery_notes}. ¿Nos vemos allá? 🤝`)
                
                return (
                  <tr key={sale.id} className="hover:bg-white/90 transition-all duration-200 group">
                    
                    {/* CLIENTE Y PRODUCTO */}
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-gray-900 text-base">{sale.client_name || 'Sin Nombre'}</div>
                      <div className="text-[11px] font-semibold text-gray-500 flex flex-col gap-0.5 mt-1">
                        <span>{sale.quantity}x {productName} | <span className="text-pink-600 font-bold">${Number(sale.price).toFixed(2)}</span></span>
                        <span>{sale.client_phone || 'Sin WhatsApp'} | {new Date(sale.date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* TIPO DE ENTREGA */}
                    <td className="px-6 py-4 text-center">
                      {sale.delivery_type === 'casillero' ? (
                        <div className="flex flex-col items-center">
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border border-purple-200">📦 Casillero</span>
                          <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" title={sale.delivery_notes}>{sale.delivery_notes || 'Sin detalles'}</span>
                        </div>
                      ) : sale.delivery_type === 'delivery' ? (
                        <div className="flex flex-col items-center">
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border border-amber-200">🛵 Delivery</span>
                          <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" title={sale.delivery_notes}>{sale.delivery_notes}</span>
                        </div>
                      ) : sale.delivery_type === 'personal' ? (
                        <div className="flex flex-col items-center">
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border border-blue-200">🤝 Personal</span>
                          <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" title={sale.delivery_notes}>{sale.delivery_notes}</span>
                        </div>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border border-gray-200">🏪 Local Directo</span>
                      )}
                    </td>

                    {/* ESTADO LOGÍSTICO (BOTONES INTERACTIVOS) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <select 
                          className={`text-xs font-bold rounded-lg px-2 py-1 border shadow-sm outline-none cursor-pointer transition-colors
                            ${sale.delivery_status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : 
                              sale.delivery_status === 'ready' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                          value={sale.delivery_status || 'pending'}
                          onChange={(e) => handleUpdateDeliveryStatus(sale.id, e.target.value)}
                        >
                          <option value="pending">⏳ En Bodega / Preparando</option>
                          <option value="ready">📌 En Casillero / Camino</option>
                          <option value="delivered">✅ Entregado Finalizado</option>
                        </select>
                      </div>
                    </td>

                    {/* ESTADO DE PAGO */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[6rem] px-3 py-1.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider shadow-sm
                        ${sale.payment_status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' : 
                          sale.payment_status === 'pending' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                        {sale.payment_status === 'paid' ? 'Pagado Total' : 
                         sale.payment_status === 'pending' ? (sale.delivery_type === 'casillero' ? 'Cobro en Casillero' : 'Fíado (Deuda)') : 
                         'Abono Parcial'}
                      </span>
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleOpenEdit(sale)} title="Editar Venta">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(sale)} title="Eliminar/Anular Venta">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {sale.client_phone && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#25D366] hover:bg-green-50 rounded-xl border border-green-100 bg-white shadow-sm" onClick={() => handleOpenWaModal(sale)} title="Notificar por WhatsApp">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        {sale.delivery_type === 'personal' && (
                          <a 
                            href={`https://wa.me/50378085138?text=${encodeURIComponent(`🔔 *RECORDATORIO DE ENTREGA* 🔔\n\n👤 *Cliente:* ${sale.client_name || 'Sin nombre'}\n👜 *Producto:* ${sale.quantity}x ${productName}\n💰 *A cobrar:* $${Number(sale.price).toFixed(2)}\n📍 *Lugar/Hora:* ${sale.delivery_notes}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-9 w-9 text-orange-500 hover:bg-orange-50 rounded-xl border border-orange-100 bg-white shadow-sm transition-colors"
                            title="Enviarme recordatorio (Auto-WhatsApp)"
                          >
                            <Bell className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    
                  </tr>
                )
              })}
              {filteredSales.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Truck className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-bold text-gray-500">Sin envíos</p>
                      <p className="text-gray-400 mt-1">El registro logístico está vacío.</p>
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
