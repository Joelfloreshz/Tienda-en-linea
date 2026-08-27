'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Image from 'next/image'
import { Lock, Mail, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.session) {
        toast.success('¡Bienvenido de vuelta!')
        router.push('/admin/dashboard')
      }
    } catch (error: any) {
      toast.error('Credenciales incorrectas o error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden">
      {/* Fondo Fijo con Efecto Cristal */}
      <div className="fixed inset-0 z-0">
        <Image 
          src="/Fondo.jpeg" 
          alt="Fondo" 
          fill 
          className="object-cover object-center scale-105"
          priority
        />
        {/* Capa de Cristal Esmerilado (Glassmorphism) Fuerte para el Login */}
        <div className="absolute inset-0 bg-pink-100/40 backdrop-blur-md"></div>
      </div>

      {/* Contenedor del Login */}
      <div className="relative z-10 w-full max-w-md p-6 animate-in zoom-in-95 duration-700">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] border border-white/60 p-10 flex flex-col items-center">
          
          {/* Logo y Encabezado */}
          <div className="bg-white p-3 rounded-3xl shadow-sm mb-6 border border-pink-50 transform hover:rotate-12 transition-transform duration-500">
            <Image src="/Logo.jpeg" alt="Logo" width={70} height={70} className="rounded-2xl object-contain" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-2">
            Lovely Bags <Sparkles className="h-5 w-5 text-pink-500 animate-pulse" />
          </h1>
          <p className="text-gray-500 font-medium text-center mb-8">
            Sistema de Gestión Empresarial
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-bold ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lovelybags.com"
                  required
                  className="pl-11 h-14 rounded-2xl bg-white/50 border-white/80 shadow-inner focus-visible:ring-pink-500 focus-visible:ring-2 font-medium text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-bold ml-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-11 h-14 rounded-2xl bg-white/50 border-white/80 shadow-inner focus-visible:ring-pink-500 focus-visible:ring-2 font-medium text-gray-900 transition-all"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 text-lg font-extrabold rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Accediendo...
                </div>
              ) : (
                'Iniciar Sesión Segura'
              )}
            </Button>
          </form>

          <p className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Acceso Autorizado Únicamente
          </p>
        </div>
      </div>
    </div>
  )
}
