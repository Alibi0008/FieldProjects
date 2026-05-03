import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Api } from './api';

interface AuthUser {
  id: number; name: string; email: string; role: string; gpa: number;
  skills: string; karma: number; eliteMinGpa: number;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tf_token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('tf_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const refreshUser = (updatedUser: AuthUser) => {
    localStorage.setItem('tf_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const data = await Api.login({ email, password });
    if (data.error) return data.error;
    localStorage.setItem('tf_token', data.token);
    localStorage.setItem('tf_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return null;
  };

  const register = async (formData: object): Promise<string | null> => {
    const data = await Api.register(formData);
    if (data.error) return data.error;
    localStorage.setItem('tf_token', data.token);
    localStorage.setItem('tf_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return null;
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, register, refreshUser, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
