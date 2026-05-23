import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs/promises'
import * as path from 'path'
import { exec } from 'child_process'

function devFilesystemBridgePlugin() {
  return {
    name: 'dev-filesystem-bridge',
    configureServer(server: any) {
      server.middlewares.use('/api/dev-fs', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            const { action } = payload;

            switch (action) {
              case 'select-workspace': {
                exec(
                  `osascript -e 'POSIX path of (choose folder with prompt "Select Workspace Directory")'`,
                  (err, stdout) => {
                    if (err) {
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'Workspace selection cancelled' }));
                      return;
                    }
                    const chosenPath = stdout.trim();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ path: chosenPath }));
                  }
                );
                break;
              }

              case 'has-config': {
                const { workspacePath } = payload;
                const configPath = path.join(workspacePath, '.kanban', 'board.json');
                try {
                  await fs.access(configPath);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ exists: true }));
                } catch {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ exists: false }));
                }
                break;
              }

              case 'read-config': {
                const { workspacePath } = payload;
                const configPath = path.join(workspacePath, '.kanban', 'board.json');
                try {
                  const content = await fs.readFile(configPath, 'utf-8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ config: JSON.parse(content) }));
                } catch (e: any) {
                  if (e.code === 'ENOENT') {
                    // Initialize default board config
                    const boardName = path.basename(workspacePath) || 'New Workspace';
                    const defaultConfig = {
                      version: '1.0.0',
                      boardName: boardName,
                      columns: [
                        { id: 'col-1', title: 'Backlog', taskIds: ['task-1'] },
                        { id: 'col-2', title: 'In Progress', taskIds: [] },
                        { id: 'col-3', title: 'Done', taskIds: [] }
                      ],
                      tasks: {
                        'task-1': {
                          id: 'task-1',
                          title: 'Welcome to Kanban Board',
                          description: 'This is a local dev card. Feel free to edit or drag-and-drop it.',
                          priority: 'medium',
                          aiPrompt: 'You are an AI assistant helping the user configure their progress board. Assist them in writing clear descriptions, task titles, and setting appropriate priorities.',
                          checklists: []
                        }
                      },
                      metadata: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      }
                    };
                    const dirPath = path.join(workspacePath, '.kanban');
                    await fs.mkdir(dirPath, { recursive: true });
                    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ config: defaultConfig }));
                  } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                  }
                }
                break;
              }

              case 'write-config': {
                const { workspacePath, config } = payload;
                const dirPath = path.join(workspacePath, '.kanban');
                const configPath = path.join(dirPath, 'board.json');
                try {
                  await fs.mkdir(dirPath, { recursive: true });
                  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true }));
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: e.message }));
                }
                break;
              }

              case 'list-files': {
                const { workspacePath } = payload;
                try {
                  const getFilesRecursive = async (dir: string): Promise<any[]> => {
                    const entries = await fs.readdir(dir, { withFileTypes: true });
                    const files: any[] = [];
                    for (const entry of entries) {
                      const fullPath = path.join(dir, entry.name);
                      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.kanban') {
                        continue;
                      }
                      if (entry.isDirectory()) {
                        try {
                          const subFiles = await getFilesRecursive(fullPath);
                          files.push(...subFiles);
                        } catch {}
                      } else if (entry.isFile()) {
                        try {
                          const stat = await fs.stat(fullPath);
                          files.push({
                            name: entry.name,
                            path: fullPath,
                            type: 'file',
                            sizeBytes: stat.size,
                          });
                        } catch {}
                      }
                    }
                    return files;
                  };

                  const files = await getFilesRecursive(workspacePath);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ files }));
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: e.message }));
                }
                break;
              }

              case 'read-file': {
                const { filePath } = payload;
                try {
                  const content = await fs.readFile(filePath, 'utf-8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ content }));
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: e.message }));
                }
                break;
              }

              case 'write-file': {
                const { filePath, content } = payload;
                try {
                  const dir = path.dirname(filePath);
                  await fs.mkdir(dir, { recursive: true });
                  await fs.writeFile(filePath, content, 'utf-8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true }));
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: e.message }));
                }
                break;
              }

              case 'run-agent': {
                const { workspacePath, command } = payload;
                const execCmd = command || `npm run test`;
                const resolvedWorkspace = path.resolve(workspacePath);
                try {
                  const stats = await fs.stat(resolvedWorkspace);
                  if (!stats.isDirectory()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid workspace directory path' }));
                    return;
                  }
                } catch {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Workspace directory does not exist' }));
                  return;
                }

                exec(execCmd, { cwd: resolvedWorkspace, timeout: 30000 }, (err, stdout, stderr) => {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    success: !err,
                    output: stdout + (stderr ? '\n' + stderr : ''),
                    error: err ? err.message : undefined
                  }));
                });
                break;
              }

              default: {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
              }
            }
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Malformed JSON or request: ${e.message}` }));
          }
        });
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), devFilesystemBridgePlugin()],
})

