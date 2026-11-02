#!/usr/bin/env python3
"""Build tracker/data.json for the stand-alone Cable Tracker app from the Md cable tracker (.xlsb / .xlsx).
Usage: python3 tools/build_tracker.py --input input [--out tracker/data.json]
Column-store with dictionary encoding for repeated texts (keeps the file small)."""
import argparse, json, os, re, sys, datetime, gzip
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_data as B

F = [('doc', 0), ('rev', 5), ('disc', 10), ('tit', 14), ('sub', 15), ('subn', 16), ('tq', 18), ('t', 21), ('f', 22), ('o', 23), ('ty', 26), ('sz', 27),
     ('id', 30), ('ln', 32), ('oth', 35), ('hold', 36), ('cm', 37), ('resp', 38), ('ctr', 39), ('mrf', 40), ('mrfd', 41), ('aft', 42), ('act', 47),
     ('du', 48), ('pd', 49), ('ps', 50), ('tf', 52), ('tt', 53), ('ts', 55), ('rfi', 57), ('rfid', 58), ('co', 75), ('mrfs', 76)]
DATES = {'mrfd', 'pd', 'tf', 'tt', 'rfid'}
NUMS = {'ln', 'aft', 'act'}
DICT = {'doc', 'rev', 'disc', 'tit', 'sub', 'subn', 'ty', 'sz', 'id', 'oth', 'hold', 'cm', 'resp', 'ctr', 'ps', 'ts', 'co', 'tq', 'mrf', 'mrfs', 'f', 'o', 'du', 'da', 'dists'}


def S(v):
    return B.S(v)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--input', required=True); ap.add_argument('--out', default='tracker/data.json')
    a = ap.parse_args()
    f = B.find_files(a.input).get('cables')
    if not f:
        print('no cable tracker in', a.input); return
    rows = B.read_sheet(f, B.SHEETS['cables'])
    H = [S(x) for x in rows[4]]
    dcols = [i for i, h in enumerate(H) if h.endswith('распределение') and re.match(r'\d', h)]
    da = dcols[-1] if dcols else 64
    cols = {k: [] for k, _ in F}; cols['da'] = []; cols['dists'] = []
    drums = {}
    for r in rows[5:]:
        t = S(B.col(r, 21))
        if not t:
            continue
        for k, i in F:
            v = B.col(r, i)
            if k in DATES:
                v = B.xdate(v, '%d.%m.%y')
            elif k in NUMS:
                v = B.num(v) if S(v) else ''
            else:
                v = S(v)
            cols[k].append(v)
        d = S(B.col(r, da)); cols['da'].append(d)
        hist = []
        for i in dcols[:-1]:
            v = S(B.col(r, i))
            if v and v != d and v not in hist:
                hist.append(H[i][:8] + ' ' + v)
        cols['dists'].append(' | '.join(hist))
        for dn in {d, S(B.col(r, 48))}:
            if dn and re.search(r'\d', dn) and dn not in drums:
                drums[dn] = [B.num(B.col(r, 103)) if d == dn else '', S(B.col(r, 122)) if d == dn else '', S(B.col(r, 127)) if d == dn else '',
                             B.num(B.col(r, 131)) if d == dn else '', S(B.col(r, 120)) if d == dn else '']
            elif dn in drums and d == dn and not drums[dn][0]:
                drums[dn] = [B.num(B.col(r, 103)), S(B.col(r, 122)), S(B.col(r, 127)), B.num(B.col(r, 131)), S(B.col(r, 120))]
    dic = {}
    out = {'date': datetime.date.today().strftime('%d.%m.%Y'), 'src': os.path.basename(f), 'n': len(cols['t']), 'dist': H[da], 'cols': {}, 'dict': {}, 'drums': drums}
    for k, v in cols.items():
        if k in DICT:
            tab, idx, enc = [], {}, []
            for x in v:
                if x not in idx:
                    idx[x] = len(tab); tab.append(x)
                enc.append(idx[x])
            out['dict'][k] = tab; out['cols'][k] = enc
        else:
            out['cols'][k] = v
    out = B.scrub_all(out) if hasattr(B, 'scrub_all') else out
    os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
    json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f"tracker app: {out['n']} cables, {len(drums)} drums -> {a.out} ({os.path.getsize(a.out):,} bytes, gzip {len(gzip.compress(open(a.out,'rb').read())):,})")


if __name__ == '__main__':
    main()
