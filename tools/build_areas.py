#!/usr/bin/env python3
"""OTHER AREA data for the site app (v4.3).

Builds areas/index.json (one line per area / title with counts) and areas/<AREA>.json (cables from the
Md cable tracker, IWP lines, client punch (master punch list, responsible RHI), RHI internal punch and
cable drums for that area). Every title found in the cable tracker becomes an area.

  python3 tools/build_areas.py --input <folder with the latest files> --out areas
"""
import argparse, datetime, glob, json, os, re, sys, time, fnmatch

PATTERNS = {'iwp': ['*IWP_Status*.xls*'], 'cables': ['*Cable_Tracker*.xls*'], 'rhi': ['*Internal_Punch*.xls*'],
            'master': ['*Master_Punch_List*.xls*']}
SHEETS = {'iwp': 'EL_IWP_Status', 'cables': 'Единый кабельный журнал', 'rhi': 'Punch_List',
          'master': 'Log of Mechanical Progress'}


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def S(v):
    if v is None:
        return ''
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()


def num(v):
    try:
        x = float(str(v).replace(',', '.').replace(' ', ''))
    except (TypeError, ValueError):
        return 0
    if x != x:
        return 0
    return int(x) if x.is_integer() else round(x, 2)


def xdate(v, fmt='%d.%m.%y'):
    if v in (None, ''):
        return ''
    if isinstance(v, (int, float)) and 20000 < v < 80000:
        return (datetime.datetime(1899, 12, 30) + datetime.timedelta(days=float(v))).strftime(fmt)
    if isinstance(v, datetime.datetime):
        return v.strftime(fmt)
    s = S(v)
    m = re.match(r'(\d{4})-(\d\d)-(\d\d)', s)
    if m:
        return f'{m.group(3)}.{m.group(2)}.{m.group(1)[2:]}'
    m = re.match(r'(\d\d)[./](\d\d)[./](\d{2,4})', s)
    if m:
        return f'{m.group(1)}.{m.group(2)}.{m.group(3)[-2:]}'
    return s[:10]


def col(r, i):
    return r[i] if i < len(r) else None


def norm_name(s):
    return re.sub(r'[\s_]+', ' ', s).lower()


def find_files(folder):
    names = [f for f in glob.glob(os.path.join(folder, '**', '*'), recursive=True)
             if os.path.isfile(f) and not os.path.basename(f).startswith('~$')]
    out = {}
    for k, pats in PATTERNS.items():
        c = [f for f in names if any(fnmatch.fnmatch(norm_name(os.path.basename(f)), norm_name(p)) for p in pats)]
        if c:
            out[k] = max(c, key=os.path.getmtime)
    return out


def read_sheet(path, sheet):
    t = time.time()
    if path.lower().endswith('.xlsb'):
        from pyxlsb import open_workbook
        with open_workbook(path) as wb:
            with wb.get_sheet(sheet or wb.sheets[0]) as ws:
                rows = [[c.v for c in r] for r in ws.rows()]
    else:
        import openpyxl, warnings
        warnings.filterwarnings('ignore')
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb[sheet] if sheet else wb.worksheets[0]
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        wb.close()
    log(f'  read {os.path.basename(path)} [{sheet}]: {len(rows)} rows, {time.time() - t:.0f}s')
    return rows


CYR = str.maketrans('АВЕКМНОРСТХ', 'ABEKMHOPCTX')


def area_key(s):
    a = S(s).translate(CYR).upper().replace(' ', '')
    return a if re.match(r'^G\d-[A-Z0-9]{3,10}$', a) else ''


def sys_of(doc):
    m = re.search(r'\)-([A-Z]{2}-[A-Z0-9]{3,5})', doc)
    return m.group(1) if m else ''


# ---------------------------------------------------------------- builders
CK = ['t', 'f', 'o', 'ty', 'c', 'id', 'ln', 'pm', 'pd', 'ps', 'tf', 'tt', 'tc', 'dr', 'co', 'sys', 'dc', 'h', 'rfi', 'doc']


def build_cables(rows):
    """tracker rows -> {area: [cable rows]} ; drums -> {drum no: drum}"""
    by_area, drums = {}, {}
    hdr = None
    for i, r in enumerate(rows[:8]):
        if 'Oбoзнaчeниekaбeля' in [S(x) for x in r] or 'Обозначение кабеля' in [S(x).replace(' ', '') for x in r]:
            hdr = i
            break
    start = (hdr + 1) if hdr is not None else 5
    for r in rows[start:]:
        t = S(col(r, 21))
        if not t or len(r) < 60:
            continue
        if S(col(r, 35)):          # counted in another project / deleted / duplicate
            continue
        a = area_key(col(r, 14))
        if not a:
            continue
        co = S(col(r, 74)) or S(col(r, 65)) or S(col(r, 38))
        co = 'RHI' if co in ('RHI', 'РХИ', 'РХИ_') else co
        doc = S(col(r, 0))
        dr = S(col(r, 59)) or S(col(r, 63)) or S(col(r, 60))
        c = {'t': t, 'f': S(col(r, 22))[:120], 'o': S(col(r, 23))[:120], 'ty': S(col(r, 26)), 'c': S(col(r, 27)),
             'id': S(col(r, 29)), 'ln': num(col(r, 32)), 'pm': num(col(r, 47)), 'pd': xdate(col(r, 48)),
             'ps': S(col(r, 49)), 'tf': xdate(col(r, 51)), 'tt': xdate(col(r, 52)), 'tc': S(col(r, 54)),
             'dr': dr, 'co': co, 'sys': sys_of(doc), 'dc': S(col(r, 10)), 'h': S(col(r, 36))[:80],
             'rfi': (S(col(r, 56)) + ' ' + xdate(col(r, 57))).strip(), 'doc': doc}
        by_area.setdefault(a, []).append([c[k] for k in CK])
        if dr:
            d = drums.setdefault(dr, {'no': dr, 'id': S(col(r, 29)), 'ty': S(col(r, 26)), 'c': S(col(r, 27)),
                                      'len': num(col(r, 93)), 'rem': num(col(r, 94)), 'org': S(col(r, 117)), 'cab': []})
            if not d['len']:
                d['len'] = num(col(r, 93))
            if d['rem'] in (0, '') and col(r, 94) not in (None, ''):
                d['rem'] = num(col(r, 94))
            d['cab'].append([t, a, c['ln'], c['pm'], c['ps'] == 'Completed'])
    return by_area, drums


IK = ['acc', 'grp', 'tag', 'u', 'q', 'f', 'rem', 'pc', 'co', 'sys', 'dwg', 'desc']


def build_items(rows):
    by_area = {}
    for r in rows[5:]:
        if len(r) < 47:
            continue
        a = area_key(col(r, 2))
        acc = S(col(r, 34))
        if not a or not acc:
            continue
        acc = acc.replace('.0', '') if re.match(r'^\d+\.0$', acc) else acc
        q = col(r, 42)
        q = num(q) if q not in (None, '') else num(col(r, 21))
        dwg = S(col(r, 5))
        co = S(col(r, 46))
        o = {'acc': acc, 'grp': S(col(r, 1)), 'tag': S(col(r, 14)), 'u': S(col(r, 22)) or 'pc', 'q': q,
             'f': num(col(r, 43)), 'rem': num(col(r, 44)), 'pc': num(col(r, 45)), 'co': co if co and co != '0' else '',
             'sys': sys_of(dwg) or S(col(r, 4)), 'dwg': dwg, 'desc': S(col(r, 20))[:100]}
        by_area.setdefault(a, []).append([o[k] for k in IK])
    return by_area


PK = ['no', 'tag', 'tagd', 'disc', 'sub', 'den', 'cat', 'st', 'idate', 'cdate', 'by', 'org', 'resp', 'notes', 'sec']


def st_map(v):
    s = S(v).lower()
    return 'Closed' if re.search(r'закр|clos|отмен|cancel|устран', s) and not re.search(r'не устран', s) else 'Open'


def build_master(rows):
    by_area, names = {}, {}
    for r in rows[1:]:
        no, a = S(col(r, 0)), area_key(col(r, 1))
        if not no or no == '#' or not a:
            continue
        names.setdefault(a, S(col(r, 2)))
        resp = S(col(r, 22))
        if not re.search(r'РХИ|RHI|Rencons', resp, re.I):
            continue
        o = {'no': no.replace('.0', ''), 'tag': S(col(r, 9)), 'tagd': S(col(r, 10))[:80], 'disc': S(col(r, 8))[:60],
             'sub': S(col(r, 5)), 'den': (S(col(r, 12)) + (' ' + S(col(r, 13)) if S(col(r, 13)) not in ('', '-') else ''))[:300],
             'cat': S(col(r, 18)), 'st': st_map(col(r, 23)), 'idate': xdate(col(r, 15)), 'cdate': xdate(col(r, 24)),
             'by': S(col(r, 19)), 'org': S(col(r, 20)), 'resp': resp, 'notes': S(col(r, 25))[:160], 'sec': S(col(r, 11))}
        if o['notes'] == '-':
            o['notes'] = ''
        by_area.setdefault(a, []).append([o[k] for k in PK])
    return by_area, names


def build_rhi(rows):
    by_area = {}
    for r in rows[1:]:
        no, a = S(col(r, 0)), area_key(col(r, 1))
        if not no or not a:
            continue
        o = {'no': 'RHI-' + no.replace('.0', ''), 'tag': S(col(r, 6)), 'tagd': S(col(r, 7))[:80], 'disc': S(col(r, 3)),
             'sub': S(col(r, 2)), 'den': S(col(r, 9))[:300], 'cat': S(col(r, 10)), 'st': st_map(col(r, 13)),
             'idate': xdate(col(r, 12)), 'cdate': xdate(col(r, 14)), 'by': S(col(r, 11)), 'org': 'RHI QC',
             'resp': 'RHI', 'notes': ' · '.join(x for x in (S(col(r, 17)), S(col(r, 18)), S(col(r, 21))) if x)[:160],
             'sec': S(col(r, 8))}
        by_area.setdefault(a, []).append([o[k] for k in PK])
    return by_area


DK = ['no', 'id', 'ty', 'c', 'len', 'rem', 'org', 'cab']


def grp_name(mp):
    m = mp.lower()
    if 'cable laying' in m or 'cable pulling' in m:
        return 'Cable pulling'
    if 'cable termination' in m:
        return 'Cable termination'
    if 'gland' in m:
        return 'Cable glands'
    if 'tray' in m or 'ladder' in m:
        return 'Cable tray'
    if 'earth' in m or 'ground' in m:
        return 'Earthing'
    if 'light' in m:
        return 'Lighting'
    if 'heat' in m or 'eht' in m:
        return 'Heat tracing'
    if 'junction box' in m or 'jb' in m:
        return 'Junction boxes'
    if 'instrument' in m and ('install' in m or 'mount' in m):
        return 'Instrument installation'
    if 'install' in m or 'mount' in m or 'erect' in m:
        return 'Equipment installation'
    if 'steel' in m or 'support' in m:
        return 'Steel structures / supports'
    if 'test' in m or 'loop' in m:
        return 'Testing'
    if m.strip() == 'eh':
        return 'Heat tracing (EH)'
    mp = mp.strip()
    return (mp[0].upper() + mp[1:])[:60]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--input', required=True)
    ap.add_argument('--out', default='areas')
    ap.add_argument('--date', default=datetime.date.today().strftime('%d.%m.%Y'))
    a = ap.parse_args()
    files = find_files(a.input)
    for k in PATTERNS:
        log(f'{k:8s} {files.get(k, "-- not found --")}')
    if 'cables' not in files:
        sys.exit('cable tracker not found')
    rows = {k: read_sheet(f, SHEETS[k]) for k, f in files.items()}
    cab, drums = build_cables(rows['cables'])
    items = build_items(rows['iwp']) if 'iwp' in rows else {}
    cl, names = build_master(rows['master']) if 'master' in rows else ({}, {})
    rh = build_rhi(rows['rhi']) if 'rhi' in rows else {}
    os.makedirs(a.out, exist_ok=True)
    for f in glob.glob(os.path.join(a.out, '*.json')):
        os.remove(f)
    areas = sorted(cab)                      # an area = a title that has cables in the Md cable tracker
    dr_area = {}
    for d in drums.values():
        for c in d['cab']:
            dr_area.setdefault(c[1], set()).add(d['no'])
    index = []
    ik = {k: i for i, k in enumerate(IK)}
    ck = {k: i for i, k in enumerate(CK)}
    pk = {k: i for i, k in enumerate(PK)}
    src = ', '.join(os.path.basename(f) for f in files.values())
    for ar in areas:
        C = cab.get(ar, []); I = items.get(ar, []); P = cl.get(ar, []); R = rh.get(ar, [])
        D = [[drums[n][k] for k in DK] for n in sorted(dr_area.get(ar, []))]
        rhi = [c for c in C if c[ck['co']] == 'RHI']
        pulled = sum(1 for c in rhi if c[ck['ps']] == 'Completed')
        term = sum(1 for c in rhi if c[ck['tc']] == 'Completed')
        done = sum(1 for x in I if x[ik['q']] > 0 and x[ik['f']] >= x[ik['q']] - 0.5)
        G = {}                               # IWP by activity group: [lines, lines done, qty, fact, unit, RHI lines, RHI done, RHI qty, RHI fact]
        for x in I:
            g = grp_name(x[ik['grp']])
            u = x[ik['u']]
            e = G.setdefault(g, [0, 0, 0, 0, u, 0, 0, 0, 0])
            dn = 1 if x[ik['q']] > 0 and x[ik['f']] >= x[ik['q']] - 0.5 else 0
            e[0] += 1; e[1] += dn; e[2] += x[ik['q']]; e[3] += min(x[ik['f']], x[ik['q']]) if x[ik['q']] else x[ik['f']]
            if x[ik['co']] == 'RHI':
                e[5] += 1; e[6] += dn; e[7] += x[ik['q']]; e[8] += min(x[ik['f']], x[ik['q']]) if x[ik['q']] else x[ik['f']]
        for e in G.values():
            for j in (2, 3, 7, 8):
                e[j] = num(e[j])
        EH = [c for c in C if c[ck['dc']] == 'EH' or c[ck['sys']].startswith('EH-')]      # cold cables = heat tracing (EOES / AEOG)
        EHR = [c for c in EH if c[ck['co']] == 'RHI']
        row = {'a': ar, 'nm': names.get(ar, ''), 'g': G,
               'eh': [len(EH), len(EHR), sum(1 for c in EH if c[ck['ps']] == 'Completed'), sum(1 for c in EH if c[ck['tc']] == 'Completed'),
                      num(sum(c[ck['ln']] for c in EH)), num(sum(c[ck['pm']] for c in EH)), sum(1 for c in EHR if c[ck['ps']] == 'Completed'), sum(1 for c in EHR if c[ck['tc']] == 'Completed')],
               'cab': [len(C), len(rhi), pulled, term, num(sum(c[ck['ln']] for c in rhi)), num(sum(c[ck['pm']] for c in rhi))],
               'iwp': [len(I), done], 'cl': [len(P), sum(1 for p in P if p[pk['st']] == 'Open')],
               'rh': [len(R), sum(1 for p in R if p[pk['st']] == 'Open')], 'dr': len(D)}
        index.append(row)
        with open(os.path.join(a.out, ar + '.json'), 'w', encoding='utf-8') as f:
            json.dump({'a': ar, 'nm': row['nm'], 'date': a.date, 'CK': CK, 'cables': C, 'IK': IK, 'items': I,
                       'PK': PK, 'punch': P, 'rhi': R, 'DK': DK, 'drums': D}, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(a.out, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({'date': a.date, 'src': src, 'ver': datetime.datetime.now().strftime('%Y%m%d%H%M'), 'areas': index},
                  f, ensure_ascii=False, separators=(',', ':'))
    tot = sum(os.path.getsize(f) for f in glob.glob(os.path.join(a.out, '*.json')))
    log(f'{len(index)} areas · {sum(len(v) for v in cab.values())} cables · {sum(len(v) for v in items.values())} IWP lines · '
        f'{sum(len(v) for v in cl.values())} client punch (RHI) · {sum(len(v) for v in rh.values())} RHI punch · {len(drums)} drums · {tot / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
