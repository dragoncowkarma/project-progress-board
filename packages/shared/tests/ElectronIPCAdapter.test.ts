import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ElectronIPCAdapter } from '../src/adapters/ElectronIPCAdapter';
import { KanbanBoardConfig, FileInfo } from '../src/types';

// Setup mocked window object for Node environment
const mockElectron = {
  selectWorkspace: async () => '/Users/test/workspace',
  hasBoardConfig: async (path: string) => path === '/Users/test/workspace',
  readBoardConfig: async (path: string) => {
    return {
      version: '1.0.0',
      boardName: 'Mock Board',
      columns: [],
      tasks: {},
      metadata: { createdAt: '', updatedAt: '' }
    } as KanbanBoardConfig;
  },
  writeBoardConfig: async (path: string, config: KanbanBoardConfig) => {},
  listFiles: async (path: string) => {
    return [
      { name: 'board.json', path: `${path}/.kanban/board.json`, type: 'file', sizeBytes: 100 }
    ] as FileInfo[];
  },
  readTextFile: async (workspace: string, path: string) => 'file contents',
  writeTextFile: async (workspace: string, path: string, content: string) => {},
};

before(() => {
  // @ts-ignore
  globalThis.window = {
    electron: mockElectron
  };
});

test('selectWorkspace - returns workspace path', async () => {
  const adapter = new ElectronIPCAdapter();
  const path = await adapter.selectWorkspace();
  assert.strictEqual(path, '/Users/test/workspace');
});

test('selectWorkspace - throws error when cancelled', async () => {
  const originalSelect = window.electron.selectWorkspace;
  window.electron.selectWorkspace = async () => null;
  
  const adapter = new ElectronIPCAdapter();
  await assert.rejects(
    async () => { await adapter.selectWorkspace(); },
    /Workspace selection cancelled/
  );
  
  window.electron.selectWorkspace = originalSelect;
});

test('hasBoardConfig - returns boolean from bridge', async () => {
  const adapter = new ElectronIPCAdapter();
  const hasConfig = await adapter.hasBoardConfig('/Users/test/workspace');
  assert.strictEqual(hasConfig, true);
  
  const hasNoConfig = await adapter.hasBoardConfig('/Users/test/other');
  assert.strictEqual(hasNoConfig, false);
});

test('readBoardConfig - returns board config', async () => {
  const adapter = new ElectronIPCAdapter();
  const config = await adapter.readBoardConfig('/Users/test/workspace');
  assert.strictEqual(config.boardName, 'Mock Board');
});

test('writeBoardConfig - calls bridge method', async () => {
  let calledPath = '';
  let calledConfig: KanbanBoardConfig | null = null;
  window.electron.writeBoardConfig = async (path, config) => {
    calledPath = path;
    calledConfig = config;
  };
  
  const adapter = new ElectronIPCAdapter();
  const config = { boardName: 'Test' } as KanbanBoardConfig;
  await adapter.writeBoardConfig('/Users/test/workspace', config);
  assert.strictEqual(calledPath, '/Users/test/workspace');
  assert.strictEqual(calledConfig.boardName, 'Test');
});

test('listFiles - returns files list from bridge', async () => {
  const adapter = new ElectronIPCAdapter();
  const files = await adapter.listFiles('/Users/test/workspace');
  assert.strictEqual(files.length, 1);
  assert.strictEqual(files[0].name, 'board.json');
});

test('readTextFile - returns content', async () => {
  const adapter = new ElectronIPCAdapter();
  const content = await adapter.readTextFile('/Users/test/workspace', '/Users/test/workspace/notes.md');
  assert.strictEqual(content, 'file contents');
});

test('writeTextFile - calls bridge method', async () => {
  let calledWorkspace = '';
  let calledPath = '';
  let calledContent = '';
  window.electron.writeTextFile = async (workspace, path, content) => {
    calledWorkspace = workspace;
    calledPath = path;
    calledContent = content;
  };
  
  const adapter = new ElectronIPCAdapter();
  await adapter.writeTextFile('/Users/test/workspace', '/Users/test/workspace/notes.md', 'hello');
  assert.strictEqual(calledWorkspace, '/Users/test/workspace');
  assert.strictEqual(calledPath, '/Users/test/workspace/notes.md');
  assert.strictEqual(calledContent, 'hello');
});
