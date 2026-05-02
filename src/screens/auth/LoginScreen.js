import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validators';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryFixed: '#ffdcc4',
  secondaryContainer: '#ffab69', surface: '#faf9f8', surfaceHigh: '#e9e8e7',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
};

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { loginUser } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim().toLowerCase(), password);
    } catch (e) {
      Alert.alert('Login Failed', e?.response?.data?.message || 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Top Emerald Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.heroPaw}>
          <MaterialIcons name="pets" size={48} color="rgba(120,216,184,0.25)" />
        </View>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={styles.heroBadge}>
          <Ionicons name="paw" size={14} color={C.primaryFixedDim} />
          <Text style={styles.heroBadgeText}>PawCare</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome{'\n'}Back!</Text>
        <Text style={styles.heroSub}>Sign in to continue caring for your pets</Text>
      </View>

      {/* Form Card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[styles.formContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="email" size={18} color={C.outline} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={C.outlineVariant}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="lock" size={18} color={C.outline} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={C.outlineVariant}
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <MaterialIcons name={showPw ? 'visibility-off' : 'visibility'} size={18} color={C.outline} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>Create an Account</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            By signing in, you agree to PawCare's Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  hero: {
    backgroundColor: C.emeraldDark, paddingHorizontal: 28, paddingBottom: 36,
    overflow: 'hidden', position: 'relative',
  },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,104,80,0.4)', top: -60, right: -40 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(120,216,184,0.12)', bottom: -40, left: -20 },
  heroPaw: { position: 'absolute', right: 28, top: 80 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(120,216,184,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  heroBadgeText: { color: C.primaryFixedDim, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { fontSize: 38, fontWeight: '800', color: '#fff', lineHeight: 46, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: 'rgba(236,253,245,0.7)', lineHeight: 22 },
  formScroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  formContent: { paddingHorizontal: 24, paddingTop: 32 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  input: { flex: 1, fontSize: 15, color: C.onSurface },
  loginBtn: { backgroundColor: C.primary, height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 16, elevation: 8 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: C.outlineVariant },
  dividerText: { fontSize: 13, color: C.outline, fontWeight: '600' },
  registerBtn: { height: 54, borderRadius: 27, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { color: C.primary, fontSize: 16, fontWeight: '700' },
  footerNote: { fontSize: 12, color: C.outline, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});

export default LoginScreen;
