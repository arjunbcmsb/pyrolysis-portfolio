(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va('beforeSend', (event) => {
    const cleanUrl = new URL(event.url, location.origin);
    cleanUrl.search = '';
    cleanUrl.hash = '';
    return { ...event, url: cleanUrl.href };
  });
  const analyticsScript = document.createElement('script');
  analyticsScript.src = '/_vercel/insights/script.js';
  analyticsScript.defer = true;
  document.head.append(analyticsScript);
  const stage = $('player-stage');
  const cover = $('player-cover');
  const launch = $('launch-button');
  const retry = $('retry-button');
  const status = $('load-status');
  const progress = $('load-progress');
  const fullscreen = $('fullscreen-button');
  const overviewProgress = $('overview-progress');
  const overviewStatus = $('overview-load-text');
  const pageStatus = $('page-load-status');
  let frame;
  let state = 'idle';
  let watchdog;

  function failPlayer() {
    if (state === 'error') return;
    state = 'error';
    clearTimeout(watchdog);
    cover.hidden = false;
    if (frame) { frame.inert = true; frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1; }
    status.textContent = 'Simulation could not load. Retry or view the 3D models above.';
    overviewStatus.textContent = 'Simulation unavailable. Retry below.';
    pageStatus.textContent = 'Try a recent desktop browser, or view the models above.';
    overviewProgress.hidden = true;
    launch.disabled = true;
    launch.textContent = 'Simulation unavailable';
    progress.hidden = true;
    retry.hidden = false;
    fullscreen.disabled = true;
    $('player-help').hidden = false;
    $('player-help').textContent = 'Try a recent desktop browser for the best chance of running the simulation.';
  }

  function preparePlayer() {
    if (state === 'loading' || state === 'ready' || state === 'playing') return;
    state = 'loading';
    clearTimeout(watchdog);
    frame?.remove();
    cover.hidden = false;
    retry.hidden = true;
    progress.hidden = false;
    progress.value = 0;
    status.textContent = 'Loading simulation: 0%';
    overviewStatus.textContent = 'Loading simulation: 0%';
    pageStatus.textContent = 'Loading simulation: 0%';
    overviewProgress.hidden = false;
    overviewProgress.value = 0;
    $('hero-load').classList.remove('ready');
    launch.disabled = true;
    launch.textContent = 'Loading simulation';
    frame = document.createElement('iframe');
    frame.title = 'Pyrolysis of Plastics, interactive Unity simulation';
    frame.src = '/demo/';
    frame.allow = 'fullscreen';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.inert = true;
    // A nonzero iframe stays rendered behind the cover, so Unity can initialise.
    stage.prepend(frame);
    watchdog = setTimeout(failPlayer, 180_000);
  }

  window.addEventListener('message', (event) => {
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || data.channel !== 'pyrolysis-unity') return;
    if (data.type === 'progress' && state === 'loading' && Number.isFinite(data.progress)) {
      progress.value = Math.max(0, Math.min(1, data.progress));
      overviewProgress.value = progress.value;
      const loadingText = `Loading simulation: ${Math.round(progress.value * 100)}%`;
      status.textContent = loadingText;
      overviewStatus.textContent = loadingText;
      pageStatus.textContent = loadingText;
    } else if (data.type === 'ready' && state === 'loading') {
      clearTimeout(watchdog);
      state = 'ready';
      progress.value = 1;
      overviewProgress.value = 1;
      $('hero-load').classList.add('ready');
      status.textContent = '';
      progress.hidden = true;
      overviewStatus.textContent = '';
      pageStatus.textContent = '';
      launch.disabled = false;
      launch.textContent = 'Launch simulation';
    } else if (data.type === 'error') failPlayer();
  });

  launch.addEventListener('click', () => {
    if (state === 'idle') { preparePlayer(); return; }
    if (state !== 'ready') return;
    state = 'playing';
    cover.hidden = true;
    frame.inert = false;
    frame.removeAttribute('aria-hidden');
    frame.tabIndex = 0;
    frame.focus();
    fullscreen.disabled = !document.fullscreenEnabled;
    $('player-help').textContent = '';
  });
  retry.addEventListener('click', preparePlayer);
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('player-shell').requestFullscreen();
    } catch { $('player-help').hidden = false; $('player-help').textContent = 'Fullscreen is unavailable in this browser. You can still use the embedded player.'; }
  });
  document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'; });
  // Give the introduction its first paint before downloading Unity.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (navigator.connection?.saveData) {
      status.textContent = 'Data saver is on. Select Load simulation to download 24 MB.';
      overviewStatus.textContent = 'Data saver on. Load the simulation below.';
      pageStatus.textContent = 'Download starts when you select Load simulation.';
      overviewProgress.hidden = true;
      launch.disabled = false;
      launch.textContent = 'Load simulation';
      progress.hidden = true;
    } else if ('requestIdleCallback' in window) requestIdleCallback(preparePlayer, { timeout: 1000 });
    else setTimeout(preparePlayer, 350);
  }));

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const section = document.querySelector(link.hash);
      const title = section?.querySelector('h2');
      if (!title) return;
      event.preventDefault();
      window.history.replaceState(null, '', link.hash);
      window.scrollTo({ top: window.scrollY + title.getBoundingClientRect().top - 12, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  });

  const topButton = $('back-to-top');
  const updateTopButton = () => { topButton.hidden = window.scrollY < 380; };
  window.addEventListener('scroll', updateTopButton, { passive: true });
  updateTopButton();
  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.querySelector('.wordmark').focus({ preventScroll: true });
  });

  const dialog = $('chat-dialog');
  const input = $('chat-question');
  const log = $('chat-log');
  const chatStatus = $('chat-status');
  const send = $('chat-send');
  const thinking = $('chat-thinking');
  let busy = false;
  let opener;
  const history = [];
  function openChat(button) {
    opener = button;
    if (!dialog.open) dialog.showModal();
    input.focus();
  }
  document.querySelectorAll('[data-open-chat]').forEach((button) => button.addEventListener('click', () => openChat(button)));
  $('dismiss-suggestions').addEventListener('click', () => { $('question-bubbles').hidden = true; document.querySelector('[data-open-chat]').focus(); });
  $('close-chat').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  input.addEventListener('input', () => { $('question-count').textContent = `${input.value.length} / 600`; });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('chat-form').requestSubmit(); }
  });
  function addMessage(text, role, source = '') {
    const message = document.createElement('div');
    message.className = `chat-message ${role}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(paragraph);
    if (source) { const label = document.createElement('span'); label.className = 'message-source'; label.textContent = source; message.append(label); }
    log.append(message);
    while (log.children.length > 21) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function offlineAnswer(question) {
    if (/ignore|override|system prompt|api key|football|recipe|poem|politics/i.test(question)) return 'I can answer questions about this project, the website and pyrolysis.';
    if (/renewable|environment|climate|sustainab/i.test(question)) return 'Pyrolysis can recover materials and fuel from some waste plastics. Fuel from fossil-based plastics is not renewable energy. The environmental benefit depends on the feedstock, energy use and treatment of products and emissions.';
    if (/nitrogen|oxygen|purge/i.test(question)) return 'Nitrogen pushes air out of the reactor, helping create the oxygen-free environment used for pyrolysis. The yellow gas in the animation is a visual cue.';
    if (/arjun|build|built|product management|mvp|roadmap/i.test(question)) return 'Arjun Chandra defined the product roadmap, prioritised the MVP backlog and led delivery. He built the Unity application, including its Blender models and C# interactions, then developed this website and its AI-powered chat assistant.';
    if (/produc\w*|output|hydrocarbon|oil|wax|char|gas/i.test(question)) return 'Plastic pyrolysis produces gases, oil or wax, and solid residues. The oil and gas can be processed into chemical feedstocks or used as fuels. The mix of products depends on the type of plastic and the process conditions.';
    if (/500|temperature|heat/i.test(question)) return 'This project depicts heating to 500°C. Heat breaks long plastic molecules into smaller ones. The setting is illustrative; real process conditions depend on the material and reactor.';
    return 'Live AI is unavailable. Prepared FAQs cover nitrogen, the illustrated 500°C, resource recovery and Arjun’s contribution. The overview and 3D models are also available on this page.';
  }
  async function ask(question) {
    if (busy || !question.trim() || question.length > 600) return;
    busy = true;
    send.disabled = true;
    document.querySelectorAll('[data-question], [data-quick-question]').forEach((button) => { button.disabled = true; });
    addMessage(question, 'user');
    input.value = '';
    $('question-count').textContent = '0 / 600';
    thinking.hidden = false;
    log.setAttribute('aria-busy', 'true');
    chatStatus.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40_000);
    let answer, source, mode, reason;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: history.slice(-6) }), signal: controller.signal,
      });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (typeof data.answer !== 'string' || data.answer.length > 1500 || !['live', 'faq', 'refused'].includes(data.mode)) throw new Error('Invalid answer');
      answer = data.answer; mode = data.mode; reason = data.reason;
      source = mode === 'live' ? 'AI answer · Project notes' : mode === 'faq' ? (data.source === 'Prepared project answer' ? 'Prepared project answer' : 'Prepared FAQ · Live AI unavailable') : 'Project topic guide';
    } catch {
      answer = offlineAnswer(question); source = 'Prepared FAQ · Live AI unavailable'; mode = 'faq';
    } finally { clearTimeout(timeout); }
    thinking.hidden = true;
    log.setAttribute('aria-busy', 'false');
    addMessage(answer, 'assistant', source);
    if (mode !== 'refused') {
      history.push({ role: 'user', content: question }, { role: 'assistant', content: answer.slice(0, 1100) });
      if (history.length > 6) history.splice(0, history.length - 6);
    }
    chatStatus.textContent = reason === 'visitor-daily-limit' ? 'Daily AI limit reached. Showing a prepared answer.' : mode === 'faq' ? 'Showing a prepared project FAQ.' : '';
    busy = false; send.disabled = false;
    document.querySelectorAll('[data-question], [data-quick-question]').forEach((button) => { button.disabled = false; });
    if (dialog.open) input.focus();
  }
  $('chat-form').addEventListener('submit', (event) => { event.preventDefault(); void ask(input.value.trim()); });
  document.querySelectorAll('[data-question]').forEach((button) => button.addEventListener('click', () => { void ask(button.dataset.question); }));
  document.querySelectorAll('[data-quick-question]').forEach((button) => button.addEventListener('click', () => { openChat(button); void ask(button.dataset.quickQuestion); }));
})();
