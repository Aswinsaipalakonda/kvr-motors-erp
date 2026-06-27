import { Platform } from 'react-native';

/**
 * Registers the device for Firebase Cloud Messaging (FCM).
 * STUB VERSION: returns a mock token immediately to prevent native Firebase dependency footprint.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return 'ExponentPushToken[mock-fcm-token-go]';
}
