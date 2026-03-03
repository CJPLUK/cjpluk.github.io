/**
 * Site navigation – single source of truth from data/site-nav.json.
 * Include this script on every page that has <nav class="site-nav" aria-label="Primary">.
 */
(function () {
  var pathname = typeof location !== 'undefined' && location.pathname ? location.pathname : '';
  var base = '';
  if (pathname.indexOf('/learn/') !== -1 || pathname.indexOf('/pages/') !== -1) {
    base = '../';
  }

  var navEl = document.querySelector('nav.site-nav[aria-label="Primary"]');
  if (!navEl) return;

  var url = base + 'data/site-nav.json';
  fetch(url)
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('nav fetch failed')); })
    .then(function (data) {
      if (!data || !Array.isArray(data.items)) return;
      navEl.innerHTML = data.items
        .map(function (item) {
          var h = item.href || '';
          var href = (h.indexOf('http://') === 0 || h.indexOf('https://') === 0) ? h : (base + h);
          var safeHref = (href || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          return '<a href="' + safeHref + '" class="nav-link">' + escapeHtml(item.label) + '</a>';
        })
        .join('');
    })
    .catch(function () {
      /* keep existing nav on error */
    });

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
})();
