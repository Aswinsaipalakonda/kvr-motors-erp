import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { LogoHeader } from '@/components/LogoHeader';

export default function EntryPoint() {
  const router = useRouter();

  useEffect(() => {
    // Elegant redirect to unified login page on launch
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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
    backgroundColor: '#ffffff',
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
