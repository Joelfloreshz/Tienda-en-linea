'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Save, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [settings, setSettings] = useState({
    title: 'Descubre tu estilo con',
    brand_name: 'Lovely Bags',
    subtitle: 'Explora nuestra colección exclusiva de bolsos. Diseños únicos, calidad premium y el toque perfecto para cada ocasión.',
    title_color: 'text-gray-900',
    brand_color_from: 'from-pink-500',
    brand_color_to: 'to-purple-500',
    typography: 'font-sans'
  })

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'hero_banner')
        .single()
      
      if (data) {
        setSettings(data)
      } else if (error && error.code !== 'PGRST116') {
        // Ignorar error si no hay datos aún, pero mostrar si hay otro error.
        console.error('Error al cargar la configuración', error)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 'hero_banner', ...settings })
      
    if (error) {
      console.error(error)
      setMessage({ text: 'Error al guardar la configuración. ¿Creaste la tabla en Supabase?', type: 'error' })
    } else {
      setMessage({ text: 'Configuración guardada correctamente.', type: 'success' })
    }
    setSaving(false)
  }

  const handlePreview = () => {
    return (
      <div className={`mt-8 p-8 border rounded-3xl bg-white shadow-sm ${settings.typography}`}>
        <div className="relative py-12 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-200/40 via-transparent to-transparent"></div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 drop-shadow-md ${settings.title_color}`}>
            {settings.title} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${settings.brand_color_from} ${settings.brand_color_to}`}>{settings.brand_name}</span>
          </h2>
          <p className="mt-4 text-lg text-gray-800 font-medium max-w-2xl mx-auto drop-shadow-sm">
            {settings.subtitle}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
          <Settings className="h-7 w-7 text-pink-500" />
          Configuración del Sitio
        </h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Sección Principal (Hero)</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto Principal</label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Marca</label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all"
                value={settings.brand_name}
                onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subtítulo / Descripción</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all"
                rows={3}
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color Principal (Texto)</label>
                <select
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500"
                  value={settings.title_color}
                  onChange={(e) => setSettings({ ...settings, title_color: e.target.value })}
                >
                  <option value="text-gray-900">Gris Oscuro</option>
                  <option value="text-pink-600">Rosa Fuerte</option>
                  <option value="text-purple-600">Morado</option>
                  <option value="text-blue-600">Azul</option>
                  <option value="text-green-600">Verde</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipografía</label>
                <select
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500"
                  value={settings.typography}
                  onChange={(e) => setSettings({ ...settings, typography: e.target.value })}
                >
                  <option value="font-sans">Sans (Moderna)</option>
                  <option value="font-serif">Serif (Clásica)</option>
                  <option value="font-mono">Mono (Técnica)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color Marca (Desde)</label>
                <select
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500"
                  value={settings.brand_color_from}
                  onChange={(e) => setSettings({ ...settings, brand_color_from: e.target.value })}
                >
                  <option value="from-pink-500">Rosa</option>
                  <option value="from-purple-500">Morado</option>
                  <option value="from-blue-500">Azul</option>
                  <option value="from-red-500">Rojo</option>
                  <option value="from-orange-500">Naranja</option>
                  <option value="from-yellow-400">Amarillo</option>
                  <option value="from-emerald-400">Verde Esmeralda</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color Marca (Hasta)</label>
                <select
                  className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500"
                  value={settings.brand_color_to}
                  onChange={(e) => setSettings({ ...settings, brand_color_to: e.target.value })}
                >
                  <option value="to-purple-500">Morado</option>
                  <option value="to-pink-500">Rosa</option>
                  <option value="to-blue-500">Azul</option>
                  <option value="to-red-500">Rojo</option>
                  <option value="to-orange-500">Naranja</option>
                  <option value="to-yellow-400">Amarillo</option>
                  <option value="to-emerald-400">Verde Esmeralda</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Vista Previa</h3>
            <p className="text-sm text-gray-500 mb-4">Así se verá el mensaje en la página principal (tienda).</p>
            {handlePreview()}
          </div>
        </div>
      </div>
    </div>
  )
}
