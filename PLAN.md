# Plan

## 1. Agregar un libro nuevo (hoy: sin tocar código)

El selector descubre solo cualquier carpeta bajo `Finances/` que tenga un `Settings.md`.
Así que un libro nuevo es una carpeta nueva, y nada más:

```bash
# en el vault: ~/Sync/Notes
mkdir -p Finances/StikerTuning/{Accounts,Categories,Transactions,Budgets,Plans,Notes,Tax,Receipts,Data}
cp Finances/PIGNUS/Settings.md Finances/StikerTuning/Settings.md   # cambiar `household:`
```

Después, en Obsidian: el `<select>` de la barra superior ya lo lista. Si querés un
nombre distinto al de la carpeta:

```json
// .obsidian/plugins/budget-books/data.json
{ "labels": { "Finances/Budget": "Personal", "Finances/StikerTuning": "Stiker Tuning" } }
```

Eso es todo. **No hay que modificar código** para un libro nuevo.

## 2. Lo que sí necesitaría código (si alguna vez hace falta)

- **Vista combinada** (un Dashboard que sume los tres libros). Hoy cada libro se lee
  solo, y eso es lo que mantiene el libro personal separado del negocio. Una vista
  consolidada requeriría cargar varios estados a la vez, que es un refactor grande de
  `S` (hoy es un único estado global por vista).
- **Libro por dispositivo** en lugar de sincronizado: guardar la elección en
  `localStorage` y escribir `settings.budgetFolder` al abrir. Hoy el libro activo viaja
  entre dispositivos porque vive en el `data.json` de Budget Vault.
- **Selector dentro del drawer** en vez de la barra superior, para pantallas angostas.

## 3. Acoplamiento y fragilidad conocida

**No soportado por Budget Vault.** El cambio de libro escribe
`plugin.settings.budgetFolder` y llama `view.appCtl.reload()`. La API pública de
Budget Vault es de solo lectura (`apiVersion 1`), así que este camino es interno.
Ruan aceptó el plugin hermano, pero pidió documentar el acoplamiento como no
soportado y fijarlo a las versiones verificadas (discusión #154).

| Budget Vault | Verificación |
|---|---|
| 1.54.0 | En vivo: cambio de libro. |
| 1.56.0 | Código: `basePath()` lee el setting en cada llamada y `appCtl.reload()` existe. |
| 1.58.0 | Código re-revisado 2026-11-05: los dos hooks siguen presentes. |

Si una versión futura rompe esto, el fallback es cambiar la carpeta desde los
ajustes del propio Budget Vault. No hay API pública de escritura.

- El `<select>` se inyecta en `.topbar .ml-auto`. Si Budget Vault cambia ese markup, el
  desplegable desaparece; el comando `Cambiar de libro` sigue funcionando.
- `app.plugins` no es API oficial de Obsidian (es el mecanismo de facto entre plugins).
- Si Budget Vault renombra `VIEW_TYPE` (`budget-app-view`) o el comando `open-budget`,
  hay que actualizar las constantes del principio de `main.js`.

## 4. Verificación después de cada cambio en Budget Vault

Antes de dar por buena una versión nueva, confirmar en el código de Budget Vault que
siguen existiendo los dos hooks:

```bash
rg -n "const basePath|reload: async" src/io.js src/controller.js
```

Después, en el vault con Obsidian cerrado o después de "Reload app":

```bash
node --check .obsidian/plugins/budget-books/main.js
```

Y en Obsidian: cambiar de libro y confirmar que el Dashboard cambia de cuentas.
Actualizar la tabla de §3 con la versión verificada.
