// v4.63: "Progress – last 7 days" – what was reported day by day in this area.
//  - IWP daily report columns (week.json, from the IWP status file) -> quantity per activity and day (JB installation, tray, earthing …)
//  - cable tracker dates (already in the project data)              -> cables pulled / metres / terminated ends per day
//  - cable tray physical progress file (week.json)                  -> tray / conduit / fitting / cover metres per day
//  - punch lists (already in the project data)                      -> punches closed per day (client A / B / C, RHI internal)
// Nothing is estimated: a day without an entry in the source file stays empty.
(function () {
  const WK = window.WK = {off: 0, w: null, ready: false};
  const TITS = PRJ === 'CCR' ? ['G0-D1810BX0', 'G0-D1801FX0'] : PRJ === 'D48' ? ['G0-D4810BX0', 'G0-D4801FX0'] : PRJ === '8810' ? ['G0-D8810BX0', 'G0-D8801FX0'] : PRJ === '1801' ? ['G0-D1801FX0'] : /^G\d-/.test(PRJ) ? [PRJ] : [];
  const p2 = n => String(n).padStart(2, '0');
  const key = d => `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
  const norm = s => { const m = String(s || '').trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/); return m ? `${p2(m[1])}.${p2(m[2])}.${m[3].length === 2 ? '20' + m[3] : m[3]}` : ''; };
  const pd = s => { const m = norm(s).match(/^(\d\d)\.(\d\d)\.(\d{4})$/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const catN = c => String(c || '').replace('С', 'C').replace('А', 'A').replace('В', 'B').trim() || '-';
  const rnd = v => Math.round(v * 10) / 10;
  const isRhi = x => /^(RHI|РХИ)/i.test(String(x || ''));
  fetch('week.json?t=' + Date.now(), {cache: 'no-store'}).catch(() => fetch('week.json')).then(r => r && r.ok ? r.json() : null).catch(() => null)
    .then(j => { WK.w = j; WK.ready = true; try { if (/^#\/wk/.test(location.hash)) route(); } catch (e) {} });

  WK.days = function () { const end = pd(D.meta.date) || new Date(); end.setDate(end.getDate() - 7 * WK.off); const L = []; for (let i = 6; i >= 0; i--) { const d = new Date(end); d.setDate(end.getDate() - i); L.push(d); } return L; };

  // ---------- build the rows: {sec, label, unit, v: {day: value}, det: [[day, tag, qty, unit, extra]]} ----------
  WK.rows = function () { const days = WK.days().map(key), inW = {}; days.forEach(d => inW[d] = 1); const R = [];
    const row = (sec, label, unit, hint) => { const r = {sec, label, unit, hint: hint || '', v: {}, det: []}; R.push(r); return r; };
    const add = (r, day, val, tag, extra) => { r.v[day] = (r.v[day] || 0) + val; r.det.push([day, tag, val, r.unit, extra || '']); };
    // 1. IWP daily report
    const W = WK.w && WK.w.iwp;
    if (W) { const G = {};
      I.forEach(x => { const L = W[x.acc]; if (!L) return; L.forEach(e => { if (!inW[e[0]]) return; const k = x.g + '|' + (x.u || ''); const r = G[k] = G[k] || row('IWP daily report (quantity reported to the client)', x.g, x.u || ''); add(r, e[0], e[1], (x.tag && !/^no[ _-]?tag/i.test(x.tag) ? x.tag : (x.desc || x.tag || ('access ID ' + x.acc))), 'access ID ' + x.acc + (x.sy ? ' · ' + x.sy : '')); }); }); }
    // 2. cable tracker
    const cp = row('Cable tracker (pull / termination dates)', 'Cable pulling – cables', 'cables'), cm = row('Cable tracker (pull / termination dates)', 'Cable pulling – metres', 'm'), ct = row('Cable tracker (pull / termination dates)', 'Cable termination – cable ends', 'ends');
    C.forEach(c => { if (typeof dead === 'function' && dead(c)) return; const d = norm(c.pd);
      if (d && inW[d] && String(c.tp || '') === 'Completed') { const m = Number(c.lf) || Number(String(c.ln).replace(',', '.')) || 0; add(cp, d, 1, c.t, (c.dr ? 'drum ' + c.dr : '')); add(cm, d, m, c.t, (c.dr ? 'drum ' + c.dr : '')); }
      const a = norm(c.tf), b = norm(c.tto); if (a && inW[a]) add(ct, a, 1, c.t, 'FROM side'); if (b && inW[b]) add(ct, b, 1, c.t, 'TO side'); });
    // 3. cable tray physical progress file
    const T2 = WK.w && WK.w.tray; if (T2) { const M = {}; TITS.forEach(t => { const e = T2[t]; if (!e) return; Object.keys(e.days).forEach(d => { if (!inW[d]) return; Object.keys(e.days[d]).forEach(m => { const r = M[m] = M[m] || row('Cable tray progress file (work completion date)', m, 'm'); add(r, d, e.days[d][m], t, ''); }); }); }); }
    // 4. punches closed
    const PS = 'Punch closed (closing date in the punch list)'; const pr = {A: row(PS, 'Client punch – category A', 'pcs'), B: row(PS, 'Client punch – category B', 'pcs'), C: row(PS, 'Client punch – category C', 'pcs'), R: row(PS, 'RHI internal punch', 'pcs')};
    PU.forEach(p => { if (p.st !== 'Closed') return; const d = norm(p.cdate); if (!d || !inW[d]) return; const r = p.int ? pr.R : pr[catN(p.cat)]; if (!r) return; add(r, d, 1, p.no, [p.tage || p.tagd || p.tag || '', (p.den || p.dru || '').slice(0, 90)].filter(Boolean).join(' · ')); });
    R.forEach(r => { r.tot = rnd(days.reduce((s, d) => s + (r.v[d] || 0), 0)); days.forEach(d => { if (r.v[d]) r.v[d] = rnd(r.v[d]); }); });
    return {days, rows: R.filter(r => r.tot || /^Cable (pulling|termination)|punch/i.test(r.label))}; };

  const num = v => v ? (Math.abs(v) >= 1000 ? fmtn(Math.round(v)) : String(v)) : '';
  WK.tile = function () { return `<button class="tile main" style="min-height:auto;width:100%;margin-bottom:6px;background:#0b5c7a;border-color:#0b5c7a;color:#fff" onclick="go('#/wk')"><b>📅 PROGRESS – LAST 7 DAYS</b><span class="n" style="color:#d9eef6">day by day: cable m, tray m, JB installation, punch closed</span></button>`; };
  WK.shift = function (n) { WK.off = Math.max(0, WK.off + n); WK.sel = null; WK.view(); };
  WK.view = function () { const dd = WK.days(), R = WK.rows(), w = WK.w || {}; WK._r = R;
    setHead('Progress – last 7 days', `${PRJ} · ${key(dd[0])} – ${key(dd[6])}`);
    const wd = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const hd = `<tr><th style="text-align:left">Activity</th>${dd.map(d => `<th>${wd[d.getDay()]}<br>${p2(d.getDate())}.${p2(d.getMonth() + 1)}</th>`).join('')}<th>Total</th></tr>`;
    const secs = []; R.rows.forEach((r, i) => { let s = secs.find(x => x.n === r.sec); if (!s) secs.push(s = {n: r.sec, L: []}); s.L.push([r, i]); });
    const css = `<style>.wkt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11.5px}.wkt th,.wkt td{border:1px solid var(--line);padding:3px 1px;text-align:center;overflow:hidden}.wkt th{background:#eef3f8;font-weight:600;font-size:10.5px}.wkt td:first-child,.wkt th:first-child{width:31%;text-align:left;padding-left:4px;word-break:break-word}.wkt td:last-child{font-weight:700;background:#f4f7fa}.wkt tr.on td{background:#fff6d6}.wkt td.z{color:#c3c9d1}.wkt td.h{background:#dff3e3;font-weight:600}</style>`;
    main.innerHTML = css + `<div class="chips"><button class="chip" onclick="WK.shift(1)">‹ 7 days earlier</button>${WK.off ? `<button class="chip" onclick="WK.shift(-1)">7 days later ›</button><button class="chip" onclick="WK.off=0;WK.sel=null;WK.view()">Latest</button>` : ''}<button class="chip on" onclick="WK.excel()">📊 Excel</button></div>
     ${!WK.ready ? '<div class="foot">Loading the daily report data…</div>' : ''}
     ${secs.map(s => `<div class="card" style="padding:8px"><div class="h3" style="font-size:13px">${esc(s.n)}</div><table class="wkt">${hd}${s.L.map(([r, i]) => `<tr class="${WK.sel === i ? 'on' : ''}" onclick="WK.pick(${i})" style="cursor:pointer"><td><b>${esc(r.label)}</b>${r.unit ? ` <span style="color:var(--mut)">${esc(r.unit)}</span>` : ''}</td>${R.days.map(d => `<td class="${r.v[d] ? 'h' : 'z'}">${num(r.v[d]) || '·'}</td>`).join('')}<td>${num(r.tot) || '0'}</td></tr>`).join('')}</table></div>`).join('')}
     <div id="wkdet"></div>
     ${WK.punchAll()}
     <div class="foot">Tap a line to see the tags of each day. Sources: IWP daily columns${w.iwpsrc ? ` (${esc(w.iwpsrc)}, last entry ${esc(w.iwpto || '–')})` : ' – not loaded'} · cable tracker and punch lists of ${esc(D.meta.date)} · tray file${w.traysrc ? ` ${esc(w.traysrc)}` : ' – not loaded'}. A day stays empty when nothing is entered for it in the source file – it is not an estimate. The IWP section and the tracker / tray sections come from different files, so the same work can appear in both.</div>`;
    if (WK.sel != null) WK.det(); };
  // punch closed – every date (newest first), not only the 7-day window
  WK.punchAll = function () { const by = {}; PU.forEach(p => { if (p.st !== 'Closed') return; const d = norm(p.cdate); if (!d) return; const e = by[d] = by[d] || {A: 0, B: 0, C: 0, R: 0, o: 0}; if (p.int) e.R++; else { const c = catN(p.cat); if (e[c] != null && c !== 'R') e[c]++; else e.o++; } });
    const L = Object.keys(by).sort((a, b) => pd(b) - pd(a)); if (!L.length) return ''; const n = WK.pall ? L.length : 14; WK._pall = [L, by];
    return `<div class="card" style="padding:8px"><div class="h3" style="font-size:13px">Punch closed – date wise (all dates, newest first)</div><table class="wkt"><tr><th style="text-align:left">Closing date</th><th>A</th><th>B</th><th>C</th><th>RHI int.</th><th>Total</th></tr>${L.slice(0, n).map(d => { const e = by[d], t = e.A + e.B + e.C + e.R + e.o; return `<tr><td><b>${d}</b></td><td class="${e.A ? 'h' : 'z'}">${e.A || '·'}</td><td class="${e.B ? 'h' : 'z'}">${e.B || '·'}</td><td class="${e.C ? 'h' : 'z'}">${e.C || '·'}</td><td class="${e.R ? 'h' : 'z'}">${e.R || '·'}</td><td>${t}</td></tr>`; }).join('')}</table>${L.length > n ? `<button class="chip" style="margin-top:6px" onclick="WK.pall=1;WK.view()">Show all ${L.length} dates</button>` : ''}</div>`; };
  WK.pick = function (i) { WK.sel = WK.sel === i ? null : i; WK.view(); if (WK.sel != null) { const e = document.getElementById('wkdet'); if (e) e.scrollIntoView({behavior: 'smooth', block: 'start'}); } };
  WK.det = function () { const R = WK._r, r = R.rows[WK.sel], e = document.getElementById('wkdet'); if (!r || !e) return;
    const by = {}; r.det.forEach(x => (by[x[0]] = by[x[0]] || []).push(x));
    e.innerHTML = `<div class="card"><div class="h3">${esc(r.label)} – details</div>${R.days.filter(d => by[d]).map(d => `<div class="note" style="background:#eef3f8;margin-top:6px"><b>${d}</b> · ${num(r.v[d])} ${esc(r.unit)} · ${by[d].length} line${by[d].length > 1 ? 's' : ''}</div>${by[d].slice(0, 300).map(x => `<div style="display:flex;gap:8px;justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 2px;font-size:12.5px"><span style="min-width:0;word-break:break-word"><b>${esc(x[1])}</b>${x[4] ? `<br><span style="color:var(--mut)">${esc(x[4])}</span>` : ''}</span><span style="white-space:nowrap">${num(rnd(x[2]))} ${esc(x[3])}</span></div>`).join('')}${by[d].length > 300 ? `<div class="foot">+ ${by[d].length - 300} more – see the Excel</div>` : ''}`).join('') || '<div class="foot">Nothing entered in these 7 days.</div>'}</div>`; };
  WK.excel = function () { if (!window.XL) return toast('Excel module not loaded'); const R = WK._r || WK.rows(), dd = WK.days();
    const s1 = [['Progress – last 7 days – ' + PRJ + ' – ' + key(dd[0]) + ' … ' + key(dd[6])], ['Data: ' + D.meta.date + (WK.w ? ' · IWP ' + (WK.w.iwpsrc || '') + ' (last entry ' + (WK.w.iwpto || '-') + ') · tray ' + (WK.w.traysrc || '') : '')], [], ['Source', 'Activity', 'Unit'].concat(R.days).concat(['Total'])]
      .concat(R.rows.map(r => [r.sec, r.label, r.unit].concat(R.days.map(d => r.v[d] || '')).concat([r.tot])));
    const s2 = [['Date', 'Source', 'Activity', 'Tag / item', 'Quantity', 'Unit', 'Details']]; R.rows.forEach(r => r.det.slice().sort((a, b) => R.days.indexOf(a[0]) - R.days.indexOf(b[0])).forEach(x => s2.push([x[0], r.sec, r.label, x[1], rnd(x[2]), x[3], x[4]])));
    XL.save(`Progress_7_days_${PRJ}_${key(dd[6])}.xlsx`, [{name: 'Summary', rows: s1, widths: [44, 40, 8, 11, 11, 11, 11, 11, 11, 11, 10], bold: [0, 3], freeze: 4}, {name: 'Details', rows: s2, widths: [11, 40, 36, 44, 10, 8, 60], bold: [0], freeze: 1}].concat(WK._pall ? [{name: 'Punch closed by date', rows: [['Closing date', 'Client A', 'Client B', 'Client C', 'RHI internal', 'Other', 'Total']].concat(WK._pall[0].map(d => { const e = WK._pall[1][d]; return [d, e.A, e.B, e.C, e.R, e.o, e.A + e.B + e.C + e.R + e.o]; })), widths: [14, 10, 10, 10, 12, 8, 10], bold: [0], freeze: 1}] : [])); };
  WK.route = function () { WK.view(); };
  try { const h = location.hash; if (!h || h === '#/' || /^#\/wk/.test(h)) route(); } catch (e) {}
})();
