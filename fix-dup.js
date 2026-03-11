const fs = require('fs');
const filePath = 'd:/github/scorex-backend/scorex-backend/src/controllers/tournamentController.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the duplicate populate issue - remove first .populate('teams') keeping only the nested one
content = content.replace(
  ".populate('teams')\n      .populate({ path: 'teams', populate: { path: 'players' } })",
  ".populate({ path: 'teams', populate: { path: 'players' } })"
);
fs.writeFileSync(filePath, content);
console.log('Fixed duplicate populate');

