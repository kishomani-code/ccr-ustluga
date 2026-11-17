// v4.76: G2 SCOPE – one common main menu for our new Train 2 area (6 titles):
// G2-B1101FX0, G2-B1110BX0, G2-B1140RX0, G2-B1301FX0, G2-B2210BX0, G2-B2710RX0.
// Data: g2.json (built by /home/claude/g2/build_g2json.py from the G2 scope Excel 17.11.2026 + IWP status + MDR 16.11.2026).
// Replaces the separate "Tray G2-B1301FX0" project – the tray work (tray.js) is now one section inside this menu.
// Report to Paul: G2 site entries + tray entries in one text → G2 MAX progress group (MAX_G2).
// v4.77: scope without heat tracing (EH / EOBK) and QA-QC calibration / testing; CCR-style menu (Construction, Materials, Documents, Progress);
//        material / MRF / cable status per IWP line and a Materials (SF) section from the G2 follow-up workbook.
(function () {
  const G2 = window.G2 = {d: null};
  const DC = 'appdata-v1', KEY = 'g2_scope_v1';
  const MAX_G2 = 'https://max.ru/join/Uzm-MYH2SQPfdNrfbmVOu539Z5OC6ayzhDWzWiR20E0';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || !Array.isArray(d.iwp)) return; const first = !G2.d; G2.d = d; const X = d.IX;
    G2.I = d.iwp.map(r => ({acc: String(r[0]), t: X.t[r[1]], d: X.d[r[2]], g: X.g[r[3]], dwg: X.dwg[r[4]], c: r[5], tag: r[6], u: X.u[r[7]], q: r[8], f: r[9], co: X.co[r[10]], iwp: X.iwp[r[11]], resp: X.resp[r[12]], boq: X.boq[r[13]], mat: X.mat[r[14]] || '', cab: X.cab[r[15]] || '', loc: r[16] || '', mrf: X.mrf[r[17]] || '', nw: r[18] || '', stf: X.stf[r[19]] || '', tq: X.tq[r[20]] || '', blk: X.blk[r[21]] || ''}));
    G2.M = (d.mat || []).map(r => ({sf: X.sf[r[0]], id: r[1], cls: X.cls[r[2]], en: r[3], ru: r[4], u: r[5], q: r[6], rec: r[7], nw: r[8], sh: r[9], st: r[10], mrf: r[11], resv: r[12] || ''}));
    G2.by = {}; G2.I.forEach(x => G2.by[x.acc] = x);
    G2.D = d.dwgs.map(r => { const o = {}; d.DK.forEach((k, i) => o[k] = r[i]); return o; });
    const h = location.hash.replace(/^#\/?/, '').replace(/[?&]p=[^&]*$/i, '');
    if (first && (/^g2(\/|$)/.test(h) || (h === '' && G2.mine())) && typeof route === 'function') { try { route(); } catch (e) {} } }
  G2.load = function () { cget('g2.json').then(d => { if (d) set(d); return net('g2.json'); }).then(d => { if (d && (!G2.d || d.ver !== G2.d.ver)) set(d); }).catch(() => {}); };
  G2.mine = () => typeof PRJ !== 'undefined' && PRJ === 'G2-B1301FX0';
  // ---------- site entries (this phone) ----------
  G2.st = function () { if (G2._s) return G2._s; let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} return G2._s = s && s.e ? s : {e: []}; };
  G2.save = function () { try { localStorage.setItem(KEY, JSON.stringify(G2._s)); } catch (e) {} };
  const p2 = n => String(n).padStart(2, '0');
  const ds = ts => { const t = new Date(ts); return `${p2(t.getDate())}.${p2(t.getMonth() + 1)}.${t.getFullYear()}`; };
  const iso = ts => { const t = new Date(ts); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`; };
  const isoTs = v => { const p = String(v || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() : Date.now(); };
  const nowS = () => { const t = new Date(); return ds(t) + ' ' + p2(t.getHours()) + ':' + p2(t.getMinutes()); };
  const who = () => (typeof PS_ !== 'undefined' && PS_.name) || '';
  const isTray = acc => !!(window.TY && TY.by && TY.by[acc]);
  const siteQ = acc => G2.st().e.filter(x => x.acc === acc).reduce((a, x) => a + x.q, 0) + (isTray(acc) ? (TY.st().e.filter(x => x.acc === acc).reduce((a, x) => a + x.q, 0)) : 0);
  const tot = x => x.f + siteQ(x.acc);
  const rem = x => Math.max(0, x.q - tot(x));
  const pc = (a, b) => b > 0 ? Math.min(100, Math.round(100 * a / b)) : 0;
  const stOf = x => x.q > 0 && tot(x) >= x.q - 1e-6 ? 'D' : tot(x) > 0 ? 'P' : 'N';
  const STL = {D: [L('Done', 'Выполнено'), 'b-ok'], P: [L('In progress', 'В работе'), 'b-na'], N: [L('Not started', 'Не начато'), '']};
  const nf = v => fmtn(Math.round(v * 100) / 100);
  const CAT = {cab: ['🧵', L('Cable laying', 'Прокладка кабелей')], ter: ['🔌', L('Termination', 'Разделка / подключение')], ins: ['🎛️', L('Instruments, JB, cabinets', 'Приборы, коробки, шкафы КИП')],
    pow: ['⚡', L('Power equipment, boxes', 'Электрооборудование, коробки')], tray: ['🧱', L('Trays, supports, conduits (bulk)', 'Лотки, опоры, трубы (объёмные)')], ear: ['⏚', L('Earthing', 'Заземление')], civ: ['⛏️', L('Civil (backfill, tape)', 'Земляные работы')], oth: ['❔', L('Other', 'Прочее')]};
  const cat = g => ((G2.d.groups || {})[g] || ['oth'])[0];
  const grp = g => RU ? (((G2.d.groups || {})[g] || [])[1] || g) : g;
  const tName = t => (G2.d.titles[t] || [t, t, t])[RU ? 1 : 0];
  const lineStat = I => { const n = I.length, d = I.filter(x => stOf(x) === 'D').length, p = I.filter(x => stOf(x) === 'P').length; return {n, d, p}; };
  const T2 = (h, b, n, p, cls, sty) => `<button class="tile ${cls || ''}" style="${sty || ''}" onclick="${h.startsWith('#') ? `go('${h}')` : h}"><b>${b}</b><div><span class="n">${n}</span>${p != null ? `<div class="pc">${p}%</div><div class="pbar"><i style="width:${p}%"></i></div>` : ''}</div></button>`;
  const pend = () => G2.st().e.filter(e => !e.sent).length + (window.TY && TY.d ? TY.st().e.filter(e => !e.sent).length : 0);
  const tri = v => { const p = String(v || '').split(' / '); return p.length >= 2 ? (RU ? p[1] : p[0]) : v; };
  const MST = {resv: [L('Reserved on MRF – collect from WH', 'Резерв по MRF – забрать со склада'), 'b-ok'], rec: [L('Received on MRF', 'Получено по MRF'), 'b-ok'], mrf: [L('Need MRF – stock in WH', 'Нужен MRF – есть на складе'), 'b-na'], part: [L('Part MRF – rest short', 'Частично MRF – остаток TQ'), 'b-no'],
    short: [L('No free stock – TQ / STF', 'Нет на складе – TQ / STF'), 'b-no'], nowh: [L('Not in WH register', 'Нет в реестре склада'), ''], unit: [L('Unit check', 'Проверить единицу'), ''], cable: [L('Cable – by drum', 'Кабель – по барабанам'), '']};
  const sfShort = d => String(d).replace(/GLE-\(G2-(B\d{4})[A-Z]X0\)-(\w+)-(\w+)-SF-001/, '$1 $2-$3');
  // ---------- routing ----------
  G2.route = function (rest) { const k = rest[0] || '', a = dec(rest.slice(1).join('/'));
    if (!G2.d) { main.innerHTML = '<div class="empty">Loading…</div>'; G2.load(); return; }
    const R = {t: title, l: list, i: line, dw: dwgs, d: daily, rp: repPage, c: catPage, m: matPage}[k];
    const h = R ? R(a) : home(); if (typeof h === 'string') main.innerHTML = '<div data-nt>' + h + '</div>'; };
  // ---------- main menu ----------
  function home() { const d = G2.d; setHead(L('G2 scope · Train 2', 'G2 · линия 2') + ' · GPP E&I', `v${typeof APPV !== 'undefined' ? APPV : ''} · IWP ${d.iwpdate} · MDR ${d.date}`);
    const I = G2.I, R = I, a = lineStat(I), np = pend();
    const Dh = G2.D.filter(x => x.st === 'have').length, Dn = G2.D.filter(x => x.st !== 'have').length, Dm = G2.D.filter(x => x.st !== 'have' && x.need !== 'Useful').length;
    const T = Object.keys(d.titles);
    const ty = window.TY && TY.d ? TY.sum() : L('loading…', 'загрузка…');
    return `${G2.mine() && typeof projBar === 'function' ? projBar() : ''}
     <div style="background:linear-gradient(135deg,#0b3d6e,#1a73e8);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px"><div style="font-size:17px;font-weight:700">🏭 ${L('G2 scope · Train 2 · 6 titles', 'Объём G2 · линия 2 · 6 титулов')}</div><div style="font-size:12px;opacity:.92">${L('Expander booster area & building, demethanizer, regeneration gas compressor building, racks · E&I, FA, TE', 'Детандер (зона и здание), деметанизатор, здание компрессора газа регенерации, эстакады · Э, КИП, ПС, связь')}</div></div>
     <div class="kpi"><div><b>${I.length}</b><span>${L('IWP lines', 'строк IWP')}</span></div><div><b style="color:var(--ok)">${a.d}</b><span>${L('lines done', 'выполнено')}</span></div><div><b style="color:var(--ok)">${pc(a.d, a.n)}%</b><span>${L('done', 'выполнено')}</span></div><div><b style="color:${Dm ? '#b42318' : 'var(--ok)'}">${Dh}/${G2.D.length}</b><span>${L('drawings in hand', 'чертежей есть')}</span></div></div>
     <button class="tile main" style="width:100%;min-height:auto;margin-bottom:4px;background:${np ? '#c55a11' : 'var(--pri)'};border-color:${np ? '#c55a11' : 'var(--pri)'}" onclick="G2.report()"><b>📤 ${L('Send report to Paul', 'Отправить отчёт Паулю')} · ${np} ${L('new progress lines', 'новых строк прогресса')}</b><span class="n">👷 ${esc(who() || L('tap to set your name', 'укажите имя'))} · ${L('G2 MAX progress group · G2 + tray in one report', 'группа прогресса G2 в MAX · G2 и лотки в одном отчёте')}</span></button>
     <div class="sect">🏗️ ${L('Construction', 'Строительство')}</div><div class="grid">
      ${T.map(t => { const s = lineStat(I.filter(x => x.t === t)); const miss = G2.D.filter(x => x.t === t && x.st !== 'have' && x.need !== 'Useful').length;
        return T2('#/g2/t/' + enc(t), `${t}<div style="font-weight:400;font-size:11px">${esc(tName(t))}</div>`, `${s.d}/${s.n} ${L('lines done', 'строк вып.')}${miss ? ' · 📄 ' + miss + ' ' + L('drawings missing', 'чертежей нет') : ''}`, pc(s.d, s.n), 'main'); }).join('')}
      ${Object.keys(CAT).map(k => { const X = I.filter(x => cat(x.g) === k); if (!X.length) return ''; const s = lineStat(X); return T2('#/g2/c/' + k, `${CAT[k][0]} ${CAT[k][1]}`, `${s.d}/${s.n} ${L('done', 'вып.')} · ${s.p} ${L('in progress', 'в работе')}`, pc(s.d, s.n)); }).join('')}
      ${T2('#/ty', L('🧱 Tray installation · G2-B1301FX0', '🧱 Монтаж лотков · G2-B1301FX0'), esc(ty), null, 'main')}
      ${T2('#/g2/l/', L('🔎 All IWP lines · search', '🔎 Все строки IWP · поиск'), `${I.length} access ID`)}
      ${T2('#/g2/d', L('✍️ Daily entry list', '✍️ Ежедневные записи'), `${G2.st().e.length} ${L('entries', 'записей')} · ${G2.st().e.filter(e => !e.sent).length} ${L('not sent', 'не отправлено')}`)}
      ${(() => { const B = I.filter(x => x.blk && stOf(x) !== 'D'); return T2('#/g2/l/' + enc('|||||!blk'), L('⛔ Blocked work', '⛔ Что мешает работе'), `${B.filter(x => x.blk === 'Material').length} ${L('material', 'материал')} · ${B.filter(x => x.blk === 'MRF').length} MRF`, null, '', B.length ? 'border-color:#b42318' : ''); })()}</div>
     <div class="sect">📦 ${L('Materials', 'Материалы')}</div><div class="grid">
      ${(() => { const M = G2.M || [], c = k => M.filter(m => m.st === k).length; return T2('#/g2/m/', L('📦 Material by SF drawing', '📦 Материалы по SF'), `${M.length} ${L('items', 'позиций')} · ${c('rec')} ${L('received on MRF', 'получено по MRF')} · ${c('resv')} ${L('reserved – collect', 'в резерве')}`, pc(c('rec') + c('resv'), M.length), 'main')
        + T2('#/g2/m/' + enc('!mrf'), L('📝 Need MRF – stock in warehouse', '📝 Нужен MRF – есть на складе'), `${c('mrf') + c('part')} ${L('items · MRF workbook ready', 'позиций · MRF готовы')}`)
        + T2('#/g2/m/' + enc('!resv'), L('🔒 Reserved on MRF – collect from WH', '🔒 Резерв по MRF – забрать со склада'), `${c('resv')} ${L('items · who reserved', 'позиций · кто зарезервировал')}`)
        + T2('#/g2/m/' + enc('!short'), L('❗ No stock – TQ / STF', '❗ Нет на складе – TQ / STF'), `${c('short') + c('part')} ${L('items', 'позиций')} · ${c('nowh')} ${L('not in WH register', 'нет в реестре')}`, null, '', 'border-color:#b42318'); })()}
      ${T2('#/ty/m/', L('🧱 Tray material & MRF', '🧱 Материалы и MRF лотков'), L('SF vs stock · MRF · CTQ', 'SF и склад · MRF · CTQ'))}</div>
     <div class="sect">📑 ${L('Documents', 'Документы')}</div><div class="grid">
      ${T2('#/g2/dw/', L('📄 Drawings register · all titles', '📄 Реестр чертежей · все титулы'), `${Dh} ${L('in hand', 'есть')} · ${Dn} ${L('not in hand', 'нет')}`, pc(Dh, G2.D.length), 'main')}
      ${T2('#/g2/dw/' + enc('!miss'), L('⚠️ Drawings we still need', '⚠️ Нужные чертежи – нет'), `${Dm} ${L('must-have not in hand · send PDF', 'обязательных нет · прислать PDF')}`, null, '', Dm ? 'border-color:#b42318' : '')}</div>
     <div class="sect">📈 ${L('Progress', 'Прогресс')}</div><div class="grid">
      ${T2('#/g2/rp/status', L('📊 Progress status', '📊 Статус прогресса'), L('by title and work type', 'по титулам и видам работ'), null, 'main')}
      ${T2('#/g2/rp/day', L('📅 Daily report', '📅 Дневной отчёт'), L('entries of a date', 'записи за дату'))}
      ${T2('#/g2/rp/last', L('↩ Last report sent', '↩ Последний отчёт'), G2.st().lastT ? esc(G2.st().lastT) : L('none yet', 'ещё нет'))}</div>
     <div class="sect">🧭 ${L('Systems · cables · IWP · punch per title', 'Системы · кабели · IWP · панч по титулу')}</div><div class="grid">
      ${T.map(t => T2(`OA.open('${t}')`, t, L('cable tracker · IWP · punch', 'кабели · IWP · панч'))).join('')}</div>
     <div class="foot">${esc(d.note || '')}</div>`; }
  // ---------- title / work type pages ----------
  function blockBy(X, keyf, labf, hreff) { const ks = [...new Set(X.map(keyf))]; return ks.map(k => { const Y = X.filter(x => keyf(x) === k), s = lineStat(Y); return T2(hreff(k), labf(k), `${s.d}/${s.n} ${L('done', 'вып.')} · ${s.p} ${L('in progress', 'в работе')}`, pc(s.d, s.n)); }).join(''); }
  function title(t) { setHead(t, tName(t)); const X = G2.I.filter(x => x.t === t), R = X, s = lineStat(R);
    const Dd = G2.D.filter(x => x.t === t);
    return `<div class="kpi"><div><b>${X.length}</b><span>${L('IWP lines', 'строк IWP')}</span></div><div><b style="color:var(--ok)">${s.d}</b><span>${L('lines done', 'выполнено')}</span></div><div><b style="color:var(--ok)">${pc(s.d, s.n)}%</b><span>${L('done', 'вып.')}</span></div><div><b>${Dd.filter(x => x.st === 'have').length}/${Dd.length}</b><span>${L('drawings', 'чертежи')}</span></div></div>
     <div class="sect">${L('By work group', 'По видам работ')}</div><div class="grid">${blockBy(R, x => x.g, g => `${CAT[cat(g)][0]} ${esc(grp(g))}`, g => '#/g2/l/' + enc(t + '|' + g + '||'))}</div>
     <div class="sect">${L('By drawing', 'По чертежам')}</div><div class="grid">${blockBy(R, x => x.dwg, w => esc(w.replace('GLE-(' + t + ')-', '')), w => '#/g2/l/' + enc(t + '||' + w + '|'))}</div>
     <div class="sect">📄 ${L('Drawings of this title', 'Чертежи титула')}</div><div class="list">${Dd.map(dbtn).join('')}</div>
     <button class="tile" style="width:100%;min-height:auto;margin-top:8px" onclick="OA.open('${t}')"><b>🗂 ${L('Cables · IWP · punch (all disciplines)', 'Кабели · IWP · панч (все разделы)')}</b></button>`; }
  function catPage(k) { setHead((CAT[k] || CAT.oth)[0] + ' ' + (CAT[k] || CAT.oth)[1], L('G2 scope · all lines', 'G2 · все строки')); const R = G2.I.filter(x => cat(x.g) === k);
    return `<div class="sect">${L('By title', 'По титулам')}</div><div class="grid">${blockBy(R, x => x.t, t => t, t => '#/g2/l/' + enc(t + '|' + '' + '||' + k))}</div>
     <div class="sect">${L('By work group', 'По группам')}</div><div class="grid">${blockBy(R, x => x.g, g => esc(grp(g)), g => '#/g2/l/' + enc('|' + g + '||'))}</div>`; }
  // ---------- lists ----------
  // filter string: title|group|drawing|q|cat  (rhi only unless q given)
  function list(f) { const [t, g, w, q0, k, fx] = String(f || '').split('|'); setHead(t || L('IWP lines', 'Строки IWP'), g ? grp(g) : w ? w : 'G2');
    let I = G2.I.filter(x => (!t || x.t === t) && (!g || x.g === g) && (!w || x.dwg === w) && (!k || cat(x.g) === k) && (fx !== '!blk' || (x.blk && stOf(x) !== 'D')));
    const q = (q0 || '').toLowerCase(); if (q) I = I.filter(x => (x.acc + ' ' + x.tag + ' ' + x.c + ' ' + x.dwg + ' ' + x.iwp + ' ' + x.g).toLowerCase().includes(q)); 
    const O = {P: 0, N: 1, D: 2}; I = I.slice().sort((a, b) => O[stOf(a)] - O[stOf(b)] || a.g.localeCompare(b.g) || a.tag.localeCompare(b.tag));
    const lim = 300, more = I.length > lim;
    return `<input class="search" style="width:100%;margin-bottom:8px" placeholder="${L('search access ID / tag / item / drawing / IWP', 'поиск access ID / тег / позиция / чертёж / IWP')}" value="${esc(q0 || '')}" onchange="go('#/g2/l/'+enc('${esc(t || '')}|${esc(g || '')}|${esc(w || '')}|'+this.value+'|${k || ''}|${fx || ''}'))">
     <div class="foot" style="margin:0 0 6px">${I.length} ${L('lines', 'строк')}${more ? ' · ' + L('first', 'первые') + ' ' + lim + ' ' + L('shown – search to narrow', 'показаны – уточните поиск') : ''}</div>
     <div class="list">${I.slice(0, lim).map(x => `<button class="li" onclick="go('${isTray(x.acc) ? '#/ty/i/' : '#/g2/i/'}${enc(x.acc)}')"><div class="m"><div class="t">${esc(x.tag || x.c)}</div><div class="s">${x.tag ? esc(x.c) + ' · ' : ''}ID ${esc(x.acc)} · ${esc(x.t)} · ${esc(grp(x.g))} · ${nf(tot(x))}/${nf(x.q)} ${esc(x.u)}${x.co ? ' · ' + esc(x.co) : ''}${isTray(x.acc) ? ' · 🧱' : ''}${x.blk && stOf(x) !== 'D' ? ' · ⛔ ' + esc(x.blk) : ''}</div></div><span class="badge ${STL[stOf(x)][1]}">${STL[stOf(x)][0]}</span><span class="chev">›</span></button>`).join('') || '<div class="empty">' + L('Nothing found', 'Ничего не найдено') + '</div>'}</div>`; }
  function line(acc) { const x = G2.by[acc]; if (!x) return home(); if (isTray(acc)) { go('#/ty/i/' + enc(acc)); return; } const st = G2.st(); setHead('ID ' + acc, x.tag || x.t);
    const Dx = G2.D.filter(z => z.doc === x.dwg || z.doc === x.dwg.replace(/-(\w{4})-(\d{3})$/, '-$1-SF-$2') || z.doc === x.dwg.replace(/-SF-/, '-'));
    return `<div class="card"><div class="h3">${esc(x.tag || x.c)}</div><div style="font-size:13px">${esc(x.c)}</div>
      <div class="kv"><b>${L('Title', 'Титул')}</b> ${esc(x.t)} · ${esc(tName(x.t))}<br><b>${L('Work group', 'Вид работ')}</b> ${esc(grp(x.g))}${RU ? '' : ''}<br><b>IWP</b> ${esc(x.iwp || '–')}<br><b>BoQ</b> ${esc(x.boq || '–')}<br><b>${L('Drawing', 'Чертёж')}</b> ${esc(x.dwg)}<br>
      ${Dx.map(z => z.fid ? `<a href="${DL(z.fid)}" target="_blank" rel="noopener" style="display:inline-block;margin:3px 4px 3px 0;padding:4px 8px;border-radius:12px;background:#e3eefc;color:#0b3d6e;font-size:12px;text-decoration:none">📄 ${esc(z.doc.replace('GLE-(' + x.t + ')-', ''))} rev ${esc(z.rev)}</a>` : `<span style="display:inline-block;margin:3px 4px 3px 0;padding:4px 8px;border-radius:12px;background:#fde8e8;color:#b42318;font-size:12px">📄 ${esc(z.doc.replace('GLE-(' + x.t + ')-', ''))} rev ${esc(z.rev)} – ${L('PDF not in hand', 'PDF нет')}</span>`).join('')}<br>
      <b>${L('Planned', 'План')}</b> ${nf(x.q)} ${esc(x.u)} · <b>${L('IWP done', 'По IWP')}</b> ${nf(x.f)} · <b>${L('Site entry', 'Ввод')}</b> ${nf(siteQ(acc))} · <b>${L('Left', 'Осталось')}</b> ${nf(rem(x))}<br><b>${L('Done by (IWP)', 'Выполнил (IWP)')}</b> ${esc(x.co || '–')} · <b>${L('Responsible (IWP)', 'Ответственный')}</b> ${esc(x.resp || '–')}</div></div>
     <div class="card"><div class="kv">${x.loc ? `<b>📍 ${L('Location', 'Место')}</b> ${esc(x.loc)}<br>` : ''}${x.cab ? `<b>🧵 ${L('Cable', 'Кабель')}</b> ${esc(tri(x.cab))}<br>` : ''}<b>📦 ${L('Material', 'Материал')}</b> ${esc(tri(x.mat) || '–')}${x.mrf ? `<br><b>MRF</b> ${esc(x.mrf)}` : ''}${x.nw ? `<br><b>${L('New MRF', 'Новый MRF')}</b> ${esc(x.nw)}` : ''}${x.stf ? `<br><b>STF</b> ${esc(x.stf)}` : ''}${x.tq ? `<br><b>TQ</b> ${esc(x.tq)}` : ''}${x.blk && stOf(x) !== 'D' ? `<br><b style="color:#b42318">⛔ ${L('Blocked by', 'Мешает')}</b> ${esc(x.blk)}` : ''}</div></div>
     ${true ? `<div class="sect">${L('Add progress', 'Добавить объём')}</div><div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><input id="g2q" class="fin" type="number" step="any" inputmode="decimal" placeholder="${L('qty', 'объём')} (${esc(x.u)}) – ${L('left', 'осталось')} ${nf(rem(x))}"><input id="g2dt" class="fin" type="date" value="${iso(Date.now())}">
      <select id="g2s" class="fin"><option value="D">${L('Day shift', 'Дневная смена')}</option><option value="N">${L('Night shift', 'Ночная смена')}</option></select><input id="g2m" class="fin" type="number" inputmode="numeric" placeholder="${L('men', 'чел.')}"></div>
      <input id="g2r" class="fin" placeholder="${L('remark / hold point (optional)', 'примечание (необязательно)')}"><button class="tile main" style="min-height:auto;width:100%" onclick="G2.add('${esc(acc)}')"><b>${L('Save', 'Сохранить')}</b><span class="n">👷 ${esc(who() || L('set your name first', 'сначала имя'))}</span></button></div>` : `<div class="card"><div class="kv">${L('Not RHI scope (company', 'Не объём RHI (компания')} ${esc(x.co)}).</div></div>`}
     ${st.e.filter(e => e.acc === acc).map(e => `<div class="li"><div class="m"><div class="t">${ds(e.t)} · ${e.s === 'N' ? L('night', 'ночь') : L('day', 'день')} · ${nf(e.q)} ${esc(x.u)}${e.m ? ' · ' + e.m + ' ' + L('men', 'чел.') : ''}</div><div class="s">${esc(e.by || '')}${e.r ? ' · ' + esc(e.r) : ''}${e.sent ? ' · ✔ ' + L('sent', 'отправлено') : ''}</div></div>${e.sent ? '' : `<span class="tg" style="padding:8px 10px" onclick="G2.del(${e.t})">✕</span>`}</div>`).join('')}`; }
  G2.add = function (acc) { if (!who()) return askPName(`G2.add('${acc}')`); const q = Number(document.getElementById('g2q').value); if (!(q > 0)) { if (window.toast) toast(L('Enter a quantity', 'Введите объём')); return; }
    const x = G2.by[acc]; if (x && tot(x) + q > x.q * 1.0001 && !confirm(L('This is more than the IWP quantity left. Save anyway?', 'Больше остатка по IWP. Сохранить?'))) return;
    const d = isoTs(document.getElementById('g2dt').value); const st = G2.st(); let t = d; while (st.e.some(e => e.t === t)) t++;
    st.e.push({acc, t, q, s: document.getElementById('g2s').value, m: Number(document.getElementById('g2m').value) || 0, r: document.getElementById('g2r').value.trim(), by: who(), sent: 0});
    G2.save(); if (window.toast) toast(L('Saved', 'Сохранено')); route(); };
  G2.del = function (t) { const st = G2.st(); const i = st.e.findIndex(e => e.t === t && !e.sent); if (i < 0) return; if (!confirm(L('Delete this entry?', 'Удалить запись?'))) return; st.e.splice(i, 1); G2.save(); route(); };
  function daily() { const st = G2.st(); setHead(L('Daily entries', 'Ежедневные записи'), 'G2');
    return `<div class="card"><div class="kv">${L('Add progress on the IWP line page (title → work group → access ID). Tray lines are entered in the tray menu. Unsent entries can be deleted with ✕.', 'Объём вводится на странице строки IWP. Лотки – в меню лотков. Неотправленную запись можно удалить ✕.')}</div></div>
     <button class="tile main" style="min-height:auto;width:100%;margin-bottom:8px" onclick="G2.report()"><b>📤 ${L('Send report to Paul', 'Отправить отчёт Паулю')} · ${pend()}</b><span class="n">${L('G2 MAX progress group', 'группа прогресса G2 в MAX')}</span></button>
     <div class="list">${st.e.slice().sort((a, b) => b.t - a.t).map(e => { const x = G2.by[e.acc] || {}; return `<button class="li" onclick="go('#/g2/i/${enc(e.acc)}')"><div class="m"><div class="t">${ds(e.t)} · ${e.s === 'N' ? L('night', 'ночь') : L('day', 'день')} · ID ${esc(e.acc)} · ${nf(e.q)} ${esc(x.u || '')}${e.m ? ' · ' + e.m + ' ' + L('men', 'чел.') : ''}</div><div class="s">${esc(x.tag || x.c || '')} · ${esc(e.by || '')}${e.sent ? ' · ✔ ' + L('sent', 'отправлено') : ' · <b style="color:#c55a11">' + L('not sent', 'не отправлено') + '</b>'}</div></div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">' + L('No entries yet', 'Записей нет') + '</div>'}</div>`; }
  // ---------- report to Paul (G2 + tray together) ----------
  const HDR = ['Access ID', 'Qty', 'Unit', 'Date', 'Shift', 'Men', 'Title', 'Item / Позиция', 'By', 'Remark'].join('\t');
  const ln = (e, x) => [e.acc, nf(e.q).replace(/ /g, ''), x.u || x.unit || '', ds(e.t), e.s === 'N' ? 'Night/Ночь' : 'Day/День', e.m || '', x.t || 'G2-B1301FX0', x.tag || x.c || x.en || '', e.by || '', e.r || ''].join('\t');
  G2.report = function () { if (!who()) return askPName('G2.report()');
    const E = G2.st().e.filter(e => !e.sent).sort((a, b) => a.t - b.t); const TE = window.TY && TY.d ? TY.st().e.filter(e => !e.sent).sort((a, b) => a.t - b.t) : [];
    if (!E.length && !TE.length) return modalP(`<div class="h3">${L('Nothing new to report', 'Нет новых строк')}</div><p style="font-size:14px">${L('All entries are already sent.', 'Все записи уже отправлены.')}</p><button class="tile" style="width:100%;min-height:auto" onclick="closeP()">${L('Close', 'Закрыть')}</button>`);
    const by = [...new Set(E.concat(TE).map(e => e.by).filter(Boolean))].join(', ') || who();
    const rows = E.map(e => ln(e, G2.by[e.acc] || {})).concat(TE.map(e => ln(e, Object.assign({}, G2.by[e.acc] || {}, TY.by[e.acc] || {}))));
    G2.REP = {text: `Reported by / Отчёт: ${by} · ${nowS()}\nG2 scope (Train 2) progress – RHI (${rows.length} lines) / Прогресс G2\n${HDR}\n` + rows.join('\n'), E, TE};
    modalP(`<div class="h3">${L('Progress report → MAX progress group', 'Отчёт о прогрессе → группа MAX')}</div><textarea id="rtx" class="fin" style="height:200px;font:12px monospace;white-space:pre" readonly>${esc(G2.REP.text)}</textarea>
     <button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="G2.sendRep(1)"><b>📤 ${L('Send report to Paul', 'Отправить Паулю')}</b><span class="n">${L('copies the text and opens the MAX group – then paste & send', 'копирует текст и открывает группу MAX – вставьте и отправьте')}</span></button>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="copyText(G2.REP.text).then(ok=>toast(ok?'${L('Copied for Paul', 'Скопировано')}':'${L('Select the text and copy', 'Выделите и скопируйте')}'))"><b>📋 ${L('Copy', 'Копировать')}</b></button>
     <button class="tile" style="min-height:auto" onclick="G2.shareRep(1)"><b>↗ ${L('Share…', 'Поделиться…')}</b></button></div>
     <div style="font-size:12px;color:var(--mut);margin-top:8px">${L('After you open the group, the lines are marked as sent and will not be sent again.', 'После открытия группы строки отмечаются как отправленные.')}</div>`); };
  function markSent() { const R = G2.REP; if (!R) return; const now = Date.now(); (R.E || []).forEach(e => e.sent = now); const st = G2.st(); st.last = R.text; st.lastT = nowS(); G2.save();
    if (R.TE && R.TE.length && window.TY) { R.TE.forEach(e => e.sent = now); const ts = TY.st(); ts.last = R.text; ts.lastT = nowS(); TY.save(); } R.E = []; R.TE = []; }
  G2.sendRep = async function (mark) { const ok = await copyText(G2.REP.text); const url = typeof maxTo === 'function' ? maxTo(MAX_G2, G2.REP.text) : MAX_G2; if (mark) markSent();
    toast(ok ? L('Copied ✓ – in MAX press and hold, Paste, Send', 'Скопировано ✓ – в MAX вставьте и отправьте') : L('Copy the text, then paste in MAX', 'Скопируйте текст и вставьте в MAX')); setTimeout(() => { window.location.href = url; }, 600); closeP(); route(); };
  G2.shareRep = function (mark) { if (navigator.share) navigator.share({text: G2.REP.text}).then(() => { if (mark) markSent(); closeP(); route(); }).catch(() => {}); else copyText(G2.REP.text).then(() => toast(L('Copied', 'Скопировано'))); };
  G2.rd = function (k, v) { G2['_' + k] = v; route(); };
  function repBox(text) { G2.REP = {text, E: [], TE: []}; return `<textarea id="rtx" class="fin" style="height:300px;font:12px monospace;white-space:pre" readonly>${esc(text)}</textarea>
     <button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="G2.sendRep(0)"><b>📤 ${L('Send to Paul', 'Отправить Паулю')}</b><span class="n">${L('copies the text and opens the G2 MAX progress group', 'копирует текст и открывает группу G2 в MAX')}</span></button>
     <button class="tile" style="min-height:auto;width:100%" onclick="copyText(G2.REP.text).then(ok=>toast(ok?'${L('Copied', 'Скопировано')}':'${L('Select the text and copy', 'Выделите и скопируйте')}'))"><b>📋 ${L('Copy', 'Копировать')}</b></button>`; }
  function repPage(k) { const st = G2.st();
    if (k === 'last') { setHead(L('Last report sent', 'Последний отчёт'), st.lastT || ''); return st.last ? repBox(st.last) : '<div class="empty">' + L('No report sent yet', 'Отчётов ещё нет') + '</div>'; }
    if (k === 'day') { const day = G2._day || iso(Date.now()); const dd = ds(isoTs(day)); setHead(L('Daily report', 'Дневной отчёт'), dd);
      const E = st.e.filter(e => ds(e.t) === dd), TE = window.TY && TY.d ? TY.st().e.filter(e => ds(e.t) === dd) : [];
      const rows = E.map(e => ln(e, G2.by[e.acc] || {})).concat(TE.map(e => ln(e, Object.assign({}, G2.by[e.acc] || {}, TY.by[e.acc] || {}))));
      return `<input type="date" class="fin" value="${day}" onchange="G2.rd('day',this.value)">` + (rows.length ? repBox(`G2 scope daily report / Дневной отчёт G2 · ${dd} (${rows.length} lines)\n${HDR}\n` + rows.join('\n')) : '<div class="empty">' + L('No entries on this date', 'Нет записей за эту дату') + '</div>'); }
    setHead(L('Progress status', 'Статус прогресса'), 'G2 · IWP ' + G2.d.iwpdate); const R = G2.I;
    const lines = [`G2 scope progress status / Статус прогресса G2 · ${nowS()} · all lines (IWP ${G2.d.iwpdate} + site entries)`, ''];
    Object.keys(G2.d.titles).forEach(t => { const X = R.filter(x => x.t === t), s = lineStat(X); lines.push(`${t} – ${s.d}/${s.n} done (${pc(s.d, s.n)}%), ${s.p} in progress`);
      Object.keys(CAT).forEach(k => { const Y = X.filter(x => cat(x.g) === k); if (!Y.length) return; const z = lineStat(Y); lines.push(`   ${CAT[k][1]}: ${z.d}/${z.n}, ${z.p} in progress`); }); });
    return repBox(lines.join('\n')); }
  // ---------- materials (SF) ----------
  const mrfBtn = n => { const f = (G2.d.mrfFiles || {})[n]; return f ? `<a class="tile main" style="display:block;width:100%;min-height:auto;margin-bottom:8px;text-decoration:none" href="mrf/g2/${f}" download><b>⬇ ${L('Export MRF – Excel with signatures', 'Скачать MRF – Excel с подписями')}</b><span class="n">${esc(f)} · ${L('MRF form + gate pass + IWP ID request for Burak · MRF No and date blank', 'форма MRF + пропуск + запрос IWP ID Бураку · № и дата не заполнены')}</span></a>` : `<div class="card"><div class="kv">${L('No MRF for this drawing – nothing in stock to request (short items go to TQ).', 'MRF по этому чертежу нет – на складе нечего запросить (дефицит – через TQ).')}</div></div>`; };
  function matPage(f) { const q0 = String(f || ''); const flt = q0.startsWith('!') ? q0.slice(1) : ''; const doc = !flt && q0 ? q0 : '';
    const M = G2.M || []; const pick = m => flt === 'resv' ? (m.st === 'resv' || !!m.resv) : flt === 'mrf' ? (m.st === 'mrf' || m.st === 'part') : flt === 'short' ? (m.st === 'short' || m.st === 'part' || m.st === 'nowh') : true;
    if (!doc) { setHead(flt === 'resv' ? L('Reserved on MRF – collect from WH', 'Резерв по MRF') : flt === 'mrf' ? L('Need MRF – stock in warehouse', 'Нужен MRF – есть на складе') : flt === 'short' ? L('No stock – TQ / STF', 'Нет на складе – TQ / STF') : L('Material by SF drawing', 'Материалы по SF'), 'G2 · ' + M.length + ' ' + L('items', 'позиций'));
      const X = M.filter(pick), docs = [...new Set(X.map(m => m.sf))];
      return `<div class="card"><div class="kv">${L('SF (material list) drawings vs warehouse EP-3 / EP-12 and MRF follow-up. Heat tracing, fire-water and HVAC mechanical items are not in our scope. The MRF workbook (one MRF per SF drawing, with gate passes) is made in Excel – MRF No and date left blank.', 'Спецификации SF против склада EP-3 / EP-12 и учёта MRF. Электрообогрев, водяное пожаротушение и ОВиК – не наш объём. MRF (по одному на SF, с пропусками) – в Excel, № и дата MRF не заполняются.')}</div>
        ${G2.d.mrfAll ? `<a class="tile main" style="display:block;width:100%;min-height:auto;margin-top:8px;text-decoration:none" href="mrf/g2/${G2.d.mrfAll}" download><b>⬇ ${L('All G2 MRFs – one Excel (MRF follow-up + Burak IWP sheet + MRFs with signatures + gate passes)', 'Все MRF G2 – один Excel (с подписями и пропусками)')}</b><span class="n">${Object.keys(G2.d.mrfFiles || {}).length} MRF · ${L('MRF No and date blank – fill N4 / N5', '№ и дата MRF не заполнены – N4 / N5')}</span></a>` : ''}
        <a class="tile" style="display:block;width:100%;min-height:auto;margin-top:8px;text-decoration:none" href="mrf/g2/IWP_ID_request_Burak_G2_17.11.2026.xlsx" download><b>⬇ ${L('IWP ID request – Burak Karatas (Excel)', 'Запрос IWP ID – Бурак Каратаc (Excel)')}</b><span class="n">${L('all MRF lines · yellow column for IWP ID · send to Burak', 'все строки MRF · жёлтый столбец для IWP ID · отправить Бураку')}</span></a>
        <div class="chips" style="margin-top:6px"><button class="chip ${flt ? '' : 'on'}" onclick="go('#/g2/m/')">${L('All', 'Все')}</button><button class="chip ${flt === 'mrf' ? 'on' : ''}" onclick="go('#/g2/m/'+enc('!mrf'))">${L('Need MRF', 'Нужен MRF')}</button><button class="chip ${flt === 'short' ? 'on' : ''}" onclick="go('#/g2/m/'+enc('!short'))">${L('No stock', 'Нет на складе')}</button></div></div>
        <div class="list">${docs.map(d => { const Y = X.filter(m => m.sf === d), Ya = M.filter(m => m.sf === d), r = Ya.filter(m => m.st === 'rec').length;
          return `<button class="li" onclick="go('#/g2/m/'+enc('${esc(d)}'))"><div class="m"><div class="t">📦 ${esc(sfShort(d))}</div><div class="s">${esc(d)} · ${Y.length} ${L('items', 'позиций')} · ${r}/${Ya.length} ${L('received on MRF', 'получено по MRF')} · ${Ya.filter(m => m.nw > 0).length} ${L('new MRF lines', 'строк нового MRF')}${(G2.d.mrfFiles || {})[sfShort(d)] ? ' · ⬇ MRF' : ''}</div></div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">' + L('Nothing found', 'Ничего не найдено') + '</div>'}</div>`; }
    setHead('📦 ' + sfShort(doc), doc); const Y = M.filter(m => m.sf === doc); const O = {short: 0, part: 1, mrf: 2, nowh: 3, unit: 4, cable: 5, resv: 6, rec: 7};
    return `${mrfBtn(sfShort(doc))}<div class="list">${Y.slice().sort((a, b) => (O[a.st] || 0) - (O[b.st] || 0)).map(m => `<div class="li"><div class="m"><div class="t">${esc(RU ? m.ru : m.en)}</div><div class="s">${esc(m.id)} · SF ${nf(m.q)} ${esc(m.u)}${m.rec ? ' · ' + L('received', 'получено') + ' ' + nf(m.rec) : ''}${m.nw ? ' · <b>' + L('new MRF', 'новый MRF') + ' ' + nf(m.nw) + '</b>' : ''}${m.sh ? ' · <b style="color:#b42318">' + L('short', 'дефицит') + ' ' + nf(m.sh) + '</b>' : ''}${m.mrf ? ' · ' + esc(m.mrf) : ''}${m.resv ? '<br>🔒 ' + L('Reserved', 'Резерв') + ': ' + esc(m.resv) : ''}</div></div><span class="badge ${MST[m.st][1]}">${MST[m.st][0]}</span></div>`).join('')}</div>`; }
  // ---------- drawings register ----------
  const DL = id => 'https://drive.google.com/file/d/' + id + '/view';
  const SB = {have: [L('in hand', 'есть'), 'b-ok'], old: [L('old rev in hand', 'старая рев.'), 'b-na'], no: [L('not in hand', 'нет'), 'b-no']};
  const NEED = {Must: L('Must – IWP', 'Обязательно – IWP'), 'Must for MRF': L('Must for MRF (SF)', 'Для MRF (SF)'), 'Must (typical)': L('Typical', 'Типовой'), Useful: L('Useful', 'Полезно')};
  const dbtn = x => { const inner = `<div class="m"><div class="t">📄 ${esc(x.doc)} · rev ${esc(x.rev)}</div><div class="s">${esc(RU ? x.sysru || x.ru : x.sys || x.en)} · ${esc(RU ? x.kindru : x.kind)} · ${NEED[x.need] || esc(x.need)}${x.iwp ? ' · ' + x.iwp + ' IWP' : ''}${x.have && x.st !== 'have' ? ' · ' + L('have rev', 'есть рев.') + ' ' + esc(x.have) : ''}</div></div><span class="badge ${SB[x.st][1]}">${SB[x.st][0]}</span>`;
    return x.fid ? `<a class="li" href="${DL(x.fid)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">${inner}</a>` : `<div class="li">${inner}</div>`; };
  function dwgs(f) { const q0 = String(f || ''), miss = q0 === '!miss', q = miss ? '' : q0.toLowerCase(); setHead(miss ? L('Drawings we still need', 'Нужные чертежи') : L('Drawings register · G2', 'Реестр чертежей · G2'), 'MDR ' + G2.d.date);
    let X = G2.D; if (miss) X = X.filter(x => x.st !== 'have' && x.need !== 'Useful'); if (q) X = X.filter(x => (x.doc + ' ' + x.en + ' ' + x.ru + ' ' + x.sys).toLowerCase().includes(q));
    const T = [...new Set(X.map(x => x.t))];
    return `<div class="card"><div class="kv">${G2.D.filter(x => x.st === 'have').length} ${L('of', 'из')} ${G2.D.length} ${L('drawings in hand (PDF in the Drive folder). Latest revision from the MDR. Red = please send the PDF.', 'чертежей есть (PDF в папке Drive). Последняя ревизия – по MDR. Красный – прислать PDF.')}</div>
      <input class="search" style="width:100%;margin-top:6px" placeholder="${L('search drawing number / system', 'поиск номера / системы')}" value="${esc(q)}" onchange="go('#/g2/dw/'+enc(this.value))">
      <div class="chips" style="margin-top:6px"><button class="chip ${miss || q ? '' : 'on'}" onclick="go('#/g2/dw/')">${L('All', 'Все')}</button><button class="chip ${miss ? 'on' : ''}" onclick="go('#/g2/dw/'+enc('!miss'))">${L('Still needed', 'Нужно получить')}</button><a class="chip" href="https://drive.google.com/drive/folders/${G2.d.dfolder}" target="_blank" rel="noopener">📁 ${L('Open Drive folder', 'Открыть папку Drive')}</a></div></div>
     ${T.map(t => { const Y = X.filter(x => x.t === t); return `<div class="sect">${esc(t)}${G2.d.titles[t] ? ' · ' + esc(tName(t)) : ''} · ${Y.filter(x => x.st === 'have').length}/${Y.length}</div><div class="list">${Y.map(dbtn).join('')}</div>`; }).join('') || '<div class="empty">' + L('Nothing found', 'Ничего не найдено') + '</div>'}`; }
  G2.load();
})();
