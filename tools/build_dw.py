"""v4.19: drawing PDF links (Google Drive) for the site app -> dw.json
Input: tools/drive_files.json (list of {name,id,folder}) – refresh it when new PDFs are added to the Drive "drawings" folder."""
import json, re, collections
fs = json.load(open('tools/drive_files.json'))
idx = collections.defaultdict(list)
for f in fs:
    m = re.match(r'GLE-?\(?(G\d-[A-Z0-9]+)\)?-([A-Z]{2}-[A-Z0-9]{2,5}(?:-[A-Z]{2,5})?-\d{3}(?:\.\d+)?)_(\w+?)(?:_|\.pdf)(.*)', f['name'], re.I)
    if not m: continue
    key = m.group(1).upper() + '|' + m.group(2).upper()
    idx[key].append([m.group(3), f['id'], f['name'], f.get('modified', '')])
# v4.23: PDFs kept in the repo (dwg/<area>/) for areas without a Drive folder (D8810)
import glob, os
for p in sorted(glob.glob('dwg/**/*.pdf', recursive=True)):
    f = {'name': os.path.basename(p), 'id': 'local:' + p.replace(os.sep, '/')}
    m = re.match(r'GLE-?\(?(G\d-[A-Z0-9]+)\)?-([A-Z]{2}-[A-Z0-9]{2,5}(?:-[A-Z]{2,5})?-\d{3}(?:\.\d+)?)_(\w+?)(?:_|\.pdf)(.*)', f['name'], re.I)
    if m: idx[m.group(1).upper() + '|' + m.group(2).upper()].append([m.group(3), f['id'], f['name']])
out = {}
for k, L in idx.items():
    seen = {}; [seen.setdefault(x[2], x) for x in L]
    L2 = sorted(seen.values(), key=lambda x: (re.sub(r'\D', '', x[0]).zfill(3), (re.search(r'AS(\d+)', x[2]) or [0, '00'])[1].zfill(3), x[3] if len(x) > 3 else '', x[2]), reverse=True)
    out[k] = [y[:3] for y in L2]
json.dump({'folder': '1GfmOmZEEHLM53FKvYrbQehp0-NIm5pj8', 'files': out}, open('dw.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(fs), 'Drive files + repo dwg/ ->', len(out), 'documents')
