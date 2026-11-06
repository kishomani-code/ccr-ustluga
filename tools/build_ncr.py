"""v4.28: NCR register (532RHI-QA-RGS-006) -> ncr.json for the site app.
Keeps NCRs of our titles only (CCR G0-D1810/1801, D48 G0-D4810/4801, D88 G0-D8810/8801/8880).
Usage: python3 tools/build_ncr.py --input input --out ncr.json   (file name must contain 'NCR_Register')"""
import argparse, glob, json, os, re, datetime as dt
ap = argparse.ArgumentParser(); ap.add_argument('--input', default='input'); ap.add_argument('--out', default='ncr.json'); ap.add_argument('--file')
a = ap.parse_args()
f = a.file or next(iter(sorted([p for p in glob.glob(os.path.join(a.input, '**', '*'), recursive=True) if re.search(r'NCR.?Register', os.path.basename(p), re.I) and re.search(r'\.xls[xbm]?$', p, re.I)])), None)
if not f: print('no NCR register in input - ncr.json unchanged'); raise SystemExit(0)
def rows_xlsb(p):
    from pyxlsb import open_workbook
    with open_workbook(p) as wb:
        with wb.get_sheet('NCR_Register_List') as s:
            for r in s.rows(): yield [c.v for c in r]
def rows_xlsx(p):
    import openpyxl
    ws = openpyxl.load_workbook(p, read_only=True, data_only=True)['NCR_Register_List']
    for r in ws.iter_rows(values_only=True): yield list(r)
rows = list(rows_xlsb(f) if f.lower().endswith('.xlsb') else rows_xlsx(f))
hi = next(i for i, r in enumerate(rows[:20]) if r and str(r[0]).strip() == 'No')
H = [str(x or '').replace('\n', ' ').strip() for x in rows[hi]]
col = lambda name: next((i for i, h in enumerate(H) if h.lower().startswith(name.lower())), None)
C = {k: col(v) for k, v in dict(no='No', ty='Report Type', ncr='RPortal NCR No', ext='External NCR No', par='External NCR Paragraph', iss='Issuer', di='Date Of Issue', loc='Project Location', locd='Location Details',
     sub='Sub-system No', disc='Discipline', dep='Department', grp='Groups', act='Activity', resp='Responsible Personnel', sup='Suppliers', subc='Subcontractor/Assembly', ntype='Nonconformity Type', mm='Minor/Maj',
     en='Explanation-EN', ru='Explanation-RU', tag='Tag identification', ref='Reference Documents', dsg='Date Given by SG', prev='Previous date', plan='Construction Planned Date', delay='Planned Closing Date Delay',
     prop='Proposed Action', cd='Close Date', st='Status', com='Comment').items()}
def d(v):
    if v in (None, ''): return ''
    if isinstance(v, dt.datetime): return v.strftime('%d.%m.%Y')
    if isinstance(v, (int, float)) and 20000 < v < 80000: return (dt.datetime(1899, 12, 30) + dt.timedelta(days=float(v))).strftime('%d.%m.%Y')
    return str(v).strip()
def s(v): return '' if v is None else re.sub(r'\s+\n', '\n', str(v)).strip()
AREA = [('CCR', re.compile(r'G0-?D18(10|01)|G0-D18\b', re.I)), ('D48', re.compile(r'G0-?D48(10|01)|G0-D48\b', re.I)), ('8810', re.compile(r'G0-?D88(10|01|80)|G0-D88\b', re.I))]
out = []
for r in rows[hi + 1:]:
    if not r or r[0] in (None, ''): continue
    g = lambda k: r[C[k]] if C.get(k) is not None and C[k] < len(r) else None
    txt = ' '.join(s(g(k)) for k in ('loc', 'locd', 'sub', 'en', 'ru', 'tag', 'ref'))
    ar = [n for n, rx in AREA if rx.search(txt)]
    if not ar: continue
    st = s(g('st')); cd = d(g('cd'))
    if not st or st.startswith('='): st = 'Closed' if cd else 'Open'
    di = d(g('di'))
    tgt = d(g('plan')) or d(g('dsg'))
    out.append({'no': s(g('no')), 'ncr': s(g('ncr')), 'ty': s(g('ty')), 'ext': s(g('ext')), 'par': s(g('par')), 'iss': s(g('iss')), 'di': di, 'loc': s(g('loc')), 'locd': s(g('locd')), 'sub': s(g('sub')),
                'disc': s(g('disc')), 'grp': s(g('grp')), 'act': s(g('act')), 'resp': s(g('resp')), 'sup': s(g('sup')), 'subc': s(g('subc')), 'nt': s(g('ntype')), 'mm': s(g('mm')),
                'en': s(g('en')), 'ru': s(g('ru')), 'tag': s(g('tag')), 'ref': s(g('ref')), 'tgt': tgt, 'prev': d(g('prev')), 'delay': s(g('delay')), 'prop': s(g('prop')), 'cd': cd, 'st': st, 'com': s(g('com')), 'ar': ar,
                'ei': bool(re.search(r'E&I|Electric|Instrument|КИП|Электр', s(g('disc')) + ' ' + s(g('grp')), re.I))})
def key(x):
    try: return dt.datetime.strptime(x['di'], '%d.%m.%Y')
    except Exception: return dt.datetime(1900, 1, 1)
out.sort(key=key, reverse=True)
json.dump({'date': dt.datetime.now().strftime('%d.%m.%Y'), 'src': os.path.basename(f), 'n': out}, open(a.out, 'w'), ensure_ascii=False, separators=(',', ':'))
op = [x for x in out if x['st'].lower().startswith('open')]
print(f'NCR register {os.path.basename(f)}: {len(out)} NCR in our titles · {len(op)} open · {sum(x["ei"] for x in op)} open E&I -> {a.out}')
