// v4.3: total project dashboard (first page) + OTHER AREA menu (all titles from the cable tracker).
// Data: areas/index.json (small, loaded at start) and areas/<AREA>.json (loaded when the area is opened).
// Both are kept in Cache Storage 'appdata-v1' so they work offline after the first open.
(function () {
  const OA = window.OA = {idx: null, cur: null, data: {}, busy: false};
  const DC = 'appdata-v1';
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function getJ(f) { return net(f).catch(() => cget(f).then(d => { if (!d) throw 'offline: ' + f + ' is not saved on this phone yet'; return d; })); }
  OA.loadIdx = function (cb) { if (OA.idx) return cb && cb(OA.idx); cget('areas/index.json').then(d => { if (d) { OA.idx = d; cb && cb(d); } return getJ('areas/index.json'); }).then(d => { if (d && (!OA.idx || d.ver !== OA.idx.ver)) { OA.idx = d; cb && cb(d); } }).catch(() => {}); };
  OA.loadArea = function (a, cb) { if (OA.data[a]) return cb(OA.data[a]); OA.busy = true; getJ('areas/' + a + '.json').then(d => { OA.busy = false; OA.data[a] = d; cb(d); }).catch(e => { OA.busy = false; main.innerHTML = `<div class="card"><b>Could not load area ${esc(a)}</b><div style="font-size:13px;margin-top:6px">${esc(String(e))}</div><div style="font-size:12px;color:var(--mut);margin-top:8px">Open this area once with internet – then it works offline.</div><button class="more" onclick="route()">Try again</button></div>`; }); };
  const P = (d, n) => n ? Math.round(100 * d / n) : 0;
  const atHome = () => { const k = location.hash.replace(/^#\/?/, '').split('/')[0]; return !k || k[0] === '?'; };
  const PR = PRJN.rx;
  const isOwn = a => PR.test(a.a);
  OA.proj = function () { return typeof PRJ !== 'undefined' ? PRJ : 'CCR'; };

  // ---------------- top bar: CCR / D48 / OTHER AREA
  OA.topBar = function (on) { const p = OA.proj();
    return `<div style="display:flex;gap:6px;margin-bottom:9px">${[['CCR', '🏢 CCR'], ['D48', '⚡ D48'], ['OA', '🌍 OTHER AREA']].map(([k, l]) => `<button class="chip ${(on || p) === k ? 'on' : ''}" style="flex:1;padding:10px 4px;font-size:${k === 'OA' ? 13 : 15}px;font-weight:700" onclick="${k === 'OA' ? "go('#/oa')" : k === p ? "go('#/')" : `projSwitch('${k}')`}">${l}</button>`).join('')}</div>`; };
  if (typeof window.projBar === 'function') window.projBar = () => OA.topBar();

  // ---------------- "Primavera" bars: done vs remaining per row
  function bar(d, n, lbl, sub, h) { const pc = P(d, n); const col = pc >= 100 ? '#1f8a4c' : pc >= 70 ? '#4f9d2f' : pc >= 40 ? '#e0a100' : '#c0392b';
    return `<div style="margin:5px 0" ${h ? `onclick="${h}"` : ''}><div style="display:flex;justify-content:space-between;font-size:12px"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62%">${lbl}</b><span style="color:var(--mut)">${sub}</span></div><div style="height:12px;background:#e7ebf0;border-radius:3px;overflow:hidden;position:relative"><i style="display:block;height:100%;width:${pc}%;background:${col}"></i><span style="position:absolute;right:4px;top:-1px;font-size:10px;font-weight:700;color:${pc > 92 ? '#fff' : '#333'}">${pc}%</span></div></div>`; }
  OA.bar = bar;
  function tot(areas, rhi) { const g = {}; areas.forEach(a => Object.entries(a.g || {}).forEach(([k, e]) => { const t = g[k] = g[k] || [0, 0, 0, 0, e[4]]; const o = rhi ? 5 : 0; t[0] += e[o]; t[1] += e[o + 1]; t[2] += e[o + 2]; t[3] += e[o + 3]; })); return g; }
  const MAIN = ['Cable pulling', 'Cable termination', 'Cable tray', 'Cable Conduits', 'Earthing', 'Junction boxes', 'Field Instruments', 'Equipment installation', 'Lighting', 'Heat tracing (EH)'];
  function fm(v) { return fmtn(Math.round(v)); }

  // ---------------- dashboard card on the first page
  OA.dash = function () { const d = OA.idx; VS.OD = VS.OD || {f: 'rhi', s: 'cab'}; const v = VS.OD;
    if (!d) { OA.loadIdx(() => { if (atHome()) route(); }); return `<div class="card" style="font-size:13px;color:var(--mut)">📊 Total project dashboard – loading areas/index.json… (needs internet the first time)</div>`; }
    const A = d.areas, rhi = v.f === 'rhi';
    const cab = A.reduce((t, a) => { t.n += rhi ? a.cab[1] : a.cab[0]; t.p += a.cab[2]; t.t += a.cab[3]; t.m += a.cab[4]; t.pm += a.cab[5]; return t; }, {n: 0, p: 0, t: 0, m: 0, pm: 0});
    const G = tot(A, rhi); const keys = MAIN.filter(k => G[k]).concat(Object.keys(G).filter(k => !MAIN.includes(k) && G[k][0] >= 50).sort((x, y) => G[y][0] - G[x][0]));
    const gk = v.s === 'cab' ? null : v.s;
    const rows = A.map(a => { if (!gk) return {a, d: a.cab[2], n: rhi ? a.cab[1] : a.cab[0], u: 'lines'}; const e = (a.g || {})[gk]; return e ? {a, d: rhi ? e[8] : e[3], n: rhi ? e[7] : e[2], u: e[4]} : null; }).filter(x => x && x.n > 0).sort((x, y) => (y.n - y.d) - (x.n - x.d));
    const show = VS.OD.all ? rows : rows.slice(0, 12);
    return `<div class="card" style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h3" style="margin:0">📊 Total project dashboard</div><span style="font-size:11px;color:var(--mut)">${esc(d.date)} · ${A.length} areas</span></div>
     <div class="chips" style="margin-top:6px">${[['rhi', 'RHI'], ['all', 'Whole project']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.OD.f='${k}';route()">${l}</button>`).join('')}</div>
     <div class="kpi" style="margin-bottom:6px"><div><b>${fm(cab.n)}</b><span>cables${rhi ? ' (RHI)' : ''}</span></div><div><b style="color:var(--ok)">${fm(cab.p)}</b><span>pulled · ${P(cab.p, cab.n)}%</span></div><div><b style="color:var(--bad)">${fm(cab.n - cab.p)}</b><span>remaining to pull</span></div></div>
     <div class="kpi" style="margin-bottom:6px"><div><b>${fm(cab.pm)} m</b><span>pulled of ${fm(cab.m)} m</span></div><div><b style="color:var(--ok)">${fm(cab.t)}</b><span>terminated · ${P(cab.t, cab.n)}%</span></div><div><b style="color:var(--bad)">${fm(cab.n - cab.t)}</b><span>remaining to terminate</span></div></div>
     <div class="sect" style="margin-top:8px">IWP activities – done / total${rhi ? ' (lines booked by RHI)' : ''}</div>
     ${keys.map(k => { const e = G[k]; return bar(e[3], e[2], esc(k), `${fm(e[3])} / ${fm(e[2])} ${esc(e[4])} · ${fm(e[2] - e[3])} left`, `VS.OD.s=${JSON.stringify(k).replace(/"/g, '&quot;')};route()`); }).join('')}
     <div class="sect" style="margin-top:10px">Areas – ${gk ? esc(gk) : 'cable pulling'} · most remaining first</div>
     <div class="chips">${[['cab', 'Cables'], ...keys.slice(0, 6).map(k => [k, k])].map(([k, l]) => `<button class="chip ${v.s === k ? 'on' : ''}" onclick="VS.OD.s=${JSON.stringify(k).replace(/"/g, '&quot;')};route()">${esc(l)}</button>`).join('')}</div>
     ${show.map(r => bar(r.d, r.n, esc(r.a.a) + (isOwn(r.a) ? ' ★' : ''), `${fm(r.d)} / ${fm(r.n)} ${esc(r.u)} · ${fm(r.n - r.d)} left`, `go('#/oa/${enc(r.a.a)}')`)).join('')}
     ${rows.length > 12 ? `<button class="more" onclick="VS.OD.all=!VS.OD.all;route()">${VS.OD.all ? 'Show top 12' : `Show all ${rows.length} areas`}</button>` : ''}
     <button class="more" style="margin-top:6px" onclick="go('#/oa')">🌍 Open OTHER AREA – area by area ›</button></div>`; };

  // ---------------- OTHER AREA: list of areas
  OA.home = function () { setHead('Other area', 'all titles from the cable tracker · data ' + ((OA.idx || {}).date || '…')); qbox.value = '';
    if (!OA.idx) { main.innerHTML = OA.topBar('OA') + '<div class="empty">Loading areas…</div>'; OA.loadIdx(() => { if (location.hash === '#/oa') OA.home(); }); return; }
    VS.OA = VS.OA || {q: '', g: '', f: 'rhi'}; const v = VS.OA; const nq = N(v.q);
    const L = OA.idx.areas.filter(a => (!v.g || a.a.startsWith(v.g)) && (v.f !== 'rhi' || a.cab[1] > 0 || a.rh[0] > 0 || a.cl[0] > 0) && (!nq || N(a.a + ' ' + a.nm).includes(nq)));
    main.innerHTML = OA.topBar('OA') + `<div style="font-size:12px;color:var(--mut);margin:0 2px 6px">ℹ️ Information only – read from the cable tracker, IWP, punch lists and drum data. No site entry, no report to Paul here (that stays in CCR / D48).</div><input class="fin" placeholder="Area: G0-D1810BX0, G1-B61, name…" value="${esc(v.q)}" oninput="VS.OA.q=this.value;OA.home()">
     <div class="chips">${[['', 'All'], ['G0', 'G0'], ['G1', 'G1'], ['G2', 'G2']].map(([k, l]) => `<button class="chip ${v.g === k ? 'on' : ''}" onclick="VS.OA.g='${k}';OA.home()">${l}</button>`).join('')}${[['rhi', 'RHI areas'], ['all', 'All areas']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.OA.f='${k}';OA.home()">${l}</button>`).join('')}</div>
     <div style="font-size:12px;color:var(--mut);margin:0 2px 6px">${L.length} areas · cables pulled % (RHI scope) · punch open</div>
     <div class="list">${L.map(a => { const n = a.cab[1] || a.cab[0], pc = P(a.cab[2], n), tc = P(a.cab[3], n);
      return `<button class="li" onclick="go('#/oa/${enc(a.a)}')"><div class="m" style="min-width:0"><div class="t">${isOwn(a) ? '★ ' : ''}${esc(a.a)}${a.cab[1] ? '' : ' <span class="badge b-na">not RHI</span>'}</div><div class="s" style="white-space:normal">${esc((a.nm || '').slice(0, 70))}</div><div class="s">${fm(n)} cables · pulled ${pc}% · term. ${tc}% · IWP ${a.iwp[1]}/${a.iwp[0]} · punch ${a.cl[1] + a.rh[1]} open · ${a.dr} drums</div><div class="pbar" style="margin-top:4px"><i style="width:${pc}%"></i></div></div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No area found</div>'}</div>`; };

  // ---------------- one area: sub-menu
  OA.area = function (a, sub, arg) { const ix = (OA.idx || {areas: []}).areas.find(x => x.a === a);
    setHead(a, (ix && ix.nm ? ix.nm.slice(0, 60) : 'area') + ' · ' + ((OA.idx || {}).date || ''));
    if (!OA.idx) { OA.loadIdx(() => route()); }
    OA.loadArea(a, d => { OA.cur = d; const K = {c: {}, i: {}, p: {}, d: {}}; d.CK.forEach((k, i) => K.c[k] = i); d.IK.forEach((k, i) => K.i[k] = i); d.PK.forEach((k, i) => K.p[k] = i); d.DK.forEach((k, i) => K.d[k] = i); OA.K = K;
      if (sub === 'c') return OA.cables(d, arg);
      if (sub === 'i') return OA.iwp(d, arg);
      if (sub === 'p') return OA.punch(d, 'punch', arg);
      if (sub === 'r') return OA.punch(d, 'rhi', arg);
      if (sub === 'd') return OA.drums(d, arg);
      OA.menu(d, ix); });
    if (!OA.data[a]) main.innerHTML = OA.topBar('OA') + `<div class="empty">Loading ${esc(a)}… (first time needs internet)</div>`; };
  OA.menu = function (d, ix) { const K = OA.K; const C = d.cables, R = C.filter(c => c[K.c.co] === 'RHI'); const base = R.length ? R : C;
    const pulled = base.filter(c => c[K.c.ps] === 'Completed').length, term = base.filter(c => c[K.c.tc] === 'Completed').length;
    const m = base.reduce((t, c) => t + (c[K.c.ln] || 0), 0), pm = base.reduce((t, c) => t + Math.min(c[K.c.pm] || 0, c[K.c.ln] || c[K.c.pm] || 0), 0);
    const I = d.items, idone = I.filter(x => x[K.i.q] > 0 && x[K.i.f] >= x[K.i.q] - 0.5).length;
    const po = d.punch.filter(p => p[K.p.st] === 'Open').length, ro = d.rhi.filter(p => p[K.p.st] === 'Open').length;
    const T2 = (h, b, n, pc, cls) => `<button class="tile ${cls || ''}" onclick="go('${h}')"><b>${b}</b><div><span class="n">${n}</span>${pc != null ? `<div class="pc">${pc}%</div><div class="pbar"><i style="width:${pc}%"></i></div>` : ''}</div></button>`;
    const G = ix ? ix.g || {} : {}; const keys = MAIN.filter(k => G[k]).concat(Object.keys(G).filter(k => !MAIN.includes(k)).sort((x, y) => G[y][0] - G[x][0]));
    main.innerHTML = OA.topBar('OA') + `<div class="card" style="padding:12px">${ix && ix.nm ? `<div style="font-size:13px;color:var(--mut)">${esc(ix.nm)}</div>` : ''}
     <div class="kpi" style="margin:8px 0 6px"><div><b>${fm(base.length)}</b><span>cables ${R.length ? '(RHI)' : '(all companies)'}</span></div><div><b style="color:var(--ok)">${fm(pulled)}</b><span>pulled · ${P(pulled, base.length)}%</span></div><div><b style="color:var(--bad)">${fm(base.length - pulled)}</b><span>remaining to pull</span></div></div>
     <div class="kpi" style="margin-bottom:6px"><div><b>${fm(pm)} m</b><span>pulled of ${fm(m)} m</span></div><div><b style="color:var(--ok)">${fm(term)}</b><span>terminated · ${P(term, base.length)}%</span></div><div><b style="color:var(--bad)">${fm(base.length - term)}</b><span>remaining to terminate</span></div></div>
     ${keys.length ? `<div class="sect" style="margin-top:6px">IWP activities (RHI / all)</div>${keys.map(k => { const e = G[k]; const rhi = e[7] > 0; return bar(rhi ? e[8] : e[3], rhi ? e[7] : e[2], esc(k), `${fm(rhi ? e[8] : e[3])} / ${fm(rhi ? e[7] : e[2])} ${esc(e[4])}${rhi ? '' : ' · not RHI'}`); }).join('')}` : ''}</div>
     <div class="sect">📂 Details</div><div class="grid">
     ${T2(`#/oa/${enc(d.a)}/c`, '🔌 Cables<br><span style="font-weight:400;font-size:12px">cable tracker · pulled / terminated</span>', `${fm(C.length)} cables · ${fm(R.length)} RHI`, P(pulled, base.length), 'main')}
     ${T2(`#/oa/${enc(d.a)}/i`, '📋 IWP lines<br><span style="font-weight:400;font-size:12px">quantity · fact · remaining</span>', `${fm(idone)} / ${fm(I.length)} lines done`, P(idone, I.length), 'main')}
     ${T2(`#/oa/${enc(d.a)}/p`, '🧾 Client punch<br><span style="font-weight:400;font-size:12px">master punch list · RHI responsible</span>', `${po} open · ${d.punch.length} total`, P(d.punch.length - po, d.punch.length))}
     ${T2(`#/oa/${enc(d.a)}/r`, '🧾 RHI internal punch<br><span style="font-weight:400;font-size:12px">RHI QC register</span>', `${ro} open · ${d.rhi.length} total`, P(d.rhi.length - ro, d.rhi.length))}
     ${T2(`#/oa/${enc(d.a)}/d`, '🧵 Cable drums<br><span style="font-weight:400;font-size:12px">assigned drums · remaining</span>', `${d.drums.length} drums`)}</div>
     <div class="foot">Data ${esc(d.date)} · Md cable tracker, IWP status, master punch list, RHI punch register</div>`; };

  // ---------------- cables
  const CST = (c, K) => c[K.c.tc] === 'Completed' ? {l: 'Completed', c: 'b-ok'} : c[K.c.ps] === 'Completed' ? {l: 'Pulled · term. open', c: 'b-part'} : (c[K.c.pm] > 0 ? {l: 'Partly pulled', c: 'b-part'} : {l: 'Not pulled', c: 'b-no'});
  OA.cables = function (d, arg) { const K = OA.K; if (arg !== undefined && arg !== '') return OA.cable(d, Number(arg));
    VS.OC = VS.OC || {q: '', f: 'all', co: 'rhi', sy: '', lim: 100}; const v = VS.OC; const nq = N(v.q);
    const syss = [...new Set(d.cables.map(c => c[K.c.sys]).filter(Boolean))].sort();
    const L = d.cables.map((c, i) => [c, i]).filter(([c]) => (v.co !== 'rhi' || c[K.c.co] === 'RHI') && (!v.sy || c[K.c.sys] === v.sy) && (v.f === 'all' || (v.f === 'np' && c[K.c.ps] !== 'Completed') || (v.f === 'nt' && c[K.c.ps] === 'Completed' && c[K.c.tc] !== 'Completed') || (v.f === 'ok' && c[K.c.tc] === 'Completed') || (v.f === 'hold' && c[K.c.h])) && (!nq || N(c[K.c.t] + ' ' + c[K.c.f] + ' ' + c[K.c.o] + ' ' + c[K.c.dr] + ' ' + c[K.c.id]).includes(nq)));
    setHead(d.a + ' · cables', `${L.length} of ${d.cables.length} cables`);
    main.innerHTML = `<input class="fin" placeholder="Cable, from / to, drum, ident…" value="${esc(v.q)}" oninput="VS.OC.q=this.value;VS.OC.lim=100;OA.cables(OA.cur)">
     <div class="chips">${[['all', 'All'], ['np', 'Not pulled'], ['nt', 'Pulled · term. open'], ['ok', 'Completed'], ['hold', 'HOLD']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.OC.f='${k}';VS.OC.lim=100;OA.cables(OA.cur)">${l}</button>`).join('')}${[['rhi', 'RHI'], ['all', 'All companies']].map(([k, l]) => `<button class="chip ${v.co === k ? 'on' : ''}" onclick="VS.OC.co='${k}';VS.OC.lim=100;OA.cables(OA.cur)">${l}</button>`).join('')}</div>
     <select onchange="VS.OC.sy=this.value;VS.OC.lim=100;OA.cables(OA.cur)"><option value="">All systems (${syss.length})</option>${syss.map(y => `<option ${v.sy === y ? 'selected' : ''}>${esc(y)}</option>`).join('')}</select>
     <div class="list">${L.slice(0, v.lim).map(([c, i]) => { const s = CST(c, K); return `<button class="li" onclick="go('#/oa/${enc(d.a)}/c/${i}')"><div class="m" style="min-width:0"><div class="t">${esc(c[K.c.t])}${c[K.c.h] ? ' <span class="badge b-no">HOLD</span>' : ''}</div><div class="s" style="white-space:normal">${esc(c[K.c.ty])} ${esc(c[K.c.c])} · ${fmtn(c[K.c.pm])} / ${fmtn(c[K.c.ln])} m${c[K.c.dr] ? ' · drum ' + esc(c[K.c.dr]) : ''}${c[K.c.co] && c[K.c.co] !== 'RHI' ? ' · ' + esc(c[K.c.co]) : ''}</div><div class="s">${esc(String(c[K.c.o]).slice(-60))}</div></div><span class="badge ${s.c}">${s.l}</span><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No cables</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.OC.lim+=200;OA.cables(OA.cur)">Show more (${L.length - v.lim} left)</button>` : ''}`; };
  OA.cable = function (d, i) { const K = OA.K, c = d.cables[i]; if (!c) { main.innerHTML = '<div class="empty">Cable not found</div>'; return; } const s = CST(c, K);
    setHead(c[K.c.t], d.a + ' · ' + esc(c[K.c.sys]));
    const row = (l, v) => v ? `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);font-size:13px"><span style="color:var(--mut);min-width:118px">${l}</span><span style="word-break:break-word">${v}</span></div>` : '';
    const iw = d.items.filter(x => x[K.i.tag] === c[K.c.t]);
    const dr = d.drums.find(x => x[K.d.no] === c[K.c.dr]);
    const pu = d.punch.filter(p => p[K.p.tag] === c[K.c.t]).map(p => OA.pRow(p, K, d, 'punch')).concat(d.rhi.filter(p => p[K.p.tag] === c[K.c.t]).map(p => OA.pRow(p, K, d, 'rhi')));
    main.innerHTML = `<div class="card"><span class="badge ${s.c}">${s.l}</span>${c[K.c.h] ? ` <span class="badge b-no">HOLD: ${esc(c[K.c.h])}</span>` : ''}
     ${row('From', esc(c[K.c.f]))}${row('To', esc(c[K.c.o]))}${row('Type', esc(c[K.c.ty] + ' ' + c[K.c.c]))}${row('Ident', esc(c[K.c.id]))}${row('Design length', fmtn(c[K.c.ln]) + ' m')}
     ${row('Pulled', (c[K.c.pm] ? fmtn(c[K.c.pm]) + ' m' : '–') + (c[K.c.pd] ? ' · ' + esc(c[K.c.pd]) : '') + (c[K.c.ps] ? ' · ' + esc(c[K.c.ps]) : ''))}
     ${row('Termination', [c[K.c.tf] ? 'from ' + c[K.c.tf] : '', c[K.c.tt] ? 'to ' + c[K.c.tt] : '', c[K.c.tc]].filter(Boolean).map(esc).join(' · ') || '–')}
     ${row('Drum', c[K.c.dr] ? `<span class="link" onclick="go('#/oa/${enc(d.a)}/d/${enc(c[K.c.dr])}')">${esc(c[K.c.dr])}</span>${dr ? ` · ${fmtn(dr[K.d.len])} m on drum · ${fmtn(dr[K.d.rem])} m remaining` : ''}` : '')}
     ${row('Company', esc(c[K.c.co]))}${row('RFI', esc(c[K.c.rfi]))}${row('Drawing', esc(c[K.c.doc]))}</div>
     ${iw.length ? `<div class="sect">IWP lines</div><div class="list">${iw.map(x => OA.iRow(x, K)).join('')}</div>` : ''}
     ${pu.length ? `<div class="sect">Punch on this cable</div><div class="list">${pu.join('')}</div>` : ''}`; };

  // ---------------- IWP
  OA.iRow = function (x, K) { const q = x[K.i.q], f = x[K.i.f]; const st = q > 0 && f >= q - 0.5 ? {l: 'Done', c: 'b-ok'} : f > 0 ? {l: 'Partly', c: 'b-part'} : {l: 'Not done', c: 'b-no'};
    return `<div class="li"><div class="m" style="min-width:0"><div class="t">${esc(x[K.i.tag] || x[K.i.desc])}</div><div class="s">${esc(x[K.i.grp])} · Access ${esc(x[K.i.acc])}${x[K.i.co] ? ' · ' + esc(x[K.i.co]) : ''}</div><div class="s">${fmtn(f)} / ${fmtn(q)} ${esc(x[K.i.u])} · ${fmtn(Math.max(q - f, 0))} left · ${esc(x[K.i.sys])}</div></div><span class="badge ${st.c}">${st.l}</span></div>`; };
  OA.iwp = function (d) { const K = OA.K; VS.OI = VS.OI || {q: '', g: '', f: 'all', co: 'all', lim: 100}; const v = VS.OI; const nq = N(v.q);
    const grps = {}; d.items.forEach(x => grps[x[K.i.grp]] = (grps[x[K.i.grp]] || 0) + 1);
    const L = d.items.filter(x => (!v.g || x[K.i.grp] === v.g) && (v.co === 'all' || (v.co === 'rhi' ? x[K.i.co] === 'RHI' : !x[K.i.co])) && (v.f === 'all' || (v.f === 'open' && !(x[K.i.q] > 0 && x[K.i.f] >= x[K.i.q] - 0.5)) || (v.f === 'done' && x[K.i.q] > 0 && x[K.i.f] >= x[K.i.q] - 0.5)) && (!nq || N(x[K.i.tag] + ' ' + x[K.i.acc] + ' ' + x[K.i.desc] + ' ' + x[K.i.dwg]).includes(nq)));
    const q = L.reduce((t, x) => t + x[K.i.q], 0), f = L.reduce((t, x) => t + Math.min(x[K.i.f], x[K.i.q] || x[K.i.f]), 0);
    setHead(d.a + ' · IWP', `${L.length} lines · ${fmtn(f)} / ${fmtn(q)}`);
    main.innerHTML = `<input class="fin" placeholder="Tag, access ID, description, drawing…" value="${esc(v.q)}" oninput="VS.OI.q=this.value;VS.OI.lim=100;OA.iwp(OA.cur)">
     <div class="chips">${[['all', 'All'], ['open', 'Not done'], ['done', 'Done']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.OI.f='${k}';VS.OI.lim=100;OA.iwp(OA.cur)">${l}</button>`).join('')}${[['all', 'Any company'], ['rhi', 'RHI'], ['none', 'Not assigned']].map(([k, l]) => `<button class="chip ${v.co === k ? 'on' : ''}" onclick="VS.OI.co='${k}';VS.OI.lim=100;OA.iwp(OA.cur)">${l}</button>`).join('')}</div>
     <select onchange="VS.OI.g=this.value;VS.OI.lim=100;OA.iwp(OA.cur)"><option value="">All activities (${Object.keys(grps).length})</option>${Object.keys(grps).sort().map(g => `<option value="${esc(g)}" ${v.g === g ? 'selected' : ''}>${esc(g)} (${grps[g]})</option>`).join('')}</select>
     ${bar(f, q, 'Selected lines', `${fmtn(f)} / ${fmtn(q)}`)}
     <div class="list">${L.slice(0, v.lim).map(x => OA.iRow(x, K)).join('') || '<div class="empty">No IWP lines</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.OI.lim+=200;OA.iwp(OA.cur)">Show more (${L.length - v.lim} left)</button>` : ''}`; };

  // ---------------- punch (client / RHI)
  OA.pRow = function (p, K, d, kind) { const ix = d[kind].indexOf(p); return `<button class="li" onclick="OA.pOpen('${kind}',${ix})"><div class="m" style="min-width:0"><div class="t">№ ${esc(p[K.p.no])} · ${esc(p[K.p.tag] || '-')}</div><div class="s" style="white-space:normal">${esc(p[K.p.den].slice(0, 120))}</div><div class="s">${esc(p[K.p.disc].slice(0, 30))} · ${esc(p[K.p.idate])}${p[K.p.cdate] ? ' → ' + esc(p[K.p.cdate]) : ''} · ${esc(p[K.p.by])}</div></div><div class="r">${p[K.p.st] === 'Open' ? '<span class="badge b-no">Open</span>' : '<span class="badge b-ok">Closed</span>'}<div style="margin-top:3px"><span class="badge ${p[K.p.cat] === 'A' ? 'b-no' : p[K.p.cat] === 'B' ? 'b-part' : 'b-na'}">Cat ${esc(p[K.p.cat] || '-')}</span></div></div></button>`; };
  OA.pOpen = function (kind, ix) { const K = OA.K; const p = OA.cur[kind][ix]; if (!p) return; const row = (l, v) => v ? `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);font-size:13px"><span style="color:var(--mut);min-width:100px">${l}</span><span style="word-break:break-word">${esc(v)}</span></div>` : '';
    modalP(`<div class="h3">№ ${esc(p[K.p.no])} ${p[K.p.st] === 'Open' ? '<span class="badge b-no">Open</span>' : '<span class="badge b-ok">Closed</span>'} <span class="badge b-na">Cat ${esc(p[K.p.cat] || '-')}</span></div>
     ${row('Tag', p[K.p.tag])}${row('Tag description', p[K.p.tagd])}${row('Punch', p[K.p.den])}${row('Discipline', p[K.p.disc])}${row('Subsystem', p[K.p.sub])}${row('Section', p[K.p.sec])}${row('Issued', (p[K.p.idate] || '') + (p[K.p.by] ? ' · ' + p[K.p.by] : '') + (p[K.p.org] ? ' · ' + p[K.p.org] : ''))}${row('Closed', p[K.p.cdate])}${row('Responsible', p[K.p.resp])}${row('Notes', p[K.p.notes])}
     <button class="more" onclick="closeP()">Close</button>`); };
  OA.punch = function (d, kind) { const K = OA.K; const P_ = d[kind]; VS.OP = VS.OP || {q: '', f: 'open', c: '', ds: '', lim: 100}; const v = VS.OP; const nq = N(v.q);
    const discs = {}; P_.forEach(p => discs[p[K.p.disc]] = (discs[p[K.p.disc]] || 0) + 1);
    const L = P_.filter(p => (v.f === 'all' || (v.f === 'open' ? p[K.p.st] === 'Open' : p[K.p.st] !== 'Open')) && (!v.c || p[K.p.cat] === v.c) && (!v.ds || p[K.p.disc] === v.ds) && (!nq || N(p[K.p.no] + ' ' + p[K.p.tag] + ' ' + p[K.p.den] + ' ' + p[K.p.sub]).includes(nq)));
    const op = P_.filter(p => p[K.p.st] === 'Open').length;
    setHead(d.a + (kind === 'rhi' ? ' · RHI punch' : ' · client punch'), `${op} open · ${P_.length} total`);
    main.innerHTML = `<input class="fin" placeholder="Punch no, tag, text, subsystem…" value="${esc(v.q)}" oninput="VS.OP.q=this.value;VS.OP.lim=100;OA.punch(OA.cur,'${kind}')">
     <div class="chips">${[['open', 'Open'], ['closed', 'Closed'], ['all', 'All']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.OP.f='${k}';VS.OP.lim=100;OA.punch(OA.cur,'${kind}')">${l}</button>`).join('')}${['A', 'B', 'C'].map(k => `<button class="chip ${v.c === k ? 'on' : ''}" onclick="VS.OP.c=VS.OP.c==='${k}'?'':'${k}';VS.OP.lim=100;OA.punch(OA.cur,'${kind}')">Cat ${k}</button>`).join('')}</div>
     <select onchange="VS.OP.ds=this.value;VS.OP.lim=100;OA.punch(OA.cur,'${kind}')"><option value="">All disciplines</option>${Object.keys(discs).sort().map(g => `<option value="${esc(g)}" ${v.ds === g ? 'selected' : ''}>${esc(g.slice(0, 50))} (${discs[g]})</option>`).join('')}</select>
     ${bar(P_.length - op, P_.length, 'Closed', `${P_.length - op} / ${P_.length}`)}
     <div class="list">${L.slice(0, v.lim).map(p => OA.pRow(p, K, d, kind)).join('') || '<div class="empty">No punch items</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.OP.lim+=200;OA.punch(OA.cur,'${kind}')">Show more (${L.length - v.lim} left)</button>` : ''}`; };

  // ---------------- drums
  OA.drums = function (d, arg) { const K = OA.K; if (arg) { const x = d.drums.find(y => y[K.d.no] === arg); if (x) return OA.drum(d, x); }
    VS.ODR = VS.ODR || {q: '', lim: 100}; const v = VS.ODR; const nq = N(v.q);
    const L = d.drums.filter(x => !nq || N(x[K.d.no] + ' ' + x[K.d.id] + ' ' + x[K.d.ty] + ' ' + x[K.d.c]).includes(nq) || x[K.d.cab].some(c => N(c[0]).includes(nq)));
    setHead(d.a + ' · drums', `${d.drums.length} drums assigned to cables of this area`);
    main.innerHTML = `<input class="fin" placeholder="Drum no, ident, cable type, cable…" value="${esc(v.q)}" oninput="VS.ODR.q=this.value;OA.drums(OA.cur)">
     <div class="list">${L.slice(0, v.lim).map(x => { const here = x[K.d.cab].filter(c => c[1] === d.a); const pulled = x[K.d.cab].filter(c => c[4]).length; return `<button class="li" onclick="go('#/oa/${enc(d.a)}/d/${enc(x[K.d.no])}')"><div class="m" style="min-width:0"><div class="t">${esc(x[K.d.no])} <span class="badge b-na">${esc(x[K.d.id])}</span></div><div class="s">${esc(x[K.d.ty])} ${esc(x[K.d.c])} · ${fmtn(x[K.d.len])} m on drum · <b>${fmtn(x[K.d.rem])} m remaining</b></div><div class="s">${x[K.d.cab].length} cables (${here.length} in this area) · ${pulled} pulled${x[K.d.org] ? ' · ' + esc(x[K.d.org]) : ''}</div></div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No drums</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.ODR.lim+=200;OA.drums(OA.cur)">Show more</button>` : ''}`; };
  OA.drum = function (d, x) { const K = OA.K; setHead('Drum ' + x[K.d.no], x[K.d.id] + ' · ' + x[K.d.ty] + ' ' + x[K.d.c]);
    const asg = x[K.d.cab].reduce((t, c) => t + (c[2] || 0), 0), pl = x[K.d.cab].reduce((t, c) => t + (c[3] || 0), 0);
    main.innerHTML = `<div class="kpi"><div><b>${fmtn(x[K.d.len])} m</b><span>on drum</span></div><div><b>${fmtn(asg)} m</b><span>assigned · ${x[K.d.cab].length} cables</span></div><div><b style="color:${x[K.d.rem] < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmtn(x[K.d.rem])} m</b><span>remaining (tracker)</span></div></div>
     <div style="font-size:12px;color:var(--mut);margin-bottom:6px">${fmtn(pl)} m pulled so far · organisations: ${esc(x[K.d.org] || '-')}</div>
     <div class="list">${x[K.d.cab].slice().sort((a, b) => a[1].localeCompare(b[1])).map(c => `<div class="li" ${c[1] === d.a ? `onclick="VS.OC=VS.OC||{};VS.OC.q=${JSON.stringify(c[0]).replace(/"/g, '&quot;')};VS.OC.co='all';go('#/oa/${enc(d.a)}/c')"` : ''}><div class="m" style="min-width:0"><div class="t">${esc(c[0])}</div><div class="s">${esc(c[1])} · ${fmtn(c[2])} m design · ${fmtn(c[3])} m pulled</div></div>${c[4] ? '<span class="badge b-ok">Pulled</span>' : '<span class="badge b-no">Not pulled</span>'}</div>`).join('')}</div>`; };

  // ---------------- routing (called from route() in app.js)
  OA.route = function (rest) { const a = dec(rest[0] || ''); if (!a) return OA.home(); return OA.area(a, rest[1] || '', rest.slice(2).map(dec).join('/')); };
  // dashboard on the first page: inserted after the project bar
  const _home = window.home;
  window.home = function () { _home(); const pb = main.firstElementChild; if (pb) pb.insertAdjacentHTML('afterend', OA.dash()); };
  OA.loadIdx(() => { if (atHome()) route(); });
  if (location.hash.startsWith('#/oa')) route();
})();
