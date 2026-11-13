// v4.38 (08.11.2026): REQUEST IWP ID – cables pulled / terminated in the cable tracker with no IWP line (laying or termination).
// Same rules as the office request Excel: our titles only are requested; other titles = check with Paul;
// patch cords / AOC (paid with the device) and cables deleted in design are listed separately, no claim now.
(function () {
  const IR = window.IR = {};
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const OWN = ['G0-D1810BX0', 'G0-D1801FX0', 'G0-D4810BX0', 'G0-D4801FX0', 'G0-D8810BX0', 'G0-D8801FX0'];
  let SETS = null, RES = null;
  function sets() {
    if (SETS) return SETS;
    const pull = new Set(), term = new Set();
    const add = (s, v) => { if (v) s.add(v); };
    I.forEach(x => {
      const tg = String(x.tag || '').replace(/[._]\d{1,2}$/, ''), ui = String(x.uid || '').replace(/[._]\d{1,2}$/, '');
      const keys = [N(tg), N(ui), N(x.tag), N(tg.replace(/-WP\d{2}$/, ''))];
      const s = /pull/i.test(x.g) ? pull : /termination/i.test(x.g) ? term : null;
      if (s) keys.forEach(k => add(s, k));
    });
    return (SETS = {pull, term});
  }
  function title(c) {
    const m = String(c.d || '').match(/(G\d-[A-Z0-9]{7,})/); let t = m ? m[1] : '';
    if (!OWN.includes(t) && /^\s*G0-D48\b/.test(String(c.d || ''))) t = 'G0-D4810BX0';
    return t;
  }
  IR.of = function (c) {
    if (!c || c.src !== 'Cable tracker') return null;
    const p = c.tp === 'Completed', t = c.tt === 'Completed'; if (!p && !t) return null;
    const S = sets(), n = N(c.t);
    const noL = p && !c.la && !S.pull.has(n), noT = t && !c.ta && !S.term.has(n);
    if (!noL && !noT) return null;
    const txt = [c.ln, c.h, c.cm].join(' ');
    const kind = /удал|deleted/i.test(txt) ? 'del' : (/RJ45|AOC-|patch|патч|комплект|vendor|поставщ|вендор|LC\/U-LC|NTSS-FOAM/i.test(String(c.ty) + ' ' + txt) || /^\s*(vendor|вендор)/i.test(String(c.dr || ''))) ? 'dev'   /* v4.66: drum = vendor in the tracker -> vendor cable, never in the request list */ : OWN.includes(title(c)) ? 'req' : 'oth';
    return {noL, noT, kind, title: title(c)};
  };
  function all() {
    if (RES) return RES;
    const r = {req: [], oth: [], dev: [], del: []};
    C.forEach(c => { const x = IR.of(c); if (x) r[x.kind].push([c, x]); });
    return (RES = r);
  }
  const need = x => x.noL && x.noT ? L('laying + termination', 'прокладка + подключение') : x.noL ? L('laying', 'прокладка') : L('termination', 'подключение');

  IR.card = function (c) {
    const x = IR.of(c); if (!x) return '';
    const st = {req: ['#fde6e3', 'var(--bad)', '⚠ ' + L('No IWP ID – request IWP code from client', 'Нет ID IWP – запросить код IWP у заказчика')],
      oth: ['#fff2d8', '#8a5a00', '⚠ ' + L('No IWP line in our IWP – other title ' + x.title + ', check with Paul', 'Нет строки в нашем IWP – другой титул ' + x.title + ', уточнить у Paul')],
      dev: ['#eef2f6', 'var(--mut)', 'ℹ ' + L('Device / vendor or factory pre-terminated cable – no separate claim now', 'Кабель в комплекте / заводской сборки – отдельно не предъявляем')],
      del: ['#eef2f6', 'var(--mut)', 'ℹ ' + L('Deleted in design but marked done in tracker – check', 'Удалён в проекте, но отмечен в трекере – проверить')]}[x.kind];
    return `<div class="card" style="background:${st[0]};border-left:5px solid ${st[1]}"><b style="color:${st[1]}">${st[2]}</b><div class="s2" style="margin-top:4px">${L('Done in tracker, missing IWP for', 'Выполнено по трекеру, нет IWP на')}: <b>${need(x)}</b>${x.kind === 'req' ? ' · ' + L('listed in "Request IWP ID"', 'в списке «Запрос ID IWP»') : ''}</div></div>`;
  };
  IR.mini = function (c) { const x = IR.of(c); return x && x.kind === 'req' ? `<span class="badge b-no" style="margin-left:6px">${L('no IWP', 'нет IWP')}</span>` : ''; };

  IR.tile = function () {
    const r = all(); if (!r.req.length && !r.oth.length) return '';
    return `<div class="sect">⚠ ${L('Request IWP ID', 'Запрос ID IWP')}</div><div class="grid"><button class="tile" style="border-left:5px solid var(--bad)" onclick="go('#/ir')"><b>⚠ ${L('Done in tracker – no IWP ID', 'Выполнено по трекеру – нет ID IWP')}</b><div><span class="n">${r.req.length} ${L('to request', 'к запросу')} · ${r.oth.length} ${L('other title', 'другой титул')}</span></div></button></div>`;
  };
  IR.f = 'req';
  IR.route = function () {
    window.scrollTo(0, 0);
    const r = all(); setHead('⚠ ' + L('Request IWP ID', 'Запрос ID IWP'), PRJ + ' · ' + r.req.length + ' ' + L('to request', 'к запросу'));
    const tabs = [['req', L('Request (our titles)', 'Запрос (наши титулы)')], ['oth', L('Other title', 'Другой титул')], ['dev', L('Device / vendor', 'В комплекте')], ['del', L('Deleted', 'Удалены')]];
    const list = r[IR.f] || [];
    const cnt = {L: list.filter(([c, x]) => x.noL && !x.noT).length, T: list.filter(([c, x]) => !x.noL && x.noT).length, B: list.filter(([c, x]) => x.noL && x.noT).length};
    main.innerHTML = `<div class="chips">${tabs.map(([k, l]) => `<button class="chip ${IR.f === k ? 'on' : ''}" onclick="IR.f='${k}';IR.route()">${l} (${r[k].length})</button>`).join('')}</div>
      <div class="card"><div class="s2">${L('Cables pulled / terminated in the cable tracker with no IWP line for that work. Laying only', 'Кабели, проложенные / подключённые по трекеру без строки IWP. Только прокладка')} ${cnt.L} · ${L('termination only', 'только подключение')} ${cnt.T} · ${L('both', 'оба')} ${cnt.B}</div></div>
      <div class="list">${list.slice(0, 400).map(([c, x]) => `<button class="li" onclick="go('#/c/${enc(c.t)}')"><div class="m"><div class="t">${esc(c.t)}</div><div class="s">${esc(c.ty || '')} ${esc(c.c || '')} · ${esc(c.ln || '')} m · ${esc(x.title)}</div></div><span class="badge ${x.kind === 'req' ? 'b-no' : 'b-part'}">${need(x)}</span><span class="chev">›</span></button>`).join('') || '<div class="empty">–</div>'}</div>
      ${list.length > 400 ? `<div class="s2">${L('First 400 shown', 'Показаны первые 400')}</div>` : ''}`;
  };
})();
