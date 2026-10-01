# Budget GFX

Page budget que les conseillers GFX envoient à leurs clients. Le client remplit son budget sur son téléphone et l'envoie à son conseiller. Il prend aussi rendez-vous et reçoit en bonus l'app gratuite **Mon suivi**, pour suivre ses dépenses et ses paiements au quotidien.

- Une page autonome par conseiller : un seul fichier HTML, sans serveur.
- Les données du client restent **dans son navigateur** (localStorage). Personne d'autre ne les voit, même s'il a le même lien.
- Ce qu'il envoie à son conseiller : un courriel et un rapport. Ses dépenses quotidiennes (Mon suivi) n'en font jamais partie.

## Structure

```
budget-gfx/
├── build.py                 ← assemble les pages (python3 build.py)
├── publier.sh               ← met les pages en ligne (GitHub Pages)
├── conseillers/             ← un fichier par conseiller (nom, courriel, lien de rendez-vous, photos)
│   ├── mickael.json
│   ├── thomas.json
│   └── zachary.json
├── assets/                  ← logo et photos des conseillers (.webp, .jpg ou .png)
├── src/
│   ├── head.html            ← <head> de base (titre, polices)
│   ├── base.css             ← styles de base (couleurs, typographie, champs)
│   ├── styles.css           ← styles ajoutés : mode guidé, app Mon suivi, accueil…
│   ├── body.html            ← structure de la page (accueil, onglets, envoi, app)
│   ├── app.js               ← toute la logique (calculs, impôts 2026 QC, mode guidé, Mon suivi)
│   ├── traductions-en.json  ← traductions anglaises du texte fixe de body.html
│   └── vendor/              ← librairie de code QR (MIT)
└── dist/<conseiller>/       ← pages finales prêtes à mettre en ligne (générées)
```

**Ne modifie jamais `dist/` à la main** : modifie `src/` ou `conseillers/`, puis relance `python3 build.py`.

## Modifier la page

1. Fais tes changements dans `src/` :
   - un texte de l'accueil ou de l'envoi : `src/body.html` ;
   - un poste du budget, un calcul, un texte des étapes ou de l'app : `src/app.js` ;
   - l'apparence : `src/styles.css`.
2. Lance `python3 build.py`. Il faut Python 3 ; Pillow (`pip install pillow`) sert à l'icône de l'écran d'accueil, et Node vérifie le JavaScript s'il est installé.
3. Ouvre `dist/mickael/index.html` dans ton navigateur, en vue téléphone, pour vérifier.
4. Commit et push.

### Règles importantes

- **Textes dynamiques** (dans `app.js`) : toujours en deux langues avec `L('texte français','English text')`.
- **Textes fixes** (dans `body.html`) : ajoute la traduction dans `src/traductions-en.json` (`"texte français": "English text"`).
- **Dans `app.js`, n'écris jamais** `<head`, `<body`, `<html`, `<meta`, `<title`, `<style`, `<!doctype` ni `</script` tels quels dans une chaîne : écris `\x3chead>`, `\x3c/script>`, etc. Sinon, la page se coupe dans certains visualiseurs. `build.py` refuse de construire si ça arrive.
- Le rapport et le résumé envoyés au conseiller restent **en français**, même quand le client remplit en anglais.
- Les montants sont convertis par mois. Les fréquences possibles : `sem`, `2sem`, `2fm`, `mois`, `2mois`, `3mois`, `an`.

## Ajouter ou activer un conseiller

1. Mets ses deux photos dans `assets/` :
   - `photo-proche-<prénom>.webp` : visage et haut du corps, format portrait ;
   - `photo-loin-<prénom>.webp` : en pied, pour la fin de la page.
2. Remplis `conseillers/<prénom>.json` : courriel, `lien_rendez_vous` (Microsoft Bookings), puis `"actif": true`.
3. `python3 build.py` → `dist/<prénom>/index.html`.

Chaque conseiller a sa propre clé de sauvegarde. Un client qui ouvre deux versions ne mélange donc pas ses données.

| Champ | Rôle |
|---|---|
| `lien_rendez_vous` | Lien Microsoft Bookings. Vide : le bouton ouvre un courriel de demande de rendez-vous. |
| `lien_page` | Adresse où la page est en ligne, utilisée pour le code QR et le lien à copier en mode conseiller. |
| `webhook` | Facultatif. Adresse qui reçoit un avis quand un client commence ou envoie son budget. |

## Mettre en ligne (GitHub Pages)

Les pages sont servies depuis la branche `gh-pages`, qui contient seulement le dossier `dist/`. Après avoir commité tes changements :

```
./publier.sh
```

En 1 à 2 minutes, c'est en ligne :

| Page | Lien |
|---|---|
| Accueil, avec la liste des conseillers | https://mickaelkev.github.io/Mick/ |
| Mickaël | https://mickaelkev.github.io/Mick/mickael/ |
| Thomas, une fois activé | https://mickaelkev.github.io/Mick/thomas/ |
| Zachary, une fois activé | https://mickaelkev.github.io/Mick/zachary/ |

Si le lien ne répond pas après le premier `./publier.sh`, va dans **Settings → Pages → Deploy from a branch → `gh-pages` / `(root)`**.

Hébergée ainsi, la page permet en plus :
- d'ajouter les paiements au calendrier du téléphone (.ics) ;
- d'envoyer les avis par webhook ;
- de préremplir le nom, le profil et la version par le lien (`#nom=…&profil=…&mode=…`) ;
- d'afficher une vraie icône sur l'écran d'accueil.

> Le repo est **public** : le code, le logo, les photos et les courriels des conseillers sont visibles. Aucune donnée de client n'est jamais dans le repo.
