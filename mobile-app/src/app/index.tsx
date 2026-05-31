import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { LogoHeader } from '@/components/LogoHeader';
import { useAuth } from '@/context/AuthContext';

export default function EntryPoint() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user.role === 'owner') {
        router.replace('/owner/dashboard');
      } else if (user.role === 'sales' || user.role === 'sales_executive') {
        router.replace('/sales/dashboard');
      } else if (user.role === 'supervisor') {
        router.replace('/supervisor/dashboard');
      } else {
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [user, isLoading]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.splashContent}>
        <LogoHeader scale={1.3} />
        <ActivityIndicator size="large" color="#04a700" style={styles.loader} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    gap: 30,
  },
  loader: {
    marginTop: 10,
  },
});
