import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/analytics.js', import.meta.url), 'utf8');
const key = 'pyrolysis-statistics-consent-v1';
const lifetime = 180 * 24 * 60 * 60 * 1000;
function browser(seed = {}, unavailable = false) {
  let now = 1792240000000;
  const storage = new Map(Object.entries(seed));
  const scripts = [], requests = [], events = {};
  const elements = new Map();
  for (const id of ['statistics-choice', 'statistics-status', 'enable-statistics', 'disable-statistics', 'hero-title']) {
    elements.set(id, { hidden: true, focus() {} });
  }
  const buttons = ['allow', 'deny'].map(choice => ({ dataset: { statisticsChoice: choice }, addEventListener(_, fn) { this.click = fn; } }));
  const context = {
    Date: class extends Date { static now() { return now; } }, URL,
    location: { origin: 'https://example.test', pathname: '/', href: 'https://example.test/?private=value#section' },
    localStorage: { getItem(k) { if (unavailable) throw Error('blocked'); return storage.get(k) ?? null; }, setItem(k, v) { if (unavailable) throw Error('blocked'); storage.set(k, v); } },
    document: { getElementById: id => elements.get(id), querySelectorAll: () => buttons, createElement: () => ({ dataset: {}, remove() {} }), head: { append: script => scripts.push(script) } },
    addEventListener(type, fn) { events[type] = fn; },
  };
  context.window = context;
  vm.runInNewContext(source, context);
  const filter = context.vaq[0][1];
  return {
    scripts, requests, storage, elements, filter, context,
    choose(choice) { buttons[choice === 'allow' ? 0 : 1].click(); },
    change(value) { events.storage({ key, newValue: value }); },
    expire() { now += lifetime; },
    finishLoading() {
      context.va = (type) => { if (type === 'pageview') { const event = filter({ url: context.location.href }); if (event) requests.push(event); } };
      scripts.at(-1).onload();
    },
  };
}

test('fresh visits and legacy automatic-on settings never load analytics', () => {
  for (const seed of [{}, { 'pyrolysis-statistics-disabled': '0' }]) {
    const b = browser(seed);
    assert.equal(b.scripts.length, 0);
    assert.equal(b.elements.get('statistics-choice').hidden, false);
    assert.equal(b.filter({ url: 'https://example.test/' }), null);
  }
});

test('No thanks persists a refusal and keeps analytics unloaded on the next page', () => {
  const b = browser(); b.choose('deny');
  assert.equal(b.scripts.length, 0);
  const next = browser(Object.fromEntries(b.storage));
  assert.equal(next.scripts.length, 0);
  assert.equal(next.elements.get('statistics-choice').hidden, true);
});

test('explicit permission loads the SDK without automatic tracking and sends one redacted view', () => {
  const b = browser(); b.choose('allow');
  assert.equal(b.scripts.length, 1);
  assert.equal(b.scripts[0].dataset.disableAutoTrack, 'true');
  assert.equal(b.requests.length, 0);
  b.finishLoading(); b.choose('allow');
  assert.equal(b.requests.length, 1);
  assert.equal(b.requests[0].url, 'https://example.test/');
  assert.equal(browser(Object.fromEntries(b.storage)).scripts.length, 1);
});

test('withdrawal blocks future events without reloading the page or loading another SDK', () => {
  const b = browser(); b.choose('allow'); b.finishLoading(); b.choose('deny');
  assert.equal(b.filter({ url: 'https://example.test/' }), null);
  assert.equal(b.scripts.length, 1);
  assert.equal(b.requests.length, 1);
  assert.equal(b.elements.get('disable-statistics').hidden, true);
});

test('a cross-tab withdrawal during SDK download prevents the pending view', () => {
  const b = browser(); b.choose('allow');
  b.change(JSON.stringify({ choice: 'deny', at: 1792240000000 }));
  b.finishLoading();
  assert.equal(b.requests.length, 0);
  assert.equal(b.filter({ url: 'https://example.test/' }), null);
});

test('invalid, expired and future-dated records cannot enable statistics', () => {
  for (const value of ['broken', 'null', JSON.stringify({ choice: 'allow', at: 1792240000000 - lifetime }), JSON.stringify({ choice: 'allow', at: 1792240000001 })]) {
    assert.equal(browser({ [key]: value }).scripts.length, 0);
  }
  const b = browser(); b.choose('allow'); b.expire();
  assert.equal(b.filter({ url: 'https://example.test/' }), null);
});

test('blocked preference storage stays off until an explicit choice in the current page', () => {
  const b = browser({}, true);
  assert.equal(b.scripts.length, 0);
  b.choose('allow'); b.finishLoading();
  assert.equal(b.requests.length, 1);
});
