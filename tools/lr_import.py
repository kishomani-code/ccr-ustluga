#!/usr/bin/env python3
"""Load LR connection tables (TAB text from Paul) into data.json + data_base.json section 'lr'.

Usage: python3 tools/lr_import.py tools/lr/CCR_LR_All_Connections.txt
Accepts the plain text file or the compressed CODE file (gzip+base64 after 'CODE:').
lr row = [pdf, sheet, cores, device(this end), other device, strip, terminal, signal, table]
One row per cable end that has a strip/terminal. Old phone ticks (S2.t, keyed by row index)
are moved to the new index through tools/lr/lr_migrate.json, read by app.js (LRMIG).
"""
import base64, gzip, json, re, sys, os

PFX = 'G0-D1810BX0-'
PDF = {'DCS': 'GLE-G0-D1810BX0-IN-DCS-LR-001_03_AL_AS02.pdf', 'ASKU': 'GLE-G0-D1810BX0-IN-ASKU-LR-001_03_AL.pdf',
       'MAEC': 'GLE-G0-D1810BX0-IN-MAEC-LR-001_03_AL.pdf', 'MFMS': 'GLE-G0-D1810BX0-IN-MFMS-LR-001_03_AL_AS01.pdf'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(p):
    s = open(p, encoding='utf-8-sig').read()
    if 'CODE:' in s and 'DOC|' not in s:
        s = gzip.decompress(base64.b64decode(s.split('CODE:')[-1].replace('\n', '').replace('\r', ''))).decode('utf-8')
    return s


def full(t):
    t = (t or '').strip()
    return '' if t in ('', '-') else (t if t.startswith('G0-') else PFX + t)


def parse(s):
    lr, doc, n = {}, None, 0
    for line in s.splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        if line.startswith('DOC|'):
            name = line.split('|')[1]
            doc = next((v for k, v in PDF.items() if f'-{k}-LR' in name), name)
            continue
        f = [x.strip() for x in line.split('\t')]
        if len(f) != 16:
            print('skip bad row:', line[:80]); continue
        tbl, no, sig, cab, ctype, cores, fe, ftb, ftn, te, ttb, ttn, cc, tacc, lacc, sh = f
        n += 1
        sh = int(sh) if sh.isdigit() else sh
        sig = '' if sig == '-' else sig
        F, T, C = full(fe), full(te), full(cc)
        rows = lr.setdefault(full(cab), [])
        for dev, oth, tb, tn in ((F, T, ftb, ftn), (T, F, ttb, ttn)):
            if tb == '-' and tn == '-':
                continue
            rows.append([doc, sh, '' if cores == '-' else cores, dev or C, oth or C,
                         '' if tb == '-' else tb, '' if tn == '-' else tn, sig, tbl])
        if not rows:   # neither end has a strip: keep the connection so the drawing reference shows
            rows.append([doc, sh, '' if cores == '-' else cores, F or C, T or C, '', '', sig, tbl])
    return lr, n


def norm(x):
    return re.sub(r'[^0-9A-Z]', '', str(x).upper().replace('С', 'C'))


def migrate(old, new):
    """old index -> new index per tag, matching device + strip + terminal (+ cores)."""
    out = {}
    for tag, orows in old.items():
        nrows = new.get(tag, [])
        m, used = {}, set()
        for i, o in enumerate(orows):
            for strict in (True, False):
                j = next((j for j, r in enumerate(nrows) if j not in used and norm(r[3]) == norm(o[3])
                          and norm(r[5]) == norm(o[5]) and norm(r[6]) == norm(o[6])
                          and (not strict or norm(r[2]) == norm(o[2]))), None)
                if j is not None:
                    break
            if j is not None:
                used.add(j)
            m[str(i)] = j if j is not None else -1
        if any(str(k) != str(v) for k, v in m.items()):
            out[tag] = m
    return out


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools/lr/CCR_LR_All_Connections.txt')
    lr, n = parse(read_text(src))
    cur = json.load(open(os.path.join(ROOT, 'data.json'), encoding='utf-8'))
    bak = os.path.join(ROOT, 'tools/lr/lr_old.json')      # the LR data before the first import
    if not os.path.exists(bak):
        json.dump(cur.get('lr', {}), open(bak, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    cur['lr'] = json.load(open(bak, encoding='utf-8'))
    tags = {c[cur['CK'].index('t')] for c in cur['cables']}
    old = cur.get('lr', {})
    kept = [t for t in old if t not in lr]     # cables only in the old LR data stay as they were
    for t in kept:
        lr[t] = old[t]
    mig = migrate({t: v for t, v in old.items() if t not in kept}, lr)
    os.makedirs(os.path.join(ROOT, 'tools/lr'), exist_ok=True)
    json.dump(mig, open(os.path.join(ROOT, 'tools/lr/lr_migrate.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    for fn in ('data.json', 'data_base.json'):
        p = os.path.join(ROOT, fn)
        d = json.load(open(p, encoding='utf-8'))
        d['lr'] = lr
        tmp = p + '.tmp'
        json.dump(d, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        os.replace(tmp, p)
    lost = sum(1 for m in mig.values() for v in m.values() if v == -1)
    print(f'connections {n} -> lr rows {sum(map(len, lr.values()))}, cables {len(lr)} '
          f'({len([t for t in lr if t in tags])} in app, {len([t for t in lr if t not in tags])} not in cable list)')
    print(f'kept from old LR data (not in this file): {len(kept)}', ', '.join(t.replace(PFX, '') for t in kept))
    print(f'tick migration: {len(mig)} cables re-indexed, {lost} old rows with no match')
    print('not in cable list:', ', '.join(sorted(t.replace(PFX, '') for t in lr if t not in tags)))


if __name__ == '__main__':
    main()
