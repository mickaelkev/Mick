#!/usr/bin/env python3
"""Assemble le budget GFX : une page HTML autonome par conseiller.

Utilisation :
    python3 build.py            # tous les conseillers actifs (conseillers/*.json)
    python3 build.py thomas     # un seul conseiller
    python3 build.py --claude   # produit aussi la version pour un artefact Claude (dossier build/)

Résultat : dist/<slug>/index.html (+ budget-gfx-icon.png pour l'écran d'accueil).
"""
import base64, io, json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC, DIST, BUILD = ROOT / 'src', ROOT / 'dist', ROOT / 'build'
MIME = {'.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'}

# Balises interdites dans un <script> en ligne : elles coupent la page dans certains visualiseurs.
# Dans app.js, écrire \x3chead>, \x3cbody>, \x3c/script> etc.
DANGER = re.compile(r'<(?:/?head|/?body|/?html|!doctype|meta|title|style|/script)\b', re.I)


def data_url(rel):
    p = ROOT / rel
    if not p.exists():
        sys.exit(f'Image introuvable : {rel}')
    return f'data:{MIME.get(p.suffix.lower(), "application/octet-stream")};base64,' + base64.b64encode(p.read_bytes()).decode()


def assemble(c):
    css = (SRC / 'base.css').read_text() + '\n' + (SRC / 'styles.css').read_text()
    qr = (SRC / 'vendor' / 'qrcode-generator.min.js').read_text()
    qr = qr.replace("'<title", "'\\x3ctitle").replace('"</title>"', '"\\x3c/title>"')
    js = (SRC / 'app.js').read_text().replace(
        '%%DICT%%', json.dumps(json.loads((SRC / 'traductions-en.json').read_text()), ensure_ascii=False))
    for name, code in (('app.js', js), ('qrcode-generator.min.js', qr)):
        bad = sorted(set(m.group(0) for m in DANGER.finditer(code)))
        if bad:
            sys.exit(f'{name} contient {bad} : remplace « < » par « \\x3c » dans ces chaînes.')
    page = ((SRC / 'head.html').read_text() + '<style>' + css + '</style>\n' + (SRC / 'body.html').read_text()
            + '\n<script>' + qr + '</script>\n<script>\n' + js + '\n</script>\n')
    page = (page.replace('%%LOGO%%', data_url('assets/logo.webp'))
                .replace('%%PHOTO_NEAR%%', data_url(c['photo_proche']))
                .replace('%%PHOTO_FAR%%', data_url(c['photo_loin'])))
    # Réglages du conseiller
    page = (page.replace("const BOOK_URL='';", f"const BOOK_URL={json.dumps(c.get('lien_rendez_vous', ''))};")
                .replace("const WEBHOOK_URL='';", f"const WEBHOOK_URL={json.dumps(c.get('webhook', ''))};"))
    if c.get('lien_page'):
        page = re.sub(r"const SHARE_URL='[^']*';", lambda m: f"const SHARE_URL={json.dumps(c['lien_page'])};", page)
    if c['slug'] != 'mickael':
        page = (page.replace('Mickaël Léveillé', c['nom_complet'])
                    .replace('mickael.leveille@sfl.ca', c['courriel'])
                    .replace('Mickaël', c['prenom'])
                    .replace('>ML<', '>' + c['initiales'] + '<')
                    .replace("const KEY='budget-gfx-v3';", f"const KEY='budget-gfx-v3-{c['slug']}';"))
    return page


def icon():
    try:
        from PIL import Image
    except ImportError:
        print('  (Pillow absent : icône non générée — pip install pillow)')
        return None, None
    logo = Image.open(ROOT / 'assets' / 'logo.webp').convert('RGBA')
    s = 180
    bg = Image.new('RGBA', (s, s), (15, 29, 48, 255))
    w = int(s * 0.82); h = int(logo.height * w / logo.width)
    bg.alpha_composite(logo.resize((w, h), Image.LANCZOS), ((s - w) // 2, (s - h) // 2))
    bg = bg.convert('RGB'); b = io.BytesIO(); bg.save(b, 'PNG', optimize=True)
    return bg, 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def site(page, fav):
    head = ('<!doctype html>\n<html lang="fr-CA"><head><meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
            '<meta name="apple-mobile-web-app-title" content="Budget GFX">\n'
            '<meta name="theme-color" content="#0F1D30">\n'
            '<link rel="apple-touch-icon" href="budget-gfx-icon.png">\n'
            + (f'<link rel="icon" href="{fav}">\n' if fav else ''))
    body = page[page.index('\n') + 1:]          # retire la 1re ligne (viewport, déjà dans head)
    i = body.index('<svg width="0"')             # début du corps visible (sprite d'icônes)
    return head + body[:i] + '</head><body>\n' + body[i:] + '</body></html>\n'


def check(page, out):
    scripts = '\n'.join(re.findall(r'<script(?![^>]*application/json)[^>]*>(.*?)</script>', page, re.S))
    BUILD.mkdir(exist_ok=True)
    (BUILD / 'check.js').write_text(scripts)
    if shutil.which('node'):
        r = subprocess.run(['node', '--check', str(BUILD / 'check.js')], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f'Erreur JavaScript dans {out} :\n{r.stderr}')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    claude = '--claude' in sys.argv
    confs = sorted((ROOT / 'conseillers').glob('*.json'))
    if args:
        confs = [p for p in confs if p.stem in args]
        if not confs:
            sys.exit(f'Aucun conseiller nommé {args}')
    img, fav = icon()
    built = []
    for p in confs:
        c = json.loads(p.read_text())
        if not c.get('actif') and not args:
            print(f'- {p.stem} : inactif (mets "actif": true quand tout est rempli)')
            continue
        manque = [k for k in ('nom_complet', 'prenom', 'initiales', 'courriel') if not c.get(k)]
        manque += [k for k in ('photo_proche', 'photo_loin') if not (ROOT / c.get(k, '_')).exists()]
        if manque:
            print(f'- {p.stem} : il manque {", ".join(manque)}')
            continue
        page = assemble(c)
        out = DIST / c['slug']
        out.mkdir(parents=True, exist_ok=True)
        html = site(page, fav)
        check(page, out)
        (out / 'index.html').write_text(html)
        if img:
            img.save(out / 'budget-gfx-icon.png')
        if claude:
            (BUILD / f'{c["slug"]}-claude.html').write_text(page)
        print(f'✓ {c["slug"]} → {out.relative_to(ROOT)}/index.html ({len(html) // 1024} Ko)')
        built.append(c)
    if built and not args:
        landing(built)


def landing(built):
    """Petite page d'accueil (dist/index.html) qui mène à la version de chaque conseiller."""
    rows = ''.join(f'<a href="{c["slug"]}/"><b>{c["nom_complet"]}</b><span>Budget et app Mon suivi →</span></a>' for c in built)
    (DIST / 'index.html').write_text(f'''<!doctype html>
<html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Budget GFX</title><meta name="robots" content="noindex">
<style>
:root{{--bg:#F4F5F7;--card:#fff;--ink:#111B29;--muted:#5A6577;--line:#DDE1E7;--gold:#C9A24A}}
@media (prefers-color-scheme:dark){{:root{{--bg:#0B1220;--card:#121A2A;--ink:#EEF1F6;--muted:#9AA5B6;--line:#243045}}}}
body{{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}}
main{{max-width:560px;margin:0 auto;padding:48px 16px}}
header{{background:#0F1D30;border-radius:16px;padding:20px 24px;border-bottom:3px solid var(--gold)}}
header img{{width:150px;display:block}}
h1{{font-size:1.4rem;letter-spacing:-.02em;margin:32px 0 8px}}
p{{color:var(--muted);margin:0 0 24px}}
a{{display:grid;gap:2px;padding:16px 20px;margin-bottom:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;color:inherit;text-decoration:none}}
a:hover{{border-color:var(--gold)}}
a span{{color:var(--muted);font-size:.9rem}}
</style></head><body><main>
<header><img src="{data_url('assets/logo.webp')}" alt="GFX — Groupe Financier Excellence"></header>
<h1>Budget GFX</h1>
<p>Choisis la version de ton conseiller. Tes réponses restent sur ton appareil.</p>
{rows}
</main></body></html>
''')
    print('✓ page d’accueil → dist/index.html')


if __name__ == '__main__':
    main()
