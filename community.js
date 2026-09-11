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
    codes: [],         // [ { code, reward, date, status } ]
    tips: {}           // { [unitId]: [ { id, author, type, text, date } ] }
  };

  let isServerAvailable = false;
  let originalUnitsBackup = null;

  // Initialisation : charge depuis le serveur ou localStorage
  async function init() {
    // 1. Sauvegarder une copie propre des unités officielles au premier chargement
    const currentList = window.getGlobalUnits ? window.getGlobalUnits() : window.ALL_UNITS;
    if (!originalUnitsBackup && Array.isArray(currentList) && currentList.length > 0) {
      originalUnitsBackup = JSON.parse(JSON.stringify(currentList));
    }

    // 2. Tenter de charger depuis l'API locale du serveur
    try {
      const res = await fetch(API_ENDPOINT, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          state.units = data.units || {};
          state.deleted_units = data.deleted_units || [];
          state.codes = data.codes || [];
          state.tips = data.tips || {};
          isServerAvailable = true;
          saveToLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    } catch (e) {
      // Serveur injoignable (ex: GitHub Pages ou hors ligne) -> fallback localStorage
      isServerAvailable = false;
      loadFromLocalStorage();
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
        state.codes = parsed.codes || [];
        state.tips = parsed.tips || {};
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
    if (!isServerAvailable) return;
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
    if (!Array.isArray(currentList)) return;

    if (!originalUnitsBackup) {
      originalUnitsBackup = JSON.parse(JSON.stringify(currentList));
    }

    // Recommencer à partir de la sauvegarde officielle
    let workingList = JSON.parse(JSON.stringify(originalUnitsBackup));

    // 1. Filtrer les unités supprimées / masquées par la communauté
    const deletedSet = new Set(state.deleted_units || []);
    workingList = workingList.filter(u => !deletedSet.has(u.id));

    // 2. Appliquer les unités modifiées ou ajoutées
    const communityUnits = Object.values(state.units || {});
    communityUnits.forEach(commUnit => {
      if (deletedSet.has(commUnit.id)) return;
      const existingIdx = workingList.findIndex(u => u.id === commUnit.id);
      if (existingIdx >= 0) {
        // Unité modifiée
        workingList[existingIdx] = {
          ...workingList[existingIdx],
          ...commUnit,
          _is_community_modified: true
        };
      } else {
        // Nouvelle unité ajoutée
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

    // 3. Fusionner les codes promotionnels communautaires
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

    updateCommunityBadge();
  }

  function updateCommunityBadge() {
    const count = Object.keys(state.units || {}).length +
                  (state.deleted_units || []).length +
                  (state.codes || []).length;
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
      codes: [],
      tips: {}
    };

    await syncWithServer('reset_all');
    applyToGlobalData();

    if (window.applyUnitFilters) window.applyUnitFilters();
    else if (window.filterUnits) window.filterUnits();
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
          state.codes = [...(data.codes || []), ...(state.codes || [])];
          state.tips = { ...(state.tips || {}), ...(data.tips || {}) };

          await syncWithServer('import_all', { data: state });
          applyToGlobalData();

          if (window.applyUnitFilters) window.applyUnitFilters();
          else if (window.filterUnits) window.filterUnits();
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

    if (type === 'unit') {
      const upgFormatted = (data.upgrades && data.upgrades.length > 0)
        ? data.upgrades.map(u => `  - Palier ${u.level}: Coût: $${(u.cost || 0).toLocaleString()} | Dégâts: ${(u.damage || 0).toLocaleString()} | Portée: ${u.range || 0} | SPA: ${u.spa || 0}s${(u.abilities && u.abilities.length > 0) ? ` | Effets: ${u.abilities.join(', ')}` : ''}`).join('\n')
        : '-';

      title = `[Proposition Communauté] Unité : ${data.name || 'Nouvelle Unité'}`;
      body = `### Proposition d'ajout / modification d'unité ASTD\n\n` +
             `**Nom :** ${data.name || '-'}\n` +
             `**Rareté :** ${data.star || 5}★\n` +
             `**Franchise Anime :** ${data.anime_origin || '-'}\n` +
             `**Type de Tour :** ${data.tower_type || '-'}\n` +
             `**Zone d'Attaque :** ${data.attack_type || '-'}\n` +
             `**Coût Déploiement :** $${data.deployment_cost?.toLocaleString() || '-'}\n` +
             `**Coût Total :** $${data.total_cost?.toLocaleString() || '-'}\n` +
             `**Dégâts Max :** ${data.max_damage?.toLocaleString() || '-'}\n` +
             `**SPA :** ${data.min_spa || '-'}s\n` +
             `**DPS Estimé :** ${data.max_dps?.toLocaleString() || '-'}\n` +
             `**Portée :** ${data.max_range || '-'}\n` +
             `**Description :** ${data.overview || '-'}\n\n` +
             `### Paliers d'Amélioration :\n${upgFormatted}\n\n` +
             `*Généré automatiquement depuis l'Assistant Communautaire ASTD Wiki.*`;
    } else if (type === 'code') {
      title = `[Proposition Communauté] Code Promo : ${data.code || ''}`;
      body = `### Nouveau Code Promo Signalé\n\n` +
             `**Code :** \`${data.code}\`\n` +
             `**Récompenses :** ${data.reward || '-'}\n` +
             `**Statut :** ${data.status || 'active'}\n\n` +
             `*Généré automatiquement depuis l'Assistant Communautaire ASTD Wiki.*`;
    }

    return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
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
              ${window.t ? window.t('comm_hub_desc', 'Ajoutez de nouvelles unités, corrigez des statistiques inexactes, partagez de nouveaux codes cadeaux ou donnez vos conseils tactiques. Aucune connaissance technique requise, tout est guidé pas-à-pas et 100% réversible !') : 'Ajoutez de nouvelles unités, corrigez des statistiques inexactes, partagez de nouveaux codes cadeaux ou donnez vos conseils tactiques. Aucune connaissance technique requise, tout est guidé pas-à-pas et 100% réversible !'}
            </p>
          </div>

          <!-- Statistiques rapides -->
          <div class="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 text-center font-mono-num">
            <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-sans block uppercase font-bold">${window.t ? window.t('comm_stat_units', 'Unités') : 'Unités'}</span>
              <span class="text-base font-bold text-sky-400">${modifiedUnitsList.length}</span>
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

        <!-- 3 Cartes d'Actions Rapides Débutant -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <button onclick="CommunityUI.openUnitModalForAdd()" class="p-3.5 rounded-xl bg-[#090e1c] hover:bg-sky-600/20 border border-slate-800 hover:border-sky-500/50 text-left transition-all tap-scale group flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 group-hover:scale-105 transition-transform">
              <i data-lucide="plus-circle" class="w-5 h-5" stroke-width="2"></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">${window.t ? window.t('comm_btn_add_unit_title', 'Ajouter une Nouvelle Unité') : 'Ajouter une Nouvelle Unité'}</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_btn_add_unit_desc', 'Formulaire assisté avec calcul de DPS et aperçu en direct.') : 'Formulaire assisté avec calcul de DPS et aperçu en direct.'}</p>
            </div>
          </button>

          <button onclick="CommunityUI.openUnitSelectorForEdit()" class="p-3.5 rounded-xl bg-[#090e1c] hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/50 text-left transition-all tap-scale group flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
              <i data-lucide="edit-3" class="w-5 h-5" stroke-width="2"></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">${window.t ? window.t('comm_btn_edit_unit_title', 'Modifier une Fiche Existante') : 'Modifier une Fiche Existante'}</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">${window.t ? window.t('comm_btn_edit_unit_desc', 'Corriger les dégâts, le placement, ou la description.') : 'Corriger les dégâts, le placement, ou la description.'}</p>
            </div>
          </button>

          <button onclick="CommunityUI.openCodeModalForAdd()" class="p-3.5 rounded-xl bg-[#090e1c] hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/50 text-left transition-all tap-scale group flex items-start gap-3">
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
            ${isServerAvailable ? 'Serveur Local Connecté' : 'Mode LocalStorage (En Ligne)'}
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
                    <img src="${u.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 p-1 object-contain shrink-0">
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
                      <button onclick="CommunityManager.deleteUnit('${u.id}')" class="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white tap-scale" title="Supprimer ou masquer">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

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
                      ${c.status === 'active' ? 'Actif' : 'Expiré'}
                    </span>
                  </div>
                  <div class="text-slate-300 text-[11px]">${c.reward}</div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                    <button onclick="CommunityManager.toggleCodeExpired('${c.code}')" class="text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 tap-scale">
                      <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                      <span>${c.status === 'active' ? 'Marquer expiré' : 'Marquer actif'}</span>
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

      </div>
    `;

    if (window.lucide) lucide.createIcons();
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
      meta: 'Méta & Classement',
      raid: 'Raids & Donjons',
      orbs: 'Orbe Recommandé',
      synergy: 'Synergie de Deck'
    };

    tipsContainer.innerHTML = tips.map(tip => `
      <div class="p-3 rounded-lg bg-[#090e1c] border border-slate-800 space-y-1.5 text-xs relative group">
        <div class="flex items-center justify-between text-[11px]">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="font-bold text-slate-200">${tip.author || 'Joueur ASTD'}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
              ${typeLabels[tip.type] || tip.type}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-500 text-[10px] font-mono-num">${tip.date || ''}</span>
            <button onclick="CommunityManager.deleteTip('${unitId}', '${tip.id}')" class="text-slate-500 hover:text-rose-400 p-0.5 tap-scale opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer ce conseil">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
        <p class="text-slate-300 text-pretty leading-relaxed">
          ${tip.text}
        </p>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  return {
    init,
    applyToGlobalData,
    saveUnit,
    deleteUnit,
    restoreUnit,
    saveCode,
    toggleCodeExpired,
    deleteCode,
    saveTip,
    deleteTip,
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
  let currentFormMode = 'unit'; // 'unit' | 'code' | 'tip'
  let editingUnitId = null;
  let currentUnitUpgrades = [];

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
    if (window.lucide) lucide.createIcons();
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
        { level: 0, cost: 500, damage: 1500, range: 25, spa: 4.0, abilities: [] }
      ];
    }

    tbody.innerHTML = currentUnitUpgrades.map((tier, idx) => {
      const isDeploy = idx === 0;
      const levelLabel = isDeploy ? (window.t ? window.t('comm_tier_deploy', '0 (Déploiement)') : '0 (Déploiement)') : `Palier ${tier.level !== undefined ? tier.level : idx}`;
      const dps = tier.spa > 0 ? (tier.damage / tier.spa) : tier.damage;
      const abilitiesStr = (tier.abilities || []).join(', ');

      return `
        <tr class="transition">
          <td class="whitespace-nowrap font-mono-num">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${isDeploy ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
              ${levelLabel}
            </span>
          </td>
          <td style="min-width: 110px;">
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono-num text-xs">$</span>
              <input type="number" min="0" step="50" value="${tier.cost || 0}"
                     aria-label="Coût palier ${idx}"
                     class="comm-upg-input pl-5 text-xs font-mono-num"
                     oninput="CommunityUI.onUpgradeChange(${idx}, 'cost', this.value)">
            </div>
          </td>
          <td style="min-width: 110px;">
            <input type="number" min="0" step="100" value="${tier.damage || 0}"
                   aria-label="Dégâts palier ${idx}"
                   class="comm-upg-input text-xs font-mono-num font-bold text-slate-100"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'damage', this.value)">
          </td>
          <td style="min-width: 80px;">
            <input type="number" min="1" max="500" step="1" value="${tier.range || 30}"
                   aria-label="Portée palier ${idx}"
                   class="comm-upg-input text-xs font-mono-num"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'range', this.value)">
          </td>
          <td style="min-width: 80px;">
            <input type="number" min="0.1" max="60" step="0.1" value="${tier.spa || 4}"
                   aria-label="SPA palier ${idx}"
                   class="comm-upg-input text-xs font-mono-num"
                   oninput="CommunityUI.onUpgradeChange(${idx}, 'spa', this.value)">
          </td>
          <td style="min-width: 90px;" class="text-center font-mono-num">
            <span id="comm-upg-dps-${idx}" class="inline-block px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
              ${Math.round(dps).toLocaleString()}
            </span>
          </td>
          <td style="min-width: 160px;">
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
    if (window.lucide) lucide.createIcons();
  }

  function addUpgradeRow() {
    const nextLevel = currentUnitUpgrades.length;
    const prevTier = currentUnitUpgrades[nextLevel - 1] || { cost: 1000, damage: 2000, range: 30, spa: 4, abilities: [] };

    // Suggérer des valeurs de départ que l'utilisateur peut modifier à sa guise
    currentUnitUpgrades.push({
      level: nextLevel,
      cost: prevTier.cost > 0 ? Math.round(prevTier.cost * 1.5) : 1000,
      damage: prevTier.damage > 0 ? Math.round(prevTier.damage * 1.5) : 3000,
      range: prevTier.range || 30,
      spa: prevTier.spa || 4,
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

    // Initialiser les paliers d'amélioration
    if (existing && Array.isArray(existing.upgrades) && existing.upgrades.length > 0) {
      currentUnitUpgrades = existing.upgrades.map((u, idx) => ({
        level: u.level !== undefined ? u.level : idx,
        cost: Number(u.cost) || 0,
        damage: Number(u.damage) || 0,
        range: Number(u.range) || 0,
        spa: Number(u.spa) || 1,
        abilities: Array.isArray(u.abilities) ? [...u.abilities] : (u.abilities ? [String(u.abilities)] : [])
      }));
    } else if (existing) {
      currentUnitUpgrades = [{
        level: 0,
        cost: Number(existing.deployment_cost) || 500,
        damage: Number(existing.max_damage) || 1000,
        range: Number(existing.max_range) || 30,
        spa: Number(existing.min_spa) || 4,
        abilities: []
      }];
    } else {
      currentUnitUpgrades = [
        { level: 0, cost: 500, damage: 1500, range: 25, spa: 4.0, abilities: [] },
        { level: 1, cost: 1200, damage: 5500, range: 32, spa: 4.0, abilities: [] },
        { level: 2, cost: 3500, damage: 18000, range: 45, spa: 3.5, abilities: ['+ Max Upgrade'] }
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

            <!-- Image URL -->
            <div>
              <label class="block font-bold text-slate-200 mb-1">
                ${window.t ? window.t('comm_field_image', 'Image (URL web ou lien Wiki)') : 'Image (URL web ou lien Wiki)'}
              </label>
              <input type="url" id="comm-unit-image" value="${existing?.image || ''}"
                     placeholder="https://static.wikia.nocookie.net/... ou lien direct .png/.jpg"
                     class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                     oninput="CommunityUI.updateLivePreview()">
            </div>

            <!-- Types : Placement et Attaque -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-200 mb-1">
                  ${window.t ? window.t('comm_field_tower_type', 'Type de Placement') : 'Type de Placement'}
                </label>
                <select id="comm-unit-tower-type" class="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                        onchange="CommunityUI.updateLivePreview()">
                  <option value="Ground" ${existing?.tower_type === 'Ground' || !existing ? 'selected' : ''}>Sol (Ground)</option>
                  <option value="Air" ${existing?.tower_type === 'Air' ? 'selected' : ''}>Aérien (Air)</option>
                  <option value="Hill" ${existing?.tower_type === 'Hill' ? 'selected' : ''}>Colline (Hill)</option>
                  <option value="Hybrid" ${existing?.tower_type === 'Hybrid' ? 'selected' : ''}>Hybride (Sol & Air)</option>
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
                  <th class="w-32">Coût ($)</th>
                  <th class="w-32">Dégâts (DMG)</th>
                  <th class="w-24">Portée</th>
                  <th class="w-24">SPA (s)</th>
                  <th class="w-28 text-center">DPS</th>
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
                      placeholder="Présentation de l'unité, capacités notables, obtention..."
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
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <button type="button" onclick="CommunityUI.closeModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs tap-scale">
            ${window.t ? window.t('cancel', 'Annuler') : 'Annuler'}
          </button>
          <button type="submit" id="comm-unit-submit-btn" class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 tap-scale shadow-md">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>${isEdit ? (window.t ? window.t('comm_btn_save_changes', 'Enregistrer les Modifications') : 'Enregistrer les Modifications') : (window.t ? window.t('comm_btn_create_unit', 'Créer & Ajouter l\'Unite') : 'Créer & Ajouter l\'Unite')}</span>
          </button>
        </div>

      </form>
    `;

    renderUpgradeRows();
    updateLivePreview();
    if (window.lucide) lucide.createIcons();
  }

  function updateLivePreview() {
    const name = document.getElementById('comm-unit-name')?.value?.trim() || 'Nom de l\'unité';
    const star = document.getElementById('comm-unit-star')?.value || '6';
    const anime = document.getElementById('comm-unit-anime')?.value?.trim() || 'All Star Tower Defense';
    const image = document.getElementById('comm-unit-image')?.value?.trim() || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
    const towerType = document.getElementById('comm-unit-tower-type')?.value || 'Ground';

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
            <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded">
              ${towerType}
            </span>
          </div>

          <div class="w-full h-28 rounded-lg bg-[#070b14] border border-slate-800 p-2 my-1 flex items-center justify-center overflow-hidden">
            <img src="${image}" onerror="this.src='https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'"
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

    const unitData = {
      id: editingUnitId,
      name: name,
      star: parseInt(document.getElementById('comm-unit-star').value, 10),
      anime_origin: document.getElementById('comm-unit-anime').value.trim(),
      character_origin: document.getElementById('comm-unit-char').value.trim(),
      image: document.getElementById('comm-unit-image').value.trim(),
      tower_type: document.getElementById('comm-unit-tower-type').value,
      attack_type: document.getElementById('comm-unit-attack-type').value,
      deployment_cost: stats.deployment_cost,
      total_cost: stats.total_cost,
      max_damage: stats.max_damage,
      max_range: stats.max_range,
      min_spa: stats.min_spa,
      max_dps: Math.round(stats.max_dps),
      upgrades: currentUnitUpgrades,
      overview: document.getElementById('comm-unit-overview').value.trim(),
      is_tradeable: document.getElementById('comm-unit-tradeable').checked,
      is_unobtainable: document.getElementById('comm-unit-unobtainable').checked
    };

    const success = await CommunityManager.saveUnit(unitData);
    if (success) {
      closeModal();
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

    if (window.lucide) lucide.createIcons();
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
            <option value="meta">Méta & Classement</option>
            <option value="raid">Raids & Donjons</option>
            <option value="orbs">Orbe Recommandé</option>
            <option value="synergy">Synergie de Deck</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-200 mb-1">
            ${window.t ? window.t('comm_field_tip_text', 'Votre conseil tactique *') : 'Votre conseil tactique *'}
          </label>
          <textarea id="comm-tip-text" required rows="3"
                    placeholder="Ex: Équipez l'orbe Fire Orb pour doubler ses dégâts en Raid 2. Très efficace combiné avec Idol pour le buff Shine..."
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

    if (window.lucide) lucide.createIcons();
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

  return {
    openUnitModalForAdd,
    openUnitModalForEdit,
    openUnitSelectorForEdit,
    openCodeModalForAdd,
    openTipModalForUnit,
    openModal,
    closeModal,
    updateLivePreview,
    submitUnitForm,
    submitCodeForm,
    submitTipForm,
    addUpgradeRow,
    removeUpgradeRow,
    onUpgradeChange,
    renderUpgradeRows,
    getCurrentUnitUpgrades: () => currentUnitUpgrades
  };
})();

// Exposer globalement
window.CommunityManager = CommunityManager;
window.CommunityUI = CommunityUI;
