// v4.44: labelled floating Excel button on every page (header icon was hard to see on phones).
// v4.43: panel pages export in the saved "panel wise cable check" format (Summary + one sheet per system, panel bands, full cable details).
// v4.42: "Excel" button on every page for every user (no owner code). Exports what the open page shows –
// lists, tables and detail cards – to .xlsx with the app's own offline writer (xl.js, no outside library).
// "Show more" lists are opened fully before the export, so the Excel has every line, not only the first 150.
(function () {
  const clean = s => String(s == null ? '' : s).replace(/[ \s]+/g, ' ').trim();
  const num = v => { const t = clean(v); return /^-?\d+([.,]\d+)?$/.test(t) && t.length < 15 && !/^0\d/.test(t) ? Number(t.replace(',', '.')) : t; };
  const txt = el => el ? clean(el.innerText || el.textContent) : '';
  const sheetName = (n, used) => { let s = clean(n).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 28) || 'Sheet'; let k = s, i = 2; while (used.has(k.toLowerCase())) k = s.slice(0, 25) + ' ' + i++; used.add(k.toLowerCase()); return k; };
  const pageTitle = () => clean((document.getElementById('ttl') || {}).textContent || 'Export');
  const pageSub = () => clean((document.getElementById('st') || {}).textContent || '');

  // open every "Show more" list (the views re-render on click)
  function openAll(root) { for (let i = 0; i < 80; i++) { const b = root.querySelector('button.more'); if (!b) break; try { b.click(); } catch (e) { break; } } }

  function headingFor(el, root) {
    const card = el.closest('.card'); let h = card && card !== el ? card.querySelector('.h3') : null;
    if (!h) { let p = el.previousElementSibling; while (p) { if (p.matches && (p.matches('.h3,.gh,h2,h3'))) { h = p; break; } p = p.previousElementSibling; } }
    return h ? txt(h) : pageTitle();
  }

  function tableRows(tb) { return [...tb.rows].map(tr => [...tr.cells].map(c => num(txt(c)))); }

  function listRows(lst) {
    const out = []; let grp = '', maxD = 0;
    [...lst.children].forEach(ch => {
      if (ch.matches('.gh')) { grp = txt(ch); return; }
      if (ch.matches('button.more')) return;
      const t = ch.querySelector('.t'), s = ch.querySelector('.s');
      const badges = [...ch.querySelectorAll('.badge')].map(txt).filter(Boolean).join(' / ');
      let title, det;
      if (t || s) { title = txt(t); det = s ? txt(s).split(/\s+·\s+/) : []; }
      else { const lines = (ch.innerText || '').split('\n').map(clean).filter(Boolean); title = lines.shift() || ''; det = lines; }
      const rest = [...ch.querySelectorAll('.m > div:not(.t):not(.s)')].map(txt).filter(Boolean);
      const r = ch.querySelector('.r'); if (r) { const rc = r.cloneNode(true); rc.querySelectorAll('.badge,button').forEach(e => e.remove()); const rt = clean(rc.innerText || rc.textContent); if (rt) rest.push(rt); }
      det = det.concat(rest).filter(x => x && x !== badges);
      maxD = Math.max(maxD, det.length);
      out.push({grp, title, det, badges});
    });
    if (!out.length) return null;
    const hasG = out.some(r => r.grp);
    const head = (hasG ? ['Group'] : []).concat(['Item'], Array.from({length: maxD}, (_, i) => maxD === 1 ? 'Details' : 'Details ' + (i + 1)), ['Status']);
    return [head].concat(out.map(r => (hasG ? [r.grp] : []).concat([r.title], Array.from({length: maxD}, (_, i) => num(r.det[i] || '')), [r.badges])));
  }

  // blocks under a section title (e.g. cable boxes on a panel page): one row per block
  function blockRows(blocks) {
    const out = []; let maxD = 0;
    blocks.forEach(bk => { const b = bk.querySelector('b'); const badges = [...bk.querySelectorAll('.badge')].map(txt).filter(Boolean);
      let det = [...bk.querySelectorAll('.s2,.s')].map(txt).filter(Boolean);
      const title = b ? txt(b) : ((bk.innerText || '').split('\n').map(clean).filter(Boolean)[0] || '');
      if (!det.length) det = (bk.innerText || '').split('\n').map(clean).filter(x => x && x !== title && !badges.includes(x));
      maxD = Math.max(maxD, det.length); out.push([title, det, badges.join(' / ')]); });
    if (!out.length) return null;
    return [['Item'].concat(Array.from({length: maxD}, (_, i) => 'Details ' + (i + 1)), ['Status'])].concat(out.map(([t, d, st]) => [t].concat(Array.from({length: maxD}, (_, i) => num(d[i] || '')), [st])));
  }

  // panel pages: full cable list of every listed panel (panel-wise remaining)
  function panelCables(tags) {
    if (typeof PBY === 'undefined' || typeof CBY === 'undefined' || typeof cst !== 'function') return null;
    const rows = [['Panel', 'Panel description', 'Room', 'Direction', 'Cable', 'From', 'To', 'Type', 'Cores / size', 'Length m', 'Drawing', 'Status', 'Pulled', 'Terminated', 'CTQ']];
    tags.forEach(t => { const p = PBY[t]; if (!p) return; p.cs.forEach(([dir, ct]) => { const c = CBY[ct]; if (!c) { rows.push([t, p.desc, p.room, dir, ct, '', '', '', '', '', '', 'not in tracker', '', '', '']); return; }
      const s = cst(c); rows.push([t, p.desc, p.room || '', dir, c.t, c.f || '', c.o || '', c.ty || '', c.c || '', num(c.ln), c.d || '', s.l, s.p === true ? 'yes' : s.p === false ? 'no' : '', s.t === true ? 'yes' : s.t === false ? 'no' : '', c.q ? 'CTQ' : '']); }); });
    return rows.length > 1 ? rows : null;
  }
  // "Panel wise cable check" format (as CCR_Open_Client_Punch_by_Panel): Summary sheet first, then one sheet per system,
  // rows grouped by panel / box with a full-width band row, numbered 1..N, last column "Site comments" left empty.
  function sysOf(c) { const m = String(c.d || c.rf || '').match(/\b[A-Z]{2}-([A-Z0-9]{3,5})-(?:[A-Z]{2}-)?\d/); return m ? m[1] : 'Other'; }
  const PH = ['No', 'Cable', 'Dir.', 'From', 'From room', 'To', 'To room', 'Cable type', 'Cores / size', 'Length m', 'Drum (tracker)', 'Drawing', 'Ref. drawing', 'Contractor', 'Pulling status', 'Pulled date', 'Laying Access ID', 'Laying qty / fact', 'Termination status', 'Termination date', 'Termination Access ID', 'Termination qty / fact', 'CTQ', 'TQS', 'Tracker remark', 'RFI (RAWP)', 'Status', 'Site comments'];
  const PW = [5, 30, 5, 34, 8, 34, 8, 16, 11, 9, 16, 30, 16, 10, 14, 11, 13, 13, 16, 12, 13, 13, 10, 30, 22, 40, 16, 30];
  const LC = (() => { const n = PH.length; return n <= 26 ? String.fromCharCode(64 + n) : 'A' + String.fromCharCode(64 + n - 26); })();
  function panelBook(tags, onlyRem) {
    if (typeof PBY === 'undefined' || typeof CBY === 'undefined' || typeof cst !== 'function') return null;
    const prj = window.__P || 'CCR', d = new Date(), dd = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
    const bySys = {}, sumRows = [];
    tags.forEach(t => { const p = PBY[t]; if (!p) return;
      const L = p.cs.map(([dir, ct]) => ({dir, ct, c: CBY[ct]})).map(x => Object.assign(x, {s: x.c ? cst(x.c) : {l: 'Not in tracker', ok: false}}));
      const use = onlyRem ? L.filter(x => !x.s.ok) : L; if (!use.length) return;
      const cnt = {}; L.forEach(x => { if (x.c) { const k = sysOf(x.c); cnt[k] = (cnt[k] || 0) + 1; } });
      const sys = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'Other';
      (bySys[sys] = bySys[sys] || []).push({p, L, use}); });
    const used = new Set(['summary']), sheets = [];
    Object.keys(bySys).sort().forEach(sys => {
      const sn = sheetName(sys, used); const grp = bySys[sys]; let n = 0, nRem = 0, nAll = 0;
      const rows = [], bold = [0, 3], merges = [];
      grp.forEach(({p, L, use}) => { const rem = L.filter(x => !x.s.ok).length; nRem += rem; nAll += use.length;
        sumRows.push([sys, p.tag, L.length, rem, L.filter(x => x.s.p === false || x.s.p === null).length, L.filter(x => x.s.p && !x.s.t).length, sn]);
        bold.push(rows.length + 4); merges.push(`A${rows.length + 5}:${LC}${rows.length + 5}`);
        rows.push([`Panel / box: ${p.tag}${p.desc ? ' – ' + p.desc : ''}${p.room ? ' · room ' + p.room : ''}   (${L.length} cables, ${rem} remaining)`]);
        use.forEach(({dir, ct, c, s}) => { n++; c = c || {};
          rows.push([n, ct, dir, c.f || '', c.fr || '', c.o || '', c.tr || '', c.ty || '', c.c || '', num(c.ln), c.dr || '', c.d || '', c.rf || '', c.co || '', c.tp || '', c.pd || '', num(c.la || ''), (c.lq !== undefined && c.lq !== '' ? c.lq + ' / ' + (c.lf || 0) : ''), c.tt || '', c.tf || '', num(c.ta || ''), (c.tq !== undefined && c.tq !== '' ? c.tq + ' / ' + (c.tfa || 0) : ''), c.q || '', c.tqs || '', c.h || '', String(c.cm || '').replace(/^\[|\]$/g, ''), s.l, '']); }); });
      sheets.push({name: sn, rows: [[`${prj} – ${sys} – ${onlyRem ? 'remaining cables' : 'cable check'} by panel`], [`Cable tracker / IWP data in the app · ${nAll} cables (${nRem} remaining) · exported ${dd} · write site status in the last column`], []].concat([PH], rows), bold, merges: merges.concat([`A1:${LC}1`, `A2:${LC}2`]), freeze: 4, widths: PW});
    });
    if (!sheets.length) return null;
    const sum = {name: 'Summary', rows: [[`${prj} – panel wise cable check${onlyRem ? ' – remaining' : ''}`], ['Remaining = cable not yet pulled and terminated (tracker / IWP / site entries) · one sheet per system'], [], ['System', 'Panel / box', 'Cables', 'Remaining', 'Not pulled', 'Termination open', 'Sheet']].concat(sumRows), bold: [0, 3], freeze: 4, widths: [12, 40, 9, 11, 11, 16, 12]};
    return [sum].concat(sheets);
  }
  const decTag = el => { const m = (el.getAttribute('onclick') || '').match(/go\('#\/p\/([^']+)'\)/); return m ? decodeURIComponent(m[1]) : null; };

  function widths(rows) { const w = []; rows.slice(0, 400).forEach(r => r.forEach((v, i) => { w[i] = Math.min(60, Math.max(w[i] || 8, String(v == null ? '' : v).length + 2)); })); return w; }

  function collect() {
    const main = document.getElementById('main'); openAll(main);
    const used = new Set(), sheets = [];
    const add = (name, rows) => { if (!rows || rows.length < 2 || sheets.length >= 40) return; const title = [[name], []]; sheets.push({name: sheetName(name, used), rows: title.concat(rows), bold: [0, 2], freeze: 3, widths: widths(rows)}); };
    const h = location.hash.replace(/^#\//, '').split('/');
    if (h[0] === 'p') {
      const tags = h[1] ? [decodeURIComponent(h.slice(1).join('/'))] : [...main.querySelectorAll('#pl .li')].map(decTag).filter(Boolean);
      const bk = panelBook(tags, !h[1] && typeof VS !== 'undefined' && VS.P && VS.P.f === 'open');
      if (bk) return bk;
    }
    main.querySelectorAll('table').forEach(tb => add(headingFor(tb, main), tableRows(tb)));
    main.querySelectorAll('.list').forEach(l => { if (l.closest('table') || (l.parentElement && l.parentElement.closest('.list'))) return; add(headingFor(l, main), listRows(l)); });
    main.querySelectorAll('.sect').forEach(sc => { if (h[0] === 'p' && h[1]) return; const bl = []; let n = sc.nextElementSibling; while (n && !n.matches('.sect,.card,.chips')) { bl.push(n); n = n.nextElementSibling; } add(txt(sc), blockRows(bl)); });
    // detail / summary cards that are not lists: label – value lines
    const info = [];
    main.querySelectorAll('.card').forEach(c => {
      if (c.querySelector('.list,table')) return;
      const h = txt(c.querySelector('.h3')); const lines = (c.innerText || '').split('\n').map(clean).filter(x => x && x !== h);
      if (!lines.length) return; info.push([h || '', '']); lines.forEach(L => { const m = L.match(/^([^:]{1,40}):\s*(.+)$/); info.push(m ? [m[1], num(m[2])] : ['', num(L)]); }); info.push(['', '']);
    });
    if (info.length) add(sheets.length ? 'Page details' : pageTitle(), [['Field', 'Value']].concat(info));
    if (!sheets.length) { const lines = (main.innerText || '').split('\n').map(clean).filter(Boolean); if (lines.length) add(pageTitle(), [['Text']].concat(lines.map(x => [num(x)]))); }
    // cover sheet: what was exported and when
    if (sheets.length) sheets.unshift({name: sheetName('Info', used), rows: [['CCR site app – export'], [], ['Page', pageTitle()], ['Filter / info', pageSub()], ['Language', document.documentElement.lang || ''], ['Exported', new Date().toLocaleString('ru-RU')], ['Sheets', sheets.length], []].concat(sheets.map(s => ['', s.name + ' – ' + (s.rows.length - 3) + ' rows'])), bold: [0], widths: [16, 70]});
    return sheets;
  }

  window.xlPage = function () {
    if (!window.XL || !XL.make) return toast('Excel writer not loaded yet – try again');
    const sheets = collect(); if (!sheets.length) return toast('Nothing to export on this page');
    const d = new Date(), dd = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
    const name = (sheets[0].name === 'Summary' && /^#\/p(\/|$)/.test(location.hash) ? String(sheets[0].rows[0][0]) + (location.hash.split('/')[2] ? ' ' + decodeURIComponent(location.hash.split('/').slice(2).join('/')) : '') : pageTitle() + (pageSub() ? ' ' + pageSub() : '')).replace(/[^\p{L}\p{N}.%-]+/gu, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 70) + '_' + dd + '.xlsx';
    XL.save(name, sheets);
  };

  // header button + floating "Excel" button (all pages, all users). v4.44: the header icon alone was too small on
  // phones (text hidden), so a labelled floating button is always shown at the bottom right as well.
  function addBtn() {
    const hm = document.getElementById('hm');
    if (hm && !document.getElementById('xlx')) hm.insertAdjacentHTML('beforebegin', '<button class="hbtn" id="xlx" onclick="xlPage()" title="Export this page to Excel" style="width:auto;padding:0 10px;font-size:13px;font-weight:600;white-space:nowrap">📗<span class="xt"> Excel</span></button>');
    if (!document.getElementById('xlfab')) document.body.insertAdjacentHTML('beforeend', '<button id="xlfab" onclick="xlPage()" title="Export this page to Excel / Выгрузить страницу в Excel">📗 Excel</button>');
    if (!document.getElementById('xlxcss')) document.head.insertAdjacentHTML('beforeend', '<style id="xlxcss">@media (max-width:480px){#xlx .xt{display:none}#xlx{padding:0 8px!important}}#xlfab{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:900;background:#1d6f42;color:#fff;border:0;border-radius:24px;padding:11px 16px;font:600 14px/1 Inter,system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.28);cursor:pointer}#xlfab:active{transform:scale(.96)}body{padding-bottom:72px}@media print{#xlfab{display:none}}</style>');
  }
  addBtn(); window.addEventListener('hashchange', addBtn);
})();
