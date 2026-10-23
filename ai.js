/* LDB Lab: "Ask AI" tutor bubble. A small open model (Qwen3) runs privately in the visitor's browser via WebLLM (WebGPU).
   No server, no API key: nothing typed leaves the device. Context = the module or tool on screen.
   Shares the browser's model cache with LDB Finance (same origin), so one download serves both sites. */
(function () {
  'use strict';
  if (window.__ldbai) return; window.__ldbai = 1;
  var WLURL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/lib/index.js';
  var MODELS = [['Qwen3-1.7B-q4f16_1-MLC', 'Qwen3 1.7B', 'about 1.1 GB', 'Better answers'], ['Qwen3-0.6B-q4f16_1-MLC', 'Qwen3 0.6B', 'about 0.5 GB', 'Faster, for phones']];
  var LS = 'ldbai.model', SS = 'ldbai.lab.chat';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  // pages that run their own models: never start the tutor automatically there, so two models never compete for memory
  var HEAVY = { models: 1, retrieval: 1, arena: 1, bench: 1 };
  var GAMES = { daytrader: 1, landlord: 1, trader: 1, betting: 1, montecarlo: 1 };
  var S = { eng: null, model: null, loading: null, busy: null, msgs: [] };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function sget() { try { return JSON.parse(sessionStorage.getItem(SS) || '[]'); } catch (e) { return []; } }
  function sset() { try { sessionStorage.setItem(SS, JSON.stringify(S.msgs.slice(-16))); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(s) {
    var h = esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
    return h.split(/\n{2,}/).map(function (p) {
      var ls = p.split('\n');
      if (ls.every(function (l) { return /^\s*([-*•]|\d+\.)\s+/.test(l); })) return '<ul>' + ls.map(function (l) { return '<li>' + l.replace(/^\s*([-*•]|\d+\.)\s+/, '') + '</li>'; }).join('') + '</ul>';
      return '<p>' + ls.join('<br>') + '</p>';
    }).join('');
  }
  function strip(t) { return t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim(); }

  /* ---------- styles (the Lab has no shared stylesheet, so the bubble brings its own, built on the Lab's colour tokens) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.aib{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:var(--sans,system-ui,sans-serif);color:var(--ink,#F2F4F5)}',
    '.aib button{font-family:inherit;margin:0}',
    '.aib-btn{display:flex;align-items:center;gap:8px;height:48px;padding:0 18px 0 14px;border-radius:999px;border:1px solid var(--ln2,rgba(255,255,255,.14));cursor:pointer;background:var(--ink,#F2F4F5);color:var(--bg,#0B0C0D);font:600 14px var(--sans,system-ui);box-shadow:0 10px 30px rgba(0,0,0,.35);transition:transform .2s,box-shadow .2s}',
    '.aib-btn:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,0,0,.42)}',
    '.aib-btn svg{animation:aibTw 4s ease-in-out infinite}',
    '@keyframes aibTw{0%,80%,100%{transform:rotate(0) scale(1)}88%{transform:rotate(18deg) scale(1.12)}}',
    '.aib.on .aib-btn{opacity:0;pointer-events:none;transform:scale(.8)}',
    '.aib-panel{position:absolute;right:0;bottom:0;width:380px;height:min(600px,calc(100vh - 110px));display:flex;flex-direction:column;overflow:hidden;padding:0;margin:0;background:var(--s1,#121415);border:1px solid var(--ln2,rgba(255,255,255,.14));border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.45);transform-origin:100% 100%;animation:aibIn .28s cubic-bezier(.2,.8,.2,1)}',
    '.aib-panel[hidden]{display:none}',
    '@keyframes aibIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}',
    '.aib-top{display:flex;justify-content:space-between;align-items:center;padding:14px 14px 12px 18px;border-bottom:1px solid var(--ln,rgba(255,255,255,.08))}',
    '.aib-top b{display:block;font-size:15px;font-weight:600}',
    '.aib-st{font:400 11px var(--mono,ui-monospace,monospace);letter-spacing:.06em;text-transform:uppercase;color:var(--t3,#8A949B)}',
    '.aib-hd{display:flex;gap:4px}',
    '.aib-hd button{width:32px;height:32px;border-radius:50%;border:0;background:transparent;color:var(--t2,#A3ADB4);cursor:pointer;display:grid;place-items:center;padding:0}',
    '.aib-hd button:hover{background:var(--s2,#191C1E);color:var(--ink,#F2F4F5)}',
    '.aib-log{flex:1;overflow-y:auto;padding:16px 16px 6px;display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.55;overscroll-behavior:contain;text-align:left}',
    '.aib-log p{margin:0 0 8px;font-size:14px;line-height:1.55;max-width:none;color:inherit}.aib-log p:last-child{margin:0}',
    '.aib-log ul{margin:0 0 8px;padding-left:18px}.aib-log li{margin:0}',
    '.aib-log code{font:12.5px var(--mono,ui-monospace,monospace)}',
    '.aib-log a{color:inherit;text-decoration:underline}',
    '.aib-hi,.aib-note{color:var(--t2,#A3ADB4)}',
    '.aib-m{max-width:88%;padding:10px 13px;border-radius:14px;word-wrap:break-word}',
    '.aib-m.u{align-self:flex-end;background:var(--ink,#F2F4F5);color:var(--bg,#0B0C0D);border-bottom-right-radius:4px;white-space:pre-wrap}',
    '.aib-m.a{align-self:flex-start;background:var(--s2,#191C1E);border:1px solid var(--ln,rgba(255,255,255,.08));border-bottom-left-radius:4px}',
    '.aib-m .cur{display:inline-block;width:7px;height:14px;margin-left:2px;vertical-align:-2px;background:var(--mint,#8FC3BA);animation:aibBl 1s steps(2) infinite}',
    '@keyframes aibBl{50%{opacity:0}}',
    '.aib-dots{display:inline-flex;gap:4px}.aib-dots i{width:6px;height:6px;border-radius:50%;background:var(--t3,#8A949B);animation:aibDot 1.2s infinite}',
    '.aib-dots i:nth-child(2){animation-delay:.15s}.aib-dots i:nth-child(3){animation-delay:.3s}',
    '@keyframes aibDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}',
    '.aib-ms{display:grid;gap:8px;margin-top:10px}',
    '.aib-ms button{text-align:left;padding:10px 12px;border-radius:12px;border:1px solid var(--ln2,rgba(255,255,255,.14));background:var(--s2,#191C1E);color:var(--ink,#F2F4F5);cursor:pointer;font:inherit}',
    '.aib-ms button:hover{border-color:var(--mint,#8FC3BA)}',
    '.aib-ms b{display:block;font-size:14px}.aib-ms span{font-size:12.5px;color:var(--t2,#A3ADB4)}',
    '.aib-prog{height:4px;border-radius:4px;background:var(--ln2,rgba(255,255,255,.14));overflow:hidden;margin:8px 0 4px}.aib-prog i{display:block;height:100%;width:0;background:var(--mint,#8FC3BA);transition:width .3s}',
    '.aib-note small{font:400 11px var(--mono,ui-monospace,monospace);color:var(--t3,#8A949B)}',
    '.aib-sug{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 8px}',
    '.aib-sug button{border:1px solid var(--ln2,rgba(255,255,255,.14));background:transparent;color:var(--t2,#A3ADB4);border-radius:999px;padding:6px 11px;font:12.5px var(--sans,system-ui);cursor:pointer}',
    '.aib-sug button:hover{color:var(--ink,#F2F4F5);border-color:var(--mint,#8FC3BA)}',
    '.aib-in{display:flex;gap:8px;align-items:flex-end;margin:4px 12px 6px;padding:6px 6px 6px 14px;border:1px solid var(--ln2,rgba(255,255,255,.14));border-radius:16px;background:var(--s2,#191C1E)}',
    '.aib-in:focus-within{border-color:var(--mint,#8FC3BA)}',
    '.aib-in.off{opacity:.5;pointer-events:none}',
    '.aib-in textarea{flex:1;min-width:0;height:33px;resize:none;border:0;outline:0;background:transparent;color:var(--ink,#F2F4F5);font:14px/1.45 var(--sans,system-ui);padding:6px 0;max-height:120px;margin:0;box-shadow:none}',
    '.aib-in>button{flex:none;width:34px;height:34px;border-radius:50%;border:0;background:var(--ink,#F2F4F5);color:var(--bg,#0B0C0D);cursor:pointer;display:grid;place-items:center;padding:0}',
    '.aib-in>button.stop svg{display:none}.aib-in>button.stop::before{content:"";width:10px;height:10px;border-radius:2px;background:currentColor}',
    '.aib-ft{margin:0;padding:0 16px 12px;font-size:11px;line-height:1.4;color:var(--t3,#8A949B)}',
    '@media (max-width:560px){.aib{right:14px;bottom:calc(14px + env(safe-area-inset-bottom))}.aib-btn{height:52px;width:52px;padding:0;justify-content:center}.aib-btn span{display:none}',
    '.aib-panel{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));width:auto;height:min(78vh,640px)}.aib-in textarea{font-size:16px}}',
    '@media (prefers-reduced-motion:reduce){.aib-btn svg,.aib-panel{animation:none}}',
    '@media print{.aib{display:none}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- UI ---------- */
  var ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9.4l-4.7 1.8L12 16l-1.8-4.8L5.5 9.4l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>';
  var root = document.createElement('div'); root.className = 'aib';
  root.innerHTML = '<button class="aib-btn" type="button" aria-label="Ask AI" aria-expanded="false">' + ICON + '<span>Ask AI</span></button>' +
    '<div class="aib-panel" role="dialog" aria-label="Ask AI" hidden>' +
    '<div class="aib-top"><div><b>Ask AI</b><span class="aib-st">Runs privately in your browser</span></div><div class="aib-hd"><button type="button" class="aib-clr" title="Clear the conversation" aria-label="Clear the conversation"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button><button type="button" class="aib-x" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div>' +
    '<div class="aib-log" aria-live="polite"></div>' +
    '<div class="aib-sug"></div>' +
    '<form class="aib-in" autocomplete="off"><textarea rows="1" placeholder="Ask about this page or any AI idea" aria-label="Your question"></textarea><button type="submit" aria-label="Send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>' +
    '<p class="aib-ft">Qwen3, a small open model, running on your device. It can be wrong. Trading and market results on this site are simulated; nothing here is investment advice.</p>' +
    '</div>';
  document.body.appendChild(root);
  var btn = root.querySelector('.aib-btn'), panel = root.querySelector('.aib-panel'), log = root.querySelector('.aib-log'), sug = root.querySelector('.aib-sug'),
      form = root.querySelector('form'), ta = root.querySelector('textarea'), send = form.querySelector('button'), st = root.querySelector('.aib-st');

  function open(v) {
    panel.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); root.classList.toggle('on', v);
    if (v) { render(); setup(); setTimeout(function () { ta.focus(); }, 60); }
  }
  btn.onclick = function () { open(panel.hidden); };
  root.querySelector('.aib-x').onclick = function () { open(false); btn.focus(); };
  root.querySelector('.aib-clr').onclick = function () { stop(); S.msgs = []; sset(); render(); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) open(false); });
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
  ta.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.onsubmit(e); } });
  ta.addEventListener('keyup', function (e) { e.stopPropagation(); });

  function suggestions() {
    if (PAGE === 'index') return ['What can I do in the Lab?', 'Where should I start?', 'How do models run in my browser?'];
    if (GAMES[PAGE]) return ['How does this work?', 'What is the idea behind it?', 'Give me a hint, not the answer'];
    if (HEAVY[PAGE]) return ['What is this page testing?', 'How should I read the results?', 'Which model should I try first?'];
    return ['Explain this simply', 'Give me an everyday example', 'What should I take away?'];
  }
  function render() {
    S.msgs = S.msgs.length ? S.msgs : sget();
    if (!S.msgs.length) log.innerHTML = '<div class="aib-hi"><p>Ask about the module or tool on screen, or any AI, machine learning or quant idea. Answers use what is on this page.</p></div>';
    else log.innerHTML = S.msgs.map(function (m) { return '<div class="aib-m ' + (m.role === 'user' ? 'u' : 'a') + '">' + (m.role === 'user' ? esc(m.content) : md(m.content)) + '</div>'; }).join('');
    if (S.note && S.note.parentNode !== log && (S.loading || !S.eng)) log.appendChild(S.note);
    sug.innerHTML = S.msgs.length ? '' : suggestions().map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('');
    Array.prototype.forEach.call(sug.querySelectorAll('button'), function (b) { b.onclick = function () { ta.value = b.textContent; form.requestSubmit ? form.requestSubmit() : form.onsubmit(); }; });
    log.scrollTop = log.scrollHeight;
  }

  /* ---------- model ---------- */
  function picker(intro) {
    st.textContent = 'Choose a model to start';
    note(intro + '<div class="aib-ms">' + MODELS.map(function (x, i) { return '<button type="button" data-m="' + i + '"><b>' + esc(x[1]) + '</b><span>' + esc(x[3]) + ' &middot; ' + esc(x[2]) + '</span></button>'; }).join('') + '</div>', 'pick');
    Array.prototype.forEach.call(log.querySelectorAll('[data-m]'), function (b) { b.onclick = function () { load(MODELS[+b.getAttribute('data-m')]); }; });
  }
  function setup() {
    if (S.eng || S.loading) return;
    if (!navigator.gpu) {
      st.textContent = 'Not available on this device';
      note('<p>The tutor runs inside your browser and needs WebGPU, which this browser does not offer. It works in Chrome or Edge on a computer and in Safari 26 on a Mac, iPhone or iPad.</p>', 'gpu');
      form.classList.add('off'); return;
    }
    var saved = store(LS), m = MODELS.filter(function (x) { return x[0] === saved; })[0];
    if (HEAVY[PAGE]) { picker('<p><b>This page runs its own models.</b> To keep your device&rsquo;s memory free, the tutor only starts when you choose. If a model on the page is already loaded, start the smaller tutor.</p>'); return; }
    if (m) { load(m); return; }
    picker('<p><b>One-time download.</b> The model runs on your own device, so nothing you type is sent anywhere. After the first download it loads from your browser&rsquo;s cache, on the Lab and on LDB Finance.</p>');
  }
  function note(html, id) {
    var old = log.querySelector('.aib-note'); if (old) old.remove(); S.note = null;
    var d = document.createElement('div'); d.className = 'aib-note'; d.setAttribute('data-id', id); d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight;
    S.note = d; return d;
  }
  function load(m) {
    var d = note('<p>Loading ' + esc(m[1]) + '&hellip;</p><div class="aib-prog"><i></i></div><small></small>', 'load');
    var bar = d.querySelector('i'), lab = d.querySelector('small');
    st.textContent = 'Loading ' + m[1] + '…';
    S.loading = import(WLURL).then(function (W) {
      return W.CreateMLCEngine(m[0], { initProgressCallback: function (r) { var p = (r.progress || 0) * 100; bar.style.width = p.toFixed(0) + '%'; lab.textContent = p >= 100 ? 'Starting the model…' : (/cache/i.test(r.text || '') ? 'Loading from cache ' : 'Downloading ') + Math.round(p) + '%'; } });
    }).then(function (eng) {
      S.eng = eng; S.model = m; S.loading = null; store(LS, m[0]);
      st.textContent = m[1] + ' · on your device'; d.remove(); S.note = null; form.classList.remove('off');
      if (S.pending) { var q = S.pending; S.pending = null; ask(q); }
    }).catch(function (e) {
      S.loading = null; store(LS, null); st.textContent = 'Could not start';
      d.innerHTML = '<p>The model could not start on this device (' + esc(String(e && e.message || e).slice(0, 90)) + '). Try the smaller model, or close other tabs to free memory.</p>';
      setTimeout(function () { var n = log.querySelector('.aib-note'); if (n) n.remove(); setup(); }, 2600);
    });
  }

  /* ---------- context: the most relevant parts of this page, including live numbers on screen ---------- */
  function chunks() {
    var out = [], seen = {};
    var els = document.querySelectorAll('h1, h2, h3, h4, p, li, tr, figcaption, label, .edu, output, [aria-live]');
    Array.prototype.forEach.call(els, function (el) {
      if (el.closest('nav, header nav, footer, .aib, script, style, noscript') || !el.offsetParent && el.tagName !== 'H1') return;
      if (el.matches('p, li, label') && el.closest('tr')) return;
      var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length < 3 || seen[t]) return; seen[t] = 1;
      out.push({ t: t.slice(0, 600), h: /^H[1-4]$/.test(el.tagName) });
    });
    return out;   // rebuilt on every question, so the numbers in a running game or chart are current
  }
  var STOP = /^(the|a|an|and|or|of|to|in|on|is|are|was|for|what|why|how|does|do|this|that|it|its|with|about|me|i|you|be|by|at|as|can|from|which|who|will|would|should|my)$/;
  function words(s) { return (s.toLowerCase().match(/[a-z0-9$%.]+/g) || []).filter(function (w) { return w.length > 1 && !STOP.test(w); }); }
  function pageContext(q) {
    var cs = chunks(), qw = words(q), budget = 3400;
    var head = cs.slice(0, 3).map(function (c) { return c.t; }).join('\n'), used = head.length;
    var general = !qw.length || /summar|explain|overview|page|simpl|idea|work|start|take ?away|hint|tip/i.test(q);
    var scored = cs.slice(3).map(function (c, i) {
      var lw = c.t.toLowerCase(), s = 0;
      qw.forEach(function (w) { if (lw.indexOf(w) >= 0) s += w.length > 4 ? 2 : 1; });
      if (c.h) s += .5; if (general) s += 1 / (1 + i * .05);
      return { c: c, s: s, i: i };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; });
    var pick = [];
    for (var k = 0; k < scored.length && used < budget; k++) { var t = scored[k].c.t; if (used + t.length > budget) continue; pick.push(scored[k]); used += t.length + 1; }
    pick.sort(function (a, b) { return a.i - b.i; });
    return head + '\n' + pick.map(function (x) { return x.c.t; }).join('\n');
  }

  /* ---------- asking ---------- */
  function stop() { S.busy = null; send.classList.remove('stop'); }
  form.onsubmit = function (e) {
    if (e) e.preventDefault();
    if (S.busy) { stop(); return; }
    var q = ta.value.trim(); if (!q) return;
    ta.value = ''; ta.style.height = 'auto';
    if (!S.eng) {
      if (form.classList.contains('off')) return;
      S.pending = q; S.msgs.push({ role: 'user', content: q }); sset(); render();
      if (!S.loading) setup(); return;
    }
    S.msgs.push({ role: 'user', content: q }); sset(); render(); ask(q);
  };
  function ask(q) {
    var el = document.createElement('div'); el.className = 'aib-m a'; el.innerHTML = '<span class="aib-dots"><i></i><i></i><i></i></span>'; log.appendChild(el); log.scrollTop = log.scrollHeight;
    var tok = {}; S.busy = tok; send.classList.add('stop'); sug.innerHTML = '';
    Promise.resolve().then(function () {
      var title = document.title.replace(/\s*\|.*$/, '');
      var sys = 'You are the tutor on LDB Lab, a hands-on applied-AI lab where every model runs in the visitor\'s browser: a course on machine learning (from gradient descent to transformers, diffusion, GPUs, retrieval, agents and evaluation), finance tools and learning agents. ' +
        'Explain like a patient teacher to a curious student: plain English, short (about 150 words unless asked for more), one concrete example when it helps, and define jargon the first time. ' +
        'Use the page excerpt below for anything about this page, including numbers currently on screen, and copy those numbers exactly; if something is not in the excerpt, say you cannot see it on the page rather than guessing. For general AI, machine learning, statistics and finance concepts you may use your own knowledge. ' +
        (GAMES[PAGE] ? 'This page is a game or simulation: explain rules, ideas and strategy principles, but do not hand over the exact move or answer unless the user explicitly insists. All results here are simulated. ' : '') +
        'Never give personal investment advice.\n\n' +
        'Current page: ' + title + ' (' + PAGE + ')\n--- Page excerpt ---\n' + pageContext(q) + '\n--- End of excerpt ---';
      var hist = S.msgs.slice(-7, -1).map(function (m) { return { role: m.role, content: m.content.slice(0, 900) }; });
      var msgs = [{ role: 'system', content: sys }].concat(hist, [{ role: 'user', content: q }]);
      return S.eng.chat.completions.create({ messages: msgs, stream: true, temperature: 0.5, top_p: 0.9, max_tokens: 450, extra_body: { enable_thinking: false } });
    }).then(function (stream) {
      var it = stream[Symbol.asyncIterator](), text = '';
      function step() {
        return it.next().then(function (r) {
          if (S.busy !== tok) { try { S.eng.interruptGenerate(); } catch (x) {} return text; }
          if (r.done) return text;
          var d = r.value.choices && r.value.choices[0] && r.value.choices[0].delta && r.value.choices[0].delta.content || '';
          if (d) { text += d; el.innerHTML = md(strip(text)) + '<span class="cur"></span>'; if (log.scrollHeight - log.scrollTop - log.clientHeight < 80) log.scrollTop = log.scrollHeight; }
          return step();
        });
      }
      return step();
    }).then(function (text) {
      var clean = strip(text || '') || '(No answer. Try rephrasing the question.)';
      el.innerHTML = md(clean); S.msgs.push({ role: 'assistant', content: clean }); sset();
      if (S.busy === tok) stop();
    }).catch(function (e) {
      el.innerHTML = '<p>Something went wrong: ' + esc(String(e && e.message || e).slice(0, 100)) + '</p>'; stop();
    });
  }
})();
