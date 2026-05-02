import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert, StatusBar, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getProducts, deleteProduct } from '../../api/productApi';
import { AuthContext } from '../../context/AuthContext';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const STOCK_CONFIG = (stock) => {
  if (stock === 0) return { bg: '#fef2f2', text: '#991b1b', label: 'Out of Stock' };
  if (stock <= 5) return { bg: '#fff8ed', text: '#92400e', label: 'Low Stock' };
  return { bg: '#ecfdf5', text: '#065f46', label: `In Stock` };
};

const ManageProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { logoutUser } = useContext(AuthContext);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isFocused) fetchProducts(); }, [isFocused]);

  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(id);
            fetchProducts();
          } catch {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }) => {
    const sc = STOCK_CONFIG(item.stock ?? 0);
    return (
      <View style={styles.card}>
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="image-not-supported" size={32} color={C.outlineVariant} />
          </View>
        )}

        {/* Stock badge overlay */}
        <View style={[styles.stockBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.stockBadgeText, { color: sc.text }]}>{sc.label}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category || 'Uncategorized'}</Text>
            </View>
            <Text style={styles.stockCount}>{item.stock} units</Text>
          </View>
          <Text style={styles.priceText}>${Number(item.price || 0).toFixed(2)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AddEditProduct', { product: item })}
          >
            <Ionicons name="create-outline" size={16} color={C.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Ionicons name="trash-outline" size={16} color={C.error} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadge}>
            <Ionicons name="cube-outline" size={13} color={C.primaryFixedDim} />
            <Text style={styles.headerBadgeText}>Inventory</Text>
          </View>
          <Text style={styles.headerTitle}>My Products</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.ordersBtn} onPress={() => navigation.navigate('ShopOrders')}>
            <Ionicons name="receipt-outline" size={16} color={C.primaryFixedDim} />
            <Text style={styles.ordersBtnText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
            <Ionicons name="log-out-outline" size={20} color="rgba(236,253,245,0.75)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>{products.length} products · {products.filter(p => (p.stock ?? 0) <= 5).length} low/out of stock</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchBlock}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={C.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={C.outlineVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={C.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60, flex: 1, backgroundColor: C.surface }} />
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="inventory" size={56} color={C.outlineVariant} />
          <Text style={styles.emptyTitle}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item._id?.toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditProduct', { product: null })}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerBadgeText: { color: C.primaryFixedDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ordersBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: 'rgba(120,216,184,0.12)' },
  ordersBtnText: { fontSize: 13, fontWeight: '700', color: C.primaryFixedDim },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  summaryBar: { backgroundColor: 'rgba(120,216,184,0.08)', marginHorizontal: 22, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  summaryText: { fontSize: 13, color: 'rgba(120,216,184,0.75)', fontWeight: '600' },
  searchBlock: { backgroundColor: C.surface, paddingTop: 16, paddingBottom: 10, paddingHorizontal: 16, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 10 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 14 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: C.onSurface },
  catScroll: { marginHorizontal: -16 },
  catContent: { paddingHorizontal: 16, gap: 8 },
  catPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surfaceHigh },
  catPillActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  catText: { fontSize: 12, fontWeight: '600', color: C.outline },
  catTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 110, backgroundColor: C.surface },
  columnWrapper: { gap: 12, paddingHorizontal: 4 },
  card: { flex: 1, backgroundColor: C.surfaceLowest, borderRadius: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  productImage: { width: '100%', height: 130, resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: 130, backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center' },
  stockBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  stockBadgeText: { fontSize: 10, fontWeight: '800' },
  cardInfo: { padding: 12, paddingBottom: 8 },
  productName: { fontSize: 14, fontWeight: '800', color: C.onSurface, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  categoryPill: { backgroundColor: C.primary + '14', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  categoryText: { fontSize: 10, fontWeight: '700', color: C.primary },
  stockCount: { fontSize: 11, color: C.outline, fontWeight: '600' },
  priceText: { fontSize: 17, fontWeight: '800', color: C.primary },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.surfaceHigh },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, backgroundColor: C.primary + '0D' },
  editBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, backgroundColor: C.errorContainer + 'AA', borderLeftWidth: 1, borderColor: C.surfaceHigh },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: C.error },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.outline, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  fab: { position: 'absolute', bottom: 28, left: 22, right: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, height: 58, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  fabText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

export default ManageProductsScreen;
