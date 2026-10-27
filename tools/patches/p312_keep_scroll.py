# v3.12: keep the scroll position when a tick re-draws the same page
p = 'app.js'; s = open(p, encoding='utf-8').read()
if 'KEEP_SCROLL_V312' not in s:
    s = s.replace("const APPV = '3.11';", "const APPV = '3.12';")
    s += """
// KEEP_SCROLL_V312: same page re-drawn (tick / save) -> stay where you were; new page -> top
var LASTH = location.hash;
window.addEventListener('hashchange', function () { LASTH = location.hash; });
var _route0 = route;
route = function () {
  var same = location.hash === LASTH, y = window.scrollY;
  LASTH = location.hash;
  var r = _route0.apply(this, arguments);
  if (same && y) { window.scrollTo(0, y); requestAnimationFrame(function () { window.scrollTo(0, y); }); }
  return r;
};
"""
    open(p, 'w', encoding='utf-8').write(s)
print('v3.12 keep-scroll patch done')
