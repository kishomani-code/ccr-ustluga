"""v4.24: subsystem handover before GAS-IN -> handover.json
Input: my GAS-IN priority workbook (sheets 'Priority list', 'Summary by subsystem', 'Manpower plan').
Usage: python3 tools/build_handover.py GAS-IN_priority_my_G0_areas_<date>.xlsx [gas-in date dd.mm.yyyy]"""
import sys, json, datetime, re, openpyxl
src = sys.argv[1]; gas = sys.argv[2] if len(sys.argv) > 2 else '07.11.2026'
wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
S = lambda x: '' if x is None else (x.strftime('%d.%m.%Y') if hasattr(x, 'strftime') else str(x).strip())
def rows(name, hdr_row):
    R = list(wb[name].iter_rows(values_only=True)); H = [S(h) for h in R[hdr_row]]
    return [dict(zip(H, r)) for r in R[hdr_row + 1:] if r and r[0] not in (None, '') and any(r)]
P = rows('Priority list', 2); SS = {S(r.get('Subsystem')): r for r in rows('Summary by subsystem', 2) if r.get('Subsystem')}
MP = {S(r.get('Subsystem')): r for r in rows('Manpower plan', 2) if r.get('Subsystem')}
PRJ = {'G0-D1810BX0': 'CCR', 'G0-D4810BX0': 'D48', 'G0-D4801FX0': 'D48', 'G0-D8810BX0': '8810', 'G0-D8801FX0': '8810', 'G0-D1801FX0': '1801'}
num = lambda v: (float(v) if isinstance(v, (int, float)) else 0)
out = []
for r in P:
    sub = S(r['Subsystem']); s = SS.get(sub, {}); m = MP.get(sub, {})
    st = S(r['Handover status (inspection register 02.11)'])
    out.append({'rank': int(num(r['Rank'])), 'tit': S(r['Title']), 'prj': PRJ.get(S(r['Title']), ''), 'area': S(r['Area']), 'sub': sub, 'nm': S(r['Name (RU)']),
                'disc': S(r['Discipline']), 'pri': S(r['Client priority']), 'red': S(r['Red chain']), 'krit': S(r['In Критика list']),
                'st': st, 'done': st.startswith('Handed over'), 'insp': S(r['Inspection date / re-inspection']),
                'pa': int(num(r['A'])), 'pb': int(num(r['B'])), 'pc': int(num(r['C'])), 'pbefore': int(num(r['of which before PNR handover'])),
                'poth': S(r['Open punches other resp. (ГА/ГСП) total / A+B']), 'iwp': S(r['IWP remaining (cables m / items pc)']),
                'mc': S(r['MC forecast (ПК-1)']), 'block': S(r['Blocking comment (Критика sheets, raw)']), 'resp': S(r['Client responsible']),
                'act': S(r['Recommended action']), 'why': S(r['Why this rank']), 'ctq': S(r['Open CTQ / NT']), 'tq': S(r['Open client TQ']),
                'grp': int(num(s.get('Group'))) if s else 0, 'pull': int(num(s.get('Cables to pull'))), 'term': int(num(s.get('Cables to terminate'))),
                'rfi': int(num(s.get('Cables RFI needed'))), 'men': int(num(m.get('Men day 1–3 (04–06.11)'))), 'sv': S(m.get('Supervisor')),
                'fin': S(m.get('Finish by')), 'defer': S(m.get('Deferred after 07.11 (needs permit)'))})
json.dump({'ver': datetime.datetime.now().strftime('%Y%m%d%H%M'), 'date': '04.11.2026', 'gas': gas,
           'note': 'From 07.11.2026 (gas-in) every site job needs a work permit – minimum 1 week to get one.', 'subs': out},
          open('handover.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import collections
print(len(out), 'subsystems', collections.Counter((x['prj'], x['done']) for x in out))
