import { Platform, NativeModules } from 'react-native';

/**
 * Registers the device for Firebase Cloud Messaging (FCM).
 * This function is safe to run inside Expo Go as it dynamically imports 
 * Firebase Messaging and falls back to a mock token if native modules are not linked.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return 'mock-firebase-token-web';
  }

  // Check if native Firebase modules are linked in the current binary
  const hasFirebase = !!NativeModules.RNFBAppModule;
  if (!hasFirebase) {
    if (__DEV__) {
      console.log('FCM native modules not linked/available (running in Expo Go). Defaulting to mock token.');
    }
    return 'ExponentPushToken[mock-fcm-token-go]';
  }

  try {
    // Dynamically require Firebase Messaging to prevent breaking Expo Go at import time
    const messaging = require('@react-native-firebase/messaging').default;
    
    // Request permission (handles iOS prompts automatically)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === 1 || // messaging.AuthorizationStatus.AUTHORIZED
      authStatus === 2;   // messaging.AuthorizationStatus.PROVISIONAL

    if (!enabled) {
      if (__DEV__) {
        console.warn('Failed to secure FCM push notification permissions from user.');
      }
      return null;
    }

    // Register device for remote messages (mandatory for iOS APNs to FCM mapping)
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    // Retrieve FCM token
    const token = await messaging().getToken();
    if (__DEV__) {
      console.log('Firebase Cloud Messaging Token:', token);
    }
    return token;
  } catch (error) {
    if (__DEV__) {
      console.log('FCM native modules not available (expected when running in Expo Go). Defaulting to mock token:', error);
    }
    return 'ExponentPushToken[mock-fcm-token-go]';
  }
}
