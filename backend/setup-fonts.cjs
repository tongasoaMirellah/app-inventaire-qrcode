// backend/setup-fonts.cjs
const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = {
  'Roboto-Regular.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Regular.ttf',
  'Roboto-Medium.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Medium.ttf',
  'Roboto-Bold.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Bold.ttf',
  'Roboto-Italic.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Italic.ttf',
};

const dir = path.join(__dirname, 'fonts');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

console.log('Téléchargement des polices Roboto (OFL)...');

for (const [name, url] of Object.entries(fonts)) {
  const filePath = path.join(dir, name);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100000) {
    console.log(`${name} déjà présent (valide)`);
    continue;
  }

  console.log(`Téléchargement ${name}...`);
  https.get(url, { headers: { 'User-Agent': 'Node.js' } }, res => {
    if (res.statusCode !== 200) {
      console.error(`Erreur HTTP ${res.statusCode} pour ${name}`);
      return;
    }

    const file = fs.createWriteStream(filePath);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      const stats = fs.statSync(filePath);
      console.log(`${name} téléchargé (${(stats.size / 1024).toFixed(0)} KB)`);
    });
  }).on('error', err => {
    console.error(`Erreur ${name}:`, err.message);
  });
}