import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { addMedicalRecord, updateMedicalRecord } from '../../api/medicalRecordApi';
import DatePickerModal from '../../components/DatePickerModal';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const Field = ({ label, icon, children }) => (
  <View style={styles.field}>
    <View style={styles.fieldLabel}>
      <Ionicons name={icon} size={14} color={C.primary} />
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
    {children}
  </View>
);

const AddEditRecordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { petId, record } = route.params;
  const isEditing = !!record;

  const [vaccineName, setVaccineName] = useState(record?.vaccineName || '');
  const [dateGiven, setDateGiven] = useState(record?.dateGiven ? record.dateGiven.split('T')[0] : '');
  const [nextDueDate, setNextDueDate] = useState(record?.nextDueDate ? record.nextDueDate.split('T')[0] : '');
  const [illnesses, setIllnesses] = useState(record?.illnesses || '');
  const [treatments, setTreatments] = useState(record?.treatments || '');
  const [allergies, setAllergies] = useState(record?.allergies || '');
  const [doctorNotes, setDoctorNotes] = useState(record?.doctorNotes || '');
  const [saving, setSaving] = useState(false);
  const [showDateGivenPicker, setShowDateGivenPicker] = useState(false);
  const [showNextDuePicker, setShowNextDuePicker] = useState(false);

  const formatDisplayDate = (iso) => {
    if (!iso) return 'Tap to select date';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        petId,
        vaccineName: vaccineName || undefined,
        dateGiven: dateGiven ? new Date(dateGiven) : undefined,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        illnesses: illnesses || undefined,
        treatments: treatments || undefined,
        allergies: allergies || undefined,
        doctorNotes: doctorNotes || undefined,
      };

      if (isEditing) {
        await updateMedicalRecord(record._id, data);
        Alert.alert('✅ Updated', 'Record updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await addMedicalRecord(data);
        Alert.alert('✅ Added', 'Record added successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(236,253,245,0.85)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Record' : 'New Record'}</Text>
            <Text style={styles.headerSub}>{isEditing ? 'Update medical details' : 'Add a medical entry'}</Text>
          </View>
          <View style={styles.headerIconBubble}>
            <Ionicons name="medical-outline" size={18} color={C.primaryFixedDim} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vaccination Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={15} color={C.primary} />
              <Text style={styles.sectionTitle}>Vaccination</Text>
            </View>

            <Field label="Vaccine Name" icon="medical-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. Rabies, Parvovirus"
                placeholderTextColor={C.outlineVariant}
                value={vaccineName}
                onChangeText={setVaccineName}
              />
            </Field>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Date Given" icon="calendar-outline">
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowDateGivenPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar" size={16} color={dateGiven ? C.primary : C.outline} />
                    <Text style={[styles.dateBtnText, !dateGiven && styles.dateBtnPlaceholder]}>
                      {formatDisplayDate(dateGiven)}
                    </Text>
                  </TouchableOpacity>
                </Field>
              </View>
              <View style={{ width: 14 }} />
              <View style={{ flex: 1 }}>
                <Field label="Next Due Date" icon="alarm-outline">
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowNextDuePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="alarm" size={16} color={nextDueDate ? C.secondary : C.outline} />
                    <Text style={[styles.dateBtnText, !nextDueDate && styles.dateBtnPlaceholder]}>
                      {formatDisplayDate(nextDueDate)}
                    </Text>
                  </TouchableOpacity>
                </Field>
              </View>
            </View>
          </View>

          {/* Health Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bandage-outline" size={15} color={C.primary} />
              <Text style={styles.sectionTitle}>Health Details</Text>
            </View>

            <Field label="Illnesses" icon="pulse-outline">
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any diagnosed conditions..."
                placeholderTextColor={C.outlineVariant}
                value={illnesses}
                onChangeText={setIllnesses}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Field>

            <Field label="Treatments" icon="flask-outline">
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Antibiotics, surgery, etc."
                placeholderTextColor={C.outlineVariant}
                value={treatments}
                onChangeText={setTreatments}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Field>

            <Field label="Allergies" icon="alert-circle-outline">
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Known allergies..."
                placeholderTextColor={C.outlineVariant}
                value={allergies}
                onChangeText={setAllergies}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </Field>
          </View>

          {/* Notes Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={C.primary} />
              <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            </View>

            <Field label="Notes" icon="create-outline">
              <TextInput
                style={[styles.input, styles.textAreaLarge]}
                placeholder="Additional notes, observations..."
                placeholderTextColor={C.outlineVariant}
                value={doctorNotes}
                onChangeText={setDoctorNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={isEditing ? 'save-outline' : 'add-circle-outline'} size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{isEditing ? 'Update Record' : 'Add Record'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showDateGivenPicker}
        value={dateGiven}
        label="Date Vaccine Given"
        onConfirm={(iso) => { setDateGiven(iso); setShowDateGivenPicker(false); }}
        onCancel={() => setShowDateGivenPicker(false)}
      />
      <DatePickerModal
        visible={showNextDuePicker}
        value={nextDueDate}
        label="Next Due Date"
        onConfirm={(iso) => { setNextDueDate(iso); setShowNextDuePicker(false); }}
        onCancel={() => setShowNextDuePicker(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(120,216,184,0.65)', marginTop: 2 },
  headerIconBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  sectionBlock: { marginBottom: 24, gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.primary, letterSpacing: 0.5, textTransform: 'uppercase' },
  field: { gap: 8 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fieldLabelText: { fontSize: 11, fontWeight: '800', color: C.onSurfaceVariant, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.onSurface, backgroundColor: C.surfaceLowest },
  textArea: { height: 88, paddingTop: 12 },
  textAreaLarge: { height: 110, paddingTop: 12 },
  row: { flexDirection: 'row' },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.surfaceLowest,
  },
  dateBtnText: { fontSize: 14, fontWeight: '600', color: C.onSurface, flex: 1 },
  dateBtnPlaceholder: { color: C.outlineVariant, fontWeight: '400' },
  saveBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, height: 60, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});

export default AddEditRecordScreen;
