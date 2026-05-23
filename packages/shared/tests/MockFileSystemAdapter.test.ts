import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockFileSystemAdapter } from '../src/adapters/MockFileSystemAdapter';
import { KanbanBoardConfig } from '../src/types';

// Setup LocalStorage polyfill for Node.js
const mockLocalStorage: Record<string, string> = {};

before(() => {
  globalThis.localStorage = {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
    removeItem: (key: string) => { delete mockLocalStorage[key]; },
    clear: () => {
      for (const key in mockLocalStorage) {
        delete mockLocalStorage[key];
      }
    },
    get length() { return Object.keys(mockLocalStorage).length; },
    key: (index: number) => Object.keys(mockLocalStorage)[index] || null
  };
});

beforeEach(() => {
  localStorage.clear();
});

test('selectWorkspace - should return default workspace path', async () => {
  const adapter = new MockFileSystemAdapter();
  const path = await adapter.selectWorkspace();
  assert.strictEqual(path, '/Users/mock/default-workspace');
});

test('selectWorkspace - should return active workspace if set', async () => {
  const adapter = new MockFileSystemAdapter();
  localStorage.setItem('current_active_mock_workspace', '/Users/mock/my-board');
  const path = await adapter.selectWorkspace();
  assert.strictEqual(path, '/Users/mock/my-board');
});

test('hasBoardConfig - should return false if board.json is not present', async () => {
  const adapter = new MockFileSystemAdapter();
  const result = await adapter.hasBoardConfig('/Users/mock/my-board');
  assert.strictEqual(result, false);
});

test('hasBoardConfig - should return true if board.json is present', async () => {
  const adapter = new MockFileSystemAdapter();
  const config: KanbanBoardConfig = {
    version: '1.0.0',
    boardName: 'Test Board',
    columns: [],
    tasks: {},
    metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  };
  await adapter.writeBoardConfig('/Users/mock/my-board', config);
  const result = await adapter.hasBoardConfig('/Users/mock/my-board');
  assert.strictEqual(result, true);
});

test('readBoardConfig - should initialize and return default board config if not exists', async () => {
  const adapter = new MockFileSystemAdapter();
  const workspace = '/Users/mock/my-board';
  const config = await adapter.readBoardConfig(workspace);
  assert.strictEqual(config.version, '1.0.0');
  assert.strictEqual(config.boardName, 'New Mock Workspace');
  assert.strictEqual(config.columns.length, 3);
  assert.ok(config.tasks['task-1']);
  
  // Verify it auto-saved to localStorage
  const hasConfig = await adapter.hasBoardConfig(workspace);
  assert.strictEqual(hasConfig, true);
});

test('writeBoardConfig - should serialize and write board config to localStorage', async () => {
  const adapter = new MockFileSystemAdapter();
  const workspace = '/Users/mock/my-board';
  const config: KanbanBoardConfig = {
    version: '2.0.0',
    boardName: 'Custom Board',
    columns: [{ id: 'c1', title: 'To Do', taskIds: ['t1'] }],
    tasks: {
      't1': {
        id: 't1',
        title: 'Task 1',
        description: 'Desc',
        priority: 'medium',
        aiPrompt: 'Translate this code',
        verificationCommand: 'npm run test-unit',
        agentCommandTemplate: 'claude "{{prompt}}"',
        checklists: []
      }
    },
    metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  };
  await adapter.writeBoardConfig(workspace, config);
  const loaded = await adapter.readBoardConfig(workspace);
  assert.strictEqual(loaded.version, '2.0.0');
  assert.strictEqual(loaded.boardName, 'Custom Board');
  assert.strictEqual(loaded.columns[0].title, 'To Do');
  assert.strictEqual(loaded.tasks['t1'].aiPrompt, 'Translate this code');
  assert.strictEqual(loaded.tasks['t1'].verificationCommand, 'npm run test-unit');
  assert.strictEqual(loaded.tasks['t1'].agentCommandTemplate, 'claude "{{prompt}}"');
});

test('readTextFile - should throw error if file does not exist', async () => {
  const adapter = new MockFileSystemAdapter();
  await assert.rejects(
    async () => { await adapter.readTextFile('/Users/mock', '/Users/mock/non-existent.txt'); },
    /File not found/
  );
});

test('readTextFile - should throw error if path is outside workspace', async () => {
  const adapter = new MockFileSystemAdapter();
  await assert.rejects(
    async () => { await adapter.readTextFile('/Users/mock/my-board', '/Users/mock/outside.txt'); },
    /Security Error/
  );
});

test('writeTextFile and readTextFile - should write and read text content', async () => {
  const adapter = new MockFileSystemAdapter();
  const workspace = '/Users/mock/my-board';
  const filePath = '/Users/mock/my-board/docs/notes.md';
  const content = '# Project Notes\nHello World';
  await adapter.writeTextFile(workspace, filePath, content);
  const readContent = await adapter.readTextFile(workspace, filePath);
  assert.strictEqual(readContent, content);
});

test('listFiles - should list all files under the workspace path', async () => {
  const adapter = new MockFileSystemAdapter();
  const workspace = '/Users/mock/my-board';
  
  await adapter.writeTextFile(workspace, '/Users/mock/my-board/notes.md', 'some notes');
  await adapter.writeTextFile(workspace, '/Users/mock/my-board/docs/todo.txt', 'do something');
  await adapter.writeTextFile('/Users/mock/another-board', '/Users/mock/another-board/notes.md', 'other notes'); // should not list this
  
  const files = await adapter.listFiles(workspace);
  
  assert.strictEqual(files.length, 2);
  const fileNames = files.map(f => f.name);
  assert.ok(fileNames.includes('notes.md'));
  assert.ok(fileNames.includes('todo.txt'));
  
  const notesFile = files.find(f => f.name === 'notes.md');
  assert.ok(notesFile);
  assert.strictEqual(notesFile.path, '/Users/mock/my-board/notes.md');
  assert.strictEqual(notesFile.type, 'file');
  assert.ok(notesFile.sizeBytes > 0);
});

test('runAgent - should simulate execution and return success with logs', async () => {
  const adapter = new MockFileSystemAdapter();
  const res = await adapter.runAgent('/Users/mock/my-board', 'TSK-1', 'Do something', 'npm run test');
  assert.strictEqual(res.success, true);
  assert.ok(res.output.includes('[Harness: TSK-1] Starting adversarial TDD verification...'));
  assert.ok(res.output.includes('[Agent: antigravity] Analyzing prompt instructions: "Do something..."'));
  assert.ok(res.output.includes('Status: SUCCESS'));
});
