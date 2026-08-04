import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useLoginMutation,
  useMeQuery,
  useRegisterMutation,
  type MeQuery,
} from '../generated/graphql'
import { clearAuthToken, getAuthToken, setAuthToken } from './token'

type AuthUser = NonNullable<MeQuery['me']>

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getAuthToken())

  const meQuery = useMeQuery(undefined, {
    enabled: Boolean(token),
    retry: false,
  })

  const loginMutation = useLoginMutation()
  const registerMutation = useRegisterMutation()

  useEffect(() => {
    if (token && meQuery.isError) {
      clearAuthToken()
      setToken(null)
      queryClient.removeQueries({ queryKey: ['Me'] })
    }
  }, [meQuery.isError, queryClient, token])

  const applySession = useCallback(
    async (nextToken: string) => {
      setAuthToken(nextToken)
      setToken(nextToken)
      await queryClient.invalidateQueries({ queryKey: ['Me'] })
    },
    [queryClient],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation.mutateAsync({ email, password })
      await applySession(result.login.token)
    },
    [applySession, loginMutation],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await registerMutation.mutateAsync({
        name,
        email,
        password,
      })
      await applySession(result.register.token)
    },
    [applySession, registerMutation],
  )

  const logout = useCallback(() => {
    clearAuthToken()
    setToken(null)
    queryClient.setQueryData(['Me'], { me: null })
    queryClient.removeQueries({ queryKey: ['Me'] })
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data?.me ?? null,
      token,
      isLoading: Boolean(token) && meQuery.isLoading,
      isAuthenticated: Boolean(token && meQuery.data?.me),
      login,
      register,
      logout,
    }),
    [login, logout, meQuery.data?.me, meQuery.isLoading, register, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
