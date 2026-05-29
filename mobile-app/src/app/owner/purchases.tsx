import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Dimensions, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';
import { ShoppingBag, ArrowLeft, Plus, CheckCircle, Clock, X, ChevronDown, Check } from 'lucide-react-native';

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  vehicle_model: number;
  vehicle_model_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  payment_terms: string;
  estimated_delivery: string | null;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  status_display?: string;
  order_date: string;
}

export default function OwnerPurchases() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);

  // Create PO Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [estDelivery, setEstDelivery] = useState('');
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [poRes, modelsRes] = await Promise.all([
        api.get('/purchase-orders/'),
        api.get('/vehicle-models/'),
      ]);
      setPurchaseOrders(poRes.data);
      setVehicleModels(modelsRes.data);
    } catch (e) {
      console.error('Failed to load purchase orders data:', e);
      Alert.alert('Load Error', 'Failed to retrieve purchase orders from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePO = async (id: number) => {
    try {
      setIsLoading(true);
      await api.patch(`/purchase-orders/${id}/`, { status: 'approved' });
      Alert.alert('Success', 'Purchase Order approved successfully.');
      loadData();
    } catch (err) {
      console.error('Failed to approve PO:', err);
      Alert.alert('Error', 'Failed to approve purchase order.');
      setIsLoading(false);
    }
  };

  const handleCreatePOSubmit = async () => {
    if (!supplierName.trim() || !selectedModel || !quantity || !unitPrice) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/purchase-orders/', {
        supplier_name: supplierName.trim(),
        vehicle_model: selectedModel.id,
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        payment_terms: paymentTerms.trim(),
        estimated_delivery: estDelivery || undefined
      });
      
      Alert.alert('Success', 'Purchase Order recorded.');
      // Reset form
      setSupplierName('');
      setSelectedModel(null);
      setQuantity('');
      setUnitPrice('');
      setPaymentTerms('Net 30');
      setEstDelivery('');
      setIsModalOpen(false);
      
      loadData();
    } catch (err) {
      console.error('Failed to create PO:', err);
      Alert.alert('Error', 'Failed to submit purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#eff6ff', text: '#2563eb' };
      case 'received':
        return { bg: '#e8fdf0', text: '#04a700' };
      case 'cancelled':
        return { bg: '#fef2f2', text: '#d71d22' };
      default:
        return { bg: '#fffbeb', text: '#d97706' }; // pending
    }
  };

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Dark Premium Header Section */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
            <View style={styles.badgeWrapper}>
              <ShoppingBag size={18} color="#04a700" />
              <ThemedText style={styles.badgeText}>PURCHASE RECORD SYSTEM</ThemedText>
            </View>
          </View>

          {/* Editorial Title */}
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.mainTitle}>Purchase Orders</ThemedText>
            <ThemedText style={styles.accentTitle}>Supplier Directory.</ThemedText>
          </View>

          {/* Add PO Button */}
          <Pressable 
            onPress={() => setIsModalOpen(true)}
            style={styles.addPOButton}
          >
            <Plus size={16} color="#ffffff" />
            <ThemedText style={styles.addPOButtonText}>CREATE PURCHASE ORDER</ThemedText>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04a700" />
            <ThemedText style={{ color: '#64748b', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Fetching purchase orders from database...
            </ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentSection}>
              {purchaseOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ShoppingBag size={36} color="#94a3b8" />
                  <ThemedText style={styles.emptyText}>No purchase orders registered in the system</ThemedText>
                </View>
              ) : (
                purchaseOrders.map((po, idx) => {
                  const statusStyle = getStatusStyle(po.status);
                  return (
                    <View key={po.id || idx} style={styles.poCard}>
                      <View style={styles.cardHeader}>
                        <View>
                          <ThemedText style={styles.poNumber}>{po.po_number}</ThemedText>
                          <ThemedText style={styles.supplierName}>{po.supplier_name}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                            {po.status_display || po.status.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>VEHICLE MODEL</ThemedText>
                          <ThemedText style={styles.detailVal}>{po.vehicle_model_name}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>QTY ORDERED</ThemedText>
                          <ThemedText style={styles.detailVal}>{po.quantity} Units</ThemedText>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>TOTAL COST</ThemedText>
                          <ThemedText style={styles.costVal}>₹ {parseFloat(po.total_price).toLocaleString('en-IN')}</ThemedText>
                        </View>
                        <View style={styles.detailCol}>
                          <ThemedText style={styles.detailLabel}>PAYMENT TERMS</ThemedText>
                          <ThemedText style={styles.detailVal}>{po.payment_terms}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.dateText}>Ordered: {po.order_date}</ThemedText>
                        {po.status === 'pending' ? (
                          <Pressable 
                            onPress={() => handleApprovePO(po.id)}
                            style={styles.approveButton}
                          >
                            <ThemedText style={styles.approveButtonText}>APPROVE</ThemedText>
                          </Pressable>
                        ) : (
                          <View style={styles.approvedStatusIndicator}>
                            <CheckCircle size={13} color="#04a700" />
                            <ThemedText style={styles.approvedStatusText}>Approved Ledger</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* Create PO Form Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Create Purchase Order</ThemedText>
                <Pressable onPress={() => setIsModalOpen(false)}>
                  <X size={22} color="#0f172a" />
                </Pressable>
              </View>

              <ScrollView 
                style={styles.modalFormScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Supplier Name */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>SUPPLIER COMPANY</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter supplier entity name..."
                    placeholderTextColor="#94a3b8"
                    value={supplierName}
                    onChangeText={setSupplierName}
                  />
                </View>

                {/* Model Selector Dropdown */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>VEHICLE MODEL</ThemedText>
                  <Pressable 
                    onPress={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    style={styles.dropdownTrigger}
                  >
                    <ThemedText style={selectedModel ? styles.dropdownValActive : styles.dropdownValPlaceholder}>
                      {selectedModel ? selectedModel.model_name : 'Select vehicle model catalog...'}
                    </ThemedText>
                    <ChevronDown size={16} color="#64748b" />
                  </Pressable>

                  {isModelDropdownOpen && (
                    <View style={styles.dropdownContainer}>
                      {vehicleModels.map(model => (
                        <Pressable 
                          key={model.id}
                          onPress={() => {
                            setSelectedModel(model);
                            setIsModelDropdownOpen(false);
                            setUnitPrice(parseFloat(model.base_price).toString());
                          }}
                          style={styles.dropdownItem}
                        >
                          <ThemedText style={styles.dropdownItemText}>{model.model_name}</ThemedText>
                          <ThemedText style={styles.dropdownItemSub}>Base Price: ₹{parseFloat(model.base_price).toLocaleString('en-IN')}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Grid Row */}
                <View style={styles.formGridRow}>
                  {/* Quantity */}
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText style={styles.inputLabel}>QUANTITY</ThemedText>
                    <TextInput 
                      style={styles.textInput}
                      placeholder="e.g. 10"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>

                  {/* Unit Price */}
                  <View style={[styles.inputGroup, { flex: 1.2 }]}>
                    <ThemedText style={styles.inputLabel}>UNIT PRICE (₹)</ThemedText>
                    <TextInput 
                      style={styles.textInput}
                      placeholder="e.g. 85000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={unitPrice}
                      onChangeText={setUnitPrice}
                    />
                  </View>
                </View>

                {/* Payment Terms */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>PAYMENT TERMS</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="e.g. Net 30, Cash, Advance"
                    placeholderTextColor="#94a3b8"
                    value={paymentTerms}
                    onChangeText={setPaymentTerms}
                  />
                </View>

                {/* Est Delivery */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>ESTIMATED DELIVERY DATE</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="e.g. 2026-06-15"
                    placeholderTextColor="#94a3b8"
                    value={estDelivery}
                    onChangeText={setEstDelivery}
                  />
                </View>

                {/* Submit Form */}
                <Pressable
                  onPress={handleCreatePOSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.submitFormBtn,
                    pressed && { opacity: 0.8 },
                    isSubmitting && { backgroundColor: '#a3a3a3' }
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.submitFormText}>RECORD ORDER</ThemedText>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
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
  darkHeader: {
    backgroundColor: '#090d16',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleWrapper: {
    marginBottom: 20,
    gap: 2,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  accentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#04a700',
    letterSpacing: -0.5,
  },
  addPOButton: {
    backgroundColor: '#04a700',
    borderRadius: 9999,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#04a700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addPOButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  contentSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: 24,
    gap: 16,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 22,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13.5,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  poCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  poNumber: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailCol: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#475569',
  },
  costVal: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#e8fdf0',
    borderWidth: 1.5,
    borderColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveButtonText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  approvedStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approvedStatusText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalFormScroll: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#60646c',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownTrigger: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  dropdownValActive: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  dropdownContainer: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 180,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  formGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitFormBtn: {
    backgroundColor: '#04a700',
    borderRadius: 9999,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitFormText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
