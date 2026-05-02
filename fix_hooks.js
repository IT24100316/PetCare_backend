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

  // Strip out incorrectly placed hooks
  const hadWrongHook = content.includes('const insets = useSafeAreaInsets();');
  content = content.replace(/\n\s*const insets = useSafeAreaInsets\(\);\n/g, '\n');

  if (hadWrongHook) {
    // Inject hook at the start of the valid component!
    const componentNameMatch = f.split('/').pop().replace('.js', '');
    const regex = new RegExp(`(const\\s+${componentNameMatch}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{)`);
    const match = content.match(regex);
    if (match) {
        content = content.replace(match[1], match[1] + '\\n  const insets = useSafeAreaInsets();\\n');
    } else {
        // Fallback for different syntaxes!
        const fbRegex = /(const\s+[A-Z][a-zA-Z0-9]+\s*=\s*\([^)]*\)\s*=>\s*\{)/;
        const fbMatch = content.match(fbRegex);
        if (fbMatch) {
            content = content.replace(fbMatch[1], fbMatch[1] + '\\n  const insets = useSafeAreaInsets();\\n');
        }
    }
  }

  // Restore the newlines correctly
  content = content.replace(/\\n/g, '\n');
  fs.writeFileSync(fullPath, content);
  count++;
});
console.log('Fixed hooks in ' + count + ' files.');
