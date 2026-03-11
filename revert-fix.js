const fs = require('fs');

// Fix server.ts - remove Player import
let serverContent = fs.readFileSync('d:/github/scorex-backend/scorex-backend/src/server.ts', 'utf8');
serverContent = serverContent.replace("import Player from './models/Player';\n", "");
fs.writeFileSync('d:/github/scorex-backend/scorex-backend/src/server.ts', serverContent);
console.log('Fixed server.ts');

// Fix tournamentController.ts - revert to simple populate
let tcContent = fs.readFileSync('d:/github/scorex-backend/scorex-backend/src/controllers/tournamentController.ts', 'utf8');
tcContent = tcContent.replace(
  ".populate({ path: 'teams', populate: { path: 'players' } })",
  ".populate('teams')"
);
fs.writeFileSync('d:/github/scorex-backend/scorex-backend/src/controllers/tournamentController.ts', tcContent);
console.log('Fixed tournamentController.ts');

