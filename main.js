// Interactions: header, menu, reveals, counters, terminal run, catch-the-bug.
(function () {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Header + mobile menu ----------
  const top = document.querySelector('.top');
  const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menu.addEventListener('click', (e) => { e.stopPropagation(); setMenu(!nav.classList.contains('open')); });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menu.focus(); } });

  // Highlight the nav link for the section in view
  const links = Array.from(nav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'report', 'toolchain', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 0.06 + 's'); io.observe(el); });
  }

  // ---------- Count-up numbers ----------
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target + suffix; return; }
    const run = () => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el);
  });

  // ---------- Terminal: a Playwright run themed on his projects ----------
  const term = document.getElementById('term');
  if (term) {
    const COMMAND = 'npx playwright test';
    const LINES = [
      ['dim', '\nRunning 8 tests using 3 workers\n'],
      ['ok', '  ✓ 1 [chromium] › banking/crime-monitoring.spec.ts › flags a suspicious transaction (1.2s)'],
      ['ok', '  ✓ 2 [firefox]  › banking/case-workflow.spec.ts › investigator closes a case (1.4s)'],
      ['ok', '  ✓ 3 [webkit]   › supply-chain/vendor-portal.spec.ts › vendor uploads an invoice (0.9s)'],
      ['ok', '  ✓ 4 [chromium] › supply-chain/ai-chatbot.spec.ts › chatbot answers order status (1.8s)'],
      ['ok', '  ✓ 5 [firefox]  › api/orders.spec.ts › GET /orders returns 200 (0.3s)'],
      ['ok', '  ✓ 6 [webkit]   › api/auth.spec.ts › rejects an expired token (0.2s)'],
      ['ok', '  ✓ 7 [chromium] › telecom/guided-selling.spec.ts › agent completes a sale (1.1s)'],
      ['ok', '  ✓ 8 [firefox]  › telecom/billing.spec.ts › invoice totals match the plan (0.7s)'],
      ['sum', '\n  8 passed (6.4s)'],
      ['dim', '\nTo open last HTML report run:\n  npx playwright show-report'],
    ];
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const prompt = '<span class="prompt">$</span> ';
    const render = (cmd, upto, caret) => {
      let html = prompt + esc(cmd);
      for (let i = 0; i < upto; i++) html += '\n<span class="' + LINES[i][0] + '">' + esc(LINES[i][1]) + '</span>';
      if (upto === LINES.length) html += '\n\n' + prompt;
      term.innerHTML = html + (caret ? '<span class="caret"></span>' : '');
    };
    const play = () => {
      if (reduce) { render(COMMAND, LINES.length, false); return; }
      let i = 0;
      const typeCmd = () => {
        i++;
        render(COMMAND.slice(0, i), 0, true);
        if (i < COMMAND.length) setTimeout(typeCmd, 55 + Math.random() * 60);
        else setTimeout(() => printLine(1), 500);
      };
      const printLine = (n) => {
        render(COMMAND, n, true);
        if (n < LINES.length) setTimeout(() => printLine(n + 1), n === 1 ? 600 : 260 + Math.random() * 260);
      };
      render('', 0, true);
      setTimeout(typeCmd, 400);
    };
    render('', 0, true);
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(term);
  }

  // ---------- Toast ----------
  const toastEl = document.getElementById('toast');
  let toastTimer = 0;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  };

  // ---------- Catch the bug ----------
  const bug = document.getElementById('bug');
  const countEl = document.getElementById('bug-count');
  if (bug) {
    let caught = 0;
    let x = 0, y = 0, angle = 0, tx = 0, ty = 0, speed = 0.9, pauseUntil = 0, raf = 0, active = false;
    const size = () => (window.innerWidth < 600 ? 28 : 34);
    const pickTarget = () => {
      const m = 40;
      tx = m + Math.random() * (window.innerWidth - m * 2);
      ty = 90 + Math.random() * (window.innerHeight - 160);
    };
    const place = () => {
      bug.style.width = bug.style.height = size() + 'px';
      bug.style.transform = 'translate(' + (x - size() / 2) + 'px,' + (y - size() / 2) + 'px) rotate(' + (angle + Math.PI / 2) + 'rad)';
    };
    const step = (now) => {
      if (!active) return;
      if (now > pauseUntil) {
        const dx = tx - x, dy = ty - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 8) {
          pickTarget();
          if (Math.random() < 0.4) pauseUntil = now + 600 + Math.random() * 1400; // bugs stop to think
        } else {
          let turn = Math.atan2(dy, dx) - angle;
          turn = Math.atan2(Math.sin(turn), Math.cos(turn));
          angle += turn * 0.06 + (Math.random() - 0.5) * 0.08;
          x += Math.cos(angle) * speed;
          y += Math.sin(angle) * speed;
        }
        place();
      }
      raf = requestAnimationFrame(step);
    };
    const spawn = () => {
      // enter from a random screen edge
      const side = Math.floor(Math.random() * 4);
      x = side === 1 ? window.innerWidth + 20 : side === 3 ? -20 : Math.random() * window.innerWidth;
      y = side === 0 ? 70 : side === 2 ? window.innerHeight + 20 : 100 + Math.random() * (window.innerHeight - 200);
      angle = Math.atan2(window.innerHeight / 2 - y, window.innerWidth / 2 - x);
      speed = 0.7 + Math.random() * 0.5;
      pickTarget();
      bug.classList.remove('caught');
      bug.classList.add('on');
      place();
      active = !reduce;
      if (reduce) { x = window.innerWidth - 60; y = window.innerHeight - 140; angle = -Math.PI / 2; place(); }
      else raf = requestAnimationFrame(step);
    };
    bug.addEventListener('click', () => {
      active = false;
      cancelAnimationFrame(raf);
      caught++;
      countEl.textContent = caught;
      bug.classList.add('caught');
      toast(caught === 1
        ? '🐞 Bug caught! Logged, reproduced, fixed. That\'s my day job.'
        : '🐞 Bug #' + caught + ' caught. Regression test added.');
      setTimeout(spawn, 15000);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (active) { raf = requestAnimationFrame(step); }
    });
    setTimeout(spawn, 5000);
  }

  // ---------- Footer year ----------
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
