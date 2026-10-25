import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};
const port = Number(process.env.PORT || 4184);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('PORT must be an integer between 1024 and 65535');

// Local preview only: source, lockfiles and dotfiles are not served.
createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = path === '/' ? 'index.html' : path.slice(1);
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const allowed =
      ['index.html', 'styles.css', 'app.js'].includes(relative) ||
      /^assets\/[a-zA-Z0-9_/-]+\.(png|svg|ttf|txt)$/.test(relative);
    if (!allowed || relative.split('/').some((part) => part.startsWith('.'))) {
      response.writeHead(404).end('Not found');
      return;
    }
    const file = new URL(relative, root);
    if (!file.href.startsWith(root.href)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const content = await readFile(file);
    const extension = relative.slice(relative.lastIndexOf('.'));
    response.writeHead(200, {
      'Content-Type': types[extension] || 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400).end('Unable to load this file');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Domaine Laffitte → http://127.0.0.1:${port}\n${fileURLToPath(root)}`),
);
