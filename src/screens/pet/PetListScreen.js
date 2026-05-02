import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, ScrollView, Image, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getPets } from '../../api/petApi';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const C = {
  primary: '#006850',
  primaryContainer: '#148367',
  onPrimaryContainer: '#effff6',
  secondary: '#8e4e14',
  secondaryContainer: '#ffab69',
  surface: '#faf9f8',
  surfaceHigh: '#e9e8e7',
  surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#3e4944',
  outline: '#6e7a74',
  outlineVariant: '#bdc9c3',
  emeraldDark: '#052E25',
};

const PetListScreen = () => {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { logoutUser } = useContext(AuthContext);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const data = await getPets();
      setPets(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isFocused) fetchPets(); }, [isFocused]);

  useEffect(() => { if (isFocused) fetchPets(); }, [isFocused]);

  const renderPetCard = (item) => (
    <TouchableOpacity
      key={item._id}
      style={styles.petRowCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('PetProfile', { pet: item })}
    >
      <View style={styles.petRowPhotoWrapper}>
        {item.image || item.imageUrl ? (
          <Image source={{ uri: item.image || item.imageUrl }} style={styles.petRowPhoto} />
        ) : (
          <View style={styles.petRowPlaceholder}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.petRowInfo}>
        <Text style={styles.petRowName}>{item.name}</Text>
        <Text style={styles.petRowSub}>{item.breed || item.species}</Text>
      </View>
      <View style={styles.petRowChevron}>
        <MaterialIcons name="arrow-forward" size={20} color={C.outlineVariant} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBubble}>
            <MaterialIcons name="pets" size={18} color={C.primary} />
          </View>
          <Text style={styles.headerTitle}>My Pets</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <MaterialIcons name="logout" size={20} color={C.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 120, 140) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Care Services</Text>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Featured Card: Vet */}
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('VetBooking')}
          >
            <View style={styles.featuredContent}>
              <MaterialIcons name="medical-services" size={32} color={C.onPrimaryContainer} />
              <Text style={styles.featuredTitle}>Book Vet Appointment</Text>
              <Text style={styles.featuredSub}>Certified medical care for your family members.</Text>
              {/* AI Assist small button */}
              <TouchableOpacity
                style={styles.aiAssistBtn}
                onPress={() => navigation.navigate('AISymptomChecker')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="psychology" size={14} color="#fbbf24" />
                <Text style={styles.aiAssistText}>AI Assist</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.featuredIconBg}>
              <Ionicons name="medical" size={120} color="rgba(255,255,255,0.1)" />
            </View>
          </TouchableOpacity>

          {/* 2x2 Grid below featured */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('GroomingBooking')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#d1fae5' }]}>
                  <MaterialIcons name="content-cut" size={20} color={C.primary} />
                </View>
                <MaterialIcons name="arrow-forward" size={16} color={C.outlineVariant} />
              </View>
              <View>
                <Text style={styles.gridLabel}>Grooming</Text>
                <Text style={styles.gridSub}>Spa & Styling</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('BoardingBooking')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#ffdad6' }]}>
                  <MaterialIcons name="hotel" size={20} color="#ba1a1a" />
                </View>
                <MaterialIcons name="arrow-forward" size={16} color={C.outlineVariant} />
              </View>
              <View>
                <Text style={styles.gridLabel}>Boarding</Text>
                <Text style={styles.gridSub}>Overnight Stay</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('ProductList')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#ffdcc4' }]}>
                  <MaterialIcons name="storefront" size={20} color="#8e4e14" />
                </View>
                <MaterialIcons name="arrow-forward" size={16} color={C.outlineVariant} />
              </View>
              <View>
                <Text style={styles.gridLabel}>Pet Shop</Text>
                <Text style={styles.gridSub}>Food & Toys</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('FeedbackWall')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.gridIconBox, { backgroundColor: '#e9e8e7' }]}>
                  <MaterialIcons name="rate-review" size={20} color={C.onSurfaceVariant} />
                </View>
                <MaterialIcons name="arrow-forward" size={16} color={C.outlineVariant} />
              </View>
              <View>
                <Text style={styles.gridLabel}>Reviews</Text>
                <Text style={styles.gridSub}>See Feedback</Text>
              </View>
            </TouchableOpacity>
          </View>


        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Furry Friends</Text>
            <Text style={styles.sectionSub}>Managing {pets.length} pets currently</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.petList}>
            {pets.map(item => renderPetCard(item))}
            {pets.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <MaterialIcons name="pets" size={48} color={C.outlineVariant} />
                </View>
                <Text style={styles.emptyText}>No pets added yet</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom + 90, 100) }]}
        onPress={() => navigation.navigate('AddPet')}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add New Pet</Text>
      </TouchableOpacity>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="home" size={24} color={C.secondary} />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyBookings')}>
          <MaterialIcons name="calendar-month" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductList')}>
          <MaterialIcons name="shopping-bag" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('EditProfile')}>
          <MaterialIcons name="person" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBubble: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.onPrimaryContainer, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#003328' },
  logoutBtn: { padding: 8 },

  scroll: { flex: 1, backgroundColor: C.surface },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32 },

  sectionTitle: { fontSize: 24, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  sectionSub: { fontSize: 14, color: C.outline, marginTop: 4 },
  sectionHeader: { marginTop: 40, marginBottom: 24 },

  bentoGrid: { marginTop: 24, gap: 16 },
  featuredCard: {
    width: '100%', height: 192, borderRadius: 16,
    backgroundColor: C.primaryContainer, padding: 24,
    justifyContent: 'space-between', overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  featuredContent: { zIndex: 10 },
  featuredTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 8 },
  featuredSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, maxWidth: '70%' },
  featuredIconBg: { position: 'absolute', right: -16, bottom: -16, opacity: 0.2 },
  featuredBtn: {
    zIndex: 10, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 99,
  },
  featuredBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  aiAssistBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  aiAssistText: { fontSize: 12, fontWeight: '700', color: '#fbbf24' },

  gridRow: { flexDirection: 'row', gap: 16 },
  gridCard: {
    flex: 1, aspectRatio: 1, backgroundColor: C.surfaceHigh,
    borderRadius: 16, padding: 20, justifyContent: 'space-between',
  },
  gridIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  gridLabel: { fontSize: 15, fontWeight: '800', color: C.onSurface },
  gridSub: { fontSize: 11, color: C.outline, marginTop: 2, fontWeight: '500' },

  aiCard: { backgroundColor: C.emeraldDark, borderRadius: 18, marginTop: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  aiCardContent: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  aiCardIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(120,216,184,0.2)', justifyContent: 'center', alignItems: 'center' },
  aiCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  aiCardBadgeText: { fontSize: 9, fontWeight: '800', color: '#fbbf24', letterSpacing: 1.2 },
  aiCardTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  aiCardSub: { fontSize: 12, color: 'rgba(120,216,184,0.7)', fontWeight: '500' },

  petList: { gap: 14 },
  petRowCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  petRowPhotoWrapper: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: C.surfaceHigh,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  petRowPhoto: { width: '100%', height: '100%' },
  petRowPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: C.primaryContainer + '22' },
  petRowInfo: { flex: 1, marginLeft: 16, gap: 4 },
  petRowName: { fontSize: 18, fontWeight: '800', color: C.onSurface, letterSpacing: -0.3 },
  petRowSub: { fontSize: 13, color: C.outline, fontWeight: '600' },
  petRowChevron: { padding: 8 },

  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIconBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 16, color: C.outline, fontWeight: '500' },

  fab: {
    position: 'absolute', right: 24,
    backgroundColor: C.primary, height: 56, borderRadius: 28,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 12, backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 48, borderTopRightRadius: 48,
    shadowColor: 'rgba(26,28,28,0.06)', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 1, shadowRadius: 40, elevation: 20,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99 },
  navItemActive: {
    alignItems: 'center', backgroundColor: 'rgba(142,78,20,0.1)',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99,
  },
  navText: { fontSize: 11, fontWeight: '500', color: 'rgba(26,28,28,0.6)', marginTop: 4 },
  navTextActive: { fontSize: 11, fontWeight: '600', color: C.secondary, marginTop: 4 },
});

export default PetListScreen;
