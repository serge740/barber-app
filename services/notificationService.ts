import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

interface NotificationToken {
  userId: string;
  token: string;
  deviceType: string;
  createdAt: Date;
  updatedAt: Date;
}

class NotificationService {
  private readonly COLLECTION_NAME = 'notification_tokens';

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
      }
      return enabled;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // Get FCM token
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save token to Firestore
  async saveToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.error('No FCM token available');
        return false;
      }

      const tokenData: NotificationToken = {
        userId,
        token,
        deviceType: Platform.OS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Use token as document ID to prevent duplicates
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(token)
        .set(tokenData, { merge: true });

      console.log('Token saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  // Delete token from Firestore
  async deleteToken(token?: string): Promise<boolean> {
    try {
      const fcmToken = token || await this.getToken();
      if (!fcmToken) return false;

      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(fcmToken)
        .delete();

      console.log('Token deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      return false;
    }
  }

  // Get all tokens for a user
  async getUserTokens(userId: string): Promise<NotificationToken[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COLLECTION_NAME)
        .where('userId', '==', userId)
        .get();

      return snapshot.docs.map(doc => doc.data() as NotificationToken);
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
  }

  // Setup token refresh listener
  setupTokenRefreshListener(userId: string): () => void {
    const unsubscribe = messaging().onTokenRefresh(async token => {
      console.log('Token refreshed:', token);
      await this.saveToken(userId);
    });

    return unsubscribe;
  }

  // Setup foreground notification listener
  setupForegroundListener(
    onNotification: (message: any) => void
  ): () => void {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      onNotification(remoteMessage);
    });

    return unsubscribe;
  }

  // Setup background notification handler
  setupBackgroundHandler(handler: (message: any) => Promise<void>): void {
    messaging().setBackgroundMessageHandler(handler);
  }

  // Initialize service
  async initialize(
    userId: string,
    onForegroundNotification?: (message: any) => void
  ): Promise<{
    tokenRefreshUnsubscribe: () => void;
    foregroundUnsubscribe?: () => void;
  }> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    await this.saveToken(userId);

    const tokenRefreshUnsubscribe = this.setupTokenRefreshListener(userId);
    const foregroundUnsubscribe = onForegroundNotification
      ? this.setupForegroundListener(onForegroundNotification)
      : undefined;

    return {
      tokenRefreshUnsubscribe,
      foregroundUnsubscribe,
    };
  }
}

export default new NotificationService();