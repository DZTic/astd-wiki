// ==========================================
// ALL STAR TOWER DEFENSE - WIKI & DATABASE
// Tactical Pro Architecture (Mobalytics / OP.GG Style)
// ==========================================

let ALL_UNITS = [];
let FILTERED_UNITS = [];
let CODES_DATA = { active: [], expired: [] };
let ORBS_DATA = [];
let TIERLIST_DATA = {};
let GAMEMODES_DATA = [];
let META_DATA = {};

let currentTab = 'units';
let currentStarFilter = 'all';
let currentViewMode = 'grid'; // 'grid' | 'table'
let currentTableSort = { field: 'star', direction: 'desc' };
let pageSize = 24;
let displayedCount = 24;
let currentModalUnit = null;
let teamSlots = [null, null, null, null, null, null];
let currentLevelView = 1; // 1 | 175 : niveau de carte affiché dans la fiche unité
let lastFocusedElement = null;

// Multiplicateurs officiels du wiki (template "Stats Box", section Level 175) :
// dégâts ×2.142, portée ×1.2, SPA inchangé. Vérifiés sur Stampede (???%),
// Joke Da Fool et Demon Of Emotion contre le HTML rendu du wiki.
const LEVEL_175 = { damage: 2.142, range: 1.2, spa: 1 };

// ==========================================
// BUFF DE DÉGÂTS IDOL (aptitude Shine)
// ==========================================
// Les unités « donneuses » de buff (Idol, Metallic King) portent sur chaque
// palier le % de buff de dégâts qu'elles offrent aux unités à portée :
// buff_damage_low = valeur à Level 1, buff_damage_high = valeur à Level 175
// (plafonnée par le jeu, ex. 250% pour Idol au palier max).
let idolBuffEnabled = false;
let idolBuffToggleHidden = true; // masquée sur la fiche de la donneuse elle-même

// L'unité courante propose-t-elle un buff de dégâts sur ses paliers ?
function unitHasDamageBuff(unit) {
  return (unit.upgrades || []).some(up => up.buff_damage_low != null);
}

// Unité de référence pour la simulation : Idol en priorité, sinon la 1re donneuse
function findBuffProvider() {
  return ALL_UNITS.find(u => u.name === 'Idol' && unitHasDamageBuff(u))
      || ALL_UNITS.find(u => unitHasDamageBuff(u))
      || null;
}

// % de buff au palier max de la donneuse, pour le niveau de carte affiché
// (Level 1 -> 130% pour Idol, Level 175 -> 250%, le plafond du jeu)
function buffProviderPercent() {
  const p = findBuffProvider();
  if (!p) return null;
  let low = 0, high = 0;
  p.upgrades.forEach(up => {
    if (up.buff_damage_low != null) low = Math.max(low, up.buff_damage_low);
    if (up.buff_damage_high != null) high = Math.max(high, up.buff_damage_high);
  });
  const pct = currentLevelView === 175 ? (high || low) : (low || high);
  return pct || null;
}

// Multiplicateur de dégâts appliqué à l'unité affichée quand la case est cochée
function idolBuffMultiplier() {
  const pct = idolBuffEnabled ? buffProviderPercent() : null;
  return pct ? 1 + pct / 100 : 1;
}

// Case à cocher « Buff Idol » : style actif/inactif + % courant
function updateIdolBuffToggleUI() {
  const wrap = document.getElementById('idol-buff-toggle-wrap');
  const pctEl = document.getElementById('idol-buff-pct');
  const pct = buffProviderPercent();
  if (pctEl && pct != null) pctEl.textContent = `+${pct}%`;
  if (!wrap) return;
  // Conserver l'état hidden (masquée sur la fiche d'Idol elle-même)
  const hiddenCls = idolBuffToggleHidden ? ' hidden' : '';
  const base = 'cursor-pointer select-none px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5';
  wrap.className = `${base} ${idolBuffEnabled
    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-violet-400/50 hover:text-violet-300'}${hiddenCls}`;
}

// Note explicative sous l'en-tête quand la simulation est active
function updateIdolBuffNote() {
  const note = document.getElementById('modal-idolbuff-note');
  const pctEl = document.getElementById('modal-idolbuff-pct');
  if (!note) return;
  note.classList.toggle('hidden', !idolBuffEnabled);
  if (idolBuffEnabled && pctEl) {
    pctEl.textContent = `+${buffProviderPercent() || 0}%`;
  }
}

function toggleIdolBuff() {
  const cb = document.getElementById('idol-buff-toggle');
  idolBuffEnabled = !!(cb && cb.checked);
  updateIdolBuffToggleUI();
  updateIdolBuffNote();
  renderModalHeaderStats();
  renderUpgradesTable();
}

// Fenêtre « NOUVEAU » : date de création de la fiche wiki (created_at) sur
// moins de 30 jours. Le badge signale les unités récemment ajoutées au jeu.
const NEW_UNIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function isNewUnit(unit) {
  if (!unit.created_at) return false;
  return Date.now() - new Date(unit.created_at).getTime() < NEW_UNIT_WINDOW_MS;
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
});

// Load all JSON datasets
async function loadData() {
  try {
    const dataPrefix = window.location.pathname.includes('/public/') ? '../data/' : './data/';
    const [unitsRes, codesRes, orbsRes, tierRes, modesRes, metaRes] = await Promise.all([
      fetch(`${dataPrefix}units.json`).then(r => r.json()),
      fetch(`${dataPrefix}codes.json`).then(r => r.json()),
      fetch(`${dataPrefix}orbs.json`).then(r => r.json()),
      fetch(`${dataPrefix}tierlist.json`).then(r => r.json()),
      fetch(`${dataPrefix}gamemodes.json`).then(r => r.json()),
      fetch(`${dataPrefix}meta.json`).then(r => r.json()).catch(() => ({}))
    ]);

    ALL_UNITS = unitsRes;
    // Le tableau du wiki n'est pas trié par date : on met les codes les plus récents en premier
    if (Array.isArray(codesRes.active)) {
      codesRes.active.sort((a, b) => codeTimestamp(b) - codeTimestamp(a));
    }
    CODES_DATA = codesRes;
    ORBS_DATA = orbsRes;
    TIERLIST_DATA = tierRes;
    GAMEMODES_DATA = modesRes;
    META_DATA = metaRes;

    // Header & Analytics metrics
    const unitsCountEl = document.getElementById('stat-units-count');
    if (unitsCountEl) unitsCountEl.textContent = ALL_UNITS.length.toLocaleString();

    const orbsCountEl = document.getElementById('stat-orbs-count');
    if (orbsCountEl) orbsCountEl.textContent = ORBS_DATA.length;

    const activeBadge = document.getElementById('badge-active-codes');
    if (activeBadge) activeBadge.textContent = CODES_DATA.active.length;

    const footerUpdated = document.getElementById('footer-last-updated');
    if (footerUpdated && META_DATA.last_updated) {
      footerUpdated.textContent = `Dernière synchro wiki : ${META_DATA.last_updated} (${META_DATA.total_units} unités)`;
    }

    const ribbonUpdated = document.getElementById('stat-last-updated');
    if (ribbonUpdated && META_DATA.last_updated) {
      const [datePart] = META_DATA.last_updated.split(' ');
      const [y, m, d] = datePart.split('-');
      ribbonUpdated.textContent = `${d}/${m}/${y}`;
    }

    // Populate the anime/franchise filter (sorted by number of units, then A-Z)
    const animeSelect = document.getElementById('filter-anime');
    if (animeSelect) {
      const counts = {};
      ALL_UNITS.forEach(u => {
        const a = (u.anime_origin || '').trim();
        if (a) counts[a] = (counts[a] || 0) + 1;
      });
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .forEach(([name, count]) => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `${name} (${count})`;
          animeSelect.appendChild(opt);
        });
      animeSelect.addEventListener('change', applyUnitFilters);
    }

    // Star filter pills: live unit counts per rarity in the tooltip
    document.querySelectorAll('.star-btn').forEach(btn => {
      const val = btn.getAttribute('onclick').match(/setStarFilter\((\d)\)/);
      if (!val) return;
      const star = parseInt(val[1]);
      const count = ALL_UNITS.filter(u => u.star === star).length;
      btn.title = `${count} unité${count > 1 ? 's' : ''} ${star}★`;
    });

    // Hero latest code
    if (CODES_DATA.active && CODES_DATA.active.length > 0) {
      const topCode = CODES_DATA.active[0];
      const codeName = document.getElementById('hero-code-name');
      if (codeName) codeName.textContent = topCode.code;
    }

    // Render Initial Views
    applyUnitFilters();
    renderTierList();
    renderCodes();
    renderOrbs();
    renderGameModes();
    renderTeamBuilder();

    // Check URL Hash
    handleHashNavigation();

  } catch (error) {
    console.error('Erreur lors du chargement des données ASTD:', error);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  const searchInput = document.getElementById('filter-search');
  const sortSelect = document.getElementById('filter-sort');
  const typeSelect = document.getElementById('filter-tower-type');
  const obtainableCheck = document.getElementById('filter-obtainable');
  const quickSearch = document.getElementById('quick-search');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
      applyUnitFilters();
    });
  }

  if (quickSearch) {
    quickSearch.addEventListener('input', (e) => {
      switchTab('units');
      if (searchInput) {
        searchInput.value = e.target.value;
        document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
        applyUnitFilters();
      }
    });
  }

  const mobileSearch = document.getElementById('mobile-search-input');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', (e) => {
      switchTab('units');
      if (searchInput) {
        searchInput.value = e.target.value;
        document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
        applyUnitFilters();
      }
    });
  }

  if (sortSelect) sortSelect.addEventListener('change', applyUnitFilters);
  if (typeSelect) typeSelect.addEventListener('change', applyUnitFilters);
  if (obtainableCheck) obtainableCheck.addEventListener('change', applyUnitFilters);

  // Global shortcut Ctrl+K to search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('filter-search') || document.getElementById('quick-search');
      input?.focus();
    }
    if (e.key === 'Escape') closeUnitModal();
  });

  // Modal backdrop click & focus trap
  const modal = document.getElementById('unit-modal');
  const modalDialog = document.getElementById('unit-modal-dialog');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeUnitModal();
    });
  }

  if (modalDialog) {
    modalDialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = modalDialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });
  }

  window.addEventListener('hashchange', handleHashNavigation);
}

// Handle URL Hash navigation
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('unit/')) {
    const unitId = hash.replace('unit/', '');
    openUnitModal(unitId);
  } else if (['units', 'tierlist', 'codes', 'orbs', 'gamemodes', 'teambuilder'].includes(hash)) {
    switchTab(hash);
  }
}

// Switch Active Tab
function switchTab(tabId) {
  currentTab = tabId;
  window.location.hash = tabId;

  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });
  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) targetSection.classList.remove('hidden');

  updateNavActiveState(tabId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

function updateNavActiveState(tabId) {
  // 1. Desktop Nav Links
  document.querySelectorAll('.nav-link').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId || btn.id === `nav-${tabId}`;
    const icon = btn.querySelector('i');
    if (isTarget) {
      btn.className = 'nav-link whitespace-nowrap shrink-0 ps-3 pe-3.5 py-1.5 rounded-lg text-xs xl:text-sm font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 tap-scale';
      if (icon) {
        icon.classList.remove('text-slate-400');
        icon.classList.add('text-sky-400');
      }
    } else {
      btn.className = 'nav-link whitespace-nowrap shrink-0 ps-3 pe-3.5 py-1.5 rounded-lg text-xs xl:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent flex items-center gap-1.5 tap-scale';
      if (icon) {
        icon.classList.remove('text-sky-400');
        icon.classList.add('text-slate-400');
      }
    }
  });

  // 2. Mobile Chips
  document.querySelectorAll('.mobile-chip-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    if (isTarget) {
      btn.className = 'mobile-chip-btn whitespace-nowrap shrink-0 ps-2.5 pe-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 tap-scale';
    } else {
      btn.className = 'mobile-chip-btn whitespace-nowrap shrink-0 ps-2.5 pe-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 tap-scale';
    }
  });

  // 3. Mobile Drawer
  document.querySelectorAll('.drawer-link').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    if (isTarget) {
      btn.className = 'drawer-link p-2.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-500/40 flex items-center gap-2 tap-scale';
    } else {
      btn.className = 'drawer-link p-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-2 hover:bg-slate-800 tap-scale';
    }
  });
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const icon = document.getElementById('hamburger-icon');
  if (drawer) {
    const isHidden = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden');
    if (icon) {
      icon.setAttribute('data-lucide', isHidden ? 'x' : 'menu');
      if (window.lucide) lucide.createIcons();
    }
  }
}

function switchTabAndCloseDrawer(tabId) {
  switchTab(tabId);
  const drawer = document.getElementById('mobile-drawer');
  const icon = document.getElementById('hamburger-icon');
  if (drawer && !drawer.classList.contains('hidden')) {
    drawer.classList.add('hidden');
    if (icon) {
      icon.setAttribute('data-lucide', 'menu');
      if (window.lucide) lucide.createIcons();
    }
  }
}

// Number formatting utility (Compact e.g. 1.2M, 350K)
function formatCompactNumber(num) {
  if (!num || isNaN(num) || num === 0) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
}

// ==========================================
// VIEW SWITCHER (GRID VS PRO TABLE)
// ==========================================

function setViewMode(mode) {
  currentViewMode = mode;
  const gridEl = document.getElementById('units-grid');
  const tableContainer = document.getElementById('units-table-container');
  const loadMoreBtn = document.getElementById('load-more-container');
  const btnGrid = document.getElementById('btn-view-grid');
  const btnTable = document.getElementById('btn-view-table');

  if (mode === 'table') {
    gridEl?.classList.add('hidden');
    tableContainer?.classList.remove('hidden');
    loadMoreBtn?.classList.add('hidden');

    if (btnTable) {
      btnTable.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-white bg-sky-600 flex items-center justify-center space-x-1 tap-scale';
      btnTable.setAttribute('aria-pressed', 'true');
    }
    if (btnGrid) {
      btnGrid.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center space-x-1 tap-scale';
      btnGrid.setAttribute('aria-pressed', 'false');
    }

    renderUnitsTable();
  } else {
    gridEl?.classList.remove('hidden');
    tableContainer?.classList.add('hidden');

    if (btnGrid) {
      btnGrid.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-white bg-sky-600 flex items-center justify-center space-x-1 tap-scale';
      btnGrid.setAttribute('aria-pressed', 'true');
    }
    if (btnTable) {
      btnTable.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center space-x-1 tap-scale';
      btnTable.setAttribute('aria-pressed', 'false');
    }

    renderUnitsList();
  }
}

function sortTableBy(field) {
  if (currentTableSort.field === field) {
    currentTableSort.direction = currentTableSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentTableSort.field = field;
    currentTableSort.direction = 'desc';
  }

  FILTERED_UNITS.sort((a, b) => {
    let valA = a[field] || 0;
    let valB = b[field] || 0;
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return currentTableSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return currentTableSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  renderUnitsTable();
}

// ==========================================
// UNIT FILTERS & RENDERING
// ==========================================

function setStarFilter(star, btnElement) {
  currentStarFilter = star;
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-sky-600', 'text-white', 'border-sky-500');
    btn.classList.add('bg-slate-900/90', 'text-slate-300', 'border-slate-800');
    btn.setAttribute('aria-pressed', 'false');
  });

  const targetBtn = btnElement || (window.event && window.event.currentTarget)
    || document.querySelector(`.star-btn[onclick*="'${star}'"]`)
    || document.querySelector(`.star-btn[onclick*="${star}"]`);

  if (targetBtn) {
    targetBtn.classList.add('active', 'bg-sky-600', 'text-white', 'border-sky-500');
    targetBtn.classList.remove('bg-slate-900/90', 'text-slate-300', 'border-slate-800');
    targetBtn.setAttribute('aria-pressed', 'true');
  }

  applyUnitFilters();
}

function clearSearch() {
  const searchInput = document.getElementById('filter-search');
  if (searchInput) searchInput.value = '';
  document.getElementById('clear-search')?.classList.add('hidden');
  applyUnitFilters();
}

function clearAllFilters() {
  const searchInput = document.getElementById('filter-search');
  const typeSelect = document.getElementById('filter-tower-type');
  const sortSelect = document.getElementById('filter-sort');
  const animeSelect = document.getElementById('filter-anime');
  const obtainableCheck = document.getElementById('filter-obtainable');
  const quickSearch = document.getElementById('quick-search');

  if (searchInput) searchInput.value = '';
  if (quickSearch) quickSearch.value = '';
  if (typeSelect) typeSelect.value = 'all';
  if (sortSelect) sortSelect.value = 'recent-desc';
  if (animeSelect) animeSelect.value = 'all';
  if (obtainableCheck) obtainableCheck.checked = false;
  document.getElementById('clear-search')?.classList.add('hidden');

  setStarFilter('all');
}

function applyUnitFilters() {
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const sort = document.getElementById('filter-sort')?.value || 'star-desc';
  const typeFilter = document.getElementById('filter-tower-type')?.value || 'all';
  const animeFilter = document.getElementById('filter-anime')?.value || 'all';
  const obtainableOnly = document.getElementById('filter-obtainable')?.checked || false;

  FILTERED_UNITS = ALL_UNITS.filter(u => {
    if (currentStarFilter !== 'all' && u.star !== parseInt(currentStarFilter)) return false;
    if (typeFilter !== 'all') {
      const uType = (u.tower_type || '').toLowerCase();
      if (!uType.includes(typeFilter.toLowerCase())) return false;
    }
    if (animeFilter !== 'all' && (u.anime_origin || '').trim() !== animeFilter) return false;
    if (obtainableOnly && u.is_unobtainable) return false;

    if (search) {
      const matchName = u.name.toLowerCase().includes(search);
      const matchAnime = (u.anime_origin || '').toLowerCase().includes(search);
      const matchChar = (u.character_origin || '').toLowerCase().includes(search);
      const matchOverview = (u.overview || '').toLowerCase().includes(search);
      if (!matchName && !matchAnime && !matchChar && !matchOverview) return false;
    }

    return true;
  });

  // Sort
  FILTERED_UNITS.sort((a, b) => {
    switch (sort) {
      case 'recent-desc':
        return (b.created_at || '').localeCompare(a.created_at || '')
            || b.star - a.star || (b.max_damage || 0) - (a.max_damage || 0);
      case 'star-desc':
        return b.star - a.star || (b.max_damage || 0) - (a.max_damage || 0);
      case 'star-asc':
        return a.star - b.star || (a.max_damage || 0) - (b.max_damage || 0);
      case 'dmg-desc':
        return (b.max_damage || 0) - (a.max_damage || 0);
      case 'dps-desc':
        return (b.max_dps || 0) - (a.max_dps || 0);
      case 'cost-asc':
        return (a.total_cost || 0) - (b.total_cost || 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  displayedCount = pageSize;

  if (currentViewMode === 'table') {
    renderUnitsTable();
  } else {
    renderUnitsList();
  }
}

function renderUnitsList() {
  const grid = document.getElementById('units-grid');
  const countEl = document.getElementById('results-count');
  const loadMoreBtn = document.getElementById('load-more-container');

  if (countEl) {
    countEl.textContent = `${FILTERED_UNITS.length} unité${FILTERED_UNITS.length > 1 ? 's' : ''}`;
  }

  if (FILTERED_UNITS.length === 0) {
    const searchVal = document.getElementById('filter-search')?.value?.trim() || '';
    grid.innerHTML = `
      <div class="col-span-full py-12 px-6 text-center text-slate-300 tactical-card rounded-2xl border border-slate-800 my-4 max-w-md mx-auto">
        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-sky-400">
          <i data-lucide="search-x" class="w-6 h-6" stroke-width="2"></i>
        </div>
        <h3 class="text-sm font-bold text-white text-balance">Aucune unité ne correspond à vos filtres</h3>
        <p class="text-xs text-slate-400 mt-1 text-pretty">
          ${searchVal ? `Aucun résultat pour « <strong class="text-white">${searchVal}</strong> ».` : 'Aucune unité disponible avec la combinaison de rareté et type sélectionnés.'}
        </p>
        <button onclick="clearAllFilters()" class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale inline-flex items-center gap-1.5 shadow-md">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5" stroke-width="2"></i>
          <span>Réinitialiser les filtres</span>
        </button>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
    return;
  }

  const unitsToShow = FILTERED_UNITS.slice(0, displayedCount);
  grid.innerHTML = unitsToShow.map(u => createUnitCardHTML(u)).join('');

  if (loadMoreBtn) {
    loadMoreBtn.classList.toggle('hidden', displayedCount >= FILTERED_UNITS.length);
  }

  if (window.lucide) lucide.createIcons();
}

function renderUnitsTable() {
  const tbody = document.getElementById('units-table-tbody');
  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${FILTERED_UNITS.length} unité${FILTERED_UNITS.length > 1 ? 's' : ''}`;

  if (!tbody) return;

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";

  tbody.innerHTML = FILTERED_UNITS.slice(0, 150).map(u => `
    <tr class="hover:bg-slate-800/60 transition-colors duration-100 cursor-pointer" onclick="openUnitModal('${u.id}')" tabindex="0" role="button" aria-label="${u.name}, unité ${u.star} étoiles. Voir la fiche." onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUnitModal('${u.id}');}">
      <td class="p-3 flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-0.5 shrink-0 flex items-center justify-center">
          <img src="${u.image || fallbackImg}" alt="" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
        </div>
        <div class="min-w-0 font-sans">
          <div class="font-bold text-white truncate">${u.name}</div>
          <div class="text-[10px] text-slate-400 truncate">${u.anime_origin || u.character_origin || '-'}</div>
        </div>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold star-${u.star}-badge font-mono-num">${u.star}★</span>
        ${isNewUnit(u) ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="Fiche wiki créée le ${new Date(u.created_at).toLocaleDateString('fr-FR')}">Nouveau</span>` : ''}
      </td>
      <td class="p-3 font-sans">
        <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-semibold">${u.tower_type || 'Ground'}</span>
      </td>
      <td class="p-3 font-bold text-slate-100 font-mono-num" title="${u.max_damage.toLocaleString()} DMG">${formatCompactNumber(u.max_damage)}</td>
      <td class="p-3 text-slate-300 font-mono-num">${u.max_range || '-'}</td>
      <td class="p-3 text-slate-400 font-mono-num">${u.min_spa ? u.min_spa + 's' : '-'}</td>
      <td class="p-3 font-bold text-amber-300 font-mono-num" title="${u.max_dps.toLocaleString()} DPS">${formatCompactNumber(u.max_dps)}</td>
      <td class="p-3 text-slate-300 font-mono-num">${u.total_cost > 0 ? '$' + formatCompactNumber(u.total_cost) : '-'}</td>
      <td class="p-3 text-right space-x-1.5 font-sans" onclick="event.stopPropagation()">
        <button onclick="openUnitModal('${u.id}')" aria-label="Consulter la fiche de ${u.name}" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale">
          Fiche
        </button>
        <button onclick="addUnitToTeam('${u.id}')" aria-label="Ajouter ${u.name} au deck" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale" title="Ajouter au deck">
          +
        </button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function loadMoreUnits() {
  displayedCount += pageSize;
  renderUnitsList();
}

// Safety net: strip any leftover wiki markup at render time
function stripWikiMarkup(text) {
  if (!text) return '';
  // Inside a wiki link, the readable part is the label, or the anchor if only
  // "Page#Anchor" survived (truncated links from nested templates).
  const linkText = (m, inner) => {
    let t = inner.trim();
    if (t.includes('#')) t = t.split('#').pop() || t;
    return t.replace(/_/g, ' ');
  };
  return text
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, linkText)
    .replace(/\[\[?([^\[\]]+)\]*/g, linkText)
    .replace(/'{2,3}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tactical Unit Card Generator (Accessible, High Contrast, Keyboard navigable)
function createUnitCardHTML(unit) {
  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  const imgSrc = unit.image || fallbackImg;
  const originLine = unit.anime_origin || unit.character_origin || 'All Star Tower Defense';

  return `
    <article class="tactical-card rounded-xl p-3.5 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between group cursor-pointer tap-scale-subtle focus-within:ring-2 focus-within:ring-sky-500"
             role="button"
             tabindex="0"
             aria-label="${unit.name}, unité ${unit.star} étoiles, type ${unit.tower_type || 'Ground'}. Cliquer pour inspecter."
             onclick="openUnitModal('${unit.id}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUnitModal('${unit.id}');}">

      <!-- Top Badges -->
      <div class="flex items-center justify-between z-10 mb-2">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono-num font-bold star-${unit.star}-badge shadow-sm">
            ${unit.star}★
          </span>
          ${isNewUnit(unit) ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="Fiche wiki créée le ${new Date(unit.created_at).toLocaleDateString('fr-FR')}">Nouveau</span>` : ''}
        </div>
        <div class="flex items-center space-x-1">
          ${unit.is_unobtainable ? '<span class="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 rounded" title="Unité retirée du jeu : bannière ou événement expiré">Introuvable</span>' : ''}
          ${unit.is_tradeable ? '<span class="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 rounded">Trade</span>' : ''}
          <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded" title="${towerTypeTooltip(unit.tower_type)}">${unit.tower_type || 'Ground'}</span>
        </div>
      </div>

      <!-- Avatar Framed with concentric radius & neutral outline -->
      <div class="w-full h-32 rounded-lg bg-[#070b14] border border-slate-800/80 p-2 my-1 flex items-center justify-center relative overflow-hidden group-hover:border-sky-500/40 transition-colors duration-150">
        <img src="${imgSrc}" alt="" loading="lazy"
             onerror="this.src='${fallbackImg}'"
             class="max-h-full max-w-full object-contain filter drop-shadow img-outline rounded-md group-hover:scale-105 transition-transform duration-150 ease-out">
      </div>

      <!-- Title & Origin -->
      <div class="my-2 min-w-0">
        <div class="font-bold text-xs sm:text-sm text-white group-hover:text-sky-300 transition-colors duration-150 truncate text-balance" title="${unit.name}">
          ${unit.name}
        </div>
        <div class="text-[11px] text-slate-400 truncate text-pretty" title="${originLine}">
          ${originLine}
        </div>
      </div>

      <!-- Tactical Micro-Metrics Grid (Neutral, Readable, High Contrast WCAG AA) -->
      <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80 font-mono-num text-[11px]">
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="Dégâts au palier d'amélioration maximum">DMG</span>
          <span class="font-bold text-slate-100" title="${unit.max_damage.toLocaleString()}">${formatCompactNumber(unit.max_damage)}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="Dégâts Par Seconde au palier maximum">DPS</span>
          <span class="font-bold text-amber-300" title="${unit.max_dps.toLocaleString()}">${formatCompactNumber(unit.max_dps)}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="Distance d'attaque maximale">Portée</span>
          <span class="font-semibold text-slate-200">${unit.max_range || '-'}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="SPA : Secondes Par Attaque (délai entre deux attaques)">SPA</span>
          <span class="font-semibold text-slate-300">${unit.min_spa ? unit.min_spa + 's' : '-'}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-3 flex items-center space-x-1.5" onclick="event.stopPropagation()">
        <button onclick="openUnitModal('${unit.id}')" aria-label="Consulter la fiche de ${unit.name}" class="flex-1 ps-2.5 pe-3 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale flex items-center justify-center space-x-1 transition-colors">
          <i data-lucide="eye" class="w-3 h-3" stroke-width="2"></i>
          <span>Fiche</span>
        </button>
        <button onclick="addUnitToTeam('${unit.id}')" aria-label="Ajouter ${unit.name} au deck" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-bold text-slate-300 tap-scale flex items-center justify-center transition-colors" title="Ajouter au deck">
          +
        </button>
      </div>

    </article>
  `;
}

// Human-readable explanation of tower placement types
function towerTypeTooltip(type) {
  const t = (type || 'Ground').toLowerCase();
  if (t.includes('hybrid')) return "Hybride : peut attaquer les ennemis au sol ET aériens";
  if (t.includes('hill')) return "Colline (Hill) : se place sur les hauteurs, attaque sol et air";
  if (t.includes('air')) return "Aérien : n'attaque que les ennemis volants";
  return "Sol (Ground) : n'attaque que les ennemis au sol";
}

// Highlight numeric stats, multipliers and percentages in text for readability
function highlightStats(text) {
  if (!text) return '';
  return text
    .replace(/(\b\d+(?:\.\d+)?x\b)/gi, '<strong class="text-rose-400 font-mono-num font-bold">$1</strong>')
    .replace(/(\b\d+(?:\.\d+)?%\b)/g, '<strong class="text-amber-400 font-mono-num font-bold">$1</strong>')
    .replace(/(\b\d+(?:\.\d+)?\s*(?:billion|million|B|M|k)\s*(?:damage|HP|cash)?\b)/gi, '<strong class="text-sky-300 font-mono-num font-semibold">$1</strong>')
    .replace(/(\b\d+\s*(?:secondes?|seconds?|minutes?|min|sec)\b)/gi, '<strong class="text-emerald-400 font-mono-num font-semibold">$1</strong>');
}

function scrollToAbilitiesSection() {
  const el = document.getElementById('modal-abilities-section');
  if (!el) return;
  // Un-collapse first so the target card is actually visible after scrolling
  const content = document.getElementById('modal-abilities-content');
  if (content && content.classList.contains('hidden')) toggleAbilities();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle the special abilities / passives block on the unit modal
function toggleAbilities() {
  const section = document.getElementById('modal-abilities-section');
  const content = document.getElementById('modal-abilities-content');
  const label = document.getElementById('modal-abilities-btn-label');
  const chevron = document.getElementById('modal-abilities-chevron');
  if (!content) return;
  const nowHidden = content.classList.toggle('hidden');
  const btn = section ? section.querySelector('button') : null;
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
  if (label) label.textContent = nowHidden ? 'Afficher' : 'Masquer';
  if (chevron) chevron.classList.toggle('rotate-180', !nowHidden);
}

// Render the dedicated Special Abilities, Passives & Leader section in the unit modal
function renderModalAbilities(unit) {
  const section = document.getElementById('modal-abilities-section');
  const list = document.getElementById('modal-abilities-list');
  const countBadge = document.getElementById('modal-abilities-count');
  if (!section || !list) return;

  const abilities = unit.abilities || [];
  if (abilities.length === 0) {
    section.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  if (countBadge) countBadge.textContent = abilities.length;

  // Reset to collapsed state each time the modal opens
  const content = document.getElementById('modal-abilities-content');
  const btn = section.querySelector('button');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (content) {
    content.classList.add('hidden');
    document.getElementById('modal-abilities-btn-label').textContent = 'Afficher';
    document.getElementById('modal-abilities-chevron').classList.remove('rotate-180');
  }

  const typeConfig = {
    manual: {
      label: 'Aptitude Manuelle',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: 'flame',
      iconColor: 'text-rose-400',
      cardBorder: 'border-rose-900/40 hover:border-rose-500/40'
    },
    passive: {
      label: 'Passif Spécial',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: 'shield',
      iconColor: 'text-purple-400',
      cardBorder: 'border-purple-900/40 hover:border-purple-500/40'
    },
    leader: {
      label: 'Leader',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: 'crown',
      iconColor: 'text-amber-400',
      cardBorder: 'border-amber-900/40 hover:border-amber-500/40'
    }
  };

  list.innerHTML = abilities.map((ab, idx) => {
    const cfg = typeConfig[ab.type] || {
      label: 'Capacité',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: 'sparkles',
      iconColor: 'text-sky-400',
      cardBorder: 'border-slate-800 hover:border-slate-700'
    };

    const descLines = (ab.description || '').split('\n').filter(l => l.trim().length > 0);
    const formattedDesc = descLines.map(line => {
      const l = line.trim();
      if (l.startsWith('•')) {
        return `<div class="flex items-start gap-1.5 mt-1 text-slate-200"><i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i><span>${highlightStats(l.substring(1).trim())}</span></div>`;
      }
      return `<p class="leading-relaxed">${highlightStats(l)}</p>`;
    }).join('');

    return `
      <div id="ability-card-${idx}" class="bg-slate-950/80 border ${cfg.cardBorder} rounded-xl p-3.5 flex flex-col sm:flex-row gap-3.5 transition-colors">
        <!-- Ability Icon or Fallback -->
        <div class="shrink-0 flex sm:flex-col items-center justify-center">
          <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden p-1 shadow-md">
            ${ab.icon_url ? `
              <img src="${ab.icon_url}" alt="${ab.name}" class="max-w-full max-h-full object-contain img-outline rounded-lg"
                   onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
              <i data-lucide="${cfg.icon}" class="w-6 h-6 ${cfg.iconColor} hidden"></i>
            ` : `
              <i data-lucide="${cfg.icon}" class="w-6 h-6 ${cfg.iconColor}"></i>
            `}
          </div>
        </div>

        <!-- Ability Content -->
        <div class="flex-1 min-w-0 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-bold text-white text-sm sm:text-base tracking-tight">${ab.name}</h4>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${cfg.badgeClass}">
                ${cfg.label}
              </span>
            </div>
            ${ab.unlock ? `
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-slate-900 border border-slate-700 text-sky-300 flex items-center gap-1.5 shadow-sm">
                <i data-lucide="unlock" class="w-3 h-3 text-sky-400"></i>
                <span>${ab.unlock}</span>
              </span>
            ` : ''}
          </div>

          <div class="text-xs text-slate-300 font-sans bg-slate-900/70 rounded-lg p-2.5 border border-slate-800/80 space-y-1">
            ${formattedDesc}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// UNIT DETAIL MODAL (TACTICAL HUD)
// ==========================================

function openUnitModal(unitId) {
  const unit = ALL_UNITS.find(u => u.id === unitId || u.name.toLowerCase() === unitId.toLowerCase());
  if (!unit) return;

  // Save active element to restore focus on modal close
  lastFocusedElement = document.activeElement;

  currentModalUnit = unit;
  window.location.hash = `unit/${unit.id}`;

  const modal = document.getElementById('unit-modal');
  const nameEl = document.getElementById('modal-unit-name');
  const starBadge = document.getElementById('modal-star-badge');
  const imgEl = document.getElementById('modal-unit-image');
  const imgWrapper = document.getElementById('modal-img-wrapper');
  const tradeBadge = document.getElementById('modal-trade-badge');
  const animeEl = document.getElementById('modal-anime-origin');
  const overviewEl = document.getElementById('modal-overview-text');
  const fandomLink = document.getElementById('modal-fandom-link');

  // Stats elements
  const towerTypeEl = document.getElementById('modal-tower-type');
  const attackTypeEl = document.getElementById('modal-attack-type');
  towerTypeEl.textContent = unit.tower_type || 'Ground';
  towerTypeEl.title = towerTypeTooltip(unit.tower_type);
  attackTypeEl.textContent = unit.attack_type || 'AoE';
  attackTypeEl.title = "AoE : Area of Effect (zone touchée par chaque attaque : cercle, cône, ligne...)";
  document.getElementById('modal-deploy-cost').textContent = unit.deployment_cost ? `$${unit.deployment_cost.toLocaleString()}` : 'Inconnu';
  document.getElementById('modal-total-cost').textContent = unit.total_cost ? `$${unit.total_cost.toLocaleString()}` : 'Inconnu';
  // max damage / dps per card level -> renderModalHeaderStats()

  // Details
  nameEl.textContent = unit.name;
  starBadge.textContent = `${unit.star}★`;
  starBadge.className = `px-2 py-0.5 rounded text-xs font-black star-${unit.star}-badge`;
  
  imgEl.src = unit.image || "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  imgWrapper.className = `w-44 h-44 rounded-xl bg-[#070b14] border border-slate-800/80 p-2 overflow-hidden flex items-center justify-center shadow relative`;

  tradeBadge.classList.toggle('hidden', !unit.is_tradeable);
  const unobtainableBadge = document.getElementById('modal-unobtainable-badge');
  if (unobtainableBadge) unobtainableBadge.classList.toggle('hidden', !unit.is_unobtainable);

  // Reset the card-level toggle to Level 1 on each modal open
  setLevelView(1);

  // Case « Buff Idol » : visible pour toute unité qui n'est pas elle-même
  // la donneuse (Idol affiche déjà ses % dans la colonne Buff de son tableau)
  const provider = findBuffProvider();
  const buffToggleWrap = document.getElementById('idol-buff-toggle-wrap');
  if (buffToggleWrap) {
    const isProvider = provider && unit.id === provider.id;
    idolBuffToggleHidden = isProvider;
    idolBuffEnabled = false;
    const cb = document.getElementById('idol-buff-toggle');
    if (cb) cb.checked = false;
    updateIdolBuffToggleUI();
    updateIdolBuffNote();
  }

  // Origin: anime/franchise + character when both are known
  const animePart = unit.anime_origin ? `Anime : ${unit.anime_origin}` : null;
  const charPart = unit.character_origin ? `Personnage : ${unit.character_origin}` : null;
  animeEl.textContent = [animePart, charPart].filter(Boolean).join('  •  ') || 'Origine : Personnage All Star';

  // Date d'ajout au wiki (création de la fiche) sous le portrait
  const addedEl = document.getElementById('modal-added-date');
  if (addedEl) {
    if (unit.created_at) {
      const d = new Date(unit.created_at);
      addedEl.textContent = `Ajoutée le ${d.toLocaleDateString('fr-FR')}`;
      addedEl.title = `Fiche wiki créée le ${d.toLocaleDateString('fr-FR')} — le badge Nouveau s'affiche pendant 30 jours`;
      addedEl.classList.remove('hidden');
    } else {
      addedEl.classList.add('hidden');
    }
  }

  overviewEl.textContent = stripWikiMarkup(unit.overview) || "Aucune description détaillée enregistrée pour cette unité.";

  // Obtention : source racine derrière une évolution (raid, story, bannière...)
  const obtainBox = document.getElementById('modal-obtain-source');
  const obtainText = document.getElementById('modal-obtain-source-text');
  const obtainChain = document.getElementById('modal-obtain-chain');
  if (obtainBox && obtainText) {
    // source résolue depuis la chaîne d'évolution, sinon phrase directe du wiki
    const source = unit.obtain_source || (unit.obtain && !/evolv/i.test(unit.obtain) ? unit.obtain : null);
    if (source) {
      obtainText.textContent = stripWikiMarkup(source);
      if (obtainChain) {
        if (unit.obtain_chain && unit.obtain_chain.length > 0) {
          obtainChain.textContent = `Évolution de : ${unit.obtain_chain.join(' → ')}`;
        } else if (unit.evolution && unit.evolution.evolves_into) {
          obtainChain.textContent = `Peut évoluer en ${unit.evolution.evolves_into}`;
        } else {
          obtainChain.textContent = '';
        }
      }
      obtainBox.classList.remove('hidden');
    } else {
      obtainText.textContent = '';
      if (obtainChain) obtainChain.textContent = '';
      obtainBox.classList.add('hidden');
    }
  }

  if (fandomLink) {
    fandomLink.href = `https://allstartd.fandom.com/wiki/${encodeURIComponent(unit.name)}`;
  }

  // Visual Damage Progression Range (re-rendered per level in renderModalHeaderStats)
  renderModalHeaderStats();

  // Render Evolution Section
  const evoSection = document.getElementById('modal-evolution-section');
  const evoContent = document.getElementById('modal-evolution-content');
  if (unit.evolution && unit.evolution.evolves_into) {
    evoSection.classList.remove('hidden');
    let materialsHTML = '';
    if (unit.evolution.materials && unit.evolution.materials.length > 0) {
      materialsHTML = `
        <div class="mt-2 flex flex-wrap gap-1.5">
          ${unit.evolution.materials.map(m => `
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-medium text-slate-200">
              ${m.name} <strong class="text-sky-400 font-mono-num">${m.count}</strong>
            </span>
          `).join('')}
        </div>
      `;
    }
    evoContent.innerHTML = `
      <div class="text-xs">Évolue en : <strong class="text-amber-400 font-bold">${unit.evolution.evolves_into}</strong></div>
      ${materialsHTML}
    `;
  } else {
    evoSection.classList.add('hidden');
  }

  // Pre-evolutions (units that evolve INTO this one) — collapsed by default
  const preevoSection = document.getElementById('modal-preevo-section');
  const preevoContent = document.getElementById('modal-preevo-content');
  if (preevoSection && preevoContent) {
    const target = unit.name.toLowerCase();
    const preEvos = ALL_UNITS.filter(u =>
      u.evolution && u.evolution.evolves_into &&
      u.evolution.evolves_into.toLowerCase() === target
    );
    if (preEvos.length > 0) {
      preevoSection.classList.remove('hidden');
      // Reset to collapsed state each time the modal opens
      preevoContent.classList.add('hidden');
      const preevoBtn = preevoSection.querySelector('button');
      if (preevoBtn) preevoBtn.setAttribute('aria-expanded', 'false');
      document.getElementById('modal-preevo-btn-label').textContent = 'Afficher';
      document.getElementById('modal-preevo-chevron').classList.remove('rotate-180');
      document.getElementById('modal-preevo-count').textContent = `(${preEvos.length})`;
      const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
      preevoContent.innerHTML = `
        <div class="text-xs text-slate-400 mb-2">
          Unité${preEvos.length > 1 ? 's' : ''} qui évolue${preEvos.length > 1 ? 'nt' : ''} en
          <strong class="text-amber-400">${unit.name}</strong> :
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${preEvos.map(p => `
            <button onclick="openUnitModal('${p.id}')"
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-800 tap-scale transition-colors shadow-sm">
              <span class="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="${p.image || fallbackImg}" class="max-h-full max-w-full object-contain img-outline rounded" alt="" onerror="this.src='${fallbackImg}'">
              </span>
              <span class="text-left min-w-0">
                <span class="block text-[11px] font-bold text-white truncate max-w-[150px]" title="${p.name}">${p.name}</span>
                <span class="inline-block text-[10px] font-mono-num font-bold star-${p.star}-badge px-1 rounded mt-0.5">${p.star}★</span>
              </span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500 shrink-0" stroke-width="2"></i>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      preevoSection.classList.add('hidden');
    }
  }

  // Render Abilities Section
  renderModalAbilities(unit);

  // Upgrades table & level toggle state are (re)rendered by setLevelView(1) above

  // Set inert on background elements to trap focus within modal dialog
  const headerEl = document.getElementById('app-header');
  const mainEl = document.getElementById('main-content');
  const footerEl = document.querySelector('footer');
  if (headerEl) headerEl.setAttribute('inert', '');
  if (mainEl) mainEl.setAttribute('inert', '');
  if (footerEl) footerEl.setAttribute('inert', '');

  const dialog = document.getElementById('unit-modal-dialog');
  modal.classList.remove('hidden', 'closing');
  if (dialog) {
    dialog.classList.remove('modal-exit');
    dialog.classList.add('modal-enter');
  }
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();

  // Send keyboard focus to the modal close button
  requestAnimationFrame(() => {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.focus();
  });
}

// Switch the upgrade table between Level 1 and Level 175 card stats
function setLevelView(level) {
  if (level !== 1 && level !== 175) return;
  currentLevelView = level;

  const btn1 = document.getElementById('btn-level-1');
  const btn175 = document.getElementById('btn-level-175');
  const activeCls = 'bg-sky-600 text-white border-sky-500';
  const idleCls = 'bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500/50 hover:text-sky-300';
  if (btn1) {
    btn1.className = `px-2.5 py-1 rounded-lg text-[11px] font-bold border tap-scale transition-colors flex items-center gap-1 shadow-sm ${level === 1 ? activeCls : idleCls}`;
    btn1.setAttribute('aria-pressed', level === 1 ? 'true' : 'false');
  }
  if (btn175) {
    btn175.className = `px-2.5 py-1 rounded-lg text-[11px] font-bold border tap-scale transition-colors flex items-center gap-1 shadow-sm ${level === 175 ? activeCls : idleCls}`;
    btn175.setAttribute('aria-pressed', level === 175 ? 'true' : 'false');
  }

  const note = document.getElementById('modal-level-note');
  if (note) note.classList.toggle('hidden', level !== 175);
  updateIdolBuffToggleUI();
  updateIdolBuffNote();

  renderModalHeaderStats();
  renderUpgradesTable();
  if (window.lucide) lucide.createIcons();
}

// Rebuild the upgrades table for currentModalUnit at the selected card level
function renderModalHeaderStats() {
  const unit = currentModalUnit;
  if (!unit) return;
  const at175 = currentLevelView === 175;
  const mult = (at175 ? LEVEL_175.damage : 1) * idolBuffMultiplier();

  const baseDmg = unit.upgrades && unit.upgrades.length > 0 ? (unit.upgrades[0].damage || 0) : 0;
  const maxDmg = (unit.max_damage || baseDmg) * mult;
  const maxDps = (unit.max_dps || 0) * mult;

  const maxDmgEl = document.getElementById('modal-max-damage');
  if (maxDmgEl) {
    maxDmgEl.textContent = maxDmg ? Math.round(maxDmg).toLocaleString() : (unit.raw_damage || '0');
    const tags = [];
    if (at175) tags.push('niveau de carte 175');
    if (idolBuffEnabled) tags.push(`buff Idol +${buffProviderPercent() || 0}%`);
    maxDmgEl.title = tags.length ? `Dégâts max au palier le plus élevé, ${tags.join(', ')}` : "Dégâts au palier d'amélioration maximum";
  }
  const maxDpsEl = document.getElementById('modal-max-dps');
  if (maxDpsEl) {
    maxDpsEl.textContent = maxDps ? Math.round(maxDps).toLocaleString() : '-';
    const tags = [];
    if (at175) tags.push('niveau de carte 175');
    if (idolBuffEnabled) tags.push(`buff Idol +${buffProviderPercent() || 0}%`);
    maxDpsEl.title = tags.length ? `DPS max au palier le plus élevé, ${tags.join(', ')}` : 'DPS Max Estimé au palier maximum';
  }
  const dmgLabel = document.getElementById('modal-dmg-range-label');
  if (dmgLabel) {
    const extra = (at175 ? ' • Lvl 175' : '') + (idolBuffEnabled ? ' • Buff Idol' : '');
    dmgLabel.textContent = `${Math.round(baseDmg * mult).toLocaleString()} DMG (Base)  →  ${Math.round(maxDmg).toLocaleString()} DMG (Max)${extra}`;
  }
}

// Rebuild the upgrades table for currentModalUnit at the selected card level
function renderUpgradesTable() {
  const unit = currentModalUnit;
  const tbody = document.getElementById('modal-upgrades-tbody');
  if (!unit || !tbody) return;

  const at175 = currentLevelView === 175;
  const r1 = x => Math.round(x * 10) / 10; // le wiki affiche jusqu'à 2 décimales (ex. 856.8)
  const buffMult = idolBuffMultiplier();
  const statAt = {
    damage: d => (d ? r1(d * (at175 ? LEVEL_175.damage : 1) * buffMult) : d),
    range: r => (at175 && r ? r1(r * LEVEL_175.range) : r),
    spa: s => (at175 && s ? r1(s * LEVEL_175.spa) : s),
  };

  // Colonne « Buff » : uniquement pour les unités qui fournissent un % de buff
  const showBuffCol = unitHasDamageBuff(unit);
  const buffTh = document.getElementById('upg-buff-th');
  if (buffTh) buffTh.classList.toggle('hidden', !showBuffCol);

  if (unit.upgrades && unit.upgrades.length > 0) {
    tbody.innerHTML = unit.upgrades.map((upg, idx) => {
      const abilities = (upg.abilities && upg.abilities.length > 0) ? upg.abilities : [];
      const abilitiesText = abilities.map(a => stripWikiMarkup(a)).join(' • ') || '-';
      const hasAbilities = abilities.length > 0;

      // Check if this upgrade unlocks or references any known ability in unit.abilities
      const matchedAbilities = (unit.abilities && unit.abilities.length > 0) ? unit.abilities.filter(ab => {
        const abLower = ab.name.toLowerCase();
        return abilities.some(aStr => {
          const s = aStr.toLowerCase();
          return s.includes(abLower) || (ab.unlock && s.includes(ab.unlock.toLowerCase()));
        });
      }) : [];
      const hasMatched = matchedAbilities.length > 0;

      const dmg = statAt.damage(upg.damage || 0);
      const rng = statAt.range(upg.range || 0);
      const spa = statAt.spa(upg.spa || 0);
      const dps = (dmg && spa > 0) ? r1(dmg / spa) : 0;

      // % de buff de dégâts offert par CE palier, selon le niveau de carte affiché
      let buffCell = '';
      if (showBuffCol) {
        const lo = upg.buff_damage_low;
        const hi = upg.buff_damage_high;
        if (lo != null || hi != null) {
          const shown = at175 ? (hi ?? lo) : (lo ?? hi);
          const other = at175 ? (lo ?? hi) : (hi ?? lo);
          buffCell = `<td class="p-2.5 font-bold text-sky-300 font-mono-num" title="Buff de dégâts fourni aux unités à portée (aptitude Shine) — ${at175 ? 'niveau de carte 175' : 'niveau de carte 1'}">+${shown}%${other && other !== shown ? ` <span class="text-[10px] text-slate-500 font-mono-num">(${at175 ? 'L1: ' : 'L175: '}+${other}%)</span>` : ''}</td>`;
        } else {
          buffCell = `<td class="p-2.5 text-slate-600 font-mono-num" title="Aucun buff à ce palier (Your Star remplace Shine)">—</td>`;
        }
      }

      return `
        <tr class="hover:bg-slate-800/40 transition ${(hasAbilities || hasMatched) ? 'cursor-pointer' : ''}"
            ${(hasAbilities || hasMatched) ? `onclick="toggleUpgradeAbility(${idx})" title="Cliquer pour lire les effets et détails de capacité"` : ''}>
          <td class="p-2.5 font-bold text-slate-200 font-mono-num">${upg.level !== undefined ? upg.level : idx}</td>
          <td class="p-2.5 font-semibold text-slate-300 font-mono-num">$${(upg.cost || 0).toLocaleString()}</td>
          <td class="p-2.5 font-bold text-slate-100 font-mono-num">${dmg.toLocaleString()}</td>
          <td class="p-2.5 text-slate-300 font-mono-num">${rng}</td>
          <td class="p-2.5 text-slate-400 font-mono-num">${spa}s</td>
          <td class="p-2.5 font-bold text-amber-300 font-mono-num">${dps.toLocaleString()}</td>
          ${buffCell}
          <td class="p-2.5 text-slate-400 font-sans text-[11px]">
            <div class="flex items-center gap-1.5 min-w-0">
              ${hasMatched ? `
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold shrink-0">
                  <i data-lucide="${matchedAbilities[0].type === 'manual' ? 'flame' : 'shield'}" class="w-2.5 h-2.5"></i>
                  <span>${matchedAbilities[0].name}</span>
                </span>
              ` : ''}
              <span class="truncate flex-1 text-slate-300">${abilitiesText}</span>
              ${(hasAbilities || hasMatched) ? `<i data-lucide="maximize-2" id="ability-icon-${idx}" class="w-3 h-3 text-sky-400 shrink-0 transition-transform"></i>` : ''}
            </div>
          </td>
        </tr>
        ${(hasAbilities || hasMatched) ? `
        <tr id="ability-detail-${idx}" class="hidden">
          <td colspan="${showBuffCol ? 8 : 7}" class="px-3 py-3 bg-slate-900/90 border-l-2 border-sky-500/60">
            <div class="font-sans space-y-2">
              <div class="text-[10px] uppercase tracking-wider text-sky-400 font-bold flex items-center justify-between gap-1">
                <span class="flex items-center gap-1">
                  <i data-lucide="sparkles" class="w-3 h-3"></i>
                  Effets du palier ${upg.level !== undefined ? upg.level : idx}
                </span>
                ${hasMatched ? `
                  <button onclick="event.stopPropagation(); scrollToAbilitiesSection()" class="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-semibold normal-case">
                    <i data-lucide="arrow-up-circle" class="w-3 h-3"></i>
                    <span>Voir la fiche complète de l'aptitude</span>
                  </button>
                ` : ''}
              </div>
              <ul class="space-y-1.5">
                ${abilities.map(a => `
                  <li class="text-[12px] text-slate-200 leading-relaxed flex gap-2">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
                    <span>${stripWikiMarkup(a)}</span>
                  </li>
                `).join('')}
              </ul>
              ${matchedAbilities.map(ma => `
                <div class="mt-2.5 p-3 rounded-lg bg-slate-950/90 border border-amber-500/30 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${ma.type === 'manual' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40'}">
                      ${ma.type === 'manual' ? 'Aptitude Manuelle' : 'Passif'}
                    </span>
                    <strong class="text-white text-xs">${ma.name}</strong>
                    ${ma.unlock ? `<span class="text-[10px] text-slate-400 font-mono-num">(${ma.unlock})</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    ${highlightStats(ma.description)}
                  </div>
                </div>
              `).join('')}
            </div>
          </td>
        </tr>` : ''}
      `;
    }).join('');
  } else {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-slate-500 font-sans">
          Statistiques de paliers détaillées non documentées pour cette unité.
        </td>
      </tr>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function closeUnitModal() {
  const modal = document.getElementById('unit-modal');
  const dialog = document.getElementById('unit-modal-dialog');
  if (!modal || modal.classList.contains('hidden')) return;

  // Remove inert on background elements
  const headerEl = document.getElementById('app-header');
  const mainEl = document.getElementById('main-content');
  const footerEl = document.querySelector('footer');
  if (headerEl) headerEl.removeAttribute('inert');
  if (mainEl) mainEl.removeAttribute('inert');
  if (footerEl) footerEl.removeAttribute('inert');

  const onClosed = () => {
    document.body.style.overflow = '';
    if (window.location.hash.startsWith('#unit/')) {
      window.location.hash = currentTab;
    }
    // Restore focus to trigger element
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      try {
        lastFocusedElement.focus();
      } catch (e) {
        // Element might be detached
      }
      lastFocusedElement = null;
    }
  };

  if (dialog) {
    dialog.classList.remove('modal-enter');
    dialog.classList.add('modal-exit');
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('closing');
      dialog.classList.remove('modal-exit');
      onClosed();
    }, 150);
  } else {
    modal.classList.add('hidden');
    onClosed();
  }
}

// Toggle the expanded (large text) ability panel under an upgrade row
function toggleUpgradeAbility(idx) {
  const detailRow = document.getElementById(`ability-detail-${idx}`);
  const icon = document.getElementById(`ability-icon-${idx}`);
  if (!detailRow) return;
  const nowHidden = detailRow.classList.toggle('hidden');
  if (icon) {
    icon.classList.toggle('rotate-90', !nowHidden);
    icon.classList.toggle('text-amber-400', !nowHidden);
    icon.classList.toggle('text-sky-400', nowHidden);
  }
  if (window.lucide) lucide.createIcons();
}

// Toggle the pre-evolutions block on the unit modal
function togglePreEvos() {
  const section = document.getElementById('modal-preevo-section');
  const content = document.getElementById('modal-preevo-content');
  const label = document.getElementById('modal-preevo-btn-label');
  const chevron = document.getElementById('modal-preevo-chevron');
  if (!content) return;
  const nowHidden = content.classList.toggle('hidden');
  const btn = section ? section.querySelector('button') : null;
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
  if (label) label.textContent = nowHidden ? 'Afficher' : 'Masquer';
  if (chevron) chevron.classList.toggle('rotate-180', !nowHidden);
}

// ==========================================
// TIER LIST
// ==========================================

// Miniature 150px : Fandom sert une version webp ~6 Ko (au lieu de ~30 Ko pour le 300px)
function tierThumbUrl(unit) {
  const img = unit && unit.image;
  if (!img) return null;
  if (img.includes('/scale-to-width-down/')) {
    return img.replace(/\/scale-to-width-down\/\d+/, '/scale-to-width-down/150');
  }
  if (img.includes('/revision/')) {
    return img.replace('/revision/latest', '/revision/latest/scale-to-width-down/150')
              .replace('/revision/latest?', '/revision/latest/scale-to-width-down/150?');
  }
  return img;
}

function renderTierList() {
  const container = document.getElementById('tierlist-container');
  if (!container) return;

  const categories = Object.keys(TIERLIST_DATA);
  if (categories.length === 0) {
    container.innerHTML = `<div class="text-slate-400 text-xs">Tier list en cours de chargement...</div>`;
    return;
  }

  container.innerHTML = categories.map(catName => {
    const unitNames = TIERLIST_DATA[catName] || [];

    return `
      <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center space-x-2.5">
            <span class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border bg-sky-950/40 border-sky-500/40 text-sky-300">
              ${catName}
            </span>
            <span class="text-xs text-slate-500 font-mono-num font-semibold">${unitNames.length} unité${unitNames.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2.5">
          ${unitNames.map(name => {
            const unitMatch = ALL_UNITS.find(u => u.name.toLowerCase() === name.toLowerCase());
            if (!unitMatch) {
              return `
                <button onclick="openUnitByName('${name.replace(/'/g, "\\'")}')"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-bold text-white flex items-center space-x-1.5 tap-scale transition-colors">
                  <span>${name}</span>
                  <i data-lucide="external-link" class="w-3 h-3 text-slate-500" stroke-width="1.75"></i>
                </button>
              `;
            }
            const star = unitMatch.star || 6;
            const thumb = tierThumbUrl(unitMatch);
            if (!thumb) {
              return `
                <button onclick="openUnitModal('${unitMatch.id}')"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-bold text-white flex items-center space-x-1.5 tap-scale transition-colors">
                  <span class="text-[10px] font-mono-num px-1 rounded star-${star}-badge">${star}★</span>
                  <span>${name}</span>
                  <i data-lucide="chevron-right" class="w-3 h-3 text-slate-500" stroke-width="2"></i>
                </button>
              `;
            }
            return `
              <button onclick="openUnitModal('${unitMatch.id}')"
                      class="w-[92px] rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-1.5 flex flex-col items-center gap-1 group tap-scale transition-colors">
                <div class="w-full h-[76px] rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-center overflow-hidden">
                  <img src="${thumb}" alt="${name}" loading="lazy"
                       onerror="this.onerror=null;this.closest('div').classList.add('tier-img-fallback');this.style.display='none'"
                       class="max-h-full max-w-full object-contain img-outline rounded group-hover:scale-105 transition-transform duration-150 ease-out">
                </div>
                <span class="text-[9px] font-mono-num font-bold px-1 rounded star-${star}-badge">${star}★</span>
                <span class="text-[10px] font-bold text-white leading-tight text-center line-clamp-2 w-full" title="${name}">${name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openUnitByName(name) {
  const unit = ALL_UNITS.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (unit) {
    openUnitModal(unit.id);
  } else {
    showToast(`Unité ${name} consultée`);
    window.open(`https://allstartd.fandom.com/wiki/${encodeURIComponent(name)}`, '_blank');
  }
}

// ==========================================
// CODES
// ==========================================

// Date du format wiki "23.06.2026" en timestamp ; 0 si absente/invalide
function codeTimestamp(c) {
  const m = (c.date || '').match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : 0;
}

function renderCodes() {
  const activeGrid = document.getElementById('active-codes-grid');
  const expiredCount = document.getElementById('expired-codes-count');
  const expiredList = document.getElementById('expired-codes-list');

  if (expiredCount) expiredCount.textContent = CODES_DATA.expired.length;

  if (activeGrid) {
    activeGrid.innerHTML = CODES_DATA.active.map(c => `
      <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition-colors duration-150">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Vérifié & Actif
            </span>
            <span class="text-[11px] text-slate-400 font-mono-num">${c.date || 'Récent'}</span>
          </div>
          <div class="font-mono-num text-base font-bold text-white tracking-wide my-2 select-all bg-[#090e1c] px-3 py-2 rounded-lg border border-slate-800">
            ${c.code}
          </div>
          <div class="text-xs text-slate-300 bg-[#090e1c]/70 p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 font-sans">Récompenses :</strong> ${c.reward}
          </div>
        </div>
        <button onclick="copyCodeText('${c.code}', this)" aria-label="Copier le code ${c.code}" class="w-full ps-3 pe-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wide tap-scale flex items-center justify-center space-x-1.5 shadow-sm transition-colors">
          <i data-lucide="copy" class="w-3.5 h-3.5 text-white" stroke-width="2.5"></i>
          <span>Copier le code</span>
        </button>
      </div>
    `).join('');
  }

  if (expiredList) {
    renderExpiredCodesList(CODES_DATA.expired);
  }

  if (window.lucide) lucide.createIcons();
}

function renderExpiredCodesList(list) {
  const expiredList = document.getElementById('expired-codes-list');
  if (!expiredList) return;
  if (list.length === 0) {
    expiredList.innerHTML = `<span class="text-xs text-slate-400 italic py-1">Aucun code expiré ne correspond à cette recherche.</span>`;
    return;
  }
  expiredList.innerHTML = list.slice(0, 100).map(c => `
    <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono-num text-slate-500 line-through">
      ${c.code}
    </span>
  `).join('');
}

function filterExpiredCodes() {
  const query = (document.getElementById('search-expired-codes')?.value || '').toLowerCase().trim();
  const filtered = CODES_DATA.expired.filter(c => c.code.toLowerCase().includes(query));
  renderExpiredCodesList(filtered);
}

function toggleExpiredCodes() {
  const wrapper = document.getElementById('expired-codes-wrapper');
  const arrow = document.getElementById('expired-arrow');
  const btn = document.getElementById('toggle-expired-btn');
  if (!wrapper) return;
  const nowHidden = wrapper.classList.toggle('hidden');
  if (arrow) arrow.classList.toggle('rotate-180', !nowHidden);
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
}

function copyLatestCode() {
  if (CODES_DATA.active && CODES_DATA.active.length > 0) {
    copyCodeText(CODES_DATA.active[0].code);
  }
}

function copyCodeText(text, btnElement) {
  const btn = btnElement || (window.event && window.event.currentTarget);
  const doFeedback = () => {
    showToast(`Code "${text}" copié !`);
    if (btn) {
      const origHTML = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-slate-950" stroke-width="2.5"></i><span>Copié !</span>`;
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = origHTML;
        if (window.lucide) lucide.createIcons();
      }, 1800);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(doFeedback).catch(() => {
      fallbackCopyText(text);
      doFeedback();
    });
  } else {
    fallbackCopyText(text);
    doFeedback();
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ==========================================
// ORBS COMPENDIUM
// ==========================================

function renderOrbCard(o) {
  const fallback = 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
  const isUniversal = /toutes les unit|all units/i.test(o.require || '');
  return `
    <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between space-y-3 hover:border-sky-500/40 tap-scale-subtle transition-colors">
      <div>
        <div class="flex items-center space-x-3 mb-2.5">
          <div class="w-10 h-10 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center shrink-0">
            <img src="${o.image || fallback}" alt="${o.name}" class="max-h-full max-w-full object-contain img-outline rounded"
                 onerror="this.src='${fallback}'">
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-xs text-white truncate">${o.name}</h4>
            <span class="text-[10px] font-semibold ${isUniversal ? 'text-sky-300' : 'text-slate-400'}"
                  title="${isUniversal ? 'Équipable par toutes les unités' : 'Réservé à cette unité (ou sa famille)'}">
              ${isUniversal ? '★ Toutes les unités' : o.require}
            </span>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 block text-[10px] uppercase font-sans">Bonus statistique :</strong>
            <span class="text-slate-100 font-medium font-mono-num text-[11px]">${o.effect || 'Bonus spécial'}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">Obtention :</strong> ${o.obtain || 'Trial / Raid'}
          </div>
          ${!isUniversal ? `
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">Compatible :</strong> <span class="text-sky-300">${o.require}</span>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderOrbs() {
  const grid = document.getElementById('orbs-grid');
  if (!grid) return;
  grid.innerHTML = ORBS_DATA.map(renderOrbCard).join('');
  if (window.lucide) lucide.createIcons();
}

function filterOrbs() {
  const query = (document.getElementById('search-orbs')?.value || '').toLowerCase().trim();
  const grid = document.getElementById('orbs-grid');
  if (!grid) return;

  const filtered = ORBS_DATA.filter(o =>
    o.name.toLowerCase().includes(query) ||
    (o.effect || '').toLowerCase().includes(query) ||
    (o.require || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-10 px-4 text-center text-slate-300 tactical-card rounded-2xl border border-slate-800 max-w-md mx-auto">
        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400">
          <i data-lucide="search-x" class="w-6 h-6" stroke-width="2"></i>
        </div>
        <h3 class="text-sm font-bold text-white text-balance">Aucun orbe trouvé</h3>
        <p class="text-xs text-slate-400 mt-1 text-pretty">
          Aucun orbe ne correspond à la recherche « <strong class="text-white">${query}</strong> ».
        </p>
        <button onclick="const el=document.getElementById('search-orbs'); if(el){el.value=''; filterOrbs();}" class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale inline-flex items-center gap-1.5 shadow-md">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5" stroke-width="2"></i>
          <span>Effacer la recherche</span>
        </button>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(renderOrbCard).join('');
  }
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// GAME MODES & RAIDS
// ==========================================

function renderGameModes() {
  const grid = document.getElementById('gamemodes-grid');
  if (!grid) return;

  grid.innerHTML = GAMEMODES_DATA.map(mode => `
    <div class="tactical-card rounded-xl p-5 border border-slate-800/80 bg-[#0f1629]/95 space-y-3 hover:border-sky-500/40 transition-colors tap-scale-subtle">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i data-lucide="swords" class="w-4 h-4 text-sky-400" stroke-width="2"></i>
          <span>${mode.name}</span>
        </h3>
        <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
          ${mode.type}
        </span>
      </div>

      <p class="text-xs text-slate-300 leading-relaxed">
        ${mode.description}
      </p>

      <div class="bg-[#090e1c] p-3 rounded-lg border border-slate-800/80 text-[11px]">
        <strong class="text-amber-300 font-semibold">Récompenses :</strong> ${mode.rewards}
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// TEAM BUILDER (6 SLOTS)
// ==========================================

function renderTeamBuilder() {
  const slotsContainer = document.getElementById('team-slots-container');
  if (!slotsContainer) return;

  slotsContainer.innerHTML = teamSlots.map((unit, idx) => {
    if (unit) {
      return `
        <div class="tactical-card rounded-xl p-3 border border-slate-800/80 bg-[#0f1629]/95 relative flex flex-col items-center text-center group tap-scale-subtle">
          <button onclick="removeUnitFromTeam(${idx})" aria-label="Retirer ${unit.name} du deck" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center tap-scale transition-colors shadow-sm" title="Retirer ${unit.name} du deck">
            <i data-lucide="x" class="w-3.5 h-3.5" stroke-width="2.5"></i>
          </button>
          <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center my-1 overflow-hidden">
            <img src="${unit.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${unit.name}">
          </div>
          <div class="font-bold text-xs text-white truncate w-full" title="${unit.name}">
            ${unit.name}
          </div>
          <span class="text-[10px] text-amber-300 font-mono-num font-bold">${unit.star}★ • ${unit.tower_type || 'Ground'}</span>
          <div class="text-[10px] text-slate-300 font-mono-num font-semibold mt-0.5">
            Dép: $${(unit.deployment_cost || 0).toLocaleString()}
          </div>
        </div>
      `;
    } else {
      return `
        <button type="button" onclick="focusTeamSearch()" aria-label="Slot ${idx + 1} vide. Cliquer pour rechercher une tour." class="border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 h-36 hover:border-sky-500/50 hover:text-sky-400 tap-scale transition-colors cursor-pointer group w-full text-center bg-[#090e1c]/40">
          <i data-lucide="plus-circle" class="w-6 h-6 mb-1.5 text-slate-500 group-hover:text-sky-400 transition-colors" stroke-width="2"></i>
          <span class="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">SLOT ${idx + 1}</span>
          <span class="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">Ajouter une tour</span>
        </button>
      `;
    }
  }).join('');

  updateTeamStats();
  renderTeamPicker();
  if (window.lucide) lucide.createIcons();
}

function updateTeamStats() {
  const activeUnits = teamSlots.filter(u => u !== null);
  
  let totalDeploy = 0;
  let totalMax = 0;
  let totalDps = 0;

  activeUnits.forEach(u => {
    totalDeploy += (u.deployment_cost || 0);
    totalMax += (u.total_cost || 0);
    totalDps += (u.max_dps || 0);
  });

  const deployEl = document.getElementById('team-stat-deploy');
  const totalEl = document.getElementById('team-stat-total');
  const dpsEl = document.getElementById('team-stat-dps');

  if (deployEl) deployEl.textContent = `$${totalDeploy.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `$${totalMax.toLocaleString()}`;
  if (dpsEl) dpsEl.textContent = totalDps.toLocaleString();

  const hasGround = activeUnits.some(u => (u.tower_type || '').toLowerCase().includes('ground'));
  const hasAir = activeUnits.some(u => (u.tower_type || '').toLowerCase().includes('air') || (u.tower_type || '').toLowerCase().includes('hybrid'));
  const hasMoney = activeUnits.some(u => ['jeff', 'octo', 'bulma', 'speedwagon', 'escanor', 'money'].some(k => u.name.toLowerCase().includes(k)));
  const hasSlowOrSupport = activeUnits.some(u => ['bb', 'blackbeard', 'idol', 'support', 'slow', 'freeze', 'time'].some(k => u.name.toLowerCase().includes(k) || (u.overview || '').toLowerCase().includes(k)));

  const checklistEl = document.getElementById('team-checklist');
  if (checklistEl) {
    checklistEl.innerHTML = `
      <div class="p-2.5 rounded-xl ${hasGround ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasGround ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">Anti-Sol (Ground)</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasAir ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasAir ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">Anti-Aérien (Air)</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasMoney ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasMoney ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">Économie / Farm</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasSlowOrSupport ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasSlowOrSupport ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">Support / Contrôle</span>
      </div>
    `;
  }
}

function renderTeamPicker() {
  const query = (document.getElementById('team-search-input')?.value || '').toLowerCase().trim();
  const pickerGrid = document.getElementById('team-picker-grid');
  if (!pickerGrid) return;

  const filtered = ALL_UNITS.filter(u => {
    if (!query) return u.star >= 6;
    return u.name.toLowerCase().includes(query) || (u.anime_origin || '').toLowerCase().includes(query);
  }).slice(0, 18);

  pickerGrid.innerHTML = filtered.map(u => `
    <div class="tactical-card p-2.5 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 text-center flex flex-col items-center justify-between group">
      <div class="w-12 h-12 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center my-1 overflow-hidden">
        <img src="${u.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${u.name}">
      </div>
      <div class="text-[11px] font-bold text-white truncate w-full" title="${u.name}">${u.name}</div>
      <span class="text-[10px] star-${u.star}-badge px-1.5 py-0.5 rounded my-1 font-mono-num font-bold">${u.star}★</span>
      <button onclick="addUnitToTeam('${u.id}')" aria-label="Ajouter ${u.name} au deck" class="w-full py-1 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-[10px] font-bold tap-scale transition-colors shadow-sm">
        + Ajouter
      </button>
    </div>
  `).join('');
}

function focusTeamSearch() {
  document.getElementById('team-search-input')?.focus();
}

function addUnitToTeam(unitId) {
  const unit = ALL_UNITS.find(u => u.id === unitId);
  if (!unit) return;

  const emptyIndex = teamSlots.findIndex(s => s === null);
  if (emptyIndex === -1) {
    showToast("Votre deck de 6 unités est plein !");
    return;
  }

  if (teamSlots.some(s => s && s.id === unit.id)) {
    showToast(`${unit.name} est déjà dans le deck !`);
    return;
  }

  teamSlots[emptyIndex] = unit;
  showToast(`${unit.name} ajouté au slot ${emptyIndex + 1}`);
  renderTeamBuilder();
}

function addCurrentModalUnitToTeam() {
  if (currentModalUnit) {
    addUnitToTeam(currentModalUnit.id);
  }
}

function removeUnitFromTeam(index) {
  if (teamSlots[index]) {
    const name = teamSlots[index].name;
    teamSlots[index] = null;
    showToast(`${name} retiré du deck`);
    renderTeamBuilder();
  }
}

function clearTeam() {
  teamSlots = [null, null, null, null, null, null];
  showToast("Le deck a été vidé");
  renderTeamBuilder();
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('hidden', 'toast-animate-out');
  toast.classList.add('toast-animate-in');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-animate-in');
    toast.classList.add('toast-animate-out');
    setTimeout(() => {
      if (toast.classList.contains('toast-animate-out')) {
        toast.classList.add('hidden');
        toast.classList.remove('toast-animate-out');
      }
    }, 150);
  }, 2200);

  if (window.lucide) lucide.createIcons();
}
