(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Reading works without storage. */ } }
  };
  const chapters = $$('.chapter');
  const tabs = $$('.chapter-tab');
  const ids = chapters.map(chapter => chapter.id);
  const main = $('#study-content');
  const pagination = $('.chapter-pagination');
  const search = $('#guide-search');
  const results = $('#search-results');
  let current = ids[0];
  const saved = storage.get('ai-guide-reviewed-v1', []);
  const reviewed = new Set(Array.isArray(saved) ? saved.filter(id => ids.includes(id)) : []);

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';
    $('#theme-toggle').textContent = isDark ? 'Light mode' : 'Dark mode';
    $('#theme-toggle').setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  const theme = storage.get('ai-guide-theme-v1', null);
  setTheme(['light', 'dark'].includes(theme) ? theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next); storage.set('ai-guide-theme-v1', next);
  });

  function clearSearch() {
    search.value = ''; results.hidden = true; main.hidden = false; pagination.hidden = false;
  }
  function resolveHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return { chapter: chapters[0], target: null }; }
    const target = document.getElementById(id);
    return { chapter: target?.closest('.chapter') || chapters[0], target };
  }
  function showChapter(id, { focus = false, scroll = false, target = null } = {}) {
    if (!ids.includes(id)) id = ids[0];
    clearSearch(); current = id;
    chapters.forEach(chapter => { chapter.hidden = chapter.id !== id; });
    tabs.forEach(tab => {
      const selected = tab.dataset.chapter === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const index = ids.indexOf(id);
    $('#previous-chapter').disabled = index === 0;
    $('#next-chapter').disabled = index === ids.length - 1;
    $('#chapter-count').textContent = `Chapter ${index + 1} / ${ids.length}`;
    const chapter = document.getElementById(id);
    document.title = `${tabs[index].childNodes[1].textContent.trim()} · AI Architecture Study Guide`;
    if (focus) chapter.focus({ preventScroll: true });
    if (scroll) (target || chapter).scrollIntoView({ behavior: 'instant', block: 'start' });
    // Keep the selected item visible within the horizontal mobile tab strip.
    const tab = tabs[index], strip = tab.parentElement;
    if (strip.scrollWidth > strip.clientWidth) {
      const left = tab.offsetLeft - strip.offsetLeft;
      if (left < strip.scrollLeft || left + tab.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = Math.max(0, left - 20);
      }
    }
  }
  function navigate(id, options = {}) {
    const target = document.getElementById(id);
    const chapter = target?.closest('.chapter');
    if (!chapter) return;
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    showChapter(chapter.id, { ...options, target });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => navigate(tab.dataset.chapter));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus(); navigate(tabs[next].dataset.chapter);
    });
  });
  $('#next-chapter').addEventListener('click', () => navigate(ids[ids.indexOf(current) + 1], { focus: true, scroll: true }));
  $('#previous-chapter').addEventListener('click', () => navigate(ids[ids.indexOf(current) - 1], { focus: true, scroll: true }));
  window.addEventListener('hashchange', () => {
    const { chapter, target } = resolveHash(); showChapter(chapter.id, { scroll: true, target });
  });
  window.addEventListener('popstate', () => {
    const { chapter, target } = resolveHash(); showChapter(chapter.id, { target });
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    if (target?.closest('.chapter')) { event.preventDefault(); navigate(target.id, { focus: true, scroll: true }); }
    if (anchor.classList.contains('skip-link')) { event.preventDefault(); navigate(current, { focus: true, scroll: true }); }
  });

  function updateProgress() {
    $('#progress').value = reviewed.size;
    $('#progress-label').textContent = `${reviewed.size} of ${ids.length} chapters reviewed`;
    $$('[data-complete]').forEach(button => {
      const done = reviewed.has(button.dataset.complete);
      button.setAttribute('aria-pressed', String(done));
      button.textContent = done ? '✓ Reviewed — mark unread' : 'Mark chapter reviewed';
    });
    tabs.forEach(tab => {
      const done = reviewed.has(tab.dataset.chapter);
      tab.classList.toggle('is-complete', done);
      tab.setAttribute('aria-label', `${tab.querySelector('span').textContent} ${tab.childNodes[1].textContent.trim()}${done ? ', reviewed' : ''}`);
    });
  }
  $$('[data-complete]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.complete;
    reviewed.has(id) ? reviewed.delete(id) : reviewed.add(id);
    storage.set('ai-guide-reviewed-v1', [...reviewed]); updateProgress();
  }));
  updateProgress();

  function searchText(element) {
    const copy = element.cloneNode(true);
    copy.querySelectorAll('p, td, th, h3, legend, li, button, .eyebrow').forEach(node => node.append(document.createTextNode(' ')));
    return copy.textContent.replace(/\s+/g, ' ').trim();
  }
  const searchIndex = chapters.flatMap(chapter => $$('.topic, .quiz', chapter).map(section => ({
    chapter: chapter.id,
    chapterName: $(`#tab-${chapter.id}`).textContent.trim().replace(/^\d+/, '').trim(),
    id: section.id || chapter.id,
    title: $('h3, legend', section) ? searchText($('h3, legend', section)) : 'Knowledge check',
    text: searchText(section)
  })));
  function highlight(text, query) {
    const fragment = document.createDocumentFragment();
    const lower = text.toLowerCase(); let start = 0, match;
    while ((match = lower.indexOf(query, start)) >= 0) {
      fragment.append(document.createTextNode(text.slice(start, match)));
      const mark = document.createElement('mark'); mark.textContent = text.slice(match, match + query.length);
      fragment.append(mark); start = match + query.length;
    }
    fragment.append(document.createTextNode(text.slice(start))); return fragment;
  }
  function runSearch() {
    const query = search.value.trim().toLowerCase();
    if (!query) { clearSearch(); return; }
    results.hidden = false; main.hidden = true; pagination.hidden = true;
    const matches = searchIndex.filter(item => item.text.toLowerCase().includes(query));
    $('#search-summary').textContent = `${matches.length} matching section${matches.length === 1 ? '' : 's'} for “${search.value.trim()}”`;
    const list = $('#search-list'); list.replaceChildren();
    if (!matches.length) {
      const p = document.createElement('p'); p.className = 'no-results';
      p.textContent = 'No matches yet. Try a shorter term such as “attention”, “latent”, or “cache”.'; list.append(p);
    }
    matches.forEach(item => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'search-result';
      const label = document.createElement('span'); label.className = 'eyebrow'; label.textContent = item.chapterName;
      const title = document.createElement('strong'); title.append(highlight(item.title, query));
      const at = item.text.toLowerCase().indexOf(query); const start = Math.max(0, at - 65);
      const snippet = (start ? '…' : '') + item.text.slice(start, start + 225) + (start + 225 < item.text.length ? '…' : '');
      const body = document.createElement('p'); body.append(highlight(snippet, query));
      button.append(label, title, body);
      button.addEventListener('click', () => {
        const target = document.getElementById(item.id);
        if (target) $$('details', target).forEach(detail => { detail.open = true; });
        navigate(item.id, { focus: true, scroll: true });
      }); list.append(button);
    });
  }
  search.addEventListener('input', runSearch);
  $('#close-search').addEventListener('click', () => { clearSearch(); document.getElementById(current).focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault(); search.focus();
    }
    if (event.key === 'Escape' && !results.hidden) { clearSearch(); search.focus(); }
  });

  $$('.quiz').forEach(quiz => {
    const answer = Number(quiz.dataset.answer);
    $$('.answers button', quiz).forEach(button => button.addEventListener('click', () => {
      $$('.answers button', quiz).forEach(option => option.classList.remove('correct', 'incorrect'));
      const correct = Number(button.dataset.choice) === answer;
      button.classList.add(correct ? 'correct' : 'incorrect');
      const explanation = $('.answer-key p', quiz).textContent;
      $('.feedback', quiz).textContent = correct ? `Correct. ${explanation}` : 'Not quite. Try another answer, or reveal the explanation below.';
    }));
  });

  function softmax(scores) {
    const max = Math.max(...scores), exps = scores.map(value => Math.exp(value - max));
    const sum = exps.reduce((a, b) => a + b, 0); return exps.map(value => value / sum);
  }
  const scoreNames = ['animal', 'street', 'because'];
  function updateAttention() {
    const scores = scoreNames.map(name => Number($(`#score-${name}`).value));
    const weights = softmax(scores); const values = [[10, 0], [0, 6], [1, 1]];
    const output = [0, 1].map(i => weights.reduce((sum, w, j) => sum + w * values[j][i], 0));
    const bars = $('#attention-bars'); bars.replaceChildren();
    scoreNames.forEach((name, i) => {
      $(`#score-${name}-value`).textContent = scores[i].toFixed(1);
      const row = document.createElement('div'); row.className = 'bar-row';
      const label = document.createElement('span'); label.textContent = name;
      const track = document.createElement('div'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = `${weights[i] * 100}%`;
      track.append(fill);
      const percentage = document.createElement('span'); percentage.className = 'bar-value'; percentage.textContent = `${(weights[i] * 100).toFixed(1)}%`;
      row.append(label, track, percentage); bars.append(row);
    });
    $('#attention-result').textContent = weights.map((w, i) => `${w.toFixed(3)} × [${values[i].join(', ')}]`).join(' + ') + ` ≈ [${output.map(v => v.toFixed(3)).join(', ')}]`;
  }
  scoreNames.forEach(name => $(`#score-${name}`).addEventListener('input', updateAttention));
  $('#attention-reset').addEventListener('click', () => { scoreNames.forEach((name, i) => { $(`#score-${name}`).value = 2 - i; }); updateAttention(); });
  updateAttention();
  function updateVae() {
    const names = ['mu', 'sigma', 'epsilon']; const values = names.map(name => Number($(`#vae-${name}`).value));
    names.forEach((name, i) => { $(`#vae-${name}-value`).textContent = values[i].toFixed(1); });
    const [mu, sigma, epsilon] = values;
    $('#vae-result').textContent = `z = ${mu.toFixed(1)} + ${sigma.toFixed(1)} × (${epsilon.toFixed(1)}) = ${(mu + sigma * epsilon).toFixed(2)}`;
  }
  ['mu', 'sigma', 'epsilon'].forEach(name => $(`#vae-${name}`).addEventListener('input', updateVae)); updateVae();
  function setActMode(mode) {
    $('#act-train').hidden = mode !== 'train'; $('#act-infer').hidden = mode !== 'infer';
    $$('[data-act-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.actMode === mode)));
  }
  $$('[data-act-mode]').forEach(button => button.addEventListener('click', () => setActMode(button.dataset.actMode)));
  setActMode('train');
  let printDetails = [];
  window.addEventListener('beforeprint', () => {
    printDetails = $$('details').map(detail => [detail, detail.open]);
    printDetails.forEach(([detail]) => { detail.open = true; });
  });
  window.addEventListener('afterprint', () => { printDetails.forEach(([detail, open]) => { detail.open = open; }); });
  $('#print-guide').addEventListener('click', () => window.print());
  const initial = resolveHash(); showChapter(initial.chapter.id);
  if (initial.target?.closest('.chapter')) requestAnimationFrame(() => initial.target.scrollIntoView({ behavior: 'instant' }));
})();
