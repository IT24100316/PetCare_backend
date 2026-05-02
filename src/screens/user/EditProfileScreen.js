import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { getProfile, updateProfile, changePassword, uploadImage } from '../../api/userApi';
import { AuthContext } from '../../context/AuthContext';
import { isValidEmail, isValidPhone, isValidPassword } from '../../utils/validators';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryFixed: '#ffdcc4',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  error: '#ba1a1a', errorContainer: '#ffdad6', onErrorContainer: '#410002',
};

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState('profile');
  const navigation = useNavigation();
  const { logoutUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setProfileImage(data.profileImage || '');
      } catch { Alert.alert('Error', 'Failed to load profile'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const ext = filename.split('.').pop();
        formData.append('image', { uri, name: filename, type: `image/${ext}` });
        const uploadResult = await uploadImage(formData);
        setProfileImage(uploadResult.imageUrl);
      } catch { Alert.alert('Error', 'Failed to upload image'); }
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and Email cannot be empty.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, email, phone, profileImage });
      Alert.alert('✅ Success', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { Alert.alert('Error', 'Fill in all password fields'); return; }
    if (newPassword !== confirmNewPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (!isValidPassword(newPassword)) { Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return; }
    try {
      await changePassword({ oldPassword, newPassword });
      Alert.alert('Success', 'Password changed. Please log in again.', [{ text: 'OK', onPress: logoutUser }]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <MaterialIcons name="logout" size={18} color="#ba1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <MaterialIcons name="camera-alt" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{name || 'Pet Parent'}</Text>
          <Text style={styles.avatarEmail}>{email}</Text>
        </View>

        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, section === 'profile' && styles.sectionTabActive]}
            onPress={() => setSection('profile')}
          >
            <Text style={[styles.sectionTabText, section === 'profile' && styles.sectionTabTextActive]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, section === 'password' && styles.sectionTabActive]}
            onPress={() => setSection('password')}
          >
            <Text style={[styles.sectionTabText, section === 'password' && styles.sectionTabTextActive]}>Security</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, section === 'activity' && styles.sectionTabActive]}
            onPress={() => setSection('activity')}
          >
            <Text style={[styles.sectionTabText, section === 'activity' && styles.sectionTabTextActive]}>Activity</Text>
          </TouchableOpacity>
        </View>

        {section === 'profile' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="person" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.outlineVariant} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="email" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="your@email.com" placeholderTextColor={C.outlineVariant} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="phone" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+60xxxxxxxxx" placeholderTextColor={C.outlineVariant} />
              </View>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}

        {section === 'password' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} secureTextEntry placeholder="Enter current password" placeholderTextColor={C.outlineVariant} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New password" placeholderTextColor={C.outlineVariant} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={18} color={C.outline} style={styles.inputIcon} />
                <TextInput style={styles.input} value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry placeholder="Confirm password" placeholderTextColor={C.outlineVariant} />
              </View>
            </View>
            <TouchableOpacity style={styles.pwBtn} onPress={handleChangePassword} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}

        {section === 'activity' && (
          <View style={styles.formCard}>
            <TouchableOpacity style={styles.activityRow} onPress={() => navigation.navigate('MyBookings')}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(0,104,80,0.1)' }]}>
                <MaterialIcons name="calendar-today" size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>My Bookings</Text>
                <Text style={styles.activityDesc}>View all your appointments</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.activityRow} onPress={() => navigation.navigate('MyOrders')}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(142,78,20,0.1)' }]}>
                <MaterialIcons name="shopping-bag" size={20} color={C.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>My Orders</Text>
                <Text style={styles.activityDesc}>Track your pet shop orders</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.activityRow} onPress={() => navigation.navigate('FeedbackWall')}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(20,131,103,0.1)' }]}>
                <MaterialIcons name="star" size={20} color={C.primaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>Leave Feedback</Text>
                <Text style={styles.activityDesc}>Rate your PawCare experience</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PetList')}>
          <MaterialIcons name="home" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyBookings')}>
          <MaterialIcons name="calendar-month" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductList')}>
          <MaterialIcons name="shopping-bag" size={24} color="rgba(26,28,28,0.6)" />
          <Text style={styles.navText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="person" size={24} color={C.secondary} />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(236,253,245,0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.primary },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffdad6', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: C.primaryFixedDim },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.primaryFixedDim },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#fff' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarName: { fontSize: 22, fontWeight: '800', color: C.onSurface, marginBottom: 4 },
  avatarEmail: { fontSize: 14, color: C.outline },
  sectionTabs: { flexDirection: 'row', backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 4, marginBottom: 20 },
  sectionTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  sectionTabActive: { backgroundColor: C.surfaceLowest, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  sectionTabText: { fontSize: 13, fontWeight: '600', color: C.outline },
  sectionTabTextActive: { color: C.primary, fontWeight: '800' },
  formCard: { backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20, shadowColor: C.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, gap: 4 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 12, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 15, color: C.onSurface },
  saveBtn: { backgroundColor: C.primary, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  pwBtn: { backgroundColor: C.secondary, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: C.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  activityIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface, marginBottom: 2 },
  activityDesc: { fontSize: 13, color: C.outline },
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


export default EditProfileScreen;
