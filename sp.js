// v4.28: CCR-SPBA focus menu – everything for fire & gas SPBA (GLE-(G0-D1801FX0)-FA-SPBA-001) in one place:
// remaining cable pulling / termination / installation, punches (signed PDF, Aleksy), CTQ, SF materials with stock + MRF, diodes & resistors, drawings, target dates.
(function () {
  const SP = window.SP = {};
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  SP.on = () => PRJ === 'CCR' || PRJ === '1801';
  let _c = null;
  function core() { if (_c) return _c;
    const cab = C.filter(c => /SPBA/i.test(c.d || '') || /SPBA/i.test(c.src || ''));
    const tags = new Set(); cab.forEach(c => (String(c.f) + ' ' + String(c.o)).replace(/G0-D1\d{3}[A-Z0-9]{3}-[A-Z0-9\-()]+/g, t => { tags.add(t.replace(/\*$/, '')); return t; }));
    const ctags = new Set(cab.map(c => c.t));
    const inst = I.filter(x => !/^Cable (pulling|termination)$/.test(x.g) && (tags.has(x.tag) || /SPBA/i.test((T.dwg || [])[x.dwg] || '')));
    const pun = PU.filter(p => !p.int ? (tags.has(p.tag) || ctags.has(p.tag)) : (tags.has(p.tag) || ctags.has(p.tag) || /SPBA/i.test(p.dru + ' ' + p.notes)));
    const ctq = (typeof CTQ !== 'undefined' ? CTQ : []).filter(q => /SPBA/i.test([q.dwg, q.sub, q.tags, q.sh].join(' ')));
    return (_c = {cab, tags, inst, pun, ctq}); }
  const sfMap = () => { const m = {}; ((PX.mat && PX.mat.sf) || []).forEach(s => s.tg.forEach(t => (m[t] = m[t] || []).push(s.id))); return m; };
  const typ = t => (String(t).match(/^G0-D1\d{3}[A-Z0-9]{3}-(?:[A-Z0-9]+-)?([A-Z]+)-\d/) || [])[1] || '';
  SP.matFor = function (tag) { const m = sfMap(); const ty = typ(tag); return m[ty] || []; };
  const pc = (a, b) => b ? Math.round(100 * a / b) : 0;
  const T2 = (h, b, n, p, bg) => `<button class="tile main" ${bg ? `style="background:${bg};border-color:${bg}"` : ''} onclick="go('${h}')"><b>${b}</b><div><span class="n">${n}</span>${p != null ? `<div class="pc">${p}%</div><div class="pbar"><i style="width:${p}%"></i></div>` : ''}</div></button>`;
  SP.tile = function () { if (!SP.on()) return ''; const x = core(); const pl = x.cab.filter(c => cst(c).p).length, ok = x.cab.filter(c => cst(c).ok).length;
    return `<button class="tile" style="width:100%;min-height:auto;margin-bottom:6px;background:linear-gradient(135deg,#9a1b1b,#d0461b);color:#fff;border-color:#9a1b1b" onclick="go('#/sp')"><b>🔥 CCR-SPBA ${L('focus', '– фокус')}</b><span class="n" style="color:#ffe2d6;display:block">${L('cables', 'кабели')} ${ok}/${x.cab.length} ${L('complete', 'готово')} · ${L('pulled', 'протянуто')} ${pl} · ${x.pun.filter(p => p.st === 'Open').length} ${L('open punches', 'откр. замечаний')} · ${x.ctq.length} CTQ</span></button>`; };
  SP.route = function (rest) { if (!SP.on()) { main.innerHTML = '<div class="empty">CCR only</div>'; return; }
    const k = rest[0] || ''; const x = core();
    const notPulled = x.cab.filter(c => !cst(c).p), notTerm = x.cab.filter(c => cst(c).p && !cst(c).t), instOpen = x.inst.filter(i => !i.done), punOpen = x.pun.filter(p => p.st === 'Open');
    const sf = (PX.mat && PX.mat.sf) || [], M = (PX.mat && PX.mat.m) || {};
    const sfRows = sf.map(s => { const m = M[s.id]; const free = m ? m.bal - m.res : 0; return {s, m, free, alert: !m || !m.mrf.length}; });
    if (!k) {
      const pl = x.cab.filter(c => cst(c).p).length, ok = x.cab.filter(c => cst(c).ok).length, idn = x.inst.filter(i => i.done).length;
      const ho = window.HO && HO.by ? Object.values(HO.by).filter(s => /PSGN|SPBA|-FA-/.test(s.sub) && (s.tit || '').match(/D18(10|01)/)) : [];
      setHead('🔥 CCR-SPBA', L('fire & gas SPBA · GLE-(G0-D1801FX0)-FA-SPBA-001', 'СПБА · GLE-(G0-D1801FX0)-FA-SPBA-001'));
      main.innerHTML = `<div class="kpi"><div><b>${pc(ok, x.cab.length)}%</b><span>${L('cables complete', 'кабели готовы')}</span></div><div><b>${pc(idn, x.inst.length)}%</b><span>${L('installation', 'монтаж')}</span></div><div><b style="color:var(--bad)">${punOpen.length}</b><span>${L('open punches', 'откр. замечаний')}</span></div></div>
        ${ho.length ? `<div class="note" style="background:#eef3f8">🎯 ${L('Target dates (subsystem handover / MC)', 'Целевые даты (передача / MC)')}: ${ho.map(s => `<b>${esc(s.sub)}</b> ${esc(s.mc || '-')}${s.done ? ' ✓' : ''}`).join(' · ')}</div>` : ''}
        <div class="grid">
         ${T2('#/sp/pull', '🧵 ' + L('Remaining cable pulling', 'Осталось протянуть'), `${notPulled.length} ${L('cables', 'кабелей')} · ${pl}/${x.cab.length} ${L('pulled', 'протянуто')}`, pc(pl, x.cab.length), '#c2410c')}
         ${T2('#/sp/term', '🔌 ' + L('Remaining termination', 'Осталось расключить'), `${notTerm.length} ${L('pulled, not terminated', 'протянуто, не расключено')}`, pc(ok, x.cab.length), '#7b3fb3')}
         ${T2('#/sp/inst', '🛠️ ' + L('Remaining installation', 'Осталось смонтировать'), `${instOpen.length} / ${x.inst.length} ${L('items · ident & MRF', 'поз. · идент и MRF')}`, pc(idn, x.inst.length), '#0b6e6e')}
         ${T2('#/sp/pun', '⚠️ ' + L('Punches', 'Замечания'), `${punOpen.length} ${L('open', 'откр.')} · 📄 ${punOpen.filter(p => PX.signed(p.no)).length} ${L('signed PDF', 'подписано')}`, pc(x.pun.length - punOpen.length, x.pun.length), '#b42318')}
         ${T2('#/sp/ctq', '❓ CTQ', `${x.ctq.length} ${L('SPBA queries', 'запросов по СПБА')}`, null, '#1f3864')}
         ${T2('#/sp/mat', '📦 ' + L('SF materials · stock · MRF', 'Материалы SF · склад · MRF'), `${sfRows.length} ${L('idents', 'идентов')} · 🔔 ${sfRows.filter(r => r.alert).length} ${L('no MRF', 'без MRF')}`, null, '#475467')}
         ${T2('#/sp/dio', '🔩 ' + L('Diodes & resistors', 'Диоды и резисторы'), L('CTQ-02 · warehouse · purchase', 'CTQ-02 · склад · закупка'), null, '#5b3a8a')}
         ${T2('#/sp/dwg', '📐 ' + L('Drawings', 'Чертежи'), 'FA-SPBA-001 · SPBA-SF-001', null, '#1a73e8')}</div>`;
      return; }
    const back = `<button class="chip" onclick="go('#/sp')">‹ CCR-SPBA</button>`;
    if (k === 'pull' || k === 'term') { const Lst = k === 'pull' ? notPulled : notTerm;
      setHead(k === 'pull' ? L('SPBA – remaining cable pulling', 'СПБА – осталось протянуть') : L('SPBA – remaining termination', 'СПБА – осталось расключить'), `${Lst.length} ${L('cables', 'кабелей')}`);
      main.innerHTML = `<div class="chips">${back}</div><div class="list">${Lst.map(c => cRow(c, '')).join('') || '<div class="empty">' + L('All done ✓', 'Всё выполнено ✓') + '</div>'}</div>`; return; }
    if (k === 'inst') { setHead(L('SPBA – remaining installation', 'СПБА – осталось смонтировать'), `${instOpen.length} ${L('items', 'поз.')}`);
      const by = {}; instOpen.forEach(i => { const t = typ(i.tag) || '?'; (by[t] = by[t] || []).push(i); });
      main.innerHTML = `<div class="chips">${back}</div>` + Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([t, Lst]) => { const ids = SP.matFor(Lst[0].tag);
        return `<div class="gh">${esc(t)} · ${Lst.length} ${L('not installed', 'не смонтировано')}</div>${ids.length ? PX.matCard(ids, t + ' – ' + L('SF material', 'материал SF'), Lst.length + ' ' + L('pcs', 'шт.')) : `<div class="note" style="background:#fff4d6">${L('Ident not found in SPBA SF list – check SF / panel package.', 'Идент не найден в SF СПБА – проверить SF / комплект шкафа.')}</div>`}
          <div class="list">${Lst.slice(0, 80).map(i => `<button class="li" onclick="go('#/i/${i.i}')"><div class="m"><div class="t">${esc(i.tag)}</div><div class="s">${esc(i.g)} · ${esc(T.desc[i.desc] || '')}</div></div><span class="badge ${ist(i).c}">${esc(ist(i).l)}</span><span class="chev">›</span></button>`).join('')}</div>`; }).join('') || '<div class="empty">' + L('All installed ✓', 'Всё смонтировано ✓') + '</div>'; return; }
    if (k === 'pun') { setHead(L('SPBA – punches', 'СПБА – замечания'), `${punOpen.length} ${L('open', 'откр.')}`);
      main.innerHTML = `<div class="chips">${back}</div><div class="list">${punOpen.map(pRow).join('') || '<div class="empty">' + L('No open punches ✓', 'Нет открытых замечаний ✓') + '</div>'}</div>`; return; }
    if (k === 'ctq') { setHead('SPBA – CTQ', `${x.ctq.length}`);
      main.innerHTML = `<div class="chips">${back}</div><div class="list">${x.ctq.map(q => `<button class="li" onclick="go('#/ctq/${enc(q.no)}')"><div class="m"><div class="t">${esc(q.no)} · ${esc(q.st)}${window.CA ? CA.badge(q.no) : ''}</div><div class="s">${esc(String(q.sub).slice(0, 150))}</div><div class="s" style="color:var(--mut)">${esc(q.tags || '').slice(0, 120)}</div></div><span class="chev">›</span></button>`).join('') || '<div class="empty">–</div>'}</div>`; return; }
    if (k === 'mat') { VS.SPM = VS.SPM || {f: ''}; const v = VS.SPM;
      const Lst = sfRows.filter(r => !v.f || (v.f === 'mrf' ? r.alert : v.f === 'short' ? (r.m ? r.m.bal - r.m.res : 0) < r.s.q : true));
      setHead(L('SPBA – SF materials', 'СПБА – материалы SF'), `${sfRows.length} ${L('idents', 'идентов')} · ${L('follow-up', 'ведомость')} ${esc((PX.mat && PX.mat.date) || '')}`);
      main.innerHTML = `<div class="chips">${back}${[['', L('All', 'Все')], ['mrf', '🔔 ' + L('No MRF', 'Без MRF')], ['short', '❌ ' + L('Free stock < SF qty', 'Свободно < SF')]].map(([k2, l]) => `<button class="chip ${v.f === k2 ? 'on' : ''}" onclick="VS.SPM.f='${k2}';SP.route(['mat'])">${l}</button>`).join('')}</div>
        <div class="list">${Lst.map(r => `<div class="li" style="display:block"><div class="t"><b>${esc(r.s.id)}</b> · SF ${r.s.q || '-'} ${esc(r.s.u || '')}${r.s.tg.length ? ' · ' + esc(r.s.tg.join(', ')) : ''}</div><div class="s">${esc(r.m ? (r.m.ru || r.m.en) : L('not in materials follow-up', 'нет в ведомости'))}</div>
          ${r.m ? `<div class="s">${L('balance', 'остаток')} <b>${r.m.bal}</b> · ${L('reserved', 'резерв')} ${r.m.res} · ${L('free', 'свободно')} <b style="color:${r.m.bal - r.m.res > 0 ? 'var(--ok)' : 'var(--bad)'}">${r.m.bal - r.m.res}</b> · ${L('received', 'получено')} ${r.m.rcv}${r.m.mrf.length ? ' · MRF ' + esc(r.m.mrf.join(', ')) : ''}</div>` : ''}
          ${r.alert ? `<div class="s" style="color:var(--bad)"><b>🔔 ${L('Paul – make MRF for this item', 'Пауль – оформить MRF')}</b></div>` : ''}</div>`).join('')}</div>`; return; }
    if (k === 'dio') { setHead(L('SPBA – diodes & resistors', 'СПБА – диоды и резисторы'), 'CTQ-02');
      main.innerHTML = `<div class="chips">${back}</div>
        <div class="card"><div class="h3">${L('Need for CCR (drawing count + 10 %)', 'Потребность ЦО (по РД + 10 %)')}</div>${kv([[L('Diodes (drawing 1N4007)', 'Диоды (РД 1N4007)'), '245 pcs'], [L('Resistors 2 kΩ (R1 + R3)', 'Резисторы 2 кОм (R1 + R3)'), '188 pcs']])}
          <div class="note">${L('MRF raised for CCR from warehouse (MTO GLE-(G0-Z00000X0)-IN-LP-005.023, ЖАН №17-ГЛИ). Client OK still needed for 1N5408 / 1N4007 instead of 1N4001 (CTQ-02).', 'MRF на склад для ЦО оформлен (МТО GLE-(G0-Z00000X0)-IN-LP-005.023, ЖАН №17-ГЛИ). Нужно согласие заказчика на 1N5408 / 1N4007 вместо 1N4001 (CTQ-02).')}</div></div>
        ${PX.matCard(['EDDRC00002'], L('Diode 1N5408 (warehouse)', 'Диод 1N5408 (склад)'), '245')}${PX.matCard(['ERSSC00004'], L('Resistor 2 kΩ (warehouse)', 'Резистор 2 кОм (склад)'), '188')}
        <div class="note" style="background:#fff4d6">${L('Purchase (invoice №2297 ЭГЭ): 500 diodes 1N4007 + 500 resistors 2 kΩ; 1.5 kΩ × 8 to be added (D48).', 'Закупка (счёт №2297 ЭГЭ): 500 диодов 1N4007 + 500 резисторов 2 кОм; добавить 1,5 кОм × 8 (D48).')}</div>`; return; }
    if (k === 'dwg') { setHead(L('SPBA – drawings', 'СПБА – чертежи'), '');
      main.innerHTML = `<div class="chips">${back}</div>${typeof dwCard === 'function' ? dwCard(['GLE-(G0-D1801FX0)-FA-SPBA-001', 'GLE-(G0-D1801FX0)-FA-SPBA-SF-001', 'GLE-(G0-D1810BX0)-IN-SPAP-LR-001'], L('SPBA drawings', 'Чертежи СПБА')) : ''}`; return; }
    SP.route([]); };
})();
