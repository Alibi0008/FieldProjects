import { createContext, useContext, useState, type ReactNode } from 'react';
import { Api } from './api';
import { AuthStorage } from './auth-storage';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  gpa: number;
  skills: string;
  karma: number;
  eliteMinGpa: number;
  matchingMode?: string;
  schedule?: string;
  completedProjects?: number;
  reviewCount?: number;
  githubCommits?: number;
  reliabilityLabel?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: object) => Promise<string | null>;
  refreshUser: (updatedUser: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = AuthStorage.readUser();
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(AuthStorage.readToken());

  const refreshUser = (updatedUser: AuthUser) => {
    AuthStorage.writeUser(updatedUser);
    setUser(updatedUser);
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const data = await Api.login({ email, password });
    if (data.error) return data.error;
    AuthStorage.writeSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return null;
  };

  const register = async (formData: object): Promise<string | null> => {
    const data = await Api.register(formData);
    if (data.error) return data.error;
    AuthStorage.writeSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return null;
  };

  const logout = () => {
    AuthStorage.clearSession();
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, register, refreshUser, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
