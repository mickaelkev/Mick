# Budget GFX — consignes pour Claude

- Modifier seulement `src/`, `conseillers/` et `assets/`. `dist/` est généré par `python3 build.py`. Toujours reconstruire et commiter `dist/` avec la source.
- Textes dynamiques en deux langues : `L('français','English')`. Textes fixes de `body.html` : ajouter la traduction dans `src/traductions-en.json`.
- Jamais de `<head`, `<body`, `<html`, `<meta`, `<title`, `<style`, `<!doctype`, `</script` littéraux dans `app.js` : utiliser `\x3c…` (build.py bloque sinon).
- Les données client restent dans le navigateur (localStorage). Ne jamais ajouter d'envoi des dépenses de « Mon suivi » au conseiller ni de stockage serveur.
- Rapport et résumé envoyés au conseiller : en français.
- Tester sur téléphone (320 px et 390 px), en mode clair et sombre, sans défilement horizontal.
