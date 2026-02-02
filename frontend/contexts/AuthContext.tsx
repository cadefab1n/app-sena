import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Restaurant {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  whatsapp?: string;
  primary_color?: string;
  is_open?: boolean;
}

interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, restaurantName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRestaurant: (data: Partial<Restaurant>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Storage helper for web/mobile compatibility
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('seven_token');
      if (storedToken) {
        setToken(storedToken);
        // Verify token and get user data
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setRestaurant(data.restaurant);
        } else {
          // Token invalid, clear storage
          await storage.removeItem('seven_token');
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.detail || 'Erro ao fazer login');
    }

    await storage.setItem('seven_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setRestaurant(data.restaurant);
  };

  const register = async (email: string, password: string, name: string, restaurantName: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, restaurant_name: restaurantName }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.detail || 'Erro ao criar conta');
    }

    await storage.setItem('seven_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setRestaurant(data.restaurant);
  };

  const logout = async () => {
    await storage.removeItem('seven_token');
    setToken(null);
    setUser(null);
    setRestaurant(null);
  };

  const updateRestaurant = (data: Partial<Restaurant>) => {
    if (restaurant) {
      setRestaurant({ ...restaurant, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      restaurant,
      token,
      isLoading,
      login,
      register,
      logout,
      updateRestaurant,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
