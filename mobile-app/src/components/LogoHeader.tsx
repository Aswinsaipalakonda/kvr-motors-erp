import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from './themed-text';

export function LogoHeader({ scale = 1 }: { scale?: number }) {
  const containerSize = 100 * scale;
  const imageSize = 75 * scale;

  return (
    <View style={styles.container}>
      <View style={[styles.logoOutline, { width: containerSize, height: containerSize, borderRadius: containerSize / 2 }]}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </View>
      <ThemedText style={styles.brandTitle}>KVR MOTORS</ThemedText>
      <ThemedText style={styles.brandSubtitle}>EV Showroom & Distribution Management</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 8,
  },
  logoOutline: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: 2,
    marginTop: 4,
    fontFamily: 'system-ui',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#60646C',
    fontWeight: '500',
  },
});
