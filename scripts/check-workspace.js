const fs = require('fs');
const path = require('path');
const assert = require('assert');

try {
  console.log('Checking Monorepo configuration...');
  
  // 1. Check root package.json
  const rootPkgPath = path.join(__dirname, '../package.json');
  assert(fs.existsSync(rootPkgPath), 'Root package.json should exist');
  const rootPkg = require(rootPkgPath);
  assert(rootPkg.private === true, 'Root package must be private');
  assert(Array.isArray(rootPkg.workspaces), 'Root package workspaces must be an array');
  assert(rootPkg.workspaces.includes('packages/*'), 'packages/* must be in workspaces');
  
  // 2. Check turbo.json
  const turboPath = path.join(__dirname, '../turbo.json');
  assert(fs.existsSync(turboPath), 'turbo.json should exist');
  const turbo = require(turboPath);
  assert(turbo.pipeline, 'turbo.json should define pipeline');
  
  // 3. Check packages/shared structure
  const sharedPkgPath = path.join(__dirname, '../packages/shared/package.json');
  assert(fs.existsSync(sharedPkgPath), 'packages/shared/package.json should exist');
  const sharedPkg = require(sharedPkgPath);
  assert(sharedPkg.name === 'shared', 'packages/shared name should be shared');
  
  const sharedTsconfigPath = path.join(__dirname, '../packages/shared/tsconfig.json');
  assert(fs.existsSync(sharedTsconfigPath), 'packages/shared/tsconfig.json should exist');
  
  const srcFiles = [
    'src/types/index.ts',
    'src/interfaces/index.ts',
    'src/adapters/MockFileSystemAdapter.ts',
    'src/index.ts'
  ];
  for (const file of srcFiles) {
    const filePath = path.join(__dirname, '../packages/shared', file);
    assert(fs.existsSync(filePath), `packages/shared/${file} should exist`);
  }
  
  console.log('✅ Workspace checks passed successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Workspace checks failed:', err.message);
  process.exit(1);
}
