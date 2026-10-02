import { readReference, validateReference, renderReference } from './reference.mjs';

const reference = validateReference(await readReference());
const html = renderReference(reference);
if (/<script\b|<iframe\b|<form\b/i.test(html)) throw new Error('The offline reference must stay static.');
console.log(`Checked ${reference.facts.length} facts, ${reference.blockRoles.length} block roles, ${reference.questions.length} questions, and their citations.`);
