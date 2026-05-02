import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getMyBookings } from '../../api/bookingApi';
import axiosInstance from '../../api/axiosInstance';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryFixed: '#ffdcc4',
  secondaryContainer: '#ffab69', surface: '#faf9f8', surfaceHigh: '#e9e8e7',
  surfaceLow: '#f4f3f2', surfaceLowest: '#ffffff', onSurface: '#1a1c1c',
  onSurfaceVariant: '#3e4944', outline: '#6e7a74', outlineVariant: '#bdc9c3',
  emeraldDark: '#052E25', error: '#ba1a1a', errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
};

const SERVICE_META = {
  Vet: { icon: 'medical-services', color: '#006850', bg: 'rgba(0,104,80,0.08)', label: 'Vet Appointments' },
  Grooming: { icon: 'content-cut', color: '#8e4e14', bg: 'rgba(142,78,20,0.08)', label: 'Grooming Sessions' },
  Boarding: { icon: 'home', color: '#1e7a6e', bg: 'rgba(30,122,110,0.08)', label: 'Boarding Stays' },
};

const STATUS_META = {
  Approved: { color: '#065f46', bg: '#d1fae5', label: 'Approved' },
  Pending: { color: '#78350f', bg: '#fef3c7', label: 'Pending' },
  Rejected: { color: '#410002', bg: '#ffdad6', label: 'Rejected' },
  Cancelled: { color: '#410002', bg: '#ffdad6', label: 'Cancelled' },
};

const TABS = ['Active', 'Cancelled'];
const SERVICES = ['Vet', 'Grooming', 'Boarding'];

const MyBookingsScreen = () => {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active');
  const [expandedSections, setExpandedSections] = useState({ Vet: true, Grooming: true, Boarding: true });
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isFocused) fetchBookings(); }, [isFocused]);

  const handleCancel = (booking) => {
    if (booking.isInstantSlot === true) {
      Alert.alert('Cannot Cancel', 'Instant slot bookings cannot be cancelled as another patient may need urgent care.');
      return;
    }
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            const serviceMap = { Vet: 'vet', Grooming: 'grooming', Boarding: 'boarding' };
            const slug = serviceMap[booking.serviceType] || 'vet';
            await axiosInstance.delete(`/bookings/${slug}/${booking._id}`);
            Alert.alert('✅ Cancelled', 'Booking cancelled successfully.');
            fetchBookings();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const toggleSection = (service) => {
    setExpandedSections(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const filteredBookings = bookings.filter(b => {
    const done = b.status === 'Cancelled' || b.status === 'Rejected';
    return activeTab === 'Cancelled' ? done : !done;
  });

  const getServiceBookings = (service) =>
    filteredBookings.filter(b => b.serviceType === service);

  const totalActive = bookings.filter(b => b.status !== 'Cancelled' && b.status !== 'Rejected').length;
  const totalCancelled = bookings.filter(b => b.status === 'Cancelled' || b.status === 'Rejected').length;

  const renderBookingCard = (item) => {
    const statusMeta = STATUS_META[item.status] || { color: C.outline, bg: C.surfaceHigh, label: item.status };
    const date = item.appointmentDate
      ? new Date(item.appointmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      : 'N/A';
    const isActualInstantSlot = item.isInstantSlot === true;
    const canCancel = item.status === 'Pending' && !isActualInstantSlot;

    return (
      <View key={item._id} style={styles.card}>
        {/* Card top row */}
        <View style={styles.cardTop}>
          <View style={styles.cardDateSection}>
            <Text style={styles.cardDateDay}>
              {item.appointmentDate ? new Date(item.appointmentDate).getUTCDate() : '--'}
            </Text>
            <Text style={styles.cardDateMonth}>
              {item.appointmentDate
                ? new Date(item.appointmentDate).toLocaleString('default', { month: 'short', timeZone: 'UTC' }).toUpperCase()
                : '---'}
            </Text>
          </View>
          <View style={styles.cardMainInfo}>
            <Text style={styles.cardTime}>{item.timeSlot || 'Time N/A'}</Text>
            {item.petId?.name && (
              <View style={styles.petPill}>
                <Ionicons name="paw" size={11} color={C.primary} />
                <Text style={styles.petPillText}>{item.petId.name}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        {/* Instant slot warning */}
        {isActualInstantSlot && item.status === 'Pending' && (
          <View style={styles.instantBar}>
            <Ionicons name="flash" size={12} color={C.secondary} />
            <Text style={styles.instantBarText}>Instant slot — cannot be cancelled</Text>
          </View>
        )}

        {/* Edit & Cancel Actions */}
        {(canCancel || (item.serviceType === 'Grooming' && item.status === 'Pending')) && (
          <View style={styles.cardActionsRow}>
            {item.serviceType === 'Grooming' && item.status === 'Pending' && (
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('GroomingBooking', { booking: item })}>
                <Ionicons name="create-outline" size={15} color={C.primary} />
                <Text style={styles.editBtnText}>Edit Booking</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                <Ionicons name="close-circle-outline" size={15} color={C.error} />
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSection = (service) => {
    const meta = SERVICE_META[service];
    const serviceBookings = getServiceBookings(service);
    const isExpanded = expandedSections[service];

    return (
      <View key={service} style={styles.section}>
        {/* Section Header */}
        <TouchableOpacity
          style={[styles.sectionHeader, { borderLeftColor: meta.color }]}
          onPress={() => toggleSection(service)}
          activeOpacity={0.8}
        >
          <View style={[styles.sectionIconBox, { backgroundColor: meta.bg }]}>
            <MaterialIcons name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>{meta.label}</Text>
            <Text style={styles.sectionCount}>
              {serviceBookings.length} {serviceBookings.length === 1 ? 'booking' : 'bookings'}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={C.outline}
          />
        </TouchableOpacity>

        {/* Booking Cards */}
        {isExpanded && (
          <View style={styles.sectionBody}>
            {serviceBookings.length === 0 ? (
              <View style={styles.sectionEmpty}>
                <Text style={styles.sectionEmptyText}>No {activeTab.toLowerCase()} {service.toLowerCase()} bookings</Text>
              </View>
            ) : (
              serviceBookings.map(renderBookingCard)
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSub}>{totalActive} active · {totalCancelled} cancelled</Text>
          </View>
        </View>
        <MaterialIcons name="calendar-today" size={22} color={C.primary} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            <View style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === tab && styles.tabCountTextActive]}>
                {tab === 'Active' ? totalActive : totalCancelled}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 60 }} />
      ) : filteredBookings.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="event-busy" size={48} color={C.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab} Bookings</Text>
          <Text style={styles.emptyDesc}>You have no {activeTab.toLowerCase()} appointments.</Text>
          {activeTab === 'Active' && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PetList')}>
              <Text style={styles.emptyBtnText}>Book a Service</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          showsVerticalScrollIndicator={false}
        >
          {SERVICES.map(renderSection)}
        </ScrollView>
      )}

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PetList')}>
          <MaterialIcons name="home" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="calendar-month" size={24} color={C.secondary} />
          <Text style={styles.navTextActive}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductList')}>
          <MaterialIcons name="shopping-bag" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('EditProfile')}>
          <MaterialIcons name="person" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(236,253,245,0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.primary },
  headerSub: { fontSize: 12, color: C.outline, marginTop: 2 },

  tabsContainer: {
    flexDirection: 'row', backgroundColor: C.surfaceHigh,
    margin: 16, borderRadius: 14, padding: 4, gap: 4,
  },
  tab: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10 },
  tabActive: { backgroundColor: C.surfaceLowest, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: C.outline },
  tabTextActive: { color: C.primary, fontWeight: '800' },
  tabCount: { backgroundColor: C.outlineVariant, borderRadius: 99, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabCountActive: { backgroundColor: C.primary + '18' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: C.outline },
  tabCountTextActive: { color: C.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  section: { marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 14,
    borderLeftWidth: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: C.onSurface },
  sectionCount: { fontSize: 12, color: C.outline, marginTop: 2 },

  sectionBody: { paddingTop: 8, paddingLeft: 4, gap: 8 },
  sectionEmpty: { paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center' },
  sectionEmptyText: { fontSize: 13, color: C.outline, fontStyle: 'italic' },

  card: {
    backgroundColor: C.surfaceLowest, borderRadius: 14,
    borderWidth: 1, borderColor: C.surfaceHigh,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardDateSection: {
    width: 46, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary + '0D', borderRadius: 12, paddingVertical: 8,
  },
  cardDateDay: { fontSize: 20, fontWeight: '800', color: C.primary },
  cardDateMonth: { fontSize: 9, fontWeight: '700', color: C.primary, letterSpacing: 0.5 },
  cardMainInfo: { flex: 1, gap: 6 },
  cardTime: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  petPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.primary + '0D', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
  },
  petPillText: { fontSize: 11, fontWeight: '700', color: C.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },

  instantBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff7ed', paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#fed7aa',
  },
  instantBarText: { fontSize: 12, color: C.secondary, fontWeight: '600' },

  cardActionsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.05)',
  },
  editBtnText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.errorContainer, paddingVertical: 11,
  },
  cancelBtnText: { color: C.onErrorContainer, fontWeight: '700', fontSize: 13 },

  empty: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.outline, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 12, backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: 48, borderTopRightRadius: 48,
    shadowColor: 'rgba(26,28,28,0.06)', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 1, shadowRadius: 40, elevation: 20,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99 },
  navItemActive: { alignItems: 'center', backgroundColor: 'rgba(142,78,20,0.1)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99 },
  navText: { fontSize: 11, fontWeight: '500', color: 'rgba(26,28,28,0.6)', marginTop: 4 },
  navTextActive: { fontSize: 11, fontWeight: '600', color: C.secondary, marginTop: 4 },
});

export default MyBookingsScreen;
