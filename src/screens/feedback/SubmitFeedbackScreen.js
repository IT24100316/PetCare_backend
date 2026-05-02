import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { submitFeedback, updateFeedback } from '../../api/feedbackApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
};

const SERVICES = [
  { key: 'Vet',      icon: 'medical-services', label: 'Vet' },
  { key: 'Grooming', icon: 'content-cut',       label: 'Grooming' },
  { key: 'Boarding', icon: 'home-filled',        label: 'Boarding' },
  { key: 'PetShop',  icon: 'store',             label: 'Pet Shop' },
];

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

const SubmitFeedbackScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editData = route.params?.editFeedback;
  
  const [serviceType, setServiceType] = useState(editData?.serviceType || 'Vet');
  const [rating, setRating] = useState(editData?.rating || 5);
  const [comment, setComment] = useState(editData?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Missing Comment', 'Please write something about your experience.');
      return;
    }
    setSubmitting(true);
    try {
      if (editData) {
        await updateFeedback(editData._id, { serviceType, rating, comment });
        Alert.alert('🎉 Updated!', 'Your feedback has been updated.', [
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      } else {
        await submitFeedback({ serviceType, rating, comment });
        Alert.alert('🎉 Thank you!', 'Your feedback has been submitted.', [
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
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
          <View>
            <Text style={styles.headerTitle}>{editData ? 'Edit Review' : 'Leave a Review'}</Text>
            <Text style={styles.headerSub}>{editData ? 'Update your feedback' : 'Your experience matters to us'}</Text>
          </View>
          <View style={styles.headerAvatar}>
            <MaterialIcons name="rate-review" size={20} color={C.primaryFixedDim} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid-outline" size={15} color={C.primary} />
              <Text style={styles.sectionLabel}>SERVICE RECEIVED</Text>
            </View>
            <View style={styles.serviceGrid}>
              {SERVICES.map(svc => {
                const active = serviceType === svc.key;
                return (
                  <TouchableOpacity
                    key={svc.key}
                    style={[styles.serviceChip, active && styles.serviceChipActive]}
                    onPress={() => setServiceType(svc.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.serviceIcon, active && styles.serviceIconActive]}>
                      <MaterialIcons name={svc.icon} size={20} color={active ? '#fff' : C.outline} />
                    </View>
                    <Text style={[styles.serviceChipText, active && styles.serviceChipTextActive]}>
                      {svc.label}
                    </Text>
                    {active && (
                      <View style={styles.serviceCheckmark}>
                        <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Star Rating */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={15} color={C.primary} />
              <Text style={styles.sectionLabel}>YOUR RATING</Text>
            </View>
            <View style={styles.ratingCard}>
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                    <Ionicons
                      name={i <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={i <= rating ? '#f59e0b' : C.outlineVariant}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingHint}>Tap a star to rate</Text>
            </View>
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-outline" size={15} color={C.primary} />
              <Text style={styles.sectionLabel}>YOUR REVIEW</Text>
            </View>
            <View style={styles.commentCard}>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder={`Tell us about your ${serviceType} experience…`}
                placeholderTextColor={C.outlineVariant}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{comment.length} chars</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>{editData ? 'Update Feedback' : 'Submit Feedback'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(120,216,184,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(120,216,184,0.65)', textAlign: 'center', marginTop: 2 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(120,216,184,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 1.6, textTransform: 'uppercase' },

  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.surfaceLowest, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.outlineVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  serviceChipActive: { borderColor: C.primary, backgroundColor: C.onPrimaryContainer },
  serviceIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center',
  },
  serviceIconActive: { backgroundColor: C.primary },
  serviceChipText: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  serviceChipTextActive: { color: C.primary, fontWeight: '800' },
  serviceCheckmark: { marginLeft: 2 },

  ratingCard: {
    backgroundColor: C.surfaceLowest, borderRadius: 20, paddingVertical: 28,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ratingLabel: { fontSize: 20, fontWeight: '800', color: C.onSurface, minHeight: 28 },
  starsRow: { flexDirection: 'row', gap: 6 },
  star: { padding: 4 },
  ratingHint: { fontSize: 12, color: C.outline, fontWeight: '500' },

  commentCard: {
    backgroundColor: C.surfaceLowest, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.outlineVariant,
    overflow: 'hidden',
  },
  commentInput: {
    padding: 16, fontSize: 15, color: C.onSurface,
    minHeight: 140, textAlignVertical: 'top', lineHeight: 22,
  },
  charCount: {
    textAlign: 'right', fontSize: 11, color: C.outlineVariant,
    fontWeight: '600', paddingHorizontal: 16, paddingBottom: 10,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.primary, height: 60, borderRadius: 99,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 8,
  },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});

export default SubmitFeedbackScreen;
