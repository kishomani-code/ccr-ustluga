// v4.29 (07.11.2026): engineering updates from the office –
// CTQ alerts on site reports, GGSO new drawings (rev 03 AL) changes, cable notes, UC gas-in punch check,
// purchase request (diodes / resistors), warehouse stock check by ident for not-installed items (wh.json).
(function () {
  const KZ = window.KZ = {d: null, w: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const AK = 'kz_alerts';
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function load(f, k) { const set = d => { if (!d) return; const first = !KZ[k]; KZ[k] = d; if (first && /^#\/(kz|i|c|p|pi|d)\//.test((location.hash || '') + '/')) { try { route(); } catch (e) {} } };
    cget(f).then(d => { set(d); return net(f); }).then(set).catch(() => {}); }
  load('kz.json', 'd'); load('wh.json', 'w');
  const fm = n => (typeof fmtn === 'function' ? fmtn(n) : String(n));
  // ---------- CTQ: active (not closed by client answer) affected CTQs for a tag ----------
  const closed = () => (KZ.d && KZ.d.closed) || [];
  KZ.ctq = function (tag) { if (typeof holdTags !== 'function' || !tag) return []; return holdTags(tag).filter(no => !closed().includes(no)); };
  const isHold = no => typeof CTQBY !== 'undefined' && CTQBY[no] && CTQBY[no].hold === 'Yes';
  KZ.lbl = function (tag) { const L2 = KZ.ctq(tag); if (!L2.length) return ''; return (L2.some(isHold) ? '⛔ CTQ HOLD ' : '⚠ CTQ ') + L2.join(','); };
  function alog() { try { return JSON.parse(localStorage.getItem(AK) || '[]'); } catch (e) { return []; } }
  function alogAdd(tag, what) { const c = KZ.ctq(tag); if (!c.length) return; const a = alog(); a.push({tag, c, w: what, by: (typeof PS_ !== 'undefined' && PS_.name) || '?', t: Date.now()}); try { localStorage.setItem(AK, JSON.stringify(a.slice(-300))); } catch (e) {}
    const hold = c.some(isHold);
    if (typeof modalP === 'function') modalP(`<div class="h3" style="color:var(--bad)">${hold ? '⛔' : '⚠'} ${L('CTQ affected item', 'Позиция затронута CTQ')}</div>
      <p style="font-size:14px"><b>${esc(tag)}</b><br>${c.map(no => `<b>${esc(no)}</b>${isHold(no) ? ' – HOLD' : ''}: ${esc(String((CTQBY[no] || {}).sub || '').split(/[А-Яа-яЁё]/)[0].slice(0, 120))}`).join('<br>')}</p>
      <p style="font-size:13px">${L('Your entry is saved, but this item is affected by an open CTQ. It is marked ⛔ / ⚠ in the report so the engineer checks it before IWP / tracker update.', 'Запись сохранена, но позиция затронута открытым CTQ. В отчёте она помечена ⛔ – инженер проверит до обновления IWP / журнала.')}</p>
      <button class="tile" style="width:100%;min-height:auto" onclick="go('#/ctq/${enc(c[0])}')"><b>${L('Open', 'Открыть')} ${esc(c[0])} ›</b></button>`);
    else if (typeof toast === 'function') toast('⚠ ' + c.join(', ') + ' – CTQ affected item'); }
  // wrap site-entry functions (classic-script globals)
  function wrap(name, fn) { const o = window[name]; if (typeof o !== 'function' || o.__kz) return; const w = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (e) {} return r; }; w.__kz = 1; window[name] = w; }
  function hook() {
    wrap('cTick', (tag, k) => { const e = S2.c[tag]; if (e && e[k] && e[k].v) alogAdd(tag, k === 'P' ? 'pulled' : 'terminated'); });
    wrap('iTick', (acc, v) => { if (!v) return; const x = I.find(y => y.acc === acc); if (x) alogAdd(x.tag, x.g); });
    wrap('mSave', acc => { const x = I.find(y => y.acc === acc); if (x && S2.m[acc]) alogAdd(x.tag, x.g + ' +' + S2.m[acc].q); });
    ['progText', 'punchText'].forEach(fn => { const o = window[fn]; if (typeof o !== 'function' || o.__kz) return;
      const w = function (Lx) { let s = o.apply(this, arguments); const flag = (Lx || []).map(l => l.tag || (l.p && l.p.tag) || '').filter(t => KZ.ctq(t).length);
        if (!flag.length) return s; const ls = s.split('\n'); const out = ls.map(line => { const tg = flag.find(t => line.includes('\t' + t + '\t') || line.endsWith('\t' + t)); return tg ? line + '\t' + KZ.lbl(tg) : line; });
        out.splice(2, 0, `⚠ CTQ ALERT for engineer: ${new Set(flag).size} tag(s) affected by open CTQ – check before IWP / tracker update`); return out.join('\n'); };
      w.__kz = 1; window[fn] = w; });
    // extra cards on tag / item / cable pages
    const hc = window.holdCard; if (typeof hc === 'function' && !hc.__kz) { const w = function (tag) { return hc.apply(this, arguments) + KZ.tagCard(tag); }; w.__kz = 1; window.holdCard = w; }
    if (window.PX && typeof PX.card === 'function' && !PX.card.__kz) { const pc = PX.card; PX.card = function (p) { return pc.apply(this, arguments) + KZ.punchCard(p); }; PX.card.__kz = 1; }
  }
  hook(); setTimeout(hook, 1500); setTimeout(hook, 5000);
  // ---------- warehouse stock card ----------
  KZ.stock = id => KZ.w && KZ.w.m ? KZ.w.m[id] || null : null;
  KZ.verdict = function (w) { if (!w) return {c: 'var(--bad)', t: L('❌ Ident not in warehouse follow-up – client to supply / check ident', '❌ Идента нет в складской ведомости – поставка заказчика / проверить идент')};
    const [rcv, bal, res, iss, mi, mr] = w; const free = bal - res;
    if (free > 0) return {c: 'var(--ok)', t: L(`✅ Can request – ${fm(free)} free in warehouse. Raise MRF.`, `✅ Можно заказать – свободно ${fm(free)}. Оформить MRF.`)};
    if (bal > 0 && res > 0) return {c: '#b7791f', t: L(`⏳ All ${fm(bal)} reserved (MRF ${mr.join(', ') || '-'}) – check if reserved for us`, `⏳ Весь остаток ${fm(bal)} в резерве (MRF ${mr.join(', ') || '-'}) – проверить, для нас ли`)};
    if (rcv > 0) return {c: 'var(--bad)', t: L(`❌ Stock 0 – all ${fm(iss)} issued (MRF ${mi.join(', ') || '-'}). Check RHI site store, else client to supply more.`, `❌ Остаток 0 – выдано ${fm(iss)} (MRF ${mi.join(', ') || '-'}). Проверить склад РХИ, иначе дополнительная поставка заказчика.`)};
    return {c: 'var(--bad)', t: L('❌ Not received in warehouse – client to supply', '❌ На склад не поступало – поставка заказчика')}; };
  KZ.matCard = function (ids, title, need) { if (!ids || !ids.length) return ''; const date = KZ.w ? KZ.w.date : '';
    return `<div class="card"><div class="h3">📦 ${esc(title || L('Material – warehouse check', 'Материал – проверка склада'))}${need ? ' · ' + L('need', 'нужно') + ' ' + esc(need) : ''}</div>${ids.map(id => { const w = KZ.stock(id), v = KZ.verdict(w);
      return `<div style="border-top:1px solid var(--line);padding:6px 0"><div><b>${esc(id)}</b>${w ? ' · ' + esc(w[6]) : ''}</div>
        ${w ? `<div class="s" style="font-size:13px">${L('received', 'получено')} <b>${fm(w[0])}</b> · ${L('issued', 'выдано')} <b>${fm(w[3])}</b> · ${L('balance', 'остаток')} <b>${fm(w[1])}</b> · ${L('reserved', 'резерв')} <b>${fm(w[2])}</b> · ${L('free (remaining)', 'свободно')} <b style="color:${w[1] - w[2] > 0 ? 'var(--ok)' : 'var(--bad)'}">${fm(w[1] - w[2])}</b></div>
        <div class="s" style="font-size:12px;color:var(--mut)">MRF ${L('issued', 'выдача')}: ${esc(w[4].join(', ') || '-')} · MRF ${L('reserved', 'резерв')}: ${esc(w[5].join(', ') || '-')}</div>` : ''}
        <div style="font-size:13px;font-weight:600;color:${v.c};margin-top:2px">${v.t}</div>${w && w[1] - w[2] > 0 && !w[5].length ? `<div style="font-size:13px;color:var(--bad)"><b>🔔 ${L('Paul – make MRF for this item', 'Пауль – оформить MRF')}</b></div>` : ''}</div>`; }).join('')}
      <div style="font-size:11px;color:var(--mut)">${L('Warehouse follow-up', 'Складская ведомость')} ${esc(date)}</div></div>`; };
  // ident candidates for a not-installed IWP item: SF drawing (same title + system) rows, best word match
  const toks = s => new Set(String(s || '').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').split(' ').filter(w => w.length >= 3 && !/^(the|and|with|для|или|норм|док|standard)$/.test(w)));
  KZ.identsFor = function (x) { if (typeof SF === 'undefined' || !x) return []; const dw = String((T.dwg || [])[x.dwg] || ''); const m = dw.match(/\((G0-[A-Z0-9]+)\)-([A-Z]{2})-([A-Z0-9]+)/); if (!m) return [];
    const docs = SF.filter(s => s.doc.includes(m[1]) && s.doc.includes('-' + m[2] + '-' + m[3]));
    const want = toks((T.desc || [])[x.desc] + ' ' + (x.ctag || '')); if (!want.size) return [];
    const sc = []; docs.forEach(s => (s.it || []).forEach(r => { const id = String(r[3] || '').trim().split(/\s+/)[0]; if (!/^[A-Z0-9]{6,12}$/.test(id)) return; const t = toks(r[2]); let n = 0; want.forEach(w => { if (t.has(w)) n++; }); if (n >= 2) sc.push({id, n, d: r[2], q: r[5], u: r[4], doc: s.doc}); }));
    sc.sort((a, b) => b.n - a.n); const out = []; sc.forEach(s => { if (out.length < 2 && !out.some(o => o.id === s.id) && s.n >= sc[0].n - 1) out.push(s); }); return out; };
  // ---------- cards ----------
  KZ.tagCard = function (tag) { if (!KZ.d || !tag) return ''; let h = '';
    const N2 = String(tag).toUpperCase(); const notes = KZ.d.notes[tag] || KZ.d.notes[N2] || [];
    if (notes.length) h += `<div class="card" style="border-left:4px solid #1a73e8"><div class="h3">📝 ${L('Engineering notes (office)', 'Замечания инженера (офис)')}</div>${notes.map(n => `<div class="note" style="background:#eef3f8">${esc(n)}</div>`).join('')}</div>`;
    const m = (location.hash || '').match(/^#\/i\/(\d+)/); if (m && typeof I !== 'undefined') { const x = I[+m[1]]; if (x && x.tag === tag && !x.done && !/^Cable (pulling|termination)$/i.test(x.g) && !/cable (laying|termination)/i.test(x.m || '')) {
      const c = KZ.identsFor(x); if (c.length) h += KZ.matCard(c.map(s => s.id), L('Not installed – material from SF drawing', 'Не смонтировано – материал по SF'), `${fm(Math.max(x.q - x.f, 0))} ${x.u}`) + `<div class="small" style="color:var(--mut);margin:-6px 0 8px 4px">${esc(c[0].doc)} · ${esc(String(c[0].d).slice(0, 110))}</div>`;
      else h += `<div class="card"><div class="h3">📦 ${L('Material check', 'Проверка материала')}</div><div class="note">${L('No matching ident in the SF drawing for this item – open "Warehouse stock by ident" and search the ident.', 'Подходящий идент в SF не найден – откройте «Склад по иденту» и найдите идент.')}</div><button class="tile" style="width:100%;min-height:auto" onclick="go('#/kz/wh')"><b>🔎 ${L('Warehouse stock by ident', 'Склад по иденту')}</b></button></div>`; } }
    return h; };
  KZ.punchCard = function (p) { if (!KZ.d || !p) return ''; const g = KZ.d.gi[String(p.no)]; if (!g) return '';
    const col = /^Ready|^Can close/.test(g.cc) ? 'var(--ok)' : 'var(--bad)';
    return `<div class="card" style="border-left:4px solid ${col}"><div class="h3">🔥 ${L('UC gas-in check', 'Проверка gas-in')} ${esc(KZ.d.date)}</div>${kv([[L('Can close?', 'Можно закрыть?'), g.cc], [L('What we need', 'Что нужно'), g.nd], [L('Type', 'Тип'), g.ty], [L('Material', 'Материал'), g.mat + (g.id && g.id !== '–' ? ' · ' + g.id : '')], [L('Material status', 'Статус материала'), g.ms], [L('Responsible', 'Ответственный'), g.rp + (g.rc ? ' – ' + g.rc : '')], [L('Evidence (tracker / IWP)', 'Подтверждение'), g.ev], [L('Scanned PDF', 'Скан PDF'), g.pdf], [L('Next action', 'Действие'), g.nx], [L('Site engineer', 'Мастер'), g.who]].filter(r => r[1]))}
      ${g.id && /^[A-Z0-9]{6,12}/.test(g.id) ? KZ.matCard(g.id.split(/\s*\/\s*/).filter(s => /^[A-Z0-9]{6,12}$/.test(s))) : ''}</div>`; };
  // ---------- home tile ----------
  KZ.tile = function () { const a = alog(); const d = KZ.d; const ga = d ? Object.values(d.gi) : [];
    const ready = ga.filter(g => /^Ready/.test(g.cc)).length, can = ga.filter(g => /^Can/.test(g.cc)).length;
    return `<button class="tile" style="width:100%;min-height:auto;margin-bottom:6px;background:linear-gradient(135deg,#1f3864,#1a73e8);color:#fff;border-color:#1f3864" onclick="go('#/kz')"><b>📌 ${L('Engineering updates', 'Обновления инженера')} ${d ? '· ' + esc(d.date) : ''}</b><span class="n" style="color:#dbe8ff;display:block">${a.length ? '⛔ ' + a.length + ' ' + L('CTQ alerts', 'CTQ-сигналов') + ' · ' : ''}📐 ${L('GGSO new drawings', 'GGSO новые чертежи')} · 🔥 gas-in ${ready} ${L('ready', 'готово')} / ${can} ${L('can close', 'можно закрыть')} · 🧾 ${L('purchase', 'закупка')} · 📦 ${L('stock by ident', 'склад по иденту')}</span></button>`; };
  // ---------- routes ----------
  KZ.route = function (rest) { const k = rest[0] || ''; const back = `<button class="chip" onclick="go('#/kz')">‹ ${L('Updates', 'Обновления')}</button>`;
    if (!KZ.d) { main.innerHTML = '<div class="empty">Loading…</div>'; return; } const d = KZ.d;
    if (!k) { const a = alog(); const ga = Object.values(d.gi);
      setHead('📌 ' + L('Engineering updates', 'Обновления инженера'), d.date);
      const T3 = (h, b, n, bg) => `<button class="tile main" style="background:${bg};border-color:${bg}" onclick="go('${h}')"><b>${b}</b><div><span class="n">${n}</span></div></button>`;
      main.innerHTML = `<div class="card"><div class="h3">🗓️ ${L('Latest decisions', 'Последние решения')}</div>${d.upd.map(u => `<div class="note" style="background:#eef3f8"><b>${esc(u[0])}</b> ${esc(u[1])}</div>`).join('')}</div>
        <div class="grid">${T3('#/kz/al', '⛔ ' + L('CTQ alerts – site reports', 'CTQ – отчёты площадки'), `${a.length} ${L('entries on CTQ items', 'записей по CTQ')} · ${siteHits().length} ${L('in saved site entries', 'в записях')}`, '#b42318')}
        ${T3('#/kz/dc', '📐 ' + L('GGSO new drawings (rev 03 AL)', 'GGSO новые чертежи (рев. 03 AL)'), d.dc.map(x => x.ti.split(' ')[0]).join(' · '), '#1a73e8')}
        ${T3('#/kz/gi', '🔥 ' + L('UC gas-in punch check', 'Gas-in: проверка замечаний'), `${ga.filter(g => /^Ready/.test(g.cc)).length} ${L('ready', 'готово')} · ${ga.filter(g => /^Can/.test(g.cc)).length} ${L('can close', 'можно')} · ${ga.filter(g => /^Cannot/.test(g.cc)).length} ${L('cannot', 'нельзя')}`, '#c2410c')}
        ${T3('#/kz/pr', '🧾 ' + L('Purchase request – diodes / resistors', 'Закупка – диоды / резисторы'), d.pr.date, '#5b3a8a')}
        ${T3('#/kz/wh', '📦 ' + L('Warehouse stock by ident', 'Склад по иденту'), `${KZ.w ? Object.keys(KZ.w.m).length : '…'} ${L('idents', 'идентов')} · ${KZ.w ? esc(KZ.w.date) : ''}`, '#475467')}</div>`; return; }
    if (k === 'al') { const a = alog().slice().reverse(), s = siteHits();
      setHead('⛔ ' + L('CTQ alerts', 'CTQ-сигналы'), `${a.length + s.length}`);
      main.innerHTML = `<div class="chips">${back}<button class="chip" onclick="try{localStorage.removeItem('${AK}')}catch(e){};route()">${L('Clear log', 'Очистить')}</button></div>
        <div class="note">${L('Site entries (this phone) on tags affected by an open CTQ. Lines are also marked ⛔ in the report text to Paul.', 'Записи площадки (этот телефон) по тегам с открытым CTQ. В отчёте Паулю строки помечены ⛔.')}</div>
        <div class="list">${s.map(h => `<button class="li" onclick="go('${h.href}')"><div class="m"><div class="t">${esc(h.tag)} · <span class="badge b-no">${esc(KZ.lbl(h.tag))}</span></div><div class="s">${esc(h.w)} · ${esc(h.by || '')} · ${typeof dstr === 'function' ? dstr(h.t) : ''}</div></div><span class="chev">›</span></button>`).join('') || '<div class="empty">' + L('No site entries on CTQ items ✓', 'Нет записей по CTQ ✓') + '</div>'}</div>
        ${a.length ? `<div class="sect">${L('Alert log', 'Журнал сигналов')}</div><div class="list">${a.map(x => `<div class="li" style="display:block"><div class="t">${esc(x.tag)} · ${esc(x.c.join(', '))}</div><div class="s">${esc(x.w)} · ${esc(x.by)} · ${new Date(x.t).toLocaleString('en-GB')}</div></div>`).join('')}</div>` : ''}`; return; }
    if (k === 'dc') { setHead('📐 ' + L('GGSO new drawings', 'GGSO новые чертежи'), 'rev 03 AL');
      const KL = {move: ['🔀 ' + L('Move to other cabinet', 'Перенос в другой шкаф'), '#b42318'], term: ['🔁 ' + L('Terminals change', 'Смена клемм'), '#b7791f'], new: ['🆕 ' + L('New cable – TQ', 'Новый кабель – TQ'), '#5b3a8a'], check: ['❓ ' + L('Drawing vs tracker', 'Чертёж vs журнал'), '#475467'], same: ['✓ ' + L('No change', 'Без изменений'), '#2f855a'], int: ['🔧 ' + L('Internal wiring (vendor)', 'Внутренний монтаж'), '#475467']};
      main.innerHTML = `<div class="chips">${back}</div>` + d.dc.map(x => `<div class="card"><div class="h3">${esc(x.ti)}</div><div class="small" style="color:var(--mut)">${esc(x.dwg)} · ${esc(x.date)}</div><div class="note" style="background:#fff4d6">${esc(x.sum)}</div>
        <div class="list">${x.rows.map(r => { const c = typeof CBY !== 'undefined' && CBY[r[1]]; const k2 = KL[r[0]] || ['', '#475467']; return `<${c ? `button class="li" onclick="go('#/c/${enc(r[1])}')"` : 'div class="li" style="display:block"'}><div class="m"><div class="t"><span class="badge" style="background:${k2[1]};color:#fff">${k2[0]}</span> ${esc(r[1])}</div><div class="s" style="white-space:normal">${L('old', 'было')}: ${esc(r[2])} → ${L('new', 'стало')}: <b>${esc(r[3])}</b></div></div>${c ? '<span class="chev">›</span></button>' : '</div>'}`; }).join('')}</div></div>`).join(''); return; }
    if (k === 'gi') { VS.KZG = VS.KZG || {f: ''}; const v = VS.KZG; const all = Object.entries(d.gi);
      const cats = [...new Set(all.map(([n, g]) => g.cc))]; const Ls = all.filter(([n, g]) => !v.f || g.cc === v.f || (v.f === '@w' && g.who === (v.w || '')));
      setHead('🔥 ' + L('UC gas-in punch check', 'Gas-in: проверка'), `${Ls.length} / ${all.length}`);
      main.innerHTML = `<div class="chips">${back}<button class="chip ${!v.f ? 'on' : ''}" onclick="VS.KZG.f='';KZ.route(['gi'])">${L('All', 'Все')}</button>${cats.map(c => `<button class="chip ${v.f === c ? 'on' : ''}" onclick="VS.KZG.f=decodeURIComponent('${enc(c)}');KZ.route(['gi'])">${esc(c)} (${all.filter(([n, g]) => g.cc === c).length})</button>`).join('')}</div>
        <div class="list">${Ls.slice(0, 400).map(([n, g]) => { const p = typeof PNO !== 'undefined' && PNO[n]; return `<${p ? `button class="li" onclick="go('#/pi/${p.i}')"` : 'div class="li" style="display:block"'}><div class="m"><div class="t">№ ${esc(n)} · ${esc(g.tag)}</div><div class="s" style="white-space:normal"><b style="color:${/^Ready|^Can/.test(g.cc) ? 'var(--ok)' : 'var(--bad)'}">${esc(g.cc)}</b> · ${esc(g.nd)} · ${esc(g.who)}</div><div class="s" style="white-space:normal">${esc(g.nx).slice(0, 180)}</div></div>${p ? '<span class="chev">›</span></button>' : '</div>'}`; }).join('')}</div>`; return; }
    if (k === 'pr') { const p = d.pr; setHead('🧾 ' + L('Purchase request', 'Закупка'), p.date);
      main.innerHTML = `<div class="chips">${back}</div><div class="card"><div class="h3">${esc(p.title)}</div><div class="list">${p.rows.map(r => `<div class="li" style="display:block"><div class="t"><b>${esc(r[0])}</b></div><div class="s" style="white-space:normal">${L('Need', 'Нужно')}: ${esc(r[1])}</div><div class="s" style="white-space:normal">${esc(r[2])}</div><div class="s" style="color:var(--ok)"><b>${esc(r[3])}</b></div></div>`).join('')}</div><div class="note">${esc(p.note)}</div></div>
        ${KZ.matCard(['EDDRC00002', 'ERSSC00004', 'ERSSC00007', 'ERSSC00008'], L('Client warehouse – diodes / resistors', 'Склад заказчика – диоды / резисторы'))}`; return; }
    if (k === 'wh') { VS.KZW = VS.KZW || {q: ''}; setHead('📦 ' + L('Warehouse stock by ident', 'Склад по иденту'), KZ.w ? KZ.w.date : '');
      main.innerHTML = `<div class="chips">${back}</div><input class="fin" id="kzq" placeholder="${L('Ident or name (e.g. EIZOH00001, коробка)', 'Идент или название')}" value="${esc(VS.KZW.q)}" oninput="VS.KZW.q=this.value;KZ.whList()"><div id="kzl"></div>`; KZ.whList(); return; }
    KZ.route([]); };
  KZ.whList = function () { const el = document.getElementById('kzl'); if (!el) return; if (!KZ.w) { el.innerHTML = '<div class="empty">Loading…</div>'; return; }
    const q = VS.KZW.q.trim().toUpperCase(); if (q.length < 3) { el.innerHTML = '<div class="empty">' + L('Type at least 3 letters', 'Введите минимум 3 символа') + '</div>'; return; }
    const ql = q.toLowerCase().replace(/\s+/g, ''); const ids = Object.keys(KZ.w.m).filter(id => id.includes(q) || String(KZ.w.m[id][6]).toLowerCase().includes(ql)).slice(0, 25);
    el.innerHTML = ids.length ? KZ.matCard(ids, ids.length + ' ' + L('idents', 'идентов')) : '<div class="empty">' + L('Nothing found', 'Не найдено') + '</div>'; };
  // site entries (this phone) on CTQ-affected tags
  function siteHits() { const out = []; if (typeof S2 === 'undefined') return out;
    Object.entries(S2.c || {}).forEach(([tag, e]) => { if (!KZ.ctq(tag).length) return; ['P', 'F', 'T'].forEach(k => { if (e[k] && e[k].v) out.push({tag, w: k === 'P' ? 'pulled' : 'terminated', by: e[k].by, t: e[k].t, href: '#/c/' + enc(tag)}); }); });
    Object.entries(S2.i || {}).forEach(([acc, e]) => { const x = I.find(y => y.acc === acc); if (x && e.v && KZ.ctq(x.tag).length) out.push({tag: x.tag, w: x.g, by: e.by, t: e.t, href: '#/i/' + x.i}); });
    Object.entries(S2.m || {}).forEach(([acc, e]) => { const x = I.find(y => y.acc === acc); if (x && KZ.ctq(x.tag).length) out.push({tag: x.tag, w: x.g + ' +' + e.q, by: e.by, t: e.t, href: '#/i/' + x.i}); });
    return out.sort((a, b) => b.t - a.t); }
})();
