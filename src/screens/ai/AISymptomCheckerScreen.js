import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar, Animated, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getPets } from '../../api/petApi';
import { analyzeSymptoms } from '../../api/aiApi';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  error: '#ba1a1a', errorContainer: '#ffdad6',
};

const URGENCY_CONFIG = {
  Low:       { color: '#059669', bg: '#ecfdf5', icon: 'checkmark-circle', label: 'Low Urgency' },
  Medium:    { color: '#d97706', bg: '#fffbeb', icon: 'alert-circle',    label: 'Medium Urgency' },
  High:      { color: '#dc2626', bg: '#fef2f2', icon: 'warning',         label: 'High Urgency' },
  Emergency: { color: '#991b1b', bg: '#fef2f2', icon: 'flame',           label: '⚠ Emergency' },
};

const PET_COLORS = ['#148367', '#8e4e14', '#9f3a21', '#006850', '#783d01'];

const SAMPLE_PROMPTS = [
  "My dog has been scratching ears a lot",
  "Cat not eating for 2 days",
  "Puppy is vomiting after meals",
  "My parrot is losing feathers",
];

const AISymptomCheckerScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Pulse animation for the AI brain icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { fetchPets(); }, []);

  useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading]);

  const fetchPets = async () => {
    try {
      const data = await getPets();
      setPets(data);
      if (data?.length > 0) setSelectedPet(data[0]);
    } catch {} finally { setLoadingPets(false); }
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await analyzeSymptoms(
        symptoms.trim(),
        selectedPet?.name || 'Unknown',
        selectedPet?.species || 'Unknown'
      );
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSymptoms('');
  };

  const analysis = result?.analysis;
  const urgency = analysis ? (URGENCY_CONFIG[analysis.urgencyLabel] || URGENCY_CONFIG.Medium) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={C.primaryFixedDim} />
            <Text style={styles.aiBadgeText}>AI POWERED</Text>
          </View>
          <Text style={styles.headerTitle}>Pet Health Check</Text>
        </View>
        <View style={styles.headerAvatar}>
          <MaterialIcons name="psychology" size={20} color={C.primaryFixedDim} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 30, 50) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroContent}>
            <Animated.View style={[styles.heroBrain, { transform: [{ scale: loading ? pulseAnim : 1 }] }]}>
              <MaterialIcons name="psychology" size={48} color="rgba(120,216,184,0.6)" />
            </Animated.View>
            <Text style={styles.heroTitle}>
              {loading ? 'Analyzing...' : result ? 'Analysis Complete' : "What's troubling your pet?"}
            </Text>
            <Text style={styles.heroSub}>
              {loading
                ? 'Our AI is reviewing the symptoms'
                : result
                  ? 'Review the findings below'
                  : 'Describe symptoms and our AI will help assess the situation'}
            </Text>
          </View>
        </View>

        {/* Show results or input form */}
        {result ? (
          <>
            {/* Urgency Banner */}
            <View style={[styles.urgencyBanner, { backgroundColor: urgency.bg, borderLeftColor: urgency.color }]}>
              <View style={[styles.urgencyIconBox, { backgroundColor: urgency.color + '20' }]}>
                <Ionicons name={urgency.icon} size={24} color={urgency.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.urgencyLabel, { color: urgency.color }]}>{urgency.label}</Text>
                <View style={styles.urgencyBar}>
                  <View style={[styles.urgencyBarFill, {
                    width: `${(analysis.urgencyLevel / 10) * 100}%`,
                    backgroundColor: urgency.color,
                  }]} />
                </View>
                <Text style={styles.urgencyScore}>{analysis.urgencyLevel}/10 severity</Text>
              </View>
            </View>

            {/* Possible Conditions */}
            {analysis.possibleConditions?.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Ionicons name="search-circle" size={20} color={C.primary} />
                  <Text style={styles.resultCardTitle}>Possible Conditions</Text>
                </View>
                {analysis.possibleConditions.map((c, i) => (
                  <View key={i} style={styles.conditionRow}>
                    <View style={styles.conditionDot} />
                    <Text style={styles.conditionText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendation */}
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="bulb" size={20} color={C.secondary} />
                <Text style={styles.resultCardTitle}>Recommendation</Text>
              </View>
              <Text style={styles.recommendationText}>{analysis.recommendation}</Text>
              {analysis.vetTimeframe && (
                <View style={styles.timeframePill}>
                  <Ionicons name="time-outline" size={13} color={urgency.color} />
                  <Text style={[styles.timeframeText, { color: urgency.color }]}>
                    Vet Visit: {analysis.vetTimeframe}
                  </Text>
                </View>
              )}
            </View>

            {/* Home Care Tips */}
            {analysis.homeCare?.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Ionicons name="heart-circle" size={20} color="#059669" />
                  <Text style={styles.resultCardTitle}>Home Care Tips</Text>
                </View>
                {analysis.homeCare.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.tipNumber}>{i + 1}</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Book Vet shortcut */}
            {analysis.shouldSeeVet && (
              <TouchableOpacity
                style={styles.bookVetBtn}
                onPress={() => navigation.navigate('VetBooking')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="medical-services" size={22} color="#fff" />
                <Text style={styles.bookVetText}>Book a Vet Appointment</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={C.outline} />
              <Text style={styles.disclaimerText}>
                {result.disclaimer}
              </Text>
            </View>

            {/* Reset */}
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={18} color={C.primary} />
              <Text style={styles.resetText}>Ask Another Question</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Pet Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SELECT PET</Text>
              {loadingPets ? <ActivityIndicator color={C.primary} /> : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {pets.map((pet, idx) => {
                    const active = selectedPet?._id === pet._id;
                    const color = PET_COLORS[idx % PET_COLORS.length];
                    return (
                      <TouchableOpacity
                        key={pet._id}
                        style={[styles.petPill, active && styles.petPillActive]}
                        onPress={() => setSelectedPet(pet)}
                      >
                        <View style={[styles.petAvatar, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : color + '22' }]}>
                          <Text style={[styles.petInitial, { color: active ? '#fff' : color }]}>
                            {pet.name?.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.petName, active && styles.petNameActive]}>{pet.name}</Text>
                          <Text style={[styles.petSpecies, active && { color: 'rgba(255,255,255,0.7)' }]}>
                            {pet.species || 'Pet'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Symptom Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DESCRIBE SYMPTOMS</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.textInput}
                  placeholder={`What's wrong with ${selectedPet?.name || 'your pet'}? Describe what you've noticed...`}
                  placeholderTextColor={C.outlineVariant}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={symptoms}
                  onChangeText={setSymptoms}
                />
                <Text style={styles.charCount}>{symptoms.length} characters</Text>
              </View>
            </View>

            {/* Quick Prompts */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>OR TRY A QUICK PROMPT</Text>
              <View style={styles.promptGrid}>
                {SAMPLE_PROMPTS.map((prompt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.promptChip}
                    onPress={() => setSymptoms(prompt)}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.primary} />
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={20} color={C.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Analyze Button */}
            <TouchableOpacity
              style={[styles.analyzeBtn, (!symptoms.trim() || loading) && styles.analyzeBtnOff]}
              onPress={handleAnalyze}
              disabled={!symptoms.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="psychology" size={24} color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(120,216,184,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginBottom: 4 },
  aiBadgeText: { color: C.primaryFixedDim, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.18)', justifyContent: 'center', alignItems: 'center' },

  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Hero
  hero: { height: 170, backgroundColor: C.emeraldDark, borderRadius: 24, marginTop: 16, overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(120,216,184,0.08)', top: -60, right: -40 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(120,216,184,0.06)', bottom: -50, left: -30 },
  heroContent: { alignItems: 'center', padding: 20 },
  heroBrain: { marginBottom: 10 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(120,216,184,0.7)', textAlign: 'center', lineHeight: 19 },

  // Sections
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 1.6, marginBottom: 12 },

  // Pet selector
  petPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLowest, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  petPillActive: { backgroundColor: C.primary },
  petAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  petInitial: { fontSize: 14, fontWeight: '800' },
  petName: { fontSize: 13, fontWeight: '700', color: C.onSurface },
  petNameActive: { color: '#fff' },
  petSpecies: { fontSize: 10, color: C.outline, fontWeight: '500' },

  // Input
  inputCard: { backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: C.outlineVariant + '60', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  textInput: { fontSize: 15, color: C.onSurface, minHeight: 120, lineHeight: 22, fontWeight: '500' },
  charCount: { fontSize: 11, color: C.outlineVariant, textAlign: 'right', marginTop: 8 },

  // Quick prompts
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  promptChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: C.primary + '25' },
  promptText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Analyze button
  analyzeBtn: { backgroundColor: C.emeraldDark, height: 58, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 28, shadowColor: C.emeraldDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  analyzeBtnOff: { backgroundColor: C.outlineVariant, shadowOpacity: 0, elevation: 0 },
  analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Error
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.errorContainer, borderRadius: 14, padding: 14, marginTop: 16 },
  errorText: { fontSize: 13, color: C.error, fontWeight: '600', flex: 1 },

  // ─── Results ──────────────────────────────────────────────────────────────

  // Urgency banner
  urgencyBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20, padding: 16, borderRadius: 18, borderLeftWidth: 5 },
  urgencyIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  urgencyLabel: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  urgencyBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' },
  urgencyBarFill: { height: '100%', borderRadius: 3 },
  urgencyScore: { fontSize: 11, color: C.outline, marginTop: 4, fontWeight: '600' },

  // Result cards
  resultCard: { backgroundColor: C.surfaceLowest, borderRadius: 18, padding: 18, marginTop: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  resultCardTitle: { fontSize: 15, fontWeight: '800', color: C.onSurface },

  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  conditionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  conditionText: { fontSize: 14, color: C.onSurfaceVariant, fontWeight: '500', flex: 1 },

  recommendationText: { fontSize: 14, color: C.onSurfaceVariant, lineHeight: 22, fontWeight: '500' },
  timeframePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: C.surfaceLow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start' },
  timeframeText: { fontSize: 12, fontWeight: '700' },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  tipNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#059669' + '18', textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '800', color: '#059669' },
  tipText: { fontSize: 14, color: C.onSurfaceVariant, fontWeight: '500', flex: 1, lineHeight: 21 },

  // Book vet button
  bookVetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#dc2626', height: 56, borderRadius: 99, marginTop: 18, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  bookVetText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Disclaimer
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.surfaceLow, borderRadius: 14, padding: 14, marginTop: 18 },
  disclaimerText: { fontSize: 11, color: C.outline, lineHeight: 17, flex: 1, fontWeight: '500' },

  // Reset
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 10 },
  resetText: { fontSize: 14, fontWeight: '700', color: C.primary },
});

export default AISymptomCheckerScreen;
