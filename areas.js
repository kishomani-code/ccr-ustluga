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
  const REC = (typeof window.REC === 'object' && window.REC) || {en: 'Paul', ru: 'Пауль', tel: ''};   // report recipient (COLD project: Sri)
  const atHome = () => { const k = location.hash.replace(/^#\/?/, '').split('/')[0]; return !k || k[0] === '?'; };
  const PR = PRJN.rx;
  const isOwn = a => PR.test(a.a);
  OA.proj = function () { return typeof PRJ !== 'undefined' ? PRJ : 'CCR'; };

  // ---------------- top bar: CCR / D48 / OTHER AREA
  OA.topBar = function (on) { const p = OA.proj();
    const chip = (k, l, h) => `<button class="chip ${(on || p) === k ? 'on' : ''}" data-nt="1" style="flex:1;padding:10px 4px;font-size:14px;font-weight:700" onclick="${h}">${l}</button>`;
    return `<div><div style="display:flex;gap:6px;margin-bottom:6px">${chip('CCR', '🏢 CCR', p === 'CCR' ? "go('#/')" : "projSwitch('CCR')")}${chip('D48', '⚡ D48', p === 'D48' ? "go('#/')" : "projSwitch('D48')")}</div><div style="display:flex;gap:6px;margin-bottom:9px">${chip('OA', '🌍 OTHER AREA', "go('#/oa')")}${chip('COLD', '❄️ COLD CABLES', p === 'COLD' ? "go('#/')" : "projSwitch('COLD')")}</div></div>`; };
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
    OA.loadArea(a, d => { const K = {c: {}, i: {}, p: {}, d: {}}; d.CK.forEach((k, i) => K.c[k] = i); d.IK.forEach((k, i) => K.i[k] = i); d.PK.forEach((k, i) => K.p[k] = i); d.DK.forEach((k, i) => K.d[k] = i); OA.K = K;
      if (OA.mode === 'cold') d = OA.coldView(d); OA.cur = d;
      if (sub === 'c') return OA.cables(d, arg);
      if (sub === 'i') return OA.iwp(d, arg);
      if (sub === 'p') return OA.punch(d, 'punch', arg);
      if (sub === 'r') return OA.punch(d, 'rhi', arg);
      if (sub === 'd') return OA.drums(d, arg);
      OA.menu(d, ix); });
    if (!OA.data[a]) main.innerHTML = OA.topBar(OA.mode === 'cold' ? 'COLD' : 'OA') + `<div class="empty">Loading ${esc(a)}… (first time needs internet)</div>`; };
  OA.menu = function (d, ix) { const K = OA.K; const C = d.cables, R = C.filter(c => c[K.c.co] === 'RHI'); const base = R.length ? R : C;
    const pulled = base.filter(c => c[K.c.ps] === 'Completed').length, term = base.filter(c => c[K.c.tc] === 'Completed').length;
    const m = base.reduce((t, c) => t + (c[K.c.ln] || 0), 0), pm = base.reduce((t, c) => t + Math.min(c[K.c.pm] || 0, c[K.c.ln] || c[K.c.pm] || 0), 0);
    const I = d.items, idone = I.filter(x => x[K.i.q] > 0 && x[K.i.f] >= x[K.i.q] - 0.5).length;
    const po = d.punch.filter(p => p[K.p.st] === 'Open').length, ro = d.rhi.filter(p => p[K.p.st] === 'Open').length;
    const T2 = (h, b, n, pc, cls) => `<button class="tile ${cls || ''}" onclick="go('${h}')"><b>${b}</b><div><span class="n">${n}</span>${pc != null ? `<div class="pc">${pc}%</div><div class="pbar"><i style="width:${pc}%"></i></div>` : ''}</div></button>`;
    const G = ix ? ix.g || {} : {}; const keys = d.cold ? Object.keys(G).filter(k => /heat|обогрев|EH/i.test(k)) : MAIN.filter(k => G[k]).concat(Object.keys(G).filter(k => !MAIN.includes(k)).sort((x, y) => G[y][0] - G[x][0]));
    main.innerHTML = OA.topBar(d.cold ? 'COLD' : 'OA') + (d.cold ? '<div style="font-size:12px;color:var(--mut);margin:0 2px 6px">❄️ Cold cables only (heat tracing EOES / AEOG) · information only</div>' : '') + `<div class="card" style="padding:12px">${ix && ix.nm ? `<div style="font-size:13px;color:var(--mut)">${esc(ix.nm)}</div>` : ''}
     <div class="kpi" style="margin:8px 0 6px"><div><b>${fm(base.length)}</b><span>cables ${R.length ? '(RHI)' : '(all companies)'}</span></div><div><b style="color:var(--ok)">${fm(pulled)}</b><span>pulled · ${P(pulled, base.length)}%</span></div><div><b style="color:var(--bad)">${fm(base.length - pulled)}</b><span>remaining to pull</span></div></div>
     <div class="kpi" style="margin-bottom:6px"><div><b>${fm(pm)} m</b><span>pulled of ${fm(m)} m</span></div><div><b style="color:var(--ok)">${fm(term)}</b><span>terminated · ${P(term, base.length)}%</span></div><div><b style="color:var(--bad)">${fm(base.length - term)}</b><span>remaining to terminate</span></div></div>
     ${keys.length ? `<div class="sect" style="margin-top:6px">IWP activities (RHI / all)</div>${keys.map(k => { const e = G[k]; const rhi = e[7] > 0; return bar(rhi ? e[8] : e[3], rhi ? e[7] : e[2], esc(k), `${fm(rhi ? e[8] : e[3])} / ${fm(rhi ? e[7] : e[2])} ${esc(e[4])}${rhi ? '' : ' · not RHI'}`); }).join('')}` : ''}</div>
     <div class="sect">📂 Details</div><div class="grid">
     ${T2(`${OA.base()}/${enc(d.a)}/c`, '🔌 Cables<br><span style="font-weight:400;font-size:12px">cable tracker · pulled / terminated</span>', `${fm(C.length)} cables · ${fm(R.length)} RHI`, P(pulled, base.length), 'main')}
     ${T2(`${OA.base()}/${enc(d.a)}/i`, '📋 IWP lines<br><span style="font-weight:400;font-size:12px">quantity · fact · remaining</span>', `${fm(idone)} / ${fm(I.length)} lines done`, P(idone, I.length), 'main')}
     ${T2(`${OA.base()}/${enc(d.a)}/p`, '🧾 Client punch<br><span style="font-weight:400;font-size:12px">master punch list · RHI responsible</span>', `${po} open · ${d.punch.length} total`, P(d.punch.length - po, d.punch.length))}
     ${T2(`${OA.base()}/${enc(d.a)}/r`, '🧾 RHI internal punch<br><span style="font-weight:400;font-size:12px">RHI QC register</span>', `${ro} open · ${d.rhi.length} total`, P(d.rhi.length - ro, d.rhi.length))}
     ${T2(`${OA.base()}/${enc(d.a)}/d`, '🧵 Cable drums<br><span style="font-weight:400;font-size:12px">assigned drums · remaining</span>', `${d.drums.length} drums`)}
     ${T2(`${OA.base()}/${enc(d.a)}/lt`, '🔒 LOTO<br><span style="font-weight:400;font-size:12px">which breaker feeds a JB / panel · live sources</span>', `${window.LT ? LT.live().filter(x => !x.area || x.area === d.a || true).length : 0} live sources declared`, null, 'main')}</div>
     ${d.cold && OA.dw[d.a] ? `<div class="sect">AEOG drawings (${OA.dw[d.a].length})</div><div class="list">${OA.dw[d.a].map(x => `<div class="li"><div class="m"><div class="t">${esc(x[0])}</div><div class="s">${esc(x[1])} · rev ${esc(x[2])} · ${esc(x[3])}</div></div></div>`).join('')}</div>` : ''}
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
     <div class="list">${L.slice(0, v.lim).map(([c, i]) => { const s = CST(c, K); return `<button class="li" onclick="go('${OA.base()}/${enc(d.a)}/c/${i}')"><div class="m" style="min-width:0"><div class="t">${esc(c[K.c.t])}${c[K.c.h] ? ' <span class="badge b-no">HOLD</span>' : ''}</div><div class="s" style="white-space:normal">${esc(c[K.c.ty])} ${esc(c[K.c.c])} · ${fmtn(c[K.c.pm])} / ${fmtn(c[K.c.ln])} m${c[K.c.dr] ? ' · drum ' + esc(c[K.c.dr]) : ''}${c[K.c.co] && c[K.c.co] !== 'RHI' ? ' · ' + esc(c[K.c.co]) : ''}</div><div class="s">${esc(String(c[K.c.o]).slice(-60))}</div></div><span class="badge ${s.c}">${s.l}</span><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No cables</div>'}</div>
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
     ${row('Drum', c[K.c.dr] ? `<span class="link" onclick="go('${OA.base()}/${enc(d.a)}/d/${enc(c[K.c.dr])}')">${esc(c[K.c.dr])}</span>${dr ? ` · ${fmtn(dr[K.d.len])} m on drum · ${fmtn(dr[K.d.rem])} m remaining` : ''}` : '')}
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
     <div class="list">${L.slice(0, v.lim).map(x => { const here = x[K.d.cab].filter(c => c[1] === d.a); const pulled = x[K.d.cab].filter(c => c[4]).length; return `<button class="li" onclick="go('${OA.base()}/${enc(d.a)}/d/${enc(x[K.d.no])}')"><div class="m" style="min-width:0"><div class="t">${esc(x[K.d.no])} <span class="badge b-na">${esc(x[K.d.id])}</span></div><div class="s">${esc(x[K.d.ty])} ${esc(x[K.d.c])} · ${fmtn(x[K.d.len])} m on drum · <b>${fmtn(x[K.d.rem])} m remaining</b></div><div class="s">${x[K.d.cab].length} cables (${here.length} in this area) · ${pulled} pulled${x[K.d.org] ? ' · ' + esc(x[K.d.org]) : ''}</div></div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No drums</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.ODR.lim+=200;OA.drums(OA.cur)">Show more</button>` : ''}`; };
  OA.drum = function (d, x) { const K = OA.K; setHead('Drum ' + x[K.d.no], x[K.d.id] + ' · ' + x[K.d.ty] + ' ' + x[K.d.c]);
    const asg = x[K.d.cab].reduce((t, c) => t + (c[2] || 0), 0), pl = x[K.d.cab].reduce((t, c) => t + (c[3] || 0), 0);
    main.innerHTML = `<div class="kpi"><div><b>${fmtn(x[K.d.len])} m</b><span>on drum</span></div><div><b>${fmtn(asg)} m</b><span>assigned · ${x[K.d.cab].length} cables</span></div><div><b style="color:${x[K.d.rem] < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmtn(x[K.d.rem])} m</b><span>remaining (tracker)</span></div></div>
     <div style="font-size:12px;color:var(--mut);margin-bottom:6px">${fmtn(pl)} m pulled so far · organisations: ${esc(x[K.d.org] || '-')}</div>
     <div class="list">${x[K.d.cab].slice().sort((a, b) => a[1].localeCompare(b[1])).map(c => `<div class="li" ${c[1] === d.a ? `onclick="VS.OC=VS.OC||{};VS.OC.q=${JSON.stringify(c[0]).replace(/"/g, '&quot;')};VS.OC.co='all';go('${OA.base()}/${enc(d.a)}/c')"` : ''}><div class="m" style="min-width:0"><div class="t">${esc(c[0])}</div><div class="s">${esc(c[1])} · ${fmtn(c[2])} m design · ${fmtn(c[3])} m pulled</div></div>${c[4] ? '<span class="badge b-ok">Pulled</span>' : '<span class="badge b-no">Not pulled</span>'}</div>`).join('')}</div>`; };

  // ---------------- COLD CABLES: heat tracing (EH: EOES power supply + AEOG automation) – same screens, filtered
  const isEH = (c, K) => c[K.c.dc] === 'EH' || String(c[K.c.sys]).startsWith('EH-');
  const isEHi = x => /heat|обогрев|^eh$|eht/i.test(String(x[1] || ''));
  OA.coldView = function (d) { if (OA.coldD[d.a]) return OA.coldD[d.a]; const K = OA.K;
    const cables = d.cables.filter(c => isEH(c, K)); const tags = new Set(cables.map(c => c[K.c.t])); const drs = new Set(cables.map(c => c[K.c.dr]).filter(Boolean));
    const isP = p => tags.has(p[K.p.tag]) || /обогрев|heat|EOES|AEOG/i.test(p[K.p.tagd] + ' ' + p[K.p.den] + ' ' + p[K.p.sub] + ' ' + p[K.p.disc]);
    const v = Object.assign({}, d, {cables, items: d.items.filter(x => isEHi(x) || tags.has(x[K.i.tag])), punch: d.punch.filter(isP), rhi: d.rhi.filter(isP), drums: d.drums.filter(x => drs.has(x[K.d.no])), cold: true});
    return OA.coldD[d.a] = v; };
  OA.coldD = {};
  OA.coldHome = function () { setHead('Cold cables', 'heat tracing – EOES / AEOG · data ' + ((OA.idx || {}).date || '…')); qbox.value = '';
    if (!OA.idx) { main.innerHTML = OA.topBar('COLD') + '<div class="empty">Loading areas…</div>'; OA.loadIdx(() => { if (location.hash === '#/cc') OA.coldHome(); }); return; }
    const L = OA.idx.areas.filter(a => a.eh && a.eh[0] > 0).sort((x, y) => y.eh[0] - x.eh[0]);
    const t = L.reduce((s, a) => { s.n += a.eh[0]; s.p += a.eh[2]; s.t += a.eh[3]; s.m += a.eh[4]; s.pm += a.eh[5]; s.r += a.eh[1]; s.rp += a.eh[6]; return s; }, {n: 0, p: 0, t: 0, m: 0, pm: 0, r: 0, rp: 0});
    main.innerHTML = OA.topBar('COLD') + `<div style="font-size:12px;color:var(--mut);margin:0 2px 6px">ℹ️ Information only – heat-tracing cables (EOES power, AEOG automation) from the cable tracker, IWP, punch lists and drums. No site entry, no report to Paul here.</div>
     <div class="kpi"><div><b>${fm(t.n)}</b><span>cold cables · ${fm(t.r)} RHI</span></div><div><b style="color:var(--ok)">${fm(t.p)}</b><span>pulled · ${P(t.p, t.n)}%</span></div><div><b style="color:var(--bad)">${fm(t.n - t.p)}</b><span>remaining to pull</span></div></div>
     <div class="kpi"><div><b>${fm(t.pm)} m</b><span>pulled of ${fm(t.m)} m</span></div><div><b style="color:var(--ok)">${fm(t.t)}</b><span>terminated · ${P(t.t, t.n)}%</span></div><div><b style="color:var(--bad)">${fm(t.n - t.t)}</b><span>remaining to terminate</span></div></div>
     <div class="sect">Areas – pulled / total cold cables</div>
     ${L.map(a => bar(a.eh[2], a.eh[0], esc(a.a) + (a.eh[1] ? ` <span class="badge b-na">${a.eh[1]} RHI</span>` : ''), `${fm(a.eh[2])} / ${fm(a.eh[0])} · term. ${fm(a.eh[3])}${OA.dw[a.a] ? ' · ' + OA.dw[a.a].length + ' AEOG dwg' : ''}`, `go('#/cc/${enc(a.a)}')`)).join('')}
     <div class="sect">AEOG drawings saved (${Object.values(OA.dw).reduce((n, l) => n + l.length, 0)})</div><div style="font-size:12px;color:var(--mut);margin:0 2px 6px">Drawing list only – the PDF files are with the engineer (too large for the phone app).</div>
     ${Object.keys(OA.dw).sort().map(k => `<div class="card" style="padding:10px"><b>${esc(k)}</b><div style="font-size:12px;margin-top:4px">${OA.dw[k].map(x => `${esc(x[1])} rev ${esc(x[2])} ${esc(x[3])}`).join(' · ')}</div></div>`).join('')}`; };
  OA.base = () => OA.mode === 'cold' ? '#/cc' : '#/oa';
  OA.dw = {};
  OA.loadDw = function () { getJ('areas/cold_drawings.json').then(d => { OA.dw = d || {}; if (location.hash.startsWith('#/cc')) route(); }).catch(() => {}); };

  // ---------------- project progress bars (CCR / D48 first page) – same style as the dashboard
  OA.projBars = function () { const G = {}; I.forEach(x => { const e = G[x.g] = G[x.g] || {n: 0, d: 0, q: 0, f: 0, u: {}}; e.n++; if (x.done) e.d++; e.q += x.q; e.f += Math.min(x.f, x.q || x.f); e.u[x.u] = (e.u[x.u] || 0) + 1; });
    const keys = Object.keys(G).sort((a, b) => G[b].n - G[a].n); VS.PB = VS.PB || {all: false}; const show = VS.PB.all ? keys : keys.slice(0, 8);
    return `<div class="card" style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h3" style="margin:0">📈 ${PRJ === 'COLD' ? 'Cold cables' : PRJ} progress – IWP activities</div><span style="font-size:11px;color:var(--mut)">done / total</span></div>
     ${show.map(k => { const e = G[k]; const u = Object.keys(e.u).sort((a, b) => e.u[b] - e.u[a])[0]; return bar(e.f, e.q, esc(k), `${fm(e.f)} / ${fm(e.q)} ${esc(u)} · ${fm(e.q - e.f)} left · ${e.d}/${e.n} lines`, `go('#/a/${enc(k)}')`); }).join('')}
     ${keys.length > 8 ? `<button class="more" onclick="VS.PB.all=!VS.PB.all;route()">${VS.PB.all ? 'Show main activities' : `Show all ${keys.length} activities`}</button>` : ''}</div>`; };

  // ---------------- bulk materials: tray, covers, conduits, earthing, supports, MCT frames … (IWP lines without an equipment tag)
  const isBulk = x => !/^Cable (pulling|termination)$/.test(x.g) && !/^G\d-[A-Z0-9]{3,}/i.test(String(x.tag || '').trim());
  OA.bulkLines = function () { return I.filter(isBulk); };
  OA.bEntries = acc => (S2.b && S2.b[acc]) || [];
  OA.bSum = acc => OA.bEntries(acc).reduce((t, e) => t + (Number(e.q) || 0), 0);
  OA.bulk = function () { VS.BM = VS.BM || {sy: '', g: '', q: '', f: 'open', lim: 80}; const v = VS.BM; const nq = N(v.q);
    const B = OA.bulkLines(); const syss = [...new Set(B.map(x => x.sy || '-'))].sort(); const grps = {}; B.forEach(x => grps[x.g] = (grps[x.g] || 0) + 1);
    const L = B.filter(x => (!v.sy || (x.sy || '-') === v.sy) && (!v.g || x.g === v.g) && (v.f === 'all' || (v.f === 'open' ? !x.done : x.done)) && (!nq || N(x.tag + ' ' + T.desc[x.desc] + ' ' + T.dwg[x.dwg] + ' ' + x.acc).includes(nq)));
    const q = L.reduce((t, x) => t + x.q, 0), f = L.reduce((t, x) => t + Math.min(x.f, x.q || x.f), 0), site = L.reduce((t, x) => t + OA.bSum(x.acc), 0);
    setHead('Bulk materials', `${B.length} IWP lines · tray, conduits, earthing, supports…`); qbox.value = '';
    main.innerHTML = `<div style="font-size:12px;color:var(--mut);margin:0 2px 6px">Materials without a tag (tray, covers, conduits, earthing, supports, MCT frames, boxes). Report by quantity against the IWP line and write where it was done (room / route). The report to ${REC.en} uses the Access ID like for cables.</div>
     <input class="fin" placeholder="Material, drawing, access ID…" value="${esc(v.q)}" oninput="VS.BM.q=this.value;VS.BM.lim=80;OA.bulk()">
     <div class="chips">${[['open', 'Not finished'], ['done', 'Done in IWP'], ['all', 'All']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.BM.f='${k}';VS.BM.lim=80;OA.bulk()">${l}</button>`).join('')}</div>
     <select onchange="VS.BM.sy=this.value;VS.BM.lim=80;OA.bulk()"><option value="">All systems (${syss.length})</option>${syss.map(y => `<option ${v.sy === y ? 'selected' : ''}>${esc(y)}</option>`).join('')}</select>
     <select onchange="VS.BM.g=this.value;VS.BM.lim=80;OA.bulk()"><option value="">All materials (${Object.keys(grps).length})</option>${Object.keys(grps).sort().map(g => `<option value="${esc(g)}" ${v.g === g ? 'selected' : ''}>${esc(g)} (${grps[g]})</option>`).join('')}</select>
     ${bar(f, q, 'Selected lines – IWP fact', `${fm(f)} / ${fm(q)}${site ? ' · +' + fm(site) + ' entered on site' : ''}`)}
     <div class="list">${L.slice(0, v.lim).map(x => OA.bRow(x)).join('') || '<div class="empty">No lines</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.BM.lim+=100;OA.bulk()">Show more (${L.length - v.lim} left)</button>` : ''}`; };
  OA.bRow = function (x) { const st = ist(x); const sb = OA.bSum(x.acc); const E = OA.bEntries(x.acc); const last = E[E.length - 1];
    return `<button class="li" onclick="OA.bOpen('${x.acc}')"><div class="m" style="min-width:0"><div class="t" style="white-space:normal">${esc(T.desc[x.desc] || x.g)}</div><div class="s">${esc(x.g)} · ${esc(x.sy || '')} · ${esc(String(T.dwg[x.dwg] || '').replace(/^GLE-\(.*?\)-/, ''))}${/^\d+$/.test(String(x.tag)) ? ' · № ' + esc(x.tag) : ''}</div><div class="s">IWP ${fmtn(x.f)} / ${fmtn(x.q)} ${esc(x.u)} · ${fmtn(Math.max(x.q - x.f, 0))} left${sb ? ` · <b>site +${fmtn(sb)} ${esc(x.u)}</b>${last ? ' (' + esc(last.loc || '') + ')' : ''}` : ''}</div></div><span class="badge ${sb ? 'b-part' : st.c}">${sb ? 'Site +' + fmtn(sb) : st.l}</span><span class="chev">›</span></button>`; };
  OA.bOpen = function (acc) { const x = I.find(y => y.acc === acc); if (!x) return; const E = OA.bEntries(acc); const rooms = [...new Set(PAN.map(p => p.room).filter(Boolean))].sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
    modalP(`<div class="h3" style="white-space:normal">${esc(T.desc[x.desc] || x.g)}</div><div style="font-size:12px;color:var(--mut)">${esc(x.g)} · Access ID ${esc(x.acc)} · ${esc(T.dwg[x.dwg] || '')}<br>IWP: ${fmtn(x.f)} / ${fmtn(x.q)} ${esc(x.u)} · remaining ${fmtn(Math.max(x.q - x.f, 0))} ${esc(x.u)}</div>
     <div style="display:flex;gap:8px;margin-top:10px"><input class="fin" id="bq" type="number" inputmode="decimal" placeholder="Qty done today (${esc(x.u)})" style="flex:1;margin:0"></div>
     <div style="display:flex;gap:8px;margin-top:8px"><select id="br" style="flex:1"><option value="">Room…</option>${rooms.map(r => `<option>${esc(r)}</option>`).join('')}</select><input class="fin" id="bl" placeholder="Route / location / remark" style="flex:2;margin:0"></div>
     <button class="tile main" style="width:100%;min-height:auto;margin-top:8px" onclick="OA.bSave('${acc}')"><b>Save</b><span class="n">goes into the progress report to ${REC.en}</span></button>
     ${E.length ? `<div class="sect">Entered on site</div><div class="list">${E.map((e, i) => `<div class="li"><div class="m"><div class="t">+${fmtn(e.q)} ${esc(x.u)}${e.loc ? ' · ' + esc(e.loc) : ''}</div><div class="s">${dstr(e.t)} · ${esc(e.by || '')}${e.s ? ' · sent' : ' · not sent'}</div></div>${e.s ? '' : `<span class="link" onclick="OA.bDel('${acc}',${i})">delete</span>`}</div>`).join('')}</div>` : ''}
     <button class="more" onclick="closeP()">Close</button>`); };
  OA.bSave = function (acc) { if (!who(`OA.bSave('${acc}')`)) return; const q = Number(String(document.getElementById('bq').value).replace(',', '.')); if (!(q > 0)) return toast('Enter the quantity done');
    const loc = [document.getElementById('br').value ? 'room ' + document.getElementById('br').value : '', document.getElementById('bl').value.trim()].filter(Boolean).join(' · ');
    S2.b = S2.b || {}; (S2.b[acc] = S2.b[acc] || []).push({q, loc, t: Date.now(), by: PS_.name}); ssave(); toast('Saved – send the report to ' + REC.en); closeP(); route(); };
  OA.bDel = function (acc, i) { if (!S2.b || !S2.b[acc]) return; S2.b[acc].splice(i, 1); if (!S2.b[acc].length) delete S2.b[acc]; ssave(); closeP(); route(); };
  // bulk entries go into the same progress report as cables and installation lines
  const _pl = window.progLines;
  window.progLines = function (onlyNew) { const out = _pl(onlyNew); Object.entries(S2.b || {}).forEach(([acc, E]) => { const x = I.find(y => y.acc === acc); E.forEach(e => { if (onlyNew && e.s) return; out.push({acc, q: e.q, t: e.t, tag: x ? (x.tag || '') : '', a: (x ? x.g : 'Material') + (e.loc ? ' – ' + e.loc : ''), by: e.by, ref: [e]}); }); }); return out.sort((a, b) => a.t - b.t); };

  // ---------------- routing (called from route() in app.js)
  OA.route = function (rest, cold) { OA.mode = cold ? 'cold' : ''; const a = dec(rest[0] || ''); if (!a) return cold ? OA.coldHome() : OA.home(); return OA.area(a, rest[1] || '', rest.slice(2).map(dec).join('/')); };
  // dashboard on the first page: inserted after the project bar
  const _home = window.home;
  window.home = function () { _home(); const pb = main.firstElementChild; if (pb) pb.insertAdjacentHTML('afterend', OA.dash());
    const kpi = main.querySelector(':scope > .kpi'); if (kpi) kpi.insertAdjacentHTML('afterend', OA.projBars());
    const sect = [...main.querySelectorAll('.sect')].find(e => /Construction/i.test(e.textContent)); const grid = sect && sect.nextElementSibling;
    if (grid) { const B = OA.bulkLines(); const d = B.filter(x => x.done).length; const ent = Object.values(S2.b || {}).reduce((n, E) => n + E.filter(e => !e.s).length, 0);
      grid.insertAdjacentHTML('beforeend', `<button class="tile main" onclick="go('#/bm')"><b>🧱 Bulk materials<br><span style="font-weight:400;font-size:12px">tray · conduits · earthing · supports · MCT</span></b><div><span class="n">${d}/${B.length} lines done${ent ? ' · ' + ent + ' entries to send' : ''}</span><div class="pc">${P(d, B.length)}%</div><div class="pbar"><i style="width:${P(d, B.length)}%"></i></div></div></button>`); } };
  OA.loadIdx(() => { if (atHome()) route(); }); OA.loadDw();
  if (location.hash.startsWith('#/oa')) route();
})();
