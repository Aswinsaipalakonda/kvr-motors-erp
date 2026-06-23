import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const ROLE_ROUTE_MAP: Record<string, string> = {
  owner: '/owner/dashboard',
  admin: '/owner/dashboard',
  sales: '/sales/dashboard',
  sales_executive: '/sales/dashboard',
  supervisor: '/supervisor/dashboard',
  staff: '/staff/dashboard',
  operations: '/staff/dashboard',
  telecaller: '/telecaller/dashboard',
};

const ROLE_GROUP_MAP: Record<string, string> = {
  owner: 'owner',
  admin: 'owner',
  sales: 'sales',
  sales_executive: 'sales',
  supervisor: 'supervisor',
  staff: 'staff',
  operations: 'staff',
  telecaller: 'telecaller',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const targetGroup = segments[0];
    const authGroups = ['owner', 'sales', 'supervisor', 'staff', 'telecaller'];
    const inAuthGroup = authGroups.includes(targetGroup);

    if (!user) {
      if (inAuthGroup) {
        try {
          if (typeof router.canDismiss === 'function' && router.canDismiss()) {
            router.dismissAll();
          }
        } catch (e) {
          console.warn("Failed to dismiss navigation stack on logout:", e);
        }
        router.replace('/login');
      }
    } else {
      const correctGroup = ROLE_GROUP_MAP[user.role];
      const isUserInCorrectGroup = targetGroup === correctGroup;

      if (inAuthGroup) {
        if (!isUserInCorrectGroup) {
          // Redirect unauthorized role attempts to their correct dashboard
          const targetPath = ROLE_ROUTE_MAP[user.role] || '/login';
          router.replace(targetPath as any);
        }
      } else {
        try {
          if (typeof router.canDismiss === 'function' && router.canDismiss()) {
            router.dismissAll();
          }
        } catch (e) {
          console.warn("Failed to dismiss navigation stack on login:", e);
        }
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
      <Stack.Screen name="sales" />
      <Stack.Screen name="supervisor" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="telecaller" />
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
