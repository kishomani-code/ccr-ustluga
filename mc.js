// v4.5: RFI register (RHI RFI + final subsystem RFI), Mechanical Completion by subsystem, MC block diagram,
// side menu (overall dashboard only here), cross-punch report by tag + title with owner Excel export.
// Data: rfi_<site>.json (subsystem per IWP line, cable RFI from Cable RAWP, equipment RFI from E&I equipment control).
(function () {
  const MC = window.MC = {d: null, busy: false};
  const SITE = PRJ === 'D48' ? 'd48' : PRJ === 'COLD' ? 'cold' : 'ccr';
  const F = 'rfi_' + SITE + '.json', DC = 'appdata-v1';
  const P = (d, n) => n ? Math.round(100 * d / n) : 0;
  const fm = v => fmtn(Math.round(v));
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  MC.load = function (cb) { if (MC.d) return cb && cb(MC.d); if (MC.busy) return; MC.busy = true;
    cget(F).then(d => { if (d && !MC.d) { MC.d = d; MC._s = null; cb && cb(d); } return net(F); }).then(d => { MC.busy = false; if (d && (!MC.d || JSON.stringify(d.src) !== JSON.stringify(MC.d.src) || d.date !== MC.d.date)) { const first = !MC.d; MC.d = d; MC._s = null; if (first && cb) cb(d); } }).catch(() => { MC.busy = false; if (!MC.d) { MC.d = {ss: [], acc: {}, cab: {}, eq: [], date: '', src: ''}; cb && cb(MC.d); } }); };
  const need = fn => { if (MC.d) return true; main.innerHTML = '<div class="empty">Loading RFI / subsystem data… (first time needs internet)</div>'; MC.load(() => fn()); return false; };
  const ssName = s => { if (!s) return ''; if (LANG === 'ru') return s[2] || s[1] || ''; if (s[1] && !/[А-яЁё]/.test(s[1])) return s[1];
    const tok = (String(s[0]).match(/-([A-Z0-9]{3,5})-\d{3}$/) || [])[1] || ''; const k = Object.keys(SYSN).find(k => k.endsWith('-' + tok)); return k ? SYSN[k][0] : ''; };
  const sysOf = code => (String(code).match(/-([A-Z]{3,5})-\d{3}$/) || [])[1] || String(code).split('-').slice(-2, -1)[0] || '-';
  const areaOf = p => String((PT.tit[p.tit] || '')).trim().split(/\s+/)[0];
  const dParse = s => { const m = String(s || '').match(/(\d\d)\.(\d\d)\.(\d{4})/); return m ? Number(m[3] + m[2] + m[1]) : 0; };

  // ---------------- subsystem statistics
  MC.stats = function () { if (MC._s) return MC._s; const d = MC.d, S = d.ss.map((s, k) => ({k, code: s[0], s, it: [], cab: new Set(), eq: [], pu: [], g: {}}));
    const byCode = {}; S.forEach(x => byCode[x.code] = x);
    I.forEach(x => { const k = d.acc[x.acc]; if (k == null || !S[k]) return; S[k].it.push(x); const g = S[k].g[x.g] = S[k].g[x.g] || {n: 0, d: 0, q: 0, f: 0, u: x.u}; g.n++; if (x.done) g.d++; g.q += x.q; g.f += Math.min(x.f, x.q || x.f);
      if (/^Cable (pulling|termination)$/.test(x.g) && CBY[x.tag]) S[k].cab.add(x.tag); });
    Object.entries(d.cab).forEach(([tag, r]) => { if (r[0] >= 0 && S[r[0]] && CBY[tag]) S[r[0]].cab.add(tag); });
    d.eq.forEach(e => { if (e[3] >= 0 && S[e[3]]) S[e[3]].eq.push(e); });
    PU.forEach(p => { const x = byCode[PT.sub[p.sub]]; if (x) x.pu.push(p); });
    S.forEach(x => { const cs = [...x.cab].map(t => CBY[t]).filter(c => !(typeof dead === 'function' && dead(c)));
      x.cn = cs.length; x.cp = cs.filter(c => cst(c).p === true).length; x.ct = cs.filter(c => cst(c).t === true).length; x.cs = cs;
      const rf = cs.map(c => d.cab[c.t]).filter(Boolean); x.lr = rf.filter(r => rfiSt(r[3]) === 'acc').length; x.tr = rf.filter(r => rfiSt(r[9]) === 'acc').length;
      x.en = x.eq.length; x.er = x.eq.filter(e => rfiSt(e[5]) === 'acc').length;
      x.n = x.it.length; x.dn = x.it.filter(i => i.done).length; x.pc = P(x.dn, x.n);
      const op = x.pu.filter(p => p.st === 'Open'); x.pA = op.filter(p => !p.int && p.cat === 'A').length; x.pB = op.filter(p => !p.int && p.cat === 'B').length; x.pR = op.filter(p => p.int).length; x.pO = op.length;
      x.akt = x.s[3] || ''; x.signed = /sign|подпис/i.test(x.akt);
      x.mc = x.n > 0 && x.dn === x.n && x.cp === x.cn && x.ct === x.cn && x.pA === 0;
      x.rfiOk = (x.cn + x.en) > 0 && x.lr === x.cn && x.tr === x.cn && x.er === x.en;
      x.sys = sysOf(x.code); });
    return MC._s = S.filter(x => x.n || x.cn || x.en || x.pu.length); };

  // ---------------- MC home (#/mc) and subsystem view (#/mc/<code>)
  MC.home = function (mode) { if (!need(() => MC.home(mode))) return; const S = MC.stats(); VS.MC = VS.MC || {f: '', q: '', sy: '', v: mode === 'd' ? 'd' : 'l'}; const v = VS.MC; if (mode === 'd') v.v = 'd';
    setHead('Mechanical completion', `${S.length} subsystems · ${PRJ} · data ${MC.d.date || D.meta.date}`); qbox.value = '';
    const syss = [...new Set(S.map(x => x.sys))].sort(); const nq = N(v.q);
    const L = S.filter(x => (!v.sy || x.sys === v.sy) && (!nq || N(x.code + ' ' + ssName(x.s)).includes(nq)) && (!v.f || (v.f === 'mc' ? x.mc : v.f === 'no' ? !x.mc : v.f === 'a' ? x.pA > 0 : v.f === 'rfi' ? x.rfiOk : true)))
      .sort((a, b) => (b.mc - a.mc) || (b.pc - a.pc) || a.code.localeCompare(b.code));
    const nmc = S.filter(x => x.mc).length;
    const head = `<div class="chips">${[['l', '📋 List'], ['d', '🧭 MC block diagram']].map(([k, l]) => `<button class="chip ${v.v === k ? 'on' : ''}" onclick="VS.MC.v='${k}';MC.home()">${l}</button>`).join('')}<button class="chip" onclick="go('#/bd')">⚙️ How the system works</button></div>
     <div class="kpi"><div><b>${S.length}</b><span>subsystems</span></div><div><b style="color:var(--ok)">${nmc}</b><span>MC ready</span></div><div><b style="color:var(--bad)">${S.reduce((n, x) => n + x.pA, 0)}</b><span>open A-punch</span></div></div>
     <div class="note" style="background:#eef3f8;font-size:12px">MC ready = all IWP lines of the subsystem done, all its cables pulled and terminated, no open client A-punch. Subsystem of each IWP line from the IWP status ("Subsistem adi"); cables from the Cable RAWP; equipment from E&I equipment control.</div>
     <input class="fin" placeholder="Subsystem code or name…" value="${esc(v.q)}" oninput="VS.MC.q=this.value;MC.home()">
     <div class="chips">${[['', 'All'], ['mc', '✓ MC ready'], ['no', 'Not ready'], ['a', 'A-punch open'], ['rfi', 'All RFI accepted']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.MC.f='${k}';MC.home()">${l}</button>`).join('')}</div>
     <select onchange="VS.MC.sy=this.value;MC.home()"><option value="">All systems (${syss.length})</option>${syss.map(y => `<option ${v.sy === y ? 'selected' : ''}>${esc(y)}</option>`).join('')}</select>`;
    if (v.v === 'd') { main.innerHTML = head + MC.diagram(L); return; }
    main.innerHTML = head + `<div class="list">${L.map(x => `<button class="li" onclick="go('#/mc/${enc(x.code)}')"><div class="m" style="min-width:0"><div class="t">${x.mc ? '🟢' : x.pA ? '🔴' : '🟡'} ${esc(x.code)}${x.signed ? ' · ✍ AKT' : ''}</div><div class="s" style="white-space:normal">${esc(ssName(x.s))}</div>
      <div class="s">IWP ${x.dn}/${x.n} · cables ${x.cp}/${x.cn} pulled · ${x.ct}/${x.cn} term. · RFI ${x.lr + x.tr + x.er}/${2 * x.cn + x.en} · punch A ${x.pA} B ${x.pB} RHI ${x.pR}</div><div class="pbar" style="margin-top:4px"><i style="width:${x.pc}%"></i></div></div><span class="badge ${x.mc ? 'b-ok' : 'b-no'}">${x.mc ? 'MC ready' : x.pc + '%'}</span><span class="chev">›</span></button>`).join('') || '<div class="empty">No subsystems match</div>'}</div>
     <div class="foot">${esc(MC.d.src || '')}</div>`; };
  MC.diagram = function (L) { if (!L.length) return '<div class="empty">No subsystems</div>'; const g = {}; L.forEach(x => (g[x.sys] = g[x.sys] || []).push(x));
    const cols = Object.keys(g).sort(), bw = 168, bh = 50, gx = 14, gy = 10, cw = bw + gx; const H = Math.max(...cols.map(c => g[c].length)) * (bh + gy) + 40, W = cols.length * cw + 10;
    const col = x => x.mc ? ['#e8f6ee', '#1e8a4c'] : x.pA ? ['#fdecea', '#c62828'] : x.pc >= 70 ? ['#fff6db', '#c99400'] : ['#f3f5f8', '#7a8594'];
    const svg = cols.map((c, ci) => `<text x="${10 + ci * cw}" y="22" font-size="13" font-weight="700" fill="#023362">${esc(c)} (${g[c].length})</text>` + g[c].map((x, ri) => { const X = 10 + ci * cw, Y = 34 + ri * (bh + gy), [bg, st] = col(x);
      return `<g onclick="go('#/mc/${enc(x.code)}')" style="cursor:pointer"><rect x="${X}" y="${Y}" width="${bw}" height="${bh}" rx="8" fill="${bg}" stroke="${st}" stroke-width="2"/><rect x="${X}" y="${Y + bh - 6}" width="${bw * x.pc / 100}" height="6" rx="3" fill="${st}"/>
       <text x="${X + 8}" y="${Y + 17}" font-size="11.5" font-weight="700" fill="#18202b">${esc(x.code.replace(/^G\d-/, ''))}${x.mc ? ' ✓' : ''}</text><text x="${X + 8}" y="${Y + 31}" font-size="9.5" fill="#444">${esc(ssName(x.s).slice(0, 30))}</text><text x="${X + 8}" y="${Y + 42}" font-size="9.5" fill="${st}">${x.pc}% · A ${x.pA} · cab ${x.cp}/${x.cn}</text></g>`; }).join('')).join('');
    return `<div class="note" style="font-size:12px">🟢 MC ready · 🟡 ≥70% · 🔴 open A-punch · ⚪ in progress. Tap a block for details.</div><div class="zw" style="overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;margin-top:6px"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial">${svg}</svg></div>`; };
  MC.view = function (code) { if (!need(() => MC.view(code))) return; const x = MC.stats().find(s => s.code === code); if (!x) { main.innerHTML = '<div class="empty">Subsystem not found</div>'; return; }
    setHead(code, ssName(x.s) || 'subsystem'); const d = MC.d;
    const gl = Object.entries(x.g).sort((a, b) => b[1].n - a[1].n);
    const cOpen = x.cs.filter(c => !cst(c).ok), eOpen = x.eq.filter(e => rfiSt(e[5]) !== 'acc'), pOpen = x.pu.filter(p => p.st === 'Open').sort((a, b) => (a.cat || 'Z').localeCompare(b.cat || 'Z'));
    main.innerHTML = `<div class="card" style="border-left:6px solid ${x.mc ? 'var(--ok)' : 'var(--bad)'}"><div class="big">${x.mc ? '✓ MC ready' : 'Not ready for MC'}</div><div class="s2" style="margin-top:4px">${esc(ssName(x.s))}${x.akt ? ` · Sub-system AKT: <b>${esc(x.akt)}</b>` : ''}</div></div>
     <div class="kpi"><div><b>${x.pc}%</b><span>IWP ${x.dn}/${x.n}</span></div><div><b>${x.cp}/${x.cn}</b><span>cables pulled</span></div><div><b>${x.ct}/${x.cn}</b><span>terminated</span></div></div>
     <div class="kpi"><div><b>${x.lr}/${x.cn}</b><span>laying RFI acc.</span></div><div><b>${x.tr}/${x.cn}</b><span>term. RFI acc.</span></div><div><b>${x.er}/${x.en}</b><span>equipment RFI acc.</span></div></div>
     <div class="kpi"><div><b style="color:var(--bad)">${x.pA}</b><span>client A open</span></div><div><b>${x.pB}</b><span>client B open</span></div><div><b>${x.pR}</b><span>RHI open</span></div></div>
     <div class="card"><div class="h3">IWP activities</div>${gl.map(([g, e]) => OA.bar(e.f, e.q, esc(g), `${fm(e.f)} / ${fm(e.q)} ${esc(e.u)} · ${e.d}/${e.n} lines`)).join('') || '<div class="empty">No IWP lines</div>'}</div>
     ${pOpen.length ? `<div class="card"><div class="h3">Open punch (${pOpen.length})</div><div class="list">${pOpen.slice(0, 80).map(pRow).join('')}</div></div>` : ''}
     ${cOpen.length ? `<div class="card"><div class="h3">Cables not complete (${cOpen.length})</div><div class="list">${cOpen.slice(0, 80).map(c => `<button class="li" onclick="go('#/c/${enc(c.t)}')"><div class="m"><div class="t">${esc(c.t)}</div><div class="s">${esc(c.ty || '')} ${esc(c.c || '')}</div></div><span class="badge ${cst(c).c}">${cst(c).l}</span><span class="chev">›</span></button>`).join('')}</div></div>` : ''}
     ${eOpen.length ? `<div class="card"><div class="h3">Equipment RFI not accepted (${eOpen.length})</div><div class="list">${eOpen.slice(0, 80).map(e => `<div class="li"><div class="m" style="min-width:0"><div class="t" style="word-break:break-all">${esc(e[1] || e[0])}</div><div class="s" style="white-space:normal">${esc(e[2])}${e[4] ? ' · RFI ' + esc(e[4]) : ''}${e[7] ? ' · ITP ' + esc(e[7]) : ''}</div></div>${rfiB(rfiSt(e[5]), e[5])}</div>`).join('')}</div></div>` : ''}`; };

  // ---------------- RFI menu: extra tabs (RFI register = RHI RFI, Subsystem final RFI) + RAWP card on cable view
  const _rfi = window.rfiHome;
  window.rfiHome = function () { const v = VS.RF || {};
    if (v.tab === 'r' || v.tab === 's') { if (!need(() => window.rfiHome())) return; setHead('RFI', `RHI RFI register · final subsystem RFI · data ${MC.d.date || D.meta.date}`); qbox.value = '';
      main.innerHTML = MC.rfTabs() + (v.tab === 'r' ? MC.rfReg() : MC.rfSub()); return; }
    _rfi(); const ch = main.querySelector('.chips'); if (ch) ch.outerHTML = MC.rfTabs(); };
  MC.rfTabs = function () { const v = VS.RF || {tab: 'c'}; return `<div class="chips">${[['c', '🧵 Cables RFI'], ['e', '🎛️ Equipment RFI'], ['r', '📋 RHI RFI register'], ['s', '🏁 Final subsystem RFI']].map(([k, l]) => `<button class="chip ${v.tab === k ? 'on' : ''}" onclick="MC.rfTab('${k}')">${l}</button>`).join('')}</div>`; };
  MC.rfTab = function (k) { if (!VS.RF || !VS.RF.sk) { const tb = k; VS.RF = null; _rfi(); VS.RF.tab = tb; } else VS.RF.tab = k; window.rfiHome(); };
  MC.rfiList = function () { if (MC._r) return MC._r; const R = {}; const add = (no, kind, item, st, dt, itp, iwp, ss) => { if (!no) return; const r = R[no] = R[no] || {no, k: new Set(), items: [], st: {}, dt: '', itp: new Set(), ss: new Set()}; r.k.add(kind); r.items.push({item, st, iwp, kind}); const s = rfiSt(st); r.st[s] = (r.st[s] || 0) + 1; if (dParse(dt) > dParse(r.dt)) r.dt = dt; if (itp) r.itp.add(itp); if (ss >= 0) r.ss.add(ss); };
    Object.entries(MC.d.cab).forEach(([tag, c]) => { add(c[2], 'Cable laying', tag, c[3], c[4], c[5], c[1], c[0]); add(c[8], 'Cable termination', tag, c[9], c[10], '', c[7], c[0]); });
    MC.d.eq.forEach(e => add(e[4], 'Equipment', e[1] || e[0], e[5], e[6], e[7], e[0], e[3]));
    return MC._r = Object.values(R).map(r => Object.assign(r, {n: r.items.length, ok: (r.st.acc || 0), rs: r.st.acc === r.items.length ? 'acc' : r.st.rej ? 'rej' : r.st.sub ? 'sub' : 'none'})); };
  MC.rfReg = function () { VS.RR = VS.RR || {q: '', s: '', k: '', lim: 100}; const v = VS.RR, nq = N(v.q); const A = MC.rfiList();
    const L = A.filter(r => (!v.s || r.rs === v.s) && (!v.k || r.k.has(v.k)) && (!nq || N(r.no).includes(nq) || r.items.some(i => N(i.item).includes(nq)))).sort((a, b) => dParse(b.dt) - dParse(a.dt) || a.no.localeCompare(b.no));
    const cnt = s => A.filter(r => r.rs === s).length;
    return `<div class="mgs"><div class="mgk"><b>${A.length}</b><span>RHI RFIs</span></div><div class="mgk"><b>${cnt('acc')}</b><span>fully accepted</span></div><div class="mgk ${cnt('sub') ? 'bad' : ''}"><b>${cnt('sub')}</b><span>pending (new / planned)</span></div><div class="mgk ${cnt('rej') ? 'bad' : ''}"><b>${cnt('rej')}</b><span>with rejected items</span></div></div>
     <input class="fin" placeholder="RFI No or cable / equipment tag…" value="${esc(v.q)}" oninput="VS.RR.q=this.value;VS.RR.lim=100;rfiHome()">
     <div class="chips">${[['', 'All'], ['acc', 'Accepted'], ['sub', 'Pending'], ['rej', 'Rejected']].map(([k, l]) => `<button class="chip ${v.s === k ? 'on' : ''}" onclick="VS.RR.s='${k}';rfiHome()">${l}</button>`).join('')}${[['', 'All types'], ['Cable laying', 'Laying'], ['Cable termination', 'Termination'], ['Equipment', 'Equipment']].map(([k, l]) => `<button class="chip ${v.k === k ? 'on' : ''}" onclick="VS.RR.k='${k}';rfiHome()">${l}</button>`).join('')}</div>
     <div class="list">${L.slice(0, v.lim).map(r => `<button class="li" onclick="MC.rfOpen(${JSON.stringify(r.no).replace(/"/g, '&quot;')})"><div class="m" style="min-width:0"><div class="t" style="word-break:break-all">${esc(r.no)}</div><div class="s">${[...r.k].join(' · ')} · ${r.n} items · ${r.ok} accepted${r.itp.size ? ' · ITP ' + [...r.itp].join(', ') : ''}${r.dt ? ' · ' + esc(r.dt) : ''}</div></div>${rfiB(r.rs, '')}<span class="chev">›</span></button>`).join('') || '<div class="empty">No RFI</div>'}</div>
     ${L.length > v.lim ? `<button class="more" onclick="VS.RR.lim+=200;rfiHome()">Show more (${L.length - v.lim})</button>` : ''}<div class="foot">RHI RFIs (ЗПИ) from the Cable RAWP inspection progress (laying / termination, with IWP unique name) and the E&I equipment control.</div>`; };
  MC.rfOpen = function (no) { const r = MC.rfiList().find(x => x.no === no); if (!r) return;
    modalP(`<div class="h3" style="word-break:break-all">${esc(no)}</div><div class="s2">${[...r.k].join(' · ')} · ${r.n} items · ${r.ok} accepted${r.dt ? ' · ' + esc(r.dt) : ''}</div>
     <div class="list" style="max-height:55vh;overflow:auto;margin-top:8px">${r.items.map(i => `<div class="li" ${CBY[i.item] ? `onclick="closeP();go('#/c/${enc(i.item)}')"` : ''}><div class="m" style="min-width:0"><div class="t" style="word-break:break-all">${esc(i.item)}</div><div class="s" style="word-break:break-all">${esc(i.kind)}${i.iwp ? ' · IWP ' + esc(i.iwp) : ''}</div></div>${rfiB(rfiSt(i.st), i.st)}</div>`).join('')}</div><button class="more" onclick="closeP()">Close</button>`); };
  MC.rfSub = function () { VS.RS = VS.RS || {f: '', q: ''}; const v = VS.RS, nq = N(v.q); const S = MC.stats().filter(x => x.cn || x.en);
    const L = S.filter(x => (!nq || N(x.code + ' ' + ssName(x.s)).includes(nq)) && (!v.f || (v.f === 'ok' ? x.rfiOk : v.f === 'akt' ? x.signed : !x.rfiOk))).sort((a, b) => (b.rfiOk - a.rfiOk) || a.code.localeCompare(b.code));
    const ready = S.filter(x => x.rfiOk && x.pA === 0 && !x.signed).length;
    return `<div class="mgs"><div class="mgk"><b>${S.length}</b><span>subsystems</span></div><div class="mgk"><b>${S.filter(x => x.rfiOk).length}</b><span>all RFI accepted</span></div><div class="mgk"><b>${ready}</b><span>ready for final RFI</span><i>RFI ok · no A-punch · AKT not signed</i></div><div class="mgk"><b>${S.filter(x => x.signed).length}</b><span>AKT signed</span></div></div>
     <input class="fin" placeholder="Subsystem…" value="${esc(v.q)}" oninput="VS.RS.q=this.value;rfiHome()">
     <div class="chips">${[['', 'All'], ['ok', 'All RFI accepted'], ['no', 'RFI open'], ['akt', 'AKT signed']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.RS.f='${k}';rfiHome()">${l}</button>`).join('')}</div>
     <div class="mgw"><table class="mgtb"><thead><tr><th>Subsystem</th><th>Laying RFI</th><th>Term. RFI</th><th>Equip. RFI</th><th>A-punch</th><th>AKT</th></tr></thead><tbody>${L.map(x => `<tr><td style="white-space:normal;min-width:130px"><span class="link" onclick="go('#/mc/${enc(x.code)}')">${esc(x.code)}</span><div class="s2">${esc(ssName(x.s).slice(0, 60))}</div></td>
      <td style="${x.lr === x.cn ? 'color:var(--ok)' : ''}">${x.lr}/${x.cn}</td><td style="${x.tr === x.cn ? 'color:var(--ok)' : ''}">${x.tr}/${x.cn}</td><td style="${x.er === x.en ? 'color:var(--ok)' : ''}">${x.er}/${x.en}</td><td style="${x.pA ? 'color:var(--bad);font-weight:700' : ''}">${x.pA}</td><td>${x.signed ? '✍ ' : ''}${esc(x.akt || '—')}</td></tr>`).join('')}</tbody></table></div>
     <div class="foot">Final subsystem RFI: all cable laying + termination RFIs and all equipment RFIs of the subsystem accepted, no open client A-punch → the sub-system acceptance (AKT) can be called. AKT status from the Cable RAWP.</div>`; };
  const _cv = window.cableView;
  window.cableView = function (t) { _cv(t); if (!MC.d) return MC.load(() => { if (location.hash === '#/c/' + enc(t)) route(); }); const r = MC.d.cab[t]; if (!r) return; const s = MC.d.ss[r[0]];
    const ln = (k, iwp, no, res, dt, itp) => `<div style="margin:4px 0"><b>${k}</b>: ${no ? esc(no) + ' ' + rfiB(rfiSt(res), res) : '<span class="badge b-na">No RFI</span>'}${dt ? ' · ' + esc(dt) : ''}${itp ? ' · ITP ' + esc(itp) : ''}${iwp ? `<div class="s2" style="word-break:break-all">IWP: ${esc(iwp)}</div>` : ''}</div>`;
    main.insertAdjacentHTML('beforeend', `<div class="card"><div class="h3">RFI (Cable RAWP)</div>${ln('Laying', r[1], r[2], r[3], r[4], r[5])}${ln('Termination', r[7], r[8], r[9], r[10], '')}${s ? `<div class="s2" style="margin-top:6px">Subsystem <span class="link" onclick="go('#/mc/${enc(s[0])}')">${esc(s[0])}</span>${ssName(s) ? ' · ' + esc(ssName(s)) : ''}${s[3] ? ' · AKT ' + esc(s[3]) : ''}</div>` : ''}</div>`); };

  // ---------------- block diagrams: two types
  const _bd = window.bdHome;
  window.bdHome = function () { _bd(); main.insertAdjacentHTML('afterbegin', `<div class="chips"><button class="chip on">⚙️ How the system works</button><button class="chip" onclick="go('#/mc/~d')">🏁 Mechanical completion – subsystems</button></div>`); };

  // ---------------- cross-punch: same tag + same title (area), client vs RHI
  MC.xGroups = function () { const G = {}; PU.forEach(p => { if (!p._t) return; const k = p._t + '|' + areaOf(p); const g = G[k] = G[k] || {tag: p.tag, area: areaOf(p), c: [], r: []}; (p.int ? g.r : g.c).push(p); });
    const rep = [], close = [], ask = [];
    Object.values(G).forEach(g => { if (!g.c.length) return; g.c.sort((a, b) => dParse(a.idate) - dParse(b.idate) || String(a.no).localeCompare(String(b.no), undefined, {numeric: true})); const last = g.c[g.c.length - 1];
      if (last.st === 'Closed') { g.c.slice(0, -1).filter(p => p.st === 'Open').forEach(p => rep.push({g, p, last})); g.r.filter(p => p.st === 'Open').forEach(p => close.push({g, p, last})); }
      else g.r.filter(p => p.st === 'Closed').forEach(p => ask.push({g, p, last})); });
    return {rep, close, ask}; };
  window.xPunch = p => { const a = areaOf(p); return p._t ? PU.filter(q => q !== p && q._t === p._t && areaOf(q) === a && q.int !== p.int) : []; };
  window.xPunchText = function () { const X = MC.xGroups(); const cl = v => (v == null || v === 'None') ? '' : String(v); const ln = p => `${p.no} | ${cl(p.den) || cl(p.dru) || cl(p.tagd)}`.replace(/\s+/g, ' ').trim().slice(0, 140) + ` | ${t(p.st)} | ${cl(p.idate)}`;
    const sec = (title, L, f) => L.length ? `${title} (${L.length})\n` + L.map(f).join('\n') + '\n\n' : '';
    const text = `${t('Cross-punch report')} · ${PRJ} · ${tstr(Date.now())}${PS_.name ? ' · ' + PS_.name : ''}\n${t('Same tag and same title in client punch list and RHI punch register')}\n\n` +
      sec('1. ' + t('Old client punch – can be reported closed (latest client punch for the tag is closed)'), X.rep, r => `${r.g.area} · ${r.g.tag}\n  ${t('Report')}: ${ln(r.p)}\n  ${t('Latest closed')}: ${r.last.no} ${r.last.cdate || ''}`) +
      sec('2. ' + t('RHI punch – can be closed (client punch for the tag is closed)'), X.close, r => `${r.g.area} · ${r.g.tag}\n  RHI: ${ln(r.p)}\n  ${t('Client closed')}: ${r.last.no} ${r.last.cdate || ''}`) +
      sec('3. ' + t('Client punch still open – RHI punch already closed (ask client to close)'), X.ask, r => `${r.g.area} · ${r.g.tag}\n  ${t('Client open')}: ${ln(r.last)}\n  RHI ${t('closed')}: ${r.p.no} ${r.p.cdate || ''}`);
    return {n: X.rep.length + X.close.length + X.ask.length, text, X}; };
  window.openXPunch = function () { const r = window.xPunchText(); REP = {kind: 'xpunch', L: [], text: r.text};
    modalP(`<div class="h3">🔗 Cross-punch report</div><div class="mgs"><div class="mgk"><b>${r.X.rep.length}</b><span>old client punch to report</span></div><div class="mgk"><b>${r.X.close.length}</b><span>RHI punch to close</span></div><div class="mgk"><b>${r.X.ask.length}</b><span>client open · RHI closed</span></div></div>
     <div class="s2" style="margin:4px 0">Matched by tag + title (area). Latest client punch closed → older client punches of the same tag/title can be reported, and RHI punches of the same tag/title can be closed.</div>
     <textarea id="rtx" class="fin" style="height:220px;font:12px monospace;white-space:pre" readonly>${esc(r.text)}</textarea>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="copyText(REP.text).then(ok=>toast(ok?'Copied':'Select the text and copy'))"><b>📋 Copy</b></button>
     <button class="tile main" style="min-height:auto" onclick="MC.xExcel()"><b>⬇ Excel${S2.owner ? '' : ' 🔒'}</b><span class="n">owner</span></button></div><button class="more" onclick="closeP()">Close</button>`); };
  MC.xExcel = function () { if (!S2.owner) return ownerLogin(); if (!window.XL) return toast('Excel module not loaded'); const X = MC.xGroups();
    const H = ['Title', 'Tag', 'Punch No', 'Source', 'Category', 'Description', 'Status', 'Issue date', 'Close date', 'Reference punch No', 'Reference status', 'Reference close date', 'Action'];
    const row = (r, src, act, ref) => [r.g.area, r.g.tag, r.p.no, src, r.p.cat || '', String((r.p.den !== 'None' && r.p.den) || (r.p.dru !== 'None' && r.p.dru) || '').slice(0, 250), r.p.st, r.p.idate || '', r.p.cdate || '', ref.no, ref.st, ref.cdate || '', act];
    const sh = (name, L, src, act, refFn) => ({name, rows: [H].concat(L.map(r => row(r, src, act, refFn(r)))), widths: [14, 30, 12, 9, 8, 60, 8, 11, 11, 14, 10, 12, 34], bold: [0], freeze: 1});
    XL.save(`${PRJ}_cross_punch_${dstr(Date.now())}.xlsx`, [sh('Client to report', X.rep, 'Client', 'Report closed – latest client punch closed', r => r.last), sh('RHI to close', X.close, 'RHI', 'Close RHI punch – client punch closed', r => r.last), sh('Client open RHI closed', X.ask, 'RHI', 'Ask client to close', r => r.last)]); };
  window.xPunchCard = function (p) { const L = window.xPunch(p); if (!L.length) return '';
    return `<div class="card" style="border-left:5px solid var(--acc)"><div class="h3">${p.int ? 'Client punch – same tag & title' : 'RHI punch – same tag & title'} (${L.length})</div><div class="list">${L.map(q => `<button class="li" onclick="go('#/pi/${q.i}')"><div class="m"><div class="t">№ ${esc(q.no)}</div><div class="s" style="white-space:normal">${esc(q.den || q.dru || '')}</div></div><div class="r">${pb(q)}</div><span class="chev">›</span></button>`).join('')}</div></div>`; };

  // ---------------- side menu (☰) – overall dashboard lives only here
  const showTot = () => { try { return localStorage.getItem('gpp_showtot') === '1'; } catch (e) { return false; } };
  MC.side = function () { let m = document.getElementById('sidem'); if (m) { m.remove(); return; }
    const it = (ic, l, h, on, nt) => `<button class="smi ${on ? 'on' : ''}" ${nt ? 'data-nt="1"' : ''} onclick="document.getElementById('sidem').remove();${h}">${ic} ${nt ? l : t(l)}</button>`;
    const L = [['en', 'English'], ['ru', 'Русский'], ['tr', 'Türkçe'], ['hi', 'हिन्दी']];
    m = document.createElement('div'); m.id = 'sidem';
    m.innerHTML = `<div class="smb" onclick="document.getElementById('sidem').remove()"></div><nav class="smp"><div class="smh">Ust-Luga GPP · E&I</div>
      ${it('📊', 'Overall dashboard (total project)', "go('#/td')")}
      <div class="sms">Projects</div>${it('🏢', 'CCR', "projSwitch('CCR')", PRJ === 'CCR', 1)}${it('⚡', 'D48', "projSwitch('D48')", PRJ === 'D48', 1)}${it('❄️', LANG === 'ru' ? 'Холодные кабели' : 'Cold cables', "projSwitch('COLD')", PRJ === 'COLD', 1)}${it('🌍', 'Other area', "go('#/oa')")}
      <div class="sms">${PRJ === 'COLD' ? 'Cold cables' : PRJ}</div>${it('🏠', 'Home', "go('#/')")}${it('🔍', 'RFI', "go('#/rf')")}${it('🏁', 'Mechanical completion', "go('#/mc')")}${it('🧭', 'System block diagrams', "go('#/bd')")}${it('📝', 'Punch list', "go('#/pl')")}${it('🔗', 'Cross-punch report', "openXPunch()")}${window.LT ? it('🔒', 'LOTO', "go('#/lt')") : ''}${it('💡', 'Can report', "go('#/cr')")}
      <div class="sms">Language</div><div style="display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 8px">${L.map(([k, l]) => `<button class="chip ${LANG === k ? 'on' : ''}" data-nt="1" onclick="document.getElementById('sidem').remove();setLang('${k}')">${l}</button>`).join('')}</div>
      <label class="smi" style="display:flex;gap:8px;align-items:center"><input type="checkbox" ${showTot() ? 'checked' : ''} onchange="try{localStorage.setItem('gpp_showtot',this.checked?'1':'0')}catch(e){};document.getElementById('sidem').remove();route()"> Show total project on CCR / D48 home</label>
      <div class="smf">v${APPV}+ · data ${esc(D.meta.date)}</div></nav>`;
    document.body.appendChild(m); };
  MC.td = function () { setHead('Overall dashboard', 'total project · all areas'); qbox.value = ''; if (!window.OA) { main.innerHTML = '<div class="empty">Not available</div>'; return; }
    main.innerHTML = OA.dash(); };
  (function () { const r = document.querySelector('header .hrow'); if (r && !document.getElementById('smbtn')) r.insertAdjacentHTML('afterbegin', '<button class="hbtn" id="smbtn" onclick="MC.side()" title="Menu" style="font-size:22px">☰</button>');
    const st = document.createElement('style'); st.textContent = `#sidem{position:fixed;inset:0;z-index:60}#sidem .smb{position:absolute;inset:0;background:rgba(0,0,0,.35)}#sidem .smp{position:absolute;left:0;top:0;bottom:0;width:min(300px,84vw);background:#fff;overflow:auto;box-shadow:2px 0 12px rgba(0,0,0,.25);padding-bottom:20px}
      #sidem .smh{background:#023362;color:#fff;font-weight:700;padding:16px 14px;font-size:15px}#sidem .sms{font-size:11px;text-transform:uppercase;color:#687384;padding:12px 14px 4px;letter-spacing:.04em}#sidem .smi{display:block;width:100%;text-align:left;background:none;border:0;padding:11px 14px;font-size:14.5px;color:#18202b;border-bottom:1px solid #f0f2f5}#sidem .smi.on{background:#eef3f8;font-weight:700}#sidem .smf{font-size:11px;color:#8a94a3;padding:12px 14px}`;
    document.head.appendChild(st); })();

  // ---------------- routes
  const _route = window.route;
  window.route = function () { const h = location.hash.replace(/^#\//, ''); const [k, ...rest] = h.split('/');
    if (k === 'mc') { window.scrollTo(0, 0); const a = dec(rest.join('/')); return a === '~d' ? MC.home('d') : a ? MC.view(a) : MC.home(); }
    if (k === 'td') { window.scrollTo(0, 0); return MC.td(); }
    return _route(); };
  // home: Mechanical completion tile next to RFI, total project dashboard only when switched on (never for cold cables)
  const _home = window.home;
  window.home = function () { _home(); const rs = [...main.querySelectorAll('.sect')].find(e => /Inspection/i.test(e.textContent)); const g = rs && rs.nextElementSibling;
    if (g) g.insertAdjacentHTML('beforeend', `<button class="tile main" onclick="go('#/mc')"><b>🏁 Mechanical completion<br><span style="font-weight:400;font-size:12px">subsystems · MC ready · final RFI</span></b><div><span class="n">${MC.d ? MC.stats().filter(x => x.mc).length + ' / ' + MC.stats().length + ' subsystems ready' : 'open'}</span></div></button>`); };
  MC.load(() => { const k = location.hash.replace(/^#\/?/, '').split('/')[0]; if (!k || k === 'mc' || k === 'rf') route(); });
  if (/^#\/(mc|td)/.test(location.hash)) route();
})();
