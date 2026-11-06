// v4.27: + client comments 06.11.2026 (2 replies). v4.25: client answers to our CTQs (ПОЖНЕФТЕГАЗ response 05.11.2026) + Rencons check vs rev 04 + next step.
// ctqa.json = {date, by, src, a:{"CTQ-01": {r, rr, cru, cen, ke, kr, ne, nr}}}
(function () {
  const CA = window.CA = {d: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  const COL = {'CLOSE': ['#e6f4ea', '#1e7b34'], 'RAISE TQS': ['#fde8e8', '#b42318'], 'NOT FIXED': ['#fde8e8', '#b42318'], 'SEND TO IN-SPAP': ['#fff4d6', '#8a5a00'], 'CLARIFY': ['#fff4d6', '#8a5a00'], 'CHECK EMSV': ['#fff4d6', '#8a5a00'], 'NO ANSWER': ['#eceff3', '#555'], 'REQUEST AGAIN': ['#fde8e8', '#b42318'], 'PARTLY': ['#fff4d6', '#8a5a00'], 'CHECK REV': ['#fff4d6', '#8a5a00'], 'TQS IN WORK': ['#fff4d6', '#8a5a00'], 'CORRECTION AGREED': ['#e6f4ea', '#1e7b34']};
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || !d.a) return; const first = !CA.d; CA.d = d; if (first && /^#\/(ctq|c|p|i|s|tq)(\/|\?|$)/.test(location.hash)) { try { route(); } catch (e) {} } }
  cget('ctqa.json').then(d => { if (d) set(d); return net('ctqa.json'); }).then(d => set(d)).catch(() => {});
  CA.get = no => CA.d && CA.d.a[no];
  CA.badge = function (no) { const a = CA.get(no); if (!a) return ''; const c = COL[a.r] || COL['NO ANSWER'];
    return ` <span class="badge" style="background:${c[0]};color:${c[1]}">${a.r === 'NO ANSWER' ? '⏳' : '💬'} ${L(a.r, a.rr)}</span>`; };
  const br = s => esc(s || '').replace(/\n/g, '<br>');
  CA.card = function (no, short) { const a = CA.get(no); if (!a) return ''; const c = COL[a.r] || COL['NO ANSWER'];
    const cm = a.cru ? `<div style="font-size:14px;margin-top:6px"><b>${L('Client comment', 'Комментарий заказчика')}:</b> ${br(a.cru)}</div>${!RU && a.cen ? `<div class="s2" style="margin-top:3px;color:var(--mut)">EN: ${br(a.cen)}</div>` : ''}`
      : `<div style="font-size:14px;margin-top:6px"><b>${L('Client comment', 'Комментарий заказчика')}:</b> ${L('no answer yet', 'ответа нет')}</div>`;
    if (short) return `<div style="margin-top:6px;padding:6px 8px;border-radius:8px;background:${c[0]}"><span class="badge" style="background:#fff;color:${c[1]}">${L(a.r, a.rr)}</span> <span class="s2">${esc(L(a.ne, a.nr))}</span></div>`;
    return `<div class="card" style="border-left:5px solid ${c[1]};background:${c[0]}"><div class="h3">💬 ${L('Client answer', 'Ответ заказчика')} · ${esc(CA.d.by)} · ${esc(CA.d.date)}</div>
      <div><span class="badge" style="background:#fff;color:${c[1]};font-size:13px">${L(a.r, a.rr)}</span></div>${cm}
      <div style="font-size:14px;margin-top:8px"><b>${L('Our check (rev 04)', 'Наша проверка (rev 04)')}:</b> ${br(L(a.ke, a.kr))}</div>
      <div style="font-size:14px;margin-top:8px"><b>${L('Next step', 'Следующий шаг')}:</b> ${br(L(a.ne, a.nr))}</div></div>`; };
  CA.count = function () { if (!CA.d) return null; const n = {}; Object.values(CA.d.a).forEach(a => n[a.r] = (n[a.r] || 0) + 1); return n; };
  CA.summary = function () { const n = CA.count(); if (!n) return '';
    return `<div class="note" style="background:#eef3f8">💬 ${L('Client answer', 'Ответ заказчика')} ${esc(CA.d.date)} (${esc(CA.d.by)}): ${Object.entries(n).map(([k, v]) => `<b>${v}</b> ${esc(L(k, (Object.values(CA.d.a).find(a => a.r === k) || {}).rr || k)).toLowerCase()}`).join(' · ')}</div>`; };
})();
