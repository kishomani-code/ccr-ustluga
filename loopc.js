// v4.35 (08.11.2026): COMMISSIONING → Loop check (phase 1).
// Source: this project's system graph (D.sg: device-to-device links and the cables on them) and cable records (C).
// Loop = one device-to-device link. Circuit = one cable on that link. Counts come from the data, nothing is estimated.
// Anything not in the project data is shown as NOT VERIFIED. Acceptance values come from the project spec / ITP, not from this app.
(function () {
  const LC = window.LC = {f: {s: '', st: '', q: ''}};
  const AREAS = ['CCR', 'D48', '1801', '8810'];
  const KEY = 'lc_status_v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const ST = [
    {k: 'pend', en: 'Pending', ru: 'Ожидает', c: 'b-na'},
    {k: 'pre', en: 'Pre-check done', ru: 'Предпроверка', c: 'b-part'},
    {k: 'wire', en: 'Wiring checked', ru: 'Монтаж проверен', c: 'b-part'},
    {k: 'loop', en: 'Loop checked', ru: 'Петля проверена', c: 'b-part'},
    {k: 'fail', en: 'Failed', ru: 'Не пройдено', c: 'b-no'},
    {k: 'acc', en: 'Accepted', ru: 'Принято', c: 'b-ok'}
  ];
  const SK = k => ST.find(s => s.k === k) || ST[0];
  const NV = `<span class="badge b-no" style="font-weight:600">NOT VERIFIED</span>`;
  const STEPS = [
    [L('1 · Document verification', '1 · Проверка документов'), L('P&ID, loop diagram, I/O list, cable schedule, termination drawings, datasheets, control philosophy, C&E where applicable.', 'P&ID, схема петли, I/O list, кабельный журнал, схемы подключения, опросные листы, philosophy, C&E (если есть).')],
    [L('2 · Pre-commissioning inspection', '2 · Предварительный осмотр'), L('Tag, mounting, cable ID, gland and termination, earthing and shield, JB and panel identification, equipment condition.', 'Бирка, монтаж, маркировка кабеля, кабельный ввод и заделка, заземление и экран, идентификация JB и щита, состояние оборудования.')],
    [L('3 · Wiring verification', '3 · Проверка монтажа'), L('Terminal-to-terminal, cores against drawing, continuity, polarity, shield. Insulation test only where permitted; isolate sensitive electronics first.', 'Клемма-клемма, жилы по схеме, прозвонка, полярность, экран. Изоляция только где разрешено; чувствительную электронику отключить.')],
    [L('4 · Calibration / simulation', '4 · Калибровка / имитация'), L('Certificate, range, units, zero and span, intermediate points. Record actual values.', 'Сертификат, диапазон, единицы, нуль и шкала, промежуточные точки. Зафиксировать фактические значения.')],
    [L('5 · Field to control room', '5 · От поля до АСУ'), L('Inject or simulate the approved signal; check correct channel, tag mapping, engineering value, alarm limits, fault indication.', 'Подать или имитировать сигнал; проверить канал, привязку тега, значение, уставки сигнализации, индикацию неисправности.')],
    [L('6 · Output loop', '6 · Выходная петля'), L('Controller output, output card, relays and isolators, actuator or solenoid response, valve feedback, fail-safe action against design.', 'Выход контроллера, карта вывода, реле и барьеры, отклик привода или соленоида, обратная связь арматуры, режим отказа по проекту.')],
    [L('7 · Functional verification', '7 · Функциональная проверка'), L('Approved logic, permissives and interlocks, alarms and trips, feedback, sequence, Cause & Effect.', 'Логика по проекту, разрешения и блокировки, сигнализация и защиты, обратная связь, последовательность, Cause & Effect.')],
    [L('8 · Documentation and acceptance', '8 · Документация и приёмка'), L('Results, defects, punch items for failures, loop-check sheet, signatures, test records attached, acceptance status.', 'Результаты, дефекты, punch по отказам, лист проверки петли, подписи, приложенные протоколы, статус приёмки.')]
  ];
  const SAFE = L('Hold points: Permit to Work · LOTO and isolation check · gas test where required · hazardous-area limits · IS circuit precautions · approval before energisation · no bypass of ESD / SIS / F&G without authorisation.', 'Hold points: Permit to Work · LOTO и проверка изоляции · газовый контроль где нужно · ограничения взрывоопасных зон · меры для ИБ-цепей · разрешение перед подачей питания · без обхода ESD / SIS / F&G без разрешения.');

  // ---------- status store (this phone; shared export comes in a later phase)
  let S = null;
  function load() { if (S) return S; try { S = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { S = {}; } return S; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function cSt(t) { const x = load()[t]; return x && x.s ? x.s : 'pend'; }
  function lStat(l) { const v = l.cs.map(c => cSt(c.t)); if (v.includes('fail')) return 'fail'; if (v.every(x => x === 'acc')) return 'acc'; if (v.every(x => x === 'pend')) return 'pend'; return 'part'; }
  function lBadge(l) { const s = lStat(l); if (s === 'part') { const n = l.cs.filter(c => cSt(c.t) === 'acc').length; return `<span class="badge b-part">${n}/${l.cs.length} ${L('accepted', 'принято')}</span>`; } const x = SK(s === 'acc' ? 'acc' : s === 'fail' ? 'fail' : 'pend'); return `<span class="badge ${x.c}">${L(x.en, x.ru)}</span>`; }

  // ---------- data (current project only)
  let B = null, BP = null;
  function ok() { return AREAS.includes(PRJ); }
  function build() {
    if (B && BP === PRJ) return B;
    const sys = [], byId = {}, circ = [], seen = {};
    Object.keys((D && D.sg) || {}).forEach(s => {
      const g = D.sg[s] || {}, n = g.n || [], e = g.e || [];
      const loops = [];
      e.forEach((ed, i) => {
        const cs = (ed[2] || []).map(ci => C[ci]).filter(Boolean);
        if (!cs.length) return;
        const id = s + '~' + i;
        const l = {id, sys: s, a: (n[ed[0]] || [])[0] || '', b: (n[ed[1]] || [])[0] || '', cs};
        loops.push(l); byId[id] = l;
        cs.forEach(c => { c._lp = id; c._sy = s; if (!seen[c.t]) { seen[c.t] = 1; circ.push(c); } });
      });
      if (loops.length) sys.push({s, loops, n: loops.reduce((x, l) => x + l.cs.length, 0)});
    });
    B = {sys, byId, circ}; BP = PRJ; return B;
  }
  function tot(B_) {
    const r = {loops: 0, circ: B_.circ.length, acc: 0, fail: 0, pend: 0, pre: 0};
    Object.values(B_.byId).forEach(l => r.loops++);
    B_.circ.forEach(c => { const s = cSt(c.t); if (s === 'acc') r.acc++; else if (s === 'fail') r.fail++; else if (s === 'pend') r.pend++; else r.pre++; });
    return r;
  }
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const sysName = s => { try { return (typeof window.sysName === 'function' && window.sysName(s)) || ''; } catch (e) { return ''; } };
  const who = () => (typeof PS_ !== 'undefined' && PS_.name) || '';
  const today = () => new Date().toLocaleDateString('ru-RU');

  // ---------- actions
  LC.set = function (t, k) { t = dec(t); const s = load(); s[t] = Object.assign({}, s[t] || {}, {s: k, by: who(), d: today()}); save(); route(); };
  LC.rem = function (t, v) { t = dec(t); const s = load(); s[t] = Object.assign({}, s[t] || {}, {r: String(v || '').slice(0, 300), by: who(), d: today()}); save(); };
  LC.ok = ok;

  // ---------- home tile (added to the main menu for own areas only)
  LC.tile = function () {
    const n = build().sys.reduce((x, s) => x + s.loops.length, 0);
    return `<div class="sect">🏁 ${L('Commissioning', 'Пусконаладка')}</div><div class="grid"><button class="tile main" onclick="go('#/lc')"><b>🔌 ${L('Loop check', 'Проверка петель')}<br><span style="font-weight:400;font-size:12px">${L('device → device · circuits · status', 'устройство → устройство · цепи · статус')}</span></b><div><span class="n">${n} ${L('loops', 'петель')} · ${PRJ}</span></div></button></div>`;
  };

  // ---------- routing
  LC.route = function (rest) {
    window.scrollTo(0, 0);
    const k = rest[0] || '', a = dec(rest.slice(1).join('/'));
    const back = `<button class="chip" onclick="go('#/lc')">‹ ${L('Commissioning', 'Пусконаладка')}</button>`;
    const B_ = build();
    if (k === 'sys') return a ? sysPage(a, B_, back) : sysIndex(B_, back);
    if (k === 'loop') return loopPage(a, B_, back);
    if (k === 'prog') return progPage(B_, back);
    if (k === 'reg') return regPage(B_, back);
    if (k === 'pf') return pfPage(B_, back);
    return home(B_);
  };

  function home(B_) {
    const t = tot(B_);
    setHead('🔌 ' + L('Loop check', 'Проверка петель'), `${PRJ} · ${B_.sys.length} ${L('systems', 'систем')}`);
    const tile = (k, ttl, sub) => `<button class="tile" onclick="go('#/lc/${k}')"><b>${ttl}</b><span class="n">${sub}</span></button>`;
    main.innerHTML = `
      <div class="card"><div class="h3">${L('Own area only', 'Только своя зона')} · ${PRJ}</div>
        <div class="kv"><div>${L('Loops', 'Петли')}</div><div><b>${t.loops}</b> ${L('device-to-device links', 'связей устройство-устройство')}</div>
        <div>${L('Circuits', 'Цепи')}</div><div><b>${t.circ}</b> ${L('cables on these links', 'кабелей на этих связях')}</div>
        <div>${L('Accepted', 'Принято')}</div><div><b style="color:var(--ok)">${t.acc}</b> / ${t.circ} ${L('circuits', 'цепей')} · ${pct(t.acc, t.circ)}%</div>
        <div>${L('Failed', 'Не пройдено')}</div><div><b style="color:var(--bad)">${t.fail}</b></div></div>
        <div class="note" style="margin-top:10px">${L('A loop is one device-to-device link from the cable data; a circuit is one cable on that link. Subsystem, I/O card, channel and terminal data are not in the project data yet: they show as NOT VERIFIED.', 'Петля — одна связь устройство-устройство по данным кабелей; цепь — один кабель на этой связи. Подсистема, карта I/O, канал и клемма пока не в данных проекта: показываются как NOT VERIFIED.')}</div>
      </div>
      <div class="sect">${L('Menu', 'Меню')}</div>
      <div class="grid">${tile('sys', '🧭 ' + L('Loop check by system', 'Проверка по системам'), B_.sys.length + ' ' + L('systems', 'систем'))}${tile('prog', '📈 ' + L('Loop check progress', 'Ход проверки'), pct(t.acc, t.circ) + '% ' + L('accepted', 'принято'))}${tile('reg', '📋 ' + L('Loop check register', 'Реестр петель'), t.circ + ' ' + L('circuits · filters', 'цепей · фильтры'))}${tile('pf', '⚠️ ' + L('Pending / failed', 'Ожидает / не пройдено'), t.pend + ' ' + L('pending', 'ожидает') + ' · ' + t.fail + ' ' + L('failed', 'не пройдено'))}</div>
      <div class="sect">${L('Next phase', 'Следующий этап')}</div>
      <div class="grid"><div class="tile" style="opacity:.6"><b>🧾 ${L('Loop check reports', 'Отчёты')}</b><span class="n">${L('sheets · registers · client records', 'листы · реестры · записи для клиента')}</span></div><div class="tile" style="opacity:.6"><b>🏁 ${L('Commissioning status', 'Статус пусконаладки')}</b><span class="n">${L('system completion', 'готовность систем')}</span></div></div>
      <div class="foot">${esc(SAFE)}</div>`;
  }

  function sysIndex(B_, back) {
    setHead('🧭 ' + L('Loop check by system', 'Проверка по системам'), PRJ + ' · ' + B_.sys.length + ' ' + L('systems', 'систем'));
    main.innerHTML = `<div class="chips">${back}</div><div class="list">${B_.sys.map(x => {
      const acc = x.loops.reduce((n, l) => n + l.cs.filter(c => cSt(c.t) === 'acc').length, 0);
      return `<button class="li" onclick="go('#/lc/sys/${enc(x.s)}')"><div class="m"><div class="t">${esc(x.s)} · ${esc(sysName(x.s))}</div><div class="s">${x.loops.length} ${L('loops', 'петель')} · ${x.n} ${L('circuits', 'цепей')} · ${L('accepted', 'принято')} ${acc}</div><div class="pbar"><i style="width:${pct(acc, x.n)}%"></i></div></div><div class="r"><div class="pc">${pct(acc, x.n)}%</div></div><span class="chev">›</span></button>`;
    }).join('')}</div>`;
  }

  function sysPage(s, B_, back) {
    const x = B_.sys.find(y => y.s === s);
    setHead('🧭 ' + s, sysName(s) || PRJ);
    if (!x) { main.innerHTML = `<div class="chips">${back}</div><div class="empty">${L('Nothing found', 'Ничего не найдено')}</div>`; return; }
    const acc = x.loops.reduce((n, l) => n + l.cs.filter(c => cSt(c.t) === 'acc').length, 0);
    main.innerHTML = `<div class="chips">${back}</div>
      <div class="card"><div class="kv"><div>${L('System', 'Система')}</div><div><b>${esc(s)}</b> · ${esc(sysName(s))}</div>
        <div>${L('Subsystem', 'Подсистема')}</div><div>${NV} ${L('not in cable data yet', 'пока нет в данных кабелей')}</div>
        <div>${L('Loops', 'Петли')}</div><div>${x.loops.length}</div>
        <div>${L('Circuits', 'Цепи')}</div><div>${x.n} · ${L('accepted', 'принято')} ${acc} (${pct(acc, x.n)}%)</div></div>
        <div class="pbar" style="margin-top:8px"><i style="width:${pct(acc, x.n)}%"></i></div></div>
      <div class="sect">${L('Loops (device → device)', 'Петли (устройство → устройство)')}</div>
      <div class="list">${x.loops.map(l => `<button class="li" onclick="go('#/lc/loop/${enc(l.id)}')"><div class="m"><div class="t">${esc(l.a || '–')} → ${esc(l.b || '–')}</div><div class="s">${l.cs.length} ${L('circuit(s)', 'цепь(ей)')} · ${esc(l.cs.map(c => c.t).slice(0, 3).join(', '))}${l.cs.length > 3 ? ' …' : ''}</div></div><div class="r">${lBadge(l)}</div><span class="chev">›</span></button>`).join('')}</div>`;
  }

  function loopPage(id, B_, back) {
    const l = B_.byId[id];
    if (!l) { setHead('Loop', ''); main.innerHTML = `<div class="chips">${back}</div><div class="empty">${L('Loop not found', 'Петля не найдена')}</div>`; return; }
    setHead('🔌 ' + l.a + ' → ' + l.b, l.sys);
    const st = load();
    const path = `<div class="h3">${L('Signal path (device to device)', 'Путь сигнала (устройство-устройство)')}</div>
      <div class="kv" style="grid-template-columns:1fr"><div style="font-weight:600">${esc(l.a || '–')}</div></div>
      ${l.cs.map(c => `<div class="cbx" style="margin:6px 0"><div><b style="word-break:break-all">${esc(c.t)}</b> <span class="s2">${esc(c.f || '–')} → ${esc(c.o || '–')}</span></div><div class="s2">${L('Type', 'Тип')} ${esc(c.ty || '–')} · ${L('cores', 'жил')} ${esc(c.c || '–')} · ${L('length', 'длина')} ${esc(c.ln || '–')} m · ${L('drum', 'барабан')} ${esc(c.dr || '–')}</div></div>`).join('')}
      <div style="font-weight:600">${esc(l.b || '–')}</div>
      <div class="note" style="margin-top:8px">${L('Not in data yet:', 'Нет в данных:')} ${NV} ${L('I/O card · channel · terminal · JB · marshalling cabinet · signal type · voltage / current', 'карта I/O · канал · клемма · JB · шкаф маршализации · тип сигнала · напряжение / ток')}</div>`;
    const circs = l.cs.map(c => {
      const cur = cSt(c.t), r = (st[c.t] && st[c.t].r) || '', m = st[c.t] || {};
      return `<div class="card"><div class="big" style="font-size:15px">${esc(c.t)}</div>
        <div class="s2">${esc(c.f || '–')} → ${esc(c.o || '–')} · ${L('room', 'помещение')} ${esc(c.fr || '–')} → ${esc(c.tr || '–')}</div>
        <div class="chips" style="margin-top:8px">${ST.map(s => `<button class="chip ${cur === s.k ? 'on' : ''}" onclick="LC.set('${enc(c.t)}','${s.k}')">${L(s.en, s.ru)}</button>`).join('')}</div>
        <input class="fin" style="margin-top:6px" value="${esc(r)}" placeholder="${L('Remarks', 'Примечания')}" onchange="LC.rem('${enc(c.t)}',this.value)">
        <div class="s2">${m.by ? esc(m.by) + ' · ' + esc(m.d) : L('not yet tested', 'ещё не проверено')}</div></div>`;
    }).join('');
    const steps = `<details class="card"><summary style="font-weight:600;cursor:pointer">${L('Loop check procedure (method)', 'Методика проверки петли')}</summary>
      <div style="margin-top:8px">${STEPS.map(s => `<div style="margin-bottom:8px"><b>${s[0]}</b><div class="s2" style="font-size:13px">${s[1]}</div></div>`).join('')}</div>
      <div class="note">${esc(SAFE)}</div>
      <div class="s2" style="margin-top:6px">${L('Acceptance values: per project spec / ITP', 'Значения приёмки: по спецификации проекта / ITP')} ${NV}</div></details>`;
    main.innerHTML = `<div class="chips">${back}<button class="chip" onclick="go('#/lc/sys/${enc(l.sys)}')">‹ ${esc(l.sys)}</button></div><div class="card"><div class="kv"><div>${L('Source', 'Источник')}</div><div>${esc(l.a || '–')}</div><div>${L('Destination', 'Назначение')}</div><div>${esc(l.b || '–')}</div><div>${L('Circuits', 'Цепи')}</div><div>${l.cs.length}</div></div></div>
      <div class="card">${path}</div>${steps}<div class="sect">${L('Circuit checks', 'Проверка цепей')}</div>${circs}`;
  }

  function progPage(B_, back) {
    setHead('📈 ' + L('Loop check progress', 'Ход проверки'), PRJ);
    main.innerHTML = `<div class="chips">${back}</div><div class="list">${B_.sys.map(x => {
      const acc = x.loops.reduce((n, l) => n + l.cs.filter(c => cSt(c.t) === 'acc').length, 0);
      const fail = x.loops.reduce((n, l) => n + l.cs.filter(c => cSt(c.t) === 'fail').length, 0);
      return `<button class="li" onclick="go('#/lc/sys/${enc(x.s)}')"><div class="m"><div class="t">${esc(x.s)} · ${esc(sysName(x.s))}</div><div class="s">${x.loops.length} ${L('loops', 'петель')} · ${x.n} ${L('circuits', 'цепей')} · ${L('failed', 'не пройдено')} ${fail}</div><div class="pbar"><i style="width:${pct(acc, x.n)}%"></i></div></div><div class="r"><div class="pc">${pct(acc, x.n)}%</div></div><span class="chev">›</span></button>`;
    }).join('')}</div>`;
  }

  function regPage(B_, back) {
    setHead('📋 ' + L('Loop check register', 'Реестр петель'), PRJ);
    const f = LC.f;
    const rows = B_.circ.filter(c => (!f.s || c._sy === f.s) && (!f.st || cSt(c.t) === f.st) && (!f.q || (c.t + ' ' + c._lp + ' ' + (c.f || '') + ' ' + (c.o || '')).toLowerCase().includes(f.q.toLowerCase())));
    const L2 = B_.byId;
    main.innerHTML = `<div class="chips">${back}</div>
      <div class="card"><input class="fin" value="${esc(f.q)}" placeholder="${L('Search cable, device, loop', 'Поиск: кабель, устройство, петля')}" oninput="LC.f.q=this.value;LC.refresh()">
        <div class="mgf"><select onchange="LC.f.s=this.value;LC.refresh()"><option value="">${L('All systems', 'Все системы')}</option>${B_.sys.map(x => `<option value="${esc(x.s)}" ${f.s === x.s ? 'selected' : ''}>${esc(x.s)}</option>`).join('')}</select>
        <select onchange="LC.f.st=this.value;LC.refresh()"><option value="">${L('All statuses', 'Все статусы')}</option>${ST.map(s => `<option value="${s.k}" ${f.st === s.k ? 'selected' : ''}>${L(s.en, s.ru)}</option>`).join('')}</select></div>
        <div class="s2">${rows.length} ${L('circuits', 'цепей')}</div></div>
      <div class="mgw"><table class="mgtb"><tr><th>${L('Cable', 'Кабель')}</th><th>${L('Loop', 'Петля')}</th><th>${L('From', 'От')}</th><th>${L('To', 'К')}</th><th>${L('Status', 'Статус')}</th></tr>${rows.slice(0, 300).map(c => { const s = SK(cSt(c.t)); const l = L2[c._lp]; return `<tr onclick="go('#/lc/loop/${enc(c._lp)}')"><td>${esc(c.t)}</td><td>${esc(l ? l.a + ' → ' + l.b : '')}</td><td>${esc(c.f || '')}</td><td>${esc(c.o || '')}</td><td><span class="badge ${s.c}">${L(s.en, s.ru)}</span></td></tr>`; }).join('')}</table></div>
      ${rows.length > 300 ? `<div class="s2" style="margin-top:6px">${L('First 300 shown – narrow the filter', 'Показаны первые 300 – сузьте фильтр')}</div>` : ''}`;
  }
  LC.refresh = function () { route(); };

  function pfPage(B_, back) {
    setHead('⚠️ ' + L('Pending / failed', 'Ожидает / не пройдено'), PRJ);
    const li = (c) => { const l = B_.byId[c._lp]; const s = SK(cSt(c.t)); return `<button class="li" onclick="go('#/lc/loop/${enc(c._lp)}')"><div class="m"><div class="t">${esc(c.t)}</div><div class="s">${esc(l ? l.a + ' → ' + l.b : '')} · ${esc(l ? l.sys : '')}</div></div><span class="badge ${s.c}">${L(s.en, s.ru)}</span><span class="chev">›</span></button>`; };
    const fail = B_.circ.filter(c => cSt(c.t) === 'fail'), pend = B_.circ.filter(c => cSt(c.t) === 'pend');
    main.innerHTML = `<div class="chips">${back}</div>
      <div class="sect">${L('Failed', 'Не пройдено')} (${fail.length})</div><div class="list">${fail.slice(0, 300).map(li).join('') || `<div class="empty">–</div>`}</div>
      <div class="sect">${L('Pending', 'Ожидает')} (${pend.length})</div><div class="list">${pend.slice(0, 300).map(li).join('') || `<div class="empty">–</div>`}</div>
      ${(fail.length > 300 || pend.length > 300) ? `<div class="s2" style="margin-top:6px">${L('First 300 shown per list', 'Показаны первые 300 в каждом списке')}</div>` : ''}`;
  }
})();
