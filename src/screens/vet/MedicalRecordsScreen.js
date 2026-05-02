import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getMedicalRecords, deleteMedicalRecord } from '../../api/medicalRecordApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const MedicalRecordsScreen = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();
  const { petId, petName, pet } = route.params;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getMedicalRecords(petId);
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const unsubscribe = navigation.addListener('focus', fetchRecords);
    return unsubscribe;
  }, []);

  const handleDelete = (id) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteMedicalRecord(id);
            fetchRecords();
          } catch {
            Alert.alert('Error', 'Failed to delete record');
          }
        },
      },
    ]);
  };

  const InfoRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <View style={styles.infoIconBox}>
          <Ionicons name={icon} size={14} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderRecord = ({ item, index }) => (
    <View style={styles.card}>
      {/* Card Number Badge */}
      <View style={styles.cardTopRow}>
        <View style={styles.recordBadge}>
          <Text style={styles.recordBadgeText}>Record #{index + 1}</Text>
        </View>
        {item.dateGiven && (
          <Text style={styles.recordDate}>{formatDate(item.dateGiven)}</Text>
        )}
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <InfoRow icon="medical-outline" label="Vaccine" value={item.vaccineName} />
        <InfoRow icon="calendar-outline" label="Date Given" value={formatDate(item.dateGiven)} />
        <InfoRow icon="alarm-outline" label="Next Due" value={formatDate(item.nextDueDate)} />
        <InfoRow icon="bandage-outline" label="Illnesses" value={item.illnesses} />
        <InfoRow icon="flask-outline" label="Treatments" value={item.treatments} />
        <InfoRow icon="alert-circle-outline" label="Allergies" value={item.allergies} />
      </View>

      {item.doctorNotes && (
        <View style={styles.notesBox}>
          <View style={styles.notesHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.primary} />
            <Text style={styles.notesLabel}>Doctor's Notes</Text>
          </View>
          <Text style={styles.notesText}>{item.doctorNotes}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddEditRecord', { petId, record: item })}
        >
          <Ionicons name="create-outline" size={15} color={C.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={15} color={C.error} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerBadgeText}>Medical Records</Text>
          <Text style={styles.headerTitle}>{petName}</Text>
        </View>
        <View style={styles.petInitialBubble}>
          <Text style={styles.petInitialText}>{petName?.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {/* Pet Notes Banner — user-entered medical notes visible to vet */}
      {pet?.medicalNotes ? (
        <View style={styles.notesBanner}>
          <View style={styles.notesBannerIcon}>
            <Ionicons name="alert-circle" size={18} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notesBannerLabel}>Owner's Notes & Allergies</Text>
            <Text style={styles.notesBannerText}>{pet.medicalNotes}</Text>
          </View>
        </View>
      ) : null}

      {/* Summary */}
      <View style={styles.summaryBar}>
        <MaterialIcons name="folder-shared" size={16} color="rgba(120,216,184,0.75)" />
        <Text style={styles.summaryText}>
          {records.length} record{records.length !== 1 ? 's' : ''} on file
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60, flex: 1, backgroundColor: C.surface }} />
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="folder-open" size={56} color={C.outlineVariant} />
          <Text style={styles.emptyTitle}>No records yet</Text>
          <Text style={styles.emptySubtitle}>Add the first medical record for {petName}.</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item._id.toString()}
          renderItem={renderRecord}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditRecord', { petId, record: null })}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add Record</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  headerBadgeText: { color: C.primaryFixedDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  petInitialBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(120,216,184,0.18)', justifyContent: 'center', alignItems: 'center' },
  petInitialText: { fontSize: 18, fontWeight: '800', color: C.primaryFixedDim },
  notesBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fffbeb', borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    marginHorizontal: 18, marginBottom: 8, padding: 14, borderRadius: 12,
  },
  notesBannerIcon: { marginTop: 1 },
  notesBannerLabel: { fontSize: 11, fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  notesBannerText: { fontSize: 13, color: '#78350f', lineHeight: 20 },
  summaryBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(120,216,184,0.08)', marginHorizontal: 22, marginBottom: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  summaryText: { fontSize: 13, color: 'rgba(120,216,184,0.75)', fontWeight: '600' },
  list: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110, backgroundColor: C.surface },
  card: { backgroundColor: C.surfaceLowest, borderRadius: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12 },
  recordBadge: { backgroundColor: C.primary + '14', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  recordBadgeText: { fontSize: 11, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  recordDate: { fontSize: 12, color: C.outline, fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: C.surfaceHigh, marginHorizontal: 16 },
  cardBody: { padding: 16, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primary + '0E', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', color: C.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 14, color: C.onSurface, fontWeight: '500', lineHeight: 20 },
  notesBox: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surfaceLow, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: C.primary },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  notesLabel: { fontSize: 11, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20 },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.surfaceHigh },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: C.primary + '0D' },
  editBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: C.errorContainer + 'AA', borderLeftWidth: 1, borderLeftColor: C.surfaceHigh },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: C.error },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.outline, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  fab: { position: 'absolute', bottom: 28, left: 22, right: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, height: 58, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  fabText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

export default MedicalRecordsScreen;
