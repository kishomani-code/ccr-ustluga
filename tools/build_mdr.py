"""v4.32: latest drawing revisions from the client MDR (02.MDR (GSP) with links.xlsx, sheet MDR) -> mdr.json
Only our titles (CCR / 1801 / D48 / D88 / 8880 / cold cable titles). Key = "<title>|<code>" (same as dw.json).
Usage: python3 tools/build_mdr.py --file "input/02.MDR (GSP) with links.xlsx" """
import argparse, json, re, datetime as dt, glob, os
ap = argparse.ArgumentParser(); ap.add_argument('--input', default='input'); ap.add_argument('--file'); ap.add_argument('--out', default='mdr.json'); a = ap.parse_args()
f = a.file or next(iter(sorted([p for p in glob.glob(os.path.join(a.input, '**', '*'), recursive=True) if re.search(r'MDR', os.path.basename(p), re.I) and p.lower().endswith(('.xlsx', '.xlsb'))])), None)
if not f: print('no MDR file - mdr.json unchanged'); raise SystemExit(0)
import openpyxl
ws = openpyxl.load_workbook(f, read_only=True, data_only=True)['MDR']
MY = ('G0-D1810BX0', 'G0-D1801FX0', 'G0-D4810BX0', 'G0-D4801FX0', 'G0-D8810BX0', 'G0-D8801FX0', 'G0-D8880FX0', 'G0-A10200X0', 'G0-D10250X0', 'G1-A30210X0')
S = lambda v: '' if v is None else str(v).strip()
D = lambda v: v.strftime('%d.%m.%Y') if isinstance(v, (dt.datetime, dt.date)) else S(v)[:10]
out = {}
for r in ws.iter_rows(min_row=9, values_only=True):
    if not r or len(r) < 54: continue
    no = S(r[18]); m = re.match(r'^[A-Z]+-\((G\d-[A-Z0-9]+)\)-(.+)$', no)
    if not m or m.group(1) not in MY: continue
    rev = S(r[30])
    if not rev: continue
    k = m.group(1) + '|' + m.group(2).upper()
    rec = [rev, S(r[29]), D(r[31]), S(r[32]), S(r[33]), re.sub(r'_x000D_|\s+', ' ', S(r[51]))[:200], S(r[52]), D(r[53]), S(r[19])[:120], no]
    o = out.get(k)
    if not o or int(re.sub(r'\D', '', rev) or 0) > int(re.sub(r'\D', '', o[0]) or 0): out[k] = rec
json.dump({'date': os.environ.get('MDRDATE') or dt.datetime.now().strftime('%d.%m.%Y'), 'src': os.path.basename(f),
           'k': ['rev', 'status', 'date', 'TRM', 'owner code', 'change (TQS/DCR)', 'next rev', 'next rev forecast', 'title EN', 'doc no'], 'm': out},
          open(a.out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'MDR {os.path.basename(f)}: {len(out)} of our documents -> {a.out}')
