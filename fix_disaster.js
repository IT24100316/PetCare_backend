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

  // Step 1: Reverse the damage from fix_syntax.js joining lines with literal '\n'
  content = content.replace(/\\n/g, '\n');

  // Step 2: Protect proper JSX line breaks that were broken by Step 1
  content = content.replace(/\{'\n'\}/g, "{'\\n'}");

  // Step 3: Any strings that natively had a newline inside them are now physically split across lines. 
  // Convert them to template literals to be valid JS syntax.
  const fixQuotes = (str) => {
    let replaced;
    do {
      replaced = false;
      str = str.replace(/'([^']*\n[^']*)'/g, (match, inner) => {
        replaced = true;
        return "`" + inner + "`";
      });
      str = str.replace(/"([^"]*\n[^"]*)"/g, (match, inner) => {
        replaced = true;
        return "`" + inner + "`";
      });
    } while (replaced);
    return str;
  };
  
  content = fixQuotes(content);

  fs.writeFileSync(fullPath, content);
});

console.log('Restored module lines properly!');
