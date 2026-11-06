// v4.28: punch extras – signed closing PDFs (sg.json), Aleksy closure file (ak.json), waiting for materials (mat.json),
// target date (handover list), NCR menu (ncr.json) and CCR-SPBA focus menu (sp.js uses PX.mat / PX.matCard).
(function () {
  const PX = window.PX = {sg: null, mat: null, ncr: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  const RX = /^#\/(px|ncr|pl|pk|pi|sp)(\/|\?|$)/;
  function load(f, k) { const set = d => { if (!d) return; const first = !PX[k]; PX[k] = d; if (first && RX.test(location.hash || '')) { try { route(); } catch (e) {} } };
    cget(f).then(d => { set(d); return net(f); }).then(set).catch(() => {}); }
  load('sg.json', 'sg'); load('mat.json', 'mat'); load('ncr.json', 'ncr');
  const AKA = no => window.AK && AK.d && AK.d.a ? AK.d.a[String(no)] : null;
  PX.signed = no => PX.sg && PX.sg.m ? PX.sg.m[String(no)] || null : null;
  // ---------- material rules: tag type + punch text -> ident(s)
  const R = [
    [/-BGB-/, /смонтир|установ|отсутств|нет\b|missing|not (mounted|installed)/i, ['EIZOH00001'], 'Magnetic contact detector ИО102-26 «АЯКС»'],
    [/-AE-/, /корпус|EC000261|шкаф \(пуст/i, ['QHOUM00001'], 'Wall housing for relay module'],
    [/-AE-/, /смонтир|установ|отсутств/i, ['QAUMO00002', 'QAUMO00003'], 'Addressable relay module РМ-1-R3'],
    [/-BR-/, /коробк/i, ['EBOXJ00004', 'EBOXJ00002'], 'Distribution box 150x110x70'],
    [/-BR-/, /смонтир|установ|отсутств/i, ['QLOOP00001'], 'Loop isolator ИЗ-1-R3'],
    [/-BTK-/, /смонтир|установ|отсутств/i, ['QFIRD00008'], 'Heat detector (addressable)'],
    [/-SIB-/, /смонтир|установ|отсутств|сломан|поврежд/i, ['QREMO00001', 'QREMO00002'], 'Remote start device УДП'],
    [/-BIAS-/, /смонтир|установ|отсутств/i, ['QSEFA00001'], 'Sounder ОПОП2-35'],
    [/-BIAL-/, /смонтир|установ|отсутств табл|отсутствует оповещ/i, ['QSEFA00003', 'QSEFA00004', 'QSEFA00005'], 'Light sign ОПОП1-8 (check version on drawing)'],
    [/./, /F11|звуковой оповещатель пожарной/i, ['SSAFS00003'], 'Safety sign F11'],
    [/./, /F10|кнопка включения/i, ['SSAFS00002', 'SSAFS00010'], 'Safety sign F10'],
    [/-BIA[LS]-/, /знак/i, ['SSAFS00003'], 'Safety sign F11'],
    [/./, /бирк/i, ['ECTAG00002', 'ECTAG00001'], 'Cable tags У-134 / У-136'],
    [/./, /диод/i, ['EDDRC00002'], 'Diode (warehouse 1N5408)'],
    [/./, /резистор/i, ['ERSSC00004', 'ERSSC00008', 'ERSSC00007'], 'Resistors С1-4 0.5 W'],
    [/./, /знак заземл|Z08/i, ['EELSS00001'], 'Earthing sign Z08'],
    [/./, /аккумулятор/i, [], 'Batteries – vendor supply with cabinet'],
  ];
  PX.rule = function (tag, text) { const t = String(tag || ''), s = String(text || ''); for (const r of R) if (r[0].test(t) && r[1].test(s)) return {ids: r[2], nm: r[3]}; return null; };
  PX.matOf = function (p) { if (p._mx !== undefined) return p._mx; return (p._mx = PX.rule(p.tag, (p.dru || '') + ' ' + (p.den || ''))); };
  PX.st = function (ids) { // stock state for a list of idents
    const M = (PX.mat && PX.mat.m) || {}; const rows = ids.map(id => [id, M[id]]).filter(x => x[1]);
    const bal = rows.reduce((a, x) => a + x[1].bal, 0), res = rows.reduce((a, x) => a + x[1].res, 0), mrf = [...new Set([].concat(...rows.map(x => x[1].mrf)))];
    const free = bal - res;
    const k = !ids.length ? 'vendor' : !rows.length ? 'none' : free > 0 ? 'stock' : res > 0 ? 'reserved' : 'none';
    return {rows, bal, res, free, mrf, k, mrfAlert: !!ids.length && !mrf.length};
  };
  const KL = {stock: [L('✅ In stock – clear & close', '✅ Есть на складе – устранить и закрыть'), '#1e7b34', '#e6f4ea'], reserved: [L('🟡 Reserved by MRF', '🟡 Зарезервировано по MRF'), '#8a5a00', '#fff4d6'],
    none: [L('❌ No stock – order', '❌ Нет на складе – заказать'), '#b42318', '#fde8e8'], vendor: [L('🏭 Vendor supply', '🏭 Поставка вендора'), '#475467', '#eceff3']};
  PX.matCard = function (ids, nm, need) { const s = PX.st(ids); const k = KL[s.k];
    return `<div class="card" style="border-left:5px solid ${k[1]};background:${k[2]}"><div class="h3">📦 ${L('Material', 'Материал')}: ${esc(nm || '')}</div>
      <div><span class="badge" style="background:#fff;color:${k[1]}">${k[0]}</span>${need ? ` <span class="badge b-na">${L('need', 'нужно')} ${esc(need)}</span>` : ''}</div>
      ${s.rows.map(([id, m]) => `<div style="font-size:13px;margin-top:6px"><b>${esc(id)}</b> · ${esc(m.ru || m.en)}<br><span style="color:var(--mut)">${L('Warehouse balance', 'Остаток')} <b>${m.bal}</b> · ${L('reserved MRF', 'резерв MRF')} ${m.res} · ${L('free', 'свободно')} <b>${m.bal - m.res}</b>${m.wh.length ? ' · ' + esc(m.wh.join(', ')) : ''}${m.mrf.length ? '<br>MRF: ' + esc(m.mrf.join(', ')) : ''}${m.pl.length ? '<br>PL: ' + esc(m.pl.slice(0, 4).join(', ')) : ''}</span></div>`).join('') || (ids.length ? `<div style="font-size:13px;margin-top:6px">${esc(ids.join(', '))} – ${L('not found in materials follow-up', 'нет в ведомости материалов')}</div>` : '')}
      ${s.mrfAlert ? `<div class="note" style="background:#fde8e8;margin-top:6px"><b>🔔 ${L('Paul – make MRF for this item', 'Пауль – оформить MRF на эту позицию')}</b> ${L('(no MRF requested yet)', '(MRF ещё не оформлен)')}</div>` : ''}
      <div style="font-size:11px;color:var(--mut);margin-top:4px">${L('Materials follow-up', 'Ведомость материалов')} ${esc((PX.mat && PX.mat.date) || '')}</div></div>`; };
  // ---------- punch row badge + punch item card
  PX.badge = function (p) { let h = ''; if (p.st === 'Open' && PX.signed(p.no)) h += '<div style="margin-top:3px"><span class="badge b-ok">📄 signed PDF</span></div>';
    const a = AKA(p.no); if (a && p.st === 'Open' && /^Закрыт/i.test(a[0])) h += '<div style="margin-top:3px"><span class="badge b-ok">✅ Aleksy</span></div>'; return h; };
  const tgtOf = p => { if (!window.HO || !HO.by) return null; const s = HO.by[PT.sub[p.sub]]; return s && s.mc ? {d: s.mc, sub: s.sub, done: s.done} : null; };
  PX.card = function (p) { let h = '';
    const sg = PX.signed(p.no);
    if (sg) h += `<div class="card" style="border-left:5px solid #1e7b34;background:#e6f4ea"><div class="h3">📄 ${p.st === 'Open' ? L('Closed – signed PDF, but NOT closed in punch list', 'Закрыто – подписано в PDF, но НЕ закрыто в punch-листе') : L('Signed closing PDF', 'Подписанный PDF закрытия')}</div>
      <div style="font-size:13px">${sg.map(x => `${esc(x[0])} – ${L('page', 'стр.')} ${x[1]}`).join('<br>')}</div>${p.st === 'Open' ? `<div class="note" style="margin-top:6px">${L('No need to fix again – report to master punch list with this PDF.', 'Повторно устранять не нужно – подать в мастер-лист с этим PDF.')}</div>` : ''}</div>`;
    const a = AKA(p.no);
    if (a) { const cl = /^Закрыт/i.test(a[0]);
      h += `<div class="card" style="border-left:5px solid ${cl ? '#1e7b34' : '#8a5a00'}"><div class="h3">👷 ${L('Aleksy closure file', 'Файл закрытия – Алексей')} ${esc((AK.d && AK.d.date) || '')}</div>
        <div style="font-size:14px"><b>${esc(a[6] || a[0])}</b> · ${esc(a[1])}${a[5] ? ` · ${L('category', 'категория')} ${esc(a[5])}` : ''}${a[7] ? ` · ${esc(a[7])}` : ''}</div>
        ${cl && p.st === 'Open' ? `<div class="note" style="margin-top:6px;background:#e6f4ea">${L('Closed by Aleksy – report to master punch list.', 'Закрыто у Алексея – подать в мастер-лист.')}</div>` : ''}</div>`; }
    else if (p.st === 'Open' && window.AK && AK.d && (AK.d.rep || []).some(x => x.no === String(p.no))) h += `<div class="note" style="background:#fff4d6">⚠ ${L('Reported by us but not in Aleksy file yet – inform Aleksy.', 'Подано нами, но нет в файле Алексея – сообщить Алексею.')}</div>`;
    const t = tgtOf(p); if (t) h += `<div class="note" style="background:#eef3f8">🎯 ${L('Target date (subsystem handover / MC)', 'Целевая дата (передача подсистемы / MC)')}: <b>${esc(t.d)}</b> · ${esc(t.sub)}${t.done ? ' ✓' : ''}</div>`;
    if (p.st === 'Open') { const m = PX.matOf(p); if (m) h += PX.matCard(m.ids, m.nm); }
    return h; };
  // ---------- punch home tiles + lists
  const myOpen = () => (typeof pscope === 'function' ? pscope() : PU).filter(p => p.st === 'Open');
  PX.lists = function () { const O = myOpen(); return {sg: O.filter(p => PX.signed(p.no)), mw: O.filter(p => PX.matOf(p)), ak: O.filter(p => { const a = AKA(p.no); return a && /^Закрыт/i.test(a[0]); })}; };
  PX.tiles = function () { if (!PX.sg && !PX.mat) return ''; const x = PX.lists(); const st = x.mw.map(p => PX.st(PX.matOf(p).ids));
    const ok = st.filter(s => s.k === 'stock').length, al = st.filter(s => s.mrfAlert).length;
    return `<div class="sect">📄 ${L('Closed elsewhere / materials', 'Закрыто в других документах / материалы')}</div><div class="grid">
      <button class="tile main" style="background:#1e7b34;border-color:#1e7b34" onclick="go('#/px/sg')"><b>📄 ${L('Signed PDF – not closed in punch list', 'Подписано в PDF – не закрыто в листе')}</b><div><span class="n">${x.sg.length} ${L('punches', 'замечаний')}</span></div></button>
      <button class="tile main" style="background:#0b6e6e;border-color:#0b6e6e" onclick="go('#/px/ak')"><b>👷 ${L('Closed by Aleksy – still open', 'Закрыто у Алексея – открыто')}</b><div><span class="n">${x.ak.length} ${L('punches', 'замечаний')}</span></div></button>
      <button class="tile main" style="background:#c2410c;border-color:#c2410c" onclick="go('#/px/mw')"><b>📦 ${L('Waiting for materials', 'Ожидают материалы')}</b><div><span class="n">${x.mw.length} · ✅ ${ok} ${L('in stock', 'на складе')}${al ? ' · 🔔 ' + al + ' MRF' : ''}</span></div></button></div>`; };
  PX.route = function (rest) { const k = rest[0] || 'mw'; const x = PX.lists();
    if (k === 'sg') { setHead(L('Signed PDF – not closed in punch list', 'Подписано в PDF – не закрыто'), `${x.sg.length} · ${PRJ}`);
      main.innerHTML = `<div class="note">${L('These punches are signed closed by the client in the scanned closing PDFs but still Open in the master punch list. No need to fix again – report them with the PDF.', 'Эти замечания подписаны заказчиком в PDF закрытия, но в мастер-листе открыты. Повторно устранять не нужно – подать с PDF.')}</div>
        <button class="tile" style="width:100%;min-height:auto;margin:6px 0" onclick="PX.copy('sg')"><b>📋 ${L('Copy list for message', 'Скопировать список')}</b></button>
        <div class="list">${x.sg.map(p => pRow(p).replace('<div class="s">', `<div class="s" style="color:#1e7b34">📄 ${esc(PX.signed(p.no).map(z => z[0] + ' p.' + z[1]).join('; '))}</div><div class="s">`)).join('') || '<div class="empty">' + L('Nothing', 'Нет') + '</div>'}</div>`; return; }
    if (k === 'ak') { setHead(L('Closed by Aleksy – still open in master', 'Закрыто у Алексея – открыто в мастер-листе'), `${x.ak.length} · ${PRJ}`);
      main.innerHTML = `<button class="tile" style="width:100%;min-height:auto;margin:6px 0" onclick="PX.copy('ak')"><b>📋 ${L('Copy list for message', 'Скопировать список')}</b></button><div class="list">${x.ak.map(p => pRow(p).replace('<div class="s">', `<div class="s" style="color:#0b6e6e">👷 ${esc(AKA(p.no)[6] || AKA(p.no)[0])} ${esc(AKA(p.no)[1])}</div><div class="s">`)).join('') || '<div class="empty">' + L('Nothing', 'Нет') + '</div>'}</div>`; return; }
    // waiting for materials grouped by material
    VS.PXM = VS.PXM || {f: ''}; const v = VS.PXM; const g = {};
    x.mw.forEach(p => { const m = PX.matOf(p); const key = m.nm; (g[key] = g[key] || {m, L: []}).L.push(p); });
    const G = Object.values(g).map(o => Object.assign(o, {s: PX.st(o.m.ids)})).filter(o => !v.f || o.s.k === v.f || (v.f === 'mrf' && o.s.mrfAlert)).sort((a, b) => b.L.length - a.L.length);
    setHead(L('Waiting for materials', 'Ожидают материалы'), `${x.mw.length} ${L('open punches', 'открытых замечаний')} · ${PRJ}`);
    main.innerHTML = `<div class="note">${L('Punch tag / text matched with SF materials and the warehouse follow-up. ✅ In stock → raise MRF, fix and close the punch.', 'Тег / текст замечания сопоставлен с SF и складом. ✅ Есть на складе → MRF, устранить и закрыть.')}</div>
      <div class="chips">${[['', L('All', 'Все')], ['stock', '✅ ' + L('In stock', 'На складе')], ['reserved', '🟡 MRF'], ['none', '❌ ' + L('No stock', 'Нет')], ['mrf', '🔔 ' + L('MRF missing', 'Нет MRF')]].map(([k2, l]) => `<button class="chip ${v.f === k2 ? 'on' : ''}" onclick="VS.PXM.f='${k2}';PX.route(['mw'])">${l}</button>`).join('')}</div>
      ${G.map(o => `${PX.matCard(o.m.ids, o.m.nm, o.L.length + ' ' + L('punches', 'замеч.'))}<div class="list" style="margin-bottom:10px">${o.L.slice(0, 60).map(pRow).join('')}${o.L.length > 60 ? `<div class="empty">+${o.L.length - 60}</div>` : ''}</div>`).join('') || '<div class="empty">' + L('Nothing', 'Нет') + '</div>'}`; };
  PX.copy = function (k) { const x = PX.lists()[k] || []; const t = (k === 'sg' ? 'Signed closed in PDF – still OPEN in master punch list:\n' : 'Closed in Aleksy file – still OPEN in master punch list:\n') + x.map(p => `${p.no} · ${p.tag || '-'}${k === 'sg' ? ' · ' + PX.signed(p.no).map(z => z[0] + ' p.' + z[1]).join('; ') : ''}`).join('\n');
    try { navigator.clipboard.writeText(t).then(() => toast(L('Copied', 'Скопировано'))); } catch (e) { prompt('Copy', t); } };
  // ---------- NCR
  const mineN = () => PX.ncr ? PX.ncr.n.filter(n => n.ar.includes(PRJ === '1801' ? 'CCR' : PRJ)) : [];
  const isOpen = n => /^open/i.test(n.st);
  const dd = s => { const m = String(s || '').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const age = s => { const d = dd(s); return d ? Math.round((Date.now() - d) / 864e5) : null; };
  PX.ncrTile = function () { if (!PX.ncr) return ''; const A = mineN(), O = A.filter(isOpen), E = O.filter(n => n.ei);
    return `<button class="tile" style="width:100%;min-height:auto;margin-bottom:6px;background:${E.length ? '#7a1f1f' : '#475467'};color:#fff;border-color:${E.length ? '#7a1f1f' : '#475467'}" onclick="go('#/ncr')"><b>🧾 ${L('NCR – non-conformities', 'NCR – несоответствия')} · ${O.length} ${L('open', 'открыто')}</b><span class="n" style="color:#f6dada;display:block">${E.length ? '🔔 ' + E.length + ' ' + L('E&I open – notify Paul', 'E&I открыто – сообщить Паулю') : L('no open E&I NCR', 'нет открытых E&I NCR')} · ${A.length} ${L('total in this area', 'всего по титулу')}</span></button>`; };
  PX.ncrRoute = function (a) { if (!PX.ncr) { main.innerHTML = '<div class="empty">Loading…</div>'; return; }
    const A = mineN(); if (a) { const n = A.find(x => x.no === a) || PX.ncr.n.find(x => x.no === a); if (!n) return PX.ncrRoute('');
      setHead('NCR ' + (n.ncr || n.no), n.di);
      main.innerHTML = `<div class="card"><div class="big">${esc(n.ncr || ('№ ' + n.no))}</div><div style="margin:6px 0"><span class="badge ${isOpen(n) ? 'b-no' : 'b-ok'}">${esc(n.st)}</span> <span class="badge b-na">${esc(n.mm || '')}</span> <span class="badge b-na">${esc(n.ty)}</span></div>
        ${isOpen(n) && n.ei ? `<div class="note" style="background:#fde8e8"><b>🔔 ${L('Notify Paul – open E&I NCR in our area', 'Сообщить Паулю – открытое E&I NCR в нашем титуле')}</b> · ${L('open since', 'открыто с')} ${esc(n.di)} (${age(n.di)} ${L('days', 'дн.')})</div>` : ''}
        ${n.tgt ? `<div class="note" style="background:#eef3f8">🎯 ${L('Target / planned closing date', 'Плановая дата закрытия')}: <b>${esc(n.tgt)}</b>${n.prev ? ' · ' + L('previous', 'ранее') + ' ' + esc(n.prev) : ''}</div>` : ''}
        ${n.en ? `<div class="note" style="background:#e8f6ee;white-space:pre-wrap"><b>EN:</b> ${esc(n.en)}</div>` : ''}${n.ru ? `<div class="note" style="background:#eef3f8;white-space:pre-wrap"><b>RU:</b> ${esc(n.ru)}</div>` : ''}</div>
        <div class="card">${kv([['Date of issue', n.di], ['Issuer', n.iss], ['External NCR / ЖАН', [n.ext, n.par].filter(x => x && x !== '--').join(' / ')], ['Location', n.loc], ['Location details', n.locd], ['Subsystem', n.sub], ['Discipline', n.disc], ['Group', n.grp], ['Activity', n.act], ['Responsible', n.resp], ['Subcontractor', n.subc], ['Supplier', n.sup], ['Type', n.nt], ['Tag', n.tag], ['Reference documents', n.ref], ['Proposed action', n.prop], ['Delay description', n.delay], ['Close date', n.cd], ['Comment', n.com]])}</div>`; return; }
    VS.NC = VS.NC || {f: 'open', e: 'ei', q: ''}; const v = VS.NC; const nq = String(v.q || '').toLowerCase();
    const Lst = A.filter(n => (v.f === 'all' || (v.f === 'open' ? isOpen(n) : !isOpen(n))) && (v.e !== 'ei' || n.ei) && (!nq || (n.en + n.ru + n.loc + n.tag + n.ncr + n.no + n.locd).toLowerCase().includes(nq)));
    const O = A.filter(isOpen), E = O.filter(n => n.ei);
    setHead(L('NCR – non-conformities', 'NCR – несоответствия'), `${PRJ} · ${L('register', 'реестр')} ${esc(PX.ncr.date)}`);
    main.innerHTML = `<div class="kpi"><div><b style="color:var(--bad)">${E.length}</b><span>${L('open E&I', 'открыто E&I')}</span></div><div><b>${O.length}</b><span>${L('open all disc.', 'открыто всего')}</span></div><div><b>${A.length}</b><span>${L('total', 'всего')}</span></div></div>
      ${E.length ? `<button class="tile" style="width:100%;min-height:auto;margin:6px 0;background:#7a1f1f;color:#fff;border-color:#7a1f1f" onclick="PX.ncrCopy()"><b>🔔 ${L('Notify Paul – copy open E&I NCR list', 'Сообщить Паулю – скопировать список E&I NCR')}</b></button>` : ''}
      <div class="chips">${[['open', L('Open', 'Открыто')], ['closed', L('Closed', 'Закрыто')], ['all', L('All', 'Все')]].map(([k2, l]) => `<button class="chip ${v.f === k2 ? 'on' : ''}" onclick="VS.NC.f='${k2}';PX.ncrRoute('')">${l}</button>`).join('')}${[['ei', 'E&I'], ['', L('All disciplines', 'Все дисциплины')]].map(([k2, l]) => `<button class="chip ${v.e === k2 ? 'on' : ''}" onclick="VS.NC.e='${k2}';PX.ncrRoute('')">${l}</button>`).join('')}</div>
      <input class="fin" placeholder="${L('Filter: tag, text, NCR No…', 'Фильтр: тег, текст, №…')}" value="${esc(v.q)}" onchange="VS.NC.q=this.value;PX.ncrRoute('')">
      <div class="list">${Lst.map(n => `<button class="li" onclick="go('#/ncr/${enc(n.no)}')"><div class="m"><div class="t">${n.ei ? '⚡' : '🏗️'} ${esc(n.ncr || '№ ' + n.no)} · ${esc(n.loc)}</div><div class="s">${esc((n.en || n.ru).slice(0, 140))}</div><div class="s" style="color:var(--mut)">${esc(n.disc)} · ${L('opened', 'открыто')} ${esc(n.di)}${isOpen(n) && age(n.di) != null ? ' (' + age(n.di) + ' ' + L('days', 'дн.') + ')' : ''}${n.tgt ? ' · 🎯 ' + esc(n.tgt) : ''}</div></div><div class="r"><span class="badge ${isOpen(n) ? 'b-no' : 'b-ok'}">${esc(n.st)}</span></div><span class="chev">›</span></button>`).join('') || '<div class="empty">' + L('Nothing found', 'Ничего нет') + '</div>'}</div>
      <div class="foot">${L('Source', 'Источник')}: ${esc(PX.ncr.src)}</div>`; };
  PX.ncrCopy = function () { const E = mineN().filter(n => isOpen(n) && n.ei);
    const t = `Paul – open E&I NCR (${PRJ}):\n` + E.map(n => `${n.ncr || n.no} · opened ${n.di}${n.tgt ? ' · target ' + n.tgt : ''} · ${n.loc} · ${(n.en || n.ru).split('\n')[0].slice(0, 90)}`).join('\n');
    try { navigator.clipboard.writeText(t).then(() => toast(L('Copied – send to Paul', 'Скопировано – отправьте Паулю'))); } catch (e) { prompt('Copy', t); } };
})();
