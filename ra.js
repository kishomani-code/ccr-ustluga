// v4.8: Owner menu "Client RFI accepted – check" (owner password only)
//  1) Report to IWP: client RFI (Cable RAWP) accepted for cable pulling / termination, but the IWP line is not 100 %
//     -> the remaining quantity can be reported in the IWP daily report (Excel in the IWP daily report format).
//  2) RHI RFI to Paul: client RFI accepted, but the RHI RFI (cable tracker "№ RFI") is still empty -> list for Paul.
// Data: rfi_<site>.json (cab = RAWP RFI per cable, trf = tracker RHI RFI per cable) + IWP lines of the site data.
(function () {
  const RA = window.RA = {};
  const fd = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
  const isPull = g => g === 'Cable pulling', isTerm = g => g === 'Cable termination';
  const inScope = t => !t || t === PRJN.b || t === PRJN.a;
  const rnd = v => Math.round(v * 100) / 100;

  RA.lists = function () { if (RA._L && RA._d === MC.d) return RA._L; const d = MC.d || {cab: {}, trf: {}, ss: []}; const trf = d.trf || {};
    const byTag = {}, ACC = {}; I.forEach(x => { ACC[x.acc] = ACC[x.acc] || x; if ((isPull(x.g) || isTerm(x.g)) && x.tag) (byTag[x.tag] = byTag[x.tag] || []).push(x); });
    const iwp = [], noi = [], rhi = [];
    Object.entries(d.cab).forEach(([tag, r]) => { const c = CBY[tag]; if (!c) return;
      const ss = r[0] >= 0 && d.ss[r[0]] ? d.ss[r[0]][0] : '';
      [['Cable pulling', 2, 3, 4, 1, isPull], ['Cable termination', 8, 9, 10, 7, isTerm]].forEach(([act, iN, iR, iD, iI, fn]) => {
        if (rfiSt(r[iR]) !== 'acc') return;
        const rf = {no: r[iN], res: r[iR], dt: r[iD], iwpn: r[iI]};
        let L = (byTag[tag] || []).filter(x => fn(x.g));
        const ac = act === 'Cable pulling' ? c.la : c.ta;
        if (!L.length && ac && ACC[ac] && fn(ACC[ac].g)) L = [ACC[ac]];
        if (!L.length && rf.iwpn && inScope(r[12]) && !(act === 'Cable termination' && rf.iwpn === r[1])) noi.push({c, act, rf, ss});   // RAWP names an IWP line, but it is not in our IWP
        L.forEach(x => { const rem = rnd((x.q || 0) - (x.f || 0)); if (rem > 0.001) iwp.push({c, x, act, rf, ss, q: rem}); });
        if (!trf[tag] && inScope(r[12])) rhi.push({c, act, rf, ss, title: r[12] || ''}); }); });
    RA._d = MC.d; return RA._L = {iwp, noi, rhi}; };

  RA.home = function () { if (!S2.owner) { go('#/'); return ownerLogin(); }
    if (!MC.d) { main.innerHTML = '<div class="empty">Loading RFI data… (first time needs internet)</div>'; MC.load(() => RA.home()); return; }
    VS.RA = VS.RA || {tab: 'i', q: '', a: '', lim: 150}; const v = VS.RA; const L = RA.lists();
    setHead('Client RFI accepted – check', `owner · RFI data ${MC.d.date || ''}`); qbox.value = '';
    const q = L.iwp.reduce((s, r) => s + r.q, 0);
    main.innerHTML = `<div style="background:#2b2f36;color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px"><div style="font-size:17px;font-weight:700">✅ Client RFI accepted – check</div><div style="font-size:12px;opacity:.85">If the client accepted the RFI, the work is finished: IWP must be 100 % and RHI RFI must be raised</div></div>
     ${rfiStrip([[L.iwp.length, 'IWP lines to report', `${fmtn(Math.round(q))} qty remaining in IWP`, L.iwp.length > 0], [L.noi.length, 'Accepted, no IWP line', 'ask Paul', L.noi.length > 0], [L.rhi.length, 'RHI RFI not raised', 'client accepted · tracker № RFI empty', L.rhi.length > 0]])}
     <div class="chips" style="margin-top:10px">${[['i', `📈 Report to IWP (${L.iwp.length + L.noi.length})`], ['r', `📋 RHI RFI to Paul (${L.rhi.length})`]].map(([k, l]) => `<button class="chip ${v.tab === k ? 'on' : ''}" onclick="VS.RA.tab='${k}';VS.RA.lim=150;RA.home()">${l}</button>`).join('')}</div>
     <div class="mgf"><input class="fin" placeholder="Search cable / RFI / subsystem…" value="${esc(v.q)}" oninput="VS.RA.q=this.value;VS.RA.lim=150;RA.list()"><select onchange="VS.RA.a=this.value;VS.RA.lim=150;RA.list()"><option value="">Pulling + termination</option><option value="Cable pulling" ${v.a === 'Cable pulling' ? 'selected' : ''}>Cable pulling</option><option value="Cable termination" ${v.a === 'Cable termination' ? 'selected' : ''}>Cable termination</option></select></div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0"><button class="tile main" style="min-height:auto" onclick="RA.excel()"><b>⬇ Export Excel</b></button><button class="tile" style="min-height:auto" onclick="RA.share()"><b>↗ Share to Paul</b></button></div>
     <div id="ral"></div>
     <div class="foot">Client RFI = Cable RAWP inspection progress (accepted incl. "with comments"). IWP = Site Progress fact of the IWP line (by cable tag). RHI RFI = cable tracker column "№ RFI". Excel for IWP is in your IWP daily report format – the remaining quantity is in the date column.</div>`;
    RA.list(); };

  RA.filt = function () { const v = VS.RA, nq = N(v.q), L = RA.lists();
    const ok = r => (!v.a || r.act === v.a) && (!nq || N([r.c.t, r.rf.no, r.ss, r.x ? r.x.acc : ''].join(' ')).includes(nq));
    return v.tab === 'r' ? {a: L.rhi.filter(ok), b: []} : {a: L.iwp.filter(ok), b: L.noi.filter(ok)}; };

  RA.list = function () { const v = VS.RA, F = RA.filt(), el = document.getElementById('ral'); if (!el) return;
    const rf = r => `${esc(r.rf.no)} · ${rfiB('acc', r.rf.res)} ${esc(r.rf.dt || '')}`;
    const row = r => `<button class="li" onclick="go('#/c/${enc(r.c.t)}')"><div class="m"><div class="t">${esc(r.c.t)}</div>
      <div class="s">${esc(r.act)}${r.x ? ` · Access ID ${esc(r.x.acc)} · IWP ${fmtn(r.x.f)}/${fmtn(r.x.q)} ${esc(r.x.u || '')} · <b>report ${fmtn(r.q)}</b>` : v.tab === 'r' ? ' · RHI RFI empty in tracker' : ' · no IWP line for this cable'}</div>
      <div class="s2">Client RFI ${rf(r)}${r.ss ? ' · ' + esc(r.ss) : ''}</div></div><span class="chev">›</span></button>`;
    const a = F.a.slice(0, v.lim);
    el.innerHTML = (F.a.length ? `<div class="list">${a.map(row).join('')}</div>${F.a.length > v.lim ? `<button class="more" onclick="VS.RA.lim+=300;RA.list()">Show more (${F.a.length - v.lim})</button>` : ''}` : `<div class="empty">${v.tab === 'r' ? 'All accepted cables have an RHI RFI' : 'IWP is complete for all accepted RFIs'}</div>`) +
      (F.b.length ? `<div class="sect">Client RFI accepted – no IWP line found (${F.b.length}) · ask Paul</div><div class="list">${F.b.slice(0, 200).map(row).join('')}</div>` : ''); };

  RA.excel = function () { if (!S2.owner) return ownerLogin(); if (!window.XL) return toast('Excel module not loaded'); const v = VS.RA, F = RA.filt(), dd = fd();
    if (v.tab === 'r') { if (!F.a.length) return toast('Nothing to export');
      const rows = [['RHI RFI to raise – client RFI accepted, RHI RFI (cable tracker № RFI) empty', '', '', '', '', '', '', '', '', dd], [],
        ['No.', 'Cable tag', 'Title', 'Subsystem', 'Activity', 'Client RFI No.', 'Client RFI result', 'Inspection date', 'IWP name (RAWP)', 'RHI RFI No.', 'Remark']]
        .concat(F.a.map((r, i) => [i + 1, r.c.t, r.title, r.ss, r.act, r.rf.no, r.rf.res, r.rf.dt || '', r.rf.iwpn || '', '', '']));
      XL.save(`RHI_RFI_to_Paul_${PRJ}_${dd}.xlsx`, [{name: 'RHI RFI', rows, widths: [5, 40, 13, 20, 16, 36, 22, 13, 34, 18, 20], bold: [0, 2], freeze: 3}]); return; }
    if (!F.a.length && !F.b.length) return toast('Nothing to export');
    const sh = XL.iwpSheet(F.a.map(r => ({x: r.x, q: r.q}))); sh.rows[0][18] = dd; sh.rows[3][18] = 'client RFI accepted';
    F.b.forEach(r => sh.rows.push(['', '', '', '', '', '', r.ss, '', r.c.t, '', '', '', '', '', '', '', '', '', '', `${r.act}: client RFI ${r.rf.no} accepted – no IWP line found`]));
    XL.save(`IWP_report_RFI_accepted_${PRJ}_${dd}.xlsx`, [sh]); };

  RA.share = function () { const v = VS.RA, F = RA.filt(); if (!F.a.length && !F.b.length) return toast('Nothing to share');
    const head = v.tab === 'r' ? `RHI RFI to raise – ${PRJ} – ${fd()}\nClient RFI accepted, RHI RFI (tracker № RFI) empty: ${F.a.length}\n\n` : `IWP to update – ${PRJ} – ${fd()}\nClient RFI accepted, IWP not 100 %: ${F.a.length} lines${F.b.length ? ` · no IWP line: ${F.b.length}` : ''}\n\n`;
    const t = head + F.a.map(r => v.tab === 'r' ? `${r.c.t}\t${r.act}\t${r.rf.no}\t${r.rf.dt || ''}` : `${r.x.acc}\t${r.c.t}\t${r.act}\treport ${fmtn(r.q)} ${r.x.u || ''}\t${r.rf.no}`).join('\n') +
      (F.b.length ? '\n\nNo IWP line:\n' + F.b.map(r => `${r.c.t}\t${r.act}\t${r.rf.no}`).join('\n') : '');
    if (navigator.share) navigator.share({text: t}).catch(() => {}); else copyText(t).then(ok => toast(ok ? 'Copied' : 'Copy failed')); };
})();
