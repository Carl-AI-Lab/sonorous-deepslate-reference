# Sonorous Deepslate Reference

A compact reference for the Ancient City portal bases in **Mielon's The Sift**: where they sit, how awakening leads to Note mode, and which block receives each interaction.

[Sonorous Deepslate in Minecraft](https://minecraftthesift.com/mods/mielons-the-sift/sonorous-deepslate/) — read the illustrated block guide online.

This repository and minecraftthesift.com share the same maintainer. Unofficial; not affiliated with Mojang, Microsoft, or the mod author.

## What you can use

- [`data/reference.json`](data/reference.json): cited facts, block roles, three common questions, and explicit unknowns for documentation or modpack notes.
- An offline HTML reference with source links and a printable block-role table.
- [`docs/sources.md`](docs/sources.md): source dates, definitions, and the distinction between author instructions and editorial explanations.

The reference covers Mielon's Java Edition project, CurseForge **1691925**. It keeps Sonorous Deepslate, the Note Block above it, and the Reinforced Deepslate frame separate. For the performance itself, follow [The Sift portal song and note order](https://minecraftthesift.com/mods/mielons-the-sift/portal/).

## Run the offline reference

Use Node.js **22.18 or later**. There are no runtime or build dependencies to install.

```sh
npm run check
npm test
npm run demo
```

Open **http://127.0.0.1:5174**. To choose another local port:

```sh
npm run demo -- --port 5175
```

`npm test` builds its own output before checking it. To build without running tests, use `npm run build`; you can then open `dist/index.html` directly. The page uses local CSS and JSON; it makes no analytics or advertising requests. Its external links open only when you choose to follow them.

## Three questions players ask

**Can I get Sonorous Deepslate with a command?** The checked author instructions don't provide an item ID or `/give` command. For the portal, use the Ancient City setup; for a separate build, check your installed release's block information.

**Is Sonorous Deepslate available on Bedrock?** Mielon's author listing covers Java Edition and lists no Bedrock release. That scope applies to this project.

**Which mod adds Sonorous Deepslate?** Mielon's The Sift. The block isn't part of vanilla Minecraft.

## Reuse the data

Read the JSON directly:

```js
import { readFile } from 'node:fs/promises';

const reference = JSON.parse(await readFile('data/reference.json', 'utf8'));
const roles = reference.blockRoles.map(({ name, role }) => ({ name, role }));
console.table(roles);
```

Each fact or explanation carries `sourceIds`. Resolve them against `sources` to retain its provenance. `checkedAt` records when the source was checked; `compiledAt` records when this snapshot was assembled. A new compilation date does not imply a new gameplay test or source check. See [`docs/usage.md`](docs/usage.md) for the data fields and update checks.

## Sources and license

Mechanics come from [Mielon's The Sift on CurseForge](https://www.curseforge.com/minecraft/mc-mods/mielons-the-sift); Java compatibility and the advancement recommendation come from [Mielon's The Sift on Modrinth](https://modrinth.com/mod/mielons-the-sift). The author pages were checked **October 1, 2026**.

Original code, reference wording, and data structure are available under the [MIT License](LICENSE). This repository does not distribute mod binaries, textures, screenshots, or other author assets. Minecraft and project names retain their owners' rights.
