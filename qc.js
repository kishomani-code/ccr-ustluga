// v4.87 (21.11.2026): QC TEAM – one separate main menu for the QC team (route #/qc), English / Russian like the rest of the app.
// Data: qc.json (tools/build_qc.js – from the site data files after every data update).
//  - QC comments = client master punch list lines with "Responsible Department" = QC, all our areas (CCR, 1801, D48, 8810)
//  - "Can be closed now": RHI punch open but the client punch with the same tag AND same punch is closed; old client punch
//    still open while a later one with the same tag and same text is closed; QC punch open while the client RFI is accepted
//  - Excel export on every list, in the master punch list format (sheet "Log of Mechanical Progress", Calibri 12, same columns)
(function () {
  const QC = window.QC = {d: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || !Array.isArray(d.rows)) return; const first = !QC.d; QC.d = d; QC.P = {};
    d.rows.forEach(r => { const p = {}; d.K.forEach((k, i) => p[k] = d.TABK.includes(k) ? d.tabs[k][r[i]] : r[i]); p.int = /^RHI-/.test(p.no); p.open = p.st !== 'Closed'; QC.P[p.no] = p; });
    QC.Q = Object.values(QC.P).filter(p => !p.int && p.dept === 'QC');
    QC.X = {}; Object.keys(d.x).forEach(k => QC.X[k] = d.x[k].map(([a, B]) => ({p: QC.P[a], m: B.map(b => QC.P[b]).filter(Boolean)})).filter(r => r.p));
    const h = location.hash.replace(/^#\/?/, ''); if (first && /^qc(\/|$)/.test(h) && typeof route === 'function') { try { route(); } catch (e) {} } }
  QC.load = function () { cget('qc.json').then(d => { if (d) set(d); return net('qc.json'); }).then(d => { if (d && (!QC.d || d.ver !== QC.d.ver)) set(d); }).catch(() => {}); };

  // ---------- names ----------
  const KIND = {meas: ['📏', 'Measurement protocols', 'Протоколы измерений'], refl: ['📈', 'Reflectogram (optical cable)', 'Рефлектограмма (оптика)'], fri: ['🔍', 'Inspection / FRI not presented', 'Инспекция / FRI не предъявлена'], doc: ['📄', 'Documents (as-built, certificates)', 'Документы (ИД, АОСР)'], oth: ['❔', 'Other', 'Прочее']};
  const SITE = {CCR: ['CCR building', 'Здание ЦО'], '1801': ['CCR area 1801', 'Зона ЦО 1801'], D48: ['D48 substation', 'Подстанция D48'], '8810': ['Fire-water pumps 8810', 'Насосная 8810']};
  const XT = {
    close: ['🔧', 'RHI punch – can be closed', 'Замечание РХИ – можно закрыть', 'client punch with the same tag and same punch is closed', 'замечание заказчика по тому же тегу закрыто', 'Close RHI punch – client punch closed', '#1e7b34'],
    rep: ['📤', 'Old client punch – report as closed', 'Старое замечание заказчика – подать на закрытие', 'a later client punch, same tag and same text, is closed', 'более позднее такое же замечание по тегу закрыто', 'Report to client – same punch already closed', '#0b6e6e'],
    rfi: ['✅', 'QC punch – client RFI accepted', 'Замечание QC – ЗПИ принята', 'cable RFI accepted in Cable RAWP – report with the RFI number', 'ЗПИ по кабелю принята – подать с номером ЗПИ', 'Report with RFI number and protocol', '#1a56b0'],
    ask: ['🙋', 'Client punch open – RHI punch closed', 'Замечание заказчика открыто – РХИ закрыто', 'ask the client to inspect and close', 'просить заказчика принять и закрыть', 'Ask client to close', '#c2410c'],
    chk: ['🔎', 'QC punch – other QC punch on tag closed', 'Замечание QC – другое по тегу закрыто', 'check, it may be the same work', 'проверить – возможно та же работа', 'Check – may be the same work', '#475467']};
  const desc = p => (RU ? (p.dru || p.den) : (p.den && p.den !== '-' ? p.den : p.dru)) || p.tagd || '';
  const subn = p => RU ? p.subn : (p.subnE || p.subn);
  const days = p => { const m = /^(\d\d)\.(\d\d)\.(\d{4})/.exec(p.idate || ''); return m ? Math.max(0, Math.round((Date.now() - new Date(+m[3], +m[2] - 1, +m[1])) / 864e5)) : 0; };
  const pc = (a, b) => b ? Math.round(a * 100 / b) : 0;
  const stB = p => p.open ? `<span class="badge b-no">${L('Open', 'Открыто')}</span>` : `<span class="badge b-ok">${L('Closed', 'Закрыто')}</span>`;
  const catB = p => `<span class="badge ${p.cat === 'A' ? 'b-no' : p.cat === 'B' ? 'b-part' : 'b-na'}">${L('Cat', 'Кат')} ${esc(p.cat || '-')}</span>`;
  const T2 = (h, b, n, p, sty) => `<button class="tile" style="${sty || ''}" onclick="go('${h}')"><b>${b}</b><div><span class="n">${n}</span>${p != null ? `<div class="pc">${p}%</div><div class="pbar"><i style="width:${p}%"></i></div>` : ''}</div></button>`;
  const Tc = (h, b, n, col) => T2(h, b, n, null, `background:${col};border-color:${col};color:#fff`);

  // ---------- routing ----------
  QC.route = function (rest) { const k = rest[0] || '', a = dec(rest.slice(1).join('/'));
    if (!QC.d) { main.innerHTML = '<div class="empty">Loading…</div>'; QC.load(); return; }
    const h = k === 'l' ? list(a) : k === 'p' ? item(a) : k === 'r' ? rules() : home(); if (typeof h === 'string') main.innerHTML = '<div data-nt>' + h + '</div>'; };

  // ---------- fancy dashboard ----------
  const CSS = `<style>
   .qch{background:linear-gradient(135deg,#0f2a4a 0%,#1a56b0 55%,#16a34a 130%);color:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 10px 24px rgba(15,42,74,.25);position:relative;overflow:hidden}
   .qch:after{content:'';position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.08)}
   .qch h2{margin:0;font-size:18px;font-weight:700}.qch p{margin:3px 0 0;font-size:12px;opacity:.9}
   .qcd{display:grid;grid-template-columns:132px 1fr;gap:12px;align-items:center;margin-top:12px}
   .qcr{position:relative;width:132px;height:132px}.qcr svg{transform:rotate(-90deg)}.qcr circle{fill:none;stroke-width:13;stroke-linecap:round}
   .qcr .c2{transition:stroke-dashoffset 1.1s ease}.qcr div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
   .qcr b{font-size:28px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}.qcr span{font-size:11px;opacity:.9}
   .qck{display:grid;grid-template-columns:1fr 1fr;gap:8px}.qck div{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:8px 10px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
   .qck b{display:block;font-size:22px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}.qck span{font-size:11px;opacity:.92}
   .qcb{margin:7px 0}.qcb .h{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:600}.qcb .h span{font-weight:400;color:var(--mut);white-space:nowrap}
   .qcb .b{height:10px;border-radius:6px;background:rgba(180,35,24,.18);overflow:hidden;margin-top:3px}.qcb .b i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#16a34a,#4ade80);transition:width 1s ease}
   .qca{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:6px}
   .qca button{border:0;border-radius:14px;padding:12px;color:#fff;text-align:left;box-shadow:0 6px 16px rgba(0,0,0,.14);cursor:pointer;font:inherit}
   .qca b{display:block;font-size:26px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}.qca span{display:block;font-size:12.5px;font-weight:600;margin-top:4px}.qca i{display:block;font-style:normal;font-size:11px;opacity:.9;margin-top:2px}
   @media(max-width:380px){.qcd{grid-template-columns:1fr}.qcr{margin:0 auto}}
  </style>`;
  function ring(p) { const r = 56, c = 2 * Math.PI * r; return `<div class="qcr"><svg width="132" height="132" viewBox="0 0 132 132"><circle cx="66" cy="66" r="${r}" stroke="rgba(255,255,255,.22)"/><circle class="c2" cx="66" cy="66" r="${r}" stroke="#4ade80" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/></svg><div><b>${p}%</b><span>${L('closed', 'закрыто')}</span></div></div>`; }
  const bar = (name, cl, n, h) => `<div class="qcb" ${h ? `onclick="go('${h}')" style="cursor:pointer"` : ''}><div class="h">${name}<span>${cl}/${n} · ${L('open', 'откр.')} <b style="color:${n - cl ? 'var(--bad)' : 'var(--ok)'}">${n - cl}</b></span></div><div class="b"><i style="width:${pc(cl, n)}%"></i></div></div>`;

  function home() { const d = QC.d, Q = QC.Q, O = Q.filter(p => p.open), X = QC.X;
    setHead(L('QC team', 'Отдел QC') + ' · GPP E&I', `v${typeof APPV !== 'undefined' ? APPV : ''} · ${L('punch data', 'данные')} ${d.date}`);
    const by = (f) => { const m = {}; Q.forEach(p => { const k = f(p); const g = m[k] = m[k] || {n: 0, c: 0}; g.n++; if (!p.open) g.c++; }); return m; };
    const S = by(p => p.s), Kd = by(p => p.k), Sb = by(p => p.sub);
    const old = O.reduce((m, p) => Math.max(m, days(p)), 0), nA = O.filter(p => p.cat === 'A').length;
    const can = ['close', 'rep', 'rfi', 'ask', 'chk'].filter(k => (X[k] || []).length);
    const subs = Object.keys(Sb).filter(k => Sb[k].n - Sb[k].c).sort((a, b) => (Sb[b].n - Sb[b].c) - (Sb[a].n - Sb[a].c));
    return `${CSS}
     <div class="qch"><h2>🛡️ ${L('QC team – punch and inspection follow-up', 'Отдел QC – замечания и инспекции')}</h2><p>${L('Client master punch list · responsible department QC · CCR, 1801, D48, 8810', 'Мастер-лист замечаний заказчика · ответственный отдел QC · ЦО, 1801, D48, 8810')}</p>
      <div class="qcd">${ring(pc(Q.length - O.length, Q.length))}<div class="qck"><div><b>${O.length}</b><span>${L('QC comments open', 'открыто замечаний QC')}</span></div><div><b>${Q.length - O.length}</b><span>${L('closed', 'закрыто')}</span></div><div><b>${nA}</b><span>${L('open category A', 'открыто кат. A')}</span></div><div><b>${old}</b><span>${L('days – oldest open', 'дней – самое старое')}</span></div></div></div></div>
     ${can.length ? `<div class="sect">⚡ ${L('Can be closed now – evidence found', 'Можно закрыть – есть основание')}</div><div class="qca">${can.map(k => `<button style="background:linear-gradient(135deg,${XT[k][6]},${XT[k][6]}cc)" onclick="go('#/qc/l/${k}')"><b>${X[k].length}</b><span>${XT[k][0]} ${L(XT[k][1], XT[k][2])}</span><i>${L(XT[k][3], XT[k][4])}</i></button>`).join('')}</div>` : ''}
     <div class="sect">📊 ${L('QC comments by kind', 'Замечания QC по видам')}</div><div class="card">${Object.keys(KIND).filter(k => Kd[k]).map(k => bar(`${KIND[k][0]} ${L(KIND[k][1], KIND[k][2])}`, Kd[k].c, Kd[k].n, '#/qc/l/' + enc('q||' + k))).join('')}</div>
     <div class="sect">🏢 ${L('By area', 'По зонам')}</div><div class="grid">${Object.keys(SITE).filter(k => S[k]).map(k => T2('#/qc/l/' + enc('q|' + k), L(SITE[k][0], SITE[k][1]), `${S[k].n - S[k].c} ${L('open', 'открыто')} · ${S[k].c}/${S[k].n} ${L('closed', 'закрыто')}`, pc(S[k].c, S[k].n))).join('')}</div>
     <div class="sect">🧩 ${L('Open QC comments by subsystem', 'Открытые замечания QC по подсистемам')}</div><div class="card">${subs.slice(0, 12).map(k => bar(esc(k), Sb[k].c, Sb[k].n, '#/qc/l/' + enc('q|||' + k))).join('') || `<div class="empty">${L('No open QC comments', 'Открытых замечаний QC нет')}</div>`}</div>
     <div class="sect">📋 ${L('Lists', 'Списки')}</div><div class="grid">
      ${T2('#/qc/l/q', L('🔎 All open QC comments · search', '🔎 Все открытые замечания QC · поиск'), `${O.length} ${L('open', 'открыто')}`)}
      ${T2('#/qc/l/' + enc('q||||A'), L('🅰️ Open category A', '🅰️ Открытые категории A'), `${nA} ${L('block the handover', 'мешают сдаче')}`)}
      ${T2('#/qc/l/' + enc('q||||all'), L('🗂 All QC comments (open + closed)', '🗂 Все замечания QC (открытые + закрытые)'), `${Q.length}`)}
      ${T2('#/qc/r', L('📚 Rules for closing punches', '📚 Правила закрытия замечаний'), L('what we agreed', 'что согласовано'))}
      <button class="tile main" onclick="location.href='qc-calc/'"><b>🧮 ${L('QC inspection calculator', 'Калькулятор QC-инспекции')}</b><div><span class="n">${L('system → subsystem → device → cables → earthing → accept / reject · EN + RU export', 'система → подсистема → оборудование → кабели → заземление → принять / отклонить')}</span></div></button></div>
     <div class="sect">⬇ ${L('Excel – master punch list format', 'Excel – формат мастер-листа')}</div><div class="grid">
      <button class="tile main" onclick="QC.xls('open')"><b>⬇ ${L('Open QC comments', 'Открытые замечания QC')}</b><div><span class="n">${O.length} ${L('lines', 'строк')}</span></div></button>
      <button class="tile" onclick="QC.xls('can')"><b>⬇ ${L('Can be closed now – all lists', 'Можно закрыть – все списки')}</b><div><span class="n">${can.reduce((n, k) => n + X[k].length, 0)} ${L('lines · one sheet per list', 'строк · лист на каждый список')}</span></div></button></div>
     <div class="foot">${L('Source', 'Источник')}: ${esc(d.src || '')}. ${L('Same tag AND same punch only. A closed FRI / inspection punch does not close the other punches on the tag. Read both descriptions before closing.', 'Только тот же тег И то же замечание. Закрытое замечание FRI / инспекции не закрывает остальные замечания по тегу. Перед закрытием прочитайте оба описания.')}</div>`; }

  // ---------- lists ----------
  // route argument: list|site|kind|subsystem|status   (list = q, close, rep, rfi, ask, chk; status = '' open, all, A)
  function rowsOf(a) { const [lk, si, ki, sb, stf] = (a || 'q').split('|'); let R;
    if (lk === 'q') R = QC.Q.filter(p => stf === 'all' ? true : stf === 'A' ? p.open && p.cat === 'A' : p.open).map(p => ({p, m: []})); else R = (QC.X[lk] || []).slice();
    R = R.filter(r => (!si || r.p.s === si) && (!ki || r.p.k === ki) && (!sb || r.p.sub === sb));
    const q = N((QC._q || '')); if (q) R = R.filter(r => N([r.p.no, r.p.tag, r.p.sub, r.p.dru, r.p.den, r.p.by, r.m.map(x => x.no).join(' ')].join(' ')).includes(q));
    return {lk, si, ki, sb, stf, R}; }
  function title(F) { const t = F.lk === 'q' ? L('QC comments', 'Замечания QC') : L(XT[F.lk][1], XT[F.lk][2]);
    return t + (F.si ? ' · ' + L(SITE[F.si][0], SITE[F.si][1]) : '') + (F.ki ? ' · ' + L(KIND[F.ki][1], KIND[F.ki][2]) : '') + (F.sb ? ' · ' + F.sb : '') + (F.stf === 'A' ? ' · ' + L('category A', 'категория A') : F.stf === 'all' ? ' · ' + L('open + closed', 'открытые + закрытые') : ''); }
  function line(r, lk) { const p = r.p; const m = r.m[0];
    return `<button class="li" onclick="go('#/qc/p/${enc(p.no)}')"><div class="m"><div class="t">${esc(p.no)} · ${esc(p.tag || p.sub)}</div>
     <div class="s" style="white-space:normal">${esc(desc(p).slice(0, 170))}</div>
     ${m ? `<div class="s2" style="white-space:normal;color:var(--ok)">${lk === 'ask' ? L('Client open', 'Заказчик – открыто') : L('Closed', 'Закрыто')}: № ${r.m.slice(0, 3).map(x => esc(x.no) + (x.cdate ? ' ' + esc(x.cdate) : '')).join(', ')}${r.m.length > 3 ? ' +' + (r.m.length - 3) : ''} – ${esc(desc(m).slice(0, 90))}</div>` : ''}
     ${lk === 'rfi' && p.rfi ? `<div class="s2" style="color:var(--ok)">${L('RFI', 'ЗПИ')}: ${esc(p.rfi[0] || p.rfi[3])} · ${esc(p.rfi[1] || p.rfi[4])} ${esc(p.rfi[2] || p.rfi[5])}</div>` : ''}
     <div class="s2">${esc(p.tc)} · ${esc(p.sub)} · ${L('issued', 'выдано')} ${esc(p.idate)}${p.open ? ' · ' + days(p) + ' ' + L('days', 'дн.') : ' · ' + L('closed', 'закрыто') + ' ' + esc(p.cdate)}</div></div><div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">${stB(p)}${catB(p)}</div></button>`; }
  function list(a) { const F = rowsOf(a); QC._a = a; QC._lim = QC._lim || 150;
    setHead(title(F), `${F.R.length} · ${L('data', 'данные')} ${QC.d.date}`);
    const info = F.lk !== 'q' ? `<div class="card"><div class="kv">${XT[F.lk][0]} <b>${L(XT[F.lk][1], XT[F.lk][2])}</b> – ${L(XT[F.lk][3], XT[F.lk][4])}. ${L('Read both descriptions before closing.', 'Перед закрытием прочитайте оба описания.')}</div></div>` : '';
    return `${info}<div class="mgf"><input class="fin" placeholder="${L('Search tag / punch No / subsystem / text…', 'Поиск: тег / № / подсистема / текст…')}" value="${esc(QC._q || '')}" oninput="QC._q=this.value;QC._lim=150;QC.redraw()"></div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0"><button class="tile main" style="min-height:auto" onclick="QC.xls('list')"><b>⬇ ${L('Excel – master punch format', 'Excel – формат мастер-листа')}</b></button><button class="tile" style="min-height:auto" onclick="QC.share()"><b>↗ ${L('Share / copy', 'Поделиться')}</b></button></div>
     <div id="qcl">${body(F)}</div>`; }
  function body(F) { const lim = QC._lim || 150; return F.R.length ? `<div class="list">${F.R.slice(0, lim).map(r => line(r, F.lk)).join('')}</div>${F.R.length > lim ? `<button class="more" onclick="QC._lim+=300;QC.redraw()">${L('Show more', 'Показать ещё')} (${F.R.length - lim})</button>` : ''}` : `<div class="empty">${L('Nothing found', 'Ничего не найдено')}</div>`; }
  QC.redraw = function () { const el = document.getElementById('qcl'); if (el) el.innerHTML = body(rowsOf(QC._a)); };

  // ---------- one punch ----------
  function item(no) { const p = QC.P[no]; if (!p) return `<div class="empty">${L('Not found', 'Не найдено')}</div>`;
    setHead(p.no, p.tag || p.sub);
    const kv = (k, v) => v && v !== '-' ? `<div class="kv"><span style="color:var(--mut)">${k}:</span> ${esc(v)}</div>` : '';
    const rel = []; Object.keys(QC.X).forEach(k => QC.X[k].forEach(r => { if (r.p === p) r.m.forEach(m => rel.push([k, m])); else if (r.m.includes(p)) rel.push([k, r.p]); if (r.p === p && !r.m.length) rel.push([k, null]); }));
    const same = Object.values(QC.P).filter(q => q !== p && q.tag && q.tag === p.tag);
    return `<div class="card"><div class="h3">${esc(p.no)} ${stB(p)} ${catB(p)}</div>
      <div class="kv" style="font-weight:600;word-break:break-all">${esc(p.tag)}</div>${kv(L('Tag description', 'Описание тега'), RU ? p.tagd : (p.tage || p.tagd))}
      <div class="kv" style="margin-top:6px;white-space:normal">${esc(p.dru)}</div>${p.den && p.den !== '-' ? `<div class="kv" style="white-space:normal;color:var(--mut)">${esc(p.den)}</div>` : ''}</div>
     <div class="card">${kv(L('Title', 'Титул'), p.tc + ' ' + p.tn)}${kv(L('System', 'Система'), p.sy + ' ' + p.syn)}${kv(L('Subsystem', 'Подсистема'), p.sub + ' ' + subn(p))}${kv(L('Discipline', 'Дисциплина'), RU ? p.disc : (p.discE || p.disc))}${kv(L('Priority', 'Приоритет'), p.pri)}${kv(L('Issued', 'Выдано'), p.idate + (p.open ? ' · ' + days(p) + ' ' + L('days open', 'дн. открыто') : ''))}${kv(L('Issued by', 'Выдал'), p.by + (p.org ? ' · ' + p.org : ''))}${kv(L('Responsible', 'Ответственный'), p.resp + ' · ' + p.dept)}${kv(L('Closed', 'Закрыто'), p.cdate)}${kv(L('Inspection status', 'Статус осмотра'), p.insp)}${kv(L('ACT status', 'Статус АКТ'), p.act)}${kv(L('Notes', 'Примечание'), p.notes)}${kv(L('Reason for closure', 'Основание закрытия'), p.reason)}</div>
     ${p.rfi ? `<div class="card"><div class="h3">${L('Client RFI (Cable RAWP)', 'ЗПИ заказчика (Cable RAWP)')}</div>${kv(L('Laying', 'Прокладка'), [p.rfi[0], p.rfi[1], p.rfi[2]].filter(Boolean).join(' · '))}${kv(L('Termination', 'Расключение'), [p.rfi[3], p.rfi[4], p.rfi[5]].filter(Boolean).join(' · '))}</div>` : ''}
     ${rel.length ? `<div class="sect">⚡ ${L('Why it can be closed', 'Основание для закрытия')}</div><div class="list">${rel.map(([k, m]) => m ? `<button class="li" onclick="go('#/qc/p/${enc(m.no)}')"><div class="m"><div class="t">${XT[k][0]} ${L(XT[k][1], XT[k][2])}</div><div class="s" style="white-space:normal">№ ${esc(m.no)} ${stB(m)} ${esc(m.cdate || '')} – ${esc(desc(m).slice(0, 140))}</div></div><span class="chev">›</span></button>` : `<div class="li"><div class="m"><div class="t">${XT[k][0]} ${L(XT[k][1], XT[k][2])}</div><div class="s" style="white-space:normal">${L(XT[k][3], XT[k][4])}</div></div></div>`).join('')}</div>` : ''}
     ${same.length ? `<div class="sect">${L('Other punches on this tag', 'Другие замечания по тегу')} (${same.length})</div><div class="list">${same.slice(0, 30).map(q => `<button class="li" onclick="go('#/qc/p/${enc(q.no)}')"><div class="m"><div class="t">${esc(q.no)}${q.int ? ' · RHI' : ''}</div><div class="s" style="white-space:normal">${esc(desc(q).slice(0, 140))}</div></div>${stB(q)}</button>`).join('')}</div>` : ''}`; }

  // ---------- rules ----------
  function rules() { setHead(L('Rules for closing punches', 'Правила закрытия замечаний'), L('QC team', 'Отдел QC'));
    const R = [
      ['Client punch closed → RHI punch can be closed', 'Замечание заказчика закрыто → замечание РХИ можно закрыть', 'Only when it is the same tag AND the same punch (same description or same punch type). Tag alone is not enough.', 'Только если тот же тег И то же замечание (то же описание или тот же вид). Одного тега недостаточно.'],
      ['A closed FRI / inspection punch closes nothing else', 'Закрытое замечание FRI / инспекции не закрывает другие', 'The client closing an FRI punch does not mean the other punches on that tag are closed. Some stay open.', 'Закрытие заказчиком замечания FRI не означает, что закрыты остальные замечания по тегу.'],
      ['Old client punch, same text, later one closed', 'Старое замечание заказчика, тот же текст, более позднее закрыто', 'The old punch can be reported for closing with the number and date of the closed one.', 'Старое замечание можно подать на закрытие с номером и датой закрытого.'],
      ['Client RFI accepted', 'ЗПИ заказчика принята', 'For a measurement / inspection punch on a cable: attach the protocol and quote the accepted RFI number from the Cable RAWP.', 'Для замечания по измерениям / инспекции кабеля: приложите протокол и укажите номер принятой ЗПИ из Cable RAWP.'],
      ['Only open punches are reported', 'Подаются только открытые замечания', 'Only punches still open in the latest client master punch list go into a punch report.', 'В отчёт идут только замечания, открытые в последнем мастер-листе заказчика.'],
      ['Aleksy file', 'Файл Алексея', 'Reported punches must appear in the closure-confirmation file within 2 days; if not – inform him. Closed there but open in the master list → report again to the master list.', 'Поданные замечания должны появиться в файле подтверждения за 2 дня; если нет – сообщить. Закрыто там, но открыто в мастер-листе → подать повторно.'],
      ['Signed closing forms', 'Подписанные формы закрытия', 'Only a real client signature (or the arrow / bracket over the rows) counts as closed. A tick alone is not closed.', 'Закрытым считается только подпись заказчика (или стрелка / скобка по строкам). Одна галочка – не закрыто.'],
      ['Before closing', 'Перед закрытием', 'Read both descriptions. The app only shows candidates; the QC engineer decides.', 'Прочитайте оба описания. Приложение показывает кандидатов; решение принимает инженер QC.']];
    return `<div class="list">${R.map((r, i) => `<div class="li"><div class="m"><div class="t" style="white-space:normal">${i + 1}. ${esc(L(r[0], r[1]))}</div><div class="s" style="white-space:normal">${esc(L(r[2], r[3]))}</div></div></div>`).join('')}</div>
     <div class="grid" style="margin-top:8px">${T2('#/px/ak', L('👷 Closed by Aleksy – still open', '👷 Закрыто у Алексея – открыто'), L('per area · open the area first', 'по зоне · сначала выберите зону'))}${T2('#/px/sg', L('📄 Signed PDF – not closed in list', '📄 Подписанный PDF – не закрыто'), L('per area', 'по зоне'))}${T2('#/ncr/', L('📕 NCR register', '📕 Реестр NCR'), '532RHI-QA-RGS-006')}</div>`; }

  // ---------- Excel: master punch list format ----------
  const MH = ['GA Punch No.', 'Титул\nTitle', 'Наменование титула\nTitle Name', 'Система\nSystem', 'Наименование системы\nSystem Name', 'Подсистема\nSubsystem', 'Наименование подсистемы\nSubsystem Name', 'приоритет\nPriority', 'Дисциплина\nDiscipline', 'Tэг\nTag', 'Описание тэга\nTag description', 'Раздел', 'Описание замечания\nDescription of The Remark (RU)', 'Описание замечания\nDescription of The Remark (ENG)', 'Этап выдачи замечания', 'Дата выдачи\nDate of Issue', 'задержка\nDelay', 'Целевая дата устранения\nTarget Date of Elimination', 'Кaтегория\nCategory', 'ФИО выдавшего\nFull Name of The Issuer', 'Организация выдавшего\nOrganization of The Issuer', 'Ответственный EPC-подрядчик\nResponsible EPC Contractor', 'Ответственный за устранение (организация)\nPerson Responsible', 'Статус\nStatus', 'Дата устранения\nDate of Elimination', 'Notes\nПримечание', 'Основание закрытия\nReason For Closure', 'Столбец 1\nColumn 1', 'Ответственный отдел Responsible Department', 'Key', 'Осмотр Статус\nInspection Status', 'AKT Статус\nACT Status', 'ссылка\nRemarks'];
  const MN = ['#', 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  const MW = [12.6, 23.1, 37.7, 15.3, 43, 35.4, 51, 12.6, 27, 41, 46.6, 16.9, 53.7, 67.6, 33.4, 16.1, 16.1, 20.9, 12.1, 22.6, 14.1, 23.9, 28.6, 10.3, 13.9, 20.3, 27.1, 22.4, 25.6, 31.3, 25.7, 17.1, 19.1];
  const XH = ['Что делать\nAction', 'Основание – № замечания\nEvidence – punch No.', 'Основание – статус / дата\nEvidence – status / date', 'ЗПИ заказчика\nClient RFI'], XW = [38, 22, 24, 40];
  const dz = v => (v === '' || v == null) ? '-' : v;
  const mrow = p => [p.no, p.tc, dz(p.tn), dz(p.sy), dz(p.syn), dz(p.sub), dz(p.subn), dz(p.pri), dz(p.disc), dz(p.tag), dz(p.tagd), dz(p.sec), dz(p.dru), dz(p.den), dz(p.stg), dz(p.idate), p.open ? days(p) : dz(p.delay), '-', dz(p.cat), dz(p.by), dz(p.org), dz(p.epc), dz(p.resp), p.open ? 'Открыто' : 'Закрыто', dz(p.cdate), dz(p.notes), dz(p.reason), '-', dz(p.dept), [p.sub, p.tag, p.dru].join('//'), dz(p.insp), dz(p.act), dz(p.rem)];
  const xrow = (r, lk) => { const m = r.m; return mrow(r.p).concat(lk === 'q' ? [] : [XT[lk][5], m.map(x => x.no).join(', ') || '-', m.length ? (m[0].open ? 'Открыто' : 'Закрыто') + (m[0].cdate ? ' ' + m[0].cdate : '') : '-', r.p.rfi ? [r.p.rfi[0] || r.p.rfi[3], r.p.rfi[1] || r.p.rfi[4], r.p.rfi[2] || r.p.rfi[5]].filter(Boolean).join(' · ') : '-']); };
  const colL = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; };
  function sheet(name, R, lk) { const ex = lk !== 'q'; const H = MH.concat(ex ? XH : []), n = H.length;
    return {name, mpl: true, left: [29], freeze: 2, filter: `A2:${colL(n - 1)}2`, widths: MW.concat(ex ? XW : []), rows: [H, MN.concat(ex ? ['', '', '', ''] : [])].concat(R.map(r => xrow(r, lk)))}; }
  const fd = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
  QC.xls = function (what) { if (!window.XL) return toast(L('Excel module not loaded', 'Модуль Excel не загружен'));
    let sheets, name;
    if (what === 'open') { sheets = [sheet('Log of Mechanical Progress', QC.Q.filter(p => p.open).map(p => ({p, m: []})), 'q')]; name = `QC_open_punch_${fd()}.xlsx`; }
    else if (what === 'can') { sheets = ['close', 'rep', 'rfi', 'ask', 'chk'].filter(k => (QC.X[k] || []).length).map(k => sheet(({close: 'RHI punch to close', rep: 'Old client punch to report', rfi: 'QC punch – RFI accepted', ask: 'Client open – RHI closed', chk: 'QC punch to check'})[k], QC.X[k], k)); name = `QC_can_be_closed_${fd()}.xlsx`; }
    else { const F = rowsOf(QC._a); sheets = [sheet('Log of Mechanical Progress', F.R, F.lk)]; name = `QC_${F.lk === 'q' ? 'punch' : F.lk}_${[F.si, F.ki, F.sb].filter(Boolean).join('_').replace(/[^\w\-]+/g, '_')}${F.si || F.ki || F.sb ? '_' : ''}${fd()}.xlsx`; }
    if (!sheets.length || !sheets.some(s => s.rows.length > 2)) return toast(L('Nothing to export', 'Нечего выгружать'));
    XL.save(name, sheets); };
  QC.share = function () { const F = rowsOf(QC._a); if (!F.R.length) return toast(L('Nothing to share', 'Нечего отправлять'));
    const t = `${title(F)} – ${fd()} – ${F.R.length}\n\n` + F.R.slice(0, 400).map(r => `${r.p.no}\t${r.p.tag}\t${desc(r.p).slice(0, 80)}${r.m.length ? '\t→ № ' + r.m.map(x => x.no).join(', ') + (r.m[0].cdate ? ' ' + r.m[0].cdate : '') : ''}`).join('\n');
    if (navigator.share) navigator.share({text: t}).catch(() => {}); else copyText(t).then(ok => toast(ok ? L('Copied', 'Скопировано') : L('Copy failed', 'Не скопировано'))); };
  QC.load();
})();
