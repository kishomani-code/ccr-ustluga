// v4.54: EXPORT PROJECT REPORT (PDF + Excel) and EXPORT MANAGER MEETING REPORT – A3 (one page, landscape).
// Everything is calculated from the data already in the app (IWP lines, cable tracker, punch lists, CTQ register).
// Nothing is invented: planned progress, weights and delays are not in the app data -> shown as N/A.
// Meeting notes are typed by the user and kept on the device (localStorage), per project.
(function () {
  const RP = window.RP = {};
  const NKEY = 'rep_notes_v1_' + PRJ;
  const P = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;
  const today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
  const PNAME = PRJ === 'CCR' ? 'CCR · G0-D1810BX0 / G0-D1801FX0' : PRJ === 'D48' ? 'D48 · G0-D4810BX0 / G0-D4801FX0' : PRJ === '8810' ? 'D88 · G0-D8810BX0 / G0-D8801FX0' : PRJ === '1801' ? '1801 · G0-D1801FX0' : PRJ === 'COLD' ? 'Cold cables (heat tracing)' : PRJ;
  const COMM = /commission|пнр|пусконалад|loop check/i;      // commissioning = client scope, never in installation progress
  const isDate = v => /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/.test(String(v || '').trim()) ? String(v).trim() : '';   // a handover target is used only when it is a real date
  const catN = c => String(c || '').replace('С', 'C').replace('А', 'A').replace('В', 'B').trim() || '-';

  // ---------- meeting notes (saved on the device) ----------
  RP.notes = function () { let n = {}; try { n = JSON.parse(localStorage.getItem(NKEY) || '{}') || {}; } catch (e) {} n.acts = Array.isArray(n.acts) ? n.acts : []; return n; };
  RP.saveNotes = function (n) { try { localStorage.setItem(NKEY, JSON.stringify(n)); } catch (e) { toast('Could not save notes on this device'); } };
  RP.setN = function (k, v) { const n = RP.notes(); n[k] = v; RP.saveNotes(n); };
  RP.setA = function (i, k, v) { const n = RP.notes(); if (!n.acts[i]) return; n.acts[i][k] = v; RP.saveNotes(n); };
  RP.addA = function () { const n = RP.notes(); n.acts.push({a: '', r: '', t: '', s: 'Open'}); RP.saveNotes(n); RP.home(); };
  RP.delA = function (i) { const n = RP.notes(); n.acts.splice(i, 1); RP.saveNotes(n); RP.home(); };

  // ---------- calculation ----------
  const cnt = L => { let c = 0, o = 0, p = 0; L.forEach(x => { if (x.done) c++; else if (Number(x.f) > 0) o++; else p++; }); return {n: L.length, c, o, p, pc: P(c, L.length)}; };
  RP.data = function () {
    if (RP._d && RP._dv === D.meta.ver) return RP._d;
    const comm = I.filter(x => COMM.test(x.g || '')), noq = I.filter(x => !COMM.test(x.g || '') && !(Number(x.q) > 0));
    const isRhi = x => /^(RHI|РХИ)/i.test(String(T.co[x.co] || ''));
    // v4.55: RHI scope only – lines of other companies and "Not assigned" lines are not in any figure of the reports
    const IT = I.filter(x => !COMM.test(x.g || '') && Number(x.q) > 0 && isRhi(x));          // each IWP line counted once
    const nonRhi = I.filter(x => !COMM.test(x.g || '') && Number(x.q) > 0 && !isRhi(x)).length;
    const all = cnt(IT), rhi = {n: nonRhi};
    const CL = C.filter(c => !dead(c) && /^(RHI|РХИ)/i.test(String(c.co || ''))); const cp = CL.filter(c => cst(c).p === true).length, ct = CL.filter(c => cst(c).t === true).length;
    // systems
    const G = {}; IT.forEach(x => { const k = x.sy || '-'; (G[k] = G[k] || []).push(x); });
    const opBySys = {}; const tagSys = {}; IT.forEach(x => { if (x.tag && !tagSys[x.tag]) tagSys[x.tag] = x.sy || '-'; });
    PU.forEach(p => { if (p.st !== 'Open') return; const s = tagSys[p.tag]; if (s) opBySys[s] = (opBySys[s] || 0) + 1; });
    const sys = Object.keys(G).sort().map(k => { const s = cnt(G[k]); const hold = CTQ.filter(t => ctqOpen(t) && new RegExp('\\b' + k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b').test((t.dwg || '') + ' ' + (t.sub || ''))).length;
      return Object.assign({k, nm: sysName(k) === k ? '' : sysName(k), punch: opBySys[k] || 0, ctq: hold, rem: [s.p ? s.p + ' not started' : '', opBySys[k] ? opBySys[k] + ' open punch' : '', hold ? hold + ' open CTQ' : ''].filter(Boolean).join(' · ') || (s.pc >= 100 ? 'Completed' : '')}, s); });
    const rc = c => /^(RHI|РХИ)/i.test(String(c.co || ''));
    // subsystems (client subsystem list – only where the app has it)
    let subs = []; const S = (window.MC && MC.d && MC.d.ss && MC.d.ss.length) ? MC.stats() : null;
    if (S) subs = S.map(x => { const it = x.it.filter(i => !COMM.test(i.g || '') && Number(i.q) > 0 && isRhi(i)), s = cnt(it), ho = window.HO && HO.by && HO.by[x.code];
      return Object.assign({k: x.code, sys: x.sys || '', nm: String((x.s && (x.s[1] || x.s[2])) || ''), cn: (x.cs || []).filter(rc).length, cp: (x.cs || []).filter(c => rc(c) && cst(c).p === true).length, ct: (x.cs || []).filter(c => rc(c) && cst(c).t === true).length, pA: x.pA, pB: x.pB, pR: x.pR, po: x.pO, tgt: isDate(ho && ho.mc),
        rem: [(x.cs || []).filter(rc).length ? `RHI cables ${(x.cs || []).filter(c => rc(c) && cst(c).p === true).length}/${(x.cs || []).filter(rc).length} pulled, ${(x.cs || []).filter(c => rc(c) && cst(c).t === true).length}/${(x.cs || []).filter(rc).length} terminated` : '', x.pO ? `open punch A ${x.pA} · B ${x.pB} · RHI ${x.pR}` : ''].filter(Boolean).join(' · ')}, s); }).filter(x => x.n || x.cn || x.po).sort((a, b) => a.k < b.k ? -1 : 1);
    // activities
    const A = {}; IT.forEach(x => { (A[x.g] = A[x.g] || []).push(x); });
    const acts = Object.keys(A).map(g => { const L = A[g], s = cnt(L); const us = [...new Set(L.map(x => x.u))]; const u = us.length === 1 ? us[0] : ''; let q = 0, f = 0; if (u) L.forEach(x => { q += Number(x.q) || 0; f += Math.min(Number(x.f) || 0, Number(x.q) || 0); });
      return Object.assign({g, u, q: Math.round(q * 10) / 10, f: Math.round(f * 10) / 10, qp: u && q ? P(f, q) : null}, s); }).sort((a, b) => (b.n - b.c) - (a.n - a.c));
    // punch
    const op = PU.filter(p => p.st === 'Open'), cl = PU.filter(p => p.st === 'Closed'), oth = PU.length - op.length - cl.length;
    const pc = {}; PU.forEach(p => { const k = (p.int ? 'RHI internal' : 'Client') + '|' + catN(p.cat); const e = pc[k] = pc[k] || {src: p.int ? 'RHI internal' : 'Client', cat: catN(p.cat), n: 0, o: 0, c: 0}; e.n++; if (p.st === 'Open') e.o++; else if (p.st === 'Closed') e.c++; });
    const pt = {}; PU.forEach(p => { const k = PT.tit[p.tit] || '-'; const e = pt[k] = pt[k] || {k, n: 0, o: 0, c: 0, a: 0}; e.n++; if (p.st === 'Open') { e.o++; if (!p.int && catN(p.cat) === 'A') e.a++; } else if (p.st === 'Closed') e.c++; });
    const pr = {}; op.forEach(p => { const k = PT.resp[p.resp] || '-'; pr[k] = (pr[k] || 0) + 1; });
    const subTgt = p => { const ho = window.HO && HO.by && HO.by[PT.sub[p.sub]]; return isDate(ho && ho.mc) || 'N/A'; };
    const crit = op.filter(p => !p.int && catN(p.cat) === 'A').sort((a, b) => (Number(b.delay) || 0) - (Number(a.delay) || 0)).map(p => ({no: p.no, tit: PT.tit[p.tit] || '', sub: PT.sub[p.sub] || '', tag: p.tage || p.tagd || p.tag || '', d: p.den || p.dru || '', id: p.idate || '', dl: Number(p.delay) || 0, resp: PT.resp[p.resp] || '', tgt: subTgt(p)}));
    const pun = {n: PU.length, o: op.length, c: cl.length, oth, cats: Object.values(pc).sort((a, b) => (a.src + a.cat < b.src + b.cat ? -1 : 1)), tits: Object.values(pt).sort((a, b) => b.o - a.o), resp: Object.entries(pr).sort((a, b) => b[1] - a[1]), crit,
      oA: op.filter(p => !p.int && catN(p.cat) === 'A').length, oB: op.filter(p => !p.int && catN(p.cat) === 'B').length, oC: op.filter(p => !p.int && catN(p.cat) === 'C').length, oR: op.filter(p => p.int).length};
    // CTQ (existing records only)
    const ctq = CTQ.map(t => { const o = ctqOpen(t); const m = String(t.rem || '').match(/Client answers[^:]*:\s*([\s\S]*?)(?:\nFinal resolution|$)/i); return {no: t.no, pri: t.pri, d: t.sub, sys: ((t.dwg || '').match(/\)-([A-Z]{2}-[A-Z0-9]+)/) || [])[1] || '', dwg: [t.dwg, t.rev, t.sh].filter(Boolean).join(' · '), tags: t.tags, act: t.act, resp: t.resp, hold: t.hold, tqs: [t.rel, t.rels].filter(Boolean).join(' – '), st: t.st, dt: t.dt, open: o, ans: m ? m[1].trim() : '', rem: t.rem || ''}; });
    const cq = {n: ctq.length, o: ctq.filter(t => t.open).length, c: ctq.filter(t => !t.open).length, hold: ctq.filter(t => t.open && t.hold === 'Yes').length, wait: ctq.filter(t => t.open && (!t.ans || /no client answer|ответа[^.]{0,20}нет|нет ответа/i.test(t.ans.slice(0, 80)))).length};
    const W = {}; IT.forEach(x => { if (x.done) return; const k = (x.sy || '-') + '|' + x.g; const e = W[k] = W[k] || {sy: x.sy || '-', g: x.g, n: 0, o: 0, u: x.u, q: 0, mix: false}; e.n++; if (Number(x.f) > 0) e.o++; if (e.u !== x.u) e.mix = true; e.q += Math.max(0, (Number(x.q) || 0) - (Number(x.f) || 0)); });
    const work = Object.values(W).sort((x, y) => y.n - x.n);
    RP._dv = D.meta.ver;
    return RP._d = {all, rhi, comm: comm.length, noq: noq.length, cab: {n: CL.length, p: cp, t: ct}, sys, subs, acts, pun, ctq, cq, work};
  };

  // ---------- small html helpers ----------
  const stc = pc => pc >= 100 ? 'g' : pc > 0 ? 'y' : 'r';
  const stl = pc => pc >= 100 ? 'Completed' : pc > 0 ? 'Ongoing' : 'Not started';
  const bar = pc => `<div class="rpb"><i class="rp${stc(pc)}" style="width:${Math.max(0, Math.min(100, pc))}%"></i><b>${pc}%</b></div>`;
  const pill = (t, c) => `<span class="rpp rp${c}">${esc(t)}</span>`;
  const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const nl = s => esc(s || '').replace(/\n/g, '<br>');
  const CSS = `.rpdoc{background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rpdoc table{border-collapse:collapse;width:100%}.rpdoc th,.rpdoc td{border:1px solid #8a8f98;padding:2px 4px;vertical-align:top;text-align:left}.rpdoc th{background:#023362;color:#fff;font-weight:700}
.rpdoc td.n,.rpdoc th.n{text-align:right;white-space:nowrap}.rpb{position:relative;background:#e6e8ec;height:1.25em;min-width:60px;border-radius:2px;overflow:hidden}.rpb i{position:absolute;left:0;top:0;bottom:0}.rpb b{position:relative;display:block;text-align:center;font-size:.92em;line-height:1.25em}
.rpg{background:#8fd19e}.rpy{background:#ffd966}.rpr{background:#f4a29b}td.rpg{background:#d7f0dc}td.rpy{background:#fff2c2}td.rpr{background:#fbd9d5}
.rpp{display:inline-block;padding:0 5px;border-radius:8px;font-weight:700;font-size:.9em}.rph{background:#023362;color:#fff;padding:5px 8px;display:flex;justify-content:space-between;align-items:center;gap:10px}.rph b{font-size:1.25em}
.rpk{display:grid;gap:4px}.rpk div{border:1px solid #8a8f98;border-radius:3px;padding:3px 5px}.rpk b{display:block;font-size:1.55em;line-height:1.1}.rpk span{font-size:.9em;color:#333}
.rpt{font-weight:700;background:#dfe6ee;border:1px solid #8a8f98;padding:2px 5px;margin:4px 0 2px}.rpnote{font-size:.88em;color:#444}
#rpa3{width:404mm;height:279mm;font-size:8.4pt;line-height:1.18;display:grid;grid-template-rows:auto 1fr auto;gap:2mm;overflow:hidden;box-sizing:border-box}
#rpa3 .cols{display:grid;grid-template-columns:27fr 40fr 33fr;gap:3mm;min-height:0}#rpa3 .col{border:1.5px solid #023362;padding:1.5mm;overflow:hidden;min-width:0}
#rpa3 .ah{background:#023362;color:#fff;font-weight:700;font-size:10pt;padding:2px 6px;margin:-1.5mm -1.5mm 1.5mm}
#rpfull{font-size:8.5pt;line-height:1.25}#rpfull h2{font-size:12pt;margin:0 0 4px;background:#dfe6ee;padding:3px 6px;border-left:5px solid #023362}#rpfull section{margin-bottom:10px}
@media screen{.rpwrap{overflow:hidden;border:1px solid #c9ced6;background:#fff;margin-top:8px}#rpfull{padding:8px;overflow-x:auto}}
.rpfoot{font-size:7pt;color:#444;border-top:1px solid #8a8f98;padding-top:1px;margin-top:6px}
@media screen{#rpprint{display:none}}
@media print{html,body{background:#fff!important;margin:0!important;padding:0!important;height:auto!important;overflow:visible!important}body>*:not(#rpprint){display:none!important}#rpprint{display:block!important}.rpdoc{zoom:1!important}#rpfull{width:100%;padding:0}#rpfull section.pb{page-break-before:always}#rpfull tr{page-break-inside:avoid}#rpfull thead{display:table-header-group}}`;
  function css(page) { let e = document.getElementById('rpcss'); if (!e) { e = document.createElement('style'); e.id = 'rpcss'; document.head.appendChild(e); } e.textContent = CSS + `@page{size:${page};margin:8mm}`; }
  const donut = (pc, sz) => `<div style="width:${sz}mm;height:${sz}mm;border-radius:50%;background:conic-gradient(#2e9e4f 0 ${pc}%,#e6e8ec ${pc}% 100%);display:flex;align-items:center;justify-content:center;margin:auto"><div style="width:${sz * .68}mm;height:${sz * .68}mm;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column"><b style="font-size:16pt">${pc}%</b><span style="font-size:7pt">RHI IWP lines done</span></div></div>`;
  const head = (title, n) => `<div class="rph"><div><b>${esc(title)}</b><div>Ust-Luga Gas Processing Plant (GPP) · E&amp;I Department · Rencons (RHI) · ${esc(PNAME)}</div></div><div style="text-align:right">Report date: <b style="font-size:1em">${esc(n.date || today())}</b> · Rev. ${esc(n.rev || '0')}<br>Prepared by: ${esc(n.by || (typeof PS_ !== 'undefined' && PS_.name) || '')} · App data: ${esc(D.meta.date)}</div></div>`;
  const basis = d => `Scope: RHI lines and RHI cables only${d.rhi.n ? ` – ${d.rhi.n} IWP lines of other companies / not assigned are not included` : ''}. Progress basis: count of IWP lines (activity weights are not in the app data – N/A). Completed = IWP fact ≥ quantity · Ongoing = fact &gt; 0 · Pending = fact 0. Each IWP line is counted once.${d.noq ? ` ${d.noq} lines without quantity are not counted.` : ''}${d.comm ? ` ${d.comm} commissioning lines (client scope) are excluded.` : ' Commissioning is client scope and is not included.'} Punch closure and CTQ status are shown separately and are not part of the installation %. Planned progress / delay: N/A (no planned dates in the app data).`;

  // ---------- A3 manager meeting report ----------
  RP.a3html = function () { const d = RP.data(), n = RP.notes(), a = d.all;
    const kp = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
    const actRows = d.acts.slice(0, 14).map(x => `<tr><td>${esc(cut(x.g, 34))}</td><td class="n">${x.c}/${x.n}</td><td style="width:26%">${bar(x.pc)}</td></tr>`).join('');
    const sysL = d.sys.slice().sort((x, y) => (y.n - y.c) - (x.n - x.c));
    const subL = d.subs.filter(x => x.n).sort((x, y) => (y.n - y.c) - (x.n - x.c));   // all rows are rendered; RP.trim() removes rows from the end until the column fits the page
    const sum = L => L.reduce((s, x) => ({n: s.n + x.n, c: s.c + x.c, o: s.o + x.o, p: s.p + x.p}), {n: 0, c: 0, o: 0, p: 0});
    const row = (a1, a2, x, cls) => `<tr class="${cls || ''}" data-s="${x.n},${x.c},${x.o},${x.p}"><td>${a1}</td><td>${a2}</td><td class="n">${x.n}</td><td class="n rpg">${x.c}</td><td class="n rpy">${x.o}</td><td class="n rpr">${x.p}</td><td style="width:15%">${bar(P(x.c, x.n))}</td></tr>`;
    const wk = d.work.slice(0, 6);
    const critP = d.pun.crit.slice(0, 7), acts = n.acts.filter(x => x.a).slice(0, 8), opC = d.ctq.filter(t => t.open).sort((x, y) => (y.hold === 'Yes') - (x.hold === 'Yes')).slice(0, 7);
    const txt = (lbl, v) => `<div class="rpt">${lbl}</div><div style="min-height:7mm;padding:1px 3px">${v ? nl(cut(v, 420)) : '<span class="rpnote">–</span>'}</div>`;
    return `<div id="rpa3" class="rpdoc">${head('E&I MANAGER MEETING REPORT', n)}
<div class="cols">
 <div class="col"><div class="ah">AREA 1 – OVERALL PROJECT STATUS</div>
  <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:2mm;align-items:center">${donut(a.pc, 38)}<div class="rpk" style="grid-template-columns:1fr 1fr">${kp(d.sys.length, 'systems')}${kp(d.subs.length || 'N/A', 'subsystems')}${kp(a.n, 'RHI IWP activities (lines)')}${kp(a.c, 'completed')}${kp(a.o, 'ongoing')}${kp(a.p, 'pending')}</div></div>
  <table style="margin-top:2mm"><tr><th>Indicator</th><th class="n">Done / total</th><th>Actual %</th></tr>
   <tr><td>RHI IWP lines</td><td class="n">${a.c} / ${a.n}</td><td>${bar(a.pc)}</td></tr>
   <tr><td>Cable pulling (RHI cables)</td><td class="n">${d.cab.p} / ${d.cab.n}</td><td>${bar(P(d.cab.p, d.cab.n))}</td></tr><tr><td>Cable termination (both ends)</td><td class="n">${d.cab.t} / ${d.cab.n}</td><td>${bar(P(d.cab.t, d.cab.n))}</td></tr>
   <tr><td>Planned progress</td><td class="n" colspan="2">N/A – no planned dates in app data</td></tr><tr><td>Overall status</td><td colspan="2">${pill(a.pc >= 100 ? 'COMPLETED' : 'IN PROGRESS – ' + a.pc + '%', stc(a.pc))} · open punch ${d.pun.o} · open CTQ ${d.cq.o}</td></tr></table>
  <div class="rpt">Activity-wise progress (largest remaining first)</div><table><tr><th>Activity</th><th class="n">Done</th><th>%</th></tr>${actRows}</table>
  ${txt('Major achievements', n.ach)}${txt('Critical delays / management attention required', n.crit)}
 </div>
 <div class="col"><div class="ah">AREA 2 – SYSTEM / SUBSYSTEM PROGRESS</div>
  <table id="rpsys"><tr><th>System</th><th>Name</th><th class="n">Total</th><th class="n">Compl.</th><th class="n">Ongoing</th><th class="n">Pending</th><th>Progress %</th></tr>${sysL.map(x => row(`<b>${esc(x.k)}</b>`, esc(cut(x.nm, 40)), x, 'rs')).join('')}</table>
  <div class="rpt">Major ongoing activities / critical pending works (largest remaining first)</div><table><tr><th>System</th><th>Activity</th><th class="n">Not completed</th><th class="n">of which ongoing</th><th class="n">Remaining qty</th></tr>${wk.length ? wk.map(w => `<tr><td><b>${esc(w.sy)}</b></td><td>${esc(cut(w.g, 44))}</td><td class="n rpr">${w.n}</td><td class="n rpy">${w.o}</td><td class="n">${w.mix ? '–' : fmtn(Math.round(w.q * 10) / 10) + ' ' + esc(w.u || '')}</td></tr>`).join('') : '<tr><td colspan="5">No remaining RHI work in the IWP</td></tr>'}</table>
  ${d.subs.length ? `<div class="rpt">Subsystem progress (most remaining work first)</div><table id="rpsub"><tr><th>Subsystem</th><th>Description</th><th class="n">Total</th><th class="n">Compl.</th><th class="n">Ongoing</th><th class="n">Pending</th><th>Progress %</th></tr>${subL.map(x => row(`<b style="white-space:nowrap">${esc(x.k)}</b>`, esc(cut(x.nm, 44)), x, 'rs')).join('')}</table>` : '<div class="rpnote" style="margin-top:2mm">Subsystem-wise progress: N/A – the client subsystem list is not loaded for this project.</div>'}
  <div class="rpnote" style="margin-top:1mm">Green = completed · yellow = ongoing · red = pending (not started). Delayed activities: N/A (no planned dates).</div>
 </div>
 <div class="col"><div class="ah">AREA 3 – PUNCH / CTQ / MEETING NOTES</div>
  <div class="rpt" style="margin-top:0">1. Punch list summary (RHI E&amp;I)</div>
  <div class="rpk" style="grid-template-columns:repeat(6,1fr)">${kp(d.pun.n, 'total')}${kp(d.pun.o, 'open')}${kp(d.pun.c, 'closed')}${kp(d.pun.oA, 'open A (client)')}${kp(d.pun.oB + d.pun.oC, 'open B + C')}${kp(d.pun.oR, 'open RHI int.')}</div>
  <table style="margin-top:1mm"><tr><th>Critical open punch (client cat. A, oldest)</th><th>Tag</th><th class="n">Days</th><th>Resp.</th><th>Target</th></tr>${critP.length ? critP.map(p => `<tr><td>${esc(p.no)} · ${esc(cut(p.d, 46))}</td><td>${esc(cut(p.tag, 22))}</td><td class="n">${p.dl || ''}</td><td>${esc(cut(p.resp, 10))}</td><td>${esc(p.tgt)}</td></tr>`).join('') : '<tr><td colspan="5">No open client category A punch</td></tr>'}</table>
  <div class="rpt">2. CTQ summary</div>
  <div class="rpk" style="grid-template-columns:repeat(5,1fr)">${kp(d.cq.n, 'total CTQ')}${kp(d.cq.o, 'open')}${kp(d.cq.c, 'closed')}${kp(d.cq.wait, 'no client answer yet')}${kp(d.cq.hold, 'hold points')}</div>
  <table style="margin-top:1mm"><tr><th>Open CTQ</th><th>Issue</th><th>Hold</th></tr>${opC.length ? opC.map(t => `<tr><td><b>${esc(t.no)}</b></td><td>${esc(cut(t.d, 78))}</td><td class="${t.hold === 'Yes' ? 'rpr' : ''}">${esc(t.hold || '')}</td></tr>`).join('') : '<tr><td colspan="3">No open CTQ</td></tr>'}</table>
  <div class="rpt">3. Manager meeting notes · meeting date ${esc(n.date || '')}</div>
  <table><tr><td style="width:50%"><b>Discussion points</b><br>${nl(cut(n.disc, 260)) || '–'}</td><td><b>Major technical issues</b><br>${nl(cut(n.issues, 260)) || '–'}</td></tr><tr><td><b>Decisions taken</b><br>${nl(cut(n.dec, 260)) || '–'}</td><td><b>Client comments</b><br>${nl(cut(n.cli, 260)) || '–'}</td></tr></table>
  <table style="margin-top:1mm"><tr><th>Action item</th><th>Responsible</th><th>Target</th><th>Status</th></tr>${acts.length ? acts.map(x => `<tr><td>${esc(cut(x.a, 70))}</td><td>${esc(cut(x.r, 16))}</td><td>${esc(x.t)}</td><td class="${/clos|done/i.test(x.s) ? 'rpg' : /progress|ongoing/i.test(x.s) ? 'rpy' : 'rpr'}">${esc(x.s)}</td></tr>`).join('') : '<tr><td colspan="4">No action items entered</td></tr>'}</table>
 </div>
</div>
<div class="rpnote">${basis(d)}</div></div>`; };

  // ---------- detailed project report ----------
  RP.fullhtml = function () { const d = RP.data(), n = RP.notes(), a = d.all;
    const c3 = x => `<td class="n">${x.n}</td><td class="n rpg">${x.c}</td><td class="n rpy">${x.o}</td><td class="n rpr">${x.p}</td><td style="min-width:70px">${bar(x.pc)}</td>`;
    return `<div id="rpfull" class="rpdoc">${head('E&I PROJECT PROGRESS REPORT', n)}
<section><h2>A. Overall project progress</h2><table><tr><th>Indicator</th><th class="n">Total</th><th class="n">Completed</th><th class="n">Ongoing</th><th class="n">Pending</th><th>Actual %</th><th>Status</th></tr>
 <tr><td>RHI IWP lines (count based)</td>${c3(a)}<td class="rp${stc(a.pc)}">${stl(a.pc)}</td></tr>
 <tr><td>Cable pulling (RHI cables, tracker)</td><td class="n">${d.cab.n}</td><td class="n rpg">${d.cab.p}</td><td class="n">–</td><td class="n rpr">${d.cab.n - d.cab.p}</td><td>${bar(P(d.cab.p, d.cab.n))}</td><td></td></tr>
 <tr><td>Cable termination (both ends)</td><td class="n">${d.cab.n}</td><td class="n rpg">${d.cab.t}</td><td class="n">–</td><td class="n rpr">${d.cab.n - d.cab.t}</td><td>${bar(P(d.cab.t, d.cab.n))}</td><td></td></tr>
 <tr><td>Planned progress</td><td colspan="6">N/A – planned dates / weights are not in the app data</td></tr><tr><td>Delayed activities</td><td colspan="6">N/A – no planned dates to compare with</td></tr></table><div class="rpnote" style="margin-top:3px">${basis(d)}</div></section>
<section><h2>B. System-wise progress (${d.sys.length} systems)</h2><table><thead><tr><th>System</th><th>Name</th><th class="n">Total</th><th class="n">Completed</th><th class="n">Ongoing</th><th class="n">Pending</th><th>%</th><th>Remarks</th></tr></thead><tbody>${d.sys.map(x => `<tr><td><b>${esc(x.k)}</b></td><td>${esc(x.nm)}</td>${c3(x)}<td>${esc(x.rem)}</td></tr>`).join('')}</tbody></table></section>
<section class="pb"><h2>C. Subsystem-wise progress (${d.subs.length || 'N/A'})</h2>${d.subs.length ? `<table><thead><tr><th>Subsystem</th><th>Description</th><th>System</th><th class="n">Total</th><th class="n">Completed</th><th class="n">Ongoing</th><th class="n">Pending</th><th>%</th><th>Handover target</th><th>Remarks</th></tr></thead><tbody>${d.subs.map(x => `<tr><td><b>${esc(x.k)}</b></td><td>${esc(x.nm)}</td><td>${esc(x.sys)}</td>${c3(x)}<td>${esc(x.tgt || 'N/A')}</td><td>${esc(x.rem)}</td></tr>`).join('')}</tbody></table>` : '<div>N/A – the client subsystem list is not loaded for this project.</div>'}</section>
<section class="pb"><h2>D. Activity-wise progress</h2><table><thead><tr><th>Activity (IWP group)</th><th class="n">Total lines</th><th class="n">Completed</th><th class="n">Ongoing</th><th class="n">Pending</th><th>Lines %</th><th class="n">Qty done / total</th><th>Unit</th><th class="n">Qty %</th><th>Status</th></tr></thead><tbody>${d.acts.map(x => `<tr><td><b>${esc(x.g)}</b></td>${c3(x)}<td class="n">${x.u ? fmtn(x.f) + ' / ' + fmtn(x.q) : 'mixed units'}</td><td>${esc(x.u || '')}</td><td class="n">${x.qp == null ? 'N/A' : x.qp + '%'}</td><td class="rp${stc(x.pc)}">${stl(x.pc)}</td></tr>`).join('')}</tbody></table></section>
<section class="pb"><h2>E. Punch list summary (RHI E&amp;I punches – not part of installation %)</h2>
 <table><tr><th>Source</th><th>Category</th><th class="n">Total</th><th class="n">Open</th><th class="n">Closed</th><th>Closed %</th></tr>${d.pun.cats.map(x => `<tr><td>${esc(x.src)}</td><td>${esc(x.cat)}</td><td class="n">${x.n}</td><td class="n ${x.o ? 'rpr' : ''}">${x.o}</td><td class="n rpg">${x.c}</td><td>${bar(P(x.c, x.n))}</td></tr>`).join('')}<tr><td colspan="2"><b>Total</b></td><td class="n"><b>${d.pun.n}</b></td><td class="n"><b>${d.pun.o}</b></td><td class="n"><b>${d.pun.c}</b></td><td>${bar(P(d.pun.c, d.pun.n))}</td></tr></table>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px"><table><tr><th>Area (title)</th><th class="n">Total</th><th class="n">Open</th><th class="n">Open A (client)</th><th class="n">Closed</th></tr>${d.pun.tits.map(x => `<tr><td>${esc(x.k)}</td><td class="n">${x.n}</td><td class="n">${x.o}</td><td class="n ${x.a ? 'rpr' : ''}">${x.a}</td><td class="n">${x.c}</td></tr>`).join('')}</table>
 <table><tr><th>Responsible party (open punches)</th><th class="n">Open</th></tr>${d.pun.resp.map(x => `<tr><td>${esc(x[0])}</td><td class="n">${x[1]}</td></tr>`).join('')}</table></div>
 <div class="rpt">Critical outstanding punch – client category A, oldest first (${Math.min(40, d.pun.crit.length)} of ${d.pun.crit.length}; full list in the Excel report)</div>
 <table><thead><tr><th>Punch</th><th>Area</th><th>Subsystem</th><th>Tag</th><th>Description</th><th>Issued</th><th class="n">Days open</th><th>Responsible</th><th>Target closure</th></tr></thead><tbody>${d.pun.crit.slice(0, 40).map(p => `<tr><td>${esc(p.no)}</td><td>${esc(p.tit)}</td><td>${esc(p.sub)}</td><td>${esc(cut(p.tag, 60))}</td><td>${esc(cut(p.d, 160))}</td><td>${esc(p.id)}</td><td class="n">${p.dl || ''}</td><td>${esc(p.resp)}</td><td>${esc(p.tgt)}</td></tr>`).join('')}</tbody></table>
 <div class="rpnote">Target closure = client handover target date of the subsystem where the app has it; otherwise N/A.</div></section>
<section class="pb"><h2>F. CTQ summary – ${d.cq.n} records · ${d.cq.o} open · ${d.cq.c} closed (not part of installation %)</h2><table><thead><tr><th>CTQ</th><th>Technical query</th><th>System</th><th>Drawing reference</th><th>Client response</th><th>Evidence / related TQS</th><th>Hold</th><th>Status</th></tr></thead><tbody>${d.ctq.map(t => `<tr><td><b>${esc(t.no)}</b></td><td>${esc(t.d)}</td><td>${esc(t.sys)}</td><td>${esc(t.dwg)}</td><td>${nl(cut(t.ans, 420)) || '<span class="rpnote">no answer recorded</span>'}</td><td>${esc(t.tqs)}</td><td class="${t.open && t.hold === 'Yes' ? 'rpr' : ''}">${esc(t.hold || '')}</td><td class="${t.open ? (t.hold === 'Yes' ? 'rpr' : 'rpy') : 'rpg'}">${esc(t.open ? (t.st || 'Open') : 'Closed')}${t.dt ? '<br>' + esc(t.dt) : ''}</td></tr>`).join('')}</tbody></table></section>
<div class="rpfoot">Rencons (RHI) · Ust-Luga GPP · E&amp;I · ${esc(PNAME)} · Project progress report · generated ${today()} · Rev. ${esc(n.rev || '0')} · app data ${esc(D.meta.date)} (${esc(D.meta.src || '')})</div></div>`; };

  // ---------- Excel ----------
  RP.excel = function () { if (!window.XL) return toast('Excel module not loaded'); const d = RP.data(), n = RP.notes(), a = d.all;
    const _f = 0; const fills = (rows, col, from) => { const f = {}; rows.forEach((r, i) => { if (i < from) return; const v = r[col]; if (typeof v === 'number') f[i + ',' + col] = stc(v); }); return f; };
    const hdr = [['E&I PROJECT PROGRESS REPORT – ' + PNAME], ['Ust-Luga GPP · Rencons (RHI) · report date ' + (n.date || today()) + ' · Rev. ' + (n.rev || '0') + ' · prepared by ' + (n.by || '') + ' · app data ' + D.meta.date], []];
    const o = hdr.concat([['Indicator', 'Total', 'Completed', 'Ongoing', 'Pending', 'Actual %', 'Status'],
      ['RHI IWP lines (count based)', a.n, a.c, a.o, a.p, a.pc, stl(a.pc)],
      ['Cable pulling (RHI cables, tracker)', d.cab.n, d.cab.p, '', d.cab.n - d.cab.p, P(d.cab.p, d.cab.n), ''], ['Cable termination (both ends)', d.cab.n, d.cab.t, '', d.cab.n - d.cab.t, P(d.cab.t, d.cab.n), ''],
      ['Planned progress', 'N/A', '', '', '', '', 'planned dates / weights are not in the app data'], ['Delayed activities', 'N/A', '', '', '', '', 'no planned dates to compare with'], [],
      ['Punch (RHI E&I) – total / open / closed', d.pun.n, d.pun.c, '', d.pun.o, P(d.pun.c, d.pun.n), 'not part of installation %'], ['CTQ – total / closed / open', d.cq.n, d.cq.c, '', d.cq.o, P(d.cq.c, d.cq.n), 'not part of installation %'], [],
      [basis(d).replace(/&gt;/g, '>').replace(/&amp;/g, '&')]]);
    const sy = [['System', 'Name', 'Total activities', 'Completed', 'Ongoing', 'Pending', 'Completion %', 'Remarks']].concat(d.sys.map(x => [x.k, x.nm, x.n, x.c, x.o, x.p, x.pc, x.rem]));
    const sb = [['Subsystem', 'Description', 'System', 'Total activities', 'Completed', 'Ongoing', 'Pending', 'Completion %', 'Cables', 'Pulled', 'Terminated', 'Open punch A', 'Open punch B', 'Open RHI punch', 'Handover target', 'Remarks']].concat(d.subs.length ? d.subs.map(x => [x.k, x.nm, x.sys, x.n, x.c, x.o, x.p, x.pc, x.cn, x.cp, x.ct, x.pA, x.pB, x.pR, x.tgt || 'N/A', x.rem]) : [['N/A – client subsystem list not loaded for this project']]);
    const ac = [['Activity (IWP group)', 'Total lines', 'Completed', 'Ongoing', 'Pending', 'Lines %', 'Qty done', 'Qty total', 'Unit', 'Qty %', 'Status']].concat(d.acts.map(x => [x.g, x.n, x.c, x.o, x.p, x.pc, x.u ? x.f : '', x.u ? x.q : '', x.u || 'mixed', x.qp == null ? 'N/A' : x.qp, stl(x.pc)]));
    const pu = [['Source', 'Category', 'Total', 'Open', 'Closed', 'Closed %']].concat(d.pun.cats.map(x => [x.src, x.cat, x.n, x.o, x.c, P(x.c, x.n)])).concat([['Total', '', d.pun.n, d.pun.o, d.pun.c, P(d.pun.c, d.pun.n)], [], ['Area (title)', 'Total', 'Open', 'Open A (client)', 'Closed']]).concat(d.pun.tits.map(x => [x.k, x.n, x.o, x.a, x.c])).concat([[], ['Responsible party (open punches)', 'Open']]).concat(d.pun.resp.map(x => [x[0], x[1]]));
    const cr = [['Punch', 'Area', 'Subsystem', 'Tag', 'Description', 'Issued', 'Days open', 'Responsible', 'Target closure']].concat(d.pun.crit.map(p => [p.no, p.tit, p.sub, p.tag, p.d, p.id, p.dl || '', p.resp, p.tgt]));
    const cq = [['CTQ', 'Priority', 'Technical query', 'System', 'Drawing reference', 'Tags', 'Requested action', 'Responsible', 'Client response', 'Evidence / related TQS', 'Hold', 'Status', 'Date', 'Open / closed']].concat(d.ctq.map(t => [t.no, t.pri, t.d, t.sys, t.dwg, t.tags, t.act, t.resp, t.ans, t.tqs, t.hold, t.st, t.dt, t.open ? 'Open' : 'Closed']));
    const cf = {}; d.ctq.forEach((t, i) => { cf[(i + 1) + ',13'] = t.open ? (t.hold === 'Yes' ? 'r' : 'y') : 'g'; });
    const mn = [['Manager meeting notes – ' + PNAME], ['Meeting date', n.date || ''], ['Prepared by', n.by || ''], ['Revision', n.rev || '0'], [], ['Major achievements', n.ach || ''], ['Critical delays / management attention', n.crit || ''], ['Discussion points', n.disc || ''], ['Major technical issues', n.issues || ''], ['Decisions taken', n.dec || ''], ['Client comments', n.cli || ''], [], ['Action item', 'Responsible', 'Target date', 'Status']].concat(n.acts.filter(x => x.a).map(x => [x.a, x.r, x.t, x.s]));
    XL.save(`EI_Project_Report_${PRJ}_${today()}.xlsx`, [
      {name: 'A Overall', rows: o, widths: [44, 12, 12, 12, 12, 12, 44], bold: [0, 3], fills: fills(o.slice(0, 7), 5, 4)},
      {name: 'B Systems', rows: sy, widths: [14, 46, 12, 12, 12, 12, 12, 50], bold: [0], freeze: 1, fills: fills(sy, 6, 1)},
      {name: 'C Subsystems', rows: sb, widths: [22, 50, 12, 10, 10, 10, 10, 10, 9, 9, 10, 9, 9, 9, 14, 50], bold: [0], freeze: 1, fills: fills(sb, 7, 1)},
      {name: 'D Activities', rows: ac, widths: [44, 11, 11, 11, 11, 10, 12, 12, 8, 9, 14], bold: [0], freeze: 1, fills: fills(ac, 5, 1)},
      {name: 'E Punch summary', rows: pu, widths: [36, 16, 10, 16, 10, 10], bold: [0, d.pun.cats.length + 3, d.pun.cats.length + d.pun.tits.length + 5]},
      {name: 'E Open punch cat A', rows: cr, widths: [10, 14, 22, 36, 70, 11, 10, 16, 14], bold: [0], freeze: 1},
      {name: 'F CTQ', rows: cq, widths: [10, 9, 60, 10, 40, 34, 46, 22, 60, 40, 7, 12, 11, 11], bold: [0], freeze: 1, fills: cf},
      {name: 'Meeting notes', rows: mn, widths: [44, 60, 16, 16], bold: [0, 12]}]); };

  // ---------- pages ----------
  function show(kind) { const a3 = kind === 'a3'; const ph = document.getElementById('rpprint'); if (ph) ph.innerHTML = ''; css(a3 ? 'A3 landscape' : 'A4 landscape');
    setHead(a3 ? 'Manager meeting report – A3' : 'Project report', `${PRJ} · data ${D.meta.date}`);
    main.innerHTML = `<div class="chips"><button class="chip" onclick="go('#/rp')">‹ Reports</button><button class="chip on" onclick="RP.print()">🖨 Print / Save as PDF${a3 ? ' (A3 landscape)' : ''}</button>${a3 ? '' : '<button class="chip" onclick="RP.excel()">📊 Excel</button>'}</div>
     <div class="foot" style="margin:4px 0">In the print window choose “Save as PDF”${a3 ? ', paper size A3, landscape' : ''}. Switch on “Background graphics” so the colours print.</div>
     <div class="rpwrap" id="rpw">${a3 ? RP.a3html() : RP.fullhtml()}</div>`;
    if (a3) { RP.trim(); fit(); } }
  // A3 area 2: drop rows from the end of the subsystem table (then the system table) until the column fits, and total them in one "+ N more" row
  RP.trim = function () { const e = document.getElementById('rpa3'); if (!e || e.dataset.trim) return; const col = e.querySelectorAll('.col')[1]; if (!col) return; const z = e.style.zoom; e.style.zoom = 1;
    const cutT = (id, lbl, min) => { const t = document.getElementById(id); if (!t) return; const acc = t._acc = t._acc || [0, 0, 0, 0]; let k = t._k || 0, more = t._more || null;
      const put = () => { if (!k) return; if (!more) { more = t._more = document.createElement('tr'); t.tBodies[0].appendChild(more); } more.innerHTML = `<td><i>+ ${k} more ${lbl}</i></td><td><i>see Project report</i></td><td class="n">${acc[0]}</td><td class="n rpg">${acc[1]}</td><td class="n rpy">${acc[2]}</td><td class="n rpr">${acc[3]}</td><td>${bar(P(acc[1], acc[0]))}</td>`; };
      while (col.scrollHeight > col.clientHeight + 1) { const rs = t.querySelectorAll('tr.rs'); if (rs.length <= min) break; const r = rs[rs.length - 1]; r.dataset.s.split(',').forEach((v, i) => acc[i] += Number(v)); r.remove(); k++; t._k = k; put(); } };
    if (document.getElementById('rpsub')) cutT('rpsys', 'systems', 14); cutT('rpsub', 'subsystems', 4); cutT('rpsys', 'systems', 6); e.dataset.trim = '1'; e.style.zoom = z; };
  function fit() { const w = document.getElementById('rpw'), e = document.getElementById('rpa3'); if (!w || !e) return; e.style.zoom = 1; const z = Math.min(1, (w.clientWidth - 2) / e.offsetWidth); e.style.zoom = z; }
  window.addEventListener('resize', () => { if (document.getElementById('rpa3')) fit(); });
  // the report is moved to a top-level holder while printing, so only the report is on the paper (also when the browser's own Print is used)
  RP.toPrint = function () { const e = document.querySelector('#rpw .rpdoc'); if (!e) return; let h = document.getElementById('rpprint'); if (!h) { h = document.createElement('div'); h.id = 'rpprint'; document.body.appendChild(h); } e.style.zoom = 1; h.appendChild(e); };
  RP.fromPrint = function () { const h = document.getElementById('rpprint'), w = document.getElementById('rpw'); if (!h || !h.firstChild) return; if (w) { w.appendChild(h.firstChild); fit(); } else h.innerHTML = ''; };
  window.addEventListener('beforeprint', RP.toPrint); window.addEventListener('afterprint', RP.fromPrint);
  RP.print = function () { RP.toPrint(); setTimeout(() => { window.print(); setTimeout(RP.fromPrint, 600); }, 80); };
  RP.tile = function () { return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px"><button class="tile main" style="min-height:auto;background:#1f5c2e;border-color:#1f5c2e;color:#fff" onclick="go('#/rp')"><b>📑 EXPORT PROJECT REPORT</b><span class="n" style="color:#e3f3e6">PDF · Excel · progress, punch, CTQ</span></button><button class="tile main" style="min-height:auto;background:#4b1d7a;border-color:#4b1d7a;color:#fff" onclick="go('#/rp/a3')"><b>🗂 EXPORT MANAGER MEETING REPORT – A3</b><span class="n" style="color:#ece1f7">one page · landscape · notes</span></button></div>`; };
  RP.home = function () { const n = RP.notes(), d = RP.data();
    setHead('Reports', `${PRJ} · project report · manager meeting report`);
    const ta = (k, l, ph) => `<label style="display:block;font-size:12px;font-weight:600;margin-top:8px">${l}</label><textarea class="fin" rows="3" style="width:100%;height:auto" placeholder="${ph || ''}" onchange="RP.setN('${k}',this.value)">${esc(n[k] || '')}</textarea>`;
    const inp = (k, l, w) => `<label style="font-size:12px;font-weight:600;flex:${w || 1};min-width:110px">${l}<input class="fin" style="width:100%" value="${esc(n[k] || '')}" onchange="RP.setN('${k}',this.value)"></label>`;
    main.innerHTML = `<div class="card"><div class="h3">📑 Project report</div><div style="font-size:13px;color:var(--mut)">Overall, system, subsystem and activity progress, punch summary and CTQ register – RHI scope: ${d.all.n} IWP lines · ${d.sys.length} systems · ${d.subs.length || 'N/A'} subsystems · ${d.pun.n} punches · ${d.cq.n} CTQ</div>
      <div class="chips" style="margin-top:8px"><button class="chip on" onclick="go('#/rp/full')">📄 PDF report</button><button class="chip on" onclick="RP.excel()">📊 Excel report</button></div></div>
     <div class="card"><div class="h3">🗂 Manager meeting report – A3 landscape</div><div style="font-size:13px;color:var(--mut)">One page, three areas: overall status · system / subsystem progress · punch, CTQ and meeting notes</div>
      <div class="chips" style="margin-top:8px"><button class="chip on" onclick="go('#/rp/a3')">📄 Open A3 report (PDF)</button></div></div>
     <div class="card"><div class="h3">📝 Manager meeting notes</div><div style="font-size:12px;color:var(--mut)">Saved on this device for ${esc(PRJ)} and printed on the A3 report and in the Excel report.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${inp('date', 'Meeting date')}${inp('by', 'Prepared by', 2)}${inp('rev', 'Report revision')}</div>
      ${ta('ach', 'Major achievements')}${ta('crit', 'Critical delays / management attention required')}${ta('disc', 'Discussion points')}${ta('issues', 'Major technical issues')}${ta('dec', 'Decisions taken')}${ta('cli', 'Client comments')}
      <div class="h3" style="margin-top:12px">Action items</div>
      ${n.acts.map((x, i) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;border:1px solid var(--line);border-radius:8px;padding:6px;margin-top:6px"><input class="fin" style="grid-column:1/3" placeholder="Action item" value="${esc(x.a)}" onchange="RP.setA(${i},'a',this.value)"><input class="fin" placeholder="Responsible person" value="${esc(x.r)}" onchange="RP.setA(${i},'r',this.value)"><input class="fin" placeholder="Target date" value="${esc(x.t)}" onchange="RP.setA(${i},'t',this.value)"><select class="fin" onchange="RP.setA(${i},'s',this.value)">${['Open', 'In progress', 'Closed'].map(s => `<option ${x.s === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="chip" onclick="RP.delA(${i})">Delete</button></div>`).join('')}
      <button class="chip on" style="margin-top:8px" onclick="RP.addA()">＋ Add action item</button></div>
     <div class="foot">${basis(d)}</div>`; };
  RP.route = function (rest) { const k = rest && rest[0]; if (k === 'a3') return show('a3'); if (k === 'full') return show('full'); RP.home(); };
  try { const h = location.hash; if (!h || h === '#/' || /^#\/(rp|mg)/.test(h)) route(); } catch (e) {}
})();
