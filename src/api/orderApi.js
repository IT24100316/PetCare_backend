import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const placeOrder = async (orderData) => {
  const response = await axiosInstance.post('/orders', orderData);
  await clearCart();
  return response.data;
};

export const getCart = async () => {
  try {
    const raw = await AsyncStorage.getItem('@pawcare_cart');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const addToCart = async (product, quantity = 1) => {
  try {
    const raw = await AsyncStorage.getItem('@pawcare_cart');
    let cart = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex(i => i._id === product._id);
    if (idx >= 0) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    await AsyncStorage.setItem('@pawcare_cart', JSON.stringify(cart));
  } catch (e) { throw e; }
};

export const removeFromCart = async (productId) => {
  try {
    const raw = await AsyncStorage.getItem('@pawcare_cart');
    let cart = raw ? JSON.parse(raw) : [];
    cart = cart.filter(i => i._id !== productId);
    await AsyncStorage.setItem('@pawcare_cart', JSON.stringify(cart));
  } catch (e) { throw e; }
};

export const updateCartQuantity = async (productId, change) => {
  try {
    const raw = await AsyncStorage.getItem('@pawcare_cart');
    let cart = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex(i => i._id === productId);
    if (idx >= 0) {
      cart[idx].quantity += change;
      if (cart[idx].quantity <= 0) {
        cart = cart.filter(i => i._id !== productId);
      }
    }
    await AsyncStorage.setItem('@pawcare_cart', JSON.stringify(cart));
  } catch (e) { throw e; }
};

export const clearCart = async () => {
  try {
    await AsyncStorage.removeItem('@pawcare_cart');
  } catch {}
};

export const getMyOrders = async () => {
  const response = await axiosInstance.get('/orders');
  return response.data;
};

export const getAllOrders = async () => {
  const response = await axiosInstance.get('/orders/all');
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await axiosInstance.put(`/orders/${id}/status`, { status });
  return response.data;
};

export const cancelOrder = async (id) => {
  const response = await axiosInstance.delete(`/orders/${id}`);
  return response.data;
};
