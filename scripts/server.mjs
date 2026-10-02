import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { repositoryRoot } from './reference.mjs';

const publicFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/reference.json', ['reference.json', 'application/json; charset=utf-8']]
]);

export function createDemoServer() {
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }
    let pathname;
    try { pathname = new URL(request.url, 'http://127.0.0.1').pathname; } catch {
      response.writeHead(400);
      response.end('Invalid URL');
      return;
    }
    const file = publicFiles.get(pathname);
    if (!file) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    try {
      const body = await readFile(new URL(`dist/${file[0]}`, repositoryRoot));
      response.writeHead(200, { 'Content-Type': file[1], 'Content-Length': body.length, 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404);
      response.end('Build the reference with npm run build first.');
    }
  });
}
