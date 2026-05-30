import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  View, StyleSheet, Pressable, Platform, Dimensions, 
  Image, Alert, ActivityIndicator, ScrollView, Modal, FlatList 
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
  Users, LogOut, ChevronRight, Shield, Sparkles,
  MapPin, ChevronDown, MoreVertical, Check, User, Settings2
} from 'lucide-react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

// Import Owner Screens
import OwnerDashboard from './dashboard';
import OwnerInventory from './inventory';
import OwnerSales from './sales';
import OwnerUsers from './users';
import OwnerProfile from './profile';

// Define Screen Tabs - 5 tabs!
type ScreenTab = 'dashboard' | 'inventory' | 'sales' | 'users' | 'profile';

const TAB_KEYS: ScreenTab[] = ['dashboard', 'inventory', 'sales', 'users', 'profile'];

import { DrawerContext } from '@/context/DrawerContext';

export default function OwnerLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const [branch, setBranch] = useState('All Branches');
  const [isDrawerOpenState, setIsDrawerOpenState] = useState(false);
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const drawerWidth = screenWidth * 0.78;
  const headerHeight = insets.top + 54;

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

  // Tab indicator sliding animation - stretched across 5 tabs
  const tabWidth = screenWidth / 5;
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
        return <OwnerDashboard branch={branch} setBranch={setBranch} openBranchModal={() => setIsBranchModalVisible(true)} />;
      case 'inventory':
        return <OwnerInventory branch={branch} />;
      case 'sales':
        return <OwnerSales />;
      case 'users':
        return <OwnerUsers />;
      case 'profile':
        return <OwnerProfile />;
      default:
        return <OwnerDashboard branch={branch} setBranch={setBranch} openBranchModal={() => setIsBranchModalVisible(true)} />;
    }
  };

  const branchesList = [
    { id: 'All Branches', label: 'All Branches', sub: 'Vizag, Srikakulam, Kakinada' },
    { id: 'Vizag - KVR Showroom', label: 'Vizag - KVR Showroom', sub: 'Kinetic Green, Dynamo, Frankly' },
    { id: 'Vizag - Future Ride', label: 'Vizag - Future Ride', sub: 'Kinetiq, Watts Engineering' },
    { id: 'Srikakulam - KVR Showroom', label: 'Srikakulam - KVR Showroom', sub: 'Kinetic Green, Others' },
    { id: 'Kakinada - KVR Showroom', label: 'Kakinada - KVR Showroom', sub: 'Kinetic Green, Dynamo' }
  ];

  // Nav items inside the drawer
  const drawerMenuItems = [
    {
      title: 'Showroom Bookings',
      route: '/owner/bookings',
      icon: CalendarDays,
      color: '#ea580c',
    },
    {
      title: 'Purchase Orders',
      route: '/owner/purchases',
      icon: ShoppingBag,
      color: '#04a700',
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
      color: '#8b5cf6',
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

        {/* Animated Main Content Container (LIGHT slate grey background!) */}
        <Animated.View style={[styles.mainContentContainer, mainContentAnimatedStyle]}>
          {/* Constant Top Floating Header Bar */}
          <View style={[styles.fixedHeader, { paddingTop: insets.top + 10, height: headerHeight }]}>
            <View style={styles.headerRow}>
              <Pressable 
                onPress={openDrawer}
                style={({ pressed }) => [
                  styles.hamburgerBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }
                ]}
              >
                <HamburgerIcon size={22} color="#04a700" />
              </Pressable>
              
              <Pressable 
                style={styles.locationSelector}
                onPress={() => setIsBranchModalVisible(true)}
              >
                <MapPin size={15} color="#04a700" />
                <ThemedText style={styles.locationText} numberOfLines={1}>
                  {branch.replace(' - KVR Showroom', '').replace(' - Future Ride', '')}
                </ThemedText>
                <ChevronDown size={13} color="#94a3b8" />
              </Pressable>

              <Pressable 
                style={styles.moreButton}
                onPress={() => {
                  setActiveTab('profile');
                  router.push('/owner/profile' as any);
                }}
              >
                <User size={20} color="#94a3b8" />
              </Pressable>
            </View>
          </View>

          {/* Active Screen View */}
          <View style={styles.screenContainer}>
            {renderActiveScreen()}
          </View>

          {/* Interactive Tap-to-Close Dim Overlay */}
          <Animated.View style={[styles.dimOverlay, overlayAnimatedStyle]}>
            <Pressable style={styles.overlayPressable} onPress={closeDrawer} />
          </Animated.View>

          {/* Bottom Navigation Bar */}
          <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10 }]}>

            {/* Tab 1: Home */}
            <Pressable 
              onPress={() => setActiveTab('dashboard')} 
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, activeTab === 'dashboard' && styles.activeIconBg]}>
                <Home 
                  size={22} 
                  color={activeTab === 'dashboard' ? '#04a700' : '#9ca3af'} 
                  fill={activeTab === 'dashboard' ? '#04a700' : 'none'}
                  strokeWidth={1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>
                Home
              </ThemedText>
            </Pressable>

            {/* Tab 2: Inventory */}
            <Pressable 
              onPress={() => setActiveTab('inventory')} 
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, activeTab === 'inventory' && styles.activeIconBg]}>
                <Package 
                  size={22} 
                  color={activeTab === 'inventory' ? '#04a700' : '#9ca3af'} 
                  fill={activeTab === 'inventory' ? '#04a700' : 'none'}
                  strokeWidth={1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'inventory' && styles.activeTabLabel]}>
                Inventory
              </ThemedText>
            </Pressable>

            {/* Tab 3: Sales */}
            <Pressable 
              onPress={() => setActiveTab('sales')} 
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, activeTab === 'sales' && styles.activeIconBg]}>
                <TrendingUp 
                  size={22} 
                  color={activeTab === 'sales' ? '#04a700' : '#9ca3af'} 
                  fill={activeTab === 'sales' ? '#04a700' : 'none'}
                  strokeWidth={1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'sales' && styles.activeTabLabel]}>
                Sales
              </ThemedText>
            </Pressable>

            {/* Tab 4: Team */}
            <Pressable 
              onPress={() => setActiveTab('users')} 
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, activeTab === 'users' && styles.activeIconBg]}>
                <Users 
                  size={22} 
                  color={activeTab === 'users' ? '#04a700' : '#9ca3af'} 
                  fill={activeTab === 'users' ? '#04a700' : 'none'}
                  strokeWidth={1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'users' && styles.activeTabLabel]}>
                Team
              </ThemedText>
            </Pressable>

            {/* Tab 5: Settings */}
            <Pressable 
              onPress={() => setActiveTab('profile')} 
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, activeTab === 'profile' && styles.activeIconBg]}>
                <Settings2 
                  size={22} 
                  color={activeTab === 'profile' ? '#04a700' : '#9ca3af'} 
                  fill={activeTab === 'profile' ? '#04a700' : 'none'}
                  strokeWidth={1.8}
                />
              </View>
              <ThemedText style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
                Settings
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Global Showroom Selector Dropdown Modal Sheet */}
        <Modal
          visible={isBranchModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsBranchModalVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setIsBranchModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Showroom / Branch</ThemedText>
                <Pressable onPress={() => setIsBranchModalVisible(false)}>
                  <X size={20} color="#0f172a" />
                </Pressable>
              </View>

              <FlatList
                data={branchesList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.branchListContainer}
                renderItem={({ item }) => {
                  const isSelected = branch === item.id;
                  return (
                    <Pressable
                      style={[styles.branchListItem, isSelected && styles.branchListItemActive]}
                      onPress={() => {
                        setBranch(item.id);
                        setIsBranchModalVisible(false);
                      }}
                    >
                      <View style={styles.branchListItemLeft}>
                        <View style={[styles.modalPinCircle, { backgroundColor: isSelected ? 'rgba(4, 167, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)' }]}>
                          <MapPin size={16} color={isSelected ? '#04a700' : '#64748b'} />
                        </View>
                        <View>
                          <ThemedText style={[styles.branchListLabel, isSelected && styles.branchListLabelActive]}>
                            {item.label}
                          </ThemedText>
                          <ThemedText style={styles.branchListSub}>{item.sub}</ThemedText>
                        </View>
                      </View>
                      {isSelected && (
                        <Check size={18} color="#04a700" strokeWidth={2.5} />
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          </Pressable>
        </Modal>
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
    backgroundColor: '#0a0e1a', // Obsidian dark background viewport to prevent white flashes!
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0e1a', // Obsidian dark slate background
    zIndex: 100,
    paddingHorizontal: 24,
    paddingBottom: 10,
    justifyContent: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111827', // Premium dark gray
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827', // Premium dark gray
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    maxWidth: 220,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  locationText: {
    color: '#ffffff', // Clean white contrast text
    fontSize: 13,
    fontWeight: 'bold',
  },
  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111827', // Premium dark gray
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff', 
    height: Platform.OS === 'ios' ? 78 : 60,
    paddingTop: 4,
    paddingHorizontal: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
    width: 48,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    borderRadius: 16,
  },
  activeIconBg: {
    backgroundColor: 'rgba(4, 167, 0, 0.08)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af', 
  },
  activeTabLabel: {
    color: '#04a700', 
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '65%',
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  branchListContainer: {
    paddingVertical: 12,
    gap: 10,
    paddingBottom: 30,
  },
  branchListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  branchListItemActive: {
    borderColor: 'rgba(4, 167, 0, 0.25)',
    backgroundColor: 'rgba(4, 167, 0, 0.04)',
  },
  branchListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchListLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  branchListLabelActive: {
    color: '#04a700',
  },
  branchListSub: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
});
