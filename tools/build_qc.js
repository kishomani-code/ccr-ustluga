// v4.87 (21.11.2026): QC TEAM menu data – qc.json
// Built from the site data files already made by build_data.py (data.json, data_1801.json, data_d48.json, data_8810.json)
// and the RFI files (rfi_*.json). Run after the site data build:   node tools/build_qc.js
//  q     = client punches of the master punch list with "Responsible Department" = QC (all our areas)
//  close = RHI punch open, every client punch with the same tag AND the same punch is closed  -> RHI punch can be closed
//  ask   = RHI punch closed, the client punch with the same tag AND same punch is still open  -> ask the client to close
//  rep   = old client punch open, a later client punch with the same tag AND same text is closed -> report the old one
//  chk   = QC punch open, another QC punch on the same tag is closed (other text) -> check, may be the same work
//  rfi   = QC punch open, client RFI of the cable accepted (Cable RAWP) -> evidence, report with the RFI number
// Rules kept: same tag AND same punch only; inspection / document (FRI) punches are never matched by punch type.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const cut = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i); if (i < 0 || j < 0) throw new Error('app.js part not found: ' + a); return app.slice(i, j); };
// the same tag normaliser and punch-type rules as the app (taken from app.js so both always agree)
const H = new Function(cut('const LAT = {', '\nconst esc') + '\n' + cut("const NB = '(?:^|[^А-Яа-яЁё])'", '\nconst PTYX') + '\nreturn {N, ptypes};')();
const N = H.N, ptypes = H.ptypes;
const SITES = [['CCR', 'data.json', 'rfi_ccr.json'], ['1801', 'data_1801.json', 'rfi_1801.json'], ['D48', 'data_d48.json', 'rfi_d48.json'], ['8810', 'data_8810.json', 'rfi_8810.json']];
const rd = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch (e) { return null; } };
const cl = v => (v == null || v === 'None') ? '' : String(v);
const xN = v => cl(v).toLowerCase().replace(/ё/g, 'е').replace(/[^0-9a-zа-я]/g, '');
const xDs = p => p._xd || (p._xd = [xN(p.dru), xN(p.den)].filter(x => x.length > 3));
const xTy = p => ptypes(p).filter(x => x !== 'oth');
const xText = (p, q) => { const A = xDs(p), B = xDs(q); return A.some(x => B.some(y => x === y || (Math.min(x.length, y.length) >= 12 && (x.includes(y) || y.includes(x))))); };
const xSame = (p, q) => { if (xText(p, q)) return true; const T = xTy(q).filter(x => x !== 'doc'); return xTy(p).some(x => T.includes(x)); };
const dnum = s => { const m = /^(\d\d)\.(\d\d)\.(\d{4})/.exec(cl(s)); return m ? +(m[3] + m[2] + m[1]) : 0; };
const acc = s => /accepted/i.test(cl(s));
// QC punch kind (for the QC team menu)
const KIND = [['meas', /измерени|протокол|insulation resistance|measurement|металлосвяз|сопротивлени/i], ['refl', /рефлектограм|reflectogram|OTDR/i], ['fri', /инспекци|FRI|не предъявл|предъявля|входной контроль|inspection/i], ['doc', /документ|АОСР|ИД(?:[^А-Яа-я]|$)|паспорт|сертификат|document|certificate/i]];
const kind = p => { const s = cl(p.dru) + ' ' + cl(p.den); for (const [k, re] of KIND) if (re.test(s)) return k; return 'oth'; };

const ALL = [], seen = new Set(); let date = '', src = '';
SITES.forEach(([site, f, rf]) => { const d = rd(f); if (!d || !d.punch) { console.log('skip', f); return; }
  const P = d.punch, T = P.tabs, R = rd(rf) || {}; const cab = R.cab || {};
  if (site === 'CCR') { date = d.meta.date; src = d.meta.src; }
  const tx = (k, i) => cl((T[k] || [])[i]);
  P.rows.forEach(a => { const o = {}; P.K.forEach((k, j) => o[k] = a[j]); const key = cl(o.no); if (seen.has(key)) return; seen.add(key);
    const tit = tx('tit', o.tit), sys = tx('sys', o.sys);
    const p = {s: site, no: cl(o.no), tc: tit.split(/\s+/)[0], tn: tit.split(/\s+/).slice(1).join(' '), sy: sys.split(/\s+/)[0], syn: sys.split(/\s+/).slice(1).join(' '),
      sub: tx('sub', o.sub), subn: tx('subn', o.subn), subnE: tx('subnE', o.subn), pri: cl(o.pri), disc: tx('disc', o.disc), discE: tx('discE', o.disc), tag: cl(o.tag), tagd: cl(o.tagd), tage: cl(o.tage), sec: tx('sec', o.sec),
      dru: cl(o.dru), den: cl(o.den), stg: tx('stg', o.stg), idate: cl(o.idate), delay: o.delay === '' || o.delay == null ? '' : o.delay, cat: cl(o.cat), by: tx('by', o.by), org: tx('org', o.org), epc: tx('epc', o.epc), resp: tx('resp', o.resp),
      st: cl(o.st), cdate: cl(o.cdate), notes: cl(o.notes), reason: cl(o.reason), dept: tx('dept', o.dept), insp: cl(o.insp), act: cl(o.act), rem: cl(o.rem)};
    p.int = /^RHI-/.test(p.no); p._t = N(p.tag);
    p.ei = /Electrical|Control|Instrument|Электротех|АСУ|КИП/i.test(p.discE + ' ' + p.disc);
    const c = cab[p.tag]; if (c) p.rfi = [cl(c[2]), cl(c[3]), cl(c[4]), cl(c[8]), cl(c[9]), cl(c[10])];
    ALL.push(p); }); });

const QC = ALL.filter(p => !p.int && p.dept === 'QC'); QC.forEach(p => p.k = kind(p));
const G = {}; ALL.forEach(p => { if (!p._t) return; const g = G[p._t + '|' + p.tc] = G[p._t + '|' + p.tc] || {c: [], r: []}; (p.int ? g.r : g.c).push(p); });
const close = [], ask = [], rep = [], chk = [], rfi = [];
Object.values(G).forEach(g => { g.c.sort((a, b) => dnum(a.idate) - dnum(b.idate) || a.no.localeCompare(b.no, undefined, {numeric: true}));
  const ce = g.c.filter(p => p.ei || p.dept === 'QC');   // E&I disciplines (as in the app cross-punch) + every QC-department punch
  g.r.forEach(p => { const M = ce.filter(q => xSame(p, q)); if (!M.length) return;
    if (p.st !== 'Closed' && M.every(q => q.st === 'Closed')) close.push([p.no, M.map(q => q.no)]);
    else if (p.st === 'Closed') { const O = M.filter(q => q.st !== 'Closed'); if (O.length) ask.push([p.no, O.map(q => q.no)]); } });
  ce.forEach((p, i) => { if (p.st === 'Closed') return; const M = ce.slice(i + 1).filter(q => xText(p, q)); const last = M[M.length - 1];
    if (last && last.st === 'Closed') rep.push([p.no, [last.no]]);
    else if (p.dept === 'QC') { const O = ce.filter(q => q !== p && q.dept === 'QC' && q.st === 'Closed' && !xText(p, q)); if (O.length) chk.push([p.no, O.map(q => q.no)]); } }); });
QC.forEach(p => { if (p.st !== 'Closed' && p.rfi && (acc(p.rfi[1]) || acc(p.rfi[4]))) rfi.push([p.no, []]); });

const need = new Set(QC.map(p => p.no)); [close, ask, rep, chk, rfi].forEach(L => L.forEach(([a, B]) => { need.add(a); B.forEach(b => need.add(b)); }));
const K = ['s', 'no', 'tc', 'tn', 'sy', 'syn', 'sub', 'subn', 'subnE', 'pri', 'disc', 'discE', 'tag', 'tagd', 'tage', 'sec', 'dru', 'den', 'stg', 'idate', 'delay', 'cat', 'by', 'org', 'epc', 'resp', 'st', 'cdate', 'notes', 'reason', 'dept', 'insp', 'act', 'rem', 'k', 'rfi'];
// string tables keep the file small
const TABK = ['s', 'tc', 'tn', 'sy', 'syn', 'sub', 'subn', 'subnE', 'pri', 'disc', 'discE', 'tagd', 'tage', 'sec', 'dru', 'den', 'stg', 'idate', 'cat', 'by', 'org', 'epc', 'resp', 'st', 'cdate', 'reason', 'dept', 'insp', 'act', 'rem', 'k'];
const tabs = {}, idx = {}; TABK.forEach(k => { tabs[k] = []; idx[k] = new Map(); });
const ti = (k, v) => { v = v == null ? '' : v; let i = idx[k].get(v); if (i === undefined) { i = tabs[k].length; tabs[k].push(v); idx[k].set(v, i); } return i; };
const rows = ALL.filter(p => need.has(p.no)).map(p => K.map(k => TABK.includes(k) ? ti(k, p[k]) : (p[k] === undefined ? '' : p[k])));
const out = {ver: date + '-' + rows.length + '-' + close.length + '-' + rep.length, date, src, K, TABK, tabs, rows, x: {close, ask, rep, chk, rfi}};
fs.writeFileSync(path.join(ROOT, 'qc.json'), JSON.stringify(out));
console.log(`qc.json: ${date} · QC punches ${QC.length} (open ${QC.filter(p => p.st !== 'Closed').length}) · RHI to close ${close.length} · ask client ${ask.length} · old client punch to report ${rep.length} · QC check ${chk.length} · QC with RFI accepted ${rfi.length} · rows ${rows.length} · ${Math.round(JSON.stringify(out).length / 1024)} kB`);
