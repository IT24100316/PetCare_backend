import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getMedicalRecords } from '../../api/medicalRecordApi';
import { deletePet, getPetById } from '../../api/petApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
};

const PetProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const initialPet = route.params?.pet || {};

  const [pet, setPet] = useState(initialPet);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = () => {
    Alert.alert('Remove Pet', `Are you sure you want to remove ${pet.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try { 
            await deletePet(pet._id); 
            navigation.goBack(); 
          } catch { 
            Alert.alert('Error', 'Failed to remove pet'); 
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (initialPet._id) {
          // Refetch fresh pet data from server
          const freshPet = await getPetById(initialPet._id);
          setPet(freshPet);
          // Fetch medical records
          const data = await getMedicalRecords(initialPet._id);
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch pet data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // Re-run whenever this screen comes back into focus (after editing)
    const unsubscribe = navigation.addListener('focus', fetchAll);
    return unsubscribe;
  }, [initialPet._id]);

  const petInitial = pet.name?.charAt(0).toUpperCase() || '?';
  const imgUri = pet.image || pet.imageUrl;

  const calcAgeMonths = (iso) => {
    if (!iso) return { years: null, months: null };
    const today = new Date();
    const birth = new Date(iso);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    return { years: Math.max(0, years), months };
  };

  const formatAge = (iso) => {
    const { years, months } = calcAgeMonths(iso);
    if (years === null) return null;
    if (years === 0) return months <= 1 ? `${months} month` : `${months} months`;
    if (months === 0) return years === 1 ? '1 year' : `${years} years`;
    return `${years}y ${months}m`;
  };

  const calcAge = (iso) => calcAgeMonths(iso).years;

  const formatBirthDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const displayAge = pet.birthDate ? formatAge(pet.birthDate) : (pet.age != null ? `${pet.age} yr${pet.age !== 1 ? 's' : ''}` : null);
  const displayBirthDate = formatBirthDate(pet.birthDate);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet Passport</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditPet', { pet })}>
          <MaterialIcons name="edit" size={20} color={C.primaryFixedDim} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {imgUri ? (
              <Image source={{ uri: imgUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{petInitial}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.petName}>{pet.name}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>{pet.species}</Text>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>{pet.breed || 'Mixed'}</Text>
          </View>

          {/* Birth date + age info */}
          <View style={styles.ageRow}>
            {displayBirthDate ? (
              <>
                <View style={styles.ageCard}>
                  <Ionicons name="calendar" size={14} color={C.primary} />
                  <View>
                    <Text style={styles.ageCardLabel}>Date of Birth</Text>
                    <Text style={styles.ageCardValue}>{displayBirthDate}</Text>
                  </View>
                </View>
                <View style={styles.ageDivider} />
                <View style={styles.ageCard}>
                  <Ionicons name="time" size={14} color={C.secondary} />
                  <View>
                    <Text style={styles.ageCardLabel}>Age</Text>
                    <Text style={[styles.ageCardValue, { color: C.secondary }]}>
                      {displayAge}
                    </Text>
                  </View>
                </View>
              </>
            ) : displayAge != null ? (
              <View style={styles.ageCard}>
                <Ionicons name="time" size={14} color={C.secondary} />
                <View>
                  <Text style={styles.ageCardLabel}>Age</Text>
                  <Text style={[styles.ageCardValue, { color: C.secondary }]}>
                    {displayAge}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          
          {pet.medicalNotes ? (
            <View style={styles.notesBox}>
              <MaterialIcons name="medical-information" size={16} color={C.secondary} />
              <Text style={styles.notesText}>{pet.medicalNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Medical History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          <Text style={styles.sectionSub}>Official records from your Vet</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="folder-open" size={48} color={C.surfaceHigh} />
            <Text style={styles.emptyText}>No medical records found.</Text>
            <Text style={styles.emptySub}>When your vet visits are completed, the records will appear here.</Text>
          </View>
        ) : (
          <View style={styles.recordList}>
            {records.map(record => (
              <View key={record._id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordDateBox}>
                    <Text style={styles.recordDateDay}>
                      {record.dateGiven
                        ? new Date(record.dateGiven).getDate()
                        : new Date(record.createdAt).getDate()}
                    </Text>
                    <Text style={styles.recordDateMonth}>
                      {record.dateGiven
                        ? new Date(record.dateGiven).toLocaleString('default', { month: 'short' })
                        : new Date(record.createdAt).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.recordTitleBox}>
                    <Text style={styles.recordTitle}>
                      {record.vaccineName ? record.vaccineName : 'Clinical Visit'}
                    </Text>
                    <Text style={styles.recordDoctor}>
                      {record.dateGiven
                        ? `Given: ${new Date(record.dateGiven).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : `Recorded: ${new Date(record.createdAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordBody}>
                  {record.vaccineName ? (
                    <View style={styles.dataRow}>
                      <View style={styles.iconBox}><Ionicons name="medkit" size={12} color={C.primary} /></View>
                      <Text style={styles.dataLabel}>Vaccine:</Text>
                      <Text style={styles.dataValue}>{record.vaccineName}</Text>
                    </View>
                  ) : null}

                  {record.nextDueDate ? (
                    <View style={styles.dataRow}>
                      <View style={[styles.iconBox, {backgroundColor: '#fef3c7'}]}><Ionicons name="alarm" size={12} color="#d97706" /></View>
                      <Text style={styles.dataLabel}>Next Due:</Text>
                      <Text style={styles.dataValue}>
                        {new Date(record.nextDueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  ) : null}
                  
                  {record.illnesses ? (
                    <View style={styles.dataRow}>
                      <View style={[styles.iconBox, {backgroundColor: C.errorContainer}]}><Ionicons name="bug" size={12} color="#ba1a1a" /></View>
                      <Text style={styles.dataLabel}>Illnesses:</Text>
                      <Text style={styles.dataValue}>{record.illnesses}</Text>
                    </View>
                  ) : null}

                  {record.treatments ? (
                    <View style={styles.dataRow}>
                      <View style={[styles.iconBox, {backgroundColor: '#e0f2fe'}]}><Ionicons name="bandage" size={12} color="#0284c7" /></View>
                      <Text style={styles.dataLabel}>Treatments:</Text>
                      <Text style={styles.dataValue}>{record.treatments}</Text>
                    </View>
                  ) : null}
                  
                  {record.doctorNotes ? (
                    <View style={styles.notesBlock}>
                      <Text style={styles.notesBlockLabel}>Doctor's Notes</Text>
                      <Text style={styles.notesBlockValue}>{record.doctorNotes}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#ba1a1a" />
          <Text style={styles.deleteBtnText}>Remove Pet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  
  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 60 },
  
  profileCard: {
    backgroundColor: C.surfaceLowest, borderRadius: 24, padding: 24, alignItems: 'center',
    shadowColor: '#1a1c1c', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 3,
  },
  avatarWrapper: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: C.surfaceHigh,
    marginBottom: 16, overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%', height: '100%', backgroundColor: C.primary + '11',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 42, fontWeight: '800', color: C.primary },
  
  petName: { fontSize: 26, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badgeText: { fontSize: 13, color: C.outline, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant },

  ageRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    backgroundColor: C.surfaceLow, borderRadius: 16, padding: 12, gap: 0, width: '100%',
  },
  ageCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ageCardLabel: { fontSize: 10, fontWeight: '700', color: C.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  ageCardValue: { fontSize: 14, fontWeight: '800', color: C.onSurface, marginTop: 1 },
  ageDivider: { width: 1, height: 32, backgroundColor: C.outlineVariant, marginHorizontal: 12 },
  
  notesBox: {
    flexDirection: 'row', gap: 8, backgroundColor: C.secondaryContainer + '33', padding: 16,
    borderRadius: 16, marginTop: 20, width: '100%'
  },
  notesText: { flex: 1, fontSize: 13, color: C.secondary, fontWeight: '500', lineHeight: 20 },

  sectionHeader: { marginTop: 40, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.onSurface },
  sectionSub: { fontSize: 13, color: C.outline, marginTop: 4 },
  
  recordList: { gap: 16 },
  recordCard: {
    backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.surfaceHigh, shadowColor: '#000',
    shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1
  },
  recordHeader: { flexDirection: 'row', gap: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.surfaceLow, paddingBottom: 16, marginBottom: 16 },
  recordDateBox: {
    backgroundColor: C.primaryContainer + '11', width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  recordDateDay: { fontSize: 18, fontWeight: '800', color: C.primary },
  recordDateMonth: { fontSize: 10, fontWeight: '700', color: C.primary, textTransform: 'uppercase' },
  recordTitleBox: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  recordDoctor: { fontSize: 12, color: C.outline, marginTop: 2 },
  
  recordBody: { gap: 12 },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary + '11', justifyContent: 'center', alignItems: 'center', marginTop: -2 },
  dataLabel: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, width: 85 },
  dataValue: { flex: 1, fontSize: 13, color: C.onSurface, lineHeight: 20 },
  
  notesBlock: {
    marginTop: 8, backgroundColor: C.surfaceHigh + '88', padding: 14, borderRadius: 12,
  },
  notesBlockLabel: { fontSize: 11, fontWeight: '800', color: C.outline, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  notesBlockValue: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20 },
  
  emptyContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.onSurface, marginTop: 16 },
  emptySub: { fontSize: 13, color: C.outline, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffdad6', marginTop: 40, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#ffb4ab' },
  deleteBtnText: { fontSize: 16, fontWeight: '700', color: '#ba1a1a' },

});

export default PetProfileScreen;
