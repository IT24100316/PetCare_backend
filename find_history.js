const fs = require('fs');
const path = require('path');

const historyBase = 'C:/Users/prart/AppData/Roaming/Code/User/History';
const searchTerms = [
  'PetListScreen', 'MyOrdersScreen', 'MyBookingsScreen', 'EditProfileScreen',
  'CartScreen', 'ProductListScreen', 'AdminDashboardScreen', 'VetDashboardScreen',
  'GroomerDashboardScreen', 'SitterDashboardScreen', 'ShopDashboardScreen',
  'ManageProductsScreen', 'LoginScreen', 'RegisterScreen', 'WelcomeScreen',
  'BoardingBookingScreen', 'GroomingBookingScreen', 'VetBookingScreen',
  'FeedbackWallScreen', 'SubmitFeedbackScreen', 'AddPetScreen', 'EditPetScreen'
];

const found = {};

const dirs = fs.readdirSync(historyBase);
dirs.forEach(d => {
  const entryPath = path.join(historyBase, d, 'entries.json');
  if (!fs.existsSync(entryPath)) return;
  
  try {
    const raw = fs.readFileSync(entryPath, 'utf8');
    const data = JSON.parse(raw);
    // Resource is URL-encoded e.g. file:///d%3A/...
    const resource = decodeURIComponent(data.resource || '');
    
    const match = searchTerms.find(term => resource.includes(term));
    if (match) {
      const entries = data.entries || [];
      // Get latest entry
      const latest = entries[entries.length - 1];
      if (latest) {
        const histFile = path.join(historyBase, d, latest.id);
        if (!found[match] || (found[match].timestamp < latest.timestamp)) {
          found[match] = { dir: d, file: histFile, resource, timestamp: latest.timestamp };
        }
        console.log(`FOUND: ${match} -> ${histFile}`);
      }
    }
  } catch (e) {}
});

console.log('\nTotal found:', Object.keys(found).length);
console.log(JSON.stringify(Object.keys(found), null, 2));
