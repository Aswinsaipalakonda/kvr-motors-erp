import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Home, Landmark, Package, UserCheck, TrendingUp } from 'lucide-react-native';

// Import Owner Screens
import OwnerDashboard from './dashboard';
import OwnerBranches from './branches';
import OwnerInventory from './inventory';
import OwnerLeads from './leads';
import OwnerLedger from './ledger';

type ScreenTab = 'dashboard' | 'branches' | 'inventory' | 'leads' | 'ledger';

const TAB_KEYS: ScreenTab[] = ['dashboard', 'branches', 'inventory', 'leads', 'ledger'];

export default function OwnerLayout() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('dashboard');
  const [branch, setBranch] = useState('Vizag Showroom');
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  // Tab indicator sliding animation setup
  const tabWidth = screenWidth / 5;
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
      case 'ledger':
        return <OwnerLedger />;
      default:
        return <OwnerDashboard branch={branch} setBranch={setBranch} />;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Active Screen Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Dark Glassmorphic Bottom Navigation Bar matching the mockup */}
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
              size={22} 
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
              size={22} 
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
              size={22} 
              color={activeTab === 'inventory' ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
              strokeWidth={activeTab === 'inventory' ? 2.2 : 1.8}
            />
          </View>
          <ThemedText style={[styles.tabLabel, activeTab === 'inventory' && styles.activeTabLabel]}>
            Inventory
          </ThemedText>
        </Pressable>

        {/* Tab 4: Leads */}
        <Pressable 
          onPress={() => setActiveTab('leads')} 
          style={styles.tabButton}
        >
          <View style={styles.iconContainer}>
            <UserCheck 
              size={22} 
              color={activeTab === 'leads' ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
              strokeWidth={activeTab === 'leads' ? 2.2 : 1.8}
            />
          </View>
          <ThemedText style={[styles.tabLabel, activeTab === 'leads' && styles.activeTabLabel]}>
            Leads
          </ThemedText>
        </Pressable>

        {/* Tab 5: Ledger */}
        <Pressable 
          onPress={() => setActiveTab('ledger')} 
          style={styles.tabButton}
        >
          <View style={styles.iconContainer}>
            <TrendingUp 
              size={22} 
              color={activeTab === 'ledger' ? '#04a700' : 'rgba(255, 255, 255, 0.4)'} 
              strokeWidth={activeTab === 'ledger' ? 2.2 : 1.8}
            />
          </View>
          <ThemedText style={[styles.tabLabel, activeTab === 'ledger' && styles.activeTabLabel]}>
            Ledger
          </ThemedText>
        </Pressable>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16', // Obsidian/dark slate header container
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
    backgroundColor: '#04a700', // Brand green active line indicator
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  activeTopGlow: {
    height: 24,
    width: 48,
    backgroundColor: 'rgba(4, 167, 0, 0.15)', // Glowing green reflect diffusing downwards
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
    color: 'rgba(255, 255, 255, 0.45)', // Translucent white for inactive tabs
  },
  activeTabLabel: {
    color: '#04a700', // Unified brand green label for active tab
    fontWeight: 'bold',
  },
});

