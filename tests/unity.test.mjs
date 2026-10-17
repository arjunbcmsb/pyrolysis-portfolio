import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const demo = fileURLToPath(new URL('../public/demo/', import.meta.url));
const wrapper = readFileSync(path.join(demo, 'player.js'), 'utf8');
const message = 'The interactive demo could not load. Please refresh the page or try a recent desktop browser.';
const origin = 'https://pyrolysis.example';
const originalHashes = {
  'Build/Web_pyrolysis.data.unityweb': '1407338cea2abfb6e313f992a97f138233199843cff85b6235ab237242969474',
  'Build/Web_pyrolysis.framework.js.unityweb': 'b4f00801fff2ee7a0b7d5e9097c9232763396312c4e469f5a21bac3bc24f8c67',
  'Build/Web_pyrolysis.loader.js': '2e8ad1e55902c6b9e1ce403622790612d21ae95e949113fa3c762893b8a82a55',
  'Build/Web_pyrolysis.wasm.unityweb': '401f8d9f41a25ba873ee446c1473614942f650b5ec894d24cca47f238de22eaf',
  'StreamingAssets/UnityServicesProjectConfiguration.json': 'de0295addf494732f26d2e86b9c24ae62c45c553e63d0674183f7ccf543d3d12',
};

function harness() {
  const elements = new Map();
  const events = [];
  const listeners = {};
  let script;
  let config;
  let progress;
  let resolve;
  let reject;
  let fullscreen = 0;
  const instance = { SetFullscreen(value) { fullscreen += value; } };
  const parent = { postMessage(data, target) { events.push({ data: JSON.parse(JSON.stringify(data)), target }); } };
  const window = {
    parent,
    location: { origin },
    addEventListener(name, handler) { listeners[name] = handler; },
    createUnityInstance(canvas, settings, callback) {
      assert.equal(canvas, elements.get('unity-canvas'));
      config = settings;
      progress = callback;
      return new Promise((yes, no) => { resolve = yes; reject = no; });
    },
  };
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { dataset: {}, hidden: false, value: 0, textContent: '' });
      return elements.get(id);
    },
    createElement(tag) { assert.equal(tag, 'script'); return {}; },
    body: { appendChild(element) { script = element; } },
  };
  vm.runInNewContext(wrapper, { window, document }, { filename: 'player.js' });
  return {
    window, elements, events, parent, instance,
    get script() { return script; },
    get config() { return config; },
    get fullscreen() { return fullscreen; },
    progress(value) { progress(value); },
    resolve() { resolve(instance); },
    reject(reason) { reject(reason); },
    command(data, overrides = {}) { listeners.message({ source: parent, origin, data, ...overrides }); },
  };
}

const settle = () => new Promise(setImmediate);

test('copied runtime and asset bytes match the supplied export', () => {
  for (const [file, expected] of Object.entries(originalHashes)) {
    const actual = createHash('sha256').update(readFileSync(path.join(demo, file))).digest('hex');
    assert.equal(actual, expected, file);
    // Set UNITY_SOURCE_DIR to additionally verify that the supplied export is untouched.
    if (process.env.UNITY_SOURCE_DIR) {
      const source = createHash('sha256').update(readFileSync(path.join(process.env.UNITY_SOURCE_DIR, file))).digest('hex');
      assert.equal(source, expected, `original ${file}`);
    }
  }
});

test('reports genuine loader progress but waits for instance resolution before ready', async () => {
  const h = harness();
  assert.equal(h.script.src, 'Build/Web_pyrolysis.loader.js');
  h.script.onload();
  assert.equal(h.config.dataUrl, 'Build/Web_pyrolysis.data.unityweb');
  assert.equal(h.config.codeUrl, 'Build/Web_pyrolysis.wasm.unityweb');
  assert.equal(h.config.frameworkUrl, 'Build/Web_pyrolysis.framework.js.unityweb');
  assert.equal(h.config.streamingAssetsUrl, 'StreamingAssets');
  for (const value of [0.25, NaN, Infinity, '0.5', -1, 2]) h.progress(value);
  assert.deepEqual(h.events.map(event => event.data.progress), [0, 0.25, 0, 1]);
  assert.ok(h.events.every(event => event.target === origin && event.data.channel === 'pyrolysis-unity'));
  assert.ok(h.events.every(event => event.data.type !== 'ready'));
  h.resolve();
  await settle();
  assert.deepEqual(h.events.at(-1).data, { channel: 'pyrolysis-unity', type: 'ready' });
  assert.equal(h.elements.get('unity-status').hidden, true);
  assert.equal(h.elements.get('unity-container').dataset.state, 'ready');
  const count = h.events.length;
  h.progress(0.4);
  assert.equal(h.events.length, count);
});

test('load rejection presents a fixed friendly error, never raw exception content', async () => {
  const h = harness();
  h.script.onload();
  h.reject('<img src=x onerror=alert(1)> secret diagnostic');
  await settle();
  assert.deepEqual(h.events.at(-1).data, { channel: 'pyrolysis-unity', type: 'error', message });
  assert.equal(h.elements.get('unity-status-text').textContent, message);
  assert.equal(h.elements.get('unity-progress').hidden, true);
  assert.ok(!JSON.stringify(h.events).includes('secret diagnostic'));
});

test('fatal loader callbacks are idempotent and cannot later report ready', async () => {
  const h = harness();
  h.script.onload();
  h.config.showBanner('nonfatal detail', 'warning');
  assert.equal(h.events.length, 1);
  assert.equal(h.config.errorHandler('private exception detail'), true);
  h.script.onerror();
  h.config.showBanner('untrusted error text', 'error');
  h.progress(0.8);
  h.resolve();
  await settle();
  assert.equal(h.events.filter(event => event.data.type === 'error').length, 1);
  assert.equal(h.events.filter(event => event.data.type === 'ready').length, 0);
});

test('fullscreen commands require the exact parent, origin, channel and readiness', async () => {
  const h = harness();
  const request = { channel: 'pyrolysis-host', type: 'fullscreen' };
  h.command(request);
  assert.equal(h.fullscreen, 0);
  h.script.onload();
  h.resolve();
  await settle();
  h.command(request, { origin: 'https://untrusted.example' });
  h.command(request, { source: {} });
  h.command({ channel: 'other', type: 'fullscreen' });
  h.command({ channel: 'pyrolysis-host', type: 'other' });
  h.command(null);
  assert.equal(h.fullscreen, 0);
  h.command(request);
  assert.equal(h.fullscreen, 1);
});

test('missing or synchronously failing runtime produces the same friendly error', () => {
  for (const implementation of [undefined, () => { throw new Error('private failure'); }]) {
    const h = harness();
    h.window.createUnityInstance = implementation;
    h.script.onload();
    assert.deepEqual(h.events.at(-1).data, { channel: 'pyrolysis-unity', type: 'error', message });
  }
});
