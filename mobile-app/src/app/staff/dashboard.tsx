import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import {
  Boxes, Check, User, ClipboardCheck, ScanLine, ArrowRight, Truck,
} from 'lucide-react-native';

interface Task {
  id: number;
  title: string;
  detail: string;
  done: boolean;
}

export default function StaffDashboard({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isActive]);

  const SEED: Task[] = [
    { id: 1, title: 'Move Kinetic E-Luna VIN-KG-44821', detail: 'Pendurthi Godown → Visakhapatnam Showroom', done: false },
    { id: 2, title: 'Initiate PDI for Watts 100', detail: 'VIN-WT-55120 • client delivery today', done: false },
    { id: 3, title: 'Vehicle washing & charger check', detail: 'Dynamo EV Pro • bay 3', done: false },
    { id: 4, title: 'GRN receive 5x Dynamo units', detail: 'Freight #KG-4019 arriving', done: true },
    { id: 5, title: 'Stage 3 EVs for showroom display', detail: 'Visakhapatnam Showroom floor', done: true },
  ];

  const loadData = async () => {
    setIsLoading(true);
    // Tasks are operational and seeded locally; simulate a quick load.
    setTimeout(() => {
      setTasks((prev) => (prev.length > 0 ? prev : SEED));
      setIsLoading(false);
      setRefreshing(false);
    }, 350);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const activeTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);
  const yardLoad = 82;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#04a700']} tintColor="#04a700" progressViewOffset={insets.top + 40} />}
        >
          <View style={styles.overscrollFill} pointerEvents="none" />

          <View style={[styles.heroCanvas, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topRow}>
              <View style={styles.badgeWrapper}>
                <Boxes size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>YARD OPERATIONS</ThemedText>
              </View>
              <Pressable onPress={() => router.push('/staff/profile' as any)} style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]} hitSlop={8}>
                <User size={18} color="#04a700" />
              </Pressable>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>Godown Yards &</ThemedText>
              <ThemedText style={styles.accentTitle}>Operations Queue.</ThemedText>
            </View>

            <View style={styles.capsuleRow}>
              <View style={styles.capsule}>
                <ThemedText style={styles.capsuleVal}>{activeTasks.length}</ThemedText>
                <ThemedText style={styles.capsuleLbl}>Active Tasks</ThemedText>
              </View>
              <View style={styles.capsule}>
                <ThemedText style={[styles.capsuleVal, { color: '#04a700' }]}>{completedTasks.length}</ThemedText>
                <ThemedText style={styles.capsuleLbl}>Completed</ThemedText>
              </View>
              <View style={styles.capsule}>
                <ThemedText style={[styles.capsuleVal, { color: '#fb923c' }]}>{yardLoad}%</ThemedText>
                <ThemedText style={styles.capsuleLbl}>Yards Load</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Loading task queue...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* Quick links */}
              <View style={styles.quickRow}>
                <Pressable onPress={() => router.push('/staff/godown-scanner' as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                    <ScanLine size={18} color="#2563eb" />
                  </View>
                  <ThemedText style={styles.quickTitle}>VIN Scanner</ThemedText>
                  <ThemedText style={styles.quickDesc}>Track movement</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/staff/handover' as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(4, 167, 0, 0.1)' }]}>
                    <Truck size={18} color="#04a700" />
                  </View>
                  <ThemedText style={styles.quickTitle}>Key Handover</ThemedText>
                  <ThemedText style={styles.quickDesc}>Customer delivery</ThemedText>
                </Pressable>
              </View>

              <View style={styles.feedHeaderRow}>
                <ThemedText style={styles.feedTitle}>My Operations Tasks</ThemedText>
                <ThemedText style={styles.feedCount}>{activeTasks.length} pending</ThemedText>
              </View>

              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => toggleTask(task.id)}
                  style={({ pressed }) => [styles.taskCard, task.done && styles.taskCardDone, pressed && { opacity: 0.9 }]}
                >
                  <View style={styles.taskTextCol}>
                    <ThemedText style={[styles.taskTitle, task.done && styles.taskTitleDone]} numberOfLines={2}>{task.title}</ThemedText>
                    <ThemedText style={styles.taskDetail} numberOfLines={1}>{task.detail}</ThemedText>
                  </View>
                  <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
                    {task.done && <Check size={16} color="#ffffff" strokeWidth={3} />}
                  </View>
                </Pressable>
              ))}

              {activeTasks.length === 0 && (
                <View style={styles.allDoneCard}>
                  <Check size={26} color="#04a700" strokeWidth={3} />
                  <ThemedText style={styles.allDoneText}>All tasks completed. Great work!</ThemedText>
                </View>
              )}

              <Pressable onPress={() => router.push('/staff/pdi-checklist' as any)} style={({ pressed }) => [styles.pdiLink, pressed && { opacity: 0.9 }]}>
                <ClipboardCheck size={16} color="#04a700" />
                <ThemedText style={styles.pdiLinkText}>Open PDI Checklist</ThemedText>
                <ArrowRight size={16} color="#04a700" />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  overscrollFill: { position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' },
  heroCanvas: {
    backgroundColor: '#0a0e1a', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1.5, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, gap: 7,
  },
  badgeText: { color: '#04a700', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  profileBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(4, 167, 0, 0.25)' },
  titleWrapper: { marginTop: 22, marginBottom: 20 },
  mainTitle: { fontSize: 26, lineHeight: 34, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 },
  accentTitle: { fontSize: 30, lineHeight: 38, fontWeight: 'bold', color: '#04a700', letterSpacing: -0.5 },
  capsuleRow: { flexDirection: 'row', gap: 10 },
  capsule: {
    flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999, paddingVertical: 12, alignItems: 'center', gap: 2,
  },
  capsuleVal: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  capsuleLbl: { color: '#94a3b8', fontSize: 9.5, fontWeight: '600' },
  loadingText: { color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' },
  contentSection: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 18, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontSize: 13.5, fontWeight: 'bold', color: '#0f172a' },
  quickDesc: { fontSize: 10.5, color: '#64748b', fontWeight: '600' },
  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  feedTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  feedCount: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  taskCardDone: { backgroundColor: 'rgba(4, 167, 0, 0.04)', borderColor: 'rgba(4, 167, 0, 0.2)' },
  taskTextCol: { flex: 1, gap: 3 },
  taskTitle: { fontSize: 14.5, fontWeight: 'bold', color: '#0f172a', lineHeight: 19 },
  taskTitleDone: { color: '#64748b', textDecorationLine: 'line-through' },
  taskDetail: { fontSize: 11.5, color: '#64748b', fontWeight: '600' },
  checkbox: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#cbd5e1',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
  },
  checkboxDone: { backgroundColor: '#04a700', borderColor: '#04a700' },
  allDoneCard: {
    backgroundColor: 'rgba(4, 167, 0, 0.06)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.2)',
    paddingVertical: 28, alignItems: 'center', gap: 10,
  },
  allDoneText: { fontSize: 13, color: '#04a700', fontWeight: 'bold' },
  pdiLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(4, 167, 0, 0.08)', borderRadius: 999, paddingVertical: 14, minHeight: 48,
    borderWidth: 1, borderColor: 'rgba(4, 167, 0, 0.25)',
  },
  pdiLinkText: { fontSize: 13, fontWeight: 'bold', color: '#04a700' },
});
