# Build qc-calc/qcc.json – data for the QC inspection calculator.
# Sources (already in the app): data*.json (IWP items, cable tracker, panels), rfi_*.json (RHI QC: equipment control +
# cable RAWP inspection), qc.json (client QC comments of the master punch list), IWP status (client subsystem per access ID),
# Md cable tracker (cable ident).
import json, re, pickle, collections, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
IWP_PKL = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/in23/iwp2111_g0.pkl'
TRK_PKL = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/b2210zk/trk.pkl'
hd, irows = pickle.load(open(IWP_PKL, 'rb'))
SUBOF = {str(r[34]): (r[12] or '') for r in irows}
TAGSUB = {}
for r in irows:
    if r[12] and r[14]: TAGSUB.setdefault(str(r[14]).strip(), r[12])
IDENT = {}
try:
    import pandas as pd
    t = pickle.load(open(TRK_PKL, 'rb')); C = list(t.columns)
    for tag, idt in zip(t.iloc[:, 21].astype(str), t.iloc[:, 29].astype(str)):
        tag = str(tag).strip(); idt = str(idt)
        if idt and idt not in ('nan', 'удалена') and tag: IDENT.setdefault(tag, idt.strip())
except Exception as e:
    print('no ident', e)

PRJ = [('CCR', 'data.json', 'rfi_ccr.json'), ('D48', 'data_d48.json', 'rfi_d48.json'), ('1801', 'data_1801.json', 'rfi_1801.json'), ('8810', 'data_8810.json', 'rfi_8810.json')]
SYSN = {'PSGN': ('Fire alarm', 'Пожарная сигнализация'), 'SPBA': ('Gas fire extinguishing', 'Автоматическое газовое пожаротушение'), 'SPAP': ('Fire fighting automation', 'Автоматика пожаротушения'),
        'EG01': ('Earthing', 'Заземление'), 'EG02': ('Earthing / lightning protection', 'Заземление / молниезащита'), 'ELOV': ('Lighting', 'Освещение'), 'ELNR': ('Outdoor lighting', 'Наружное освещение'),
        'EMSV': ('Power supply / motors', 'Силовое электрооборудование'), 'ESPS': ('Power supply', 'Электроснабжение'), 'ESBZ': ('Power supply', 'Электроснабжение'),
        'AOVK': ('HVAC automation', 'Автоматизация ОВиК'), 'ASKU': ('Access control', 'СКУД'), 'ASUE': ('Power management (AUCS)', 'АСУ Э'), 'ASUS': ('Utilities automation', 'АСУ ТП'),
        'DCS': ('DCS', 'РСУ'), 'ESD': ('ESD', 'ПАЗ'), 'GDSS': ('Gas detection', 'Газообнаружение'), 'SKST': ('Structured cabling', 'СКС'), 'GGSO': ('Telephone / PA', 'Связь / ГГС'),
        'RPTV': ('CCTV', 'Видеонаблюдение'), 'LSOP': ('Local network', 'ЛВС'), 'EOBK': ('Heat tracing', 'Электрообогрев'), 'EOES': ('Heat tracing', 'Электрообогрев'), 'AEOG': ('Heat tracing', 'Электрообогрев'),
        'UPA': ('PA / GA', 'Оповещение'), 'PAGA': ('PA / GA', 'Оповещение'), 'ATHP': ('Instrumentation', 'КИП'), 'MAEC': ('Analysers', 'Анализаторы'), 'ASPS': ('Fire alarm', 'Пожарная сигнализация'), 'OVKV': ('HVAC', 'Отопление, вентиляция и кондиционирование')}
DEV_GRP = ('Terminal, Junction', 'Field Instruments', 'field Instruments', 'Junction Boxes', 'Main Electrical', 'EH', 'Telecom Outlet', 'Transit Module', 'Frame Installation', 'Grounding Bar')
TAGRE = re.compile(r'G\d-[A-Z0-9А-Я.]+(?:-[A-Z0-9А-Я.]+)+')
def kind(grp, ru, en, tag):
    s = (ru + ' ' + en + ' ' + tag).lower()
    if 'transit' in grp.lower() or 'frame installation' in grp.lower() or 'mct' in s: return 'mct'
    if grp.startswith('Grounding') or 'шина заземл' in s: return 'earth'
    if re.search(r'светильник|прожектор|luminaire|light fitting|floodlight|lighting', s): return 'light'
    if re.search(r'шкаф|щит|панел|cabinet|panel|switchgear|распредел|кру|нку|ящик|board', s) and 'коробк' not in s: return 'panel'
    if re.search(r'коробк|junction|jb|terminal box|клеммн', s): return 'jb'
    return 'inst'
def sysof(sub, dsys):
    m = re.match(r'G\d-[0-9A-Z]+-(?:[0-9]+-)?([A-Z]+)', sub or '')
    if m and m.group(1) not in ('000',): return m.group(1)
    return (dsys or '').split('-')[-1] or 'OTHER'

q = json.load(open('qc.json')); QK = q['K']; QT = set(q['TABK'])
QC = collections.defaultdict(list)
for r in q['rows']:
    o = {k: (q['tabs'][k][v] if k in QT and isinstance(v, int) and v < len(q['tabs'][k]) else v) for k, v in zip(QK, r)}
    QC[str(o['tag']).strip()].append([o['no'], o['cat'], o['dru'], o['den'], o['st'], o['idate'], o['cdate'], o['by'], o['sub'], o['subnE'], o['subn']])

OUT = {'ver': '', 'P': {}}
for p, df, rf in PRJ:
    d = json.load(open(df)); T = d['tabs']; IK = d['IK']; CK = d['CK']
    r = json.load(open(rf))
    SSN = {s[0]: (s[1], s[2]) for s in r['ss']}
    EQ = {e[1]: e for e in r['eq']}
    # ---- devices from IWP items
    dev = collections.OrderedDict()
    for it in d['items']:
        o = dict(zip(IK, it)); tag = str(o['tag']).strip()
        grp = T['grp'][o['grp']] if isinstance(o['grp'], int) else str(o['grp'])
        if not tag or tag == 'NO TAGGED' or not grp.startswith(DEV_GRP): continue
        sub = SUBOF.get(str(o['acc']), '')
        en = T['desc'][o['desc']] if isinstance(o['desc'], int) else str(o['desc'])
        ru = str(o.get('ctag') or '')
        dwg = T['dwg'][o['dwg']] if isinstance(o['dwg'], int) else str(o['dwg'])
        dsys = T['sys'][o['sys']] if isinstance(o['sys'], int) else str(o['sys'])
        x = dev.get(tag)
        if not x:
            x = dev[tag] = {'t': tag, 'ru': ru, 'en': en, 'k': kind(grp, ru, en, tag), 'sub': sub, 'sy': sysof(sub, dsys), 'dw': dwg, 'g': grp, 'q': 0, 'f': 0, 'acc': str(o['acc']), 'cab': []}
        if not x['sub'] and sub: x['sub'] = sub; x['sy'] = sysof(sub, dsys)
        x['q'] += o['q'] or 0; x['f'] += o['f'] or 0
    for pn in d.get('panels', []):
        tag = pn[0]
        if tag not in dev:
            dev[tag] = {'t': tag, 'ru': pn[1].strip(), 'en': 'Panel / equipment (from cable list)', 'k': 'panel', 'sub': '', 'sy': sysof('', tag.split('-')[-2] if '-' in tag else ''), 'dw': '', 'g': 'Panel (cable list)', 'q': 0, 'f': 0, 'acc': '', 'cab': []}
    # ---- cables
    cab = []
    for c in d['cables']:
        o = dict(zip(CK, c)); ct = str(o['t']).strip()
        if not ct: continue
        R = r['cab'].get(ct)
        cab.append([ct, str(o['f'])[:140], str(o['o'])[:140], (str(o['ty']) + ' ' + str(o['c'])).strip(), o['ln'], o['dr'], o['tp'], o['pd'], o['tt'], o['tf'], o['tto'],
                    IDENT.get(ct, ''), (R[2] + ' ' + R[3]) if R else '', (R[8] + ' ' + R[9]) if R and len(R) > 9 else '', o['d'], o['tqs'] or ''])
        ci = len(cab) - 1
        linked = set()
        for txt in (str(o['f']), str(o['o'])):
            for m in TAGRE.findall(txt):
                if m in dev: linked.add(m)
        parts = ct.split('-')
        for n in range(len(parts) - 1, 2, -1):
            pre = '-'.join(parts[:n])
            if pre in dev: linked.add(pre); break
        for tg in linked: dev[tg]['cab'].append(ci)
    # ---- RHI QC and client QC
    D = []
    for x in dev.values():
        e = EQ.get(x['t'])
        rq = [e[4], e[5], e[6]] if e else []
        cq = QC.get(x['t'], [])
        for cn in x['cab']:
            cq = cq + QC.get(cab[cn][0], [])
        sub = x['sub'] or TAGSUB.get(x['t'], '')
        if not sub:
            cs = collections.Counter(TAGSUB.get(cab[cn][0]) for cn in x['cab'] if TAGSUB.get(cab[cn][0]))
            sub = cs.most_common(1)[0][0] if cs else (cq[0][8] if cq else '')
        sy = sysof(sub, x['sy']) if sub else x['sy']
        sn = SSN.get(sub) or ((cq[0][9], cq[0][10]) if cq else ('', ''))
        D.append([x['t'], x['ru'], x['en'], x['k'], sy, sub, sn[0], sn[1], x['dw'], x['g'], x['q'], x['f'], rq, cq, x['cab'], x['acc']])
    OUT['P'][p] = {'D': D, 'C': cab, 'date': r['date']}
    print(p, 'devices', len(D), 'cables', len(cab), 'with cables', sum(1 for x in D if x[14]), 'with sub', sum(1 for x in D if x[5]))
OUT['SYS'] = SYSN
OUT['ver'] = r['date']
os.makedirs('qc-calc', exist_ok=True)
for p in OUT['P']:
    json.dump(OUT['P'][p], open('qc-calc/qcc_%s.json' % p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(p, os.path.getsize('qc-calc/qcc_%s.json' % p))
json.dump({'ver': OUT['ver'], 'SYS': SYSN, 'P': list(OUT['P'])}, open('qc-calc/qcc_meta.json', 'w', encoding='utf-8'), ensure_ascii=False)
if os.path.exists('qc-calc/qcc.json'): os.remove('qc-calc/qcc.json')
