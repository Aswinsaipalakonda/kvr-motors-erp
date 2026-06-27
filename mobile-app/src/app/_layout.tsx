import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const ROLE_ROUTE_MAP: Record<string, string> = {
  owner: '/owner/dashboard',
  admin: '/owner/dashboard',
};

const ROLE_GROUP_MAP: Record<string, string> = {
  owner: 'owner',
  admin: 'owner',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const targetGroup = segments[0];
    const authGroups = ['owner'];
    const inAuthGroup = authGroups.includes(targetGroup);

    if (!user) {
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {
      const correctGroup = ROLE_GROUP_MAP[user.role];
      const isUserInCorrectGroup = targetGroup === correctGroup;

      if (inAuthGroup) {
        if (!isUserInCorrectGroup) {
          const targetPath = ROLE_ROUTE_MAP[user.role] || '/login';
          router.replace(targetPath as any);
        }
      } else {
        const targetPath = ROLE_ROUTE_MAP[user.role] || '/login';
        router.replace(targetPath as any);
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090d16' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login/index" />
      <Stack.Screen name="owner" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
