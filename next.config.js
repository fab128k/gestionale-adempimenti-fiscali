/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  // Se devi deployare su GitHub Pages, decommenta:
  // output: 'export',
  // basePath: '/gestionale-adempimenti-fiscali',
}

module.exports = nextConfig
