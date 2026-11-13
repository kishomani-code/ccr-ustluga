#!/usr/bin/env python3
"""v4.63: date-wise reported progress for the "Progress – last 7 days" menu (wk.js) -> week.json
 - IWP status file: the daily date columns (one column per day) -> reported quantity per access ID and day
 - Cable tray physical progress file (sheet Data-CableTray): Work Completion Date -> metres per title, day and material type
Cable pulling / termination dates and punch closing dates are already in the project data files, so they are not repeated here.
Usage: python3 tools/build_week.py --input input [--out week.json]"""
import argparse, datetime, glob, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_areas as BA
ap = argparse.ArgumentParser(); ap.add_argument('--input', required=True); ap.add_argument('--out', default='week.json'); ap.add_argument('--days', type=int, default=35)
a = ap.parse_args()
S = BA.S
D0 = datetime.date(1899, 12, 30)
def xd(v):
    try:
        f = float(v)
        return D0 + datetime.timedelta(days=int(f)) if 40000 < f < 60000 else None
    except Exception:
        return None
fmt = lambda d: d.strftime('%d.%m.%Y')
prev = {}
if os.path.exists(a.out):
    try: prev = json.load(open(a.out, encoding='utf-8'))
    except Exception: prev = {}
out = {'date': datetime.date.today().strftime('%d.%m.%Y'), 'iwp': prev.get('iwp', {}), 'iwpsrc': prev.get('iwpsrc', ''), 'iwpto': prev.get('iwpto', ''),
       'tray': prev.get('tray', {}), 'traysrc': prev.get('traysrc', '')}
# ---- IWP daily columns
f = BA.find_files(a.input).get('iwp')
if f:
    rows = BA.read_sheet(f, BA.SHEETS['iwp'])
    hdr = next((i for i, r in enumerate(rows[:6]) if sum(1 for x in r if xd(x)) >= 5), None)
    if hdr is None:
        print('week: no daily date columns in the IWP file - IWP part unchanged')
    else:
        H = rows[hdr]; dc = {j: xd(H[j]) for j in range(len(H)) if xd(H[j])}
        acc_c = next((j for i in range(hdr + 1) for j, x in enumerate(rows[i]) if S(x).upper().replace('\n', ' ').startswith('ACCESS')), 34)
        iwp, last = {}, None
        for r in rows[hdr + 1:]:
            ac = S(r[acc_c]) if len(r) > acc_c else ''
            if not ac:
                continue
            ac = ac[:-2] if ac.endswith('.0') else ac
            for j, d in dc.items():
                v = r[j] if j < len(r) else None
                if isinstance(v, (int, float)) and v:
                    iwp.setdefault(ac, []).append([fmt(d), round(float(v), 3)])
                    last = d if last is None or d > last else last
        out['iwp'] = iwp; out['iwpsrc'] = os.path.basename(f); out['iwpto'] = fmt(last) if last else ''
        out['iwpfrom'] = fmt(min(dc.values()))
        print(f'week: IWP daily columns {fmt(min(dc.values()))} … {fmt(max(dc.values()))}, {len(iwp)} lines with reported quantity, last entry {out["iwpto"]}')
else:
    print('week: no IWP status file in input - IWP part unchanged')
# ---- cable tray physical progress
tf = sorted(glob.glob(os.path.join(a.input, '*Tray*Physical*.xls*')) + glob.glob(os.path.join(a.input, '*Cable_Tray*Progress*.xls*')))
if tf:
    rows = BA.read_sheet(tf[-1], 'Data-CableTray')
    H = [S(x).replace('\n', ' ').upper() for x in rows[0]]
    def col(name, d):
        return next((i for i, h in enumerate(H) if h.startswith(name)), d)
    cT, cQ, cD, cW, cM = col('TITULNO', 0), col('QTY', 16), col('WORK COMPLETION DATE', 20), 21, col('MATERIAL TYPE', 27)
    cut = datetime.date.today() - datetime.timedelta(days=a.days)
    tray = {}
    for r in rows[1:]:
        if len(r) <= cM:
            continue
        t, m = S(r[cT]), S(r[cM]) or 'Other'
        if not t:
            continue
        try: q = float(r[cQ] or 0)
        except Exception: q = 0.0
        e = tray.setdefault(t, {'tot': {}, 'done': {}, 'days': {}})
        x = e['tot'].setdefault(m, [0, 0.0]); x[0] += 1; x[1] += q
        d = xd(r[cD])
        if S(r[cW]).lower() == 'completed' or d:
            x = e['done'].setdefault(m, [0, 0.0]); x[0] += 1; x[1] += q
        if d and d >= cut:
            dd = e['days'].setdefault(fmt(d), {}); dd[m] = round(dd.get(m, 0.0) + q, 2)
    for e in tray.values():
        for k in ('tot', 'done'):
            for m in e[k]: e[k][m][1] = round(e[k][m][1], 1)
    out['tray'] = tray; out['traysrc'] = os.path.basename(tf[-1])
    print(f'week: cable tray file {out["traysrc"]}: {len(tray)} titles, {sum(len(e["days"]) for e in tray.values())} title-days in the last {a.days} days')
else:
    print('week: no cable tray physical progress file in input - tray part unchanged')
json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('week ->', a.out, os.path.getsize(a.out), 'bytes')
