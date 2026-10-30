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

## 3. Fragilidad conocida

- El `<select>` se inyecta en `.topbar .ml-auto`. Si Budget Vault cambia ese markup, el
  desplegable desaparece; el comando `Cambiar de libro` sigue funcionando.
- `app.plugins` no es API oficial de Obsidian (es el mecanismo de facto entre plugins).
- Si Budget Vault renombra `VIEW_TYPE` (`budget-app-view`) o el comando `open-budget`,
  hay que actualizar las constantes del principio de `main.js`.

## 4. Verificación después de cada cambio en Budget Vault

```bash
# en el vault, con Obsidian cerrado o después de "Reload app"
node --check .obsidian/plugins/budget-books/main.js
```

Y en Obsidian: cambiar de libro y confirmar que el Dashboard cambia de cuentas.
