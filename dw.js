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
  DW.load = function () { cget('dw.json').then(d => { if (d) set(d); return net('dw.json'); }).then(d => set(d)).catch(() => {}); };
  const TIT = {CCR: ['G0-D1810BX0', 'G0-D1801FX0'], D48: ['G0-D4810BX0', 'G0-D4801FX0'], COLD: ['G0-A10200X0', 'G0-D10250X0', 'G1-A30210X0']};
  const CODE = '([A-Z]{2}-[A-Z0-9]{2,5}(?:-[A-Z]{2})?-\\d{3}(?:\\.\\d+)?)';
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
  const url = id => 'https://drive.google.com/file/d/' + id + '/view';
  DW.btn = function (k, small) { const L2 = DW.d && DW.d.files[k]; if (!L2) return ''; const f = L2[0]; const code = k.split('|')[1];
    return `<a class="chip on" data-nt style="text-decoration:none;${small ? 'font-size:12px;padding:3px 9px;' : ''}" href="${url(f[1])}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📄 ${esc(small ? 'PDF rev ' + f[0] : code + ' rev ' + f[0])}</a>`; };
  DW.row = function (k) { const L2 = DW.d.files[k]; if (!L2) return '';
    return `<div class="li" style="display:block;cursor:default"><div class="t" data-nt>${esc('GLE-(' + k.split('|')[0] + ')-' + k.split('|')[1])}</div>
      <div class="chips" style="margin:4px 0 0">${DW.btn(k)}</div>
      ${L2.length > 1 ? `<details><summary class="s" style="cursor:pointer;color:var(--pri)">${L('Other versions in Drive', 'Другие версии в Drive')} (${L2.length - 1}) ›</summary>${L2.slice(1).map(f => `<div class="s"><a data-nt href="${url(f[1])}" target="_blank" rel="noopener">📄 ${esc(f[2])}</a></div>`).join('')}</details>` : ''}</div>`; };
  DW.id = function (no) { if (!DW.d) return ''; const k = DW.keys(no)[0]; return k ? DW.d.files[k][0][1] : ''; };
  DW.open = function (no) { const id = DW.id(no); if (id) window.open(url(id), '_blank', 'noopener'); };
  // whole register row opens the PDF from Drive
  DW.rowAttr = function (no) { const id = DW.id(no); return id ? `style="cursor:pointer" onclick="if(!event.target.closest('a'))window.open('${url(id)}','_blank','noopener')"` : ''; };
  DW.title = function (no) { const id = DW.id(no); return id ? `<a data-nt href="${url(id)}" target="_blank" rel="noopener" style="color:#1a73e8;text-decoration:underline">📄 ${esc(no)}</a>` : `${esc(no)} <span style="font-size:11px;color:var(--mut)" data-nt>(${L('no PDF in Drive yet', 'PDF нет в Drive')})</span>`; };
  // small button for one document number (register lists)
  DW.small = function (no) { if (!DW.d) return ''; const k = DW.keys(no)[0]; const f = k && DW.d.files[k][0]; return f ? `<div class="s" data-nt style="color:#1a73e8">${L('Tap to open PDF', 'Нажмите – откроется PDF')} · rev ${esc(f[0])}</div>` : ''; };
  // card with all PDFs found in the given texts
  DW.card = function (texts, title) { if (!DW.d) return ''; const K = []; (texts || []).forEach(t => DW.keys(t).forEach(k => { if (!K.includes(k)) K.push(k); }));
    if (!K.length) return '';
    return `<div class="card" style="border-left:5px solid #1a73e8"><div class="h3">📄 ${title || L('Drawings – open PDF', 'Чертежи – открыть PDF')}</div><div class="list">${K.slice(0, 8).map(DW.row).join('')}</div>
      <div style="margin-top:6px"><a class="link" href="${DW.FOLDER()}" target="_blank" rel="noopener">${L('All drawings folder in Google Drive ›', 'Вся папка чертежей в Google Drive ›')}</a></div></div>`; };
  DW.tile = function () { return `<a class="tile" style="text-decoration:none;background:#1a73e8;color:#fff;border-color:#1a73e8" href="${DW.FOLDER()}" target="_blank" rel="noopener"><b>📂 ${L('Drawings folder (Google Drive)', 'Папка чертежей (Google Drive)')}</b><div><span class="n" style="color:#e3edfd">${DW.d ? Object.keys(DW.d.files).length + ' ' + L('documents with PDF', 'документов с PDF') : L('open PDFs', 'открыть PDF')}</span></div></a>`; };
  DW.load();
})();
