'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Package,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Menu,
  CreditCard,
  Home,
  Wallet,
  Tags
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import AlertsMenu from '@/components/AlertsMenu'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/sales', icon: ShoppingCart, label: 'Logística de Ventas' },
    { href: '/admin/products', icon: Package, label: 'Inventario' },
    { href: '/admin/categories', icon: Tags, label: 'Categorías' },
    { href: '/admin/debts', icon: CreditCard, label: 'Fiados (Cuentas)' },
    { href: '/admin/expenses', icon: Wallet, label: 'Control de Gastos' },
  ]

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FDF8F9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full relative font-sans">
      {/* Fondo Fijo con Efecto Cristal */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/Fondo.jpeg" 
          alt="Fondo" 
          className="object-cover object-center w-full h-full"
        />
        {/* Capa de Cristal (Glassmorphism) para el panel de admin (un poco más transparente) */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-lg transition-all"></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-pink-100 bg-white/60 backdrop-blur-xl md:flex shadow-[4px_0_24px_rgba(24ce,143,191,0.05)] z-20 sticky top-0 h-screen">
        <div className="flex h-20 items-center border-b border-pink-100 px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3 font-extrabold text-2xl text-pink-500 transition-transform hover:scale-105">
            <div className="bg-pink-100 p-2 rounded-2xl shadow-inner">
              <img src="/Logo.jpeg" alt="Logo" className="h-8 w-8 object-contain rounded-full" />
            </div>
            <span>Lovely Bags</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-6">
          <nav className="grid items-start px-4 text-sm font-medium gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-lg shadow-pink-200/50 scale-[1.02]'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50 hover:scale-[1.02]'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-semibold text-base">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-pink-100 bg-white/50">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 rounded-2xl py-6 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" 
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-semibold text-base">Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar & Main Content */}
      <div className="flex flex-col flex-1 relative z-10 min-w-0">
        <header className="flex h-20 items-center gap-4 border-b border-pink-100 bg-white/60 backdrop-blur-md px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 md:hidden border-pink-200 text-pink-500 hover:bg-pink-50 rounded-xl" />}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-white border-pink-100 w-72 p-0">
              <div className="flex h-20 items-center border-b border-pink-100 px-6 bg-pink-50/50">
                <Link href="/admin/dashboard" className="flex items-center gap-3 font-extrabold text-2xl text-pink-500">
                  <img src="/Logo.jpeg" alt="Logo" className="h-8 w-8 object-contain rounded-full shadow-sm" />
                  <span>Lovely Bags</span>
                </Link>
              </div>
              <nav className="grid gap-2 px-4 py-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-md'
                          : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-auto p-4 border-t border-pink-100">
                 <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-2xl py-6 text-gray-500 hover:text-red-600 hover:bg-red-50" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Cerrar Sesión</span>
                  </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1"></div>
          {/* Alertas */}
          <AlertsMenu />
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
