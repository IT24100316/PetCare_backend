import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCart, removeFromCart, placeOrder, updateCartQuantity } from '../../api/orderApi';

const { width } = Dimensions.get('window');

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  inversePrimary: '#78d8b8', secondary: '#8e4e14', secondaryFixed: '#ffdcc4',
  onSecondaryFixed: '#2f1400', secondaryContainer: '#ffab69', 
  surfaceBright: '#faf9f8', surface: '#faf9f8', surfaceHigh: '#e9e8e7',
  surfaceLow: '#f4f3f2', surfaceLowest: '#ffffff', onSurface: '#1a1c1c', 
  onSurfaceVariant: '#3e4944', outline: '#6e7a74', outlineVariant: '#bdc9c3', 
  error: '#ba1a1a', emeraldDark: '#022c22'
};

const CartScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(Array.isArray(data) ? data : data.items || []);
    } catch {
      setCart([]);
    } finally { setLoading(false); }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      fetchCart();
    } catch {
      setCart(prev => prev.filter(i => i._id !== itemId));
    }
  };

  const handleUpdateQty = async (itemId, change) => {
    try {
      await updateCartQuantity(itemId, change);
      fetchCart();
    } catch {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const totalPrice = cart.reduce((sum, item) => {
    const price = item.price || item.productId?.price || 0;
    const qty = item.quantity || 1;
    return sum + price * qty;
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { Alert.alert('Empty Cart', 'Add items before checkout.'); return; }
    setPlacingOrder(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId?._id || item._id,
          quantity: item.quantity || 1,
        })),
        totalPrice,
      };
      await placeOrder(orderData);
      Alert.alert('🎉 Order Placed!', 'Your order has been placed successfully.', [
        { text: 'View Orders', onPress: () => navigation.navigate('MyOrders') },
        { text: 'Keep Shopping', onPress: () => navigation.navigate('ProductList') },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to place order');
    } finally { setPlacingOrder(false); }
  };

  const renderItem = ({ item }) => {
    const name = item.name || item.productId?.name || 'Product';
    const price = item.price || item.productId?.price || 0;
    const image = item.imageUrl || item.productId?.imageUrl;
    const qty = item.quantity || 1;
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemImageWrapper}>
          {image ? (
            <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
              <MaterialIcons name="inventory-2" size={32} color={C.outlineVariant} />
            </View>
          )}
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemTop}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
              <Text style={styles.itemVariant}>Standard Variant</Text>
            </View>
            <TouchableOpacity hitSlop={{top:10, bottom:10, left:10, right:10}} style={styles.removeBtn} onPress={() => handleRemove(item._id)}>
              <MaterialIcons name="delete" size={24} color="rgba(186,26,26,0.7)" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.itemBottom}>
            <Text style={styles.itemPrice}>${Number(price).toFixed(2)}</Text>
            
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item._id, -1)}>
                <MaterialIcons name="remove" size={18} color={C.onSurfaceVariant} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item._id, 1)}>
                <MaterialIcons name="add" size={18} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : cart.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MaterialIcons name="shopping-basket" size={80} color={C.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty.</Text>
          <Text style={styles.emptyDesc}>It looks like you haven't curated your first box yet.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('ProductList')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item._id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 180, 180) }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View>
              {/* Bento Suggestion */}
              <View style={styles.bentoCard}>
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoTitle}>Need some treats?</Text>
                  <Text style={styles.bentoDesc}>Add seasonal puppy crisps for extra delight.</Text>
                  <TouchableOpacity style={styles.bentoBtn}>
                    <Text style={styles.bentoBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.bentoImageWrapper}>
                  <View style={styles.bentoImageMock}>
                    <MaterialIcons name="pets" size={48} color="#ffab69" />
                  </View>
                </View>
              </View>

              {/* Summary Breakdown */}
              <View style={styles.summaryBlock}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          }
        />
      )}

      {/* Sticky Footer */}
      {cart.length > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.footerInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Balance</Text>
              <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, placingOrder && { opacity: 0.7 }]}
              onPress={handleCheckout}
              disabled={placingOrder}
            >
              {placingOrder ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.checkoutBtnText}>Checkout</Text>
                  <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surfaceBright },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 24, paddingBottom: 16, 
    backgroundColor: 'rgba(236,253,245,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.02)',
    zIndex: 10,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(5,150,105,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: C.emeraldDark, letterSpacing: -0.5 },
  
  list: { paddingHorizontal: 24, paddingTop: 24 },
  
  cartItem: {
    flexDirection: 'row', backgroundColor: C.surfaceLowest,
    borderRadius: 24, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
  },
  itemImageWrapper: {
    width: 100, height: 100, backgroundColor: C.surfaceHigh, borderRadius: 32,
    borderTopLeftRadius: 32, borderTopRightRadius: 16, borderBottomRightRadius: 32, borderBottomLeftRadius: 16,
    overflow: 'hidden', marginRight: 16,
  },
  itemImage: { width: '100%', height: '100%' },
  itemImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  itemContent: { flex: 1, justifyContent: 'space-between' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 18, fontWeight: '600', color: C.onSurface, lineHeight: 24 },
  removeBtn: { padding: 4 },
  itemVariant: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 4 },
  
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  itemPrice: { fontSize: 24, fontWeight: '600', color: C.primary },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 6 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 15, fontWeight: '500', marginHorizontal: 8, color: C.onSurface },
  
  bentoCard: {
    backgroundColor: 'rgba(255,220,196,0.3)', // secondary-fixed with opacity
    borderRadius: 24, padding: 28, marginTop: 32, 
    position: 'relative', overflow: 'hidden'
  },
  bentoContent: { zIndex: 10 },
  bentoTitle: { fontSize: 20, fontWeight: '600', color: '#6f3800', marginBottom: 8 },
  bentoDesc: { fontSize: 14, color: '#6f3800', opacity: 0.8, marginBottom: 20, maxWidth: '75%', lineHeight: 20 },
  bentoBtn: {
    backgroundColor: C.secondary, alignSelf: 'flex-start',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99,
    shadowColor: C.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  bentoBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  bentoImageWrapper: { position: 'absolute', right: -30, bottom: -30, width: 160, height: 160, opacity: 0.5 },
  bentoImageMock: { width: '100%', height: '100%', backgroundColor: 'rgba(255,171,105,0.2)', borderRadius: 80, justifyContent: 'center', alignItems: 'center' },

  summaryBlock: { paddingTop: 36, paddingBottom: 24, paddingHorizontal: 8, gap: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 15, color: C.onSurfaceVariant, fontWeight: '400' },
  summaryValue: { fontSize: 15, color: C.onSurface, fontWeight: '500' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 },
  emptyIconWrap: { width: 180, height: 180, backgroundColor: C.surfaceLow, borderRadius: 90, borderTopLeftRadius: 100, borderBottomRightRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  emptyTitle: { fontSize: 28, fontWeight: '600', color: C.onSurface, marginBottom: 12, textAlign: 'center' },
  emptyDesc: { fontSize: 16, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 36, lineHeight: 24 },
  shopBtn: { backgroundColor: C.primary, paddingHorizontal: 36, paddingVertical: 20, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  shopBtnText: { color: '#fff', fontWeight: '600', fontSize: 18 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)', borderTopLeftRadius: 40, borderTopRightRadius: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 24,
    paddingTop: 32, paddingHorizontal: 32,
  },
  footerInner: { gap: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, color: C.onSurfaceVariant, fontWeight: '500' },
  totalPrice: { fontSize: 36, fontWeight: '600', color: C.onSurface, letterSpacing: -1 },
  checkoutBtn: {
    backgroundColor: C.primary, height: 68, borderRadius: 34,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  checkoutBtnText: { color: '#fff', fontSize: 19, fontWeight: '600' },
});

export default CartScreen;

