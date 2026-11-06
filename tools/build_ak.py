"""v4.26 Aleksy punch follow-up.
Reads the engineer's closure-confirmation workbook ("Подтверждение закрытия/отмены", Aleksy) from input/
(any .xlsx whose first sheet contains that title) and tools/punch_reported.json (punches we reported),
writes ak.json = {date, src, a:{punchNo:[status, date dd.mm.yyyy, title, subsystem, tag]}, rep:[{no,rep,fixed,by,src}]}.
Usage: python3 tools/build_ak.py --input input --out ak.json
"""
import argparse,glob,json,os,datetime as dt,openpyxl
ap=argparse.ArgumentParser(); ap.add_argument('--input',default='input'); ap.add_argument('--out',default='ak.json'); ap.add_argument('--file')
a=ap.parse_args()
def is_ak(f):
    try:
        ws=openpyxl.load_workbook(f,read_only=True).worksheets[0]
        for r in ws.iter_rows(min_row=1,max_row=10,values_only=True):
            if any(isinstance(v,str) and 'Подтверждение закрытия' in v for v in r): return True
    except Exception: pass
    return False
files=[a.file] if a.file else [f for f in sorted(glob.glob(os.path.join(a.input,'*.xls*'))) if f.lower().endswith('.xlsx') and is_ak(f)]
old=json.load(open(a.out)) if os.path.exists(a.out) else {}
rep=json.load(open(os.path.join(os.path.dirname(__file__),'punch_reported.json')))['items']
if not files:
    print('Aleksy punch file: not found – ak.json kept, reported list refreshed')
    old['rep']=rep; json.dump(old,open(a.out,'w'),ensure_ascii=False); raise SystemExit
MY=('G0-D1810','G0-D1801','G0-D4810','G0-D4801','G0-D8810','G0-D8801','G0-D8880')
f=files[-1]; ws=openpyxl.load_workbook(f,data_only=True).worksheets[0]
A={}; last=None
for r in ws.iter_rows(min_row=10,values_only=True):
    if not r or len(r)<13 or r[1] is None: continue
    no=str(r[1]).strip().split('.')[0]
    if not no.isdigit(): continue
    d=r[12]; ds=d.strftime('%d.%m.%Y') if isinstance(d,dt.datetime) else str(d or '')
    if isinstance(d,dt.datetime) and (last is None or d>last): last=d
    if not str(r[2] or '').startswith(MY): continue
    A[no]=[str(r[11] or '').split('\n')[0].strip(),ds,str(r[2] or ''),str(r[3] or ''),str(r[5] or ''),str(r[7] or '').strip(),str(r[11] or '').strip(),str(r[8] or '').strip()]   # v4.28: + category change, full status text, issued by
out={'date':last.strftime('%d.%m.%Y') if last else '', 'src':os.path.basename(f),'a':A,'rep':rep}
json.dump(out,open(a.out,'w'),ensure_ascii=False)
print(f'Aleksy punch file {os.path.basename(f)}: {len(A)} punches, latest {out["date"]}; reported list {len(rep)}')
