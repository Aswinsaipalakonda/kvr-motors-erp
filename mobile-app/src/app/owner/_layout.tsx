import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  View, StyleSheet, Pressable, Platform, Dimensions, 
  Image, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS 
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { 
  Home, Landmark, Package, UserCheck, TrendingUp, 
  Menu as HamburgerIcon, X, CalendarDays, ShoppingBag, 
  Users, LogOut, ChevronRight, Shield, Sparkles 
} from 'lucide-react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

// Import Owner Screens
import OwnerDashboard from './dashboard';
import OwnerBranches from './branches';
import OwnerInventory from './inventory';
import OwnerLeads from './leads';

// Define Screen Tabs
type ScreenTab = 'dashboard' | 'branches' | 'inventory' | 'leads';

const TAB_KEYS: ScreenTab[] = ['dashboard', 'branches', 'inventory', 'leads'];

import { DrawerContext } from '@/context/DrawerContext';

export default function OwnerLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const [branch, setBranch] = useState('Vizag Showroom');
  const [isDrawerOpenState, setIsDrawerOpenState] = useState(false);
  
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const drawerWidth = screenWidth * 0.78;

  // Sync pathname with active tab
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && TAB_KEYS.includes(lastSegment as any)) {
      setActiveTab(lastSegment as ScreenTab);
    }
  }, [pathname]);

  const isSubRoute = pathname !== '/owner' && pathname !== '/owner/' && !TAB_KEYS.some(tab => pathname.endsWith(tab)) && !pathname.endsWith('profile');

  // Shared value for Drawer slide and Main Screen shift/scale animation
  const drawerProgress = useSharedValue(0);

  const openDrawer = () => {
    setIsDrawerOpenState(true);
    drawerProgress.value = withSpring(1, {
      damping: 18,
      stiffness: 110,
      mass: 0.9,
    });
  };

  const closeDrawer = () => {
    drawerProgress.value = withSpring(0, {
      damping: 18,
      stiffness: 110,
      mass: 0.9,
    }, (finished) => {
      if (finished) {
        runOnJS(setIsDrawerOpenState)(false);
      }
    });
  };

  const handleLogout = () => {
    closeDrawer();
    Alert.alert(
      'Confirm Log Out',
      'Are you sure you want to end your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (e) {
              Alert.alert('Error', 'Failed to log out.');
            }
          }
        }
      ]
    );
  };

  // Tab indicator sliding animation
  const tabWidth = screenWidth / 4;
  const activeIndexShared = useSharedValue(0);

  useEffect(() => {
    const newIdx = TAB_KEYS.indexOf(activeTab);
    if (newIdx !== -1) {
      activeIndexShared.value = withSpring(newIdx, {
        damping: 18,
        stiffness: 140,
        mass: 0.8,
      });
    }
  }, [activeTab]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: activeIndexShared.value * tabWidth + (tabWidth - 48) / 2 }
      ],
    };
  });

  // Drawer Slide Animation
  const drawerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(drawerProgress.value, [0, 1], [-drawerWidth, 0]);
    return {
      transform: [{ translateX }],
    };
  });

  // Main Screen Scale, Shifting, and Border Radius Anim (SaaS-prototype effect from Figma Community)
  const mainContentAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(drawerProgress.value, [0, 1], [1, 0.88]);
    const translateX = interpolate(drawerProgress.value, [0, 1], [0, drawerWidth * 0.9]);
    const borderRadius = interpolate(drawerProgress.value, [0, 1], [0, 32]);
    const rotateY = interpolate(drawerProgress.value, [0, 1], [0, -8]);
    
    return {
      transform: [
        { perspective: 1000 },
        { translateX },
        { scale },
        { rotateY: `${rotateY}deg` }
      ],
      borderRadius,
    };
  });

  // Main Content Screen Dim Overlay Anim
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(drawerProgress.value, [0, 1], [0, 0.45]);
    return {
      opacity,
      display: drawerProgress.value > 0 ? 'flex' : 'none',
    };
  });

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OwnerDashboard branch={branch} setBranch={setBranch} />;
      case 'branches':
        return <OwnerBranches />;
      case 'inventory':
        return <OwnerInventory />;
      case 'leads':
        return <OwnerLeads />;
      default:
        return <OwnerDashboard branch={branch} setBranch={setBranch} />;
    }
  };

  // Nav items inside the drawer
  const drawerMenuItems = [
    {
      title: 'Showroom Bookings',
      route: '/owner/bookings',
      icon: CalendarDays,
      color: '#04a700',
    },
    {
      title: 'Purchase Orders',
      route: '/owner/purchases',
      icon: ShoppingBag,
      color: '#ea580c',
    },
    {
      title: 'Sales Overview',
      route: '/owner/sales',
      icon: TrendingUp,
      color: '#2563eb',
    },
    {
      title: 'User Management',
      route: '/owner/users',
      icon: Users,
      color: '#a855f7',
    },
    {
      title: 'General Ledger',
      route: '/owner/ledger',
      icon: Landmark,
      color: '#ec4899',
    },
  ];

  if (isSubRoute) {
    return <Slot />;
  }

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen: isDrawerOpenState }}>
      <ThemedView style={styles.container}>
        {/* Animated Sliding Sidebar Drawer (Obsidian SaaS Styling) */}
        <Animated.View style={[styles.drawerContainer, { width: drawerWidth }, drawerAnimatedStyle]}>
          <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
            <View style={styles.drawerHeaderTop}>
              <View style={styles.logoWrapper}>
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={styles.logoImg} 
                  resizeMode="contain"
                />
              </View>
              <Pressable onPress={closeDrawer} style={styles.closeBtn}>
                <X size={20} color="#ffffff" />
              </Pressable>
            </View>

            {/* Profile Detail */}
            <View style={styles.profileSection}>
              <View style={styles.avatarBorder}>
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={styles.avatarImg} 
                  resizeMode="contain"
                />
              </View>
              <View style={styles.profileMeta}>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Shield size={10} color="#04a700" style={{ marginRight: 3 }} />
                    <ThemedText style={styles.roleText}>{user?.role?.toUpperCase() || 'OWNER'}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.profileName} numberOfLines={1}>{user?.full_name || 'Enterprise Owner'}</ThemedText>
                <Pressable onPress={() => { closeDrawer(); router.push('/owner/profile'); }} style={styles.profileLink}>
                  <ThemedText style={styles.profileLinkText}>View profile</ThemedText>
                  <ChevronRight size={10} color="#04a700" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.drawerDivider} />

          {/* Navigation Menu List */}
          <ScrollView 
            style={styles.drawerBody} 
            contentContainerStyle={styles.drawerBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {drawerMenuItems.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <Pressable 
                  key={idx}
                  onPress={() => {
                    closeDrawer();
                    router.push(item.route as any);
                  }}
                  style={({ pressed }) => [
                    styles.drawerMenuItem,
                    pressed && styles.drawerMenuItemPressed
                  ]}
                >
                  <View style={[styles.menuIconWrapper, { backgroundColor: `${item.color}15` }]}>
                    <IconComp size={18} color={item.color} />
                  </View>
                  <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Drawer Footer / Logout */}
          <View style={[styles.drawerFooter, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }]}>
            <Pressable 
              onPress={handleLogout} 
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed
              ]}
            >
              <LogOut size={16} color="#ff4444" />
              <ThemedText style={styles.logoutText}>Log out</ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Animated Main Content Container */}
        <Animated.View style={[styles.mainContentContainer, mainContentAnimatedStyle]}>
          {/* Active Screen View */}
          <View style={styles.screenContainer}>
            {renderActiveScreen()}
          </View>

          {/* Interactive Tap-to-Close Dim Overlay */}
          <Animated.View style={[styles.dimOverlay, overlayAnimatedStyle]}>
            <Pressable style={styles.overlayPressable} onPress={closeDrawer} />
          </Animated.View>

          {/* Dark Glassmorphic Bottom Navigation Bar */}
          <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10 }]}>
            {/* Animated Sliding Highlight Line and Glow */}
            <Animated.View style={[styles.activeIndicatorWrapper, animatedIndicatorStyle]}>
              <View style={styles.activeTopLine} />
              <View style={styles.activeTopGlow} />
            </Animated.View>

            {/* Tab 1: Home / Dashboard */}
            <Pressable 
              onPress={() => setActiveTab('dashboard')} 
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Home 
                  size={20} 
                  color={activeTab === 'dashboard' ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
                  strokeWidth={activeTab === 'dashboard' ? 2.2 : 1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>
                Home
              </ThemedText>
            </Pressable>

            {/* Tab 2: Branches */}
            <Pressable 
              onPress={() => setActiveTab('branches')} 
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Landmark 
                  size={20} 
                  color={activeTab === 'branches' ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
                  strokeWidth={activeTab === 'branches' ? 2.2 : 1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'branches' && styles.activeTabLabel]}>
                Branches
              </ThemedText>
            </Pressable>

            {/* Tab 3: Inventory */}
            <Pressable 
              onPress={() => setActiveTab('inventory')} 
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Package 
                  size={20} 
                  color={activeTab === 'inventory' ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
                  strokeWidth={activeTab === 'inventory' ? 2.2 : 1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'inventory' && styles.activeTabLabel]}>
                Inventory
              </ThemedText>
            </Pressable>

            {/* Tab 4: Hamburger Slide Trigger */}
            <Pressable 
              onPress={openDrawer} 
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <HamburgerIcon 
                  size={20} 
                  color="rgba(255, 255, 255, 0.4)" 
                  strokeWidth={1.8}
                />
              </View>
              <ThemedText style={styles.tabLabel}>
                More
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </ThemedView>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070c', // Deep black background for the drawer viewport
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0a0e1a', // Obsidian dark slate background
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 10,
    justifyContent: 'space-between',
  },
  drawerHeader: {
    paddingHorizontal: 20,
  },
  drawerHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#04a700',
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#04a700',
  },
  profileName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  profileLinkText: {
    fontSize: 11,
    color: '#04a700',
    fontWeight: '600',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 20,
    marginVertical: 14,
  },
  drawerBody: {
    flex: 1,
  },
  drawerBodyContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
  },
  drawerMenuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  menuIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  drawerFooter: {
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.15)',
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 68, 68, 0.14)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc', // dashboard bg color
    shadowColor: '#000000',
    shadowOffset: { width: -12, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  screenContainer: {
    flex: 1,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 99,
  },
  overlayPressable: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16', 
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 8,
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
    height: '100%',
    alignItems: 'center',
  },
  activeTopLine: {
    height: 3.5,
    width: 48,
    backgroundColor: '#04a700', 
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  activeTopGlow: {
    height: 24,
    width: 48,
    backgroundColor: 'rgba(4, 167, 0, 0.15)', 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  iconContainer: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)', 
  },
  activeTabLabel: {
    color: '#04a700', 
    fontWeight: 'bold',
  },
});
