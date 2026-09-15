import re, sys, html

src, dst, titre = sys.argv[1], sys.argv[2], sys.argv[3]
brut = open(src, encoding='utf8').read().split('\n')

def inline(t):
    t = html.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    return t

PUCE = re.compile(r'^(\s*)[-*] (.*)$')
NUM  = re.compile(r'^(\s*)\d+\. (.*)$')

# 1. Regrouper les lignes repliées : un bloc = un paragraphe ou un point de liste.
blocs = []          # (type, indent, texte)
for ligne in brut:
    nu = ligne.strip()
    mp, mn = PUCE.match(ligne), NUM.match(ligne)
    if nu == '':
        blocs.append(('vide', 0, ''))
    elif nu.startswith('#'):
        n = len(nu) - len(nu.lstrip('#'))
        blocs.append((f'h{n}', 0, nu[n:].strip()))
    elif nu == '---':
        blocs.append(('hr', 0, ''))
    elif nu.startswith('> '):
        blocs.append(('cite', 0, nu[2:]))
    elif mp:
        blocs.append(('puce', len(mp.group(1)), mp.group(2)))
    elif mn:
        blocs.append(('num', len(mn.group(1)), mn.group(2)))
    else:
        # Suite d'un bloc précédent (ligne repliée), sinon nouveau paragraphe.
        if blocs and blocs[-1][0] in ('para', 'puce', 'num', 'cite'):
            t, i, txt = blocs[-1]
            blocs[-1] = (t, i, txt + ' ' + nu)
        else:
            blocs.append(('para', 0, nu))

# 2. Rendre.
out, pile, cite = [], [], False
def fermer_listes(jusqu_a=-1):
    while pile and pile[-1][0] > jusqu_a:
        out.append('</ul>')
        pile.pop()
def fermer_cite():
    global cite
    if cite:
        out.append('</blockquote>')
        cite = False

for typ, ind, txt in blocs:
    if typ in ('puce', 'num'):
        fermer_cite()
        while pile and pile[-1][0] > ind:
            out.append('</ul>'); pile.pop()
        if not pile or pile[-1][0] < ind:
            out.append('<ul class="num">' if typ == 'num' else '<ul>')
            pile.append((ind, typ))
        out.append(f'<li>{inline(txt)}</li>')
        continue
    fermer_listes()
    if typ == 'cite':
        if not cite:
            out.append('<blockquote>'); cite = True
        out.append(inline(txt) + ' ')
        continue
    fermer_cite()
    if typ == 'vide':   continue
    if typ == 'hr':     out.append('<hr>')
    elif typ == 'h1':   out.append(f'<h1>{inline(txt)}</h1>')
    elif typ == 'h2':   out.append(f'<h2>{inline(txt)}</h2>')
    elif typ == 'h3':   out.append(f'<h3>{inline(txt)}</h3>')
    else:               out.append(f'<p>{inline(txt)}</p>')
fermer_listes(); fermer_cite()

CSS = """
:root{--ink:#23282E;--muted:#5C636B;--line:#DDDBD4;--accent:#386B66;--gold:#8F6E33;--gold-soft:#F1E9DA;--surface:#FAF9F6}
@page{size:A4;margin:18mm 17mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:10.5pt;line-height:1.6}
h1{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:20pt;font-weight:600;margin:0 0 .6rem;line-height:1.2}
h2{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:13pt;font-weight:600;margin:1.7rem 0 .5rem;break-after:avoid;color:var(--accent)}
p{margin:.45rem 0;max-width:62ch}
hr{border:0;border-top:1px solid var(--line);margin:1.5rem 0}
blockquote{margin:.6rem 0 .9rem;padding:.55rem .9rem;background:var(--surface);border-left:3px solid var(--gold);color:var(--muted);font-size:9.5pt;break-inside:avoid}
ul{margin:.4rem 0;padding:0;list-style:none}
li{position:relative;padding:.32rem 0 .32rem 1.1rem;border-top:1px solid var(--line);break-inside:avoid}
li:before{content:"";position:absolute;left:0;top:.78rem;width:.3rem;height:.3rem;border-radius:50%;background:var(--accent)}
/* Sous-liste : décalée, sans filet, puce creuse. */
li ul,ul ul{margin:.25rem 0 .1rem 0}
ul ul li{border-top:0;padding:.14rem 0 .14rem 1.1rem;font-size:10pt}
ul ul li:before{background:none;box-shadow:inset 0 0 0 1px var(--muted);top:.62rem}
ul.num{counter-reset:n}
ul.num>li{counter-increment:n;padding-left:1.7rem}
ul.num>li:before{content:counter(n);background:none;color:var(--gold);font-weight:700;font-size:9pt;top:.34rem;width:auto;height:auto;border-radius:0}
strong{font-weight:600}
em{color:var(--muted)}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:9pt;background:var(--gold-soft);padding:0 .25rem;border-radius:3px}
"""
open(dst,'w',encoding='utf8').write(
 f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{titre}</title>'
 f'<style>{CSS}</style></head><body>{chr(10).join(out)}</body></html>')
print('html écrit')
