import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (username, password) => {
        set({ loading: true, error: null });
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (!username || !password) {
            throw new Error('Username and password are required');
          }

          if (password.length < 4) {
            throw new Error('Invalid credentials');
          }

          const user = {
            id: 1,
            username,
            email: `${username}@squarefinance.com`,
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
          };

          set({ user, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (error) {
          set({
            loading: false,
            error: error.message || 'Login failed',
          });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
