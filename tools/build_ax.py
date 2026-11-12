#!/usr/bin/env python3
"""v4.51: OTHER AREA projects. Builds ax/<TITLE>.json (same schema as data_8810.json) for every area linked to the
user's three areas (areas/index.json: rel >= MIN, own titles excluded), so the app can open the area as a full project
(cable tracker + IWP wise, site entry, report). Usage: build_ax.py --input input [--min 5]"""
import argparse, json, os, subprocess, sys
OWN = ('G0-D1810BX0', 'G0-D1801FX0', 'G0-D4810BX0', 'G0-D4801FX0', 'G0-D8810BX0', 'G0-D8801FX0')
ap = argparse.ArgumentParser()
ap.add_argument('--input', required=True)
ap.add_argument('--min', type=int, default=5)
ap.add_argument('--only', default='')
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
    r = subprocess.run([sys.executable, os.path.join(here, 'build_data.py'), '--title', t, '--input', a.input,
                        '--base', os.path.join(here, '8810_skeleton.json'), '--current', out if os.path.exists(out) else os.path.join(here, '8810_skeleton.json'),
                        '--out', out])
    if r.returncode == 0 and os.path.exists(out):
        d = json.load(open(out, encoding='utf-8'))
        done.append({'a': t, 'cab': len(d['cables']), 'items': len(d['items']), 'punch': len(d['punch']['rows']), 'date': d['meta']['date']})
    else:
        print('FAILED', t, flush=True)
json.dump({'areas': done}, open(os.path.join(root, 'ax', 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
if not os.path.exists(os.path.join(root, 'ax', 'eng.json')):
    json.dump({}, open(os.path.join(root, 'ax', 'eng.json'), 'w'))
print('OTHER AREA projects built:', len(done), [x['a'] for x in done])
