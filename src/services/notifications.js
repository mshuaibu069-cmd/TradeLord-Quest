import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../../supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerDeviceForPush(userId) {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('support', {
      name: 'Support updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;
  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = token?.data;
  if (!expoPushToken) return null;

  const { error } = await supabase.from('user_devices').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform: Platform.OS,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );

  if (error) throw error;
  return expoPushToken;
}
