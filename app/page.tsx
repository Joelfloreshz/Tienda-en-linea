'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Sparkles, MessageCircle } from 'lucide-react'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const WHATSAPP_NUMBER = "50378085138"

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('created_at', { ascending: false })
      
      if (data) setProducts(data as Product[])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      {/* Fondo Fijo con Efecto Cristal */}
      <div className="fixed inset-0 z-0">
        <Image 
          src="/Fondo.jpeg" 
          alt="Fondo" 
          fill 
          className="object-cover object-center"
          priority
        />
        {/* Capa de Cristal Esmerilado (Glassmorphism) en rosa pastel */}
        <div className="absolute inset-0 bg-pink-50/70 backdrop-blur-xl transition-all"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header Premium */}
        <header className="bg-white/40 backdrop-blur-3xl border-b border-pink-200/50 sticky top-0 z-50 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/80 p-2 rounded-full shadow-inner border border-pink-100">
                <img src="/Logo.jpeg" alt="Logo" className="h-10 w-10 object-contain rounded-full" />
              </div>
              <h1 className="text-2xl font-extrabold text-pink-600 tracking-tight flex items-center gap-2 drop-shadow-sm">
                Lovely Bags <Sparkles className="h-5 w-5 text-pink-500 animate-pulse" />
              </h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-200/40 via-transparent to-transparent"></div>
          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 drop-shadow-md">
            Descubre tu estilo con <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Lovely Bags</span>
          </h2>
          <p className="mt-4 text-xl text-gray-800 font-medium max-w-2xl mx-auto drop-shadow-sm">
            Explora nuestra colección exclusiva de bolsos. Diseños únicos, calidad premium y el toque perfecto para cada ocasión.
          </p>
        </div>

        {/* Catálogo Grid */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="animate-pulse bg-white/40 backdrop-blur-md rounded-3xl h-[400px] border border-white/50 shadow-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="group flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg border border-white/60 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <Link href={`/producto/${product.id}`} className="aspect-[4/5] relative bg-pink-100/50 overflow-hidden block">
                    {product.photo_url ? (
                      <Image 
                        src={product.photo_url} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingBag className="h-16 w-16 text-pink-300 opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  
                  <div className="p-6 flex flex-col flex-grow relative z-10 bg-white/80 backdrop-blur-md">
                    <Link href={`/producto/${product.id}`} className="block">
                      <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </h4>
                    </Link>
                    <div className="flex flex-col mb-4">
                      <span className="text-sm text-gray-600 font-semibold uppercase tracking-wider">Precio</span>
                      <span className="text-3xl font-extrabold text-pink-600 drop-shadow-sm">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-pink-100">
                      <Link 
                        href={`/producto/${product.id}`}
                        className="text-pink-500 font-bold flex items-center gap-2 group/btn hover:text-pink-600 transition-colors w-full justify-center py-2"
                      >
                        Ver Detalles
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white/40 backdrop-blur-3xl border-t border-white/50 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-white p-2 rounded-full shadow-sm">
                 <img src="/Logo.jpeg" alt="Logo" className="h-8 w-8 object-contain rounded-full opacity-70 grayscale hover:grayscale-0 transition-all" />
              </div>
              <span className="text-2xl font-bold text-gray-500">Lovely Bags</span>
            </div>
            <p className="text-gray-500 font-medium">
              © {new Date().getFullYear()} Lovely Bags. Todos los derechos reservados.
            </p>
            <p className="text-gray-400 text-sm mt-6">
              <a href="/login" className="hover:text-pink-500 transition-colors opacity-30 font-semibold">Acceso Privado</a>
            </p>
          </div>
        </footer>

        {/* Botón Flotante Global de WhatsApp */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola Lovely Bags! 💕 Tengo una consulta, ¿me pueden ayudar? ✨')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(34,197,94,0.4)] hover:bg-green-600 hover:scale-110 transition-all duration-300 group flex items-center justify-center"
          title="Atención al Cliente"
        >
          <MessageCircle className="h-8 w-8" />
          {/* Tooltip tooltip al hover */}
          <span className="absolute right-full mr-4 bg-gray-900 text-white text-sm font-bold py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ¿Necesitas ayuda? Escríbenos
          </span>
        </a>

      </div>
    </div>
  )
}
