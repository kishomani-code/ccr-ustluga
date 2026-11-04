// v4.17: commissioning contacts (Gazprom Automation, РП ГА) – area wise and per subsystem.
// ga.json = {ver, date, people:[[name,[mails],[phones]]], sub:{subsystem:[personIdx, name]}, sys:{system:[personIdx,name]}, pos:{G0-80:personIdx}, pts:[[report point, personIdx, status]], area:{CCR:idx, D48:idx}}
// Rebuild: python3 tools/build_ga.py <client contacts Excel> <date>
// Every tag / cable / panel / IWP / punch page shows the responsible commissioning person with call / e-mail buttons.
(function () {
  const GA = window.GA = {d: null, rfc: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const TL = {А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'E',Ж:'Zh',З:'Z',И:'I',Й:'Y',К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'Kh',Ц:'Ts',Ч:'Ch',Ш:'Sh',Щ:'Shch',Ы:'Y',Э:'E',Ю:'Yu',Я:'Ya',Ь:'',Ъ:''};
  const tl = s => String(s).replace(/[А-яЁё]/g, ch => { const u = ch.toUpperCase(), r = TL[u]; if (r == null) return ch; return ch === u ? r : r.toLowerCase(); }).replace(/ий\b/g, 'iy');
  const NM = s => `<span data-nt>${esc(RU ? s : tl(s).replace(/iy(?=\b)/g, 'iy'))}</span>`;
  const PTE = {'1.1': 'Metering units', '1.2': 'Building G0-4810 (utilities substation)', '1.4': 'Building G2-1810 (OTP-2)', '1.5': 'Building G0-2310 (GPP-2 substation)', '1.6': 'Building G1-1810 (OTP-1)', '1.7': 'Cathodic protection', '1.8': 'Fire water supply systems', '1.9': 'Water and waste water',
    '2.1': 'Inlet facilities', '2.2': 'Regeneration gas compressor', '2.3': 'Electrical equipment – C2+ recovery unit area', '2.4': 'Nitrogen system', '2.5': 'Instrument air', '3.1': 'Mercury adsorber', '3.2': 'Hot oil system', '4.1': 'Deep dehydration unit', '4.2': 'Low-temperature condensation & rectification (NTKR)',
    '5': 'Turboexpander unit', '5.1': 'NGL compressor unit', '5.2': 'Sulphur removal system', '6': 'Booster compressor station G1+G2 (common lines)', '7': 'Flare system', '7.1': 'Fuel gas system', '8': 'Central control room (CCR)', '9': 'Fractionation'};
  const PTN = p => { const m = String(p).match(/^([\d.]+)\s*-\s*(.*)$/); if (!m) return `<span data-nt>${esc(p)}</span>`; return `<span data-nt>${esc(m[1])} – ${esc(RU ? m[2] : (PTE[m[1]] || tl(m[2])))}</span>`; };
  const STN = s => `<span data-nt>${esc(RU ? s : /основ/i.test(s) ? 'Main' : /запас/i.test(s) ? 'Backup' : s)}</span>`;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function rerender() { if (/^#\/(ga|c|p|i|s|pi)(\/|$)/.test(location.hash)) { try { route(); } catch (e) {} } }
  function set(d) { if (!d || !d.people) return; GA.d = d; rerender(); }
  GA.load = function () {
    cget('ga.json').then(d => { if (d) set(d); return net('ga.json'); }).then(d => { if (d && (!GA.d || d.ver !== GA.d.ver)) set(d); }).catch(() => {});
    // cable -> subsystem from the RAWP / RFI file of this project (already built by the data update)
    const f = 'rfi_' + String(PRJ).toLowerCase() + '.json';
    cget(f).then(d => d || net(f)).then(d => { if (!d || !d.cab) return; const m = {}; Object.entries(d.cab).forEach(([t, r]) => { if (r && r[0] >= 0 && d.ss[r[0]]) m[t] = d.ss[r[0]][0]; }); GA.rfc = m; rerender(); }).catch(() => {});
  };
  const sys3 = s => String(s).split('-').slice(0, 3).join('-'), pos2 = s => String(s).split('-').slice(0, 2).join('-');
  GA.who = function (s) { const d = GA.d; if (!d || !s) return -1; const a = d.sub[s]; if (a) return a[0]; const b = d.sys[sys3(s)]; if (b) return b[0]; const c = d.pos[pos2(s)]; return c == null ? -1 : c; };
  GA.subsOf = function (tag) {
    const S = new Set(); if (!tag) return [];
    (typeof PUBY !== 'undefined' && PUBY[tag] || []).forEach(p => { const s = PT.sub[p.sub]; if (s) S.add(s); });
    if (GA.rfc && GA.rfc[tag]) S.add(GA.rfc[tag]);
    const pn = typeof PBY !== 'undefined' && PBY[tag]; if (pn && GA.rfc) { const c = {}; pn.cs.forEach(([dd, t]) => { const s = GA.rfc[t]; if (s) c[s] = (c[s] || 0) + 1; }); Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([s]) => S.add(s)); }
    return [...S].filter(s => /^G\d-\d/.test(s));
  };
  const telH = p => 'tel:' + String(p).replace(/доб\.?/i, ',').replace(/[^\d+,]/g, '').replace(/^8(?=\d{10}(,|$))/, '+7');
  function person(i, subs, note) {
    const p = GA.d.people[i]; if (!p) return '';
    return `<div class="li" style="display:block;cursor:default"><div class="t" style="font-size:15px">👤 ${NM(p[0])}</div>
      <div class="s"><span data-nt>${L('Gazprom Automation – commissioning manager (RP GA)', 'Газпром автоматизация – руководитель ПНР (РП ГА)')}</span>${note ? ' · ' + esc(note) : ''}</div>
      ${subs && subs.length ? `<div class="s" style="white-space:normal">${subs.slice(0, 5).map(esc).join(' · ')}${subs.length > 5 ? ' …' : ''}</div>` : ''}
      <div class="chips" style="margin:6px 0 0">${p[2].map(ph => `<a class="chip on" style="text-decoration:none" href="${telH(ph)}">📞 ${esc(ph)}</a>`).join('')}${p[1].map(m => `<a class="chip" data-nt style="text-decoration:none;max-width:100%;overflow:hidden;text-overflow:ellipsis" href="mailto:${esc(m)}">✉ ${esc(m)}</a>`).join('')}</div></div>`;
  }
  // card for any tag (cable, panel, device, IWP line); subs = extra subsystems (e.g. of a punch)
  GA.card = function (tag, subs) {
    if (!GA.d) return '';
    const S = [...new Set([...(subs || []), ...GA.subsOf(tag)])]; const by = {};
    S.forEach(s => { const w = GA.who(s); if (w >= 0) (by[w] = by[w] || []).push(s); });
    let body = Object.entries(by).map(([w, ss]) => person(+w, ss)).join('');
    if (!body) { const a = GA.d.area[PRJ]; if (a != null && a >= 0) body = person(a, [], L('area contact', 'контакт по зоне')); }
    if (!body) body = `<div class="s">${L('No subsystem found for this tag – see the contact list.', 'Подсистема не найдена – см. список контактов.')}</div>`;
    return `<div class="card" style="border-left:5px solid #0b6e6e"><div class="h3">📞 ${L('Commissioning contact (client)', 'Контакт ПНР (заказчик)')}</div><div class="list">${body}</div>
      <div style="margin-top:6px"><span class="link" onclick="go('#/ga')">${L('Commissioning responsibilities from Gazprom ›', 'Ответственные за ПНР (Газпром) ›')}</span></div></div>`;
  };
  const TITLE = L('Commissioning responsibilities from Gazprom', 'Ответственные за ПНР (Газпром автоматизация)');
  GA.tile = function () { return `<button class="tile" style="width:100%;min-height:auto;margin-top:6px;background:#0b6e6e;color:#fff;border-color:#0b6e6e" onclick="go('#/ga')"><b>📞 ${TITLE}</b><span class="n" style="color:#d7f0ee">${GA.d ? L('system-wise · area-wise · ', 'по системам · по зонам · ') + GA.d.people.length + ' ' + L('people', 'чел.') + ' · ' + GA.d.date : L('loading…', 'загрузка…')}</span></button>`; };
  const phs = x => x[2].map(ph => `<a href="${telH(ph)}">📞 ${esc(ph)}</a>`).join(' · ');
  function mySystems() { const S = new Set();
    try { PU.forEach(p => { if (PRJN && PRJN.rx && !PRJN.rx.test(String(PT.tit[p.tit] || ''))) return; const s = PT.sub[p.sub]; if (s && /^G\d-\d/.test(s)) S.add(sys3(s)); }); } catch (e) {}
    if (GA.rfc) Object.values(GA.rfc).forEach(s => /^G\d-\d/.test(s) && S.add(sys3(s)));
    return [...S].filter(s => GA.d.sysa[s]).sort(); }
  function sysRow(k) { const d = GA.d, v = d.sysa[k]; const subs = Object.entries(d.sub).filter(([s]) => sys3(s) === k);
    return `<details class="li" style="display:block"><summary style="cursor:pointer;list-style:none"><div class="t">${esc(k)} <span style="font-weight:400">· ${esc(v[0])}</span></div>
      ${v[1].map(([i, n]) => { const x = d.people[i]; return `<div class="s">👤 <b>${NM(x[0])}</b>${v[1].length > 1 ? ` <span style="color:var(--mut)">(${n} ${L('subsystems', 'подсист.')})</span>` : ''} · ${phs(x)}</div>`; }).join('')}
      <div class="s" style="color:var(--pri)">${subs.length} ${L('subsystems – tap to show', 'подсистем – нажмите, чтобы показать')} ›</div></summary>
      <div style="margin-top:6px;border-top:1px solid #e5e8ec;padding-top:4px">${subs.map(([s, w]) => `<div class="s" style="white-space:normal;padding:3px 0"><b>${esc(s)}</b> ${esc(w[1])}<br>👤 <span data-nt>${NM(d.people[w[0]][0])}</span> · ${phs(d.people[w[0]])}</div>`).join('')}</div></details>`; }
  GA.home = function () {
    setHead(TITLE, GA.d ? 'Gazprom Automation · ' + GA.d.date : '');
    if (!GA.d) { main.innerHTML = '<div class="empty">Loading…</div>'; return; }
    const d = GA.d; const q = (GA.q || '').trim().toUpperCase(); const tab = GA.tab || 'sys';
    const my = d.area[PRJ];
    let hit = '';
    if (q.length >= 4) { const L2 = Object.entries(d.sub).filter(([s, v]) => s.toUpperCase().includes(q) || String(v[1]).toUpperCase().includes(q)).slice(0, 40);
      hit = `<div class="sect">${L('Subsystems found', 'Найдено подсистем')} (${L2.length})</div><div class="list">${L2.map(([s, v]) => `<div class="li" style="display:block;cursor:default"><div class="t">${esc(s)}</div><div class="s" style="white-space:normal">${esc(v[1])}</div><div class="s">👤 <b>${NM(d.people[v[0]][0])}</b> · ${phs(d.people[v[0]])}</div></div>`).join('') || '<div class="empty">-</div>'}</div>`; }
    let body = '';
    if (tab === 'sys') { const mine = mySystems(); const grp = {}; Object.keys(d.sysa).forEach(k => { const g = k.slice(0, 2); (grp[g] = grp[g] || []).push(k); });
      body = (mine.length ? `<div class="sect">${L('Systems in this area', 'Системы этой зоны')} – ${esc(PRJ)} (${mine.length})</div><div class="list">${mine.map(sysRow).join('')}</div>` : '') +
        Object.entries(grp).map(([g, ks]) => `<div class="sect">${L('All systems', 'Все системы')} ${esc(g)} (${ks.length})</div><div class="list">${ks.map(sysRow).join('')}</div>`).join(''); }
    else if (tab === 'area') body = `<div class="list">${d.pts.map(([p, i, st]) => { const x = d.people[i] || ['-', [], []];
        return `<div class="li" style="display:block;cursor:default"><div class="t">${PTN(p)} ${st ? `<span class="badge ${/основ/i.test(st) ? 'b-ok' : 'b-na'}">${STN(st)}</span>` : ''}</div><div class="s">👤 <b>${NM(x[0])}</b> · ${phs(x)}</div></div>`; }).join('')}</div>`;
    else body = `<div class="list">${d.people.map((p, i) => person(i, [], Object.values(d.sub).filter(v => v[0] === i).length + ' ' + L('subsystems', 'подсистем'))).join('')}</div>`;
    main.innerHTML = `<div class="card" style="font-size:13px;border-left:5px solid #0b6e6e">${L('Client commissioning managers (Gazprom Automation, RP GA) responsible for each system. Every cable, panel, IWP line and punch page also shows the person for its subsystem – tap the number to call.', 'Руководители ПНР заказчика (Газпром автоматизация, РП ГА) по каждой системе. На странице каждого кабеля, щита, строки IWP и замечания также показан ответственный по подсистеме – нажмите номер, чтобы позвонить.')}</div>
      ${my != null && my >= 0 ? `<div class="sect">${L('This area', 'Эта зона')} – ${esc(PRJ)}</div><div class="list">${person(my, [], '')}</div>` : ''}
      <input class="fin" placeholder="${L('Find by subsystem or name, e.g. G0-85-200 or освещение', 'Поиск по подсистеме, напр. G0-85-200 или освещение')}" value="${esc(GA.q || '')}" oninput="GA.q=this.value;clearTimeout(GA.tm);GA.tm=setTimeout(()=>{GA.home();const i=document.querySelector('.fin');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},400)">${hit}
      <div class="chips">${[['sys', L('System-wise', 'По системам')], ['area', L('Area-wise', 'По зонам')], ['all', L('All contacts', 'Все контакты')]].map(([k, l]) => `<button class="chip ${tab === k ? 'on' : ''}" onclick="GA.tab='${k}';GA.home()">${l}</button>`).join('')}</div>${body}`;
  };
  GA.load();
})();
