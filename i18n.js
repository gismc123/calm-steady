/* ============================================================
   CALM DOWN — i18n MODULE
   Loads locale JSON, applies data-i18n attributes, exposes t()
   ============================================================ */
(function () {
  const SUPPORTED = ['en', 'es'];
  let strings = {};
  let fallbackStrings = {};

  function getLang() {
    const saved = localStorage.getItem('calm-lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || '').split('-')[0];
    if (SUPPORTED.includes(nav)) return nav;
    return 'en';
  }

  function t(key) {
    return strings[key] ?? fallbackStrings[key] ?? key;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n);
      if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = t(el.dataset.i18nHtml);
      if (val) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const val = t(el.dataset.i18nAria);
      if (val) el.setAttribute('aria-label', val);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = t(el.dataset.i18nTitle);
      if (val) el.title = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = t(el.dataset.i18nPlaceholder);
      if (val) el.placeholder = val;
    });
    // Update lang toggle button label
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) btn.textContent = getCurrentLang() === 'es' ? 'EN' : 'ES';
  }

  function getCurrentLang() {
    return localStorage.getItem('calm-lang') || getLang();
  }

  async function fetchLocale(lang) {
    const res = await fetch(`./locales/${lang}.json`);
    if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
    return res.json();
  }

  let resolveReady;
  window.i18nReady = new Promise(resolve => { resolveReady = resolve; });

  async function loadAndApply(lang) {
    try {
      if (!fallbackStrings['header.wordmark']) {
        fallbackStrings = await fetchLocale('en');
      }
      if (lang === 'en') {
        strings = fallbackStrings;
      } else {
        strings = await fetchLocale(lang);
      }
    } catch (e) {
      strings = fallbackStrings;
    }
    document.documentElement.lang = lang;
    applyTranslations();
    if (resolveReady) {
      resolveReady();
      resolveReady = null;
    }
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    localStorage.setItem('calm-lang', lang);
    loadAndApply(lang);
  }

  window.t = t;
  window.setLang = setLang;
  window.applyTranslations = applyTranslations;
  window.getCurrentLang = getCurrentLang;

  document.addEventListener('DOMContentLoaded', () => {
    const lang = getLang();
    loadAndApply(lang);

    const toggleBtn = document.getElementById('btn-lang-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        setLang(getCurrentLang() === 'es' ? 'en' : 'es');
      });
    }
  });
})();
