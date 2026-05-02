import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManageProductsScreen from '../screens/staff/ManageProductsScreen';
import AddEditProductScreen from '../screens/staff/AddEditProductScreen';
import ShopDashboardScreen from '../screens/staff/ShopDashboardScreen';

const Stack = createNativeStackNavigator();

const ShopOwnerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ManageProducts" 
        component={ManageProductsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="AddEditProduct" 
        component={AddEditProductScreen} 
        options={({ route }) => ({ 
          title: route.params?.product ? 'Edit Product' : 'Add Product' 
        })} 
      />
      <Stack.Screen 
        name="ShopOrders" 
        component={ShopDashboardScreen} 
        options={{ title: 'Manage Orders', headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default ShopOwnerNavigator;
