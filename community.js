// ==========================================================================
// ASTD WIKI & DATABASE - MODULE DE CONTRIBUTION COMMUNAUTAIRE (DÉBUTANT)
// Permet d'ajouter, modifier et supprimer des unités, codes et conseils.
// Architecture hybride : persistance serveur local (server.py) + localStorage
// ==========================================================================



function stripHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/[\uFFFD\u0080-\u009F]/g, '')
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CommunityManager = (function() {
  const STORAGE_KEY = 'astd_community_contributions';
  const API_ENDPOINT = '/api/community';

  let state = {
    version: 1,
    last_updated: new Date().toISOString(),
    units: {},         // { [unitId]: unitObject }
    deleted_units: [], // [ unitId1, unitId2... ]
    orbs: {},          // { [orbName]: orbObject }
    deleted_orbs: [],  // [ orbName1, orbName2... ]
    codes: [],         // [ { code, reward, date, status } ]
    tips: {},          // { [unitId]: [ { id, author, type, text, date } ] }
    tierlist: null,    // { [categoryName]: [ unitNames... ] } ou null si officiel
    custom_tierlists: {} // { [presetName]: { [categoryName]: [ unitNames... ] } }
  };

  let isServerAvailable = false;
  let originalUnitsBackup = null;
  let originalOrbsBackup = null;
  let originalTierlistBackup = null;

  // Initialisation : charge depuis le serveur ou localStorage
  async function init() {
    // 1. Sauvegarder une copie propre des unités, orbes et tier list officiels au premier chargement
    const currentList = window.getGlobalUnits ? window.getGlobalUnits() : window.ALL_UNITS;
    if (!originalUnitsBackup && Array.isArray(currentList) && currentList.length > 0) {
      originalUnitsBackup = JSON.parse(JSON.stringify(currentList));
    }
    const currentOrbsList = window.getGlobalOrbs ? window.getGlobalOrbs() : window.ORBS_DATA;
    if (!originalOrbsBackup && Array.isArray(currentOrbsList) && currentOrbsList.length > 0) {
      originalOrbsBackup = JSON.parse(JSON.stringify(currentOrbsList));
    }
    const currentTier = window.getGlobalTierList ? window.getGlobalTierList() : window.TIERLIST_DATA;
    if (!originalTierlistBackup && currentTier && typeof currentTier === 'object' && Object.keys(currentTier).length > 0) {
      originalTierlistBackup = JSON.parse(JSON.stringify(currentTier));
    }

    // 2. Tenter de charger depuis l'API locale du serveur uniquement hors hébergement statique (GitHub Pages / file://)
    const isStaticHost = typeof window !== 'undefined' && (
      (window.location.hostname && window.location.hostname.includes('github.io')) ||
      window.location.protocol === 'file:'
    );

    if (isStaticHost) {
      isServerAvailable = false;
      loadFromLocalStorage();
    } else {
      try {
        const res = await fetch(API_ENDPOINT, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            state.units = data.units || {};
            state.deleted_units = data.deleted_units || [];
            state.orbs = data.orbs || {};
            state.deleted_orbs = data.deleted_orbs || [];
            state.codes = data.codes || [];
            state.tips = data.tips || {};
            state.tierlist = data.tierlist || null;
            state.custom_tierlists = data.custom_tierlists || {};
            isServerAvailable = true;
            saveToLocalStorage();
          }
        } else {
          loadFromLocalStorage();
        }
      } catch (e) {
        // Serveur injoignable -> fallback localStorage
        isServerAvailable = false;
        loadFromLocalStorage();
      }
    }

    updateCommunityBadge();
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state.units = parsed.units || {};
        state.deleted_units = parsed.deleted_units || [];
        state.orbs = parsed.orbs || {};
        state.deleted_orbs = parsed.deleted_orbs || [];
        state.codes = parsed.codes || [];
        state.tips = parsed.tips || {};
        state.tierlist = parsed.tierlist || null;
        state.custom_tierlists = parsed.custom_tierlists || {};
      }
    } catch (e) {
      console.warn('Erreur lecture localStorage communautaire:', e);
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Erreur écriture localStorage communautaire:', e);
    }
  }

  // Sauvegarde sur le serveur local si disponible
  async function syncWithServer(action, payload = {}) {
    saveToLocalStorage();
    const isStaticHost = typeof window !== 'undefined' && (
      (window.location.hostname && window.location.hostname.includes('github.io')) ||
      window.location.protocol === 'file:'
    );
    if (isStaticHost || !isServerAvailable) return;
    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
    } catch (e) {
      console.warn('Échec synchro serveur local, données conservées en local:', e);
    }
  }

  // Fusionne les modifications communautaires dans les données du site
  function applyToGlobalData() {
    const currentList = window.getGlobalUnits ? window.getGlobalUnits() : window.ALL_UNITS;
    if (Array.isArray(currentList)) {
      if (!originalUnitsBackup) {
        originalUnitsBackup = currentList.slice();
      }

      const hasUnitChanges = (state.units && Object.keys(state.units).length > 0) ||
                             (state.deleted_units && state.deleted_units.length > 0);

      if (!hasUnitChanges) {
        if (window.setGlobalUnits) {
          window.setGlobalUnits(originalUnitsBackup);
        } else {
          window.ALL_UNITS = originalUnitsBackup;
        }
      } else {
        let workingList = originalUnitsBackup.slice();
        const deletedSet = new Set(state.deleted_units || []);
        workingList = workingList.filter(u => !deletedSet.has(u.id));

        const communityUnits = Object.values(state.units || {});
        communityUnits.forEach(commUnit => {
          if (deletedSet.has(commUnit.id)) return;
          const existingIdx = workingList.findIndex(u => u.id === commUnit.id);
          if (existingIdx >= 0) {
            workingList[existingIdx] = {
              ...workingList[existingIdx],
              ...commUnit,
              _is_community_modified: true
            };
          } else {
            workingList.unshift({
              ...commUnit,
              _is_community_new: true
            });
          }
        });

        if (window.setGlobalUnits) {
          window.setGlobalUnits(workingList);
        } else {
          window.ALL_UNITS = workingList;
        }
      }
    }

    // 3. Fusionner les orbes communautaires
    const currentOrbs = window.getGlobalOrbs ? window.getGlobalOrbs() : window.ORBS_DATA;
    if (Array.isArray(currentOrbs)) {
      if (!originalOrbsBackup && currentOrbs.length > 0) {
        originalOrbsBackup = currentOrbs.slice();
      }
      if (originalOrbsBackup) {
        const hasOrbChanges = (state.orbs && Object.keys(state.orbs).length > 0) ||
                              (state.deleted_orbs && state.deleted_orbs.length > 0);
        if (!hasOrbChanges) {
          if (window.setGlobalOrbs) {
            window.setGlobalOrbs(originalOrbsBackup);
          } else {
            window.ORBS_DATA = originalOrbsBackup;
          }
        } else {
          let workingOrbs = originalOrbsBackup.slice();
          const deletedOrbsSet = new Set((state.deleted_orbs || []).map(n => (n || '').toLowerCase()));
          workingOrbs = workingOrbs.filter(o => !deletedOrbsSet.has((o.name || '').toLowerCase()));

          const communityOrbs = Object.values(state.orbs || {});
          communityOrbs.forEach(commOrb => {
            if (!commOrb || !commOrb.name) return;
            if (deletedOrbsSet.has(commOrb.name.toLowerCase())) return;
            const existingIdx = workingOrbs.findIndex(o => (o.name || '').toLowerCase() === commOrb.name.toLowerCase());
            if (existingIdx >= 0) {
              workingOrbs[existingIdx] = {
                ...workingOrbs[existingIdx],
                ...commOrb,
                _is_community_modified: true
              };
            } else {
              workingOrbs.unshift({
                ...commOrb,
                _is_community_new: true
              });
            }
          });

          if (window.setGlobalOrbs) {
            window.setGlobalOrbs(workingOrbs);
          } else {
            window.ORBS_DATA = workingOrbs;
          }
        }

        const currentWorkingOrbs = window.getGlobalOrbs ? window.getGlobalOrbs() : window.ORBS_DATA;
        const statOrbsEl = document.getElementById('stat-orbs-count');
        if (statOrbsEl) statOrbsEl.textContent = (currentWorkingOrbs || []).length;
        if (window.renderOrbs) window.renderOrbs();
      }
    }

    // 4. Fusionner les codes promotionnels communautaires
    if (window.CODES_DATA && Array.isArray(state.codes) && state.codes.length > 0) {
      state.codes.forEach(commCode => {
        const targetList = commCode.status === 'expired' ? window.CODES_DATA.expired : window.CODES_DATA.active;
        if (!Array.isArray(targetList)) return;
        const exists = targetList.find(c => c.code.toLowerCase() === commCode.code.toLowerCase());
        if (exists) {
          Object.assign(exists, commCode, { _is_community: true });
        } else {
          targetList.unshift({ ...commCode, _is_community: true });
        }
      });
    }

    // 5. Appliquer les modifications de Tier List
    if (state.tierlist && typeof state.tierlist === 'object') {
      if (window.setGlobalTierList) {
        window.setGlobalTierList(state.tierlist);
      } else {
        window.TIERLIST_DATA = state.tierlist;
      }
      const badgeModified = document.getElementById('tierlist-badge-modified');
      if (badgeModified) badgeModified.classList.remove('hidden');
    } else if (originalTierlistBackup) {
      if (window.setGlobalTierList) {
        window.setGlobalTierList(originalTierlistBackup);
      } else {
        window.TIERLIST_DATA = originalTierlistBackup;
      }
      const badgeModified = document.getElementById('tierlist-badge-modified');
      if (badgeModified) badgeModified.classList.add('hidden');
    }

    if (window.renderTierList) {
      window.renderTierList();
    }

    if (window.invalidateRenderedTabs) {
      window.invalidateRenderedTabs(window.currentTab || 'units');
    }

    updateCommunityBadge();
  }

  function updateCommunityBadge() {
    const count = Object.keys(state.units || {}).length +
                  (state.deleted_units || []).length +
                  Object.keys(state.orbs || {}).length +
                  (state.deleted_orbs || []).length +
                  (state.codes || []).length +
                  (state.tierlist ? 1 : 0);
    const badge = document.getElementById('badge-community-count');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  // --- ACTIONS CRUD UNITÉS ---

  async function saveUnit(unitData) {
    const name = stripHtml(unitData.name);
    if (!name) {
      alert(window.t ? window.t('comm_name_required', 'Le nom de l\'unité est obligatoire.') : 'Le nom de l\'unité est obligatoire.');
      return false;
    }

    const id = unitData.id || name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    // Récupérer les paliers d'amélioration manuels saisis par l'utilisateur
    let upgrades = Array.isArray(unitData.upgrades) && unitData.upgrades.length > 0 ? unitData.upgrades : null;

    let deployCost = parseInt(unitData.deployment_cost, 10) || 500;
    let totCost = parseInt(unitData.total_cost, 10) || 5000;
    let dmg = parseFloat(unitData.max_damage) || 0;
    let rng = parseInt(unitData.max_range, 10) || 60;
    let spa = parseFloat(unitData.min_spa) || 1;
    let dps = spa > 0 ? parseFloat((dmg / spa).toFixed(1)) : dmg;

    // Dériver directement les statistiques globales à partir des paliers manuels sans calcul arbitraire
    if (upgrades && upgrades.length > 0) {
      deployCost = Number(upgrades[0].cost) || 0;
      totCost = upgrades.reduce((acc, u) => acc + (Number(u.cost) || 0), 0);
      dmg = Math.max(...upgrades.map(u => Number(u.damage) || 0));
      rng = Math.max(...upgrades.map(u => Number(u.range) || 0));
      const validSpas = upgrades.map(u => Number(u.spa) || 0).filter(s => s > 0);
      spa = validSpas.length > 0 ? Math.min(...validSpas) : 1;
      const dpsList = upgrades.map(u => {
        const d = Number(u.damage) || 0;
        const s = Number(u.spa) || 0;
        return s > 0 ? d / s : d;
      });
      dps = Math.round(Math.max(...dpsList));
    } else {
      upgrades = [
        { level: 0, cost: deployCost, damage: dmg, range: rng, spa: spa, dps: dps, tower_type: unitData.tower_type || 'Ground', attack_type: unitData.attack_type || 'AoE (Circle)', abilities: [] }
      ];
    }

    const unitObj = {
      id: id,
      name: name,
      star: parseInt(unitData.star, 10) || 5,
      tower_type: unitData.tower_type || 'Ground',
      attack_type: unitData.attack_type || 'AoE (Circle)',
      deployment_cost: deployCost,
      total_cost: totCost,
      max_damage: dmg,
      max_range: rng,
      min_spa: spa,
      max_dps: dps,
      character_origin: unitData.character_origin ? stripHtml(unitData.character_origin) : null,
      anime_origin: unitData.anime_origin ? stripHtml(unitData.anime_origin) : 'ASTD Community',
      overview: unitData.overview ? stripHtml(unitData.overview) : 'Unité ajoutée par la communauté ASTD.',
      image: unitData.image && unitData.image.trim() ? unitData.image.trim() : 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png',
      is_tradeable: !!unitData.is_tradeable,
      is_unobtainable: !!unitData.is_unobtainable,
      upgrades: upgrades,
      _community: true,
      created_at: unitData.created_at || new Date().toISOString()
    };

    state.units[id] = unitObj;
    state.deleted_units = state.deleted_units.filter(uId => uId !== id);

    await syncWithServer('save_unit', { unit: unitObj });
    applyToGlobalData();

    if (window.applyUnitFilters) window.applyUnitFilters();
    else if (window.filterUnits) window.filterUnits();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_unit_saved', 'Unité "{name}" enregistrée avec succès !').replace('{name}', name) : `Unité "${name}" enregistrée avec succès !`;
    if (window.showToast) window.showToast(msg);

    return true;
  }

  async function deleteUnit(unitId) {
    const unit = (window.ALL_UNITS || []).find(u => u.id === unitId) || state.units[unitId];
    const unitName = unit ? unit.name : unitId;

    const confirmMsg = window.t ?
      window.t('comm_confirm_delete_unit', 'Voulez-vous vraiment retirer l\'unité "{name}" du wiki ? (Vous pourrez la restaurer à tout moment).').replace('{name}', unitName) :
      `Voulez-vous vraiment retirer l'unité "${unitName}" du wiki ? (Vous pourrez la restaurer à tout moment).`;

    if (!confirm(confirmMsg)) return;

    if (state.units[unitId]) {
      delete state.units[unitId];
    }
    if (!state.deleted_units.includes(unitId)) {
      state.deleted_units.push(unitId);
    }

    await syncWithServer('delete_unit', { unit_id: unitId });
    applyToGlobalData();

    if (window.closeUnitModal) window.closeUnitModal();
    if (window.applyUnitFilters) window.applyUnitFilters();
    else if (window.filterUnits) window.filterUnits();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_unit_removed', 'Unité "{name}" retirée.').replace('{name}', unitName) : `Unité "${unitName}" retirée.`;
    if (window.showToast) window.showToast(msg);
  }

  async function restoreUnit(unitId) {
    state.deleted_units = state.deleted_units.filter(id => id !== unitId);
    await syncWithServer('restore_unit', { unit_id: unitId });
    applyToGlobalData();
    if (window.applyUnitFilters) window.applyUnitFilters();
    else if (window.filterUnits) window.filterUnits();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_unit_restored', 'Unité restaurée dans l\'encyclopédie !') : 'Unité restaurée dans l\'encyclopédie !';
    if (window.showToast) window.showToast(msg);
  }

  // --- ACTIONS CRUD ORBES ---

  async function saveOrb(orbData) {
    const name = stripHtml(orbData.name);
    if (!name) {
      alert(window.t ? window.t('comm_orb_name_required', 'Le nom de l\'orbe est obligatoire.') : 'Le nom de l\'orbe est obligatoire.');
      return false;
    }

    const orbObj = {
      name: name,
      image: orbData.image && orbData.image.trim() ? orbData.image.trim() : 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png',
      effect: orbData.effect ? stripHtml(orbData.effect) : 'Bonus spécial',
      obtain: orbData.obtain ? stripHtml(orbData.obtain) : 'Fabrication Boutique / Raids',
      require: orbData.require ? stripHtml(orbData.require) : 'All units',
      _is_community: true,
      created_at: orbData.created_at || new Date().toISOString()
    };

    if (!state.orbs) state.orbs = {};

    // Si l'orbe a été renommé lors de l'édition, nettoyer l'ancien nom
    if (orbData._original_name && orbData._original_name !== name) {
      if (state.orbs[orbData._original_name]) {
        delete state.orbs[orbData._original_name];
      }
      if (originalOrbsBackup && originalOrbsBackup.some(o => o.name.toLowerCase() === orbData._original_name.toLowerCase())) {
        if (!state.deleted_orbs) state.deleted_orbs = [];
        if (!state.deleted_orbs.includes(orbData._original_name)) {
          state.deleted_orbs.push(orbData._original_name);
        }
      }
    }

    state.orbs[name] = orbObj;
    state.deleted_orbs = (state.deleted_orbs || []).filter(n => (n || '').toLowerCase() !== name.toLowerCase());

    await syncWithServer('save_orb', { orb: orbObj });
    applyToGlobalData();

    if (window.renderOrbs) window.renderOrbs();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_orb_saved', 'Orbe "{name}" enregistré avec succès !').replace('{name}', name) : `Orbe "${name}" enregistré avec succès !`;
    if (window.showToast) window.showToast(msg);
    return true;
  }

  async function deleteOrb(orbName) {
    const confirmMsg = window.t ?
      window.t('comm_confirm_delete_orb', 'Voulez-vous vraiment retirer l\'orbe "{name}" ? (Vous pourrez le restaurer à tout moment).').replace('{name}', orbName) :
      `Voulez-vous vraiment retirer l'orbe "${orbName}" ? (Vous pourrez le restaurer à tout moment).`;

    if (!confirm(confirmMsg)) return;

    if (state.orbs && state.orbs[orbName]) {
      delete state.orbs[orbName];
    }
    if (!state.deleted_orbs) state.deleted_orbs = [];
    if (!state.deleted_orbs.includes(orbName)) {
      state.deleted_orbs.push(orbName);
    }

    await syncWithServer('delete_orb', { name: orbName });
    applyToGlobalData();

    if (window.renderOrbs) window.renderOrbs();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_orb_removed', 'Orbe "{name}" retiré.').replace('{name}', orbName) : `Orbe "${orbName}" retiré.`;
    if (window.showToast) window.showToast(msg);
  }

  async function restoreOrb(orbName) {
    state.deleted_orbs = (state.deleted_orbs || []).filter(n => (n || '').toLowerCase() !== (orbName || '').toLowerCase());
    await syncWithServer('restore_orb', { name: orbName });
    applyToGlobalData();

    if (window.renderOrbs) window.renderOrbs();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_orb_restored', 'Orbe "{name}" restauré !').replace('{name}', orbName) : `Orbe "${orbName}" restauré !`;
    if (window.showToast) window.showToast(msg);
  }

  // --- ACTIONS CRUD CODES ---

  async function saveCode(codeData) {
    if (!codeData.code || !codeData.code.trim()) {
      alert(window.t ? window.t('comm_code_required', 'Le code promo est obligatoire.') : 'Le code promo est obligatoire.');
      return false;
    }
    const codeStr = codeData.code.trim();
    const codeObj = {
      code: codeStr,
      reward: codeData.reward ? codeData.reward.trim() : 'Gemmes & Stardust',
      date: codeData.date || new Date().toLocaleDateString('fr-FR'),
      status: codeData.status || 'active',
      _is_community: true
    };

    const existingIdx = state.codes.findIndex(c => c.code.toLowerCase() === codeStr.toLowerCase());
    if (existingIdx >= 0) {
      state.codes[existingIdx] = codeObj;
    } else {
      state.codes.unshift(codeObj);
    }

    await syncWithServer('save_code', { code: codeObj });
    applyToGlobalData();

    if (window.renderCodes) window.renderCodes();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_code_saved', 'Code "{code}" enregistré avec succès !').replace('{code}', codeStr) : `Code "${codeStr}" enregistré avec succès !`;
    if (window.showToast) window.showToast(msg);
    return true;
  }

  async function toggleCodeExpired(codeStr) {
    const existing = state.codes.find(c => c.code.toLowerCase() === codeStr.toLowerCase());
    if (existing) {
      existing.status = existing.status === 'active' ? 'expired' : 'active';
      await syncWithServer('save_code', { code: existing });
    } else {
      const activeObj = (window.CODES_DATA?.active || []).find(c => c.code.toLowerCase() === codeStr.toLowerCase());
      const newCodeObj = {
        code: codeStr,
        reward: activeObj ? activeObj.reward : 'Récompenses',
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'expired',
        _is_community: true
      };
      state.codes.unshift(newCodeObj);
      await syncWithServer('save_code', { code: newCodeObj });
    }

    applyToGlobalData();
    if (window.renderCodes) window.renderCodes();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_code_status_updated', 'Statut du code "{code}" mis à jour.').replace('{code}', codeStr) : `Statut du code "${codeStr}" mis à jour.`;
    if (window.showToast) window.showToast(msg);
  }

  async function deleteCode(codeStr) {
    state.codes = state.codes.filter(c => c.code.toLowerCase() !== codeStr.toLowerCase());
    await syncWithServer('delete_code', { code: codeStr });
    applyToGlobalData();
    if (window.renderCodes) window.renderCodes();
    renderCommunityHub();
  }

  // --- ACTIONS CONSEILS / TIPS ---

  async function saveTip(unitId, tipData) {
    if (!tipData.text || !tipData.text.trim()) {
      alert(window.t ? window.t('comm_tip_required', 'Le texte de votre conseil est requis.') : 'Le texte de votre conseil est requis.');
      return false;
    }
    if (!state.tips[unitId]) {
      state.tips[unitId] = [];
    }
    const tipObj = {
      id: tipData.id || ('tip_' + Date.now()),
      author: tipData.author && tipData.author.trim() ? tipData.author.trim() : 'Joueur ASTD',
      type: tipData.type || 'meta',
      text: tipData.text.trim(),
      date: new Date().toLocaleDateString('fr-FR')
    };

    const existingIdx = state.tips[unitId].findIndex(t => t.id === tipObj.id);
    if (existingIdx >= 0) {
      state.tips[unitId][existingIdx] = tipObj;
    } else {
      state.tips[unitId].unshift(tipObj);
    }

    await syncWithServer('save_tip', { unit_id: unitId, tip: tipObj });
    renderUnitCommunityTips(unitId);
    renderCommunityHub();

    const msg = window.t ? window.t('comm_tip_saved', 'Conseil ajouté avec succès !') : 'Conseil ajouté avec succès !';
    if (window.showToast) window.showToast(msg);
    return true;
  }

  async function deleteTip(unitId, tipId) {
    if (state.tips[unitId]) {
      state.tips[unitId] = state.tips[unitId].filter(t => t.id !== tipId);
      await syncWithServer('delete_tip', { unit_id: unitId, tip_id: tipId });
      renderUnitCommunityTips(unitId);
      renderCommunityHub();
    }
  }

  function getUnitTips(unitId) {
    return state.tips[unitId] || [];
  }

  // --- GESTION DE LA TIER LIST COMMUNAUTAIRE ---

  async function saveTierList(tierlistData, syncOfficial = true) {
    if (!tierlistData || typeof tierlistData !== 'object') return false;
    state.tierlist = JSON.parse(JSON.stringify(tierlistData));
    await syncWithServer('save_tierlist', {
      tierlist: state.tierlist,
      sync_official: !!syncOfficial
    });
    applyToGlobalData();
    renderCommunityHub();
    const msg = window.t ? window.t('tierlist_saved_toast', 'Tier List enregistrée avec succès !') : 'Tier List enregistrée avec succès !';
    if (window.showToast) window.showToast(msg);
    return true;
  }

  async function resetTierList() {
    state.tierlist = null;
    await syncWithServer('reset_tierlist');
    applyToGlobalData();
    renderCommunityHub();
    const msg = window.t ? window.t('tierlist_reset_toast', 'Tier List réinitialisée à l\'état officiel.') : 'Tier List réinitialisée à l\'état officiel.';
    if (window.showToast) window.showToast(msg);
    return true;
  }

  // --- RÉINITIALISATION ET EXPORT / IMPORT ---

  async function resetAllToOfficial() {
    const confirmMsg = window.t ?
      window.t('comm_confirm_reset_all', 'Voulez-vous vraiment restaurer toutes les données officielles ? Toutes vos modifications et ajouts locaux seront effacés.') :
      'Voulez-vous vraiment restaurer toutes les données officielles ? Toutes vos modifications et ajouts locaux seront effacés.';

    if (!confirm(confirmMsg)) return;

    state = {
      version: 1,
      last_updated: new Date().toISOString(),
      units: {},
      deleted_units: [],
      orbs: {},
      deleted_orbs: [],
      codes: [],
      tips: {},
      tierlist: null,
      custom_tierlists: {}
    };

    await syncWithServer('reset_all');
    applyToGlobalData();

    if (window.applyUnitFilters) window.applyUnitFilters();
    else if (window.filterUnits) window.filterUnits();
    if (window.renderOrbs) window.renderOrbs();
    if (window.renderCodes) window.renderCodes();
    renderCommunityHub();

    const msg = window.t ? window.t('comm_reset_done', 'Wiki restauré à l\'état officiel d\'origine !') : 'Wiki restauré à l\'état officiel d\'origine !';
    if (window.showToast) window.showToast(msg);
  }

  function exportJSON() {
    const exportData = {
      app: 'ASTD Database Pro - Community Pack',
      version: 1,
      exported_at: new Date().toISOString(),
      contributions: state
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astd_community_pack_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const parsed = JSON.parse(e.target.result);
        const data = parsed.contributions || parsed;
        if (data && typeof data === 'object') {
          state.units = { ...(state.units || {}), ...(data.units || {}) };
          state.deleted_units = Array.from(new Set([...(state.deleted_units || []), ...(data.deleted_units || [])]));
          state.orbs = { ...(state.orbs || {}), ...(data.orbs || {}) };
          state.deleted_orbs = Array.from(new Set([...(state.deleted_orbs || []), ...(data.deleted_orbs || [])]));
          state.codes = [...(data.codes || []), ...(state.codes || [])];
          state.tips = { ...(state.tips || {}), ...(data.tips || {}) };

          await syncWithServer('import_all', { data: state });
          applyToGlobalData();

          if (window.applyUnitFilters) window.applyUnitFilters();
          else if (window.filterUnits) window.filterUnits();
          if (window.renderOrbs) window.renderOrbs();
          if (window.renderCodes) window.renderCodes();
          renderCommunityHub();

          const msg = window.t ? window.t('comm_import_success', 'Pack communautaire importé avec succès !') : 'Pack communautaire importé avec succès !';
          if (window.showToast) window.showToast(msg);
        }
      } catch (err) {
        alert(window.t ? window.t('comm_import_error', 'Fichier JSON invalide.') : 'Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  }

  // --- GÉNÉRATION DE PROPOSITIONS (GITHUB & DISCORD) ---

  function generateGitHubIssueURL(type, data) {
    const base = 'https://github.com/DZTic/astd-wiki/issues/new';
    let title = '';
    let body = '';
    let labels = 'proposition,en-attente';

    if (type === 'unit') {
      const isLocalImage = data.image && data.image.startsWith('data:image');
      const cleanUpgrades = (data.upgrades || []).map((u, idx) => ({
        level: u.level !== undefined ? u.level : idx,
        cost: Number(u.cost) || 0,
        damage: Number(u.damage) || 0,
        range: Number(u.range) || 0,
        spa: Number(u.spa) || 1,
        tower_type: u.tower_type || '',
        attack_type: u.attack_type || '',
        abilities: Array.isArray(u.abilities) ? u.abilities : []
      }));

      const payload = {
        version: 1,
        type: 'unit',
        action: 'save_unit',
        data: {
          id: data.id || (data.name ? data.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : 'nouvelle_unite'),
          name: data.name || 'Nouvelle Unité',
          star: parseInt(data.star, 10) || 5,
          tower_type: data.tower_type || 'Ground',
          attack_type: data.attack_type || 'Single Target',
          deployment_cost: Number(data.deployment_cost) || 0,
          total_cost: Number(data.total_cost) || 0,
          max_damage: Number(data.max_damage) || 0,
          max_range: Number(data.max_range) || 0,
          min_spa: Number(data.min_spa) || 1,
          max_dps: Number(data.max_dps) || 0,
          character_origin: data.character_origin || null,
          anime_origin: data.anime_origin || 'ASTD Community',
          overview: data.overview || '',
          image: isLocalImage ? '' : (data.image || ''),
          is_tradeable: !!data.is_tradeable,
          is_unobtainable: !!data.is_unobtainable,
          upgrades: cleanUpgrades
        }
      };

      const upgRows = cleanUpgrades.length > 0
        ? cleanUpgrades.map(u => {
            const dps = u.spa > 0 ? Math.round(u.damage / u.spa) : u.damage;
            const ab = (u.abilities && u.abilities.length > 0) ? u.abilities.join(', ') : '-';
            return `| Palier ${u.level} | $${u.cost.toLocaleString()} | ${u.damage.toLocaleString()} | ${u.range} | ${u.spa}s | ${dps.toLocaleString()} | ${u.tower_type || '-'} | ${ab} |`;
          }).join('\n')
        : '| 0 | $0 | 0 | 0 | 0s | 0 | - | - |';

      title = `[Proposition Unité] ${data.name || 'Nouvelle Unité'} (${data.star || 5}★)`;
      body = `### 📋 Proposition d'Ajout / Modification d'Unité ASTD\n\n` +
             `| Caractéristique | Valeur |\n` +
             `| :--- | :--- |\n` +
             `| **Nom** | **${data.name || '-'}** |\n` +
             `| **ID Détecté** | \`${payload.data.id}\` |\n` +
             `| **Rareté** | ${data.star || 5}★ |\n` +
             `| **Franchise / Anime** | ${data.anime_origin || '-'} |\n` +
             `| **Personnage d'origine** | ${data.character_origin || '-'} |\n` +
             `| **Type de Tour** | ${data.tower_type || '-'} |\n` +
             `| **Zone d'Attaque** | ${data.attack_type || '-'} |\n` +
             `| **Coût Déploiement** | $${(data.deployment_cost || 0).toLocaleString()} |\n` +
             `| **Coût Total** | $${(data.total_cost || 0).toLocaleString()} |\n` +
             `| **Dégâts Max** | ${(data.max_damage || 0).toLocaleString()} |\n` +
             `| **Portée Max** | ${data.max_range || '-'} |\n` +
             `| **SPA Min** | ${data.min_spa || '-'}s |\n` +
             `| **DPS Estimé** | ${(data.max_dps || 0).toLocaleString()} |\n` +
             `| **Échangeable** | ${data.is_tradeable ? 'Oui' : 'Non'} |\n` +
             `| **Introuvable / Retiré** | ${data.is_unobtainable ? 'Oui' : 'Non'} |\n\n` +
             `### 📖 Description & Aperçu\n${data.overview || '*Aucune description renseignée.*'}\n\n` +
             (isLocalImage ? `> ⚠️ **Image Locale Détectée :** Une image sur votre ordinateur a été utilisée. Veuillez glisser-déposer votre fichier image directement dans cette issue GitHub pour qu'elle s'affiche.\n\n` : (data.image ? `**Image :** ${data.image}\n\n` : '')) +
             `### ⚡ Paliers d'Amélioration (${cleanUpgrades.length} niveaux)\n` +
             `| Palier | Coût ($) | Dégâts | Portée | SPA | DPS | Type | Aptitudes |\n` +
             `| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n` +
             `${upgRows}\n\n` +
             `---\n` +
             `### 🛠️ Intégration Automatique au Wiki (Mainteneurs)\n` +
             `> **Pour valider et insérer directement ce personnage dans \`data/units.json\` sans saisie manuelle :**\n` +
             `> 1. Ajoutez le label **\`validé\`** ou **\`approved\`** à cette issue, **OU**\n` +
             `> 2. Commentez **/valider** ou **/approve**, **OU**\n` +
             `> 3. Fermez l'issue via **"Close as completed"**.\n` +
             `>\n` +
             `> 🚀 *Un robot GitHub Actions intégrera instantanément les statistiques et lancera le déploiement GitHub Pages.*\n\n` +
             `<!-- ASTD_PAYLOAD_START\n${JSON.stringify(payload)}\nASTD_PAYLOAD_END -->\n\n` +
             `<details>\n<summary>🤖 Données techniques JSON (ne pas modifier)</summary>\n\n` +
             `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n</details>`;

    } else if (type === 'code') {
      const payload = {
        version: 1,
        type: 'code',
        action: 'save_code',
        data: {
          code: data.code || '',
          reward: data.reward || '',
          status: data.status || 'active'
        }
      };

      title = `[Proposition Code Promo] ${data.code || ''}`;
      body = `### 🎁 Nouveau Code Promo ASTD\n\n` +
             `| Champ | Valeur |\n` +
             `| :--- | :--- |\n` +
             `| **Code Promo** | \`${data.code}\` |\n` +
             `| **Récompenses** | ${data.reward || '-'} |\n` +
             `| **Statut** | ${data.status === 'expired' ? 'Expiré' : 'Actif'} |\n\n` +
             `---\n` +
             `### 🛠️ Validation Automatique du Wiki\n` +
             `> Ajoutez le label **\`validé\`** ou commentez **/valider** pour intégrer automatiquement ce code.\n\n` +
             `<!-- ASTD_PAYLOAD_START\n${JSON.stringify(payload)}\nASTD_PAYLOAD_END -->\n\n` +
             `<details>\n<summary>🤖 Données techniques JSON</summary>\n\n` +
             `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n</details>`;

    } else if (type === 'orb') {
      const isLocalImage = data.image && data.image.startsWith('data:image');
      const payload = {
        version: 1,
        type: 'orb',
        action: 'save_orb',
        data: {
          name: data.name || 'Nouvel Orbe',
          image: isLocalImage ? '' : (data.image || ''),
          effect: data.effect || 'Bonus spécial',
          obtain: data.obtain || 'Fabrication / Raids',
          require: data.require || 'All units'
        }
      };

      title = `[Proposition Orbe] ${data.name || 'Nouvel Orbe'}`;
      body = `### 🔮 Proposition d'Orbe ASTD\n\n` +
             `| Champ | Valeur |\n` +
             `| :--- | :--- |\n` +
             `| **Nom de l'Orbe** | **${data.name || '-'}** |\n` +
             `| **Effet / Bonus** | ${data.effect || '-'} |\n` +
             `| **Compatibilité** | ${data.require || 'All units'} |\n` +
             `| **Obtention** | ${data.obtain || '-'} |\n\n` +
             (isLocalImage ? `> ⚠️ **Image Locale Détectée :** Une image sur votre ordinateur a été utilisée. Veuillez glisser-déposer votre fichier image directement dans cette issue GitHub pour qu'elle s'affiche.\n\n` : (data.image ? `**Image :** ${data.image}\n\n` : '')) +
             `---\n` +
             `### 🛠️ Validation Automatique du Wiki (Mainteneurs)\n` +
             `> Ajoutez le label **\`validé\`** ou commentez **/valider** pour intégrer automatiquement cet orbe dans \`data/orbs.json\`.\n\n` +
             `<!-- ASTD_PAYLOAD_START\n${JSON.stringify(payload)}\nASTD_PAYLOAD_END -->\n\n` +
             `<details>\n<summary>🤖 Données techniques JSON</summary>\n\n` +
             `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n</details>`;
    } else if (type === 'tierlist') {
      const categories = data.categories || {};
      const catCount = Object.keys(categories).length;
      const totalUnits = Object.values(categories).reduce((acc, l) => acc + (Array.isArray(l) ? l.length : 0), 0);
      const payload = {
        version: 1,
        type: 'tierlist',
        action: 'save_tierlist',
        data: {
          categories: categories,
          mode: 'replace'
        }
      };

      const topCatsPreview = Object.entries(categories).slice(0, 15).map(([cat, uList]) => {
        const uArr = Array.isArray(uList) ? uList : [];
        const sample = uArr.slice(0, 6).join(', ') + (uArr.length > 6 ? '...' : '');
        return `| **${cat}** | ${uArr.length} unités | ${sample || '-'} |`;
      }).join('\n');

      title = `[Proposition Tier List] Mise à jour méta (${catCount} catégories, ${totalUnits} unités)`;
      body = `### 👑 Proposition de Mise à Jour de la Tier List ASTD\n\n` +
             `| Métrique | Valeur |\n` +
             `| :--- | :--- |\n` +
             `| **Catégories Méta** | ${catCount} |\n` +
             `| **Unités Classées au total** | ${totalUnits} |\n\n` +
             `### 📋 Aperçu des Catégories Méta\n` +
             `| Catégorie | Total | Exemples d'unités |\n` +
             `| :--- | :--- | :--- |\n` +
             `${topCatsPreview}\n\n` +
             (catCount > 15 ? `*(Et ${catCount - 15} autres catégories incluses dans le payload complet ci-dessous)*\n\n` : '') +
             `---\n` +
             `### 🛠️ Validation Automatique du Wiki (Mainteneurs)\n` +
             `> Ajoutez le label **\`validé\`** ou commentez **/valider** pour synchroniser automatiquement ces classements dans \`data/tierlist.json\`.\n\n` +
             `<!-- ASTD_PAYLOAD_START\n${JSON.stringify(payload)}\nASTD_PAYLOAD_END -->\n\n` +
             `<details>\n<summary>🤖 Données techniques JSON</summary>\n\n` +
             `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n</details>`;
    }

    return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent(labels)}`;
  }

  function copyForDiscord(type, data) {
    let text = '';
    if (type === 'unit') {
      const upgCount = (data.upgrades && data.upgrades.length) || 0;
      text = `**[ASTD Wiki - Communauté] Fiche Unité : ${data.name}** (${data.star}★)\n` +
             `> Anime: ${data.anime_origin || 'ASTD'} | Type: ${data.tower_type} (${data.attack_type})\n` +
             `> DMG Max: ${data.max_damage?.toLocaleString()} | SPA Min: ${data.min_spa}s | DPS Max: ${data.max_dps?.toLocaleString()}\n` +
             `> Portée: ${data.max_range} | Déploiement: $${data.deployment_cost?.toLocaleString()} | Coût Total: $${data.total_cost?.toLocaleString()} (${upgCount} paliers)\n` +
             `> Description: ${data.overview || '-'}`;
    } else if (type === 'code') {
      text = `**[ASTD Wiki] Nouveau Code Promo :** \`${data.code}\`\n` +
             `> Récompenses : ${data.reward}\n` +
             `> Statut : ${data.status === 'active' ? 'ACTIF' : 'EXPIRÉ'}`;
    } else if (type === 'orb') {
      text = `**[ASTD Wiki - Communauté] Orbe : ${data.name}**\n` +
             `> Bonus : ${data.effect || '-'}\n` +
             `> Compatible : ${data.require || 'All units'}\n` +
             `> Obtention : ${data.obtain || '-'}`;
    } else if (type === 'tierlist') {
      const cats = data || {};
      const catCount = Object.keys(cats).length;
      const totalUnits = Object.values(cats).reduce((acc, l) => acc + (Array.isArray(l) ? l.length : 0), 0);
      const topPreview = Object.entries(cats).slice(0, 5).map(([c, uList]) => {
        const uArr = Array.isArray(uList) ? uList : [];
        return `> **${c}** (${uArr.length}): ${uArr.slice(0, 4).join(', ')}${uArr.length > 4 ? '...' : ''}`;
      }).join('\n');
      text = `**[ASTD Wiki - Communauté] Tier List Méta Collaborative** (${catCount} catégories, ${totalUnits} unités)\n` +
             topPreview;
    }

    navigator.clipboard.writeText(text).then(() => {
      const msg = window.t ? window.t('comm_discord_copied', 'Résumé formaté pour Discord copié dans le presse-papier !') : 'Résumé formaté pour Discord copié dans le presse-papier !';
      if (window.showToast) window.showToast(msg);
    });
  }

  // --- RENDU DU HUB COMMUNAUTÉ ---

  function renderCommunityHub() {
    const container = document.getElementById('community-content');
    if (!container) return;

    const modifiedUnitsList = Object.values(state.units || {});
    const deletedUnitsList = (state.deleted_units || []).map(id => {
      const u = (originalUnitsBackup || []).find(x => x.id === id);
      return u || { id, name: id, star: '?' };
    });
    const modifiedOrbsList = Object.values(state.orbs || {});
    const deletedOrbsList = state.deleted_orbs || [];
    const communityCodes = state.codes || [];
    const allTips = Object.entries(state.tips || {}).flatMap(([uId, tList]) => tList.map(t => ({ ...t, unitId: uId })));

    container.innerHTML = `
      <!-- En-tête de bienvenue pédagogique -->
      <div class="tactical-card rounded-2xl p-5 sm:p-6 border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-[#0f1629] to-[#0f1629] space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              <i data-lucide="sparkles" class="w-3.5 h-3.5" stroke-width="2"></i>
              <span>${window.t ? window.t('comm_hub_badge', 'Espace Collaboratif & Ouvert') : 'Espace Collaboratif & Ouvert'}</span>
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-white tracking-tight">
              ${window.t ? window.t('comm_hub_title', 'Hub de Contribution Communautaire ASTD') : 'Hub de Contribution Communautaire ASTD'}
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ${window.t ? window.t('comm_hub_desc', 'Ajoutez ou modifiez des unités et des orbes, partagez de nouveaux codes cadeaux ou donnez vos conseils tactiques. Aucune connaissance technique requise, tout est guidé pas-à-pas et 100% réversible !') : 'Ajoutez ou modifiez des unités et des orbes, partagez de nouveaux codes cadeaux ou donnez vos conseils tactiques. Aucune connaissance technique requise, tout est guidé pas-à-pas et 100% réversible !'}
            </p>
          </div>

          <!-- Statistiques rapides -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 shrink-0 text-center font-mono-num">
            <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-sans block uppercase font-bold">${window.t ? window.t('comm_stat_units', 'Unités') : 'Unités'}</span>
              <span class="text-base font-bold text-sky-400">${modifiedUnitsList.length}</span>
            </div>
            <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-sans block uppercase font-bold">${window.t ? window.t('comm_stat_orbs', 'Orbes') : 'Orbes'}</span>
              <span class="text-base font-bold text-cyan-400">${modifiedOrbsList.length}</span>
            </div>
            <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-sans block uppercase font-bold">${window.t ? window.t('comm_stat_tierlist', 'Tier List') : 'Tier List'}</span>
              <span class="text-base font-bold ${state.tierlist ? 'text-amber-400' : 'text-slate-400'}">${state.tierlist ? (window.t ? window.t('comm_tierlist_status_custom', 'Éditée') : 'Éditée') : (window.t ? window.t('comm_tierlist_status_official', 'Officielle') : 'Officielle')}</span>
            </div>
            <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-sans block uppercase font-bold">${window.t ? window.t('comm_stat_codes', 'Codes') : 'Codes'}</span>
              <span class="text-base font-bold text-emerald-400">${communityCodes.length}</span>
            </div>
            <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-sans block uppercase font-bold">${window.t ? window.t('comm_stat_tips', 'Conseils') : 'Conseils'}</span>
              <span class="text-base font-bold text-amber-400">${allTips.length}</span>
            </div>
          </div>
        </div>

        <!-- 5 Cartes d'Actions Rapides Collaboratives -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80">
          <button onclick="CommunityUI.openUnitModalForAdd()" class="p-3.5 rounded-xl bg-[#090e1c] hover:bg-sky-600/20 border border-slate-800 hover:border-sky-500/50 text-left transition-all tap-scale group flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 group-hover:scale-105 transition-transform">
              <i data-lucide="plus-circle" class="w-5 h-5" stroke-width="2"></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">${window.t ? window.t('comm_btn_add_unit_title', 'Ajouter une Unité') : 'Ajouter une Unité'}</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_btn_add_unit_desc', 'Formulaire assisté avec calcul de DPS et aperçu.') : 'Formulaire assisté avec calcul de DPS et aperçu.'}</p>
            </div>
          </button>

          <div class="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col justify-between group">
            <div class="flex items-start gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                <i data-lucide="sparkles" class="w-5 h-5" stroke-width="2"></i>
              </div>
              <div class="min-w-0">
                <h3 class="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">${window.t ? window.t('comm_card_orb_title', 'Orbes & Reliques') : 'Orbes & Reliques'}</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_card_orb_desc', 'Ajouter un nouvel orbe ou modifier un orbe existant.') : 'Ajouter un nouvel orbe ou modifier un orbe existant.'}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button type="button" onclick="CommunityUI.openOrbModalForAdd()" class="px-2 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 text-[11px] font-bold tap-scale flex items-center justify-center gap-1 transition-colors">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_btn_add', 'Ajouter') : 'Ajouter'}</span>
              </button>
              <button type="button" onclick="CommunityUI.openOrbSelectorForEdit()" class="px-2 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-[11px] font-bold tap-scale flex items-center justify-center gap-1 transition-colors">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_action_edit', 'Modifier') : 'Modifier'}</span>
              </button>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col justify-between group">
            <div class="flex items-start gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                <i data-lucide="crown" class="w-5 h-5" stroke-width="2"></i>
              </div>
              <div class="min-w-0">
                <h3 class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">${window.t ? window.t('comm_card_tierlist_title', 'Tier Lists & Méta') : 'Tier Lists & Méta'}</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_card_tierlist_desc', 'Glisser-déposer d\'unités, tiers sur mesure et presets.') : 'Glisser-déposer d\'unités, tiers sur mesure et presets.'}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button type="button" onclick="switchTab('tierlist'); if (window.CommunityUI) CommunityUI.toggleTierListEditMode(true);" class="px-2 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-[11px] font-bold tap-scale flex items-center justify-center gap-1 transition-colors">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_btn_edit_tierlist', 'Éditer') : 'Éditer'}</span>
              </button>
              <button type="button" onclick="switchTab('tierlist')" class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold tap-scale flex items-center justify-center gap-1 transition-colors">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_btn_view_tierlist', 'Consulter') : 'Consulter'}</span>
              </button>
            </div>
          </div>

          <button onclick="CommunityUI.openUnitSelectorForEdit()" class="p-3.5 rounded-xl bg-[#090e1c] hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/50 text-left transition-all tap-scale group flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
              <i data-lucide="edit-3" class="w-5 h-5" stroke-width="2"></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">${window.t ? window.t('comm_btn_edit_unit_title', 'Modifier une Fiche') : 'Modifier une Fiche'}</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_btn_edit_unit_desc', 'Corriger les dégâts, le placement ou la description.') : 'Corriger les dégâts, le placement ou la description.'}</p>
            </div>
          </button>

          <button onclick="CommunityUI.openCodeModalForAdd()" class="p-3.5 rounded-xl bg-[#090e1c] hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/50 text-left transition-all tap-scale group flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
              <i data-lucide="gift" class="w-5 h-5" stroke-width="2"></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">${window.t ? window.t('comm_btn_add_code_title', 'Proposer un Code Promo') : 'Proposer un Code Promo'}</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_btn_add_code_desc', 'Partager un nouveau code ou signaler un code expiré.') : 'Partager un nouveau code ou signaler un code expiré.'}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Barre d'outils de sauvegarde, import, export et réinitialisation -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[#0e1526] border border-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-medium">${window.t ? window.t('comm_tools_label', 'Gestion des données :') : 'Gestion des données :'}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isServerAvailable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
            ${isServerAvailable ? t('comm_server_connected', 'Serveur Local Connecté') : t('comm_server_localstorage', 'Mode LocalStorage (En Ligne)')}
          </span>
        </div>
        <div class="flex items-center flex-wrap gap-1.5">
          <button onclick="CommunityManager.exportJSON()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 tap-scale">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>${window.t ? window.t('comm_btn_export', 'Exporter Pack JSON') : 'Exporter Pack JSON'}</span>
          </button>
          <label class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 tap-scale cursor-pointer">
            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
            <span>${window.t ? window.t('comm_btn_import', 'Importer Pack JSON') : 'Importer Pack JSON'}</span>
            <input type="file" accept=".json" onchange="CommunityManager.importJSON(this.files[0])" class="hidden">
          </label>
          <button onclick="CommunityManager.resetAllToOfficial()" class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 tap-scale">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span>${window.t ? window.t('comm_btn_reset_all', 'Tout Réinitialiser') : 'Tout Réinitialiser'}</span>
          </button>
        </div>
      </div>

      <!-- Tableau de bord des contributions actives -->
      <div class="space-y-4">
        
        <!-- Section Unités modifiées ou créées -->
        <div class="tactical-card rounded-xl p-4 border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="swords" class="w-4 h-4 text-sky-400"></i>
              <h3 class="text-sm font-bold text-white">${window.t ? window.t('comm_list_units_title', 'Fiches d\'Unités Personnalisées & Modifiées') : 'Fiches d\'Unités Personnalisées & Modifiées'}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 font-mono-num">${modifiedUnitsList.length}</span>
            </div>
            <button onclick="CommunityUI.openUnitModalForAdd()" class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 tap-scale">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>${window.t ? window.t('comm_btn_add', 'Ajouter') : 'Ajouter'}</span>
            </button>
          </div>

          ${modifiedUnitsList.length === 0 ? `
            <div class="p-6 text-center text-slate-400 bg-[#090e1c] rounded-xl border border-slate-800 text-xs">
              ${window.t ? window.t('comm_no_units', 'Aucune unité personnalisée pour le moment. Cliquez sur "Ajouter" ou sur "Modifier cette fiche" depuis n\'importe quelle unité pour commencer !') : 'Aucune unité personnalisée pour le moment. Cliquez sur "Ajouter" ou sur "Modifier cette fiche" depuis n\'importe quelle unité pour commencer !'}
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${modifiedUnitsList.map(u => `
                <div class="p-3 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col justify-between space-y-2 hover:border-sky-500/40 transition-colors">
                  <div class="flex items-start gap-2.5">
                    <img src="${u.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" width="48" height="48" loading="lazy" decoding="async" class="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 p-1 object-contain shrink-0" alt="${u.name}">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-xs truncate">${u.name}</span>
                        <span class="px-1.5 py-0.2 rounded text-[10px] font-bold star-${u.star}-badge">${u.star}★</span>
                      </div>
                      <div class="text-[10px] text-slate-400 truncate">${u.anime_origin || 'ASTD'}</div>
                      <div class="text-[10px] text-amber-300 font-mono-num mt-0.5">DPS: ${parseFloat(u.max_dps || 0).toLocaleString()} • DMG: ${parseFloat(u.max_damage || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <div class="flex items-center gap-1">
                      <button onclick="openUnitModal('${u.id}')" class="px-2 py-1 rounded bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 font-semibold tap-scale">
                        ${window.t ? window.t('comm_action_view', 'Voir') : 'Voir'}
                      </button>
                      <button onclick="CommunityUI.openUnitModalForEdit('${u.id}')" class="px-2 py-1 rounded bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 font-semibold tap-scale">
                        ${window.t ? window.t('comm_action_edit', 'Éditer') : 'Éditer'}
                      </button>
                    </div>
                    <div class="flex items-center gap-1">
                      <a href="${generateGitHubIssueURL('unit', u)}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white tap-scale flex items-center justify-center" title="Proposer au Wiki Officiel sur GitHub">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      </a>
                      <button onclick="CommunityManager.copyForDiscord('unit', ${JSON.stringify(u).replace(/"/g, '&quot;')})" class="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white tap-scale" title="Copier le résumé pour Discord">
                        <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="CommunityManager.deleteUnit('${u.id}')" class="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white tap-scale" title="${t('comm_btn_hide_tip', 'Supprimer ou masquer')}">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Section Orbes modifiés ou créés -->
        <div class="tactical-card rounded-xl p-4 border border-cyan-500/30 bg-cyan-950/10 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-cyan-400"></i>
              <h3 class="text-sm font-bold text-white">${window.t ? window.t('comm_list_orbs_title', 'Orbes & Reliques de la Communauté') : 'Orbes & Reliques de la Communauté'}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 font-mono-num">${modifiedOrbsList.length}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="CommunityUI.openOrbSelectorForEdit()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 tap-scale" title="${t('comm_btn_edit_orb_title', 'Modifier un orbe officiel ou existant')}">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>${window.t ? window.t('comm_btn_edit_existing', 'Modifier existant') : 'Modifier existant'}</span>
              </button>
              <button onclick="CommunityUI.openOrbModalForAdd()" class="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 tap-scale shadow-sm">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_btn_add', 'Ajouter') : 'Ajouter'}</span>
              </button>
            </div>
          </div>

          ${modifiedOrbsList.length === 0 ? `
            <div class="p-6 text-center text-slate-400 bg-[#090e1c] rounded-xl border border-slate-800 text-xs space-y-3">
              <p>${window.t ? window.t('comm_no_orbs', 'Aucun orbe personnalisé pour le moment. Vous pouvez créer un nouvel orbe ou modifier un orbe officiel du wiki !') : 'Aucun orbe personnalisé pour le moment. Vous pouvez créer un nouvel orbe ou modifier un orbe officiel du wiki !'}</p>
              <div class="flex items-center justify-center gap-2 pt-1">
                <button onclick="CommunityUI.openOrbModalForAdd()" class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 tap-scale shadow-sm">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>${t('comm_btn_create_orb', 'Créer un Nouvel Orbe')}</span>
                </button>
                <button onclick="CommunityUI.openOrbSelectorForEdit()" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 tap-scale shadow-sm">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Modifier un Orbe Officiel</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${modifiedOrbsList.map(o => `
                <div class="p-3 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col justify-between space-y-2 hover:border-cyan-500/40 transition-colors">
                  <div class="flex items-start gap-2.5">
                    <img src="${o.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" width="48" height="48" loading="lazy" decoding="async" class="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 p-1 object-contain shrink-0" alt="${o.name}" onerror="this.src='https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-xs truncate">${escapeHtml(o.name)}</span>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">Orbe</span>
                      </div>
                      <div class="text-[10px] text-amber-300 font-medium truncate mt-0.5">${escapeHtml(o.effect || t('comm_special_bonus', 'Bonus spécial'))}</div>
                      <div class="text-[10px] text-slate-400 truncate mt-0.5">Compatible: <span class="text-sky-300">${escapeHtml(o.require || 'All units')}</span></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <button onclick="CommunityUI.openOrbModalForEdit(decodeURIComponent('${encodeURIComponent(o.name)}'))" class="px-2 py-1 rounded bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 font-semibold tap-scale">
                      ${window.t ? window.t('comm_action_edit', 'Éditer') : 'Éditer'}
                    </button>
                    <div class="flex items-center gap-1">
                      <a href="${generateGitHubIssueURL('orb', o)}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white tap-scale flex items-center justify-center" title="Proposer sur GitHub">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      </a>
                      <button onclick="CommunityManager.copyForDiscord('orb', ${JSON.stringify(o).replace(/"/g, '&quot;')})" class="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white tap-scale" title="Copier le résumé pour Discord">
                        <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="CommunityManager.deleteOrb(decodeURIComponent('${encodeURIComponent(o.name)}'))" class="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white tap-scale" title="${t('comm_btn_hide_tip', 'Supprimer ou masquer')}">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Section Orbes Masqués -->
        ${deletedOrbsList.length > 0 ? `
          <div class="tactical-card rounded-xl p-4 border border-rose-500/30 bg-rose-950/10 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="eye-off" class="w-4 h-4 text-rose-400"></i>
                <h3 class="text-sm font-bold text-rose-300">${window.t ? window.t('comm_list_deleted_orbs_title', 'Orbes Masqués / Désactivés') : 'Orbes Masqués / Désactivés'}</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 font-mono-num">${deletedOrbsList.length}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              ${deletedOrbsList.map(name => `
                <div class="p-2.5 rounded-lg bg-[#090e1c] border border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <span class="font-semibold text-slate-300 truncate">${escapeHtml(name)}</span>
                  <button onclick="CommunityManager.restoreOrb(decodeURIComponent('${encodeURIComponent(name)}'))" class="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-[10px] tap-scale flex items-center gap-1 shrink-0">
                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                    <span>${window.t ? window.t('comm_action_restore', 'Restaurer') : 'Restaurer'}</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Section Unités Masquées -->
        ${deletedUnitsList.length > 0 ? `
          <div class="tactical-card rounded-xl p-4 border border-rose-500/30 bg-rose-950/10 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="eye-off" class="w-4 h-4 text-rose-400"></i>
                <h3 class="text-sm font-bold text-rose-300">${window.t ? window.t('comm_list_deleted_title', 'Unités Masquées / Désactivées') : 'Unités Masquées / Désactivées'}</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 font-mono-num">${deletedUnitsList.length}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              ${deletedUnitsList.map(u => `
                <div class="p-2.5 rounded-lg bg-[#090e1c] border border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <span class="font-semibold text-slate-300 truncate">${u.name || u.id}</span>
                  <button onclick="CommunityManager.restoreUnit('${u.id}')" class="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-[10px] tap-scale flex items-center gap-1 shrink-0">
                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                    <span>${window.t ? window.t('comm_action_restore', 'Restaurer') : 'Restaurer'}</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Section Codes Promo ajoutés ou modifiés -->
        <div class="tactical-card rounded-xl p-4 border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="gift" class="w-4 h-4 text-emerald-400"></i>
              <h3 class="text-sm font-bold text-white">${window.t ? window.t('comm_list_codes_title', 'Codes Promo de la Communauté') : 'Codes Promo de la Communauté'}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono-num">${communityCodes.length}</span>
            </div>
            <button onclick="CommunityUI.openCodeModalForAdd()" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 tap-scale">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>${window.t ? window.t('comm_btn_add', 'Ajouter') : 'Ajouter'}</span>
            </button>
          </div>

          ${communityCodes.length === 0 ? `
            <div class="p-6 text-center text-slate-400 bg-[#090e1c] rounded-xl border border-slate-800 text-xs">
              ${window.t ? window.t('comm_no_codes', 'Aucun code personnalisé ajouté. Utilisez le bouton "Ajouter" pour partager un nouveau code promo ASTD !') : 'Aucun code personnalisé ajouté. Utilisez le bouton "Ajouter" pour partager un nouveau code promo ASTD !'}
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${communityCodes.map(c => `
                <div class="p-3 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col justify-between space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-mono-num font-bold text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">${c.code}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} uppercase">
                      ${c.status === 'active' ? t('comm_status_active', 'Actif') : t('comm_status_expired', 'Expiré')}
                    </span>
                  </div>
                  <div class="text-slate-300 text-[11px]">${c.reward}</div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                    <button onclick="CommunityManager.toggleCodeExpired('${c.code}')" class="text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 tap-scale">
                      <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                      <span>${c.status === 'active' ? t('comm_btn_mark_expired', 'Marquer expiré') : t('comm_btn_mark_active', 'Marquer actif')}</span>
                    </button>
                    <div class="flex items-center gap-1">
                      <a href="${generateGitHubIssueURL('code', c)}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center" title="Soumettre sur GitHub">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      </a>
                      <button onclick="CommunityManager.deleteCode('${c.code}')" class="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white" title="Supprimer">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Section Tier List Personnalisée & Statut -->
        <div class="tactical-card rounded-xl p-4 border ${state.tierlist ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800 bg-[#0f1629]'} space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i>
              <h3 class="text-sm font-bold text-white">${window.t ? window.t('comm_tierlist_section_title', 'Tier List Méta Collaborative') : 'Tier List Méta Collaborative'}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${state.tierlist ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'} uppercase font-mono-num">
                ${state.tierlist ? (window.t ? window.t('comm_tierlist_status_custom', 'Personnalisée') : 'Personnalisée') : (window.t ? window.t('comm_tierlist_status_official', 'Officielle') : 'Officielle')}
              </span>
            </div>
            <div class="flex items-center flex-wrap gap-1.5">
              <button onclick="switchTab('tierlist'); if (window.CommunityUI) CommunityUI.toggleTierListEditMode(true);" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 tap-scale shadow-sm">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_btn_edit_tierlist', 'Éditer en direct') : 'Éditer en direct'}</span>
              </button>
              ${state.tierlist ? `
                <button onclick="CommunityUI.proposeTierListToGitHub()" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 tap-scale" title="${t('comm_btn_propose_tierlist_gh', 'Proposer vos rangs à la communauté ASTD sur GitHub')}">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <span>${window.t ? window.t('tierlist_btn_github', 'Soumettre sur GitHub') : 'Soumettre sur GitHub'}</span>
                </button>
                <button onclick="CommunityUI.exportTierListJSON()" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 tap-scale" title="${t('comm_btn_download_json', 'Télécharger le fichier JSON')}">
                  <i data-lucide="download" class="w-3 h-3"></i>
                  <span>JSON</span>
                </button>
                <button onclick="CommunityManager.resetTierList()" class="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 tap-scale" title="${t('comm_btn_restore_official_tierlist', 'Restaurer la tier list officielle')}">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>${window.t ? window.t('tierlist_btn_reset', 'Réinitialiser') : 'Réinitialiser'}</span>
                </button>
              ` : ''}
            </div>
          </div>

          ${state.tierlist ? `
            <div class="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 space-y-2.5">
              <div class="text-xs text-slate-300">
                ${window.t ? window.t('comm_tierlist_custom_desc', 'Vous utilisez actuellement une version personnalisée de la Tier List avec vos propres classements et catégories.') : 'Vous utilisez actuellement une version personnalisée de la Tier List avec vos propres classements et catégories.'}
              </div>
              <div class="flex flex-wrap gap-2 pt-1">
                ${Object.entries(state.tierlist).map(([cat, list]) => `
                  <div class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
                    <span class="font-bold text-amber-300">${escapeHtml(cat)}</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono-num bg-slate-800 text-slate-300">${Array.isArray(list) ? list.length : 0} unités</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="p-4 rounded-xl bg-[#090e1c] border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p>${window.t ? window.t('comm_tierlist_official_desc', 'La Tier List officielle du Wiki est actuellement chargée. Vous pouvez la personnaliser librement par glisser-déposer, créer de nouvelles catégories, et proposer vos changements en ligne !') : 'La Tier List officielle du Wiki est actuellement chargée. Vous pouvez la personnaliser librement par glisser-déposer, créer de nouvelles catégories, et proposer vos changements en ligne !'}</p>
              <button onclick="switchTab('tierlist'); if (window.CommunityUI) CommunityUI.toggleTierListEditMode(true);" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs tap-scale shrink-0 flex items-center gap-1.5">
                <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                <span>Personnaliser</span>
              </button>
            </div>
          `}
        </div>

      </div>
    `;

    const sec = document.getElementById('community-contributions-section');
    if (window.safeCreateIcons) safeCreateIcons(sec);
    else if (window.lucide) lucide.createIcons(sec ? { root: sec } : undefined);
  }

  // --- RENDU DES CONSEILS DANS LA MODALE D'UNITÉ ---

  function renderUnitCommunityTips(unitId) {
    const tipsContainer = document.getElementById('modal-community-tips-list');
    const tipsCountEl = document.getElementById('modal-community-tips-count');
    if (!tipsContainer) return;

    const tips = getUnitTips(unitId);
    if (tipsCountEl) tipsCountEl.textContent = tips.length;

    if (tips.length === 0) {
      tipsContainer.innerHTML = `
        <div class="p-3 text-center text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/80 text-xs">
          ${window.t ? window.t('comm_no_tips_for_unit', 'Aucun conseil pour cette unité pour le moment. Soyez le premier à en partager un !') : 'Aucun conseil pour cette unité pour le moment. Soyez le premier à en partager un !'}
        </div>
      `;
      return;
    }

    const typeLabels = {
      meta: t('comm_tip_cat_meta', 'Méta & Classement'),
      raid: t('comm_tip_cat_raid', 'Raids & Donjons'),
      orbs: t('comm_tip_cat_orbs', 'Orbe Recommandé'),
      synergy: t('comm_tip_cat_synergy', 'Synergie de Deck')
    };

    tipsContainer.innerHTML = tips.map(tip => `
      <div class="p-3 rounded-lg bg-[#090e1c] border border-slate-800 space-y-1.5 text-xs relative group">
        <div class="flex items-center justify-between text-[11px]">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="font-bold text-slate-200">${tip.author || t('comm_default_author', 'Joueur ASTD')}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
              ${typeLabels[tip.type] || tip.type}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-500 text-[10px] font-mono-num">${tip.date || ''}</span>
            <button onclick="CommunityManager.deleteTip('${unitId}', '${tip.id}')" class="text-slate-500 hover:text-rose-400 p-0.5 tap-scale opacity-0 group-hover:opacity-100 transition-opacity" title="${t('comm_btn_delete_tip', 'Supprimer ce conseil')}">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
        <p class="text-slate-300 text-pretty leading-relaxed">
          ${tip.text}
        </p>
      </div>
    `).join('');

    if (window.safeCreateIcons) safeCreateIcons(tipsContainer);
    else if (window.lucide) lucide.createIcons({ root: tipsContainer });
  }

  return {
    init,
    applyToGlobalData,
    saveUnit,
    deleteUnit,
    restoreUnit,
    saveOrb,
    deleteOrb,
    restoreOrb,
    saveCode,
    toggleCodeExpired,
    deleteCode,
    saveTip,
    deleteTip,
    saveTierList,
    resetTierList,
    getOriginalTierlistBackup: () => originalTierlistBackup,
    getUnitTips,
    renderUnitCommunityTips,
    renderCommunityHub,
    resetAllToOfficial,
    exportJSON,
    importJSON,
    generateGitHubIssueURL,
    copyForDiscord,
    getState: () => state
  };
})();


// ==========================================================================
// INTERFACE UTILISATEUR DE L'ASSISTANT COMMUNAUTAIRE DÉBUTANT
// ==========================================================================

const CommunityUI = (function() {
  let currentFormMode = 'unit'; // 'unit' | 'code' | 'tip' | 'orb'
  let editingUnitId = null;
  let editingOrbName = null;
  let currentUnitUpgrades = [];
  let currentUploadedImageDataUrl = null;
  let currentUploadedImageName = '';
  let currentUploadedOrbImageDataUrl = null;
  let currentUploadedOrbImageName = '';
  let isTierListEditMode = false;
  let tierListSearchQuery = '';
  let draggedTierItem = null;

  function openUnitModalForAdd() {
    currentFormMode = 'unit';
    editingUnitId = null;
    openModal();
    setupUnitForm();
  }

  function openUnitModalForEdit(unitId) {
    currentFormMode = 'unit';
    editingUnitId = unitId;
    openModal();
    setupUnitForm(unitId);
  }

  function openOrbModalForAdd() {
    currentFormMode = 'orb';
    editingOrbName = null;
    currentUploadedOrbImageDataUrl = null;
    currentUploadedOrbImageName = '';
    openModal();
    setupOrbForm();
  }

  function openOrbModalForEdit(orbName) {
    currentFormMode = 'orb';
    editingOrbName = orbName;
    currentUploadedOrbImageDataUrl = null;
    currentUploadedOrbImageName = '';
    openModal();
    setupOrbForm(orbName);
  }

  function openOrbSelectorForEdit() {
    const orbs = window.ORBS_DATA || (window.getGlobalOrbs ? window.getGlobalOrbs() : []);
    if (orbs.length === 0) {
      alert(window.t ? window.t('comm_no_orbs_available', 'Aucun orbe disponible dans la base de données.') : 'Aucun orbe disponible dans la base de données.');
      return;
    }
    const selectHtml = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-slate-200">
            ${window.t ? window.t('comm_select_orb_to_edit', 'Choisissez un orbe à modifier :') : 'Choisissez un orbe à modifier :'}
          </label>
          <span class="text-[11px] text-slate-400 font-mono-num">${orbs.length} orbes disponibles</span>
        </div>
        <div>
          <input type="text" id="select-orb-filter-input"
                 placeholder="${window.t ? window.t('comm_filter_orbs_placeholder', 'Rechercher un orbe par nom, effet ou unité requise...') : 'Rechercher un orbe par nom, effet ou unité requise...'}"
                 class="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                 oninput="CommunityUI.filterOrbSelectOptions(this.value)">
        </div>
        <select id="select-orb-to-edit" size="8"
                class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 scrollbar-thin"
                ondblclick="const sel = document.getElementById('select-orb-to-edit'); if(sel && sel.value) CommunityUI.openOrbModalForEdit(decodeURIComponent(sel.value));">
          ${orbs.map((o, idx) => `<option value="${encodeURIComponent(o.name)}" ${idx === 0 ? 'selected' : ''} class="py-1 px-1.5 hover:bg-cyan-950/60 rounded">${escapeHtml(o.name)} (${escapeHtml(o.require || 'All units')}) - ${escapeHtml(o.effect || '')}</option>`).join('')}
        </select>
        <p class="text-[10px] text-slate-400 flex items-center gap-1">
          <i data-lucide="info" class="w-3.5 h-3.5 text-cyan-400 inline"></i>
          <span>Astuce : Sélectionnez un orbe puis validez, ou double-cliquez directement dessus.</span>
        </p>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button onclick="CommunityUI.closeModal()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <button onclick="const sel = document.getElementById('select-orb-to-edit'); if(sel && sel.value) CommunityUI.openOrbModalForEdit(decodeURIComponent(sel.value));" class="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold tap-scale flex items-center gap-1.5 shadow-sm">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>${window.t ? window.t('comm_btn_edit_orb_now', 'Modifier cet orbe') : 'Modifier cet orbe'}</span>
          </button>
        </div>
      </div>
    `;
    showCustomModalContent(window.t ? window.t('comm_title_select_orb', 'Modifier un orbe existant') : 'Modifier un orbe existant', selectHtml);
  }

  function filterOrbSelectOptions(query) {
    const select = document.getElementById('select-orb-to-edit');
    if (!select) return;
    const q = (query || '').toLowerCase().trim();
    const orbs = window.ORBS_DATA || (window.getGlobalOrbs ? window.getGlobalOrbs() : []);
    const filtered = orbs.filter(o =>
      (o.name || '').toLowerCase().includes(q) ||
      (o.require || '').toLowerCase().includes(q) ||
      (o.effect || '').toLowerCase().includes(q)
    );
    select.innerHTML = filtered.map((o, idx) =>
      `<option value="${encodeURIComponent(o.name)}" ${idx === 0 ? 'selected' : ''} class="py-1 px-1.5 hover:bg-cyan-950/60 rounded">${escapeHtml(o.name)} (${escapeHtml(o.require || 'All units')}) - ${escapeHtml(o.effect || '')}</option>`
    ).join('');
  }

  function openUnitSelectorForEdit() {
    const units = window.ALL_UNITS || [];
    if (units.length === 0) return;
    const selectHtml = `
      <div class="space-y-4">
        <label class="block text-xs font-bold text-slate-200">
          ${window.t ? window.t('comm_select_unit_to_edit', 'Choisissez une unité à modifier :') : 'Choisissez une unité à modifier :'}
        </label>
        <select id="select-unit-to-edit" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500">
          ${units.slice(0, 300).map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(stripHtml(u.name))} (${u.star}★ - ${escapeHtml(stripHtml(u.anime_origin) || 'ASTD')})</option>`).join('')}
        </select>
        <div class="flex justify-end gap-2 pt-2">
          <button onclick="CommunityUI.closeModal()" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <button onclick="CommunityUI.openUnitModalForEdit(document.getElementById('select-unit-to-edit').value)" class="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale">
            ${window.t ? window.t('comm_btn_edit_now', 'Modifier cette unité') : 'Modifier cette unité'}
          </button>
        </div>
      </div>
    `;
    showCustomModalContent(window.t ? window.t('comm_title_select_unit', 'Modifier une unité existante') : 'Modifier une unité existante', selectHtml);
  }

  function openCodeModalForAdd() {
    currentFormMode = 'code';
    openModal();
    setupCodeForm();
  }

  function openTipModalForUnit(unitId) {
    currentFormMode = 'tip';
    editingUnitId = unitId;
    openModal();
    setupTipForm(unitId);
  }

  function openModal() {
    const modal = document.getElementById('community-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('modal-open');
    }
  }

  function closeModal() {
    const modal = document.getElementById('community-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.classList.remove('modal-open');
    }
  }

  function showCustomModalContent(title, html) {
    openModal();
    const titleEl = document.getElementById('community-modal-title');
    const bodyEl = document.getElementById('community-modal-body');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = html;
    const modal = document.getElementById('community-modal');
    if (window.safeCreateIcons) safeCreateIcons(modal);
    else if (window.lucide) lucide.createIcons(modal ? { root: modal } : undefined);
  }

  // --- GESTION ET CALCUL DES PALIERS D'AMÉLIORATION MANUELS ---

  function computeTierStats() {
    if (!currentUnitUpgrades || currentUnitUpgrades.length === 0) {
      return {
        deployment_cost: 0,
        total_cost: 0,
        max_damage: 0,
        max_range: 0,
        min_spa: 0,
        max_dps: 0
      };
    }
    const deployCost = Number(currentUnitUpgrades[0].cost) || 0;
    const totalCost = currentUnitUpgrades.reduce((acc, u) => acc + (Number(u.cost) || 0), 0);
    const maxDamage = Math.max(...currentUnitUpgrades.map(u => Number(u.damage) || 0));
    const maxRange = Math.max(...currentUnitUpgrades.map(u => Number(u.range) || 0));
    const validSpas = currentUnitUpgrades.map(u => Number(u.spa) || 0).filter(s => s > 0);
    const minSpa = validSpas.length > 0 ? Math.min(...validSpas) : 1;
    const dpsList = currentUnitUpgrades.map(u => {
      const d = Number(u.damage) || 0;
      const s = Number(u.spa) || 0;
      return s > 0 ? (d / s) : d;
    });
    const maxDps = Math.max(...dpsList);
    return {
      deployment_cost: deployCost,
      total_cost: totalCost,
      max_damage: maxDamage,
      max_range: maxRange,
      min_spa: minSpa,
      max_dps: maxDps
    };
  }

  function computeUnitTowerType() {
    const topType = document.getElementById('comm-unit-tower-type')?.value || 'Ground';
    if (!currentUnitUpgrades || currentUnitUpgrades.length === 0) {
      return topType;
    }
    const baseType = currentUnitUpgrades[0].tower_type || topType;
    const chain = [baseType];
    let currentActive = baseType;

    for (let i = 1; i < currentUnitUpgrades.length; i++) {
      const t = currentUnitUpgrades[i].tower_type;
      if (t && t !== currentActive) {
        chain.push(t);
        currentActive = t;
      }
    }

    return chain.join(' -> ');
  }

  function updateTiersSummaryBadges() {
    const stats = computeTierStats();
    const deployEl = document.getElementById('comm-summary-deploy');
    const totalEl = document.getElementById('comm-summary-total');
    const dmgEl = document.getElementById('comm-summary-damage');
    const rangeEl = document.getElementById('comm-summary-range');
    const spaEl = document.getElementById('comm-summary-spa');
    const dpsEl = document.getElementById('comm-summary-dps');

    if (deployEl) deployEl.textContent = `$${stats.deployment_cost.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `$${stats.total_cost.toLocaleString()}`;
    if (dmgEl) dmgEl.textContent = stats.max_damage.toLocaleString();
    if (rangeEl) rangeEl.textContent = stats.max_range;
    if (spaEl) spaEl.textContent = `${stats.min_spa}s`;
    if (dpsEl) dpsEl.textContent = Math.round(stats.max_dps).toLocaleString();
  }

  function renderUpgradeRows() {
    const tbody = document.getElementById('comm-upgrades-tbody');
    if (!tbody) return;

    if (!currentUnitUpgrades || currentUnitUpgrades.length === 0) {
      currentUnitUpgrades = [
        { level: 0, cost: 500, damage: 1500, range: 25, spa: 4.0, tower_type: 'Ground', abilities: [] }
      ];
    }

    tbody.innerHTML = currentUnitUpgrades.map((tier, idx) => {
      const isDeploy = idx === 0;
      const levelLabel = isDeploy ? (window.t ? window.t('comm_tier_deploy', '0 (Déploiement)') : '0 (Déploiement)') : `Palier ${tier.level !== undefined ? tier.level : idx}`;
      const dps = tier.spa > 0 ? (tier.damage / tier.spa) : tier.damage;
      const abilitiesStr = (tier.abilities || []).join(', ');
      const tType = tier.tower_type || (isDeploy ? (document.getElementById('comm-unit-tower-type')?.value || 'Ground') : '');

      return `
        <tr class="transition">
          <td class="whitespace-nowrap font-mono-num">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${isDeploy ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
              ${levelLabel}
            </span>
          </td>
          <td style="min-width: 105px;">
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono-num text-xs">$</span>
              <input type="number" min="0" step="50" value="${tier.cost || 0}"
                     aria-label="Coût palier ${idx}"
                     class="comm-upg-input pl-5 text-xs font-mono-num"
                     oninput="CommunityUI.onUpgradeChange(${idx}, 'cost', this.value)">
            </div>
          </td>
          <td style="min-width: 105px;">
            <input type="number" min="0" step="100" value="${tier.damage || 0}"
                   aria-label="Dégâts palier ${idx}"
                   class="comm-upg-input text-xs font-mono-num font-bold text-slate-100"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'damage', this.value)">
          </td>
          <td style="min-width: 75px;">
            <input type="number" min="1" max="500" step="1" value="${tier.range || 30}"
                   aria-label="Portée palier ${idx}"
                   class="comm-upg-input text-xs font-mono-num"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'range', this.value)">
          </td>
          <td style="min-width: 75px;">
            <input type="number" min="0.1" max="60" step="0.1" value="${tier.spa || 4}"
                   aria-label="SPA palier ${idx}"
                   class="comm-upg-input text-xs font-mono-num"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'spa', this.value)">
          </td>
          <td style="min-width: 85px;" class="text-center font-mono-num">
            <span id="comm-upg-dps-${idx}" class="inline-block px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
              ${Math.round(dps).toLocaleString()}
            </span>
          </td>
          <td style="min-width: 135px;">
            <select class="comm-upg-input text-[11px] font-semibold"
                    aria-label="Type de tour palier ${idx}"
                    onchange="CommunityUI.onUpgradeChange(${idx}, 'tower_type', this.value)">
              ${isDeploy ? `
                <option value="Ground" ${(!tType || tType === 'Ground') ? 'selected' : ''}>${window.t ? window.t('comm_type_ground', '🌱 Sol (Ground)') : '🌱 Sol (Ground)'}</option>
                <option value="Hill" ${tType === 'Hill' ? 'selected' : ''}>${window.t ? window.t('comm_type_hill', '🏔️ Colline (Hill)') : '🏔️ Colline (Hill)'}</option>
                <option value="Hybrid" ${tType === 'Hybrid' ? 'selected' : ''}>${window.t ? window.t('comm_type_hybrid', '⚡ Hybride (Hybrid)') : '⚡ Hybride (Hybrid)'}</option>
                <option value="Air" ${tType === 'Air' ? 'selected' : ''}>${window.t ? window.t('comm_type_air', '🦅 Aérien (Air)') : '🦅 Aérien (Air)'}</option>
              ` : `
                <option value="" ${!tType ? 'selected' : ''}>${window.t ? window.t('comm_type_unchanged', '— Inchangé —') : '— Inchangé —'}</option>
                <option value="Hybrid" ${tType === 'Hybrid' ? 'selected' : ''}>${window.t ? window.t('comm_type_hybrid', '⚡ Hybride (Hybrid)') : '⚡ Hybride (Hybrid)'}</option>
                <option value="Hill" ${tType === 'Hill' ? 'selected' : ''}>${window.t ? window.t('comm_type_hill', '🏔️ Colline (Hill)') : '🏔️ Colline (Hill)'}</option>
                <option value="Ground" ${tType === 'Ground' ? 'selected' : ''}>${window.t ? window.t('comm_type_ground', '🌱 Sol (Ground)') : '🌱 Sol (Ground)'}</option>
                <option value="Air" ${tType === 'Air' ? 'selected' : ''}>${window.t ? window.t('comm_type_air', '🦅 Aérien (Air)') : '🦅 Aérien (Air)'}</option>
              `}
            </select>
          </td>
          <td style="min-width: 150px;">
            <input type="text" value="${escapeHtml(abilitiesStr)}"
                   placeholder="${isDeploy ? 'Capacité initiale...' : 'Ex: + Max Upgrade, Full AoE...'}"
                   aria-label="Effets palier ${idx}"
                   class="comm-upg-input text-xs font-sans"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'abilities', this.value)">
          </td>
          <td class="text-right whitespace-nowrap">
            ${currentUnitUpgrades.length > 1 ? `
              <button type="button" onclick="CommunityUI.removeUpgradeRow(${idx})"
                      class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition tap-scale"
                      title="${window.t ? window.t('comm_del_tier', 'Supprimer ce palier') : 'Supprimer ce palier'}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <span class="text-slate-600 text-xs px-2">—</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    updateTiersSummaryBadges();
    const container = document.getElementById('upgrades-editor-container');
    if (window.safeCreateIcons) safeCreateIcons(container);
    else if (window.lucide) lucide.createIcons(container ? { root: container } : undefined);
  }

  function addUpgradeRow() {
    const nextLevel = currentUnitUpgrades.length;
    const prevTier = currentUnitUpgrades[nextLevel - 1] || { cost: 1000, damage: 2000, range: 30, spa: 4, tower_type: '', abilities: [] };

    // Suggérer des valeurs de départ que l'utilisateur peut modifier à sa guise
    currentUnitUpgrades.push({
      level: nextLevel,
      cost: prevTier.cost > 0 ? Math.round(prevTier.cost * 1.5) : 1000,
      damage: prevTier.damage > 0 ? Math.round(prevTier.damage * 1.5) : 3000,
      range: prevTier.range || 30,
      spa: prevTier.spa || 4,
      tower_type: '',
      abilities: []
    });

    renderUpgradeRows();
    updateLivePreview();
  }

  function removeUpgradeRow(idx) {
    if (currentUnitUpgrades.length <= 1) return;
    currentUnitUpgrades.splice(idx, 1);
    currentUnitUpgrades.forEach((u, i) => { u.level = i; });
    renderUpgradeRows();
    updateLivePreview();
  }

  function onUpgradeChange(idx, field, value) {
    if (!currentUnitUpgrades[idx]) return;

    if (field === 'cost') {
      currentUnitUpgrades[idx].cost = Math.max(0, parseInt(value, 10) || 0);
    } else if (field === 'damage') {
      currentUnitUpgrades[idx].damage = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'range') {
      currentUnitUpgrades[idx].range = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === 'spa') {
      currentUnitUpgrades[idx].spa = Math.max(0.1, parseFloat(value) || 0.1);
    } else if (field === 'abilities') {
      currentUnitUpgrades[idx].abilities = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    } else if (field === 'tower_type') {
      currentUnitUpgrades[idx].tower_type = value;
      if (idx === 0) {
        const topEl = document.getElementById('comm-unit-tower-type');
        if (topEl && value) topEl.value = value;
      } else if (value === 'Hybrid') {
        if (!currentUnitUpgrades[idx].abilities.some(a => (a || '').toLowerCase().includes('hybrid'))) {
          currentUnitUpgrades[idx].abilities.push('+ Hybrid');
        }
      } else if (value === 'Hill') {
        if (!currentUnitUpgrades[idx].abilities.some(a => (a || '').toLowerCase().includes('hill'))) {
          currentUnitUpgrades[idx].abilities.push('+ Hill Type');
        }
      } else if (value === 'Air') {
        if (!currentUnitUpgrades[idx].abilities.some(a => (a || '').toLowerCase().includes('air'))) {
          currentUnitUpgrades[idx].abilities.push('+ Air Type');
        }
      }
      renderUpgradeRows();
      updateLivePreview();
      return;
    }

    // Mettre à jour le badge DPS du palier en direct
    const rowDpsEl = document.getElementById(`comm-upg-dps-${idx}`);
    if (rowDpsEl) {
      const dmg = currentUnitUpgrades[idx].damage || 0;
      const spa = currentUnitUpgrades[idx].spa || 1;
      const rowDps = spa > 0 ? (dmg / spa) : dmg;
      rowDpsEl.textContent = Math.round(rowDps).toLocaleString();
    }

    updateTiersSummaryBadges();
    updateLivePreview();
  }

  // --- GESTION DE L'IMPORTATION D'IMAGES LOCALES (DEPUIS LE PC) ---

  function handleImageFileUpload(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(window.t ? window.t('comm_invalid_img_file', 'Veuillez sélectionner un fichier image valide (.png, .jpg, .webp).') : 'Veuillez sélectionner un fichier image valide (.png, .jpg, .webp).');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = function() {
        const maxDim = 350;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        currentUploadedImageDataUrl = canvas.toDataURL('image/png');
        currentUploadedImageName = file.name;

        const urlInput = document.getElementById('comm-unit-image');
        if (urlInput) urlInput.value = '';

        renderImagePreviewWidget();
        updateLivePreview();
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeUploadedImage() {
    currentUploadedImageDataUrl = null;
    currentUploadedImageName = '';
    const fileInput = document.getElementById('comm-unit-file-input');
    if (fileInput) fileInput.value = '';
    renderImagePreviewWidget();
    updateLivePreview();
  }

  function onImageUrlInput() {
    const urlInput = document.getElementById('comm-unit-image');
    if (urlInput && urlInput.value.trim()) {
      currentUploadedImageDataUrl = null;
      currentUploadedImageName = '';
      const fileInput = document.getElementById('comm-unit-file-input');
      if (fileInput) fileInput.value = '';
      renderImagePreviewWidget();
    }
    updateLivePreview();
  }

  function renderImagePreviewWidget() {
    const previewWrap = document.getElementById('comm-img-preview-wrap');
    if (!previewWrap) return;

    if (currentUploadedImageDataUrl) {
      previewWrap.innerHTML = `
        <div class="flex items-center gap-2.5 p-2 rounded-lg bg-sky-950/50 border border-sky-500/40 mt-1">
          <img src="${currentUploadedImageDataUrl}" class="w-10 h-10 rounded object-contain bg-slate-900 border border-slate-700 shrink-0 p-0.5" alt="Aperçu importé">
          <div class="min-w-0 flex-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 uppercase">
              <i data-lucide="check-circle" class="w-3 h-3 text-sky-400"></i>
              ${window.t ? window.t('comm_img_from_pc_loaded', 'Fichier PC importé') : 'Fichier PC importé'}
            </span>
            <div class="text-xs font-semibold text-white truncate">${escapeHtml(currentUploadedImageName || 'image_locale.png')}</div>
          </div>
          <button type="button" onclick="CommunityUI.removeUploadedImage()"
                  class="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-semibold text-[11px] tap-scale flex items-center gap-1 shrink-0"
                  title="${window.t ? window.t('comm_img_remove', 'Retirer cette image') : 'Retirer cette image'}">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
            <span>${window.t ? window.t('delete', 'Retirer') : 'Retirer'}</span>
          </button>
        </div>
      `;
    } else {
      previewWrap.innerHTML = '';
    }

    if (window.safeCreateIcons) safeCreateIcons(previewWrap);
    else if (window.lucide) lucide.createIcons(previewWrap ? { root: previewWrap } : undefined);
  }

  // --- FORMULAIRE UNITÉ AVEC LIVE PREVIEW ---

  function setupUnitForm(unitId = null) {
    const titleEl = document.getElementById('community-modal-title');
    const bodyEl = document.getElementById('community-modal-body');
    if (!bodyEl) return;

    let existing = null;
    if (unitId) {
      existing = (window.ALL_UNITS || []).find(u => u.id === unitId);
    }

    const isEdit = !!existing;
    if (titleEl) {
      titleEl.textContent = isEdit ?
        (window.t ? window.t('comm_title_edit_unit', 'Modifier la fiche : {name}').replace('{name}', existing.name) : `Modifier la fiche : ${existing.name}`) :
        (window.t ? window.t('comm_title_add_unit', 'Créer & Proposer une Nouvelle Unité') : 'Créer & Proposer une Nouvelle Unité');
    }

    // Initialiser l'image uploadée si l'unité en possède une en base64
    if (existing?.image && existing.image.startsWith('data:image')) {
      currentUploadedImageDataUrl = existing.image;
      currentUploadedImageName = 'image_existante.png';
    } else {
      currentUploadedImageDataUrl = null;
      currentUploadedImageName = '';
    }

    // Initialiser les paliers d'amélioration
    if (existing && Array.isArray(existing.upgrades) && existing.upgrades.length > 0) {
      currentUnitUpgrades = existing.upgrades.map((u, idx) => {
        let tType = u.tower_type || '';
        if (!tType && idx > 0) {
          const abList = Array.isArray(u.abilities) ? u.abilities : (u.abilities ? [String(u.abilities)] : []);
          if (abList.some(a => (a || '').toLowerCase().includes('hybrid'))) tType = 'Hybrid';
          else if (abList.some(a => (a || '').toLowerCase().includes('hill'))) tType = 'Hill';
          else if (abList.some(a => (a || '').toLowerCase().includes('air'))) tType = 'Air';
        } else if (!tType && idx === 0) {
          const baseRaw = (existing.tower_type || '').split(/->|→/)[0].trim();
          tType = baseRaw || 'Ground';
        }
        return {
          level: u.level !== undefined ? u.level : idx,
          cost: Number(u.cost) || 0,
          damage: Number(u.damage) || 0,
          range: Number(u.range) || 0,
          spa: Number(u.spa) || 1,
          tower_type: tType,
          abilities: Array.isArray(u.abilities) ? [...u.abilities] : (u.abilities ? [String(u.abilities)] : [])
        };
      });
    } else if (existing) {
      const baseRaw = (existing.tower_type || '').split(/->|→/)[0].trim() || 'Ground';
      currentUnitUpgrades = [{
        level: 0,
        cost: Number(existing.deployment_cost) || 500,
        damage: Number(existing.max_damage) || 1000,
        range: Number(existing.max_range) || 30,
        spa: Number(existing.min_spa) || 4,
        tower_type: baseRaw,
        abilities: []
      }];
    } else {
      currentUnitUpgrades = [
        { level: 0, cost: 500, damage: 1500, range: 25, spa: 4.0, tower_type: 'Ground', abilities: [] },
        { level: 1, cost: 1200, damage: 5500, range: 32, spa: 4.0, tower_type: '', abilities: [] },
        { level: 2, cost: 3500, damage: 18000, range: 45, spa: 3.5, tower_type: '', abilities: ['+ Max Upgrade'] }
      ];
    }

    const defaultImg = existing?.image || "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
    const animeOptions = Array.from(new Set(
      (window.ALL_UNITS || [])
        .map(u => stripHtml(u.anime_origin))
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));

    bodyEl.innerHTML = `
      <form id="comm-unit-form" onsubmit="event.preventDefault(); CommunityUI.submitUnitForm();" class="space-y-4">
        
        <!-- Aide débutant -->
        <div class="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 text-xs text-sky-200 flex items-start gap-2.5">
          <i data-lucide="info" class="w-4 h-4 text-sky-400 shrink-0 mt-0.5"></i>
          <div>
            <strong>${window.t ? window.t('comm_help_title', 'Assistant Débutant :') : 'Assistant Débutant :'}</strong>
            <span>${window.t ? window.t('comm_help_desc_upgrades', 'Remplissez les informations générales et saisissez chaque palier d\'amélioration manuellement. Le coût total et les statistiques maximales sont calculés directement à partir de vos paliers.') : 'Remplissez les informations générales et saisissez chaque palier d\'amélioration manuellement. Le coût total et les statistiques maximales sont calculés directement à partir de vos paliers.'}</span>
          </div>
        </div>

        <!-- Section 1 : Informations Générales & Live Preview -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- Colonne Champs Principaux (7 cols) -->
          <div class="lg:col-span-7 space-y-3 text-xs">
            
            <!-- Nom et Rareté -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_name', 'Nom de l\'unité *') : 'Nom de l\'unité *'}
                </label>
                <input type="text" id="comm-unit-name" required value="${escapeHtml(stripHtml(existing?.name) || '')}"
                       placeholder="Ex: Goku Ultra Instinct, Nanami..."
                       class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                       oninput="CommunityUI.updateLivePreview()">
              </div>
              <div>
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_rarity', 'Rareté *') : 'Rareté *'}
                </label>
                <select id="comm-unit-star" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono-num font-bold"
                        onchange="CommunityUI.updateLivePreview()">
                  <option value="7" ${existing?.star === 7 ? 'selected' : ''}>7★ (Mythique)</option>
                  <option value="6" ${existing?.star === 6 || !existing ? 'selected' : ''}>6★ (Secret)</option>
                  <option value="5" ${existing?.star === 5 ? 'selected' : ''}>5★ (Légendaire)</option>
                  <option value="4" ${existing?.star === 4 ? 'selected' : ''}>4★ (Épique)</option>
                  <option value="3" ${existing?.star === 3 ? 'selected' : ''}>3★ (Rare)</option>
                  <option value="2" ${existing?.star === 2 ? 'selected' : ''}>2★ (Commun)</option>
                </select>
              </div>
            </div>

            <!-- Anime et Personnage -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_anime', 'Franchise / Anime') : 'Franchise / Anime'}
                </label>
                <input type="text" id="comm-unit-anime" list="anime-suggestions" value="${escapeHtml(stripHtml(existing?.anime_origin) || '')}"
                       placeholder="Ex: Dragon Ball, Naruto, Bleach..."
                       class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                       oninput="CommunityUI.updateLivePreview()">
                <datalist id="anime-suggestions">
                  ${animeOptions.map(a => `<option value="${escapeHtml(a)}">`).join('')}
                </datalist>
              </div>
              <div>
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_char', 'Personnage d\'origine') : 'Personnage d\'origine'}
                </label>
                <input type="text" id="comm-unit-char" value="${escapeHtml(stripHtml(existing?.character_origin) || '')}"
                       placeholder="Ex: Son Goku, Kakashi..."
                       class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500">
              </div>
            </div>

            <!-- Bloc Image : Import PC ou Lien Web -->
            <div class="p-3 rounded-xl bg-[#090e1c] border border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="font-bold text-slate-200 flex items-center gap-1.5">
                  <i data-lucide="image" class="w-3.5 h-3.5 text-sky-400"></i>
                  <span>${window.t ? window.t('comm_field_image', 'Image de l\'Unité') : 'Image de l\'Unité'}</span>
                </label>
                <span class="text-[10px] text-slate-400 font-mono-num">PNG, JPG, WebP</span>
              </div>

              <!-- Zone d'importation depuis le PC -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input type="file" id="comm-unit-file-input" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden"
                       onchange="CommunityUI.handleImageFileUpload(this.files[0])">
                
                <button type="button" onclick="document.getElementById('comm-unit-file-input').click()"
                        class="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 tap-scale shadow-sm transition-all shrink-0">
                  <i data-lucide="folder-up" class="w-4 h-4"></i>
                  <span>${window.t ? window.t('comm_btn_browse_pc', '📁 Importer depuis mon PC') : '📁 Importer depuis mon PC'}</span>
                </button>

                <span class="text-[11px] text-slate-400 text-center sm:text-left">${window.t ? window.t('comm_or_enter_url', 'ou saisissez un lien URL ci-dessous :') : 'ou saisissez un lien URL ci-dessous :'}</span>
              </div>

              <!-- Widget d'aperçu de l'image locale importée -->
              <div id="comm-img-preview-wrap"></div>

              <!-- Champ URL Web alternatif -->
              <div class="relative">
                <input type="url" id="comm-unit-image" value="${(!currentUploadedImageDataUrl && existing?.image) ? escapeHtml(existing.image) : ''}"
                       placeholder="https://static.wikia.nocookie.net/... ou lien .png/.jpg"
                       class="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 font-mono-num"
                       oninput="CommunityUI.onImageUrlInput()">
              </div>
            </div>

            <!-- Types : Placement et Attaque -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_tower_type', 'Type de Placement') : 'Type de Placement'}
                </label>
                <select id="comm-unit-tower-type" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                        onchange="CommunityUI.onTopTowerTypeChange(this.value)">
                  <option value="Ground" ${(!existing?.tower_type || existing.tower_type.startsWith('Ground')) ? 'selected' : ''}>Sol (Ground)</option>
                  <option value="Air" ${existing?.tower_type?.startsWith('Air') ? 'selected' : ''}>Aérien (Air)</option>
                  <option value="Hill" ${existing?.tower_type?.startsWith('Hill') ? 'selected' : ''}>Colline (Hill)</option>
                  <option value="Hybrid" ${existing?.tower_type?.startsWith('Hybrid') ? 'selected' : ''}>Hybride (Sol & Air)</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_attack_type', 'Zone d\'Attaque') : 'Zone d\'Attaque'}
                </label>
                <select id="comm-unit-attack-type" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500">
                  <option value="AoE (Circle)" ${existing?.attack_type?.includes('Circle') || !existing ? 'selected' : ''}>AoE Cercle (Circle)</option>
                  <option value="AoE (Cone)" ${existing?.attack_type?.includes('Cone') ? 'selected' : ''}>AoE Cône (Cone)</option>
                  <option value="AoE (Full)" ${existing?.attack_type?.includes('Full') ? 'selected' : ''}>AoE Pleine Carte (Full)</option>
                  <option value="Single Target" ${existing?.attack_type?.includes('Single') ? 'selected' : ''}>Cible Unique (Single)</option>
                </select>
              </div>
            </div>

          </div>

          <!-- Colonne Prévisualisation en direct (5 cols) -->
          <div class="lg:col-span-5 flex flex-col items-center justify-start space-y-3 bg-[#070b14] p-4 rounded-xl border border-slate-800/80">
            <div class="w-full flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span class="font-bold text-sky-400 flex items-center gap-1">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                <span>Aperçu en Direct</span>
              </span>
              <span class="text-[10px] text-slate-400 uppercase font-bold">Rendu de la Carte</span>
            </div>

            <!-- Conteneur Carte Preview -->
            <div id="live-preview-card" class="w-full max-w-xs"></div>
            
            <p class="text-[10px] text-slate-500 text-center leading-normal">
              Les statistiques max et coûts de cette carte sont calculés directement à partir de vos paliers ci-dessous.
            </p>
          </div>

        </div>

        <!-- Section 2 : Éditeur Manuel des Paliers d'Amélioration (Full Width) -->
        <div class="tactical-card rounded-xl p-4 border border-slate-800 space-y-3 bg-[#0c1222]/80">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
            <div>
              <h3 class="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <i data-lucide="layers" class="w-4 h-4 text-sky-400"></i>
                <span>${window.t ? window.t('comm_upgrades_section_title', 'Paliers d\'Amélioration (Saisie Manuelle)') : 'Paliers d\'Amélioration (Saisie Manuelle)'}</span>
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">
                ${window.t ? window.t('comm_upgrades_section_desc', 'Renseignez à la main le coût, les dégâts, la portée et le SPA de chaque palier. Aucun multiplicateur automatique n\'est imposé.') : 'Renseignez à la main le coût, les dégâts, la portée et le SPA de chaque palier. Aucun multiplicateur automatique n\'est imposé.'}
              </p>
            </div>
            <button type="button" onclick="CommunityUI.addUpgradeRow()"
                    class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 tap-scale shrink-0 shadow-sm">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>${window.t ? window.t('comm_btn_add_tier', 'Ajouter un palier') : 'Ajouter un palier'}</span>
            </button>
          </div>

          <!-- Résumé dynamique en direct des paliers saisis -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center font-mono-num text-xs">
            <div class="p-2 rounded-lg bg-[#070b14] border border-slate-800">
              <span class="block text-[9px] uppercase font-sans font-bold text-slate-400">Déploiement</span>
              <span id="comm-summary-deploy" class="text-xs font-bold text-slate-100">$0</span>
            </div>
            <div class="p-2 rounded-lg bg-[#070b14] border border-slate-800">
              <span class="block text-[9px] uppercase font-sans font-bold text-slate-400">Coût Total</span>
              <span id="comm-summary-total" class="text-xs font-bold text-sky-400">$0</span>
            </div>
            <div class="p-2 rounded-lg bg-[#070b14] border border-slate-800">
              <span class="block text-[9px] uppercase font-sans font-bold text-slate-400">Dégâts Max</span>
              <span id="comm-summary-damage" class="text-xs font-bold text-emerald-400">0</span>
            </div>
            <div class="p-2 rounded-lg bg-[#070b14] border border-slate-800">
              <span class="block text-[9px] uppercase font-sans font-bold text-slate-400">Portée Max</span>
              <span id="comm-summary-range" class="text-xs font-bold text-slate-200">0</span>
            </div>
            <div class="p-2 rounded-lg bg-[#070b14] border border-slate-800">
              <span class="block text-[9px] uppercase font-sans font-bold text-slate-400">SPA Min</span>
              <span id="comm-summary-spa" class="text-xs font-bold text-slate-300">0s</span>
            </div>
            <div class="p-2 rounded-lg bg-[#070b14] border border-slate-800">
              <span class="block text-[9px] uppercase font-sans font-bold text-amber-400">DPS Max (Auto)</span>
              <span id="comm-summary-dps" class="text-xs font-bold text-amber-300">0</span>
            </div>
          </div>

          <!-- Tableau interactif des paliers -->
          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-[#070b14] shadow-inner max-h-72 overflow-y-auto">
            <table class="w-full text-left comm-upgrades-table">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="w-24">Palier</th>
                  <th class="w-28">Coût ($)</th>
                  <th class="w-28">Dégâts (DMG)</th>
                  <th class="w-20">Portée</th>
                  <th class="w-20">SPA (s)</th>
                  <th class="w-24 text-center">DPS</th>
                  <th class="w-36">${window.t ? window.t('comm_th_tower_type', 'Type de Tour') : 'Type de Tour'}</th>
                  <th>Effets / Aptitude</th>
                  <th class="w-16 text-right">Action</th>
                </tr>
              </thead>
              <tbody id="comm-upgrades-tbody">
                <!-- Rendu dynamique par CommunityUI.renderUpgradeRows() -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 3 : Description & Options -->
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-200 mb-1">
              ${window.t ? window.t('comm_field_overview', 'Description / Remarque') : 'Description / Remarque'}
            </label>
            <textarea id="comm-unit-overview" rows="2"
                      placeholder="${t('comm_ph_unit_overview', "Présentation de l'unité, capacités notables, obtention...")}"
                      class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500 text-xs">${existing?.overview || ''}</textarea>
          </div>

          <div class="flex items-center gap-4 text-xs">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="comm-unit-tradeable" ${existing?.is_tradeable ? 'checked' : ''} class="rounded bg-slate-900 border-slate-700 text-sky-600">
              <span class="text-slate-300">Échangeable (Tradeable)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="comm-unit-unobtainable" ${existing?.is_unobtainable ? 'checked' : ''} class="rounded bg-slate-900 border-slate-700 text-sky-600">
              <span class="text-slate-300">Retirée du jeu (Introuvable)</span>
            </label>
          </div>
        </div>

        <!-- Boutons d'action en bas -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="CommunityUI.submitAndProposeToGitHub()" class="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 tap-scale transition-colors shadow-sm" title="${t('comm_btn_propose_unit_gh_tip', "Enregistrer et ouvrir l'issue GitHub pré-remplie pour le Wiki")}">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>${window.t ? window.t('comm_btn_propose_gh', 'Proposer sur GitHub') : 'Proposer sur GitHub'}</span>
            </button>
            <button type="submit" id="comm-unit-submit-btn" class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 tap-scale shadow-md">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>${isEdit ? (window.t ? window.t('comm_btn_save_changes', 'Enregistrer les Modifications') : 'Enregistrer les Modifications') : (window.t ? window.t('comm_btn_create_unit', 'Créer & Ajouter l\'Unite') : 'Créer & Ajouter l\'Unite')}</span>
            </button>
          </div>
        </div>

      </form>
    `;

    renderImagePreviewWidget();
    renderUpgradeRows();
    updateLivePreview();
    const modal = document.getElementById('community-modal');
    if (window.safeCreateIcons) safeCreateIcons(modal);
    else if (window.lucide) lucide.createIcons(modal ? { root: modal } : undefined);
  }

  function onTopTowerTypeChange(val) {
    if (currentUnitUpgrades && currentUnitUpgrades.length > 0) {
      currentUnitUpgrades[0].tower_type = val;
      renderUpgradeRows();
    }
    updateLivePreview();
  }

  function updateLivePreview() {
    const name = document.getElementById('comm-unit-name')?.value?.trim() || 'Nom de l\'unité';
    const star = document.getElementById('comm-unit-star')?.value || '6';
    const anime = document.getElementById('comm-unit-anime')?.value?.trim() || 'All Star Tower Defense';
    const inputUrl = document.getElementById('comm-unit-image')?.value?.trim();
    const image = currentUploadedImageDataUrl || inputUrl || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
    const towerType = computeUnitTowerType();
    const translatedTower = window.translateTowerType ? window.translateTowerType(towerType) : towerType;

    const stats = computeTierStats();
    const dps = stats.max_dps;
    const dmg = stats.max_damage;
    const range = stats.max_range;
    const spa = stats.min_spa;

    const previewContainer = document.getElementById('live-preview-card');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <article class="tactical-card rounded-xl p-3.5 border border-sky-500/40 bg-[#0f1629] flex flex-col justify-between shadow-lg relative">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono-num font-bold star-${star}-badge">
                ${star}★
              </span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide">
                Communauté
              </span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-900 border border-slate-700 text-sky-300 rounded font-mono-num" title="${towerType}">
              ${translatedTower}
            </span>
          </div>

          <div class="w-full h-28 rounded-lg bg-[#070b14] border border-slate-800 p-2 my-1 flex items-center justify-center overflow-hidden">
            <img src="${image}" width="112" height="112" loading="lazy" decoding="async" onerror="this.src='https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'"
                 class="max-h-full max-w-full object-contain filter drop-shadow rounded">
          </div>

          <div class="my-2 min-w-0">
            <div class="font-bold text-xs sm:text-sm text-white truncate">${escapeHtml(stripHtml(name))}</div>
            <div class="text-[11px] text-slate-400 truncate">${escapeHtml(stripHtml(anime))}</div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 font-mono-num text-[11px]">
            <div class="bg-[#090e1c] px-2 py-1 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[9px] font-sans uppercase">DMG Max</span>
              <span class="font-bold text-slate-100">${dmg.toLocaleString()}</span>
            </div>
            <div class="bg-[#090e1c] px-2 py-1 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[9px] font-sans uppercase">DPS Max</span>
              <span class="font-bold text-amber-300">${Math.round(dps).toLocaleString()}</span>
            </div>
            <div class="bg-[#090e1c] px-2 py-1 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[9px] font-sans uppercase">Portée Max</span>
              <span class="font-semibold text-slate-200">${range}</span>
            </div>
            <div class="bg-[#090e1c] px-2 py-1 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[9px] font-sans uppercase">SPA Min</span>
              <span class="font-semibold text-slate-300">${spa}s</span>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono-num">
            <span>Dép: <strong class="text-slate-200">$${stats.deployment_cost.toLocaleString()}</strong></span>
            <span>Total: <strong class="text-sky-300">$${stats.total_cost.toLocaleString()}</strong></span>
            <span>Paliers: <strong class="text-amber-300">${currentUnitUpgrades.length}</strong></span>
          </div>
        </article>
      `;
    }
  }

  async function submitUnitForm() {
    const name = document.getElementById('comm-unit-name')?.value?.trim();
    if (!name) return;

    if (!currentUnitUpgrades || currentUnitUpgrades.length === 0) {
      alert(window.t ? window.t('comm_tier_required', 'Veuillez renseigner au moins un palier d\'amélioration.') : 'Veuillez renseigner au moins un palier d\'amélioration.');
      return;
    }

    const stats = computeTierStats();
    const inputUrl = document.getElementById('comm-unit-image')?.value?.trim();
    const finalImage = currentUploadedImageDataUrl || inputUrl || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
    const computedTower = computeUnitTowerType();

    const unitData = {
      id: editingUnitId,
      name: name,
      star: parseInt(document.getElementById('comm-unit-star').value, 10),
      anime_origin: document.getElementById('comm-unit-anime').value.trim(),
      character_origin: document.getElementById('comm-unit-char').value.trim(),
      image: finalImage,
      tower_type: computedTower,
      attack_type: document.getElementById('comm-unit-attack-type').value,
      deployment_cost: stats.deployment_cost,
      total_cost: stats.total_cost,
      max_damage: stats.max_damage,
      max_range: stats.max_range,
      min_spa: stats.min_spa,
      max_dps: Math.round(stats.max_dps),
      upgrades: currentUnitUpgrades.map((u, i) => ({
        level: u.level !== undefined ? u.level : i,
        cost: Number(u.cost) || 0,
        damage: Number(u.damage) || 0,
        range: Number(u.range) || 0,
        spa: Number(u.spa) || 1,
        tower_type: u.tower_type || '',
        abilities: Array.isArray(u.abilities) ? u.abilities : []
      })),
      overview: document.getElementById('comm-unit-overview').value.trim(),
      is_tradeable: document.getElementById('comm-unit-tradeable').checked,
      is_unobtainable: document.getElementById('comm-unit-unobtainable').checked
    };

    const success = await CommunityManager.saveUnit(unitData);
    if (success) {
      closeModal();
    }
  }

  async function submitAndProposeToGitHub() {
    const name = document.getElementById('comm-unit-name')?.value?.trim();
    if (!name) {
      alert(window.t ? window.t('comm_name_required', 'Le nom de l\'unité est obligatoire.') : 'Le nom de l\'unité est obligatoire.');
      return;
    }

    if (!currentUnitUpgrades || currentUnitUpgrades.length === 0) {
      alert(window.t ? window.t('comm_tier_required', 'Veuillez renseigner au moins un palier d\'amélioration.') : 'Veuillez renseigner au moins un palier d\'amélioration.');
      return;
    }

    const stats = computeTierStats();
    const inputUrl = document.getElementById('comm-unit-image')?.value?.trim();
    const finalImage = currentUploadedImageDataUrl || inputUrl || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
    const computedTower = computeUnitTowerType();

    const unitData = {
      id: editingUnitId,
      name: name,
      star: parseInt(document.getElementById('comm-unit-star').value, 10),
      anime_origin: document.getElementById('comm-unit-anime').value.trim(),
      character_origin: document.getElementById('comm-unit-char').value.trim(),
      image: finalImage,
      tower_type: computedTower,
      attack_type: document.getElementById('comm-unit-attack-type').value,
      deployment_cost: stats.deployment_cost,
      total_cost: stats.total_cost,
      max_damage: stats.max_damage,
      max_range: stats.max_range,
      min_spa: stats.min_spa,
      max_dps: Math.round(stats.max_dps),
      upgrades: currentUnitUpgrades.map((u, i) => ({
        level: u.level !== undefined ? u.level : i,
        cost: Number(u.cost) || 0,
        damage: Number(u.damage) || 0,
        range: Number(u.range) || 0,
        spa: Number(u.spa) || 1,
        tower_type: u.tower_type || '',
        abilities: Array.isArray(u.abilities) ? u.abilities : []
      })),
      overview: document.getElementById('comm-unit-overview').value.trim(),
      is_tradeable: document.getElementById('comm-unit-tradeable').checked,
      is_unobtainable: document.getElementById('comm-unit-unobtainable').checked
    };

    const success = await CommunityManager.saveUnit(unitData);
    if (success) {
      closeModal();
      const issueUrl = CommunityManager.generateGitHubIssueURL('unit', unitData);
      window.open(issueUrl, '_blank', 'noopener,noreferrer');
      if (window.showToast) {
        window.showToast(window.t ? window.t('comm_github_opened', 'Page GitHub ouverte ! Soumettez l\'issue pour l\'intégration automatique.') : 'Page GitHub ouverte ! Soumettez l\'issue pour l\'intégration automatique.');
      }
    }
  }

  // --- FORMULAIRE CODE PROMO ---

  function setupCodeForm() {
    const titleEl = document.getElementById('community-modal-title');
    const bodyEl = document.getElementById('community-modal-body');
    if (!bodyEl) return;

    if (titleEl) {
      titleEl.textContent = window.t ? window.t('comm_title_add_code', 'Proposer un Code Promo') : 'Proposer un Code Promo';
    }

    bodyEl.innerHTML = `
      <form id="comm-code-form" onsubmit="event.preventDefault(); CommunityUI.submitCodeForm();" class="space-y-4 text-xs">
        <div class="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-emerald-200 flex items-start gap-2.5">
          <i data-lucide="gift" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
          <div>
            <strong>${window.t ? window.t('comm_code_help_title', 'Partagez un code ASTD :') : 'Partagez un code ASTD :'}</strong>
            <span>${window.t ? window.t('comm_code_help_desc', 'Ajoutez un nouveau code actif dès sa publication par les développeurs Roblox pour que tout le monde puisse en profiter.') : 'Ajoutez un nouveau code actif dès sa publication par les développeurs Roblox pour que tout le monde puisse en profiter.'}</span>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_code_str', 'Code Promotionnel *') : 'Code Promotionnel *'}
          </label>
          <input type="text" id="comm-code-str" required placeholder="Ex: SummerAwaits2026..."
                 class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num font-bold focus:outline-none focus:border-emerald-500">
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_rewards', 'Récompenses *') : 'Récompenses *'}
          </label>
          <input type="text" id="comm-code-reward" required placeholder="Ex: 150 Stardust, 4 000 Gemmes..."
                 class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500">
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_code_status', 'Statut du Code') : 'Statut du Code'}
          </label>
          <select id="comm-code-status" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500">
            <option value="active">Actif & Vérifié</option>
            <option value="expired">Expiré</option>
          </select>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <button type="submit" id="comm-code-submit-btn" onclick="event.preventDefault(); CommunityUI.submitCodeForm();" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 tap-scale">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>${window.t ? window.t('comm_btn_save_code', 'Enregistrer le Code') : 'Enregistrer le Code'}</span>
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('community-modal');
    if (window.safeCreateIcons) safeCreateIcons(modal);
    else if (window.lucide) lucide.createIcons(modal ? { root: modal } : undefined);
  }

  async function submitCodeForm() {
    const codeStr = document.getElementById('comm-code-str').value.trim();
    const reward = document.getElementById('comm-code-reward').value.trim();
    const status = document.getElementById('comm-code-status').value;

    if (!codeStr) return;

    const success = await CommunityManager.saveCode({
      code: codeStr,
      reward: reward,
      status: status
    });

    if (success) {
      closeModal();
    }
  }

  // --- FORMULAIRE CONSEIL / ASTUCE DE JEU ---

  function setupTipForm(unitId) {
    const titleEl = document.getElementById('community-modal-title');
    const bodyEl = document.getElementById('community-modal-body');
    if (!bodyEl) return;

    const unit = (window.ALL_UNITS || []).find(u => u.id === unitId);
    const unitName = unit ? unit.name : unitId;

    if (titleEl) {
      titleEl.textContent = window.t ? window.t('comm_title_add_tip', 'Ajouter un conseil : {name}').replace('{name}', unitName) : `Ajouter un conseil : ${unitName}`;
    }

    bodyEl.innerHTML = `
      <form id="comm-tip-form" onsubmit="event.preventDefault(); CommunityUI.submitTipForm('${unitId}');" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_author', 'Votre pseudo (optionnel)') : 'Votre pseudo (optionnel)'}
          </label>
          <input type="text" id="comm-tip-author" placeholder="Ex: ProPlayer99"
                 class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500">
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_tip_type', 'Catégorie du conseil') : 'Catégorie du conseil'}
          </label>
          <select id="comm-tip-type" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500">
            <option value="meta">${t('comm_tip_cat_meta', 'Méta & Classement')}</option>
            <option value="raid">${t('comm_tip_cat_raid', 'Raids & Donjons')}</option>
            <option value="orbs">${t('comm_tip_cat_orbs', 'Orbe Recommandé')}</option>
            <option value="synergy">${t('comm_tip_cat_synergy', 'Synergie de Deck')}</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_tip_text', 'Votre conseil tactique *') : 'Votre conseil tactique *'}
          </label>
          <textarea id="comm-tip-text" required rows="3"
                    placeholder="${t('comm_ph_tip_text', "Ex: Équipez l'orbe Fire Orb pour doubler ses dégâts en Raid 2. Très efficace combiné avec Idol pour le buff Shine...")}"
                    class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"></textarea>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <button type="submit" id="comm-tip-submit-btn" onclick="event.preventDefault(); CommunityUI.submitTipForm('${unitId}');" class="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 tap-scale">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>${window.t ? window.t('comm_btn_save_tip', 'Publier le Conseil') : 'Publier le Conseil'}</span>
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('community-modal');
    if (window.safeCreateIcons) safeCreateIcons(modal);
    else if (window.lucide) lucide.createIcons(modal ? { root: modal } : undefined);
  }

  async function submitTipForm(unitId) {
    const author = document.getElementById('comm-tip-author').value.trim();
    const type = document.getElementById('comm-tip-type').value;
    const text = document.getElementById('comm-tip-text').value.trim();

    if (!text) return;

    const success = await CommunityManager.saveTip(unitId, {
      author,
      type,
      text
    });

    if (success) {
      closeModal();
    }
  }

  // --- FORMULAIRE ORBES & RELIQUES TACTIQUES ---

  function setupOrbForm(orbName = null) {
    const titleEl = document.getElementById('community-modal-title');
    const bodyEl = document.getElementById('community-modal-body');
    if (!bodyEl) return;

    const allOrbs = window.ORBS_DATA || (window.getGlobalOrbs ? window.getGlobalOrbs() : []);
    let existing = null;
    if (orbName) {
      existing = allOrbs.find(o => (o.name || '').toLowerCase() === (orbName || '').toLowerCase()) || null;
    }

    const isEdit = !!existing;
    if (titleEl) {
      titleEl.textContent = isEdit ?
        (window.t ? window.t('comm_title_edit_orb', 'Modifier l\'Orbe : {name}').replace('{name}', existing.name) : `Modifier l'Orbe : ${existing.name}`) :
        (window.t ? window.t('comm_title_add_orb', 'Créer & Proposer un Nouvel Orbe') : 'Créer & Proposer un Nouvel Orbe');
    }

    if (existing?.image && existing.image.startsWith('data:image')) {
      currentUploadedOrbImageDataUrl = existing.image;
      currentUploadedOrbImageName = 'image_existante.png';
    } else {
      currentUploadedOrbImageDataUrl = null;
      currentUploadedOrbImageName = '';
    }

    // PAS DE PRÉ-REMPLISSAGE PAR DÉFAUT SI NOUVEL ORBE
    const currentRequire = existing?.require || '';
    const currentObtain = existing?.obtain || '';

    const standardPresets = [
      { val: 'All units', label: 'Toutes les unités' },
      { val: '6 Star Units', label: '6★' },
      { val: '7 Star Units', label: '7★' },
      { val: 'Ground Units', label: 'Sol' },
      { val: 'Air Units', label: 'Air' },
      { val: 'Hill Units', label: 'Colline' }
    ];

    const orbUniqueRequires = Array.from(new Set(
      allOrbs.map(o => (o.require || '').trim()).filter(r => r && !standardPresets.some(p => p.val.toLowerCase() === r.toLowerCase()))
    )).sort((a, b) => a.localeCompare(b));

    bodyEl.innerHTML = `
      <form id="comm-orb-form" onsubmit="event.preventDefault(); CommunityUI.submitOrbForm();" class="space-y-4">
        
        <!-- Sélecteur Rapide Mode Création / Édition d'un orbe existant -->
        <div class="p-3 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-bold text-slate-300 whitespace-nowrap">${t('comm_current_mode_label', 'Mode actuel :')}</span>
            <span class="px-2.5 py-1 rounded text-xs font-bold ${isEdit ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'} flex items-center gap-1.5 truncate">
              <i data-lucide="${isEdit ? 'edit-3' : 'plus-circle'}" class="w-3.5 h-3.5 shrink-0"></i>
              <span class="truncate">${isEdit ? `${t('comm_mode_modifying', 'Modification : {name}').replace('{name}', escapeHtml(existing.name))}` : 'Création d\'un nouvel orbe'}</span>
            </span>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <label for="comm-orb-target-switcher" class="text-xs text-slate-400 font-medium whitespace-nowrap">${t('comm_switch_label', 'Changer :')}</label>
            <select id="comm-orb-target-switcher" onchange="CommunityUI.onOrbModalSwitchTarget(this.value)"
                    class="flex-1 sm:flex-none bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer max-w-xs truncate">
              <option value="__NEW__" ${!isEdit ? 'selected' : ''}>${t('comm_opt_new_orb', '➕ Nouvel orbe (vierge)')}</option>
              <optgroup label="${t('comm_orb_edit_header', 'Modifier un orbe existant ({count})').replace('{count}', allOrbs.length)}">
                ${allOrbs.map(o => `<option value="${encodeURIComponent(o.name)}" ${isEdit && existing.name.toLowerCase() === o.name.toLowerCase() ? 'selected' : ''}>✏️ ${escapeHtml(o.name)}</option>`).join('')}
              </optgroup>
            </select>
          </div>
        </div>

        <!-- Aide Débutant & Guide -->
        <div class="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200 flex items-start gap-2.5">
          <i data-lucide="sparkles" class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"></i>
          <div>
            <strong>${window.t ? window.t('comm_orb_help_title', 'Atelier d\'Orbes & Reliques :') : 'Atelier d\'Orbes & Reliques :'}</strong>
            <span>${window.t ? window.t('comm_orb_help_desc', 'Ajoutez un nouvel orbe ou ajustez les statistiques et compatibilités d\'un orbe existant. L\'aperçu en direct vous montre immédiatement la carte telle qu\'elle figurera dans le compendium.') : 'Ajoutez un nouvel orbe ou ajustez les statistiques et compatibilités d\'un orbe existant. L\'aperçu en direct vous montre immédiatement la carte telle qu\'elle figurera dans le compendium.'}</span>
          </div>
        </div>

        <!-- Section Grille : Formulaire (7 cols) + Live Preview (5 cols) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- Colonne Champs Principaux (7 cols) -->
          <div class="lg:col-span-7 space-y-3 text-xs">
            
            <!-- Nom de l'orbe -->
            <div>
              <label for="comm-orb-name" class="block font-bold text-slate-200 mb-1">
                ${window.t ? window.t('comm_field_orb_name', 'Nom de l\'orbe *') : 'Nom de l\'orbe *'}
              </label>
              <input type="text" id="comm-orb-name" required value="${escapeHtml(existing?.name || '')}"
                     placeholder="${t('comm_ph_orb_name', 'Ex: Fire Orb, Cost Orb, Death Orb...')}"
                     class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                     oninput="CommunityUI.updateLiveOrbPreview()">
            </div>

            <!-- Effet / Bonus Statistique -->
            <div>
              <label for="comm-orb-effect" class="block font-bold text-slate-200 mb-1">
                ${window.t ? window.t('comm_field_orb_effect', 'Effet / Bonus Statistique *') : 'Effet / Bonus Statistique *'}
              </label>
              <textarea id="comm-orb-effect" required rows="2"
                        placeholder="${t('comm_ph_orb_effect', 'Ex: +15% Portée & +10% Dégâts sur tous les paliers...')}"
                        class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                        oninput="CommunityUI.updateLiveOrbPreview()">${escapeHtml(existing?.effect || '')}</textarea>
            </div>

            <!-- Compatibilité & Obtention -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="comm-orb-require" class="block font-bold text-slate-200">
                    ${window.t ? window.t('comm_field_orb_require', 'Compatibilité (Condition requise)') : 'Compatibilité (Condition requise)'}
                  </label>
                  <span class="text-[10px] text-slate-400">Optionnel</span>
                </div>
                <input type="text" id="comm-orb-require"
                       value="${escapeHtml(currentRequire)}"
                       placeholder="Ex: All units, Goku, 6 Star Units..."
                       class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                       oninput="CommunityUI.updateLiveOrbPreview()">

                <!-- Suggestions rapides en 1 clic sans blocage -->
                <div class="mt-1.5 space-y-1.5">
                  <div class="flex flex-wrap items-center gap-1 text-[11px]">
                    <span class="text-[10px] text-slate-500 font-semibold mr-0.5">Suggestions :</span>
                    <button type="button" onclick="CommunityUI.fillOrbRequire('All units')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-[10px] tap-scale transition-colors">${t('comm_orb_require_all', 'Toutes')}</button>
                    <button type="button" onclick="CommunityUI.fillOrbRequire('6 Star Units')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-[10px] tap-scale transition-colors">6★</button>
                    <button type="button" onclick="CommunityUI.fillOrbRequire('7 Star Units')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-[10px] tap-scale transition-colors">7★</button>
                    <button type="button" onclick="CommunityUI.fillOrbRequire('Ground Units')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-[10px] tap-scale transition-colors">${t('comm_orb_require_ground', 'Sol')}</button>
                    <button type="button" onclick="CommunityUI.fillOrbRequire('Air Units')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-[10px] tap-scale transition-colors">${t('comm_orb_require_air', 'Air')}</button>
                    <button type="button" onclick="CommunityUI.fillOrbRequire('Hill Units')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-[10px] tap-scale transition-colors">${t('comm_orb_require_hill', 'Colline')}</button>
                  </div>

                  <!-- Sélecteur de conditions existantes pour aide -->
                  <div class="pt-0.5">
                    <select onchange="if(this.value){ CommunityUI.fillOrbRequire(this.value); this.value=''; }"
                            class="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer">
                      <option value="">-- Ou choisir une condition d'orbe existant --</option>
                      ${orbUniqueRequires.length > 0 ? `
                        <optgroup label="${t('comm_orb_custom_req_opt', 'Conditions Spécifiques')}">
                          ${orbUniqueRequires.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
                        </optgroup>
                      ` : ''}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label for="comm-orb-obtain" class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_orb_obtain', 'Méthode d\'Obtention') : 'Méthode d\'Obtention'}
                </label>
                <input type="text" id="comm-orb-obtain" value="${escapeHtml(currentObtain)}"
                       placeholder="Ex: Trial 1, Extreme Raid, Crafting..."
                       class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                       oninput="CommunityUI.updateLiveOrbPreview()">
              </div>
            </div>

            <!-- Illustration / Image de l'Orbe -->
            <div class="space-y-2 p-3 rounded-xl bg-[#070b14] border border-slate-800">
              <label class="block font-bold text-slate-200">
                ${window.t ? window.t('comm_field_orb_image', 'Illustration de l\'Orbe (Fichier local ou URL)') : 'Illustration de l\'Orbe (Fichier local ou URL)'}
              </label>

              <!-- Option 1 : Téléversement local -->
              <div class="flex items-center gap-2">
                <label for="comm-orb-file-input"
                       class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold tap-scale transition-colors">
                  <i data-lucide="upload" class="w-3.5 h-3.5 text-cyan-400"></i>
                  <span>${window.t ? window.t('comm_btn_upload_pc', 'Choisir une image sur mon PC...') : 'Choisir une image sur mon PC...'}</span>
                </label>
                <input type="file" id="comm-orb-file-input" accept="image/png, image/jpeg, image/webp" class="hidden"
                       onchange="CommunityUI.handleOrbImageFileUpload(this.files[0])">
                <span class="text-[10px] text-slate-400 font-medium">PNG, JPG, WebP (auto-redimensionné)</span>
              </div>

              <!-- Prévisualisation du fichier local s'il existe -->
              <div id="comm-orb-img-preview-wrap"></div>

              <!-- Option 2 : URL d'image externe -->
              <div class="pt-1">
                <span class="block text-[10px] text-slate-400 font-semibold mb-1">
                  ${window.t ? window.t('comm_or_image_url', '...ou collez directement un lien d\'image Web (URL) :') : '...ou collez directement un lien d\'image Web (URL) :'}
                </span>
                <input type="url" id="comm-orb-image" value="${(!currentUploadedOrbImageDataUrl && existing?.image) ? escapeHtml(existing.image) : ''}"
                       placeholder="https://static.wikia.nocookie.net/... ou lien .png/.jpg"
                       class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono-num"
                       oninput="CommunityUI.onOrbImageUrlInput()">
              </div>
            </div>

          </div>

          <!-- Colonne Prévisualisation en direct (5 cols) -->
          <div class="lg:col-span-5 flex flex-col items-center justify-start space-y-3 bg-[#070b14] p-4 rounded-xl border border-slate-800/80">
            <div class="w-full flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span class="font-bold text-cyan-400 flex items-center gap-1">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                <span>${window.t ? window.t('comm_preview_live_title', 'Aperçu en Direct') : 'Aperçu en Direct'}</span>
              </span>
              <span class="text-[10px] text-slate-400 uppercase font-bold">Rendu de la Carte</span>
            </div>

            <!-- Conteneur Carte Preview -->
            <div id="live-preview-orb-card" class="w-full max-w-xs"></div>
            
            <p class="text-[10px] text-slate-500 text-center leading-normal">
              ${window.t ? window.t('comm_orb_preview_note', 'Cette carte est mise à jour instantanément à chaque frappe de clavier.') : 'Cette carte est mise à jour instantanément à chaque frappe de clavier.'}
            </p>
          </div>

        </div>

        <!-- Boutons d'Action -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()"
                  class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button type="submit" id="comm-orb-submit-btn" onclick="event.preventDefault(); CommunityUI.submitOrbForm();"
                    class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 tap-scale shadow-sm">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>${window.t ? window.t('comm_btn_save_orb_local', 'Enregistrer Localement') : 'Enregistrer Localement'}</span>
            </button>
            <button type="button" id="comm-orb-github-btn" onclick="CommunityUI.submitAndProposeOrbToGitHub();"
                    class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 tap-scale shadow-sm"
                    title="${window.t ? window.t('comm_btn_propose_orb_github_tip', 'Enregistrer puis proposer l\'orbe sur GitHub pour le wiki officiel') : 'Enregistrer puis proposer l\'orbe sur GitHub pour le wiki officiel'}">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>${window.t ? window.t('comm_btn_propose_orb_github', 'Enregistrer & Proposer au Wiki Officiel') : 'Enregistrer & Proposer au Wiki Officiel'}</span>
            </button>
          </div>
        </div>

      </form>
    `;

    renderOrbImagePreviewWidget();
    updateLiveOrbPreview();
    const modal = document.getElementById('community-modal');
    if (window.safeCreateIcons) safeCreateIcons(modal);
    else if (window.lucide) lucide.createIcons(modal ? { root: modal } : undefined);
  }

  function handleOrbImageFileUpload(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(window.t ? window.t('comm_invalid_img_file', 'Veuillez sélectionner un fichier image valide (.png, .jpg, .webp).') : 'Veuillez sélectionner un fichier image valide (.png, .jpg, .webp).');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = function() {
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        currentUploadedOrbImageDataUrl = canvas.toDataURL('image/png');
        currentUploadedOrbImageName = file.name;

        const urlInput = document.getElementById('comm-orb-image');
        if (urlInput) urlInput.value = '';

        renderOrbImagePreviewWidget();
        updateLiveOrbPreview();
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeUploadedOrbImage() {
    currentUploadedOrbImageDataUrl = null;
    currentUploadedOrbImageName = '';
    const fileInput = document.getElementById('comm-orb-file-input');
    if (fileInput) fileInput.value = '';
    renderOrbImagePreviewWidget();
    updateLiveOrbPreview();
  }

  function onOrbImageUrlInput() {
    const urlInput = document.getElementById('comm-orb-image');
    if (urlInput && urlInput.value.trim()) {
      currentUploadedOrbImageDataUrl = null;
      currentUploadedOrbImageName = '';
      const fileInput = document.getElementById('comm-orb-file-input');
      if (fileInput) fileInput.value = '';
      renderOrbImagePreviewWidget();
    }
    updateLiveOrbPreview();
  }

  function renderOrbImagePreviewWidget() {
    const previewWrap = document.getElementById('comm-orb-img-preview-wrap');
    if (!previewWrap) return;

    if (currentUploadedOrbImageDataUrl) {
      previewWrap.innerHTML = `
        <div class="flex items-center gap-2.5 p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/40 mt-1">
          <img src="${currentUploadedOrbImageDataUrl}" class="w-10 h-10 rounded object-contain bg-slate-900 border border-slate-700 shrink-0 p-0.5" alt="Aperçu orbe importé">
          <div class="min-w-0 flex-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase">
              <i data-lucide="check-circle" class="w-3 h-3 text-cyan-400"></i>
              ${window.t ? window.t('comm_img_from_pc_loaded', 'Fichier PC importé') : 'Fichier PC importé'}
            </span>
            <div class="text-xs font-semibold text-white truncate">${escapeHtml(currentUploadedOrbImageName || 'orb_image.png')}</div>
          </div>
          <button type="button" onclick="CommunityUI.removeUploadedOrbImage()"
                  class="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-semibold text-[11px] tap-scale flex items-center gap-1 shrink-0"
                  title="${window.t ? window.t('comm_img_remove', 'Retirer cette image') : 'Retirer cette image'}">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
            <span>${window.t ? window.t('delete', 'Retirer') : 'Retirer'}</span>
          </button>
        </div>
      `;
    } else {
      previewWrap.innerHTML = '';
    }

    if (window.safeCreateIcons) safeCreateIcons(previewWrap);
    else if (window.lucide) lucide.createIcons(previewWrap ? { root: previewWrap } : undefined);
  }

  function fillOrbRequire(val) {
    const input = document.getElementById('comm-orb-require');
    if (input) {
      input.value = val;
      input.focus();
      updateLiveOrbPreview();
    }
  }

  function onOrbModalSwitchTarget(val) {
    if (!val || val === '__NEW__') {
      openOrbModalForAdd();
    } else {
      openOrbModalForEdit(decodeURIComponent(val));
    }
  }

  function onOrbRequireSelectChange(val) {
    fillOrbRequire(val);
  }

  function onOrbRequireCustomInput(val) {
    fillOrbRequire(val);
  }

  function updateLiveOrbPreview() {
    const previewContainer = document.getElementById('live-preview-orb-card');
    if (!previewContainer) return;

    const name = document.getElementById('comm-orb-name')?.value?.trim() || '(Nom de l\'Orbe)';
    const effect = document.getElementById('comm-orb-effect')?.value?.trim() || '(Effet / Bonus à définir)';
    const rawRequire = document.getElementById('comm-orb-require')?.value?.trim();
    const rawObtain = document.getElementById('comm-orb-obtain')?.value?.trim();
    const obtain = rawObtain || 'Non spécifié';
    const inputUrl = document.getElementById('comm-orb-image')?.value?.trim();
    const fallbackImg = 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
    const image = currentUploadedOrbImageDataUrl || inputUrl || fallbackImg;

    const isUniversal = !rawRequire || /toutes les unit|all units/i.test(rawRequire);
    const requireText = !rawRequire ? '★ Toutes les unités (par défaut)' : (isUniversal ? (window.t ? window.t('all_units_badge', '★ Toutes les unités') : '★ Toutes les unités') : rawRequire);

    previewContainer.innerHTML = `
      <div class="tactical-card rounded-xl p-4 border border-cyan-500/40 bg-[#0f1629]/95 flex flex-col justify-between space-y-3 shadow-lg">
        <div>
          <div class="flex items-center space-x-3 mb-2.5">
            <div class="w-10 h-10 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center shrink-0">
              <img src="${image}" alt="${escapeHtml(name)}" width="40" height="40" loading="lazy" decoding="async" class="max-h-full max-w-full object-contain img-outline rounded"
                   onerror="this.src='${fallbackImg}'">
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
              <h4 class="font-bold text-xs text-white truncate">${escapeHtml(name)}</h4>
            </div>
            <span class="text-[10px] font-semibold ${isUniversal ? 'text-sky-300' : 'text-slate-400'}">
              ${escapeHtml(requireText)}
            </span>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 block text-[10px] uppercase font-sans">
              ${window.t ? window.t('stat_bonus_label', 'Bonus statistique :') : 'Bonus statistique :'}
            </strong>
            <span class="text-slate-100 font-medium font-mono-num text-[11px]">${escapeHtml(effect)}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">${window.t ? window.t('obtain_label', 'Obtention :') : 'Obtention :'}</strong> ${escapeHtml(obtain)}
          </div>
          ${!isUniversal ? `
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">${window.t ? window.t('compatible_label', 'Compatible :') : 'Compatible :'}</strong> <span class="text-sky-300">${escapeHtml(rawRequire)}</span>
          </div>` : ''}
        </div>
      </div>

      <div class="flex items-center justify-end pt-2 border-t border-slate-800/80 text-[11px]">
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
          ${window.t ? window.t('comm_preview_badge', 'Aperçu Direct') : 'Aperçu Direct'}
        </span>
      </div>
    </div>
    `;
  }

  async function submitOrbForm() {
    const name = document.getElementById('comm-orb-name')?.value?.trim();
    if (!name) {
      alert(window.t ? window.t('comm_orb_name_required', 'Le nom de l\'orbe est obligatoire.') : 'Le nom de l\'orbe est obligatoire.');
      return;
    }

    const effect = document.getElementById('comm-orb-effect')?.value?.trim();
    if (!effect) {
      alert(window.t ? window.t('comm_orb_effect_required', 'L\'effet de l\'orbe est obligatoire.') : 'L\'effet de l\'orbe est obligatoire.');
      return;
    }

    const require = document.getElementById('comm-orb-require')?.value?.trim() || 'All units';
    const obtain = document.getElementById('comm-orb-obtain')?.value?.trim() || '';
    const inputUrl = document.getElementById('comm-orb-image')?.value?.trim();
    const finalImage = currentUploadedOrbImageDataUrl || inputUrl || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';

    const orbData = {
      name: name,
      effect: effect,
      require: require,
      obtain: obtain,
      image: finalImage,
      _original_name: editingOrbName || undefined
    };

    const success = await CommunityManager.saveOrb(orbData);
    if (success) {
      closeModal();
    }
  }

  async function submitAndProposeOrbToGitHub() {
    const name = document.getElementById('comm-orb-name')?.value?.trim();
    if (!name) {
      alert(window.t ? window.t('comm_orb_name_required', 'Le nom de l\'orbe est obligatoire.') : 'Le nom de l\'orbe est obligatoire.');
      return;
    }

    const effect = document.getElementById('comm-orb-effect')?.value?.trim();
    if (!effect) {
      alert(window.t ? window.t('comm_orb_effect_required', 'L\'effet de l\'orbe est obligatoire.') : 'L\'effet de l\'orbe est obligatoire.');
      return;
    }

    const require = document.getElementById('comm-orb-require')?.value?.trim() || 'All units';
    const obtain = document.getElementById('comm-orb-obtain')?.value?.trim() || '';
    const inputUrl = document.getElementById('comm-orb-image')?.value?.trim();
    const finalImage = currentUploadedOrbImageDataUrl || inputUrl || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';

    const orbData = {
      name: name,
      effect: effect,
      require: require,
      obtain: obtain,
      image: finalImage,
      _original_name: editingOrbName || undefined
    };

    const success = await CommunityManager.saveOrb(orbData);
    if (success) {
      closeModal();
      const issueUrl = CommunityManager.generateGitHubIssueURL('orb', orbData);
      window.open(issueUrl, '_blank', 'noopener,noreferrer');
      if (window.showToast) {
        window.showToast(window.t ? window.t('comm_github_opened', 'Page GitHub ouverte ! Soumettez l\'issue pour l\'intégration automatique.') : 'Page GitHub ouverte ! Soumettez l\'issue pour l\'intégration automatique.');
      }
    }
  }

  // --- GESTION ET ÉDITION DES TIER LISTS ---

  function toggleTierListEditMode(forceState) {
    if (forceState !== undefined) {
      isTierListEditMode = !!forceState;
    } else {
      isTierListEditMode = !isTierListEditMode;
    }

    const editBtn = document.getElementById('tierlist-toggle-edit-btn');
    const editBtnText = document.getElementById('tierlist-edit-btn-text');
    const addCatBtn = document.getElementById('tierlist-add-cat-btn');
    const editBanner = document.getElementById('tierlist-edit-banner');

    if (editBtn && editBtnText) {
      if (isTierListEditMode) {
        editBtn.className = 'tier-action-btn px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 border border-sky-400';
        editBtnText.textContent = window.t ? window.t('tierlist_btn_edit_active', 'Mode Lecture') : 'Mode Lecture';
      } else {
        editBtn.className = 'tier-action-btn px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0';
        editBtnText.textContent = window.t ? window.t('tierlist_btn_edit', 'Modifier la Tier List') : 'Modifier la Tier List';
      }
    }

    if (addCatBtn) {
      addCatBtn.classList.toggle('hidden', !isTierListEditMode);
    }
    if (editBanner) {
      editBanner.classList.toggle('hidden', !isTierListEditMode);
    }

    if (window.renderTierList) {
      window.renderTierList();
    }
  }

  function isEditMode() {
    return isTierListEditMode;
  }

  const _debouncedTierListSearch = (typeof debounce === 'function' ? debounce : (fn) => fn)(function(query) {
    tierListSearchQuery = (query || '').trim();
    if (window.renderTierList) {
      window.renderTierList();
    }
  }, 150);

  function onTierListSearch(query) {
    if (!query) {
      tierListSearchQuery = '';
      if (window.renderTierList) window.renderTierList();
    } else {
      _debouncedTierListSearch(query);
    }
  }

  function getTierListSearchQuery() {
    return tierListSearchQuery;
  }

  let currentTargetTierCategory = '';
  let currentAddUnitFilterStar = 'all';

  function openAddUnitToTierModal(targetCategory) {
    currentTargetTierCategory = targetCategory;
    currentAddUnitFilterStar = 'all';

    const modalTitle = `${window.t ? window.t('tierlist_cat_add_unit', '+ Ajouter une unité à :') : '+ Ajouter une unité à :'} ${targetCategory}`;

    const modalBody = `
      <div class="space-y-4">
        <!-- Recherche et filtres rareté -->
        <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div class="relative flex-1">
            <input type="text" id="tier-unit-search-input"
                   oninput="CommunityUI.renderAddUnitList(this.value)"
                   placeholder="${window.t ? window.t('search_placeholder', 'Rechercher par nom d\'unité ou anime...') : 'Rechercher par nom d\'unité ou anime...'}"
                   class="w-full bg-[#070b14] border border-slate-700 rounded-lg ps-8 pe-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-500 absolute start-2.5 top-2.5" stroke-width="2"></i>
          </div>
          <div class="flex items-center gap-1 overflow-x-auto py-0.5 shrink-0" id="tier-unit-rarity-filters">
            <button type="button" onclick="CommunityUI.setAddUnitStarFilter('all', this)" class="px-2 py-1 rounded text-[11px] font-bold bg-sky-500 text-white shadow-sm shrink-0">${t('tierlist_filter_all', 'Tous')}</button>
            <button type="button" onclick="CommunityUI.setAddUnitStarFilter('7', this)" class="px-2 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0">7★</button>
            <button type="button" onclick="CommunityUI.setAddUnitStarFilter('6', this)" class="px-2 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0">6★</button>
            <button type="button" onclick="CommunityUI.setAddUnitStarFilter('5', this)" class="px-2 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0">5★</button>
            <button type="button" onclick="CommunityUI.setAddUnitStarFilter('4', this)" class="px-2 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0">4★</button>
          </div>
        </div>

        <!-- Liste des unités -->
        <div id="tier-unit-selector-grid" class="max-h-[380px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-1 border border-slate-800 rounded-xl bg-[#090e1c]/80">
        </div>

        <!-- Pied de modale -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span class="text-slate-400 font-mono-num" id="tier-unit-selector-count">0 unités</span>
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            ${window.t ? window.t('cancel', 'Fermer') : 'Fermer'}
          </button>
        </div>
      </div>
    `;

    showCustomModalContent(modalTitle, modalBody);
    renderAddUnitList('', true);
  }

  function setAddUnitStarFilter(star, btnEl) {
    currentAddUnitFilterStar = star;
    const container = document.getElementById('tier-unit-rarity-filters');
    if (container) {
      const btns = container.querySelectorAll('button');
      btns.forEach(b => {
        b.className = 'px-2 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0';
      });
      if (btnEl) btnEl.className = 'px-2 py-1 rounded text-[11px] font-bold bg-sky-500 text-white shadow-sm shrink-0';
    }
    const searchVal = document.getElementById('tier-unit-search-input')?.value || '';
    renderAddUnitList(searchVal, true);
  }

  const _debouncedRenderAddUnitList = (typeof debounce === 'function' ? debounce : (fn) => fn)(_doRenderAddUnitList, 150);

  function renderAddUnitList(query, immediate = false) {
    if (immediate || !query) {
      _doRenderAddUnitList(query);
    } else {
      _debouncedRenderAddUnitList(query);
    }
  }

  function _doRenderAddUnitList(query) {
    const grid = document.getElementById('tier-unit-selector-grid');
    const countEl = document.getElementById('tier-unit-selector-count');
    if (!grid) return;

    const allUnits = window.ALL_UNITS || (window.getGlobalUnits ? window.getGlobalUnits() : []);
    const q = (query || '').toLowerCase().trim();
    const existingInCat = (window.TIERLIST_DATA[currentTargetTierCategory] || []).map(n => (n || '').toLowerCase());

    const filtered = allUnits.filter(u => {
      if (currentAddUnitFilterStar !== 'all' && String(u.star || '') !== currentAddUnitFilterStar) {
        return false;
      }
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || (u.anime_origin || '').toLowerCase().includes(q);
    });

    if (countEl) countEl.textContent = `${t('tierlist_units_found', '{count} unité(s) trouvée(s)').replace('{count}', filtered.length)}`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-8 text-center text-slate-500 text-xs italic">
          Aucune unité ne correspond à ces critères.
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.slice(0, 120).map(u => {
      const isAlreadyAdded = existingInCat.includes((u.name || '').toLowerCase());
      const thumb = window.tierThumbUrl ? window.tierThumbUrl(u) : u.image;
      const escapeUName = (u.name || '').replace(/'/g, "\\'");

      return `
        <button type="button"
                onclick="${isAlreadyAdded ? `if(window.showToast) window.showToast(t('tierlist_already_in_cat', 'Cette unité est déjà dans cette catégorie'));` : `CommunityUI.addUnitToTier('${currentTargetTierCategory.replace(/'/g, "\\'")}', '${escapeUName}')`}"
                class="p-2 rounded-xl border text-left flex items-center gap-2 tap-scale transition-all ${isAlreadyAdded ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed' : 'bg-[#0e162a] hover:bg-sky-600/20 border-slate-800 hover:border-sky-500/50 group'}">
          <div class="w-10 h-10 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            <img src="${thumb || ''}" alt="${escapeHtml(u.name)}" width="40" height="40" loading="lazy" decoding="async"
                 onerror="this.style.display='none'"
                 class="max-h-full max-w-full object-contain">
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-mono-num font-bold px-1 rounded star-${u.star || 6}-badge">${u.star || 6}★</span>
              <span class="text-[11px] font-bold text-white truncate block group-hover:text-sky-300" title="${escapeHtml(u.name)}">${escapeHtml(u.name)}</span>
            </div>
            <span class="text-[9px] text-slate-400 truncate block mt-0.5">${escapeHtml(u.anime_origin || 'ASTD')}</span>
          </div>
          ${isAlreadyAdded ? `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>` : `<i data-lucide="plus" class="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0"></i>`}
        </button>
      `;
    }).join('');

    if (window.safeCreateIcons) safeCreateIcons(grid);
    else if (window.lucide) lucide.createIcons(grid ? { root: grid } : undefined);
  }

  function addUnitToTier(categoryName, unitName) {
    if (!categoryName || !unitName) return;
    if (!window.TIERLIST_DATA[categoryName]) {
      window.TIERLIST_DATA[categoryName] = [];
    }
    const exists = window.TIERLIST_DATA[categoryName].some(n => n.toLowerCase() === unitName.toLowerCase());
    if (exists) {
      if (window.showToast) window.showToast(`L'unité ${unitName} est déjà dans ${categoryName}.`);
      return;
    }
    window.TIERLIST_DATA[categoryName].push(unitName);
    CommunityManager.saveTierList(window.TIERLIST_DATA);
    closeModal();
    if (window.showToast) window.showToast(t('tierlist_unit_added_toast', 'Unité {name} ajoutée à {cat} !').replace('{name}', unitName).replace('{cat}', categoryName));
  }

  function removeUnitFromTier(categoryName, unitName) {
    if (!categoryName || !unitName || !window.TIERLIST_DATA[categoryName]) return;
    window.TIERLIST_DATA[categoryName] = window.TIERLIST_DATA[categoryName].filter(n => n.toLowerCase() !== unitName.toLowerCase());
    CommunityManager.saveTierList(window.TIERLIST_DATA);
    if (window.showToast) window.showToast(t('tierlist_unit_removed_toast', 'Unité {name} retirée de {cat}.').replace('{name}', unitName).replace('{cat}', categoryName));
  }

  function openAddTierCategoryModal() {
    const modalTitle = window.t ? window.t('tierlist_btn_add_cat_title', 'Créer une nouvelle catégorie méta') : 'Créer une nouvelle catégorie méta';
    const suggestions = ['S+ (Transcendant)', 'S (Meta Absolue)', 'A (Haut Niveau)', 'B (Viable)', 'C (Situationnel)', 'D (Dépassé)', 'GOD TIER', 'MÉTA DONJONS', 'MÉTA RAIDS', 'SUPPORT ELITE', 'FARMING PRO'];

    const modalBody = `
      <form id="comm-add-cat-form" onsubmit="event.preventDefault(); CommunityUI.submitAddTierCategory();" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-200 mb-1.5">Nom de la Catégorie :</label>
          <input type="text" id="comm-new-cat-name" required placeholder="${t('tierlist_new_cat_ph', 'Ex: S+ (Transcendant), GOD TIER, Méta Donjons...')}"
                 class="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
        </div>

        <div>
          <label class="block text-slate-400 mb-1.5">Suggestions rapides en 1 clic :</label>
          <div class="flex flex-wrap gap-1.5">
            ${suggestions.map(s => `
              <button type="button" onclick="document.getElementById('comm-new-cat-name').value='${s.replace(/'/g, "\\'")}'"
                      class="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-sky-300 tap-scale transition-colors">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1.5">Position :</label>
          <select id="comm-new-cat-pos" class="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            <option value="top">Au tout début de la Tier List (En haut)</option>
            <option value="bottom" selected>À la fin de la Tier List (En bas)</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 tap-scale shadow-sm">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Créer la Catégorie</span>
          </button>
        </div>
      </form>
    `;

    showCustomModalContent(modalTitle, modalBody);
  }

  function submitAddTierCategory() {
    const nameInput = document.getElementById('comm-new-cat-name');
    const posInput = document.getElementById('comm-new-cat-pos');
    const catName = (nameInput?.value || '').trim();
    if (!catName) return;

    if (window.TIERLIST_DATA[catName]) {
      alert(t('tierlist_cat_exists', 'La catégorie "{name}" existe déjà dans cette Tier List.').replace('{name}', catName));
      return;
    }

    const pos = posInput?.value || 'bottom';
    if (pos === 'top') {
      const reordered = { [catName]: [] };
      Object.entries(window.TIERLIST_DATA).forEach(([k, v]) => {
        reordered[k] = v;
      });
      window.TIERLIST_DATA = reordered;
    } else {
      window.TIERLIST_DATA[catName] = [];
    }

    CommunityManager.saveTierList(window.TIERLIST_DATA);
    closeModal();
    if (window.showToast) window.showToast(t('tierlist_cat_created_toast', 'Catégorie "{name}" créée avec succès !').replace('{name}', catName));
  }

  function openRenameTierCategoryModal(oldName) {
    const modalTitle = `${t('tierlist_rename_cat_title', 'Renommer la catégorie : {name}').replace('{name}', oldName)}`;
    const modalBody = `
      <form id="comm-rename-cat-form" onsubmit="event.preventDefault(); CommunityUI.submitRenameTierCategory('${oldName.replace(/'/g, "\\'")}');" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-200 mb-1.5">Nouveau nom de catégorie :</label>
          <input type="text" id="comm-rename-cat-input" required value="${escapeHtml(oldName)}"
                 class="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            Annuler
          </button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 tap-scale shadow-sm">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Enregistrer le Nom</span>
          </button>
        </div>
      </form>
    `;
    showCustomModalContent(modalTitle, modalBody);
  }

  function submitRenameTierCategory(oldName) {
    const newName = (document.getElementById('comm-rename-cat-input')?.value || '').trim();
    if (!newName || newName === oldName) {
      closeModal();
      return;
    }

    if (window.TIERLIST_DATA[newName]) {
      alert(t('tierlist_cat_rename_exists', 'Une catégorie intitulée "{name}" existe déjà.').replace('{name}', newName));
      return;
    }

    const reordered = {};
    Object.entries(window.TIERLIST_DATA).forEach(([k, v]) => {
      if (k === oldName) {
        reordered[newName] = v;
      } else {
        reordered[k] = v;
      }
    });
    window.TIERLIST_DATA = reordered;

    CommunityManager.saveTierList(window.TIERLIST_DATA);
    closeModal();
    if (window.showToast) window.showToast(t('tierlist_cat_renamed_toast', 'Catégorie renommée en "{name}" !').replace('{name}', newName));
  }

  function deleteTierCategory(categoryName) {
    if (!categoryName || !window.TIERLIST_DATA[categoryName]) return;
    const count = (window.TIERLIST_DATA[categoryName] || []).length;
    const confirmMsg = `Supprimer la catégorie "${categoryName}" (${count} unité(s)) ?`;
    if (!confirm(confirmMsg)) return;

    delete window.TIERLIST_DATA[categoryName];
    CommunityManager.saveTierList(window.TIERLIST_DATA);
    if (window.showToast) window.showToast(t('tierlist_cat_deleted_toast', 'Catégorie "{name}" supprimée.').replace('{name}', categoryName));
  }

  function moveTierCategory(categoryName, direction) {
    const keys = Object.keys(window.TIERLIST_DATA);
    const idx = keys.indexOf(categoryName);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= keys.length) return;

    keys.splice(idx, 1);
    keys.splice(newIdx, 0, categoryName);

    const reordered = {};
    keys.forEach(k => {
      reordered[k] = window.TIERLIST_DATA[k];
    });
    window.TIERLIST_DATA = reordered;

    CommunityManager.saveTierList(window.TIERLIST_DATA);
  }

  function openMoveUnitModal(sourceCat, unitName) {
    const categories = Object.keys(window.TIERLIST_DATA).filter(c => c !== sourceCat);
    if (categories.length === 0) {
      alert("Aucune autre catégorie disponible.");
      return;
    }

    const modalTitle = `${t('tierlist_move_unit_title', 'Déplacer "{name}" vers une autre catégorie').replace('{name}', unitName)}`;
    const modalBody = `
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-200 mb-1.5">Catégorie cible :</label>
          <select id="select-target-cat" class="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            ${categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            Annuler
          </button>
          <button type="button" onclick="const target = document.getElementById('select-target-cat').value; CommunityUI.moveUnitToCategory('${sourceCat.replace(/'/g, "\\'")}', target, '${unitName.replace(/'/g, "\\'")}');" class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 tap-scale shadow-sm">
            <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
            <span>Déplacer</span>
          </button>
        </div>
      </div>
    `;
    showCustomModalContent(modalTitle, modalBody);
  }

  function moveUnitToCategory(sourceCat, targetCat, unitName) {
    if (!sourceCat || !targetCat || !unitName) return;
    if (window.TIERLIST_DATA[sourceCat]) {
      window.TIERLIST_DATA[sourceCat] = window.TIERLIST_DATA[sourceCat].filter(n => n.toLowerCase() !== unitName.toLowerCase());
    }
    if (!window.TIERLIST_DATA[targetCat]) {
      window.TIERLIST_DATA[targetCat] = [];
    }
    if (!window.TIERLIST_DATA[targetCat].some(n => n.toLowerCase() === unitName.toLowerCase())) {
      window.TIERLIST_DATA[targetCat].push(unitName);
    }
    CommunityManager.saveTierList(window.TIERLIST_DATA);
    closeModal();
    if (window.showToast) window.showToast(t('tierlist_unit_moved_toast', '"{name}" déplacé de {src} vers {target} !').replace('{name}', unitName).replace('{src}', sourceCat).replace('{target}', targetCat));
  }

  function openManageUnitInTierModal(unitName) {
    const categories = Object.keys(window.TIERLIST_DATA);
    const unitMatch = (window.ALL_UNITS || []).find(u => u.name.toLowerCase() === unitName.toLowerCase());
    const star = unitMatch ? unitMatch.star : 6;
    const thumb = unitMatch ? (window.tierThumbUrl ? window.tierThumbUrl(unitMatch) : unitMatch.image) : '';

    const modalTitle = `${t('tierlist_manage_unit_title', 'Gérer "{name}" dans les Tier Lists').replace('{name}', unitName)}`;
    const modalBody = `
      <div class="space-y-4 text-xs">
        <!-- Résumé unité -->
        <div class="p-3 rounded-xl bg-[#090e1c] border border-slate-800 flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            <img src="${thumb || ''}" alt="${escapeHtml(unitName)}" width="48" height="48" loading="lazy" decoding="async" class="max-h-full max-w-full object-contain">
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono-num font-bold px-1.5 rounded star-${star}-badge">${star}★</span>
              <strong class="text-sm font-bold text-white">${escapeHtml(unitName)}</strong>
            </div>
            <span class="text-[11px] text-slate-400 mt-0.5 block">${escapeHtml(unitMatch?.anime_origin || 'ASTD')}</span>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-2">Cochez les catégories dans lesquelles classer cette unité :</label>
          <div class="max-h-[300px] overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-800 bg-[#070b14]">
            ${categories.map(cat => {
              const isChecked = (window.TIERLIST_DATA[cat] || []).some(n => n.toLowerCase() === unitName.toLowerCase());
              const count = (window.TIERLIST_DATA[cat] || []).length;
              return `
                <label class="flex items-center justify-between p-2 rounded-lg bg-[#0d1424] hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer tap-scale transition-colors">
                  <div class="flex items-center gap-2.5">
                    <input type="checkbox" data-category="${escapeHtml(cat)}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer">
                    <span class="font-semibold text-slate-200">${escapeHtml(cat)}</span>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono-num">${count} unité(s)</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold tap-scale">
            Annuler
          </button>
          <button type="button" onclick="CommunityUI.submitManageUnitInTier('${unitName.replace(/'/g, "\\'")}')" class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 tap-scale shadow-sm">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Enregistrer les Catégories</span>
          </button>
        </div>
      </div>
    `;

    showCustomModalContent(modalTitle, modalBody);
  }

  function submitManageUnitInTier(unitName) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-category]');
    checkboxes.forEach(cb => {
      const cat = cb.getAttribute('data-category');
      if (!cat) return;
      if (!window.TIERLIST_DATA[cat]) window.TIERLIST_DATA[cat] = [];

      const exists = window.TIERLIST_DATA[cat].some(n => n.toLowerCase() === unitName.toLowerCase());
      if (cb.checked && !exists) {
        window.TIERLIST_DATA[cat].push(unitName);
      } else if (!cb.checked && exists) {
        window.TIERLIST_DATA[cat] = window.TIERLIST_DATA[cat].filter(n => n.toLowerCase() !== unitName.toLowerCase());
      }
    });

    CommunityManager.saveTierList(window.TIERLIST_DATA);
    closeModal();
    if (window.showToast) window.showToast(t('tierlist_unit_cats_updated', 'Catégories de "{name}" mises à jour !').replace('{name}', unitName));
  }

  // --- HANDLERS DRAG & DROP AVEC INDICATEUR VISUEL D'INSERTION DYNAMIQUE ---

  function getDropIndicator() {
    let indicator = document.getElementById('tier-active-drop-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'tier-active-drop-indicator';
      indicator.className = 'tier-drop-indicator';
      indicator.setAttribute('aria-hidden', 'true');
    }
    return indicator;
  }

  function removeDropIndicator() {
    const indicator = document.getElementById('tier-active-drop-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  function onTierDragStart(event, unitName, sourceCat) {
    const dragTarget = event.currentTarget || event.target;
    draggedTierItem = { unitName, sourceCat, element: dragTarget };
    try {
      event.dataTransfer.setData('text/plain', JSON.stringify({ unitName, sourceCat }));
      event.dataTransfer.effectAllowed = 'move';
    } catch (e) {}
    setTimeout(() => {
      if (dragTarget && dragTarget.classList) {
        dragTarget.classList.add('tier-item-dragging');
      }
    }, 0);
  }

  function onTierDragOver(event) {
    event.preventDefault();
    try {
      event.dataTransfer.dropEffect = 'move';
    } catch (e) {}

    const dropzone = event.currentTarget;
    if (!dropzone) return;

    if (!dropzone.classList.contains('tier-drag-over')) {
      dropzone.classList.add('tier-drag-over');
    }

    const indicator = getDropIndicator();
    const clientX = event.clientX;
    const clientY = event.clientY;

    // Récupérer toutes les cartes d'unités dans cette zone de dépôt, sauf celle en cours de drag
    const cards = Array.from(dropzone.querySelectorAll('.tier-unit-card:not(.tier-item-dragging)'));

    if (cards.length === 0) {
      // Zone vide : insérer l'indicateur en tête de zone
      if (indicator.parentNode !== dropzone || indicator !== dropzone.firstChild) {
        dropzone.insertBefore(indicator, dropzone.firstChild);
      }
      return;
    }

    // Trouver la carte la plus proche du curseur
    let closestCard = null;
    let closestDist = Number.POSITIVE_INFINITY;
    let insertBefore = true;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance géométrique au centre de la carte
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestCard = card;
        // Si le curseur est dans la moitié gauche de la carte, insérer avant ; sinon après
        insertBefore = clientX < centerX;
      }
    }

    if (closestCard) {
      if (insertBefore) {
        if (indicator.nextSibling !== closestCard) {
          dropzone.insertBefore(indicator, closestCard);
        }
      } else {
        const next = closestCard.nextElementSibling;
        const actualNext = (next === indicator) ? indicator.nextElementSibling : next;
        if (indicator.nextSibling !== actualNext) {
          dropzone.insertBefore(indicator, actualNext);
        }
      }
    } else {
      if (indicator.parentNode !== dropzone) {
        dropzone.appendChild(indicator);
      }
    }
  }

  function onTierDragLeave(event) {
    const dropzone = event.currentTarget;
    // Ne nettoyer que si on quitte réellement la zone de dépôt (et pas juste en survolant un enfant ou l'indicateur)
    if (dropzone && (!event.relatedTarget || !dropzone.contains(event.relatedTarget))) {
      dropzone.classList.remove('tier-drag-over');
      const indicator = document.getElementById('tier-active-drop-indicator');
      if (indicator && indicator.parentNode === dropzone) {
        removeDropIndicator();
      }
    }
  }

  function onTierDragEnd(event) {
    document.querySelectorAll('.tier-drag-over').forEach(el => el.classList.remove('tier-drag-over'));
    document.querySelectorAll('.tier-item-dragging').forEach(el => el.classList.remove('tier-item-dragging'));
    removeDropIndicator();
    draggedTierItem = null;
  }

  function onTierDrop(event, targetCat) {
    event.preventDefault();
    document.querySelectorAll('.tier-drag-over').forEach(el => el.classList.remove('tier-drag-over'));
    document.querySelectorAll('.tier-item-dragging').forEach(el => el.classList.remove('tier-item-dragging'));

    const dropzone = event.currentTarget;
    const indicator = document.getElementById('tier-active-drop-indicator');

    let targetIndex = -1;
    if (indicator && dropzone && indicator.parentNode === dropzone) {
      // Compter le nombre de cartes unitaires avant l'indicateur d'insertion
      let count = 0;
      let sibling = indicator.previousElementSibling;
      while (sibling) {
        if (sibling.classList.contains('tier-unit-card') && !sibling.classList.contains('tier-item-dragging')) {
          count++;
        }
        sibling = sibling.previousElementSibling;
      }
      targetIndex = count;
    }

    removeDropIndicator();

    let unitName = null;
    let sourceCat = null;

    if (draggedTierItem) {
      unitName = draggedTierItem.unitName;
      sourceCat = draggedTierItem.sourceCat;
    } else {
      try {
        const raw = event.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          unitName = parsed.unitName;
          sourceCat = parsed.sourceCat;
        }
      } catch (e) {}
    }

    draggedTierItem = null;

    if (!unitName || !targetCat) return;

    // Cas 1 : Réorganisation au sein de la même catégorie
    if (sourceCat && sourceCat === targetCat) {
      const list = window.TIERLIST_DATA[targetCat] || [];
      const currentIdx = list.findIndex(n => n.toLowerCase() === unitName.toLowerCase());
      if (currentIdx !== -1) {
        list.splice(currentIdx, 1);
        if (targetIndex === -1 || targetIndex >= list.length) {
          list.push(unitName);
        } else {
          list.splice(targetIndex, 0, unitName);
        }
        window.TIERLIST_DATA[targetCat] = list;
        CommunityManager.saveTierList(window.TIERLIST_DATA);
        if (window.renderTierList) window.renderTierList();
        if (window.showToast) {
          window.showToast(t('tierlist_pos_updated_toast', 'Position de "{name}" mise à jour dans {target} !').replace('{name}', unitName).replace('{target}', targetCat));
        }
        return;
      }
    }

    // Cas 2 : Déplacement vers une autre catégorie
    if (sourceCat && window.TIERLIST_DATA[sourceCat]) {
      window.TIERLIST_DATA[sourceCat] = window.TIERLIST_DATA[sourceCat].filter(n => n.toLowerCase() !== unitName.toLowerCase());
    }

    if (!window.TIERLIST_DATA[targetCat]) {
      window.TIERLIST_DATA[targetCat] = [];
    }

    // Nettoyer d'éventuels doublons
    window.TIERLIST_DATA[targetCat] = window.TIERLIST_DATA[targetCat].filter(n => n.toLowerCase() !== unitName.toLowerCase());

    if (targetIndex === -1 || targetIndex >= window.TIERLIST_DATA[targetCat].length) {
      window.TIERLIST_DATA[targetCat].push(unitName);
    } else {
      window.TIERLIST_DATA[targetCat].splice(targetIndex, 0, unitName);
    }

    CommunityManager.saveTierList(window.TIERLIST_DATA);
    if (window.renderTierList) window.renderTierList();
    if (window.showToast) {
      window.showToast(t('tierlist_moved_pos_toast', '"{name}" déplacé vers {target} (rang {rank}) !').replace('{name}', unitName).replace('{target}', targetCat).replace('{rank}', targetIndex + 1));
    }
  }

  function onTierListPresetChange(preset) {
    if (preset === 'official') {
      const backup = CommunityManager.getOriginalTierlistBackup();
      if (backup && Object.keys(backup).length > 0) {
        window.TIERLIST_DATA = JSON.parse(JSON.stringify(backup));
        CommunityManager.saveTierList(window.TIERLIST_DATA);
      }
    } else if (preset === 'standard_tiers') {
      const standardTemplate = {
        'S+ (Transcendant)': [],
        'S (Meta Absolue)': [],
        'A (Haut Niveau)': [],
        'B (Solide & Viable)': [],
        'C (Situationnel)': [],
        'D (Obsolète)': []
      };

      const existingUnits = [];
      Object.values(window.TIERLIST_DATA).forEach(list => {
        if (Array.isArray(list)) list.forEach(n => { if (!existingUnits.includes(n)) existingUnits.push(n); });
      });

      if (existingUnits.length > 0) {
        standardTemplate['S+ (Transcendant)'] = existingUnits.slice(0, 5);
        standardTemplate['S (Meta Absolue)'] = existingUnits.slice(5, 12);
        standardTemplate['A (Haut Niveau)'] = existingUnits.slice(12, 22);
        standardTemplate['B (Solide & Viable)'] = existingUnits.slice(22, 35);
      }

      window.TIERLIST_DATA = standardTemplate;
      CommunityManager.saveTierList(window.TIERLIST_DATA);
      if (!isTierListEditMode) {
        toggleTierListEditMode(true);
      }
      if (window.showToast) window.showToast(t('tierlist_preset_standard_toast', 'Modèle Standard (S+ / S / A / B / C / D) activé !'));
    }
  }

  function saveTierList() {
    CommunityManager.saveTierList(window.TIERLIST_DATA);
  }

  function confirmResetTierList() {
    const confirmMsg = window.t ? window.t('tierlist_confirm_reset', 'Voulez-vous vraiment réinitialiser la Tier List à sa version officielle ? Toutes les modifications locales seront effacées.') : 'Voulez-vous vraiment réinitialiser la Tier List à sa version officielle ? Toutes les modifications locales seront effacées.';
    if (!confirm(confirmMsg)) return;

    CommunityManager.resetTierList();
    const selector = document.getElementById('tierlist-preset-selector');
    if (selector) selector.value = 'official';
  }

  function proposeTierListToGitHub() {
    const url = CommunityManager.generateGitHubIssueURL('tierlist', { categories: window.TIERLIST_DATA });
    window.open(url, '_blank');
  }

  function exportTierListJSON() {
    const exportData = {
      app: 'ASTD Database Pro',
      type: 'tierlist',
      version: 1,
      exported_at: new Date().toISOString(),
      categories_count: Object.keys(window.TIERLIST_DATA).length,
      categories: window.TIERLIST_DATA
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astd_tierlist_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast(t('tierlist_export_success', 'Fichier JSON de Tier List exporté avec succès !'));
  }

  function importTierListJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const parsed = JSON.parse(e.target.result);
        const cats = parsed.categories || parsed.tierlist || parsed;
        if (typeof cats !== 'object' || Array.isArray(cats)) {
          throw new Error('Format de fichier invalide (doit contenir un dictionnaire de catégories).');
        }
        window.TIERLIST_DATA = cats;
        CommunityManager.saveTierList(cats);
        if (window.showToast) window.showToast(t('tierlist_import_success', 'Tier List importée avec succès !'));
      } catch (err) {
        alert('Erreur lors de l\'importation de la Tier List : ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  return {
    openUnitModalForAdd,
    openUnitModalForEdit,
    openUnitSelectorForEdit,
    openOrbModalForAdd,
    openOrbModalForEdit,
    openOrbSelectorForEdit,
    filterOrbSelectOptions,
    onOrbModalSwitchTarget,
    fillOrbRequire,
    openCodeModalForAdd,
    openTipModalForUnit,
    openModal,
    closeModal,
    updateLivePreview,
    updateLiveOrbPreview,
    submitUnitForm,
    submitAndProposeToGitHub,
    submitOrbForm,
    submitAndProposeOrbToGitHub,
    submitCodeForm,
    submitTipForm,
    addUpgradeRow,
    removeUpgradeRow,
    onUpgradeChange,
    renderUpgradeRows,
    getCurrentUnitUpgrades: () => currentUnitUpgrades,
    handleImageFileUpload,
    removeUploadedImage,
    onImageUrlInput,
    renderImagePreviewWidget,
    handleOrbImageFileUpload,
    removeUploadedOrbImage,
    onOrbImageUrlInput,
    renderOrbImagePreviewWidget,
    getCurrentUploadedImageDataUrl: () => currentUploadedImageDataUrl,
    getCurrentUploadedOrbImageDataUrl: () => currentUploadedOrbImageDataUrl,
    computeUnitTowerType,
    onTopTowerTypeChange,
    onOrbRequireSelectChange,
    onOrbRequireCustomInput,
    // Méthodes Tier List
    toggleTierListEditMode,
    isEditMode,
    onTierListSearch,
    getTierListSearchQuery,
    openAddUnitToTierModal,
    setAddUnitStarFilter,
    renderAddUnitList,
    addUnitToTier,
    removeUnitFromTier,
    openAddTierCategoryModal,
    submitAddTierCategory,
    openRenameTierCategoryModal,
    submitRenameTierCategory,
    deleteTierCategory,
    moveTierCategory,
    openMoveUnitModal,
    moveUnitToCategory,
    openManageUnitInTierModal,
    submitManageUnitInTier,
    onTierDragStart,
    onTierDragOver,
    onTierDragLeave,
    onTierDragEnd,
    onTierDrop,
    onTierListPresetChange,
    saveTierList,
    confirmResetTierList,
    proposeTierListToGitHub,
    exportTierListJSON,
    importTierListJSON
  };
})();

// Exposer globalement
window.CommunityManager = CommunityManager;
window.CommunityUI = CommunityUI;
