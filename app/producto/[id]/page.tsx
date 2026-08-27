'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Sparkles, MessageCircle } from 'lucide-react'

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const WHATSAPP_NUMBER = "50378085138"

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id as string)
        .single()
      
      if (data) {
        setProduct(data as Product)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50/50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h1>
        <Link href="/" className="text-pink-500 hover:underline font-bold">Volver al catálogo</Link>
      </div>
    )
  }

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
        {/* Capa de Cristal Esmerilado */}
        <div className="absolute inset-0 bg-pink-50/80 backdrop-blur-xl transition-all"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="py-6 flex justify-between items-center">
          <Link href="/" className="bg-white/80 backdrop-blur-md p-3 px-5 rounded-full shadow-sm hover:scale-105 transition-transform flex items-center gap-2 text-pink-600 font-bold border border-pink-100">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/80 p-2 rounded-full shadow-inner border border-pink-100 hidden sm:block">
              <img src="/Logo.jpeg" alt="Logo" className="h-8 w-8 object-contain rounded-full" />
            </div>
            <h1 className="text-2xl font-extrabold text-pink-600 tracking-tight flex items-center gap-2 drop-shadow-sm bg-white/60 px-4 py-2 rounded-2xl backdrop-blur-md border border-pink-50">
              Lovely Bags <Sparkles className="h-5 w-5 text-pink-500" />
            </h1>
          </div>
        </header>

        {/* Producto Detalle */}
        <main className="flex-1 py-10 flex items-center justify-center w-full animate-in fade-in zoom-in-95 duration-700">
          <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/60 overflow-hidden w-full max-w-5xl flex flex-col md:flex-row">
            
            {/* Imagen del Producto */}
            <div className="w-full md:w-1/2 relative min-h-[400px] md:min-h-[600px] bg-white/50">
              {product.photo_url ? (
                <Image 
                  src={product.photo_url} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ShoppingBag className="h-24 w-24 text-pink-300 opacity-50" />
                </div>
              )}
            </div>

            {/* Información del Producto */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white/40">
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 font-bold text-xs uppercase tracking-widest w-fit shadow-inner">
                  <Sparkles className="h-3 w-3" />
                  {product.badge || 'Edición Especial'}
                </div>
                {product.category && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-bold text-xs uppercase tracking-widest w-fit shadow-inner">
                    {product.category}
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              
              <div className="text-5xl font-black text-pink-600 drop-shadow-sm mb-8">
                ${Number(product.price).toFixed(2)}
              </div>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-gray-600 font-medium">
                  <div className={`h-3 w-3 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  {product.stock > 0 ? (
                    <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-xl">Disponible para entrega inmediata</span>
                  ) : (
                    <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-xl">Agotado temporalmente</span>
                  )}
                </div>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {product.description || (
                    <>
                      Descubre la elegancia y versatilidad con este artículo exclusivo. 
                      Diseñado para complementar tu estilo único en cualquier ocasión. 
                      Calidad premium garantizada por Lovely Bags.
                    </>
                  )}
                </p>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const productUrl = `${origin}/producto/${product.id}`;
                    const text = `¡Hola Lovely Bags! 💕✨ Me encantó el producto *${product.name}* y me gustaría comprarlo. ¿Aún está disponible? 🛍️💖\n\n🔗 Ver producto en la tienda: ${productUrl}`;
                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  disabled={product.stock <= 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold text-lg py-5 px-8 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-[0_8px_30px_rgb(236,72,153,0.3)] hover:shadow-[0_8px_40px_rgb(236,72,153,0.5)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <MessageCircle className="group-hover:scale-110 transition-transform h-6 w-6" />
                  {product.stock > 0 ? 'Comprar por WhatsApp' : 'Agotado'}
                </button>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}
