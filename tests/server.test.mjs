import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoServer } from '../scripts/server.mjs';

test('local server serves the built reference and no repository files', async () => {
  const server = createDemoServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(`${origin}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /^text\/html/);
    assert.match(await home.text(), /Sonorous Deepslate Reference/);
    const head = await fetch(`${origin}/style.css`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const json = await fetch(`${origin}/reference.json`);
    assert.equal((await json.json()).scope.curseForgeProjectId, 1691925);
    for (const pathname of ['/package.json', '/README.md', '/.env', '/%2e%2e%2fpackage.json', '/data/reference.json']) {
      assert.equal((await fetch(`${origin}${pathname}`)).status, 404);
    }
    const post = await fetch(`${origin}/`, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET, HEAD');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
