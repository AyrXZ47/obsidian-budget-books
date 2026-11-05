# Budget Books

Selector de libro para **Budget Vault** (`budget-app`), el plugin de finanzas de
Obsidian. Agrega un desplegable en la barra superior que cambia entre libros
(personal, PIGNUS, AquaClyva, …) sin abrir un vault por libro.

## Estado de soporte

Budget Books es un **plugin hermano**, no parte de Budget Vault. Cambia de libro con
dos hooks internos de Budget Vault: `plugin.settings.budgetFolder` (más
`saveSettings()`) y `view.appCtl.reload()`. La API pública de Budget Vault es de solo
lectura (`apiVersion 1`), así que este camino de escritura **no está soportado** por
el autor de Budget Vault: una versión futura puede cambiarlo o quitarlo sin aviso.

Fijado a las versiones verificadas:

| Budget Vault | Verificación |
|---|---|
| 1.54.0 | Vault en vivo: el cambio de libro funciona. |
| 1.56.0 | Código: `basePath()` lee `settings.budgetFolder` en cada llamada; `appCtl.reload()` existe. |
| 1.58.0 | Código re-revisado 2026-11-05: los dos hooks siguen presentes. |

Posición upstream: [discusión #154](https://github.com/RuanPienaarCode/budget-vault/discussions/154).
El autor prefiere el plugin hermano por ahora y diseñará una API de escritura solo si
el soporte multi-libro se vuelve una necesidad real. Si eso pasa, Budget Books será
su primer consumidor.

Si una actualización de Budget Vault rompe el cambio de libro, cambiá la carpeta
desde los ajustes del propio Budget Vault como fallback; no hay API pública de
escritura de la que depender.

## El problema

Budget Vault lee **una sola carpeta de presupuesto por plugin**
(`settings.budgetFolder`). Para llevar contabilidades separadas —y que el socio
o la familia pueda ver la suya completa, sin filtrar la personal— hace falta
cambiar de carpeta.

## La solución (y por qué no es un fork)

Dos llamadas a hooks internos del otro plugin (no son API pública; ver
[Estado de soporte](#estado-de-soporte)):

1. `plugin.settings.budgetFolder = 'Finances/PIGNUS'` + `saveSettings()`
2. `view.appCtl.reload()` — relee el vault

Funciona porque `basePath()` de Budget Vault
(`src/io.js`: `const basePath = () => normalizePath(plugin.settings.budgetFolder)`)
lee el setting **en cada llamada**, no lo captura al registrarse. Así un cambio de
setting + recarga es un cambio de libro completo, sin reinstanciar nada.

**No se toca el bundle de Budget Vault**, así que no hay un fork que mergear. Eso no
hace que el acoplamiento esté soportado: los dos hooks siguen siendo internos y pueden
cambiar en una release.

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

O con [BRAT](https://github.com/TfTHacker/obsidian42-brat): **Add Beta plugin**
→ `AyrXZ47/obsidian-budget-books`. Sigue el último release, así que las
actualizaciones llegan sin copiar archivos a mano.

Como `.obsidian/plugins/` vive dentro de la carpeta sincronizada, el plugin
llega solo al resto de los dispositivos.

## Límites conocidos

- El camino de escritura no está soportado y está fijado a Budget Vault 1.54.0,
  1.56.0 y 1.58.0 (ver [Estado de soporte](#estado-de-soporte)). Una versión fuera
  de esa lista puede romper el cambio de libro sin aviso.
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
