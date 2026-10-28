'use strict';
/* Budget Books — selector de libro para Budget Vault.

   POR QUÉ EXISTE. Budget Vault tiene UNA sola carpeta de presupuesto por plugin
   (`plugin.settings.budgetFolder`). Para tener varios libros (personal, PIGNUS,
   AquaClyva) sin abrir varios vaults, este plugin hace exactamente dos cosas,
   las dos por API pública del otro plugin:

     1. Escribe `settings.budgetFolder` y guarda.
     2. Pide al Budget Vault que relea el disco (`view.appCtl.reloadFromDisk()`).

   Eso funciona porque `basePath()` de Budget Vault
   (`src/io.js`: `const basePath = () => normalizePath(plugin.settings.budgetFolder)`)
   lee el setting EN CADA LLAMADA, no lo captura al registrarse. Así que cambiar
   el setting y releer es un cambio de libro completo, sin reinstanciar nada y
   sin tocar el código de Budget Vault.

   NO modifica el bundle de Budget Vault: sobrevive a sus actualizaciones. Lo
   único "frágil" son dos strings (`budget-app`, `budget-app-view`), los dos
   públicos y estables.

   Descubre los libros solo: cualquier carpeta bajo `Finances/` que tenga un
   `Settings.md` es un libro. Agregás una carpeta y aparece en el selector. */

const { Plugin, Notice, SuggestModal } = require('obsidian');

const BUDGET_ID = 'budget-app';
const VIEW_TYPE = 'budget-app-view';
const ROOT = 'Finances';
const SELECT_CLASS = 'book-select';

class BookModal extends SuggestModal {
  constructor(app, items, onPick) {
    super(app);
    this.items = items;
    this.onPick = onPick;
    this.setPlaceholder('Cambiar de libro…');
  }
  getSuggestions(q) {
    const needle = String(q || '').toLowerCase();
    return this.items.filter(i => i.label.toLowerCase().includes(needle));
  }
  renderSuggestion(item, el) {
    el.createEl('div', { text: item.label });
    el.createEl('small', { text: item.path });
  }
  onChooseSuggestion(item) { this.onPick(item.path); }
}

module.exports = class BudgetBooks extends Plugin {
  async onload() {
    /* Nombre visible de cada libro. `Finances/Budget` es la carpeta por defecto
       del plugin (por eso se llama así y no se mueve), pero en el selector se
       muestra como "Personal". */
    this.data = (await this.loadData()) || {};
    this.app.workspace.onLayoutReady(() => this.attachAll());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.attachAll()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.attachAll()));
    this.addCommand({
      id: 'switch-book',
      name: 'Cambiar de libro',
      callback: () => {
        const items = this.books();
        if (items.length < 2) { new Notice('Budget Books: no encontré más de un libro en ' + ROOT); return; }
        new BookModal(this.app, items, path => this.switchTo(path)).open();
      },
    });
  }

  onunload() {
    for (const sel of document.querySelectorAll('.' + SELECT_CLASS)) sel.remove();
    for (const leaf of this.budgetLeaves()) {
      if (leaf.view) this.detach(leaf.view);
    }
  }

  /* ---------------------------------------------------------------- datos */

  budgetPlugin() { return (this.app.plugins && this.app.plugins.plugins && this.app.plugins.plugins[BUDGET_ID]) || null; }

  label(path) {
    const custom = this.data && this.data.labels && this.data.labels[path];
    return custom || path.split('/').pop();
  }

  activeFolder() {
    const b = this.budgetPlugin();
    return (b && b.settings && b.settings.budgetFolder) || '';
  }

  /* Sync y por API pública: la carpeta raíz del vault y sus hijos. Un libro es
     una carpeta con Settings.md adentro. */
  books() {
    const out = new Map();
    const root = this.app.vault.getRoot();
    const fin = (root.children || []).find(c => c.name === ROOT && Array.isArray(c.children));
    for (const f of (fin ? fin.children : [])) {
      if (!Array.isArray(f.children)) continue;
      if (!f.children.some(c => c.name === 'Settings.md')) continue;
      out.set(f.path, this.label(f.path));
    }
    /* El libro activo siempre está en la lista, aunque viva fuera de ROOT. */
    const active = this.activeFolder();
    if (active && !out.has(active)) out.set(active, this.label(active));
    return Array.from(out, ([path, label]) => ({ path, label }))
      .sort((a, b) => (a.path === active ? -1 : b.path === active ? 1 : a.label.localeCompare(b.label)));
  }

  /* --------------------------------------------------------------- cambio */

  /* ¿Hay algo sin guardar? Se pregunta ANTES de tocar el setting, porque un
     cambio de libro con filas sin guardar es peor que un cambio de libro que no
     pasa: la fila terminaría escribiéndose en el libro equivocado.

     El proxy es el mismo que usa el plugin para habilitar sus botones de guardar
     (`pageSaveBtn()` -> `!page.disabled`): un botón cuyo texto dice Guardar/Save y
     que no está deshabilitado. */
  hasUnsaved(el) {
    return Array.from(el.querySelectorAll('button')).some(b =>
      !b.disabled && b.offsetParent !== null && /^(guardar|save)/i.test((b.textContent || '').trim()));
  }

  /* La recarga correcta. `mountApp` devuelve `{ start, destroy, reload, … }` —
     `reload()` es la ruta limpia (espera connectVault(), que relee `basePath()`
     desde `settings.budgetFolder` en vivo). `reloadFromDisk` NO está expuesta: es
     interna del ctx, y llamarla desde afuera no es posible. Por eso versión
     anterior de este archivo parecía funcionar y no recargaba nada: caía al
     comando `open-budget`, que solo enfoca la pestaña que ya existe. */
  async reloadView(leaf) {
    const el = leaf.view && leaf.view.containerEl;
    const ctl = leaf.view && leaf.view.appCtl;
    if (ctl && typeof ctl.reload === 'function') { await ctl.reload(); return true; }
    /* Fallback: el botón "Reload from disk" del propio plugin, que es la ruta
       que el lector ya validó. */
    const link = el && el.querySelector('#reloadLink');
    if (link) { link.click(); await new Promise(r => setTimeout(r, 500)); return true; }
    return false;
  }

  async switchTo(folder) {
    const b = this.budgetPlugin();
    if (!b) { new Notice('Budget Books: Budget Vault no está cargado.'); return; }
    if (!folder || folder === b.settings.budgetFolder) return;

    const leaves = this.budgetLeaves();
    for (const leaf of leaves) {
      const el = leaf.view && leaf.view.containerEl;
      if (el && this.hasUnsaved(el)) {
        new Notice('Hay cambios sin guardar. Guardá antes de cambiar de libro.', 6000);
        this.attachAll();
        return;
      }
    }

    const previous = b.settings.budgetFolder;
    try {
      b.settings.budgetFolder = folder;
      await b.saveSettings();
      let reloaded = 0;
      for (const leaf of leaves) if (await this.reloadView(leaf)) reloaded++;
      if (!reloaded) this.app.commands.executeCommandById(BUDGET_ID + ':open-budget');
      await new Promise(r => setTimeout(r, 120));
      this.attachAll();
      new Notice('Libro: ' + this.label(folder));
    } catch (e) {
      b.settings.budgetFolder = previous;
      try { await b.saveSettings(); } catch (_) { /* el setting ya volvió en memoria */ }
      new Notice('Budget Books: no pude cambiar de libro — ' + (e && e.message ? e.message : e));
    }
  }

  /* ------------------------------------------------------------------- UI */

  budgetLeaves() {
    try { return this.app.workspace.getLeavesOfType(VIEW_TYPE) || []; } catch (e) { return []; }
  }

  attachAll() {
    for (const leaf of this.budgetLeaves()) {
      const view = leaf.view;
      if (view && view.containerEl) this.attach(view);
    }
  }

  attach(view) {
    const el = view.containerEl;
    const ensure = () => {
      const host = el.querySelector('.topbar .ml-auto') || el.querySelector('.topbar');
      if (!host) return;
      let sel = host.querySelector('.' + SELECT_CLASS);
      if (!sel) {
        sel = document.createElement('select');
        sel.className = SELECT_CLASS + ' dropdown';
        sel.title = 'Cambiar de libro';
        sel.setAttribute('aria-label', 'Cambiar de libro');
        sel.style.cssText = 'margin-right:8px;height:28px;max-width:180px;font-size:12px;' +
          'border-radius:8px;border:1px solid var(--background-modifier-border);' +
          'background:var(--background-secondary);color:var(--text-normal);';
        sel.addEventListener('change', () => this.switchTo(sel.value));
        if (host.classList.contains('ml-auto')) host.insertBefore(sel, host.firstChild);
        else host.appendChild(sel);
      }
      this.fill(sel);
    };
    /* El plugin reconstruye el shell en cada render, así que el selector se
       vuelve a inyectar cuando desaparece. Un flag evita la tormenta de
       mutaciones que causaría escribir el DOM desde el propio observer. */
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => { scheduled = false; ensure(); }, 60);
    };
    if (view.__bookObserver) view.__bookObserver.disconnect();
    view.__bookObserver = new MutationObserver(schedule);
    view.__bookObserver.observe(el, { childList: true, subtree: true });
    ensure();
  }

  fill(sel) {
    const active = this.activeFolder();
    const items = this.books();
    const wanted = items.map(i => i.path).join('|');
    if (sel.dataset.books !== wanted) {
      sel.replaceChildren();
      for (const i of items) {
        const o = document.createElement('option');
        o.value = i.path;
        o.textContent = i.label;
        sel.appendChild(o);
      }
      sel.dataset.books = wanted;
    }
    if (active && sel.value !== active) sel.value = active;
  }

  detach(view) {
    if (view.__bookObserver) { view.__bookObserver.disconnect(); delete view.__bookObserver; }
  }
};
