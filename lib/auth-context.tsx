'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface User {
  phone: string
  loginTime: Date
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (phone: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 从 sessionStorage 恢复登录状态
  useEffect(() => {
    const storedUser = sessionStorage.getItem('auth_user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser({
          phone: parsed.phone,
          loginTime: new Date(parsed.loginTime),
        })
      } catch {
        sessionStorage.removeItem('auth_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((phone: string) => {
    const newUser = {
      phone,
      loginTime: new Date(),
    }
    setUser(newUser)
    // 保存到 sessionStorage
    sessionStorage.setItem('auth_user', JSON.stringify(newUser))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('auth_user')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
