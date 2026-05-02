import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addProduct, updateProduct } from '../../api/productApi';
import { uploadImage } from '../../api/userApi';
import { isPositiveNumber } from '../../utils/validators';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  errorContainer: '#ffdad6', error: '#ba1a1a',
};

const CATEGORIES = ['Food', 'Toys', 'Accessories', 'Medicine', 'Grooming', 'Other'];

const Field = ({ label, icon, children }) => (
  <View style={styles.field}>
    <View style={styles.fieldLabel}>
      <Ionicons name={icon} size={14} color={C.primary} />
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
    {children}
  </View>
);

const AddEditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingProduct = route.params?.product;
  const isEditing = !!existingProduct;

  const [name, setName] = useState(existingProduct?.name || '');
  const [category, setCategory] = useState(existingProduct?.category || '');
  const [price, setPrice] = useState(existingProduct?.price != null ? String(existingProduct.price) : '');
  const [stock, setStock] = useState(existingProduct?.stock != null ? String(existingProduct.stock) : '');
  const [imageUrl, setImageUrl] = useState(existingProduct?.imageUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const ext = filename.split('.').pop();
        const formData = new FormData();
        formData.append('image', { uri, name: filename, type: `image/${ext}` });
        const uploadResult = await uploadImage(formData);
        setImageUrl(uploadResult.imageUrl);
      } catch {
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !category || !price || !stock) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (!isPositiveNumber(price)) {
      Alert.alert('Invalid Price', 'Price must be a positive number.');
      return;
    }
    if (!isPositiveNumber(stock)) {
      Alert.alert('Invalid Stock', 'Stock must be a valid positive number.');
      return;
    }
    setSaving(true);
    try {
      const productData = { name: name.trim(), category, price: Number(price), stock: Number(stock), imageUrl };
      if (isEditing) {
        await updateProduct(existingProduct._id, productData);
        Alert.alert('✅ Updated', 'Product updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await addProduct(productData);
        Alert.alert('✅ Added', 'Product added successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.emeraldDark} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(236,253,245,0.85)" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Product' : 'New Product'}</Text>
            <Text style={styles.headerSub}>{isEditing ? 'Update product details' : 'Add to your inventory'}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.85}>
            {uploading ? (
              <View style={styles.imageUploading}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.uploadingText}>Uploading…</Text>
              </View>
            ) : imageUrl ? (
              <>
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.changeOverlayText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.imagePlaceholderIcon}>
                  <Ionicons name="camera-outline" size={32} color={C.primary} />
                </View>
                <Text style={styles.imagePlaceholderTitle}>Add Product Photo</Text>
                <Text style={styles.imagePlaceholderSub}>Tap to browse your gallery</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.form}>
            <Field label="Product Name" icon="pricetag-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. Premium Dog Food"
                placeholderTextColor={C.outlineVariant}
                value={name}
                onChangeText={setName}
              />
            </Field>

            <Field label="Category" icon="grid-outline">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Also allow manual entry */}
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Or type custom category…"
                placeholderTextColor={C.outlineVariant}
                value={category}
                onChangeText={setCategory}
              />
            </Field>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Price ($)" icon="cash-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={C.outlineVariant}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
              <View style={{ width: 14 }} />
              <View style={{ flex: 1 }}>
                <Field label="Stock Qty" icon="cube-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={C.outlineVariant}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                  />
                </Field>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={isEditing ? 'save-outline' : 'add-circle-outline'} size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{isEditing ? 'Update Product' : 'Add to Inventory'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.emeraldDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,216,184,0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(120,216,184,0.65)', textAlign: 'center', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  imagePicker: { width: '100%', height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: C.surfaceHigh, marginBottom: 24 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  changeOverlayText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imageUploading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  uploadingText: { fontSize: 14, color: C.outline },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: C.outlineVariant, borderStyle: 'dashed', borderRadius: 20 },
  imagePlaceholderIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  imagePlaceholderSub: { fontSize: 13, color: C.outline },
  form: { gap: 20 },
  field: { gap: 10 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fieldLabelText: { fontSize: 12, fontWeight: '800', color: C.primary, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: { height: 52, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: C.onSurface, backgroundColor: C.surfaceLowest },
  categoryRow: { gap: 8, paddingVertical: 2 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surfaceHigh, borderWidth: 1.5, borderColor: 'transparent' },
  categoryChipActive: { backgroundColor: C.primary + '14', borderColor: C.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: C.outline },
  categoryChipTextActive: { color: C.primary, fontWeight: '800' },
  row: { flexDirection: 'row' },
  saveBtn: { marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, height: 60, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});

export default AddEditProductScreen;
