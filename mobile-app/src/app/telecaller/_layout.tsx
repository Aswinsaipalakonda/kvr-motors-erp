import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Home, PhoneCall, User } from 'lucide-react-native';
import { Slot, usePathname, useRouter } from 'expo-router';

// Screen imports
import TelecallerDashboard from './dashboard';
import TelecallerLeads from './leads';
import TelecallerProfile from './profile';

type ScreenTab = 'dashboard' | 'leads' | 'profile';

const TAB_KEYS: ScreenTab[] = ['dashboard', 'leads', 'profile'];

const TABS_CONFIG = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'leads', label: 'Leads Desk', icon: PhoneCall },
  { key: 'profile', label: 'Profile', icon: User },
] as const;

function AnimatedTabButton({ 
  label, 
  icon: IconComp, 
  isActive, 
  onPress 
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
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Pressable 
      onPress={onPress} 
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <IconComp 
          size={22} 
          color={isActive ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
          fill="none"
          strokeWidth={isActive ? 2.2 : 1.8}
        />
      </Animated.View>
      <ThemedText style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function TelecallerLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && TAB_KEYS.includes(lastSegment as any)) {
      setActiveTab(lastSegment as ScreenTab);
    }
  }, [pathname]);

  const isSubRoute = pathname !== '/telecaller' && pathname !== '/telecaller/' && !TAB_KEYS.some(tab => pathname.endsWith(tab));

  const tabWidth = screenWidth / TAB_KEYS.length;
  const activeIndexShared = useSharedValue(0);

  useEffect(() => {
    const newIdx = TAB_KEYS.indexOf(activeTab);
    activeIndexShared.value = withSpring(newIdx, {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    });
  }, [activeTab]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: activeIndexShared.value * tabWidth + (tabWidth - 48) / 2 }
      ],
    };
  });

  if (isSubRoute) {
    return <Slot />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.screenContainer}>
        <View style={[styles.screenLayer, { display: activeTab === 'dashboard' ? 'flex' : 'none' }]}>
          <TelecallerDashboard />
        </View>
        <View style={[styles.screenLayer, { display: activeTab === 'leads' ? 'flex' : 'none' }]}>
          <TelecallerLeads />
        </View>
        <View style={[styles.screenLayer, { display: activeTab === 'profile' ? 'flex' : 'none' }]}>
          <TelecallerProfile />
        </View>
      </View>

      {/* Dark Glassmorphic Bottom Navigation Bar */}
      <View style={[styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 6 }]}>
        <Animated.View style={[styles.activeIndicatorWrapper, animatedIndicatorStyle]}>
          <View style={styles.activeTopLine} />
        </Animated.View>

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16', 
    paddingHorizontal: 0,
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
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 10,
  },
  activeIndicatorWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 48,
    height: 3,
    alignItems: 'center',
    zIndex: 20,
  },
  activeTopLine: {
    height: 3,
    width: 48,
    backgroundColor: '#04a700', 
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconContainer: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)', 
  },
  activeTabLabel: {
    color: '#04a700', 
    fontWeight: '700',
  },
});
