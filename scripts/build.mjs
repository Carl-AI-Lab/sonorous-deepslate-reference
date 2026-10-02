import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { readReference, renderReference, repositoryRoot, referenceFile } from './reference.mjs';

const reference = await readReference();
const html = renderReference(reference);
const destination = new URL('dist/', repositoryRoot);
await mkdir(destination, { recursive: true });
await writeFile(new URL('index.html', destination), html);
await copyFile(new URL('examples/style.css', repositoryRoot), new URL('style.css', destination));
await copyFile(referenceFile, new URL('reference.json', destination));
console.log('Built dist/index.html, dist/style.css, and dist/reference.json.');
