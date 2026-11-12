#!/usr/bin/env python3
"""v4.60: user's own follow-up scope from the Md cable tracker -> scope.json
The tracker column 'SORUMLU' (responsible) holds 'ALP YILMAZ' for the cables of the user's scope and
'Takip Kapsamı Dışında' (outside the follow-up scope) for the rest. Reports in the app (rep.js) count only these cables.
Usage: python3 tools/build_scope.py --input input [--out scope.json] [--who "ALP YILMAZ"]"""
import argparse, datetime, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_areas as BA
ap = argparse.ArgumentParser(); ap.add_argument('--input', required=True); ap.add_argument('--out', default='scope.json'); ap.add_argument('--who', default='ALP YILMAZ')
a = ap.parse_args()
f = BA.find_files(a.input).get('cables')
if not f:
    print('scope: no cable tracker in input - scope.json unchanged'); raise SystemExit(0)
rows = BA.read_sheet(f, BA.SHEETS['cables'])
S = BA.S
hdr = next((i for i, r in enumerate(rows[:12]) if any(S(x).upper() == 'SORUMLU' for x in r)), None)
if hdr is None:
    print('scope: column SORUMLU not found in the tracker - scope.json unchanged'); raise SystemExit(0)
col = next(j for j, x in enumerate(rows[hdr]) if S(x).upper() == 'SORUMLU')
who = a.who.upper()
tags, tit = {}, {}
for r in rows[hdr + 1:]:
    if len(r) <= col or S(r[col]).upper() != who or S(r[35]):
        continue
    t = S(r[21])
    if t:
        tags[t] = 1; tit[S(r[14])] = tit.get(S(r[14]), 0) + 1
json.dump({'date': datetime.date.today().strftime('%d.%m.%Y'), 'src': os.path.basename(f), 'who': a.who, 'col': 'SORUMLU', 'n': len(tags), 'tit': tit, 'tags': tags},
          open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'scope: {len(tags)} cables with {a.who} -> {a.out}', dict(sorted(tit.items(), key=lambda x: -x[1])[:8]))
