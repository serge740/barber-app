import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUser,
  loginUser,
  getUserById,
  updateUserProfile,
  changeUserPassword,
  User,
} from '@/services/clientAuthService'; // Adjust path as needed

interface ClientAuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (phoneOrEmail: string, password: string) => Promise<User>;
  signUp: (name: string, phone: string, password: string, email?: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (name?: string, phone?: string, email?: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@client_user_data';

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data from storage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Optionally refresh user data from Firestore
          try {
            const freshUser = await getUserById(parsedUser.id);
            setUser(freshUser);
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const signIn = async (phoneOrEmail: string, password: string) => {
    try {
      const loggedInUser = await loginUser({ phoneOrEmail, password });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (
    name: string,
    phone: string,
    password: string,
    email?: string
  ) => {
    try {
      const newUser = await createUser({ name, phone, password, email });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (name?: string, phone?: string, email?: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedUser = await updateUserProfile(user.id, { name, phone, email });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      await changeUserPassword(user.id, oldPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      
      const freshUser = await getUserById(user.id);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value: ClientAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};