import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Neuro Progeny Mastermind',
  description: 'Transform your nervous system through VR biofeedback training',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  )
}
