const fs = require('fs');
const path = require('path');
const assert = require('assert');
const os = require('os');
const { execSync } = require('child_process');

try {
  console.log('Building all packages in the monorepo...');
  const rootDir = path.resolve(__dirname, '..');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

  console.log('Running electron-builder packaging in desktop_shell...');
  execSync('npm run package -w desktop-shell', { stdio: 'inherit', cwd: rootDir });

  const desktopDir = path.join(rootDir, 'apps', 'desktop_shell');
  const distPackagedDir = path.join(desktopDir, 'dist-packaged');

  assert.ok(fs.existsSync(distPackagedDir), 'dist-packaged directory should exist');

  const platform = os.platform();
  console.log(`Verifying package layout for platform: ${platform}...`);

  if (platform === 'darwin') {
    const appPath = path.join(distPackagedDir, 'mac', 'KanbanFlow.app');
    assert.ok(fs.existsSync(appPath), `Packaged app must exist at: ${appPath}`);
    
    // Check Content/Resources for app.asar
    const asarPath = path.join(appPath, 'Contents', 'Resources', 'app.asar');
    assert.ok(fs.existsSync(asarPath), `ASAR archive must exist at: ${asarPath}`);
  } else if (platform === 'win32') {
    const exePath = path.join(distPackagedDir, 'win-unpacked', 'KanbanFlow.exe');
    assert.ok(fs.existsSync(exePath), `Packaged exe must exist at: ${exePath}`);
    
    const asarPath = path.join(distPackagedDir, 'win-unpacked', 'resources', 'app.asar');
    assert.ok(fs.existsSync(asarPath), `ASAR archive must exist at: ${asarPath}`);
  } else {
    // Linux fallback
    const binaryPath = path.join(distPackagedDir, 'linux-unpacked', 'KanbanFlow');
    assert.ok(fs.existsSync(binaryPath), `Packaged binary must exist at: ${binaryPath}`);
    
    const asarPath = path.join(distPackagedDir, 'linux-unpacked', 'resources', 'app.asar');
    assert.ok(fs.existsSync(asarPath), `ASAR archive must exist at: ${asarPath}`);
  }

  console.log('✅ Electron application packaged successfully and verified!');
  process.exit(0);
} catch (err) {
  console.error('❌ Desktop packaging verification failed:', err.message);
  process.exit(1);
}
