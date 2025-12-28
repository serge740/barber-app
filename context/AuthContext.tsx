import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '@/services/notificationService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  signUp: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@user_data';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Store unsubscribe functions
  const notificationUnsubscribes = useRef<{
    tokenRefresh?: () => void;
    foreground?: () => void;
  }>({});

  // Handle foreground notifications
  const handleForegroundNotification = (message: any) => {
    console.log('Foreground notification received:', message);
    // You can show a local notification or handle it as needed
    // For example, using react-native-push-notification or similar
  };

  // Initialize notifications for authenticated user
  const initializeNotifications = async (userId: string) => {
    try {
      const { tokenRefreshUnsubscribe, foregroundUnsubscribe } = 
        await NotificationService.initialize(userId, handleForegroundNotification);
      
      notificationUnsubscribes.current = {
        tokenRefresh: tokenRefreshUnsubscribe,
        foreground: foregroundUnsubscribe,
      };

      console.log('Notifications initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  // Cleanup notifications
  const cleanupNotifications = async () => {
    try {
      // Unsubscribe from listeners
      if (notificationUnsubscribes.current.tokenRefresh) {
        notificationUnsubscribes.current.tokenRefresh();
      }
      if (notificationUnsubscribes.current.foreground) {
        notificationUnsubscribes.current.foreground();
      }

      // Delete token from Firestore
      await NotificationService.deleteToken();

      notificationUnsubscribes.current = {};
      console.log('Notifications cleaned up');
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
    }
  };

  // Load user data from storage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Store user data
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(firebaseUser));
          setUser(firebaseUser);
          
          // Initialize notifications for the user
          await initializeNotifications(firebaseUser.uid);
        } else {
          // Clear user data
          await AsyncStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          
          // Cleanup notifications
          await cleanupNotifications();
        }
      } catch (error) {
        console.error('Failed to save user data:', error);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      cleanupNotifications();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      
      // Initialize notifications will be handled by onAuthStateChanged
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await auth().createUserWithEmailAndPassword(email, password);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      
      // Initialize notifications will be handled by onAuthStateChanged
      
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Cleanup notifications before signing out
      await cleanupNotifications();
      
      await auth().signOut();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateProfile = async (displayName?: string, photoURL?: string) => {
    try {
      if (user) {
        await user.updateProfile({
          displayName: displayName || user.displayName,
          photoURL: photoURL || user.photoURL,
        });
        // Refresh user data
        await user.reload();
        const updatedUser = auth().currentUser;
        if (updatedUser) {
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};