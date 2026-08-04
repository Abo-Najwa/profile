(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;

  /* =========================================================
     LANGUAGE TOGGLE
     ========================================================= */
  const langToggleBtn = document.getElementById('lang-toggle');
  const ROLES = {
    ar: ['مطوّر مواقع إلكترونية', 'مبرمج', 'مختبر اختراق', 'محاسب'],
    en: ['Web Developer', 'Programmer', 'Penetration Tester', 'Accountant']
  };

  function setLang(lang) {
    const isEn = lang === 'en';
    html.classList.toggle('lang-en', isEn);
    html.classList.toggle('lang-ar', !isEn);
    body.classList.toggle('lang-en', isEn);
    body.classList.toggle('lang-ar', !isEn);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', isEn ? 'ltr' : 'rtl');
    langToggleBtn.textContent = isEn ? 'AR' : 'EN';
    localStorage.setItem('portfolio-lang', lang);
    restartTypewriter(lang);
  }

  langToggleBtn.addEventListener('click', () => {
    const current = html.classList.contains('lang-en') ? 'en' : 'ar';
    setLang(current === 'en' ? 'ar' : 'en');
  });

  const savedLang = localStorage.getItem('portfolio-lang');
  if (savedLang) setLang(savedLang);

  /* =========================================================
     BOOT SCREEN
     ========================================================= */
  const bootScreen = document.getElementById('boot-screen');
  function dismissBoot() {
    bootScreen.classList.add('hidden');
    document.removeEventListener('click', dismissBoot);
    document.removeEventListener('keydown', dismissBoot);
    body.style.overflow = '';
  }
  body.style.overflow = 'hidden';
  document.addEventListener('click', dismissBoot);
  document.addEventListener('keydown', dismissBoot);
  setTimeout(dismissBoot, 4000); // auto-dismiss fallback

  /* =========================================================
     MATRIX RAIN CANVAS (used for boot screen + hero background)
     ========================================================= */
  function startMatrixRain(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const chars = 'アイウエオカキクケコ01アビシフABCDEFGHIJKLMNOPQRSTUVWXYZ$#%&';
    let cols, drops, w, h;
    const fontSize = opts.fontSize || 16;
    const color = opts.color || '#39ff14';

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      cols = Math.floor(w / fontSize);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.fillStyle = 'rgba(5,7,12,0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < cols; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    const id = setInterval(draw, 45);
    return () => { clearInterval(id); window.removeEventListener('resize', resize); };
  }

  const bootCanvas = document.getElementById('matrix-canvas');
  const heroCanvas = document.getElementById('hero-matrix');
  if (bootCanvas) startMatrixRain(bootCanvas, { color: '#6fcf97', fontSize: 18 });
  if (heroCanvas) startMatrixRain(heroCanvas, { color: '#6fb3c9', fontSize: 16 });

  /* =========================================================
     TYPEWRITER ROLE ROTATOR
     ========================================================= */
  const roleTextEl = document.getElementById('role-text');
  let typewriterTimer = null;

  function typewriterLoop(lang) {
    const words = ROLES[lang];
    let wordIndex = 0, charIndex = 0, deleting = false;

    function tick() {
      const word = words[wordIndex];
      if (!deleting) {
        charIndex++;
        roleTextEl.textContent = word.slice(0, charIndex);
        if (charIndex === word.length) {
          deleting = true;
          typewriterTimer = setTimeout(tick, 1400);
          return;
        }
      } else {
        charIndex--;
        roleTextEl.textContent = word.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }
      }
      typewriterTimer = setTimeout(tick, deleting ? 45 : 90);
    }
    tick();
  }

  function restartTypewriter(lang) {
    clearTimeout(typewriterTimer);
    if (roleTextEl) typewriterLoop(lang);
  }
  restartTypewriter(html.classList.contains('lang-en') ? 'en' : 'ar');

  /* =========================================================
     NAV: burger menu + scroll spy
     ========================================================= */
  const navLinks = document.getElementById('nav-links');
  const burger = document.getElementById('nav-burger');
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  const sections = document.querySelectorAll('main .section');
  const navAnchors = document.querySelectorAll('.nav-link');
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => a.classList.toggle('active', a.dataset.section === id));
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  sections.forEach(s => spyObserver.observe(s));

  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */
  document.querySelectorAll('.pixel-box, .trophy-card, .project-card').forEach(el => el.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* =========================================================
     SKILL STAT BARS
     ========================================================= */
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        const value = row.dataset.value || 0;
        const fill = row.querySelector('.stat-fill');
        if (fill) fill.style.width = value + '%';
        statObserver.unobserve(row);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stat-row').forEach(row => statObserver.observe(row));

  /* =========================================================
     TOAST
     ========================================================= */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* =========================================================
     CONTACT FORM (front-end only demo)
     ========================================================= */
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const isEn = html.classList.contains('lang-en');
    const msg = isEn
      ? '> MESSAGE READY — connect a backend or use the email link to actually send it.'
      : '> الرسالة جاهزة — اربط النموذج بخادم أو استخدم رابط البريد لإرسالها فعليًا.';
    formStatus.textContent = msg;
    showToast(isEn ? 'ACHIEVEMENT UNLOCKED: Message Drafted' : 'إنجاز جديد: تم تجهيز الرسالة');
    form.reset();
  });

  
  /* =========================================================
     KONAMI CODE EASTER EGG
     ========================================================= */
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiProgress = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konami[konamiProgress]) {
      konamiProgress++;
      if (konamiProgress === konami.length) {
        konamiProgress = 0;
        const isEn = html.classList.contains('lang-en');
        showToast(isEn ? '🛡️ HACKER MODE UNLOCKED' : '🛡️ تم تفعيل وضع الهاكر');
      }
    } else {
      konamiProgress = key === konami[0] ? 1 : 0;
    }
  });

  /* =========================================================
     FOOTER YEAR
     ========================================================= */
  document.getElementById('year').textContent = new Date().getFullYear();

})();
