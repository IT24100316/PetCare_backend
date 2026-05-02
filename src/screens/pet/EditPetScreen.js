import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updatePet, uploadImage } from '../../api/petApi';
import { isValidAge } from '../../utils/validators';
import DatePickerModal from '../../components/DatePickerModal';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
};

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Hamster', 'Other'];
const PET_COLORS = ['#148367', '#8e4e14', '#9f3a21', '#006850', '#783d01', '#1e7a6e'];

const Field = ({ label, icon, children }) => (
  <View style={styles.field}>
    <View style={styles.fieldLabel}>
      <Ionicons name={icon} size={14} color={C.primary} />
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
    {children}
  </View>
);

const EditPetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const pet = route.params?.pet;

  const [name, setName] = useState(pet?.name || '');
  const [species, setSpecies] = useState(pet?.species || '');
  const [breed, setBreed] = useState(pet?.breed || '');
  const [birthDate, setBirthDate] = useState(
    pet?.birthDate ? new Date(pet.birthDate).toISOString().split('T')[0] : ''
  );
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState(pet?.medicalNotes || '');
  const [imageUrl, setImageUrl] = useState(pet?.image || pet?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const formatDisplayDate = (iso) => {
    if (!iso) return 'Tap to select birth date';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const avatarColor = PET_COLORS[0];

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setImageUrl(url);
      } catch {
        Alert.alert('Error', 'Failed to upload photo');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !species) {
      Alert.alert('Missing Fields', 'Name and Species are required.');
      return;
    }
    const calculatedAge = calcAge(birthDate);
    setIsSubmitting(true);
    try {
      await updatePet(pet._id, {
        name: name.trim(), species, breed,
        age: calculatedAge,
        birthDate: birthDate || undefined,
        medicalNotes, image: imageUrl,
      });
      Alert.alert('✅ Updated', `${name}'s profile has been updated.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const petInitial = name?.charAt(0).toUpperCase() || pet?.name?.charAt(0).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(236,253,245,0.85)" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Edit Pet</Text>
            <Text style={styles.headerSub}>Update {pet?.name || 'your pet'}'s profile</Text>
          </View>
          <View style={styles.headerAvatar}>
            <MaterialIcons name="edit" size={18} color={C.primaryFixedDim} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Picker */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} activeOpacity={0.85}>
              {uploading ? (
                <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor + '18' }]}>
                  <ActivityIndicator size="large" color={C.primary} />
                </View>
              ) : imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor + '18', borderColor: avatarColor + '44' }]}>
                  <Text style={[styles.avatarInitial, { color: avatarColor }]}>{petInitial}</Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Field label="Pet Name *" icon="text-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. Buddy"
                placeholderTextColor={C.outlineVariant}
                value={name}
                onChangeText={setName}
              />
            </Field>

            <Field label="Species *" icon="paw-outline">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {SPECIES_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, species === s && styles.chipActive]}
                    onPress={() => setSpecies(s)}
                  >
                    <Text style={[styles.chipText, species === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Or type custom species…"
                placeholderTextColor={C.outlineVariant}
                value={species}
                onChangeText={setSpecies}
              />
            </Field>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Breed" icon="ribbon-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Labrador"
                    placeholderTextColor={C.outlineVariant}
                    value={breed}
                    onChangeText={setBreed}
                  />
                </Field>
              </View>
            </View>

            <Field label="Date of Birth" icon="calendar-outline">
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowBirthDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={16} color={birthDate ? C.primary : C.outline} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dateBtnText, !birthDate && styles.dateBtnPlaceholder]}>
                    {formatDisplayDate(birthDate)}
                  </Text>
                  {birthDate && (
                    <Text style={styles.dateBtnAge}>
                      Age: {formatAge(birthDate)}
                    </Text>
                  )}
                </View>
                {birthDate && (
                  <TouchableOpacity onPress={() => setBirthDate('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={18} color={C.outline} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Field>

            <Field label="Medical Notes / Allergies" icon="medical-outline">
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any health conditions, allergies, or notes…"
                placeholderTextColor={C.outlineVariant}
                value={medicalNotes}
                onChangeText={setMedicalNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={showBirthDatePicker}
        value={birthDate}
        label="Date of Birth"
        onConfirm={(iso) => { setBirthDate(iso); setShowBirthDatePicker(false); }}
        onCancel={() => setShowBirthDatePicker(false)}
      />
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(120,216,184,0.65)', textAlign: 'center', marginTop: 2 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },

  photoSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: C.primary },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed',
  },
  avatarInitial: { fontSize: 36, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  photoHint: { fontSize: 12, color: C.outline, fontWeight: '500' },

  form: { gap: 20 },
  field: { gap: 10 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fieldLabelText: { fontSize: 12, fontWeight: '800', color: C.primary, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    height: 52, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 14,
    paddingHorizontal: 16, fontSize: 15, color: C.onSurface, backgroundColor: C.surfaceLowest,
  },
  textArea: { height: 110, paddingTop: 14 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
    backgroundColor: C.surfaceHigh, borderWidth: 1.5, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: C.onPrimaryContainer, borderColor: C.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: C.outline },
  chipTextActive: { color: C.primary, fontWeight: '800' },
  row: { flexDirection: 'row' },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.surfaceLowest,
  },
  dateBtnText: { fontSize: 14, fontWeight: '600', color: C.onSurface },
  dateBtnPlaceholder: { color: C.outlineVariant, fontWeight: '400' },
  dateBtnAge: { fontSize: 12, color: C.primary, fontWeight: '700', marginTop: 2 },
  submitBtn: {
    marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.primary, height: 60, borderRadius: 99,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8,
  },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});

export default EditPetScreen;
