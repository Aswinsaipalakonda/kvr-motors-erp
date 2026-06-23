import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { LogoHeader } from '@/components/LogoHeader';
import { useAuth } from '@/context/AuthContext';

import { ROLE_ROUTE_MAP } from './_layout';

export default function EntryPoint() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const targetPath = user ? (ROLE_ROUTE_MAP[user.role] || '/login') : '/login';
    router.replace(targetPath as any);
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
