// v4.69: MANPOWER PLAN – DAY BY DAY (manager format: job · men · days · men per date · total).
// Remaining work by category (from the app data) + punch closing; 1 supervisor, 1 engineer, 1 foreman, all others technicians.
// Everything is editable in the app (job, quantity, output, men, days, start) and saved on this device; Excel export in the same layout.
// Manpower goes down automatically when a job is finished (its technicians are released).
(function () {
  const MP = window.MP = {};
  const KEY = 'mp_v1_' + PRJ;
  const AREA = PRJ === '8810' ? 'D88' : PRJ;
  const p2 = n => String(n).padStart(2, '0');
  const key = d => `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
  const pd = s => { const m = String(s || '').match(/(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?/); if (!m) return null; const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear(); return new Date(y, +m[2] - 1, +m[1]); };
  const nf = v => v == null || v === '' ? '' : (Math.abs(v) >= 1000 ? fmtn(Math.round(v)) : String(Math.round(v * 10) / 10));
  const RU = {'Cable termination': 'Расключение кабелей', 'Cable pulling': 'Прокладка кабеля', 'Electrical Cable Trays': 'Монтаж кабельных лотков', 'Frame Installation': 'Монтаж рам / стоек', 'Cable Conduits': 'Монтаж труб', 'Earthing and Lightning Termination': 'Заземление и молниезащита – подключение',
    'Small Steel Structures': 'Мелкие металлоконструкции / консоли', 'Cable Tray Materials': 'Материалы лотков', 'Transit Module Installation': 'Транзитные модули (МКТ)', 'Fire-Resistant Foam': 'Огнезащитная пена', 'Grounding Bar Installation': 'Шины заземления', 'Cable Trays Cover': 'Крышки лотков',
    'Earthing (wire) / Заземление (провод)': 'Заземление (провод)', 'Terminal, Junction, Distribution Power Boxes': 'Клеммные / распределительные коробки', 'Junction Boxes, Panels, Cabinets - Instr.': 'Коробки, шкафы КИП', 'Earthing (strip) / Заземление (полоса)': 'Заземление (полоса)'};
  // order of work: cables and handover items first, containment after, other punches last
  const PRI = ['Cable pulling', 'Cable termination', '@P1', 'Earthing and Lightning Termination', 'Earthing (wire) / Заземление (провод)', 'Earthing (strip) / Заземление (полоса)', 'Grounding Bar Installation', 'Terminal, Junction, Distribution Power Boxes', 'Junction Boxes, Panels, Cabinets - Instr.',
    'Electrical Cable Trays', 'Small Steel Structures', 'Cable Tray Materials', 'Frame Installation', 'Cable Conduits', 'Transit Module Installation', 'Fire-Resistant Foam', 'Cable Trays Cover', '@P2'];
  const CREW = g => /pulling/i.test(g) ? 6 : /tray|steel|frame/i.test(g) ? 4 : /termination/i.test(g) ? 3 : 2;   // default men per job when the job is started (one crew)
  const MAXC = g => /termination/i.test(g) ? 4 : /tray|steel|conduit|pulling/i.test(g) ? 3 : 2;               // max crews per job
  const P1 = ['tag', 'fer', 'earth', 'term'], P2 = ['fix', 'seal', 'clean', 'rd', 'mat', 'oth'];
  const nextMon = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d; };
  const DEFN = {D48: 40, '8810': 10, CCR: 30};
  // ---------- state ----------
  MP.st = function () { let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} return s; };
  MP.save = function (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} MP._s = s; };
  MP.get = function () { if (MP._s) return MP._s; const s = MP.st(); if (s && s.jobs) return (MP._s = s); const b = MP.build(); MP.save(b); return b; };
  let uid = 0; const nid = () => 'j' + Date.now().toString(36) + (uid++);
  // ---------- default plan from the app data ----------
  MP.build = function (opt) { opt = opt || {}; const old = MP._s || MP.st() || {};
    const c = RW.calc(), pl = RW.plan && RW.plan[PRJ];
    const s = {start: old.start || key(nextMon()), sun: old.sun || 0, n: old.n || DEFN[PRJ] || 30, staff: old.staff || {sup: 1, eng: 1, frm: 1}, jobs: [], made: key(new Date()), data: D.meta.date};
    const cats = c.works.map(e => ({cat: e.g + '|' + e.u, g: e.g, t: e.g + (c.works.filter(x => x.g === e.g).length > 1 ? ` (${e.u})` : ''), ru: RU[e.g] || '', q: e.rq, u: e.u, r: e.rate}));
    const pk = (L, nm, ru) => { const T = c.pun.filter(x => L.includes(x.k) && x.rate > 0); const q = T.reduce((a, x) => a + x.o, 0), md = T.reduce((a, x) => a + x.o / x.rate, 0); return q ? {cat: nm, g: nm, t: nm === '@P1' ? 'Punch closing – labels, ferrules, earthing, cables (handover)' : 'Punch closing – fixing, sealing, cleaning, material, other', ru, q, u: 'pcs', r: Math.round(10 * q / md) / 10} : null; };
    [pk(P1, '@P1', 'Закрытие замечаний – бирки, маркировка, заземление, кабели'), pk(P2, '@P2', 'Закрытие замечаний – крепление, уплотнение, очистка, прочее')].forEach(x => x && cats.push(x));
    cats.sort((a, b) => { const ia = PRI.indexOf(a.g), ib = PRI.indexOf(b.g); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    // CCR: the supervisor's own plan comes first, exactly as he wrote it (men per date)
    if (pl && !opt.calc) { pl.items.forEach(i => { const dk = Object.keys(i.s); s.jobs.push({id: nid(), t: i.en, ru: i.ru, q: '', u: '', r: '', m: i.men, d: dk.length, st: dk[0] || s.start, sup: 1, ov: Object.assign({}, i.s), cat: i.g === 'PUNCH' ? '@P' : (i.g || '')}); });
      if (pl.days && pl.days[0]) s.start = pl.days[0];
      cats.forEach(x => { if (s.jobs.some(j => j.cat && (j.cat === x.g || (j.cat === '@P' && /^@P/.test(x.g))))) return; s.jobs.push({id: nid(), t: x.t, ru: x.ru, q: Math.round(x.q * 10) / 10, u: x.u, r: x.r, m: 0, d: null, st: s.start, cat: x.cat, note: 'not in supervisor plan'}); });
      return s; }
    // other areas: jobs from the remaining work, started in order of priority as technicians become free
    const T = Math.max(1, s.n - s.staff.sup - s.staff.eng - s.staff.frm); const free = Array(400).fill(T); const wd = MP.wdays(s.start, s.sun, 400);
    cats.forEach(x => { if (!(x.q > 0) || !(x.r > 0)) return; const md = x.q / x.r; let m = Math.min(T, CREW(x.g) * MAXC(x.g), Math.max(1, Math.ceil(md / 22))); m = Math.max(1, m);
      let days = Math.ceil(md / m), st = 0;
      for (; st < 380; st++) { let ok = true; for (let i = st; i < st + days; i++) if (free[i] < m) { ok = false; break; } if (ok) break; }
      for (let i = st; i < st + days; i++) free[i] -= m;
      s.jobs.push({id: nid(), t: x.t, ru: x.ru, q: Math.round(x.q * 10) / 10, u: x.u, r: x.r, m, d: null, st: key(wd[st]), cat: x.cat}); });
    return s; };
  MP.wdays = function (start, sun, n) { const L = []; const d = pd(start) || nextMon(); for (let i = 0; L.length < n && i < 1000; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if (sun || x.getDay() !== 0) L.push(x); } return L; };
  // ---------- calculation ----------
  const jdays = j => j.d != null && j.d !== '' ? Math.max(0, Math.round(+j.d)) : (j.q > 0 && j.r > 0 && j.m > 0 ? Math.ceil(j.q / (j.r * j.m)) : 0);
  MP.calc = function () { const s = MP.get(); const jobs = s.jobs.map(j => { const L = j.ov ? Object.keys(j.ov).filter(k => j.ov[k] > 0).sort((a, b) => pd(a) - pd(b)) : MP.wdays(j.st || s.start, s.sun, jdays(j)).map(key);
      const men = {}; L.forEach(k => { men[k] = j.ov ? +j.ov[k] : +j.m; }); return Object.assign({}, j, {days: L.length, men, from: L[0] || '', to: L[L.length - 1] || ''}); });
    let first = pd(s.start), last = first; jobs.forEach(j => { if (j.from && pd(j.from) < first) first = pd(j.from); if (j.to && pd(j.to) > last) last = pd(j.to); });
    const span = Math.max(29, Math.round((last - first) / 864e5)); const cols = []; for (let i = 0; i <= span; i++) { const d = new Date(first); d.setDate(first.getDate() + i); cols.push(d); }
    const st = s.staff, staff = (+st.sup || 0) + (+st.eng || 0) + (+st.frm || 0);
    const tech = cols.map(d => jobs.reduce((a, j) => a + (j.men[key(d)] || 0), 0));
    const tot = tech.map((v, i) => v ? v + (cols[i].getDay() === 0 && !s.sun ? 0 : staff) : 0);
    const fin = {}; jobs.forEach(j => { if (j.to) (fin[j.to] = fin[j.to] || []).push(j); });
    const md = jobs.reduce((a, j) => a + Object.values(j.men).reduce((x, y) => x + y, 0), 0) + tot.filter(v => v).length * staff;
    return MP._c = {s, jobs, cols, tech, tot, staff, fin, md, peak: Math.max.apply(null, tot.concat([0])), end: jobs.reduce((a, j) => j.to && (!a || pd(j.to) > pd(a)) ? j.to : a, '')}; };
  // ---------- editing ----------
  MP.set = function (id, k, v) { const s = MP.get(); const j = s.jobs.find(x => x.id === id); if (!j) return;
    if (['q', 'r', 'm'].includes(k)) { const n = Number(String(v).replace(',', '.')); if (v !== '' && !(n >= 0)) return toast('Enter a number'); j[k] = v === '' ? '' : n; if (k === 'm' && j.ov) { Object.keys(j.ov).forEach(x => { if (j.ov[x] > 0) j.ov[x] = n; }); } if (k !== 'm' || !j.ov) j.d = j.d; }
    else if (k === 'd') { const n = parseInt(v, 10); j.d = v === '' ? null : (n >= 0 ? n : j.d); if (j.ov) { delete j.ov; } }
    else if (k === 'st') { const d = pd(v); if (!d) return toast('Date as dd.mm.yyyy'); if (j.ov) { const L = Object.keys(j.ov).filter(x => j.ov[x] > 0).sort((a, b) => pd(a) - pd(b)); j.d = L.length; delete j.ov; } j.st = key(d); }
    else j[k] = v;
    MP.save(s); MP.view(); };
  MP.setS = function (k, v) { const s = MP.get(); if (k === 'start') { const d = pd(v); if (!d) return toast('Date as dd.mm.yyyy'); s.start = key(d); } else if (k === 'sun') s.sun = v ? 1 : 0; else if (k === 'n') { const n = parseInt(v, 10); if (!(n > 0)) return; s.n = n; } else { const n = parseInt(v, 10); s.staff[k] = n >= 0 ? n : 0; } MP.save(s); MP.view(); };
  MP.add = function () { const s = MP.get(); s.jobs.push({id: nid(), t: 'New job', ru: '', q: '', u: '', r: '', m: 2, d: 3, st: s.start, cat: ''}); MP.save(s); MP.view(); };
  MP.del = function (id) { const s = MP.get(); s.jobs = s.jobs.filter(x => x.id !== id); MP.save(s); MP.view(); };
  MP.mv = function (id, dir) { const s = MP.get(), i = s.jobs.findIndex(x => x.id === id), k = i + dir; if (i < 0 || k < 0 || k >= s.jobs.length) return; const t = s.jobs[i]; s.jobs[i] = s.jobs[k]; s.jobs[k] = t; MP.save(s); MP.view(); };
  MP._rb = 0; MP.rebuild = function (calc) { if (MP._rb !== (calc ? 2 : 1)) { MP._rb = calc ? 2 : 1; MP.view(); return toast('Tap again to rebuild – your changes will be replaced'); } MP._rb = 0; MP._s = null; MP.save(MP.build({calc})); MP.view(); toast('Plan rebuilt from the app data'); };
  MP.cell = function (id, k, v) { const s = MP.get(); const j = s.jobs.find(x => x.id === id); if (!j) return; const n = parseInt(v, 10);
    if (!j.ov) { j.ov = {}; MP.wdays(j.st || s.start, s.sun, jdays(j)).forEach(d => { j.ov[key(d)] = +j.m; }); }
    if (n > 0) j.ov[k] = n; else delete j.ov[k]; MP.save(s); MP.view(); };
  MP.grid = 0; MP.tg = function () { MP.grid = MP.grid ? 0 : 1; MP.view(); };
  // ---------- view ----------
  MP.tile = function () { return `<button class="tile main" style="min-height:auto;width:100%;margin-bottom:6px;background:#5b2a86;border-color:#5b2a86;color:#fff" onclick="go('#/mp')"><b>👷 MANPOWER PLAN – DAY BY DAY</b><span class="n" style="color:#eadff5">remaining work by category · men per day · reduces as jobs finish · editable · Excel</span></button>`; };
  MP.route = function () { MP.view(); };
  const wd2 = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  MP.view = function () { if (!window.RW || !window.RP) { main.innerHTML = '<div class="empty">Loading…</div>'; return; } if (!RW.ready && RW.plan == null && PRJ === 'CCR') { main.innerHTML = '<div class="empty">Loading the supervisor plan…</div>'; return; }
    const c = MP.calc(), s = c.s; setHead('Manpower plan – day by day', `${AREA} · start ${s.start}`);
    const css = `<style>.mpt{border-collapse:collapse;font-size:11.5px}.mpt th,.mpt td{border:1px solid var(--line);padding:3px 4px;vertical-align:middle}.mpt th{background:#eef3f8;font-size:10.5px;font-weight:600}.mpt input{width:100%;box-sizing:border-box;padding:3px;border:1px solid #c9d2dc;border-radius:5px;font-size:12px;background:#fff8e1}.mpt input.n{width:52px;text-align:right}.mpt input.ru{background:#fff}.mpt input.dt{width:84px}
      .mpg{border-collapse:collapse;font-size:11px}.mpg th,.mpg td{border:1px solid var(--line);padding:2px 1px;text-align:center;min-width:24px}.mpg th{background:#eef3f8;font-size:10px;font-weight:600}.mpg td.j,.mpg th.j{position:sticky;left:0;background:#fff;text-align:left;min-width:150px;max-width:190px;padding:2px 4px;z-index:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mpg td.on{background:#cfe8ff;font-weight:600}.mpg td.ov{background:#ffe7a8;font-weight:600}.mpg td.sun,.mpg th.sun{background:#f8d7d0}.mpg tr.t td{font-weight:700;background:#f4f7fa}.mpg tr.t td.j{background:#f4f7fa}.mpg td.dn{color:#c0392b;font-weight:700}.mpg input{width:24px;border:0;background:transparent;text-align:center;font-size:11px;padding:0}
      .mpw{overflow-x:auto;-webkit-overflow-scrolling:touch}.mpk{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px}.mpk div{border:1px solid var(--line);border-radius:8px;padding:7px;background:#fff}.mpk b{display:block;font-size:18px}.mpk span{font-size:11px;color:var(--mut)}.mpbar{display:flex;align-items:flex-end;gap:1px;height:70px;margin-top:6px}.mpbar i{flex:1;background:#5b2a86;min-width:3px;border-radius:2px 2px 0 0}:root[data-theme=dark] .mpk div{background:var(--card);color:var(--ink)}:root[data-theme=dark] .mpk span{color:#aab6c5}:root[data-theme=dark] .mpt th,:root[data-theme=dark] .mpg th{background:#22324a;color:#e6edf5}:root[data-theme=dark] .mpt td,:root[data-theme=dark] .mpg td{color:var(--ink)}:root[data-theme=dark] .mpt input{background:#3d3920;color:#fff;border-color:#5a5a40}:root[data-theme=dark] .mpt input.ru{background:#2b3648}:root[data-theme=dark] .mpg td.j,:root[data-theme=dark] .mpg th.j{background:var(--card);color:var(--ink)}:root[data-theme=dark] .mpg td.on{background:#1f4f7a;color:#fff}:root[data-theme=dark] .mpg td.ov{background:#7a5a12;color:#fff}:root[data-theme=dark] .mpg td.sun,:root[data-theme=dark] .mpg th.sun{background:#5a2f2a;color:#fff}:root[data-theme=dark] .mpg tr.t td,:root[data-theme=dark] .mpg tr.t td.j{background:#1c2a3f;color:#fff}:root[data-theme=dark] .mpg td.dn{color:#ff8a80}:root[data-theme=dark] .mpg input{color:inherit}:root[data-theme=dark] .mpbar i{background:#b58ae0}:root[data-theme=dark] .mpbar i.s{background:#5a2f2a}.mpbar i.s{background:#f8d7d0}</style>`;
    const top = `<div class="card"><div class="h3">Plan settings</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:13px">Start <input class="fin" style="width:110px" value="${esc(s.start)}" onchange="MP.setS('start',this.value)">
      Supervisor <input class="fin" style="width:46px" value="${s.staff.sup}" onchange="MP.setS('sup',this.value)"> Engineer <input class="fin" style="width:46px" value="${s.staff.eng}" onchange="MP.setS('eng',this.value)"> Foreman <input class="fin" style="width:46px" value="${s.staff.frm}" onchange="MP.setS('frm',this.value)">
      <label><input type="checkbox" ${s.sun ? 'checked' : ''} onchange="MP.setS('sun',this.checked)"> work on Sundays</label></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:13px;margin-top:6px">Persons available (all) <input class="fin" style="width:56px" value="${s.n}" onchange="MP.setS('n',this.value)"> <button class="chip" onclick="MP.rebuild(${PRJ === 'CCR' ? 0 : 1})">${MP._rb ? '⚠ Tap again to rebuild' : '↻ Rebuild plan from app data'}</button>${PRJ === 'CCR' ? `<button class="chip" onclick="MP.rebuild(1)">${MP._rb === 2 ? '⚠ Tap again' : '↻ Calculated plan (without supervisor plan)'}</button>` : ''}</div>
      <div class="mpk" style="margin-top:8px"><div style="${c.peak > s.n ? 'background:#fde2e0;color:#18202b' : ''}"><span>Peak persons</span><b>${c.peak}</b><span>${c.peak > s.n ? `over the ${s.n} available – reduce men or move start dates` : `incl. ${c.staff} staff · ${s.n} available`}</span></div><div><span>First week</span><b>${c.tot.slice(0, 7).reduce((a, b) => Math.max(a, b), 0)}</b><span>persons (peak)</span></div><div><span>Last job finishes</span><b>${esc(c.end || '–')}</b><span>${c.jobs.filter(j => j.days).length} jobs</span></div><div><span>Total man-days</span><b>${fmtn(c.md)}</b><span>technicians + staff</span></div></div>
      <div class="mpbar">${c.tot.map((v, i) => `<i class="${c.cols[i].getDay() === 0 && !s.sun ? 's' : ''}" title="${key(c.cols[i])}: ${v}" style="height:${c.peak ? Math.max(2, 70 * v / c.peak) : 2}px"></i>`).join('')}</div><div class="foot" style="margin-top:2px">Persons per day – goes down when jobs are finished.</div></div>`;
    const rows = c.jobs.map((j, i) => `<tr><td>${i + 1}</td><td style="min-width:190px"><input value="${esc(j.t)}" onchange="MP.set('${j.id}','t',this.value)"><input class="ru" style="margin-top:2px" placeholder="RU" value="${esc(j.ru || '')}" onchange="MP.set('${j.id}','ru',this.value)">${j.note && !(j.m > 0) ? `<div style="font-size:10.5px;color:#c0392b">${esc(j.note)}</div>` : ''}</td>
      <td><input class="n" value="${j.q === '' || j.q == null ? '' : j.q}" onchange="MP.set('${j.id}','q',this.value)"></td><td><input style="width:42px" value="${esc(j.u || '')}" onchange="MP.set('${j.id}','u',this.value)"></td><td><input class="n" value="${j.r === '' || j.r == null ? '' : j.r}" onchange="MP.set('${j.id}','r',this.value)"></td>
      <td><input class="n" style="font-weight:700" value="${j.m}" onchange="MP.set('${j.id}','m',this.value)"></td><td><input class="n" value="${j.days}" onchange="MP.set('${j.id}','d',this.value)" title="empty = calculated from quantity"></td><td><input class="dt" value="${esc(j.from || j.st || s.start)}" onchange="MP.set('${j.id}','st',this.value)"></td><td style="white-space:nowrap">${esc(j.to || '–')}</td>
      <td style="white-space:nowrap"><button class="chip" style="padding:2px 6px" onclick="MP.mv('${j.id}',-1)">↑</button><button class="chip" style="padding:2px 6px" onclick="MP.mv('${j.id}',1)">↓</button><button class="chip" style="padding:2px 6px" onclick="MP.del('${j.id}')">✕</button></td></tr>`).join('');
    const edit = `<div class="card" style="padding:8px"><div class="h3">1 · Remaining work by category – men and days (edit)</div><div class="mpw"><table class="mpt"><tr><th>#</th><th>Job / work category</th><th>Remaining qty</th><th>Unit</th><th>Output of 1 technician / day</th><th>Men</th><th>Days</th><th>Start</th><th>Finish</th><th></th></tr>${rows}</table></div>
      <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="chip on" onclick="MP.add()">＋ Add job</button></div>
      <div class="foot">Days = remaining quantity ÷ (men × output of one technician), or type the days yourself (empty the box to calculate again). Start = first working day of the job. Change men or start to move people between jobs – when a job finishes, its men leave the plan. Saved on this device.</div></div>`;
    const ch = []; let prev = null; c.cols.forEach((d, i) => { const v = c.tot[i]; if (d.getDay() === 0 && !s.sun) return; if (prev != null && v !== prev) { const k = key(d), pk = new Date(d); pk.setDate(d.getDate() - 1); const done = Object.keys(c.fin).filter(x => pd(x) < d && pd(x) >= new Date(d.getTime() - 3 * 864e5)).reduce((a, x) => a.concat(c.fin[x]), []).filter(j => !j._shown);
      done.forEach(j => { j._shown = 1; }); ch.push([k, v, v - prev, done.map(j => j.t)]); } prev = v; });
    const grid = `<div class="card" style="padding:8px"><div class="h3" style="display:flex;justify-content:space-between;align-items:center">2 · Day by day – men per job <button class="chip ${MP.grid ? 'on' : ''}" onclick="MP.tg()">${MP.grid ? '✓ Editing days' : '✎ Edit days'}</button></div><div class="mpw"><table class="mpg"><tr><th class="j">Job</th><th>Men</th><th>Days</th>${c.cols.map(d => `<th class="${d.getDay() === 0 ? 'sun' : ''}">${wd2[d.getDay()]}<br>${p2(d.getDate())}.${p2(d.getMonth() + 1)}</th>`).join('')}</tr>
      ${c.jobs.map((j, i) => `<tr><td class="j" title="${esc(j.t)}">${i + 1}. ${esc(j.t)}</td><td>${j.m}</td><td>${j.days}</td>${c.cols.map(d => { const k = key(d), v = j.men[k] || 0; return MP.grid ? `<td class="${v ? (j.ov ? 'ov' : 'on') : d.getDay() === 0 ? 'sun' : ''}"><input value="${v || ''}" inputmode="numeric" onchange="MP.cell('${j.id}','${k}',this.value)"></td>` : `<td class="${v ? (j.ov ? 'ov' : 'on') : d.getDay() === 0 ? 'sun' : ''}">${v || ''}</td>`; }).join('')}</tr>`).join('')}
      <tr class="t"><td class="j">Technicians</td><td></td><td></td>${c.tech.map(v => `<td>${v || ''}</td>`).join('')}</tr>
      ${[['Supervisor', s.staff.sup], ['Engineer', s.staff.eng], ['Foreman', s.staff.frm]].map(([n, v]) => `<tr><td class="j">${n}</td><td>${v}</td><td></td>${c.tot.map(t => `<td>${t ? v || '' : ''}</td>`).join('')}</tr>`).join('')}
      <tr class="t"><td class="j">TOTAL PERSONS</td><td></td><td></td>${c.tot.map(v => `<td>${v || ''}</td>`).join('')}</tr>
      <tr><td class="j">Change vs previous day</td><td></td><td></td>${c.tot.map((v, i) => { if (c.cols[i].getDay() === 0 && !s.sun) return '<td class="sun"></td>'; let p = null; for (let k = i - 1; k >= 0; k--) { if (!(c.cols[k].getDay() === 0 && !s.sun)) { p = c.tot[k]; break; } } const df = p == null ? 0 : v - p; return `<td class="${df < 0 ? 'dn' : ''}">${df ? (df > 0 ? '+' : '') + df : ''}</td>`; }).join('')}</tr></table></div>
      <div class="foot">Blue = planned men · orange = changed by hand (Edit days) · pink = Sunday. ${MP.grid ? 'Type the men for a day; empty = no work that day.' : ''}</div></div>`;
    const chg = `<div class="card" style="padding:8px"><div class="h3">3 · Manpower changes</div>${ch.length ? `<table class="mpt" style="width:100%"><tr><th>From</th><th>Persons</th><th>Change</th><th>Reason</th></tr>${ch.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}</b></td><td style="color:${x[2] < 0 ? '#c0392b' : '#2e7d32'};font-weight:700">${x[2] > 0 ? '+' : ''}${x[2]}</td><td>${x[3].length ? 'finished: ' + esc(x[3].join(' · ')) : x[2] > 0 ? 'job(s) start' : 'job(s) finished / changed'}</td></tr>`).join('')}</table>` : '<div class="foot">No change – the same manpower every day.</div>'}</div>`;
    main.innerHTML = css + `<div class="chips"><button class="chip on" onclick="MP.excel()">📊 Excel (manager format)</button><button class="chip" onclick="go('#/rw')">🧮 Remaining works</button></div>${top}${edit}${grid}${chg}
      <div class="foot">Categories and remaining quantities come from the app data of ${esc(D.meta.date)} (IWP lines of the own scope, open punch lists). ${PRJ === 'CCR' ? 'CCR starts from the supervisor plan; categories without men are remaining in the IWP but not yet in his plan. ' : ''}Output per technician is a planning figure – correct it to your crews. Commissioning is not included.</div>`; };
  // ---------- Excel (manager layout: # · job · men · days · blank · dates; total row with formulas) ----------
  const colL = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; };
  MP.excel = function () { if (!window.XL) return toast('Excel module not loaded'); const c = MP._c || MP.calc(), s = c.s, F = 3, n = c.jobs.length;
    // same picture as the app: Job · Men · Days · one column per date (blue = men planned, pink = Sunday), then technicians, staff, total, change
    const off = d => d.getDay() === 0 && !s.sun, sunc = d => d.getDay() === 0;
    const head = ['Job', 'Men', 'Days'].concat(c.cols.map(d => `${wd2[d.getDay()]}\n${p2(d.getDate())}.${p2(d.getMonth() + 1)}`));
    const R = [head]; const fills = {}; const NR = n + 7;
    c.jobs.forEach((j, i) => { fills[(i + 1) + ',1'] = 'c'; fills[(i + 1) + ',2'] = 'c'; R.push([(i + 1) + '. ' + j.t + (j.ru && !j.t.includes(j.ru) ? ' / ' + j.ru : ''), j.m, j.days].concat(c.cols.map((d, k) => { const v = j.men[key(d)] || ''; fills[(i + 1) + ',' + (F + k)] = v ? 'b' : sunc(d) ? 'p' : 'c'; return v; }))); });
    const tr = n + 2;   // technicians row (1-based)
    R.push(['Technicians', '', ''].concat(c.cols.map((d, k) => `=SUM(${colL(F + k)}2:${colL(F + k)}${n + 1})`)));
    const sr = [['Supervisor', s.staff.sup], ['Engineer', s.staff.eng], ['Foreman', s.staff.frm]];
    sr.forEach(([nm, v], q) => R.push([nm, v, ''].concat(c.cols.map((d, k) => `=IF(${colL(F + k)}${tr}>0,$B$${tr + 1 + q},"")`))));
    R.push(['TOTAL PERSONS', '', ''].concat(c.cols.map((d, k) => `=IF(${colL(F + k)}${tr}>0,SUM(${colL(F + k)}${tr}:${colL(F + k)}${tr + 3}),"")`)));
    R.push(['Change vs previous day', '', ''].concat(c.cols.map((d, k) => { if (off(d)) return ''; let p = k - 1; while (p >= 0 && off(c.cols[p])) p--; return p >= 0 ? `=IF(N(${colL(F + k)}${tr + 4})-N(${colL(F + p)}${tr + 4})=0,"",N(${colL(F + k)}${tr + 4})-N(${colL(F + p)}${tr + 4}))` : ''; })));
    for (let r = n + 1; r <= n + 6; r++) { const bold = r === n + 1 || r === n + 5; if (bold) fills[r + ',0'] = 'B'; fills[r + ',1'] = 'c'; fills[r + ',2'] = 'c'; c.cols.forEach((d, k) => { fills[r + ',' + (F + k)] = sunc(d) ? 'p' : bold ? 'B' : 'c'; }); }
    c.cols.forEach((d, k) => { if (sunc(d)) fills['0,' + (F + k)] = 'p'; });
    R.push([], [`${AREA} · manpower plan from ${s.start} · app data ${D.meta.date} · blue = men planned, pink = Sunday · staff: supervisor ${s.staff.sup}, engineer ${s.staff.eng}, foreman ${s.staff.frm}; all others technicians`]);
    const W = [{name: 'Plan', rows: R, widths: [44, 6, 6].concat(c.cols.map(() => 5.5)), bold: [0], fills, freeze: 1}];
    const r2 = [['#', 'Job / work category', 'RU', 'Remaining qty', 'Unit', 'Output of 1 technician / day', 'Men', 'Days', 'Start', 'Finish', 'Man-days', 'Note']].concat(c.jobs.map((j, i) => [i + 1, j.t, j.ru || '', j.q === '' ? '' : j.q, j.u || '', j.r === '' ? '' : j.r, j.m, j.days, j.from, j.to, Object.values(j.men).reduce((a, b) => a + b, 0), j.note && !(j.m > 0) ? j.note : '']));
    r2.push([], ['Staff every working day', 'Supervisor ' + s.staff.sup + ' · Engineer ' + s.staff.eng + ' · Foreman ' + s.staff.frm], ['Peak persons', c.peak], ['Last job finishes', c.end], ['Total man-days', c.md], ['App data', D.meta.date], ['Area', AREA]);
    const r3 = [['From date', 'Persons', 'Change', 'Reason']]; let prev = null; c.cols.forEach((d, i) => { if (d.getDay() === 0 && !s.sun) return; const v = c.tot[i]; if (prev != null && v !== prev) { const fin = Object.keys(c.fin).filter(x => pd(x) < d && pd(x) >= new Date(d.getTime() - 3 * 864e5)).reduce((a, x) => a.concat(c.fin[x].map(j => j.t)), []); r3.push([key(d), v, v - prev, fin.length ? 'finished: ' + fin.join(' · ') : '']); } prev = v; });
    W.push({name: 'Jobs', rows: r2, widths: [5, 50, 44, 12, 7, 12, 7, 7, 11, 11, 10, 24], bold: [0]}, {name: 'Changes', rows: r3, widths: [12, 10, 9, 80], bold: [0]});
    XL.save(`Manpower_plan_day_by_day_${AREA}_${s.start}.xlsx`, W); };
  try { const h = location.hash; if (/^#\/mp/.test(h)) route(); } catch (e) {}
})();
