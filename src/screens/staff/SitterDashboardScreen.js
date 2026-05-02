import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getAllBoardingBookings, updateBookingStatus, getBoardingAvailability } from '../../api/boardingApi';
import { AuthContext } from '../../context/AuthContext';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const MAX_CAPACITY = 20;
const TABS = ['Pending', 'Approved', 'All'];

const STATUS_CONFIG = {
  Pending:  { bg: '#fff8ed', text: '#92400e', dot: '#f59e0b' },
  Approved: { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
  Rejected: { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
};

// Helper — get next 14 day strings
const getNext14DayStrings = () => {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
};

const NEXT14 = getNext14DayStrings();

// Format a date string like "May 5"
const fmtDate = (dateVal) => {
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format like "Mon, May 5"
const fmtDateFull = (dateVal) => {
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const SitterDashboardScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [capacityMap, setCapacityMap] = useState({});  // { 'YYYY-MM-DD': count }
  const [capacityLoading, setCapacityLoading] = useState(true);
  const [showCapacity, setShowCapacity] = useState(true);
  const { logoutUser } = useContext(AuthContext);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllBoardingBookings();
      const list = Array.isArray(data) ? data : data.bookings || [];
      setBookings(list.filter(b => b.petId != null));
    } catch {
      Alert.alert('Error', 'Failed to fetch boarding bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCapacity = async () => {
    setCapacityLoading(true);
    try {
      const data = await getBoardingAvailability(NEXT14[0], NEXT14[13]);
      const map = {};
      data.forEach(item => { map[item.date] = item.count; });
      setCapacityMap(map);
    } catch {
      setCapacityMap({});
    } finally {
      setCapacityLoading(false);
    }
  };

  const refreshAll = useCallback(() => {
    fetchBookings();
    fetchCapacity();
  }, []);

  useEffect(() => { refreshAll(); }, []);

  const handleStatusUpdate = async (id, status, petName, dates) => {
    const dateLabel = dates && dates.length > 0
      ? dates.map(fmtDate).join(', ')
      : 'this stay';

    const confirmMsg = status === 'Approved'
      ? `Approve boarding for ${petName || 'this pet'} on ${dateLabel}?`
      : `Reject the request for ${petName || 'this pet'} on ${dateLabel}?`;

    Alert.alert(
      status === 'Approved' ? '✅ Confirm Approval' : '❌ Confirm Rejection',
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'Approved' ? 'Approve' : 'Reject',
          style: status === 'Approved' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateBookingStatus(id, status);
              refreshAll();
            } catch (error) {
              Alert.alert(
                'Cannot Approve',
                error.response?.data?.message || 'Failed to update booking'
              );
            }
          },
        },
      ]
    );
  };

  const filtered = activeTab === 'All' ? bookings : bookings.filter(b => b.status === activeTab);
  const counts = {
    Pending:  bookings.filter(b => b.status === 'Pending').length,
    Approved: bookings.filter(b => b.status === 'Approved').length,
    All:      bookings.length,
  };

  // ── Capacity tracker panel ────────────────────────────────────────────────
  const renderCapacityPanel = () => {
    const daysWithData = NEXT14.map(dateStr => ({
      dateStr,
      count: capacityMap[dateStr] || 0,
      label: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    }));

    return (
      <View style={styles.capacityPanel}>
        <TouchableOpacity
          style={styles.capacityHeader}
          onPress={() => setShowCapacity(v => !v)}
          activeOpacity={0.8}
        >
          <View style={styles.capacityHeaderLeft}>
            <View style={styles.capacityIcon}>
              <MaterialIcons name="bar-chart" size={16} color={C.primaryFixedDim} />
            </View>
            <Text style={styles.capacityTitle}>Daily Capacity (next 14 days)</Text>
          </View>
          <Ionicons
            name={showCapacity ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={C.primaryFixedDim}
          />
        </TouchableOpacity>

        {showCapacity && (
          capacityLoading ? (
            <ActivityIndicator color={C.primaryFixedDim} style={{ marginVertical: 12 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.capacityScroll}>
              {daysWithData.map(({ dateStr, count, label }) => {
                const pct = Math.min(count / MAX_CAPACITY, 1);
                const isFull = count >= MAX_CAPACITY;
                const barColor = isFull ? '#ef4444' : count >= MAX_CAPACITY * 0.7 ? '#f59e0b' : '#10b981';
                return (
                  <View key={dateStr} style={styles.capacityDayCol}>
                    {/* Bar */}
                    <View style={styles.capacityBarBg}>
                      <View style={[
                        styles.capacityBarFill,
                        { height: `${Math.max(pct * 100, 3)}%`, backgroundColor: barColor },
                      ]} />
                    </View>
                    {/* Count */}
                    <Text style={[styles.capacityCount, isFull && { color: '#ef4444' }]}>
                      {count}/{MAX_CAPACITY}
                    </Text>
                    {/* Day label */}
                    <Text style={styles.capacityDayLabel}>{label}</Text>
                    {isFull && (
                      <View style={styles.fullPill}>
                        <Text style={styles.fullPillText}>FULL</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )
        )}
      </View>
    );
  };

  // ── Booking card ──────────────────────────────────────────────────────────
  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    const petInitial = item.petId?.name?.charAt(0).toUpperCase() || '?';
    const dates = item.boardingDates || [];
    const numDays = dates.length;

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

        <View style={styles.cardDivider} />

        {/* Owner info */}
        <View style={styles.ownerRow}>
          <Ionicons name="person-circle-outline" size={15} color={C.outline} />
          <Text style={styles.ownerText}>{item.userId?.name || 'Unknown owner'}</Text>
          <View style={styles.durationBadge}>
            <Ionicons name="moon-outline" size={11} color={C.primary} />
            <Text style={styles.durationText}>
              {numDays} night{numDays !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Requested dates — chips */}
        {numDays > 0 && (
          <View style={styles.datesSection}>
            <View style={styles.datesSectionHeader}>
              <Ionicons name="calendar-outline" size={13} color={C.primary} />
              <Text style={styles.datesSectionLabel}>REQUESTED DATES</Text>
            </View>
            <View style={styles.datesChipRow}>
              {dates.map((d, idx) => {
                const dateStr = new Date(d).toISOString().split('T')[0];
                const approved = capacityMap[dateStr] || 0;
                const nearFull = approved >= MAX_CAPACITY * 0.8;
                const isFull = approved >= MAX_CAPACITY;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dateChip,
                      isFull && styles.dateChipFull,
                      nearFull && !isFull && styles.dateChipWarn,
                    ]}
                  >
                    <Text style={[
                      styles.dateChipText,
                      isFull && styles.dateChipTextFull,
                      nearFull && !isFull && styles.dateChipTextWarn,
                    ]}>
                      {fmtDateFull(d)}
                    </Text>
                    {isFull && (
                      <Text style={styles.dateChipCaption}>⚠ FULL</Text>
                    )}
                    {nearFull && !isFull && (
                      <Text style={[styles.dateChipCaption, { color: '#d97706' }]}>
                        {approved}/{MAX_CAPACITY}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Actions */}
        {item.status === 'Pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleStatusUpdate(item._id, 'Rejected', item.petId?.name, dates)}
            >
              <Ionicons name="close" size={16} color={C.error} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handleStatusUpdate(item._id, 'Approved', item.petId?.name, dates)}
            >
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
            <MaterialIcons name="home-filled" size={13} color={C.primaryFixedDim} />
            <Text style={styles.headerBadgeText}>Boarding Portal</Text>
          </View>
          <Text style={styles.headerTitle}>My Boarders</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshBtn} onPress={refreshAll}>
            <Ionicons name="refresh-outline" size={19} color="rgba(236,253,245,0.75)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
            <Ionicons name="log-out-outline" size={20} color="rgba(236,253,245,0.75)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
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

      {/* Tab row */}
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

      {loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60, backgroundColor: C.surface, flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id?.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderCapacityPanel}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="home-filled" size={56} color={C.outlineVariant} />
              <Text style={styles.emptyTitle}>No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}bookings</Text>
              <Text style={styles.emptySubtitle}>New boarding requests will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },

  // ── Header ────────────────────────────────────────────────────────────────
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerBadgeText: { color: C.primaryFixedDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 8 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', marginHorizontal: 22, marginBottom: 4, backgroundColor: 'rgba(120,216,184,0.08)', borderRadius: 16, overflow: 'hidden' },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(120,216,184,0.7)', fontWeight: '600', marginTop: 2 },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabRow: { flexDirection: 'row', backgroundColor: C.surface, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surfaceHigh },
  tabActive: { backgroundColor: C.primary + '18', borderWidth: 1.5, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.outline },
  tabTextActive: { color: C.primary, fontWeight: '800' },
  tabBadge: { backgroundColor: C.outlineVariant, borderRadius: 99, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  tabBadgeActive: { backgroundColor: C.primary + '22' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.outline },

  // ── List ──────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40, backgroundColor: C.surface },

  // ── Capacity panel ────────────────────────────────────────────────────────
  capacityPanel: { backgroundColor: C.emeraldDark, borderRadius: 20, marginBottom: 18, overflow: 'hidden' },
  capacityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  capacityHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  capacityIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(120,216,184,0.18)', justifyContent: 'center', alignItems: 'center' },
  capacityTitle: { fontSize: 13, fontWeight: '700', color: C.primaryFixedDim },
  capacityScroll: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  capacityDayCol: { alignItems: 'center', width: 52, gap: 4 },
  capacityBarBg: { width: 24, height: 60, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  capacityBarFill: { width: '100%', borderRadius: 12 },
  capacityCount: { fontSize: 10, fontWeight: '700', color: 'rgba(120,216,184,0.85)' },
  capacityDayLabel: { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '600', textAlign: 'center' },
  fullPill: { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 99, paddingHorizontal: 5, paddingVertical: 2 },
  fullPillText: { fontSize: 8, fontWeight: '800', color: '#ef4444', letterSpacing: 0.5 },

  // ── Card ──────────────────────────────────────────────────────────────────
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

  // Owner row
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  ownerText: { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '500', flex: 1 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  durationText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Dates section
  datesSection: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6 },
  datesSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  datesSectionLabel: { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1.2, textTransform: 'uppercase' },
  datesChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dateChip: { backgroundColor: C.primary + '10', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.primary + '30' },
  dateChipFull: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  dateChipWarn: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  dateChipText: { fontSize: 12, fontWeight: '600', color: C.primary },
  dateChipTextFull: { color: '#dc2626' },
  dateChipTextWarn: { color: '#92400e' },
  dateChipCaption: { fontSize: 9, fontWeight: '800', color: '#dc2626', marginTop: 2, letterSpacing: 0.5 },

  // Actions
  cardActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 6 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.errorContainer, borderWidth: 1, borderColor: '#f5c6c3' },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: C.error },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.outline, marginTop: 6 },
});

export default SitterDashboardScreen;
