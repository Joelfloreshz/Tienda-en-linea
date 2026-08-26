import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite cualquier dominio de Supabase u otro lugar por ahora, o ajusta a tu dominio específico de Supabase
      },
    ],
  },
};

export default nextConfig;
