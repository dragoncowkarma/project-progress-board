const path = require('path');
const assert = require('assert');

// Mock Electron contextBridge
let exposedScope = null;
let exposedObj = null;

const electronMock = {
  contextBridge: {
    exposeInMainWorld: (scope, obj) => {
      exposedScope = scope;
      exposedObj = obj;
    }
  },
  ipcRenderer: {
    invoke: (channel, ...args) => {
      return Promise.resolve({ channel, args });
    }
  }
};

// Override require to intercept 'electron'
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'electron') {
    return electronMock;
  }
  return originalRequire.apply(this, arguments);
};

try {
  console.log('Verifying Preload Exposures (TSK-3.2)...');
  const preloadPath = path.resolve(__dirname, '..', 'apps', 'desktop_shell', 'dist', 'preload.js');
  
  // Require the compiled preload script
  require(preloadPath);

  assert.strictEqual(exposedScope, 'electron', 'Should expose to the electron scope');
  assert.ok(exposedObj, 'Exposed object should be defined');
  
  const expectedMethods = [
    'selectWorkspace',
    'hasBoardConfig',
    'readBoardConfig',
    'writeBoardConfig',
    'listFiles',
    'readTextFile',
    'writeTextFile'
  ];

  for (const method of expectedMethods) {
    assert.strictEqual(typeof exposedObj[method], 'function', `Method ${method} should be exposed as a function`);
  }

  console.log('✅ ContextBridge preload exposures verified successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Preload exposure verification failed:', err.message);
  process.exit(1);
}
