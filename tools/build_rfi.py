#!/usr/bin/env python3
"""Build rfi_<site>.json for the RFI and Mechanical Completion (subsystem) menus.

Sources (found in --input by file name, newest wins):
  *IWP_Status*          -> subsystem of every IWP line (column 'Subsistem adi rev01'), by Access ID and by tag
  *RAWP*                -> cable laying / termination RFI per cable (IWP unique name, RFI No, result, date, ITP step)
                           + subsystem and sub-system AKT (final) status
  *Equipment_Control*   -> equipment RFI per unique tag (RFI No, status, date, ITP step) + subsystem
The site data file (data.json / data_d48.json / data_cold.json) gives the cables and punch list of the site.
Output (small, per site): subsystem list, access-id -> subsystem, cable RFI table, equipment RFI table.
Missing source files: the previous rfi_<site>.json section is kept.
"""
import argparse, glob, json, os, re, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_data as B   # reuse readers and helpers

SITE_FILES = {'ccr': 'data.json', 'd48': 'data_d48.json', 'cold': 'data_cold.json'}


def read(path, sheet):
    try:
        return B.read_sheet(path, sheet)
    except Exception as e:
        print('  !! could not read', os.path.basename(path), e)
        return None


S, col, xdate, num = B.S, B.col, B.xdate, B.num


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--root', default='.')
    ap.add_argument('--sites', default='ccr,d48,cold')
    a = ap.parse_args()
    F = B.find_files(a.input)
    f_iwp, f_raw, f_eq = F.get('iwp'), F.get('rawp'), F.get('equip')
    print('IWP status:', f_iwp and os.path.basename(f_iwp)); print('RAWP:', f_raw and os.path.basename(f_raw)); print('Equipment:', f_eq and os.path.basename(f_eq))
    iwp = read(f_iwp, 'EL_IWP_Status') if f_iwp else None
    raw = read(f_raw, 'Cable_list') if f_raw else None
    eq = read(f_eq, 'E&I_Equipment') if f_eq else None
    for site in a.sites.split(','):
        titles, _ = B.SITES[site]
        disc = B.DISC_RX.get(site)
        dpath = os.path.join(a.root, SITE_FILES[site])
        if not os.path.exists(dpath):
            continue
        D = json.load(open(dpath, encoding='utf-8'))
        CK = D['CK']; it = CK.index('t')
        ctags = {c[it] for c in D['cables']}
        IK = D['IK']; ia, iu, itg = IK.index('acc'), IK.index('uid'), IK.index('tag')
        accs = {r[ia] for r in D['items']}
        out_p = os.path.join(a.root, f'rfi_{site}.json')
        prev = json.load(open(out_p, encoding='utf-8')) if os.path.exists(out_p) else {}
        # subsystem names from the client punch list (code -> English / Russian name)
        P = D['punch']; PK = P['K']; PT = P['tabs']
        nm = {}
        for r in P['rows']:
            code = PT['sub'][r[PK.index('sub')]]
            j = r[PK.index('subn')]
            if code and code not in nm:
                nm[code] = ((PT.get('subnE') or PT['subn'])[j] if j < len(PT.get('subnE') or PT['subn']) else '', PT['subn'][j])
        SS, SI = [], {}

        def ssi(code, akt=''):
            code = S(code)
            if not code or code in ('0', '-', 'N/A'):
                return -1
            if code not in SI:
                SI[code] = len(SS)
                en, ru = nm.get(code, ('', ''))
                SS.append([code, en, ru, ''])
            k = SI[code]
            if akt and not SS[k][3]:
                SS[k][3] = akt
            return k
        # keep previous subsystem order (stable indexes on phones)
        for s in prev.get('ss', []):
            ssi(s[0])
        # ---- IWP status: access id -> subsystem
        acc2 = {}
        if iwp:
            for r in iwp[5:]:
                if len(r) < 40 or S(col(r, 2)) not in titles:
                    continue
                if disc and not re.search(disc, S(col(r, 5))):
                    continue
                acc = B.acc_s(col(r, 34))
                if acc in accs:
                    k = ssi(col(r, 12))
                    if k >= 0:
                        acc2[acc] = k
        else:
            acc2 = prev.get('acc', {})
        # ---- RAWP: cable RFI
        cab = {}
        if raw:
            hdr = [S(x) for x in (raw[2] if len(raw) > 2 else [])]
            new = 'Project TAG' in hdr
            for r in raw[3:]:
                tag = S(col(r, 10 if new else 8))
                if not tag or (tag not in ctags and S(col(r, 1)) not in titles):
                    continue
                if new:
                    k = ssi(col(r, 6), S(col(r, 7)))
                    cab[tag] = [k, S(col(r, 14)), S(col(r, 17)), S(col(r, 18)), xdate(col(r, 19)), S(col(r, 16)), num(col(r, 15)),
                                S(col(r, 21)), S(col(r, 24)), S(col(r, 25)), xdate(col(r, 26)), num(col(r, 22)), S(col(r, 1))]
                else:
                    cab[tag] = [-1, '', S(col(r, 15)), S(col(r, 16)), xdate(col(r, 17)), '', num(col(r, 13)),
                                '', S(col(r, 22)), S(col(r, 23)), xdate(col(r, 24)), num(col(r, 20)), S(col(r, 1))]
        else:
            cab = prev.get('cab', {})
        # ---- Equipment control: equipment RFI
        eqo = []
        if eq:
            for r in eq[2:]:
                if len(r) < 27 or S(col(r, 1)) not in titles:
                    continue
                if disc and not re.search(disc, S(col(r, 0))):
                    continue
                k = ssi(col(r, 7))
                eqo.append([S(col(r, 18)), S(col(r, 8)), S(col(r, 10))[:80], k, S(col(r, 23)), S(col(r, 24)), xdate(col(r, 25)),
                            S(col(r, 26)), xdate(col(r, 32)), num(col(r, 33)), S(col(r, 21)), S(col(r, 0))])
        else:
            eqo = prev.get('eq', [])
        # subsystems also from the punch list of the site (so MC shows punch-only subsystems too)
        for code in nm:
            if re.match(r'G\d-\d', code):
                ssi(code)
        out = {'date': datetime.date.today().strftime('%d.%m.%Y'),
               'src': ' · '.join(os.path.basename(f) for f in (f_iwp, f_raw, f_eq) if f) or prev.get('src', ''),
               'ss': SS, 'acc': acc2, 'cab': cab, 'eq': eqo}
        out = B.scrub_all(out)
        json.dump(out, open(out_p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(f'{site}: {len(SS)} subsystems · {len(acc2)} IWP lines · {len(cab)} cables with RFI · {len(eqo)} equipment rows -> {out_p} ({os.path.getsize(out_p):,} bytes)')


if __name__ == '__main__':
    main()
