import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { isValidEmail, isValidPassword, isValidPhone } from '../../utils/validators';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryFixed: '#ffdcc4',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
};



const RegisterScreen = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { registerUser } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in name, email, and password.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number or leave it blank.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(name.trim(), email.trim().toLowerCase(), password, 'User', phone.trim());
    } catch (e) {
      Alert.alert('Registration Failed', e?.response?.data?.message || 'Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="rgba(236,253,245,0.85)" />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Create Account</Text>
        <Text style={styles.heroSub}>Create your Pet Parent account to get started 🐾</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[styles.formContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="person" size={18} color={C.outline} style={{ marginRight: 10 }} />
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={C.outlineVariant} returnKeyType="next" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="email" size={18} color={C.outline} style={{ marginRight: 10 }} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={C.outlineVariant} autoCapitalize="none" keyboardType="email-address" returnKeyType="next" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="phone" size={18} color={C.outline} style={{ marginRight: 10 }} />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+60xxxxxxxxx" placeholderTextColor={C.outlineVariant} keyboardType="phone-pad" returnKeyType="next" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="lock" size={18} color={C.outline} style={{ marginRight: 10 }} />
              <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Min. 6 characters" placeholderTextColor={C.outlineVariant} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <MaterialIcons name={showPw ? 'visibility-off' : 'visibility'} size={18} color={C.outline} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pet Parent notice */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeIconBox}>
              <MaterialIcons name="pets" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Pet Parent Account</Text>
              <Text style={styles.noticeDesc}>This registration is for pet owners only. Service providers (vets, groomers, sitters, shop managers) are created by an administrator.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.registerBtnText}>Create Account</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginRowText}>Already have an account? </Text>
            <Text style={styles.loginRowLink}>Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  hero: { backgroundColor: C.emeraldDark, paddingHorizontal: 24, paddingBottom: 32, overflow: 'hidden', position: 'relative' },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,104,80,0.4)', top: -50, right: -30 },
  heroCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(120,216,184,0.12)', bottom: -30, left: -20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { fontSize: 15, color: 'rgba(236,253,245,0.7)' },
  formScroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16 },
  formContent: { paddingHorizontal: 24, paddingTop: 28 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, marginBottom: 8 },
  optional: { fontWeight: '400', color: C.outline },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  input: { flex: 1, fontSize: 15, color: C.onSurface },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: C.onPrimaryContainer, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1.5, borderColor: C.primaryFixedDim },
  noticeIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 4 },
  noticeDesc: { fontSize: 12, color: C.onSurfaceVariant, lineHeight: 18 },
  registerBtn: { backgroundColor: C.primary, height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  registerBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginRowText: { fontSize: 14, color: C.outline },
  loginRowLink: { fontSize: 14, color: C.primary, fontWeight: '700' },
});

export default RegisterScreen;
