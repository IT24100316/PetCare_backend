const fs = require('fs');

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

targetFiles.forEach(f => {
  const fullPath = 'd:/Y2S2/WMT/pawcare/PawCare/src/screens/' + f;
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix {'\n'} that got converted to actual newlines
  content = content.replace(/\{'\r?\n'\}/g, "{'\\n'}");

  // Fix strings with broken single quotes over newlines
  content = content.replace(/'([^']*)[\r\n]+([^']*)'/g, (match, p1, p2) => {
    return "'" + p1 + "\\n" + p2 + "'";
  });

  // Re-run in case of multiple newlines in a single string
  content = content.replace(/'([^']*)[\r\n]+([^']*)'/g, (match, p1, p2) => {
    return "'" + p1 + "\\n" + p2 + "'";
  });

  fs.writeFileSync(fullPath, content);
});
console.log('Fixed syntax errors');
