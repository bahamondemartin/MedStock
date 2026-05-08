import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from './sw-register'

export const metadata: Metadata = {
  title: 'MedStock — Mi botiquín',
  description: 'Gestiona el inventario de medicamentos de tu hogar',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MedStock',
  },
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
