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

  // 5. Regression Check: Verify shared library compiles to correct ESM exports
  console.log('Verifying shared package module type and ESM outputs...');
  const sharedPkgPath = path.join(__dirname, '../packages/shared/package.json');
  assert(fs.existsSync(sharedPkgPath), 'packages/shared/package.json should exist');
  const sharedPkg = require(sharedPkgPath);
  assert.strictEqual(sharedPkg.type, 'module', 'packages/shared/package.json must be configured with "type": "module"');

  const sharedIndexPath = path.join(__dirname, '../packages/shared/dist/index.js');
  assert(fs.existsSync(sharedIndexPath), 'packages/shared/dist/index.js should exist (run npm run build first)');
  const sharedIndexContent = fs.readFileSync(sharedIndexPath, 'utf8');
  assert.ok(sharedIndexContent.includes('export * from'), 'packages/shared/dist/index.js must output ESM "export" syntax');
  assert.ok(!sharedIndexContent.includes('exports.'), 'packages/shared/dist/index.js must not output CommonJS "exports" syntax');

  console.log('✅ Frontend scaffolding checks passed successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Frontend scaffolding checks failed:', err.message);
  process.exit(1);
}
