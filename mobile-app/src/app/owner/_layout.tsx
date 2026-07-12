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
  MapPin, ChevronDown, MoreVertical, Check, User, Building,
  FileText, Car, Battery
} from 'lucide-react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

import OwnerDashboard from './dashboard';
import OwnerInventory from './inventory';
import OwnerSales from './sales';
import OwnerUsers from './users';
import OwnerBookings from './bookings';

// Define Screen Tabs - 5 tabs!
type ScreenTab = 'dashboard' | 'inventory' | 'sales' | 'users' | 'bookings';

const TAB_KEYS: ScreenTab[] = ['dashboard', 'inventory', 'sales', 'users', 'bookings'];

const TABS_CONFIG = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'sales', label: 'Sales', icon: TrendingUp },
  { key: 'users', label: 'Team', icon: Users },
  { key: 'bookings', label: 'Bookings', icon: CalendarDays },
] as const;

import { DrawerContext } from '@/context/DrawerContext';

// Branded premium hardware-accelerated micro-animated bottom tab button
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
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.05 : 1, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(isActive ? 1 : 0.65, { damping: 15, stiffness: 200 });
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
          color={isActive ? '#04a700' : '#94a3b8'} 
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

export default function OwnerLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const [branch, setBranch] = useState('All Branches');
  const [dbBranches, setDbBranches] = useState<any[]>([]);

  useEffect(() => {
    api.get('/branches/')
      .then(res => {
        setDbBranches(res.data || []);
      })
      .catch(err => {
        console.warn("Failed to load branches in owner layout:", err);
      });
  }, []);

  const [isDrawerOpenState, setIsDrawerOpenState] = useState(false);
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);

  // Restrict branch selector to assigned branch for staff/telecallers/sales/supervisors
  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'admin' && user.branch) {
      setBranch(user.branch);
    }
  }, [user]);
  
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const drawerWidth = screenWidth * 0.78;
  const headerHeight = insets.top + 54;

  const visibleTabs = React.useMemo(() => {
    if (!user) return [];
    const role = user.role;
    if (role === 'owner' || role === 'admin') {
      return TABS_CONFIG;
    } else if (role === 'supervisor') {
      // Home, Inventory, Sales, Bookings
      return TABS_CONFIG.filter(t => t.key !== 'users');
    } else {
      // sales, telecaller, etc: Home, Bookings
      return TABS_CONFIG.filter(t => t.key === 'dashboard' || t.key === 'bookings');
    }
  }, [user]);

  // Sync pathname with active tab
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    let newTab: ScreenTab = 'dashboard';
    if (lastSegment && TAB_KEYS.includes(lastSegment as any)) {
      newTab = lastSegment as ScreenTab;
    }
    // Fallback if the tab is not allowed for the current role
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.key === newTab)) {
      newTab = visibleTabs[0].key;
    }
    setActiveTab(newTab);
  }, [pathname, visibleTabs]);

  const isSubRoute = pathname !== '/owner' && pathname !== '/owner/' && !TAB_KEYS.some(tab => pathname === `/owner/${tab}` || pathname === `/owner/${tab}/`);

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

  // Tab indicator sliding animation - dynamically stretched based on the number of tabs
  const tabWidth = screenWidth / (visibleTabs.length || 1);
  const activeIndexShared = useSharedValue(0);

  useEffect(() => {
    const newIdx = visibleTabs.findIndex(t => t.key === activeTab);
    if (newIdx !== -1) {
      activeIndexShared.value = withSpring(newIdx, {
        damping: 18,
        stiffness: 140,
        mass: 0.8,
      });
    }
  }, [activeTab, visibleTabs]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const width = 48; // indicator width
    return {
      width: width,
      transform: [
        { translateX: activeIndexShared.value * tabWidth + (tabWidth - width) / 2 }
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
    if (isSubRoute) {
      return {
        transform: [
          { perspective: 1000 },
          { translateX: 0 },
          { scale: 1 },
          { rotateY: '0deg' }
        ],
        borderRadius: 0,
      };
    }

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
      case 'inventory':
        return <OwnerInventory branch={branch} />;
      case 'sales':
        return <OwnerSales />;
      case 'users':
        return <OwnerUsers />;
      case 'bookings':
        return <OwnerBookings />;
      default:
        return <OwnerDashboard branch={branch} setBranch={setBranch} />;
    }
  };

  const branchesList = React.useMemo(() => {
    const list = [
      { id: 'All Branches', label: 'All Branches', sub: dbBranches.length > 0 ? dbBranches.map(b => b.name.replace('KVR Motors - ', '')).join(', ') : 'Visakhapatnam, Srikakulam, Kakinada' }
    ];
    dbBranches.forEach(b => {
      const branchCity = b.name.replace('KVR Motors - ', '');
      if (b.showrooms && b.showrooms.length > 0) {
        b.showrooms.forEach((s: any) => {
          let cleanShowroomName = s.name;
          const suffixIndex = cleanShowroomName.indexOf(' - ');
          if (suffixIndex !== -1) {
            cleanShowroomName = cleanShowroomName.substring(0, suffixIndex);
          }
          cleanShowroomName = cleanShowroomName.replace(' Showroom', '');
          list.push({
            id: `${branchCity} - ${cleanShowroomName}`,
            label: `${branchCity} - ${cleanShowroomName}`,
            sub: cleanShowroomName === 'Future Ride' ? 'Kinetiq, Watts Engineering' : 'Kinetic Green, Dynamo, Frankly'
          });
        });
      }
    });
    return list;
  }, [dbBranches]);


  // Nav items inside the drawer
  const drawerMenuItems = [
    {
      title: 'Mela Campaign',
      route: '/owner/mela',
      icon: Sparkles,
      color: '#04a700',
    },
    {
      title: 'Vehicle Catalog',
      route: '/owner/vehicles',
      icon: Car,
      color: '#2563eb',
    },
    {
      title: 'Battery Stock',
      route: '/owner/batteries',
      icon: Battery,
      color: '#ea580c',
    },
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
    {
      title: 'Branch Mappings',
      route: '/owner/branches',
      icon: Building,
      color: '#04a700',
    },
    {
      title: 'Verify Attendance',
      route: '/owner/verify-attendance',
      icon: Shield,
      color: '#04a700',
    },
    {
      title: 'Activity Logs',
      route: '/owner/activity-logs',
      icon: FileText,
      color: '#10b981',
    },
  ];

  const filteredDrawerMenuItems = React.useMemo(() => {
    if (!user) return [];
    const role = user.role;
    if (role === 'owner' || role === 'admin') {
      return drawerMenuItems;
    } else if (role === 'supervisor') {
      return drawerMenuItems.filter(item => 
        ['Mela Campaign', 'Vehicle Catalog', 'Battery Stock', 'Showroom Bookings', 'Sales Overview', 'Verify Attendance'].includes(item.title)
      );
    } else if (role === 'sales' || role === 'sales_executive') {
      return drawerMenuItems.filter(item => 
        ['Mela Campaign', 'Showroom Bookings'].includes(item.title)
      );
    } else {
      // telecaller etc
      return drawerMenuItems.filter(item => 
        ['Showroom Bookings'].includes(item.title)
      );
    }
  }, [user]);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen: isDrawerOpenState }}>
      <ThemedView style={styles.container}>
        {/* Animated Sliding Sidebar Drawer (Premium custom double-deck style matching second image) */}
        {!isSubRoute && (
          <Animated.View style={[styles.drawerContainer, { width: drawerWidth }, drawerAnimatedStyle]}>
            {/* Top Deck: Premium Obsidian-Slate Header Container */}
            <View style={[styles.drawerPremiumHeader, { paddingTop: insets.top + 16 }]}>
              {/* Header Top Row */}
              <View style={styles.drawerHeaderTopRow}>
                <ThemedText style={styles.drawerHeaderTitle}>Profile</ThemedText>
                <Pressable onPress={closeDrawer} style={styles.drawerCloseCircle}>
                  <X size={16} color="#ffffff" strokeWidth={2.8} />
                </Pressable>
              </View>

              {/* Center Profile Deck */}
              <View style={styles.profileDeckCenter}>
                <View style={styles.profileAvatarContainer}>
                  <Image 
                    source={require('@/assets/images/logo.png')} 
                    style={styles.profileAvatarImage} 
                    resizeMode="contain"
                  />
                  {/* Floating Shield Badge */}
                  <View style={styles.profileAvatarBadge}>
                    <Shield size={11} color="#ffffff" strokeWidth={2.8} />
                  </View>
                </View>
                <ThemedText style={styles.profileDeckName}>{user?.full_name || 'Ravi Varma'}</ThemedText>
                <ThemedText style={styles.profileDeckRole}>
                  {user?.role?.toUpperCase() || 'OWNER'} • Visakhapatnam HQ
                </ThemedText>
              </View>
            </View>

            {/* Bottom Deck: White Operations Sheet */}
            <View style={styles.drawerWhiteSheet}>
              <ThemedText style={styles.sheetSectionTitle}>Account Overview</ThemedText>
              
              {/* Scrollable Navigation Items */}
              <ScrollView 
                style={styles.sheetScrollView} 
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredDrawerMenuItems.map((item, idx) => {
                  const IconComp = item.icon;
                  // Soft pastel colors based on menu item color tint
                  const pastelBg = item.color === '#ea580c' ? '#fff7ed' : 
                                   item.color === '#04a700' ? '#f0fdf4' : 
                                   item.color === '#2563eb' ? '#eff6ff' : 
                                   item.color === '#8b5cf6' ? '#faf5ff' : 
                                   '#fdf2f8';
                  return (
                    <Pressable 
                      key={idx}
                      onPress={() => {
                        closeDrawer();
                        if (item.route === '/owner/sales') {
                          setActiveTab('sales');
                        } else if (item.route === '/owner/users') {
                          setActiveTab('users');
                        } else if (item.route === '/owner/bookings') {
                          setActiveTab('bookings');
                        } else {
                          router.replace(item.route as any);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.sheetMenuItem,
                        pressed && styles.sheetMenuItemPressed
                      ]}
                    >
                      <View style={[styles.sheetMenuIconFrame, { backgroundColor: pastelBg }]}>
                        <IconComp size={18} color={item.color} strokeWidth={2.2} />
                      </View>
                      <ThemedText style={styles.sheetMenuItemText}>{item.title}</ThemedText>
                      <ChevronRight size={16} color="#cbd5e1" strokeWidth={2} />
                    </Pressable>
                  );
                })}

                {/* In-list Integrated Premium Logout Option */}
                <Pressable 
                  onPress={handleLogout} 
                  style={({ pressed }) => [
                    styles.sheetMenuItem,
                    pressed && styles.sheetMenuItemPressed,
                    { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 }
                  ]}
                >
                  <View style={[styles.sheetMenuIconFrame, { backgroundColor: '#fef2f2' }]}>
                    <LogOut size={18} color="#ef4444" strokeWidth={2.2} />
                  </View>
                  <ThemedText style={[styles.sheetMenuItemText, { color: '#ef4444', fontWeight: '700' }]}>
                    Log Out Session
                  </ThemedText>
                  <ChevronRight size={16} color="#fca5a5" strokeWidth={2} />
                </Pressable>
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Animated Main Content Container (LIGHT slate grey background!) */}
        <Animated.View style={[
          styles.mainContentContainer,
          mainContentAnimatedStyle
        ]}>
          {/* Constant Top Floating Header Bar */}
          {!isSubRoute && (
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
                  onPress={() => {
                    if (user?.role === 'owner' || user?.role === 'admin') {
                      setIsBranchModalVisible(true);
                    }
                  }}
                >
                  <MapPin size={15} color="#04a700" />
                  <ThemedText style={styles.locationText} numberOfLines={1}>
                    {branch.replace(' - KVR Showroom', '').replace(' - Future Ride', '').replace('KVR Motors - ', '')}
                  </ThemedText>
                  {(user?.role === 'owner' || user?.role === 'admin') && (
                    <ChevronDown size={13} color="#94a3b8" />
                  )}
                </Pressable>

                <Pressable 
                  onPress={() => router.push('/owner/profile' as any)} 
                  style={({ pressed }) => [
                    styles.profileHeaderBtn,
                    pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }
                  ]}
                >
                  <User size={18} color="#04a700" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Active Screen View with Persistent Mounting (Instant Tab Toggles!) */}
          {!isSubRoute && (
            <View style={styles.screenContainer}>
              <View style={{ flex: 1, display: activeTab === 'dashboard' ? 'flex' : 'none' }}>
                <OwnerDashboard branch={branch} setBranch={setBranch} onOpenBranchSelector={() => setIsBranchModalVisible(true)} isActive={activeTab === 'dashboard'} />
              </View>
              <View style={{ flex: 1, display: activeTab === 'inventory' ? 'flex' : 'none' }}>
                <OwnerInventory branch={branch} isActive={activeTab === 'inventory'} onBack={() => setActiveTab('dashboard')} />
              </View>
              <View style={{ flex: 1, display: activeTab === 'sales' ? 'flex' : 'none' }}>
                <OwnerSales isActive={activeTab === 'sales'} onBack={() => setActiveTab('dashboard')} />
              </View>
              <View style={{ flex: 1, display: activeTab === 'users' ? 'flex' : 'none' }}>
                <OwnerUsers isActive={activeTab === 'users'} onBack={() => setActiveTab('dashboard')} />
              </View>
              <View style={{ flex: 1, display: activeTab === 'bookings' ? 'flex' : 'none' }}>
                <OwnerBookings isActive={activeTab === 'bookings'} onBack={() => setActiveTab('dashboard')} />
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

          {/* Interactive Tap-to-Close Dim Overlay */}
          {!isSubRoute && (
            <Animated.View style={[styles.dimOverlay, overlayAnimatedStyle]}>
              <Pressable style={styles.overlayPressable} onPress={closeDrawer} />
            </Animated.View>
          )}

          {/* Bottom Navigation Bar */}
          {!isSubRoute && (
            <View style={[styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 6 }]}>
              {/* Animated Sliding Highlight Line at the top of the tab bar */}
              <Animated.View style={[styles.activeIndicatorWrapper, animatedIndicatorStyle]}>
                <View style={styles.activeTopLine} />
              </Animated.View>
              
              {visibleTabs.map((tab) => (
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
    backgroundColor: '#ffffff', // Clean white background for the bottom sheet deck
    borderRightWidth: 1.5,
    borderRightColor: '#f1f5f9',
    zIndex: 10,
  },
  drawerPremiumHeader: {
    backgroundColor: '#0a0e1a', // Premium deep obsidian slate/black
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: 'relative',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  drawerHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  drawerCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  profileDeckCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    zIndex: 2,
  },
  profileAvatarContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Premium platinum/silver border
    backgroundColor: '#ffffff', // Solid white to elegantly frame the white logo background!
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10, // Generous padding to frame the logo as a seal
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  profileAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ea580c', // Bright orange floating badge
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileDeckName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  profileDeckRole: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#cbd5e1', // Elegant silver/slate grey role text
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  drawerWhiteSheet: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -24, // Negative margin for overlap effect
    paddingTop: 8,
  },
  sheetSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  sheetScrollView: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 6,
  },
  sheetMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    gap: 14,
  },
  sheetMenuItemPressed: {
    backgroundColor: '#f8fafc',
  },
  sheetMenuIconFrame: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetMenuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc', // LIGHT background viewport!
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
  profileHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111827', // Premium dark gray
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(4, 167, 0, 0.25)', // Brand accent outline
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff', 
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
    marginBottom: 2,
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
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94a3b8', 
  },
  activeTabLabel: {
    color: '#04a700', 
    fontWeight: '700',
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
