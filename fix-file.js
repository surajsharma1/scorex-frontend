const fs = require('fs');
const filePath = 'd:/github/scorex-backend/scorex-backend/src/controllers/tournamentController.ts';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(".populate('teams')", ".populate({ path: 'teams', populate: { path: 'players' } })");
fs.writeFileSync(filePath, content);
console.log('File updated successfully');

