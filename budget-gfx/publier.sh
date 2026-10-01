#!/usr/bin/env bash
# Reconstruit les pages et les met en ligne (branche gh-pages → GitHub Pages).
# Utilisation : ./publier.sh   (depuis le dossier budget-gfx, après avoir commité tes changements)
set -euo pipefail
cd "$(dirname "$0")"
python3 build.py
cd "$(git rev-parse --show-toplevel)"
if [ -n "$(git status --porcelain -- budget-gfx/dist)" ]; then
  echo "dist/ a changé : commite-le d'abord (git add budget-gfx && git commit -m '...')"; exit 1
fi
git push origin "$(git subtree split --prefix budget-gfx/dist HEAD)":refs/heads/gh-pages --force
echo "En ligne dans 1 à 2 minutes : https://mickaelkev.github.io/Mick/"
