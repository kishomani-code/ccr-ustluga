// v4.72: TRAY INSTALLATION – G2-B1301FX0 (Demethanizer Area, Train 2). Manager mail 16.11.2026: cable trays and
// support profiles first, day + night; Team A installs trays where supports are ready, Team B makes / installs supports.
// Scope: GLE-(G2-B1301FX0)-IN-ATHP-SF-001 rev 03 AS02 + EL-EMSV-SF-001 rev 03. Data: tray.json (IWP lines with the
// typical to follow per access ID, SF material vs MRF vs warehouse, MRF drafts, CTQ list). Site entry kept on the phone.
// Rebuild: /home/claude/tray/data.py + build_json.py (same model as G2-B1301FX0_Tray_Followup_<date>.xlsx).
(function () {
  const TY = window.TY = {d: null};
  const DC = 'appdata-v1', KEY = 'tray_g2_v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  const obj = (K, r) => { const o = {}; K.forEach((k, i) => o[k] = r[i]); return o; };
  function set(d) { if (!d || !Array.isArray(d.iwp)) return; const first = !TY.d; TY.d = d; TY.I = d.iwp.map(r => obj(d.IK, r)); TY.M = d.mat.map(r => obj(d.MK, r));
    TY.by = {}; TY.I.forEach(x => TY.by[x.acc] = x);
    const n = document.getElementById('tyn'); if (n) n.innerHTML = TY.sum();
    if (first && (/^#\/ty(\/|$)/.test(location.hash) || !location.hash || location.hash === '#/') && typeof route === 'function') { try { route(); } catch (e) {} } }
  TY.load = function () { cget('tray.json').then(d => { if (d) set(d); return net('tray.json'); }).then(d => { if (d && (!TY.d || d.ver !== TY.d.ver)) set(d); }).catch(() => {}); };
  // ---------- site entry (this phone) ----------
  TY.st = function () { if (TY._s) return TY._s; let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} return (TY._s = s && s.e ? s : {e: [], sup: {}, sent: 0}); };
  TY.save = function () { try { localStorage.setItem(KEY, JSON.stringify(TY._s)); } catch (e) {} };
  const today = () => { const t = new Date(); const p = n => String(n).padStart(2, '0'); return `${p(t.getDate())}.${p(t.getMonth() + 1)}.${t.getFullYear()}`; };
  const doneSite = acc => TY.st().e.filter(x => x.acc === acc).reduce((a, x) => a + x.q, 0);
  const total = x => x.fact + doneSite(x.acc);
  const rem = x => Math.max(0, x.qty - total(x));
  const stOf = x => total(x) >= x.qty && x.qty > 0 ? 'Completed' : total(x) > 0 ? 'In progress' : (TY.st().sup[x.acc] === 'N' && x.team === 'A' ? 'Waiting supports' : 'Not started');
  const TEAM = {A: [L('Team A – trays', 'Бригада A – лотки'), '#1a73e8'], B: [L('Team B – supports / profiles', 'Бригада B – опоры / профили'), '#b54708'], C: [L('Team C – conduits', 'Бригада C – трубы'), '#5b2a86']};
  const STC = {Completed: 'b-ok', 'In progress': 'b-na', 'Not started': '', 'Waiting supports': 'b-no'};
  const MST = {covered: [L('Covered by MRF', 'Уже по MRF'), 'b-ok'], mrf: [L('New MRF – stock OK', 'Новый MRF – склад есть'), 'b-na'], part: [L('Part MRF – stock short', 'Частично – не хватает'), 'b-no'], ctq: [L('No free stock – CTQ', 'Нет на складе – CTQ'), 'b-no']};
  const nf = v => fmtn(Math.round(v * 10) / 10);
  TY.sum = function () { if (!TY.d) return L('loading…', 'загрузка…'); const I = TY.I; const dn = I.filter(x => stOf(x) === 'Completed').length;
    const c = k => TY.M.filter(m => m.st === k).length;
    return `${dn}/${I.length} ${L('IWP lines done', 'строк IWP выполнено')} · ${L('MRF ready', 'к MRF')} ${c('mrf') + c('part')} · CTQ ${c('ctq')}`; };
  TY.tile = function () { if (PRJ !== 'G2-B1301FX0' && PRJ !== 'CCR') return '';
    return `<button class="tile main" style="min-height:auto;width:100%;margin-bottom:6px;background:#0b6e6e;border-color:#0b6e6e;color:#fff" onclick="go('#/ty')"><b>🧱 ${L('TRAY INSTALLATION – G2-B1301FX0', 'МОНТАЖ ЛОТКОВ – G2-B1301FX0')}</b><span class="n" id="tyn" style="color:#d8f0f0">${TY.sum()}</span></button>`; };
  // ---------- pages ----------
  TY.route = function (rest) { const k = rest[0] || '', a = dec(rest.slice(1).join('/'));
    if (!TY.d) { main.innerHTML = '<div class="empty">Loading…</div>'; TY.load(); return; }
    if (k === 'l') return list(a); if (k === 'i') return line(a); if (k === 'm') return mats(a); if (k === 'mi') return matItem(a);
    if (k === 'mrf') return mrf(a); if (k === 'ctq') return ctq(); if (k === 'tp') return typs(); if (k === 'd') return daily(); return home(); };
  function teamBox(t) { const I = TY.I.filter(x => x.team === t); if (!I.length) return '';
    const byU = {}; I.forEach(x => { const u = x.unit || '-'; byU[u] = byU[u] || [0, 0]; byU[u][0] += x.qty; byU[u][1] += total(x); });
    const dn = I.filter(x => stOf(x) === 'Completed').length;
    return `<button class="li" onclick="go('#/ty/l/${t}')"><div class="m"><div class="t" style="color:${TEAM[t][1]}">${TEAM[t][0]} · ${dn}/${I.length} ${L('lines done', 'строк')}</div><div class="s">${Object.entries(byU).map(([u, v]) => `${nf(v[1])} / ${nf(v[0])} ${esc(u)} · ${L('left', 'осталось')} ${nf(v[0] - v[1])}`).join('<br>')}</div></div><span class="chev">›</span></button>`; }
  function home() { const d = TY.d; setHead(L('Tray G2-B1301FX0', 'Лотки G2-B1301FX0'), `${L('data', 'данные')} ${d.date} · ATHP-SF + EMSV-SF`);
    const c = k => TY.M.filter(m => m.st === k).length; const st = TY.st();
    const pend = st.e.filter(x => !x.sent).length;
    main.innerHTML = '<div data-nt>' + `<div style="background:linear-gradient(135deg,#0b6e6e,#13959a);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px"><div style="font-size:17px;font-weight:700">🧱 ${L('Cable tray installation · G2-B1301FX0', 'Монтаж кабельных лотков · G2-B1301FX0')}</div><div style="font-size:12px;opacity:.9">${esc(L(d.note, 'Письмо руководителя 16.11.2026: сначала лотки и опорные профили, день + ночь; бригада A – лотки на готовые опоры, бригада B – изготовление и монтаж опор.'))}</div><div style="font-size:11px;opacity:.8;margin-top:4px">${d.scope.map(esc).join(' · ')}</div></div>
     <div class="sect">${L('Progress by team (IWP + site entry)', 'Прогресс по бригадам (IWP + ввод)')}</div><div class="list">${['A', 'B', 'C'].map(teamBox).join('')}</div>
     <div class="sect">${L('Material', 'Материалы')}</div><div class="list">
      <button class="li" onclick="go('#/ty/m/mrf')"><div class="m"><div class="t">📦 ${L('New MRF – stock available', 'Новый MRF – склад есть')} · ${c('mrf')} + ${L('part', 'частично')} ${c('part')}</div><div class="s">${L('raise now – stock is shared with other titles', 'оформить сейчас – склад общий')}</div></div><span class="chev">›</span></button>
      <button class="li" onclick="go('#/ty/ctq')"><div class="m"><div class="t">⚠️ ${L('No free stock – CTQ to client', 'Нет на складе – CTQ заказчику')} · ${c('ctq') + c('part')}</div><div class="s">${L('do not plan these fronts until delivery is confirmed', 'не планировать до подтверждения поставки')}</div></div><span class="chev">›</span></button>
      <button class="li" onclick="go('#/ty/m/')"><div class="m"><div class="t">🗂 ${L('All tray material', 'Все материалы лотков')} · ${TY.M.length}</div><div class="s">${L('required (SF) · MRF · warehouse · status', 'потребность · MRF · склад · статус')}</div></div><span class="chev">›</span></button>
      <button class="li" onclick="go('#/ty/mrf')"><div class="m"><div class="t">📝 ${L('MRF drafts by material', 'Проекты MRF по материалам')}</div><div class="s">${[...new Set(TY.M.filter(m => m.newmrf > 0).map(m => m.sheet))].join(' · ')}</div></div><span class="chev">›</span></button></div>
     <div class="sect">${L('Site', 'Площадка')}</div><div class="list">
      <button class="li" onclick="go('#/ty/d')"><div class="m"><div class="t">✍️ ${L('Daily entry / report', 'Ежедневный ввод / отчёт')} · ${st.e.length} ${L('entries', 'записей')}${pend ? ` · <b style="color:#c55a11">${pend} ${L('not sent', 'не отправлено')}</b>` : ''}</div><div class="s">${L('qty per access ID, day / night shift, men', 'объём по access ID, смена, люди')}</div></div><span class="chev">›</span></button>
      <button class="li" onclick="go('#/ty/tp')"><div class="m"><div class="t">📐 ${L('Typicals to follow', 'Типовые узлы')}</div><div class="s">GLE-(G0-Z00000X0)-EL-ZX-002 rev 04 · ${L('referenced on the routing drawings', 'ссылки на чертежах трасс')}</div></div><span class="chev">›</span></button></div>` + '</div>'; }
  function list(f) { const [t, q0] = String(f || '').split('|'); setHead(t ? TEAM[t][0] : L('IWP lines', 'Строки IWP'), 'G2-B1301FX0');
    let I = TY.I.filter(x => !t || x.team === t); const q = (q0 || '').toLowerCase();
    if (q) I = I.filter(x => (x.acc + ' ' + x.tag + ' ' + x.map + ' ' + x.dwg).toLowerCase().includes(q));
    I = I.slice().sort((a, b) => ({'In progress': 0, 'Not started': 1, 'Waiting supports': 2, Completed: 3}[stOf(a)] - {'In progress': 0, 'Not started': 1, 'Waiting supports': 2, Completed: 3}[stOf(b)]) || a.map.localeCompare(b.map));
    main.innerHTML = '<div data-nt>' + `<input class="search" style="width:100%;margin-bottom:8px" placeholder="${L('search access ID / item', 'поиск access ID / позиции')}" value="${esc(q0 || '')}" onchange="go('#/ty/l/'+enc('${t || ''}|'+this.value))">
     <div class="list">${I.map(x => `<button class="li" onclick="go('#/ty/i/${enc(x.acc)}')"><div class="m"><div class="t">${esc(x.tag)}</div><div class="s">ID ${esc(x.acc)} · ${esc(x.map)} · ${nf(total(x))}/${nf(x.qty)} ${esc(x.unit)} · ${esc(x.typ.join(', '))}</div></div><span class="badge ${STC[stOf(x)]}" data-nt>${esc(stOf(x))}</span><span class="chev">›</span></button>`).join('') || '<div class="empty">–</div>'}</div>` + '</div>'; }
  function line(acc) { const x = TY.by[acc]; if (!x) return home(); const st = TY.st(); setHead('ID ' + acc, x.tag);
    const T = TY.d.typ; const sup = st.sup[acc] || '';
    main.innerHTML = '<div data-nt>' + `<div class="card"><div class="h3">${esc(x.tag)}</div><div class="kv"><b>${L('Team', 'Бригада')}</b> ${TEAM[x.team][0]}<br><b>IWP</b> ${esc(x.iwp)}<br><b>${L('Item', 'Тип')}</b> ${esc(x.map)} · BoQ ${esc(x.boq)}<br><b>${L('Drawing', 'Чертёж')}</b> ${esc(x.dwg)} rev ${esc(x.rev)}<br>
      <b>${L('Planned', 'План')}</b> ${nf(x.qty)} ${esc(x.unit)} · <b>${L('IWP done', 'По IWP')}</b> ${nf(x.fact)} · <b>${L('Site entry', 'Ввод')}</b> ${nf(doneSite(acc))} · <b>${L('Left', 'Осталось')}</b> ${nf(rem(x))}<br><b>${L('Responsible (IWP)', 'Ответственный')}</b> ${esc(x.resp)} ${x.comp ? '· ' + esc(x.comp) : ''}</div></div>
     <div class="sect">📐 ${L('Typical to follow', 'Типовой узел')}</div><div class="card">${x.typ.map(k => `<div style="margin-bottom:6px"><b>GLE-(G0-Z00000X0)-EL-${esc(k)}</b><br>${esc((T[k] || ['', ''])[RU ? 1 : 0] || (T[k] || [''])[0])}</div>`).join('')}<div style="font-size:12px;color:var(--mut)">${x.onref ? L('This sheet is referenced on the routing drawing.', 'Лист указан на чертеже трассы.') : L('Chosen by item type – check the section / detail on the routing drawing before installation.', 'Выбран по типу – проверить разрез / узел на чертеже трассы.')}</div></div>
     ${x.team === 'A' ? `<div class="sect">${L('Supports at this front ready?', 'Опоры на этом участке готовы?')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="tile ${sup === 'Y' ? 'main' : ''}" style="min-height:auto" onclick="TY.sup('${esc(acc)}','Y')"><b>✅ ${L('Yes – Team A', 'Да – бригада A')}</b></button><button class="tile ${sup === 'N' ? 'main' : ''}" style="min-height:auto" onclick="TY.sup('${esc(acc)}','N')"><b>⛔ ${L('No – Team B first', 'Нет – сначала бригада B')}</b></button></div>` : ''}
     <div class="sect">${L('Add progress', 'Добавить объём')}</div><div class="card"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px"><input id="tyq" type="number" step="any" placeholder="${L('qty', 'объём')} (${esc(x.unit)})"><select id="tys"><option value="D">${L('Day', 'День')}</option><option value="N">${L('Night', 'Ночь')}</option></select><input id="tym" type="number" placeholder="${L('men', 'чел.')}"></div><input id="tyr" style="width:100%;margin-top:6px" placeholder="${L('remark / delay reason', 'примечание / причина')}"><button class="tile main" style="min-height:auto;width:100%;margin-top:6px" onclick="TY.add('${esc(acc)}')"><b>➕ ${L('Save', 'Сохранить')}</b></button></div>
     ${st.e.filter(e => e.acc === acc).map(e => `<div class="li"><div class="m"><div class="t">${esc(e.d)} · ${e.s === 'N' ? L('night', 'ночь') : L('day', 'день')} · ${nf(e.q)} ${esc(x.unit)}${e.m ? ' · ' + e.m + ' ' + L('men', 'чел.') : ''}</div><div class="s">${esc(e.r || '')}${e.sent ? ' · ✔ ' + L('sent', 'отправлено') : ''}</div></div></div>`).join('')}` + '</div>'; }
  TY.sup = function (acc, v) { const st = TY.st(); st.sup[acc] = v; TY.save(); line(acc); };
  TY.add = function (acc) { const q = Number(document.getElementById('tyq').value); if (!(q > 0)) { if (window.toast) toast(L('Enter a quantity', 'Введите объём')); return; }
    const st = TY.st(); st.e.push({acc, d: today(), q, s: document.getElementById('tys').value, m: Number(document.getElementById('tym').value) || 0, r: document.getElementById('tyr').value.trim(), sent: 0}); TY.save(); line(acc); };
  function daily() { const st = TY.st(); setHead(L('Daily entry / report', 'Ежедневный ввод / отчёт'), 'G2-B1301FX0');
    const pend = st.e.filter(e => !e.sent);
    const txt = ['G2-B1301FX0 tray – ' + today(), ...pend.map(e => { const x = TY.by[e.acc] || {}; return `ID ${e.acc} · ${x.tag || ''} · ${e.s === 'N' ? 'night' : 'day'} · ${nf(e.q)} ${x.unit || ''}${e.m ? ' · ' + e.m + ' men' : ''}${e.r ? ' · ' + e.r : ''}`; })].join('\n');
    main.innerHTML = '<div data-nt>' + `<div class="card"><div class="kv">${L('Add progress from the IWP line page (tap a line in the team list).', 'Ввод объёма – на странице строки IWP.')}</div></div>
     <div class="sect">${L('Not sent', 'Не отправлено')} · ${pend.length}</div><textarea id="rtx" style="width:100% + '</div>';height:180px">${esc(txt)}</textarea>
     <button class="tile main" style="min-height:auto;width:100%;margin-top:6px" onclick="TY.send()"><b>📤 ${L('Copy report and mark as sent', 'Скопировать отчёт и отметить')}</b></button>
     <div class="sect">${L('All entries', 'Все записи')} · ${st.e.length}</div><div class="list">${st.e.slice().reverse().map(e => { const x = TY.by[e.acc] || {}; return `<button class="li" onclick="go('#/ty/i/${enc(e.acc)}')"><div class="m"><div class="t">${esc(e.d)} · ID ${esc(e.acc)} · ${nf(e.q)} ${esc(x.unit || '')}</div><div class="s">${esc(x.tag || '')} ${e.sent ? '· ✔' : ''}</div></div></button>`; }).join('') || '<div class="empty">–</div>'}</div>`; }
  TY.send = async function () { const t = document.getElementById('rtx').value; const ok = await copyText(t); const st = TY.st(); st.e.forEach(e => e.sent = 1); TY.save(); if (window.toast) toast(ok ? L('Copied – paste in MAX', 'Скопировано – вставьте в MAX') : L('Select the text and copy', 'Выделите и скопируйте')); daily(); };
  function mats(f) { setHead(L('Tray material', 'Материалы лотков'), 'SF · MRF · ' + L('warehouse', 'склад'));
    let M = TY.M; if (f === 'mrf') M = M.filter(m => m.st === 'mrf' || m.st === 'part');
    const cats = [...new Set(M.map(m => m.cat))];
    main.innerHTML = '<div data-nt>' + cats.map(c => `<div class="sect">${esc(c)}</div><div class="list">${M.filter(m => m.cat === c).map(m => `<button class="li" onclick="go('#/ty/mi/${enc(m.ident)}')"><div class="m"><div class="t">${esc(m.ident)} · ${esc(m.desc.slice(0, 70))}</div><div class="s">${L('need', 'нужно')} ${nf(m.req)} ${esc(m.unit)} · MRF ${nf(m.mrfq)} · ${L('free stock', 'свободно')} ${nf(m.avail)} · ${L('new MRF', 'новый MRF')} ${nf(m.newmrf)}</div></div><span class="badge ${MST[m.st][1]}" data-nt>${MST[m.st][0]}</span></button>`).join('')}</div>`).join('') + '</div>'; }
  function matItem(id) { const m = TY.M.find(z => z.ident === id); if (!m) return mats(); setHead(m.ident, m.cat);
    main.innerHTML = '<div data-nt>' + `<div class="card"><div class="h3">${esc(m.desc)}</div><div class="kv"><b>${L('Warehouse name', 'На складе')}</b> ${esc(m.wh || '—')}<br><b>SF</b> ${esc(m.pos)}<br><b>${L('Required', 'Требуется')}</b> ${nf(m.req)} ${esc(m.unit)}<br><b>${L('Already on MRF', 'Уже по MRF')}</b> ${nf(m.mrfq)} ${esc(m.mrfno)}<br><b>${L('Warehouse stock / reserved / free', 'Склад / резерв / свободно')}</b> ${nf(m.stock)} / ${nf(m.res)} / ${nf(m.avail)}<br><b>${L('New MRF now', 'Новый MRF сейчас')}</b> ${nf(m.newmrf)} · <b>${L('Short after MRF', 'Дефицит')}</b> ${nf(m.short)}<br><span class="badge ${MST[m.st][1]}" data-nt>${MST[m.st][0]}</span></div><div style="font-size:12px;color:var(--mut);margin-top:6px">${L('Warehouse stock is for the whole project. Check the warehouse item matches the SF size before issue.', 'Склад общий для проекта. Проверить соответствие размера по SF.')}</div></div>` + '</div>'; }
  function mrf(sh) { const S = [...new Set(TY.M.filter(m => m.newmrf > 0).map(m => m.sheet))]; setHead(L('MRF drafts', 'Проекты MRF'), 'G2-B1301FX0');
    if (!sh) { main.innerHTML = '<div data-nt>' + `<div class="list">${S.map(s => { const M = TY.M.filter(m => m.sheet === s && m.newmrf > 0) + '</div>'; return `<button class="li" onclick="go('#/ty/mrf/${enc(s)}')"><div class="m"><div class="t">${esc(s)} · ${M.length} ${L('lines', 'строк')}</div><div class="s">${esc(M[0].cat)}</div></div><span class="chev">›</span></button>`; }).join('')}</div><div class="card"><div class="kv">${L('MRF No. and date are left blank. IWP only from the IWP list (drawing + BoQ); if missing, message Burak Karatas. Full forms are in the Excel follow-up.', 'Номер и дата MRF – пусто. IWP – только по списку IWP; если нет – сообщить Burak Karatas. Полные формы – в Excel.')}</div></div>`; return; }
    const M = TY.M.filter(m => m.sheet === sh && m.newmrf > 0);
    main.innerHTML = '<div data-nt>' + `<div class="list">${M.map((m, i) => `<div class="li"><div class="m"><div class="t">${i + 1}. ${esc(m.ident)} · <b>${nf(m.newmrf)} ${esc(m.unit)}</b></div><div class="s">${esc(m.desc)}<br>${esc(m.pos)}</div></div></div>`).join('')}</div>` + '</div>'; }
  function ctq() { setHead(L('Material CTQ', 'CTQ по материалам'), L('no free stock', 'нет на складе'));
    const M = TY.M.filter(m => m.st === 'ctq' || m.st === 'part');
    main.innerHTML = '<div data-nt>' + `<div class="card"><div class="kv">${L('Items where the follow-up files show no free stock for the SF quantity. Ask the client for delivery date / supply. Not for MRF until stock exists.', 'Позиции без свободного остатка. Запросить у заказчика срок поставки. В MRF – только при наличии на складе.')}</div></div><div class="list">${M.map(m => `<button class="li" onclick="go('#/ty/mi/${enc(m.ident)}')"><div class="m"><div class="t">${esc(m.ident)} · ${L('missing', 'не хватает')} ${nf(m.short)} ${esc(m.unit)}</div><div class="s">${esc(m.desc.slice(0, 90))}</div></div><span class="chev">›</span></button>`).join('')}</div>` + '</div>'; }
  function typs() { setHead(L('Typicals to follow', 'Типовые узлы'), 'EL-ZX-002 rev 04'); const T = TY.d.typ; const R = TY.d.refs;
    const used = {}; TY.I.forEach(x => x.typ.forEach(k => { used[k] = used[k] || 0; used[k]++; }));
    main.innerHTML = '<div data-nt>' + `<div class="sect">${L('Used in this work (IWP lines)', 'Используются (строк IWP)')}</div><div class="list">${Object.keys(used).sort().map(k => `<div class="li"><div class="m"><div class="t">GLE-(G0-Z00000X0)-EL-${esc(k)} · ${used[k]}</div><div class="s">${esc((T[k] || ['', ''])[0])}<br>${esc((T[k] || ['', ''])[1])}</div></div></div>`).join('')}</div>
     ${Object.entries(R).map(([f, v]) => `<div class="sect">${L('Referenced on', 'Указаны на')} ${esc(v[0])}</div><div class="card"><div class="kv">${v[1].map(z => esc(z[0]) + ' (' + z[1] + ')').join(' · ')}</div></div>`).join('')}` + '</div>'; }
  TY.load();
})();
