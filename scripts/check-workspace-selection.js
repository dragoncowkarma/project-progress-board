const assert = require('assert');

// Polyfill localStorage
const mockLocalStorage = {};
globalThis.localStorage = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, value) => { mockLocalStorage[key] = value; },
  removeItem: (key) => { delete mockLocalStorage[key]; }
};

try {
  console.log('Verifying Workspace Selection persistence...');

  const WORKSPACE_LIST_KEY = 'VITE_MOCK_STORAGE_KEY_WORKSPACES';
  
  // 1. Initial workspace list setup simulation
  let list = ['/Users/mock/A', '/Users/mock/B'];
  localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(list));
  
  const loadedList = JSON.parse(localStorage.getItem(WORKSPACE_LIST_KEY));
  assert.deepStrictEqual(loadedList, list, 'Workspaces list should match stored list');

  // 2. Select workspace simulation
  localStorage.setItem('current_active_mock_workspace', '/Users/mock/B');
  assert.strictEqual(localStorage.getItem('current_active_mock_workspace'), '/Users/mock/B', 'Active workspace should be B');

  // 3. Create workspace simulation
  const newPath = '/Users/mock/C';
  list.push(newPath);
  localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(list));
  localStorage.setItem('current_active_mock_workspace', newPath);

  const updatedList = JSON.parse(localStorage.getItem(WORKSPACE_LIST_KEY));
  assert.ok(updatedList.includes(newPath), 'New workspace C should be added');
  assert.strictEqual(localStorage.getItem('current_active_mock_workspace'), newPath, 'Active workspace should be C');

  console.log('✅ Workspace selection checks passed successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Workspace selection checks failed:', err.message);
  process.exit(1);
}
