import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readReference, validateReference, renderReference, escapeHtml, repositoryRoot } from '../scripts/reference.mjs';

const reference = await readReference();
const clone = () => structuredClone(reference);

test('every fact, role, answer, and unknown resolves to a source', () => {
  assert.equal(validateReference(reference), reference);
  const ids = new Set(reference.sources.map(({ id }) => id));
  for (const entry of [...reference.facts, ...reference.blockRoles, ...reference.questions, ...reference.unknowns]) {
    assert.ok(entry.sourceIds.length);
    for (const id of entry.sourceIds) assert.ok(ids.has(id));
  }
});

test('data distinguishes base, instrument, and frame without extending project scope', () => {
  assert.equal(reference.scope.edition, 'Java Edition');
  assert.equal(reference.scope.curseForgeProjectId, 1691925);
  assert.deepEqual(reference.blockRoles.map(({ name }) => name), ['Sonorous Deepslate', 'Note Block', 'Reinforced Deepslate']);
  assert.match(reference.facts.find(({ id }) => id === 'instrument-controls').text, /Right-click the Note Block/);
  assert.equal(reference.questions.find(({ id }) => id === 'bedrock').answer.includes('this project'), true);
});

test('unverified IDs, recipes, drops, and mode controls remain null', () => {
  assert.deepEqual(reference.unknowns.map(({ id }) => id), ['item-id', 'give-command', 'crafting-recipe', 'mining-drop', 'note-mode-control']);
  assert.ok(reference.unknowns.every(({ value }) => value === null));
  const changed = clone();
  changed.unknowns[0].value = 'invented:block';
  assert.throws(() => validateReference(changed), /requires new release-specific evidence/);
});

test('invalid citations and impossible date claims are rejected', () => {
  const missing = clone();
  missing.facts[0].sourceIds = ['missing-source'];
  assert.throws(() => validateReference(missing), /unknown source/);
  const duplicate = clone();
  duplicate.facts[1].id = duplicate.facts[0].id;
  assert.throws(() => validateReference(duplicate), /unique lowercase/);
  const impossible = clone();
  impossible.sources[0].checkedAt = '2026-02-30';
  assert.throws(() => validateReference(impossible), /calendar date/);
  const future = clone();
  future.sources[0].checkedAt = '2026-10-03';
  assert.throws(() => validateReference(future), /postdate the compilation/);
});

test('rendered HTML preserves the guide links, sources, and FAQ anchors', () => {
  const html = renderReference(reference);
  assert.match(html, /href="https:\/\/minecraftthesift\.com\/mods\/mielons-the-sift\/sonorous-deepslate\/">Sonorous Deepslate in Minecraft<\/a>/);
  assert.match(html, /href="https:\/\/minecraftthesift\.com\/mods\/mielons-the-sift\/portal\/">The Sift portal song and note order<\/a>/);
  for (const source of reference.sources) assert.ok(html.includes(`id="source-${source.id}"`));
  for (const question of reference.questions) assert.ok(html.includes(`id="question-${question.id}"`));
  for (const section of ['block-roles', 'setup', 'questions', 'sources']) assert.ok(html.includes(`id="${section}"`));
  assert.match(html, /Author instructions checked <time datetime="2026-10-01"/);
  assert.match(html, /Snapshot compiled <time datetime="2026-10-02"/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|<form\b|<img\b/i);
});

test('renderer escapes a synthetic markup payload', () => {
  assert.equal(escapeHtml('<b title="x">&\'</b>'), '&lt;b title=&quot;x&quot;&gt;&amp;&#39;&lt;/b&gt;');
  const synthetic = clone();
  synthetic.facts[0].text = '<script>alert("synthetic")</script>';
  const html = renderReference(synthetic);
  assert.ok(html.includes('&lt;script&gt;alert(&quot;synthetic&quot;)&lt;/script&gt;'));
  assert.doesNotMatch(html, /<script\b/i);
});

test('source URLs reject executable protocols and embedded credentials', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com', 'https://name:secret@example.com']) {
    const changed = clone();
    changed.sources[0].url = url;
    assert.throws(() => validateReference(changed), /HTTPS URL/);
  }
});

test('built files are local, self-contained, and use the same data snapshot', async () => {
  const html = await readFile(new URL('dist/index.html', repositoryRoot), 'utf8');
  const css = await readFile(new URL('dist/style.css', repositoryRoot), 'utf8');
  const json = await readFile(new URL('dist/reference.json', repositoryRoot), 'utf8');
  assert.equal(html, renderReference(reference));
  assert.deepEqual(JSON.parse(json), reference);
  assert.match(html, /href="\.\/style\.css"/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.doesNotMatch(css, /@import|url\(/i);
  assert.match(css, /\.table-wrap \{ overflow-x: auto/);
});
