# Budget Books

Selector de libro para **Budget Vault** (`budget-app`), el plugin de finanzas de
Obsidian. Agrega un desplegable en la barra superior que cambia entre libros
(personal, PIGNUS, AquaClyva, …) sin abrir un vault por libro.

## El problema

Budget Vault lee **una sola carpeta de presupuesto por plugin**
(`settings.budgetFolder`). Para llevar contabilidades separadas —y que el socio
o la familia pueda ver la suya completa, sin filtrar la personal— hace falta
cambiar de carpeta.

## La solución (y por qué no es un fork)

Dos llamadas por API pública del otro plugin:

1. `plugin.settings.budgetFolder = 'Finances/PIGNUS'` + `saveSettings()`
2. `view.appCtl.reload()` — relee el vault

Funciona porque `basePath()` de Budget Vault
(`src/io.js`: `const basePath = () => normalizePath(plugin.settings.budgetFolder)`)
lee el setting **en cada llamada**, no lo captura al registrarse. Así un cambio de
setting + recarga es un cambio de libro completo, sin reinstanciar nada.

**No se toca el bundle de Budget Vault**, así que sus actualizaciones no rompen
esto. Un fork obligaría a mergear cada release (el autor publica cada ~5 días).

## Descubrimiento automático

Cualquier carpeta bajo `Finances/` que contenga un `Settings.md` es un libro.
Se lista sola. Para mostrar un nombre distinto al de la carpeta:

```json
{ "labels": { "Finances/Budget": "Personal" } }
```

## Instalación

```bash
./install.sh
```

Luego: Ajustes → Community plugins → activar **Budget Books**.

Como `.obsidian/plugins/` vive dentro de la carpeta sincronizada, el plugin
llega solo al resto de los dispositivos.

## Límites conocidos

- El selector se inyecta en la barra superior de Budget Vault. Si una versión
  futura cambia ese markup, el `<select>` desaparece; el comando de paleta
  `Cambiar de libro` sigue funcionando.
- Usa `app.plugins`, que no es API oficial de Obsidian. Es el mecanismo estándar
  de facto para plugins que se hablan entre sí.
- `budgetFolder` vive en el `data.json` de Budget Vault, que **también se
  sincroniza**: el libro activo te sigue entre dispositivos. Dos dispositivos
  cambiando de libro a la vez pueden generar un conflicto de Syncthing en ese
  archivo (se resuelve con lo que hay en `.stversions`).
- No cambia de libro si hay una página con cambios sin guardar.
