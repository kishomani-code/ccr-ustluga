// GPP Owner – reads one Excel file and keeps only what the owner tools need (runs in the background).
importScripts('xlsx.full.min.js');
const S = v => { if (v === null || v === undefined) return ''; let s = String(v).trim(); if (/^-?\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, ''); return s; };
const N = v => { const n = Number(v); return isFinite(n) ? n : 0; };
const pad = n => String(n).padStart(2, '0');
function D(v) { if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number' && v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`; }
  const s = S(v); const m = s.match(/^(\d{4})-(\d\d)-(\d\d)/); return m ? `${m[3]}.${m[2]}.${m[1]}` : s; }
const OPT = {type: 'array', dense: true, cellText: false, cellNF: false, cellHTML: false, cellFormula: false, cellStyles: false, cellDates: false};
function sheet(buf, names) { const probe = XLSX.read(buf, Object.assign({}, OPT, {bookSheets: true}));
  const name = probe.SheetNames.find(n => names.some(x => n.toLowerCase() === x.toLowerCase())) || probe.SheetNames.find(n => names.some(x => n.toLowerCase().includes(x.toLowerCase())));
  if (!name) throw new Error('Sheet not found: ' + names.join(' / ') + ' (sheets: ' + probe.SheetNames.join(', ') + ')');
  const wb = XLSX.read(buf, Object.assign({}, OPT, {sheets: name})); const ws = wb.Sheets[name]; const rows = ws['!data'] || ws;
  return {name, rows, v: (r, c) => { const x = rows[r] && rows[r][c]; return x ? x.v : null; }}; }

const P = {
  // IWP status: report columns of the user's sample (Mapping … Company) + progress columns
  iwp(buf, T) { const s = sheet(buf, ['EL_IWP_Status']); const out = []; const C = [1, 2, 3, 4, 5, 11, 12, 13, 14, 21, 22, 23, 34, 42, 43, 44, 45, 46];
    for (let r = 5; r < s.rows.length; r++) { const row = s.rows[r]; if (!row) continue; const t = row[2] && S(row[2].v); if (!T.has(t)) continue;
      out.push(C.map(c => { const x = row[c]; return x ? x.v : null; })); }
    return {rows: out, n: out.length}; },
  // cable tracker
  trk(buf, T) { const s = sheet(buf, ['Единый кабельный журнал']); const H = (s.rows[4] || []).map(c => c ? S(c.v) : '');
    let dr = -1; H.forEach((h, i) => { if (/распределение$/i.test(h)) dr = i; }); if (dr < 0) dr = 64;
    const out = [];
    for (let r = 5; r < s.rows.length; r++) { const row = s.rows[r]; if (!row) continue; const g = c => row[c] ? row[c].v : null;
      const tag = S(g(21)); if (!tag || !T.has(S(g(14))) || S(g(35))) continue;
      out.push([tag, S(g(14)), S(g(10)), S(g(4)), S(g(0)), S(g(30)) || S(g(29)), S(g(dr)), g(28), S(g(26)), S(g(27)), N(g(32)), N(g(47)), D(g(49)), S(g(50)), D(g(52)), D(g(53)), S(g(55)), S(g(75)), S(g(48))]); }
    return {rows: out, n: out.length, drum: H[dr] || ''}; },
  // Cable RAWP: client RFI per cable
  rawp(buf, T) { const s = sheet(buf, ['Cable_list']); const H = (s.rows[2] || []).map(c => c ? S(c.v) : ''); const it = H.indexOf('Project TAG');
    const L = it >= 0 ? {tag: it, li: 14, lr: 17, ls: 18, ld: 19, ti: 21, tr: 24, ts: 25, td: 26} : {tag: 8, li: 12, lr: 15, ls: 16, ld: 17, ti: 19, tr: 22, ts: 23, td: 24};
    const out = [];
    for (let r = 3; r < s.rows.length; r++) { const g = c => s.v(r, c); const tag = S(g(L.tag)); if (!tag || !T.has(S(g(1)))) continue;
      out.push([tag, S(g(1)), S(g(L.li)), S(g(L.lr)), S(g(L.ls)), D(g(L.ld)), S(g(L.ti)), S(g(L.tr)), S(g(L.ts)), D(g(L.td))]); }
    return {rows: out, n: out.length}; },
  // Master (client) punch list
  mpunch(buf, T) { const s = sheet(buf, ['Log of Mechanical Progress']); const out = [];
    for (let r = 1; r < s.rows.length; r++) { const g = c => s.v(r, c); const tit = S(g(1)); const t0 = tit.split(/\s+/)[0]; if (!T.has(t0) || !S(g(0)) || S(g(0)) === '#') continue;
      out.push([S(g(0)), t0, S(g(5)), S(g(9)), S(g(12)), S(g(13)), D(g(15)), S(g(23)), D(g(24)), S(g(18))]); }
    return {rows: out, n: out.length}; },
  // RHI internal punch register
  rpunch(buf, T) { const s = sheet(buf, ['Punch_List']); const out = [];
    for (let r = 1; r < s.rows.length; r++) { const g = c => s.v(r, c); const t = S(g(1)); if (!T.has(t) || !S(g(0))) continue;
      out.push([S(g(0)), t, S(g(2)), S(g(6)), S(g(9)), D(g(12)), S(g(13)), D(g(14)), S(g(4)), S(g(10)), S(g(7))]); }
    return {rows: out, n: out.length}; }
};
onmessage = e => { const {kind, buf, titles} = e.data; const t0 = Date.now();
  try { const res = P[kind](new Uint8Array(buf), new Set(titles)); res.sec = (Date.now() - t0) / 1000; postMessage({ok: true, res}); }
  catch (err) { postMessage({ok: false, err: String(err && err.message || err)}); } };
