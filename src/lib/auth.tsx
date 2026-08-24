'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'driver';

export interface User {
  email: string;
  role: Role;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage on mount
    try {
      const saved = localStorage.getItem('mobipro_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Admin login
    if (email === 'hagy.maia19@gmail.com' && password === 'admin123') {
      const adminUser: User = { email, role: 'admin', name: 'Admin Hagy' };
      setUser(adminUser);
      localStorage.setItem('mobipro_user', JSON.stringify(adminUser));
      return true;
    }

    // Generic driver login
    if (email.includes('@') && password.length >= 6) {
      const driverUser: User = { email, role: 'driver', name: 'Motorista Parceiro' };
      setUser(driverUser);
      localStorage.setItem('mobipro_user', JSON.stringify(driverUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mobipro_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
