// ==========================================
// ALL STAR TOWER DEFENSE - WIKI & DATABASE
// Tactical Pro Architecture (Mobalytics / OP.GG Style)
// ==========================================

var ALL_UNITS = [];
var FILTERED_UNITS = [];
var CODES_DATA = { active: [], expired: [] };
var ORBS_DATA = [];
var TIERLIST_DATA = {};
var GAMEMODES_DATA = [];
var META_DATA = {};
var MATERIAL_IMAGES = {};

window.ALL_UNITS = ALL_UNITS;
window.getGlobalUnits = () => ALL_UNITS;
window.setGlobalUnits = (list) => { ALL_UNITS = list; window.ALL_UNITS = list; };

window.ORBS_DATA = ORBS_DATA;
window.getGlobalOrbs = () => ORBS_DATA;
window.setGlobalOrbs = (list) => { ORBS_DATA = list; window.ORBS_DATA = list; };

window.TIERLIST_DATA = TIERLIST_DATA;
window.getGlobalTierList = () => TIERLIST_DATA;
window.setGlobalTierList = (data) => { TIERLIST_DATA = data; window.TIERLIST_DATA = data; };

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

// ==========================================
// UTILITIES
// ==========================================
function debounce(fn, delay = 150) {
  let timer;
  const debounced = function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  debounced.now = (...args) => {
    clearTimeout(timer);
    return fn.apply(this, args);
  };
  return debounced;
}
window.debounce = debounce;

// ==========================================
// INTERNATIONALIZATION (I18N) - FR & EN
// ==========================================
let currentLang = localStorage.getItem('astd_lang') || 'fr';

const I18N = {
  fr: {
    // Header, brand & nav
    skip_to_content: "Aller au contenu principal",
    brand_subtitle: "Base de Données & Meta Hub",
    brand_aria: "Accueil ASTD Wiki",
    quick_search_placeholder: "Recherche rapide (Ctrl + K)...",
    quick_search_btn: "Rechercher...",
    quick_search_sr: "Recherche rapide d'unité ou anime",
    quick_search_aria: "Rechercher une unité",
    wiki_sync_label: "Synchro wiki :",
    units_label: "Unités",
    orbs_label: "Orbes",
    codes_autoupdate: "Actifs",
    latest_code_label: "Dernier code :",
    copy_btn: "Copier",
    copy_code_aria: "Copier le dernier code",
    lang_choice: "Langue",
    wiki_link_title: "Consulter le wiki Fandom officiel d'All Star Tower Defense",
    wiki_link_aria: "Ouvrir le wiki officiel Fandom dans un nouvel onglet",
    menu_toggle_aria: "Ouvrir le menu de navigation",
    nav_main_aria: "Navigation principale",
    nav_units: "Unités",
    nav_tierlist: "Tier List",
    nav_codes: "Codes",
    nav_orbs: "Orbes",
    nav_gamemodes: "Modes",
    nav_gamemodes_short: "Modes",
    nav_teambuilder: "Deck",
    nav_deck_short: "Deck",
    nav_compare: "Comparateur",
    nav_compare_short: "Versus",
    nav_community: "Communauté",
    nav_community_short: "Commu",
    nav_mobile_aria: "Menu mobile",
    mobile_search_placeholder: "Rechercher une unité...",
    drawer_units: "Tours & Unités",
    drawer_tierlist: "Tier List Officielle",
    drawer_codes: "Codes Actifs",
    drawer_orbs: "Compendium des Orbes",
    drawer_gamemodes: "Modes de Jeu & Raids",
    drawer_teambuilder: "Deck Builder (6 Slots)",
    drawer_compare: "Comparateur Tactique Pro",
    drawer_community: "Hub Communauté",
    btn_propose_unit: "Proposer une Unité",
    btn_propose_unit_short: "Ajouter",
    comm_btn_add_code_nav: "Proposer un Code",
    community_h1: "Espace et Contributions de la Communauté",
    comm_stat_tierlist: "Tier List",
    comm_card_tierlist_title: "Tier Lists & Méta",
    comm_card_tierlist_desc: "Glisser-déposer d'unités, tiers sur mesure et presets.",
    comm_btn_edit_tierlist: "Éditer",
    comm_btn_view_tierlist: "Consulter",
    comm_tierlist_section_title: "Tier List Méta Collaborative",
    comm_tierlist_status_custom: "Personnalisée",
    comm_tierlist_status_official: "Officielle",
    comm_tierlist_custom_desc: "Vous utilisez actuellement une version personnalisée de la Tier List avec vos propres classements et catégories.",
    comm_tierlist_official_desc: "La Tier List officielle du Wiki est actuellement chargée. Vous pouvez la personnaliser librement par glisser-déposer, créer de nouvelles catégories, et proposer vos changements en ligne !",
    modal_btn_edit: "Modifier",
    modal_btn_hide: "Masquer",
    modal_community_tips_title: "Conseils & Avis de la Communauté",
    btn_add_tip: "Partager un conseil",
    badge_community: "Communauté",
    badge_modified: "Modifié",
    btn_mark_expired: "Signaler expiré",
    btn_mark_expired_title: "Signaler ce code comme expiré",
    comm_upgrades_section_title: "Paliers d'Amélioration (Saisie Manuelle)",
    comm_upgrades_section_desc: "Renseignez à la main le coût, les dégâts, la portée et le SPA de chaque palier. Aucun multiplicateur automatique n'est imposé.",
    comm_btn_add_tier: "Ajouter un palier",
    comm_tier_deploy: "0 (Déploiement)",
    comm_del_tier: "Supprimer ce palier",
    comm_tier_required: "Veuillez renseigner au moins un palier d'amélioration.",
    comm_help_desc_upgrades: "Remplissez les informations générales et saisissez chaque palier d'amélioration manuellement. Le coût total et les statistiques maximales sont calculés directement à partir de vos paliers.",
    comm_field_image: "Image de l'Unité",
    comm_btn_browse_pc: "📁 Importer depuis mon PC",
    comm_or_enter_url: "ou saisissez un lien URL ci-dessous :",
    comm_img_from_pc_loaded: "Fichier PC importé",
    comm_img_remove: "Retirer cette image",
    comm_th_tower_type: "Type de Tour",
    comm_type_unchanged: "— Inchangé —",
    comm_type_ground: "🌱 Sol (Ground)",
    comm_type_hill: "🏔️ Colline (Hill)",
    comm_type_hybrid: "⚡ Hybride (Hybrid)",
    comm_type_air: "🦅 Aérien (Air)",
    comm_type_hybrid_badge: "Hybride",
    comm_type_hill_badge: "Colline",
    comm_type_air_badge: "Aérien",
    comm_type_ground_badge: "Sol",

    // Units Tab & Filters
    units_h1: "Base de Données des Tours & Unités ASTD",
    units_filter_aria: "Filtres de recherche des unités",
    filter_search_sr: "Rechercher une unité par nom",
    filter_search_aria: "Rechercher par nom d'unité ou franchise anime",
    filter_search_placeholder: "Nom ou franchise de l'unité...",
    clear_search_aria: "Effacer la recherche",
    filter_sort_sr: "Trier les unités",
    filter_sort_aria: "Critère de tri des unités",
    sort_recent_desc: "Plus Récentes d'abord",
    sort_star_desc: "Rareté (Décroissant)",
    sort_star_asc: "Rareté (Croissant)",
    sort_dps_desc: "DPS Max (Décroissant)",
    sort_dmg_desc: "Dégâts Max (Décroissant)",
    sort_cost_asc: "Coût Total (Plus bas)",
    sort_name_asc: "Nom (A → Z)",
    filter_tower_type_sr: "Filtrer par type de tour",
    filter_tower_type_aria: "Type de placement de la tour",
    filter_type_all: "Tous les types",
    filter_type_ground: "Sol (Ground)",
    filter_type_air: "Aérien (Air)",
    filter_type_hill: "Colline (Hill)",
    filter_type_hybrid: "Hybride (Sol & Air)",
    filter_anime_sr: "Filtrer par franchise",
    filter_anime_aria: "Franchise ou anime de provenance",
    filter_anime_all: "Toutes les franchises",
    filter_obtainable_title: "Masquer les unités bannies ou introuvables",
    filter_obtainable: "Obtenables uniquement",
    view_mode_aria: "Mode d'affichage de la liste",
    view_grid_title: "Affichage en cartes tactiques",
    view_grid_aria: "Afficher en grille de cartes tactiques",
    view_grid: "Grille",
    view_table_title: "Affichage en tableau détaillé",
    view_table_aria: "Afficher en tableau détaillé style Pro",
    view_table: "Tableau",
    filter_star_aria: "Filtrer par rareté d'étoiles",
    star_all: "Toutes",
    results_label: "Résultats :",
    units_grid_aria: "Grille des unités de défense",
    load_more_aria: "Charger les unités suivantes",
    load_more_units: "Charger plus d'unités",
    units_table_aria: "Tableau comparatif des unités de défense",
    th_unit: "Unité & Franchise",
    th_rarity: "Rareté",
    th_type: "Type",
    th_max_damage: "Dégâts Max",
    th_range: "Portée",
    th_spa: "SPA",
    th_max_dps: "DPS Max",
    th_total_cost: "Coût Max",
    th_action: "Actions",

    // Dynamic strings - Units List & Cards
    unit_singular: "unité",
    unit_plural: "unités",
    badge_new: "Nouveau",
    badge_unobtainable: "Introuvable",
    btn_card: "Fiche",
    btn_compare_title: "Comparer cette unité",
    btn_add_deck_title: "Ajouter au deck",
    no_matching_units: "Aucune unité ne correspond à vos filtres",
    no_results_for: "Aucun résultat pour « {searchVal} ».",
    no_results_combo: "Aucune unité disponible avec la combinaison de rareté et type sélectionnés.",
    reset_filters: "Réinitialiser les filtres",
    table_view_sheet: "Voir la fiche.",
    card_click_inspect: "Cliquer pour inspecter.",
    wiki_page_created_on: "Fiche wiki créée le",
    dmg_max_tooltip: "Dégâts au palier d'amélioration maximum",
    dps_max_tooltip: "Dégâts Par Seconde au palier maximum",
    range_max_tooltip: "Distance d'attaque maximale",
    spa_tooltip: "SPA : Secondes Par Attaque (délai entre deux attaques)",
    hud_range_short: "Portée",

    // Modal Unit Details
    modal_close_aria: "Fermer la fiche de l'unité",
    modal_card_level: "Niveau de carte :",
    modal_level_group_aria: "Niveau de carte pour les statistiques",
    modal_idol_toggle_title: "Simuler le buff de dégâts fourni par Idol (aptitude Shine)",
    buff_idol_label: "Buff Idol",
    hud_max_dmg: "Dégâts Max",
    hud_dmg_scale: "Échelle de dégâts du palier initial au palier max",
    hud_max_dps: "DPS Max Estimé",
    hud_tower_type: "Type de Placement",
    hud_attack_type: "Zone d'Attaque",
    hud_deploy_cost: "Déploiement",
    hud_total_cost: "Coût Total Max",
    modal_fandom_title: "Ouvrir la page Fandom officielle de cette unité",
    modal_fandom_aria: "Consulter la fiche officielle sur le wiki Fandom (nouvel onglet)",
    modal_btn_deck: "Ajouter au Deck",
    modal_btn_deck_aria: "Ajouter cette unité à votre équipe",
    modal_btn_compare: "Comparer",
    modal_btn_compare_title: "Comparer cette unité avec un autre personnage",
    modal_btn_compare_aria: "Ouvrir le comparateur avec cette unité",
    modal_obtain_title: "Source d'obtention",
    modal_evo_title: "Évolution de l'Unité",
    modal_preevo_title: "Pré-évolutions",
    btn_show: "Afficher",
    btn_hide: "Masquer",
    modal_abilities_title: "Capacités Spéciales, Passifs & Leader",
    modal_upgrades_title: "Progression des Améliorations (Paliers de Jeu)",
    th_level: "Palier",
    th_cost: "Coût",
    th_damage: "Dégâts",
    th_buff: "Buff",
    th_buff_title: "Buff de dégâts fourni aux unités alliées à portée (aptitude Shine)",
    th_effect: "Effets / Capacités",
    attack_type_tooltip: "AoE : Area of Effect (zone touchée par chaque attaque : cercle, cône, ligne...)",
    unknown: "Inconnu",
    anime_prefix: "Anime :",
    char_prefix: "Personnage :",
    origin_all_star: "Origine : Personnage All Star",
    added_on: "Ajoutée le",
    added_on_tooltip: "Fiche wiki créée le {date} — le badge Nouveau s'affiche pendant 30 jours",
    no_overview: "Aucune description détaillée enregistrée pour cette unité.",
    evolution_of: "Évolution de :",
    can_evolve_into: "Peut évoluer en",
    evolves_into: "Évolue en :",
    required_materials: "Matériaux requis :",
    units_evolving_into: "Unité{s} qui évolue{nt} en",
    ability_manual: "Aptitude Manuelle",
    ability_passive: "Passif Spécial",
    ability_leader: "Leader",
    ability_default: "Capacité",
    upgrade_effects_prefix: "Effets du palier",
    view_full_ability: "Voir la fiche complète de l'aptitude",
    upgrades_empty: "Statistiques de paliers détaillées non documentées pour cette unité.",
    tag_lvl175: "niveau de carte 175",
    tag_idol: "buff Idol +{pct}%",
    upg_buff_tooltip: "Buff de dégâts fourni aux unités à portée (aptitude Shine) — {lvl}",
    upg_buff_none: "Aucun buff à ce palier (Your Star remplace Shine)",
    click_read_ability: "Cliquer pour lire les effets et détails de capacité",
    lvl_175_card: "niveau de carte 175",
    lvl_1_card: "niveau de carte 1",

    // Tier List
    tierlist_heading: "Tier List Officielle ASTD",
    tierlist_subheading: "Classement officiel des meilleures unités par catégorie compétitive. Modifiez, créez et réorganisez les tiers en direct !",
    tierlist_region_aria: "Tier List Officielle ASTD",
    tierlist_loading: "Tier list en cours de chargement...",
    tierlist_btn_edit: "Modifier la Tier List",
    tierlist_btn_edit_active: "Mode Lecture",
    tierlist_btn_edit_title: "Activer ou désactiver l'édition des catégories et unités",
    tierlist_btn_add_cat: "Nouvelle Catégorie",
    tierlist_btn_add_cat_title: "Créer une nouvelle catégorie méta",
    tierlist_opt_official: "Tier List Méta Officielle",
    tierlist_opt_standard: "Tier Maker Standard (S+ / S / A / B / C / D)",
    tierlist_select_preset_title: "Changer le modèle de Tier List",
    tierlist_btn_github: "Proposer au Wiki",
    tierlist_btn_github_title: "Proposer vos modifications au Wiki via GitHub",
    tierlist_btn_reset: "Rétablir",
    tierlist_btn_reset_title: "Rétablir la Tier List officielle d'origine",
    tierlist_btn_export: "Exporter",
    tierlist_btn_export_title: "Exporter au format JSON",
    tierlist_btn_import: "Importer",
    tierlist_btn_import_title: "Importer un fichier JSON de Tier List",
    tierlist_search_placeholder: "Filtrer une unité ou catégorie...",
    tierlist_stat_cats: "catégories",
    tierlist_stat_units: "unités classées",
    tierlist_edit_active: "Mode Édition Actif :",
    tierlist_edit_desc: "Glissez-déposez les cartes pour réordonner ou changer de catégorie. Cliquez sur + pour ajouter une unité ou sur ✕ pour la retirer.",
    tierlist_btn_save: "Enregistrer",
    tierlist_btn_save_title: "Enregistrer les modifications en local ou sur le serveur",
    tierlist_btn_close_edit: "Fermer l'édition",
    tierlist_cat_add_unit: "+ Ajouter une unité",
    tierlist_cat_rename: "Renommer",
    tierlist_cat_delete: "Supprimer la catégorie",
    tierlist_unit_remove: "Retirer de cette catégorie",
    tierlist_unit_move: "Déplacer vers...",
    tierlist_empty_cat: "Aucune unité dans cette catégorie. Cliquez sur '+ Ajouter' pour en insérer ou glissez-déposez une unité ici.",
    modal_btn_tier: "Gérer dans la Tier List",
    modal_btn_tier_title: "Gérer ou ajouter cette unité dans les catégories de la Tier List",
    tierlist_confirm_reset: "Voulez-vous vraiment réinitialiser la Tier List à sa version officielle ? Toutes les modifications locales seront effacées.",
    tierlist_confirm_delete_cat: "Supprimer définitivement la catégorie '{name}' et retirer ses unités classées ?",
    tierlist_saved_toast: "Tier List enregistrée avec succès !",
    tierlist_reset_toast: "Tier List réinitialisée à l'état officiel.",
    badge_modified_community: "Modifiée",

    // Codes
    codes_heading: "Codes Cadeaux Actifs & Vérifiés",
    codes_subheading: "Tous les codes sont testés en jeu régulièrement. Cliquez sur Copier pour récupérer les récompenses.",
    codes_active_aria: "Codes cadeaux actifs",
    codes_expired_heading: "Codes Expirés / Inactifs",
    codes_filter_expired_sr: "Filtrer les codes expirés",
    codes_filter_expired_placeholder: "Rechercher un code expiré...",
    codes_filter_expired_aria: "Recherche dans l'historique des codes expirés",
    codes_expired_region_aria: "Liste des codes cadeaux expirés",
    code_verified_active: "Vérifié & Actif",
    code_recent: "Récent",
    code_rewards_label: "Récompenses :",
    btn_copy_code: "Copier le code",
    copied: "Copié !",
    toast_code_copied: "Code \"{code}\" copié !",
    no_expired_codes: "Aucun code expiré ne correspond à cette recherche.",

    // Orbs
    orbs_heading: "Compendium des Orbes",
    orbs_subheading: "Bonus de statistiques et conditions d'équipement des orbes.",
    search_orbs_sr: "Rechercher un orbe",
    search_orbs_placeholder: "Filtrer un orbe (nom, effet, unité compatible)...",
    search_orbs_aria: "Filtrer les orbes par nom, effet ou unité requise",
    orbs_grid_aria: "Compendium des orbes",
    all_units_badge: "★ Toutes les unités",
    universal_orb_title: "Équipable par toutes les unités",
    restricted_orb_title: "Réservé à cette unité (ou sa famille)",
    stat_bonus_label: "Bonus statistique :",
    special_bonus: "Bonus spécial",
    obtain_label: "Obtention :",
    compatible_label: "Compatible :",
    no_orbs_found: "Aucun orbe trouvé",
    no_orbs_query: "Aucun orbe ne correspond à la recherche « {q} ».",
    clear_search: "Effacer la recherche",
    comm_stat_orbs: "Orbes",
    add_orb_btn: "Ajouter un Orbe",
    comm_badge_orb: "Communauté",
    comm_btn_edit_orb_title: "Modifier cet orbe",
    comm_orb_new_badge: "Création locale",
    comm_orb_mod_badge: "Modifié localement",
    comm_title_add_orb: "Créer & Proposer un Nouvel Orbe",
    comm_title_edit_orb: "Modifier l'Orbe : {name}",
    comm_title_select_orb: "Modifier un orbe existant",
    comm_select_orb_to_edit: "Choisissez un orbe à modifier :",
    comm_btn_edit_orb_now: "Modifier cet orbe",
    comm_btn_save_orb_local: "Enregistrer Localement",
    comm_btn_propose_orb_github: "Enregistrer & Proposer au Wiki Officiel",
    comm_field_orb_name: "Nom de l'orbe *",
    comm_field_orb_effect: "Effet / Bonus Statistique *",
    comm_field_orb_require: "Compatibilité (Condition requise) *",
    comm_field_orb_obtain: "Méthode d'Obtention",
    comm_field_orb_image: "Illustration de l'Orbe (Fichier local ou URL)",
    comm_preview_live_title: "Aperçu en Direct",
    comm_preview_badge: "Aperçu Direct",
    comm_orb_saved: "Orbe « {name} » enregistré avec succès !",
    comm_orb_removed: "Orbe « {name} » retiré.",
    comm_orb_restored: "Orbe « {name} » restauré !",
    comm_confirm_delete_orb: "Voulez-vous vraiment retirer l'orbe « {name} » ? (Vous pourrez le restaurer à tout moment).",

    // Gamemodes
    gamemodes_heading: "Modes de Jeu & Raids",
    gamemodes_subheading: "Guides stratégiques et récompenses des différents modes de jeu.",
    gamemodes_grid_aria: "Modes de jeu et raids",
    mode_rewards_label: "Récompenses :",

    // Team Builder
    teambuilder_heading: "Tactical Team Builder (Deck 6 Slots)",
    teambuilder_subheading: "Analysez la couverture, le coût et la synergie de votre composition.",
    clear_team_btn: "Vider le deck",
    clear_team_aria: "Retirer toutes les unités du deck",
    team_slots_aria: "Slots du deck de l'équipe",
    team_stat_deploy_label: "Coût Déploiement Total",
    team_stat_total_label: "Coût Améliorations Max",
    team_stat_dps_label: "DPS Cumulé Estimé",
    team_coverage_title: "Couverture Stratégique",
    team_economy_title: "Économie & Contrôle",
    team_picker_title: "Ajouter une Unité au Deck",
    team_picker_sr: "Rechercher une tour à ajouter au deck",
    team_picker_placeholder: "Rechercher parmi les unités 6★ et 7★...",
    team_picker_aria: "Champ de recherche pour ajouter une unité au deck",
    team_picker_grid_aria: "Sélection des unités disponibles pour le deck",
    slot_empty_sr: "Slot {n} vide. Cliquer pour rechercher une tour.",
    slot_label: "SLOT {n}",
    add_a_tower: "Ajouter une tour",
    remove_from_deck: "Retirer {name} du deck",
    dep_short: "Dép",
    team_anti_ground: "Anti-Sol (Ground)",
    team_anti_air: "Anti-Aérien (Air)",
    team_economy: "Économie / Farm",
    team_support: "Support / Contrôle",
    btn_add: "+ Ajouter",
    toast_team_full: "Votre deck de 6 unités est plein !",
    toast_already_in_team: "{name} est déjà dans le deck !",
    toast_added_to_team: "{name} ajouté au slot {slot}",
    toast_removed_from_team: "{name} retiré du deck",
    toast_team_cleared: "Le deck a été vidé",

    // Comparator
    compare_heading: "Comparateur Tactique Pro (Versus)",
    compare_subheading: "Confrontez deux unités face-à-face : DPS, rentabilité ($/DPS), portée, cadence et verdict automatisé.",
    compare_level_group_aria: "Niveau de carte pour la comparaison",
    compare_idol_buff_title: "Simuler le buff maximal de dégâts fourni par Idol (+250%)",
    compare_slot_a_title: "Unité A :",
    compare_slot_a_sr: "Rechercher l'unité A",
    compare_slot_a_placeholder: "Rechercher l'unité A (ex. Demon of Emotion, Kura...)",
    compare_remove_btn: "Effacer",
    compare_swap_aria: "Intervertir unité A et unité B",
    compare_swap_title: "Intervertir unité A et unité B",
    compare_reset_aria: "Réinitialiser les deux unités sélectionnées",
    compare_reset_title: "Réinitialiser la comparaison",
    compare_slot_b_title: "Unité B :",
    compare_slot_b_sr: "Rechercher l'unité B",
    compare_slot_b_placeholder: "Rechercher l'unité B (ex. Stampede, Joke Da Fool...)",
    compare_popular_label: "Duels populaires :",
    compare_empty_title: "Sélectionnez 2 personnages pour comparer",
    compare_empty_desc: "Utilisez les champs de recherche ci-dessus pour désigner les deux unités à confronter, ou lancez un duel populaire en un clic.",
    compare_choose_second: "— choisissez la 2nde unité",
    compare_no_unit: "Aucune unité sélectionnée pour le moment.",
    loading_units: "Chargement des unités en cours...",
    no_units_found: "Aucune unité trouvée",
    toast_added_to_compare: "« {name} » ajouté au comparateur",
    dps_max_a: "DPS Max (A)",
    dmg_max_a: "Dégâts Max (A)",
    dps_max_b: "DPS Max (B)",
    dmg_max_b: "Dégâts Max (B)",
    verdict_title: "Verdict & Synthèse Tactique",
    verdict_subtitle: "Analyse comparative automatisée",
    pillar_dps: "💥 DPS Brut",
    pillar_spa: "⚡ Cadence (SPA)",
    pillar_range: "🎯 Portée",
    pillar_cost: "💰 Rentabilité ($/DPS)",
    verdict_diff: "d'écart",
    verdict_faster: "plus rapide",
    verdict_radius: "de rayon",
    verdict_ratio: "meilleur ratio",
    tie: "Égalité",
    compare_table_title: "Tableau Comparatif des Statistiques (Palier Max)",
    compare_abilities_title: "Capacités Spéciales, Passifs & Leader",
    no_abilities_documented: "Aucune capacité spéciale documentée.",
    metric_dmg_max: "Dégâts Max",
    metric_dps_max: "DPS Max Estimé",
    metric_range: "Portée d'Attaque (Range)",
    metric_spa: "SPA (Cadence d'attaque)",
    metric_deploy_cost: "Coût de Déploiement",
    metric_total_cost: "Coût Total d'Amélioration",
    metric_cost_per_dps: "Coût par point de DPS ($/DPS)",
    metric_upgrades_count: "Paliers d'Amélioration",
    note_spa: "Plus bas = plus rapide",
    note_deploy: "Plus bas = plus facile à poser",
    note_total: "Plus bas = maxé plus tôt",
    note_efficiency: "Plus bas = plus rentable",
    note_upgrades: "Moins de paliers = maxé plus rapidement",
    tiers_word: "paliers",

    // Footer
    footer_desc: "Base de données non officielle et hub stratégique pour All Star Tower Defense sur Roblox.",
    footer_sync: "Synchro automatique avec le wiki Fandom officiel.",
    db_label: "Données :",
    footer_last_updated_tpl: "Dernière synchro wiki : {date} ({count} unités)",

    // Pop-up d'accueil et annonce de soutien publicitaire
    ads_notice_title: "Bienvenue sur ASTD Wiki",
    ads_notice_desc: "Quelques publicités discrètes sont présentes sur le site pour me soutenir. Elles sont disposées de manière à ne pas déranger votre navigation.",
    ads_notice_btn: "Continuer",
  
    ad_label: "Publicité",
    ad_skyscraper_left_aria: "Espace publicitaire latéral gauche",
    ad_skyscraper_right_aria: "Espace publicitaire latéral droit",
    add_orb_btn_title: "Ajouter un nouvel orbe à la communauté",
    badge_community_title: "Création communautaire",
    badge_modified_title: "Statistiques modifiées",
    btn_edit_orb: "Modifier un Orbe",
    btn_propose_unit_title: "Proposer une nouvelle unité ou création communautaire",
    cancel: "Annuler",
    comm_action_edit: "Éditer",
    comm_action_restore: "Restaurer",
    comm_action_view: "Voir",
    comm_btn_add: "Ajouter",
    comm_btn_add_code_desc: "Partager un nouveau code ou signaler un code expiré.",
    comm_btn_add_code_title: "Proposer un Code Promo",
    comm_btn_add_unit_desc: "Formulaire assisté avec calcul de DPS et aperçu.",
    comm_btn_add_unit_title: "Ajouter une Unité",
    comm_btn_cancel: "Annuler",
    comm_btn_close: "Fermer",
    comm_btn_create_orb: "Créer un Nouvel Orbe",
    comm_btn_create_unit: "Créer & Ajouter l'Unite",
    comm_btn_delete: "Supprimer",
    comm_btn_delete_tip: "Supprimer ce conseil",
    comm_btn_download_json: "Télécharger le fichier JSON",
    comm_btn_edit_existing: "Modifier existant",
    comm_btn_edit_live: "Éditer en direct",
    comm_btn_edit_now: "Modifier cette unité",
    comm_btn_edit_unit_desc: "Corriger les dégâts, le placement ou la description.",
    comm_btn_edit_unit_title: "Modifier une Fiche",
    comm_btn_export: "Exporter Pack JSON",
    comm_btn_hide_tip: "Supprimer ou masquer",
    comm_btn_import: "Importer Pack JSON",
    comm_btn_mark_active: "Marquer actif",
    comm_btn_mark_expired: "Marquer expiré",
    comm_btn_propose_gh: "Proposer sur GitHub",
    comm_btn_propose_orb_github_tip: "Enregistrer puis proposer l'orbe sur GitHub pour le wiki officiel",
    comm_btn_propose_tierlist_gh: "Proposer vos rangs à la communauté ASTD sur GitHub",
    comm_btn_propose_unit_gh_tip: "Enregistrer et ouvrir l'issue GitHub pré-remplie pour le Wiki",
    comm_btn_reset_all: "Tout Réinitialiser",
    comm_btn_restore_official_tierlist: "Restaurer la tier list officielle",
    comm_btn_save_changes: "Enregistrer les Modifications",
    comm_btn_save_code: "Enregistrer le Code",
    comm_btn_save_tip: "Publier le Conseil",
    comm_btn_upload_pc: "Choisir une image sur mon PC...",
    comm_card_orb_desc: "Ajouter un nouvel orbe ou modifier un orbe existant.",
    comm_card_orb_title: "Orbes & Reliques",
    comm_code_help_desc: "Ajoutez un nouveau code actif dès sa publication par les développeurs Roblox pour que tout le monde puisse en profiter.",
    comm_code_help_title: "Partagez un code ASTD :",
    comm_code_required: "Le code promo est obligatoire.",
    comm_code_saved: "Code \"{code}\" enregistré avec succès !",
    comm_code_status_updated: "Statut du code \"{code}\" mis à jour.",
    comm_confirm_delete_unit: "Voulez-vous vraiment retirer l'unité \"{name}\" du wiki ? (Vous pourrez la restaurer à tout moment).",
    comm_confirm_reset_all: "Voulez-vous vraiment restaurer toutes les données officielles ? Toutes vos modifications et ajouts locaux seront effacés.",
    comm_discord_copied: "Résumé formaté pour Discord copié dans le presse-papier !",
    comm_field_anime: "Franchise / Anime",
    comm_field_attack_type: "Zone d'Attaque",
    comm_field_author: "Votre pseudo (optionnel)",
    comm_field_char: "Personnage d'origine",
    comm_field_code_status: "Statut du Code",
    comm_field_code_str: "Code Promotionnel *",
    comm_field_name: "Nom de l'unité *",
    comm_field_overview: "Description / Remarque",
    comm_field_rarity: "Rareté *",
    comm_field_rewards: "Récompenses *",
    comm_field_tip_text: "Votre conseil tactique *",
    comm_field_tip_type: "Catégorie du conseil",
    comm_field_tower_type: "Type de Placement",
    comm_filter_orbs_placeholder: "Rechercher un orbe par nom, effet ou unité requise...",
    comm_github_opened: "Page GitHub ouverte ! Soumettez l'issue pour l'intégration automatique.",
    comm_help_title: "Assistant Débutant :",
    comm_hub_badge: "Espace Collaboratif & Ouvert",
    comm_hub_desc: "Ajoutez ou modifiez des unités et des orbes, partagez de nouveaux codes cadeaux ou donnez vos conseils tactiques. Aucune connaissance technique requise, tout est guidé pas-à-pas et 100% réversible !",
    comm_hub_title: "Hub de Contribution Communautaire ASTD",
    comm_img_preview_imported: "Aperçu importé",
    comm_import_error: "Fichier JSON invalide.",
    comm_import_success: "Pack communautaire importé avec succès !",
    comm_invalid_img_file: "Veuillez sélectionner un fichier image valide (.png, .jpg, .webp).",
    comm_list_codes_title: "Codes Promo de la Communauté",
    comm_list_deleted_orbs_title: "Orbes Masqués / Désactivés",
    comm_list_deleted_title: "Unités Masquées / Désactivées",
    comm_list_orbs_title: "Orbes & Reliques de la Communauté",
    comm_list_units_title: "Fiches d'Unités Personnalisées & Modifiées",
    comm_name_required: "Le nom de l'unité est obligatoire.",
    comm_no_codes: "Aucun code personnalisé ajouté. Utilisez le bouton \"Ajouter\" pour partager un nouveau code promo ASTD !",
    comm_no_orbs: "Aucun orbe personnalisé pour le moment. Vous pouvez créer un nouvel orbe ou modifier un orbe officiel du wiki !",
    comm_no_orbs_available: "Aucun orbe disponible dans la base de données.",
    comm_no_tips_for_unit: "Aucun conseil pour cette unité pour le moment. Soyez le premier à en partager un !",
    comm_no_units: "Aucune unité personnalisée pour le moment. Cliquez sur \"Ajouter\" ou sur \"Modifier cette fiche\" depuis n'importe quelle unité pour commencer !",
    comm_or_image_url: "...ou collez directement un lien d'image Web (URL) :",
    comm_orb_creation_header: "Création d'un nouvel orbe",
    comm_orb_custom_req_opt: "Conditions Spécifiques",
    comm_orb_edit_header: "Modifier un orbe existant ({count})",
    comm_orb_effect_required: "L'effet de l'orbe est obligatoire.",
    comm_orb_effect_unspecified: "(Effet / Bonus à définir)",
    comm_orb_help_desc: "Ajoutez un nouvel orbe ou ajustez les statistiques et compatibilités d'un orbe existant. L'aperçu en direct vous montre immédiatement la carte telle qu'elle figurera dans le compendium.",
    comm_orb_help_title: "Atelier d'Orbes & Reliques :",
    comm_orb_name_required: "Le nom de l'orbe est obligatoire.",
    comm_orb_preview_note: "Cette carte est mise à jour instantanément à chaque frappe de clavier.",
    comm_orb_require_air: "Air",
    comm_orb_require_all: "Toutes",
    comm_orb_require_all_default: "★ Toutes les unités (par défaut)",
    comm_orb_require_ground: "Sol",
    comm_orb_require_hill: "Colline",
    comm_orb_require_unspecified: "Non spécifié",
    comm_ph_author: "Ex: ProGamer99",
    comm_ph_code_rewards: "Ex: 500 Gemmes & 100 Stardust",
    comm_ph_code_str: "Ex: SUB2LONERANGER",
    comm_ph_orb_effect: "Ex: +15% Portée & +10% Dégâts sur tous les paliers...",
    comm_ph_orb_name: "Ex: Fire Orb, Blue Eye Orb...",
    comm_ph_orb_obtain: "Ex: Trial 1 Extreme, Crafting, Raid 2...",
    comm_ph_orb_require: "Ex: All units, 6 Star Units, Ichigo...",
    comm_ph_tip_text: "Ex: Équipez l'orbe Fire Orb pour doubler ses dégâts en Raid 2. Très efficace combiné avec Idol pour...",
    comm_ph_unit_overview: "Présentation de l'unité, capacités notables, obtention...",
    comm_reset_done: "Wiki restauré à l'état officiel d'origine !",
    comm_select_unit_to_edit: "Choisissez une unité à modifier :",
    comm_server_connected: "Serveur Local Connecté",
    comm_server_localstorage: "Mode LocalStorage (En Ligne)",
    comm_special_bonus: "Bonus spécial",
    comm_stat_codes: "Codes",
    comm_stat_tips: "Conseils",
    comm_stat_units: "Unités",
    comm_status_active: "Actif",
    comm_status_expired: "Expiré",
    comm_tip_cat_meta: "Méta & Classement",
    comm_tip_cat_orbs: "Orbe Recommandé",
    comm_tip_cat_other: "Autre astuce",
    comm_tip_cat_strategy: "Stratégie & Synergies",
    comm_tip_required: "Le texte de votre conseil est requis.",
    comm_tip_saved: "Conseil ajouté avec succès !",
    comm_title_add_code: "Proposer un Code Promo",
    comm_title_add_tip: "Ajouter un conseil : {name}",
    comm_title_add_unit: "Créer & Proposer une Nouvelle Unité",
    comm_title_edit_unit: "Modifier la fiche : {name}",
    comm_title_select_unit: "Modifier une unité existante",
    comm_tools_label: "Gestion des données :",
    comm_unit_removed: "Unité \"{name}\" retirée.",
    comm_unit_restored: "Unité restaurée dans l'encyclopédie !",
    comm_unit_saved: "Unité \"{name}\" enregistrée avec succès !",
    comm_upgrade_ability_ph: "Ex: + Max Upgrade, Full AoE...",
    comm_upgrade_cost_placeholder: "Coût palier {idx}",
    comm_upgrade_damage_placeholder: "Dégâts palier {idx}",
    comm_upgrade_deploy_ability_ph: "Capacité initiale...",
    comm_upgrade_effects_title: "Effets palier {idx}",
    comm_upgrade_range_placeholder: "Portée palier {idx}",
    comm_upgrade_spa_placeholder: "SPA palier {idx}",
    comm_upgrade_tier_label: "Palier {level}",
    comm_upgrade_type_title: "Type de tour palier {idx}",
    delete: "Retirer",
    filter_expired_codes_aria: "Filtrer les anciens codes expirés",
    filter_reset_btn: "Réinitialiser le filtre",
    lang_switcher_aria: "Sélection de langue",
    lang_switcher_mobile_aria: "Sélection de langue mobile",
    modal_btn_hide_title: "Masquer cette unité",
    modal_idolbuff_note_tpl: "Simulation <strong class=\"text-sky-300\">Buff Idol (Shine)</strong> active : les dégâts et le DPS ci-dessus intègrent le <strong class=\"text-sky-300\">buff de dégâts d'Idol</strong> au palier maximum (<span id=\"modal-idolbuff-pct\" class=\"font-mono-num text-amber-300\">+{pct}%</span> pour le niveau de carte affiché). Seules les unités placées dans la portée d'Idol en bénéficient.",
    modal_level_note_tpl: "Stats avec <strong class=\"text-sky-300\">niveau de carte maximum (175)</strong> — bonus officiel du wiki : dégâts <span class=\"font-mono-num text-amber-300\">×2,142</span>, portée <span class=\"font-mono-num text-amber-300\">×1,2</span>, SPA inchangé.",
    modal_unit_added_date_empty: "Ajoutée le —",
    modal_unit_overview_ph: "Description de l'unité...",
    nav_tierlist_title: "Consulter la Tier List officielle et personnalisée",
    nav_units_title: "Consulter l'encyclopédie des unités",
    quick_search_title: "Rechercher une unité ou un anime (Ctrl + K)",
    search_placeholder: "Rechercher par nom d'unité ou anime...",
    team_search_input_aria: "Rechercher une unité à ajouter au deck",
    tierlist_add_unit_title: "+ Ajouter une unité à : {cat}",
    tierlist_already_in_cat: "Cette unité est déjà dans cette catégorie",
    tierlist_btn_save_changes: "Enregistrer",
    tierlist_cat_created_toast: "Catégorie \"{name}\" créée avec succès !",
    tierlist_cat_deleted_toast: "Catégorie \"{name}\" supprimée.",
    tierlist_cat_exists: "La catégorie \"{name}\" existe déjà dans cette Tier List.",
    tierlist_cat_rename_exists: "Une catégorie intitulée \"{name}\" existe déjà.",
    tierlist_cat_renamed_toast: "Catégorie renommée en \"{name}\" !",
    tierlist_empty_all: "Aucune catégorie dans cette tier list.",
    tierlist_empty_hint: "Cliquez sur « Nouvelle Catégorie » pour commencer à organiser vos unités.",
    tierlist_export_success: "Fichier JSON de Tier List exporté avec succès !",
    tierlist_filter_all: "Tous",
    tierlist_import_invalid: "Format de fichier invalide (doit contenir un dictionnaire de catégories).",
    tierlist_import_success: "Tier List importée avec succès !",
    tierlist_manage_unit_title: "Gérer \"{name}\" dans les Tier Lists",
    tierlist_move_unit_title: "Déplacer \"{name}\" vers une autre catégorie",
    tierlist_moved_pos_toast: "\"{name}\" déplacé vers {target} (rang {rank}) !",
    tierlist_new_cat_ph: "Ex: S+ (Transcendant), GOD TIER, Méta Donjons...",
    tierlist_new_cat_title: "Créer une nouvelle catégorie méta",
    tierlist_no_other_cat: "Aucune autre catégorie disponible.",
    tierlist_no_search_results: "Aucune catégorie ou unité ne correspond à :",
    tierlist_pos_updated_toast: "Position de \"{name}\" mise à jour dans {target} !",
    tierlist_preset_standard_toast: "Modèle Standard (S+ / S / A / B / C / D) activé !",
    tierlist_rename_cat_title: "Renommer la catégorie : {name}",
    tierlist_search_unit_ph: "Rechercher par nom d'unité ou anime...",
    tierlist_unit_added_toast: "Unité {name} ajoutée à {cat} !",
    tierlist_unit_already_in: "L'unité {name} est déjà dans {cat}.",
    tierlist_unit_cats_updated: "Catégories de \"{name}\" mises à jour !",
    tierlist_unit_moved_toast: "\"{name}\" déplacé de {src} vers {target} !",
    tierlist_unit_removed_toast: "Unité {name} retirée de {cat}.",
    tierlist_units_found: "{count} unité(s) trouvée(s)",
    units_th_cost_title: "Somme du déploiement et de toutes les améliorations",
    units_th_damage_title: "Dégâts au palier d'amélioration maximal",
    units_th_dps_title: "DPS : Dégâts Par Seconde au palier maximal",
    units_th_spa_title: "SPA : Secondes Par Attaque au palier maximal",
    wiki_link_nav_aria: "Consulter le wiki Fandom officiel ASTD (nouvelle fenêtre)",
  },
  en: {
    // Header, brand & nav
    skip_to_content: "Skip to main content",
    brand_subtitle: "Database & Meta Hub",
    brand_aria: "ASTD Wiki Home",
    quick_search_placeholder: "Search unit (Ctrl+K)...",
    quick_search_btn: "Search...",
    quick_search_aria: "Search unit",
    quick_search_sr: "Search unit",
    wiki_sync_label: "Wiki sync:",
    units_label: "Units",
    orbs_label: "Orbs",
    codes_autoupdate: "Active",
    latest_code_label: "Latest code:",
    copy_btn: "Copy",
    copy_code_aria: "Copy latest code",
    lang_choice: "Language",
    wiki_link_title: "Visit official All Star Tower Defense Fandom wiki",
    wiki_link_aria: "Open official Fandom wiki in a new tab",
    menu_toggle_aria: "Open navigation menu",
    nav_main_aria: "Main navigation",
    nav_units: "Units",
    nav_tierlist: "Tier List",
    nav_codes: "Codes",
    nav_orbs: "Orbs",
    nav_gamemodes: "Modes",
    nav_gamemodes_short: "Modes",
    nav_teambuilder: "Deck",
    nav_deck_short: "Deck",
    nav_compare: "Compare",
    nav_compare_short: "Versus",
    nav_community: "Community",
    nav_community_short: "Commu",
    nav_mobile_aria: "Mobile menu",
    mobile_search_placeholder: "Search unit...",
    drawer_units: "Towers & Units",
    drawer_tierlist: "Official Tier List",
    drawer_codes: "Active Codes",
    drawer_orbs: "Orbs Compendium",
    drawer_gamemodes: "Game Modes & Raids",
    drawer_teambuilder: "Deck Builder (6 Slots)",
    drawer_compare: "Tactical Pro Comparator",
    drawer_community: "Community Hub",
    btn_propose_unit: "Propose Unit",
    btn_propose_unit_short: "Add",
    comm_btn_add_code_nav: "Propose Code",
    community_h1: "Community Space & Contributions",
    comm_stat_tierlist: "Tier List",
    comm_card_tierlist_title: "Tier Lists & Meta",
    comm_card_tierlist_desc: "Drag & drop units, custom tiers and presets.",
    comm_btn_edit_tierlist: "Edit",
    comm_btn_view_tierlist: "View",
    comm_tierlist_section_title: "Collaborative Meta Tier List",
    comm_tierlist_status_custom: "Custom",
    comm_tierlist_status_official: "Official",
    comm_tierlist_custom_desc: "You are currently using a custom version of the Tier List with your own rankings and categories.",
    comm_tierlist_official_desc: "The official Wiki Tier List is currently active. You can freely customize it by drag and drop, create new categories, and propose your changes online!",
    modal_btn_edit: "Edit",
    modal_btn_hide: "Hide",
    modal_community_tips_title: "Community Tips & Insights",
    btn_add_tip: "Share a tip",
    badge_community: "Community",
    badge_modified: "Modified",
    btn_mark_expired: "Report expired",
    btn_mark_expired_title: "Report this code as expired",
    comm_upgrades_section_title: "Upgrade Tiers (Manual Input)",
    comm_upgrades_section_desc: "Manually enter the cost, damage, range and SPA for each tier. No automatic multiplier is forced.",
    comm_btn_add_tier: "Add upgrade tier",
    comm_tier_deploy: "0 (Deployment)",
    comm_del_tier: "Delete this tier",
    comm_tier_required: "Please provide at least one upgrade tier.",
    comm_help_desc_upgrades: "Fill in the general information and manually enter each upgrade tier. Total cost and max stats are derived directly from your tiers.",
    comm_field_image: "Unit Image",
    comm_btn_browse_pc: "📁 Import from PC",
    comm_or_enter_url: "or enter a web image URL below:",
    comm_img_from_pc_loaded: "PC file imported",
    comm_img_remove: "Remove this image",
    comm_th_tower_type: "Tower Type",
    comm_type_unchanged: "— Unchanged —",
    comm_type_ground: "🌱 Ground",
    comm_type_hill: "🏔️ Hill",
    comm_type_hybrid: "⚡ Hybrid",
    comm_type_air: "🦅 Air",
    comm_type_hybrid_badge: "Hybrid",
    comm_type_hill_badge: "Hill",
    comm_type_air_badge: "Air",
    comm_type_ground_badge: "Ground",

    // Units Tab & Filters
    units_h1: "ASTD Towers & Units Database",
    units_filter_aria: "Unit search filters",
    filter_search_sr: "Search unit by name",
    filter_search_aria: "Search by unit name or anime franchise",
    filter_search_placeholder: "Unit name or franchise...",
    clear_search_aria: "Clear search",
    filter_sort_sr: "Sort units",
    filter_sort_aria: "Unit sorting criteria",
    sort_recent_desc: "Newest first",
    sort_star_desc: "Rarity (Descending)",
    sort_star_asc: "Rarity (Ascending)",
    sort_dps_desc: "Max DPS (Descending)",
    sort_dmg_desc: "Max Damage (Descending)",
    sort_cost_asc: "Total Cost (Lowest)",
    sort_name_asc: "Name (A → Z)",
    filter_tower_type_sr: "Filter by tower type",
    filter_tower_type_aria: "Tower placement type",
    filter_type_all: "All types",
    filter_type_ground: "Ground",
    filter_type_air: "Air",
    filter_type_hill: "Hill",
    filter_type_hybrid: "Hybrid (Ground & Air)",
    filter_anime_sr: "Filter by franchise",
    filter_anime_aria: "Franchise or anime origin",
    filter_anime_all: "All franchises",
    filter_obtainable_title: "Hide unobtainable or expired units",
    filter_obtainable: "Obtainable only",
    view_mode_aria: "List display mode",
    view_grid_title: "Tactical cards view",
    view_grid_aria: "Show tactical cards grid",
    view_grid: "Grid",
    view_table_title: "Detailed table view",
    view_table_aria: "Show Pro style detailed table",
    view_table: "Table",
    filter_star_aria: "Filter by star rarity",
    star_all: "All",
    results_label: "Results:",
    units_grid_aria: "Defense units grid",
    load_more_aria: "Load next units",
    load_more_units: "Load more units",
    units_table_aria: "Comparative defense units table",
    th_unit: "Unit & Franchise",
    th_rarity: "Rarity",
    th_type: "Type",
    th_max_damage: "Max Damage",
    th_range: "Range",
    th_spa: "SPA",
    th_max_dps: "Max DPS",
    th_total_cost: "Max Cost",
    th_action: "Actions",

    // Dynamic strings - Units List & Cards
    unit_singular: "unit",
    unit_plural: "units",
    badge_new: "New",
    badge_unobtainable: "Unobtainable",
    btn_card: "Details",
    btn_compare_title: "Compare this unit",
    btn_add_deck_title: "Add to deck",
    no_matching_units: "No units match your filters",
    no_results_for: "No results for \"{searchVal}\".",
    no_results_combo: "No units available with the selected rarity and type.",
    reset_filters: "Reset filters",
    table_view_sheet: "View unit details.",
    card_click_inspect: "Click to inspect.",
    wiki_page_created_on: "Wiki page created on",
    dmg_max_tooltip: "Damage at maximum upgrade tier",
    dps_max_tooltip: "Damage Per Second at maximum tier",
    range_max_tooltip: "Maximum attack range",
    spa_tooltip: "SPA: Seconds Per Attack (delay between attacks)",
    hud_range_short: "Range",

    // Modal Unit Details
    modal_close_aria: "Close unit sheet",
    modal_card_level: "Card level:",
    modal_level_group_aria: "Card level for statistics",
    modal_idol_toggle_title: "Simulate damage buff provided by Idol (Shine ability)",
    buff_idol_label: "Idol Buff",
    hud_max_dmg: "Max Damage",
    hud_dmg_scale: "Damage scale from initial to max tier",
    hud_max_dps: "Max Estimated DPS",
    hud_tower_type: "Placement Type",
    hud_attack_type: "Attack Area",
    hud_deploy_cost: "Deployment",
    hud_total_cost: "Total Max Cost",
    modal_fandom_title: "Open official Fandom page for this unit",
    modal_fandom_aria: "View official wiki page on Fandom (new tab)",
    modal_btn_deck: "Add to Deck",
    modal_btn_deck_aria: "Add this unit to your squad",
    modal_btn_compare: "Compare",
    modal_btn_compare_title: "Compare this unit with another character",
    modal_btn_compare_aria: "Open comparator with this unit",
    modal_obtain_title: "Obtainment Source",
    modal_evo_title: "Unit Evolution",
    modal_preevo_title: "Pre-evolutions",
    btn_show: "Show",
    btn_hide: "Hide",
    modal_abilities_title: "Special Abilities, Passives & Leader",
    modal_upgrades_title: "Upgrade Progression (In-Game Tiers)",
    th_level: "Tier",
    th_cost: "Cost",
    th_damage: "Damage",
    th_buff: "Buff",
    th_buff_title: "Damage buff provided to allied units in range (Shine ability)",
    th_effect: "Effects / Abilities",
    attack_type_tooltip: "AoE: Area of Effect (area damaged per attack: circle, cone, line...)",
    unknown: "Unknown",
    anime_prefix: "Anime:",
    char_prefix: "Character:",
    origin_all_star: "Origin: All Star Character",
    added_on: "Added on",
    added_on_tooltip: "Wiki page created on {date} — New badge displayed for 30 days",
    no_overview: "No detailed description recorded for this unit.",
    evolution_of: "Evolution of:",
    can_evolve_into: "Can evolve into",
    evolves_into: "Evolves into:",
    required_materials: "Required materials:",
    units_evolving_into: "Unit{s} evolving into",
    ability_manual: "Manual Ability",
    ability_passive: "Special Passive",
    ability_leader: "Leader",
    ability_default: "Ability",
    upgrade_effects_prefix: "Upgrade effects for tier",
    view_full_ability: "View full ability details",
    upgrades_empty: "Detailed upgrade stats not documented for this unit.",
    tag_lvl175: "card level 175",
    tag_idol: "Idol buff +{pct}%",
    upg_buff_tooltip: "Damage buff provided to units in range (Shine ability) — {lvl}",
    upg_buff_none: "No buff at this tier (Your Star replaces Shine)",
    click_read_ability: "Click to read effects and ability details",
    lvl_175_card: "card level 175",
    lvl_1_card: "card level 1",

    // Tier List
    tierlist_heading: "Official ASTD Tier List",
    tierlist_subheading: "Official ranking of top units by competitive category. Edit, create and reorder tiers live!",
    tierlist_region_aria: "Official ASTD Tier List",
    tierlist_loading: "Loading tier list...",
    tierlist_btn_edit: "Edit Tier List",
    tierlist_btn_edit_active: "View Mode",
    tierlist_btn_edit_title: "Toggle edit mode for categories and units",
    tierlist_btn_add_cat: "New Category",
    tierlist_btn_add_cat_title: "Create a new meta category",
    tierlist_opt_official: "Official Meta Tier List",
    tierlist_opt_standard: "Standard Tier Maker (S+ / S / A / B / C / D)",
    tierlist_select_preset_title: "Switch tier list template",
    tierlist_btn_github: "Submit to Wiki",
    tierlist_btn_github_title: "Submit your modifications to the Wiki via GitHub",
    tierlist_btn_reset: "Reset",
    tierlist_btn_reset_title: "Restore original official Tier List",
    tierlist_btn_export: "Export",
    tierlist_btn_export_title: "Export as JSON",
    tierlist_btn_import: "Import",
    tierlist_btn_import_title: "Import Tier List JSON file",
    tierlist_search_placeholder: "Filter a unit or category...",
    tierlist_stat_cats: "categories",
    tierlist_stat_units: "ranked units",
    tierlist_edit_active: "Edit Mode Active:",
    tierlist_edit_desc: "Drag and drop cards to reorder or move between categories. Click + to add a unit or ✕ to remove.",
    tierlist_btn_save: "Save",
    tierlist_btn_save_title: "Save modifications locally or to server",
    tierlist_btn_close_edit: "Done Editing",
    tierlist_cat_add_unit: "+ Add a unit",
    tierlist_cat_rename: "Rename",
    tierlist_cat_delete: "Delete category",
    tierlist_unit_remove: "Remove from this category",
    tierlist_unit_move: "Move to...",
    tierlist_empty_cat: "No units in this category. Click '+ Add' to insert or drag and drop a unit here.",
    modal_btn_tier: "Manage in Tier List",
    modal_btn_tier_title: "Manage or add this unit to Tier List categories",
    tierlist_confirm_reset: "Do you really want to reset the Tier List to its official version? All local changes will be cleared.",
    tierlist_confirm_delete_cat: "Permanently delete category '{name}' and remove its ranked units?",
    tierlist_saved_toast: "Tier List saved successfully!",
    tierlist_reset_toast: "Tier List restored to official state.",
    badge_modified_community: "Modified",

    // Codes
    codes_heading: "Active & Verified Gift Codes",
    codes_subheading: "All codes are regularly tested in-game. Click Copy to claim rewards.",
    codes_active_aria: "Active gift codes",
    codes_expired_heading: "Expired / Inactive Codes",
    codes_filter_expired_sr: "Filter expired codes",
    codes_filter_expired_placeholder: "Search expired code...",
    codes_filter_expired_aria: "Search expired codes history",
    codes_expired_region_aria: "Expired gift codes list",
    code_verified_active: "Verified & Active",
    code_recent: "Recent",
    code_rewards_label: "Rewards:",
    btn_copy_code: "Copy code",
    copied: "Copied!",
    toast_code_copied: "Code \"{code}\" copied!",
    no_expired_codes: "No expired codes match this search.",

    // Orbs
    orbs_heading: "Orbs Compendium",
    orbs_subheading: "Stat bonuses and equip requirements for orbs.",
    search_orbs_sr: "Search an orb",
    search_orbs_placeholder: "Filter an orb (name, effect, compatible unit)...",
    search_orbs_aria: "Filter orbs by name, effect or required unit",
    orbs_grid_aria: "Orbs compendium",
    all_units_badge: "★ All units",
    universal_orb_title: "Equippable by all units",
    restricted_orb_title: "Reserved for this unit (or its family)",
    stat_bonus_label: "Stat bonus:",
    special_bonus: "Special bonus",
    obtain_label: "Obtainment:",
    compatible_label: "Compatible:",
    no_orbs_found: "No orbs found",
    no_orbs_query: "No orbs match the search \"{q}\".",
    clear_search: "Clear search",
    comm_stat_orbs: "Orbs",
    add_orb_btn: "Add an Orb",
    comm_badge_orb: "Community",
    comm_btn_edit_orb_title: "Edit this orb",
    comm_orb_new_badge: "Local creation",
    comm_orb_mod_badge: "Locally modified",
    comm_title_add_orb: "Create & Propose a New Orb",
    comm_title_edit_orb: "Edit Orb: {name}",
    comm_title_select_orb: "Edit an Existing Orb",
    comm_select_orb_to_edit: "Select an orb to edit:",
    comm_btn_edit_orb_now: "Edit this orb",
    comm_btn_save_orb_local: "Save Locally",
    comm_btn_propose_orb_github: "Save & Propose to Official Wiki",
    comm_field_orb_name: "Orb Name *",
    comm_field_orb_effect: "Effect / Stat Bonus *",
    comm_field_orb_require: "Compatibility (Requirement) *",
    comm_field_orb_obtain: "Obtainment Method",
    comm_field_orb_image: "Orb Illustration (Local file or URL)",
    comm_preview_live_title: "Live Preview",
    comm_preview_badge: "Live Preview",
    comm_orb_saved: "Orb \"{name}\" saved successfully!",
    comm_orb_removed: "Orb \"{name}\" removed.",
    comm_orb_restored: "Orb \"{name}\" restored!",
    comm_confirm_delete_orb: "Are you sure you want to remove the orb \"{name}\"? (You can restore it anytime).",

    // Gamemodes
    gamemodes_heading: "Game Modes & Raids",
    gamemodes_subheading: "Strategic guides and rewards for different game modes.",
    gamemodes_grid_aria: "Game modes and raids",
    mode_rewards_label: "Rewards:",

    // Team Builder
    teambuilder_heading: "Tactical Team Builder (6-Slot Deck)",
    teambuilder_subheading: "Analyze coverage, cost and synergy of your squad.",
    clear_team_btn: "Clear deck",
    clear_team_aria: "Remove all units from deck",
    team_slots_aria: "Team deck slots",
    team_stat_deploy_label: "Total Deploy Cost",
    team_stat_total_label: "Max Upgrade Cost",
    team_stat_dps_label: "Total Estimated DPS",
    team_coverage_title: "Strategic Coverage",
    team_economy_title: "Economy & Control",
    team_picker_title: "Add a Unit to Deck",
    team_picker_sr: "Search a tower to add to deck",
    team_picker_placeholder: "Search among 6★ and 7★ units...",
    team_picker_aria: "Search field to add a unit to deck",
    team_picker_grid_aria: "Available units selection for deck",
    slot_empty_sr: "Slot {n} is empty. Click to search a tower.",
    slot_label: "SLOT {n}",
    add_a_tower: "Add a tower",
    remove_from_deck: "Remove {name} from deck",
    dep_short: "Dep",
    team_anti_ground: "Anti-Ground",
    team_anti_air: "Anti-Air",
    team_economy: "Economy / Farm",
    team_support: "Support / Control",
    btn_add: "+ Add",
    toast_team_full: "Your 6-unit deck is full!",
    toast_already_in_team: "{name} is already in the deck!",
    toast_added_to_team: "{name} added to slot {slot}",
    toast_removed_from_team: "{name} removed from deck",
    toast_team_cleared: "Deck has been cleared",

    // Comparator
    compare_heading: "Tactical Pro Comparator (Versus)",
    compare_subheading: "Compare two units face-to-face: DPS, cost efficiency ($/DPS), range, attack rate, and automated verdict.",
    compare_level_group_aria: "Card level for comparison",
    compare_idol_buff_title: "Simulate maximum damage buff provided by Idol (+250%)",
    compare_slot_a_title: "Unit A:",
    compare_slot_a_sr: "Search unit A",
    compare_slot_a_placeholder: "Search unit A (e.g. Demon of Emotion, Kura...)",
    compare_remove_btn: "Clear",
    compare_swap_aria: "Swap unit A and unit B",
    compare_swap_title: "Swap unit A and unit B",
    compare_reset_aria: "Reset both selected units",
    compare_reset_title: "Reset comparison",
    compare_slot_b_title: "Unit B:",
    compare_slot_b_sr: "Search unit B",
    compare_slot_b_placeholder: "Search unit B (e.g. Stampede, Joke Da Fool...)",
    compare_popular_label: "Popular duels:",
    compare_empty_title: "Select 2 characters to compare",
    compare_empty_desc: "Use the search inputs above to choose two units to compare, or start a popular duel in one click.",
    compare_choose_second: "— select the 2nd unit",
    compare_no_unit: "No unit selected yet.",
    loading_units: "Loading units...",
    no_units_found: "No units found",
    toast_added_to_compare: "\"{name}\" added to comparator",
    dps_max_a: "Max DPS (A)",
    dmg_max_a: "Max Damage (A)",
    dps_max_b: "Max DPS (B)",
    dmg_max_b: "Max Damage (B)",
    verdict_title: "Tactical Verdict & Summary",
    verdict_subtitle: "Automated comparative analysis",
    pillar_dps: "💥 Raw DPS",
    pillar_spa: "⚡ Attack Rate (SPA)",
    pillar_range: "🎯 Range",
    pillar_cost: "💰 Efficiency ($/DPS)",
    verdict_diff: "difference",
    verdict_faster: "faster",
    verdict_radius: "radius advantage",
    verdict_ratio: "better ratio",
    tie: "Tie",
    compare_table_title: "Comparative Stats Table (Max Tier)",
    compare_abilities_title: "Special Abilities, Passives & Leader",
    no_abilities_documented: "No special abilities documented.",
    metric_dmg_max: "Max Damage",
    metric_dps_max: "Estimated Max DPS",
    metric_range: "Attack Range",
    metric_spa: "SPA (Attack Rate)",
    metric_deploy_cost: "Deployment Cost",
    metric_total_cost: "Total Upgrade Cost",
    metric_cost_per_dps: "Cost per DPS point ($/DPS)",
    metric_upgrades_count: "Upgrade Tiers",
    note_spa: "Lower = faster",
    note_deploy: "Lower = easier to place",
    note_total: "Lower = maxed earlier",
    note_efficiency: "Lower = more cost effective",
    note_upgrades: "Fewer tiers = maxed faster",
    tiers_word: "tiers",

    // Footer
    footer_desc: "Unofficial database and tactical meta hub for All Star Tower Defense on Roblox.",
    footer_sync: "Automatic synchronization with the official Fandom wiki.",
    db_label: "Data:",
    footer_last_updated_tpl: "Last wiki sync: {date} ({count} units)",

    // Welcome & Ads Support Notice Modal
    ads_notice_title: "Welcome to ASTD Wiki",
    ads_notice_desc: "A few discreet ads are displayed on the site to support my work. They are placed so as not to disturb your browsing experience.",
    ads_notice_btn: "Continue",

    ad_label: "Advertisement",
    ad_skyscraper_left_aria: "Left sidebar advertisement space",
    ad_skyscraper_right_aria: "Right sidebar advertisement space",
    add_orb_btn_title: "Add a new orb to the community",
    badge_community_title: "Community creation",
    badge_modified_title: "Modified statistics",
    btn_edit_orb: "Edit an Orb",
    btn_propose_unit_title: "Propose a new unit or community creation",
    cancel: "Cancel",
    comm_action_edit: "Edit",
    comm_action_restore: "Restore",
    comm_action_view: "View",
    comm_btn_add: "Add",
    comm_btn_add_code_desc: "Share a new code or report an expired code.",
    comm_btn_add_code_title: "Submit a Promo Code",
    comm_btn_add_unit_desc: "Guided form with DPS calculation and preview.",
    comm_btn_add_unit_title: "Add a Unit",
    comm_btn_cancel: "Cancel",
    comm_btn_close: "Close",
    comm_btn_create_orb: "Create a New Orb",
    comm_btn_create_unit: "Create & Add Unit",
    comm_btn_delete: "Delete",
    comm_btn_delete_tip: "Delete this tip",
    comm_btn_download_json: "Download JSON file",
    comm_btn_edit_existing: "Edit existing",
    comm_btn_edit_live: "Live edit",
    comm_btn_edit_now: "Edit this unit",
    comm_btn_edit_unit_desc: "Fix damage, placement or description.",
    comm_btn_edit_unit_title: "Edit a Card",
    comm_btn_export: "Export JSON Pack",
    comm_btn_hide_tip: "Delete or hide",
    comm_btn_import: "Import JSON Pack",
    comm_btn_mark_active: "Mark active",
    comm_btn_mark_expired: "Mark expired",
    comm_btn_propose_gh: "Submit to GitHub",
    comm_btn_propose_orb_github_tip: "Save and propose the orb on GitHub for the official wiki",
    comm_btn_propose_tierlist_gh: "Propose your rankings to the ASTD community on GitHub",
    comm_btn_propose_unit_gh_tip: "Save and open pre-filled GitHub issue for the Wiki",
    comm_btn_reset_all: "Reset All",
    comm_btn_restore_official_tierlist: "Restore official tier list",
    comm_btn_save_changes: "Save Changes",
    comm_btn_save_code: "Save Code",
    comm_btn_save_tip: "Publish Tip",
    comm_btn_upload_pc: "Choose an image from my PC...",
    comm_card_orb_desc: "Add a new orb or modify an existing orb.",
    comm_card_orb_title: "Orbs & Relics",
    comm_code_help_desc: "Add a new active code as soon as Roblox developers release it so everyone can enjoy it.",
    comm_code_help_title: "Share an ASTD code:",
    comm_code_required: "Promo code is required.",
    comm_code_saved: "Code \"{code}\" saved successfully!",
    comm_code_status_updated: "Code \"{code}\" status updated.",
    comm_confirm_delete_unit: "Do you really want to remove unit \"{name}\" from the wiki? (You can restore it anytime).",
    comm_confirm_reset_all: "Do you really want to restore all official data? All your local modifications and additions will be cleared.",
    comm_discord_copied: "Discord-formatted summary copied to clipboard!",
    comm_field_anime: "Franchise / Anime",
    comm_field_attack_type: "Attack Area",
    comm_field_author: "Your username (optional)",
    comm_field_char: "Original Character",
    comm_field_code_status: "Code Status",
    comm_field_code_str: "Promo Code *",
    comm_field_name: "Unit Name *",
    comm_field_overview: "Description / Remarks",
    comm_field_rarity: "Rarity *",
    comm_field_rewards: "Rewards *",
    comm_field_tip_text: "Your tactical tip *",
    comm_field_tip_type: "Tip Category",
    comm_field_tower_type: "Placement Type",
    comm_filter_orbs_placeholder: "Search an orb by name, effect or required unit...",
    comm_github_opened: "GitHub page opened! Submit the issue for automated integration.",
    comm_help_title: "Beginner Assistant:",
    comm_hub_badge: "Collaborative & Open Space",
    comm_hub_desc: "Add or modify units and orbs, share new gift codes or submit tactical tips. No technical knowledge required, everything is guided step-by-step and 100% reversible!",
    comm_hub_title: "ASTD Community Contribution Hub",
    comm_img_preview_imported: "Imported preview",
    comm_import_error: "Invalid JSON file.",
    comm_import_success: "Community pack imported successfully!",
    comm_invalid_img_file: "Please select a valid image file (.png, .jpg, .webp).",
    comm_list_codes_title: "Community Promo Codes",
    comm_list_deleted_orbs_title: "Hidden / Disabled Orbs",
    comm_list_deleted_title: "Hidden / Disabled Units",
    comm_list_orbs_title: "Community Orbs & Relics",
    comm_list_units_title: "Custom & Modified Unit Cards",
    comm_name_required: "Unit name is required.",
    comm_no_codes: "No custom codes added. Use the \"Add\" button to share a new ASTD promo code!",
    comm_no_orbs: "No custom orbs yet. You can create a new orb or edit an official wiki orb!",
    comm_no_orbs_available: "No orbs available in the database.",
    comm_no_tips_for_unit: "No tips for this unit yet. Be the first to share one!",
    comm_no_units: "No custom units yet. Click \"Add\" or \"Edit this card\" from any unit to get started!",
    comm_or_image_url: "...or paste a direct Web image link (URL):",
    comm_orb_creation_header: "Creating a new orb",
    comm_orb_custom_req_opt: "Specific Conditions",
    comm_orb_edit_header: "Edit an existing orb ({count})",
    comm_orb_effect_required: "Orb effect is required.",
    comm_orb_effect_unspecified: "(Effect / Bonus to define)",
    comm_orb_help_desc: "Add a new orb or tweak stats and compatibility of an existing orb. Live preview instantly shows the card as it will appear in the compendium.",
    comm_orb_help_title: "Orbs & Relics Workshop:",
    comm_orb_name_required: "Orb name is required.",
    comm_orb_preview_note: "This card is updated instantly on every keystroke.",
    comm_orb_require_air: "Air",
    comm_orb_require_all: "All",
    comm_orb_require_all_default: "★ All units (default)",
    comm_orb_require_ground: "Ground",
    comm_orb_require_hill: "Hill",
    comm_orb_require_unspecified: "Unspecified",
    comm_ph_author: "Ex: ProGamer99",
    comm_ph_code_rewards: "Ex: 500 Gems & 100 Stardust",
    comm_ph_code_str: "Ex: SUB2LONERANGER",
    comm_ph_orb_effect: "Ex: +15% Range & +10% Damage on all tiers...",
    comm_ph_orb_name: "Ex: Fire Orb, Blue Eye Orb...",
    comm_ph_orb_obtain: "Ex: Trial 1 Extreme, Crafting, Raid 2...",
    comm_ph_orb_require: "Ex: All units, 6 Star Units, Ichigo...",
    comm_ph_tip_text: "Ex: Equip Fire Orb to double damage in Raid 2. Very effective combined with Idol for...",
    comm_ph_unit_overview: "Unit overview, notable abilities, obtainment...",
    comm_reset_done: "Wiki restored to original official state!",
    comm_select_unit_to_edit: "Choose a unit to edit:",
    comm_server_connected: "Local Server Connected",
    comm_server_localstorage: "LocalStorage Mode (Online)",
    comm_special_bonus: "Special bonus",
    comm_stat_codes: "Codes",
    comm_stat_tips: "Tips",
    comm_stat_units: "Units",
    comm_status_active: "Active",
    comm_status_expired: "Expired",
    comm_tip_cat_meta: "Meta & Ranking",
    comm_tip_cat_orbs: "Recommended Orb",
    comm_tip_cat_other: "Other tip",
    comm_tip_cat_strategy: "Strategy & Synergies",
    comm_tip_required: "Tip text is required.",
    comm_tip_saved: "Tip added successfully!",
    comm_title_add_code: "Submit a Promo Code",
    comm_title_add_tip: "Add a tip: {name}",
    comm_title_add_unit: "Create & Propose a New Unit",
    comm_title_edit_unit: "Edit unit card: {name}",
    comm_title_select_unit: "Edit an existing unit",
    comm_tools_label: "Data management:",
    comm_unit_removed: "Unit \"{name}\" removed.",
    comm_unit_restored: "Unit restored in the encyclopedia!",
    comm_unit_saved: "Unit \"{name}\" saved successfully!",
    comm_upgrade_ability_ph: "Ex: + Max Upgrade, Full AoE...",
    comm_upgrade_cost_placeholder: "Cost tier {idx}",
    comm_upgrade_damage_placeholder: "Damage tier {idx}",
    comm_upgrade_deploy_ability_ph: "Initial ability...",
    comm_upgrade_effects_title: "Effects tier {idx}",
    comm_upgrade_range_placeholder: "Range tier {idx}",
    comm_upgrade_spa_placeholder: "SPA tier {idx}",
    comm_upgrade_tier_label: "Tier {level}",
    comm_upgrade_type_title: "Tower type tier {idx}",
    delete: "Remove",
    filter_expired_codes_aria: "Filter expired codes",
    filter_reset_btn: "Reset filter",
    lang_switcher_aria: "Language selection",
    lang_switcher_mobile_aria: "Mobile language selection",
    modal_btn_hide_title: "Hide this unit",
    modal_idolbuff_note_tpl: "Simulation <strong class=\"text-sky-300\">Idol Buff (Shine)</strong> active: damage and DPS above include the <strong class=\"text-sky-300\">Idol damage buff</strong> at max tier (<span id=\"modal-idolbuff-pct\" class=\"font-mono-num text-amber-300\">+{pct}%</span> for displayed card level). Only units within Idol's range benefit.",
    modal_level_note_tpl: "Stats with <strong class=\"text-sky-300\">max card level (175)</strong> — official wiki bonus: damage <span class=\"font-mono-num text-amber-300\">×2.142</span>, range <span class=\"font-mono-num text-amber-300\">×1.2</span>, unchanged SPA.",
    modal_unit_added_date_empty: "Added on —",
    modal_unit_overview_ph: "Unit description...",
    nav_tierlist_title: "Browse official and custom Tier List",
    nav_units_title: "Browse the units encyclopedia",
    quick_search_title: "Search a unit or anime (Ctrl + K)",
    search_placeholder: "Search by unit name or anime...",
    team_search_input_aria: "Search a unit to add to the deck",
    tierlist_add_unit_title: "+ Add a unit to: {cat}",
    tierlist_already_in_cat: "This unit is already in this category",
    tierlist_btn_save_changes: "Save",
    tierlist_cat_created_toast: "Category \"{name}\" created successfully!",
    tierlist_cat_deleted_toast: "Category \"{name}\" deleted.",
    tierlist_cat_exists: "Category \"{name}\" already exists in this Tier List.",
    tierlist_cat_rename_exists: "A category named \"{name}\" already exists.",
    tierlist_cat_renamed_toast: "Category renamed to \"{name}\"!",
    tierlist_empty_all: "No categories in this tier list.",
    tierlist_empty_hint: "Click 'New Category' to start organizing your units.",
    tierlist_export_success: "Tier List JSON file exported successfully!",
    tierlist_filter_all: "All",
    tierlist_import_invalid: "Invalid file format (must contain a category dictionary).",
    tierlist_import_success: "Tier List imported successfully!",
    tierlist_manage_unit_title: "Manage \"{name}\" in Tier Lists",
    tierlist_move_unit_title: "Move \"{name}\" to another category",
    tierlist_moved_pos_toast: "\"{name}\" moved to {target} (rank {rank})!",
    tierlist_new_cat_ph: "Ex: S+ (Transcendent), GOD TIER, Dungeon Meta...",
    tierlist_new_cat_title: "Create a new meta category",
    tierlist_no_other_cat: "No other category available.",
    tierlist_no_search_results: "No category or unit matches:",
    tierlist_pos_updated_toast: "Position of \"{name}\" updated in {target}!",
    tierlist_preset_standard_toast: "Standard Template (S+ / S / A / B / C / D) activated!",
    tierlist_rename_cat_title: "Rename category: {name}",
    tierlist_search_unit_ph: "Search by unit name or anime...",
    tierlist_unit_added_toast: "Unit {name} added to {cat}!",
    tierlist_unit_already_in: "Unit {name} is already in {cat}.",
    tierlist_unit_cats_updated: "Categories for \"{name}\" updated!",
    tierlist_unit_moved_toast: "\"{name}\" moved from {src} to {target}!",
    tierlist_unit_removed_toast: "Unit {name} removed from {cat}.",
    tierlist_units_found: "{count} unit(s) found",
    units_th_cost_title: "Sum of deployment and all upgrade costs",
    units_th_damage_title: "Damage at max upgrade tier",
    units_th_dps_title: "DPS: Damage Per Second at max tier",
    units_th_spa_title: "SPA: Seconds Per Attack at max tier",
    wiki_link_nav_aria: "Open official ASTD Fandom wiki (new tab)"
  }
};

function t(key, fallback = '') {
  if (I18N[currentLang] && I18N[currentLang][key] !== undefined) {
    return I18N[currentLang][key];
  }
  if (I18N['en'] && I18N['en'][key] !== undefined) {
    return I18N['en'][key];
  }
  return fallback || key;
}

function setLanguage(lang) {
  currentLang = (lang === 'en') ? 'en' : 'fr';
  try {
    localStorage.setItem('astd_lang', currentLang);
  } catch (e) {}

  if (document.documentElement) {
    document.documentElement.lang = currentLang;
  }

  // Active state on language switcher buttons
  const btnFr = document.getElementById('lang-btn-fr');
  const btnEn = document.getElementById('lang-btn-en');
  const btnMobFr = document.getElementById('lang-btn-mob-fr');
  const btnMobEn = document.getElementById('lang-btn-mob-en');

  if (btnFr) {
    btnFr.classList.toggle('active', currentLang === 'fr');
    btnFr.setAttribute('aria-pressed', currentLang === 'fr' ? 'true' : 'false');
  }
  if (btnEn) {
    btnEn.classList.toggle('active', currentLang === 'en');
    btnEn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
  }
  if (btnMobFr) {
    btnMobFr.classList.toggle('active', currentLang === 'fr');
    btnMobFr.setAttribute('aria-pressed', currentLang === 'fr' ? 'true' : 'false');
  }
  if (btnMobEn) {
    btnMobEn.classList.toggle('active', currentLang === 'en');
    btnMobEn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
  }

  // Update all DOM elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.textContent = I18N[currentLang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute('placeholder', I18N[currentLang][key]);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute('title', I18N[currentLang][key]);
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute('aria-label', I18N[currentLang][key]);
    }
  });

  // Dynamic meta / footer texts
  if (META_DATA && META_DATA.last_updated) {
    const footerUpdated = document.getElementById('footer-last-updated');
    if (footerUpdated) {
      const tpl = t('footer_last_updated_tpl', 'Dernière synchro wiki : {date} ({count} unités)');
      footerUpdated.textContent = tpl.replace('{date}', META_DATA.last_updated).replace('{count}', META_DATA.total_units || ALL_UNITS.length);
    }
  }

  // Star filter button tooltips
  document.querySelectorAll('.star-btn').forEach(btn => {
    const val = (btn.getAttribute('onclick') || '').match(/setStarFilter\((\d)\)/);
    if (!val) return;
    const star = parseInt(val[1]);
    const count = ALL_UNITS.filter(u => u.star === star).length;
    const unitLabel = currentLang === 'en' ? (count > 1 ? 'units' : 'unit') : (count > 1 ? 'unités' : 'unité');
    btn.title = `${count} ${unitLabel} ${star}★`;
  });

  // Refresh active views if data has already been loaded
  if (ALL_UNITS && ALL_UNITS.length > 0) {
    applyUnitFilters();
    renderTierList();
    renderCodes();
    renderOrbs();
    renderGameModes();
    renderTeamBuilder();
    if (currentTab === 'compare') {
      renderCompareView();
    }
    if (window.CommunityManager && typeof window.CommunityManager.renderCommunityHub === 'function') {
      window.CommunityManager.renderCommunityHub();
    }
    if (window.CommunityUI && typeof window.CommunityUI.isEditMode === 'function' && window.CommunityUI.isEditMode()) {
      const editBtn = document.getElementById('tierlist-edit-toggle-btn');
      if (editBtn) {
        editBtn.innerHTML = '<i data-lucide="eye" class="w-3.5 h-3.5"></i> <span>' + t('tierlist_btn_edit_active', 'Mode Lecture') + '</span>';
        if (window.lucide) lucide.createIcons();
      }
    }
    updateModalNotesLang();
    const modal = document.getElementById('unit-modal');
    const isModalOpen = modal && !modal.classList.contains('hidden');
    if (currentModalUnit && isModalOpen) {
      const savedLevel = currentLevelView;
      openUnitModal(currentModalUnit.id);
      if (savedLevel && savedLevel !== 1) {
        setLevelView(savedLevel);
      }
    }
  }
}


function updateModalNotesLang() {
  const levelNote = document.getElementById('modal-level-note');
  if (levelNote) {
    levelNote.innerHTML = t('modal_level_note_tpl', 'Stats avec <strong class="text-sky-300">niveau de carte maximum (175)</strong> — bonus officiel du wiki : dégâts <span class="font-mono-num text-amber-300">×2,142</span>, portée <span class="font-mono-num text-amber-300">×1,2</span>, SPA inchangé.');
  }
  const idolNote = document.getElementById('modal-idolbuff-note');
  if (idolNote) {
    const pct = typeof buffProviderPercent === 'function' ? (buffProviderPercent() || 0) : 130;
    const tpl = t('modal_idolbuff_note_tpl', 'Simulation <strong class="text-sky-300">Buff Idol (Shine)</strong> active : les dégâts et le DPS ci-dessus intègrent le <strong class="text-sky-300">buff de dégâts d\'Idol</strong> au palier maximum (<span id="modal-idolbuff-pct" class="font-mono-num text-amber-300">+{pct}%</span> pour le niveau de carte affiché). Seules les unités placées dans la portée d\'Idol en bénéficient.');
    idolNote.innerHTML = '<i data-lucide="music" class="w-3 h-3 text-sky-400 shrink-0 mt-0.5" stroke-width="2"></i> <span>' + tpl.replace('{pct}', pct) + '</span>';
    if (window.lucide) lucide.createIcons();
  }
}

// Data translation helpers
function translateSingleTowerType(type) {
  if (!type) return currentLang === 'fr' ? 'Sol' : 'Ground';
  const t = type.trim().toLowerCase();
  if (t === 'hybrid' || t.includes('hybrid')) return currentLang === 'fr' ? 'Hybride' : 'Hybrid';
  if (t === 'hill' || t.includes('hill')) return currentLang === 'fr' ? 'Colline' : 'Hill';
  if (t === 'air' || t.includes('air')) return currentLang === 'fr' ? 'Aérien' : 'Air';
  return currentLang === 'fr' ? 'Sol' : 'Ground';
}

function translateTowerType(type) {
  if (!type) return currentLang === 'fr' ? 'Sol' : 'Ground';
  if (type.includes('->') || type.includes('→')) {
    const parts = type.split(/->|→/).map(p => p.trim()).filter(Boolean);
    return parts.map(translateSingleTowerType).join(' → ');
  }
  return translateSingleTowerType(type);
}

function towerTypeTooltip(type) {
  const raw = type || 'Ground';
  if (raw.includes('->') || raw.includes('→')) {
    const translated = translateTowerType(raw);
    return currentLang === 'fr' ?
      `Type évolutif : ${translated} (change de placement au fil des paliers d'amélioration)` :
      `Evolving type: ${translated} (changes placement/targeting through upgrade tiers)`;
  }
  const t = raw.toLowerCase();
  if (currentLang === 'fr') {
    if (t.includes('hybrid')) return "Hybride : peut attaquer les ennemis au sol ET aériens";
    if (t.includes('hill')) return "Colline (Hill) : se place sur les hauteurs, attaque sol et air";
    if (t.includes('air')) return "Aérien : n'attaque que les ennemis volants";
    return "Sol (Ground) : n'attaque que les ennemis au sol";
  } else {
    if (t.includes('hybrid')) return "Hybrid: can attack both Ground and Air enemies";
    if (t.includes('hill')) return "Hill: placed on high ground, attacks ground and air";
    if (t.includes('air')) return "Air: attacks flying enemies only";
    return "Ground: attacks ground enemies only";
  }
}

function translateAttackType(type) {
  if (!type) return 'AoE';
  if (currentLang === 'fr') {
    return type
      .replace(/Circle/gi, 'Cercle')
      .replace(/Cone/gi, 'Cône')
      .replace(/Full/gi, 'Complet')
      .replace(/Single Target/gi, 'Cible Unique')
      .replace(/Single/gi, 'Unique')
      .replace(/Line/gi, 'Ligne');
  } else {
    return type
      .replace(/Cercle/gi, 'Circle')
      .replace(/Cône/gi, 'Cone')
      .replace(/Complet/gi, 'Full')
      .replace(/Cible Unique/gi, 'Single Target')
      .replace(/Unique/gi, 'Single');
  }
}

function translateAbilityName(name) {
  if (!name) return '';
  if (currentLang === 'en') {
    return name
      .replace(/Compétence de Leader/gi, 'Leader Skill')
      .replace(/Chef d'équipe/gi, 'Team Leader');
  } else {
    return name
      .replace(/Leader Skill/gi, 'Compétence de Leader')
      .replace(/Team Leader/gi, "Chef d'équipe");
  }
}

function translateUnlock(unlock) {
  if (!unlock) return '';
  if (currentLang === 'fr') {
    return unlock
      .replace(/Availiable upon deployment/gi, 'Disponible dès le déploiement')
      .replace(/Available\s+upon\s+(?:deployment|development)/gi, 'Disponible dès le déploiement')
      .replace(/Upon the Development/gi, 'Disponible dès le déploiement')
      .replace(/Last Upgrade/gi, 'Dernier Palier')
      .replace(/\bPassive\b/gi, 'Passif')
      .replace(/\bSLOW ENEMIES\b/gi, 'Ralentit les ennemis')
      .replace(/\bMoney\b/gi, 'Argent')
      .replace(/\bRewinds\b/gi, 'Retour temporel')
      .replace(/\bDefense\b/gi, 'Défense')
      .replace(/\bStops\b/gi, 'Arrêt temporel')
      .replace(/\bBleeds\b/gi, 'Saignement')
      .replace(/\bBurns\b/gi, 'Brûlure')
      .replace(/\bNuke\b/gi, 'Explosion')
      .replace(/(\d+|\?\?)(?:st|nd|rd|th) Upgrade/gi, '$1e Amélioration')
      .replace(/Upgrade (\d+)/gi, 'Palier $1');
  } else {
    return unlock
      .replace(/Disponible dès le déploiement/gi, 'Available upon deployment')
      .replace(/Dernier Palier/gi, 'Last Upgrade')
      .replace(/Passif/gi, 'Passive')
      .replace(/Ralentit les ennemis/gi, 'SLOW ENEMIES')
      .replace(/Retour temporel/gi, 'Rewinds')
      .replace(/Arrêt temporel/gi, 'Stops')
      .replace(/(\d+)e Amélioration/gi, '$1th Upgrade')
      .replace(/Palier (\d+)/gi, 'Upgrade $1');
  }
}

function translateObtain(text) {
  if (!text) return '';
  if (currentLang === 'fr') {
    return text
      .replace(/via\s+Evolution\s+or\s+Hero\s+Summon/gi, "via Évolution ou Invocation Héros")
      .replace(/via\s+Evolution\s+or\s+Special\s+Summon/gi, "via Évolution ou Invocation Spéciale")
      .replace(/via\s+Evolution\s+or\s+Banner\s+Z/gi, "via Évolution ou Bannière Z")
      .replace(/via\s+Evolution/gi, "via Évolution")
      .replace(/via\s+Hero\s+Summon/gi, "via Invocation Héros")
      .replace(/Evolution\s+or\s+/gi, "Évolution ou ")
      .replace(/\bor\b/gi, "ou")
      .replace(/Summon Banner/gi, "Bannière d'invocation")
      .replace(/Hero Summon/gi, "Invocation Héros")
      .replace(/Special Summon/gi, "Invocation Spéciale")
      .replace(/Banner\s+Z/gi, "Bannière Z")
      .replace(/Story Mode/gi, "Mode Histoire")
      .replace(/Infinite Mode/gi, "Mode Infini")
      .replace(/Trial/gi, "Épreuve")
      .replace(/Raid/gi, "Raid")
      .replace(/Traveling Merchant/gi, "Marchand ambulant")
      .replace(/Evolve from/gi, "Évolution de")
      .replace(/Evolves into/gi, "Évolue en")
      .replace(/Evolution/gi, "Évolution");
  } else {
    return text
      .replace(/via\s+Évolution\s+ou\s+Invocation\s+Héros/gi, "via Evolution or Hero Summon")
      .replace(/via\s+Évolution/gi, "via Evolution")
      .replace(/Bannière d'invocation/gi, "Summon Banner")
      .replace(/Invocation Héros/gi, "Hero Summon")
      .replace(/Invocation Spéciale/gi, "Special Summon")
      .replace(/Bannière\s+Z/gi, "Banner Z")
      .replace(/Mode Histoire/gi, "Story Mode")
      .replace(/Mode Infini/gi, "Infinite Mode")
      .replace(/Épreuve/gi, "Trial")
      .replace(/Marchand ambulant/gi, "Traveling Merchant")
      .replace(/Évolution de/gi, "Evolve from")
      .replace(/Évolue en/gi, "Evolves into")
      .replace(/Évolution/gi, "Evolution")
      .replace(/\bou\b/gi, "or");
  }
}

function translateOverview(text, unit) {
  if (!text || currentLang === 'en') return text;
  let fr = text;

  // 1. Définition canonique de l'unité
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+is\s+a\s+(\d+)[\-\s]star\s+(?:(ground|air|hill|hybrid)\s+)?unit\s+based\s+(?:on|off)\s+([^,\.]+?)\s+from\s+(?:the\s+)?([^,\.]+?)(?:\s+franchise|\s+series|\s+anime)?\./gi, (m, name, stars, type, char, fran) => {
    let tStr = '';
    if (type) {
      const tl = type.toLowerCase();
      tStr = tl === 'ground' ? ' (Sol)' : tl === 'air' ? ' (Aérien)' : tl === 'hill' ? ' (Colline)' : ' (Hybride)';
    }
    return `${name.trim()} est une unité ${stars} étoiles${tStr} basée sur ${char.trim()} de la franchise ${fran.trim()}.`;
  });

  // 2. Arc narratif / fin de série
  fr = fr.replace(/This variant takes the place at\s+(?:the\s+)?(.+?)\s+arc,\s+where is the End of Series\.?/gi, 'Cette variante prend place lors de l\'arc $1, marquant la fin de la série.');
  fr = fr.replace(/This variant takes the place at\s+(?:the\s+)?(.+?)\s+arc\.?/gi, 'Cette variante prend place lors de l\'arc $1.');
  fr = fr.replace(/during his fight with\s+([^,\.]+?)\.?/gi, 'pendant son combat contre $1.');
  fr = fr.replace(/in his\s+([^,\.]+?)\s+form from\s+([^,\.]+?)\.?/gi, 'sous sa forme $1 de $2.');

  // 3. Évolution
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+can\s+be\s+evolved\s+from\s+([^,\.]+?)\s+(?:by\s+using(?:\s+the\s+following\s+materials)?:?|using:?)\s*(.+)?$/gi, (m, name, from, mats) => {
    const matStr = mats ? ` via : ${mats.trim().replace(/Evolution/gi, 'Évolution')}` : '.';
    return `${name.trim()} peut être obtenue par évolution depuis ${from.trim()}${matStr}`;
  });
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+can\s+be\s+evolved\s+from\s+([^,\.]+?)\.?/gi, (m, name, from) => {
    return `${name.trim()} peut être obtenue par évolution depuis ${from.trim()}.`;
  });

  // 4. Shiny / Boss de Raid / Obtention
  fr = fr.replace(/(?:His|Her)\s+shiny\s+variant\s+is\s+based\s+on\s+([^,\.]+?)\s+from\s+the\s+same\s+franchise\.?/gi, 'Sa variante shiny est basée sur $1 de la même franchise.');
  fr = fr.replace(/(?:He|She)\s+is\s+also\s+the\s+boss\s+of\s+(?:his|her)\s+own\s+event\s+raid\.?/gi, 'Cette unité est également le boss de son propre raid d\'événement.');
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+can\s+be\s+obtained\s+from\s+(.+?)\.?$/gi, (m, name, src) => {
    return `${name.trim()} peut être obtenue via ${translateObtain(src.trim())}.`;
  });

  // 5. Nettoyage
  fr = fr.replace(/\bEvolution\b/g, 'Évolution');

  return fr;
}

const ABILITY_DESCRIPTIONS_FR = {
  "Every enemies/mobs killed by The Overlord will be resurrected as his undead summons with 15% of their initial health.\n• The HP of undeads capped at 100 Billion.": "Chaque ennemi éliminé par The Overlord est ressuscité sous forme de sbire mort-vivant avec 15% de ses PV initiaux.\n• Les PV des morts-vivants sont plafonnés à 100 milliards.",
  "Upon activation, The Overlord will enable to deal 3x his damage to all enemies within range and apply Fear Debuff on them.\n• If amplified by the 2nd Ability, he will additionally apply Rupture.": "À l'activation, The Overlord inflige 3x ses dégâts à tous les ennemis à portée et leur applique le malus Peur.\n• Si amplifié par la 2e capacité, il applique également Rupture.",
  "This ability amplifies \"Falling Down, Necromancer's Sorcery, and Banshee's Cry.\" These abilities must be used/activated within 12 seconds of this ability's activation, or the amplifications will not be active.": "Cette capacité amplifie « Falling Down », « Necromancer's Sorcery » et « Banshee's Cry ». Ces capacités doivent être activées dans les 12 secondes suivant cette activation, sinon les amplifications ne seront pas effectives.",
  "He will instantly spawn 15 undead summons with health equal to 10% of The Overlord's damage and heal the base for 1.5 billion HP.\n• If amplified by the 2nd Ability, 15 undead summons will have health equal to 15% of The Overlord's damage stats, and the base will gain 2.5 billion HP.": "Fait apparaître instantanément 15 sbires morts-vivants avec des PV équivalents à 10% des dégâts de The Overlord et soigne la base de 1,5 milliard de PV.\n• Si amplifié par la 2e capacité, les 15 sbires possèdent des PV équivalents à 15% des dégâts de The Overlord, et la base récupère 2,5 milliards de PV.",
  "After activating this ability, the player will gain $2,000,000.": "Après activation de cette capacité, le joueur reçoit 2 000 000 $.",
  "The Overlord will remove the enemy attributes, such as Cloners, Airs, and Bosses Immune. After 3 minutes of activation, all the units with categories; Godlike Power, Undead, or Unrivaled Intelligence will deal an extra 10% of damage.": "The Overlord supprime les attributs ennemis (Cloneurs, Aériens, Immunité Boss). Après 3 minutes d'activation, toutes les unités des catégories Godlike Power, Undead ou Unrivaled Intelligence infligent 10% de dégâts supplémentaires.",
  "The Overlord will obliterate every enemy/mob under 7% of their maximum health.\n• Under the amplification of the 2nd Ability, this ability will execute the enemies/mobs under 14% of health instead.": "The Overlord oblitère tous les ennemis ayant moins de 7% de leurs PV maximum.\n• Sous l'amplification de la 2e capacité, il exécute les ennemis ayant moins de 14% de PV à la place.",
  "Kovegu IV's attacks are always dealing Super Effective Damage when attaching the Enchant enemies and piercing through any enemy Attribute Resistance.": "Les attaques de Kovegu IV infligent toujours des dégâts super efficaces contre les ennemis enchantés et percent toute résistance aux attributs ennemis.",
  "• Kovegu IV gained the Typebane passive, which allows it to deal damage to Elemental enemies within 180 seconds. Additionally, it spawns 4 clones of Kovegu IV, each with 24% of Kovegu IV's max upgrade stats.": "• Kovegu IV gagne le passif Typebane lui permettant d'infliger des dégâts aux ennemis élémentaires pendant 180 secondes. De plus, fait apparaître 4 clones de Kovegu IV, possédant chacun 24% des statistiques max de Kovegu IV.",
  "• Upon activation, this ability removes 27% of all enemies' current HP. It also creates a domain within 5 minutes that every unit with 'Protectors of The Universe', 'Pure Hearted', or 'Prodigy' categories will gain an extra 15% damage buff. Can be used 3 times.": "• À l'activation, retire 27% des PV actuels de tous les ennemis. Crée également un domaine pendant 5 minutes où chaque unité des catégories 'Protectors of The Universe', 'Pure Hearted' ou 'Prodigy' bénéficie d'un bonus de dégâts de +15%. Utilisable 3 fois.",
  "Deals 1.5x damage to enemies affected by Bleed, Rupture, or Judgement.": "Inflige 1,5x dégâts aux ennemis affectés par Saignement, Rupture ou Jugement.",
  "Upon activation, TBOI (Rebirth) will release a nuke of 250 billion damage to all enemies on the map, then, for the next 30 seconds, his status effect will gain HealHit.\n• Stacks with Vampirism, meaning that the nuke can deal up to 375 billion damage.\n• 175 kills required to use ability\n• One-time use per game; shares global cooldown with Stampede (???%)'s Esper Rage ability.": "À l'activation, TBOI (Rebirth) déclenche une explosion de 250 milliards de dégâts à tous les ennemis sur la carte, puis pendant 30 secondes son effet de statut confère HealHit.\n• Se cumule avec Vampirisme, permettant à l'explosion d'infliger jusqu'à 375 milliards de dégâts.\n• 175 éliminations requises pour l'utilisation.\n• Utilisation unique par partie; partage le temps de recharge global avec Esper Rage de Stampede (???%).",
  "units in the Depraved Demons category gain a 20% attack boost and boosts money by 20%.": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de 20% et augmentent l'argent de 20%.",
  "• When Attacking, Change Enemy Enchant to Electric": "• En attaquant, change l'enchantement ennemi en Électrique.",
  "• After activation, Omega Dragon will deploy a Domain Effect within 420 seconds (7 minutes). In this active domain, all enemies will move 10% slower (Stacking with Slow ), and they also constantly lose 0.7% of their max HP until it reaches 66% of their Max HP.\n• Additionally, the ally units placed with the 'Unworldly Beings', 'Pure Evil', or 'Final Bosses' categories will gain an extra 15% damage boost and will deal Super Effective Damage against Enchant enemies.": "• Après activation, Omega Dragon déploie un effet de domaine pendant 420 secondes (7 minutes). Dans ce domaine, tous les ennemis se déplacent 10% plus lentement (cumulable avec Ralentissement) et perdent constamment 0,7% de leurs PV max jusqu'à atteindre 66% de leurs PV max.\n• De plus, les unités alliées placées des catégories 'Unworldly Beings', 'Pure Evil' ou 'Final Bosses' bénéficient d'un bonus de dégâts supplémentaire de 15% et infligent des dégâts super efficaces contre les ennemis enchantés.",
  "• Within 7 seconds of activation, if the enemy hits the base, it will push all of them backward 4 paths/corners.\n• It works similarly as and shares the global cooldown with Ruffy (5th Form)'s Liberation ability.": "• Dans les 7 secondes suivant l'activation, si l'ennemi touche la base, repousse tous les ennemis en arrière de 4 virages/chemins.\n• Fonctionne de manière similaire et partage le temps de recharge global avec Liberation de Ruffy (5th Form).",
  "Vegu (Ego Ascension) damages the base when raging.": "Vegu (Ego Ascension) inflige des dégâts à la base lorsqu'il entre en rage.",
  "• Upon activation of this ability, all enemy types within his range (Powerful 1/2, Decelerate, Regenerate, Elemental, and Rage, excluding Air, Miniboss, and Boss enemies) turn into regular enemies. However, unlike DemonLord Waifu and Dr. Heart (Mystical), he can't turn Cloners into regular enemies.\n• 300 second global cooldown.": "• À l'activation de cette capacité, tous les types d'ennemis à portée (Powerful 1/2, Decelerate, Regenerate, Elemental et Rage, à l'exception des Aériens, Miniboss et Boss) se transforment en ennemis normaux. Cependant, contrairement à DemonLord Waifu et Dr. Heart (Mystical), il ne peut pas transformer les Cloneurs en ennemis normaux.\n• Temps de recharge global de 300 secondes.",
  "• Upon activation, Vegu (Ego Ascension) is buffs his overall power and adds a permanent 61,200,000 damage to his current damage. This ability also allows him to hit elementals for 50% of his damage.\n• This ability has an infinite global cooldown that shared with Evil Shade (Final)'s Dragon Absorption, And Tatsu (Rainbow Flames)'s Rainbow Flame Surge": "• À l'activation, Vegu (Ego Ascension) augmente sa puissance globale et ajoute 61 200 000 dégâts permanents à ses dégâts actuels. Lui permet également de toucher les élémentaires pour 50% de ses dégâts.\n• Possède un temps de recharge global infini partagé avec Dragon Absorption de Evil Shade (Final) et Rainbow Flame Surge de Tatsu (Rainbow Flames).",
  "• Upon activation, a cutscene will play and half of your base's HP will be removed. The removed HP is added to the base nuke of 9 billion. The total damage caps at 15 billion. This ability shares a GLOBAL cooldown with Ombre's Atomic: All Range ability and Stampede (???%)'s Esper Rage ability..": "• À l'activation, une cinématique se lance et la moitié des PV de votre base est retirée. Les PV retirés sont ajoutés à l'explosion de base de 9 milliards de dégâts. Dégâts totaux plafonnés à 15 milliards. Partage un temps de recharge GLOBAL avec Atomic: All Range d'Ombre et Esper Rage de Stampede (???%).",
  "Upon activation, Buddha Chairman (Serious) will deal 25 billion damage to all enemies on the map and inflict poison. He will then delete himself without a refund, though he can be replaced afterwards. This ability has an infinite global cooldown, meaning it can only be used once per game.\n• The poison damage is affected by the single placement DOT nerf, though it wasn't intended to be\n• This ability shares a Global Cooldown with Koku (Instinctive)'s Awakening: Nuke ability": "À l'activation, Buddha Chairman (Serious) inflige 25 milliards de dégâts à tous les ennemis sur la carte et applique poison. Il s'auto-détruit ensuite sans remboursement, bien qu'il puisse être redéployé ensuite. Temps de recharge global infini (utilisation unique par partie).\n• Les dégâts de poison subissent le nerf DOT de placement unique, bien que cela n'ait pas été intentionnel.\n• Partage un temps de recharge global avec Awakening: Nuke de Koku (Instinctive).",
  "Judgement causes an affected enemy to take damage every 2 seconds for 20 seconds in total meaning the total damage dealt by Judgement is 10x greater than the unit's current damage.\n• However, this status effect also applies a debuff on the affected enemy, which makes them take an 8% extra damage from all sources. So, all the total damage dealt by Judgement can be 10.8x greater.": "Jugement fait subir des dégâts à l'ennemi affecté toutes les 2 secondes pendant 20 secondes au total, soit des dégâts totaux 10x supérieurs aux dégâts actuels de l'unité.\n• De plus, applique un malus augmentant les dégâts subis de 8% de toutes sources. Les dégâts totaux peuvent ainsi atteindre 10,8x.",
  "Upon activation, deals ultimate timestop to all enemies for 100 seconds and inflicts them with a debuff that increases damage taken by 15%.\n• 10 minute (600 second) global cooldown that is shared with ZIO (ASCENDED)'s ultimate timestop.": "À l'activation, applique un arrêt du temps ultime à tous les ennemis pendant 100 secondes et leur inflige un malus augmentant les dégâts subis de 15%.\n• Temps de recharge global de 10 minutes (600 secondes) partagé avec l'arrêt du temps ultime de ZIO (ASCENDED).",
  "Permanently increases base damage by 221,760,000\n• One time use per game, global cooldown shared with Evil Shade (Final).": "Augmente définitivement les dégâts de base de 221 760 000.\n• Utilisation unique par partie, temps de recharge global partagé avec Evil Shade (Final).",
  "When activated, it plays a cutscene and deals 9 billion damage to all units on the map. This ability has a PERMANENT GLOBAL cooldown that is shared with Ombre's Atomic: All Range ability and Vegu (Ego Ascension)'s Instinctual Destruction ability, and Kogan Supa II (Alternative)'s Villian Finisher ability.": "À l'activation, déclenche une cinématique et inflige 9 milliards de dégâts à toutes les unités sur la carte. Temps de recharge GLOBAL PERMANENT partagé avec Atomic: All Range d'Ombre, Instinctual Destruction de Vegu (Ego Ascension) et Villian Finisher de Kogan Supa II (Alternative).",
  "This Ability Gives Johnny a temporary buff to himself, granting him a new status effect known as Rotation Lock. Enemies marked with Rotation Lock will be trapped in 1 specific path, constantly looping it over and over until the effect wears off after about 90 seconds.\nThis is similar to Law's Replacement, but happening over and over. Lesson 5 has a GLOBAL cooldown of 6 minutes.": "Confère à Johnny un buff temporaire et un nouvel effet de statut : Rotation Lock. Les ennemis marqués par Rotation Lock sont piégés sur un chemin spécifique et bouclent en continu jusqu'à dissipation de l'effet après environ 90 secondes (similaire à Replacement de Law en continu). Temps de recharge GLOBAL de 6 minutes.",
  "Upon activation, this sets the all enemies on the map to 25% of their MAX hp. Overlaps with God Black Fusion's Wall Of Light, Wrathdioas (Demon King)'s Disintegration, etc. And stacks with Ruffy (5th Form)'s Fifth Form Gun, Future T & Aqua Vegu's Hope Execution, The Strongest In History's Waffle Maker. It has an infinite global cooldown, and thus can only be used once.": "À l'activation, réduit tous les ennemis sur la carte à 25% de leurs PV MAX. Se superpose avec Wall Of Light de God Black Fusion, Disintegration de Wrathdioas (Demon King), etc., et se cumule avec Fifth Form Gun de Ruffy (5th Form), Hope Execution de Future T & Aqua Vegu et Waffle Maker de The Strongest In History. Temps de recharge global infini (utilisation unique).",
  "Upon activation, he consumes all units in his range and then gains damage based on 1/4 of the damage of the units (Maximum 518.4M),including any modifications to their damage (Buffs,Special abilities,etc.).\nHas a infinite cooldown, unit’s that are consumed by this ability cannot be placed back (you can still place 4-8 placement units minus the amount of that unit that was consumed.)": "À l'activation, absorbe toutes les unités à portée et gagne des dégâts équivalents à 1/4 des dégâts de ces unités (maximum 518,4M), incluant toute modification de leurs dégâts (buffs, capacités spéciales, etc.).\nTemps de recharge infini, les unités absorbées ne peuvent pas être replacées (la limite de placement est réduite du nombre d'unités absorbées).",
  "• Upon activation, The Strongest In History kills all enemies that have 10% or lower HP. This ability shares its cooldown with Witch Betrayer.": "• À l'activation, The Strongest In History élimine tous les ennemis ayant 10% de PV ou moins. Partage son temps de recharge avec Witch Betrayer.",
  "• The Strongest In History applies burn to all enemies on the map, causing them to take 2.5B damage every second for 7 seconds in total (7 ticks), dealing 17.5B damage in total for a price of 750M damage to players' base.\n• This ability has a cooldown of approximately 720 seconds (12 minutes), but it can only be used once.": "• The Strongest In History applique brûlure à tous les ennemis sur la carte, leur infligeant 2,5 milliards de dégâts chaque seconde pendant 7 secondes (7 ticks), soit 17,5 milliards de dégâts au total au coût de 750 millions de dégâts infligés à la base du joueur.\n• Temps de recharge d'environ 720 secondes (12 minutes), utilisation unique.",
  "• When this ability is activated, all enemies (exclude enemies inflicted with wax slow) on the entire map will be timestopped for 40 seconds. Although in nature it is similar to Mysterious X (Final) and Jokato Koju (ASCENDED), it can stack with them as it instead uses the global cooldown shared among The Patriot, Red Servant (Final) and Ex-Captain (B-Kui)'s Base protections.\n• Within the duration of the ability, Legendary Leader (Path) applies a DOT effect similar to True Evil (Full Power)'s Decay which will reduce all enemies that are above 33% of their max HP to 33% of their max HP at a rate of 1% every 2-seconds, or 66-seconds in total without help.\n• This ability has a GLOBAL cooldown of 6 minutes and 30 seconds (390 seconds)": "• À l'activation, arrête le temps pour tous les ennemis sur toute la carte (sauf ceux sous WaxSlow) pendant 40 secondes. Peut se cumuler avec Mysterious X (Final) et Jokato Koju (ASCENDED) car il utilise le temps de recharge global partagé avec les protections de base de The Patriot, Red Servant (Final) et Ex-Captain (B-Kui).\n• Pendant la durée, applique un effet de DOT similaire au Decay de True Evil (Full Power), réduisant les ennemis au-dessus de 33% de PV max jusqu'à 33% à raison de 1% toutes les 2 secondes (66 secondes au total).\n• Temps de recharge GLOBAL de 6 minutes et 30 secondes (390 secondes).",
  "Upon activation, all enemies are rewinded to their position 36 seconds ago. In addition, enemies are converted into summonable clones, which retain 10% of the enemies' maximum HP. Each clone summoned by Legendary Leader (Path) has a 100,000,000,000 (100 billion) health cap, similar to Eyezen (Final). This ability also inflicts a Black Flames nuke that deals approximately x16 his current DMG after 40 seconds. (The Black Flames will instantly deal the total damage if Lucci (Heaven) Time Acceleration is affecting the enemy.)\n• The damage from the Black Flames nuke scales with Legendary Leader (Path)'s damage.\n• The rewind from this ability is able to stack with regular rewinds, such as Julian (King of Wizards).\n• This ability has a GLOBAL cooldown of 16 minutes (960 seconds)\n• Enemies won't be rewinded if they have WaxSlow applied.": "À l'activation, remonte le temps de 36 secondes pour tous les ennemis et les convertit en clones invocables conservant 10% de leurs PV max (plafonnés à 100 milliards, comme Eyezen Final). Déclenche aussi une explosion de Flammes Noires infligeant environ 16x ses dégâts actuels après 40 secondes (dégâts immédiats si l'ennemi est sous Time Acceleration de Lucci Heaven).\n• Les dégâts de l'explosion s'adaptent aux dégâts de Legendary Leader (Path).\n• Se cumule avec les retours dans le temps classiques comme Julian (King of Wizards).\n• Temps de recharge GLOBAL de 16 minutes (960 secondes).\n• Les ennemis sous WaxSlow ne sont pas affectés par le retour dans le temps.",
  "• Upon activation, it plays a cutscene and deals Ombre's current damage to all enemies within its range (does not factor in bleed). This doesn’t have a global cooldown. The cooldown of this ability is 300 seconds.": "• À l'activation, déclenche une cinématique et inflige les dégâts actuels d'Ombre à tous les ennemis à portée (sans compter le saignement). Pas de temps de recharge global. Temps de recharge de 300 secondes.",
  "• Upon activation, a cutscene plays and deals 6 billion damage to all enemies on the map. This ability is a one-time use and has a global cooldown that is shared with Stampede (???%)'s Esper Rage ability and Vegu (Ego Ascension)'s Instinctual Destruction ability.": "• À l'activation, déclenche une cinématique et inflige 6 milliards de dégâts à tous les ennemis sur la carte. Utilisation unique, temps de recharge global partagé avec Esper Rage de Stampede (???%) et Instinctual Destruction de Vegu (Ego Ascension).",
  "• Upon activation, it plays a cutscene and deals Ombra's current damage to all enemies within its range (does not factor in bleed). This doesn’t have a global cooldown. The cooldown of this ability is 300 seconds.": "• À l'activation, déclenche une cinématique et inflige les dégâts actuels d'Ombra à tous les ennemis à portée (sans compter le saignement). Pas de temps de recharge global. Temps de recharge de 300 secondes.",
  "Death's ability 'Write Names', needs to be manually activated. Upon activation, it deals damage equal to his damage stat to all enemies within his range.\n• Cooldown of 500 seconds ≈ 8 minutes.": "Capacité à activation manuelle. Inflige des dégâts équivalents à sa stat d'attaque à tous les ennemis à portée.\n• Temps de recharge de 500 secondes (≈ 8 minutes).",
  "Upon activation, Awakening: Ascended will play a cutscene where Koku (Instinctive) awakens into his Instinctive form and makes all enemies take 15% more damage, similarly to Idol's ability. He will now also obtain the Critical effect, dealing 3x damage on every third hit Koku makes. This ability lasts for 4 minutes and has a cooldown of ~15 minutes.": "À l'activation, déclenche une cinématique où Koku (Instinctive) s'éveille sous sa forme Instinctive et fait subir 15% de dégâts supplémentaires à tous les ennemis (similaire à Idol). Obtient également l'effet Critique, infligeant 3x dégâts tous les 3 coups. Dure 4 minutes avec un temps de recharge de ~15 minutes.",
  "Upon activation, a cutscene will play and 13 billion damage will be dealt to all enemies on the map. This ability can only be used once and must be charged up to 100% before use by killing 250 enemies, similar to Ultra Koku & Super 2 Vegu (Final). If you use the ability before charging to 100%, the nuke will not work and will no longer be usable for the rest of the game.": "À l'activation, cinématique puis 13 milliards de dégâts infligés à tous les ennemis sur la carte. Utilisation unique devant être chargée à 100% en éliminant 250 ennemis (comme Ultra Koku & Super 2 Vegu Final). Si utilisée avant 100%, l'explosion échoue et la capacité est perdue pour le reste de la partie.",
  "Every 3rd attack, Star King does an attack which deals 3x his base damage.": "Toutes les 3 attaques, Star King effectue une attaque infligeant 3x ses dégâts de base.",
  "Units in the Mutilate category get a +20% damage boost and a 20% money bonus for economy units.": "Les unités de la catégorie Mutilate bénéficient d'un bonus de dégâts de +20% et d'un bonus d'argent de 20% pour les unités économiques.",
  "At Ikki Potent (Awaken)'s last upgrade, he gains an ability called \"Awakening\". This boosts his damage by 1,000,000, increases his range by 30, slightly narrows his AoE cone and allows changes him to an air type unit and gives him Blackflame effect. However, there is a toll, which is that Ikki Potent (Awaken) cannot hit ground enemies. Activating the ability again will turn off this ability and revert his stats to normal at max upgrade. Further note if Ikki Potent (Awaken)'s is buffed by The Almighty (Yhwach) before he transforms he will not be able to transform. However, if he transforms before being buffed it works perfectly.": "Au dernier palier, Ikki Potent (Awaken) obtient « Awakening ». Augmente ses dégâts de 1 000 000, sa portée de 30, rétrécit légèrement son cône AoE, le passe en unité Aérienne et lui confère l'effet Flammes Noires. En contrepartie, il ne peut plus toucher les ennemis terrestres. Cliquer à nouveau désactive l'aptitude et restaure ses stats normales. Attention : s'il est buffé par The Almighty (Yhwach) avant transformation, il ne pourra pas se transformer ; buffez-le après transformation.",
  "• Upon activation, Evil Shade (Final) gains a permanent 7,500,000 damage added to his original damage and now inflicts Black Flames with every attack. This shares an infinite global cooldown with Vegu (Ego Ascension) and Tatsu (Rainbow Flames).": "• À l'activation, Evil Shade (Final) gagne définitivement 7 500 000 dégâts et applique désormais Flammes Noires à chaque attaque. Partage un temps de recharge global infini avec Vegu (Ego Ascension) et Tatsu (Rainbow Flames).",
  "• When activated, a short cutscene referencing the YuYu Hakusho anime will play out. Summoning the Dragon of the Darkness Flame, Evil Shade (Final) deals 12.5B damage and applies Stoke effect on all enemies on the map. This ability has a cooldown of 720 seconds.\n• Status effect \"Stoke\" increases burn-related status effects such as Burn and Black Flames damage by 1.5x.": "• À l'activation, cinématique invoquant le Dragon des Flammes Sombres. Inflige 12,5 milliards de dégâts et applique l'effet Stoke à tous les ennemis sur la carte. Temps de recharge de 720 secondes.\n• Stoke augmente les dégâts des effets de brûlure (Brûlure, Flammes Noires) de 1,5x.",
  "Upon activation, buffs own damage by 20%, and also copies 30% of a nearby unit's stats (cap of 19.2m). BUT it cannot copy another Kung Fu Galaxy's damage. Lasts for 60 seconds\n• It's cooldown is 4 minutes": "À l'activation, augmente ses propres dégâts de 20% et copie 30% des statistiques d'une unité proche (plafond de 19,2M). Ne peut pas copier un autre Kung Fu Galaxy. Dure 60 secondes.\n• Temps de recharge de 4 minutes.",
  "Upon activation, it will add half of the strongest enemy's health into Damage for Kung Fu Galaxy by half. For example, if the strongest enemy has 100 billion HP, 50 billion damage will be added for the unit, yet this can't stack with multiple enemies at once. This has a maximum cap of 200 billion damage. Additionally, this ability also applies the Erasure effect like Devil as teleporting enemies back 4 corners.\n• It has infinitely global cooldown, and lasts for 1 minute.\n• It only be used on one Kung Fu Galaxy.\n• This ability can only be used once and shares its cooldown with Witch Betrayer": "À l'activation, ajoute la moitié des PV de l'ennemi le plus fort aux dégâts de Kung Fu Galaxy (ex: ennemi à 100 milliards de PV = +50 milliards de dégâts, non cumulable sur plusieurs ennemis à la fois, plafond à 200 milliards). Applique également l'effet d'Effacement comme Devil en téléportant les ennemis en arrière de 4 virages.\n• Temps de recharge global infini, dure 1 minute.\n• Utilisable sur un seul Kung Fu Galaxy, utilisation unique partagée avec Witch Betrayer.",
  "Upon activation Old Will (B-Kui)'s attack type changes to AoE (Cone), his damage will change to 16,300,000 , his range changes to 100, his SPA changes to 3.5, he does not burn, and he cannot hit airs.": "À l'activation, l'attaque passe en AoE (Cône), ses dégâts passent à 16 300 000, sa portée à 100, son SPA à 3,5, ne brûle pas et ne touche pas les aériens.",
  "Upon activation Old Will (B-Kui)'s attack type changes to AoE (Full), his damage will change to 11,000,000, his range changes to 100, his SPA changes to 5, he inflicts burn, and he gains the ability to hit air enemies.": "À l'activation, l'attaque passe en AoE (Cercle complet), ses dégâts passent à 11 000 000, sa portée à 100, son SPA à 5, inflige brûlure et gagne la capacité de toucher les ennemis aériens.",
  "Upon activation Old Will (B-Kui) turns into a summoner unit, summoning skeletons scaling with his current dmg on the map every 45 seconds. When defeated, the skeletons will explode and inflict burn damage to surrounding enemies.": "À l'activation, devient une unité invocatrice faisant apparaître toutes les 45 secondes des squelettes proportionnels à ses dégâts actuels. Une fois vaincus, les squelettes explosent et infligent des dégâts de brûlure aux ennemis proches.",
  "Upon activation Old Will (B-Kui)'s attack type changes to a 55 degree AoE (Cone), his damage will change to 21,900,000, his range changes to 150, his SPA changes to 15, he inflicts burn, and he cannot hit airs.": "À l'activation, l'attaque passe en AoE (Cône à 55°), ses dégâts passent à 21 900 000, sa portée à 150, son SPA à 15, inflige brûlure et ne touche pas les aériens.",
  "Gives $1,500 and spawns a Titan with 18,000 HP.\n• 60 Seconds cooldown": "Donne 1 500 $ et fait apparaître un Titan de 18 000 PV.\n• Temps de recharge de 60 secondes.",
  "The Founder applies bleed to all enemies in her range and spawns a Titan with 2.4M HP (2,400,000)\n• 600 second global cooldown\n• You cannot use this ability if Warhammer Giant (Bleeds) or Abnormal Giant (Burns) is on global cooldown.": "The Founder applique saignement à tous les ennemis à sa portée et fait apparaître un Titan de 2,4M PV (2 400 000).\n• Temps de recharge global de 600 secondes.\n• Inutilisable si Warhammer Giant (Bleeds) ou Abnormal Giant (Burns) est en temps de recharge global.",
  "Rewinds all enemies in her range for 10 seconds and spawns a Titan with 95M HP (95,000,000)\n• 75 second cooldown": "Remonte le temps de 10 secondes pour tous les ennemis à sa portée et fait apparaître un Titan de 95M PV (95 000 000).\n• Temps de recharge de 75 secondes.",
  "Heals the base for an additional 14 million HP and spawns a Titan with 234.66M HP (234,660,000)\n• 120 second cooldown": "Soigne la base de 14 millions de PV supplémentaires et fait apparaître un Titan de 234,66M PV (234 660 000).\n• Temps de recharge de 120 secondes.",
  "Spawns a Titan that can only hit air with 6.91B HP. (6,910,000,000)\n• 120 second cooldown": "Fait apparaître un Titan ne touchant que les unités aériennes avec 6,91 milliards de PV (6 910 000 000).\n• Temps de recharge de 120 secondes.",
  "Applies Ultimate Timestop to all enemies in the map for 40 seconds and spawns a Titan with 30.7B HP (30,700,000,000)\n• 900 second global cooldown": "Applique un arrêt du temps ultime à tous les ennemis sur la carte pendant 40 secondes et fait apparaître un Titan de 30,7 milliards de PV (30 700 000 000).\n• Temps de recharge global de 900 secondes.",
  "The Founder applies 1.5x rupture damage to all enemies in the map and spawns a Titan with 58.752B HP (58,752,000,000)\n• 660 second global cooldown (11 minute)\n• You cannot use this ability if Jaw Giant (Bleeds) or Abnormal Giant (Burns) is on global cooldown.": "The Founder applique 1,5x dégâts de rupture à tous les ennemis sur la carte et fait apparaître un Titan de 58,752 milliards de PV (58 752 000 000).\n• Temps de recharge global de 660 secondes (11 minutes).\n• Inutilisable si Jaw Giant (Bleeds) ou Abnormal Giant (Burns) est en temps de recharge global.",
  "The Founder deals 3.5B damage to all enemies in the map and spawn a Titan with 52.8B HP (52,800,000,000)\n• 500 second global cooldown (8 minute and 20 second)": "The Founder inflige 3,5 milliards de dégâts à tous les ennemis sur la carte et fait apparaître un Titan de 52,8 milliards de PV (52 800 000 000).\n• Temps de recharge global de 500 secondes (8 minutes et 20 secondes).",
  "The Founder applies 4x burn damage to all enemies in the map and spawns a Titan with 56.6784B HP (56,678,400,000)\n• 720 second global cooldown (12 minute)\n• You cannot use this ability if Jaw Giant (Bleeds) or Warhammer Giant (Bleeds) is on global cooldown.": "The Founder applique 4x dégâts de brûlure à tous les ennemis sur la carte et fait apparaître un Titan de 56,6784 milliards de PV (56 678 400 000).\n• Temps de recharge global de 720 secondes (12 minutes).\n• Inutilisable si Jaw Giant (Bleeds) ou Warhammer Giant (Bleeds) est en temps de recharge global.",
  "Upon activation, all enemies within Hamerucifer's range will be timestopped for 8.5s.\n• 40 second cooldown.": "À l'activation, tous les ennemis à portée de Hamerucifer sont arrêtés dans le temps pendant 8,5 s.\n• Temps de recharge de 40 secondes.",
  "Upon activation, all enemies within Hamerucifer's range will be rewinded for 16s.\n• This ability has an 80s cooldown.\n• Enemies won't be affected if they have WaxSlow applied.": "À l'activation, tous les ennemis à portée de Hamerucifer sont remontés dans le temps de 16 s.\n• Temps de recharge de 80 s.\n• Les ennemis sous WaxSlow ne sont pas affectés.",
  "Upon activation, all enemies are removed from the map and placed in a “Warp Marble”. During this time, these enemies do not count towards the enemy limit, and waves can be skipped. After 60 seconds, all enemies in the warp marble are respawned back to the start of the map with full hp.\n• Requires Medukami in range to activate\n• Infinite global cooldown, and it shared with Lucci (Heaven)'s Universe Reset.": "À l'activation, tous les ennemis sont retirés de la carte et placés dans une « Bille Dimensionnelle ». Durant ce temps, ils ne comptent pas dans la limite d'ennemis et les vagues peuvent être passées. Après 60 secondes, ils réapparaissent tous au point de départ avec leurs PV max.\n• Nécessite Medukami à portée pour l'activation.\n• Temps de recharge global infini, partagé avec Universe Reset de Lucci (Heaven).",
  "• Upon activation, this reduces the enemy's HP by 25% of their CURRENT hp. Stacks with God Black Fusion/Wrathdioas (Demon King) type abilities and hits the full map.\n• The global cooldown for this ability is 1080 seconds; however, it can be used 3 times.": "• À l'activation, réduit les PV de l'ennemi de 25% de ses PV ACTUELS. Se cumule avec les capacités de type God Black Fusion/Wrathdioas (Demon King) et frappe toute la carte.\n• Temps de recharge global de 1080 secondes ; utilisable 3 fois.",
  "• Upon activation, a timer for 5 seconds starts. Dying within that time frame will revive you and push the enemies 4 paths backward. This ability can only be used once, and it DOES stack with Devil's Special Ability. (More specifically, the enemy teleport effect. All other effects will still activate.)\n• It shares a Global Cooldown with Omega Dragon's Negative Energy Rebirth ability": "• À l'activation, lance un compte à rebours de 5 secondes. Mourir durant cet intervalle vous ressuscite et repousse les ennemis en arrière de 4 virages/chemins. Utilisation unique, SE CUMULE avec la capacité spéciale de Devil (téléportation des ennemis).\n• Partage un temps de recharge global avec Negative Energy Rebirth d'Omega Dragon.",
  "Energy Bomba is a Special Ability that can only be activated once it's fully charged. If you try to activate it before it hits 100%, the ability will not do anything to the enemies and it will go on cooldown for a few seconds. To increase the percentage, this unit has to kill enemies. It takes 250 kills to reach 100% . When activated, the ability deals 10 billion damage to all units in the map.\nEven though the % shown in the icon can be exceed 100%, the damage dealt by the ability is still capped at 10 billion. This ability shares a GLOBAL cooldown with The Pharaoh's ability.": "Aptitude spéciale activable uniquement lorsqu'elle est chargée à 100% (250 éliminations nécessaires). Inflige 10 milliards de dégâts à toutes les unités sur la carte (dégâts plafonnés à 10 milliards même si le % affiché dépasse 100%). Partage un temps de recharge GLOBAL avec la capacité de The Pharaoh.",
  "Units in the Protectors of The Universe category gain a 20% attack boost & 15% Bonus.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de 20% et d'un bonus de 15%.",
  "Upon activation, all units in the map even outside The Almighty's range will receive a +300% (4x) damage buff and a 20% range buff for 60 seconds. The cooldown of this ability is also 60 seconds, meaning that a permanent buff can be achieved through auto-activation.": "À l'activation, toutes les unités sur la carte (même hors de portée) reçoivent un bonus de dégâts de +300% (4x) et un bonus de portée de +20% pendant 60 secondes. Temps de recharge de 60 secondes (buff permanent via activation automatique).",
  "Upon activation, Universe Justice #1 (Serious) will stop attacking and start his meditation. His Ki Focus will increase by 1 per wave (it will increase up to 10 times). When activated again after a cooldown of 35 seconds, his damage will raise depending on the Ki Focus he gained, and he will permanently gain 234,000 damage for every point (regardless of level). You cannot use the Meditation ability a second time.": "À l'activation, Universe Justice #1 (Serious) cesse d'attaquer et commence sa méditation. Sa Focalisation de Ki augmente de 1 par vague (jusqu'à 10 fois). Réactivé après 35 secondes de recharge, ses dégâts augmentent selon le Ki accumulé (+234 000 dégâts permanents par point). Ne peut être utilisé qu'une seule fois.",
  "Upon activation, Falcon (Ascendance) will stop attacking until this ability is activated again. The cooldown of this ability is 10 seconds.": "À l'activation, cesse d'attaquer jusqu'à réactivation de l'aptitude. Temps de recharge de 10 secondes.",
  "At Wrathdioas (Demon King)'s 7th upgrade, he gains an ability called \"Disintegration\". This ability sets enemies to 45% of their health (This only affects enemies inside of his range.) This does not lower their health if they are below 45%. This ability doesn't stack with God Black Fusion. This ability also does not have a global cooldown. If this ability is used twice on the same enemies, Wrathdioas (Demon King) does his 1,25x damage to all enemies in his range. Does not work on Boss enemies\nCooldown: ~45 seconds": "Au 7e palier d'amélioration, Wrathdioas (Demon King) obtient « Disintegration ». Réduit la santé des ennemis à 45% de leurs PV max (affecte uniquement les ennemis dans sa portée, ne réduit pas les PV s'ils sont déjà sous 45%). Ne se cumule pas avec God Black Fusion. Pas de temps de recharge global. Réutiliser cette aptitude sur les mêmes ennemis inflige 1,25x ses dégâts à portée. Ne fonctionne pas sur les Boss.\nTemps de recharge : ~45 secondes.",
  "Units in the Revival category gain a +20% attack boost along with a +20% money boost.": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de +20% et augmentent l'argent de +20%.",
  "Like the 6-star (Mysterious X (VOID)), Mysterious X (Final) has a manual ability that allows him to timestop all enemies in his range for a certain amount of time. The larger his range is, the more reach his time stop has.\n• Cooldown: 45 seconds\n• Duration: 8 seconds": "Comme sa version 6 étoiles, possède une aptitude manuelle arrêtant le temps pour tous les ennemis à portée. Plus sa portée est grande, plus l'arrêt du temps s'étend.\n• Temps de recharge : 45 secondes\n• Durée : 8 secondes.",
  "Upon Activation, Mysterious X will use the full extent of his limitless abilities, to time stop the ENTIRE map for 1 MINUTE and deal 7.5B damage to ALL enemies on the map. This ability can be reused, both the time stop, and the nuke. Final Domain Finisher has a GLOBAL cooldown of 8 minutes, or 480 seconds.\n• Cooldown: 480 seconds\n• Duration: 60 seconds": "À l'activation, Mysterious X déploie l'étendue de ses capacités pour arrêter le temps sur TOUTE la carte pendant 1 MINUTE et infliger 7,5 milliards de dégâts à TOUS les ennemis sur la carte. L'arrêt du temps et l'explosion sont réutilisables. Temps de recharge GLOBAL de 8 minutes (480 secondes).\n• Temps de recharge : 480 secondes\n• Durée : 60 secondes.",
  "Unhuman (Nullifier) can do 2x damage to enemies that have or originally\n• have a Title and can also do Piercing damage to Elemental enemies.\n• Unhuman (Nullifier) can still do 2x damage to enemies that got turned into regular enemies (\n• )": "Unhuman (Nullifier) inflige 2x dégâts aux ennemis possédant ou ayant eu un Titre, et inflige des dégâts perforants aux ennemis élémentaires.\n• Inflige toujours 2x dégâts aux ennemis transformés en ennemis normaux.",
  "Upon activation of this ability, all enemies on the map like Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Rage, and Armored (except for Air, Miniboss, and Boss enemies) turns into regular enemies. Additionally, Air enemies on the map that are affected by the ability will be targetable by ground units. This ability has a cooldown of 400 seconds (6 minutes and 40 seconds). But has a global cooldown for a bit longer to around 8 minutes, or approximately 480-500 seconds.": "À l'activation, tous les types d'ennemis sur la carte (Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Rage et Armored, hors Aériens, Miniboss et Boss) se transforment en ennemis normaux. Les ennemis aériens affectés deviennent ciblables par les unités terrestres. Temps de recharge de 400 secondes (6 min 40 s) et temps de recharge global d'environ 8 minutes (480-500 secondes).",
  "• Unhuman (Nullifier) (Special) can do 2x damage to enemies with a Title and can also do Piercing damage to Elemental enemies.\n• Unhuman (Nullifier) (Special) can still do 2x damage to enemies that got turn to regular enemies.": "• Unhuman (Nullifier) (Special) inflige 2x dégâts aux ennemis avec un Titre et inflige des dégâts perforants aux ennemis élémentaires.\n• Inflige toujours 2x dégâts aux ennemis transformés en ennemis normaux.",
  "• Upon activation of this ability, all enemies on the map like Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Armored and Rage (except for Steadfast, Miniboss and Boss enemies) turns into regular enemies. Technically works on Air enemies but it only allows ground units to target affected air enemies, it doesn't remove their title or replace their flying animation. This ability has a cooldown of 6 minutes 40 seconds (400 seconds). But have global cooldown for a bit longer to around 8 minutes, or approximately 480-500 seconds.": "• À l'activation, tous les types d'ennemis sur la carte (Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Armored et Rage, hors Imperturbables, Miniboss et Boss) se transforment en ennemis normaux. Permet aux unités terrestres de cibler les ennemis aériens affectés sans modifier leur titre ni leur animation de vol. Temps de recharge de 400 secondes (6 min 40 s) et temps de recharge global d'environ 8 minutes (480-500 secondes).",
  "The Final March is an ability that requires The Founder to be placed anywhere on the map, regardless of who placed it. Once activated, a short cutscene referencing the Attack On Titan anime will play out. During The Rumbling, a lot of Wall Titans and Airren's Founding Titan will spawn at the base and slowly march across the entire map. The Titans release a \"Fog\" of Damage that travels across the map aswell and all enemies that are inside that Fog will be dealt 60% of Airren's current damage for 3 ticks per second. The Rumbling has a different duration on every map, ranging from 50-80 seconds and has a 500 second cooldown. Only one March can be active at a time. This ability doesn't have a global cooldown. It also turns the game speed to 1x for the duration.\nFile:Airren (Doomsday) Manual Ability GIF 1.gif\nFile:Airren (Doomsday) Manual Ability GIF 2.gif": "Nécessite The Founder placé sur la carte. À l'activation, cinématique puis de nombreux Titans des Murs et le Titan Originel d'Airren apparaissent à la base et marchent lentement sur la carte. Les Titans émettent un brouillard de dégâts infligeant 60% des dégâts actuels d'Airren 3 fois par seconde aux ennemis à l'intérieur. Dure 50 à 80 secondes selon la carte, temps de recharge de 500 secondes (une seule Marche à la fois, pas de recharge globale, vitesse fixée à 1x).",
  "Candy Beam: Upon activation, Boo timestops all enemies in his range for 6.5 seconds (with ~45sec cooldown).": "À l'activation, Boo arrête le temps pour tous les ennemis à portée pendant 6,5 secondes (temps de recharge de ~45 s).",
  "Sleep (Replaces Candy Beam on Upgrade 6): When activated, Boo (Kid) adds an extra 5 billion HP to the base. This ability shares an infinite global cooldown with Patchface (Transfigured)'s Passive Transfiguration Ability.": "Remplace Candy Beam au Palier 6 : Boo (Kid) ajoute 5 milliards de PV supplémentaires à la base. Partage un temps de recharge global infini avec Passive Transfiguration de Patchface (Transfigured).",
  "Buffs all unit within his range by 200% (or 3x) as well as buffing their range by 20%. This ability lasts for 30 seconds with a cooldown of 60 seconds (10 seconds and 20 seconds with 3x speed)": "Augmente les dégâts de toutes les unités à portée de 200% (ou 3x) ainsi que leur portée de 20%. Dure 30 secondes avec un temps de recharge de 60 secondes (10 s et 20 s en vitesse 3x).",
  "Attacks now stun enemies upon attack.": "Les attaques étourdissent désormais les ennemis à l'impact.",
  "Attacks now slow enemies upon attack.": "Les attaques ralentissent désormais les ennemis à l'impact.",
  "Attacks only hit air enemies like Ikki Potent (Awaken)'s manual ability.": "Les attaques ne touchent désormais que les ennemis aériens (similaire à Ikki Potent Awaken).",
  "Attacks change to AoE Cone.": "L'attaque passe en zone (AoE Cône).",
  "Units in the Progressive category get a +20% Attack Boost": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +20%.",
  "Upon activation of this ability, all enemy types within her range (Powerful 1/2, Decelerate, Regenerate, and Rage, excluding Air, Miniboss, and Boss enemies) turn into regular enemies. However, unlike DemonLord Waifu and Dr. Heart (Mystical), she can't turn Cloners into regular enemies. Her ability appears to work on Steadfast enemies and their Steadfast status disappears, but they continue to be immune to things like timestop, slow, DoT etc. This greatly diminishes her utility in infinite modes. Further note that this ability has a global cooldown of 65 seconds.": "À l'activation, tous les types d'ennemis à portée (Powerful 1/2, Decelerate, Regenerate et Rage, hors Aériens, Miniboss et Boss) deviennent des ennemis normaux (ne transforme pas les Cloneurs). Sur les Imperturbables, retire le statut mais ils restent immunisés aux altérations (arrêt du temps, ralentissement, DoT). Temps de recharge global de 65 secondes.",
  "When activated, a cutscene shows a glitchy pink flash flashes three times across the screen, followed by a red and black explosion. Then every enemy on the map gets teleported back 3 paths, time-stopped for 30 seconds, and their health cut to 65% of their maximum HP. This ability has a 750-second global cooldown.\nUnits affected by this ability will not be able to be affected by it again, and the ability has a global cooldown. However, only the global timestop is affected by the global cooldown, which means selling and using it again or using Yoshaga Kiryu's Eat The Dirt and reusing the ability will teleport the enemies back 3 corners and reduce HP, but there will be no global timestop.": "À l'activation, cinématique puis tous les ennemis sur la carte sont téléportés 3 virages en arrière, arrêtés dans le temps pendant 30 secondes et leurs PV sont réduits à 65% de leurs PV max. Temps de recharge global de 750 secondes. Les ennemis affectés ne peuvent plus être réaffectés par l'arrêt du temps lors d'une réutilisation.",
  "Upon activation, Eyezen will rewind all enemies within his range for 12 seconds based on their speed. This ability has a cooldown of 80 seconds. Unit affected by this ability cannot be affected by it again.": "À l'activation, Eyezen remonte le temps pour tous les ennemis à portée pendant 12 secondes selon leur vitesse. Temps de recharge de 80 secondes. Les unités affectées ne peuvent plus être réaffectées.",
  "When activated, he copies the first 10 enemies in his range and summons them from the base, similar to Spider Boss. All summoned units have half of that enemy's current health, with a health cap of 100,000,000,000 (100 billion) HP. This ability can only be used once. This ability also has an INFINITE GLOBAL COOLDOWN that is shared with Patchface (Transfigured)'s Domain of Perfection ability and Witch Betrayer's Taboo Summon Ability.": "À l'activation, copie les 10 premiers ennemis à portée et les invoque depuis la base (comme le Boss Araignée). Les unités invoquées ont la moitié des PV de l'ennemi (plafond à 100 milliards de PV). Utilisation unique, TEMPS DE RECHARGE GLOBAL INFINI partagé avec Domain of Perfection de Patchface (Transfigured) et Taboo Summon de Witch Betrayer.",
  "Upon activation, all enemies within True Evil (Full Power)'s range will lose ~0.6% of their total HP every second until they reach 65% of their max HP, which takes a minute to do so. It only affects non-boss enemies that are above 65% of their health. This ability has a cooldown of 4 minutes.": "À l'activation, tous les ennemis à portée de True Evil (Full Power) perdent ~0,6% de leurs PV totaux par seconde jusqu'à atteindre 65% de leurs PV max (environ 1 minute). Affecte uniquement les non-boss au-dessus de 65% de PV. Temps de recharge de 4 minutes.",
  "Upon activation, Lucci will create a consumable status effect for all enemies in range. When the next DoT effect (Ex. Bleed/Burn) hits, it will deal all ticks of the DoT damage in a single hit. For example, instead of Organs (Berserker) needing 24 ticks, it will only take 1 hit to fully deal his total Rupture damage. This ability has a 1 minute GLOBAL cooldown. This ability doesn't work on Armored enemies as they are immune to status effects.": "À l'activation, Lucci crée un effet de statut consommable sur tous les ennemis à portée. Le prochain effet de DoT (ex: Saignement/Brûlure) infligera tous ses ticks en un seul coup instantané. Temps de recharge GLOBAL de 1 minute. Ne fonctionne pas sur les Blindés.",
  "Upon activation, Lucci resets ALL enemies back to the spawn (No matter where they are on the map), but in exchange, all enemies affected by the ability return to full HP. This ability is a ONE-TIME use.": "À l'activation, Lucci réinitialise TOUS les ennemis au point d'apparition (où qu'ils soient), mais en échange tous les ennemis affectés récupèrent l'intégralité de leurs PV. Utilisation UNIQUE.",
  "When clicked, Metal Freezer summons a clone with 22 million hp (DOES NOT SCALE WITH LEVEL), and has a cooldown of 45 seconds, so Cooler's clones have a dps of 488k per Cooler. This pairs well with auto-activation. Multiple clones are summoned on maps with multiple paths, one for each path.": "Invoque un clone possédant 22 millions de PV (ne varie pas avec le niveau), avec un temps de recharge de 45 secondes (DPS de 488k par clone). Idéal en activation automatique. Invoque un clone par chemin sur les cartes à plusieurs trajectoires.",
  "The WaxSlow effect is applied to enemies when they are hit by Mochi (Awakening). This effect makes enemies 85% slower and lasts for 35 seconds. WaxSlow does NOT stack with Slow, Sunburn or GaleSlow. Negates the effect of regular Rewind.": "Effet appliqué aux ennemis touchés par Mochi (Awakening). Rend les ennemis 85% plus lents pendant 35 secondes. NE SE CUMULE PAS avec Ralentissement, Sunburn ou GaleSlow. Annule l'effet du retour dans le temps classique.",
  "Kura's ability 'Write Names' needs to be manually activated. Upon activation, it deals damage equal to his damage stat to all enemies within his range, including air mobs. After a cooldown of 500 seconds (8 minutes 20 seconds), it can be triggered again.": "Capacité à activation manuelle. Inflige des dégâts équivalents à sa stat d'attaque à tous les ennemis à portée, y compris les aériens. Réutilisable après un temps de recharge de 500 secondes (8 min 20 s).",
  "This passive only activates when Blood Queen (B-Kui) is upgraded to the 7th level and equipped with the Blood Queen Orb.\nBloodLust adds final damage to Blood Queen (B-Kui) that is not shown in the unit's stats.\nThe damage is based on the base HP:\n• 2.222B damage added to the unit if base HP is greater than 9 billion.\n• 734M damage added to the unit if base HP is greater than 3.5 billion.\n• 446M damage added to the unit if base HP is greater than 500 million.": "S'active au palier 7 équipé de l'Orbe Blood Queen. Ajoute des dégâts finaux proportionnels aux PV de la base :\n• +2,222 milliards de dégâts si base > 9 milliards de PV.\n• +734 millions de dégâts si base > 3,5 milliards de PV.\n• +446 millions de dégâts si base > 500 millions de PV.",
  "This passive only activates when Blood Queen (Volt) is upgraded to the 7th level and equipped with the Blood Queen Orb.\nBloodLust adds final damage to Blood Queen (Volt) that is not shown in the unit's stats.\nThe damage is based on the base HP:\n• 2.222B damage added to the unit if base HP is greater than 9 billion.\n• 734M damage added to the unit if base HP is greater than 3.5 billion.\n• 446M damage added to the unit if base HP is greater than 500 million.": "S'active au palier 7 équipé de l'Orbe Blood Queen. Ajoute des dégâts finaux proportionnels aux PV de la base :\n• +2,222 milliards de dégâts si base > 9 milliards de PV.\n• +734 millions de dégâts si base > 3,5 milliards de PV.\n• +446 millions de dégâts si base > 500 millions de PV.",
  "When activated, Megumin uses Explosion, and deals damage equal to that stated on her card to every enemy in her range. It has a cooldown of 300 seconds, and is now her only way of attacking.": "À l'activation, Megumin déclenche Explosion et inflige à chaque ennemi à portée les dégâts indiqués sur sa fiche. Temps de recharge de 300 secondes ; c'est désormais sa seule manière d'attaquer.",
  "Upon activation, Zyaya (Released) will use his Bankai: Senbonzakura Kageyoshi, dealing 600 million damage to all enemies on the map and buffing his damage by 62,400,000 for 100 seconds. This ability has a cooldown of 300 seconds.": "À l'activation, Zyaya (Released) utilise son Bankai : Senbonzakura Kageyoshi, infligeant 600 millions de dégâts à tous les ennemis sur la carte et augmentant ses dégâts de 62 400 000 pendant 100 secondes. Temps de recharge de 300 secondes.",
  "When activated, Witch Betrayer will clone the current Strongest Enemy on the map with HP 100X greater than that enemy's current health. This ability has a HP cap of 100T.\nThis ability can only be used once and shares its cooldown with instant-clear abilities such as Sukuna's Waffle Maker and Trunk's Hope Execution. She also shares this global cooldown with Aizen's Hypnosis Takeover.\nKung Fu Galaxy": "À l'activation, Witch Betrayer clone l'ennemi le plus puissant sur la carte avec des PV 100x supérieurs à ceux de cet ennemi (plafond à 100 T de PV). Utilisation unique, partage son temps de recharge avec les éliminations instantanées comme Waffle Maker de Sukuna, Hope Execution de Trunks et Hypnosis Takeover d'Aizen.",
  "title1=Super Siblings\n|skin1=Super Khalifa\n|skin2=Legendary Kel\n|image1=Super Siblings (Pose) - Only Khalifa.png\n|image2=Super Siblings (Pose) - Only Kel.png\n|caption1=\"You were really somethin'! Sucks for you that you were up against us, though!\"\n|caption2=\"Me and Caulifla, we are the strongest Saiyans around!\"\n|deployment_cost=N/A\n|upgrade_levels=3\n|total_cost=199,000\n|tower_type=Hybrid\n|enchant=Nature\n|attack_type=AoE (Circle)\n|damage=11,600 -> 1,340,000\n|seconds_per_attack=5 -> 9\n|range=50 -> 60": "Fiche de statistiques et transformation de l'unité fusionnée Super Siblings (Khalifa & Kel) après activation de la boucle Earring Fusion.",
  "When activated, Khalifa (Supa) and Legendary Kel perform a fusion dance and fuse into Kelfu.": "À l'activation, Khalifa (Supa) et Legendary Kel exécutent la danse de fusion et fusionnent en Kelfu.",
  "This Ability Gives Johnny a temporary buff to himself, granting him a new status effect known as Rotation Lock. Enemies marked with Rotation Lock will be trapped in 1 specific path, constantly looping it over and over until the effect wears off after about 80 seconds. This is similar to Law's Replacement, but happening over and over. Lesson 5 has an infinite cooldown.": "Confère à Johnny un buff temporaire et le statut Rotation Lock. Les ennemis marqués sont piégés sur un chemin spécifique et bouclent en boucle pendant 80 secondes (similaire à Replacement de Law en continu). Temps de recharge infini.",
  "Upon activation, Patchface (Transfigured) (Special) activates his Domain Expansion, touching the souls of a Boss/Mini-Boss in range and converting them into transfigured enemies, which are portrayed as clones similar to Eyezen (Final)'s \"Hypnosis Takeover\". This ability can only be used on BOSSES/MINIBOSSES and will pick ONLY 1 Boss/Mini-Boss, and clone it (1 per path). All summoned units have 20% of that Boss/Mini-Boss's current health, with a health cap of 5,000,000,000 (5 billion) HP. This ability can only be used once.": "À l'activation, déploie son Extension du Territoire, altérant l'âme d'un Boss/Miniboss à portée pour le cloner (1 clone par chemin, 20% des PV du Boss, plafond à 5 milliards de PV). Utilisable uniquement sur les Boss/Miniboss, utilisation unique.",
  "Upon activation, Patchface (Transfigured) will use Reverse Cursed Technique, and heal your base (7.5B HP Heal). This ability can only be used once per game, Shares a infinite global cooldown with Boo (Kid)'s Sleep Ability": "À l'activation, utilise le Sort d'Inversion et soigne la base de 7,5 milliards de PV. Utilisation unique par partie, partage un temps de recharge global infini avec Sleep de Boo (Kid).",
  "Upon activation, Patchface (Transfigured) (Special) finds the true essence of his soul, buffing his overall power and adding a permanent 30,240,000 damage to his current damage. This ability can only be used once and shares an infinite global cooldown with Eyepatch (Serious)'s Ultra Swap Ability.": "À l'activation, découvre l'essence de son âme, augmentant sa puissance globale de +30 240 000 dégâts permanents. Utilisation unique, partage un temps de recharge global infini avec Ultra Swap d'Eyepatch (Serious).",
  "Upon activation, Hakai deals 2 billion damage to enemies within his range. It has a cooldown of 8 minutes (480 seconds). It is not affected by any buffs.": "À l'activation, Hakai inflige 2 milliards de dégâts aux ennemis à portée. Temps de recharge de 8 minutes (480 secondes). N'est affecté par aucun buff.",
  "units in the Fusion category gain a 15% attack boost and boosts money by 15%.": "Les unités de la catégorie Fusion bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 15%.",
  "Upon activation, all enemies on the map under 10% HP will be insta-killed. Unlike Chain Avenger (Enraged), this ability has no 100 billion HP cap. This ability is a one-time use.": "À l'activation, tous les ennemis sur la carte sous 10% de PV sont exécutés instantanément sans plafond de PV. Utilisation unique.",
  "Kura's ability 'Write Names', needs to be manually activated. Upon activation, it deals damage equal to his damage stat to all enemies within Kura's range, including air mobs. After a cooldown of 500 seconds ≈ 8 minutes, it can be triggered again.": "Capacité à activation manuelle. Inflige des dégâts équivalents à sa stat d'attaque à tous les ennemis à portée, y compris les aériens. Réutilisable après 500 secondes (≈ 8 minutes).",
  "This passive gleans the unit with Attack Bypass and ability to damage on Elemental enemies. Every attack will hurt the Base's HP by 2.5% of Angels' current damage. However, it will not kill the Base because this will stop attacking if the base HP is below than 1 or an HP Amount is lower than 5% of Angels' Damage.": "Ce passif confère à l'unité le contournement de défense et la capacité de toucher les ennemis élémentaires. Chaque attaque blesse la base à hauteur de 2,5% des dégâts actuels d'Angels (l'attaque s'interrompt si les PV de la base descendent sous 1 ou si le montant est inférieur à 5% des dégâts).",
  "units in the Depraved Demons category gain a 15% attack boost and boosts money by 15%.": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 15%.",
  "Upon activation, she will deal 3x damage herself and apply Blue Flames on every enemy within her range.": "À l'activation, inflige 3x ses propres dégâts et applique Flammes Bleues à tous les ennemis dans sa portée.",
  "Similar to Eyepatch (Serious)'s, this ability permanently increases Tatsu (Rainbow Flames) final damage by 7,344,000. This ability has an infinite global cooldown that is shared with Eyepatch (Serious)'s Ultra Swap, Patchface (Transfigured)'s Instant Spirit Buff and Evil Shade (Final)'s Dragon Absorption.": "Augmente définitivement les dégâts finaux de Tatsu (Rainbow Flames) de 7 344 000. Temps de recharge global infini partagé avec Ultra Swap d'Eyepatch (Serious), Instant Spirit Buff de Patchface (Transfigured) et Dragon Absorption d'Evil Shade (Final).",
  "Heals the base for an additional 2.5x of the current Chain Avenger (Enraged) damage with a 600 second cooldown.": "Soigne la base de 2,5x les dégâts actuels de Chain Avenger (Enraged) avec un temps de recharge de 600 secondes.",
  "Increases Chain Avenger (Enraged) damage by around 11.6M damage for 120 second with a 600 second cooldown": "Augmente les dégâts de Chain Avenger (Enraged) d'environ 11,6M de dégâts pendant 120 secondes avec un temps de recharge de 600 secondes.",
  "Kills all enemies within his range that have 10% or lower HP, their HP need to be less than 100 billion. Otherwise he will deal 100B damage instead. This ability is a one time use per game.": "Élimine tous les ennemis à portée ayant 10% ou moins de PV (les PV doivent être inférieurs à 100 milliards, sinon inflige 100 milliards de dégâts à la place). Utilisation unique par partie.",
  "Upon activation, Future Demon King (Unlocked) will permanently give himself 30 million damage. The ability is a one time use, having an infinite cooldown.": "À l'activation, Future Demon King (Unlocked) s'octroie définitivement 30 millions de dégâts supplémentaires. Utilisation unique avec un temps de recharge infini.",
  "Upon activation, Patchface (Transfigured) activates his Domain Expansion, touching the souls of a Boss/Mini-Boss in range and converting them into transfigured enemies, which are portrayed as clones similar to Eyezen (Final)'s \"Hypnosis Takeover\". This ability can only be used on BOSSES/MINIBOSSES and will pick ONLY 1 Boss/Mini-Boss, and clone it (1 per path). All summoned units have 20% of that Boss/Mini-Boss's current health, with a health cap of 5,000,000,000 (5 billion) HP. This ability can only be used once. This ability also has INFINITE GLOBAL COOLDOWN that is shared with Eyezen (Final)": "À l'activation, active son Extension du Territoire, altérant l'âme d'un Boss/Miniboss à portée pour le cloner (1 clone par chemin, 20% des PV du Boss, plafond à 5 milliards de PV). Utilisable uniquement sur les Boss/Miniboss, utilisation unique partagée avec Eyezen (Final).",
  "Upon activation, Patchface (Transfigured) will use Idle Transfiguration, and heal your base (7.5B HP Heal). This ability shares a infinite global cooldown with Boo (Kid)'s Sleep Ability.": "À l'activation, utilise l'Altération Pure et soigne la base de 7,5 milliards de PV. Temps de recharge global infini partagé avec Sleep de Boo (Kid).",
  "Upon activation, Patchface (Transfigured) finds the true essence of his soul, buffing his overall power and adding a permanent 30,240,000 damage to his current damage. This ability has infinite global cooldown that share same global cooldown with Eyepatch (Serious)'s Ultra Swap and Tatsu (Rainbow Flames)'s Rainbow Flame Surge .": "À l'activation, découvre l'essence de son âme, augmentant sa puissance globale de +30 240 000 dégâts permanents. Temps de recharge global infini partagé avec Ultra Swap d'Eyepatch (Serious) et Rainbow Flame Surge de Tatsu (Rainbow Flames).",
  "Eat The Dirt is an ability that appears only if the Reset Orb is equipped to Yoshaga Kiryu (Eat The Dirt) on placement. When Eat The Dirt is activated, it reset all other units' manual ability cooldowns, but it doesn't affect global cooldowns such as those on Global Timestops. It also doesn't affect infinite statuses like Diavolo's Erasure status or a Rewind Invulnerability status. This ability has a GLOBAL cooldown of 1000 seconds (16 minutes and 40 seconds).\nKEEP IN MIND: His ability also affects timestops, buffs, Diavolo's erasure, non-global cooldown nukes, and other such things. If any of those are set to auto activate to stay on constantly or, say, be used once per wave on gauntlet with auto activate - the use of this ability will reset every ability and ruin all of their cycles, especially the timestops and buffs which will completely desync.": "Apparaît uniquement avec l'Orbe Reset équipé. Réinitialise les temps de recharge de toutes les aptitudes manuelles des autres unités (n'affecte pas les recharges globales ni les statuts infinis). Temps de recharge GLOBAL de 1000 secondes (16 min 40 s). Attention : perturbe les cycles automatiques des arrêts du temps et des buffs.",
  "Squad 7 Commander will apply a global +300% Damage buff (4x) and a Range buff of +20% for 60 seconds.\n• The cooldown of this ability is 61 seconds, meaning that a permanent buff can be achieved through auto-activation.": "Applique un bonus de dégâts global de +300% (4x) et un bonus de portée de +20% pendant 60 secondes. Temps de recharge de 61 secondes (buff permanent via activation automatique).",
  "This ability initiates a cutscene and permanently increases Eyepatch (Serious)'s final damage by around 26,600,000. It has an infinite global cooldown. This ability share same global cooldown with Tatsu (Rainbow Flames)'s Rainbow Flame Surge and Patchface (Transfigured)'s Instant Spirit Buff.": "Déclenche une cinématique et augmente définitivement les dégâts finaux d'Eyepatch (Serious) d'environ 26 600 000. Temps de recharge global infini partagé avec Rainbow Flame Surge de Tatsu (Rainbow Flames) et Instant Spirit Buff de Patchface (Transfigured).",
  "1. Gate of Babylon: Single target with miniscule SPA and high damage. Essentially a better 5 star Gilgamesh. The image used is the logo of Fate/Stay Night": "Gate of Babylon : Cible unique avec un SPA minuscule et de gros dégâts (version améliorée de Gilgamesh 5 étoiles).",
  "Upon activation, this ability heals the base for 750 million health at level ? while refreshing all ability cooldowns. It has a cooldown of roughly 17 minutes (1,020 seconds).": "À l'activation, soigne la base de 750 millions de PV tout en réinitialisant tous les temps de recharge des capacités. Temps de recharge d'environ 17 minutes (1 020 secondes).",
  "Heavenly Impact (Upgrade 6): Upon activation, a cutscene plays and Sorcerer Killer deals 1.3 billion damage to all enemies within his range. This ability has a global cooldown of 240 seconds.": "Palier 6 : À l'activation, cinématique puis Sorcerer Killer inflige 1,3 milliard de dégâts à tous les ennemis à sa portée. Temps de recharge global de 240 secondes.",
  "When clicked, Whitestache (Prime) \"cracks\" the air and creates 2 huge quakes, this summons 3 tsunamis which each have 36 million hp and when 1 comes to a split path it clones itself then 1 goes down each path. The cooldown of this ability is 3 minutes.": "Fissure l'air et déclenche 2 séismes majeurs, invoquant 3 tsunamis de 36 millions de PV chacun (se dupliquant aux bifurcations de chemin). Temps de recharge de 3 minutes.",
  "When activated, Esper Bro will achieve 100% Ritsu mode, collapsing the area around him. This ability deals 3.5 billion damage to all enemies in his range and permanently increases his damage by 16.8 million. This ability is a one-time use.": "À l'activation, passe en mode Ritsu 100% et effondre la zone autour de lui. Inflige 3,5 milliards de dégâts à tous les ennemis à portée et augmente définitivement ses dégâts de 16,8 millions. Utilisation unique.",
  "After reaching upgrade 7, Ganyu (Koku) will receive this ability. Upon activation, Ganyu (Koku) will gain 2,300,000 damage for a while. (Need to see if this scales with level and the duration time)": "Au palier 7, Ganyu (Koku) gagne +2 300 000 de dégâts temporairement à l'activation.",
  "Hits every enemy on the map for 3.3x of Gyro's damage and applies a new status effect that will extend the duration of the next normal Timestop applied by 2 Seconds. The mark lasts for 10 seconds, and global cooldown of 80 seconds": "Touche chaque ennemi sur la carte pour 3,3x les dégâts de Gyro et prolonge de 2 secondes le prochain arrêt du temps normal appliqué. La marque dure 10 secondes, temps de recharge global de 80 secondes.",
  "Upon activation, this ability transforms all enemy types within range—excluding Air, Miniboss, Armored, and Boss enemies—such as Powerful 1/2, Decelerate, Regenerate, Elemental, and Rage, into regular enemies.similar to Rimuru's Reveal.\n• This ability has a GLOBAL cooldown of 16 minutes (960 seconds).": "À l'activation, transforme tous les types d'ennemis à portée (Powerful 1/2, Decelerate, Regenerate, Elemental et Rage, hors Aériens, Miniboss, Blindés et Boss) en ennemis normaux (similaire à Reveal de Rimuru). Temps de recharge GLOBAL de 16 minutes (960 secondes).",
  "Units in the Unstoppable Forces gain Attack Boost +15%.": "Les unités de la catégorie Unstoppable Forces bénéficient d'un bonus d'attaque de +15%.",
  "Hae Cha will deal 2.5x of her damage in every 2nd attack.": "Hae Cha inflige 2,5x ses dégâts toutes les 2 attaques.",
  "title1=Exorcist (DemonLord)\n|image1=Exorcist (DemonLord) (Pose).png\n|caption1=No matter how strong you are, in the end it will be pulled down by those around you and destroyed\n|deployment_cost=500\n|upgrade_levels=6\n|total_cost=12,671,000\n|tower_type=Ground\n|enchant=Dark\n|attack_type=AoE (Full) -> AoE (Cone)\n|damage= 6,000 -> 7,420,000\n|seconds_per_attack= 6 -> 9\n|range= 45 -> 110": "Fiche de statistiques et détails d'évolution de l'unité Exorcist (DemonLord).",
  "Exorcist (DemonLord) summons one out of three demon servants from the base. The demon servant that is summoned is completely reliant on RNG. Centipede is the slowest demon servant with 137.5 million HP, Satori which has 110 million HP, and ElectroMonster which has 25 million HP, is the fastest of the summonable servants and stuns upon death. Multiple servants are summoned on maps with multiple paths, one for each path. The ability has a 45 second cooldown.\nFile:Exorcist (DemonLord) Manual Ability GIF 1.gif\nFile:Exorcist (DemonLord) Manual Ability GIF 2.gif\nFile:Exorcist (DemonLord) Manual Ability GIF 3.gif": "Invoque aléatoirement l'un des trois serviteurs démoniaques depuis la base (Mille-pattes à 137,5M PV, Satori à 110M PV, ElectroMonster rapide à 25M PV étourdissant à la mort). 1 serviteur par chemin, temps de recharge de 45 secondes.",
  "Units in the Godly category get a +15% damage boost.": "Les unités de la catégorie Godly bénéficient d'un bonus de dégâts de +15%.",
  "Heavenly Impact (Upgrade 6th): Upon activation, a cutscene will play and will do 1.3 billion damage to all enemies within his range. This ability has a global cooldown of 240 seconds.": "Palier 6 : À l'activation, cinématique puis inflige 1,3 milliard de dégâts à tous les ennemis à sa portée. Temps de recharge global de 240 secondes.",
  "Upon activation, Dark Lord (Serious) will use his Space-Time Manipulation Ultimate Skills, time stopping all enemies in his range for 8 seconds. This ability has a cooldown of 40 seconds.": "À l'activation, utilise ses compétences ultimes de manipulation spatio-temporelle, arrêtant le temps pour tous les ennemis à portée pendant 8 secondes. Temps de recharge de 40 secondes.",
  "Upon activation, Flare Lord (Serious) will use his Space-Time Manipulation Ultimate Skills, time stopping all enemies in his range for 8 seconds. This ability has a cooldown of 40 seconds.": "À l'activation, utilise ses compétences ultimes de manipulation spatio-temporelle, arrêtant le temps pour tous les ennemis à portée pendant 8 secondes. Temps de recharge de 40 secondes.",
  "This ability permanently increases Slayer Mage's final damage by around 2,880,000. This ability is a one-time use.": "Augmente définitivement les dégâts finaux de Slayer Mage d'environ 2 880 000. Utilisation unique.",
  "Upon activation, Masked Trapper places a trap on the track near him, damaging enemies who walk on it equal to their HP. The traps have HP equal to Masked Trapper's current damage stat. Multiple traps may be placed on one spot, and traps can be placed in different areas by controlling Masked Trapper. walking to another path and activating his ability there. This ability has a cooldown of 20 seconds, and the traps despawn after one minute.": "Place un piège sur la trajectoire, infligeant aux ennemis qui marchent dessus des dégâts égaux à leurs PV (PV du piège égaux à l'attaque de Masked Trapper). Les pièges disparaissent après 1 minute. Temps de recharge de 20 secondes.",
  "Upon activation, Hunter Duo will deal 2.4x their current damage to all enemies on the map. This ability has a cooldown of 300 seconds and a global cooldown shared with Paper Beauty (Goddess).": "À l'activation, Hunter Duo inflige 2,4x ses dégâts actuels à tous les ennemis sur la carte. Temps de recharge de 300 secondes, temps de recharge global partagé avec Paper Beauty (Goddess).",
  "Activate to toggle On/Off. Deals 3% of Three Eyes Grace’s damage every 0.3s to the entire map, while also dealing 0.3% of Three Eyes Grace’s damage every 0.3s to the base.": "Activer pour basculer Marche/Arrêt. Inflige 3% des dégâts de Three Eyes Grace toutes les 0,3 s à toute la carte, tout en infligeant 0,3% de ses dégâts toutes les 0,3 s à la base.",
  "Upon activation, Hecate [Virtual] will shoot and create a large explosion, damaging all enemies in her range for 2.5x her current damage. The cooldown for this ability is 240 seconds and there is no global cooldown.": "À l'activation, Hecate [Virtual] tire et déclenche une vaste explosion, infligeant 2,5x ses dégâts actuels à tous les ennemis à portée. Temps de recharge de 240 secondes, sans recharge globale.",
  "When activated, Kogan Supa II (Alternative) will deal 500 Million damage to ALL enemies on the map. This ability is a one-time use and has an infinite global cooldown linked with Stampede (???%)'s Esper Rage.": "À l'activation, Kogan Supa II (Alternative) inflige 500 millions de dégâts à TOUS les ennemis sur la carte. Utilisation unique, temps de recharge global infini lié à Esper Rage de Stampede (???%).",
  "When enemies are marked they will take 12% more damage and caused rewinded enemies walk back faster. Lasts 16 seconds before disappearing.": "Les ennemis marqués subissent 12% de dégâts supplémentaires et reculent plus rapidement lorsqu'ils sont remontés dans le temps. Dure 16 secondes.",
  "The WaxSlow effect is applied to enemies when they are hit by Mr. Wax. This effect makes enemies 85% slower and lasts for 35 seconds. WaxSlow does NOT stack with Slow, Sunburn or GaleSlow. Negates the effect of regular Rewind.": "Effet appliqué par Mr. Wax. Rend les ennemis 85% plus lents pendant 35 secondes. NE SE CUMULE PAS avec Ralentissement, Sunburn ou GaleSlow. Annule l'effet du retour dans le temps classique.",
  "Upon activation, Mr. Wax will stop attacking until this ability is activated again. The cooldown of this ability is 10 seconds.": "À l'activation, cesse d'attaquer jusqu'à réactivation. Temps de recharge de 10 secondes.",
  "FINAL BOMBLOSION is a manual activation ability. Upon activating, a cutscene referencing Vegeta's Sacrifice will play, in which Vegeta says his final words, then self destructs, dealing approximately 500 million damage to each enemy on the entire map. After the ability is triggered, Majin Vegeta will be deleted without a refund, so make sure you time it perfectly!": "Cinématique du sacrifice de Vegeta. S'auto-détruit en infligeant environ 500 millions de dégâts à chaque ennemi sur toute la carte. Majin Vegeta est ensuite supprimé sans remboursement.",
  "Units with the Electric enchant gain Attack Boost +15%.": "Les unités avec l'enchantement Électrique bénéficient d'un bonus d'attaque de +15%.",
  "The Gale Slow effect is applied to enemies when they are hit by Lucky Green (Dive). This effect makes enemy troops 30% slower than they normally are. This effect is stacked with Slow up to 65% movement speed reduction, but not with Sunburn 18% slow effect. This Effect lasts for 8 Seconds.": "Rend les troupes ennemies 30% plus lentes pendant 8 secondes (cumulable avec Ralentissement jusqu'à 65% de réduction, mais pas avec Sunburn).",
  "Upon activation, Lucky Green (Dive) will stop attacking until this ability is activated again. The cooldown of this ability is 10 seconds.": "À l'activation, cesse d'attaquer jusqu'à réactivation. Temps de recharge de 10 secondes.",
  "Upon activation, a short cutscene referencing the Jujutsu Kaisen anime will play out. During Sukuna's Expansion, known as Malevolent Shrine, it deals 3% of Sukuna's damage every 0.5 seconds, while also chipping away 0.25% of her damage from your base. The ability continually inflicts damage until the base health is depleted or until the player deactivates the ability. This ability has a cooldown of 5 seconds, no global cooldown, and scales with buffs.": "Cinématique de l'Autel Démoniaque de Sukuna. Inflige 3% des dégâts de Sukuna toutes les 0,5 seconde tout en retirant 0,25% de ses dégâts à la base jusqu'à épuisement ou désactivation. Temps de recharge de 5 secondes, s'adapte aux buffs.",
  "Upon activation, a short cutscene referencing the Jujutsu Kaisen anime will play out. During Sukuna's Expansion, known as Malevolent Shrine, it deals 3% of Sukuna's damage every 0.5 seconds, while also chipping away 0.25% of his damage from your base. The ability continually inflicts damage until the base health is depleted or until the player deactivates the ability by clicking again. This ability has a cooldown of 5 seconds, no global cooldown, and scales with buffs.": "Cinématique de l'Autel Démoniaque de Sukuna. Inflige 3% des dégâts de Sukuna toutes les 0,5 seconde tout en retirant 0,25% de ses dégâts à la base jusqu'à épuisement ou désactivation. Temps de recharge de 5 secondes, s'adapte aux buffs.",
  "The Gale Slow effect is applied to enemies when they are hit by Tornado Girl (Serious), and is activated when Tornado Girl (Serious) is upgraded to upgrade four. This effect makes enemy troops 30% slower than they normally are. This effect is stacked with Slow up to 65% movement speed reduction, but not with Sunburn 18% slow effect. This Effect lasts for 8 Seconds.": "Rend les troupes ennemies 30% plus lentes pendant 8 secondes (cumulable avec Ralentissement jusqu'à 65% de réduction, mais pas avec Sunburn).",
  "Upon activation, Tornado Girl (Serious) will stop attacking until this ability is activated again. The cooldown of this ability is 10 seconds.": "À l'activation, cesse d'attaquer jusqu'à réactivation. Temps de recharge de 10 secondes.",
  "Units in the Spirit Warriors category gain Attack Boost +15% and a 10% money bonus for economy units.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15% et d'un bonus d'argent de 10% pour les unités économiques.",
  "Upon activation, Spirit Nuke scales 2.25 times off her original damage to all enemies within her range. (This will effect Air enemies, Also the ability is effected by Buff and Level). This ability does have a global cooldown.": "À l'activation, inflige 2,25x ses dégâts d'origine à tous les ennemis à portée (affecte les aériens, s'adapte aux buffs et au niveau). Possède un temps de recharge global.",
  "Upon activation, Blinding Luster summons a shower of meteors, dealing 2.5x his current damage to every enemy within his range. This ability has a global cooldown of 440 seconds.": "À l'activation, invoque une pluie de météores infligeant 2,5x ses dégâts actuels à chaque ennemi à portée. Temps de recharge global de 440 secondes.",
  "Cresent Rose swaps to a New Attack Style with AoE (Full) and Critical Passive.\n• In every 2nd Attack, she can deal 3x more Damage.": "Adopte un nouveau style d'attaque AoE (Cercle complet) avec passif Critique (inflige 3x dégâts toutes les 2 attaques).",
  "Crescent Rose swaps to a New Attack Style with AoE (Cone). Now, her attack can damage on Air enemies as a Hybrid and apply Rupture.": "Adopte une attaque en AoE (Cône). Touche désormais les ennemis aériens en tant qu'unité hybride et applique Rupture.",
  "Cresent Rose swaps to a New Attack Style with AoE (Circle) and a range of 300. In this ability, she can still apply Rupture.\n• However, her tower type is Ground, so she can not deal with the Air Enemies.": "Adopte une attaque en AoE (Cercle) avec une portée de 300 et applique Rupture (type Sol, ne touche pas les aériens).",
  "Cresent Rose swaps to an Ultimate version of Nevermore Slayer's Attack Style. She still has AoE (Circle), a range of 300, and Rupture attacks.\n• Differently, Cresent Rose becomes a Hybrid, and her SPA is reduced from 9 to 5.": "Version ultime de Nevermore Slayer : AoE (Cercle), portée de 300, Rupture, devient Hybride et son SPA passe de 9 à 5.",
  "Lowers All Enemies to 45% of their Maximum HP and Executes All Enemies Under 3% of their Maximum HP": "Réduit tous les ennemis à 45% de leurs PV maximum et exécute tous les ennemis sous 3% de leurs PV maximum.",
  "Bilocation spawns 4 more temporary units around Buddy - named Yddub - with stats equal to the main Buddy's max stats (not current ones). These \"Yddub\"s can be upgraded once each for $1 (to be able to hit Powerful I enemies) and will disappear after 40 seconds. This ability has a cooldown of 4 minutes (240 seconds).": "Fait apparaître 4 unités temporaires « Yddub » autour de Buddy avec ses stats max. Améliorables une fois pour 1 $ (pour toucher les Powerful I), disparaissent après 40 secondes. Temps de recharge de 4 minutes (240 s).",
  "At Falcon (Eclipse)'s last upgrade, he gains an ability called \"Blood-Moon'. This boosts ALL D.O.T (Damage Over Time) effects by 1.3x for 300 seconds (5 minutes) and shows a cutscene of Griffith awakening the Egg of Kings. Cooldown: 600s (Global) Also affects buff unit The Almighty (Yhwach) causing the buff to not work until Blood-Moon is over. (we do not know if this is a bug or intentional)": "Au dernier palier, confère « Blood-Moon ». Multiplie TOUS les effets de dégâts sur la durée (DoT) par 1,3x pendant 300 secondes (5 minutes). Temps de recharge GLOBAL de 600 s. Empêche le buff de The Almighty (Yhwach) de fonctionner pendant la durée.",
  "Units with the Dark Enchant gain Attack Boost +15%": "Les unités avec l'enchantement Ténèbres bénéficient d'un bonus d'attaque de +15%.",
  "When this skill is activated, Crimson Boar (True) and other units in her range damage increases by a max of 300% and range increases by a max of 20%. The damage buff is affected by her level, and to achieve the max buff it must be chained similar to Onwin. This ability lasts for 30 seconds and has a cooldown of 60 seconds.": "Augmente les dégâts de Crimson Boar (True) et des unités à portée jusqu'à +300% et leur portée de +20% (nécessite d'être enchaîné comme Erwin pour le buff max). Dure 30 s, temps de recharge de 60 s.",
  "When activated, she timestops all enemies on the map for 1 minute, while still allowing your units to attack and allowing you to skip waves. This ability must be charged up to 100% before use by killing enemies, similar to Ultra Koku & Super 2 Vegu (Final) and Koku (Instinctive) and has a cooldown of 280 seconds and global cooldown of 340 seconds.": "Arrête le temps sur toute la carte pendant 1 minute tout en laissant vos unités attaquer et en permettant de passer les vagues (se charge à 100% via éliminations). Temps de recharge de 280 s, recharge globale de 340 s.",
  "Whenever Police Girl (Vamp) deals damage to enemies, that damage also heals Base HP for the same amount.": "Chaque fois que Police Girl (Vamp) inflige des dégâts aux ennemis, soigne la base du même montant de PV.",
  "Draw card is a manual ability of Yugi with 40 uses and a cooldown of 20 seconds. Initially you need use this ability which draws a random card from your deck, with the aim of drawing one of the five different Exodia cards (Body, Left Arm, Right Arm, Left Leg, Right Leg). If you draw an Exodia card, it appears permanently on display behind Yugi. Once you draw the fifth and last Exodia card, a cutscene will play, and Yugi deals exactly 5B damage to all enemies on the map, including air units. Considering that it is a random chance of obtaining the last card, attempting to use this ability as a last-ditch effort is very risky. A good way to use this ability as a last straw technique is to draw 4 cards in the early rounds and when you are in later rounds and enemies are getting through start auto-activating for the fifth card. The ability has a range of 336, meaning it can hit the entirety of all maps.": "Aptitude manuelle (40 utilisations, recharge 20 s). Pioche une carte pour réunir les 5 pièces d'Exodia (Corps, Bras Gauche/Droit, Jambe Gauche/Droite). La 5e pièce déclenche une cinématique et inflige 5 milliards de dégâts à toute la carte (sol et air, portée 336).",
  "Upon activation, Kogan will use all of his strength into his Kamehameha, to nuke enemies within his range for a total of 170 Million damage, enchant advantage and disadvantage apply however the damage cannot be buffed using abilities to increase damage done. This ability can be used once per Gohan but it does not have a global cd meaning it can be used by multiple players. Additionally this ability permanently adds a fixed 3,432,000 damage to Gohan and isnt effected by level.": "Déclenche un Kamehameha infligeant 170 millions de dégâts aux ennemis à portée (non buffable par capacités). Utilisable une fois par Gohan (pas de recharge globale). Ajoute définitivement 3 432 000 dégâts fixes à Gohan.",
  "The Gale Slow effect is applied to enemies when they are hit by Shaolin (B-Kui), and is activated when Shaolin (B-Kui) is on placement. This effect makes enemy troops 30% slower than they normally are. This effect is stacked with Slow up to 65% movement speed reduction, but not with Sunburn 18% slow effect. This effect lasts for 8 Seconds.": "Rend les troupes ennemies 30% plus lentes pendant 8 secondes (cumulable avec Ralentissement jusqu'à 65% de réduction, mais pas avec Sunburn).",
  "Upon activation, applies the Spin status effect that will extend the duration of the next normal Timestop applied by 2 Seconds (same status effect as Spin Master's Break Your Balls ability)\nThis ability's description is possibly incomplete.": "À l'activation, applique l'effet Rotation qui prolonge de 2 secondes le prochain arrêt du temps normal appliqué (identique à Break Your Balls).",
  "Upon activation of this ability, a cutscene plays. During the cutscene, all enemies on the map like Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, and Rage (except for Armored, Air, Miniboss, and Boss enemies) turns into regular enemies.\nThis ability has a server wide cooldown of 480 seconds, meaning you and other players can't use the ability from the rest of DemonLord Waifu's already maxed upgrade in place, you can't use the ability after Princess Appala already used her ability, you can't do the same method as The Patriot (such as spam place, upgrade, and use the ability nor you can't use Yoshaga Kiryu (Eat The Dirt)'s Eat The Dirt ability to reset Steal Soul's cooldown until the global cooldown expires.": "Cinématique transformant tous les ennemis sur la carte (Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Rage, hors Blindés, Aériens, Miniboss et Boss) en ennemis normaux. Temps de recharge serveur de 480 secondes.",
  "The Visionary can do 2x damage to enemies that have or originally\n• have a Title and can also do Piercing damage to Elemental enemies.\n• The Visionary can still do 2x damage to enemies that got turned into regular enemies": "The Visionary inflige 2x dégâts aux ennemis possédant ou ayant eu un Titre, et inflige des dégâts perforants aux ennemis élémentaires (maintient 2x dégâts sur les ennemis redevenus normaux).",
  "Upon activation, enemies are prevented from reaching the base for 42 seconds, and the base's hp is increased by 1.5 billion.\n• This ability has a global cooldown of 9 minutes and 30 seconds.\n• This ability shares a global cooldown with Ultimate Patriot's Love Car ability.": "À l'activation, empêche les ennemis d'atteindre la base pendant 42 secondes et augmente les PV de la base de 1,5 milliard.\n• Temps de recharge global de 9 minutes et 30 secondes partagé avec Love Car d'Ultimate Patriot.",
  "Places a barrier on the base, and enemies cannot get close to the base for 37 seconds. Additionally spawns in D4C LT as a New Tower with a status effect, an enemy marked with this effect will take 35% more DMG from the next attack they receive.": "Place une barrière sur la base empêchant les ennemis d'approcher pendant 37 secondes et invoque D4C LT qui marque les ennemis pour leur faire subir 35% de dégâts supplémentaires au prochain coup.",
  "Upon activation, Kurumi will summon and explode a large clock, applying Slow to all units in her range and timestopping them for 6.5 seconds. This ability has a cooldown of 40 seconds.": "Invoque et fait exploser une horloge géante, appliquant Ralentissement à toutes les unités à portée et arrêtant le temps pendant 6,5 secondes. Temps de recharge de 40 secondes.",
  "Upon activation, Patternine (Serious) gains 720,000 damage for 42 seconds. This ability does not stack with levels and has a cooldown of 160 seconds.": "À l'activation, Patternine (Serious) gagne 720 000 dégâts pendant 42 secondes. Ne varie pas avec les niveaux, temps de recharge de 160 secondes.",
  "Upon activation, Patternine (Serious) will use Annihilation Type, dealing x5.5 his current damage to all enemies in his range. This ability has a cooldown of 80 seconds and does not have a global cooldown.": "À l'activation, utilise Annihilation Type, infligeant 5,5x ses dégâts actuels à tous les ennemis à portée. Temps de recharge de 80 secondes, pas de recharge globale.",
  "When activated, Paper Beauty (Goddess) will deal 3x her current damage to all enemies in her range (affected by buff and levels). This ability has a cooldown of 5 minutes and a global cooldown which is also 5 minutes.": "À l'activation, inflige 3x ses dégâts actuels à tous les ennemis à portée (s'adapte aux buffs et niveaux). Temps de recharge de 5 minutes, recharge globale de 5 minutes.",
  "When this ability is used, French Crusader (Requiem) will time stop all enemies on the map for 10 seconds, and set a total 25 enemies' speed to 1 within his range. This ability has an infinite GLOBAL cooldown.\nNote: Setting the enemies's speed to 1 means that the enemies's speed will be decreased to their speed in wave 1.": "Arrête le temps pour tous les ennemis sur la carte pendant 10 secondes et fixe la vitesse de 25 ennemis à portée à 1 (leur vitesse de la vague 1). Temps de recharge GLOBAL infini.",
  "Units in the Inner Being Category gain a +15% damage bonus and a +10% cash bonus.": "Les unités de la catégorie Inner Being bénéficient d'un bonus de dégâts de +15% et d'un bonus d'argent de +10%.",
  "Upon activation, the ability deals 800 million damage to enemies within his range. It has a global cooldown of 4 minutes (240 seconds) and is not affected by any buffs.": "À l'activation, inflige 800 millions de dégâts aux ennemis à portée. Temps de recharge global de 4 minutes (240 secondes), n'est affecté par aucun buff.",
  "Tyler \"Rider\" Blevins will deal 3x of his damage in every 3rd attack.": "Tyler \"Rider\" Blevins inflige 3x ses dégâts toutes les 3 attaques.",
  "Like his 5-star, Dr. Heart makes a transparent blue sphere where the first enemy and all enemies inside the sphere get teleported to the second last corner that they turned. The Replacement II ability can teleport up to 18 enemies. The cooldown of Replacement II is 60 seconds. Enemies affected by this ability will gain a status effect, which prevents them from being affected again.": "Téléporte jusqu'à 18 ennemis à l'avant-dernier virage qu'ils ont franchi. Temps de recharge de 60 secondes. Les ennemis affectés reçoivent une immunité permanente.",
  "Similar to DemonLord Waifu, Dr. Heart turns all enemies within his range like Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Armored, and Rage (except for Air, Mini-boss, and Boss enemies) into Regular enemies. The global cooldown of Silent is 480 seconds and can only be repeatedly used by the Law that first activated the ability.": "Transforme tous les types d'ennemis à portée (Powerful 1/2, Decelerate, Cloner, Regenerate, Elemental, Armored et Rage, hors Aériens, Miniboss et Boss) en ennemis normaux. Temps de recharge global de 480 secondes (réutilisable uniquement par le Law qui a activé la capacité).",
  "Every 2 attacks, All Seeing (TS) does an attack which deals 3x his base damage.": "Toutes les 2 attaques, All Seeing (TS) effectue une attaque infligeant 3x ses dégâts de base.",
  "Units in the Prodigy Category gain Attack Boost +15% & 10% Bonus": "Les unités de la catégorie Prodigy bénéficient d'un bonus d'attaque de +15% et d'un bonus de 10%.",
  "Upon activation, a cutscene plays, where the Cursed Brothers have unlocked 120% of their potential. This ability gives Cursed Brothers a permanent damage increase of 5.66 million, which does not stack with level.": "À l'activation, cinématique débloquant 120% de leur potentiel. Augmente définitivement leurs dégâts de 5,66 millions (ne varie pas avec le niveau).",
  "Upon activation, a cutscene featuring Todo's Black Flash plays. This ability damages every enemy on the map for 2.5x their current damage stat, scales with buff and enchants, and has a cooldown of 400 seconds.": "Cinématique du Rayon Noir de Todo. Inflige à chaque ennemi sur la carte 2,5x ses dégâts actuels (s'adapte aux buffs et enchantements). Temps de recharge de 400 secondes.",
  "Upon activation, Upper Fraud places a trap made out of spikes on the track near him, damaging enemies who walk on it equal to their HP. If destroyed, the trap will inflict poison on the enemy, in total dealing x7 the trap's remaining damage. The spikes are always level 1 and do not gain HP with Upper Fraud's Level. Multiple spikes may be placed on one spot, and spikes can be placed in different areas by controlling Upper Fraud, walking to another path and activating his ability there. This ability has a cooldown of 90 seconds, and the traps despawn after 450 seconds.": "Place un piège de pointes sur la piste, infligeant aux ennemis qui marchent dessus des dégâts égaux à leurs PV. S'il est détruit, applique poison infligeant 7x les dégâts restants du piège. Disparaît après 450 secondes. Temps de recharge de 90 secondes.",
  "Hamulilly has a manual ability that allows her to timestop all enemies in her range for a certain amount of time. The larger her range is, the more reach her time stop has.\n• Cooldown: 40 seconds\n• Duration: 5 seconds": "Arrête le temps pour tous les ennemis à portée pendant 5 secondes (plus sa portée est grande, plus l'effet s'étend). Temps de recharge de 40 secondes.",
  "At Hudron's last upgrade, he gains an ability called \"Tidepool'.\nTidepool is an ability with a cooldown of 60 seconds that deals deal 6x Hudron's basic attack damage (scaled with buff %) to all enemies in his range. EX: Hudron with 3 million damage will deal 18m damage with his Tidepool ability.": "Au dernier palier, confère « Tidepool » (temps de recharge 60 s). Inflige 6x ses dégâts d'attaque de base (adaptés au % de buff) à tous les ennemis à portée (ex: 3M de dégâts = 18M avec l'aptitude).",
  "Whenever Darkaholic (Enchanted) deals damage to enemies, that damage also heals Base HP for the same amount.": "Chaque fois que Darkaholic (Enchanted) inflige des dégâts aux ennemis, soigne la base du même montant de PV.",
  "Upon activation of this ability, the damage of other units within her range increases by up to 300%, and their range increases by up to 20%. This ability lasts for 30 seconds and has a cooldown of 60 seconds.": "Augmente les dégâts des autres unités à portée jusqu'à 300% et leur portée jusqu'à 20% pendant 30 secondes. Temps de recharge de 60 secondes.",
  "Whenever Speedaholic (Enchanted) deals damage to enemies, that damage also heals Base HP for the same amount.": "Chaque fois que Speedaholic (Enchanted) inflige des dégâts aux ennemis, soigne la base du même montant de PV.",
  "Upon activation, all units within Research Captain's AoE (Circle) will be slowed and inflicted with the Virus effect. This ability has a cooldown of 120 seconds.": "Ralentit et applique l'effet Virus à toutes les unités dans son AoE (Cercle). Temps de recharge de 120 secondes.",
  "She has a manual ability that allows her to timestop all enemies in the map for a certain amount of time. This ability has a cooldown of 7 minutes (420 seconds), and a duration of 30 seconds.": "Arrête le temps pour tous les ennemis sur la carte pendant 30 secondes. Temps de recharge de 7 minutes (420 secondes).",
  "Like her other Gojo counterparts, has a manual ability that allows her to timestop all enemies in the map for a certain amount of time. This ability has a GLOBAL cooldown of 7 minutes (420 seconds), and a duration of 30 seconds.": "Arrête le temps pour tous les ennemis sur la carte pendant 30 secondes. Temps de recharge GLOBAL de 7 minutes (420 secondes).",
  "Units with the Nature Enchant gain a 10% attack boost and a 10% reduced skill cool down time.": "Les unités avec l'enchantement Nature bénéficient d'un bonus d'attaque de 10% et d'une réduction de 10% du temps de recharge des compétences.",
  "Upon activation, Bunny Enthusiast deals 170 Million Damage to every enemy within his range. This ability has a global cooldown of 300 seconds.": "À l'activation, inflige 170 millions de dégâts à chaque ennemi à portée. Temps de recharge global de 300 secondes.",
  "Units in the Depraved Demons Category gain Attack boost +15% & +10% Bonus (Money earned per wave)": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10% (argent gagné par vague).",
  "Upon activation, Mr. Catholic will apply Judgement on all the enemies within his range\n• By each tick, his attack will deal 7.7x of Mr. Catholic's current damage.": "Applique Jugement à tous les ennemis à portée. Chaque tick inflige 7,7x les dégâts actuels de Mr. Catholic.",
  "units in the White/Holy Enchant gain a 15% attack boost and boosts money by 15%.": "Les unités avec l'enchantement Sacré/Blanc bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 15%.",
  "Units with the Fire Enchant gain AttackBoost +15%.": "Les unités avec l'enchantement Feu bénéficient d'un bonus d'attaque de +15%.",
  "Every 4th attack, 4-Eye Sorcerer (Timer) does an attack which deals 4x his base damage.": "Toutes les 4 attaques, 4-Eye Sorcerer (Timer) effectue une attaque infligeant 4x ses dégâts de base.",
  "Every 3 attacks, Dimensional Alien (Strong) does an attack which deals 3x his base damage.": "Toutes les 3 attaques, Dimensional Alien (Strong) effectue une attaque infligeant 3x ses dégâts de base.",
  "With Boo (Evil)'s last upgrade, he gains an ability called \"Chocolate Beam\". This permanently increases his damage by roughly 710,000.\nWhen activated, a cutscene will play and change Boo (Evil)'s appearance to Super Buu.\nThis ability has an infinite cooldown as you cannot deactivate it.": "Au dernier palier, confère « Chocolate Beam » (+710 000 dégâts permanents). Cinématique transformant Boo (Evil) en Super Buu. Temps de recharge infini (transformation irréversible).",
  "Units in the Pure Hearted Category gain Attack Boost +15": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +15%.",
  "Her attack can cause 2x Damage on all Special Enemies, especially she can damage on Elemental enemies.": "L'attaque inflige 2x dégâts à tous les ennemis spéciaux, et permet notamment de toucher les ennemis élémentaires.",
  "This ability works only when any variants of Ruffy is placed on the map. When Love Love! is activated, a cutscene plays and she timestops all enemies over the entire map for a very long 45 seconds, while still allowing your units to attack and allowing you to skip waves. The cooldown of this ability is 400 seconds. The global cooldown of this ability is shared with ZIO (ASCENDED), Jokato Koju (ASCENDED), and Devil (he will only teleport 3 corners and reduce the hp of the enemy, but without the timestop).": "Requiert n'importe quel Ruffy sur la carte. Arrête le temps sur TOUTE la carte pendant 45 secondes (les unités attaquent et les vagues peuvent être passées). Temps de recharge de 400 secondes partagé avec ZIO (ASCENDED), Jokato Koju (ASCENDED) et Devil.",
  "Upon activation, Lucci will allow ALL ground units IN HIS RANGE to hit air enemies that are on the map at the time of the ability use, basically making them hybrid units. However, air enemies that spawn AFTER the use of the ability will be unable to be affected by ground units until the ability is used again. Cooldown for this ability is approximately 10 minutes and the global cooldown is approximately 9 minutes.": "Permet à TOUTES les unités terrestres à portée de toucher les ennemis aériens présents sur la carte (les transformant en hybrides). N'affecte pas les aériens apparaissant après l'activation. Recharge ~10 min, recharge globale ~9 min.",
  "Every 3 attacks, Messi (The Egoist) does an attack which deals 3x his base damage.": "Toutes les 3 attaques, Messi (The Egoist) effectue une attaque infligeant 3x ses dégâts de base.",
  "When Sword Blocker is activated, Saber protects base with her sheath, Avalon, and prevents enemies from walking past a certain point for 24 seconds, and if they do pass it, they get pushed back. The cooldown is 6 minutes and 40 seconds. It has a global cooldown of 6 minutes. Units trapped by this ability are now able to be attacked by towers and affected by abilities.": "Protège la base avec son fourreau Avalon, empêchant les ennemis de dépasser un point fixe pendant 24 secondes (repoussés en arrière s'ils passent). Les unités bloquées peuvent être attaquées par les tours. Recharge 6 min 40 s, recharge globale 6 min.",
  "This ability permanently increases Loving Pillar's final damage by around 840,000, which raises her DPS to 281,667 (decimal rounded up) at level 1, and 443,450 at level 175. It has an infinite cooldown. (This Special ability is unlocked at the units 9th upgrade)": "Augmente définitivement les dégâts finaux de Loving Pillar d'environ 840 000 (DPS de 281 667 au niveau 1, 443 450 au niveau 175). Temps de recharge infini (débloqué au palier 9).",
  "Old Ice is a manual ability of Ice Marine that once activated will deal 3x his current damage in double his range. It also freezes all enemies for three seconds. This ability has a cooldown of 8 minutes and 20 seconds, which means that you might only be able to get a few uses out of it.": "Inflige 3x ses dégâts actuels dans le double de sa portée et gèle tous les ennemis pendant 3 secondes. Temps de recharge de 8 minutes et 20 secondes.",
  "When activated, half of God Black Fusion (Alternative)'s body will become corrupted and he will gain 1,000,000 more damage (which does not scale with level) and shorter AoE. He will also no longer change enemies' enchant to Dark. This is a permanent change and does not have a cooldown.": "La moitié du corps de God Black Fusion (Alternative) se corrompt : gagne +1 000 000 de dégâts et une AoE plus courte, mais ne change plus l'enchantement des ennemis en Ténèbres. Changement permanent sans temps de recharge.",
  "Units in the Antiheros Category gain Attack Boost +15% & +7% Bonus (Money earned per wave)": "Les unités de la catégorie Antiheros bénéficient d'un bonus d'attaque de +15% et d'un bonus de +7% (argent gagné par vague).",
  "When activated, God Black Fusion creates a huge purple entity, resembling a monstrous bird. This will decrease the enemies' HP down to 50%, but it only works if the enemy has above 50% HP. This will only affect the enemies in his range (including air enemies). The cooldown of this ability is 4 minutes and 10 seconds.": "Crée une entité violette géante réduisant les PV des ennemis à portée à 50% de leurs PV max (fonctionne uniquement si les ennemis ont plus de 50% de PV, touche les aériens). Temps de recharge de 4 minutes et 10 secondes.",
  "The March! is Airren's ability that will show up on upgrades 7 and higher. This ability requires Nominated Monster Giant placed anywhere on the map regardless of who placed it. Once activated, a short cutscene referencing the Attack On Titan anime will play out, in which Airren's head will be shot off at the neck and Nominated Monster Giant manages to catch it before it touches the ground, allowing Airren to use the Founding Titan and activate The Rumbling. During The Rumbling, a lot of Wall Titans and Airren's Founding Titan will spawn at the base and slowly march across the entire map. Any enemy troops coming into contact with Airren or any of the Colossal Titans will be dealt ~11.05% of Airren's current damage every third of a second until the ability ends. The Rumbling lasts ~42 seconds and has a 13 minute cooldown (780 seconds) but it is not global. You still have to wait until the current Rumblng ends before using another one, making it the only ability where how often you can use it varies across different maps.\n(Credit to the ASTD Trello for the manual ability GIF)": "Requiert Nominated Monster Giant sur la carte. Cinématique puis de nombreux Titans des Murs et le Titan Originel d'Airren apparaissent à la base et marchent lentement sur toute la carte. Les ennemis touchés subissent ~11,05% des dégâts actuels d'Airren chaque tiers de seconde. Dure ~42 s, recharge de 13 minutes (780 s, non globale).",
  "Every 2nd attack, she will deal 2.6x of her current Damage.": "Toutes les 2 attaques, inflige 2,6x ses dégâts actuels.",
  "units in the Redemption category gain a 15% attack boost and boosts money by 20%.": "Les unités de la catégorie Redemption bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 20%.",
  "Similarly to Dr. Heart's Replacement, Tyrant sends up to four enemies in his range back to the last corner. Using the Paw Orb, the PawPaw ability can teleport up to 15 enemies max instead of 4. Enemies affected by this ability gain a status effect which prevents them from being affected again. This ability has a cooldown of 45 seconds.": "Renvoie jusqu'à 4 ennemis à portée au dernier virage (jusqu'à 15 ennemis avec l'Orbe Paw). Les ennemis affectés deviennent immunisés. Temps de recharge de 45 secondes.",
  "Enhancement is a manual ability acquired by Mr. Vampire on his last upgrade. When clicked, Mr. Vampire will summon a horde of horses, bleeding all units in his attack range. It has a cooldown of 6 minutes and 45 seconds.\n(Credit to the ASTD Trello for these GIFs)": "Invoque une horde de chevaux appliquant saignement à toutes les unités dans sa portée d'attaque. Temps de recharge de 6 minutes et 45 secondes.",
  "Upon activation, Quite's attack type changes to AoE (Circle), his damage changes to 326,000 at level 1, his range changes to 150, and he inflicts Bleed.": "L'attaque passe en AoE (Cercle), ses dégâts passent à 326 000 au niveau 1, sa portée à 150 et inflige Saignement.",
  "Upon activation, Quite's damage changes to 571,000 at level 1, and his range changes to 60.": "Ses dégâts passent à 571 000 au niveau 1 et sa portée à 60.",
  "Upon activation, Quite's attack type changes to AoE (Cone), his damage changes to 477,000 at level 1, and his range changes to 100.": "L'attaque passe en AoE (Cône), ses dégâts passent à 477 000 au niveau 1 et sa portée à 100.",
  "At Kogo's last upgrade, he gains an ability called \"Eruption\". Upon activation, all units in Kogo's range will be inflicted with burn damage, each tick dealing around 3x his current damage. It has a cooldown of 300 seconds and shares a global cooldown with Kura.": "Au dernier palier, applique des dégâts de brûlure à toutes les unités à portée (chaque tick inflige ~3x ses dégâts actuels). Recharge de 300 s, recharge globale partagée avec Kura.",
  "This ability only appears when the Envy Orb is equipped. Upon activation of this ability, a cutscene plays. During the cutscene, all enemies on the map are rewinded for 12 seconds. The distance enemies are rewinded depends on how fast they are going. This ability does not have a global cooldown and has a cooldown of 510 seconds.\nJust like Star Boy (Requiem) and Dr. Heart, enemies gain permanent immunity after being rewinded by Zero, so players cannot spam the ability.": "Apparaît uniquement avec l'Orbe Envy équipé. Cinématique remontant le temps de 12 secondes pour tous les ennemis sur la carte (selon leur vitesse). Les ennemis deviennent définitivement immunisés. Pas de recharge globale, temps de recharge de 510 s.",
  "Fear causes an affected enemy to take 10% additional damage. And makes Enemies walk backward faster when rewinded. Fear last for 16 seconds before disappearing.": "Fait subir 10% de dégâts supplémentaires aux ennemis affectés et les fait reculer plus vite lorsqu'ils sont remontés dans le temps. Dure 16 secondes.",
  "Upon activation, all units in The End (Demon)'s range will be inflicted with bleed damage, each tick dealing around 4.8x of his current damage. This ability has a global cooldown of 480 seconds.": "Applique saignement à toutes les unités à portée (chaque tick inflige ~4,8x ses dégâts actuels). Temps de recharge global de 480 secondes.",
  "Upon activation, all units in The Fear (Volt)'s range will be inflicted with bleed damage, each tick dealing around 4.8x of his current damage. This ability has a global cooldown of 480 seconds.": "Applique saignement à toutes les unités à portée (chaque tick inflige ~4,8x ses dégâts actuels). Temps de recharge global de 480 secondes.",
  "When activated, Frost Moon will time stop the ENTIRE map for 24 seconds and deal 110 Million damage to ALL enemies on the map. This ability can be reused, both the time stop, and the nuke. Total Judgement has a GLOBAL cooldown of 6 minutes and 40 seconds, or 400 seconds.\nCooldown: 400 seconds\nDuration: 24 seconds": "Arrête le temps sur TOUTE la carte pendant 24 secondes et inflige 110 millions de dégâts à TOUS les ennemis sur la carte (réutilisable). Temps de recharge GLOBAL de 6 minutes et 40 secondes (400 s).",
  "• Timestop II (4th upgrade): When activated, he timestops all enemies in his range (even with buff) for 6.5 seconds. The cooldown of this ability is 30 seconds.\n• Ultimate Timestop II (5th upgrade): When activated, he timestops all enemies on the map for 30 seconds, while still allowing your units to attack and allowing you to skip waves. The cooldown of this ability is 500 seconds. The global cooldown of this ability is shared with ZIO (ASCENDED), Ms. Love TS and Devil (he will only teleport three corners and reduce the HP of the enemy, but without the timestop).": "• Timestop II (Palier 4) : Arrête le temps pour tous les ennemis à portée pendant 6,5 secondes (recharge 30 s).\n• Ultimate Timestop II (Palier 5) : Arrête le temps sur toute la carte pendant 30 secondes (les unités attaquent et les vagues peuvent être passées, recharge 500 s partagée avec ZIO ASCENDED, Ms. Love TS et Devil).",
  "Upon activation, up to 18 enemies in range are teleported back 2 corners.\n• Enemies affected by this ability will gain a status effect, which prevents them from being affected again.\n• 60 second cooldown.": "Téléporte jusqu'à 18 ennemis à portée en arrière de 2 virages (les ennemis affectés deviennent immunisés). Temps de recharge de 60 secondes.",
  "Upon activation, Scythe Shorty (First Seraph) gains a flat damage buff of 480,000 and critical status as dealing 3x damage every 3 attacks.\n• It has a global cooldown per placement": "Augmente ses dégâts de +480 000 et confère le statut Critique (3x dégâts toutes les 3 attaques). Possède un temps de recharge global par déploiement.",
  "units in the Godlike Power category gain a 15% attack boost and boosts money by 15%.": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 15%.",
  "Upon activation, all enemies in range are timestopped for 6.3 seconds.\n• 500 second cooldown": "Arrête le temps pour tous les ennemis à portée pendant 6,3 secondes. Temps de recharge de 500 secondes.",
  "Upon activation, Bunny Girl will cause numerous cars to fall from the sky, damaging all enemies on the map for 125 million damage. This ability has a global cooldown of 180 seconds (3 minutes).": "Fait pleuvoir des voitures depuis le ciel, infligeant 125 millions de dégâts à tous les ennemis sur la carte. Temps de recharge global de 180 secondes (3 minutes).",
  "Za Water is a special ability Jaws unlocks at his final upgrade. It is similar to Mysterious X (VOID)’s Timestop, which timestops every enemy in his range. Za Water lasts around the same time as Mysterious X (Void)’s Timestop ability as well, which is around six seconds. It has a cooldown of 500 seconds.": "Arrête le temps pour tous les ennemis à portée pendant environ six secondes (similaire à Mysterious X). Temps de recharge de 500 secondes.",
  "Units in the Fatherly Bond category get a +15% damage boost.": "Les unités de la catégorie Fatherly Bond bénéficient d'un bonus de dégâts de +15%.",
  "Life or Death! is Large Mother (Mad)’s manual ability that will be obtained after upgrading to her final upgrade. This ability works like Star Boy (Requiem)’s ability, stunning enemies and bringing them back.\nWhen the manual ability is activated, a huge sphere is created near it, in which enemies are stunned and come back, after which the sphere disappears.": "Crée une immense sphère qui étourdit les ennemis et les ramène en arrière avant de disparaître (similaire à Star Boy Requiem).",
  "(TAKE THIS WITH A GRAIN OF SALT, INFORMATION IS NOT CONFIRMED) When activated, all enemies on the map will be invisibly debuffed, making all stuns last for 3.5x longer than usual (7 seconds). This ability has a global cooldown of three minutes.": "Applique un malus invisible multipliant la durée de tous les étourdissements par 3,5x (7 secondes). Temps de recharge global de trois minutes.",
  "TimeStop Ultimate is ZIO’s manual ability that will be obtained after upgrading him to his final upgrade. TS is short for timestop, so as the name suggests, it is a timestop type ability. However, ZIO’s ability covers the entire map and lasts for 30 seconds, affecting both air and ground enemies while still allowing units to attack and waves to be skipped.\nWhen activated, a short cutscene plays and the color of the map is completely inverted before turning into a gray color, indicating that time has stopped. Particle effects of the skill also stop. It has a catch though, as the cooldown of the ability is server wide and lasts five to six mintues, making the sell and replace strategy impossible. To counteract this, it is suggested to use ZIO (ASCENDED) with another timestop unit. This ability has a cooldown of 400 seconds or 6 minutes and 40 seconds.": "Arrête le temps sur toute la carte pendant 30 secondes (affecte sol et air, permet d'attaquer et de passer les vagues). Recharge serveur de 400 secondes (6 min 40 s).",
  "When Total Freeze is activated, they timestop all enemies over the entire map for 25 seconds, while still allowing your units to attack and allowing you to skip waves. The cooldown of this ability is 340 seconds. The global cooldown of this ability is 400 seconds. The global cooldown of this ability is shared with ZIO (ASCENDED), Jokato Koju (ASCENDED), and Devil (he will only teleport 3 corners and reduce the hp of the enemy, but without the timestop).": "Arrête le temps sur toute la carte pendant 25 secondes (les unités attaquent, permet de passer les vagues). Temps de recharge de 340 s, recharge globale de 400 s partagée avec ZIO (ASCENDED), Jokato Koju (ASCENDED) et Devil.",
  "Devil Back is The Grappler's ability obtained when on his final upgrade. This ability adds 800,000 to his current damage. He emits white and red energy flames from his body during activation. This effect lasts for 30 seconds, and has a cooldown of 200 seconds (which includes the 30 seconds of activation).": "Ajoute +800 000 à ses dégâts actuels pendant 30 secondes en émettant des flammes blanches et rouges. Temps de recharge de 200 secondes.",
  "Upon activation, JJ-Siwa will do 10x her displayed damage to ALL enemies IN RANGE (Example: JJ-Siwa Damage: 500K, String Trap Damage: 5M). This ability has a 90 second (1 minute and 30 seconds) cooldown, with NO global cooldown (Spammable).": "Inflige 10x ses dégâts affichés à TOUS les ennemis À PORTÉE (ex: 500k dégâts = 5M). Temps de recharge de 90 secondes, sans recharge globale (spammable).",
  "Upon activation, Ikki (Anni) will deal 8.4x his current damage and apply Rupture to all enemies in his range, which stacks with buffs and enchant. This ability has a global cooldown of 300 seconds, and shares this cooldown with Kogo The Curse.": "Inflige 8,4x ses dégâts actuels et applique Rupture à tous les ennemis à portée (se cumule avec buffs et enchantements). Temps de recharge global de 300 secondes partagé avec Kogo The Curse.",
  "Upon activation\n• The amount of damage Killer S+ does will be brought over to the base in HP. (Stacks with damage buffs)": "À l'activation, le montant des dégâts infligés par Killer S+ est transféré en PV à la base (se cumule avec les buffs de dégâts).",
  "Upon activation\n• Deals 2M DMG to every enemy in his range.(Stacks with range buffs)": "À l'activation, inflige 2M de dégâts à chaque ennemi à portée (se cumule avec les buffs de portée).",
  "Upon activation\n• Add $200,000 to balance.\n• This ability is the main reason Killer S+ is used in Gauntlet, and he is one of the must-have meta units in gauntlet mode because he is the only way to earn cash in real time based, which suits the stalling pace of Gauntlet mode.": "À l'activation, ajoute 200 000 $ au solde. Unité clé du mode Gauntlet grâce à ses gains financiers en temps réel adaptés au rythme de temporisation.",
  "Upon activation, a cutscene will play and will do 75 million damage to all enemies on the map. This ability has a global cooldown of 180 seconds or 3 minutes, which is tied to Limilia (Ultimate), Bunny Girl and Bunny Enthusiast.": "À l'activation, cinématique puis inflige 75 millions de dégâts à tous les ennemis sur la carte. Temps de recharge global de 180 secondes (3 minutes) lié à Limilia (Ultimate), Bunny Girl et Bunny Enthusiast.",
  "Upon activation, a cutscene will play and will do 75 million damage to all enemies on the map. This ability has a global cooldown of 180 seconds, which is tied to Bunny Girl.": "À l'activation, cinématique puis inflige 75 millions de dégâts à tous les ennemis sur la carte. Temps de recharge global de 180 secondes lié à Bunny Girl.",
  "• Buff Ability (5th Upgrade): When activated, he buffs all units in his range 250% damage and 20% range boost. The buff ability has a cooldown of 60 seconds and lasts for 30 seconds.\n• FV Ability (6th Upgrade): When activated, he prevents the enemies from walking past a certain point near the base for 24 seconds, pushing them back if they do pass it (not work in gauntlet), can only be used once every 6 minutes": "• Capacité Buff (Palier 5) : Augmente les dégâts de toutes les unités à portée de 250% et leur portée de 20% (recharge 60 s, dure 30 s).\n• Capacité FV (Palier 6) : Empêche les ennemis de dépasser un point fixe près de la base pendant 24 secondes (les repousse s'ils passent, ne fonctionne pas en Gauntlet, utilisable une fois toutes les 6 minutes).",
  "The deceleration effect is applied to enemies when they are hit by Raizan, and is always activated when Raizan is deployed. This effect slows enemy troops to 50% of their normal speed. The effect is permanent.": "L'effet de décélération ralentit les ennemis touchés à 50% de leur vitesse normale de façon permanente dès le déploiement.",
  "When at max level, Whitestache (Final Stand), has the ability called 'Family Over All', which is a manually activated ability. This ability deals an AoE (Full) attack of damage equal to the sum of Whitestache's damage state and level to ground and air units. This ability also summons a massive tsunami, which appears larger than the normal tsunamis, and has x6 the HP of a normal tsunami. This ability has a cool-down of 120 seconds. It is also worth noting that while his normal tsunamis' damage does not change despite an equipped Orb, the giant tsunami's damage does.\n• Level one large tsunami = 60,02k HP (116,04k HP with orb)": "Au niveau max, inflige une attaque en AoE (Cercle complet) égale à la somme des dégâts et du niveau de Whitestache aux unités terrestres et aériennes. Invoque également un tsunami géant (6x les PV d'un tsunami normal). Temps de recharge de 120 secondes.",
  "Upon activating, a cutscene will play, showing Julian's grimoire above him, while rewinding all enemies in his range to their position from 12 seconds ago. This ability has a cooldown of 8 minutes.": "À l'activation, cinématique montrant le grimoire de Julian et remonte le temps de 12 secondes pour tous les ennemis à portée. Temps de recharge de 8 minutes.",
  "Devil Back is The Big G's ability on his final upgrade. This ability adds 800,000 to his current attack. Upon activation, he rips his shirt off and emits white and purple flames from his body. This effect lasts for 30 seconds, and has a cooldown of 60 seconds (which includes the 30 seconds of activation).": "Ajoute +800 000 à son attaque actuelle pendant 30 secondes en émettant des flammes blanches et violettes. Temps de recharge de 60 secondes (incluant les 30 s d'activation).",
  "Time Rewind is a manual activation ability. It makes every unit within a range of 55 return to the position they were in 10 seconds ago, even if this position is outside of his range of 40. This ability affects both air and ground units. Units can still be time stopped while being rewinded, although affected units will not continue to get rewinded, even if the 10 seconds aren't over. The ability refreshes after 60 seconds. Flower Magus's range boost or the Blue Eye Orb will not boost time rewind's range. Star Boy (Requiem)’s Time Rewind is still usable even when enemies are stunned. The Pink Star Orb does not affect Star Boy (Requiem)'s ability.\nNote: Selling and spamming the ability is useless, as enemies who have been rewinded gain permanent immunity to the effect.": "Renvoie chaque unité dans un rayon de 55 à la position qu'elle occupait il y a 10 secondes (affecte sol et air). Les ennemis affectés deviennent immunisés. Se réinitialise après 60 secondes.",
  "When activated, Echastia sings a song that stuns all enemies in her range for five seconds. The ability has a cooldown of 80 seconds.": "Chante une mélodie qui étourdit tous les ennemis à portée pendant 5 secondes. Temps de recharge de 80 secondes.",
  "Units with the Blue Enchant gain Attack Boost +15%.": "Les unités avec l'enchantement Bleu bénéficient d'un bonus d'attaque de +15%.",
  "LanzoUlq or Lanza Del Relámpago is a manual activation ability acquired by Dark Wing in his last upgrade. It affects Dark Wing's entire range (and a bit further out) and does 2.5 times the damage of his final upgrade. Ulquiorra forms a Lance and throws it into the air, and it lands a few seconds later sending out a nuke-like attack that inflicts damage to everything on the map. The ability has about a one minute cooldown.": "Aptitude manuelle du dernier palier. Inflige 2,5x les dégâts du dernier palier dans toute sa portée. Ulquiorra projette une lance créant une explosion massive endommageant toute la carte. Temps de recharge d'environ 1 minute.",
  "Units in the Corrupted category gain Attack Boost +15% + 15% ? Bonus.": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  ":Like his 5-star, Mysterious X (VOID) has a manual ability that allows him to timestop all enemies in his range for a certain amount of time. His Timestop range is NOT affected by any Orbs or Buffs that increases range.\n:": "Arrête le temps pour tous les ennemis à portée pendant une durée déterminée (la portée de l'arrêt du temps n'est pas affectée par les orbes ou buffs de portée).",
  "Superhit has a manual ability that allows him to timestop all enemies in his range for a certain amount of time. Enemies that were affected by the ability will not be affected by it again for 10 seconds. It will affect both enemy air and ground units. It behaves exactly like Infinite Void Gojo's Domain 9.": "Arrête le temps pour tous les ennemis à portée (sol et air). Les ennemis affectés ne peuvent plus être réaffectés pendant 10 secondes (identique au Domaine de Gojo).",
  "TimeStop P4 is Jokato Koju's manual ability that freezes all enemies in place for five seconds and does not stack with other P4 TimeStops. It has a range of ~80 and a 30 second cooldown.": "TimeStop P4 gèle tous les ennemis sur place pendant 5 secondes (portée ~80, recharge 30 s, ne se cumule pas avec d'autres TimeStops P4).",
  "The deceleration effect is applied to enemies when they are hit by Black Stache, and is activated when he is upgraded to upgrade two. This effect makes enemy troops two times slower than they normally are. The effect is permanent. Leveling him up does not affect the deceleration effect.": "Ralentit les troupes ennemies de moitié de façon permanente dès le palier 2 (le niveau n'affecte pas le ralentissement).",
  "Skeleton (Artist) can play music on his activation, and the song can be selected using a Sound ID list.\nWhen his skill is activated, his and other units damage increases by a max of 250% and range increases by a max of 20%, depending on his damage and level. The range buff provided by this ability is affected solely by Skeleton (Artist)'s level with roughly 10% at lvl 1 and 20% at lvl 175. In contrast, the damage buff is affected directly by the level in addition to the upgrade and damage of Skeleton (Artist), allowing for chaining his damage buffs until reaching the max +250% threshold. Before update 29, the cooldown on this ability was non-existent. The ability now has a cooldown of 60 seconds and lasts for 30 seconds.\nNote: To hear music, you must turn up the music in the game settings, attack effects must be on, and the Audio ID must be valid.": "Skeleton (Artist) peut jouer de la musique via une liste de Sound ID. Augmente ses dégâts et ceux des unités à portée jusqu'à +250% et la portée jusqu'à +20% (portée liée au niveau de Brook : 10% au niv. 1, 20% au niv. 175 ; dégâts chaînables jusqu'au plafond de +250%). Dure 30 s, temps de recharge de 60 s.",
  "Upon activation, the damage of all units in Idol's range will be buffed by the current percentage represented on her card (capped at 250%). The buff lasts for 60 seconds and the global cooldown of the ability is 60 seconds, meaning that a near-perfect autobuff can be achieved using the auto-activate button. One player can use Shine at a time.": "Augmente les dégâts de toutes les unités à portée selon le pourcentage affiché sur sa carte (plafonné à 250%). Dure 60 secondes avec une recharge globale de 60 secondes (buff permanent en auto-activation). Un seul joueur peut utiliser Shine à la fois.",
  "Upon activation, a cutscene plays where Idol does a short performance. The ability makes every enemy currently on the map take 15% more damage from all sources for 4 minutes. It has a cooldown of 10 minutes.": "Cinématique où Idol réalise une performance. Tous les ennemis sur la carte subissent 15% de dégâts supplémentaires de toutes sources pendant 4 minutes. Temps de recharge de 10 minutes.",
  "Teachings is an ability that buffs other units' damage in Metallic King's range and is obtained upon deployment. The buff has a duration of 40 seconds and a cooldown of 60 seconds, and has a stacking limit of 250% (making the buff 3.5x the initial damage).": "Augmente les dégâts des unités à portée (dure 40 s, recharge 60 s, cumul plafonné à 250%, soit 3,5x les dégâts initiaux).",
  "Activating this will collect the stored money.\nNote: After collection, money generation is cancelled, so it should only be done when there is enough money to place all remaining troops.\nAlso, if collected before upgrading, the total amount of income will decrease depending on how much the ability is used.": "Collecte l'argent stocké. Après la collecte, la génération d'argent s'arrête (à n'utiliser que lorsque vous avez assez d'argent pour placer toutes vos troupes restantes). Si collecté avant d'améliorer, le revenu total diminue selon l'utilisation de la capacité.",
  "Old Ice is a manual ability of Ice Marine that, once activated, will deal 3x his current damage in double his range. It also freezes all enemies for three seconds. This ability has a cooldown of 8 minutes and 20 seconds.": "Inflige 3x ses dégâts actuels dans le double de sa portée et gèle tous les ennemis pendant 3 secondes. Temps de recharge de 8 minutes et 20 secondes.",
  "Units in the Protectors of The Universe gain a 10% attack boost.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de 10%.",
  "This ability appears only when the Froozen Giant Orb is equipped. Upon activation, Nominated Female Giant becomes crystallized and stop every enemy on the map for 20 seconds. This ability cannot be spammed and has a cooldown of ~16 minutes.\nNominated Female Giant and ZIO (ASCENDED) share their cooldown and cannot use both of their abilities during any of their two cooldowns. As such, this ability is almost always worse than ZIO (ASCENDED)'s ability.": "Requiert l'Orbe Froozen Giant. Fige tous les ennemis sur la carte pendant 20 secondes. Temps de recharge d'environ 16 minutes partagé avec ZIO (ASCENDED).",
  "At Ikki Potent's last upgrade, he gains an ability called \"Mask On\". Upon activation, the unit will gain 100.3K for its base damage within two minutes. The ability has a recharge time of eight minutes from activation.": "Au dernier palier, confère « Mask On » : gagne +100,3k à ses dégâts de base pendant 2 minutes. Temps de recharge de 8 minutes.",
  "Upon activation, a cutscene plays where Vampire Slayer takes a soda and turns into his vampiric form. He will instantly gains a 100,000 damage added to his original damage within 2 minutes, and it has infinite cooldown.": "Cinématique où Vampire Slayer boit un soda et passe sous sa forme vampirique : gagne instantanément +100 000 dégâts pendant 2 minutes (temps de recharge infini).",
  "The GaleSlow effect is applied to enemies when they are hit by Shaolin, and is activated when Shaolin is upgraded to upgrade five. This effect makes enemy troops 30% slower than they normally are. This effect is stacked with Slow up to 65% movement speed reduction, but not with Sunburn 18% slow effect. This effect lasts for 8 seconds.": "Rend les troupes ennemies 30% plus lentes pendant 8 secondes (cumulable avec Ralentissement jusqu'à 65% de réduction, mais pas avec Sunburn).",
  "Units in the Corrupted Category gain Attack Boost +10% .": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +10%.",
  "The Gale Slow effect is applied to enemies when they are hit by Darkaholic, and is activated when Darkaholic is on Upgrade 4. This effect makes enemy troops 30% slower than they normally are. This effect is stacked with Slow up to 80% movement speed reduction, but not with Sunburn 18% slow effect. This effect lasts for 8 seconds.": "Rend les troupes ennemies 30% plus lentes pendant 8 secondes (cumulable avec Ralentissement jusqu'à 80% de réduction, mais pas avec Sunburn).",
  "The Gale Slow effect is applied to enemies when they are hit by Speedaholic, and is activated when Speedaholic is on Upgrade 4. This effect makes enemy troops 30% slower than they normally are. This effect is stacked with Slow up to 80% movement speed reduction, but not with Sunburn's 18% slow effect. This effect lasts for 8 seconds.": "Rend les troupes ennemies 30% plus lentes pendant 8 secondes (cumulable avec Ralentissement jusqu'à 80% de réduction, mais pas avec Sunburn).",
  "Kura's ability 'Write Names', which used to be called 'Death Note' as per the anime, needs to be manually activated. Upon activation, it deals damage equal to his damage stat to all enemies within Kura's range, including air mobs. After a cooldown of 500 seconds, it can be triggered again.": "Capacité à activation manuelle. Inflige des dégâts équivalents à sa stat d'attaque à tous les ennemis à portée, y compris les aériens. Réutilisable après 500 secondes.",
  "Upon activation, Lucci timestops all enemies IN RANGE for approximately 6.3 seconds. This ability has a cooldown of 80 seconds (1 minute and 20 seconds).": "Arrête le temps pour tous les ennemis À PORTÉE pendant environ 6,3 secondes. Temps de recharge de 80 secondes (1 min 20 s).",
  "Units in the Unworldly Beings Category gain Attack Boost +10% & 5% Bonus": "Les unités de la catégorie Unworldly Beings bénéficient d'un bonus d'attaque de +10% et d'un bonus de 5%.",
  "Ice Beam is a manual activation skill that does nothing. It also lacks a picture, having a transparent icon instead.": "Aptitude manuelle sans effet en jeu, disposant d'une icône transparente.",
  "Upon activation, Mollu will rewind all enemies back to the position they were approximately eight seconds ago. It takes two minutes for it to be usable again.": "Remonte tous les ennemis à leur position d'il y a environ huit secondes. Réutilisable après deux minutes.",
  "String Stuns is a manual activation ability acquired by JJ-Siwa on her last upgrade. When clicked, Stone Free will create an area full of strings, damaging (+100k lvl 1) all units in ¾ of her range and stunning them for 2-3 seconds. It takes about 40 seconds to reload. Despite her being only able to hit ground units, the ability can hit air units.": "Stone Free crée une zone de fils infligeant des dégâts (+100k niv. 1) à toutes les unités dans les ¾ de sa portée et les étourdit pendant 2-3 secondes (touche les aériens). Recharge d'environ 40 secondes.",
  "Replacement is similar to Star Boy (Requiem)'s ability with its own pros and cons. Dr. Heart makes a transparent blue sphere where the first enemy is and all enemies inside sphere get teleported to the last corner that they turned. The blue sphere (\"room\") shares its properties with Dr. Heart’s primary attack (same range as his AoE circle). Enemies after getting affected by Replacement obtain permanent immunity to it, so players can’t spam. It's also recommended to use this ability when enemies are on long, straight paths. Using the Operator Orb, the Replacement ability can teleport up to 11 enemies max instead of 3. This ability has a 45 second cooldown.": "Téléporte les ennemis à l'intérieur de la sphère bleue (« Room ») au dernier virage franchi (jusqu'à 11 ennemis avec l'Orbe Operator). Les ennemis affectés deviennent immunisés. Temps de recharge de 45 secondes.",
  "When Amor Bus is activated, the effect goes over the base and prevents enemies from walking past a certain point for 24 seconds,\nand if they do pass it, they get pushed back. This ability has a server wide cooldown (6 minutes), meaning you and other players can't spam place, upgrade, or use the ability until the cooldown expires (This ability does not work in Gauntlet). This move is a reference to D4C: Love Train's ability, Love Train.": "Protège la base en empêchant les ennemis de dépasser un point fixe pendant 24 secondes (repoussés s'ils passent). Temps de recharge serveur de 6 minutes (inutilisable en Gauntlet).",
  "This is a manual activation skill that deals twice as much as Fujitora’s damage to both ground and air units within his range. It has a 180 second cooldown period.": "Inflige deux fois les dégâts de Fujitora aux unités terrestres et aériennes à sa portée. Temps de recharge de 180 secondes.",
  "Yugo has a manual ability that summons a Kuriboh that runs along the path, starting from the base, and damages any enemies it runs into. At level 80 (The max at the time), the Kuriboh has 76,970 HP with no Erwin buff (207,430 with an Erwin buff).": "Invoque un Kuriboh qui parcourt le chemin depuis la base et blesse les ennemis rencontrés (76 970 PV au niveau 80, 207 430 avec le buff d'Erwin).",
  "This is a manually activated ability that Venom acquires at max upgrade. When activated, Venom sprays out poison like a fountain in random directions over 7 seconds, inflicting poison damage on both ground and air units within his range. This ability takes 2 minutes to reset.": "Projette du poison dans des directions aléatoires pendant 7 secondes, infligeant des dégâts de poison aux unités terrestres et aériennes à portée. Se réinitialise en 2 minutes.",
  "Pride gains a new ability called 'Growing By The Day!' which gives him a 100 (and even more if he is lv. ) damage bonus for every wave once he reaches upgrade 1. As Pride gains levels, the damage increase per wave increases. In Infinite Mode, if Pride was at upgrade 1 at wave 10 until wave 50, then he would gain 40 bonuses of +100 damage, or another 4,000 damage. At level 1, upgrade 7, his standard damage is 4,955, with a DPS of 931. With the extra 4,000 damage, Pride would have a damage of 8,955, and a DPS of 1,091.": "Gagne un bonus de +100 dégâts (et plus selon le niveau) à chaque vague à partir du palier 1. En Mode Infini, le bonus s'accumule vague après vague pour faire monter son DPS considérablement.",
  "When activated, he copies a maximum of 5 enemies in his range and summon them as troops. Enemies summoned will have a symbol of the Sun on them. All summoned enemies have a health cap of 100K.\nNote: This ability does not apply to air enemies. The cooldown for his ability is 2 minutes.": "Copie jusqu'à 5 ennemis à portée et les invoque comme troupes alliées (marquées du symbole du Soleil, PV plafonnés à 100k, ne touche pas les aériens). Temps de recharge de 2 minutes.",
  "This ability resets after one minute and 40 seconds. It deals Red Servant's current damage to all ground and air units within a very large area (about 67 range).": "Inflige les dégâts actuels de Red Servant à toutes les unités terrestres et aériennes dans une très large zone (~67 de portée). Se réinitialise après 1 minute et 40 secondes.",
  "This is a manual activation skill that deals twice as much as Silver Lights's damage to both ground and air units within his range. It has a 180 second cooldown period.": "Inflige deux fois les dégâts de Silver Lights aux unités terrestres et aériennes à sa portée. Temps de recharge de 180 secondes.",
  "When activated, Mysterious X activates his Domain Expansion, Unlimited Void, and timestops all enemies in his range for 5.7 seconds. It has a cooldown of 80 seconds.": "Active l'Extension du Territoire (Sphère de l'Espace Infini) et arrête le temps pour tous les ennemis à portée pendant 5,7 secondes. Temps de recharge de 80 secondes.",
  "When activated, Jokato Koju uses Star Platinum: The World and stops all enemies from moving in his range for five seconds. It has a 30 second cooldown period.": "Utilise Star Platinum: The World et arrête le mouvement de tous les ennemis à portée pendant cinq secondes. Temps de recharge de 30 secondes.",
  "Kosuke (Eternal)'s ability Black Flames sets all units within his range on \"black fire\", which lasts a very long time but only does 9% of his total damage every 2 seconds. This ability also affects air units. Black Flames' cool-down time is 2 minutes. This ability is similar to Crow (After)'s Amaterasu Fire damage.": "Enflamme toutes les unités à portée avec les « flammes noires », infligeant 9% de ses dégâts totaux toutes les 2 secondes sur une très longue durée (touche les aériens). Temps de recharge de 2 minutes.",
  "ZIO has the ability to use ZA WARUDO, which is a manually activated ability. This ability freezes or stops the enemies within his range from moving for five seconds. Enemies outside his range are unaffected and continue moving. It has a 50 second cooldown, which includes the five seconds of freezing. It is recommended to use Mysterious X instead because his timestop lasts 0.7 seconds longer.": "Utilise ZA WARUDO et fige les ennemis à portée pendant cinq secondes. Temps de recharge de 50 secondes (incluant les cinq secondes de gel).",
  "An upgraded version of ZA WARUDO where ZIO stops time and then drops a road roller onto enemies. The damage dealt is six times ZIO's regular attack damage. This also has a 50 second cooldown.": "Version améliorée de ZA WARUDO : ZIO arrête le temps puis écrase les ennemis avec un rouleau compresseur, infligeant six fois ses dégâts d'attaque normaux. Temps de recharge de 50 secondes.",
  "Zaruto (Beast Cloak) can summon a clone of himself, which is a steamroller-type attack, which starts at the defending area and moves along the path slowly to the enemy spawning point. The clone does as much damage as its current HP. It stops when it reaches the end or when its HP is reduced to zero. Players need to manually click the icon for a clone to attack. The cooldown for the ability is 150 seconds.\nA level 1 Zaruto (Beast Cloak)’s clone HP is 200 and a level 175 clone HP is 428. Feeding level and raising his level raises the HP of the spawned clone by 1% for every level.": "Invoque un clone avançant le long du chemin vers le point d'apparition ennemi, infligeant autant de dégâts que ses PV actuels (200 PV au niv. 1, 428 PV au niv. 175, +1% par niveau). S'arrête à destination ou à 0 PV. Temps de recharge de 150 secondes.",
  "This is a manually activated ability with a 10 second cooldown. Whenever Yoshaga Kiryu attacks an enemy, he will plant explosives on that enemy. When the ability is activated, Yoshaga Kiryu will remotely detonate every single explosive no matter the distance, dealing damage to every enemy tagged with explosives. This ability then removes the explosives tag from those enemies, but it can be applied again. The damage dealt by this ability is 4 times the current damage of the Yoshaga Kiryu, so it is recommended to use your highest level Kiryus where possible. It is also recommended to set Kiryu's priority to strongest in order for him to tag as many enemies as possible as they walk past.": "Kiryu place des explosifs sur chaque ennemi attaqué. À l'activation, fait détoner à distance tous les explosifs quelle que soit la distance, infligeant 4 fois ses dégâts actuels à chaque cible marquée. Temps de recharge de 10 secondes.",
  "Explosion is a manually activated skill that does damage to both ground and air units within a range of 60-70. It has a 10 second countdown before the explosion occurs, and has a 130 second cooldown time. Explosion’s damage is equal to Mag’s damage stat multiplied by 10.\n• Level 1 Explosion damage: 1,800\n• Level 175 Explosion damage: 3,855.6": "Aptitude manuelle déclenchant une explosion après 10 secondes de compte à rebours, infligeant 10 fois l'attaque de Megumin aux unités terrestres et aériennes à portée (60-70). Temps de recharge de 130 secondes.",
  "Shinzou Wo Sasageyo (which translates to give/offer your hearts) is an ability that allows Erwin to increase the damage stats of units in his range by a certain percentage represented by his damage stat (1 damage = 1%, 107 damage = 107%).\n• Shinzou Wo Sasageyo's effects do NOT stack on the same unit. Using the ability on the same unit will not increase the duration or damage again, as nothing will happen. However, using it on another Erwin will increase the damage of the Erwin, and thus, increase the buff amount. This means that Erwin doesn't buff by only 107%.\n• The maximum amount of damage buff players can get from Erwin is 200%, which triples a unit’s damage. As such, the Bomba Orb (technically the Fire Rage Orb as well) is the best possible orb to use on a level 80 Erwin, as he will have just over a 200% damage boost when buffed by another maxed out Erwin.\n• The formula for finding out the buff damage increase after N chained buffs will be B(BN-1)/(B-1) with a hard cap of 2, where B is the buff amount as a fraction (0.5 at level 1, 0.895 at level 80). This also caps at 200%.\n• The max of +200% can not be reached until 67%, where it will take 11 chained uses. 74.5% will take 4 chained uses, and 81.5% will take 3 chained uses. A chain alternating between 81.5% and 48.9% will eventually reach 200% on the fully upgraded ones, allowing players to save $2,000 when making a chaining square.\n• Using four Erwins in the same spot allows for infinite chaining at full uptime by using one every 15 seconds.\n• The line method is a way to stack Erwin buffs by lining them up in the direction of the targeted troops, although with the limit on the damage buff being in place, it's not a good choice anymore with the chain method existing.": "Augmente l'attaque des unités à portée selon sa stat de dégâts (1 dégât = 1%). Ne se cumule pas sur la même unité, mais se cumule en chaîne sur d'autres Erwin pour atteindre le plafond de +200% (triplant les dégâts des troupes). Avec 4 Erwin, permet un buff permanent infini en activant un Erwin toutes les 15 secondes.",
  "Upon toggling the ability, GT Goku damage will increase by 75% and his SPA will shorten to 3.5, similar to Worl (Infinite Power)'s rewind skill. Unlike Rewind, however, the cooldown is very brief and an attack buff is provided. He also gets a visual transformation in the form of Super Saiyan 3. This transformation will last around 12 seconds, about 3-4 attacks.": "Augmente les dégâts de 75% et réduit le SPA à 3,5 sous la forme Super Saiyan 3 pendant environ 12 secondes (3-4 attaques). Temps de recharge très court.",
  "RANGE-BOOSTER boosts the range of allies within Merlin’s by 40%. The effect lasts 30 seconds and has a cooldown of 60 seconds. Unlike Onwin’s manual ability, this does not stack. However, you can stack his ability to boost more units.": "Augmente la portée des alliés à portée de Merlin de 40% pendant 30 secondes. Temps de recharge de 60 secondes (non cumulable sur la même unité).",
  "Target is a manual ability that deals Gash's current damage to an enemy (including airs). It has a 2 second cooldown.": "Inflige les dégâts actuels de Gash à un ennemi ciblé (y compris aérien). Temps de recharge de 2 secondes.",
  "units in the Undead category gain a 20% attack boost.": "Les unités de la catégorie Undead bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Protectors of The Universe category gain a 25% attack boost.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +25%.",
  "units in the Pure Evil category gain a 25% attack boost.": "Les unités de la catégorie Pure Evil bénéficient d'un bonus d'attaque de +25%.",
  "Units in the Prodigy or Godlike Power Category gain a 22% attack boost": "Les unités des catégories Prodigy ou Godlike Power bénéficient d'un bonus d'attaque de 22%.",
  "units in the HalfBorn category gain a 25% attack boost.": "Les unités de la catégorie HalfBorn bénéficient d'un bonus d'attaque de +25%.",
  "Units in the Unworldly Beings category gain a 20% attack boost.": "Les unités de la catégorie Unworldly Beings bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Unstoppable Forces Category gain Attack Boost +20% and +17% Bonus.": "Les unités de la catégorie Unstoppable Forces bénéficient d'un bonus d'attaque de +20% et d'un bonus de +17%.",
  "Units in the Master Class category gain Attack Boost +20% and 17% Bonus.": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +20% et d'un bonus de +17%.",
  "Units in the Pure Hearted category gain a 20% attack boost.": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Master Class Category gain Attack Boost +15% and +20% Bonus": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15% et d'un bonus de +20%.",
  "Units in the Isekai Life Category gain Attack Boost +20% and 20% Bonus.": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +20% et d'un bonus de +20%.",
  "Units in the Isekai Life Category gain Attack Boost +20%": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Godlike Power category gain a 20% attack boost.": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Puppeteer Category gain Attack Boost +20%": "Les unités de la catégorie Puppeteer bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Depraved Demons Category gain Attack Boost +20% and +20% Bonus": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +20% et d'un bonus de +20%.",
  "Units in the Antiheros Category gain Attack Boost +22%": "Les unités de la catégorie Antiheros bénéficient d'un bonus d'attaque de +22%.",
  "Units in the Progressive Category gain Attack Boost +20% and 10% Bonus": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +20% et d'un bonus de +10%.",
  "Units in the Progressive Category gain Attack Boost +20%": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Love Rhythm Category gain Attack Boost +20%; +20% Bonus": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +20% et d'un bonus de +20%.",
  "Units in the Revival Category gain Attack Boost +20%.": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Raging Power Category gain AttackBoost +20%.": "Les unités de la catégorie Raging Power bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Pure Evil category gain a 20% attack boost.": "Les unités de la catégorie Pure Evil bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Unrivaled Intelligence Category gain Attack Boost +20%; +15% Bonus.": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +20% et d'un bonus de +15%.",
  "Units in the Antiheroes Category gain Attack Boost +20% and 20% Bonus.": "Les unités de la catégorie Antiheroes bénéficient d'un bonus d'attaque de +20% et d'un bonus de +20%.",
  "Units in the Engineer Category gain Attack Boost +15%": "Les unités de la catégorie Engineer bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Avocs category gain a 20% attack boost.": "Les unités de la catégorie Time Avocs bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Final Bosses category gain a 20% attack boost.": "Les unités de la catégorie Final Bosses bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Speedster Category gain [Attack Boost +20%; +20% Bonus]": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +20% et d'un bonus de +20%.",
  "Units in the Unworldly Beings Category gain Attack Boost +20%": "Les unités de la catégorie Unworldly Beings bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Captains or Legendary Lineage category (it doesn't stack if a unit has both categories) gain Attack Boost +15% and +15% Bonus": "Les unités des catégories Captains ou Legendary Lineage (non cumulable si l'unité possède les deux) bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Captains or Legendary Lineage category gain Attack Boost +15% and +15% Bonus": "Les unités de la catégorie Captains or Legendary Lineage bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Love Rhythm category gain Attack Boost +15%.": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Pure Evil Category gain Attack Boost +15%": "Les unités de la catégorie Pure Evil bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unrivaled Intelligence Category gain Attack Boost +15%": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Martial Artist Category gain Attack Boost +15%.": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unstoppable Forces Category gain Attack Boost +10% and +5% Bonus.": "Les unités de la catégorie Unstoppable Forces bénéficient d'un bonus d'attaque de +10% et d'un bonus de +5%.",
  "Units in the Youth Category gain Attack Boost +15% and a 10% cash bonus.": "Les unités de la catégorie Youth bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Godly Category gain Attack boost +15%": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Fatherly Bond Category gain Attack Boost +20%.": "Les unités de la catégorie Fatherly Bond bénéficient d'un bonus d'attaque de +20%.",
  "units in the Godlike Power category gain a 17% attack boost.": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de +17%.",
  "Units in the Master Class or Thief category gain a 15% Attack Boost": "Les unités des catégories Master Class ou Thief bénéficient d'un bonus d'attaque de 15%.",
  "Units in the Unstoppable Forces category gain AttackBoost +15%.": "Les unités de la catégorie Unstoppable Forces bénéficient d'un bonus d'attaque de +15%.",
  "Units in the HalfBorn Category gain Attack Boost +15% + 15% bonus": "Les unités de la catégorie HalfBorn bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Perception category gain AttackBoost +15%; +10% Bonus.": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Godlike Power Category gain Attack Boost +15% and a +7% Money Bonus": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de +15% et d'un bonus de +7%.",
  "Units in the Prodigy Category gain Attack Boost +15%": "Les unités de la catégorie Prodigy bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Avocs category gain a 15% attack boost.": "Les unités de la catégorie Time Avocs bénéficient d'un bonus d'attaque de +15%.",
  "units in the Captains category gain a 15% attack boost.": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Pure Hearted Category gain Attack Boost +15%": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +15%.",
  "units in the Master Class category gain a 15% attack boost.": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godly Category gain Attack Boost +15%.": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Brutes Category gain Attack Boost +15%": "Les unités de la catégorie Brutes bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godlike Power Category gain Attack Boost +15%": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Armsman category gain AttackBoost 15%.": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Siblings category gain AttackBoost +15%; +10% Bonus.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Thief category gain a 15% attack boost.": "Les unités de la catégorie Thief bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Master Class Category gain Attack Boost +15%.": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15%.",
  "units in the Love Rhythm category gain a 15% attack boost.": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Inner being Category gain Element Boost +10% and Attack Boost +12%": "Les unités de la catégorie Inner being bénéficient d'un bonus élémentaire de +10% et d'un bonus d'attaque de +12%.",
  "Units in the Undead Category gain AttackBoost +15%.": "Les unités de la catégorie Undead bénéficient d'un bonus d'attaque de +15%.",
  "units in the Prodigy category gain a 15% attack boost.": "Les unités de la catégorie Prodigy bénéficient d'un bonus d'attaque de +15%.",
  "units in the Legendary Lineage category gain a 15% attack boost.": "Les unités de la catégorie Legendary Lineage bénéficient d'un bonus d'attaque de +15%.",
  "units in the Protectors of The Universe category gain a 15% attack boost.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Isekai Life Category gain Attack Boost +15%": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Master Class Category gain Attack Boost +15%; +10% Bonus": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Mutilate category gain a 20% attack boost.": "Les unités de la catégorie Mutilate bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Raging Power Category gain Attack Boost +15%; +10% Bonus": "Les unités de la catégorie Raging Power bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Godly Category gain Attack Boost +15%; +10% Bonus.": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "units in the Perception category gain a 15% attack boost.": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Armsman Category gain Attack Boost +15%; +15% Bonus.": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Protectors of The Universe Category gain Attack Boost +20%": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +20%.",
  "Units in the HalfBorn Category gain Attack Boost +15%": "Les unités de la catégorie HalfBorn bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Corrupted Category gain [AttackBoost +15%;]": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godlike Power Category gain Attack Boost +15%.": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Master Class Category gain Attack Boost +15%; +15% Bonus": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "units in the Unrivaled Intelligence category gain a 15% attack boost": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Redemption Category gain Attack Boost +15%; Bonus +15%.": "Les unités de la catégorie Redemption bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Spirit Warriors Category gain Attack Boost +15%; +15% Boost": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Card Counter Category gain Attack Boost +15%": "Les unités de la catégorie Card Counter bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Progressive Category gain AttackBoost 15%": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unrivaled Intelligence Category gain Attack Boost +15%; +5% Bonus.": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15% et d'un bonus de +5%.",
  "units in the Armsman category gain a 15% attack boost.": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godly Category gain Attack Boost +15%": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Pure Evil category gain a 15% attack boost.": "Les unités de la catégorie Pure Evil bénéficient d'un bonus d'attaque de +15%.",
  "units in the Speedster category gain a 15% attack boost.": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Siblings category get a 20% attack boost.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +20%.",
  "Units in the Corrupted Category gain Attack Boost +15%.": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Protectors of The Universe Category gain Attack Boost +15%.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Fatherly Bond Category gain Attack Boost +15%.": "Les unités de la catégorie Fatherly Bond bénéficient d'un bonus d'attaque de +15%.",
  "Units in the New Breeds Category gain Attack Boost +15%.": "Les unités de la catégorie New Breeds bénéficient d'un bonus d'attaque de +15%.",
  "units in the Revival category gain a 15% attack boost + 15% cash bonus.": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 15%.",
  "Units in the Card Counters Category gain Attack Boost +15%.": "Les unités de la catégorie Card Counters bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Antiheroes Category gain Attack Boost +15%": "Les unités de la catégorie Antiheroes bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Technological Forces Category gain Attack Boost +15%.": "Les unités de la catégorie Technological Forces bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Armsman Category gain AttackBoost +15%.": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors category get a 15% damage boost.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Fusion Category gain Attack Boost +15%.": "Les unités de la catégorie Fusion bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Captains category gain Attack Boost +15%": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Love Rhythm category gain AttackBoost +15%.": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15%.",
  "units in the Unrivaled Intelligence category gain a 15% attack boost.": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Isekai Life Category gain Attack Boost +15%.": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +15%.",
  "units in the Final Bosses category gain a 15% attack boost.": "Les unités de la catégorie Final Bosses bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Legendary Lineage Category gain Attack Boost +15%": "Les unités de la catégorie Legendary Lineage bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Depraved Demons Category gain Attack Boost 15%; +10% Bonus.": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Captains Category gain Attack Boost 15%; +10% Bonus.": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Raging Power Category gain Attack Boost +15%.": "Les unités de la catégorie Raging Power bénéficient d'un bonus d'attaque de +15%.",
  "units in the Pure Evil category gain a 15% attack boost.": "Les unités de la catégorie Pure Evil bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Depraved Demons Category gain Attack Boost +15%": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Martial Artist category gain AttackBoost +15%; +15% Bonus.": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Antiheros Category gain Attack Boost +15%": "Les unités de la catégorie Antiheros bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Redemption Category gain [AttackBoost +15%;]": "Les unités de la catégorie Redemption bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Captains Category gain Attack Boost +20%": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +20%.",
  "units in the Revival category gain a 15% attack boost.": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Depraved Demons Category gain Attack boost +15%": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Martial Artist Category gain Attack Boost +15%; +10% Bonus": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "units in the Progressive category gain a 15% attack boost.": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Master Class category gain a 15% attack boost.": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Raging Power Category gain Attack Boost +15%": "Les unités de la catégorie Raging Power bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Inner Being Category gain Attack Boost +15%": "Les unités de la catégorie Inner Being bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Martial Artist Category gain Attack Boost +15%": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Prodigy category gain +15% damage and 10% cash.": "Les unités de la catégorie Prodigy bénéficient d'un bonus de dégâts de +15% et de +10% d'argent.",
  "Units in the Puppeteer Category gain [AttackBoost +15%;]": "Les unités de la catégorie Puppeteer bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Siblings Category gain AttackBoost +15%.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Technological Force category gain AttackBoost +15%.": "Les unités de la catégorie Technological Force bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Depraved Demons category gain a 15% attack boost.": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Fusion category gain a 15% attack boost.": "Les unités de la catégorie Fusion bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Captains Category gain Attack Boost +15%.": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Depraved Demons or Siblings category gain Element Boost +7% and Attack Boost +15%": "Les unités de la catégorie Depraved Demons ou Siblings bénéficient d'un bonus élémentaire de +7% et d'un bonus d'attaque de +15%.",
  "Units in the Siblings Category gain Attack Boost +15%; +10% Bonus.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Final Bosses category gain a 15% attack boost.": "Les unités de la catégorie Final Bosses bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Depraved Demons Category gain Attack Boost +15%.": "Les unités de la catégorie Depraved Demons bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Mutilate Category gain Attack Boost +15%": "Les unités de la catégorie Mutilate bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Love Rhythm Category gain Attack Boost +15%; +15% Bonus": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "Units in the Brutes Category gain Attack Boost +15%.": "Les unités de la catégorie Brutes bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Limit category gain Attack Boost +15%.": "Les unités de la catégorie Time Limit bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godly category gain AttackBoost +15%; +10% Bonus.": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Scaredy Cats category gain a 15% attack boost.": "Les unités de la catégorie Scaredy Cats bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Redemption Category gain Attack Boost +15%": "Les unités de la catégorie Redemption bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Revival Category gain AttackBoost 15%.": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Scaredy Cat Category gain Attack Boost +15%.": "Les unités de la catégorie Scaredy Cat bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Speedster category gain Attack Boost +15%": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Progressive Category gain AttackBoost +15%.": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Brutes category gain AttackBoost +15%; +10% Bonus.": "Les unités de la catégorie Brutes bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Engineer Category gain Attack Boost +15%; +12% Bonus.": "Les unités de la catégorie Engineer bénéficient d'un bonus d'attaque de +15% et d'un bonus de +12%.",
  "Units in the Prodigy Category gain Attack Boost +15%.": "Les unités de la catégorie Prodigy bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Scaredy Cat Category gain Attack Boost +15%": "Les unités de la catégorie Scaredy Cat bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Master Class category gain AttackBoost +15%.": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unstoppable Forces Category or Master Class Category gain Attack Boost +15%": "Les unités de la catégorie Unstoppable Forces Category or Master Class bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Revival category gain AttackBoost +15%.": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Captains category gain a 15% attack boost.": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Avocs Category gain Attack Boost +15%": "Les unités de la catégorie Time Avocs bénéficient d'un bonus d'attaque de +15%.",
  "units in the Time Limit category gain a 15% attack boost.": "Les unités de la catégorie Time Limit bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors category gain a 15% attack boost.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Perception Category gain [AttackBoost +15%;]": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Girls Category gain Attack Boost +15%.": "Les unités de la catégorie Girls bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors Category gain Attack Boost +15%": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Pure Evil category get a 15% Attack Boost": "Les unités de la catégorie Pure Evil bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Corrupted Category gain Attack boost +15%": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Siblings Category gain a 15% attack boost and a 5% bonus.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 5%.",
  "Units in the Protectors of The Universe category gain a 15% attack boost.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unrivaled Intelligence Category gain Attack Boost +15% and +10% Bonus.": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Protectors of The Universe category gain Attack Boost +15%.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Martial Artist category gain a 15% Attack Boost.": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +15%.",
  "units in the Technological Forces category gain a 15% attack boost.": "Les unités de la catégorie Technological Forces bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godly Category gain Attack Boost +15% and +5%": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15% et d'un bonus de +5%.",
  "Units in the Godly Category gain Attack Boost +15% and +5% Bonus.": "Les unités de la catégorie Godly bénéficient d'un bonus d'attaque de +15% et d'un bonus de +5%.",
  "Units in the Unrivaled Intelligence Category gain Attack Boost +15% and 10% Bonus": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Giants category gain a 15% attack boost.": "Les unités de la catégorie Giants bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Love Rhythm Category gain Attack Boost +15%": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Giants Category gain Attack Boost +15%.": "Les unités de la catégorie Giants bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Martial Artist category gain AttackBoost +15%.": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Perception Category gain Attack Boost +15% and +10% Bonus": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Love Rhythm category gain Attack Boost +15%": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Progressive Category gain Attack Boost +15%.": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Love Rhythm Category gain Attack Boost +15%.": "Les unités de la catégorie Love Rhythm bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Brutes Category gain a 15% attack boost.": "Les unités de la catégorie Brutes bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Siblings Category gain Attack Boost +15%": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unworldly Beings Category gain Attack Boost +15%": "Les unités de la catégorie Unworldly Beings bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Master Class Category gain +15% damage and 10% cash.": "Les unités de la catégorie Master Class bénéficient d'un bonus de dégâts de +15% et de +10% d'argent.",
  "Units in the Perception Category gain Attack Boost +15%": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Undead Category gain Attack Boost +15%.": "Les unités de la catégorie Undead bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Isekai Life or Time Avocs Category gain Attack Boost +15%": "Les unités de la catégorie Isekai Life or Time Avocs bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Speedster Category gain Attack Boost +15%": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Godlike Power category gain AttackBoost +15%.": "Les unités de la catégorie Godlike Power bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Subzero Category gain Attack Boost +15%.": "Les unités de la catégorie Subzero bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Limit category get a 15% damage boost": "Les unités de la catégorie Time Limit bénéficient d'un bonus d'attaque de +15%.",
  "units in the Technological Force category gain a 15% attack boost": "Les unités de la catégorie Technological Force bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Raging Power category gain a 15% attack boost.": "Les unités de la catégorie Raging Power bénéficient d'un bonus d'attaque de +15%.",
  "units in the Girls category gain a 15% attack boost.": "Les unités de la catégorie Girls bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Armsman Category gain Attack Boost +15%.": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Subzero Category gain Element Boost +10% and Attack Boost +15%": "Les unités de la catégorie Subzero bénéficient d'un bonus élémentaire de +10% et d'un bonus d'attaque de +15%.",
  "Units in the Fatherly Bond Category gain Attack Boost +15%": "Les unités de la catégorie Fatherly Bond bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Girls category gain AttackBoost 15%.": "Les unités de la catégorie Girls bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors Category gain Attack Boost +15%.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15%.",
  "units in the Armsman category gain a 15% attack boost": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Puppeteer Category gain Attack Boost +15%.": "Les unités de la catégorie Puppeteer bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Undead Category gain Attack Boost +15%": "Les unités de la catégorie Undead bénéficient d'un bonus d'attaque de +15%.",
  "Units in the giants category gain Attack Boost +15%": "Les unités de la catégorie giants bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Speedster Category gain AttackBoost +15%; Bonus +10%.": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Raging Power Category gain Attack Boost +15% and 10% Bonus": "Les unités de la catégorie Raging Power bénéficient d'un bonus d'attaque de +15% et d'un bonus de +10%.",
  "Units in the Final Bosses Category gain Attack Boost +15%.": "Les unités de la catégorie Final Bosses bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Progressive Category gain Attack Boost +15%": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors category gain AttackBoost +15%.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Speedster Category gain a 15% attack boost.": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Perception Category gain Attack Boost +15%.": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Girls Category gain Attack Boost +10%.": "Les unités de la catégorie Girls bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Puppeteer category gain Attack Boost +15%": "Les unités de la catégorie Puppeteer bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Legendary Lineage Category gain AttackBoost +15%; +15% Bonus.": "Les unités de la catégorie Legendary Lineage bénéficient d'un bonus d'attaque de +15% et d'un bonus de +15%.",
  "units in the Puppeteer category gain a 15% attack boost.": "Les unités de la catégorie Puppeteer bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Mutilate Category gain +15% Attack Boost.": "Les unités de la catégorie Mutilate bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Puppeteer Category gain Attack Boost +15%": "Les unités de la catégorie Puppeteer bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Isekai Life category gain AttackBoost +15%.": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Unrivaled Intelligence Category gain Attack Boost +15%.": "Les unités de la catégorie Unrivaled Intelligence bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Isekai Life category gain +15% Attack Boost and +15% Bonus.": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de 15% et augmentent l'argent de 15%.",
  "Units in the Revival Category gain Attack Boost +15%": "Les unités de la catégorie Revival bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Avocs Category gain Attack Boost +15%.": "Les unités de la catégorie Time Avocs bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Technological Forces Category gain Attack Boost +15%": "Les unités de la catégorie Technological Forces bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Legendary Lineage category gain a 15% attack boost.": "Les unités de la catégorie Legendary Lineage bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Protectors of The Universe Category gain Attack Boost +10%": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Fatherly Bond or Speedster Category gains Attack Boost +15%": "Les unités de la catégorie Fatherly Bond or Speedster bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Captains Category gain Attack Boost +15%": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Redemption Category gain AttackBoost +15%.": "Les unités de la catégorie Redemption bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Undead category gain a 15% attack boost.": "Les unités de la catégorie Undead bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Avocs category gain Attack Boost +15%": "Les unités de la catégorie Time Avocs bénéficient d'un bonus d'attaque de +15%.",
  "All units gain Attack Boost +15%.": "Toutes les unités bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Time Limit Category gain Attack Boost +15%.": "Les unités de la catégorie Time Limit bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Girls category gain a 15% attack boost.": "Les unités de la catégorie Girls bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors Category gain a 15% attack boost.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Mortal Category gain Attack Boost +15%": "Les unités de la catégorie Mortal bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Technological Force Category gain Attack Boost +15%": "Les unités de la catégorie Technological Force bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Brutes category gain a 15% attack boost.": "Les unités de la catégorie Brutes bénéficient d'un bonus d'attaque de +15%.",
  "units in the HalfBorn category gain a 15% attack boost.": "Les unités de la catégorie HalfBorn bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Spirit Warriors Category gain [AttackBoost +10%;]": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +10%.",
  "Units in the HalfBorn Category gain Attack Boost +10%": "Les unités de la catégorie HalfBorn bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Unworldly Beings Category gain Attack Boost +10%": "Les unités de la catégorie Unworldly Beings bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Captains Category gain Attack Boost +10%": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Antiheros Category gain Attack Boost +10%": "Les unités de la catégorie Antiheros bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Armsman Category gain Attack Boost +10%; +7% Bonus.": "Les unités de la catégorie Armsman bénéficient d'un bonus d'attaque de +10% et d'un bonus de +7%.",
  "Units in the Scaredy Cat category gains Attack Boost +10%.": "Les unités de la catégorie Scaredy Cat bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Love Rhytm Category gain Attack Boost +10%": "Les unités de la catégorie Love Rhytm bénéficient d'un bonus d'attaque de +10%.",
  "units in the Speedster category gain a 10% attack boost.": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Perception Category gain Attack Boost +10%.": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Mortal Category gain Attack Boost +15%.": "Les unités de la catégorie Mortal bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Prodigy category gain a 10% attack boost.": "Les unités de la catégorie Prodigy bénéficient d'un bonus d'attaque de +10%.",
  "units in the HalfBorn category gain a 10% attack boost.": "Les unités de la catégorie HalfBorn bénéficient d'un bonus d'attaque de +10%.",
  "units in the Technological Forces category gain a 10% attack boost.": "Les unités de la catégorie Technological Forces bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Captains Category gain Attack Boost +10%.": "Les unités de la catégorie Captains bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Protectors of The Universe category gain a 10% attack boost.": "Les unités de la catégorie Protectors of The Universe bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Corrupted Category gain [AttackBoost +10%;]": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Spirit Warriors Category gain Attack Boost +10%.": "Les unités de la catégorie Spirit Warriors bénéficient d'un bonus d'attaque de +10%.",
  "units in the Siblings category gain a 10% attack boost.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Thief Category gain Attack Boost +10%.": "Les unités de la catégorie Thief bénéficient d'un bonus d'attaque de +10%.",
  "units in the Corrupted category gain a 10% attack boost.": "Les unités de la catégorie Corrupted bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Antiheros category gain Attack Boost +10%; +7% Bonus": "Les unités de la catégorie Antiheros bénéficient d'un bonus d'attaque de +10% et d'un bonus de +7%.",
  "Units in the Technological Forces category gain AttackBoost +10%.": "Les unités de la catégorie Technological Forces bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Perception category gain AttackBoost +10%; +15% Bonus.": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +10% et d'un bonus de +15%.",
  "Units in the Unrivalled Intelligence Category gain Attack Boost +10%.": "Les unités de la catégorie Unrivalled Intelligence bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Thief category gain a 10% attack boost.": "Les unités de la catégorie Thief bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Isekai Life Category gain Attack Boost +10%.": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +10%.",
  "units in the Youth category gain a 10% attack boost.": "Les unités de la catégorie Youth bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Martial Artist Category gain Attack Boost +10%": "Les unités de la catégorie Martial Artist bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Pure Hearted Category gain Attack Boost +10%": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +10%.",
  "units in the Master Class category gain a 10% attack boost.": "Les unités de la catégorie Master Class bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Prodigy category gain Attack Boost +10%": "Les unités de la catégorie Prodigy bénéficient d'un bonus d'attaque de +10%.",
  "Units in the the Pure Evil category gain a 10% attack boost.": "Les unités de la catégorie the Pure Evil bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Speedster category gain a 10% attack boost.": "Les unités de la catégorie Speedster bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Inner Being Category gain Attack Boost +15%.": "Les unités de la catégorie Inner Being bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Youth Category gain Attack Boost +10%; +7% Bonus.": "Les unités de la catégorie Youth bénéficient d'un bonus d'attaque de +10% et d'un bonus de +7%.",
  "Units in the Subzero Category gain Attack Boost +10%.": "Les unités de la catégorie Subzero bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Perception category gain a 10% attack boost.": "Les unités de la catégorie Perception bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Pure Hearted Category gain a 15% attack boost.": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Technological Forces Category gain Attack Boost +10%": "Les unités de la catégorie Technological Forces bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Progressive Category gain Attack Boost +10%": "Les unités de la catégorie Progressive bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Youth Category gain Attack Boost +15%.": "Les unités de la catégorie Youth bénéficient d'un bonus d'attaque de +15%.",
  "Units in the Siblings Category gain a 10% attack boost.": "Les unités de la catégorie Siblings bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Pure Hearted Category gain Attack Boost +7%.": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +7%.",
  "Units in the Isekai Life Category gain Attack Boost +10%": "Les unités de la catégorie Isekai Life bénéficient d'un bonus d'attaque de +10%.",
  "Units in the Pure Hearted Category gain Attack Boost +5%": "Les unités de la catégorie Pure Hearted bénéficient d'un bonus d'attaque de +5%."
};

function translateAbilityDescription(text) {
  if (!text || currentLang === 'en') return text;
  const rawKey = text.trim();
  if (typeof ABILITY_DESCRIPTIONS_FR !== 'undefined') {
    if (ABILITY_DESCRIPTIONS_FR[rawKey]) return ABILITY_DESCRIPTIONS_FR[rawKey];
    const strippedKey = stripWikiMarkup(text).trim();
    if (ABILITY_DESCRIPTIONS_FR[strippedKey]) return ABILITY_DESCRIPTIONS_FR[strippedKey];
    const normKey = rawKey.replace(/\r\n/g, '\n');
    if (ABILITY_DESCRIPTIONS_FR[normKey]) return ABILITY_DESCRIPTIONS_FR[normKey];
  }
  let fr = text;

  // 1. Leader Skills
  fr = fr.replace(/units in the\s+['"]?([^'"]+?)['"]?\s+category gain (?:an?|a)\s*(\d+)%\s*attack boost(\s*and boosts money by\s*(\d+)%)?\.?/gi, (m, cat, boost, mBoost, money) => {
    return `Les unités de la catégorie ${cat} bénéficient d'un bonus d'attaque de ${boost}%${money ? ` et augmentent l'argent de ${money}%` : ''}.`;
  });
  fr = fr.replace(/Units in the\s+['"]?([^'"]+?)['"]?\s+or\s+['"]?([^'"]+?)['"]?\s+Category gain (?:an?|a)\s*(\d+)%\s*attack boost\.?/gi, (m, cat1, cat2, boost) => {
    return `Les unités des catégories ${cat1} ou ${cat2} bénéficient d'un bonus d'attaque de ${boost}%.`;
  });
  fr = fr.replace(/Units in the\s+['"]?([^'"]+?)['"]?\s+Category gain Attack Boost \+(\d+)% and \+(\d+)% Bonus\.?/gi, (m, cat, b1, b2) => {
    return `Les unités de la catégorie ${cat} bénéficient d'un bonus d'attaque de +${b1}% et d'un bonus de +${b2}%.`;
  });
  fr = fr.replace(/units in the\s+['"]?([^'"]+?)['"]?\s+category gain (?:an?|a)\s*(\d+)%\s*damage buff/gi, 'les unités de la catégorie $1 bénéficient d\'un bonus de dégâts de $2%');

  // 2. TypeBane & Spécialités d'ennemis
  fr = fr.replace(/Her attack can cause (\d+x) Damage on all Special Enemies, especially she can damage on Elemental enemies\./gi, 'Son attaque inflige $1 dégâts à tous les ennemis spéciaux, et elle peut notamment toucher les ennemis élémentaires.');
  fr = fr.replace(/His attack can cause (\d+x) Damage on all Special Enemies, especially he can damage on Elemental enemies\./gi, 'Son attaque inflige $1 dégâts à tous les ennemis spéciaux, et il peut notamment toucher les ennemis élémentaires.');
  fr = fr.replace(/Their attack can cause (\d+x) Damage on all Special Enemies, especially they can damage on Elemental enemies\./gi, 'Leur attaque inflige $1 dégâts à tous les ennemis spéciaux, et ils peuvent notamment toucher les ennemis élémentaires.');
  fr = fr.replace(/attack can cause (\d+x) Damage on all Special Enemies/gi, 'l\'attaque inflige $1 dégâts à tous les ennemis spéciaux');
  fr = fr.replace(/especially (?:she|he|they) can damage on Elemental enemies/gi, 'notamment la capacité de toucher les ennemis élémentaires');
  fr = fr.replace(/can do (\d+x) damage to enemies that have or originally\s*•?\s*have a Title and can also do Piercing damage to Elemental enemies/gi, 'inflige $1 dégâts aux ennemis possédant ou ayant eu un Titre, et inflige des dégâts perforants aux ennemis élémentaires');
  fr = fr.replace(/can do (\d+x) damage to enemies with a Title and can also do Piercing damage to Elemental enemies/gi, 'inflige $1 dégâts aux ennemis possédant un Titre, et inflige des dégâts perforants aux ennemis élémentaires');
  fr = fr.replace(/can still do (\d+x) damage to enemies that got turned? into regular enemies/gi, 'inflige toujours $1 dégâts aux ennemis transformés en ennemis normaux');
  fr = fr.replace(/can still do (\d+x) damage to enemies that got turn to regular enemies/gi, 'inflige toujours $1 dégâts aux ennemis transformés en ennemis normaux');

  // 3. Formulations de frappe critique et récurrence
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack, (?:she|he|they|it) will deal ([\d\.]+)x of (?:her|his|their|its) current Damage\./gi, 'Toutes les $1 attaques, inflige $2x ses dégâts actuels.');
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack, (?:she|he|they|it) deals? ([\d\.]+)x damage\./gi, 'Toutes les $1 attaques, inflige $2x dégâts.');

  // 4. Déclencheurs & Activation
  fr = fr.replace(/(?:•\s*)?Upon activation of this ability,\s*/gi, 'À l\'activation de cette capacité, ');
  fr = fr.replace(/(?:•\s*)?Upon activation,\s*/gi, 'À l\'activation, ');
  fr = fr.replace(/(?:•\s*)?When activated,\s*/gi, 'À l\'activation, ');
  fr = fr.replace(/(?:•\s*)?After activation,\s*/gi, 'Après activation, ');
  fr = fr.replace(/(?:•\s*)?After activating this ability,\s*/gi, 'Après activation de cette capacité, ');
  fr = fr.replace(/(?:•\s*)?When Attacking,\s*/gi, 'En attaquant, ');

  // 5. Domaines et altérations massives
  fr = fr.replace(/will release a nuke of ([\d\.]+)\s*billion damage to all enemies on the map/gi, 'déclenche une explosion de $1 milliards de dégâts à tous les ennemis sur la carte');
  fr = fr.replace(/will deploy a Domain Effect within (\d+) seconds \((\d+) minutes\)/gi, 'déploie un effet de domaine pendant $1 secondes ($2 minutes)');
  fr = fr.replace(/In this active domain,\s*/gi, 'Dans ce domaine actif, ');
  fr = fr.replace(/all enemies will move (\d+)% slower/gi, 'tous les ennemis se déplacent $1% plus lentement');
  fr = fr.replace(/\(Stacking with Slow\s*\)/gi, '(Cumulable avec Ralentissement)');
  fr = fr.replace(/and they also constantly lose ([\d\.]+)% of their max HP until it reaches (\d+)% of their Max HP/gi, 'et ils perdent constamment $1% de leurs PV max jusqu\'à atteindre $2% de leurs PV max');
  fr = fr.replace(/Additionally, the ally units placed with the\s*([^.]+?)\s*categories will gain an extra (\d+)% damage boost and will deal Super Effective Damage against Enchant enemies/gi, 'De plus, les unités alliées placées avec les catégories $1 bénéficient d\'un bonus de dégâts supplémentaire de $2% et infligent des dégâts super efficaces contre les ennemis enchantés');

  // 6. Dégâts et multiplicateurs
  fr = fr.replace(/Deals\s*([\d\.]+)x\s*damage to enemies affected by\s*([^,\.]+?)(?:,\s*([^,\.]+?))?(?:,\s*or\s*([^,\.]+?))?\./gi, (m, mult, e1, e2, e3) => {
    const effs = [e1, e2, e3].filter(Boolean).map(e => e.trim().replace(/Bleed/gi, 'Saignement').replace(/Rupture/gi, 'Rupture').replace(/Judgement/gi, 'Jugement')).join(', ');
    return `Inflige ${mult}x dégâts aux ennemis affectés par ${effs}.`;
  });
  fr = fr.replace(/deals? (\d+(?:\.\d+)?)\s*billion damage/gi, 'inflige $1 milliards de dégâts');
  fr = fr.replace(/deals? (\d+(?:\.\d+)?)\s*million damage/gi, 'inflige $1 millions de dégâts');
  fr = fr.replace(/deal (\d+)x (?:his|her|their) damage/gi, 'infliger $1x ses dégâts');
  fr = fr.replace(/deal (\d+)x damage/gi, 'infliger $1x dégâts');
  fr = fr.replace(/deal Super Effective Damage/gi, 'infligent des dégâts super efficaces');
  fr = fr.replace(/damages the base when raging/gi, 'inflige des dégâts à la base en état d\'enragement');
  fr = fr.replace(/removes? (\d+)% of all enemies' current HP/gi, 'retire $1% des PV actuels de tous les ennemis');
  fr = fr.replace(/under (\d+)% of their maximum health/gi, 'ayant moins de $1% de leurs PV max');

  // 7. Base HP & Sacrifices
  fr = fr.replace(/half of your base's HP will be removed/gi, 'la moitié des PV de votre base est retirée');
  fr = fr.replace(/The removed HP is added to the base nuke of ([\d\.]+)\s*billion/gi, 'Les PV retirés sont ajoutés à l\'explosion de base de $1 milliards');
  fr = fr.replace(/The total damage caps at ([\d\.]+)\s*billion/gi, 'Les dégâts totaux sont plafonnés à $1 milliards');
  fr = fr.replace(/delete (?:himself|herself|itself) without a refund/gi, 's\'auto-détruit sans remboursement');
  fr = fr.replace(/(?:he|she|it) can be replaced afterwards/gi, 'peut être replacé(e) ensuite');

  // 8. Timestop & Stun
  fr = fr.replace(/deals ultimate timestop to all enemies for (\d+) seconds/gi, 'applique un arrêt du temps ultime à tous les ennemis pendant $1 secondes');
  fr = fr.replace(/inflicts them with a debuff that increases damage taken by (\d+)%/gi, 'leur applique un malus augmentant les dégâts subis de $1%');
  fr = fr.replace(/Within (\d+) seconds of activation, if the enemy hits the base, it will push all of them backward (\d+) paths\/corners/gi, 'Dans les $1 secondes suivant l\'activation, si un ennemi touche la base, il les repousse tous en arrière de $2 virages/chemins');
  fr = fr.replace(/It works similarly as and shares the global cooldown with\s*/gi, 'Fonctionne de manière similaire et partage le temps de recharge global avec ');

  // 9. Cooldowns & Règles d'usage
  fr = fr.replace(/(\d+)\s*minute\s*\((\d+)\s*second\)\s*global cooldown/gi, 'temps de recharge global de $1 min ($2 s)');
  fr = fr.replace(/(\d+)\s*second\s*global cooldown/gi, 'temps de recharge global de $1 secondes');
  fr = fr.replace(/global cooldown of (\d+) minutes/gi, 'temps de recharge global de $1 minutes');
  fr = fr.replace(/cooldown of (\d+) seconds \((\d+) minutes and (\d+) seconds\)/gi, 'temps de recharge de $1 secondes ($2 min $3 s)');
  fr = fr.replace(/cooldown of (\d+) minutes (\d+) seconds \((\d+) seconds\)/gi, 'temps de recharge de $1 min $2 s ($3 secondes)');
  fr = fr.replace(/has an infinite global cooldown, meaning it can only be used once per game/gi, 'possède un temps de recharge global infini (utilisation unique par partie)');
  fr = fr.replace(/This ability has an infinite global cooldown that shared with\s*/gi, 'Cette capacité possède un temps de recharge global infini partagé avec ');
  fr = fr.replace(/This ability has a PERMANENT GLOBAL cooldown/gi, 'Cette capacité possède un temps de recharge GLOBAL PERMANENT');
  fr = fr.replace(/This ability has a global cooldown/gi, 'Cette capacité possède un temps de recharge global');
  fr = fr.replace(/shares global cooldown with\s*/gi, 'partage le temps de recharge global avec ');
  fr = fr.replace(/shares a GLOBAL cooldown with\s*/gi, 'partage le temps de recharge global avec ');
  fr = fr.replace(/shares a Global Cooldown with\s*/gi, 'partage le temps de recharge global avec ');
  fr = fr.replace(/One-time use per game/gi, 'Utilisation unique par partie');
  fr = fr.replace(/can only be used once per game/gi, 'ne peut être utilisée qu\'une seule fois par partie');
  fr = fr.replace(/kills required to use ability/gi, 'éliminations requises pour utiliser la capacité');
  fr = fr.replace(/Can be used (\d+) times/gi, 'Utilisable $1 fois');

  // 10. Transformations d'ennemis
  fr = fr.replace(/turns? into regular enemies/gi, 'se transforment en ennemis normaux');
  fr = fr.replace(/turn Cloners into regular enemies/gi, 'transformer les Cloneurs en ennemis normaux');
  fr = fr.replace(/Air enemies on the map that are affected by the ability will be targetable by ground units/gi, 'les ennemis aériens sur la carte affectés par la capacité deviennent ciblables par les unités terrestres');
  fr = fr.replace(/allows ground units to target affected air enemies/gi, 'permet aux unités terrestres de cibler les ennemis aériens affectés');

  // 11. Buffs et améliorations de stats
  fr = fr.replace(/Permanently increases base damage by\s*([\d,]+)/gi, 'Augmente définitivement les dégâts de base de $1');
  fr = fr.replace(/adds a permanent ([\d,]+) damage/gi, 'ajoute $1 dégâts permanents');
  fr = fr.replace(/boosts overall power/gi, 'augmente sa puissance globale');
  fr = fr.replace(/allows (?:him|her|them) to hit elementals/gi, 'lui permet de toucher les élémentaires');
  fr = fr.replace(/for (\d+)% of (?:his|her|their) damage/gi, 'pour $1% de ses dégâts');
  fr = fr.replace(/the player will gain/gi, 'le joueur reçoit');
  fr = fr.replace(/creates a domain within (\d+) (minutes|seconds)/gi, 'crée un domaine pendant $1 $2');
  fr = fr.replace(/constantly lose ([\d\.]+)% of their max HP/gi, 'perdent constamment $1% de leurs PV max');

  // 12. Invocations et Titans
  fr = fr.replace(/Gives\s*\$([\d,]+)\s*and spawns a Titan with\s*([\d,]+M?B?)\s*HP/gi, 'Donne \$$1 et fait apparaître un Titan avec $2 PV');
  fr = fr.replace(/Rewinds all enemies in (?:her|his|their) range for (\d+) seconds and spawns a Titan with\s*([\d,]+M?B?)\s*HP(?:\s*\(([\d,]+)\)\s*)?/gi, 'Remonte le temps pour tous les ennemis à portée pendant $1 secondes et fait apparaître un Titan de $2 PV');
  fr = fr.replace(/Spawns a Titan that can only hit air with\s*([\d,]+M?B?)\s*HP(?:\s*\(([\d,]+)\)\s*)?/gi, 'Fait apparaître un Titan ne touchant que les airs avec $1 PV');
  fr = fr.replace(/spawns a Titan with\s*([\d,]+M?B?)\s*HP/gi, 'fait apparaître un Titan avec $1 PV');
  fr = fr.replace(/During The Rumbling,\s*([^.]+?)\s*will spawn at the base and slowly march across the entire map/gi, 'Pendant le Grand Terrassement, $1 apparaissent à la base et marchent lentement sur toute la carte');

  // 13. Altérations instantanées sur attaques
  fr = fr.replace(/Attacks now stun enemies upon attack\./gi, 'Les attaques étourdissent désormais les ennemis à l\'impact.');
  fr = fr.replace(/Attacks now slow enemies upon attack\./gi, 'Les attaques ralentissent désormais les ennemis à l\'impact.');
  fr = fr.replace(/Attacks change to AoE Cone\./gi, 'Les attaques passent en zone (AoE Cône).');
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack,\s*([^.]+?)\s*deals? (\d+x) (?:his|her|their)?\s*base damage/gi, 'Toutes les $1 attaques, $2 inflige $3 ses dégâts de base');
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack,\s*([^.]+?)\s*does an attack which deals (\d+x) (?:his|her|their)?\s*base damage/gi, 'Toutes les $1 attaques, $2 effectue une attaque infligeant $3 ses dégâts de base');

  // 14. Durées, cumuls et limitations
  fr = fr.replace(/Cooldown:\s*~?(\d+)\s*seconds/gi, 'Temps de recharge : ~$1 secondes');
  fr = fr.replace(/Duration:\s*(\d+)\s*seconds/gi, 'Durée : $1 secondes');
  fr = fr.replace(/This ability doesn't stack with\s*([^.]+)/gi, 'Cette capacité ne se cumule pas avec $1');
  fr = fr.replace(/does NOT stack with\s*([^.]+)/gi, 'NE SE CUMULE PAS avec $1');
  fr = fr.replace(/does not stack with\s*([^.]+)/gi, 'ne se cumule pas avec $1');
  fr = fr.replace(/This ability also does not have a global cooldown\./gi, 'Cette capacité ne possède pas de temps de recharge global.');
  fr = fr.replace(/This ability doesn't have a global cooldown\./gi, 'Cette capacité ne possède pas de temps de recharge global.');
  fr = fr.replace(/Does not work on Boss enemies/gi, 'Ne fonctionne pas sur les ennemis Boss');
  fr = fr.replace(/excluding Air, Miniboss, and Boss enemies/gi, 'à l\'exclusion des ennemis Aériens, Miniboss et Boss');
  fr = fr.replace(/except for (?:Air|Steadfast), Miniboss,? and Boss enemies/gi, 'sauf les ennemis Imperturbables, Miniboss et Boss');

  // 15. Buffs d'équipe et de portée
  fr = fr.replace(/Buffs all units? within (?:his|her|their) range by (\d+)%(?:\s*\(or \d+x\))?\s*as well as buffing their range by (\d+)%/gi, 'Augmente l\'attaque de toutes les unités à portée de $1% et leur portée de $2%');
  fr = fr.replace(/This ability lasts for (\d+) seconds with a cooldown of (\d+) seconds/gi, 'Cette capacité dure $1 secondes avec un temps de recharge de $2 secondes');
  fr = fr.replace(/Units in the\s+['"]?([^'"]+?)['"]?\s+Category gain AttackBoost \+(\d+)%/gi, 'Les unités de la catégorie $1 bénéficient d\'un bonus d\'attaque de +$2%');

  // 16. Termes et vocabulaire général de combat ASTD
  fr = fr.replace(/\bSpecial Enemies\b/gi, 'ennemis spéciaux');
  fr = fr.replace(/\bSpecial Enemy\b/gi, 'ennemi spécial');
  fr = fr.replace(/\bElemental enemies\b/gi, 'ennemis élémentaires');
  fr = fr.replace(/\bElemental enemy\b/gi, 'ennemi élémentaire');
  fr = fr.replace(/\bEnchant enemies\b/gi, 'ennemis enchantés');
  fr = fr.replace(/\bregular enemies\b/gi, 'ennemis normaux');
  fr = fr.replace(/\bregular enemy\b/gi, 'ennemi normal');
  fr = fr.replace(/\bair enemies\b/gi, 'ennemis aériens');
  fr = fr.replace(/\bground enemies\b/gi, 'ennemis terrestres');
  fr = fr.replace(/\bair units\b/gi, 'unités aériennes');
  fr = fr.replace(/\bground units\b/gi, 'unités terrestres');
  fr = fr.replace(/\bcannot hit airs?\b/gi, 'ne peut pas toucher les unités aériennes');
  fr = fr.replace(/\bcannot hit ground\b/gi, 'ne peut pas toucher les unités terrestres');
  fr = fr.replace(/\bcan only hit air\b/gi, 'ne peut toucher que les unités aériennes');
  fr = fr.replace(/\bcan hit air\b/gi, 'peut toucher les unités aériennes');
  fr = fr.replace(/\bcan hit elementals\b/gi, 'peut toucher les élémentaires');
  fr = fr.replace(/\bdamage boost\b/gi, 'bonus de dégâts');
  fr = fr.replace(/\bdamage buff\b/gi, 'bonus de dégâts');
  fr = fr.replace(/\bAttack Boost\b/gi, 'bonus d\'attaque');
  fr = fr.replace(/\bAttackBoost\b/gi, 'bonus d\'attaque');
  fr = fr.replace(/\bAttack\b/g, 'Attaque');
  fr = fr.replace(/\bDamage\b/g, 'Dégâts');
  fr = fr.replace(/\bdamage\b/g, 'dégâts');
  fr = fr.replace(/\benemies\b/g, 'ennemis');
  fr = fr.replace(/\benemy\b/g, 'ennemi');
  fr = fr.replace(/\bcooldown\b/gi, 'temps de recharge');
  fr = fr.replace(/\bglobal cooldown\b/gi, 'temps de recharge global');
  fr = fr.replace(/\bseconds\b/gi, 'secondes');
  fr = fr.replace(/\bminutes\b/gi, 'minutes');
  fr = fr.replace(/\bBleed\b/gi, 'Saignement');
  fr = fr.replace(/\bJudgement\b/gi, 'Jugement');
  fr = fr.replace(/\bRupture\b/gi, 'Rupture');
  fr = fr.replace(/\bElectric\b/gi, 'Électrique');
  fr = fr.replace(/\bFire\b/gi, 'Feu');
  fr = fr.replace(/\bWater\b/gi, 'Eau');
  fr = fr.replace(/\bDark\b/gi, 'Ténèbres');
  fr = fr.replace(/\bLight\b/gi, 'Lumière');
  fr = fr.replace(/\bBillion\b/gi, 'milliards');
  fr = fr.replace(/\bMillion\b/gi, 'millions');
  fr = fr.replace(/\bThis ability\b/gi, 'Cette capacité');
  fr = fr.replace(/\bthis ability\b/gi, 'cette capacité');
  fr = fr.replace(/\bAt max upgrade\b/gi, 'Au palier maximum');
  fr = fr.replace(/\blast upgrade\b/gi, 'dernier palier');
  fr = fr.replace(/\bUpon attack\b/gi, 'À l\'attaque');
  fr = fr.replace(/\bupon attack\b/gi, 'à l\'impact');
  fr = fr.replace(/Lowers All Enemies to (\d+)% of their Maximum HP and Executes All Enemies Under (\d+)% of their Maximum HP/gi, 'Réduit tous les ennemis à $1% de leurs PV max et exécute tous les ennemis ayant moins de $2% de leurs PV max.');
  fr = fr.replace(/Activating this will collect the stored money\./gi, 'Activer cette aptitude collecte l\'argent stocké.');
  fr = fr.replace(/After collection, money generation is cancelled, so it should only be done when there is enough money to place all remaining troops\./gi, 'Après la collecte, la génération d\'argent est interrompue; cela ne doit être fait que lorsqu\'il y a assez d\'argent pour déployer toutes les troupes restantes.');
  fr = fr.replace(/Also, if collected before upgrading, the total amount of income will decrease depending on how much the ability is used\./gi, 'De plus, si collecté avant d\'améliorer, le revenu total diminuera selon la fréquence d\'utilisation de la capacité.');
  fr = fr.replace(/Ice Beam is a manual activation skill that does nothing\./gi, 'Ice Beam est une aptitude manuelle sans effet.');
  fr = fr.replace(/It also lacks a picture, having a transparent icon instead\./gi, 'Elle ne possède pas d\'illustration, utilisant une icône transparente.');

  return fr;
}

function translateUpgradeEffect(eff) {
  if (!eff || currentLang === 'en') return eff;
  let fr = eff;
  fr = fr.replace(/Obtains\s+['"]?([^'"]+?)['"]?\s+(?:manual|passive)?\s*ability/gi, 'Obtient l\'aptitude « $1 »');
  fr = fr.replace(/Attack becomes (.+) and can hit air/gi, 'L\'attaque devient $1 et touche les aériens');
  fr = fr.replace(/Attack type changes to (.+)/gi, 'Le type d\'attaque passe en $1');
  fr = fr.replace(/Attack changes to (.+)/gi, 'L\'attaque passe en $1');
  fr = fr.replace(/Unlocks\s+Ability/gi, "Débloque l'aptitude");
  fr = fr.replace(/Unlocks\s+(.+)/gi, 'Débloque $1');
  fr = fr.replace(/Changes\s+attack\s+type\s+to\s+(.+)/gi, "Change le type d'attaque en $1");
  fr = fr.replace(/Changes\s+to\s+(.+)/gi, 'Passe à $1');
  fr = fr.replace(/Enchant enemy with\s+(.+)/gi, 'Enchante les ennemis avec $1');
  fr = fr.replace(/\bDamage Buff\b/gi, 'Buff de Dégâts');
  fr = fr.replace(/\bRange Buff\b/gi, 'Buff de Portée');
  fr = fr.replace(/\bProvides\s*per\s*wave\b/gi, 'Fournit par vague');
  fr = fr.replace(/\bProvides\b/gi, 'Fournit');
  fr = fr.replace(/\bElectric\b/gi, 'Électrique');
  fr = fr.replace(/\bFire\b/gi, 'Feu');
  fr = fr.replace(/\bWater\b/gi, 'Eau');
  fr = fr.replace(/\bDark\b/gi, 'Ténèbres');
  fr = fr.replace(/\bLight\b/gi, 'Lumière');
  fr = fr.replace(/\bAir\b/gi, 'Aérien');
  fr = fr.replace(/\bGround\b/gi, 'Terrestre');
  fr = fr.replace(/\bHill\b/gi, 'Colline');
  fr = fr.replace(/\bHybrid\b/gi, 'Hybride');
  fr = fr.replace(/Leader Skill/gi, 'Compétence de Leader');
  fr = fr.replace(/\bManual Ability\b/gi, 'Aptitude Manuelle');
  fr = fr.replace(/\bPassive Ability\b/gi, 'Passif');
  fr = fr.replace(/\bBurn\b/gi, 'Brûlure');
  fr = fr.replace(/\bBleed\b/gi, 'Saignement');
  fr = fr.replace(/\bSlow\b/gi, 'Ralentissement');
  fr = fr.replace(/\bFreeze\b/gi, 'Gel');
  fr = fr.replace(/\bStun\b/gi, 'Étourdissement');
  return fr;
}

function translateReward(text) {
  if (!text) return '';
  if (currentLang === 'fr') {
    return text
      .replace(/\bGems\b/gi, 'Gemmes')
      .replace(/\bStardust\b/gi, "Poussière d'étoiles")
      .replace(/Required\s*:\s*Level/gi, 'Requis : Niveau')
      .replace(/Level\s*(\d+)\+/gi, 'Niveau $1+')
      .replace(/and/gi, 'et')
      .replace(/Supplies/gi, 'Ravitaillement');
  } else {
    return text
      .replace(/\bGemmes\b/gi, 'Gems')
      .replace(/Poussières? d'étoiles/gi, 'Stardust')
      .replace(/Requis\s*:\s*(?:Niveau|Level)/gi, 'Required: Level')
      .replace(/Niveau\s*(\d+)\+/gi, 'Level $1+')
      .replace(/\bet\b/gi, 'and')
      .replace(/Ravitaillement/gi, 'Supplies');
  }
}

function translateOrbEffect(eff) {
  if (!eff) return '';
  if (currentLang === 'fr') {
    return eff
      .replace(/Increase(?:s)? Damage by/gi, "Augmente les dégâts de")
      .replace(/Increase(?:s)? Range by/gi, "Augmente la portée de")
      .replace(/Decrease(?:s)? (?:SPA|Cooldown) by/gi, "Réduit le SPA de")
      .replace(/Allows unit to hit Air/gi, "Permet de toucher les unités aériennes")
      .replace(/All units/gi, "Toutes les unités");
  } else {
    return eff
      .replace(/Augmente les dégâts de/gi, "Increases Damage by")
      .replace(/Augmente la portée de/gi, "Increases Range by")
      .replace(/Réduit le SPA de/gi, "Decreases SPA by")
      .replace(/Permet de toucher les unités aériennes/gi, "Allows unit to hit Air")
      .replace(/Toutes les unités/gi, "All units");
  }
}

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

// ==========================================
// CONFIGURATION ET SÉCURITÉ PUBLICITAIRE (OPTION A)
// ==========================================
// ==========================================
// CONFIGURATION ET SÉCURITÉ PUBLICITAIRE (OPTION A)
// ==========================================
// Les annonces ne sont activées QUE sur le domaine de production officiel.
// Sur localhost, forks GitHub ou tests locaux, aucun script externe n'est chargé
// et les skyscrapers latéraux restent totalement masqués.
const ADS_CONFIG = {
  allowedHosts: ['dztic.github.io'],
  client: 'ca-pub-9302236726754340',
  slotLeft: '2599124005',
  slotRight: '2599124005'
};

function initSafeAds() {
  const leftAside = document.getElementById('ad-skyscraper-left');
  const rightAside = document.getElementById('ad-skyscraper-right');
  const leftContent = document.getElementById('ad-skyscraper-left-content');
  const rightContent = document.getElementById('ad-skyscraper-right-content');

  const currentHost = window.location.hostname;
  const isAuthorized = ADS_CONFIG.allowedHosts.includes(currentHost);
  const isConfigured = ADS_CONFIG.client && !ADS_CONFIG.client.includes('REPLACE_ME');
  const isDesktopWide = window.innerWidth >= 1680;

  // Garde-fou 1 : domaine non autorisé (ex: localhost, ou fork tiers)
  // Garde-fou 2 : identifiant non encore renseigné
  // Garde-fou 3 : écran mobile, tablette ou bureau standard (< 1680px)
  if (!isAuthorized || !isConfigured || !isDesktopWide) {
    if (leftAside) {
      leftAside.classList.remove('ad-visible');
      leftAside.classList.add('hidden');
    }
    if (rightAside) {
      rightAside.classList.remove('ad-visible');
      rightAside.classList.add('hidden');
    }
    return;
  }

  // Domaine autorisé, compte configuré ET moniteur ultra-large (>= 1680px)
  if (leftAside) {
    leftAside.classList.add('ad-visible');
    leftAside.classList.remove('hidden');
  }
  if (rightAside) {
    rightAside.classList.add('ad-visible');
    rightAside.classList.remove('hidden');
  }

  if (leftContent && !leftContent.querySelector('ins.adsbygoogle')) {
    leftContent.innerHTML = `
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="${ADS_CONFIG.client}"
           data-ad-slot="${ADS_CONFIG.slotLeft}"
           data-ad-format="vertical"></ins>
    `;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense left init error', e);
    }
  }

  if (rightContent && !rightContent.querySelector('ins.adsbygoogle')) {
    rightContent.innerHTML = `
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="${ADS_CONFIG.client}"
           data-ad-slot="${ADS_CONFIG.slotRight}"
           data-ad-format="vertical"></ins>
    `;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense right init error', e);
    }
  }

  if (!document.getElementById('adsense-script')) {
    const script = document.createElement('script');
    script.id = 'adsense-script';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.client}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
}

// Réévaluation automatique lors du redimensionnement de la fenêtre
let adResizeDebounce = null;
window.addEventListener('resize', () => {
  clearTimeout(adResizeDebounce);
  adResizeDebounce = setTimeout(() => {
    initSafeAds();
  }, 200);
});

// ==========================================
// Pop-up d'accueil & Annonce Soutien Publicitaire
// S'affiche une seule fois grâce au localStorage
// ==========================================
function openAdsNoticeModal() {
  const modal = document.getElementById('ads-notice-modal');
  const dialog = document.getElementById('ads-notice-dialog');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.remove('closing');
  if (dialog) {
    dialog.classList.remove('modal-exit');
    dialog.classList.add('modal-enter');
  }
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  if (window.lucide) lucide.createIcons();

  const confirmBtn = document.getElementById('ads-notice-confirm-btn');
  if (confirmBtn) {
    setTimeout(() => {
      try { confirmBtn.focus(); } catch (e) {}
    }, 60);
  }
}

function closeAdsNoticeModal() {
  try {
    localStorage.setItem('astd_ads_notice_v2', '1');
  } catch (e) {}

  const modal = document.getElementById('ads-notice-modal');
  const dialog = document.getElementById('ads-notice-dialog');
  if (!modal || modal.classList.contains('hidden')) return;

  const onClosed = () => {
    const unitModal = document.getElementById('unit-modal');
    const communityModal = document.getElementById('community-modal');
    const isOtherModalOpen = (unitModal && !unitModal.classList.contains('hidden')) ||
                             (communityModal && !communityModal.classList.contains('hidden'));
    if (!isOtherModalOpen) {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
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

function checkAdsNotice() {
  try {
    const dismissed = localStorage.getItem('astd_ads_notice_v2');
    if (!dismissed) {
      setTimeout(() => {
        openAdsNoticeModal();
      }, 400);
    }
  } catch (e) {}
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  initSafeAds();
  checkAdsNotice();
});

// ==========================================
// CLIENT-SIDE PERSISTENT CACHE (INDEXEDDB) - ISSUE #5
// ==========================================
const ASTDCache = {
  DB_NAME: 'astd_wiki_cache',
  STORE_NAME: 'datasets',
  DB_VERSION: 1,
  _db: null,

  async open() {
    if (this._db) return this._db;
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      try {
        const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME);
          }
        };
        req.onsuccess = (e) => {
          this._db = e.target.result;
          resolve(this._db);
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  },

  async get(key) {
    try {
      const db = await this.open();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async set(key, value) {
    try {
      const db = await this.open();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }
};

// ==========================================
// LAZY RENDERING DES ONGLETS (ISSUE #6)
// ==========================================
const renderedTabs = new Set();

function renderTabContent(tabId) {
  if (!tabId) tabId = 'units';
  const isAlreadyRendered = renderedTabs.has(tabId);

  switch (tabId) {
    case 'units':
      if (!isAlreadyRendered) {
        applyUnitFilters();
        renderedTabs.add('units');
      }
      break;
    case 'tierlist':
      if (!isAlreadyRendered) {
        renderTierList();
        renderedTabs.add('tierlist');
      }
      break;
    case 'codes':
      if (!isAlreadyRendered) {
        renderCodes();
        renderedTabs.add('codes');
      }
      break;
    case 'orbs':
      if (!isAlreadyRendered) {
        renderOrbs();
        renderedTabs.add('orbs');
      }
      break;
    case 'gamemodes':
      if (!isAlreadyRendered) {
        renderGameModes();
        renderedTabs.add('gamemodes');
      }
      break;
    case 'teambuilder':
      if (!isAlreadyRendered) {
        renderTeamBuilder();
        renderedTabs.add('teambuilder');
      }
      break;
    case 'compare':
      renderCompareView();
      renderedTabs.add('compare');
      break;
    case 'community':
      if (window.CommunityManager) CommunityManager.renderCommunityHub();
      renderedTabs.add('community');
      break;
  }
}

function invalidateRenderedTabs(keepTab) {
  renderedTabs.clear();
  if (keepTab) {
    renderTabContent(keepTab);
  }
}
window.invalidateRenderedTabs = invalidateRenderedTabs;

// Load all JSON datasets with IndexedDB cache acceleration (Issue #5) & Lazy Rendering (Issue #6)
async function loadData() {
  try {
    const dataPrefix = window.location.pathname.includes('/public/') ? '../data/' : './data/';
    
    // 1. Sonde de fraîcheur des métadonnées (275 octets)
    let remoteMeta = {};
    try {
      remoteMeta = await fetch(`${dataPrefix}meta.json?t=${Date.now()}`).then(r => r.json());
    } catch (e) {
      remoteMeta = {};
    }

    const cachedMeta = await ASTDCache.get('meta');
    const isCacheFresh = remoteMeta && remoteMeta.last_updated && cachedMeta && cachedMeta.last_updated === remoteMeta.last_updated;

    let unitsRes, codesRes, orbsRes, tierRes, modesRes, metaRes, matImagesRes;

    if (isCacheFresh) {
      // CACHE HIT : Restauration instantanée depuis IndexedDB (< 20ms, 0 octet réseau)
      const [cachedUnits, cachedCodes, cachedOrbs, cachedTier, cachedModes, cachedMatImages] = await Promise.all([
        ASTDCache.get('units'),
        ASTDCache.get('codes'),
        ASTDCache.get('orbs'),
        ASTDCache.get('tierlist'),
        ASTDCache.get('gamemodes'),
        ASTDCache.get('material_images')
      ]);

      if (cachedUnits && Array.isArray(cachedUnits) && cachedCodes && cachedOrbs && cachedTier && cachedModes) {
        unitsRes = cachedUnits;
        codesRes = cachedCodes;
        orbsRes = cachedOrbs;
        tierRes = cachedTier;
        modesRes = cachedModes;
        metaRes = remoteMeta;
        matImagesRes = cachedMatImages || {};
      }
    }

    // Si Cache Miss ou première visite : téléchargement réseau complet
    if (!unitsRes) {
      [unitsRes, codesRes, orbsRes, tierRes, modesRes, metaRes, matImagesRes] = await Promise.all([
        fetch(`${dataPrefix}units.json`).then(r => r.json()),
        fetch(`${dataPrefix}codes.json`).then(r => r.json()),
        fetch(`${dataPrefix}orbs.json`).then(r => r.json()),
        fetch(`${dataPrefix}tierlist.json`).then(r => r.json()),
        fetch(`${dataPrefix}gamemodes.json`).then(r => r.json()),
        Promise.resolve(remoteMeta && remoteMeta.last_updated ? remoteMeta : fetch(`${dataPrefix}meta.json`).then(r => r.json()).catch(() => ({}))),
        fetch(`${dataPrefix}material_images.json`).then(r => r.json()).catch(() => ({}))
      ]);

      // Sauvegarde asynchrone dans IndexedDB sans bloquer l'affichage
      if (Array.isArray(unitsRes) && unitsRes.length > 0) {
        ASTDCache.set('units', unitsRes);
        ASTDCache.set('codes', codesRes);
        ASTDCache.set('orbs', orbsRes);
        ASTDCache.set('tierlist', tierRes);
        ASTDCache.set('gamemodes', modesRes);
        ASTDCache.set('material_images', matImagesRes);
        if (metaRes && metaRes.last_updated) {
          ASTDCache.set('meta', metaRes);
        }
      }
    }

    if (Array.isArray(unitsRes)) {
      unitsRes.forEach(u => {
        if (u.anime_origin) u.anime_origin = u.anime_origin.replace(/<[^>]*>/g, '').trim();
        if (u.character_origin) u.character_origin = u.character_origin.replace(/<[^>]*>/g, '').trim();
      });
    }
    ALL_UNITS = unitsRes;
    // Le tableau du wiki n'est pas trié par date : on met les codes les plus récents en premier
    if (Array.isArray(codesRes.active)) {
      codesRes.active.sort((a, b) => codeTimestamp(b) - codeTimestamp(a));
    }
    CODES_DATA = codesRes;
    ORBS_DATA = orbsRes;
    TIERLIST_DATA = tierRes;
    window.TIERLIST_DATA = tierRes;
    GAMEMODES_DATA = modesRes;
    META_DATA = metaRes;
    MATERIAL_IMAGES = matImagesRes || {};

    // Intégrer les ajouts et modifications de la communauté
    if (window.CommunityManager) {
      await CommunityManager.init();
      CommunityManager.applyToGlobalData();
    }

    // Header & Analytics metrics
    const unitsCountEl = document.getElementById('stat-units-count');
    if (unitsCountEl) unitsCountEl.textContent = ALL_UNITS.length.toLocaleString();

    const orbsCountEl = document.getElementById('stat-orbs-count');
    if (orbsCountEl) orbsCountEl.textContent = ORBS_DATA.length;

    const activeBadge = document.getElementById('badge-active-codes');
    if (activeBadge) activeBadge.textContent = CODES_DATA.active.length;

    const ribbonUpdated = document.getElementById('stat-last-updated');
    if (ribbonUpdated && META_DATA.last_updated) {
      const [datePart] = META_DATA.last_updated.split(' ');
      const [y, m, d] = datePart.split('-');
      ribbonUpdated.textContent = `${d}/${m}/${y}`;
    }

    // Populate the anime/franchise filter (DocumentFragment pour 1 seul reflow)
    const animeSelect = document.getElementById('filter-anime');
    if (animeSelect) {
      const counts = {};
      ALL_UNITS.forEach(u => {
        const a = (u.anime_origin || '').replace(/<[^>]*>/g, '').trim();
        if (a) counts[a] = (counts[a] || 0) + 1;
      });
      const fragment = document.createDocumentFragment();
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .forEach(([name, count]) => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `${name} (${count})`;
          fragment.appendChild(opt);
        });
      animeSelect.appendChild(fragment);
      animeSelect.addEventListener('change', applyUnitFilters);
    }

    // Apply initial localization
    setLanguage(currentLang);

    // Hero latest code
    if (CODES_DATA.active && CODES_DATA.active.length > 0) {
      const topCode = CODES_DATA.active[0];
      const codeName = document.getElementById('hero-code-name');
      if (codeName) codeName.textContent = topCode.code;
    }

    // Render Initial Views (Lazy Rendering - Issue #6)
    const hash = window.location.hash.replace('#', '');
    let initialTab = 'units';
    const validTabs = ['units', 'tierlist', 'codes', 'orbs', 'gamemodes', 'teambuilder', 'compare', 'community'];
    if (validTabs.includes(hash)) {
      initialTab = hash;
    } else if (hash.startsWith('compare')) {
      initialTab = 'compare';
    }
    renderTabContent(initialTab);

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

  const debouncedApplyUnitFilters = debounce(applyUnitFilters, 150);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
      debouncedApplyUnitFilters();
    });
  }

  if (quickSearch) {
    quickSearch.addEventListener('input', (e) => {
      switchTab('units');
      if (searchInput) {
        searchInput.value = e.target.value;
        document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
        debouncedApplyUnitFilters();
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
        debouncedApplyUnitFilters();
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
      focusMainSearch();
    }
    if (e.key === 'Escape') {
      closeAdsNoticeModal();
      closeUnitModal();
    }
  });

  // Modal notice publicitaire backdrop click
  const adsNoticeModal = document.getElementById('ads-notice-modal');
  if (adsNoticeModal) {
    adsNoticeModal.addEventListener('click', (e) => {
      if (e.target === adsNoticeModal) closeAdsNoticeModal();
    });
  }

  // Modal backdrop click & focus trap
  const modal = document.getElementById('unit-modal');
  const modalDialog = document.getElementById('unit-modal-dialog');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeUnitModal();
    });

    // Empêcher le défilement de fuiter vers l'arrière-plan (wheel & touch)
    modal.addEventListener('wheel', (e) => {
      let target = e.target;
      let scrollable = null;
      while (target && target !== modal && target !== document.body) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          scrollable = target;
          break;
        }
        target = target.parentElement;
      }

      if (!scrollable) {
        // Aucune zone défilable sous le curseur (fiche courte, header, backdrop)
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const deltaY = e.deltaY;
      if (deltaY > 0 && Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        // Fin de défilement vers le bas : bloquer pour éviter de faire défiler l'arrière-plan
        e.preventDefault();
      } else if (deltaY < 0 && scrollTop <= 0) {
        // Début de défilement vers le haut : bloquer pour éviter de faire défiler l'arrière-plan
        e.preventDefault();
      }
    }, { passive: false });

    let modalTouchStartY = 0;
    modal.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        modalTouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = modalTouchStartY - currentY;

      let target = e.target;
      let scrollable = null;
      while (target && target !== modal && target !== document.body) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          scrollable = target;
          break;
        }
        target = target.parentElement;
      }

      if (!scrollable) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      if (deltaY > 0 && Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        e.preventDefault();
      } else if (deltaY < 0 && scrollTop <= 0) {
        e.preventDefault();
      }
    }, { passive: false });
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

function focusMainSearch() {
  switchTab('units');
  setTimeout(() => {
    const input = document.getElementById('filter-search') || document.getElementById('quick-search');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 50);
}

// Handle URL Hash navigation
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('unit/')) {
    const unitId = hash.replace('unit/', '');
    openUnitModal(unitId);
  } else {
    const modal = document.getElementById('unit-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeUnitModal();
    }
    if (hash.startsWith('compare')) {
      const parts = hash.split('/');
      if (parts[1]) {
        const uA = ALL_UNITS.find(u => u.id === parts[1] || u.name.toLowerCase() === parts[1].toLowerCase());
        if (uA) {
          compareUnitA = uA;
          const inputA = document.getElementById('compare-search-a');
          if (inputA) inputA.value = uA.name;
          const clearBtnA = document.getElementById('compare-clear-a');
          if (clearBtnA) clearBtnA.classList.remove('hidden');
        }
      }
      if (parts[2]) {
        const uB = ALL_UNITS.find(u => u.id === parts[2] || u.name.toLowerCase() === parts[2].toLowerCase());
        if (uB) {
          compareUnitB = uB;
          const inputB = document.getElementById('compare-search-b');
          if (inputB) inputB.value = uB.name;
          const clearBtnB = document.getElementById('compare-clear-b');
          if (clearBtnB) clearBtnB.classList.remove('hidden');
        }
      }
      switchTab('compare');
      renderCompareView();
    } else if (['units', 'tierlist', 'codes', 'orbs', 'gamemodes', 'teambuilder', 'compare', 'community'].includes(hash)) {
      if (currentTab !== hash) {
        switchTab(hash);
      }
    }
  }
}

// Switch Active Tab
function switchTab(tabId) {
  const modal = document.getElementById('unit-modal');
  if (modal && !modal.classList.contains('hidden')) {
    closeUnitModal();
  }
  currentTab = tabId;
  window.location.hash = tabId;

  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });
  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) targetSection.classList.remove('hidden');

  // Lazy Rendering : rendu à la demande au premier affichage (Issue #6)
  renderTabContent(tabId);

  updateNavActiveState(tabId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) {
    const rootEl = targetSection || document;
    lucide.createIcons({ root: rootEl });
  }
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
    const unitWord = currentLang === 'en' ? (FILTERED_UNITS.length > 1 ? 'units' : 'unit') : (FILTERED_UNITS.length > 1 ? 'unités' : 'unité');
    countEl.textContent = `${FILTERED_UNITS.length} ${unitWord}`;
  }

  if (FILTERED_UNITS.length === 0) {
    const searchVal = document.getElementById('filter-search')?.value?.trim() || '';
    grid.innerHTML = `
      <div class="col-span-full py-12 px-6 text-center text-slate-300 tactical-card rounded-2xl border border-slate-800 my-4 max-w-md mx-auto">
        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-sky-400">
          <i data-lucide="search-x" class="w-6 h-6" stroke-width="2"></i>
        </div>
        <h3 class="text-sm font-bold text-white text-balance">${t('no_matching_units', 'Aucune unité ne correspond à vos filtres')}</h3>
        <p class="text-xs text-slate-400 mt-1 text-pretty">
          ${searchVal ? t('no_results_for', 'Aucun résultat pour « {searchVal} ».').replace('{searchVal}', `<strong class="text-white">${searchVal}</strong>`) : t('no_results_combo', 'Aucune unité disponible avec la combinaison de rareté et type sélectionnés.')}
        </p>
        <button onclick="clearAllFilters()" class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale inline-flex items-center gap-1.5 shadow-md">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5" stroke-width="2"></i>
          <span>${t('reset_filters', 'Réinitialiser les filtres')}</span>
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
  if (countEl) {
    const unitWord = currentLang === 'en' ? (FILTERED_UNITS.length > 1 ? 'units' : 'unit') : (FILTERED_UNITS.length > 1 ? 'unités' : 'unité');
    countEl.textContent = `${FILTERED_UNITS.length} ${unitWord}`;
  }

  if (!tbody) return;

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";

  tbody.innerHTML = FILTERED_UNITS.slice(0, 150).map(u => `
    <tr class="hover:bg-slate-800/60 transition-colors duration-100 cursor-pointer" onclick="openUnitModal('${u.id}')" tabindex="0" role="button" aria-label="${u.name}, ${u.star}★. ${t('table_view_sheet', 'Voir la fiche.')}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUnitModal('${u.id}');}">
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
        ${u._is_community_new ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide">${t('badge_community', 'Communauté')}</span>` : ''}
        ${u._is_community_modified ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">${t('badge_modified', 'Modifié')}</span>` : ''}
        ${isNewUnit(u) && !u._is_community_new ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="${t('wiki_page_created_on', 'Fiche wiki créée le')} ${new Date(u.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR')}">${t('badge_new', 'Nouveau')}</span>` : ''}
      </td>
      <td class="p-3 font-sans">
        <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-semibold">${translateTowerType(u.tower_type)}</span>
      </td>
      <td class="p-3 font-bold text-slate-100 font-mono-num" title="${u.max_damage.toLocaleString()} DMG">${formatCompactNumber(u.max_damage)}</td>
      <td class="p-3 text-slate-300 font-mono-num">${u.max_range || '-'}</td>
      <td class="p-3 text-slate-400 font-mono-num">${u.min_spa ? u.min_spa + 's' : '-'}</td>
      <td class="p-3 font-bold text-amber-300 font-mono-num" title="${u.max_dps.toLocaleString()} DPS">${formatCompactNumber(u.max_dps)}</td>
      <td class="p-3 text-slate-300 font-mono-num">${u.total_cost > 0 ? '$' + formatCompactNumber(u.total_cost) : '-'}</td>
      <td class="p-3 text-right space-x-1.5 font-sans" onclick="event.stopPropagation()">
        <button onclick="openUnitModal('${u.id}')" aria-label="${t('btn_card', 'Fiche')} : ${u.name}" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale transition-colors">
          ${t('btn_card', 'Fiche')}
        </button>
        <button onclick="startCompareWith('${u.id}')" aria-label="${t('btn_compare_title', 'Comparer cette unité')} ${u.name}" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale transition-colors" title="${t('btn_compare_title', 'Comparer cette unité')}">
          ⇄
        </button>
        <button onclick="addUnitToTeam('${u.id}')" aria-label="${t('btn_add_deck_title', 'Ajouter au deck')} ${u.name}" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale transition-colors" title="${t('btn_add_deck_title', 'Ajouter au deck')}">
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
             aria-label="${unit.name}, ${unit.star}★, ${translateTowerType(unit.tower_type)}. ${t('card_click_inspect', 'Cliquer pour inspecter.')}"
             onclick="openUnitModal('${unit.id}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUnitModal('${unit.id}');}">

      <!-- Top Badges -->
      <div class="flex items-center justify-between z-10 mb-2">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono-num font-bold star-${unit.star}-badge shadow-sm">
            ${unit.star}★
          </span>
          ${unit._is_community_new ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="${t('badge_community_title', 'Création communautaire')}">${t('badge_community', 'Communauté')}</span>` : ''}
          ${unit._is_community_modified ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide" title="${t('badge_modified_title', 'Statistiques modifiées')}">${t('badge_modified', 'Modifié')}</span>` : ''}
          ${isNewUnit(unit) && !unit._is_community_new ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="${t('wiki_page_created_on', 'Fiche wiki créée le')} ${new Date(unit.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR')}">${t('badge_new', 'Nouveau')}</span>` : ''}
        </div>
        <div class="flex items-center space-x-1">
          ${unit.is_unobtainable ? `<span class="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 rounded" title="${t('filter_obtainable_title', 'Unité retirée du jeu')}">${t('badge_unobtainable', 'Introuvable')}</span>` : ''}
          ${unit.is_tradeable ? '<span class="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 rounded">Trade</span>' : ''}
          <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded" title="${towerTypeTooltip(unit.tower_type)}">${translateTowerType(unit.tower_type)}</span>
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
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('dmg_max_tooltip', "Dégâts au palier d'amélioration maximum")}">DMG</span>
          <span class="font-bold text-slate-100" title="${unit.max_damage.toLocaleString()}">${formatCompactNumber(unit.max_damage)}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('dps_max_tooltip', "Dégâts Par Seconde au palier maximum")}">DPS</span>
          <span class="font-bold text-amber-300" title="${unit.max_dps.toLocaleString()}">${formatCompactNumber(unit.max_dps)}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('range_max_tooltip', "Distance d'attaque maximale")}">${t('hud_range_short', 'Portée')}</span>
          <span class="font-semibold text-slate-200">${unit.max_range || '-'}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('spa_tooltip', "SPA : Secondes Par Attaque (délai entre deux attaques)")}">SPA</span>
          <span class="font-semibold text-slate-300">${unit.min_spa ? unit.min_spa + 's' : '-'}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-3 flex items-center space-x-1.5" onclick="event.stopPropagation()">
        <button onclick="openUnitModal('${unit.id}')" aria-label="${t('btn_card', 'Fiche')} : ${unit.name}" class="flex-1 ps-2.5 pe-3 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale flex items-center justify-center space-x-1 transition-colors">
          <i data-lucide="eye" class="w-3 h-3" stroke-width="2"></i>
          <span>${t('btn_card', 'Fiche')}</span>
        </button>
        <button onclick="startCompareWith('${unit.id}')" aria-label="${t('btn_compare_title', 'Comparer cette unité')} ${unit.name}" class="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale flex items-center justify-center transition-colors" title="${t('btn_compare_title', 'Comparer cette unité')}">
          <i data-lucide="arrow-left-right" class="w-3 h-3" stroke-width="2"></i>
        </button>
        <button onclick="addUnitToTeam('${unit.id}')" aria-label="${t('btn_add_deck_title', 'Ajouter au deck')} ${unit.name}" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-bold text-slate-300 tap-scale flex items-center justify-center transition-colors" title="${t('btn_add_deck_title', 'Ajouter au deck')}">
          +
        </button>
      </div>

    </article>
  `;
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
  if (label) label.textContent = nowHidden ? t('btn_show', 'Afficher') : t('btn_hide', 'Masquer');
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
    const label = document.getElementById('modal-abilities-btn-label');
    if (label) label.textContent = t('btn_show', 'Afficher');
    const chevron = document.getElementById('modal-abilities-chevron');
    if (chevron) chevron.classList.remove('rotate-180');
  }

  const typeConfig = {
    manual: {
      label: t('ability_manual', 'Aptitude Manuelle'),
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: 'flame',
      iconColor: 'text-rose-400',
      cardBorder: 'border-rose-900/40 hover:border-rose-500/40'
    },
    passive: {
      label: t('ability_passive', 'Passif Spécial'),
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: 'shield',
      iconColor: 'text-purple-400',
      cardBorder: 'border-purple-900/40 hover:border-purple-500/40'
    },
    leader: {
      label: t('ability_leader', 'Leader'),
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: 'crown',
      iconColor: 'text-amber-400',
      cardBorder: 'border-amber-900/40 hover:border-amber-500/40'
    }
  };

  list.innerHTML = abilities.map((ab, idx) => {
    const cfg = typeConfig[ab.type] || {
      label: t('ability_default', 'Capacité'),
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: 'sparkles',
      iconColor: 'text-sky-400',
      cardBorder: 'border-slate-800 hover:border-slate-700'
    };

    const descLines = (translateAbilityDescription(ab.description) || '').split('\n').filter(l => l.trim().length > 0);
    const formattedDesc = descLines.map(line => {
      const l = line.trim();
      if (l.startsWith('•')) {
        return `<div class="flex items-start gap-1.5 mt-1 text-slate-200"><i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i><span>${highlightStats(l.substring(1).trim())}</span></div>`;
      }
      return `<p class="leading-relaxed">${highlightStats(l)}</p>`;
    }).join('');

    const localizedName = translateAbilityName(ab.name);
    const localizedUnlock = translateUnlock(ab.unlock);

    return `
      <div id="ability-card-${idx}" class="bg-slate-950/80 border ${cfg.cardBorder} rounded-xl p-3.5 flex flex-col sm:flex-row gap-3.5 transition-colors">
        <!-- Ability Icon or Fallback -->
        <div class="shrink-0 flex sm:flex-col items-center justify-center">
          <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden p-1 shadow-md">
            ${ab.icon_url ? `
              <img src="${ab.icon_url}" alt="${localizedName}" class="max-w-full max-h-full object-contain img-outline rounded-lg"
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
              <h4 class="font-bold text-white text-sm sm:text-base tracking-tight">${localizedName}</h4>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${cfg.badgeClass}">
                ${cfg.label}
              </span>
            </div>
            ${localizedUnlock ? `
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-slate-900 border border-slate-700 text-sky-300 flex items-center gap-1.5 shadow-sm">
                <i data-lucide="unlock" class="w-3 h-3 text-sky-400"></i>
                <span>${localizedUnlock}</span>
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
  towerTypeEl.textContent = translateTowerType(unit.tower_type);
  towerTypeEl.title = towerTypeTooltip(unit.tower_type);
  attackTypeEl.textContent = translateAttackType(unit.attack_type);
  attackTypeEl.title = t('attack_type_tooltip', "AoE : Area of Effect (zone touchée par chaque attaque : cercle, cône, ligne...)");
  document.getElementById('modal-deploy-cost').textContent = unit.deployment_cost ? `$${unit.deployment_cost.toLocaleString()}` : t('unknown', 'Inconnu');
  document.getElementById('modal-total-cost').textContent = unit.total_cost ? `$${unit.total_cost.toLocaleString()}` : t('unknown', 'Inconnu');
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
  const animePart = unit.anime_origin ? `${t('anime_prefix', 'Anime :')} ${unit.anime_origin}` : null;
  const charPart = unit.character_origin ? `${t('char_prefix', 'Personnage :')} ${unit.character_origin}` : null;
  animeEl.textContent = [animePart, charPart].filter(Boolean).join('  •  ') || t('origin_all_star', 'Origine : Personnage All Star');

  // Date d'ajout au wiki (création de la fiche) sous le portrait
  const addedEl = document.getElementById('modal-added-date');
  if (addedEl) {
    if (unit.created_at) {
      const d = new Date(unit.created_at);
      addedEl.textContent = `${t('added_on', 'Ajoutée le')} ${d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR')}`;
      addedEl.title = t('added_on_tooltip', "Fiche wiki créée le {date} — le badge Nouveau s'affiche pendant 30 jours").replace('{date}', d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR'));
      addedEl.classList.remove('hidden');
    } else {
      addedEl.classList.add('hidden');
    }
  }

  overviewEl.textContent = translateOverview(stripWikiMarkup(unit.overview), unit) || t('no_overview', "Aucune description détaillée enregistrée pour cette unité.");

  // Obtention : source racine derrière une évolution (raid, story, bannière...)
  const obtainBox = document.getElementById('modal-obtain-source');
  const obtainText = document.getElementById('modal-obtain-source-text');
  const obtainChain = document.getElementById('modal-obtain-chain');
  if (obtainBox && obtainText) {
    // source résolue depuis la chaîne d'évolution, sinon phrase directe du wiki
    const source = unit.obtain_source || (unit.obtain && !/evolv/i.test(unit.obtain) ? unit.obtain : null);
    if (source) {
      obtainText.textContent = translateObtain(stripWikiMarkup(source));
      if (obtainChain) {
        if (unit.obtain_chain && unit.obtain_chain.length > 0) {
          obtainChain.textContent = `${t('evolution_of', 'Évolution de :')} ${unit.obtain_chain.join(' → ')}`;
        } else if (unit.evolution && unit.evolution.evolves_into) {
          obtainChain.textContent = `${t('can_evolve_into', 'Peut évoluer en')} ${unit.evolution.evolves_into}`;
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
    const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
    const targetName = (unit.evolution.evolves_into || '').trim();
    const targetLower = targetName.toLowerCase();
    const evoTargetUnit = ALL_UNITS.find(u =>
      u.name.toLowerCase() === targetLower ||
      u.id.toLowerCase() === targetLower.replace(/\s+/g, '_')
    );

    let targetHTML = '';
    if (evoTargetUnit) {
      targetHTML = `
        <div class="flex items-center gap-2 mb-2.5 flex-wrap">
          <span class="text-xs text-slate-400">${t('evolves_into', 'Évolue en :')}</span>
          <button onclick="openUnitModal('${evoTargetUnit.id}')"
                  title="Voir la fiche de ${evoTargetUnit.name}"
                  class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 hover:border-amber-400 hover:bg-slate-800 tap-scale transition-colors shadow-sm group">
            <span class="w-7 h-7 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${evoTargetUnit.image || fallbackImg}" class="max-h-full max-w-full object-contain img-outline rounded" alt="" onerror="this.src='${fallbackImg}'">
            </span>
            <span class="text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">${evoTargetUnit.name}</span>
            <span class="inline-block text-[10px] font-mono-num font-bold star-${evoTargetUnit.star}-badge px-1 rounded">${evoTargetUnit.star}★</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-300 shrink-0" stroke-width="2"></i>
          </button>
        </div>
      `;
    } else {
      targetHTML = `
        <div class="text-xs mb-2">${t('evolves_into', 'Évolue en :')} <strong class="text-amber-400 font-bold">${targetName}</strong></div>
      `;
    }

    let materialsHTML = '';
    if (unit.evolution.materials && unit.evolution.materials.length > 0) {
      materialsHTML = `
        <div>
          <div class="text-[11px] font-medium text-slate-400 mb-1.5">${t('required_materials', 'Matériaux requis :')}</div>
          <div class="flex flex-wrap gap-2">
            ${unit.evolution.materials.map(m => {
              const mName = (m.name || '').trim().replace(/\u200e/g, '');
              const mLower = mName.toLowerCase();
              const matUnit = ALL_UNITS.find(u =>
                u.name.toLowerCase() === mLower ||
                u.id.toLowerCase() === mLower.replace(/\s+/g, '_')
              );

              let imgSrc = m.image || (matUnit ? matUnit.image : '') || (MATERIAL_IMAGES && MATERIAL_IMAGES[mName]) || fallbackImg;

              let countDisplay = (m.count || '').trim();
              if (countDisplay && !countDisplay.startsWith('x') && !countDisplay.startsWith('×') && !countDisplay.endsWith('x')) {
                countDisplay = `x${countDisplay}`;
              }

              if (matUnit) {
                return `
                  <button onclick="openUnitModal('${matUnit.id}')"
                          title="Voir la fiche de ${matUnit.name}"
                          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/90 hover:border-sky-500/60 hover:bg-slate-800 tap-scale transition-colors shadow-sm group text-left">
                    <span class="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src="${imgSrc}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${mName}" onerror="this.src='${fallbackImg}'">
                    </span>
                    <span class="min-w-0 pr-0.5">
                      <span class="block text-xs font-semibold text-slate-200 group-hover:text-white truncate max-w-[130px] sm:max-w-[160px]">${mName}</span>
                      <span class="flex items-center gap-1.5 mt-0.5">
                        <span class="inline-block text-[9px] font-mono-num font-bold star-${matUnit.star}-badge px-1 rounded leading-none py-0.5">${matUnit.star}★</span>
                        <strong class="text-xs font-bold text-sky-400 font-mono-num">${countDisplay}</strong>
                      </span>
                    </span>
                  </button>
                `;
              } else {
                const rarityLabel = m.rarity && m.rarity !== 'new' ? `${m.rarity}★` : 'Item';
                return `
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70 shadow-sm text-left">
                    <span class="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src="${imgSrc}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${mName}" onerror="this.src='${fallbackImg}'">
                    </span>
                    <span class="min-w-0 pr-0.5">
                      <span class="block text-xs font-semibold text-slate-200 truncate max-w-[130px] sm:max-w-[160px]">${mName}</span>
                      <span class="flex items-center gap-1.5 mt-0.5">
                        <span class="inline-block text-[9px] font-mono-num font-semibold text-slate-400 bg-slate-800 border border-slate-700/60 px-1 rounded leading-none py-0.5">${rarityLabel}</span>
                        <strong class="text-xs font-bold text-sky-400 font-mono-num">${countDisplay}</strong>
                      </span>
                    </span>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      `;
    }
    evoContent.innerHTML = `
      ${targetHTML}
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
      const preevoLabel = document.getElementById('modal-preevo-btn-label');
      if (preevoLabel) preevoLabel.textContent = t('btn_show', 'Afficher');
      document.getElementById('modal-preevo-chevron').classList.remove('rotate-180');
      document.getElementById('modal-preevo-count').textContent = `(${preEvos.length})`;
      const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
      const preevoHeading = currentLang === 'en' ? `Unit${preEvos.length > 1 ? 's' : ''} evolving into` : `Unité${preEvos.length > 1 ? 's' : ''} qui évolue${preEvos.length > 1 ? 'nt' : ''} en`;
      preevoContent.innerHTML = `
        <div class="text-xs text-slate-400 mb-2">
          ${preevoHeading}
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

  // Render Community Tips
  if (window.CommunityManager) {
    CommunityManager.renderUnitCommunityTips(unit.id);
  }

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
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  document.documentElement.style.overflow = 'hidden';
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
    if (at175) tags.push(t('tag_lvl175', 'niveau de carte 175'));
    if (idolBuffEnabled) tags.push(t('tag_idol', 'buff Idol +{pct}%').replace('{pct}', buffProviderPercent() || 0));
    maxDmgEl.title = tags.length ? `${t('dmg_max_tooltip', "Dégâts au palier d'amélioration maximum")}, ${tags.join(', ')}` : t('dmg_max_tooltip', "Dégâts au palier d'amélioration maximum");
  }
  const maxDpsEl = document.getElementById('modal-max-dps');
  if (maxDpsEl) {
    maxDpsEl.textContent = maxDps ? Math.round(maxDps).toLocaleString() : '-';
    const tags = [];
    if (at175) tags.push(t('tag_lvl175', 'niveau de carte 175'));
    if (idolBuffEnabled) tags.push(t('tag_idol', 'buff Idol +{pct}%').replace('{pct}', buffProviderPercent() || 0));
    maxDpsEl.title = tags.length ? `${t('dps_max_tooltip', "DPS Max Estimé au palier maximum")}, ${tags.join(', ')}` : t('dps_max_tooltip', "DPS Max Estimé au palier maximum");
  }
  const dmgLabel = document.getElementById('modal-dmg-range-label');
  if (dmgLabel) {
    const extra = (at175 ? ' • Lvl 175' : '') + (idolBuffEnabled ? ` • ${t('buff_idol_label', 'Buff Idol')}` : '');
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
      const abilitiesText = abilities.map(a => translateUpgradeEffect(stripWikiMarkup(a))).join(' • ') || '-';
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
          const tooltip = t('upg_buff_tooltip', 'Buff de dégâts fourni aux unités à portée (aptitude Shine) — {lvl}')
            .replace('{lvl}', at175 ? t('lvl_175_card', 'niveau de carte 175') : t('lvl_1_card', 'niveau de carte 1'));
          buffCell = `<td class="p-2.5 font-bold text-sky-300 font-mono-num" title="${tooltip}">+${shown}%${other && other !== shown ? ` <span class="text-[10px] text-slate-500 font-mono-num">(${at175 ? 'L1: ' : 'L175: '}+${other}%)</span>` : ''}</td>`;
        } else {
          buffCell = `<td class="p-2.5 text-slate-600 font-mono-num" title="${t('upg_buff_none', 'Aucun buff à ce palier (Your Star remplace Shine)')}">—</td>`;
        }
      }

      // Type change badge detection for this upgrade tier
      let typeBadge = '';
      const uTowerType = (upg.tower_type || '').toLowerCase();
      const hasHybrid = uTowerType === 'hybrid' || abilities.some(a => (a || '').toLowerCase().includes('hybrid'));
      const hasHill = uTowerType === 'hill' || abilities.some(a => (a || '').toLowerCase().includes('hill'));
      const hasAir = uTowerType === 'air' || abilities.some(a => (a || '').toLowerCase().includes('air'));
      const hasGround = uTowerType === 'ground';

      if (idx > 0) {
        if (hasHybrid) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-500/40 text-[10px] font-bold shrink-0">⚡ ${t('comm_type_hybrid_badge', 'Hybride')}</span>`;
        } else if (hasHill) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">🏔️ ${t('comm_type_hill_badge', 'Colline')}</span>`;
        } else if (hasAir) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/25 text-sky-300 border border-sky-500/40 text-[10px] font-bold shrink-0">🦅 ${t('comm_type_air_badge', 'Aérien')}</span>`;
        } else if (hasGround) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold shrink-0">🌱 ${t('comm_type_ground_badge', 'Sol')}</span>`;
        }
      }

      return `
        <tr class="hover:bg-slate-800/40 transition ${(hasAbilities || hasMatched) ? 'cursor-pointer' : ''}"
            ${(hasAbilities || hasMatched) ? `onclick="toggleUpgradeAbility(${idx})" title="${t('click_read_ability', 'Cliquer pour lire les effets et détails de capacité')}"` : ''}>
          <td class="p-2.5 font-bold text-slate-200 font-mono-num">${upg.level !== undefined ? upg.level : idx}</td>
          <td class="p-2.5 font-semibold text-slate-300 font-mono-num">$${(upg.cost || 0).toLocaleString()}</td>
          <td class="p-2.5 font-bold text-slate-100 font-mono-num">${dmg.toLocaleString()}</td>
          <td class="p-2.5 text-slate-300 font-mono-num">${rng}</td>
          <td class="p-2.5 text-slate-400 font-mono-num">${spa}s</td>
          <td class="p-2.5 font-bold text-amber-300 font-mono-num">${dps.toLocaleString()}</td>
          ${buffCell}
          <td class="p-2.5 text-slate-400 font-sans text-[11px]">
            <div class="flex items-center gap-1.5 min-w-0">
              ${typeBadge}
              ${hasMatched ? `
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold shrink-0">
                  <i data-lucide="${matchedAbilities[0].type === 'manual' ? 'flame' : 'shield'}" class="w-2.5 h-2.5"></i>
                  <span>${translateAbilityName(matchedAbilities[0].name)}</span>
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
                  ${t('upgrade_effects_prefix', 'Effets du palier')} ${upg.level !== undefined ? upg.level : idx}
                </span>
                ${hasMatched ? `
                  <button onclick="event.stopPropagation(); scrollToAbilitiesSection()" class="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-semibold normal-case">
                    <i data-lucide="arrow-up-circle" class="w-3 h-3"></i>
                    <span>${t('view_full_ability', "Voir la fiche complète de l'aptitude")}</span>
                  </button>
                ` : ''}
              </div>
              <ul class="space-y-1.5">
                ${abilities.map(a => `
                  <li class="text-[12px] text-slate-200 leading-relaxed flex gap-2">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
                    <span>${translateUpgradeEffect(stripWikiMarkup(a))}</span>
                  </li>
                `).join('')}
              </ul>
              ${matchedAbilities.map(ma => `
                <div class="mt-2.5 p-3 rounded-lg bg-slate-950/90 border border-amber-500/30 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${ma.type === 'manual' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40'}">
                      ${ma.type === 'manual' ? t('ability_manual', 'Aptitude Manuelle') : t('ability_passive', 'Passif')}
                    </span>
                    <strong class="text-white text-xs">${translateAbilityName(ma.name)}</strong>
                    ${ma.unlock ? `<span class="text-[10px] text-slate-400 font-mono-num">(${translateUnlock(ma.unlock)})</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    ${highlightStats(translateAbilityDescription(ma.description))}
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
          ${t('upgrades_empty', 'Statistiques de paliers détaillées non documentées pour cette unité.')}
        </td>
      </tr>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function closeUnitModal() {
  currentModalUnit = null;
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
    currentModalUnit = null;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (window.location.hash.startsWith('#unit/')) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + currentTab);
      } else {
        window.location.hash = currentTab;
      }
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

// // Toggle the pre-evolutions block on the unit modal
function togglePreEvos() {
  const section = document.getElementById('modal-preevo-section');
  const content = document.getElementById('modal-preevo-content');
  const label = document.getElementById('modal-preevo-btn-label');
  const chevron = document.getElementById('modal-preevo-chevron');
  if (!content) return;
  const nowHidden = content.classList.toggle('hidden');
  const btn = section ? section.querySelector('button') : null;
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
  if (label) label.textContent = nowHidden ? t('btn_show', 'Afficher') : t('btn_hide', 'Masquer');
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

function getCategoryBadgeClass(catName) {
  const norm = (catName || '').toUpperCase();
  if (norm.startsWith('S+') || norm.includes('GOD') || norm.includes('TRANSCENDANT')) return 'tier-badge-s-plus';
  if (norm.startsWith('S ') || norm.startsWith('S -') || norm === 'S' || norm.includes('META (DPS)')) return 'tier-badge-s';
  if (norm.startsWith('A ') || norm.startsWith('A -') || norm === 'A' || norm.includes('META SUPPORT')) return 'tier-badge-a';
  if (norm.startsWith('B ') || norm.startsWith('B -') || norm === 'B' || norm.includes('OVERALL')) return 'tier-badge-b';
  if (norm.startsWith('C ') || norm.startsWith('C -') || norm === 'C') return 'tier-badge-c';
  if (norm.startsWith('D ') || norm.startsWith('D -') || norm === 'D') return 'tier-badge-d';
  return 'bg-sky-950/40 border-sky-500/40 text-sky-300';
}

function renderTierList() {
  const container = document.getElementById('tierlist-container');
  if (!container) return;

  const isEditMode = window.CommunityUI && typeof window.CommunityUI.isEditMode === 'function' && window.CommunityUI.isEditMode();
  const filterQuery = (window.CommunityUI && typeof window.CommunityUI.getTierListSearchQuery === 'function' ? window.CommunityUI.getTierListSearchQuery() : '').toLowerCase().trim();

  let categories = Object.keys(TIERLIST_DATA);
  const totalCategoriesCount = categories.length;
  let totalUnitsCount = 0;
  categories.forEach(cat => {
    totalUnitsCount += (TIERLIST_DATA[cat] || []).length;
  });

  // Mettre à jour les compteurs statistiques dans la barre d'outils
  const catCountEl = document.getElementById('tierlist-stat-categories');
  const unitCountEl = document.getElementById('tierlist-stat-total-units');
  if (catCountEl) catCountEl.textContent = totalCategoriesCount;
  if (unitCountEl) unitCountEl.textContent = totalUnitsCount.toLocaleString();

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="tactical-card p-8 rounded-xl border border-slate-800 text-center space-y-3">
        <i data-lucide="inbox" class="w-8 h-8 text-slate-500 mx-auto"></i>
        <div class="text-slate-300 font-bold text-sm">${t('tierlist_empty_all', 'Aucune catégorie dans cette tier list.')}</div>
        <p class="text-xs text-slate-500">${t('tierlist_empty_hint', 'Cliquez sur « Nouvelle Catégorie » pour commencer à organiser vos unités.')}</p>
        <button onclick="CommunityUI.openAddTierCategoryModal()" class="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm tap-scale">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>${t('tierlist_btn_add_cat', 'Nouvelle Catégorie')}</span>
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Filtrage par recherche
  if (filterQuery) {
    categories = categories.filter(catName => {
      if (catName.toLowerCase().includes(filterQuery)) return true;
      const unitNames = TIERLIST_DATA[catName] || [];
      return unitNames.some(uName => {
        if (uName.toLowerCase().includes(filterQuery)) return true;
        const uObj = ALL_UNITS.find(u => u.name.toLowerCase() === uName.toLowerCase());
        return uObj && (uObj.anime_origin || '').toLowerCase().includes(filterQuery);
      });
    });
  }

  if (categories.length === 0 && filterQuery) {
    container.innerHTML = `
      <div class="tactical-card p-6 rounded-xl border border-slate-800 text-center space-y-2">
        <i data-lucide="search-x" class="w-7 h-7 text-slate-500 mx-auto"></i>
        <div class="text-slate-400 text-xs">${t('tierlist_no_search_results', 'Aucune catégorie ou unité ne correspond à :')} "<span class="text-sky-300">${filterQuery}</span>"</div>
        <button onclick="document.getElementById('tierlist-filter-search').value=''; CommunityUI.onTierListSearch('');" class="text-xs text-sky-400 hover:underline tap-scale font-semibold">${t('filter_reset_btn', 'Réinitialiser le filtre')}</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = categories.map((catName, catIdx) => {
    let unitNames = TIERLIST_DATA[catName] || [];
    const rawCount = unitNames.length;
    const unitWord = currentLang === 'en' ? (rawCount > 1 ? 'units' : 'unit') : (rawCount > 1 ? 'unités' : 'unité');
    const badgeStyle = getCategoryBadgeClass(catName);
    const escapeCat = catName.replace(/'/g, "\\'");

    // Filtrer les unités affichées si recherche active mais ne correspondant pas au nom de la catégorie
    if (filterQuery && !catName.toLowerCase().includes(filterQuery)) {
      unitNames = unitNames.filter(uName => {
        if (uName.toLowerCase().includes(filterQuery)) return true;
        const uObj = ALL_UNITS.find(u => u.name.toLowerCase() === uName.toLowerCase());
        return uObj && (uObj.anime_origin || '').toLowerCase().includes(filterQuery);
      });
    }

    return `
      <div class="tier-category-card tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 space-y-3 transition-colors duration-150">
        <!-- En-tête de la Catégorie -->
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
          <div class="flex items-center space-x-2.5 flex-wrap">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm ${badgeStyle}">
              ${escapeHtml(catName)}
            </span>
            <span class="text-xs text-slate-400 font-mono-num font-semibold">${rawCount} ${unitWord}</span>
          </div>

          <!-- Actions de gestion de la catégorie (Mode Édition) -->
          ${isEditMode ? `
            <div class="flex items-center gap-1.5 flex-wrap">
              <button onclick="CommunityUI.openAddUnitToTierModal('${escapeCat}')" class="tier-action-btn px-2.5 py-1 rounded-lg bg-sky-600/25 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-500/40 text-[11px] font-bold tap-scale flex items-center gap-1 shadow-sm transition-colors" title="${t('tierlist_cat_add_unit', '+ Ajouter une unité')}">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>${t('tierlist_cat_add_unit', '+ Ajouter')}</span>
              </button>
              <button onclick="CommunityUI.openRenameTierCategoryModal('${escapeCat}')" class="tier-action-btn p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 tap-scale" title="${t('tierlist_cat_rename', 'Renommer la catégorie')}">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="CommunityUI.moveTierCategory('${escapeCat}', -1)" ${catIdx === 0 ? 'disabled class="p-1.5 rounded-lg bg-slate-900 text-slate-600 cursor-not-allowed"' : 'class="tier-action-btn p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 tap-scale"'} title="Monter">
                <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="CommunityUI.moveTierCategory('${escapeCat}', 1)" ${catIdx === categories.length - 1 ? 'disabled class="p-1.5 rounded-lg bg-slate-900 text-slate-600 cursor-not-allowed"' : 'class="tier-action-btn p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 tap-scale"'} title="Descendre">
                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="CommunityUI.deleteTierCategory('${escapeCat}')" class="tier-action-btn p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 tap-scale transition-colors" title="${t('tierlist_cat_delete', 'Supprimer la catégorie')}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Zone de dépôt et cartes d'unités (Dropzone Drag & Drop) -->
        <div class="flex flex-wrap gap-2.5 tier-dropzone p-2 rounded-xl transition-all ${isEditMode ? 'border border-dashed border-slate-700/60 bg-[#090e1c]/60 hover:border-sky-500/40' : ''}"
             data-category="${escapeHtml(catName)}"
             ondragover="CommunityUI.onTierDragOver(event)"
             ondragleave="CommunityUI.onTierDragLeave(event)"
             ondrop="CommunityUI.onTierDrop(event, '${escapeCat}')">

          ${unitNames.length === 0 ? `
            <div class="w-full py-4 text-center text-xs text-slate-500 italic flex items-center justify-center gap-2">
              <i data-lucide="info" class="w-3.5 h-3.5"></i>
              <span>${t('tierlist_empty_cat', 'Aucune unité dans cette catégorie. Cliquez sur "+ Ajouter" pour en insérer ou glissez-déposez une unité ici.')}</span>
            </div>
          ` : ''}

          ${unitNames.map(name => {
            const unitMatch = ALL_UNITS.find(u => u.name.toLowerCase() === name.toLowerCase());
            const escapeName = name.replace(/'/g, "\\'");
            const isDraggableAttr = isEditMode ? `draggable="true" ondragstart="CommunityUI.onTierDragStart(event, '${escapeName}', '${escapeCat}')" ondragend="CommunityUI.onTierDragEnd(event)"` : '';
            const dragClass = isEditMode ? 'tier-item-draggable group cursor-grab' : 'group';

            if (!unitMatch) {
              return `
                <div class="tier-unit-card relative inline-block ${dragClass}" ${isDraggableAttr} data-unit="${escapeName}">
                  <button onclick="${isEditMode ? `openUnitByName('${escapeName}')` : `openUnitByName('${escapeName}')`}"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-bold text-white flex items-center space-x-1.5 tap-scale transition-colors">
                    <span>${escapeHtml(name)}</span>
                    <i data-lucide="external-link" class="w-3 h-3 text-slate-500" stroke-width="1.75"></i>
                  </button>
                  ${isEditMode ? `
                    <button type="button" onclick="event.stopPropagation(); CommunityUI.removeUnitFromTier('${escapeCat}', '${escapeName}')" class="tier-unit-action-badge absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md tap-scale z-20" title="${t('tierlist_unit_remove', 'Retirer de cette catégorie')}">
                      <i data-lucide="x" class="w-3 h-3" stroke-width="2.5"></i>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); CommunityUI.openMoveUnitModal('${escapeCat}', '${escapeName}')" class="tier-unit-action-badge absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-md tap-scale z-20" title="${t('tierlist_unit_move', 'Déplacer vers...')}">
                      <i data-lucide="arrow-left-right" class="w-2.5 h-2.5" stroke-width="2.5"></i>
                    </button>
                  ` : ''}
                </div>
              `;
            }

            const star = unitMatch.star || 6;
            const thumb = tierThumbUrl(unitMatch);

            if (!thumb) {
              return `
                <div class="tier-unit-card relative inline-block ${dragClass}" ${isDraggableAttr} data-unit="${escapeName}">
                  <button onclick="openUnitModal('${unitMatch.id}')"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-bold text-white flex items-center space-x-1.5 tap-scale transition-colors">
                    <span class="text-[10px] font-mono-num px-1 rounded star-${star}-badge">${star}★</span>
                    <span>${escapeHtml(name)}</span>
                    <i data-lucide="chevron-right" class="w-3 h-3 text-slate-500" stroke-width="2"></i>
                  </button>
                  ${isEditMode ? `
                    <button type="button" onclick="event.stopPropagation(); CommunityUI.removeUnitFromTier('${escapeCat}', '${escapeName}')" class="tier-unit-action-badge absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md tap-scale z-20" title="${t('tierlist_unit_remove', 'Retirer de cette catégorie')}">
                      <i data-lucide="x" class="w-3 h-3" stroke-width="2.5"></i>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); CommunityUI.openMoveUnitModal('${escapeCat}', '${escapeName}')" class="tier-unit-action-badge absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-md tap-scale z-20" title="${t('tierlist_unit_move', 'Déplacer vers...')}">
                      <i data-lucide="arrow-left-right" class="w-2.5 h-2.5" stroke-width="2.5"></i>
                    </button>
                  ` : ''}
                </div>
              `;
            }

            return `
              <div class="tier-unit-card relative inline-block ${dragClass}" ${isDraggableAttr} data-unit="${escapeName}">
                <button onclick="openUnitModal('${unitMatch.id}')"
                        class="w-[92px] rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-1.5 flex flex-col items-center gap-1 tap-scale transition-colors">
                  <div class="w-full h-[76px] rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-center overflow-hidden">
                    <img src="${thumb}" alt="${escapeHtml(name)}" loading="lazy"
                         onerror="this.onerror=null;this.closest('div').classList.add('tier-img-fallback');this.style.display='none'"
                         class="max-h-full max-w-full object-contain img-outline rounded group-hover:scale-105 transition-transform duration-150 ease-out pointer-events-none">
                  </div>
                  <span class="text-[9px] font-mono-num font-bold px-1 rounded star-${star}-badge">${star}★</span>
                  <span class="text-[10px] font-bold text-white leading-tight text-center line-clamp-2 w-full" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                </button>
                ${isEditMode ? `
                  <button type="button" onclick="event.stopPropagation(); CommunityUI.removeUnitFromTier('${escapeCat}', '${escapeName}')" class="tier-unit-action-badge absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md tap-scale z-20" title="${t('tierlist_unit_remove', 'Retirer de cette catégorie')}">
                    <i data-lucide="x" class="w-3 h-3" stroke-width="2.5"></i>
                  </button>
                  <button type="button" onclick="event.stopPropagation(); CommunityUI.openMoveUnitModal('${escapeCat}', '${escapeName}')" class="tier-unit-action-badge absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-md tap-scale z-20" title="${t('tierlist_unit_move', 'Déplacer vers...')}">
                    <i data-lucide="arrow-left-right" class="w-2.5 h-2.5" stroke-width="2.5"></i>
                  </button>
                ` : ''}
              </div>
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
    showToast(currentLang === 'en' ? `Unit ${name} opened` : `Unité ${name} consultée`);
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
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                ${t('code_verified_active', 'Vérifié & Actif')}
              </span>
              ${c._is_community ? `<span class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">${t('badge_community', 'Communauté')}</span>` : ''}
            </div>
            <span class="text-[11px] text-slate-400 font-mono-num">${c.date || t('code_recent', 'Récent')}</span>
          </div>
          <div class="font-mono-num text-base font-bold text-white tracking-wide my-2 select-all bg-[#090e1c] px-3 py-2 rounded-lg border border-slate-800">
            ${c.code}
          </div>
          <div class="text-xs text-slate-300 bg-[#090e1c]/70 p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 font-sans">${t('code_rewards_label', 'Récompenses :')}</strong> ${translateReward(c.reward)}
          </div>
        </div>
        <div class="flex items-center gap-1.5 w-full">
          <button onclick="copyCodeText('${c.code}', this)" aria-label="${t('btn_copy_code', 'Copier le code')} ${c.code}" class="flex-1 ps-3 pe-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wide tap-scale flex items-center justify-center space-x-1.5 shadow-sm transition-colors">
            <i data-lucide="copy" class="w-3.5 h-3.5 text-white" stroke-width="2.5"></i>
            <span>${t('btn_copy_code', 'Copier le code')}</span>
          </button>
          <button onclick="CommunityManager.toggleCodeExpired('${c.code}')" aria-label="${t('btn_mark_expired', 'Signaler comme expiré')}" class="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-400 font-semibold text-xs tap-scale transition-colors shrink-0" title="${t('btn_mark_expired_title', 'Signaler ce code comme expiré')}">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5" stroke-width="2"></i>
          </button>
        </div>
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
    expiredList.innerHTML = `<span class="text-xs text-slate-400 italic py-1">${t('no_expired_codes', 'Aucun code expiré ne correspond à cette recherche.')}</span>`;
    return;
  }
  expiredList.innerHTML = list.slice(0, 100).map(c => `
    <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono-num text-slate-500 line-through">
      ${c.code}
    </span>
  `).join('');
}

const debouncedFilterExpiredCodes = debounce(function() {
  const query = (document.getElementById('search-expired-codes')?.value || '').toLowerCase().trim();
  const filtered = CODES_DATA.expired.filter(c => c.code.toLowerCase().includes(query));
  renderExpiredCodesList(filtered);
}, 150);

function filterExpiredCodes(immediate = false) {
  if (immediate) {
    debouncedFilterExpiredCodes.now();
  } else {
    debouncedFilterExpiredCodes();
  }
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
    showToast(t('toast_code_copied', 'Code "{code}" copié !').replace('{code}', text));
    if (btn) {
      const origHTML = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-slate-950" stroke-width="2.5"></i><span>${t('copied', 'Copié !')}</span>`;
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
  const requireText = isUniversal ? t('all_units_badge', '★ Toutes les unités') : o.require;
  const requireTitle = isUniversal ? t('universal_orb_title', 'Équipable par toutes les unités') : t('restricted_orb_title', 'Réservé à cette unité (ou sa famille)');
  const isCommunity = !!(o._is_community || o._is_community_new || o._is_community_modified);
  const encodedName = encodeURIComponent(o.name || '');

  return `
    <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between space-y-3 hover:border-sky-500/40 tap-scale-subtle transition-colors">
      <div>
        <div class="flex items-center space-x-3 mb-2.5">
          <div class="w-10 h-10 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center shrink-0">
            <img src="${o.image || fallback}" alt="${o.name}" class="max-h-full max-w-full object-contain img-outline rounded"
                 onerror="this.src='${fallback}'">
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <h4 class="font-bold text-xs text-white truncate">${o.name}</h4>
            </div>
            <span class="text-[10px] font-semibold ${isUniversal ? 'text-sky-300' : 'text-slate-400'}"
                  title="${requireTitle}">
              ${requireText}
            </span>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 block text-[10px] uppercase font-sans">${t('stat_bonus_label', 'Bonus statistique :')}</strong>
            <span class="text-slate-100 font-medium font-mono-num text-[11px]">${translateOrbEffect(o.effect) || t('special_bonus', 'Bonus spécial')}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">${t('obtain_label', 'Obtention :')}</strong> ${translateObtain(o.obtain) || 'Trial / Raid'}
          </div>
          ${!isUniversal ? `
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">${t('compatible_label', 'Compatible :')}</strong> <span class="text-sky-300">${o.require}</span>
          </div>` : ''}
        </div>
      </div>

      <div class="flex items-center justify-end pt-2 border-t border-slate-800/80 text-[11px]">
        <button onclick="if(window.CommunityUI) CommunityUI.openOrbModalForEdit(decodeURIComponent('${encodedName}'))" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 font-semibold text-xs tap-scale flex items-center gap-1.5 transition-colors" title="${t('comm_btn_edit_orb_title', 'Modifier cet orbe')}">
          <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>${t('comm_action_edit', 'Éditer')}</span>
        </button>
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

const debouncedFilterOrbs = debounce(function() {
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
        <h3 class="text-sm font-bold text-white text-balance">${t('no_orbs_found', 'Aucun orbe trouvé')}</h3>
        <p class="text-xs text-slate-400 mt-1 text-pretty">
          ${t('no_orbs_query', 'Aucun orbe ne correspond à la recherche « {q} ».').replace('{q}', `<strong class="text-white">${query}</strong>`)}
        </p>
        <button onclick="const el=document.getElementById('search-orbs'); if(el){el.value=''; filterOrbs();}" class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale inline-flex items-center gap-1.5 shadow-md">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5" stroke-width="2"></i>
          <span>${t('clear_search', 'Effacer la recherche')}</span>
        </button>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(renderOrbCard).join('');
  }
  if (window.lucide) lucide.createIcons();
}, 150);

function filterOrbs(immediate = false) {
  if (immediate) {
    debouncedFilterOrbs.now();
  } else {
    debouncedFilterOrbs();
  }
}

// ==========================================
// GAME MODES & RAIDS
// ==========================================

function renderGameModes() {
  const grid = document.getElementById('gamemodes-grid');
  if (!grid) return;

  grid.innerHTML = GAMEMODES_DATA.map(mode => {
    const name = currentLang === 'en' ? (mode.name_en || mode.name) : (mode.name_fr || mode.name);
    const type = currentLang === 'en' ? (mode.type_en || mode.type) : (mode.type_fr || mode.type);
    const desc = currentLang === 'en' ? (mode.description_en || mode.description) : (mode.description_fr || mode.description);
    const rewards = translateReward(currentLang === 'en' ? (mode.rewards_en || mode.rewards) : (mode.rewards_fr || mode.rewards));

    return `
      <div class="tactical-card rounded-xl p-5 border border-slate-800/80 bg-[#0f1629]/95 space-y-3 hover:border-sky-500/40 transition-colors tap-scale-subtle">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="swords" class="w-4 h-4 text-sky-400" stroke-width="2"></i>
            <span>${name}</span>
          </h3>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            ${type}
          </span>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          ${desc}
        </p>

        <div class="bg-[#090e1c] p-3 rounded-lg border border-slate-800/80 text-[11px]">
          <strong class="text-amber-300 font-semibold">${t('mode_rewards_label', 'Récompenses :')}</strong> ${rewards}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// TEAM BUILDER (6 SLOTS)
// ==========================================

function renderTeamBuilder() {
  const slotsContainer = document.getElementById('team-slots-container');
  if (!slotsContainer) return;

  const removeLabelTpl = t('remove_from_deck');
  const depLabel = t('dep_short');
  const slotEmptySrTpl = t('slot_empty_sr');
  const slotLabelTpl = t('slot_label');
  const addTowerLabel = t('add_a_tower');

  slotsContainer.innerHTML = teamSlots.map((unit, idx) => {
    if (unit) {
      const removeTitle = removeLabelTpl.replace('{name}', unit.name);
      return `
        <div class="tactical-card rounded-xl p-3 border border-slate-800/80 bg-[#0f1629]/95 relative flex flex-col items-center text-center group tap-scale-subtle">
          <button onclick="removeUnitFromTeam(${idx})" aria-label="${removeTitle}" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center tap-scale transition-colors shadow-sm" title="${removeTitle}">
            <i data-lucide="x" class="w-3.5 h-3.5" stroke-width="2.5"></i>
          </button>
          <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center my-1 overflow-hidden">
            <img src="${unit.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${unit.name}">
          </div>
          <div class="font-bold text-xs text-white truncate w-full" title="${unit.name}">
            ${unit.name}
          </div>
          <span class="text-[10px] text-amber-300 font-mono-num font-bold">${unit.star}★ • ${translateTowerType(unit.tower_type || 'Ground')}</span>
          <div class="text-[10px] text-slate-300 font-mono-num font-semibold mt-0.5">
            ${depLabel}: $${(unit.deployment_cost || 0).toLocaleString()}
          </div>
        </div>
      `;
    } else {
      const slotEmptyAria = slotEmptySrTpl.replace('{n}', idx + 1);
      const slotText = slotLabelTpl.replace('{n}', idx + 1);
      return `
        <button type="button" onclick="focusTeamSearch()" aria-label="${slotEmptyAria}" class="border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 h-36 hover:border-sky-500/50 hover:text-sky-400 tap-scale transition-colors cursor-pointer group w-full text-center bg-[#090e1c]/40">
          <i data-lucide="plus-circle" class="w-6 h-6 mb-1.5 text-slate-500 group-hover:text-sky-400 transition-colors" stroke-width="2"></i>
          <span class="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">${slotText}</span>
          <span class="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">${addTowerLabel}</span>
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
        <span class="font-medium">${t('team_anti_ground')}</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasAir ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasAir ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_anti_air')}</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasMoney ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasMoney ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_economy')}</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasSlowOrSupport ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasSlowOrSupport ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_support')}</span>
      </div>
    `;
  }
}

const debouncedRenderTeamPicker = debounce(_doRenderTeamPicker, 150);

function renderTeamPicker(immediate = false) {
  if (immediate) {
    debouncedRenderTeamPicker.now();
  } else {
    debouncedRenderTeamPicker();
  }
}

function _doRenderTeamPicker() {
  const query = (document.getElementById('team-search-input')?.value || '').toLowerCase().trim();
  const pickerGrid = document.getElementById('team-picker-grid');
  if (!pickerGrid) return;

  const filtered = ALL_UNITS.filter(u => {
    if (!query) return u.star >= 6;
    return u.name.toLowerCase().includes(query) || (u.anime_origin || '').toLowerCase().includes(query);
  }).slice(0, 18);

  const btnAddLabel = t('btn_add');
  pickerGrid.innerHTML = filtered.map(u => `
    <div class="tactical-card p-2.5 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 text-center flex flex-col items-center justify-between group">
      <div class="w-12 h-12 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center my-1 overflow-hidden">
        <img src="${u.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${u.name}">
      </div>
      <div class="text-[11px] font-bold text-white truncate w-full" title="${u.name}">${u.name}</div>
      <span class="text-[10px] star-${u.star}-badge px-1.5 py-0.5 rounded my-1 font-mono-num font-bold">${u.star}★</span>
      <button onclick="addUnitToTeam('${u.id}')" aria-label="${t('modal_btn_deck_aria')} (${u.name})" class="w-full py-1 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-[10px] font-bold tap-scale transition-colors shadow-sm">
        ${btnAddLabel}
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
    showToast(t('toast_team_full'));
    return;
  }

  if (teamSlots.some(s => s && s.id === unit.id)) {
    showToast(t('toast_already_in_team').replace('{name}', unit.name));
    return;
  }

  teamSlots[emptyIndex] = unit;
  showToast(t('toast_added_to_team').replace('{name}', unit.name).replace('{slot}', emptyIndex + 1));
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
    showToast(t('toast_removed_from_team').replace('{name}', name));
    renderTeamBuilder();
  }
}

function clearTeam() {
  teamSlots = [null, null, null, null, null, null];
  showToast(t('toast_team_cleared'));
  renderTeamBuilder();
}

// ==========================================
// COMPARATEUR DE PERSONNAGES (TACTICAL VERSUS)
// ==========================================

let compareUnitA = null;
let compareUnitB = null;
let compareLevelView = 1; // 1 | 175
let compareIdolBuff = false;

function getCompareIdolMaxPercent() {
  const p = findBuffProvider();
  let maxBuff = 250;
  if (p && p.upgrades) {
    p.upgrades.forEach(up => {
      if (up.buff_damage_high != null) maxBuff = Math.max(maxBuff, up.buff_damage_high);
      if (up.buff_damage_low != null) maxBuff = Math.max(maxBuff, up.buff_damage_low);
    });
  }
  return maxBuff || 250;
}

function setCompareLevel(lvl) {
  if (lvl !== 1 && lvl !== 175) return;
  compareLevelView = lvl;
  const btn1 = document.getElementById('btn-compare-lvl-1');
  const btn175 = document.getElementById('btn-compare-lvl-175');
  if (btn1) {
    btn1.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors shadow-sm ${lvl === 1 ? 'bg-sky-600 text-white border border-sky-500' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-sky-500/50 hover:text-white'}`;
    btn1.setAttribute('aria-pressed', lvl === 1 ? 'true' : 'false');
  }
  if (btn175) {
    btn175.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${lvl === 175 ? 'bg-sky-600 text-white border border-sky-500' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-sky-500/50 hover:text-white'}`;
    btn175.setAttribute('aria-pressed', lvl === 175 ? 'true' : 'false');
  }
  updateCompareIdolToggleUI();
  renderCompareView();
}

function updateCompareIdolToggleUI() {
  const pctEl = document.getElementById('compare-idol-pct');
  if (pctEl) {
    pctEl.textContent = `+${getCompareIdolMaxPercent()}%`;
  }
  const label = document.querySelector('label[for="compare-idol-buff-toggle"]');
  if (label) {
    label.classList.toggle('bg-sky-500/20', compareIdolBuff);
    label.classList.toggle('border-sky-500/50', compareIdolBuff);
    label.classList.toggle('text-sky-200', compareIdolBuff);
    label.classList.toggle('bg-[#090e1c]', !compareIdolBuff);
    label.classList.toggle('border-slate-800', !compareIdolBuff);
    label.classList.toggle('text-slate-300', !compareIdolBuff);
  }
}

function toggleCompareIdolBuff() {
  const cb = document.getElementById('compare-idol-buff-toggle');
  compareIdolBuff = cb ? cb.checked : !compareIdolBuff;
  updateCompareIdolToggleUI();
  renderCompareView();
}

function getCompareIdolMultiplier() {
  if (!compareIdolBuff) return 1;
  const pct = getCompareIdolMaxPercent();
  return 1 + pct / 100;
}

function setCompareUnit(slot, unitOrId) {
  let unit = null;
  if (typeof unitOrId === 'string') {
    unit = ALL_UNITS.find(u => u.id === unitOrId || u.name.toLowerCase() === unitOrId.toLowerCase()) || null;
  } else {
    unit = unitOrId;
  }

  if (slot === 'a') {
    compareUnitA = unit;
    const inputA = document.getElementById('compare-search-a');
    if (inputA) inputA.value = unit ? unit.name : '';
    const clearBtnA = document.getElementById('compare-clear-a');
    if (clearBtnA) clearBtnA.classList.toggle('hidden', !unit);
    hideCompareDropdown('a');
  } else if (slot === 'b') {
    compareUnitB = unit;
    const inputB = document.getElementById('compare-search-b');
    if (inputB) inputB.value = unit ? unit.name : '';
    const clearBtnB = document.getElementById('compare-clear-b');
    if (clearBtnB) clearBtnB.classList.toggle('hidden', !unit);
    hideCompareDropdown('b');
  }

  updateCompareUrl();
  renderCompareView();
}

function clearCompareSlot(slot) {
  setCompareUnit(slot, null);
}

function clearCompare() {
  compareUnitA = null;
  compareUnitB = null;
  const inputA = document.getElementById('compare-search-a');
  if (inputA) inputA.value = '';
  const inputB = document.getElementById('compare-search-b');
  if (inputB) inputB.value = '';
  const clearBtnA = document.getElementById('compare-clear-a');
  if (clearBtnA) clearBtnA.classList.add('hidden');
  const clearBtnB = document.getElementById('compare-clear-b');
  if (clearBtnB) clearBtnB.classList.add('hidden');
  updateCompareUrl();
  renderCompareView();
}

function swapCompareUnits() {
  const tmp = compareUnitA;
  compareUnitA = compareUnitB;
  compareUnitB = tmp;

  const inputA = document.getElementById('compare-search-a');
  if (inputA) inputA.value = compareUnitA ? compareUnitA.name : '';
  const inputB = document.getElementById('compare-search-b');
  if (inputB) inputB.value = compareUnitB ? compareUnitB.name : '';

  const clearBtnA = document.getElementById('compare-clear-a');
  if (clearBtnA) clearBtnA.classList.toggle('hidden', !compareUnitA);
  const clearBtnB = document.getElementById('compare-clear-b');
  if (clearBtnB) clearBtnB.classList.toggle('hidden', !compareUnitB);

  updateCompareUrl();
  renderCompareView();
}

function updateCompareUrl() {
  if (currentTab === 'compare') {
    if (compareUnitA && compareUnitB) {
      window.location.hash = `compare/${compareUnitA.id}/${compareUnitB.id}`;
    } else if (compareUnitA) {
      window.location.hash = `compare/${compareUnitA.id}`;
    } else {
      window.location.hash = 'compare';
    }
  }
}

function loadComparePreset(idA, idB) {
  const termA = idA.replace(/_/g, ' ').toLowerCase();
  const termB = idB.replace(/_/g, ' ').toLowerCase();
  const uA = ALL_UNITS.find(u => u.id === idA || u.id.toLowerCase() === idA.toLowerCase() || u.name.toLowerCase().includes(termA));
  const uB = ALL_UNITS.find(u => u.id === idB || u.id.toLowerCase() === idB.toLowerCase() || u.name.toLowerCase().includes(termB));
  if (uA) setCompareUnit('a', uA);
  if (uB) setCompareUnit('b', uB);
  switchTab('compare');
}

function startCompareWith(unitId) {
  const unit = ALL_UNITS.find(u => u.id === unitId || u.name.toLowerCase() === unitId.toLowerCase());
  if (!unit) return;

  if (!compareUnitA || compareUnitA.id === unit.id) {
    setCompareUnit('a', unit);
  } else if (!compareUnitB) {
    setCompareUnit('b', unit);
  } else {
    setCompareUnit('b', unit);
  }

  switchTab('compare');
  showToast(t('toast_added_to_compare').replace('{name}', unit.name));
}

function startCompareWithModalUnit() {
  if (currentModalUnit) {
    const id = currentModalUnit.id;
    closeUnitModal();
    startCompareWith(id);
  }
}

const _compareTimers = { a: null, b: null };
function handleCompareSearch(slot, immediate = false) {
  if (immediate) {
    if (_compareTimers[slot]) clearTimeout(_compareTimers[slot]);
    _doCompareSearch(slot);
    return;
  }
  if (_compareTimers[slot]) clearTimeout(_compareTimers[slot]);
  _compareTimers[slot] = setTimeout(() => _doCompareSearch(slot), 150);
}

function _doCompareSearch(slot) {
  const input = document.getElementById(`compare-search-${slot}`);
  const dropdown = document.getElementById(`compare-dropdown-${slot}`);
  if (!input || !dropdown) return;

  if (!ALL_UNITS || ALL_UNITS.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center italic">${t('loading_units')}</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  const q = input.value.trim().toLowerCase();
  const otherUnit = slot === 'a' ? compareUnitB : compareUnitA;

  const matches = ALL_UNITS.filter(u => {
    if (otherUnit && u.id === otherUnit.id) return false;
    if (!q) return u.star >= 6;
    return u.name.toLowerCase().includes(q) || (u.anime_origin || '').toLowerCase().includes(q);
  }).slice(0, 10);

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center italic">${t('no_units_found')}</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  dropdown.innerHTML = matches.map(u => `
    <div onclick="setCompareUnit('${slot}', '${u.id}')"
         class="px-3 py-2 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between border-b border-slate-800/60 last:border-0 transition-colors"
         role="option" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setCompareUnit('${slot}','${u.id}');}">
      <div class="flex items-center space-x-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-[#070b14] border border-slate-800 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
          <img src="${u.image || fallbackImg}" alt="" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-white truncate">${u.name}</div>
          <div class="text-[10px] text-slate-400 truncate">${u.anime_origin || (currentLang === 'fr' ? 'Personnage All Star' : 'All Star Character')}</div>
        </div>
      </div>
      <div class="flex items-center space-x-1.5 shrink-0">
        <span class="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded star-${u.star}-badge">${u.star}★</span>
        <span class="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-1 rounded">${translateTowerType(u.tower_type || 'Ground')}</span>
      </div>
    </div>
  `).join('');

  dropdown.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function hideCompareDropdown(slot) {
  const dropdown = document.getElementById(`compare-dropdown-${slot}`);
  if (dropdown) dropdown.classList.add('hidden');
}

// Global click listener to close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#compare-search-a') && !e.target.closest('#compare-dropdown-a')) {
    hideCompareDropdown('a');
  }
  if (!e.target.closest('#compare-search-b') && !e.target.closest('#compare-dropdown-b')) {
    hideCompareDropdown('b');
  }
});

function getUnitCompareStats(unit, at175, withIdol) {
  if (!unit) return null;
  const mult = (at175 ? LEVEL_175.damage : 1) * (withIdol ? getCompareIdolMultiplier() : 1);
  const rangeMult = at175 ? LEVEL_175.range : 1;
  const spaMult = at175 ? LEVEL_175.spa : 1;

  const baseDmg = unit.upgrades && unit.upgrades.length > 0 ? (unit.upgrades[0].damage || 0) : 0;
  const maxDmg = Math.round((unit.max_damage || baseDmg) * mult);
  const maxRange = Math.round(((unit.max_range || 0) * rangeMult) * 10) / 10;
  const minSpa = Math.round(((unit.min_spa || 0) * spaMult) * 10) / 10;
  const maxDps = (unit.max_dps && unit.max_dps > 0) ? Math.round(unit.max_dps * mult) : ((maxDmg && minSpa > 0) ? Math.round(maxDmg / minSpa) : 0);
  const deployCost = unit.deployment_cost || 0;
  const totalCost = unit.total_cost || 0;
  const costPerDps = (totalCost > 0 && maxDps > 0) ? Math.round((totalCost / maxDps) * 10) / 10 : 0;
  const upgradeCount = unit.upgrades ? unit.upgrades.length : 0;

  return {
    unit,
    baseDmg: Math.round(baseDmg * mult),
    maxDmg,
    maxDps,
    maxRange,
    minSpa,
    deployCost,
    totalCost,
    costPerDps,
    upgradeCount
  };
}

function evalMetric(valA, valB, higherIsBetter) {
  if (valA === valB) {
    return { winner: 'tie', diffText: t('tie'), pctA: 50, pctB: 50, pctDiffText: '0%' };
  }
  const aWins = higherIsBetter ? valA > valB : valA < valB;
  const winner = aWins ? 'a' : 'b';

  let pctA = 50, pctB = 50;
  if (higherIsBetter) {
    const sum = valA + valB;
    if (sum > 0) {
      pctA = Math.round((valA / sum) * 100);
      pctB = 100 - pctA;
    }
  } else {
    const invA = 1 / (valA || 0.001);
    const invB = 1 / (valB || 0.001);
    const sumInv = invA + invB;
    if (sumInv > 0) {
      pctA = Math.round((invA / sumInv) * 100);
      pctB = 100 - pctA;
    }
  }

  const big = Math.max(valA, valB);
  const small = Math.min(valA, valB);
  const pctDiff = small > 0 ? Math.round(((big - small) / small) * 100) : 100;
  const diffVal = Math.abs(valA - valB);

  return {
    winner,
    pctA,
    pctB,
    diffText: `${aWins ? '+' : '-'}${formatCompactNumber(diffVal)}`,
    pctDiffText: `+${pctDiff}%`
  };
}

function generateTacticalVerdict(sA, sB) {
  const uA = sA.unit;
  const uB = sB.unit;

  const dpsEval = evalMetric(sA.maxDps, sB.maxDps, true);
  const spaEval = evalMetric(sA.minSpa, sB.minSpa, false);
  const rangeEval = evalMetric(sA.maxRange, sB.maxRange, true);
  const costEval = evalMetric(sA.costPerDps, sB.costPerDps, false);

  const tieText = t('tie');
  let dpsLeader = dpsEval.winner === 'a' ? uA.name : (dpsEval.winner === 'b' ? uB.name : tieText);
  let spaLeader = spaEval.winner === 'a' ? uA.name : (spaEval.winner === 'b' ? uB.name : tieText);
  let rangeLeader = rangeEval.winner === 'a' ? uA.name : (rangeEval.winner === 'b' ? uB.name : tieText);
  let costLeader = costEval.winner === 'a' ? uA.name : (costEval.winner === 'b' ? uB.name : tieText);

  let recommendation = "";
  if (currentLang === 'en') {
    if (dpsEval.winner === 'a') {
      recommendation = `<strong>${uA.name}</strong> stands out as the primary choice for late waves and <em>Infinite Mode</em> thanks to its massive DPS advantage (+${dpsEval.pctDiffText}).`;
      if (spaEval.winner === 'b' || costEval.winner === 'b') {
        recommendation += ` However, <strong>${uB.name}</strong> remains formidable in <em>Story / Early Game</em> thanks to higher attack rate or a more accessible initial cost.`;
      }
    } else if (dpsEval.winner === 'b') {
      recommendation = `<strong>${uB.name}</strong> widely dominates the matchup in raw damage (+${dpsEval.pctDiffText} DPS), ideal for <em>Infinite Mode</em>.`;
      if (spaEval.winner === 'a' || costEval.winner === 'a') {
        recommendation += ` <strong>${uA.name}</strong> compensates with better cost efficiency or faster attack rate in support.`;
      }
    } else {
      recommendation = `Both units feature equivalent DPS. The choice will come down to range (${rangeLeader}), placement type (${translateTowerType(uA.tower_type)} vs ${translateTowerType(uB.tower_type)}), and passive abilities.`;
    }
  } else {
    if (dpsEval.winner === 'a') {
      recommendation = `<strong>${uA.name}</strong> s'impose comme le choix prioritaire pour les vagues avancées et le <em>Mode Infini</em> grâce à son avantage massif de DPS (+${dpsEval.pctDiffText}).`;
      if (spaEval.winner === 'b' || costEval.winner === 'b') {
        recommendation += ` Cependant, <strong>${uB.name}</strong> reste redoutable en <em>Histoire / Début de partie</em> grâce à une cadence supérieure ou un investissement initial plus accessible.`;
      }
    } else if (dpsEval.winner === 'b') {
      recommendation = `<strong>${uB.name}</strong> domine largement le duel en puissance brute (+${dpsEval.pctDiffText} DPS), idéale pour le <em>Mode Infini</em>.`;
      if (spaEval.winner === 'a' || costEval.winner === 'a') {
        recommendation += ` <strong>${uA.name}</strong> compense avec une meilleure rentabilité ou cadence d'attaque en soutien.`;
      }
    } else {
      recommendation = `Les deux unités affichent un DPS équivalent. Le choix se fera sur la portée (${rangeLeader}), le type de placement (${translateTowerType(uA.tower_type)} vs ${translateTowerType(uB.tower_type)}) et leurs aptitudes passives.`;
    }
  }

  return `
    <div class="tactical-card p-4 rounded-xl border border-slate-800/80 bg-[#0a0f1d] space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <div class="flex items-center gap-2">
          <i data-lucide="award" class="w-4 h-4 text-amber-300"></i>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">${t('verdict_title')}</h3>
        </div>
        <span class="text-[10px] text-slate-400 font-medium">${t('verdict_subtitle')}</span>
      </div>

      <!-- 4 pillars summary grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_dps')}</span>
          <span class="font-bold ${dpsEval.winner === 'a' ? 'text-sky-300' : (dpsEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${dpsLeader}">${dpsLeader}</span>
          <span class="text-[9px] text-slate-400">${dpsEval.pctDiffText} ${t('verdict_diff')}</span>
        </div>
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_spa')}</span>
          <span class="font-bold ${spaEval.winner === 'a' ? 'text-sky-300' : (spaEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${spaLeader}">${spaLeader}</span>
          <span class="text-[9px] text-slate-400">${spaEval.pctDiffText} ${t('verdict_faster')}</span>
        </div>
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_range')}</span>
          <span class="font-bold ${rangeEval.winner === 'a' ? 'text-sky-300' : (rangeEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${rangeLeader}">${rangeLeader}</span>
          <span class="text-[9px] text-slate-400">${rangeEval.pctDiffText} ${t('verdict_radius')}</span>
        </div>
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_cost')}</span>
          <span class="font-bold ${costEval.winner === 'a' ? 'text-sky-300' : (costEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${costLeader}">${costLeader}</span>
          <span class="text-[9px] text-slate-400">${t('verdict_ratio')}</span>
        </div>
      </div>

      <!-- Strategic recommendation paragraph -->
      <div class="text-xs text-slate-300 leading-relaxed bg-[#0f1629]/90 p-3 rounded-lg border border-slate-800/80">
        ${recommendation}
      </div>
    </div>
  `;
}

function renderCompareView() {
  const container = document.getElementById('compare-display-area');
  if (!container) return;

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  const at175 = compareLevelView === 175;
  const withIdol = compareIdolBuff;

  // Case 1: Empty state (0 or only 1 unit selected)
  if (!compareUnitA || !compareUnitB) {
    container.innerHTML = `
      <div class="tactical-card p-8 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 text-center max-w-xl mx-auto space-y-4 my-6">
        <div class="w-14 h-14 rounded-2xl bg-[#090e1c] border border-slate-800 flex items-center justify-center mx-auto text-sky-400 shadow-md">
          <i data-lucide="arrow-left-right" class="w-7 h-7" stroke-width="2"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-white">${t('compare_empty_title')}</h3>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed text-pretty">
            ${t('compare_empty_desc')}
          </p>
        </div>

        <div class="pt-2 flex items-center justify-center gap-2">
          ${compareUnitA ? `
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070b14] border border-sky-500/40 text-xs">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span>
              <span class="text-white font-bold">${compareUnitA.name}</span>
              <span class="text-sky-300 font-mono-num font-bold text-[10px]">${compareUnitA.star}★</span>
              <span class="text-slate-400 italic text-[11px]">${t('compare_choose_second')}</span>
            </div>
          ` : `
            <span class="text-xs text-slate-500 italic">${t('compare_no_unit')}</span>
          `}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Case 2: Full comparison with both units selected
  const sA = getUnitCompareStats(compareUnitA, at175, withIdol);
  const sB = getUnitCompareStats(compareUnitB, at175, withIdol);

  // Stats evaluation
  const metrics = [
    { label: t('metric_dmg_max'), key: 'maxDmg', valA: sA.maxDmg, valB: sB.maxDmg, higherBetter: true, format: v => v.toLocaleString(), isDps: false },
    { label: t('metric_dps_max'), key: 'maxDps', valA: sA.maxDps, valB: sB.maxDps, higherBetter: true, format: v => v.toLocaleString(), isDps: true },
    { label: t('metric_range'), key: 'maxRange', valA: sA.maxRange, valB: sB.maxRange, higherBetter: true, format: v => v, isDps: false },
    { label: t('metric_spa'), key: 'minSpa', valA: sA.minSpa, valB: sB.minSpa, higherBetter: false, format: v => v + 's', isDps: false, note: t('note_spa') },
    { label: t('metric_deploy_cost'), key: 'deployCost', valA: sA.deployCost, valB: sB.deployCost, higherBetter: false, format: v => '$' + v.toLocaleString(), isDps: false, note: t('note_deploy') },
    { label: t('metric_total_cost'), key: 'totalCost', valA: sA.totalCost, valB: sB.totalCost, higherBetter: false, format: v => '$' + v.toLocaleString(), isDps: false, note: t('note_total') },
    { label: t('metric_cost_per_dps'), key: 'costPerDps', valA: sA.costPerDps, valB: sB.costPerDps, higherBetter: false, format: v => '$' + v, isDps: false, note: t('note_efficiency') },
    { label: t('metric_upgrades_count'), key: 'upgradeCount', valA: sA.upgradeCount, valB: sB.upgradeCount, higherBetter: false, format: v => `${v} ${t('tiers_word')}`, isDps: false, note: t('note_upgrades') }
  ];

  container.innerHTML = `
    <!-- 1. Versus Identity Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      
      <!-- Card A -->
      <div class="tactical-card p-4 rounded-xl border border-sky-500/40 bg-[#0f1629]/95 flex flex-col justify-between space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${compareUnitA.image || fallbackImg}" alt="${compareUnitA.name}" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold star-${compareUnitA.star}-badge shadow-sm">${compareUnitA.star}★</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded">${translateTowerType(compareUnitA.tower_type || 'Ground')}</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 rounded">${translateAttackType(compareUnitA.attack_type || 'AoE')}</span>
              </div>
              <h3 class="font-bold text-sm sm:text-base text-white truncate mt-1 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
                <span>${compareUnitA.name}</span>
              </h3>
              <p class="text-[11px] text-slate-400 truncate">${compareUnitA.anime_origin || (currentLang === 'fr' ? 'Personnage All Star' : 'All Star Character')}</p>
            </div>
          </div>
          <button onclick="openUnitModal('${compareUnitA.id}')" aria-label="${t('modal_btn_compare_aria')} (${compareUnitA.name})" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale transition-colors shrink-0">
            ${t('btn_card')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 font-mono-num text-[11px]">
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dps_max_a')}</span>
            <span class="font-bold text-sky-300 text-xs">${sA.maxDps.toLocaleString()}</span>
          </div>
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dmg_max_a')}</span>
            <span class="font-bold text-slate-100 text-xs">${sA.maxDmg.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Card B -->
      <div class="tactical-card p-4 rounded-xl border border-amber-500/40 bg-[#0f1629]/95 flex flex-col justify-between space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${compareUnitB.image || fallbackImg}" alt="${compareUnitB.name}" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold star-${compareUnitB.star}-badge shadow-sm">${compareUnitB.star}★</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded">${translateTowerType(compareUnitB.tower_type || 'Ground')}</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 rounded">${translateAttackType(compareUnitB.attack_type || 'AoE')}</span>
              </div>
              <h3 class="font-bold text-sm sm:text-base text-white truncate mt-1 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                <span>${compareUnitB.name}</span>
              </h3>
              <p class="text-[11px] text-slate-400 truncate">${compareUnitB.anime_origin || (currentLang === 'fr' ? 'Personnage All Star' : 'All Star Character')}</p>
            </div>
          </div>
          <button onclick="openUnitModal('${compareUnitB.id}')" aria-label="${t('modal_btn_compare_aria')} (${compareUnitB.name})" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale transition-colors shrink-0">
            ${t('btn_card')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 font-mono-num text-[11px]">
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dps_max_b')}</span>
            <span class="font-bold text-amber-300 text-xs">${sB.maxDps.toLocaleString()}</span>
          </div>
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dmg_max_b')}</span>
            <span class="font-bold text-slate-100 text-xs">${sB.maxDmg.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 2. Tactical Verdict Banner -->
    ${generateTacticalVerdict(sA, sB)}

    <!-- 3. Direct Metrics Comparison Table with Gauges -->
    <div class="tactical-card rounded-xl border border-slate-800/80 bg-[#0f1629]/95 overflow-hidden">
      <div class="p-3.5 bg-[#141d33] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <i data-lucide="sliders-horizontal" class="w-4 h-4 text-sky-400"></i>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">${t('compare_table_title')}</h3>
        </div>
        <div class="flex items-center gap-2 text-[11px] font-mono-num flex-wrap">
          <span class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300 font-bold">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>A : ${compareUnitA.name}</span>
          </span>
          <span class="text-slate-500 font-sans">vs</span>
          <span class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>B : ${compareUnitB.name}</span>
          </span>
        </div>
      </div>

      <div class="divide-y divide-slate-800/70">
        ${metrics.map(m => {
          const ev = evalMetric(m.valA, m.valB, m.higherBetter);
          const isAWin = ev.winner === 'a';
          const isBWin = ev.winner === 'b';
          const winnerName = isAWin ? compareUnitA.name : compareUnitB.name;
          return `
            <div class="p-3.5 hover:bg-slate-800/30 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span>${m.label}</span>
                  ${m.note ? `<span class="text-[10px] text-slate-400 font-normal font-sans">(${m.note})</span>` : ''}
                </span>
                
                <div class="flex items-center gap-2 text-xs font-mono-num flex-wrap">
                  <span class="px-2 py-0.5 rounded text-[11px] ${isAWin ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm' : 'text-slate-300 bg-slate-900/60 border border-slate-800'}">
                    <span class="text-[9px] text-sky-400/80 mr-1 font-sans font-semibold">A:</span>${m.format(m.valA)}
                  </span>
                  <span class="text-[10px] text-slate-500">vs</span>
                  <span class="px-2 py-0.5 rounded text-[11px] ${isBWin ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm' : 'text-slate-300 bg-slate-900/60 border border-slate-800'}">
                    <span class="text-[9px] text-amber-400/80 mr-1 font-sans font-semibold">B:</span>${m.format(m.valB)}
                  </span>
                  ${ev.winner !== 'tie' ? `
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isAWin ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                      ${isAWin ? 'A' : 'B'} +${ev.pctDiffText.replace('+', '')} (${winnerName})
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      ${t('tie')}
                    </span>
                  `}
                </div>
              </div>

              <!-- Relative Gauge Bar -->
              <div class="space-y-1 mt-1.5">
                <div class="compare-gauge-track flex">
                  <div class="compare-gauge-fill-a" style="width: ${ev.pctA}%" title="${compareUnitA.name}: ${ev.pctA}%"></div>
                  <div class="compare-gauge-fill-b" style="width: ${ev.pctB}%" title="${compareUnitB.name}: ${ev.pctB}%"></div>
                </div>
                <div class="flex justify-between items-center text-[9px] font-mono-num text-slate-400">
                  <span class="${isAWin ? 'text-sky-300 font-bold' : ''}">A (${compareUnitA.name}) : ${ev.pctA}%</span>
                  <span class="${isBWin ? 'text-amber-300 font-bold' : ''}">B (${compareUnitB.name}) : ${ev.pctB}%</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 4. Special Abilities Comparison -->
    <div class="tactical-card p-4 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
          <span>${t('compare_abilities_title')}</span>
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Abilities Unit A -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>${compareUnitA.name}</span>
            <span class="text-slate-500 font-normal">(${currentLang === 'fr' ? `${(compareUnitA.abilities || []).length} capacité${(compareUnitA.abilities || []).length > 1 ? 's' : ''}` : `${(compareUnitA.abilities || []).length} abilit${(compareUnitA.abilities || []).length > 1 ? 'ies' : 'y'}`})</span>
          </div>
          ${(compareUnitA.abilities && compareUnitA.abilities.length > 0) ? `
            <div class="space-y-2">
              ${compareUnitA.abilities.map(ab => `
                <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <strong class="text-white">${translateAbilityName(ab.name)}</strong>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300">${translateUnlock(ab.type) || (ab.type ? ab.type : (currentLang === 'fr' ? 'Capacité' : 'Ability'))}</span>
                  </div>
                  <p class="text-[11px] text-slate-300 leading-relaxed">${translateAbilityDescription(stripWikiMarkup(ab.description))}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-3 text-xs text-slate-500 italic bg-[#090e1c] rounded-lg border border-slate-800/60">
              ${t('no_abilities_documented')}
            </div>
          `}
        </div>

        <!-- Abilities Unit B -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>${compareUnitB.name}</span>
            <span class="text-slate-500 font-normal">(${currentLang === 'fr' ? `${(compareUnitB.abilities || []).length} capacité${(compareUnitB.abilities || []).length > 1 ? 's' : ''}` : `${(compareUnitB.abilities || []).length} abilit${(compareUnitB.abilities || []).length > 1 ? 'ies' : 'y'}`})</span>
          </div>
          ${(compareUnitB.abilities && compareUnitB.abilities.length > 0) ? `
            <div class="space-y-2">
              ${compareUnitB.abilities.map(ab => `
                <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <strong class="text-white">${translateAbilityName(ab.name)}</strong>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300">${translateUnlock(ab.type) || (ab.type ? ab.type : (currentLang === 'fr' ? 'Capacité' : 'Ability'))}</span>
                  </div>
                  <p class="text-[11px] text-slate-300 leading-relaxed">${translateAbilityDescription(stripWikiMarkup(ab.description))}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-3 text-xs text-slate-500 italic bg-[#090e1c] rounded-lg border border-slate-800/60">
              ${t('no_abilities_documented')}
            </div>
          `}
        </div>

      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
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

// ==========================================
// EXPOSITION GLOBALE EXPLICITE (WINDOW)
// ==========================================
// Garantit que toutes les fonctions appelées par des attributs inline HTML
// sont toujours accessibles sur window, quel que soit le contexte ou le mode de chargement.
if (typeof window !== 'undefined') {
  // Navigation & Vues
  window.switchTab = switchTab;
  window.updateNavActiveState = updateNavActiveState;
  window.toggleMobileMenu = toggleMobileMenu;
  window.switchTabAndCloseDrawer = switchTabAndCloseDrawer;
  window.setViewMode = setViewMode;
  window.setStarFilter = setStarFilter;
  window.clearAllFilters = clearAllFilters;
  window.sortTableBy = sortTableBy;
  window.loadMoreUnits = loadMoreUnits;

  // Modale Unité & Détails
  window.openUnitModal = openUnitModal;
  window.openUnitByName = openUnitByName;
  window.closeUnitModal = closeUnitModal;
  window.togglePreEvos = togglePreEvos;
  window.toggleAbilities = toggleAbilities;
  window.toggleUpgradeAbility = toggleUpgradeAbility;
  window.scrollToAbilitiesSection = scrollToAbilitiesSection;
  window.setLevelView = setLevelView;
  window.toggleIdolBuff = toggleIdolBuff;

  // Deck / Team Builder
  window.clearTeam = clearTeam;
  window.addUnitToTeam = addUnitToTeam;
  window.addCurrentModalUnitToTeam = addCurrentModalUnitToTeam;
  window.removeUnitFromTeam = removeUnitFromTeam;
  window.renderTeamPicker = renderTeamPicker;
  window.focusTeamSearch = focusTeamSearch;

  // Comparateur Tactique
  window.setCompareLevel = setCompareLevel;
  window.toggleCompareIdolBuff = toggleCompareIdolBuff;
  window.setCompareUnit = setCompareUnit;
  window.clearCompareSlot = clearCompareSlot;
  window.clearCompare = clearCompare;
  window.swapCompareUnits = swapCompareUnits;
  window.loadComparePreset = loadComparePreset;
  window.startCompareWith = startCompareWith;
  window.startCompareWithModalUnit = startCompareWithModalUnit;
  window.handleCompareSearch = handleCompareSearch;
  window.hideCompareDropdown = hideCompareDropdown;
  window.renderCompareView = renderCompareView;

  // Codes & Orbes & Utilitaires
  window.toggleExpiredCodes = toggleExpiredCodes;
  window.filterExpiredCodes = filterExpiredCodes;
  window.copyCodeText = copyCodeText;
  window.copyLatestCode = copyLatestCode;
  window.filterOrbs = filterOrbs;
  window.renderOrbs = renderOrbs;
  window.renderOrbCard = renderOrbCard;
  window.showToast = showToast;
  window.initSafeAds = initSafeAds;
  window.focusMainSearch = focusMainSearch;
  window.openAdsNoticeModal = openAdsNoticeModal;
  window.closeAdsNoticeModal = closeAdsNoticeModal;

  // I18N Bilingue (FR / EN)
  window.I18N = I18N;
  window.setLanguage = setLanguage;
  window.t = t;
  window.currentLang = currentLang;
  window.translateTowerType = translateTowerType;
  window.translateAttackType = translateAttackType;
  window.translateAbilityName = translateAbilityName;
  window.translateUnlock = translateUnlock;
  window.translateObtain = translateObtain;
  window.translateOverview = translateOverview;
  window.translateAbilityDescription = translateAbilityDescription;
  window.translateUpgradeEffect = translateUpgradeEffect;
  window.translateReward = translateReward;
  window.translateOrbEffect = translateOrbEffect;
}
