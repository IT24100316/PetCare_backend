import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getPets } from '../../api/petApi';
import { getAvailableSlots, lockSlot, confirmBooking } from '../../api/vetBookingApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  onSecondaryContainer: '#783d01', surface: '#faf9f8', surfaceHigh: '#e9e8e7',
  surfaceLow: '#f4f3f2', surfaceLowest: '#ffffff', onSurface: '#1a1c1c',
  onSurfaceVariant: '#3e4944', outline: '#6e7a74', outlineVariant: '#bdc9c3',
  emeraldDark: '#052E25',
};

const PET_COLORS = ['#148367', '#8e4e14', '#9f3a21', '#006850', '#783d01'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getNext7Days = () => {
  const days = [];
  for (let i = 1; i <= 7; i++) {
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

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m || '00'} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const VetBookingScreen = () => {
  const insets = useSafeAreaInsets();
  const NEXT7 = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(NEXT7[0].fullDate);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockedBookingId, setLockedBookingId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => { fetchPets(); }, []);
  useEffect(() => { fetchSlots(); }, [selectedDate]);

  const fetchPets = async () => {
    try {
      const data = await getPets();
      setPets(data);
      if (data?.length > 0) setSelectedPet(data[0]._id);
    } catch { Alert.alert('Error', 'Failed to load pets'); }
    finally { setLoadingPets(false); }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    setLockedBookingId(null);
    try {
      const data = await getAvailableSlots(selectedDate);
      setAvailableSlots(Array.isArray(data) ? data : data.slots || []);
    } catch { setAvailableSlots([]); }
    finally { setLoadingSlots(false); }
  };

  const handleSlotPress = async (slot) => {
    if (locking) return;
    
    setSelectedSlot(slot);
    setLocking(true);
    try {
      const timeStr = typeof slot === 'string' ? slot : slot.time;
      const data = await lockSlot(selectedDate, timeStr);
      const bookingId = data._id || data.id || data.bookingId || (data.booking && data.booking._id);
      setLockedBookingId(bookingId);
    } catch (error) {
      Alert.alert('Error', 'Failed to lock slot. It may have been taken.');
      setSelectedSlot(null);
    } finally {
      setLocking(false);
    }
  };

  const handleConfirm = async () => {
    if (!lockedBookingId || !selectedPet) return;
    setConfirming(true);
    try {
      await confirmBooking(lockedBookingId, selectedPet);
      Alert.alert('🩺 Booked!', 'Vet appointment confirmed!', [
        { text: 'Great!', onPress: () => navigation.navigate('PetList') },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to confirm booking.');
    } finally { setConfirming(false); }
  };

  const selectedPetName = pets.find(p => p._id === selectedPet)?.name ?? null;
  const canConfirm = !!lockedBookingId && !!selectedPet && !confirming;

  const renderSlot = ({ item }) => {
    const timeStr = typeof item === 'string' ? item : item.time;
    const isInstant = typeof item === 'object' && item.isInstant;
    const isSelected = selectedSlot === item || (selectedSlot?.time && selectedSlot.time === item.time);
    return (
      <TouchableOpacity 
        style={[styles.slotCard, isSelected && styles.slotCardSelected]} 
        onPress={() => handleSlotPress(item)} 
        activeOpacity={0.8}
        disabled={locking}
      >
        <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>{formatTime(timeStr)}</Text>
        {isInstant && (
          <View style={[styles.instantBadge, isSelected && { backgroundColor: C.secondaryContainer }]}>
            <Ionicons name="flash" size={10} color={C.onSecondaryContainer} />
            <Text style={styles.instantText}>Instant</Text>
          </View>
        )}
        {isSelected && locking && <ActivityIndicator size="small" color="#fff" style={{marginTop: 4}} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vet Clinic</Text>
        <View style={styles.headerAvatar}><MaterialIcons name="local-hospital" size={18} color={C.primaryFixedDim} /></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 90, 110) }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} /><View style={styles.heroCircle2} />
          <View style={styles.heroIcon}><MaterialIcons name="medical-services" size={72} color="rgba(120,216,184,0.15)" /></View>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <MaterialIcons name="health-and-safety" size={13} color={C.primaryFixedDim} />
              <Text style={styles.heroBadgeText}>Expert Veterinary Care</Text>
            </View>
            <Text style={styles.heroTagline}>Your pet's health{'\n'}is our priority.</Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Ionicons name="calendar-outline" size={17} color={C.primary} /><Text style={styles.sectionLabel}>SELECT DATE</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {NEXT7.map(day => {
              const active = selectedDate === day.fullDate;
              return (
                <TouchableOpacity key={day.fullDate} style={[styles.dateChip, active && styles.dateChipSelected]} onPress={() => setSelectedDate(day.fullDate)}>
                  <Text style={[styles.dateChipDay, active && styles.dateChipTextSelected]}>{day.dayName}</Text>
                  <Text style={[styles.dateChipNum, active && styles.dateChipTextSelected]}>{day.dateNum}</Text>
                  <Text style={[styles.dateChipMonth, active && styles.dateChipTextSelected]}>{day.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Pet */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Ionicons name="paw-outline" size={17} color={C.primary} /><Text style={styles.sectionLabel}>SELECT PET</Text></View>
          {loadingPets ? <ActivityIndicator color={C.primary} /> : pets.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyText}>No pets found.</Text></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {pets.map((pet, idx) => {
                const active = selectedPet === pet._id;
                const color = PET_COLORS[idx % PET_COLORS.length];
                return (
                  <TouchableOpacity key={pet._id} style={[styles.petPill, active && styles.petPillActive]} onPress={() => setSelectedPet(pet._id)}>
                    <View style={[styles.petAvatar, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : color + '22' }]}>
                      <Text style={[styles.petInitial, { color: active ? '#fff' : color }]}>{pet.name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.petName, active && { color: '#fff' }]}>{pet.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Slots */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Ionicons name="time-outline" size={17} color={C.primary} /><Text style={styles.sectionLabel}>AVAILABLE SLOTS</Text></View>
          {loadingSlots ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 28 }} /> : availableSlots.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyText}>No slots for this date.</Text></View>
          ) : (
            <FlatList data={availableSlots} keyExtractor={(_, i) => i.toString()} numColumns={3} renderItem={renderSlot} scrollEnabled={false} columnWrapperStyle={{ gap: 10, marginBottom: 10 }} />
          )}
        </View>

        {lockedBookingId && selectedPetName && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}><MaterialIcons name="medical-services" size={22} color={C.secondary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Appointment Summary</Text>
              <Text style={styles.summaryBody}>Veterinary checkup for {selectedPetName} at {formatTime(typeof selectedSlot === 'string' ? selectedSlot : selectedSlot.time)} on {new Date(selectedDate).toLocaleDateString()}.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={[styles.confirmBtn, !canConfirm && styles.confirmBtnOff]} onPress={handleConfirm} disabled={!canConfirm}>
          {confirming ? <ActivityIndicator color="#fff" size="small" /> : (
            <><Text style={styles.confirmBtnText}>{lockedBookingId ? 'Confirm Appointment' : 'Select a Slot'}</Text>{lockedBookingId && <Ionicons name="arrow-forward" size={22} color="#fff" />}</>
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
  hero: { height: 180, backgroundColor: C.primary, borderRadius: 20, marginTop: 16, overflow: 'hidden', position: 'relative' },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -70, right: -55 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -28 },
  heroIcon: { position: 'absolute', right: 18, bottom: 8 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 10, gap: 5 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroTagline: { fontSize: 18, fontWeight: '700', color: '#fff', lineHeight: 26 },
  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 1.6, textTransform: 'uppercase' },
  dateChip: { alignItems: 'center', backgroundColor: C.surfaceLowest, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', minWidth: 60 },
  dateChipSelected: { backgroundColor: C.primary },
  dateChipDay: { fontSize: 11, fontWeight: '700', color: C.outline, textTransform: 'uppercase' },
  dateChipNum: { fontSize: 22, fontWeight: '800', color: C.onSurface, marginVertical: 2 },
  dateChipMonth: { fontSize: 11, fontWeight: '600', color: C.outline },
  dateChipTextSelected: { color: '#fff' },
  petPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLowest, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 99 },
  petPillActive: { backgroundColor: C.primary },
  petAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  petInitial: { fontSize: 14, fontWeight: '800' },
  petName: { fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: C.outline, fontSize: 14, textAlign: 'center' },
  slotCard: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: 2, borderColor: 'transparent' },
  slotCardSelected: { backgroundColor: C.primaryContainer, borderColor: C.primary, transform: [{ scale: 1.05 }] },
  slotTime: { fontSize: 13, fontWeight: '700', color: C.onSurface },
  slotTimeSelected: { color: C.onPrimaryContainer },
  instantBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: C.secondaryContainer + '44', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  instantText: { fontSize: 9, fontWeight: '800', color: C.onSecondaryContainer, textTransform: 'uppercase' },
  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: C.surfaceLow, borderRadius: 16, padding: 18, marginTop: 28, borderLeftWidth: 4, borderLeftColor: C.secondary },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.secondary + '18', justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: C.onSurface, marginBottom: 6 },
  summaryBody: { fontSize: 14, color: C.onSurfaceVariant, lineHeight: 21 },
  footer: { backgroundColor: 'rgba(250,249,248,0.97)', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.outlineVariant + '50' },
  confirmBtn: { backgroundColor: C.primary, height: 60, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8 },
  confirmBtnOff: { backgroundColor: C.outlineVariant, shadowOpacity: 0, elevation: 0 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

export default VetBookingScreen;
