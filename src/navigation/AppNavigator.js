import React, { useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import UserNavigator from './UserNavigator';
import VetNavigator from './VetNavigator';
import GroomerDashboardScreen from '../screens/staff/GroomerDashboardScreen';
import SitterDashboardScreen from '../screens/staff/SitterDashboardScreen';
import ShopOwnerNavigator from './ShopOwnerNavigator';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import { AuthContext } from '../context/AuthContext';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
        </>
      ) : user.role === 'User' ? (
        <Stack.Screen name="UserRoot" component={UserNavigator} />
      ) : user.role === 'Vet' ? (
        <Stack.Screen name="VetRoot" component={VetNavigator} options={{ headerShown: false }} />
      ) : user.role === 'Groomer' ? (
        <Stack.Screen 
          name="GroomerDashboard" 
          component={GroomerDashboardScreen} 
          options={{ title: 'Groomer Dashboard', headerShown: false }} 
        />
      ) : user.role === 'BoardingManager' ? (
        <Stack.Screen 
          name="SitterDashboard" 
          component={SitterDashboardScreen} 
          options={{ title: 'Pet Sitter Dashboard', headerShown: false }} 
        />
      ) : user.role === 'ShopOwner' ? (
        <Stack.Screen 
          name="ShopRoot" 
          component={ShopOwnerNavigator} 
          options={{ headerShown: false }} 
        />
      ) : user.role === 'Admin' ? (
        <Stack.Screen name="AdminRoot" component={AdminDashboardScreen} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="UserRoot" component={UserNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default AppNavigator;
