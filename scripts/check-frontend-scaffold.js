const fs = require('fs');
const path = require('path');
const assert = require('assert');

try {
  console.log('Checking Frontend Scaffolding...');

  // 1. Check web_frontend package.json
  const pkgPath = path.join(__dirname, '../apps/web_frontend/package.json');
  assert(fs.existsSync(pkgPath), 'apps/web_frontend/package.json should exist');
  const pkg = require(pkgPath);
  assert(pkg.name === 'web-frontend', 'Package name must be web-frontend');
  assert(pkg.dependencies['shared'], 'Dependency on "shared" must exist');

  // 2. Check vite.config.ts base property
  const viteConfigPath = path.join(__dirname, '../apps/web_frontend/vite.config.ts');
  assert(fs.existsSync(viteConfigPath), 'vite.config.ts should exist');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  assert(viteConfig.includes("base: './'"), "vite.config.ts must set base to './'");

  // 3. Check src/index.css exists
  const cssPath = path.join(__dirname, '../apps/web_frontend/src/index.css');
  assert(fs.existsSync(cssPath), 'src/index.css should exist');

  // 4. Check src/main.tsx and src/App.tsx exist
  const mainPath = path.join(__dirname, '../apps/web_frontend/src/main.tsx');
  const appPath = path.join(__dirname, '../apps/web_frontend/src/App.tsx');
  assert(fs.existsSync(mainPath), 'src/main.tsx should exist');
  assert(fs.existsSync(appPath), 'src/App.tsx should exist');

  console.log('✅ Frontend scaffolding checks passed successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Frontend scaffolding checks failed:', err.message);
  process.exit(1);
}
