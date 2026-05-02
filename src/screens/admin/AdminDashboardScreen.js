import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getAllUsers, blockUser, createServiceProvider } from '../../api/adminApi';
import { getAllFeedback, deleteFeedback } from '../../api/feedbackApi';
import { AuthContext } from '../../context/AuthContext';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const ROLES = ['Vet', 'Groomer', 'BoardingManager', 'ShopOwner', 'Admin'];

const ROLE_CONFIG = {
  User:           { bg: '#eff6ff', text: '#1e40af', icon: 'person' },
  Vet:            { bg: '#f0fdf4', text: '#15803d', icon: 'medical-services' },
  Groomer:        { bg: '#fdf4ff', text: '#7e22ce', icon: 'content-cut' },
  BoardingManager:{ bg: '#fff7ed', text: '#c2410c', icon: 'home' },
  ShopOwner:      { bg: '#fefce8', text: '#a16207', icon: 'store' },
  Admin:          { bg: '#fef2f2', text: '#991b1b', icon: 'admin-panel-settings' },
};

const TABS = ['Users', 'Feedback', 'Add Provider'];

const AdminDashboardScreen = () => {
  const [tab, setTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerPassword, setProviderPassword] = useState('');
  const [providerRole, setProviderRole] = useState('Vet');
  const [creatingProvider, setCreatingProvider] = useState(false);

  const { logoutUser } = useContext(AuthContext);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'Users') {
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else if (tab === 'Feedback') {
        const data = await getAllFeedback();
        setFeedbacks(Array.isArray(data) ? data : data.feedbacks || []);
      }
    } catch {
      Alert.alert('Error', `Failed to fetch ${tab.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleBlockUser = async (id) => {
    try {
      await blockUser(id);
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to toggle user block status');
    }
  };

  const handleDeleteFeedback = async (id) => {
    Alert.alert('Delete Feedback', 'Remove this review permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeedback(id);
            fetchData();
          } catch {
            Alert.alert('Error', 'Failed to delete feedback');
          }
        },
      },
    ]);
  };

  const handleCreateProvider = async () => {
    if (!providerName || !providerEmail || !providerPassword || !providerRole) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setCreatingProvider(true);
    try {
      await createServiceProvider({ name: providerName, email: providerEmail, password: providerPassword, role: providerRole });
      Alert.alert('✅ Created', 'Service provider account created!');
      setProviderName('');
      setProviderEmail('');
      setProviderPassword('');
      setTab('Users');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create provider');
    } finally {
      setCreatingProvider(false);
    }
  };

  /* ─── Render User Card ─── */
  const renderUser = ({ item }) => {
    const rc = ROLE_CONFIG[item.role] || ROLE_CONFIG.User;
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[styles.userAvatar, { backgroundColor: rc.bg }]}>
            <MaterialIcons name={rc.icon} size={20} color={rc.text} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
            <Text style={[styles.roleBadgeText, { color: rc.text }]}>{item.role}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.userStatusRow}>
          <View style={[styles.statusDotBig, { backgroundColor: item.isBlocked ? C.error : '#10b981' }]} />
          <Text style={[styles.userStatusText, { color: item.isBlocked ? C.error : '#065f46' }]}>
            {item.isBlocked ? 'Blocked' : 'Active'}
          </Text>
          {item.role !== 'Admin' && (
            <TouchableOpacity
              style={[styles.blockBtn, item.isBlocked ? styles.unblockBtnStyle : styles.blockBtnStyle]}
              onPress={() => handleBlockUser(item._id)}
            >
              <Ionicons name={item.isBlocked ? 'lock-open-outline' : 'lock-closed-outline'} size={14} color={item.isBlocked ? C.primary : C.error} />
              <Text style={[styles.blockBtnText, { color: item.isBlocked ? C.primary : C.error }]}>
                {item.isBlocked ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /* ─── Render Feedback Card ─── */
  const renderFeedback = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.feedbackAvatar}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.secondary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardName}>{item.serviceType || 'General'}</Text>
          <Text style={styles.cardEmail}>{item.user?.email || 'Anonymous'}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{item.rating}/5</Text>
        </View>
      </View>

      {item.comment && (
        <View style={styles.commentBox}>
          <Text style={styles.commentText}>"{item.comment}"</Text>
        </View>
      )}

      <View style={styles.feedbackFooter}>
        <TouchableOpacity style={styles.deleteFeedbackBtn} onPress={() => handleDeleteFeedback(item._id)}>
          <Ionicons name="trash-outline" size={14} color={C.error} />
          <Text style={styles.deleteFeedbackText}>Remove Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ─── Render Add Provider Form ─── */
  const renderAddProvider = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <View style={styles.formIconBubble}>
              <MaterialIcons name="person-add" size={22} color={C.primary} />
            </View>
            <View>
              <Text style={styles.formCardTitle}>New Provider</Text>
              <Text style={styles.formCardSub}>Create a staff account</Text>
            </View>
          </View>

          <View style={styles.formDivider} />

          {/* Name */}
          <View style={styles.formField}>
            <View style={styles.formFieldLabel}>
              <Ionicons name="person-outline" size={13} color={C.primary} />
              <Text style={styles.formFieldLabelText}>Full Name</Text>
            </View>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Dr. Sarah Kim"
              placeholderTextColor={C.outlineVariant}
              value={providerName}
              onChangeText={setProviderName}
            />
          </View>

          {/* Email */}
          <View style={styles.formField}>
            <View style={styles.formFieldLabel}>
              <Ionicons name="mail-outline" size={13} color={C.primary} />
              <Text style={styles.formFieldLabelText}>Email Address</Text>
            </View>
            <TextInput
              style={styles.formInput}
              placeholder="staff@pawcare.com"
              placeholderTextColor={C.outlineVariant}
              value={providerEmail}
              onChangeText={setProviderEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View style={styles.formField}>
            <View style={styles.formFieldLabel}>
              <Ionicons name="lock-closed-outline" size={13} color={C.primary} />
              <Text style={styles.formFieldLabelText}>Password</Text>
            </View>
            <TextInput
              style={styles.formInput}
              placeholder="Minimum 8 characters"
              placeholderTextColor={C.outlineVariant}
              value={providerPassword}
              onChangeText={setProviderPassword}
              secureTextEntry
            />
          </View>

          {/* Role */}
          <View style={styles.formField}>
            <View style={styles.formFieldLabel}>
              <Ionicons name="briefcase-outline" size={13} color={C.primary} />
              <Text style={styles.formFieldLabelText}>Role</Text>
            </View>
            <View style={styles.rolesContainer}>
              {ROLES.map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleChip, providerRole === role && styles.roleChipActive]}
                  onPress={() => setProviderRole(role)}
                >
                  <Text style={[styles.roleChipText, providerRole === role && styles.roleChipTextActive]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, creatingProvider && { opacity: 0.7 }]}
            onPress={handleCreateProvider}
            disabled={creatingProvider}
            activeOpacity={0.85}
          >
            {creatingProvider ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const tabCounts = { Users: users.length, Feedback: feedbacks.length, 'Add Provider': null };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadge}>
            <MaterialIcons name="admin-panel-settings" size={13} color={C.primaryFixedDim} />
            <Text style={styles.headerBadgeText}>Admin Portal</Text>
          </View>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Ionicons name="log-out-outline" size={20} color="rgba(236,253,245,0.75)" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{users.length}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(120,216,184,0.15)' }]}>
          <Text style={styles.statNum}>{users.filter(u => u.isBlocked).length}</Text>
          <Text style={styles.statLabel}>Blocked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{feedbacks.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'Add Provider' ? '+ Provider' : t}
            </Text>
            {tabCounts[t] !== null && tabCounts[t] > 0 && (
              <View style={[styles.tabBadge, tab === t && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tab === t && { color: C.primary }]}>{tabCounts[t]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'Add Provider' ? (
        renderAddProvider()
      ) : loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60, flex: 1, backgroundColor: C.surface }} />
      ) : tab === 'Users' ? (
        <FlatList
          data={users}
          keyExtractor={item => item._id?.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={56} color={C.outlineVariant} />
              <Text style={styles.emptyTitle}>No users found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={item => item._id?.toString()}
          renderItem={renderFeedback}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="rate-review" size={56} color={C.outlineVariant} />
              <Text style={styles.emptyTitle}>No feedback yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerBadgeText: { color: C.primaryFixedDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: 22, marginBottom: 4, backgroundColor: 'rgba(120,216,184,0.08)', borderRadius: 16, overflow: 'hidden' },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(120,216,184,0.7)', fontWeight: '600', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: C.surface, marginTop: 16, paddingHorizontal: 18, paddingTop: 14, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surfaceHigh },
  tabActive: { backgroundColor: C.primary + '18', borderWidth: 1.5, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: C.outline },
  tabTextActive: { color: C.primary, fontWeight: '800' },
  tabBadge: { backgroundColor: C.outlineVariant, borderRadius: 99, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  tabBadgeActive: { backgroundColor: C.primary + '22' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.outline },
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, backgroundColor: C.surface },

  /* User Card */
  card: { backgroundColor: C.surfaceLowest, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '800', color: C.onSurface, marginBottom: 2 },
  cardEmail: { fontSize: 12, color: C.outline },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: C.surfaceHigh, marginHorizontal: 16 },
  userStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  statusDotBig: { width: 8, height: 8, borderRadius: 4 },
  userStatusText: { fontSize: 13, fontWeight: '600', flex: 1 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5 },
  blockBtnStyle: { borderColor: C.errorContainer, backgroundColor: C.errorContainer },
  unblockBtnStyle: { borderColor: C.primary + '40', backgroundColor: C.primary + '12' },
  blockBtnText: { fontSize: 12, fontWeight: '700' },

  /* Feedback Card */
  feedbackAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.secondary + '14', justifyContent: 'center', alignItems: 'center' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#92400e' },
  commentBox: { marginHorizontal: 16, marginBottom: 4, backgroundColor: C.surfaceLow, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: C.secondary },
  commentText: { fontSize: 13, color: C.onSurfaceVariant, fontStyle: 'italic', lineHeight: 20 },
  feedbackFooter: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  deleteFeedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: C.errorContainer, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  deleteFeedbackText: { fontSize: 12, fontWeight: '700', color: C.error },

  /* Add Provider Form */
  formContainer: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48, backgroundColor: C.surface, flexGrow: 1 },
  formCard: { backgroundColor: C.surfaceLowest, borderRadius: 24, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  formCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  formIconBubble: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center' },
  formCardTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface },
  formCardSub: { fontSize: 12, color: C.outline, marginTop: 2 },
  formDivider: { height: 1, backgroundColor: C.surfaceHigh, marginBottom: 20 },
  formField: { gap: 8, marginBottom: 16 },
  formFieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  formFieldLabelText: { fontSize: 11, fontWeight: '800', color: C.onSurfaceVariant, letterSpacing: 0.6, textTransform: 'uppercase' },
  formInput: { height: 52, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: C.onSurface, backgroundColor: C.surfaceLowest },
  rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surfaceHigh, borderWidth: 1.5, borderColor: 'transparent' },
  roleChipActive: { backgroundColor: C.primary + '14', borderColor: C.primary },
  roleChipText: { fontSize: 13, fontWeight: '600', color: C.outline },
  roleChipTextActive: { color: C.primary, fontWeight: '800' },
  submitBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, height: 58, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  /* Empty */
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, backgroundColor: C.surface },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 16 },
});

export default AdminDashboardScreen;
