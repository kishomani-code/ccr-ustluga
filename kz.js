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
    const sc = []; docs.forEach(s => (s.it || []).forEach(r => { const id = String(r[3] || '').trim().split(/\s+/)[0]; if (!/^[A-Z0-9]{6,12}$/.test(id)) return; const t = toks(r[2]); let n = 0; want.forEach(w => { if (t.has(w)) n++; }); if (n >= 2) sc.push({id, n, pos: r[0], d: r[2], q: r[5], u: r[4], doc: s.doc, rev: s.rev}); }));
    sc.sort((a, b) => b.n - a.n); const out = []; sc.forEach(s => { if (out.length < 2 && !out.some(o => o.id === s.id) && s.n >= sc[0].n - 1) out.push(s); }); return out; };
  const isCab = x => /^Cable (pulling|termination)$/i.test(x.g) || /cable (laying|termination)/i.test(x.m || '') || /Cable (Laying|Termination)/i.test(x.g);
  const titleOf = x => { const m = String((T.dwg || [])[x.dwg] || '').match(/\((G0-[A-Z0-9]+)\)/) || String(x.tag || '').match(/^(G0-[A-Z0-9]{8,9})/); return m ? m[1] : ''; };
  const enPart = s => { s = String(s || ''); const parts = s.split(/\s+\/\s+/); const e = parts.filter(p => !/[А-Яа-яЁё]/.test(p)).sort((a, b) => b.length - a.length)[0]; if (e) return e.trim();
    const m = s.search(/[A-Za-z]{3,}[^А-Яа-яЁё]{15,}$/); return m > 0 ? s.slice(m).trim() : s.replace(/[А-Яа-яЁё]+/g, '').replace(/\s+/g, ' ').trim(); };
  // full material card for an IWP item (device / equipment / bulk): ident from SF, SF details, stock, MRF, alert + MRF Excel
  KZ.itemCard = function (x) { if (!x || isCab(x)) return ''; const c = KZ.identsFor(x); const need = Math.max(x.q - x.f, 0); const tit = titleOf(x);
    if (!c.length) return `<div class="card"><div class="h3">📦 ${L('Ident / material', 'Идент / материал')}</div><div class="note">${L('No matching ident in the SF drawing for this item – search the ident in "Warehouse stock by ident".', 'Подходящий идент в SF не найден – найдите идент в «Склад по иденту».')}</div><button class="tile" style="width:100%;min-height:auto" onclick="go('#/kz/wh')"><b>🔎 ${L('Warehouse stock by ident', 'Склад по иденту')}</b></button></div>`;
    return `<div class="card" style="border-left:4px solid ${x.done ? 'var(--ok)' : '#b7791f'}"><div class="h3">📦 ${L('Ident & material (SF drawing + warehouse)', 'Идент и материал (SF + склад)')}</div>${c.map((s, k) => { const w = KZ.stock(s.id); const free = w ? w[1] - w[2] : 0; const ti = w && w[7] ? w[7][tit] : null;
      let st, col, btn = false;
      if (x.done) { st = L('✓ Installed – no action', '✓ Смонтировано – действий нет'); col = 'var(--ok)'; }
      else if (ti && ti[0] >= need) { st = L(`✅ Already issued to RHI for ${tit}: ${fm(ti[0])} (MRF ${ti[1].join(', ') || '-'}) – check RHI site store`, `✅ Уже выдано РХИ на ${tit}: ${fm(ti[0])} (MRF ${ti[1].join(', ') || '-'}) – проверить склад РХИ`); col = 'var(--ok)'; }
      else if (free > 0) { st = L(`🔔 Not installed and not received from warehouse – REQUEST MRF (free ${fm(free)} in warehouse)`, `🔔 Не смонтировано и не получено со склада – ОФОРМИТЬ MRF (свободно ${fm(free)})`); col = 'var(--bad)'; btn = true; }
      else { st = KZ.verdict(w).t; col = 'var(--bad)'; btn = true; }
      return `<div style="${k ? 'border-top:1px dashed var(--line);margin-top:6px;padding-top:6px' : ''}">${kv([[L('Ident', 'Идент'), s.id + (k ? ' (' + L('alternative', 'вариант') + ')' : '')], [L('SF drawing', 'SF чертёж'), s.doc + (s.rev ? ' rev ' + s.rev : '') + ' · ' + L('pos.', 'поз.') + ' ' + s.pos], [L('SF description', 'Описание SF'), String(s.d).slice(0, 260)], [L('SF qty', 'Кол-во SF'), fm(s.q) + ' ' + s.u], [L('Need for this item', 'Нужно для позиции'), fm(need) + ' ' + x.u]])}
        ${w ? `<div class="s" style="font-size:13px">${L('Warehouse', 'Склад')}: ${L('received', 'получено')} <b>${fm(w[0])}</b> · ${L('issued', 'выдано')} <b>${fm(w[3])}</b> · ${L('balance', 'остаток')} <b>${fm(w[1])}</b> · ${L('reserved', 'резерв')} <b>${fm(w[2])}</b> · ${L('free', 'свободно')} <b style="color:${free > 0 ? 'var(--ok)' : 'var(--bad)'}">${fm(free)}</b></div>
          <div class="s" style="font-size:12px;color:var(--mut)">MRF ${L('issued', 'выдача')}: ${esc(w[4].join(', ') || '-')} · MRF ${L('reserved', 'резерв')}: ${esc(w[5].join(', ') || '-')}${ti ? ` · ${L('issued for', 'выдано на')} ${esc(tit)}: ${fm(ti[0])} (${esc(ti[1].join(', ') || '-')})` : ''}</div>
          ${w[8] && w[8].length ? `<div class="s" style="font-size:12px;color:var(--mut)">${L('Packing lists with stock', 'Упак. листы с остатком')}: ${w[8].map(p => `${esc(p[0])} (${fm(p[2] - p[3])} ${L('free', 'своб.')}${p[1] ? ', ' + esc(p[1]) : ''}, ${esc(p[4])})`).join(' · ')}</div>` : ''}` : `<div class="s" style="color:var(--bad)">${L('Ident not in warehouse follow-up', 'Идента нет в складской ведомости')}</div>`}
        <div style="font-size:13.5px;font-weight:700;color:${col};margin-top:4px">${st}</div>
        ${btn ? `<button class="tile main" style="width:100%;min-height:auto;margin-top:6px;background:#b42318;border-color:#b42318" onclick="KZ.mrf(${x.i},'${s.id}')"><b>📝 ${L('Request MRF – open filled MRF Excel', 'Оформить MRF – открыть заполненный Excel')}</b><span class="n" style="color:#ffe2d6">${esc(s.id)} · ${fm(need)} ${esc(x.u)} · ${esc(x.tag)}</span></button>` : ''}</div>`; }).join('')}
      <div style="font-size:11px;color:var(--mut);margin-top:4px">${L('Warehouse follow-up', 'Складская ведомость')} ${esc(KZ.w ? KZ.w.date : '')} · ${L('ident matched from SF by description – check before sending', 'идент подобран по описанию SF – проверить перед отправкой')}</div></div>`; };
  // ---------- MRF Excel (RHI template 532RHI-QC-IC-001, same layout as office MRFs) ----------
  KZ.mrf = function (i, id) { if (!window.XL) return toast('Excel module not loaded'); const x = I[i]; if (!x) return; const s = KZ.identsFor(x).find(o => o.id === id) || {}; const w = KZ.stock(id); const tit = titleOf(x); const need = Math.max(x.q - x.f, 0) || x.q;
    const P = w && w[8] && w[8][0] ? w[8][0] : ['', '', 0, 0, ''];
    const desc = enPart(s.d) || (w ? w[9] : '') || id; const u = ((String(s.u || '').match(/[A-Za-z]+/g) || []).pop()) || (w ? w[10] : '') || x.u;
    const E = n => Array(18).fill(''), R = [];
    let r = E(); r[0] = 'RHI\nООО "РХИ"'; r[4] = 'MATERIAL REQUISITION FORM\nФОРМА ЗАЯВКИ НА МАТЕРИАЛ'; r[12] = 'Template No/№ шаблона'; r[13] = '532RHI-QC-IC-001'; R.push(r);
    r = E(); r[12] = 'Rev./Ред.'; r[13] = '01'; R.push(r);
    r = E(); r[12] = 'Rev. Date/Дата ред.'; r[13] = '14.12.2023'; R.push(r);
    r = E(); r[0] = 'Plant:\nНаименование завода:'; r[2] = 'Газоперерабатывающий комплекс в составе Комплекса переработки этансодержащего газа в районе поселка Усть-Луга. Газоперерабатывающий завод и технологические объекты общезаводского хозяйства'; r[12] = 'Request No\nНомер Заявки:'; R.push(r);
    r = E(); r[0] = 'SUBCONTRACTOR\nСУБПОДРЯДЧИК'; r[2] = ' ООО "Ренконс Хэви Индастри"'; r[12] = 'Request Date\nЗаявки Дата:'; R.push(r);
    r = E(); r[0] = 'MATERIAL TYPE / DISCIPLINE\nТИП МАТЕРИАЛА / ДИСЦИПЛИНА'; r[2] = 'EP Material'; r[3] = 'X'; r[6] = 'CIVIL\nОБЩЕСТР.'; r[8] = 'MECH.  \nМЕХ.'; r[11] = 'HVAC \nОвиКВ.'; r[15] = 'Piping.\nТрубопр.'; R.push(r);
    r = E(); r[2] = 'C Material'; r[6] = 'ELECT\nЭЛЕКТР. '; r[7] = 'X'; r[8] = 'PAINTING \nЛАКОКРАС.'; r[11] = 'STR.\nконстр.'; r[15] = 'OTHERS. \nДРУГОЕ.'; R.push(r);
    R.push(E());
    R.push(['Position No\n позиции №', 'PO No', 'Packing list No.\n№ упаковочного листа', 'CWA', 'Title / Unit\nТитул / Установка', 'IWP', 'Description of E&M\nОписание ТМЦ', 'НаименованиеКЛпоРД/Cablename', 'Номер барабана', 'Ident code  \nПроектный идентификационный номер ', 'Component No  \n№ теговый ', 'Detail design documentation No\nРабочая документация №', '', 'Количество по заявке', 'Количество по заявке', 'Received quantity\nВыданное кол-во', 'UoM\nЕдиница измерения', 'IC RFI No\nВК ЗПИ №']);
    r = E(); r[0] = 1; r[1] = P[1]; r[2] = P[0]; r[3] = tit; r[4] = tit; r[6] = desc; r[9] = id; r[10] = x.tag; r[11] = s.doc || ''; r[14] = need; r[16] = u; R.push(r);
    R.push(E()); R.push(E());
    r = E(); r[2] = 'MRF Requestor\nИнициатор заявки'; r[4] = 'Const. Approval\nПодтверждение  отдела Строительства'; r[9] = 'QC approval'; r[12] = 'Warehouse Supervisor\nСупервайзер склада'; r[16] = 'REMARKS:\nПримечания:'; R.push(r);
    r = E(); r[0] = 'Name Surname'; r[16] = `${x.g} · Access ID ${x.acc}${s.pos ? ' · SF pos. ' + s.pos : ''}${w ? ' · warehouse free ' + (w[1] - w[2]) + (P[4] ? ' (' + P[4] + ')' : '') : ''}`; R.push(r);
    r = E(); r[0] = 'Date'; R.push(r);
    const merges = ['A1:D3', 'E1:L3', 'N1:R1', 'N2:R2', 'N3:R3', 'A4:B4', 'C4:L4', 'N4:R4', 'A5:B5', 'C5:L5', 'N5:R5', 'A6:B7', 'D6:E6', 'D7:E7', 'J6:K6', 'J7:K7', 'M6:N6', 'M7:N7', 'Q6:R6', 'Q7:R7', 'A8:R8', 'L9:M9', 'L10:M10', 'L11:M11', 'L12:M12', 'A13:B13', 'C13:D13', 'E13:G13', 'H13:I13', 'J13:L13', 'M13:P13', 'Q13:R13', 'A14:B14', 'C14:D14', 'E14:G14', 'H14:I14', 'J14:L14', 'M14:P14', 'Q14:R15', 'A15:B15', 'C15:D15', 'E15:G15', 'H15:I15', 'J15:L15', 'M15:P15'];
    XL.save(`MRF_${tit}_${String(x.tag).replace(/[^A-Za-z0-9\-]+/g, '_')}_${id}.xlsx`, [{name: 'Sheet1', rows: R, widths: [10, 21, 24, 19, 20, 29, 50, 30, 19, 28, 30, 26, 19, 17, 16, 22, 12, 14], merges, bold: [0, 8, 12]}]); };
  // ---------- cards ----------
  KZ.tagCard = function (tag) { if (!KZ.d || !tag) return ''; let h = '';
    const N2 = String(tag).toUpperCase(); const notes = KZ.d.notes[tag] || KZ.d.notes[N2] || [];
    if (notes.length) h += `<div class="card" style="border-left:4px solid #1a73e8"><div class="h3">📝 ${L('Engineering notes (office)', 'Замечания инженера (офис)')}</div>${notes.map(n => `<div class="note" style="background:#eef3f8">${esc(n)}</div>`).join('')}</div>`;
    if (typeof I === 'undefined') return h;
    const m = (location.hash || '').match(/^#\/i\/(\d+)/);
    if (m) { const x = I[+m[1]]; if (x && x.tag === tag) h += KZ.itemCard(x); }
    else if (!/^#\/c\//.test(location.hash || '') && typeof IBY !== 'undefined') { (IBY[tag] || []).filter(x => !isCab(x) && !/Calibration/i.test(x.g)).slice(0, 3).forEach(x => { h += KZ.itemCard(x); }); }
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
