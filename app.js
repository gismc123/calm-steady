/* ============================================================
   CALM DOWN APP — MAIN LOGIC
   ============================================================ */

// ============================================================
// CONSTANTS & DATA
// ============================================================

const CATEGORIES = [
  { id: 'physical',  badgeClass: 'badge--physical' },
  { id: 'mental',    badgeClass: 'badge--mental' },
  { id: 'emotional', badgeClass: 'badge--emotional' },
  { id: 'spiritual', badgeClass: 'badge--spiritual' }
];

const TOOLS = [
  { id: 'box-breathing',       categories: ['physical', 'mental'],    time: '3–4 min',   stressWeight: { high: 10, moderate: 8, low: 6 } },
  { id: 'full-trunk-breathing', categories: ['physical', 'mental'],   time: '2–3 min',   stressWeight: { high: 8, moderate: 7, low: 5 } },
  { id: 'growth-mindset',      categories: ['mental'],                time: '3–5 min',   stressWeight: { high: 3, moderate: 8, low: 9 } },
  { id: 'habit-loop',          categories: ['mental'],                time: '5–7 min',   stressWeight: { high: 2, moderate: 6, low: 9 } },
  { id: 'gratitude',           categories: ['emotional'],             time: '2–4 min',   stressWeight: { high: 5, moderate: 8, low: 9 } },
  { id: 'name-the-lie',        categories: ['emotional', 'mental'],   time: '5–8 min',   stressWeight: { high: 3, moderate: 7, low: 8 } },
  { id: 'resourcing',          categories: ['emotional'],             time: '3–5 min',   stressWeight: { high: 7, moderate: 8, low: 7 } },
  { id: 'mantra',              categories: ['spiritual'],             time: '2–3 min',   stressWeight: { high: 6, moderate: 7, low: 8 } },
  { id: 'prayer',              categories: ['spiritual'],             time: '2–5 min',   stressWeight: { high: 6, moderate: 7, low: 8 } },
  { id: 'values',              categories: ['spiritual'],             time: '4–6 min',   stressWeight: { high: 2, moderate: 5, low: 9 } },
  { id: 'sleep',               categories: ['physical'],              time: '2 min',     stressWeight: { high: 3, moderate: 5, low: 8 } },
  { id: 'movement',            categories: ['physical'],              time: '2 min',     stressWeight: { high: 7, moderate: 7, low: 6 } },
  { id: 'journaling',          categories: ['emotional'],             time: '5–10 min',  stressWeight: { high: 3, moderate: 6, low: 9 } },
  { id: 'grounding',           categories: ['mental', 'physical'],   time: '2–3 min',   stressWeight: { high: 9, moderate: 7, low: 4 } },
  { id: 'nutrition',           categories: ['physical'],              time: '2 min',     stressWeight: { high: 3, moderate: 5, low: 8 } },
  { id: 'mindfulness',         categories: ['mental', 'emotional'],  time: '3–5 min',   stressWeight: { high: 5, moderate: 8, low: 7 } }
];

// Faith-based and universal affirmation key indices for t()
const AFFIRMATION_COUNTS = { faith: 6, universal: 10 };

// ============================================================
// STATE
// ============================================================

const state = {
  stressLevel: null,
  sessionStartLevel: null,
  currentStressLevel: null,
  stressHistory: [],
  toolsUsed: [],
  selectedCategories: [],
  safetyShown: false,
  currentTool: null,
  recommendedToolIds: [],
  activeTimers: [],
  quickSession: false,
  sessionResponses: []
};

// ============================================================
// UTILITIES
// ============================================================

function $(id) { return document.getElementById(id); }

function clearTimers() {
  state.activeTimers.forEach(id => clearInterval(id));
  state.activeTimers = [];
}

function addTimer(id) {
  state.activeTimers.push(id);
  return id;
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0
    ? `${m}:${String(sec).padStart(2, '0')}`
    : `${sec}s`;
}

function stressBand(level) {
  if (level >= 7) return 'high';
  if (level >= 4) return 'moderate';
  return 'low';
}

// ============================================================
// DOWNLOAD UTILITY
// ============================================================

function downloadText(filename, content) {
  const toolId = state.currentTool;
  if (toolId && !state.sessionResponses.some(r => r.toolId === toolId)) {
    state.sessionResponses.push({ toolId, filename, content });
  }
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function captureCurrentToolTextareas() {
  if (!state.currentTool) return;
  if (state.sessionResponses.some(r => r.toolId === state.currentTool)) return;
  const container = $('tool-container');
  if (!container) return;
  const filled = [...container.querySelectorAll('textarea')].filter(ta => ta.value.trim());
  if (filled.length === 0) return;
  const toolName = t('tools.' + state.currentTool + '.name') || state.currentTool;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let text = `Calm Down — ${toolName}\n${date}\n\n${'='.repeat(44)}\n\n`;
  filled.forEach(ta => {
    const prev = ta.previousElementSibling;
    const question = prev?.textContent?.trim() || 'Your response';
    text += `${question}\n\n${ta.value.trim()}\n\n${'-'.repeat(44)}\n\n`;
  });
  text += 'Privacy note: This file was created entirely on your device.\nNo data was saved, recorded, or transmitted by Calm Down.';
  state.sessionResponses.push({
    toolId: state.currentTool,
    filename: `calm-down-${state.currentTool}.txt`,
    content: text
  });
}

function buildSessionSummaryText() {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  let text = `Calm Down — Session Summary\n${date} at ${time}\n\n${'='.repeat(44)}\n\n`;

  const start = state.sessionStartLevel;
  const end = state.currentStressLevel || state.stressLevel;
  if (start) {
    text += `STRESS JOURNEY\n`;
    text += `Started: ${start}/10\n`;
    if (end) {
      text += `Ended:   ${end}/10\n`;
      const diff = start - end;
      if (diff > 0)      text += `Shift:   ↓ ${diff} point${diff !== 1 ? 's' : ''}\n`;
      else if (diff < 0) text += `Shift:   ↑ ${Math.abs(diff)} point${Math.abs(diff) !== 1 ? 's' : ''}\n`;
    }
    text += `\n${'-'.repeat(44)}\n\n`;
  }

  if (state.toolsUsed.length > 0) {
    const names = state.toolsUsed.map(id => t('tools.' + id + '.name') || id).filter(Boolean);
    text += `TOOLS TRIED\n`;
    names.forEach(n => { text += `• ${n}\n`; });
    text += `\n${'-'.repeat(44)}\n\n`;
  }

  if (state.sessionResponses.length > 0) {
    text += `YOUR WRITTEN RESPONSES\n\n`;
    state.sessionResponses.forEach(r => {
      text += r.content;
      text += `\n\n${'='.repeat(44)}\n\n`;
    });
  } else {
    text += 'Privacy note: This file was created entirely on your device.\nNo data was saved, recorded, or transmitted by Calm Down.';
  }
  return text;
}

function renderSessionSummaryCard() {
  const card = $('session-summary-card');
  if (!card) return;
  const start = state.sessionStartLevel;
  const end = state.currentStressLevel || state.stressLevel;
  const toolNames = state.toolsUsed.map(id => t('tools.' + id + '.name') || id).filter(Boolean);
  let html = '';
  if (start) {
    const endLabel = end ? `${end}/10` : '–';
    const diff = end ? start - end : null;
    const shift = diff > 0 ? ` (↓ ${diff})` : diff < 0 ? ` (↑ ${Math.abs(diff)})` : '';
    html += `<div class="summary-row">
      <span class="summary-label">${t('summary.label.stress')}</span>
      <span class="summary-value">${start}/10 → ${endLabel}${shift}</span>
    </div>`;
  }
  if (toolNames.length > 0) {
    html += `<div class="summary-row">
      <span class="summary-label">${t('summary.label.tools')}</span>
      <span class="summary-value">${toolNames.join(', ')}</span>
    </div>`;
  }
  if (state.sessionResponses.length > 0) {
    const label = state.sessionResponses.length === 1
      ? t('summary.response.singular')
      : t('summary.response.plural').replace('{n}', state.sessionResponses.length);
    html += `<div class="summary-row">
      <span class="summary-label">${t('summary.label.written')}</span>
      <span class="summary-value">${label}</span>
    </div>`;
  }
  card.innerHTML = html || `<p style="color:var(--color-text-muted);font-size:14px;text-align:center;padding:8px 0">${t('summary.great-job')}</p>`;
}

function showSummaryPage() {
  $('overlay-done-page').classList.add('hidden');
  $('overlay-checkin-page').classList.add('hidden');
  $('overlay-summary-page').classList.remove('hidden');
  renderSessionSummaryCard();
}

function buildResponseText(toolName, entries) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let text = `Calm Down — ${toolName}\n${date}\n\n${'='.repeat(44)}\n\n`;
  entries.forEach(({ label, question, response }) => {
    if (label) text += `[${label}]\n`;
    text += `${question}\n\n`;
    text += (response && response.trim()) ? response.trim() : '(no response written)';
    text += `\n\n${'-'.repeat(44)}\n\n`;
  });
  text += 'Privacy note: This file was created entirely on your device.\n';
  text += 'No data was saved, recorded, or transmitted by Calm Down.';
  return text;
}

function renderDownloadBlock(btnId) {
  return `
    <button class="btn--download-responses" id="${btnId}">${t('download.btn')}</button>
    <p class="download-privacy-note">${t('download.privacy')}</p>
  `;
}

// ============================================================
// INSTALL MODAL
// ============================================================

function showInstallModal() {
  const modal = $('install-modal');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function hideInstallModal() {
  const modal = $('install-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  localStorage.setItem('calm-install-seen', '1');
}

function initInstallModal() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (isStandalone) {
    const btn = $('btn-open-install-modal');
    if (btn) btn.style.display = 'none';
    return;
  }

  if (!localStorage.getItem('calm-install-seen')) {
    showInstallModal();
  }

  $('btn-open-install-modal').addEventListener('click', showInstallModal);
  $('btn-close-install-modal').addEventListener('click', hideInstallModal);
  $('btn-install-modal-ok').addEventListener('click', hideInstallModal);
  $('install-modal-backdrop').addEventListener('click', hideInstallModal);
}

// ============================================================
// LEGAL MODALS (Terms, Privacy, Attribution)
// ============================================================

function initLegalModals() {
  [
    { openId: 'btn-open-terms',       modalId: 'terms-modal',       closeId: 'btn-close-terms-modal',       okId: 'btn-terms-ok',       backdropId: 'terms-modal-backdrop' },
    { openId: 'btn-open-privacy',     modalId: 'privacy-modal',     closeId: 'btn-close-privacy-modal',     okId: 'btn-privacy-ok',     backdropId: 'privacy-modal-backdrop' },
    { openId: 'btn-open-attribution',        modalId: 'attribution-modal', closeId: 'btn-close-attribution-modal', okId: 'btn-attribution-ok', backdropId: 'attribution-modal-backdrop' },
    { openId: 'btn-open-attribution-footer', modalId: 'attribution-modal', closeId: 'btn-close-attribution-modal', okId: 'btn-attribution-ok', backdropId: 'attribution-modal-backdrop' },
    { openId: 'btn-open-version',     modalId: 'version-modal',     closeId: 'btn-close-version-modal',     okId: 'btn-version-ok',     backdropId: 'version-modal-backdrop' }
  ].forEach(({ openId, modalId, closeId, okId, backdropId }) => {
    const modal = $(modalId);
    const show = () => { modal.classList.remove('hidden'); modal.setAttribute('aria-hidden', 'false'); };
    const hide = () => { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); };
    $(openId).addEventListener('click', show);
    $(closeId).addEventListener('click', hide);
    $(okId).addEventListener('click', hide);
    $(backdropId).addEventListener('click', hide);
  });

  $('btn-open-version').addEventListener('click', () => {
    const meta = document.querySelector('meta[name="app-version"]');
    const version = (meta && meta.content && meta.content !== '__APP_VERSION__')
      ? meta.content
      : 'calm-down-v1.0-dev';
    $('build-version-string').textContent = version;
  });
}

// ============================================================
// THEME
// ============================================================

function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('theme-swatch--active', s.dataset.theme === name);
  });
  localStorage.setItem('calm-theme', name);
}

function initTheme() {
  const saved = localStorage.getItem('calm-theme') || 'midnight';
  applyTheme(saved);
  document.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => applyTheme(swatch.dataset.theme));
  });
}

// ============================================================
// SCREEN NAVIGATION
// ============================================================

const SCREENS = ['screen-checkin', 'screen-safety', 'screen-categories', 'screen-plan', 'screen-tool'];

function showScreen(id) {
  clearTimers();
  SCREENS.forEach(sid => {
    const el = $(sid);
    if (sid === id) {
      el.classList.add('screen--active');
      el.scrollTop = 0;
    } else {
      el.classList.remove('screen--active');
    }
  });
}

// ============================================================
// SCREEN 1: STRESS CHECK-IN
// ============================================================

function initStressScale() {
  const container = $('scale-numbers');
  container.innerHTML = '';

  for (let i = 1; i <= 10; i++) {
    const range = i <= 3 ? 'low' : i <= 6 ? 'mid' : 'high';
    const btn = document.createElement('button');
    btn.className = 'stress-btn';
    btn.setAttribute('data-level', i);
    btn.setAttribute('data-range', range);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.setAttribute('aria-label', t('stress.level.aria').replace('{level}', i));
    btn.textContent = i;
    btn.addEventListener('click', () => selectStress(i));
    container.appendChild(btn);
  }
}

function selectStress(level) {
  state.stressLevel = level;

  document.querySelectorAll('.stress-btn').forEach(btn => {
    const isSelected = Number(btn.dataset.level) === level;
    btn.classList.toggle('stress-btn--selected', isSelected);
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });

  $('stress-description').textContent = t('stress.desc.' + level);

  const continueBtn = $('btn-continue-checkin');
  continueBtn.disabled = false;
  continueBtn.removeAttribute('aria-disabled');
}

function handleContinueCheckin() {
  if (!state.stressLevel) return;

  if (state.stressLevel >= 8 && !state.safetyShown) {
    showScreen('screen-safety');
  } else {
    showScreen('screen-categories');
    renderCategories();
  }
}

// ============================================================
// SAFETY INTERSTITIAL
// ============================================================

function handleSafetyOk() {
  state.safetyShown = true;
  showScreen('screen-categories');
  renderCategories();
}

// ============================================================
// SCREEN 2: CATEGORY SELECTION
// ============================================================

function renderCategories() {
  const grid = $('category-grid');
  grid.innerHTML = '';
  state.selectedCategories = [];
  updateBuildPlanBtn();

  CATEGORIES.forEach(cat => {
    const card = document.createElement('button');
    card.className = `category-card cat-${cat.id}`;
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', t('category.' + cat.id + '.label'));
    card.dataset.catId = cat.id;

    card.innerHTML = `
      <span class="category-card__title">
        <span class="category-checkmark"></span>
        ${t('category.' + cat.id + '.label')}
      </span>
      <span class="category-card__desc">${t('category.' + cat.id + '.desc')}</span>
    `;

    card.addEventListener('click', () => toggleCategory(cat.id));
    grid.appendChild(card);
  });
}

function toggleCategory(id) {
  const idx = state.selectedCategories.indexOf(id);
  if (idx === -1) {
    state.selectedCategories.push(id);
  } else {
    state.selectedCategories.splice(idx, 1);
  }

  document.querySelectorAll('.category-card').forEach(card => {
    const isSelected = state.selectedCategories.includes(card.dataset.catId);
    card.classList.toggle('category-card--selected', isSelected);
    card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

    const check = card.querySelector('.category-checkmark');
    check.textContent = isSelected ? '✓' : '';
  });

  updateBuildPlanBtn();
}

function updateBuildPlanBtn() {
  const btn = $('btn-build-plan');
  const hasSelection = state.selectedCategories.length > 0;
  btn.disabled = !hasSelection;
  btn.setAttribute('aria-disabled', hasSelection ? 'false' : 'true');
}

function handleBuildPlan() {
  if (state.selectedCategories.length === 0) return;
  if (state.sessionStartLevel === null) {
    state.sessionStartLevel = state.stressLevel;
    state.currentStressLevel = state.stressLevel;
  }
  renderPlan();
  showScreen('screen-plan');
}

// ============================================================
// SCREEN 3: CALM-DOWN PLAN
// ============================================================

function getRecommendedTools() {
  const band = stressBand(state.stressLevel);

  const scored = TOOLS.map(tool => {
    let score = tool.stressWeight[band];
    const matched = tool.categories.filter(c => state.selectedCategories.includes(c)).length;
    score += matched * 4;
    return { ...tool, score };
  });

  if (band === 'high') {
    const bb = scored.find(t => t.id === 'box-breathing');
    if (bb) bb.score = 999;
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function renderToolCardHTML(tool) {
  const badgesHTML = tool.categories
    .map(catId => `<span class="badge badge--${catId}">${t('tool.' + catId + '.badge')}</span>`)
    .join('');

  const toolName = t('tools.' + tool.id + '.name');
  return `
    <button class="tool-card" data-tool-id="${tool.id}" role="listitem" aria-label="${t('tool.start.aria').replace('{name}', toolName)}">
      <div class="tool-card__header">
        <span class="tool-card__name">${toolName}</span>
        <span class="tool-card__time">${t('tools.' + tool.id + '.time')}</span>
      </div>
      <div class="tool-card__badges">${badgesHTML}</div>
      <p class="tool-card__desc">${t('tools.' + tool.id + '.desc')}</p>
      <span class="tool-card__arrow">→</span>
    </button>
  `;
}

function renderPlan() {
  const allSorted = getRecommendedTools();
  const recommended = allSorted.slice(0, 5);
  const others = allSorted.slice(5);

  state.recommendedToolIds = recommended.map(t => t.id);

  const recContainer = $('recommended-tools');
  recContainer.innerHTML = recommended.map(renderToolCardHTML).join('');

  const otherContainer = $('other-tools-list');
  otherContainer.innerHTML = others.map(renderToolCardHTML).join('');

  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      selectTool(card.dataset.toolId);
    });
  });

  const toggle = $('other-tools-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  otherContainer.classList.add('hidden');
  toggle.querySelector('.toggle-chevron').style.transform = '';

  renderSuggestedTool();
  renderNextTools();
  renderProgressPanel();
}

function selectTool(toolId) {
  state.currentTool = toolId;
  if (!state.toolsUsed.includes(toolId)) {
    state.toolsUsed.push(toolId);
  }
  renderTool(toolId);
  showScreen('screen-tool');
}

function renderNextTools() {
  const panel = $('next-tools-panel');
  if (!panel) return;

  if (!state.stressLevel) {
    panel.classList.add('hidden');
    return;
  }

  const suggestion = getCurrentSuggestion();
  const allSorted = getRecommendedTools();
  const next = allSorted.filter(tool => tool.id !== suggestion?.id).slice(0, 3);

  if (next.length === 0) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');
  panel.innerHTML = `
    <hr class="next-tools-divider">
    <p class="next-tools-heading">${t('plan.next-tools.heading')}</p>
    <div class="next-tools-list">
      ${next.map(tool => {
        const badgesHTML = tool.categories.map(catId =>
          `<span class="badge badge--${catId}" style="font-size:10px;padding:2px 7px">${t('tool.' + catId + '.badge')}</span>`
        ).join('');
        const toolName = t('tools.' + tool.id + '.name');
        return `
          <button class="next-tool-card" data-tool-id="${tool.id}" aria-label="${t('tool.start.aria').replace('{name}', toolName)}">
            <div class="next-tool-info">
              <span class="next-tool-name">${toolName}</span>
              <div class="next-tool-badges">${badgesHTML}</div>
            </div>
            <span class="next-tool-time">${t('tools.' + tool.id + '.time')}</span>
            <span class="next-tool-arrow">→</span>
          </button>`;
      }).join('')}
    </div>
  `;

  panel.querySelectorAll('.next-tool-card').forEach(card => {
    card.addEventListener('click', () => selectTool(card.dataset.toolId));
  });
}

// ============================================================
// SCREEN 4: TOOL EXPERIENCE
// ============================================================

function renderTool(toolId) {
  const container = $('tool-container');
  container.innerHTML = '';

  const renderers = {
    'box-breathing':       renderBoxBreathing,
    'full-trunk-breathing': renderFullTrunkBreathing,
    'growth-mindset':      renderGrowthMindset,
    'habit-loop':          renderHabitLoop,
    'gratitude':           renderGratitude,
    'name-the-lie':        renderNameTheLie,
    'resourcing':          renderResourcing,
    'mantra':              renderMantra,
    'prayer':              renderPrayer,
    'values':              renderValues,
    'sleep':               renderSleep,
    'movement':            renderMovement,
    'journaling':          renderJournaling,
    'grounding':           renderGrounding,
    'nutrition':           renderNutrition,
    'mindfulness':         renderMindfulness
  };

  const renderer = renderers[toolId];
  if (renderer) renderer(container);
}

// ============================================================
// TOOL 1: BOX BREATHING
// ============================================================

function renderBoxBreathing(container) {
  let extendedExhale = false;
  let totalRounds = 4;
  let roundsCompleted = 0;
  let phaseIndex = 0;
  let count = 4;
  let sessionRunning = true;
  let currentPhases = buildPhases(false);

  function buildPhases(extended) {
    return [
      { name: t('box-breathing.phase.inhale'), duration: 4, cssClass: 'phase-inhale' },
      { name: t('box-breathing.phase.hold'),   duration: 4, cssClass: 'phase-hold-top' },
      { name: t('box-breathing.phase.exhale'), duration: extended ? 6 : 4, cssClass: extended ? 'phase-exhale-long' : 'phase-exhale' },
      { name: t('box-breathing.phase.hold'),   duration: 4, cssClass: 'phase-hold-bottom' }
    ];
  }

  container.innerHTML = `
    <div class="tool-header">
      <h2 class="tool-title">${t('box-breathing.title')}</h2>
      <p class="tool-subtitle">${t('box-breathing.subtitle')}</p>
    </div>

    <div class="breath-stage">
      <p class="breath-round-label" id="round-label">${t('box-breathing.round').replace('{n}', 1).replace('{total}', totalRounds)}</p>
      <div class="breath-wrapper">
        <div class="breath-glow"></div>
        <div class="breath-circle phase-hold-bottom" id="breath-circle">
          <span class="breath-count" id="breath-count">4</span>
          <span class="breath-phase-label" id="phase-label">${t('box-breathing.ready')}</span>
        </div>
      </div>
    </div>

    <div id="breath-complete" class="breath-complete hidden">
      <p class="breath-complete-msg"></p>
      <button class="btn--keep-going" id="btn-keep-going">${t('box-breathing.keep-going')}</button>
    </div>

    <label class="breath-mode-toggle" id="mode-toggle-label" style="margin-top:24px">
      <div class="toggle-switch" id="exhale-toggle"></div>
      <span class="toggle-label">${t('box-breathing.extended-exhale')}</span>
    </label>

    <div class="breath-coaching">
      ${t('box-breathing.coaching')}
    </div>
  `;

  const circle    = $('breath-circle');
  const countEl   = $('breath-count');
  const phaseEl   = $('phase-label');
  const roundEl   = $('round-label');
  const completeEl = $('breath-complete');
  const toggleEl  = $('exhale-toggle');

  function updateCircle() {
    const phase = currentPhases[phaseIndex];
    circle.className = 'breath-circle ' + phase.cssClass;
    phaseEl.textContent = phase.name;
    countEl.textContent = count;
  }

  function nextPhase() {
    phaseIndex = (phaseIndex + 1) % currentPhases.length;
    if (phaseIndex === 0) {
      roundsCompleted++;
      if (roundsCompleted >= totalRounds) {
        endSession();
        return;
      }
      roundEl.textContent = t('box-breathing.round').replace('{n}', roundsCompleted + 1).replace('{total}', totalRounds);
    }
    count = currentPhases[phaseIndex].duration;
    updateCircle();
  }

  function endSession() {
    sessionRunning = false;
    clearTimers();
    circle.className = 'breath-circle phase-hold-top';
    phaseEl.textContent = '';
    countEl.textContent = '✓';
    completeEl.classList.remove('hidden');
    const s = totalRounds !== 1 ? 's' : '';
    completeEl.querySelector('.breath-complete-msg').textContent =
      t('box-breathing.complete.msg').replace('{n}', totalRounds).replace('{s}', s);
  }

  setTimeout(() => {
    phaseIndex = 0;
    count = currentPhases[0].duration;
    roundEl.textContent = t('box-breathing.round').replace('{n}', 1).replace('{total}', totalRounds);
    updateCircle();

    const tickId = setInterval(() => {
      if (!sessionRunning) return;
      count--;
      if (count <= 0) {
        nextPhase();
      } else {
        countEl.textContent = count;
      }
    }, 1000);
    addTimer(tickId);
  }, 800);

  document.getElementById('mode-toggle-label').addEventListener('click', () => {
    extendedExhale = !extendedExhale;
    toggleEl.classList.toggle('toggle-switch--on', extendedExhale);
    currentPhases = buildPhases(extendedExhale);
  });

  $('btn-keep-going').addEventListener('click', () => {
    totalRounds += 4;
    sessionRunning = true;
    phaseIndex = 0;
    count = currentPhases[0].duration;
    roundEl.textContent = t('box-breathing.round').replace('{n}', roundsCompleted + 1).replace('{total}', totalRounds);
    completeEl.classList.add('hidden');
    updateCircle();

    const tickId = setInterval(() => {
      if (!sessionRunning) return;
      count--;
      if (count <= 0) {
        nextPhase();
      } else {
        countEl.textContent = count;
      }
    }, 1000);
    addTimer(tickId);
  });
}

// ============================================================
// TOOL 2: FULL TRUNK DEEP BREATHING
// ============================================================

function renderFullTrunkBreathing(container) {
  let exhaleLen = 4;
  let cycleCount = 0;
  const totalCycles = 4;

  const timedPhases = () => [
    { label: t('ftb.phase.inhale'),    duration: 4,        cssClass: 'phase-inhale' },
    { label: t('ftb.phase.hold-top'),  duration: 4,        cssClass: 'phase-hold-top' },
    { label: t('ftb.phase.exhale'),    duration: exhaleLen, cssClass: exhaleLen === 6 ? 'phase-exhale-long' : 'phase-exhale' },
    { label: t('ftb.phase.hold-empty'), duration: 4,       cssClass: 'phase-hold-bottom' }
  ];

  container.innerHTML = `
    <div class="tool-header">
      <h2 class="tool-title">${t('ftb.title')}</h2>
      <p class="tool-subtitle">${t('ftb.subtitle')}</p>
    </div>

    <div id="ftb-text-step" style="margin-bottom:24px">
      <div class="step-card">
        <p class="step-number">${t('ftb.step.label').replace('{n}', 1)}</p>
        <p class="step-text" id="ftb-step-text">${t('ftb.step1')}</p>
      </div>
    </div>

    <div id="ftb-timed-stage" class="breath-stage hidden">
      <p class="breath-round-label" id="ftb-cycle-label">${t('ftb.cycle').replace('{n}', 1).replace('{total}', totalCycles)}</p>
      <div class="breath-wrapper">
        <div class="breath-glow"></div>
        <div class="breath-circle phase-hold-bottom" id="ftb-circle">
          <span class="breath-count" id="ftb-count">4</span>
          <span class="breath-phase-label" id="ftb-phase">${t('box-breathing.ready')}</span>
        </div>
      </div>
      <p class="text-muted" style="font-size:13px;text-align:center;margin-top:8px">${t('ftb.tap-hint')}</p>
    </div>

    <div class="step-advance-area">
      <label class="breath-mode-toggle" id="ftb-exhale-toggle" style="margin-bottom:16px;display:none">
        <div class="toggle-switch" id="ftb-toggle-switch"></div>
        <span class="toggle-label">${t('ftb.exhale-toggle')}</span>
      </label>
      <button class="btn--advance" id="ftb-next-btn">${t('ftb.next')}</button>
      <p class="step-tap-hint" id="ftb-hint">${t('ftb.read-hint')}</p>
    </div>

    <div id="ftb-complete" class="affirmation-card hidden">
      <p class="affirmation-text">${t('ftb.complete')}</p>
    </div>
  `;

  const stepTextEl   = $('ftb-step-text');
  const textStageEl  = $('ftb-text-step');
  const timedStageEl = $('ftb-timed-stage');
  const circleEl     = $('ftb-circle');
  const countEl      = $('ftb-count');
  const phaseLabelEl = $('ftb-phase');
  const cycleEl      = $('ftb-cycle-label');
  const nextBtn      = $('ftb-next-btn');
  const hintEl       = $('ftb-hint');
  const exhausteLabel = $('ftb-exhale-toggle');
  const exhausteSw   = $('ftb-toggle-switch');
  const completeEl   = $('ftb-complete');

  const textStepKeys = ['ftb.step1', 'ftb.step2', 'ftb.step3'];
  let textStepIdx = 0;

  function showTextStep(idx) {
    stepTextEl.textContent = t(textStepKeys[idx]);
    textStageEl.querySelector('.step-number').textContent = t('ftb.step.label').replace('{n}', idx + 1);
  }

  function startTimedCycle() {
    timedStageEl.classList.remove('hidden');
    textStageEl.classList.add('hidden');
    exhausteLabel.style.display = 'flex';
    nextBtn.textContent = t('ftb.start-next');
    hintEl.textContent = t('ftb.hint-cycle').replace('{n}', cycleCount + 1).replace('{total}', totalCycles);
    cycleEl.textContent = t('ftb.cycle').replace('{n}', cycleCount + 1).replace('{total}', totalCycles);
    runTimedCycle();
  }

  function runTimedCycle() {
    const phases = timedPhases();
    let pi = 0;
    let c = phases[0].duration;
    nextBtn.disabled = true;

    circleEl.className = 'breath-circle ' + phases[0].cssClass;
    phaseLabelEl.textContent = phases[0].label;
    countEl.textContent = c;

    const id = setInterval(() => {
      c--;
      if (c <= 0) {
        pi = (pi + 1) % phases.length;
        if (pi === 0) {
          clearInterval(id);
          cycleCount++;
          if (cycleCount >= totalCycles) {
            circleEl.className = 'breath-circle phase-hold-top';
            countEl.textContent = '✓';
            phaseLabelEl.textContent = '';
            cycleEl.textContent = t('ftb.cycle.complete');
            nextBtn.classList.add('hidden');
            completeEl.classList.remove('hidden');
          } else {
            cycleEl.textContent = t('ftb.cycle').replace('{n}', cycleCount + 1).replace('{total}', totalCycles);
            hintEl.textContent = t('ftb.hint-cycle').replace('{n}', cycleCount + 1).replace('{total}', totalCycles);
            nextBtn.disabled = false;
            nextBtn.textContent = t('ftb.start-cycle-n').replace('{n}', cycleCount + 1);
          }
          return;
        }
        c = phases[pi].duration;
        circleEl.className = 'breath-circle ' + phases[pi].cssClass;
        phaseLabelEl.textContent = phases[pi].label;
        countEl.textContent = c;
      } else {
        countEl.textContent = c;
      }
    }, 1000);
    addTimer(id);
  }

  nextBtn.addEventListener('click', () => {
    if (textStepIdx < textStepKeys.length - 1) {
      textStepIdx++;
      showTextStep(textStepIdx);
    } else if (textStepIdx === textStepKeys.length - 1 && cycleCount === 0) {
      startTimedCycle();
    } else if (!nextBtn.disabled) {
      runTimedCycle();
    }
  });

  exhausteLabel.addEventListener('click', () => {
    exhaleLen = exhaleLen === 4 ? 6 : 4;
    exhausteSw.classList.toggle('toggle-switch--on', exhaleLen === 6);
  });
}

// ============================================================
// TOOL 3: GROWTH MINDSET REFRAME
// ============================================================

function renderGrowthMindset(container) {
  const promptKeys = [
    { q: 'growth.q1', hint: 'growth.q1.hint' },
    { q: 'growth.q2' },
    { q: 'growth.q3' },
    { q: 'growth.q4' },
    { q: 'growth.q5' }
  ];

  let step = 0;
  const responses = [];

  function render() {
    const isLast = step === promptKeys.length;
    const hasContent = responses.some(r => r.trim());
    const q = !isLast ? t(promptKeys[step].q) : '';
    const hint = !isLast && promptKeys[step].hint ? t(promptKeys[step].hint) : '';
    container.innerHTML = `
      <div class="tool-header">
        <h2 class="tool-title">${t('growth.title')}</h2>
        <p class="tool-subtitle">${t('growth.subtitle')}</p>
      </div>
      ${!isLast ? `
        <div class="step-card" style="margin-bottom:20px">
          <p class="step-number">${t('growth.q.label').replace('{n}', step + 1).replace('{total}', promptKeys.length)}</p>
          <p class="step-prompt">${q}</p>
          ${hint ? `<p class="step-subtext">${hint}</p>` : ''}
        </div>
        <textarea class="tool-input" placeholder="${t('growth.placeholder')}" rows="4"></textarea>
        <button class="btn--advance mt-md" id="gm-next">
          ${step < promptKeys.length - 1 ? t('growth.next') : t('growth.finish')}
        </button>
      ` : `
        <div class="affirmation-card">
          <p class="affirmation-text">${t('growth.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('gm-download') : ''}
        </div>
      `}
    `;
    if (!isLast) {
      $('gm-next').addEventListener('click', () => {
        const ta = container.querySelector('textarea');
        responses.push(ta ? ta.value : '');
        step++;
        render();
      });
    }
    const dlBtn = $('gm-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadText('calm-down-growth-mindset.txt', buildResponseText(
          t('growth.title'),
          promptKeys.map((p, i) => ({ label: t('growth.q.label').replace('{n}', i + 1).replace('{total}', promptKeys.length), question: t(p.q), response: responses[i] || '' }))
        ));
      });
    }
  }
  render();
}

// ============================================================
// TOOL 4: HABIT LOOP AUDIT
// ============================================================

function renderHabitLoop(container) {
  const stepDefs = [
    { label: 'habit.trigger.label',     q: 'habit.trigger.q',     hint: 'habit.trigger.hint' },
    { label: 'habit.behavior.label',    q: 'habit.behavior.q' },
    { label: 'habit.result.label',      q: 'habit.result.q' },
    { label: 'habit.replacement.label', q: 'habit.replacement.q' }
  ];

  let step = 0;
  const responses = [];

  function render() {
    const isLast = step === stepDefs.length;
    const hasContent = responses.some(r => r.trim());
    container.innerHTML = `
      <div class="tool-header">
        <h2 class="tool-title">${t('habit.title')}</h2>
        ${step === 0 ? `
          <div class="step-card" style="margin-bottom:20px">
            <p class="step-text">${t('habit.intro')}</p>
          </div>
        ` : ''}
      </div>
      ${!isLast ? `
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t(stepDefs[step].label)}</p>
          <p class="step-prompt" style="font-size:20px">${t(stepDefs[step].q)}</p>
          ${stepDefs[step].hint ? `<p class="step-subtext">${t(stepDefs[step].hint)}</p>` : ''}
        </div>
        <textarea class="tool-input" placeholder="${t('habit.placeholder')}" rows="4"></textarea>
        <button class="btn--advance mt-md" id="hl-next">
          ${step < stepDefs.length - 1 ? t('habit.next') : t('habit.finish')}
        </button>
      ` : `
        <div class="affirmation-card">
          <p class="affirmation-text">${t('habit.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('hl-download') : ''}
        </div>
      `}
    `;
    if (!isLast) {
      $('hl-next').addEventListener('click', () => {
        const ta = container.querySelector('textarea');
        responses.push(ta ? ta.value : '');
        step++;
        render();
      });
    }
    const dlBtn = $('hl-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadText('calm-down-habit-loop.txt', buildResponseText(
          t('habit.title'),
          stepDefs.map((s, i) => ({ label: t(s.label), question: t(s.q), response: responses[i] || '' }))
        ));
      });
    }
  }
  render();
}

// ============================================================
// TOOL 5: GRATITUDE / FOCUS ON THE GOOD
// ============================================================

function renderGratitude(container) {
  const questionKeys = ['gratitude.q1', 'gratitude.q2', 'gratitude.q3'];

  let step = 0;
  const responses = [];

  function render() {
    const isLast = step === questionKeys.length;
    const hasContent = responses.some(r => r.trim());
    container.innerHTML = `
      <div class="tool-header">
        <h2 class="tool-title">${t('gratitude.title')}</h2>
        ${step === 0 ? `<p class="step-framing">${t('gratitude.framing')}</p>` : ''}
      </div>
      ${!isLast ? `
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('gratitude.q.label').replace('{n}', step + 1).replace('{total}', questionKeys.length)}</p>
          <p class="step-prompt">${t(questionKeys[step])}</p>
        </div>
        <textarea class="tool-input" placeholder="${t('gratitude.placeholder')}" rows="4"></textarea>
        <button class="btn--advance mt-md" id="gr-next">
          ${step < questionKeys.length - 1 ? t('gratitude.next') : t('gratitude.finish')}
        </button>
      ` : `
        <div class="affirmation-card">
          <p class="affirmation-text">${t('gratitude.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('gr-download') : ''}
        </div>
      `}
    `;
    if (!isLast) {
      $('gr-next').addEventListener('click', () => {
        const ta = container.querySelector('textarea');
        responses.push(ta ? ta.value : '');
        step++;
        render();
      });
    }
    const dlBtn = $('gr-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadText('calm-down-gratitude.txt', buildResponseText(
          t('gratitude.title'),
          questionKeys.map((k, i) => ({ label: t('gratitude.q.label').replace('{n}', i + 1).replace('{total}', questionKeys.length), question: t(k), response: responses[i] || '' }))
        ));
      });
    }
  }
  render();
}

// ============================================================
// TOOL 6: NAME THE LIE, SAY THE TRUTH
// ============================================================

function renderNameTheLie(container) {
  let step = 0;
  let pauseCount = 30;
  let pauseRunning = false;
  const responses = { step0: '', step2: '', step3: '' };

  function render() {
    if (step === 0) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('ntl.title')}</h2>
          <p class="step-framing" style="margin-top:12px">${t('ntl.framing')}</p>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('ntl.step1.label')}</p>
          <p class="step-prompt" style="font-size:20px">${t('ntl.step1.q')}</p>
        </div>
        <textarea class="tool-input" placeholder="${t('ntl.step1.placeholder')}" rows="4" id="ntl-input-1"></textarea>
        <button class="btn--advance mt-md" id="ntl-next">${t('ntl.next')}</button>
      `;
      $('ntl-next').addEventListener('click', () => {
        responses.step0 = $('ntl-input-1')?.value || '';
        step++;
        render();
      });

    } else if (step === 1) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('ntl.title')}</h2>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('ntl.step2.label')}</p>
          <p class="step-prompt" style="font-size:20px">${t('ntl.step2.q')}</p>
          <p class="step-subtext">${t('ntl.step2.sub')}</p>
        </div>
        <div class="breath-stage" style="padding:16px 0">
          <div class="breath-wrapper" style="width:140px;height:140px">
            <div class="breath-glow"></div>
            <div class="breath-circle phase-inhale" id="ntl-pause-circle" style="width:110px;height:110px">
              <span class="breath-count" id="ntl-pause-count">${pauseCount}</span>
            </div>
          </div>
        </div>
        <button class="btn--advance" id="ntl-skip-pause">${t('ntl.skip')}</button>
      `;

      const circleEl = $('ntl-pause-circle');
      const countEl  = $('ntl-pause-count');
      pauseRunning = true;
      let c = pauseCount;

      const phases = [
        { cssClass: 'phase-inhale',      duration: 4 },
        { cssClass: 'phase-hold-top',    duration: 4 },
        { cssClass: 'phase-exhale',      duration: 4 },
        { cssClass: 'phase-hold-bottom', duration: 4 }
      ];
      let pi = 0, pc = phases[0].duration;
      circleEl.className = 'breath-circle ' + phases[0].cssClass;

      const id = setInterval(() => {
        if (!pauseRunning) return;
        c--;
        pc--;
        countEl.textContent = c;
        if (pc <= 0) {
          pi = (pi + 1) % phases.length;
          pc = phases[pi].duration;
          circleEl.className = 'breath-circle ' + phases[pi].cssClass;
        }
        if (c <= 0) {
          clearInterval(id);
          step++;
          render();
        }
      }, 1000);
      addTimer(id);

      $('ntl-skip-pause').addEventListener('click', () => {
        pauseRunning = false;
        clearTimers();
        step++;
        render();
      });

    } else if (step === 2) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('ntl.title')}</h2>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('ntl.step3.label')}</p>
          <p class="step-prompt" style="font-size:20px">${t('ntl.step3.q')}</p>
        </div>
        <textarea class="tool-input" placeholder="${t('ntl.step3.placeholder')}" rows="4"></textarea>
        <button class="btn--advance mt-md" id="ntl-next-3">${t('ntl.next')}</button>
      `;
      $('ntl-next-3').addEventListener('click', () => {
        responses.step2 = container.querySelector('textarea')?.value || '';
        step++;
        render();
      });

    } else if (step === 3) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('ntl.title')}</h2>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('ntl.step4.label')}</p>
          <p class="step-prompt" style="font-size:20px">${t('ntl.step4.q')}</p>
          <p class="step-subtext">${t('ntl.step4.sub')}</p>
        </div>
        <textarea class="tool-input" placeholder="${t('ntl.step4.placeholder')}" rows="5" id="ntl-truth"></textarea>
        <button class="btn--advance mt-md" id="ntl-finish">${t('ntl.finish')}</button>
      `;
      $('ntl-finish').addEventListener('click', () => {
        responses.step3 = $('ntl-truth')?.value || '';
        step++;
        render();
      });

    } else {
      const hasContent = Object.values(responses).some(r => r.trim());
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('ntl.title')}</h2>
        </div>
        <div class="affirmation-card">
          <p class="affirmation-text">${t('ntl.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('ntl-download') : ''}
        </div>
      `;
      const dlBtn = $('ntl-download');
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          downloadText('calm-down-name-the-lie.txt', buildResponseText(t('ntl.title'), [
            { label: t('ntl.step1.label'), question: t('ntl.step1.q'), response: responses.step0 },
            { label: t('ntl.step3.label'), question: t('ntl.step3.q'), response: responses.step2 },
            { label: t('ntl.step4.label'), question: t('ntl.step4.q'), response: responses.step3 }
          ]));
        });
      }
    }
  }
  render();
}

// ============================================================
// TOOL 7: RESOURCING / SAFE PLACE VISUALIZATION
// ============================================================

function renderResourcing(container) {
  const stepKeys = [
    'resourcing.step1',
    'resourcing.step2',
    'resourcing.step3',
    'resourcing.step4',
    'resourcing.step5',
    null
  ];

  let step = 0;

  function render() {
    if (step < stepKeys.length - 1) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('resourcing.title')}</h2>
          ${step === 0 ? `<p class="step-framing" style="margin-top:8px">${t('resourcing.framing')}</p>` : ''}
        </div>
        <div class="resourcing-step">
          <div class="resourcing-pulse"></div>
          <p class="resourcing-step-text">${t(stepKeys[step])}</p>
          <button class="btn--advance" id="res-next">
            ${step < stepKeys.length - 2 ? t('resourcing.continue') : t('resourcing.enter')}
          </button>
        </div>
      `;
      $('res-next').addEventListener('click', () => { step++; render(); });

    } else {
      let holdCount = 60;
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('resourcing.title')}</h2>
        </div>
        <div class="prayer-hold-screen">
          <div class="resourcing-pulse" style="width:140px;height:140px;margin-bottom:32px"></div>
          <div class="hold-timer" id="res-hold-count">${holdCount}</div>
          <p class="hold-label">${t('resourcing.hold.label')}</p>
        </div>
      `;

      const holdEl = $('res-hold-count');
      const id = setInterval(() => {
        holdCount--;
        holdEl.textContent = holdCount;
        if (holdCount <= 0) {
          clearInterval(id);
          container.innerHTML += `
            <div class="affirmation-card" style="margin-top:0;text-align:center">
              <p class="affirmation-text">${t('resourcing.affirmation')}</p>
            </div>
          `;
        }
      }, 1000);
      addTimer(id);
    }
  }
  render();
}

// ============================================================
// TOOL 8: POSITIVE MANTRA / SCRIPTURE AFFIRMATION
// ============================================================

function renderMantra(container) {
  let selectedMantra = '';
  let sessionTime = 120;

  const faithItems = Array.from({ length: AFFIRMATION_COUNTS.faith }, (_, i) =>
    `<button class="mantra-item" data-mantra="${encodeURIComponent(t('affirmation.faith.' + (i + 1)))}" data-idx="f${i}">${t('affirmation.faith.' + (i + 1))}</button>`
  ).join('');

  const universalItems = Array.from({ length: AFFIRMATION_COUNTS.universal }, (_, i) =>
    `<button class="mantra-item" data-mantra="${encodeURIComponent(t('affirmation.universal.' + (i + 1)))}" data-idx="u${i}">${t('affirmation.universal.' + (i + 1))}</button>`
  ).join('');

  container.innerHTML = `
    <div class="tool-header">
      <h2 class="tool-title">${t('mantra.title')}</h2>
      <p class="tool-subtitle">${t('mantra.subtitle')}</p>
    </div>

    <div id="mantra-select-stage">
      <p class="mantra-section-label">${t('mantra.faith.label')}</p>
      <div class="mantra-library" id="mantra-faith">${faithItems}</div>

      <p class="mantra-section-label" style="margin-top:16px">${t('mantra.universal.label')}</p>
      <div class="mantra-library" id="mantra-universal">${universalItems}</div>

      <p class="mantra-section-label" style="margin-top:16px">${t('mantra.custom.label')}</p>
      <textarea class="tool-input" placeholder="${t('mantra.custom.placeholder')}" rows="2" id="mantra-custom"></textarea>
      <button class="btn--advance mt-md" id="mantra-use-custom">${t('mantra.custom.btn')}</button>
    </div>

    <div id="mantra-session-stage" class="hidden">
      <div class="mantra-display">
        <p class="mantra-display-text" id="mantra-active-text"></p>
      </div>
      <p class="mantra-timer-display" id="mantra-timer">${t('mantra.timer.remaining').replace('{time}', '2:00')}</p>
      <p class="step-framing" style="text-align:center;margin-top:8px">${t('mantra.session.hint')}</p>
    </div>
  `;

  function startMantraSession(phrase) {
    selectedMantra = phrase;
    $('mantra-select-stage').classList.add('hidden');
    const sessionEl = $('mantra-session-stage');
    sessionEl.classList.remove('hidden');
    $('mantra-active-text').textContent = phrase;

    let remaining = sessionTime;
    $('mantra-timer').textContent = t('mantra.timer.remaining').replace('{time}', formatSeconds(remaining));

    const id = setInterval(() => {
      remaining--;
      $('mantra-timer').textContent = remaining > 0
        ? t('mantra.timer.remaining').replace('{time}', formatSeconds(remaining))
        : t('mantra.timer.complete');
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    addTimer(id);
  }

  container.querySelectorAll('.mantra-item').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.mantra-item').forEach(b => b.classList.remove('mantra-item--selected'));
      btn.classList.add('mantra-item--selected');
      const phrase = decodeURIComponent(btn.dataset.mantra);
      setTimeout(() => startMantraSession(phrase), 400);
    });
  });

  $('mantra-use-custom').addEventListener('click', () => {
    const custom = $('mantra-custom').value.trim();
    if (custom.length > 0) startMantraSession(custom);
  });
}

// ============================================================
// TOOL 9: PRAYER PROMPT
// ============================================================

function renderPrayer(container) {
  let step = 0;

  function render() {
    if (step === 0) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('prayer.title')}</h2>
          <p class="step-framing" style="margin-top:8px">${t('prayer.framing')}</p>
        </div>
        <div class="prayer-starters">
          <div class="prayer-starter">${t('prayer.starter1')}</div>
          <div class="prayer-starter">${t('prayer.starter2')}</div>
          <div class="prayer-starter">${t('prayer.starter3')}</div>
        </div>
        <div class="step-card" style="margin-top:16px;margin-bottom:16px">
          <p class="step-text">${t('prayer.own-words')}</p>
        </div>
        <button class="btn--advance" id="prayer-enter-quiet">${t('prayer.enter')}</button>
      `;
      $('prayer-enter-quiet').addEventListener('click', () => { step++; render(); });

    } else if (step === 1) {
      let holdTime = 75;
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('prayer.title')}</h2>
        </div>
        <div class="prayer-hold-screen">
          <div class="resourcing-pulse" style="width:120px;height:120px;margin:0 auto 32px"></div>
          <div class="hold-timer" id="prayer-hold">${holdTime}</div>
          <p class="hold-label">${t('prayer.hold.label')}</p>
        </div>
      `;

      const holdEl = $('prayer-hold');
      const id = setInterval(() => {
        holdTime--;
        holdEl.textContent = holdTime;
        if (holdTime <= 0) {
          clearInterval(id);
          container.innerHTML += `
            <div class="affirmation-card" style="margin:16px 0 0">
              <p class="affirmation-text">${t('prayer.affirmation')}</p>
            </div>
          `;
        }
      }, 1000);
      addTimer(id);
    }
  }
  render();
}

// ============================================================
// TOOL 10: VALUES ALIGNMENT CHECK
// ============================================================

function renderValues(container) {
  const promptDefs = [
    { label: 'values.what-matters.label', q: 'values.what-matters.q', hint: 'values.what-matters.hint' },
    { label: 'values.weekly.label',       q: 'values.weekly.q' },
    { label: 'values.off-course.label',   q: 'values.off-course.q' },
    { label: 'values.small-move.label',   q: 'values.small-move.q' }
  ];

  let step = 0;
  const responses = [];

  function render() {
    const isLast = step === promptDefs.length;
    const hasContent = responses.some(r => r.trim());
    container.innerHTML = `
      <div class="tool-header">
        <h2 class="tool-title">${t('values.title')}</h2>
      </div>
      ${!isLast ? `
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t(promptDefs[step].label)}</p>
          <p class="step-prompt" style="font-size:20px">${t(promptDefs[step].q)}</p>
          ${promptDefs[step].hint ? `<p class="step-subtext">${t(promptDefs[step].hint)}</p>` : ''}
        </div>
        <textarea class="tool-input" placeholder="${t('values.placeholder')}" rows="4"></textarea>
        <button class="btn--advance mt-md" id="val-next">
          ${step < promptDefs.length - 1 ? t('values.next') : t('values.finish')}
        </button>
      ` : `
        <div class="affirmation-card">
          <p class="affirmation-text">${t('values.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('val-download') : ''}
        </div>
      `}
    `;
    if (!isLast) {
      $('val-next').addEventListener('click', () => {
        const ta = container.querySelector('textarea');
        responses.push(ta ? ta.value : '');
        step++;
        render();
      });
    }
    const dlBtn = $('val-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadText('calm-down-values.txt', buildResponseText(
          t('values.title'),
          promptDefs.map((p, i) => ({ label: t(p.label), question: t(p.q), response: responses[i] || '' }))
        ));
      });
    }
  }
  render();
}

// ============================================================
// TOOL 11: SLEEP HYGIENE QUICK GUIDE
// ============================================================

function renderSleep(container) {
  const tipKeys = [
    'sleep.tip.1', 'sleep.tip.2', 'sleep.tip.3',
    'sleep.tip.4', 'sleep.tip.5', 'sleep.tip.6'
  ];

  container.innerHTML = `
    <div class="tool-header">
      <h2 class="tool-title">${t('sleep.title')}</h2>
      <p class="tool-subtitle">${t('sleep.subtitle')}</p>
    </div>
    <div class="checklist-items">
      ${tipKeys.map((key, i) => `
        <button class="checklist-item" data-idx="${i}" aria-pressed="false">
          <span class="checklist-check" id="check-${i}"></span>
          <span class="checklist-text">${t(key)}</span>
        </button>
      `).join('')}
    </div>
    <div class="sleep-note">
      ${t('sleep.note')}
    </div>
  `;

  container.querySelectorAll('.checklist-item').forEach(item => {
    item.addEventListener('click', () => {
      const isChecked = item.classList.toggle('checklist-item--checked');
      item.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
      item.querySelector('.checklist-check').textContent = isChecked ? '✓' : '';
    });
  });
}

// ============================================================
// TOOL 12: MOVEMENT PROMPT
// ============================================================

function renderMovement(container) {
  const optionKeys = ['movement.opt.1', 'movement.opt.2', 'movement.opt.3', 'movement.opt.4'];
  let selected = null;

  function render() {
    if (!selected) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('movement.title')}</h2>
          <p class="step-framing" style="margin-top:8px">${t('movement.framing')}</p>
        </div>
        <div class="movement-options">
          ${optionKeys.map((key, i) =>
            `<button class="movement-option" data-idx="${i}">${t(key)}</button>`
          ).join('')}
        </div>
      `;
      container.querySelectorAll('.movement-option').forEach(btn => {
        btn.addEventListener('click', () => {
          selected = t(optionKeys[btn.dataset.idx]);
          render();
        });
      });
    } else {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('movement.title')}</h2>
        </div>
        <div class="movement-return">
          <p style="font-size:15px;color:var(--color-text-secondary);margin-bottom:24px;font-style:italic">"${selected}"</p>
          <p class="movement-return-msg">${t('movement.return.msg')}</p>
          <p class="movement-return-sub">${t('movement.return.sub')}</p>
        </div>
        <div class="affirmation-card" style="margin-top:24px">
          <p class="affirmation-text">${t('movement.affirmation')}</p>
        </div>
      `;
    }
  }
  render();
}

// ============================================================
// TOOL 13: JOURNALING PROMPT
// ============================================================

function renderJournaling(container) {
  let timerActive = false;
  let timerMinutes = 5;
  let timerRemaining = 0;
  let timerIntervalId = null;

  const secondaryKeys = ['journal.secondary.1', 'journal.secondary.2', 'journal.secondary.3'];

  container.innerHTML = `
    <div class="tool-header">
      <h2 class="tool-title">${t('journal.title')}</h2>
    </div>
    <div class="journal-stage">
      <p class="journal-prompt">${t('journal.prompt')}</p>
      <textarea class="tool-input tool-input--large" id="journal-text" placeholder="${t('journal.placeholder')}" aria-label="${t('journal.title')}"></textarea>

      <div>
        <p class="step-subtext" style="margin-bottom:8px">${t('journal.stuck')}</p>
        <div class="journal-secondary-prompts">
          ${secondaryKeys.map(k =>
            `<button class="journal-prompt-btn" data-prompt="${t(k).replace(/"/g, '&quot;')}">"${t(k)}"</button>`
          ).join('')}
        </div>
      </div>

      <div class="journal-timer-controls">
        <span style="font-size:13px;color:var(--color-text-muted)">${t('journal.timer.label')}</span>
        <button class="timer-toggle-btn" id="timer-5">${t('journal.timer.5')}</button>
        <button class="timer-toggle-btn" id="timer-10">${t('journal.timer.10')}</button>
        <span class="journal-timer-display" id="journal-timer-display"></span>
      </div>

      <div class="journal-action-row">
        <button class="btn--clear" id="journal-clear">${t('journal.clear')}</button>
        <button class="btn--download-journal" id="journal-download">${t('journal.download')}</button>
      </div>
      <p class="download-privacy-note" style="margin-top:4px">${t('journal.privacy')}</p>
    </div>
  `;

  container.querySelectorAll('.journal-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = $('journal-text');
      const prompt = btn.dataset.prompt + '\n\n';
      textarea.value += (textarea.value.length > 0 ? '\n\n' : '') + prompt;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  });

  function startTimer(minutes) {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      state.activeTimers = state.activeTimers.filter(id => id !== timerIntervalId);
    }
    timerMinutes = minutes;
    timerRemaining = minutes * 60;
    timerActive = true;

    [$('timer-5'), $('timer-10')].forEach(b => b.classList.remove('timer-toggle-btn--active'));
    $(`timer-${minutes}`).classList.add('timer-toggle-btn--active');

    const display = $('journal-timer-display');
    display.textContent = formatSeconds(timerRemaining);

    timerIntervalId = setInterval(() => {
      timerRemaining--;
      display.textContent = timerRemaining > 0
        ? formatSeconds(timerRemaining)
        : t('journal.times-up');
      if (timerRemaining <= 0) {
        clearInterval(timerIntervalId);
        timerActive = false;
      }
    }, 1000);
    addTimer(timerIntervalId);
  }

  $('timer-5').addEventListener('click', () => startTimer(5));
  $('timer-10').addEventListener('click', () => startTimer(10));

  $('journal-clear').addEventListener('click', () => {
    if (confirm(t('journal.confirm-clear'))) {
      $('journal-text').value = '';
    }
  });

  $('journal-download').addEventListener('click', () => {
    const text = $('journal-text').value.trim();
    if (!text) return;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const content = `Calm Down — Journal Entry\n${date}\n\n${'='.repeat(44)}\n\n${text}\n\n${'='.repeat(44)}\n\nPrivacy note: This file was created on your device.\nNo data was saved, recorded, or transmitted by Calm Down.`;
    downloadText('calm-down-journal.txt', content);
  });
}

// ============================================================
// TOOL 14: 5-SENSES GROUNDING
// ============================================================

function renderGrounding(container) {
  const senseKeys = [
    { label: 'grounding.see.label',   prompt: 'grounding.see.prompt',   placeholder: 'grounding.see.placeholder' },
    { label: 'grounding.touch.label', prompt: 'grounding.touch.prompt', placeholder: 'grounding.touch.placeholder' },
    { label: 'grounding.hear.label',  prompt: 'grounding.hear.prompt',  placeholder: 'grounding.hear.placeholder' },
    { label: 'grounding.smell.label', prompt: 'grounding.smell.prompt', placeholder: 'grounding.smell.placeholder' },
    { label: 'grounding.taste.label', prompt: 'grounding.taste.prompt', placeholder: 'grounding.taste.placeholder' }
  ];

  let step = 0;
  const responses = [];

  function render() {
    const isLast = step === senseKeys.length;
    const hasContent = responses.some(r => r.trim());
    container.innerHTML = `
      <div class="tool-header">
        <h2 class="tool-title">${t('grounding.title')}</h2>
        ${step === 0 ? `<p class="step-framing" style="margin-top:8px">${t('grounding.framing')}</p>` : ''}
      </div>
      ${!isLast ? `
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t(senseKeys[step].label)}</p>
          <p class="step-prompt">${t(senseKeys[step].prompt)}</p>
        </div>
        <textarea class="tool-input" placeholder="${t(senseKeys[step].placeholder)}" rows="3"></textarea>
        <button class="btn--advance mt-md" id="gs-next">
          ${step < senseKeys.length - 1 ? t('grounding.next') : t('grounding.finish')}
        </button>
      ` : `
        <div class="affirmation-card">
          <p class="affirmation-text">${t('grounding.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('gs-download') : ''}
        </div>
      `}
    `;
    if (!isLast) {
      $('gs-next').addEventListener('click', () => {
        const ta = container.querySelector('textarea');
        responses.push(ta ? ta.value : '');
        step++;
        render();
      });
    }
    const dlBtn = $('gs-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadText('calm-down-grounding.txt', buildResponseText(
          t('grounding.title'),
          senseKeys.map((s, i) => ({ label: t(s.label), question: t(s.prompt), response: responses[i] || '' }))
        ));
      });
    }
  }
  render();
}

// ============================================================
// TOOL 15: NUTRITION QUICK GUIDE
// ============================================================

function renderNutrition(container) {
  const tipKeys = [
    'nutrition.tip.1', 'nutrition.tip.2', 'nutrition.tip.3', 'nutrition.tip.4',
    'nutrition.tip.5', 'nutrition.tip.6', 'nutrition.tip.7'
  ];

  container.innerHTML = `
    <div class="tool-header">
      <h2 class="tool-title">${t('nutrition.title')}</h2>
      <p class="tool-subtitle">${t('nutrition.subtitle')}</p>
    </div>
    <div class="checklist-items">
      ${tipKeys.map((key, i) => `
        <button class="checklist-item" data-idx="${i}" aria-pressed="false">
          <span class="checklist-check" id="ncheck-${i}"></span>
          <span class="checklist-text">${t(key)}</span>
        </button>
      `).join('')}
    </div>
    <div class="sleep-note">
      ${t('nutrition.note')}
    </div>
  `;

  container.querySelectorAll('.checklist-item').forEach(item => {
    item.addEventListener('click', () => {
      const isChecked = item.classList.toggle('checklist-item--checked');
      item.setAttribute('aria-pressed', isChecked ? 'true' : 'false');
      item.querySelector('.checklist-check').textContent = isChecked ? '✓' : '';
    });
  });
}

// ============================================================
// TOOL 16: MINDFULNESS CHECK-IN
// ============================================================

function renderMindfulness(container) {
  let step = 0;
  const responses = { emotion: '', body: '' };

  function render() {
    if (step === 0) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('mindfulness.title')}</h2>
          <p class="step-framing" style="margin-top:8px">${t('mindfulness.framing')}</p>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('mindfulness.step1.label')}</p>
          <p class="step-prompt">${t('mindfulness.step1.q')}</p>
          <p class="step-subtext">${t('mindfulness.step1.sub')}</p>
        </div>
        <button class="btn--advance" id="mf-next-1">${t('mindfulness.step1.btn')}</button>
      `;
      $('mf-next-1').addEventListener('click', () => { step++; render(); });

    } else if (step === 1) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('mindfulness.title')}</h2>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('mindfulness.step2.label')}</p>
          <p class="step-prompt">${t('mindfulness.step2.q')}</p>
          <p class="step-subtext">${t('mindfulness.step2.sub')}</p>
        </div>
        <textarea class="tool-input" placeholder="${t('mindfulness.step2.placeholder')}" rows="3"></textarea>
        <button class="btn--advance mt-md" id="mf-next-2">${t('mindfulness.next')}</button>
      `;
      $('mf-next-2').addEventListener('click', () => {
        responses.emotion = container.querySelector('textarea')?.value || '';
        step++;
        render();
      });

    } else if (step === 2) {
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('mindfulness.title')}</h2>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('mindfulness.step3.label')}</p>
          <p class="step-prompt">${t('mindfulness.step3.q')}</p>
          <p class="step-subtext">${t('mindfulness.step3.sub')}</p>
        </div>
        <textarea class="tool-input" placeholder="${t('mindfulness.step3.placeholder')}" rows="3"></textarea>
        <button class="btn--advance mt-md" id="mf-next-3">${t('mindfulness.next')}</button>
      `;
      $('mf-next-3').addEventListener('click', () => {
        responses.body = container.querySelector('textarea')?.value || '';
        step++;
        render();
      });

    } else if (step === 3) {
      let holdCount = 60;
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('mindfulness.title')}</h2>
        </div>
        <div class="step-card" style="margin-bottom:16px">
          <p class="step-number">${t('mindfulness.step4.label')}</p>
          <p class="step-prompt">${t('mindfulness.step4.q')}</p>
          <p class="step-subtext">${t('mindfulness.step4.sub')}</p>
        </div>
        <div class="prayer-hold-screen">
          <div class="resourcing-pulse" style="width:110px;height:110px;margin:0 auto 24px"></div>
          <div class="hold-timer" id="mf-hold-count">${holdCount}</div>
          <p class="hold-label">${t('mindfulness.hold.label')}</p>
        </div>
      `;
      const holdEl = $('mf-hold-count');
      const id = setInterval(() => {
        holdCount--;
        holdEl.textContent = holdCount;
        if (holdCount <= 0) {
          clearInterval(id);
          step++;
          render();
        }
      }, 1000);
      addTimer(id);

    } else {
      const hasContent = responses.emotion.trim() || responses.body.trim();
      container.innerHTML = `
        <div class="tool-header">
          <h2 class="tool-title">${t('mindfulness.title')}</h2>
        </div>
        <div class="affirmation-card">
          <p class="affirmation-text">${t('mindfulness.affirmation')}</p>
          ${hasContent ? renderDownloadBlock('mf-download') : ''}
        </div>
      `;
      const dlBtn = $('mf-download');
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          downloadText('calm-down-mindfulness.txt', buildResponseText(t('mindfulness.title'), [
            { label: t('mindfulness.step2.label'), question: t('mindfulness.step2.q'), response: responses.emotion },
            { label: t('mindfulness.step3.label'), question: t('mindfulness.step3.q'), response: responses.body }
          ]));
        });
      }
    }
  }
  render();
}

// ============================================================
// SUGGESTED TOOL BANNER
// ============================================================

function getCurrentSuggestion() {
  const allSorted = getRecommendedTools();
  return allSorted.find(tool => !state.toolsUsed.includes(tool.id)) || allSorted[0];
}

function renderSuggestedTool() {
  const banner = $('suggested-tool-banner');
  if (!banner) return;

  const allSorted = getRecommendedTools();
  const suggestion = allSorted.find(tool => !state.toolsUsed.includes(tool.id)) || allSorted[0];

  if (!suggestion) {
    banner.classList.add('hidden');
    return;
  }

  const levelDisplay = state.currentStressLevel || state.stressLevel;
  const badgesHTML = suggestion.categories.map(catId =>
    `<span class="badge badge--${catId}">${t('tool.' + catId + '.badge')}</span>`
  ).join('');

  const toolName = t('tools.' + suggestion.id + '.name');
  banner.classList.remove('hidden');
  banner.innerHTML = `
    <span class="suggested-eyebrow">${t('plan.suggested.eyebrow').replace('{level}', levelDisplay)}</span>
    <button class="suggested-card" id="btn-suggested-tool" aria-label="${t('tool.start.aria').replace('{name}', toolName)}">
      <div class="suggested-card-info">
        <span class="suggested-card-name">${toolName}</span>
        <span class="suggested-card-time">${t('tools.' + suggestion.id + '.time')}</span>
      </div>
      <div class="tool-card__badges" style="margin-top:4px">${badgesHTML}</div>
      <span class="suggested-card-arrow">→</span>
    </button>
  `;

  $('btn-suggested-tool').addEventListener('click', () => selectTool(suggestion.id));
}

// ============================================================
// SESSION PROGRESS PANEL
// ============================================================

function renderProgressPanel() {
  const panel = $('session-progress-panel');
  if (!panel) return;

  if (state.toolsUsed.length === 0) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');

  const start = state.sessionStartLevel;
  const current = state.currentStressLevel;
  const diff = start - current;

  const startEl = $('progress-start-val');
  const currentEl = $('progress-current-val');
  const arrowEl = $('progress-arrow');
  const toolsEl = $('progress-tools-list');

  if (startEl) startEl.textContent = start;
  if (currentEl) currentEl.textContent = current;

  if (arrowEl) {
    if (diff > 0) {
      arrowEl.textContent = '↓';
      arrowEl.className = 'progress-arrow progress-arrow--down';
    } else if (diff < 0) {
      arrowEl.textContent = '↑';
      arrowEl.className = 'progress-arrow progress-arrow--up';
    } else {
      arrowEl.textContent = '→';
      arrowEl.className = 'progress-arrow';
    }
  }

  if (toolsEl) {
    const toolNames = state.toolsUsed
      .map(id => t('tools.' + id + '.name') || id)
      .filter(Boolean);
    toolsEl.textContent = toolNames.join(' · ');
  }
}

// ============================================================
// MID-SESSION CHECK-IN
// ============================================================

function renderMiniCheckin() {
  const container = $('checkin-mini-scale');
  if (!container) return;
  container.innerHTML = '';

  const msgEl = $('checkin-progress-msg');
  if (msgEl) {
    msgEl.textContent = '';
    msgEl.classList.add('hidden');
  }

  for (let i = 1; i <= 10; i++) {
    const range = i <= 3 ? 'low' : i <= 6 ? 'mid' : 'high';
    const btn = document.createElement('button');
    btn.className = 'stress-btn stress-btn--mini';
    btn.dataset.level = i;
    btn.dataset.range = range;
    btn.setAttribute('aria-label', t('stress.level.aria').replace('{level}', i));
    btn.textContent = i;
    btn.addEventListener('click', () => handleMiniCheckin(i));
    container.appendChild(btn);
  }
}

function handleMiniCheckin(level) {
  const prev = state.currentStressLevel;
  state.currentStressLevel = level;
  state.stressHistory.push({ level, toolId: state.currentTool, at: Date.now() });

  document.querySelectorAll('.stress-btn--mini').forEach(btn => {
    const sel = Number(btn.dataset.level) === level;
    btn.classList.toggle('stress-btn--selected', sel);
  });

  const msgEl = $('checkin-progress-msg');
  if (msgEl) {
    msgEl.classList.remove('hidden');
    const diff = prev - level;
    if (diff >= 3) {
      msgEl.textContent = t('checkin.progress.big-shift').replace('{prev}', prev).replace('{level}', level);
    } else if (diff > 0) {
      msgEl.textContent = t('checkin.progress.small-shift').replace('{prev}', prev).replace('{level}', level);
    } else if (diff === 0) {
      msgEl.textContent = t('checkin.progress.holding').replace('{level}', level);
    } else {
      msgEl.textContent = t('checkin.progress.rising');
    }
  }
}

// ============================================================
// COMPLETION OVERLAY
// ============================================================

function showCompletionOverlay() {
  const overlay = $('completion-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function hideCompletionOverlay() {
  const overlay = $('completion-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

// ============================================================
// OTHER TOOLS TOGGLE
// ============================================================

function initOtherToolsToggle() {
  const toggle = $('other-tools-toggle');
  const list   = $('other-tools-list');

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    list.classList.toggle('hidden', expanded);
  });
}

// ============================================================
// PWA: INSTALL PROMPT
// ============================================================

function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (isStandalone) return;

  let deferredPrompt = null;
  const banner = $('install-banner');

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.remove('hidden');
  });

  $('btn-install').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.classList.add('hidden');
  });

  $('btn-dismiss-banner').addEventListener('click', () => {
    banner.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    banner.classList.add('hidden');
    deferredPrompt = null;
  });
}

// ============================================================
// EVENT WIRING
// ============================================================

function wireEvents() {
  $('btn-continue-checkin').addEventListener('click', handleContinueCheckin);

  $('btn-safety-ok').addEventListener('click', handleSafetyOk);
  $('back-safety').addEventListener('click', () => showScreen('screen-checkin'));

  $('btn-build-plan').addEventListener('click', handleBuildPlan);
  $('back-categories').addEventListener('click', () => showScreen('screen-checkin'));

  $('back-plan').addEventListener('click', () => {
    state.selectedCategories = [];
    showScreen('screen-categories');
    renderCategories();
  });

  $('back-tool').addEventListener('click', () => {
    clearTimers();
    if (state.quickSession) {
      state.quickSession = false;
      showScreen('screen-checkin');
    } else {
      renderSuggestedTool();
      renderNextTools();
      renderProgressPanel();
      showScreen('screen-plan');
    }
  });

  $('btn-done-tool').addEventListener('click', () => {
    captureCurrentToolTextareas();
    clearTimers();
    if (state.quickSession) {
      state.quickSession = false;
      showScreen('screen-checkin');
    } else {
      showCompletionOverlay();
    }
  });

  $('btn-quick-breathing').addEventListener('click', () => {
    state.quickSession = true;
    selectTool('box-breathing');
  });

  $('btn-try-another').addEventListener('click', () => {
    $('overlay-done-page').classList.add('hidden');
    $('overlay-checkin-page').classList.remove('hidden');
    renderMiniCheckin();
  });

  $('btn-done-session').addEventListener('click', () => {
    showSummaryPage();
  });

  $('btn-checkin-continue').addEventListener('click', () => {
    $('overlay-done-page').classList.remove('hidden');
    $('overlay-checkin-page').classList.add('hidden');
    hideCompletionOverlay();
    renderSuggestedTool();
    renderNextTools();
    renderProgressPanel();
    showScreen('screen-plan');
  });

  $('btn-done-session-2').addEventListener('click', () => {
    showSummaryPage();
  });

  $('btn-summary-done').addEventListener('click', () => {
    $('overlay-summary-page').classList.add('hidden');
    $('overlay-done-page').classList.remove('hidden');
    hideCompletionOverlay();
    resetSession();
    showScreen('screen-checkin');
  });

  initOtherToolsToggle();
}

// ============================================================
// SESSION RESET
// ============================================================

function resetSession() {
  clearTimers();
  state.stressLevel = null;
  state.sessionStartLevel = null;
  state.currentStressLevel = null;
  state.stressHistory = [];
  state.toolsUsed = [];
  state.selectedCategories = [];
  state.safetyShown = false;
  state.currentTool = null;
  state.recommendedToolIds = [];
  state.quickSession = false;
  state.sessionResponses = [];

  document.querySelectorAll('.stress-btn').forEach(btn => {
    btn.classList.remove('stress-btn--selected');
    btn.setAttribute('aria-checked', 'false');
  });
  $('stress-description').textContent = '';

  const continueBtn = $('btn-continue-checkin');
  continueBtn.disabled = true;
  continueBtn.setAttribute('aria-disabled', 'true');
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  (window.i18nReady || Promise.resolve()).then(() => {
    initTheme();
    initStressScale();
    wireEvents();
    initPWA();
    initInstallModal();
    initLegalModals();
  });
});
