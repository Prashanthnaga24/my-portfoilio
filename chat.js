// "Ask Prashanth" chat widget. Talks to the Netlify Function at /api/chat
// (streamed plain text). Falls back to built-in quick answers when the
// function isn't configured or reachable.
(function () {
  'use strict';
  const fab = document.getElementById('chat-fab');
  const panel = document.getElementById('chat-panel');
  if (!fab || !panel) return;

  const API = '/api/chat';
  const EMAIL = 'prashanthnaga24@gmail.com';
  const STORE = 'pn-chat';
  const SUGGESTIONS = [
    ['Experience', 'What is your work experience?'],
    ['Automation', 'Which automation tools and frameworks do you use?'],
    ['Achievements', 'What are your key achievements?'],
    ['Certifications', 'What certifications do you have?'],
    ['Contact', 'How can I contact you about an opportunity?'],
  ];
  const ANSWERS = [
    { k: ['experience', 'work', 'job', 'company', 'infosys', 'tcs', 'tata', 'mahindra', 'role', 'career', 'background'],
      a: "I'm a **Quality Engineering Lead at Infosys** (May 2026 – present), testing a banking application for economic-crime monitoring with Playwright + TypeScript.\n\nBefore that: **IT Analyst – Automation Engineer at TCS** (2022–2026, supply-chain portals) and **Software Tester at Tech Mahindra** (2018–2022, telecom retail systems)." },
    { k: ['tool', 'automation', 'framework', 'playwright', 'selenium', 'skill', 'stack', 'typescript', 'python', 'java', 'postman', 'jmeter', 'api'],
      a: '- **Playwright** with TypeScript and Python — my daily driver\n- **Selenium WebDriver** with Java, Cucumber BDD, TestNG, Maven\n- **API & performance:** Postman, JMeter\n- **Tools:** Jira, HP ALM, PyTest, VS Code, Oracle SQL Developer' },
    { k: ['achiev', 'result', 'impact', 'proud', 'award', 'rating', 'efficien'],
      a: '- Improved test efficiency by **75%** through automation at TCS\n- Received **consecutive "A" ratings** at TCS\n- Automated critical **banking workflows** with Playwright + TypeScript at Infosys\n- Led and mentored **2–3 QA engineers**' },
    { k: ['certif', 'istqb', 'google', 'course', 'education', 'degree', 'study', 'university'],
      a: '- **ISTQB Foundation Certified Tester** (2019)\n- **Google — Agentic AI Leader Certificate** (2025)\n- **B.Tech**, Vel Tech University, Chennai — CGPA 7.91' },
    { k: ['contact', 'email', 'hire', 'reach', 'opportunit', 'available', 'linkedin', 'github'],
      a: 'Email **' + EMAIL + '** or connect on [LinkedIn](https://www.linkedin.com/in/prashanth-nagarajan-5335b525b/). My code is on [GitHub](https://github.com/Prashanthnaga24).' },
  ];
  const localAnswer = (text) => {
    const t = text.toLowerCase();
    let best = null;
    let score = 0;
    ANSWERS.forEach((item) => {
      const s = item.k.filter((k) => t.includes(k)).length;
      if (s > score) { score = s; best = item; }
    });
    return best ? best.a : "I don't have a quick answer for that — please email **" + EMAIL + "** and I'll reply personally.";
  };

  // ---- Minimal, safe Markdown (input escaped first) ----
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (s) => {
    const keep = [];
    const hold = (html) => '\u0000' + (keep.push(html) - 1) + '\u0000';
    s = s.replace(/`([^`]+)`/g, (_, c) => hold('<code>' + c + '</code>'));
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+|#[\w-]+)\)/g, (_, t, u) =>
      hold('<a href="' + u + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>'));
    s = s.replace(/https?:\/\/[^\s<)\u0000]+/g, (u) => hold('<a href="' + u + '" target="_blank" rel="noopener">' + u.replace(/^https?:\/\//, '') + '</a>'));
    s = s.replace(/[\w.+-]+@[\w-]+\.[\w.]+\w/g, (m) => hold('<a href="mailto:' + m + '">' + m + '</a>'));
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  };
  const md = (src) => {
    const lines = esc(String(src || '')).replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    const isItem = (l) => /^\s*([-*•]|\d+[.)])\s+/.test(l);
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*\|.*\|\s*$/.test(line)) {
        // Tables don't suit a chat bubble: show rows as compact lines
        const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]);
        const body = rows.filter((r) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r)).map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim())));
        if (body.length > 1) out.push('<ul>' + body.slice(1).map((c) => '<li>' + c.filter(Boolean).join(' — ') + '</li>').join('') + '</ul>');
        continue;
      }
      if (isItem(line)) {
        const ordered = /^\s*\d/.test(line);
        const items = [];
        while (i < lines.length && isItem(lines[i])) items.push('<li>' + inline(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, '')) + '</li>');
        out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>'));
        continue;
      }
      const h = line.match(/^#{1,4}\s+(.*)$/);
      if (h) { out.push('<p><strong>' + inline(h[1]) + '</strong></p>'); i++; continue; }
      if (!line.trim()) { i++; continue; }
      const para = [];
      while (i < lines.length && lines[i].trim() && !isItem(lines[i]) && !/^\s*(\||#)/.test(lines[i])) para.push(inline(lines[i++]));
      out.push('<p>' + para.join('<br>') + '</p>');
    }
    return out.join('');
  };

  // ---- UI ----
  panel.innerHTML =
    '<div class="pc-head">' +
      '<div class="pc-who"><img class="pc-avatar" src="assets/prashanth.webp" alt="" width="42" height="42">' +
      '<div><div class="pc-name">Ask Prashanth</div><div class="pc-status" data-state="checking"><span class="pc-dot"></span><span class="pc-status-text">Connecting…</span></div></div></div>' +
      '<div class="pc-actions"><button class="pc-icon" type="button" data-act="reset" aria-label="Start a new chat" title="New chat">↻</button>' +
      '<button class="pc-icon" type="button" data-act="close" aria-label="Close chat" title="Close">✕</button></div>' +
    '</div>' +
    '<div class="pc-log" role="log" aria-live="polite" aria-label="Conversation"></div>' +
    '<div class="pc-suggest" aria-label="Suggested questions"></div>' +
    '<form class="pc-form" autocomplete="off">' +
      '<textarea class="pc-input" rows="1" maxlength="500" placeholder="Ask about my QA experience…" aria-label="Your message"></textarea>' +
      '<button class="pc-send" type="submit" aria-label="Send message" disabled>↑</button>' +
    '</form>' +
    '<div class="pc-foot">AI answers from my CV · may be imperfect · <a href="mailto:' + EMAIL + '">email me</a></div>';

  const log = panel.querySelector('.pc-log');
  const suggest = panel.querySelector('.pc-suggest');
  const form = panel.querySelector('.pc-form');
  const input = panel.querySelector('.pc-input');
  const send = panel.querySelector('.pc-send');
  const statusEl = panel.querySelector('.pc-status');
  const statusText = panel.querySelector('.pc-status-text');

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch (e) { history = []; }
  let mode = 'checking';
  let busy = false;
  let isOpen = false;
  let checked = false;

  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-24))); } catch (e) {} };
  const setMode = (m) => {
    mode = m;
    statusEl.dataset.state = m;
    statusText.textContent = { online: 'Online · AI assistant', offline: 'Quick-answer mode', checking: 'Connecting…' }[m];
  };
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const bubble = (role, content, local) => {
    const row = document.createElement('div');
    row.className = 'pc-row ' + (role === 'user' ? 'me' : 'bot');
    const msg = document.createElement('div');
    msg.className = 'pc-msg';
    if (role === 'user') msg.textContent = content;
    else msg.innerHTML = md(content);
    if (local) {
      const tag = document.createElement('span');
      tag.className = 'pc-tag';
      tag.textContent = 'Quick answer';
      msg.prepend(tag);
    }
    row.appendChild(msg);
    log.appendChild(row);
    scroll();
    return row;
  };
  const typing = () => {
    const row = document.createElement('div');
    row.className = 'pc-row bot';
    row.innerHTML = '<div class="pc-msg pc-typing" aria-label="Typing"><span></span><span></span><span></span></div>';
    log.appendChild(row);
    scroll();
    return row;
  };
  const renderAll = () => {
    log.innerHTML = '';
    bubble('assistant', "Hi! I'm **Prashanth's AI assistant**. Ask me about my QA experience, automation skills, achievements or how to reach me.");
    history.forEach((m) => bubble(m.role, m.content, m.local));
  };
  suggest.innerHTML = SUGGESTIONS.map(([l, q]) => '<button type="button" class="pc-chip" data-q="' + esc(q) + '">' + l + '</button>').join('');

  const checkStatus = () => {
    if (checked) return;
    checked = true;
    fetch(API, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMode(d && d.configured ? 'online' : 'offline'))
      .catch(() => setMode('offline'));
  };

  const askLive = async (text, onPartial) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.filter((m) => !m.local).map((m) => ({ role: m.role, content: m.content })) }),
        signal: ctrl.signal,
      });
      if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let answer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += dec.decode(value, { stream: true });
        onPartial(answer);
      }
      if (!answer.trim()) throw new Error('Empty answer');
      return answer;
    } finally {
      clearTimeout(timer);
    }
  };

  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };

  const ask = async (raw) => {
    const text = raw.trim().slice(0, 500);
    if (!text || busy) return;
    busy = true;
    send.disabled = true;
    input.value = '';
    autosize();
    bubble('user', text);
    const dots = typing();
    let live = null;
    let pending = '';
    let frame = 0;
    const onPartial = (partial) => {
      pending = partial;
      if (!live) {
        dots.remove();
        live = bubble('assistant', '');
        live.firstChild.classList.add('pc-streaming');
      }
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          live.firstChild.innerHTML = md(pending);
          if (live.offsetHeight > log.clientHeight * 0.6) log.scrollTop = live.offsetTop - 12;
          else scroll();
        });
      }
    };
    let reply;
    let local = false;
    if (mode === 'offline') {
      await new Promise((r) => setTimeout(r, 450));
      reply = localAnswer(text);
      local = true;
    } else {
      try {
        reply = await askLive(text, onPartial);
      } catch (e) {
        if (pending.trim()) reply = pending;
        else { setMode('offline'); reply = localAnswer(text); local = true; }
      }
    }
    if (frame) cancelAnimationFrame(frame);
    dots.remove();
    history.push({ role: 'user', content: text }, { role: 'assistant', content: reply, local });
    save();
    let row;
    if (live && !local) {
      row = live;
      row.firstChild.classList.remove('pc-streaming');
      row.firstChild.innerHTML = md(reply);
    } else {
      if (live) live.remove();
      row = bubble('assistant', reply, local);
    }
    if (row.offsetHeight > log.clientHeight * 0.6) log.scrollTop = row.offsetTop - 12;
    else scroll();
    busy = false;
    send.disabled = !input.value.trim();
    if (isOpen && window.matchMedia('(hover: hover)').matches) input.focus();
  };

  renderAll();
  suggest.addEventListener('click', (e) => { const c = e.target.closest('.pc-chip'); if (c) ask(c.dataset.q); });
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', () => { autosize(); send.disabled = busy || !input.value.trim(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); }
  });

  const setOpen = (open) => {
    isOpen = open;
    panel.classList.toggle('open', open);
    fab.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', String(open));
    fab.setAttribute('aria-label', open ? 'Close chat' : 'Chat with Prashanth\'s AI assistant');
    panel.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('chat-open', open);
    if (open) { checkStatus(); scroll(); setTimeout(() => input.focus(), 250); }
  };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'close') { setOpen(false); fab.focus(); }
    else if (!busy) { history = []; save(); renderAll(); input.focus(); }
  });
  fab.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!isOpen); });
  document.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) { setOpen(false); fab.focus(); } });
  document.addEventListener('click', (e) => { if (isOpen && !panel.contains(e.target) && !fab.contains(e.target)) setOpen(false); });
})();
