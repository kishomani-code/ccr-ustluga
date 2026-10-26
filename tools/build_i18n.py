"""Inject tools/i18n_ru.tsv (English key <TAB> Russian) into translations.js.
Keys: English UI text, numbers written as '#'. 'English / Русский' keys become one-language labels (BI)."""
import json, re, os
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, '..')
ru, bi = {}, {}
for ln in open(os.path.join(H, 'i18n_ru.tsv'), encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln.strip() or ln.startswith('//'): continue
    k, v = ln.split('\t', 1)
    m = re.fullmatch(r'(.+?) / ([^A-Za-z]*[А-я][^A-Za-z]*)', k)
    if m: bi[k] = [m.group(1), v]
    else: ru[k] = v
p = os.path.join(R, 'translations.js'); s = open(p, encoding='utf-8').read()
s = re.sub(r'var RU = \{.*?\};\n', lambda _: 'var RU = ' + json.dumps(ru, ensure_ascii=False, indent=0) + ';\n', s, count=1, flags=re.S)
s = re.sub(r'var BI = \{.*?\};\n', lambda _: 'var BI = ' + json.dumps(bi, ensure_ascii=False, indent=0) + ';\n', s, count=1, flags=re.S)
open(p, 'w', encoding='utf-8').write(s)
print('RU', len(ru), 'BI', len(bi))
