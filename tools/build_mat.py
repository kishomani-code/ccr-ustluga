"""v4.28: warehouse stock + MRF per ident (EP-3 E&I Materials FollowUp, sheet 'EP Materials') -> mat.json
Used by: punch "Waiting for materials" (rules in px.js), CCR-SPBA menu (SF list tools/spba_sf.json).
Usage: python3 tools/build_mat.py --input input --out mat.json   (file name must contain 'Materials_FollowUp')"""
import argparse, glob, json, os, re, collections, datetime as dt
ap = argparse.ArgumentParser(); ap.add_argument('--input', default='input'); ap.add_argument('--out', default='mat.json'); ap.add_argument('--file')
a = ap.parse_args()
f = a.file or next(iter(sorted([p for p in glob.glob(os.path.join(a.input, '**', '*'), recursive=True) if re.search(r'Materials.?Follow.?Up', os.path.basename(p), re.I)])), None)
if not f: print('no Materials FollowUp in input - mat.json unchanged'); raise SystemExit(0)
EXTRA = ['EIZOH00001', 'QHOUM00001', 'QAUMO00002', 'QAUMO00003', 'QLOOP00001', 'EBOXJ00004', 'EBOXJ00002', 'QFIRD00008', 'QSEFA00001', 'QSEFA00002', 'QSEFA00003', 'QSEFA00004', 'QSEFA00005', 'QREMO00001', 'QREMO00002',
         'SSAFS00002', 'SSAFS00003', 'SSAFS00010', 'ECTAG00001', 'ECTAG00002', 'EDDRC00002', 'ERSSC00004', 'ERSSC00007', 'ERSSC00008', 'EELSS00001']
SF = json.load(open(os.path.join(os.path.dirname(__file__), 'spba_sf.json')))
WANT = set(EXTRA) | {x['id'] for x in SF}
def rows():
    if f.lower().endswith('.xlsb'):
        from pyxlsb import open_workbook
        with open_workbook(f) as wb:
            with wb.get_sheet('EP Materials') as s:
                for r in s.rows(): yield [c.v for c in r]
    else:
        import openpyxl
        ws = openpyxl.load_workbook(f, read_only=True, data_only=True)['EP Materials']
        for r in ws.iter_rows(values_only=True): yield list(r)
num = lambda v: float(v) if isinstance(v, (int, float)) else (float(v) if re.fullmatch(r'\d+(\.\d+)?', str(v or '').strip()) else 0.0)
A = collections.defaultdict(lambda: {'rcv': 0, 'bal': 0, 'res': 0, 'cons': 0, 'mrf': set(), 'wh': set(), 'en': '', 'ru': '', 'u': '', 'pl': set()})
hi = None
for i, r in enumerate(rows()):
    if hi is None:
        if r and any(str(x).strip() == 'Ident' for x in r if x is not None): hi = i
        continue
    if len(r) < 38: continue
    idn = str(r[5] or '').strip()
    if idn not in WANT: continue
    o = A[idn]
    o['rcv'] += num(r[16]); o['bal'] += num(r[20]); o['res'] += num(r[21]); o['cons'] += num(r[22])
    if num(r[21]) > 0 and r[37]: o['mrf'].add(str(r[37]).strip())
    if num(r[20]) > 0 and r[19]: o['wh'].add(str(r[19]).strip())
    if r[1]: o['pl'].add(str(r[1]).strip())
    o['en'] = o['en'] or str(r[10] or '')[:160]; o['ru'] = o['ru'] or str(r[11] or '')[:160]; o['u'] = o['u'] or str(r[15] or '')
out = {k: {**{x: v[x] for x in ('rcv', 'bal', 'res', 'cons', 'en', 'ru', 'u')}, 'mrf': sorted(v['mrf'])[:6], 'wh': sorted(v['wh'])[:4], 'pl': sorted(v['pl'])[:6]} for k, v in A.items()}
json.dump({'date': os.environ.get('MATDATE') or dt.datetime.now().strftime('%d.%m.%Y'), 'src': os.path.basename(f), 'm': out, 'sf': SF}, open(a.out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'materials follow-up {os.path.basename(f)}: {len(out)} idents with stock / MRF -> {a.out}')
