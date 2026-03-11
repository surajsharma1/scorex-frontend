const { execSync } = require('child_process');
try {
  execSync('cd d:/github/scorex-backend/scorex-backend && npx tsc', { stdio: 'inherit' });
  console.log('Build successful!');
} catch (e) {
  console.log('Build failed');
  process.exit(1);
}

