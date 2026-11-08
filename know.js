// v4.37 (08.11.2026): ENGINEERING KNOWLEDGE – "why are we doing this?" cards on cable, item, panel, activity and loop pages,
// a Knowledge menu with search and practical "why" examples, and an engineering-verification block on cable pages.
// Content: know.json (general engineering knowledge). Project facts on each page come from the drawings / cable schedule only.
(function () {
  const KN = window.KN = {d: null, lvl: 'b'};
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const P = (pair) => Array.isArray(pair) ? (RU ? pair[1] : pair[0]) : pair;
  try { KN.lvl = localStorage.getItem('kn_lvl') || 'b'; } catch (e) {}
  KN.setLvl = function (l) { KN.lvl = l; try { localStorage.setItem('kn_lvl', l); } catch (e) {} route(); };

  fetch('know.json?v=' + (window.APPV || '')).then(r => r.json()).then(d => { KN.d = d; if (/^#\/(c|i|p|a|kn|lc)\b/.test(location.hash)) route(); }).catch(() => {});

  // ---- matching
  function match(ctx) {
    if (!KN.d) return [];
    const txt = (ctx.txt || '').toLowerCase(), ty = ctx.ty || '', act = (ctx.act || '').toLowerCase();
    const out = [];
    KN.d.items.forEach(it => {
      const m = it.m || {}; let hit = false;
      if (m.ty && ty && new RegExp(m.ty, 'i').test(ty)) hit = true;
      if (m.txt && txt && new RegExp(m.txt, 'i').test(txt)) hit = true;
      if (m.act && act && new RegExp(m.act, 'i').test(act)) hit = true;
      if (m.loop && ctx.loop) hit = true;
      if (m.any && ctx.cable) hit = true;
      if (hit) out.push(it);
    });
    // cable pages: specific cable type first, then the general cable card, then tests
    const rank = it => (ctx.loop && (it.m || {}).loop) ? -1 : it.k === 'cable' && !(it.m || {}).any ? 0 : it.k === 'cable' ? 1 : it.k === 'termination' ? 2 : it.k === 'test' ? 4 : 3;
    return out.sort((a, b) => rank(a) - rank(b)).slice(0, ctx.max || 6);
  }

  // ---- rendering
  const li = arr => (arr || []).length ? `<ul style="margin:4px 0 0 18px;padding:0">${arr.map(x => `<li style="margin:2px 0">${esc(x)}</li>`).join('')}</ul>` : '';
  function entry(it, open) {
    const lvl = KN.lvl;
    const more = `
      ${lvl !== 'b' ? `<div style="margin-top:8px"><b>${L('Technician – install, identify, check', 'Техник – монтаж, идентификация, проверка')}</b>${li(it.tech)}</div>` : ''}
      ${lvl === 'e' ? `<div style="margin-top:8px"><b>${L('Engineer – design reasons and ratings', 'Инженер – проектные причины и параметры')}</b>${li(it.eng)}</div>` : ''}
      ${lvl !== 'b' ? `<div style="margin-top:8px"><b>${L('Inspection checklist', 'Что проверить')}</b> <span class="s2">${(it.chk || []).map(esc).join(' · ')}</span></div>
      <div style="margin-top:6px"><b style="color:var(--bad)">${L('Common mistakes', 'Типичные ошибки')}</b> <span class="s2">${(it.mis || []).map(esc).join(' · ')}</span></div>` : ''}
      <div class="s2" style="margin-top:8px">${L('References', 'Источники')}: ${(it.ref || []).map(esc).join('; ')}</div>`;
    return `<details ${open ? 'open' : ''} style="border-top:1px solid var(--line);padding:8px 0"><summary style="cursor:pointer;font-weight:600">${esc(P(it.t))}</summary>
      <div style="font-size:13px;line-height:1.45;margin-top:6px">${esc(P(it.b))}${more}</div></details>`;
  }
  function lvlChips() {
    const lv = KN.d ? KN.d.levels : {b: ['Beginner', 'Начинающий'], t: ['Technician', 'Техник'], e: ['Engineer', 'Инженер']};
    return `<div class="chips" style="margin:6px 0 0">${Object.keys(lv).map(k => `<button class="chip ${KN.lvl === k ? 'on' : ''}" onclick="KN.setLvl('${k}')">${esc(P(lv[k]))}</button>`).join('')}</div>`;
  }
  KN.card = function (ctx) {
    if (!KN.d) return '';
    const list = match(ctx); if (!list.length) return '';
    return `<div class="card" style="border-left:4px solid var(--pri)"><div class="h3">🎓 ${L('Engineering knowledge – why are we doing this?', 'Инженерные знания – зачем мы это делаем?')}</div>
      <div class="s2">${L('General engineering – the project facts above (type, cores, terminals) always come from the approved drawings.', 'Общая инженерия – проектные данные выше (марка, жилы, клеммы) всегда берутся из утверждённых чертежей.')}</div>${lvlChips()}
      <div style="margin-top:6px">${list.map((it, i) => entry(it, i === 0)).join('')}</div>
      <div style="margin-top:8px"><span class="link" onclick="go('#/kn')">${L('Open knowledge menu ›', 'Открыть меню знаний ›')}</span></div></div>`;
  };

  // ---- engineering verification block (cable): design spec vs installed – never auto-compliant
  KN.verify = function (c) {
    if (!c) return '';
    const se = (window.S2 && S2.c && S2.c[c.t]) || {}; const rem = se.R ? String(se.R.v || '') : '';
    const mism = /(другой|другая|заменен|замен|different|wrong|instead|не тот|not as|substitut)/i.test(rem);
    const st = mism ? ['Requires engineering review', 'Требует инженерной проверки', 'b-no'] : ['Insufficient information – installed type not recorded', 'Недостаточно данных – установленный тип не записан', 'b-na'];
    return `<div class="card"><div class="h3">🔍 ${L('Engineering verification', 'Инженерная проверка')} <span class="badge ${st[2]}">${L(st[0], st[1])}</span></div>
      ${kv([[L('Required (cable schedule)', 'Требуется (кабельный журнал)'), `${esc(c.ty || '–')} · ${esc(c.c || '–')} · ${esc(c.ln || '–')} m`], [L('Document', 'Документ'), esc(c.d || '–')], [L('Installed (site)', 'Установлено (площадка)'), rem ? esc(rem) : L('not recorded – write the drum / type seen on site in the remark above', 'не записано – укажите барабан / марку с площадки в примечании выше')], [L('Drum (tracker)', 'Барабан (трекер)'), esc(c.dr || '–')]])}
      <div class="s2" style="margin-top:6px">${L('Compliant only when the installed type, size and cores equal the schedule and the drum is the one allocated in the tracker. Any difference → TQ, not a site decision.', 'Соответствует только если марка, сечение и жилы совпадают с журналом, а барабан – из распределения трекера. Любое отличие → TQ, а не решение на площадке.')}</div></div>`;
  };

  // ---- home tile + menu
  KN.tile = function () {
    return `<div class="sect">🎓 ${L('Engineering knowledge', 'Инженерные знания')}</div><div class="grid"><button class="tile main" onclick="go('#/kn')"><b>🎓 ${L('Understand what you are working with', 'Понимай, с чем работаешь')}</b><div><span class="n">${L('components · cables · devices · tests · why', 'компоненты · кабели · устройства · испытания · почему')}</span></div></button></div>`;
  };
  KN.q = '';
  KN.route = function (rest) {
    window.scrollTo(0, 0);
    setHead('🎓 ' + L('Engineering knowledge', 'Инженерные знания'), PRJ);
    if (!KN.d) { main.innerHTML = '<div class="empty">Loading…</div>'; return; }
    const k = rest[0] || '';
    if (k === 'faq') return faq();
    const kinds = [['component', L('Components', 'Компоненты')], ['cable', L('Cables', 'Кабели')], ['device', L('Devices', 'Устройства')], ['test', L('Tests', 'Испытания')], ['termination', L('Termination', 'Подключение')]];
    const q = KN.q.toLowerCase();
    const items = KN.d.items.filter(it => !q || (P(it.t) + ' ' + P(it.b) + ' ' + (it.tech || []).join(' ') + ' ' + (it.eng || []).join(' ')).toLowerCase().includes(q));
    main.innerHTML = `<div class="card"><input class="fin" value="${esc(KN.q)}" placeholder="${L('Search: diode, shield, IR test, gland…', 'Поиск: диод, экран, изоляция, ввод…')}" oninput="KN.q=this.value;KN.route([])">${lvlChips()}
      <div class="s2" style="margin-top:6px">${esc(KN.d.note)}</div></div>
      <div class="grid"><button class="tile" onclick="go('#/kn/faq')"><b>❓ ${L('Why do we…? – 15 practical answers', 'Почему мы…? – 15 практических ответов')}</b><span class="n">${L('relay diode · EOL resistor · shields · 4–20 mA · IS barriers', 'диод реле · оконечный резистор · экраны · 4–20 мА · барьеры')}</span></button></div>
      ${kinds.map(([kk, lbl]) => { const l = items.filter(it => it.k === kk); return l.length ? `<div class="sect">${lbl} (${l.length})</div><div class="card">${l.map(it => entry(it, !!q)).join('')}</div>` : ''; }).join('')}`;
  };
  function faq() {
    main.innerHTML = `<div class="chips"><button class="chip" onclick="go('#/kn')">‹ ${L('Knowledge', 'Знания')}</button></div><div class="card">${KN.d.faq.map(f => `<details style="border-top:1px solid var(--line);padding:8px 0"><summary style="cursor:pointer;font-weight:600">${esc(RU ? f[1] : f[0])}</summary><div style="font-size:13px;line-height:1.45;margin-top:6px">${esc(RU ? f[3] : f[2])}</div></details>`).join('')}</div>
      <div class="foot">${L('General engineering principles. Project requirements are in the approved specifications and drawings.', 'Общие инженерные принципы. Требования проекта – в утверждённых спецификациях и чертежах.')}</div>`;
  }
})();
