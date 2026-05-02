import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PetListScreen from '../screens/pet/PetListScreen';
import AddPetScreen from '../screens/pet/AddPetScreen';
import VetBookingScreen from '../screens/booking/VetBookingScreen';
import GroomingBookingScreen from '../screens/booking/GroomingBookingScreen';
import BoardingBookingScreen from '../screens/booking/BoardingBookingScreen';
import ProductListScreen from '../screens/shop/ProductListScreen';
import CartScreen from '../screens/shop/CartScreen';
import FeedbackWallScreen from '../screens/feedback/FeedbackWallScreen';
import SubmitFeedbackScreen from '../screens/feedback/SubmitFeedbackScreen';
import MyBookingsScreen from '../screens/user/MyBookingsScreen';
import MyOrdersScreen from '../screens/user/MyOrdersScreen';
import EditProfileScreen from '../screens/user/EditProfileScreen';
import EditPetScreen from '../screens/pet/EditPetScreen';
import PetProfileScreen from '../screens/pet/PetProfileScreen';
import AISymptomCheckerScreen from '../screens/ai/AISymptomCheckerScreen';

const Stack = createNativeStackNavigator();

const UserNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="PetList" 
        component={PetListScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="AddPet" 
        component={AddPetScreen} 
        options={{ title: 'Add New Pet' }} 
      />
      <Stack.Screen 
        name="VetBooking" 
        component={VetBookingScreen} 
        options={{ title: 'Book Vet Appointment' }} 
      />
      <Stack.Screen 
        name="GroomingBooking" 
        component={GroomingBookingScreen} 
        options={{ title: 'Book Grooming Session' }} 
      />
      <Stack.Screen 
        name="BoardingBooking" 
        component={BoardingBookingScreen} 
        options={{ title: 'Book Boarding Stay' }} 
      />
      <Stack.Screen 
        name="ProductList" 
        component={ProductListScreen} 
        options={{ title: 'Pet Shop' }} 
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ title: 'Your Cart' }} 
      />
      <Stack.Screen 
        name="FeedbackWall" 
        component={FeedbackWallScreen} 
        options={{ title: 'Reviews & Feedback' }} 
      />
      <Stack.Screen 
        name="SubmitFeedback" 
        component={SubmitFeedbackScreen} 
        options={{ title: 'Write a Review' }} 
      />
      <Stack.Screen 
        name="MyBookings" 
        component={MyBookingsScreen} 
        options={{ title: 'My Bookings' }} 
      />
      <Stack.Screen 
        name="MyOrders" 
        component={MyOrdersScreen} 
        options={{ title: 'My Orders' }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Edit Profile' }} 
      />
      <Stack.Screen 
        name="EditPet" 
        component={EditPetScreen} 
        options={{ title: 'Edit Pet' }} 
      />
      <Stack.Screen 
        name="PetProfile" 
        component={PetProfileScreen} 
        options={{ title: 'Pet Profile' }} 
      />
      <Stack.Screen 
        name="AISymptomChecker" 
        component={AISymptomCheckerScreen} 
        options={{ title: 'AI Health Check' }} 
      />
    </Stack.Navigator>
  );
};

export default UserNavigator;
