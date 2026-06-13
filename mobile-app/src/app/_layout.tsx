import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const targetGroup = segments[0];
    const inAuthGroup = ['owner', 'sales', 'supervisor', 'staff', 'telecaller'].includes(targetGroup);

    if (!user) {
      if (inAuthGroup) {
        try {
          if (typeof router.canDismiss === 'function' && router.canDismiss()) {
            router.dismissAll();
          }
        } catch (e) {
          console.warn("Failed to dismiss navigation stack on logout:", e);
        }
        // Redirect to the login screen if trying to access secure screens and not logged in
        router.replace('/login');
      }
    } else {
      // User is logged in
      const isUserInCorrectGroup = 
        (user.role === 'owner' && targetGroup === 'owner') ||
        ((user.role === 'sales' || user.role === 'sales_executive') && targetGroup === 'sales') ||
        (user.role === 'supervisor' && targetGroup === 'supervisor') ||
        ((user.role === 'staff' || user.role === 'operations') && targetGroup === 'staff') ||
        (user.role === 'telecaller' && targetGroup === 'telecaller');

      if (inAuthGroup && !isUserInCorrectGroup) {
        // Redirect unauthorized role attempts to their correct dashboard
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
      } else if (!inAuthGroup) {
        try {
          if (typeof router.canDismiss === 'function' && router.canDismiss()) {
            router.dismissAll();
          }
        } catch (e) {
          console.warn("Failed to dismiss navigation stack on login:", e);
        }
        // Redirect to appropriate dashboard if already logged in but not in an auth group
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
