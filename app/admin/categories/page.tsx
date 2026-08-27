'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Search, Tags, FolderX } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      toast.error('Error cargando categorías')
    } else if (data) {
      setCategories(data as Category[])
    }
    setLoading(false)
  }

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
    } else {
      setEditingCategory(null)
      setName('')
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre no puede estar vacío')
    
    setSaving(true)
    try {
      if (editingCategory) {
        // Edit
        const { error } = await supabase
          .from('categories')
          .update({ name: name.trim() })
          .eq('id', editingCategory.id)
        
        if (error) {
           if (error.code === '23505') throw new Error('Ya existe una categoría con este nombre')
           throw error
        }
        
        // Also update products that had the old category name
        // (Ideally we would link by ID, but since products store category as text, we update it)
        await supabase
          .from('products')
          .update({ category: name.trim() })
          .eq('category', editingCategory.name)

        toast.success('Categoría actualizada')
      } else {
        // Create
        const { error } = await supabase
          .from('categories')
          .insert([{ name: name.trim() }])
          
        if (error) {
           if (error.code === '23505') throw new Error('Ya existe una categoría con este nombre')
           throw error
        }
        toast.success('Categoría creada')
      }

      setIsDialogOpen(false)
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"? Los productos que la tengan se quedarán sin categoría asignada.`)) return
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', category.id)
      if (error) throw error
      
      // Remove category from products
      await supabase
          .from('products')
          .update({ category: null })
          .eq('category', category.name)

      toast.success('Categoría eliminada')
      fetchCategories()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

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
            <Tags className="h-8 w-8 text-pink-500" /> Gestión de Categorías
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Controla las categorías oficiales para evitar errores tipográficos.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white rounded-2xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all hover:-translate-y-1 h-12 px-6" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-5 w-5" /> Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] rounded-3xl border-pink-100 p-0 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-pink-50 to-white p-6 border-b border-pink-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold">Nombre de la Categoría</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="rounded-xl border-pink-100 focus-visible:ring-pink-500 h-11 bg-white" placeholder="Ej. Camisas" />
              </div>
              <DialogFooter className="pt-4 border-t border-pink-50 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl hover:bg-gray-100 text-gray-500">Cancelar</Button>
                <Button type="submit" disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-md min-w-[120px]">
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Buscar categoría..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 bg-white/70 backdrop-blur-md border-white/50 shadow-sm rounded-2xl h-12 focus-visible:ring-pink-500 text-base"
        />
      </div>

      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Nombre</th>
                <th className="px-6 py-4 font-bold tracking-wider">Fecha de Creación</th>
                <th className="px-6 py-4 text-center font-bold tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-white/90 transition-all duration-200 group">
                  <td className="px-6 py-4 font-bold text-gray-900 text-base">
                    <span className="bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-100">{category.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleOpenDialog(category)} title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(category)} title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FolderX className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-bold text-gray-500">Sin categorías</p>
                      <p className="text-gray-400 mt-1">Crea una categoría para empezar a organizar tus productos.</p>
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
