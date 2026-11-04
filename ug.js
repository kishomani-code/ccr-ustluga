// v4.14: "Comments for site team" (renamed v4.16) – engineering comments per cable (HOLD / route / TQ notes), shared through ug.json in the repo.
// ug.json = {ver, date, comments:[{id, date, from, project, unit, title, en, ru, status, cables:[{t,f,o,ty,ln,dwg}], imgs:[{src,cap}]}]}
// Append new comments to ug.json (new id, bump "ver"); every phone picks it up when online, then it works offline.
(function () {
  const UG = window.UG = {file: null, by: {}};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || typeof d !== 'object') return; UG.file = d; UG.file.comments = Array.isArray(d.comments) ? d.comments : []; UG.by = {};
    UG.file.comments.forEach(c => { c.cables = Array.isArray(c.cables) ? c.cables : []; c.imgs = Array.isArray(c.imgs) ? c.imgs : []; c.cables.forEach(x => { if (x && x.t) (UG.by[x.t] = UG.by[x.t] || []).push(c); }); });
    const n = document.getElementById('ugn'); if (n) n.textContent = UG.count();
    if (/^#\/ug(\/|\?|$)/.test(location.hash)) route(); }
  UG.load = function () { cget('ug.json').then(d => { if (d) set(d); return net('ug.json'); }).then(d => { if (d && (!UG.file || d.ver !== UG.file.ver)) set(d); }).catch(() => { if (!UG.file) set({ver: '', date: '', comments: []}); }); };
  const all = () => (UG.file && UG.file.comments) || [];
  const pj = c => String(c.project || '').toUpperCase();
  const pBadge = c => `<span class="badge ${pj(c) === PRJ ? 'b-ok' : 'b-na'}">${esc(pj(c) || '-')}${c.unit ? ' · ' + esc(c.unit) : ''}</span>`;
  const sBadge = c => c.status ? `<span class="badge ${/hold|stop|не|wait|delet|cancel/i.test(c.status) ? 'b-no' : 'b-part'}">${esc(c.status)}</span>` : '';
  UG.count = function () { const a = all(); if (!UG.file) return L('loading…', 'загрузка…'); const cb = new Set(); a.forEach(c => c.cables.forEach(x => cb.add(x.t)));
    const ps = [...new Set(a.map(pj))].filter(Boolean); return `${a.length} ${L('comments', 'замечаний')} · ${cb.size} ${L('cables', 'кабелей')}${ps.length ? ' · ' + ps.join(' / ') : ''}`; };
  UG.tile = function () { return `<div class="sect">💬 ${L('Engineering comments', 'Замечания инженера')}</div><div class="grid"><button class="tile main" style="background:#5b3a8a;border-color:#5b3a8a" onclick="go('#/ug')"><b>💬 ${L('Comments for site team', 'Комментарии для площадки')}<br><span style="font-weight:400;font-size:12px">${L('cable route · HOLD · deleted · TQ notes', 'трасса · HOLD · исключено · TQ')}</span></b><div><span class="n" id="ugn">${UG.count()}</span></div></button></div>`; };
  // small badge for cable cards / cable view
  UG.mini = function (tag) { const a = UG.by[tag] || []; return a.length ? ` <span class="badge b-no" title="${esc(a[0].title)}">💬 ${esc(a[0].status || 'note')}</span>` : ''; };
  // card for the cable detail view
  UG.card = function (tag) { const a = UG.by[tag] || []; if (!a.length) return '';
    return a.map(c => `<div class="card" data-nt style="border-left:5px solid #5b3a8a"><div class="h3">💬 ${esc(c.from)} · ${esc(c.date)} ${sBadge(c)}</div><div style="font-size:13px;margin:4px 0"><b>${esc(c.title)}</b></div><div style="font-size:12px;color:var(--mut)">${esc(L(c.en, c.ru) || c.en || c.ru).slice(0, 220)}${(L(c.en, c.ru) || '').length > 220 ? '…' : ''}</div><button class="more" onclick="go('#/ug/${enc(c.id)}')">${L('Open comment', 'Открыть замечание')} ›</button></div>`).join(''); };
  const row = c => `<button class="li" data-nt onclick="go('#/ug/${enc(c.id)}')"><div class="m"><div class="t">💬 ${esc(c.title)}</div><div class="s">${esc(c.from)} · ${esc(c.date)} · ${c.cables.length} ${L('cables', 'каб.')}${c.imgs.length ? ' · 🖼 ' + c.imgs.length : ''}</div><div style="margin-top:4px">${pBadge(c)} ${sBadge(c)}</div></div><span class="chev">›</span></button>`;
  UG.home = function () { setHead(L('Comments for site team', 'Комментарии для площадки'), UG.count()); const a = all();
    if (!UG.file) { main.innerHTML = '<div class="empty">' + L('Loading…', 'Загрузка…') + '</div>'; return; }
    const mine = a.filter(c => pj(c) === PRJ), oth = a.filter(c => pj(c) !== PRJ);
    const sec = (t, l) => l.length ? `<div class="sect">${t}</div><div class="list">${l.map(row).join('')}</div>` : '';
    main.innerHTML = `<div class="card" style="font-size:13px;border-left:5px solid #5b3a8a">${L('Engineering comments for the site team on specific cables: route, HOLD, which TQ is needed. Tap a comment to see the cables and the drawing snapshot. The same note is shown on each cable page.', 'Замечания инженера для площадки по конкретным кабелям: трасса, HOLD, какой TQ нужен. Нажмите на замечание, чтобы увидеть кабели и фрагмент чертежа. Та же заметка показана на странице каждого кабеля.')}<div style="color:var(--mut);font-size:12px;margin-top:4px">ug.json ${esc(UG.file.date || '')}</div></div>
     ${a.length ? sec(`${esc(PRJ)} · ${mine.length}`, mine) + sec(L('Other projects', 'Другие объекты') + ` · ${oth.length}`, oth) : '<div class="empty">' + L('No comments yet', 'Пока нет замечаний') + '</div>'}`; };
  const cabRow = (x, c) => { const here = typeof CBY !== 'undefined' && CBY[x.t]; const s = here ? cst(CBY[x.t]) : null;
    const open = here ? `go('#/c/${enc(x.t)}')` : (pj(c) && pj(c) !== PRJ ? `location.hash='#/c/${enc(x.t)}?p=${pj(c).toLowerCase()}';location.reload()` : '');
    return `<${open ? 'button' : 'div'} class="li" ${open ? `onclick="${open}"` : ''}><div class="m"><div class="t" style="word-break:break-all">${esc(x.t)} ${s ? `<span class="badge ${s.c}">${s.l}</span>` : ''}</div><div class="s">${esc(x.f || '')} → ${esc(x.o || '')}</div><div class="s">${esc(x.ty || '')}${x.ln ? ' · ' + esc(x.ln) + ' m' : ''}${x.dwg ? ' · ' + esc(x.dwg) : ''}</div>${!here && pj(c) !== PRJ ? `<div class="s" style="color:var(--mut)">${L('open in', 'открыть в')} ${esc(pj(c))} ›</div>` : ''}</div>${open ? '<span class="chev">›</span>' : ''}</${open ? 'button' : 'div'}>`; };
  UG.view = function (id) { const c = all().find(x => x.id === id); if (!c) { main.innerHTML = '<div class="empty">' + (UG.file ? L('Comment not found', 'Замечание не найдено') : L('Loading…', 'Загрузка…')) + '</div>'; return; }
    setHead('💬 ' + c.from, `${c.id} · ${c.date} · ${pj(c)}`);
    const txt = (lab, v) => v ? `<div style="font-size:12px;color:var(--mut);margin-top:8px">${lab}</div><div style="font-size:13px;white-space:pre-wrap">${esc(v)}</div>` : '';
    main.innerHTML = `<div data-nt><div class="card" style="border-left:5px solid #5b3a8a"><div class="big" style="font-size:16px">${esc(c.title)}</div><div style="margin:6px 0">${pBadge(c)} ${sBadge(c)}</div><div style="font-size:12px;color:var(--mut)">${esc(c.from)} · ${esc(c.date)}</div>
      ${RU ? txt('RU', c.ru) + txt('EN', c.en) : txt('EN', c.en) + txt('RU', c.ru)}</div>
     ${c.imgs.length ? `<div class="card"><div class="h3">🖼 ${L('Drawing snapshot', 'Фрагмент чертежа')} <span style="font-weight:400;font-size:12px;color:var(--mut)">· ${L('tap to open full size', 'нажмите для полного размера')}</span></div>${c.imgs.map(im => `<a href="${esc(im.src)}" target="_blank" rel="noopener" style="display:block;margin-top:6px"><img src="${esc(im.src)}" alt="${esc(im.cap || '')}" loading="lazy" style="width:100%;border-radius:9px;border:1px solid var(--line)"></a>${im.cap ? `<div style="font-size:12px;color:var(--mut);margin-top:4px">${esc(im.cap)}</div>` : ''}`).join('')}</div>` : ''}
     <div class="card"><div class="h3">${L('Cables', 'Кабели')} (${c.cables.length})</div><div class="list">${c.cables.map(x => cabRow(x, c)).join('')}</div></div></div>`; };
  UG.load();
})();
