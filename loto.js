// v4.4: LOTO (lockout / tagout) – which breaker / panel feeds an item, what is live, what must be isolated before work.
// Live sources are declared by the owner (password) and shared through loto.json in the repo; every phone reads it.
(function () {
  const LT = window.LT = {file: null, local: null, g: {}};
  const DC = 'appdata-v1';
  const TAG = /G\d-[A-Z0-9]{3,}(?:-[A-Z0-9()]+)+/g;
  const BRK = /\b((?:Q|QF|SF|F|QS|QFD|QD|SA|АВ|QF\d)[\s-]?\d+[A-Z0-9.\-/]*)/i;
  const nodeOf = t => { const m = (String(t || '').match(TAG) || []).filter(x => !/^G\d-[A-Z]\d{4}[A-Z]{2}\d$/.test(x) && !x.endsWith('-WP01')); return m.length ? m.reduce((a, b) => b.length > a.length ? b : a) : ''; };
  LT.nodeOf = nodeOf;
  const P = (d, n) => n ? Math.round(100 * d / n) : 0;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  LT.load = function (cb) { if (LT.file) return cb && cb(); cget('loto.json').then(d => { if (d) { LT.file = d; cb && cb(); } return net('loto.json'); }).then(d => { if (d && (!LT.file || d.ver !== LT.file.ver)) { LT.file = d; cb && cb(); } }).catch(() => { if (!LT.file) { LT.file = {ver: '', date: '', live: []}; cb && cb(); } }); };
  // local (owner) entries live in S2.loto on this phone until they reach loto.json
  LT.live = function () { const F = (LT.file && LT.file.live) || []; const L = (S2.loto || []); const m = {}; F.forEach(x => m[x.tag] = Object.assign({src: 'file'}, x)); L.forEach(x => m[x.tag] = Object.assign({src: 'phone'}, x)); return Object.values(m).filter(x => !x.off); };

  // ---------------- graph of one cable list: node -> cables in / out
  // cab: {t, f, o, sys, ps} ; returns {nodes:{tag:{in:[cab], out:[cab], txt}}, cabs}
  LT.graph = function (key, list) { if (LT.g[key]) return LT.g[key]; const nodes = {};
    const add = (tag, txt) => nodes[tag] || (nodes[tag] = {tag, in: [], out: [], txt: txt || '', sys: {}});
    list.forEach(c => { const a = nodeOf(c.f), b = nodeOf(c.o); if (!a && !b) return; c.a = a; c.b = b;
      if (a) { const n = add(a, c.f); n.out.push(c); if (c.sys) n.sys[c.sys] = 1; }
      if (b) { const n = add(b, c.o); n.in.push(c); if (c.sys) n.sys[c.sys] = 1; } });
    return LT.g[key] = {nodes, cabs: list}; };
  LT.projList = function () { return C.map(c => ({t: c.t, f: c.f, o: c.o, sys: (typeof CSYS !== 'undefined' && CSYS[c.i]) || (String(c.d || '').match(/\b([A-Z]{2}-[A-Z0-9]{3,5})\b/) || [])[1] || '', ps: c.tp, ty: c.ty, c: c.c, i: c.i})); };
  LT.cur = function () { return LT.graph('P:' + PRJ, LT.projList()); };
  // energised set: everything downstream of the declared live nodes (through From -> To of every cable)
  LT.energised = function (G) { const live = LT.live().map(x => x.tag); const E = {}; const q = [];
    live.forEach(t => { if (G.nodes[t]) { E[t] = {via: null, src: t}; q.push(t); } });
    while (q.length) { const t = q.shift(); const n = G.nodes[t]; n.out.forEach(c => { if (c.b && !E[c.b]) { E[c.b] = {via: c.t, src: E[t].src, from: t}; q.push(c.b); } }); }
    return E; };
  // upstream chain of one node: feeding cables -> feeding panels, up to the sources (max 6 levels)
  LT.chain = function (G, tag, depth) { depth = depth || 0; const n = G.nodes[tag]; if (!n || depth > 6) return [];
    return n.in.slice().sort((x, y) => (LT.isPow(y) ? 1 : 0) - (LT.isPow(x) ? 1 : 0)).map(c => ({c, from: c.a, txt: G.nodes[c.a] ? G.nodes[c.a].txt : c.f, up: c.a && c.a !== tag ? LT.chain(G, c.a, depth + 1) : []})); };
  LT.isPow = c => /^\d+[xх×]\d+([.,]\d+)?$/.test(String(c.c || '').replace(/\s/g, '')) && !/P\d|FO|RJ|LAN|оптич/i.test(String(c.ty || '') + String(c.t || ''));
  LT.brk = txt => { const m = String(txt || '').match(BRK); return m ? m[1] : ''; };
  LT.term = function (cab, side) { if (typeof lrRows !== 'function' || typeof CBY === 'undefined') return []; const c = CBY[cab]; if (!c) return [];
    return lrRows(cab).filter(r => (side === 'F' ? N(c.f) : N(c.o)).includes(N(r.pan).slice(-10))).map(r => `${r.tb || ''}${r.tn ? ':' + r.tn : ''}`).filter(x => x && x !== ':'); };
  const stBadge = (t, E) => !t ? '' : LT.live().some(x => x.tag === t) ? '<span class="badge b-no">⚡ LIVE</span>' : E[t] ? `<span class="badge b-no">🔴 ENERGISED via ${esc(E[t].src)}</span>` : '<span class="badge b-ok">⚪ not live</span>';
  LT.find = (G, q) => { const nq = N(q); if (nq.length < 3) return []; return Object.keys(G.nodes).filter(t => N(t).includes(nq)).sort().slice(0, 60); };

  // ---------------- views
  LT.home = function (G, base, title) { G = G || LT.cur(); base = base || '#/lt'; VS.LT = VS.LT || {q: ''}; const v = VS.LT;
    const E = LT.energised(G); const live = LT.live(); const en = Object.keys(E).filter(t => !live.some(x => x.tag === t));
    const bySys = {}; en.forEach(t => Object.keys(G.nodes[t].sys).forEach(s => (bySys[s] = bySys[s] || []).push(t)));
    setHead('🔒 LOTO – ' + (title || PRJ), `${live.length} live sources · ${en.length} energised items · ${Object.keys(G.nodes).length} panels / devices`); qbox.value = '';
    const hits = LT.find(G, v.q);
    main.innerHTML = `<div class="card" style="border-left:5px solid #b42318;background:#fff5f4;font-size:13px"><b>Before work on any panel, JB or device:</b> search it here, open the isolation card, lock out and tag the breaker shown. If the item is ⚡ LIVE or 🔴 ENERGISED, no work without LOTO and permit.</div>
     <input class="fin" placeholder="Panel / JB / device tag…" value="${esc(v.q)}" oninput="VS.LT.q=this.value;LT.home(null,'${base}')">
     ${hits.length ? `<div class="list">${hits.map(t => `<button class="li" onclick="go('${base}/${enc(t)}')"><div class="m"><div class="t">${esc(t)}</div><div class="s">${esc((G.nodes[t].txt || '').slice(0, 70))} · ${G.nodes[t].in.length} in / ${G.nodes[t].out.length} out</div></div>${stBadge(t, E)}<span class="chev">›</span></button>`).join('')}</div>` : v.q.length >= 3 ? '<div class="empty">No panel / device found</div>' : ''}
     <div class="sect">⚡ Live sources (declared by owner)</div><div class="list">${live.map(x => `<button class="li" onclick="go('${base}/${enc(x.tag)}')"><div class="m"><div class="t">${esc(x.tag)}</div><div class="s">${esc(x.note || '')} · ${esc(x.by || '')} ${esc(x.date || '')} · ${x.src === 'phone' ? 'this phone (not yet in loto.json)' : 'loto.json'}</div></div><span class="badge b-no">⚡ LIVE</span>${S2.owner ? `<span class="link" onclick="event.stopPropagation();LT.off('${esc(x.tag)}')">off</span>` : ''}</button>`).join('') || '<div class="empty">No live source declared – treat everything as unknown, confirm with the engineer</div>'}</div>
     ${S2.owner ? `<button class="tile main" style="width:100%;min-height:auto;margin-top:8px" onclick="LT.add()"><b>🔑 Declare a panel LIVE (owner)</b><span class="n">downstream panels, JBs, devices and cables are flagged automatically</span></button><button class="more" onclick="LT.exportJ()">📋 Copy loto.json text for GitHub / engineer</button>` : `<div style="font-size:12px;color:var(--mut);margin:8px 2px">Only the owner can declare a system live (Owner menu → password).</div>`}
     <div class="sect">🔴 Energised by system (${en.length})</div>${Object.keys(bySys).sort().map(s => `<div class="card" style="padding:10px"><b>${esc(s)}</b> · ${bySys[s].length}<div style="font-size:12px;margin-top:4px">${bySys[s].slice(0, 40).map(t => `<span class="link" onclick="go('${base}/${enc(t)}')">${esc(t)}</span>`).join(' · ')}${bySys[s].length > 40 ? ' …' : ''}</div></div>`).join('')}${en.filter(t => !Object.keys(G.nodes[t].sys).length).length ? `<div class="card" style="padding:10px"><b>no system</b><div style="font-size:12px;margin-top:4px">${en.filter(t => !Object.keys(G.nodes[t].sys).length).slice(0, 60).map(t => `<span class="link" onclick="go('${base}/${enc(t)}')">${esc(t)}</span>`).join(' · ')}</div></div>` : ''}
     <div class="foot">Feeding direction = cable From → To in the cable tracker. Breaker / terminal numbers come from the LR termination data where available; otherwise from the panel text. Always verify on the panel schedule before isolating.</div>`; };
  LT.item = function (G, tag, base) { G = G || LT.cur(); base = base || '#/lt'; const n = G.nodes[tag]; const E = LT.energised(G);
    setHead('🔒 LOTO · ' + tag, (n ? n.txt.slice(0, 60) : 'not in cable list'));
    if (!n) { main.innerHTML = `<div class="empty">${esc(tag)} is not in the cable tracker From / To of this project – no feeder known. Ask the engineer.</div>`; return; }
    const lv = LT.live().some(x => x.tag === tag), e = E[tag];
    const chain = LT.chain(G, tag);
    const row = (ch, lvl) => { const f = ch.from; const brk = LT.brk(ch.txt) || LT.brk(ch.c.f); const term = LT.term(ch.c.t, 'F'); const st = f ? (LT.live().some(x => x.tag === f) ? 'live' : E[f] ? 'en' : 'ok') : 'unk';
      return `<div style="margin-left:${lvl * 14}px;border-left:3px solid ${st === 'live' ? '#b42318' : st === 'en' ? '#e0a100' : '#9aa'};padding:6px 8px;margin-bottom:6px;background:${st === 'live' ? '#fff5f4' : '#fff'}">
        <div style="font-size:12px;color:var(--mut)">${lvl === 0 ? 'fed by' : 'which is fed by'} cable <b>${esc(ch.c.t)}</b> ${esc(ch.c.ty || '')} ${esc(ch.c.c || '')} <span class="badge ${LT.isPow(ch.c) ? 'b-no' : 'b-na'}">${LT.isPow(ch.c) ? 'POWER' : 'signal / data'}</span>${ch.c.ps === 'Completed' ? ' · pulled' : ' · not pulled'}</div>
        <div><b>${f ? `<span class="link" onclick="go('${base}/${enc(f)}')">${esc(f)}</span>` : esc(ch.txt.slice(0, 60))}</b> ${f ? stBadge(f, E) : '<span class="badge b-na">no tag</span>'}</div>
        <div style="font-size:13px;margin-top:3px">🔒 Isolate at: <b>${brk ? esc(brk) : 'breaker not in data'}</b>${term.length ? ` · terminals ${esc(term.slice(0, 6).join(', '))}` : ''}${!brk && !term.length ? ' – check the panel schedule / LR drawing' : ''}</div>
        <div style="font-size:12px;color:var(--mut)">${esc(ch.txt.slice(0, 120))}</div>
        ${ch.up.map(u => row(u, lvl + 1)).join('')}</div>`; };
    const down = n.out.map(c => c.b).filter(Boolean);
    main.innerHTML = `<div class="card" style="border-left:5px solid ${lv || e ? '#b42318' : '#1f8a4c'};background:${lv || e ? '#fff5f4' : '#f3fbf5'}"><div class="big">${esc(tag)}</div><div style="margin:6px 0">${lv ? '<span class="badge b-no" style="font-size:13px">⚡ DECLARED LIVE</span>' : e ? `<span class="badge b-no" style="font-size:13px">🔴 ENERGISED – fed from live ${esc(e.src)}</span>` : '<span class="badge b-ok" style="font-size:13px">⚪ No live source upstream (per data)</span>'}</div><div style="font-size:13px">${esc(n.txt.slice(0, 160))}</div>
      ${lv || e ? `<div style="margin-top:8px;font-weight:700;color:#b42318">⛔ Do not open or work on this item before LOTO: lock out + tag the breaker(s) in the chain below, test dead, then start. Permit required.</div>` : '<div style="margin-top:8px;font-size:12px;color:var(--mut)">No declared live source upstream. Still test dead before work – data can be incomplete.</div>'}
      ${S2.owner ? `<div style="margin-top:8px">${lv ? `<button class="chip" onclick="LT.off('${esc(tag)}')">owner: set not live</button>` : `<button class="chip" onclick="LT.add('${esc(tag)}')">owner: declare LIVE</button>`}</div>` : ''}</div>
     <div class="sect">🔌 Supply chain – where to isolate (${chain.length} incoming cables)</div>${chain.length ? chain.map(ch => row(ch, 0)).join('') : '<div class="empty">No incoming cable in the tracker – this is a source or the feeder is not in the data.</div>'}
     <div class="sect">⬇ Fed from this item (${down.length})</div><div class="card" style="padding:10px;font-size:12px">${[...new Set(down)].slice(0, 80).map(t => `<span class="link" onclick="go('${base}/${enc(t)}')">${esc(t)}</span>${E[t] ? ' 🔴' : ''}`).join(' · ') || '–'}</div>
     ${typeof PBY !== 'undefined' && PBY[tag] ? `<button class="more" onclick="go('#/p/${enc(tag)}')">Open panel page ›</button>` : ''}`; };
  LT.add = function (tag) { if (!S2.owner) return ownerLogin(); modalP(`<div class="h3">⚡ Declare LIVE (owner)</div><input class="fin" id="ltag" placeholder="Panel / switchboard tag" value="${esc(tag || '')}"><input class="fin" id="lnote" placeholder="Note: energised from …, date of energisation, permit no">
     <button class="tile main" style="width:100%;min-height:auto" onclick="LT.save()"><b>Save – flag everything downstream</b></button><button class="more" onclick="closeP()">Cancel</button>`); };
  LT.save = function () { const tag = document.getElementById('ltag').value.trim(), note = document.getElementById('lnote').value.trim(); if (!tag) return toast('Enter the tag');
    S2.loto = (S2.loto || []).filter(x => x.tag !== tag); S2.loto.push({tag, note, by: PS_.name || 'owner', date: new Date().toLocaleDateString('ru-RU'), area: PRJ}); ssave(); closeP(); toast('Saved on this phone – copy loto.json to share'); route(); };
  LT.off = function (tag) { if (!S2.owner) return; S2.loto = (S2.loto || []).filter(x => x.tag !== tag); if ((LT.file.live || []).some(x => x.tag === tag)) S2.loto.push({tag, off: 1, by: PS_.name || 'owner', date: new Date().toLocaleDateString('ru-RU')}); ssave(); route(); };
  LT.exportJ = function () { const live = LT.live().map(x => ({tag: x.tag, area: x.area || PRJ, note: x.note || '', by: x.by || '', date: x.date || ''})); const t = JSON.stringify({ver: new Date().toISOString().slice(0, 16), date: new Date().toLocaleDateString('ru-RU'), live}, null, 1);
    copyText(t).then(ok => toast(ok ? 'Copied – paste into loto.json on GitHub (or send to the engineer)' : 'Copy failed')); if (navigator.share) navigator.share({text: t}).catch(() => {}); };

  // ---------------- banners on cable / panel / item pages of the project
  LT.banner = function (tags, cab) { const G = LT.cur(); const E = LT.energised(G); const live = LT.live();
    const hot = tags.filter(Boolean).map(t => ({t, lv: live.some(x => x.tag === t), e: E[t]})).filter(x => x.lv || x.e);
    if (cab) { const c = G.cabs.find(k => k.t === cab); if (c && c.a && (live.some(x => x.tag === c.a) || E[c.a])) hot.unshift({t: c.a, lv: live.some(x => x.tag === c.a), e: E[c.a], cable: true}); }
    if (!hot.length) return '';
    return `<div class="card" style="border-left:5px solid #b42318;background:#fff5f4"><div class="h3" style="color:#b42318">⚡ LIVE – LOTO required before work</div>${hot.map(x => `<div style="font-size:13px">${x.cable ? 'This cable comes from ' : ''}<b>${esc(x.t)}</b> is ${x.lv ? 'declared LIVE' : 'energised from ' + esc(x.e.src)} · <span class="link" onclick="go('#/lt/${enc(x.t)}')">isolation card ›</span></div>`).join('')}</div>`; };
  const wrap = (name, tagsOf) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function () { f.apply(this, arguments); try { const b = LT.banner.apply(null, tagsOf.apply(null, arguments)); if (b) main.insertAdjacentHTML('afterbegin', b); } catch (e) {} }; };
  wrap('cableView', t => { const c = CBY[t]; return [c ? [nodeOf(c.f), nodeOf(c.o)] : [], t]; });
  wrap('panelView', t => [[t]]);
  wrap('itemView', i => { const x = I[i]; return [x ? [x.tag, nodeOf(x.tag)] : []]; });

  // ---------------- routing: #/lt, #/lt/<tag> (project) · #/oa/<AREA>/lt[/<tag>] (other areas, via OA)
  LT.route = function (rest) { window.scrollTo(0, 0); const a = dec(rest.join('/')); if (!LT.file) { LT.load(() => { if (location.hash.startsWith('#/lt')) route(); }); return main.innerHTML = '<div class="empty">Loading LOTO data…</div>'; } return a ? LT.item(null, a, '#/lt') : LT.home(null, '#/lt'); };
  if (window.OA) { const _area = OA.area; OA.area = function (a, sub, arg) { if (sub !== 'lt') return _area(a, sub, arg);
      LT.load(() => {}); OA.loadArea(a, d => { const K = {}; d.CK.forEach((k, i) => K[k] = i); const list = d.cables.map(c => ({t: c[K.t], f: c[K.f], o: c[K.o], sys: c[K.sys], ps: c[K.ps], ty: c[K.ty], c: c[K.c]}));
        const G = LT.graph('A:' + a, list); const base = `#/oa/${enc(a)}/lt`; arg ? LT.item(G, arg, base) : LT.home(G, base, a); }); }; }
  const _home = window.home;
  window.home = function () { _home(); const sect = [...main.querySelectorAll('.sect')].find(e => /Construction/i.test(e.textContent)); const grid = sect && sect.nextElementSibling;
    if (grid) { const live = LT.live().length; grid.insertAdjacentHTML('afterbegin', `<button class="tile main" style="background:#b42318;border-color:#b42318" onclick="go('#/lt')"><b>🔒 LOTO – live panels<br><span style="font-weight:400;font-size:12px">which breaker to isolate · crew safety</span></b><div><span class="n">${live} live sources declared</span></div></button>`); } };
  LT.load(() => {}); { const k = location.hash.replace(/^#\/?/, '').split('/')[0]; if (!k || k[0] === '?') route(); }
})();
