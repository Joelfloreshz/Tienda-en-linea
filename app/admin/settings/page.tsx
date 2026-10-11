'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Save, AlertCircle, MessageCircle, ExternalLink, Copy, Check, Phone, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [sqlNotice, setSqlNotice] = useState<string | null>(null)
  const [copiedSql, setCopiedSql] = useState(false)
  
  const [settings, setSettings] = useState({
    title: 'Descubre tu estilo con',
    brand_name: 'Lovely Bags',
    subtitle: 'Explora nuestra colección exclusiva de bolsos. Diseños únicos, calidad premium y el toque perfecto para cada ocasión.',
    title_color: 'text-gray-900',
    brand_color_from: 'from-pink-500',
    brand_color_to: 'to-purple-500',
    typography: 'font-sans',
    whatsapp_number: '50378085138'
  })

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'hero_banner')
        .single()
      
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          whatsapp_number: data.whatsapp_number || prev.whatsapp_number || '50378085138'
        }))
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error al cargar la configuración', error)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    setSqlNotice(null)
    
    // Limpiar el número de teléfono para asegurar solo dígitos
    const cleanNumber = settings.whatsapp_number ? settings.whatsapp_number.replace(/\D/g, '') : '50378085138'
    const payload = {
      ...settings,
      whatsapp_number: cleanNumber
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 'hero_banner', ...payload })
      
    if (error) {
      console.error(error)
      // Si la columna whatsapp_number no existe aún en Supabase (código 42703)
      if (error.code === '42703' || error.message?.includes('whatsapp_number')) {
        const { whatsapp_number, ...fallbackSettings } = payload
        const { error: fallbackErr } = await supabase
          .from('site_settings')
          .upsert({ id: 'hero_banner', ...fallbackSettings })

        if (!fallbackErr) {
          setMessage({
            text: '¡Diseño guardado! Para poder guardar el número de WhatsApp en la base de datos de Supabase, ejecuta el comando SQL que aparece abajo.',
            type: 'warning'
          })
          setSqlNotice("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '50378085138';")
          toast.warning('Agrega la columna en Supabase para guardar el número')
        } else {
          setMessage({ text: 'Error al guardar la configuración: ' + fallbackErr.message, type: 'error' })
          toast.error('Error al guardar: ' + fallbackErr.message)
        }
      } else {
        setMessage({ text: 'Error al guardar la configuración: ' + (error.message || 'Error desconocido'), type: 'error' })
        toast.error('Error al guardar: ' + (error.message || 'Error desconocido'))
      }
    } else {
      setSettings(prev => ({ ...prev, whatsapp_number: cleanNumber }))
      setMessage({ text: '¡Configuración y número de WhatsApp guardados exitosamente!', type: 'success' })
      toast.success('¡Guardado exitosamente!')
      setSqlNotice(null)
    }
    setSaving(false)
  }

  const handleCopySql = () => {
    if (!sqlNotice) return
    navigator.clipboard.writeText(sqlNotice)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2500)
  }

  const cleanCurrentPhone = settings.whatsapp_number ? settings.whatsapp_number.replace(/\D/g, '') : '50378085138'

  const handlePreview = () => {
    return (
      <div className="space-y-6">
        {/* Banner Preview */}
        <div className={`p-8 border rounded-3xl bg-white shadow-sm ${settings.typography}`}>
          <div className="relative py-12 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-200/40 via-transparent to-transparent"></div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 drop-shadow-md ${settings.title_color}`}>
              {settings.title} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${settings.brand_color_from} ${settings.brand_color_to}`}>{settings.brand_name}</span>
            </h2>
            <p className="mt-2 text-base text-gray-800 font-medium max-w-2xl mx-auto drop-shadow-sm">
              {settings.subtitle}
            </p>
          </div>
        </div>

        {/* WhatsApp Integration Preview */}
        <div className="p-6 border rounded-3xl bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <MessageCircle className="h-4 w-4 text-green-500" />
            Integración de WhatsApp activa
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Número destino configurado:</span>
              <span className="font-mono font-bold text-green-600 text-sm">+{cleanCurrentPhone}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span><b>Botón flotante en tienda:</b> Redirige a +{cleanCurrentPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span><b>Botón &quot;Comprar por WhatsApp&quot; en productos:</b> Redirige a +{cleanCurrentPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span><b>Recordatorio de entrega en ventas:</b> Auto-notificación a +{cleanCurrentPhone}</span>
              </div>
            </div>
          </div>
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
      {/* Header con botón Guardar Cambios visible siempre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
            <Settings className="h-7 w-7 text-pink-500" />
            Configuración del Sitio
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Personaliza el número de WhatsApp de contacto y la información visual de tu tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 cursor-pointer shrink-0"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'Guardando...' : 'Guardar Todo'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm ${
          message.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : message.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      {sqlNotice && (
        <div className="bg-amber-50/90 backdrop-blur border border-amber-200 p-5 rounded-3xl text-amber-900 space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">Activar columna en Supabase (Solo 1 vez)</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Para que puedas cambiar el número en cualquier momento directamente desde aquí, tu base de datos necesita la columna <code>whatsapp_number</code>. Copia este comando y ejecútalo en el <b>SQL Editor</b> de tu panel de Supabase:
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-900 text-pink-300 p-3.5 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner">
            <code>{sqlNotice}</code>
            <button
              type="button"
              onClick={handleCopySql}
              className="ml-3 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-sans font-bold px-3 py-1.5 rounded-xl shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              {copiedSql ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copiedSql ? '¡Copiado!' : 'Copiar SQL'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Card WhatsApp con su propio botón dedicado para Guardar */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-green-500/10 rounded-2xl text-green-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Número de WhatsApp de la Tienda</h3>
                <p className="text-xs text-gray-500">Aquí llegarán todos los pedidos y consultas de los clientes.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Número Telefónico (con código de país)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-base">
                  +
                </div>
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 font-mono text-base font-semibold text-gray-800 transition-all bg-white"
                  placeholder="50378085138"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 <b>Ejemplo:</b> Para El Salvador ingresa <span className="font-mono font-bold text-gray-700">50378085138</span> (código de país seguido de tu número). Sin espacios ni signos +.
              </p>
            </div>

            <div className="flex items-center justify-between bg-green-50/80 border border-green-200/70 p-3.5 rounded-2xl text-xs text-green-800">
              <div className="truncate mr-2">
                <span className="text-green-600 font-medium">Enlace: </span>
                <span className="font-mono font-bold">wa.me/{cleanCurrentPhone}</span>
              </div>
              <span className="text-green-700 font-medium text-[11px]">Listo para vincular</span>
            </div>

            {/* BOTÓN DEDICADO PARA GUARDAR EL NÚMERO */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'Guardando...' : 'Guardar Número de WhatsApp'}
              </button>

              <a
                href={`https://wa.me/${cleanCurrentPhone}?text=${encodeURIComponent('¡Hola Lovely Bags! 💕 Prueba de enlace configurado con éxito.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold px-4 py-3.5 rounded-2xl transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                Probar chat <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Card Hero */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-pink-500/10 rounded-2xl text-pink-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Sección Principal (Hero)</h3>
                <p className="text-xs text-gray-500">Personaliza los títulos y el estilo visual de la cabecera.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto Principal</label>
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all text-sm font-medium bg-white"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Marca</label>
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all text-sm font-medium bg-white"
                value={settings.brand_name}
                onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subtítulo / Descripción</label>
              <textarea
                className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 transition-all text-sm font-medium bg-white"
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
                  className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 text-sm font-medium bg-white"
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
                  className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 text-sm font-medium bg-white"
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
                  className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 text-sm font-medium bg-white"
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
                  className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 text-sm font-medium bg-white"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'Guardando...' : 'Guardar Todo'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Vista Previa</h3>
            <p className="text-sm text-gray-500 mb-4">Así se refleja la configuración y el enlace de contacto en tu tienda.</p>
            {handlePreview()}
          </div>
        </div>
      </form>
    </div>
  )
}
