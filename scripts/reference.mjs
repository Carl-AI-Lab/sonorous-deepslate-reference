import { readFile } from 'node:fs/promises';

export const repositoryRoot = new URL('../', import.meta.url);
export const referenceFile = new URL('data/reference.json', repositoryRoot);

export async function readReference() {
  return JSON.parse(await readFile(referenceFile, 'utf8'));
}

const fail = (message) => { throw new Error(message); };
const nonempty = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a nonempty string`);
};
const date = (value, label) => {
  const parsed = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label} must be a calendar date in YYYY-MM-DD format`);
  }
};
const httpsUrl = (value, label) => {
  nonempty(value, label);
  let parsed;
  try { parsed = new URL(value); } catch { fail(`${label} must be an absolute HTTPS URL`); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail(`${label} must be an absolute HTTPS URL without credentials`);
};
const uniqueIds = (records, label) => {
  if (!Array.isArray(records) || !records.length) fail(`${label} must contain records`);
  const ids = new Set();
  for (const entry of records) {
    nonempty(entry.id, `${label} record ID`);
    if (!/^[a-z][a-z0-9-]*$/.test(entry.id) || ids.has(entry.id)) fail(`${label} IDs must be unique lowercase identifiers`);
    ids.add(entry.id);
  }
  return ids;
};

export function validateReference(reference) {
  if (reference.schemaVersion !== 1) fail('Unsupported schemaVersion');
  nonempty(reference.title, 'title');
  date(reference.compiledAt, 'compiledAt');
  httpsUrl(reference.guideUrl, 'guideUrl');
  httpsUrl(reference.portalGuideUrl, 'portalGuideUrl');
  if (reference.guideUrl !== 'https://minecraftthesift.com/mods/mielons-the-sift/sonorous-deepslate/') fail('guideUrl must identify the Sonorous Deepslate guide');
  if (reference.portalGuideUrl !== 'https://minecraftthesift.com/mods/mielons-the-sift/portal/') fail('portalGuideUrl must identify the portal performance guide');
  if (reference.scope?.block !== 'Sonorous Deepslate' || reference.scope?.project !== "Mielon's The Sift" || reference.scope?.author !== 'Mielon' || reference.scope?.edition !== 'Java Edition' || reference.scope?.curseForgeProjectId !== 1691925) {
    fail('Scope must identify Mielon\'s Java Edition project 1691925');
  }
  nonempty(reference.scope.versionScope, 'scope.versionScope');
  const sourceIds = uniqueIds(reference.sources, 'sources');
  const citations = (entry, label) => {
    if (!Array.isArray(entry.sourceIds) || !entry.sourceIds.length || new Set(entry.sourceIds).size !== entry.sourceIds.length) fail(`${label} must cite distinct sources`);
    for (const sourceId of entry.sourceIds) if (!sourceIds.has(sourceId)) fail(`${label} cites unknown source ${sourceId}`);
  };
  for (const source of reference.sources) {
    for (const field of ['title', 'author', 'kind']) nonempty(source[field], `sources.${source.id}.${field}`);
    if (!['author-project-page', 'editorial-reference'].includes(source.kind)) fail(`Unknown source kind ${source.kind}`);
    httpsUrl(source.url, `sources.${source.id}.url`);
    date(source.checkedAt, `sources.${source.id}.checkedAt`);
    if (source.checkedAt > reference.compiledAt) fail('Source check cannot postdate the compilation');
    if (source.publishedAt !== null) {
      date(source.publishedAt, `sources.${source.id}.publishedAt`);
      if (source.publishedAt > source.checkedAt) fail('Publication cannot postdate the source check');
    }
  }
  citations(reference.scope, 'scope');
  uniqueIds(reference.facts, 'facts');
  for (const fact of reference.facts) {
    nonempty(fact.label, `facts.${fact.id}.label`);
    nonempty(fact.text, `facts.${fact.id}.text`);
    citations(fact, `facts.${fact.id}`);
  }
  if (!Array.isArray(reference.blockRoles) || reference.blockRoles.length !== 3) fail('The block-role comparison must contain three roles');
  if (new Set(reference.blockRoles.map(({ name }) => name)).size !== 3) fail('Block names must be distinct');
  for (const role of reference.blockRoles) {
    for (const field of ['name', 'role', 'playerAction']) nonempty(role[field], `blockRoles.${field}`);
    if (role.interpretation !== 'editorial-explanation') fail('Block-role explanations must retain their editorial definition');
    citations(role, `blockRoles.${role.name}`);
  }
  uniqueIds(reference.questions, 'questions');
  for (const question of reference.questions) {
    nonempty(question.question, `questions.${question.id}.question`);
    nonempty(question.answer, `questions.${question.id}.answer`);
    citations(question, `questions.${question.id}`);
  }
  uniqueIds(reference.unknowns, 'unknowns');
  for (const unknown of reference.unknowns) {
    nonempty(unknown.label, `unknowns.${unknown.id}.label`);
    nonempty(unknown.reason, `unknowns.${unknown.id}.reason`);
    if (unknown.value !== null) fail(`${unknown.id} requires new release-specific evidence before a known value is added`);
    citations(unknown, `unknowns.${unknown.id}`);
  }
  return reference;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function renderReference(reference) {
  validateReference(reference);
  const e = escapeHtml;
  const sourceNumbers = new Map(reference.sources.map((source, index) => [source.id, index + 1]));
  const cites = ({ sourceIds }) => `<span class="citations">${sourceIds.map((id) => `<a href="#source-${e(id)}" aria-label="Source ${sourceNumbers.get(id)}">[${sourceNumbers.get(id)}]</a>`).join(' ')}</span>`;
  const primaryCheckedAt = reference.sources.filter(({ kind }) => kind === 'author-project-page').map(({ checkedAt }) => checkedAt).sort().at(-1);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="description" content="Identify Sonorous Deepslate, Note Blocks, and the Ancient City frame in Mielon's The Sift with cited author instructions.">
  <title>${e(reference.title)}</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
<main>
  <header>
    <p class="eyebrow">${e(reference.scope.project)} · ${e(reference.scope.edition)}</p>
    <h1>${e(reference.title)}</h1>
    <p class="lede">Keep the base, instrument, and frame straight before tuning the portal.</p>
    <p><a href="${e(reference.guideUrl)}">Sonorous Deepslate in Minecraft</a> <span class="muted">— the illustrated guide at minecraftthesift.com</span></p>
    <p class="metadata">Author instructions checked <time datetime="${e(primaryCheckedAt)}">${e(primaryCheckedAt)}</time> · Snapshot compiled <time datetime="${e(reference.compiledAt)}">${e(reference.compiledAt)}</time></p>
  </header>
  <nav aria-label="Reference sections"><a href="#block-roles">Block roles</a><a href="#setup">Setup</a><a href="#questions">Questions</a><a href="#sources">Sources</a></nav>
  <section id="block-roles" aria-labelledby="block-roles-heading">
    <h2 id="block-roles-heading">Three blocks, three roles</h2>
    <div class="table-wrap" role="region" aria-label="Portal block roles" tabindex="0">
      <table><caption>Block roles in Mielon's Ancient City entrance</caption><thead><tr><th scope="col">Block</th><th scope="col">Role</th><th scope="col">Your action</th></tr></thead><tbody>
        ${reference.blockRoles.map((role) => `<tr><th scope="row">${e(role.name)}</th><td>${e(role.role)}</td><td>${e(role.playerAction)} ${cites(role)}</td></tr>`).join('\n        ')}
      </tbody></table>
    </div>
  </section>
  <section id="setup" aria-labelledby="setup-heading">
    <h2 id="setup-heading">From location to opening feedback</h2>
    <ol class="steps">
      ${reference.facts.slice(0, 6).map((fact) => `<li><h3>${e(fact.label)}</h3><p>${e(fact.text)} ${cites(fact)}</p></li>`).join('\n      ')}
    </ol>
    <p>For the performance, follow <a href="${e(reference.portalGuideUrl)}">The Sift portal song and note order</a>.</p>
    ${reference.facts.slice(6).map((fact) => `<p><strong>${e(fact.label)}.</strong> ${e(fact.text)} ${cites(fact)}</p>`).join('\n    ')}
  </section>
  <section id="questions" aria-labelledby="questions-heading">
    <h2 id="questions-heading">Sonorous Deepslate questions</h2>
    ${reference.questions.map((question) => `<h3 id="question-${e(question.id)}">${e(question.question)}</h3><p>${e(question.answer)} ${cites(question)}</p>`).join('\n    ')}
    <details><summary>Release-specific fields still awaiting evidence</summary><dl class="unknowns">${reference.unknowns.map((unknown) => `<dt>${e(unknown.label)}</dt><dd>${e(unknown.reason)} ${cites(unknown)}</dd>`).join('')}</dl></details>
  </section>
  <section id="sources" aria-labelledby="sources-heading">
    <h2 id="sources-heading">Sources</h2>
    <ol class="source-list">${reference.sources.map((source) => `<li id="source-${e(source.id)}"><a href="${e(source.url)}">${e(source.title)}</a><br><span class="muted">${e(source.author)} · ${source.kind === 'author-project-page' ? 'Author project page' : 'Editorial reference'} · Checked ${e(source.checkedAt)}</span></li>`).join('')}</ol>
    <p class="muted">The mechanics paraphrase author instructions. The block-role table is an editorial explanation. This reference covers Mielon's Java Edition project, CurseForge 1691925.</p>
  </section>
  <footer><a href="./reference.json">Download the cited JSON reference</a><p>Unofficial; not affiliated with Mojang, Microsoft, or the mod author.</p></footer>
</main>
</body>
</html>
`;
}
