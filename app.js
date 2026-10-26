const D = window.__D;
const T = D.tabs;
const LAT = {'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','Х':'X','У':'Y','а':'A','в':'B','е':'E','к':'K','м':'M','н':'H','о':'O','р':'P','с':'C','т':'T','х':'X','у':'Y'};
const N = s => String(s || '').replace(/[А-Яа-я]/g, ch => LAT[ch] || ch).toUpperCase().replace(/[\s\-_.\/]/g, '');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[m]));
const enc = encodeURIComponent, dec = decodeURIComponent;
const fmtn = v => (v === '' || v == null) ? '' : (Math.round(Number(v) * 100) / 100).toLocaleString('en-US').replace(/,/g, ' ');
// items
const I = D.items.map((a, i) => { const o = {i}; D.IK.forEach((k, j) => o[k] = a[j]); o.g = T.grp[o.grp]; o.m = T.map[o.map]; o.u = T.unit[o.unit]; o.sy = T.sys[o.sys];
  o.done = o.q > 0 && o.f >= o.q - (o.u === 'm' && /pull/i.test(o.g) ? 0.5 : 0.001); o._n = N(o.tag); return o; });
const C = D.cables.map((a, i) => { const o = {i}; D.CK.forEach((k, j) => o[k] = a[j]); o._n = N(o.t); o._e = N(o.f + ' ' + o.o); return o; });
const CBY = {}; C.forEach(c => CBY[c.t] = c);
const IBY = {}; I.forEach(x => (IBY[x.tag] = IBY[x.tag] || []).push(x));
const PAN = D.panels.map(p => ({tag: p[0], desc: p[1], room: p[2], cs: p[3], _n: N(p[0])})); const PBY = {}; PAN.forEach(p => PBY[p.tag] = p);
const PJ = D.punch, PT = PJ.tabs;
const PU = PJ.rows.map((a, i) => { const o = {i}; PJ.K.forEach((k, j) => o[k] = a[j]); o.d = PT.disc[o.disc]; o._t = N(o.tag); o._n = o._t + ' ' + N(o.no); o.rhi = /РХИ|Rencons/i.test(PT.resp[o.resp]); return o; });
const PUBY = {}; PU.forEach(p => { if (p.tag) (PUBY[p.tag] = PUBY[p.tag] || []).push(p); });
const pb = p => p.st === 'Open' ? `<span class="badge b-no">Open</span>` : `<span class="badge b-ok">Closed</span>`;
const pcat = p => `<span class="badge ${p.cat === 'A' ? 'b-no' : p.cat === 'B' ? 'b-part' : 'b-na'}">Cat ${esc(p.cat || '-')}</span>`;
function punchBox(tag) { const ps = PUBY[tag] || []; if (!ps.length) return ''; const op = ps.filter(p => p.st === 'Open').length;
  return `<div class="card"><div class="h3">Punch items (${ps.length} · open ${op})</div><div class="list">${ps.map(pRow).join('')}</div></div>`; }
function pRow(p) { return `<button class="li" onclick="go('#/pi/${p.i}')"><div class="m"><div class="t">${DISC_IC(p.d)} № ${esc(p.no)} · ${esc(p.tag || '-')}</div><div class="s">${esc(p.den || p.dru)}</div></div><div class="r">${pb(p)}<div style="margin-top:3px">${pcat(p)}</div>${siteSt(p) ? '<div style="margin-top:3px">' + (siteSt(p).v === 'F' ? '<span class="badge b-ok">✓ site</span>' : '<span class="badge b-no">✗ site</span>') + '</div>' : ''}</div><span class="chev">›</span></button>`; }
const SKEY = 'ccr_site_v1'; let S2 = {c: {}, i: {}, m: {}, last: 0, lastText: '', rx: []};
try { const v = localStorage.getItem(SKEY); if (v) S2 = Object.assign(S2, JSON.parse(v)); } catch (err) {}
function ssave() { CSTC = {}; try { localStorage.setItem(SKEY, JSON.stringify(S2)); } catch (err) { toast('Could not save - send the report now'); } }
const MAXLINK = 'https://max.ru/u/f9LHodD0cOJtQE7ljdbFZtb7Z8mLZSYAeSDsBgSF4tXPzXK-0S2T-VwbXkU';
const isCCR = t => /D1810|D1801|-D18-/.test(t);
const GCNT = {}; I.forEach(x => GCNT[x.g] = (GCNT[x.g] || 0) + 1); const GROUPS = Object.keys(GCNT).sort((a, b) => GCNT[b] - GCNT[a]);
let CSTC = {}; function cst(c) { return CSTC[c.i] || (CSTC[c.i] = cst0(c)); }
function cst0(c) {
  const L = (IBY[c.t] || []).filter(x => /pull/i.test(x.g)), M = (IBY[c.t] || []).filter(x => /termination/i.test(x.g));
  const se = S2.c[c.t] || {};
  let pulled = L.length ? L.every(x => x.done) : (c.tp === 'Completed' ? true : (c.tp ? false : (c.lq !== '' ? Number(c.lf) >= Number(c.lq) - 0.5 : null)));
  let term = M.length ? M.every(x => x.done) : (c.tt === 'Completed' ? true : (c.tt ? false : (c.tq !== '' ? Number(c.tfa) >= Number(c.tq) : null)));
  if (se.P) pulled = se.P.v;
  if (se.F || se.T) { const b = cBase(c); const f = se.F ? se.F.v : b.F, tt = se.T ? se.T.v : b.T; term = f && tt; }
  if (pulled === null && term === null) return {l: 'No status', c: 'b-na', p: null, t: null, ok: false};
  if (pulled && term) return {l: 'COMPLETED', c: 'b-ok', p: pulled, t: term, ok: true};
  if (pulled) return {l: 'Termination open', c: 'b-part', p: pulled, t: term, ok: false};
  return {l: 'NOT PULLED', c: 'b-no', p: pulled, t: term, ok: false};
}
function cBase(c) { const M = (IBY[c.t] || []).filter(x => /termination/i.test(x.g)); const f = M.length ? M.reduce((a, x) => a + x.f, 0) : (c.tt === 'Completed' ? 2 : Number(c.tfa) || 0); return {F: f >= 1, T: f >= 2}; }
const ist0 = x => x.done ? {l: 'Done', c: 'b-ok'} : (x.f > 0 ? {l: 'Partly', c: 'b-part'} : {l: 'Not done', c: 'b-no'});
const ist = x => { const e = S2.i[x.acc], m = S2.m[x.acc]; if (e) return e.v ? {l: '✓ Done (site)', c: 'b-ok'} : {l: '✗ Not done (site)', c: 'b-no'}; if (m) return {l: `+${fmtn(m.q)} ${x.u} (site)`, c: 'b-part'}; return ist0(x); };
function who(after) { if (!PS_.name) { askPName(after); return false; } return true; }
function cTick(tag, k) { if (!who(`cTick(decodeURIComponent('${enc(tag)}'),'${k}')`)) return; const c = CBY[tag]; const e = S2.c[tag] = S2.c[tag] || {};
  const b = cBase(c); const cur = e[k] ? e[k].v : (k === 'P' ? cst(c).p === true : b[k]); e[k] = {v: !cur, t: Date.now(), by: PS_.name}; ssave(); route(); }
function cRem(tag, r) { const e = S2.c[tag] = S2.c[tag] || {}; e.R = {v: r, t: Date.now(), by: PS_.name || '?'}; ssave(); }
function iTick(acc, v) { if (!who(`iTick('${acc}',${v})`)) return; S2.i[acc] = {v, t: Date.now(), by: PS_.name, r: (S2.i[acc] || {}).r || ''}; ssave(); route(); }
function mSave(acc) { if (!who(`mSave('${acc}')`)) return; const q = Number(String(document.getElementById('mq').value).replace(',', '.')); if (!(q > 0)) return toast('Enter the quantity done');
  S2.m[acc] = {q, t: Date.now(), by: PS_.name}; ssave(); toast('Progress saved'); route(); }
function mDel(acc) { delete S2.m[acc]; ssave(); route(); }
function tickBtns(c, dir) { const s = cst(c), b = cBase(c), e = S2.c[c.t] || {}; const ek = dir === 'IN' ? 'T' : 'F', ok = ek === 'F' ? 'T' : 'F';
  const v = k => k === 'P' ? s.p === true : (e[k] ? e[k].v : b[k]);
  const btn = (k, l, ru) => `<button class="tg ${v(k) ? 'y' : (e[k] ? 'n' : '')}" onclick="event.stopPropagation();cTick(decodeURIComponent('${enc(c.t)}'),'${k}')">${v(k) ? '✓ ' : ''}${l}<small>${ru}${e[k] ? ' · ' + dstr(e[k].t) : ''}</small></button>`;
  return `<div class="btns">${btn('P', 'Pulled', 'Проложен')}${btn(ek, 'Term. this end', 'Подкл. здесь')}${btn(ok, 'Term. other end', 'Подкл. др. конец')}</div>${lenBox(c)}`; }
function cCard(c, dir) { const s = cst(c); return `<div class="cbx ${s.ok ? 'ok' : s.p ? 'part' : 'no'}"><div onclick="go('#/c/${enc(c.t)}')"><span class="badge b-na" style="margin-right:6px">${dir || ''}</span><b style="word-break:break-all">${esc(c.t)}</b> <span class="badge ${s.c}">${s.l}</span>${holdMini(c.t)}
  <div class="s2">${dir === 'IN' ? 'From' : 'To'}: ${esc(((dir === 'IN' ? c.f : c.o) || '').slice(-90))}</div><div class="s2">${esc(c.ty)} ${esc(c.c)} · ${esc(c.ln)} m${c.q ? ' · ⚠ CTQ' : ''}</div></div>${tickBtns(c, dir)}</div>`; }
const ist_old = x => x.done ? {l: 'Done', c: 'b-ok'} : (x.f > 0 ? {l: 'Partly', c: 'b-part'} : {l: 'Not done', c: 'b-no'});
function gstat(list) { const n = list.length, d = list.filter(x => x.done).length; const us = [...new Set(list.map(x => x.u))];
  const q = list.reduce((a, x) => a + x.q, 0), f = list.reduce((a, x) => a + x.f, 0);
  return us.length === 1 ? {n, d, pc: q ? Math.round(100 * f / q) : 0, q, f, u: us[0]} : {n, d, pc: n ? Math.round(100 * d / n) : 0, q: n, f: d, u: 'lines'}; }
// router
const main = document.getElementById('main'); const qbox = document.getElementById('q');
let VS = {}; // view state per route
function go(h) { if (location.hash !== h) location.hash = h; else route(); }
function goBack() { if (history.length > 1 && location.hash !== '#/' && location.hash !== '') history.back(); else go('#/'); }
window.addEventListener('hashchange', route);
qbox.addEventListener('input', () => { clearTimeout(qbox.t); qbox.t = setTimeout(() => { const v = qbox.value.trim(); if (v.length >= 2) history.replaceState(null, '', '#/s/' + enc(v)), route(); else if (!v && location.hash.startsWith('#/s/')) go('#/'); }, 160); });
function setHead(t, s) { document.getElementById('ttl').textContent = t; document.getElementById('st').textContent = s || ''; document.getElementById('bk').style.visibility = (location.hash && location.hash !== '#/') ? 'visible' : 'hidden'; }
function route() {
  const h = location.hash.replace(/^#\//, ''); const [k, ...rest] = h.split('/'); const a = dec(rest.join('/'));
  window.scrollTo(0, 0);
  if (!k) return home();
  if (k === 'a') return actView(a);
  if (k === 'i') return itemView(Number(a));
  if (k === 'p') return a ? panelView(a) : panelList();
  if (k === 'c') return cableView(a);
  if (k === 's') return searchView(a);
  if (k === 'pl') return punchHome();
  if (k === 'pk') return punchList(a);
  if (k === 'pi') return punchItem(Number(a));
  if (k === 'pp') return punchProgress();
  if (k === 'ic') return icView();
  if (k === 'in') return instHome();
  if (k === 'dr') return a !== '' ? drumView(Number(a)) : drumHome();
  if (k === 'mt') return matHome();
  if (k === 'mr') return a ? mrfView(a) : mrfHome();
  if (k === 'dg') return regHome();
  if (k === 'dp') return progHome();
  if (k === 'tp') return S2.owner ? perfView() : home();
  if (k === 'ow') return ownerView();
  if (k === 'rv') return a !== '' ? rvView(Number(a)) : rvHome();
  if (k === 'tq') return a ? tqView(a) : tqHome();
  if (k === 'ctq') return a ? ctqView(a) : ctqHome();
  if (k === 'ptq') return ptqView(a);
  if (k === 'mp') return mpHome();
  if (k === 'is') return isHome();
  if (k === 'pm') return pmHome();
  if (k === 'al') return alHome();
  if (k === 'rm') return a ? roomView(a) : roomHome();
  if (k === 'bd') return a ? bdSys(a) : bdHome();
  if (k === 'sf') return a ? sfView(a) : sfHome();
  if (k === 'gl') return glHome();
  if (k === 'calc') return calcHome();
  if (k === 'nt') return ntHome();
  if (k === 'owner') { go('#/'); return ownerLogin(); }
  home();
}
// --- views
function home() {
  setHead('CCR site app', `v${APPV} · data ${D.meta.date} · G0-D1810BX0 / G0-D1801FX0`); qbox.value = '';
  const all = gstat(I), cc = C.filter(c => cst(c).ok).length;
  const tile = (g, cls) => { const s = gstat(I.filter(x => x.g === g)); return `<button class="tile ${cls || ''}" onclick="go('#/a/${enc(g)}')"><b>${esc(g)}</b><div><div class="row"><span class="n">${s.d}/${s.n} lines${s.u === 'lines' ? (() => { const m = I.filter(x => x.g === g && x.u === 'm'); return m.length ? ' · ' + fmtn(m.reduce((a, x) => a + x.f, 0)) + ' / ' + fmtn(m.reduce((a, x) => a + x.q, 0)) + ' m' : ''; })() : ' · ' + fmtn(s.f) + ' / ' + fmtn(s.q) + ' ' + s.u}</span></div><div class="pc">${s.pc}%</div><div class="pbar"><i style="width:${s.pc}%"></i></div></div></button>`; };
  const ps = PAN.map(p => p.cs.length ? p.cs.filter(([d, t]) => CBY[t] && cst(CBY[t]).ok).length / p.cs.length : 0); const pcomp = ps.filter(v => v >= 1).length;
  const pend = progLines(true).length, ppend = punchLines(true).length; const icd = ICX.filter(c => cst(c).ok).length, ist_ = gstat(INST);
  const T2 = (h, b, n, pc, cls) => `<button class="tile ${cls || ''}" onclick="go('${h}')"><b>${b}</b><div><span class="n">${n}</span>${pc != null ? `<div class="pc">${pc}%</div><div class="pbar"><i style="width:${pc}%"></i></div>` : ''}</div></button>`;
  const r = PU.filter(p => p.rhi), o = r.filter(p => p.st === 'Open').length;
  main.innerHTML = `<div class="kpi"><div><b>${all.n}</b><span>IWP lines</span></div><div><b style="color:var(--ok)">${Math.round(100 * all.d / all.n)}%</b><span>lines done</span></div><div><b>${cc}/${C.length}</b><span>cables complete</span></div></div>
   ${S2.owner ? (() => { const n = alCount(); return `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px;background:${n ? '#b42318' : '#2b2f36'};border-color:${n ? '#b42318' : '#2b2f36'}" onclick="go('#/al')"><b>🔔 Alerts from site · ${n} new</b><span class="n" style="color:#f3d6d2">issues · permits · revisions · TQ</span></button>`; })() : ''}
   <button class="tile main" style="width:100%;min-height:auto;margin-bottom:4px;background:${pend ? '#c55a11' : 'var(--pri)'};border-color:${pend ? '#c55a11' : 'var(--pri)'}" onclick="openReport('prog')"><b>📤 Send report to Paul · ${pend} new progress lines</b><span class="n">👷 ${esc(PS_.name || 'tap to set your name')} · MAX progress group</span></button>
   <div class="sect">🏗️ Construction</div><div class="grid">
    ${T2('#/p', 'Panel cable check<br><span style="font-weight:400;font-size:12px">pulled / terminated per panel</span>', `${PAN.length} panels · ${pcomp} complete`, Math.round(100 * pcomp / PAN.length), 'main')}
    ${T2('#/ic', 'Interconnection cables<br><span style="font-weight:400;font-size:12px">to/from other buildings</span>', `${icd}/${ICX.length} complete`, ICX.length ? Math.round(100 * icd / ICX.length) : 0, 'main')}
    ${T2('#/in', 'Installation check<br><span style="font-weight:400;font-size:12px">panels, devices, trays, earthing</span>', `${ist_.d}/${ist_.n} lines`, ist_.pc, 'main')}
    ${T2('#/pl', `Punch list (RHI)<br><span style="font-weight:400;font-size:12px">⚡🖥️🎛️📡❄️ · ${PJ.date}</span>`, `${o} open · ${r.length - o} closed${ppend ? ' · ' + ppend + ' to send' : ''}`, r.length ? Math.round(100 * (r.length - o) / r.length) : 0, 'main')}
    ${T2('#/rm', '🚪 Rooms<br><span style="font-weight:400;font-size:12px">room number → panels & cables</span>', `${new Set(PAN.map(p => p.room).filter(Boolean)).size} rooms`)}${tile('Cable pulling')}${tile('Cable termination')}</div>
   <div class="grid" style="margin-top:9px">${T2('#/is', '🚩 Issues found<br><span style="font-weight:400;font-size:12px">report to engineer</span>', `${S2.is.filter(x => !x.s).length} not sent · ${S2.is.length} total`)}${T2('#/pm', '📝 Work permits<br><span style="font-weight:400;font-size:12px">request from engineer</span>', `${S2.pr.filter(x => !x.s).length} not sent · ${S2.pr.length} total`)}</div>
   <div class="sect">📦 Materials</div><div class="grid">
    ${T2('#/dr', '🧵 Cable drums', `${DR.length} drums · used / remaining`)}${T2('#/mt', '📋 Material tracking', `${D.mat.length} ident codes by system`)}${T2('#/mr', '🏬 MRF status', `${MRF.length} warehouse requests`)}</div>
   <div class="sect">🧭 Systems</div><div class="grid">${(() => { const st = Object.keys(SG).map(sysStat).filter(Boolean); const rd = st.filter(x => x.ok).length; return T2('#/bd', '🧭 System block diagrams<br><span style="font-weight:400;font-size:12px">how systems work · ready to start?</span>', `${rd} ready · ${st.length - rd} with issues`, st.length ? Math.round(100 * rd / st.length) : 0, 'main'); })()}${T2('#/gl', '🔩 Cable glands', 'size · type RU/EN · sleeve · earthing')}</div>
   <div class="sect">📑 Documents</div><div class="grid">${T2('#/ctq', '❓ CTQ register<br><span style="font-weight:400;font-size:12px">internal TQs · what is on hold</span>', `${CTQ.filter(ctqOpen).length} open · ${Object.keys(HOLD).length} items on hold`, null, 'main')}${T2('#/dg', '📐 Drawings register', `${RG.length} CCR docs · system → activity`)}${T2('#/sf', '📋 SF drawings (MTO)', `${SF.length} files · rev & dates`)}${T2('#/rv', '📄 Drawing revisions', `${RV.length} revised · ${RV.reduce((x, r) => x + r.ch.filter(rvDone).length, 0)} after installation`)}</div>
   <div class="sect">🛠️ Tools</div><div class="grid">${T2('#/calc', '🧮 Engineering calculator', 'current · voltage drop · OD · gland')}${T2('#/nt', '📝 Site notes', `${(S2.notes || []).length} notes`)}</div>
   <div class="sect">📈 Progress</div><div class="grid">${T2('#/dp', '✍️ Daily progress entry', `${pend} lines not sent`)}${S2.owner ? T2('#/ow', '🔑 Import progress (owner)', `${(S2.rx || []).length} imported lines · total IWP report`, null, 'main') + T2('#/tp', '👷 Technician performance', `${new Set(perfRows().map(r => r.by)).size} technicians`, null, 'main') : ''}${T2('#/pp', '📊 Punch daily progress', 'site updates')}<button class="tile" onclick="openReport('punch')"><b>🧾 Punch report to Paul</b><div><span class="n">${ppend} new · MAX punch group</span></div></button></div>
   <div class="sect">🔑 Owner</div><button class="tile" style="width:100%;min-height:auto;background:#2b2f36;color:#fff;border-color:#2b2f36" onclick="S2.owner?go('#/ow'):ownerLogin()"><b>🔑 Owner menu${S2.owner ? ' – unlocked' : ''}</b><span class="n" style="color:#cfd6df">${S2.owner ? 'Import progress · total IWP report · technician performance' : 'Password required – owner only'}</span></button>
   <div class="foot">${esc(D.meta.src)}<br>Updates automatically when the phone is online.<br>App version ${APPV}</div>`;
}
function actView(g) {
  const list = I.filter(x => x.g === g); const s = gstat(list); VS[g] = VS[g] || {f: 'all', sy: '', q: '', lim: 200};
  const v = VS[g]; setHead(g, `${s.d}/${s.n} lines done · ${s.pc}%`);
  const sys = [...new Set(list.map(x => x.sy))].sort();
  main.innerHTML = `<div class="chips">${[['all', 'All'], ['open', 'Not done'], ['done', 'Done']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS['${esc(g)}'].f='${k}';actView(decodeURIComponent('${enc(g)}'))">${l}</button>`).join('')}</div>
   <select onchange="VS[decodeURIComponent('${enc(g)}')].sy=this.value;actList(decodeURIComponent('${enc(g)}'))"><option value="">All systems (${sys.length})</option>${sys.map(y => `<option ${v.sy === y ? 'selected' : ''}>${esc(y)}</option>`).join('')}</select>
   <input class="fin" placeholder="Filter in this activity…" value="${esc(v.q)}" oninput="VS[decodeURIComponent('${enc(g)}')].q=this.value;actList(decodeURIComponent('${enc(g)}'))"><div id="al"></div>`;
  actList(g);
}
function actList(g) {
  const v = VS[g]; const nq = N(v.q);
  let list = I.filter(x => x.g === g && (v.f === 'all' || (v.f === 'done' ? x.done : !x.done)) && (!v.sy || x.sy === v.sy) && (!nq || x._n.includes(nq) || N(x.uid).includes(nq)));
  list.sort((a, b) => (a.sy + a.tag).localeCompare(b.sy + b.tag));
  const by = {}; list.slice(0, v.lim).forEach(x => (by[x.sy] = by[x.sy] || []).push(x));
  document.getElementById('al').innerHTML = list.length ? `<div class="list">${Object.entries(by).map(([sy, xs]) => `<div class="gh">${esc(sy)} · ${xs.length}</div>` + xs.map(x => { const s = ist(x);
    return `<button class="li" onclick="go('#/i/${x.i}')"><div class="m"><div class="t">${esc(x.tag)}</div><div class="s">${esc(T.desc[x.desc])}</div></div><div class="r"><span class="badge ${s.c}">${s.l}</span><div>${fmtn(x.f)}/${fmtn(x.q)} ${esc(x.u)}</div></div>${!/^Cable/.test(x.g) && !x.done ? `<span class="tg ${S2.i[x.acc] && S2.i[x.acc].v ? 'y' : ''}" style="padding:8px 10px" onclick="event.stopPropagation();S2.i['${x.acc}']&&S2.i['${x.acc}'].v?(delete S2.i['${x.acc}'],ssave(),actList(decodeURIComponent('${enc(g)}'))):iTick('${x.acc}',true)">✓</span>` : '<span class="chev">›</span>'}</button>`; }).join('')).join('')}</div>` +
    (list.length > v.lim ? `<button class="more" onclick="VS[decodeURIComponent('${enc(g)}')].lim+=300;actList(decodeURIComponent('${enc(g)}'))">Show more (${list.length - v.lim} left)</button>` : '') : '<div class="empty">Nothing found</div>';
}
const kv = rows => '<div class="kv">' + rows.filter(x => x[1] !== '' && x[1] != null && x[1] !== 'None' && x[1] !== '-').map(x => `<div>${x[0]}</div><div>${x[2] ? x[1] : esc(x[1])}</div>`).join('') + '</div>';
function plink(t) { return PBY[t] ? `<span class="link" onclick="go('#/p/${enc(t)}')">${esc(t)}</span>` : esc(t); }
function itemView(i) {
  const x = I[i]; const s = ist(x); setHead(x.g, x.tag);
  const c = CBY[x.tag]; const others = (IBY[x.tag] || []).filter(y => y !== x);
  let conn = '';
  if (!c) { const n = N(x.tag); const cs = n.length > 6 ? C.filter(k => k._e.includes(n)).slice(0, 60) : [];
    if (cs.length) conn = `<div class="card"><div class="h3">Cables connected to this item (${cs.length})</div><div class="list">${cs.map(cRow).join('')}</div></div>`; }
  main.innerHTML = `${holdCard(x.tag)}<div class="card"><div class="big">${esc(x.tag)}</div><div style="margin:6px 0"><span class="badge ${s.c}" style="font-size:13px">${s.l}</span>${holdMini(x.tag)}</div>
    ${kv([['Activity', x.g], ['IWP mapping', x.m], ['IWP type', T.it[x.it]], ['Access ID', x.acc], ['Unique tag', x.uid], ['Item / type', x.ctag], ['Description', T.desc[x.desc]], ['Quantity', `${fmtn(x.q)} ${x.u}`], ['Done', `${fmtn(x.f)} ${x.u}`], ['Remaining', `${fmtn(x.q - x.f)} ${x.u}`],
      ['Drawing', T.dwg[x.dwg]], ['Subtitle', T.sub[x.sub]], ['System', x.sy], ['Company', T.co[x.co]], ['Responsible', T.resp[x.resp]], ['TQ No.', x.tq], ['IWP notes', x.notes]])}</div>
    <div class="card"><div class="h3">Site progress / Прогресс на месте</div>${!c ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><button class="tg ${S2.i[x.acc] && S2.i[x.acc].v ? 'y' : ''}" style="padding:12px" onclick="iTick('${x.acc}',true)">✓ Installed / done<small>Смонтировано</small></button><button class="tg ${S2.i[x.acc] && !S2.i[x.acc].v ? 'n' : ''}" style="padding:12px" onclick="iTick('${x.acc}',false)">✗ Not done<small>Не выполнено</small></button></div>` : ''}
      <div class="row" style="display:flex;gap:8px"><input class="fin" id="mq" type="number" inputmode="decimal" placeholder="Qty done today (${esc(x.u)}) – remaining ${fmtn(x.q - x.f)}" style="flex:1;margin:0"><button class="tile main" style="min-height:auto;padding:10px 14px" onclick="mSave('${x.acc}')"><b>Save</b></button></div>
      <div style="font-size:12px;color:var(--mut);margin-top:6px">${S2.m[x.acc] ? `Entered: ${fmtn(S2.m[x.acc].q)} ${esc(x.u)} on ${dstr(S2.m[x.acc].t)} by ${esc(S2.m[x.acc].by)} · <span class="link" onclick="mDel('${x.acc}')">delete</span>` : (S2.i[x.acc] ? `Site: ${S2.i[x.acc].v ? 'done' : 'not done'} ${dstr(S2.i[x.acc].t)} by ${esc(S2.i[x.acc].by)} · <span class="link" onclick="delete S2.i['${x.acc}'];ssave();route()">undo</span>` : 'No site entry yet')}</div></div>
    ${c ? `<div class="card"><div class="h3">Cable</div>${cableBody(c)}<div style="margin-top:8px"><span class="link" onclick="go('#/c/${enc(c.t)}')">Open full cable details ›</span></div></div>` : ''}
    ${others.length ? `<div class="card"><div class="h3">Other IWP lines for this tag</div><div class="list">${others.map(y => { const s2 = ist(y); return `<button class="li" onclick="go('#/i/${y.i}')"><div class="m"><div class="t">${esc(y.g)}</div><div class="s">Access ID ${esc(y.acc)} · ${fmtn(y.f)}/${fmtn(y.q)} ${esc(y.u)}</div></div><span class="badge ${s2.c}">${s2.l}</span><span class="chev">›</span></button>`; }).join('')}</div></div>` : ''}${!c ? lrAtCard(x.tag) : ''}${punchBox(x.tag)}${conn}`;
}
function cableBody(c) {
  const s = cst(c);
  return kv([['Status', `<span class="badge ${s.c}">${s.l}</span>`, 1], ['From', plinkText(c.f), 1], ['From room', c.fr], ['To', plinkText(c.o), 1], ['To room', c.tr], ['Type', c.ty], ['Cores', c.c], ['Length, m', c.ln], ['Drum', c.dr], ['Document', c.d]]);
}
function plinkText(t) { if (!t) return ''; return esc(t).replace(/G0-[A-Z0-9]+-[A-Z0-9()\-]+/g, tag => PBY[tag] ? `<span class="link" onclick="go('#/p/${enc(tag)}')">${tag}</span>` : tag); }
function cRow(c, d) { const s = cst(c); return `<button class="li" onclick="go('#/c/${enc(c.t)}')"><div class="m"><div class="t">${d ? `<span class="badge b-na" style="margin-right:6px">${d}</span>` : ''}${esc(c.t)}${holdMini(c.t)}</div><div class="s">${esc((d === 'IN' ? c.f : c.o || '').slice(-70))}</div></div><span class="badge ${s.c}">${s.l}</span><span class="chev">›</span></button>`; }
function cableView(t) {
  const c = CBY[t]; if (!c) { main.innerHTML = '<div class="empty">Cable not found</div>'; return; }
  const s = cst(c); setHead('Cable', c.t); const lines = IBY[c.t] || [];
  main.innerHTML = `${holdCard(c.t)}<div class="card"><div class="big">${esc(c.t)}</div><div style="margin:6px 0"><span class="badge ${s.c}" style="font-size:13px">${s.l}</span>${holdMini(c.t)}</div>${cableBody(c)}</div>
   <div class="card"><div class="h3">Site check / Проверка на месте</div>${tickBtns(c, 'OUT')}<input class="fin" style="margin-top:8px" placeholder="Remark / примечание" value="${esc((S2.c[c.t] || {}).R ? S2.c[c.t].R.v : '')}" onchange="cRem(decodeURIComponent('${enc(c.t)}'),this.value)"></div>
   <div class="card"><div class="h3">Pulling / Прокладка</div>${kv([['Status', s.p === true ? '✓ Completed' : (s.p === false ? '✗ Not completed' : '–')], ['Tracker', c.tp], ['Pull date', c.pd], ['IWP access ID', c.la], ['IWP qty / done', c.lq !== '' ? `${fmtn(c.lq)} / ${fmtn(c.lf)} m` : ''], ['Company', c.co]])}</div>
   <div class="card"><div class="h3">Termination / Подключение</div>${kv([['Status', s.t === true ? '✓ Completed' : (s.t === false ? '✗ Not completed' : '–')], ['Tracker', c.tt], ['From end date', c.tf], ['To end date', c.tto], ['IWP access ID', c.ta], ['IWP ends done', c.tq !== '' ? `${c.tfa} / ${c.tq}` : '']])}</div>
   ${lines.length ? `<div class="card"><div class="h3">IWP lines (${lines.length})</div><div class="list">${lines.map(y => { const s2 = ist(y); return `<button class="li" onclick="go('#/i/${y.i}')"><div class="m"><div class="t">${esc(y.g)}</div><div class="s">Access ID ${esc(y.acc)} · ${fmtn(y.f)}/${fmtn(y.q)} ${esc(y.u)} · ${esc(T.co[y.co])}</div></div><span class="badge ${s2.c}">${s2.l}</span><span class="chev">›</span></button>`; }).join('')}</div></div>` : ''}
   ${lrCard(c)}${tCard(c)}${glCard(c)}${punchBox(c.t)}${c.rf ? `<div class="card"><div class="h3">Terminal reference</div>${esc(c.rf)}</div>` : ''}
   ${c.q ? `<div class="card"><div class="h3">Internal TQ (CTQ)</div><div class="note">${esc(c.q)}</div></div>` : ''}
   ${c.tqs ? `<div class="card"><div class="h3">Project TQ</div><div style="font-size:13px">${esc(c.tqs)}</div></div>` : ''}
   ${(c.cm || c.h) ? `<div class="card"><div class="h3">Tracker remark</div><div class="note">${esc([c.h ? 'HOLD: ' + c.h : '', c.cm].filter(Boolean).join('\n'))}</div></div>` : ''}`;
}
function pstat(p) { const n = p.cs.length, d = p.cs.filter(([dd, t]) => CBY[t] && cst(CBY[t]).ok).length; return {n, d, pc: n ? Math.round(100 * d / n) : 0}; }
function panelList() {
  VS.P = VS.P || {q: '', f: 'all', lim: 150}; const v = VS.P; setHead('Panels & boxes', `${PAN.length} panels · tap for cable list`);
  main.innerHTML = `<div class="chips">${[['all', 'All'], ['open', 'Not complete'], ['done', 'Complete']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.P.f='${k}';panelList()">${l}</button>`).join('')}</div>
   <input class="fin" placeholder="Filter panel / room…" value="${esc(v.q)}" oninput="VS.P.q=this.value;pList()"><div id="pl"></div>`;
  pList();
}
function pList() {
  const v = VS.P, nq = N(v.q);
  const list = PAN.filter(p => { const s = pstat(p); return (v.f === 'all' || (v.f === 'done' ? s.d === s.n : s.d < s.n)) && (!nq || p._n.includes(nq) || N(p.desc).includes(nq) || ('ROOM' + p.room) === nq || p.room === v.q.trim()); });
  document.getElementById('pl').innerHTML = list.length ? `<div class="list">${list.slice(0, v.lim).map(p => { const s = pstat(p);
    return `<button class="li" onclick="go('#/p/${enc(p.tag)}')"><div class="m"><div class="t">${esc(p.tag.replace(/^G0-D1810BX0-/, ''))}</div><div class="s">${p.room ? 'Room ' + esc(p.room) + ' · ' : ''}${esc(p.desc)}</div><div class="pbar" style="max-width:220px"><i style="width:${s.pc}%"></i></div></div><div class="r"><div class="pc" style="color:${s.pc === 100 ? 'var(--ok)' : 'var(--warn)'}">${s.pc}%</div>${s.d}/${s.n}</div><span class="chev">›</span></button>`; }).join('')}</div>` +
    (list.length > v.lim ? `<button class="more" onclick="VS.P.lim+=200;pList()">Show more (${list.length - v.lim})</button>` : '') : '<div class="empty">Nothing found</div>';
}
function panelView(t) {
  const p = PBY[t]; if (!p) { main.innerHTML = '<div class="empty">Panel not found</div>'; return; }
  const s = pstat(p); setHead(t.replace(/^G0-D1810BX0-/, ''), `${s.d}/${s.n} cables complete · ${s.pc}%`);
  const inst = (IBY[t] || []);
  const rows = (d) => p.cs.filter(z => z[0] === d).map(([dd, tg]) => CBY[tg] ? cCard(CBY[tg], dd) : `<div class="cbx"><b>${esc(tg)}</b></div>`).join('');
  const nOut = p.cs.filter(z => z[0] === 'OUT').length, nIn = p.cs.length - nOut;
  main.innerHTML = `${holdCard(t)}<div class="card"><div class="big">${esc(t)}${holdMini(t)}</div><div class="small" style="color:var(--mut);font-size:13px">${esc(p.desc)}</div>${kv([['Room', p.room ? `<span class="link" onclick="go('#/rm/${enc(p.room)}')">${esc(roomLbl(p.room))}</span>` : '', 1], ['Cables', `${p.cs.length} (OUT ${nOut} / IN ${nIn})`], ['Complete', `${s.d} of ${s.n} (${s.pc}%)`]])}<div class="pbar"><i style="width:${s.pc}%"></i></div></div>
   ${inst.length ? `<div class="card"><div class="h3">Installation (IWP)</div><div class="list">${inst.map(y => { const s2 = ist(y); return `<button class="li" onclick="go('#/i/${y.i}')"><div class="m"><div class="t">${esc(y.g)}</div><div class="s">Access ID ${esc(y.acc)} · ${fmtn(y.f)}/${fmtn(y.q)} ${esc(y.u)}</div></div><span class="badge ${s2.c}">${s2.l}</span><span class="chev">›</span></button>`; }).join('')}</div></div>` : ''}
   ${lrAtCard(t)}${punchBox(t)}${nOut ? `<div class="sect">Outgoing cables (${nOut})</div>${rows('OUT')}` : ''}${nIn ? `<div class="sect">Incoming cables (${nIn})</div>${rows('IN')}` : ''}`;
}
const PKEY = 'ccr_punch_v1'; let PS_ = {name: '', e: {}, x: {}};
try { const v = localStorage.getItem(PKEY); if (v) PS_ = Object.assign(PS_, JSON.parse(v)); } catch (err) {}
function psave() { try { localStorage.setItem(PKEY, JSON.stringify(PS_)); } catch (err) { toast('Could not save - send the report now'); } }
const PNO = {}; PU.forEach(p => PNO[p.no] = p);
const dstr = ts => { const d = new Date(ts); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear(); };
const dkey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
function siteSt(p) { return PS_.e[p.no] || null; }
function sbadge(p) { const e = siteSt(p); if (!e) return ''; return e.v === 'F' ? `<span class="badge b-ok">✓ Fixed on site ${dstr(e.t)}</span>` : `<span class="badge b-no">✗ Not fixed ${dstr(e.t)}</span>`; }
function askPName(after) {
  modalP(`<div class="h3">Your name / Ваше имя</div><input class="fin" id="pnm" value="${esc(PS_.name)}" placeholder="e.g. Ivanov A."><button class="tile main" style="width:100%;min-height:auto" onclick="PS_.name=document.getElementById('pnm').value.trim();psave();closeP();${after || ''}">Save</button>`);
}
function modalP(h) { window.mOpen = Date.now(); let m = document.getElementById('pm'); if (!m) { m = document.createElement('div'); m.id = 'pm'; document.body.appendChild(m); }
  m.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:20;display:flex;align-items:flex-end;justify-content:center" onclick="if(event.target===this&&Date.now()-window.mOpen>600)closeP()"><div style="background:#fff;width:100%;max-width:640px;border-radius:14px 14px 0 0;padding:16px;max-height:85vh;overflow:auto">${h}</div></div>`; }
function closeP() { const m = document.getElementById('pm'); if (m) m.innerHTML = ''; }
function setPunch(no, v) {
  if (!PS_.name) return askPName(`setPunch('${no}','${v}')`);
  const cur = PS_.e[no] || {}; PS_.e[no] = {v, t: Date.now(), by: PS_.name, r: cur.r || ''}; psave(); route(); toast(v === 'F' ? 'Marked as fixed ✓' : 'Marked as not fixed');
}
function setPRem(no, r) { if (!PS_.name) return askPName(); const cur = PS_.e[no] || {v: '', t: Date.now()}; PS_.e[no] = Object.assign({}, cur, {r, t: Date.now(), by: PS_.name}); psave(); }
function clearPunch(no) { delete PS_.e[no]; psave(); route(); }
function dlFile(name, text, type) {
  const blob = new Blob([text], {type});
  try { const f = new File([blob], name, {type}); if (navigator.canShare && navigator.canShare({files: [f]})) { navigator.share({files: [f], title: name}).catch(() => dlB(blob, name)); return; } } catch (err) {}
  dlB(blob, name);
}
function dlB(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function sendPunchReport() {
  if (!PS_.name) return askPName('sendPunchReport()');
  const n = Object.keys(PS_.e).length; if (!n) return toast('No punch updates yet');
  dlFile(`PUNCH_report_${dkey(Date.now())}_${PS_.name.replace(/[^\wА-Яа-яЁё.-]+/g, '_')}.json`, JSON.stringify({app: 'ccr-punch', v: 1, by: PS_.name, at: Date.now(), entries: PS_.e}), 'application/json');
  toast(`Report with ${n} punch items ready - send it to Paul`);
}
function importPunch(files) {
  let ch = 0, rd = 0, bad = 0; const fl = [...files];
  fl.forEach(f => { const r = new FileReader(); r.onload = () => {
    try { const j = JSON.parse(r.result); if (j.app !== 'ccr-punch') throw 0;
      Object.entries(j.entries || {}).forEach(([no, e]) => { if (!PNO[no] || !e || !e.t) return; const cur = PS_.e[no]; if (!cur || e.t > cur.t) { PS_.e[no] = e; ch++; } }); } catch (err) { bad++; }
    if (++rd === fl.length) { psave(); route(); toast(`Imported ${fl.length - bad} report(s): ${ch} updates${bad ? ' · ' + bad + ' invalid file(s)' : ''}`); } }; r.readAsText(f); });
}
function punchProgress() {
  setHead('Punch – daily progress', 'site updates from technicians');
  const E = Object.entries(PS_.e).filter(([no, e]) => PNO[no] && e.v).map(([no, e]) => ({p: PNO[no], e}));
  const F = E.filter(x => x.e.v === 'F'); const today = dkey(Date.now());
  const byDay = {}, byWho = {}; F.forEach(x => { const d = dkey(x.e.t); byDay[d] = (byDay[d] || 0) + 1; byWho[x.e.by] = byWho[x.e.by] || {f: 0, n: 0, last: 0}; byWho[x.e.by].f++; byWho[x.e.by].last = Math.max(byWho[x.e.by].last, x.e.t); });
  E.filter(x => x.e.v === 'N').forEach(x => { byWho[x.e.by] = byWho[x.e.by] || {f: 0, n: 0, last: 0}; byWho[x.e.by].n++; byWho[x.e.by].last = Math.max(byWho[x.e.by].last, x.e.t); });
  VS.PP = VS.PP || {d: ''}; const sel = VS.PP.d;
  const list = E.filter(x => !sel || dkey(x.e.t) === sel).sort((a, b) => b.e.t - a.e.t);
  const wk = F.filter(x => Date.now() - x.e.t < 7 * 864e5).length;
  main.innerHTML = `<div class="kpi"><div><b style="color:var(--ok)">${byDay[today] || 0}</b><span>fixed today</span></div><div><b>${wk}</b><span>fixed last 7 days</span></div><div><b>${F.length}</b><span>fixed total (site)</span></div></div>
   <div class="chips"><button class="chip" onclick="document.getElementById('pimp').click()">⬆ Import reports</button><button class="chip" onclick="openReport('punch')">Send report to Paul</button><button class="chip" onclick="exportPunch()">⬇ Excel / CSV</button></div>
   <input type="file" id="pimp" accept=".json,application/json" multiple style="display:none" onchange="importPunch(this.files);this.value=''">
   <div class="sect">By technician</div><div class="list">${Object.entries(byWho).sort((a, b) => b[1].f - a[1].f).map(([w, v]) => `<div class="li"><div class="m"><div class="t">${esc(w)}</div><div class="s">last update ${dstr(v.last)}</div></div><div class="r"><b style="color:var(--ok)">${v.f}</b> fixed<div>${v.n} not fixed</div></div></div>`).join('') || '<div class="empty">No reports imported yet</div>'}</div>
   <div class="sect">By day (fixed)</div><div class="list">${Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 40).map(([d, n]) => `<button class="li" onclick="VS.PP.d=VS.PP.d==='${d}'?'':'${d}';punchProgress()"><div class="m"><div class="t">${d.split('-').reverse().join('.')}</div></div><div class="r"><b>${n}</b> fixed</div>${sel === d ? '<span class="badge b-ok">selected</span>' : '<span class="chev">›</span>'}</button>`).join('') || '<div class="empty">-</div>'}</div>
   <div class="sect">${sel ? 'Updates on ' + sel.split('-').reverse().join('.') : 'All site updates'} (${list.length})${sel ? ` · <span class="link" onclick="VS.PP.d='';punchProgress()">show all</span>` : ''}</div>
   <div class="list">${list.slice(0, 300).map(x => `<button class="li" onclick="go('#/pi/${x.p.i}')"><div class="m"><div class="t">№ ${esc(x.p.no)} · ${esc(x.p.tag || '-')}</div><div class="s">${dstr(x.e.t)} · ${esc(x.e.by)}${x.e.r ? ' · ' + esc(x.e.r) : ''}</div></div><div class="r">${x.e.v === 'F' ? '<span class="badge b-ok">Fixed</span>' : '<span class="badge b-no">Not fixed</span>'}</div><span class="chev">›</span></button>`).join('') || '<div class="empty">-</div>'}</div>`;
}
function exportPunch() {
  const sel = (VS.PP && VS.PP.d) || '';
  const E = Object.entries(PS_.e).filter(([no, e]) => PNO[no] && e.v && (!sel || dkey(e.t) === sel)).sort((a, b) => a[1].t - b[1].t);
  if (!E.length) return toast('Nothing to export');
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['Date', 'Punch No.', 'Site status', 'Updated by', 'Remark', 'Tag', 'Subsystem', 'Discipline', 'Category', 'Master status', 'Description EN', 'Description RU']].concat(
    E.map(([no, e]) => { const p = PNO[no]; return [dstr(e.t), no, e.v === 'F' ? 'Fixed' : 'Not fixed', e.by, e.r || '', p.tag, PT.sub[p.sub], p.d, p.cat, p.st, p.den, p.dru]; }));
  dlFile(`PUNCH_progress_${sel || dkey(Date.now())}.csv`, '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv');
}
function pscope() { VS.PS = VS.PS || {who: 'rhi'}; return VS.PS.who === 'rhi' ? PU.filter(p => p.rhi) : PU; }
function punchHome() {
  const L = pscope(); const op = L.filter(p => p.st === 'Open'); setHead('Punch list', `CCR · master punch list ${PJ.date}`);
  const cA = op.filter(p => p.cat === 'A').length, cB = op.filter(p => p.cat === 'B').length, cC = op.filter(p => p.cat === 'C').length;
  const discs = [...new Set(L.map(p => p.d))];
  const tile = d => { const x = L.filter(p => p.d === d), o = x.filter(p => p.st === 'Open').length, pc = x.length ? Math.round(100 * (x.length - o) / x.length) : 0;
    return `<button class="tile" onclick="go('#/pk/d:${enc(d)}')"><b>${DISC_IC(d)} ${esc((PT.discE || [])[PT.disc.indexOf(d)] || d)}</b><span style="font-size:11px;color:var(--mut)">${esc(d)}</span><div><span class="n">${o} open / ${x.length} · A open ${x.filter(p => p.st === 'Open' && p.cat === 'A').length}</span><div class="pc">${pc}% closed</div><div class="pbar"><i style="width:${pc}%"></i></div></div></button>`; };
  const subs = {}; L.forEach(p => { const k = PT.sub[p.sub]; subs[k] = subs[k] || {n: 0, o: 0, name: PT.subn[p.subn], en: (PT.subnE || [])[p.subn]}; subs[k].n++; if (p.st === 'Open') subs[k].o++; });
  main.innerHTML = `<div class="chips">${[['rhi', 'RHI responsible'], ['all', 'All responsible']].map(([k, l]) => `<button class="chip ${VS.PS.who === k ? 'on' : ''}" onclick="VS.PS.who='${k}';punchHome()">${l}</button>`).join('')}</div>
   <div class="kpi"><div><b>${L.length}</b><span>punch items</span></div><div><b style="color:var(--bad)">${op.length}</b><span>open</span></div><div><b style="color:var(--ok)">${L.length ? Math.round(100 * (L.length - op.length) / L.length) : 0}%</b><span>closed</span></div></div>
   <div class="kpi"><div><b style="color:var(--bad)">${cA}</b><span>open cat A</span></div><div><b style="color:var(--warn)">${cB}</b><span>open cat B</span></div><div><b>${cC}</b><span>open cat C</span></div></div>
   <div class="chips"><button class="chip on" onclick="go('#/pp')">📊 Daily progress</button><button class="chip" onclick="openReport('punch')">Send report to Paul</button><button class="chip" onclick="document.getElementById('pimp2').click()">⬆ Import</button><button class="chip" onclick="askPName('route()')">👷 ${esc(PS_.name || 'Set name')}</button></div>
   <input type="file" id="pimp2" accept=".json,application/json" multiple style="display:none" onchange="importPunch(this.files);this.value=''">
   <button class="tile main" style="width:100%;min-height:auto;margin-bottom:4px" onclick="go('#/pk/all:')"><b>All open punch items (${op.length}) ›</b></button>
   <div class="sect">By discipline</div><div class="grid">${discs.map(tile).join('')}</div>
   <div class="sect">By subsystem</div><div class="list">${Object.entries(subs).sort((a, b) => b[1].o - a[1].o).map(([k, v]) => `<button class="li" onclick="go('#/pk/s:${enc(k)}')"><div class="m"><div class="t">${esc(k)}</div><div class="s">${esc(v.en || v.name)}</div></div><div class="r"><b style="color:${v.o ? 'var(--bad)' : 'var(--ok)'}">${v.o}</b> open<div>${v.n} total</div></div><span class="chev">›</span></button>`).join('')}</div>`;
}
function punchList(key) {
  const [t, ...r] = key.split(':'); const v = r.join(':'); VS.PL = VS.PL || {}; const st = VS.PL[key] = VS.PL[key] || {f: 'open', c: '', q: '', lim: 150};
  const base = pscope().filter(p => t === 'd' ? p.d === v : t === 's' ? PT.sub[p.sub] === v : true);
  setHead(t === 'all' ? 'Punch – all' : v, `${base.filter(p => p.st === 'Open').length} open / ${base.length}`);
  main.innerHTML = `<div class="chips">${[['open', 'Open'], ['closed', 'Closed'], ['all', 'All']].map(([k, l]) => `<button class="chip ${st.f === k ? 'on' : ''}" onclick="VS.PL['${esc(key)}'].f='${k}';punchList(decodeURIComponent('${enc(key)}'))">${l}</button>`).join('')}
   ${['', 'A', 'B', 'C'].map(c => `<button class="chip ${st.c === c ? 'on' : ''}" onclick="VS.PL['${esc(key)}'].c='${c}';punchList(decodeURIComponent('${enc(key)}'))">${c ? 'Cat ' + c : 'All cat.'}</button>`).join('')}</div>
   <input class="fin" placeholder="Filter: tag, punch No., text…" value="${esc(st.q)}" oninput="VS.PL[decodeURIComponent('${enc(key)}')].q=this.value;pkList(decodeURIComponent('${enc(key)}'))"><div id="pkl"></div>`;
  pkList(key, base);
}
function pkList(key, base) {
  const [t, ...r] = key.split(':'); const v = r.join(':'); const st = VS.PL[key];
  base = base || pscope().filter(p => t === 'd' ? p.d === v : t === 's' ? PT.sub[p.sub] === v : true);
  const nq = N(st.q); const ql = st.q.trim().toLowerCase();
  const L = base.filter(p => (st.f === 'all' || (st.f === 'open' ? p.st === 'Open' : p.st !== 'Open')) && (!st.c || p.cat === st.c) && (!ql || p._n.includes(nq) || (p.dru + ' ' + p.den + ' ' + (p.tage || '')).toLowerCase().includes(ql)));
  const by = {}; L.slice(0, st.lim).forEach(p => { const k = PT.sub[p.sub] + ' · ' + ((PT.subnE || [])[p.subn] || PT.subn[p.subn]); (by[k] = by[k] || []).push(p); });
  document.getElementById('pkl').innerHTML = L.length ? `<div class="list">${Object.entries(by).map(([k, ps]) => `<div class="gh">${esc(k)} · ${ps.length}</div>` + ps.map(pRow).join('')).join('')}</div>` +
    (L.length > st.lim ? `<button class="more" onclick="VS.PL[decodeURIComponent('${enc(key)}')].lim+=300;pkList(decodeURIComponent('${enc(key)}'))">Show more (${L.length - st.lim})</button>` : '') : '<div class="empty">Nothing found</div>';
}
function punchItem(i) {
  const p = PU[i]; setHead('Punch № ' + p.no, PT.sub[p.sub]);
  const tl = p.tag ? (CBY[p.tag] ? `<span class="link" onclick="go('#/c/${enc(p.tag)}')">${esc(p.tag)}</span>` : PBY[p.tag] ? `<span class="link" onclick="go('#/p/${enc(p.tag)}')">${esc(p.tag)}</span>` : (IBY[p.tag] ? `<span class="link" onclick="go('#/i/${IBY[p.tag][0].i}')">${esc(p.tag)}</span>` : esc(p.tag))) : '';
  main.innerHTML = `<div class="card"><div class="big">Punch № ${esc(p.no)}</div><div style="margin:6px 0">${pb(p)} ${pcat(p)} ${p.pri ? `<span class="badge b-na">${esc(p.pri)}</span>` : ''}</div>
    ${p.den ? `<div class="note" style="background:#e8f6ee"><b>EN:</b> ${esc(p.den)}</div>` : ''}${p.dru ? `<div class="note" style="background:#eef3f8"><b>RU:</b> ${esc(p.dru)}</div>` : ''}</div>
   <div class="card"><div class="h3">Site check / Проверка на месте</div>${(() => { const e = siteSt(p);
     return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile ${e && e.v === 'F' ? 'main' : ''}" style="min-height:58px;${e && e.v === 'F' ? 'background:var(--ok);border-color:var(--ok)' : ''}" onclick="setPunch('${esc(p.no)}','F')"><b>✓ Fixed<br><span style="font-weight:400;font-size:12px">Устранено</span></b></button>
       <button class="tile" style="min-height:58px;${e && e.v === 'N' ? 'background:var(--badbg);border-color:var(--bad)' : ''}" onclick="setPunch('${esc(p.no)}','N')"><b>✗ Not fixed<br><span style="font-weight:400;font-size:12px">Не устранено</span></b></button></div>
       <input class="fin" style="margin-top:8px" placeholder="Remark / примечание" value="${esc(e ? e.r || '' : '')}" onchange="setPRem('${esc(p.no)}',this.value)">
       <div class="small" style="font-size:12px;color:var(--mut)">${e ? `Last site update: ${dstr(e.t)} by ${esc(e.by)} · <span class="link" onclick="clearPunch('${esc(p.no)}')">undo</span>` : 'No site update yet'}</div>`; })()}</div>
   <div class="card"><div class="h3">Item</div>${kv([['Tag', tl, 1], ['Tag description', p.tage ? `${esc(p.tage)}<br><span style="color:var(--mut)">${esc(p.tagd)}</span>` : esc(p.tagd), 1], ['Discipline', `${DISC_IC(p.d)} ${esc((PT.discE || [])[p.disc] || '')}<br><span style="color:var(--mut)">${esc(p.d)}</span>`, 1], ['Section', ((PT.secE || [])[p.sec] || '') + ' / ' + PT.sec[p.sec]], ['Subsystem', PT.sub[p.sub]], ['Subsystem name', `${esc((PT.subnE || [])[p.subn] || '')}<br><span style="color:var(--mut)">${esc(PT.subn[p.subn])}</span>`, 1], ['System', PT.sys[p.sys]], ['Title', PT.tit[p.tit]]])}</div>
   <div class="card"><div class="h3">Status</div>${kv([['Status', p.st], ['Category', p.cat], ['Stage', ((PT.stgE || [])[p.stg] || '') + (PT.stg[p.stg] ? ' / ' + PT.stg[p.stg] : '')], ['Issue date', p.idate], ['Delay, days', p.st === 'Open' ? p.delay : ''], ['Closed date', p.cdate], ['Closure reason', p.reason], ['Inspection', p.insp], ['ACT status', p.act]])}</div>
   <div class="card"><div class="h3">Responsibility</div>${kv([['Issued by', PT.by[p.by]], ['Organisation', PT.org[p.org]], ['EPC responsible', PT.epc[p.epc]], ['Responsible to fix', PT.resp[p.resp]], ['Department', PT.dept[p.dept]], ['Notes', p.notes], ['Remarks', p.rem]])}</div>`;
}
// ===== MAX groups
const MAX_PROG = 'https://max.ru/join/1VYEFgINWOywM4Gx9U4uXZZsp1AKPCgozEWICdJ9dNs';
const MAX_PUNCH = 'https://max.ru/join/smnSVUCAq9I-ekqA8yqGF66F2IarRDLT0HkKoVZ6ssM';
const tstr = ts => { const d = new Date(ts); return dstr(ts) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };
const DISC_IC = d => /Электро/.test(d) ? '⚡' : /^Оборудование АСУ/.test(d) ? '🖥️' : /КИП/.test(d) ? '🎛️' : /связ/i.test(d) ? '📡' : /вентил|кондиц/i.test(d) ? '❄️' : /Трубо/.test(d) ? '🔧' : '📋';
// ===== progress lines from site entries
function progLines(onlyNew) {
  const out = []; const nw = e => e && (!onlyNew || !e.s);
  Object.entries(S2.c).forEach(([tag, e]) => { const c = CBY[tag]; if (!c) return; const L = IBY[tag] || [];
    const pL = e.L && e.L.v ? ` – actual length ${fmtn(e.L.v).replace(/ /g, '')} m` : '', pL2 = e.L && e.L.v ? `Pulled length ${fmtn(e.L.v).replace(/ /g, '')} m (actual)` : '';
    if (nw(e.P) && e.P.v) { const pr = e.L ? [e.P, e.L] : [e.P]; const pl = L.filter(x => /pull/i.test(x.g)); if (pl.length) pl.forEach(x => out.push({acc: x.acc, q: Math.max(x.q - x.f, 0) || x.q, t: e.P.t, tag, a: 'Pulled' + pL, by: e.P.by, ref: pr}));
      else out.push({acc: c.la || '-', q: Number(c.ln) || '', t: e.P.t, tag, a: 'Pulled' + pL, by: e.P.by, ref: pr}); }
    else if (nw(e.L) && e.L.v) out.push({acc: c.la || '', q: '', t: e.L.t, tag, a: pL2, by: e.L.by, ref: [e.L]});
    const fs = ['F', 'T'].filter(k => nw(e[k])); if (fs.length) { const b = cBase(c); const nE = ['F', 'T'].filter(k => (e[k] ? e[k].v : b[k]) && !b[k]).length;
      const refs = fs.map(k => e[k]); const t = Math.max(...refs.map(r => r.t));
      if (nE > 0) { const tl = L.filter(x => /termination/i.test(x.g)); const x = tl.find(y => !y.done) || tl[0];
        out.push({acc: x ? x.acc : (c.ta || '-'), q: nE, t, tag, a: 'Terminated ' + fs.filter(k => e[k].v).map(k => k === 'F' ? 'from' : 'to').join('+') + ' end', by: refs[0].by, ref: refs}); }
      else refs.forEach(r => r.s = r.s || 1); }
    if (nw(e.R) && e.R.v) out.push({acc: '', q: '', t: e.R.t, tag, a: 'Remark: ' + e.R.v, by: e.R.by, ref: [e.R]}); });
  Object.entries(S2.t || {}).forEach(([tag, m]) => Object.entries(m).forEach(([i, s]) => { if (nw(s) && s.v === 'N') { const r = ((D.lr || {})[tag] || [])[i] || []; out.push({acc: '', q: '', t: s.t, tag, a: `WRONG TERMINAL ${r[5] || ''}:${r[6] || ''} – ${s.r || ''}`, by: s.by, ref: [s]}); } }));
  Object.entries(S2.i).forEach(([acc, e]) => { if (!nw(e)) return; const x = I.find(y => y.acc === acc); if (!x) return; if (e.v) out.push({acc, q: Math.max(x.q - x.f, 0) || x.q, t: e.t, tag: x.tag, a: x.g, by: e.by, ref: [e]}); else out.push({acc, q: 0, t: e.t, tag: x.tag, a: x.g + ' – NOT done', by: e.by, ref: [e]}); });
  Object.entries(S2.m).forEach(([acc, e]) => { if (!nw(e)) return; const x = I.find(y => y.acc === acc); out.push({acc, q: e.q, t: e.t, tag: x ? x.tag : '', a: x ? x.g : '', by: e.by, ref: [e]}); });
  return out.sort((a, b) => a.t - b.t);
}
function progText(L) {
  const by = [...new Set(L.map(l => l.by))].join(', ') || PS_.name;
  return `Reported by: ${by} · ${tstr(Date.now())}\nCCR progress – RHI (${L.length} lines)\nAccess ID\tQty\tDate\tTag\tActivity\tBy\n` + L.map(l => [l.acc, l.q === '' ? '' : fmtn(l.q).replace(/ /g, ''), dstr(l.t), l.tag, l.a, l.by].join('\t')).join('\n');
}
function punchLines(onlyNew) { return Object.entries(PS_.e).filter(([no, e]) => PNO[no] && e.v && (!onlyNew || !e.s)).map(([no, e]) => ({no, e, p: PNO[no]})).sort((a, b) => a.e.t - b.e.t); }
function punchText(L) {
  const by = [...new Set(L.map(l => l.e.by))].join(', ') || PS_.name;
  return `Reported by: ${by} · ${tstr(Date.now())}\nCCR punch check (${L.filter(l => l.e.v === 'F').length} fixed, ${L.filter(l => l.e.v === 'N').length} not fixed)\nPunch No\tStatus\tDate\tTag\tRemark\tBy\n` + L.map(l => [l.no, l.e.v === 'F' ? 'Fixed' : 'Not fixed', dstr(l.e.t), l.p.tag || '', l.e.r || '', l.e.by].join('\t')).join('\n');
}
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (err) { const a = document.getElementById('rtx'); if (a) { a.select(); try { return document.execCommand('copy'); } catch (e2) {} } return false; } }
let REP = null;
function openReport(kind) {
  if (!PS_.name) return askPName(`openReport('${kind}')`);
  const isP = kind === 'punch'; const L = isP ? punchLines(true) : progLines(true);
  if (!L.length) { const last = isP ? S2.lastP : S2.lastText; return modalP(`<div class="h3">Nothing new to report</div><p style="font-size:14px">All entries are already sent.</p>${last ? `<button class="tile" style="width:100%;min-height:auto" onclick="showRep('${kind}',true)">Show last sent report again</button>` : ''}<button class="tile" style="width:100%;min-height:auto;margin-top:8px" onclick="closeP()">Close</button>`); }
  REP = {kind, L, text: isP ? punchText(L) : progText(L)}; showRep(kind, false);
}
function showRep(kind, old) {
  const isP = kind === 'punch'; const text = old ? (isP ? S2.lastP : S2.lastText) : REP.text; if (old) REP = {kind, L: [], text};
  modalP(`<div class="h3">${isP ? 'Punch report → MAX punch group' : 'Progress report → MAX progress group'}</div>
   <textarea id="rtx" class="fin" style="height:200px;font:12px monospace;white-space:pre" readonly>${esc(text)}</textarea>
   <button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="sendRep()"><b>📤 Send report to Paul</b><span class="n">copies the text and opens the MAX group – then paste & send</span></button>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="copyText(REP.text).then(ok=>toast(ok?'Copied for Paul':'Select the text and copy'))"><b>📋 Copy for Paul</b></button>
   <button class="tile" style="min-height:auto" onclick="shareRep()"><b>↗ Share…</b></button></div>
   <div style="font-size:12px;color:var(--mut);margin-top:8px">After you open the group, the lines are marked as sent and will not be sent again.</div>`);
}
function markSent() { if (!REP || !REP.L.length) return; const now = Date.now();
  if (REP.kind === 'punch') { REP.L.forEach(l => l.e.s = now); S2.lastP = REP.text; psave(); } else { REP.L.forEach(l => l.ref.forEach(r => r.s = now)); S2.lastText = REP.text; }
  S2.last = now; ssave(); REP.L = []; }
async function sendRep() { const ok = await copyText(REP.text); const url = REP.kind === 'punch' ? MAX_PUNCH : MAX_PROG; markSent();
  toast(ok ? 'Copied ✓ – in MAX press and hold, Paste, Send' : 'Copy the text, then paste in MAX'); setTimeout(() => { window.location.href = url; }, 600); closeP(); route(); }
function shareRep() { if (navigator.share) navigator.share({text: REP.text}).then(() => { markSent(); closeP(); route(); }).catch(() => {}); else copyText(REP.text).then(() => toast('Copied for Paul')); }
// ===== interconnection cables
const ICX = C.filter(c => isCCR(c.f || '') !== isCCR(c.o || ''));
function icView() {
  VS.IC = VS.IC || {f: 'open', q: '', lim: 80}; const v = VS.IC; const done = ICX.filter(c => cst(c).ok).length;
  setHead('Interconnection cables', `${done}/${ICX.length} complete · one end outside CCR`);
  main.innerHTML = `<div class="chips">${[['open', 'Not complete'], ['done', 'Complete'], ['all', 'All']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.IC.f='${k}';icView()">${l}</button>`).join('')}</div>
   <input class="fin" placeholder="Filter: cable, panel, building…" value="${esc(v.q)}" oninput="VS.IC.q=this.value;icList()"><div id="icl"></div>`; icList();
}
function icList() { const v = VS.IC, nq = N(v.q);
  const L = ICX.filter(c => { const s = cst(c); return (v.f === 'all' || (v.f === 'done' ? s.ok : !s.ok)) && (!nq || c._n.includes(nq) || c._e.includes(nq)); });
  const by = {}; L.forEach(c => { const out = isCCR(c.f || '') ? c.o : c.f; const k = (String(out).match(/G\d-[A-Z0-9]{8}/) || [String(out).split('-').slice(0, 2).join('-')])[0] || '-'; (by[k] = by[k] || []).push(c); });
  let n = 0; document.getElementById('icl').innerHTML = L.length ? Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([k, cs]) => { if (n >= v.lim) return ''; const part = cs.slice(0, v.lim - n); n += part.length;
    return `<div class="sect">Other end: ${esc(k)} · ${cs.length}</div>` + part.map(c => cCard(c, isCCR(c.f || '') ? 'OUT' : 'IN')).join(''); }).join('') + (L.length > v.lim ? `<button class="more" onclick="VS.IC.lim+=150;icList()">Show more (${L.length - v.lim})</button>` : '') : '<div class="empty">Nothing found</div>'; }
// ===== installation check (all non-cable activities)
const INST = I.filter(x => !/^Cable (pulling|termination)$/.test(x.g));
function instHome() { const s = gstat(INST); setHead('Installation check', `${s.d}/${s.n} lines done`);
  const tile = g => { const x = INST.filter(y => y.g === g), st = gstat(x), ns = x.filter(y => S2.i[y.acc] || S2.m[y.acc]).length;
    return `<button class="tile" onclick="go('#/a/${enc(g)}')"><b>${esc(g)}</b><div><span class="n">${st.d}/${st.n} lines${ns ? ' · ' + ns + ' site entries' : ''}</span><div class="pc">${st.pc}%</div><div class="pbar"><i style="width:${st.pc}%"></i></div></div></button>`; };
  main.innerHTML = `<div class="grid">${GROUPS.filter(g => !/^Cable (pulling|termination)$/.test(g)).map(tile).join('')}</div>`; }
// ===== drums
const DR = D.drums.map((a, i) => ({i, no: a[0], id: a[1], desc: a[2], len: a[3], u: a[4], rd: a[5], pl: a[6], stk: a[7], used: a[8], rem: a[9], sys: a[10], mrf: a[11], cab: a[12], _n: N(a[0] + ' ' + a[1] + ' ' + a[2])}));
const SYS_ALL = [...new Set([].concat(...DR.map(d => d.sys), D.mat.map(m => m[0]), ...D.mrf.map(m => m[5])))].filter(Boolean).sort();
const sysSel = (cur, fn) => `<select onchange="${fn}(this.value)"><option value="">All systems</option>${SYS_ALL.map(y => `<option ${cur === y ? 'selected' : ''}>${esc(y)}</option>`).join('')}</select>`;
function drumHome() { VS.DR = VS.DR || {q: '', sy: '', lim: 120}; const v = VS.DR; setHead('Cable drums', `${DR.length} drums · used / remaining`);
  main.innerHTML = `${sysSel(v.sy, "VS.DR.sy=")}<input class="fin" placeholder="Drum No, ident code, cable type…" value="${esc(v.q)}" oninput="VS.DR.q=this.value;drList()"><div id="drl"></div>`;
  main.querySelector('select').onchange = e => { VS.DR.sy = e.target.value; drList(); }; drList(); }
function drList() { const v = VS.DR, nq = N(v.q); const L = DR.filter(d => (!v.sy || d.sys.includes(v.sy)) && (!nq || d._n.includes(nq) || d.cab.some(c => N(c[0]).includes(nq))));
  document.getElementById('drl').innerHTML = L.length ? `<div class="list">${L.slice(0, v.lim).map(d => `<button class="li" onclick="go('#/dr/${d.i}')"><div class="m"><div class="t">${esc(d.no)}</div><div class="s">${esc(d.id)} · ${esc(d.desc)}</div></div><div class="r">${d.len ? fmtn(d.len) + ' ' + esc(d.u) : ''}<div><b style="color:${d.rem < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmtn(d.rem)}</b> left</div></div><span class="chev">›</span></button>`).join('')}</div>` + (L.length > v.lim ? `<button class="more" onclick="VS.DR.lim+=200;drList()">Show more (${L.length - v.lim})</button>` : '') : '<div class="empty">Nothing found</div>'; }
function drumView(i) { const d = DR[i]; setHead('Drum ' + d.no, d.id);
  main.innerHTML = `<div class="card"><div class="big">${esc(d.no)}</div><div style="font-size:13px;color:var(--mut)">${esc(d.desc)}</div>${kv([['Ident code', d.id], ['Drum length', d.len ? fmtn(d.len) + ' ' + d.u : ''], ['Used (cables)', fmtn(d.used) + ' m'], ['Remaining', `<b style="color:${d.rem < 0 ? 'var(--bad)' : 'var(--ok)'}">${fmtn(d.rem)} m</b>`, 1], ['Received', d.rd], ['Storage', d.pl], ['Stock', d.stk], ['Systems', d.sys.join(', ')]])}</div>
   <div class="card"><div class="h3">MRF / warehouse issue (${d.mrf.length})</div>${d.mrf.length ? `<div class="list">${d.mrf.map(m => `<button class="li" onclick="go('#/mr/${enc(m[0])}')"><div class="m"><div class="t">${esc(m[0])}</div><div class="s">MRF ${esc(m[1])} · received ${esc(m[3])} by ${esc(m[4])} · ${esc(m[5])}</div></div><div class="r"><b>${fmtn(m[2])}</b></div><span class="chev">›</span></button>`).join('')}</div>` : '<div class="empty">No MRF found</div>'}</div>
   <div class="card"><div class="h3">Cables from this drum (${d.cab.length})</div><div class="list">${d.cab.map(c => `<button class="li" onclick="${CBY[c[0]] ? `go('#/c/${enc(c[0])}')` : ''}"><div class="m"><div class="t">${esc(c[0])}</div><div class="s">Location ${esc(c[2])}${c[3] ? ' · ' + esc(c[3]) : ''}</div></div><div class="r"><b>${fmtn(c[1])}</b> m</div></button>`).join('')}</div></div>`; }
// ===== material tracking
function matHome() { VS.MT = VS.MT || {sy: '', q: ''}; const v = VS.MT; setHead('Material tracking', 'cable ident codes per system (design vs pulled)');
  main.innerHTML = `${sysSel(v.sy, '')}<input class="fin" placeholder="Ident code / cable type…" value="${esc(v.q)}" oninput="VS.MT.q=this.value;mtList()"><div id="mtl"></div>`;
  main.querySelector('select').onchange = e => { VS.MT.sy = e.target.value; mtList(); }; mtList(); }
function mtList() { const v = VS.MT, nq = N(v.q); const L = D.mat.filter(m => (!v.sy || m[0] === v.sy) && (!nq || N(m[1] + m[2]).includes(nq)));
  const by = {}; L.forEach(m => (by[m[0]] = by[m[0]] || []).push(m));
  document.getElementById('mtl').innerHTML = L.length ? `<div class="list">${Object.entries(by).map(([s, ms]) => `<div class="gh">${esc(s)} · ${ms.length} ident codes · design ${fmtn(ms.reduce((a, m) => a + m[5], 0))} m</div>` + ms.map(m => `<div class="li"><div class="m"><div class="t">${esc(m[1])}</div><div class="s">${esc(m[2])} · ${m[4]}/${m[3]} cables pulled</div></div><div class="r">design <b>${fmtn(m[5])}</b> m<div>pulled ${fmtn(m[6])} m</div></div></div>`).join('')).join('')}</div>` : '<div class="empty">Nothing found</div>'; }
// ===== MRF status
const MRF = D.mrf.map(m => ({no: m[0], d: m[1], cl: m[2], sub: m[3], pl: m[4], sys: m[5], L: m[6]})); const MRFBY = {}; MRF.forEach(m => MRFBY[m.no] = m);
function mrfHome() { VS.MR = VS.MR || {sy: '', q: ''}; const v = VS.MR; setHead('Material requests (MRF)', `${MRF.length} MRF from warehouse`);
  main.innerHTML = `${sysSel(v.sy, '')}<input class="fin" placeholder="MRF No, drum, ident, received by…" value="${esc(v.q)}" oninput="VS.MR.q=this.value;mrList()"><div id="mrl"></div>`;
  main.querySelector('select').onchange = e => { VS.MR.sy = e.target.value; mrList(); }; mrList(); }
function mrList() { const v = VS.MR, nq = N(v.q); const L = MRF.filter(m => (!v.sy || m.sys.includes(v.sy)) && (!nq || N(m.no + m.sub).includes(nq) || m.L.some(l => N(l.join(' ')).includes(nq)))).sort((a, b) => b.d.split('.').reverse().join('').localeCompare(a.d.split('.').reverse().join('')));
  document.getElementById('mrl').innerHTML = L.length ? `<div class="list">${L.map(m => { const rq = m.L.reduce((a, l) => a + (Number(l[3]) || 0), 0), rc = m.L.reduce((a, l) => a + (Number(l[4]) || 0), 0);
    return `<button class="li" onclick="go('#/mr/${enc(m.no)}')"><div class="m"><div class="t">${esc(m.no)}</div><div class="s">${esc(m.d)} · ${esc(m.sys.join(', '))} · ${m.L.length} lines</div></div><div class="r">${rc >= rq ? '<span class="badge b-ok">Received</span>' : '<span class="badge b-part">Partly</span>'}<div>${fmtn(rc)}/${fmtn(rq)}</div></div><span class="chev">›</span></button>`; }).join('')}</div>` : '<div class="empty">Nothing found</div>'; }
function mrfView(no) { const m = MRFBY[no]; if (!m) { main.innerHTML = '<div class="empty">MRF not found</div>'; return; } setHead(no, m.d);
  main.innerHTML = `<div class="card"><div class="big">${esc(m.no)}</div>${kv([['MRF date', m.d], ['Closed', m.cl], ['Subcontractor', m.sub], ['Warehouse', m.pl], ['Systems', m.sys.join(', ')]])}</div>
   <div class="card"><div class="h3">Lines (${m.L.length})</div><div class="list">${m.L.map(l => { const di = DR.find(d => d.no === l[0]);
     return `<button class="li" onclick="${di ? `go('#/dr/${di.i}')` : ''}"><div class="m"><div class="t">${esc(l[1])} · drum ${esc(l[0])}</div><div class="s">${esc(l[2])}</div><div class="s">Received ${esc(l[5])} by ${esc(l[6])}${l[7] !== '' && l[7] != null && l[7] !== l[4] ? ' · returned/actual ' + fmtn(l[7]) : ''}</div></div><div class="r">req <b>${fmtn(l[3])}</b><div>rec <b style="color:${Number(l[4]) >= Number(l[3]) ? 'var(--ok)' : 'var(--warn)'}">${fmtn(l[4])}</b></div></div></button>`; }).join('')}</div></div>`; }
// ===== drawings register
const RG = D.reg.map(r => { const m = r[0].match(/-([A-Z]{2})-([A-Z0-9]{4})-([A-Z]{2})-\d+/) || r[0].match(/-([A-Z]{2})-([A-Z0-9]{4})-\d+$/); const sys = r[1] && !/-$/.test(r[1]) ? r[1] : (m ? m[1] + '-' + m[2] : r[1].replace(/-$/, '') || '-');
  const ty = r[2] || (m && m[3]) || ''; return {no: r[0], sys, ty, en: r[3], ru: r[4], rev: r[5], st: r[6], dt: r[7], dis: r[8]}; });
const ACTS = [['pull', '🧵 Cable pulling', ['LC', 'LA', 'LD'], 'LC = cable routing / layout, LA/LD = cable list & cable journal. Check route, tray level and length before pulling.'],
  ['term', '🔌 Termination', ['LR', 'ZK', 'ZQ', 'CC'], 'LR = connection (termination) diagrams, ZK/ZQ = terminal & wiring schedules. Check terminal No and core marking.'],
  ['inst', '🔩 Installation', ['ZA', 'ZL', 'ZY', 'ZM', 'ZG', 'BT', 'BC'], 'ZA/ZL = equipment layout & installation, ZY = typical installation details. Check mounting height and support type.'],
  ['sch', '📐 Schemes / MTO', ['SF', 'BB', 'PB', 'RX'], 'SF = functional / structural schemes with material (ident codes), BB = bill of materials.'],
  ['ds', '📄 Specs / data sheets', ['DS'], 'DS = data sheets / specifications.'], ['oth', '📁 Other / general', [], 'General albums (architecture, interiors, civil…).']];
const actOf = ty => (ACTS.find(a => a[2].includes(ty)) || ACTS[ACTS.length - 1])[0];
function regHome() { VS.RG = VS.RG || {sy: '', a: '', q: ''}; const v = VS.RG; const syss = [...new Set(RG.map(r => r.sys))].sort();
  setHead('Drawings register', `${RG.length} CCR documents · pick system → activity`);
  const L0 = RG.filter(r => !v.sy || r.sys === v.sy);
  main.innerHTML = `<select onchange="VS.RG.sy=this.value;VS.RG.a='';regHome()"><option value="">1) Choose system… (${syss.length})</option>${syss.map(y => `<option ${v.sy === y ? 'selected' : ''}>${esc(y)} (${RG.filter(r => r.sys === y).length})</option>`).join('')}</select>
   <div class="sect">2) Activity</div><div class="chips" style="flex-wrap:wrap">${ACTS.map(a => { const n = L0.filter(r => actOf(r.ty) === a[0]).length; return n ? `<button class="chip ${v.a === a[0] ? 'on' : ''}" onclick="VS.RG.a=VS.RG.a==='${a[0]}'?'':'${a[0]}';regHome()">${a[1]} · ${n}</button>` : ''; }).join('')}</div>
   ${v.a ? `<div class="note" style="background:#eef3f8">💡 ${esc(ACTS.find(a => a[0] === v.a)[3])}</div>` : ''}
   <input class="fin" style="margin-top:8px" placeholder="Filter: doc No, title…" value="${esc(v.q)}" oninput="VS.RG.q=this.value;rgList()"><div id="rgl"></div>`; rgList(); }
function rgList() { const v = VS.RG, ql = v.q.trim().toLowerCase(); const L = RG.filter(r => (!v.sy || r.sys === v.sy) && (!v.a || actOf(r.ty) === v.a) && (!ql || (r.no + ' ' + r.en + ' ' + r.ru).toLowerCase().includes(ql)));
  const by = {}; L.forEach(r => (by[r.sys] = by[r.sys] || []).push(r));
  document.getElementById('rgl').innerHTML = L.length ? `<div class="list">${Object.entries(by).sort().map(([s, rs]) => `<div class="gh">${esc(s)} · ${rs.length}</div>` + rs.map(r => `<div class="li"><div class="m"><div class="t">${esc(r.no)}</div><div class="s" style="white-space:normal">${esc(r.en)}</div><div class="s" style="white-space:normal">${esc(r.ru)}</div></div><div class="r"><span class="badge ${/IFC|AFC|AS/i.test(r.st) ? 'b-ok' : 'b-part'}">Rev ${esc(r.rev)}</span><div>${esc(r.st)}</div><div>${esc(r.dt)}</div><div>${esc(r.ty)}</div></div></div>`).join('')).join('')}</div>` : '<div class="empty">Nothing found</div>'; }
// ===== daily progress entry
function progHome() { VS.DP = VS.DP || {q: ''}; const v = VS.DP; const pend = progLines(true); setHead('Daily progress', `${pend.length} lines not sent yet`);
  const mine = progLines(false).filter(l => dkey(l.t) === dkey(Date.now()));
  main.innerHTML = `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:10px" onclick="openReport('prog')"><b>📤 Send report to Paul (${pend.length} new lines)</b><span class="n">MAX · progress update group</span></button>
   <div class="chips"><button class="chip" onclick="askPName('route()')">👷 ${esc(PS_.name || 'Set name')}</button><button class="chip" onclick="openReport('punch')">Punch report (${punchLines(true).length})</button></div>
   <div class="sect">Find IWP line (access ID, tag, drawing)</div><input class="fin" placeholder="e.g. 88647 or JB-541" value="${esc(v.q)}" oninput="VS.DP.q=this.value;dpList()"><div id="dpl"></div>
   <div class="sect">Today's site entries (${mine.length})</div><div class="list">${mine.map(l => `<div class="li"><div class="m"><div class="t">${esc(l.acc || '–')} · ${esc(l.tag)}</div><div class="s">${esc(l.a)} · ${tstr(l.t)} · ${esc(l.by)}</div></div><div class="r"><b>${l.q === '' ? '' : fmtn(l.q)}</b>${l.ref.every(r => r.s) ? '<div><span class="badge b-ok">sent</span></div>' : '<div><span class="badge b-part">not sent</span></div>'}</div></div>`).join('') || '<div class="empty">No entries today. Tick cables in Panel check, or find a line above.</div>'}</div>`; dpList(); }
function dpList() { const nq = N(VS.DP.q); const el = document.getElementById('dpl'); if (nq.length < 2) { el.innerHTML = ''; return; }
  const L = I.filter(x => N(x.acc) === nq || x._n.includes(nq) || N(T.dwg[x.dwg] || '').includes(nq)).slice(0, 60);
  el.innerHTML = L.length ? `<div class="list">${L.map(x => { const s = ist(x); return `<button class="li" onclick="go('#/i/${x.i}')"><div class="m"><div class="t">${esc(x.acc)} · ${esc(x.tag)}</div><div class="s">${esc(x.g)} · ${esc(x.sy)}</div></div><div class="r"><span class="badge ${s.c}">${s.l}</span><div>${fmtn(x.f)}/${fmtn(x.q)} ${esc(x.u)}</div></div><span class="chev">›</span></button>`; }).join('')}</div>` : '<div class="empty">Nothing found</div>'; }

// ===== technician performance (from pasted MAX reports + this phone's own entries)
const pd = s => { const m = String(s).match(/(\d\d)\.(\d\d)\.(\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; };
function parseReports(txt) {
  const blocks = String(txt).replace(/\r/g, '').split(/(?=Reported by:)/).filter(b => /^Reported by:/.test(b.trim()));
  const out = [];
  blocks.forEach(b => { const ls = b.trim().split('\n').map(l => l.replace(/\u00a0/g, ' ')).filter(l => l.trim());
    const h = ls[0].match(/Reported by:\s*(.+?)\s*[·•|-]\s*(\d\d\.\d\d\.\d{4})(?:\s+(\d\d:\d\d))?/); if (!h) return;
    const hby = h[1].trim(), kind = /punch/i.test(ls[1] || '') ? 'punch' : 'prog';
    ls.slice(2).forEach(l => { if (/^(Access ID|Punch No)/i.test(l.trim())) return; let f = l.split('\t');
      if (kind === 'prog') { let r;
        if (f.length >= 5) r = {acc: f[0].trim(), q: Number(String(f[1]).replace(',', '.')) || 0, d: pd(f[2]), tag: f[3].trim(), a: f[4].trim(), by: (f[5] || hby).trim()};
        else { const m = l.trim().match(/^(\S*)\s+(\S*)\s*(\d\d\.\d\d\.\d{4})\s+(\S+)\s+(.*)$/); if (!m) return; r = {acc: m[1], q: Number(m[2].replace(',', '.')) || 0, d: pd(m[3]), tag: m[4], a: m[5].replace(new RegExp('\\s*' + hby.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), ''), by: hby}; }
        out.push(Object.assign(r, {k: 'prog'})); }
      else { let r;
        if (f.length >= 3) r = {no: f[0].trim(), v: /not/i.test(f[1]) ? 'N' : 'F', d: pd(f[2]), tag: (f[3] || '').trim(), by: (f[5] || hby).trim()};
        else { const m = l.trim().match(/^(\S+)\s+(Fixed|Not fixed)\s+(\d\d\.\d\d\.\d{4})\s*(\S*)/i); if (!m) return; r = {no: m[1], v: /not/i.test(m[2]) ? 'N' : 'F', d: pd(m[3]), tag: m[4], by: hby}; }
        out.push(Object.assign(r, {k: 'punch'})); } }); });
  return out;
}
const rxKey = r => r.k === 'prog' ? ['p', r.by, r.d, r.acc, r.tag, r.a].join('|') : ['k', r.by, r.d, r.no].join('|');
function importPaste() { const t = document.getElementById('ptx').value; const L = parseReports(t); if (!L.length) return toast('No report found – paste text starting with "Reported by:"');
  S2.rx = S2.rx || []; const have = new Set(S2.rx.map(rxKey)); let n = 0; L.forEach(r => { const k = rxKey(r); if (!have.has(k)) { have.add(k); S2.rx.push(r); n++; } });
  ssave(); closeP(); toast(`Imported ${n} new lines${L.length - n ? ' · ' + (L.length - n) + ' already in' : ''}`); route(); }
function pasteBox() { modalP(`<div class="h3">Paste reports from MAX</div><div style="font-size:13px;color:var(--mut);margin-bottom:6px">In MAX: press and hold the report message → Copy. Paste one or many reports here. Lines already imported are skipped.</div>
  <textarea id="ptx" class="fin" style="height:220px;font:12px monospace" placeholder="Reported by: …"></textarea>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="navigator.clipboard&&navigator.clipboard.readText().then(t=>document.getElementById('ptx').value=t).catch(()=>toast('Press and hold in the box → Paste'))"><b>📋 Paste</b></button><button class="tile main" style="min-height:auto" onclick="importPaste()"><b>⬇ Import</b></button></div>`); }
function perfRows() {
  const all = (S2.rx || []).slice(); const have = new Set(all.map(rxKey));
  progLines(false).forEach(l => { const r = {k: 'prog', acc: l.acc, q: Number(l.q) || 0, d: dkey(l.t), tag: l.tag, a: l.a, by: l.by}; if (!have.has(rxKey(r))) { have.add(rxKey(r)); all.push(r); } });
  punchLines(false).forEach(l => { const r = {k: 'punch', no: l.no, v: l.e.v, d: dkey(l.e.t), tag: l.p.tag, by: l.e.by}; if (!have.has(rxKey(r))) { have.add(rxKey(r)); all.push(r); } });
  return all;
}
function perfView() {
  VS.TP = VS.TP || {p: '7', who: ''}; const v = VS.TP; const today = dkey(Date.now());
  const from = v.p === '1' ? today : v.p === '7' ? dkey(Date.now() - 6 * 864e5) : v.p === '30' ? dkey(Date.now() - 29 * 864e5) : '';
  const R = perfRows().filter(r => r.d && (!from || r.d >= from));
  const W = {}; R.forEach(r => { const w = W[r.by] = W[r.by] || {lines: 0, pull: 0, m: 0, term: 0, inst: 0, rem: 0, pf: 0, pn: 0, days: new Set(), last: ''};
    w.days.add(r.d); if (r.d > w.last) w.last = r.d;
    if (r.k === 'punch') { r.v === 'F' ? w.pf++ : w.pn++; return; }
    if (/^Remark/.test(r.a)) { w.rem++; return; } w.lines++;
    if (/^Pulled/.test(r.a)) { w.pull++; const c = CBY[r.tag]; w.m += r.q; } else if (/^Terminated/.test(r.a)) w.term += r.q || 1; else if (/termination/i.test(r.a)) w.term += r.q || 1; else if (/pulling/i.test(r.a)) { w.pull++; w.m += r.q; } else if (!/NOT done/.test(r.a)) w.inst++; });
  const list = Object.entries(W).map(([n, w]) => Object.assign(w, {n, score: w.pull + w.term + w.inst + w.pf})).sort((a, b) => b.score - a.score);
  const mx = Math.max(1, ...list.map(w => w.score));
  const tot = list.reduce((a, w) => ({pull: a.pull + w.pull, term: a.term + w.term, inst: a.inst + w.inst, pf: a.pf + w.pf}), {pull: 0, term: 0, inst: 0, pf: 0});
  setHead('Technician performance', `${list.length} technicians · ${({1: 'today', 7: 'last 7 days', 30: 'last 30 days', a: 'all time'})[v.p]}`);
  const days = []; for (let i = 6; i >= 0; i--) days.push(dkey(Date.now() - i * 864e5));
  main.innerHTML = `<div class="chips">${[['1', 'Today'], ['7', '7 days'], ['30', '30 days'], ['a', 'All']].map(([k, l]) => `<button class="chip ${v.p === k ? 'on' : ''}" onclick="VS.TP.p='${k}';perfView()">${l}</button>`).join('')}<button class="chip" onclick="go('#/ow')">🔑 Import / IWP report</button><button class="chip" onclick="exportPerf()">⬇ Excel / CSV</button></div>
   <div class="kpi"><div><b>${tot.pull}</b><span>cables pulled</span></div><div><b>${tot.term}</b><span>ends terminated</span></div><div><b>${tot.inst}</b><span>installation lines</span></div></div>
   <div class="kpi"><div><b style="color:var(--ok)">${tot.pf}</b><span>punch fixed</span></div><div><b>${R.length}</b><span>lines reported</span></div><div><b>${(S2.rx || []).length}</b><span>imported lines</span></div></div>
   <div class="sect">Ranking</div>${list.length ? list.map((w, i) => `<div class="card" style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : '👷'} ${esc(w.n)}</b><span class="pc">${w.score} items</span></div>
     <div class="pbar"><i style="width:${Math.round(100 * w.score / mx)}%"></i></div>
     <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px;font-size:12px;text-align:center">
      <div><b style="font-size:16px">${w.pull}</b><br>pulled${w.m ? '<br>' + fmtn(w.m) + ' m' : ''}</div><div><b style="font-size:16px">${w.term}</b><br>ends term.</div><div><b style="font-size:16px">${w.inst}</b><br>installed</div><div><b style="font-size:16px;color:var(--ok)">${w.pf}</b><br>punch fixed${w.pn ? '<br>' + w.pn + ' not fixed' : ''}</div></div>
     <div style="font-size:12px;color:var(--mut);margin-top:6px">Active ${w.days.size} day(s) · last report ${w.last.split('-').reverse().join('.')}${w.rem ? ' · ' + w.rem + ' remarks' : ''}</div>
     <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:6px">${days.map(d => { const n = R.filter(r => r.by === w.n && r.d === d && !/^Remark/.test(r.a || '')).length; return `<div style="text-align:center;font-size:10px;color:var(--mut)"><div style="height:22px;border-radius:4px;background:${n ? (n >= 10 ? 'var(--ok)' : '#8fd0a8') : '#eceff3'};color:${n >= 10 ? '#fff' : 'var(--ink)'};font-size:11px;line-height:22px">${n || ''}</div>${d.slice(8)}.${d.slice(5, 7)}</div>`; }).join('')}</div></div>`).join('') : '<div class="empty">No reports yet. Tap “Paste MAX reports” and paste the messages from the groups.</div>'}
   ${(S2.rx || []).length ? `<div class="foot"><span class="link" onclick="if(confirmClear())route()">Clear imported reports</span></div>` : ''}`;
}
function confirmClear() { modalP(`<div class="h3">Clear all imported reports?</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="closeP()">Cancel</button><button class="tile" style="min-height:auto;background:var(--badbg)" onclick="S2.rx=[];ssave();closeP();route()"><b>Clear</b></button></div>`); return false; }
function exportPerf() { const R = perfRows(); if (!R.length) return toast('Nothing to export'); const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['Date', 'Technician', 'Type', 'Access ID / Punch No', 'Qty', 'Tag', 'Activity / status']].concat(R.sort((a, b) => a.d.localeCompare(b.d)).map(r => [r.d.split('-').reverse().join('.'), r.by, r.k === 'punch' ? 'Punch' : 'Progress', r.k === 'punch' ? r.no : r.acc, r.k === 'punch' ? '' : r.q, r.tag, r.k === 'punch' ? (r.v === 'F' ? 'Fixed' : 'Not fixed') : r.a]));
  dlFile(`Technician_performance_${dkey(Date.now())}.csv`, '\ufeff' + rows.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv'); }

// ===== owner mode (import + total IWP report) – hidden from technicians
const OWNER_PIN = '548477';
let ttlTaps = 0, ttlT = 0;
function ttlTap() { const n = Date.now(); ttlTaps = n - ttlT < 1200 ? ttlTaps + 1 : 1; ttlT = n; if (ttlTaps >= 5) { ttlTaps = 0; ownerLogin(); } }
function ownerLogin() { if (S2.owner) return modalP(`<div class="h3">Owner mode is ON</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile main" style="min-height:auto" onclick="closeP();go('#/ow')"><b>Open import</b></button><button class="tile" style="min-height:auto" onclick="S2.owner=0;ssave();closeP();go('#/')"><b>Turn off</b></button></div>`);
  modalP(`<div class="h3">Owner password</div><input class="fin" id="opin" type="password" inputmode="numeric" placeholder="Password"><button class="tile main" style="width:100%;min-height:auto" onclick="if(document.getElementById('opin').value==='${OWNER_PIN}'){S2.owner=1;ssave();closeP();go('#/ow')}else toast('Wrong PIN')"><b>Unlock</b></button>`); }
function aggDay(day) {
  const R = (S2.rx || []).filter(r => r.k === 'prog' && r.d === day && r.acc && r.acc !== '-' && !/^Remark|NOT done/.test(r.a));
  const one = {}; R.forEach(r => { const k = r.acc + '|' + r.tag + '|' + r.a; const o = one[k] = one[k] || {acc: r.acc, tag: r.tag, a: r.a, q: 0, by: new Set()}; o.q = Math.max(o.q, r.q); o.by.add(r.by); });
  const A = {}; Object.values(one).forEach(o => { const x = A[o.acc] = A[o.acc] || {acc: o.acc, q: 0, tags: new Set(), acts: new Set(), by: new Set(), dup: 0}; x.q += o.q; x.tags.add(o.tag); x.acts.add(o.a); o.by.forEach(b => x.by.add(b)); if (o.by.size > 1) x.dup++; });
  const AI = {}; I.forEach(y => AI[y.acc] = y);
  return Object.values(A).map(x => { const y = AI[x.acc]; const rem = y ? Math.max(y.q - y.f, 0) : null; return Object.assign(x, {y, rem, warn: !y ? 'Access ID not in IWP' : (x.q > rem + 1e-6 ? `More than remaining (${fmtn(rem)} ${y.u})` : '')}); }).sort((a, b) => String(a.acc).localeCompare(String(b.acc), undefined, {numeric: true}));
}
function iwpTSV(L, day) { return L.map(x => [x.acc, fmtn(x.q).replace(/ /g, ''), day.split('-').reverse().join('.'), [...x.tags].join(', ') + ' – ' + [...x.by].join(', ')].join('\t')).join('\n'); }
function ownerView() {
  if (!S2.owner) { go('#/'); return; }
  const days = [...new Set((S2.rx || []).map(r => r.d))].filter(Boolean).sort().reverse();
  VS.OW = VS.OW || {}; if (!VS.OW.d || !days.includes(VS.OW.d)) VS.OW.d = days[0] || dkey(Date.now()); const day = VS.OW.d;
  const L = aggDay(day), warn = L.filter(x => x.warn).length, ppl = new Set((S2.rx || []).filter(r => r.d === day).map(r => r.by));
  const pf = (S2.rx || []).filter(r => r.k === 'punch' && r.d === day); const ex = (S2.ex || {})[day];
  setHead('Owner – import progress', `${(S2.rx || []).length} imported lines · ${days.length} day(s)`);
  main.innerHTML = `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="pasteBox()"><b>⬇ Import progress – paste MAX messages</b><span class="n">select all report messages in the group → Copy → paste here (100+ at once is fine)</span></button>
   <div class="chips">${days.map(d => `<button class="chip ${d === day ? 'on' : ''}" onclick="VS.OW.d='${d}';ownerView()">${d.split('-').reverse().join('.')}${(S2.ex || {})[d] ? ' ✓' : ''}</button>`).join('') || '<span class="s2">No imports yet</span>'}</div>
   <div class="kpi"><div><b>${L.length}</b><span>access IDs</span></div><div><b>${ppl.size}</b><span>technicians reported</span></div><div><b style="color:${warn ? 'var(--bad)' : 'var(--ok)'}">${warn}</b><span>to check</span></div></div>
   <div class="card"><div class="h3">Total IWP report · ${day.split('-').reverse().join('.')}${ex ? ` <span class="badge b-ok">exported ${tstr(ex)}</span>` : ''}</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:8px">Same cable reported by 2 people on the same day is counted once. Format = Daily Input sheet: Access ID · Qty · Date · Remark.</div>
    <button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="ownCopy()"><b>📋 Copy for Excel (Daily Input)</b></button>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px"><button class="tile" style="min-height:auto" onclick="ownCSV()"><b>⬇ CSV</b></button><button class="tile" style="min-height:auto" onclick="ownShare()"><b>↗ Share</b></button><button class="tile" style="min-height:auto" onclick="S2.ex=S2.ex||{};S2.ex['${day}']=Date.now();ssave();ownerView()"><b>✓ Mark exported</b></button></div></div>
   <div class="list">${L.map(x => `<div class="li" style="${x.warn ? 'background:#fff6f5' : ''}"><div class="m"><div class="t">${esc(x.acc)} · ${esc([...x.tags].join(', '))}</div><div class="s">${esc([...x.acts].join(', '))} · ${esc([...x.by].join(', '))}</div>${x.warn ? `<div class="s" style="color:var(--bad)">⚠ ${esc(x.warn)}</div>` : ''}${x.dup ? '<div class="s">reported by 2+ people – counted once</div>' : ''}</div><div class="r"><b style="font-size:15px">${fmtn(x.q)}</b><div>${x.y ? esc(x.y.u) : ''}</div></div></div>`).join('') || '<div class="empty">No progress for this day</div>'}</div>
   ${pf.length ? `<div class="sect">Punch reported this day (${pf.filter(r => r.v === 'F').length} fixed · ${pf.filter(r => r.v === 'N').length} not fixed)</div><button class="more" onclick="ownPunch()">📋 Copy punch list for Excel</button>` : ''}
   <div class="sect">More</div><div class="grid"><button class="tile main" onclick="go('#/al')"><b>🔔 Alerts from site</b><div><span class="n">${alCount()} new</span></div></button><button class="tile" onclick="go('#/tq')"><b>❓ TQs (owner)</b><div><span class="n">${CTQ.filter(t => t.st === 'Open').length} CTQ open</span></div></button><button class="tile" onclick="go('#/mp')"><b>👷 Manpower suggestion</b><div><span class="n">${S2.mp.n} people</span></div></button>${'<button class="tile" onclick="go(\'#/tp\')"><b>👷 Technician performance</b><div><span class="n">who reported how much</span></div></button>'}<button class="tile" onclick="confirmClear()"><b>🗑 Clear imported</b><div><span class="n">start fresh</span></div></button></div>`;
}
function ownCopy() { const d = VS.OW.d, L = aggDay(d); if (!L.length) return toast('Nothing for this day'); copyText(iwpTSV(L, d)).then(ok => { if (ok) { toast(`Copied ${L.length} lines – paste in Daily Input cell A`); S2.ex = S2.ex || {}; S2.ex[d] = Date.now(); ssave(); ownerView(); } else toast('Copy failed – use CSV'); }); }
function ownCSV() { const d = VS.OW.d, L = aggDay(d); if (!L.length) return toast('Nothing for this day'); const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  dlFile(`IWP_daily_report_${d.split('-').reverse().join('.')}.csv`, '﻿' + [['Access ID', 'Qty', 'Date', 'Remark', 'Activity', 'Unit', 'Remaining in IWP', 'Check']].concat(L.map(x => [x.acc, x.q, d.split('-').reverse().join('.'), [...x.tags].join(', ') + ' – ' + [...x.by].join(', '), [...x.acts].join(', '), x.y ? x.y.u : '', x.rem == null ? '' : x.rem, x.warn])).map(r => r.map(q).join(';')).join('\r\n'), 'text/csv'); }
function ownShare() { const d = VS.OW.d, L = aggDay(d); const t = `IWP daily report ${d.split('-').reverse().join('.')} – CCR RHI (${L.length} access IDs)\nAccess ID\tQty\tDate\tRemark\n` + iwpTSV(L, d); if (navigator.share) navigator.share({text: t}).catch(() => {}); else copyText(t).then(() => toast('Copied')); }
function ownPunch() { const d = VS.OW.d; const one = {}; (S2.rx || []).filter(r => r.k === 'punch' && r.d === d).forEach(r => one[r.no] = r);
  copyText(Object.values(one).map(r => [r.no, r.v === 'F' ? 'Fixed' : 'Not fixed', d.split('-').reverse().join('.'), r.tag, r.by].join('\t')).join('\n')).then(() => toast('Punch list copied')); }

// ======== v3.2 modules ========
const APPV = '3.5';
const shortT = t => String(t || '').replace(/^G0-D1810BX0-/, '').replace(/^G0-D1801FX0-/, 'FX0-');
const SYSN = {'EL-ESPS': ['Substation 10/0.4 kV & power supply', 'Подстанция 10/0,4 кВ'], 'EL-EMSV': ['Power installation (boards, UPS, motors)', 'Силовое электрооборудование'], 'EL-ESBZ': ['Power supply from utility substation', 'Электроснабжение от ПС'], 'EL-ELOV': ['Indoor lighting', 'Внутреннее освещение'], 'EL-EG02': ['Earthing & lightning protection', 'Заземление и молниезащита'], 'EL-EG01': ['Area earthing', 'Заземление площадки'], 'EH-EOES': ['Electric heating', 'Электрообогрев'], 'EH-AEOG': ['Heat tracing', 'Электрообогрев (кабель)'], 'EH-EOBK': ['Electric heating (other)', 'Электрообогрев'],
  'IN-DCS': ['Distributed Control System (DCS)', 'РСУ'], 'IN-ESD': ['Emergency Shutdown (ESD)', 'ПАЗ'], 'IN-SPAP': ['Fire alarm & fire fighting control (AFA&FFS)', 'АСПС и ПТ'], 'IN-GDSS': ['Gas detection', 'Контроль загазованности'], 'IN-ASUE': ['Utilities control system', 'АСУ ЭО (утилиты)'], 'IN-ASUS': ['Power supply control system', 'АСУ ЭС'], 'IN-ASKU': ['Utility metering (AUMS)', 'АСКУ ЭР'], 'IN-MAEC': ['Rotating equipment monitoring (CMS)', 'МСО и ВО'], 'IN-MFMS': ['Material flow metering (MFMS)', 'СУМП'], 'IN-AKVS': ['Emission monitoring (CEMS)', 'АКВС'], 'IN-INTS': ['Operator training simulator', 'Тренажёр оператора'], 'IN-INSS': ['Information security', 'СОИБ'], 'IN-AOVK': ['HVAC automation', 'Автоматизация ОВиК'], 'IN-AKMP': ['Analyzer system', 'Анализаторы'],
  'FA-PSGN': ['Fire alarm (building)', 'Пожарная сигнализация'], 'FA-SPBA': ['Fire safety automation (area)', 'Автоматика пожарной безопасности'], 'FA-GPTS': ['Gas fire extinguishing', 'Газовое пожаротушение'],
  'TE-SKST': ['Structured cabling (SCS)', 'СКС'], 'TE-LVST': ['LAN', 'ЛВС'], 'TE-GGSO': ['PA/GA & dispatch intercom', 'ГГС и О'], 'TE-RPTV': ['Process CCTV', 'Технологическое ТВ'], 'TE-VKSV': ['Video conferencing', 'ВКС'], 'TE-ECHS': ['Master clock', 'Часофикация'], 'TE-LSOP': ['Local warning system', 'ЛСО'], 'TE-SARD': ['DECT radio access', 'DECT'], 'TE-SSKT': ['TV antenna (CATV)', 'СКТ'], 'TE-FTSV': ['Fibre network (FTN)', 'ВОЛС'], 'HV-OVKV': ['HVAC', 'ОВиК'], 'OTHER': ['Other cables', 'Прочие']};
const sysName = s => (SYSN[s] || [s, ''])[0];
// ---- punch per system
const sysCode = s => (s.split('-')[1] || s);
function sysPunch(s) { const c = sysCode(s); const re = new RegExp('-' + c + '(-|$)'); return PU.filter(p => re.test(PT.sub[p.sub] || '')); }
// ---- system status (cables complete + no A punch + no CTQ)
const SG = D.sg || {};
function sysStat(s) { const g = SG[s]; if (!g) return null; const cs = [...new Set([].concat(...g.e.map(e => e[2])))].map(i => C[i]).filter(c => !dead(c));
  const open = cs.filter(c => !cst(c).ok), ctq = cs.filter(c => blk(c)), pa = sysPunch(s).filter(p => p.st === 'Open' && p.cat === 'A');
  return {n: cs.length, open: open.length, ctq: ctq.length, pa: pa.length, ok: !open.length && !ctq.length && !pa.length, cs, openL: open, ctqL: ctq, paL: pa}; }
const OVG = [['⚡ Power & earthing', ['EL-ESPS', 'EL-ESBZ', 'EL-EMSV', 'EL-ELOV', 'EL-EG02', 'EH-EOES', 'EH-AEOG']], ['🖥️ Control & safety', ['IN-DCS', 'IN-ESD', 'IN-SPAP', 'IN-GDSS', 'IN-ASUS', 'IN-ASUE', 'IN-ASKU', 'IN-AOVK', 'IN-MAEC', 'IN-MFMS', 'IN-AKVS', 'IN-AKMP', 'IN-INTS', 'IN-INSS']], ['🔥 Fire', ['FA-PSGN', 'FA-SPBA']], ['📡 Telecom', ['TE-SKST', 'TE-LVST', 'TE-FTSV', 'TE-GGSO', 'TE-RPTV', 'TE-VKSV', 'TE-ECHS', 'TE-LSOP', 'TE-SARD', 'TE-SSKT']]];
const OVL = [['EL-ESPS', 'EL-EMSV', 'power'], ['EL-ESBZ', 'EL-EMSV', 'power'], ['EL-EMSV', 'IN-DCS', 'power'], ['EL-EMSV', 'IN-ESD', 'power'], ['EL-EMSV', 'IN-SPAP', 'power'], ['EL-EMSV', 'TE-SKST', 'power'], ['EL-EMSV', 'FA-PSGN', 'power'],
  ['IN-DCS', 'IN-ESD', 'signal'], ['IN-GDSS', 'IN-ESD', 'signal'], ['IN-SPAP', 'IN-DCS', 'signal'], ['FA-PSGN', 'IN-SPAP', 'signal'], ['FA-SPBA', 'IN-SPAP', 'signal'], ['IN-SPAP', 'TE-GGSO', 'signal'], ['TE-SKST', 'TE-LVST', 'network'], ['TE-LVST', 'IN-DCS', 'network'], ['TE-FTSV', 'TE-LVST', 'network'], ['IN-ASUS', 'EL-ESPS', 'signal']];
const blk = c => !!(c.q || /HOLD/i.test(c.h || ''));
const dead = c => /удален|дубликат|другом проекте/i.test(c.h || '');
const stCol = st => !st ? '#9aa3ad' : st.ok ? '#1e8a4c' : '#c62828';
function bdHome() {
  setHead('System block diagrams', 'green = ready to start commissioning · red = issue');
  const colW = 230, bh = 54, gap = 14; const pos = {};
  let H = 0; OVG.forEach(([g, ss], ci) => { let y = 40; ss.filter(s => SG[s]).forEach(s => { pos[s] = {x: 16 + ci * colW, y}; y += bh + gap; }); H = Math.max(H, y); });
  const W = 16 + OVG.length * colW;
  const ST = {}; Object.keys(pos).forEach(s => ST[s] = sysStat(s));
  const edges = OVL.filter(([a, b]) => pos[a] && pos[b]).map(([a, b, k]) => { const A = pos[a], B = pos[b]; const bad = !(ST[a] && ST[a].ok && ST[b] && ST[b].ok);
    const x1 = A.x + 200, y1 = A.y + bh / 2, x2 = B.x, y2 = B.y + bh / 2; const sx = x2 > x1 ? x1 : A.x + 100, sy = x2 > x1 ? y1 : (B.y > A.y ? A.y + bh : A.y), ex = x2 > x1 ? x2 : B.x + 100, ey = x2 > x1 ? y2 : (B.y > A.y ? B.y : B.y + bh);
    const dpath = x2 > x1 ? `M${sx},${sy} C${sx + 40},${sy} ${ex - 40},${ey} ${ex},${ey}` : `M${sx},${sy} C${sx + 60},${(sy + ey) / 2} ${ex + 60},${(sy + ey) / 2} ${ex},${ey}`;
    return `<path d="${dpath}" fill="none" stroke="${bad ? '#e53935' : '#2e9d5b'}" stroke-width="${k === 'power' ? 3 : 2}" ${k === 'network' ? 'stroke-dasharray="6 4"' : k === 'signal' ? 'stroke-dasharray="2 3"' : ''} marker-end="url(#ar${bad ? 'r' : 'g'})" opacity=".85"/>`; }).join('');
  const boxes = Object.entries(pos).map(([s, p]) => { const st = ST[s]; const c = stCol(st);
    return `<g onclick="go('#/bd/${s}')" style="cursor:pointer"><rect x="${p.x}" y="${p.y}" width="200" height="${bh}" rx="9" fill="${st && st.ok ? '#e8f6ee' : '#fdecea'}" stroke="${c}" stroke-width="2.5"/><text x="${p.x + 10}" y="${p.y + 19}" font-size="13" font-weight="700" fill="#18202b">${esc(s)} ${st && st.ok ? '✓' : '⚠'}</text>
      <text x="${p.x + 10}" y="${p.y + 34}" font-size="10.5" fill="#444">${esc(sysName(s).slice(0, 34))}</text><text x="${p.x + 10}" y="${p.y + 47}" font-size="10" fill="${c}">${st ? (st.ok ? 'READY' : `${st.open} cables · ${st.pa} A-punch · ${st.ctq} CTQ`) : ''}</text></g>`; }).join('');
  const heads = OVG.map(([g], ci) => `<text x="${16 + ci * colW}" y="24" font-size="13" font-weight="700" fill="#023362">${g}</text>`).join('');
  const all = Object.values(ST).filter(Boolean), rd = all.filter(x => x.ok).length;
  main.innerHTML = `<div class="kpi"><div><b style="color:var(--ok)">${rd}</b><span>systems ready</span></div><div><b style="color:var(--bad)">${all.length - rd}</b><span>systems with issues</span></div><div><b>${all.reduce((a, x) => a + x.pa, 0)}</b><span>open A-punch</span></div></div>
   <div class="note" style="background:#eef3f8">Ready to start = all cables pulled + terminated, no open A-punch, no CTQ/hold. Tap a block to see how the system is connected. <b>—</b> power · <b>- -</b> network · <b>···</b> signals / interlocks</div>
   <div class="zw" style="overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;margin-top:8px"><svg width="${W}" height="${H + 10}" viewBox="0 0 ${W} ${H + 10}" font-family="Arial">${MK}${heads}${edges}${boxes}</svg></div>
   <div class="sect">All systems</div><div class="list">${Object.keys(pos).sort((a, b) => (ST[a].ok - ST[b].ok) || a.localeCompare(b)).map(s => { const st = ST[s]; return `<button class="li" onclick="go('#/bd/${s}')"><div class="m"><div class="t">${st.ok ? '🟢' : '🔴'} ${esc(s)} · ${esc(sysName(s))}</div><div class="s">${st.n} cables · ${st.open} open · ${st.pa} A-punch · ${st.ctq} CTQ/hold</div></div><span class="badge ${st.ok ? 'b-ok' : 'b-no'}">${st.ok ? 'Ready' : 'Not ready'}</span><span class="chev">›</span></button>`; }).join('')}</div>`;
}
const MK = `<defs><marker id="arg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#2e9d5b"/></marker><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#e53935"/></marker></defs>`;
function bdSys(s) {
  const g = SG[s]; if (!g) { main.innerHTML = '<div class="empty">No cable data for this system</div>'; return; }
  const st = sysStat(s); VS.BZ = VS.BZ || 1; setHead(s + ' · block diagram', sysName(s));
  const bw = 150, bh = 40, dx = 200, dy = 54;
  const nb = g.n.map(n => { const tags = n[5] ? n[6] : [n[0]]; const pa = tags.some(t => (PUBY[t] || []).some(p => p.st === 'Open' && p.cat === 'A')); return pa; });
  const es = g.e.map(([a, b, cs], k) => { const cc = cs.map(i => C[i]).filter(c => !dead(c)); const done = cc.filter(c => cst(c).ok).length, q = cc.filter(c => blk(c)).length; return {k, a, b, cs, n: cc.length, done, q, bad: done < cc.length || q > 0}; }).filter(e => e.n);
  const nbad = g.n.map((n, i) => nb[i] || es.some(e => (e.a === i || e.b === i) && e.bad));
  const W = (Math.max(...g.n.map(n => n[3])) + 1) * dx + 20, H = (Math.max(...g.n.map(n => n[4])) + 1) * dy + 20;
  const X = n => 10 + n[3] * dx, Y = n => 10 + n[4] * dy;
  const edges = es.map(e => { const k = e.k; const A = g.n[e.a], B = g.n[e.b]; const x1 = X(A) + bw, y1 = Y(A) + bh / 2, x2 = X(B), y2 = Y(B) + bh / 2; const col = e.bad ? '#e53935' : '#2e9d5b';
    const p = x2 > x1 ? `M${x1},${y1} C${x1 + 25},${y1} ${x2 - 25},${y2} ${x2},${y2}` : `M${x1 - bw / 2},${y1 + bh / 2} C${x1 - bw / 2},${y1 + 40} ${x2 + bw / 2},${y2 - 40} ${x2 + bw / 2},${y2 - bh / 2}`;
    return `<g onclick="bdEdge('${s}',${k})" style="cursor:pointer"><path d="${p}" fill="none" stroke="${col}" stroke-width="${e.bad ? 2.6 : 2}" marker-end="url(#ar${e.bad ? 'r' : 'g'})"/><path d="${p}" fill="none" stroke="transparent" stroke-width="12"/>${e.n > 1 || e.bad ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 3}" font-size="10" fill="${col}" text-anchor="middle">${e.done}/${e.n}${e.q ? ' CTQ' : ''}</text>` : ''}</g>`; }).join('');
  const nodes = g.n.map((n, i) => { const bad = nbad[i]; const isP = PBY[n[0]];
    return `<g onclick="${n[5] ? `bdGroup('${s}',${i})` : isP ? `go('#/p/${enc(n[0])}')` : `go('#/s/${enc(n[0])}')`}" style="cursor:pointer"><rect x="${X(n)}" y="${Y(n)}" width="${bw}" height="${bh}" rx="7" fill="${n[5] ? '#f3f0ff' : bad ? '#fdecea' : '#e8f6ee'}" stroke="${bad ? '#c62828' : '#1e8a4c'}" stroke-width="${nb[i] ? 3 : 1.5}" ${n[5] ? 'stroke-dasharray="4 3"' : ''}/>
      <text x="${X(n) + 7}" y="${Y(n) + 16}" font-size="11" font-weight="700" fill="#18202b">${esc(shortT(n[1]).slice(0, 22))}${nb[i] ? ' ⚠A' : ''}</text><text x="${X(n) + 7}" y="${Y(n) + 31}" font-size="9" fill="#555">${esc((n[2] || '').slice(0, 30))}</text></g>`; }).join('');
  const z = VS.BZ;
  main.innerHTML = `<div class="card" style="border-left:6px solid ${st.ok ? 'var(--ok)' : 'var(--bad)'}"><div class="big" style="color:${st.ok ? 'var(--ok)' : 'var(--bad)'}">${st.ok ? '🟢 READY to start commissioning' : '🔴 NOT READY'}</div>
    <div style="font-size:13px;margin-top:4px">${esc(sysName(s))} · ${esc((SYSN[s] || ['', ''])[1])}</div>
    <div class="kpi" style="margin:8px 0 0"><div><b style="color:${st.open ? 'var(--bad)' : 'var(--ok)'}">${st.open}</b><span>cables not complete (of ${st.n})</span></div><div><b style="color:${st.pa ? 'var(--bad)' : 'var(--ok)'}">${st.pa}</b><span>open A-punch</span></div><div><b style="color:${st.ctq ? 'var(--bad)' : 'var(--ok)'}">${st.ctq}</b><span>CTQ / hold</span></div></div></div>
   <div class="chips"><button class="chip" onclick="VS.BZ=Math.min(2,VS.BZ+.25);bdSys('${s}')">＋ Zoom</button><button class="chip" onclick="VS.BZ=Math.max(.35,VS.BZ-.25);bdSys('${s}')">－ Zoom</button><button class="chip" onclick="go('#/bd')">All systems</button></div>
   <div style="overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;max-height:70vh"><svg width="${W * z}" height="${H * z}" viewBox="0 0 ${W} ${H}" font-family="Arial">${MK}${edges}${nodes}</svg></div>
   <div style="font-size:12px;color:var(--mut);margin:6px 2px">Boxes = panels / equipment (dashed = group of field devices). Lines = cables from → to. Red = not pulled/terminated, CTQ/hold or A-punch. Tap a line for its cables, a box for the panel.</div>
   ${st.openL.length ? `<div class="sect">Cables not complete (${st.openL.length})</div><div class="list">${st.openL.slice(0, 80).map(c => cRow(c)).join('')}</div>` : ''}
   ${st.paL.length ? `<div class="sect">Open A-punch (${st.paL.length})</div><div class="list">${st.paL.slice(0, 80).map(pRow).join('')}</div>` : ''}
   ${st.ctqL.length ? `<div class="sect">CTQ / hold (${st.ctqL.length})</div><div class="list">${st.ctqL.slice(0, 80).map(c => cRow(c)).join('')}</div>` : ''}`;
}
function bdEdge(s, k) { const e = SG[s].e[k]; const A = SG[s].n[e[0]], B = SG[s].n[e[1]];
  modalP(`<div class="h3">${esc(shortT(A[1]))} → ${esc(shortT(B[1]))}</div><div class="list">${e[2].map(i => cRow(C[i])).join('')}</div><button class="more" onclick="closeP()">Close</button>`); }
function bdGroup(s, i) { const n = SG[s].n[i]; modalP(`<div class="h3">${esc(n[1])}</div><div class="list">${n[6].map(t => `<button class="li" onclick="closeP();go('#/s/${enc(t)}')"><div class="m"><div class="t">${esc(t)}</div></div>${(PUBY[t] || []).some(p => p.st === 'Open' && p.cat === 'A') ? '<span class="badge b-no">A-punch</span>' : ''}<span class="chev">›</span></button>`).join('')}</div><button class="more" onclick="closeP()">Close</button>`); }
// ======== SF drawings (MTO) ========
const SF = (D.sf || []).map(a => ({doc: a[0], sys: a[1], file: a[2], rev: a[3], as: a[4], last: a[5], revs: a[6], chg: a[7], cur: a[8], it: a[9]}));
const MATBY = {}; D.mat.forEach(m => { (MATBY[m[1]] = MATBY[m[1]] || []).push(m); });
function sfHome() { setHead('SF drawings (MTO)', `${new Set(SF.map(x => x.doc)).size} SF documents · latest revision & dates`);
  const by = {}; SF.forEach(x => (by[x.sys] = by[x.sys] || []).push(x));
  main.innerHTML = `<div class="note" style="background:#eef3f8">Dates are taken from each SF drawing: last issue (status/rev/date) and the latest change notice (Изм.). ✓ = current file you have.</div>
   <div class="list" style="margin-top:8px">${Object.entries(by).sort().map(([s, xs]) => `<div class="gh">${esc(s)} · ${esc(sysName(s))}</div>` + xs.sort((a, b) => (b.cur - a.cur) || b.rev.localeCompare(a.rev)).map(x => { const lr = x.revs[x.revs.length - 1] || [], lc = x.chg[x.chg.length - 1];
     return `<button class="li" onclick="go('#/sf/${enc(x.file)}')"><div class="m"><div class="t">${x.cur ? '✓ ' : ''}${esc(x.doc)}</div><div class="s">Rev ${esc(x.rev)}${x.as ? ' · ' + esc(x.as) : ''} · ${lr.length ? esc(lr[0] + ' ' + lr[1] + ' ' + lr[2]) : ''}${lc ? ' · change ' + esc(lc[0]) + ' ' + esc(lc[2]) : ''}</div></div><div class="r"><b>${esc(x.last)}</b><div>${x.it.length} items</div>${x.cur ? '' : '<div><span class="badge b-na">older</span></div>'}</div><span class="chev">›</span></button>`; }).join('')).join('')}</div>`; }
function sfView(f) { const x = SF.find(y => y.file === f); if (!x) { main.innerHTML = '<div class="empty">Not found</div>'; return; }
  VS.SF = VS.SF || {q: ''}; setHead(x.doc, `Rev ${x.rev} ${x.as} · last date ${x.last}`);
  main.innerHTML = `<div class="card"><div class="big">${esc(x.doc)}</div>${kv([['System', x.sys + ' · ' + sysName(x.sys)], ['File', x.file], ['Revision', x.rev + (x.as ? ' / ' + x.as : '')], ['Last date', `<b>${esc(x.last)}</b>`, 1], ['Status', x.cur ? '✓ current file' : 'older revision']])}
    <div class="h3" style="margin-top:8px">Issue history</div><div style="font-size:13px">${x.revs.map(r => `${esc(r[0])} · rev ${esc(r[1])} · ${esc(r[2])}`).join('<br>') || '-'}</div>
    ${x.chg.length ? `<div class="h3" style="margin-top:8px">Change notices (Изм.)</div><div style="font-size:13px">${x.chg.map(r => `Изм. ${esc(r[0])} · № ${esc(r[1])} · ${esc(r[2])}`).join('<br>')}</div>` : ''}</div>
   <input class="fin" placeholder="Filter items: name, code…" value="${esc(VS.SF.q)}" oninput="VS.SF.q=this.value;sfList('${enc(f)}')"><div id="sfl"></div>`; sfList(enc(f)); }
function sfList(fe) { const x = SF.find(y => y.file === dec(fe)); const ql = VS.SF.q.trim().toLowerCase();
  const L = x.it.filter(r => !ql || (r.join(' ')).toLowerCase().includes(ql)); const by = {}; L.forEach(r => (by[r[1] || '-'] = by[r[1] || '-'] || []).push(r));
  document.getElementById('sfl').innerHTML = L.length ? `<div class="list">${Object.entries(by).map(([sct, rs]) => `<div class="gh">${esc(sct.slice(0, 90))} · ${rs.length}</div>` + rs.map(r => { const m = MATBY[r[3]];
    return `<div class="li"><div class="m"><div class="t" style="word-break:normal">${esc(r[0])} · ${esc(r[2].slice(0, 160))}</div><div class="s" style="white-space:normal">${r[3] ? 'Code ' + esc(r[3]) : ''}${m ? ` · tracker: ${m.reduce((a, y) => a + y[4], 0)}/${m.reduce((a, y) => a + y[3], 0)} cables pulled, ${fmtn(m.reduce((a, y) => a + y[6], 0))} m` : ''}${r[7] ? ' · ' + esc(r[7].slice(0, 200)) : ''}${r[6] ? ' · ' + esc(r[6]) : ''}</div></div><div class="r"><b style="font-size:15px">${fmtn(r[5])}</b><div>${esc(r[4])}</div></div></div>`; }).join('')).join('')}</div>` : '<div class="empty">Nothing found</div>'; }
// ======== Cable gland selection ========
function parseCores(s) { s = String(s || '').replace(/,/g, '.').replace(/х/g, 'x').replace(/\s/g, '');
  let m = s.match(/^(\d+)x(\d+)x(\d+(?:\.\d+)?)/); if (m) return {n: +m[1] * +m[2], pairs: +m[2] === 2 ? +m[1] : 0, el: +m[2], grp: +m[1], a: +m[3]};
  m = s.match(/^(\d+)x(\d+(?:\.\d+)?)/); if (m) return {n: +m[1], pairs: 0, el: 1, grp: +m[1], a: +m[2]}; return null; }
const BF = n => n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 2.16 : n === 4 ? 2.42 : n === 5 ? 2.7 : n <= 7 ? 3 : n <= 10 ? 4.0 : n <= 12 ? 4.16 : n <= 14 ? 4.41 : n <= 16 ? 4.7 : n <= 19 ? 5 : n <= 24 ? 5.6 : n <= 27 ? 6 : n <= 37 ? 7 : 8.2;
const isArm = ty => /Б|ARM|SWA|броня|armou?r/i.test(ty || '');
const isScr = ty => /Э|экр|FTP|STP|SCR|screen|-S\b|[\d]S[\d]|JB\d|J[A-Z]\d/i.test(ty || '');
function odEst(ty, cores) { ty = String(ty || ''); const T = ty.toUpperCase();
  if (/CAT\.?\s?6A|C6A|CAT6A/.test(T)) return {d: 7.5, how: 'LAN Cat6A typical'}; if (/CAT\.?\s?(5|6)|UTP|FTP/.test(T)) return {d: 6.5, how: 'LAN cable typical'};
  if (/FOAM|ВОЛС|OPTIC|ОПТ|FO\b|ОК[ЛБ]|ОКБ|9\/125/.test(T)) return {d: /ARM|Б/.test(T) ? 12 : 9, how: 'fibre cable typical'};
  if (/HDMI|RG|КОАКС|COAX/.test(T)) return {d: 7, how: 'coax / HDMI typical'};
  const p = parseCores(cores); if (!p) return null; const A = p.a;
  const ti = A <= 1 ? 0.5 : A <= 2.5 ? 0.7 : A <= 6 ? 0.8 : A <= 16 ? 0.9 : A <= 35 ? 1.1 : A <= 70 ? 1.3 : A <= 120 ? 1.5 : A <= 240 ? 1.8 : 2;
  const dc = 1.13 * Math.sqrt(A) * (A >= 10 ? 1.08 : 1) + 2 * ti;
  let dl = p.el > 1 ? dc * BF(p.el) * BF(p.grp) / 1.04 : dc * BF(p.n);
  const arm = isArm(ty), scr = isScr(ty);
  dl += (p.n > 1 ? 1.2 : 0) + (scr ? 0.6 : 0) + (arm ? 2.2 : 0); const sh = Math.max(1.4, 0.035 * dl + 1.0); const d = dl + 2 * sh + (arm ? 1.0 : 0);
  return {d: Math.round(d * 10) / 10, how: 'estimated from cores and size'}; }
// typical gland seal ranges (outer sheath), mm – always check manufacturer chart
const GL_MET = [['M16', 3.5, 8.5], ['M20s', 6, 12], ['M20', 10, 14.5], ['M25', 13, 20.5], ['M32', 19.5, 26.5], ['M40', 25.5, 33], ['M50s', 31.5, 39], ['M50', 37, 44.5], ['M63s', 42.5, 50.5], ['M63', 49, 56.5], ['M75s', 55, 62.5], ['M75', 61, 68.5], ['M80', 66, 80]];
const GL_PL = [['M12', 3, 6.5], ['M16', 4.5, 10], ['M20', 6, 13], ['M25', 9, 17], ['M32', 13, 21], ['M40', 19, 28], ['M50', 27, 35], ['M63', 34, 45]];
function pickGl(d, tbl) { if (!d) return []; return tbl.filter(g => d >= g[1] && d <= g[2]); }
function zoneOf(txt) { const t = String(txt || ''); if (/взрывозащ|Ex\b|Exd|Exe|explos/i.test(t)) return 'ex'; if ((/D1810BX0|-D18-|^G0-[A-Z]{4,5}-D18/.test(t) || PBY[node0(t)]) && !/кровл|roof|наруж|outdoor|D1801FX0/i.test(t)) return 'in'; return 'out'; }
const ZN = {in: ['Indoor CCR – safe area', 'В здании ЦО – невзрывоопасная зона'], out: ['Outdoor / other area – check zone drawing', 'Снаружи / др. площадка – проверить классификацию зон'], ex: ['Hazardous (Ex) equipment', 'Взрывозащищённое оборудование']};
function glandFor(ty, cores, endTxt, od) { const e = od ? {d: od, how: 'measured / entered'} : odEst(ty, cores); const arm = isArm(ty), scr = isScr(ty), z = zoneOf(endTxt);
  const lan = /CAT|UTP|FTP|HDMI|PATCH|RJ/i.test(ty || ''); const met = z !== 'in' || arm;
  const sizes = e ? pickGl(e.d, met ? GL_MET : GL_PL) : [];
  const typeEN = z === 'ex' ? (arm ? 'Ex d/e double-compression gland for armoured cable (brass, Ni-plated)' : 'Ex e gland for unarmoured cable (brass, Ni-plated)') : arm ? 'Double-compression gland for armoured cable, IP66/68 (brass)' : met ? 'Metal gland for unarmoured cable, IP66/68 (brass, Ni-plated)' : 'Polyamide gland for unarmoured cable, IP68';
  const typeRU = z === 'ex' ? (arm ? 'Кабельный ввод Ex d/e для бронированного кабеля, двойное уплотнение (латунь никель)' : 'Кабельный ввод Ex e для небронированного кабеля (латунь никель)') : arm ? 'Кабельный ввод для бронированного кабеля, двойное уплотнение, IP66/68 (латунь)' : met ? 'Металлический кабельный ввод для небронированного кабеля, IP66/68 (латунь никель)' : 'Пластиковый (полиамид) кабельный ввод для небронированного кабеля, IP68';
  const acc = []; if (arm) acc.push(['Earth tag for armour → PE bar', 'Кольцо заземления брони → шина PE']);
  if (z !== 'in' || arm) acc.push(['PVC shroud over gland', 'Защитный ПВХ колпачок на ввод']);
  if (z !== 'in') acc.push(['Lock nut + sealing washer; IP washer on threaded entry', 'Контргайка + уплотнительная шайба']);
  acc.push(['Heat-shrink sleeve at cable end / core ferrules (кембрики) + core markers', 'Термоусадочная трубка на разделке, кембрики и маркировка жил']);
  const earth = arm && scr ? ['Armour: earthed both ends via gland earth tag. Screen: earthed one end only (control room IE bar), insulated at field end.', 'Броня – заземлить с двух сторон через кольцо ввода. Экран – с одной стороны (шина ИЗ в операторной), в поле – изолировать.']
    : arm ? ['Armour earthed both ends via gland earth tag to PE.', 'Броня заземляется с двух сторон через кольцо заземления ввода на PE.'] : scr ? ['Screen earthed one end only (control room IE bar); field end insulated.', 'Экран заземляется с одной стороны (шина ИЗ в операторной), в поле изолировать.'] : ['PE core to earth terminal.', 'Жила PE на клемму заземления.'];
  return {e, arm, scr, z, lan, sizes, typeEN, typeRU, acc, earth}; }
function glCard(c) { const ends = [['From', c.f], ['To', c.o]];
  return `<div class="card"><div class="h3">Cable gland / кабельный ввод</div>${ends.map(([l, t]) => { const g = glandFor(c.ty, c.c, t);
    return `<div style="border-top:1px solid var(--line);padding-top:6px;margin-top:6px"><b>${l}:</b> <span style="font-size:12px">${esc(shortT(node0(t)))}</span>
      ${kv([['Zone', ZN[g.z][0] + '<br><span style="color:var(--mut)">' + ZN[g.z][1] + '</span>', 1], ['Cable OD', g.e ? `≈ ${g.e.d} mm (${(g.e.d / 25.4).toFixed(2)}") · ${g.e.how}` : 'enter OD in calculator'], ['Gland size', g.lan ? 'RJ/LAN: brush entry / cable entry, no compression gland' : (g.sizes.map(s => `${s[0]} (${s[1]}–${s[2]} mm)`).join(' or ') || '-')], ['Type EN', g.typeEN], ['Тип RU', g.typeRU], ['Sleeve / accessories', g.acc.map(a => a[0] + '<br><span style="color:var(--mut)">' + a[1] + '</span>').join('<br>'), 1], ['Earthing', g.earth[0] + '<br><span style="color:var(--mut)">' + g.earth[1] + '</span>', 1]])}</div>`; }).join('')}
    <div style="font-size:11px;color:var(--mut);margin-top:6px">Typical selection. Confirm against the design gland schedule / manufacturer chart and the hazardous area drawing.</div></div>`; }
function node0(t) { const m = (String(t || '').match(/G\d-[A-Z0-9]+(?:-[A-Z0-9()]+)+/g) || []).filter(x => !/^G\d-[A-Z]\d{4}[A-Z]{2}\d$/.test(x)); return m.length ? m[m.length - 1] : String(t || '').slice(-40); }
const CSYS = {}; Object.entries(SG).forEach(([s, g]) => g.e.forEach(e => e[2].forEach(i => CSYS[i] = s)));
function glHome() { VS.GL = VS.GL || {sy: '', q: '', lim: 80}; const v = VS.GL; const syss = [...new Set(Object.values(CSYS))].sort();
  setHead('Cable glands', 'system-wise · gland size, type RU/EN, sleeve, earthing');
  main.innerHTML = `<select onchange="VS.GL.sy=this.value;VS.GL.lim=80;glList()"><option value="">All systems</option>${syss.map(y => `<option value="${y}" ${v.sy === y ? 'selected' : ''}>${esc(y)} · ${esc(sysName(y))}</option>`).join('')}</select>
   <input class="fin" placeholder="Cable tag / type / panel…" value="${esc(v.q)}" oninput="VS.GL.q=this.value;glList()"><div class="chips"><button class="chip" onclick="exportGl()">⬇ Gland list CSV</button><button class="chip" onclick="go('#/calc')">🧮 Calculator</button></div><div id="gll"></div>`; glList(); }
function glRows() { const v = VS.GL, nq = N(v.q); return C.filter(c => (!v.sy || CSYS[c.i] === v.sy) && (!nq || c._n.includes(nq) || c._e.includes(nq) || N(c.ty).includes(nq))); }
function glList() { const v = VS.GL; const L = glRows();
  document.getElementById('gll').innerHTML = L.length ? `<div class="list">${L.slice(0, v.lim).map(c => { const a = glandFor(c.ty, c.c, c.f), b = glandFor(c.ty, c.c, c.o); const sz = g => g.lan ? 'RJ' : (g.sizes[0] ? g.sizes[0][0] : '?');
    return `<button class="li" onclick="go('#/c/${enc(c.t)}')"><div class="m"><div class="t">${esc(c.t)}</div><div class="s">${esc(c.ty)} ${esc(c.c)} · OD ≈ ${a.e ? a.e.d : '?'} mm${a.arm ? ' · armoured' : ''}${a.scr ? ' · screened' : ''}</div></div><div class="r"><b>${sz(a)} / ${sz(b)}</b><div>from / to</div></div><span class="chev">›</span></button>`; }).join('')}</div>` + (L.length > v.lim ? `<button class="more" onclick="VS.GL.lim+=150;glList()">Show more (${L.length - v.lim})</button>` : '') : '<div class="empty">Nothing found</div>'; }
function exportGl() { const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; const rows = [['System', 'Cable tag', 'Type', 'Cores', 'OD est. mm', 'Armoured', 'Screened', 'End', 'Equipment', 'Zone', 'Gland size', 'Gland type EN', 'Тип ввода RU', 'Sleeve / accessories', 'Earthing']];
  glRows().forEach(c => [['From', c.f], ['To', c.o]].forEach(([l, t]) => { const g = glandFor(c.ty, c.c, t); rows.push([CSYS[c.i] || '', c.t, c.ty, c.c, g.e ? g.e.d : '', g.arm ? 'yes' : '', g.scr ? 'yes' : '', l, node0(t), ZN[g.z][0], g.lan ? 'RJ / brush entry' : g.sizes.map(s => s[0]).join(' / '), g.typeEN, g.typeRU, g.acc.map(a => a[0]).join('; '), g.earth[0]]); }));
  dlFile(`Cable_gland_list_${VS.GL.sy || 'all'}.csv`, '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv'); }
// ======== Engineering calculator ========
const AWG = [[30, 0.05], [28, 0.08], [26, 0.13], [24, 0.2], [22, 0.33], [20, 0.52], [18, 0.82], [16, 1.31], [14, 2.08], [12, 3.31], [10, 5.26], [8, 8.37], [6, 13.3], [4, 21.2], [2, 33.6], [1, 42.4], ['1/0', 53.5], ['2/0', 67.4], ['3/0', 85], ['4/0', 107]];
const STD_A = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
function cv(id) { const e = document.getElementById(id); return e ? Number(String(e.value).replace(',', '.')) : 0; }
function cs(id) { const e = document.getElementById(id); return e ? e.value : ''; }
function calcHome() { setHead('Engineering calculator', 'electrical basics · cable OD · gland selection');
  const inp = (id, l, v, u) => `<label style="display:block;font-size:12px;color:var(--mut)">${l}<input class="fin" id="${id}" type="text" inputmode="decimal" value="${v}" oninput="calcRun()" style="margin:2px 0 6px">${u ? '' : ''}</label>`;
  const sel = (id, l, opts) => `<label style="display:block;font-size:12px;color:var(--mut)">${l}<select id="${id}" onchange="calcRun()" style="margin:2px 0 6px">${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>`;
  const g2 = h => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${h}</div>`; const res = id => `<div id="${id}" class="note" style="background:#e8f6ee;font-size:14px"></div>`;
  main.innerHTML = `<div class="card"><div class="h3">1 · Current ⇄ power</div>${g2(sel('k_ph', 'System', [['3', '3-phase'], ['1', '1-phase']]) + inp('k_u', 'Voltage U, V', 400) + inp('k_p', 'Power P, kW', 15) + inp('k_pf', 'cos φ', 0.85) + inp('k_ef', 'Efficiency η (motor), %', 100) + inp('k_i', 'or current I, A (→ power)', ''))}${res('r_k')}
     <div style="font-size:11px;color:var(--mut)">3φ: I = P / (√3 · U · cosφ · η) · 1φ: I = P / (U · cosφ · η) · S(kVA) = √3 · U · I</div></div>
   <div class="card"><div class="h3">2 · Ohm's law</div>${g2(inp('o_u', 'U, V', 24) + inp('o_r', 'R, Ω', '') + inp('o_i', 'I, A', 0.5))}${res('r_o')}<div style="font-size:11px;color:var(--mut)">Fill any two: U = I·R · P = U·I</div></div>
   <div class="card"><div class="h3">3 · Voltage drop & cable size</div>${g2(sel('v_ph', 'System', [['3', '3-phase'], ['1', '1-phase / DC']]) + sel('v_m', 'Conductor', [['cu', 'Copper'], ['al', 'Aluminium']]) + inp('v_u', 'Voltage, V', 400) + inp('v_i', 'Current, A', 30) + inp('v_l', 'Length (one way), m', 120) + inp('v_a', 'Cable size, mm²', 10) + inp('v_pf', 'cos φ', 0.85) + inp('v_lim', 'Allowed drop, %', 4))}${res('r_v')}
     <div style="font-size:11px;color:var(--mut)">ΔU = k · I · L · (R·cosφ + X·sinφ), k = √3 (3φ) or 2 (1φ). ρ Cu 0.0225, Al 0.036 Ω·mm²/m (warm), X ≈ 0.08 mΩ/m.</div></div>
   <div class="card"><div class="h3">4 · Cable OD & gland selection</div>${g2(inp('g_ty', 'Cable type (mark)', 'КВБбШвнг(А)-LS') + inp('g_c', 'Cores × size (e.g. 10x1,5 / 4x2x1,0)', '10x1,5') + inp('g_od', 'or measured OD, mm', '') + sel('g_z', 'Location / zone', [['in', 'Indoor CCR – safe area'], ['out', 'Outdoor / other area'], ['ex', 'Hazardous area (Ex equipment)']]))}${res('r_g')}
     <div style="font-size:11px;color:var(--mut)">OD is estimated – measure the real cable or check the cable datasheet before ordering glands.</div></div>
   <div class="card"><div class="h3">5 · Unit converter</div>${g2(inp('u_mm', 'mm', 25.4) + inp('u_in', 'inch', '') + inp('u_a', 'mm²', 2.5) + inp('u_kw', 'kW ⇄ HP', 7.5))}${res('r_u')}</div>
   <div class="card"><div class="h3">6 · Quick reference</div><div style="font-size:13px;line-height:1.6">
     • 3φ motor 400 V: ≈ 2 A per kW (cosφ 0.85, η 0.9)<br>• 1φ 230 V: ≈ 4.4–5 A per kW<br>• Transformer 10/0.4 kV: I(0.4 kV) ≈ 1.44 × kVA<br>• Insulation test: LV power/control cables at 500–1000 V DC, instrument cables at 500 V DC (disconnect electronics first)<br>• Armour earthed both ends; instrument screen earthed one end (control room)<br>• 1 inch = 25.4 mm · 1 HP = 0.746 kW · Cu ρ20 = 0.0175 Ω·mm²/m</div></div>`;
  calcRun(); }
function calcRun() { try {
  const ph = cs('k_ph'), U = cv('k_u'), P = cv('k_p'), pf = cv('k_pf') || 1, ef = (cv('k_ef') || 100) / 100, Ii = cv('k_i'); const kk = ph === '3' ? Math.sqrt(3) : 1;
  let t = ''; if (Ii > 0) { const Pk = kk * U * Ii * pf * ef / 1000; t = `P = <b>${Pk.toFixed(2)} kW</b> · S = ${(kk * U * Ii / 1000).toFixed(2)} kVA`; } else if (P > 0 && U > 0) { const I = P * 1000 / (kk * U * pf * ef); t = `I = <b>${I.toFixed(1)} A</b> · S = ${(P / pf / ef).toFixed(2)} kVA · Q = ${(P / ef * Math.tan(Math.acos(Math.min(pf, 1)))).toFixed(2)} kvar`; }
  document.getElementById('r_k').innerHTML = t || 'enter values';
  const ou = cv('o_u'), or = cv('o_r'), oi = cv('o_i'); let o = '';
  if (ou && oi && !or) o = `R = <b>${(ou / oi).toFixed(3)} Ω</b> · P = ${(ou * oi).toFixed(2)} W`; else if (ou && or && !oi) o = `I = <b>${(ou / or).toFixed(3)} A</b> · P = ${(ou * ou / or).toFixed(2)} W`; else if (oi && or && !ou) o = `U = <b>${(oi * or).toFixed(2)} V</b> · P = ${(oi * oi * or).toFixed(2)} W`; else o = 'leave one field empty';
  document.getElementById('r_o').innerHTML = o;
  const vp = cs('v_ph') === '3' ? Math.sqrt(3) : 2, rho = cs('v_m') === 'al' ? 0.036 : 0.0225, vu = cv('v_u'), vi = cv('v_i'), vl = cv('v_l'), va = cv('v_a'), vpf = cv('v_pf') || 1, lim = cv('v_lim') || 4; const sn = Math.sqrt(Math.max(0, 1 - vpf * vpf));
  const du = A => vp * vi * vl * ((rho / A) * vpf + 0.00008 * sn); let vt = '';
  if (vu && vi && vl && va) { const d = du(va); vt = `ΔU = <b>${d.toFixed(2)} V = ${(100 * d / vu).toFixed(2)} %</b> ${100 * d / vu > lim ? '⚠ above ' + lim + ' %' : '✓ within ' + lim + ' %'}`; const mn = STD_A.find(A => 100 * du(A) / vu <= lim); vt += `<br>Smallest size for ≤ ${lim} %: <b>${mn ? mn + ' mm²' : '> 300 mm²'}</b> (check current rating too)`; }
  document.getElementById('r_v').innerHTML = vt || 'enter values';
  const z = cs('g_z'); const g = glandFor(cs('g_ty'), cs('g_c'), z === 'ex' ? 'Ex' : z === 'in' ? 'G0-D1810BX0' : 'outdoor', cv('g_od') || 0);
  document.getElementById('r_g').innerHTML = g.e ? `OD ≈ <b>${g.e.d} mm</b> (${(g.e.d / 25.4).toFixed(2)} inch) · ${g.arm ? 'armoured' : 'unarmoured'}${g.scr ? ', screened' : ''}<br>Gland: <b>${g.sizes.map(s => `${s[0]} (${s[1]}–${s[2]} mm)`).join(' or ') || 'no size – check'}</b><br>${esc(g.typeEN)}<br><span style="color:#555">${esc(g.typeRU)}</span><br><span style="font-size:12px">${g.acc.map(a => '• ' + a[0]).join('<br>')}<br>• ${g.earth[0]}</span>` : 'enter cores (e.g. 4x2,5) or OD';
  const mm = cv('u_mm'), a = cv('u_a'), kw = cv('u_kw'); const inch = cv('u_in'); const aw = AWG.reduce((b, x) => Math.abs(x[1] - a) < Math.abs(b[1] - a) ? x : b, AWG[0]);
  document.getElementById('r_u').innerHTML = `${mm} mm = <b>${(mm / 25.4).toFixed(3)}"</b>${inch ? ` · ${inch}" = <b>${(inch * 25.4).toFixed(1)} mm</b>` : ''}<br>${a} mm² ≈ <b>AWG ${aw[0]}</b> (${aw[1]} mm²) · Ø conductor ${(2 * Math.sqrt(a / Math.PI)).toFixed(2)} mm<br>${kw} kW = <b>${(kw / 0.746).toFixed(2)} HP</b> · ${kw} HP = ${(kw * 0.746).toFixed(2)} kW`;
 } catch (err) {} }
// ======== Site notes ========
function notes() { S2.notes = S2.notes || []; return S2.notes; }
function ntHome() { VS.NT = VS.NT || {q: '', c: ''}; const v = VS.NT; const L = notes().filter(n => (!v.c || n.c === v.c) && (!v.q || (n.x + ' ' + n.tag).toLowerCase().includes(v.q.toLowerCase()))).sort((a, b) => b.t - a.t);
  setHead('Site notes', `${notes().length} notes on this phone`); const CATS = ['⚡ Electrical', '🎛️ Instrument', '📡 Telecom', '⚠️ Safety', '📦 Material', '📝 Other'];
  main.innerHTML = `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="ntEdit('')"><b>＋ New note</b></button>
   <div class="chips"><button class="chip ${!v.c ? 'on' : ''}" onclick="VS.NT.c='';ntHome()">All</button>${CATS.map(c => `<button class="chip ${v.c === c ? 'on' : ''}" onclick="VS.NT.c='${c}';ntHome()">${c}</button>`).join('')}</div>
   <input class="fin" placeholder="Search notes…" value="${esc(v.q)}" oninput="VS.NT.q=this.value;clearTimeout(window.ntT);window.ntT=setTimeout(ntHome,400)">
   <div class="chips"><button class="chip" onclick="ntShare()">↗ Share all</button><button class="chip" onclick="ntCSV()">⬇ CSV</button></div>
   <div class="list">${L.map(n => `<button class="li" onclick="ntEdit('${n.id}')"><div class="m"><div class="t" style="word-break:normal;white-space:pre-wrap">${esc(n.x.slice(0, 200))}</div><div class="s">${esc(n.c || '')} ${n.tag ? '· ' + esc(n.tag) : ''} · ${tstr(n.t)} · ${esc(n.by || '')}</div></div><span class="chev">›</span></button>`).join('') || '<div class="empty">No notes yet</div>'}</div>`; }
function ntEdit(id) { const n = notes().find(x => x.id === id) || {id: '', x: '', tag: '', c: '📝 Other'}; const CATS = ['⚡ Electrical', '🎛️ Instrument', '📡 Telecom', '⚠️ Safety', '📦 Material', '📝 Other'];
  modalP(`<div class="h3">${id ? 'Edit note' : 'New note'}</div><select id="nc">${CATS.map(c => `<option ${n.c === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
   <input class="fin" id="ntg" placeholder="Tag / location (optional)" value="${esc(n.tag)}"><textarea class="fin" id="ntx" style="height:160px" placeholder="Write the note…">${esc(n.x)}</textarea>
   <div style="display:grid;grid-template-columns:1fr 1fr${id ? ' 1fr' : ''};gap:8px"><button class="tile main" style="min-height:auto" onclick="ntSave('${id}')"><b>Save</b></button><button class="tile" style="min-height:auto" onclick="ntSave('${id}',1)"><b>Save + share</b></button>${id ? `<button class="tile" style="min-height:auto;background:var(--badbg)" onclick="S2.notes=notes().filter(x=>x.id!=='${id}');ssave();closeP();ntHome()"><b>Delete</b></button>` : ''}</div>`); }
function ntSave(id, sh) { const x = document.getElementById('ntx').value.trim(); if (!x) return toast('Write something');
  let n = notes().find(y => y.id === id); if (!n) { n = {id: 'n' + Date.now()}; notes().push(n); n.t = Date.now(); }
  Object.assign(n, {x, tag: document.getElementById('ntg').value.trim(), c: document.getElementById('nc').value, by: PS_.name || '', e: Date.now()}); ssave(); closeP(); ntHome();
  if (sh) { const t = `Site note · ${PS_.name || ''} · ${tstr(n.t)}\n${n.c}${n.tag ? ' · ' + n.tag : ''}\n${n.x}`; if (navigator.share) navigator.share({text: t}).catch(() => {}); else copyText(t).then(() => toast('Copied')); } }
function ntShare() { const t = notes().sort((a, b) => a.t - b.t).map(n => `${tstr(n.t)} · ${n.c}${n.tag ? ' · ' + n.tag : ''}\n${n.x}`).join('\n\n'); if (!t) return toast('No notes'); if (navigator.share) navigator.share({text: 'Site notes – ' + (PS_.name || '') + '\n\n' + t}).catch(() => {}); else copyText(t).then(() => toast('Copied')); }
function ntCSV() { const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; dlFile(`Site_notes_${dkey(Date.now())}.csv`, '﻿' + [['Date', 'Category', 'Tag', 'Note', 'By']].concat(notes().map(n => [tstr(n.t), n.c, n.tag, n.x, n.by])).map(r => r.map(q).join(';')).join('\r\n'), 'text/csv'); }

// ======== Rooms ========
const ROOMN = {}; PU.forEach(p => { const m = /^Пом\.\s?(\d+)\s+(.+)/.exec(p.tagd || ''); if (m && !ROOMN[m[1]]) ROOMN[m[1]] = [(p.tage || '').replace(/^Room \d+\s*/, ''), m[2]]; });
const roomLbl = r => r ? `Room ${r}${ROOMN[r] && ROOMN[r][0] ? ' · ' + ROOMN[r][0] : ''}` : 'No room';
function roomStat(r) { const ps = PAN.filter(p => (p.room || '') === r); let n = 0, d = 0; ps.forEach(p => { const s = pstat(p); n += s.n; d += s.d; });
  const pa = ps.reduce((a, p) => a + (PUBY[p.tag] || []).filter(x => x.st === 'Open' && x.cat === 'A').length, 0); return {ps, n, d, pc: n ? Math.round(100 * d / n) : 0, pa}; }
function roomHome() { VS.RM = VS.RM || {q: ''}; const v = VS.RM; const rooms = [...new Set(PAN.map(p => p.room || ''))].sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
  setHead('Rooms', `${rooms.filter(Boolean).length} rooms · panels & cables per room`);
  const ql = v.q.trim().toLowerCase(); const L = rooms.filter(r => !ql || roomLbl(r).toLowerCase().includes(ql) || (ROOMN[r] && ROOMN[r][1].toLowerCase().includes(ql)) || PAN.some(p => (p.room || '') === r && p.tag.toLowerCase().includes(ql)));
  main.innerHTML = `<input class="fin" placeholder="Room number, name or panel…" value="${esc(v.q)}" oninput="VS.RM.q=this.value;clearTimeout(window.rmT);window.rmT=setTimeout(roomHome,350)">
   <div class="list">${L.map(r => { const s = roomStat(r); return `<button class="li" onclick="go('#/rm/${enc(r || '-')}')"><div class="m"><div class="t">🚪 ${esc(roomLbl(r))}</div><div class="s">${ROOMN[r] && ROOMN[r][1] ? esc(ROOMN[r][1]) + ' · ' : ''}${s.ps.length} panels · ${s.d}/${s.n} cables${s.pa ? ' · ⚠ ' + s.pa + ' A-punch' : ''}</div><div class="pbar" style="max-width:220px"><i style="width:${s.pc}%"></i></div></div><div class="r pc" style="color:${s.pc === 100 ? 'var(--ok)' : 'var(--warn)'}">${s.pc}%</div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">Nothing found</div>'}</div>`; }
function roomView(r) { if (r === '-') r = ''; const s = roomStat(r); setHead(roomLbl(r), `${s.ps.length} panels · ${s.pc}% cables complete`);
  main.innerHTML = `<div class="card"><div class="big">🚪 ${esc(roomLbl(r))}</div>${ROOMN[r] && ROOMN[r][1] ? `<div style="font-size:13px;color:var(--mut)">${esc(ROOMN[r][1])}</div>` : ''}
    <div class="kpi" style="margin:8px 0 0"><div><b>${s.ps.length}</b><span>panels / boxes</span></div><div><b style="color:var(--ok)">${s.d}/${s.n}</b><span>cables complete</span></div><div><b style="color:${s.pa ? 'var(--bad)' : 'var(--ok)'}">${s.pa}</b><span>open A-punch</span></div></div><div class="pbar"><i style="width:${s.pc}%"></i></div></div>
   <div class="sect">Panels in this room</div><div class="list">${s.ps.sort((a, b) => a.tag.localeCompare(b.tag)).map(p => { const t = pstat(p); const pa = (PUBY[p.tag] || []).filter(x => x.st === 'Open').length;
     return `<button class="li" onclick="go('#/p/${enc(p.tag)}')"><div class="m"><div class="t">${esc(shortT(p.tag))}</div><div class="s">${esc(p.desc)}</div><div class="s">${t.d}/${t.n} cables${pa ? ' · ' + pa + ' open punch' : ''}</div></div><div class="r pc" style="color:${t.pc === 100 ? 'var(--ok)' : 'var(--warn)'}">${t.pc}%</div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No panels</div>'}</div>`; }

// ======== v3.4: terminals, revisions, TQ, manpower, issues, permits, alerts ========
const LR = D.lr || {};
S2.t = S2.t || {}; S2.is = S2.is || []; S2.pr = S2.pr || []; S2.al = S2.al || []; S2.ald = S2.ald || {};
function lrRows(tag) { return (LR[tag] || []).map((r, i) => ({i, doc: r[0], pg: r[1], core: r[2], pan: r[3], src: r[4], tb: r[5], tn: r[6]})); }
function lrEnd(c, r) { const a = node0(c.f), b = node0(c.o); const P = N(r.pan); if (P && N(b).includes(P.slice(-10))) return 'T'; if (P && N(a).includes(P.slice(-10))) return 'F'; return 'X'; }
const onEnd = (c, r, end) => { const e = lrEnd(c, r); return e === end || e === 'X'; };
function tSt(tag, i) { return ((S2.t[tag] || {})[i]) || null; }
function tSet(tag, i, v) { if (!who(`tSet(decodeURIComponent('${enc(tag)}'),${i},'${v}')`)) return; const m = S2.t[tag] = S2.t[tag] || {}; const r = v === 'N' ? (prompt('What is wrong? (terminal / core / marking)') || '') : '';
  m[i] = {v, t: Date.now(), by: PS_.name, r}; ssave(); if (document.getElementById('tmod')) tCheck(tag, window.tEnd); else route(); }
function tRowsHtml(c, end) { const R = lrRows(c.t).filter(r => !end || onEnd(c, r, end));
  return R.map(r => { const s = tSt(c.t, r.i); return `<div class="li" style="align-items:flex-start"><div class="m"><div class="t">${esc(r.tb || '-')} : ${esc(r.tn || '-')}</div><div class="s" style="white-space:normal">cores ${esc(r.core || '-')} · ${esc(shortT(r.pan) || '')} · ${esc(r.doc.replace(/^GLE-G0-D1810BX0-/, '').replace(/_AL.*$/, ''))} p.${r.pg}</div>${s && s.v === 'N' && s.r ? `<div class="s" style="color:var(--bad)">✗ ${esc(s.r)}</div>` : ''}</div>
     <div style="display:flex;gap:4px;flex:none"><button class="tg ${s && s.v === 'Y' ? 'y' : ''}" style="padding:8px 10px" onclick="tSet(decodeURIComponent('${enc(c.t)}'),${r.i},'Y')">✓</button><button class="tg ${s && s.v === 'N' ? 'n' : ''}" style="padding:8px 10px" onclick="tSet(decodeURIComponent('${enc(c.t)}'),${r.i},'N')">✗</button></div></div>`; }).join(''); }
function tCard(c) { const R = lrRows(c.t); if (!R.length) return ''; const ok = R.filter(r => (tSt(c.t, r.i) || {}).v === 'Y').length, bad = R.filter(r => (tSt(c.t, r.i) || {}).v === 'N').length;
  return `<div class="card"><div class="h3">Termination points / точки подключения (${ok}/${R.length} confirmed${bad ? ' · ' + bad + ' wrong' : ''})</div><div style="font-size:12px;color:var(--mut);margin-bottom:6px">Check each core is on the correct terminal, then tap ✓ (correct) or ✗ (wrong).</div><div class="list">${tRowsHtml(c)}</div>
   <button class="more" onclick="lrAll(decodeURIComponent('${enc(c.t)}'))">✓ All terminals correct</button></div>`; }
function lrAll(tag) { if (!who(`lrAll(decodeURIComponent('${enc(tag)}'))`)) return; const m = S2.t[tag] = S2.t[tag] || {}; lrRows(tag).forEach(r => { if (!m[r.i]) m[r.i] = {v: 'Y', t: Date.now(), by: PS_.name, r: ''}; }); ssave(); route(); }
function tCheck(tag, end) { window.tEnd = end; const c = CBY[tag]; const R = lrRows(tag).filter(r => onEnd(c, r, end)); const done = R.every(r => tSt(tag, r.i)); const bad = R.some(r => (tSt(tag, r.i) || {}).v === 'N');
  modalP(`<div id="tmod"><div class="h3">Confirm terminal points before marking terminated</div><div style="font-size:13px;margin-bottom:6px">${esc(tag)} · ${end === 'F' ? 'from' : 'to'} end</div><div class="list">${tRowsHtml(c, end)}</div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="tile" style="min-height:auto" onclick="closeP()"><b>Cancel</b></button><button class="tile main" style="min-height:auto;${done && !bad ? '' : 'opacity:.5'}" onclick="if(${done && !bad}){closeP();cTick2(decodeURIComponent('${enc(tag)}'),'${end}')}else toast('${bad ? 'Wrong terminal – fix it first (or report issue)' : 'Confirm every terminal first'}')"><b>Mark terminated</b></button></div></div>`); }
function cTick2(tag, k) { const c = CBY[tag]; const e = S2.c[tag] = S2.c[tag] || {}; const b = cBase(c); const cur = e[k] ? e[k].v : b[k]; e[k] = {v: !cur, t: Date.now(), by: PS_.name}; ssave(); route(); }
// wrap original termination tick: require terminal confirmation when LR data exists
const _cTick = cTick;
cTick = function (tag, k) { if (k !== 'P' && lrRows(tag).some(r => onEnd(CBY[tag], r, k))) { const c = CBY[tag]; const e = S2.c[tag] || {}; const cur = e[k] ? e[k].v : cBase(c)[k]; if (!cur) { if (!who(`cTick(decodeURIComponent('${enc(tag)}'),'${k}')`)) return; return tCheck(tag, k); } } return _cTick(tag, k); };
// ---- revisions
const RV = D.rv || [];
function rvDone(ch) { const c = CBY[ch[1]]; if (c) { const s = cst(c); return s.ok ? 'pulled + terminated' : s.p ? 'pulled' : ''; } const m = MATBY[ch[1]]; if (m && m.some(x => x[4] > 0)) return 'material installed'; const it = IBY[ch[1]]; if (it && it.some(x => x.done)) return 'installed'; return ''; }
const RVK = {term: '🔌 Terminal points changed', type: '🧵 Cable type / cores changed', route: '↔️ From / to changed', len: '📏 Length changed', add: '➕ New in revision', del: '➖ Removed in revision', qty: '🔢 Quantity changed', code: '🏷️ Item / code changed', rev: '📄 Drawing revision changed'};
function rvHome() { setHead('Drawing revisions', 'what changed · rev came after installation?');
  const flagged = RV.reduce((a, r) => a + r.ch.filter(rvDone).length, 0);
  main.innerHTML = `<div class="kpi"><div><b>${RV.length}</b><span>revised drawings</span></div><div><b>${RV.reduce((a, r) => a + r.ch.length, 0)}</b><span>changes</span></div><div><b style="color:${flagged ? 'var(--bad)' : 'var(--ok)'}">${flagged}</b><span>rev after installation</span></div></div>
   <div class="note" style="background:#eef3f8">When a new drawing revision is loaded, changes are compared with the old revision. ⚠ = the work was already done before the revision came – check and rework if needed.</div>
   <div class="list" style="margin-top:8px">${RV.map((r, i) => { const f = r.ch.filter(rvDone).length; return `<button class="li" onclick="go('#/rv/${i}')"><div class="m"><div class="t">${f ? '⚠ ' : ''}${esc(r.doc)}</div><div class="s">rev ${esc(r.from)} → <b>${esc(r.to)}</b>${r.date ? ' · ' + esc(r.date) : ''} · ${r.ch.length} changes</div></div><div class="r">${f ? `<span class="badge b-no">${f} after install</span>` : '<span class="badge b-ok">no rework</span>'}</div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">No revisions yet</div>'}</div>`; }
function rvView(i) { const r = RV[i]; setHead(r.doc, `rev ${r.from} → ${r.to}`); VS.RVF = VS.RVF || 'all';
  const L = r.ch.filter(ch => VS.RVF === 'all' || (VS.RVF === 'done' ? rvDone(ch) : ch[0] === VS.RVF)); const kinds = [...new Set(r.ch.map(c => c[0]))];
  main.innerHTML = `<div class="card"><div class="big">${esc(r.doc)}</div>${kv([['Revision', `${esc(r.from)} → <b>${esc(r.to)}</b>`, 1], ['Date', r.date], ['Files', (r.files || []).join(' → ')]])}</div>
   <div class="chips"><button class="chip ${VS.RVF === 'all' ? 'on' : ''}" onclick="VS.RVF='all';rvView(${i})">All ${r.ch.length}</button><button class="chip ${VS.RVF === 'done' ? 'on' : ''}" onclick="VS.RVF='done';rvView(${i})">⚠ After installation ${r.ch.filter(rvDone).length}</button>${kinds.map(k => `<button class="chip ${VS.RVF === k ? 'on' : ''}" onclick="VS.RVF='${k}';rvView(${i})">${RVK[k] ? RVK[k].split(' ')[0] : ''} ${r.ch.filter(c => c[0] === k).length}</button>`).join('')}</div>
   <div class="list">${L.slice(0, 400).map(ch => { const dn = rvDone(ch); return `<button class="li" style="${dn ? 'background:#fff6f5' : ''}" onclick="${CBY[ch[1]] ? `go('#/c/${enc(ch[1])}')` : `go('#/s/${enc(ch[1])}')`}"><div class="m"><div class="t">${esc(ch[1])}</div><div class="s" style="white-space:normal">${RVK[ch[0]] || ch[0]}</div><div class="s" style="white-space:normal">old: ${esc(String(ch[2]).slice(0, 120))}<br>new: <b>${esc(String(ch[3]).slice(0, 120))}</b></div>${dn ? `<div class="s" style="color:var(--bad)">⚠ Revision came after installation (${dn}) – check / rework</div>` : ''}</div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">Nothing</div>'}</div>`; }
// ---- TQ (owner)
const TQ = D.tq || {ctq: [], ptq: []};
const CTQ = TQ.ctq.map(x => ({no: x[0], pri: x[1], sub: x[2], dwg: x[3], rev: x[4], sh: x[5], tags: x[6], act: x[7], cat: x[8], resp: x[9], aff: x[10], hold: x[11], rel: x[12], rels: x[13], st: x[14], dt: x[15], rem: x[16]}));
const PTQ = TQ.ptq.map(x => ({no: x[0], rev: x[1], dt: x[2], dis: x[3], dwg: x[4], area: x[5], cls: x[6], imp: x[7], desc: x[8], ep: x[9], epd: x[10], epr: x[11], ow: x[12], dep: x[13], dow: x[14], revd: x[15], com: x[16], st: x[17]}));
const tqCables = no => C.filter(c => (c.q && c.q.includes(no)) || (c.tqs && c.tqs.includes(no)));
function tqAlerts() { const A = [];
  CTQ.filter(t => t.st === 'Open').forEach(t => { const cs = tqCables(t.no); const done = cs.filter(c => cst(c).p); const open = cs.filter(c => !cst(c).ok);
    if (open.length) A.push({k: 'tq', id: 'tqb' + t.no, t: Date.now(), title: `${t.no} open – ${open.length} cables blocked`, txt: t.sub.slice(0, 140), go: '#/tq/c:' + t.no});
    if (done.length) A.push({k: 'tq', id: 'tqd' + t.no, t: Date.now(), title: `${t.no} open – ${done.length} cables already pulled before answer`, txt: 'Check rework risk', go: '#/tq/c:' + t.no}); });
  PTQ.filter(t => t.st !== 'Closed').forEach(t => { const cs = tqCables(t.no); A.push({k: 'tq', id: 'tqp' + t.no, t: Date.now(), title: `${t.no} not closed (${t.ep || 'no EP reply'}${t.dep ? ', ' + t.dep + ' days' : ''})`, txt: `${t.desc.slice(0, 120)}${cs.length ? ' · ' + cs.length + ' cables' : ''}`, go: '#/tq/p:' + t.no}); });
  return A; }
function tqHome() { if (!S2.owner) return ownerLogin(); VS.TQ = VS.TQ || {t: 'c', f: 'open', q: ''}; const v = VS.TQ; setHead('TQs (owner)', `${CTQ.filter(t => t.st === 'Open').length} CTQ open · ${PTQ.filter(t => t.st !== 'Closed').length} project TQ not closed`);
  const L = (v.t === 'c' ? CTQ : PTQ).filter(t => (v.f === 'all' || (v.t === 'c' ? t.st === 'Open' : t.st !== 'Closed')) && (!v.q || JSON.stringify(t).toLowerCase().includes(v.q.toLowerCase())));
  main.innerHTML = `<div class="chips"><button class="chip ${v.t === 'c' ? 'on' : ''}" onclick="VS.TQ.t='c';tqHome()">Internal CTQ (${CTQ.length})</button><button class="chip ${v.t === 'p' ? 'on' : ''}" onclick="VS.TQ.t='p';tqHome()">Project TQ (${PTQ.length})</button><button class="chip ${v.f === 'open' ? 'on' : ''}" onclick="VS.TQ.f='open';tqHome()">Open</button><button class="chip ${v.f === 'all' ? 'on' : ''}" onclick="VS.TQ.f='all';tqHome()">All</button></div>
   <input class="fin" placeholder="TQ No, drawing, tag, text…" value="${esc(v.q)}" onchange="VS.TQ.q=this.value;tqHome()">
   <div class="list">${L.slice(0, 300).map(t => { const n = tqCables(t.no).length; return v.t === 'c' ? `<button class="li" onclick="go('#/tq/c:${enc(t.no)}')"><div class="m"><div class="t">${esc(t.no)} · ${esc(t.pri)}</div><div class="s" style="white-space:normal">${esc(t.sub.split('  ')[0].slice(0, 140))}</div><div class="s">${esc(t.dwg)} · ${esc(t.dt)}${n ? ' · ' + n + ' cables' : ''}${t.hold && t.hold !== 'No' ? ' · HOLD' : ''}</div></div><span class="badge ${t.st === 'Open' ? 'b-no' : 'b-ok'}">${esc(t.st)}</span></button>`
     : `<button class="li" onclick="go('#/tq/p:${enc(t.no)}')"><div class="m"><div class="t">${esc(t.no)} R${esc(t.rev)}</div><div class="s" style="white-space:normal">${esc(t.desc.slice(0, 140))}</div><div class="s">${esc(t.dis)} · ${esc(t.dwg)} · ${esc(t.dt)}${n ? ' · ' + n + ' cables' : ''}</div></div><div class="r"><span class="badge ${t.st === 'Closed' ? 'b-ok' : 'b-no'}">${esc(t.st)}</span><div>${esc(t.ep)}</div><div>${esc(t.ow)}</div></div></button>`; }).join('') || '<div class="empty">Nothing</div>'}</div>`; }
function tqView(k) { if (!S2.owner) return ownerLogin(); const [t, no] = [k[0], k.slice(2)]; const x = (t === 'c' ? CTQ : PTQ).find(y => y.no === no); if (!x) return; setHead(no, t === 'c' ? 'internal CTQ' : 'project TQ'); const cs = tqCables(no);
  main.innerHTML = `<div class="card"><div class="big">${esc(no)}</div>${t === 'c' ? kv([['Status', x.st], ['Priority', x.pri], ['Subject', x.sub], ['Drawing', x.dwg], ['Revision', x.rev], ['Sheet', x.sh], ['Tags / cables', x.tags], ['Requested action', x.act], ['Category', x.cat], ['Responsible', x.resp], ['Affected works', x.aff], ['Hold point', x.hold], ['Related TQ', x.rel + (x.rels ? ' (' + x.rels + ')' : '')], ['Date sent', x.dt], ['Remarks', x.rem]])
     : kv([['Status', x.st], ['Rev', x.rev], ['Issued', x.dt], ['Discipline', x.dis], ['Drawing', x.dwg], ['Area', x.area], ['Classification', x.cls], ['Impact', x.imp], ['Description', x.desc], ['EP status', x.ep + (x.epd ? ' · ' + x.epd : '')], ['EP remarks', x.epr], ['Owner status', x.ow], ['Days with EP', x.dep], ['Days with owner', x.dow], ['Revised drawings', x.revd], ['Comments', x.com]])}</div>
   ${cs.length ? `<div class="sect">Related cables (${cs.length})</div><div class="list">${cs.slice(0, 200).map(c => cRow(c)).join('')}</div>` : ''}`; }
// ---- Manpower suggestion (owner)
S2.mp = S2.mp || {n: 50, rp: 80, rt: 10, ri: 3, ra: 4}; S2.mp.mc = S2.mp.mc || 4;
function mpFronts() { const F = {};
  I.forEach(x => { if (x.done) return; const rem = Math.max(x.q - x.f, 0); if (!rem) return; const act = /pull/i.test(x.g) ? 'Cable pulling' : /termination/i.test(x.g) ? 'Cable termination' : 'Installation'; const k = x.sy + '|' + act;
    const f = F[k] = F[k] || {sys: x.sy, act, rem: 0, u: act === 'Cable pulling' ? 'm' : act === 'Cable termination' ? 'ends' : 'items', lines: 0}; f.rem += act === 'Installation' ? 1 : rem; f.lines++; });
  const R = S2.mp; const cut = dkey(Date.now() - 7 * 864e5); const recent = {}; (S2.rx || []).filter(r => r.k === 'prog' && r.d >= cut).forEach(r => { const x = I.find(y => y.acc === r.acc); if (x) recent[x.sy] = (recent[x.sy] || 0) + 1; });
  Object.values(F).forEach(f => { const rate = f.act === 'Cable pulling' ? R.rp : f.act === 'Cable termination' ? R.rt : R.ri; f.md = f.rem / rate; const st = sysStat(f.sys); f.pa = st ? st.pa : 0; f.stalled = (S2.rx || []).length > 0 && !recent[f.sys]; f.w = f.md * (1 + (f.pa ? 0.3 : 0) + (f.stalled ? 0.3 : 0)); });
  const ALL = Object.values(F).filter(f => f.md >= 0.5).sort((a, b) => b.w - a.w); const K = Math.max(1, Math.floor(R.n / R.mc)); const L = ALL.slice(0, K); const tw = L.reduce((a, f) => a + f.w, 0);
  L.forEach(f => { f.p = Math.max(R.mc, Math.floor(R.n * f.w / tw)); }); let s = L.reduce((a, f) => a + f.p, 0);
  while (s > R.n) { const f = L.filter(x => x.p > R.mc).sort((a, b) => a.w / a.p - b.w / b.p)[0]; if (!f) break; f.p--; s--; }
  while (s < R.n) { const f = L.slice().sort((a, b) => b.w / b.p - a.w / a.p)[0]; f.p++; s++; }
  window.MPW = ALL.slice(K);
  L.forEach(f => f.days = f.p ? Math.ceil(f.md / f.p) : 0); return L.filter(f => f.p > 0); }
function mpHome() { if (!S2.owner) return ownerLogin(); const R = S2.mp; const L = mpFronts(); setHead('Manpower suggestion', `${R.n} people · ${L.length} work fronts`);
  const inp = (k, l) => `<label style="font-size:12px;color:var(--mut)">${l}<input class="fin" type="number" value="${R[k]}" onchange="S2.mp.${k}=Number(this.value)||S2.mp.${k};ssave();mpHome()" style="margin:2px 0 6px"></label>`;
  main.innerHTML = `<div class="card"><div class="h3">Settings</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${inp('n', 'People available')}${inp('rp', 'Pulling m / person / day')}${inp('rt', 'Terminations ends / person / day')}${inp('ri', 'Installation items / person / day')}${inp('mc', 'Minimum crew size')}</div>
    <div style="font-size:11px;color:var(--mut)">Split by remaining man-days; fronts with open A-punch or no progress in the last 7 days get extra weight. Adjust rates to your crews.</div></div>
   <div class="sect">Suggested crews (top fronts)</div><div class="list">${L.slice(0, 40).map(f => `<div class="li"><div class="m"><div class="t">${esc(f.sys)} · ${esc(f.act)}</div><div class="s">${fmtn(Math.round(f.rem))} ${f.u} left · ${Math.round(f.md)} man-days${f.stalled ? ' · <b style="color:var(--bad)">no progress 7 days</b>' : ''}${f.pa ? ' · ' + f.pa + ' A-punch' : ''}</div></div><div class="r"><b style="font-size:18px;color:var(--pri)">${f.p}</b> people<div>≈ ${f.days} days</div></div></div>`).join('')}</div>
   ${(window.MPW || []).length ? `<div class="sect">Waiting fronts (no crew now · ${MPW.length})</div><div class="list">${MPW.slice(0, 40).map(f => `<div class="li"><div class="m"><div class="t">${esc(f.sys)} · ${esc(f.act)}</div><div class="s">${fmtn(Math.round(f.rem))} ${f.u} left · ${Math.round(f.md)} man-days</div></div></div>`).join('')}</div>` : ''}
   <div class="foot">Total suggested: ${L.reduce((a, f) => a + f.p, 0)} people in ${L.length} crews (min ${R.mc} per crew). Biggest / most delayed fronts first.</div>`; }
// ---- Issues found (site → engineer)
const ISC = ['🔌 Termination', '🧵 Cable / route', '📐 Drawing mismatch', '📦 Material shortage', '🔨 Damage', '🪜 Access / scaffold', '⚠️ Safety', '📝 Other'];
function itemPick(id) { const q = N(document.getElementById(id + 'q').value); const el = document.getElementById(id + 'l'); if (q.length < 2) { el.innerHTML = ''; return; }
  const res = [].concat(PAN.filter(p => p._n.includes(q)).slice(0, 8).map(p => ['Panel', p.tag]), C.filter(c => c._n.includes(q)).slice(0, 10).map(c => ['Cable', c.t]), [...new Set(I.filter(x => x._n.includes(q)).map(x => x.tag))].slice(0, 8).map(t => ['Device', t]));
  el.innerHTML = res.map(([k, t]) => `<button class="li" onclick="document.getElementById('${id}').value='${k}: ${esc(t)}';document.getElementById('${id}l').innerHTML=''"><div class="m"><div class="t">${esc(t)}</div><div class="s">${k}</div></div></button>`).join(''); }
const syss = () => [...new Set([...Object.keys(SG), ...T.sys])].filter(Boolean).sort();
function isHome() { setHead('Issues found', 'report site issues to the engineer'); const L = S2.is.slice().sort((a, b) => b.t - a.t);
  main.innerHTML = `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="isNew()"><b>＋ Report new issue</b><span class="n">system · cable · panel · device → comment</span></button>
   <button class="tile" style="width:100%;min-height:auto;margin-bottom:8px" onclick="sendMine('is')"><b>📤 Send issues to Paul (${L.filter(x => !x.s).length} new)</b><span class="n">opens Paul's MAX chat – only to engineer</span></button>
   <div class="list">${L.map(x => `<div class="li"><div class="m"><div class="t">${esc(x.c)} · ${esc(x.sys)}</div><div class="s" style="white-space:normal">${esc(x.item || '')}</div><div class="s" style="white-space:normal">${esc(x.x)}</div><div class="s">${tstr(x.t)} · ${esc(x.by)}</div></div><span class="badge ${x.s ? 'b-ok' : 'b-part'}">${x.s ? 'sent' : 'not sent'}</span></div>`).join('') || '<div class="empty">No issues reported</div>'}</div>`; }
function isNew() { if (!who('isNew()')) return;
  modalP(`<div class="h3">Report issue</div><select id="isy"><option value="">System…</option>${syss().map(s => `<option>${esc(s)}</option>`).join('')}</select>
   <input class="fin" id="iitq" placeholder="Search cable / panel / device (optional)" oninput="itemPick('iit')"><input type="hidden" id="iit"><div id="iitl" class="list"></div>
   <select id="ic">${ISC.map(c => `<option>${c}</option>`).join('')}</select><select id="ip"><option>Normal</option><option>Urgent</option></select>
   <textarea class="fin" id="ix" style="height:120px" placeholder="Describe the issue for the engineer…"></textarea>
   <button class="tile main" style="width:100%;min-height:auto" onclick="isSave()"><b>Save & send to Paul</b></button>`); }
function isSave() { const x = document.getElementById('ix').value.trim(); const sys = document.getElementById('isy').value; if (!x || !sys) return toast('Choose system and write the issue');
  const it = document.getElementById('iit').value || document.getElementById('iitq').value.trim();
  S2.is.push({id: 'I' + Date.now().toString(36), t: Date.now(), by: PS_.name, sys, item: it, c: document.getElementById('ic').value, p: document.getElementById('ip').value, x}); ssave(); closeP(); sendMine('is'); }
// ---- Permits
const PMT = ['🔥 Hot work', '⚡ Electrical isolation / LOTO', '🔋 Energisation / live test', '🪜 Work at height', '🕳️ Confined space', '🏗️ Lifting', '🔧 General work permit'];
function pmHome() { setHead('Work permits', 'request permit from the engineer'); const L = S2.pr.slice().sort((a, b) => b.t - a.t);
  main.innerHTML = `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="pmNew()"><b>＋ Request permit</b><span class="n">system · subsystem · type · date · workers</span></button>
   <button class="tile" style="width:100%;min-height:auto;margin-bottom:8px" onclick="sendMine('pr')"><b>📤 Send permit requests to Paul (${L.filter(x => !x.s).length} new)</b><span class="n">only to engineer</span></button>
   <div class="list">${L.map(x => `<div class="li"><div class="m"><div class="t">${esc(x.ty)} · ${esc(x.sys)}</div><div class="s">${esc(x.sub || '')} · ${esc(x.loc || '')} · ${esc(x.d)} ${esc(x.h)} · ${x.w} workers</div><div class="s" style="white-space:normal">${esc(x.x)}</div></div><span class="badge ${x.s ? 'b-ok' : 'b-part'}">${x.s ? 'sent' : 'not sent'}</span></div>`).join('') || '<div class="empty">No permit requests</div>'}</div>`; }
function pmNew() { if (!who('pmNew()')) return; const tm = new Date(Date.now() + 864e5); const dv = tm.toISOString().slice(0, 10);
  modalP(`<div class="h3">Permit request</div><select id="pty">${PMT.map(c => `<option>${c}</option>`).join('')}</select>
   <select id="psy" onchange="document.getElementById('psb').innerHTML='<option value=&quot;&quot;>Subsystem…</option>'+pSubs(this.value)"><option value="">System…</option>${syss().map(s => `<option>${esc(s)}</option>`).join('')}</select>
   <select id="psb"><option value="">Subsystem…</option></select><input class="fin" id="plo" placeholder="Location / room / panel">
   <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px"><input class="fin" id="pdt" type="date" value="${dv}"><input class="fin" id="phr" placeholder="08:00-17:00" value="08:00-17:00"><input class="fin" id="pwk" type="number" placeholder="Workers" value="4"></div>
   <textarea class="fin" id="px" style="height:100px" placeholder="Work description"></textarea><button class="tile main" style="width:100%;min-height:auto" onclick="pmSave()"><b>Save & send to Paul</b></button>`); }
function pSubs(sys) { const c = sysCode(sys); return [...new Set(PU.map(p => PT.sub[p.sub]).filter(s => s && s.includes('-' + c + '-')))].map(s => `<option>${esc(s)}</option>`).join(''); }
function pmSave() { const x = document.getElementById('px').value.trim(), sys = document.getElementById('psy').value; if (!x || !sys) return toast('Choose system and describe the work');
  S2.pr.push({id: 'P' + Date.now().toString(36), t: Date.now(), by: PS_.name, ty: document.getElementById('pty').value, sys, sub: document.getElementById('psb').value, loc: document.getElementById('plo').value, d: document.getElementById('pdt').value.split('-').reverse().join('.'), h: document.getElementById('phr').value, w: Number(document.getElementById('pwk').value) || 0, x}); ssave(); closeP(); sendMine('pr'); }
function mineText(k) { const L = S2[k].filter(x => !x.s); if (!L.length) return '';
  return L.map(x => k === 'is' ? `Reported by: ${x.by} · ${tstr(x.t)}\nSITE ISSUE ${x.id} · ${x.p}\nSystem: ${x.sys}\nItem: ${x.item || '-'}\nType: ${x.c.replace(/^\S+\s/, '')}\nComment: ${x.x}`
    : `Reported by: ${x.by} · ${tstr(x.t)}\nPERMIT REQUEST ${x.id}\nPermit: ${x.ty.replace(/^\S+\s/, '')}\nSystem: ${x.sys}\nSubsystem: ${x.sub || '-'}\nLocation: ${x.loc || '-'}\nDate: ${x.d} ${x.h}\nWorkers: ${x.w}\nWork: ${x.x}`).join('\n\n'); }
function sendMine(k) { const t = mineText(k); if (!t) return toast('Nothing new to send'); REP = {kind: k, L: S2[k].filter(x => !x.s), text: t};
  modalP(`<div class="h3">${k === 'is' ? 'Issues' : 'Permit requests'} → Paul (MAX direct)</div><textarea id="rtx" class="fin" style="height:180px;font:12px monospace" readonly>${esc(t)}</textarea>
   <button class="tile main" style="width:100%;min-height:auto" onclick="copyText(REP.text).then(ok=>{REP.L.forEach(x=>x.s=Date.now());ssave();toast(ok?'Copied ✓ – paste in Paul chat':'Copy the text');closeP();setTimeout(()=>location.href=MAXLINK,500);route();})"><b>📤 Send report to Paul</b><span class="n">copies text and opens Paul's MAX chat</span></button>`); }
// ---- parse issues / permits from pasted MAX text (owner import)
function parseAlerts(txt) { const out = []; String(txt).replace(/\r/g, '').split(/(?=Reported by:)/).forEach(b => { const ls = b.trim().split('\n'); if (!/^(SITE ISSUE|PERMIT REQUEST)/.test(ls[1] || '')) return;
  const h = ls[0].match(/Reported by:\s*(.+?)\s*·\s*(\d\d\.\d\d\.\d{4})\s*(\d\d:\d\d)?/); const f = {}; ls.slice(2).forEach(l => { const m = l.match(/^(\w+):\s*(.*)$/); if (m) f[m[1]] = m[2]; else if (f._last) f[f._last] += ' ' + l; });
  const isI = /^SITE ISSUE/.test(ls[1]); const id = (ls[1].match(/(I|P)[0-9a-z]+/) || [''])[0];
  out.push({k: isI ? 'issue' : 'permit', id: 'x' + id, by: h ? h[1] : '?', at: h ? h[2] + ' ' + (h[3] || '') : '', urgent: /Urgent/.test(ls[1]), f, title: isI ? `${f.Type || 'Issue'} · ${f.System || ''}` : `${f.Permit || 'Permit'} · ${f.System || ''}`, txt: isI ? `${f.Item && f.Item !== '-' ? f.Item + ' – ' : ''}${f.Comment || ''}` : `${f.Subsystem && f.Subsystem !== '-' ? f.Subsystem + ' · ' : ''}${f.Location || ''} · ${f.Date || ''} · ${f.Workers || ''} workers – ${f.Work || ''}`}); }); return out; }
const _importPaste = importPaste;
importPaste = function () { const t = document.getElementById('ptx').value; const A = parseAlerts(t); let n = 0; A.forEach(a => { if (!S2.al.some(x => x.id === a.id)) { a.t = Date.now(); S2.al.push(a); n++; } }); ssave();
  if (A.length && !parseReports(t).length) { closeP(); toast(`${n} new alerts (issues / permits)`); return route(); } if (n) toast(`${n} alerts added`); _importPaste(); };
// ---- Alerts from site (owner)
function revAlerts() { const A = []; RV.forEach((r, i) => { const f = r.ch.filter(rvDone); if (f.length) A.push({k: 'rev', id: 'rv' + r.doc + r.to, t: Date.now(), title: `${r.doc} rev ${r.to} came after installation`, txt: `${f.length} changes on finished work (${[...new Set(f.map(c => (RVK[c[0]] || c[0]).replace(/^\S+\s/, '')))].join(', ')})`, go: '#/rv/' + i}); }); return A; }
function allAlerts() { return [].concat(S2.al, revAlerts(), tqAlerts(), (D.meta.ver && S2.dataVer !== D.meta.ver) ? [{k: 'data', id: 'dv' + D.meta.ver, t: Date.now(), title: `New data loaded: ${D.meta.date}`, txt: `${RV.length} revised drawings – check Drawing revisions`, go: '#/rv'}] : []); }
const ALI = {issue: '🚩', permit: '📝', rev: '📄', tq: '❓', data: '🆕'};
function alCount() { return allAlerts().filter(a => !S2.ald[a.id]).length; }
function alHome() { if (!S2.owner) return ownerLogin(); VS.AL = VS.AL || 'new'; if (D.meta.ver) { S2.dataVer = S2.dataVer || ''; }
  const KO = {issue: 0, permit: 1, rev: 2, data: 3, tq: 4}; const A = allAlerts().sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || KO[a.k] - KO[b.k] || b.t - a.t); const L = A.filter(a => VS.AL === 'all' || (VS.AL === 'new' ? !S2.ald[a.id] : a.k === VS.AL));
  setHead('Alerts from site', `${A.filter(a => !S2.ald[a.id]).length} new`);
  main.innerHTML = `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="pasteBox()"><b>⬇ Paste messages from MAX</b><span class="n">progress, issues and permit requests – all in one paste</span></button>
   <div class="chips">${[['new', 'New'], ['issue', '🚩 Issues'], ['permit', '📝 Permits'], ['rev', '📄 Revisions'], ['tq', '❓ TQ'], ['all', 'All']].map(([k, l]) => `<button class="chip ${VS.AL === k ? 'on' : ''}" onclick="VS.AL='${k}';alHome()">${l} ${k === 'new' ? A.filter(a => !S2.ald[a.id]).length : k === 'all' ? A.length : A.filter(a => a.k === k).length}</button>`).join('')}</div>
   <div class="list">${L.slice(0, 300).map(a => { const d = S2.ald[a.id]; return `<div class="li" style="${a.urgent && !d ? 'background:#fff6f5' : ''}"><div class="m" ${a.go ? `onclick="go('${a.go}')"` : ''}><div class="t" style="word-break:normal">${ALI[a.k] || '•'} ${a.urgent ? '🔴 URGENT · ' : ''}${esc(a.title)}</div><div class="s" style="white-space:normal">${esc(a.txt || '')}</div><div class="s">${a.by ? esc(a.by) + ' · ' + esc(a.at) : ''}${d ? ' · ' + (d.v === 'A' ? '✅ approved' : d.v === 'R' ? '⛔ rejected' : '✓ done') + ' ' + dstr(d.t) : ''}</div></div>
     <div style="display:flex;flex-direction:column;gap:4px;flex:none">${a.k === 'permit' && !d ? `<button class="tg y" style="padding:6px 8px" onclick="alDo('${a.id}','A')">Approve</button><button class="tg n" style="padding:6px 8px" onclick="alDo('${a.id}','R')">Reject</button>` : d ? `<button class="tg" style="padding:6px 8px" onclick="delete S2.ald['${a.id}'];ssave();alHome()">Undo</button>` : `<button class="tg" style="padding:6px 8px" onclick="alDo('${a.id}','D')">✓ Done</button>`}</div></div>`; }).join('') || '<div class="empty">No alerts</div>'}</div>`;
  if (D.meta.ver && S2.dataVer !== D.meta.ver) { S2.dataVer = D.meta.ver; ssave(); } }
function alDo(id, v) { S2.ald[id] = {v, t: Date.now()}; ssave(); alHome(); if (v !== 'D') { const a = allAlerts().find(x => x.id === id); if (a) { const t = `Permit ${v === 'A' ? 'APPROVED ✅' : 'REJECTED ⛔'} · ${a.title}\n${a.txt}\nRequested by ${a.by} · ${a.at}`; copyText(t).then(() => toast('Answer copied – paste to the technician in MAX')); } } }

// ======== v3.5: CTQ menu + hold links, ID search, LR end-to-end termination, pulled length ========
// ---- CTQ affected-tag parser → links to cables / panels / devices that exist in the app
const KT = {}; // normalized full tag -> {k:'c'|'p'|'d', t}
const addKT = (t, k) => { const n = N(t); if (n.length > 3 && !KT[n]) KT[n] = {k, t}; };
PAN.forEach(p => addKT(p.tag, 'p')); C.forEach(c => addKT(c.t, 'c')); I.forEach(x => { if (x.tag) addKT(x.tag, CBY[x.tag] ? 'c' : PBY[x.tag] ? 'p' : 'd'); });
const SUF = {}; // normalized tag suffix (>= 2 segments, starting with a letter segment) -> [normalized full tags]
Object.values(KT).forEach(o => { const seg = String(o.t).split('-'); for (let s = 1; s <= seg.length - 2; s++) { if (!/[A-ZА-Я]/i.test(seg[s])) continue; const k = N(seg.slice(s).join('-')); if (k.length < 4) continue; (SUF[k] = SUF[k] || []).push(N(o.t)); } });
function ctqTokens(txt) {
  const s = String(txt || '').replace(/\s*(\.\.\.|…)\s*/g, '...').replace(/[,;()→×]/g, ' ').replace(/\s\/\s/g, ' ');
  const out = [];
  s.split(/\s+/).forEach(tk => { tk = tk.replace(/^[^A-Za-zА-Яа-я0-9]+|[^A-Za-zА-Яа-я0-9]+$/g, ''); if (!tk) return;
    let L = [tk];
    const r = tk.split('...'); // ranges: JU-2000...JU-2029, JB-001...056, CC-4010-C01...C05
    if (r.length === 2) { const a = r[0].match(/^(.*?)(\d+)$/), b = r[1].match(/^(.*?)(\d+)$/); L = [r[0], r[1]];
      if (a && b && (!b[1] || a[1].endsWith(b[1]))) { const x = Number(a[2]), y = Number(b[2]), w = a[2].length; if (y > x && y - x <= 300) { L = []; for (let n = x; n <= y; n++) L.push(a[1] + String(n).padStart(w, '0')); } } }
    L.forEach(t => { const m = t.match(/^(.*?)([A-Z]*\d+)((?:\/[A-Z]*\d+)+)(.*)$/); // slashes: JB-537/539-C01, LP-1001/1002/1003
      if (m) [m[2], ...m[3].split('/').filter(Boolean)].forEach(alt => out.push(m[1] + (/^\d+$/.test(alt) && /[A-Z]/.test(m[2]) ? m[2].replace(/\d+$/, alt) : alt) + m[4]));
      else out.push(t); }); });
  return out.filter(t => /-/.test(t) && /\d/.test(t) && t.length >= 5);
}
function ctqResolve(tok) { const seg = tok.split('-');
  for (let s = 0; s <= seg.length - 2; s++) { if (s && !/[A-ZА-Я]/i.test(seg[s])) continue; const k = N(seg.slice(s).join('-'));
    if (k.length < 4) continue; if (!s && KT[k]) return [k]; if (SUF[k] && SUF[k].length <= 6) return SUF[k]; if (SUF[k]) return []; }
  return []; }
const CTQX = {}; // ctq no -> {c:Set, p:Set, d:Set}
const HOLD = {}; // tag -> [ctq no]
const ctqOpen = t => /open/i.test(t.st || '');
CTQ.forEach(t => { const H = CTQX[t.no] = {c: new Set(), p: new Set(), d: new Set()};
  const dx = new Set(); ctqTokens(t.tags).forEach(tok => { const r = ctqResolve(tok); r.forEach(n => { const o = KT[n]; H[o.k].add(o.t); if (o.k === 'd' && r.length <= 2) dx.add(o.t); }); });
  dx.forEach(dt => C.forEach(c => { if (c.t.startsWith(dt + '-')) H.c.add(c.t); })); // cables named after an affected field device
  C.forEach(c => { if (c.q && new RegExp('\\b' + t.no + '\\b').test(c.q)) H.c.add(c.t); }); // CTQ written in the cable tracker
  if (ctqOpen(t)) [...H.c, ...H.p, ...H.d].forEach(x => { if (!(HOLD[x] = HOLD[x] || []).includes(t.no)) HOLD[x].push(t.no); }); });
const CTQBY = {}; CTQ.forEach(t => CTQBY[t.no] = t);
const subEN = s => { const m = String(s || '').search(/[А-Яа-яЁё]/); return (m > 20 ? s.slice(0, m) : s).trim(); };
const holdTags = tag => HOLD[tag] || [];
const holdMini = tag => holdTags(tag).length ? ` <span class="badge b-no">⛔ ${holdTags(tag).map(esc).join(', ')}</span>` : '';
function holdCard(tag) { const L = holdTags(tag); if (!L.length) return '';
  return L.map(no => { const t = CTQBY[no]; return `<div class="card" style="border-left:5px solid var(--bad);cursor:pointer" onclick="go('#/ctq/${enc(no)}')"><div><span class="badge b-no" style="font-size:13px">⛔ On hold – CTQ ${esc(no)}</span> ${t.hold === 'Yes' ? '<span class="badge b-part">Hold point</span>' : ''} <span class="badge b-na">${esc(t.pri)}</span></div>
   <div style="font-size:14px;font-weight:600;margin-top:6px">${esc(subEN(t.sub))}</div><div class="s2" style="margin-top:4px">Action: ${esc(String(t.act || '').slice(0, 220))}${String(t.act || '').length > 220 ? '…' : ''}</div><div class="link" style="font-size:13px;margin-top:6px">Open CTQ details ›</div></div>`; }).join(''); }
const ilink = (k, t) => k === 'c' ? `#/c/${enc(t)}` : k === 'p' ? `#/p/${enc(t)}` : (IBY[t] ? `#/i/${IBY[t][0].i}` : `#/s/${enc(t)}`);
// ---- CTQ menu (everyone)
function ctqHome() { VS.CQ = VS.CQ || {f: 'open', q: ''}; const v = VS.CQ; const op = CTQ.filter(ctqOpen);
  setHead('CTQ register', `${op.length} open · ${op.filter(t => t.hold === 'Yes').length} hold points · ${CTQ.length} total`);
  main.innerHTML = `<div class="kpi"><div><b style="color:var(--bad)">${op.length}</b><span>CTQ open</span></div><div><b>${op.filter(t => t.hold === 'Yes').length}</b><span>hold points</span></div><div><b>${Object.keys(HOLD).length}</b><span>items on hold</span></div></div>
   <div class="chips">${[['open', 'Open'], ['hold', 'Hold point'], ['High', 'High'], ['all', 'All']].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.CQ.f='${k}';ctqHome()">${l}</button>`).join('')}</div>
   <input class="fin" placeholder="CTQ No, tag, drawing, text..." value="${esc(v.q)}" oninput="VS.CQ.q=this.value;ctqList()"><div id="cql"></div>`; ctqList(); }
function ctqList() { const v = VS.CQ, ql = v.q.trim().toLowerCase(), nq = N(v.q);
  const L = CTQ.filter(t => (v.f === 'all' || (v.f === 'open' ? ctqOpen(t) : v.f === 'hold' ? ctqOpen(t) && t.hold === 'Yes' : t.pri === v.f)) && (!ql || [t.no, t.sub, t.dwg, t.tags, t.act, t.rel].join(' ').toLowerCase().includes(ql) || (nq.length > 2 && [...CTQX[t.no].c, ...CTQX[t.no].p, ...CTQX[t.no].d].some(x => N(x).includes(nq)))));
  document.getElementById('cql').innerHTML = L.length ? `<div class="list">${L.map(t => { const H = CTQX[t.no], n = H.c.size + H.p.size + H.d.size; return `<button class="li" onclick="go('#/ctq/${enc(t.no)}')"><div class="m"><div class="t">${esc(t.no)} · <span class="badge ${t.pri === 'High' ? 'b-no' : t.pri === 'Medium' ? 'b-part' : 'b-na'}">${esc(t.pri)}</span>${t.hold === 'Yes' ? ' <span class="badge b-no">⛔ Hold</span>' : ''}</div><div class="s" style="white-space:normal">${esc(subEN(t.sub).slice(0, 150))}</div><div class="s">${esc(t.dwg)}${n ? ` · ${n} linked items` : ''}</div></div><span class="badge ${ctqOpen(t) ? 'b-no' : 'b-ok'}">${esc(t.st || '-')}</span><span class="chev">›</span></button>`; }).join('')}</div>` : '<div class="empty">Nothing found</div>'; }
function ctqView(no) { const t = CTQBY[no]; if (!t) { main.innerHTML = '<div class="empty">CTQ not found</div>'; return; } const H = CTQX[no];
  setHead(no, `${t.pri} · ${t.st}${t.hold === 'Yes' ? ' · hold point' : ''}`);
  const grp = (k, lbl, set) => set.size ? `<div class="sect">${lbl} (${set.size})</div><div class="list">${[...set].sort().slice(0, 300).map(x => k === 'c' ? cRow(CBY[x]) : `<button class="li" onclick="go('${ilink(k, x)}')"><div class="m"><div class="t">${esc(x)}</div><div class="s">${k === 'p' ? esc(PBY[x].desc) : esc(IBY[x] ? IBY[x][0].g + ' · ' + (T.desc[IBY[x][0].desc] || '') : '')}</div></div><span class="chev">›</span></button>`).join('')}</div>` : '';
  main.innerHTML = `<div class="card"><div class="big">${esc(no)}</div><div style="margin:6px 0"><span class="badge ${ctqOpen(t) ? 'b-no' : 'b-ok'}" style="font-size:13px">${esc(t.st)}</span> <span class="badge ${t.pri === 'High' ? 'b-no' : t.pri === 'Medium' ? 'b-part' : 'b-na'}">${esc(t.pri)}</span>${t.hold === 'Yes' ? ' <span class="badge b-no">⛔ Hold point – work on hold</span>' : ''}</div>
   ${kv([['Subject', t.sub], ['Drawing', t.dwg], ['Revision', t.rev], ['Sheets / pages', t.sh], ['Affected tags', t.tags], ['Action required', t.act], ['Category', t.cat], ['Responsible', t.resp], ['Affected works', t.aff], ['Hold point', t.hold], ['TQ reference', t.rel], ['TQ answer / status', t.rels], ['Status', t.st], ['Date sent', t.dt], ['Remarks', t.rem]])}</div>
   ${H.c.size + H.p.size + H.d.size ? '' : '<div class="note">No cable / panel / device from this CTQ was found in the app data (tags may be material codes or not in the trackers yet).</div>'}
   ${grp('p', '🗄️ Panels & boxes', H.p)}${grp('d', '🎛️ Devices / equipment', H.d)}${grp('c', '🧵 Cables', H.c)}`; }
function ptqView(no) { const x = PTQ.find(y => y.no === no); if (!x) { main.innerHTML = '<div class="empty">TQ not found</div>'; return; } setHead(no, 'project TQ'); const cs = tqCables(no);
  main.innerHTML = `<div class="card"><div class="big">${esc(no)}</div>${kv([['Status', x.st], ['Rev', x.rev], ['Issued', x.dt], ['Discipline', x.dis], ['Drawing', x.dwg], ['Area', x.area], ['Classification', x.cls], ['Description', x.desc], ['EP status', x.ep + (x.epd ? ' · ' + x.epd : '')], ['EP remarks', x.epr], ['Owner status', x.ow], ['Revised drawings', x.revd], ['Comments', x.com]])}</div>
   ${cs.length ? `<div class="sect">Related cables (${cs.length})</div><div class="list">${cs.slice(0, 200).map(c => cRow(c)).join('')}</div>` : ''}`; }
// ---- documents (register / SF / LR) – detail popup
function docPop(no) { const r = RG.find(x => x.no === no); const sf = SF.filter(x => x.doc === no); const lrs = [...new Set(Object.values(LR).flat().map(z => z[0]).filter(f => N(f).includes(N(no).replace(/^GLE/, '').slice(0, 30))))];
  modalP(`<div class="h3">Document</div><div class="big" style="font-size:15px">${esc(no)}</div>${r ? kv([['Title', r.en], ['Название', r.ru], ['System', r.sys], ['Type', r.ty], ['Revision', r.rev], ['Status', r.st], ['Date', r.dt], ['Discipline', r.dis]]) : ''}
   ${sf.length ? `<div class="sect">SF files</div><div class="list">${sf.map(x => `<button class="li" onclick="closeP();go('#/sf/${enc(x.file)}')"><div class="m"><div class="t">${esc(x.file)}</div><div class="s">rev ${esc(x.rev)} ${esc(x.as || '')}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}
   ${lrs.length ? `<div class="s2" style="margin-top:6px">LR files: ${lrs.map(esc).join(', ')}</div>` : ''}<button class="tile" style="width:100%;min-height:auto;margin-top:10px" onclick="closeP()">Close</button>`); }
// ---- global ID search
function idSearch(q) { const n = N(q); const has = s => s && N(s).includes(n); const G = [];
  const add = (key, title, L, row) => { if (L.length) G.push({key, title, n: L.length, html: L.slice(0, 40).map(row).join('') + (L.length > 40 ? `<div class="li"><div class="m s2">+ ${L.length - 40} more – type more characters</div></div>` : '')}); };
  const devTags = [...new Set(I.filter(x => x._n.includes(n) && !CBY[x.tag] && !PBY[x.tag]).map(x => x.tag))];
  add('p', '🗄️ Panels & boxes', PAN.filter(p => p._n.includes(n)), p => { const s = pstat(p); return `<button class="li" onclick="go('#/p/${enc(p.tag)}')"><div class="m"><div class="t">${esc(p.tag)}${holdMini(p.tag)}</div><div class="s">${p.room ? 'Room ' + esc(p.room) + ' · ' : ''}${esc(p.desc)}</div></div><div class="r pc">${s.pc}%</div><span class="chev">›</span></button>`; });
  add('d', '🎛️ Equipment / device tags', devTags, t => { const x = IBY[t][0], s = ist(x); return `<button class="li" onclick="go('#/i/${x.i}')"><div class="m"><div class="t">${esc(t)}${holdMini(t)}</div><div class="s">${esc(x.g)} · ${esc(T.desc[x.desc] || '')}</div></div><span class="badge ${s.c}">${s.l}</span><span class="chev">›</span></button>`; });
  add('c', '🧵 Cables', C.filter(c => c._n.includes(n)), c => cRow(c));
  const accI = I.filter(x => x.acc && N(x.acc).includes(n)), seenA = new Set(accI.map(x => String(x.acc)));
  const accC = []; C.forEach(c => [['la', 'Cable pulling'], ['ta', 'Cable termination']].forEach(([k, g]) => { if (c[k] && !seenA.has(String(c[k])) && N(c[k]).includes(n)) accC.push({c, acc: c[k], g}); }));
  add('a', '📋 IWP Access IDs', [...accI, ...accC], x => { if (x.c) return `<button class="li" onclick="go('#/c/${enc(x.c.t)}')"><div class="m"><div class="t">Access ID ${esc(x.acc)} · ${esc(x.c.t)}${holdMini(x.c.t)}</div><div class="s">${x.g} · cable ${esc(x.c.ln || '')} m</div></div><span class="badge ${cst(x.c).c}">${cst(x.c).l}</span><span class="chev">›</span></button>`;
    const s = ist(x); return `<button class="li" onclick="go('#/i/${x.i}')"><div class="m"><div class="t">Access ID ${esc(x.acc)} · ${esc(x.tag)}${holdMini(x.tag)}</div><div class="s">${esc(x.g)} · ${fmtn(x.f)}/${fmtn(x.q)} ${esc(x.u)}</div></div><span class="badge ${s.c}">${s.l}</span><span class="chev">›</span></button>`; });
  add('pr', '🔧 RHI punch', PU.filter(p => p.rhi && (has(p.no) || p._t.includes(n))), pRow);
  add('pm', '📌 Master punch (client)', PU.filter(p => !p.rhi && (has(p.no) || p._t.includes(n))), pRow);
  add('q', '❓ CTQ (internal TQ)', CTQ.filter(t => has(t.no)), t => `<button class="li" onclick="go('#/ctq/${enc(t.no)}')"><div class="m"><div class="t">${esc(t.no)} · ${esc(t.pri)}${t.hold === 'Yes' ? ' <span class="badge b-no">⛔ Hold</span>' : ''}</div><div class="s">${esc(subEN(t.sub))}</div></div><span class="badge ${ctqOpen(t) ? 'b-no' : 'b-ok'}">${esc(t.st)}</span><span class="chev">›</span></button>`);
  add('t', '📨 Project TQ', PTQ.filter(t => has(t.no)), t => `<button class="li" onclick="go('#/ptq/${enc(t.no)}')"><div class="m"><div class="t">${esc(t.no)} R${esc(t.rev)}</div><div class="s">${esc(t.desc.slice(0, 120))}</div></div><span class="badge ${t.st === 'Closed' ? 'b-ok' : 'b-no'}">${esc(t.st)}</span><span class="chev">›</span></button>`);
  const docs = [...new Set([...RG.map(r => r.no), ...SF.map(x => x.doc)])].filter(has);
  add('g', '📑 Documents / drawings', docs, d => { const r = RG.find(x => x.no === d); return `<button class="li" onclick="docPop(decodeURIComponent('${enc(d)}'))"><div class="m"><div class="t">${esc(d)}</div><div class="s">${esc(r ? r.en : 'SF drawing')}</div></div>${r ? `<div class="r">Rev ${esc(r.rev)}<div>${esc(r.st)}</div></div>` : ''}<span class="chev">›</span></button>`; });
  add('dr', '🧵 Cable drums', DR.filter(d => has(d.no) || has(d.id)), d => `<button class="li" onclick="go('#/dr/${d.i}')"><div class="m"><div class="t">Drum ${esc(d.no)}</div><div class="s">${esc(d.id)} · ${esc(d.desc)}</div></div><span class="chev">›</span></button>`);
  add('mr', '🏬 MRF', MRF.filter(m => has(m.no)), m => `<button class="li" onclick="go('#/mr/${enc(m.no)}')"><div class="m"><div class="t">${esc(m.no)}</div><div class="s">${esc(m.sub || '')}</div></div><span class="chev">›</span></button>`);
  return G; }
function searchView(q) {
  setHead('ID search', q); if (qbox.value !== q) qbox.value = q;
  const n = N(q); if (n.length < 2) { main.innerHTML = '<div class="empty">Type at least 2 characters</div>'; return; }
  const G = idSearch(q); VS.SG = VS.SG && VS.SG.q === q ? VS.SG : {q, f: ''}; const f = VS.SG.f;
  main.innerHTML = G.length ? `<div class="chips"><button class="chip ${!f ? 'on' : ''}" onclick="VS.SG.f='';searchView(VS.SG.q)">All ${G.reduce((a, g) => a + g.n, 0)}</button>${G.map(g => `<button class="chip ${f === g.key ? 'on' : ''}" onclick="VS.SG.f='${g.key}';searchView(VS.SG.q)">${g.title.split(' ')[0]} ${g.n}</button>`).join('')}</div>` +
    G.filter(g => !f || g.key === f).map(g => `<div class="sect">${g.title} (${g.n})</div><div class="list">${g.html}</div>`).join('')
    : '<div class="empty">Nothing found. Type part of any ID: tag, cable, panel, Access ID, punch No, CTQ/TQ No, document No (e.g. JB-541, CA-1001, 88647, CTQ-18).</div>';
}
// ---- LR end-to-end termination
const cleanTb = s => { const P = String(s || '').trim().replace(/[«_].*$/, '').replace(/(\d)(?=[A-Z]{2,}\d)/g, '$1|').split('|'); const out = [P[0]]; P.slice(1).forEach(x => { if (!out.some(o => o.endsWith(x))) out.push(x); }); return out.join(' / '); }; // PDF text may join two strip names
const cleanTn = s => String(s || '').replace(/[«_].*$/, '').replace(/[А-Яа-я].*$/, '').trim();
const PANS = PAN.map(p => p.tag).sort((a, b) => b.length - a.length);
const canonDev = t => { t = String(t || '').trim(); if (PBY[t] || KT[N(t)]) return t; const p = PANS.find(x => t.startsWith(x)); return p || t; };
function lrEnds(tag) { const R = (LR[tag] || []).map(r => ({doc: r[0], pg: r[1], core: String(r[2] || ''), dev: canonDev(r[3]), oth: canonDev(r[4]), tb: cleanTb(r[5]), tn: cleanTn(r[6])})); if (!R.length) return null;
  const c = CBY[tag], fN = N(node0(c ? c.f : '')), tN = N(node0(c ? c.o : ''));
  const devs = [...new Set(R.map(r => r.dev))]; let from = devs.find(d => fN && fN.includes(N(d).slice(-10))) || devs[0]; let to = devs.find(d => d !== from && tN && tN.includes(N(d).slice(-10))) || devs.find(d => d !== from) || (R.find(r => r.oth !== from) || {}).oth || '';
  const cores = [...new Set(R.map(r => r.core))]; const at = (d, core) => R.filter(r => r.dev === d && r.core === core);
  const rows = cores.map(core => ({core, F: at(from, core), T: at(to, core)}));
  return {R, from, to, rows, docs: [...new Set(R.map(r => r.doc + ' · sh. ' + r.pg))]}; }
const tbTxt = L => L.length ? L.map(r => `<b>${esc(r.tb || '-')}</b> : ${esc(r.tn || '-')}`).join('<br>') : '<span style="color:var(--mut)">–</span>';
const devLink = d => d ? (PBY[d] ? `<span class="link" onclick="go('#/p/${enc(d)}')">${esc(shortT(d))}</span>` : (IBY[d] ? `<span class="link" onclick="go('#/i/${IBY[d][0].i}')">${esc(shortT(d))}</span>` : esc(shortT(d)))) : '–';
function lrCard(c) { const E = lrEnds(c.t);
  if (!E) return `<div class="card"><div class="h3">End-to-end termination (LR drawing)</div><div class="note" style="background:#eef3f8">LR termination data not available yet</div></div>`;
  return `<div class="card"><div class="h3">End-to-end termination (LR drawing)</div>
   <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center;font-size:13px;margin-bottom:8px"><div style="background:#eef3f8;border-radius:8px;padding:8px"><div class="s2">From device</div>${devLink(E.from)}</div><div style="font-size:18px;color:var(--acc)">↔</div><div style="background:#eef3f8;border-radius:8px;padding:8px"><div class="s2">To device</div>${devLink(E.to)}</div></div>
   <div class="list"><div class="li" style="font-size:12px;font-weight:700;color:var(--pri2);background:#f5f7fa"><div style="width:58px;flex:none">Cores</div><div style="flex:1">From: strip : terminals</div><div style="flex:1">To: strip : terminals</div></div>
   ${E.rows.map(r => `<div class="li" style="font-size:13px;align-items:flex-start"><div style="width:58px;flex:none;font-weight:600">${esc(r.core || '-')}</div><div style="flex:1;word-break:break-word">${tbTxt(r.F)}</div><div style="flex:1;word-break:break-word">${tbTxt(r.T)}</div></div>`).join('')}</div>
   <div class="s2" style="margin-top:6px">LR drawing: ${E.docs.map(esc).join('; ')}</div></div>`; }
const LRAT = {}; Object.keys(LR).forEach(tag => (LR[tag] || []).forEach(r => { const d = canonDev(r[3]); ((LRAT[d] = LRAT[d] || {})[tag] = LRAT[d][tag] || []).push(r); }));
function lrAtCard(dev) { const M = LRAT[dev]; if (!M) return '';
  return `<div class="card"><div class="h3">Terminations at this ${PBY[dev] ? 'panel' : 'device'} (LR drawing)</div><div class="list">${Object.entries(M).map(([tag, rs]) => { const E = lrEnds(tag); const oth = E ? (E.from === dev ? E.to : E.from) : '';
    return `<button class="li" style="align-items:flex-start" onclick="go('#/c/${enc(tag)}')"><div class="m"><div class="t">${esc(tag)}${holdMini(tag)}</div><div class="s" style="white-space:normal">${rs.map(r => `${esc(cleanTb(r[5]))} : ${esc(cleanTn(r[6]))} (cores ${esc(r[2])})`).join(' · ')}</div><div class="s" style="white-space:normal">↔ ${esc(shortT(oth))} · ${esc(String(rs[0][0]).replace(/_AL.*$/, ''))} sh. ${esc(rs[0][1])}</div></div><span class="chev">›</span></button>`; }).join('')}</div></div>`; }
// ---- actual pulled length (saved on the phone, sent in report)
function lenBox(c) { const e = (S2.c[c.t] || {}).L;
  return `<div style="display:flex;gap:6px;align-items:center;margin-top:6px" onclick="event.stopPropagation()"><input class="fin" id="pl_${c.i}" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Actual pulled length, m${c.ln ? ' (design ' + esc(c.ln) + ' m)' : ''}" value="${e ? esc(e.v) : ''}" style="flex:1;margin:0;padding:8px 10px;font-size:14px"><button class="tg y" style="padding:8px 12px;flex:none" onclick="event.stopPropagation();lenSave(decodeURIComponent('${enc(c.t)}'),${c.i})">Save m</button></div>${e ? `<div class="s2" style="margin-top:3px">Pulled length ${fmtn(e.v)} m · ${dstr(e.t)} · ${esc(e.by)}${e.s ? ' · sent' : ' · not sent'}</div>` : ''}`; }
function lenSave(tag, i) { if (!who(`lenSave(decodeURIComponent('${enc(tag)}'),${i})`)) return; const el = document.getElementById('pl_' + i); const v = Number(String(el ? el.value : '').replace(',', '.'));
  if (!(v > 0) || v > 5000) return toast('Enter the pulled length in metres'); const e = S2.c[tag] = S2.c[tag] || {}; e.L = {v: Math.round(v * 10) / 10, t: Date.now(), by: PS_.name}; ssave(); toast('Pulled length saved'); route(); }
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3500); }
(() => { const ht = document.getElementById('ht'); let lp = 0;
  ht.addEventListener('pointerdown', () => { lp = setTimeout(() => { lp = 0; ownerLogin(); }, 2000); });
  ht.addEventListener('pointerup', e => { if (lp) { clearTimeout(lp); lp = 0; ttlTap(); } e.preventDefault(); });
  ht.addEventListener('pointercancel', () => { clearTimeout(lp); lp = 0; });
  ht.addEventListener('contextmenu', e => e.preventDefault()); })();
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => { reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'activated' && hadSW) toast('New data downloaded – reopen the app'); }); }); }).catch(() => {});
}
