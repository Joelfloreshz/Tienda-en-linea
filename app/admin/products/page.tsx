'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Search, TableProperties, PackageX } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form states (Initialized as empty string to fix the "025" bug)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState<number | string>('')
  const [cost, setCost] = useState<number | string>('')
  const [price, setPrice] = useState<number | string>('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Refill state
  const [isRefillDialogOpen, setIsRefillDialogOpen] = useState(false)
  const [refillProduct, setRefillProduct] = useState<Product | null>(null)
  const [refillQuantity, setRefillQuantity] = useState<number | string>('')
  const [refilling, setRefilling] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setStock('')
    setCost('')
    setPrice('')
    setPhotoFile(null)
    setEditingProduct(null)
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setName(product.name)
      setDescription(product.description || '')
      setStock(product.stock)
      setCost(product.cost)
      setPrice(product.price)
      setPhotoFile(null)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const uploadPhoto = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    // Parse values strictly
    const parsedStock = Number(stock) || 0
    const parsedCost = Number(cost) || 0
    const parsedPrice = Number(price) || 0

    try {
      let photo_url = editingProduct?.photo_url || null

      if (photoFile) {
        photo_url = await uploadPhoto(photoFile)
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({ name, description, stock: parsedStock, cost: parsedCost, price: parsedPrice, photo_url })
          .eq('id', editingProduct.id)
        if (error) throw error
        toast.success('Producto actualizado')
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ name, description, stock: parsedStock, cost: parsedCost, price: parsedPrice, photo_url }])
        if (error) throw error

        if (parsedStock > 0 && parsedCost > 0) {
          await supabase.from('expenses').insert([{
            description: `Compra inicial: ${parsedStock}x ${name}`,
            amount: parsedStock * parsedCost,
            category: 'producto'
          }])
        }

        toast.success('Producto creado y gasto de compra registrado')
      }

      setIsDialogOpen(false)
      fetchProducts()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleOpenRefill = (product: Product) => {
    setRefillProduct(product)
    setRefillQuantity('')
    setIsRefillDialogOpen(true)
  }

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refillProduct) return
    const qty = Number(refillQuantity)
    if (!qty || qty <= 0) return toast.error('Cantidad inválida')

    setRefilling(true)
    try {
      const newStock = refillProduct.stock + qty
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', refillProduct.id)
      
      if (stockError) throw stockError

      const expenseAmount = qty * refillProduct.cost
      if (expenseAmount > 0) {
        await supabase.from('expenses').insert([{
          description: `Surtido de stock: ${qty}x ${refillProduct.name}`,
          amount: expenseAmount,
          category: 'producto'
        }])
      }

      toast.success('¡Stock surtido y gasto registrado! 📦')
      setIsRefillDialogOpen(false)
      fetchProducts()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setRefilling(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar producto de forma permanente?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error('Error: ' + error.message)
    else {
      toast.success('Producto eliminado')
      fetchProducts()
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/50">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 drop-shadow-sm">
            <TableProperties className="h-8 w-8 text-pink-500" /> Inventario Maestro
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Control total de stock, costos y precios.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white rounded-2xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all hover:-translate-y-1 h-12 px-6" onClick={() => handleOpenDialog()} />}>
              <Plus className="mr-2 h-5 w-5" /> Registrar Nuevo
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-pink-100 p-0 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-pink-50 to-white p-6 border-b border-pink-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">{editingProduct ? 'Editar Producto' : 'Registrar Producto'}</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold">Nombre del Producto</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="rounded-xl border-pink-100 focus-visible:ring-pink-500 h-11 bg-white" placeholder="Ej. Bolso Elegance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-semibold">Descripción (Opcional)</Label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border-pink-100 focus-visible:ring-pink-500 focus:ring-2 focus:ring-pink-500 border bg-white p-3 text-sm outline-none resize-none h-20" placeholder="Ej. Material sintético, 3 compartimentos..."></textarea>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-gray-700 font-semibold">Stock</Label>
                  <Input id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required className="rounded-xl border-pink-100 focus-visible:ring-pink-500 h-11 bg-white text-center font-bold text-gray-900" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-gray-700 font-semibold">Costo ($)</Label>
                  <Input id="cost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} required className="rounded-xl border-pink-100 focus-visible:ring-pink-500 h-11 bg-white text-center font-bold text-gray-900" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-700 font-semibold">Precio ($)</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="rounded-xl border-pink-100 focus-visible:ring-pink-500 h-11 bg-white text-center font-bold text-pink-600" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="photo" className="text-gray-700 font-semibold">Subir Foto (Opcional)</Label>
                <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="rounded-xl border-pink-100 file:bg-pink-50 file:text-pink-600 file:border-0 file:rounded-xl file:px-4 file:py-1 file:mr-4 file:font-semibold hover:file:bg-pink-100 cursor-pointer h-11" />
              </div>
              <DialogFooter className="pt-4 border-t border-pink-50 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl hover:bg-gray-100 text-gray-500">Cancelar</Button>
                <Button type="submit" disabled={uploading} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-md min-w-[120px]">
                  {uploading ? 'Guardando...' : 'Guardar Producto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* REFILL DIALOG */}
        <Dialog open={isRefillDialogOpen} onOpenChange={setIsRefillDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-3xl border-purple-100 p-0 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-50 to-white p-6 border-b border-purple-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                   Surtir Stock
                </DialogTitle>
              </DialogHeader>
            </div>
            {refillProduct && (
              <form onSubmit={handleRefillSubmit} className="p-6 space-y-5">
                <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-800">
                  Agregando unidades a: <strong>{refillProduct.name}</strong><br/>
                  Esto registrará automáticamente un gasto por <strong>${refillProduct.cost}</strong> cada uno.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refillQty" className="text-gray-700 font-semibold">Cantidad a Surtir</Label>
                  <Input id="refillQty" type="number" min="1" value={refillQuantity} onChange={(e) => setRefillQuantity(e.target.value)} required autoFocus className="rounded-xl border-purple-100 focus-visible:ring-purple-500 h-14 bg-white text-center text-xl font-bold text-gray-900" placeholder="Ej. 10" />
                </div>
                <DialogFooter className="pt-4 border-t border-purple-50 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsRefillDialogOpen(false)} className="rounded-xl hover:bg-gray-100 text-gray-500">Cancelar</Button>
                  <Button type="submit" disabled={refilling} className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl shadow-md min-w-[120px]">
                    {refilling ? 'Procesando...' : 'Surtir Stock'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Buscar producto por nombre..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 text-base"
        />
      </div>

      {/* TABLA PREMIUM DE ALTA DENSIDAD */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Img</th>
                <th className="px-6 py-4 font-bold tracking-wider">Producto</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Stock</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Costo</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Precio Venta</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Margen Ganancia</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const ganancia = product.price - product.cost
                const margin = product.cost > 0 ? (ganancia / product.cost) * 100 : 100

                return (
                  <tr key={product.id} className="hover:bg-white/90 transition-all duration-200 group">
                    <td className="px-6 py-3">
                       {product.photo_url ? (
                         <img src={product.photo_url} alt={product.name} className="h-10 w-10 object-cover rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform" />
                       ) : (
                         <div className="h-10 w-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-300">N/A</div>
                       )}
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900 text-base truncate max-w-[250px]" title={product.name}>
                      {product.name}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-extrabold text-xs shadow-sm
                        ${product.stock > 10 ? 'bg-green-100 text-green-700 border border-green-200' : 
                          product.stock > 0 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                          'bg-red-100 text-red-700 border border-red-200 animate-pulse'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-500">
                      ${Number(product.cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-extrabold text-pink-600 text-base">
                      ${Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-green-600">+${ganancia.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded-md mt-0.5">{margin.toFixed(0)}% Mgn</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-xl" onClick={() => handleOpenRefill(product)} title="Surtir Stock">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleOpenDialog(product)} title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(product.id)} title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <PackageX className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-bold text-gray-500">Sin productos</p>
                      <p className="text-gray-400 mt-1">El inventario está vacío o no coincide con tu búsqueda.</p>
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
