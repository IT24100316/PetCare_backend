const fs = require('fs');
const path = require('path');

// Fix WelcomeScreen.js
const wsPath = 'd:/Y2S2/WMT/pawcare/PawCare/src/screens/auth/WelcomeScreen.js';
if (fs.existsSync(wsPath)) {
  let wsContent = fs.readFileSync(wsPath, 'utf8');
  // Since WelcomeScreen had NO native template strings, replacing backticks with single quotes is 100% safe.
  wsContent = wsContent.replace(/\`/g, "'");
  fs.writeFileSync(wsPath, wsContent);
  console.log('Fixed WelcomeScreen');
}

// 25 Screen Files needing safe area context update
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

let applied = 0;
targetFiles.forEach(f => {
  const fullPath = path.join('d:/Y2S2/WMT/pawcare/PawCare/src/screens', f);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('useSafeAreaInsets();')) return;
  
  // 1. Swap import SafeAreaView
  content = content.replace(/import\s*\{\s*SafeAreaView\s*\}\s*from\s*['"]react-native['"];/, "import { SafeAreaView } from 'react-native-safe-area-context';");
  // Just in case it already uses react-native-safe-area-context but without useSafeAreaInsets hook:
  content = content.replace(/import\s*\{\s*SafeAreaView\s*\}\s*from\s*['"]react-native-safe-area-context['"];/, "import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';");

  // 2. Inject `const insets = useSafeAreaInsets();` inside the component
  const componentNameMatch = f.split('/').pop().replace('.js', '');
  const regex = new RegExp(`(const\\s+${componentNameMatch}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{)`);
  const match = content.match(regex);
  if (match) {
    content = content.replace(match[1], match[1] + '\n  const insets = useSafeAreaInsets();');
  } else {
    // Fallback if component name is somewhat different
    const fallbackRegex = /(const\\s+[A-Z][A-Za-z0-9]+\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{)/;
    const fbMatch = content.match(fallbackRegex);
    if(fbMatch) {
       content = content.replace(fbMatch[1], fbMatch[1] + '\n  const insets = useSafeAreaInsets();');
    }
  }

  // 3. Inject paddings safely without removing any native line breaks via regexes
  // This replaces exactly the generic styles.bottomNav and styles.footer to be an array with computed dynamic padding.
  content = content.replace(/<View style=\{styles.bottomNav\}>/g, '<View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>');
  content = content.replace(/<View style=\{styles.footer\}>/g, '<View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>');
  
  // Also fix fab (Floating Action Button) positioning
  content = content.replace(/<TouchableOpacity\s+([^>]*?)style=\{styles\.fab\}([^>]*)>/g, '<TouchableOpacity $1style={[styles.fab, { bottom: Math.max(insets.bottom + 110, 110) }]}$2>');

  fs.writeFileSync(fullPath, content);
  applied++;
});

console.log(`Paddings reapplied safely in ${applied} files.`);
