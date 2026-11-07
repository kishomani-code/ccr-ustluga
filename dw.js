// v4.19: "Open PDF" buttons for drawings – Google Drive "drawings" folder (CCR drawings / 1801 drawings / 4810 DRAWING).
// dw.json = {folder, files:{"G0-D1810BX0|IN-SPAP-LR-001": [[rev, driveId, fileName], ...newest first]}}
// Rebuild: refresh tools/drive_files.json, then python3 tools/build_dw.py
(function () {
  const DW = window.DW = {d: null};
  const DC = 'appdata-v1';
  const RU = (function () { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } })();
  const L = (en, ru) => RU ? ru : en;
  function net(f) { return fetch(f + '?t=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw 'HTTP ' + r.status; const c2 = r.clone(); if ('caches' in window) caches.open(DC).then(c => c.put(f, c2)).catch(() => {}); return r.json(); }); }
  function cget(f) { if (!('caches' in window)) return Promise.resolve(null); return caches.open(DC).then(c => c.match(f)).then(r => r ? r.json() : null).catch(() => null); }
  function set(d) { if (!d || !d.files) return; const first = !DW.d; DW.d = d; if (first && /^#\/(dg|c|p|i|s|q)(\/|$)/.test(location.hash)) { try { route(); } catch (e) {} } }
  // v4.32: latest revision per client MDR (mdr.json) – red alert when Drive / register rev is older
  DW.load = function () { cget('mdr.json').then(d => { if (d) DW.m = d; return net('mdr.json'); }).then(d => { if (d) { const first = !DW.m; DW.m = d; if (first && /^#\/(dg|c|p|i|s|q)(\/|$)/.test(location.hash)) { try { route(); } catch (e) {} } } }).catch(() => {});
    cget('dw.json').then(d => { if (d) set(d); return net('dw.json'); }).then(d => set(d)).catch(() => {}); };
  const TIT = {'8810': ['G0-D8810BX0', 'G0-D8801FX0'], '1801': ['G0-D1801FX0'], CCR: ['G0-D1810BX0', 'G0-D1801FX0'], D48: ['G0-D4810BX0', 'G0-D4801FX0'], COLD: ['G0-A10200X0', 'G0-D10250X0', 'G1-A30210X0']};
  const CODE = '([A-Z]{2}-[A-Z0-9]{2,5}(?:-[A-Z]{2,5})?-\\d{3}(?:\\.\\d+)?)';
  DW.FOLDER = () => 'https://drive.google.com/drive/folders/' + ((DW.d && DW.d.folder) || '1GfmOmZEEHLM53FKvYrbQehp0-NIm5pj8');
  // all document keys found in a text (full number, "title code", or short code like "IN-SPAP-LR p.119")
  DW.keys = function (txt) {
    const out = []; if (!DW.d || !txt) return out; const F = DW.d.files; const s = String(txt).toUpperCase().replace(/[АВЕКМНОРСТХ]/g, ch => 'ABEKMHOPCTX'['АВЕКМНОРСТХ'.indexOf(ch)]);
    const add = k => { if (F[k] && !out.includes(k)) out.push(k); };
    let m, any = false;
    const ra = new RegExp('GLE-?\\(?(G\\d-[A-Z0-9]+)\\)?-' + CODE, 'g'); while ((m = ra.exec(s))) { any = true; add(m[1] + '|' + m[2]); }
    const rb = new RegExp('(G\\d-[A-Z0-9]{6,}X\\d)\\s+' + CODE, 'g'); while ((m = rb.exec(s))) { any = true; add(m[1] + '|' + m[2]); }
    if (!any) { const rc = /\b((?:EL|IN|FA|TE|HV|EH)-[A-Z0-9]{2,5}(?:-[A-Z]{2})?)(?:-(\d{3}))?\b/g;
      while ((m = rc.exec(s))) { const code = m[1] + '-' + (m[2] || '001'); (TIT[PRJ] || []).forEach(t => add(t + '|' + code)); } }
    return out;
  };
  const url = id => String(id).startsWith('local:') ? encodeURI(String(id).slice(6)) : 'https://drive.google.com/file/d/' + id + '/view';   // v4.23: local = PDF stored in the app (dwg/)

  const rn = r => parseInt(String(r || '').replace(/\D/g, '').slice(0, 2) || '0', 10);
  DW.mdr = function (k) { return DW.m && DW.m.m ? DW.m.m[k] || null : null; };
  DW.keyOf = function (no) { const m = String(no || '').toUpperCase().match(/\((G\d-[A-Z0-9]+)\)-(.+)$/); return m ? m[1] + '|' + m[2] : ''; };
  // Drive latest file older than MDR → need new rev
  DW.need = function (k) { const M = DW.mdr(k); if (!M) return null; const L2 = DW.d && DW.d.files[k]; const have = L2 ? L2[0][0] : ''; return L2 && rn(have) < rn(M[0]) ? {have, M} : null; };
  DW.alertHtml = function (k) { const n = DW.need(k); if (!n) return ''; const M = n.M;
    return `<div style="background:#fde2e1;border:1px solid #d92d20;color:#b42318;border-radius:8px;padding:6px 8px;margin-top:5px;font-size:13px;font-weight:700" data-nt>🔴 ${L('NEED NEW REV', 'НУЖНА НОВАЯ РЕВИЗИЯ')}: ${L('Drive has rev', 'в Drive рев.')} ${esc(n.have)} – ${L('latest per MDR is rev', 'по MDR последняя рев.')} ${esc(M[0])} (${esc(M[1])} ${esc(M[2])}${M[3] ? ' · ' + esc(M[3]) : ''}${M[4] ? ' · code ' + esc(M[4]) : ''})</div>`; };
  DW.mdrInfo = function (k) { const M = DW.mdr(k); if (!M) return ''; return `<div class="s" style="font-size:12px;color:var(--mut)" data-nt>MDR: rev <b>${esc(M[0])}</b> ${esc(M[1])} ${esc(M[2])}${M[5] ? ' · ' + esc(M[5].slice(0, 90)) : ''}${M[6] ? ' · ' + L('next rev', 'след. рев.') + ' ' + esc(M[6]) + (M[7] ? ' (' + esc(M[7]) + ')' : '') : ''}</div>`; };
  // register badge: app register rev or Drive rev older than MDR
  DW.revBadge = function (no, appRev) { const k = DW.keyOf(no); const M = DW.mdr(k); if (!M) return ''; const F = DW.d && DW.d.files[k]; const pdfOk = F && rn(F[0][0]) >= rn(M[0]); const old = !!DW.need(k) || (!pdfOk && rn(appRev) < rn(M[0]));
    if (!old && rn(appRev) < rn(M[0])) return `<span class="badge b-part" style="display:inline-block;margin-top:3px" data-nt>${L('PDF is latest rev', 'PDF – последняя рев.')} ${esc(M[0])} ✓</span>`;
    return old ? `<span class="badge" style="background:#d92d20;color:#fff;display:inline-block;margin-top:3px" data-nt>🔴 ${L('MDR rev', 'MDR рев.')} ${esc(M[0])} – ${L('need new rev', 'нужна новая рев.')}</span>` : `<span class="badge b-ok" style="display:inline-block;margin-top:3px" data-nt>✓ ${L('latest', 'актуальна')} (MDR ${esc(M[0])})</span>`; };
  DW.needList = function (regs) { if (!DW.m) return []; const out = []; (regs || []).forEach(r => { const k = DW.keyOf(r.no); const M = DW.mdr(k); if (!M) return; const n = DW.need(k); const F = DW.d && DW.d.files[k]; if (n || (rn(r.rev) < rn(M[0]) && !(F && rn(F[0][0]) >= rn(M[0])))) out.push({r, k, M, have: n ? n.have : (DW.d && DW.d.files[k] ? DW.d.files[k][0][0] : '–')}); }); return out; };
  DW.needTile = function (regs) { const Lx = DW.needList(regs); if (!Lx.length) return DW.m ? `<div class="note" style="background:#e8f6ee" data-nt>✓ ${L('All drawings in the register match the latest MDR revision', 'Все чертежи соответствуют последней ревизии MDR')} (MDR ${esc(DW.m.date)})</div>` : '';
    window.__DWN = Lx; return `<button class="tile" style="width:100%;min-height:auto;margin-bottom:8px;background:#d92d20;color:#fff;border-color:#d92d20" onclick="DW.needShow()"><b>🔴 ${Lx.length} ${L('drawings need new rev', 'чертежей – нужна новая ревизия')}</b><span class="n" style="color:#ffe2e0;display:block">${L('register / Drive older than client MDR', 'реестр / Drive старее MDR заказчика')} ${esc(DW.m.date)} – ${L('tap to see', 'нажмите')}</span></button>`; };
  DW.needShow = function () { const Lx = window.__DWN || []; if (typeof modalP !== 'function') return;
    modalP(`<div class="h3" style="color:#b42318">🔴 ${L('Need new revision', 'Нужна новая ревизия')} (${Lx.length})</div><div class="list" style="max-height:60vh;overflow:auto">${Lx.map(x => `<div class="li" style="display:block"><div class="t">${esc(x.r.no)}</div><div class="s">${L('register', 'реестр')} rev ${esc(x.r.rev)} · Drive rev ${esc(x.have)} → <b style="color:#b42318">MDR rev ${esc(x.M[0])}</b> ${esc(x.M[1])} ${esc(x.M[2])}${x.M[3] ? ' · ' + esc(x.M[3]) : ''}</div></div>`).join('')}</div><div class="s" style="margin-top:6px">${L('Ask DCC / Paul for the new revision PDF and put it in the Drive drawings folder.', 'Запросить у DCC / Пауля PDF новой ревизии и положить в папку чертежей Drive.')}</div>`); };
  DW.btn = function (k, small) { const L2 = DW.d && DW.d.files[k]; if (!L2) return ''; const f = L2[0]; const code = k.split('|')[1];
    return `<a class="chip on" data-nt style="text-decoration:none;${small ? 'font-size:12px;padding:3px 9px;' : ''}" href="${url(f[1])}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📄 ${esc(small ? 'PDF rev ' + f[0] : code + ' rev ' + f[0])}</a>${DW.need(k) ? ` <span class="badge" style="background:#d92d20;color:#fff" data-nt>🔴 ${L('need rev', 'нужна рев.')} ${esc(DW.need(k).M[0])}</span>` : ''}`; };
  DW.row = function (k) { const L2 = DW.d.files[k]; if (!L2) return '';
    return `<div class="li" style="display:block;cursor:default"><div class="t" data-nt>${esc('GLE-(' + k.split('|')[0] + ')-' + k.split('|')[1])}</div>
      <div class="chips" style="margin:4px 0 0">${DW.btn(k)}</div>
      ${DW.alertHtml(k)}${DW.mdrInfo(k)}</div>`; };
  DW.id = function (no) { if (!DW.d) return ''; const k = DW.keys(no)[0]; return k ? DW.d.files[k][0][1] : ''; };
  DW.open = function (no) { const id = DW.id(no); if (id) window.open(url(id), '_blank', 'noopener'); };
  // whole register row opens the PDF from Drive
  DW.rowAttr = function (no) { const id = DW.id(no); return id ? `style="cursor:pointer" onclick="if(!event.target.closest('a'))window.open('${url(id)}','_blank','noopener')"` : ''; };
  DW.title = function (no) { const id = DW.id(no); return id ? `<a data-nt href="${url(id)}" target="_blank" rel="noopener" style="color:#1a73e8;text-decoration:underline">📄 ${esc(no)}</a>` : `${esc(no)} <span style="font-size:11px;color:var(--mut)" data-nt>(${L('no PDF in Drive yet', 'PDF нет в Drive')})</span>`; };
  // small button for one document number (register lists)
  DW.small = function (no) { if (!DW.d) return ''; const k = DW.keys(no)[0]; const f = k && DW.d.files[k][0]; return f ? `<div class="s" data-nt style="color:#1a73e8">${L('Tap to open PDF', 'Нажмите – откроется PDF')} · rev ${esc(f[0])}</div>${DW.alertHtml(k)}` : ''; };
  // card with all PDFs found in the given texts
  DW.card = function (texts, title) { if (!DW.d) return ''; const K = []; (texts || []).forEach(t => DW.keys(t).forEach(k => { if (!K.includes(k)) K.push(k); }));
    if (!K.length) return '';
    return `<div class="card" style="border-left:5px solid #1a73e8"><div class="h3">📄 ${title || L('Drawings – open PDF', 'Чертежи – открыть PDF')}</div><div class="list">${K.slice(0, 8).map(DW.row).join('')}</div>
      <div style="margin-top:6px"><a class="link" href="${DW.FOLDER()}" target="_blank" rel="noopener">${L('All drawings folder in Google Drive ›', 'Вся папка чертежей в Google Drive ›')}</a></div></div>`; };
  DW.tile = function () { return `<a class="tile" style="text-decoration:none;background:#1a73e8;color:#fff;border-color:#1a73e8" href="${DW.FOLDER()}" target="_blank" rel="noopener"><b>📂 ${L('Drawings folder (Google Drive)', 'Папка чертежей (Google Drive)')}</b><div><span class="n" style="color:#e3edfd">${DW.d ? Object.keys(DW.d.files).length + ' ' + L('documents with PDF', 'документов с PDF') : L('open PDFs', 'открыть PDF')}</span></div></a>`; };
  DW.load();
})();
