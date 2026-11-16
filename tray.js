// v4.73: TRAY INSTALLATION – G2-B1301FX0 (Demethanizer Area, Train 2) – own main menu like CCR / D48.
// Manager mail 16.11.2026: cable trays and support profiles first, day + night; Team A trays where supports are ready, Team B supports / profiles.
// Scope: GLE-(G2-B1301FX0)-IN-ATHP-SF-001 rev 03 AS02 + EL-EMSV-SF-001 rev 03. Data: tray.json (IWP lines with EN/RU/TR component names and the
// typical per access ID; material from the stock check EP-3/EP-12 13.11.2026 + RHI MRF follow-up + warehouse issue records).
// Reports: progress to Paul (MAX progress group, same as CCR), daily, weekly, progress status, material/MRF, CTQ, Excel (CSV) export.
// Rebuild data: /home/claude/tray/build_json2.py (same model as G2-B1301FX0_Tray_Progress_Followup_<date>.xlsx and the MRF workbook).
(function () {
  const TY = window.TY = {d: null};
  const DC = 'appdata-v1', KEY = 'tray_g2_v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  const obj = (K, r) => { const o = {}; K.forEach((k, i) => o[k] = r[i]); return o; };
  function set(d) { if (!d || !Array.isArray(d.iwp)) return; const first = !TY.d; TY.d = d; TY.I = d.iwp.map(r => obj(d.IK, r)); TY.M = d.mat.map(r => obj(d.MK, r));
    TY.by = {}; TY.I.forEach(x => { x.en = x.en || x.tag; x.ru = x.ru || x.tag; x.tr = x.tr || ''; TY.by[x.acc] = x; });
    const n = document.getElementById('tytile'); if (n) n.innerHTML = TY.tile();
    const h = location.hash.replace(/^#\/?/, '').replace(/[?&]p=[^&]*$/i, '');
    if (first && (/^ty(\/|$)/.test(h) || (h === '' && TY.mine())) && typeof route === 'function') { try { route(); } catch (e) {} } }
  TY.load = function () { cget('tray.json').then(d => { if (d) set(d); return net('tray.json'); }).then(d => { if (d && (!TY.d || d.ver !== TY.d.ver)) set(d); }).catch(() => {}); };
  TY.mine = () => typeof PRJ !== 'undefined' && PRJ === 'G2-B1301FX0';
  // ---------- site entries (this phone) ----------
  TY.st = function () { if (TY._s) return TY._s; let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} TY._s = s && s.e ? s : {e: [], sup: {}};
    TY._s.e.forEach(e => { if (!e.t) { const p = String(e.d || '').split('.'); e.t = p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0], 12).getTime() : Date.now(); } if (e.sent === 1) e.sent = e.t; }); return TY._s; };
  TY.save = function () { try { localStorage.setItem(KEY, JSON.stringify(TY._s)); } catch (e) {} };
  const p2 = n => String(n).padStart(2, '0');
  const ds = ts => { const t = new Date(ts); return `${p2(t.getDate())}.${p2(t.getMonth() + 1)}.${t.getFullYear()}`; };
  const iso = ts => { const t = new Date(ts); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`; };
  const isoTs = v => { const p = String(v || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() : Date.now(); };
  const nowS = () => { const t = new Date(); return ds(t) + ' ' + p2(t.getHours()) + ':' + p2(t.getMinutes()); };
  const who = () => (typeof PS_ !== 'undefined' && PS_.name) || '';
  const doneSite = acc => TY.st().e.filter(x => x.acc === acc).reduce((a, x) => a + x.q, 0);
  const total = x => x.fact + doneSite(x.acc);
  const rem = x => Math.max(0, x.qty - total(x));
  const pc = (a, b) => b > 0 ? Math.min(100, Math.round(100 * a / b)) : 0;
  const stOf = x => total(x) >= x.qty && x.qty > 0 ? 'Completed' : total(x) > 0 ? 'In progress' : (TY.st().sup[x.acc] === 'N' && x.team === 'A' ? 'Waiting supports' : 'Not started');
  const STL = {Completed: L('Completed', 'Выполнено'), 'In progress': L('In progress', 'В работе'), 'Not started': L('Not started', 'Не начато'), 'Waiting supports': L('Waiting supports', 'Ждёт опоры')};
  const TEAM = {A: [L('Team A – trays', 'Бригада A – лотки'), '#1a73e8', 'A – Trays / Лотки / Tavalar'], B: [L('Team B – supports / profiles', 'Бригада B – опоры / профили'), '#b54708', 'B – Supports / Опоры / Destekler'], C: [L('Team C – conduits', 'Бригада C – трубы'), '#5b2a86', 'C – Conduits / Трубы / Borular']};
  const WT0 = {profile: ['Support profiles', 'Профили опор', 'Destek profilleri'], bracket: ['Cantilever brackets', 'Консоли', 'Konsollar'], steel: ['Small steel structure', 'Мелкие металлоконструкции', 'Küçük çelik yapı'],
    straight: ['Tray / ladder – straight', 'Прямые лотки', 'Düz tava'], fitting: ['Tray / ladder – fittings', 'Фасонные элементы', 'Tava bağlantı parçaları'], cover: ['Covers', 'Крышки', 'Kapaklar'],
    strip: ['Separation strip', 'Перегородка', 'Ayırıcı'], conduit: ['Flexible conduit', 'Гибкая труба', 'Esnek boru']};
  const WT = {}; Object.keys(WT0).forEach(k => WT[k] = [L(WT0[k][0], WT0[k][1]), WT0[k].join(' / ')]);
  const STC = {Completed: 'b-ok', 'In progress': 'b-na', 'Not started': '', 'Waiting supports': 'b-no'};
  const MST = {covered: [L('Received on earlier MRF', 'Получено по MRF'), 'b-ok'], mrf: [L('MRF ready – stock OK', 'MRF готов – склад есть'), 'b-na'], part: [L('MRF ready – part short', 'MRF – частично'), 'b-no'],
    ctq: [L('No free stock – CTQ', 'Нет на складе – CTQ'), 'b-no'], nodel: [L('Not delivered – CTQ', 'Не поставлено – CTQ'), 'b-no'], len: [L('Pipe length to confirm', 'Уточнить длину трубы'), 'b-no']};
  const nf = v => fmtn(Math.round(v * 100) / 100);
  const comp = x => RU ? x.ru : x.en;
  const comp3 = x => `${esc(comp(x))}<div style="font-size:11px;color:var(--mut)">${esc(RU ? x.en : x.ru)} · ${esc(x.tr)}</div>`;
  TY.sum = function () { if (!TY.d) return L('loading…', 'загрузка…'); const I = TY.I; const dn = I.filter(x => stOf(x) === 'Completed').length;
    const c = k => TY.M.filter(m => m.st === k).length; const pend = TY.st().e.filter(e => !e.sent).length;
    return `${dn}/${I.length} ${L('IWP lines done', 'строк IWP выполнено')} · MRF ${c('mrf') + c('part')} · CTQ ${c('ctq') + c('nodel')}${pend ? ' · ' + pend + ' ' + L('not sent', 'не отправлено') : ''}`; };
  TY.tile = function () { if (TY.mine()) return '';
    if (!TY.d) return `<button class="tile main" style="min-height:auto;width:100%;margin-bottom:8px;background:#0b6e6e;border-color:#0b6e6e;color:#fff" onclick="go('#/ty')"><b>🧱 ${L('TRAY INSTALLATION – G2-B1301FX0', 'МОНТАЖ ЛОТКОВ – G2-B1301FX0')}</b><span class="n" style="color:#d8f0f0">${L('loading…', 'загрузка…')}</span></button>`;
    const pend = TY.st().e.filter(e => !e.sent).length; const bar = (lab, d, n, col) => `<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin-top:4px"><span style="width:92px;white-space:nowrap;overflow:hidden">${lab}</span><div style="flex:1;height:7px;background:rgba(255,255,255,.25);border-radius:4px"><div style="width:${pc(d, n)}%;height:7px;background:${col};border-radius:4px"></div></div><span style="width:62px;text-align:right">${d}/${n}</span></div>`;
    const B = (h, txt, bg) => `<button onclick="event.stopPropagation();${h}" style="flex:1;border:0;border-radius:8px;padding:9px 4px;font:600 12px inherit;color:#fff;background:${bg}">${txt}</button>`;
    const c = k => TY.M.filter(m => m.st === k).length;
    return `<div onclick="go('#/ty')" style="cursor:pointer;background:linear-gradient(135deg,#0b6e6e,#13959a);color:#fff;border-radius:14px;padding:12px 14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.25)">
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">🧱 ${L('TRAY INSTALLATION · G2-B1301FX0', 'МОНТАЖ ЛОТКОВ · G2-B1301FX0')}</b><span style="font-size:20px">›</span></div>
      <div style="font-size:12px;opacity:.9">${L('Main work now · open tray menu', 'Основная работа сейчас · открыть меню лотков')} · MRF ${c('mrf') + c('part')} · CTQ ${c('ctq') + c('nodel')}</div>
      ${['A', 'B', 'C'].map(t => { const s = teamStat(t); return bar({A: L('A · trays', 'A · лотки'), B: L('B · supports', 'B · опоры'), C: L('C · conduits', 'C · трубы')}[t], s.d, s.n, t === 'A' ? '#8ecbff' : t === 'B' ? '#ffc58a' : '#d7b8ff'); }).join('')}
      <div style="display:flex;gap:6px;margin-top:10px">${B('TY.report()', `📤 ${L('Report to Paul', 'Отчёт Паулю')}${pend ? ' · ' + pend : ''}`, pend ? '#c55a11' : 'rgba(0,0,0,.28)')}${B("go('#/ty/l/A')", `✍️ ${L('Entry', 'Ввод')}`, 'rgba(0,0,0,.28)')}${B("go('#/ty/rp/day')", `📊 ${L('Reports', 'Отчёты')}`, 'rgba(0,0,0,.28)')}</div></div>`; };
  // ---------- routing ----------
  TY.route = function (rest) { const k = rest[0] || '', a = dec(rest.slice(1).join('/'));
    if (!TY.d) { main.innerHTML = '<div class="empty">Loading…</div>'; TY.load(); return; }
    const W = '<div data-nt>', E = '</div>';
    const R = {l: list, i: line, m: mats, mi: matItem, ctq, tp: typs, d: daily, r: reports, rp: repPage, dw: dwgs}[k];
    const h = R ? R(a) : home(); if (typeof h === 'string') main.innerHTML = W + h + E; };
  const T2 = (h, b, n, p, cls, sty) => `<button class="tile ${cls || ''}" style="${sty || ''}" onclick="${h.startsWith('#') ? `go('${h}')` : h}"><b>${b}</b><div><span class="n">${n}</span>${p != null ? `<div class="pc">${p}%</div><div class="pbar"><i style="width:${p}%"></i></div>` : ''}</div></button>`;
  function teamStat(t) { const I = TY.I.filter(x => !t || x.team === t); return {n: I.length, d: I.filter(x => stOf(x) === 'Completed').length, ip: I.filter(x => stOf(x) === 'In progress').length}; }
  function wtStat(k) { const I = TY.I.filter(x => x.wt === k); return {q: I.reduce((a, x) => a + x.qty, 0), f: I.reduce((a, x) => a + Math.min(total(x), x.qty), 0), u: (I[0] || {}).unit || '', n: I.length}; }
  // ---------- main menu ----------
  function home() { const d = TY.d; setHead(L('Tray G2-B1301FX0', 'Лотки G2-B1301FX0') + ' · GPP E&I', `v${typeof APPV !== 'undefined' ? APPV : ''} · ${L('data', 'данные')} ${d.date} · ATHP-SF + EMSV-SF`);
    const st = TY.st(); const pend = st.e.filter(e => !e.sent).length; const all = teamStat(); const c = k => TY.M.filter(m => m.st === k).length;
    const s1 = wtStat('straight'), s2 = wtStat('profile');
    return `${TY.mine() && typeof projBar === 'function' ? projBar() : ''}
     <div style="background:linear-gradient(135deg,#0b6e6e,#13959a);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px"><div style="font-size:17px;font-weight:700">🧱 ${L('Cable tray installation · G2-B1301FX0', 'Монтаж кабельных лотков · G2-B1301FX0')}</div><div style="font-size:12px;opacity:.92">${L('Demethanizer Area, Train 2 · two teams, day + night · cable trays and support profiles first', 'Деметанизация, линия 2 · две бригады, день + ночь · сначала лотки и профили опор')}</div></div>
     <div class="kpi"><div><b>${all.n}</b><span>${L('IWP lines', 'строк IWP')}</span></div><div><b style="color:var(--ok)">${pc(all.d, all.n)}%</b><span>${L('lines done', 'выполнено')}</span></div><div><b>${pc(s1.f, s1.q)}%</b><span>${L('straight tray', 'прямые лотки')}</span></div><div><b>${pc(s2.f, s2.q)}%</b><span>${L('profiles', 'профили')}</span></div></div>
     <button class="tile main" style="width:100%;min-height:auto;margin-bottom:4px;background:${pend ? '#c55a11' : 'var(--pri)'};border-color:${pend ? '#c55a11' : 'var(--pri)'}" onclick="TY.report()"><b>📤 ${L('Send report to Paul', 'Отправить отчёт Паулю')} · ${pend} ${L('new tray progress lines', 'новых строк прогресса')}</b><span class="n">👷 ${esc(who() || L('tap to set your name', 'укажите имя'))} · ${L('MAX progress group', 'группа прогресса MAX')}</span></button>
     <div class="sect">🏗️ ${L('Construction', 'Монтаж')}</div><div class="grid">
      ${['A', 'B', 'C'].map(t => { const s = teamStat(t); return T2('#/ty/l/' + t, `${TEAM[t][0]}`, `${s.d}/${s.n} ${L('lines done', 'выполнено')} · ${s.ip} ${L('in progress', 'в работе')}`, pc(s.d, s.n), 'main'); }).join('')}
      ${T2('#/ty/l/', L('All IWP lines · search', 'Все строки IWP · поиск'), `${all.n} ${L('access IDs', 'access ID')}`)}
      ${T2('#/ty/d', L('✍️ Daily entry list', '✍️ Ежедневные записи'), `${st.e.length} ${L('entries', 'записей')} · ${pend} ${L('not sent', 'не отправлено')}`)}</div>
     <div class="sect">📤 ${L('Reports', 'Отчёты')}</div><div class="grid">
      ${T2('#/ty/rp/day', L('📅 Daily report', '📅 Дневной отчёт'), L('pick a date · all lines · men per team', 'дата · все строки · люди по бригадам'), null, 'main')}
      ${T2('#/ty/rp/week', L('🗓 Weekly report', '🗓 Недельный отчёт'), L('7 days · qty by work type and team', '7 дней · объём по видам работ'), null, 'main')}
      ${T2('#/ty/rp/status', L('📊 Progress status', '📊 Статус прогресса'), L('by team · work type · drawing', 'по бригадам · видам работ · чертежам'), null, 'main')}
      ${T2('#/ty/rp/mat', L('📦 Material & MRF report', '📦 Материалы и MRF'), `${c('mrf') + c('part')} MRF · ${c('ctq') + c('nodel')} CTQ`, null, 'main')}
      ${T2('#/ty/rp/ctq', L('⚠️ CTQ material report', '⚠️ CTQ по материалам'), L('no free stock – for the client', 'нет на складе – для заказчика'))}
      ${T2('TY.csv()', L('⬇ Excel export (CSV)', '⬇ Экспорт в Excel (CSV)'), L('for the Daily Entry sheet', 'для листа Daily Entry'))}
      ${T2('#/ty/rp/last', L('↩ Last report sent', '↩ Последний отчёт'), st.lastT ? esc(st.lastT) : L('none yet', 'ещё нет'))}</div>
     <div class="sect">📦 ${L('Materials', 'Материалы')}</div><div class="grid">
      ${T2('#/ty/m/mrf', L('📝 MRF ready – stock OK', '📝 MRF готов – склад есть'), `${c('mrf')} + ${c('part')} ${L('part', 'частично')}`, null, 'main')}
      ${T2('#/ty/ctq', L('⚠️ No stock – CTQ', '⚠️ Нет на складе – CTQ'), `${c('ctq') + c('nodel') + c('part')} ${L('items', 'позиций')}`, null, 'main')}
      ${T2('#/ty/m/rec', L('✅ Received on MRF', '✅ Получено по MRF'), `${TY.M.filter(m => m.rec).length} ${L('items · who / when', 'позиций · кто / когда')}`)}
      ${T2('#/ty/m/', L('🗂 All tray material', '🗂 Все материалы'), `${TY.M.length} ${L('idents · SF vs stock', 'идентов · SF и склад')}`)}</div>
     <div class="sect">📐 ${L('Documents', 'Документы')}</div><div class="grid">
      ${T2('#/ty/tp', L('📐 Typicals to follow', '📐 Типовые узлы'), 'GLE-(G0-Z00000X0)-EL-ZX-002 rev 04')}
      ${T2('#/ty/dw/', L('📄 Drawings register (Drive)', '📄 Реестр чертежей (Drive)'), (d.dwgs || []).filter(x => x[4]).length + ' ' + L('current · tap to open PDF', 'действующих · открыть PDF'), null, 'main')}</div>
     <div class="sect">🏭 ${L('Whole title G2-B1301FX0', 'Весь титул G2-B1301FX0')}</div><div class="grid">
      ${T2('#/axh', L('Cables · IWP · punch list (all disciplines)', 'Кабели · IWP · панч-лист (все)'), L('client master punch list 14.11.2026', 'мастер панч-лист 14.11.2026'))}</div>
     <div class="foot">${esc(d.note || '')}<br>${L('MRF forms (signatures, gate pass, IWP request for Burak): ', 'Формы MRF: ')}${esc(d.mrffile || '')}</div>`; }
  // ---------- lists ----------
  function list(f) { const [t, q0] = String(f || '').split('|'); setHead(t ? TEAM[t][0] : L('IWP lines', 'Строки IWP'), 'G2-B1301FX0');
    let I = TY.I.filter(x => !t || x.team === t); const q = (q0 || '').toLowerCase();
    if (q) I = I.filter(x => (x.acc + ' ' + x.tag + ' ' + x.en + ' ' + x.ru + ' ' + x.tr + ' ' + x.dwg + ' ' + x.iwp).toLowerCase().includes(q));
    const O = {'In progress': 0, 'Not started': 1, 'Waiting supports': 2, Completed: 3};
    I = I.slice().sort((a, b) => O[stOf(a)] - O[stOf(b)] || a.wt.localeCompare(b.wt) || a.tag.localeCompare(b.tag));
    return `<input class="search" style="width:100%;margin-bottom:8px" placeholder="${L('search access ID / item / drawing', 'поиск access ID / позиции / чертежа')}" value="${esc(q0 || '')}" onchange="go('#/ty/l/'+enc('${t || ''}|'+this.value))">
     <div class="list">${I.map(x => `<button class="li" onclick="go('#/ty/i/${enc(x.acc)}')"><div class="m"><div class="t">${comp3(x)}</div><div class="s">ID ${esc(x.acc)} · IWP -${esc(x.iwp.split('-').pop())} · ${nf(total(x))}/${nf(x.qty)} ${esc(x.unit)} · ${esc(x.typ.join(', '))}</div></div><span class="badge ${STC[stOf(x)]}">${STL[stOf(x)]}</span><span class="chev">›</span></button>`).join('') || '<div class="empty">' + L('Nothing found', 'Ничего не найдено') + '</div>'}</div>`; }
  function line(acc) { const x = TY.by[acc]; if (!x) return home(); const st = TY.st(); setHead('ID ' + acc, x.tag);
    const T = TY.d.typ; const sup = st.sup[acc] || '';
    return `<div class="card"><div class="h3">${esc(x.en)}</div><div style="font-size:13px">${esc(x.ru)}<br>${esc(x.tr)}</div><div style="font-size:11px;color:var(--mut);margin:4px 0">IWP tag: ${esc(x.tag)}</div>
      <div class="kv"><b>${L('Team', 'Бригада')}</b> ${TEAM[x.team][0]}<br><b>IWP</b> ${esc(x.iwp)}<br><b>${L('Item', 'Тип')}</b> ${esc(x.map)} · BoQ ${esc(x.boq)}<br><b>${L('Drawing', 'Чертёж')}</b> ${esc(x.dwg)} rev ${esc(x.rev)}<br>${TY.dwgFor(x.dwg).concat(TY.dwgFor(x.dwg.replace('-SF-', '-ZA-')), TY.dwgFor(x.dwg.replace('-SF-', '-'))).filter((v, i, a) => a.findIndex(z => z[5] === v[5]) === i).map(z => `<a href="${DL(z[5])}" target="_blank" rel="noopener" style="display:inline-block;margin:3px 4px 3px 0;padding:4px 8px;border-radius:12px;background:#e3f1f1;color:#0b6e6e;font-size:12px;text-decoration:none">📄 ${esc(z[1].replace('GLE-(G2-B1301FX0)-', ''))} ${esc(z[2])}</a>`).join('')}<br>
      <b>${L('Planned', 'План')}</b> ${nf(x.qty)} ${esc(x.unit)} · <b>${L('IWP done', 'По IWP')}</b> ${nf(x.fact)} · <b>${L('Site entry', 'Ввод')}</b> ${nf(doneSite(acc))} · <b>${L('Left', 'Осталось')}</b> ${nf(rem(x))}<br><b>${L('Responsible (IWP)', 'Ответственный')}</b> ${esc(x.resp)}</div></div>
     <div class="sect">📐 ${L('Typical to follow', 'Типовой узел')}</div><div class="card">${x.typ.map(k => `<div style="margin-bottom:6px"><b>GLE-(G0-Z00000X0)-EL-${esc(k)}</b><br>${esc((T[k] || ['', ''])[RU ? 1 : 0] || (T[k] || ['', ''])[1] || '')}</div>`).join('')}${TY.dwgFor(x.typ.some(k => /ZX-001/.test(k)) ? 'GLE-(G0-Z00000X0)-EL-ZX-001' : 'GLE-(G0-Z00000X0)-EL-ZX-002').concat(x.typ.some(k => /ZX-001/.test(k)) && x.typ.some(k => /ZX-002/.test(k)) ? TY.dwgFor('GLE-(G0-Z00000X0)-EL-ZX-002') : []).map(z => `<a href="${DL(z[5])}" target="_blank" rel="noopener" style="display:inline-block;margin:3px 0;padding:6px 10px;border-radius:8px;background:#0b6e6e;color:#fff;font-size:12px;text-decoration:none">📐 ${L('Open', 'Открыть')} ${esc(z[1].replace('GLE-(G0-Z00000X0)-EL-', ''))} rev ${esc(z[2])} (PDF)</a>`).join(' ')}<div style="font-size:12px;color:var(--mut)">${x.onref ? L('This sheet is referenced on the routing drawing.', 'Лист указан на чертеже трассы.') : L('Selected by item type – confirm on the routing drawing.', 'Выбран по типу – проверить на чертеже трассы.')}</div></div>
     ${x.team === 'A' ? `<div class="sect">${L('Supports at this front ready?', 'Опоры на этом участке готовы?')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile ${sup === 'Y' ? 'main' : ''}" style="min-height:auto" onclick="TY.sup('${esc(acc)}','Y')"><b>✅ ${L('Yes – Team A can work', 'Да – бригада A работает')}</b></button><button class="tile ${sup === 'N' ? 'main' : ''}" style="min-height:auto" onclick="TY.sup('${esc(acc)}','N')"><b>⏳ ${L('No – wait for Team B', 'Нет – ждём бригаду B')}</b></button></div>` : ''}
     <div class="sect">${L('Add progress', 'Добавить объём')}</div><div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><input id="tyq" class="fin" type="number" step="any" inputmode="decimal" placeholder="${L('qty', 'объём')} (${esc(x.unit)}) – ${L('left', 'осталось')} ${nf(rem(x))}"><input id="tydt" class="fin" type="date" value="${iso(Date.now())}">
      <select id="tys" class="fin"><option value="D">${L('Day shift', 'Дневная смена')}</option><option value="N">${L('Night shift', 'Ночная смена')}</option></select><input id="tym" class="fin" type="number" inputmode="numeric" placeholder="${L('men', 'чел.')}"></div>
      <input id="tyr" class="fin" placeholder="${L('remark / hold point (optional)', 'примечание (необязательно)')}"><button class="tile main" style="min-height:auto;width:100%" onclick="TY.add('${esc(acc)}')"><b>${L('Save', 'Сохранить')}</b><span class="n">👷 ${esc(who() || L('set your name first', 'сначала имя'))}</span></button></div>
     ${st.e.filter(e => e.acc === acc).map(e => `<div class="li"><div class="m"><div class="t">${ds(e.t)} · ${e.s === 'N' ? L('night', 'ночь') : L('day', 'день')} · ${nf(e.q)} ${esc(x.unit)}${e.m ? ' · ' + e.m + ' ' + L('men', 'чел.') : ''}</div><div class="s">${esc(e.by || '')}${e.r ? ' · ' + esc(e.r) : ''}${e.sent ? ' · ✔ ' + L('sent', 'отправлено') : ''}</div></div>${e.sent ? '' : `<span class="tg" style="padding:8px 10px" onclick="TY.del(${e.t})">✕</span>`}</div>`).join('')}`; }
  TY.sup = function (acc, v) { const st = TY.st(); st.sup[acc] = v; TY.save(); route(); };
  TY.add = function (acc) { if (!who()) return askPName(`TY.add('${acc}')`); const q = Number(document.getElementById('tyq').value); if (!(q > 0)) { if (window.toast) toast(L('Enter a quantity', 'Введите объём')); return; }
    const x = TY.by[acc]; if (x && total(x) + q > x.qty * 1.0001 && !confirm(L('This is more than the BoQ quantity left. Save anyway?', 'Больше остатка по BoQ. Сохранить?'))) return;
    const d = isoTs(document.getElementById('tydt').value); const st = TY.st(); let t = d; while (st.e.some(e => e.t === t)) t++;
    st.e.push({acc, t, d: ds(d), q, s: document.getElementById('tys').value, m: Number(document.getElementById('tym').value) || 0, r: document.getElementById('tyr').value.trim(), by: who(), sent: 0});
    TY.save(); if (window.toast) toast(L('Saved', 'Сохранено')); route(); };
  TY.del = function (t) { const st = TY.st(); const i = st.e.findIndex(e => e.t === t && !e.sent); if (i < 0) return; if (!confirm(L('Delete this entry?', 'Удалить запись?'))) return; st.e.splice(i, 1); TY.save(); route(); };
  function daily() { const st = TY.st(); setHead(L('Daily entries', 'Ежедневные записи'), 'G2-B1301FX0');
    return `<div class="card"><div class="kv">${L('Add progress on the IWP line page (team list → access ID). Unsent entries can be deleted with ✕.', 'Объём вводится на странице строки IWP. Неотправленную запись можно удалить ✕.')}</div></div>
     <button class="tile main" style="min-height:auto;width:100%;margin-bottom:8px" onclick="TY.report()"><b>📤 ${L('Send report to Paul', 'Отправить отчёт Паулю')} · ${st.e.filter(e => !e.sent).length}</b><span class="n">${L('MAX progress group', 'группа прогресса MAX')}</span></button>
     <div class="list">${st.e.slice().sort((a, b) => b.t - a.t).map(e => { const x = TY.by[e.acc] || {}; return `<button class="li" onclick="go('#/ty/i/${enc(e.acc)}')"><div class="m"><div class="t">${ds(e.t)} · ${e.s === 'N' ? L('night', 'ночь') : L('day', 'день')} · ID ${esc(e.acc)} · ${nf(e.q)} ${esc(x.unit || '')}${e.m ? ' · ' + e.m + ' ' + L('men', 'чел.') : ''}</div><div class="s">${esc(x.en ? comp(x) : '')} · ${esc(e.by || '')}${e.sent ? ' · ✔ ' + L('sent', 'отправлено') : ' · <b style="color:#c55a11">' + L('not sent', 'не отправлено') + '</b>'}</div></div><span class="chev">›</span></button>`; }).join('') || '<div class="empty">' + L('No entries yet', 'Записей нет') + '</div>'}</div>`; }
  // ---------- reports ----------
  const ln = e => { const x = TY.by[e.acc] || {}; return [e.acc, nf(e.q).replace(/ /g, ''), x.unit || '', ds(e.t), e.s === 'N' ? 'Night/Ночь' : 'Day/День', e.m || '', x.en || '', x.ru || '', e.by || '', e.r || ''].join('\t'); };
  const HDR = ['Access ID', 'Qty', 'Unit', 'Date', 'Shift', 'Men', 'Component', 'Компонент', 'By', 'Remark'].join('\t');
  function progText(E) { const by = [...new Set(E.map(e => e.by).filter(Boolean))].join(', ') || who();
    return `Reported by / Отчёт: ${by} · ${nowS()}\nG2-B1301FX0 cable tray progress – RHI (${E.length} lines) / Прогресс монтажа лотков\n${HDR}\n` + E.map(ln).join('\n'); }
  TY.report = function () { if (!who()) return askPName('TY.report()'); const st = TY.st(); const E = st.e.filter(e => !e.sent).sort((a, b) => a.t - b.t);
    if (!E.length) return modalP(`<div class="h3">${L('Nothing new to report', 'Нет новых строк')}</div><p style="font-size:14px">${L('All entries are already sent.', 'Все записи уже отправлены.')}</p>${st.last ? `<button class="tile" style="width:100%;min-height:auto" onclick="closeP();go('#/ty/rp/last')">${L('Show last sent report again', 'Показать последний отчёт')}</button>` : ''}<button class="tile" style="width:100%;min-height:auto;margin-top:8px" onclick="closeP()">${L('Close', 'Закрыть')}</button>`);
    TY.REP = {text: progText(E), E}; repModal(L('Progress report → MAX progress group', 'Отчёт о прогрессе → группа MAX'), true); };
  function repModal(title, mark) {
    modalP(`<div class="h3">${title}</div><textarea id="rtx" class="fin" style="height:200px;font:12px monospace;white-space:pre" readonly>${esc(TY.REP.text)}</textarea>
     <button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="TY.sendRep(${mark ? 1 : 0})"><b>📤 ${L('Send report to Paul', 'Отправить Паулю')}</b><span class="n">${L('copies the text and opens the MAX group – then paste & send', 'копирует текст и открывает группу MAX – вставьте и отправьте')}</span></button>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="copyText(TY.REP.text).then(ok=>toast(ok?'${L('Copied for Paul', 'Скопировано')}':'${L('Select the text and copy', 'Выделите и скопируйте')}'))"><b>📋 ${L('Copy', 'Копировать')}</b></button>
     <button class="tile" style="min-height:auto" onclick="TY.shareRep(${mark ? 1 : 0})"><b>↗ ${L('Share…', 'Поделиться…')}</b></button></div>
     ${mark ? `<div style="font-size:12px;color:var(--mut);margin-top:8px">${L('After you open the group, the lines are marked as sent and will not be sent again.', 'После открытия группы строки отмечаются как отправленные.')}</div>` : ''}`); }
  function markSent() { const R = TY.REP; if (!R || !R.E || !R.E.length) return; const now = Date.now(); const st = TY.st(); R.E.forEach(e => e.sent = now); st.last = R.text; st.lastT = nowS(); TY.save(); R.E = []; }
  TY.sendRep = async function (mark) { const ok = await copyText(TY.REP.text); const url = typeof maxTo === 'function' ? maxTo(MAX_PROG, TY.REP.text) : MAX_PROG; if (mark) markSent();
    toast(ok ? L('Copied ✓ – in MAX press and hold, Paste, Send', 'Скопировано ✓ – в MAX вставьте и отправьте') : L('Copy the text, then paste in MAX', 'Скопируйте текст и вставьте в MAX')); setTimeout(() => { window.location.href = url; }, 600); closeP(); route(); };
  TY.shareRep = function (mark) { if (navigator.share) navigator.share({text: TY.REP.text}).then(() => { if (mark) markSent(); closeP(); route(); }).catch(() => {}); else copyText(TY.REP.text).then(() => toast(L('Copied', 'Скопировано'))); };
  function reports() { return home(); }
  function repBox(text, title) { TY.REP = {text, E: []};
    return `<textarea id="rtx" class="fin" style="height:300px;font:12px monospace;white-space:pre" readonly>${esc(text)}</textarea>
     <button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="TY.sendRep(0)"><b>📤 ${L('Send to Paul', 'Отправить Паулю')}</b><span class="n">${L('copies the text and opens the MAX progress group', 'копирует текст и открывает группу MAX')}</span></button>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile" style="min-height:auto" onclick="copyText(TY.REP.text).then(ok=>toast(ok?'${L('Copied', 'Скопировано')}':'${L('Select the text and copy', 'Выделите и скопируйте')}'))"><b>📋 ${L('Copy', 'Копировать')}</b></button><button class="tile" style="min-height:auto" onclick="TY.shareRep(0)"><b>↗ ${L('Share…', 'Поделиться…')}</b></button></div>`; }
  TY.rd = function (k, v) { TY['_' + k] = v; route(); };
  function repPage(k) { const st = TY.st(); const E = st.e;
    if (k === 'last') { setHead(L('Last report sent', 'Последний отчёт'), st.lastT || ''); return st.last ? repBox(st.last) : '<div class="empty">' + L('No report sent yet', 'Отчётов ещё нет') + '</div>'; }
    if (k === 'day') { const day = TY._day || iso(Date.now()); const dd = ds(isoTs(day)); setHead(L('Daily report', 'Дневной отчёт'), dd);
      const D = E.filter(e => ds(e.t) === dd).sort((a, b) => (a.s > b.s) - (a.s < b.s) || a.t - b.t);
      const men = s => D.filter(e => e.s === s).reduce((a, e) => a + (e.m || 0), 0);
      const tm = t => D.filter(e => (TY.by[e.acc] || {}).team === t);
      let txt = `G2-B1301FX0 cable tray – daily report / Дневной отчёт / Günlük rapor · ${dd}\nRHI (Rencons) · ${L('by', 'от')} ${who()} · ${nowS()}\n`;
      txt += `Lines / Строк: ${D.length} · Men day / Люди день: ${men('D')} · Men night / Люди ночь: ${men('N')}\n`;
      ['A', 'B', 'C'].forEach(t => { const X = tm(t); if (X.length) txt += `\n${TEAM[t][2]} – ${X.length} lines, ${X.reduce((a, e) => a + (e.m || 0), 0)} men\n` + X.map(e => { const x = TY.by[e.acc] || {}; return `  ${e.s === 'N' ? 'N' : 'D'} · ID ${e.acc} · ${nf(e.q)} ${x.unit || ''} · ${x.en || ''} / ${x.ru || ''}${e.r ? ' · ' + e.r : ''}`; }).join('\n') + '\n'; });
      if (!D.length) txt += '\n' + L('No entries on this date.', 'Нет записей за эту дату.');
      return `<div class="card"><input class="fin" type="date" value="${day}" onchange="TY.rd('day',this.value)"></div>` + repBox(txt); }
    if (k === 'week') { const end = TY._wend || iso(Date.now()); const e1 = isoTs(end) + 12 * 3600e3, s1 = e1 - 7 * 86400e3; setHead(L('Weekly report', 'Недельный отчёт'), ds(s1 + 3600e3) + ' – ' + ds(e1 - 3600e3));
      const W = E.filter(e => e.t > s1 && e.t <= e1); const by = {}; W.forEach(e => { const x = TY.by[e.acc] || {}; const kk = (x.wt || '?') + '|' + (x.unit || ''); by[kk] = by[kk] || {q: 0, n: 0}; by[kk].q += e.q; by[kk].n++; });
      let txt = `G2-B1301FX0 cable tray – weekly report / Недельный отчёт / Haftalık rapor\n${ds(s1 + 3600e3)} – ${ds(e1 - 3600e3)} · RHI (Rencons) · ${who()}\n\nWork type / Вид работ\tQty\tUnit\tLines\tTotal done / BoQ\n`;
      Object.keys(WT).forEach(w => { const S = wtStat(w); const U = Object.entries(by).filter(([kk]) => kk.startsWith(w + '|')); const q = U.reduce((a, [, v]) => a + v.q, 0), n = U.reduce((a, [, v]) => a + v.n, 0);
        if (S.n) txt += `${WT[w][1]}\t${nf(q)}\t${S.u}\t${n}\t${nf(S.f)} / ${nf(S.q)} (${pc(S.f, S.q)}%)\n`; });
      txt += `\nTeam / Бригада\tLines\tMen-shifts\n` + ['A', 'B', 'C'].map(t => { const X = W.filter(e => (TY.by[e.acc] || {}).team === t); return `${TEAM[t][2]}\t${X.length}\t${X.reduce((a, e) => a + (e.m || 0), 0)}`; }).join('\n');
      return `<div class="card"><div class="kv">${L('Week ending', 'Неделя по')}</div><input class="fin" type="date" value="${end}" onchange="TY.rd('wend',this.value)"></div>` + repBox(txt); }
    if (k === 'status') { setHead(L('Progress status', 'Статус прогресса'), 'G2-B1301FX0'); const a = teamStat();
      let txt = `G2-B1301FX0 cable tray – progress status / Статус прогресса / İlerleme durumu · ${nowS()}\nIWP lines / Строк IWP: ${a.d}/${a.n} completed, ${a.ip} in progress\n\nTeam / Бригада\tDone\tIn progress\tLines\n`;
      txt += ['A', 'B', 'C'].map(t => { const s = teamStat(t); return `${TEAM[t][2]}\t${s.d}\t${s.ip}\t${s.n}`; }).join('\n');
      txt += `\n\nWork type / Вид работ\tDone\tBoQ\tUnit\t%\n` + Object.keys(WT).map(w => { const S = wtStat(w); return S.n ? `${WT[w][1]}\t${nf(S.f)}\t${nf(S.q)}\t${S.u}\t${pc(S.f, S.q)}%` : ''; }).filter(Boolean).join('\n');
      txt += `\n\nDrawing / Чертёж\tDone lines\tLines\n` + [...new Set(TY.I.map(x => x.dwg))].map(dw => { const X = TY.I.filter(x => x.dwg === dw); return `${dw}\t${X.filter(x => stOf(x) === 'Completed').length}\t${X.length}`; }).join('\n');
      const wait = TY.I.filter(x => stOf(x) === 'Waiting supports'); if (wait.length) txt += `\n\nWaiting supports / Ждут опоры: ${wait.length} – ` + wait.map(x => x.acc).join(', ');
      return repBox(txt); }
    if (k === 'mat') { setHead(L('Material & MRF report', 'Материалы и MRF'), TY.d.date); const c = s => TY.M.filter(m => m.st === s);
      let txt = `G2-B1301FX0 cable tray – material & MRF status / Материалы и MRF / Malzeme ve MRF · ${TY.d.date}\nSource: EP-3/EP-12 13.11.2026, RHI MRF follow-up, warehouse issue records\n`;
      txt += `MRF ready (stock OK) / MRF готов: ${c('mrf').length} · part / частично: ${c('part').length} · no stock CTQ / нет на складе: ${c('ctq').length + c('nodel').length} · received / получено: ${c('covered').length}\n\nMRF ready / MRF готов:\n`;
      txt += c('mrf').concat(c('part')).map(m => `  ${m.ident} · ${nf(m.newmrf)} ${m.whu}${m.short > 0 ? ' (short ' + nf(m.short) + ')' : ''} · ${m.en || m.ru}`).join('\n');
      const R = TY.M.filter(m => m.rec); if (R.length) txt += `\n\nReceived on MRF / Получено по MRF:\n` + R.map(m => `  ${m.ident} · ${m.rec}`).join('\n');
      return repBox(txt); }
    if (k === 'ctq') { setHead(L('CTQ material report', 'CTQ по материалам'), TY.d.date); const M = TY.M.filter(m => ['ctq', 'nodel', 'part', 'len'].includes(m.st));
      let txt = `G2-B1301FX0 cable tray – material without free stock / Материалы без свободного остатка / Serbest stok olmayan malzemeler\nRHI (Rencons) · ${TY.d.date} · ${M.length} items\n\nIdent\tStill needed (SF) / Требуется\tShort / Дефицит\tDescription (EN / RU)\n`;
      txt += M.map(m => `${m.ident}\t${nf(m.need)} ${m.unit}\t${m.st === 'part' ? nf(m.short) + ' ' + m.whu : nf(m.need) + ' ' + m.unit}\t${m.en || '-'} / ${m.ru}`).join('\n');
      return repBox(txt); }
    return home(); }
  TY.csv = function () { const st = TY.st(); const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [['Date', 'Shift', 'Team', 'Access ID', 'Component (EN / RU / TR)', 'Unit', 'Qty done', 'Men', 'Supervisor / by', 'Remarks', 'Sent']];
    st.e.slice().sort((a, b) => a.t - b.t).forEach(e => { const x = TY.by[e.acc] || {}; rows.push([ds(e.t), e.s === 'N' ? 'Night' : 'Day', (TEAM[x.team] || [])[2] || '', e.acc, [x.en, x.ru, x.tr].filter(Boolean).join(' / '), x.unit || '', e.q, e.m || '', e.by || '', e.r || '', e.sent ? ds(e.sent) : '']); });
    const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'G2-B1301FX0_tray_entries_' + iso(Date.now()) + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    if (window.toast) toast(L('Excel file saved – paste the rows into the Daily Entry sheet', 'Файл сохранён – вставьте строки в лист Daily Entry')); };
  // ---------- material ----------
  function mats(f) { setHead(L('Tray material', 'Материалы лотков'), 'SF · MRF · ' + L('warehouse', 'склад'));
    let M = TY.M; if (f === 'mrf') M = M.filter(m => m.st === 'mrf' || m.st === 'part'); if (f === 'rec') M = M.filter(m => m.rec);
    const cats = [...new Set(M.map(m => m.cat))];
    return cats.map(c => `<div class="sect">${esc(c)}</div><div class="list">${M.filter(m => m.cat === c).map(m => `<button class="li" onclick="go('#/ty/mi/${enc(m.ident)}')"><div class="m"><div class="t">${esc(m.ident)} · ${esc((RU ? m.ru : (m.en || m.ru)).slice(0, 80))}</div><div class="s">${f === 'rec' ? esc(m.rec) : `${L('need', 'нужно')} ${nf(m.need)} ${esc(m.unit)} · ${L('free stock', 'свободно')} ${nf(m.avail)} ${esc(m.whu)} · ${L('new MRF', 'новый MRF')} ${nf(m.newmrf)} ${esc(m.whu)}`}</div></div><span class="badge ${MST[m.st][1]}">${MST[m.st][0]}</span></button>`).join('')}</div>`).join('') || '<div class="empty">' + L('Nothing here', 'Пусто') + '</div>'; }
  function matItem(id) { const m = TY.M.find(z => z.ident === id); if (!m) return mats(); setHead(m.ident, m.cat);
    return `<div class="card"><div class="h3">${esc(m.ident)}</div><div style="font-size:13px"><b>RU</b> ${esc(m.ru)}<br><b>EN</b> ${esc(m.en || '-')}<br><b>TR</b> ${esc(m.tr || '-')}</div>
     <div class="kv" style="margin-top:6px"><b>SF</b> ${esc(m.dwg)}<br><b>${L('SF quantity', 'По SF')}</b> ${nf(m.req)} ${esc(m.unit)} · <b>${L('received earlier', 'получено')}</b> ${nf(m.done)} · <b>${L('still needed', 'ещё нужно')}</b> ${nf(m.need)}<br>
     <b>${L('Free stock (General/RHI)', 'Свободный остаток')}</b> ${nf(m.avail)} ${esc(m.whu)}<br><b>${L('New MRF', 'Новый MRF')}</b> ${nf(m.newmrf)} ${esc(m.whu)} · <b>${L('Short → CTQ', 'Дефицит → CTQ')}</b> ${nf(m.short)} ${esc(m.whu)}<br>
     ${m.rec ? `<b>${L('Received on MRF (No / qty / by / date)', 'Получено по MRF')}</b> ${esc(m.rec)}<br>` : ''}<span class="badge ${MST[m.st][1]}">${MST[m.st][0]}</span></div>
     <div style="font-size:12px;color:var(--mut);margin-top:6px">${L('Warehouse stock is shared with other titles. MRF forms with gate pass are in the MRF Excel.', 'Склад общий для проекта. Формы MRF с пропуском – в Excel.')}</div></div>`; }
  function ctq() { setHead(L('No stock – CTQ', 'Нет на складе – CTQ'), L('for the client', 'для заказчика')); const M = TY.M.filter(m => ['ctq', 'nodel', 'part', 'len'].includes(m.st));
    return `<button class="tile main" style="width:100%;min-height:auto;margin-bottom:8px" onclick="go('#/ty/rp/ctq')"><b>📤 ${L('CTQ material report', 'Отчёт CTQ по материалам')}</b><span class="n">${M.length} ${L('items', 'позиций')}</span></button>
     <div class="list">${M.map(m => `<button class="li" onclick="go('#/ty/mi/${enc(m.ident)}')"><div class="m"><div class="t">${esc(m.ident)} · ${L('short', 'не хватает')} ${nf(m.st === 'part' ? m.short : m.need)} ${esc(m.st === 'part' ? m.whu : m.unit)}</div><div class="s">${esc((RU ? m.ru : (m.en || m.ru)).slice(0, 90))}</div></div><span class="badge ${MST[m.st][1]}">${MST[m.st][0]}</span></button>`).join('')}</div>`; }
  function typs() { setHead(L('Typicals to follow', 'Типовые узлы'), 'EL-ZX-002 rev 04'); const T = TY.d.typ; const R = TY.d.refs;
    const used = {}; TY.I.forEach(x => x.typ.forEach(k => { used[k] = (used[k] || 0) + 1; }));
    return `<div class="card">${['GLE-(G0-Z00000X0)-EL-ZX-002', 'GLE-(G0-Z00000X0)-EL-ZX-001', 'GLE-(G0-Z00300X0)-EL-SD-012'].map(dn => TY.dwgFor(dn).map(dbtn).join('')).join('')}</div><div class="sect">${L('Used in this work (IWP lines)', 'Используются (строк IWP)')}</div><div class="list">${Object.keys(used).sort().map(k => `<div class="li"><div class="m"><div class="t">GLE-(G0-Z00000X0)-EL-${esc(k)} · ${used[k]}</div><div class="s">${esc((T[k] || ['', ''])[0])}<br>${esc((T[k] || ['', ''])[1])}</div></div></div>`).join('')}</div>
     ${Object.entries(R || {}).map(([f, v]) => `<div class="sect">${L('Referenced on', 'Указаны на')} ${esc(v[0])}</div><div class="card"><div class="kv">${v[1].map(z => esc(z[0]) + ' (' + z[1] + ')').join(' · ')}</div></div>`).join('')}`; }
  const DL = id => 'https://drive.google.com/file/d/' + id + '/view';
  const DG = {scope: [L('Tray scope – routing + SF (material list)', 'Объём лотков – трассы + SF'), '🧱'], typ: [L('Typicals', 'Типовые узлы'), '📐'], st: [L('Steel structures (racks / supports)', 'Металлоконструкции (эстакады / опоры)'), '🏗️'],
    ms: [L('Method statements / procedures', 'Методики / ППР'), '📘'], oth: [L('Other disciplines in this title (reference)', 'Другие разделы титула (справочно)'), '📎']};
  TY.dwgFor = function (doc) { const n = String(doc || '').replace(/-SF-/, '-').replace(/-ZA-/, '-'); return (TY.d.dwgs || []).filter(x => x[4] && (x[1] === doc || x[1].replace(/-SF-/, '-').replace(/-ZA-/, '-') === n)); };
  const dbtn = x => `<a class="li" href="${DL(x[5])}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="m"><div class="t">📄 ${esc(x[1])}</div><div class="s">rev ${esc(x[2])} · ${x[3] === 'RU' ? 'RU' : 'AL'}${x[4] ? '' : ' · <b style="color:#b42318">' + L('old revision', 'старая ревизия') + '</b>'}</div></div><span class="badge ${x[4] ? 'b-ok' : 'b-no'}">${x[4] ? L('current', 'действ.') : L('superseded', 'заменён')}</span></a>`;
  function dwgs(f) { const q = String(f || '').toLowerCase(); setHead(L('Tray drawings register', 'Реестр чертежей лотков'), 'Google Drive · TRAY_TRAIN1');
    let X = TY.d.dwgs || []; if (q && q !== 'all') X = X.filter(x => (x[1] + ' ' + x[6]).toLowerCase().includes(q));
    const showOld = q === 'all'; const cur = X.filter(x => x[4]).length;
    return `<div class="card"><div class="kv">${cur} ${L('current documents', 'действующих документов')} · ${(TY.d.dwgs || []).length} ${L('files in the Drive folder', 'файлов в папке Drive')}. ${L('Tap to open the PDF (internet needed).', 'Нажмите, чтобы открыть PDF (нужен интернет).')}</div>
      <input class="search" style="width:100%;margin-top:6px" placeholder="${L('search drawing number', 'поиск номера чертежа')}" value="${esc(q && q !== 'all' ? q : '')}" onchange="go('#/ty/dw/'+enc(this.value))">
      <div class="chips" style="margin-top:6px"><button class="chip ${showOld ? '' : 'on'}" onclick="go('#/ty/dw/')">${L('Current only', 'Только действующие')}</button><button class="chip ${showOld ? 'on' : ''}" onclick="go('#/ty/dw/all')">${L('Show old revisions too', 'Показать старые ревизии')}</button><a class="chip" href="https://drive.google.com/drive/folders/${TY.d.dfolder}" target="_blank" rel="noopener">📁 ${L('Open Drive folder', 'Открыть папку Drive')}</a></div></div>
     ${Object.keys(DG).map(g => { const Y = X.filter(x => x[0] === g && (showOld || q || x[4])); return Y.length ? `<div class="sect">${DG[g][1]} ${DG[g][0]} · ${Y.length}</div><div class="list">${Y.map(dbtn).join('')}</div>` : ''; }).join('')}`; }
  TY.load();
})();
