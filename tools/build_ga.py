"""v4.17: commissioning contacts (Gazprom Automation, РП ГА) per subsystem -> ga.json
Source: client Excel (sheets БАЗА = subsystem -> РП ГА / e-mail / phone, СПР = report point -> РП, Лист1 = contact list).
Usage: python3 tools/build_ga.py <excel> [date]"""
import sys, json, re, collections, datetime, openpyxl, warnings
warnings.filterwarnings('ignore')
src = sys.argv[1]; date = sys.argv[2] if len(sys.argv) > 2 else datetime.date.today().strftime('%d.%m.%Y')
wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
cl = lambda s: re.sub(r'\s+', ' ', str(s or '')).strip()
def phones(s): return [p.strip() for p in str(s or '').split('\n') if p.strip() and p.strip() != '-']
def mails(s): return [m.strip() for m in re.split(r'[\n;, ]+', str(s or '')) if '@' in m]
people = collections.OrderedDict()
for r in wb['Лист1'].iter_rows(values_only=True):
    if r and r[0] and len(r) > 2 and (r[1] or r[2]) and '@' in str(r[1] or ''): people[cl(r[0])] = [mails(r[1]), phones(r[2])]
sub = {}; sysc = collections.defaultdict(collections.Counter); posc = collections.defaultdict(collections.Counter); sname = {}
for r in list(wb['БАЗА'].iter_rows(values_only=True))[2:]:
    if not r or not r[4] or not isinstance(r[6], str): continue
    nm = cl(r[6]); people.setdefault(nm, [mails(r[7]), phones(r[8])])
    s = cl(r[4]); sub[s] = [nm, cl(r[5])]
    sysc[cl(r[2])][nm] += 1; posc[cl(r[1])][nm] += 1; sname[cl(r[2])] = cl(r[3])
pts = []
for r in wb['СПР'].iter_rows(values_only=True):
    v = [x for x in (r or []) if x not in (None, '')]
    if len(v) >= 2 and re.match(r'\d', str(v[0])): pts.append([cl(v[0]), cl(v[1]), cl(v[2]) if len(v) > 2 else ''])
names = list(people)
ix = {n: i for i, n in enumerate(names)}
out = {'ver': datetime.datetime.now().strftime('%Y%m%d%H%M'), 'date': date,
       'people': [[n] + people[n] for n in names],
       'sub': {s: [ix[v[0]], v[1]] for s, v in sorted(sub.items())},
       'sys': {k: [ix[c.most_common(1)[0][0]], sname.get(k, '')] for k, c in sorted(sysc.items())},
       'pos': {k: ix[c.most_common(1)[0][0]] for k, c in sorted(posc.items())},
       'pts': [[p, ix.get(n, -1), st] for p, n, st in pts],
       'area': {'CCR': ix.get('Кахаров И.С.', -1), 'D48': ix.get('Кузьмийчук К.В.', -1)}}
json.dump(out, open('ga.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(names), 'people ·', len(sub), 'subsystems ·', len(pts), 'report points')
