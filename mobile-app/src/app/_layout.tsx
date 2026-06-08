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
      // Redirect to the login screen if trying to access secure screens and not logged in
      router.replace('/login');
    } else if (user && !inAuthGroup) {
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
