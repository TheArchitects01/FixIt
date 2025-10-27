import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { uploadImageAsync } from '@/utils/cloudinary';
import { apiGet, apiPost, apiPatch } from '@/services/api';


interface AuthContextType {
  user: User | null;
  login: (id: string, password: string, role: 'student' | 'admin' | 'staff') => Promise<boolean>;
  register: (name: string, studentId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfileImage: (imageUri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bootstrap from token -> fetch current user
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const resp = await apiGet('/auth/me', token);
          const current = resp.user as User;
          setUser(current);
          await AsyncStorage.setItem('user', JSON.stringify(current));
        } else {
          setUser(null);
          await AsyncStorage.removeItem('user');
        }
      } catch (e) {
        console.error('Auth bootstrap error:', e);
        setUser(null);
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (id: string, password: string, role: 'student' | 'admin' | 'staff'): Promise<boolean> => {
    try {
      const resp = await apiPost('/auth/login', { id, password, role });
      const { token, user: u } = resp as { token: string; user: User };
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(u)],
      ]);
      setUser(u);
      return true;
    } catch (error: any) {
      const errMsg = error?.message || 'Login failed. Please check your credentials.';
      console.error('Login error:', errMsg);
      return false;
    }
  };

  const register = async (name: string, studentId: string, password: string): Promise<boolean> => {
    try {
      const resp = await apiPost('/auth/register', { name, studentId, password });
      const { token, user: u } = resp as { token: string; user: User };
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(u)],
      ]);
      setUser(u);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error?.message || error);
      return false;
    }
  };


  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfileImage = async (imageUri: string) => {
    if (!user) return;
    try {
      // 1) Upload to Cloudinary
      const uploaded = await uploadImageAsync(imageUri, { folder: 'profile-avatars' });
      const url = uploaded.secure_url;

      // 2) Persist via backend
      const token = await AsyncStorage.getItem('token');
      await apiPatch('/users/me/profileImage', { url }, token || undefined);

      // 3) Update local state and storage
      const updatedUser = { ...user, profileImage: url };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      console.error('Error updating profile image:', msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateProfileImage }}>
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