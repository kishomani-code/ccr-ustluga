// v4.36 (08.11.2026): SYSTEM PROGRESS – pick a system, see % complete per work type; then its client subsystems.
// Sources (this project only): IWP items (I: sys code, activity group, qty / fact), cables on the system graph (D.sg + cst),
// master punch list (PU: subsystem, category, status), client handover list (HO.d.subs), loop check status (LC store).
// IWP has no subsystem column: work-type % per subsystem uses the tags that appear in that subsystem's punches – shown as such.
(function () {
  const SY = window.SY = {};
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const col = p => p >= 100 ? 'var(--ok)' : p >= 50 ? '#c47d00' : 'var(--bad)';
  const short = s => String(s || '').replace(/^[A-Z]{2}-/, '');          // FA-PSGN -> PSGN
  const sname = s => { try { return (window.SYSN && SYSN[s]) ? (RU ? SYSN[s][1] : SYSN[s][0]) : ''; } catch (e) { return ''; } };
  const bar = (p, h) => `<div class="pbar" style="${h ? 'height:' + h + 'px' : ''}"><i style="width:${p}%;background:${col(p)}"></i></div>`;

  // ---- data per system
  function systems() {
    const set = new Set(I.map(x => x.sy).filter(Boolean)); Object.keys(D.sg || {}).forEach(s => set.add(s));
    return [...set].filter(s => s && s !== 'IN').sort();
  }
  function sysCables(s) {
    const g = (D.sg || {})[s]; if (!g) return [];
    const ids = new Set(); (g.e || []).forEach(e => (e[2] || []).forEach(i => ids.add(i)));
    return [...ids].map(i => C[i]).filter(Boolean);
  }
  function cabStat(cs) {
    let p = 0, t = 0; cs.forEach(c => { const s = cst(c); if (s.p) p++; if (s.t) t++; });
    return {n: cs.length, p, t};
  }
  function sysSubs(s) {
    const sh = short(s), rx = new RegExp('-' + sh + '-');
    const subs = new Map();
    if (window.HO && HO.d) HO.d.subs.forEach(x => { if (x.prj === PRJ && rx.test(x.sub)) subs.set(x.sub, x); });
    (PT.sub || []).forEach(x => { if (rx.test(x) && !subs.has(x)) subs.set(x, {sub: x, nm: (PT.subn || [])[PT.sub.indexOf(x)] || ''}); });
    return [...subs.values()].sort((a, b) => a.sub.localeCompare(b.sub));
  }
  function subPunches(sub) { return PU.filter(p => PT.sub[p.sub] === sub); }
  function pstats(list) {
    const r = {n: list.length, open: 0, A: 0, B: 0, C: 0, closed: 0};
    list.forEach(p => { if (/closed/i.test(p.st)) r.closed++; else { r.open++; r[p.cat] = (r[p.cat] || 0) + 1; } });
    return r;
  }
  function loopStat(s) {
    let st = {}; try { st = JSON.parse(localStorage.getItem('lc_status_v1') || '{}') || {}; } catch (e) {}
    const cs = sysCables(s); const acc = cs.filter(c => st[c.t] && st[c.t].s === 'acc').length;
    return {n: cs.length, acc};
  }
  function byGroup(items) {
    const m = new Map(); items.forEach(x => { if (!m.has(x.g)) m.set(x.g, []); m.get(x.g).push(x); });
    return [...m.entries()].map(([g, l]) => Object.assign({g}, gstat(l))).sort((a, b) => a.pc - b.pc || b.n - a.n);
  }
  function overall(s) {
    const it = I.filter(x => x.sy === s); const gs = gstat(it); const cb = cabStat(sysCables(s));
    const ps = pstats(PU.filter(p => new RegExp('-' + short(s) + '-').test(PT.sub[p.sub] || '')));
    return {it: gs, cb, ps};
  }

  // ---- UI pieces
  function workRows(items, note) {
    const rows = byGroup(items);
    if (!rows.length) return `<div class="empty">${L('No IWP activities for this selection', 'Нет работ IWP по этому выбору')}</div>`;
    return `${note ? `<div class="s2" style="margin-bottom:6px">${note}</div>` : ''}<div class="list">${rows.map(r => `<button class="li" onclick="go('#/a/${enc(r.g)}')"><div class="m"><div class="t">${esc(r.g)}</div><div class="s">${r.u === 'lines' ? `${r.d} / ${r.n} ${L('items done', 'позиций выполнено')}` : `${fmtn(r.f)} / ${fmtn(r.q)} ${esc(r.u)} · ${r.n} ${L('items', 'поз.')}`}</div>${bar(r.pc)}</div><div class="r"><div class="pc" style="color:${col(r.pc)}">${r.pc}%</div></div><span class="chev">›</span></button>`).join('')}</div>`;
  }
  function kpis(list) {
    return `<div class="kpi" style="grid-template-columns:repeat(${Math.min(list.length, 3)},1fr)">${list.map(k => `<div><b style="color:${k.c || 'var(--ink)'}">${k.v}</b><span>${k.l}</span></div>`).join('')}</div>`;
  }

  SY.tile = function () {
    const n = systems().length;
    return `<div class="sect">📊 ${L('System progress', 'Прогресс по системам')}</div><div class="grid"><button class="tile main" onclick="go('#/sy')"><b>📊 ${L('System → subsystem → % by work type', 'Система → подсистема → % по видам работ')}</b><div><span class="n">${n} ${L('systems', 'систем')} · ${PRJ}</span></div></button></div>`;
  };

  SY.route = function (rest) {
    window.scrollTo(0, 0);
    const k = rest[0] || '', a = dec(rest.slice(1).join('/'));
    if (k === 's' && a) return sysPage(a);
    if (k === 'ss' && a) return subPage(a);
    return home();
  };

  function home() {
    setHead('📊 ' + L('System progress', 'Прогресс по системам'), PRJ);
    const rows = systems().map(s => Object.assign({s}, overall(s))).filter(r => r.it.n || r.cb.n);
    main.innerHTML = `<div class="card"><div class="h3">${L('Choose a system', 'Выберите систему')}</div><div class="s2">${L('% = IWP activities done (all work types). Tap a system for the split by work type, cables, punches and its client subsystems.', '% = выполнено работ IWP (все виды). Нажмите систему: разбивка по видам работ, кабели, punch и подсистемы заказчика.')}</div></div>
      <div class="list">${rows.map(r => `<button class="li" onclick="go('#/sy/s/${enc(r.s)}')"><div class="m"><div class="t">${esc(r.s)} <span style="font-weight:400;color:var(--mut)">${esc(sname(r.s))}</span></div><div class="s">${r.it.n} ${L('IWP items', 'поз. IWP')} · ${r.cb.n} ${L('cables', 'кабелей')} · ${L('open punch', 'открыто punch')} ${r.ps.open}</div>${bar(r.it.pc)}</div><div class="r"><div class="pc" style="color:${col(r.it.pc)}">${r.it.pc}%</div></div><span class="chev">›</span></button>`).join('')}</div>`;
  }

  function sysPage(s) {
    setHead('📊 ' + s, sname(s) || PRJ);
    const items = I.filter(x => x.sy === s); const gs = gstat(items); const cs = sysCables(s); const cb = cabStat(cs); const lp = loopStat(s);
    const subs = sysSubs(s); const ps = pstats(PU.filter(p => new RegExp('-' + short(s) + '-').test(PT.sub[p.sub] || '')));
    const back = `<div class="chips"><button class="chip" onclick="go('#/sy')">‹ ${L('Systems', 'Системы')}</button></div>`;
    main.innerHTML = `${back}
      ${kpis([{v: gs.pc + '%', l: L('IWP all work types', 'IWP все виды работ'), c: col(gs.pc)}, {v: pct(cb.p, cb.n) + '%', l: L('cables pulled', 'кабели проложены'), c: col(pct(cb.p, cb.n))}, {v: pct(cb.t, cb.n) + '%', l: L('cables terminated', 'кабели подключены'), c: col(pct(cb.t, cb.n))}])}
      ${kpis([{v: ps.open, l: L('open punch (A ' + ps.A + ' / B ' + ps.B + ' / C ' + ps.C + ')', 'открыто punch (A ' + ps.A + ' / B ' + ps.B + ' / C ' + ps.C + ')'), c: ps.open ? 'var(--bad)' : 'var(--ok)'}, {v: ps.closed, l: L('punch closed', 'punch закрыто'), c: 'var(--ok)'}, {v: pct(lp.acc, lp.n) + '%', l: L('loop check accepted', 'петли приняты'), c: col(pct(lp.acc, lp.n))}])}
      <div class="sect">${L('Completed % by work type', '% выполнения по видам работ')}</div>${workRows(items)}
      <div class="sect">${L('Client subsystems of this system', 'Подсистемы заказчика этой системы')} (${subs.length})</div>
      ${subs.length ? `<div class="list">${subs.map(x => { const p = pstats(subPunches(x.sub)); const done = x.done === true; return `<button class="li" onclick="go('#/sy/ss/${enc(x.sub)}')"><div class="m"><div class="t">${esc(x.sub)}</div><div class="s">${esc(x.nm || '')}</div><div class="s">${L('open punch', 'открыто punch')} ${p.open} (A ${p.A} / B ${p.B} / C ${p.C}) · ${L('closed', 'закрыто')} ${p.closed}${x.st ? ' · ' + esc(x.st).slice(0, 60) : ''}</div></div><div class="r"><span class="badge ${done ? 'b-ok' : p.A ? 'b-no' : 'b-part'}">${done ? L('Handed over', 'Передана') : p.A ? 'A ' + p.A : L('In progress', 'В работе')}</span></div><span class="chev">›</span></button>`; }).join('')}</div>` : `<div class="empty">${L('No client subsystem code with', 'Нет кода подсистемы с')} "-${esc(short(s))}-" ${L('in the handover list or punch list', 'в списке передачи или punch')}</div>`}
      <div class="foot">${L('Cables: from the system wiring graph. Punch: master punch list by subsystem code. Loop check: statuses saved on this phone.', 'Кабели: по схеме системы. Punch: мастер-лист по коду подсистемы. Петли: статусы, сохранённые на этом телефоне.')}</div>`;
  }

  function subPage(sub) {
    const h = (window.HO && HO.by && HO.by[sub]) || {sub, nm: (PT.subn || [])[(PT.sub || []).indexOf(sub)] || ''};
    const m = sub.match(/-([A-Z0-9]{3,5})-\d/); const sh = m ? m[1] : ''; const sys = systems().find(s => short(s) === sh) || '';
    setHead('🧩 ' + sub, sys || PRJ);
    const pl = subPunches(sub); const ps = pstats(pl);
    const tags = new Set(pl.map(p => p.tag).filter(Boolean));
    const items = I.filter(x => (!sys || x.sy === sys) && tags.has(x.tag));
    const allItems = sys ? I.filter(x => x.sy === sys) : [];
    const gs = gstat(items), ga = gstat(allItems);
    const back = `<div class="chips"><button class="chip" onclick="go('#/sy')">‹ ${L('Systems', 'Системы')}</button>${sys ? `<button class="chip" onclick="go('#/sy/s/${enc(sys)}')">‹ ${esc(sys)}</button>` : ''}</div>`;
    const kv = (k, v) => v ? `<div>${k}</div><div>${v}</div>` : '';
    main.innerHTML = `${back}
      <div class="card"><div class="big" style="font-size:16px">${esc(sub)}</div><div class="s2">${esc(h.nm || '')}</div>
        <div class="kv" style="margin-top:8px">${kv(L('Status', 'Статус'), esc(h.st || ''))}${kv(L('Inspection', 'Инспекция'), esc(h.insp || ''))}${kv(L('Priority', 'Приоритет'), esc(h.pri || ''))}${kv(L('Next action', 'Следующий шаг'), esc(h.act || ''))}${kv(L('Responsible', 'Ответственный'), esc(h.resp || ''))}${kv('CTQ', esc(h.ctq && h.ctq !== '0' ? h.ctq : ''))}${kv(L('Supervisor', 'Супервайзер'), esc(h.sv || ''))}</div></div>
      ${kpis([{v: ps.open, l: L('open punch', 'открыто punch'), c: ps.open ? 'var(--bad)' : 'var(--ok)'}, {v: `${ps.A}/${ps.B}/${ps.C}`, l: 'A / B / C ' + L('open', 'откр.'), c: ps.A ? 'var(--bad)' : 'var(--ink)'}, {v: ps.closed, l: L('closed', 'закрыто'), c: 'var(--ok)'}])}
      ${pl.length ? `<div class="chips"><button class="chip" onclick="go('#/pk/s:${enc(sub)}')">${L('Open punch list of this subsystem', 'Список punch этой подсистемы')} ›</button></div>` : ''}
      <div class="sect">${L('Completed % by work type – this subsystem', '% выполнения по видам работ – эта подсистема')}</div>
      ${workRows(items, L(`IWP has no subsystem column: these are the IWP activities of the ${tags.size} tags that appear in this subsystem's punch list (${gs.n} items, ${gs.pc}%).`, `В IWP нет колонки подсистемы: показаны работы IWP по ${tags.size} тегам из punch-листа этой подсистемы (${gs.n} поз., ${gs.pc}%).`))}
      ${sys ? `<div class="sect">${L('Whole system', 'Вся система')} ${esc(sys)} · ${ga.pc}%</div>${workRows(allItems)}` : ''}`;
  }
})();
