#!/usr/bin/env python3
"""v4.51: OTHER AREA projects. Builds ax/<TITLE>.json (same schema as data_8810.json) for every area linked to the
user's three areas (areas/index.json: rel >= MIN, own titles excluded), so the app can open the area as a full project
(cable tracker + IWP wise, site entry, report). Usage: build_ax.py --input input [--min 5]"""
import argparse, json, os, re, subprocess, sys
OWN = ('G0-D1810BX0', 'G0-D1801FX0', 'G0-D4810BX0', 'G0-D4801FX0', 'G0-D8810BX0', 'G0-D8801FX0')
ap = argparse.ArgumentParser()
ap.add_argument('--input', required=True)
ap.add_argument('--min', type=int, default=5)
ap.add_argument('--only', default='')
ap.add_argument('--post-only', action='store_true', help='only refresh xic / drums / mat of the existing ax files')
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
idx = json.load(open(os.path.join(root, 'areas', 'index.json'), encoding='utf-8'))
areas = [x['a'] for x in idx['areas'] if x.get('rel', 0) >= a.min and x['a'] not in OWN]
if a.only:
    areas = [x for x in areas if x in a.only.split(',')]
os.makedirs(os.path.join(root, 'ax'), exist_ok=True)
done = []
for t in areas:
    out = os.path.join(root, 'ax', t + '.json')
    print('=====', t, flush=True)
    if a.post_only:
        if os.path.exists(out):
            d = json.load(open(out, encoding='utf-8'))
            done.append({'a': t, 'cab': len(d['cables']), 'items': len(d['items']), 'punch': len(d['punch']['rows']), 'date': d['meta']['date']})
        continue
    r = subprocess.run([sys.executable, os.path.join(here, 'build_data.py'), '--title', t, '--input', a.input,
                        '--base', os.path.join(here, '8810_skeleton.json'), '--current', out if os.path.exists(out) else os.path.join(here, '8810_skeleton.json'),
                        '--out', out])
    if r.returncode == 0 and os.path.exists(out):
        d = json.load(open(out, encoding='utf-8'))
        done.append({'a': t, 'cab': len(d['cables']), 'items': len(d['items']), 'punch': len(d['punch']['rows']), 'date': d['meta']['date']})
    else:
        print('FAILED', t, flush=True)
# v4.53: interconnection list of an OTHER AREA project. The tags there carry no building code, so the app cannot tell
# which end is outside - take it from the tracker (True From / True To title) and store it in the project file as xic.
try:
    sys.path.insert(0, here)
    import build_areas as BA
    f = BA.find_files(a.input).get('cables')
    rows = BA.read_sheet(f, BA.SHEETS['cables']) if f else []
    S = BA.S
    ends = {}
    for r in rows:
        if len(r) < 36 or S(r[35]):
            continue
        t, tf, tt = S(r[21]), S(r[24]), S(r[25])
        if t and tf and tt and tf != tt:
            ends.setdefault(t, (tf, tt))
    for x in done:
        p = os.path.join(root, 'ax', x['a'] + '.json')
        d = json.load(open(p, encoding='utf-8'))
        xic = {}
        for c in d['cables']:
            e = ends.get(c[0])
            if e and e[0] == x['a']:
                xic[c[0]] = ['OUT', e[1]]
            elif e and e[1] == x['a']:
                xic[c[0]] = ['IN', e[0]]
        d['xic'] = xic
        # drums and material rows straight from the cables of the area (drum length is not in the cable tracker)
        K = {k: i for i, k in enumerate(d['CK'])}
        fl = lambda v: float(str(v).replace(',', '.')) if re.fullmatch(r'\d+([.,]\d+)?', str(v or '').strip()) else 0.0
        sysof = lambda c: (re.search(r'\b([A-Z]{2}-[A-Z0-9]{3,6})-', c[K['d']].split(' ', 1)[-1]) or [None, ''])[1]
        DRM, MAT = {}, {}
        for c in d['cables']:
            ty = (c[K['ty']] + ' ' + c[K['c']]).strip(); sy = sysof(c); ln = fl(c[K['ln']]); done = c[K['tp']] == 'Completed'
            pm = fl(c[K['lf']]) or (ln if done else 0)
            m = MAT.setdefault((sy, ty), [sy, ty, 'from cable tracker', 0, 0, 0.0, 0.0])
            m[3] += 1; m[4] += 1 if done else 0; m[5] += ln; m[6] += pm if done else 0
            for no in [z.strip() for z in re.split(r'[;,\n]+', c[K['dr']]) if z.strip()]:
                e = DRM.setdefault(no, [no, '', ty, 0, 'm', '', '', '', 0.0, 0, [], [], []])
                e[8] += pm; e[12].append([c[0], pm or ln, x['a'], '' if done else 'not pulled'])
                if sy and sy not in e[10]:
                    e[10].append(sy)
        d['drums'] = [DRM[k] for k in sorted(DRM)]
        d['mat'] = sorted(MAT.values(), key=lambda m: (m[0], -m[5]))
        x['drums'] = len(d['drums'])
        x['ic'] = len(xic)
        json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('interconnection', x['a'], len(xic), flush=True)
except Exception as e:
    print('interconnection list not built:', e, flush=True)
json.dump({'areas': done}, open(os.path.join(root, 'ax', 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
if not os.path.exists(os.path.join(root, 'ax', 'eng.json')):
    json.dump({}, open(os.path.join(root, 'ax', 'eng.json'), 'w'))
print('OTHER AREA projects built:', len(done), [x['a'] for x in done])
