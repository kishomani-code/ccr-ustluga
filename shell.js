/* v4.39 premium UI shell – sidebar, theme (light / dark), icons, dashboard hero, entry animations.
   Visual layer only: every button calls the app's existing routes (go / projSwitch / ownerLogin / mgrLogin).
   No engineering logic, data or calculation is changed here. Icons: Lucide (ISC licence), inlined as SVG. */
(function () {
  var TK = 'ccr_theme';
  function sysDark() { try { return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } }
  function getT() { try { return localStorage.getItem(TK) || (sysDark() ? 'dark' : 'light'); } catch (e) { return sysDark() ? 'dark' : 'light'; } }
  function setT(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(TK, t); } catch (e) {}
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', t === 'dark' ? '#0a0f1e' : '#f3f5fb');
    var b = document.getElementById('v5th'); if (b) b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon') + '<span>' + L(t === 'dark' ? 'Light mode' : 'Dark mode', t === 'dark' ? 'Светлая тема' : 'Тёмная тема') + '</span>';
    var h = document.getElementById('v5thh'); if (h) h.innerHTML = ic(t === 'dark' ? 'sun' : 'moon'); }
  setT(getT());
  window.v5toggleTheme = function () { setT(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); };

  var P = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    grid: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.52-1.94l4-1A2 2 0 0 1 13 4.56Z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    check: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    pkg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    tq: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v4"/><path d="M12 14h.01"/>',
    net: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    flask: '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
    map: '<path d="M14.1 6 9 3 3 6v15l6-3 5.1 3L21 18V3z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    snow: '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    note: '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    pin: '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
    flagc: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    grad: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    build: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.8 5.4a2 2 0 0 1-1.28 1.28l-5.4 1.8 1.8-5.4a2 2 0 0 1 1.28-1.28z"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    checkc: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    tree: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    cable: '<path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1"/><path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"/><path d="M21 21v-2h-4"/><path d="M3 5h4V3"/><path d="M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3"/>',
    menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; }
  function ru() { try { return localStorage.getItem('ccr_lang') === 'ru'; } catch (e) { return false; } }
  function L(en, r) { return ru() ? r : en; }

  // navigation – each entry opens an existing route of the app (nothing renamed or removed)
  var NAV = [
    ['Overview', 'Обзор', [['#/', 'home', 'Dashboard', 'Главная'], ['#/sy', 'activity', 'System progress', 'Прогресс по системам'], ['#/kz', 'refresh', 'Engineering updates', 'Инженерные обновления']]],
    ['Construction', 'Строительство', [['#/p', 'server', 'Panel cable check', 'Кабели по щитам'], ['#/ic', 'zap', 'Interconnection cables', 'Межобъектные кабели'], ['#/in', 'wrench', 'Installation check', 'Проверка монтажа'], ['#/rm', 'door', 'Rooms', 'Помещения'], ['#/pl', 'alert', 'Punch list', 'Замечания']]],
    ['Inspection (RFI)', 'Инспекция (RFI)', [['#/rf', 'check', 'RFI progress', 'Прогресс RFI'], ['#/ri', 'bell', 'Ready for inspection', 'Готово к инспекции'], ['#/ho', 'flag', 'Handover / gas-in', 'Передача / газ']]],
    ['Materials', 'Материалы', [['#/dr', 'disc', 'Cable drums', 'Барабаны'], ['#/mt', 'pkg', 'Material tracking', 'Учёт материалов'], ['#/mr', 'store', 'MRF status', 'Статус MRF']]],
    ['Engineering', 'Инжиниринг', [['#/ctq', 'tq', 'CTQ register', 'Реестр CTQ'], ['#/ntq', 'help', 'Need TQs', 'Нужны TQ'], ['#/dg', 'file', 'Drawings', 'Чертежи'], ['#/bd', 'net', 'System block diagrams', 'Структурные схемы'], ['#/kn', 'book', 'Engineering knowledge', 'Инженерные знания'], ['#/ug', 'msg', 'Comments for site team', 'Комментарии для участка'], ['#/lt', 'shield', 'LOTO', 'LOTO']]],
    ['Commissioning (client scope)', 'Пусконаладка (объём заказчика)', [['#/lc', 'flask', 'Loop check', 'Проверка контуров'], ['#/ga', 'phone', 'Gazprom commissioning contacts', 'Контакты ПНР Газпром']]],
    ['Progress', 'Прогресс', [['#/dp', 'pen', 'Daily progress entry', 'Ввод прогресса'], ['#/rb', 'users', 'Reported by', 'Кто отчитался'], ['#/ir', 'tag', 'Request IWP ID', 'Запрос IWP ID'], ['#/nt', 'note', 'Site notes', 'Заметки']]],
    ['Areas', 'Зоны', [['#/oa', 'map', 'Other area', 'Другие зоны'], ['#/cc', 'snow', 'Cold cables', 'Холодные кабели']]],
    ['Management', 'Управление', [['mg', 'chart', 'Manager dashboard', 'Панель менеджера'], ['ow', 'key', 'Owner menu', 'Меню владельца'], ['mc', 'menu', 'Overall dashboard & settings', 'Общая панель и настройки']]]
  ];
  window.v5nav = function (h) {
    try {
      if (h === 'mg') { (typeof S2 !== 'undefined' && (S2.mgr || S2.owner)) ? go('#/mg') : (typeof mgrLogin === 'function' ? mgrLogin() : go('#/mg')); }
      else if (h === 'mc') { if (window.MC && MC.side) MC.side(); }
      else if (h === 'ow') { (typeof S2 !== 'undefined' && S2.owner) ? go('#/ow') : (typeof ownerLogin === 'function' ? ownerLogin() : go('#/')); }
      else if (typeof go === 'function') go(h); else location.hash = h;
    } catch (e) { location.hash = h === 'mg' || h === 'ow' ? '#/' + h : h; }
    drawer(false);
  };
  function drawer(o) { var s = document.getElementById('v5sb'), v = document.getElementById('v5ov'); if (!s) return; s.classList.toggle('open', !!o); v.classList.toggle('open', !!o); }
  window.v5drawer = drawer;
  function active() {
    var h = location.hash.replace(/[?&]p=\w+$/, ''); var k = (h.replace(/^#\/?/, '').split('/')[0]) || '';
    var alias = {a: '', i: 'in', c: 'p', pk: 'pl', pi: 'pl', pp: 'pl', ptq: 'ctq', tq: 'ctq', s: ''};
    if (k in alias) k = alias[k];
    document.querySelectorAll('.v5i').forEach(function (b) { var t = b.getAttribute('data-k'); b.classList.toggle('on', t === k); });
  }
  var fill = null, lang = null;
  function build() {
    var prj = window.__P || (function () { try { return sessionStorage.getItem('proj'); } catch (e) { return ''; } })() || 'CCR';
    var nav = NAV.map(function (g) {
      return '<div class="v5g">' + L(g[0], g[1]) + '</div>' + g[2].map(function (x) {
        var k = x[0].replace(/^#\/?/, '');
        return '<button class="v5i" data-k="' + k + '" onclick="v5nav(\'' + x[0] + '\')">' + ic(x[1]) + '<span>' + L(x[2], x[3]) + '</span></button>';
      }).join('');
    }).join('');
    var sb = document.createElement('aside'); sb.id = 'v5sb'; sb.setAttribute('aria-label', 'Navigation');
    fill = function () { var nav = NAV.map(function (g) {
      return '<div class="v5g">' + L(g[0], g[1]) + '</div>' + g[2].map(function (x) {
        var k = x[0].replace(/^#\/?/, '');
        return '<button class="v5i" data-k="' + k + '" onclick="v5nav(\'' + x[0] + '\')">' + ic(x[1]) + '<span>' + L(x[2], x[3]) + '</span></button>';
      }).join('');
    }).join(''); lang = ru();
    sb.innerHTML = '<div class="v5brand"><img src="icon-192.png" alt=""><div><b>GPP E&amp;I</b><span>Ust-Luga · Rencons · ' + L('Engineering', 'Инжиниринг') + '</span></div></div>'
      + '<div class="v5prj">' + ['CCR', '1801', 'D48', '8810'].map(function (k) { return '<button class="' + (k === prj ? 'on' : '') + '" onclick="' + (k === prj ? 'v5drawer(false)' : 'typeof projSwitch===\'function\'?projSwitch(\'' + k + '\'):window.__pick&&__pick(\'' + k + '\')') + '">' + k + '</button>'; }).join('') + '</div>'
      + '<nav class="v5nav">' + nav + '</nav>'
      + '<div class="v5note">' + L('Commissioning execution is client scope – RHI scope is construction.', 'Пусконаладка – объём заказчика, объём РХИ – строительство.') + '</div>'
      + '<div class="v5ft"><button class="v5ib" id="v5th" onclick="v5toggleTheme()"></button></div>'; setT(document.documentElement.getAttribute('data-theme')); active(); };
    fill();
    document.body.appendChild(sb);
    var ov = document.createElement('div'); ov.id = 'v5ov'; ov.onclick = function () { drawer(false); }; document.body.appendChild(ov);
    // header: icons, menu (tablet / phone), theme toggle – existing buttons keep their ids and actions
    var row = document.querySelector('header .hrow');
    if (row) {
      var bk = document.getElementById('bk'); if (bk) bk.innerHTML = ic('back');
      var hm = document.getElementById('hm'); if (hm) hm.innerHTML = ic('home');
      var lg = row.querySelector('img'); if (lg) lg.id = 'v5logo';
      var th = document.createElement('button'); th.className = 'hbtn'; th.id = 'v5thh'; th.title = 'Light / dark'; th.onclick = window.v5toggleTheme;
      row.insertBefore(th, hm || null);
    }
    setT(document.documentElement.getAttribute('data-theme'));
    active();
    window.addEventListener('hashchange', function () { active(); drawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') drawer(false); });
    // theme switch also inside the existing ☰ menu (phones have no room in the header)
    if (window.MutationObserver) new MutationObserver(function () {
      var p = document.querySelector('#sidem .smp'); if (!p || p.querySelector('#v5smt')) return;
      var dk = document.documentElement.getAttribute('data-theme') === 'dark';
      var b = document.createElement('button'); b.id = 'v5smt'; b.className = 'smi v5mt'; b.setAttribute('data-nt', '1');
      b.innerHTML = ic(dk ? 'sun' : 'moon').replace('<svg', '<svg style="width:18px;height:18px"') + ' ' + L(dk ? 'Light mode' : 'Dark mode', dk ? 'Светлая тема' : 'Тёмная тема');
      b.onclick = function () { window.v5toggleTheme(); var m = document.getElementById('sidem'); if (m) m.remove(); };
      var h = p.querySelector('.smh'); p.insertBefore(b, h ? h.nextSibling : p.firstChild);
    }).observe(document.body, {childList: true});
    var main = document.getElementById('main');
    if (main && window.MutationObserver) new MutationObserver(function (ms) {
      var top = ms.some(function (m) { return m.target === main; }); if (!top) return;
      if (fill && ru() !== lang) fill();
      var sm = document.getElementById('smbtn'); if (sm && !sm.querySelector('svg')) { sm.innerHTML = ic('menu'); sm.style.fontSize = ''; }
      main.classList.remove('v5a'); void main.offsetWidth; main.classList.add('v5a');
      hero(main); deco(main);
    }).observe(main, {childList: true});
  }
  // ---------- dashboard hero on the home page (reads the app's own figures – same functions the home page uses)
  function ring(pc, size, cls) { var R = 50, CF = 2 * Math.PI * R, col = pc >= 100 ? 'var(--ok)' : 'var(--amb)';
    return '<div class="v5ring ' + (cls || '') + '" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 120 120" style="width:' + size + 'px;height:' + size + 'px"><circle class="bgc" cx="60" cy="60" r="' + R + '"/><circle class="fgc" data-pc="' + pc + '" cx="60" cy="60" r="' + R + '" style="stroke:' + (cls === 'w' ? '#fff' : col) + '" stroke-dasharray="' + CF.toFixed(1) + '" stroke-dashoffset="' + CF.toFixed(1) + '"/></svg><b>' + pc + '%</b></div>'; }
  function hero(main) {
    var h = location.hash; if (h && h !== '#/' && h !== '#') return;
    if (main.querySelector('.v5hero') || !main.querySelector('.grid')) return;
    try {
      var all = gstat(I), cc = C.filter(function (c) { return cst(c).ok; }).length;
      var r = PU.filter(function (p) { return p.rhi; }), op = r.filter(function (p) { return p.st === 'Open'; });
      var oc = op.filter(function (p) { return !p.int; }), oi = op.filter(function (p) { return p.int; });
      var cat = function (l, k) { return l.filter(function (p) { return String(p.cat) === k; }).length; };
      var ctq = (typeof CTQ !== 'undefined' && typeof ctqOpen === 'function') ? CTQ.filter(ctqOpen).length : null;
      var gs = {}; I.forEach(function (x) { (gs[x.g] = gs[x.g] || []).push(x); });
      var st = function (g) { return gs[g] ? gstat(gs[g]) : null; };
      var pull = st('Cable pulling'), term = st('Cable termination');
      var bars = Object.keys(gs).map(function (g) { var s = gstat(gs[g]); return {g: g, n: s.n, d: s.d, pc: s.pc}; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 8);
      var e = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
      var en = function (s) { return typeof enc === 'function' ? enc(s) : encodeURIComponent(s); };
      var col = function (pc) { return pc >= 100 ? 'ok' : 'amb'; };
      var mini = function (t, s, href) { return s ? '<button class="v5mini" onclick="go(\'' + href + '\')">' + ring(s.pc, 64) + '<div><b>' + t + '</b><span>' + s.d + ' / ' + s.n + ' ' + L('lines', 'строк') + '</span></div></button>' : ''; };
      var closed = r.length - op.length, oA = cat(op, 'A'), oBC = op.length - oA, tot = r.length || 1;
      var pcl = Math.round(100 * closed / tot), pA = Math.round(100 * oA / tot);
      var kpi = function (cls, icn, t, v, sub, href, badge) { return '<button class="v5k ' + cls + '" onclick="go(\'' + href + '\')"><div class="v5kh"><span>' + t + '</span><i>' + ic(icn) + '</i></div><b>' + v + '</b>' + (sub ? '<em>' + sub + '</em>' : '') + (badge ? '<s class="' + badge[0] + '">' + badge[1] + '</s>' : '') + '</button>'; };
      var d = document.createElement('div'); d.className = 'v5hero';
      d.innerHTML = '<div class="v5kpis">'
        + kpi('g', 'activity', L('Overall IWP progress', 'Общий прогресс IWP') + ' · ' + e(typeof PRJ !== 'undefined' ? PRJ : ''), (all.pc || 0) + '%', all.d + ' / ' + all.n + ' ' + L('lines done', 'строк'), '#/in', null)
        + kpi('', 'zap', L('Cables complete', 'Кабели завершены'), cc, L('of', 'из') + ' ' + C.length, '#/p', [cc >= C.length ? 'ok' : 'amb', Math.round(100 * cc / (C.length || 1)) + '%'])
        + kpi('', 'alert', L('Open punch (RHI)', 'Открытые замечания'), op.length, L('client', 'заказчик') + ' ' + oc.length + ' · ' + L('internal', 'внутр.') + ' ' + oi.length, '#/pl', [oA ? 'bad' : 'amb', 'A ' + oA])
        + kpi('', 'tq', L('Open CTQ', 'Открытые CTQ'), ctq == null ? '–' : ctq, L('technical queries', 'тех. запросы'), '#/ctq', null)
        + '</div><div class="v5cards">'
        + '<div class="v5hc"><div class="v5ht m">' + ic('zap') + L('Cable pulling & termination', 'Прокладка и подключение') + '</div><div class="v5minis">' + mini(L('Cable pulling', 'Прокладка'), pull, '#/a/' + en('Cable pulling')) + mini(L('Cable termination', 'Подключение'), term, '#/a/' + en('Cable termination')) + '</div></div>'
        + '<div class="v5hc"><div class="v5ht m">' + ic('alert') + L('Punch status (RHI)', 'Статус замечаний (РХИ)') + '</div><div class="v5don" onclick="go(\'#/pl\')"><div class="v5dn" style="background:conic-gradient(var(--ok) 0 ' + pcl + '%,var(--bad) ' + pcl + '% ' + (pcl + pA) + '%,var(--amb) ' + (pcl + pA) + '% 100%)"><b>' + pcl + '%<small>' + L('closed', 'закрыто') + '</small></b></div>'
        + '<ul><li><i class="v5dot ok"></i>' + L('Closed', 'Закрыто') + '<b>' + closed + '</b></li><li><i class="v5dot bad"></i>' + L('Open cat. A', 'Открыто кат. A') + '<b>' + oA + '</b></li><li><i class="v5dot amb"></i>' + L('Open cat. B / C', 'Открыто кат. B / C') + '<b>' + oBC + '</b></li>'
        + '<li class="v5sub">' + L('Client', 'Заказчик') + ' ' + oc.length + ' (A ' + cat(oc, 'A') + ' · B ' + cat(oc, 'B') + ' · C ' + cat(oc, 'C') + ')<br>' + L('RHI internal', 'Внутр. РХИ') + ' ' + oi.length + ' (A ' + cat(oi, 'A') + ' · B ' + cat(oi, 'B') + ' · C ' + cat(oi, 'C') + ')</li></ul></div></div>'
        + '<div class="v5hc v5wide"><div class="v5ht m">' + ic('chart') + L('Progress by activity – done / total', 'Прогресс по видам работ – выполнено / всего') + '<button class="v5lk" onclick="go(\'#/sy\')">' + L('System progress', 'По системам') + ' ›</button></div><div class="v5bars">'
        + bars.map(function (b) { return '<div class="v5bar" onclick="go(\'#/a/' + en(b.g) + '\')"><span class="v5bt" title="' + e(b.g) + '"><i class="v5dot ' + col(b.pc) + '"></i>' + e(b.g) + '</span><span class="v5bb"><i class="' + col(b.pc) + '" data-w="' + b.pc + '"></i></span><span class="v5bp">' + b.pc + '%<small>' + b.d + '/' + b.n + '</small></span></div>'; }).join('')
        + '</div><div class="v5sc">' + L('Source: IWP status (Site Progress) · data', 'Источник: статус IWP (факт) · данные') + ' ' + e((typeof D !== 'undefined' && D.meta && D.meta.date) || '') + ' · <i class="v5dot ok"></i>' + L('complete', 'завершено') + ' <i class="v5dot amb"></i>' + L('in progress', 'в работе') + ' <i class="v5dot bad"></i>' + L('critical (punch cat. A)', 'критично (кат. A)') + '</div></div></div>';
      var first = main.firstElementChild; main.insertBefore(d, first ? first.nextSibling : null);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        d.querySelectorAll('.fgc').forEach(function (f) { var CF = 2 * Math.PI * 50; f.style.strokeDashoffset = (CF * (1 - Math.min(100, +f.getAttribute('data-pc')) / 100)).toFixed(1); });
        d.querySelectorAll('.v5bb i').forEach(function (i) { i.style.width = Math.min(100, +i.getAttribute('data-w')) + '%'; });
      }); });
    } catch (err) { /* app globals not ready – the normal home page stays as it is */ }
  }
  // ---------- icons instead of emojis (leading emoji of section titles, tile titles and chips only – text stays)
  var EMO = {'📤': 'send', '🚩': 'flag', '🔔': 'bell', '⚠': 'alert', '📌': 'pin', '🏁': 'flagc', '🔌': 'plug', '📊': 'chart', '🎓': 'grad', '🔥': 'flame', '🏗': 'build', '🔒': 'lock', '🚪': 'door', '💡': 'bulb', '🧱': 'layers', '🔍': 'search', '📋': 'check', '📦': 'pkg', '🧵': 'disc', '🏬': 'store', '🧭': 'compass', '🔩': 'wrench', '📑': 'file', '❓': 'help', '📐': 'ruler', '📄': 'file', '🧰': 'wrench', '❗': 'alert', '📘': 'book', '💬': 'msg', '📞': 'phone', '🛠': 'wrench', '📝': 'note', '📈': 'trend', '✍': 'pen', '👤': 'user', '🔑': 'key', '✅': 'checkc', '🏢': 'building', '🌳': 'tree', '⚡': 'zap', '🚒': 'truck', '🌍': 'globe', '❄': 'snow', '🧪': 'flask', '🗓': 'cal', '📂': 'folder', '🔄': 'refresh', '🎛': 'server', '👷': 'user', '🧯': 'flame'};
  var KW = [[/^Panel cable check/i, 'server'], [/^Interconnection/i, 'link'], [/^Installation check/i, 'wrench'], [/^Punch list/i, 'alert'], [/^Cable pulling/i, 'cable'], [/^Cable termination/i, 'plug']];
  var ER = /^\s*([☀-➿⬀-⯿]|[\uD83C-\uDBFF][\uDC00-\uDFFF])[️‍]*\s*/;
  function deco(root) {
    root.querySelectorAll('.sect,.tile > b,.chip,.mgk span').forEach(function (el) {
      if (el.querySelector(':scope > svg.v5e')) return;
      var tn = el.firstChild; while (tn && tn.nodeType === 1 && tn.tagName === 'BR') tn = tn.nextSibling;
      var name = null;
      if (tn && tn.nodeType === 3) { var m = tn.nodeValue.match(ER); if (m) { var k = m[1]; name = EMO[k] || EMO[k.replace(/️/g, '')]; if (name) tn.nodeValue = tn.nodeValue.slice(m[0].length); } }
      if (!name && el.matches('.tile > b')) { var t = el.textContent.trim(); KW.some(function (x) { if (x[0].test(t)) { name = x[1]; return true; } }); }
      if (name) { var w = document.createElement('span'); w.innerHTML = ic(name).replace('<svg', '<svg class="v5e"'); el.insertBefore(w.firstChild, el.firstChild); }
    });
    // status colour of the app's own progress bars (green complete · amber in progress)
    root.querySelectorAll('.pbar > i').forEach(function (i) { var w = parseFloat(i.style.width); if (isNaN(w)) return; i.classList.toggle('s-ok', w >= 100); i.classList.toggle('s-amb', w < 100); });
  }
  window.v5deco = deco;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
