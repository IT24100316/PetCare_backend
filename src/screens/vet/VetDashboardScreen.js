import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getVetBookings, updateBookingStatus } from '../../api/vetBookingApi';
import { AuthContext } from '../../context/AuthContext';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', onError: '#ffffff', error: '#ba1a1a',
};

const TABS = ['Pending', 'Approved', 'All'];

const STATUS_CONFIG = {
  Pending:  { bg: '#fff8ed', text: '#92400e', dot: '#f59e0b' },
  Approved: { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
  Rejected: { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
};

const VetDashboardScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const { logoutUser } = useContext(AuthContext);
  const navigation = useNavigation();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getVetBookings();
      const list = Array.isArray(data) ? data : data.bookings || [];
      setBookings(list.filter(b => b.petId != null));
    } catch {
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      fetchBookings();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message);
    }
  };

  const filtered = activeTab === 'All' ? bookings : bookings.filter(b => b.status === activeTab);
  const counts = {
    Pending: bookings.filter(b => b.status === 'Pending').length,
    Approved: bookings.filter(b => b.status === 'Approved').length,
    All: bookings.length,
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    const dateStr = item.appointmentDate
      ? new Date(item.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
      : 'N/A';
    const petInitial = item.petId?.name?.charAt(0).toUpperCase() || '?';

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.petAvatar}>
            <Text style={styles.petInitial}>{petInitial}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardPetName}>{item.petId?.name || 'Unknown Pet'}</Text>
            <Text style={styles.cardSpecies}>{item.petId?.species || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.cardDivider} />
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={C.outline} />
            <Text style={styles.detailText}>{dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={C.outline} />
            <Text style={styles.detailText}>{item.timeSlot || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={C.outline} />
            <Text style={styles.detailText}>{item.userId?.name || 'Unknown'}</Text>
          </View>
        </View>

        {/* Records Button */}
        {item.petId && (
          <View style={styles.recordsRow}>
            <TouchableOpacity
              style={styles.recordsBtn}
              onPress={() => navigation.navigate('MedicalRecords', {
                petId: item.petId._id,
                petName: item.petId.name,
                pet: item.petId,
              })}
            >
              <Ionicons name="document-text-outline" size={14} color={C.primary} />
              <Text style={styles.recordsBtnText}>Medical Records</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        {item.status === 'Pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleStatusUpdate(item._id, 'Rejected')}>
              <Ionicons name="close" size={16} color={C.error} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleStatusUpdate(item._id, 'Approved')}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
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
            <MaterialIcons name="medical-services" size={13} color={C.primaryFixedDim} />
            <Text style={styles.headerBadgeText}>Vet Portal</Text>
          </View>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Ionicons name="log-out-outline" size={20} color="rgba(236,253,245,0.75)" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{counts.Pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(120,216,184,0.15)' }]}>
          <Text style={styles.statNum}>{counts.Approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{counts.All}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
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
          <MaterialIcons name="medical-services" size={56} color={C.outlineVariant} />
          <Text style={styles.emptyTitle}>No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}bookings</Text>
          <Text style={styles.emptySubtitle}>New appointments will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id?.toString()}
          renderItem={renderBooking}
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
  statsRow: { flexDirection: 'row', marginHorizontal: 22, marginBottom: 4, backgroundColor: 'rgba(120,216,184,0.08)', borderRadius: 16, overflow: 'hidden' },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(120,216,184,0.7)', fontWeight: '600', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: C.surface, marginTop: 16, paddingHorizontal: 18, paddingTop: 14, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surfaceHigh },
  tabActive: { backgroundColor: C.primary + '18', borderWidth: 1.5, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.outline },
  tabTextActive: { color: C.primary, fontWeight: '800' },
  tabBadge: { backgroundColor: C.outlineVariant, borderRadius: 99, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  tabBadgeActive: { backgroundColor: C.primary + '22' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.outline },
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32, backgroundColor: C.surface },
  card: { backgroundColor: C.surfaceLowest, borderRadius: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  petAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center' },
  petInitial: { fontSize: 18, fontWeight: '800', color: C.primary },
  cardPetName: { fontSize: 16, fontWeight: '800', color: C.onSurface },
  cardSpecies: { fontSize: 12, color: C.outline, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: C.surfaceHigh, marginHorizontal: 16 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '500' },
  recordsRow: { paddingHorizontal: 16, paddingBottom: 8 },
  recordsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.onPrimaryContainer, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, alignSelf: 'flex-start' },
  recordsBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  cardActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.errorContainer, borderWidth: 1, borderColor: '#f5c6c3' },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: C.error },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.outline, marginTop: 6 },
});

export default VetDashboardScreen;
