import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DevFileSystemAdapter } from '../src/adapters/DevFileSystemAdapter';
import { KanbanBoardConfig, FileInfo } from '../src/types';

let mockFetchCalls: Array<{ url: string; options: any }> = [];
let mockFetchResponse: any = {};
let mockFetchStatus = 200;

before(() => {
  // @ts-ignore
  globalThis.fetch = async (url: string, options: any) => {
    mockFetchCalls.push({ url, options });
    
    // Support test that verifies non-ok response
    const ok = mockFetchStatus >= 200 && mockFetchStatus < 300;
    return {
      ok,
      status: mockFetchStatus,
      json: async () => mockFetchResponse,
    } as any;
  };
});

beforeEach(() => {
  mockFetchCalls = [];
  mockFetchResponse = {};
  mockFetchStatus = 200;
});

test('selectWorkspace - should call fetch with select-workspace action and return path', async () => {
  const adapter = new DevFileSystemAdapter();
  mockFetchResponse = { path: '/Users/test/dev-workspace' };
  
  const path = await adapter.selectWorkspace();
  
  assert.strictEqual(path, '/Users/test/dev-workspace');
  assert.strictEqual(mockFetchCalls.length, 1);
  const { url, options } = mockFetchCalls[0];
  assert.strictEqual(url, '/api/dev-fs');
  assert.strictEqual(options.method, 'POST');
  const body = JSON.parse(options.body);
  assert.strictEqual(body.action, 'select-workspace');
});

test('selectWorkspace - should throw error if selectWorkspace fails', async () => {
  const adapter = new DevFileSystemAdapter();
  mockFetchResponse = { error: 'Workspace selection cancelled' };
  
  await assert.rejects(
    async () => { await adapter.selectWorkspace(); },
    /Workspace selection cancelled/
  );
});

test('selectWorkspace - should throw generic error if fetch is not ok', async () => {
  const adapter = new DevFileSystemAdapter();
  mockFetchStatus = 500;
  mockFetchResponse = { error: 'Internal Server Error' };

  await assert.rejects(
    async () => { await adapter.selectWorkspace(); },
    /Internal Server Error/
  );
});

test('hasBoardConfig - should return exists value', async () => {
  const adapter = new DevFileSystemAdapter();
  mockFetchResponse = { exists: true };
  
  const result = await adapter.hasBoardConfig('/Users/test/dev-workspace');
  assert.strictEqual(result, true);
  
  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(body.action, 'has-config');
  assert.strictEqual(body.workspacePath, '/Users/test/dev-workspace');
});

test('readBoardConfig - should return config object', async () => {
  const adapter = new DevFileSystemAdapter();
  const mockConfig: KanbanBoardConfig = {
    version: '1.0.0',
    boardName: 'Dev Board',
    columns: [],
    tasks: {},
    metadata: { createdAt: '', updatedAt: '' }
  };
  mockFetchResponse = { config: mockConfig };
  
  const config = await adapter.readBoardConfig('/Users/test/dev-workspace');
  assert.strictEqual(config.boardName, 'Dev Board');
  
  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(body.action, 'read-config');
});

test('writeBoardConfig - should post config object', async () => {
  const adapter = new DevFileSystemAdapter();
  const mockConfig: KanbanBoardConfig = {
    version: '1.0.0',
    boardName: 'Dev Board',
    columns: [],
    tasks: {},
    metadata: { createdAt: '', updatedAt: '' }
  };
  mockFetchResponse = { success: true };
  
  await adapter.writeBoardConfig('/Users/test/dev-workspace', mockConfig);
  
  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(body.action, 'write-config');
  assert.strictEqual(body.workspacePath, '/Users/test/dev-workspace');
  assert.deepStrictEqual(body.config, mockConfig);
});

test('listFiles - should return files list', async () => {
  const adapter = new DevFileSystemAdapter();
  const mockFiles: FileInfo[] = [
    { name: 'board.json', path: '/path/board.json', type: 'file', sizeBytes: 120 }
  ];
  mockFetchResponse = { files: mockFiles };
  
  const files = await adapter.listFiles('/Users/test/dev-workspace');
  assert.strictEqual(files.length, 1);
  assert.strictEqual(files[0].name, 'board.json');
  
  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(body.action, 'list-files');
});

test('readTextFile - should return content', async () => {
  const adapter = new DevFileSystemAdapter();
  mockFetchResponse = { content: 'my text' };
  
  const content = await adapter.readTextFile('/Users/test/dev-workspace/notes.md');
  assert.strictEqual(content, 'my text');
  
  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(body.action, 'read-file');
  assert.strictEqual(body.filePath, '/Users/test/dev-workspace/notes.md');
});

test('writeTextFile - should post content', async () => {
  const adapter = new DevFileSystemAdapter();
  mockFetchResponse = { success: true };
  
  await adapter.writeTextFile('/Users/test/dev-workspace/notes.md', 'hello');
  
  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(body.action, 'write-file');
  assert.strictEqual(body.filePath, '/Users/test/dev-workspace/notes.md');
  assert.strictEqual(body.content, 'hello');
});
