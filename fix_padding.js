const fs = require('fs');
const path = require('path');
const targetFiles = [
  'user/MyOrdersScreen.js', 'user/MyBookingsScreen.js', 'user/EditProfileScreen.js',
  'staff/ShopDashboardScreen.js', 'staff/ManageProductsScreen.js', 'shop/ProductListScreen.js',
  'pet/PetListScreen.js', 'admin/AdminDashboardScreen.js', 'staff/AddEditProductScreen.js',
  'shop/CartScreen.js', 'booking/VetBookingScreen.js', 'booking/GroomingBookingScreen.js',
  'booking/BoardingBookingScreen.js', 'auth/RegisterScreen.js', 'auth/LoginScreen.js',
  'staff/GroomerDashboardScreen.js', 'staff/SitterDashboardScreen.js', 'vet/VetDashboardScreen.js',
  'vet/MedicalRecordsScreen.js', 'vet/AddEditRecordScreen.js', 'feedback/SubmitFeedbackScreen.js',
  'feedback/FeedbackWallScreen.js', 'pet/AddPetScreen.js', 'pet/EditPetScreen.js', 'auth/WelcomeScreen.js'
];
let count = 0;
targetFiles.forEach(f => {
  const fullPath = path.join('d:/Y2S2/WMT/pawcare/PawCare/src/screens', f);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('const insets = useSafeAreaInsets();')) return;
  if (!content.includes('bottomNav') && !content.includes('footer') && !content.includes('styles.fab')) return;
  
  // Replace import
  content = content.replace(/import\s+\{\s*SafeAreaView\s*\}\s+from\s+['"]react-native-safe-area-context['"];/, "import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';");
  
  // Inject hook
  const componentMatch = content.match(/(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/);
  if (componentMatch) {
    content = content.replace(componentMatch[1], componentMatch[1] + '\n  const insets = useSafeAreaInsets();');
  }

  // Update styles
  content = content.replace(/<View style=\{styles\.bottomNav\}>/g, '<View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>');
  content = content.replace(/<View style=\{styles\.footer\}>/g, '<View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>');
  content = content.replace(/<TouchableOpacity([^>]*)style=\{styles\.fab\}([^>]*)>/g, '<TouchableOpacity$1style={[styles.fab, { bottom: Math.max(insets.bottom + 110, 110) }]}$2>');
  
  fs.writeFileSync(fullPath, content);
  count++;
});
console.log('Modified ' + count + ' files for insets.');
