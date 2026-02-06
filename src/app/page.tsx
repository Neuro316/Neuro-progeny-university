import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#3d8b8b] flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-display text-xl font-bold text-[#1e3a5f]">Neuro Progeny</span>
              <span className="hidden sm:inline text-sm text-gray-500 ml-2">Immersive Mastermind</span>
            </div>
          </div>
          
          <Link href="/login" className="btn bg-[#3d8b8b] hover:bg-[#2d7a7a] text-white px-6">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#3d8b8b]/10 text-[#3d8b8b] px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-[#3d8b8b] rounded-full animate-pulse"></span>
            5-Week VR Biofeedback Program
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#1e3a5f] mb-6 leading-tight">
            Train Your Nervous System
            <span className="block text-[#3d8b8b] mt-2">Build Real Capacity</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            The Immersive Mastermind uses VR biofeedback and HRV monitoring to build 
            <strong className="text-[#1e3a5f]"> state fluidity</strong>—not calm-chasing. 
            Transform your relationship with stress in just 5 weeks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="btn bg-[#3d8b8b] hover:bg-[#2d7a7a] text-white px-8 py-4 text-lg shadow-lg shadow-[#3d8b8b]/25"
            >
              Access Your Program
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Backed by science, built on experience</p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="font-display text-2xl font-bold text-[#1e3a5f]">8,000+</div>
                <div className="text-sm text-gray-500">Brain Scans Reviewed</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-[#1e3a5f]">18</div>
                <div className="text-sm text-gray-500">Years Expertise</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-[#1e3a5f]">34+</div>
                <div className="text-sm text-gray-500">Peer-Reviewed Citations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Neuro Progeny. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#1e3a5f] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1e3a5f] transition-colors">Terms</Link>
            <a href="mailto:support@neuroprogeny.com" className="hover:text-[#1e3a5f] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
