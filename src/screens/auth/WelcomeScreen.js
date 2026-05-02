import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Section / Hero Image */}
      <View style={styles.topSection}>
        <Image
          source={require('../../../assets/images/dog.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Subtle overlay to ensure the image blends nicely */}
        <View style={styles.imageOverlay} />
      </View>

      {/* Bottom Content Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>

        {/* Decorative Handle */}
        <View style={styles.handleBar} />

        <View style={styles.textContainer}>
          <View style={styles.badgeContainer}>
            <MaterialIcons name="stars" size={16} color="#F5A623" />
            <Text style={styles.badgeText}>Premium Care</Text>
          </View>

          <Text style={styles.title}>Begin a Loving Journey with Your Pet</Text>
          <Text style={styles.subtitle}>Step into a journey of care, trust, and responsibility with your best friend.</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Start Your Journey</Text>
          <View style={styles.iconWrapper}>
            <Ionicons name="arrow-forward" size={24} color="#1A1C1C" />
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1C1C', // Deep premium dark background
  },
  topSection: {
    height: height * 0.58,
    width: '100%',
    backgroundColor: '#1A1C1C',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,28,28,0.3)', // Darken image slightly for premium feel
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#1A1C1C',
    marginTop: -40, // Overlap the image
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 32,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 6,
  },
  badgeText: {
    color: '#F5A623',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AABB', // Soft blue-gray
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#F5A623', // Vibrant Gold/Amber
    width: '100%',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 8,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#1A1C1C',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WelcomeScreen;
