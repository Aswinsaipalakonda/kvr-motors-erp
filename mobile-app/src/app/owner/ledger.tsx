import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator,
  BackHandler, Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowLeft, ShieldCheck, Plus, X,
  CheckCircle, Search, IndianRupee, RotateCcw, Landmark, ChevronDown,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

type FlowType = 'inflow' | 'outflow';

interface Transaction {
  id: number;
  ref: string;
  type: FlowType;
  category: string;
  amount: number;
  date: string;
  details: string;
  account: string;
  gst: number;
  voided?: boolean;
}

type TxFilter = 'all' | 'inflow' | 'outflow';

interface TxForm {
  ref: string;
  type: FlowType;
  details: string;
  amount: string;
  account: string;
  gst: string;
}

interface FormErrors {
  details?: string;
  amount?: string;
  account?: string;
}

const BANK_ACCOUNTS = ['KVR SBI Showroom A/C', 'KVR HDFC Current A/C', 'KVR Cash Drawer', 'KVR ICICI Capital A/C'];
const GST_BRACKETS = ['0', '5', '12', '18', '28'];

const makeRef = () => `TX-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

const emptyForm = (): TxForm => ({
  ref: makeRef(),
  type: 'inflow',
  details: '',
  amount: '',
  account: BANK_ACCOUNTS[0],
  gst: '18',
});

export default function OwnerLedger({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TxForm>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branches state
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  useEffect(() => {
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isActive]);

  const handleBack = useCallback((): boolean => {
    if (isModalOpen) {
      setIsModalOpen(false);
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    // @ts-ignore - canGoBack exists at runtime
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return true;
    }
    router.replace('/owner' as any);
    return true;
  }, [isModalOpen, onBack, router]);

  useEffect(() => {
    if (isActive === false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handleBack());
    return () => sub.remove();
  }, [isActive, handleBack]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const FALLBACK_TX: Transaction[] = [
    { id: 1, ref: 'TX-2026-0410', type: 'inflow', category: 'Sales Income', amount: 112000, date: '12 May 2026', details: 'EV sale invoice INV-2026-0410', account: 'KVR SBI Showroom A/C', gst: 18 },
    { id: 2, ref: 'TX-2026-0388', type: 'outflow', category: 'Purchase Expense', amount: 645000, date: '10 May 2026', details: 'Factory PO - 5x Dynamo EV Pro', account: 'KVR HDFC Current A/C', gst: 18 },
    { id: 3, ref: 'TX-2026-0354', type: 'outflow', category: 'Salary Expense', amount: 86000, date: '01 May 2026', details: 'Showroom staff payroll', account: 'KVR SBI Showroom A/C', gst: 0 },
    { id: 4, ref: 'TX-2026-0331', type: 'inflow', category: 'Sales Income', amount: 98000, date: '28 Apr 2026', details: 'EV sale invoice INV-2026-0331', account: 'KVR ICICI Capital A/C', gst: 18 },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ledgerRes, branchesRes] = await Promise.all([
        api.get('/ledger-entries/'),
        api.get('/branches/'),
      ]);
      const mapped: Transaction[] = (ledgerRes.data || []).map((entry: any, idx: number) => {
        const income = parseFloat(entry.income || 0);
        const expense = parseFloat(entry.expense || 0);
        const isInc = income > 0;
        return {
          id: entry.id ?? idx + 1,
          ref: entry.transaction_id || `TX-${entry.id || idx}`,
          type: isInc ? 'inflow' : 'outflow',
          category: entry.ledger_type_display || entry.ledger_type || (isInc ? 'Income' : 'Expense'),
          amount: isInc ? income : expense,
          date: formatDate(entry.created_at || entry.date),
          details: entry.detail || 'Journal Ledger Entry',
          account: entry.payment_mode || 'KVR SBI Showroom A/C',
          gst: 18,
        };
      });
      setTransactions(mapped.length > 0 ? mapped : FALLBACK_TX);
      
      const loadedBranches = branchesRes.data || [];
      setBranches(loadedBranches);
      if (loadedBranches.length > 0) {
        setSelectedBranchId(String(loadedBranches[0].id));
      }
    } catch (e) {
      console.error('Failed to load ledger entries or branches:', e);
      setTransactions((prev) => (prev.length > 0 ? prev : FALLBACK_TX));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- CREATE ----------
  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const updateField = (field: keyof TxForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.details.trim()) next.details = 'Description is required';
    else if (form.details.trim().length < 3) next.details = 'Enter at least 3 characters';
    const amt = parseFloat(form.amount);
    if (!form.amount.trim()) next.amount = 'Amount is required';
    else if (isNaN(amt) || amt <= 0) next.amount = 'Enter a valid amount greater than 0';
    if (!form.account.trim()) next.account = 'Select a bank account';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!selectedBranchId) {
      Alert.alert('Error', 'Please select a branch.');
      return;
    }
    setIsSubmitting(true);
    const amt = parseFloat(form.amount);
    const resolvedType = form.type === 'inflow' ? 'sales_income' : 'operational_expense';
    const transactionId = `TXN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const payload = {
      transaction_id: transactionId,
      ledger_type: resolvedType,
      branch: parseInt(selectedBranchId, 10),
      detail: form.details.trim(),
      income: form.type === 'inflow' ? amt : 0,
      expense: form.type === 'outflow' ? amt : 0,
      payment_mode: form.account,
    };

    try {
      const res = await api.post('/ledger-entries/', payload);
      const newTx: Transaction = {
        id: res.data.id || Date.now(),
        ref: res.data.transaction_id || transactionId,
        type: form.type,
        category: res.data.ledger_type_display || (form.type === 'inflow' ? 'Sales Income' : 'Operational Expense'),
        amount: amt,
        date: formatDate(res.data.created_at || new Date().toISOString()),
        details: form.details.trim(),
        account: form.account,
        gst: parseFloat(form.gst) || 0,
      };
      setTransactions((prev) => [newTx, ...prev]);
      setIsModalOpen(false);
      Alert.alert('Transaction Registered', `${newTx.ref} posted to the journal.`);
    } catch (err: any) {
      console.error('Failed to register ledger transaction:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      Alert.alert('Error', `Failed to register transaction: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- DELETE / VOID via reversal ----------
  const handleVoid = (tx: Transaction) => {
    if (tx.voided) return;
    Alert.alert(
      'Void / Revert Entry',
      `Post a reversal journal for ${tx.ref}? This preserves double-entry bookkeeping by recording a matching opposite entry.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post Reversal',
          style: 'destructive',
          onPress: async () => {
            const resolvedType = tx.type === 'inflow' ? 'operational_expense' : 'sales_income';
            const reversalId = `${tx.ref}-REV`;
            const origBranch = branches.length > 0 ? branches[0].id : 1;

            const payload = {
              transaction_id: reversalId,
              ledger_type: resolvedType,
              branch: origBranch,
              detail: `Reversal of ${tx.ref} — ${tx.details}`,
              income: tx.type === 'inflow' ? 0 : tx.amount,
              expense: tx.type === 'outflow' ? 0 : tx.amount,
              payment_mode: tx.account,
            };

            try {
              const res = await api.post('/ledger-entries/', payload);
              const reversal: Transaction = {
                id: res.data.id || Date.now(),
                ref: res.data.transaction_id || reversalId,
                type: tx.type === 'inflow' ? 'outflow' : 'inflow',
                category: res.data.ledger_type_display || 'Reversal Entry',
                amount: tx.amount,
                date: formatDate(res.data.created_at || new Date().toISOString()),
                details: payload.detail,
                account: tx.account,
                gst: tx.gst,
              };
              setTransactions((prev) => [reversal, ...prev.map((t) => (t.id === tx.id ? { ...t, voided: true } : t))]);
              Alert.alert('Reversal Posted', `Reversal transaction ${reversalId} successfully logged.`);
            } catch (err: any) {
              console.error('Failed to post reversal ledger:', err);
              const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
              Alert.alert('Error', `Failed to post reversal: ${errMsg}`);
            }
          },
        },
      ]
    );
  };

  // ---------- Derived ----------
  const activeTx = transactions.filter((t) => !t.voided);
  const totalInflow = activeTx.filter((t) => t.type === 'inflow').reduce((s, t) => s + t.amount, 0);
  const totalOutflow = activeTx.filter((t) => t.type === 'outflow').reduce((s, t) => s + t.amount, 0);
  const netCapital = totalInflow - totalOutflow;

  const outputGst = activeTx.filter((t) => t.type === 'inflow').reduce((s, t) => s + (t.amount * t.gst) / (100 + t.gst), 0);
  const inputCredit = activeTx.filter((t) => t.type === 'outflow').reduce((s, t) => s + (t.amount * t.gst) / (100 + t.gst), 0) * 0.7;
  const netGstDue = Math.max(0, outputGst - inputCredit);

  const fmt = (val: number) => (val >= 100000 ? `₹ ${(val / 100000).toFixed(2)}L` : `₹ ${val.toLocaleString('en-IN')}`);
  const fmtSigned = (val: number) =>
    val >= 0 ? fmt(val) : `-${fmt(Math.abs(val))}`;

  const filterPills: { key: TxFilter; label: string }[] = [
    { key: 'all', label: 'All Entries' },
    { key: 'inflow', label: 'Credits' },
    { key: 'outflow', label: 'Debits' },
  ];

  const filteredTx = transactions.filter((t) => {
    const matchesFilter = txFilter === 'all' ? true : t.type === txFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q
      ? t.ref.toLowerCase().includes(q) ||
        t.details.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
      : true;
    return matchesFilter && matchesSearch;
  });

  const contentPaddingBottom = insets.bottom + 36;

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#04a700']} tintColor="#04a700" progressViewOffset={insets.top + 40} />
          }
        >
          {/* Overscroll bounce fix */}
          <View style={styles.overscrollFill} pointerEvents="none" />

          {/* Obsidian Hero */}
          <View style={[styles.heroCanvas, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topRow}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back to home"
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
                hitSlop={8}
              >
                <ArrowLeft size={20} color="#cbd5e1" />
              </Pressable>
              <View style={styles.badgeWrapper}>
                <ShieldCheck size={12} color="#04a700" />
                <ThemedText style={styles.badgeText}>CAPITAL AUDIT VAULT</ThemedText>
              </View>
            </View>

            <View style={styles.titleWrapper}>
              <ThemedText style={styles.mainTitle}>General Ledger &</ThemedText>
              <ThemedText style={styles.accentTitle}>Auto-Journal Vault.</ThemedText>
            </View>

            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <View style={styles.metricLabelRow}>
                  <ArrowDownLeft size={11} color="#04a700" />
                  <ThemedText style={styles.qLbl}>INFLOW</ThemedText>
                </View>
                <ThemedText style={styles.qVal}>{fmt(totalInflow)}</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <View style={styles.metricLabelRow}>
                  <ArrowUpRight size={11} color="#ea580c" />
                  <ThemedText style={styles.qLbl}>OUTFLOW</ThemedText>
                </View>
                <ThemedText style={styles.qVal}>{fmt(totalOutflow)}</ThemedText>
              </View>
              <View style={styles.qDivider} />
              <View style={styles.quickMetricBox}>
                <View style={styles.metricLabelRow}>
                  <Wallet size={11} color="#2563eb" />
                  <ThemedText style={styles.qLbl}>NET</ThemedText>
                </View>
                <ThemedText style={[styles.qVal, { color: netCapital >= 0 ? '#ffffff' : '#f87171' }]}>{fmtSigned(netCapital)}</ThemedText>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 70, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#04a700" />
              <ThemedText style={styles.loadingText}>Auditing transaction channels...</ThemedText>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {/* GST Liability Calculator */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleRow}>
                    <Wallet size={15} color="#04a700" />
                    <ThemedText style={styles.cardTitle}>GST Liability Calculator</ThemedText>
                  </View>
                </View>
                <View style={styles.gstGrid}>
                  <View style={styles.gstCell}>
                    <ThemedText style={styles.gstCellLabel}>OUTPUT GST</ThemedText>
                    <ThemedText style={styles.gstCellVal}>₹ {Math.round(outputGst).toLocaleString('en-IN')}</ThemedText>
                  </View>
                  <View style={styles.gstDivider} />
                  <View style={styles.gstCell}>
                    <ThemedText style={styles.gstCellLabel}>INPUT CREDIT</ThemedText>
                    <ThemedText style={styles.gstCellVal}>₹ {Math.round(inputCredit).toLocaleString('en-IN')}</ThemedText>
                  </View>
                  <View style={styles.gstDivider} />
                  <View style={styles.gstCell}>
                    <ThemedText style={styles.gstCellLabel}>NET GST DUE</ThemedText>
                    <ThemedText style={[styles.gstCellVal, { color: '#ea580c' }]}>₹ {Math.round(netGstDue).toLocaleString('en-IN')}</ThemedText>
                  </View>
                </View>
              </View>

              {/* Register CTA */}
              <Pressable
                onPress={openCreate}
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.6} />
                <ThemedText style={styles.createBtnText}>REGISTER TRANSACTION</ThemedText>
              </Pressable>

              {/* Search */}
              <View style={styles.searchContainer}>
                <Search size={17} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search ref, detail, account..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery !== '' && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <X size={16} color="#94a3b8" />
                  </Pressable>
                )}
              </View>

              {/* Filter pills */}
              <View style={styles.filterRow}>
                {filterPills.map((pill) => {
                  const active = txFilter === pill.key;
                  return (
                    <Pressable
                      key={pill.key}
                      onPress={() => setTxFilter(pill.key)}
                      style={({ pressed }) => [styles.filterPill, active && styles.filterPillActive, pressed && { opacity: 0.85 }]}
                    >
                      <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>{pill.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Journal Feed */}
              <View style={styles.feedHeaderRow}>
                <ThemedText style={styles.feedTitle}>Ledger Journal Feed</ThemedText>
                <ThemedText style={styles.feedCount}>{filteredTx.length} entries</ThemedText>
              </View>

              {filteredTx.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Landmark size={30} color="#cbd5e1" />
                  <ThemedText style={styles.emptyText}>
                    {transactions.length === 0 ? 'No journal entries recorded' : 'No entries match your filters'}
                  </ThemedText>
                  <Pressable onPress={openCreate} style={styles.emptyCreateBtn}>
                    <ThemedText style={styles.emptyCreateText}>+ Register a transaction</ThemedText>
                  </Pressable>
                </View>
              ) : (
                filteredTx.map((tx) => {
                  const isInc = tx.type === 'inflow';
                  const accent = isInc ? '#04a700' : '#ea580c';
                  return (
                    <View key={tx.id} style={[styles.txCard, tx.voided && styles.txCardVoided]}>
                      <View style={styles.txLeft}>
                        <View style={[styles.txIcon, { backgroundColor: `${accent}14` }]}>
                          {isInc ? <ArrowDownLeft size={16} color={accent} /> : <ArrowUpRight size={16} color={accent} />}
                        </View>
                        <View style={styles.txMeta}>
                          <View style={styles.txTitleRow}>
                            <ThemedText style={styles.txCategory} numberOfLines={1}>{tx.category}</ThemedText>
                            {tx.voided && (
                              <View style={styles.voidTag}>
                                <ThemedText style={styles.voidTagText}>VOIDED</ThemedText>
                              </View>
                            )}
                          </View>
                          <ThemedText style={styles.txDesc} numberOfLines={1}>{tx.details}</ThemedText>
                          <ThemedText style={styles.txSub} numberOfLines={1}>{tx.date} • {tx.ref}</ThemedText>
                          <View style={styles.txAccountRow}>
                            <Landmark size={10} color="#94a3b8" />
                            <ThemedText style={styles.txAccount} numberOfLines={1}>{tx.account}</ThemedText>
                          </View>
                        </View>
                      </View>
                      <View style={styles.txRight}>
                        <View style={[styles.creditDebitPill, { backgroundColor: `${accent}14` }]}>
                          <ThemedText style={[styles.creditDebitText, { color: accent }]}>{isInc ? 'CREDIT' : 'DEBIT'}</ThemedText>
                        </View>
                        <ThemedText style={[styles.txValue, { color: accent, textDecorationLine: tx.voided ? 'line-through' : 'none' }]}>
                          {isInc ? '+' : '-'}₹ {tx.amount.toLocaleString('en-IN')}
                        </ThemedText>
                        {!tx.voided && tx.category !== 'Reversal Entry' && (
                          <Pressable onPress={() => handleVoid(tx)} style={({ pressed }) => [styles.voidBtn, pressed && { opacity: 0.7 }]} hitSlop={4}>
                            <RotateCcw size={11} color="#d71d22" />
                            <ThemedText style={styles.voidBtnText}>Void</ThemedText>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Register Transaction Modal */}
        <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconWrap}>
                    <Wallet size={18} color="#04a700" />
                  </View>
                  <View>
                    <ThemedText style={styles.modalTitle}>Register Transaction</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>Post a double-entry journal record</ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn} hitSlop={8}>
                  <X size={18} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalFormScroll}
                contentContainerStyle={styles.modalFormContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Ref (read-only) */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Transaction Reference</ThemedText>
                  <View style={styles.readonlyChip}>
                    <ThemedText style={styles.readonlyChipText}>{form.ref}</ThemedText>
                  </View>
                </View>

                {/* Inflow / Outflow type */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Entry Type</ThemedText>
                  <View style={styles.typeToggleRow}>
                    <Pressable
                      onPress={() => updateField('type', 'inflow')}
                      style={[styles.typeToggle, form.type === 'inflow' && styles.typeToggleInflow]}
                    >
                      <ArrowDownLeft size={14} color={form.type === 'inflow' ? '#04a700' : '#94a3b8'} />
                      <ThemedText style={[styles.typeToggleText, form.type === 'inflow' && { color: '#04a700' }]}>Inflow (Credit)</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => updateField('type', 'outflow')}
                      style={[styles.typeToggle, form.type === 'outflow' && styles.typeToggleOutflow]}
                    >
                      <ArrowUpRight size={14} color={form.type === 'outflow' ? '#ea580c' : '#94a3b8'} />
                      <ThemedText style={[styles.typeToggleText, form.type === 'outflow' && { color: '#ea580c' }]}>Outflow (Debit)</ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Showroom Branch */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Showroom Branch</ThemedText>
                  <Pressable
                    onPress={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                    style={styles.dropdownTrigger}
                  >
                    <ThemedText style={selectedBranchId ? styles.dropdownVal : styles.dropdownPlaceholder}>
                      {selectedBranchId
                        ? branches.find((b) => String(b.id) === selectedBranchId)?.name || 'Select Branch'
                        : 'Select Branch'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>
                  {isBranchDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {branches.map((b) => (
                        <Pressable
                          key={b.id}
                          onPress={() => {
                            setSelectedBranchId(String(b.id));
                            setIsBranchDropdownOpen(false);
                          }}
                          style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f1f5f9' }]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{b.name}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Description */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Description</ThemedText>
                  <TextInput
                    style={[styles.input, errors.details && styles.inputError]}
                    placeholder="e.g. EV sale invoice INV-2026-0410"
                    placeholderTextColor="#94a3b8"
                    value={form.details}
                    onChangeText={(t) => updateField('details', t)}
                  />
                  {errors.details && <ThemedText style={styles.errorText}>{errors.details}</ThemedText>}
                </View>

                {/* Amount */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Amount (₹)</ThemedText>
                  <View style={[styles.priceInputWrap, errors.amount && styles.inputError]}>
                    <IndianRupee size={15} color="#64748b" />
                    <TextInput
                      style={styles.priceInput}
                      placeholder="112000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={form.amount}
                      onChangeText={(t) => updateField('amount', t.replace(/[^0-9.]/g, ''))}
                    />
                  </View>
                  {errors.amount && <ThemedText style={styles.errorText}>{errors.amount}</ThemedText>}
                </View>

                {/* Bank account chips */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>SBI / Bank Account</ThemedText>
                  <View style={styles.chipWrap}>
                    {BANK_ACCOUNTS.map((acc) => {
                      const active = form.account === acc;
                      return (
                        <Pressable key={acc} onPress={() => updateField('account', acc)} style={[styles.optionChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{acc}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  {errors.account && <ThemedText style={styles.errorText}>{errors.account}</ThemedText>}
                </View>

                {/* GST bracket chips */}
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>GST Tax Bracket</ThemedText>
                  <View style={styles.chipWrap}>
                    {GST_BRACKETS.map((g) => {
                      const active = form.gst === g;
                      return (
                        <Pressable key={g} onPress={() => updateField('gst', g)} style={[styles.gstChip, active && styles.optionChipActive]}>
                          <ThemedText style={[styles.optionChipText, active && styles.optionChipTextActive]}>{g}%</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && { opacity: 0.85 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle size={17} color="#ffffff" />
                      <ThemedText style={styles.submitBtnText}>Post to Journal</ThemedText>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </FadeScaleTransition>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  overscrollFill: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#0a0e1a',
  },
  // ---- Hero ----
  heroCanvas: {
    backgroundColor: '#0a0e1a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(4, 167, 0, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 7,
  },
  badgeText: {
    color: '#04a700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleWrapper: {
    marginTop: 22,
    marginBottom: 22,
  },
  mainTitle: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickMetricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  qLbl: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // ---- Content ----
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // ---- GST ----
  gstGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gstCell: {
    flex: 1,
    gap: 4,
    alignItems: 'center',
  },
  gstDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  gstCellLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  gstCellVal: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // ---- Create button ----
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 16,
    paddingVertical: 15,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // ---- Search + filters ----
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: 'rgba(4, 167, 0, 0.3)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#04a700',
  },
  // ---- Feed ----
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  feedCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 44,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyCreateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
  },
  emptyCreateText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  // ---- Tx card ----
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
  },
  txCardVoided: {
    opacity: 0.6,
  },
  txLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMeta: {
    flex: 1,
    gap: 2,
  },
  txTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txCategory: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0f172a',
    flexShrink: 1,
  },
  voidTag: {
    backgroundColor: 'rgba(215, 29, 34, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  voidTagText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#d71d22',
    letterSpacing: 0.5,
  },
  txDesc: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  txSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  txAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  txAccount: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    flex: 1,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  creditDebitPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditDebitText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  txValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  voidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(215, 29, 34, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(215, 29, 34, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 2,
  },
  voidBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d71d22',
  },
  // ---- Modal ----
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 22,
    maxHeight: '90%',
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    marginTop: 4,
  },
  modalFormContent: {
    paddingBottom: 20,
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  readonlyChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  readonlyChipText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    fontFamily: 'monospace',
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeToggleInflow: {
    borderColor: 'rgba(4, 167, 0, 0.4)',
    backgroundColor: 'rgba(4, 167, 0, 0.06)',
  },
  typeToggleOutflow: {
    borderColor: 'rgba(234, 88, 12, 0.4)',
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
  },
  typeToggleText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    padding: 0,
  },
  inputError: {
    borderColor: '#d71d22',
    backgroundColor: 'rgba(215, 29, 34, 0.04)',
  },
  errorText: {
    fontSize: 11,
    color: '#d71d22',
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  gstChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  optionChipActive: {
    backgroundColor: 'rgba(4, 167, 0, 0.1)',
    borderColor: 'rgba(4, 167, 0, 0.4)',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  optionChipTextActive: {
    color: '#04a700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#04a700',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
    minHeight: 50,
    boxShadow: '0 8px 18px rgba(4, 167, 0, 0.28)',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  dropdownVal: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});
