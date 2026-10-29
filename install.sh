#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Yovick
# Copia el plugin al vault. El vault se sincroniza por Syncthing, así que
# esto se corre UNA vez en la máquina donde editás: los demás dispositivos
# reciben la copia.
set -euo pipefail
VAULT="${VAULT:-$HOME/Sync/Notes}"
DEST="$VAULT/.obsidian/plugins/budget-books"
mkdir -p "$DEST"
cp manifest.json main.js "$DEST/"
[ -f "$DEST/data.json" ] || cp data.example.json "$DEST/data.json"
echo "instalado en $DEST"
echo "en Obsidian: Ajustes -> Community plugins -> activar Budget Books"
