(() => {
  'use strict';
  const preferenceKey = 'pyrolysis-statistics-disabled';
  let disabled = false;
  let loaded = false;
  try { disabled = localStorage.getItem(preferenceKey) === '1'; } catch { /* Statistics work without preference storage. */ }
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va('beforeSend', (event) => {
    if (disabled) return null;
    const url = new URL(event.url, location.origin);
    url.search = '';
    url.hash = '';
    return { ...event, url: url.href };
  });
  function load() {
    if (disabled || loaded) return;
    loaded = true;
    const script = document.createElement('script');
    script.src = '/_vercel/insights/script.js';
    script.defer = true;
    document.head.append(script);
  }
  function updateControls() {
    const status = document.getElementById('statistics-status');
    if (!status) return;
    status.textContent = disabled ? 'Optional visit statistics are off in this browser.' : 'Optional visit statistics are on in this browser.';
    document.getElementById('disable-statistics').hidden = disabled;
    document.getElementById('enable-statistics').hidden = !disabled;
  }
  function choose(value) {
    disabled = value;
    try { localStorage.setItem(preferenceKey, value ? '1' : '0'); } catch { /* The choice still applies to this page. */ }
    updateControls();
    load();
    document.getElementById(disabled ? 'enable-statistics' : 'disable-statistics')?.focus({ preventScroll: true });
  }
  document.getElementById('disable-statistics')?.addEventListener('click', () => choose(true));
  document.getElementById('enable-statistics')?.addEventListener('click', () => choose(false));
  window.addEventListener('storage', (event) => {
    if (event.key !== preferenceKey && event.key !== null) return;
    disabled = event.newValue === '1';
    updateControls();
    load();
  });
  updateControls();
  load();
})();
