# Using and updating the reference

Read `data/reference.json` to build a block comparison, answer a player's project-scope question, or retain citations in modpack documentation. Keep the `scope` beside the facts: these records describe Mielon's Java Edition project.

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Version of this data structure |
| `compiledAt` | Snapshot compilation date |
| `sources` | Author, URL, source kind, publication date if known, and review date |
| `facts[].sourceIds` | Sources supporting a paraphrased mechanic |
| `blockRoles[].interpretation` | Identifies the role table as editorial explanation |
| `questions` | Direct answers for command, Bedrock, and mod ownership questions |
| `unknowns[].value` | `null` until a source or release-specific observation establishes the value |

Run `npm run check` after an edit. It validates unique record IDs, source references, scope, dates, URLs, and the fields used by the HTML renderer. `npm test` also exercises escaping, static output, and the local server's file boundary.

When an author instruction changes, record the supporting source and its actual review date, update the affected fact, and rebuild the HTML. Change `compiledAt` for a new snapshot; keep unchanged source review dates. A release-specific item ID needs its release and evidence before replacing `null`.

To adapt the page, edit `examples/style.css`. It follows system light/dark appearance, works without JavaScript, and has a print view. `npm run build` recreates `dist/index.html`, `dist/style.css`, and `dist/reference.json`. Those generated files are ignored by Git.

The demo server serves those three files only and listens on `127.0.0.1`. It does not expose the repository directory or write visitor data.
