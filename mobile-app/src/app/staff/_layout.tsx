import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ClipboardCheck, ScanLine, Boxes, User, Clock } from 'lucide-react-native';
import { Slot, usePathname } from 'expo-router';

import StaffDashboard from './dashboard';
import StaffScanner from './godown-scanner';
import StaffPdi from './pdi-checklist';
import StaffProfile from './profile';
import StaffAttendance from './attendance';

type ScreenTab = 'dashboard' | 'godown-scanner' | 'pdi-checklist' | 'attendance' | 'profile';

const TAB_KEYS: ScreenTab[] = ['dashboard', 'godown-scanner', 'pdi-checklist', 'attendance', 'profile'];

const TABS_CONFIG = [
  { key: 'dashboard', label: 'Queue', icon: Boxes },
  { key: 'godown-scanner', label: 'Scanner', icon: ScanLine },
  { key: 'pdi-checklist', label: 'PDI', icon: ClipboardCheck },
  { key: 'attendance', label: 'Attendance', icon: Clock },
  { key: 'profile', label: 'Profile', icon: User },
] as const;

function AnimatedTabButton({
  label,
  icon: IconComp,
  isActive,
  onPress,
}: {
  label: string;
  icon: any;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.05 : 1, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(isActive ? 1 : 0.6, { damping: 15, stiffness: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <IconComp size={22} color={isActive ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} fill="none" strokeWidth={isActive ? 2.2 : 1.8} />
      </Animated.View>
      <ThemedText style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</ThemedText>
    </Pressable>
  );
}

export default function StaffLayout() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && TAB_KEYS.includes(lastSegment as any)) {
      setActiveTab(lastSegment as ScreenTab);
    }
  }, [pathname]);

  const isSubRoute = pathname !== '/staff' && pathname !== '/staff/' && !TAB_KEYS.some((tab) => pathname.endsWith(tab));

  return (
    <ThemedView style={styles.container}>
      {!isSubRoute && (
        <View style={styles.screenContainer}>
          <View style={{ flex: 1, display: activeTab === 'dashboard' ? 'flex' : 'none' }}>
            <StaffDashboard isActive={activeTab === 'dashboard'} />
          </View>
          <View style={{ flex: 1, display: activeTab === 'godown-scanner' ? 'flex' : 'none' }}>
            <StaffScanner isActive={activeTab === 'godown-scanner'} onBack={() => setActiveTab('dashboard')} />
          </View>
          <View style={{ flex: 1, display: activeTab === 'pdi-checklist' ? 'flex' : 'none' }}>
            <StaffPdi isActive={activeTab === 'pdi-checklist'} onBack={() => setActiveTab('dashboard')} />
          </View>
          <View style={{ flex: 1, display: activeTab === 'attendance' ? 'flex' : 'none' }}>
            <StaffAttendance isActive={activeTab === 'attendance'} />
          </View>
          <View style={{ flex: 1, display: activeTab === 'profile' ? 'flex' : 'none' }}>
            <StaffProfile />
          </View>
        </View>
      )}

      {/* Slot Container - ALWAYS rendered in the same spot! */}
      <View 
        key="layout-slot-container"
        style={isSubRoute ? { flex: 1 } : { position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}
      >
        <Slot />
      </View>

      {!isSubRoute && (
        <View style={[styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 6 }]}>
          {TABS_CONFIG.map((tab) => (
            <AnimatedTabButton
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 24,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 10 },
  iconContainer: { width: 44, height: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 2, zIndex: 10 },
  tabLabel: { fontSize: 10.5, fontWeight: '500', color: 'rgba(255, 255, 255, 0.45)' },
  activeTabLabel: { color: '#04a700', fontWeight: '700' },
});
