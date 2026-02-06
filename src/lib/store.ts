import { create } from 'zustand'

type UserRole = 'participant' | 'facilitator' | 'admin' | 'superadmin'

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  organization_id: string | null
}

interface Cohort {
  id: string
  name: string
  slug: string
  status: string
  start_date: string
  current_week: number
}

interface AppState {
  // User
  user: Profile | null
  setUser: (user: Profile | null) => void
  
  // Current cohort context
  currentCohort: Cohort | null
  setCurrentCohort: (cohort: Cohort | null) => void
  
  // Role switching (for demo/testing)
  viewAsRole: UserRole | null
  setViewAsRole: (role: UserRole | null) => void
  
  // UI State
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // Active channel for messaging
  activeChannelId: string | null
  setActiveChannelId: (id: string | null) => void
  
  // Unread counts
  unreadCounts: Record<string, number>
  setUnreadCount: (channelId: string, count: number) => void
  clearUnreadCount: (channelId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // Cohort
  currentCohort: null,
  setCurrentCohort: (cohort) => set({ currentCohort: cohort }),
  
  // Role
  viewAsRole: null,
  setViewAsRole: (role) => set({ viewAsRole: role }),
  
  // UI
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  // Messaging
  activeChannelId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  
  // Unread
  unreadCounts: {},
  setUnreadCount: (channelId, count) => 
    set((state) => ({ 
      unreadCounts: { ...state.unreadCounts, [channelId]: count } 
    })),
  clearUnreadCount: (channelId) => 
    set((state) => {
      const { [channelId]: _removed, ...rest } = state.unreadCounts
      void _removed // Suppress unused variable warning
      return { unreadCounts: rest }
    }),
}))

// Selectors
export const useUser = () => useAppStore((state) => state.user)
export const useCurrentCohort = () => useAppStore((state) => state.currentCohort)
export const useEffectiveRole = () => useAppStore((state) => 
  state.viewAsRole || state.user?.role || 'participant'
)
