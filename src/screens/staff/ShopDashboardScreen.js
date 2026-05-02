import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAllOrders, updateOrderStatus } from '../../api/orderApi';
import { AuthContext } from '../../context/AuthContext';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  onSecondaryContainer: '#783d01',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const ORDER_STATUS_CONFIG = {
  Pending: { bg: '#fff8ed', text: '#92400e', dot: '#f59e0b', label: 'Pending' },
  Ready:   { bg: '#ecfdf5', text: '#065f46', dot: '#10b981', label: 'Ready' },
  Shipped: { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', label: 'Shipped' },
  Delivered: { bg: '#f0fdf4', text: '#14532d', dot: '#16a34a', label: 'Delivered' },
};

const TABS = ['Pending', 'Ready', 'All'];

const ShopDashboardScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const { logoutUser } = useContext(AuthContext);
  const navigation = useNavigation();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleMarkReady = async (id) => {
    try {
      await updateOrderStatus(id, 'Ready');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update order');
    }
  };

  const handleCancelOrder = (id) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await updateOrderStatus(id, 'Cancelled');
            fetchOrders();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
          }
        }
      }
    ]);
  };

  const filtered = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab);
  const counts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Ready: orders.filter(o => o.status === 'Ready').length,
    All: orders.length,
  };
  const revenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const renderOrder = ({ item }) => {
    const sc = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG.Pending;
    const dateStr = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';
    const shortId = item._id?.slice(-6).toUpperCase();

    return (
      <View style={styles.card}>
        {/* Card Top */}
        <View style={styles.cardTop}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>#{shortId}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.customerName}>{item.userId?.name || 'Unknown Customer'}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Bento Info Row */}
        <View style={styles.cardDivider} />
        <View style={styles.bentoRow}>
          <View style={styles.bentoCell}>
            <Text style={styles.bentoCellLabel}>TOTAL</Text>
            <Text style={styles.bentoCellValue}>${Number(item.totalPrice || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.bentoCell, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.surfaceHigh }]}>
            <Text style={styles.bentoCellLabel}>ITEMS</Text>
            <Text style={styles.bentoCellValue}>{item.items?.length || 0}</Text>
          </View>
          <View style={styles.bentoCell}>
            <Text style={styles.bentoCellLabel}>EMAIL</Text>
            <Text style={styles.bentoCellValue} numberOfLines={1}>{item.userId?.email?.split('@')[0] || 'N/A'}</Text>
          </View>
        </View>

        {/* Order Items List */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsList}>
            {item.items.map((orderItem, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQuantity}>{orderItem.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {orderItem.productId?.name || 'Unknown Item'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action */}
        {item.status === 'Pending' && (
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.readyBtn} onPress={() => handleMarkReady(item._id)}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.readyBtnText}>Ready</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOrder(item._id)}>
              <Ionicons name="close-circle-outline" size={18} color={C.error} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadge}>
            <MaterialIcons name="store" size={13} color={C.primaryFixedDim} />
            <Text style={styles.headerBadgeText}>Shop Portal</Text>
          </View>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Ionicons name="log-out-outline" size={20} color="rgba(236,253,245,0.75)" />
        </TouchableOpacity>
      </View>

      {/* Revenue + Stats */}
      <View style={styles.statsRow}>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
          <Text style={styles.revenueValue}>${revenue.toFixed(2)}</Text>
        </View>
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatNum}>{counts.Pending}</Text>
            <Text style={styles.miniStatLabel}>Pending</Text>
          </View>
          <View style={[styles.miniStat, { borderTopWidth: 1, borderColor: 'rgba(120,216,184,0.15)' }]}>
            <Text style={styles.miniStatNum}>{counts.All}</Text>
            <Text style={styles.miniStatLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Navigation to Products */}
      <View style={styles.navPill}>
        <TouchableOpacity style={styles.navPillBtn} onPress={() => navigation.navigate('ManageProducts')}>
          <Ionicons name="cube-outline" size={16} color={C.primary} />
          <Text style={styles.navPillText}>Manage Products</Text>
          <Ionicons name="chevron-forward" size={14} color={C.outline} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {counts[tab] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab && { color: C.primary }]}>{counts[tab]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60, flex: 1, backgroundColor: C.surface }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt-long" size={56} color={C.outlineVariant} />
          <Text style={styles.emptyTitle}>No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}orders</Text>
          <Text style={styles.emptySubtitle}>New orders from customers will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id?.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerBadgeText: { color: C.primaryFixedDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: 22, marginBottom: 4, gap: 10 },
  revenueCard: { flex: 2, backgroundColor: 'rgba(120,216,184,0.1)', borderRadius: 16, padding: 16 },
  revenueLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(120,216,184,0.6)', letterSpacing: 1, marginBottom: 6 },
  revenueValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  miniStats: { flex: 1, gap: 0, backgroundColor: 'rgba(120,216,184,0.08)', borderRadius: 16, overflow: 'hidden' },
  miniStat: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  miniStatNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  miniStatLabel: { fontSize: 10, color: 'rgba(120,216,184,0.6)', fontWeight: '600' },
  navPill: { marginHorizontal: 22, marginTop: 10, marginBottom: 2 },
  navPillBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  navPillText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.primaryFixedDim },
  tabRow: { flexDirection: 'row', backgroundColor: C.surface, paddingHorizontal: 18, paddingTop: 14, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surfaceHigh },
  tabActive: { backgroundColor: C.primary + '18', borderWidth: 1.5, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.outline },
  tabTextActive: { color: C.primary, fontWeight: '800' },
  tabBadge: { backgroundColor: C.outlineVariant, borderRadius: 99, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  tabBadgeActive: { backgroundColor: C.primary + '22' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.outline },
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32, backgroundColor: C.surface },
  card: { backgroundColor: C.surfaceLowest, borderRadius: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  orderIdBadge: { width: 46, height: 46, borderRadius: 12, backgroundColor: C.secondary + '14', justifyContent: 'center', alignItems: 'center' },
  orderIdText: { fontSize: 11, fontWeight: '800', color: C.secondary },
  customerName: { fontSize: 15, fontWeight: '800', color: C.onSurface },
  orderDate: { fontSize: 12, color: C.outline, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: C.surfaceHigh, marginHorizontal: 16 },
  bentoRow: { flexDirection: 'row' },
  bentoCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  bentoCellLabel: { fontSize: 9, fontWeight: '800', color: C.outline, letterSpacing: 1, marginBottom: 4 },
  bentoCellValue: { fontSize: 15, fontWeight: '800', color: C.onSurface },
  cardFooter: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, flexDirection: 'row', gap: 10 },
  readyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  readyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.errorContainer, borderWidth: 1, borderColor: C.errorContainer },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: C.error },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.outline, marginTop: 6 },
  itemsList: { paddingHorizontal: 16, paddingBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  itemQuantity: { fontSize: 13, fontWeight: '800', color: C.primary, width: 28 },
  itemName: { fontSize: 13, color: C.onSurfaceVariant, flex: 1 },
});

export default ShopDashboardScreen;
