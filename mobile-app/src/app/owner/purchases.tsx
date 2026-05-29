import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Dimensions, Modal, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingBag, ArrowLeft, Plus, CheckCircle, Clock, X, ChevronDown, Check } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import FadeScaleTransition from '@/components/FadeScaleTransition';
import api from '@/services/api';

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
      Alert.alert('Load Error', 'Failed to retrieve purchase orders.');
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
      Alert.alert('Error', 'Failed to approve PO.');
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
      Alert.alert('Error', 'Failed to submit PO.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Capital tied up calculation (Pending + Approved PO totals)
  const capitalPendingTotal = purchaseOrders
    .filter(po => po.status === 'pending' || po.status === 'approved')
    .reduce((sum, po) => sum + parseFloat(po.total_price || '0'), 0);
  
  const formattedCapital = capitalPendingTotal >= 100000 
    ? `₹ ${(capitalPendingTotal / 100000).toFixed(2)} Lakhs`
    : `₹ ${capitalPendingTotal.toLocaleString('en-IN')}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#04a700'; // brand green
      case 'received':
        return '#2563eb'; // blue
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#d97706'; // pending
    }
  };

  // Dynamic automatic PO cost calculator
  const computedTotal = (quantity && unitPrice) 
    ? `₹ ${(parseInt(quantity) * parseFloat(unitPrice)).toLocaleString('en-IN')}`
    : '₹ 0';

  return (
    <FadeScaleTransition>
      <View style={styles.mainContainer}>
        {/* Compact Procurement Intake Header */}
        <View style={[styles.procureHeaderBar, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={18} color="#ffffff" />
            </Pressable>
            <View style={styles.logoBadge}>
              <ShoppingBag size={14} color="#04a700" />
              <ThemedText style={styles.logoBadgeText}>PROCUREMENT AUDIT</ThemedText>
            </View>
          </View>

          {/* Capital Tied Up Intake Block */}
          <View style={styles.capitalTiedBlock}>
            <View style={styles.capLeft}>
              <ThemedText style={styles.capLabel}>OUTSTANDING CAPITAL TIED</ThemedText>
              <ThemedText style={styles.capValue}>{formattedCapital}</ThemedText>
            </View>
            <Pressable 
              onPress={() => setIsModalOpen(true)}
              style={styles.addPOButton}
            >
              <Plus size={14} color="#ffffff" />
              <ThemedText style={styles.addPOButtonText}>NEW PO</ThemedText>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#04a700" />
            <ThemedText style={styles.loaderText}>Auditing supplier logistics...</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={loadData}
                colors={['#04a700']}
                tintColor="#04a700"
              />
            }
          >
            <View style={styles.contentSection}>
              {purchaseOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No procurement purchase orders registered</ThemedText>
                </View>
              ) : (
                purchaseOrders.map((po, idx) => {
                  const statusColor = getStatusColor(po.status);
                  return (
                    <View key={po.id || idx} style={styles.poCard}>
                      <View style={styles.cardTopRow}>
                        <View>
                          <ThemedText style={styles.poNumberText}>{po.po_number}</ThemedText>
                          <ThemedText style={styles.supplierNameText}>{po.supplier_name}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                          <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {(po.status_display || po.status).toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Technical specifications grid */}
                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>CATALOG MODEL</ThemedText>
                          <ThemedText style={styles.cellValue}>{po.vehicle_model_name}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>ORDER INTENDED</ThemedText>
                          <ThemedText style={styles.cellValue}>{po.quantity} Units</ThemedText>
                        </View>
                      </View>

                      <View style={styles.techGrid}>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>TOTAL VALUE</ThemedText>
                          <ThemedText style={styles.costVal}>₹ {parseFloat(po.total_price).toLocaleString('en-IN')}</ThemedText>
                        </View>
                        <View style={styles.gridCell}>
                          <ThemedText style={styles.cellLabel}>PAYMENT POLICY</ThemedText>
                          <ThemedText style={styles.cellValue}>{po.payment_terms}</ThemedText>
                        </View>
                      </View>

                      {/* Card Footer Actions */}
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
                            <CheckCircle size={12} color="#04a700" />
                            <ThemedText style={styles.approvedStatusText}>LEDGER CLEAR</ThemedText>
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

        {/* Create PO Form Drawer Sheet Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Expose Purchase Order</ThemedText>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                  <X size={18} color="#ffffff" />
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
                    placeholderTextColor="#64748b"
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
                      {selectedModel ? selectedModel.model_name : 'Select catalog model...'}
                    </ThemedText>
                    <ChevronDown size={14} color="#64748b" />
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
                      placeholderTextColor="#64748b"
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
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={unitPrice}
                      onChangeText={setUnitPrice}
                    />
                  </View>
                </View>

                {/* Automatic Cost Summary */}
                <View style={styles.costSummaryBlock}>
                  <ThemedText style={styles.summaryLabel}>TOTAL PO VALUE (COMPUTED)</ThemedText>
                  <ThemedText style={styles.summaryVal}>{computedTotal}</ThemedText>
                </View>

                {/* Payment Terms */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>PAYMENT TERMS</ThemedText>
                  <TextInput 
                    style={styles.textInput}
                    placeholder="e.g. Net 30, Cash, Advance"
                    placeholderTextColor="#64748b"
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
                    placeholderTextColor="#64748b"
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
                    isSubmitting && { backgroundColor: '#1e293b' }
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.submitFormText}>RECORD PROCUREMENT</ThemedText>
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
    backgroundColor: '#05070c',
  },
  procureHeaderBar: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#05070c',
    borderBottomWidth: 1,
    borderColor: '#141a29',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#141a29',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141a29',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  logoBadgeText: {
    color: '#04a700',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  capitalTiedBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141a29',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#04a700',
  },
  capLeft: {
    gap: 2,
  },
  capLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  capValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addPOButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#04a700',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addPOButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: 'bold',
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
  },
  emptyContainer: {
    backgroundColor: '#141a29',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  poCard: {
    backgroundColor: '#141a29',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  poNumberText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  supplierNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  techGrid: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#05070c',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  gridCell: {
    flex: 1,
    gap: 2,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  costVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#05070c',
    borderWidth: 1,
    borderColor: '#04a700',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveButtonText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  approvedStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approvedStatusText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#04a700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#141a29',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#05070c',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '500',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#05070c',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValPlaceholder: {
    fontSize: 13.5,
    color: '#64748b',
    fontWeight: '500',
  },
  dropdownValActive: {
    fontSize: 13.5,
    color: '#ffffff',
    fontWeight: '500',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    marginTop: 6,
    maxHeight: 180,
    overflow: 'hidden',
    backgroundColor: '#05070c',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dropdownItemSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  formGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  costSummaryBlock: {
    backgroundColor: '#141a29',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#04a700',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#04a700',
    marginTop: 2,
  },
  submitFormBtn: {
    backgroundColor: '#04a700',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitFormText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
