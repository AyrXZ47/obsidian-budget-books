# Budget Books

[Español](README.es.md)

A **book selector for [Budget Vault](https://github.com/RuanPienaarCode/budget-vault)**
(`budget-app`), the Obsidian budgeting plugin. It adds a dropdown to Budget Vault's
top bar that switches between budget folders — personal, business, one per client —
so you do not need one vault per book.

> Unofficial. Not affiliated with, endorsed by, or supported by the Budget Vault
> author. Requirements and limits are listed below; read them before relying on it.

## The problem

Budget Vault reads **one budget folder per plugin** (`settings.budgetFolder`). To
keep separate sets of books — so a partner or a family member sees their own
complete ledger, and only theirs — that folder has to change.

## How it works (and why it is not a fork)

Two calls against the running plugin:

1. `plugin.settings.budgetFolder = 'Finances/Business'` and `saveSettings()`
2. `view.appCtl.reload()` — re-reads the vault from disk

This works because Budget Vault's `basePath()` (`src/io.js`:
`const basePath = () => normalizePath(plugin.settings.budgetFolder)`) reads the
setting **on every call** instead of capturing it at registration. One setting
write plus one reload is a complete book change, with nothing reinstantiated.

**Budget Vault's bundle is never modified**, so its own updates cannot break this.
A fork would have to merge every release, and the upstream author ships often.

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
