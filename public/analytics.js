(() => {
  'use strict';
  const preferenceKey = 'pyrolysis-statistics-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  let loaded = false;
  let ready = false;
  let pageviewSent = false;
  function parse(value) {
    try {
      const entry = JSON.parse(value);
      const age = Date.now() - entry.at;
      return ['allow', 'deny'].includes(entry.choice) && Number.isFinite(entry.at) && age >= 0 && age < lifetime ? entry : null;
    } catch { return null; }
  }
  let consent = null;
  try { consent = parse(localStorage.getItem(preferenceKey)); } catch { /* Stay off when storage is unavailable. */ }
  const allowed = () => consent?.choice === 'allow' && Date.now() - consent.at < lifetime;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va('beforeSend', (event) => {
    if (!allowed()) return null;
    const url = new URL(event.url, location.origin);
    url.search = '';
    url.hash = '';
    return { ...event, url: url.href };
  });
  function pageview() {
    if (!allowed() || !ready || pageviewSent) return;
    pageviewSent = true;
    window.va('pageview', { path: location.pathname });
  }
  function load() {
    if (!allowed()) return;
    if (loaded) { pageview(); return; }
    loaded = true;
    const script = document.createElement('script');
    script.src = '/_vercel/insights/script.js';
    script.defer = true;
    // Our consent-checked call sends the page view; no automatic navigation tracking.
    script.dataset.disableAutoTrack = 'true';
    script.onload = () => { ready = true; pageview(); };
    script.onerror = () => { loaded = false; script.remove(); };
    document.head.append(script);
  }
  function updateControls() {
    const on = allowed();
    const prompt = document.getElementById('statistics-choice');
    if (prompt) prompt.hidden = consent !== null;
    const status = document.getElementById('statistics-status');
    if (status) status.textContent = on ? 'Optional visit statistics are on in this browser.' : 'Optional visit statistics are off in this browser.';
    const disable = document.getElementById('disable-statistics');
    const enable = document.getElementById('enable-statistics');
    if (disable) disable.hidden = !on;
    if (enable) enable.hidden = on;
  }
  function choose(choice) {
    consent = { choice, at: Date.now() };
    try { localStorage.setItem(preferenceKey, JSON.stringify(consent)); } catch { /* Apply to this page only. */ }
    updateControls();
    load();
    const focus = document.getElementById('statistics-status')
      ? document.getElementById(allowed() ? 'disable-statistics' : 'enable-statistics')
      : document.getElementById('hero-title');
    focus?.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-statistics-choice]').forEach((button) => {
    button.addEventListener('click', () => choose(button.dataset.statisticsChoice));
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== preferenceKey && event.key !== null) return;
    consent = parse(event.key === null ? null : event.newValue);
    updateControls();
    load();
  });
  updateControls();
  load();
})();
