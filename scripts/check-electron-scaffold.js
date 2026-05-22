const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

try {
  console.log('Verifying Electron Shell Scaffolding (TSK-3.1)...');

  const rootDir = path.resolve(__dirname, '..');
  const desktopDir = path.join(rootDir, 'apps', 'desktop_shell');

  // 1. Check folder and essential config files exist
  assert.ok(fs.existsSync(desktopDir), 'apps/desktop_shell folder must exist');
  assert.ok(fs.existsSync(path.join(desktopDir, 'package.json')), 'package.json must exist');
  assert.ok(fs.existsSync(path.join(desktopDir, 'tsconfig.json')), 'tsconfig.json must exist');
  assert.ok(fs.existsSync(path.join(desktopDir, 'src', 'main.ts')), 'src/main.ts must exist');

  // 2. Check package.json configurations
  const pkg = require(path.join(desktopDir, 'package.json'));
  assert.strictEqual(pkg.name, 'desktop-shell', 'Package name must be desktop-shell');
  assert.strictEqual(pkg.main, 'dist/main.js', 'Main entry point must be dist/main.js');

  // 3. Compile code and check for dist/main.js
  console.log('Running TypeScript compilation in desktop_shell...');
  execSync('npm run build -w desktop-shell', { stdio: 'inherit', cwd: rootDir });
  
  assert.ok(fs.existsSync(path.join(desktopDir, 'dist', 'main.js')), 'dist/main.js must exist after build');
  
  console.log('✅ Electron shell scaffolding successfully verified!');
  process.exit(0);
} catch (err) {
  console.error('❌ Scaffolding verification failed:', err.message);
  process.exit(1);
}
