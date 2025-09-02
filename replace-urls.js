const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(/http:\/\/localhost:5000/g, 'https://bhaalu-squad-hub.onrender.com');
  fs.writeFileSync(filePath, updated);
  console.log(`Updated: ${filePath}`);
}

// Files to update
const files = [
  'src/components/Dashboard.tsx',
  'src/components/LiveGameView.tsx',
  'src/components/GameDetailsView.tsx',
  'src/components/PastMatchView.tsx',
  'src/components/ProfileView.tsx',
  'src/components/PlayersView.tsx',
  'src/components/AdminView.tsx',
  'src/contexts/GlobalSocketContext.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath);
  }
});

console.log('URL replacement complete!');