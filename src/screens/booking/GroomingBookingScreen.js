import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getPets } from '../../api/petApi';
import { getAvailableSlots, lockSlot, confirmBooking, updateBooking } from '../../api/groomingApi';

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

const GROOMING_SERVICES = [
  { id: 'full', name: 'Full Groom', price: 50, desc: 'Bath, haircut, nails, and ears.' },
  { id: 'bath', name: 'Bath & Brush', price: 30, desc: 'Deep cleaning and deshedding.' },
  { id: 'nail', name: 'Quick Trim', price: 15, desc: 'Just a quick nail clipping.' },
];

const ADD_ONS = [
  { id: 'nails', name: 'Nail Trimming', price: 10 },
  { id: 'ears', name: 'Ear Cleaning', price: 8 },
  { id: 'flea', name: 'Flea Treatment', price: 12 },
];

const MOODS = [
  { id: 'Calm', label: 'Calm', emoji: '😌', color: '#10b981' },
  { id: 'Nervous', label: 'Nervous', emoji: '😰', color: '#f59e0b' },
  { id: 'Aggressive', label: 'Aggressive', emoji: '😠', color: '#ef4444' },
];

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

const GroomingBookingScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const NEXT7 = getNext7Days();

  // Check for Edit Mode
  const editBooking = route.params?.booking || null;
  const isEdit = !!editBooking;

  // Step Management
  const [step, setStep] = useState(1);

  // Form State
  const [selectedPet, setSelectedPet] = useState(editBooking?.petId?._id || editBooking?.petId || null);
  const [petMood, setPetMood] = useState(editBooking?.petMood || 'Calm');
  const [lastGroomed, setLastGroomed] = useState(editBooking?.lastGroomingDate ? new Date(editBooking.lastGroomingDate).toISOString().split('T')[0] : '');
  const [selectedService, setSelectedService] = useState(GROOMING_SERVICES.find(s => s.name === editBooking?.subService) || GROOMING_SERVICES[0]);
  const [selectedAddOns, setSelectedAddOns] = useState(
    editBooking?.addOns ? editBooking.addOns.map(name => ADD_ONS.find(a => a.name === name)?.id).filter(Boolean) : []
  );
  const [selectedDate, setSelectedDate] = useState(editBooking?.appointmentDate ? new Date(editBooking.appointmentDate).toISOString().split('T')[0] : NEXT7[0].fullDate);
  const [selectedSlot, setSelectedSlot] = useState(editBooking?.timeSlot ? { time: editBooking.timeSlot } : null);
  const [notes, setNotes] = useState(editBooking?.notes || '');

  // Data State
  const [pets, setPets] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { fetchPets(); }, []);
  useEffect(() => { if (step === 4) fetchSlots(); }, [selectedDate, step]);

  const fetchPets = async () => {
    try {
      const data = await getPets();
      setPets(data);
      if (data?.length > 0 && !selectedPet) setSelectedPet(data[0]._id);
    } catch { Alert.alert('Error', 'Failed to load pets'); }
    finally { setLoadingPets(false); }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    // In edit mode, if the selected date is the original date, we should keep the current slot
    const originalDateStr = editBooking?.appointmentDate ? new Date(editBooking.appointmentDate).toISOString().split('T')[0] : null;
    
    try {
      const data = await getAvailableSlots(selectedDate);
      let slots = Array.isArray(data) ? data : data.slots || [];
      
      // If editing and on the original date, add the current slot back to the available list if it's missing
      if (isEdit && selectedDate === originalDateStr && editBooking.timeSlot) {
        const exists = slots.find(s => (typeof s === 'string' ? s : s.time) === editBooking.timeSlot);
        if (!exists) {
          slots = [{ time: editBooking.timeSlot }, ...slots];
        }
      }
      setAvailableSlots(slots);
    } catch { setAvailableSlots([]); }
    finally { setLoadingSlots(false); }
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedPet) return;
    setConfirming(true);
    try {
      const timeStr = typeof selectedSlot === 'string' ? selectedSlot : selectedSlot.time;
      const totalPrice = selectedService.price + selectedAddOns.reduce((acc, id) => acc + (ADD_ONS.find(a => a.id === id)?.price || 0), 0);
      const extras = {
        subService: selectedService.name,
        price: totalPrice,
        addOns: selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)?.name),
        petMood,
        lastGroomingDate: lastGroomed ? new Date(lastGroomed) : null,
        notes
      };

      if (isEdit) {
        // Just update existing booking
        await updateBooking(editBooking._id, {
          ...extras,
          petId: selectedPet,
          appointmentDate: selectedDate,
          timeSlot: timeStr
        });
        Alert.alert('✅ Updated', 'Booking updated successfully!', [
          { text: 'Great!', onPress: () => navigation.navigate('MyBookings') },
        ]);
      } else {
        // New booking flow
        const lockData = await lockSlot(selectedDate, timeStr);
        const bookingId = lockData._id || lockData.id || lockData.bookingId || lockData.booking?._id;
        await confirmBooking(bookingId, selectedPet, extras);
        Alert.alert('✂️ Booked!', 'Grooming session confirmed!', [
          { text: 'Great!', onPress: () => navigation.navigate('PetList') },
        ]);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Something went wrong. The slot might have been taken.');
      setStep(4);
      fetchSlots();
    } finally { setConfirming(false); }
  };

  const toggleAddOn = (id) => {
    setSelectedAddOns(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const currentPet = pets.find(p => p._id === selectedPet);
  const totalPrice = selectedService.price + selectedAddOns.reduce((acc, id) => acc + (ADD_ONS.find(a => a.id === id)?.price || 0), 0);

  // Render Functions
  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2, 3, 4, 5].map(s => (
        <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive, step === s && styles.stepDotCurrent]} />
      ))}
    </View>
  );

  const renderPetStep = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Who is getting a haircut?</Text>
      {loadingPets ? <ActivityIndicator color={C.primary} /> : (
        <ScrollView contentContainerStyle={styles.petGrid}>
          {pets.map((pet, idx) => {
            const active = selectedPet === pet._id;
            const color = PET_COLORS[idx % PET_COLORS.length];
            return (
              <TouchableOpacity key={pet._id} style={[styles.petCard, active && styles.petCardActive]} onPress={() => setSelectedPet(pet._id)}>
                <View style={[styles.petAvatarLarge, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.petInitialLarge, { color }]}>{pet.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[styles.petNameLarge, active && { color: '#fff' }]}>{pet.name}</Text>
                {active && <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.checkIcon} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderPetDetailsStep = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>How is {currentPet?.name} feeling?</Text>
      <View style={styles.moodRow}>
        {MOODS.map(m => (
          <TouchableOpacity key={m.id} style={[styles.moodCard, petMood === m.id && { borderColor: m.color, backgroundColor: m.color + '10' }]} onPress={() => setPetMood(m.id)}>
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={[styles.moodLabel, petMood === m.id && { color: m.color, fontWeight: '800' }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.stepTitle, { marginTop: 32 }]}>Last Grooming Date</Text>
      <TextInput 
        style={styles.dateInput} 
        placeholder="YYYY-MM-DD (Optional)" 
        value={lastGroomed} 
        onChangeText={setLastGroomed}
        placeholderTextColor={C.outline}
      />
      <Text style={styles.inputHint}>Helps our groomers estimate the work needed.</Text>
    </View>
  );

  const renderServiceStep = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Select Service</Text>
      {GROOMING_SERVICES.map(s => (
        <TouchableOpacity key={s.id} style={[styles.serviceCard, selectedService.id === s.id && styles.serviceCardActive]} onPress={() => setSelectedService(s)}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.serviceName, selectedService.id === s.id && { color: '#fff' }]}>{s.name}</Text>
            <Text style={[styles.serviceDesc, selectedService.id === s.id && { color: 'rgba(255,255,255,0.8)' }]}>{s.desc}</Text>
          </View>
          <Text style={[styles.servicePrice, selectedService.id === s.id && { color: '#fff' }]}>${s.price}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.stepTitle, { marginTop: 24 }]}>Add-ons</Text>
      <View style={styles.addOnGrid}>
        {ADD_ONS.map(a => {
          const active = selectedAddOns.includes(a.id);
          return (
            <TouchableOpacity key={a.id} style={[styles.addOnCard, active && styles.addOnCardActive]} onPress={() => toggleAddOn(a.id)}>
              <Ionicons name={active ? "checkbox" : "square-outline"} size={20} color={active ? '#fff' : C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.addOnName, active && { color: '#fff' }]}>{a.name}</Text>
                <Text style={[styles.addOnPrice, active && { color: 'rgba(255,255,255,0.9)' }]}>+${a.price}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSlotStep = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>When should we visit?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
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

      <Text style={[styles.stepTitle, { marginTop: 10 }]}>Available Slots</Text>
      {loadingSlots ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 28 }} /> : availableSlots.length === 0 ? (
        <View style={styles.emptyState}><Text style={styles.emptyText}>No slots for this date.</Text></View>
      ) : (
        <View style={styles.slotGrid}>
          {availableSlots.map((item, i) => {
            const timeStr = typeof item === 'string' ? item : item.time;
            const isSelected = selectedSlot === item || selectedSlot?.time === item?.time;
            return (
              <TouchableOpacity key={i} style={[styles.slotItem, isSelected && styles.slotItemSelected]} onPress={() => setSelectedSlot(item)}>
                <Text style={[styles.slotTime, isSelected && { color: '#fff' }]}>{formatTime(timeStr)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Final Review</Text>
      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Pet</Text>
          <Text style={styles.reviewValue}>{currentPet?.name} ({petMood})</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Service</Text>
          <Text style={styles.reviewValue}>{selectedService.name}</Text>
        </View>
        {selectedAddOns.length > 0 && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Add-ons</Text>
            <Text style={styles.reviewValue}>{selectedAddOns.map(id => ADD_ONS.find(a => a.id === id)?.name).join(', ')}</Text>
          </View>
        )}
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Appointment</Text>
          <Text style={styles.reviewValue}>{selectedDate} at {formatTime(typeof selectedSlot === 'string' ? selectedSlot : selectedSlot?.time)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.reviewRow}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>${totalPrice}</Text>
        </View>
      </View>

      <Text style={[styles.stepTitle, { marginTop: 24 }]}>Notes for Groomer</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        placeholder="Any allergies, behaviors, or specific requests?"
        value={notes}
        onChangeText={setNotes}
        placeholderTextColor={C.outline}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={step === 1 ? () => navigation.goBack() : prevStep}>
          <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Grooming</Text>
        <View style={styles.headerAvatar}><MaterialIcons name="content-cut" size={18} color={C.primaryFixedDim} /></View>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        {step === 1 && renderPetStep()}
        {step === 2 && renderPetDetailsStep()}
        {step === 3 && renderServiceStep()}
        {step === 4 && renderSlotStep()}
        {step === 5 && renderReviewStep()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.nextBtn, (step === 1 && !selectedPet) || (step === 4 && !selectedSlot) ? styles.nextBtnDisabled : null]} 
          onPress={step === 5 ? handleConfirm : nextStep}
          disabled={confirming || (step === 1 && !selectedPet) || (step === 4 && !selectedSlot)}
        >
          {confirming ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.nextBtnText}>{step === 5 ? 'Confirm Booking' : 'Continue'}</Text>
              <Ionicons name={step === 5 ? "checkmark-circle" : "arrow-forward"} size={20} color="#fff" />
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.18)', justifyContent: 'center', alignItems: 'center' },
  stepContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10, backgroundColor: C.emeraldDark },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotActive: { backgroundColor: C.primaryFixedDim },
  stepDotCurrent: { width: 24, backgroundColor: C.primaryFixedDim },
  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  scrollContent: { padding: 24 },
  content: { flex: 1 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: C.onSurface, marginBottom: 20 },
  petGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  petCard: { width: '47%', backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  petCardActive: { borderColor: C.primary, backgroundColor: C.primary },
  petAvatarLarge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  petInitialLarge: { fontSize: 32, fontWeight: '800' },
  petNameLarge: { fontSize: 18, fontWeight: '700', color: C.onSurface },
  checkIcon: { position: 'absolute', top: 10, right: 10 },
  moodRow: { flexDirection: 'row', gap: 12 },
  moodCard: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  moodEmoji: { fontSize: 32, marginBottom: 8 },
  moodLabel: { fontSize: 14, fontWeight: '600', color: C.outline },
  dateInput: { backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 18, fontSize: 16, color: C.onSurface, borderWidth: 1, borderColor: C.outlineVariant },
  inputHint: { fontSize: 12, color: C.outline, marginTop: 8, marginLeft: 4 },
  serviceCard: { backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  serviceCardActive: { backgroundColor: C.primary, borderColor: C.primaryContainer },
  serviceName: { fontSize: 18, fontWeight: '800', color: C.onSurface },
  serviceDesc: { fontSize: 13, color: C.outline, marginTop: 4 },
  servicePrice: { fontSize: 20, fontWeight: '800', color: C.primary },
  addOnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  addOnCard: { width: '100%', backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.outlineVariant },
  addOnCardActive: { backgroundColor: C.primaryContainer, borderColor: C.primary },
  addOnName: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  addOnPrice: { fontSize: 13, color: C.primary, fontWeight: '600' },
  dateChip: { alignItems: 'center', backgroundColor: C.surfaceLowest, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', minWidth: 70 },
  dateChipSelected: { backgroundColor: C.primary },
  dateChipDay: { fontSize: 11, fontWeight: '700', color: C.outline, textTransform: 'uppercase' },
  dateChipNum: { fontSize: 22, fontWeight: '800', color: C.onSurface, marginVertical: 2 },
  dateChipMonth: { fontSize: 11, fontWeight: '600', color: C.outline },
  dateChipTextSelected: { color: '#fff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotItem: { width: '30%', backgroundColor: C.surfaceLowest, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.outlineVariant },
  slotItemSelected: { backgroundColor: C.primary, borderColor: C.primary },
  slotTime: { fontSize: 14, fontWeight: '700', color: C.onSurface },
  reviewCard: { backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20, gap: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewLabel: { fontSize: 14, color: C.outline, fontWeight: '600' },
  reviewValue: { fontSize: 15, color: C.onSurface, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 20 },
  divider: { height: 1, backgroundColor: C.outlineVariant },
  totalLabel: { fontSize: 18, fontWeight: '800', color: C.onSurface },
  totalValue: { fontSize: 24, fontWeight: '900', color: C.primary },
  notesInput: { backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 18, fontSize: 16, color: C.onSurface, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: C.outlineVariant },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(250,249,248,0.95)', paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.outlineVariant },
  nextBtn: { backgroundColor: C.primary, height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  nextBtnDisabled: { backgroundColor: C.outlineVariant, shadowOpacity: 0 },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: C.outline, fontSize: 16 },
});

export default GroomingBookingScreen;
