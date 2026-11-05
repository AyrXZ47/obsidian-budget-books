# Budget Books

[Español](README.es.md)

A **book selector for [Budget Vault](https://github.com/RuanPienaarCode/budget-vault)**
(`budget-app`), the Obsidian budgeting plugin. It adds a dropdown to Budget Vault's
top bar that switches between budget folders — personal, business, one per client —
so you do not need one vault per book.

> Unofficial. Not affiliated with, endorsed by, or supported by the Budget Vault
> author. Requirements and limits are listed below; read them before relying on it.

## Support status

Budget Books is a **sibling plugin**, not part of Budget Vault. It switches books
through two Budget Vault internals: `plugin.settings.budgetFolder` (plus
`saveSettings()`) and `view.appCtl.reload()`. Budget Vault's public API is read-only
(`apiVersion 1`), so this write path is **unsupported** by the Budget Vault author:
a future release may change or remove it without notice.

Pinned to the versions verified:

| Budget Vault | Verification |
|---|---|
| 1.54.0 | Live vault: switching books works. |
| 1.56.0 | Source: `basePath()` reads `settings.budgetFolder` on every call; `appCtl.reload()` exists. |
| 1.58.0 | Source re-checked 2026-11-05: both hooks are still present. |

Upstream position: [discussion #154](https://github.com/RuanPienaarCode/budget-vault/discussions/154).
The author prefers the sibling plugin for now and will design a write API only if
multi-book becomes a real need. If that happens, Budget Books will be its first
consumer.

If a Budget Vault update breaks switching, change the folder in Budget Vault's own
settings as the fallback; there is no public write API to depend on.

## The problem

Budget Vault reads **one budget folder per plugin** (`settings.budgetFolder`). To
keep separate sets of books — so a partner or a family member sees their own
complete ledger, and only theirs — that folder has to change.

## How it works (and why it is not a fork)

Two calls against the running plugin (both internals, not public API — see
[Support status](#support-status)):

1. `plugin.settings.budgetFolder = 'Finances/Business'` and `saveSettings()`
2. `view.appCtl.reload()` — re-reads the vault from disk

This works because Budget Vault's `basePath()` (`src/io.js`:
`const basePath = () => normalizePath(plugin.settings.budgetFolder)`) reads the
setting **on every call** instead of capturing it at registration. One setting
write plus one reload is a complete book change, with nothing reinstantiated.

**Budget Vault's bundle is never modified**, so there is no fork to keep merging. That
does not make the coupling supported: the two hooks above are still internals and can
change in a release.

## Requirements

- Obsidian 1.8.0 or newer
- [Budget Vault](https://github.com/RuanPienaarCode/budget-vault) installed and
  enabled

## Install

No build step, nothing minified: `main.js` is the source.

```bash
VAULT="$HOME/Sync/Notes"        # your vault path
mkdir -p "$VAULT/.obsidian/plugins/budget-books"
cp manifest.json main.js "$VAULT/.obsidian/plugins/budget-books/"
```

Or edit the defaults in [`install.sh`](install.sh) and run `./install.sh`.

Or, if you use [BRAT](https://github.com/TfTHacker/obsidian42-brat): **Add Beta
plugin** → `AyrXZ47/obsidian-budget-books`. BRAT follows the latest release, so
updates arrive without copying files around.

Then: **Settings → Community plugins → enable Budget Books**.

Because `.obsidian/plugins/` lives inside the synced vault, the plugin reaches your
other devices on its own.

## Book discovery

Any folder under `Finances/` that contains a `Settings.md` is a book, and lists
itself. Adding a folder with a budget in it makes it appear in the selector.

The active book is always listed, even when it lives outside `Finances/`.

To show a display name other than the folder name, write `data.json`
(see [`data.example.json`](data.example.json)):

```json
{ "labels": { "Finances/Budget": "Personal" } }
```

`Finances/Budget` is Budget Vault's default folder, which is why it carries that
name instead of something friendlier.

## Known limits

- The write path is unsupported and pinned to Budget Vault 1.54.0, 1.56.0, and
  1.58.0 (see [Support status](#support-status)). A release outside that list may
  break switching without notice.
- The selector is injected into Budget Vault's top bar. If a future version changes
  that markup, the `<select>` disappears; the command `Budget Books: Cambiar de
  libro` in the command palette keeps working.
- It reaches other plugins through `app.plugins`, which is not part of Obsidian's
  public API. It is the de facto mechanism for plugins that talk to each other.
- It writes `budgetFolder` into Budget Vault's `data.json`, which is synced too, so
  the active book follows you across devices. Two devices switching books at the
  same time can produce a sync conflict in that one file.
- It refuses to switch while a page has unsaved edits: the row would otherwise be
  written into the wrong book.
- UI strings and the command names are in Spanish.
- It is a selector, not a merger. Books stay separate on disk; there is no
  consolidated view across them.

## License

GPL-3.0-only — see [LICENSE](LICENSE).

No Budget Vault code is copied, bundled, or imported here. This plugin talks to it
at runtime through Obsidian's plugin registry, so its AGPL-3.0 license does not
extend to this repository. GPL-3.0 works may be combined with AGPL-3.0 works
(GPL-3.0 §13), which keeps this compatible with the upstream choice.
