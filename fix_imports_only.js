const fs = require('fs');
const path = require('path');
const base = 'd:/Y2S2/WMT/pawcare/PawCare/src/screens';

// These files have the hook injected but still import SafeAreaView from wrong place
// Script: just fix the import line, nothing else.

const walk = (dir) => {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) return walk(full);
    if (!f.endsWith('.js')) return;

    const content = fs.readFileSync(full, 'utf8');

    // Only process files that have the hook but wrong import
    if (!content.includes('const insets = useSafeAreaInsets();')) return;
    if (content.includes('useSafeAreaInsets') && content.includes('react-native-safe-area-context')) return;

    let updated = content;

    // Case 1: already imports from react-native-safe-area-context, but without useSafeAreaInsets
    if (updated.includes("from 'react-native-safe-area-context'")) {
      updated = updated.replace(
        /import\s*\{([^}]*)\}\s*from\s*'react-native-safe-area-context';/,
        (match, namedImports) => {
          if (namedImports.includes('useSafeAreaInsets')) return match;
          const cleaned = namedImports.trim().replace(/,$/, '');
          return `import { ${cleaned}, useSafeAreaInsets } from 'react-native-safe-area-context';`;
        }
      );
    }
    // Case 2: SafeAreaView imported from react-native (old pattern)
    else if (updated.includes("from 'react-native'")) {
      // Add import after first react-native import line
      updated = updated.replace(
        /^(import\s*\{[^}]*\}\s*from\s*'react-native';)/m,
        "$1\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';"
      );
    }
    // Case 3: No safe-area import at all, insert after first import line
    else {
      updated = updated.replace(
        /^(import .+;)$/m,
        "$1\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';"
      );
    }

    if (updated !== content) {
      fs.writeFileSync(full, updated);
      console.log('Fixed import in: ' + path.relative(base, full));
    }
  });
};

walk(base);
console.log('Done.');
