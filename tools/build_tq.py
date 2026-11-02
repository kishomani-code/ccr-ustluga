#!/usr/bin/env python3
"""Build tq/data.json from the TQ register (sheet 'TQ Registry') for CCR, G0-D1801FX0 and D48.
Usage: build_tq.py register.xlsx [drive_files.json] -> tq/data.json"""
import sys, os, re, json, datetime
import openpyxl
AREAS = re.compile(r'D1810BX0|D1801FX0|D4810BX0|D4801FX0', re.I)
def s(x): return '' if x is None else str(x).strip()
def d(x):
    if isinstance(x, (datetime.datetime, datetime.date)): return x.strftime('%d.%m.%Y')
    return s(x)[:10] if x else ''
def key(name):
    n = re.sub(r'\.pdf$', '', name, flags=re.I)
    n = re.sub(r'[^A-Za-z0-9]', '', n).upper()
    return n
def base(n):  # drawing no without revision / AS suffix, e.g. GLE-G0-D1810BX0-IN-ASKU-LC-001_03_AL_AS01 -> GLEG0D1810BX0INASKULC001
    n = re.sub(r'\.pdf$', '', n, flags=re.I)
    n = re.split(r'_', n)[0]
    return re.sub(r'[^A-Za-z0-9]', '', n).upper()
def status(ep, ow):
    ep, ow = ep.lower(), ow.lower()
    if 'cancel' in ep: return 'Cancelled'
    if ow.startswith('approved'): return 'Approved with comments' if 'comment' in ow else 'Approved'
    if ow.startswith('declined') or ow.startswith('reject'): return 'Rejected'
    if ep.startswith('reject'): return 'Rejected'
    if ep.startswith('closed'): return 'Closed'
    if ep.startswith('approved'): return 'Approved'
    return 'Waiting answer'
def items(reg, drive=None):
    wb = openpyxl.load_workbook(reg, read_only=True, data_only=True)
    rows = [list(r) for r in wb['TQ Registry'].iter_rows(values_only=True)][1:]
    files = {}
    if drive:
        for f in json.load(open(drive)):
            if f.get('mime', '').startswith('application/vnd.google-apps.folder'): continue
            files.setdefault(base(f['name']), []).append({'n': f['name'], 'id': f['id']})
    res = []
    for r in rows:
        if not r[4]: continue
        if not AREAS.search(s(r[16]) + ' ' + s(r[17])): continue
        drws = [x.strip() for x in re.split(r'[;\n]+', s(r[16])) if x.strip()]
        dl = []
        for x in drws:
            k = base(x)
            m = files.get(k) or files.get(k.replace('GLE', 'GLE', 1)) or []
            dl.append({'d': x, 'f': sorted(m, key=lambda z: z['n'])})
        ep, ow = s(r[27]), s(r[34])
        res.append({
            'no': re.sub(r'_R\d+$', '', s(r[4])), 'rev': s(r[5]), 'by': s(r[7]), 'iss': d(r[8]), 'sent': d(r[12]), 'ema': s(r[13]),
            'disc': s(r[14]), 'area': [a.strip() for a in re.split(r'[;\n]+', s(r[17])) if a.strip()], 'wp': s(r[18]),
            'cls': s(r[19]), 'imp': s(r[20]), 'en': s(r[21]), 'ru': s(r[22]),
            'ep': {'ema': s(r[23]), 'date': d(r[24]), 'chg': s(r[25]), 'dd': s(r[26]), 'st': ep, 'boq': s(r[28]), 'en': s(r[29]), 'ru': s(r[30])},
            'ow': {'to': s(r[32]), 'date': d(r[33]), 'st': ow, 'en': s(r[35]), 'ru': s(r[36]), 'rdate': d(r[38])},
            'cm': s(r[40]), 'rd': s(r[42]), 'drw': dl, 'st': status(ep, ow)})
    res.sort(key=lambda t: t['no'], reverse=True)
    return res, files

WATCH = [('Designer status', lambda t: t['ep']['st']), ('Designer answer', lambda t: t['ep']['en'] or t['ep']['ru']), ('Designer reply date', lambda t: t['ep']['date']),
         ('Change type', lambda t: t['ep']['chg']), ('Change to design (DD)', lambda t: t['ep']['dd']), ('Impact on BoQ', lambda t: t['ep']['boq']),
         ('Owner status', lambda t: t['ow']['st']), ('Owner answer', lambda t: t['ow']['en'] or t['ow']['ru']), ('Owner reply date', lambda t: t['ow']['rdate']),
         ('Revised drawings', lambda t: t['rd']), ('Comments on answer', lambda t: t['cm'])]
def diff(new, old, when):
    O = {t['no'] + '_R' + t['rev']: t for t in old}
    n = 0
    for t in new:
        o = O.get(t['no'] + '_R' + t['rev'])
        t['hist'] = list(o.get('hist', [])) if o else []
        if not o:
            if old: t['hist'].append({'d': when, 'w': ['New TQ']}); n += 1
            continue
        ch = []
        for name, f in WATCH:
            a, b = f(o), f(t)
            if a != b:
                ch.append({'f': name, 'a': a, 'b': b})
        if ch:
            t['hist'].append({'d': when, 'c': ch}); n += 1
    return n
def expand(items):
    out = []
    for t in items:
        out.append(t)
        for r in t.get('revs', []):
            x = dict(t); x.update(r); out.append(x)
    return out
def group(res):
    by = {}
    for t in res: by.setdefault(t['no'], []).append(t)
    out = []
    for no, L in by.items():
        L.sort(key=lambda t: t['rev'])
        m = L[-1]
        m['revs'] = [{'rev': t['rev'], 'st': t['st'], 'iss': t['iss'], 'sent': t['sent'], 'en': t['en'], 'ru': t['ru'], 'ep': t['ep'], 'ow': t['ow'], 'cm': t['cm'], 'rd': t['rd']} for t in L[:-1]]
        out.append(m)
    out.sort(key=lambda t: t['no'], reverse=True)
    return out
def ctq_list(files, data_json):
    try: T = json.load(open(data_json))['tq']['ctq']
    except Exception: return []
    out = []
    for x in T:
        x = list(x) + [''] * (17 - len(x))
        dw = []
        for m in re.findall(r'GLE-\([^)]+\)-[A-Z0-9\-]+', s(x[3])):
            dw.append({'d': m, 'f': sorted(files.get(base(m), []), key=lambda z: z['n'])})
        tqs = sorted(set(re.findall(r'TQS-GPP-RHI-[A-Z]+(?:-[A-Z]+)?-\d+', s(x[12]) + ' ' + s(x[13]))))
        out.append({'no': s(x[0]), 'pri': s(x[1]), 'sub': s(x[2]), 'dwg': s(x[3]), 'drw': dw, 'rev': s(x[4]), 'sh': s(x[5]), 'tags': s(x[6]), 'act': s(x[7]), 'cat': s(x[8]), 'resp': s(x[9]), 'aff': s(x[10]), 'hold': s(x[11]), 'rel': s(x[12]), 'rels': s(x[13]), 'tqs': tqs, 'st': s(x[14]), 'dt': s(x[15]), 'rem': s(x[16])})
    return out
def main(reg, drive=None, prev=None, out='tq/data.json', data_json='data.json'):
    res, files = items(reg, drive)
    today = datetime.date.today().strftime('%d.%m.%Y')
    old = None
    if prev:
        old = items(prev)[0]; when = 'previous register'
    else:
        try: old = expand(json.load(open(out))['items']); when = today
        except Exception: old = None
    ndiff = diff(res, old, when) if old else 0
    res = group(res)
    ctq = ctq_list(files, data_json)
    try: req = json.load(open(os.path.join(os.path.dirname(__file__), 'new_requests.json')))
    except Exception: req = []
    json.dump({'built': today, 'n': len(res), 'items': res, 'ctq': ctq, 'req': req}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(res), 'TQs;', sum(len(t['drw']) for t in res), 'drawing refs;', sum(1 for t in res for x in t['drw'] if x['f']), 'with PDF;', ndiff, 'changed vs previous;', len(ctq), 'CTQ')
if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], a[1] if len(a) > 1 else None, a[2] if len(a) > 2 else None)
