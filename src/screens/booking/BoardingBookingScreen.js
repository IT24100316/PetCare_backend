import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPets } from '../../api/petApi';
import { getBoardingAvailability, getPetBookedDates, createBoardingBooking } from '../../api/boardingApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  onSecondaryContainer: '#783d01', surface: '#faf9f8', surfaceHigh: '#e9e8e7',
  surfaceLow: '#f4f3f2', surfaceLowest: '#ffffff', onSurface: '#1a1c1c',
  onSurfaceVariant: '#3e4944', outline: '#6e7a74', outlineVariant: '#bdc9c3',
  emeraldDark: '#052E25', error: '#ba1a1a',
  amber: '#d97706', amberBg: '#fffbeb',
};

const PET_COLORS = ['#148367', '#8e4e14', '#9f3a21', '#006850', '#783d01'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getNext14Days = () => {
  const days = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fullDate = `${yyyy}-${mm}-${dd}`;
    days.push({ dayName: DAY_NAMES[d.getDay()], dateNum: d.getDate(), month: MONTH_NAMES[d.getMonth()], fullDate });
  }
  return days;
};

const NEXT14 = getNext14Days();

const BoardingBookingScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedDates, setSelectedDates] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});  // { 'YYYY-MM-DD': 'available'|'full' }
  const [petBookedMap, setPetBookedMap] = useState({});         // { 'YYYY-MM-DD': 'Pending'|'Approved' }
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [loadingPetDates, setLoadingPetDates] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchPets();
    fetchAvailability();
  }, []);

  // Re-fetch pet's booked dates whenever selected pet changes
  useEffect(() => {
    if (selectedPet) {
      fetchPetBookedDates(selectedPet);
      // Clear any selected dates that are now blocked for this pet
      setSelectedDates([]);
    }
  }, [selectedPet]);

  const fetchPets = async () => {
    try {
      const data = await getPets();
      setPets(data);
      if (data?.length > 0) setSelectedPet(data[0]._id);
    } catch {
      Alert.alert('Error', 'Failed to load pets');
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchAvailability = async () => {
    setLoadingAvail(true);
    try {
      const data = await getBoardingAvailability(NEXT14[0].fullDate, NEXT14[13].fullDate);
      const map = {};
      data.forEach(item => { map[item.date] = item.status; });
      setAvailabilityMap(map);
    } catch {
      setAvailabilityMap({});
    } finally {
      setLoadingAvail(false);
    }
  };

  const fetchPetBookedDates = async (petId) => {
    setLoadingPetDates(true);
    try {
      const data = await getPetBookedDates(petId);
      const map = {};
      data.forEach(item => { map[item.date] = item.status; }); // e.g. { '2025-05-10': 'Approved' }
      setPetBookedMap(map);
    } catch {
      setPetBookedMap({});
    } finally {
      setLoadingPetDates(false);
    }
  };

  const toggleDate = (dateStr) => {
    // Block if capacity full or pet already booked this date
    if (availabilityMap[dateStr] === 'full') return;
    if (petBookedMap[dateStr]) return;
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  const handleConfirm = async () => {
    if (selectedDates.length === 0 || !selectedPet) return;
    setConfirming(true);
    try {
      await createBoardingBooking(selectedPet, selectedDates);
      Alert.alert('🏠 Request Sent!', 'Your boarding request has been submitted and is awaiting manager approval.', [
        {
          text: 'Great!', onPress: () => {
            fetchPetBookedDates(selectedPet); // refresh after booking
            navigation.navigate('PetList');
          }
        },
      ]);
    } catch (e) {
      Alert.alert('Cannot Book', e?.response?.data?.message || 'Failed to submit boarding request.');
    } finally {
      setConfirming(false);
    }
  };

  const selectedPetName = pets.find(p => p._id === selectedPet)?.name ?? null;
  const canConfirm = selectedDates.length > 0 && !!selectedPet && !confirming && !loadingPetDates;

  const isLoading = loadingAvail || loadingPetDates;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boarding</Text>
        <View style={styles.headerAvatar}>
          <Ionicons name="home" size={18} color={C.primaryFixedDim} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 90, 110) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} /><View style={styles.heroCircle2} />
          <View style={styles.heroPaw}><Ionicons name="home" size={72} color="rgba(120,216,184,0.15)" /></View>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="moon" size={13} color={C.primaryFixedDim} />
              <Text style={styles.heroBadgeText}>Safe & Cozy Stay</Text>
            </View>
            <Text style={styles.heroTagline}>A home away from home{'\n'}for your beloved pet.</Text>
          </View>
        </View>

        {/* Pet Selector — first so pet context is clear before dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="paw-outline" size={17} color={C.primary} />
            <Text style={styles.sectionLabel}>WHO'S STAYING?</Text>
          </View>
          {loadingPets ? (
            <ActivityIndicator color={C.primary} />
          ) : pets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pets found. Add a pet first.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {pets.map((pet, idx) => {
                const active = selectedPet === pet._id;
                const color = PET_COLORS[idx % PET_COLORS.length];
                return (
                  <TouchableOpacity
                    key={pet._id}
                    style={[styles.petPill, active && styles.petPillActive]}
                    onPress={() => setSelectedPet(pet._id)}
                  >
                    <View style={[styles.petAvatar, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : color + '22' }]}>
                      <Text style={[styles.petInitial, { color: active ? '#fff' : color }]}>
                        {pet.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.petName, active && styles.petNameActive]}>{pet.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={17} color={C.primary} />
            <Text style={styles.sectionLabel}>SELECT DATES</Text>
            <Text style={styles.sectionHint}> · tap to select multiple</Text>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: C.primary }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: C.amber }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: C.error }]} />
              <Text style={styles.legendText}>Full / Booked</Text>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 16 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4, gap: 10 }}>
              {NEXT14.map((day) => {
                const active = selectedDates.includes(day.fullDate);
                const isFull = availabilityMap[day.fullDate] === 'full';
                const petStatus = petBookedMap[day.fullDate]; // 'Pending' | 'Approved' | undefined
                const isPetBooked = !!petStatus;
                const isDisabled = isFull || isPetBooked;

                return (
                  <TouchableOpacity
                    key={day.fullDate}
                    style={[
                      styles.dateChip,
                      active && styles.dateChipSelected,
                      isFull && !isPetBooked && styles.dateChipFull,
                      petStatus === 'Approved' && styles.dateChipPetApproved,
                      petStatus === 'Pending' && styles.dateChipPetPending,
                    ]}
                    onPress={() => toggleDate(day.fullDate)}
                    disabled={isDisabled}
                    activeOpacity={isDisabled ? 1 : 0.75}
                  >
                    <Text style={[
                      styles.dateChipDay,
                      active && styles.dateChipTextSelected,
                      isDisabled && styles.dateChipTextDisabled,
                    ]}>
                      {day.dayName}
                    </Text>
                    <Text style={[
                      styles.dateChipNum,
                      active && styles.dateChipTextSelected,
                      isDisabled && styles.dateChipTextDisabled,
                    ]}>
                      {day.dateNum}
                    </Text>
                    <Text style={[
                      styles.dateChipMonth,
                      active && styles.dateChipTextSelected,
                      isDisabled && styles.dateChipTextDisabled,
                    ]}>
                      {day.month}
                    </Text>

                    {/* State label at bottom of chip */}
                    {isFull && !isPetBooked && <Text style={styles.chipLabelFull}>FULL</Text>}
                    {petStatus === 'Approved' && <Text style={styles.chipLabelApproved}>BOOKED ✓</Text>}
                    {petStatus === 'Pending' && <Text style={styles.chipLabelPending}>PENDING</Text>}
                    {active && !isDisabled && (
                      <View style={styles.checkDot}>
                        <Ionicons name="checkmark" size={8} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedDates.length > 0 && (
            <View style={styles.selectedSummaryPill}>
              <Ionicons name="checkmark-circle" size={14} color={C.primary} />
              <Text style={styles.selectedSummaryText}>
                {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity onPress={() => setSelectedDates([])}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Summary Card */}
        {selectedDates.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="information-circle" size={24} color={C.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Stay Summary</Text>
              <Text style={styles.summaryBody}>
                {selectedPetName
                  ? `${selectedDates.length}-day boarding for ${selectedPetName}. Includes meals, playtime & 24/7 supervision. Pending manager approval.`
                  : 'Select a pet to continue.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnOff]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>
                {selectedDates.length > 0 ? `Request ${selectedDates.length} Day Stay` : 'Select Dates First'}
              </Text>
              {selectedDates.length > 0 && <Ionicons name="arrow-forward" size={22} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.18)', justifyContent: 'center', alignItems: 'center' },

  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  hero: { height: 180, backgroundColor: C.primaryContainer, borderRadius: 20, marginTop: 16, overflow: 'hidden', position: 'relative' },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,104,80,0.45)', top: -70, right: -55 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(120,216,184,0.18)', bottom: -40, left: -28 },
  heroPaw: { position: 'absolute', right: 18, bottom: 8 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(120,216,184,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 10, gap: 5 },
  heroBadgeText: { color: C.primaryFixedDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  heroTagline: { fontSize: 18, fontWeight: '700', color: '#fff', lineHeight: 26 },

  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 1.6, textTransform: 'uppercase' },
  sectionHint: { fontSize: 10, color: C.outline },

  legend: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: C.outline, fontWeight: '500' },

  // Date chips
  dateChip: {
    alignItems: 'center', backgroundColor: C.surfaceLowest,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 16,
    borderWidth: 2, borderColor: 'transparent', minWidth: 60,
  },
  dateChipSelected: { backgroundColor: C.primary, borderColor: C.primaryContainer, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  dateChipFull: { backgroundColor: '#fef2f2', borderColor: '#fca5a5', opacity: 0.75 },
  dateChipPetApproved: { backgroundColor: '#ecfdf5', borderColor: '#6ee7b7', opacity: 0.85 },
  dateChipPetPending: { backgroundColor: C.amberBg, borderColor: '#fcd34d', opacity: 0.85 },
  dateChipDay: { fontSize: 11, fontWeight: '700', color: C.outline, textTransform: 'uppercase' },
  dateChipNum: { fontSize: 22, fontWeight: '800', color: C.onSurface, marginVertical: 2 },
  dateChipMonth: { fontSize: 11, fontWeight: '600', color: C.outline },
  dateChipTextSelected: { color: '#fff' },
  dateChipTextDisabled: { color: C.outlineVariant },

  chipLabelFull: { fontSize: 8, fontWeight: '800', color: C.error, marginTop: 3, letterSpacing: 0.5 },
  chipLabelApproved: { fontSize: 8, fontWeight: '800', color: '#059669', marginTop: 3, letterSpacing: 0.3 },
  chipLabelPending: { fontSize: 8, fontWeight: '800', color: C.amber, marginTop: 3, letterSpacing: 0.3 },
  checkDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center', marginTop: 3 },

  selectedSummaryPill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.primary + '12', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, alignSelf: 'flex-start' },
  selectedSummaryText: { fontSize: 12, fontWeight: '700', color: C.primary },
  clearText: { fontSize: 12, fontWeight: '700', color: C.outline },

  petPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLowest, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  petPillActive: { backgroundColor: C.primary },
  petAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  petInitial: { fontSize: 14, fontWeight: '800' },
  petName: { fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
  petNameActive: { color: '#fff' },

  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { color: C.outline, fontSize: 14, textAlign: 'center' },

  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: C.surfaceLow, borderRadius: 16, padding: 18, marginTop: 28, borderLeftWidth: 4, borderLeftColor: C.secondary },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.secondary + '18', justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: C.onSurface, marginBottom: 6 },
  summaryBody: { fontSize: 14, color: C.onSurfaceVariant, lineHeight: 21 },

  footer: { backgroundColor: 'rgba(250,249,248,0.97)', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.outlineVariant + '50' },
  confirmBtn: { backgroundColor: C.secondary, height: 60, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8 },
  confirmBtnOff: { backgroundColor: C.outlineVariant, shadowOpacity: 0, elevation: 0 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

export default BoardingBookingScreen;
