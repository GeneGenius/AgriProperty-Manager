import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, authApi } from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,

      setSession: (session) => set({ session, user: session?.user || null }),

      fetchProfile: async () => {
        try {
          const profile = await authApi.getProfile()
          set({ profile })
          return profile
        } catch {
          return null
        }
      },

      updateProfile: async (data) => {
        const profile = await authApi.updateProfile(data)
        set({ profile })
        return profile
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        set({ session: data.session, user: data.user })
        await get().fetchProfile()
        return data
      },

      signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        return data
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/dashboard` },
        })
        if (error) throw error
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, session: null })
      },

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'agriproperty-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)

export default useAuthStore
