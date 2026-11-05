// v4.24: Subsystem handover before GAS-IN (07.11.2026) – client handover list per subsystem with target (MC forecast) date,
// handover status, open punches A/B/C, IWP remaining, cables to pull / terminate, suggested men and action.
// handover.json = {ver, date, gas, note, subs:[{rank,tit,prj,area,sub,nm,disc,pri,red,krit,st,done,insp,pa,pb,pc,pbefore,poth,iwp,mc,block,resp,act,why,ctq,tq,grp,pull,term,rfi,men,sv,fin,defer}]}
// Rebuild: python3 tools/build_handover.py <GAS-IN priority workbook>
(function () {
  const HO = window.HO = {d: null, by: {}};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || !Array.isArray(d.subs)) return; const first = !HO.d; HO.d = d; HO.by = {}; d.subs.forEach(s => HO.by[s.sub] = s);
    const n = document.getElementById('hon'); if (n) n.innerHTML = HO.sum();
    if (first && /^#\/(ho|c|p|i|s|pi)(\/|$)/.test(location.hash)) { try { route(); } catch (e) {} } }
  HO.load = function () { cget('handover.json').then(d => { if (d) set(d); return net('handover.json'); }).then(d => { if (d && (!HO.d || d.ver !== HO.d.ver)) set(d); }).catch(() => {}); };
  const dt = s => { const m = String(s || '').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const daysTo = s => { const d = dt(s); return d ? Math.round((d - today()) / 864e5) : null; };
  const mine = () => (HO.d ? HO.d.subs.filter(s => s.prj === PRJ) : []);
  const GRP = {1: [L('Outdoor / field – not handed over (needs work permit after gas-in)', 'Наружные – не переданы (после пуска газа нужен наряд-допуск)'), '#b42318'],
    2: [L('Red chain / client priority 0–1 – not handed over', 'Красная цепочка / приоритет 0–1 – не переданы'), '#c55a11'],
    3: [L('In client critical list with open A punches', 'В критике заказчика, есть замечания A'), '#b54708'],
    4: [L('Other subsystems not handed over', 'Прочие не переданные подсистемы'), '#8a6d00'],
    6: [L('Handed over – but A/B punches still open', 'Переданы – но есть открытые A/B'), '#1a73e8'],
    7: [L('Handed over – done, monitor only', 'Переданы – выполнено'), '#1f6f43']};
  const stB = s => s.done ? `<span class="badge b-ok" data-nt>${L('Handed over', 'Передана')}</span>` : /^Not in/i.test(s.st) ? `<span class="badge b-no" data-nt>${L('Not inspected', 'Не проверена')}</span>` : /отказ|reject/i.test(s.st) ? `<span class="badge b-no" data-nt>${L('Rejected', 'Отказ')}</span>` : /Inspected/i.test(s.st) ? `<span class="badge b-part" data-nt>${L('Act on signing', 'Акт на подписании')}</span>` : `<span class="badge b-no" data-nt>${L('Not inspected', 'Не проверена')}</span>`;
  const mcB = s => { if (!s.mc) return ''; if (/выполн/i.test(s.mc)) return `<span class="badge b-ok" data-nt>MC ${esc(s.mc)}</span>`; const d = daysTo(s.mc); return `<span class="badge ${d != null && d < 0 && !s.done ? 'b-no' : 'b-na'}" data-nt>${L('Target', 'Срок')} ${esc(s.mc)}${d != null && d < 0 && !s.done ? ' · ' + L('late', 'просрочено') + ' ' + (-d) + 'd' : ''}</span>`; };
  HO.sum = function () { if (!HO.d) return L('loading…', 'загрузка…'); const L2 = mine(); if (!L2.length) return L('no subsystems in the handover list for this area', 'нет подсистем в перечне по этой зоне');
    const nh = L2.filter(s => !s.done).length; const d = daysTo(HO.d.gas);
    return `${nh} ${L('not handed over', 'не передано')} / ${L2.length} · A ${L2.reduce((a, s) => a + s.pa, 0)} · ${d != null ? (d > 0 ? d + ' ' + L('days to gas-in', 'дн. до пуска газа') : d === 0 ? L('GAS-IN TODAY', 'ПУСК ГАЗА СЕГОДНЯ') : L('after gas-in – permits needed', 'после пуска газа – нужны допуски')) : ''}`; };
  HO.tile = function () { return `<button class="tile" style="width:100%;min-height:auto;margin-bottom:6px;background:#b42318;color:#fff;border-color:#b42318" onclick="go('#/ho')"><b>🚩 ${L('Subsystem handover before GAS-IN', 'Передача подсистем до пуска газа')} ${HO.d ? esc(HO.d.gas) : '07.11.2026'}</b><span class="n" id="hon" style="color:#ffe1dc;display:block">${HO.sum()}</span></button>`; };
  function row(s) { return `<button class="li" onclick="go('#/ho/${enc(s.sub)}')"><div class="m"><div class="t" data-nt>${esc(s.sub)} <span style="font-weight:400;color:var(--mut)">#${s.rank}</span></div><div class="s" style="white-space:normal">${esc(s.nm)}</div>
      <div style="margin-top:3px">${stB(s)} ${mcB(s)} ${s.area === 'Outdoor' ? `<span class="badge b-na" data-nt>${L('Outdoor', 'Наружн.')}</span>` : ''}</div>
      <div class="s">${L('Open punch', 'Замечания')} A <b style="color:${s.pa ? 'var(--bad)' : 'inherit'}">${s.pa}</b> · B ${s.pb} · C ${s.pc}${s.iwp && !/^0 m \/ 0 pc$/.test(s.iwp) ? ' · IWP ' + esc(s.iwp) : ''}${s.pull || s.term ? ' · ' + L('cables', 'кабели') + ' ' + s.pull + ' ' + L('to pull', 'протянуть') + ' / ' + s.term + ' ' + L('to terminate', 'расключить') : ''}${s.men ? ' · 👷 ' + s.men : ''}</div></div><span class="chev">›</span></button>`; }
  HO.home = function () {
    setHead(L('Handover before GAS-IN', 'Передача до пуска газа'), HO.d ? `${PRJ} · ${L('client list', 'перечень заказчика')} ${HO.d.date}` : '');
    if (!HO.d) { main.innerHTML = '<div class="empty">Loading…</div>'; return; }
    const A = mine(); VS.HO = VS.HO || {f: 'open', q: ''}; const v = VS.HO; const d = daysTo(HO.d.gas);
    const nh = A.filter(s => !s.done), late = nh.filter(s => { const x = daysTo(s.mc); return x != null && x < 0; });
    const q = v.q.trim().toUpperCase();
    const L2 = A.filter(s => (v.f === 'all' || (v.f === 'open' ? !s.done : v.f === 'ab' ? (s.pa + s.pb) > 0 : v.f === 'out' ? s.area === 'Outdoor' : s.done)) && (!q || (s.sub + ' ' + s.nm + ' ' + s.disc).toUpperCase().includes(q)));
    const groups = {}; L2.forEach(s => (groups[s.grp] = groups[s.grp] || []).push(s));
    main.innerHTML = `<div style="background:linear-gradient(135deg,#7a1010,#b42318);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px">
        <div style="font-size:18px;font-weight:700">🔥 GAS-IN ${esc(HO.d.gas)}${d != null ? ' · ' + (d > 0 ? d + ' ' + L('days left', 'дн. осталось') : d === 0 ? L('TODAY', 'СЕГОДНЯ') : L('done – permits needed now', 'прошёл – теперь нужны допуски')) : ''}</div>
        <div style="font-size:13px;opacity:.92;margin-top:3px">${L('After gas-in every site job needs a work permit – minimum 1 week to get one. Finish outdoor work and close A punches first.', 'После пуска газа на любые работы нужен наряд-допуск – оформление минимум 1 неделя. Сначала наружные работы и замечания категории A.')}</div></div>
      ${A.length ? `<div class="kpi"><div><b>${A.length}</b><span>${L('subsystems', 'подсистем')}</span></div><div><b style="color:var(--bad)">${nh.length}</b><span>${L('not handed over', 'не передано')}</span></div><div><b style="color:var(--bad)">${late.length}</b><span>${L('past target date', 'срок прошёл')}</span></div></div>
      <div class="kpi"><div><b style="color:var(--bad)">${A.reduce((a, s) => a + s.pa, 0)}</b><span>${L('open A', 'открытых A')}</span></div><div><b style="color:var(--warn)">${A.reduce((a, s) => a + s.pb, 0)}</b><span>${L('open B', 'открытых B')}</span></div><div><b>${A.reduce((a, s) => a + s.pc, 0)}</b><span>${L('open C', 'открытых C')}</span></div></div>
      <div class="chips">${[['open', L('Not handed over', 'Не переданы')], ['out', L('Outdoor', 'Наружные')], ['ab', L('A/B open', 'Есть A/B')], ['done', L('Handed over', 'Переданы')], ['all', L('All', 'Все')]].map(([k, l]) => `<button class="chip ${v.f === k ? 'on' : ''}" onclick="VS.HO.f='${k}';HO.home()">${l}</button>`).join('')}</div>
      <input class="fin" placeholder="${L('Filter: subsystem, name, discipline…', 'Фильтр: подсистема, название…')}" value="${esc(v.q)}" oninput="VS.HO.q=this.value;clearTimeout(HO.tm);HO.tm=setTimeout(()=>{HO.home();const i=document.querySelector('.fin');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},400)">
      ${Object.keys(groups).sort((a, b) => a - b).map(g => `<div class="sect" style="color:${(GRP[g] || ['', ''])[1]}">${esc((GRP[g] || [L('Group', 'Группа') + ' ' + g])[0])} (${groups[g].length})</div><div class="list">${groups[g].sort((a, b) => a.rank - b.rank).map(row).join('')}</div>`).join('') || '<div class="empty">' + L('Nothing found', 'Ничего не найдено') + '</div>'}`
      : `<div class="empty">${L('This area is not in the client handover list (list covers CCR building, D48 and 8810).', 'Этой зоны нет в перечне передачи (перечень: здание ЦО, D48 и 8810).')}</div>`}
      <div style="font-size:11px;color:var(--mut);margin:8px 2px">${L('Source: client subsystem handover workbook', 'Источник: перечень передачи подсистем заказчика')} ${esc(HO.d.date)} · ${L('target = MC forecast date (ПК-1)', 'срок = прогнозная дата МС (ПК-1)')}</div>`;
  };
  const kv2 = rows => `<div style="display:grid;grid-template-columns:40% 60%;gap:4px 8px;font-size:13px">${rows.filter(r => r[1] !== '' && r[1] != null).map(([k, x]) => `<div style="color:var(--mut)">${k}</div><div data-nt style="white-space:normal">${esc(String(x))}</div>`).join('')}</div>`;
  HO.view = function (sub) { const s = HO.by[sub]; if (!s) { HO.home(); return; }
    setHead(s.sub, L('Handover before GAS-IN', 'Передача до пуска газа') + ' ' + (HO.d.gas || ''));
    main.innerHTML = `<div class="card"><div class="big" data-nt>${esc(s.sub)}</div><div style="font-size:13px;margin:4px 0">${esc(s.nm)}</div><div>${stB(s)} ${mcB(s)}</div></div>
      <div class="card" style="border-left:5px solid #b42318"><div class="h3">🛠 ${L('What to do', 'Что делать')}</div><div style="font-size:14px;font-weight:600" data-nt>${esc(s.act)}</div>
        <div class="s" style="margin-top:4px" data-nt>${esc(s.why)}</div>${s.fin ? `<div class="s" data-nt>${L('Finish by', 'Завершить')}: ${esc(s.fin)}</div>` : ''}${s.men ? `<div class="s">👷 ${L('Men suggested 04–06.11', 'Людей 04–06.11')}: <b>${s.men}</b>${s.sv ? ' · ' + esc(s.sv) : ''}</div>` : ''}${s.defer ? `<div class="s" style="color:var(--bad)" data-nt>${esc(s.defer)}</div>` : ''}</div>
      <div class="kpi"><div><b style="color:${s.pa ? 'var(--bad)' : 'var(--ok)'}">${s.pa}</b><span>${L('open A', 'открытых A')}</span></div><div><b style="color:${s.pb ? 'var(--warn)' : 'var(--ok)'}">${s.pb}</b><span>${L('open B', 'открытых B')}</span></div><div><b>${s.pc}</b><span>${L('open C', 'открытых C')}</span></div></div>
      <div class="chips"><button class="chip on" onclick="go('#/pk/s:${enc(s.sub)}')">📝 ${L('Open punches of this subsystem', 'Замечания подсистемы')}</button><button class="chip" onclick="go('#/s/${enc(s.sub)}')">🔍 ${L('Cables / IWP / tags', 'Кабели / IWP / теги')}</button></div>
      <div class="card"><div class="h3">${L('Details', 'Подробно')}</div>${kv2([[L('Title / area', 'Титул / зона'), s.tit + ' · ' + s.area], [L('Discipline', 'Дисциплина'), s.disc], [L('Client priority', 'Приоритет'), s.pri], [L('Red chain', 'Красная цепочка'), s.red], [L('Client critical list', 'Критика'), s.krit],
        [L('Handover status', 'Статус передачи'), s.st], [L('Inspection', 'Инспекция'), s.insp], [L('Target (MC forecast)', 'Срок (прогноз МС)'), s.mc], [L('Punches before PNR handover', 'Замечания до передачи в ПНР'), s.pbefore], [L('Open punches other resp. (GA/GSP) total / A+B', 'Замечания других (ГА/ГСП) всего / A+B'), s.poth],
        [L('IWP remaining', 'Остаток IWP'), s.iwp], [L('Cables to pull', 'Кабели протянуть'), s.pull], [L('Cables to terminate', 'Кабели расключить'), s.term], [L('Cables RFI needed', 'Кабели – нужен RFI'), s.rfi], [L('Open CTQ / NT', 'Открытые CTQ'), s.ctq], [L('Open client TQ', 'Открытые TQ'), s.tq],
        [L('Client commissioning responsible', 'Ответственный ПНР заказчика'), s.resp], [L('Client comment', 'Комментарий заказчика'), s.block], [L('Rank', 'Ранг'), s.rank]])}</div>
      ${window.GA ? GA.card('', [s.sub]) : ''}`;
  };
  // card on cable / panel / IWP / punch pages
  HO.card = function (tag, subs) { if (!HO.d) return ''; const S = [...new Set([...(subs || []), ...(window.GA ? GA.subsOf(tag) : [])])].map(x => HO.by[x]).filter(Boolean);
    if (!S.length) return '';
    return `<div class="card" style="border-left:5px solid #b42318"><div class="h3">🚩 ${L('Handover before GAS-IN', 'Передача до пуска газа')} ${esc(HO.d.gas)}</div><div class="list">${S.slice(0, 4).map(row).join('')}</div></div>`; };
  HO.load();
})();
