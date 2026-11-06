// v4.26: Aleksy punch follow-up – our punch reports vs Aleksy's closure-confirmation file vs client master punch list.
// ak.json = {date, src, a:{no:[status, date, title, subsystem, tag]}, rep:[{no, rep, fixed, by, src}]}
// Rebuild: python3 tools/build_ak.py --input input --out ak.json   (reported list: tools/punch_reported.json)
(function () {
  const AK = window.AK = {d: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || !d.a) return; const first = !AK.d; AK.d = d; const n = document.getElementById('akn'); if (n) n.innerHTML = AK.sum();
    if (first && /^#\/(ak|pk)?(\/|\?|$)/.test(location.hash || '#/')) { try { route(); } catch (e) {} } }
  cget('ak.json').then(d => { if (d) set(d); return net('ak.json'); }).then(d => set(d)).catch(() => {});
  const dt = s => { const m = String(s || '').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const days = s => { const d = dt(s); if (!d) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((t - d) / 864e5); };
  const BY = () => { const m = {}; (typeof PU !== 'undefined' ? PU : []).forEach(p => { if (!p.int) m[String(p.no)] = p; }); return m; };
  // lists for the current project
  AK.lists = function () {
    if (!AK.d) return null; const M = BY(), A = AK.d.a;
    const inform = [], wait = [], canrep = [], ok = [];
    (AK.d.rep || []).forEach(x => { const p = M[x.no]; if (!p) return; const a = A[x.no]; const dd = days(x.rep);
      if (a) { ok.push({p, x, a}); return; }
      if (p.st === 'Closed') return;
      (dd != null && dd >= 2 ? inform : wait).push({p, x, dd}); });
    Object.keys(A).forEach(no => { const a = A[no]; if (!/^Закрыт/i.test(a[0])) return; const p = M[no]; if (p && p.st !== 'Closed') canrep.push({p, a}); });
    canrep.sort((u, v) => (dt(v.a[1]) || 0) - (dt(u.a[1]) || 0));
    return {inform, wait, canrep, ok};
  };
  AK.sum = function () { const x = AK.lists(); if (!x) return L('loading…', 'загрузка…');
    return `⚠ ${x.inform.length} ${L('need inform Aleksy', 'сообщить Алексею')} · ✅ ${x.canrep.length} ${L('closed by Aleksy – report to master', 'закрыто у Алексея – в мастер-лист')}${x.wait.length ? ' · ⏳ ' + x.wait.length + ' ' + L('waiting', 'ожидание') : ''}`; };
  AK.tile = function () { const x = AK.lists(); const hot = x && (x.inform.length || x.canrep.length);
    return `<button class="tile" style="width:100%;min-height:auto;margin-bottom:6px;background:${hot ? '#c2410c' : '#475467'};color:#fff;border-color:${hot ? '#c2410c' : '#475467'}" onclick="go('#/ak')"><b>🔔 ${L('Aleksy punch follow-up', 'Контроль замечаний – Алексей')}</b><span class="n" id="akn" style="color:#ffe8d6;display:block">${AK.sum()}</span></button>`; };
  function txt(list, head) { return head + '\n' + list.map(o => `${o.p.no} · ${o.p.tag || '-'} · ${String(o.p.dru || '').slice(0, 60)}`).join('\n'); }
  AK.copy = function (k) { const x = AK.lists(); const L2 = x[k]; const t = k === 'inform' ? txt(L2, L('Aleksy – please request client inspection / closure for these punches (fixed on site, reported):', 'Алексей – прошу запросить у заказчика осмотр / закрытие замечаний (устранены на площадке):'))
      : txt(L2, L('Closed in Aleksy closure file but still OPEN in master punch list – report to master list:', 'Закрыты в файле Алексея, но ОТКРЫТЫ в мастер-листе – подать на закрытие:'));
    try { navigator.clipboard.writeText(t).then(() => toast(L('Copied', 'Скопировано'))); } catch (e) { prompt('Copy', t); } };
  function sec(title, color, list, k, note) {
    if (!list.length) return `<div class="sect">${title} (0)</div><div class="note">${L('Nothing here', 'Нет')}</div>`;
    return `<div class="sect" style="color:${color}">${title} (${list.length})</div>${note ? `<div class="note">${note}</div>` : ''}
      ${k ? `<button class="tile" style="width:100%;min-height:auto;margin:4px 0" onclick="AK.copy('${k}')"><b>📋 ${L('Copy list for message', 'Скопировать список для сообщения')}</b></button>` : ''}
      <div class="list">${list.map(o => pRow(o.p).replace('<div class="s">', `<div class="s" data-nt style="color:${color}">${o.x ? L('Reported ', 'Подано ') + esc(o.x.rep) + (o.dd != null ? ' · ' + o.dd + L(' days', ' дн.') : '') + (o.x.by ? ' · ' + esc(o.x.by) : '') : L('Aleksy: ', 'Алексей: ') + esc(o.a[0]) + ' ' + esc(o.a[1])}</div><div class="s">`)).join('')}</div>`; }
  AK.home = function () {
    setHead(L('Aleksy punch follow-up', 'Контроль замечаний – Алексей'), AK.d ? `${PRJ} · ${L('Aleksy file', 'файл Алексея')} ${AK.d.date} · ${L('master', 'мастер')} ${D.punch.date || ''}` : '');
    if (!AK.d) { main.innerHTML = '<div class="empty">Loading…</div>'; return; }
    const x = AK.lists();
    main.innerHTML = `<div class="kpi"><div><b style="color:var(--bad)">${x.inform.length}</b><span>${L('need inform Aleksy', 'сообщить Алексею')}</span></div><div><b style="color:var(--ok)">${x.canrep.length}</b><span>${L('report to master', 'в мастер-лист')}</span></div><div><b>${x.wait.length}</b><span>${L('waiting (< 2 days)', 'ожидание (< 2 дн.)')}</span></div><div><b>${x.ok.length}</b><span>${L('in Aleksy file', 'у Алексея')}</span></div></div>
      ${sec('⚠ ' + L('Reported by us – NOT in Aleksy file after 2 days → inform Aleksy', 'Подано нами – НЕТ в файле Алексея через 2 дня → сообщить Алексею'), 'var(--bad)', x.inform, 'inform')}
      ${sec('✅ ' + L('Closed in Aleksy file – still OPEN in master punch list → report to master', 'Закрыто у Алексея – ОТКРЫТО в мастер-листе → подать в мастер-лист'), 'var(--ok)', x.canrep, 'canrep')}
      ${sec('⏳ ' + L('Reported – waiting for Aleksy (less than 2 days)', 'Подано – ждём Алексея (менее 2 дней)'), 'var(--mut)', x.wait, '')}
      <div class="note">${L('Our reported punches come from the punch reports (tools/punch_reported.json); Aleksy file: ', 'Поданные замечания – из наших отчётов; файл Алексея: ')}${esc(AK.d.src || '')}</div>`;
  };
})();
