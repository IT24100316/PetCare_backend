import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, Dimensions, ScrollView, TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getProducts } from '../../api/productApi';
import { addToCart, getCart } from '../../api/orderApi';

const { width } = Dimensions.get('window');

const C = {
  primary: '#006850', onPrimary: '#ffffff',
  secondary: '#8e4e14', secondaryFixed: '#ffdcc4', onSecondaryFixed: '#2f1400',
  surface: '#faf9f8', surfaceBright: '#faf9f8',
  surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2', surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3',
  emeraldDark: '#022c22', error: '#ba1a1a'
};



const ProductListScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Essentials');
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const categories = ['All Essentials', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  useEffect(() => { 
    if (isFocused) {
      fetchProducts();
      fetchCartCount();
    }
  }, [isFocused]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch { Alert.alert('Error', 'Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchCartCount = async () => {
    try {
      const data = await getCart();
      const items = Array.isArray(data) ? data : data.items || [];
      setCartCount(items.reduce((sum, item) => sum + (item.quantity || 1), 0));
    } catch (e) { setCartCount(0); }
  };

  const handleAddToCart = async (item) => {
    setAddingId(item._id);
    try {
      await addToCart(item, 1);
      Alert.alert('Added! 🛒', 'Item added to your cart.');
      setCartCount(prev => prev + 1);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add to cart');
    } finally { setAddingId(null); }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All Essentials' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProduct = filtered[0];
  const subFeaturedProducts = filtered.slice(1, 3);
  const remainingProducts = filtered.slice(3);

  const renderRemainingItem = ({ item }) => (
    <View style={styles.remCard}>
      <View style={styles.remImgWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.remImg} resizeMode="cover" />
        ) : (
          <View style={[styles.remImg, styles.placeholderImg]}>
            <MaterialIcons name="inventory-2" size={40} color={C.outlineVariant} />
          </View>
        )}
      </View>
      <View style={styles.remInfo}>
        <View>
          <Text style={styles.remCat}>{item.category || 'Wellness'}</Text>
          <Text style={styles.remName} numberOfLines={2}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.remPrice}>${Number(item.price || 0).toFixed(2)}</Text>
          <Text style={[styles.remStock, item.stock <= 0 && { color: C.error }]}>
            {item.stock > 0 ? `${item.stock} left` : 'Out of stock'}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.remAddBtn, addingId === item._id && styles.remAddAdding]} 
        onPress={() => handleAddToCart(item)}
        disabled={addingId === item._id}
      >
        {addingId === item._id ? (
          <ActivityIndicator size="small" color={C.onSurface} />
        ) : (
          <Text style={styles.remAddText}>Add to Cart</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.goBack()}>
            <MaterialIcons name="menu" size={26} color={C.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PawCare</Text>
        </View>
        <View style={styles.headerAvatar}>
          <MaterialIcons name="person" size={24} color={C.outlineVariant} />
        </View>
      </View>

      <FlatList
        data={remainingProducts}
        keyExtractor={(item) => item._id?.toString()}
        renderItem={renderRemainingItem}
        numColumns={2}
        columnWrapperStyle={styles.remGridRow}
        contentContainerStyle={[styles.contentProps, { paddingBottom: Math.max(insets.bottom + 160, 160) }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroSub}>Spring Collection 2024</Text>
              <Text style={styles.heroTitle}>Nourish their{'\n'}<Text style={styles.heroTitleItalic}>Wild Side.</Text></Text>
              <Text style={styles.heroDesc}>Curated holistic nutrition and bespoke accessories designed for the modern canine companion.</Text>
              
              <View style={styles.heroBtns}>
                <TouchableOpacity style={styles.exploreBtn}><Text style={styles.exploreText}>Explore All</Text></TouchableOpacity>
                <TouchableOpacity style={styles.storyBtn}><Text style={styles.storyText}>Our Story</Text></TouchableOpacity>
              </View>

              <View style={styles.heroImgContainer}>
                <View style={styles.heroBlobBg} />
                <View style={styles.heroImgWrapper}>
                  <Image style={styles.heroImg} resizeMode="cover" source={{uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgmEV0dplUiX9mhEie2IDp7HYmUexxGZg9-Os9VJoJMLYaA5gtXPQopAF0W7Ytvy9GCrtNroaUNGoagHHz1ZyHRfMGeemF5Mcu48baSq1r5reOR6qQ4R2uDElCpe2NDqT_KUQgYYEXVdSaTYvHbn9NBmpEhz7WrTFu5-WHbLmnC8alSjSR9Ilk0wqfosZdMIcT4VQAsU7i3EXdZGXJ97lKwaC1auQaBiBScyz5rY-9l6mto9SLF5R55RKsnU9BGOFaKzuPdiB1_VI'}} />
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBlock}>
              <View style={styles.searchInputWrap}>
                <Ionicons name="search" size={18} color={C.outline} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search pet supplies..."
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
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsScroll} contentContainerStyle={styles.catsContent}>
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

            {/* Featured Product */}
            {featuredProduct && (
              <TouchableOpacity activeOpacity={0.9} style={styles.featCard} onPress={() => {}}>
                {featuredProduct.imageUrl ? (
                  <Image source={{uri: featuredProduct.imageUrl}} style={styles.featImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.featImg, styles.placeholderImg]}><MaterialIcons name="inventory-2" size={80} color={C.outlineVariant} /></View>
                )}
                <View style={styles.featOverlay} />
                <View style={styles.featContent}>
                  <View style={styles.featTexts}>
                    <Text style={styles.featBadge}>Best Seller</Text>
                    <Text style={styles.featName} numberOfLines={2}>{featuredProduct.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.featPrice}>${Number(featuredProduct.price || 0).toFixed(2)}</Text>
                      <Text style={[styles.featStock, featuredProduct.stock <= 0 && { color: '#ffdad6' }]}>
                        • {featuredProduct.stock > 0 ? `${featuredProduct.stock} left` : 'Out of stock'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.featAddBtn} onPress={() => handleAddToCart(featuredProduct)}>
                    {addingId === featuredProduct._id ? <ActivityIndicator color={C.primary} /> : <MaterialIcons name="add" size={28} color={C.primary} />}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}

            {/* Sub-featured Products */}
            {subFeaturedProducts.length > 0 && (
              <View style={styles.subGrid}>
                {subFeaturedProducts.map(p => (
                  <TouchableOpacity key={p._id} style={styles.subCard}>
                    <View style={styles.subImgWrapper}>
                      {p.imageUrl ? (
                        <Image source={{uri: p.imageUrl}} style={styles.subImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.subImg, styles.placeholderImg]}><MaterialIcons name="image" size={30} color={C.outlineVariant} /></View>
                      )}
                    </View>
                    <View style={styles.subInfo}>
                      <Text style={styles.subName} numberOfLines={1}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={[styles.subPrice, { marginBottom: 0 }]}>${Number(p.price || 0).toFixed(2)}</Text>
                        <Text style={[styles.subStock, p.stock <= 0 && { color: C.error }]}>
                          {p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.subQuickAdd} onPress={() => handleAddToCart(p)}>
                        <Text style={styles.subQuickAddText}>Quick Add</Text>
                        <MaterialIcons name="arrow-forward" size={14} color={C.secondary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} /> : (
            <View style={styles.empty}>
              <MaterialIcons name="view-carousel" size={64} color={C.outlineVariant} />
              <Text style={styles.emptyText}>No generic products remain</Text>
            </View>
          )
        }
      />

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <View style={[styles.floatingCartWrap, { bottom: Math.max(insets.bottom + 110, 110) }]}>
          <TouchableOpacity style={styles.floatingCartBtn} activeOpacity={0.9} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.fcText}>View Bag</Text>
            <View style={styles.fcDiv} />
            <View style={styles.fcRight}>
              <MaterialIcons name="shopping-bag" size={20} color={C.surface} />
              <View style={styles.fcBadge}>
                <Text style={styles.fcBadgeText}>{cartCount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PetList')}>
          <MaterialIcons name="home" size={24} color={C.outline} style={styles.navIcon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyBookings')}>
          <MaterialIcons name="calendar-month" size={24} color={C.outline} style={styles.navIcon} />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.navActiveBox}>
            <MaterialIcons name="shopping-bag" size={24} color={C.secondary} style={styles.navIconActive} />
            <Text style={styles.navTextActive}>Shop</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('EditProfile')}>
          <MaterialIcons name="person" size={24} color={C.outline} style={styles.navIcon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surfaceBright },
  header: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { padding: 4, borderRadius: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,104,80,0.1)' },
  
  contentProps: { paddingHorizontal: 24 },
  
  heroSection: { paddingTop: 24, paddingBottom: 40 },
  heroSub: { fontSize: 10, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  heroTitle: { fontSize: 44, fontWeight: '800', color: C.onSurface, lineHeight: 46, marginBottom: 20, letterSpacing: -1 },
  heroTitleItalic: { color: C.primary, fontStyle: 'italic' },
  heroDesc: { fontSize: 16, color: C.onSurfaceVariant, lineHeight: 24, marginBottom: 28, paddingRight: 40 },
  heroBtns: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  exploreBtn: { backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99 },
  exploreText: { color: C.onPrimary, fontSize: 13, fontWeight: '700' },
  storyBtn: { borderWidth: 1.5, borderColor: 'rgba(189,201,195,0.4)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99 },
  storyText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  
  heroImgContainer: { alignItems: 'center', position: 'relative', marginTop: 20 },
  heroBlobBg: { position: 'absolute', width: 280, height: 280, backgroundColor: 'rgba(0,104,80,0.05)', borderRadius: 140, transform: [{scale: 1.1}] },
  heroImgWrapper: { width: 280, height: 280, overflow: 'hidden', shadowColor: '#000', shadowOffset: {height: 20, width: 0}, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10, borderTopLeftRadius: 100, borderTopRightRadius: 200, borderBottomLeftRadius: 120, borderBottomRightRadius: 100 },
  heroImg: { width: '100%', height: '100%' },
  
  searchBlock: { marginBottom: 16 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLow, borderRadius: 16, paddingHorizontal: 16, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: C.onSurface },
  
  catsScroll: { marginBottom: 32 },
  catsContent: { gap: 10, paddingRight: 16 },
  catPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, backgroundColor: C.surfaceLow },
  catPillActive: { backgroundColor: C.secondaryFixed },
  catText: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  catTextActive: { color: C.onSecondaryFixed, fontWeight: '700' },
  
  featCard: { height: 440, borderRadius: 24, overflow: 'hidden', marginBottom: 32, backgroundColor: C.surfaceLowest, shadowColor: '#000', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  featImg: { width: '100%', height: '100%' },
  featOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 240, backgroundColor: 'rgba(0,0,0,0.45)' },
  featContent: { position: 'absolute', bottom: 24, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  featTexts: { flex: 1, paddingRight: 10 },
  featBadge: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  featName: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4, lineHeight: 30, letterSpacing: -0.5 },
  featPrice: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  featAddBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {height: 8, width: 0}, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  
  subGrid: { gap: 20, marginBottom: 32 },
  subCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLow, padding: 16, borderRadius: 20, gap: 16 },
  subImgWrapper: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {height: 2, width: 0}, shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  subImg: { width: '100%', height: '100%' },
  subInfo: { flex: 1 },
  subName: { fontSize: 16, fontWeight: '600', color: C.onSurface, marginBottom: 4, lineHeight: 20 },
  subPrice: { fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 16 },
  subQuickAdd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subQuickAddText: { fontSize: 9, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  
  remGridRow: { justifyContent: 'space-between', marginBottom: 20 },
  remCard: { width: (width - 64) / 2, backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: {height: 6, width: 0}, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  remImgWrapper: { aspectRatio: 4/5, borderRadius: 12, overflow: 'hidden', backgroundColor: C.surfaceHigh, marginBottom: 12 },
  remImg: { width: '100%', height: '100%' },
  remInfo: { flex: 1, justifyContent: 'space-between', marginBottom: 16 },
  remCat: { fontSize: 9, fontWeight: '700', color: C.outline, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  remName: { fontSize: 14, fontWeight: '600', color: C.onSurface, lineHeight: 18, marginBottom: 6 },
  remPrice: { fontSize: 15, fontWeight: '700', color: C.primary },
  remAddBtn: { width: '100%', paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(189,201,195,0.4)', alignItems: 'center' },
  remAddAdding: { backgroundColor: C.surfaceHigh, borderWidth: 0 },
  remAddText: { fontSize: 9, fontWeight: '700', color: C.onSurface, textTransform: 'uppercase', letterSpacing: 1 },
  
  placeholderImg: { justifyContent: 'center', alignItems: 'center' },
  
  floatingCartWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 40 },
  floatingCartBtn: { backgroundColor: C.onSurface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16, gap: 16, borderRadius: 99, shadowColor: '#000', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  fcText: { color: C.surface, fontSize: 14, fontWeight: '700' },
  fcDiv: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  fcRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fcBadge: { backgroundColor: C.secondary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  fcBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderTopLeftRadius: 40, borderTopRightRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.04, shadowRadius: 30, elevation: 20, zIndex: 50 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  navItemActive: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, transform: [{translateY: -5}] },
  navActiveBox: { backgroundColor: 'rgba(142,78,20,0.05)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 99, alignItems: 'center' },
  navIcon: { marginBottom: 4 },
  navIconActive: { marginBottom: 4 },
  navText: { fontSize: 9, fontWeight: '700', color: C.outline, textTransform: 'uppercase', letterSpacing: 1 },
  navTextActive: { fontSize: 9, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  remStock: { fontSize: 11, fontWeight: '600', color: C.outlineVariant },
  featStock: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  subStock: { fontSize: 11, fontWeight: '600', color: C.outlineVariant },
});

export default ProductListScreen;

