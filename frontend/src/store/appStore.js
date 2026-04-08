import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      sidebarOpen: true,
      unreadNotifications: 0,
      financeSummary: null,
      recentActivity: [],

      toggleDarkMode: () => {
        const isDark = !get().darkMode
        set({ darkMode: isDark })
        if (isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      initDarkMode: () => {
        const isDark = get().darkMode
        if (isDark) {
          document.documentElement.classList.add('dark')
        }
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
      decrementUnread: () => set((state) => ({ unreadNotifications: Math.max(0, state.unreadNotifications - 1) })),

      setFinanceSummary: (summary) => set({ financeSummary: summary }),

      addRecentActivity: (activity) => set((state) => ({
        recentActivity: [activity, ...state.recentActivity].slice(0, 10),
      })),
    }),
    {
      name: 'agriproperty-app',
      partialize: (state) => ({ darkMode: state.darkMode, sidebarOpen: state.sidebarOpen }),
    }
  )
)

export default useAppStore
