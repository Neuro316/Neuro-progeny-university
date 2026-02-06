'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore, useEffectiveRole } from '@/lib/store'
import { 
  Home, BookOpen, MessageSquare, PenTool, User, 
  Users, Settings, BarChart3, Shield, LogOut,
  Bell, Search, Menu, CreditCard, Activity
} from 'lucide-react'

const participantNav = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Curriculum', href: '/dashboard/curriculum', icon: BookOpen },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Journal', href: '/dashboard/journal', icon: PenTool },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

const facilitatorNav = [
  { name: 'My Cohorts', href: '/dashboard/cohorts', icon: Users },
  { name: 'Participants', href: '/dashboard/participants', icon: User },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
]

const adminNav = [
  { name: 'Admin Dashboard', href: '/dashboard/admin', icon: Shield },
  { name: 'Cohorts', href: '/dashboard/admin/cohorts', icon: Users },
  { name: 'Users', href: '/dashboard/admin/users', icon: User },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
]

const superadminNav = [
  { name: 'Platform Overview', href: '/dashboard/platform', icon: BarChart3 },
  { name: 'Courses', href: '/dashboard/platform/courses', icon: BookOpen },
  { name: 'Cohorts', href: '/dashboard/platform/cohorts', icon: Users },
  { name: 'Paywalls', href: '/dashboard/platform/paywalls', icon: CreditCard },
  { name: 'Users', href: '/dashboard/platform/users', icon: User },
  { name: 'Equipment', href: '/dashboard/platform/equipment', icon: Settings },
  { name: 'Analytics', href: '/dashboard/progress', icon: Activity },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, loading, session } = useAuth()
  const { viewAsRole, setViewAsRole, sidebarCollapsed, toggleSidebar } = useAppStore()
  const effectiveRole = useEffectiveRole()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login')
    }
  }, [loading, session, router])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Show loading while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-np-blue-hover"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // No session = redirect happening
  if (!session) return null

  // Use a fallback user if profile not loaded yet
  const displayUser = user || {
    id: session.user?.id || '',
    email: session.user?.email || '',
    full_name: session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || 'User',
    role: 'participant' as const,
    avatar_url: null,
    organization_id: null
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-border-light flex flex-col transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-border-light flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-np-blue to-np-teal flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <span className="font-display text-lg font-semibold text-np-blue">Neuro Progeny</span>
          )}
        </div>

        {/* Role Switcher (for testing) */}
        {['admin', 'superadmin'].includes(displayUser.role) && !sidebarCollapsed && (
          <div className="p-4 border-b border-border-light">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
              View as
            </label>
            <select
              value={viewAsRole || displayUser.role}
              onChange={(e) => setViewAsRole(e.target.value as any)}
              className="w-full input text-sm py-1.5"
            >
              <option value="participant">Participant</option>
              <option value="facilitator">Facilitator</option>
              <option value="admin">Admin</option>
              {displayUser.role === 'superadmin' && (
                <option value="superadmin">Superadmin</option>
              )}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {effectiveRole === 'participant' && (
            <>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {!sidebarCollapsed && 'Learning'}
              </div>
              {participantNav.slice(0, 2).map((item) => (
                <Link key={item.name} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </>
          )}

          <div className={`text-xs font-medium text-text-muted uppercase tracking-wider mb-2 ${effectiveRole === 'participant' ? 'mt-6' : ''}`}>
            {!sidebarCollapsed && 'Community'}
          </div>
          {participantNav.slice(2, 4).map((item) => (
            <Link key={item.name} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}

          {effectiveRole === 'participant' && (
            <>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 mt-6">
                {!sidebarCollapsed && 'Personal'}
              </div>
              {participantNav.slice(4).map((item) => (
                <Link key={item.name} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </>
          )}

          {(effectiveRole === 'facilitator' || effectiveRole === 'admin' || effectiveRole === 'superadmin') && (
            <>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 mt-6">
                {!sidebarCollapsed && 'Facilitation'}
              </div>
              {facilitatorNav.map((item) => (
                <Link key={item.name} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </>
          )}

          {(effectiveRole === 'admin' || effectiveRole === 'superadmin') && (
            <>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 mt-6">
                {!sidebarCollapsed && 'Administration'}
              </div>
              {adminNav.map((item) => (
                <Link key={item.name} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </>
          )}

          {effectiveRole === 'superadmin' && (
            <>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 mt-6">
                {!sidebarCollapsed && 'Platform'}
              </div>
              {superadminNav.map((item) => (
                <Link key={item.name} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-np-blue to-np-teal flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {displayUser.full_name ? getInitials(displayUser.full_name) : '?'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {displayUser.full_name || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate capitalize">
                  {effectiveRole}
                </p>
              </div>
            )}
            <button
              onClick={signOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white border-b border-border-light px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={toggleSidebar} className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" placeholder="Search lessons, resources..." className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-np-blue text-sm w-64" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-text-secondary" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-np-coral rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  )
}
