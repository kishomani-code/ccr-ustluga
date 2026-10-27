# v3.11 one-time patch: client punch / RHI internal punch shown separately
p = 'app.js'; s = open(p, encoding='utf-8').read()
rep = [
 ("o.rhi = /РХИ|Rencons/i.test(PT.resp[o.resp]); return o; });",
  "o.rhi = /РХИ|Rencons/i.test(PT.resp[o.resp]); o.int = /^RHI-/.test(String(o.no)); return o; });"),
 ("const r = PU.filter(p => p.rhi), o = r.filter(p => p.st === 'Open').length;",
  "const r = PU.filter(p => p.rhi), o = r.filter(p => p.st === 'Open').length, oCl = r.filter(p => !p.int && p.st === 'Open').length, oIn = r.filter(p => p.int && p.st === 'Open').length;"),
 ("`Punch list (RHI)<br>", "`Punch list<br>"),
 ("`${o} open · ${r.length - o} closed${ppend ? ' · ' + ppend + ' to send' : ''}`",
  "`Client ${oCl} open · RHI internal ${oIn} open${ppend ? ' · ' + ppend + ' to send' : ''}`"),
 ("function pscope() { VS.PS = VS.PS || {who: 'rhi'}; return VS.PS.who === 'rhi' ? PU.filter(p => p.rhi) : PU; }",
  "function pscope() { VS.PS = VS.PS || {who: 'cl'}; if (!['cl', 'int', 'all'].includes(VS.PS.who)) VS.PS.who = 'cl'; return VS.PS.who === 'cl' ? PU.filter(p => p.rhi && !p.int) : VS.PS.who === 'int' ? PU.filter(p => p.int) : PU; }"),
 ("[['rhi', 'RHI responsible'], ['all', 'All responsible']]",
  "[['cl', 'Client punch'], ['int', 'RHI internal punch'], ['all', 'All']]"),
 ("setHead('Punch list', `CCR · master punch list ${PJ.date}`);",
  "setHead('Punch list', VS.PS.who === 'int' ? 'CCR · RHI internal punch' : `CCR · master punch list ${PJ.date}`);"),
 ("const APPV = '3.10';", "const APPV = '3.11';"),
]
for a, b in rep:
    if s.count(a) != 1:
        raise SystemExit('text not found once: ' + a[:70])
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('app.js patched')
