import { Suspense } from 'react'
import LoginContent from './LoginContent'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  )
}
