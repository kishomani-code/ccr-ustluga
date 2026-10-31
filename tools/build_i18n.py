"""Inject the UI dictionaries into translations.js.
  tools/i18n_ru.tsv   English key <TAB> Russian            -> var RU / var BI ('English / Русский' keys become one-language labels)
  tools/i18n_tr.tsv   English key <TAB> Turkish            -> var TRK
  tools/i18n_hi.tsv   English key <TAB> Hindi              -> var HI
  tools/i18n_new.tsv  English <TAB> Russian <TAB> Turkish <TAB> Hindi (newer screens; added where a key is missing)
  tools/ru_en_glossary.tsv  Russian <TAB> English (data texts: panel / cable / punch names shown in EN, TR, HI) -> var GLOSS
Numbers inside keys are written as '#'."""
import json, re, os
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, '..')


def tsv(name, cols=2):
    p = os.path.join(H, name)
    if not os.path.exists(p):
        return []
    out = []
    for ln in open(p, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln.strip() or ln.startswith('//'):
            continue
        parts = ln.split('\t')
        if len(parts) >= cols:
            out.append(parts[:cols])
    return out


ru, bi = {}, {}
for k, v in tsv('i18n_ru.tsv'):
    m = re.fullmatch(r'(.+?) / ([^A-Za-z]*[А-я][^A-Za-z]*)', k)
    if m: bi[k] = [m.group(1), v]
    else: ru[k] = v
trk = {k: v for k, v in tsv('i18n_tr.tsv')}
hi = {k: v for k, v in tsv('i18n_hi.tsv')}
for en, r_, t_, h_ in tsv('i18n_new.tsv', 4):
    ru.setdefault(en, r_); trk.setdefault(en, t_); hi.setdefault(en, h_)
gl = {k: v for k, v in tsv('ru_en_glossary.tsv') if k.strip() and v.strip()}
p = os.path.join(R, 'translations.js'); s = open(p, encoding='utf-8').read()


def put(var, obj, s):
    js = 'var ' + var + ' = ' + json.dumps(obj, ensure_ascii=False, indent=0) + ';\n'
    if re.search(r'^var ' + var + r' = \{', s, re.M):
        return re.sub(r'^var ' + var + r' = \{.*?\};\n', lambda _: js, s, count=1, flags=re.S | re.M)
    i = s.index('var BI = {')
    return s[:i] + js + s[i:]


s = put('RU', ru, s); s = put('BI', bi, s); s = put('TRK', trk, s); s = put('HI', hi, s); s = put('GLOSS', gl, s)
open(p, 'w', encoding='utf-8').write(s)
print('RU', len(ru), 'BI', len(bi), 'TR', len(trk), 'HI', len(hi), 'GLOSS', len(gl))
