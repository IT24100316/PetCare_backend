import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getMyOrders, cancelOrder } from '../../api/orderApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryFixed: '#ffdcc4',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  error: '#ba1a1a', errorContainer: '#ffdad6', onErrorContainer: '#410002',
};

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const shortId = (id) => id ? 'PC-' + id.toString().slice(-4).toUpperCase() : 'N/A';

const MyOrdersScreen = () => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isFocused) fetchOrders(); }, [isFocused]);

  const handleCancel = (id) => {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(id);
            Alert.alert('Cancelled', 'Order cancelled.');
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const pending = !item.status || item.status === 'Pending';
    const cancelled = item.status === 'Cancelled';
    const count = item.items?.length || 0;
    return (
      <View style={[styles.card, cancelled && styles.cardCancelled]}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderId}>Order #{shortId(item._id)}</Text>
            <Text style={styles.orderPrice}>RM {Number(item.totalPrice || 0).toFixed(2)}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          {pending ? (
            <View style={styles.badgePending}>
              <View style={styles.pulseDot} />
              <Text style={styles.badgePendingText}>Pending</Text>
            </View>
          ) : item.status === 'Ready' ? (
            <View style={styles.badgeReady}>
              <MaterialIcons name="check-circle" size={13} color="#166534" style={{marginRight: 4}} />
              <Text style={styles.badgeReadyText}>Ready</Text>
            </View>
          ) : (
            <View style={styles.badgeCancelled}>
              <Text style={styles.badgeCancelledText}>Cancelled</Text>
            </View>
          )}
        </View>
        <View style={styles.productRow}>
          <View style={styles.productIconBox}>
            <MaterialIcons name="shopping-bag" size={22} color={(pending || item.status === 'Ready') ? C.primary : C.outline} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{count} item{count !== 1 ? 's' : ''} ordered</Text>
            <Text style={styles.productSub}>PawCare Pet Store</Text>
          </View>
        </View>
        {pending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Track Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => handleCancel(item._id)}>
              <Text style={styles.outlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.reorderBtn}>
            <MaterialIcons name="refresh" size={16} color={C.onSurface} />
            <Text style={styles.reorderBtnText}>Reorder Items</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <MaterialIcons name="shopping-bag" size={24} color={C.primary} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.banner}>
            <Text style={styles.bannerTag}>Track Your Care</Text>
            <Text style={styles.bannerTitle}>{"Managing your\npet's essentials"}</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 50 }} /> : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="shopping-bag" size={48} color={C.outlineVariant} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptyDesc}>Visit the shop to place your first order!</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('ProductList')}>
                <Text style={styles.emptyBtnText}>Visit Pet Shop</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PetList')}>
          <MaterialIcons name="home" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyBookings')}>
          <MaterialIcons name="calendar-month" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductList')}>
          <MaterialIcons name="shopping-bag" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation.navigate('EditProfile')}>
          <MaterialIcons name="person" size={24} color={C.secondary} />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(236,253,245,0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.primary },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 14 },
  banner: { backgroundColor: 'rgba(20,131,103,0.1)', borderRadius: 20, padding: 24, marginBottom: 20 },
  bannerTag: { fontSize: 10, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: C.onSurface, lineHeight: 30 },
  card: { backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 3 },
  cardCancelled: { backgroundColor: '#f4f3f2', opacity: 0.82 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orderId: { fontSize: 13, color: C.outline, fontWeight: '500', marginBottom: 4 },
  orderPrice: { fontSize: 22, fontWeight: '800', color: C.onSurface, marginBottom: 4 },
  orderDate: { fontSize: 12, color: C.outline },
  badgePending: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#059669' },
  badgePendingText: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  badgeReady: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#bbf7d0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeReadyText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  badgeCancelled: { backgroundColor: C.errorContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeCancelledText: { fontSize: 12, fontWeight: '700', color: C.onErrorContainer },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  productIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 13, fontWeight: '600', color: C.onSurface, marginBottom: 3 },
  productSub: { fontSize: 11, color: C.outline },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: C.primary, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  outlineBtn: { flex: 1, borderWidth: 1.5, borderColor: C.outlineVariant, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  outlineBtnText: { color: C.primary, fontSize: 14, fontWeight: '700' },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.outlineVariant, paddingVertical: 12, borderRadius: 30, gap: 6 },
  reorderBtnText: { fontSize: 14, fontWeight: '700', color: C.onSurface },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,220,196,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.outline, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 12, backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 48, borderTopRightRadius: 48,
    shadowColor: 'rgba(26,28,28,0.06)', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 1, shadowRadius: 40, elevation: 20,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99 },
  navItemActive: {
    alignItems: 'center', backgroundColor: 'rgba(142,78,20,0.1)',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99,
  },
  navText: { fontSize: 11, fontWeight: '500', color: 'rgba(26,28,28,0.6)', marginTop: 4 },
  navTextActive: { fontSize: 11, fontWeight: '600', color: C.secondary, marginTop: 4 },
});


export default MyOrdersScreen;
