import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'owner' || segments[0] === 'sales' || segments[0] === 'supervisor' || segments[0] === 'staff' || segments[0] === 'telecaller';

    if (!user && inAuthGroup) {
      try {
        if (typeof router.canDismiss === 'function' && router.canDismiss()) {
          router.dismissAll();
        }
      } catch (e) {
        console.warn("Failed to dismiss navigation stack on logout:", e);
      }
      // Redirect to the login screen if trying to access secure screens and not logged in
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      try {
        if (typeof router.canDismiss === 'function' && router.canDismiss()) {
          router.dismissAll();
        }
      } catch (e) {
        console.warn("Failed to dismiss navigation stack on login:", e);
      }
      // Redirect to appropriate dashboard if already logged in
      if (user.role === 'owner') {
        router.replace('/owner/dashboard');
      } else if (user.role === 'sales' || user.role === 'sales_executive') {
        router.replace('/sales/dashboard');
      } else if (user.role === 'supervisor') {
        router.replace('/supervisor/dashboard');
      } else if (user.role === 'staff' || user.role === 'operations') {
        router.replace('/staff/dashboard');
      } else if (user.role === 'telecaller') {
        router.replace('/telecaller/dashboard');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090d16' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login/index" />
      {user?.role === 'owner' && <Stack.Screen name="owner" />}
      {(user?.role === 'sales' || user?.role === 'sales_executive') && <Stack.Screen name="sales" />}
      {user?.role === 'supervisor' && <Stack.Screen name="supervisor" />}
      {(user?.role === 'staff' || user?.role === 'operations') && <Stack.Screen name="staff" />}
      {user?.role === 'telecaller' && <Stack.Screen name="telecaller" />}
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
