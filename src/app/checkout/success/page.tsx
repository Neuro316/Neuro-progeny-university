'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-6">
          Thank you for enrolling. You&apos;ll receive a confirmation email shortly with your next steps.
        </p>
        <div className="space-y-3">
          <Link href="/login"
            className="w-full py-3 bg-[#3B9C8F] text-white font-semibold rounded-xl hover:bg-[#2d7a7a] transition-colors flex items-center justify-center gap-2">
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400">
            If you don&apos;t have an account yet, you&apos;ll be able to create one using the same email address.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  )
}
